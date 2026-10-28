// Star: a star for a head (five points round it, where a round head has
// none), the old rainbow streaming back along its body as it goes (round
// the rainbow about once a second at a segment, at 1.25 times its crawl,
// so a colour goes back over the log at a quarter of it; still while it's
// stunned; a burst as it flashes; drifting slowly where it is with
// reduced motion), the gold line round its points, and its beads in
// rainbow order. Two Stars heading right along rows 8 and 14, one
// resting, one ready; Mason (a round head) beside them. (Its tell, its
// face and its rainbow on others: below.)
const stars = await ev(`(() => {
  seeds(21);
  SnakeDebug.pinQuality(0);
  const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round((h * 60 + 360) % 360); };
  const yellow = ([r, g, b]) => r > 150 && g > 100 && b < 120 && r - b > 70 && r >= g, honey = ([r, g, b]) => r > 225 && g > 195 && b > 95 && b < 185;
  const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
  // The colours round a head, n of them, r cells out, starting straight ahead (heading right) and going round.
  const ring = (s, r, n = 72) => { const [cx, cy] = at(s), p = pixels(cx - 1.5, cy - 1.5, 3, 3), ppc = p.width / 3, out = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, j = (Math.round((1.5 + Math.sin(a) * r) * ppc) * p.width + Math.round((1.5 + Math.cos(a) * r) * ppc)) * 4; out.push([p.data[j], p.data[j + 1], p.data[j + 2]]); }
    return out; };
  // The middles of the runs of colours that pass is(), in degrees round from straight ahead.
  const runs = (ring, is) => { const n = ring.length, out = []; for (let i = 0; i < n; i++) { if (!is(ring[i]) || is(ring[(i + n - 1) % n])) continue; let j = i; while (is(ring[(j + 1) % n]) && j - i < n) j++; out.push(Math.round(((i + j) / 2 / n * 360) % 360)); } return out; };
  const seg = (s, i) => { const [cx, cy] = at(s); return rgb(cx - i + 0.04, cy + 0.04); }; // (segment i's middle, below its sheen)
  const SEGS = [2, 3, 4, 7], out = {};
  const g = stage(['star', 'star', 'mason']), [you, rest, ready] = g.snakes;
  setBody(rest, Array.from({ length: 16 }, (_, i) => [16 - i, 8]), 'right'); rest.flashReadyAt = g.time + 1e6;
  setBody(ready, Array.from({ length: 16 }, (_, i) => [16 - i, 14]), 'right'); ready.flashReadyAt = 0;
  R.setReducedMotion(true); // (its rainbow drifting slowly where it is: its neck isn't yellow, nor its points twinkling)
  __t = 7e6; show(g); drawN(20);
  out.points = [0.66, 0.7].map(r => runs(ring(rest, r), yellow));
  const still = SEGS.map(i => hue(seg(rest, i)));
  drawN(15); // (half a second on)
  const still2 = SEGS.map(i => hue(seg(rest, i)));
  drawN(60); // (two seconds more)
  out.still = { a: still, b: still2, c: SEGS.map(i => hue(seg(rest, i))) };
  R.setReducedMotion(false);
  drawN(20);
  // Going: a tick every 120 ms, 8 frames a tick (as at the opening
  // speed): segment 3's hue, and the hue on the log at a cell its body
  // lies over all the while, every other frame, unwound (degrees
  // turned). (Read off a copy of its row, not the board: read back that
  // often, the board would be moved off the GPU, and every check after
  // this one would see the CPU's drawing.)
  const turned = list => { let sum = 0; for (let i = 1; i < list.length; i++) sum += ((list[i] - list[i - 1] + 540) % 360) - 180; return Math.round(sum); };
  const board = document.getElementById('game'), copy = document.createElement('canvas'), cg = copy.getContext('2d', { willReadFrequently: true }), kk = board.width / (TUNING.GRID * ${CELL});
  copy.width = board.width; copy.height = Math.ceil(${CELL} * kk);
  const rowHue = (x, y) => { const d = cg.getImageData(Math.round(x * ${CELL} * kk), Math.round((y - 8) * ${CELL} * kk), 3, 3).data; let r = 0, gg = 0, bb = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; } return hue([r, gg, bb]); };
  const move = (s, cells = 1, events = []) => { s.prev = s.body.map(c => ({ ...c })); for (let j = 0; j < cells; j++) { const h = s.body[0]; s.body.unshift({ x: h.x + 1, y: h.y }); s.body.pop(); } g.tick++; R.onTick(events); };
  const play = (ticks, go) => {
    const s3 = [], log = [];
    for (let t = 0; t < ticks; t++) {
      go(t);
      for (let f = 1; f <= 8; f++) {
        __t += 15; R.frame(f / 8, __t);
        if (f % 2) continue;
        cg.clearRect(0, 0, copy.width, copy.height); cg.drawImage(board, 0, Math.round(8 * ${CELL} * kk), copy.width, copy.height, 0, 0, copy.width, copy.height);
        const [hx] = at(rest);
        s3.push(rowHue(hx - 3 + 0.04, 8.54)); log.push(rowHue(8.54, 8.54));
      }
    }
    return { seg: turned(s3), log: turned(log), ms: ticks * 120 };
  };
  setBody(rest, Array.from({ length: 16 }, (_, i) => [13 - i, 8]), 'right');
  drawN(10);
  out.going = play(6, () => move(rest)); // (13 to 19: cell 8 under segments 5 to 11)
  rest.stunUntil = g.tick + 20; // (stunned, it stays where it is: from the tick after, once it's no longer drawn on ahead)
  const stay = () => { rest.prev = rest.body.map(c => ({ ...c })); g.tick++; R.onTick([]); };
  play(1, stay);
  out.stunned = play(4, stay);
  rest.stunUntil = -1;
  setBody(rest, Array.from({ length: 16 }, (_, i) => [13 - i, 8]), 'right');
  drawN(10);
  out.normal = play(3, () => move(rest));
  setBody(rest, Array.from({ length: 16 }, (_, i) => [13 - i, 8]), 'right');
  drawN(10);
  out.flash = play(3, t => t ? move(rest) : move(rest, 1 + TUNING.DASH_LENGTH, [{ type: 'dash', snake: rest, x: 13, y: 8, plain: true }])); // (a flash, then on)
  // Golden powers held: the gold line round its two front points.
  rest.leaps = 2; drawN(10);
  const gold = ring(rest, 0.875, 360);
  out.gold = [-36, 36].map(d => [-2, -1, 0, 1, 2].some(k => honey(gold[(360 + d + k) % 360])));
  R.setReducedMotion(false);
  // A dead Star's beads: every other segment, round the rainbow from its head.
  const g2 = stage(['star', 'ghost', 'mason']), st = g2.snakes[1];
  setBody(st, Array.from({ length: 16 }, (_, i) => [20 - i, 10]), 'right');
  show(g2); drawN(10);
  st.alive = false; st.killer = 'wall'; st.body.forEach((c, j) => { if (j % TUNING.CORPSE_EVERY === 0) g2.food.push({ x: c.x, y: c.y, kind: 'pellet', color: st.color, owner: st.id, expires: g2.tick + 900 }); });
  g2.tick++;
  R.onTick([{ type: 'death', snake: st }]);
  drawN(90);
  out.beads = [0, 1, 2, 3, 4, 5, 6].map(n => hue(rgb(20 - n * TUNING.CORPSE_EVERY + 0.5, 10 + 0.55)));
  SnakeDebug.pinQuality(2);
  return out;
})()`);
const dh = (a, b) => Math.abs(((a - b + 540) % 360) - 180), POINTS = [36, 108, 180, 252, 324]; // (heading right, a point to the back)
check(stars.points.some(p => p.length === 5 && POINTS.every(d => p.some(m => dh(m, d) < 12))), 'Star’s head is a star: five points round it, one to the back',
  `yellow runs ${stars.points.map((p, i) => `${[0.66, 0.7][i]} cells out at ${p.join(', ')}°`).join('; ')} (a round head reaches 0.54)`);
