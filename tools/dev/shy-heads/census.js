#!/usr/bin/env node
// Shy of heads ("Rivals too shy of heads", docs/PROGRESS.md): how often a
// snake swerves away from a cell because a rival's head is near, and whether
// that cell was in fact dangerous.
//
//   node tools/dev/shy-heads/census.js [rounds] [--seed N] [--root DIR]
//
// At every decision the same view is also given to a copy of the AI with no
// fear of heads (`headRisk` 0; its zone fear stays), with the same memory and
// random numbers, and nothing it does is kept. Where the two first moves
// differ, the snake swerved. What a rival does on the next tick was decided
// on a view at least a tick old, so it doesn't depend on my move: the
// fearless move's cell is checked against where every rival's head really
// went (a head-on: the same cell, or the two heads swapping), and whether a
// rival's body was in it (a crash into it). Also counted: the snake's own
// head-ons, the food the fearless move was heading for (an apple closer by
// that move than by the one made, within 8 cells) and who ate it within 20
// ticks.
const fs = require('fs'), path = require('path'), vm = require('vm');
const arg = (k, d) => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d;
const SHOW = Number(arg('--show', 0)); let shown = 0;
const ROUNDS = Number(process.argv[2]) || 100, SEED = Number(arg('--seed', 1)), ROOT = arg('--root', path.join(__dirname, '../../..'));
let state = 0;
const rng = () => { state = (state + 0x6d2b79f5) >>> 0; let t = state; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const M = Object.create(Math); M.random = rng;
const load = (patch) => {
  const c = vm.createContext({ window: {}, console, Math: M });
  for (const f of ['tuning.js', 'ai.js']) {
    let src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (f === 'ai.js' && patch) { const n = src.length; src = patch(src); if (src.length === n) throw new Error('patch missed'); }
    vm.runInContext(src, c, { filename: f });
  }
  return c;
};
const ctx = load(null);
const bold = load(src => src.replace(/const strike = stunLeft\(o\) > 1 \? 0 : [^;]*;/, 'const strike = 0;')).window.SnakeAI;
const AI = ctx.window.SnakeAI, keyOf = new Map(Object.entries(AI.PERSONAS).map(([k, p]) => [p, k]));
const mineKey = new WeakMap();
const per = {}, row = k => (per[k] ||= { decisions: 0, swerves: 0, near: 0, headOn: 0, crash: 0, safe: 0, aim: 0, mine: 0, theirs: 0, nobody: 0 });
let pending = [], foodWatch = [];
let headOns = 0, rounds = 0, ticks = 0;
const decide = AI.decide;
ctx.window.SnakeAI = { ...AI, decide: (view, brain, memory) => {
  const key = keyOf.get(brain) || mineKey.get(memory) || '?';
  const s0 = state, mem = structuredClone(memory);
  const b = bold.decide(view, bold.PERSONAS[key] || brain, mem);
  state = s0;
  const d = decide(view, brain, memory);
  const r = row(key);
  r.decisions++;
  if (b && d && (b.x !== d.x || b.y !== d.y)) {
    r.swerves++;
    const h = view.me.body[0], c = { x: h.x + b.x, y: h.y + b.y }, mine = { x: h.x + d.x, y: h.y + d.y };
    // (beside a rival's head as seen, or as it would be had it gone straight since)
    const near = view.others.some(o => Math.abs(o.body[0].x - c.x) + Math.abs(o.body[0].y - c.y) <= 1 + (view.age || 0));
    if (near) r.near++;
    pending.push({ r, id: view.me.id, c, h });
    if (shown < SHOW) { shown++; show(view, key, d, b); }
    const dist = (f, p) => Math.abs(f.x - p.x) + Math.abs(f.y - p.y);
    const aim = view.food.filter(f => f.kind !== 'mushroom' && dist(f, c) <= 8 && dist(f, c) < dist(f, mine)).sort((f, g) => dist(f, c) - dist(g, c))[0];
    if (aim) { r.aim++; foodWatch.push({ r, id: view.me.id, x: aim.x, y: aim.y, until: view.tick + 20 }); }
  }
  return d;
} };
// A swerve, drawn round my head: me (M, my head @), rivals (a, b, c; their
// heads as seen A, B, C), food (*), the move made (+) and the fearless one (!).
function show(view, key, d, b) {
  const N = view.grid, h = view.me.body[0], R = 6, g = new Map();
  view.food.forEach(f => g.set(f.y * N + f.x, '*'));
  view.me.body.forEach((c, j) => g.set(c.y * N + c.x, j ? 'm' : '@'));
  view.others.forEach((o, k) => o.body.forEach((c, j) => g.set(c.y * N + c.x, j ? 'abc'[k] : 'ABC'[k])));
  g.set((h.y + d.y) * N + h.x + d.x, '+'); g.set((h.y + b.y) * N + h.x + b.x, '!');
  const lines = [];
  for (let y = h.y - R; y <= h.y + R; y++) { let l = ''; for (let x = h.x - R; x <= h.x + R; x++) l += x < 0 || y < 0 || x >= N || y >= N ? '#' : g.get(y * N + x) || '.'; lines.push(l); }
  console.log(`${key} len ${view.me.body.length} age ${view.age}; rivals ${view.others.map((o, k) => 'ABC'[k] + ' len ' + o.body.length + ' dir ' + o.dir.x + ',' + o.dir.y + (o.stun ? ' stun' : '')).join(', ')}\n${lines.join('\n')}\n`);
}
vm.runInContext(fs.readFileSync(path.join(ROOT, 'engine.js'), 'utf8'), ctx, { filename: 'engine.js' });
const E = ctx.window.SnakeEngine;
const per2 = {};
for (let n = 0; n < ROUNDS; n++) {
  state = (SEED + n * 7919) >>> 0;
  const g = E.createGame({ withPlayer: false });
  for (const s of g.snakes) mineKey.set(s.memory, s.personaKey);
  rounds++;
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < 600000) {
    const before = new Map(g.snakes.map(s => [s.id, { x: s.body[0].x, y: s.body[0].y }]));
    pending = [];
    E.step(g);
    ticks++;
    for (const p of pending) {
      let what = 'safe';
      for (const o of g.snakes) {
        if (o.id === p.id || !o.alive) continue;
        const was = before.get(o.id), now = o.body[0];
        if ((now.x === p.c.x && now.y === p.c.y) || (was.x === p.c.x && was.y === p.c.y && now.x === p.h.x && now.y === p.h.y)) { what = 'headOn'; break; }
        if (o.body.some(q => q.x === p.c.x && q.y === p.c.y)) what = 'crash';
      }
      p.r[what]++;
    }
    for (const e of g.events) {
      if (e.type === 'crash' && e.killerId != null && /head-on/.test(e.cause)) headOns++;
      if (e.type === 'eat') foodWatch = foodWatch.filter(w => {
        if (w.x !== e.x || w.y !== e.y) return true;
        w.r[e.snake.id === w.id ? 'mine' : 'theirs']++;
        return false;
      });
    }
    foodWatch = foodWatch.filter(w => w.until >= g.tick || (w.r.nobody++, false));
  }
  for (const s of g.snakes) if (s.cause && /head-on/.test(s.cause)) (per2[s.personaKey] ||= 0), per2[s.personaKey]++;
  foodWatch = [];
}
const pc = (a, b) => (100 * a / Math.max(1, b)).toFixed(0).padStart(5) + '%';
console.log(`${rounds} rounds, ${ticks} ticks; head-on crashes (both snakes counted) ${headOns}, ${(headOns / rounds).toFixed(2)} a round; out head-on: ${Object.values(per2).reduce((a, b) => a + b, 0)}`);
console.log('persona       decisions  swerves /1000  near-head   fearless cell next tick: head-on crash  safe   aimed at food: I ate  rival ate  nobody');
const tot = row('all');
for (const [k, r] of Object.entries(per).filter(([k]) => k !== 'all').sort((a, b) => b[1].swerves / b[1].decisions - a[1].swerves / a[1].decisions)) {
  for (const f in r) tot[f] += r[f];
  console.log(`${k.padEnd(12)} ${String(r.decisions).padStart(9)} ${String(r.swerves).padStart(8)} ${(1000 * r.swerves / r.decisions).toFixed(1).padStart(5)} ${pc(r.near, r.swerves)}   ${pc(r.headOn, r.swerves)} ${pc(r.crash, r.swerves)} ${pc(r.safe, r.swerves)}   ${String(r.aim).padStart(6)} ${pc(r.mine, r.aim)} ${pc(r.theirs, r.aim)} ${pc(r.nobody, r.aim)}`);
}
const r = tot;
console.log(`${'all'.padEnd(12)} ${String(r.decisions).padStart(9)} ${String(r.swerves).padStart(8)} ${(1000 * r.swerves / r.decisions).toFixed(1).padStart(5)} ${pc(r.near, r.swerves)}   ${pc(r.headOn, r.swerves)} ${pc(r.crash, r.swerves)} ${pc(r.safe, r.swerves)}   ${String(r.aim).padStart(6)} ${pc(r.mine, r.aim)} ${pc(r.theirs, r.aim)} ${pc(r.nobody, r.aim)}`);
