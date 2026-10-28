// The renderer (see render/core.js): Sovereign's realm and Colonist's
// colonies, land on a map, traced and cached as layers.

// ------------------------------------------------------- homes and flags

// Sovereign's realm and Colonist's colonies are land on a map, drawn the
// way an old hand-coloured map (or a grand strategy game) draws a country:
// its cells washed in the owner's colour, deepest in a band along the
// inside of its border, and the border an inked line along the cell
// edges, its corners rounded. The cells are the land the rules mean (see
// onLand), so a head on a washed cell is on it, and one off it isn't.
// Where two owners' land meets, the line is dashed in both colours; land
// both claim is hatched in both. Holes are lost land: the wash and the
// line go round them. Sovereign's capital flies a banner, the colonies
// their flags. While a rival's head is on the land, its border breathes
// softly; where one crosses in, it lights up from there.
//
// Each owner's land is a cached layer (and a second, its border's glow),
// made again only when that land changes: it grows, shrinks or moves, a
// colony comes or goes, a hole is pecked in it, or a neighbour's land
// changes beside it. A change plays out a ring of cells at a time, so the
// border grows across the log (with reduced motion, at once), and when
// its owner goes, the land shrinks back into its capital. Per frame: a
// blit or two an owner, one for the contested dashes, and the flags.

// A colour with an alpha, as a string, cached. The alpha is quantised to
// 1/255 (all the canvas keeps of it anyway), so an alpha that changes every
// frame costs a lookup and the cache stays bounded: at most 256 strings a
// colour (and it's cleared every round, as a backstop).
const rgbaCache = new Map(); // hex -> [256] strings, by alpha
function rgba(hex, a) {
  let byA = rgbaCache.get(hex);
  if (!byA) rgbaCache.set(hex, byA = new Array(256));
  const q = a > 0 ? (a < 1 ? Math.round(a * 255) : 255) : 0;
  let v = byA[q];
  if (!v) { const n = parseInt(hex.slice(1), 16); v = byA[q] = `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${(q / 255).toFixed(3)})`; }
  return v;
}
// The land rule, the one the AIs, the banner and the chatter go by: a
// cell is a field's land when its centre is within the field's radius
// (plus LAND_REACH) of the field's centre cell. Every land test in the
// renderer goes through the realms' masks, made with this.
const onLand = (f, x, y) => Math.hypot(x - f.x, y - f.y) <= f.radius + T.LAND_REACH;

