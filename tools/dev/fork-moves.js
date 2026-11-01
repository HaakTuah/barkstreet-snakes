// What one use of a move is worth to the rival that makes it: every time a
// rival uses the move in a round, the round is forked just before that tick
// and played on twice to its end, once as it went and once with that rival
// forbidden the move for that one tick (it does the best else it sees). The
// two plays draw the same random numbers from the fork, so the difference in
// that rival's place, win and time alive is the use's own worth, paired (far
// sharper than a whole-round A/B, where a rare move drowns in the noise).
// With --forced it asks the other question: at ticks where a rival could
// have used the move and didn't, what would using it have been worth (the
// move it would have made with the move's price waived)?
//   node tools/dev/fork-moves.js <root> --move fly|now|dash [--rounds 40] [--seed 1] [--per-round 4] [--forced] [--json]
//     fly: a golden flight past the plain hop, or turned; now: a plain leap now; dash: a golden flash
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const args = process.argv.slice(2);
const root = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : path.join(__dirname, '..', '..'));
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const MOVE = opt('--move', 'fly'), ROUNDS = Number(opt('--rounds', 40)), SEED = Number(opt('--seed', 1)), PER = Number(opt('--per-round', 4));
const FORCED = args.includes('--forced'), JSON_OUT = args.includes('--json');
const State = require(path.join(__dirname, '..', 'snapshots', 'state.js'));

// The AI, taught to skip the move for the snakes in __forbid (and, --forced, to
// take it at no price for those in __force): a copy of its text, patched here.
function patchAI(text) {
  const swap = (a, b) => { if (!text.includes(a)) throw new Error(`ai.js has changed: can't find ${a.slice(0, 60)}`); text = text.replace(a, b); };
  swap('for (let k = first; k <= (golden ? Math.min(far, n - 1) : first); k++) {', 'for (let k = first; k <= (golden && !globalThis.__forbid.fly.has(me.id) ? Math.min(far, n - 1) : first); k++) {');
  swap('        let turn = null;\n        if (golden) {', '        let turn = null;\n        if (golden && !globalThis.__forbid.fly.has(me.id)) {');
  swap('if (!golden && !fleeing) return null;', 'if (!golden && (globalThis.__forbid.now.has(me.id) || (!fleeing && !globalThis.__force.now.has(me.id)))) return null;');
  swap('if (me.dashes > 0) consider(', 'if (me.dashes > 0 && !globalThis.__forbid.dash.has(me.id)) consider(');
  // (--forced: the move's price waived, so it's taken wherever it scores above the crawl)
  swap('v += extra - price * cheap * (full ? 1 : habit.price) * U;', 'v += extra - (globalThis.__force.any.has(me.id) && (flash ? globalThis.__force.dash.has(me.id) : (globalThis.__force.fly.has(me.id) && leapFly) || (globalThis.__force.now.has(me.id) && leapNow)) ? 0 : price * cheap * (full ? 1 : habit.price) * U);');
  return text;
}