const { a: s0, b: s1, c: s2 } = stars.still, d1 = s0.map((h, i) => dh(h, s1[i])), d2 = s0.map((h, i) => dh(h, s2[i]));
check(new Set(s0).size === 4 && d1.every(d => d <= 10) && d2.every(d => d >= 12 && d <= 45) && Math.max(...d2) - Math.min(...d2) <= 8,
  'with reduced motion, Star’s rainbow drifts slowly where it is', `hues of segments 2, 3, 4, 7: ${s0.join(', ')}, half a second on ${s1.join(', ')}, two seconds more ${s2.join(', ')}`);
const { going, stunned, normal, flash } = stars, perSec = v => Math.round(v / going.ms * 1000);
check(perSec(going.seg) >= 220 && perSec(going.seg) <= 420 && perSec(going.log) >= 25 && perSec(going.log) <= 100,
  'Star’s rainbow streams back as it goes, faster than its crawl: backward over the log, each segment round the rainbow about once a second',
  `going at 120 ms a tick: segment 3 turned ${going.seg}° (${perSec(going.seg)}° a second), the log under it ${going.log}° (${perSec(going.log)}° a second: a colour going back over it at ${(perSec(going.log) / 28 / (1000 / 120)).toFixed(2)} of its crawl)`);
check(Math.abs(stunned.seg) <= 4 && Math.abs(stunned.log) <= 4, 'stunned, it stays, and so does its rainbow', `segment 3 turned ${stunned.seg}°, the log under it ${stunned.log}°, in ${stunned.ms} ms`);
check(flash.seg >= 2 * normal.seg, 'a flash bursts its rainbow on', `segment 3 turned ${flash.seg}° in the three ticks from a flash, ${normal.seg}° in three going on`);
check(stars.gold.every(Boolean), 'holding golden powers, Star’s gold line runs round its points', `Honey just past its two front points: ${stars.gold.join(', ')}`);
const want = [0, 32, 55, 130, 205, 275, 0];
check(stars.beads.every((h, i) => dh(h, want[i]) < 22), 'a dead Star’s beads go round the rainbow from its head', `hues ${stars.beads.join(', ')} (red, orange, yellow, green, blue, violet, red: ${want.join(', ')})`);

