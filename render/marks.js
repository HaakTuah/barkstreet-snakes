// The renderer (see render/core.js): the pips of powers held, your rests,
// your pressed turn, Mason's veins, Wildcard's tie and Star's head.

// The pips of golden powers held (see drawBody), round a head at (x, y)
// of radius hr, on the arc behind it (back: that way, as an angle; swell:
// its leap's). With keepOn, kept on the board: see placePips.
function drawPips(x, y, back, hr, swell, leaps, dashes, keepOn) {
  const n = placePips(x, y, back, hr, swell, leaps, dashes, keepOn);
  for (let i = 0; i < n; i++) drawPip(PIPS[3 * i], PIPS[3 * i + 1], PIPS[3 * i + 2], PIP_R, i < leaps);
}
// Where those pips go, into PIPS (each one's place and spoke), their
// colour's radius into PIP_R; returns how many. With keepOn, where the arc
// behind the head would leave the board (a head that's just turned off an
// edge, or at a corner), it swings round the head toward the board's
// middle, as little as it takes to come on, staying as far from the head
// as ever: never over it, or its eyes (moving the arc in slid it across
// the head). Only if no swing brings it all on (many pips in a corner)
// does it move in as well, from the swing that leaves least off, which
// takes it away from the head. PIP_MOVED: it swung, or moved.
let PIP_R = 0, PIP_MOVED = false, PIP_SX = 0, PIP_SY = 0;
const PIP_SWING = 0.05; // (radians a step, swinging round)
function placePips(x, y, back, hr, swell, leaps, dashes, keepOn) {
  const n = leaps + dashes, many = n > 2, rr = (many ? Math.max(CELL, hr + CELL * 0.2) : hr + CELL * 0.2) * (1 + swell * 0.5);
  const step = many ? 0.44 : 0.78, gap = leaps && dashes ? (many ? 0.35 : 0.6) : 0, mid = (n - 1 + gap) / 2;
  const pr = PIP_R = CELL * (many ? 0.12 : 0.14), edge = (pr + PIP_RING) * 1.5 + 1; // (as far as one reaches from its centre, and a unit to spare)
  if (PIPS.length < 3 * n) PIPS = new Float64Array(3 * n);
  PIP_MOVED = false;
  let off = pipArc(x, y, back, rr, n, leaps, step, gap, mid, edge);
  if (!keepOn || !off) return n;
  const way = Math.cos(back) * (SIZE / 2 - y) - Math.sin(back) * (SIZE / 2 - x) >= 0 ? 1 : -1; // (turning by + takes it toward the middle)
  let least = off, best = 0;
  for (let j = 1; off && j * PIP_SWING <= Math.PI; j++) {
    for (let side = 0; side < 2 && off; side++) {
      const turn = (side ? -way : way) * j * PIP_SWING;
      off = pipArc(x, y, back + turn, rr, n, leaps, step, gap, mid, edge);
      if (off < least) { least = off; best = turn; }
    }
  }
  if (off) { pipArc(x, y, back + best, rr, n, leaps, step, gap, mid, edge); for (let i = 0; i < n; i++) { PIPS[3 * i] += PIP_SX; PIPS[3 * i + 1] += PIP_SY; } }
  PIP_MOVED = true;
  return n;
}
// The arc of n pips at radius rr round (x, y), its middle at angle ang,
// into PIPS; returns how far it's off the board (0: it's on), and the
// move that would bring it on into PIP_SX, PIP_SY.
function pipArc(x, y, ang, rr, n, leaps, step, gap, mid, edge) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < n; i++) {
    const a2 = ang + (mid - i - (i < leaps ? 0 : gap)) * step, px = x + Math.cos(a2) * rr, py = y + Math.sin(a2) * rr;
    PIPS[3 * i] = px; PIPS[3 * i + 1] = py; PIPS[3 * i + 2] = a2;
    x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
  }
  PIP_SX = Math.max(0, edge - x0) - Math.max(0, x1 - (SIZE - edge)); PIP_SY = Math.max(0, edge - y0) - Math.max(0, y1 - (SIZE - edge));
  return Math.abs(PIP_SX) + Math.abs(PIP_SY);
}
// One pip at (x, y), its spoke at angle a2, its colour pr in radius: a
// sky disc for a leap, an ember diamond (its long way along the spoke) for
// a dash; ringed in parchment, then ink.
function drawPip(x, y, a2, pr, leap) {
  const ux = Math.cos(a2), uy = Math.sin(a2);
  for (let k = 0; k < 3; k++) {
    const r = pr + (k === 0 ? PIP_RING : k === 1 ? PIP_KEY : 0);
    ctx.fillStyle = k === 0 ? INK : k === 1 ? GLINT : leap ? SKY : EMBER;
    ctx.beginPath();
    if (leap) ctx.arc(x, y, r, 0, TAU);
    else {
      ctx.moveTo(x + ux * r * 1.5, y + uy * r * 1.5); ctx.lineTo(x - uy * r * 0.95, y + ux * r * 0.95);
      ctx.lineTo(x - ux * r * 1.5, y - uy * r * 1.5); ctx.lineTo(x + uy * r * 0.95, y - ux * r * 0.95); ctx.closePath();
    }
    ctx.fill();
  }
}

