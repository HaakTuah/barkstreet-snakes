// The renderer (see render/core.js): fire and its scorch, the sky's tint,
// rain, lightning and rainbows.

// ------------------------------------------------------------ weather

// How much of each kind of weather is showing (eased, so spells come and go
// gradually), the fire as last seen (to know when a cell burns out and
// leaves a scorch mark), a lightning bolt, a rainbow.
const sky = { sun: 0, wind: 0, rain: 0, storm: 0, snow: 0 };
let snowCover = 0; // how white the bark has gone
const embers = []; // burning leaves in the air: { fx, fy, x, y, at }
const fireSeen = new Map(); // cell -> it was burning
const scorched = [];        // cells that burned (baked into the static layer)
let scorchDrawn = 0, fireTick = -1;
let bolt = null, flashAt = -1e9, rainbow = null;

function easeSky(dt) {
  const kind = game.weather?.kind || 'clear';
  const step = Math.min(1, dt / 1400);
  for (const k in sky) sky[k] += ((k === kind ? 1 : 0) - sky[k]) * step;
  snowCover += ((kind === 'snow' ? 1 : 0) - snowCover) * Math.min(1, dt / (kind === 'snow' ? 7000 : 1600)); // (it settles slowly, and melts in a few seconds)
}

// Where the fire was and is: cells that burned out leave a scorch (and a
// puff of smoke); a burning cell the woodpecker took leaves its pit.
function trackFire(now) {
  if (game.tick === fireTick) return;
  fireTick = game.tick;
  for (const [k, was] of fireSeen) {
    if (game.fires?.has(k)) continue;
    fireSeen.delete(k);
    if (!was || game.holes.has(k)) continue;
    scorched.push(k);
    const x = (k % GRID) * CELL + CELL / 2, y = Math.floor(k / GRID) * CELL + CELL / 2;
    for (let i = 0; i < 3; i++) mote(x + (Math.random() - 0.5) * CELL * 0.5, y, (Math.random() - 0.5) * 10, -18 - Math.random() * 10, 1500, 4 + Math.random() * 3, 2);
  }
  if (game.fires) for (const [k, f] of game.fires) fireSeen.set(k, game.tick >= f.from);
}
// Scorch marks are soot, not holes: each burned cell adds to a smudge of
// char along the grain, and the cells of one burn run together into one
// smudge (each layer of soot is filled once over all of them, so where
// they overlap it's no darker: never a dark round centre, never a disc a
// cell; at most about 0.3 alpha), streaked along the grain, with a few
// pale cinders (lighter than any pit floor). They're on the static layer
// under the pits: a new one paints its box again (see paintStatic),
// soot and pits and all, so what's beside it matches.
const scorchMask = new Uint8Array(GRID * GRID); // (cells whose soot is on the static layer)
function syncScorch() {
  if (scorchDrawn === scorched.length || !staticLayer) return;
  const all = scorchDrawn === 0 && scorched.length > 8; // (the layer made again: everything, in one go)
  let x0 = GRID, y0 = GRID, x1 = -1, y1 = -1;
  const flush = () => { if (x1 >= 0) paintStatic(x0 - 1, y0 - 1, x1 + 1, y1 + 1); x0 = y0 = GRID; x1 = y1 = -1; };
  for (; scorchDrawn < scorched.length; scorchDrawn++) {
    const key = scorched[scorchDrawn], x = key % GRID, y = (key - x) / GRID;
    if (scorchMask[key] || holeMask[key]) continue;
    scorchMask[key] = 1;
    if (!all && x1 >= 0 && (Math.max(x1, x) - Math.min(x0, x) > 5 || Math.max(y1, y) - Math.min(y0, y) > 5)) flush(); // (far apart: a box each)
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  flush();
}
// The soot of the burned cells that reach cells cx0..cx1, cy0..cy1, on g
// (in the board's units). Each layer of soot is drawn as one shape over
// all of them, small (SOOT_RES pixels a cell, on a grid that lines up
// with the cells, so a box painted again matches what's round it) and
// then laid on the bark at its size, which softens its edges: no rim, no
// ring, just a smudge darkest where the burn was thickest. A cell's soot
// reaches less than a cell and a half from its centre, so the cells a
// cell round the box are all it takes.
const SOOT = [[0.76, 0.98, 0.3, '#0e0907'], [0.4, 0.6, 0.13, '#a39a8f']]; // (each layer's half width and height, in cells, alpha and colour: the char, and ash over its middle)
const SOOT_RES = 4;
const sootMasks = [];
function drawScorch(g, cx0, cy0, cx1, cy1) {
  const keys = [];
  for (let y = Math.max(0, cy0 - 1); y <= Math.min(GRID - 1, cy1 + 1); y++) {
    for (let x = Math.max(0, cx0 - 1); x <= Math.min(GRID - 1, cx1 + 1); x++) { const key = y * GRID + x; if (scorchMask[key] && !holeMask[key]) keys.push(key); }
  }
  if (!keys.length) return;
  // (A mask a layer, each the whole board and two cells round it, on the
  // same grid every time, so a box matches what's round it; only the box
  // and two cells round it are made afresh, and the box and a cell round it
  // laid on: the rest is outside what's painted.)
  const M = (GRID + 4) * SOOT_RES, u = SOOT_RES / CELL, sx = (cx0 + 1) * SOOT_RES, sy = (cy0 + 1) * SOOT_RES, sw = (cx1 - cx0 + 3) * SOOT_RES, sh = (cy1 - cy0 + 3) * SOOT_RES;
  for (let l = 0; l < SOOT.length; l++) {
    const [rx, ry, alpha, colour] = SOOT[l];
    const mask = sootMasks[l] ||= makeLayer(M, M), m = mask.getContext('2d', { willReadFrequently: true }); // (kept off the GPU: drawn on and then laid on the board each time, a canvas there costs ms a time, waiting on itself)
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.clearRect(cx0 * SOOT_RES, cy0 * SOOT_RES, (cx1 - cx0 + 5) * SOOT_RES, (cy1 - cy0 + 5) * SOOT_RES);
    m.setTransform(u, 0, 0, u, 2 * SOOT_RES, 2 * SOOT_RES);
    m.fillStyle = colour;
    for (const key of keys) { m.beginPath(); sootBlob(m, key, rx * CELL, ry * CELL); m.fill(); } // (opaque, so where they overlap is no darker)
    g.save();
    g.globalAlpha = alpha;
    g.imageSmoothingEnabled = true; // (bilinear: it softens a quarter of a cell)
    g.drawImage(mask, sx, sy, sw, sh, (cx0 - 1) * CELL, (cy0 - 1) * CELL, sw / u, sh / u);
    g.restore();
  }
  for (const key of keys) { // (a cell at a time, so a box painted again draws each just as before)
    const x = (key % GRID) * CELL, y = Math.floor(key / GRID) * CELL;
    g.beginPath();
    for (let n = 0; n < 3; n++) { // (char along the grain)
      const len = CELL * (0.45 + 0.45 * noise(key, n, 31));
      g.rect(x + 5 + noise(key, n, 32) * (CELL - 10), y + CELL / 2 - len / 2 + (noise(key, n, 33) - 0.5) * CELL * 0.3, 0.7 + noise(key, n, 34) * 0.6, len);
    }
    g.fillStyle = 'rgba(10,6,4,0.22)'; g.fill();
    g.beginPath();
    for (let n = 0; n < 2; n++) { // (a few cinders)
      const cx = x + 5 + noise(key, n, 35) * (CELL - 10), cy = y + 5 + noise(key, n, 36) * (CELL - 10), r = 0.8 + noise(key, n, 37) * 0.6;
      g.moveTo(cx + r, cy); g.arc(cx, cy, r, 0, TAU);
    }
    g.fillStyle = 'rgba(176,164,148,0.4)'; g.fill();
  }
}
// One cell's soot, on p: an uneven oval along the grain, a little off its centre.
function sootBlob(p, key, rx, ry) {
  const cx = (key % GRID + 0.5 + (noise(key, 0, 38) - 0.5) * 0.2) * CELL, cy = (Math.floor(key / GRID) + 0.5 + (noise(key, 0, 39) - 0.5) * 0.2) * CELL;
  const N = 10;
  let px = 0, py = 0;
  for (let i = 0; i <= N + 1; i++) { // (smooth: through the middles of an uneven ten-sided ring)
    const j = i % N, a = j / N * TAU, w = 0.84 + 0.32 * noise(key, j, 40);
    const x = cx + Math.cos(a) * rx * w, y = cy + Math.sin(a) * ry * w;
    if (i === 1) p.moveTo((px + x) / 2, (py + y) / 2);
    else if (i > 1) p.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
    px = x; py = y;
  }
  p.closePath();
}

// Fire on the bark: smouldering cells glow, burning cells flame (deadly),
// sending up embers and smoke. (Lightning on its way: see drawStrikes.)
const fireGlowSprite = () => sprite('fireglow', '', drawFireGlow);
const drawFireGlow = g => {
  const grad = g.createRadialGradient(0, 0, CELL * 0.1, 0, 0, CELL * 0.95);
  grad.addColorStop(0, 'rgba(253,186,116,0.6)');
  grad.addColorStop(1, 'rgba(249,115,22,0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(0, 0, CELL * 0.95, 0, TAU); g.fill();
};
function flame(g, x, y, h, w, lean) {
  g.beginPath();
  g.moveTo(x - w, y);
  g.quadraticCurveTo(x - w * 0.9, y - h * 0.55, x + lean, y - h);
  g.quadraticCurveTo(x + w * 0.9, y - h * 0.55, x + w, y);
  g.quadraticCurveTo(x, y + w * 0.5, x - w, y);
  g.fill();
}
// Flames on a burning cell, in eight frames of a flicker that loops (drawn
// once each, as sprites: a fire is many curves, and many fires a lot of them).
const FLAME_FRAMES = 8;
const FLAME_KEYS = [], BODY_FLAME_KEYS = []; // (each frame's name, made once: no string is built a frame)
for (let f = 0; f < FLAME_FRAMES; f++) { FLAME_KEYS.push(String(f)); BODY_FLAME_KEYS.push('b' + f); }
const flameSprite = f => sprite('flame', FLAME_KEYS[f], drawFlames);
const bodyFlameSprite = f => sprite('flame', BODY_FLAME_KEYS[f], drawFlames); // (on a snake: no burnt bark under it)
const drawFlames = (g, v) => {
  const c = CELL, bare = v[0] === 'b', p = Number(bare ? v.slice(1) : v) / FLAME_FRAMES * TAU;
  if (!bare) {
    g.fillStyle = 'rgba(20,8,2,0.55)'; // the burning bark under it
    g.beginPath(); g.arc(0, c * 0.12, c * 0.4, 0, TAU); g.fill();
  }
  const base = c * 0.42;
  for (const [col, sc] of [['#dc2626', 1.12], ['#f97316', 0.9], ['#fbbf24', 0.64], ['#fff7ed', 0.34]]) {
    g.fillStyle = col;
    for (let i = -1; i <= 1; i++) {
      const fl = Math.sin(p * (i === 0 ? 2 : 1) + i * 2.1), lean = Math.sin(p + i * 2.6);
      flame(g, i * c * 0.22 * sc, base, c * (0.95 + 0.2 * fl - Math.abs(i) * 0.22) * sc, c * 0.19 * (sc * 0.6 + 0.4), lean * c * 0.09);
    }
  }
};
// Where fire will spread next: a charred patch, and its glowing cracks (apart, so only the glow pulses).
const charSprite = () => sprite('char', '', drawChar);
const drawChar = g => {
  const c = CELL;
  g.fillStyle = 'rgba(20,8,2,0.5)';
  g.beginPath(); g.ellipse(0, c * 0.03, c * 0.43, c * 0.37, 0.3, 0, TAU); g.fill();
};
const emberSprite = () => sprite('ember', '', drawEmber);
const drawEmber = g => {
  const c = CELL;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(-c * 0.28, -c * 0.05); g.lineTo(-c * 0.08, c * 0.02); g.lineTo(c * 0.05, -c * 0.14); g.lineTo(c * 0.27, -c * 0.06);
  g.moveTo(-c * 0.08, c * 0.02); g.lineTo(-c * 0.02, c * 0.24);
  g.moveTo(c * 0.05, -c * 0.14); g.lineTo(c * 0.13, c * 0.13);
  g.strokeStyle = '#ef4444'; g.lineWidth = c * 0.09; g.stroke();
  g.strokeStyle = '#fb923c'; g.lineWidth = c * 0.05; g.stroke();
  g.strokeStyle = '#fde68a'; g.lineWidth = c * 0.02; g.stroke(); // (white-hot in the middle)
  g.fillStyle = '#f97316';
  for (const [ex, ey] of [[-0.21, 0.15], [0.21, 0.12], [0.02, -0.27]]) { g.beginPath(); g.arc(ex * c, ey * c, c * 0.045, 0, TAU); g.fill(); }
};
function drawFire(alpha, now) {
  if (!game.fires?.size) return;
  const c = CELL, lively = !reduced, t = now / 1000, tickPos = game.tick - 1 + alpha;
  for (const [k, f] of game.fires) {
    const x = (k % GRID) * c + c / 2, y = Math.floor(k / GRID) * c + c / 2, ph = k * 0.73;
    if (tickPos < f.from - 1) { // smouldering: a charred patch the size of the cell, its cracks glowing, and a thread of smoke
      if (f.strike) continue; // (lightning on its way: over the storm's gloom, see drawStrikes)
      const cw = SPRITE * c;
      ctx.drawImage(charSprite(), x - cw / 2, y - cw / 2, cw, cw);
      ctx.globalAlpha = lively ? 0.6 + 0.4 * Math.sin(now / 160 + ph) : 0.85;
      ctx.drawImage(emberSprite(), x - cw / 2, y - cw / 2, cw, cw);
      ctx.globalAlpha = 1;
      if (lively && Math.random() < 0.05) mote(x, y, (Math.random() - 0.5) * 6, -16, 1300, 3 + Math.random() * 2, 2);
      continue;
    }
    // Burning: a glow, then flames, outer to inner.
    const w = SPRITE * CELL * 1.3; // (one size: the glow flickers by its opacity)
    ctx.globalAlpha = lively ? 0.8 + 0.2 * Math.sin(t * 9 + ph) : 1;
    ctx.drawImage(fireGlowSprite(), x - w / 2, y - w / 2, w, w);
    ctx.globalAlpha = 1;
    const fr = lively ? Math.floor(t * 12 + ph * 5) % FLAME_FRAMES : 0, fw = SPRITE * CELL;
    ctx.drawImage(flameSprite(fr), x - fw / 2, y - fw / 2, fw, fw);
    if (lively && Math.random() < 0.18) mote(x + (Math.random() - 0.5) * c * 0.5, y - c * 0.2, (Math.random() - 0.5) * 14, -40 - Math.random() * 30, 700, 1.4 + Math.random(), 3);
    if (lively && Math.random() < 0.06) mote(x, y - c * 0.4, (Math.random() - 0.5) * 8, -20, 1800, 4 + Math.random() * 3, 2);
  }
}
// Lightning on its way: a ring closing in on the cell, so you can see how
// long there is, and a bolt in the middle, both opaque and inked like every
// other mark on the board, with a soft glow round the ring. Over the storm's gloom (see-through and under it, the mark of
// a cell about to catch fire was a grey smudge).
const STRIKE_BOLT = [0.17, -0.5, -0.24, 0.09, -0.01, 0.09, -0.15, 0.5, 0.27, -0.11, 0.05, -0.11]; // (a zigzag, one unit tall: x, y, ...)
function drawStrikes(alpha, now) {
  if (!game.fires?.size) return;
  const c = CELL, lively = !reduced, tickPos = game.tick - 1 + alpha;
  for (const [k, f] of game.fires) {
    if (!f.strike || tickPos >= f.from - 1) continue;
    const x = (k % GRID) * c + c / 2, y = Math.floor(k / GRID) * c + c / 2, ph = k * 0.73;
    const left = Math.max(0, Math.min(1, (f.from - 1 - tickPos) / T.STRIKE_WARN_TICKS));
    const flick = lively ? 0.7 + 0.3 * Math.sin(now / 37 + ph) : 1;
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(x, y, c * (0.35 + 1.1 * left), 0, TAU);
    ctx.strokeStyle = rgba('#c4b5fd', 0.3 * flick);
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.strokeStyle = '#3a2614';
    ctx.lineWidth = 4.6;
    ctx.stroke();
    ctx.strokeStyle = '#ede9fe';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    const s = c * 0.85 * (lively ? 1 + 0.07 * Math.sin(now / 37 + ph) : 1); // (the bolt crackles a little)
    ctx.beginPath();
    for (let i = 0; i < STRIKE_BOLT.length; i += 2) ctx.lineTo(x + STRIKE_BOLT[i] * s, y + STRIKE_BOLT[i + 1] * s);
    ctx.closePath();
    ctx.strokeStyle = '#3a2614';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#f5f3ff';
    ctx.fill();
  }
}

// The sky over the bark: a warm glow for the sun, grey for rain, a storm's
// gloom (all under the snakes, so they stay bright); rain falling over
// everything; a lightning bolt and its flash; a rainbow after the rain.
function drawSkyTint() {
  const sun = sky.sun, rain = sky.rain, storm = sky.storm;
  if (sky.snow > 0.01) { // winter's cold blue light
    ctx.globalAlpha = 0.14 * sky.snow;
    ctx.fillStyle = '#bfdbfe';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalAlpha = 1;
  }
  if (sun > 0.01) {
    ctx.globalAlpha = 0.16 * sun;
    ctx.drawImage(sunSprite(), -SIZE * 0.2, -SIZE * 0.2, SIZE * 1.2, SIZE * 1.2);
  }
  if (rain > 0.01 || storm > 0.01) {
    ctx.globalAlpha = 0.16 * rain + 0.3 * storm;
    ctx.fillStyle = storm > rain ? '#140f28' : '#1e293b';
    ctx.fillRect(0, 0, SIZE, SIZE);
  }
  ctx.globalAlpha = 1;
}
const sunSprite = () => sprite('sun', '', drawSun);
const drawSun = g => { // (a sprite's 2 cells, stretched over the board: it's all soft)
  const grad = g.createRadialGradient(-CELL * 0.8, -CELL * 0.8, 0, -CELL * 0.8, -CELL * 0.8, CELL * 2.2);
  grad.addColorStop(0, 'rgba(255,228,160,1)');
  grad.addColorStop(0.5, 'rgba(255,190,90,0.5)');
  grad.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = grad;
  g.fillRect(-CELL, -CELL, CELL * 2, CELL * 2);
};
// Rain: a seamless sheet of streaks, drawn once (at the board's resolution)
// and scrolled down and across, in two layers at different speeds for depth.
const RAIN_TILE = 384, RAIN_LAYERS = [[0.85, 1], [1.2, 0.55]], RAIN_LAYER = [[0.85, 1]];
let rainTile = null;
function buildRainTile() {
  const n = RAIN_TILE, t = makeLayer(n * k, n * k), g = t.getContext('2d');
  g.scale(k, k);
  g.strokeStyle = 'rgba(220,232,255,0.6)';
  g.lineWidth = 1.5;
  g.lineCap = 'round';
  let seed = 99;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.beginPath();
  for (let i = 0; i < 60; i++) {
    const x = rnd() * n, y = rnd() * n, len = 14 + rnd() * 10;
    for (const dx of [0, -n, n]) for (const dy of [0, -n, n]) { g.moveTo(x + dx, y + dy); g.lineTo(x + dx + len * 0.28, y + dy - len); }
  }
  g.stroke();
  return t;
}
function drawRain(now) {
  const wet = Math.max(sky.rain, sky.storm * 0.3); // (a storm only spits: it takes real rain to put fire out)
  if (wet < 0.02) return;
  if (!rainTile) rainTile = buildRainTile();
  const n = RAIN_TILE;
  if (reduced) { // (held still, not taken away: rain is a rule, it puts fire out and brings mushrooms)
    ctx.globalAlpha = wet * 0.6;
    for (let y = 0; y < SIZE; y += n) for (let x = 0; x < SIZE; x += n) ctx.drawImage(rainTile, x, y, n, n);
    ctx.globalAlpha = 1;
    return;
  }
  for (const [speed, alpha] of quality === 2 ? RAIN_LAYERS : RAIN_LAYER) {
    const oy = (now * speed) % n, ox = -(now * speed * 0.28) % n;
    ctx.globalAlpha = wet * alpha;
    for (let y = oy - n; y < SIZE; y += n) for (let x = ox - n; x < SIZE; x += n) ctx.drawImage(rainTile, x, y, n, n);
  }
  ctx.globalAlpha = 1;
}
function drawBolt(now) {
  if (!bolt) return;
  const age = now - bolt.at;
  if (age > 320) { bolt = null; return; }
  const a = 1 - age / 320, pts = bolt.pts;
  for (let l = 0; l < BOLT_LINES.length; l++) {
    ctx.strokeStyle = BOLT_LINES[l][0];
    ctx.globalAlpha = a;
    ctx.lineWidth = BOLT_LINES[l][1];
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
const BOLT_LINES = [['rgba(196,181,253,0.55)', 9], ['rgba(237,233,254,0.95)', 3.2], ['#ffffff', 1.4]]; // (a glow, the bolt, its white core)
function drawFlash(now) {
  const age = now - flashAt;
  if (age < 0 || age > 300 || reduced) return;
  ctx.globalAlpha = 0.28 * (1 - age / 300); // (soft, and once: no strobing)
  ctx.fillStyle = '#f5f3ff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.globalAlpha = 1;
}
const RAINBOW = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#6366f1', '#a855f7'];
// A rainbow after the rain: one great arch right across the log, rising out
// of the golden apple (its foot fading into it) and over, its top on the
// board where there's room, its other foot beyond the far edge. Always
// upright, red outermost. From an apple in the log's upper half there's no
// room for an arch on its own height (it was a stub off the top edge, and
// then hung upside down), so there it's part of a greater circle centred
// below the log, its top just under the top edge: it rises out of the apple,
// over, and down off the far side. It draws itself out from the apple, glows
// a moment, and fades. Both its ends fade, so it never ends in a flat cut
// (its far foot can be on the board, and its tip is as it grows).
function drawRainbow(now) {
  if (!rainbow) return;
  const age = now - rainbow.at, life = 9000;
  if (age > life) { rainbow = null; return; }
  const fade = Math.min(1, age / 600, (life - age) / 1600), grow = reduced ? 1 : Math.min(1, age / 1400), c = CELL;
  const x = rainbow.x * c + c / 2, y = rainbow.y * c + c / 2, fromLeft = rainbow.x < GRID / 2, side = fromLeft ? 1 : -1;
  let full;
  if (y >= SIZE / 2) { // round on the apple's height, over the top: half a circle
    bow.R = Math.min(SIZE * 0.95, Math.max(SIZE * 0.45, y - SIZE * 0.1));
    bow.cx = x + side * bow.R; bow.cy = y; bow.a0 = fromLeft ? Math.PI : 0;
    full = Math.PI;
  } else { // round a centre below the log, its top 0.06 of the board from the top, as far as it leaves the board's bottom on the far side
    bow.cy = SIZE * 1.15; bow.R = SIZE * 1.09;
    const dx = Math.sqrt(Math.max(0, bow.R * bow.R - (bow.cy - y) ** 2)), a = Math.atan2(y - bow.cy, -dx); // (the apple's angle, on the left)
    bow.cx = x + side * dx; bow.a0 = fromLeft ? a : -Math.PI - a;
    full = Math.asin((SIZE - bow.cy) / bow.R) - a;
  }
  bow.dir = side; bow.fade = fade;
  // From the apple's foot round over the top, as far as it has grown.
  const span = full * grow, end = Math.min(span / 2, 0.32);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, SIZE, SIZE); ctx.clip();
  ctx.lineCap = 'butt';
  for (let i = 0; i < 6; i++) { // (the foot fades in, out of the apple, and the far end out, from almost nothing)
    bowBands((i + 0.5) / 6, end * i / 6, end * (i + 1) / 6);
    bowBands((i + 0.5) / 6, span - end * (i + 1) / 6, span - end * i / 6);
  }
  if (span > 2 * end) bowBands(1, end, span - end);
  ctx.restore();
  ctx.globalAlpha = 1;
}
// The rainbow's bands (and the glow under them) from `from` to `to` along it, at `alpha`.
const bow = { cx: 0, cy: 0, R: 0, fade: 0, a0: 0, dir: 1 };
function bowBands(alpha, from, to) {
  const bw = CELL * 0.3;
  ctx.globalAlpha = 0.14 * bow.fade * alpha; // a soft glow under it
  ctx.strokeStyle = '#fffbea';
  ctx.lineWidth = bw * 9;
  bowArc(bow.R, from, to);
  ctx.globalAlpha = 0.3 * bow.fade * alpha;
  ctx.lineWidth = bw + 0.8;
  for (let i = 0; i < RAINBOW.length; i++) { ctx.strokeStyle = RAINBOW[i]; bowArc(bow.R + (3 - i) * bw, from, to); }
}
function bowArc(rad, from, to) {
  ctx.beginPath();
  ctx.arc(bow.cx, bow.cy, rad, bow.a0 + bow.dir * from, bow.a0 + bow.dir * to, bow.dir < 0);
  ctx.stroke();
}
