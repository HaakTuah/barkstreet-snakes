#!/usr/bin/env node
// Nerve at a contested apple (docs/PROGRESS.md): how often each persona
// wins an apple that a rival's head is right beside, and how often going
// for it ends in a head-on.
//
//   node tools/dev/nerve/census.js [rounds] [--seed N] [--root DIR]
//
// A contested apple: an apple (green or golden) I could reach
// while I still can't see where a rival went (within 1 + `age` cells), next
// to a rival's head as I read it now (seen `age` ticks ago, gone straight
// on since, as the AI reads it), so a head-on if we both go for it. Counted
// once per snake and apple. Within the ticks it takes me to get there and
// one more, I ate it (won), or crashed head-on (a bounce, segments lost and
// a stun), or a rival ate it, or none of these; and within 20 ticks, who ate
// it in the end. Every snake's AI, in a field of the same copy's AIs, as
// simulate.js plays it.
const fs = require('fs'), path = require('path'), vm = require('vm');
const arg = (k, d) => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d;
const ROUNDS = Number(process.argv[2]) || 100, SEED = Number(arg('--seed', 1)), ROOT = arg('--root', path.join(__dirname, '../../..'));
let state = 0;
const rng = () => { state = (state + 0x6d2b79f5) >>> 0; let t = state; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const M = Object.create(Math); M.random = rng;
const ctx = vm.createContext({ window: {}, console, Math: M });
for (const f of ['tuning.js', 'ai.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const AI = ctx.window.SnakeAI;
const keyOf = new Map(Object.entries(AI.PERSONAS).map(([k, p]) => [p, k])), mineKey = new WeakMap();
const per = {}, row = k => (per[k] ||= { ate: 0, headOns: 0, decisions: 0, apples: 0, won: 0, headOn: 0, lost: 0, mine: 0, theirs: 0, nobody: 0 });
let open = [], seen = new Set();
const decide = AI.decide;
ctx.window.SnakeAI = { ...AI, decide: (view, brain, memory) => {
  const key = keyOf.get(brain) || mineKey.get(memory) || '?';
  const d = decide(view, brain, memory), r = row(key);
  r.decisions++;
  const h = view.me.body[0], dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  for (const f of view.food) {
    if ((f.kind !== 'food' && f.kind !== 'golden') || dist(f, h) > 1 + (view.age || 0)) continue;
    const now = o => ({ x: o.body[0].x + (view.age || 0) * o.dir.x, y: o.body[0].y + (view.age || 0) * o.dir.y }); // (as I read it: gone straight on since)
    if (!view.others.some(o => dist(now(o), f) === 1 && !(o.stun > 1))) continue;
    const id = `${view.me.id} ${f.x} ${f.y}`;
    if (seen.has(id)) continue;
    seen.add(id); r.apples++;
    open.push({ r, id: view.me.id, x: f.x, y: f.y, by: view.tick + dist(f, h) + 1, until: view.tick + 20, done: false });
  }
  return d;
} };
vm.runInContext(fs.readFileSync(path.join(ROOT, 'engine.js'), 'utf8'), ctx, { filename: 'engine.js' }); // (after: it takes the AI as it finds it)
const E = ctx.window.SnakeEngine;
let rounds = 0, ticks = 0;
for (let n = 0; n < ROUNDS; n++) {
  state = (SEED + n * 7919) >>> 0;
  const g = E.createGame({ withPlayer: false });
  for (const s of g.snakes) mineKey.set(s.memory, s.personaKey);
  rounds++;
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < 600000) {
    E.step(g);
    ticks++;
    for (const w of open) {
      if (!w.done && g.tick <= w.by && g.events.some(e => e.type === 'crash' && e.snake.id === w.id && /head-on/.test(e.cause))) { w.r.headOn++; w.done = true; }
    }
    for (const e of g.events) {
      const k = e.snake && e.snake.personaKey;
      if (e.type === 'eat' && (e.kind === 'food' || e.kind === 'golden')) row(k).ate++;
      if (e.type === 'crash' && /head-on/.test(e.cause)) row(k).headOns++;
    }
    for (const e of g.events) if (e.type === 'eat') open = open.filter(w => {
      if (w.x !== e.x || w.y !== e.y) return true;
      const me = e.snake.id === w.id;
      if (!w.done) { w.r[me ? 'won' : 'lost']++; w.done = true; }
      w.r[me ? 'mine' : 'theirs']++;
      return false;
    });
    open = open.filter(w => w.until >= g.tick || (w.r.nobody++, false));
    if (g.tick % 30 === 0) seen = new Set(open.map(w => `${w.id} ${w.x} ${w.y}`)); // (an apple long gone: its cell may hold a new one)
  }
  open = []; seen = new Set();
}
const pc = (a, b) => (100 * a / Math.max(1, b)).toFixed(0).padStart(5) + '%';
console.log(`${rounds} rounds, ${ticks} ticks (seed ${SEED})`);
console.log('persona       decisions  contested /1000   by then: won head-on rival   in 20 ticks: me  rival nobody   all apples, head-ons /1000');
const line = (k, r) => console.log(`${k.padEnd(12)} ${String(r.decisions).padStart(10)} ${String(r.apples).padStart(9)} ${(1000 * r.apples / r.decisions).toFixed(1).padStart(5)}   ${pc(r.won, r.apples)} ${pc(r.headOn, r.apples)} ${pc(r.lost, r.apples)}   ${pc(r.mine, r.apples)} ${pc(r.theirs, r.apples)} ${pc(r.nobody, r.apples)}   ${(1000 * r.ate / r.decisions).toFixed(1).padStart(6)} ${(1000 * r.headOns / r.decisions).toFixed(2).padStart(6)}`);
const tot = { ate: 0, headOns: 0, decisions: 0, apples: 0, won: 0, headOn: 0, lost: 0, mine: 0, theirs: 0, nobody: 0 };
for (const [k, r] of Object.entries(per).sort((a, b) => a[0] < b[0] ? -1 : 1)) { for (const f in tot) tot[f] += r[f]; line(k, r); }
line('all', tot);
