// The canvas renderer for Barkstreet Snakes.
//
// The board is drawn in a fixed logical space of GRID cells of CELL units
// (768 × 768). The canvas backing store is sized to the board's real size ×
// devicePixelRatio, so everything stays crisp, and one transform maps logical
// units to device pixels.
//
// Cost control, measured in Chrome's GPU process as well as in script: the
// bark and holes live on a prerendered static layer (the next round's is
// built ahead, while a card is up); food, meat, the woodpecker and the "+1"s
// are cached sprites (and so is Star's head, its star and its mustache,
// each turned as it's drawn); particles come from a fixed pool; colours come
// from cached ramps (Star's rainbow too, and Copycat's copy of it). Bodies
// are drawn as rectangles, then circles: separate fills batch into one GPU
// operation, while one path of many contours is triangulated every frame
// and strokes between circles break the batch. A
// translucent shape made of overlapping pieces (the shadows, a land's colour
// round a rival on it) is drawn opaque into an offscreen veil and laid on
// once. Sovereign's and Colonist's land are cached layers, made again only
// when the land changes (the land a woodpecker's strike will leave is made
// ahead, a little a frame, while it aims: see prebuild). The per-frame path
// builds no strings, closures or arrays (a body across a wrapped edge keeps
// its offsets on its anim; a loop over both sides goes over SIDES2), only
// the odd small record of something new (a leaf falling). The exceptions
// are passing moments: a dash's streak,
// and the woodpecker working out its perch and tracing its patch, once a
// patch or when the page moves (not every frame of its stay).
//
// The renderer is split into the files of render/, by what they draw, so a
// change reads a few small files instead of one big one. They are plain
// scripts that share one scope: index.html loads them in the order below
// (sw.js lists them too), each sees every name the others declare, and the
// last, world.js, makes window.SnakeRender. So a file may call anything from
// inside its functions, but what runs as it loads (a table, a constant
// worked out from another) may use only names from itself or the files
// before it. The scope is the page's: game/'s files share it too, so every
// name at a file's top must be unique across them all and no browser global
// (tools/scope-test.js checks both).
//
//   core.js       setup, colours, the bark (the static layer, snow, embers, leaves)
//   sprites.js    cached sprites, the Field guide's pictures, beetles, particles
//   looks.js      each snake's animation state, its looks, its gaze, its jumps
//   lead.js       drawing half a tick ahead: where bodies go, and their shape
//   shadows.js    the veil, shadows on the bark and the light in a pit
//   bodies.js     outlines, the gold line of a power, and the body itself
//   marks.js      pips, rests, your pressed turn, Mason's veins, the tie, Star's head
//   tongues.js    every look's tongue (or gag)
//   faces.js      eyes, lids and mouths, and every look's face
//   land.js       Sovereign's realm and Colonist's colonies: land on a map
//   flags.js      land made ahead of a strike, its dashes, banners and flags
//   food.js       the food, and the beetles' burrows
//   weather.js    fire and scorch, the sky, rain, lightning, rainbows
//   bird-perch.js the woodpecker's size, its perch, its aim and its layer
//   bird.js       the woodpecker's plan and its poses
//   bird-drum.js  how it clings to drum, and what of the board it hides
//   bird-draw.js  the woodpecker drawn
//   holes.js      its aim and patch on the board, and the holes and pits it leaves
//   world.js      the frame, the round's events and moments, and the API

const T = window.TUNING;
const GRID = T.GRID;
const CELL = 32;
const SIZE = GRID * CELL;
const BARK = '#5a3b22';
const INK = '#0b1210';
const TAU = Math.PI * 2;
const SIDES2 = [-1, 1]; // (either side, for a loop over both: no array made a frame)

let canvas, ctx, PERSONAS;
let devPerCss = 1;         // device pixels per CSS pixel on the board
let shakeX = 0, shakeY = 0; // this frame's shake, in device pixels
let viewerId = -1; // your snake on this screen (it gets the bright outline), -1 if none
let k = 1;                 // device pixels per logical unit
let reduced = false;       // prefers-reduced-motion
let game = null;

