// The renderer (see render/core.js): the woodpecker's aim and patch on the
// board, and the holes and pits it leaves on the static layer.

// A promise is never hidden by the bird: where it's over a ring (the food
// in its mark will land there) or over a piece in the air, knocked out of
// the patch or spat, that's drawn again over it, on its own pixels only
// (so nothing is drawn twice where it isn't), moved with the board as it
// shakes. The bird still covers the food in its mark, lying where its
// beak is at work: the rings say where that goes.
let overOn = true; // (off only for the tests, to see it against the bird without)
function overBird(g, w, alpha, now) {
  if (!overOn) return;
  const rings = w.target.length > 0 && knockCells(w).length > 0;
  let flying = false;
  if (!reduced) for (const f of game.food) { const b = f.kind !== 'beetle' && born.get(f.y * GRID + f.x); if (b && b.spat && b.movedAt && now - b.movedAt < b.fly) { flying = true; break; } }
  if (!rings && !flying) return;
  useBase(g);
  g.translate(shakeX / k, shakeY / k);
  g.globalCompositeOperation = 'source-atop';
  if (rings) knockRings(w, aimed(alpha), now, g);
  if (flying) { const was = ctx; ctx = g; try { drawTossed(now); } finally { ctx = was; } }
  g.globalCompositeOperation = 'source-over';
}
// When it lands back on its perch after its last strike, ms after it, as
// drawn (the game says "kik!" then); Infinity if it isn't on its way back.
const birdHome = () => (game?.woodpecker && game.woodpecker.struckAt >= 0 && home.struckAt === game.woodpecker.struckAt ? home.total : Infinity);

