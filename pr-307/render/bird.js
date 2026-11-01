// The renderer (see render/core.js): the woodpecker's pose and what it
// keeps between frames, its plan (its aim, the flight out, the drum, the
// flight home) and its poses.

// Its pose: where it is (its feet, board units), how big, which way it
// faces, how far it's tipped (rot), crouched, its wings (how far out, up
// or down in the beat (stroke), swept forward to land; near and far: how
// much of each the screen has room for), its feet out or tucked, its head
// turned (turn) and driven forward or drawn back (thrust; blurred when it
// drums too fast to see), its beak open (gape), how high in the air (for
// its shadow), and what it's doing (phase) and looking at (fx, fy).
const pose = { x: 0, y: 0, s: 1, flip: 1, rot: 0, crouch: 0, wing: 0, stroke: 1, sweep: 0, near: 1, far: 1, feet: 1, turn: 0, thrust: 0, blur: 0, gape: 0, alpha: 1, air: 0, blink: false,
  phase: '', free: false, up: 1.2, fx: 0, fy: 0, drum: null, blows: 0, t: 0, tp: 0, u: 0 };
// What it keeps between frames: its head's jerks and tilts, what it's
// watching, its eye, its blinks, its grip; where it was drawn (to clear).
const bird = { turn: 0, turnTo: 0, hold: 0, cock: 0, cockAt: 0, gx: 1, gy: 0, focus: null, focusUntil: 0, spot: { x: 0, y: 0 },
  nextBlink: 0, blinkUntil: 0, gripAt: 0, gripFrom: -1e9, peckAt: 0, peckFrom: -1e9, box: [0, 0, 0, 0], drawn: false, clear: true, force: null };
function resetBird(now = 0) {
  bird.turn = bird.turnTo = 0; bird.hold = 0; bird.cock = 0; bird.cockAt = 0; bird.gx = 1; bird.gy = 0; bird.focus = null; bird.focusUntil = 0;
  bird.nextBlink = now + T.BLINK_MIN; bird.blinkUntil = 0; bird.gripAt = now + 1800; bird.gripFrom = -1e9; bird.peckAt = now + 2400; bird.peckFrom = -1e9; bird.clear = true;
}

// Its timings (ms on the board's clock): settling as it lands, crouching to
// take off, lingering after the strike, the least it looks at its chunk
// before it goes, coming in as sudden death starts, a wingbeat, chips in
// the air; and how far its head draws back between blows (units). A
// flight takes longer the further it goes (flightMs, hopMs).
const B_SETTLE = 120, B_TAKEOFF = 200, B_LINGER = 90, B_LOOK = 260, B_ARRIVE = 900, B_BEAT = 104, B_CHIPS = 340, B_BACK = 0.42;
let B_IN = 0.06 * 1.3 / BIRD_GROW; // (how far its beak goes into the bark on a blow, units: as deep as at 1.3, whatever its size, so it stays in the cell it pecks)
const flightMs = d => Math.max(240, Math.min(540, 200 + 0.42 * d));
const hopMs = d => Math.max(180, Math.min(380, 140 + 0.35 * d));
const smooth = t => t * t * (3 - 2 * t), clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);
const tickMs = () => (window.SnakeEngine ? SnakeEngine.tickMs(game) : T.MIN_TICK);
// The drum, as the sound has it (SnakeAudio.drumBlows: one table for the
// knocks you hear and the blows you see); the same numbers if it isn't there.
const DRUM_OWN = [];
function drumTable(strike) {
  if (window.SnakeAudio?.drumBlows) return SnakeAudio.drumBlows(strike);
  const s = Math.max(0, Math.min(12, strike | 0));
  if (!DRUM_OWN[s]) { const n = s < 3 ? 14 : Math.max(6, 14 - 2 * (s - 2)), out = []; for (let i = 0, at = 0; i < n; at += 28 + 2 * i, i++) out.push(at); DRUM_OWN[s] = out; }
  return DRUM_OWN[s];
}

