// The renderer (see render/core.js): each snake's jumps (and their landing
// rings) and its body over holes.

// ------------------------------------------- jumps, and bodies over holes

// A jump, seen from above. Up is toward you, so what's in the air swells,
// and its shadow stays on the ground, falling further off the higher it
// is (away from the light, down and to the right: see drawShadows). Its
// lift is an arch over what it hops: each segment is up by how near it is
// to that (a cell either side: so the head rises as it takes off, is at
// the top over the hurdle, and comes down on the far side, and the neck
// follows it up and over), and the neck is held up by the head (NECK).
// Once it's down, the arch stays over a body it crossed for as long as
// that body's there (CROSS_H: its body bridging the other's, which passes
// under), and over anything else settles down (over a hole, its body
// bridges it: see sinkOf). Drawn ahead, a jump that's sure to go starts up
// before its tick. Taking off puffs dust (see onTick), landing squashes its
// head and rings dust round it, and a faint trail marks its way through
// the air (see drawTrails). With reduced motion: the lift and its shadow,
// and none of the dust or the trail (being in the air is a rule, so it shows).
const NECK = [1, 0.7, 0.4, 0.15], CROSS_H = 0.45, LAND_MS = 230;
function liftOf(s, a, at, k2, now) {
  const hops = a.hops, m = a.n, lift = a.lift, pts = a.pts;
  if (a.lifted) lift.fill(0);
  a.lifted = false;
  let head = 0; // (the head's own lift, before it's eased)
  if (a.ml) { // (a jump seen coming: its head starts up toward what it hops)
    let flying = false;
    for (let j = 0; j < hops.length; j++) if (game.tick - hops[j].tick < hops[j].n) flying = true;
    if (!flying) {
      head = reduced ? +(k2 > 0) : archAt(s, pts[0], pts[1], a.mx, a.my, a.mx, a.my);
      a.liftSw = s.leaps > 0 ? T.LEAP_SWELL_GOLD : T.LEAP_SWELL;
    }
  }
  for (let j = hops.length - 1; j >= 0; j--) {
    const r = hops[j], p = game.tick - r.tick + at, flight = p < r.n; // (how far through its ticks in the air it's drawn: a tick over each cell it hops, and the landing)
    if (!flight && !r.landed) { // (down: its squash, a ring of dust where it came down)
      r.landed = true; r.landedAt = now;
      if (s.alive) { a.landAt = now; dustRing((r.x1 + r.dx + 0.5) * CELL, (r.y1 + r.dy + 0.5) * CELL); }
    }
    if (r.jTick !== game.tick) { // (where in its body the cells it hopped are now, and whether a body still lies under them: once a tick)
      r.jTick = game.tick;
      r.under = false;
      for (let x = r.x0, y = r.y0, n = 0; n < T.LEAP_REACH; n++) {
        const key = y * GRID + x;
        if (x >= 0 && y >= 0 && x < GRID && y < GRID && (cover[key] >= 2 || (cover[key] === 1 && coverBy[key] !== s.id))) r.under = true;
        if (x === r.x1 && y === r.y1) break;
        x += r.dx; y += r.dy;
      }
    }
    const to = flight ? 1 : r.under ? CROSS_H : 0;
    r.h = flight || reduced ? to : r.h + (to - r.h) * (1 - Math.exp(-frameDt / 90));
    if (game.tick > r.until || (!flight && r.h < 0.01 && !to)) { hops.splice(j, 1); continue; }
    if (r.h < 0.005) continue;
    a.liftSw = r.gold ? T.LEAP_SWELL_GOLD : T.LEAP_SWELL;
    for (let i = 0; i < m; i++) {
      const v = r.h * archAt(s, pts[2 * i], pts[2 * i + 1], r.x0, r.y0, r.x1, r.y1);
      if (v > lift[i]) lift[i] = v;
    }
    if (flight && (lift[0] > head || reduced)) head = reduced ? 1 : lift[0]; // (with reduced motion, a still pose up in the air for its ticks there)
  }
  // (the head eased a touch, so a jump seen late, or a guess put right, never pops)
  a.rise = reduced ? head : a.rise + (head - a.rise) * (1 - Math.exp(-frameDt / 25));
  if (a.rise < 0.002) a.rise = 0;
  lift[0] = a.rise;
  for (let i = 1; i < NECK.length && i < m; i++) if (a.rise * NECK[i] > lift[i]) lift[i] = a.rise * NECK[i];
  for (let i = 0; i < m && !a.lifted; i++) if (lift[i] > 0.002) a.lifted = true;
}
// How far up a jump's arch is at (x, y) (units), over the cells it hops
// from (x0, y0) to (x1, y1): at the top over them, down a cell either side.
function archAt(s, x, y, x0, y0, x1, y1) {
  let dx = x / CELL - 0.5 - x0, dy = y / CELL - 0.5 - y0, sx = x1 - x0, sy = y1 - y0;
  if (acrossEdges(s, anim.get(s))) { dx = wd(dx); dy = wd(dy); sx = wd(sx); sy = wd(sy); } // (across a wrapped edge)
  const l2 = sx * sx + sy * sy;
  if (l2) { const t = Math.max(0, Math.min(1, (dx * sx + dy * sy) / l2)); dx -= sx * t; dy -= sy * t; }
  const d = Math.hypot(dx, dy);
  return d < 1 ? Math.cos(d * Math.PI / 2) : 0;
}
// A jump's records, from its leap event: the cells it hops (x0, y0 to x1,
// y1: reach of them, from where it took off), the way it went, its tick,
// how many ticks it's up (n: one over each cell, and the landing), its
// arch's height now, until when.
function hopped(s, e, now) {
  const a = animOf(s, now), hops = a.hops, reach = e.reach || 1, d = s.flight?.dir || s.dir;
  if (hops.length >= 3) hops.shift();
  const across = acrossEdges(s, a), x1 = across ? (e.x + d.x * (reach - 1) + GRID) % GRID : e.x + d.x * (reach - 1), y1 = across ? (e.y + d.y * (reach - 1) + GRID) % GRID : e.y + d.y * (reach - 1);
  hops.push({ x0: e.x, y0: e.y, x1, y1, dx: d.x, dy: d.y, tick: game.tick, n: reach + 1, gold: !!e.gold, h: 1, landed: false, landedAt: 0, until: game.tick + s.body.length + reach + 2, under: false, jTick: -1 });
}
// A golden flight, once up, keeps its arch over the way it really flies
// (once a tick, from onTick): held on, the arch stretches to the head, a
// tick more; turned, a new arch from the turn; down sooner than drawn (a
// bump), it comes down where the engine puts it.
function flying(s, now) {
  const a = anim.get(s), r = a?.hops[a.hops.length - 1];
  if (!r || !r.gold || r.tick === game.tick) return;
  const h = s.body[0], f = s.flight, t = game.tick - r.tick;
  if (f?.gold) {
    if (f.dir.x !== r.dx || f.dir.y !== r.dy) hopped(s, { x: h.x, y: h.y, reach: 1, gold: 1 }, now);
    else { r.x1 = h.x; r.y1 = h.y; r.n = Math.max(r.n, t + 2); }
    const top = a.hops[a.hops.length - 1];
    top.until = Math.max(top.until, game.tick + s.body.length + 2);
    a.leapUntil = Math.max(a.leapUntil || 0, top.until);
  } else if (!r.landed && t + 1 < r.n) { r.n = t + 1; r.x1 = h.x - r.dx; r.y1 = h.y - r.dy; } // (down sooner than drawn: here, now)
}
// The island hop's landing ring: where a jump comes down, on the ground
// under it, in the jump's sky (a golden one's Honey), inked. Every snake
// in the air shows it (anyone can see where a jump will land); your own
// jump, asked for, shows it while the press waits for its hurdle (up
// to LEAP_WINDOW moves), so you see where you'd land. Just where: never whether it's a trap.
// A flier's ring a snake is going for is tinted in that snake's colour
// (see takerOf), so the flier can read the threat and steer away.
function drawLandings(now) {
  if (!game) return;
  const t = reduced ? 0 : now / 1000;
  for (const s of game.snakes) {
    if (!s.flight) ringTints.delete(s); // (down: its next flight's ring starts untinted)
    if (!s.alive) continue;
    let x, y, gold = s.leaps > 0, taker = null;
    if (s.flight?.land) { const c = s.flight.ring || s.flight.land; x = c.x; y = c.y; gold = !!s.flight.gold; taker = takerOf(s, c); } // (its ring: a committed golden flight's, GOLD_FLY cells out)
    else if (s.id === viewerId) {
      const a = anim.get(s);
      if (!a || !a.lr) continue;
      x = a.lx; y = a.ly;
    } else continue;
    const cx = (x + 0.5) * CELL, cy = (y + 0.5) * CELL, r = CELL * (0.38 + 0.04 * Math.sin(t * 9));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = INK; ctx.lineWidth = CELL * 0.22; ctx.stroke();
    ctx.strokeStyle = s.flight ? ringTint(s, gold ? HONEY : SKY, taker) : gold ? HONEY : SKY; ctx.lineWidth = CELL * 0.12; ctx.stroke();
  }
}
// A flier's ring a head could crawl onto before the flier's down, so its
// body lies there when it lands ("Taking a landing"): read from heads and
// rings anyone sees, the same on every screen. (The lesson's ringsInReach
// asks it too.)
const ringDist = (h, ring) => Math.abs(h.x - ring.x) + Math.abs(h.y - ring.y);
const inRingReach = (h, ring) => ring.n >= 2 && ringDist(h, ring) <= ring.n - 1;
// Who's going for a flier's ring: the nearest other snake on the ground
// with it in reach whose head came closer to it on its last move. It says
// who could, never that it will.
function takerOf(flier, ring) {
  let best = null, bestD = Infinity;
  for (const o of game.snakes) {
    if (o === flier || !o.alive || o.flight || o.body.length < 2 || !inRingReach(o.body[0], ring)) continue;
    const d = ringDist(o.body[0], ring);
    if (d < ringDist(o.body[1], ring) && d < bestD) { best = o; bestD = d; }
  }
  return best;
}
// A flier's ring's own colour eased toward its taker's over RING_TINT_MS,
// and back once no one is going for it (at once with reduced motion), in
// tenths so mix's cache stays small. Forgotten once it's down, so a fade
// a short last tick cut off never shows on its next ring.
const RING_TINT_MS = 150, ringTints = new WeakMap(); // flier -> { k, by: the taker's colour }
function ringTint(s, base, taker) {
  let r = ringTints.get(s);
  if (!r) ringTints.set(s, r = { k: 0, by: base });
  if (taker) r.by = colorOf(taker);
  const step = reduced ? 1 : frameDt / RING_TINT_MS;
  r.k = taker ? Math.min(1, r.k + step) : Math.max(0, r.k - step);
  return r.k > 0 ? mix(base, r.by, Math.round(r.k * 10) / 10) : base;
}