// Your two plain rests, as two half-rings round your head, fixed to the
// screen: your jump's on the left, in sky, and your flash's on the right,
// in ember. Each shows while it rests, filling from the bottom (a faint
// track shows how far it has to go), and gives one bright flick when it's
// back. Where you're looking, not only on your tag. (Holding golden leaps
// or dashes, that press is ready anyway: no half-ring for it.)
const REST_GAP = 0.36; // (radians left clear at the top and the bottom, between the halves)
function drawRests(s, a, now) {
  const x = a.pts[0], y = a.pts[1], rr = a.rad[0] + CELL * 0.3;
  const canJump = !s.leaps && s.body.length > T.MIN_LENGTH, canFlash = !s.dashes && (T.FLASH_COST <= 0 || s.body.length > T.MIN_LENGTH);
  const jump = canJump && shownTime < s.leapReadyAt, flash = canFlash && shownTime < s.flashReadyAt;
  if (a.jc && !jump && canJump && !(now - a.readyAt < 600)) a.readyAt = now; // (back: the flick)
  if (a.fc && !flash && canFlash && !(now - a.flashFx < 600)) a.flashFx = now;
  a.jc = jump; a.fc = flash;
  if (jump) restHalf(x, y, rr, -1, 1 - (s.leapReadyAt - shownTime) / T.LEAP_COOLDOWN_MS, SKY);
  if (flash) restHalf(x, y, rr, 1, 1 - (s.flashReadyAt - shownTime) / T.FLASH_COOLDOWN_MS, EMBER);
  if (a.readyAt && now - a.readyAt < 450) restFlick(x, y, rr, -1, (now - a.readyAt) / 450, SKY);
  if (now - a.flashFx < 450) restFlick(x, y, rr, 1, (now - a.flashFx) / 450, EMBER);
}
// A half-ring round (x, y) on the left (side -1) or right (1), from the
// bottom up to k of the way to the top (the path only).
function halfArc(x, y, r, side, k) {
  const g = REST_GAP / 2, a0 = Math.PI / 2 - side * g;
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a0 - side * (Math.PI - 2 * g) * Math.max(0, Math.min(1, k)), side > 0);
}
function restHalf(x, y, r, side, k, col) {
  ctx.lineCap = 'round';
  halfArc(x, y, r, side, 1); // (the track)
  ctx.strokeStyle = 'rgba(58,38,20,0.45)';
  ctx.lineWidth = 4.4;
  ctx.stroke();
  if (k <= 0) return;
  halfArc(x, y, r, side, k);
  ctx.strokeStyle = 'rgba(58,38,20,0.85)';
  ctx.lineWidth = 5.6;
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3.2;
  ctx.stroke();
}
// Back: the whole half-ring, bright, going out on its side and fading (with
// reduced motion it stays where it is, fading).
function restFlick(x, y, r, side, t, col) {
  const was = ctx.globalAlpha;
  ctx.lineCap = 'round';
  halfArc(x, y, r + (reduced ? 0 : CELL * 0.5 * t), side, 1);
  ctx.globalAlpha = was * (1 - t);
  ctx.strokeStyle = col;
  ctx.lineWidth = 5 * (1 - t) + 2;
  ctx.stroke();
  ctx.strokeStyle = GLINT;
  ctx.lineWidth = 2.5 * (1 - t) + 1;
  ctx.stroke();
  ctx.globalAlpha = was;
}

// Where a stunned snake's stars go round, as an offset down the screen
// from its head: above it, as in any cartoon, unless that's where its pips
// are (heading down, they're behind it) or off the board; then below it.
// With its pips below and the edge above, below past its pips. Pips swung
// round at the board's edge (see placePips): on the side they don't
// reach, or past them. Judged by its cell and the way it's going, which a
// stun doesn't change, so they never jump sides mid-stun. (Bonk! keeps
// clear of them: see onTick.)
const STAR_REACH = CELL * 0.42; // (how far the stars reach up and down from their centre)
function starsOff(s) {
  const pips = s.leaps + s.dashes, h = s.body[0], hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2, star = !!anim.get(s)?.star;
  const more = star ? CELL * 0.26 : 0, nigh = CELL * 0.72 + more; // (a star's points reach further than a round head: its stars go round further out)
  let up = 0, down = 0, moved = false;
  if (pips) { // (where its pips are, its head in its cell)
    const n = placePips(hx, hy, Math.atan2(-s.dir.y, -s.dir.x), CELL * 0.54 * (star ? STAR_TIP : 1), 0, s.leaps, s.dashes, !anim.get(s)?.offs), reach = (PIP_R + PIP_RING) * 1.5;
    moved = PIP_MOVED;
    for (let i = 0; i < n; i++) { up = Math.max(up, hy - PIPS[3 * i + 1] + reach); down = Math.max(down, PIPS[3 * i + 1] - hy + reach); }
  }
  let past = 0;
  for (let sgn = -1; sgn <= 1; sgn += 2) {
    let behind, off;
    if (moved) { // (clear of them)
      const clear = (sgn < 0 ? up : down) + STAR_REACH;
      behind = clear > nigh; // (its pips are on this side)
      off = sgn * Math.max(nigh, clear);
    } else {
      behind = pips && s.dir.y === -sgn;
      off = sgn * (CELL * (behind ? (pips > 2 ? 1.78 : 1.44) : pips && !s.dir.y ? (pips > 4 ? 1.5 : pips > 3 ? 1.3 : 1.02) : 0.72) + more); // (higher when pips show beside its head, higher still for both kinds' wider arc; further past three, which sit further back)
    }
    if (hy + off < STAR_REACH || hy + off > SIZE - STAR_REACH) continue;
    if (!behind) return off;
    past ||= off;
  }
  return past || -nigh;
}