// Tracing cells' outline (land, a hollow, the woodpecker's patch): every
// exposed side of a marked cell, chained into loops that run clockwise
// with the cells on their right (y down), as the grid points they pass.
// Where two cells meet only at a corner, a loop keeps to its own cell, so
// each keeps its own rounded corner. Into arrays made once: loop l is
// points tAt[l] to tAt[l + 1] - 1, each the start of one side (tSide: its
// cell * 4 + 0 top, 1 right, 2 bottom or 3 left).
const N2 = GRID * GRID, W1 = GRID + 1;
const SX0 = [0, 1, 1, 0], SY0 = [0, 0, 1, 1], SX1 = [1, 1, 0, 0], SY1 = [0, 1, 1, 0], NX = [0, 1, 0, -1], NY = [-1, 0, 1, 0];
const tOut = new Int32Array(2 * W1 * W1), tOpen = new Uint8Array(4 * N2), tSeen = new Uint8Array(4 * N2);
const tX = new Int8Array(4 * N2), tY = new Int8Array(4 * N2), tSide = new Int32Array(4 * N2), tKind = new Uint8Array(4 * N2), tAt = new Int32Array(N2 + 1);
let tLoops = 0;
function traceCells(m) {
  tOut.fill(-1); tOpen.fill(0); tSeen.fill(0);
  for (let i = 0; i < N2; i++) {
    if (!m[i]) continue;
    const x = i % GRID, y = (i - x) / GRID;
    for (let sd = 0; sd < 4; sd++) {
      const nx = x + NX[sd], ny = y + NY[sd];
      if (nx >= 0 && ny >= 0 && nx < GRID && ny < GRID && m[ny * GRID + nx]) continue;
      const e = 4 * i + sd, p = 2 * ((y + SY0[sd]) * W1 + x + SX0[sd]);
      tOpen[e] = 1;
      if (tOut[p] < 0) tOut[p] = e; else tOut[p + 1] = e;
    }
  }
  let n = 0;
  tLoops = 0;
  for (let e0 = 0; e0 < 4 * N2; e0++) {
    if (!tOpen[e0] || tSeen[e0]) continue;
    tAt[tLoops++] = n;
    for (let e = e0; e >= 0 && !tSeen[e];) {
      tSeen[e] = 1;
      const i = e >> 2, sd = e & 3, x = i % GRID, y = (i - x) / GRID;
      tX[n] = x + SX0[sd]; tY[n] = y + SY0[sd]; tSide[n++] = e;
      const p = 2 * ((y + SY1[sd]) * W1 + x + SX1[sd]), b = tOut[p + 1];
      e = b >= 0 && b >> 2 === i ? b : tOut[p]; // (at a corner shared with a diagonal cell: keep to the same cell)
    }
  }
  tAt[tLoops] = n;
}
// Loop l's corners, placed `inset` units in toward its cells and pushed
// `push` units out past the board's edge (a hollow there is a notch
// bitten out of the log: its outline runs on under the frame), each with
// how round it is (a corner of the cells `out`, a notch `inn`), the way on
// from it and where it is on the grid. Into qx, qy, qr, qdx, qdy, qgx, qgy;
// says how many.
const qx = new Float32Array(4 * N2), qy = new Float32Array(4 * N2), qr = new Float32Array(4 * N2), qdx = new Int8Array(4 * N2), qdy = new Int8Array(4 * N2), qgx = new Int16Array(4 * N2), qgy = new Int16Array(4 * N2);
function cornersOf(l, inset, out, inn, push) {
  const a = tAt[l], n = tAt[l + 1] - a;
  let m = 0;
  for (let j = 0; j < n; j++) {
    const p = a + (j + n - 1) % n, i = a + j, q = a + (j + 1) % n;
    const ax = tX[i] - tX[p], ay = tY[i] - tY[p], bx = tX[q] - tX[i], by = tY[q] - tY[i];
    if (ax === bx && ay === by) continue;
    let x = tX[i] * CELL - inset * (ay + by), y = tY[i] * CELL + inset * (ax + bx); // (in from both sides: the cells are on the right, -dy, dx)
    if (push) {
      if (tX[i] === 0) x -= push; else if (tX[i] === GRID) x += push;
      if (tY[i] === 0) y -= push; else if (tY[i] === GRID) y += push;
    }
    qx[m] = x; qy[m] = y; qr[m] = ax * by - ay * bx > 0 ? out : inn; qdx[m] = bx; qdy[m] = by; qgx[m] = tX[i] * CELL; qgy[m] = tY[i] * CELL;
    m++;
  }
  return m;
}
// The corners at hand (from cornersOf) as a closed path on p (a context or a Path2D).
function cornersPath(p, m) {
  if (m < 4) return;
  p.moveTo((qx[m - 1] + qx[0]) / 2, (qy[m - 1] + qy[0]) / 2);
  for (let j = 0; j < m; j++) { const n = (j + 1) % m; p.arcTo(qx[j], qy[j], qx[n], qy[n], qr[j]); }
  p.closePath();
}