// Its plan for a patch, from the woodpecker's own state (the tick of its
// strike, the patch, the one before, how many it's struck) and the board,
// so every screen, a friend's too, draws the same bird at the same moment:
// from where it rests, a hop to the perch for this spot (along the ledge,
// or along its side of the board; to the board's other side it flies
// straight in from where it is instead), a look, the flight in, a
// landing, the drum (a blow on each knock, the last on the strike), timed
// back from the strike; the flights shortened to fit the aim, leaving it
// B_LOOK at least to look before it goes. With reduced motion, a blow on
// every third knock, the last on the strike.
// Where it clings to drum is chosen as the aim starts, and again each
// tick while it's still on its perch (its hop done, before it crouches to
// go): the way that hides least of what you need to see (see drumChoice),
// as the board stands that tick. Then it's kept.
const plan = { strikeAt: -1, spot: -1, prev: -1, pecks: -1, layout: -1, ms: 0, aim: 0, lively: true,
  tx: 0, ty: 0, from: null, hop: null, drum: null, times: [], D: 0, F: 0, H: 0, H0: 0, aimMs: 0, depart: 0, chose: -1 };
function aimPlan(w, ms, to = Infinity) {
  const A = plan, spot = spotIn(w.target), prev = w.last.length ? spotIn(w.last) : ARRIVAL_SPOT, pecks = w.pecks || 0, lively = !reduced;
  if (A.strikeAt === w.strikeAt && A.spot === spot && A.prev === prev && A.pecks === pecks && A.layout === birdLayout && A.ms === ms && A.aim === T.PECK_AIM_TICKS && A.lively === lively) {
    if (A.chose !== game.tick && A.aimMs - to >= A.H && to > A.depart + B_TAKEOFF) { // (still on its perch: look again)
      A.chose = game.tick;
      const d = drumChoice(w, spot, A.from.flip);
      if (d !== A.drum) {
        const F = flightMs(Math.hypot(d.x - A.from.x, d.y - A.from.y)), k = Math.max(0.4, Math.min(1, (A.aimMs - B_LOOK - B_TAKEOFF - B_SETTLE - A.D) / (F + A.H0)));
        if (to > A.D + B_SETTLE + F * k + B_TAKEOFF) { A.drum = d; A.F = F * k; A.depart = A.D + B_SETTLE + A.F; } // (its hop kept as it was)
      }
    }
    return A;
  }
  A.strikeAt = w.strikeAt; A.spot = spot; A.prev = prev; A.pecks = pecks; A.layout = birdLayout; A.ms = ms; A.aim = T.PECK_AIM_TICKS; A.lively = lively;
  A.tx = (spot % GRID) * CELL + CELL / 2; A.ty = Math.floor(spot / GRID) * CELL + CELL / 2;
  const was = perchAt(prev), at = perchAt(spot), beside = k => k === 'left' || k === 'right';
  A.from = beside(was.side) && beside(at.side) && was.side !== at.side ? was : at;
  A.hop = A.from === at && Math.hypot(at.x - was.x, at.y - was.y) > 1 ? was : null;
  A.drum = drumChoice(w, spot, A.from.flip); A.chose = game.tick;
  const blows = drumTable(pecks), n = blows.length;
  A.D = blows[n - 1];
  A.times.length = 0;
  for (let i = 0; i < n; i++) if (lively || (n - 1 - i) % 3 === 0) A.times.push(blows[i] - A.D);
  A.aimMs = T.PECK_AIM_TICKS * ms;
  const F = flightMs(Math.hypot(A.drum.x - A.from.x, A.drum.y - A.from.y)), H = A.hop ? hopMs(Math.hypot(at.x - was.x, at.y - was.y)) : 0;
  const k = Math.max(0.4, Math.min(1, (A.aimMs - B_LOOK - B_TAKEOFF - B_SETTLE - A.D) / (F + H)));
  A.F = F * k; A.depart = A.D + B_SETTLE + A.F;
  A.H0 = H; A.H = Math.min(H * k, Math.max(0, A.aimMs - A.depart - 60));
  return A;
}
// ...and after the strike: a moment at the hole, the flight back to the
// perch for the spot it struck, and settling there (its "kik!": the game
// asks birdHome when), all within its rest.
const home = { struckAt: -1, spot: -1, layout: -1, ms: 0, rest: 0, lively: true, drum: null, to: null, tx: 0, ty: 0, F: 0, total: Infinity };
function homePlan(w, ms) {
  const H = home, spot = spotIn(w.last), rest = (w.restUntil - w.struckAt) * ms, lively = !reduced;
  if (H.struckAt === w.struckAt && H.spot === spot && H.layout === birdLayout && H.ms === ms && H.rest === rest && H.lively === lively) return H;
  H.struckAt = w.struckAt; H.spot = spot; H.layout = birdLayout; H.ms = ms; H.rest = rest; H.lively = lively;
  H.tx = (spot % GRID) * CELL + CELL / 2; H.ty = Math.floor(spot / GRID) * CELL + CELL / 2;
  H.to = perchAt(spot);
  H.drum = plan.strikeAt === w.struckAt && plan.spot === spot && plan.layout === birdLayout ? plan.drum : drumPoseAt(spot, H.to.flip);
  H.F = Math.max(160, Math.min(flightMs(Math.hypot(H.to.x - H.drum.x, H.to.y - H.drum.y)), rest - B_LINGER - B_SETTLE - 120));
  H.total = B_LINGER + H.F + B_SETTLE;
  return H;
}