// A turn you've pressed (q) that the drawing doesn't show yet: the head
// leans a little the way it'll go, from the press on (the eyes look there:
// see updateGaze; stunned, a chevron shows it too: see drawPress), so you
// can see the press was heard before the tick takes it. Once the head's
// drawn heading that way (past its cell's centre: see prepare), the lean
// goes. Eased; held still with reduced motion (it's news, not wobble).
const LEAN = 0.38;
function leanOf(s, a, q) {
  const to = q ? (a.tdx * q.y - a.tdy * q.x) * LEAN : 0;
  a.lean = reduced ? to : a.lean + (to - a.lean) * (1 - Math.exp(-frameDt / T.FACE_EASE_MS));
  return Math.abs(a.lean) < 0.002 ? 0 : a.lean;
}
// The way you've pressed to go that the drawing doesn't show yet (yours
// only: it answers your press). On the move: the first turn queued that
// isn't the way your head's drawn heading (following the queue as it
// changes), or online, your press as this screen saw it (see pressed).
// Stunned: the way you'll go when the stun's over, if you've said (a turn,
// or ahead for a jump or a flash asked for), until the tick it moves, as
// the stars. Nothing for a press the game didn't take.
function queuedOf(s, a) {
  if (s.id !== viewerId || !game) return null;
  if (s.stunUntil >= game.tick) {
    if (pressSeen.stun === s.stunUntil) return pressSeen.dir || (s.leapArmed >= s.stunUntil || s.flashArmed >= s.stunUntil ? s.dir : null);
    if (s.queue?.length) return s.queue[0];
    return s.leapArmed >= s.stunUntil || s.flashArmed >= s.stunUntil ? s.dir : null;
  }
  const q = s.queue;
  if (q?.length) {
    for (let i = 0; i < q.length; i++) if (q[i].x !== a.tdx || q[i].y !== a.tdy) return intoNeck(s, q[i]) ? null : q[i];
    return null;
  }
  return heardOf(s) && (pressSeen.dir.x !== a.tdx || pressSeen.dir.y !== a.tdy) ? pressSeen.dir : null;
}
// A press, as this screen saw it (the game says as it takes one: online
// the queue is the host's, so a friend's screen never has it, and the
// host's own press waits a round trip). Taken as the game takes it: never
// into the neck, and the way you're already going is nothing; the latest
// wins. Stunned, a press is for this stun only, and the way you were going
// after a turn changes your mind back. A crash forgets one on the move.
const pressSeen = { dir: null, stun: -1, tick: -1 };
function pressed(dir) {
  const s = game && findById(viewerId);
  if (!dir || !s || !s.alive) { pressSeen.dir = null; pressSeen.stun = -1; pressSeen.tick = -1; return; }
  if (intoNeck(s, dir)) return; // (into its neck: nothing)
  const ahead = dir.x === s.dir.x && dir.y === s.dir.y;
  if (s.stunUntil < game.tick) { // (on the move)
    if (ahead) return;
    pressSeen.dir = dir; pressSeen.stun = -1; pressSeen.tick = game.tick;
    return;
  }
  const turned = pressSeen.stun === s.stunUntil ? !!pressSeen.dir && !(pressSeen.dir.x === s.dir.x && pressSeen.dir.y === s.dir.y) : s.queue?.length > 0;
  if (ahead && !turned) return;
  pressSeen.dir = ahead ? null : dir;
  pressSeen.stun = s.stunUntil; pressSeen.tick = game.tick;
}
// Stunned, with a turn pressed: a small inked chevron on that side of your
// head (past the stars, if they're there; on the board, even pointing off
// it), so the press shows as heard, and where it'll take you. (The eyes
// look that way too, and the head leans.) With a jump or a flash asked for
// (it goes the way you go), its own mark there instead, a little further
// out (it's longer), in its accent (a golden one's in Honey). Asked both,
// the jump's, if it can go that way when the stun's over (the game hops
// first), else the flash's. Over every snake and word: ahead, it's over
// what you hit, and the Bonk! there.
function drawPress() {
  const s = findById(viewerId), a = s && s.alive && s.stunUntil >= game.tick ? anim.get(s) : null;
  const q = a && a.n ? queuedOf(s, a) : null;
  if (!q) return;
  const jump = s.leapArmed >= s.stunUntil, at = game.time + Math.max(0, s.stunUntil - game.tick) * (timeAt - timeFrom || T.START_TICK); // (the game's clock when it moves again)
  const flash = s.flashArmed >= s.stunUntil && !(jump && hops(s, s.body[0], q, at)), power = flash || jump;
  const pts = a.pts, so = starsOff(s);
  const d = (q.y && (so < 0) === (q.y < 0) ? Math.abs(so) + CELL * 0.62 : CELL * 0.95) + (power ? CELL * (flash ? 0.18 : 0.28) : 0);
  const w = CELL * 0.2, m = CELL * 0.12;
  const cx = Math.min(SIZE - m, Math.max(m, pts[0] + q.x * d)), cy = Math.min(SIZE - m, Math.max(m, pts[1] + q.y * d));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (power) pressMark(cx, cy, q, flash);
  else {
    ctx.moveTo(cx - q.x * w + q.y * w, cy - q.y * w + q.x * w);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx - q.x * w - q.y * w, cy - q.y * w - q.x * w);
  }
  ctx.strokeStyle = INK; ctx.lineWidth = CELL * 0.17; ctx.stroke();
  ctx.strokeStyle = !power ? GLINT : (flash ? s.dashes : s.leaps) > 0 ? HONEY : flash ? EMBER : SKY; ctx.lineWidth = CELL * 0.09; ctx.stroke();
}
// The island hop's landing ring: where a jump comes down, on the ground
// under it, in the jump's sky (a golden one's Honey), inked. Every snake
// in the air shows it (anyone can see where a jump will land); your own
// jump, asked for, shows it while the press waits for its hurdle (up
// to LEAP_WINDOW moves), so you see where you'd land. Just where: never whether it's a trap.
function drawLandings(now) {
  if (!game) return;
  const t = reduced ? 0 : now / 1000;
  for (const s of game.snakes) {
    if (!s.alive) continue;
    let x, y, gold = s.leaps > 0;
    if (s.flight?.land) { x = s.flight.land.x; y = s.flight.land.y; gold = !!s.flight.gold; }
    else if (s.id === viewerId) {
      const a = anim.get(s);
      if (!a || !a.lr) continue;
      x = a.lx; y = a.ly;
    } else continue;
    const cx = (x + 0.5) * CELL, cy = (y + 0.5) * CELL, r = CELL * (0.38 + 0.04 * Math.sin(t * 9));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = INK; ctx.lineWidth = CELL * 0.22; ctx.stroke();
    ctx.strokeStyle = gold ? HONEY : SKY; ctx.lineWidth = CELL * 0.12; ctx.stroke();
  }
}
// A power asked for, as a mark where the chevron would go (its tip at x,
// y, pointing along q), added to the current path: the jump's hop, as on
// its chip (an arc up and over, ending in an arrowhead), or the flash's
// double chevron.
function pressMark(x, y, q, dash) {
  const w = CELL * 0.2;
  if (dash) {
    for (let i = 0; i < 2; i++) {
      const tx = x - q.x * w * 0.95 * i, ty = y - q.y * w * 0.95 * i;
      ctx.moveTo(tx - q.x * w + q.y * w, ty - q.y * w + q.x * w);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx - q.x * w - q.y * w, ty - q.y * w - q.x * w);
    }
    return;
  }
  // (up the screen for a turn across it, to the left for one up or down: never upside down)
  const bx = -Math.abs(q.y), by = -Math.abs(q.x), span = w * 1.25, rise = w * 1.5;
  const x0 = x - q.x * span * 2, y0 = y - q.y * span * 2, x1 = x, y1 = y; // (from behind, landing at the tip)
  const kx = (x0 + x1) / 2 + bx * rise, ky = (y0 + y1) / 2 + by * rise;
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(kx, ky, x1, y1);
  const ux = x1 - kx, uy = y1 - ky, ul = Math.hypot(ux, uy) || 1, ah = w * 0.75; // (the arrowhead, along the way it comes down)
  for (const sg of SIDES2) {
    const c = Math.cos(2.5 * sg), sn = Math.sin(2.5 * sg), ax = (ux * c - uy * sn) / ul, ay = (ux * sn + uy * c) / ul;
    ctx.moveTo(x1 + ax * ah, y1 + ay * ah);
    ctx.lineTo(x1, y1);
  }
}

