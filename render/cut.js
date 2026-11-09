// The renderer (see render/core.js): the woodpecker's outline and its
// fight (entry 6, part 2). The cut it's working round a piece: each cell
// still to go a small chisel nick on the bark, so you can watch the line
// close round the piece as its pecks take them (the pecked ones are pits,
// as render/holes.js draws them; the peck that cuts the piece loose shades
// it, 2s). A fight's aim: its plus shaded red cell by cell, a red ring
// round it tightening as the strike nears, a tick on each arm (its tile
// in the middle is marked as any peck). Under the snakes, on the bark;
// steady with reduced motion.
function drawCut(alpha) {
  const w = game.woodpecker;
  if (!w) return;
  if (w.plan) {
    const aiming = new Set(w.target);
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
