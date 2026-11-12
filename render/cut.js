// The renderer (see render/core.js): the woodpecker's outline and its
// fight (entry 6, part 2). The cut it's working round a piece: each cell
// still to go a small chisel nick on the bark, so you can watch the line
// close round the piece as its pecks take them (the pecked ones are pits,
// as render/holes.js draws them; the peck that cuts the piece loose shades
// it, 2s). Until then the piece itself lies under a faint wash with a
// dashed pale edge, as long as any nick is left, so a person sees the piece
// the rivals are handed (aiView's piece), not only its nicks; it has none of
// the streaks the cut-loose shading slides, and holds still with reduced
// motion. A fight's aim: its plus shaded red cell by cell, a red ring
// round it tightening as the strike nears, a tick on each arm (its tile
// in the middle is marked as any peck). Under the snakes, on the bark;
// steady with reduced motion.
function drawCut(alpha) {
  const w = game.woodpecker;
  if (!w) return;
  if (w.plan) {
    const aiming = new Set(w.target);
    if (w.plan.cut.some(k => !game.holes.has(k) && !aiming.has(k))) washPiece(w.plan.piece);
    ctx.lineCap = 'round';
    for (const k of w.plan.cut) {
      if (game.holes.has(k) || aiming.has(k)) continue;
      const x = (k % GRID) * CELL + CELL / 2, y = Math.floor(k / GRID) * CELL + CELL / 2;
      ctx.lineWidth = CELL * 0.2; ctx.strokeStyle = 'rgba(250, 236, 200, 0.55)'; // (its pale rim...)
      ctx.beginPath(); ctx.moveTo(x - CELL * 0.18, y - CELL * 0.18); ctx.lineTo(x + CELL * 0.18, y + CELL * 0.18); ctx.stroke();
      ctx.lineWidth = CELL * 0.1; ctx.strokeStyle = 'rgba(28, 14, 4, 0.85)'; // (...and the nick, dark)
      ctx.beginPath(); ctx.moveTo(x - CELL * 0.16, y - CELL * 0.16); ctx.lineTo(x + CELL * 0.16, y + CELL * 0.16); ctx.stroke();
    }
  }
  if (w.zone && w.target.length) {
    const prog = aimed(alpha);
    if (prog < 0) return;
    const c = w.target[0], cx = (c % GRID) * CELL + CELL / 2, cy = Math.floor(c / GRID) * CELL + CELL / 2, R = CELL * (2.2 - 0.7 * prog);
    ctx.fillStyle = `rgba(220, 38, 38, ${0.12 + 0.12 * prog})`; // (its plus, cell by cell: what the rivals keep out of)
    for (const k of w.zone) ctx.fillRect((k % GRID) * CELL + CELL * 0.08, Math.floor(k / GRID) * CELL + CELL * 0.08, CELL * 0.84, CELL * 0.84);
    ctx.strokeStyle = `rgba(220, 38, 38, ${0.55 + 0.35 * prog})`; ctx.lineWidth = CELL * 0.1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.beginPath(); ctx.moveTo(cx + dx * (R - CELL * 0.35), cy + dy * (R - CELL * 0.35)); ctx.lineTo(cx + dx * (R + CELL * 0.35), cy + dy * (R + CELL * 0.35)); ctx.stroke();
    }
  }
}

// The piece an outline cuts round, washed lightly with a dashed edge: one
// path for the wash (squares filled one by one show their seams) and one
// for the edge, each piece-cell side that faces a cell outside the piece.
function washPiece(piece) {
  const cells = new Set(piece.filter(k => !game.holes.has(k)));
  if (!cells.size) return;
  ctx.fillStyle = 'rgba(20, 8, 2, 0.1)';
  ctx.beginPath();
  for (const k of cells) ctx.rect((k % GRID) * CELL, Math.floor(k / GRID) * CELL, CELL, CELL);
  ctx.fill();
  ctx.strokeStyle = 'rgba(254, 243, 199, 0.5)'; ctx.lineWidth = CELL * 0.08; ctx.lineCap = 'butt';
  ctx.setLineDash([CELL * 0.22, CELL * 0.16]);
  ctx.beginPath();
  for (const k of cells) {
    const x = (k % GRID) * CELL, y = Math.floor(k / GRID) * CELL, cx = k % GRID;
    if (!cells.has(k - GRID)) { ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); }
    if (!cells.has(k + GRID)) { ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); }
    if (cx === 0 || !cells.has(k - 1)) { ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); }
    if (cx === GRID - 1 || !cells.has(k + 1)) { ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); }
  }
  ctx.stroke();
  ctx.setLineDash([]);
}
