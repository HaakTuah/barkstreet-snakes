// Capricious's moods and Copycat's copies: the cast as a deck (POOL, once
// every rival is in), each style's short form, what a new mood or model
// forgets, and reading a snake's style from what anyone can see it do.

const POOL = Object.keys(PERSONAS);
// Capricious's deck: every other rival (its own undecided self, Drab's
// habits, is the dithering in between, not a card). A rival whose style
// needs long memory gets the short form of it for a mood's length (the
// rest play as themselves): Sovereign claims a small home and guards it,
// Colonist lays one small claim, Ouroboros coils from shorter. (Metagamer
// counters whoever it watched during the mood, Copycat shadows the leader,
// Wildcard draws a mix for the mood: each mood starts its memory afresh.)
const MOODS = POOL.filter(k => k !== 'capricious' && k !== 'drab');
const MOOD_FORMS = {
  sovereign: { ...PERSONAS.sovereign.w, home: { ...PERSONAS.sovereign.w.home, max: 5 } },
  colonist: { ...PERSONAS.colonist.w, colony: { ...PERSONAS.colonist.w.colony, radius: 3, max: 1, every: Infinity } },
  ouroboros: { ...PERSONAS.ouroboros.w, coil: { ...PERSONAS.ouroboros.w.coil, from: 7 } },
};
// What a driver remembers that's only its own: a new mood starts without it.
const MOOD_MEMORY = ['home', 'colonies', 'site', 'nextSiteAt', 'planted', 'driftAt', 'victimId', 'lureId', 'obs', 'labels', 'w', 'modelId', 'style', 'watch', 'readAs', 'readSince'];
// Copycat's copies: its model's style's habits (the short forms, as
// Capricious's), shadowing it as it goes: less pull to move the way it
// moves than plain Copycat's, so the habits show.
const COPY_MEMORY = MOOD_MEMORY.filter(k => !['modelId', 'style', 'watch', 'readAs', 'readSince'].includes(k));
const COPY_MIMIC = 40;
const COPIES = {};

