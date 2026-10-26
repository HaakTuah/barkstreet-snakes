// How often each lesson's trigger comes to a snake in a round, and when
// first: AI-only rounds with the game's own rules (rivals and players are
// treated alike, so a rival stands in for a fair player; the powers a new
// player presses are left to play.js). Per snake per round: did it happen
// while that snake was alive, and the game time of the first.
//   node freq.js <root> [rounds] [--seed N]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(process.argv[2]);
const ROUNDS = +(process.argv[3] || 200);
const si = process.argv.indexOf('--seed'), SEED = si > 0 ? +process.argv[si + 1] : 5;
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let rng = Math.random;
const M = Object.create(Math); M.random = () => rng();
const ctx = vm.createContext({ window: {}, console, Math: M });
for (const f of ['tuning.js', 'ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const E = ctx.window.SnakeEngine, T = ctx.window.TUNING;
const KEYS = ['crash', 'atThree', 'hungry', 'alight', 'peckedUnder', 'choke', 'nudge', 'ownBead', 'digNear', 'goldBeetle', 'leaf', 'goldcap', 'wrapEnding', 'leap', 'goldDash', 'snipped', 'woodpecker', 'mushroom'];
const GLOBAL = ['digBurrow', 'lastApples', 'woodpeckerCame', 'goldBeetleSpawn', 'leafSpawn', 'goldcapSpawn', 'rain', 'storm', 'snow', 'baked', 'rainbow'];
const tally = Object.fromEntries(KEYS.map(k => [k, { n: 0, first: [] }]));
const glob = Object.fromEntries(GLOBAL.map(k => [k, { n: 0, first: [] }]));
let snakeRounds = 0, roundMs = [], lifeMs = [];
for (let r = 0; r < ROUNDS; r++) {
  rng = seeded(SEED + r * 7919);
  const g = E.createGame({ withPlayer: false });
  const seen = g.snakes.map(() => ({}));
  const gseen = {};
  const mark = (s, k) => { const o = seen[s.id ?? g.snakes.indexOf(s)]; if (o && !(k in o) && s.alive !== false) o[k] = g.time; };
  const gmark = k => { if (!(k in gseen)) gseen[k] = g.time; };
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < 600000) {
    const alive = g.snakes.filter(s => s.alive);
    const dying = E.step(g);
    for (const e of g.events) {
      const s = e.snake;
      if (e.type === 'crash' && s) mark(s, 'crash');
      if (e.type === 'alight' && s) mark(s, 'alight');
      if (e.type === 'peck') { for (const id of e.under || []) mark(g.snakes[id], 'peckedUnder'); }
      if (e.type === 'choke' && s) mark(s, 'choke');
      if (e.type === 'nudge' && s) mark(s, 'nudge');
      if (e.type === 'eat' && s) { if (e.own) mark(s, 'ownBead'); if (e.gold) mark(s, 'goldBeetle'); if (e.kind === 'leaf') mark(s, 'leaf'); if (e.kind === 'goldcap') mark(s, 'goldcap'); if (e.kind === 'mushroom') mark(s, 'mushroom'); }
      if (e.type === 'dig') for (const o of alive) if (Math.abs(o.body[0].x - e.x) + Math.abs(o.body[0].y - e.y) <= 8) mark(o, 'digNear');
      if (e.type === 'leap' && s && !e.gold) mark(s, 'leap');
      if (e.type === 'dash' && s && !e.plain) mark(s, 'goldDash');
      if (e.type === 'cut' && s && e.by != null) mark(s, 'snipped');
      if (e.type === 'woodpecker') { gmark('woodpeckerCame'); for (const o of alive) mark(o, 'woodpecker'); }
      if (e.type === 'burrow' && e.dug) gmark('digBurrow');
      if (e.type === 'lastApples') gmark('lastApples');
      if (e.type === 'spawn' && e.kind === 'beetle' && e.gold) gmark('goldBeetleSpawn');
      if (e.type === 'spawn' && e.kind === 'leaf') gmark('leafSpawn');
      if (e.type === 'spawn' && e.kind === 'goldcap') gmark('goldcapSpawn');
      if (e.type === 'weather' && ['rain', 'storm', 'snow'].includes(e.kind)) gmark(e.kind);
      if (e.type === 'baked') gmark('baked');
      if (e.type === 'rainbow') gmark('rainbow');
    }
    for (const s of g.snakes) {
      if (!s.alive) continue;
      const small = s.body.length <= T.MIN_LENGTH;
      if (small && g.time > 1000) mark(s, 'atThree');
      if (E.hungerLeft(g, s) < T.HUNGER_WARN_MS * (small ? 1.5 : 1)) mark(s, 'hungry');
      const wl = s.wrapUntil - g.time;
      if (wl > 0 && wl <= T.WRAP_WARN_MS) mark(s, 'wrapEnding');
    }
    for (const s of dying) if (s.__died == null) s.__died = g.time;
  }
  roundMs.push(g.time);
  for (const s of g.snakes) {
    snakeRounds++;
    lifeMs.push(s.__died ?? g.time);
    const o = seen[s.id ?? g.snakes.indexOf(s)];
    for (const k of KEYS) if (k in o) { tally[k].n++; tally[k].first.push(o[k]); }
  }
  for (const k of GLOBAL) if (k in gseen) { glob[k].n++; glob[k].first.push(gseen[k]); }
}
const med = a => { if (!a.length) return NaN; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const s1 = ms => (ms / 1000).toFixed(0) + ' s';
console.log(`${path.basename(root)}: ${ROUNDS} rounds, ${snakeRounds} snake-rounds; round median ${s1(med(roundMs))}, a snake's life median ${s1(med(lifeMs))}`);
console.log('per snake per round (while alive): share of snake-rounds it happens in, median first time');
const out = { root: path.basename(root), rounds: ROUNDS, snakeRounds, roundMedian: med(roundMs), lifeMedian: med(lifeMs), per: {}, global: {} };
for (const k of KEYS) { const t = tally[k]; out.per[k] = { share: t.n / snakeRounds, firstMedian: med(t.first) }; console.log(`  ${k.padEnd(12)} ${(100 * t.n / snakeRounds).toFixed(1).padStart(5)}%   first ${isNaN(med(t.first)) ? '-' : s1(med(t.first))}`); }
console.log('per round (anywhere on the log)');
for (const k of GLOBAL) { const t = glob[k]; out.global[k] = { share: t.n / ROUNDS, firstMedian: med(t.first) }; console.log(`  ${k.padEnd(15)} ${(100 * t.n / ROUNDS).toFixed(1).padStart(5)}%   first ${isNaN(med(t.first)) ? '-' : s1(med(t.first))}`); }
fs.writeFileSync(path.join(__dirname, 'out', `freq-${path.basename(root)}.json`), JSON.stringify(out, null, 1));
