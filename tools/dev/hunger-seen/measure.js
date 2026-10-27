// How often a new player starves, by when they notice their hunger. AI-only
// rounds with the game's own rules; seat 0 stands in for the new player (a
// rival plays it, as fair as any), but its view of its own hunger is hidden
// until it would notice it, then shown as the rivals see theirs:
//   blind   never (the owner on a wide desktop, the tag's bar unseen)
//   warn    at the warning toast and rumble (6 s left, 9 at your smallest), a second late
//   body    once its body is visibly slimmer (render/looks.js, hungerLook: 5% thinner), a second late
//   all     always (a rival, or a player who watches the bar)
// Per round: did seat 0 starve, its snake-time starving, and how it died.
//   node measure.js <root> <blind|warn|body|all> [rounds] [--seed N]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(process.argv[2]), MODE = process.argv[3];
const ROUNDS = +(process.argv[4] || 300);
const si = process.argv.indexOf('--seed'), SEED = si > 0 ? +process.argv[si + 1] : 61;
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let rng = Math.random;
const M = Object.create(Math); M.random = () => rng();
const ctx = vm.createContext({ window: {}, console, Math: M });
const load = f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
load('tuning.js'); load('ai.js');
const T = ctx.window.TUNING, AI = ctx.window.SnakeAI, decide = AI.decide;
const LAG = 1000, SLIM_SEEN = 0.05, SLIM = 0.22; // (SLIM: hungerLook's thinnest; seen at 5% thinner)
let game = null;
AI.decide = (view, persona, memory) => {
  const me = view.me;
  if (me.id === 0 && MODE !== 'all' && me.hungerLeft != null) {
    const s = game.snakes[0], left = me.hungerLeft + LAG; // (a second late: what it sees now, it acts on a second after)
    const small = s.body.length + s.grow <= T.MIN_LENGTH;
    const at = MODE === 'warn' ? T.HUNGER_WARN_MS * (small ? 1.5 : 1)
      : MODE === 'body' ? (s.mealMs || T.HUNGER_MS) * (1 - Math.pow(SLIM_SEEN / SLIM, 2 / 3)) : -Infinity;
    if (!(left < at)) view = { ...view, me: { ...me, hungerLeft: Infinity, starveIn: Infinity } };
  }
  return decide(view, persona, memory);
};
load('engine.js');
const E = ctx.window.SnakeEngine;
let starved = 0, died = 0, alive = 0, starving = 0, hungry = 0, rounds = 0, won = 0;
const causes = {};
for (let r = 0; r < ROUNDS; r++) {
  rng = seeded(SEED + r * 7919);
  game = E.createGame({ withPlayer: false });
  const s0 = game.snakes[0];
  while (game.snakes.filter(s => s.alive).length > 1 && game.time < 600000) {
    E.step(game);
    if (s0.alive) { const left = E.hungerLeft(game, s0); alive++; if (left < T.HUNGER_WARN_MS) hungry++; if (left < 0) starving++; }
  }
  rounds++;
  if (!s0.alive) { died++; const c = s0.killer === 'hunger' ? 'starved' : s0.killer || '?'; causes[c] = (causes[c] || 0) + 1; if (c === 'starved') starved++; }
  else won++;
}
const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(1) + '%';
console.log(JSON.stringify({ mode: MODE, seed: SEED, rounds, starvedRounds: pct(starved, rounds), starvedOfDeaths: pct(starved, died), wins: pct(won, rounds),
  hungryTime: pct(hungry, alive), starvingTime: pct(starving, alive), causes }));
