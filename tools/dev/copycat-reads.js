// How Copycat reads its models in play: of its time alive with a model, the
// share with a style read, and how often that style is the model's own rival.
//   node tools/dev/copycat-reads.js [root] [rounds] [seed]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const rounds = +(process.argv[3] || 100), seed = +(process.argv[4] || 5);
let a = seed >>> 0;
const rng = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const M = Object.create(Math); M.random = rng;
const ctx = vm.createContext({ window: {}, console, Math: M });
for (const f of ['tuning.js', 'ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const { SnakeEngine: E, SnakeAI: AI } = ctx.window;
let withModel = 0, read = 0, right = 0; const by = {};
for (let r = 0; r < rounds; r++) {
  const keys = AI.POOL.filter(k => k !== 'copycat'), others = [];
  while (others.length < 3) { const k = keys[Math.floor(rng() * keys.length)]; if (!others.includes(k)) others.push(k); }
  const g = E.createGame({ withPlayer: false, personas: ['copycat', ...others] });
  const cat = g.snakes.find(s => s.personaKey === 'copycat');
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < 600000 && cat.alive) {
    E.step(g);
    const m = g.snakes.find(s => s.id === cat.memory.modelId && s.alive);
    if (!m) continue;
    withModel++;
    if (cat.memory.style) { read++; if (cat.memory.style === m.personaKey) right++; const b = (by[m.personaKey] ||= {}); b[cat.memory.style] = (b[cat.memory.style] || 0) + 1; }
  }
}
console.log(`with a model: ${withModel} ticks; a style read ${(100 * read / withModel).toFixed(1)}%; the model's own ${(100 * right / Math.max(1, read)).toFixed(1)}% of those`);
for (const [k, b] of Object.entries(by).sort()) { const n = Object.values(b).reduce((x, y) => x + y, 0); console.log(`  ${k.padEnd(11)} read as ${Object.entries(b).sort((p, q) => q[1] - p[1]).slice(0, 3).map(([s, c]) => `${s} ${Math.round(100 * c / n)}%`).join(', ')}`); }
