// The renderer (see render/core.js): the woodpecker drawn, and the chips it
// knocks loose.

// Its frame (2D matrices, as setTransform takes them, from its own units,
// 1 = BU, to the board's): its body (BM), its head (HM: turned at the
// neck, driven forward or drawn back), a wing (WM).
const BM = new Float64Array(6), HM = new Float64Array(6), WM = new Float64Array(6), TM = new Float64Array(6), UNIT = new Float64Array([1, 0, 0, 1, 0, 0]);
function mThen(out, m, x, y, rot, sx, sy) { // (out: m, then moved to x, y, turned and scaled; out may be m)
  const c = Math.cos(rot), s = Math.sin(rot), a = c * sx, b = s * sx, cc = -s * sy, d = c * sy, m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3];
  out[4] = m0 * x + m2 * y + m[4]; out[5] = m1 * x + m3 * y + m[5];
  out[0] = m0 * a + m2 * b; out[1] = m1 * a + m3 * b; out[2] = m0 * cc + m2 * d; out[3] = m1 * cc + m3 * d;
}
const atX = (m, x, y) => m[0] * x + m[2] * y + m[4], atY = (m, x, y) => m[1] * x + m[3] * y + m[5]; // (where m takes a point)
const useM = (g, m) => g.setTransform(lay.sc * m[0], lay.sc * m[1], lay.sc * m[2], lay.sc * m[3], lay.sc * m[4] + lay.ox, lay.sc * m[5] + lay.oy);
function birdMats(P) {
  const z = P.s * (1 + 0.08 * P.air) * BU; // (a touch bigger in the air: nearer to you)
  mThen(BM, UNIT, P.x, P.y, P.rot, P.flip * z, z);
  mThen(BM, BM, 0, P.crouch * CROUCH, 0, 1, 1);
  mThen(HM, BM, 0.25, -1.15, P.turn, 1, 1);
  mThen(HM, HM, P.thrust - 0.25, 1.15, 0, 1, 1);
}
// A wing: from its shoulder, up over its back at the top of the beat
// (stroke 1), down under its belly at the bottom (-1), short as it passes
// edge-on between; swept forward to land; the far one behind its body.
function wingMat(P, far) {
  const a = Math.PI / 2 + Math.PI / 2 * P.stroke + P.sweep, len = P.wing * (0.35 + 0.65 * Math.abs(P.stroke)) * (far ? 0.9 * P.far : P.near);
  mThen(WM, BM, far ? 0.05 : -0.1, far ? -0.55 : -0.4, a, len, 1);
}
// Where all of it is (board units, in box): round the points of its parts, each with its reach.
const box = { x0: 0, y0: 0, x1: 0, y1: 0 };
const PTS_BODY = [-0.1, -0.45, 1.13, -0.1, 1.05, 1.13, -0.15, 3.1, 0.2, -0.55, 1.1, 0.16, 0.3, 1.2, 0.16, 0.95, 0.55, 0.22, 0.95, 1.05, 0.22];
const PTS_HEAD = [0.45, -1.75, 0.84, -0.12, -1.95, 0.44, 2.55, -1.72, 0.15, 1.05, -2.0, 0.14, 1.05, -1.5, 0.14];
const PTS_WING = [1.5, 0, 0.64, 3.1, 0, 0.64];
const BOTH = [false, true];
function boxAdd(m, pts, k) {
  for (let i = 0; i < pts.length; i += 3) {
    const x = atX(m, pts[i], pts[i + 1]), y = atY(m, pts[i], pts[i + 1]), r = pts[i + 2] * k;
    if (x - r < box.x0) box.x0 = x - r;
    if (x + r > box.x1) box.x1 = x + r;
    if (y - r < box.y0) box.y0 = y - r;
    if (y + r > box.y1) box.y1 = y + r;
  }
}
function birdBox(P, fresh = true) {
  birdMats(P);
  if (fresh) { box.x0 = box.y0 = Infinity; box.x1 = box.y1 = -Infinity; }
  const k = Math.hypot(BM[0], BM[1]);
  boxAdd(BM, PTS_BODY, k); boxAdd(HM, PTS_HEAD, k);
  if (P.wing > 0.02) for (const far of BOTH) { wingMat(P, far); boxAdd(WM, PTS_WING, k); }
}
// All of it on the screen: a wing that would reach past its edge (or its
// layer's) beats short of it, folded a little; flying, the bird keeps in
// from the edge. Perched, landing or drumming, it's where it was placed
// to fit (perchFor, drumPoseAt).
function fitBird(P) {
  if (P.wing > 0.02) {
    birdMats(P);
    const k = Math.hypot(BM[0], BM[1]);
    for (const far of BOTH) {
      if (wingFits(P, far, k)) continue;
      let lo = 0.2, hi = 1;
      for (let i = 0; i < 6; i++) { const mid = (lo + hi) / 2; if (far) P.far = mid; else P.near = mid; if (wingFits(P, far, k)) lo = mid; else hi = mid; }
      if (far) P.far = lo; else P.near = lo;
    }
  }
  if (!P.free) return;
  birdBox(P);
  P.x += box.x0 < room.x0 ? room.x0 - box.x0 : box.x1 > room.x1 ? room.x1 - box.x1 : 0;
  P.y += box.y0 < room.y0 ? room.y0 - box.y0 : box.y1 > room.y1 ? room.y1 - box.y1 : 0;
}
function wingFits(P, far, k) {
  wingMat(P, far);
  for (let i = 0; i < PTS_WING.length; i += 3) {
    const x = atX(WM, PTS_WING[i], 0), y = atY(WM, PTS_WING[i], 0), r = PTS_WING[i + 2] * k;
    if (x - r < room.x0 || x + r > room.x1 || y - r < room.y0 || y + r > room.y1) return false;
  }
  return true;
}