// Each realm: an owner's land as it's shown (and the land it's heading
// for, as it changes), and its cached layers.
const GROW_MS = 55;              // (a ring of land this often, as it changes)
const RC = CELL / 2;             // (how round its corners are: half a cell, so a diagonal edge is a hand-drawn wave)
const HOLE_LOST = -1000;         // (land lost to a hole goes at once)
const LAND_BAND = [1.3, 0.05, 0.9, 0.06, 0.55, 0.08]; // (the soft band inside the border: width in cells, alpha, ...)
const LAND_INK = 'rgba(28,18,9,0.92)', KEYLINE = 'rgba(246,236,210,0.75)', BORDER_INK = 2.2, BORDER_KEY = 1.2; // (a border's ink and its parchment keyline, and their widths in units)
const KEYLINE_SOLID = '#ddd0b2'; // (the keyline, opaque, for round a rival on the land)
const realms = new Map();        // owner -> realm
const fieldSpecs = [];           // this frame's realms, in drawing order
const inField = new Map();       // snake -> the owners whose land its head was on last frame
const ripples = [];              // a ripple where a head crossed onto someone's land: { x, y, color, at }
const landQ = new Int16Array(N2), landD = new Int16Array(N2), lostD = new Int16Array(N2), landWas = new Uint8Array(N2), otherLand = new Uint8Array(N2);
function newRealm(s) {
  return {
    owner: s, color: s.color, idx: 0, gone: false, fieldSig: NaN, sig: NaN,
    sites: [], // (its fields as last seen, the capital first: { x, y, radius })
    target: new Uint8Array(N2), shown: new Uint8Array(N2), from: new Uint8Array(N2), order: new Int16Array(N2),
    steps: 0, step: -1, stepAt: 0, bx0: 0, by0: 0, bx1: -1, by1: -1, // (the cells a change spans: its layers' size while it plays out)
    layer: null, glow: null, X: 0, Y: 0, builtK: 0, dirty: true, any: false,
    shared: [], sharedAt: [], sharedTo: [], // (its contested sides: see sideLine; where each starts; and the realm across each, where only this one has the side)
    changedAt: -1e9, alertA: 0, pulses: [],
    fallen: [], // (its colonies lost to the woodpecker, a while: { x, y, radius, at }, see drawColonyFlags)
    banner: null, // (its banner as drawn, carried when its capital moves: see drawRealmBanner)
    spare: null, // (its layers as a strike will leave them, made ahead: see prebuild)
  };
}
// An owner's fields, as one number (a guest online gets fresh ones every tick).
function fieldsSig(s) {
  let h = 7;
  const home = s.memory.home;
  if (home) h = (h * 131 + (home.y * GRID + home.x) * 16 + home.radius) % 1000000007;
  if (s.memory.colonies) for (const c of s.memory.colonies) h = (h * 131 + (c.y * GRID + c.x) * 16 + c.radius + 1) % 1000000007;
  return h;
}
function sitesOf(r, s) {
  r.sites.length = 0;
  if (s.memory.home) r.sites.push({ x: s.memory.home.x, y: s.memory.home.y, radius: s.memory.home.radius });
  if (s.memory.colonies) for (const c of s.memory.colonies) r.sites.push({ x: c.x, y: c.y, radius: c.radius });
}
// The land a realm should show: its fields' land, less the holes (none, once its owner's gone).
function claimInto(r) {
  const m = r.target;
  m.fill(0);
  if (r.gone) return;
  for (const f of r.sites) {
    const R = f.radius + T.LAND_REACH;
    for (let y = Math.max(0, Math.ceil(f.y - R)); y <= Math.min(GRID - 1, Math.floor(f.y + R)); y++) {
      for (let x = Math.max(0, Math.ceil(f.x - R)); x <= Math.min(GRID - 1, Math.floor(f.x + R)); x++) {
        if (onLand(f, x, y) && !game.holes.has(y * GRID + x)) m[y * GRID + x] = 1;
      }
    }
  }
}
// How far cell i is from the nearest of a realm's field centres, in rings.
function ringOf(r, i) {
  const x = i % GRID, y = (i - x) / GRID;
  let d = Infinity;
  for (const f of r.sites) d = Math.min(d, Math.hypot(x - f.x, y - f.y));
  return 1 + Math.floor(d);
}
// A change of land, played out a ring at a time (order: the step a cell
// comes at, or minus the step it goes at). Cells gained: nearest the land
// kept first, and new land round its field's centre, as a circle. Cells
// lost: farthest from what's kept first, or with nothing kept (its owner's
// gone), farthest from its centres, so it shrinks back into its capital.
// Holes take their cell at once.
function planGrowth(r) {
  const t = r.target, sh = r.shown, ord = r.order;
  let qn = 0, kept = false;
  landD.fill(-1);
  for (let i = 0; i < N2; i++) if (t[i] && sh[i]) { landD[i] = 0; landQ[qn++] = i; kept = true; }
  for (const f of r.sites) { const i = f.y * GRID + f.x; if (t[i] && landD[i] < 0) { landD[i] = 0; landQ[qn++] = i; } }
  spread(qn);
  let most = 0;
  for (let i = 0; i < N2; i++) {
    ord[i] = 0;
    if (!t[i] || sh[i]) continue;
    const ring = ringOf(r, i), d = kept ? landD[i] : -1;
    ord[i] = d >= 1 && d <= ring ? d : ring;
    if (ord[i] > most) most = ord[i];
  }
  qn = 0;
  landD.fill(-1);
  for (let i = 0; i < N2; i++) if (t[i]) { landD[i] = 0; landQ[qn++] = i; }
  spread(qn);
  let far = 0;
  for (let i = 0; i < N2; i++) {
    if (!sh[i] || t[i] || game.holes.has(i)) continue;
    const pit = pitRing(r, i); // (a colony lost to the woodpecker: its land shrinks away into its pit)
    lostD[i] = pit > 0 ? pit : qn ? Math.max(1, landD[i]) : ringOf(r, i);
    if (lostD[i] > far) far = lostD[i];
  }
  for (let i = 0; i < N2; i++) if (sh[i] && !t[i]) ord[i] = game.holes.has(i) ? HOLE_LOST : -(far + 1 - lostD[i]);
  r.steps = Math.max(most, far);
  r.from.set(sh);
  r.step = 0;
  // (its layers span all of it, before and after, while it plays out: they're not made again at every size)
  r.bx0 = r.by0 = GRID; r.bx1 = r.by1 = -1;
  for (let i = 0; i < N2; i++) if (t[i] || sh[i]) spanCell(r, i);
}
// How far cell i is from the pit of a colony of r's that fell into one, in
// rings (0 if it isn't that colony's land).
function pitRing(r, i) {
  const x = i % GRID, y = (i - x) / GRID;
  for (const f of r.fallen) if (onLand(f, x, y)) return 1 + Math.floor(Math.hypot(x - f.x, y - f.y));
  return 0;
}
function spanCell(r, i) {
  const x = i % GRID, y = (i - x) / GRID;
  if (x < r.bx0) r.bx0 = x;
  if (x > r.bx1) r.bx1 = x;
  if (y < r.by0) r.by0 = y;
  if (y > r.by1) r.by1 = y;
}
// Distances from the cells already queued, cell by cell (a breadth-first spread).
function spread(qn) {
  for (let read = 0; read < qn; read++) {
    const i = landQ[read], x = i % GRID, d = landD[i] + 1;
    if (x > 0 && landD[i - 1] < 0) { landD[i - 1] = d; landQ[qn++] = i - 1; }
    if (x < GRID - 1 && landD[i + 1] < 0) { landD[i + 1] = d; landQ[qn++] = i + 1; }
    if (i >= GRID && landD[i - GRID] < 0) { landD[i - GRID] = d; landQ[qn++] = i - GRID; }
    if (i < N2 - GRID && landD[i + GRID] < 0) { landD[i + GRID] = d; landQ[qn++] = i + GRID; }
  }
}
// The land shown at step n of a change (or, n < 0, all of where it was heading).
function showStep(r, n) {
  const sh = r.shown, from = r.from, ord = r.order;
  landWas.set(sh);
  if (n < 0) sh.set(r.target);
  else {
    for (let i = 0; i < N2; i++) {
      const o = ord[i];
      sh[i] = o > 0 ? (o <= n ? 1 : from[i]) : o < 0 ? (o === HOLE_LOST || -o <= n ? 0 : from[i]) : from[i];
    }
  }
  markDirty(r);
}
// A realm's land changed (from landWas): its layers are made again, and so
// are those of any other realm a changed cell lies on or beside (its
// contested sides moved).
function markDirty(r) {
  r.dirty = true;
  for (const o of fieldSpecs) {
    if (o === r || o.dirty) continue;
    const m = o.shown;
    for (let i = 0; i < N2; i++) {
      if (r.shown[i] === landWas[i]) continue;
      const x = i % GRID;
      if (m[i] || (x > 0 && m[i - 1]) || (x < GRID - 1 && m[i + 1]) || (i >= GRID && m[i - GRID]) || (i < N2 - GRID && m[i + GRID])) { o.dirty = true; break; }
    }
  }
}
function updateRealm(r, now) {
  const sig = ((r.fieldSig * 31 + game.holes.size) * 2 + (r.gone ? 1 : 0)) % 1000000007;
  if (sig !== r.sig) {
    r.sig = sig;
    claimInto(r);
    let differs = false;
    for (let i = 0; i < N2 && !differs; i++) differs = r.target[i] !== r.shown[i];
    if (differs) {
      if (!r.gone) r.changedAt = now;
      if (reduced) { showStep(r, -1); r.step = -1; spanShown(r); }
      else {
        planGrowth(r);
        if (!r.steps) { showStep(r, -1); r.step = -1; spanShown(r); } else { showStep(r, 0); r.stepAt = now; }
      }
    }
  }
  if (r.step >= 0 && now - r.stepAt >= GROW_MS) {
    r.step++;
    r.stepAt = now;
    if (r.step < r.steps) showStep(r, r.step);
    else { showStep(r, -1); r.step = -1; spanShown(r); } // (done: its layers shrink to what's left)
  }
}
function spanShown(r) {
  r.bx0 = r.by0 = GRID; r.bx1 = r.by1 = -1;
  for (let i = 0; i < N2; i++) if (r.shown[i]) spanCell(r, i);
}

