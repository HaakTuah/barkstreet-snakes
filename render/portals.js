// The renderer (see render/core.js): the portals (round six B, part 5).
// Going off an edge while the edges wrap for it, a snake opens a pair, as
// in the game Portal: the entry a glowing blue oval turning in where it went
// off, the exit a glowing orange one spilling out where it came in, each
// with a thin gold trim for the golden mushroom (design 40, "Portals for the
// wrap", says why). They fade over the PORTAL_MS a portal stays open once its
// owner has passed. With reduced motion they stand still.

// May s's body run across an edge (drawn partly on each side, a segment
// moving across one)? Once the edges have wrapped for it this round, or
// once it has been on the board with a portal open (anyone may follow
// through one), for the rest of the round (a: its anim).
const acrossEdges = (s, a) => s.wrapUntil >= 0 || (a.seenPortal ||= !!game?.portals?.length);
// Off the board from (x, y) going d: through a portal open there that way?
const portalWay = (x, y, d) => !!game?.portals?.some(p => p.x === x && p.y === y && p.dx === d.x && p.dy === d.y);

// A portal's ends as drawn: the point on the edge, and the way into the board.
function portalEnd(x, y, dx, dy, out) {
  return { cx: (x + 0.5 + (out ? -dx : dx) * 0.5) * CELL, cy: (y + 0.5 + (out ? -dy : dy) * 0.5) * CELL, ix: out ? dx : -dx, iy: out ? dy : -dy };
}
function drawPortals(now) {
  if (!game.portals?.length) return;
  for (const p of game.portals) {
    const fade = p.shutAt ? Math.max(0, Math.min(1, (p.shutAt - shownTime) / T.PORTAL_MS)) : 1;
    if (fade <= 0) continue;
    portalSwirl(portalEnd(p.x, p.y, p.dx, p.dy, false), fade, now, false);
    portalSwirl(portalEnd(p.tx, p.ty, p.dx, p.dy, true), fade, now, true);
  }
  ctx.globalAlpha = 1;
}
// One end: a half oval on the edge, opening into the board, as in Portal:
// a glowing ring (the entry blue, the exit orange) with a thin gold trim, a
// haze of its colour inside, and in it arcs turning in (the entry) or rings
// spreading out (the exit).
const PORTAL_HUES = { in: ['#0b2a5c', '#2f8cff', '#9fd0ff'], out: ['#5c2405', '#ff8a1c', '#ffd2a0'] }; // (heart, ring, light)
function portalSwirl({ cx, cy, ix, iy }, fade, now, out) {
  const [heart, ring, light] = PORTAL_HUES[out ? 'out' : 'in'];
  const along = CELL * 1.05, deep = CELL * 0.62, turn = Math.atan2(iy, ix) - Math.PI / 2; // (the oval's long axis along the edge)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(turn);
  const oval = new Path2D();
  oval.ellipse(0, 0, along, deep, 0, 0, Math.PI);
  oval.closePath();
  const haze = ctx.createRadialGradient(0, 0, 0, 0, 0, along);
  haze.addColorStop(0, out ? light : heart); // (the entry's heart dark, drawing in; the exit's bright, spilling out)
  haze.addColorStop(0.7, out ? ring : heart);
  haze.addColorStop(1, ring);
  ctx.globalAlpha = 0.85 * fade;
  ctx.fillStyle = haze;
  ctx.fill(oval);
  ctx.strokeStyle = ring; // (the glow: a wide faint stroke under the ring, as the canvas has no blur)
  ctx.lineWidth = 10;
  ctx.globalAlpha = 0.3 * fade;
  ctx.stroke(oval);
  ctx.globalAlpha = fade;
  ctx.beginPath(); // (the thin gold trim, just outside the ring, over the glow)
  ctx.ellipse(0, 0, along + 2.5, deep + 2.5, 0, 0, Math.PI);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#f5c542';
  ctx.stroke();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 4;
  ctx.stroke(oval);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = light;
  ctx.stroke(oval);
  ctx.clip(oval);
  const t = reduced ? 0.3 : (now / 1000) % 1;
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const f = out ? (t + k / 3) % 1 : 1 - (t + k / 3) % 1; // (out: spreading from the edge; in: drawn into it)
    ctx.globalAlpha = fade * 0.8 * (out ? 1 - f : f);
    ctx.strokeStyle = k % 2 ? light : ring;
    ctx.beginPath();
    ctx.ellipse(0, 0, along * (0.2 + 0.8 * f), deep * (0.2 + 0.8 * f), 0, 0.15 + (out ? 0 : k * 0.4), Math.PI - 0.15 + (out ? 0 : k * 0.4));
    ctx.stroke();
  }
  ctx.restore();
}
