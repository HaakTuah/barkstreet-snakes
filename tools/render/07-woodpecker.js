// ------------------------------------------- a woodpecker you can believe
// Round six A's woodpecker, staged on a held board at a laptop's size
// (its own layer's pixels and the renderer's account of its pose):
// - resting, its eye follows what moves near it: its pupil, read off its
//   layer, turns toward your head moved above it, then below it;
// - through the aim its head turns to its marked patch (its beak toward
//   it, more than resting), its eye on it, and tilts this way and that;
// - it drums a blow on each knock of the drum (SnakeAudio.drumBlows, one
//   table), its beak on the spot at each and drawn back between, the
//   last on the strike's tick; and in a real round the game starts the
//   drum you hear so its last knock lands on the strike as drawn, and
//   says "kik!" as it lands back on its perch, as drawn;
// - its layer is the board and the room round it (not the page), and a
//   phone's address bar coming and going never makes it again;
// - with reduced motion, no wingbeats (its wings still through a flight,
//   one glide) and no bob, and fewer, slower blows, the last still on
//   the strike.
await b.viewport(1280, 800);
await b.go(site.url + '?debug', { settle: 0 });
await ev('__settle()');
await ev(STAGE);
const BIRD = n => `
  seeds(${n});
  const g = show(stage(['gobbler', 'ghost', 'mason'])), N = TUNING.GRID;
  g.time = TUNING.SUDDEN_DEATH_MS + 5000; g.tick = 2000;
  g.snakes.forEach((s, i) => setBody(s, [[4 + 4 * i, 23], [3 + 4 * i, 23], [2 + 4 * i, 23]], 'right'));
  const ms = E.tickMs(g), L = document.getElementById('bird-layer');
  // (drawn m ms before its strike, or with after, m ms after it: the tick and how far through it)
  const at = (m, n = 1, step = 16) => { const K = Math.ceil(m / ms); g.woodpecker.strikeAt = g.tick - 1 + K; drawN(n, K - m / ms, step); return R.birdPose(); };
  const after = (m, n = 1) => { const K = Math.floor(m / ms); Object.assign(g.woodpecker, { struckAt: g.tick - 1 - K, strikeAt: g.tick - 1 - K, restUntil: g.tick - 1 - K + TUNING.PECK_REST_MIN }); drawN(n, m / ms - K, 16); return R.birdPose(); };
  const rest = spot => { g.woodpecker = { x: spot % N, y: Math.floor(spot / N), at: g.time - 9000, target: [], strikeAt: -1, last: [spot], struckAt: g.tick - 400, restUntil: g.tick + 1e6, pecks: 2 }; };
  const aim = (spot, from, pecks = 1) => { g.woodpecker = { x: spot % N, y: Math.floor(spot / N), at: g.time - 9000, target: [spot], strikeAt: g.tick + 17, last: [from], struckAt: g.tick - 60, restUntil: g.tick, pecks }; drawN(1); return R.birdPlan(); };
  const cellNear = (x, y) => [Math.max(0, Math.min(N - 1, Math.round(x / 32 - 0.5))), Math.max(0, Math.min(N - 1, Math.round(y / 32 - 0.5)))];
`;
const eye = await ev(`(() => {
  ${BIRD(0)}
  R.setReducedMotion(false);
  const home = 12 * N + 22; // (it rests by (22, 12), beside the board)
  rest(home); drawN(30);
  const p0 = R.birdPose(), out = [];
  for (const dy of [-6, 6]) {
    const [x, y] = cellNear(p0.eyeAt[0] + 32 * 4 * p0.flip, p0.eyeAt[1] + 32 * dy), you = g.snakes[0];
    setBody(you, [[x, y], [x, Math.min(N - 1, y + 1)], [x, Math.min(N - 1, y + 2)]], 'up');
    drawN(70, 0.5, 16);
    const p = R.birdPose(), d = L.getContext('2d').getImageData(Math.round(p.eye[0] - p.eye[2]), Math.round(p.eye[1] - p.eye[2]), Math.round(2 * p.eye[2]), Math.round(2 * p.eye[2])).data, W = Math.round(2 * p.eye[2]);
    let sx = 0, sy = 0, n = 0; // (the pupil: the dark pixels inside the eye's white)
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4; if (d[k + 3] > 200 && d[k] + d[k + 1] + d[k + 2] < 120 && (i - W / 2) ** 2 + (j - W / 2) ** 2 < (W / 2 - 1) ** 2) { sx += i; sy += j; n++; } }
    const ox = n ? sx / n - W / 2 + 0.5 : 0, oy = n ? sy / n - W / 2 + 0.5 : 0, tx = x * 32 + 16 - p.eyeAt[0], ty = y * 32 + 16 - p.eyeAt[1];
    out.push({ dy, dark: n, off: [+ox.toFixed(2), +oy.toFixed(2)], cos: +((ox * tx + oy * ty) / (Math.hypot(ox, oy) * Math.hypot(tx, ty) || 1)).toFixed(2), r: +p.eye[2].toFixed(1) });
  }
  g.snakes[0].body = [[4, 23], [3, 23], [2, 23]].map(([x, y]) => ({ x, y }));
  return out;
})()`);
check(eye.every(e => e.dark > 3 && e.cos > 0.7) && eye[0].off[1] < 0 && eye[1].off[1] > 0, 'resting, the woodpecker’s eye follows your head moving near it: its pupil turns up to it above, then down to it below',
  eye.map(e => `${e.dy < 0 ? 'above' : 'below'}: pupil ${e.off.join(', ')} px off the middle (eye ${e.r} px), toward the head by cos ${e.cos}`).join('; '));

