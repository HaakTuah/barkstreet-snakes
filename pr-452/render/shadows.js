// The renderer (see render/core.js): the veil (a translucent shape drawn
// opaque and laid on once), the shadows on the bark, and the light in a pit.

// The veil: an offscreen layer the size of the board (and a margin), for
// a translucent shape made of overlapping pieces (every snake's shadow, a
// land's colour round a rival on it). The pieces go into it opaque, with fast
// fills, and it's laid on the board once at the shape's alpha: an even
// shade, without a path of a hundred contours triangulated every frame.
const VEIL_M = 8; // (its margin, in units: the shadow of a body hanging off the edge)
let veil = null, veilG = null, boardG = null;
let veilX = 0, veilY = 0, vx0 = 0, vy0 = 0, vw = 0, vh = 0;
// Draw into the veil (ctx is the veil's until veilOff) within the box
// x0..x1, y0..y1 (units), for a layer that lands (dx, dy) units off.
function veilOn(dx, dy, x0, y0, x1, y1) {
  const w = Math.ceil((SIZE + 2 * VEIL_M) * k);
  if (!veil || veil.width !== w) { veil = makeLayer(w, w); veilG = veil.getContext('2d'); }
  // (It lands on whole device pixels, so it's never resampled.)
  const ex = (dx - VEIL_M) * k + shakeX, ey = (dy - VEIL_M) * k + shakeY;
  veilX = Math.floor(ex); veilY = Math.floor(ey);
  const ox = VEIL_M * k + ex - veilX, oy = VEIL_M * k + ey - veilY;
  vx0 = Math.max(0, Math.floor(x0 * k + ox)); vy0 = Math.max(0, Math.floor(y0 * k + oy));
  vw = Math.min(w, Math.ceil(x1 * k + ox)) - vx0; vh = Math.min(w, Math.ceil(y1 * k + oy)) - vy0;
  veilG.setTransform(1, 0, 0, 1, 0, 0);
  veilG.save();
  veilG.beginPath(); veilG.rect(vx0, vy0, Math.max(0, vw), Math.max(0, vh)); veilG.clip(); // (only the box is touched)
  veilG.clearRect(vx0, vy0, Math.max(0, vw), Math.max(0, vh));
  veilG.setTransform(k, 0, 0, k, ox, oy);
  boardG = ctx;
  ctx = veilG;
}
// Back to the board, laying the veil on it at `alpha`.
function veilOff(alpha) {
  veilG.restore();
  ctx = boardG;
  if (vw <= 0 || vh <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(veil, vx0, vy0, vw, vh, veilX + vx0, veilY + vy0, vw, vh);
  ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
  ctx.globalAlpha = 1;
}

// Pass 1, before any body: the shadows on the bark, all at once (in the
// veil, laid on the bark at 0.3, a little down and to the right). A
// segment up in the air casts its shadow further off, on the ground (see
// liftOf: the higher, the further, and a little smaller, never swollen
// with it): of a snake in the air (live[up..]), that part is laid after
// the bodies on the ground, so the hurdle passes under with the shadow
// across it (see drawAirShadows), and only what's on the ground is laid
// here. What's well over a pit casts its shadow down into the pit, onto
// its floor and far wall: further off (DEEP_DX, DEEP_DY) and a little
// bigger, as a shadow cast further away is, and none on the bark there.
// (In the same veil, with no clip: it's near enough to keep to the pit,
// and the pit is dark.)
const LIFT_DX = CELL * 0.62, LIFT_DY = CELL * 0.82, LIFT_SHRINK = 0.15; // (at the top of a jump: how much further off, and smaller)
const DEEP_DX = CELL * 0.2, DEEP_DY = CELL * 0.28, DEEP_GROW = 1.5, HANG_DRY = 0.5; // (how much further off, and bigger; how far over a pit casts its shadow into it, not on the bark)
function drawShadows(up) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of live) {
    const a = anim.get(s);
    if (a.offs) { x0 = y0 = -VEIL_M; x1 = y1 = SIZE + VEIL_M; break; } // (across a wrapped edge: anywhere)
    for (let i = 0; i < a.n; i++) {
      const x = a.pts[2 * i], y = a.pts[2 * i + 1];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x0 > x1) return;
  veilOn(2, 4, x0 - CELL * 2, y0 - CELL * 2, x1 + CELL * 2, y1 + CELL * 2);
  pitLight(); // (first, the light on a pit's floor round where a span's shadow falls)
  ctx.fillStyle = '#000000';
  for (let j = 0; j < live.length; j++) {
    const a = anim.get(live[j]), offs = a.offs || OFFS, air = j >= up && a.lifted ? 1 : 0;
    for (let pass = a.bridging ? 2 : 1; pass > 0; pass--) { // (into the pit, then on the bark)
      const moved = pass === 2 ? shadowShape(a, true) : air === 0 && a.lifted && shadowShape(a, false); // (a snake on the ground still arching down: moved, under the bodies)
      for (let k = 0; k < offs.length; k++) {
        const ox = offs[k][0], oy = offs[k][1];
        if (ox || oy) ctx.translate(ox, oy);
        bodyFills(a, pass === 2 ? DEEP_GROW : 0, 0, 0, 0, a.bridging ? pass : 0, pass === 2 ? 0 : air);
        if (ox || oy) ctx.translate(-ox, -oy);
      }
      if (moved) unshadow(a);
    }
  }
  veilOff(0.3);
}
// A body well over a pit: the pit's floor is all but black, so a shadow
// on it didn't show, and on a phone the span read as two darker beads,
// not a body over a gap. So the floor round where its shadow falls
// catches a little light, fading out from it, and its shadow lies dark
// in that, further off down and to the right than on the bark: the gap
// under it, seen. Drawn in the shadows' veil before them (it's laid on
// every frame anyway: a layer of its own, laid on too, cost a frame 0.3
// ms to the GPU and up to 2 ms of waiting on it in the script, with four
// snakes across ditches), in the shapes a shadow is (what's well over the
// pit, HANG_DRY, and the bands either side, grown: each straight run one
// rectangle), in faint steps, each cut to the hole cells near it, short
// of the rim where the bark is (as rectangles, worked out: a mask over
// the veil cost a frame 0.7 ms); the shadows go on over it. Where the
// shadow falls on the far wall, it darkens it, as on the bark.
const PIT_LIT = '#c17d41', PIT_GLOW = [16, 12, 8, 4], PIT_STEP = 0.3; // (the light, laid on at the veil's 0.3; its steps, how far round the shadow, units; each one's)
const PIT_REACH = CELL * 0.54 + 18; // (round a segment's shadow well over a pit: a head's radius and the light round it; a band to the next is in its own cell, or the next's, or on the bark)
const pitNear = new Uint8Array(GRID * GRID), pitCells = [];
let pitRuns = new Float32Array(5 * 32), pitRunN = 0; // (the straight runs well over a pit: x0, y0, x1, y1 along the spine, and half the widest segment)
const pitAreas = new Float32Array(4 * GRID * GRID); let pitAreaN = 0; // (the hole cells near them, merged: x0, y0, x1, y1, where the veil draws them)
const pitPend = new Float32Array(5 * 4 * GRID); // (pitCellAreas's runs open from one row to the next)
function pitLight() {
  pitCells.length = 0;
  for (const s of live) { // (the hole cells near each segment well over one)
    const a = anim.get(s);
    if (!a.bridging || a.offs) continue;
    for (let i = 0; i < a.n; i++) {
      if (a.hang[i] < HANG_DRY) continue;
      const x = a.pts[2 * i] + DEEP_DX + 2, y = a.pts[2 * i + 1] + DEEP_DY + 4; // (its shadow)
      const gx0 = Math.max(0, Math.floor((x - PIT_REACH) / CELL)), gx1 = Math.min(GRID - 1, Math.floor((x + PIT_REACH) / CELL));
      const gy0 = Math.max(0, Math.floor((y - PIT_REACH) / CELL)), gy1 = Math.min(GRID - 1, Math.floor((y + PIT_REACH) / CELL));
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const key = gy * GRID + gx;
          if (!holeMask[key] || pitNear[key]) continue;
          pitNear[key] = 1; pitCells.push(key);
        }
      }
    }
  }
  if (!pitCells.length) return;
  pitRunN = 0;
  for (const s of live) {
    const a = anim.get(s);
    if (!a.bridging || a.offs) continue;
    shadowShape(a, true);
    gatherRuns(a);
    unshadow(a);
  }
  pitCellAreas();
  ctx.fillStyle = PIT_LIT;
  ctx.globalAlpha = PIT_STEP;
  for (const grow of PIT_GLOW) {
    for (let r = 0; r < pitRunN; r++) {
      const g = pitRuns[5 * r + 4] + grow, x0 = pitRuns[5 * r] - g, y0 = pitRuns[5 * r + 1] - g, x1 = pitRuns[5 * r + 2] + g, y1 = pitRuns[5 * r + 3] + g;
      for (let q = 0; q < pitAreaN; q++) {
        const ax = Math.max(x0, pitAreas[4 * q]), ay = Math.max(y0, pitAreas[4 * q + 1]), bx = Math.min(x1, pitAreas[4 * q + 2]), by = Math.min(y1, pitAreas[4 * q + 3]);
        if (bx > ax && by > ay) ctx.fillRect(ax, ay, bx - ax, by - ay);
      }
    }
  }
  ctx.globalAlpha = 1;
}
// (The hole cells marked near a span, as rectangles into pitAreas, short
// of the pit's edge, its ink and all, where the bark is, where the veil
// draws them (it lands 2 and 4 units off): each row's run of them with
// the same rims above and below, and a run going on down the next row,
// the same across and the hole open between, with it: a ditch crossed is
// one. Their marks cleared.)
function pitCellAreas() {
  const PIT_IN = PIT_RIM + 1, hole = key => holeMask[key] === 1;
  let cx0 = GRID, cy0 = GRID, cx1 = -1, cy1 = -1;
  for (const key of pitCells) { const x = key % GRID, y = (key - x) / GRID; if (x < cx0) cx0 = x; if (x > cx1) cx1 = x; if (y < cy0) cy0 = y; if (y > cy1) cy1 = y; }
  pitAreaN = 0;
  let open = 0; // (the runs open from the row before: pitPend[0..open), each x, w, y, h, open below)
  for (let cy = cy0; cy <= cy1 + 1; cy++) {
    let now1 = open;
    for (let cx = cx0; cy <= cy1 && cx <= cx1; cx++) {
      let key = cy * GRID + cx;
      if (!pitNear[key]) continue;
      const t = cy > 0 && hole(key - GRID) ? 0 : PIT_IN, b = cy < GRID - 1 && hole(key + GRID) ? 0 : PIT_IN, l = cx > 0 && hole(key - 1) ? 0 : PIT_IN;
      let ex = cx;
      while (ex < cx1 && pitNear[key + 1] && (cy > 0 && hole(key + 1 - GRID) ? 0 : PIT_IN) === t && (cy < GRID - 1 && hole(key + 1 + GRID) ? 0 : PIT_IN) === b) { ex++; key++; }
      const r = ex < GRID - 1 && hole(key + 1) ? 0 : PIT_IN, x = cx * CELL + l, w = (ex + 1) * CELL - r - x;
      let j = 0;
      while (j < open && !(pitPend[5 * j + 4] === 1 && !t && pitPend[5 * j] === x && pitPend[5 * j + 1] === w)) j++;
      if (j < open) { pitPend[5 * j + 3] += CELL - b; pitPend[5 * j + 4] = (b ? 0 : 1) + 2; } // (it goes on down: carried on)
      else { pitPend[5 * now1] = x; pitPend[5 * now1 + 1] = w; pitPend[5 * now1 + 2] = cy * CELL + t; pitPend[5 * now1 + 3] = CELL - t - b; pitPend[5 * now1 + 4] = (b ? 0 : 1) + 2; now1++; }
      cx = ex;
    }
    let n1 = 0; // (the row before's runs that didn't go on: done; those that did, and this row's, open for the next)
    for (let j = 0; j < now1; j++) {
      const o = pitPend[5 * j + 4];
      if (o >= 2) { pitPend[5 * n1] = pitPend[5 * j]; pitPend[5 * n1 + 1] = pitPend[5 * j + 1]; pitPend[5 * n1 + 2] = pitPend[5 * j + 2]; pitPend[5 * n1 + 3] = pitPend[5 * j + 3]; pitPend[5 * n1 + 4] = o - 2; n1++; continue; }
      const q = 4 * pitAreaN++;
      pitAreas[q] = pitPend[5 * j] - 2; pitAreas[q + 1] = pitPend[5 * j + 2] - 4; pitAreas[q + 2] = pitPend[5 * j] + pitPend[5 * j + 1] - 2; pitAreas[q + 3] = pitPend[5 * j + 2] + pitPend[5 * j + 3] - 4;
    }
    open = n1;
  }
  for (const key of pitCells) pitNear[key] = 0;
}
// (What's well over a pit and the bands either side, as straight runs
// into pitRuns: each run along its spine, and as wide as its widest
// segment; grown, each is one rectangle. A rectangle a piece, circles
// and all, was 0.3 ms a frame for four snakes across ditches, in the
// calls alone.)
let runAX = 0, runAY = 0, runBX = 0, runBY = 0, runH = 0, runFlat = false, runOpen = false; // (the run being gathered)
function gatherRuns(a) {
  const p = a.pts, c = a.cor, rad = a.rad, n = a.n;
  runOpen = false;
  for (let i = 0; i < n - 1; i++) {
    if (leftOut(a, i, i + 1, 2, 0)) { runFlush(); continue; }
    const h = Math.max(rad[i], rad[i + 1]);
    runPiece(p[2 * i], p[2 * i + 1], c[2 * i], c[2 * i + 1], h);
    runPiece(c[2 * i], c[2 * i + 1], p[2 * i + 2], p[2 * i + 3], h);
  }
  runFlush();
}
function runPiece(x1, y1, x2, y2, h) {
  if (near(x1, x2) && near(y1, y2)) return;
  const flat = near(y1, y2);
  if (runOpen && flat === runFlat && near(x1, runBX) && near(y1, runBY)) { runBX = x2; runBY = y2; if (h > runH) runH = h; return; }
  runFlush();
  runAX = x1; runAY = y1; runBX = x2; runBY = y2; runH = h; runFlat = flat; runOpen = true;
}
function runFlush() {
  if (!runOpen) return;
  runOpen = false;
  if (5 * (pitRunN + 1) > pitRuns.length) { const more = new Float32Array(2 * pitRuns.length); more.set(pitRuns); pitRuns = more; }
  const q = 5 * pitRunN++;
  pitRuns[q] = Math.min(runAX, runBX); pitRuns[q + 1] = Math.min(runAY, runBY); pitRuns[q + 2] = Math.max(runAX, runBX); pitRuns[q + 3] = Math.max(runAY, runBY); pitRuns[q + 4] = runH;
}
// The shadows of what of live[up..] is up in the air (and on firm ground
// or by a pit's rim: what's over one has its shadow in the pit already),
// over the bodies on the ground (see drawShadows), moved off: a few
// segments, as one path filled once (an even shade, with no veil to lay).
function drawAirShadows(up) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.translate(2, 4);
  for (let j = up; j < live.length; j++) {
    const a = anim.get(live[j]), offs = a.offs || OFFS;
    if (!a.lifted) continue;
    shadowShape(a, false);
    for (let k = 0; k < offs.length; k++) {
      const ox = offs[k][0], oy = offs[k][1];
      if (ox || oy) ctx.translate(ox, oy);
      airPath(a);
      ctx.fill();
      if (ox || oy) ctx.translate(-ox, -oy);
    }
    unshadow(a);
  }
  ctx.translate(-2, -4);
}
// (As the current path: its pieces up in the air, but those over a pit.)
function airPath(a) {
  const p = a.pts, c = a.cor, rad = a.rad, n = a.n, pit = a.bridging ? 1 : 0;
  ctx.beginPath();
  for (let i = n - 2; i >= 0; i--) {
    if (leftOut(a, i, i + 1, pit, 2)) continue;
    const h = bandR(a, i), x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
    pieceRect(x1, y1, cx, cy, h);
    pieceRect(cx, cy, x2, y2, h);
    if (bends(a, i)) { const r = bandR(a, i); ctx.moveTo(cx + r, cy); ctx.arc(cx, cy, r, 0, TAU); }
  }
  for (let i = n - 1; i >= 0; i--) {
    if (leftOut(a, i, i, pit, 2)) continue;
    if (i === 0 && a.star) { starPath(a, 0); continue; }
    ctx.moveTo(p[2 * i] + rad[i], p[2 * i + 1]);
    ctx.arc(p[2 * i], p[2 * i + 1], rad[i], 0, TAU);
  }
}
// A body's shadow moved (see drawShadows): its points, corners and radii
// swapped for copies (in arrays kept for it, made again only for a longer
// snake), each segment moved off by its lift (and with deep, all of it
// down into the pit: only what's over one is drawn so, and moved alike,
// its bands stay straight, quick rectangles) and sized as on the ground;
// unshadow puts them back.
let shP = new Float32Array(128), shC = new Float32Array(128), shR = new Float32Array(64), keptP = null, keptC = null, keptR = null;
function shadowShape(a, deep) {
  const m = a.n, lift = a.lift, sink = a.sink, sw = a.liftSw, up = a.lifted, dx = deep ? DEEP_DX : 0, dy = deep ? DEEP_DY : 0;
  if (shR.length < m) { shP = new Float32Array(4 * m); shC = new Float32Array(4 * m); shR = new Float32Array(2 * m); }
  for (let i = 0; i < m; i++) {
    const l = up ? lift[i] : 0;
    shP[2 * i] = a.pts[2 * i] + l * LIFT_DX + dx;
    shP[2 * i + 1] = a.pts[2 * i + 1] + l * LIFT_DY + dy;
    shR[i] = a.rad[i] / (1 + l * sw) / (1 - sunk(sink[i])) * (1 - LIFT_SHRINK * l);
    if (i < m - 1) {
      const l2 = up ? (l + lift[i + 1]) / 2 : 0;
      shC[2 * i] = a.cor[2 * i] + l2 * LIFT_DX + dx;
      shC[2 * i + 1] = a.cor[2 * i + 1] + l2 * LIFT_DY + dy;
    }
  }
  keptP = a.pts; keptC = a.cor; keptR = a.rad;
  a.pts = shP; a.cor = shC; a.rad = shR;
  return true;
}
function unshadow(a) { a.pts = keptP; a.cor = keptC; a.rad = keptR; }
// One snake's shadow on its own, as one translucent path (a corpse: it may
// be fading, and it's drawn with its body).
function drawShadow(a) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.translate(2, 4);
  silhouette(a, 0);
  ctx.translate(-2, -4);
}