// On the board: the chunk it's eyeing glows and cracks, the pulse quickening
// as the strike nears, and its pecks dent the rim. It's traced with the
// outline its pit will have, and all of it lies on the bark, under the
// snakes: a body lying over it bridges the hole to come (only a head on
// the ground in it falls in), so nothing is drawn across a body.
const markSprite = () => sprite('mark', '', drawMark);
const drawMark = g => {
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, CELL * 0.85);
  grad.addColorStop(0, 'rgba(239,68,68,0.55)');
  grad.addColorStop(0.55, 'rgba(220,38,38,0.3)');
  grad.addColorStop(1, 'rgba(220,38,38,0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(0, 0, CELL * 0.85, 0, TAU); g.fill();
};
// How far through its aim it is (0..1), or -1 if it isn't aiming.
function aimed(alpha) {
  const w = game.woodpecker;
  if (!w || !w.target.length) return -1;
  return Math.max(0, Math.min(1, 1 - (w.strikeAt - (game.tick - 1 + alpha)) / T.PECK_AIM_TICKS));
}
function drawPatch(alpha, now) {
  const prog = aimed(alpha), w = game.woodpecker;
  if (prog < 0) return;
  const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now * (0.008 + 0.03 * prog));
  // A red glow welling up through the chunk (soft, cell by cell, so it runs together)...
  ctx.globalAlpha = 0.45 + 0.45 * pulse * (0.4 + prog * 0.6);
  const w2 = SPRITE * CELL * 0.95;
  for (const k of w.target) ctx.drawImage(markSprite(), (k % GRID) * CELL + CELL / 2 - w2 / 2, Math.floor(k / GRID) * CELL + CELL / 2 - w2 / 2, w2, w2);
  ctx.globalAlpha = 1;
  // ...a darker inside, and a pale rim round it (inked, so it shows on pale
  // snakes), bolder and brighter as the strike nears: to colour-blind eyes
  // the red is olive on olive bark, but the dark patch and its rim still
  // read. The rim is its pit's torn lip to come, just inside the patch's
  // edge, wobbling as the lip will, its corners well rounded (a straight
  // piece along every cell's edge, meeting square at every notch, or a thin
  // even line with small corners, read as a computer's selection box). (It
  // used to close in from outside, over cells it wouldn't take.)
  outlinePatch(w);
  const line = 3.6 + 2.2 * prog, half = line / 2;
  ctx.globalAlpha = 0.45 + 0.4 * prog;
  ctx.fillStyle = 'rgba(20,8,2,0.4)';
  ctx.beginPath();
  patchPath(0, MARK_R + half, Math.max(0, PATCH_R_IN - half), MARK_TEAR); // (out to the rim's own outer edge)
  ctx.fill();
  // Cracks spreading from each cell's middle along the grain, as wood
  // splits (faded in as they start, or they're specks), lit along their far
  // lip like a burrow's...
  if (prog > 0) {
    ctx.globalAlpha = Math.min(1, prog * 5);
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const [col, off, lw] of CRACK_LINES) {
      ctx.strokeStyle = col;
      for (let part = 0; part < 2; part++) { // (tapering: from the middle, then on to the tip)
        ctx.lineWidth = lw * (part ? 0.55 : 0.9);
        ctx.beginPath();
        for (let i = 0; i < markN; i++) {
          const x = markCX[i] + off, y = markCY[i] + off;
          for (let p = 8 * i; p < 8 * i + 8; p += 4) {
            if (part) { ctx.moveTo(x + markCr[p] * prog, y + markCr[p + 1] * prog); ctx.lineTo(x + markCr[p + 2] * prog, y + markCr[p + 3] * prog); }
            else { ctx.moveTo(x, y); ctx.lineTo(x + markCr[p] * prog, y + markCr[p + 1] * prog); }
          }
        }
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  patchPath(half, MARK_R, PATCH_R_IN, MARK_TEAR);
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,8,2,0.75)';
  ctx.lineWidth = line;
  ctx.stroke();
  ctx.strokeStyle = rgba('#fef3c7', 0.75 + 0.25 * prog);
  ctx.lineWidth = 1.6 + 1.6 * prog;
  ctx.stroke();
  // ...and its pecks, nicks bitten into the rim from outside, more and more
  // as the strike nears, first and thickest where the bird is at it.
  const dents = Math.floor(prog * dentN);
  if (dents) {
    ctx.fillStyle = '#140a04';
    ctx.beginPath();
    for (let n = 0; n < dents; n++) { const d = dentOrder[n]; ctx.moveTo(dentX[d] + dentR[d], dentY[d]); ctx.arc(dentX[d], dentY[d], dentR[d], 0, TAU); }
    ctx.fill();
    ctx.fillStyle = 'rgba(254,243,199,0.7)'; // (a fleck of pale wood on each one's far side, where the light falls in)
    ctx.beginPath();
    for (let n = 0; n < dents; n++) { const d = dentOrder[n], rr = dentR[d], x = dentX[d] + rr * 0.45, y = dentY[d] + rr * 0.45; ctx.moveTo(x + rr * 0.4, y); ctx.arc(x, y, rr * 0.4, 0, TAU); }
    ctx.fill();
  }
  if (w.fall?.length) fallShade(w.fall, prog, now); // (2s: the pieces it cuts loose, shaded as they'll fall)
  knockRings(w, prog, now); // (and where the food in it will be knocked to)
}
// 2s, a piece cut loose falls: in the mark, the cells that will fall go
// dark with pale streaks sliding down across them (held still under reduced
// motion), so the whole piece reads as going, not only the patch; at the
// strike, the piece tips away about its middle, shrinking and darkening
// into the pit, as the log's bark drops out of sight (PIECE_FALL_MS).
const PIECE_FALL_MS = 750, pieceFalls = [];
const FALL_FOOD = { food: '#65a30d', golden: '#facc15', beetle: '#3f2a14', pellet: '#d6b480', mushroom: '#b91c1c', goldcap: '#facc15', leaf: '#facc15' };
function fallShade(cells, prog, now) {
  ctx.save();
  ctx.beginPath();
  for (const k of cells) ctx.rect((k % GRID) * CELL, Math.floor(k / GRID) * CELL, CELL, CELL);
  ctx.clip();
  ctx.globalAlpha = 0.3 + 0.35 * prog;
  ctx.fillStyle = '#140a04';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.globalAlpha = 0.22 + 0.3 * prog;
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 2;
  const gap = CELL * 0.6, slide = reduced ? 0 : (now * 0.02) % gap;
  ctx.beginPath();
  for (let d = -SIZE + slide; d < SIZE; d += gap) { ctx.moveTo(d, 0); ctx.lineTo(d + SIZE, SIZE); }
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}
function fallAway(cells, now) {
  let sx = 0, sy = 0;
  for (const k of cells) { sx += (k % GRID) + 0.5; sy += Math.floor(k / GRID) + 0.5; }
  const on = cells.filter(k => born.has(k) && born.get(k).kind !== 'beetle').map(k => { const b = born.get(k), v = b.kind === 'pellet' && b.v ? b.v.slice(0, b.v.indexOf('|')) : ''; return { k, fill: v && v[0] === '#' ? v : FALL_FOOD[b.kind] || FALL_FOOD.food }; }); // (the food that was on it, as last drawn, a bead in its own colour: it goes down with it)
  for (const b of bugs) { const k = b.y * GRID + b.x; if (cells.includes(k)) on.push({ k, fill: b.gold ? FALL_FOOD.golden : FALL_FOOD.beetle }); } // (and its beetles, kept apart from the food: see trackBugs)
  pieceFalls.push({ cells: cells.slice(), on, at: now, cx: sx / cells.length * CELL, cy: sy / cells.length * CELL, tilt: (cells[0] % 2 ? 1 : -1) * 0.35 });
  for (const k of cells) spawn((k % GRID) * CELL + CELL / 2, Math.floor(k / GRID) * CELL + CELL / 2, 3, 160, 600, 2.4, '#8a6a2a', '#3b2412');
}
function drawFalls(now) {
  for (let i = pieceFalls.length - 1; i >= 0; i--) {
    const f = pieceFalls[i], t = (now - f.at) / (reduced ? PIECE_FALL_MS / 2 : PIECE_FALL_MS);
    if (t >= 1 || t < 0) { pieceFalls.splice(i, 1); continue; }
    const e = t * t; // (slow to start, as it tips, then away)
    ctx.save();
    ctx.globalAlpha = 1 - e;
    ctx.translate(f.cx, f.cy + (reduced ? 0 : e * CELL * 0.4));
    if (!reduced) ctx.rotate(f.tilt * e);
    ctx.scale(1 - 0.55 * e, 1 - 0.55 * e);
    ctx.translate(-f.cx, -f.cy);
    ctx.beginPath(); // (one path, filled once: squares filled one by one show their seams where they overlap)
    for (const k of f.cells) ctx.rect((k % GRID) * CELL, Math.floor(k / GRID) * CELL, CELL, CELL);
    ctx.fillStyle = BARK;
    ctx.fill();
    for (const { k, fill } of f.on) { // (its food, as dots of its colour, darkening with it)
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.arc((k % GRID) * CELL + CELL / 2, Math.floor(k / GRID) * CELL + CELL / 2, CELL * 0.28, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = (1 - e) * (0.25 + 0.6 * e);
    ctx.fillStyle = '#000';
    ctx.beginPath(); // (the shade over the slab and its food alike)
    for (const k of f.cells) ctx.rect((k % GRID) * CELL, Math.floor(k / GRID) * CELL, CELL, CELL);
    ctx.fill();
    ctx.restore();
  }
}
// The patch's outline, traced once each time it changes (see traceCells),
// kept as its corners, loop by loop (round the outside, and round any cell
// it encloses), in cells, with the ways in and out of each; and with it,
// each cell's cracks and the dents round the rim.
const PATCH_R = 7, PATCH_R_IN = 3, PIT_PUSH = 14; // (how round its pit's corners are, and its notches, in units; how far it runs on under the frame at the board's edge)
const MARK_R = 11, MARK_TEAR = 1.1; // (how round the mark's own corners are, and how far its rim wobbles, in units)
const DENT_R = 2.1, DENT_EVERY = 12; // (a dent's size, give or take a third, and about how far apart they come round the rim, in units)
const patch = new Uint8Array(N2); // (the patch's cells, marked while it's traced)
const patchWas = new Int16Array(N2); // (the cells it was traced for)
const pGX = new Int8Array(4 * N2), pGY = new Int8Array(4 * N2), pIn = new Int8Array(4 * N2), pOut = new Int8Array(4 * N2), pLoopEnd = new Int32Array(N2);
const DIRX = [1, 0, -1, 0], DIRY = [0, 1, 0, -1], dirOf = (dx, dy) => dx > 0 ? 0 : dy > 0 ? 1 : dx < 0 ? 2 : 3;
const markCX = new Float32Array(N2), markCY = new Float32Array(N2), markCr = new Float32Array(8 * N2);
const dentX = new Float32Array(4 * N2), dentY = new Float32Array(4 * N2), dentR = new Float32Array(4 * N2), dentAt = new Float32Array(4 * N2), dentOrder = new Int16Array(4 * N2);
let patchWasN = -1, pLoops = 0, markN = 0, dentN = 0;
function outlinePatch(w) {
  const target = w.target;
  let same = target.length === patchWasN;
  for (let i = 0; same && i < target.length; i++) same = patchWas[i] === target[i];
  if (same) return;
  patchWasN = target.length;
  patch.fill(0);
  for (let i = 0; i < target.length; i++) { patchWas[i] = target[i]; patch[target[i]] = 1; }
  traceCells(patch);
  let nc = 0;
  for (let l = 0; l < tLoops; l++) {
    const a = tAt[l], n = tAt[l + 1] - a;
    for (let j = 0; j < n; j++) {
      const p = a + (j + n - 1) % n, i = a + j, q = a + (j + 1) % n;
      const ax = tX[i] - tX[p], ay = tY[i] - tY[p], bx = tX[q] - tX[i], by = tY[q] - tY[i];
      if (ax === bx && ay === by) continue;
      pGX[nc] = tX[i]; pGY[nc] = tY[i]; pIn[nc] = dirOf(ax, ay); pOut[nc] = dirOf(bx, by); nc++;
    }
    pLoopEnd[l] = nc;
  }
  pLoops = tLoops;
  // Each cell's cracks: one up the log, one down, wandering a little off the grain.
  markN = target.length;
  for (let i = 0; i < markN; i++) {
    const key = target[i], x = key % GRID, y = (key - x) / GRID;
    markCX[i] = x * CELL + CELL / 2; markCY[i] = y * CELL + CELL / 2;
    for (let c = 0; c < 2; c++) {
      const base = c ? Math.PI / 2 : -Math.PI / 2, a1 = base + (noise(key, c, 11) - 0.5) * 0.7, a2 = a1 + (noise(key, c, 12) - 0.5) * 0.7;
      const l1 = CELL * (0.16 + 0.08 * noise(key, c, 13)), l2 = l1 + CELL * (0.12 + 0.1 * noise(key, c, 14)), p = 8 * i + 4 * c;
      markCr[p] = Math.cos(a1) * l1; markCr[p + 1] = Math.sin(a1) * l1;
      markCr[p + 2] = markCr[p] + Math.cos(a2) * (l2 - l1); markCr[p + 3] = markCr[p + 1] + Math.sin(a2) * (l2 - l1);
    }
  }
  // The dents: nicks round the rim (on the board), each its own size and
  // unevenly spaced (dots evenly spaced on the rim read as a dotted
  // selection box), set out past the rim's line so it stays whole, closer
  // together near where the bird pecks, and coming there first.
  dentN = 0;
  const inset = 2.6, bx = (w.x + 0.5) * CELL, by = (w.y + 0.5) * CELL;
  for (let l = 0, i0 = 0; l < pLoops; i0 = pLoopEnd[l++]) {
    const m = pLoopEnd[l] - i0;
    for (let j = 0; j < m; j++) {
      const c0 = i0 + j, c1 = i0 + (j + 1) % m;
      const x0 = cornerX(c0, inset, PIT_PUSH), y0 = cornerY(c0, inset, PIT_PUSH), x1 = cornerX(c1, inset, PIT_PUSH), y1 = cornerY(c1, inset, PIT_PUSH);
      const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
      for (let d = MARK_R * 0.7 + DENT_EVERY * noise(pGX[c0], pGY[c0], 24); d < len - MARK_R * 0.7;) {
        const x = x0 + ux * d, y = y0 + uy * d, near = Math.hypot(x - bx, y - by) / CELL, at = Math.round(x) * 977 + Math.round(y);
        const rr = DENT_R * (0.67 + 0.66 * noise(at, 1, 23));
        d += DENT_EVERY * (0.6 + noise(at, 2, 23)) * (near < 1.6 ? 0.65 : 1);
        if (x < 2 || y < 2 || x > SIZE - 2 || y > SIZE - 2) continue;
        dentX[dentN] = x + uy * rr * 0.6; dentY[dentN] = y - ux * rr * 0.6; dentR[dentN] = rr; // (out, away from its cells)
        dentAt[dentN] = near + 1.5 * noise(at, 3, 23); dentOrder[dentN] = dentN; dentN++;
      }
    }
  }
  dentOrder.subarray(0, dentN).sort((p, q) => dentAt[p] - dentAt[q]);
}
// Corner c of the traced patch, `inset` units in toward it (pushed on
// under the frame at the board's edge, as its pit will be).
function cornerX(c, inset, push) {
  const x = pGX[c] * CELL - inset * (DIRY[pIn[c]] + DIRY[pOut[c]]);
  return pGX[c] === 0 ? x - push : pGX[c] === GRID ? x + push : x;
}
function cornerY(c, inset, push) {
  const y = pGY[c] * CELL + inset * (DIRX[pIn[c]] + DIRX[pOut[c]]);
  return pGY[c] === 0 ? y - push : pGY[c] === GRID ? y + push : y;
}
// The traced outline, added to the current path: `inset` units inside the
// patch, its corners rounded by `outer` and its notches by `inner`, its
// straight runs wobbling out by up to `tear` as its pit's lip will (see
// raggedPath: the same wobble, seeded by where it is).
function patchPath(inset, outer, inner, tear = 0) {
  for (let l = 0, i0 = 0; l < pLoops; i0 = pLoopEnd[l++]) {
    const m = pLoopEnd[l] - i0;
    if (m < 4) continue;
    for (let j = 0; j < m; j++) {
      const c = i0 + j;
      qx[j] = cornerX(c, inset, PIT_PUSH); qy[j] = cornerY(c, inset, PIT_PUSH);
      qr[j] = DIRX[pIn[c]] * DIRY[pOut[c]] - DIRY[pIn[c]] * DIRX[pOut[c]] > 0 ? outer : inner; // (a right turn: a corner of the patch; a left one: a notch)
      qdx[j] = DIRX[pOut[c]]; qdy[j] = DIRY[pOut[c]]; qgx[j] = pGX[c] * CELL; qgy[j] = pGY[c] * CELL;
    }
    if (tear) raggedPath(ctx, m, tear, 1, 1); else cornersPath(ctx, m);
  }
}

// Holes are pits in the log, one per hollow (holes side by side run
// together), traced along the cell edges, so a hole's edge is its cell's
// edge: a torn lip of fresh pale wood, inked; a dark floor, and its far
// wall (lower right) lit from the upper left, like everything else on the
// board, the grain showing in it; splinters over the rim and sawdust
// round it; and at the board's edge, a notch bitten out of the log (its
// outline runs on under the frame). (One round dark disc a cell read as
// bubble wrap.) They're on the static layer, under everything: a body
// lying across a hole bridges it, and is drawn over it. Every wobble,
// splinter and speck is seeded by where it is, so a piece painted again
// matches what's beside it, and a strike paints again only the box round
// its new holes (see paintStatic).
const PIT_LIP = 1, PIT_RIM = 3.5; // (how far the lip reaches out over the bark, and the pit's edge in from the cell's, in units)
const holeMask = new Uint8Array(N2);
// A number 0..1 for a place and a salt, the same every time.
function noise(x, y, salt) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Draw any holes added since last time onto the static layer (a Set keeps
// insertion order, so new holes are always at the end): the box round
// them, a cell more (where a hollow widens, its old lip goes), painted again.
function syncHoles() {
  if (!game || !staticLayer || game.holes.size === holesDrawn) return;
  if (game.holes.size < holesDrawn) resetStatic();
  let x0 = GRID, y0 = GRID, x1 = -1, y1 = -1, i = 0;
  for (const key of game.holes) {
    if (i++ < holesDrawn) continue;
    holeMask[key] = 1;
    const x = key % GRID, y = (key - x) / GRID;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  holesDrawn = game.holes.size;
  paintStatic(x0 - 1, y0 - 1, x1 + 1, y1 + 1);
}
// Paint the static layer again over cells cx0..cx1, cy0..cy1, in its
// order: the bark, the scorch marks drawn so far, the pits.
function paintStatic(cx0, cy0, cx1, cy1) {
  cx0 = Math.max(0, cx0); cy0 = Math.max(0, cy0); cx1 = Math.min(GRID - 1, cx1); cy1 = Math.min(GRID - 1, cy1);
  if (cx1 < cx0 || cy1 < cy0) return;
  const g = staticLayer.getContext('2d');
  const X0 = Math.floor(cx0 * CELL * k), Y0 = Math.floor(cy0 * CELL * k);
  const X1 = cx1 === GRID - 1 ? staticLayer.width : Math.ceil((cx1 + 1) * CELL * k), Y1 = cy1 === GRID - 1 ? staticLayer.height : Math.ceil((cy1 + 1) * CELL * k);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.beginPath(); g.rect(X0, Y0, X1 - X0, Y1 - Y0); g.clip();
  g.drawImage(barkLayer, X0, Y0, X1 - X0, Y1 - Y0, X0, Y0, X1 - X0, Y1 - Y0);
  g.setTransform(k, 0, 0, k, 0, 0);
  drawScorch(g, cx0, cy0, cx1, cy1);
  drawPits(g, holeMask, cx0 - 1, cy0 - 1, cx1 + 1, cy1 + 1);
  g.restore();
}
// The pits of the holes in m that reach cells bx0..bx1, by0..by1, on g (in
// the board's units). Only the holes within a cell of those are traced (a
// hollow's far reaches change nothing near them, and where the window cuts
// a hollow, what's drawn stays outside the box being painted): a strike
// late in sudden death traces a corner of a big hollow, not all of it.
const pitWindow = new Uint8Array(N2);
function drawPits(g, m, bx0, by0, bx1, by1) {
  pitWindow.fill(0);
  for (let y = Math.max(0, by0 - 1); y <= Math.min(GRID - 1, by1 + 1); y++) {
    for (let x = Math.max(0, bx0 - 1); x <= Math.min(GRID - 1, bx1 + 1); x++) pitWindow[y * GRID + x] = m[y * GRID + x];
  }
  traceCells(pitWindow);
  const lipInk = new Path2D(), lip = new Path2D(), pitInk = new Path2D(), pit = new Path2D(), deep = new Path2D(), grain = new Path2D();
  const dust = [new Path2D(), new Path2D()], spl = [new Path2D(), new Path2D()];
  let any = false;
  for (let l = 0; l < tLoops; l++) {
    const a = tAt[l], end = tAt[l + 1];
    let x0 = GRID, y0 = GRID, x1 = 0, y1 = 0;
    for (let j = a; j < end; j++) { x0 = Math.min(x0, tX[j]); x1 = Math.max(x1, tX[j]); y0 = Math.min(y0, tY[j]); y1 = Math.max(y1, tY[j]); }
    if (x1 <= bx0 || x0 > bx1 + 1 || y1 <= by0 || y0 > by1 + 1) continue; // (its grid points' box against the cells')
    any = true;
    // (each line a fill a little bigger than what's filled over it, not a
    // stroke: a stroke of a long torn edge is several fills' work)
    raggedPath(lipInk, cornersOf(l, -PIT_LIP - 0.8, 9.8, 4.2, PIT_PUSH), 0.9, 1, 1);
    raggedPath(lip, cornersOf(l, -PIT_LIP, 9, 5, PIT_PUSH), 0.9, 1, 1);
    raggedPath(pitInk, cornersOf(l, PIT_RIM - 0.9, PATCH_R + 0.9, PATCH_R_IN - 0.9, PIT_PUSH), 1.4, -1, 2);
    raggedPath(pit, cornersOf(l, PIT_RIM + 0.9, PATCH_R - 0.9, PATCH_R_IN + 0.9, PIT_PUSH), 1.4, -1, 2);
    cornersPath(deep, cornersOf(l, PIT_RIM + 2, PATCH_R, PATCH_R_IN, PIT_PUSH));
    for (let j = a; j < end; j++) sideBits(j, a, end, dust, spl);
  }
  if (!any) return;
  for (let y = Math.max(0, by0); y <= Math.min(GRID - 1, by1); y++) {
    for (let x = Math.max(0, bx0); x <= Math.min(GRID - 1, bx1); x++) {
      const key = y * GRID + x;
      if (!m[key]) continue;
      for (let n = 0; n < 4; n++) grain.rect(x * CELL + 4 + noise(key, n, 3) * 24, y * CELL, 0.8, CELL); // (the grain, down the far wall)
    }
  }
  g.lineJoin = 'round';
  g.fillStyle = 'rgba(226,190,136,0.7)'; g.fill(dust[0]);
  g.fillStyle = 'rgba(176,124,70,0.75)'; g.fill(dust[1]);
  g.fillStyle = 'rgba(28,14,5,0.5)'; g.fill(lipInk);
  g.fillStyle = '#9a683a'; g.fill(lip);
  g.fillStyle = '#140a04'; g.fill(pitInk);
  g.save();
  g.fillStyle = '#5c3a1f'; g.fill(pit); // (the far wall...)
  g.clip(pit);
  g.translate(-4.5, -5.5);
  g.fillStyle = '#2a170a'; g.fill(pit); // (...shaded but where the light falls in from the upper left...)
  g.translate(-3, -3);
  g.fillStyle = '#0f0804'; g.fill(deep); // (...and the dark floor)
  g.translate(7.5, 8.5);
  g.fillStyle = 'rgba(30,15,5,0.35)'; g.fill(grain);
  g.restore();
  g.fillStyle = '#b58350'; g.fill(spl[0]);
  g.fillStyle = '#7e522c'; g.fill(spl[1]);
}
// The corners at hand (from cornersOf) as a torn edge on p: each corner
// rounded in a few straight pieces, each straight run wobbling out (sgn
// 1, away from the cells) or in (-1) by up to amp, sampled every 3 units
// at fixed places on the board, so a run wobbles alike wherever it starts
// (and alike at any inset: an outline and its ink keep together).
function raggedPath(p, m, amp, sgn, salt) {
  if (m < 4) return;
  for (let j = 0; j < m; j++) {
    const pj = (j + m - 1) % m, ix = qdx[pj], iy = qdy[pj], ox = qdx[j], oy = qdy[j], r = qr[j];
    const ax = qx[j] - ix * r, ay = qy[j] - iy * r, bx = qx[j] + ox * r, by = qy[j] + oy * r;
    for (let s = 0; s <= 4; s++) {
      const t = s / 4, u = 1 - t, x = u * u * ax + 2 * u * t * qx[j] + t * t * bx, y = u * u * ay + 2 * u * t * qy[j] + t * t * by;
      if (j || s) p.lineTo(x, y); else p.moveTo(x, y);
    }
    const nj = (j + 1) % m, ex = qx[nj] - ox * qr[nj], ey = qy[nj] - oy * qr[nj], nx = oy * sgn, ny = -ox * sgn;
    const from = ox ? bx : by, to = ox ? ex : ey, step = 3 * (ox || oy);
    for (let v = (step > 0 ? Math.floor(from / 3) + 1 : Math.ceil(from / 3) - 1) * 3; step > 0 ? v < to - 1 : v > to + 1; v += step) {
      const x = ox ? v : bx, y = ox ? by : v, at = Math.round(v * 2), on = ox ? qgy[j] : qgx[j], w = amp * noise(at, on, salt) * (noise(at, on, salt + 5) < 0.2 ? 2 : 1);
      p.lineTo(x + nx * w, y + ny * w);
    }
  }
  p.closePath();
}
// A traced side's sawdust on the bark and splinters over the rim (none
// along the board's edge, and none in a rounded corner), seeded by the side.
function sideBits(j, a, end, dust, spl) {
  const e = tSide[j], i = e >> 2, sd = e & 3, cx = i % GRID, cy = (i - cx) / GRID, nx = NX[sd], ny = NY[sd];
  if (cx + nx < 0 || cy + ny < 0 || cx + nx >= GRID || cy + ny >= GRID) return;
  const q = j + 1 < end ? j + 1 : a, pr = j > a ? j - 1 : end - 1, n2 = q + 1 < end ? q + 1 : a;
  const sx = tX[j] * CELL, sy = tY[j] * CELL, dx = tX[q] - tX[j], dy = tY[q] - tY[j];
  const lo = tX[j] - tX[pr] !== dx || tY[j] - tY[pr] !== dy ? 7 : 0, hi = tX[n2] - tX[q] !== dx || tY[n2] - tY[q] !== dy ? CELL - 7 : CELL; // (clear of a rounded corner at either end)
  for (let s = 0; s < 6; s++) { // sawdust, on the bark just past the lip
    const along = 2.5 + s * 5.4 + (noise(e, s, 6) - 0.5) * 3;
    if (along < lo || along > hi || noise(e, s, 7) < 0.45) continue;
    const out = PIT_LIP + 2 + noise(e, s, 8) * 6, r = 0.6 + noise(e, s, 9) * 1.1, x = sx + dx * along + nx * out, y = sy + dy * along + ny * out;
    const p = dust[noise(e, s, 10) < 0.5 ? 0 : 1]; // (a chip: four corners, cheaper to fill than a round speck, and a speck that size looks no different)
    p.moveTo(x + r, y); p.lineTo(x, y + r); p.lineTo(x - r, y); p.lineTo(x, y - r); p.closePath();
  }
  const across = sd === 0 || sd === 2, slots = across ? 4 : 2; // (torn across the grain, the top and bottom edges splinter most)
  for (let s = 0; s < slots; s++) {
    if (noise(e, s, 16) < (across ? 0.2 : 0.4)) continue;
    const along = (s + 0.5) * CELL / slots + (noise(e, s, 17) - 0.5) * (CELL / slots - 4);
    if (along < lo + 1 || along > hi - 1) continue;
    const lift = noise(e, s, 18) < 0.25 ? -1 : 1; // (a quarter lift outward, onto the lip)
    const len = (across ? 2.5 + noise(e, s, 19) * 4.5 : 1.2 + noise(e, s, 19) * 2) * (lift < 0 ? 0.7 : 1), w = 0.7 + noise(e, s, 20) * 0.9, bend = (noise(e, s, 21) - 0.5) * 2.4;
    const bx = sx + dx * along - nx * (PIT_RIM - 0.5), by = sy + dy * along - ny * (PIT_RIM - 0.5);
    const tx = bx - nx * len * lift + dx * bend, ty = by - ny * len * lift + dy * bend;
    const p = spl[noise(e, s, 22) < 0.6 ? 0 : 1];
    p.moveTo(bx - dx * w, by - dy * w); p.lineTo(tx, ty); p.lineTo(bx + dx * w, by + dy * w); p.closePath();
  }
}