// Its head and its eye. Resting, it watches whatever moves near it (a
// head, a beetle), now and then you, and blinks; its head jerks to each
// thing and holds still, as birds' heads do. Through the aim its head
// turns to its chunk and tilts this way and that, its eye on it; flying
// in, its eye stays on it. Its pupil turns as the snakes' do: eased toward
// what it looks at, the way it looks turned into its head's frame.
function headAndEye(P, now, dt) {
  const lively = !reduced, ph = P.phase, perchedNow = ph === 'rest' || ph === 'eye';
  let want = 0;
  if (ph === 'rest') { birdWatch(P, now); P.fx = bird.spot.x; P.fy = bird.spot.y; }
  if (perchedNow || ph === 'hop' || ph === 'out') {
    const hx = P.x + P.flip * 0.45 * BU * P.s, hy = P.y - 1.75 * BU * P.s, up = perchedNow ? P.up : 0.6;
    want = Math.atan2(P.fy - hy, (P.fx - hx) * P.flip) - P.rot * P.flip;
    if (ph === 'eye' && lively) { // (tilting its head this way and that, to look at it)
      if (now > bird.cockAt) { bird.cock = bird.cock ? 0 : 0.16; bird.cockAt = now + 380 + 320 * Math.random(); }
      want += want > 0 ? -bird.cock : bird.cock;
    }
    want = Math.max(-up, Math.min(perchedNow ? 1.2 : 0.6, want));
    if (ph === 'out') want *= 1 - smooth(clamp01((P.u - 0.6) / 0.4)); // (its beak coming round to strike as it comes in)
    if (ph === 'rest') want = Math.max(-0.7, Math.min(1, want)); // (resting, it looks round, not straight up or down)
  } else if (ph === 'drum' || ph === 'linger' || ph === 'land') bird.turn = bird.turnTo = 0;
  if (lively && perchedNow) {
    if (Math.abs(want - bird.turnTo) > 0.1 || now > bird.hold) { bird.turnTo = want + (ph === 'rest' ? (Math.random() - 0.5) * 0.3 : 0); bird.hold = now + 260 + 640 * Math.random(); }
    bird.turn += (bird.turnTo - bird.turn) * (1 - Math.exp(-dt / 30));
  } else bird.turn += (want - bird.turn) * (1 - Math.exp(-dt / (lively ? 45 : 200)));
  if (perchedNow) bird.turn = Math.max(-P.up, Math.min(1.2, bird.turn));
  P.turn = bird.force == null ? bird.turn : perchedNow ? Math.max(-P.up, Math.min(1.2, bird.force)) : bird.force; // (held so for the tests, as far as it may turn there)
  // Resting on a button's rim under the board, now and then it pecks at
  // it: its head brought level to it, two quick taps.
  if (lively && ph === 'rest' && P.rim && bird.force == null) {
    if (now > bird.peckAt) { bird.peckFrom = now; bird.peckAt = now + 3200 + 3600 * Math.random(); }
    const q = (now - bird.peckFrom) / RIM_PECK_MS;
    if (q >= 0 && q < 1) {
      bird.turn *= Math.exp(-dt / 25); bird.turnTo = bird.turn; P.turn = bird.turn;
      P.thrust = -B_BACK * Math.sin(Math.PI * q) * (0.5 - 0.5 * Math.cos(4 * Math.PI * q));
    }
  }
  // Resting, a small bob, and now and then it shifts its grip (a hitch down the log and back).
  if (lively && perchedNow) {
    let c = 0.18 * (0.5 - 0.5 * Math.cos(TAU * now / 1700));
    if (now > bird.gripAt) { bird.gripFrom = now; bird.gripAt = now + 2600 + 2800 * Math.random(); }
    const gp = (now - bird.gripFrom) / 420;
    if (gp >= 0 && gp < 1) c += 0.75 * (gp < 0.25 ? smooth(gp / 0.25) : 1 - smooth((gp - 0.25) / 0.75));
    P.crouch = Math.min(1, P.crouch + c);
  }
  // Its eye, from where it is to what it looks at.
  birdMats(P);
  const tx = P.fx - atX(HM, 0.75, -1.9), ty = P.fy - atY(HM, 0.75, -1.9), len = Math.hypot(tx, ty) || 1, k = 1 - Math.pow(1 - T.GLANCE_EASE, dt / 16.7);
  bird.gx += (tx / len - bird.gx) * k; bird.gy += (ty / len - bird.gy) * k;
  if (now > bird.nextBlink) { bird.blinkUntil = now + T.BLINK_MS; bird.nextBlink = now + T.BLINK_MIN + Math.random() * (T.BLINK_MAX - T.BLINK_MIN); }
  P.blink = now < bird.blinkUntil && (perchedNow || ph === 'settle');
}
// What it watches, resting: you now and then (if you're on the log), else
// the nearest head or beetle within 9 cells of its head, else a look round;
// a new pick every second or so, or when that one's gone.
function birdWatch(P, now) {
  let f = bird.focus;
  if (f && (f.body ? !f.alive : f.kind ? !game.food.includes(f) : false)) f = null;
  if (!f || now >= bird.focusUntil) {
    bird.focusUntil = now + 600 + 1400 * Math.random();
    const hx = P.x + P.flip * 0.45 * BU * P.s, hy = P.y - 1.75 * BU * P.s, you = findById(viewerId);
    f = null;
    if (you && you.alive && Math.random() < 0.25) f = you;
    else {
      let near = (9 * CELL) ** 2;
      for (const s of game.snakes) if (s.alive) { const c = s.body[0], d = (c.x * CELL + CELL / 2 - hx) ** 2 + (c.y * CELL + CELL / 2 - hy) ** 2; if (d < near) { near = d; f = s; } }
      for (const b of game.food) if (b.kind === 'beetle') { const d = (b.x * CELL + CELL / 2 - hx) ** 2 + (b.y * CELL + CELL / 2 - hy) ** 2; if (d < near) { near = d; f = b; } }
    }
    if (!f) { const a = (Math.random() - 0.5) * 1.1; f = { x: hx + P.flip * Math.cos(a) * 300, y: hy + Math.sin(a) * 300 }; }
    bird.focus = f;
  }
  const c = f.body ? f.body[0] : f.kind ? f : null;
  bird.spot.x = c ? c.x * CELL + CELL / 2 : f.x; bird.spot.y = c ? c.y * CELL + CELL / 2 : f.y;
}