let rngState = 0;
const rng = () => { rngState = (rngState + 0x6d2b79f5) >>> 0; let t = rngState; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const M = Object.create(Math); M.random = rng;
const ctx = vm.createContext({ window: {}, console, Math: M });
const empty = () => ({ fly: new Set(), now: new Set(), dash: new Set(), any: new Set() });
ctx.__forbid = empty(); ctx.__force = empty();
vm.runInContext(fs.readFileSync(path.join(root, 'tuning.js'), 'utf8'), ctx, { filename: 'tuning.js' });
vm.runInContext(patchAI(fs.readFileSync(path.join(root, 'ai.js'), 'utf8')), ctx, { filename: 'ai.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'engine.js'), 'utf8'), ctx, { filename: 'engine.js' });
const E = ctx.window.SnakeEngine, T = ctx.window.TUNING;
const known = State.known({ SnakeAI: ctx.window.SnakeAI, SnakeEngine: E, TUNING: T }), decode = State.decoder(ctx);
const MAX_TIME = 600000;

// Did snake s use the move in this tick's events?
function used(g, s) {
  for (const e of g.events) {
    if (e.snake !== s) continue;
    if (MOVE === 'fly' && e.type === 'leap' && e.gold && (s.flyFor || 0) > 0) return true;
    if (MOVE === 'now' && e.type === 'leap' && e.now && !e.gold) return true;
    if (MOVE === 'dash' && e.type === 'dash' && !e.plain) return true;
  }
  return false;
}
// Could s use the move now (for --forced)?
const could = s => s.alive && !s.flight && (MOVE === 'dash' ? s.dashes > 0 : MOVE === 'fly' ? s.leaps > 0 : E.leapIn(currentGame, s) === 0);
let currentGame = null;

// Play g on to the end of its round; the order snakes went out in. ({ id: place, alive ms after the fork })
function playOut(g, from) {
  const out = new Map(), t0 = g.time, len10 = new Map();
  let left = g.snakes.filter(s => s.alive).length;
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < MAX_TIME) {
    const dying = E.step(g);
    if (g.time - t0 >= 10000 && !len10.size) for (const s of g.snakes) len10.set(s.id, s.alive ? s.body.length + Math.max(0, s.grow) : 0);
    for (const s of dying) out.set(s.id, { place: left, alive: g.time - t0, len10: 0, cause: s.cause });
    left -= dying.length;
  }
  for (const s of g.snakes) if (s.alive && !out.has(s.id)) out.set(s.id, { place: 1, alive: g.time - t0 });
  for (const s of g.snakes) if (!s.alive && !out.has(s.id)) out.set(s.id, { place: left + 1, alive: 0 }); // (out on the fork's own tick)
  for (const [id, o] of out) o.len10 = len10.has(id) ? len10.get(id) : g.snakes[id].alive ? g.snakes[id].body.length : 0;
  return out;
}
const sig = g => JSON.stringify([g.tick, g.time, g.snakes.map(s => [s.alive, s.body, s.leaps, s.dashes, s.grow, s.stunUntil]), g.food.map(f => [f.x, f.y, f.kind]), [...g.holes]]); // (what the round holds, for the check)
const snap = g => ({ tree: State.encode(g, known), rng: rngState });
const back = sv => { rngState = sv.rng; return decode(sv.tree, known); };

const diffs = []; // ({ place: without - with (positive: the use helped), win: with - without, alive: with - without (s), persona })
for (let r = 0; r < ROUNDS; r++) {
  rngState = (SEED * 100003 + r * 7919) >>> 0;
  let g = E.createGame({ withPlayer: false });
  let forks = 0;
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < MAX_TIME && forks < PER) {
    const before = snap(g);
    currentGame = g;
    if (FORCED) {
      const cand = g.snakes.filter(s => !s.isPlayer && could(s));
      E.step(g);
      const s0 = cand.find(s => !used(g, s));
      if (!s0 || rng() > 0.05) continue; // (a twentieth of the chances, spread over the round)
      const id = s0.id, A = back(before), B = back(before), rA = before.rng;
      rngState = rA; ctx.__force.any.add(id); ctx.__force[MOVE].add(id); E.step(B); ctx.__force = empty();
      const took = used(B, B.snakes[id]);
      if (!took) { rngState = before.rng; continue; }
      const afterB = rngState; rngState = rA; E.step(A); const afterA = rngState;
      rngState = afterA; const oa = playOut(A); rngState = afterB; const ob = playOut(B);
      const a = oa.get(id), bb = ob.get(id);
      diffs.push({ place: a.place - bb.place, win: (bb.place === 1) - (a.place === 1), alive: (bb.alive - a.alive) / 1000, out5: (a.alive < 5000) - (bb.alive < 5000), len10: bb.len10 - a.len10, persona: g.snakes[id].name });
      forks++;
      g = back(snap(g)); // (the main round goes on as it was)
      continue;
    }
    E.step(g);
    const s0 = g.snakes.find(s => !s.isPlayer && used(g, s));
    if (!s0) continue;
    const id = s0.id, after = snap(g);
    const A = back(before), B = back(before);
    rngState = before.rng; E.step(A); const afterA = rngState;
    if (process.env.FORK_CHECK && (sig(A) !== sig(back(after)) || afterA !== after.rng)) throw new Error(`round ${r}, tick ${g.tick}: the fork's own play differs from the round's`);
    rngState = before.rng; ctx.__forbid[MOVE].add(id); E.step(B); ctx.__forbid = empty(); const afterB = rngState;
    if (used(B, B.snakes[id])) { g = back(after); continue; } // (it couldn't be stopped: a held move)
    const ctxA = { cut: A.events.some(e => e.type === 'cut' && e.by === id), ate: A.events.filter(e => e.type === 'eat' && e.snake?.id === id).length, len: A.snakes[id].body.length, late: E.suddenDeath(A) ? 1 : 0, gold: A.snakes[id].leaps };
    rngState = afterA; const oa = playOut(A); rngState = afterB; const ob = playOut(B);
    const a = oa.get(id), bb = ob.get(id);
    diffs.push({ ...ctxA, causeA: a.alive < 10000 ? a.cause : '', causeB: bb.alive < 10000 ? bb.cause : '', place: bb.place - a.place, win: (a.place === 1) - (bb.place === 1), alive: (a.alive - bb.alive) / 1000, out5: (bb.alive < 5000) - (a.alive < 5000), len10: a.len10 - bb.len10, persona: g.snakes[id].name });
    forks++;
    g = back(after);
  }
}
const mean = k => diffs.reduce((t, d) => t + d[k], 0) / Math.max(1, diffs.length);
const se = k => { const m = mean(k); return Math.sqrt(diffs.reduce((t, d) => t + (d[k] - m) ** 2, 0) / Math.max(1, diffs.length - 1) / Math.max(1, diffs.length)); };
const res = { move: MOVE, forced: FORCED, seed: SEED, rounds: ROUNDS, uses: diffs.length, place: mean('place'), placeSE: se('place'), win: mean('win'), winSE: se('win'), alive: mean('alive'), aliveSE: se('alive'), out5: mean('out5'), out5SE: se('out5'), len10: mean('len10'), len10SE: se('len10') };
if (JSON_OUT) console.log(JSON.stringify({ ...res, diffs }));
else console.log(`${FORCED ? 'forced ' : ''}${MOVE}: ${diffs.length} uses in ${ROUNDS} rounds (seed ${SEED}) · place gained a use ${res.place.toFixed(3)} ± ${res.placeSE.toFixed(3)} · wins ${(100 * res.win).toFixed(1)} ± ${(100 * res.winSE).toFixed(1)} points · alive ${res.alive.toFixed(1)} ± ${res.aliveSE.toFixed(1)} s · out within 5 s saved ${(100 * res.out5).toFixed(1)} ± ${(100 * res.out5SE).toFixed(1)} points · length at 10 s ${res.len10.toFixed(2)} ± ${res.len10SE.toFixed(2)}`);