// A realm's cached layers, made again: its land and its border's glow, the
// size of the cells it spans (and a margin, for the line and the glow),
// landing on whole device pixels.
const LAND_MARGIN = 10;
const shownOf = o => o.shown;
function buildRealm(r) {
  r.dirty = false; r.builtK = k; landVer++; landBuilds++;
  const p = prepRealm(r, r, r.shown, r, shownOf, game.holes);
  if (p) for (let st = 0; st < LAND_STEPS; st++) paintLandStep(p, st, r.layer.getContext('2d'), r.glow.getContext('2d'), r.color);
}
// A realm's layers made ready for its land m (r's, or as it will be: see
// the strike's land, below), into `into` (r itself, or its spare): sized
// to the cells m spans (box: bx0..by1), cleared, and the land traced and
// planned (see planLand), against the other realms' land (maskOf) and the
// holes (lost); with its contested sides (dashed in their own layer: see
// buildDashes). Says the plan, to paint (null: no land left).
function prepRealm(into, r, m, box, maskOf, lost) {
  into.shared.length = into.sharedAt.length = into.sharedTo.length = 0;
  into.any = box.bx1 >= 0;
  if (!into.any) return null;
  otherLand.fill(0);
  for (const o of fieldSpecs) if (o !== r) { const om = maskOf(o); for (let i = 0; i < N2; i++) if (om[i]) otherLand[i] = 1; }
  const ux = box.bx0 * CELL - LAND_MARGIN, uy = box.by0 * CELL - LAND_MARGIN;
  into.X = Math.floor(ux * k); into.Y = Math.floor(uy * k);
  const pw = Math.ceil(((box.bx1 + 1) * CELL + LAND_MARGIN) * k) - into.X + 1, ph = Math.ceil(((box.by1 + 1) * CELL + LAND_MARGIN) * k) - into.Y + 1;
  if (!into.layer) { into.layer = makeLayer(pw, ph); into.glow = makeLayer(pw / 2, ph / 2); }
  for (let c = into.layer, j = 0; j < 2; c = into.glow, j++) {
    const s = j ? 0.5 : 1, w = Math.ceil(pw * s), h = Math.ceil(ph * s); // (the glow at half the resolution: it's soft, and a quarter of the pixels to light up)
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.setTransform(k * s, 0, 0, k * s, -into.X * s, -into.Y * s);
    g.lineCap = g.lineJoin = 'round';
  }
  const p = planLand(m, otherLand, lost, r.idx);
  // Where its land runs into another's that also covers its own cell
  // there, only this realm has the side, so it dashes both halves.
  for (let l = 0; l < tLoops; l++) {
    const a = tAt[l], n = tAt[l + 1] - a;
    for (let j = 0; j < n; j++) {
      if (tKind[a + j] !== 1) continue;
      into.sharedAt.push(into.shared.length);
      sideLine(into.shared, a, n, j);
      const e = tSide[a + j], i = e >> 2, across = i + NX[e & 3] + NY[e & 3] * GRID;
      let to = null;
      for (const o of fieldSpecs) { if (o === r) continue; const om = maskOf(o); if (om[across]) { to = om[i] ? o : null; break; } }
      into.sharedTo.push(to);
    }
  }
  into.sharedAt.push(into.shared.length);
  return p;
}
// Side j of the loop at a (n points) as a line of points along the
// rounded border (half of a rounded corner at either end is the side's),
// from its smaller end, so both owners' dashes fall alike: x, y and how
// far along, pushed onto out.
const sidePts = [];
function sideLine(out, a, n, j) {
  const sx = runX(a, n, j), sy = runY(a, n, j), ex = runX(a, n, j + 1), ey = runY(a, n, j + 1);
  const dx = Math.sign(ex - sx), dy = Math.sign(ey - sy);
  const px = Math.sign(sx - runX(a, n, j - 1)), py = Math.sign(sy - runY(a, n, j - 1)); // (the side before...)
  const nx = Math.sign(runX(a, n, j + 2) - ex), ny = Math.sign(runY(a, n, j + 2) - ey); // (...and after)
  sidePts.length = 0;
  if (px !== dx || py !== dy) arcHalf(sx, sy, px, py, dx, dy, 0.5, 1); else sidePts.push(sx, sy);
  if (nx !== dx || ny !== dy) arcHalf(ex, ey, dx, dy, nx, ny, 0, 0.5); else sidePts.push(ex, ey);
  const back = ex < sx || ey < sy, m = sidePts.length / 2;
  let len = 0, lx = 0, ly = 0;
  for (let q = 0; q < m; q++) {
    const p = back ? m - 1 - q : q, x = sidePts[2 * p], y = sidePts[2 * p + 1];
    if (q) len += Math.hypot(x - lx, y - ly);
    out.push(x, y, len);
    lx = x; ly = y;
  }
}
// Part (t0..t1) of the rounded corner at (cx, cy), coming in along (ix, iy) and going on along (ox, oy), onto sidePts.
function arcHalf(cx, cy, ix, iy, ox, oy, t0, t1) {
  const ox0 = cx + (ox - ix) * RC, oy0 = cy + (oy - iy) * RC, a1 = Math.atan2(-iy * RC - (oy - iy) * RC, -ix * RC - (ox - ix) * RC);
  let sweep = Math.atan2(cy + oy * RC - oy0, cx + ox * RC - ox0) - a1;
  if (sweep > Math.PI) sweep -= TAU; else if (sweep < -Math.PI) sweep += TAU;
  for (let s = 0; s <= 4; s++) { const an = a1 + sweep * (t0 + (t1 - t0) * s / 4); sidePts.push(ox0 + Math.cos(an) * RC, oy0 + Math.sin(an) * RC); }
}
// Land (cells m) as it looks, on g: a light wash over all of it, a soft
// band deepening toward its border inside it, a strong riband of colour
// hugging the line (an old map's hand-colouring), hatching where it's
// contested (one diagonal each, by idx, so two owners make a light plaid),
// and the inked line itself, with a parchment keyline just inside it
// (none along the board's edge or a hole: that's coast). The colour alone
// carries nothing for a colour-blind eye (Colonist's rose goes grey-khaki,
// its ink no darker than the bark's grain): the light keyline against the
// ink does, for every eye. On gg, if given, its border's glow, for when it
// lights up. other: the other owners' land; lost: the holes.
function paintLand(g, gg, m, other, col, idx, lost) {
  const p = planLand(m, other, lost, idx);
  for (let st = 0; st < LAND_STEPS; st++) paintLandStep(p, st, g, gg, col);
}
// Land m, traced (see traceCells: its sides' kinds left in tKind) and laid
// out as paths: all of it, its edge (the border and its contested
// sides), its border, and where it's contested, the hatching's cells.
function planLand(m, other, lost, idx) {
  traceCells(m);
  for (let j = 0; j < tAt[tLoops]; j++) {
    const e = tSide[j], i = e >> 2, sd = e & 3, x = i % GRID + NX[sd], y = (i - i % GRID) / GRID + NY[sd];
    tKind[j] = x < 0 || y < 0 || x >= GRID || y >= GRID || lost.has(y * GRID + x) ? 2 : other[y * GRID + x] ? 1 : 0;
  }
  const land = new Path2D(), edge = new Path2D(), border = new Path2D();
  for (let l = 0; l < tLoops; l++) cornersPath(land, cornersOf(l, 0, RC, RC, 0));
  const anyBorder = runsPath(border, 0), anyEdge = runsPath(edge, 0) | runsPath(edge, 1);
  let x0 = GRID, y0 = GRID, x1 = -1, y1 = -1;
  const hatch = new Path2D();
  for (let i = 0; i < N2; i++) {
    if (!m[i] || !other[i]) continue;
    const x = i % GRID, y = (i - x) / GRID;
    hatch.rect(x * CELL, y * CELL, CELL, CELL);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { land, edge, border, hatch, anyBorder, anyEdge, idx, x0, y0, x1, y1 };
}
// The land planned (p) painted, a step at a time, in order: a light wash
// over all of it; inside it (clipped to it), the soft band deepening
// toward its border, a stroke a step; the keyline and the hatching; the
// inked line; its glow, on gg. All at once as it's made, or (the land a
// strike will leave) a step a frame (see prebuild). Each step clips anew,
// as all of them at once did, so either way it's the same pixels.
const LAND_STEPS = 8;
function paintLandStep(p, st, g, gg, col) {
  if (st === 0) { g.fillStyle = rgba(col, 0.1); g.fill(p.land, 'evenodd'); return; }
  if (st <= 4) {
    if (!p.anyEdge) return;
    g.save();
    g.clip(p.land, 'evenodd');
    g.strokeStyle = col;
    if (st < 4) { g.globalAlpha = LAND_BAND[2 * st - 1]; g.lineWidth = LAND_BAND[2 * st - 2] * CELL; }
    else { g.globalAlpha = 0.55; g.lineWidth = 12; } // (half of it shows: 6 units inside the line)
    g.stroke(p.edge);
    g.restore();
    return;
  }
  if (st === 5) {
    if (!p.anyBorder && p.x1 < 0) return;
    g.save();
    g.clip(p.land, 'evenodd');
    if (p.anyBorder) { // (the keyline: inside the land, from the ink's inner edge on; the ink goes over its outer part, below)
      g.strokeStyle = KEYLINE;
      g.lineWidth = 2 * (BORDER_INK / 2 + BORDER_KEY);
      g.stroke(p.border);
    }
    if (p.x1 >= 0) {
      const { x0, y0, x1, y1 } = p;
      g.clip(p.hatch);
      g.strokeStyle = rgba(col, 0.32);
      g.lineWidth = 1.3;
      g.beginPath();
      const L = (x1 - x0 + y1 - y0 + 2) * CELL, X0 = x0 * CELL, Y0 = y0 * CELL, Y1 = (y1 + 1) * CELL;
      for (let d = 0; d <= L; d += 14) { // (diagonals across the box, from its left edge)
        if (p.idx % 2) { g.moveTo(X0 + d - (Y1 - Y0), Y0); g.lineTo(X0 + d, Y1); } else { g.moveTo(X0 + d - (Y1 - Y0), Y1); g.lineTo(X0 + d, Y0); }
      }
      g.stroke();
    }
    g.restore();
    return;
  }
  if (st === 6) {
    if (!p.anyBorder) return;
    g.strokeStyle = LAND_INK;
    g.lineWidth = BORDER_INK;
    g.stroke(p.border);
    return;
  }
  if (gg && p.anyEdge) {
    gg.strokeStyle = col;
    gg.globalAlpha = 0.5; gg.lineWidth = 9; gg.stroke(p.edge);
    gg.globalAlpha = 1; gg.strokeStyle = mix(col, '#fff7e0', 0.45); gg.lineWidth = 2.5; gg.stroke(p.edge);
  }
}
// Every run of traced sides of one kind (0 border, 1 contested) as open
// subpaths of p, rounded at their corners as the land is. Says whether there were any.
function runsPath(p, want) {
  let any = false;
  for (let l = 0; l < tLoops; l++) {
    const a = tAt[l], n = tAt[l + 1] - a;
    let all = true;
    for (let j = a; j < a + n; j++) if (tKind[j] !== want) { all = false; break; }
    if (all) { cornersPath(p, cornersOf(l, 0, RC, RC, 0)); any = true; continue; }
    let s0 = 0;
    while (tKind[a + s0] === want) s0++; // (from just after a run, so none is split where the loop starts)
    for (let m = 1; m <= n; m++) {
      const j = (s0 + m) % n;
      if (tKind[a + j] !== want) continue;
      let e = j;
      while (tKind[a + (e + 1) % n] === want) e++;
      runPath(p, a, n, j, e);
      any = true;
      m += e - j;
    }
  }
  return any;
}
// Sides j0..j1 of the loop at a (n points), as an open path on p. A corner
// at either end is drawn whole, so a run ends round.
const runX = (a, n, j) => tX[a + ((j % n) + n) % n] * CELL, runY = (a, n, j) => tY[a + ((j % n) + n) % n] * CELL;
function runPath(p, a, n, j0, j1) {
  const dx = j => Math.sign(runX(a, n, j + 1) - runX(a, n, j)), dy = j => Math.sign(runY(a, n, j + 1) - runY(a, n, j));
  const corner = j => dx(j - 1) !== dx(j) || dy(j - 1) !== dy(j);
  const x0 = runX(a, n, j0), y0 = runY(a, n, j0);
  if (corner(j0)) { p.moveTo(x0 - dx(j0 - 1) * RC, y0 - dy(j0 - 1) * RC); p.arcTo(x0, y0, x0 + dx(j0) * RC, y0 + dy(j0) * RC, RC); }
  else p.moveTo(x0, y0);
  for (let j = j0; j <= j1; j++) {
    const x = runX(a, n, j + 1), y = runY(a, n, j + 1);
    if (corner(j + 1)) p.arcTo(x, y, x + dx(j + 1) * RC, y + dy(j + 1) * RC, RC);
    else if (j === j1) p.lineTo(x, y);
  }
}

function drawFields(now) {
  fieldSpecs.length = 0;
  for (const s of game.snakes) {
    const owns = s.alive && (s.memory.home || s.memory.colonies);
    let r = realms.get(s);
    if (!owns && !r) continue;
    if (!r) { r = newRealm(s); r.idx = realms.size; realms.set(s, r); } // (its place, for which way it hatches and when its dashes come: kept while it lasts)
    r.gone = !owns;
    if (owns) {
      const sig = fieldsSig(s);
      if (sig !== r.fieldSig) { r.fieldSig = sig; sitesOf(r, s); }
      if (r.color !== s.color) { r.color = s.color; r.dirty = true; }
    }
    fieldSpecs.push(r);
  }
  if (!fieldSpecs.length) return;
  for (const r of fieldSpecs) updateRealm(r, now);
  for (let i = fieldSpecs.length - 1; i >= 0; i--) { // (a fallen owner's land, once it has shrunk away)
    const r = fieldSpecs[i];
    if (r.gone && r.step < 0 && r.bx1 < 0) { realms.delete(r.owner); fieldSpecs.splice(i, 1); }
  }
  let built = fieldSpecs.length !== dash.for, ready = -1, swapped = 0, rebuilt = 0;
  for (const r of fieldSpecs) {
    if (!r.dirty && r.builtK === k) continue;
    if (ready < 0) { ready = pre.ready && preStill() ? 1 : 0; if (!ready && game.woodpecker?.struckAt === game.tick - 1) { if (pre.ready) landStale++; else landUnready++; } } // (the land a strike leaves, made ahead: is it the land now? (if not, at a strike, why not: counted for the tests))
    if (ready && pre.todo.includes(r)) { swapIn(r); swapped++; } else { buildRealm(r); rebuilt++; }
    built = true;
  }
  if (built) {
    if (ready > 0 && !rebuilt && swapped === pre.todo.length) swapDashes();
    else buildDashes();
    pre.ready = false;
  }
  if (prebuilding) prebuild();
  const lively = !reduced, t = now / 1000;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const r of fieldSpecs) if (r.any) ctx.drawImage(r.layer, r.X + shakeX, r.Y + shakeY);
  if (dash.any) ctx.drawImage(dash.layer, dash.X + shakeX, dash.Y + shakeY);
  // Lit up: breathing softly, quicker and brighter, while a rival's head is
  // on the land; flaring as it changes, and in a lightning flash; and from
  // where a head crossed in, lighting up along itself (see drawFieldHues).
  for (const r of fieldSpecs) {
    if (!r.any) continue;
    let alert = false;
    if (!r.gone) {
      for (const s of game.snakes) {
        if (!s.alive || s === r.owner) continue;
        const h = s.body[0];
        if (r.shown[h.y * GRID + h.x]) { alert = true; break; }
      }
    }
    r.alertA += ((alert ? 1 : 0) - r.alertA) * Math.min(1, frameDt / 200);
    const pulse = lively ? 0.5 + 0.5 * Math.sin(t * (2.2 + 5 * r.alertA)) : 0.5;
    const flare = Math.max(0, 1 - (now - r.changedAt) / 900, 1 - (now - flashAt) / 700);
    const a = Math.min(1, r.alertA * (0.1 + 0.15 * pulse) + 0.7 * flare);
    const gw = r.glow.width, gh = r.glow.height;
    if (a > 0.01) { ctx.globalAlpha = a; ctx.drawImage(r.glow, r.X + shakeX, r.Y + shakeY, 2 * gw, 2 * gh); }
    for (let i = r.pulses.length - 1; i >= 0; i--) {
      const p = r.pulses[i], u = (now - p.at) / 650;
      if (u >= 1 || u < 0) { r.pulses.splice(i, 1); continue; }
      const half = CELL * (0.8 + 4 * u) * k / 2, cx = (p.x * k - r.X) / 2, cy = (p.y * k - r.Y) / 2; // (in the glow's half-size pixels)
      const sx = Math.max(0, Math.floor(cx - half)), sy = Math.max(0, Math.floor(cy - half)), ex = Math.min(gw, Math.ceil(cx + half)), ey = Math.min(gh, Math.ceil(cy + half));
      if (ex <= sx || ey <= sy) continue;
      ctx.globalAlpha = 0.9 * (1 - u);
      ctx.drawImage(r.glow, sx, sy, ex - sx, ey - sy, r.X + 2 * sx + shakeX, r.Y + 2 * sy + shakeY, 2 * (ex - sx), 2 * (ey - sy));
    }
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
  // The flags, while the land under them is still there (one the
  // woodpecker pecked out falls into the pit, and a capital's banner is
  // carried to the new one: see drawColonyFlags and drawRealmBanner).
  for (const r of fieldSpecs) {
    const s = r.owner;
    if (s.memory.home) drawRealmBanner(r, s.memory.home, now);
    if (s.memory.colonies) drawColonyFlags(r, now);
  }
  if (fallenFlags.length) drawFallenFlags(now);
}