// ------------------------------------------------------------ utilities

// Blend two #rrggbb colors; t = 0 gives a, t = 1 gives b. Results are cached
// (by a, then b, then t: no key string is built), so calling this with the
// same arguments every frame costs a lookup.
const mixCache = new Map();
function mix(a, b, t) {
  let byB = mixCache.get(a);
  if (!byB) mixCache.set(a, byB = new Map());
  let byT = byB.get(b);
  if (!byT) byB.set(b, byT = new Map());
  let out = byT.get(t);
  if (out) return out;
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  out = '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  byT.set(t, out);
  return out;
}

// Perceived brightness 0..1 of a #rrggbb color.
function luma(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function makeLayer(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

// ------------------------------------------------------------ the bark

// The board is the top of a log lying on the forest floor under an apple
// tree, seen from above, running from the top of the board to the bottom:
// warm bark with its grain running along it (furrows, raised plates lit on
// one edge, cracks, knots with growth rings), soft sun and shade from the
// canopy, a little shadow down both sides where it rounds away, and moss
// in small soft cushions, mostly down the sides. Drawn once per round at
// the current resolution (a different stretch of log each round). The
// moss is dark and olive, so it never passes for food.
let barkLayer = null, staticLayer = null, holesDrawn = 0, sized = false;
let barkSeed = 7;

function buildBark(from = barkSeed) {
  const px = SIZE * k;
  const b = makeLayer(px, px);
  const g = b.getContext('2d');
  g.scale(k, k);
  let seed = from;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dot = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  g.fillStyle = BARK;
  g.fillRect(0, 0, SIZE, SIZE);
  // Patches of sun and shade from the canopy, very soft.
  for (let i = 0; i < 8; i++) {
    const x = rnd() * SIZE, y = rnd() * SIZE, r = 110 + rnd() * 170, sun = i % 3 !== 2;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, sun ? 'rgba(255,205,130,0.11)' : 'rgba(18,9,3,0.2)');
    grad.addColorStop(1, sun ? 'rgba(255,205,130,0)' : 'rgba(18,9,3,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // Furrows along the grain...
  for (let i = 0; i < 260; i++) {
    const dark = rnd() < 0.55;
    g.strokeStyle = dark ? `rgba(28,16,6,${0.15 + rnd() * 0.25})` : `rgba(150,108,66,${0.08 + rnd() * 0.15})`;
    g.lineWidth = 2 + rnd() * 10;
    let x = rnd() * SIZE, y = -20;
    g.beginPath();
    g.moveTo(x, y);
    while (y < SIZE + 20) { y += 30 + rnd() * 40; x += (rnd() - 0.5) * 14; g.lineTo(x, y); }
    g.stroke();
  }
  // ...raised plates between them, lit along their upper-left edge...
  for (let i = 0; i < 170; i++) {
    const x = rnd() * SIZE, y = rnd() * SIZE, w = 5 + rnd() * 9, h = 18 + rnd() * 46, a = (rnd() - 0.5) * 0.2;
    g.fillStyle = `rgba(122,86,50,${0.1 + rnd() * 0.14})`;
    g.beginPath(); g.ellipse(x, y, w, h, a, 0, TAU); g.fill();
    g.strokeStyle = `rgba(196,154,102,${0.1 + rnd() * 0.12})`;
    g.lineWidth = 1.4;
    g.beginPath(); g.ellipse(x, y, w, h, a, Math.PI * 0.85, Math.PI * 1.2); g.stroke();
  }
  // ...cracks, thin, dark and jagged...
  g.strokeStyle = 'rgba(16,8,2,0.45)';
  g.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    let x = rnd() * SIZE, y = rnd() * SIZE;
    g.lineWidth = 1 + rnd() * 1.5;
    g.beginPath(); g.moveTo(x, y);
    for (let j = 0, n = 3 + rnd() * 4; j < n; j++) { x += (rnd() - 0.5) * 10; y += 6 + rnd() * 12; g.lineTo(x, y); }
    g.stroke();
  }
  // ...and knots, with the growth rings round them.
  for (let i = 0; i < 6; i++) {
    const x = rnd() * SIZE, y = rnd() * SIZE, r = 10 + rnd() * 16;
    const grad = g.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, 'rgba(20,10,3,0.8)');
    grad.addColorStop(0.6, 'rgba(60,36,16,0.5)');
    grad.addColorStop(1, 'rgba(60,36,16,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(x, y, r * 0.6, r, 0, 0, TAU);
    g.fill();
    g.lineWidth = 1.2;
    for (let j = 1; j <= 3; j++) {
      g.strokeStyle = `rgba(30,16,6,${0.28 - j * 0.06})`;
      g.beginPath(); g.ellipse(x, y, r * 0.6 + j * 4, r + j * 6, 0, 0, TAU); g.stroke();
    }
  }
  // The log rounds away down both sides: a little shadow there, and a soft
  // vignette, so the edge cells read as the edge of the log.
  const roll = g.createLinearGradient(0, 0, SIZE, 0);
  roll.addColorStop(0, 'rgba(8,5,2,0.34)');
  roll.addColorStop(0.15, 'rgba(8,5,2,0.04)');
  roll.addColorStop(0.5, 'rgba(255,214,150,0.04)');
  roll.addColorStop(0.85, 'rgba(8,5,2,0.04)');
  roll.addColorStop(1, 'rgba(8,5,2,0.34)');
  g.fillStyle = roll;
  g.fillRect(0, 0, SIZE, SIZE);
  const v = g.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.45, SIZE / 2, SIZE / 2, SIZE * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.2)');
  g.fillStyle = v;
  g.fillRect(0, 0, SIZE, SIZE);
  // Moss: small soft cushions, mostly down the sides (where it wraps round
  // the log), a few on top. Each is a clump of rounded tufts: a shadow under
  // it, a dark-green body, every tuft lit on its upper left and darker round
  // its edge, fuzz over it, and spore stalks out of the bigger ones.
  const MOSS = ['#344f1b', '#3a5520', '#2f4a1d', '#3d571a'];
  for (let i = 0; i < 12; i++) {
    const side = rnd() < 0.75;
    const x = side ? (rnd() < 0.5 ? rnd() * SIZE * 0.09 : SIZE - rnd() * SIZE * 0.09) : SIZE * (0.2 + rnd() * 0.6), y = rnd() * SIZE;
    const rx = side ? 10 + rnd() * 18 : 6 + rnd() * 9, ry = rx * (side ? 1.3 + rnd() * 0.7 : 1 + rnd() * 0.4);
    const bed = g.createRadialGradient(x, y, 0, x, y, ry * 1.15); // a soft bed, so it grows out of the bark
    bed.addColorStop(0, 'rgba(38,58,20,0.35)');
    bed.addColorStop(1, 'rgba(38,58,20,0)');
    g.fillStyle = bed;
    g.beginPath(); g.ellipse(x, y, rx * 1.2, ry * 1.15, 0, 0, TAU); g.fill();
    const tufts = [];
    for (let j = 0, n = 4 + Math.round(rx * ry / 22); j < n; j++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.85;
      tufts.push([x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, 3 + rnd() * Math.min(5, rx * 0.4)]);
    }
    tufts.sort((p, q) => p[1] - q[1]); // (back to front: nearer tufts overlap)
    const clump = (dx, dy, grow) => {
      g.beginPath();
      for (const [tx, ty, tr] of tufts) { g.moveTo(tx + dx + tr + grow, ty + dy); g.arc(tx + dx, ty + dy, tr + grow, 0, TAU); }
    };
    g.fillStyle = 'rgba(14,8,2,0.28)'; // its shadow on the bark
    clump(1, 2, 0.5); g.fill();
    g.fillStyle = MOSS[Math.floor(rnd() * MOSS.length)];
    clump(0, 0, 0); g.fill();
    for (const [tx, ty, tr] of tufts) {
      const lit = g.createRadialGradient(tx - tr * 0.35, ty - tr * 0.4, tr * 0.1, tx, ty, tr);
      lit.addColorStop(0, 'rgba(128,156,78,0.38)');
      lit.addColorStop(0.55, 'rgba(90,120,48,0.1)');
      lit.addColorStop(1, 'rgba(18,30,8,0.22)');
      g.fillStyle = lit;
      dot(tx, ty, tr);
    }
    for (const [tx, ty, tr] of tufts) { // fuzz: tiny fronds, light and dark
      for (let j = 0; j < tr * 2; j++) {
        const a = rnd() * TAU, d = tr * (0.2 + rnd() * 0.9);
        g.fillStyle = rnd() < 0.5 ? 'rgba(126,154,76,0.4)' : 'rgba(24,40,12,0.4)';
        dot(tx + Math.cos(a) * d, ty + Math.sin(a) * d, 0.5 + rnd() * 0.8);
      }
    }
    if (rx > 18) { // spore stalks, each with its little capsule
      g.lineWidth = 0.9;
      for (let j = 0, n = 2 + Math.floor(rnd() * 4); j < n; j++) {
        const [tx, ty, tr] = tufts[Math.floor(rnd() * tufts.length)];
        const sx = tx + (rnd() - 0.5) * tr, sy = ty + (rnd() - 0.5) * tr, ex = sx + (rnd() - 0.5) * 5, ey = sy - 5 - rnd() * 5;
        g.strokeStyle = 'rgba(120,70,30,0.85)';
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
        g.fillStyle = '#93522a';
        g.beginPath(); g.ellipse(ex, ey, 1.1, 1.7, (ex - sx) * 0.1, 0, TAU); g.fill();
      }
    }
  }
  // (No grid lines: the log is just a log. Everything on it still sits on
  // the cells, so the cells are still easy to read.)
  return b;
}

// Leaf shadows from the canopy overhead: soft dark dapples on a small layer
// (it's all soft, so a low resolution is plenty), drawn stretched over the
// board and swaying in the wind. Built once per round.
let shadeLayer = null;
function buildShade(from = barkSeed) {
  const n = 256, s = makeLayer(n, n), g = s.getContext('2d');
  let seed = from * 7 + 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 22; i++) {
    const cx = rnd() * n, cy = rnd() * n;
    for (let j = 0; j < 6; j++) {
      const x = cx + (rnd() - 0.5) * 34, y = cy + (rnd() - 0.5) * 34, r = 5 + rnd() * 10;
      const grad = g.createRadialGradient(x, y, 0, x, y, r * 1.4);
      grad.addColorStop(0, 'rgba(12,6,2,0.2)');
      grad.addColorStop(1, 'rgba(12,6,2,0)');
      g.fillStyle = grad;
      g.beginPath(); g.ellipse(x, y, r * 1.4, r, rnd() * Math.PI, 0, TAU); g.fill();
    }
  }
  return s;
}
// Snow settling on the bark: low drifts lying in the furrows along the
// grain (top to bottom), each a long, thin, ragged wedge, wider at one end
// and wandering a little as a furrow does, now and then with a lump
// missing (two down one furrow): a soft white top over a blue-grey
// underside, inked along its lower edge only, away from the light. Opaque:
// they grow as the snow settles, longer from their wide end and fatter,
// and shrink as it melts (faded in, they were grey smears; as stacks of
// tall round lumps, inked all round, they stood up off the log like white
// candles, brighter than anything on it). Drawn at the board's own
// resolution (stretched, they blurred into smoke), in DRIFT_STEPS steps of
// growth, only once it snows; none on a burrow or in a hole (they lie on
// Sovereign's and Colonist's land like anywhere else, tinted by it).
const DRIFT_STEPS = 12, DRIFT_PTS = 12; // (points down each side of one)
let drifts = null, driftStep = -1, driftSig = -1;
function buildDrifts(d, step) {
  const g = d.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, d.width, d.height);
  g.setTransform(k, 0, 0, k, 0, 0);
  let seed = barkSeed * 13 + 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const grown = step / DRIFT_STEPS, wide = 0.4 + 0.6 * grown, long = 0.25 + 0.75 * grown; // (how far it has grown, across and along)
  const n = DRIFT_PTS, cx = [], cy = [], lw = [], rw = [], ring = [], specks = [];
  for (let i = 0; i < 20; i++) {
    const x0 = rnd() * SIZE, y0 = rnd() * SIZE, dir = rnd() < 0.5 ? 1 : -1; // (its wide end, and which way along the grain it runs from there)
    const len = CELL * (1.3 + rnd() * 3.2), w0 = 5 + rnd() * 5.5, lean = (rnd() - 0.5) * 0.16, bow = (rnd() - 0.5) * 7; // (the grain's slight lean, and a crescent's bow)
    const gap = rnd() < 0.4 ? 3 + Math.floor(rnd() * (n - 6)) : -1;
    let x0b = Infinity, x1b = -Infinity, wx = 0;
    for (let j = 0; j <= n; j++) {
      const t = j / n, taper = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.55)), 0.7); // (deepest a third of the way along, thinning out to a wisp)
      wx += (rnd() - 0.5) * 3;
      cx[j] = x0 + lean * len * t + bow * Math.sin(Math.PI * t) + wx; cy[j] = y0 + dir * len * t;
      lw[j] = 0.6 + w0 * taper * (0.4 + 0.85 * rnd()); rw[j] = 0.6 + w0 * taper * (0.4 + 0.85 * rnd()); // (ragged, each side its own)
      x0b = Math.min(x0b, cx[j] - lw[j]); x1b = Math.max(x1b, cx[j] + rw[j]);
    }
    for (let s = 0; s < 3; s++) { // (a few crumbs of it beside it)
      const j = Math.floor(rnd() * n), sd = rnd() < 0.5 ? -1 : 1, r = 0.8 + rnd() * 1.4, off = 2.5 + rnd() * 3;
      specks[3 * s] = j; specks[3 * s + 1] = sd * off; specks[3 * s + 2] = r;
    }
    // (judged full grown, ink and all, so none comes and goes as it grows)
    if (!bareBark(x0b - 9, Math.min(y0, y0 + dir * len) - 6, x1b + 10, Math.max(y0, y0 + dir * len) + 6)) continue;
    for (let j = 0; j <= n; j++) { cx[j] = x0 + (cx[j] - x0) * long; cy[j] = y0 + (cy[j] - y0) * long; lw[j] *= wide; rw[j] *= wide; }
    // One piece of it (points from..to) as an outline, smoothed through
    // the midpoints, its ends rounded off.
    const trace = (from, to, dx, dy, grow) => {
      ring.length = 0;
      ring.push(cx[from], cy[from] - dir * (1 + grow));
      for (let j = from; j <= to; j++) ring.push(cx[j] - Math.max(0.3, lw[j] + grow), cy[j]);
      ring.push(cx[to], cy[to] + dir * (1 + grow));
      for (let j = to; j >= from; j--) ring.push(cx[j] + Math.max(0.3, rw[j] + grow), cy[j]);
      const m = ring.length / 2;
      g.moveTo(dx + (ring[0] + ring[2]) / 2, dy + (ring[1] + ring[3]) / 2);
      for (let p = 1; p <= m; p++) {
        const a = p % m, b = (p + 1) % m;
        g.quadraticCurveTo(dx + ring[2 * a], dy + ring[2 * a + 1], dx + (ring[2 * a] + ring[2 * b]) / 2, dy + (ring[2 * a + 1] + ring[2 * b + 1]) / 2);
      }
      g.closePath();
    };
    const shape = (dx, dy, grow) => {
      g.beginPath();
      if (gap < 0) trace(0, n, dx, dy, grow);
      else { trace(0, gap - 1, dx, dy, grow); trace(gap + 1, n, dx, dy, grow); }
      for (let s = 0; s < specks.length; s += 3) {
        const j = specks[s], off = specks[s + 1] * wide, r = Math.max(0.4, specks[s + 2] * wide + grow);
        const sx = dx + cx[j] + off + (off < 0 ? -lw[j] : rw[j]), sy = dy + cy[j];
        g.moveTo(sx + r, sy); g.arc(sx, sy, r, 0, TAU);
      }
    };
    shape(1.6 * wide, 2 * wide, 0); g.fillStyle = '#283246'; g.fill(); // its ink, down and to the right of the light, so only along its lower edge...
    shape(0.8 * wide, 1 * wide, 0); g.fillStyle = '#8da2c4'; g.fill(); // ...its blue-grey underside...
    shape(-0.2 * wide, -0.3 * wide, -0.3 * wide); g.fillStyle = '#eef4fb'; g.fill(); // ...and its soft white top, lit along its upper left
  }
}
// Is the box (x0, y0)..(x1, y1) clear of every burrow and hole?
function bareBark(x0, y0, x1, y1) {
  if (game.burrows) for (const b of game.burrows) if (x1 > (b.x - 0.3) * CELL && x0 < (b.x + 1.3) * CELL && y1 > (b.y - 0.3) * CELL && y0 < (b.y + 1.3) * CELL) return false;
  if (game.holes.size) {
    for (let cy = Math.max(0, Math.floor(y0 / CELL)); cy <= Math.min(GRID - 1, Math.floor(y1 / CELL)); cy++) {
      for (let cx = Math.max(0, Math.floor(x0 / CELL)); cx <= Math.min(GRID - 1, Math.floor(x1 / CELL)); cx++) if (game.holes.has(cy * GRID + cx)) return false;
    }
  }
  return true;
}
// What the drifts keep clear of, as one number: made again when it changes.
function bareSig() {
  let h = game.holes.size;
  if (game.burrows) for (const b of game.burrows) h = (h * 31 + b.y * GRID + b.x + 1) % 999999937;
  return h;
}
function drawSnowCover() {
  if (snowCover < 0.02) return;
  const step = Math.max(1, Math.round(snowCover * DRIFT_STEPS)), sig = bareSig();
  if (!drifts) { drifts = makeLayer(SIZE * k, SIZE * k); driftStep = -1; }
  if (step !== driftStep || sig !== driftSig) { buildDrifts(drifts, step); driftStep = step; driftSig = sig; }
  ctx.drawImage(drifts, 0, 0, SIZE, SIZE);
}