// Copycat's eye for how a snake plays: only what anyone can see it do
// (no names: a person is read the same way as a rival). Over the ticks it
// watches, each snake's
//   run     moves per turn (long straight runs: Mason)
//   coiled  of its time 10 long or more, the share with its head within 3 of its tail (Ouroboros)
//   riding  the share of its time with its head within 2 of the tail end of a snake 8 or longer (Creeper)
//   apart   cells from the nearest other head, capped at 14 (Ghost)
//   near    the share of its time with another head within 4 (the aggressive: Sniper, Mute, Joker...)
//   eat     segments grown, a hundred ticks (Gobbler)
//   power   moves of more than one cell (jumps and flashes), a hundred ticks (Star)
//   spread  how far its head strays from where it mostly is (a home: Sovereign)
// and the style it's nearest to (STYLES: each rival's own, as measured by
// tools/dev/copycat-styles.js, in units of each trait's spread there).
const STYLE_TRAITS = ['run', 'coiled', 'riding', 'apart', 'near', 'eat', 'power', 'spread'];
const STYLE_MIN = 60; // (ticks watched before it judges a style)
const STYLE_HOLD = 40; // (ticks a new read of its model holds before Copycat changes style)
function watchStyles(obs, snakes, tickSeen) {
  for (const o of snakes) {
    const tick = tickSeen - (o.late || 0); // (the moment I saw it: one far off, a little before the rest, 2q)
    const ob = (obs[o.id] ||= { tick: -1, n: 0, moves: 0, turns: 0, long: 0, coiled: 0, riding: 0, apart: 0, near: 0, grown: 0, power: 0, sx: 0, sy: 0, sxx: 0, syy: 0, len: o.body.length, hx: o.body[0].x, hy: o.body[0].y, dx: o.dir.x, dy: o.dir.y });
    if (ob.tick === tick) continue;
    const last = ob.tick;
    ob.tick = tick;
    const h = o.body[0], L = o.body.length, t = o.body[L - 1];
    const step = Math.abs(h.x - ob.hx) + Math.abs(h.y - ob.hy);
    if (step > 0) { ob.moves++; if (o.dir.x !== ob.dx || o.dir.y !== ob.dy) ob.turns++; }
    if (step > 1 && step < 4 && tick === last + 1) ob.power++; // (in one tick: not the edges wrapping round, nor ticks I didn't look)
    if (L > ob.len) ob.grown += L - ob.len;
    ob.n++;
    if (L >= 10) { ob.long++; if (manhattan(h, t) <= 3) ob.coiled++; }
    let apart = 14, ride = false;
    for (const p of snakes) {
      if (p === o) continue;
      apart = Math.min(apart, manhattan(h, p.body[0]));
      if (p.body.length >= 8 && manhattan(h, p.body[p.body.length - 1]) <= 2) ride = true;
    }
    ob.apart += apart;
    if (apart <= 4) ob.near++;
    if (ride) ob.riding++;
    ob.sx += h.x; ob.sy += h.y; ob.sxx += h.x * h.x; ob.syy += h.y * h.y;
    ob.len = L; ob.hx = h.x; ob.hy = h.y; ob.dx = o.dir.x; ob.dy = o.dir.y;
  }
}
function traitsOf(ob) {
  const n = Math.max(1, ob.n), mx = ob.sx / n, my = ob.sy / n;
  return [ob.moves / Math.max(1, ob.turns), ob.coiled / Math.max(1, ob.long), ob.riding / n, ob.apart / n, ob.near / n,
    100 * ob.grown / n, 100 * ob.power / n, Math.sqrt(Math.max(0, ob.sxx / n - mx * mx + ob.syy / n - my * my))];
}
// (Measured on 200 rounds, seed 17, and read back: Star 100% as itself,
// Joker 99, Mason 98, Gobbler 88, Ouroboros 87, Ghost 86, Creeper 74,
// Vulture 73, Desperado 61, Sovereign 58, Sniper 43, Drab 29. Colonist,
// whose mark is its flags, plays like the field from outside: not a style.)
const STYLES = {
  creeper: [2.014, 0.111, 0.041, 9.118, 0.105, 3.648, 0.24, 7.41], // (317)
  desperado: [1.978, 0.111, 0.01, 9.968, 0.086, 4.039, 0.32, 8.038], // (411)
  drab: [2.029, 0.151, 0.012, 9.513, 0.079, 4.044, 0.212, 6.916], // (421)
  ghost: [1.99, 0.148, 0.01, 11.157, 0.039, 3.722, 0.226, 8.12], // (438)
  gobbler: [2.388, 0.112, 0.021, 8.398, 0.153, 4.932, 0.421, 8.006], // (377)
  joker: [1.151, 0.125, 0.012, 8.947, 0.09, 3.761, 0.212, 6.975], // (413)
  mason: [3.923, 0.162, 0.011, 10.117, 0.063, 3.478, 0.198, 7.585], // (503)
  ouroboros: [1.919, 0.489, 0.008, 9.813, 0.07, 3.864, 0.219, 6.993], // (319)
  sniper: [1.891, 0.121, 0.012, 8.983, 0.096, 3.858, 0.256, 7.053], // (413)
  sovereign: [1.857, 0.185, 0.012, 9.526, 0.082, 3.702, 0.227, 5.237], // (424)
  star: [2.074, 0.136, 0.014, 9.594, 0.085, 4.44, 1.824, 7.222], // (394)
  vulture: [1.919, 0.123, 0.022, 8.207, 0.096, 2.523, 0.268, 6.696], // (331)
};
const STYLE_SCALE = [0.202, 0.087, 0.01, 0.652, 0.035, 1.035, 0.212, 1.457];
function styleOf(ob) {
  if (!ob || ob.n < STYLE_MIN) return null;
  const f = traitsOf(ob);
  let best = null, bestD = Infinity;
  for (const key in STYLES) {
    const c = STYLES[key];
    let d = 0;
    for (let i = 0; i < f.length; i++) d += ((f[i] - c[i]) / STYLE_SCALE[i]) ** 2;
    if (d < bestD) { bestD = d; best = key; }
  }
  return best;
}
