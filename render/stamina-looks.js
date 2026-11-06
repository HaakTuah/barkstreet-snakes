// The renderer (see render/core.js): a snake's stamina in how it looks
// (2u, design 37 "Shown on the snake, not above it"): in steps, by what it
// can afford, never a bar. Tired (neither plain power): a grey wash, a
// little smaller, a dull sheen, heavy half-shut lids, no light in its eyes,
// long slow blinks. Awake (one of them): as it always looked. Game on (a
// full bar): a brighter sheen, a big glint in its eyes, its head held a
// touch bigger, rarer blinks. Each
// step reads by brightness, eyes and blinking as well as by colour, and none
// uses gold, a ring or a point. (Charged, above a full bar, comes with 2u+:
// a fourth row in STEP_LOOK, past game on.)

// Per step: [tired, game on], the two looks a snake eases between.
const STEP_LOOK = [[1, 0], [0, 0], [0, 1]];
const TIRED_GREY = '#7d8086', TIRED_WASH = 0.34; // (a mid grey: it dulls a bright body and lifts a dark one alike)
const TIRED_BODY = 0.09, TIRED_HEAD = 0.05; // (how much smaller, at most: its body, its head)
const TIRED_LID = 0.55, GAME_SPARK = 1.8, GAME_HEAD = 0.05; // (how far its lids come down; how big the light in its eyes gets; how much bigger its head and face, on its game)
const STAMINA_EASE_MS = 70; // (from one step to the next in about 200 ms)
// Its look this frame, on the clock as drawn (a.tired, a.gameOn, 0 to 1,
// eased), and its segments shrunk to match: once per frame however many
// times it's drawn (at a wrapped edge, twice), from drawOutline and drawBody.
function staminaLook(s, a, dead) {
  if (dead || !game) { a.tired = a.gameOn = 0; return; }
  const [tw, gw] = STEP_LOOK[SnakeEngine.staminaStep(game, s, shownTime)];
  if (a.tired === undefined || reduced) { a.tired = tw; a.gameOn = gw; }
  else if (a.stamAt !== lastNow) {
    const k = 1 - Math.exp(-frameDt / STAMINA_EASE_MS);
    a.tired += (tw - a.tired) * k; a.gameOn += (gw - a.gameOn) * k;
    if (Math.abs(a.tired - tw) < 0.01) a.tired = tw;
    if (Math.abs(a.gameOn - gw) < 0.01) a.gameOn = gw;
  }
  a.stamAt = lastNow;
  const rad = a.rad, n = a.n;
  if ((!a.tired && !a.gameOn) || (rad[0] === a.stamR0 && rad[n - 1] === a.stamRn)) return; // (sized already: prepare makes them anew each frame)
  rad[0] *= 1 - TIRED_HEAD * a.tired + GAME_HEAD * a.gameOn;
  for (let i = 1; i < n; i++) rad[i] *= 1 - TIRED_BODY * a.tired;
  a.stamR0 = rad[0]; a.stamRn = rad[n - 1];
}
// Each segment's sheen: duller tired; on its game, brighter and bigger (a
// glossy roundness, still faint enough to keep its colour).
const sheenOf = a => rgba('#ffffff', 0.18 - 0.1 * a.tired + 0.06 * a.gameOn);
const sheenSize = a => 0.35 * (1 + 0.3 * a.gameOn);
// Tired, its grey wash, over all of it but what sticks out of its head (a
// hat, a beak): its face too, so its eyes are duller.
function tiredWash(a) {
  if (a.tired < 0.01) return;
  ctx.fillStyle = rgba(TIRED_GREY, TIRED_WASH * a.tired);
  shape(a, 0, a.star ? 1 : 0); // (not a star's head: its points dimming are its tell)
  ctx.fill();
}
// Its eyes, for the face about to be drawn (see faces.js: lookingEyes, the
// lids and catchlight): lids down tired, the glint gone; a bigger glint on
// its game. And how big its face is drawn (tired, a little smaller).
let eyeLid = 0, eyeSpark = 1, lidFill = '#000000';
function staminaFace(a, dead) {
  eyeLid = dead ? 0 : TIRED_LID * a.tired;
  eyeSpark = dead ? 1 : 1 - a.tired + (GAME_SPARK - 1) * a.gameOn;
  lidFill = mix(a.fills[0], '#3a2614', 0.22); // (its head's colour, in shade)
  return dead ? 1 : 1 - TIRED_HEAD * a.tired + GAME_HEAD * a.gameOn;
}
// Its blinks: tired, long and slow and often (heavy eyes); on its game, rarer.
const blinkLength = a => T.BLINK_MS * (1 + 3 * a.tired);
const blinkGap = a => 1 - 0.5 * a.tired + 0.5 * a.gameOn;
// Heavy lids over an open eye at (x, ±y), its white of radius w (in the
// face's frame, +x ahead): the back of each eye under its lid, a shade of
// its head's colour, the lid's edge an ink curve bowed forward like a shut
// eye's (see lids).
function heavyLids(x, y, w) {
  if (eyeLid < 0.02) return;
  const t = Math.acos(2 * eyeLid - 1), ex = x + w * (2 * eyeLid - 1), ey = w * Math.sin(t), bow = w * 0.35;
  ctx.fillStyle = lidFill;
  ctx.beginPath();
  for (const sg of SIDES2) { ctx.moveTo(ex, sg * y - ey); ctx.arc(x, sg * y, w, -t, t, true); ctx.quadraticCurveTo(ex + bow, sg * y, ex, sg * y - ey); }
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = CELL * 0.045;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const sg of SIDES2) { ctx.moveTo(ex, sg * y - ey); ctx.quadraticCurveTo(ex + bow, sg * y, ex, sg * y + ey); }
  ctx.stroke();
}
// The Field guide's picture: you tired (above) and on your game (below).
function guideStamina(g) {
  const c = CELL, eyes = (x, a, tired) => {
    if (tired) { g.fillStyle = rgba(TIRED_GREY, TIRED_WASH); bodyFills(a, 0); }
    for (const sg of SIDES2) {
      g.fillStyle = '#fffbea'; circle(x + c * 0.16, sg * c * 0.2, c * 0.13);
      g.fillStyle = INK; circle(x + c * 0.2, sg * c * 0.2, c * 0.07);
      if (!tired) { g.fillStyle = '#ffffff'; circle(x + c * 0.17, sg * c * 0.2 - c * 0.03, c * 0.04); }
    }
    if (tired) { eyeLid = TIRED_LID; lidFill = mix(mix('#4ade80', '#3a2614', 0.22), TIRED_GREY, TIRED_WASH); heavyLids(x + c * 0.16, c * 0.2, c * 0.13); eyeLid = 0; }
  };
  for (const tired of [true, false]) {
    g.save();
    g.translate(c * 0.55, c * (tired ? -0.5 : 0.5));
    g.scale(tired ? 0.52 : 0.56, tired ? 0.52 : 0.56);
    guideSnake(g, '#4ade80', true, (x, y, a) => eyes(x, a, tired));
    g.restore();
  }
}