// Star's tell is a countdown on its points: its middle always its
// sunflower; just flashed, its five points dim; they light one by one as
// its rest runs down (a point each 1.2 s), and never go out until it
// flashes again, with reduced motion too (it flashes the moment it can,
// so a star lit only while its flash was ready was dim nearly all the
// time, and with reduced motion blinked). Its twinkles burst off its
// points as it flashes, not as its flash comes back (it never holds it
// for long). Its face is upright at every heading (the mustache under its
// eyes: heading up it sat over them, as huge angry brows). Stars heading
// down, read at three of its points (its back point, up, the first to
// light, the next round, the second, and the last: the other two have
// its mustache over them) and either side of its eyes, in pixels of
// just its sunflower or its dim mustard (an inked edge over sunflower
// passes for mustard).
const tell = await ev(`(() => {
  seeds(23);
  SnakeDebug.pinQuality(0);
  const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
  const SUN = [249, 194, 46], DIM = [176, 137, 58], d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
  // Lit (1) or dim (0), r cells out from s's head at angle ang: more pixels round there of its sunflower than of its mustard.
  const lit = (s, ang, r) => { const [cx, cy] = at(s), p = pixels(cx + Math.cos(ang) * r - 0.07, cy + Math.sin(ang) * r - 0.07, 0.14, 0.14); let sun = 0, dim = 0;
    for (let i = 0; i < p.data.length; i += 4) { const c = [p.data[i], p.data[i + 1], p.data[i + 2]]; if (d2(c, SUN) < 15 * 15) sun++; else if (d2(c, DIM) < 15 * 15) dim++; }
    return sun > dim ? 1 : 0; };
  const points = s => [0, 1, 4].map(j => lit(s, (270 + 72 * j) * Math.PI / 180, 0.55)).join(''); // (its first, second and fifth)
  const middle = s => lit(s, 0, 0.33) && lit(s, Math.PI, 0.33) ? 1 : 0;
  const down = (s, x) => setBody(s, Array.from({ length: 10 }, (_, i) => [x, 14 - i]), 'down');
  const out = { now: {}, run: {} };
  for (const still of [true, false]) {
    R.setReducedMotion(still);
    const how = still ? 'reduced' : 'lively';
    // Just flashed, half rested, rested.
    const g = stage(['star', 'star', 'star']), [, a, b2, c] = g.snakes;
    down(a, 6); down(b2, 12); down(c, 18);
    a.flashReadyAt = g.time + 6000; b2.flashReadyAt = g.time + 3000; c.flashReadyAt = g.time;
    show(g); drawN(20);
    out.now[how] = [a, b2, c].map(s => ({ points: points(s), middle: middle(s) }));
    // A whole rest, a frame every 100 ms of the game's clock: its points lit, and its middle.
    const g2 = stage(['star', 'mason', 'ghost']), st = g2.snakes[1];
    down(st, 12);
    st.flashReadyAt = g2.time + 6000;
    show(g2); drawN(20, 0.5, 100);
    const run = [];
    for (let t = 0; t <= 6500; t += 100) { g2.time = 60000 + t; drawN(1, 0.5, 100); run.push([t, points(st).split('').reduce((n, v) => n + +v, 0), middle(st)]); }
    out.run[how] = run;
  }
  // The burst: its flash comes back (no burst), then it flashes (a burst), lively.
  R.setReducedMotion(false);
  const white = s => { const [cx, cy] = at(s), p = pixels(cx - 1.2, cy - 1.2, 2.4, 2.4); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (p.data[i] > 240 && p.data[i + 1] > 240 && p.data[i + 2] > 240) n++; return n; };
  const g3 = stage(['star', 'mason', 'ghost']), st3 = g3.snakes[1];
  down(st3, 12);
  st3.flashReadyAt = g3.time + 100;
  show(g3); drawN(20);
  const base = white(st3);
  g3.time += 200; // (its flash back)
  let back = 0; for (let i = 0; i < 8; i++) { drawN(1); back = Math.max(back, white(st3) - base); }
  st3.flashReadyAt = g3.time + 6000; g3.tick++;
  R.onTick([{ type: 'dash', snake: st3, x: 12, y: 11, n: 3, plain: 1 }]); // (it flashes)
  let flash = 0; for (let i = 0; i < 8; i++) { drawN(1); flash = Math.max(flash, white(st3) - base); }
  out.burst = { base, back, flash };
  R.setReducedMotion(false);
  SnakeDebug.pinQuality(2);
  return out;
})()`);
for (const how of ['reduced', 'lively']) {
  const [spent, half, full] = tell.now[how];
  check(spent.points === '000' && half.points === '110' && full.points === '111' && spent.middle && half.middle && full.middle,
    `Star’s tell, ${how === 'reduced' ? 'with reduced motion' : 'lively'}: just flashed its points are dim, half rested the first two lit, rested all, its middle lit throughout`,
    `its first, second and fifth points ${spent.points}, ${half.points}, ${full.points}; its middle ${spent.middle}${half.middle}${full.middle}`);
  const run = tell.run[how], steps = run.filter((r, i) => i && r[1] !== run[i - 1][1]), when = [1200, 2400, 6000];
  check(run[0][1] === 0 && run.every(r => r[2]) && steps.length === 3 && steps.every((r, i) => r[1] === i + 1 && Math.abs(r[0] - when[i]) <= 250),
    `Star’s tell, ${how === 'reduced' ? 'with reduced motion' : 'lively'}: through a rest its points light in turn, a point each 1.2 s, none going out, its middle lit`,
    `its first, second and fifth points lit (ms into the rest: how many) ${steps.map(r => `${r[0]}: ${r[1]}`).join(', ')}; middle dim in ${run.filter(r => !r[2]).length} of ${run.length} frames`);
}
check(tell.burst.flash > 150 && tell.burst.back * 3 < tell.burst.flash, 'Star’s twinkles burst off its points as it flashes, not as its flash comes back',
  `white pixels round its head over a few frames: ${tell.burst.back} as its flash came back, ${tell.burst.flash} as it flashed (${tell.burst.base} before)`);