const look = await ev(`(() => {
  ${BIRD(1)}
  const home = 12 * N + 22, spot = 4 * N + 6;
  rest(home); drawN(40);
  const tx = 6 * 32 + 16, ty = 4 * 32 + 16, toward = p => { const hx = p.eyeAt[0], hy = p.eyeAt[1], bx = p.beak[0] - hx, by = p.beak[1] - hy, dx = tx - hx, dy = ty - hy; return (bx * dx + by * dy) / (Math.hypot(bx, by) * Math.hypot(dx, dy)); };
  const resting = toward(R.birdPose());
  const plan = aim(spot, home), m = (plan.depart + 200 + plan.aim - plan.hop) / 2;
  const turns = new Set(), seen = [];
  for (let f = 0; f < 50; f++) { const p = at(m, 1, 16); turns.add(Math.round(p.turn * 20)); seen.push(p); }
  const p = seen[seen.length - 1], gaze = (p.gaze[0] * (tx - p.eyeAt[0]) + p.gaze[1] * (ty - p.eyeAt[1])) / Math.hypot(tx - p.eyeAt[0], ty - p.eyeAt[1]);
  return { resting: +resting.toFixed(2), aiming: +toward(p).toFixed(2), gaze: +gaze.toFixed(2), turns: turns.size, phase: p.phase };
})()`);
check(look.phase === 'eye' && look.aiming > 0.85 && look.gaze > 0.9 && look.turns >= 2, 'through the aim, the woodpecker’s head turns to its marked patch, tilting this way and that, its eye on it',
  `its beak toward the patch by cos ${look.resting} resting, ${look.aiming} aiming (${look.phase}); its eye by cos ${look.gaze}; ${look.turns} head angles in 0.8 s`);

const blows = await ev(`(() => {
  ${BIRD(2)}
  const spot = 10 * N + 9, tx = 9 * 32 + 16, ty = 10 * 32 + 16;
  rest(spot); drawN(10);
  const plan = aim(spot, spot), table = SnakeAudio.drumBlows(1), D = table[table.length - 1];
  const dist = p => Math.hypot(p.beak[0] - tx, p.beak[1] - ty), out = { n: plan.times.length, table: table.length, same: plan.times.every((t, i) => t === table[i] - D), on: [], off: [] };
  for (let i = 0; i < plan.times.length; i++) {
    const p = at(-plan.times[i]); out.on.push(+dist(p).toFixed(1)); // (on a blow: its beak on the spot)
    if (i) out.off.push(+dist(at(-(plan.times[i] + plan.times[i - 1]) / 2)).toFixed(1)); // (between: drawn back)
  }
  const before = at(4), last = at(0);
  out.before = { blows: before.blows, d: +dist(before).toFixed(1) }; out.last = { blows: last.blows, phase: last.phase, d: +dist(last).toFixed(1), tp: last.tp, strikeAt: g.woodpecker.strikeAt };
  // (the strike's tick: the patch a hole now, its head pulled out)
  g.woodpecker.target = []; g.woodpecker.last = [spot];
  const hole = after(0); out.hole = { phase: hole.phase, d: +dist(hole).toFixed(1) };
  const pulled = after(60); out.pulled = { phase: pulled.phase, d: +dist(pulled).toFixed(1) };
  return out;
})()`);
check(blows.n === blows.table && blows.same && blows.on.every(d => d < 3) && blows.off.every(d => d > 6), 'drumming, the woodpecker strikes a blow on each knock of the drum (one table for both), its beak on the spot at each and drawn back between',
  `${blows.n} blows, ${blows.table} knocks; its beak ${Math.max(...blows.on)} units off the spot at most on a blow, ${Math.min(...blows.off)} at least between`);