// Marble veins across a disc (centre x, y, radius r), their own way for
// each segment i: a long wandering one and a short faint one beside it,
// added to g's current path.
function marbleVein(g, x, y, r, i) {
  const a = i * 2.39996, f = i % 2 ? 1 : -1;
  const arc = (a0, a1, bend, reach) => {
    const x0 = x + Math.cos(a0) * r * reach, y0 = y + Math.sin(a0) * r * reach;
    const x1 = x + Math.cos(a1) * r * reach, y1 = y + Math.sin(a1) * r * reach;
    const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
    g.moveTo(x0, y0);
    g.quadraticCurveTo(mx, my, x1, y1);
  };
  arc(a, a + 2.6, 0.35 * f, 0.85);
  arc(a + 3.6, a + 4.7, -0.5 * f, 0.7);
}
// Segment i's veins (radius r, whole units) as a sprite: curves are
// triangulated every frame they're stroked, a sprite is one blit. A sprite
// a segment, since each wanders its own way (a few hundred at most: a long
// Mason grows a few sizes over a round).
const veinSprites = new Map(); // i * 64 + r -> canvas
function veinSprite(i, r) {
  const key = i * 64 + r;
  let s = veinSprites.get(key);
  if (s) return s;
  if (veinSprites.size >= 800) veinSprites.clear();
  const half = r + 2, px = Math.max(2, Math.ceil(2 * half * k)), g = (s = makeLayer(px, px)).getContext('2d');
  g.setTransform(px / (2 * half), 0, 0, px / (2 * half), px / 2, px / 2);
  g.lineCap = 'round';
  g.strokeStyle = i % 4 === 3 ? 'rgba(201,162,39,0.75)' : 'rgba(100,116,139,0.55)';
  g.lineWidth = i % 4 === 3 ? 1.1 : 1.4;
  g.beginPath();
  marbleVein(g, 0, 0, r, i);
  g.stroke();
  veinSprites.set(key, s);
  return s;
}

const STARS = [[-0.45, -0.45], [0.45, -0.45], [0, 0], [-0.45, 0.45], [0.45, 0.45]];
function star(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.fill();
}

// Wildcard's long red tie: knotted under the chin, down over the collar and
// on along the body, bending with it.
function drawTie(a) {
  const p = a.pts, c = CELL;
  const alen = Math.hypot(p[2] - p[0], p[3] - p[1]) || 1, ax = (p[2] - p[0]) / alen, ay = (p[3] - p[1]) / alen;
  const blen = Math.hypot(p[4] - p[2], p[5] - p[3]) || 1, bx = (p[4] - p[2]) / blen, by = (p[5] - p[3]) / blen;
  // From the chin (just inside the head's edge) to the collar...
  const kx = p[0] + ax * c * 0.45, ky = p[1] + ay * c * 0.45;
  const mx = p[2], my = p[3];
  // ...then on toward the next segment, ending in a point.
  const end = Math.min(blen, c * 0.85), ex = mx + bx * end, ey = my + by * end;
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  tieQuad(kx, ky, c * 0.07, mx, my, c * 0.12, ax, ay);
  tieQuad(mx, my, c * 0.12, ex - bx * c * 0.12, ey - by * c * 0.12, c * 0.15, bx, by);
  ctx.fill();
  circle(mx, my, c * 0.12); // (smooth where it bends)
  ctx.beginPath(); // the point
  ctx.moveTo(ex - bx * c * 0.12 - by * c * 0.15, ey - by * c * 0.12 + bx * c * 0.15);
  ctx.lineTo(ex, ey);
  ctx.lineTo(ex - bx * c * 0.12 + by * c * 0.15, ey - by * c * 0.12 - bx * c * 0.15);
  ctx.fill();
  ctx.fillStyle = '#991b1b'; // the knot
  circle(kx, ky, c * 0.08);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; // a sheen down the middle
  ctx.lineWidth = c * 0.03;
  ctx.beginPath(); ctx.moveTo(kx + ax * c * 0.1, ky + ay * c * 0.1); ctx.lineTo(mx, my); ctx.lineTo(ex - bx * c * 0.2, ey - by * c * 0.2); ctx.stroke();
}
// A piece of the tie from (x1, y1) to (x2, y2), heading (dx, dy): w1 either side, widening to w2.
function tieQuad(x1, y1, w1, x2, y2, w2, dx, dy) {
  ctx.moveTo(x1 - dy * w1, y1 + dx * w1); ctx.lineTo(x2 - dy * w2, y2 + dx * w2);
  ctx.lineTo(x2 + dy * w2, y2 - dx * w2); ctx.lineTo(x1 + dy * w1, y1 - dx * w1); ctx.closePath();
}