// Its face at each heading, half rested (no twinkles) and held still, on
// a sharper board (more pixels to its mustache): the white past the reach
// of its brows (and eyes) is its mustache's ends, and sits under its middle.
await b.viewport(800, 800, { scale: 2 });
await ev('__settle()');
const face = await ev(`(() => {
  seeds(28);
  SnakeDebug.pinQuality(2);
  R.setReducedMotion(true);
  const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
  const g = stage(['star', 'star', 'star']), heads = g.snakes;
  setBody(heads[0], Array.from({ length: 8 }, (_, i) => [5, 8 + i]), 'up');
  setBody(heads[1], Array.from({ length: 8 }, (_, i) => [12, 15 - i]), 'down');
  setBody(heads[2], Array.from({ length: 8 }, (_, i) => [8 + i, 20]), 'left');
  setBody(heads[3], Array.from({ length: 8 }, (_, i) => [20 - i, 4]), 'right');
  heads[0].persona = heads[1].persona; heads[0].personaKey = 'star'; heads[0].memory = {}; // (you, as a Star)
  for (const s of heads) s.flashReadyAt = g.time + 3000;
  show(g); R.setViewer(99); drawN(20);
  const out = heads.map(s => { const [cx, cy] = at(s), p = pixels(cx - 1, cy - 1, 2, 2); let n = 0, sy = 0;
    for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
      const i = (y * p.width + x) * 4, mn = Math.min(p.data[i], p.data[i + 1], p.data[i + 2]), mx = Math.max(p.data[i], p.data[i + 1], p.data[i + 2]);
      if (mn > 185 && mx - mn < 45 && Math.abs(x / p.width * 2 - 1) > 0.36) { n++; sy += y; } // (whitish, more than 0.36 cells to either side)
    }
    return { n, below: n ? +((sy / n) / p.height * 2 - 1).toFixed(2) : 0 }; }); // (cells below its middle)
  R.setReducedMotion(false);
  return out;
})()`);
check(face.every(f => f.n >= 6 && f.below > 0.1), 'Star’s face is upright at every heading: its mustache under its eyes',
  `its mustache’s ends (pixels, cells below the head’s middle), heading up, down, left, right: ${face.map(f => `${f.n}, ${f.below}`).join('; ')}`);