check(blows.before.blows === blows.n - 1 && blows.last.blows === blows.n && blows.last.d < 3 && blows.last.tp === blows.last.strikeAt && blows.hole.phase === 'linger' && blows.hole.d < 3 && blows.pulled.d > 6,
  'its last blow lands on the strike’s tick, as the patch gives way, and then it pulls its head out of the hole',
  `4 ms before: blow ${blows.before.blows} of ${blows.n}; on the tick: blow ${blows.last.blows}, its beak ${blows.last.d} units off; the strike made: ${blows.hole.phase}, ${blows.hole.d} units off, 60 ms on ${blows.pulled.d}`);

// On a cell with a snake lying on it, it pecks beside the body, not on
// it: its beak, at every blow and as it pulls out of the hole, on the
// free edge or corner farthest from the body (a body straight across:
// the edge beside it, where it's nearest the bird; a tail ending there:
// a corner past the tip), clear of the body as drawn. On an empty cell, the middle, as
// the test above has it.
const beside = await ev(`(() => {
  ${BIRD(5)}
  const spot = 10 * N + 9, tx = 9 * 32 + 16, ty = 10 * 32 + 16, you = g.snakes[0];
  const out = {};
  for (const [name, cells, dir] of [['across', [[11, 10], [10, 10], [9, 10], [8, 10], [7, 10]], 'right'], ['tail', [[9, 7], [9, 8], [9, 9], [9, 10]], 'up']]) {
    setBody(you, cells, dir);
    rest(spot); drawN(10);
    const plan = aim(spot, spot), n = you.body.length;
    const clear = p => { let least = Infinity; for (let i = 0; i < n; i++) { const a = you.body[i], b = you.body[Math.min(n - 1, i + 1)], ax = a.x * 32 + 16, ay = a.y * 32 + 16, dx = (b.x - a.x) * 32, dy = (b.y - a.y) * 32, l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / l2)) : 0, r = (i === 0 ? 0.54 : 0.44 - 0.1 * i / (n - 1)) * 32; least = Math.min(least, Math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy) - r); } return least; };
    at(plan.depart - 10); // (it sets off: its aim settled on the way in)
    const on = plan.times.map(t => at(-t).beak);
    g.woodpecker.target = []; g.woodpecker.last = [spot];
    const hole = after(0).beak;
    out[name] = { off: on.map(p => [+(p[0] - tx).toFixed(1), +(p[1] - ty).toFixed(1)]), clear: +Math.min(...on.map(clear)).toFixed(1), inCell: on.every(p => Math.abs(p[0] - tx) < 16 && Math.abs(p[1] - ty) < 16), hole: [+(hole[0] - tx).toFixed(1), +(hole[1] - ty).toFixed(1)], holeClear: +clear(hole).toFixed(1) };
  }
  setBody(you, [[4, 23], [3, 23], [2, 23]], 'right');
  return out;
})()`);
check(['across', 'tail'].every(k => beside[k].inCell && beside[k].clear > 0 && beside[k].holeClear > 0) && Math.abs(beside.across.off[0][1]) > 13 && beside.tail.off[0][1] > 12 && Math.abs(beside.tail.off[0][0]) > 12,
  'on a cell with a snake lying on it, the woodpecker pecks beside the body, not on it: the free edge beside a body across it, a corner past a tail’s tip, clear of the body at every blow and as it pulls out',
  ['across', 'tail'].map(k => `${k}: its beak at ${beside[k].off[0].join(', ')} units from the middle, ${beside[k].clear} clear of the body at the closest blow, ${beside[k].holeClear} as the strike is made`).join('; '));