// Star: a five-pointed star for a head, sunflower yellow deeper than Honey
// (gold means a power: the gold line round a body is the power, a yellow
// on a face is a look), with an orange rim and an ink outline, and the old
// rainbow trailing it (see fillsOf). The star is a sharp one (its points
// STAR_OUT and its valleys STAR_IN times the head's radius, a point to the
// back: STAR_TURN) grown round by STAR_ROUND, so its points are softly
// rounded, and any outline grown round it (its shadow, a gold line) is
// the same star grown further. Its points turn with its heading (see
// prepare); its face stays upright (see starFace).
const STAR_OUT = 1.3, STAR_IN = 0.68, STAR_ROUND = 0.25, STAR_TURN = Math.PI;
const STAR_A = Math.atan2(STAR_OUT - STAR_IN * Math.cos(Math.PI / 5), STAR_IN * Math.sin(Math.PI / 5)); // (how far round from a point's middle its rounding runs, either way)
const STAR_MITRE = 1 / Math.cos(STAR_A - Math.PI / 5); // (how far a valley moves out, a unit of growing)
const STAR_TIP = STAR_OUT + STAR_ROUND; // (how far its points reach, in head radii)
const STAR_INK = 1.3, STAR_RIM = 2; // (its ink outline and its orange rim, in units, inside its edge)
// Its colours: sunflower, rimmed in orange; and dim (a point of it while
// its flash rests: see its tell), a muted mustard rimmed in brown.
const STAR_SUN = '#f9c22e', STAR_SUN_RIM = '#e8890c', STAR_DIM = '#b0893a', STAR_DIM_RIM = '#8a5c24';
const RAINBOW_STEP = 28; // (degrees of hue from one segment to the next)
// As the engine's flashIn sees it (golden flashes go anyway), on the clock as drawn.
const flashReady = s => s.dashes > 0 || (!(T.FLASH_COST > 0 && s.body.length <= T.MIN_LENGTH) && shownTime >= s.flashReadyAt);
// How far through its flash's rest it is, on the clock as drawn: 0 as it
// flashes, 1 once the flash is back (holding golden flashes, 1).
const restOf = s => s.dashes > 0 ? 1 : Math.max(0, Math.min(1, 1 - (s.flashReadyAt - shownTime) / T.FLASH_COOLDOWN_MS));
// Its face is upright whichever way it heads, as in the owner's picture
// (brows, eyes, then the big mustache: heading up, turned with its
// heading, the mustache sat over its eyes and read as huge angry brows),
// its chin tipped STAR_LEAN the way it's heading across the screen. That
// keeps the mustache over its two lower points heading down, left or
// right; heading up, its back point is straight down, under its chin. The
// angle its face's +x (its chin) is drawn at.
const STAR_LEAN = Math.PI / 10;
const starFace = a => Math.PI / 2 - STAR_LEAN * a.hc;
// The star round a's head, `grow` units bigger all round (smaller, if
// it's negative), added to the current path, wound the way rect() and
// arc() wind (so it never cancels a silhouette's other pieces out).
function starPath(a, grow) { starTrace(ctx, a.pts[0], a.pts[1], a.turn + STAR_TURN, a.rad[0], grow); }
// (The same on g: a star round (x, y), its first point at angle t0, for a head of radius r.)
function starTrace(g, x, y, t0, r, grow) {
  const rho = Math.max(0, STAR_ROUND * r + grow), dip = STAR_IN * r + rho * STAR_MITRE;
  for (let j = 0; j < 5; j++) {
    const t = t0 + j * TAU / 5, ox = x + Math.cos(t) * STAR_OUT * r, oy = y + Math.sin(t) * STAR_OUT * r, v = t + Math.PI / 5;
    if (!j) g.moveTo(ox + Math.cos(t - STAR_A) * rho, oy + Math.sin(t - STAR_A) * rho);
    g.arc(ox, oy, rho, t - STAR_A, t + STAR_A);
    g.lineTo(x + Math.cos(v) * dip, y + Math.sin(v) * dip);
  }
  g.closePath();
}
// Its tell: a countdown on its five points. Its middle is always its
// sunflower. As it flashes, its points go dim (in a moment, and its
// twinkles burst off them: see onTick's dash), and they light again one
// by one as its rest runs down, a point for each fifth of it (1.2 s),
// going round from its back point, each lighting over the last STAR_FADE
// of its step; the fifth lights as the flash is back, and while it's
// ready two twinkles go round its points. (Lit only while its flash was
// ready, it was dim nearly all the time: it flashes the moment it can, so
// lit lasted a tick, a blink with reduced motion.) Holding golden flashes,
// all five are lit. With reduced motion a point lights at once. Its brows
// knit as it flashes, and relax through the first part of its rest (see
// its face).
const STAR_FADE = 0.2;
// Its head: the star (a sprite for each count of its points lit, heading
// right, turned and scaled as it's drawn, the point that's lighting drawn
// over it fading in), its mustache (a sprite of its own, upright with its
// face: as paths, the star and its mustache cost the GPU about half a
// millisecond a frame), its sheen, and its twinkles. Out, its points are dim.
function drawStarHead(s, a, now, dead) {
  const lit = !dead && !!game && flashReady(s), rest = !dead && game ? restOf(s) : 0;
  a.glow = reduced || rest >= a.glow ? rest : a.glow + (rest - a.glow) * (1 - Math.exp(-frameDt / 90)); // (filling with the clock; spent, its points go out in a moment)
  const knit = Math.max(0, Math.min(1, (a.glow - 0.15) / 0.3));
  a.brow = reduced ? +(a.glow >= 0.3) : knit * knit * (3 - 2 * knit);
  const fill = a.glow * 5, n = Math.min(5, Math.floor(fill + 1e-9)), part = reduced || n === 5 ? 0 : Math.min(1, (fill - n - 1) / STAR_FADE + 1);
  const x = a.pts[0], y = a.pts[1], r = a.rad[0], sc = r / STAR_R;
  const sx = sc * (1 - 0.22 * a.squash), sy = sc * (1 + 0.12 * a.squash); // (come down from a jump, squashed a moment, as a face is)
  blitAbout(starHeadSprite(n), x, y, 0, 0, sx, sy, a.turn);
  if (part > 0.02) {
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * part;
    blitAbout(starPointSprite(n), x, y, 0, 0, sx, sy, a.turn);
    ctx.globalAlpha = was;
  }
  blitAbout(stacheSprite(stacheStep(s, a, now)), x, y, 0, 0, sc, sc, a.face); // (twirling, as its gag: see stacheSprite)
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; // (its sheen, as every segment's: light from the top left, whichever way it's turned)
  circle(x - r * 0.3, y - r * 0.36, r * 0.34);
  const flare = reduced ? 1 : (now - a.flareAt) / 450;
  if (!lit && !(flare < 1)) return;
  for (let j = 0; j < 5; j++) {
    let size;
    if (flare >= 0 && flare < 1 && !reduced) size = 1.7 * (1 - flare) + 0.3 * flare; // (all five, going out)
    else if (!lit) continue;
    else if (reduced) size = j === 0 || j === 2 ? 0.9 : 0; // (two, held still)
    else { // (two at a time, going round, each swelling and going)
      const beat = now / 420, on = Math.floor(beat) % 5, p = beat - Math.floor(beat);
      size = j === on || j === (on + 2) % 5 ? Math.sin(p * Math.PI) : 0;
    }
    if (size <= 0.05) continue;
    const t = a.turn + STAR_TURN + j * TAU / 5, d = STAR_OUT * r, w = SPRITE * CELL * r * 0.36 * size / GLINT_R;
    ctx.drawImage(glintSprite(), x + Math.cos(t) * d - w / 2, y + Math.sin(t) * d - w / 2, w, w);
  }
}
const STAR_R = CELL * 0.54; // (its head's radius, unswollen: its sprites')
const starHeadSprite = n => sprite('starhead', n, drawStarHeadSprite);
const starPointSprite = j => sprite('starpoint', j, drawStarPointSprite);
// Its gag (anyone else's tongue): its mustache's ends twirl and flick up,
// and a little harrumph puffs out from under it; nothing pokes out of its
// mouth. A sprite for each of STACHE_STEPS steps through the flick (0 is
// the mustache at rest), so it costs what the still one does; with reduced
// motion the ends still twirl (it's the gag), without the puff.
const STACHE_STEPS = 16;
const stacheSprite = (i = 0) => sprite('stache', reduced && i ? -i : i, drawStacheSprite);
// The step of its gag a snake's flick is at (0: not flicking), as tongue() times it.
function stacheStep(s, a, now) {
  if (deadNow || now >= a.tongueUntil || coughing(s) || mouthOpen(s, a) >= 0.08) return 0;
  const p = 1 - (a.tongueUntil - now) / a.tongueMs;
  return Math.max(1, Math.min(STACHE_STEPS - 1, Math.round(p * STACHE_STEPS)));
}
// The star, inked, dim, then lit in its middle and its first n points.
const drawStarHeadSprite = (g, n) => {
  g.fillStyle = INK;
  g.beginPath(); starTrace(g, 0, 0, STAR_TURN, STAR_R, 0); g.fill();
  starFill(g, STAR_DIM_RIM, STAR_DIM);
  g.beginPath();
  starMiddle(g);
  for (let j = 0; j < n; j++) starPoint(g, j);
  g.clip();
  starFill(g, STAR_SUN_RIM, STAR_SUN);
};
// (Its point j alone, lit: drawn over the star where it's dim, as it lights.)
const drawStarPointSprite = (g, j) => {
  g.beginPath(); starPoint(g, j); g.clip();
  starFill(g, STAR_SUN_RIM, STAR_SUN);
};
const drawStacheSprite = (g, i) => { // (at its face's scale: see drawBody)
  g.scale(1.1, 1.1);
  const p = Math.abs(i) / STACHE_STEPS;
  if (i > 0) harrumph(g, p);
  mustache(g, Math.min(1, 1.7 * (1 - Math.abs(2 * p - 1))));
};
// Its rim and its body, in these colours, inside its ink.
function starFill(g, rim, body) {
  g.fillStyle = rim;
  g.beginPath(); starTrace(g, 0, 0, STAR_TURN, STAR_R, -STAR_INK); g.fill();
  g.fillStyle = body;
  g.beginPath(); starTrace(g, 0, 0, STAR_TURN, STAR_R, -STAR_INK - STAR_RIM); g.fill();
}
// Its middle (the pentagon through its valleys) and its point j (the
// star beyond the pentagon's side under it), added to g's path, to clip to.
const STAR_DIP = (STAR_IN + STAR_ROUND * STAR_MITRE) * STAR_R; // (a valley, at its ink's edge)
function starMiddle(g) {
  for (let j = 0; j < 5; j++) {
    const v = STAR_TURN + (j + 0.5) * TAU / 5;
    if (j) g.lineTo(Math.cos(v) * STAR_DIP, Math.sin(v) * STAR_DIP);
    else g.moveTo(Math.cos(v) * STAR_DIP, Math.sin(v) * STAR_DIP);
  }
  g.closePath();
}
function starPoint(g, j) {
  const t = STAR_TURN + j * TAU / 5, v0 = t - Math.PI / 5, v1 = t + Math.PI / 5;
  g.moveTo(Math.cos(v0) * STAR_DIP, Math.sin(v0) * STAR_DIP);
  g.lineTo(Math.cos(t) * CELL * 2, Math.sin(t) * CELL * 2); // (well past its tip)
  g.lineTo(Math.cos(v1) * STAR_DIP, Math.sin(v1) * STAR_DIP);
  g.closePath();
}
// Its mustache, in the face's frame (+x its chin, a cell CELL): two big
// drooping halves from under its eyes, out over its two lower points,
// scalloped along their ends; inked, so white reads on sunflower, with a
// few strands. Twirled (t, 0..1: its gag), each half's outer end bends up
// toward its eyes, more the further out it is, and its tip curls round in
// a little inked twirl. (Made once a step: see stacheSprite.)
function mustache(g, t = 0) {
  const c = CELL, th = t * 1.2;
  let sg = 1;
  // (a point of a half, bent: turned about a hinge out under its eye, by more toward its end)
  const bx = (x, y) => { const w = bend(y), a = sg * th * w, dx = x - 0.17, dy = y - sg * 0.13; return c * (0.17 + dx * Math.cos(a) - dy * Math.sin(a)); };
  const by = (x, y) => { const w = bend(y), a = sg * th * w, dx = x - 0.17, dy = y - sg * 0.13; return c * (sg * 0.13 + dx * Math.sin(a) + dy * Math.cos(a)); };
  const bend = y => { const u = Math.max(0, Math.min(1, (Math.abs(y) - 0.12) / 0.3)); return u * u * (3 - 2 * u); };
  const P = (x, y) => [bx(x, sg * y), by(x, sg * y)];
  g.beginPath();
  for (sg of SIDES2) {
    g.moveTo(...P(0.07, 0));
    g.bezierCurveTo(...P(0.03, 0.16), ...P(0.1, 0.32), ...P(0.26, 0.38));
    g.quadraticCurveTo(...P(0.38, 0.42), ...P(0.43, 0.31));
    g.quadraticCurveTo(...P(0.35, 0.3), ...P(0.35, 0.22));
    g.quadraticCurveTo(...P(0.27, 0.2), ...P(0.29, 0.12));
    g.quadraticCurveTo(...P(0.22, 0.08), ...P(0.25, 0));
    g.closePath();
  }
  g.fillStyle = '#fffdf6';
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = c * 0.035;
  g.lineJoin = 'round';
  g.stroke();
  if (t > 0.05) { // (its twirls: from each end, curling in and round)
    g.lineCap = 'round';
    for (const [col, w] of [[INK, 0.085], ['#fffdf6', 0.045]]) {
      g.strokeStyle = col;
      g.lineWidth = c * w;
      g.beginPath();
      for (sg of SIDES2) {
        const [x0, y0] = P(0.4, 0.37), [x1, y1] = P(0.32, 0.43), a0 = Math.atan2(y0 - y1, x0 - x1); // (the way out of its end)
        let x = x0, y = y0;
        g.moveTo(x, y);
        for (let j = 1; j <= 12; j++) {
          const u = j / 12, a = a0 + sg * u * 4.4 * t, step = c * 0.045 * (1 - 0.6 * u) * Math.min(1, t * 1.5);
          x += Math.cos(a) * step; y += Math.sin(a) * step;
          g.lineTo(x, y);
        }
      }
      g.stroke();
    }
  }
  g.strokeStyle = 'rgba(58,38,20,0.3)';
  g.lineWidth = c * 0.02;
  g.lineCap = 'round';
  g.beginPath();
  for (sg of SIDES2) {
    g.moveTo(...P(0.12, 0.1)); g.quadraticCurveTo(...P(0.16, 0.24), ...P(0.3, 0.3));
    g.moveTo(...P(0.17, 0.05)); g.quadraticCurveTo(...P(0.21, 0.14), ...P(0.27, 0.18));
  }
  g.stroke();
}
// The harrumph, p (0..1) through its gag: a little puff of breath out
// from under its mustache, toward its chin and to either side, growing and
// fading; inked lightly, so it reads on the bark.
function harrumph(g, p) {
  const u = (p - 0.3) / 0.6;
  if (u <= 0 || u >= 1) return;
  const c = CELL, fade = 1 - u * u;
  g.lineWidth = c * 0.044;
  for (const [x0, y0, dx, dy, r0, r1] of [[0.46, 0, 0.24, 0, 0.06, 0.14], [0.42, 0.22, 0.18, 0.18, 0.045, 0.1], [0.42, -0.22, 0.18, -0.18, 0.045, 0.1]]) {
    const x = c * (x0 + dx * u), y = c * (y0 + dy * u), r = c * (r0 + (r1 - r0) * u);
    g.beginPath(); // (a little cloud: three rounds, its ink stroked under its fill, so only the outside shows)
    for (const [ox, oy, rr] of [[0, 0, 1], [-0.6, 0.55, 0.62], [-0.6, -0.55, 0.62]]) { g.moveTo(x + ox * r + rr * r, y + oy * r); g.arc(x + ox * r, y + oy * r, rr * r, 0, TAU); }
    g.strokeStyle = `rgba(58,38,20,${(0.5 * fade).toFixed(3)})`;
    g.stroke();
    g.fillStyle = `rgba(255,253,246,${(0.92 * fade).toFixed(3)})`;
    g.fill();
  }
}
// A four-point twinkle, white and finely inked, as a sprite (its tips
// GLINT_R from its middle).
const GLINT_R = CELL * 0.9;
const glintSprite = () => sprite('glint', '', g => { sparkle(g, 0, 0, GLINT_R); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = 'rgba(58,38,20,0.6)'; g.lineWidth = CELL * 0.12; g.lineJoin = 'round'; g.stroke(); });
// A four-point twinkle at (x, y), r to its tips, as g's current path (its
// sides curving in).
function sparkle(g, x, y, r) {
  const w = r * 0.14;
  g.beginPath();
  g.moveTo(x + r, y);
  g.quadraticCurveTo(x + w, y + w, x, y + r);
  g.quadraticCurveTo(x - w, y + w, x - r, y);
  g.quadraticCurveTo(x - w, y - w, x, y - r);
  g.quadraticCurveTo(x + w, y - w, x + r, y);
  g.closePath();
}
// Now and then its tail sheds a small twinkle, in one of the rainbow's
// colours, drifting off behind it (lively only; no glow: only you glow).
const TWINKLE = 6, TWINKLE_HUES = [0, 32, 55, 130, 205, 275]; // (its mote kinds, a colour each, after the others: see drawMotes)
function shedTwinkle(s, a, now) {
  if (reduced || now < a.shedAt || a.n < 2) return;
  a.shedAt = now + 280 + Math.random() * 420;
  const n = a.n, x = a.pts[2 * n - 2], y = a.pts[2 * n - 1], dx = x - a.pts[2 * n - 4], dy = y - a.pts[2 * n - 3], l = Math.hypot(dx, dy) || 1;
  const sp = 8 + Math.random() * 10, side = (Math.random() - 0.5) * 14;
  mote(x + dx / l * a.rad[n - 1] * 0.6, y + dy / l * a.rad[n - 1] * 0.6, dx / l * sp - dy / l * side, dy / l * sp + dx / l * side - 4, 700 + Math.random() * 400, 0.42 + Math.random() * 0.25, TWINKLE + Math.floor(Math.random() * TWINKLE_HUES.length));
}
const twinkleSprite = i => sprite('twinkle', i, drawTwinkle);
const drawTwinkle = (g, i) => {
  const c = CELL, h = TWINKLE_HUES[i], hue = rainbowOf(h)[0];
  const path = (r, w) => { g.beginPath(); g.moveTo(r, 0); g.quadraticCurveTo(w, w, 0, r); g.quadraticCurveTo(-w, w, -r, 0); g.quadraticCurveTo(-w, -w, 0, -r); g.quadraticCurveTo(w, -w, r, 0); g.closePath(); };
  g.lineJoin = 'round';
  path(c * 0.3, c * 0.05);
  g.fillStyle = hue; g.fill();
  g.strokeStyle = 'rgba(58,38,20,0.55)'; g.lineWidth = c * 0.03; g.stroke();
  path(c * 0.13, c * 0.025);
  g.fillStyle = '#fffbea'; g.fill();
};