// Its parts, each drawn once (at this screen's size, and at half that for
// a small perch) and laid on with its pose: its ink (every part a line's
// width bigger, laid under the lot, so parts overlapping show no line
// between them), then its colours. Its rim of light (along its upper
// left, whichever way it's tipped), its beak (it opens to call) and its
// eye are drawn as it stands. Each: its box in units, facing right, and
// how it's drawn. Inked like everything else on the board, and lit by a
// warm rim, so its black still reads on the dark page beside it.
const BIRD_INK = '#3a2614', BIRD_RIM = '#e8d9b0'; // (Ink, and Parchment-2)
const birdTail = g => { g.beginPath(); g.moveTo(-0.55, 1.1); g.lineTo(-0.15, 3.1); g.lineTo(0.3, 1.2); g.closePath(); };
const birdFeet = g => { g.beginPath(); g.moveTo(0.5, 0.7); g.lineTo(0.95, 0.55); g.moveTo(0.5, 0.95); g.lineTo(0.95, 1.05); };
const oval = (g, cx, cy, rx, ry, a = 0) => { g.beginPath(); g.ellipse(cx, cy, rx, ry, a, 0, TAU); };
function bodyInk(g, feet) {
  g.strokeStyle = BIRD_INK; g.lineWidth = 0.24;
  birdTail(g); g.stroke();
  oval(g, -0.1, 0.3, 0.95, 1.55, 0.08); g.stroke();
  oval(g, 0.38, 0.45, 0.52, 1.15, 0.12); g.stroke();
  if (feet) { g.lineWidth = 0.36; birdFeet(g); g.stroke(); }
}
function bodyPart(g, folded, feet) { // (the stiff tail it props itself on, its body, its buff belly, the red under its tail; folded, its wing's white shoulder and bars)
  g.fillStyle = '#18181b';
  birdTail(g); g.fill();
  oval(g, -0.1, 0.3, 0.95, 1.55, 0.08); g.fill();
  g.fillStyle = '#efe9dc'; oval(g, 0.38, 0.45, 0.52, 1.15, 0.12); g.fill();
  g.fillStyle = '#dc2626'; oval(g, 0.22, 1.42, 0.36, 0.3); g.fill();
  if (folded) {
    g.fillStyle = '#f5f5f4'; oval(g, -0.3, -0.5, 0.32, 0.52, 0.2); g.fill();
    g.beginPath();
    for (let row = 0; row < 3; row++) for (let i = 0; i < 3; i++) { g.moveTo(-0.62 + i * 0.22 + 0.075, 0.15 + row * 0.38); g.arc(-0.62 + i * 0.22, 0.15 + row * 0.38, 0.075, 0, TAU); }
    g.fill();
  }
  if (feet) { g.strokeStyle = '#57534e'; g.lineWidth = 0.12; birdFeet(g); g.stroke(); } // (gripping the bark)
}
function headInk(g) { g.strokeStyle = BIRD_INK; g.lineWidth = 0.24; oval(g, 0.45, -1.75, 0.72, 0.7); g.stroke(); oval(g, -0.12, -1.95, 0.3, 0.28); g.stroke(); }
function headPart(g) { // (black, a red nape, a white cheek under a black moustache stripe)
  g.fillStyle = '#18181b'; oval(g, 0.45, -1.75, 0.72, 0.7); g.fill();
  g.fillStyle = '#dc2626'; oval(g, -0.12, -1.95, 0.3, 0.28); g.fill();
  g.fillStyle = '#f5f5f4'; oval(g, 0.62, -1.58, 0.44, 0.33); g.fill();
  g.strokeStyle = '#18181b'; g.lineWidth = 0.15;
  g.beginPath(); g.moveTo(0.2, -1.25); g.quadraticCurveTo(0.6, -1.38, 1.0, -1.3); g.stroke();
}
function wingPart(g, far) { // (big and black, barred white; the far one darker)
  g.strokeStyle = BIRD_INK; g.lineWidth = 0.24; oval(g, 1.5, 0, 1.6, 0.55); g.stroke();
  g.fillStyle = far ? '#0c0c0e' : '#18181b'; g.fill();
  g.fillStyle = far ? '#a8a29e' : '#f5f5f4';
  g.beginPath();
  for (let i = 0; i < 4; i++) { const x = 0.8 + i * 0.42, y = i % 2 ? 0.12 : -0.12; g.moveTo(x + 0.1, y); g.arc(x, y, 0.1, 0, TAU); }
  g.fill();
}
const PARTS = {
  inkPerch: [-1.3, -1.5, 1.3, 3.4, g => bodyInk(g, true)], inkFly: [-1.3, -1.5, 1.3, 3.4, g => bodyInk(g, false)], inkHead: [-0.6, -2.65, 1.35, -0.9, headInk],
  perch: [-1.3, -1.5, 1.3, 3.4, g => bodyPart(g, true, true)], tuck: [-1.3, -1.5, 1.3, 3.4, g => bodyPart(g, true, false)], fly: [-1.3, -1.5, 1.3, 3.4, g => bodyPart(g, false, false)],
  head: [-0.6, -2.65, 1.35, -0.9, headPart], wing: [-0.25, -0.75, 3.25, 0.75, g => wingPart(g, false)], farWing: [-0.25, -0.75, 3.25, 0.75, g => wingPart(g, true)],
  shadow: [-1.2, -2.1, 1.2, 2.1, g => { g.fillStyle = '#000'; oval(g, 0, 0, 1.1, 2); g.fill(); }],
};
const partsFull = new Map(), partsHalf = new Map();
let partsK = 0; // (device px a unit they were drawn for: the bird at 1.12, a touch bigger than it ever flies)
function layPart(g, name, half) {
  const cache = half ? partsHalf : partsFull, [x0, y0, x1, y1, draw] = PARTS[name];
  let c = cache.get(name);
  if (!c) {
    const k = partsK * (half ? 0.5 : 1);
    c = makeLayer((x1 - x0) * k, (y1 - y0) * k);
    const pg = c.getContext('2d'), sx = c.width / (x1 - x0), sy = c.height / (y1 - y0);
    pg.setTransform(sx, 0, 0, sy, -x0 * sx, -y0 * sy);
    pg.lineJoin = pg.lineCap = 'round';
    draw(pg);
    cache.set(name, c);
  }
  g.drawImage(c, x0, y0, x1 - x0, y1 - y0);
}
// Its beak, a chisel (its lower half opening by gape), as a path.
function beakPath(g, gape) {
  g.beginPath();
  if (!gape) { g.moveTo(1.05, -2.0); g.lineTo(BILL[0], BILL[1]); g.lineTo(1.05, -1.5); g.closePath(); return; }
  g.moveTo(1.05, -2.0); g.lineTo(BILL[0], BILL[1]); g.lineTo(1.05, -1.72); g.closePath();
  const c = Math.cos(gape), s = Math.sin(gape), tx = BILL[0] - 1.05, ty = BILL[1] + 1.72;
  g.moveTo(1.05, -1.72); g.lineTo(1.05 + tx * c - ty * s, -1.72 + tx * s + ty * c); g.lineTo(1.05 + 0.22 * s, -1.72 + 0.22 * c); g.closePath();
}
function birdRim(g, cx, cy, rx, ry, a, at) { g.beginPath(); g.ellipse(cx, cy, rx - 0.07, ry - 0.07, a, at - a - 0.7, at - a + 0.7); g.stroke(); } // (a rim inside an oval's edge, round angle at)
const ghostHead = P => { mThen(TM, BM, 0.25, -1.15, P.turn, 1, 1); mThen(TM, TM, -B_BACK - 0.25, 1.15, 0, 1, 1); }; // (its head drawn back, as it was a moment ago: the blur)
function drawBird(g, P, half) {
  birdMats(P);
  const sun = P.flip > 0 ? Math.PI * 1.25 - P.rot : Math.PI * 1.75 + P.rot; // (the screen's upper left, in its own frame)
  // Its shadow, on the bark only (on the page beside the board it was a smudge).
  g.save();
  useBase(g); g.beginPath(); g.rect(0, 0, SIZE, SIZE); g.clip();
  mThen(TM, BM, 0.35 + 0.6 * P.air, 0.6 + 0.9 * P.air, 0, 1, 1); useM(g, TM);
  g.globalAlpha = P.alpha * (0.28 - 0.1 * P.air);
  layPart(g, 'shadow', half);
  g.restore();
  g.globalAlpha = P.alpha;
  g.lineJoin = g.lineCap = 'round';
  if (P.wing > 0.02) { wingMat(P, true); useM(g, WM); layPart(g, 'farWing', half); }
  // Its ink, then its colours.
  useM(g, BM); layPart(g, P.feet ? 'inkPerch' : 'inkFly', half);
  g.strokeStyle = BIRD_INK; g.lineWidth = 0.24;
  if (P.blur > 0) { ghostHead(P); g.globalAlpha = P.alpha * 0.4 * P.blur; useM(g, TM); layPart(g, 'inkHead', half); beakPath(g, 0); g.stroke(); g.globalAlpha = P.alpha; }
  useM(g, HM); layPart(g, 'inkHead', half); beakPath(g, P.gape); g.stroke();
  useM(g, BM); layPart(g, P.wing > 0.5 ? 'fly' : P.feet ? 'perch' : 'tuck', half);
  g.strokeStyle = BIRD_RIM; g.lineWidth = 0.11;
  g.beginPath(); // (lit down its tail's sunny side, whichever way it faces)
  if (P.flip > 0) { g.moveTo(-0.33, 1.84); g.lineTo(-0.16, 2.69); } else { g.moveTo(0.08, 1.83); g.lineTo(-0.13, 2.7); }
  g.stroke();
  birdRim(g, -0.1, 0.3, 0.95, 1.55, 0.08, sun);
  if (P.blur > 0) { ghostHead(P); g.globalAlpha = P.alpha * 0.4 * P.blur; useM(g, TM); layPart(g, 'head', half); g.fillStyle = '#71717a'; beakPath(g, 0); g.fill(); g.globalAlpha = P.alpha; }
  useM(g, HM); layPart(g, 'head', half);
  g.strokeStyle = BIRD_RIM; g.lineWidth = 0.11;
  birdRim(g, 0.45, -1.75, 0.72, 0.7, 0, sun - P.turn);
  g.fillStyle = '#71717a'; beakPath(g, P.gape); g.fill(); // (the chisel beak, darker along its top)
  g.fillStyle = '#3f3f46'; g.beginPath(); g.moveTo(1.05, -2.0); g.lineTo(BILL[0], BILL[1]); g.lineTo(1.05, -1.78); g.closePath(); g.fill();
  // Its eye: a pupil turned to what it looks at (the way it looks, turned into its head's frame), with a glint; or shut.
  const c = Math.cos(P.rot), s = Math.sin(P.rot), x1 = (bird.gx * c + bird.gy * s) * P.flip, y1 = -bird.gx * s + bird.gy * c;
  const ct = Math.cos(P.turn), st = Math.sin(P.turn), ex = x1 * ct + y1 * st, ey = -x1 * st + y1 * ct;
  g.fillStyle = '#fffbea';
  if (P.blink) { oval(g, 0.75, -1.9, 0.21, 0.05); g.fill(); }
  else {
    oval(g, 0.75, -1.9, 0.21, 0.21); g.fill();
    const px = 0.75 + ex * 0.094, py = -1.9 + ey * 0.094;
    g.fillStyle = '#0a0a0a'; oval(g, px, py, 0.1, 0.1); g.fill();
    g.fillStyle = '#ffffff'; oval(g, px + 0.035, py - 0.035, 0.035, 0.035); g.fill();
  }
  if (P.wing > 0.02) {
    wingMat(P, false); useM(g, WM); layPart(g, 'wing', half);
    g.strokeStyle = BIRD_RIM; g.lineWidth = 0.11;
    birdRim(g, 1.5, 0, 1.6, 0.55, 0, sun - (Math.PI / 2 + Math.PI / 2 * P.stroke + P.sweep));
  }
  g.globalAlpha = 1;
}