// Star's gag is its mustache (round six A; it flicked out a star on a
// ribbon of rainbow, which the owner didn't like): half way through it,
// the mustache's ends have twirled up beside its eyes, and nothing bright
// has come out past its chin (only a pale puff of breath). Copycat
// copying it holds up a stick-on mustache under its nose instead. Star
// heading down (its face upright, its chin down), Copycat heading right.
const gag = await ev(`(() => {
  seeds(29);
  SnakeDebug.pinQuality(2);
  R.setReducedMotion(false);
  const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
  const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
  const white = (r, g, b) => Math.min(r, g, b) > 200 && Math.max(r, g, b) - Math.min(r, g, b) < 40, bright = (r, g, b) => Math.max(r, g, b) > 150 && Math.max(r, g, b) - Math.min(r, g, b) > 90;
  const g = stage(['star', 'copycat', 'mason']), [, st, cc] = g.snakes;
  setBody(st, Array.from({ length: 8 }, (_, i) => [8, 9 - i]), 'down'); st.flashReadyAt = g.time + 3000; // (half rested: no twinkles)
  setBody(cc, Array.from({ length: 8 }, (_, i) => [13 - i, 16]), 'right'); cc.memory.modelId = st.id;
  show(g); R.setViewer(99); drawN(20);
  const look = () => { const [x, y] = at(st), [cx, cy] = at(cc);
    return { beside: count(x - 0.74, y - 0.14, 0.3, 0.26, white) + count(x + 0.44, y - 0.14, 0.3, 0.26, white), past: count(x - 0.45, y + 0.86, 0.9, 0.6, bright), nose: count(cx + 0.18, cy - 0.32, 0.36, 0.64, white) }; };
  const rest = look();
  R.flick(st, 0.5); R.flick(cc, 0.5); drawN(1, 0.5, 0.01);
  return { rest, mid: look() };
})()`);
check(gag.mid.beside > 3 * gag.rest.beside + 12 && gag.mid.past === 0 && gag.rest.past === 0, 'Star’s gag is its mustache: its ends twirl up beside its eyes, and nothing comes out past its chin',
  `white beside its eyes ${gag.rest.beside} at rest, ${gag.mid.beside} half way through; bright pixels past its chin ${gag.rest.past}, ${gag.mid.past}`);
