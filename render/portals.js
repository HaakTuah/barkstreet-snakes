// The renderer (see render/core.js): the portals (round six B, part 5).
// Going off an edge while the edges wrap for it, a snake opens a pair, drawn
// as the game Portal's own: the entry a blue upright oval turning in where it
// went off, the exit an orange one spilling out where it came in, each with a
// thin gold trim for the golden mushroom (design 40, "Portals for the wrap",
// says why). They fade over the PORTAL_MS a portal stays open once its owner
// has passed. With reduced motion the rim and the swirl stand still.

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
// One end, as in Portal: an upright oval two cells long along the edge and one
// deep, standing over the edge so most of it shows on the board: a thick,
// bright rim whose edge flickers ragged and alive, a darker field of its
// colour inside with a faint swirl (turning in at the entry, spilling out at
// the exit), a soft glow around it and a thin gold trim just outside the rim.
const PORTAL_HUES = { in: ['#0a2a70', '#1e7bff', '#a8d6ff'], out: ['#8a3606', '#ff8a1c', '#ffd9a8'] }; // (heart, rim, light: the field a deeper shade of the rim's colour, enough that it still reads blue or orange on bark)
const PORTAL_STEPS = 56;
// The oval's outline as points (the rim's flicker: each point pushed out or in along the ellipse, by waves running round it).
function portalOutline(a, b, grow, t, phase) {
  const pts = [];
  for (let i = 0; i < PORTAL_STEPS; i++) {
    const th = i / PORTAL_STEPS * Math.PI * 2;
    const j = 1 + grow + (Math.sin(th * 7 + t * 11 + phase) * 0.55 + Math.sin(th * 13 - t * 17 + phase * 2) * 0.45) * 0.055;
    pts.push([Math.cos(th) * a * j, Math.sin(th) * b * j]);
  }
  return pts;
}
function tracePortal(pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}
function portalSwirl({ cx, cy, ix, iy }, fade, now, out) {
  const [heart, rim, light] = PORTAL_HUES[out ? 'out' : 'in'];
  const a = CELL, b = CELL * 0.5, t = reduced ? 0.3 : now / 1000;
  ctx.save();
  ctx.translate(cx + ix * CELL * 0.3, cy + iy * CELL * 0.3); // (into the board a little: four fifths of it shows)
  ctx.rotate(Math.atan2(iy, ix) - Math.PI / 2); // (the long axis along the edge)
  const body = portalOutline(a, b, 0, t, 0);
  ctx.lineJoin = 'round';
  for (const [grow, w, al] of [[0.34, 9, 0.07], [0.22, 7, 0.1], [0.11, 5, 0.16]]) { // (the glow: wide faint strokes, the canvas's blur being dear)
    ctx.globalAlpha = al * fade;
    ctx.strokeStyle = rim;
    ctx.lineWidth = w;
    tracePortal(portalOutline(a, b, grow, t, 0));
    ctx.stroke();
  }
  ctx.globalAlpha = fade; // (the field: darker, its heart darkest where it draws in, bright where it spills out)
  ctx.save();
  ctx.scale(1, b / a);
  const field = ctx.createRadialGradient(0, 0, 0, 0, 0, a);
  field.addColorStop(0, out ? rim : heart);
  field.addColorStop(0.65, out ? heart : '#0e3a96');
  field.addColorStop(1, heart);
  ctx.fillStyle = field;
  ctx.beginPath();
  ctx.arc(0, 0, a, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save(); // (the swirl: three arms of a spiral, wound one way and drifting in, or the other and drifting out)
  tracePortal(body);
  ctx.clip();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = light;
  for (let k = 0; k < 3; k++) {
    ctx.globalAlpha = 0.3 * fade;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const f = i / 14, r = f * 0.95, th = (out ? 1 : -1) * (t * 2.4 + r * 3.2) + k * Math.PI * 2 / 3;
      const x = Math.cos(th) * a * r * 0.9, y = Math.sin(th) * b * r * 0.9;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = fade; // (the gold trim, just outside the rim; then the rim: thick, a bright core in it)
  tracePortal(portalOutline(a, b, 0.1, t, 0));
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#f5c542';
  ctx.stroke();
  tracePortal(body);
  ctx.lineWidth = 6;
  ctx.strokeStyle = rim;
  ctx.stroke();
  tracePortal(portalOutline(a, b, -0.015, t, 2));
  ctx.lineWidth = 2;
  ctx.strokeStyle = light;
  ctx.stroke();
  ctx.restore();
}
