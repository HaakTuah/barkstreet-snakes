// The renderer (see render/core.js): the canvas and the round's start. Its size
// and quality, the first setup, the words and starburst drawn ahead, and every
// piece of the renderer's state cleared for a new round.

// Size the backing store to the board's real size × devicePixelRatio.
// cssPx comes from a ResizeObserver, so no layout is read here.
// The backing store matches the device pixels the canvas covers exactly, so
// the browser never resamples it (devicePx comes from the ResizeObserver
// where supported). It's capped at MAX_BACKING pixels across (a large board
// on a dense screen), not at a density, so small dense phones stay crisp.
const MAX_BACKING = 2048;
// Quality: 2 everything; 1 no canopy shadows or second rain sheet, and at
// most 1.5 device pixels per CSS pixel; 0 also no falling leaves, at 1.
// (The game lowers it, for good, if this device keeps dropping frames.)
let quality = 2, lastCss = 0, lastDevice = 0;
function setQuality(q) {
  if (q === quality) return;
  quality = q;
  if (lastCss) resize(lastCss, lastDevice, true);
}
function resize(cssPx, devicePx, force = false) {
  lastCss = cssPx; lastDevice = devicePx;
  const dpr = Math.min(window.devicePixelRatio || 1, quality === 2 ? 99 : quality === 1 ? 1.5 : 1);
  const estimate = Math.round(cssPx * dpr);
  const exact = devicePx && quality === 2 && Math.abs(devicePx - estimate) <= 2 ? devicePx : estimate;
  const target = Math.max(GRID, Math.min(MAX_BACKING, exact));
  if (target === canvas.width && sized && !force) return false;
  sized = true;
  devPerCss = target / cssPx;
  canvas.width = canvas.height = target;
  k = target / SIZE;
  barkLayer = null;
  rainTile = null;
  snowTile = null;
  drifts = null; // (made again at this size: stretched, they'd blur)
  sprites.clear();
  warmUp(); // (the words and the starburst, at this size)
  veinSprites.clear();
  resetStatic();
  syncHoles();
  if (next && next.k !== k) { next = null; wantNext(); } // (the next round's log, at this size)
  return true;
}

function init(opts) {
  canvas = opts.canvas;
  birdLayer = opts.birdLayer || null;
  birdG = birdLayer ? birdLayer.getContext('2d') : null;
  ctx = canvas.getContext('2d', { alpha: false });
  k = canvas.width / SIZE;
  // Text sprites drawn before the font arrived get redrawn with it.
  document.fonts?.ready.then(() => { sprites.delete('float'); floatHalf.clear(); warmUp(); });
}

// The words that pop up, and a death's starburst: drawn now, not on the
// first bite or the first death (the busiest frame of a round).
const FLOAT_WORDS = ['+1', '+2', '+3', 'KO!', 'Crunch!', 'Fwoosh!', 'Boom!', 'Bonk!', 'Ouch!', 'Snip!', '-1', '-2', '-3'];
function warmUp() {
  if (!sized) return;
  for (const w of FLOAT_WORDS) floatSprite(w);
  blastSprite();
}
function setGame(g) {
  game = g;
  pieceFalls.length = 0; // (2s: no slab still falling from the round before)
  warmUp();
  deaths.length = 0;
  corpses.length = 0;
  pLive = 0;
  plife.fill(0);
  flife.fill(0);
  mLive = 0;
  mlife.fill(0);
  born.clear();
  eatenNow.clear();
  bornTick = -1;
  fresh = true;
  splats.length = 0;
  bugs.length = bugPops.length = scurries.length = dives.length = heals.length = 0;
  bugFor.clear(); shutSeen.clear();
  knockFor = -1; tickNow = 0;
  fallenFlags.length = 0; flagBends.clear(); flagsLater.length = 0;
  fallen.length = 0;
  nextLeaf = 0;
  crackCache.clear();
  crackSprites.clear();
  burrowSeen.clear();
  fireSeen.clear();
  scorched.length = 0;
  scorchDrawn = 0;
  scorchMask.fill(0);
  fireTick = -1;
  bolt = null; rainbow = null; flashAt = -1e9;
  blasts.length = 0;
  streaks.length = 0;
  refusal.at = -1e9; refusal.tick = -1;
  pressSeen.dir = null; pressSeen.stun = -1; pressSeen.tick = -1;
  timeFrom = timeAt = shownTime = g.time;
  resetBird(); plan.strikeAt = home.struckAt = -1; // (the woodpecker starts afresh: it comes in as it arrives, from its state)
  for (const k in sky) sky[k] = 0;
  snowCover = 0;
  embers.length = 0;
  ripples.length = 0;
  realms.clear();
  pre.ready = false; pre.key = NaN; pre.specs.length = pre.post.length = pre.todo.length = 0;
  inField.clear();
  fieldSpecs.length = 0;
  rgbaCache.clear(); // (bounded anyway: a backstop)
  trimColours(g); // (and so are these)
  drifts = null;
  // A different stretch of log each round: made ahead, if it's ready.
  if (next && next.k === k && sized) { barkSeed = next.seed; barkLayer = next.bark; shadeLayer = next.shade; }
  else { barkSeed = 1 + Math.floor(Math.random() * 2147483645); barkLayer = null; shadeLayer = null; }
  next = null;
  resetStatic();
  wantNext();
}