// Falling snow: a seamless sheet of flakes, drifting down and swaying, in two layers.
let snowTile = null;
function buildSnowTile() {
  const n = RAIN_TILE, t = makeLayer(n * k, n * k), g = t.getContext('2d');
  g.scale(k, k);
  let seed = 77;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    const x = rnd() * n, y = rnd() * n, r = 1.4 + rnd() * 2.6;
    g.fillStyle = `rgba(255,255,255,${0.55 + rnd() * 0.4})`;
    for (const dx of [0, -n, n]) for (const dy of [0, -n, n]) { g.beginPath(); g.arc(x + dx, y + dy, r, 0, TAU); g.fill(); }
  }
  return t;
}
function drawSnow(now) {
  if (sky.snow < 0.02) return;
  if (!snowTile) snowTile = buildSnowTile();
  const n = RAIN_TILE;
  if (reduced) { // (held still, not taken away, like the rain: snow is a rule too, it puts fire out and starts the lean season)
    ctx.globalAlpha = sky.snow * 0.6;
    for (let y = 0; y < SIZE; y += n) for (let x = 0; x < SIZE; x += n) ctx.drawImage(snowTile, x, y, n, n);
    ctx.globalAlpha = 1;
    return;
  }
  for (const [speed, alpha, sway] of quality === 2 ? SNOW_LAYERS : SNOW_LAYER) {
    const oy = (now * speed) % n, ox = (Math.sin(now / 1700 * speed * 4) * 30 + now * speed * 0.15) % n;
    ctx.globalAlpha = sky.snow * alpha;
    for (let y = oy - n; y < SIZE; y += n) for (let x = ox - n; x < SIZE; x += n) ctx.drawImage(snowTile, x, y, n * sway, n * sway);
  }
  ctx.globalAlpha = 1;
}
const SNOW_LAYERS = [[0.06, 1, 1], [0.1, 0.7, 1]], SNOW_LAYER = [[0.06, 1, 1]];

