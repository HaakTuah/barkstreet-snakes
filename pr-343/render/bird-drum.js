// The renderer (see render/core.js): how the woodpecker clings to drum a
// spot, which way it chooses, and what it hides of the board.

// How it clings to drum a spot: upright, facing the way it came (flip),
// its beak's tip on the spot, if all of it fits on the screen there (its
// head drawn back, its settle and its lean back as it lands too); else leaning, else facing the
// other way, else lying level, its beak down at the spot (the bottom
// rows, with the board's bottom at the screen's) or up; else smaller.
// (Upright on the bottom row, its tail hung four cells below the board,
// past the bottom of a phone on its side.) With it, the other ways it
// could cling there as big (alts, the first this one): upright or
// leaning, facing either way (or, where it must lie level, lying level),
// for drumChoice.
const DRUM_TRIES = [0, 1, 0.45, 1, -0.45, 1, 0, -1, 0.45, -1, -0.45, -1, Math.PI / 2, 1, -Math.PI / 2, 1, Math.PI / 2, -1, -Math.PI / 2, -1], DRUM_SIZES = [1, 0.85, 0.72, 0.6, 0.5, 0.42, 0.375]; // (the last three only for a phone's bigger bird, down to 0.6 of 2k's: corners of a short screen)
const AIM_REACH = CELL / 2 - AIM_IN; // (how far its aim beside a snake can move the whole of it, board px: see freeAim. Since 2k, bigger, a pose fitted at the cell's middle could be moved off the screen by it)
const DRUM_UPRIGHT = 12; // (the tries upright or leaning: the first six)
const probe = { x: 0, y: 0, s: 1, flip: 1, rot: 0, crouch: 0, wing: 0, stroke: 1, sweep: 0, near: 1, far: 1, feet: 1, turn: 0, thrust: 0, air: 0 };
function drumPoseAt(spot, flip) {
  const key = spot * 2 + (flip > 0 ? 1 : 0);
  let d = drumAt.get(key);
  if (d) return d;
  const tx = (spot % GRID) * CELL + CELL / 2, ty = Math.floor(spot / GRID) * CELL + CELL / 2, Q = probe;
  let best = null, least = Infinity;
  for (const s of DRUM_SIZES) {
    if (s < 0.6 && !(BU > CELL * 0.85 * BIRD_GROW * 1.001)) break; // (the smaller ones only for a phone's bigger bird: the desktop's as it was)
    for (let i = 0; i < DRUM_TRIES.length; i += 2) {
      if (d && (i < DRUM_UPRIGHT) !== d.upright) break; // (no lying level where it can stand)
      const f = flip * DRUM_TRIES[i + 1];
      Q.s = s; Q.flip = f; Q.rot = DRUM_TRIES[i] * f; Q.x = Q.y = 0; Q.turn = 0; Q.thrust = 0; Q.crouch = 0;
      birdMats(Q);
      Q.x = tx - atX(HM, BILL[0], BILL[1]); Q.y = ty - atY(HM, BILL[0], BILL[1]);
      Q.thrust = B_IN; birdBox(Q, true);
      Q.thrust = -1.3 * B_BACK; Q.crouch = 0.8; birdBox(Q, false);
      Q.crouch = 0; Q.rot = (DRUM_TRIES[i] - 0.3) * f; birdBox(Q, false); Q.rot = DRUM_TRIES[i] * f; // (and leaning back as it lands, or as it pulls out of the hole)
      const over = Math.max(room.x0 - box.x0, room.y0 - box.y0, box.x1 - room.x1, box.y1 - room.y1) + AIM_REACH; // (and room for its aim beside a snake to move it, see aimOff)
      if (over <= 0) { const p = { x: Q.x, y: Q.y, s, flip: f, rot: Q.rot, upright: i < DRUM_UPRIGHT }; if (d) d.alts.push(p); else { d = p; d.alts = [p]; } }
      else if (!d && over < least) { least = over; best = { x: Q.x, y: Q.y, s, flip: f, rot: Q.rot }; }
    }
    if (d) break;
  }
  if (!d) { d = best; d.alts = [best]; }
  drumAt.set(key, d);
  return d;
}
// Which of those ways it clings by, drumming: the one that hides least of
// what you need to see then, as the board stands: the rings where the
// food in its mark will land (the strike's promise, twice what anything
// else counts), then the heads, the food (trembling in its mark or lying
// near) and the tiles of its mark (all of them together counting as one
// head, so a ring still outweighs them). As it came, upright,
// if that's as clear. (Since 2k, bigger, it would hide more of those
// beside its spot than it did at 1.3 if it didn't weigh them. What it
// still covers of the rings is drawn over it: see drawWoodpecker.)
const SEE_RING = 4, SEE_HEAD = 2, SEE_FOOD = 2, SEE_TILE = 2;
let seeN = 0, seeX = new Float32Array(32), seeY = new Float32Array(32), seeW = new Float32Array(32);
function drumChoice(w, spot, flip) {
  const d = drumPoseAt(spot, flip);
  if (d.alts.length < 2) return d;
  const lands = knockCells(w);
  seeN = 0;
  const see = (x, y, wt) => {
    if (seeN === seeX.length) { const grow = a => { const b = new Float32Array(2 * a.length); b.set(a); return b; }; seeX = grow(seeX); seeY = grow(seeY); seeW = grow(seeW); }
    seeX[seeN] = (x + 0.5) * CELL; seeY[seeN] = (y + 0.5) * CELL; seeW[seeN++] = wt;
  };
  for (let i = 0; i < lands.length; i += 2) see(lands[i], lands[i + 1], SEE_RING);
  for (const s of game.snakes) if (s.alive && s.body.length) see(s.body[0].x, s.body[0].y, SEE_HEAD);
  for (const f of game.food) see(f.x, f.y, SEE_FOOD);
  for (const c of w.target) see(c % GRID, Math.floor(c / GRID), SEE_TILE / w.target.length);
  if (!seeN) return d;
  let pick = d, least = Infinity;
  for (const p of d.alts) {
    const c = hides(p);
    if (c < least - 1e-6) { least = c; pick = p; }
  }
  return pick;
}
// How much of those (seeX, seeY: each a ring's round, its middle and eight
// points on it) the bird drumming in pose p covers: its body, its tail,
// its head and beak, ink and all.
let SEE_R = CELL * 0.4 + BOX_EDGE * BU; // (its ink's soft edge too, which grew with the bird in 2c)
function growBird(grow) { // (its size, times its first: BU and what's worked out from it)
  BU = CELL * 0.85 * grow; PERCH_NEAR = 0.65 * 1.3 / grow; B_IN = 0.06 * 1.3 / grow; SEE_R = CELL * 0.4 + BOX_EDGE * BU;
}
function hides(p) {
  const Q = probe;
  Q.x = p.x; Q.y = p.y; Q.s = p.s; Q.flip = p.flip; Q.rot = p.rot; Q.turn = 0; Q.thrust = B_IN; Q.crouch = 0;
  birdMats(Q);
  let sum = 0;
  for (let j = 0; j < seeN; j++) {
    let n = 0;
    for (let q = 0; q < 9; q++) {
      const a = q * TAU / 8, x = seeX[j] + (q < 8 ? Math.cos(a) * SEE_R : 0), y = seeY[j] + (q < 8 ? Math.sin(a) * SEE_R : 0);
      if (covers(x, y)) n++;
    }
    sum += seeW[j] * n / 9;
  }
  return sum;
}
function covers(x, y) { // (is board point x, y under the bird as its frames BM and HM stand?)
  let m = BM, det = m[0] * m[3] - m[1] * m[2], dx = x - m[4], dy = y - m[5];
  let u = (m[3] * dx - m[2] * dy) / det, v = (m[0] * dy - m[1] * dx) / det;
  if (((u + 0.1) / 1.07) ** 2 + ((v - 0.3) / 1.67) ** 2 <= 1 || inTri(u, v, -0.55, 1.1, -0.15, 3.1, 0.3, 1.2)) return true; // (its body; its tail)
  m = HM; det = m[0] * m[3] - m[1] * m[2]; dx = x - m[4]; dy = y - m[5];
  u = (m[3] * dx - m[2] * dy) / det; v = (m[0] * dy - m[1] * dx) / det;
  return ((u - 0.45) / 0.84) ** 2 + ((v + 1.75) / 0.82) ** 2 <= 1 || (u + 0.12) ** 2 + (v + 1.95) ** 2 <= 0.42 ** 2 || inTri(u, v, 1.05, -2.0, BILL[0], BILL[1], 1.05, -1.5); // (its head, its nape, its beak)
}
function inTri(x, y, ax, ay, bx, by, cx, cy) {
  const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by), d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy), d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
