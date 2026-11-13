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
const MAX_TIME = 600000; // a round still going after 10 minutes counts as stalled
const CHASE_NEAR = 6; // (a beetle counts as chased once a head is this near: fixed, not BEETLE_FEAR, so a change to how soon beetles take fright is measured on the same chases (2w))
const GOLD_NEAR = 5; // (2z: a golden apple counts as contested when another head is this near as it's eaten)
const gameFiles = require('./game-files.js');
const GAME_FILES = gameFiles(ROOT); // (tuning.js, the AI's files, the engine's: index.html's order)

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

const seeded = require('./seeded.js'); // (mulberry32; its state() is where it's got to)

// The game's files (texts, in GAME_FILES order) in a fresh context, with our
// own Math.random. Math.random draws from `rng`, which can be reseeded for
// every round. versus: another copy's AI (--versus: its files as one script,
// gameFiles.apart), loaded beside this one's in the same context; the snakes
// whose memory is in `theirs` decide with it, the rest with this one's.
let rng = Math.random;
const theirs = new WeakSet();
let theirKeys = null; // (the other AI's personality keys)
function loadGame(texts, versus = null) {
  const M = Object.create(Math);
  M.random = () => rng();
  const ctx = vm.createContext({ window: {}, console, Math: M });
  let other = null;
  GAME_FILES.forEach((f, i) => {
    if (versus && f === GAME_FILES.find(gameFiles.ai)) { vm.runInContext(versus, ctx, { filename: 'versus/ai' }); other = ctx.window.SnakeAI; }
    if (other && f === GAME_FILES.find(gameFiles.engine)) {
      const mine = ctx.window.SnakeAI, keyOf = new Map(Object.entries(mine.PERSONAS).map(([k, p]) => [p, k]));
      ctx.window.SnakeAI = { ...mine, decide: (view, brain, memory, draw) => theirs.has(memory) ? other.decide(view, other.PERSONAS[keyOf.get(brain)], memory, draw) : mine.decide(view, brain, memory, draw) };
      theirKeys = new Set(Object.keys(other.PERSONAS));
    }
    vm.runInContext(texts[i], ctx, { filename: f });
  });
  return { E: ctx.window.SnakeEngine, T: ctx.window.TUNING, ctx };
}