check(gag.mid.nose > gag.rest.nose + 12, 'Copycat copying Star holds up a stick-on mustache', `white at its nose ${gag.rest.nose} at rest, ${gag.mid.nose} half way through its flick`);

// Star's rainbow on others: Copycat copying Star wears a pale copy of it,
// flowing as Star's does (its tint of Star's stand-in colour in text was
// a pale gold all over, that read as a power and hid its gold line), and
// the shockwave Star goes off with is its rainbow, not that gold (with
// reduced motion, the ring's there at once: read round its lower half,
// clear of the word over its head).
const bows = await ev(`(() => {
  seeds(30);
  SnakeDebug.pinQuality(0);
  const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round((h * 60 + 360) % 360); };
  const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
  const seg = (s, i) => { const [cx, cy] = at(s); return rgb(cx - i + 0.04, cy + 0.04); };
  const SEGS = [2, 3, 4, 7], out = {};
  R.setReducedMotion(false);
  const g = stage(['copycat', 'star', 'mason']), [, cc, st] = g.snakes;
  setBody(st, Array.from({ length: 12 }, (_, i) => [16 - i, 8]), 'right');
  setBody(cc, Array.from({ length: 12 }, (_, i) => [16 - i, 14]), 'right'); cc.memory.modelId = st.id;
  show(g); drawN(20);
  out.copy = SEGS.map(i => seg(cc, i));
  out.star = SEGS.map(i => seg(st, i));
  out.tint = R.colorOf(cc);
  { const [hx, hy] = at(cc); out.head = rgb(hx + 0.02, hy + 0.3); } // (its head, below its eye: half the rainbow's hue there, half its own red)
  // Copying a plain colour (Metagamer's cyan), its head is half that, half its
  // red, in a thin red rim; copying no one, all red.
  const g3 = stage(['copycat', 'metagamer', 'mason']), [, c3, mg] = g3.snakes;
  setBody(mg, Array.from({ length: 8 }, (_, i) => [16 - i, 8]), 'right');
  setBody(c3, Array.from({ length: 8 }, (_, i) => [16 - i, 14]), 'right'); c3.memory.modelId = mg.id;
  show(g3); drawN(5);
  const scan = (s) => { const [hx, hy] = at(s); return Array.from({ length: 12 }, (_, k) => rgb(hx + 0.02, hy + 0.3 + k * 0.02)); };
  { const [hx, hy] = at(c3); out.mixed = rgb(hx + 0.02, hy + 0.3); }
  out.rimScan = scan(c3);
  out.model = mg.color;
  c3.memory.modelId = null; drawN(2);
  { const [hx, hy] = at(c3); out.alone = rgb(hx + 0.02, hy + 0.3); }
  // Star out: its shockwave, held still (reduced motion), a moment on.
  R.setReducedMotion(true);
  const g2 = stage(['star', 'ghost', 'mason']), s2 = g2.snakes[1];
  setBody(s2, Array.from({ length: 12 }, (_, i) => [16 - i, 12]), 'right');
  show(g2); drawN(5);
  s2.alive = false; s2.killer = 'wall'; g2.tick++;
  R.onTick([{ type: 'death', snake: s2 }]);
  drawN(1);
  const [hx, hy] = [16.5, 12.5], rr = 2.25; // (its ring, held at half its reach)
  out.ring = [0, 60, 120, 180].map(d => hue(rgb(hx + Math.cos(d * Math.PI / 180) * rr - 0.06, hy + Math.sin(d * Math.PI / 180) * rr - 0.06)));
  R.setReducedMotion(false);
  SnakeDebug.pinQuality(2);
  return out;
})()`);
const hueOf = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round((h * 60 + 360) % 360); };
const copyHues = bows.copy.map(hueOf), starHues = bows.star.map(hueOf), paler = bows.copy.every((c, i) => Math.min(...c) > Math.min(...bows.star[i]) + 20);
check(new Set(copyHues).size === 4 && copyHues.every((h, i) => dh(h, starHues[i]) < 14) && paler && bows.tint !== '#f3d577',
  'Copycat copying Star wears a pale copy of its rainbow, flowing with Star’s, not a pale gold',
  `hues of segments 2, 3, 4, 7: ${copyHues.join(', ')} (Star’s ${starHues.join(', ')}); ${JSON.stringify(bows.copy)} against ${JSON.stringify(bows.star)}; its colour ${bows.tint}`);