// Drumming, it never hides where the food in its mark will land (the
// ring is a promise you plan by): a patch of 3 by 4 with the spot at
// (6, 10), the bird coming from the right. Clinging as it came, it's
// over (8, 11); with an apple whose ring is (8, 11),
// it clings the other way, the ring clear, its beak still on the spot.
// Held to the one way it came (since 2c's bigger bird finds a way nearly
// clear of any rings round it), with apples both sides: the ring it covers
// is drawn over it (its layer at the ring, with and without), and so is a
// piece in the air under it.
const promise = await ev(`(() => {
  ${BIRD(3)}
  const lg = L.getContext('2d');
  const px = (bx, by) => { const z = R.birdPose().layer, k = z.W / z.w, bd = document.getElementById('game').getBoundingClientRect(), c = bd.width / (N * 32); const x = Math.round((bd.left + bx * c - z.x) * k), y = Math.round((bd.top + by * c - z.y) * k); return x < 0 || y < 0 || x >= L.width || y >= L.height ? [0, 0, 0, 0] : Array.from(lg.getImageData(x, y, 1, 1).data); }; // (its layer's pixel at a board point)
  const ringPts = (x, y, r) => Array.from({ length: 32 }, (_, q) => [(x + 0.5) * 32 + Math.cos(q * Math.PI / 16) * r, (y + 0.5) * 32 + Math.sin(q * Math.PI / 16) * r]);
  const covered = (x, y) => ringPts(x, y, 12).filter(([bx, by]) => px(bx, by)[3] > 128).length;
  const differ = (a, b) => a.filter((c, i) => c[3] > 128 && Math.abs(c[0] - b[i][0]) + Math.abs(c[1] - b[i][1]) + Math.abs(c[2] - b[i][2]) > 30).length;
  const P = []; for (let y = 9; y <= 12; y++) for (let x = 5; x <= 7; x++) P.push(y * N + x);
  const spot = 10 * N + 6, lands = () => E.knocks(g, P).filter(k => k.to).map(k => [k.to.x, k.to.y]);
  const mark = foods => { g.tick++; g.food = foods.map(([x, y]) => ({ x, y, kind: 'food', expires: g.tick + 900 })); g.woodpecker = { x: 6, y: 10, at: g.time - 9000, target: P, strikeAt: g.tick + 17, last: [spot], struckAt: g.tick - 60, restUntil: g.tick, pecks: 1 }; drawN(3); return R.birdPlan(); };
  const out = {};
  const ways = [1, -1].map(f => drumPoseAt(spot, f)), alts = ways.map(d => d.alts);
  ways.forEach(d => { d.alts = [d]; }); // (as it came: since 2k it weighs its mark's tiles and the heads too, so an empty mark needn't leave it so)
  let plan = mark([]), pose = at(-plan.times[3]);
  out.came = { flip: pose.flip, phase: pose.phase, covered: covered(8, 11) };
  ways.forEach((d, i) => { d.alts = alts[i]; });
  plan = mark([[7, 11]]); out.lands1 = lands(); pose = at(-plan.times[3]);
  out.one = { flip: pose.flip, phase: pose.phase, covered: covered(8, 11), beak: +Math.hypot(pose.beak[0] - 6.5 * 32, pose.beak[1] - 10.5 * 32).toFixed(1) };
  for (const f of [1, -1]) { const d = drumPoseAt(spot, f); d.alts = [d]; } // (no other way to cling: since 2c's bigger bird finds one nearly clear of any rings round it)
  plan = mark([[5, 11], [7, 11]]); out.lands2 = lands(); pose = at(-plan.times[3]);
  const hid = out.lands2.map(([x, y]) => ({ x, y, n: covered(x, y) })).sort((a, b) => b.n - a.n)[0], t = __t;
  // (its ring's pixels on its stroke at every pulse: r 11.5 to 12.8, 3.4 px wide)
  const ring = () => ringPts(hid.x, hid.y, 11.5).concat(ringPts(hid.x, hid.y, 12.5)).map(([bx, by]) => px(bx, by));
  const u = Math.ceil(-plan.times[3] / ms) + plan.times[3] / ms; // (the same moment of the blow as it was measured at: since 2k, bigger, the ring is under its head, which moves between blows)
  R.birdOver(false); R.birdFrame(u, t); const off = ring();
  R.birdOver(true); R.birdFrame(u, t); const on = ring();
  out.two = { phase: R.birdPose().phase, hid, under: off.filter(c => c[3] > 128).length, over: differ(off, on) };
  let cell = null; // (under its body, a piece's height clear of the rings)
  for (let y = 6; y <= 17 && !cell; y++) for (let x = 0; x < N && !cell; x++) {
    if (P.includes(y * N + x) || out.lands2.some(([lx, ly]) => Math.hypot(lx - x, ly + 0.6 - y) < 0.8)) continue;
    if ([[0.5, 0.5], [0.5, -0.1], [0.2, -0.1], [0.8, -0.1]].every(([dx, dy]) => px((x + dx) * 32, (y + dy) * 32)[3] > 200)) cell = [x, y];
  }
  g.food.push({ x: cell[0], y: cell[1], kind: 'food', expires: g.tick + 900 });
  R.onTick([{ type: 'knock', kind: 'food', x: cell[0], y: cell[1], tx: cell[0], ty: cell[1] }]); // (tossed up where it lies: half way, at the top of its hop)
  const cx = (cell[0] + 0.5) * 32, cy = (cell[1] - 0.1) * 32, disc = () => { const o = []; for (let dy = -8; dy <= 8; dy += 2) for (let dx = -8; dx <= 8; dx += 2) if (dx * dx + dy * dy <= 64) o.push(px(cx + dx, cy + dy)); return o; };
  R.birdOver(false); R.birdFrame(0.5, t + 160); const off2 = disc();
  R.birdOver(true); R.birdFrame(0.5, t + 160); const on2 = disc();
  out.air = { cell, under: off2.filter(c => c[3] > 128).length, of: off2.length, over: differ(off2, on2) };
  g.food = [];
  return out;
})()`);
{
  const { came, one, two, air } = promise;
  check(came.phase === 'drum' && came.covered > 8 && // (a quarter of the ring and more: since 2k, bigger, its head is over it rather than its body, 10 of 32 at 1.6)
    one.phase === 'drum' && JSON.stringify(promise.lands1) === '[[8,11]]' && one.covered === 0 && one.flip !== came.flip && one.beak < 3,
    'drumming, the woodpecker clings clear of a ring where food in its mark will land, if it can',
    `as it came (facing ${came.flip > 0 ? 'right' : 'left'}) it covers ${came.covered} of 32 points round the ring at 8,11; with an apple landing there it faces ${one.flip > 0 ? 'right' : 'left'}, covering ${one.covered}, its beak ${one.beak} units off the spot`);
  check(two.phase === 'drum' && two.hid.n > 8 && two.over > 0.4 * two.under && air.under === air.of && air.over > 0.8 * air.of,
    'and where it can’t, the ring it covers is drawn over it, as is a piece in the air under it',
    `rings at ${JSON.stringify(promise.lands2)}: ${two.hid.n} of 32 points at ${two.hid.x},${two.hid.y} under it, ${two.over} of its ${two.under} pixels there drawn over; an apple up in the air over ${air.cell}: ${air.over} of ${air.of} pixels drawn over it`);
}

