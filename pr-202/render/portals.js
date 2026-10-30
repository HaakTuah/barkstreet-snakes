// The renderer (see render/core.js): the gold portals (round six B, part
// 5). Going off an edge while the edges wrap for it, a snake opens a pair:
// the entry, a gold swirl turning in where it went off, and the exit, gold
// spilling out where it came in, each rimmed in its colour. Gold, not blue
// and orange: on this board sky blue means jump and ember means flash. They
// fade over the PORTAL_MS a portal stays open once its owner has passed.
// With reduced motion they stand still.

// A portal's ends as drawn: the point on the edge, and the way into the board.
function portalEnd(x, y, dx, dy, out) {
  return { cx: (x + 0.5 + (out ? -dx : dx) * 0.5) * CELL, cy: (y + 0.5 + (out ? -dy : dy) * 0.5) * CELL, ix: out ? dx : -dx, iy: out ? dy : -dy };
}
function drawPortals(now) {
  if (!game.portals?.length) return;
  for (const p of game.portals) {
    const owner = game.snakes[p.owner], rim = owner ? owner.color : '#d4a017';
    const fade = p.shutAt ? Math.max(0, Math.min(1, (p.shutAt - shownTime) / T.PORTAL_MS)) : 1;
    if (fade <= 0) continue;
    portalSwirl(portalEnd(p.x, p.y, p.dx, p.dy, false), rim, fade, now, false);
    portalSwirl(portalEnd(p.tx, p.ty, p.dx, p.dy, true), rim, fade, now, true);
  }
  ctx.globalAlpha = 1;
}
// One end: a half oval of gold on the edge, opening into the board; its rim
// in the owner's colour; in it, arcs turning in (the entry) or rings
// spreading out (the exit).
function portalSwirl({ cx, cy, ix, iy }, rim, fade, now, out) {
  const along = CELL * 0.85, deep = CELL * 0.75, turn = Math.atan2(iy, ix) - Math.PI / 2; // (the oval's long axis along the edge)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(turn);
  ctx.beginPath();
  ctx.ellipse(0, 0, along, deep, 0, 0, Math.PI);
  ctx.closePath();
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, along);
  glow.addColorStop(0, out ? '#fff7d6' : '#4a2c05'); // (the entry's heart dark, drawing in; the exit's bright, spilling out)
  glow.addColorStop(0.55, out ? '#fcd34d' : '#a16207');
  glow.addColorStop(1, '#d4a017');
  ctx.globalAlpha = 0.9 * fade;
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = rim;
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#fde68a';
  ctx.stroke();
  ctx.clip();
  const t = reduced ? 0.3 : (now / 1000) % 1;
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const f = out ? (t + k / 3) % 1 : 1 - (t + k / 3) % 1; // (out: spreading from the edge; in: drawn into it)
    ctx.globalAlpha = fade * 0.8 * (out ? 1 - f : f);
    ctx.strokeStyle = k % 2 ? '#fffbea' : '#fcd34d';
    ctx.beginPath();
    ctx.ellipse(0, 0, along * (0.2 + 0.8 * f), deep * (0.2 + 0.8 * f), 0, 0.15 + (out ? 0 : k * 0.4), Math.PI - 0.15 + (out ? 0 : k * 0.4));
    ctx.stroke();
  }
  ctx.restore();
}
