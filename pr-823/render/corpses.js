// The renderer (see render/core.js): the dead. A snake that dies bursts into
// meat, or fades over it; one that died in a moment the game holds keeps its pose
// until the hold ends.

// A dead snake bursts into meat, or with reduced motion fades over its meat.
// When the game holds the moment (your death), the snakes that died on that
// tick keep their pose, eyes screwed shut and covering their meat, until the
// hold ends. corpses: { s, until (burst/fade time), fade (true once fading) }.
const deaths = [], corpses = [];
const FADE_MS = T.CORPSE_FADE_MS;
const heldCells = new Uint8Array(GRID * GRID);

function holdFor(until) {
  for (const s of deaths) corpses.push({ s, until, fade: false });
  deaths.length = 0;
}

// Before drawing: unheld deaths burst; held ones whose time is up burst or
// start fading. (With reduced motion a dead snake fades over its beads
// under a still starburst: no pieces fly, and nothing grows.)
function updateCorpses(now) {
  for (const s of deaths) {
    burst(s);
    if (reduced) corpses.push({ s, until: now, fade: true });
  }
  deaths.length = 0;
  heldCells.fill(0);
  for (let i = corpses.length - 1; i >= 0; i--) {
    const c = corpses[i];
    if (!c.fade && now >= c.until) {
      burst(c.s);
      if (reduced) c.fade = true;
      else { corpses.splice(i, 1); continue; }
    }
    if (c.fade && now >= c.until + FADE_MS) { corpses.splice(i, 1); continue; }
    if (!c.fade) for (const b of c.s.body) heldCells[b.y * GRID + b.x] = 1;
  }
}

// How solid a corpse is drawn: held, wholly; fading, less and less (and so
// how faintly it hides a flag behind it: see frontOf).
const corpseAlpha = (c, now) => c.fade ? Math.max(0, 1 - (now - c.until) / FADE_MS) : 1;
// Held corpses are drawn at the frame's own point in the tick (a snake that
// starved moved before it died), the head pressed into what it hit, with a spark.
function drawCorpses(alpha, now) {
  for (const c of corpses) {
    const opacity = corpseAlpha(c, now);
    const hit = !c.fade && c.s.killer !== 'hunger';
    ctx.globalAlpha = opacity;
    const a = prepare(c.s, c.s.prev ? alpha : 1, now, true, hit ? 0.2 : 0);
    for (const [ox, oy] of a.offs || OFFS) { // (across a wrapped edge: each place it shows)
      if (ox || oy) ctx.translate(ox, oy);
      drawShadow(a);
      drawOutline(c.s, a);
      drawBody(c.s, a, now, true);
      if (ox || oy) ctx.translate(-ox, -oy);
    }
    ctx.globalAlpha = 1;
    if (hit) { // at the point of contact, kept on the board
      const sx = Math.min(SIZE, Math.max(0, a.pts[0] + c.s.dir.x * CELL * 0.55));
      const sy = Math.min(SIZE, Math.max(0, a.pts[1] + c.s.dir.y * CELL * 0.55));
      blitCrisp(starSprite(), sx, sy);
    }
  }
  ctx.globalAlpha = 1;
}