// The living snakes, in passes, so no snake's shadow falls on another's body.
const live = [];
// (a snake leaping, or still arched over another one, goes on top)
const overOf = s => { const a = anim.get(s); return a && (a.leapUntil > game.tick || a.ml) ? 1 : 0; }; // (or about to: see predict)
const byOver = (p, q) => overOf(p) - overOf(q);
function drawSnakes(alpha, now) {
  live.length = 0;
  let leaping = false;
  for (const s of game.snakes) if (s.alive) { live.push(s); if (overOf(s)) leaping = true; }
  if (leaping) live.sort(byOver);
  syncStays();
  for (const s of live) predict(s, animOf(s, now));
  meetings();
  for (const s of live) prepare(s, alpha, now, false);
  let up = live.length;
  if (leaping) while (up > 0 && overOf(live[up - 1])) up--;
  drawShadows(up);
  if (fieldSpecs.length && huesOn) drawFieldHues(now); // (a land's colour round a rival on it, under every outline and body)
  // Then outlines, bodies, flames and queasy (or starving) washes, each pass for every
  // snake on the ground, then the same for any up in the air, the shadow
  // of what of it's in the air first, over the bodies on the ground (the
  // hurdle passes under it with the shadow across it), and its trail: a
  // leaper's outline goes over what it's hopping, not under it (which made
  // it look rammed into it rather than above it). Its halo stays with the
  // ground's outlines, under every body (over the snake it hopped, it
  // greyed a dark body either side of yours for as long as the arch ran).
  drawPasses(0, up, now, live.length);
  if (up < live.length) {
    drawAirShadows(up);
    drawTrails(up, live.length, now);
    drawPasses(up, live.length, now, 0);
  }
}
// Passes over live[from..to) (and for a snake across a wrapped edge, at
// each place it shows); the first also takes the halos of live[to..halos).
function drawPasses(from, to, now, halos) {
  for (let pass = 0; pass < 4; pass++) {
    for (let i = from, end = pass ? to : Math.max(to, halos); i < end; i++) {
      const s = live[i], a = anim.get(s), offs = a.offs || OFFS;
      for (let j = 0; j < offs.length; j++) {
        const ox = offs[j][0], oy = offs[j][1];
        if (ox || oy) ctx.translate(ox, oy);
        if (pass === 0) { if (i >= to) drawHalo(s, a); else drawOutline(s, a, !!halos); }
        else if (pass === 1) drawBody(s, a, now, false);
        else if (pass === 2) { if (s.burnUntil > game.tick) drawBurning(s, a, now); }
        else { // queasy after a mushroom: a sickly green wash, fading; starving, a pale one
          const q = a.queasyAt ? 1 - (now - a.queasyAt) / 1400 : 0;
          if (q > 0 && q <= 1) { ctx.fillStyle = rgba('#65a30d', 0.38 * q); silhouette(a, 0.5); }
          drawPale(a); // (starving: it pales, see hungerLook; its colour floods back as a meal goes down, see mealSwell)
        }
        if (ox || oy) ctx.translate(-ox, -oy);
      }
    }
  }
}