// In the cold, every snake's breath shows: a little puff now and then.
const breathAt = new WeakMap();
function breathe(now) {
  if (reduced) return;
  for (const s of game.snakes) {
    if (!s.alive || now < (breathAt.get(s) || 0)) continue;
    breathAt.set(s, now + 1100 + Math.random() * 900);
    const h = s.body[0], x = h.x * CELL + CELL / 2 + s.dir.x * CELL * 0.55, y = h.y * CELL + CELL / 2 + s.dir.y * CELL * 0.55;
    for (let i = 0; i < 2; i++) mote(x, y, s.dir.x * 14 + (Math.random() - 0.5) * 6, s.dir.y * 14 - 6, 900, 3 + Math.random() * 2, 0);
  }
}

// Burning leaves blown downwind: each arcs from its fire to where it lands,
// spinning, trailing sparks. With reduced motion it doesn't fly: it fades
// in where it lands (the smoulder that follows marks the cell).
function drawEmbers(now) {
  for (let i = embers.length - 1; i >= 0; i--) {
    const e = embers[i], t = (now - e.at) / 650;
    if (t >= 1) { embers.splice(i, 1); continue; }
    const f = reduced ? 1 : t; // (how far along its flight it's drawn)
    const x0 = e.fx * CELL + CELL / 2, y0 = e.fy * CELL + CELL / 2, x1 = e.x * CELL + CELL / 2, y1 = e.y * CELL + CELL / 2;
    const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f - Math.sin(f * Math.PI) * CELL * 1.6;
    const w = SPRITE * CELL * 0.9;
    if (reduced) ctx.globalAlpha = Math.min(1, t * 2.5, (1 - t) * 4); // (in, a moment there, and out as the smoulder takes over)
    ctx.drawImage(fireGlowSprite(), x - w / 2, y - w / 2, w, w);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(f * 9);
    ctx.drawImage(leafSprite('#ea580c'), -SPRITE * CELL / 2, -SPRITE * CELL / 2, SPRITE * CELL, SPRITE * CELL);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (!reduced && Math.random() < 0.5) mote(x, y, (Math.random() - 0.5) * 20, -10 - Math.random() * 20, 450, 1.4, 3);
  }
}

