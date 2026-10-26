// How close the open burrows sit to each other, over AI rounds.
//   node measure.js <dir with tuning.js ai.js engine.js> <rounds> <seed> [JSON tuning overrides]
// For every tick with 2+ burrows open: the nearest pair's distance (Manhattan).
// For every burrow opened: how it opened (dug or quiet), and how far the nearest
// other open burrow is at that moment.
const fs = require('fs'), path = require('path'), vm = require('vm');
const [dir, roundsArg, seedArg, over] = process.argv.slice(2);
const rounds = +roundsArg || 100, seed = +seedArg || 3;
function seeded(s) { let a = s >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rng = Math.random;
const M = Object.create(Math); M.random = () => rng();
const ctx = vm.createContext({ window: {}, console, Math: M });
const ov = over ? JSON.parse(over) : {};
for (const f of ['tuning.js', 'ai.js', 'engine.js']) {
  let src = fs.readFileSync(path.join(dir, f), 'utf8');
  if (f === 'tuning.js') for (const [k, v] of Object.entries(ov)) { if (k === 'SPACING' || k === 'QUIET') continue; const re = new RegExp('(\\b' + k + ':\\s*)[^,]+,'); if (!re.test(src)) throw k; src = src.replace(re, (m, p) => p + JSON.stringify(v) + ','); }
  if (f === 'engine.js' && ov.QUIET) { const q = 'const at = place(null, true);'; if (!src.includes(q)) throw 'quiet anchor'; src = src.replace(q, 'let at = null, gapBest = -1; for (let t = 0; t < 6; t++) { const c = place(null, true); if (!c) break; const gp = Math.min(99, ...game.burrows.map(h => Math.abs(h.x - c.x) + Math.abs(h.y - c.y))); if (gp > gapBest) { gapBest = gp; at = c; } if (gp >= ' + ov.QUIET + ') break; }'); }
  if (f === 'engine.js' && ov.SPACING) { const a = 'if (game.burrows.length >= T.BURROW_MAX) {'; if (!src.includes(a)) throw 'anchor'; src = src.replace(a, 'if (dug) for (const h of [...game.burrows]) if (Math.abs(h.x - x) + Math.abs(h.y - y) < ' + ov.SPACING + ') closeBurrow(game, h);\n    ' + a); }
  vm.runInContext(src, ctx, { filename: f });
}
const E = ctx.window.SnakeEngine, T = ctx.window.TUNING;
const d = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const pairTicks = []; const opens = { dug: [], quiet: [] }; let ticks = 0, roundsWithClose = 0; const three = [];
for (let r = 0; r < rounds; r++) {
  rng = seeded(seed + r * 7919);
  const g = E.createGame({ withPlayer: false });
  let close = false;
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < 600000) {
    E.step(g);
    ticks++;
    for (const e of g.events) if (e.type === 'burrow') {
      const others = g.burrows.filter(b => !(b.x === e.x && b.y === e.y));
      const near = others.length ? Math.min(...others.map(b => d(b, e))) : null;
      if (near != null) opens[e.dug ? 'dug' : 'quiet'].push(near);
    }
    if (g.burrows.length >= 2) {
      let m = 99;
      for (let i = 0; i < g.burrows.length; i++) for (let j = i + 1; j < g.burrows.length; j++) m = Math.min(m, d(g.burrows[i], g.burrows[j]));
      pairTicks.push(m);
      if (g.burrows.length >= 3) { let w = 0; for (let i = 0; i < g.burrows.length; i++) for (let j = i + 1; j < g.burrows.length; j++) w = Math.max(w, d(g.burrows[i], g.burrows[j])); three.push(w); }
      if (m <= 4) close = true;
    }
  }
  if (close) roundsWithClose++;
}
const q = (a, p) => { if (!a.length) return '-'; const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
const share = (a, k) => a.length ? (100 * a.filter(x => x <= k).length / a.length).toFixed(0) + '%' : '-';
console.log(JSON.stringify({
  dir: path.basename(dir), over: over || '', rounds, grid: T.GRID,
  nearestPair: { median: q(pairTicks, 0.5), p25: q(pairTicks, 0.25), within4: share(pairTicks, 4), within6: share(pairTicks, 6) },
  threeOpen: { ticks: three.length, allWithin8: share(three, 8), allWithin10: share(three, 10) },
  roundsWithPairWithin4: (100 * roundsWithClose / rounds).toFixed(0) + '%',
  openedQuiet: { n: opens.quiet.length, median: q(opens.quiet, 0.5), within4: share(opens.quiet, 4) },
  openedDug: { n: opens.dug.length, median: q(opens.dug, 0.5), within4: share(opens.dug, 4) },
}));
