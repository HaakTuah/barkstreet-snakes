// The apples rivals leave to rot: for every apple that rots, which rivals'
// heads came within REACH of it while it lay there (they passed it up), and
// how far it lay from the edge. Per rival: apples passed up a minute alive,
// all and by the edge (on the edge row or one in). Haakon saw Copycat shy
// apples by the edge (29 October 2026); this checks every rival.
//   node tools/dev/rotten-apples.js [root] [rounds] [seed]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const rounds = +(process.argv[3] || 100), seed = +(process.argv[4] || 5), REACH = 2;
let a = seed >>> 0;
const rng = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const M = Object.create(Math); M.random = rng;
const ctx = vm.createContext({ window: {}, console, Math: M });
for (const f of ['tuning.js', 'ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const { SnakeEngine: E, TUNING: T } = ctx.window, N = T.GRID;
const per = {}; // persona -> { ms, passed, edge, rot, rotEdge }
let rotted = 0, rottedEdge = 0;
for (let r = 0; r < rounds; r++) {
  const g = E.createGame({ withPlayer: false });
  const near = new Map(); // apple -> Set of personas whose head came within REACH
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < 600000) {
    const before = g.time;
    E.step(g);
    for (const s of g.snakes) if (s.alive) (per[s.personaKey] ||= { ms: 0, passed: 0, edge: 0 }).ms += g.time - before;
    for (const f of g.food) {
      if (f.kind !== 'food') continue;
      for (const s of g.snakes) if (s.alive && Math.abs(s.body[0].x - f.x) + Math.abs(s.body[0].y - f.y) <= REACH) { let set = near.get(f); if (!set) near.set(f, set = new Set()); set.add(s.personaKey); }
    }
    for (const e of g.events) {
      if (e.type !== 'rot' || e.kind === 'pellet') continue;
      const edge = Math.min(e.x, e.y, N - 1 - e.x, N - 1 - e.y) <= 1;
      rotted++; if (edge) rottedEdge++;
      for (const [f, set] of near) if (f.x === e.x && f.y === e.y && !g.food.includes(f)) { for (const k of set) { per[k].passed++; if (edge) per[k].edge++; } near.delete(f); }
    }
  }
}
console.log(`${rounds} rounds: ${rotted} apples rotted, ${rottedEdge} by the edge; per rival, apples it came within ${REACH} of and left to rot, a minute alive (all · by the edge)`);
for (const [k, p] of Object.entries(per).sort((x, y) => y[1].passed / y[1].ms - x[1].passed / x[1].ms)) console.log(`  ${k.padEnd(11)} ${(p.passed / (p.ms / 60000)).toFixed(3)} · ${(p.edge / (p.ms / 60000)).toFixed(3)}`);