function drawCanopy(now) {
  if (quality !== 2) return;
  if (!shadeLayer) shadeLayer = buildShade();
  const t = reduced ? 0 : now / 1000, over = SIZE * 0.06, gusty = 1 + 2.2 * (sky.wind + sky.storm);
  const dx = Math.sin(t * 0.43) * 8 + Math.sin(t * 1.7) * 1.6 * gusty * gusty, dy = Math.cos(t * 0.37) * 6 + Math.sin(t * 1.3) * 1.2 * gusty;
  ctx.drawImage(shadeLayer, dx - over, dy - over, SIZE + 2 * over, SIZE + 2 * over);
}

// Now and then an autumn leaf drifts down onto the log, swaying and turning
// (under the food and the snakes, so it never hides anything that matters).
const fallen = [];
let nextLeaf = 0;
const LEAVES = ['#9a3412', '#7c2d12', '#a0522d', '#8b5a2b']; // (russet and brown: gold means a power)
const leafSprite = c => sprite('leaf', c, drawLeaf);
const drawLeaf = (g, col) => {
  const c = CELL;
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(-c * 0.3, 0);
  g.quadraticCurveTo(-c * 0.05, -c * 0.2, c * 0.3, 0);
  g.quadraticCurveTo(-c * 0.05, c * 0.2, -c * 0.3, 0);
  g.fill();
  g.strokeStyle = 'rgba(60,30,8,0.55)'; // the midrib and stalk
  g.lineWidth = c * 0.025;
  g.beginPath(); g.moveTo(-c * 0.38, 0); g.lineTo(c * 0.24, 0); g.stroke();
  g.beginPath();
  for (const x of [-0.12, 0.04]) { g.moveTo(c * x, 0); g.lineTo(c * (x + 0.08), -c * 0.08); g.moveTo(c * x, 0); g.lineTo(c * (x + 0.08), c * 0.08); }
  g.stroke();
};
function drawLeaves(now, dt) {
  if (reduced || quality === 0) { fallen.length = 0; return; }
  if (!nextLeaf) nextLeaf = now + 1500 + Math.random() * 3000;
  const blow = Math.max(sky.wind, sky.storm * 0.7); // (wind: leaves stream across from the left)
  if (blow > 0.3 && nextLeaf - now > 700) nextLeaf = now + 200; // (the wind gets up: leaves at once)
  if (now > nextLeaf && fallen.length < 3 + Math.round(blow * 9)) {
    nextLeaf = now + (blow > 0.3 ? 250 + Math.random() * 600 : 4500 + Math.random() * 6500);
    const gust = blow > 0.3;
    fallen.push({
      x: gust ? -CELL : SIZE * (0.1 + Math.random() * 0.8), y: gust ? Math.random() * SIZE * 0.9 : -CELL,
      vx: gust ? 160 + Math.random() * 120 : (Math.random() - 0.5) * 30, vy: gust ? 10 + Math.random() * 30 : 26 + Math.random() * 18,
      rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 1.4, ph: Math.random() * TAU, col: LEAVES[Math.floor(Math.random() * LEAVES.length)],
    });
  }
  const st = dt / 1000;
  for (let i = fallen.length - 1; i >= 0; i--) {
    const l = fallen[i], sway = Math.sin(now / 800 + l.ph);
    l.x += (l.vx + sway * 26) * st;
    l.y += l.vy * st;
    l.rot += (l.spin + Math.cos(now / 800 + l.ph) * 0.7) * st;
    if (l.y > SIZE + CELL || l.x < -CELL * 2 || l.x > SIZE + CELL * 2) { fallen.splice(i, 1); continue; }
    shadowAt(l.x + 7, l.y + 10, 1.1);
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rot);
    ctx.scale(1, 0.7 + 0.3 * Math.abs(sway)); // tipping as it sways
    ctx.drawImage(leafSprite(l.col), -SPRITE * CELL / 2, -SPRITE * CELL / 2, SPRITE * CELL, SPRITE * CELL);
    ctx.restore();
  }
}