// Its pose at this moment (tp: the tick, and how far through it, as drawn).
const ARRIVE_FROM = { x: 0, y: 0, s: 0.3, flip: 1, rot: 0 };
function posture(w, tp, now) {
  const P = pose, ms = tickMs(), lively = !reduced;
  P.alpha = 1; P.thrust = 0; P.blur = 0; P.gape = 0; P.air = 0; P.wing = 0; P.stroke = 1; P.sweep = 0; P.near = P.far = 1; P.feet = 1; P.crouch = 0; P.rot = 0;
  P.free = false; P.up = 1.2; P.drum = null; P.blows = 0; P.blink = false; P.rim = false;
  AX = AY = 0; AFREE = Infinity;
  if (w.target.length) {
    const to = (w.strikeAt - tp) * ms, A = aimPlan(w, ms, to), into = A.aimMs - to;
    if (to <= A.depart) aimOff(A.spot, tp - w.strikeAt, A.drum);
    P.fx = A.tx + AX; P.fy = A.ty + AY;
    if (A.hop && into < A.H) flight(A.hop, perchAt(A.spot), Math.max(0, into) / A.H, A.H, P, 'hop', 0, 0);
    else if (to > A.depart) { perched(A.from, P, 'eye'); if (lively) P.crouch = smooth(clamp01(1 - (to - A.depart) / B_TAKEOFF)); }
    else if (to > A.D + B_SETTLE) flight(A.from, atAim(A.drum), (A.depart - to) / A.F, A.F, P, 'out', lively ? 1 : 0, 0);
    else if (to > A.D + 1e-6) { landing(atAim(A.drum), (A.D + B_SETTLE - to) / B_SETTLE, P, 'land'); windUp(A, -to, P); }
    else { drumming(A, -to, P); P.x += AX; P.y += AY; }
    return;
  }
  if (w.struckAt >= 0 && w.last.length) {
    const H = homePlan(w, ms), since = (tp - w.struckAt) * ms;
    P.fx = H.to.x; P.fy = H.to.y - BU * 2;
    if (since < B_LINGER + H.F) aimOff(H.spot, tp - w.struckAt, H.drum);
    if (since < B_LINGER) { P.fx = H.tx + AX; P.fy = H.ty + AY; lingering(atAim(H.drum), clamp01(since / B_LINGER), P); chipsAfter(w, since, P); return; }
    if (since < B_LINGER + H.F) { flight(atAim(H.drum), H.to, (since - B_LINGER) / H.F, H.F, P, 'back', 0, 0.6); chipsAfter(w, since, P); return; }
    if (since < H.total) { landing(H.to, (since - B_LINGER - H.F) / B_SETTLE, P, 'settle'); return; }
    perched(H.to, P, 'rest');
    const kik = since - H.total; // (its "kik!" as it settles: its beak opens)
    if (kik < 110) P.gape = 0.3 * Math.sin(Math.PI * kik / 110);
    return;
  }
  const to = perchAt(restSpot(w));
  if (!w.last.length && w.struckAt < 0) {
    // Coming in from far off, small, as sudden death starts ("kik! kik!
    // kik!"), the moment the engine has it come (its first patch is
    // PECK_ARRIVE_TICKS on).
    const msA = (tp - (w.restUntil - T.PECK_ARRIVE_TICKS)) * ms;
    if (msA >= 0 && msA < B_ARRIVE) {
      if (!lively) { perched(to, P, 'rest'); P.alpha = clamp01(msA / 400); return; }
      const F = B_ARRIVE - B_SETTLE;
      ARRIVE_FROM.x = to.x + (SIZE / 2 - to.x) * 0.55; ARRIVE_FROM.y = SIZE * 0.1; ARRIVE_FROM.flip = to.x < ARRIVE_FROM.x ? -1 : 1;
      P.fx = to.x; P.fy = to.y - BU * 2;
      if (msA < F) { flight(ARRIVE_FROM, to, msA / F, F, P, 'arrive', 0, 0); P.alpha = clamp01(msA / (F * 0.25)); }
      else landing(to, (msA - F) / B_SETTLE, P, 'settle');
      if (msA < 390) P.gape = 0.3 * Math.sin(Math.PI * Math.min(1, (msA % 130) / 70)); // (its three calls: its beak opens on each)
      return;
    }
  }
  perched(to, P, 'rest');
}
function perched(p, P, phase) {
  P.x = p.x; P.y = p.y; P.s = p.s; P.flip = p.flip; P.rot = 0; P.feet = 1; P.wing = 0; P.up = p.up ?? 1.2; P.phase = phase; P.rim = !!p.rim;
}
// A flight from a to b (u: how far through, 0 to 1; ms: how long it takes):
// bounding as a woodpecker does, a burst of wingbeats lifting it, its wings
// tucked as it dips, then beats again, the whole in a swoop; its body
// tipped the way it's going, upright as it takes off, and leaning back
// with its wings up and swept forward as it comes in to land. Off its
// perch crouched (crouch), or with its wings half open already (wing).
// With reduced motion, one smooth glide, its wings out and still.
let PX = 0, PY = 0;
function pathAt(a, b, u, ms, lively) {
  const e = smooth(u), dx = b.x - a.x, dy = b.y - a.y, hump = Math.min(BU * 1.1, Math.hypot(dx, dy) * 0.12);
  PX = a.x + dx * e; PY = a.y + dy * e - hump * Math.sin(Math.PI * u);
  if (lively) {
    const nb = Math.max(1, Math.round(ms / 240)), q = u * nb, p = q - Math.min(nb - 1, Math.floor(q));
    PY -= BU * 0.32 * Math.min(1, ms / 300) * Math.sin(Math.PI * u) * Math.sin(Math.PI * p);
  }
}
function flight(a, b, u, ms, P, phase, crouch, wing) {
  u = clamp01(u);
  const lively = !reduced, dx = b.x - a.x;
  pathAt(a, b, u, ms, lively);
  P.x = PX; P.y = PY;
  P.flip = u > 0.86 ? b.flip : Math.abs(dx) > BU * 1.2 ? Math.sign(dx) : b.flip; // (it turns to land, if it must)
  P.s = a.s + (b.s - a.s) * smooth(u);
  const far = Math.hypot(dx, b.y - a.y) || 1;
  let vx = dx / far, vy = (b.y - a.y) / far; // (the way it's going overall, swaying with each swoop and dip)
  if (lively) { pathAt(a, b, Math.min(1, u + 0.02), ms, true); const x1 = PX, y1 = PY; pathAt(a, b, Math.max(0, u - 0.02), ms, true); const ix = x1 - PX, iy = y1 - PY, il = Math.hypot(ix, iy) || 1; vx += 0.6 * ix / il; vy += 0.6 * iy / il; }
  const pitch = Math.max(-0.35, Math.min(1.15, (Math.atan2(vy, vx * P.flip) + Math.PI / 2) * 0.75)); // (0: going straight up; level at about 1.15, and no further nose down)
  const k0 = smooth(clamp01(u / 0.16)), k1 = smooth(clamp01((1 - u) / 0.22));
  P.rot = ((pitch * k0 + a.rot * a.flip * (1 - k0)) * k1 + (b.rot * b.flip - 0.3) * (1 - k1)) * P.flip;
  P.feet = 0; P.air = smooth(clamp01(Math.min(u / 0.15, (1 - u) / 0.2)));
  P.crouch = crouch * (1 - smooth(clamp01(u / 0.15)));
  if (lively) {
    const nb = Math.max(1, Math.round(ms / 240)), q = u * nb, j = Math.min(nb - 1, Math.floor(q)), p = q - j;
    const beat = j < nb - 1 && p > 0.55 ? Math.max(0, 1 - (p - 0.55) / 0.07) : 1; // (tucked, dipping)
    P.wing = Math.max(beat * Math.min(1, wing + u / 0.05), 1 - k1);
    P.stroke = Math.cos(TAU * u * ms / B_BEAT) * k1 + (1 - k1);
  } else {
    P.wing = Math.min(1, wing + u / 0.1);
    P.stroke = 0.55 * k1 + (1 - k1);
  }
  P.sweep = 0.45 * (1 - k1);
  P.phase = phase; P.free = true; P.u = u;
}
// Landing (u, 0 to 1, over B_SETTLE): its wings folding from the flare, its
// body righting, a little settle onto its feet.
function landing(b, u, P, phase) {
  u = clamp01(u);
  const k = smooth(clamp01(u / 0.55));
  P.x = b.x; P.y = b.y; P.s = b.s; P.flip = b.flip;
  P.rot = (b.rot * b.flip - 0.3 * (1 - k)) * b.flip;
  P.wing = 1 - k; P.stroke = 1; P.sweep = 0.45 * (1 - k);
  P.feet = u > 0.2 ? 1 : 0;
  P.crouch = reduced ? 0 : 0.8 * Math.sin(Math.PI * clamp01(u / 0.85));
  P.air = 0.3 * (1 - k); P.up = b.up ?? 1.2;
  P.phase = phase;
}
// As it lands on its chunk, it draws its head back for the first blow.
function windUp(A, t, P) {
  const t0 = A.times[0];
  if (t <= t0 - 100) return;
  P.thrust = t < t0 - 30 ? -1.3 * B_BACK * smooth(clamp01((t - (t0 - 100)) / 70)) : -1.3 * B_BACK * (1 - ((t - (t0 - 30)) / 30) ** 2);
}
// Drumming (t: ms to the strike, as a negative): a blow on each of the
// drum's knocks (A.times), its head driving in and drawing back between
// them, a blur when they come too fast to see; the last on the strike.
function drumming(A, t, P) {
  const d = A.drum, n = A.times.length;
  P.x = d.x; P.y = d.y; P.s = d.s; P.flip = d.flip; P.rot = d.rot; P.feet = 1; P.phase = 'drum';
  let i = 0;
  while (i + 1 < n && A.times[i + 1] <= t) i++;
  if (i < n - 1) {
    const gap = A.times[i + 1] - A.times[i], p = clamp01((t - A.times[i]) / gap);
    P.thrust = B_IN - (B_BACK + B_IN) * Math.pow(Math.sin(Math.PI * p), 0.8);
    P.blur = reduced ? 0 : clamp01((46 - gap) / 16);
  } else P.thrust = B_IN;
  P.drum = A; P.blows = i + 1; P.t = t;
}
// The strike made: its head pulled out of the hole, wings opening, a lean back.
function lingering(d, u, P) {
  P.x = d.x; P.y = d.y; P.s = d.s; P.flip = d.flip; P.feet = 1; P.phase = 'linger';
  P.rot = (d.rot * d.flip - 0.15 * smooth(u)) * d.flip;
  P.thrust = -1.2 * B_BACK * smooth(u); P.wing = 0.6 * smooth(u); P.stroke = 1;
}
// The last blows' chips, still in the air after the strike.
function chipsAfter(w, since, P) {
  if (plan.strikeAt === w.struckAt && since < B_CHIPS) { P.drum = plan; P.blows = -1; P.t = since; }
}