// On its chunk, drumming: a dent where its beak strikes, deeper blow by
// blow, with splits running from it along the grain and across (the
// mark's own cracks are the board's: this is the bird's work), gone once
// the strike has made it a hole (the board draws the hole); beside a body
// lying there (see aimOff), smaller where there's less room, its splits
// running in toward the cell's middle and stopping short of the body, and
// none where no room shows; and chips flying off each blow and falling
// (not with reduced motion).
function drawDent(g, A, done) {
  if (AFREE < 1.5) return;
  const x = A.tx + AX, y = A.ty + AY, beside = AFREE < Infinity, f = done / A.times.length;
  const r = beside ? Math.min(CELL * (0.07 + 0.15 * f), Math.max(CELL * 0.05, AFREE * 0.75)) : CELL * (0.07 + 0.15 * f);
  const inward = Math.atan2(-AY, -AX);
  useBase(g);
  g.fillStyle = 'rgba(20,10,4,0.85)';
  oval(g, x, y, r, r * 0.82); g.fill();
  g.strokeStyle = 'rgba(20,10,4,0.8)'; g.lineWidth = 1.6; g.lineCap = 'round';
  g.beginPath();
  for (let m = 0; m < 4; m++) {
    const a = (beside ? inward + (m === 0 ? -0.45 : m === 1 ? 0.45 : m === 2 ? -1.25 : 1.25) : m === 0 ? -Math.PI / 2 : m === 1 ? Math.PI / 2 : m === 2 ? 0.4 : Math.PI + 0.4) + (hash01(A.spot * 13 + m) - 0.5) * 0.6;
    const c = Math.cos(a), sn = Math.sin(a);
    let l = r * (1.1 + (m < 2 ? 1.6 : 0.8) * f);
    if (beside) for (let d = r * 0.7; d < l; d += 1) if (clearOf(x + c * d, y + sn * d) < 1.2) { l = d; break; } // (short of the body)
    if (l <= r * 0.7 + 0.5) continue;
    g.moveTo(x + c * r * 0.7, y + sn * r * 0.7); g.lineTo(x + c * l, y + sn * l);
  }
  g.stroke();
  g.fillStyle = 'rgba(254,243,199,0.65)'; // (a fleck of pale wood on its far side, where the light falls in)
  oval(g, x + r * 0.35, y + r * 0.3, r * 0.35, r * 0.3); g.fill();
}
const CHIP_COLS = ['#e9cf9c', '#5a3b22'];
function drawChips(g, A, t) {
  useBase(g);
  const up = -Math.PI / 2 - 0.6 * A.drum.flip; // (up and back toward the bird, out of the hole)
  for (let c = 0; c < 2; c++) {
    g.fillStyle = CHIP_COLS[c];
    for (let i = 0; i < A.times.length; i++) {
      const age = t - A.times[i];
      if (age < 0) break;
      if (age >= B_CHIPS) continue;
      g.globalAlpha = 1 - age / B_CHIPS;
      for (let j = c; j < 4; j += 2) {
        const h = A.strikeAt * 7919 + i * 31 + j * 7, a = up + (hash01(h) - 0.5) * 2.2, v = 0.16 + 0.26 * hash01(h + 1), sz = 2.6 + 3 * hash01(h + 2);
        const x = A.tx + AX + Math.cos(a) * v * age, y = A.ty + AY + Math.sin(a) * v * age + 0.0011 * age * age;
        if (x - sz < room.x0 || x + sz > room.x1 || y - sz < room.y0 || y + sz > room.y1) continue;
        g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
    }
  }
  g.globalAlpha = 1;
}
function hash01(n) {
  let h = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function drawWoodpecker(alpha, now, dt) {
  const w = game.woodpecker;
  if (!w || !birdLayer) {
    if (birdShown) { birdLayer.style.display = 'none'; birdShown = false; }
    return;
  }
  if (!birdShown) { birdLayer.style.display = 'block'; birdShown = true; resetBird(now); }
  if (!boardRect.w) return;
  const dpr = Math.min(window.devicePixelRatio || 1, quality === 2 ? 2 : quality === 1 ? 1.5 : 1);
  if (placeLayer(dpr)) bird.clear = true;
  const g = birdG;
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (bird.clear) g.clearRect(0, 0, lay.W, lay.H);
  else if (bird.drawn) g.clearRect(bird.box[0], bird.box[1], bird.box[2], bird.box[3]);
  bird.clear = bird.drawn = false;
  const k = lay.sc * BU * 1.12;
  if (Math.abs(k - partsK) > partsK * 0.01) { partsK = k; partsFull.clear(); partsHalf.clear(); }
  birdRoom();
  const P = pose;
  P.tp = game.tick - 1 + alpha;
  posture(w, P.tp, now);
  headAndEye(P, now, dt);
  fitBird(P);
  // Where it's drawn, to clear next frame: all of it, its shadow, its chips.
  birdBox(P);
  const e = 3.6 * BU * P.s; // (its shadow, cast down and to the right of it, however it's tipped)
  let x0 = box.x0 - e, y0 = box.y0 - e, x1 = box.x1 + e, y1 = box.y1 + e;
  if (P.drum) {
    const A = P.drum;
    if (P.blows > 0) drawDent(g, A, P.blows);
    if (!reduced) drawChips(g, A, P.t);
    x0 = Math.min(x0, A.tx + AX - 5 * CELL); x1 = Math.max(x1, A.tx + AX + 5 * CELL); y0 = Math.min(y0, A.ty + AY - 5 * CELL); y1 = Math.max(y1, A.ty + AY + 5 * CELL); // (as far as its chips fly)
  }
  drawBird(g, P, lay.sc * BU * P.s < partsK * 0.55);
  overBird(g, w, alpha, now);
  const bx = Math.max(0, Math.floor(lay.ox + x0 * lay.sc) - 2), by = Math.max(0, Math.floor(lay.oy + y0 * lay.sc) - 2);
  bird.box[0] = bx; bird.box[1] = by;
  bird.box[2] = Math.max(0, Math.min(lay.W, Math.ceil(lay.ox + x1 * lay.sc) + 2) - bx); bird.box[3] = Math.max(0, Math.min(lay.H, Math.ceil(lay.oy + y1 * lay.sc) + 2) - by);
  bird.drawn = true;
}
