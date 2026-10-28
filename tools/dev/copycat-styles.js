// Measures each rival's style as Copycat reads it (ai.js's watchStyles and
// traitsOf: what anyone can see a snake do), for ai.js's STYLES: plays
// rounds of every rival, watching every snake from the start, and takes
// each one's traits every CHECK ticks once it has been watched STYLE_MIN.
// Prints each rival's mean traits, each trait's spread within a rival (the
// scale), and how often styleOf reads each rival as itself.
//   node tools/dev/copycat-styles.js [root] [rounds] [seed]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const rounds = +(process.argv[3] || 200), seed = +(process.argv[4] || 5);
let a = seed >>> 0;
const rng = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const M = Object.create(Math); M.random = rng;
const ctx = vm.createContext({ window: {}, console, Math: M });
for (const f of ['tuning.js', 'ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const { SnakeEngine: E, SnakeAI: AI } = ctx.window;
const CHECK = 150, MIN = 60;
const samples = {}; // persona -> [traits]
for (let r = 0; r < rounds; r++) {
  const g = E.createGame({ withPlayer: false });
  const obs = {};
  while (g.snakes.filter(s => s.alive).length > 1 && g.time < 600000) {
    E.step(g);
    const alive = g.snakes.filter(s => s.alive);
    AI.watchStyles(obs, alive, g.tick);
    if (g.tick % CHECK === 0) for (const s of alive) if (obs[s.id].n >= MIN) (samples[s.personaKey] ||= []).push(AI.traitsOf(obs[s.id]));
  }
}
// (The styles it copies: not the rivals that are a mix of others (Capricious, Copycat, Wildcard), nor
// those that look like another from outside (Mute plays as Sniper does; Metagamer, as Drab).)
const STYLE_SET = ['colonist', 'creeper', 'desperado', 'drab', 'ghost', 'gobbler', 'joker', 'mason', 'ouroboros', 'sniper', 'sovereign', 'star', 'vulture'];
const all = Object.keys(samples).sort(), keys = all.filter(k => STYLE_SET.includes(k)), T = AI.STYLE_TRAITS.length;
const mean = xs => xs.reduce((p, x) => p.map((v, i) => v + x[i] / xs.length), Array(T).fill(0));
const centre = Object.fromEntries(keys.map(k => [k, mean(samples[k])]));
const scale = Array.from({ length: T }, (_, i) => {
  let ss = 0, n = 0;
  for (const k of keys) for (const x of samples[k]) { ss += (x[i] - centre[k][i]) ** 2; n++; }
  return Math.sqrt(ss / Math.max(1, n));
});
const r3 = v => +v.toFixed(3);
console.log('STYLE_TRAITS', AI.STYLE_TRAITS.join(' '));
console.log('STYLES = {'); for (const k of keys) console.log(`  ${k}: [${centre[k].map(r3).join(', ')}], // (${samples[k].length})`); console.log('}');
console.log('STYLE_SCALE = [' + scale.map(r3).join(', ') + ']');
// How often each is read as itself, with these (the nearest, scaled).
const near = x => { let b = null, bd = Infinity; for (const k of keys) { let d = 0; for (let i = 0; i < T; i++) d += ((x[i] - centre[k][i]) / scale[i]) ** 2; if (d < bd) { bd = d; b = k; } } return b; };
for (const k of all) {
  const got = {}; for (const x of samples[k]) { const n = near(x); got[n] = (got[n] || 0) + 1; }
  const top = Object.entries(got).sort((p, q) => q[1] - p[1]).slice(0, 3).map(([n, c]) => `${n} ${Math.round(100 * c / samples[k].length)}%`).join(', ');
  console.log(`${k.padEnd(11)} read as: ${top}`);
}
