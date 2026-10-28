#!/usr/bin/env node
// Easy pins in AI-only rounds ("Hunters miss easy pins", docs/archive/progress-done.md):
// how often a snake could close one, as it sees the board, and how often it does.
//
//   node tools/dev/easy-pins/census.js [rounds] [--seed N] [--root DIR] [--dump FILE]
//
// --dump writes every missed one (the view, what it did, the moves that close it) to FILE, as JSON.
//
// A pin, on the view a snake decides from: a move of mine after which a
// rival's room (a timed flood fill from where I last saw its head, `age` ticks
// ago, with every body freeing up as its tail passes and my moved body in the
// way from the next tick on) is less than its length, where another move of
// mine would leave it room, and I'd still have room myself. Closing it is making
// one of those moves. An easy pin: the rival's head is against the edge, near
// mine (age + 6 cells at most), and closing it leaves it SHUT cells or fewer (past where it is by now): it's
// dead in a move or two.
const fs = require('fs'), path = require('path'), vm = require('vm');
const arg = (k, d) => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d;
const ROUNDS = Number(process.argv[2]) || 100, SEED = Number(arg('--seed', 1)), ROOT = arg('--root', path.join(__dirname, '../../..'));
const seeded = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
let rng = Math.random;
const M = Object.create(Math); M.random = () => rng();
const ctx = vm.createContext({ window: {}, console, Math: M });
const run = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
run('tuning.js'); run('ai.js');
const AI = ctx.window.SnakeAI, keyOf = new Map(Object.entries(AI.PERSONAS).map(([k, p]) => [p, k]));
const per = {}, row = k => (per[k] ||= { decisions: 0, chances: 0, closed: 0, episodes: 0, episodesClosed: 0 });
const episode = new Map(); // row -> memory -> { tick, closed } of the pin it last had a chance at
const mineKey = new WeakMap(); // memory -> persona key (Wildcard's and Capricious's brains change their weights, not their persona)
const SHUT = 3;
function pinOf(view) {
  const N = view.grid, me = view.me, age = view.age || 0, holes = view.holes;
  const inside = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
  // When each cell frees up (ticks from now) with everyone else as seen.
  const base = new Float64Array(N * N).fill(-Infinity);
  for (const i of holes) base[i] = Infinity;
  for (const o of view.others) o.body.forEach((c, j) => { const i = c.y * N + c.x; base[i] = Math.max(base[i], o.body.length - j - age); });
  // The room from (x, y) at time t0, up to cap, where free(i, s) says a cell is free at time s.
  const roomFrom = (x, y, t0, cap, free) => {
    const seen = new Uint8Array(N * N), q = [y * N + x];
    seen[q[0]] = 1;
    let n = 0;
    for (let s = t0 + 1, r = 0; r < q.length && n < cap; s++) {
      const end = q.length;
      for (; r < end; r++) {
        const i = q[r], cx = i % N, cy = (i - cx) / N;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy, ni = ny * N + nx;
          if (!inside(nx, ny) || seen[ni] || !free(ni, s)) continue;
          seen[ni] = 1; n++; q.push(ni);
        }
      }
    }
    return n;
  };
  const moves = [];
  const h0 = me.body[0], L = me.body.length;
  for (const d of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
    if (d.x === -me.dir.x && d.y === -me.dir.y) continue;
    const nx = h0.x + d.x, ny = h0.y + d.y;
    if (!inside(nx, ny) || base[ny * N + nx] > 1) continue;
    // My body a move on: free from s once its tail has passed (and my new head from tick 1).
    const mine = new Map([[ny * N + nx, L + 1]]);
    me.body.forEach((c, j) => { if (j < L - 1) mine.set(c.y * N + c.x, L - 1 - j + 1); });
    if (me.body.slice(0, L - 1).some(c => c.x === nx && c.y === ny)) continue;
    // (For a rival, my new head's cell is free till I'm in it.)
    const free = (i, s) => base[i] <= s && !(mine.get(i) > s);
    const hunted = view.others.map(o => roomFrom(o.body[0].x, o.body[0].y, -age, o.body.length, (i, s) => s <= 0 && i === ny * N + nx ? base[i] <= s : free(i, s)));
    const safe = roomFrom(nx, ny, 1, L, free) >= L;
    moves.push({ d, hunted, safe });
  }
  for (let k = 0; k < view.others.length; k++) {
    const h = view.others[k].body[0];
    if (h.x > 0 && h.y > 0 && h.x < N - 1 && h.y < N - 1) continue; // (easy: against the edge)
    const near = Math.abs(h.x - h0.x) + Math.abs(h.y - h0.y) <= age + 6, L = view.others[k].body.length;
    const close = moves.filter(m => m.safe && m.hunted[k] <= SHUT + age);
    if (near && close.length && moves.some(m => m.hunted[k] >= L)) return Object.assign(close.map(m => m.d), { id: view.others[k].id });
  }
  return null;
}
const DUMP = arg('--dump', null), missed = [];
const decide = AI.decide;
ctx.window.SnakeAI = { ...AI, decide: (view, brain, memory) => {
  const d = decide(view, brain, memory), pin = pinOf(view);
  for (const k of [keyOf.get(brain) || mineKey.get(memory) || '?', ...(pin && memory.victimId === pin.id ? ['(its victim)'] : [])]) count(row(k), k, view, memory, d, pin);
  return d;
} };
function count(r, k, view, memory, d, pin) {
  r.decisions++;
  if (pin) {
    r.chances++;
    const did = pin.some(p => d.x === p.x && d.y === p.y), m = episode.get(k) || episode.set(k, new WeakMap()).get(k), e = m.get(memory);
    if (!e || e.tick < view.tick - 1) { r.episodes++; m.set(memory, { tick: view.tick, closed: did }); if (did) r.episodesClosed++; }
    else { e.tick = view.tick; if (did && !e.closed) { e.closed = true; r.episodesClosed++; } }
    if (did) r.closed++;
    else if (DUMP && !k.startsWith('(')) missed.push({ key: k, did: d, pin, victimId: memory.victimId, view: JSON.parse(JSON.stringify({ ...view, holes: [...view.holes], fire: [...(view.fire || [])], pecks: [...(view.pecks || [])] })) });
  }
}
run('engine.js');
const E = ctx.window.SnakeEngine;
for (let r = 0; r < ROUNDS; r++) {
  rng = seeded(SEED + r * 7919);
  const g = E.createGame({ withPlayer: false });
  for (const s of g.snakes) mineKey.set(s.memory, s.personaKey);
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < 600000) E.step(g);
}
// ('(its victim)': the chances a snake had at the very rival it was hunting.)
// (keyOf finds the persona of the brain decide was given: a mood's or a desperate snake's weights still come under its own key via memory)
const rows = Object.entries(per).sort((a, b) => b[1].chances - a[1].chances);
let C = 0, K = 0, P = 0, Q = 0;
console.log('persona       chances  closed   share  per 1000 decisions  pins (a run of chances in a row)  closed');
for (const [k, r] of rows) { if (!k.startsWith('(')) { C += r.chances; K += r.closed; P += r.episodes; Q += r.episodesClosed; } console.log(`${k.padEnd(12)} ${String(r.chances).padStart(8)} ${String(r.closed).padStart(7)} ${(100 * r.closed / Math.max(1, r.chances)).toFixed(0).padStart(6)}%  ${(1000 * r.chances / r.decisions).toFixed(1).padStart(6)}  ${String(r.episodes).padStart(14)} ${String(r.episodesClosed).padStart(8)} ${(100 * r.episodesClosed / Math.max(1, r.episodes)).toFixed(0).padStart(4)}%`); }
console.log(`${'all'.padEnd(12)} ${String(C).padStart(8)} ${String(K).padStart(7)} ${(100 * K / Math.max(1, C)).toFixed(0).padStart(6)}%  ${''.padStart(6)}  ${String(P).padStart(14)} ${String(Q).padStart(8)} ${(100 * Q / Math.max(1, P)).toFixed(0).padStart(4)}%`);
if (DUMP) fs.writeFileSync(DUMP, JSON.stringify(missed));
