// The renderer (see render/core.js): the effects along the board's edge and
// a dash: the gold seam while the edges wrap round for someone, and the
// speed-line streaks of a dash.

// While the edges wrap round for someone: a warm gold seam inside the
// frame, with two glints running round it, and bright by a wrapping head
// (fading calmly over the last WRAP_WARN_MS).
const edgeAt = [0, 0]; // (scratch: a point round the seam)
function alongEdge(d, inset) { // d px round the seam, clockwise from the top-left corner
  const L = SIZE - 2 * inset, p = ((d % (4 * L)) + 4 * L) % (4 * L);
  if (p < L) { edgeAt[0] = inset + p; edgeAt[1] = inset; }
  else if (p < 2 * L) { edgeAt[0] = SIZE - inset; edgeAt[1] = inset + p - L; }
  else if (p < 3 * L) { edgeAt[0] = SIZE - inset - (p - 2 * L); edgeAt[1] = SIZE - inset; }
  else { edgeAt[0] = inset; edgeAt[1] = SIZE - inset - (p - 3 * L); }
  return edgeAt;
}
function drawWrapEdges(now) {
  let any = 0;
  for (const s of game.snakes) if (s.alive && s.wrapUntil > shownTime) any = Math.max(any, Math.min(1, (s.wrapUntil - shownTime) / T.WRAP_WARN_MS));
  if (!any) return;
  const inset = 3, run = 4 * (SIZE - 2 * inset);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = rgba('#d4a017', 0.5 * any);
  ctx.strokeRect(inset, inset, SIZE - 2 * inset, SIZE - 2 * inset);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rgba('#fde68a', 0.75 * any);
  ctx.strokeRect(inset, inset, SIZE - 2 * inset, SIZE - 2 * inset);
  // Two glints, opposite each other, running round with a fading tail.
  const head = reduced ? run * 0.1 : (now / 1000) * CELL * 6, tail = CELL * 2.4, STEPS = 8;
  ctx.lineWidth = 2.5;
  for (let g = 0; g < 2; g++) {
    for (let i = 0; i < STEPS; i++) {
      const d0 = head + g * run / 2 - tail * (1 - i / STEPS), d1 = d0 + tail / STEPS;
      ctx.globalAlpha = any * (i + 1) / STEPS;
      ctx.strokeStyle = '#fffbea';
      ctx.beginPath();
      const p0 = alongEdge(d0, inset); ctx.moveTo(p0[0], p0[1]);
      const p1 = alongEdge(d1, inset); ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (const s of game.snakes) { // (by a wrapping head: a glow on the edge it's near)
    if (!s.alive || !(s.wrapUntil > shownTime)) continue;
    const h = s.body[0], hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2;
    edgeGlow(0, hy, h.x, any); edgeGlow(SIZE, hy, GRID - 1 - h.x, any);
    edgeGlow(hx, 0, h.y, any); edgeGlow(hx, SIZE, GRID - 1 - h.y, any);
    ctx.globalAlpha = 1;
  }
}
// The glow at (ex, ey) on the edge, for a wrapping head d cells from it.
function edgeGlow(ex, ey, d, any) {
  if (d > 3) return;
  const w = SPRITE * CELL * (1.6 - d * 0.3);
  ctx.globalAlpha = 0.7 * any * (1 - d / 4);
  ctx.drawImage(glowSprite(), ex - w / 2, ey - w / 2, w, w);
}

const len3 = (x, y) => Math.hypot(x, y) || 1;
// A dash's streak, under the snakes (over the dasher it ran a line through
// its face): a speed line down each side, from where it started to the
// back of its head, inked so it reads on the bark, tapering back to the
// start; gone in a moment. The lines run just clear of everything drawn
// round the dasher's body (its outline, a gold line), which used to cover
// them. (A wedge of honey light between them is gone: where it showed past
// the body, it was a translucent khaki block, cut square by the head.) A
// golden dash's lines are gold with an ember core; a plain flash's are
// ember, thinner, inked more faintly and shorter (from a third of the
// way), so the golden one is the bigger deal.
const streaks = []; // { x0, y0, x1, y1, at, s, plain, fx, fy, tx, ty (its cells), pre (seen coming on that tick, until it goes) }
const STREAK_GAP = 2; // (between the dasher's drawn edge and a line's inked edge, in units)
// A dash's streak from cell (fx, fy) to (tx, ty): at its tick, with its
// flecks and the scuff where it set off; or (pre: that tick) as soon as
// it's drawn there, seen coming, its flecks and scuff once it's gone (a
// guess put right, or that didn't go, leaves none: see unstreak).
function streakOf(s, fx, fy, tx, ty, plain, now, pre) {
  const x0 = fx * CELL + CELL / 2, y0 = fy * CELL + CELL / 2, x1 = tx * CELL + CELL / 2, y1 = ty * CELL + CELL / 2;
  if (Math.abs(x1 - x0) + Math.abs(y1 - y0) > CELL * (T.DASH_LENGTH + 0.5)) return; // (not across a wrapped edge)
  const k = { x0, y0, x1, y1, at: now, s, plain, fx, fy, tx, ty, pre };
  streaks.push(k);
  if (pre < 0) sparksOf(k);
}
function sparksOf({ x0, y0, x1, y1, plain }) {
  for (let k = 0; k <= 3; k++) spawn(x0 + (x1 - x0) * k / 3, y0 + (y1 - y0) * k / 3, plain ? 2 : 4, 90, 500, 1.8, plain ? EMBER : HONEY, plain ? GLINT : EMBER);
  if (!reduced) for (let k = 0; k < 4; k++) mote(x0 + (Math.random() - 0.5) * CELL * 0.6, y0 + (Math.random() - 0.5) * CELL * 0.6, -(x1 - x0) / len3(x1 - x0, y1 - y0) * 20 + (Math.random() - 0.5) * 10, -(y1 - y0) / len3(x1 - x0, y1 - y0) * 20 - 6, 700, 3 + Math.random() * 2, 2); // (a scuff of dust where it set off)
}
// A streak seen coming this tick that won't go as seen: gone.
function unstreak(s) {
  for (let i = streaks.length - 1; i >= 0; i--) if (streaks[i].s === s && streaks[i].pre === game.tick) streaks.splice(i, 1);
}
function drawStreaks(now) {
  for (let i = streaks.length - 1; i >= 0; i--) {
    const k = streaks[i], t = (now - k.at) / T.STREAK_MS;
    if (t >= 1 || t < 0 || (k.pre >= 0 && k.pre < game.tick)) { streaks.splice(i, 1); continue; } // (or seen coming, and it didn't go)
    const dx = k.x1 - k.x0, dy = k.y1 - k.y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const ex = k.x1 - ux * CELL * 0.35, ey = k.y1 - uy * CELL * 0.35; // (the back of its head)
    const sx = k.plain ? k.x0 + (ex - k.x0) * 0.35 : k.x0, sy = k.plain ? k.y0 + (ey - k.y0) * 0.35 : k.y0; // (where its lines start)
    const speedLine = (off, w, over) => { // (pointed at both ends, widest near the head; `over` runs it a touch past them, for its ink)
      const mx = sx + (ex - sx) * 0.8, my = sy + (ey - sy) * 0.8;
      ctx.moveTo(sx - ux * over + nx * off, sy - uy * over + ny * off);
      ctx.lineTo(mx + nx * (off + w), my + ny * (off + w));
      ctx.lineTo(ex + ux * over + nx * off, ey + uy * over + ny * off);
      ctx.lineTo(mx + nx * (off - w), my + ny * (off - w));
      ctx.closePath();
    };
    const a = anim.get(k.s), w = CELL * (k.plain ? 0.085 : 0.1) * (1 - 0.5 * t), ink = 1.4;
    const side = CELL * 0.44 + (a ? edgeOf(k.s, a) : 0) + STREAK_GAP + ink + w; // (the body's half-width by the neck, and what's drawn round it)
    ctx.fillStyle = rgba('#3a2614', (k.plain ? 0.7 : 0.8) * (1 - t));
    ctx.beginPath(); speedLine(-side, w + ink, ink * 2); speedLine(side, w + ink, ink * 2); ctx.fill();
    ctx.fillStyle = rgba(k.plain ? EMBER : HONEY, 0.95 * (1 - t));
    ctx.beginPath(); speedLine(-side, w, 0); speedLine(side, w, 0); ctx.fill();
    if (k.plain) continue;
    ctx.fillStyle = rgba(EMBER_LINE, 0.9 * (1 - t)); // (the ember core)
    ctx.beginPath(); speedLine(-side, w * 0.4, -len * 0.25); speedLine(side, w * 0.4, -len * 0.25); ctx.fill();
  }
}