// A jump's faint trail through the air: two thin arcs either side of the
// way its head went, as far apart as its head was swollen there, so they
// bow out over what it hopped; from where it took off to its head (once
// it's down, to where it landed), fading as it lands. In
// parchment, faint: a power's gold is for powers. None with reduced motion.
// (Points every TRAIL_STEP cells where it bows, one straight run over the
// top, where it doesn't, and mitred, not rounded, at every point: the same
// line, a little cheaper. Measured, the trail is a fifth of a millisecond
// a frame, a jump's air shadow most of the rest of what it adds.)
const TRAIL_MS = 260, TRAIL_STEP = 0.125;
function drawTrails(from, to, now) {
  if (reduced) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'miter';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#fffbea';
  for (let j = from; j < to; j++) {
    const a = anim.get(live[j]);
    for (let n = 0; n < a.hops.length; n++) {
      const r = a.hops[n], fade = r.landed ? 1 - (now - r.landedAt) / TRAIL_MS : 1;
      if (fade <= 0) continue;
      const reach = Math.abs(r.x1 - r.x0) + Math.abs(r.y1 - r.y0) + 1, sw = r.gold ? T.LEAP_SWELL_GOLD : T.LEAP_SWELL;
      const tx = (r.x0 - r.dx + 0.5) * CELL, ty = (r.y0 - r.dy + 0.5) * CELL; // (where it took off)
      let end = reach + 1;
      if (!r.landed) end = Math.min(end, ((a.pts[0] - tx) * r.dx + (a.pts[1] - ty) * r.dy) / CELL); // (to its head: they run on round it, just outside it)
      if (!(end > 0.3)) continue; // (nothing behind its head yet; and never a trail of no length, nor of none at all)
      ctx.globalAlpha = 0.55 * fade;
      ctx.beginPath();
      for (const sg of SIDES2) {
        for (let u = 0.3; ; u += TRAIL_STEP) {
          if (u > 1 && u < reach) u = reach; // (over the top, straight)
          if (u > end) u = end;
          const d = u < 1 ? 1 - u : u > reach ? u - reach : 0, w = CELL * 0.54 * (1 + sw * (d < 1 ? Math.cos(d * Math.PI / 2) : 0)) + 6;
          const x = tx + r.dx * u * CELL - r.dy * sg * w, y = ty + r.dy * u * CELL + r.dx * sg * w;
          if (u === 0.3) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          if (u >= end) break;
        }
      }
      ctx.stroke();
    }
  }
  ctx.lineJoin = 'round'; // (as it found it)
  ctx.globalAlpha = 1;
}

