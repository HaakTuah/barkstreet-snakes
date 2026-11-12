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
// --rest forbids that rival the move for the rest of the round in the play without it: one tick measures when to use
// it (the rival still holds it and uses it later), the rest of the round whether having it helps.
//   node tools/dev/fork-moves.js <root> --move fly|now|dash|portal|spit|power|golden|grab|charges [--rounds 40] [--seed 1] [--per-round 4] [--forced] [--rest] [--json]
//     fly: a golden flight held past the plain hop (always GOLD_FLY cells); now: a plain leap now; dash: a golden flash;
//     portal: following someone through a gold portal (no --forced)
//     grab (part 6): at each spill of dropped charges, the rival whose head is nearest it, played on as it went and
//       ignoring spills for the rest of the round (chosen before either play, so neither is picked for its luck). No --forced or --rest.
//     charges (part 6): golden charges a rival eats, from a spill or a golden leaf, played on as it went and with the
//       charges that meal gave taken back (the meal itself kept): what the charges are worth, a grab against a leaf. No --forced or --rest.
//     spit (3b+): a mushroom spat along its line, against the same mushroom gone from the cheek unspat (no --forced or --rest)
//     power (2u+): a plain jump or flash used with both in the bar, played on with the jump, the flash and neither
//       (which was the more useful, each moment). No --forced or --rest.
//     golden (2z): a golden apple eaten, played on six ways from the tick after: as it went; uneaten; and, from the
//       stamina and shield it had before, as +3 alone, as a plain +1, with a full bar of stamina (2u+), and with that
//       and a shield that takes one crash (--shield MS, default 10000). No --forced or --rest.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const args = process.argv.slice(2);
const root = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : path.join(__dirname, '..', '..'));
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const MOVE = opt('--move', 'fly'), ROUNDS = Number(opt('--rounds', 40)), SEED = Number(opt('--seed', 1)), PER = Number(opt('--per-round', 4));
const SHIELD_MS = Number(opt('--shield', 10000)); // (golden: the shield tried, ms)
const FORCED = args.includes('--forced'), JSON_OUT = args.includes('--json'), REST = args.includes('--rest');
const State = require(path.join(__dirname, '..', 'snapshots', 'state.js'));