const [hr, hg, hb] = bows.head;
const far = (c, w) => Math.hypot(c[0] - w[0], c[1] - w[1], c[2] - w[2]);
const FLAG = [222, 41, 16], hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
const halfModel = hex(bows.model).map((v, k) => Math.round((v + FLAG[k]) / 2));
const other = bows.head.map((v, k) => 2 * v - FLAG[k]); // (what's mixed with its red: a hue of Star's rainbow, hsl(h, 85%, 62%), 240 at most and 76 at least)
check(Math.abs(Math.max(...other) - 240) < 30 && Math.abs(Math.min(...other) - 76) < 30, 'copying Star, Copycat’s head is half the rainbow, half its own red',
  `its head ${bows.head.join(', ')}, so mixed with ${other.join(', ')} (its own #de2910 is 222, 41, 16)`);
check(far(bows.mixed, halfModel) < 40 && far(bows.mixed, FLAG) > 40, 'copying Metagamer, Copycat’s head is half its cyan, half its red',
  `its head ${bows.mixed.join(', ')}; half and half ${halfModel.join(', ')} (Metagamer ${bows.model})`);
check(bows.rimScan.some(c => (Math.max(...c) - Math.min(...c)) / Math.max(...c) > 0.55 && hueOf(c) < 20), 'copying, a thin red rim keeps Copycat’s grey head (half cyan, half red) its own', `down its chin: ${JSON.stringify(bows.rimScan)}`);
check(far(bows.alone, FLAG) < 40, 'copying no one, Copycat’s head is all the flag’s red', `its head ${bows.alone.join(', ')}`);
const ringWant = [32, 55, 130, 205]; // (orange, yellow, green, blue: the arcs at 0°, 60°, 120° and 180°)
check(bows.ring.every((h, i) => dh(h, ringWant[i]) < 25), 'Star goes off in a ring of its rainbow, not its stand-in gold',
  `the ring’s hues at 0°, 60°, 120°, 180°: ${bows.ring.join(', ')} (want about ${ringWant.join(', ')})`);
await b.viewport(800, 800);
await ev('__settle()');
