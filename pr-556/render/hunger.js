// The renderer (see render/core.js): hunger on each snake's body, its
// slimming, pale wash and growl, and a meal going down.

// ------------------------------------------------------------ hunger

// The meal goes down (the owner: it plumped up at once, "it should be an
// animation where you see it transform"): after a meal, from the head, each
// segment eases from how slim and pale it was drawn to how its clock says it
// should be now (a meal that refills it only partly fills it out only that
// far), a wave MEAL_SPREAD segments deep that reaches the tail in MEAL_MS,
// whatever its length, its colour flooding back with it. Eating again
// mid-swell starts a new wave from the head, from how it's drawn then. With
// reduced motion, no wave: the whole body eases back in a short plain fade.
// (Drawn from the clock alone, like the rest of its hunger: the same on
// every screen online.)
const MEAL_MS = 700, MEAL_SPREAD = 3, MEAL_FADE = 250, PALE_STEPS = 6;
function mealSwell(a, m, now) {
  if (a.slimSeg.length < m) for (const k of ['slimSeg', 'paleSeg', 'slimFrom', 'paleFrom']) { const r = new Float32Array(2 * m); r.set(a[k]); a[k] = r; }
  const t = now - a.mealAt, on = t >= 0 && t < (reduced ? MEAL_FADE : MEAL_MS);
  const { slimSeg, paleSeg, slimFrom, paleFrom } = a, last = Math.max(0, a.fromN - 1);
  const front = t / MEAL_MS * (m - 1 + MEAL_SPREAD);
  let top = 0;
  for (let i = 0; i < m; i++) {
    let s = a.slim, p = a.pale;
    if (on) {
      const j = Math.min(i, last), k = reduced ? t / MEAL_FADE : Math.min(1, Math.max(0, (front - i) / MEAL_SPREAD)), e = 1 - k * k * (3 - 2 * k); // (how much of how it was still shows; a segment grown since, as its tail was)
      s += (slimFrom[j] - s) * e; p += (paleFrom[j] - p) * e;
    }
    slimSeg[i] = s;
    paleSeg[i] = top = Math.max(top, p); // (never paler toward the head: see drawPale)
  }
  a.segN = m; a.paleTop = paleSeg[m - 1]; // (as stored, rounded alike, so an even wash is seen as one: see drawPale)
}
// Its pale wash (starving, and fading as a meal goes down), over its
// silhouette; while the colour floods back from the head, in a few steps
// along it, each over the rest of its body from where its wash reaches that
// much (no seams where its segments overlap: each step is one fill).
function drawPale(a) {
  const top = a.paleTop, p = a.paleSeg, m = a.n;
  if (top <= 0.004) return;
  if (p[0] >= top) { ctx.fillStyle = rgba(HUNGER_PALE, 0.5 * top); silhouette(a, 0); return; } // (all alike: one wash)
  let was = 0;
  for (let l = 1, i = 0; l <= PALE_STEPS; l++) {
    const lv = top * (l - 0.5) / PALE_STEPS; // (a step reaches the segments at least this pale)
    while (i < m && p[i] < lv) i++;
    if (i >= m) break;
    const want = 0.5 * top * l / PALE_STEPS, al = 1 - (1 - want) / (1 - was); // (each step on top of the ones before it comes to want)
    was = want;
    ctx.fillStyle = rgba(HUNGER_PALE, al); shape(a, 0, i, m - 1); ctx.fill();
  }
}
// Hunger where your eyes are (on a wide screen the tag's bar goes unseen:
// the owner starved): every snake shows it on its body, from the clock its
// tag reads. Its body slims as its last meal runs out (by the share of it
// gone, slowly at first, up to HUNGER_SLIM thinner; its head keeps its
// size); in the warning's seconds (the toast's: SnakeEngine.hungerWarning,
// 6 s before it shrinks, 9 before it would starve) its head shakes and growl lines rumble out either side of it
// (drawGrowl), stronger toward the end (not once the round's over);
// starving (shrinking), it pales (a parchment wash: see drawPasses), and
// starved, its corpse stays thin. With reduced motion the lines stay still
// and the head doesn't shake.
const HUNGER_SLIM = 0.22, GROWL_BEAT = 520, GROWL_ARC = 0.42, HUNGER_PALE = '#f6eedb';
function hungerLook(s, a, dead, now) {
  if (dead || !game || !s.alive) { a.slim = dead && s.killer === 'hunger' ? HUNGER_SLIM : 0; a.growl = 0; a.pale = 0; a.mealAt = -1e9; a.ateSeen = -1; return; } // (starved, it stays thin)
  if (a.ateSeen >= 0 && s.lastAte > a.ateSeen) { a.mealAt = now; a.fromN = a.segN; a.slimFrom.set(a.slimSeg); a.paleFrom.set(a.paleSeg); } // (it ate: the meal goes down from how it was drawn, see mealSwell)
  a.ateSeen = s.lastAte;
  const left = s.lastAte + T.HUNGER_MS - shownTime, gone = Math.min(1, Math.max(0, 1 - left / (s.mealMs || T.HUNGER_MS)));
  const warn = SnakeEngine.hungerWarning(game, s, shownTime);
  a.slim = HUNGER_SLIM * gone * Math.sqrt(gone);
  a.growl = warn < 1 && !leadRest ? Math.min(1, 1.4 - 0.9 * Math.max(0, warn)) : 0;
  a.pale = left < 0 ? Math.min(1, -left / T.STARVE_EVERY_MS) : 0;
}
// (In the face's frame, after its face: two short arcs either side of its
// head, a cream line under an ink one so they read on the bark and on any
// body, swelling out and fading with each rumble.)
function drawGrowl(a, now) {
  const c = CELL, ph = reduced ? 0.4 : (now % GROWL_BEAT) / GROWL_BEAT, was = ctx.globalAlpha, cap = ctx.lineCap;
  ctx.globalAlpha = was * a.growl * (reduced ? 0.85 : 1 - ph * ph);
  ctx.beginPath();
  for (const sg of SIDES2) {
    const mid = sg * Math.PI / 2;
    for (let k = 0; k < 2; k++) {
      const r = c * (0.66 + 0.18 * k + 0.16 * ph);
      ctx.moveTo(Math.cos(mid - GROWL_ARC) * r, Math.sin(mid - GROWL_ARC) * r);
      ctx.arc(0, 0, r, mid - GROWL_ARC, mid + GROWL_ARC);
    }
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#fffbea';
  ctx.lineWidth = c * 0.12;
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = c * 0.06;
  ctx.stroke();
  ctx.globalAlpha = was;
  ctx.lineCap = cap;
}
