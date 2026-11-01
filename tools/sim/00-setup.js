const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// (Workers don't see the command line, so the root travels with each job.)
const argRoot = process.argv.indexOf('--root');
const ROOT = isMainThread ? (argRoot > 0 ? path.resolve(process.argv[argRoot + 1]) : path.join(__dirname, '..')) : workerData.root;
const MAX_TIME = 600000;
const CHASE_NEAR = 6; // (a beetle counts as chased once a head is this near: fixed, not BEETLE_FEAR, so a change to how soon beetles take fright is measured on the same chases (2w)) // a round still going after 10 minutes counts as stalled
const GAME_FILES = ['tuning.js', 'ai.js', 'engine.js'];

// A CommonJS file run from its text, as if required from where it lies: how
// a core runs this file and the state store, as they were read for the key.
function fromText(text, file) {
  const mod = { exports: {} };
  vm.compileFunction(text.replace(/^#!.*/, ''), ['exports', 'require', 'module', '__filename', '__dirname'], { filename: file })
    .call(mod.exports, mod.exports, require('module').createRequire(file), mod, file, path.dirname(file));
  return mod.exports;
}
// What a core starts with: this file's text as the run began (not as the file
// is by then), through fromText.
const BOOT = `const vm = require('vm'), path = require('path'), { workerData } = require('worker_threads');
(${fromText})(workerData.self, workerData.selfFile);`;

// mulberry32: a small, fast seeded random number generator. (state(): where
// it's got to; seeded(that) goes on from there.)
function seeded(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.state = () => a;
  return next;
}

// The game's files (texts, in GAME_FILES order) in a fresh context, with our
// own Math.random. Math.random draws from `rng`, which can be reseeded for
// every round. versus: another ai.js's text (--versus), loaded beside this
// one's in the same context; the snakes whose memory is in `theirs` decide
// with it, the rest with this one's.
let rng = Math.random;
const theirs = new WeakSet();
let theirKeys = null; // (the other ai.js's personality keys)
function loadGame(texts, versus = null) {
  const M = Object.create(Math);
  M.random = () => rng();
  const ctx = vm.createContext({ window: {}, console, Math: M });
  const run = f => vm.runInContext(texts[GAME_FILES.indexOf(f)], ctx, { filename: f });
  run('tuning.js');
  let other = null;
  if (versus) { vm.runInContext(versus, ctx, { filename: 'versus/ai.js' }); other = ctx.window.SnakeAI; }
  run('ai.js');
  if (other) {
    const mine = ctx.window.SnakeAI, keyOf = new Map(Object.entries(mine.PERSONAS).map(([k, p]) => [p, k]));
    ctx.window.SnakeAI = { ...mine, decide: (view, brain, memory) => theirs.has(memory) ? other.decide(view, other.PERSONAS[keyOf.get(brain)], memory) : mine.decide(view, brain, memory) };
    theirKeys = new Set(Object.keys(other.PERSONAS));
  }
  run('engine.js');
  return { E: ctx.window.SnakeEngine, T: ctx.window.TUNING, ctx };
}
