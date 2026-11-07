// The renderer (see render/core.js): a golden apple's shield (2u+, see
// docs/design/37-one-stamina.md). While it holds, a thin bubble round the
// snake's head, cream with an ink line so it reads on any body, flickering
// over its last SHIELD_WARN ms; when it takes a crash, it bursts, a ring
// opening out over SHIELD_POP ms. Anyone's, as anyone on the log sees it.
const SHIELD_WARN = 2000, SHIELD_POP = 350, SHIELD_GAP = 0.42;

function drawShield(s, a, now) {
  const x = a.pts[0], y = a.pts[1], r = a.rad[0] + CELL * SHIELD_GAP, left = s.shieldUntil - shownTime;
  if (left > 0) {
    a.shielded = true;
    const k = left < SHIELD_WARN && !reduced ? 0.45 + 0.55 * Math.abs(Math.sin(now / 110)) : 1;
    shieldRing(x, y, r, 0.6 * k);
  } else if (a.shielded) { a.shielded = false; if (s.shieldUntil === -1) a.shieldPop = now; } // (-1: it took a crash; a shield that faded just goes)
  const t = (now - (a.shieldPop ?? -Infinity)) / SHIELD_POP;
  if (t >= 0 && t < 1) shieldRing(x, y, r * (1 + 0.5 * t), 0.6 * (1 - t));
}
function shieldRing(x, y, r, alpha) {
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * alpha;
  ctx.lineWidth = CELL * 0.1; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.lineWidth = CELL * 0.055; ctx.strokeStyle = '#fff6d6';
  ctx.stroke();
  ctx.globalAlpha = was;
}