// The AI, taught to skip the move for the snakes in __forbid (and, --forced, to
// take it at no price for those in __force): a copy of its text, patched here.
function patchAI(text) {
  const swap = (a, b) => { if (!text.includes(a)) throw new Error(`the AI has changed: can't find ${a.slice(0, 60)}`); text = text.replace(a, b); };
  swap('for (let k = air ? full : first; k <= (golden ? full : first); k += Math.max(1, full - first)) {', 'for (let k = air ? full : first; k <= (golden && !globalThis.__forbid.fly.has(me.id) ? full : first); k += Math.max(1, full - first)) {');
  swap('  let turn = null;\n  if (golden) {', '  let turn = null;\n  if (golden && !globalThis.__forbid.fly.has(me.id)) {');
  swap('if (!golden && !trapped && !ringCover.length) return null;', 'if (!golden && (globalThis.__forbid.now.has(me.id) || (!trapped && !ringCover.length && !globalThis.__force.now.has(me.id)))) return null;');
  swap('if (span < 1 || (!golden && !trapped && !coverAt(path[span], span + 1))) return null;', 'if (span < 1 || (!golden && !trapped && !globalThis.__force.now.has(me.id) && !coverAt(path[span], span + 1))) return null;');
  swap('(seenPortals.length && !inGrid(nx, ny) && portalOut(body[0].x', '(seenPortals.length && !inGrid(nx, ny) && !globalThis.__forbid.portal.has(me.id) && portalOut(body[0].x'); // (portal: my own steps through a gold portal, searched or powered)
  swap('    for (let n = 0; n < portalIn.length; n++) {\n      const e = portalIn[n], q = portalEx[n];', '    for (let n = 0; n < (globalThis.__forbid.portal.has(me.id) ? 0 : portalIn.length); n++) {\n      const e = portalIn[n], q = portalEx[n];'); // (nor plans room through one: the A/B's B side)
  swap('if (se < CLAIMED || !tag || portalLeft', 'if (se < CLAIMED || (globalThis.__forbid.portal.has(me.id) ? tag <= 1 : !tag) || portalLeft');
  swap('!portalOut(sx, sy, d, 1)) return -1;', '!portalOut(sx, sy, d, 1) || globalThis.__forbid.portal.has(me.id)) return -1;');
  swap('spillWorth = f => Math.max(', 'spillWorth = f => globalThis.__forbid.grab.has(me.id) ? 0 : Math.max('); // (grab: dropped charges worth nothing to me)
  swap('if (me.dashes > 0) { const v', 'if (me.dashes > 0 && !globalThis.__forbid.dash.has(me.id)) { const v');
  // (--forced: the move's price waived, so it's taken wherever it scores above the crawl)
  swap('v += extra - (price * (full ? 1 : habit.price) + wait) * cheap * U;', 'v += extra - (globalThis.__force.any.has(me.id) && (flash ? globalThis.__force.dash.has(me.id) : (globalThis.__force.fly.has(me.id) && leapFly) || (globalThis.__force.now.has(me.id) && leapNow)) ? 0 : (price * (full ? 1 : habit.price) + wait) * cheap * U);');
  // (power, 2u+: the plain jump or the plain flash forbidden, or the other forced: taken wherever it can go, priced at nothing)
  swap('consider = (d, flash, v, price, extra, wait = 0) => {', 'consider = (d, flash, v, price, extra, wait = 0) => { const pk = flash ? (me.dashes > 0 ? \'\' : \'pdash\') : (me.leaps > 0 ? \'\' : \'pjump\'), pf = !!pk && globalThis.__force[pk].has(me.id); if (pk && globalThis.__forbid[pk].has(me.id)) v = null; if (pf) { price = 0; wait = 0; }');
  swap('if (v > (bestPower ? bestPower.v : crawlScore + 1))', 'if (v > (bestPower ? bestPower.v : pf ? -Infinity : crawlScore + 1))');
  swap('me.flashIn === 0 && (dropping || d === crawlDir', 'me.flashIn === 0 && (dropping || globalThis.__force.pdash.has(me.id) || d === crawlDir');
  return text;
}