// The sound, in a real round on a virtual 60 Hz clock: the drum the game
// starts (when, how late, how fast) and its last knock against the moment
// the drawing reaches the strike; the "kik!" against the bird's landing.
await round('TUNING.SUDDEN_DEATH_MS + 5000');
const heard = await ev(`(() => {
  const g = SnakeDebug.game(), N = TUNING.GRID, me = g.snakes[0];
  me.stunUntil = 1e9; me.body = [{ x: 3, y: 21 }, { x: 3, y: 22 }, { x: 3, y: 23 }]; me.prev = null;
  const plays = [], play = SnakeAudio.play;
  SnakeAudio.play = (name, o) => { if (name === 'drum' || name === 'call' || name === 'crash') plays.push({ name, o: { ...o }, f: __frames.length }); return play(name, o); };
  g.woodpecker = { x: 15, y: 8, at: g.time, target: [8 * N + 15], strikeAt: g.tick + 17, last: [], struckAt: -1, restUntil: g.tick, pecks: 1 };
  const S = g.woodpecker.strikeAt, tps = [];
  for (let f = 0; f < 200; f++) { vf(1); tps.push(SnakeRender.birdPose().tp); if (g.woodpecker.struckAt === S && plays.some(p => p.name === 'call')) break; }
  SnakeAudio.play = play;
  const frame = 1000 / 60, T0 = __frames.length - tps.length; // (frame k of these at time k * frame)
  const when = v => { for (let k = 1; k < tps.length; k++) if (tps[k - 1] < v && tps[k] >= v) return (k - 1 + (v - tps[k - 1]) / (tps[k] - tps[k - 1])) * frame; return null; };
  const drum = plays.filter(p => p.name === 'drum'), kik = plays.filter(p => p.name === 'call'), crash = plays.filter(p => p.name === 'crash');
  const D = SnakeAudio.drumBlows(1).slice(-1)[0], ms = SnakeEngine.tickMs(g);
  const d = drum[0], first = d ? (d.f - T0) * frame + d.o.delay * 1000 - d.o.from / d.o.rate : null, last = d ? first + D / d.o.rate : null;
  const home = SnakeRender.birdHome(), k = kik[0];
  return { drums: drum.length, strike: when(S), first, last, from: d?.o.from, strikeN: d?.o.strike, crash: crash.length, kiks: kik.length, settle: k?.o.settle, kikAt: k ? (k.f - T0) * frame : null, lands: when(S + home / ms) };
})()`);
check(heard.drums === 1 && heard.strikeN === 1 && Math.abs(heard.last - heard.strike) < 1 && heard.crash === 1, 'in a round, the game starts the woodpecker’s drum on its first blow as drawn, so its last knock lands on the strike', heard.drums ? `the drum's last knock ${heard.last?.toFixed(1)} ms in, the strike drawn at ${heard.strike?.toFixed(1)}; ${heard.from} ms of it past as it started; ${heard.crash} crash` : 'no drum');
check(heard.kiks === 1 && heard.settle && heard.kikAt >= heard.lands - 0.5 && heard.kikAt - heard.lands < 17, 'and it says “kik!” as it settles back on its perch, on the frame it lands', `the call ${heard.kikAt?.toFixed(1)} ms in, landing at ${heard.lands?.toFixed(1)}`);

