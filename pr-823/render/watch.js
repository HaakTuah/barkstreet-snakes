// The renderer (see render/core.js): the woodpecker's watch (entry 6, act
// 1). Where its eye settles on the log, a pale pool of its attention lies
// over the spot it watches, a diamond as far out as its first cut may
// start (GAZE_NEAR cells across and down), brightest at the middle, easing in over a
// second at each new look: the same ground the rivals read as risky
// (aiView's gaze), so a person reads it as well as they do, whatever the
// bird's perch shows of its head. On the bark under the snakes; steady,
// never pulsing (with reduced motion, there at once).
const WATCH_EASE_MS = 1000;
let watchSince = -1, watchFrom = 0;
function drawWatch(now) {
  const w = game.woodpecker;
  if (!w || !(w.gaze >= 0) || SnakeEngine.actOf(game) !== 1) { watchSince = -1; return; }
  if (watchSince !== w.lookAt) { watchSince = w.lookAt; watchFrom = now; }
  const k = reduced ? 1 : Math.min(1, (now - watchFrom) / WATCH_EASE_MS), r = T.GAZE_NEAR;
  const gx = w.gaze % GRID, gy = (w.gaze - gx) / GRID;
  const cx = gx * CELL + CELL / 2, cy = gy * CELL + CELL / 2, R = (r + 0.5) * CELL;
  const diamond = inset => { const d = R - inset; ctx.beginPath(); ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy); ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy); ctx.closePath(); };
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  glow.addColorStop(0, 'rgba(255, 226, 160, 0.32)'); glow.addColorStop(0.7, 'rgba(255, 226, 160, 0.14)'); glow.addColorStop(1, 'rgba(255, 226, 160, 0.04)');
  ctx.globalAlpha = k;
  ctx.fillStyle = glow;
  diamond(0); ctx.fill();
  ctx.setLineDash([CELL * 0.18, CELL * 0.3]); ctx.lineWidth = CELL * 0.06; ctx.strokeStyle = 'rgba(255, 236, 190, 0.45)'; // (its rim: the cells its first cut may start from, as the rivals weigh them)
  diamond(CELL * 0.2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