let rngState = 0;
const rng = () => { rngState = (rngState + 0x6d2b79f5) >>> 0; let t = rngState; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const M = Object.create(Math); M.random = rng;
const ctx = vm.createContext({ window: {}, console, Math: M });
const empty = () => ({ fly: new Set(), now: new Set(), dash: new Set(), portal: new Set(), spit: new Set(), grab: new Set(), any: new Set(), pjump: new Set(), pdash: new Set() });
ctx.__forbid = empty(); ctx.__force = empty();
const gameFiles = require('../game-files.js'), files = gameFiles(root), read = f => fs.readFileSync(path.join(root, f), 'utf8');
vm.runInContext(read('tuning.js'), ctx, { filename: 'tuning.js' });
vm.runInContext(patchAI(files.filter(gameFiles.ai).map(read).join('\n')), ctx, { filename: 'ai' }); // (the AI's files as one script, patched)
for (const f of files.filter(gameFiles.engine)) vm.runInContext(read(f), ctx, { filename: f });
const E = ctx.window.SnakeEngine, T = ctx.window.TUNING;
const known = State.known({ SnakeAI: ctx.window.SnakeAI, SnakeEngine: E, TUNING: T }), decode = State.decoder(ctx);
const MAX_TIME = 600000;

// Did snake s use the move in this tick's events?
function used(g, s) {
  for (const e of g.events) {
    if (e.snake !== s) continue;
    if (MOVE === 'fly' && e.type === 'leap' && e.gold && s.flight?.held) return true; // (held: the full flight, 2y)
    if (MOVE === 'now' && e.type === 'leap' && e.now && !e.gold) return true;
    if (MOVE === 'dash' && e.type === 'dash' && !e.plain) return true;
    if (MOVE === 'portal' && e.type === 'through') return true; // (following someone through a gold portal)
    if (MOVE === 'spit' && e.type === 'spit') return true; // (3b+: a mushroom spat)
    if (MOVE === 'golden' && e.type === 'eat' && e.kind === 'golden') return true;
    if (MOVE === 'power' && plainPower(e)) return true;
  }
  return false;
}
// A plain jump or a plain flash, and which ('pjump', 'pdash'), or ''.
const plainPower = e => e.type === 'leap' && !e.gold ? 'pjump' : e.type === 'dash' && e.plain ? 'pdash' : '';
// Could s use the move now (for --forced)?
const could = s => s.alive && !s.flight && (MOVE === 'dash' ? s.dashes > 0 : MOVE === 'fly' ? s.leaps > 0 : E.leapIn(currentGame, s) === 0);
let currentGame = null;

// Play g on to the end of its round; the order snakes went out in. ({ id: place, alive ms after the fork })
function playOut(g, from, seen) {
  const out = new Map(), t0 = g.time, len10 = new Map();
  let left = g.snakes.filter(s => s.alive).length;
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < MAX_TIME) {
    const dying = E.step(g);
    seen?.(g);
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

// What play a gained over play b, for one snake (each from playOut).
const d = (a, b) => ({ place: b.place - a.place, win: (a.place === 1) - (b.place === 1), alive: (a.alive - b.alive) / 1000, out5: (b.alive < 5000) - (a.alive < 5000), len10: a.len10 - b.len10 });
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
    if (MOVE === 'charges') { const e = g.events.find(e => e.type === 'eat' && (e.kind === 'spill' || e.kind === 'leaf') && !e.snake.isPlayer); if (e) { charges(before, snap(g), e.snake.id, e.kind, e.snake.name, g.events); forks++; g = back(snap(g)); } continue; }
    if (MOVE === 'grab') { const e = g.events.find(e => e.type === 'spill'); if (e && grab(snap(g), g, e)) forks++; if (e) g = back(snap(g)); continue; }
    const s0 = g.snakes.find(s => !s.isPlayer && used(g, s));
    if (!s0) continue;
    const id = s0.id, after = snap(g);
    if (MOVE === 'power') { if (power(before, g, s0)) forks++; g = back(after); continue; }
    if (MOVE === 'golden') { golden(before, after, id, g.snakes[id].name, g.events.some(e => e.type === 'eat' && e.snake === s0 && e.kind !== 'golden' && e.kind !== 'mushroom')); forks++; g = back(after); continue; }
    const A = back(before), B = back(before);
    rngState = before.rng; E.step(A); const afterA = rngState;
    if (process.env.FORK_CHECK && (sig(A) !== sig(back(after)) || afterA !== after.rng)) throw new Error(`round ${r}, tick ${g.tick}: the fork's own play differs from the round's`);
    rngState = before.rng; ctx.__forbid[MOVE].add(id); if (MOVE === 'spit') B.snakes[id].cheek = null; E.step(B); ctx.__forbid = empty(); const afterB = rngState;
    if (used(B, B.snakes[id])) { g = back(after); continue; } // (it couldn't be stopped: a held move)
    const ctxA = { cut: A.events.some(e => e.type === 'cut' && e.by === id), ate: A.events.filter(e => e.type === 'eat' && e.snake?.id === id).length, len: A.snakes[id].body.length, late: E.suddenDeath(A) ? 1 : 0, gold: A.snakes[id].leaps };
    rngState = afterA; const oa = playOut(A); rngState = afterB; if (REST) ctx.__forbid[MOVE].add(id); const ob = playOut(B); ctx.__forbid = empty();
    const a = oa.get(id), bb = ob.get(id);
    diffs.push({ ...ctxA, causeA: a.alive < 10000 ? a.cause : '', causeB: bb.alive < 10000 ? bb.cause : '', place: bb.place - a.place, win: (a.place === 1) - (bb.place === 1), alive: (a.alive - bb.alive) / 1000, out5: (bb.alive < 5000) - (a.alive < 5000), len10: a.len10 - bb.len10, persona: g.snakes[id].name });
    forks++;
    g = back(after);
  }
}
// 2z: one golden apple eaten, played on from the same random numbers after the tick: as it went (A); uneaten (B: its
// growth, its meal and what it gave the stamina undone); and (2u+) from the stamina, bank and shield it had before
// it, whatever the tuning gives: as the +3 alone (N), as a plain apple (P), with a full bar (F) and with a full bar and
// a shield (S). Diffs: what the apple as it is gave (A against B), its +3 over a plain +1 (N against P), what a full
// bar adds (F against N) and a shield on top of it (S against F). (A meal's own top-up of the bar is left out of N, P,
// F and S alike.)
function golden(before, after, id, persona, otherMeal) {
  const then = back(before), was = then.snakes[id], G = T.GOLDEN_GROWTH;
  const play = edit => { const x = back(after), s = x.snakes[id]; edit(x, s); rngState = after.rng; return playOut(x).get(id); };
  const bare = s => { if (!otherMeal) { s.restedAt = was.restedAt; s.bank = was.bank; } s.shieldUntil = was.shieldUntil; }; // (another meal the same tick keeps its refill)
  const A = play(() => {});
  const B = play((x, s) => { s.grow -= G; s.eaten -= G; bare(s); if (!otherMeal) for (const k of ['lastAte', 'nextStarve', 'mealMs', 'ateTick']) s[k] = was[k]; }); // (one meal's hunger refill is any meal's)
  const N = play((x, s) => bare(s));
  const P = play((x, s) => { s.grow -= G - 1; s.eaten -= G - 1; bare(s); });
  const F = play((x, s) => { bare(s); s.restedAt = Math.min(s.restedAt, x.time); });
  const S = play((x, s) => { bare(s); s.restedAt = Math.min(s.restedAt, x.time); s.shieldUntil = x.time + SHIELD_MS; });
  diffs.push({ ...d(A, B), plain: d(N, P), vigour: d(F, N), shield: d(S, F), rested: was.restedAt > then.time ? 1 : 0, persona });
}
// Part 6: a spill of dropped charges, e. The living rival whose head is nearest it plays on as it went (A) and
// ignoring spills for the rest of the round (B), from the same random numbers. Diffs: what wanting them gave it,
// with whether it grabbed them in each play.
function grab(after, g, e) {
  const near = s => Math.abs(s.body[0].x - e.x) + Math.abs(s.body[0].y - e.y);
  const s0 = g.snakes.filter(s => s.alive && !s.isPlayer).sort((a, b) => near(a) - near(b) || a.id - b.id)[0];
  if (!s0) return false;
  const id = s0.id;
  // (This spill and no other, followed where the woodpecker knocks it, until someone eats it or it's gone: who ate it, or -1.)
  const play = forbid => {
    const x = back(after); let at = { x: e.x, y: e.y }, eater = -1;
    if (forbid) ctx.__forbid.grab.add(id);
    const out = playOut(x, 0, y => {
      if (!at) return;
      for (const v of y.events) {
        if (v.type === 'knock' && v.kind === 'spill' && v.x === at.x && v.y === at.y) { at = v.tx == null ? null : { x: v.tx, y: v.ty }; if (!at) return; }
        else if (v.type === 'eat' && v.kind === 'spill' && v.x === at.x && v.y === at.y) { eater = v.snake.id; at = null; return; }
      }
      if (!y.food.some(f => f.kind === 'spill' && f.x === at.x && f.y === at.y)) at = null; // (faded)
    });
    ctx.__forbid = empty();
    return { out: out.get(id), got: eater === id ? 1 : 0, other: eater >= 0 && eater !== id ? 1 : 0 };
  };
  const A = play(false), other = A.other; // (in the play as it went, someone else ate it)
  const B = play(true);
  const room = Math.min(e.leaps, T.LEAP_MAX - s0.leaps) + Math.min(e.dashes, T.DASH_MAX - s0.dashes);
  diffs.push({ ...d(A.out, B.out), gotA: A.got, gotB: B.got, away: near(s0), room, other, persona: s0.name });
  return true;
}
// Part 6: snake id ate golden charges this tick (kind: 'spill' or 'leaf'). Played on from after it as it went (A) and
// with the charges that meal gave taken back (B), the meal itself kept. Diffs: what the charges were worth.
// (What the meal gave: what it holds now, less what it held before the tick and didn't spend in it: a golden leap or
// dash the same tick goes before the meal.)
function charges(before, after, id, kind, persona, events) {
  const was = back(before).snakes[id], now = back(after).snakes[id];
  const spentL = events.filter(v => v.type === 'leap' && v.gold && v.snake.id === id).length, spentD = events.filter(v => v.type === 'dash' && !v.plain && v.snake.id === id).length;
  const gl = Math.min(now.leaps, Math.max(0, now.leaps - (was.leaps - spentL))), gd = Math.min(now.dashes, Math.max(0, now.dashes - (was.dashes - spentD)));
  if (!gl && !gd) return;
  const play = take => { const x = back(after), s = x.snakes[id]; if (take) { s.leaps -= gl; s.dashes -= gd; } rngState = after.rng; return playOut(x).get(id); };
  diffs.push({ ...d(play(false), play(true)), kind, gained: gl + gd, persona });
}
// 2u+: a plain jump or flash used with both in the bar and no golden ones held, played on three ways from the tick
// before: with the jump (the flash forbidden, the jump taken wherever it can go, at no price), with the flash (the
// other way round) and with neither. Kept only where both could go. Diffs: the jump against the flash, and each
// against neither.
function power(before, g, s0) {
  const id = s0.id, was = back(before).snakes[id];
  if (was.leaps > 0 || was.dashes > 0 || E.flashIn(back(before), was) > 0 || E.leapIn(back(before), was) > 0) return false;
  const play = (forbid, force) => {
    const x = back(before);
    for (const k of forbid) ctx.__forbid[k].add(id);
    if (force) ctx.__force[force].add(id);
    E.step(x); ctx.__forbid = empty(); ctx.__force = empty();
    const took = x.events.filter(e => e.snake?.id === id).map(plainPower).find(Boolean) || '';
    return { took, out: playOut(x).get(id) };
  };
  const J = play(['pdash'], 'pjump'), D = play(['pjump'], 'pdash'), C = play(['pjump', 'pdash']);
  if (J.took !== 'pjump' || D.took !== 'pdash' || C.took) return false;
  // (1: a was the more useful, -1: b, 0: no difference. Over the whole round a fork's two plays part ways for good
  // and either can come out ahead by chance, so the moment's own worth is read near it: alive 5 s on, then length
  // 10 s on; the place and time alive, over the round, beside it)
  const better = (a, b) => Math.sign((a.alive >= 5000) - (b.alive >= 5000) || a.len10 - b.len10);
  const longer = (a, b) => Math.sign(b.place - a.place || a.alive - b.alive);
  diffs.push({ ...d(J.out, D.out), jumpBetter: better(J.out, D.out), jumpLonger: longer(J.out, D.out), jump: d(J.out, C.out), dash: d(D.out, C.out), used: plainPower(g.events.find(e => e.snake?.id === id && plainPower(e))), persona: s0.name });
  return true;
}
const mean = k => diffs.reduce((t, d) => t + d[k], 0) / Math.max(1, diffs.length);
const se = k => { const m = mean(k); return Math.sqrt(diffs.reduce((t, d) => t + (d[k] - m) ** 2, 0) / Math.max(1, diffs.length - 1) / Math.max(1, diffs.length)); };
const res = { move: MOVE, forced: FORCED, seed: SEED, rounds: ROUNDS, uses: diffs.length, place: mean('place'), placeSE: se('place'), win: mean('win'), winSE: se('win'), alive: mean('alive'), aliveSE: se('alive'), out5: mean('out5'), out5SE: se('out5'), len10: mean('len10'), len10SE: se('len10') };
if (MOVE === 'charges') for (const k of ['spill', 'leaf']) { const xs = diffs.filter(x => x.kind === k), m = f => xs.reduce((t, x) => t + x[f], 0) / Math.max(1, xs.length), e = f => Math.sqrt(xs.reduce((t, x) => t + (x[f] - m(f)) ** 2, 0) / Math.max(1, xs.length - 1) / Math.max(1, xs.length)); console.log(`charges from a ${k}: ${xs.length} eaten, ${m('gained').toFixed(2)} charges each · place ${m('place').toFixed(3)} ± ${e('place').toFixed(3)} · wins ${(100 * m('win')).toFixed(1)} ± ${(100 * e('win')).toFixed(1)} points · alive ${m('alive').toFixed(1)} ± ${e('alive').toFixed(1)} s`); }
if (MOVE === 'grab') Object.assign(res, { grabbedA: mean('gotA'), grabbedB: mean('gotB'), away: mean('away') }); // (part 6: how often the nearest grabbed the spill, wanting it and not, and how far it was)
if (MOVE === 'golden') { // (the three comparisons, each paired over the same eats)
  const row = (name, pick) => { const xs = diffs.map(pick), m = k => xs.reduce((t, d) => t + d[k], 0) / Math.max(1, xs.length), e = k => Math.sqrt(xs.reduce((t, d) => t + (d[k] - m(k)) ** 2, 0) / Math.max(1, xs.length - 1) / Math.max(1, xs.length)); return `${name}: place ${m('place').toFixed(3)} ± ${e('place').toFixed(3)} · wins ${(100 * m('win')).toFixed(1)} ± ${(100 * e('win')).toFixed(1)} points · alive ${m('alive').toFixed(1)} ± ${e('alive').toFixed(1)} s · length at 10 s ${m('len10').toFixed(2)} ± ${e('len10').toFixed(2)}`; };
  console.log(`golden apples: ${diffs.length} eaten in ${ROUNDS} rounds (seed ${SEED}); bar not full when eaten: ${(diffs.reduce((t, d) => t + d.rested, 0) / Math.max(1, diffs.length)).toFixed(2)}`);
  console.log('  ' + row('eaten, against uneaten', d => d));
  console.log('  ' + row('+3, against a plain +1', d => d.plain));
  console.log('  ' + row('a full bar, against none', d => d.vigour));
  console.log('  ' + row(`a shield (${SHIELD_MS / 1000} s), against the full bar alone`, d => d.shield));
  if (JSON_OUT) console.log(JSON.stringify({ seed: SEED, rounds: ROUNDS, diffs }));
} else if (MOVE === 'power') { // (each moment, which was the more useful: the jump, the flash, or neither by place and time alive)
  const by = {};
  for (const x of diffs) { const b = by[x.persona] ??= [0, 0, 0]; b[x.jumpBetter + 1]++; }
  const all = diffs.reduce((b, x) => (b[x.jumpBetter + 1]++, b), [0, 0, 0]), long = diffs.reduce((b, x) => (b[x.jumpLonger + 1]++, b), [0, 0, 0]);
  const share = b => `${b[2]} jump, ${b[0]} dash, ${b[1]} even: the jump ${(100 * b[2] / Math.max(1, b[0] + b[2])).toFixed(0)}% of the decided`;
  console.log(`power: ${diffs.length} moments in ${ROUNDS} rounds (seed ${SEED}) · near it, ${share(all)} · jump against dash, place ${res.place.toFixed(3)} ± ${res.placeSE.toFixed(3)}, alive ${res.alive.toFixed(1)} ± ${res.aliveSE.toFixed(1)} s`);
  console.log(`  over the whole round: ${share(long)}`);
  for (const [k, pick] of [['jump against neither', x => x.jump], ['dash against neither', x => x.dash]]) { const xs = diffs.map(pick), m = f => xs.reduce((t, x) => t + x[f], 0) / Math.max(1, xs.length); console.log(`  ${k}: place ${m('place').toFixed(3)} · alive ${m('alive').toFixed(1)} s`); }
  for (const p of Object.keys(by).sort()) console.log(`  ${p}: ${share(by[p])}`);
  if (JSON_OUT) console.log(JSON.stringify({ seed: SEED, rounds: ROUNDS, diffs }));
} else if (JSON_OUT) console.log(JSON.stringify({ ...res, diffs }));
else console.log(`${FORCED ? 'forced ' : ''}${MOVE}: ${diffs.length} uses in ${ROUNDS} rounds (seed ${SEED}) · place gained a use ${res.place.toFixed(3)} ± ${res.placeSE.toFixed(3)} · wins ${(100 * res.win).toFixed(1)} ± ${(100 * res.winSE).toFixed(1)} points · alive ${res.alive.toFixed(1)} ± ${res.aliveSE.toFixed(1)} s · out within 5 s saved ${(100 * res.out5).toFixed(1)} ± ${(100 * res.out5SE).toFixed(1)} points · length at 10 s ${res.len10.toFixed(2)} ± ${res.len10SE.toFixed(2)}${MOVE === 'grab' ? ` · the nearest grabbed it ${(100 * res.grabbedA).toFixed(0)}% wanting it, ${(100 * res.grabbedB).toFixed(0)}% not (${res.away.toFixed(1)} cells away)` : ''}`);