// Its layer: the board and the room round it, placed with CSS, not the
// page; and on a phone, the address bar coming and going (the page
// shorter, then as it was) never makes it again.
await b.go(site.url + '?debug', { settle: 0 });
await ev('__settle()');
await ev(STAGE);
const layer = await ev(`(() => {
  ${BIRD(0)}
  rest(12 * N + 22); drawN(5);
  const lb = L.getBoundingClientRect(), bd = document.getElementById('game').getBoundingClientRect(), reach = BIRD_REACH * BU * bd.width / (N * 32);
  const shown = (Math.min(innerWidth, lb.right) - Math.max(0, lb.left)) * (Math.min(innerHeight, lb.bottom) - Math.max(0, lb.top));
  return { inside: lb.left >= bd.left - reach - 3 && lb.right <= bd.right + reach + 3 && lb.top >= bd.top - reach - 3 && lb.bottom <= bd.bottom + reach + 3, share: +(shown / (innerWidth * innerHeight)).toFixed(2), was: (innerWidth * innerHeight) };
})()`);
await b.viewport(390, 844, { scale: 3, mobile: true });
await b.go(site.url + '?debug', { settle: 0 });
await ev('__settle()');
await ev(STAGE);
// On a phone, food in the woodpecker's mark trembles enough to see: it
// was under a pixel there, by the board's units. An apple in a marked
// patch, early in the aim and near the strike: how far it moves across,
// frame to frame, in CSS px.
const tremble = await ev(`(() => {
  ${BIRD(0)}
  const lime = (r, g, b) => g > 150 && r > 100 && r < 170 && b < 60, css = document.getElementById('game').getBoundingClientRect().width / N;
  const centre = () => { const p = pixels(9, 9, 3, 3); let n = 0, sx = 0; for (let i = 0; i < p.data.length; i += 4) if (lime(p.data[i], p.data[i + 1], p.data[i + 2])) { n++; sx += (i / 4) % p.width; } return n ? 9 + sx / n / p.width * 3 : null; };
  const spread = left => { g.woodpecker.strikeAt = g.tick - 1 + left; const xs = []; for (let i = 0; i < 9; i++) { drawN(1, 0.5, 23); xs.push(centre()); } return xs.every(v => v != null) ? +((Math.max(...xs) - Math.min(...xs)) * css).toFixed(2) : -1; };
  const P = []; for (let y = 9; y <= 11; y++) for (let x = 9; x <= 11; x++) P.push(y * N + x);
  g.food = [{ x: 10, y: 10, kind: 'food', expires: g.tick + 900 }];
  g.woodpecker = { x: 10, y: 10, at: g.time - 9000, target: P, strikeAt: g.tick + 17, last: [], struckAt: -1, restUntil: 1e9, pecks: 1 };
  drawN(30, 0.5, 16);
  const out = { early: spread(15), late: spread(1) };
  g.woodpecker = null; g.food = []; drawN(2);
  return out;
})()`);
check(tremble.early >= 1.5 && tremble.late >= 3, 'on a phone, food in the woodpecker’s mark trembles enough to see, more as the strike nears', `it moves ${tremble.early} CSS px across early in the aim, ${tremble.late} near the strike`);
await ev(`(() => {
  ${BIRD(1)}
  rest(23 * N + 12); drawN(5);
  window.__sets = 0;
  for (const k of ['width', 'height']) { const was = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k); Object.defineProperty(L, k, { configurable: true, get() { return was.get.call(this); }, set(v) { __sets++; was.set.call(this, v); } }); }
  window.__layerWas = [L.width, L.height];
  return 'ok';
})()`);
for (const h of [790, 844, 760, 844]) { await b.viewport(390, h, { scale: 3, mobile: true }); await b.sleep(120); await ev(`(() => { window.dispatchEvent(new Event('resize')); drawN(3); return 'ok'; })()`); }
const bar = await ev(`({ sets: __sets, was: __layerWas, now: [document.getElementById('bird-layer').width, document.getElementById('bird-layer').height] })`);
check(layer.inside && layer.share < 0.8 && bar.sets === 0, 'the woodpecker’s layer is the board and the room round it, not the page, and a phone’s address bar coming and going never makes it again',
  `${layer.inside ? 'within' : 'past'} its reach round the board, ${Math.round(layer.share * 100)}% of a 1280×800 window; on a phone the screen 844, 790, 760 px tall: made again ${bar.sets} times (${bar.was.join('×')} → ${bar.now.join('×')})`);