// A snake on fire: flames along its back (the fire's own flicker, smaller,
// dying down as it goes out), a glow under them, embers and smoke going up.
function drawBurning(s, a, now) {
  const lively = !reduced, t = now / 1000, left = Math.min(1, (s.burnUntil - game.tick) / (T.BURN_TICKS / 2));
  const size = SPRITE * CELL * (0.45 + 0.25 * left);
  for (let i = 1; i < a.n && i < 12; i += 2) {
    const x = a.pts[2 * i], y = a.pts[2 * i + 1];
    ctx.globalAlpha = 0.45;
    ctx.drawImage(fireGlowSprite(), x - size * 0.6, y - size * 0.6, size * 1.2, size * 1.2);
    ctx.globalAlpha = 1;
    const fr = lively ? Math.floor(t * 14 + i * 3) % FLAME_FRAMES : 0;
    ctx.drawImage(bodyFlameSprite(fr), x - size / 2, y - size * 0.62, size, size);
    if (lively && Math.random() < 0.05) mote(x, y - CELL * 0.3, (Math.random() - 0.5) * 12, -40 - Math.random() * 20, 650, 1.3 + Math.random(), 3);
    if (lively && Math.random() < 0.03) mote(x, y - CELL * 0.3, (Math.random() - 0.5) * 6, -18, 1100, 2.5 + Math.random() * 2, 2);
  }
}