// A body over a hole, seen from above: nothing under it, so it's shaded
// underneath (away from the light: see shadeUnder), its shadow falls deeper,
// onto the pit's floor and far wall, softer and further off, with the
// floor round it catching a little light (see drawShadows, pitLight), and
// it's a little smaller the lower it is. Each segment
// hangs over the pit by how far in from its rim it's drawn (hang, 0..1);
// between rims, a span sags a little, most in its middle; a tail end with
// nothing under it beyond the rim droops down into the pit (smaller and
// darker) until it's out of the cell. What's up in the air doesn't sag.
const HANG_RIM = 0.1, SINK_SHRINK = 0.3, SAG = 0.5; // (where the pit's rim is, in from a hole cell's edge, in cells; how much smaller a segment as low as it goes is; how low a span sags)
// How much smaller a segment hanging so low is: a span sags up to 22.5%
// smaller in its middle (at 15% it was under a pixel on a phone), a tail
// end hanging into the pit up to 30%, smoothly between (a tail end
// passes through a span's depths as it goes over the rim).
const SPAN_SHRINK = 0.45, sunk = s => SPAN_SHRINK * Math.min(s, SAG) + (SINK_SHRINK - SPAN_SHRINK * SAG) / (1 - SAG) * Math.max(0, s - SAG);
let supH = new Float32Array(64), supT = new Float32Array(64);
function sinkOf(s, a) {
  const m = a.n, hang = a.hang, sink = a.sink, pts = a.pts;
  if (a.holeTick !== game.tick || a.holeGame !== game) { a.holeTick = game.tick; a.holeGame = game; a.nearHole = nearHole(s); } // (once a tick: is any of it on or leaving a hole?)
  if (!a.nearHole) { if (a.bridging) { hang.fill(0); sink.fill(0); a.bridging = false; } return; }
  let any = false;
  for (let i = 0; i < m; i++) { hang[i] = overHole(pts[2 * i], pts[2 * i + 1]); if (hang[i]) any = true; }
  if (!any) { if (a.bridging) sink.fill(0); a.bridging = false; return; }
  a.bridging = true;
  if (supH.length < m) { supH = new Float32Array(2 * m); supT = new Float32Array(2 * m); }
  // (how many segments to the nearest on firm bark, toward its head, and toward its tail)
  for (let i = 0, last = -1; i < m; i++) { if (hang[i] < 0.02) last = i; supH[i] = last < 0 ? Infinity : i - last; }
  for (let i = m - 1, last = -1; i >= 0; i--) { if (hang[i] < 0.02) last = i; supT[i] = last < 0 ? Infinity : last - i; }
  for (let i = 0; i < m; i++) {
    const o = hang[i], h = supH[i], t = supT[i];
    const z = !o ? 0 : h < Infinity && t < Infinity ? SAG * Math.min(1, Math.min(h, t) / 1.5) // (a span between rims, sagging)
      : h < Infinity ? Math.min(1, 0.8 + 0.2 * (h - 1)) : 0; // (its tail end, hanging off the rim; its head end's in the air, or going in)
    sink[i] = o * z * Math.max(0, 1 - 3 * a.lift[i]);
  }
}
// Is any of a snake's body on a hole, or leaving one?
function nearHole(s) {
  if (!game.holes.size) return false;
  for (const c of s.body) if (c.x >= 0 && c.y >= 0 && c.x < GRID && c.y < GRID && holeMask[c.y * GRID + c.x]) return true;
  if (s.prev) for (const c of s.prev) if (c.x >= 0 && c.y >= 0 && c.x < GRID && c.y < GRID && holeMask[c.y * GRID + c.x]) return true;
  return false;
}
// How far over a pit a point (units) is: 0 on the bark or the rim, rising
// to 1 half a cell in from the rim of the hole cell it's in (a cell with
// holes all round is all pit).
function overHole(x, y) {
  const fx = x / CELL, fy = y / CELL, cx = Math.floor(fx), cy = Math.floor(fy), key = cy * GRID + cx;
  if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID || !holeMask[key]) return 0;
  const u = fx - cx, v = fy - cy;
  let d = 0.5;
  if (cx > 0 && !holeMask[key - 1]) d = Math.min(d, u);
  if (cx < GRID - 1 && !holeMask[key + 1]) d = Math.min(d, 1 - u);
  if (cy > 0 && !holeMask[key - GRID]) d = Math.min(d, v);
  if (cy < GRID - 1 && !holeMask[key + GRID]) d = Math.min(d, 1 - v);
  const k = Math.max(0, Math.min(1, (d - HANG_RIM) / (0.5 - HANG_RIM)));
  return k * k * (3 - 2 * k);
}