// With reduced motion: a flight is one glide (its wings still, no
// bounding), no bob resting, and fewer, slower blows, the last still on
// the strike.
await b.viewport(1280, 800);
await b.go(site.url + '?debug', { settle: 0 });
await ev('__settle()');
await ev(STAGE);
const calm = await ev(`(() => {
  ${BIRD(0)}
  const run = reducedNow => {
    R.setReducedMotion(reducedNow);
    const spot = 6 * N + 4, home = 12 * N + 22, o = {};
    rest(home); drawN(5);
    const crouch = new Set();
    for (let f = 0; f < 120; f++) { drawN(1, 0.5, 16); crouch.add(Math.round(R.birdPose().crouch * 1000)); }
    o.bob = crouch.size;
    const plan = aim(spot, home), strokes = [], ys = [];
    for (let m = plan.depart - 10; m > plan.drum + plan.settle + 10; m -= 8) { const p = at(m); strokes.push(p.stroke); ys.push(p.wing); }
    let turns = 0; for (let i = 2; i < strokes.length; i++) if ((strokes[i] - strokes[i - 1]) * (strokes[i - 1] - strokes[i - 2]) < 0) turns++;
    o.beats = turns; o.blows = plan.times.length; o.gap = Math.min(...plan.times.slice(1).map((t, i) => t - plan.times[i])); o.last = plan.times[plan.times.length - 1];
    return o;
  };
  const lively = run(false), calm = run(true);
  R.setReducedMotion(false);
  return { lively, calm };
})()`);
check(calm.lively.beats >= 3 && calm.calm.beats === 0 && calm.lively.bob > 3 && calm.calm.bob === 1 && calm.calm.blows < calm.lively.blows && calm.calm.gap > 2 * calm.lively.gap && calm.calm.last === 0,
  'with reduced motion, the woodpecker glides with its wings still (no wingbeats) and doesn’t bob, and its blows are fewer and slower, the last still on the strike',
  `wingbeats turning ${calm.lively.beats} times in a flight, ${calm.calm.beats} with reduced motion; ${calm.lively.bob} and ${calm.calm.bob} crouches resting; ${calm.lively.blows} blows ${calm.lively.gap} ms apart at the fastest, ${calm.calm.blows} at ${calm.calm.gap}`);