// The static layer is the bark, the scorch marks fire has left, and every
// hole pecked so far (see paintStatic, with the woodpecker).
function resetStatic() {
  if (!sized) { staticLayer = null; holesDrawn = 0; return; } // (built once the board has its real size)
  if (!barkLayer) barkLayer = buildBark();
  if (!staticLayer || staticLayer.width !== barkLayer.width) staticLayer = makeLayer(barkLayer.width, barkLayer.height);
  const g = staticLayer.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(barkLayer, 0, 0);
  holesDrawn = 0;
  holeMask.fill(0); // (the holes are painted again, from the first)
  scorchDrawn = 0; scorchMask.fill(0); // (scorch marks are baked again too)
}

// The next round's stretch of log, made ahead: once nothing has been drawn
// for a moment (a card is up, or a nap), its bark and leaf shadows are
// built in idle time, and the GPU is set to draw them then. Starting a
// round just swaps them in (setGame builds them itself if none are ready:
// the first round, or the board resized meanwhile).
let next = null, nextTimer = 0, lastDrawAt = 0; // next: { seed, k, bark, shade }
function wantNext() {
  if (!next && !nextTimer) nextTimer = setTimeout(nextWhenIdle, 400);
}
function nextWhenIdle() {
  nextTimer = 0;
  if (next || !sized) return;
  if (performance.now() - lastDrawAt < 350) return wantNext(); // (a round's being drawn: wait for a card)
  if (window.requestIdleCallback) requestIdleCallback(makeNext, { timeout: 1000 });
  else makeNext();
}
function makeNext() {
  if (next || !sized) return;
  if (performance.now() - lastDrawAt < 350) return wantNext(); // (drawing again meanwhile)
  const seed = 1 + Math.floor(Math.random() * 2147483645);
  next = { seed, k, bark: buildBark(seed), shade: buildShade(seed) };
  try { window.createImageBitmap?.(next.bark).then(b => b.close(), () => {}); } catch { /* it's drawn when it's used instead */ }
}
