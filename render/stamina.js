// The renderer (see render/core.js): stamina on the snake (2u, see
// docs/design/37-one-stamina.md). Every snake wears the step its stamina is
// at, as anyone on the log sees it (SnakeEngine.staminaStep, on the clock
// as drawn): tired while it can afford neither power, a little grayer and
// shriveled, its eyes heavy, the lids sagging slowly; awake, as it always
// looked; game on, at a full bar, its eyes bright (bigger catchlights);
// charged, with stamina banked above the full bar (2u+), its eyes bright
// and, the more it has banked, a warm glow over its body and a swell that
// runs down it, livelier (still with reduced motion: the glow alone). Each
// reads by brightness, its eyes and movement, not by colour alone. A step
// eases in over STAMINA_FADE ms (at once with reduced motion); a dead snake
// wears none.
const STAMINA_FADE = 250, TIRED_SHRIVEL = 0.07, TIRED_GRAY = '#6b6f6c', TIRED_WASH = 0.3, TIRED_LID = 0.62, TIRED_SAG = 0.07, TIRED_SAG_MS = 1700;
const CHARGE_WARM = '#ff8a5c', CHARGE_GLOW = 0.28, CHARGE_SWELL = 0.06, CHARGE_MS = 900;
// The face being drawn (set by staminaFace, read by the eye helpers in
// faces.js): how tired, how bright, and its lids' colour.
let tiredNow = 0, brightNow = 0, lidNow = INK;

// Once a frame, in prepare, after its radii: eases it toward its step, and
// tired, shrivels its body (its head keeps its size, as hunger's slim does).
function staminaLook(s, a, dead) {
  if (a.tired === undefined) { a.tired = 0; a.bright = 0; a.charge = 0; a.lidFor = ''; a.lid = INK; }
  const step = dead || !game || !s.alive ? 1 : SnakeEngine.staminaStep(game, s, shownTime);
  const k = reduced || dead ? 1 : Math.min(1, frameDt / STAMINA_FADE);
  const banked = step === 3 ? Math.min(1, s.bank / Math.max(1, (T.STAMINA_BANK - 1) * T.STAMINA_MS)) : 0; // (how near the cap)
  a.tired += Math.max(-k, Math.min(k, (step === 0 ? 1 : 0) - a.tired));
  a.bright += Math.max(-k, Math.min(k, (step >= 2 ? 1 : 0) - a.bright));
  a.charge += Math.max(-k, Math.min(k, (banked ? 0.35 + 0.65 * banked : 0) - a.charge));
  if (a.tired) for (let i = 1; i < a.n; i++) a.rad[i] *= 1 - TIRED_SHRIVEL * a.tired;
  if (a.charge > 0.004 && !reduced) for (let i = 1; i < a.n; i++) a.rad[i] *= 1 + CHARGE_SWELL * a.charge * Math.max(0, Math.sin(lastNow * TAU / CHARGE_MS - i * 0.7)); // (a swell running down it)
}

// Its gray wash, tired, or its warm glow, charged (in the last pass, with hunger's pale one: see
// drawPasses). Not over Star's head: its points dim and light up as its
// stamina comes back (its tell), and a wash over them would blur the count.
function staminaWash(a) {
  const tired = a.tired > 0.004, charged = a.charge > 0.004;
  if (!(tired || charged) || a.n < 2 && a.star) return;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * (tired ? TIRED_WASH * a.tired : CHARGE_GLOW * a.charge);
  ctx.fillStyle = tired ? TIRED_GRAY : CHARGE_WARM;
  shape(a, 0, a.star ? 1 : 0);
  ctx.fill();
  ctx.globalAlpha = was;
}

// Before its face is drawn (see drawBody): its step, for the eye helpers;
// its lids are its head's colour, a shade darker (as Drab's are).
function staminaFace(a, color) {
  if (a.tired === undefined) { tiredNow = brightNow = 0; return; } // (never prepared: a guide's or a card's snake)
  tiredNow = a.tired; brightNow = a.bright;
  if (a.lidFor !== color) { a.lidFor = color; a.lid = color && color[0] === '#' ? mix(color, '#000000', 0.2) : INK; }
  lidNow = a.lid;
}

// Heavy lids over a pair of eyes (centres x, y1 and x, y2, radii rx and
// ry, in cells, in the face's frame), drooping from the back of each eye
// over most of it, an ink line along each lid's edge. Not while it blinks
// or once it's out (lids and crosses are drawn then).
function heavyLids(x, y1, y2, rx, ry = rx) {
  if (tiredNow <= 0.004 || blinkNow || deadNow) return;
  const c = CELL, f = tiredNow * (TIRED_LID + (reduced ? 0 : TIRED_SAG * Math.sin(lastNow * TAU / TIRED_SAG_MS)));
  const t = Math.acos(2 * f - 1), ex = c * (x + rx * (2 * f - 1)), ey = c * ry * Math.sin(t);
  ctx.fillStyle = lidNow;
  ctx.beginPath();
  ctx.ellipse(c * x, c * y1, c * rx * 1.06, c * ry * 1.06, 0, t, TAU - t);
  ctx.closePath();
  ctx.ellipse(c * x, c * y2, c * rx * 1.06, c * ry * 1.06, 0, t, TAU - t);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = c * 0.035;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ex, c * y1 - ey); ctx.lineTo(ex, c * y1 + ey);
  ctx.moveTo(ex, c * y2 - ey); ctx.lineTo(ex, c * y2 + ey);
  ctx.stroke();
}
// Game on: a catchlight's radius for a pupil of radius pr, bigger; and
// how much wider the whites of the shared eyes open.
const lightOf = pr => pr * (0.38 + 0.3 * brightNow), wideOf = () => 1 + 0.12 * brightNow;
// Game on, for eyes with no catchlight of their own: one fades in, in each
// (pupils at x, y1 and x, y2, radius pr, in px).
function brightSpecks(x, y1, y2, pr) {
  if (brightNow <= 0.02 || blinkNow || deadNow) return;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * brightNow;
  catchlight(x, y1, pr);
  catchlight(x, y2, pr);
  ctx.globalAlpha = was;
}

// The Field guide's picture for stamina: a tired snake above (grayer, its
// lids heavy) and an awake one below, wearing your ring with a dash's worth in it.
function guideStamina(g) {
  const c = CELL, was = [tiredNow, deadNow, lidNow];
  g.save(); g.translate(c * 0.35, -c * 0.5); g.scale(0.55, 0.55);
  guideSnake(g, mix('#4ade80', TIRED_GRAY, TIRED_WASH), true, (x, y) => {
    g.translate(x, y); tiredNow = 1; deadNow = false; lidNow = mix('#4ade80', '#000000', 0.2);
    heavyLids(0.16, -0.2, 0.2, 0.13);
    [tiredNow, deadNow, lidNow] = was;
  });
  g.restore();
  g.save(); g.translate(c * 0.35, c * 0.48); g.scale(0.55, 0.55);
  guideSnake(g, '#4ade80', true, (x, y) => restRing(x, y, c * 0.84, 0.8, 1));
  g.restore();
}
