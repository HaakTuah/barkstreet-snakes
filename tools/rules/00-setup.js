// The rules suite's setup (tools/rules-test.js runs the parts of tools/rules/ in order): the game's
// files, its randomness from a seed, check() and a bare board.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(require.main.path, '..');
const ctx = vm.createContext({ window: {}, console, Math });
for (const f of ['tuning.js', 'ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const { SnakeEngine: E, SnakeAI: AI, TUNING: T } = ctx.window;
const D = E.DIRS;

// mulberry32, as simulate.js has it: the game's randomness from a seed.
const seeded = seed => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
// The game's randomness from a seed for a while (fn), then as it was: whole
// rounds played for their numbers come out the same every run, whatever
// changes in the checks before them.
function seededWhile(seed, fn) {
  const was = Math.random;
  Math.random = seeded(seed);
  try { return fn(); } finally { Math.random = was; }
}
// ...and from a seed for the whole run, so every check sees the same numbers
// every run. Some count what comes at random, or set things where the game
// happens to drop them, and with the run's own randomness one of them failed
// now and then with nothing wrong: the winter apple dropped right in front
// of a head and eaten before it could rot (one run in 300), three golden
// apples in clear weather where four were wanted (one in 250), and those
// seeded below on their own (Drab wandering off, a woodpecker's patch hemmed
// in, Wildcard drawn fond of leaves): about one run in 25 in all.
const SEED = process.argv.includes('--seed') ? Number(process.argv[process.argv.indexOf('--seed') + 1]) : 1;
Math.random = seeded(SEED);

let failed = 0, checks = 0;
function check(name, ok, detail = '') {
  checks++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : ` (${detail})`}`);
  if (!ok) failed++;
}

// Two people steered by their queues, with nothing else on the board.
function board(bodies, { food = [], time = 0 } = {}) {
  const g = E.createGame({ humans: bodies.map((b, i) => ({ name: `P${i}` })), personas: [] });
  g.snakes = g.snakes.slice(0, bodies.length);
  bodies.forEach(([cells, dir], i) => {
    const s = g.snakes[i];
    s.body = cells.map(([x, y]) => ({ x, y }));
    s.dir = D[dir];
  });
  g.food = food.map(([x, y, kind = 'food']) => ({ x, y, kind }));
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  g.time = time;
  return g;
}
