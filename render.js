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
window.SnakeRender = (() => {
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

  // -------------------------------------------------------------- sprites

  // Sprites are drawn once per resolution into small canvases centered on
  // their cell, SPRITE cells across, and blitted with one drawImage.
  const SPRITE = 2;
  const sprites = new Map(); // name -> variant (a colour, a label, or '') -> canvas

  function sprite(name, variant, draw) {
    let byVariant = sprites.get(name);
    if (!byVariant) sprites.set(name, byVariant = new Map());
    let s = byVariant.get(variant);
    if (s) return s;
    const size = Math.max(2, Math.round(SPRITE * CELL * k));
    s = makeLayer(size, size);
    const g = s.getContext('2d');
    const scale = size / (SPRITE * CELL);
    g.setTransform(scale, 0, 0, scale, size / 2, size / 2);
    draw(g, variant);
    byVariant.set(variant, s);
    return s;
  }

  // A sprite that isn't rotated, on whole device pixels: never resampled.
  function blitCrisp(s, x, y, alpha) {
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(s, Math.round(x * k + shakeX - s.width / 2), Math.round(y * k + shakeY - s.height / 2));
    ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
    if (alpha !== undefined) ctx.globalAlpha = 1;
  }

  function blit(s, x, y, alpha) {
    const half = SPRITE * CELL / 2;
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.drawImage(s, x - half, y - half, SPRITE * CELL, SPRITE * CELL);
    if (alpha !== undefined) ctx.globalAlpha = 1;
  }

  // (Food sprites have no shadow of their own: it's drawn apart, on the bark,
  // so the food can bob up off it.)
  const shadowSprite = () => sprite('shadow', '', drawShadowBlob);
  const drawShadowBlob = g => {
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(0, 0, CELL * 0.29, CELL * 0.09, 0, 0, TAU); g.fill();
  };
  function shadowAt(x, y, scale) {
    const w = SPRITE * CELL * scale;
    ctx.drawImage(shadowSprite(), x - w / 2, y - w / 2, w, w);
  }

  function drawAppleShape(g, body, leaf = '#15803d') {
    const c = CELL;
    g.fillStyle = body;
    g.beginPath(); g.arc(0, c * 0.04, c * 0.34, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(30,20,8,0.45)';
    g.lineWidth = c * 0.05;
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.beginPath(); g.arc(-c * 0.12, -c * 0.06, c * 0.08, 0, TAU); g.fill();
    g.strokeStyle = '#78350f';
    g.lineWidth = c * 0.07;
    g.beginPath(); g.moveTo(0, -c * 0.22); g.lineTo(c * 0.04, -c * 0.42); g.stroke();
    g.fillStyle = leaf;
    g.beginPath(); g.ellipse(c * 0.17, -c * 0.36, c * 0.14, c * 0.07, -0.5, 0, TAU); g.fill();
  }

  // An apple as it ages (it rots away in the end): fresh; bruised, with brown
  // spots; rotten, brown and wrinkled, its leaf dead. Or baked in a fire:
  // deep red, glazed and split, a little caramel oozing.
  const APPLE_LOOKS = { fresh: ['#84cc16', '#15803d'], bruised: ['#9fb53a', '#4d7c0f'], rotten: ['#8a6a2a', '#78716c'], baked: ['#9a3412', '#57534e'] };
  const drawApple = (g, v) => {
    const [body, leaf] = APPLE_LOOKS[v] || APPLE_LOOKS.fresh, c = CELL;
    drawAppleShape(g, body, leaf);
    if (v === 'bruised' || v === 'rotten') {
      g.fillStyle = v === 'rotten' ? 'rgba(66,38,12,0.6)' : 'rgba(110,66,20,0.5)';
      for (const [x, y, rr] of [[0.1, 0.12, 0.07], [-0.1, 0.18, 0.05], [0.17, -0.02, 0.045]]) { g.beginPath(); g.arc(c * x, c * y, c * rr, 0, TAU); g.fill(); }
    }
    if (v === 'rotten') { // wrinkles
      g.strokeStyle = 'rgba(52,30,10,0.6)';
      g.lineWidth = c * 0.03;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-c * 0.2, -c * 0.02); g.quadraticCurveTo(-c * 0.12, c * 0.06, -c * 0.2, c * 0.14);
      g.moveTo(c * 0.02, c * 0.24); g.quadraticCurveTo(c * 0.1, c * 0.16, c * 0.2, c * 0.22);
      g.stroke();
    }
    if (v === 'baked') { // glazed and split, caramel in the split
      g.strokeStyle = '#fbbf24';
      g.lineWidth = c * 0.05;
      g.lineCap = 'round';
      g.beginPath(); g.moveTo(-c * 0.06, c * 0.02); g.lineTo(c * 0.02, c * 0.12); g.lineTo(-c * 0.02, c * 0.22); g.stroke();
      g.strokeStyle = 'rgba(254,215,170,0.8)';
      g.lineWidth = c * 0.04;
      g.beginPath(); g.arc(0, c * 0.04, c * 0.26, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
    }
  };
  const drawGolden = g => drawAppleShape(g, '#fbbf24');
  const appleSprite = (v = 'fresh') => sprite('apple', v, drawApple);
  const goldenSprite = () => sprite('golden', '', drawGolden);
  const glowSprite = () => sprite('glow', '', drawGlow);
  const drawGlow = g => { // (in Honey: gold means a power)
    const grad = g.createRadialGradient(0, 0, CELL * 0.2, 0, 0, CELL * 0.8);
    grad.addColorStop(0, 'rgba(253,230,138,0.55)');
    grad.addColorStop(1, 'rgba(253,230,138,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(0, 0, CELL * 0.8, 0, TAU); g.fill();
  };
  // A four-point sparkle: the golden apple's non-color cue.
  const starSprite = () => sprite('star', '', drawStar);
  const drawStar = g => {
    g.fillStyle = '#fffbea';
    g.beginPath();
    const r1 = CELL * 0.2, r2 = CELL * 0.05;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU, r = i % 2 ? r2 : r1;
      if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(r, 0);
    }
    g.fill();
  };
  // A golden leaf (on the wind: dashes): a broad ginkgo fan about a cell
  // across, in Honey, inked like every other pickup and lit along its top:
  // nothing like the slim autumn leaves blowing past.
  const goldLeafSprite = () => sprite('goldleaf', '', drawGoldLeaf);
  const drawGoldLeaf = g => {
    const c = CELL;
    const fan = () => {
      g.beginPath();
      g.moveTo(0, c * 0.26); // (the base, where the stalk joins)
      g.quadraticCurveTo(-c * 0.16, c * 0.05, -c * 0.46, -c * 0.1);
      g.quadraticCurveTo(-c * 0.42, -c * 0.42, -c * 0.07, -c * 0.44);
      g.lineTo(0, -c * 0.31); // (the notch in its edge)
      g.lineTo(c * 0.07, -c * 0.44);
      g.quadraticCurveTo(c * 0.42, -c * 0.42, c * 0.46, -c * 0.1);
      g.quadraticCurveTo(c * 0.16, c * 0.05, 0, c * 0.26);
      g.closePath();
    };
    g.strokeStyle = '#3a2614'; // the stalk
    g.lineWidth = c * 0.07;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, c * 0.24); g.quadraticCurveTo(c * 0.02, c * 0.4, c * 0.08, c * 0.48); g.stroke();
    const grad = g.createLinearGradient(0, -c * 0.44, 0, c * 0.26);
    grad.addColorStop(0, '#fffbea'); grad.addColorStop(0.35, '#fde68a'); grad.addColorStop(1, '#d4a017');
    fan();
    g.fillStyle = grad; g.fill();
    g.strokeStyle = 'rgba(180,120,10,0.7)'; // veins, fanning out from the base
    g.lineWidth = c * 0.022;
    g.beginPath();
    for (const a of [-1.05, -0.6, -0.2, 0.2, 0.6, 1.05]) { g.moveTo(0, c * 0.2); g.lineTo(Math.sin(a) * c * 0.4, c * 0.2 - Math.cos(a) * c * 0.56); }
    g.stroke();
    fan();
    g.lineJoin = 'round';
    g.strokeStyle = '#3a2614'; g.lineWidth = c * 0.05; g.stroke();
    g.strokeStyle = '#fffbea'; g.lineWidth = c * 0.03; // (its top edge, catching the light)
    g.beginPath(); g.moveTo(-c * 0.36, -c * 0.24); g.quadraticCurveTo(-c * 0.3, -c * 0.38, -c * 0.1, -c * 0.4); g.stroke();
  };
  // A golden mushroom (in the rain: the edges wrap): the mushroom's shape,
  // its cap in the golden leaf's Honey and inked like it, with white spots
  // (ringed, so they show on the pale gold) and a shine.
  const goldcapSprite = () => sprite('goldcap', '', drawGoldcap);
  const drawGoldcap = g => {
    const c = CELL;
    g.lineJoin = 'round';
    g.strokeStyle = '#3a2614';
    g.lineWidth = c * 0.05;
    g.fillStyle = '#fef3c7';
    g.beginPath();
    if (g.roundRect) g.roundRect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36, c * 0.07); else g.rect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36);
    g.fill(); g.stroke();
    const grad = g.createLinearGradient(0, -c * 0.32, 0, 0);
    grad.addColorStop(0, '#fffbea'); grad.addColorStop(0.35, '#fde68a'); grad.addColorStop(1, '#d4a017');
    g.fillStyle = grad;
    g.beginPath(); g.ellipse(0, 0, c * 0.42, c * 0.32, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffffff';
    g.strokeStyle = 'rgba(180,120,10,0.7)'; // (the leaf's veins)
    g.lineWidth = c * 0.022;
    for (const [x, y, r] of GOLDCAP_SPOTS) { g.beginPath(); g.arc(c * x, c * y, c * r, 0, TAU); g.fill(); g.stroke(); }
    g.strokeStyle = 'rgba(255,251,234,0.85)'; // a shine on the cap
    g.lineWidth = c * 0.04;
    g.lineCap = 'round';
    g.beginPath(); g.arc(0, 0, c * 0.3, Math.PI * 1.2, Math.PI * 1.45); g.stroke();
  };
  const GOLDCAP_SPOTS = [[-0.19, -0.1, 0.06], [0.06, -0.21, 0.06], [0.23, -0.06, 0.05]];
  const mushroomSprite = () => sprite('mushroom', '', drawMushroom);
  const drawMushroom = g => {
    const c = CELL;
    g.fillStyle = '#fef3c7';
    g.beginPath(); // a rounded stem, like every other shape on the board
    if (g.roundRect) g.roundRect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36, c * 0.07); else g.rect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36);
    g.fill();
    g.fillStyle = '#dc2626';
    g.beginPath(); g.ellipse(0, 0, c * 0.4, c * 0.3, 0, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,20,8,0.45)';
    g.lineWidth = c * 0.05;
    g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(-c * 0.18, -c * 0.1, c * 0.06, 0, TAU); g.fill();
    g.beginPath(); g.arc(c * 0.06, -c * 0.2, c * 0.06, 0, TAU); g.fill();
    g.beginPath(); g.arc(c * 0.22, -c * 0.06, c * 0.05, 0, TAU); g.fill();
  };
  // What's left of a snake: it falls to pieces, glossy beads in its own
  // colours and markings (Star's rainbow, Mason's marble, Colonist's
  // strap, a friend's spots), so no two snakes leave the same remains. A light
  // rim and a dark edge keep every bead readable on the bark.
  // variant: 'fill|mark', mark one of '', marble, marble2 (a gold vein), strap, strap2, spots, rings, dots, copy, ghost.
  const beadSprite = v => sprite('bead', v, drawBead);
  const drawBead = (g, v) => {
    const c = CELL, r = c * 0.26, bar = v.indexOf('|'), fill = v.slice(0, bar), mark = v.slice(bar + 1);
    const disc = (x, y, rr) => { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); };
    if (mark === 'ghost') g.globalAlpha = 0.72;
    g.fillStyle = 'rgba(255,244,226,0.5)';
    disc(0, 0, r + c * 0.05);
    g.fillStyle = fill;
    disc(0, 0, r);
    g.strokeStyle = 'rgba(30,20,8,0.5)';
    g.lineWidth = c * 0.03;
    g.stroke();
    g.fillStyle = 'rgba(30,41,59,0.6)';
    if (mark === 'marble' || mark === 'marble2') {
      g.strokeStyle = mark === 'marble2' ? 'rgba(201,162,39,0.85)' : 'rgba(100,116,139,0.6)';
      g.lineWidth = c * 0.03;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-r * 0.7, -r * 0.45); g.quadraticCurveTo(0, r * 0.1, r * 0.75, -r * 0.2);
      g.moveTo(-r * 0.15, r * 0.75); g.quadraticCurveTo(r * 0.05, r * 0.35, r * 0.6, r * 0.45);
      g.stroke();
    } else if (mark === 'strap' || mark === 'strap2') {
      g.strokeStyle = '#fef3c7';
      g.lineWidth = c * 0.07;
      g.beginPath();
      const d = r * 0.7, sg = mark === 'strap' ? 1 : -1;
      g.moveTo(-d, -d * sg); g.lineTo(d, d * sg);
      g.stroke();
    } else if (mark === 'spots' || mark === 'dots') {
      g.fillStyle = 'rgba(58,38,20,0.45)';
      if (mark === 'dots') disc(0, 0, r * 0.32);
      else { disc(-r * 0.38, r * 0.12, r * 0.18); disc(r * 0.38, -r * 0.12, r * 0.18); }
    } else if (mark === 'diamond') {
      g.fillStyle = 'rgba(58,36,8,0.75)';
      g.beginPath(); g.moveTo(0, -r * 0.6); g.lineTo(r * 0.6, 0); g.lineTo(0, r * 0.6); g.lineTo(-r * 0.6, 0); g.closePath(); g.fill();
    } else if (mark === 'rings' || mark === 'copy') {
      g.strokeStyle = mark === 'copy' ? 'rgba(255,255,255,0.75)' : 'rgba(58,38,20,0.5)';
      g.lineWidth = c * 0.04;
      if (mark === 'copy') g.setLineDash([c * 0.07, c * 0.07]);
      g.beginPath(); g.arc(0, 0, r * (mark === 'copy' ? 0.75 : 0.55), 0, TAU); g.stroke();
      g.setLineDash([]);
    }
    g.fillStyle = 'rgba(255,255,255,0.55)'; // the gloss
    g.beginPath(); g.ellipse(-r * 0.32, -r * 0.38, r * 0.3, r * 0.2, -0.6, 0, TAU); g.fill();
  };
  // The Field guide's pictures (beside each rule on its card): one thing,
  // px device pixels square on a canvas of its own, drawn with the board's
  // own sprites; a power as a small glyph in its accent colour inside the
  // gold every power wears; a hole, fire and land on a tile of bark. Made
  // once a kind and size. Kinds: apple, golden, mushroom, goldcap, leaf,
  // beetle, goldbeetle, pellet, roast (a roasted bead), baked (a baked
  // apple), jump, flash, wrap, hole, fire, land, held (a snake holding
  // golden powers: its gold line and a pip of each kind), rests (you, your
  // jump and flash resting: your two half-rings), choke (you spitting your
  // own bead aside), cough (you coughing: mouth shut, puffs of breath),
  // lostflag (a colony's flag falling into its pit), dig (a beetle half
  // sunk in sawdust, digging in), knock (an apple flying out of the
  // woodpecker's mark to the ring where it lands), and the basics (How to
  // play's first rows): basic-win, basic-steer, basic-crash, basic-hunger.
  const guideSprites = new Map(); // kind and size -> canvas
  function guideSprite(kind, px) {
    px = Math.max(8, Math.round(px));
    const key = kind + ' ' + px;
    let c = guideSprites.get(key);
    if (c) return c;
    c = makeLayer(px, px);
    const g = c.getContext('2d'), tile = GUIDE_TILE[kind], s = px / (CELL * (tile ? 2 * tile : 1.2));
    g.setTransform(s, 0, 0, s, px / 2, px / 2); // (the thing's middle in the middle, in the board's units)
    if (tile) barkTile(g, tile * CELL);
    (GUIDE[kind] || GUIDE.apple)(g);
    guideSprites.set(key, c);
    return c;
  }
  const GUIDE_TILE = { hole: 1.5, land: 1.25, fire: 0.95, mushroom: 0.95, held: 1.1, rests: 1.05, choke: 1.15, lostflag: 1.2, cough: 1.15, dig: 0.9, knock: 1.35, 'basic-win': 1.1, 'basic-steer': 1.1, 'basic-crash': 1.1 }; // (on a tile of bark this many cells either side of the middle)
  const COUGH_GUIDE = [[0.74, 0.02, 0.21, 1], [0.97, -0.46, 0.13, 0.75]]; // (the guide's puffs: x, y, radius in cells, and how faint)
  const DIG_SPRAY = [[-0.62, -0.42, 0.045], [0.6, -0.5, 0.04], [0.66, 0.36, 0.05], [-0.5, 0.58, 0.04], [0.05, -0.7, 0.035], [-0.72, 0.1, 0.035]];
  const GUIDE = {
    apple: g => drawApple(g, 'fresh'),
    baked: g => drawApple(g, 'baked'),
    golden: g => { guideGlow(g); drawGolden(g); g.translate(CELL * 0.2, -CELL * 0.22); drawStar(g); },
    mushroom: g => { g.scale(1.2, 1.2); drawHaze(g); g.translate(0, CELL * 0.04); drawMushroom(g); }, // (on bark, as on the log: its cream stem vanished on the card; and the purple haze its rule mentions)
    goldcap: g => { guideGlow(g); g.translate(0, CELL * 0.04); drawGoldcap(g); },
    leaf: g => { guideGlow(g); drawGoldLeaf(g); },
    beetle: g => drawGuideBeetle(g, false),
    goldbeetle: g => { guideGlow(g); drawGuideBeetle(g, true); },
    pellet: g => { g.scale(1.5, 1.5); drawBead(g, '#fb923c|'); },
    roast: g => { g.scale(1.5, 1.5); drawBead(g, ROAST); },
    jump: g => drawPowerGlyph(g, 'jump'),
    flash: g => drawPowerGlyph(g, 'flash'),
    wrap: g => drawPowerGlyph(g, 'wrap'),
    fire: g => { drawFireGlow(g); g.scale(1.3, 1.3); drawFlames(g, '0'); },
    hole: g => { guideCells(GUIDE_HOLE); g.translate(-12 * CELL, -12 * CELL); drawPits(g, guideMask, 0, 0, GRID - 1, GRID - 1); },
    land: g => { guideCells(GUIDE_LAND); g.translate(-12 * CELL, -12 * CELL); paintLand(g, null, guideMask, guideNone, '#2563eb', 0, NO_HOLES); },
    held: g => guideSnake(g, '#2563eb', false, (x, y) => drawPips(x, y, Math.PI, CELL * 0.54, 0, 1, 1, false)),
    rests: g => guideSnake(g, '#4ade80', true, (x, y) => { const rr = CELL * 0.84; restHalf(x, y, rr, -1, 0.6, SKY); restHalf(x, y, rr, 1, 0.3, EMBER); }),
    choke: g => guideSnake(g, '#4ade80', true, x => { // (choking on its own bead: cheeks puffed, the bead spat aside in an arc, a cough of breath)
      const c = CELL;
      g.beginPath();
      for (const sg of SIDES2) { g.moveTo(x + c * 0.56, sg * c * 0.38); g.arc(x + c * 0.4, sg * c * 0.38, c * 0.16, 0, TAU); }
      g.strokeStyle = INK; g.lineWidth = c * 0.04; g.stroke();
      g.fillStyle = '#4ade80'; g.fill();
      for (const sg of SIDES2) { g.fillStyle = '#fffbea'; circle(x + c * 0.16, sg * c * 0.2, c * 0.13); g.fillStyle = INK; circle(x + c * 0.2, sg * c * 0.2, c * 0.07); } // (its eyes again, over its cheeks)
      g.strokeStyle = 'rgba(255,251,234,0.8)'; g.lineWidth = c * 0.045; g.lineCap = 'round'; g.setLineDash([c * 0.07, c * 0.09]);
      g.beginPath(); g.moveTo(x + c * 0.55, c * 0.12); g.quadraticCurveTo(x + c * 1.0, c * 0.02, x + c * 0.8, c * 0.5); g.stroke();
      g.setLineDash(NO_DASH);
      g.save(); g.translate(x + c * 0.78, c * 0.74); drawBead(g, '#4ade80|'); g.restore();
      const px = x + c * 0.8, py = -c * 0.5, r = c * 0.13; // (a puff of a cough)
      g.beginPath();
      for (let j = 0; j < COUGH_PUFF.length; j += 3) { const cx = px + COUGH_PUFF[j] * r, cy = py + COUGH_PUFF[j + 1] * r, cr = COUGH_PUFF[j + 2] * r; g.moveTo(cx + cr, cy); g.arc(cx, cy, cr, 0, TAU); }
      g.strokeStyle = 'rgba(58,38,20,0.6)'; g.lineWidth = c * 0.05; g.stroke();
      g.fillStyle = '#fbf7ec'; g.fill();
    }),
    cough: g => guideSnake(g, '#4ade80', true, x => { // (coughing: its mouth shut, puffs of breath coming out past it)
      const c = CELL;
      g.strokeStyle = INK; g.lineWidth = c * 0.04; g.lineCap = 'round'; // (its mouth, shut)
      g.beginPath(); g.moveTo(x + c * 0.3, c * 0.07); g.quadraticCurveTo(x + c * 0.4, c * 0.02, x + c * 0.47, c * 0.05); g.stroke();
      for (const [px, py, r, a] of COUGH_GUIDE) {
        g.globalAlpha = a;
        g.beginPath();
        for (let j = 0; j < COUGH_PUFF.length; j += 3) { const cx = x + c * px + COUGH_PUFF[j] * c * r, cy = c * py + COUGH_PUFF[j + 1] * c * r, cr = COUGH_PUFF[j + 2] * c * r; g.moveTo(cx + cr, cy); g.arc(cx, cy, cr, 0, TAU); }
        g.strokeStyle = 'rgba(58,38,20,0.6)'; g.lineWidth = c * 0.05; g.stroke();
        g.fillStyle = '#fbf7ec'; g.fill();
      }
      g.globalAlpha = 1;
    }),
    dig: g => { // (a cornered beetle digging in: half sunk in its bore, a collar of sawdust round it, sawdust flying off)
      const c = CELL, was = ctx;
      ctx = g;
      try {
        g.fillStyle = 'rgba(20,10,4,0.8)';
        g.beginPath(); g.ellipse(0, 0, c * 0.36, c * 0.3, 0, 0, TAU); g.fill();
        g.save(); g.scale(0.82, 0.82); drawGuideBeetle(g, false);
        g.fillStyle = 'rgba(20,10,4,0.3)'; g.beginPath(); g.ellipse(0, 0, c * 0.3, c * 0.38, 0, 0, TAU); g.fill();
        g.restore();
        digCollar(0, 0, 0.5, 5);
        g.fillStyle = '#e6cc96'; g.strokeStyle = 'rgba(92,60,28,0.8)'; g.lineWidth = c * 0.025; // (sawdust flying off it)
        for (const [x, y, r] of DIG_SPRAY) { g.beginPath(); g.arc(c * x, c * y, c * r, 0, TAU); g.fill(); g.stroke(); }
      } finally { ctx = was; }
    },
    knock: g => { // (an apple knocked out of the woodpecker's marked patch, flying in an arc to the ring where it lands)
      const c = CELL, px = -1.2 * c, py = 0.05 * c, pw = 1.2 * c, ph = 1.05 * c;
      g.save(); g.translate(px + pw / 2, py + ph / 2); g.scale(1.25, 1.1); drawMark(g); g.restore();
      g.beginPath();
      if (g.roundRect) g.roundRect(px, py, pw, ph, c * 0.32); else g.rect(px, py, pw, ph);
      g.fillStyle = 'rgba(20,8,2,0.4)'; g.fill();
      g.lineWidth = 5; g.strokeStyle = 'rgba(20,8,2,0.75)'; g.stroke();
      g.lineWidth = 2.8; g.strokeStyle = '#fef3c7'; g.stroke();
      const lx = 0.72 * c, ly = 0.62 * c; // (where it lands: a faint ring)
      g.setLineDash(KNOCK_DASH); g.lineCap = 'butt';
      for (const [col, w] of [['rgba(20,10,4,0.7)', 3.4], ['#fef3c7', 1.6]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(lx, ly, c * 0.38, 0, TAU); g.stroke(); }
      g.setLineDash([c * 0.07, c * 0.09]); g.lineCap = 'round'; // (its way through the air)
      g.strokeStyle = 'rgba(255,251,234,0.8)'; g.lineWidth = c * 0.045;
      g.beginPath(); g.moveTo(px + pw / 2, py + ph / 2); g.quadraticCurveTo(0, -1.25 * c, lx, ly - c * 0.1); g.stroke();
      g.setLineDash(NO_DASH);
      g.save(); g.translate(0.08 * c, -0.48 * c); g.rotate(0.35); g.scale(0.9, 0.9); drawApple(g, 'fresh'); g.restore();
    },
    lostflag: g => { // (a colony lost to the woodpecker: its flag tipping into the pit pecked out under it)
      guideCells(GUIDE_PIT); g.save(); g.translate(-12.5 * CELL, -12.5 * CELL); drawPits(g, guideMask, 0, 0, GRID - 1, GRID - 1); g.restore();
      const was = ctx;
      ctx = g;
      try { g.translate(-CELL * 0.2, CELL * 0.25); g.rotate(0.5); g.scale(0.8, 0.8); g.translate(0, -CELL * 0.6); flagPole(0, 0); drawFlag(1.5, -CELL * 0.92, 0, 0, 'blue'); } finally { ctx = was; }
    },
    // The basics (How to play's first rows): your snake, the last one
    // wriggling, in the win's confetti; your head with a turn ahead of it;
    // your head dazed by a crash, its stars going round, as on the log; and
    // a tag's hunger bar, running low.
    'basic-win': g => guideSnake(g, '#4ade80', true, (x, y) => {
      for (let i = 0; i < 7; i++) {
        const a = -2.75 + i * 0.78, r = CELL * (0.74 + (i % 2) * 0.2);
        g.save();
        g.translate(x - CELL * 0.15 + Math.cos(a) * r, y + Math.sin(a) * r * 0.95);
        g.rotate(i * 1.3);
        g.fillStyle = CONFETTI[i % CONFETTI.length];
        g.fillRect(-CELL * 0.1, -CELL * 0.055, CELL * 0.2, CELL * 0.11);
        g.restore();
      }
    }),
    'basic-steer': g => guideSnake(g, '#4ade80', true, (x, y) => {
      const ax = x + CELL * 0.78, top = y - CELL * 0.62;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      for (const [w, ink] of [[CELL * 0.22, INK], [CELL * 0.11, '#fffbea']]) { // (inked, then cream: the turn it's about to take)
        g.strokeStyle = ink;
        g.lineWidth = w;
        g.beginPath(); g.moveTo(x + CELL * 0.5, y); g.quadraticCurveTo(ax, y, ax, top); g.stroke();
        g.fillStyle = ink;
        const h = w * 1.45;
        g.beginPath(); g.moveTo(ax, top - h * 0.9); g.lineTo(ax - h, top + h * 0.35); g.lineTo(ax + h, top + h * 0.35); g.closePath(); g.fill();
      }
    }),
    'basic-crash': g => guideSnake(g, '#4ade80', true, (x, y) => {
      ctx.fillStyle = '#fffbea';
      ctx.strokeStyle = 'rgba(58,38,20,0.85)';
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) {
        const a2 = 0.5 + i * TAU / 3;
        star(x + Math.cos(a2) * CELL * 0.55, y - CELL * 0.72 + Math.sin(a2) * CELL * 0.18, CELL * 0.22);
        ctx.stroke();
      }
    }),
    'basic-hunger': g => { // (a name tag, in parchment on the dark page: your dot, your name, and its bar along the bottom)
      const w = CELL * 1.12, h = CELL * 0.6, r = CELL * 0.14;
      const pill = () => { g.beginPath(); if (g.roundRect) g.roundRect(-w / 2, -h / 2, w, h, r); else g.rect(-w / 2, -h / 2, w, h); };
      g.fillStyle = '#2b1c10';
      pill(); g.fill();
      g.save(); g.translate(0, -CELL * 0.03); g.scale(0.94, 0.88); g.fillStyle = '#f6ecd2'; pill(); g.fill(); g.restore();
      g.fillStyle = '#4ade80';
      g.beginPath(); g.arc(-w / 2 + CELL * 0.2, -CELL * 0.07, CELL * 0.1, 0, TAU); g.fill();
      g.fillStyle = 'rgba(58,38,20,0.55)';
      g.beginPath(); if (g.roundRect) g.roundRect(-w / 2 + CELL * 0.37, -CELL * 0.12, CELL * 0.52, CELL * 0.1, CELL * 0.05); else g.rect(-w / 2 + CELL * 0.37, -CELL * 0.12, CELL * 0.52, CELL * 0.1); g.fill();
      const bx = -w / 2 + CELL * 0.14, bw = w - CELL * 0.28, by = CELL * 0.1, bh = CELL * 0.09;
      g.fillStyle = 'rgba(58,38,20,0.18)';
      g.beginPath(); if (g.roundRect) g.roundRect(bx, by, bw, bh, bh / 2); else g.rect(bx, by, bw, bh); g.fill();
      g.fillStyle = '#4d7c0f';
      g.beginPath(); if (g.roundRect) g.roundRect(bx, by, bw * 0.3, bh, bh / 2); else g.rect(bx, by, bw * 0.3, bh); g.fill();
    },
  };
  // A guide's snake: its head and neck heading right on the tile, in the
  // board's own shapes (drawn on the guide's canvas for the moment): a
  // rival's in its colour (gold round it: it holds golden powers), or yours
  // in your cream outline; then marks(x, y) round its head.
  function guideSnake(g, color, you, marks) {
    const was = ctx;
    ctx = g;
    try {
      const hx = you ? 0 : CELL * 0.2, a = { n: 3, pts: new Float32Array([hx, 0, hx - CELL, 0, hx - 2 * CELL, 0]), cor: new Float32Array([hx - CELL * 0.5, 0, hx - CELL * 1.5, 0]), rad: new Float32Array([CELL * 0.54, CELL * 0.44, CELL * 0.39]) };
      if (!you) { g.fillStyle = INK; bodyFills(a, GOLD_EDGE); g.fillStyle = HONEY; bodyFills(a, 2.5); }
      else { g.fillStyle = '#fffef8'; bodyFills(a, 3.5); }
      g.fillStyle = color;
      bodyFills(a, 0);
      g.fillStyle = 'rgba(255,255,255,0.18)'; // (each segment's sheen)
      for (let i = 0; i < 3; i++) circle(a.pts[2 * i] - a.rad[i] * 0.3, -a.rad[i] * 0.3, a.rad[i] * 0.32);
      for (const sg of SIDES2) { // (its eyes, ahead)
        g.fillStyle = '#fffbea'; circle(hx + CELL * 0.16, sg * CELL * 0.2, CELL * 0.13);
        g.fillStyle = INK; circle(hx + CELL * 0.2, sg * CELL * 0.2, CELL * 0.07);
      }
      marks(hx, 0);
    } finally { ctx = was; }
  }
  const guideGlow = g => { g.save(); g.scale(0.72, 0.72); drawGlow(g); g.restore(); }; // (a power's glow, all of it inside the picture)
  // The cells of the guide's hole (an L, in the middle of a board) and its land (a staircase across it).
  const GUIDE_HOLE = [[11, 11], [12, 11], [11, 12]], GUIDE_PIT = [[12, 12]], GUIDE_LAND = [];
  for (let y = 9; y < 16; y++) for (let x = 9; x < 16; x++) if (x + y >= 24) GUIDE_LAND.push([x, y]);
  const guideMask = new Uint8Array(GRID * GRID), guideNone = new Uint8Array(GRID * GRID), NO_HOLES = new Set();
  function guideCells(cells) {
    guideMask.fill(0);
    for (const [x, y] of cells) guideMask[y * GRID + x] = 1;
  }
  // A rounded tile of bark, `half` units either side of the middle (clipped to: the rest goes on it).
  function barkTile(g, half) {
    g.beginPath();
    if (g.roundRect) g.roundRect(-half, -half, 2 * half, 2 * half, half * 0.25); else g.rect(-half, -half, 2 * half, 2 * half);
    g.fillStyle = BARK;
    g.fill();
    g.clip();
    g.lineCap = 'round';
    for (let i = 0; i < 9; i++) { // (a few furrows along the grain)
      const x = -half + (i + 0.5) * 2 * half / 9 + (noise(i, 1, 30) - 0.5) * 6;
      g.strokeStyle = i % 2 ? 'rgba(28,16,6,0.3)' : 'rgba(150,108,66,0.18)';
      g.lineWidth = 2 + noise(i, 2, 30) * 4;
      g.beginPath(); g.moveTo(x, -half); g.quadraticCurveTo(x + (noise(i, 3, 30) - 0.5) * 8, 0, x, half); g.stroke();
    }
  }
  // A beetle, standing still and heading up, as drawBeetle draws it between steps (a golden one in Honey).
  const drawGuideBeetle = (g, gold) => {
    const c = CELL;
    g.save();
    g.rotate(-Math.PI / 2);
    g.scale(1.25, 1.25);
    g.strokeStyle = '#1c1917';
    g.lineWidth = c * 0.05;
    g.lineCap = 'round';
    g.beginPath();
    for (let leg = -1; leg <= 1; leg++) {
      const bx = leg * c * 0.12;
      g.moveTo(bx, -c * 0.12); g.lineTo(bx + c * 0.06 * leg, -c * 0.32);
      g.moveTo(bx, c * 0.12); g.lineTo(bx + c * 0.06 * leg, c * 0.32);
    }
    g.moveTo(c * 0.26, -c * 0.04); g.quadraticCurveTo(c * 0.38, -c * 0.06, c * 0.42, -c * 0.18);
    g.moveTo(c * 0.26, c * 0.04); g.quadraticCurveTo(c * 0.38, c * 0.06, c * 0.42, c * 0.18);
    g.stroke();
    g.fillStyle = '#14532d';
    g.beginPath(); g.arc(c * 0.22, 0, c * 0.08, 0, TAU); g.fill();
    let shell = '#059669';
    if (gold) {
      shell = g.createLinearGradient(c * 0.2, 0, -c * 0.24, 0);
      shell.addColorStop(0, '#fffbea'); shell.addColorStop(0.35, '#fde68a'); shell.addColorStop(1, '#d4a017');
    }
    g.lineWidth = c * 0.03;
    for (const sg of SIDES2) {
      g.fillStyle = shell;
      g.strokeStyle = gold ? '#047857' : '#fbbf24';
      g.beginPath(); g.ellipse(-c * 0.02, 0, c * 0.22, c * 0.17, 0, sg < 0 ? Math.PI : 0, sg < 0 ? TAU : Math.PI); g.closePath();
      g.fill(); g.stroke();
    }
    g.fillStyle = gold ? 'rgba(255,255,255,0.7)' : 'rgba(209,250,229,0.55)';
    g.beginPath(); g.arc(c * 0.04, -c * 0.08, c * 0.045, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(6,47,35,0.8)';
    g.beginPath(); g.moveTo(c * 0.18, 0); g.lineTo(-c * 0.23, 0); g.stroke();
    g.restore();
  };
  // A power's glyph: its shape stroked thick in ink, then in the gold every
  // power wears, then in its own accent (sky for the jump, ember for the
  // flash, the gold itself for the wrap), so it reads by its shape too: a
  // hop arc for the jump, a double chevron for the flash, a looped arrow for
  // the wrap.
  const POWER_ACCENT = { jump: '#a8dcf5', flash: '#f7a866', wrap: '#fde68a' };
  const drawPowerGlyph = (g, kind) => {
    const c = CELL;
    const shape = () => {
      g.beginPath();
      if (kind === 'jump') { // up and over, landing beyond
        g.moveTo(-c * 0.36, c * 0.26); g.quadraticCurveTo(-c * 0.06, -c * 0.62, c * 0.3, c * 0.2);
        g.moveTo(c * 0.08, c * 0.12); g.lineTo(c * 0.3, c * 0.2); g.lineTo(c * 0.36, -c * 0.03);
      } else if (kind === 'flash') { // two chevrons, onward
        for (const dx of [-0.2, 0.1]) { g.moveTo(c * (dx - 0.1), -c * 0.26); g.lineTo(c * (dx + 0.14), 0); g.lineTo(c * (dx - 0.1), c * 0.26); }
      } else { // round and back in again
        const end = Math.PI * 1.3, r = c * 0.24, ex = Math.cos(end) * r, ey = Math.sin(end) * r, tx = -Math.sin(end), ty = Math.cos(end), L = c * 0.15, W = c * 0.13;
        g.arc(0, c * 0.02, r, -Math.PI * 0.4, end);
        g.moveTo(ex - L * tx + W * Math.cos(end), c * 0.02 + ey - L * ty + W * Math.sin(end));
        g.lineTo(ex, c * 0.02 + ey);
        g.lineTo(ex - L * tx - W * Math.cos(end), c * 0.02 + ey - L * ty - W * Math.sin(end));
      }
    };
    g.lineCap = g.lineJoin = 'round';
    for (const [col, w] of [['#3a2614', 0.27], [kind === 'wrap' ? '#d4a017' : '#fde68a', 0.19], [POWER_ACCENT[kind], 0.1]]) {
      g.strokeStyle = col;
      g.lineWidth = c * w;
      shape();
      g.stroke();
    }
  };
  // ------------------------------------------------------------ beetles

  // A jewel beetle, drawn live: an emerald shell with a gold rim, six legs and
  // feelers. It steps off and settles into its next cell during the tick it
  // moves (a beetle's walk: step, pause), legs scuttling, and turns smoothly.
  // Between steps it's never quite still: its feelers wave, it breathes, and
  // every few seconds it lifts its wing cases and buzzes, as if about to fly
  // off. Scared, it trembles. It pops in when it comes out. Sent scurrying
  // (nudged aside by a coughing head, knocked aside by the woodpecker), it
  // scurries there. Cornered, it digs in (see digOf).
  //
  // Up to two are out at once, each with its own heading, pop and wing beat:
  // each beetle's look is kept from frame to frame by where it is (where it
  // came from, if it moved this tick), not by its object (a guest online
  // gets fresh ones every tick). bugs: { x, y, ang, at (when it popped out,
  // or 0), t0 (its wings' beat), gold, dig (how far it has sunk, as last
  // drawn), spray (its next spray of sawdust), frame (last drawn) }.
  const bugs = [], bugFor = new Map(); // (bugFor: this frame's beetles -> their looks)
  const bugPops = [], scurries = []; // (this tick's: where one came out, { x, y, tick, at }; one sent scurrying, { x, y, tx, ty, tick })
  let bugFrame = 0;
  function scurryOf(f) {
    for (const k of scurries) if (k.tick === game.tick && k.tx === f.x && k.ty === f.y) return k;
    return null;
  }
  function bugAt(x, y) {
    for (const b of bugs) if (b.frame !== bugFrame && b.x === x && b.y === y) return b;
    return null;
  }
  function trackBugs(now) {
    bugFrame++;
    bugFor.clear();
    for (let pass = 0; pass < 2; pass++) { // (those that moved this tick first, by where they came from; then the rest, by where they are)
      for (const f of game.food) {
        if (f.kind !== 'beetle' || bugFor.has(f)) continue;
        let b = null;
        if (!pass) {
          const k = scurryOf(f);
          if (k) b = bugAt(k.x, k.y);
          else if (f.movedAt === game.tick - 1 && f.px != null) b = bugAt(f.px, f.py);
          if (!b) continue;
        } else {
          b = bugAt(f.x, f.y);
          if (!b) {
            b = { x: f.x, y: f.y, ang: null, at: 0, t0: now - 1700 * bugs.length, gold: false, dig: 0, spray: 0, frame: 0 };
            for (const p of bugPops) if (p.tick === game.tick && p.x === f.x && p.y === f.y) b.at = p.at;
            bugs.push(b);
          }
        }
        b.x = f.x; b.y = f.y; b.gold = !!f.gold; b.frame = bugFrame;
        bugFor.set(f, b);
      }
    }
    for (let i = bugs.length - 1; i >= 0; i--) if (bugs[i].frame !== bugFrame) bugs.splice(i, 1); // (caught, gone down a burrow or flown)
  }
  function drawBeetle(f, alpha, now) {
    const st = bugFor.get(f);
    if (!st) return;
    const sc = scurryOf(f); // (sent scurrying this tick: it scurries there)
    const moved = !!sc || (f.movedAt === game.tick - 1 && f.px != null);
    const e = moved ? alpha * alpha * (3 - 2 * alpha) : 1, fx = sc ? sc.x : f.px, fy = sc ? sc.y : f.py;
    const gx = moved ? fx + (f.x - fx) * e : f.x, gy = moved ? fy + (f.y - fy) * e : f.y;
    let x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2;
    const c = CELL, lively = !reduced, t = now / 1000;
    const walking = moved && lively;
    const pop = st.at ? popOf(now - st.at) : 1;
    if (pop <= 0) return;
    const heading = Math.atan2(f.dir.y, f.dir.x);
    if (st.ang === null || !lively) st.ang = heading;
    else st.ang += Math.atan2(Math.sin(heading - st.ang), Math.cos(heading - st.ang)) * Math.min(1, frameDt / 60);
    const dig = digOf(f, alpha); // (digging in: how far it has sunk)
    st.dig = dig;
    if (lively && (f.scared || dig) && !moved) { x += Math.sin(now / 23) * 0.7; y += Math.cos(now / 31) * 0.7; } // trembling (digging, it's frantic)
    if (dig) { drawDig(st, x, y, dig, now); if (dig >= 1) return; }
    const step = walking ? Math.sin(now / (f.scared ? 28 : 45)) : dig && lively ? Math.sin(now / 30) : 0;
    const cycle = ((now - st.t0) / 1000) % 3.4; // the wing cases lift late in each cycle, if it's not walking (or digging)
    const lift = lively && !walking && !dig && cycle > 2.7 ? Math.sin((cycle - 2.7) / 0.7 * Math.PI) : 0;
    const sunk = 1 - DIG_SHRINK * dig; // (sinking into the bark: smaller, the lower it is)
    if (f.gold) { // a golden beetle glows, and glints now and then
      const w = SPRITE * CELL * pop * (1 + (lively ? 0.12 * Math.sin(t * 4) : 0));
      ctx.globalAlpha = lively ? 0.75 + 0.25 * Math.sin(t * 4) : 0.9;
      ctx.drawImage(glowSprite(), x - w / 2, y - w / 2, w, w);
      ctx.globalAlpha = 1;
      if (lively && Math.random() < 0.06) mote(x + (Math.random() - 0.5) * c, y + (Math.random() - 0.5) * c, 0, -6, 650, 0.3 + Math.random() * 0.3, 1);
    }
    if (dig < 0.5) {
      ctx.fillStyle = dig ? rgba('#000000', 0.3 * (1 - 2 * dig)) : 'rgba(0,0,0,0.3)'; // shadow (down in its bore, none)
      ctx.beginPath();
      ctx.ellipse(x + 2, y + 3, c * 0.38 * pop * sunk, c * 0.3 * pop * sunk, 0, 0, TAU);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(st.ang + step * 0.07);
    const size = 1.35 * pop * sunk * (1 + (lively ? Math.sin(t * 3.1) * 0.02 : 0)); // about an apple's size, so it's easy to spot
    ctx.scale(size, size);
    // Legs: three a side, alternate pairs swinging.
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = c * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let leg = -1; leg <= 1; leg++) {
      const sw = (leg === 0 ? -step : step) * c * 0.06;
      const bx = leg * c * 0.12;
      ctx.moveTo(bx, -c * 0.12); ctx.lineTo(bx + c * 0.06 * leg + sw, -c * 0.32);
      ctx.moveTo(bx, c * 0.12); ctx.lineTo(bx + c * 0.06 * leg - sw, c * 0.32);
    }
    // Feelers, waving (twitching when it's scared).
    const wave = lively ? Math.sin(t * (f.scared ? 15 : 4.5)) * 0.05 : 0;
    ctx.moveTo(c * 0.26, -c * 0.04); ctx.quadraticCurveTo(c * 0.38, -c * (0.06 + wave), c * 0.42, -c * (0.18 - wave));
    ctx.moveTo(c * 0.26, c * 0.04); ctx.quadraticCurveTo(c * 0.38, c * (0.06 - wave), c * 0.42, c * (0.18 + wave));
    ctx.stroke();
    // Head, then (when the wing cases are lifted) the dark body under them and
    // the clear wings unfolding behind, buzzing...
    ctx.fillStyle = '#14532d';
    circle(c * 0.22, 0, c * 0.08);
    if (lift > 0) {
      ctx.fillStyle = '#052e16';
      ctx.beginPath(); ctx.ellipse(-c * 0.04, 0, c * 0.2, c * 0.12, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(240,249,255,0.7)';
      ctx.strokeStyle = 'rgba(148,163,184,0.7)';
      ctx.lineWidth = c * 0.015;
      const buzz = 0.9 + 0.1 * Math.sin(now / 9);
      for (const sg of SIDES2) {
        ctx.beginPath();
        ctx.ellipse(-c * 0.26 * lift, sg * c * 0.14 * lift, c * 0.34 * buzz * lift, c * 0.1, -sg * 0.45 * lift, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
    // ...then the shell: two emerald wing cases with a gold rim, which swing
    // out from the front when it lifts them; the split down the middle and a
    // shine. A golden one's are in Honey, like the golden leaf's and the
    // golden mushroom's (gold means a power), pale at the front and deep at
    // the back, rimmed in emerald.
    ctx.lineWidth = c * 0.03;
    for (const sg of SIDES2) {
      ctx.save();
      if (lift > 0) { ctx.translate(c * 0.16, 0); ctx.rotate(-sg * 0.4 * lift); ctx.translate(-c * 0.16, 0); }
      ctx.fillStyle = f.gold ? honeyShell() : '#059669';
      ctx.strokeStyle = f.gold ? '#047857' : '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(-c * 0.02, 0, c * 0.22, c * 0.17, 0, sg < 0 ? Math.PI : 0, sg < 0 ? TAU : Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (sg < 0) { ctx.fillStyle = f.gold ? 'rgba(255,255,255,0.7)' : 'rgba(209,250,229,0.55)'; circle(c * 0.04, -c * 0.08, c * 0.045); }
      ctx.restore();
    }
    if (!lift) {
      ctx.strokeStyle = 'rgba(6,47,35,0.8)';
      ctx.beginPath();
      ctx.moveTo(c * 0.18, 0); ctx.lineTo(-c * 0.23, 0);
      ctx.stroke();
    }
    if (dig) { // (going down into the dark of its bore)
      ctx.fillStyle = rgba('#140a04', 0.4 * dig);
      ctx.beginPath(); ctx.ellipse(0, 0, c * 0.3, c * 0.24, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    if (dig) digCollar(x, y, dig, st.x * 7 + st.y * 13);
  }

  // A cornered beetle digs in (round six A): it stops where it is and bores
  // into the bark (BEETLE_DIG ticks), frantic, sawdust spraying off it, and
  // sinks into the bark as its time runs out: smaller, darker, a collar of
  // sawdust closing in round it. It can still be caught. Then it's gone,
  // its collar closing over it (see drawDive), and its bore is left a
  // burrow (BURROW_FROM_DIG), freshly bored for a few seconds (see
  // drawFresh): no heap without a burrow. With reduced motion: no spray,
  // and it's drawn sunk part way, still, until it's gone.
  const DIG_SHRINK = 0.45, DIG_STILL = 0.5;
  // How far a digging beetle has sunk (0 if it isn't digging; up to 1).
  function digOf(f, alpha) {
    if (f.digUntil == null || !(f.digUntil >= game.tick)) return 0;
    if (reduced) return DIG_STILL;
    const D = T.BEETLE_DIG || 8, p = Math.max(0, Math.min(1, (game.tick - 1 + alpha - (f.digUntil - D)) / D));
    return Math.max(0.04, Math.min(0.95, p * p * (3 - 2 * p)));
  }
  // Under it: the bore it's making, a dark hollow opening as it goes down;
  // and sawdust spraying off it now and then.
  function drawDig(st, x, y, dig, now) {
    const c = CELL, r = c * (0.18 + 0.2 * Math.min(1, dig * 1.6));
    ctx.fillStyle = 'rgba(20,10,4,0.8)';
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.82, 0, 0, TAU); ctx.fill();
    if (!reduced && now >= st.spray) {
      st.spray = now + 60 + Math.random() * 70;
      spawn(x, y, 2, 120, 360, 1.8, '#e6cc96', '#b07d48');
    }
  }
  // Over it: a collar of the sawdust it's pushing out, heaped round its
  // bore and over its edges, deeper as it sinks (seeded by where it is, so
  // it holds still): lumps run together into a ring, in its shadow, then
  // sawdust, then paler crumbs on top, lit from the upper left.
  const COLLAR_N = 16;
  function digCollar(x, y, dig, seed) {
    const c = CELL, up = Math.min(1, dig * 2.5), ri = c * (0.3 - 0.1 * dig), ro = ri + c * (0.04 + 0.1 * up + 0.04 * dig), rm = (ri + ro) / 2, rl = (ro - ri) / 2;
    for (let pass = 0; pass < 3; pass++) {
      ctx.fillStyle = pass === 0 ? 'rgba(70,42,18,0.8)' : pass === 1 ? '#d7b47a' : '#efdcb0';
      const dx = pass === 0 ? 1 : pass === 1 ? 0 : -0.7, dy = pass === 0 ? 1.3 : pass === 1 ? 0 : -0.9;
      ctx.beginPath();
      for (let i = 0; i < COLLAR_N; i++) {
        if (pass === 2 && noise(seed, i, 43) < 0.45) continue; // (crumbs on top, here and there)
        const a = (i + 0.5 * noise(seed, i, 41)) * TAU / COLLAR_N, r = rm + rl * 0.35 * (noise(seed, i, 44) - 0.5);
        const cr = (pass === 2 ? 0.45 : 1) * (rl * (0.6 + 0.9 * noise(seed, i, 42)) + 0.6), px = x + Math.cos(a) * r + dx, py = y + Math.sin(a) * r * 0.9 + dy;
        ctx.moveTo(px + cr, py); ctx.arc(px, py, cr, 0, TAU);
      }
      ctx.fill();
    }
  }
  // A golden beetle's Honey, front to back: made once, in the shell's own
  // units, so it turns with the beetle (as its shine does).
  let honeyGrad = null;
  function honeyShell() {
    if (!honeyGrad) {
      honeyGrad = ctx.createLinearGradient(CELL * 0.2, 0, -CELL * 0.24, 0);
      honeyGrad.addColorStop(0, '#fffbea'); honeyGrad.addColorStop(0.35, '#fde68a'); honeyGrad.addColorStop(1, '#d4a017');
    }
    return honeyGrad;
  }

  // --------------------------------------------------------- particles

  // A fixed pool: positions, velocities and life in typed arrays, colors as
  // indexes into a small palette, so bursts never allocate.
  const MAX_P = 320;
  const px = new Float32Array(MAX_P), py = new Float32Array(MAX_P);
  const pvx = new Float32Array(MAX_P), pvy = new Float32Array(MAX_P);
  const plife = new Float32Array(MAX_P), pmax = new Float32Array(MAX_P), psize = new Float32Array(MAX_P);
  const pcol = new Uint8Array(MAX_P), pshape = new Uint8Array(MAX_P); // shape: 0 a crumb, 1 a scrap of paper (confetti)
  let pNext = 0, pLive = 0;
  const PCOLORS = ['#a3e635', '#84cc16', '#fde68a', '#fbbf24', '#fffbea', '#dc2626', '#f6ecd2', '#c2410c', '#a16207'];
  const PCOLOR_INDEX = new Map(PCOLORS.map((c, i) => [c, i]));
  const colorIndex = c => {
    let i = PCOLOR_INDEX.get(c);
    if (i === undefined && PCOLORS.length < 255) { i = PCOLORS.length; PCOLORS.push(c); PCOLOR_INDEX.set(c, i); }
    return i ?? 0;
  };

  function spawn(x, y, n, speed, life, size, c1, c2, shape = 0) {
    if (reduced) return;
    const i1 = colorIndex(c1), i2 = colorIndex(c2);
    for (let j = 0; j < n; j++) {
      const i = pNext;
      pNext = (pNext + 1) % MAX_P;
      const a = Math.random() * TAU, v = speed * (0.4 + Math.random() * 0.6);
      px[i] = x; py[i] = y;
      pvx[i] = Math.cos(a) * v; pvy[i] = Math.sin(a) * v - speed * 0.35;
      pmax[i] = plife[i] = life * (0.7 + Math.random() * 0.5);
      psize[i] = size * (0.6 + Math.random() * 0.6);
      pcol[i] = j % 2 ? i1 : i2;
      pshape[i] = shape;
    }
    pLive = Math.min(MAX_P, pLive + n);
  }

  function drawParticles(dt) {
    if (!pLive) return;
    const step = dt / 1000;
    let live = 0;
    for (let c = 0; c < PCOLORS.length; c++) {
      let started = false;
      for (let i = 0; i < MAX_P; i++) {
        if (plife[i] <= 0 || pcol[i] !== c) continue;
        if (!started) { ctx.fillStyle = PCOLORS[c]; started = true; }
        plife[i] -= dt;
        pvy[i] += 900 * step; // a little gravity
        px[i] += pvx[i] * step;
        py[i] += pvy[i] * step;
        const t = Math.max(0, plife[i] / pmax[i]);
        ctx.globalAlpha = t;
        if (pshape[i]) { // a scrap of paper, spinning and turning over as it falls
          pvx[i] *= 0.985; pvy[i] *= 0.97; // (paper floats)
          const sz = psize[i], turn = Math.cos(plife[i] / 70 + i), spin = plife[i] / 260 + i * 1.3;
          const ax = Math.cos(spin) * sz, ay = Math.sin(spin) * sz; // (along the scrap)
          const bx = -Math.sin(spin) * sz * 0.6 * Math.abs(turn), by = Math.cos(spin) * sz * 0.6 * Math.abs(turn); // (across it, thin as it turns edge-on)
          ctx.beginPath();
          ctx.moveTo(px[i] - ax - bx, py[i] - ay - by); ctx.lineTo(px[i] + ax - bx, py[i] + ay - by);
          ctx.lineTo(px[i] + ax + bx, py[i] + ay + by); ctx.lineTo(px[i] - ax + bx, py[i] - ay + by);
          ctx.fill();
          if (turn < 0) { // (its back: paler)
            ctx.globalAlpha = t * 0.45;
            ctx.fillStyle = '#fffbea';
            ctx.fill();
            ctx.fillStyle = PCOLORS[c];
          }
        } else {
          ctx.beginPath();
          ctx.arc(px[i], py[i], psize[i] * (0.5 + 0.5 * t), 0, TAU);
          ctx.fill();
        }
        live++;
      }
    }
    ctx.globalAlpha = 1;
    pLive = live;
  }

  // Floating "+1" / "+3" over your head when you eat, from a tiny pool.
  const MAX_F = 6;
  const fx = new Float32Array(MAX_F), fy = new Float32Array(MAX_F), flife = new Float32Array(MAX_F);
  const ftext = new Array(MAX_F).fill('');
  const FLOAT_FONT = `700 ${Math.round(CELL * 0.72)}px Fredoka, system-ui, sans-serif`;
  const FLOAT_FILL = { 'KO!': '#f87171', 'Crunch!': '#f87171', 'Boom!': '#f87171', 'Fwoosh!': '#fb923c', 'Bonk!': '#fdba74', 'Ouch!': '#fdba74', 'Snip!': '#fffbea', '-1': '#fca5a5', '-2': '#fca5a5', '-3': '#fca5a5' }; // (what you grow, +1 and so on, in Sprout: Honey by your head means a power)
  const GROWN = ['', '+1', '+2', '+3', '+4', '+5']; // (what a bite was worth, without building a string)
  const FLOAT_TOP = CELL * 1.3, FLOAT_LOW = SIZE - CELL * 0.5; // (a word starts between these, so it can rise and stay on the board)
  const drawFloat = (g, text) => {
    const muted = text[0] === '~', word = muted ? text.slice(1) : text;
    g.font = FLOAT_FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = CELL * 0.14;
    g.strokeStyle = muted ? 'rgba(58,38,20,0.55)' : 'rgba(58,38,20,0.85)';
    g.strokeText(word, 0, 0);
    g.fillStyle = muted ? '#d9c9a3' : FLOAT_FILL[word] || '#a3e635'; // (muted: Parchment, not Sprout)
    g.fillText(word, 0, 0);
  };
  // A word's sprite: two cells tall like any other, and as wide as the word
  // needs (a long word used to shrink to fit, which left a death's Crunch!
  // smaller than the Bonk! you survive). Drawn once per resolution.
  const floatHalf = new Map(); // word -> half its width with its ink edge, in units
  let measureG = null; // (a tiny canvas's context, for measuring a word before its sprite is made)
  function floatSprite(text) {
    let byText = sprites.get('float');
    if (!byText) sprites.set('float', byText = new Map());
    let s = byText.get(text);
    if (s) return s;
    if (!measureG) measureG = makeLayer(1, 1).getContext('2d');
    measureG.font = FLOAT_FONT;
    const w = measureG.measureText(text[0] === '~' ? text.slice(1) : text).width + CELL * 0.3, span = Math.max(SPRITE * CELL, w); // (room for its ink edge)
    floatHalf.set(text, w / 2);
    s = makeLayer(Math.max(2, Math.round(span * k)), Math.max(2, Math.round(SPRITE * CELL * k)));
    const g = s.getContext('2d');
    g.setTransform(s.width / span, 0, 0, s.height / (SPRITE * CELL), s.width / 2, s.height / 2);
    drawFloat(g, text);
    byText.set(text, s);
    return s;
  }
  // Half a word's width, as it's kept inside the board (its sprite made, if it isn't yet).
  const floatHalfOf = text => { floatSprite(text); return Math.max(CELL * (text.length > 3 ? 1.15 : 0.7), floatHalf.get(text)); };
  let fNext = 0;
  function floater(x, y, text) {
    const half = floatHalfOf(text); // (kept inside the board, words and all)
    fx[fNext] = Math.min(SIZE - half, Math.max(half, x)); fy[fNext] = y; flife[fNext] = T.FLOAT_MS; ftext[fNext] = text;
    fNext = (fNext + 1) % MAX_F;
  }
  function drawFloaters(dt) {
    let any = false;
    for (let i = 0; i < MAX_F; i++) if (flife[i] > 0) { any = true; break; }
    if (!any) return;
    for (let i = 0; i < MAX_F; i++) {
      if (flife[i] <= 0) continue;
      flife[i] -= dt;
      const t = Math.max(0, flife[i] / T.FLOAT_MS);
      const y = fy[i] - (reduced ? 0 : (1 - t) * CELL * 0.8); // rises, unless motion is reduced
      const sp = floatSprite(ftext[i]);
      if (reduced || t < 0.86) blitCrisp(sp, fx[i], y, Math.min(1, t * 1.6));
      else { // ...after popping in, from big
        const grow = (1 + (t - 0.86) / 0.14 * 0.7) / k, w = sp.width * grow, h = sp.height * grow;
        ctx.drawImage(sp, fx[i] - w / 2, y - h / 2, w, h);
      }
    }
  }

  // ----------------------------------------------- per-snake animation state

  // Blink, tongue, gaze and gulps live outside the game state; they're purely visual.
  const anim = new WeakMap();
  function animOf(s, now) {
    let a = anim.get(s);
    if (!a) {
      a = {
        nextBlink: now + T.BLINK_MIN + Math.random() * (T.BLINK_MAX - T.BLINK_MIN), blinkUntil: 0,
        nextTongue: now + T.TONGUE_EVERY * (0.5 + Math.random()), tongueUntil: 0, tongueMs: T.TONGUE_MS,
        gx: s.dir.x, gy: s.dir.y, near: 99, // where the eyes point (on the screen, eased), and how far that is
        wx: 0, wy: 0, wanderAt: 0,          // Wildcard's eyes wander about on their own
        gulps: [-99, -99, -99, -99], gulpAt: 0,
        gulpR: T.GULP, gulpW: T.GULP_LENGTH, ateAt: -1e9, // gulp size and length (Gobbler's are bigger), last bite
        // This frame's layout (see prepare): segment centres, the corner each
        // band bends through, radii and fills, sized for the body as it grows.
        n: 0, pts: new Float32Array(64), cor: new Float32Array(64), rad: new Float32Array(32), fills: new Array(32),
        offs: null, offList: [], offPool: [], // (where it's drawn across a wrapped edge, if it is: see unwrap)
        look: '', color: '', isPlayer: false, rim: false, bump: 0, tickPos: 0, lean: 0,
        // Drawn ahead (see predict): the cell its head goes to next (mx, my),
        // whether it moves (mv), grows (mg) or leaps (ml), how many cells
        // further a flash takes it (mf) and which way (mdx, mdy); the same as
        // the last frame drew them (pTick: that frame's tick), and each
        // segment's easing out of a wrong guess (fix: units, fading; see
        // prepare; fixFast: a flash's guess put right, which goes as fast as
        // a dash). streakTick: the tick its flash was seen coming, and where
        // to (streakX, streakY).
        mx: 0, my: 0, mv: 0, mg: 0, ml: 0, mf: 0, mdx: 0, mdy: 0, pmx: 0, pmy: 0, pmv: 0, pmf: 0, pmdx: 0, pmdy: 0, streakTick: -1, streakX: 0, streakY: 0, pTick: -1, phx: -99, phy: -99, fixFar: false, rise: 0, swell: 0,
        fix: new Float32Array(64), fixOn: false, fixFast: false, tdx: s.dir.x, tdy: s.dir.y, bx: 0, by: 0, drawnAt: -1,
        jc: false, fc: false, flashFx: -1e9, // (your rests: cooling last frame; when your flash came back)
        star: false, turn: 0, face: 0, hue: 0, hueAt: -1, glow: 1, brow: 1, flareAt: -1e9, shedAt: 0, // (Star: its head a star, turned so, its face upright; its rainbow (and Copycat's copy of it); its tell; its tail's twinkles)
        flow: 0, flowW: 0, flowMv: 0, flowTick: -1, flowAt: -1, bursts: 0, burstAt: -1e9, // (how far it has gone, for its rainbow's stream: see flowOf; its flashes' bursts of it)
        // Up in the air and over holes (see liftOf and sinkOf): each segment's
        // lift (0..1, the top of a jump 1) and how far it hangs over a pit
        // (0..1) and sinks into it; its jumps, while their arch lasts; when it
        // last came down (its squash).
        lift: new Float32Array(32), hang: new Float32Array(32), sink: new Float32Array(32), lifted: false, bridging: false, liftSw: T.LEAP_SWELL,
        hops: [], holeTick: -1, holeGame: null, nearHole: false, landAt: -1e9, squash: 0,
        chokeAt: -1e9, coughFrom: 0, coughing: false, // (when it choked on its own bead; when its cough began, as this screen saw it)
      };
      anim.set(s, a);
    }
    return a;
  }

  // ------------------------------------------------------------ looks

  // The look a snake is drawn with right now (Capricious borrows its mood's).
  function lookOf(s) {
    if (!s.persona) return 'player';
    if (s.persona.look === 'capricious' && s.memory.mood) return PERSONAS[s.memory.mood].look;
    return s.persona.look;
  }

  // Current body color, for personas whose color changes during a round.
  function colorOf(s) {
    if (!s.persona) return s.color;
    if (s.personaKey === 'mute') return muteShown.get(s) || s.color;
    if (s.personaKey === 'capricious' && s.memory.mood) return PERSONAS[s.memory.mood].color;
    if (s.personaKey === 'copycat' && game) {
      const model = findById(s.memory.modelId);
      if (model && model.alive && lookOf(model) === 'star') return COPY_STAR; // (its body's a pale rainbow: see fillsOf)
      if (model && model.alive) return mix(model.personaKey === 'capricious' ? colorOf(model) : model.color, '#ffffff', 0.45);
    }
    return s.color;
  }
  // Copycat copying Star, as one colour (its body is a pale copy of Star's
  // rainbow): the rainbow's violet end, paled as its copy is. Not the tint of
  // Star's stand-in colour in text, a pale gold that read as a power.
  const COPY_STAR = '#d19df7'; // (paleRainbowOf(275)[0])

  // Mute is a mood ring: its colour follows how it feels, from what anyone
  // can see on the board. Stunned: dazed grey. Just made a kill: proud
  // orchid. Hemmed in, or a rival's head close: a pale lilac with fright. Its
  // victim close: deep plum (closing the box). Stalking someone: deep violet.
  // Otherwise calm lavender. It changes over a moment, in a few steps. (The
  // moods keep to violets and magentas no other rival wears: as rose it
  // passed for Sniper or Colonist, white for Ghost, pink for Capricious. And
  // they're spread in lightness as well as hue, so they read on the bark at
  // a glance: dark for a hunt, light for a feeling, palest for fear.)
  const MUTE_MOODS = { calm: '#c084fc', stalking: '#5b21b6', closing: '#86198f', scared: '#ddd6fe', proud: '#e879f9', dazed: '#9ca3af' };
  const muteState = new WeakMap(), muteShown = new WeakMap(); // snake -> { from, to, at, key }; snake -> the colour now
  const MUTE_FADE = 400; // (ms from one mood's colour to the next)
  // ...and its face says it too: the brows (outer end, arch, inner end, along
  // the head: more negative is higher) and, unless it's biting, the mouth.
  const MUTE_BROWS = { calm: [0.05, -0.04, 0.04], stalking: [0.0, 0.03, 0.11], closing: [-0.03, 0.06, 0.15], scared: [0.09, 0.0, -0.05], proud: [0.03, -0.02, 0.07], dazed: [0.07, 0.07, 0.07] };
  function muteMood(s) {
    if (s.stunUntil >= game.tick) return 'dazed'; // (until it moves again, as the stars: see drawBody)
    for (const o of game.snakes) if (!o.alive && o.killerId === s.id && o.killer !== 'self' && game.tick - (o.diedAt ?? -99) < 30) return 'proud';
    const h = s.body[0];
    let shut = 0, near = false;
    for (let d = 0; d < 4; d++) {
      const x = h.x + SIDES[2 * d], y = h.y + SIDES[2 * d + 1];
      if (x < 0 || y < 0 || x >= GRID || y >= GRID || game.holes.has(y * GRID + x) || bodyAt(x, y)) shut++;
    }
    for (const o of game.snakes) if (o !== s && o.alive && Math.abs(o.body[0].x - h.x) + Math.abs(o.body[0].y - h.y) <= 2) near = true;
    if (shut >= 3 || near) return 'scared';
    const v = findById(s.memory.victimId);
    if (v && v.alive) return Math.abs(v.body[0].x - h.x) + Math.abs(v.body[0].y - h.y) <= 4 ? 'closing' : 'stalking';
    return 'calm';
  }
  const SIDES = [1, 0, -1, 0, 0, 1, 0, -1];
  // Is any living snake's body on (x, y)?
  function bodyAt(x, y) {
    for (const o of game.snakes) {
      if (!o.alive) continue;
      for (const c of o.body) if (c.x === x && c.y === y) return true;
    }
    return false;
  }
  // Its colour is always a step of the way from one mood to another (a few
  // dozen colours in all, each a cached colour ramp). A change of mood part
  // way through a fade starts from whichever mood it was nearer (back to the
  // one it came from, it just turns round), never from the step on show: that
  // made a new colour, and a new ramp kept for good, nearly every time.
  function updateMute(s, now) {
    const key = muteMood(s), mood = MUTE_MOODS[key];
    let m = muteState.get(s);
    if (!m) muteState.set(s, m = { from: mood, to: mood, at: -1e9 });
    m.key = key;
    if (mood !== m.to) {
      const k = reduced ? 1 : Math.min(1, (now - m.at) / MUTE_FADE);
      if (mood === m.from) { m.from = m.to; m.at = now - (1 - k) * MUTE_FADE; } // (turning round, from the step it's on)
      else { if (k >= 0.5) m.from = m.to; m.at = now; }
      m.to = mood;
    }
    const k = reduced ? 1 : Math.min(1, (now - m.at) / MUTE_FADE);
    muteShown.set(s, mix(m.from, m.to, Math.round(k * 6) / 6)); // (in steps: each a cached colour ramp)
  }

  function findById(id) {
    if (id == null || !game) return null;
    for (const o of game.snakes) if (o.id === id) return o;
    return null;
  }

  // ------------------------------------------------------------ the gaze

  // What a snake is looking at: a cell, or null for straight ahead. Each rival
  // looks at what it cares about, read from its memory (purely for show: what
  // it draws never changes how anyone plays), so you can read who's hunting whom.
  const spot = { x: 0, y: 0 };
  function focusOf(s, look, a, now) {
    const m = s.memory;
    switch (look) {
      case 'player': case 'gobbler': return nearest(s, 'food');
      case 'drab': return nearest(s, 'food'); // a lazy look at lunch
      case 'sniper': case 'sovereign': case 'mute': return headOf(m.victimId) || nearest(s, 'head');
      case 'colonist': return headOf(m.victimId) || m.site || nearest(s, 'head');
      case 'vulture': return headOf(m.lureId) || nearest(s, 'head');
      case 'copycat': return headOf(m.modelId) || nearest(s, 'head');
      case 'creeper': return nearest(s, 'tail') || nearest(s, 'head');
      case 'mason': return nearest(s, 'head'); // keeping an eye on whoever's near the wall
      case 'ghost': case 'metagamer': case 'desperado': case 'joker': return nearest(s, 'head');
      case 'star': return nearest(s, 'gold') || nearest(s, 'head'); // (it craves golden powers above everything)
      case 'wildcard': // looks wherever, changing its mind every second or two
        if (now > a.wanderAt) {
          a.wanderAt = now + 900 + Math.random() * 1600;
          a.wx = Math.floor(Math.random() * GRID);
          a.wy = Math.floor(Math.random() * GRID);
        }
        spot.x = a.wx; spot.y = a.wy;
        return spot;
      default: return nearest(s, 'head');
    }
  }

  function headOf(id) {
    const o = findById(id);
    return o && o.alive ? o.body[0] : null;
  }

  // The nearest food (not mushrooms), golden power (a golden beetle, a
  // golden leaf or a golden mushroom), rival head, or long rival's tail.
  // Every snake's eyes follow something, so no face ever just stares ahead.
  function nearest(s, what) {
    const h = s.body[0];
    let best = 1e9, out = null;
    if (what === 'food' || what === 'gold') {
      for (const f of game.food) {
        if (f.kind === 'mushroom' || (what === 'gold' && !(f.kind === 'leaf' || f.kind === 'goldcap' || (f.kind === 'beetle' && f.gold)))) continue;
        const d = (f.x - h.x) * (f.x - h.x) + (f.y - h.y) * (f.y - h.y);
        if (d > 0 && d < best) { best = d; out = f; }
      }
    } else {
      for (const o of game.snakes) {
        if (o === s || !o.alive) continue;
        const c = what === 'head' ? o.body[0] : o.body.length >= 8 ? o.body[o.body.length - 1] : null;
        if (!c) continue;
        const d = (c.x - h.x) * (c.x - h.x) + (c.y - h.y) * (c.y - h.y);
        if (d > 0 && d < best) { best = d; out = c; }
      }
    }
    return out;
  }

  // Turn the eyes toward the focus (eased on the screen, so a turn of the
  // head doesn't swing them, and at the same speed at any frame rate).
  // With a turn pressed that hasn't shown yet (or, stunned, a jump or a
  // flash asked for), they look the way it'll go instead, quickly: it's
  // your press, answered.
  function updateGaze(s, look, a, now) {
    const q = game ? queuedOf(s, a) : null, f = game && !q ? focusOf(s, look, a, now) : null;
    let tx = a.tdx, ty = a.tdy; // nothing to look at: straight ahead
    if (q) { tx = q.x; ty = q.y; }
    else if (f) {
      const h = s.body[0], dx = f.x - h.x, dy = f.y - h.y;
      const len = Math.hypot(dx, dy) || 1;
      a.near = len;
      tx = dx / len; ty = dy / len;
    } else a.near = 99;
    const ease = 1 - Math.pow(1 - (q ? 0.5 : T.GLANCE_EASE), frameDt / 16.7);
    a.gx += (tx - a.gx) * ease;
    a.gy += (ty - a.gy) * ease;
  }

  // The mouth: open when food is right in front, then a couple of chews after a bite.
  let deadNow = false; // the snake being drawn has just died: mouth shut
  let frameDt = 16;     // this frame's length, for easing
  // Choked on its own bead, it coughs for a moment and eats nothing (the
  // engine's s.coughUntil, synced to guests): its mouth stays shut, and no
  // tongue or gag comes out (see drawCough for its puffs).
  const coughing = s => !!game && s.coughUntil > game.tick;
  // Choking, drawn: as it gags its cheeks puff out for a moment (gagCheeks),
  // and while it coughs, a cough every COUGH_BEAT, each a little puff of
  // breath out past its shut mouth (drawCough), growing and fading as it
  // drifts off (with reduced motion, staying put as it fades), its head
  // jolting (see prepare). The bead it spat flies off in a little arc (see
  // moveFood). How far through its cough's beat it is (-1 before the first).
  // (Made to read at arm's length on a phone, where the first puff was a
  // speck of 3 to 6 px and the jolt under a pixel: the puff 0.14 to 0.28 of
  // a cell, holding its white longer; the head swelling 15% and lurching a
  // tenth of a cell forward over the first third of each beat.)
  const GAG_MS = 280, COUGH_FIRST = 160, COUGH_BEAT = 300, COUGH_JOLT = 0.3, COUGH_SWELL = 0.15, COUGH_LURCH = 0.1;
  function coughPhase(a, now) {
    const t = now - a.coughFrom - COUGH_FIRST;
    return t < 0 ? -1 : (t % COUGH_BEAT) / COUGH_BEAT;
  }
  // (In the face's frame, before its face: its cheeks, in the head's own
  // colour and inked, out either side behind its mouth; a star's out past
  // its mustache. Puffed up fast and down slower; with reduced motion,
  // simply puffed while it lasts.)
  function gagCheeks(a, col, now) {
    const t = (now - a.chokeAt) / GAG_MS;
    if (t < 0 || t >= 1) return;
    const c = CELL, puff = reduced ? 1 : t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7, r = c * (0.1 + 0.12 * puff), x = c * (a.star ? 0.04 : 0.34), y = c * (a.star ? 0.44 : 0.33 + 0.06 * puff);
    ctx.beginPath();
    for (const sg of SIDES2) { ctx.moveTo(x + r, sg * y); ctx.arc(x, sg * y, r, 0, TAU); }
    ctx.strokeStyle = INK;
    ctx.lineWidth = c * 0.04;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.fill();
  }
  // (In the face's frame, after its face: a puff of breath, a little cloud
  // of three rounds, out past its mouth, inked lightly so it reads on the bark.)
  const COUGH_PUFF = [0, 0, 1, -0.55, 0.5, 0.62, -0.55, -0.5, 0.62]; // (each round: x, y, radius, in the puff's radius)
  function drawCough(a, now) {
    const ph = coughPhase(a, now);
    if (ph < 0) return;
    const c = CELL, x = c * (0.64 + (reduced ? 0 : 0.36 * ph)), r = c * (0.14 + 0.14 * ph), was = ctx.globalAlpha;
    ctx.globalAlpha = was * (1 - ph * ph * ph);
    ctx.beginPath();
    for (let j = 0; j < COUGH_PUFF.length; j += 3) { const px = x + COUGH_PUFF[j] * r, py = COUGH_PUFF[j + 1] * r, pr = COUGH_PUFF[j + 2] * r; ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, TAU); }
    ctx.strokeStyle = 'rgba(58,38,20,0.55)';
    ctx.lineWidth = c * 0.045;
    ctx.stroke();
    ctx.fillStyle = '#fbf7ec';
    ctx.fill();
    ctx.globalAlpha = was;
  }
  function mouthOpen(s, a) {
    if (deadNow || coughing(s)) return 0;
    const t = (lastNow - a.ateAt) / T.CHEW_MS;
    if (t >= 0 && t < 1) return 0.55 * Math.abs(Math.sin(t * Math.PI * 2));
    if (!game) return 0;
    const h = s.body[0];
    if (s.personaKey === 'ouroboros' && s.body.length > 4) { // (its own tail right ahead: it bites it)
      const tl = s.body[s.body.length - 1];
      if ((tl.x - h.x) * s.dir.x + (tl.y - h.y) * s.dir.y === 1 && (tl.x - h.x) * s.dir.y - (tl.y - h.y) * s.dir.x === 0) return 1;
    }
    for (const f of game.food) {
      if (f.kind === 'mushroom' && s.personaKey !== 'ghost') continue;
      const ahead = (f.x - h.x) * s.dir.x + (f.y - h.y) * s.dir.y;
      const side = (f.x - h.x) * s.dir.y - (f.y - h.y) * s.dir.x;
      if (side === 0 && ahead >= 1 && ahead <= 2) return ahead === 1 ? 1 : 0.5;
    }
    return 0;
  }

  // Fades toward the bark as colour ramps: rampOf(c)[p] is c faded p% of the
  // way to the bark. Built once per colour, so no frame builds a colour string.
  const ramps = new Map(), stripes = new Map();
  function rampOf(c) {
    let ramp = ramps.get(c);
    if (!ramp) {
      ramp = new Array(101);
      for (let p = 0; p <= 100; p++) ramp[p] = p ? mix(c, BARK, p / 100) : c;
      ramps.set(c, ramp);
    }
    return ramp;
  }
  // The rainbow (Star's trail; Wildcard's body once, then Mute's): 360 hues
  // round the wheel at one lightness, as #rrggbb, so it fades toward the
  // bark at the tail like any colour. rainbowOf(h)[p] is hue h faded p% of
  // the way to the bark (p up to 30, the cast's fade), made the first time
  // it's needed and kept (it's never more than 360 short ramps, and as many
  // of Copycat's pale copy).
  const HUE_RGB = new Uint8Array(3 * 360), rainbows = new Array(360);
  for (let h = 0; h < 360; h++) { // (hsl(h, 85%, 62%), the old rainbow's)
    const c = (1 - Math.abs(2 * 0.62 - 1)) * 0.85, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = 0.62 - c / 2, s = Math.floor(h / 60);
    const r = s === 0 || s === 5 ? c : s === 1 || s === 4 ? x : 0, g = s === 1 || s === 2 ? c : s === 0 || s === 3 ? x : 0, b = s === 3 || s === 4 ? c : s === 2 || s === 5 ? x : 0;
    HUE_RGB[3 * h] = Math.round((r + m) * 255); HUE_RGB[3 * h + 1] = Math.round((g + m) * 255); HUE_RGB[3 * h + 2] = Math.round((b + m) * 255);
  }
  const RAINBOW_FADE = 30;
  const rainbowOf = h => rainbows[h] || (rainbows[h] = bowRamp(h, 0));
  // Copycat's copy of it (while it copies Star): each hue mixed as far
  // toward white as its tint of anyone else (0.45), so it reads as a copy
  // of Star's rainbow; never one pale gold all over, as the tint of Star's
  // stand-in colour in text was (that read as a power, and hid its gold line).
  const paleRainbows = new Array(360);
  const paleRainbowOf = h => paleRainbows[h] || (paleRainbows[h] = bowRamp(h, 0.45));
  function bowRamp(h, pale) {
    const ramp = new Array(RAINBOW_FADE + 1), bark = parseInt(BARK.slice(1), 16);
    for (let p = 0; p <= RAINBOW_FADE; p++) {
      const ch = (j, sh) => Math.round((HUE_RGB[3 * h + j] * (1 - pale) + 255 * pale) * (1 - p / 100) + ((bark >> sh) & 255) * p / 100);
      ramp[p] = '#' + ((1 << 24) | (ch(0, 16) << 16) | (ch(1, 8) << 8) | ch(2, 0)).toString(16).slice(1);
    }
    return ramp;
  }
  // The rainbow a snake wears, if any (its ramps, by hue): Star's own, or
  // Copycat's pale copy while its model is Star; null for anyone else.
  function bowOf(s) {
    if (lookOf(s) === 'star') return rainbowOf;
    if (s.personaKey === 'copycat' && game) {
      const m = findById(s.memory.modelId);
      if (m && m.alive && lookOf(m) === 'star') return paleRainbowOf;
    }
    return null;
  }
  // Where its rainbow's hue is at its head. Its colours stream back along
  // its body as it goes, by how far it has gone (its moves, and the frame's
  // way through the next), at BOW_FLOW times its crawl: so over the log they
  // stream backward behind it, like a trail (at its crawl they'd be painted
  // on the log; slower, they'd creep forward with it), and each segment goes
  // round the rainbow about once a second. Stopped or stunned, they settle
  // with it; a flash bursts them on (BOW_BURST segments' worth, easing out
  // over BOW_BURST_MS). With reduced motion they drift slowly where they are
  // (BOW_DRIFT degrees a second). Copycat's pale copy goes by its model's,
  // in step. Once it's out, they stay where they stopped.
  const BOW_FLOW = 1.25, BOW_BURST = 6, BOW_BURST_MS = 360, BOW_DRIFT = 10;
  function bowHue(s, a, now) {
    if (!s.alive) { if (a.hueAt < 0) a.hueAt = a.hue; return a.hueAt; }
    a.hueAt = -1;
    if (reduced) return a.hue = Math.floor(now / 1000 * BOW_DRIFT) % 360;
    let src = s, sa = a;
    if (lookOf(s) !== 'star') { const m = findById(s.memory.modelId); if (m && m.alive) { src = m; sa = animOf(m, now); } } // (Copycat's copy: its model's)
    const u = (now - sa.burstAt) / BOW_BURST_MS, burst = sa.bursts * BOW_BURST - (u >= 0 && u < 1 ? BOW_BURST * (1 - u) * (1 - u) : 0);
    return a.hue = Math.floor((flowOf(src, sa) * BOW_FLOW + burst) * RAINBOW_STEP) % 360;
  }
  // How far a snake has gone, in cells, as it's drawn this frame: its moves
  // until this tick (a flash's cells and all), and its way through this
  // one's and on toward the next (see prepare: flowK). Counted once a tick.
  function flowOf(s, a) {
    if (a.flowAt === lastNow && lastNow) return a.flow;
    if (game.tick !== a.flowTick) {
      if (a.flowTick >= 0 && game.tick > a.flowTick) a.flowW += a.flowMv * Math.min(4, game.tick - a.flowTick); // (the ticks between, if any were missed, as the last)
      a.flowTick = game.tick;
      const h = s.body[0], p = s.prev?.[0];
      const d = p ? Math.abs(h.x - p.x) + Math.abs(h.y - p.y) : 0;
      a.flowMv = d > GRID / 2 ? 1 : d; // (across a wrapped edge: a cell)
    }
    a.flowAt = lastNow;
    return a.flow = a.flowW + a.flowMv * Math.min(1, flowK) + (a.mv ? Math.max(0, flowK - 1) : 0);
  }
  let flowK = 0; // (the frame's way through the tick, as drawn: see prepare)
  const lumas = new Map();
  function lumaOf(c) {
    let l = lumas.get(c);
    if (l === undefined) { l = c[0] === '#' ? luma(c) : 1; lumas.set(c, l); }
    return l;
  }
  // A backstop, as a round starts: the colour caches keep the cast's own
  // colours (and Mute's moods, and this round's people) and what's mixed from
  // them; anything else (a step of Mute's between two moods, Copycat's tint
  // of its model) is dropped, and made again if it's needed again.
  const keptColours = new Set();
  function trimColours(g) {
    keptColours.clear();
    keptColours.add(BARK);
    for (const key in PERSONAS) keptColours.add(PERSONAS[key].color);
    for (const key in MUTE_MOODS) keptColours.add(MUTE_MOODS[key]);
    for (const s of g.snakes) keptColours.add(s.color);
    for (const c of ramps.keys()) if (!keptColours.has(c)) ramps.delete(c);
    for (const c of lumas.keys()) if (!keptColours.has(c)) lumas.delete(c);
    for (const c of mixCache.keys()) if (!keptColours.has(c)) mixCache.delete(c);
  }

  // Wildcard's segments: a tan face, a white collar, then a blue field of
  // stars (two segments) and red and white stripes from there on.
  const WILD = i => i === 0 ? '#f59a52' : i === 1 ? '#f8fafc' : i < 4 ? '#3c3b6e' : i % 2 ? '#b22234' : '#f8fafc';

  // Every segment's fill: the look's pattern, fading toward the bark at the tail.
  function fillsOf(s, a, now) {
    const { look, color, n, fills } = a;
    if (s.personaKey === 'wildcard') { // the Stars and Stripes, behind an orange tan and a white collar
      for (let i = 0; i < n; i++) fills[i] = WILD(i);
      return;
    }
    const mime = look === 'mute'; // (its mood's colour down the body, behind a white greasepaint face: below)
    if (look === 'joker') {
      for (let i = 0; i < n; i++) fills[i] = i === 0 ? '#f8fafc' : i % 2 ? '#f59e0b' : '#a21caf';
      return;
    }
    const bow = bowOf(s);
    if (bow) { // a rainbow trailing a sunflower star (its head is drawn apart: see drawStarHead), streaming back along it as it goes (see bowHue), fading toward the bark at the tail; or Copycat's pale copy of it
      const h0 = bowHue(s, a, now);
      for (let i = 0; i < n; i++) fills[i] = bow((h0 + 360 - (i * RAINBOW_STEP) % 360) % 360)[n > 1 ? Math.round(RAINBOW_FADE * i / (n - 1)) : 0];
      if (look === 'star') fills[0] = STAR_SUN;
      else if (s.personaKey === 'copycat') fills[0] = s.color; // (its head stays its own: see below)
      return;
    }
    const ramp = rampOf(color);
    let stripe = null;
    if (look === 'sniper') {
      stripe = stripes.get(color);
      if (!stripe) { stripe = rampOf(mix(color, '#fca5a5', 0.35)); stripes.set(color, stripe); }
    }
    for (let i = 0; i < n; i++) {
      const t = i / (n > 1 ? n - 1 : 1); // 0 at the head, 1 at the tail
      // (Ghost and Creeper fade the most, but never so far that you can't see a tail that kills.)
      const fade = look === 'ghost' ? Math.round(55 * t)
        : look === 'creeper' ? Math.round(15 + 30 * t)
        : look === 'drab' ? 15
        : Math.round(30 * t);
      fills[i] = (stripe && i % 3 === 2 ? stripe : ramp)[fade];
    }
    if (look === 'vulture') { fills[0] = '#f9a8d4'; if (n > 1) fills[1] = '#f5f5f4'; } // bald pink head, white neck ruff
    if (look === 'desperado') { if (n > 1) fills[1] = '#dc2626'; for (let i = 4; i < n; i += 4) fills[i] = '#ecdfc3'; } // bandana, poncho stripes (woven cream: Honey means a power)
    if (mime) fills[0] = '#f8fafc';
    // Copycat copying someone: its body wears a pale copy of their colours
    // (it can't help it), but its cat-eared head keeps the flag's red (and
    // its yellow pin: see drawFace), so it always reads as red and gold.
    if (s.personaKey === 'copycat') fills[0] = s.color;
  }

  // Once a frame per snake: where each segment is (between its last two
  // cells, and on toward the next: see predict), the cell each band bends
  // through, radii and fills.
  function prepare(s, alpha, now, dead, impact = 0) {
    const a = animOf(s, now);
    const n = s.body.length;
    a.look = lookOf(s);
    a.star = a.look === 'star'; // (a star for a head, not a circle: its shadow and outlines follow its points)
    if (s.personaKey === 'mute' && !dead) updateMute(s, now);
    a.color = colorOf(s);
    a.isPlayer = !s.persona;
    // A pale rim so dark bodies read on the bark (Joker's amber and white do already).
    a.rim = !a.isPlayer && a.look !== 'joker' && (a.look === 'vulture' || s.personaKey === 'mute' || lumaOf(a.color) < 0.4); // (Mute: always, whatever its mood)
    // How far through its move it's drawn: up to 1, from its last cells to
    // these; past 1, on toward the next (see predict). Not past its cells
    // once it's dead or the round's over (the board rests), nor before the
    // round's first tick. Dashed this tick (a flash): it's there at once, its
    // streak behind it, and goes on gliding from a cell back along its own
    // body, so it never stands still (the cells it skipped are the dash; if
    // the flash was seen coming, it's drawn on from just where it was). One
    // that ran into something at once, or is out, is at its cells.
    const snap = a.dashTick === game?.tick, h0 = s.body[0], p0 = s.prev?.[0];
    const ran = snap && !dead && !!p0 && (p0.x !== h0.x || p0.y !== h0.y);
    let at = alpha + leadNow;
    if (dead || !game || leadRest) at = Math.min(1, at);
    if (snap && !ran) at = Math.max(1, at);
    flowK = at;
    if (dead || !game) { a.mv = 0; a.ml = 0; a.mf = 0; }
    const k1 = Math.min(1, at), k2 = a.mv ? at - k1 : 0;
    const m = k2 > 0 && a.mg ? n + 1 : n; // (growing: its tail stays where it is, a segment more)
    if (a.rad.length < m) {
      a.pts = new Float32Array(4 * m); a.cor = new Float32Array(4 * m);
      a.rad = new Float32Array(2 * m); a.fills = new Array(2 * m);
      a.lift = new Float32Array(2 * m); a.hang = new Float32Array(2 * m); a.sink = new Float32Array(2 * m);
      const fix = new Float32Array(4 * m); fix.set(a.fix); a.fix = fix;
    }
    a.n = m;
    const prev = s.prev, { pts, cor } = a;
    // (A snake that's had the edges wrap this round: its body may run off one
    // edge and on at the other, and a segment may move across one.)
    const wrapped = s.wrapUntil >= 0;
    let behind = s.body[n - 1]; // (dashed: where its tail was a cell back along its body, if it moved)
    if (ran) for (let j = prev.length - 2; j >= 0; j--) if (prev[j].x === behind.x && prev[j].y === behind.y) { behind = prev[j + 1]; break; }
    for (let i = 0; i < n; i++) {
      const c = s.body[i];
      const p = ran ? (i < n - 1 ? s.body[i + 1] : behind) : prev && i < prev.length ? prev[i] : c;
      const px = wrapped ? nearOf(p.x, c.x) : p.x, py = wrapped ? nearOf(p.y, c.y) : p.y;
      let x = px + (c.x - px) * k1, y = py + (c.y - py) * k1;
      // The band to the next segment runs through the cell this one left
      // (where the next one is headed), so a bend never cuts its corner.
      let qx, qy;
      if (k2 > 0 && a.mf) { // (a flash on ahead: from its cell on the flash's way, or its body, to the next)
        along(s, a, i + 1); const fx = wrapped ? nearOf(chX, c.x) : chX, fy = wrapped ? nearOf(chY, c.y) : chY;
        qx = chX; qy = chY;
        along(s, a, i);
        x = fx + ((wrapped ? nearOf(chX, fx) : chX) - fx) * k2;
        y = fy + ((wrapped ? nearOf(chY, fy) : chY) - fy) * k2;
      } else if (k2 > 0) { // (on toward the cell ahead of it: the next one's, or for the head, where it goes next)
        const nx = i ? s.body[i - 1].x : a.mx, ny = i ? s.body[i - 1].y : a.my;
        x += ((wrapped ? nearOf(nx, c.x) : nx) - c.x) * k2;
        y += ((wrapped ? nearOf(ny, c.y) : ny) - c.y) * k2;
        qx = c.x; qy = c.y;
      } else { // (the cell it left; dashed, the bends it lies on now)
        const q = ran ? p : prev && i < prev.length && !snap ? prev[i] : s.body[Math.min(i + 1, n - 1)];
        qx = q.x; qy = q.y;
      }
      pts[2 * i] = x * CELL + CELL / 2;
      pts[2 * i + 1] = y * CELL + CELL / 2;
      if (i < m - 1) {
        cor[2 * i] = qx * CELL + CELL / 2;
        cor[2 * i + 1] = qy * CELL + CELL / 2;
      }
    }
    if (m > n) { pts[2 * n] = cor[2 * n - 2]; pts[2 * n + 1] = cor[2 * n - 1]; } // (the tail end that stays)
    // Its flash, seen coming: its streak now (its flecks once it's gone: see
    // onTick). Seen going another way, or somewhere else, or not going after
    // all (a turn pressed since, say): that streak goes, and the new way gets
    // its own.
    if (a.streakTick === game?.tick && !(k2 > 0 && a.mf && a.streakX === a.mx && a.streakY === a.my)) { unstreak(s); a.streakTick = -1; }
    if (k2 > 0 && a.mf && a.streakTick !== game.tick) { a.streakTick = game.tick; a.streakX = a.mx; a.streakY = a.my; streakOf(s, h0.x, h0.y, a.mx, a.my, !(s.dashes > 0), now, game.tick); }
    if (game) refix(s, a, at, snap, ran ? behind : null);
    if (a.fixOn) for (let i = 0; i < 2 * m; i++) pts[i] += a.fix[i];
    a.bx = pts[0]; a.by = pts[1]; a.drawnAt = lastNow; // (where its head is drawn, for its speech bubble)
    a.offs = wrapped ? unwrap(a, m) : null;
    // The way it's heading as drawn: past its cell's centre, the way it goes next.
    if (k2 > 0 && a.mf) { a.tdx = a.mdx; a.tdy = a.mdy; }
    else if (k2 > 0) { let dx = a.mx - s.body[0].x, dy = a.my - s.body[0].y; if (dx > 1) dx = -1; else if (dx < -1) dx = 1; if (dy > 1) dy = -1; else if (dy < -1) dy = 1; a.tdx = dx; a.tdy = dy; }
    else { a.tdx = s.dir.x; a.tdy = s.dir.y; }
    // The way its face is turned (see steer), settled once a frame, before
    // its shadow and outlines (a star's are its points), and stunned, its
    // wobble. (Out, it stays as it was: a corpse never drawn alive takes the
    // way it went.)
    if (!dead || a.hc === undefined) steer(s, a, now);
    const wobble = !dead && game && s.stunUntil >= game.tick && !reduced ? Math.sin(now / 45) * 0.16 : 0;
    a.turn = Math.atan2(a.hs, a.hc) + wobble;
    if (a.star) a.face = starFace(a) + wobble; // (a star's points turn with it; its face stays upright: see starFace)
    // A held corpse presses its head a little into whatever it hit.
    if (impact) { pts[0] += s.dir.x * CELL * impact; pts[1] += s.dir.y * CELL * impact; }
    // Up in the air: a jump's arch along its body, and over a hole, how far
    // each segment hangs into the pit (see liftOf and sinkOf: they size the
    // segments below, and its shadow: see drawShadows).
    if (!dead && game) liftOf(s, a, at, k2, now);
    else if (a.lifted || a.hops.length) { a.lift.fill(0); a.lifted = false; a.hops.length = 0; a.rise = 0; }
    // Just crashed: the head lunges into what it hit, and bounces back.
    const hit = a.crashAt ? (now - a.crashAt) / 260 : 1;
    if (hit < 1 && hit >= 0 && !dead && !reduced) { const l = Math.sin(hit * Math.PI) * 0.34; pts[0] += a.crashDx * CELL * l; pts[1] += a.crashDy * CELL * l; }
    // Gulps: a bulge that travels one segment per tick after each bite, and
    // the head's squash at the bite itself.
    a.tickPos = game ? game.tick - 1 + alpha : 0;
    const bite = (lastNow - a.ateAt) / T.BITE_MS;
    a.bump = !dead && bite >= 0 && bite < 1 ? (a.gulpR > T.GULP ? 0.2 : 0.12) * Math.sin(bite * Math.PI) : 0;
    // Choked on its own bead: it coughs a while (see drawCough), its head
    // jolting at each cough. (From the choke, if this screen saw it; a
    // friend's screen may only see the cough.)
    const cough = !dead && coughing(s);
    if (cough && !a.coughing) a.coughFrom = now - a.chokeAt < 500 ? a.chokeAt : now;
    a.coughing = cough;
    if (cough && !reduced) { // (a jolt: its head swells and lurches forward with each cough)
      const ph = coughPhase(a, now);
      if (ph >= 0 && ph < COUGH_JOLT) { const j = Math.sin(ph / COUGH_JOLT * Math.PI); a.bump += COUGH_SWELL * j; pts[0] += a.hc * CELL * COUGH_LURCH * j; pts[1] += a.hs * CELL * COUGH_LURCH * j; }
    }
    for (let i = 0; i < m; i++) a.rad[i] = radius(i, m, a, a.tickPos);
    // Seen from above, up is toward you: what's in the air swells (its head
    // the most at the top of a jump, its neck after it, in an arch), and
    // what hangs into a pit is smaller (see sinkOf). (A lift up the screen
    // read as a lunge or a flinch, depending on the heading.)
    a.swell = a.lifted ? a.lift[0] * a.liftSw : 0;
    if (a.lifted) for (let i = 0; i < m; i++) if (a.lift[i]) a.rad[i] *= 1 + a.lift[i] * a.liftSw;
    if (!dead && game) sinkOf(s, a);
    else if (a.bridging) { a.hang.fill(0); a.sink.fill(0); a.bridging = false; }
    if (a.bridging) for (let i = 0; i < m; i++) if (a.sink[i]) a.rad[i] *= 1 - sunk(a.sink[i]);
    // Come down from a jump: a squash (its head a touch wider, its face
    // flattened along the way it's going: see drawBody), and a ring of dust (see liftOf).
    const sq = (now - a.landAt) / LAND_MS;
    a.squash = !dead && !reduced && sq >= 0 && sq < 1 ? Math.sin(sq * Math.PI) * (1 - sq) * 1.6 : 0;
    if (a.squash) a.rad[0] *= 1 + 0.16 * a.squash;
    fillsOf(s, a, now);
    return a;
  }

  // ------------------------------------------- jumps, and bodies over holes

  // A jump, seen from above. Up is toward you, so what's in the air swells,
  // and its shadow stays on the ground, falling further off the higher it
  // is (away from the light, down and to the right: see drawShadows). Its
  // lift is an arch over what it hops: each segment is up by how near it is
  // to that (a cell either side: so the head rises as it takes off, is at
  // the top over the hurdle, and comes down on the far side, and the neck
  // follows it up and over), and the neck is held up by the head (NECK).
  // Once it's down, the arch stays over a body it crossed for as long as
  // that body's there (CROSS_H: its body bridging the other's, which passes
  // under), and over anything else settles down (over a hole, its body
  // bridges it: see sinkOf). Drawn ahead, a jump that's sure to go starts up
  // before its tick. Taking off puffs dust (see onTick), landing squashes its
  // head and rings dust round it, and a faint trail marks its way through
  // the air (see drawTrails). With reduced motion: the lift and its shadow,
  // and none of the dust or the trail (being in the air is a rule, so it shows).
  const NECK = [1, 0.7, 0.4, 0.15], CROSS_H = 0.45, LAND_MS = 230;
  function liftOf(s, a, at, k2, now) {
    const hops = a.hops, m = a.n, lift = a.lift, pts = a.pts;
    if (a.lifted) lift.fill(0);
    a.lifted = false;
    let head = 0; // (the head's own lift, before it's eased)
    if (a.ml) { // (a jump seen coming: its head starts up toward what it hops)
      let flying = false;
      for (let j = 0; j < hops.length; j++) if (game.tick - hops[j].tick < 2) flying = true;
      if (!flying) {
        head = reduced ? +(k2 > 0) : archAt(s, pts[0], pts[1], a.mx, a.my, a.mx, a.my);
        a.liftSw = s.leaps > 0 ? T.LEAP_SWELL_GOLD : T.LEAP_SWELL;
      }
    }
    for (let j = hops.length - 1; j >= 0; j--) {
      const r = hops[j], p = game.tick - r.tick + at, flight = p < 2; // (how far through its two ticks in the air it's drawn)
      if (!flight && !r.landed) { // (down: its squash, a ring of dust where it came down)
        r.landed = true; r.landedAt = now;
        if (s.alive) { a.landAt = now; dustRing((r.x1 + r.dx + 0.5) * CELL, (r.y1 + r.dy + 0.5) * CELL); }
      }
      if (r.jTick !== game.tick) { // (where in its body the cells it hopped are now, and whether a body still lies under them: once a tick)
        r.jTick = game.tick;
        r.under = false;
        for (let x = r.x0, y = r.y0, n = 0; n < 3; n++) {
          const key = y * GRID + x;
          if (x >= 0 && y >= 0 && x < GRID && y < GRID && (cover[key] >= 2 || (cover[key] === 1 && coverBy[key] !== s.id))) r.under = true;
          if (x === r.x1 && y === r.y1) break;
          x += r.dx; y += r.dy;
        }
      }
      const to = flight ? 1 : r.under ? CROSS_H : 0;
      r.h = flight || reduced ? to : r.h + (to - r.h) * (1 - Math.exp(-frameDt / 90));
      if (game.tick > r.until || (!flight && r.h < 0.01 && !to)) { hops.splice(j, 1); continue; }
      if (r.h < 0.005) continue;
      a.liftSw = r.gold ? T.LEAP_SWELL_GOLD : T.LEAP_SWELL;
      for (let i = 0; i < m; i++) {
        const v = r.h * archAt(s, pts[2 * i], pts[2 * i + 1], r.x0, r.y0, r.x1, r.y1);
        if (v > lift[i]) lift[i] = v;
      }
      if (flight && (lift[0] > head || reduced)) head = reduced ? 1 : lift[0]; // (with reduced motion, a still pose up in the air for its two ticks)
    }
    // (the head eased a touch, so a jump seen late, or a guess put right, never pops)
    a.rise = reduced ? head : a.rise + (head - a.rise) * (1 - Math.exp(-frameDt / 25));
    if (a.rise < 0.002) a.rise = 0;
    lift[0] = a.rise;
    for (let i = 1; i < NECK.length && i < m; i++) if (a.rise * NECK[i] > lift[i]) lift[i] = a.rise * NECK[i];
    for (let i = 0; i < m && !a.lifted; i++) if (lift[i] > 0.002) a.lifted = true;
  }
  // How far up a jump's arch is at (x, y) (units), over the cells it hops
  // from (x0, y0) to (x1, y1): at the top over them, down a cell either side.
  function archAt(s, x, y, x0, y0, x1, y1) {
    let dx = x / CELL - 0.5 - x0, dy = y / CELL - 0.5 - y0, sx = x1 - x0, sy = y1 - y0;
    if (s.wrapUntil >= 0) { dx = wd(dx); dy = wd(dy); sx = wd(sx); sy = wd(sy); } // (across a wrapped edge)
    const l2 = sx * sx + sy * sy;
    if (l2) { const t = Math.max(0, Math.min(1, (dx * sx + dy * sy) / l2)); dx -= sx * t; dy -= sy * t; }
    const d = Math.hypot(dx, dy);
    return d < 1 ? Math.cos(d * Math.PI / 2) : 0;
  }
  // A jump's records, from its leap event: the cells it hops (x0, y0 to x1,
  // y1), the way it went, its tick, its arch's height now, until when.
  function hopped(s, e, now) {
    const a = animOf(s, now), h = s.body[0], hops = a.hops;
    if (hops.length >= 3) hops.shift();
    hops.push({ x0: e.x, y0: e.y, x1: h.x, y1: h.y, dx: s.dir.x, dy: s.dir.y, tick: game.tick, gold: !!e.gold, h: 1, landed: false, landedAt: 0, until: game.tick + s.body.length + 2, under: false, jTick: -1 });
  }

  // A body over a hole, seen from above: nothing under it, so it's shaded
  // underneath (away from the light: see shadeUnder), its shadow falls deeper,
  // onto the pit's floor and far wall, softer and further off, with the
  // floor round it catching a little light (see drawShadows, pitLight), and
  // it's a little smaller the lower it is. Each segment
  // hangs over the pit by how far in from its rim it's drawn (hang, 0..1);
  // between rims, a span sags a little, most in its middle; a tail end with
  // nothing under it beyond the rim droops down into the pit (smaller and
  // darker) until it's out of the cell. What's up in the air doesn't sag.
  const HANG_RIM = 0.1, SINK_SHRINK = 0.3, SAG = 0.5; // (where the pit's rim is, in from a hole cell's edge, in cells; how much smaller a segment as low as it goes is; how low a span sags)
  // How much smaller a segment hanging so low is: a span sags up to 22.5%
  // smaller in its middle (at 15% it was under a pixel on a phone), a tail
  // end hanging into the pit up to 30%, smoothly between (a tail end
  // passes through a span's depths as it goes over the rim).
  const SPAN_SHRINK = 0.45, sunk = s => SPAN_SHRINK * Math.min(s, SAG) + (SINK_SHRINK - SPAN_SHRINK * SAG) / (1 - SAG) * Math.max(0, s - SAG);
  let supH = new Float32Array(64), supT = new Float32Array(64);
  function sinkOf(s, a) {
    const m = a.n, hang = a.hang, sink = a.sink, pts = a.pts;
    if (a.holeTick !== game.tick || a.holeGame !== game) { a.holeTick = game.tick; a.holeGame = game; a.nearHole = nearHole(s); } // (once a tick: is any of it on or leaving a hole?)
    if (!a.nearHole) { if (a.bridging) { hang.fill(0); sink.fill(0); a.bridging = false; } return; }
    let any = false;
    for (let i = 0; i < m; i++) { hang[i] = overHole(pts[2 * i], pts[2 * i + 1]); if (hang[i]) any = true; }
    if (!any) { if (a.bridging) sink.fill(0); a.bridging = false; return; }
    a.bridging = true;
    if (supH.length < m) { supH = new Float32Array(2 * m); supT = new Float32Array(2 * m); }
    // (how many segments to the nearest on firm bark, toward its head, and toward its tail)
    for (let i = 0, last = -1; i < m; i++) { if (hang[i] < 0.02) last = i; supH[i] = last < 0 ? Infinity : i - last; }
    for (let i = m - 1, last = -1; i >= 0; i--) { if (hang[i] < 0.02) last = i; supT[i] = last < 0 ? Infinity : last - i; }
    for (let i = 0; i < m; i++) {
      const o = hang[i], h = supH[i], t = supT[i];
      const z = !o ? 0 : h < Infinity && t < Infinity ? SAG * Math.min(1, Math.min(h, t) / 1.5) // (a span between rims, sagging)
        : h < Infinity ? Math.min(1, 0.8 + 0.2 * (h - 1)) : 0; // (its tail end, hanging off the rim; its head end's in the air, or going in)
      sink[i] = o * z * Math.max(0, 1 - 3 * a.lift[i]);
    }
  }
  // Is any of a snake's body on a hole, or leaving one?
  function nearHole(s) {
    if (!game.holes.size) return false;
    for (const c of s.body) if (c.x >= 0 && c.y >= 0 && c.x < GRID && c.y < GRID && holeMask[c.y * GRID + c.x]) return true;
    if (s.prev) for (const c of s.prev) if (c.x >= 0 && c.y >= 0 && c.x < GRID && c.y < GRID && holeMask[c.y * GRID + c.x]) return true;
    return false;
  }
  // How far over a pit a point (units) is: 0 on the bark or the rim, rising
  // to 1 half a cell in from the rim of the hole cell it's in (a cell with
  // holes all round is all pit).
  function overHole(x, y) {
    const fx = x / CELL, fy = y / CELL, cx = Math.floor(fx), cy = Math.floor(fy), key = cy * GRID + cx;
    if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID || !holeMask[key]) return 0;
    const u = fx - cx, v = fy - cy;
    let d = 0.5;
    if (cx > 0 && !holeMask[key - 1]) d = Math.min(d, u);
    if (cx < GRID - 1 && !holeMask[key + 1]) d = Math.min(d, 1 - u);
    if (cy > 0 && !holeMask[key - GRID]) d = Math.min(d, v);
    if (cy < GRID - 1 && !holeMask[key + GRID]) d = Math.min(d, 1 - v);
    const k = Math.max(0, Math.min(1, (d - HANG_RIM) / (0.5 - HANG_RIM)));
    return k * k * (3 - 2 * k);
  }

  // ------------------------------------------- drawing half a tick ahead
  // The board is drawn DRAW_LEAD_MS ahead (drawing only: no rule
  // changes, and nobody learns anything sooner), so the cell your head is
  // drawn in is the cell your press turns at. Past its cell's centre, each
  // snake goes on toward where it'll be next: its head to the cell it moves
  // into, the rest one cell on (a growing tail stays, a segment more).
  let leadNow = 0, leadRest = false; // (this frame's lead, in ticks; and whether the board rests at its cells: the round's over)
  let leadTicks = 0.5; // (the lead, in ticks at the speed it's played: the game says, see setLead)
  // Cells a body will still be on after the next move (a tail that moves on
  // leaves its cell; a stunned or growing snake's stays), once a tick.
  // (And how many snakes' bodies lie on each cell now, and the last of them:
  // a body crossing another's, after a jump, is held up over it: see liftOf.)
  const stays = new Uint8Array(GRID * GRID), cover = new Uint8Array(GRID * GRID), coverBy = new Int16Array(GRID * GRID);
  let staysTick = -1, staysGame = null;
  function syncStays() {
    if (staysTick === game.tick && staysGame === game) return;
    staysTick = game.tick; staysGame = game;
    stays.fill(0); cover.fill(0); coverBy.fill(-1);
    for (const o of game.snakes) {
      if (!o.alive) continue;
      const keep = o.stunUntil > game.tick || o.grow > 0 ? o.body.length : o.body.length - 1;
      for (let j = 0; j < o.body.length; j++) {
        const c = o.body[j];
        if (c.x < 0 || c.y < 0 || c.x >= GRID || c.y >= GRID) continue;
        const key = c.y * GRID + c.x;
        if (j < keep) stays[key] = 1;
        if (coverBy[key] !== o.id) { coverBy[key] = o.id; cover[key]++; }
      }
    }
  }
  const burningAt = (x, y) => { const f = game.fires.get(y * GRID + x); return !!f && game.tick >= f.from && game.tick < f.until; };
  const offBoard = (x, y) => x < 0 || y < 0 || x >= GRID || y >= GRID;
  const hurdleAt = (x, y) => !offBoard(x, y) && (stays[y * GRID + x] === 1 || game.holes.has(y * GRID + x) || burningAt(x, y)); // (what a leap hops)
  const wrapX = (s, v) => s.wrapUntil > game.time ? (v + GRID) % GRID : v;
  // Would a turn take it back into its own neck (the game never takes one)?
  function intoNeck(s, d) {
    const n = s.body[1];
    return !!n && wrapX(s, s.body[0].x + d.x) === n.x && wrapX(s, s.body[0].y + d.y) === n.y;
  }
  // Your press, as this screen saw it, not yet taken: online the queue is
  // the host's (a friend's screen never has it, and the host's own press
  // waits a round trip), so it shows from the press. For a few ticks at most.
  const PRESS_TICKS = 3;
  const heardOf = s => press.stun < 0 && !!press.dir && press.tick >= game.tick - PRESS_TICKS && !(press.dir.x === s.dir.x && press.dir.y === s.dir.y) && !intoNeck(s, press.dir);
  // The way a snake goes next: a person's first queued turn (as the game
  // takes it: never into its own neck), or your press as this screen saw it;
  // a rival's plan made ahead of the tick; else on as it's going.
  function wayOf(s) {
    if (s.isPlayer && !s.autopilot) {
      for (let i = 0; i < s.queue.length; i++) if (!intoNeck(s, s.queue[i])) return s.queue[i];
      return s.id === viewerId && heardOf(s) ? press.dir : s.dir;
    }
    return s.plannedTick === game.tick && s.planned ? s.planned : s.dir;
  }
  // Has it asked to jump, or to flash, for this tick? (Asked both, the game
  // hops first if the jump can go, and so does the guess: see predict.)
  const asksJump = s => s.leapArmed >= game.tick || ((!s.isPlayer || s.autopilot) && s.plannedTick === game.tick && s.memory.power === game.tick);
  const asksFlash = s => s.flashArmed >= game.tick || ((!s.isPlayer || s.autopilot) && s.plannedTick === game.tick && s.memory.flash === game.tick);
  // Where a snake goes next, as far as this screen can tell (a.mx, a.my;
  // drawing only: read from what the game already knows, never deciding
  // anything). A stunned snake stays. One about to crash (off the board, a
  // hole, a body still there after the move) holds at its cell's centre,
  // and the crash's lunge plays at the tick. One in the air comes down where
  // it was going. A jump asked for that can go (see hops) leaps: it starts
  // rising before its tick, whether or not a flash is asked for too (the
  // game hops first: the flash waits till it's landed). Else a flash asked
  // for that's sure to go and take it more than a cell runs on ahead (a.mf:
  // the cells past the next): from when its head is drawn past its cell's
  // centre, it's drawn where the flash takes it, as it will be at the tick.
  // (Fire isn't a crash: a crawl goes in.)
  function predict(s, a) {
    const h = s.body[0];
    a.mx = h.x; a.my = h.y; a.mv = 0; a.mg = 0; a.ml = 0; a.mf = 0;
    if (!s.alive || s.stunUntil > game.tick) return;
    const d = s.flight ? s.flight.dir : wayOf(s), x = wrapX(s, h.x + d.x), y = wrapX(s, h.y + d.y);
    a.mx = x; a.my = y; a.mv = 1; a.mg = s.grow > 0 ? 1 : 0; a.mdx = d.x; a.mdy = d.y;
    if (!s.flight && asksJump(s) && hops(s, h, d, game.time)) { a.ml = 1; return; }
    if (!s.flight && asksFlash(s)) {
      const go = flashReach(s, d, x, y);
      if (go > 1) { a.mf = go - 1; a.mx = wrapX(s, h.x + d.x * go); a.my = wrapX(s, h.y + d.y * go); return; }
    }
    if (offBoard(x, y) || game.holes.has(y * GRID + x) || stays[y * GRID + x]) { a.mv = 0; a.mg = 0; }
  }
  // Would a jump asked for go, its head at h heading d, the game's clock at
  // t (as the game's hopPlan has it)? Golden, or the plain one rested and
  // long enough; something right in front to hop and a free cell beyond it
  // to land on, or, golden, something in the two in front and the third free.
  function hops(s, h, d, t) {
    const gold = s.leaps > 0;
    if (!gold && (t < s.leapReadyAt || s.body.length <= T.MIN_LENGTH)) return false;
    const x1 = wrapX(s, h.x + d.x), y1 = wrapX(s, h.y + d.y), x2 = wrapX(s, x1 + d.x), y2 = wrapX(s, y1 + d.y);
    if (offBoard(x1, y1) || offBoard(x2, y2)) return false;
    const over = hurdleAt(x1, y1);
    if (over && !hurdleAt(x2, y2)) return true;
    const x3 = wrapX(s, x2 + d.x), y3 = wrapX(s, y2 + d.y);
    return gold && !offBoard(x3, y3) && (over || hurdleAt(x2, y2)) && !hurdleAt(x3, y3);
  }
  // How many cells a flash asked for takes a head this tick, (x, y) being
  // the first, as the game moves it: a plain one, if it's rested, up to
  // FLASH_LENGTH, stopping short of what it'd run into (into fire, as a crawl
  // goes); a golden one, a dash, DASH_LENGTH, through a body one cell thick
  // (it cuts it) and fire. 0 if it won't go, or blows up (a dash into the
  // edge or a hole: that shows at its tick).
  function flashReach(s, d, x, y) {
    const gold = s.dashes > 0;
    if (!gold && (game.time < s.flashReadyAt || (T.FLASH_COST > 0 && s.body.length <= T.MIN_LENGTH))) return 0;
    const len = gold ? T.DASH_LENGTH : T.FLASH_LENGTH;
    for (let i = 1; ; i++) {
      const k = y * GRID + x;
      if (gold) {
        if (offBoard(x, y)) return 0;
        if (stays[k] && !cutsAt(s, x, y, d)) return i - 1;
        if (game.holes.has(k)) return 0;
      } else if (offBoard(x, y) || game.holes.has(k) || stays[k]) return i - 1;
      else if (burningAt(x, y)) return i;
      if (i === len) return i;
      x = wrapX(s, x + d.x); y = wrapX(s, y + d.y);
    }
  }
  // Would a dash heading d cut the body at (x, y)? Another snake's, behind
  // its head, one cell thick there.
  function cutsAt(s, x, y, d) {
    const o = snakeAt(x, y), j = o ? o.body.findIndex(c => c.x === x && c.y === y) : -1;
    if (!o || o === s || j <= 0) return false;
    const px = wrapX(s, x + d.x), py = wrapX(s, y + d.y);
    return offBoard(px, py) || !stays[py * GRID + px] || snakeAt(px, py) !== o;
  }
  const snakeAt = (x, y) => game.snakes.find(o => o.alive && o.body.some(c => c.x === x && c.y === y)) || null; // (whose body is on (x, y))
  // The j-th cell of the way a snake with a flash on ahead (a.mf) is drawn
  // heading, into chX, chY: the cells the flash takes its head through, from
  // where it lands, then its body (segment i goes from cell i + 1 to cell
  // i). With `last`, its last guess's, on its last body (or on `body`).
  let chX = 0, chY = 0;
  function along(s, a, j, last, body = last ? s.prev : s.body) {
    const go = (last ? a.pmf : a.mf) + 1;
    if (j < go) { const h = body[0]; chX = wrapX(s, h.x + (last ? a.pmdx : a.mdx) * (go - j)); chY = wrapX(s, h.y + (last ? a.pmdy : a.mdy) * (go - j)); }
    else { const c = body[Math.min(j - go, body.length - 1)]; chX = c.x; chY = c.y; }
  }
  // Two heads going into the same cell meet head-on: both hold (heads in the air never meet).
  function meetings() {
    for (let i = 0; i < live.length; i++) {
      const p = anim.get(live[i]);
      if (!p.mv || p.ml) continue;
      for (let j = i + 1; j < live.length; j++) {
        const q = anim.get(live[j]);
        if (q.mv && !q.ml && q.mx === p.mx && q.my === p.my) { p.mv = q.mv = 0; p.mg = q.mg = 0; }
      }
    }
  }
  // Easing out of a wrong guess. Nothing drawn ever jumps: when where a
  // snake's drawn heading changes (a plan made late, your press in the
  // second half of a tick, a crash nobody saw coming, or the tick shows it
  // went elsewhere), the difference stays on each segment as an offset that
  // fades over about FIX_MS. A dash isn't eased: it's there at once; nor is
  // a flash seen coming (it's there at once, as a dash is). But a flash seen
  // coming that then goes another way (a turn pressed after it, even in the
  // tick's own frame), or somewhere else, is put right as any other guess
  // is, as fast as a dash goes (FIX_DASH); one that doesn't go at all eases
  // back as any other. (behind: dashed this tick, where its tail is drawn
  // from, a cell back along its body: see prepare.)
  const FIX_MS = 35, FIX_SPEED = CELL * 0.012, FIX_DASH = CELL * 0.03; // (units a ms: 12 cells a second, about a snake's top speed; 30, about a dash's)
  const wd = v => v > GRID / 2 ? v - GRID : v < -GRID / 2 ? v + GRID : v; // (a step in cells, across a wrapped edge)
  function refix(s, a, at, snap, behind) {
    const n = s.body.length, fix = a.fix, body = s.body, prev = s.prev;
    if (a.fixOn) { // (what's left fades, never faster than FIX_SPEED: a big one takes a little longer)
      const keep = Math.exp(-frameDt / (FIX_MS / 3)), most = (a.fixFast ? FIX_DASH : FIX_SPEED) * frameDt;
      let left = 0;
      for (let i = 0; i < fix.length; i += 2) {
        const x = fix[i], y = fix[i + 1], d = Math.hypot(x, y);
        if (!d) continue;
        const k = Math.max(keep, 1 - most / d);
        fix[i] = x * k; fix[i + 1] = y * k;
        left = Math.max(left, d * k);
      }
      if (left < 0.25) unfix(a);
    }
    const same = a.pTick === game.tick, from = same ? body[0] : prev?.[0]; // (where its head was when it last guessed)
    const fresh = !!from && from.x === a.phx && from.y === a.phy && (same || a.pTick === game.tick - 1); // (it last guessed from where it was: this tick, or the last)
    if (reduced || !fresh || (snap && !same && !(a.pmf && behind))) { // (a dash not seen coming, too long since, or put somewhere else: start afresh)
      if (a.fixOn) unfix(a);
    } else if (same && a.mf && !a.pmf) { // (a flash seen coming: it's there at once, as a dash is)
      if (a.fixOn) unfix(a);
    } else if (same && a.pmf && (a.mf !== a.pmf || a.mx !== a.pmx || a.my !== a.pmy || a.mdx !== a.pmdx || a.mdy !== a.pmdy)) { // (a flash seen coming that's now going another way, or somewhere else, or not at all)
      const k2 = Math.max(0, at - 1);
      if (k2 > 0) for (let i = 0; i < n; i++) {
        drawnOff(s, a, i, k2, true); const ox = offX, oy = offY;
        drawnOff(s, a, i, k2, false);
        fixAdd(a, i, ox - offX, oy - offY, 2 * T.DASH_LENGTH); // (two guesses at right angles: never more than this apart)
      }
      if (a.fixOn) a.fixFast = true;
    } else if (same) { // (the same tick: a different guess)
      const kk = Math.max(0, at - 1);
      if (kk > 0 && (a.pmv !== a.mv || a.pmx !== a.mx || a.pmy !== a.my)) {
        const hx = body[0].x, hy = body[0].y;
        fixAdd(a, 0, kk * (a.pmv * wd(a.pmx - hx) - a.mv * wd(a.mx - hx)), kk * (a.pmv * wd(a.pmy - hy) - a.mv * wd(a.my - hy)));
        if (a.pmv !== a.mv) for (let i = 1; i < n; i++) fixAdd(a, i, kk * (a.pmv - a.mv) * wd(body[i - 1].x - body[i].x), kk * (a.pmv - a.mv) * wd(body[i - 1].y - body[i].y));
      }
    } else { // (a tick on: where the last guess would have it now, against where it is; a flash seen coming that's gone, from where it's drawn going on from)
      const k1 = Math.min(1, at);
      for (let i = 0; i < n && i < prev.length; i++) {
        const p = prev[i], b = !behind ? p : i < n - 1 ? body[i + 1] : behind;
        let gx, gy; // (where the last guess would have it now, from p)
        if (a.pmf) { along(s, a, i + 1, true); const fx = chX, fy = chY; along(s, a, i, true); gx = wd(fx - p.x) + wd(chX - fx) * at; gy = wd(fy - p.y) + wd(chY - fy) * at; } // (a flash that didn't go, or went)
        else { const qx = i ? prev[i - 1].x : a.pmx, qy = i ? prev[i - 1].y : a.pmy; gx = a.pmv * wd(qx - p.x) * at; gy = a.pmv * wd(qy - p.y) * at; }
        const ex = gx - wd(b.x - p.x) - wd(body[i].x - b.x) * k1, ey = gy - wd(b.y - p.y) - wd(body[i].y - b.y) * k1;
        if (ex || ey) fixAdd(a, i, ex, ey, behind ? 2 * T.DASH_LENGTH : 2.5);
      }
      if (behind && a.fixOn) a.fixFast = true;
    }
    if (a.fixOn && a.fixFar) unfix(a); // (more than a guess could be out by: it jumped, so it jumps)
    a.fixFar = false;
    a.pmx = a.mx; a.pmy = a.my; a.pmv = a.mv; a.pmf = a.mf; a.pmdx = a.mdx; a.pmdy = a.mdy; a.pTick = game.tick; a.phx = body[0].x; a.phy = body[0].y;
  }
  function fixAdd(a, i, dx, dy, far = 2.5) {
    if (Math.abs(dx) + Math.abs(dy) < 0.01) return;
    if (Math.abs(dx) + Math.abs(dy) > far) a.fixFar = true;
    a.fixOn = true;
    a.fix[2 * i] += dx * CELL; a.fix[2 * i + 1] += dy * CELL;
  }
  function unfix(a) { a.fix.fill(0); a.fixOn = false; a.fixFast = false; }
  // Where segment i is drawn, k2 (> 0) on past its cell, as this frame's
  // guess has it (or with `last`, the last frame's, this tick), in cells
  // from its cell: into offX, offY. (As prepare draws it: see there.)
  let offX = 0, offY = 0;
  function drawnOff(s, a, i, k2, last) {
    const c = s.body[i];
    if (last ? a.pmf : a.mf) {
      along(s, a, i + 1, last, s.body); const fx = wd(chX - c.x), fy = wd(chY - c.y);
      along(s, a, i, last, s.body); offX = fx + (wd(chX - c.x) - fx) * k2; offY = fy + (wd(chY - c.y) - fy) * k2;
    } else {
      const v = last ? a.pmv : a.mv, nx = i ? s.body[i - 1].x : last ? a.pmx : a.mx, ny = i ? s.body[i - 1].y : last ? a.pmy : a.my;
      offX = v * wd(nx - c.x) * k2; offY = v * wd(ny - c.y) * k2;
    }
  }

  // A coordinate (in cells) moved a whole board's width, if that brings it
  // near ref (a segment that moved across a wrapped edge: any real move is
  // three cells at most, a crossing nearly the board's width).
  const nearOf = (v, ref) => v - ref > GRID / 2 ? v - GRID : ref - v > GRID / 2 ? v + GRID : v;
  // ...and the same for a drawn point (in units), a whole board's width.
  const nearIn = (v, ref) => v - ref > SIZE / 2 ? v - SIZE : ref - v > SIZE / 2 ? v + SIZE : v;
  // A body that runs across a wrapped edge, made one unbroken chain from the
  // head (so parts of it lie off the board), and the offsets to draw it at
  // as well, so what's off one edge shows at the other. (Every frame, for a
  // snake that's had the edges wrap this round: the offsets go in arrays
  // kept on its anim, and in OFF_XS and OFF_YS, so none is made a frame.)
  const OFFS = [[0, 0]], OFF_XS = [], OFF_YS = [];
  function unwrap(a, n) {
    const { pts, cor } = a;
    for (let i = 0; i < n - 1; i++) {
      cor[2 * i] = nearIn(cor[2 * i], pts[2 * i]); cor[2 * i + 1] = nearIn(cor[2 * i + 1], pts[2 * i + 1]);
      pts[2 * i + 2] = nearIn(pts[2 * i + 2], cor[2 * i]); pts[2 * i + 3] = nearIn(pts[2 * i + 3], cor[2 * i + 1]);
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < n; i++) {
      x0 = Math.min(x0, pts[2 * i]); x1 = Math.max(x1, pts[2 * i]);
      y0 = Math.min(y0, pts[2 * i + 1]); y1 = Math.max(y1, pts[2 * i + 1]);
    }
    if (x0 >= 0 && y0 >= 0 && x1 <= SIZE && y1 <= SIZE) return null;
    const xs = OFF_XS, ys = OFF_YS, offs = a.offList, pool = a.offPool;
    xs.length = ys.length = offs.length = 0;
    xs.push(0); ys.push(0);
    if (x0 < 0) xs.push(SIZE);
    if (x1 > SIZE) xs.push(-SIZE);
    if (y0 < 0) ys.push(SIZE);
    if (y1 > SIZE) ys.push(-SIZE);
    for (let i = 0; i < xs.length; i++) {
      for (let j = 0; j < ys.length; j++) {
        const p = pool[offs.length] || (pool[offs.length] = [0, 0]);
        p[0] = xs[i]; p[1] = ys[j];
        offs.push(p);
      }
    }
    return offs;
  }

  // Segment radius: a big head, a body that tapers to the tail, plus any gulp passing through.
  function radius(i, n, a, tickPos) {
    let r = i === 0 ? CELL * 0.54 * (1 + a.bump) : CELL * (0.44 - 0.1 * (i / (n > 1 ? n - 1 : 1)));
    if (i > 0) {
      for (let g = 0; g < 4; g++) {
        const d = i - (tickPos - a.gulps[g]);
        if (d > -a.gulpW && d < a.gulpW) r += CELL * a.gulpR * (1 - Math.abs(d) / a.gulpW);
      }
    }
    return r;
  }

  const near = (u, v) => Math.abs(u - v) < 0.01;

  // The band from segment i to i + 1, half-width h: through its corner cell,
  // as rectangles (see rectPiece). Straight, it's
  // one piece (two pieces meeting mid-band leave a hairline seam when a cell
  // isn't a whole number of pixels); at a bend the corner's circle covers the join.
  function band(a, i, h) {
    const p = a.pts, c = a.cor;
    const x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
    if ((near(x1, cx) && near(cx, x2)) || (near(y1, cy) && near(cy, y2))) rectPiece(x1, y1, x2, y2, h);
    else { rectPiece(x1, y1, cx, cy, h); rectPiece(cx, cy, x2, y2, h); }
  }

  // Does the band from i to i + 1 turn a corner (and need its outside rounded)?
  function bends(a, i) {
    const p = a.pts, c = a.cor;
    const x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
    if ((near(x1, cx) && near(y1, cy)) || (near(x2, cx) && near(y2, cy))) return false;
    return !(near(x1, cx) && near(cx, x2)) && !(near(y1, cy) && near(cy, y2));
  }

  // A body is a row of segments, one per cell, each a little round with a
  // narrower band joining it to the next: a caterpillar, so you can count
  // how long a snake is at a glance.
  const PINCH = 0.8;
  // The body's outline shape, `grow` units bigger all round, as separate
  // fills in the current fill: bands as rectangles, joints as circles, the
  // same shapes the body is drawn with (they batch into one GPU operation).
  // Only for an opaque fill: where pieces overlap, a translucent one darkens
  // (that's what the veil and silhouette are for). With a reach, only what's
  // within it of (cx, cy), give or take a segment.
  // (For a shadow, only some of it: with pit 1, what's on firm ground or by
  // a pit's rim, or 2, what's well over a pit (HANG_DRY); with air 1, what's
  // on the ground, or 2, what's up in the air: see drawShadows.)
  function bodyFills(a, grow, cx = 0, cy = 0, reach = 0, pit = 0, air = 0) {
    const p = a.pts, c = a.cor, rad = a.rad, n = a.n, some = pit || air;
    for (let i = n - 2; i >= 0; i--) {
      if (reach && far(p, i, cx, cy, reach) && far(p, i + 1, cx, cy, reach)) continue;
      if (some && leftOut(a, i, i + 1, pit, air)) continue;
      const h = rad[i + 1] * PINCH + grow, x1 = p[2 * i], y1 = p[2 * i + 1], qx = c[2 * i], qy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
      if ((near(x1, qx) && near(qx, x2)) || (near(y1, qy) && near(qy, y2))) rectPiece(x1, y1, x2, y2, h); // (straight: one piece, no seam)
      else { rectPiece(x1, y1, qx, qy, h); rectPiece(qx, qy, x2, y2, h); }
    }
    for (let i = n - 1; i >= 0; i--) {
      if (reach && far(p, i, cx, cy, reach) && (i === n - 1 || far(p, i + 1, cx, cy, reach))) continue;
      if (i < n - 1 && bends(a, i) && !(some && leftOut(a, i, i + 1, pit, air))) circle(c[2 * i], c[2 * i + 1], rad[i + 1] * PINCH + grow);
      if (some && leftOut(a, i, i, pit, air)) continue;
      if (i === 0 && a.star) { ctx.beginPath(); starPath(a, grow); ctx.fill(); }
      else circle(p[2 * i], p[2 * i + 1], rad[i] + grow);
    }
  }
  const leftOut = (a, i, j, pit, air) => (pit && (a.hang[i] >= HANG_DRY || a.hang[j] >= HANG_DRY) !== (pit === 2)) || (air && (a.lift[i] > 0 || a.lift[j] > 0) !== (air === 2));
  const far = (p, i, cx, cy, reach) => (p[2 * i] - cx) * (p[2 * i] - cx) + (p[2 * i + 1] - cy) * (p[2 * i + 1] - cy) > reach * reach;
  // The same shape as one path, filled once: an even shade where pieces
  // overlap, for a translucent fill. (A path of a hundred contours is
  // triangulated every frame, so it's kept for what's rare: a fading corpse,
  // a golden outline, a queasy wash.)
  function silhouette(a, grow) {
    shape(a, grow);
    ctx.fill();
  }
  // ...as the current path (to fill, or to clip to).
  // (Only segments i0 to i1, for a short stretch: cheap to clip to.)
  function shape(a, grow, i0 = 0, i1 = a.n - 1) {
    ctx.beginPath();
    const p = a.pts, c = a.cor;
    for (let i = i1 - 1; i >= i0; i--) {
      const h = a.rad[i + 1] * PINCH + grow, x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
      pieceRect(x1, y1, cx, cy, h);
      pieceRect(cx, cy, x2, y2, h);
    }
    for (let i = i1; i >= i0; i--) {
      if (i < i1 && bends(a, i)) { const r = a.rad[i + 1] * PINCH + grow; ctx.moveTo(a.cor[2 * i] + r, a.cor[2 * i + 1]); ctx.arc(a.cor[2 * i], a.cor[2 * i + 1], r, 0, TAU); }
      if (i === 0 && a.star) { starPath(a, grow); continue; }
      const r = a.rad[i] + grow;
      ctx.moveTo(p[2 * i] + r, p[2 * i + 1]);
      ctx.arc(p[2 * i], p[2 * i + 1], r, 0, TAU);
    }
  }
  // One straight piece of a band, filled (pieces run along the grid, but
  // for a moment while a head eases out of a wrong guess: see refix; a
  // zero-length one fills nothing, as in a silhouette).
  function rectPiece(x1, y1, x2, y2, h) {
    if (near(y1, y2)) { if (!near(x1, x2)) ctx.fillRect(Math.min(x1, x2), y1 - h, Math.abs(x2 - x1), 2 * h); }
    else if (near(x1, x2)) ctx.fillRect(x1 - h, Math.min(y1, y2), 2 * h, Math.abs(y2 - y1));
    else { ctx.beginPath(); slant(x1, y1, x2, y2, h); ctx.fill(); }
  }
  // One straight piece of a band, added to the current path (the same; a
  // zero-length one adds nothing).
  function pieceRect(x1, y1, x2, y2, h) {
    if (near(y1, y2)) { if (!near(x1, x2)) ctx.rect(Math.min(x1, x2), y1 - h, Math.abs(x2 - x1), 2 * h); }
    else if (near(x1, x2)) ctx.rect(x1 - h, Math.min(y1, y2), 2 * h, Math.abs(y2 - y1));
    else slant(x1, y1, x2, y2, h);
  }
  // A piece off the grid, as a closed shape wound the way rect() winds (so
  // a silhouette's pieces never cancel each other out).
  function slant(x1, y1, x2, y2, h) {
    const l = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / l * h, ny = (x2 - x1) / l * h;
    ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x2 - nx, y2 - ny); ctx.lineTo(x2 + nx, y2 + ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.closePath();
  }

  // The path through every segment centre and corner, head to tail (or from
  // segment i0 to i1).
  function spine(a, i0 = 0, i1 = a.n - 1) {
    ctx.beginPath();
    ctx.moveTo(a.pts[2 * i0], a.pts[2 * i0 + 1]);
    for (let i = i0 + 1; i <= i1; i++) {
      ctx.lineTo(a.cor[2 * i - 2], a.cor[2 * i - 1]);
      ctx.lineTo(a.pts[2 * i], a.pts[2 * i + 1]);
    }
  }

  // The veil: an offscreen layer the size of the board (and a margin), for
  // a translucent shape made of overlapping pieces (every snake's shadow, a
  // land's colour round a rival on it). The pieces go into it opaque, with fast
  // fills, and it's laid on the board once at the shape's alpha: an even
  // shade, without a path of a hundred contours triangulated every frame.
  const VEIL_M = 8; // (its margin, in units: the shadow of a body hanging off the edge)
  let veil = null, veilG = null, boardG = null;
  let veilX = 0, veilY = 0, vx0 = 0, vy0 = 0, vw = 0, vh = 0;
  // Draw into the veil (ctx is the veil's until veilOff) within the box
  // x0..x1, y0..y1 (units), for a layer that lands (dx, dy) units off.
  function veilOn(dx, dy, x0, y0, x1, y1) {
    const w = Math.ceil((SIZE + 2 * VEIL_M) * k);
    if (!veil || veil.width !== w) { veil = makeLayer(w, w); veilG = veil.getContext('2d'); }
    // (It lands on whole device pixels, so it's never resampled.)
    const ex = (dx - VEIL_M) * k + shakeX, ey = (dy - VEIL_M) * k + shakeY;
    veilX = Math.floor(ex); veilY = Math.floor(ey);
    const ox = VEIL_M * k + ex - veilX, oy = VEIL_M * k + ey - veilY;
    vx0 = Math.max(0, Math.floor(x0 * k + ox)); vy0 = Math.max(0, Math.floor(y0 * k + oy));
    vw = Math.min(w, Math.ceil(x1 * k + ox)) - vx0; vh = Math.min(w, Math.ceil(y1 * k + oy)) - vy0;
    veilG.setTransform(1, 0, 0, 1, 0, 0);
    veilG.save();
    veilG.beginPath(); veilG.rect(vx0, vy0, Math.max(0, vw), Math.max(0, vh)); veilG.clip(); // (only the box is touched)
    veilG.clearRect(vx0, vy0, Math.max(0, vw), Math.max(0, vh));
    veilG.setTransform(k, 0, 0, k, ox, oy);
    boardG = ctx;
    ctx = veilG;
  }
  // Back to the board, laying the veil on it at `alpha`.
  function veilOff(alpha) {
    veilG.restore();
    ctx = boardG;
    if (vw <= 0 || vh <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(veil, vx0, vy0, vw, vh, veilX + vx0, veilY + vy0, vw, vh);
    ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
    ctx.globalAlpha = 1;
  }

  // Pass 1, before any body: the shadows on the bark, all at once (in the
  // veil, laid on the bark at 0.3, a little down and to the right). A
  // segment up in the air casts its shadow further off, on the ground (see
  // liftOf: the higher, the further, and a little smaller, never swollen
  // with it): of a snake in the air (live[up..]), that part is laid after
  // the bodies on the ground, so the hurdle passes under with the shadow
  // across it (see drawAirShadows), and only what's on the ground is laid
  // here. What's well over a pit casts its shadow down into the pit, onto
  // its floor and far wall: further off (DEEP_DX, DEEP_DY) and a little
  // bigger, as a shadow cast further away is, and none on the bark there.
  // (In the same veil, with no clip: it's near enough to keep to the pit,
  // and the pit is dark.)
  const LIFT_DX = CELL * 0.62, LIFT_DY = CELL * 0.82, LIFT_SHRINK = 0.15; // (at the top of a jump: how much further off, and smaller)
  const DEEP_DX = CELL * 0.2, DEEP_DY = CELL * 0.28, DEEP_GROW = 1.5, HANG_DRY = 0.5; // (how much further off, and bigger; how far over a pit casts its shadow into it, not on the bark)
  function drawShadows(up) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of live) {
      const a = anim.get(s);
      if (a.offs) { x0 = y0 = -VEIL_M; x1 = y1 = SIZE + VEIL_M; break; } // (across a wrapped edge: anywhere)
      for (let i = 0; i < a.n; i++) {
        const x = a.pts[2 * i], y = a.pts[2 * i + 1];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    if (x0 > x1) return;
    veilOn(2, 4, x0 - CELL * 2, y0 - CELL * 2, x1 + CELL * 2, y1 + CELL * 2);
    pitLight(); // (first, the light on a pit's floor round where a span's shadow falls)
    ctx.fillStyle = '#000000';
    for (let j = 0; j < live.length; j++) {
      const a = anim.get(live[j]), offs = a.offs || OFFS, air = j >= up && a.lifted ? 1 : 0;
      for (let pass = a.bridging ? 2 : 1; pass > 0; pass--) { // (into the pit, then on the bark)
        const moved = pass === 2 ? shadowShape(a, true) : air === 0 && a.lifted && shadowShape(a, false); // (a snake on the ground still arching down: moved, under the bodies)
        for (let k = 0; k < offs.length; k++) {
          const ox = offs[k][0], oy = offs[k][1];
          if (ox || oy) ctx.translate(ox, oy);
          bodyFills(a, pass === 2 ? DEEP_GROW : 0, 0, 0, 0, a.bridging ? pass : 0, pass === 2 ? 0 : air);
          if (ox || oy) ctx.translate(-ox, -oy);
        }
        if (moved) unshadow(a);
      }
    }
    veilOff(0.3);
  }
  // A body well over a pit: the pit's floor is all but black, so a shadow
  // on it didn't show, and on a phone the span read as two darker beads,
  // not a body over a gap. So the floor round where its shadow falls
  // catches a little light, fading out from it, and its shadow lies dark
  // in that, further off down and to the right than on the bark: the gap
  // under it, seen. Drawn in the shadows' veil before them (it's laid on
  // every frame anyway: a layer of its own, laid on too, cost a frame 0.3
  // ms to the GPU and up to 2 ms of waiting on it in the script, with four
  // snakes across ditches), in the shapes a shadow is (what's well over the
  // pit, HANG_DRY, and the bands either side, grown: each straight run one
  // rectangle), in faint steps, each cut to the hole cells near it, short
  // of the rim where the bark is (as rectangles, worked out: a mask over
  // the veil cost a frame 0.7 ms); the shadows go on over it. Where the
  // shadow falls on the far wall, it darkens it, as on the bark.
  const PIT_LIT = '#c17d41', PIT_GLOW = [16, 12, 8, 4], PIT_STEP = 0.3; // (the light, laid on at the veil's 0.3; its steps, how far round the shadow, units; each one's)
  const PIT_REACH = CELL * 0.54 + 18; // (round a segment's shadow well over a pit: a head's radius and the light round it; a band to the next is in its own cell, or the next's, or on the bark)
  const pitNear = new Uint8Array(GRID * GRID), pitCells = [];
  let pitRuns = new Float32Array(5 * 32), pitRunN = 0; // (the straight runs well over a pit: x0, y0, x1, y1 along the spine, and half the widest segment)
  const pitAreas = new Float32Array(4 * GRID * GRID); let pitAreaN = 0; // (the hole cells near them, merged: x0, y0, x1, y1, where the veil draws them)
  const pitPend = new Float32Array(5 * 4 * GRID); // (pitCellAreas's runs open from one row to the next)
  function pitLight() {
    pitCells.length = 0;
    for (const s of live) { // (the hole cells near each segment well over one)
      const a = anim.get(s);
      if (!a.bridging || a.offs) continue;
      for (let i = 0; i < a.n; i++) {
        if (a.hang[i] < HANG_DRY) continue;
        const x = a.pts[2 * i] + DEEP_DX + 2, y = a.pts[2 * i + 1] + DEEP_DY + 4; // (its shadow)
        const gx0 = Math.max(0, Math.floor((x - PIT_REACH) / CELL)), gx1 = Math.min(GRID - 1, Math.floor((x + PIT_REACH) / CELL));
        const gy0 = Math.max(0, Math.floor((y - PIT_REACH) / CELL)), gy1 = Math.min(GRID - 1, Math.floor((y + PIT_REACH) / CELL));
        for (let gy = gy0; gy <= gy1; gy++) {
          for (let gx = gx0; gx <= gx1; gx++) {
            const key = gy * GRID + gx;
            if (!holeMask[key] || pitNear[key]) continue;
            pitNear[key] = 1; pitCells.push(key);
          }
        }
      }
    }
    if (!pitCells.length) return;
    pitRunN = 0;
    for (const s of live) {
      const a = anim.get(s);
      if (!a.bridging || a.offs) continue;
      shadowShape(a, true);
      gatherRuns(a);
      unshadow(a);
    }
    pitCellAreas();
    ctx.fillStyle = PIT_LIT;
    ctx.globalAlpha = PIT_STEP;
    for (const grow of PIT_GLOW) {
      for (let r = 0; r < pitRunN; r++) {
        const g = pitRuns[5 * r + 4] + grow, x0 = pitRuns[5 * r] - g, y0 = pitRuns[5 * r + 1] - g, x1 = pitRuns[5 * r + 2] + g, y1 = pitRuns[5 * r + 3] + g;
        for (let q = 0; q < pitAreaN; q++) {
          const ax = Math.max(x0, pitAreas[4 * q]), ay = Math.max(y0, pitAreas[4 * q + 1]), bx = Math.min(x1, pitAreas[4 * q + 2]), by = Math.min(y1, pitAreas[4 * q + 3]);
          if (bx > ax && by > ay) ctx.fillRect(ax, ay, bx - ax, by - ay);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  // (The hole cells marked near a span, as rectangles into pitAreas, short
  // of the pit's edge, its ink and all, where the bark is, where the veil
  // draws them (it lands 2 and 4 units off): each row's run of them with
  // the same rims above and below, and a run going on down the next row,
  // the same across and the hole open between, with it: a ditch crossed is
  // one. Their marks cleared.)
  function pitCellAreas() {
    const PIT_IN = PIT_RIM + 1, hole = key => holeMask[key] === 1;
    let cx0 = GRID, cy0 = GRID, cx1 = -1, cy1 = -1;
    for (const key of pitCells) { const x = key % GRID, y = (key - x) / GRID; if (x < cx0) cx0 = x; if (x > cx1) cx1 = x; if (y < cy0) cy0 = y; if (y > cy1) cy1 = y; }
    pitAreaN = 0;
    let open = 0; // (the runs open from the row before: pitPend[0..open), each x, w, y, h, open below)
    for (let cy = cy0; cy <= cy1 + 1; cy++) {
      let now1 = open;
      for (let cx = cx0; cy <= cy1 && cx <= cx1; cx++) {
        let key = cy * GRID + cx;
        if (!pitNear[key]) continue;
        const t = cy > 0 && hole(key - GRID) ? 0 : PIT_IN, b = cy < GRID - 1 && hole(key + GRID) ? 0 : PIT_IN, l = cx > 0 && hole(key - 1) ? 0 : PIT_IN;
        let ex = cx;
        while (ex < cx1 && pitNear[key + 1] && (cy > 0 && hole(key + 1 - GRID) ? 0 : PIT_IN) === t && (cy < GRID - 1 && hole(key + 1 + GRID) ? 0 : PIT_IN) === b) { ex++; key++; }
        const r = ex < GRID - 1 && hole(key + 1) ? 0 : PIT_IN, x = cx * CELL + l, w = (ex + 1) * CELL - r - x;
        let j = 0;
        while (j < open && !(pitPend[5 * j + 4] === 1 && !t && pitPend[5 * j] === x && pitPend[5 * j + 1] === w)) j++;
        if (j < open) { pitPend[5 * j + 3] += CELL - b; pitPend[5 * j + 4] = (b ? 0 : 1) + 2; } // (it goes on down: carried on)
        else { pitPend[5 * now1] = x; pitPend[5 * now1 + 1] = w; pitPend[5 * now1 + 2] = cy * CELL + t; pitPend[5 * now1 + 3] = CELL - t - b; pitPend[5 * now1 + 4] = (b ? 0 : 1) + 2; now1++; }
        cx = ex;
      }
      let n1 = 0; // (the row before's runs that didn't go on: done; those that did, and this row's, open for the next)
      for (let j = 0; j < now1; j++) {
        const o = pitPend[5 * j + 4];
        if (o >= 2) { pitPend[5 * n1] = pitPend[5 * j]; pitPend[5 * n1 + 1] = pitPend[5 * j + 1]; pitPend[5 * n1 + 2] = pitPend[5 * j + 2]; pitPend[5 * n1 + 3] = pitPend[5 * j + 3]; pitPend[5 * n1 + 4] = o - 2; n1++; continue; }
        const q = 4 * pitAreaN++;
        pitAreas[q] = pitPend[5 * j] - 2; pitAreas[q + 1] = pitPend[5 * j + 2] - 4; pitAreas[q + 2] = pitPend[5 * j] + pitPend[5 * j + 1] - 2; pitAreas[q + 3] = pitPend[5 * j + 2] + pitPend[5 * j + 3] - 4;
      }
      open = n1;
    }
    for (const key of pitCells) pitNear[key] = 0;
  }
  // (What's well over a pit and the bands either side, as straight runs
  // into pitRuns: each run along its spine, and as wide as its widest
  // segment; grown, each is one rectangle. A rectangle a piece, circles
  // and all, was 0.3 ms a frame for four snakes across ditches, in the
  // calls alone.)
  let runAX = 0, runAY = 0, runBX = 0, runBY = 0, runH = 0, runFlat = false, runOpen = false; // (the run being gathered)
  function gatherRuns(a) {
    const p = a.pts, c = a.cor, rad = a.rad, n = a.n;
    runOpen = false;
    for (let i = 0; i < n - 1; i++) {
      if (leftOut(a, i, i + 1, 2, 0)) { runFlush(); continue; }
      const h = Math.max(rad[i], rad[i + 1]);
      runPiece(p[2 * i], p[2 * i + 1], c[2 * i], c[2 * i + 1], h);
      runPiece(c[2 * i], c[2 * i + 1], p[2 * i + 2], p[2 * i + 3], h);
    }
    runFlush();
  }
  function runPiece(x1, y1, x2, y2, h) {
    if (near(x1, x2) && near(y1, y2)) return;
    const flat = near(y1, y2);
    if (runOpen && flat === runFlat && near(x1, runBX) && near(y1, runBY)) { runBX = x2; runBY = y2; if (h > runH) runH = h; return; }
    runFlush();
    runAX = x1; runAY = y1; runBX = x2; runBY = y2; runH = h; runFlat = flat; runOpen = true;
  }
  function runFlush() {
    if (!runOpen) return;
    runOpen = false;
    if (5 * (pitRunN + 1) > pitRuns.length) { const more = new Float32Array(2 * pitRuns.length); more.set(pitRuns); pitRuns = more; }
    const q = 5 * pitRunN++;
    pitRuns[q] = Math.min(runAX, runBX); pitRuns[q + 1] = Math.min(runAY, runBY); pitRuns[q + 2] = Math.max(runAX, runBX); pitRuns[q + 3] = Math.max(runAY, runBY); pitRuns[q + 4] = runH;
  }
  // The shadows of what of live[up..] is up in the air (and on firm ground
  // or by a pit's rim: what's over one has its shadow in the pit already),
  // over the bodies on the ground (see drawShadows), moved off: a few
  // segments, as one path filled once (an even shade, with no veil to lay).
  function drawAirShadows(up) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.translate(2, 4);
    for (let j = up; j < live.length; j++) {
      const a = anim.get(live[j]), offs = a.offs || OFFS;
      if (!a.lifted) continue;
      shadowShape(a, false);
      for (let k = 0; k < offs.length; k++) {
        const ox = offs[k][0], oy = offs[k][1];
        if (ox || oy) ctx.translate(ox, oy);
        airPath(a);
        ctx.fill();
        if (ox || oy) ctx.translate(-ox, -oy);
      }
      unshadow(a);
    }
    ctx.translate(-2, -4);
  }
  // (As the current path: its pieces up in the air, but those over a pit.)
  function airPath(a) {
    const p = a.pts, c = a.cor, rad = a.rad, n = a.n, pit = a.bridging ? 1 : 0;
    ctx.beginPath();
    for (let i = n - 2; i >= 0; i--) {
      if (leftOut(a, i, i + 1, pit, 2)) continue;
      const h = rad[i + 1] * PINCH, x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
      pieceRect(x1, y1, cx, cy, h);
      pieceRect(cx, cy, x2, y2, h);
      if (bends(a, i)) { const r = rad[i + 1] * PINCH; ctx.moveTo(cx + r, cy); ctx.arc(cx, cy, r, 0, TAU); }
    }
    for (let i = n - 1; i >= 0; i--) {
      if (leftOut(a, i, i, pit, 2)) continue;
      if (i === 0 && a.star) { starPath(a, 0); continue; }
      ctx.moveTo(p[2 * i] + rad[i], p[2 * i + 1]);
      ctx.arc(p[2 * i], p[2 * i + 1], rad[i], 0, TAU);
    }
  }
  // A body's shadow moved (see drawShadows): its points, corners and radii
  // swapped for copies (in arrays kept for it, made again only for a longer
  // snake), each segment moved off by its lift (and with deep, all of it
  // down into the pit: only what's over one is drawn so, and moved alike,
  // its bands stay straight, quick rectangles) and sized as on the ground;
  // unshadow puts them back.
  let shP = new Float32Array(128), shC = new Float32Array(128), shR = new Float32Array(64), keptP = null, keptC = null, keptR = null;
  function shadowShape(a, deep) {
    const m = a.n, lift = a.lift, sink = a.sink, sw = a.liftSw, up = a.lifted, dx = deep ? DEEP_DX : 0, dy = deep ? DEEP_DY : 0;
    if (shR.length < m) { shP = new Float32Array(4 * m); shC = new Float32Array(4 * m); shR = new Float32Array(2 * m); }
    for (let i = 0; i < m; i++) {
      const l = up ? lift[i] : 0;
      shP[2 * i] = a.pts[2 * i] + l * LIFT_DX + dx;
      shP[2 * i + 1] = a.pts[2 * i + 1] + l * LIFT_DY + dy;
      shR[i] = a.rad[i] / (1 + l * sw) / (1 - sunk(sink[i])) * (1 - LIFT_SHRINK * l);
      if (i < m - 1) {
        const l2 = up ? (l + lift[i + 1]) / 2 : 0;
        shC[2 * i] = a.cor[2 * i] + l2 * LIFT_DX + dx;
        shC[2 * i + 1] = a.cor[2 * i + 1] + l2 * LIFT_DY + dy;
      }
    }
    keptP = a.pts; keptC = a.cor; keptR = a.rad;
    a.pts = shP; a.cor = shC; a.rad = shR;
    return true;
  }
  function unshadow(a) { a.pts = keptP; a.cor = keptC; a.rad = keptR; }
  // One snake's shadow on its own, as one translucent path (a corpse: it may
  // be fading, and it's drawn with its body).
  function drawShadow(a) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.translate(2, 4);
    silhouette(a, 0);
    ctx.translate(-2, -4);
  }

  // Pass 2: people's cream outline (yours bright with a soft halo, so you find
  // yourself at a glance; friends' plainer), or a dark body's pale rim. Each is
  // a slightly bigger copy of the body, so it follows the taper and every corner.
  const FRIEND_OUTLINE = '#cdbd9f', RIM = '#9a8069';
  // People share one face, so online seats differ by a marking as well as a
  // colour (lavender and sky look alike to many colour-blind players).
  const MARKS = { '#fde047': 'spots', '#c4b5fd': 'rings', '#7dd3fc': 'dots' };
  const markOf = color => MARKS[color] || '';
  // Holding a golden power: golden leaps or dashes, or the edges wrapping
  // round for it (fading calmly over its last WRAP_WARN_MS: no strobe).
  const powered = s => s.leaps > 0 || s.dashes > 0 || s.wrapUntil > shownTime;
  const wrapFade = s => Math.max(0, Math.min(1, (s.wrapUntil - shownTime) / T.WRAP_WARN_MS));
  const poweredFade = s => s.leaps > 0 || s.dashes > 0 ? 1 : wrapFade(s);
  const GOLD_EDGE = 3.9; // (how far the gold line and its ink reach outside a snake's own outline)
  // Power marks. Gold (Honey) is the family: a gold line round a snake says
  // it holds a power. Each kind adds an accent of its own, with a shape and
  // a motion, so it reads without its hue: jumps are sky (round pips),
  // flashes are ember (diamond pips, dashes running back along the gold
  // line, a streak), and the wrap is a glint running slowly round the gold.
  // Sky against ember is the pair colour-blind eyes tell apart best; the
  // accents appear on power marks only.
  const HONEY = '#fde68a', GLINT = '#fffbea';
  const SKY = '#a8dcf5', EMBER = '#f7a866', EMBER_LINE = '#b5531d'; // (sky's own line, #2f6f96, isn't needed: ink outlines every sky mark)
  const PIP_KEY = 0.9, PIP_RING = 2.3; // (a pip's parchment keyline reaches this far past its colour, and its ink past that, in units)
  let PIPS = new Float64Array(3 * (T.LEAP_MAX + T.DASH_MAX)); // (each pip's place and spoke, this frame)
  const RUN_DASH = [CELL * 0.14, CELL * 0.36], GLINT_DASH = [CELL * 1.4, CELL * 40]; // (ember dashes; a glint, alone)
  // Your soft halo: a few faint steps of cream round your body, each wider
  // and fainter than the last (a soft edge without a blur), and a touch more
  // round your head. [width or radius (cells), alpha] pairs, outermost first.
  const HALO = [1.42, 0.07, 1.22, 0.1, 1.04, 0.14], HALO_HEAD = [0.8, 0.07, 0.72, 0.1];
  function drawHalo(s, a) {
    if (!a.isPlayer || s.id !== viewerId) return;
    const was = ctx.globalAlpha;
    ctx.strokeStyle = ctx.fillStyle = '#fffbea';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    spine(a);
    for (let i = 0; i < HALO.length; i += 2) { ctx.globalAlpha = was * HALO[i + 1]; ctx.lineWidth = CELL * HALO[i]; ctx.stroke(); }
    for (let i = 0; i < HALO_HEAD.length; i += 2) { ctx.globalAlpha = was * HALO_HEAD[i + 1]; circle(a.pts[0], a.pts[1], CELL * HALO_HEAD[i]); }
    ctx.globalAlpha = was;
  }
  // (halo: false for a snake up in the air, whose halo went down with the
  // ground's outlines: see drawSnakes)
  function drawOutline(s, a, halo = true) {
    if (halo) drawHalo(s, a); // (your soft halo, so you find yourself at a glance)
    const own = edgeOf(s, a, false); // (the outline it has anyway)
    if (powered(s)) { // a golden power: a thin, opaque gold line round its own outline, inked outside so it reads on any colour
      const was = ctx.globalAlpha;
      ctx.globalAlpha = was * poweredFade(s);
      ctx.fillStyle = INK;
      outlineFills(a, own + GOLD_EDGE);
      ctx.fillStyle = HONEY; // (Honey: gold means a power)
      outlineFills(a, own + 2.5);
      if (s.alive && (s.dashes > 0 || s.wrapUntil > shownTime)) goldRuns(s, a, own);
      ctx.globalAlpha = was;
    }
    if (a.isPlayer) {
      ctx.fillStyle = s.id === viewerId ? '#fffef8' : FRIEND_OUTLINE;
      outlineFills(a, own);
    } else if (a.rim) {
      ctx.fillStyle = RIM;
      outlineFills(a, own);
    }
  }
  // Along the gold line, in its own shape (the body and any outline of its
  // own cover the rest): for golden flashes, short ember dashes running back
  // from the head over its first few segments, as if it's going fast; for the
  // wrap, a slow glint running down it, fading with the gold over its last
  // WRAP_WARN_MS. Each is clipped to the few segments it's on (a whole long
  // body's shape as a clip cost the GPU several ms a frame). With reduced
  // motion they hold still.
  const RUN_SEGS = 6, GLINT_GAP = 6, GLINT_SPEED = 3; // (segments the dashes run along; cells between one glint and the next; cells a second)
  function goldRuns(s, a, own) {
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    if (s.dashes > 0) {
      const i1 = Math.min(a.n - 1, RUN_SEGS);
      ctx.save();
      shape(a, own + 2.5, 0, i1);
      ctx.clip();
      spine(a, 0, i1);
      ctx.lineWidth = CELL * 1.8;
      ctx.strokeStyle = EMBER_LINE;
      ctx.setLineDash(RUN_DASH);
      ctx.lineDashOffset = reduced ? 0 : -lastNow * CELL / 260;
      ctx.stroke();
      ctx.restore();
    }
    if (s.wrapUntil > shownTime && a.n > 1) {
      const g = reduced ? 1 : (lastNow / 1000 * GLINT_SPEED) % (a.n - 1 + GLINT_GAP); // (how far down it the glint is, in segments)
      if (g < a.n - 1) {
        const i0 = Math.max(0, Math.floor(g) - 1), i1 = Math.min(a.n - 1, Math.floor(g) + 2), was = ctx.globalAlpha;
        ctx.save();
        shape(a, own + 2.5, i0, i1);
        ctx.clip();
        spine(a, i0, i1);
        ctx.globalAlpha = s.leaps > 0 || s.dashes > 0 ? was * wrapFade(s) : was; // (the gold itself fades with it when the wrap is all it holds)
        ctx.lineWidth = CELL * 1.8;
        ctx.strokeStyle = GLINT;
        ctx.setLineDash(GLINT_DASH);
        ctx.lineDashOffset = GLINT_DASH[0] / 2 - (g - i0) * CELL; // (the glint's middle at g)
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  // An opaque outline: fast separate fills, unless it's being drawn see-through
  // (a corpse fading), where overlapping pieces would show.
  const outlineFills = (a, grow) => ctx.globalAlpha < 1 ? silhouette(a, grow) : bodyFills(a, grow);
  // How far a snake's drawn shape reaches beyond its body (units): its own
  // outline (people's cream, a dark body's rim), and with gold, its gold line.
  function edgeOf(s, a, gold = true) {
    const own = a.isPlayer ? (s.id === viewerId ? 3.5 : 2.5) : a.rim ? 1.5 : 0;
    return gold && powered(s) ? own + GOLD_EDGE : own;
  }

  // Pass 3: the body (bands, then circles tail to head, so the head ends up on
  // top), its pattern and its face.
  function drawBody(s, a, now, dead) {
    const { n, pts, rad, fills, look, color } = a;
    // Segments: narrower bands joining them, then a round one per cell.
    // (Bands as rectangles, fillRect's fast path; folding them into each
    // segment's circle as one shape measured slower.)
    for (let i = n - 2; i >= 0; i--) { ctx.fillStyle = fills[i + 1]; band(a, i, rad[i + 1] * PINCH); }
    if (a.bridging && !dead) shadeBands(a); // (over a pit: shaded underneath, along the bands too)
    for (let i = n - 1; i >= 0; i--) {
      if (i < n - 1 && bends(a, i)) { ctx.fillStyle = fills[i + 1]; circle(a.cor[2 * i], a.cor[2 * i + 1], rad[i + 1] * PINCH); }
      if (i === 0 && a.star) break; // (a star's head is drawn with its face)
      ctx.fillStyle = fills[i];
      circle(pts[2 * i], pts[2 * i + 1], rad[i]);
    }
    if (a.bridging && !dead) shadeUnder(a); // (over a pit: shaded underneath, a hanging tail darker)

    // A little roundness on every segment (light from the top left): separate
    // circles, which never touch (a tail that's just grown sits on the segment
    // before it for a moment: that one's lit once).
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    let lx = -1e9, ly = -1e9, lr = 0;
    for (let i = a.star ? 1 : 0; i < n; i++) {
      const hr = rad[i] * 0.35, hx = pts[2 * i] - rad[i] * 0.3, hy = pts[2 * i + 1] - rad[i] * 0.35;
      if (Math.abs(hx - lx) + Math.abs(hy - ly) < hr + lr) continue;
      circle(hx, hy, hr);
      lx = hx; ly = hy; lr = hr;
    }

    // Patterns. Each follows the skin (by segment), not the board.
    if (a.isPlayer) {
      const mark = MARKS[color];
      if (mark === 'rings') {
        ctx.strokeStyle = 'rgba(58,38,20,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 1; i < n; i++) { const r = rad[i] * 0.55; ctx.moveTo(pts[2 * i] + r, pts[2 * i + 1]); ctx.arc(pts[2 * i], pts[2 * i + 1], r, 0, TAU); }
        ctx.stroke();
      } else if (mark) {
        ctx.fillStyle = 'rgba(58,38,20,0.45)';
        for (let i = 1; i < n; i++) {
          const x = pts[2 * i], y = pts[2 * i + 1], r = rad[i];
          if (mark === 'dots') circle(x, y, r * 0.3);
          else { circle(x - r * 0.38, y + r * 0.12, r * 0.17); circle(x + r * 0.38, y - r * 0.12, r * 0.17); }
        }
      }
    }
    if (s.personaKey === 'wildcard' && n > 2) {
      ctx.fillStyle = '#ffffff'; // stars on the blue
      for (let i = 2; i < Math.min(4, n); i++) for (const [dx, dy] of STARS) star(pts[2 * i] + dx * rad[i], pts[2 * i + 1] + dy * rad[i], rad[i] * 0.2);
      drawTie(a);
    }
    if (look === 'mason') { // Caesar in marble: grey veins wandering across every segment, now and then a gold one
      ctx.lineCap = 'round'; // (as the veins always left it, for the wreath)
      for (let i = 1; i < n; i++) {
        // (each segment's own sprite, drawn at the segment's size before any gulp, and scaled)
        const rb = Math.round(CELL * (0.44 - 0.1 * (i / (n - 1)))), sp = veinSprite(i, rb), h = (rb + 2) * rad[i] / rb;
        ctx.drawImage(sp, pts[2 * i] - h, pts[2 * i + 1] - h, 2 * h, 2 * h);
      }
    } else if (look === 'ouroboros') { // a python's back: a dark diamond on every segment, a pale fleck in each
      ctx.fillStyle = 'rgba(58,36,8,0.75)';
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const x = pts[2 * i], y = pts[2 * i + 1], d = rad[i] * 0.62;
        ctx.moveTo(x, y - d); ctx.lineTo(x + d, y); ctx.lineTo(x, y + d); ctx.lineTo(x - d, y); ctx.closePath();
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(253,230,138,0.6)';
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const x = pts[2 * i], y = pts[2 * i + 1], d = rad[i] * 0.2;
        ctx.moveTo(x, y - d); ctx.lineTo(x + d, y); ctx.lineTo(x, y + d); ctx.lineTo(x - d, y); ctx.closePath();
      }
      ctx.fill();
    } else if (look === 'colonist') { // a redcoat's cross-belts: a cream strap zig-zagging down the body
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 3;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const x = pts[2 * i], y = pts[2 * i + 1], d = rad[i] * 0.66;
        if (i % 2) { ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); }
        else { ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); }
      }
      ctx.stroke();
    }
    if (s.personaKey === 'copycat') { // dashed rings: a copy of someone
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash(DASH);
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const r = rad[i] - 2;
        ctx.moveTo(pts[2 * i] + r, pts[2 * i + 1]);
        ctx.arc(pts[2 * i], pts[2 * i + 1], r, 0, TAU);
      }
      ctx.stroke();
      ctx.setLineDash(NO_DASH);
    }
    if (s.personaKey === 'capricious') { // always findable, whatever the mood: a pink ring that breathes, pale dashes running round it
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pts[0], pts[1], rad[0] + 2.5 + (reduced ? 0 : Math.sin(now / 240) * 1.2), 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = '#fdf2f8';
      ctx.setLineDash(MOOD_DASH);
      ctx.lineDashOffset = reduced ? 0 : -now / 35;
      ctx.stroke();
      ctx.setLineDash(NO_DASH);
      ctx.lineDashOffset = 0;
    }
    if (a.star && !dead) shedTwinkle(s, a, now);

    // Head features, drawn in a frame where +x points the way the snake faces.
    const blinking = dead || now < a.blinkUntil;
    if (!dead && now > a.nextBlink) {
      a.blinkUntil = now + T.BLINK_MS;
      a.nextBlink = now + T.BLINK_MIN + Math.random() * (T.BLINK_MAX - T.BLINK_MIN);
    }
    if (!dead) updateGaze(s, look, a, now); // (it's turned in prepare: see steer)
    const dizzy = !dead && s.stunUntil >= game.tick; // (stunned: its head wobbles, and stars go round it, until the tick it moves again)
    const q = dead ? null : queuedOf(s, a), lean = dead ? 0 : leanOf(s, a, q);
    if (a.star) { const h = starFace(a) + lean; headCos = Math.cos(h); headSin = Math.sin(h); } // (a star's face is upright, whichever way it heads)
    else if (lean) { const h = Math.atan2(a.hs, a.hc) + lean; headCos = Math.cos(h); headSin = Math.sin(h); }
    else { headCos = a.hc; headSin = a.hs; }
    gazeX = a.gx * headCos + a.gy * headSin; // the gaze, turned into the face's frame
    gazeY = -a.gx * headSin + a.gy * headCos;
    deadNow = dead;
    if (a.star) drawStarHead(s, a, now, dead); // (its head: a star, its points turned with its heading, its mustache upright with its face)
    ctx.save();
    ctx.translate(pts[0], pts[1]);
    ctx.rotate((a.star ? a.face : a.turn) + lean); // (and stunned, its wobble: see prepare)
    const faceScale = 1.1 * (1 + a.bump) * (1 + a.swell);
    ctx.scale(faceScale * (1 - 0.22 * a.squash), faceScale * (1 + 0.12 * a.squash)); // (come down from a jump: squashed along the way it's going, a moment)
    if (!dead) gagCheeks(a, fills[0], now); // (choking on its own bead: a quick puff of its cheeks)
    if (a.isPlayer) drawPlayerFace(s, a, now, blinking);
    else drawFace(s, look, color, blinking, a);
    if (!dead && a.coughing) drawCough(a, now); // (and then its cough)
    ctx.restore();

    // Golden powers held: a pip for each on a short arc behind the head,
    // turned with it: round, in sky, for a golden leap; a diamond, in ember,
    // for a dash. Holding both, the leaps go on its left and the dashes on
    // its right, a gap between. The gold outline carries the glow; no ring
    // of its own. Three or more don't fit in the neck's pinch (the outer two
    // sat across its outline), so they go a little further back, over the
    // first segment, where the body's widest. Each is ringed in parchment
    // inside an ink line, so it reads on any body (ember on Gobbler's
    // orange, sky on Metagamer's cyan), and a diamond points along the arc's
    // spokes, so side by side they never touch (three of them read as a
    // zigzag seam). At the board's edge the arc swings round the head onto
    // the board, so none is cut off and none lands on the head (on a phone
    // the tag hides the counts: the pips are them).
    const leaps = dead ? 0 : s.leaps, dashes = dead ? 0 : s.dashes;
    if (leaps || dashes) drawPips(pts[0], pts[1], Math.atan2(a.hs, a.hc) + Math.PI, a.star ? rad[0] * STAR_TIP : rad[0], a.swell, leaps, dashes, !a.offs); // (not across a wrapped edge: there it shows at the other)
    if (!dead && s.id === viewerId && game) drawRests(s, a, now);
    if (dizzy) { // three stars going round, cream and inked (gold by a head means a power), clear of its pips and the edge: see starsOff
      const t = reduced ? 0 : now / 240, cy = pts[1] + starsOff(s);
      ctx.fillStyle = '#fffbea';
      ctx.strokeStyle = 'rgba(58,38,20,0.85)';
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) {
        const a2 = t + i * TAU / 3;
        star(pts[0] + Math.cos(a2) * CELL * 0.55, cy + Math.sin(a2) * CELL * 0.18, CELL * 0.22);
        ctx.stroke();
      }
    }

    // Capricious: a ring that flashes out when its mood changes.
    if (!reduced && s.personaKey === 'capricious' && s.memory.moodChangedAt != null && game) {
      const age = Math.max(0, shownTime - s.memory.moodChangedAt); // (it may have changed its mind ahead of the tick that shows it)
      if (age < T.MOOD_RING_MS) {
        ctx.strokeStyle = color;
        ctx.globalAlpha *= 1 - age / T.MOOD_RING_MS;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pts[0], pts[1], CELL * (0.6 + 1.6 * age / T.MOOD_RING_MS), 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  const DASH = [3, 3], NO_DASH = [], MOOD_DASH = [5, 7];
  // A body over a pit (see sinkOf): with nothing under it to light it from
  // below, its side away from the light (down and to the right) is in shade,
  // the more the further over the pit it is; and a tail end hanging into the
  // pit darkens the deeper it hangs. Drawn over its segments as they are,
  // before their sheen and markings: each one over the pit again in a darker
  // step of its own colour, then in its own colour a little up and to the
  // left and smaller, leaving a crescent of shade along its lower right; and
  // a strip of shade as wide along the bands between them (shadeBands), so
  // it runs on along its underside (crescents on the segments alone read as
  // darker beads on a phone). (Two circles a segment and a rectangle a
  // band, the GPU's quickest shapes, and no clip: a clip to a body's shape
  // costs it dearly. Each step of shade is a cached colour, four of them.)
  const UNDER = '#140a04', UNDER_DARK = 0.42, UNDER_IN = 0.11; // (the shade at its darkest; how far its lit part moves in, in radii)
  const shadeOf = (c, o) => mix(c, UNDER, Math.ceil(o * 4) / 4 * UNDER_DARK);
  function shadeBands(a) { // (the bands: after the bands are drawn, before the segments, which cover their ends; a strip of shade along each one's lower side, or its right one going down, as wide as a segment's crescent at its lowest)
    const { n, rad, fills, hang, pts: p, cor: c } = a;
    for (let i = n - 2; i >= 0; i--) {
      const o = (hang[i] + hang[i + 1]) / 2;
      if (o < 0.02) continue;
      const h = rad[i + 1] * PINCH, s = rad[i + 1] * UNDER_IN * (1 + Math.SQRT2);
      ctx.fillStyle = shadeOf(fills[i + 1], o);
      const x1 = p[2 * i], y1 = p[2 * i + 1], qx = c[2 * i], qy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
      if ((near(x1, qx) && near(qx, x2)) || (near(y1, qy) && near(qy, y2))) shadeStrip(x1, y1, x2, y2, h, s); // (straight: one piece)
      else { shadeStrip(x1, y1, qx, qy, h, s); shadeStrip(qx, qy, x2, y2, h, s); }
    }
  }
  function shadeStrip(x1, y1, x2, y2, h, s) {
    if (near(y1, y2)) { if (!near(x1, x2)) ctx.fillRect(Math.min(x1, x2), y1 + h - s, Math.abs(x2 - x1), s); }
    else if (near(x1, x2)) ctx.fillRect(x1 + h - s, Math.min(y1, y2), s, Math.abs(y2 - y1));
  }
  function shadeUnder(a) {
    const { n, pts, rad, fills, hang, sink } = a;
    for (let i = n - 1; i >= 0; i--) {
      const o = hang[i];
      if (o < 0.02 || (i === 0 && a.star)) continue; // (a star's head is drawn with its face)
      const x = pts[2 * i], y = pts[2 * i + 1], r = rad[i], d = r * UNDER_IN;
      ctx.fillStyle = shadeOf(fills[i], o);
      circle(x, y, r);
      ctx.fillStyle = fills[i];
      circle(x - d, y - d, r - d * Math.SQRT2);
    }
    ctx.fillStyle = UNDER;
    for (let i = 0; i < n; i++) {
      if (sink[i] <= SAG) continue;
      ctx.globalAlpha = Math.min(1, (sink[i] - SAG) / (1 - SAG)) * 0.7; // (hanging into the pit: darker, the deeper)
      circle(pts[2 * i], pts[2 * i + 1], rad[i]);
    }
    ctx.globalAlpha = 1;
  }

  // The pips of golden powers held (see drawBody), round a head at (x, y)
  // of radius hr, on the arc behind it (back: that way, as an angle; swell:
  // its leap's). With keepOn, kept on the board: see placePips.
  function drawPips(x, y, back, hr, swell, leaps, dashes, keepOn) {
    const n = placePips(x, y, back, hr, swell, leaps, dashes, keepOn);
    for (let i = 0; i < n; i++) drawPip(PIPS[3 * i], PIPS[3 * i + 1], PIPS[3 * i + 2], PIP_R, i < leaps);
  }
  // Where those pips go, into PIPS (each one's place and spoke), their
  // colour's radius into PIP_R; returns how many. With keepOn, where the arc
  // behind the head would leave the board (a head that's just turned off an
  // edge, or at a corner), it swings round the head toward the board's
  // middle, as little as it takes to come on, staying as far from the head
  // as ever: never over it, or its eyes (moving the arc in slid it across
  // the head). Only if no swing brings it all on (many pips in a corner)
  // does it move in as well, from the swing that leaves least off, which
  // takes it away from the head. PIP_MOVED: it swung, or moved.
  let PIP_R = 0, PIP_MOVED = false, PIP_SX = 0, PIP_SY = 0;
  const PIP_SWING = 0.05; // (radians a step, swinging round)
  function placePips(x, y, back, hr, swell, leaps, dashes, keepOn) {
    const n = leaps + dashes, many = n > 2, rr = (many ? Math.max(CELL, hr + CELL * 0.2) : hr + CELL * 0.2) * (1 + swell * 0.5);
    const step = many ? 0.44 : 0.78, gap = leaps && dashes ? (many ? 0.35 : 0.6) : 0, mid = (n - 1 + gap) / 2;
    const pr = PIP_R = CELL * (many ? 0.12 : 0.14), edge = (pr + PIP_RING) * 1.5 + 1; // (as far as one reaches from its centre, and a unit to spare)
    if (PIPS.length < 3 * n) PIPS = new Float64Array(3 * n);
    PIP_MOVED = false;
    let off = pipArc(x, y, back, rr, n, leaps, step, gap, mid, edge);
    if (!keepOn || !off) return n;
    const way = Math.cos(back) * (SIZE / 2 - y) - Math.sin(back) * (SIZE / 2 - x) >= 0 ? 1 : -1; // (turning by + takes it toward the middle)
    let least = off, best = 0;
    for (let j = 1; off && j * PIP_SWING <= Math.PI; j++) {
      for (let side = 0; side < 2 && off; side++) {
        const turn = (side ? -way : way) * j * PIP_SWING;
        off = pipArc(x, y, back + turn, rr, n, leaps, step, gap, mid, edge);
        if (off < least) { least = off; best = turn; }
      }
    }
    if (off) { pipArc(x, y, back + best, rr, n, leaps, step, gap, mid, edge); for (let i = 0; i < n; i++) { PIPS[3 * i] += PIP_SX; PIPS[3 * i + 1] += PIP_SY; } }
    PIP_MOVED = true;
    return n;
  }
  // The arc of n pips at radius rr round (x, y), its middle at angle ang,
  // into PIPS; returns how far it's off the board (0: it's on), and the
  // move that would bring it on into PIP_SX, PIP_SY.
  function pipArc(x, y, ang, rr, n, leaps, step, gap, mid, edge) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < n; i++) {
      const a2 = ang + (mid - i - (i < leaps ? 0 : gap)) * step, px = x + Math.cos(a2) * rr, py = y + Math.sin(a2) * rr;
      PIPS[3 * i] = px; PIPS[3 * i + 1] = py; PIPS[3 * i + 2] = a2;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    PIP_SX = Math.max(0, edge - x0) - Math.max(0, x1 - (SIZE - edge)); PIP_SY = Math.max(0, edge - y0) - Math.max(0, y1 - (SIZE - edge));
    return Math.abs(PIP_SX) + Math.abs(PIP_SY);
  }
  // One pip at (x, y), its spoke at angle a2, its colour pr in radius: a
  // sky disc for a leap, an ember diamond (its long way along the spoke) for
  // a dash; ringed in parchment, then ink.
  function drawPip(x, y, a2, pr, leap) {
    const ux = Math.cos(a2), uy = Math.sin(a2);
    for (let k = 0; k < 3; k++) {
      const r = pr + (k === 0 ? PIP_RING : k === 1 ? PIP_KEY : 0);
      ctx.fillStyle = k === 0 ? INK : k === 1 ? GLINT : leap ? SKY : EMBER;
      ctx.beginPath();
      if (leap) ctx.arc(x, y, r, 0, TAU);
      else {
        ctx.moveTo(x + ux * r * 1.5, y + uy * r * 1.5); ctx.lineTo(x - uy * r * 0.95, y + ux * r * 0.95);
        ctx.lineTo(x - ux * r * 1.5, y - uy * r * 1.5); ctx.lineTo(x + uy * r * 0.95, y - ux * r * 0.95); ctx.closePath();
      }
      ctx.fill();
    }
  }

  // Your two plain rests, as two half-rings round your head, fixed to the
  // screen: your jump's on the left, in sky, and your flash's on the right,
  // in ember. Each shows while it rests, filling from the bottom (a faint
  // track shows how far it has to go), and gives one bright flick when it's
  // back. Where you're looking, not only on your tag. (Holding golden leaps
  // or dashes, that press is ready anyway: no half-ring for it.)
  const REST_GAP = 0.36; // (radians left clear at the top and the bottom, between the halves)
  function drawRests(s, a, now) {
    const x = a.pts[0], y = a.pts[1], rr = a.rad[0] + CELL * 0.3;
    const canJump = !s.leaps && s.body.length > T.MIN_LENGTH, canFlash = !s.dashes && (T.FLASH_COST <= 0 || s.body.length > T.MIN_LENGTH);
    const jump = canJump && shownTime < s.leapReadyAt, flash = canFlash && shownTime < s.flashReadyAt;
    if (a.jc && !jump && canJump && !(now - a.readyAt < 600)) a.readyAt = now; // (back: the flick)
    if (a.fc && !flash && canFlash && !(now - a.flashFx < 600)) a.flashFx = now;
    a.jc = jump; a.fc = flash;
    if (jump) restHalf(x, y, rr, -1, 1 - (s.leapReadyAt - shownTime) / T.LEAP_COOLDOWN_MS, SKY);
    if (flash) restHalf(x, y, rr, 1, 1 - (s.flashReadyAt - shownTime) / T.FLASH_COOLDOWN_MS, EMBER);
    if (a.readyAt && now - a.readyAt < 450) restFlick(x, y, rr, -1, (now - a.readyAt) / 450, SKY);
    if (now - a.flashFx < 450) restFlick(x, y, rr, 1, (now - a.flashFx) / 450, EMBER);
  }
  // A half-ring round (x, y) on the left (side -1) or right (1), from the
  // bottom up to k of the way to the top (the path only).
  function halfArc(x, y, r, side, k) {
    const g = REST_GAP / 2, a0 = Math.PI / 2 - side * g;
    ctx.beginPath();
    ctx.arc(x, y, r, a0, a0 - side * (Math.PI - 2 * g) * Math.max(0, Math.min(1, k)), side > 0);
  }
  function restHalf(x, y, r, side, k, col) {
    ctx.lineCap = 'round';
    halfArc(x, y, r, side, 1); // (the track)
    ctx.strokeStyle = 'rgba(58,38,20,0.45)';
    ctx.lineWidth = 4.4;
    ctx.stroke();
    if (k <= 0) return;
    halfArc(x, y, r, side, k);
    ctx.strokeStyle = 'rgba(58,38,20,0.85)';
    ctx.lineWidth = 5.6;
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.2;
    ctx.stroke();
  }
  // Back: the whole half-ring, bright, going out on its side and fading (with
  // reduced motion it stays where it is, fading).
  function restFlick(x, y, r, side, t, col) {
    const was = ctx.globalAlpha;
    ctx.lineCap = 'round';
    halfArc(x, y, r + (reduced ? 0 : CELL * 0.5 * t), side, 1);
    ctx.globalAlpha = was * (1 - t);
    ctx.strokeStyle = col;
    ctx.lineWidth = 5 * (1 - t) + 2;
    ctx.stroke();
    ctx.strokeStyle = GLINT;
    ctx.lineWidth = 2.5 * (1 - t) + 1;
    ctx.stroke();
    ctx.globalAlpha = was;
  }

  // Where a stunned snake's stars go round, as an offset down the screen
  // from its head: above it, as in any cartoon, unless that's where its pips
  // are (heading down, they're behind it) or off the board; then below it.
  // With its pips below and the edge above, below past its pips. Pips swung
  // round at the board's edge (see placePips): on the side they don't
  // reach, or past them. Judged by its cell and the way it's going, which a
  // stun doesn't change, so they never jump sides mid-stun. (Bonk! keeps
  // clear of them: see onTick.)
  const STAR_REACH = CELL * 0.42; // (how far the stars reach up and down from their centre)
  function starsOff(s) {
    const pips = s.leaps + s.dashes, h = s.body[0], hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2, star = !!anim.get(s)?.star;
    const more = star ? CELL * 0.26 : 0, nigh = CELL * 0.72 + more; // (a star's points reach further than a round head: its stars go round further out)
    let up = 0, down = 0, moved = false;
    if (pips) { // (where its pips are, its head in its cell)
      const n = placePips(hx, hy, Math.atan2(-s.dir.y, -s.dir.x), CELL * 0.54 * (star ? STAR_TIP : 1), 0, s.leaps, s.dashes, !anim.get(s)?.offs), reach = (PIP_R + PIP_RING) * 1.5;
      moved = PIP_MOVED;
      for (let i = 0; i < n; i++) { up = Math.max(up, hy - PIPS[3 * i + 1] + reach); down = Math.max(down, PIPS[3 * i + 1] - hy + reach); }
    }
    let past = 0;
    for (let sgn = -1; sgn <= 1; sgn += 2) {
      let behind, off;
      if (moved) { // (clear of them)
        const clear = (sgn < 0 ? up : down) + STAR_REACH;
        behind = clear > nigh; // (its pips are on this side)
        off = sgn * Math.max(nigh, clear);
      } else {
        behind = pips && s.dir.y === -sgn;
        off = sgn * (CELL * (behind ? (pips > 2 ? 1.78 : 1.44) : pips && !s.dir.y ? (pips > 4 ? 1.5 : pips > 3 ? 1.3 : 1.02) : 0.72) + more); // (higher when pips show beside its head, higher still for both kinds' wider arc; further past three, which sit further back)
      }
      if (hy + off < STAR_REACH || hy + off > SIZE - STAR_REACH) continue;
      if (!behind) return off;
      past ||= off;
    }
    return past || -nigh;
  }

  // A turn you've pressed (q) that the drawing doesn't show yet: the head
  // leans a little the way it'll go, from the press on (the eyes look there:
  // see updateGaze; stunned, a chevron shows it too: see drawPress), so you
  // can see the press was heard before the tick takes it. Once the head's
  // drawn heading that way (past its cell's centre: see prepare), the lean
  // goes. Eased; held still with reduced motion (it's news, not wobble).
  const LEAN = 0.38;
  function leanOf(s, a, q) {
    const to = q ? (a.tdx * q.y - a.tdy * q.x) * LEAN : 0;
    a.lean = reduced ? to : a.lean + (to - a.lean) * (1 - Math.exp(-frameDt / T.FACE_EASE_MS));
    return Math.abs(a.lean) < 0.002 ? 0 : a.lean;
  }
  // The way you've pressed to go that the drawing doesn't show yet (yours
  // only: it answers your press). On the move: the first turn queued that
  // isn't the way your head's drawn heading (following the queue as it
  // changes), or online, your press as this screen saw it (see pressed).
  // Stunned: the way you'll go when the stun's over, if you've said (a turn,
  // or ahead for a jump or a flash asked for), until the tick it moves, as
  // the stars. Nothing for a press the game didn't take.
  function queuedOf(s, a) {
    if (s.id !== viewerId || !game) return null;
    if (s.stunUntil >= game.tick) {
      if (press.stun === s.stunUntil) return press.dir || (s.leapArmed >= s.stunUntil || s.flashArmed >= s.stunUntil ? s.dir : null);
      if (s.queue?.length) return s.queue[0];
      return s.leapArmed >= s.stunUntil || s.flashArmed >= s.stunUntil ? s.dir : null;
    }
    const q = s.queue;
    if (q?.length) {
      for (let i = 0; i < q.length; i++) if (q[i].x !== a.tdx || q[i].y !== a.tdy) return intoNeck(s, q[i]) ? null : q[i];
      return null;
    }
    return heardOf(s) && (press.dir.x !== a.tdx || press.dir.y !== a.tdy) ? press.dir : null;
  }
  // A press, as this screen saw it (the game says as it takes one: online
  // the queue is the host's, so a friend's screen never has it, and the
  // host's own press waits a round trip). Taken as the game takes it: never
  // into the neck, and the way you're already going is nothing; the latest
  // wins. Stunned, a press is for this stun only, and the way you were going
  // after a turn changes your mind back. A crash forgets one on the move.
  const press = { dir: null, stun: -1, tick: -1 };
  function pressed(dir) {
    const s = game && findById(viewerId);
    if (!dir || !s || !s.alive) { press.dir = null; press.stun = -1; press.tick = -1; return; }
    if (intoNeck(s, dir)) return; // (into its neck: nothing)
    const ahead = dir.x === s.dir.x && dir.y === s.dir.y;
    if (s.stunUntil < game.tick) { // (on the move)
      if (ahead) return;
      press.dir = dir; press.stun = -1; press.tick = game.tick;
      return;
    }
    const turned = press.stun === s.stunUntil ? !!press.dir && !(press.dir.x === s.dir.x && press.dir.y === s.dir.y) : s.queue?.length > 0;
    if (ahead && !turned) return;
    press.dir = ahead ? null : dir;
    press.stun = s.stunUntil; press.tick = game.tick;
  }
  // Stunned, with a turn pressed: a small inked chevron on that side of your
  // head (past the stars, if they're there; on the board, even pointing off
  // it), so the press shows as heard, and where it'll take you. (The eyes
  // look that way too, and the head leans.) With a jump or a flash asked for
  // (it goes the way you go), its own mark there instead, a little further
  // out (it's longer), in its accent (a golden one's in Honey). Asked both,
  // the jump's, if it can go that way when the stun's over (the game hops
  // first), else the flash's. Over every snake and word: ahead, it's over
  // what you hit, and the Bonk! there.
  function drawPress() {
    const s = findById(viewerId), a = s && s.alive && s.stunUntil >= game.tick ? anim.get(s) : null;
    const q = a && a.n ? queuedOf(s, a) : null;
    if (!q) return;
    const jump = s.leapArmed >= s.stunUntil, at = game.time + Math.max(0, s.stunUntil - game.tick) * (timeAt - timeFrom || T.START_TICK); // (the game's clock when it moves again)
    const flash = s.flashArmed >= s.stunUntil && !(jump && hops(s, s.body[0], q, at)), power = flash || jump;
    const pts = a.pts, so = starsOff(s);
    const d = (q.y && (so < 0) === (q.y < 0) ? Math.abs(so) + CELL * 0.62 : CELL * 0.95) + (power ? CELL * (flash ? 0.18 : 0.28) : 0);
    const w = CELL * 0.2, m = CELL * 0.12;
    const cx = Math.min(SIZE - m, Math.max(m, pts[0] + q.x * d)), cy = Math.min(SIZE - m, Math.max(m, pts[1] + q.y * d));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (power) pressMark(cx, cy, q, flash);
    else {
      ctx.moveTo(cx - q.x * w + q.y * w, cy - q.y * w + q.x * w);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx - q.x * w - q.y * w, cy - q.y * w - q.x * w);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = CELL * 0.17; ctx.stroke();
    ctx.strokeStyle = !power ? GLINT : (flash ? s.dashes : s.leaps) > 0 ? HONEY : flash ? EMBER : SKY; ctx.lineWidth = CELL * 0.09; ctx.stroke();
  }
  // A power asked for, as a mark where the chevron would go (its tip at x,
  // y, pointing along q), added to the current path: the jump's hop, as on
  // its chip (an arc up and over, ending in an arrowhead), or the flash's
  // double chevron.
  function pressMark(x, y, q, dash) {
    const w = CELL * 0.2;
    if (dash) {
      for (let i = 0; i < 2; i++) {
        const tx = x - q.x * w * 0.95 * i, ty = y - q.y * w * 0.95 * i;
        ctx.moveTo(tx - q.x * w + q.y * w, ty - q.y * w + q.x * w);
        ctx.lineTo(tx, ty);
        ctx.lineTo(tx - q.x * w - q.y * w, ty - q.y * w - q.x * w);
      }
      return;
    }
    // (up the screen for a turn across it, to the left for one up or down: never upside down)
    const bx = -Math.abs(q.y), by = -Math.abs(q.x), span = w * 1.25, rise = w * 1.5;
    const x0 = x - q.x * span * 2, y0 = y - q.y * span * 2, x1 = x, y1 = y; // (from behind, landing at the tip)
    const kx = (x0 + x1) / 2 + bx * rise, ky = (y0 + y1) / 2 + by * rise;
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(kx, ky, x1, y1);
    const ux = x1 - kx, uy = y1 - ky, ul = Math.hypot(ux, uy) || 1, ah = w * 0.75; // (the arrowhead, along the way it comes down)
    for (const sg of SIDES2) {
      const c = Math.cos(2.5 * sg), sn = Math.sin(2.5 * sg), ax = (ux * c - uy * sn) / ul, ay = (ux * sn + uy * c) / ul;
      ctx.moveTo(x1 + ax * ah, y1 + ay * ah);
      ctx.lineTo(x1, y1);
    }
  }

  // Marble veins across a disc (centre x, y, radius r), their own way for
  // each segment i: a long wandering one and a short faint one beside it,
  // added to g's current path.
  function marbleVein(g, x, y, r, i) {
    const a = i * 2.39996, f = i % 2 ? 1 : -1;
    const arc = (a0, a1, bend, reach) => {
      const x0 = x + Math.cos(a0) * r * reach, y0 = y + Math.sin(a0) * r * reach;
      const x1 = x + Math.cos(a1) * r * reach, y1 = y + Math.sin(a1) * r * reach;
      const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
      g.moveTo(x0, y0);
      g.quadraticCurveTo(mx, my, x1, y1);
    };
    arc(a, a + 2.6, 0.35 * f, 0.85);
    arc(a + 3.6, a + 4.7, -0.5 * f, 0.7);
  }
  // Segment i's veins (radius r, whole units) as a sprite: curves are
  // triangulated every frame they're stroked, a sprite is one blit. A sprite
  // a segment, since each wanders its own way (a few hundred at most: a long
  // Mason grows a few sizes over a round).
  const veinSprites = new Map(); // i * 64 + r -> canvas
  function veinSprite(i, r) {
    const key = i * 64 + r;
    let s = veinSprites.get(key);
    if (s) return s;
    if (veinSprites.size >= 800) veinSprites.clear();
    const half = r + 2, px = Math.max(2, Math.ceil(2 * half * k)), g = (s = makeLayer(px, px)).getContext('2d');
    g.setTransform(px / (2 * half), 0, 0, px / (2 * half), px / 2, px / 2);
    g.lineCap = 'round';
    g.strokeStyle = i % 4 === 3 ? 'rgba(201,162,39,0.75)' : 'rgba(100,116,139,0.55)';
    g.lineWidth = i % 4 === 3 ? 1.1 : 1.4;
    g.beginPath();
    marbleVein(g, 0, 0, r, i);
    g.stroke();
    veinSprites.set(key, s);
    return s;
  }

  const STARS = [[-0.45, -0.45], [0.45, -0.45], [0, 0], [-0.45, 0.45], [0.45, 0.45]];
  function star(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.fill();
  }

  // Wildcard's long red tie: knotted under the chin, down over the collar and
  // on along the body, bending with it.
  function drawTie(a) {
    const p = a.pts, c = CELL;
    const alen = Math.hypot(p[2] - p[0], p[3] - p[1]) || 1, ax = (p[2] - p[0]) / alen, ay = (p[3] - p[1]) / alen;
    const blen = Math.hypot(p[4] - p[2], p[5] - p[3]) || 1, bx = (p[4] - p[2]) / blen, by = (p[5] - p[3]) / blen;
    // From the chin (just inside the head's edge) to the collar...
    const kx = p[0] + ax * c * 0.45, ky = p[1] + ay * c * 0.45;
    const mx = p[2], my = p[3];
    // ...then on toward the next segment, ending in a point.
    const end = Math.min(blen, c * 0.85), ex = mx + bx * end, ey = my + by * end;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    tieQuad(kx, ky, c * 0.07, mx, my, c * 0.12, ax, ay);
    tieQuad(mx, my, c * 0.12, ex - bx * c * 0.12, ey - by * c * 0.12, c * 0.15, bx, by);
    ctx.fill();
    circle(mx, my, c * 0.12); // (smooth where it bends)
    ctx.beginPath(); // the point
    ctx.moveTo(ex - bx * c * 0.12 - by * c * 0.15, ey - by * c * 0.12 + bx * c * 0.15);
    ctx.lineTo(ex, ey);
    ctx.lineTo(ex - bx * c * 0.12 + by * c * 0.15, ey - by * c * 0.12 - bx * c * 0.15);
    ctx.fill();
    ctx.fillStyle = '#991b1b'; // the knot
    circle(kx, ky, c * 0.08);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; // a sheen down the middle
    ctx.lineWidth = c * 0.03;
    ctx.beginPath(); ctx.moveTo(kx + ax * c * 0.1, ky + ay * c * 0.1); ctx.lineTo(mx, my); ctx.lineTo(ex - bx * c * 0.2, ey - by * c * 0.2); ctx.stroke();
  }
  // A piece of the tie from (x1, y1) to (x2, y2), heading (dx, dy): w1 either side, widening to w2.
  function tieQuad(x1, y1, w1, x2, y2, w2, dx, dy) {
    ctx.moveTo(x1 - dy * w1, y1 + dx * w1); ctx.lineTo(x2 - dy * w2, y2 + dx * w2);
    ctx.lineTo(x2 + dy * w2, y2 - dx * w2); ctx.lineTo(x1 + dy * w1, y1 - dx * w1); ctx.closePath();
  }

  // Star: a five-pointed star for a head, sunflower yellow deeper than Honey
  // (gold means a power: the gold line round a body is the power, a yellow
  // on a face is a look), with an orange rim and an ink outline, and the old
  // rainbow trailing it (see fillsOf). The star is a sharp one (its points
  // STAR_OUT and its valleys STAR_IN times the head's radius, a point to the
  // back: STAR_TURN) grown round by STAR_ROUND, so its points are softly
  // rounded, and any outline grown round it (its shadow, a gold line) is
  // the same star grown further. Its points turn with its heading (see
  // prepare); its face stays upright (see starFace).
  const STAR_OUT = 1.3, STAR_IN = 0.68, STAR_ROUND = 0.25, STAR_TURN = Math.PI;
  const STAR_A = Math.atan2(STAR_OUT - STAR_IN * Math.cos(Math.PI / 5), STAR_IN * Math.sin(Math.PI / 5)); // (how far round from a point's middle its rounding runs, either way)
  const STAR_MITRE = 1 / Math.cos(STAR_A - Math.PI / 5); // (how far a valley moves out, a unit of growing)
  const STAR_TIP = STAR_OUT + STAR_ROUND; // (how far its points reach, in head radii)
  const STAR_INK = 1.3, STAR_RIM = 2; // (its ink outline and its orange rim, in units, inside its edge)
  // Its colours: sunflower, rimmed in orange; and dim (a point of it while
  // its flash rests: see its tell), a muted mustard rimmed in brown.
  const STAR_SUN = '#f9c22e', STAR_SUN_RIM = '#e8890c', STAR_DIM = '#b0893a', STAR_DIM_RIM = '#8a5c24';
  const RAINBOW_STEP = 28; // (degrees of hue from one segment to the next)
  // As the engine's flashIn sees it (golden flashes go anyway), on the clock as drawn.
  const flashReady = s => s.dashes > 0 || (!(T.FLASH_COST > 0 && s.body.length <= T.MIN_LENGTH) && shownTime >= s.flashReadyAt);
  // How far through its flash's rest it is, on the clock as drawn: 0 as it
  // flashes, 1 once the flash is back (holding golden flashes, 1).
  const restOf = s => s.dashes > 0 ? 1 : Math.max(0, Math.min(1, 1 - (s.flashReadyAt - shownTime) / T.FLASH_COOLDOWN_MS));
  // Its face is upright whichever way it heads, as in the owner's picture
  // (brows, eyes, then the big mustache: heading up, turned with its
  // heading, the mustache sat over its eyes and read as huge angry brows),
  // its chin tipped STAR_LEAN the way it's heading across the screen. That
  // keeps the mustache over its two lower points heading down, left or
  // right; heading up, its back point is straight down, under its chin. The
  // angle its face's +x (its chin) is drawn at.
  const STAR_LEAN = Math.PI / 10;
  const starFace = a => Math.PI / 2 - STAR_LEAN * a.hc;
  // The star round a's head, `grow` units bigger all round (smaller, if
  // it's negative), added to the current path, wound the way rect() and
  // arc() wind (so it never cancels a silhouette's other pieces out).
  function starPath(a, grow) { starTrace(ctx, a.pts[0], a.pts[1], a.turn + STAR_TURN, a.rad[0], grow); }
  // (The same on g: a star round (x, y), its first point at angle t0, for a head of radius r.)
  function starTrace(g, x, y, t0, r, grow) {
    const rho = Math.max(0, STAR_ROUND * r + grow), dip = STAR_IN * r + rho * STAR_MITRE;
    for (let j = 0; j < 5; j++) {
      const t = t0 + j * TAU / 5, ox = x + Math.cos(t) * STAR_OUT * r, oy = y + Math.sin(t) * STAR_OUT * r, v = t + Math.PI / 5;
      if (!j) g.moveTo(ox + Math.cos(t - STAR_A) * rho, oy + Math.sin(t - STAR_A) * rho);
      g.arc(ox, oy, rho, t - STAR_A, t + STAR_A);
      g.lineTo(x + Math.cos(v) * dip, y + Math.sin(v) * dip);
    }
    g.closePath();
  }
  // Its tell: a countdown on its five points. Its middle is always its
  // sunflower. As it flashes, its points go dim (in a moment, and its
  // twinkles burst off them: see onTick's dash), and they light again one
  // by one as its rest runs down, a point for each fifth of it (1.2 s),
  // going round from its back point, each lighting over the last STAR_FADE
  // of its step; the fifth lights as the flash is back, and while it's
  // ready two twinkles go round its points. (Lit only while its flash was
  // ready, it was dim nearly all the time: it flashes the moment it can, so
  // lit lasted a tick, a blink with reduced motion.) Holding golden flashes,
  // all five are lit. With reduced motion a point lights at once. Its brows
  // knit as it flashes, and relax through the first part of its rest (see
  // its face).
  const STAR_FADE = 0.2;
  // Its head: the star (a sprite for each count of its points lit, heading
  // right, turned and scaled as it's drawn, the point that's lighting drawn
  // over it fading in), its mustache (a sprite of its own, upright with its
  // face: as paths, the star and its mustache cost the GPU about half a
  // millisecond a frame), its sheen, and its twinkles. Out, its points are dim.
  function drawStarHead(s, a, now, dead) {
    const lit = !dead && !!game && flashReady(s), rest = !dead && game ? restOf(s) : 0;
    a.glow = reduced || rest >= a.glow ? rest : a.glow + (rest - a.glow) * (1 - Math.exp(-frameDt / 90)); // (filling with the clock; spent, its points go out in a moment)
    const knit = Math.max(0, Math.min(1, (a.glow - 0.15) / 0.3));
    a.brow = reduced ? +(a.glow >= 0.3) : knit * knit * (3 - 2 * knit);
    const fill = a.glow * 5, n = Math.min(5, Math.floor(fill + 1e-9)), part = reduced || n === 5 ? 0 : Math.min(1, (fill - n - 1) / STAR_FADE + 1);
    const x = a.pts[0], y = a.pts[1], r = a.rad[0], sc = r / STAR_R;
    const sx = sc * (1 - 0.22 * a.squash), sy = sc * (1 + 0.12 * a.squash); // (come down from a jump, squashed a moment, as a face is)
    blitAbout(starHeadSprite(n), x, y, 0, 0, sx, sy, a.turn);
    if (part > 0.02) {
      const was = ctx.globalAlpha;
      ctx.globalAlpha = was * part;
      blitAbout(starPointSprite(n), x, y, 0, 0, sx, sy, a.turn);
      ctx.globalAlpha = was;
    }
    blitAbout(stacheSprite(stacheStep(s, a, now)), x, y, 0, 0, sc, sc, a.face); // (twirling, as its gag: see stacheSprite)
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; // (its sheen, as every segment's: light from the top left, whichever way it's turned)
    circle(x - r * 0.3, y - r * 0.36, r * 0.34);
    const flare = reduced ? 1 : (now - a.flareAt) / 450;
    if (!lit && !(flare < 1)) return;
    for (let j = 0; j < 5; j++) {
      let size;
      if (flare >= 0 && flare < 1 && !reduced) size = 1.7 * (1 - flare) + 0.3 * flare; // (all five, going out)
      else if (!lit) continue;
      else if (reduced) size = j === 0 || j === 2 ? 0.9 : 0; // (two, held still)
      else { // (two at a time, going round, each swelling and going)
        const beat = now / 420, on = Math.floor(beat) % 5, p = beat - Math.floor(beat);
        size = j === on || j === (on + 2) % 5 ? Math.sin(p * Math.PI) : 0;
      }
      if (size <= 0.05) continue;
      const t = a.turn + STAR_TURN + j * TAU / 5, d = STAR_OUT * r, w = SPRITE * CELL * r * 0.36 * size / GLINT_R;
      ctx.drawImage(glintSprite(), x + Math.cos(t) * d - w / 2, y + Math.sin(t) * d - w / 2, w, w);
    }
  }
  const STAR_R = CELL * 0.54; // (its head's radius, unswollen: its sprites')
  const starHeadSprite = n => sprite('starhead', n, drawStarHeadSprite);
  const starPointSprite = j => sprite('starpoint', j, drawStarPointSprite);
  // Its gag (anyone else's tongue): its mustache's ends twirl and flick up,
  // and a little harrumph puffs out from under it; nothing pokes out of its
  // mouth. A sprite for each of STACHE_STEPS steps through the flick (0 is
  // the mustache at rest), so it costs what the still one does; with reduced
  // motion the ends still twirl (it's the gag), without the puff.
  const STACHE_STEPS = 16;
  const stacheSprite = (i = 0) => sprite('stache', reduced && i ? -i : i, drawStacheSprite);
  // The step of its gag a snake's flick is at (0: not flicking), as tongue() times it.
  function stacheStep(s, a, now) {
    if (deadNow || now >= a.tongueUntil || coughing(s) || mouthOpen(s, a) >= 0.08) return 0;
    const p = 1 - (a.tongueUntil - now) / a.tongueMs;
    return Math.max(1, Math.min(STACHE_STEPS - 1, Math.round(p * STACHE_STEPS)));
  }
  // The star, inked, dim, then lit in its middle and its first n points.
  const drawStarHeadSprite = (g, n) => {
    g.fillStyle = INK;
    g.beginPath(); starTrace(g, 0, 0, STAR_TURN, STAR_R, 0); g.fill();
    starFill(g, STAR_DIM_RIM, STAR_DIM);
    g.beginPath();
    starMiddle(g);
    for (let j = 0; j < n; j++) starPoint(g, j);
    g.clip();
    starFill(g, STAR_SUN_RIM, STAR_SUN);
  };
  // (Its point j alone, lit: drawn over the star where it's dim, as it lights.)
  const drawStarPointSprite = (g, j) => {
    g.beginPath(); starPoint(g, j); g.clip();
    starFill(g, STAR_SUN_RIM, STAR_SUN);
  };
  const drawStacheSprite = (g, i) => { // (at its face's scale: see drawBody)
    g.scale(1.1, 1.1);
    const p = Math.abs(i) / STACHE_STEPS;
    if (i > 0) harrumph(g, p);
    mustache(g, Math.min(1, 1.7 * (1 - Math.abs(2 * p - 1))));
  };
  // Its rim and its body, in these colours, inside its ink.
  function starFill(g, rim, body) {
    g.fillStyle = rim;
    g.beginPath(); starTrace(g, 0, 0, STAR_TURN, STAR_R, -STAR_INK); g.fill();
    g.fillStyle = body;
    g.beginPath(); starTrace(g, 0, 0, STAR_TURN, STAR_R, -STAR_INK - STAR_RIM); g.fill();
  }
  // Its middle (the pentagon through its valleys) and its point j (the
  // star beyond the pentagon's side under it), added to g's path, to clip to.
  const STAR_DIP = (STAR_IN + STAR_ROUND * STAR_MITRE) * STAR_R; // (a valley, at its ink's edge)
  function starMiddle(g) {
    for (let j = 0; j < 5; j++) {
      const v = STAR_TURN + (j + 0.5) * TAU / 5;
      if (j) g.lineTo(Math.cos(v) * STAR_DIP, Math.sin(v) * STAR_DIP);
      else g.moveTo(Math.cos(v) * STAR_DIP, Math.sin(v) * STAR_DIP);
    }
    g.closePath();
  }
  function starPoint(g, j) {
    const t = STAR_TURN + j * TAU / 5, v0 = t - Math.PI / 5, v1 = t + Math.PI / 5;
    g.moveTo(Math.cos(v0) * STAR_DIP, Math.sin(v0) * STAR_DIP);
    g.lineTo(Math.cos(t) * CELL * 2, Math.sin(t) * CELL * 2); // (well past its tip)
    g.lineTo(Math.cos(v1) * STAR_DIP, Math.sin(v1) * STAR_DIP);
    g.closePath();
  }
  // Its mustache, in the face's frame (+x its chin, a cell CELL): two big
  // drooping halves from under its eyes, out over its two lower points,
  // scalloped along their ends; inked, so white reads on sunflower, with a
  // few strands. Twirled (t, 0..1: its gag), each half's outer end bends up
  // toward its eyes, more the further out it is, and its tip curls round in
  // a little inked twirl. (Made once a step: see stacheSprite.)
  function mustache(g, t = 0) {
    const c = CELL, th = t * 1.2;
    let sg = 1;
    // (a point of a half, bent: turned about a hinge out under its eye, by more toward its end)
    const bx = (x, y) => { const w = bend(y), a = sg * th * w, dx = x - 0.17, dy = y - sg * 0.13; return c * (0.17 + dx * Math.cos(a) - dy * Math.sin(a)); };
    const by = (x, y) => { const w = bend(y), a = sg * th * w, dx = x - 0.17, dy = y - sg * 0.13; return c * (sg * 0.13 + dx * Math.sin(a) + dy * Math.cos(a)); };
    const bend = y => { const u = Math.max(0, Math.min(1, (Math.abs(y) - 0.12) / 0.3)); return u * u * (3 - 2 * u); };
    const P = (x, y) => [bx(x, sg * y), by(x, sg * y)];
    g.beginPath();
    for (sg of SIDES2) {
      g.moveTo(...P(0.07, 0));
      g.bezierCurveTo(...P(0.03, 0.16), ...P(0.1, 0.32), ...P(0.26, 0.38));
      g.quadraticCurveTo(...P(0.38, 0.42), ...P(0.43, 0.31));
      g.quadraticCurveTo(...P(0.35, 0.3), ...P(0.35, 0.22));
      g.quadraticCurveTo(...P(0.27, 0.2), ...P(0.29, 0.12));
      g.quadraticCurveTo(...P(0.22, 0.08), ...P(0.25, 0));
      g.closePath();
    }
    g.fillStyle = '#fffdf6';
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = c * 0.035;
    g.lineJoin = 'round';
    g.stroke();
    if (t > 0.05) { // (its twirls: from each end, curling in and round)
      g.lineCap = 'round';
      for (const [col, w] of [[INK, 0.085], ['#fffdf6', 0.045]]) {
        g.strokeStyle = col;
        g.lineWidth = c * w;
        g.beginPath();
        for (sg of SIDES2) {
          const [x0, y0] = P(0.4, 0.37), [x1, y1] = P(0.32, 0.43), a0 = Math.atan2(y0 - y1, x0 - x1); // (the way out of its end)
          let x = x0, y = y0;
          g.moveTo(x, y);
          for (let j = 1; j <= 12; j++) {
            const u = j / 12, a = a0 + sg * u * 4.4 * t, step = c * 0.045 * (1 - 0.6 * u) * Math.min(1, t * 1.5);
            x += Math.cos(a) * step; y += Math.sin(a) * step;
            g.lineTo(x, y);
          }
        }
        g.stroke();
      }
    }
    g.strokeStyle = 'rgba(58,38,20,0.3)';
    g.lineWidth = c * 0.02;
    g.lineCap = 'round';
    g.beginPath();
    for (sg of SIDES2) {
      g.moveTo(...P(0.12, 0.1)); g.quadraticCurveTo(...P(0.16, 0.24), ...P(0.3, 0.3));
      g.moveTo(...P(0.17, 0.05)); g.quadraticCurveTo(...P(0.21, 0.14), ...P(0.27, 0.18));
    }
    g.stroke();
  }
  // The harrumph, p (0..1) through its gag: a little puff of breath out
  // from under its mustache, toward its chin and to either side, growing and
  // fading; inked lightly, so it reads on the bark.
  function harrumph(g, p) {
    const u = (p - 0.3) / 0.6;
    if (u <= 0 || u >= 1) return;
    const c = CELL, fade = 1 - u * u;
    g.lineWidth = c * 0.044;
    for (const [x0, y0, dx, dy, r0, r1] of [[0.46, 0, 0.24, 0, 0.06, 0.14], [0.42, 0.22, 0.18, 0.18, 0.045, 0.1], [0.42, -0.22, 0.18, -0.18, 0.045, 0.1]]) {
      const x = c * (x0 + dx * u), y = c * (y0 + dy * u), r = c * (r0 + (r1 - r0) * u);
      g.beginPath(); // (a little cloud: three rounds, its ink stroked under its fill, so only the outside shows)
      for (const [ox, oy, rr] of [[0, 0, 1], [-0.6, 0.55, 0.62], [-0.6, -0.55, 0.62]]) { g.moveTo(x + ox * r + rr * r, y + oy * r); g.arc(x + ox * r, y + oy * r, rr * r, 0, TAU); }
      g.strokeStyle = `rgba(58,38,20,${(0.5 * fade).toFixed(3)})`;
      g.stroke();
      g.fillStyle = `rgba(255,253,246,${(0.92 * fade).toFixed(3)})`;
      g.fill();
    }
  }
  // A four-point twinkle, white and finely inked, as a sprite (its tips
  // GLINT_R from its middle).
  const GLINT_R = CELL * 0.9;
  const glintSprite = () => sprite('glint', '', g => { sparkle(g, 0, 0, GLINT_R); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = 'rgba(58,38,20,0.6)'; g.lineWidth = CELL * 0.12; g.lineJoin = 'round'; g.stroke(); });
  // A four-point twinkle at (x, y), r to its tips, as g's current path (its
  // sides curving in).
  function sparkle(g, x, y, r) {
    const w = r * 0.14;
    g.beginPath();
    g.moveTo(x + r, y);
    g.quadraticCurveTo(x + w, y + w, x, y + r);
    g.quadraticCurveTo(x - w, y + w, x - r, y);
    g.quadraticCurveTo(x - w, y - w, x, y - r);
    g.quadraticCurveTo(x + w, y - w, x + r, y);
    g.closePath();
  }
  // Now and then its tail sheds a small twinkle, in one of the rainbow's
  // colours, drifting off behind it (lively only; no glow: only you glow).
  const TWINKLE = 6, TWINKLE_HUES = [0, 32, 55, 130, 205, 275]; // (its mote kinds, a colour each, after the others: see drawMotes)
  function shedTwinkle(s, a, now) {
    if (reduced || now < a.shedAt || a.n < 2) return;
    a.shedAt = now + 280 + Math.random() * 420;
    const n = a.n, x = a.pts[2 * n - 2], y = a.pts[2 * n - 1], dx = x - a.pts[2 * n - 4], dy = y - a.pts[2 * n - 3], l = Math.hypot(dx, dy) || 1;
    const sp = 8 + Math.random() * 10, side = (Math.random() - 0.5) * 14;
    mote(x + dx / l * a.rad[n - 1] * 0.6, y + dy / l * a.rad[n - 1] * 0.6, dx / l * sp - dy / l * side, dy / l * sp + dx / l * side - 4, 700 + Math.random() * 400, 0.42 + Math.random() * 0.25, TWINKLE + Math.floor(Math.random() * TWINKLE_HUES.length));
  }
  const twinkleSprite = i => sprite('twinkle', i, drawTwinkle);
  const drawTwinkle = (g, i) => {
    const c = CELL, h = TWINKLE_HUES[i], hue = rainbowOf(h)[0];
    const path = (r, w) => { g.beginPath(); g.moveTo(r, 0); g.quadraticCurveTo(w, w, 0, r); g.quadraticCurveTo(-w, w, -r, 0); g.quadraticCurveTo(-w, -w, 0, -r); g.quadraticCurveTo(w, -w, r, 0); g.closePath(); };
    g.lineJoin = 'round';
    path(c * 0.3, c * 0.05);
    g.fillStyle = hue; g.fill();
    g.strokeStyle = 'rgba(58,38,20,0.55)'; g.lineWidth = c * 0.03; g.stroke();
    path(c * 0.13, c * 0.025);
    g.fillStyle = '#fffbea'; g.fill();
  };

  // The living snakes, in passes, so no snake's shadow falls on another's body.
  const live = [];
  // (a snake leaping, or still arched over another one, goes on top)
  const overOf = s => { const a = anim.get(s); return a && (a.leapUntil > game.tick || a.ml) ? 1 : 0; }; // (or about to: see predict)
  const byOver = (p, q) => overOf(p) - overOf(q);
  function drawSnakes(alpha, now) {
    live.length = 0;
    let leaping = false;
    for (const s of game.snakes) if (s.alive) { live.push(s); if (overOf(s)) leaping = true; }
    if (leaping) live.sort(byOver);
    syncStays();
    for (const s of live) predict(s, animOf(s, now));
    meetings();
    for (const s of live) prepare(s, alpha, now, false);
    let up = live.length;
    if (leaping) while (up > 0 && overOf(live[up - 1])) up--;
    drawShadows(up);
    if (fieldSpecs.length && huesOn) drawFieldHues(now); // (a land's colour round a rival on it, under every outline and body)
    // Then outlines, bodies, flames and queasy washes, each pass for every
    // snake on the ground, then the same for any up in the air, the shadow
    // of what of it's in the air first, over the bodies on the ground (the
    // hurdle passes under it with the shadow across it), and its trail: a
    // leaper's outline goes over what it's hopping, not under it (which made
    // it look rammed into it rather than above it). Its halo stays with the
    // ground's outlines, under every body (over the snake it hopped, it
    // greyed a dark body either side of yours for as long as the arch ran).
    drawPasses(0, up, now, live.length);
    if (up < live.length) {
      drawAirShadows(up);
      drawTrails(up, live.length, now);
      drawPasses(up, live.length, now, 0);
    }
  }
  // Passes over live[from..to) (and for a snake across a wrapped edge, at
  // each place it shows); the first also takes the halos of live[to..halos).
  function drawPasses(from, to, now, halos) {
    for (let pass = 0; pass < 4; pass++) {
      for (let i = from, end = pass ? to : Math.max(to, halos); i < end; i++) {
        const s = live[i], a = anim.get(s), offs = a.offs || OFFS;
        for (let j = 0; j < offs.length; j++) {
          const ox = offs[j][0], oy = offs[j][1];
          if (ox || oy) ctx.translate(ox, oy);
          if (pass === 0) { if (i >= to) drawHalo(s, a); else drawOutline(s, a, !!halos); }
          else if (pass === 1) drawBody(s, a, now, false);
          else if (pass === 2) { if (s.burnUntil > game.tick) drawBurning(s, a, now); }
          else { // queasy after a mushroom: a sickly green wash, fading
            const q = a.queasyAt ? 1 - (now - a.queasyAt) / 1400 : 0;
            if (q > 0 && q <= 1) { ctx.fillStyle = rgba('#65a30d', 0.38 * q); silhouette(a, 0.5); }
          }
          if (ox || oy) ctx.translate(-ox, -oy);
        }
      }
    }
  }

  // A jump's faint trail through the air: two thin arcs either side of the
  // way its head went, as far apart as its head was swollen there, so they
  // bow out over what it hopped; from where it took off to its head (once
  // it's down, to where it landed), fading as it lands. In
  // parchment, faint: a power's gold is for powers. None with reduced motion.
  // (Points every TRAIL_STEP cells where it bows, one straight run over the
  // top, where it doesn't, and mitred, not rounded, at every point: the same
  // line, a little cheaper. Measured, the trail is a fifth of a millisecond
  // a frame, a jump's air shadow most of the rest of what it adds.)
  const TRAIL_MS = 260, TRAIL_STEP = 0.125;
  function drawTrails(from, to, now) {
    if (reduced) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#fffbea';
    for (let j = from; j < to; j++) {
      const a = anim.get(live[j]);
      for (let n = 0; n < a.hops.length; n++) {
        const r = a.hops[n], fade = r.landed ? 1 - (now - r.landedAt) / TRAIL_MS : 1;
        if (fade <= 0) continue;
        const reach = Math.abs(r.x1 - r.x0) + Math.abs(r.y1 - r.y0) + 1, sw = r.gold ? T.LEAP_SWELL_GOLD : T.LEAP_SWELL;
        const tx = (r.x0 - r.dx + 0.5) * CELL, ty = (r.y0 - r.dy + 0.5) * CELL; // (where it took off)
        let end = reach + 1;
        if (!r.landed) end = Math.min(end, ((a.pts[0] - tx) * r.dx + (a.pts[1] - ty) * r.dy) / CELL); // (to its head: they run on round it, just outside it)
        if (!(end > 0.3)) continue; // (nothing behind its head yet; and never a trail of no length, nor of none at all)
        ctx.globalAlpha = 0.55 * fade;
        ctx.beginPath();
        for (const sg of SIDES2) {
          for (let u = 0.3; ; u += TRAIL_STEP) {
            if (u > 1 && u < reach) u = reach; // (over the top, straight)
            if (u > end) u = end;
            const d = u < 1 ? 1 - u : u > reach ? u - reach : 0, w = CELL * 0.54 * (1 + sw * (d < 1 ? Math.cos(d * Math.PI / 2) : 0)) + 6;
            const x = tx + r.dx * u * CELL - r.dy * sg * w, y = ty + r.dy * u * CELL + r.dx * sg * w;
            if (u === 0.3) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            if (u >= end) break;
          }
        }
        ctx.stroke();
      }
    }
    ctx.lineJoin = 'round'; // (as it found it)
    ctx.globalAlpha = 1;
  }

  // A snake on fire: flames along its back (the fire's own flicker, smaller,
  // dying down as it goes out), a glow under them, embers and smoke going up.
  function drawBurning(s, a, now) {
    const lively = !reduced, t = now / 1000, left = Math.min(1, (s.burnUntil - game.tick) / (T.BURN_TICKS / 2));
    const size = SPRITE * CELL * (0.45 + 0.25 * left);
    for (let i = 1; i < a.n && i < 12; i += 2) {
      const x = a.pts[2 * i], y = a.pts[2 * i + 1];
      ctx.globalAlpha = 0.45;
      ctx.drawImage(fireGlowSprite(), x - size * 0.6, y - size * 0.6, size * 1.2, size * 1.2);
      ctx.globalAlpha = 1;
      const fr = lively ? Math.floor(t * 14 + i * 3) % FLAME_FRAMES : 0;
      ctx.drawImage(bodyFlameSprite(fr), x - size / 2, y - size * 0.62, size, size);
      if (lively && Math.random() < 0.05) mote(x, y - CELL * 0.3, (Math.random() - 0.5) * 12, -40 - Math.random() * 20, 650, 1.3 + Math.random(), 3);
      if (lively && Math.random() < 0.03) mote(x, y - CELL * 0.3, (Math.random() - 0.5) * 6, -18, 1100, 2.5 + Math.random() * 2, 2);
    }
  }

  // ---------------------------------------------------------------- faces

  // Shared helpers draw in the head's local frame (+x forward, one cell = CELL).
  // gazeX/gazeY: where this snake's eyes point (a unit vector in that frame).
  let blinkNow = false, gazeX = 1, gazeY = 0;
  let headCos = 1, headSin = 0; // the heading the face is drawn turned to
  // The way the head faces, as drawn (the way it's drawn heading: see
  // prepare): it swings round smoothly when the snake turns, and when a
  // rival turns again and again (a staircase, a wiggle) it holds a steady
  // line between them, instead of whipping round every tick and flinging its
  // tongue from side to side. Yours turns quickly, busy or not
  // (FACE_EASE_MS): it's your press, and your face is how you see it taken.
  function steer(s, a, now) {
    const dx = a.tdx, dy = a.tdy;
    if (a.hc === undefined) { a.hx = a.hc = dx; a.hy = a.hs = dy; a.ldx = dx; a.ldy = dy; a.turned = [-1e9, -1e9]; }
    if (dx !== a.ldx || dy !== a.ldy) { a.ldx = dx; a.ldy = dy; a.turned[0] = a.turned[1]; a.turned[1] = now; }
    const busy = now - a.turned[0] < 650; // (two turns close together)
    const k = reduced ? 1 : 1 - Math.exp(-frameDt / (s.id === viewerId ? T.FACE_EASE_MS : busy ? 300 : 70));
    a.hx += (dx - a.hx) * k;
    a.hy += (dy - a.hy) * k;
    const len = Math.hypot(a.hx, a.hy) || 1;
    a.hc = a.hx / len; a.hs = a.hy / len;
  }

  // Closed eyes: two short lids (at x, ±y), or crosses if knocked out.
  function lids(r, x = 0.14, y0 = 0.2) {
    const c = CELL;
    ctx.strokeStyle = INK;
    ctx.lineWidth = c * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const sg of SIDES2) {
      const y = sg * y0;
      if (deadNow) { cross(x, y, Math.max(r, 0.08) * 0.85); continue; } // knocked out, not asleep
      ctx.moveTo(c * x, c * (y - r));
      ctx.quadraticCurveTo(c * (x + r * 0.9), c * y, c * x, c * (y + r));
    }
    ctx.stroke();
  }

  // An X at (x, y), half-width d, added to the current path.
  function cross(x, y, d) {
    const c = CELL;
    ctx.moveTo(c * (x - d), c * (y - d)); ctx.lineTo(c * (x + d), c * (y + d));
    ctx.moveTo(c * (x + d), c * (y - d)); ctx.lineTo(c * (x - d), c * (y + d));
  }

  // Plain dark eyes, shifted a touch toward what the snake is looking at.
  function eyes(r, fill) {
    if (blinkNow) return lids(r);
    const c = CELL, ox = gazeX * c * 0.03, oy = gazeY * c * 0.03;
    ctx.fillStyle = fill;
    circle(c * 0.15 + ox, -c * 0.2 + oy, c * r);
    circle(c * 0.15 + ox, c * 0.2 + oy, c * r);
  }

  // Small white eyes whose pupils turn toward what the snake is looking at.
  // r: the pupil's radius (the white is a size up).
  function lookingEyes(r, x = 0.15, y = 0.2, wide = 1.55) {
    if (blinkNow) return lids(r * 1.3, x, y);
    const c = CELL, w = r * wide, reach = (w - r) * 0.85;
    ctx.fillStyle = '#fffbea';
    circle(c * x, -c * y, c * w);
    circle(c * x, c * y, c * w);
    ctx.fillStyle = INK;
    const ox = gazeX * c * reach, oy = gazeY * c * reach;
    circle(c * x + ox, -c * y + oy, c * r);
    circle(c * x + ox, c * y + oy, c * r);
    if (r >= 0.045) catchlights(c * x + ox, c * y, oy, c * r);
  }

  // A small mouth at the front of the head, open by `open` (0..1).
  function mouth(open, x = 0.42) {
    if (open < 0.08) return;
    const c = CELL;
    ctx.fillStyle = '#3b0d0d';
    ctx.beginPath();
    ctx.ellipse(c * x, 0, c * (0.03 + 0.04 * open), c * (0.05 + 0.1 * open), 0, 0, TAU);
    ctx.fill();
  }

  function poly(pts, sign, fill) {
    const c = CELL;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0] * c, pts[1] * c * sign);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] * c, pts[i + 1] * c * sign);
    ctx.fill();
  }

  const CROWN = [0.02, -0.34, 0.02, 0.34, -0.42, 0.34, -0.22, 0.17, -0.42, 0, -0.22, -0.17, -0.42, -0.34];
  const TRICORN = [0.05, 0, -0.45, -0.45, -0.45, 0.45];
  const BEAK = [0.32, -0.12, 0.6, 0, 0.32, 0.12];
  const EAR = [-0.3, 0.1, -0.05, 0.42, -0.45, 0.5];
  const EAR_IN = [-0.28, 0.18, -0.12, 0.38, -0.38, 0.42];
  const JESTER = [-0.1, 0.3, -0.55, 0.62, -0.32, 0.05];
  const HARLEQUIN = [-0.07, 0.2, 0.15, 0.08, 0.31, 0.2, 0.15, 0.32];
  const WHISKERS = [0.3, 0.45, 0.6];
  const PARTY_YELLOW = '#ffde00'; // (Copycat's pin, the flag's yellow, on its head of the flag's red)
  // Colonist's tricorn: three corners (one forward), the brim wider than the head.
  const TRI_F = [0.1, 0], TRI_L = [-0.5, -0.6], TRI_R = [-0.5, 0.6], TRI_BOW = 0.1;
  function tricornSide(c, a, b) { // each side's middle pulled in toward the crown
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    ctx.quadraticCurveTo(c * (mx + (-0.28 - mx) * TRI_BOW * 2.4), c * (my * (1 - TRI_BOW * 2.4)), c * b[0], c * b[1]);
  }

  // ------------------------------------------------------- tongues
  // Every few seconds each snake flicks its tongue out and back. You and your
  // friends have the real, forked thing; each rival flicks out something that
  // fits it instead, drawn in the head's frame from the mouth (x = 0.42).
  // Per look: [how often (1 = like you), how long it stays out (1 = like
  // yours), what comes out]. Capricious flicks its mood's; Copycat its model's.
  const FLICKS = {
    player: [1, 1, forked], capricious: [1.2, 1, forked],
    creeper: [0.8, 1.5, slither], drab: [1.8, 1.6, limp], gobbler: [0.6, 1.4, lick], ghost: [1.8, 1.8, wisp],
    sniper: [1.2, 1.5, laser], sovereign: [1.6, 2.4, carpet], colonist: [1.4, 2.2, telescope], vulture: [1.6, 3, bone],
    mason: [1.4, 2.4, papyrus], metagamer: [1.4, 2, keyboard], wildcard: [1.2, 2, bill], desperado: [1.1, 2, revolver],
    joker: [1, 2.4, blower], copycat: [1.2, 1.4, blep], mute: [1.1, 2, innerJaw], ouroboros: [1.6, 1.6, fangs],
    star: [0.9, 1.8, fakeStache], // (Star's own is its mustache, twirling: see stacheSprite; this is Copycat's copy of it)
  };
  let flickP = -1, flickT = 0; // the flick being drawn: how far through it is (or -1), and how far out (0..1..0)

  // Time this snake's flick (more often near food, if `keen`) and draw it,
  // unless `draw` is false (Sniper's comes out of its scope instead).
  function tongue(a, now, open, look, keen = false, draw = true) {
    const [rate, len, fn] = FLICKS[look] || FLICKS.player;
    flickP = -1; flickT = 0;
    if (deadNow) return;
    if (now > a.nextTongue) {
      a.tongueMs = T.TONGUE_MS * len;
      a.tongueUntil = now + a.tongueMs;
      a.nextTongue = now + T.TONGUE_EVERY * rate * (keen && a.near <= 3 ? 0.4 : 0.7 + Math.random() * 0.8);
    }
    if (now >= a.tongueUntil || open >= 0.08) return;
    flickP = Math.min(1, Math.max(0, 1 - (a.tongueUntil - now) / a.tongueMs)); // (kept in 0..1, whatever the clock does)
    flickT = 1 - Math.abs(flickP * 2 - 1); // out and back
    if (!draw) return;
    ctx.save();
    fn(flickT, flickP);
    ctx.restore();
  }

  // Out all the way for the middle of the flick, not just at its peak.
  const stayOut = (t, k = 1.6) => Math.min(1, t * k);
  // Only what's past the lips shows (for things that slide out of the mouth).
  function fromMouth() {
    ctx.beginPath();
    ctx.rect(CELL * 0.38, -CELL, CELL * 2, CELL * 2);
    ctx.clip();
  }

  // The look Copycat's tongue copies: its model's, or a cat's own blep.
  function copiedLook(s) {
    const m = findById(s.memory.modelId);
    const look = m && m.alive ? lookOf(m) : 'copycat';
    return FLICKS[look] ? look : 'copycat';
  }

  // A snake's own: thin, red and forked.
  function forked(t) {
    const c = CELL, reach = c * (0.42 + 0.3 * t);
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = c * 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c * 0.42, 0); ctx.lineTo(reach, 0);
    ctx.moveTo(reach, 0); ctx.lineTo(reach + c * 0.1, -c * 0.07);
    ctx.moveTo(reach, 0); ctx.lineTo(reach + c * 0.1, c * 0.07);
    ctx.stroke();
  }

  // Creeper: the snakiest tongue of all, long and wriggling.
  function slither(t, p) {
    const c = CELL, len = 0.55 * t;
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = c * 0.05;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(c * 0.42, 0);
    let x = 0.42, y = 0;
    for (let i = 1; i <= 10; i++) {
      x = 0.42 + len * i / 10;
      y = Math.sin(i * 0.9 - p * 30) * 0.06 * i / 10;
      ctx.lineTo(c * x, c * y);
    }
    ctx.lineTo(c * (x + 0.1), c * (y - 0.07));
    ctx.moveTo(c * x, c * y); ctx.lineTo(c * (x + 0.1), c * (y + 0.07));
    ctx.stroke();
  }

  // Drab: can't be bothered. A short, limp tongue, no fork, flopping to one side.
  function limp(t) {
    const c = CELL, r = 0.2 * t;
    ctx.strokeStyle = '#d9a3a8';
    ctx.lineWidth = c * 0.075;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c * 0.42, 0);
    ctx.quadraticCurveTo(c * (0.42 + r), 0, c * (0.42 + r * 1.1), c * r * 0.7);
    ctx.stroke();
  }

  // Gobbler: a fat pink tongue that licks its lips, side to side.
  function lick(t, p) {
    const c = CELL, len = 0.2 * stayOut(t, 2);
    ctx.translate(c * 0.38, 0);
    ctx.rotate(Math.sin(p * TAU) * 0.7);
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(c * len * 0.6, 0, c * (0.06 + len * 0.6), c * 0.11, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#e11d48'; // the groove down the middle
    ctx.lineWidth = c * 0.025;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c * 0.05, 0); ctx.lineTo(c * len, 0);
    ctx.stroke();
  }

  // Ghost: a breath of ectoplasm that wafts out and fades back in.
  function wisp(t, p) {
    const c = CELL;
    ctx.globalAlpha *= 0.85 * stayOut(t, 2);
    ctx.fillStyle = '#f0f9ff';
    for (let k = 0; k < 3; k++) {
      const x = 0.48 + (0.15 + 0.16 * k) * t, y = Math.sin(p * 9 + k * 1.7) * 0.07;
      circle(c * x, c * y, c * (0.1 - 0.022 * k));
    }
  }

  // Sniper: the laser sight, a beam and a dot (from the scope, x0 = its lens).
  function laser(t, p, x0 = 0.42) {
    const c = CELL, end = c * (x0 + 1.3 * stayOut(t, 4));
    ctx.strokeStyle = 'rgba(239,68,68,0.75)';
    ctx.lineWidth = c * 0.025;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c * x0, 0); ctx.lineTo(end, 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(239,68,68,0.35)';
    circle(end, 0, c * 0.09);
    ctx.fillStyle = '#ef4444';
    circle(end, 0, c * 0.045);
    ctx.fillStyle = '#fee2e2';
    circle(end, 0, c * 0.018);
  }

  // Sovereign rolls out the red carpet (for itself): gold-edged, with the roll
  // still to unroll at the far end.
  function carpet(t) {
    const c = CELL, e = stayOut(t), x0 = 0.4, len = 0.6 * e, x1 = x0 + len, rr = 0.045 + 0.04 * (1 - e);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(c * x0, -c * 0.12, c * len, c * 0.24);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(c * x0, -c * 0.12, c * len, c * 0.03);
    ctx.fillRect(c * x0, c * 0.09, c * len, c * 0.03);
    ctx.fillStyle = '#dc2626'; // the roll
    ctx.fillRect(c * (x1 - rr), -c * 0.13, c * rr * 2, c * 0.26);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(c * (x1 - rr), -c * 0.13, c * rr * 2, c * 0.03);
    ctx.fillRect(c * (x1 - rr), c * 0.1, c * rr * 2, c * 0.03);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(c * (x1 + rr * 0.2), -c * 0.13, c * rr * 0.8, c * 0.26);
  }

  // Colonist: a brass spyglass that draws out, section by section, to look
  // for land to claim.
  function telescope(t) {
    const c = CELL, e = stayOut(t), x = 0.38 - 0.24 * (1 - e);
    fromMouth();
    ctx.fillStyle = '#bae6fd'; // the lens
    ctx.fillRect(c * (x + 0.38 * e + 0.17), -c * 0.06, c * 0.035, c * 0.12);
    spyglassTube(x + 0.38 * e, 0.19, 0.075); // the thinnest slides furthest...
    spyglassTube(x + 0.2 * e, 0.2, 0.095);
    spyglassTube(x, 0.22, 0.12); // ...out of the widest
  }
  function spyglassTube(x0, len, w) {
    const c = CELL;
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(c * x0, -c * w, c * len, c * w * 2);
    ctx.fillStyle = '#fde68a'; // a shine along the top
    ctx.fillRect(c * x0, -c * w, c * len, c * w * 0.6);
    ctx.fillStyle = '#78350f'; // a ring at the front
    ctx.fillRect(c * (x0 + len - 0.03), -c * w, c * 0.03, c * w * 2);
  }

  // Vulture: a bone, held crosswise and chewed on a moment.
  function bone(t, p) {
    const c = CELL, k = stayOut(t, 3);
    ctx.translate(c * 0.64, 0);
    ctx.rotate(0.3 + Math.sin(p * 14) * 0.08);
    ctx.scale(k, k);
    ctx.strokeStyle = '#57534e'; // an outline round the whole bone...
    ctx.lineWidth = c * 0.05;
    boneShape();
    ctx.stroke();
    ctx.fillStyle = '#f5f5f4'; // ...then the bone over it
    boneShape();
    ctx.fill();
  }
  function boneShape() {
    const c = CELL;
    ctx.beginPath();
    ctx.rect(-c * 0.045, -c * 0.25, c * 0.09, c * 0.5);
    for (let y = -0.26; y < 0.3; y += 0.52) for (let x = -0.05; x < 0.1; x += 0.1) { // (two knobs at each end)
      ctx.moveTo(c * (x + 0.06), c * y);
      ctx.arc(c * x, c * y, c * 0.06, 0, TAU);
    }
  }

  // Mason: a papyrus scroll, unrolled from the mouth: lines of writing (Latin,
  // naturally), a wooden rod at each end, and what's still rolled up at the far end.
  function papyrus(t) {
    const c = CELL, e = stayOut(t), x0 = 0.4, len = 0.56 * e, x1 = x0 + len, w = 0.17, rr = 0.035 + 0.045 * (1 - e);
    ctx.fillStyle = '#ecdcae'; // the sheet...
    ctx.fillRect(c * x0, -c * w, c * len, c * w * 2);
    ctx.fillStyle = 'rgba(146,110,52,0.35)'; // ...browner along its edges
    ctx.fillRect(c * x0, -c * w, c * len, c * 0.025);
    ctx.fillRect(c * x0, c * (w - 0.025), c * len, c * 0.025);
    ctx.strokeStyle = 'rgba(58,38,20,0.6)'; // the writing
    ctx.lineWidth = c * 0.02;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0, x = x0 + 0.07; x < x1 - rr - 0.03; i++, x += 0.065) {
      ctx.moveTo(c * x, -c * (w - 0.05));
      ctx.lineTo(c * x, c * (w - 0.05 - (i % 3) * 0.05));
    }
    ctx.stroke();
    scrollEnd(x0, 0.035, w);
    scrollEnd(x1, rr, w);
  }
  // A rolled end of the scroll (w: half the sheet's width): the roll, its rod's knobs either side.
  function scrollEnd(x, rad, w) {
    const c = CELL;
    ctx.fillStyle = '#d9c38c';
    ctx.fillRect(c * (x - rad), -c * (w + 0.015), c * rad * 2, c * (w + 0.015) * 2);
    ctx.fillStyle = 'rgba(58,38,20,0.25)';
    ctx.fillRect(c * (x + rad * 0.3), -c * (w + 0.015), c * rad * 0.7, c * (w + 0.015) * 2);
    ctx.fillStyle = '#7c2d12';
    circle(c * x, -c * (w + 0.05), c * 0.04);
    circle(c * x, c * (w + 0.05), c * 0.04);
  }

  // Metagamer: a keyboard, slid out to type up its notes on you (a key or two
  // lighting up as it types).
  function keyboard(t, p) {
    const c = CELL;
    fromMouth();
    ctx.translate(-c * 0.62 * (1 - stayOut(t)), 0);
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = c * 0.025;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(c * 0.38, -c * 0.19, c * 0.6, c * 0.38, c * 0.05); else ctx.rect(c * 0.38, -c * 0.19, c * 0.6, c * 0.38);
    ctx.fill();
    ctx.stroke();
    const typing = Math.floor(p * 24); // which keys are down right now
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 7; col++) {
        if (row === 2 && col > 1 && col < 5) continue; // (the space bar's there)
        const lit = (col * 7 + row * 3 + typing * 5) % 11 === 0;
        ctx.fillStyle = lit ? '#22d3ee' : '#e2e8f0';
        ctx.fillRect(c * (0.42 + col * 0.077), c * (-0.15 + row * 0.105), c * 0.06, c * 0.08);
      }
    }
    ctx.fillStyle = typing % 4 === 1 ? '#22d3ee' : '#e2e8f0';
    ctx.fillRect(c * (0.42 + 2 * 0.077), c * (-0.15 + 2 * 0.105), c * (3 * 0.077 - 0.017), c * 0.08);
  }

  // Wildcard: a dollar bill, slid out like a tip.
  const BILL_FONT = `800 ${CELL * 0.2}px sans-serif`;
  function bill(t, p) {
    const c = CELL;
    fromMouth();
    ctx.translate(-c * 0.52 * (1 - stayOut(t)), 0);
    ctx.rotate(Math.sin(p * 18) * 0.04); // a little flutter
    ctx.fillStyle = '#c7e3b8';
    ctx.strokeStyle = '#3f6212';
    ctx.lineWidth = c * 0.025;
    ctx.fillRect(c * 0.36, -c * 0.12, c * 0.52, c * 0.24);
    ctx.strokeRect(c * 0.36, -c * 0.12, c * 0.52, c * 0.24);
    ctx.strokeStyle = '#65a30d'; // the inner border...
    ctx.lineWidth = c * 0.012;
    ctx.strokeRect(c * 0.4, -c * 0.085, c * 0.44, c * 0.17);
    ctx.fillStyle = '#3f6212'; // ...and the dollar sign in the middle
    ctx.font = BILL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', c * 0.62, c * 0.01);
  }

  // Desperado: the six-shooter. Out, bang (a flash and a puff of smoke), back.
  function revolver(t, p) {
    const c = CELL;
    ctx.save();
    fromMouth();
    ctx.translate(-c * 0.55 * (1 - stayOut(t)), 0);
    ctx.fillStyle = '#d6d3d1'; // the barrel, silver and outlined...
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = c * 0.025;
    ctx.fillRect(c * 0.5, -c * 0.055, c * 0.4, c * 0.11);
    ctx.strokeRect(c * 0.5, -c * 0.055, c * 0.4, c * 0.11);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(c * 0.52, -c * 0.035, c * 0.36, c * 0.025);
    ctx.fillStyle = '#292524'; // ...its front sight...
    ctx.fillRect(c * 0.84, -c * 0.02, c * 0.04, c * 0.04);
    ctx.fillStyle = '#a8a29e'; // ...and the cylinder, six chambers
    circle(c * 0.47, 0, c * 0.13);
    ctx.stroke();
    ctx.fillStyle = '#292524';
    for (let i = 0; i < 6; i++) circle(c * (0.47 + Math.cos(i * TAU / 6) * 0.075), c * Math.sin(i * TAU / 6) * 0.075, c * 0.025);
    ctx.restore();
    if (p > 0.4 && p < 0.52) { // bang
      ctx.fillStyle = '#fde047';
      circle(c * 0.98, 0, c * 0.1);
      ctx.fillStyle = '#ffffff';
      circle(c * 0.98, 0, c * 0.05);
    }
    const sp = (p - 0.45) / 0.55;
    if (sp > 0) { // the smoke drifting off
      ctx.globalAlpha *= 0.85 * (1 - sp);
      ctx.fillStyle = '#f5f5f4';
      for (let k = 0; k < 3; k++) circle(c * (0.98 + 0.14 * sp + 0.08 * k), c * (k - 1) * 0.06 * (1 + sp), c * (0.06 + 0.05 * sp) * (1 - k * 0.15));
    }
  }

  // Joker: a party horn (a blowout). A mouthpiece, then a flat paper tube,
  // striped, that unrolls from its curl with a toot: at full stretch its
  // fringed tip flutters and a puff of confetti flies off it; then it rolls
  // back up. Outlined, so it reads at phone size.
  const HORN = ['#ec4899', '#facc15', '#8b5cf6', '#facc15'], CURL = new Float64Array(64); // (CURL: its spiral's points, x, y, ...)
  function blower(t, p) {
    const c = CELL, e = stayOut(t, 1.4), k = Math.min(1, t * 5);
    ctx.translate(c * 0.4, 0); // (pops out of the mouth)
    ctx.scale(k, k);
    ctx.translate(-c * 0.4, 0);
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#f8fafc'; // the mouthpiece
    ctx.strokeStyle = INK;
    ctx.lineWidth = c * 0.025;
    ctx.beginPath(); ctx.rect(c * 0.36, -c * 0.05, c * 0.15, c * 0.1); ctx.fill(); ctx.stroke();
    // The tube, as far as it's unrolled...
    const w = c * 0.17, x0 = c * 0.5, len = c * 0.95 * e, n = Math.max(1, Math.round(len / (c * 0.1)));
    if (len > 0.5) {
      ctx.fillStyle = INK;
      ctx.fillRect(x0, -w / 2 - c * 0.02, len, w + c * 0.04);
      for (let i = 0; i < n; i++) { ctx.fillStyle = HORN[i % 4]; ctx.fillRect(x0 + len * i / n, -w / 2, len / n + 0.4, w); }
    }
    const x1 = x0 + len, curl = 1 - e;
    if (curl > 0.04) { // ...and the rest still rolled up at its end: a spiral, curling up and back
      const R = c * (0.05 + 0.12 * curl), turns = 0.8 + 1.6 * curl, steps = Math.ceil(turns * 10), pts = CURL;
      pts[0] = x1; pts[1] = 0;
      for (let i = 1; i <= steps; i++) {
        const a = i / steps * turns * TAU, rr = R * (1 - 0.6 * i / steps);
        pts[2 * i] = x1 + Math.sin(a) * rr; pts[2 * i + 1] = -R + Math.cos(a) * rr;
      }
      ctx.lineCap = 'round';
      ctx.strokeStyle = INK;
      ctx.lineWidth = w * 0.8 + c * 0.04;
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 1; i <= steps; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
      ctx.stroke();
      ctx.lineWidth = w * 0.8;
      for (let i = 1; i <= steps; i++) {
        ctx.strokeStyle = HORN[(n + i) % 4];
        ctx.beginPath(); ctx.moveTo(pts[2 * i - 2], pts[2 * i - 1]); ctx.lineTo(pts[2 * i], pts[2 * i + 1]); ctx.stroke();
      }
    } else { // full stretch: a fringe fluttering at the tip, and a toot of confetti
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = c * 0.03;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let j = 0; j < 4; j++) {
        const a = -0.5 + j * 0.33 + Math.sin(p * 40 + j * 1.7) * 0.18, y0 = (j - 1.5) * w / 4;
        ctx.moveTo(x1, y0); ctx.lineTo(x1 + Math.cos(a) * c * 0.17, y0 + Math.sin(a) * c * 0.17);
      }
      ctx.stroke();
      const q = Math.max(0, Math.min(1, (p - 0.3) / 0.4));
      if (q > 0 && q < 1) {
        ctx.globalAlpha *= 1 - q;
        for (let j = 0; j < 5; j++) {
          ctx.fillStyle = HORN[j % 4];
          ctx.fillRect(x1 + c * (0.12 + 0.35 * q + 0.04 * j), Math.sin(j * 2.3) * c * 0.22 * q - c * 0.025, c * 0.05, c * 0.05);
        }
      }
    }
  }

  // Mute: its painted lips part, and a second, inner jaw shoots out on its
  // stalk (glossy, dark, with little silver teeth, snapping), then back in.
  // A mime with a secret. It still never says a word.
  function innerJaw(t, p) {
    const c = CELL, e = stayOut(t, 2.2), x = c * (0.44 + 0.34 * e);
    ctx.translate(c * 0.4, 0); // (drawn big, from the mouth, so it reads at play size)
    ctx.scale(1.6, 1.6);
    ctx.translate(-c * 0.4, 0);
    ctx.fillStyle = '#1c1917'; // the lips parted wide...
    ctx.beginPath(); ctx.ellipse(c * 0.4, 0, c * 0.06, c * 0.11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f1f5f9'; // ...teeth showing
    for (const sg of SIDES2) for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(c * (0.4 + i * 0.03), sg * c * 0.1); ctx.lineTo(c * (0.415 + i * 0.03), sg * c * 0.05); ctx.lineTo(c * (0.43 + i * 0.03), sg * c * 0.1); ctx.fill();
    }
    if (e < 0.05) return;
    const mid = (c * 0.42 + x) / 2;
    ctx.fillStyle = '#334155'; // the stalk: tapering, ribbed, glossy
    ctx.beginPath();
    ctx.moveTo(c * 0.42, -c * 0.065); ctx.quadraticCurveTo(mid, -c * 0.035, x - c * 0.08, -c * 0.045);
    ctx.lineTo(x - c * 0.08, c * 0.045); ctx.quadraticCurveTo(mid, c * 0.035, c * 0.42, c * 0.065);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let rx = c * 0.47; rx < x - c * 0.1; rx += c * 0.05) { ctx.moveTo(rx, -c * 0.04); ctx.lineTo(rx, c * 0.04); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = c * 0.015;
    ctx.beginPath(); ctx.moveTo(c * 0.44, -c * 0.035); ctx.lineTo(x - c * 0.1, -c * 0.028); ctx.stroke();
    const bite = 0.5 + 0.5 * Math.sin(p * TAU * 4); // (snapping)
    ctx.fillStyle = '#1e293b'; // the inner head: a glossy dome...
    ctx.beginPath(); ctx.ellipse(x, 0, c * 0.13, c * 0.09, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(x - c * 0.03, -c * 0.045, c * 0.06, c * 0.02, -0.15, 0, TAU); ctx.fill();
    const mx = x + c * 0.1, gap = c * (0.015 + 0.035 * bite); // ...its jaws open at the front...
    ctx.fillStyle = '#0b0f19';
    ctx.beginPath(); ctx.ellipse(mx, 0, c * 0.05, gap + c * 0.012, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e2e8f0'; // ...two rows of little silver teeth
    for (const sg of SIDES2) {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const tx = mx - c * 0.045 + i * c * 0.026, ty = sg * (gap + c * 0.01);
        ctx.moveTo(tx, ty); ctx.lineTo(tx + c * 0.013, ty - sg * c * 0.032); ctx.lineTo(tx + c * 0.026, ty);
      }
      ctx.fill();
    }
  }

  // Ouroboros: no forked tongue (only people have that): it bares its fangs.
  function fangs(t) {
    const c = CELL, e = stayOut(t, 2), x0 = c * 0.55; // (from the tip of its snout, past the wedge of its head)
    ctx.fillStyle = '#1c1917'; // the jaw, dropping open
    ctx.beginPath(); ctx.ellipse(x0, 0, c * 0.06, c * (0.04 + 0.1 * e), 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = 'rgba(58,36,8,0.85)';
    ctx.lineWidth = c * 0.02;
    for (const sg of SIDES2) { // two long fangs, curving forward and in
      ctx.beginPath();
      ctx.moveTo(x0 - c * 0.03, sg * c * 0.06);
      ctx.quadraticCurveTo(x0 + c * (0.14 + 0.08 * e), sg * c * 0.08, x0 + c * (0.16 + 0.14 * e), sg * c * (0.02 - 0.04 * e));
      ctx.lineTo(x0 + c * 0.06, sg * c * 0.13);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  // Copycat with no one to copy: a cat's blep, the tip of a pink tongue.
  function blep(t) {
    const c = CELL, e = stayOut(t, 2);
    ctx.fillStyle = '#f472b6'; // (deeper than its pale head)
    ctx.beginPath();
    ctx.ellipse(c * (0.44 + 0.06 * e), 0, c * (0.03 + 0.05 * e), c * 0.075, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = c * 0.02;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c * 0.44, 0); ctx.lineTo(c * (0.45 + 0.07 * e), 0);
    ctx.stroke();
  }

  // Star's gag is its mustache, twirling (see stacheSprite): nothing comes
  // out of its mouth. Copycat copying it can't grow one, so it holds up a
  // stick-on mustache under its nose for the length of a flick, and twirls
  // that (the same sprite, smaller, in its own face's frame).
  function fakeStache(t, p) {
    const e = Math.min(1, t * 3);
    if (e < 0.05) return;
    const sc = 0.72 * e / 1.1; // (the sprite is at a face's scale already)
    ctx.translate(CELL * 0.14, 0);
    ctx.scale(sc, sc);
    blit(stacheSprite(Math.max(1, Math.min(STACHE_STEPS - 1, Math.round(p * STACHE_STEPS)))), 0, 0);
  }

  // Your face: white eyes whose pupils glance toward the nearest food, a
  // mouth that opens for a bite, a blink now and then, and a forked tongue flick.

  function drawPlayerFace(s, a, now, blinking) {
    const c = CELL;
    const open = mouthOpen(s, a);
    tongue(a, now, coughing(s) ? 1 : open, 'player', true); // (coughing, its mouth is shut)
    mouth(open, 0.44);
    if (!deadNow && coughing(s)) { // (coughing, a mouth shut tight, as the Field guide shows it: there's nothing else on your face to shut)
      ctx.strokeStyle = INK; ctx.lineWidth = c * 0.06; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(c * 0.3, c * 0.07); ctx.quadraticCurveTo(c * 0.4, c * 0.02, c * 0.47, c * 0.05); ctx.stroke();
    }

    if (blinking) return lids(0.11);
    ctx.fillStyle = '#fffbea';
    circle(c * 0.16, -c * 0.2, c * 0.13);
    circle(c * 0.16, c * 0.2, c * 0.13);
    ctx.fillStyle = INK;
    const ox = gazeX * c * 0.05, oy = gazeY * c * 0.05;
    circle(c * 0.16 + ox, -c * 0.2 + oy, c * 0.07);
    circle(c * 0.16 + ox, c * 0.2 + oy, c * 0.07);
    catchlights(c * 0.16 + ox, c * 0.2, oy, c * 0.07);
  }

  // A speck of light in each pupil (at x, ±y + oy, pupils of radius pr), so eyes look alive.
  // (The face is drawn turned to the heading, so the light's offset is turned back.)
  function catchlights(x, y, oy, pr) {
    catchlight(x, -y + oy, pr);
    catchlight(x, y + oy, pr);
  }
  function catchlight(x, y, pr) {
    const dx = -pr * 0.35, dy = -pr * 0.35;
    ctx.fillStyle = '#ffffff';
    circle(x + headCos * dx + headSin * dy, y - headSin * dx + headCos * dy, pr * 0.38);
  }

  function drawFace(s, look, color, blinking, a) {
    const c = CELL;
    blinkNow = blinking;
    const open = mouthOpen(s, a);
    const flicks = look === 'copycat' ? copiedLook(s) : look;
    tongue(a, lastNow, coughing(s) ? 1 : open, flicks, flicks === 'gobbler', look !== 'sniper' && look !== 'star'); // (Sniper's comes out of its scope, and Star's is its mustache: see drawStarHead; coughing, its mouth is shut)
    switch (look) {
      case 'sniper': { // one eye squeezed shut (it never blinks on the job), the other behind a scope that swings onto its target
        ctx.strokeStyle = INK;
        ctx.lineWidth = c * 0.06;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (deadNow) cross(0.14, 0.2, 0.085);
        else { ctx.moveTo(c * 0.08, c * 0.11); ctx.lineTo(c * 0.2, c * 0.2); ctx.lineTo(c * 0.08, c * 0.29); }
        ctx.stroke();
        mouth(open, 0.4);
        ctx.save();
        ctx.translate(c * 0.1, -c * 0.2);
        // Aim, within reason; knocked out, the scope slumps off to the side.
        ctx.rotate(deadNow ? -1.25 : Math.max(-0.45, Math.min(0.45, Math.atan2(gazeY, gazeX))));
        ctx.fillStyle = '#1c1917'; // the scope: eyepiece, tube and a wider front bell
        circle(0, 0, c * 0.14);
        ctx.fillRect(0, -c * 0.09, c * 0.34, c * 0.18);
        circle(c * 0.36, 0, c * 0.15);
        ctx.fillStyle = '#57534e'; // a sheen along the top of the tube
        ctx.fillRect(0, -c * 0.09, c * 0.34, c * 0.045);
        ctx.fillStyle = deadNow ? '#475569' : '#7dd3fc'; // the lens, with a glint (or cracked)
        circle(c * 0.4, 0, c * 0.09);
        if (deadNow) {
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = c * 0.02;
          ctx.beginPath();
          ctx.moveTo(c * 0.34, -c * 0.06); ctx.lineTo(c * 0.4, -c * 0.01); ctx.lineTo(c * 0.37, c * 0.02); ctx.lineTo(c * 0.45, c * 0.06);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff';
          circle(c * 0.43, -c * 0.04, c * 0.03);
        }
        if (flickP >= 0) laser(flickT, flickP, 0.49); // its tongue: the laser sight
        ctx.restore();
        break;
      }
      case 'gobbler': { // stuffed hamster cheeks either side of the mouth, a mouth that opens near food
        // After a bite the cheeks puff up fast and go down slowly (still with reduced motion: no movement, just size).
        const t = (lastNow - a.ateAt) / T.CHEEKS_MS;
        const puff = t < 0 || t >= 1 ? 0 : t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
        const cr = c * (0.25 + 0.1 * puff), cy = c * (0.27 + 0.06 * puff);
        ctx.fillStyle = color; // the cheeks swell the head's own outline toward the front...
        circle(c * 0.24, -cy, cr);
        circle(c * 0.24, cy, cr);
        ctx.fillStyle = mix(color, '#ffffff', 0.22); // ...catch the light on top...
        circle(c * 0.2, -cy - c * 0.03, cr * 0.6);
        circle(c * 0.2, cy + c * 0.03, cr * 0.6);
        ctx.fillStyle = puff > 0.3 ? 'rgba(244,114,182,0.65)' : 'rgba(244,114,182,0.45)'; // ...and blush toward the mouth
        ctx.beginPath();
        ctx.ellipse(c * 0.3, -cy - c * 0.03, c * 0.11, c * 0.07, 0, 0, TAU);
        ctx.moveTo(c * 0.41, cy + c * 0.03); // a separate shape, not joined to the first
        ctx.ellipse(c * 0.3, cy + c * 0.03, c * 0.11, c * 0.07, 0, 0, TAU);
        ctx.fill();
        // A big mouth: open wide within 3 cells of food, and chomping after a bite.
        const hungry = a.near <= 3 && !coughing(s) ? 1 : 0; // (coughing, its mouth stays shut)
        const gape = Math.max(open, hungry);
        ctx.fillStyle = '#3b0d0d';
        ctx.beginPath();
        if (gape > 0.5) ctx.arc(c * 0.38, 0, c * (0.12 + 0.08 * gape), -Math.PI / 2, Math.PI / 2);
        else ctx.ellipse(c * 0.38, 0, c * 0.04, c * (0.12 + 0.08 * gape), 0, 0, TAU);
        ctx.fill();
        // Eyes that grow as food gets closer.
        const greed = Math.max(0, 1 - a.near / 6);
        lookingEyes(0.055 * (1 + 0.8 * greed), 0.12, 0.2);
        break;
      }
      case 'ghost': { // hollow, tall eyes that drift toward the nearest threat
        mouth(open * 0.6, 0.4);
        if (blinking) { lids(0.12); break; }
        const ox = gazeX * c * 0.04, oy = gazeY * c * 0.04;
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(c * 0.12 + ox, -c * 0.2 + oy, c * 0.1, c * 0.14, 0, 0, TAU);
        ctx.ellipse(c * 0.12 + ox, c * 0.2 + oy, c * 0.1, c * 0.14, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1'; // a pale glint in each hollow, turned to what it's watching
        circle(c * 0.12 + ox * 2.2, -c * 0.2 + oy * 2.2, c * 0.03);
        circle(c * 0.12 + ox * 2.2, c * 0.2 + oy * 2.2, c * 0.03);
        break;
      }
      case 'sovereign': // a golden crown, spikes pointing back
        poly(CROWN, 1, '#facc15');
        ctx.fillStyle = '#dc2626';
        circle(-c * 0.06, 0, c * 0.07);
        mouth(open);
        lookingEyes(0.055);
        break;
      case 'colonist': { // a redcoat's tricorn from above: three corners (one forward), brims bowing in, thin gold lace, a raised crown
        // The brim: three rounded corners joined by sides that curve inward.
        ctx.beginPath();
        ctx.moveTo(c * TRI_F[0], c * TRI_F[1]);
        tricornSide(c, TRI_F, TRI_L); tricornSide(c, TRI_L, TRI_R); tricornSide(c, TRI_R, TRI_F);
        ctx.closePath();
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#1c1917';
        ctx.strokeStyle = '#facc15'; // gold lace along the edge
        ctx.lineWidth = c * 0.035;
        ctx.fill();
        ctx.stroke();
        ctx.lineJoin = 'miter';
        ctx.fillStyle = '#2f2a27'; // the crown, catching a little light
        ctx.beginPath();
        ctx.ellipse(-c * 0.27, 0, c * 0.15, c * 0.22, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        circle(-c * 0.31, -c * 0.06, c * 0.045);
        mouth(open);
        lookingEyes(0.055);
        break;
      }
      case 'drab': { // bored, heavy-lidded eyes that do drift toward lunch
        mouth(open * 0.5);
        if (blinking) { lids(0.09); break; }
        const ox = gazeX * c * 0.035, oy = gazeY * c * 0.04;
        ctx.fillStyle = '#fffbea';
        circle(c * 0.15, -c * 0.2, c * 0.09);
        circle(c * 0.15, c * 0.2, c * 0.09);
        ctx.fillStyle = INK;
        circle(c * 0.17 + ox, -c * 0.2 + oy, c * 0.045);
        circle(c * 0.17 + ox, c * 0.2 + oy, c * 0.045);
        ctx.fillStyle = mix(color, '#000000', 0.18); // the lids, drooping over the back half
        ctx.beginPath();
        ctx.arc(c * 0.15, -c * 0.2, c * 0.1, Math.PI / 2, Math.PI * 1.5);
        ctx.arc(c * 0.15, c * 0.2, c * 0.1, Math.PI / 2, Math.PI * 1.5);
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = c * 0.035;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c * 0.15, -c * 0.3); ctx.lineTo(c * 0.15, -c * 0.1);
        ctx.moveTo(c * 0.15, c * 0.1); ctx.lineTo(c * 0.15, c * 0.3);
        ctx.stroke();
        break;
      }
      case 'vulture': { // beady eyes under a scowl, and a big hooked beak that gapes at a meal
        ctx.fillStyle = '#e7d7a8'; // pale horn, outlined dark so it reads small
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = c * 0.04;
        ctx.lineJoin = 'round';
        vultureBeak();
        ctx.fill();
        ctx.save();
        vultureBeak();
        ctx.clip();
        ctx.fillStyle = '#a8a29e'; // a grey cere across the base...
        ctx.fillRect(c * 0.18, -c * 0.2, c * 0.1, c * 0.4);
        ctx.fillStyle = '#44403c'; // ...and a dark hooked tip
        ctx.beginPath();
        ctx.moveTo(c * 0.58, -c * 0.2);
        ctx.quadraticCurveTo(c * 0.62, c * 0.02, c * 0.56, c * 0.2);
        ctx.lineTo(c * 0.9, c * 0.2); ctx.lineTo(c * 0.9, -c * 0.2);
        ctx.fill();
        if (open > 0.08) { // gaping at a meal
          ctx.fillStyle = '#3b0d0d';
          ctx.beginPath();
          ctx.ellipse(c * 0.46, c * 0.03, c * 0.22 * open, c * 0.05, 0.08, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        vultureBeak();
        ctx.stroke();
        ctx.fillStyle = '#44403c'; // a nostril
        ctx.beginPath();
        ctx.ellipse(c * 0.36, -c * 0.07, c * 0.04, c * 0.018, 0.2, 0, TAU);
        ctx.fill();
        lookingEyes(0.05, 0.1, 0.24);
        if (!deadNow) { // brows slanting down to the beak
          ctx.strokeStyle = INK;
          ctx.lineWidth = c * 0.06;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-c * 0.01, -c * 0.34); ctx.lineTo(c * 0.1, -c * 0.15);
          ctx.moveTo(-c * 0.01, c * 0.34); ctx.lineTo(c * 0.1, c * 0.15);
          ctx.stroke();
        }
        break;
      }
      case 'mason': { // laurel wreath around the back of the head; eyes on the job
        // Two branches from a knot at the back, round the sides of the head, open at the front.
        ctx.strokeStyle = '#3f6212';
        ctx.lineWidth = c * 0.03;
        ctx.beginPath();
        ctx.arc(0, 0, c * 0.36, Math.PI * 0.52, Math.PI * 1.48);
        ctx.stroke();
        for (let side = -1; side <= 1; side += 2) {
          for (let k = 0; k < 4; k++) {
            const ang = Math.PI + side * (0.12 + k * 0.12) * Math.PI;
            const ex = Math.cos(ang) * c * 0.36, ey = Math.sin(ang) * c * 0.36;
            const along = ang + side * Math.PI / 2; // the way the branch grows (toward the front)
            for (let tilt = -0.6; tilt < 1; tilt += 1.2) { // a pair of leaves either side of the stem
              const dir = along + tilt;
              ctx.fillStyle = tilt < 0 ? '#65a30d' : '#4d7c0f';
              ctx.beginPath();
              ctx.ellipse(ex + Math.cos(dir) * c * 0.05, ey + Math.sin(dir) * c * 0.05, c * 0.07, c * 0.032, dir, 0, TAU);
              ctx.fill();
            }
          }
        }
        ctx.fillStyle = '#facc15'; // the knot
        circle(-c * 0.37, 0, c * 0.04);
        mouth(open);
        lookingEyes(0.055);
        break;
      }
      case 'creeper': { // narrow glinting eyes on whoever's tail it rides
        mouth(open * 0.6, 0.4);
        if (blinking) { lids(0.12); break; }
        const ox = gazeX * c * 0.05, oy = gazeY * c * 0.05;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(c * 0.15 + ox, -c * 0.2 + oy, c * 0.035, c * 0.12, 0, 0, TAU);
        ctx.ellipse(c * 0.15 + ox, c * 0.2 + oy, c * 0.035, c * 0.12, 0, 0, TAU);
        ctx.fill();
        break;
      }
      case 'metagamer': { // 3D glasses (red and cyan, card frame), eyes on whoever it's studying through them
        mouth(open);
        lookingEyes(0.05);
        lens3d(-1, 'rgba(239,68,68,0.62)'); // left eye red...
        lens3d(1, 'rgba(14,165,233,0.6)'); // ...right eye cyan
        for (let pass = 0; pass < 2; pass++) { // the card frame, outlined so it reads on a cyan head
          ctx.strokeStyle = pass ? '#f8fafc' : '#0f172a';
          ctx.lineWidth = c * (pass ? 0.05 : 0.085);
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let sg = -1; sg <= 1; sg += 2) {
            const y0 = sg < 0 ? -c * 0.33 : c * 0.07;
            if (ctx.roundRect) ctx.roundRect(c * 0.03, y0, c * 0.25, c * 0.26, c * 0.06); else ctx.rect(c * 0.03, y0, c * 0.25, c * 0.26);
            ctx.moveTo(c * 0.1, sg * c * 0.33); ctx.lineTo(-c * 0.14, sg * c * 0.36); // the arms, back over the head
          }
          ctx.moveTo(c * 0.15, -c * 0.07); ctx.lineTo(c * 0.15, c * 0.07); // the bridge
          ctx.stroke();
        }
        break;
      }
      case 'wildcard': { // a golden combover swept forward with a flip at the front, squinty eyes, a pout
        ctx.save();
        ctx.translate(-c * 0.02, c * 0.03);
        combover();
        ctx.fillStyle = 'rgba(120,53,15,0.35)'; // its shadow on the head
        ctx.fill();
        ctx.restore();
        combover();
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#fde68a'; // combed strands, all swept the same way
        ctx.lineWidth = c * 0.024;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-c * 0.18, c * 0.32); ctx.bezierCurveTo(-c * 0.5, c * 0.2, -c * 0.4, -c * 0.42, c * 0.08, -c * 0.46);
        ctx.moveTo(-c * 0.1, c * 0.16); ctx.bezierCurveTo(-c * 0.34, c * 0.04, -c * 0.24, -c * 0.36, c * 0.2, -c * 0.4);
        ctx.moveTo(-c * 0.36, c * 0.3); ctx.bezierCurveTo(-c * 0.56, 0, -c * 0.5, -c * 0.34, -c * 0.2, -c * 0.46);
        ctx.stroke();
        ctx.strokeStyle = '#d97706'; // the curl's edge
        ctx.lineWidth = c * 0.03;
        ctx.beginPath();
        ctx.moveTo(c * 0.34, -c * 0.32); ctx.bezierCurveTo(c * 0.36, -c * 0.2, c * 0.24, -c * 0.16, c * 0.2, -c * 0.24);
        ctx.stroke();
        // A pout.
        if (open > 0.08) mouth(open, 0.43);
        else {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath(); ctx.ellipse(c * 0.42, 0, c * 0.045, c * 0.06, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#9d174d';
          ctx.beginPath(); ctx.ellipse(c * 0.43, 0, c * 0.018, c * 0.025, 0, 0, TAU); ctx.fill();
        }
        if (blinking) { lids(0.08); break; }
        // Squinting eyes, both wandering about together.
        const ox = gazeX * c * 0.03, oy = gazeY * c * 0.035;
        ctx.fillStyle = '#fffbea';
        ctx.beginPath();
        ctx.ellipse(c * 0.2, -c * 0.06, c * 0.065, c * 0.08, 0, 0, TAU);
        ctx.ellipse(c * 0.2, c * 0.22, c * 0.065, c * 0.08, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = INK;
        circle(c * 0.21 + ox, -c * 0.06 + oy, c * 0.04);
        circle(c * 0.21 + ox, c * 0.22 + oy, c * 0.04);
        ctx.fillStyle = '#ffffff';
        circle(c * 0.2 + ox, -c * 0.075 + oy, c * 0.015);
        circle(c * 0.2 + ox, c * 0.205 + oy, c * 0.015);
        ctx.strokeStyle = INK; // the squint: heavy lids across the back of each eye
        ctx.lineWidth = c * 0.03;
        ctx.beginPath();
        ctx.moveTo(c * 0.17, -c * 0.14); ctx.quadraticCurveTo(c * 0.14, -c * 0.06, c * 0.17, c * 0.02);
        ctx.moveTo(c * 0.17, c * 0.14); ctx.quadraticCurveTo(c * 0.14, c * 0.22, c * 0.17, c * 0.3);
        ctx.stroke();
        break;
      }
      case 'copycat': { // cat ears (its head's colour, the flag's red, whoever it copies), cat eyes, whiskers, and a party pin
        poly(EAR, -1, a.fills[0]);
        poly(EAR, 1, a.fills[0]);
        const inner = mix(a.fills[0][0] === '#' ? a.fills[0] : '#de2910', INK, 0.3); // (a deeper red inside: pink read as the pale old Copycat)
        poly(EAR_IN, -1, inner);
        poly(EAR_IN, 1, inner);
        mouth(open * 0.7, 0.4);
        if (blinking) lids(0.1);
        else {
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.ellipse(c * 0.15, -c * 0.2, c * 0.08, c * 0.1, 0, 0, TAU);
          ctx.ellipse(c * 0.15, c * 0.2, c * 0.08, c * 0.1, 0, 0, TAU);
          ctx.fill();
          const ox = gazeX * c * 0.03, oy = gazeY * c * 0.05; // slit pupils on its model
          ctx.fillStyle = INK;
          ctx.beginPath();
          ctx.ellipse(c * 0.15 + ox, -c * 0.2 + oy, c * 0.025, c * 0.08, 0, 0, TAU);
          ctx.ellipse(c * 0.15 + ox, c * 0.2 + oy, c * 0.025, c * 0.08, 0, 0, TAU);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(15,23,42,0.75)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let w = 0; w < 3; w++) {
          ctx.moveTo(c * 0.34, -c * 0.08); ctx.lineTo(c * 0.52, -c * WHISKERS[w]);
          ctx.moveTo(c * 0.34, c * 0.08); ctx.lineTo(c * 0.52, c * WHISKERS[w]);
        }
        ctx.stroke();
        // Party member: a little hammer and sickle on the back of the head,
        // in the flag's yellow on its red, inked round so it reads as a pin
        // (a power's gold is Honey, rounder and paler, and never on a head).
        ctx.save();
        ctx.translate(-c * 0.2, 0);
        ctx.rotate(Math.PI / 2);
        ctx.lineCap = 'butt';
        for (let pass = 0; pass < 2; pass++) {
          const w = pass ? 0 : c * 0.035;
          ctx.strokeStyle = ctx.fillStyle = pass ? PARTY_YELLOW : INK;
          ctx.lineWidth = c * 0.05 + 2 * w;
          ctx.beginPath();
          ctx.arc(0, 0, c * 0.15, -Math.PI * 0.25, Math.PI * 0.95);
          ctx.stroke();
          ctx.save();
          ctx.rotate(-Math.PI / 4);
          ctx.fillRect(-c * 0.02 - w, -c * 0.16 - w, c * 0.04 + 2 * w, c * 0.3 + 2 * w); // handle
          ctx.fillRect(-c * 0.09 - w, -c * 0.18 - w, c * 0.18 + 2 * w, c * 0.06 + 2 * w); // head
          ctx.restore();
        }
        ctx.restore();
        break;
      }
      case 'desperado': { // cowboy hat tipped back, eyes peeking out in front
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(-c * 0.24, 0, c * 0.3, c * 0.56, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#a16207';
        ctx.beginPath();
        ctx.ellipse(-c * 0.26, 0, c * 0.16, c * 0.26, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3f1d0a';
        ctx.fillRect(-c * 0.13, -c * 0.27, c * 0.05, c * 0.54); // hat band
        mouth(open, 0.43);
        lookingEyes(0.06, 0.2, 0.2);
        break;
      }
      case 'ouroboros': { // a real snake's head: a wedge, scaled, slit-pupilled amber eyes, nostrils
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(58,36,8,0.8)';
        ctx.lineWidth = c * 0.04;
        ctx.beginPath(); // (wider at the jaw, a rounded snout)
        ctx.moveTo(-c * 0.3, -c * 0.44);
        ctx.quadraticCurveTo(c * 0.2, -c * 0.4, c * 0.46, -c * 0.12);
        ctx.quadraticCurveTo(c * 0.54, 0, c * 0.46, c * 0.12);
        ctx.quadraticCurveTo(c * 0.2, c * 0.4, -c * 0.3, c * 0.44);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(58,36,8,0.75)'; // a diamond on its crown
        ctx.beginPath(); ctx.moveTo(-c * 0.22, 0); ctx.lineTo(-c * 0.06, -c * 0.12); ctx.lineTo(c * 0.1, 0); ctx.lineTo(-c * 0.06, c * 0.12); ctx.closePath(); ctx.fill();
        if (open > 0.08) mouth(open, 0.46);
        ctx.fillStyle = INK; // nostrils
        circle(c * 0.42, -c * 0.06, c * 0.022); circle(c * 0.42, c * 0.06, c * 0.022);
        if (blinking || deadNow) { lids(0.1, 0.14, 0.22); break; }
        for (const sg of SIDES2) { // amber eyes, a black slit each, turned to what it's watching
          ctx.fillStyle = '#facc15';
          circle(c * 0.14, sg * c * 0.22, c * 0.1);
          ctx.fillStyle = INK;
          ctx.beginPath(); ctx.ellipse(c * 0.14 + gazeX * c * 0.035, sg * c * 0.22 + gazeY * c * 0.035, c * 0.025, c * 0.085, 0, 0, TAU); ctx.fill();
        }
        break;
      }
      case 'mute': { // a mime: white greasepaint, a black beret, high arched brows, a painted tear, small dark lips
        // The beret: a small disc worn at an angle on the crown, its rim lit
        // and its stalk in the middle (at the back of the head it read as a hole).
        ctx.fillStyle = '#18181b';
        ctx.beginPath(); ctx.ellipse(-c * 0.25, -c * 0.14, c * 0.18, c * 0.22, 0.65, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3f3f46'; // (a sheen across the felt)
        ctx.beginPath(); ctx.ellipse(-c * 0.29, -c * 0.2, c * 0.09, c * 0.12, 0.65, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#a1a1aa';
        ctx.lineWidth = c * 0.035;
        ctx.beginPath(); ctx.ellipse(-c * 0.25, -c * 0.14, c * 0.16, c * 0.2, 0.65, Math.PI * 0.9, Math.PI * 1.65); ctx.stroke();
        ctx.fillStyle = '#18181b';
        circle(-c * 0.27, -c * 0.16, c * 0.04);
        const mood = muteState.get(s)?.key || 'calm', brow = MUTE_BROWS[mood];
        if (!open || open < 0.08) { // the lips: a small dark bow (a big lopsided smirk when proud, an O when scared)
          ctx.fillStyle = ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = c * 0.05;
          ctx.lineCap = 'round';
          if (mood === 'proud') { ctx.beginPath(); ctx.arc(c * 0.24, c * 0.04, c * 0.17, -0.95, 0.45); ctx.stroke(); }
          else if (mood === 'scared') { ctx.fillStyle = '#18181b'; circle(c * 0.39, 0, c * 0.07); ctx.stroke(); }
          else { ctx.beginPath(); ctx.ellipse(c * 0.4, 0, c * 0.035, c * 0.08, 0, 0, TAU); ctx.fill(); }
        } else mouth(open);
        ctx.fillStyle = rgba(color, 0.5); // (cheeks blushing its mood)
        circle(c * 0.24, -c * 0.26, c * 0.07); circle(c * 0.24, c * 0.26, c * 0.07);
        if (mood === 'scared') { // (wide O eyes, ringed in ink: on greasepaint the whites don't show)
          lookingEyes(0.035, 0.15, 0.2, 3.2);
          if (!blinkNow) {
            ctx.strokeStyle = INK;
            ctx.lineWidth = c * 0.03;
            ctx.beginPath(); ctx.arc(c * 0.15, -c * 0.2, c * 0.112, 0, TAU); ctx.moveTo(c * 0.262, c * 0.2); ctx.arc(c * 0.15, c * 0.2, c * 0.112, 0, TAU); ctx.stroke();
          }
        } else lookingEyes(0.055);
        if (!blinking) { // brows, bold enough to read at play size: arched high when calm, knitted when it's hunting, raised in the middle when scared...
          ctx.strokeStyle = INK;
          ctx.lineWidth = c * 0.07;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (const sg of SIDES2) { ctx.moveTo(c * brow[0], sg * c * 0.34); ctx.quadraticCurveTo(c * brow[1], sg * c * 0.2, c * brow[2], sg * c * 0.07); }
          ctx.stroke();
        } // ...and a tear under one eye

        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.moveTo(c * 0.27, c * 0.2); ctx.quadraticCurveTo(c * 0.33, c * 0.24, c * 0.3, c * 0.27); ctx.quadraticCurveTo(c * 0.27, c * 0.24, c * 0.27, c * 0.2); ctx.fill();
        break;
      }
      case 'joker': // jester hat with bells, harlequin diamonds round its eyes, a clown's red grin and nose, eyes on its mark
        poly(JESTER, -1, '#a21caf');
        poly(JESTER, 1, '#f59e0b');
        ctx.fillStyle = '#facc15';
        circle(-c * 0.55, -c * 0.62, c * 0.08);
        circle(-c * 0.55, c * 0.62, c * 0.08);
        ctx.strokeStyle = '#dc2626'; // the grin, wider when it's about to bite
        ctx.lineWidth = c * (0.05 + 0.03 * open);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(c * 0.24, 0, c * 0.22, -0.85, 0.85);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        circle(c * 0.33, 0, c * 0.09);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        circle(c * 0.3, -c * 0.03, c * 0.025);
        poly(HARLEQUIN, -1, '#a21caf'); // a diamond painted round each eye
        poly(HARLEQUIN, 1, '#f59e0b');
        lookingEyes(0.055);
        break;
      case 'capricious': { // (until its first mood) can't make its mind up: one eye big, one small, a brow cocked
        mouth(open);
        if (blinking) { lids(0.09); break; }
        oddEye(-0.21, 0.12, 0.07);
        oddEye(0.21, 0.075, 0.045);
        ctx.strokeStyle = INK;
        ctx.lineWidth = c * 0.045;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c * 0.03, c * 0.11);
        ctx.quadraticCurveTo(-c * 0.09, c * 0.2, c * 0.02, c * 0.31);
        ctx.stroke();
        break;
      }
      case 'star': { // a star's face (the star itself and its huge white walrus mustache: see drawStarHead): tall oval eyes, bushy white brows
        mouth(open, 0.36); // (under the mustache)
        // Tall oval eyes, glancing at what it's after, a catchlight in each.
        if (blinking) lids(0.08, -0.01, 0.105);
        else {
          const ox = gazeX * c * 0.035, oy = gazeY * c * 0.03;
          ctx.fillStyle = INK;
          for (const sg of SIDES2) { ctx.beginPath(); ctx.ellipse(-c * 0.02 + ox, sg * c * 0.105 + oy, c * 0.135, c * 0.072, 0, 0, TAU); ctx.fill(); }
          catchlights(-c * 0.05 + ox, c * 0.105, oy, c * 0.1);
        }
        // Bushy white brows, a puffy tuft over each eye: knitted (grumpy) as
        // it flashes, raised again through the first part of its rest (see
        // drawStarHead). (Each puff a circle of its own: the GPU's quickest shape.)
        if (!deadNow) {
          const up = a.brow, inner = -0.12 - 0.09 * up, outer = -0.25 + 0.06 * up;
          for (let pass = 0; pass < 2; pass++) {
            ctx.fillStyle = pass ? '#fffdf6' : INK;
            for (const sg of SIDES2) for (let j = 0; j < 3; j++) {
              const u = j / 2;
              circle(c * (inner + (outer - inner) * u - 0.04 * Math.sin(u * Math.PI)), sg * c * (0.07 + 0.15 * u), c * (0.062 - 0.012 * u) + (pass ? 0 : c * 0.028));
            }
          }
        }
        break;
      }
      default:
        mouth(open);
        lookingEyes(0.06);
    }
    blinkNow = false;
  }
  // (Shapes for the faces, here rather than made afresh every frame.)
  // Vulture's beak, as the current path.
  function vultureBeak() {
    const c = CELL;
    ctx.beginPath();
    ctx.moveTo(c * 0.2, -c * 0.17);
    ctx.quadraticCurveTo(c * 0.56, -c * 0.17, c * 0.8, c * 0.04); // over the top to the hook
    ctx.quadraticCurveTo(c * 0.62, c * 0.14, c * 0.2, c * 0.17);
    ctx.closePath();
  }
  // One lens of Metagamer's 3D glasses (sg: -1 left, 1 right), filled with its tint.
  function lens3d(sg, tint) {
    const c = CELL;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(c * 0.03, sg < 0 ? -c * 0.33 : c * 0.07, c * 0.25, c * 0.26, c * 0.06);
    else ctx.rect(c * 0.03, sg < 0 ? -c * 0.33 : c * 0.07, c * 0.25, c * 0.26);
    ctx.fillStyle = tint;
    ctx.fill();
  }
  // Wildcard's hair, seen from above, as the current path: a puffy golden mass
  // at the back, combed across to one side and forward, ending in a curl over that eye.
  function combover() {
    const c = CELL;
    ctx.beginPath();
    ctx.moveTo(-c * 0.2, c * 0.44); // the back of the far side...
    ctx.bezierCurveTo(-c * 0.62, c * 0.42, -c * 0.66, -c * 0.3, -c * 0.32, -c * 0.5); // ...puffed out round the back...
    ctx.bezierCurveTo(-c * 0.04, -c * 0.62, c * 0.3, -c * 0.56, c * 0.36, -c * 0.34); // ...swept forward along the near side...
    ctx.bezierCurveTo(c * 0.4, -c * 0.2, c * 0.24, -c * 0.12, c * 0.18, -c * 0.24); // ...the curl over the brow...
    ctx.bezierCurveTo(c * 0.1, -c * 0.34, -c * 0.06, -c * 0.12, -c * 0.06, c * 0.08); // ...the parting line, back across...
    ctx.bezierCurveTo(-c * 0.06, c * 0.26, -c * 0.12, c * 0.38, -c * 0.2, c * 0.44);
    ctx.closePath();
  }
  // One of undecided Capricious's eyes (at y: the white's radius w, the pupil's r), turned to what it's watching.
  function oddEye(y, w, r) {
    const c = CELL, reach = (w - r) * 0.85, ox = gazeX * c * reach, oy = gazeY * c * reach;
    ctx.fillStyle = '#fffbea';
    circle(c * 0.15, c * y, c * w);
    ctx.fillStyle = INK;
    circle(c * 0.15 + ox, c * y + oy, c * r);
    catchlight(c * 0.15 + ox, c * y + oy, c * r);
  }

  // ------------------------------------------------------- homes and flags

  // Sovereign's realm and Colonist's colonies are land on a map, drawn the
  // way an old hand-coloured map (or a grand strategy game) draws a country:
  // its cells washed in the owner's colour, deepest in a band along the
  // inside of its border, and the border an inked line along the cell
  // edges, its corners rounded. The cells are the land the rules mean (see
  // onLand), so a head on a washed cell is on it, and one off it isn't.
  // Where two owners' land meets, the line is dashed in both colours; land
  // both claim is hatched in both. Holes are lost land: the wash and the
  // line go round them. Sovereign's capital flies a banner, the colonies
  // their flags. While a rival's head is on the land, its border breathes
  // softly; where one crosses in, it lights up from there.
  //
  // Each owner's land is a cached layer (and a second, its border's glow),
  // made again only when that land changes: it grows, shrinks or moves, a
  // colony comes or goes, a hole is pecked in it, or a neighbour's land
  // changes beside it. A change plays out a ring of cells at a time, so the
  // border grows across the log (with reduced motion, at once), and when
  // its owner goes, the land shrinks back into its capital. Per frame: a
  // blit or two an owner, one for the contested dashes, and the flags.

  // A colour with an alpha, as a string, cached. The alpha is quantised to
  // 1/255 (all the canvas keeps of it anyway), so an alpha that changes every
  // frame costs a lookup and the cache stays bounded: at most 256 strings a
  // colour (and it's cleared every round, as a backstop).
  const rgbaCache = new Map(); // hex -> [256] strings, by alpha
  function rgba(hex, a) {
    let byA = rgbaCache.get(hex);
    if (!byA) rgbaCache.set(hex, byA = new Array(256));
    const q = a > 0 ? (a < 1 ? Math.round(a * 255) : 255) : 0;
    let v = byA[q];
    if (!v) { const n = parseInt(hex.slice(1), 16); v = byA[q] = `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${(q / 255).toFixed(3)})`; }
    return v;
  }
  // The land rule, the one the AIs, the banner and the chatter go by: a
  // cell is a field's land when its centre is within the field's radius
  // (plus LAND_REACH) of the field's centre cell. Every land test in the
  // renderer goes through the realms' masks, made with this.
  const onLand = (f, x, y) => Math.hypot(x - f.x, y - f.y) <= f.radius + T.LAND_REACH;

  // Tracing cells' outline (land, a hollow, the woodpecker's patch): every
  // exposed side of a marked cell, chained into loops that run clockwise
  // with the cells on their right (y down), as the grid points they pass.
  // Where two cells meet only at a corner, a loop keeps to its own cell, so
  // each keeps its own rounded corner. Into arrays made once: loop l is
  // points tAt[l] to tAt[l + 1] - 1, each the start of one side (tSide: its
  // cell * 4 + 0 top, 1 right, 2 bottom or 3 left).
  const N2 = GRID * GRID, W1 = GRID + 1;
  const SX0 = [0, 1, 1, 0], SY0 = [0, 0, 1, 1], SX1 = [1, 1, 0, 0], SY1 = [0, 1, 1, 0], NX = [0, 1, 0, -1], NY = [-1, 0, 1, 0];
  const tOut = new Int32Array(2 * W1 * W1), tOpen = new Uint8Array(4 * N2), tSeen = new Uint8Array(4 * N2);
  const tX = new Int8Array(4 * N2), tY = new Int8Array(4 * N2), tSide = new Int32Array(4 * N2), tKind = new Uint8Array(4 * N2), tAt = new Int32Array(N2 + 1);
  let tLoops = 0;
  function traceCells(m) {
    tOut.fill(-1); tOpen.fill(0); tSeen.fill(0);
    for (let i = 0; i < N2; i++) {
      if (!m[i]) continue;
      const x = i % GRID, y = (i - x) / GRID;
      for (let sd = 0; sd < 4; sd++) {
        const nx = x + NX[sd], ny = y + NY[sd];
        if (nx >= 0 && ny >= 0 && nx < GRID && ny < GRID && m[ny * GRID + nx]) continue;
        const e = 4 * i + sd, p = 2 * ((y + SY0[sd]) * W1 + x + SX0[sd]);
        tOpen[e] = 1;
        if (tOut[p] < 0) tOut[p] = e; else tOut[p + 1] = e;
      }
    }
    let n = 0;
    tLoops = 0;
    for (let e0 = 0; e0 < 4 * N2; e0++) {
      if (!tOpen[e0] || tSeen[e0]) continue;
      tAt[tLoops++] = n;
      for (let e = e0; e >= 0 && !tSeen[e];) {
        tSeen[e] = 1;
        const i = e >> 2, sd = e & 3, x = i % GRID, y = (i - x) / GRID;
        tX[n] = x + SX0[sd]; tY[n] = y + SY0[sd]; tSide[n++] = e;
        const p = 2 * ((y + SY1[sd]) * W1 + x + SX1[sd]), b = tOut[p + 1];
        e = b >= 0 && b >> 2 === i ? b : tOut[p]; // (at a corner shared with a diagonal cell: keep to the same cell)
      }
    }
    tAt[tLoops] = n;
  }
  // Loop l's corners, placed `inset` units in toward its cells and pushed
  // `push` units out past the board's edge (a hollow there is a notch
  // bitten out of the log: its outline runs on under the frame), each with
  // how round it is (a corner of the cells `out`, a notch `inn`), the way on
  // from it and where it is on the grid. Into qx, qy, qr, qdx, qdy, qgx, qgy;
  // says how many.
  const qx = new Float32Array(4 * N2), qy = new Float32Array(4 * N2), qr = new Float32Array(4 * N2), qdx = new Int8Array(4 * N2), qdy = new Int8Array(4 * N2), qgx = new Int16Array(4 * N2), qgy = new Int16Array(4 * N2);
  function cornersOf(l, inset, out, inn, push) {
    const a = tAt[l], n = tAt[l + 1] - a;
    let m = 0;
    for (let j = 0; j < n; j++) {
      const p = a + (j + n - 1) % n, i = a + j, q = a + (j + 1) % n;
      const ax = tX[i] - tX[p], ay = tY[i] - tY[p], bx = tX[q] - tX[i], by = tY[q] - tY[i];
      if (ax === bx && ay === by) continue;
      let x = tX[i] * CELL - inset * (ay + by), y = tY[i] * CELL + inset * (ax + bx); // (in from both sides: the cells are on the right, -dy, dx)
      if (push) {
        if (tX[i] === 0) x -= push; else if (tX[i] === GRID) x += push;
        if (tY[i] === 0) y -= push; else if (tY[i] === GRID) y += push;
      }
      qx[m] = x; qy[m] = y; qr[m] = ax * by - ay * bx > 0 ? out : inn; qdx[m] = bx; qdy[m] = by; qgx[m] = tX[i] * CELL; qgy[m] = tY[i] * CELL;
      m++;
    }
    return m;
  }
  // The corners at hand (from cornersOf) as a closed path on p (a context or a Path2D).
  function cornersPath(p, m) {
    if (m < 4) return;
    p.moveTo((qx[m - 1] + qx[0]) / 2, (qy[m - 1] + qy[0]) / 2);
    for (let j = 0; j < m; j++) { const n = (j + 1) % m; p.arcTo(qx[j], qy[j], qx[n], qy[n], qr[j]); }
    p.closePath();
  }

  // Each realm: an owner's land as it's shown (and the land it's heading
  // for, as it changes), and its cached layers.
  const GROW_MS = 55;              // (a ring of land this often, as it changes)
  const RC = CELL / 2;             // (how round its corners are: half a cell, so a diagonal edge is a hand-drawn wave)
  const HOLE_LOST = -1000;         // (land lost to a hole goes at once)
  const LAND_BAND = [1.3, 0.05, 0.9, 0.06, 0.55, 0.08]; // (the soft band inside the border: width in cells, alpha, ...)
  const LAND_INK = 'rgba(28,18,9,0.92)', KEYLINE = 'rgba(246,236,210,0.75)', BORDER_INK = 2.2, BORDER_KEY = 1.2; // (a border's ink and its parchment keyline, and their widths in units)
  const KEYLINE_SOLID = '#ddd0b2'; // (the keyline, opaque, for round a rival on the land)
  const realms = new Map();        // owner -> realm
  const fieldSpecs = [];           // this frame's realms, in drawing order
  const inField = new Map();       // snake -> the owners whose land its head was on last frame
  const ripples = [];              // a ripple where a head crossed onto someone's land: { x, y, color, at }
  const landQ = new Int16Array(N2), landD = new Int16Array(N2), lostD = new Int16Array(N2), landWas = new Uint8Array(N2), otherLand = new Uint8Array(N2);
  function newRealm(s) {
    return {
      owner: s, color: s.color, idx: 0, gone: false, fieldSig: NaN, sig: NaN,
      sites: [], // (its fields as last seen, the capital first: { x, y, radius })
      target: new Uint8Array(N2), shown: new Uint8Array(N2), from: new Uint8Array(N2), order: new Int16Array(N2),
      steps: 0, step: -1, stepAt: 0, bx0: 0, by0: 0, bx1: -1, by1: -1, // (the cells a change spans: its layers' size while it plays out)
      layer: null, glow: null, X: 0, Y: 0, builtK: 0, dirty: true, any: false,
      shared: [], sharedAt: [], sharedTo: [], // (its contested sides: see sideLine; where each starts; and the realm across each, where only this one has the side)
      changedAt: -1e9, alertA: 0, pulses: [],
      fallen: [], // (its colonies lost to the woodpecker, a while: { x, y, radius, at }, see drawColonyFlags)
      banner: null, // (its banner as drawn, carried when its capital moves: see drawRealmBanner)
      spare: null, // (its layers as a strike will leave them, made ahead: see prebuild)
    };
  }
  // An owner's fields, as one number (a guest online gets fresh ones every tick).
  function fieldsSig(s) {
    let h = 7;
    const home = s.memory.home;
    if (home) h = (h * 131 + (home.y * GRID + home.x) * 16 + home.radius) % 1000000007;
    if (s.memory.colonies) for (const c of s.memory.colonies) h = (h * 131 + (c.y * GRID + c.x) * 16 + c.radius + 1) % 1000000007;
    return h;
  }
  function sitesOf(r, s) {
    r.sites.length = 0;
    if (s.memory.home) r.sites.push({ x: s.memory.home.x, y: s.memory.home.y, radius: s.memory.home.radius });
    if (s.memory.colonies) for (const c of s.memory.colonies) r.sites.push({ x: c.x, y: c.y, radius: c.radius });
  }
  // The land a realm should show: its fields' land, less the holes (none, once its owner's gone).
  function claimInto(r) {
    const m = r.target;
    m.fill(0);
    if (r.gone) return;
    for (const f of r.sites) {
      const R = f.radius + T.LAND_REACH;
      for (let y = Math.max(0, Math.ceil(f.y - R)); y <= Math.min(GRID - 1, Math.floor(f.y + R)); y++) {
        for (let x = Math.max(0, Math.ceil(f.x - R)); x <= Math.min(GRID - 1, Math.floor(f.x + R)); x++) {
          if (onLand(f, x, y) && !game.holes.has(y * GRID + x)) m[y * GRID + x] = 1;
        }
      }
    }
  }
  // How far cell i is from the nearest of a realm's field centres, in rings.
  function ringOf(r, i) {
    const x = i % GRID, y = (i - x) / GRID;
    let d = Infinity;
    for (const f of r.sites) d = Math.min(d, Math.hypot(x - f.x, y - f.y));
    return 1 + Math.floor(d);
  }
  // A change of land, played out a ring at a time (order: the step a cell
  // comes at, or minus the step it goes at). Cells gained: nearest the land
  // kept first, and new land round its field's centre, as a circle. Cells
  // lost: farthest from what's kept first, or with nothing kept (its owner's
  // gone), farthest from its centres, so it shrinks back into its capital.
  // Holes take their cell at once.
  function planGrowth(r) {
    const t = r.target, sh = r.shown, ord = r.order;
    let qn = 0, kept = false;
    landD.fill(-1);
    for (let i = 0; i < N2; i++) if (t[i] && sh[i]) { landD[i] = 0; landQ[qn++] = i; kept = true; }
    for (const f of r.sites) { const i = f.y * GRID + f.x; if (t[i] && landD[i] < 0) { landD[i] = 0; landQ[qn++] = i; } }
    spread(qn);
    let most = 0;
    for (let i = 0; i < N2; i++) {
      ord[i] = 0;
      if (!t[i] || sh[i]) continue;
      const ring = ringOf(r, i), d = kept ? landD[i] : -1;
      ord[i] = d >= 1 && d <= ring ? d : ring;
      if (ord[i] > most) most = ord[i];
    }
    qn = 0;
    landD.fill(-1);
    for (let i = 0; i < N2; i++) if (t[i]) { landD[i] = 0; landQ[qn++] = i; }
    spread(qn);
    let far = 0;
    for (let i = 0; i < N2; i++) {
      if (!sh[i] || t[i] || game.holes.has(i)) continue;
      const pit = pitRing(r, i); // (a colony lost to the woodpecker: its land shrinks away into its pit)
      lostD[i] = pit > 0 ? pit : qn ? Math.max(1, landD[i]) : ringOf(r, i);
      if (lostD[i] > far) far = lostD[i];
    }
    for (let i = 0; i < N2; i++) if (sh[i] && !t[i]) ord[i] = game.holes.has(i) ? HOLE_LOST : -(far + 1 - lostD[i]);
    r.steps = Math.max(most, far);
    r.from.set(sh);
    r.step = 0;
    // (its layers span all of it, before and after, while it plays out: they're not made again at every size)
    r.bx0 = r.by0 = GRID; r.bx1 = r.by1 = -1;
    for (let i = 0; i < N2; i++) if (t[i] || sh[i]) spanCell(r, i);
  }
  // How far cell i is from the pit of a colony of r's that fell into one, in
  // rings (0 if it isn't that colony's land).
  function pitRing(r, i) {
    const x = i % GRID, y = (i - x) / GRID;
    for (const f of r.fallen) if (onLand(f, x, y)) return 1 + Math.floor(Math.hypot(x - f.x, y - f.y));
    return 0;
  }
  function spanCell(r, i) {
    const x = i % GRID, y = (i - x) / GRID;
    if (x < r.bx0) r.bx0 = x;
    if (x > r.bx1) r.bx1 = x;
    if (y < r.by0) r.by0 = y;
    if (y > r.by1) r.by1 = y;
  }
  // Distances from the cells already queued, cell by cell (a breadth-first spread).
  function spread(qn) {
    for (let read = 0; read < qn; read++) {
      const i = landQ[read], x = i % GRID, d = landD[i] + 1;
      if (x > 0 && landD[i - 1] < 0) { landD[i - 1] = d; landQ[qn++] = i - 1; }
      if (x < GRID - 1 && landD[i + 1] < 0) { landD[i + 1] = d; landQ[qn++] = i + 1; }
      if (i >= GRID && landD[i - GRID] < 0) { landD[i - GRID] = d; landQ[qn++] = i - GRID; }
      if (i < N2 - GRID && landD[i + GRID] < 0) { landD[i + GRID] = d; landQ[qn++] = i + GRID; }
    }
  }
  // The land shown at step n of a change (or, n < 0, all of where it was heading).
  function showStep(r, n) {
    const sh = r.shown, from = r.from, ord = r.order;
    landWas.set(sh);
    if (n < 0) sh.set(r.target);
    else {
      for (let i = 0; i < N2; i++) {
        const o = ord[i];
        sh[i] = o > 0 ? (o <= n ? 1 : from[i]) : o < 0 ? (o === HOLE_LOST || -o <= n ? 0 : from[i]) : from[i];
      }
    }
    markDirty(r);
  }
  // A realm's land changed (from landWas): its layers are made again, and so
  // are those of any other realm a changed cell lies on or beside (its
  // contested sides moved).
  function markDirty(r) {
    r.dirty = true;
    for (const o of fieldSpecs) {
      if (o === r || o.dirty) continue;
      const m = o.shown;
      for (let i = 0; i < N2; i++) {
        if (r.shown[i] === landWas[i]) continue;
        const x = i % GRID;
        if (m[i] || (x > 0 && m[i - 1]) || (x < GRID - 1 && m[i + 1]) || (i >= GRID && m[i - GRID]) || (i < N2 - GRID && m[i + GRID])) { o.dirty = true; break; }
      }
    }
  }
  function updateRealm(r, now) {
    const sig = ((r.fieldSig * 31 + game.holes.size) * 2 + (r.gone ? 1 : 0)) % 1000000007;
    if (sig !== r.sig) {
      r.sig = sig;
      claimInto(r);
      let differs = false;
      for (let i = 0; i < N2 && !differs; i++) differs = r.target[i] !== r.shown[i];
      if (differs) {
        if (!r.gone) r.changedAt = now;
        if (reduced) { showStep(r, -1); r.step = -1; spanShown(r); }
        else {
          planGrowth(r);
          if (!r.steps) { showStep(r, -1); r.step = -1; spanShown(r); } else { showStep(r, 0); r.stepAt = now; }
        }
      }
    }
    if (r.step >= 0 && now - r.stepAt >= GROW_MS) {
      r.step++;
      r.stepAt = now;
      if (r.step < r.steps) showStep(r, r.step);
      else { showStep(r, -1); r.step = -1; spanShown(r); } // (done: its layers shrink to what's left)
    }
  }
  function spanShown(r) {
    r.bx0 = r.by0 = GRID; r.bx1 = r.by1 = -1;
    for (let i = 0; i < N2; i++) if (r.shown[i]) spanCell(r, i);
  }

  // A realm's cached layers, made again: its land and its border's glow, the
  // size of the cells it spans (and a margin, for the line and the glow),
  // landing on whole device pixels.
  const LAND_MARGIN = 10;
  const shownOf = o => o.shown;
  function buildRealm(r) {
    r.dirty = false; r.builtK = k; landVer++; landBuilds++;
    const p = prepRealm(r, r, r.shown, r, shownOf, game.holes);
    if (p) for (let st = 0; st < LAND_STEPS; st++) paintLandStep(p, st, r.layer.getContext('2d'), r.glow.getContext('2d'), r.color);
  }
  // A realm's layers made ready for its land m (r's, or as it will be: see
  // the strike's land, below), into `into` (r itself, or its spare): sized
  // to the cells m spans (box: bx0..by1), cleared, and the land traced and
  // planned (see planLand), against the other realms' land (maskOf) and the
  // holes (lost); with its contested sides (dashed in their own layer: see
  // buildDashes). Says the plan, to paint (null: no land left).
  function prepRealm(into, r, m, box, maskOf, lost) {
    into.shared.length = into.sharedAt.length = into.sharedTo.length = 0;
    into.any = box.bx1 >= 0;
    if (!into.any) return null;
    otherLand.fill(0);
    for (const o of fieldSpecs) if (o !== r) { const om = maskOf(o); for (let i = 0; i < N2; i++) if (om[i]) otherLand[i] = 1; }
    const ux = box.bx0 * CELL - LAND_MARGIN, uy = box.by0 * CELL - LAND_MARGIN;
    into.X = Math.floor(ux * k); into.Y = Math.floor(uy * k);
    const pw = Math.ceil(((box.bx1 + 1) * CELL + LAND_MARGIN) * k) - into.X + 1, ph = Math.ceil(((box.by1 + 1) * CELL + LAND_MARGIN) * k) - into.Y + 1;
    if (!into.layer) { into.layer = makeLayer(pw, ph); into.glow = makeLayer(pw / 2, ph / 2); }
    for (let c = into.layer, j = 0; j < 2; c = into.glow, j++) {
      const s = j ? 0.5 : 1, w = Math.ceil(pw * s), h = Math.ceil(ph * s); // (the glow at half the resolution: it's soft, and a quarter of the pixels to light up)
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const g = c.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, w, h);
      g.setTransform(k * s, 0, 0, k * s, -into.X * s, -into.Y * s);
      g.lineCap = g.lineJoin = 'round';
    }
    const p = planLand(m, otherLand, lost, r.idx);
    // Where its land runs into another's that also covers its own cell
    // there, only this realm has the side, so it dashes both halves.
    for (let l = 0; l < tLoops; l++) {
      const a = tAt[l], n = tAt[l + 1] - a;
      for (let j = 0; j < n; j++) {
        if (tKind[a + j] !== 1) continue;
        into.sharedAt.push(into.shared.length);
        sideLine(into.shared, a, n, j);
        const e = tSide[a + j], i = e >> 2, across = i + NX[e & 3] + NY[e & 3] * GRID;
        let to = null;
        for (const o of fieldSpecs) { if (o === r) continue; const om = maskOf(o); if (om[across]) { to = om[i] ? o : null; break; } }
        into.sharedTo.push(to);
      }
    }
    into.sharedAt.push(into.shared.length);
    return p;
  }
  // Side j of the loop at a (n points) as a line of points along the
  // rounded border (half of a rounded corner at either end is the side's),
  // from its smaller end, so both owners' dashes fall alike: x, y and how
  // far along, pushed onto out.
  const sidePts = [];
  function sideLine(out, a, n, j) {
    const sx = runX(a, n, j), sy = runY(a, n, j), ex = runX(a, n, j + 1), ey = runY(a, n, j + 1);
    const dx = Math.sign(ex - sx), dy = Math.sign(ey - sy);
    const px = Math.sign(sx - runX(a, n, j - 1)), py = Math.sign(sy - runY(a, n, j - 1)); // (the side before...)
    const nx = Math.sign(runX(a, n, j + 2) - ex), ny = Math.sign(runY(a, n, j + 2) - ey); // (...and after)
    sidePts.length = 0;
    if (px !== dx || py !== dy) arcHalf(sx, sy, px, py, dx, dy, 0.5, 1); else sidePts.push(sx, sy);
    if (nx !== dx || ny !== dy) arcHalf(ex, ey, dx, dy, nx, ny, 0, 0.5); else sidePts.push(ex, ey);
    const back = ex < sx || ey < sy, m = sidePts.length / 2;
    let len = 0, lx = 0, ly = 0;
    for (let q = 0; q < m; q++) {
      const p = back ? m - 1 - q : q, x = sidePts[2 * p], y = sidePts[2 * p + 1];
      if (q) len += Math.hypot(x - lx, y - ly);
      out.push(x, y, len);
      lx = x; ly = y;
    }
  }
  // Part (t0..t1) of the rounded corner at (cx, cy), coming in along (ix, iy) and going on along (ox, oy), onto sidePts.
  function arcHalf(cx, cy, ix, iy, ox, oy, t0, t1) {
    const ox0 = cx + (ox - ix) * RC, oy0 = cy + (oy - iy) * RC, a1 = Math.atan2(-iy * RC - (oy - iy) * RC, -ix * RC - (ox - ix) * RC);
    let sweep = Math.atan2(cy + oy * RC - oy0, cx + ox * RC - ox0) - a1;
    if (sweep > Math.PI) sweep -= TAU; else if (sweep < -Math.PI) sweep += TAU;
    for (let s = 0; s <= 4; s++) { const an = a1 + sweep * (t0 + (t1 - t0) * s / 4); sidePts.push(ox0 + Math.cos(an) * RC, oy0 + Math.sin(an) * RC); }
  }
  // Land (cells m) as it looks, on g: a light wash over all of it, a soft
  // band deepening toward its border inside it, a strong riband of colour
  // hugging the line (an old map's hand-colouring), hatching where it's
  // contested (one diagonal each, by idx, so two owners make a light plaid),
  // and the inked line itself, with a parchment keyline just inside it
  // (none along the board's edge or a hole: that's coast). The colour alone
  // carries nothing for a colour-blind eye (Colonist's rose goes grey-khaki,
  // its ink no darker than the bark's grain): the light keyline against the
  // ink does, for every eye. On gg, if given, its border's glow, for when it
  // lights up. other: the other owners' land; lost: the holes.
  function paintLand(g, gg, m, other, col, idx, lost) {
    const p = planLand(m, other, lost, idx);
    for (let st = 0; st < LAND_STEPS; st++) paintLandStep(p, st, g, gg, col);
  }
  // Land m, traced (see traceCells: its sides' kinds left in tKind) and laid
  // out as paths: all of it, its edge (the border and its contested
  // sides), its border, and where it's contested, the hatching's cells.
  function planLand(m, other, lost, idx) {
    traceCells(m);
    for (let j = 0; j < tAt[tLoops]; j++) {
      const e = tSide[j], i = e >> 2, sd = e & 3, x = i % GRID + NX[sd], y = (i - i % GRID) / GRID + NY[sd];
      tKind[j] = x < 0 || y < 0 || x >= GRID || y >= GRID || lost.has(y * GRID + x) ? 2 : other[y * GRID + x] ? 1 : 0;
    }
    const land = new Path2D(), edge = new Path2D(), border = new Path2D();
    for (let l = 0; l < tLoops; l++) cornersPath(land, cornersOf(l, 0, RC, RC, 0));
    const anyBorder = runsPath(border, 0), anyEdge = runsPath(edge, 0) | runsPath(edge, 1);
    let x0 = GRID, y0 = GRID, x1 = -1, y1 = -1;
    const hatch = new Path2D();
    for (let i = 0; i < N2; i++) {
      if (!m[i] || !other[i]) continue;
      const x = i % GRID, y = (i - x) / GRID;
      hatch.rect(x * CELL, y * CELL, CELL, CELL);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { land, edge, border, hatch, anyBorder, anyEdge, idx, x0, y0, x1, y1 };
  }
  // The land planned (p) painted, a step at a time, in order: a light wash
  // over all of it; inside it (clipped to it), the soft band deepening
  // toward its border, a stroke a step; the keyline and the hatching; the
  // inked line; its glow, on gg. All at once as it's made, or (the land a
  // strike will leave) a step a frame (see prebuild). Each step clips anew,
  // as all of them at once did, so either way it's the same pixels.
  const LAND_STEPS = 8;
  function paintLandStep(p, st, g, gg, col) {
    if (st === 0) { g.fillStyle = rgba(col, 0.1); g.fill(p.land, 'evenodd'); return; }
    if (st <= 4) {
      if (!p.anyEdge) return;
      g.save();
      g.clip(p.land, 'evenodd');
      g.strokeStyle = col;
      if (st < 4) { g.globalAlpha = LAND_BAND[2 * st - 1]; g.lineWidth = LAND_BAND[2 * st - 2] * CELL; }
      else { g.globalAlpha = 0.55; g.lineWidth = 12; } // (half of it shows: 6 units inside the line)
      g.stroke(p.edge);
      g.restore();
      return;
    }
    if (st === 5) {
      if (!p.anyBorder && p.x1 < 0) return;
      g.save();
      g.clip(p.land, 'evenodd');
      if (p.anyBorder) { // (the keyline: inside the land, from the ink's inner edge on; the ink goes over its outer part, below)
        g.strokeStyle = KEYLINE;
        g.lineWidth = 2 * (BORDER_INK / 2 + BORDER_KEY);
        g.stroke(p.border);
      }
      if (p.x1 >= 0) {
        const { x0, y0, x1, y1 } = p;
        g.clip(p.hatch);
        g.strokeStyle = rgba(col, 0.32);
        g.lineWidth = 1.3;
        g.beginPath();
        const L = (x1 - x0 + y1 - y0 + 2) * CELL, X0 = x0 * CELL, Y0 = y0 * CELL, Y1 = (y1 + 1) * CELL;
        for (let d = 0; d <= L; d += 14) { // (diagonals across the box, from its left edge)
          if (p.idx % 2) { g.moveTo(X0 + d - (Y1 - Y0), Y0); g.lineTo(X0 + d, Y1); } else { g.moveTo(X0 + d - (Y1 - Y0), Y1); g.lineTo(X0 + d, Y0); }
        }
        g.stroke();
      }
      g.restore();
      return;
    }
    if (st === 6) {
      if (!p.anyBorder) return;
      g.strokeStyle = LAND_INK;
      g.lineWidth = BORDER_INK;
      g.stroke(p.border);
      return;
    }
    if (gg && p.anyEdge) {
      gg.strokeStyle = col;
      gg.globalAlpha = 0.5; gg.lineWidth = 9; gg.stroke(p.edge);
      gg.globalAlpha = 1; gg.strokeStyle = mix(col, '#fff7e0', 0.45); gg.lineWidth = 2.5; gg.stroke(p.edge);
    }
  }
  // Every run of traced sides of one kind (0 border, 1 contested) as open
  // subpaths of p, rounded at their corners as the land is. Says whether there were any.
  function runsPath(p, want) {
    let any = false;
    for (let l = 0; l < tLoops; l++) {
      const a = tAt[l], n = tAt[l + 1] - a;
      let all = true;
      for (let j = a; j < a + n; j++) if (tKind[j] !== want) { all = false; break; }
      if (all) { cornersPath(p, cornersOf(l, 0, RC, RC, 0)); any = true; continue; }
      let s0 = 0;
      while (tKind[a + s0] === want) s0++; // (from just after a run, so none is split where the loop starts)
      for (let m = 1; m <= n; m++) {
        const j = (s0 + m) % n;
        if (tKind[a + j] !== want) continue;
        let e = j;
        while (tKind[a + (e + 1) % n] === want) e++;
        runPath(p, a, n, j, e);
        any = true;
        m += e - j;
      }
    }
    return any;
  }
  // Sides j0..j1 of the loop at a (n points), as an open path on p. A corner
  // at either end is drawn whole, so a run ends round.
  const runX = (a, n, j) => tX[a + ((j % n) + n) % n] * CELL, runY = (a, n, j) => tY[a + ((j % n) + n) % n] * CELL;
  function runPath(p, a, n, j0, j1) {
    const dx = j => Math.sign(runX(a, n, j + 1) - runX(a, n, j)), dy = j => Math.sign(runY(a, n, j + 1) - runY(a, n, j));
    const corner = j => dx(j - 1) !== dx(j) || dy(j - 1) !== dy(j);
    const x0 = runX(a, n, j0), y0 = runY(a, n, j0);
    if (corner(j0)) { p.moveTo(x0 - dx(j0 - 1) * RC, y0 - dy(j0 - 1) * RC); p.arcTo(x0, y0, x0 + dx(j0) * RC, y0 + dy(j0) * RC, RC); }
    else p.moveTo(x0, y0);
    for (let j = j0; j <= j1; j++) {
      const x = runX(a, n, j + 1), y = runY(a, n, j + 1);
      if (corner(j + 1)) p.arcTo(x, y, x + dx(j + 1) * RC, y + dy(j + 1) * RC, RC);
      else if (j === j1) p.lineTo(x, y);
    }
  }

  function drawFields(now) {
    fieldSpecs.length = 0;
    for (const s of game.snakes) {
      const owns = s.alive && (s.memory.home || s.memory.colonies);
      let r = realms.get(s);
      if (!owns && !r) continue;
      if (!r) { r = newRealm(s); r.idx = realms.size; realms.set(s, r); } // (its place, for which way it hatches and when its dashes come: kept while it lasts)
      r.gone = !owns;
      if (owns) {
        const sig = fieldsSig(s);
        if (sig !== r.fieldSig) { r.fieldSig = sig; sitesOf(r, s); }
        if (r.color !== s.color) { r.color = s.color; r.dirty = true; }
      }
      fieldSpecs.push(r);
    }
    if (!fieldSpecs.length) return;
    for (const r of fieldSpecs) updateRealm(r, now);
    for (let i = fieldSpecs.length - 1; i >= 0; i--) { // (a fallen owner's land, once it has shrunk away)
      const r = fieldSpecs[i];
      if (r.gone && r.step < 0 && r.bx1 < 0) { realms.delete(r.owner); fieldSpecs.splice(i, 1); }
    }
    let built = fieldSpecs.length !== dash.for, ready = -1, swapped = 0, rebuilt = 0;
    for (const r of fieldSpecs) {
      if (!r.dirty && r.builtK === k) continue;
      if (ready < 0) { ready = pre.ready && preStill() ? 1 : 0; if (!ready && game.woodpecker?.struckAt === game.tick - 1) { if (pre.ready) landStale++; else landUnready++; } } // (the land a strike leaves, made ahead: is it the land now? (if not, at a strike, why not: counted for the tests))
      if (ready && pre.todo.includes(r)) { swapIn(r); swapped++; } else { buildRealm(r); rebuilt++; }
      built = true;
    }
    if (built) {
      if (ready > 0 && !rebuilt && swapped === pre.todo.length) swapDashes();
      else buildDashes();
      pre.ready = false;
    }
    if (prebuilding) prebuild();
    const lively = !reduced, t = now / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const r of fieldSpecs) if (r.any) ctx.drawImage(r.layer, r.X + shakeX, r.Y + shakeY);
    if (dash.any) ctx.drawImage(dash.layer, dash.X + shakeX, dash.Y + shakeY);
    // Lit up: breathing softly, quicker and brighter, while a rival's head is
    // on the land; flaring as it changes, and in a lightning flash; and from
    // where a head crossed in, lighting up along itself (see drawFieldHues).
    for (const r of fieldSpecs) {
      if (!r.any) continue;
      let alert = false;
      if (!r.gone) {
        for (const s of game.snakes) {
          if (!s.alive || s === r.owner) continue;
          const h = s.body[0];
          if (r.shown[h.y * GRID + h.x]) { alert = true; break; }
        }
      }
      r.alertA += ((alert ? 1 : 0) - r.alertA) * Math.min(1, frameDt / 200);
      const pulse = lively ? 0.5 + 0.5 * Math.sin(t * (2.2 + 5 * r.alertA)) : 0.5;
      const flare = Math.max(0, 1 - (now - r.changedAt) / 900, 1 - (now - flashAt) / 700);
      const a = Math.min(1, r.alertA * (0.1 + 0.15 * pulse) + 0.7 * flare);
      const gw = r.glow.width, gh = r.glow.height;
      if (a > 0.01) { ctx.globalAlpha = a; ctx.drawImage(r.glow, r.X + shakeX, r.Y + shakeY, 2 * gw, 2 * gh); }
      for (let i = r.pulses.length - 1; i >= 0; i--) {
        const p = r.pulses[i], u = (now - p.at) / 650;
        if (u >= 1 || u < 0) { r.pulses.splice(i, 1); continue; }
        const half = CELL * (0.8 + 4 * u) * k / 2, cx = (p.x * k - r.X) / 2, cy = (p.y * k - r.Y) / 2; // (in the glow's half-size pixels)
        const sx = Math.max(0, Math.floor(cx - half)), sy = Math.max(0, Math.floor(cy - half)), ex = Math.min(gw, Math.ceil(cx + half)), ey = Math.min(gh, Math.ceil(cy + half));
        if (ex <= sx || ey <= sy) continue;
        ctx.globalAlpha = 0.9 * (1 - u);
        ctx.drawImage(r.glow, sx, sy, ex - sx, ey - sy, r.X + 2 * sx + shakeX, r.Y + 2 * sy + shakeY, 2 * (ex - sx), 2 * (ey - sy));
      }
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
    // The flags, while the land under them is still there (one the
    // woodpecker pecked out falls into the pit, and a capital's banner is
    // carried to the new one: see drawColonyFlags and drawRealmBanner).
    for (const r of fieldSpecs) {
      const s = r.owner;
      if (s.memory.home) drawRealmBanner(r, s.memory.home, now);
      if (s.memory.colonies) drawColonyFlags(r, now);
    }
    if (fallenFlags.length) drawFallenFlags(now);
  }

  // The land a strike will leave, made ahead. Made at the strike, the land's
  // layers took that frame tens of milliseconds (painting them, mostly the
  // GPU's), a hitch everyone saw. So while the woodpecker aims (17 ticks),
  // the layers of every realm its patch will cut, or run beside (its
  // contested sides change too), are made in spare canvases as they'll be
  // once the patch is holes, and the dashes with them: a step a frame (the
  // land planned, then each stroke of it: see paintLandStep), each sent to
  // the GPU in its own frame (kick), so no frame takes much. At the strike,
  // if that's the land then (every realm's land, the holes, the
  // resolution, all as foreseen: see preStill), they're swapped in;
  // otherwise (anything else changed meanwhile) it's made the old way.
  const pre = {
    ready: false, key: NaN, step: 0, steps: 0, k: 0, // (made, for the aim keyed so, in steps)
    specs: [], post: [], colors: [], todo: [], // (the realms as they were then; each one's land after the strike; the realms to make again)
    holes: new Uint8Array(N2), plan: null, dash: { layer: null, X: 0, Y: 0, any: false, for: 0 },
  };
  let tickEvery = 100, tickNow = 0; // (how long a tick is on the board's clock as it's played, eased: a few frames' worth, or none when it's watched fast; and the last's)
  let landVer = 0, prebuilding = true; // (landVer: the land's changes, counted; prebuilding: off only for the tests, to compare)
  const preLost = { has: i => pre.holes[i] === 1 };
  const postOf = o => pre.post[pre.specs.indexOf(o)];
  const spareSides = r => pre.todo.includes(r) ? r.spare : r;
  let kickG = null;
  // (Drawn from, a canvas's waiting work goes to the GPU now: unsent, it all
  // went at the strike, and that frame cost more than making it then. The
  // little canvas is cleared at once, so it holds on to nothing.)
  function kick(c) { (kickG ||= makeLayer(1, 1).getContext('2d')).drawImage(c, 0, 0, 1, 1, 0, 0, 1, 1); kickG.clearRect(0, 0, 1, 1); }
  function prebuild() {
    const w = game.woodpecker;
    if (!w || !w.target.length) { pre.key = NaN; return; }
    let key = (w.target.length * 977 + game.holes.size * 31 + landVer * 7919 + Math.round(k * 1000)) | 0;
    for (const c of w.target) key = (key * 31 + c) | 0;
    for (const r of fieldSpecs) {
      if (r.step >= 0 || r.dirty || r.gone || r.builtK !== k) { pre.key = NaN; return; } // (wait for the land to settle)
      key = (key * 31 + r.idx) | 0;
    }
    let same = key === pre.key && pre.specs.length === fieldSpecs.length;
    for (let j = 0; same && j < fieldSpecs.length; j++) same = fieldSpecs[j] === pre.specs[j];
    if (!same) { pre.key = key; pre.step = 0; pre.ready = false; }
    // A step a frame, or more when the strike's too near for that (watched
    // fast, or the land only just settled): the frames left before it, from
    // the ticks left and how long a tick is as it's played (see onTick).
    const framesLeft = Math.max(1, (w.strikeAt - game.tick + 0.5) * tickEvery / Math.max(8, frameDt) - 1);
    for (let n = pre.step ? Math.min(4, Math.ceil((pre.steps + 1 - pre.step) / framesLeft)) : 1; n > 0 && !pre.ready && pre.step <= pre.steps; n--) prebuildStep(w);
  }
  function prebuildStep(w) {
    const st = pre.step++;
    if (st === 0) { prePlan(w.target); return; }
    const per = 1 + LAND_STEPS, n = st - 1, ri = Math.floor(n / per), sub = n % per;
    if (ri < pre.todo.length) {
      const r = pre.todo[ri], sp = r.spare;
      if (!sub) { const m = postOf(r); pre.plan = prepRealm(sp, r, m, boxOf(m), postOf, preLost); return; }
      if (!pre.plan) return;
      paintLandStep(pre.plan, sub - 1, sp.layer.getContext('2d'), sp.glow.getContext('2d'), r.color);
      kick(sub === LAND_STEPS ? sp.glow : sp.layer);
      return;
    }
    buildDashes(pre.dash, spareSides);
    if (pre.dash.any) kick(pre.dash.layer);
    pre.ready = true;
  }
  // The first step: each realm's land after the strike (its land less the
  // patch), and which realms will be made again then: those it cuts, and
  // those beside a cell they lose (as markDirty will find them).
  function prePlan(target) {
    pre.k = k; pre.plan = null;
    pre.specs.length = pre.post.length = pre.colors.length = pre.todo.length = 0;
    pre.holes.fill(0);
    for (const h of game.holes) pre.holes[h] = 1;
    for (const c of target) pre.holes[c] = 1;
    for (const r of fieldSpecs) {
      r.spare ||= { layer: null, glow: null, X: 0, Y: 0, any: false, shared: [], sharedAt: [], sharedTo: [], post: new Uint8Array(N2) };
      const m = r.spare.post;
      m.set(r.shown);
      for (const c of target) m[c] = 0;
      pre.specs.push(r); pre.post.push(m); pre.colors.push(r.color);
    }
    for (const r of fieldSpecs) {
      let cut = false;
      for (const c of target) if (r.shown[c]) { cut = true; break; }
      if (cut) pre.todo.push(r);
    }
    const cuts = pre.todo.length;
    for (const o of fieldSpecs) {
      if (pre.todo.includes(o)) continue;
      let beside = false;
      for (let j = 0; j < cuts && !beside; j++) {
        const r = pre.todo[j];
        for (const c of target) {
          if (!r.shown[c]) continue;
          const m = o.shown, x = c % GRID;
          if (m[c] || (x > 0 && m[c - 1]) || (x < GRID - 1 && m[c + 1]) || (c >= GRID && m[c - GRID]) || (c < N2 - GRID && m[c + GRID])) { beside = true; break; }
        }
      }
      if (beside) pre.todo.push(o);
    }
    pre.steps = pre.todo.length ? 1 + pre.todo.length * (1 + LAND_STEPS) : 0; // (none cut: nothing to make)
    if (!pre.steps) pre.step = 1; // (and nothing to swap: it stays not ready)
  }
  const preBox = { bx0: 0, by0: 0, bx1: -1, by1: -1 };
  function boxOf(m) {
    preBox.bx0 = preBox.by0 = GRID; preBox.bx1 = preBox.by1 = -1;
    for (let i = 0; i < N2; i++) {
      if (!m[i]) continue;
      const x = i % GRID, y = (i - x) / GRID;
      if (x < preBox.bx0) preBox.bx0 = x;
      if (x > preBox.bx1) preBox.bx1 = x;
      if (y < preBox.by0) preBox.by0 = y;
      if (y > preBox.by1) preBox.by1 = y;
    }
    return preBox;
  }
  // Is the land now what was made ahead: the same realms, each one's land
  // as foreseen, the same holes, at the same resolution?
  function preStill() {
    if (pre.k !== k || pre.specs.length !== fieldSpecs.length) return false;
    for (let j = 0; j < fieldSpecs.length; j++) {
      const r = fieldSpecs[j], m = pre.post[j];
      if (r !== pre.specs[j] || r.color !== pre.colors[j]) return false;
      for (let i = 0; i < N2; i++) if (r.shown[i] !== m[i]) return false;
    }
    let n = 0;
    for (let i = 0; i < N2; i++) n += pre.holes[i];
    if (n !== game.holes.size) return false;
    for (const h of game.holes) if (!pre.holes[h]) return false;
    return true;
  }
  // A realm's layers, made ahead, swapped in (the old ones are its spares now).
  function swapIn(r) {
    const sp = r.spare;
    let t = r.layer; r.layer = sp.layer; sp.layer = t;
    t = r.glow; r.glow = sp.glow; sp.glow = t;
    t = r.shared; r.shared = sp.shared; sp.shared = t;
    t = r.sharedAt; r.sharedAt = sp.sharedAt; sp.sharedAt = t;
    t = r.sharedTo; r.sharedTo = sp.sharedTo; sp.sharedTo = t;
    r.X = sp.X; r.Y = sp.Y; r.any = sp.any;
    r.dirty = false; r.builtK = k; landVer++; landSwaps++;
  }
  let landSwaps = 0, landBuilds = 0, landStale = 0, landUnready = 0; // (realms' layers swapped in at a strike, and made; strikes it was made the old way at, the land made ahead not as it is then, or not made yet: for the tests)
  function swapDashes() {
    const d = pre.dash;
    const t = dash.layer; dash.layer = d.layer; d.layer = t;
    dash.X = d.X; dash.Y = d.Y; dash.any = d.any; dash.for = d.for;
  }

  // Where two owners' land meets: every contested side dashed half in one
  // owner's colour, half in the other's, over an ink line, in one cached
  // layer for every realm, made again whenever any land is (stroked every
  // frame, the dashes' many short pieces cost as much as the rest of the
  // land; marching, they cost that and more).
  const dash = { layer: null, X: 0, Y: 0, any: false, for: 0 }; // (for: how many realms it was made for)
  const ownSides = r => r;
  // Into `into` (the dashes' layer, or its spare), from each realm's
  // contested sides as sidesOf has them (its own, or as a strike will leave them).
  function buildDashes(into = dash, sidesOf = ownSides) {
    into.for = fieldSpecs.length;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of fieldSpecs) {
      const sh = sidesOf(r).shared;
      for (let i = 0; i < sh.length; i += 3) {
        x0 = Math.min(x0, sh[i]); x1 = Math.max(x1, sh[i]);
        y0 = Math.min(y0, sh[i + 1]); y1 = Math.max(y1, sh[i + 1]);
      }
    }
    into.any = x1 >= x0;
    if (!into.any) return;
    into.X = Math.floor((x0 - 4) * k); into.Y = Math.floor((y0 - 4) * k);
    const w = Math.ceil((x1 + 4) * k) - into.X + 1, h = Math.ceil((y1 + 4) * k) - into.Y + 1;
    if (!into.layer) into.layer = makeLayer(w, h);
    else if (into.layer.width !== w || into.layer.height !== h) { into.layer.width = w; into.layer.height = h; }
    const g = into.layer.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.setTransform(k, 0, 0, k, -into.X, -into.Y);
    g.lineCap = 'butt';
    g.lineJoin = 'round';
    for (const r of fieldSpecs) {
      const h = sidesOf(r);
      if (!h.shared.length) continue;
      const s0 = r.idx % 2 ? 0.5 : 0;
      dashes(g, h, r.color, s0, null);
      for (const o of fieldSpecs) if (o !== r && h.sharedTo.includes(o)) dashes(g, h, r.color, 0.5 - s0, o); // (the other half, where only this realm has the side)
    }
  }
  // Half of each of a realm's contested sides (h: its shared, sharedAt and
  // sharedTo), from s0 along it (to s0 + 0.5), on g in its colour (col)
  // over an ink line; or with o, the halves of the sides only it has
  // against o's land, in o's colour.
  function dashes(g, h, col, s0, o) {
    const sh = h.shared, at = h.sharedAt;
    g.beginPath();
    for (let n = 0; n < h.sharedTo.length; n++) {
      if (o && h.sharedTo[n] !== o) continue;
      const L = sh[at[n + 1] - 1];
      dashAlong(g, sh, at[n], at[n + 1], s0 * L, (s0 + 0.5) * L);
    }
    if (o) col = o.color;
    g.strokeStyle = LAND_INK;
    g.lineWidth = 5;
    g.stroke();
    g.strokeStyle = col;
    g.lineWidth = 2.6;
    g.stroke();
  }
  // The stretch u0..u1 along a side's line of points (sh[i0..i1]: see sideLine), added to g's path.
  function dashAlong(g, sh, i0, i1, u0, u1) {
    let started = false;
    for (let i = i0; i + 3 < i1; i += 3) {
      const la = sh[i + 2], lb = sh[i + 5];
      if (lb < u0 || la > u1) continue;
      const span = lb - la || 1, f0 = Math.max(0, (u0 - la) / span), f1 = Math.min(1, (u1 - la) / span);
      const ax = sh[i], ay = sh[i + 1], bx = sh[i + 3], by = sh[i + 4];
      if (!started) { g.moveTo(ax + (bx - ax) * f0, ay + (by - ay) * f0); started = true; }
      g.lineTo(ax + (bx - ax) * f1, ay + (by - ay) * f1);
    }
  }

  // Sovereign's capital: a swallow-tailed banner on a pole, as a map marks a
  // capital: parchment and ink (no gold: gold means a power), an inked crown
  // on it and a trim in the realm's colour, fluttering like the colonies' flags.
  const BANNER_W = 0.95, BANNER_H = 0.62;
  const bannerSprite = col => sprite('banner', col, drawBannerCloth);
  const drawBannerCloth = (g, col) => {
    const c = CELL, w = c * BANNER_W, h = c * BANNER_H, y0 = -h / 2, notch = w * 0.28;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(0, y0); g.lineTo(w, y0); g.lineTo(w - notch, 0); g.lineTo(w, y0 + h); g.lineTo(0, y0 + h); g.closePath();
    g.fillStyle = '#f6ecd2'; g.fill();
    g.strokeStyle = '#3a2614'; g.lineWidth = 1.6; g.stroke();
    g.strokeStyle = col; g.lineWidth = 1.4; // (a trim inside its edge, in the realm's colour)
    g.beginPath(); g.moveTo(2, y0 + 2.2); g.lineTo(w - 3.4, y0 + 2.2); g.moveTo(2, y0 + h - 2.2); g.lineTo(w - 3.4, y0 + h - 2.2); g.stroke();
    const cx = w * 0.36, cy = 0.5, cw = h * 0.62, ch = h * 0.42; // (the crown, in ink)
    g.beginPath();
    g.moveTo(cx - cw / 2, cy + ch / 2); g.lineTo(cx - cw / 2, cy - ch / 2); g.lineTo(cx - cw / 4, cy - ch * 0.05); g.lineTo(cx, cy - ch / 2 - 1);
    g.lineTo(cx + cw / 4, cy - ch * 0.05); g.lineTo(cx + cw / 2, cy - ch / 2); g.lineTo(cx + cw / 2, cy + ch / 2); g.closePath();
    g.fillStyle = '#3a2614'; g.fill();
  };
  // (At cx, cy in cells; tilted about its pole's foot and scaled, as it's
  // carried; fluttering on its own beat.)
  function drawBanner(cx, cy, col, now, tilt = 0, sc = 1, beat = cx) {
    const x = cx * CELL + CELL / 2, y = cy * CELL + CELL / 2, turned = tilt || sc !== 1;
    if (turned) { ctx.save(); ctx.translate(x, y + CELL * 0.6); ctx.rotate(tilt); ctx.scale(sc, sc); ctx.translate(-x, -y - CELL * 0.6); }
    flagPole(x, y);
    const sp = bannerSprite(col), half = SPRITE * CELL / 2, dev = sp.width / (SPRITE * CELL);
    const w = CELL * BANNER_W, h = CELL * BANNER_H + 2, sw = w / FLAG_STRIPS, top = y - CELL * 0.95 - 1;
    for (let i = 0; i < FLAG_STRIPS; i++) {
      const out = (i + 0.5) / FLAG_STRIPS;
      const dy = reduced ? 0 : Math.sin(now / 200 - i * 0.9 + beat) * CELL * 0.05 * out;
      ctx.drawImage(sp, (half + i * sw) * dev, (half - h / 2) * dev, (sw + 0.6) * dev, h * dev, x + 1.5 + i * sw, top + dy, sw + 0.6, h);
    }
    if (turned) ctx.restore();
  }
  // Sovereign's banner over its capital, as drawn. When the capital moves,
  // it goes too: a quick glide as the realm drifts a cell; pecked out from
  // under it, it teeters over the pit until the realm moves (at once, as
  // the rules have it), and is carried there, lifted (bigger) and leaning
  // the way it's going. While the land under it is there, as before, or
  // while it's on its way. With reduced motion it's simply at the new
  // capital, and doesn't teeter.
  const BANNER_GLIDE_MS = 240, BANNER_CARRY_MS = 700;
  function drawRealmBanner(r, home, now) {
    let b = r.banner;
    if (!b) b = r.banner = { fx: home.x, fy: home.y, tx: home.x, ty: home.y, at: -1e9, carry: false };
    const dur = b.carry ? BANNER_CARRY_MS : BANNER_GLIDE_MS;
    let u = reduced ? 1 : Math.max(0, Math.min(1, (now - b.at) / dur)), e = u * u * (3 - 2 * u);
    if (home.x !== b.tx || home.y !== b.ty) { // (moved: from where it's drawn now)
      const fx = b.fx + (b.tx - b.fx) * e, fy = b.fy + (b.ty - b.fy) * e;
      b.carry = !!holeMask[b.ty * GRID + b.tx];
      b.fx = fx; b.fy = fy; b.tx = home.x; b.ty = home.y; b.at = now;
      u = reduced ? 1 : 0; e = u;
    }
    const x = b.fx + (b.tx - b.fx) * e, y = b.fy + (b.ty - b.fy) * e, key = home.y * GRID + home.x;
    const pecked = u >= 1 && !!holeMask[key] && !r.gone;
    if (u >= 1 && !pecked && !r.shown[key]) return;
    let tilt = 0, sc = 1;
    if (u < 1 && b.carry) { const l = Math.sin(u * Math.PI); sc = 1 + 0.2 * l; tilt = 0.3 * l * (b.tx >= b.fx ? 1 : -1); }
    else if (pecked && !reduced) tilt = Math.sin(now / 85) * 0.2;
    drawBanner(x, y, r.color, now, tilt, sc, home.x);
  }
  // A flagpole: inked, with a parchment core and a parchment knob on top.
  function flagPole(x, y) {
    ctx.strokeStyle = '#3a2614';
    ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(x, y + CELL * 0.6); ctx.lineTo(x, y - CELL * 0.98); ctx.stroke();
    ctx.strokeStyle = '#e7d7b1';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#f6ecd2';
    circle(x, y - CELL, 2.8);
    ctx.strokeStyle = '#3a2614';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // The Union Flag, as flown over the Empire's colonies (a redcoat's flag: St
  // George's cross for England, St Andrew's saltire for Scotland, St Patrick's,
  // counterchanged, for Ireland), 5:3, its hoist at the sprite's centre.
  // The second colony and later fly colonial ensigns, as the Empire's
  // colonies did: the Union Flag in the corner, a Blue Ensign with the
  // Southern Cross, or a Red Ensign with a colony's badge (here, the log's own
  // oak on a white roundel). 'union' | 'blue' | 'red'.
  const UNION_W = 0.95, UNION_H = 0.57;
  const flagSprite = v => sprite('flag', v, drawColonyFlag);
  const drawColonyFlag = (g, v) => {
    const c = CELL, w = c * UNION_W, h = c * UNION_H, y0 = -h / 2;
    if (v === 'union') unionAt(g, 0, y0, w, h);
    else {
      g.fillStyle = v === 'blue' ? '#012169' : '#c8102e';
      g.fillRect(0, y0, w, h);
      unionAt(g, 0, y0, w / 2, h / 2);
      g.fillStyle = '#ffffff';
      if (v === 'blue') { // the Southern Cross
        for (const [sx, sy, sr] of [[0.75, -0.3, 0.08], [0.62, 0.02, 0.07], [0.88, -0.06, 0.07], [0.75, 0.32, 0.08], [0.8, 0.12, 0.04]]) starOn(g, w * sx, h * sy, h * sr);
      } else { // a badge: the oak on a white roundel
        const bx = w * 0.74, by = h * 0.04, br = h * 0.24;
        g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill();
        g.fillStyle = '#7c2d12';
        g.fillRect(bx - br * 0.12, by, br * 0.24, br * 0.6);
        g.fillStyle = '#15803d';
        g.beginPath(); g.arc(bx, by - br * 0.1, br * 0.5, 0, TAU); g.fill();
      }
    }
    g.strokeStyle = 'rgba(15,23,42,0.4)';
    g.lineWidth = 1;
    g.strokeRect(0, y0, w, h);
  };
  function starOn(g, x, y, r) {
    g.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 7, rr = i % 2 ? r * 0.45 : r;
      if (i) g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.fill();
  }
  // The Union Flag in a rectangle (whole, or in an ensign's corner).
  function unionAt(g, x0, y0, w, h) {
    const u = h / 30;
    g.save();
    g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    g.fillStyle = '#012169';
    g.fillRect(x0, y0, w, h);
    const cx = x0 + w / 2, cy = y0 + h / 2;
    g.lineCap = 'butt';
    g.strokeStyle = '#ffffff';
    g.lineWidth = 6 * u;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w, y0 + h); g.moveTo(x0 + w, y0); g.lineTo(x0, y0 + h); g.stroke();
    // St Patrick's: each arm offset to one side of the white (anticlockwise), so it turns like a pinwheel.
    g.strokeStyle = '#c8102e';
    g.lineWidth = 2 * u;
    g.beginPath();
    for (const [ex, ey] of [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]]) {
      const len = Math.hypot(ex - cx, ey - cy), dx = (ex - cx) / len, dy = (ey - cy) / len, nx = dy * u, ny = -dx * u;
      g.moveTo(cx + nx, cy + ny); g.lineTo(ex + nx, ey + ny);
    }
    g.stroke();
    g.fillStyle = '#ffffff';
    g.fillRect(x0, cy - 5 * u, w, 10 * u);
    g.fillRect(cx - 5 * u, y0, 10 * u, h);
    g.fillStyle = '#c8102e';
    g.fillRect(x0, cy - 3 * u, w, 6 * u);
    g.fillRect(cx - 3 * u, y0, 6 * u, h);
    g.restore();
  }
  // Drawn in vertical strips that ripple from the pole outward, so it flies.
  const FLAG_STRIPS = 8;
  function drawFlag(x, top, now, phase, kind = 'union') {
    const sp = flagSprite(kind), half = SPRITE * CELL / 2, dev = sp.width / (SPRITE * CELL);
    const w = CELL * UNION_W, h = CELL * UNION_H, sw = w / FLAG_STRIPS;
    for (let i = 0; i < FLAG_STRIPS; i++) {
      const out = (i + 0.5) / FLAG_STRIPS;
      const dy = reduced ? 0 : Math.sin(now / 180 - i * 0.9 + phase) * CELL * 0.05 * out;
      // (each strip a hair wider than its slot, so no seams show between them)
      ctx.drawImage(sp, (half + i * sw) * dev, (half - h / 2) * dev, (sw + 0.6) * dev, h * dev, x + i * sw, top + dy, sw + 0.6, h);
    }
  }

  // Colonist's colonies: a flag flying over each (the Union Flag over the
  // first, an ensign over later ones), on its pole with a parchment knob.
  // A colony whose flag cell the woodpecker pecks out is lost (Colonist
  // forgets it at once): its flag tips over and drops into the pit,
  // shrinking and going dark as it goes, and its land shrinks away into
  // the pit after it (see pitRing). With reduced motion the flag fades
  // where it stood. (Each kept while the colony's still remembered, so it
  // falls once.)
  function drawColonyFlags(r, now) {
    for (let i = r.fallen.length - 1; i >= 0; i--) if (now - r.fallen[i].at > 5000) r.fallen.splice(i, 1);
    for (const c of r.owner.memory.colonies) {
      const key = c.y * GRID + c.x, n = c.n || 1, kind = n === 1 ? 'union' : n % 2 ? 'red' : 'blue';
      if (holeMask[key]) { fellIn(r, c, kind, now); continue; }
      if (!r.shown[key]) continue;
      const x = c.x * CELL + CELL / 2, y = c.y * CELL + CELL / 2;
      flagPole(x, y);
      drawFlag(x + 1.5, y - CELL * 0.92, now, c.x * 0.7 + c.y * 1.3, kind);
    }
  }
  const FALL_MS = 760, FALL_STILL_MS = 400;
  const fallenFlags = []; // { owner, x, y, kind, beat, at }
  function fellIn(r, c, kind, now) {
    for (const f of fallenFlags) if (f.owner === r.owner && f.x === c.x && f.y === c.y) return;
    fallenFlags.push({ owner: r.owner, x: c.x, y: c.y, kind, beat: c.x * 0.7 + c.y * 1.3, at: now });
    r.fallen.push({ x: c.x, y: c.y, radius: c.radius, at: now });
  }
  function drawFallenFlags(now) {
    for (let i = fallenFlags.length - 1; i >= 0; i--) {
      const f = fallenFlags[i], u = (now - f.at) / (reduced ? FALL_STILL_MS : FALL_MS);
      if (u >= 1) { // (gone: forgotten once Colonist has forgotten the colony)
        let kept = false;
        for (const c of f.owner.memory.colonies || NO_SITES) if (c.x === f.x && c.y === f.y) kept = true;
        if (!kept) fallenFlags.splice(i, 1);
        continue;
      }
      const x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2, foot = y + CELL * 0.6;
      ctx.save();
      if (reduced) ctx.globalAlpha = 1 - u;
      else { // (tipping over the way it flies, then dropping in: smaller and fading into the dark)
        const tip = Math.min(1, u / 0.45), drop = Math.max(0, (u - 0.35) / 0.65), s = 1 - 0.65 * drop;
        ctx.globalAlpha = 1 - drop * drop;
        ctx.translate(x, foot + drop * CELL * 0.3);
        ctx.rotate(tip * tip * 1.3);
        ctx.scale(s, s);
        ctx.translate(-x, -foot);
      }
      flagPole(x, y);
      drawFlag(x + 1.5, y - CELL * 0.92, now, f.beat, f.kind);
      ctx.restore();
    }
  }
  const NO_SITES = [];

  // Under the snakes, once their shadows are down (see drawSnakes): whatever
  // of a rival lies on someone's land has that land's colour clinging round
  // it, as if it were wading through it: a line of the colour hugging it,
  // just outside everything drawn round it (an outline, a gold line), and a
  // soft glow of it beyond. Only the pieces on the land's own cells (no
  // clip: the cut is cell-exact). The glow (the shape grown FIELD_GLOW_GROW,
  // smoothed: see bodyFillsOn) goes into the veil, a snake at a time and
  // only round what of it is on land, and is laid on at FIELD_GLOW; the
  // line (FIELD_LINE wide, opaque) goes straight on the board. The snake
  // drawn over them covers their inside, so its body keeps its own colours
  // (on land two owners claim, the later colour wins). Outside the line,
  // the border's own parchment keyline, so it shows round a body of the
  // land's own hue (rose round Sniper's red) and to colour-blind eyes (the
  // bark beyond it is its ink: an ink ring as well cost a third pass).
  // Each pass is separate fills, not one path: one path of the pieces (or
  // of only the circles), or the line stroked round its fill, cost more.
  // Where a head just crossed in: a ripple at it (over the snakes: see
  // drawRipples), and the border lights up from there.
  const FIELD_GLOW = 0.16, FIELD_GLOW_GROW = 8, FIELD_LINE = 2.6, huedOn = [];
  let huesOn = true; // (off only for tools/bench.js, timing them: see hues below)
  function drawFieldHues(now) {
    for (const s of game.snakes) {
      if (!s.alive) continue;
      const a = anim.get(s);
      if (!a || !a.n) continue;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      huedOn.length = 0;
      for (const r of fieldSpecs) {
        if (!r.any || r.gone || s === r.owner) continue;
        const h = s.body[0], inside = r.shown[h.y * GRID + h.x] === 1;
        let was = inField.get(s);
        if (!was) inField.set(s, was = new Set());
        if (inside && !was.has(r.owner) && !reduced) { // (just crossed in)
          ripples.push({ x: a.pts[0], y: a.pts[1], color: r.color, at: now });
          r.pulses.push({ x: a.pts[0], y: a.pts[1], at: now });
        }
        if (inside) was.add(r.owner); else was.delete(r.owner);
        let touches = false;
        for (let i = 0; i < a.n; i++) {
          const px = a.pts[2 * i], py = a.pts[2 * i + 1];
          if (!onShown(r, px, py)) continue;
          touches = true;
          if (px < x0) x0 = px;
          if (px > x1) x1 = px;
          if (py < y0) y0 = py;
          if (py > y1) y1 = py;
        }
        if (touches) huedOn.push(r);
      }
      if (!huedOn.length) continue;
      const edge = edgeOf(s, a), m = CELL + 12; // (round the pieces: a band and a glow's width more)
      veilOn(0, 0, x0 - m, y0 - m, x1 + m, y1 + m);
      for (const r of huedOn) { ctx.fillStyle = r.color; bodyFillsOn(a, edge + FIELD_GLOW_GROW, r, true); }
      veilOff(FIELD_GLOW);
      ctx.fillStyle = KEYLINE_SOLID; // (opaque: the pieces overlap)
      for (const r of huedOn) bodyFillsOn(a, edge + FIELD_LINE + BORDER_KEY, r);
      for (const r of huedOn) { ctx.fillStyle = r.color; bodyFillsOn(a, edge + FIELD_LINE, r); }
    }
  }
  // Is the drawn point (px, py) on a cell of r's land?
  function onShown(r, px, py) {
    const x = Math.floor(px / CELL), y = Math.floor(py / CELL);
    return x >= 0 && y >= 0 && x < GRID && y < GRID && r.shown[y * GRID + x] === 1;
  }
  // bodyFills (see the snakes' drawing), only the pieces on r's land: a
  // band where either of its ends is, a segment where it is. Soft (the
  // glow): a smooth sausage instead of the caterpillar's bumps and waists,
  // its bands as wide as its segments, so a segment's round is needed only
  // at the ends and where the body turns. (A circle is the dear part of a
  // pass: *measured*, one 40 units across costs about five times a square
  // 40 units a side, and the glow's, grown furthest, are the biggest. Soft,
  // the land's colour round a rival costs 0.1 to 0.3 ms a frame less, most
  // of what its keyline costs: see tools/bench.js --land.)
  function bodyFillsOn(a, grow, r, soft) {
    const p = a.pts, c = a.cor, rad = a.rad, n = a.n, pinch = soft ? 1 : PINCH;
    for (let i = n - 2; i >= 0; i--) {
      if (!onShown(r, p[2 * i], p[2 * i + 1]) && !onShown(r, p[2 * i + 2], p[2 * i + 3])) continue;
      const h = rad[i + 1] * pinch + grow, x1 = p[2 * i], y1 = p[2 * i + 1], qx = c[2 * i], qy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
      if ((near(x1, qx) && near(qx, x2)) || (near(y1, qy) && near(qy, y2))) rectPiece(x1, y1, x2, y2, h);
      else { rectPiece(x1, y1, qx, qy, h); rectPiece(qx, qy, x2, y2, h); }
    }
    for (let i = n - 1; i >= 0; i--) {
      if (!onShown(r, p[2 * i], p[2 * i + 1])) continue;
      if (i < n - 1 && bends(a, i)) circle(c[2 * i], c[2 * i + 1], rad[i + 1] * pinch + grow);
      if (i === 0 && a.star) { ctx.beginPath(); starPath(a, grow); ctx.fill(); }
      else if (!soft || !straightAt(a, i)) circle(p[2 * i], p[2 * i + 1], rad[i] + grow);
    }
  }
  // Does the body run straight through segment i's centre, along the grid
  // (not at either end)? In from the corner behind it (or the segment before,
  // if that corner's where it is), out to the corner ahead (or the next).
  function straightAt(a, i) {
    if (i === 0 || i >= a.n - 1) return false;
    const p = a.pts, c = a.cor, x = p[2 * i], y = p[2 * i + 1];
    let ax = c[2 * i - 2], ay = c[2 * i - 1], bx = c[2 * i], by = c[2 * i + 1];
    if (near(ax, x) && near(ay, y)) { ax = p[2 * i - 2]; ay = p[2 * i - 1]; }
    if (near(bx, x) && near(by, y)) { bx = p[2 * i + 2]; by = p[2 * i + 3]; }
    return (near(ax, x) && near(x, bx)) || (near(ay, y) && near(y, by));
  }
  // Over the snakes: a ripple where a head just crossed onto someone's land.
  function drawRipples(now) {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i], t = (now - rp.at) / 520;
      if (t >= 1 || t < 0) { ripples.splice(i, 1); continue; }
      ctx.lineWidth = 3 * (1 - t);
      ctx.strokeStyle = rgba(rp.color, 0.8 * (1 - t));
      ctx.beginPath(); ctx.arc(rp.x, rp.y, CELL * (0.4 + 1.3 * t), 0, TAU); ctx.stroke();
    }
  }

  // ------------------------------------------------------------ the food

  // When each piece of food first showed, so it pops in once, and when its
  // next spore or glint is due. Kept by cell rather than by object (a guest
  // online gets fresh food objects every tick). At the start of a round the
  // food pops in one piece after another; a dead snake's beads pop in head to
  // tail. born: cell -> { kind, at, i, next, v (a bead's look) }.
  const born = new Map();
  const eatenNow = new Set(); // cells eaten on the last tick (so food that just vanished poofs)
  let bornTick = -1, bornGen = 0, fresh = true;
  const POP_MS = 420, RIPPLE_MS = 30;

  function trackFood(now) {
    if (game.tick === bornTick) return;
    bornTick = game.tick;
    bornGen++;
    let n = 0;
    for (const f of game.food) {
      if (f.kind === 'beetle') continue;
      const key = f.y * GRID + f.x;
      let b = born.get(key);
      if (!b || b.kind !== f.kind) {
        b = { kind: f.kind, at: now + (fresh ? 200 + 90 * n : 0), i: 0, next: 0, gen: 0, v: (f.color || '#a16207') + '|', fell: !fresh && f.kind === 'food' };
        born.set(key, b);
      }
      b.gen = bornGen;
      n++;
    }
    for (const [key, b] of born) {
      if (b.gen === bornGen) continue;
      // Gone without being eaten (a mushroom withered, a golden apple rotted): a little poof.
      if (!eatenNow.has(key) && (b.kind === 'mushroom' || b.kind === 'golden')) {
        spawn((key % GRID) * CELL + CELL / 2, Math.floor(key / GRID) * CELL + CELL / 2, 7, 110, 420, 2.2, b.kind === 'golden' ? '#a16207' : '#dc2626', '#f6ecd2');
      }
      born.delete(key);
    }
    eatenNow.clear();
    fresh = false;
  }

  // Food moved aside (see onTick): a bead its own snake choked on, spat
  // from (x, y) to (tx, ty) in a little arc (or, with nowhere to go, tossed
  // up where it was); food a coughing head nudged, rolling there; or food
  // the woodpecker's strike knocked out of its patch, flying there in an
  // arc, higher and longer the further it goes. Its look goes with it (a
  // bead keeps its markings), and it's drawn going there (see drawFood); a
  // beetle scurries there (see drawBeetle). With reduced motion it's simply
  // there.
  // A bead its own snake choked on is in its mouth while its cheeks puff (so
  // the face shows the gag: on a phone a bead over it was the whole head),
  // and it's spat out on the "ptoo" (SPIT_WAIT), out of its cheek on the
  // side it lands (its head has gone on by then, and the bead lands beside
  // its neck: from the front of its mouth it flew back over its face),
  // small at first, full size as it clears the head, landing on the tok
  // (SPAT_MS from the choke, as the sound has it).
  const SPAT_MS = 320, ROLL_MS = 280, FLY_CELL_MS = 70, FLY_MAX_MS = 620, SPIT_WAIT = 120, SPIT_SIDE = 0.7, SPIT_AHEAD = 0.25;
  // How far on its way a piece moved aside is (0..1; -1 while it's still in
  // the mouth that spat it), and, as it leaves, where from.
  function movedU(b, now) {
    const t = now - b.movedAt - b.wait;
    if (t < 0) return -1;
    if (b.by) { // (its cheek on that side, as drawn: or, landing straight ahead or behind, the front of its mouth)
      const a = anim.get(b.by);
      if (a && a.n) {
        const hx = a.pts[0], hy = a.pts[1], c = a.hc, s = a.hs, side = Math.sign(Math.round(c * ((b.ty + 0.5) * CELL - hy) - s * ((b.tx + 0.5) * CELL - hx)));
        const ox = side ? SPIT_AHEAD * c - SPIT_SIDE * side * s : SPIT_SIDE * c, oy = side ? SPIT_AHEAD * s + SPIT_SIDE * side * c : SPIT_SIDE * s;
        b.fx = hx / CELL + ox - 0.5; b.fy = hy / CELL + oy - 0.5;
      }
      b.by = null;
    }
    return t / ((b.spat ? b.fly : ROLL_MS) - b.wait);
  }
  // Up in the air: over the snakes (a bead's spat over its own head; food
  // flies over whatever's in the way), bigger the higher it is (its shadow's
  // on the ground: see drawFood). A bead is rimmed in ink and parchment in
  // the air, so one in your own colour reads against your body under it.
  function drawTossed(now) {
    if (reduced) return;
    for (let j = 0; j < game.food.length; j++) {
      const f = game.food[j];
      if (f.kind === 'beetle') continue;
      const b = born.get(f.y * GRID + f.x);
      if (!b || !b.spat || !b.movedAt) continue;
      const u = movedU(b, now);
      if (u <= 0 || u >= 1) continue;
      const e = 1 - (1 - u) * (1 - u), up = Math.sin(u * Math.PI), sz = (1 + 0.3 * up) * (b.wait ? Math.min(1, 0.5 + 2 * u) : 1);
      const x = (b.fx + (f.x - b.fx) * e + 0.5) * CELL, y = (b.fy + (f.y - b.fy) * e + 0.5) * CELL - up * b.hop;
      if (f.kind === 'pellet') {
        ctx.fillStyle = 'rgba(28,16,6,0.85)'; circle(x, y, CELL * 0.43 * sz);
        ctx.fillStyle = '#fffbea'; circle(x, y, CELL * 0.37 * sz);
      }
      blitAbout(flyingSprite(f, b), x, y, 0, 0, sz, sz, 0);
    }
  }
  // Food as it's drawn in the air (no glow, haze or fly: they don't come along).
  function flyingSprite(f, b) {
    if (f.kind === 'pellet') return beadSprite(f.cooked ? ROAST : b.v);
    if (f.kind === 'golden') return goldenSprite();
    if (f.kind === 'mushroom') return mushroomSprite();
    if (f.kind === 'leaf') return goldLeafSprite();
    if (f.kind === 'goldcap') return goldcapSprite();
    const left = f.expires != null ? f.expires - game.tick : 999;
    return appleSprite(f.cooked ? 'baked' : left > 50 ? 'fresh' : left > 22 ? 'bruised' : 'rotten');
  }
  // A piece the woodpecker knocks d cells is flung: the further it goes, the
  // longer it's in the air and the higher it flies (ms, and cells high), so
  // a long throw clears the bodies it crosses and reads all the way to its
  // ring. (A spat bead's arc, 320 ms and 0.6 of a cell high whatever the
  // way, made a throw over two bodies a flat zip, and one beside the patch
  // a slow toss.) The game's knock sound lands with it (knockFlight).
  const knockFly = d => Math.min(FLY_MAX_MS, SPAT_MS + FLY_CELL_MS * d), knockHop = d => Math.min(1.5, 0.6 + 0.22 * d);
  function moveFood(x, y, tx, ty, now, spat, knocked = false, by = null) {
    const from = y * GRID + x, to = ty * GRID + tx, f = game.food.find(o => o.x === tx && o.y === ty && o.kind !== 'beetle');
    if (!f) return;
    const b = born.get(from), d = Math.hypot(tx - x, ty - y);
    if (from !== to) born.delete(from);
    born.set(to, { kind: f.kind, at: now - POP_MS, i: 0, next: 0, gen: bornGen, v: b && b.kind === f.kind ? b.v : (f.color || '#a16207') + '|', fell: false, fx: x, fy: y, movedAt: now, spat,
      fly: knocked ? knockFly(d) : SPAT_MS, hop: CELL * (knocked ? knockHop(d) : 0.6), by, wait: by ? SPIT_WAIT : 0, tx, ty }); // (by: the snake that spat it)
  }

  // Through the woodpecker's aim, the food in its mark trembles (see
  // drawFood), and a faint ring marks where each piece will be knocked to at
  // the strike: the engine's own list (knocks: every landing in the strike's
  // order, no two on one cell, never a burrow; the rivals read the same),
  // worked out once a tick; in the aim's last PECK_PROMISE_TICKS moves, the
  // landings the engine has promised (w.landings, kept at the strike while
  // their cells are free; food that comes into the mark later is promised
  // where its ring is then). Nothing for a piece the bird will eat. (The
  // bird drumming beside the patch never hides one: it clings clear of them
  // if it can, and any it still covers are drawn over it too: see
  // drumChoice, drawWoodpecker.)
  const knockLand = []; // (cells, x and y, this tick's)
  let knockFor = -1, knockGame = null;
  function knockCells(w) {
    if (knockFor !== game.tick || knockGame !== game) {
      knockFor = game.tick; knockGame = game; knockLand.length = 0;
      const knocks = window.SnakeEngine?.knocks;
      if (knocks) for (const { to } of knocks(game, w.target, w.landings)) if (to) knockLand.push(to.x, to.y);
    }
    return knockLand;
  }
  function knockRings(w, prog, now, g = ctx) {
    if (!knockCells(w).length) return;
    const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now / 160);
    g.setLineDash(KNOCK_DASH);
    g.lineCap = 'butt';
    for (let pass = 0; pass < 2; pass++) {
      g.globalAlpha = (0.35 + 0.4 * prog) * (pass ? 1 : 0.7);
      g.strokeStyle = pass ? '#fef3c7' : '#140a04';
      g.lineWidth = pass ? 1.6 : 3.4;
      g.beginPath();
      for (let i = 0; i < knockLand.length; i += 2) {
        const x = (knockLand[i] + 0.5) * CELL, y = (knockLand[i + 1] + 0.5) * CELL, r = CELL * (0.36 + 0.04 * pulse);
        g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
      }
      g.stroke();
    }
    g.setLineDash(NO_DASH);
    g.globalAlpha = 1;
  }
  const KNOCK_DASH = [5, 4];

  // A dead snake's beads: what each one looks like, and a ripple from head to
  // tail. A corpse leaves a bead on every other segment (see the engine's
  // leavesBead), so the markings go by the bead's place among the beads it
  // left, not by its segment: Joker's beads still alternate purple and amber,
  // Wildcard's still run collar, stars and stripes, Star's round the rainbow. (The ripple keeps the
  // segment's time, so it still runs down the body.)
  const remainsAt = new Set();
  function noteRemains(s, now) {
    remainsAt.clear();
    for (const f of game.food) if (f.kind === 'pellet' && (f.owner == null || f.owner === s.id)) remainsAt.add(f.y * GRID + f.x);
    for (let i = 0, n = -1; i < s.body.length; i++) {
      const key = s.body[i].y * GRID + s.body[i].x, old = born.get(key);
      if (!remainsAt.has(key)) continue; // (no bead left there)
      n++;
      if (old && old.kind !== 'pellet') continue; // (food there stays food)
      born.set(key, { kind: 'pellet', at: now + i * RIPPLE_MS, i, next: 0, gen: bornGen, v: beadOf(s, n) });
    }
  }

  // A bead that went (from its rot event): its own fill, as drawn.
  function beadFill(e) {
    const v = born.get(e.y * GRID + e.x)?.v, fill = v ? v.slice(0, v.indexOf('|')) : e.color;
    return fill && fill[0] === '#' ? fill : '#a16207';
  }

  // The bead a snake leaves at body segment i: its own colours and markings.
  function beadOf(s, i) {
    const look = lookOf(s), col = colorOf(s), bow = bowOf(s);
    let fill = col[0] === '#' ? col : '#a16207', mark = '';
    if (s.personaKey === 'wildcard') fill = WILD(i);
    else if (look === 'mute') fill = i === 0 ? '#f8fafc' : fill; // (its mood's colour as it went)
    else if (look === 'joker') fill = i === 0 ? '#f8fafc' : i % 2 ? '#f59e0b' : '#a21caf';
    else if (bow) fill = bow(TWINKLE_HUES[i % TWINKLE_HUES.length])[0]; // (its rainbow, in order: red, orange, yellow, green, blue, violet, and round again; Copycat's copy of it, pale)
    else if (look === 'sniper' && i % 3 === 2) fill = mix(fill, '#fca5a5', 0.35);
    else if (look === 'vulture' && i < 2) fill = i ? '#f5f5f4' : '#f9a8d4';
    else if (look === 'desperado' && i === 1) fill = '#dc2626';
    else if (look === 'desperado' && i >= 4 && i % 4 === 0) fill = '#ecdfc3'; // (its poncho's cream stripes)
    if (!s.persona) mark = MARKS[col] || '';
    else if (look === 'mason') mark = i % 4 === 3 ? 'marble2' : 'marble';
    else if (look === 'colonist') mark = i % 2 ? 'strap' : 'strap2';
    else if (look === 'ouroboros') mark = 'diamond';
    else if (s.personaKey === 'copycat') mark = 'copy';
    else if (look === 'ghost') mark = 'ghost';
    return fill + '|' + mark;
  }

  // How big something popping in is, ms after it appeared: nothing yet, then
  // up past full size and back (with reduced motion, simply there).
  function popOf(ms) {
    if (reduced) return 1;
    const t = ms / POP_MS;
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const u = t - 1;
    return 1 + 2.7 * u * u * u + 1.7 * u * u;
  }

  // A sprite drawn at (x, y) + offset, scaled about a pivot (px, py) relative to (x, y).
  function blitAbout(sp, x, y, px, py, sx, sy, rot) {
    const half = SPRITE * CELL / 2;
    if (!rot) { // (not turned: one scaled blit, no transform to set and undo)
      ctx.drawImage(sp, x + px - sx * (half + px), y + py - sy * (half + py), SPRITE * CELL * sx, SPRITE * CELL * sy);
      return;
    }
    ctx.save();
    ctx.translate(x + px, y + py);
    if (rot) ctx.rotate(rot);
    ctx.scale(sx, sy);
    ctx.drawImage(sp, -half - px, -half - py, SPRITE * CELL, SPRITE * CELL);
    ctx.restore();
  }

  // An apple (or the golden one): it bobs up off its shadow and squashes a
  // touch as it comes down, swaying its leaf; now and then a glint winks on it.
  // t: seconds, offset per apple so they don't move together.
  function drawAppleAt(sp, x, y, t, pop, alpha) {
    const lively = !reduced;
    const h = lively ? 0.5 - 0.5 * Math.cos(t * 3.9) : 0; // 0 down .. 1 up
    const sq = lively ? 0.08 * (1 - h) * (1 - h) * (1 - h) : 0;
    const lift = h * 3.2;
    ctx.globalAlpha = alpha * (1 - 0.35 * h);
    shadowAt(x + 1.3, y + CELL * 0.36, pop * (1 - 0.22 * h));
    ctx.globalAlpha = alpha;
    blitAbout(sp, x, y - lift, 0, CELL * 0.38, pop * (1 + sq), pop * (1 - sq), lively ? Math.sin(t * 1.9) * 0.06 : 0);
    const g = (t * 0.27) % 1;
    if (lively && g < 0.09 && pop >= 1) {
      const w = SPRITE * CELL * 0.75 * Math.sin(g / 0.09 * Math.PI);
      ctx.drawImage(starSprite(), x - CELL * 0.13 - w / 2, y - CELL * 0.08 - lift - w / 2, w, w);
    }
    ctx.globalAlpha = 1;
  }

  // A mushroom sways on its stem and breathes; near the end it wilts, leaning
  // over, shrinking and fading; and it lets go of a spore now and then.
  // A mushroom: poisonous-looking, a faint violet haze round it that breathes.
  const hazeSprite = () => sprite('haze', '', drawHaze);
  const drawHaze = g => {
    const grad = g.createRadialGradient(0, 0, CELL * 0.1, 0, 0, CELL * 0.75);
    grad.addColorStop(0, 'rgba(192,132,252,0.5)');
    grad.addColorStop(0.6, 'rgba(167,139,250,0.14)');
    grad.addColorStop(1, 'rgba(132,204,22,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(0, 0, CELL * 0.75, 0, TAU); g.fill();
  };
  function drawMushroomAt(f, x, y, t, pop) {
    const lively = !reduced;
    const hz = SPRITE * CELL * pop * (1 + (lively ? 0.12 * Math.sin(t * 2.3) : 0));
    ctx.globalAlpha = lively ? 0.75 + 0.25 * Math.sin(t * 2.3) : 0.85;
    ctx.drawImage(hazeSprite(), x - hz / 2, y - hz / 2 - CELL * 0.05, hz, hz);
    ctx.globalAlpha = 1;
    const left = f.expires != null ? f.expires - game.tick : 99;
    const wilt = left < 30 ? Math.min(1, 1 - left / 30) : 0;
    const breathe = lively ? Math.sin(t * 5.1) * 0.04 : 0;
    const lean = (lively ? Math.sin(t * 2.5) * 0.12 : 0) + 0.5 * wilt * (f.x % 2 ? 1 : -1);
    ctx.globalAlpha = 1 - 0.4 * wilt;
    shadowAt(x + 1, y + CELL * 0.36, pop * (1 - 0.25 * wilt));
    blitAbout(mushroomSprite(), x, y, 0, CELL * 0.34, pop * (1 - 0.2 * wilt) * (1 - breathe * 0.5), pop * (1 - 0.3 * wilt) * (1 + breathe), lean);
    if (lively && pop >= 1) { // stink lines: two wavy violet wisps rising off it (the cartoon for "don't eat me")
      ctx.strokeStyle = '#c4b5fd';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (let k = 0; k < 2; k++) {
        const ph = (t * 0.55 + k * 0.5) % 1, x0 = x + (k ? 0.16 : -0.14) * CELL, y0 = y - CELL * (0.4 + 0.55 * ph);
        ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.85 * (1 - 0.4 * wilt);
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const yy = y0 - i * CELL * 0.04, xx = x0 + Math.sin(i * 0.9 + t * 4 + k * 2) * CELL * 0.06;
          if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Ambient motes from a small pool: poison spores drifting up off the mushrooms
  // (kind 0, violet), glints twinkling round a golden apple (1), smoke (2), embers (3),
  // steam off baked food (4), dust kicked up by a jump (5) and Star's twinkles (6 on).
  const MAX_M = 96;
  const mx = new Float32Array(MAX_M), my = new Float32Array(MAX_M), mvx = new Float32Array(MAX_M), mvy = new Float32Array(MAX_M);
  const mlife = new Float32Array(MAX_M), mmax = new Float32Array(MAX_M), msize = new Float32Array(MAX_M);
  const mkind = new Uint8Array(MAX_M);
  let mNext = 0, mLive = 0;
  function mote(x, y, vx, vy, life, size, kind) {
    if (reduced) return;
    const i = mNext;
    mNext = (mNext + 1) % MAX_M;
    mx[i] = x; my[i] = y; mvx[i] = vx; mvy[i] = vy; mmax[i] = mlife[i] = life; msize[i] = size; mkind[i] = kind;
    mLive = Math.min(MAX_M, mLive + 1);
  }
  // Drawn in batches: every mote of a kind at the same fade (four steps of
  // it) goes in one shape, so a busy fire is a handful of fills, not hundreds.
  const MOTE_LOOK = [['#d8b4fe', 0.7], null, ['#78716c', 0.32], ['#fdba74', 1], ['#f8fafc', 0.4], ['#d6b480', 0.6]]; // spores, (glints), smoke, embers, steam, dust
  const DUST = 5;
  // Dust kicked up off the bark: puffs kicked back (against dx, dy) where a
  // jump takes off, and a ring of them where it comes down. (Motes: none
  // with reduced motion.)
  function dustPuffs(x, y, dx, dy) {
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1, sp = 8 + Math.random() * 12, out = 26 + Math.random() * 18; // (out to either side, a little back)
      mote(x + side * dy * CELL * 0.3, y - side * dx * CELL * 0.3, -dx * sp + dy * side * out, -dy * sp - dx * side * out, 420 + Math.random() * 200, 2.6 + Math.random() * 1.4, DUST);
    }
  }
  function dustRing(x, y) {
    for (let i = 0; i < 10; i++) {
      const ang = (i + Math.random() * 0.4) * TAU / 10, sp = 36 + Math.random() * 16;
      mote(x + Math.cos(ang) * CELL * 0.32, y + Math.sin(ang) * CELL * 0.32, Math.cos(ang) * sp, Math.sin(ang) * sp, 400 + Math.random() * 140, 2.4 + Math.random() * 1.2, DUST);
    }
  }
  const mBucket = new Uint8Array(MAX_M), mRad = new Float32Array(MAX_M);
  function drawMotes(dt) {
    if (!mLive) return;
    const st = dt / 1000;
    let live = 0;
    for (let i = 0; i < MAX_M; i++) {
      mBucket[i] = 0;
      if (mlife[i] <= 0) continue;
      mlife[i] -= dt;
      if (mlife[i] <= 0) continue;
      mx[i] += mvx[i] * st;
      my[i] += mvy[i] * st;
      const t = Math.min(1, Math.max(0, mlife[i] / mmax[i])), fade = Math.sin(t * Math.PI); // in and out
      live++;
      if (mkind[i] === 1 || mkind[i] >= TWINKLE) { // a glint: the sparkle sprite, twinkling (only ever a few); or one of Star's, in a colour of its rainbow
        const w = SPRITE * CELL * msize[i] * fade;
        ctx.globalAlpha = fade;
        ctx.drawImage(mkind[i] === 1 ? starSprite() : twinkleSprite(mkind[i] - TWINKLE), mx[i] - w / 2, my[i] - w / 2, w, w);
        continue;
      }
      if (mkind[i] === 0) mx[i] += Math.sin(mlife[i] / 160) * 0.15; // spores waft
      mRad[i] = mkind[i] === 2 || mkind[i] >= 4 ? msize[i] * (1.6 - t * 0.6) : msize[i]; // (smoke, steam and dust grow as they go)
      mBucket[i] = 1 + Math.min(3, Math.floor(fade * 4)); // 1..4
    }
    for (let kind = 0; kind < MOTE_LOOK.length; kind++) {
      const look = MOTE_LOOK[kind];
      if (!look) continue;
      ctx.fillStyle = look[0];
      for (let b = 1; b <= 4; b++) {
        let any = false;
        for (let i = 0; i < MAX_M; i++) {
          if (mBucket[i] !== b || mkind[i] !== kind) continue;
          if (!any) { ctx.beginPath(); any = true; }
          ctx.moveTo(mx[i] + mRad[i], my[i]);
          ctx.arc(mx[i], my[i], mRad[i], 0, TAU);
        }
        if (!any) continue;
        ctx.globalAlpha = look[1] * (b - 0.5) / 4;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    mLive = live;
  }

  // A beetle diving into its burrow: it shrinks away into the hole. One that
  // dug itself in sinks the rest of the way, its collar of sawdust closing
  // over it (then its bore is a burrow, freshly bored: see drawFresh).
  const dives = []; // { x, y, at, ang, gold, dug (it dug in: how far it had sunk) }
  function drawDive(now) {
    for (let i = dives.length - 1; i >= 0; i--) {
      const d = dives[i], age = (now - d.at) / (d.dug ? 220 : 320);
      if (age >= 1 || age < 0 || reduced) { dives.splice(i, 1); continue; }
      const c = CELL, x = d.x * c + c / 2, y = d.y * c + c / 2;
      if (d.dug) {
        const dig = d.dug + (1 - d.dug) * age;
        ctx.fillStyle = 'rgba(20,10,4,0.8)';
        ctx.beginPath(); ctx.ellipse(x, y, c * 0.38 * (1 - age), c * 0.31 * (1 - age), 0, 0, TAU); ctx.fill();
        digCollar(x, y, dig, d.x * 7 + d.y * 13);
        continue;
      }
      const s = 1.35 * (1 - age);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(d.ang + age * 2);
      ctx.scale(s, s);
      ctx.fillStyle = d.gold ? honeyShell() : '#059669';
      ctx.strokeStyle = d.gold ? '#047857' : '#fbbf24';
      ctx.lineWidth = c * 0.03;
      ctx.beginPath(); ctx.ellipse(-c * 0.02, 0, c * 0.22, c * 0.17, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // A roast: a piece of snake that fell off in the flames, browned all over.
  const ROAST = '#92400e|';
  // A bead going off, laid over it as it does: a dull brown film and brown
  // spots, for any bead's colours; on a dark bead (Vulture's black,
  // Wildcard's navy), where brown spots don't show, a pale mould instead:
  // a grey film and grey-beige spots. From BEAD_OFF ticks before it rots it
  // comes over it; in its last BEAD_GOING it shrinks and dims.
  const BEAD_OFF = 45, BEAD_GOING = 15, BEAD_DARK = 0.26; // (a bead this dark or darker goes off pale)
  const beadRotSprite = pale => sprite('beadrot', pale ? 'pale' : '', drawBeadRot);
  const drawBeadRot = (g, variant) => {
    const c = CELL, r = c * 0.26, pale = variant === 'pale';
    g.fillStyle = pale ? 'rgba(150,142,120,0.45)' : 'rgba(82,60,34,0.6)';
    g.beginPath(); g.arc(0, 0, r + c * 0.035, 0, TAU); g.fill();
    g.fillStyle = pale ? 'rgba(214,204,164,0.65)' : 'rgba(52,30,10,0.65)';
    for (const [x, y, rr] of [[0.1, 0.07, 0.065], [-0.1, 0.11, 0.045], [0.11, -0.09, 0.04], [-0.06, -0.02, 0.03]]) { g.beginPath(); g.arc(c * x, c * y, c * rr, 0, TAU); g.fill(); }
    g.strokeStyle = pale ? 'rgba(214,204,164,0.55)' : 'rgba(52,30,10,0.55)'; // (a wrinkle)
    g.lineWidth = c * 0.025;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(-r * 0.6, -r * 0.35); g.quadraticCurveTo(-r * 0.1, -r * 0.05, -r * 0.35, r * 0.45); g.stroke();
  };
  // Baked food steams now and then.
  function steam(b, x, y, now) {
    if (reduced || !b || now < b.next) return;
    b.next = now + 450 + Math.random() * 500;
    mote(x + (Math.random() - 0.5) * CELL * 0.3, y - CELL * 0.3, (Math.random() - 0.5) * 6, -16 - Math.random() * 8, 1200, 2 + Math.random(), 4);
  }

  // Every piece of food on the board, under the snakes. Food in the
  // woodpecker's mark trembles through the aim, by CSS px, not the board's
  // units, so it shows on a phone too (in units it was under a pixel there):
  // 1 px each way as the aim starts, 2.5 by the strike.
  const TREMBLE_PX = 1, TREMBLE_MORE = 1.5;
  function drawFood(alpha, now) {
    trackFood(now);
    trackBugs(now);
    const lively = !reduced, prog = lively ? aimed(alpha) : -1; // (through the woodpecker's aim: what's in its mark trembles)
    const perPx = boardRect.w > 0 ? SIZE / boardRect.w : 1; // (the board's units a CSS px: the tremble is as big on any screen)
    for (const f of game.food) {
      if (f.kind === 'beetle') { drawBeetle(f, alpha, now); continue; }
      const key = f.y * GRID + f.x, b = born.get(key);
      if (f.kind === 'pellet' && heldCells[key]) { if (b) b.at = now + b.i * RIPPLE_MS; continue; } // (under a held corpse: not yet)
      const pop = b ? popOf(now - b.at) : 1;
      if (pop <= 0) continue;
      let x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2;
      if (b && b.movedAt) { // (spat, knocked or nudged aside: on its way from where it was, see moveFood)
        const u = reduced ? 1 : movedU(b, now);
        if (u < 0) continue; // (still in the mouth that spat it)
        if (u >= 1) b.movedAt = 0;
        else {
          const e = 1 - (1 - u) * (1 - u);
          x = (b.fx + (f.x - b.fx) * e + 0.5) * CELL; y = (b.fy + (f.y - b.fy) * e + 0.5) * CELL;
          if (b.spat) { shadowAt(x + 1, y + CELL * 0.32, pop * 0.85 * (1 - 0.35 * Math.sin(u * Math.PI))); continue; } // (up in the air: its shadow on the ground, and it over the snakes, see drawTossed)
          y -= Math.abs(Math.sin(u * Math.PI * 2)) * (1 - u) * CELL * 0.14; // (rolling, it bounces along the bark, shadow and all)
        }
      }
      if (prog >= 0 && patch[key]) { const a = (TREMBLE_PX + TREMBLE_MORE * prog) * perPx; x += Math.sin(now / 19 + key) * a; y += Math.cos(now / 26 + key * 1.7) * a * 0.7; }
      const t = now / 1000 + ((f.x * 7 + f.y * 13) % 10) * 0.63; // each piece on its own beat
      if (f.kind === 'food') {
        const drop = b?.fell && !reduced ? Math.max(0, 1 - (now - b.at) / 380) : 0; // (a new apple drops from the tree above)
        const left = f.expires != null ? f.expires - game.tick : 999;
        const look = f.cooked ? 'baked' : left > 50 ? 'fresh' : left > 22 ? 'bruised' : 'rotten';
        const shrivel = look === 'rotten' && left < 10 ? 0.78 + 0.22 * Math.max(0, left) / 10 : 1;
        drawAppleAt(appleSprite(look), x, y - drop * drop * CELL * 3, t, (b?.fell ? 1 : pop) * shrivel, 1);
        if (look === 'rotten' && lively) { // a fly has found it
          const fa = now / 150 + f.x * 1.7, fx = x + Math.cos(fa) * CELL * 0.4, fy = y - CELL * 0.32 + Math.sin(fa * 1.6) * CELL * 0.14;
          ctx.fillStyle = 'rgba(241,245,249,0.7)';
          const flap = 0.6 + 0.6 * Math.abs(Math.sin(now / 18));
          ctx.beginPath(); ctx.ellipse(fx - 1.4, fy - 1.6, 1.6 * flap, 1, -0.5, 0, TAU); ctx.ellipse(fx + 1.4, fy - 1.6, 1.6 * flap, 1, 0.5, 0, TAU); ctx.fill();
          ctx.fillStyle = '#1c1917';
          circle(fx, fy, 1.7);
        }
        if (look === 'baked') steam(b, x, y, now);
      }
      else if (f.kind === 'pellet') {
        // A bead goes off as its time runs out, as an apple does: a dull film
        // and brown spots come over it and it all but stops bobbing; then it
        // shrinks and dims, and goes in a puff of its own colours (see onTick).
        const left = f.expires != null ? f.expires - (game.tick - 1 + alpha) : 999;
        const off = left < BEAD_OFF ? Math.min(1, (BEAD_OFF - left) / (BEAD_OFF - BEAD_GOING)) : 0, going = Math.max(0, Math.min(1, left / BEAD_GOING));
        const h = lively ? (0.5 - 0.5 * Math.cos(t * 3)) * (1 - 0.7 * off) : 0;
        ctx.globalAlpha = 0.5 + 0.5 * going;
        shadowAt(x + 1, y + CELL * 0.3, pop * 0.85 * (1 - 0.2 * h) * (0.72 + 0.28 * going));
        const sz = pop * (0.72 + 0.28 * going) * (1 + (lively ? Math.sin(t * 6) * 0.03 * (1 - off) : 0));
        blitAbout(beadSprite(f.cooked ? ROAST : b ? b.v : (f.color || '#a16207') + '|'), x, y - h * 1.8, 0, 0, sz, sz, 0);
        if (off > 0) { ctx.globalAlpha = (0.5 + 0.5 * going) * off; blitAbout(beadRotSprite(!f.cooked && lumaOf(beadFill(f)) < BEAD_DARK), x, y - h * 1.8, 0, 0, sz, sz, 0); }
        ctx.globalAlpha = 1;
        if (f.cooked && !off) steam(b, x, y, now);
      } else if (f.kind === 'mushroom') {
        drawMushroomAt(f, x, y, t, pop);
        if (lively && b && pop >= 1 && now > b.next) {
          b.next = now + 250 + Math.random() * 300; // (poison spores, puffing off it)
          mote(x + (Math.random() - 0.5) * CELL * 0.5, y - CELL * 0.12, (Math.random() - 0.5) * 8, -12 - Math.random() * 8, 1700, 1.8 + Math.random() * 1.2, 0);
        }
      } else if (f.kind === 'leaf' || f.kind === 'goldcap') {
        // Golden powers: a glow, a gentle flutter (the leaf) or bob (the mushroom), and glints.
        const left = f.expires != null ? f.expires - game.tick : 999;
        const fade = left > 20 ? 1 : 0.4 + 0.6 * Math.max(0, left) / 20;
        const glow = pop * (1.1 + (lively ? 0.16 * Math.sin(t * 4) : 0)), w = SPRITE * CELL * glow;
        ctx.globalAlpha = fade * (lively ? 0.85 + 0.15 * Math.sin(t * 4) : 1);
        ctx.drawImage(glowSprite(), x - w / 2, y - w / 2, w, w);
        ctx.globalAlpha = 1;
        if (f.kind === 'leaf') {
          const tilt = lively ? Math.sin(t * 2.2) * 0.35 : 0, lift = lively ? Math.sin(t * 3.1) * CELL * 0.06 : 0;
          shadowAt(x + 2, y + CELL * 0.3, pop * 0.7);
          ctx.globalAlpha = fade;
          blitAbout(goldLeafSprite(), x, y - CELL * 0.05 + lift, 0, 0, pop, pop * (lively ? 0.94 + 0.06 * Math.cos(t * 2.2) : 1), tilt * 0.5);
          ctx.globalAlpha = 1;
        } else {
          const bob = lively ? Math.sin(t * 2.5) * CELL * 0.04 : 0;
          shadowAt(x + 1, y + CELL * 0.33, pop * 0.8);
          ctx.globalAlpha = fade;
          blitAbout(goldcapSprite(), x, y + bob, 0, 0, pop, pop, 0);
          ctx.globalAlpha = 1;
        }
        if (lively && b && pop >= 1 && now > b.next) {
          b.next = now + 160 + Math.random() * 220;
          mote(x + (Math.random() - 0.5) * CELL * 1.1, y + (Math.random() - 0.5) * CELL, 0, -6, 650, 0.35 + Math.random() * 0.3, 1);
        }
      } else if (f.kind === 'golden') {
        // A calm dim instead of a blink when it's about to rot.
        const left = f.expires - game.tick;
        const fade = left > T.GOLDEN_DIM_TICKS ? 1 : 0.45 + 0.55 * (left / T.GOLDEN_DIM_TICKS);
        const glow = pop * (1 + (lively ? 0.14 * Math.sin(t * 4) : 0)), w = SPRITE * CELL * glow;
        ctx.globalAlpha = fade * (lively ? 0.8 + 0.2 * Math.sin(t * 4) : 1);
        ctx.drawImage(glowSprite(), x - w / 2, y - w / 2, w, w);
        drawAppleAt(goldenSprite(), x, y, t * 1.1, pop, fade);
        ctx.save();
        ctx.translate(x + CELL * 0.2, y - CELL * 0.22);
        ctx.rotate(reduced ? 0 : now / 900);
        ctx.scale(pop, pop);
        blit(starSprite(), 0, 0, fade);
        ctx.restore();
        if (lively && b && pop >= 1 && now > b.next) {
          b.next = now + 180 + Math.random() * 260;
          mote(x + (Math.random() - 0.5) * CELL * 1.1, y + (Math.random() - 0.5) * CELL, 0, -6, 650, 0.35 + Math.random() * 0.3, 1);
        }
      }
    }
  }

  // ------------------------------------------------------------ burrows

  // A beetle burrow: an oval opening in the bark, splintered round its rim,
  // a little sawdust about it, and cracks that spread from it as the round
  // goes on (the beetles are hollowing the log out). Wood splits along its
  // grain, so the cracks run along the log, either way from the hole,
  // tapering, now and then forking. Each burrow's cracks
  // are its own (seeded by where it is) and grow to full length over about
  // half a minute. It opens with a pop.
  //
  // One a cornered beetle's dig left (dug: 1, round six A) doesn't pop: the
  // beetle's collar closes over it (see drawDive) and it's there, freshly
  // bored, its rim raw pale wood with splinters sticking out of it and its
  // sawdust kicked out round it; over FRESH_MS it settles into an ordinary
  // burrow (see drawFresh). One closing over (a 'heal': at the most, the one
  // unused longest, to make room) fills with sawdust, moss creeps over it,
  // and it fades into the bark over HEAL_MS (see drawHeals); with reduced
  // motion, filled and mossed at once, then fading.
  const CRACK_GROW_TICKS = 260, FRESH_MS = 4000, FRESH_HOLD = 1200, HEAL_MS = 1100;
  const heals = []; // { x, y, at, v (its look), cs (its cracks' sprite, as last drawn) }
  const crackCache = new Map(); // cell -> branches of [x, y] points (cells)
  const burrowSeen = new Map(); // cell -> when it first showed (for its pop)
  function cracksOf(b) {
    const k = b.y * GRID + b.x;
    let br = crackCache.get(k);
    if (br) return br;
    let seed = (k * 7919 + 13) % 2147483647 || 1;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    br = [];
    const split = (x, y, base, len) => {
      const pts = [[x, y]];
      let a = base + (rnd() - 0.5) * 0.4;
      for (let j = 0; j < len; j++) {
        a += (rnd() - 0.5) * 0.5 + (base - a) * 0.4; // (wandering, but kept to the grain)
        const step = 0.35 + rnd() * 0.25;
        x += Math.cos(a) * step; y += Math.sin(a) * step;
        pts.push([x, y]);
      }
      return pts;
    };
    for (const base of [Math.PI / 2, -Math.PI / 2]) { // (up and down the log)
      const main = split(0, 0, base, 5 + Math.floor(rnd() * 4));
      br.push(main);
      if (rnd() < 0.6) { // a fork
        const [fx, fy] = main[2 + Math.floor(rnd() * 2)];
        br.push(split(fx, fy, base + (rnd() < 0.5 ? -0.6 : 0.6), 2 + Math.floor(rnd() * 2)));
      }
    }
    crackCache.set(k, br);
    return br;
  }
  function drawBurrows(now) {
    if (heals.length) drawHeals(now);
    if (!game.burrows?.length) return;
    const c = CELL;
    ctx.lineCap = ctx.lineJoin = 'round'; // (as it always left them)
    for (const b of game.burrows) {
      const key = b.y * GRID + b.x, x = b.x * c + c / 2, y = b.y * c + c / 2;
      if (!burrowSeen.has(key)) burrowSeen.set(key, now);
      const age = now - burrowSeen.get(key), pop = b.dug ? 1 : popOf(age); // (a dug one is there as the collar closes over it)
      const grow = Math.min(1, Math.max(0.15, (game.tick - b.at) / CRACK_GROW_TICKS));
      // The cracks, from their sprite, on whole device pixels.
      const cs = crackSprite(b, key, grow);
      ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
      ctx.drawImage(cs.c, cs.X, cs.Y);
      ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
      // The opening (a cached sprite, one of four).
      const w = SPRITE * CELL * pop;
      ctx.drawImage(burrowSprite(BURROW_LOOKS[key % 4]), x - w / 2, y - w / 2, w, w);
      if (b.dug && age < FRESH_MS) drawFresh(x, y, key, age);
    }
  }
  const BURROW_LOOKS = ['0', '1', '2', '3'];
  // A dug burrow's fresh look, over the ordinary one: full for FRESH_HOLD,
  // then settling away.
  function drawFresh(x, y, key, age) {
    const f = age < FRESH_HOLD ? 1 : 1 - (age - FRESH_HOLD) / (FRESH_MS - FRESH_HOLD), a = f * f * (3 - 2 * f), w = SPRITE * CELL;
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.drawImage(freshSprite(BURROW_LOOKS[key % 4]), x - w / 2, y - w / 2, w, w);
    ctx.globalAlpha = 1;
  }
  // Freshly bored: sawdust kicked out round the hole (a pale bed, lumps lit
  // from the upper left, specks further out), its rim raw pale wood, and
  // splinters of it sticking out, inked so they read on the bark. Never over
  // the hole itself: it's a burrow, open.
  const freshSprite = v => sprite('burrowFresh', v, drawFreshBore);
  const drawFreshBore = (g, v) => {
    const c = CELL, seed = Number(v) * 17 + 3, rot = 0.4, cs = Math.cos(rot), sn = Math.sin(rot);
    const on = (t, rx, ry) => { const ex = Math.cos(t) * rx, ey = Math.sin(t) * ry; return [ex * cs - ey * sn, ex * sn + ey * cs]; }; // (a point on the hole's tilted oval)
    const rnd = i => { const h = Math.sin((seed + i) * 12.9898) * 43758.5453; return h - Math.floor(h); };
    g.fillStyle = 'rgba(236,212,160,0.3)'; // (a bed of it round the hole, not over it)
    g.beginPath(); g.ellipse(0, 0, c * 0.5, c * 0.42, rot, 0, TAU); g.ellipse(0, 0, c * 0.25, c * 0.17, rot, 0, TAU); g.fill('evenodd');
    for (let pass = 0; pass < 3; pass++) { // the lumps: their shadow, the sawdust, its lit tops
      g.fillStyle = pass === 0 ? 'rgba(70,42,18,0.5)' : pass === 1 ? '#d9b77c' : '#f2e2bb';
      const dx = pass === 0 ? 0.9 : pass === 1 ? 0 : -0.6, dy = pass === 0 ? 1.2 : pass === 1 ? 0 : -0.8;
      g.beginPath();
      for (let i = 0; i < 14; i++) {
        if (pass === 2 && rnd(i * 5 + 4) < 0.4) continue;
        const [px, py] = on(i * TAU / 14 + rnd(i * 5) * 0.4, c * (0.34 + 0.1 * rnd(i * 5 + 1)), c * (0.27 + 0.1 * rnd(i * 5 + 1)));
        const r = c * (0.045 + 0.04 * rnd(i * 5 + 2)) * (pass === 2 ? 0.5 : 1);
        g.moveTo(px + dx + r, py + dy); g.arc(px + dx, py + dy, r, 0, TAU);
      }
      g.fill();
    }
    g.fillStyle = '#e6cc96'; // (specks thrown further)
    for (let i = 0; i < 12; i++) { const [px, py] = on(rnd(i * 3 + 80) * TAU, c * (0.5 + 0.14 * rnd(i * 3 + 81)), c * (0.44 + 0.14 * rnd(i * 3 + 81))); g.beginPath(); g.arc(px, py, c * (0.018 + 0.016 * rnd(i * 3 + 82)), 0, TAU); g.fill(); }
    g.strokeStyle = '#f3dfb0'; g.lineWidth = c * 0.06; // the raw rim
    g.beginPath(); g.ellipse(0, 0, c * 0.275, c * 0.195, rot, 0, TAU); g.stroke();
    g.lineJoin = 'round';
    for (let i = 0; i < 6; i++) { // splinters of raw wood, torn out from the rim past the sawdust, each with its grain
      const t = i * TAU / 6 + rnd(i * 7 + 40) * 0.7, len = c * (0.3 + 0.14 * rnd(i * 7 + 41)), half = c * (0.03 + 0.012 * rnd(i * 7 + 42));
      const [bx, by] = on(t, c * 0.28, c * 0.2), [tx, ty] = on(t + (rnd(i * 7 + 43) - 0.5) * 0.4, c * 0.28 + len, c * 0.2 + len * 0.85);
      const nx = -(ty - by), ny = tx - bx, n = Math.hypot(nx, ny) || 1;
      g.beginPath(); g.moveTo(bx + nx / n * half, by + ny / n * half); g.lineTo(tx, ty); g.lineTo(bx - nx / n * half, by - ny / n * half); g.closePath();
      g.fillStyle = '#f6e6c0'; g.fill();
      g.strokeStyle = 'rgba(64,38,16,0.9)'; g.lineWidth = c * 0.024; g.stroke();
      g.strokeStyle = 'rgba(176,125,72,0.8)'; g.lineWidth = c * 0.012; // (its grain)
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + (tx - bx) * 0.7, by + (ty - by) * 0.7); g.stroke();
    }
  };
  // A burrow closing over: its cracks and hole fading, a plug of sawdust
  // filling it from the middle out, then moss creeping over it, all fading
  // into the bark at the end.
  function drawHeals(now) {
    const c = CELL, w = SPRITE * c;
    for (let i = heals.length - 1; i >= 0; i--) {
      const h = heals[i], p = (now - h.at) / HEAL_MS;
      if (p >= 1 || p < 0) { heals.splice(i, 1); continue; }
      const x = h.x * c + c / 2, y = h.y * c + c / 2;
      const f = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45, a = f * f * (3 - 2 * f);
      const fill = reduced ? 1 : Math.min(1, p / 0.4), moss = reduced ? 1 : Math.max(0, Math.min(1, (p - 0.2) / 0.4));
      if (h.cs?.c && h.cs.k === k) { // (its cracks, as last drawn, closing with it)
        ctx.globalAlpha = a * (1 - p);
        ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
        ctx.drawImage(h.cs.c, h.cs.X, h.cs.Y);
        ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
      }
      ctx.globalAlpha = a;
      ctx.drawImage(burrowSprite(h.v), x - w / 2, y - w / 2, w, w);
      const sf = 0.3 + 0.7 * fill * (2 - fill); // (eased out)
      ctx.drawImage(healPlugSprite(), x - w * sf / 2, y - w * sf / 2, w * sf, w * sf);
      if (moss > 0) { const sm = 0.35 + 0.65 * moss * (2 - moss); ctx.globalAlpha = a * Math.min(1, moss * 2); ctx.drawImage(healMossSprite(h.v), x - w * sm / 2, y - w * sm / 2, w * sm, w * sm); }
      ctx.globalAlpha = 1;
    }
  }
  // The plug: sawdust packed into the hole, heaped a little over its rim.
  const healPlugSprite = () => sprite('healPlug', '', drawHealPlug);
  const drawHealPlug = g => {
    const c = CELL;
    g.fillStyle = 'rgba(60,36,14,0.4)'; g.beginPath(); g.ellipse(c * 0.03, c * 0.05, c * 0.3, c * 0.22, 0.4, 0, TAU); g.fill();
    g.fillStyle = '#c9a46a'; g.beginPath(); g.ellipse(0, 0, c * 0.29, c * 0.21, 0.4, 0, TAU); g.fill();
    g.fillStyle = '#e4c890';
    g.beginPath();
    for (const [px, py, r] of [[-0.08, -0.05, 0.1], [0.08, -0.02, 0.09], [0, 0.07, 0.08], [-0.15, 0.06, 0.06], [0.16, 0.08, 0.05]]) { g.moveTo(c * (px + r), c * py); g.arc(c * px, c * py, c * r, 0, TAU); }
    g.fill();
  };
  // Moss over it: a little cushion of the log's own moss (dark olive, never
  // the apples' lime), its tufts run together, a shadow under it, each tuft
  // lit on its upper left, and fuzz.
  const healMossSprite = v => sprite('healMoss', v, drawHealMoss);
  const drawHealMoss = (g, v) => {
    const c = CELL, n = Number(v) + 1, rnd = i => { const h = Math.sin((n * 31 + i) * 12.9898) * 43758.5453; return h - Math.floor(h); };
    const tufts = [[0, 0, 0.11]];
    for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + rnd(i) * 0.6, d = 0.09 + 0.08 * rnd(i + 20); tufts.push([Math.cos(a) * d * 1.15, Math.sin(a) * d * 0.85, 0.06 + 0.035 * rnd(i + 40)]); }
    tufts.sort((p, q) => p[1] - q[1]); // (back to front)
    const clump = (dx, dy, grow) => { g.beginPath(); for (const [x, y, r] of tufts) { g.moveTo(c * (x + dx + r + grow), c * (y + dy)); g.arc(c * (x + dx), c * (y + dy), c * (r + grow), 0, TAU); } };
    g.fillStyle = 'rgba(14,8,2,0.32)'; clump(0.02, 0.035, 0.01); g.fill();
    g.fillStyle = '#3a5520'; clump(0, 0, 0); g.fill();
    for (const [x, y, r] of tufts) {
      const lit = g.createRadialGradient(c * (x - r * 0.35), c * (y - r * 0.4), c * r * 0.1, c * x, c * y, c * r);
      lit.addColorStop(0, 'rgba(128,156,78,0.5)'); lit.addColorStop(0.55, 'rgba(90,120,48,0.12)'); lit.addColorStop(1, 'rgba(18,30,8,0.25)');
      g.fillStyle = lit; g.beginPath(); g.arc(c * x, c * y, c * r, 0, TAU); g.fill();
    }
    for (let i = 0; i < 26; i++) { // fuzz: tiny fronds, light and dark
      const [x, y, r] = tufts[i % tufts.length], a = rnd(i + 60) * TAU, d = r * (0.2 + 0.8 * rnd(i + 90));
      g.fillStyle = i % 2 ? 'rgba(126,154,76,0.5)' : 'rgba(24,40,12,0.45)';
      g.beginPath(); g.arc(c * (x + Math.cos(a) * d), c * (y + Math.sin(a) * d), c * (0.012 + 0.012 * rnd(i + 120)), 0, TAU); g.fill();
    }
  };
  // A burrow's cracks in a sprite of their own, made again only when they've
  // grown (they grow a little each tick for about half a minute, then never):
  // dark, with a lit lip along one side, thinning out.
  const crackSprites = new Map(); // cell -> { grow, k, c (its canvas), X, Y (where it lands, in device px) }
  function crackSprite(b, key, grow) {
    let s = crackSprites.get(key);
    if (s && s.grow === grow && s.k === k) return s;
    if (!s) crackSprites.set(key, s = { grow: -1, k: 0, c: null, X: 0, Y: 0 });
    const branches = cracksOf(b), c = CELL, m = 4; // (m: room for the lines' width and the lip)
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (const pts of branches) for (const [px, py] of pts) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
    const cx = (b.x + 0.5) * c * k, cy = (b.y + 0.5) * c * k;
    const X = Math.floor(cx + (x0 * c - m) * k), Y = Math.floor(cy + (y0 * c - m) * k);
    const w = Math.ceil(cx + (x1 * c + m) * k) - X, h = Math.ceil(cy + (y1 * c + m) * k) - Y;
    if (!s.c || s.c.width !== w || s.c.height !== h) s.c = makeLayer(w, h);
    const g = s.c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.setTransform(k, 0, 0, k, cx - X, cy - Y); // (the hole's centre at the origin)
    g.lineCap = g.lineJoin = 'round';
    for (const [col, off, lw] of CRACK_LINES) {
      g.strokeStyle = col;
      for (const pts of branches) {
        const shown = (pts.length - 1) * grow, thick = pts[0][0] || pts[0][1] ? 0.6 : 1;
        for (let j = 1; j <= Math.ceil(shown); j++) { // (tapering as it goes)
          const t = Math.min(1, shown - (j - 1)), [px, py] = pts[j - 1], [qx, qy] = pts[j];
          g.lineWidth = lw * thick * (1 - 0.75 * (j - 1) / (pts.length - 1));
          g.beginPath();
          g.moveTo(off + px * c, off + py * c);
          g.lineTo(off + (px + (qx - px) * t) * c, off + (py + (qy - py) * t) * c);
          g.stroke();
        }
      }
    }
    s.X = X; s.Y = Y; s.grow = grow; s.k = k;
    return s;
  }
  const CRACK_LINES = [['rgba(196,154,102,0.28)', 1.2, 1.6], ['rgba(14,7,2,0.7)', 0, 2.8]];
  // A burrow's opening: splinters round the rim, the dark hole, sawdust.
  const burrowSprite = v => sprite('burrow', v, drawBurrowHole);
  const drawBurrowHole = (g, v) => {
    const c = CELL, seed = Number(v);
    g.fillStyle = 'rgba(214,180,128,0.55)';
    g.beginPath(); g.ellipse(0, 0, c * 0.3, c * 0.22, 0.4, 0, TAU); g.fill();
    const grad = g.createRadialGradient(0, 0, 1, 0, 0, c * 0.24);
    grad.addColorStop(0, '#050201');
    grad.addColorStop(0.75, '#1c1007');
    grad.addColorStop(1, '#3b2412');
    g.fillStyle = grad;
    g.beginPath(); g.ellipse(0, 0, c * 0.24, c * 0.16, 0.4, 0, TAU); g.fill();
    g.fillStyle = 'rgba(232,206,160,0.75)';
    for (let i = 0; i < 6; i++) {
      const a = i * 1.9 + seed;
      g.beginPath(); g.arc(Math.cos(a) * c * (0.34 + (i % 3) * 0.05), Math.sin(a) * c * (0.3 + (i % 2) * 0.06), 1.1 + (i % 2) * 0.5, 0, TAU); g.fill();
    }
  };

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
  // board where there's room, its other foot beyond the far edge. From an
  // apple in the log's upper half there's no room over it (it was a stub
  // off the top edge), so there it hangs the other way, down over the middle
  // of the log. It draws itself out from the apple, glows a moment, and
  // fades. Both its ends fade, so it never ends in a flat cut (its far foot
  // can be on the board, and its tip is as it grows).
  function drawRainbow(now) {
    if (!rainbow) return;
    const age = now - rainbow.at, life = 9000;
    if (age > life) { rainbow = null; return; }
    const fade = Math.min(1, age / 600, (life - age) / 1600), grow = reduced ? 1 : Math.min(1, age / 1400), c = CELL;
    const x = rainbow.x * c + c / 2, y = rainbow.y * c + c / 2, fromLeft = rainbow.x < GRID / 2, up = y >= SIZE / 2;
    const R = Math.min(SIZE * 0.95, Math.max(SIZE * 0.45, (up ? y : SIZE - y) - SIZE * 0.1));
    // From the apple's foot round over the top (or under the bottom), as far as it has grown.
    const span = Math.PI * grow, end = Math.min(span / 2, 0.32);
    bow.cx = fromLeft ? x + R : x - R; bow.y = y; bow.R = R; bow.fade = fade;
    bow.a0 = fromLeft ? Math.PI : 0; bow.dir = fromLeft === up ? 1 : -1;
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
  const bow = { cx: 0, y: 0, R: 0, fade: 0, a0: 0, dir: 1 };
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
    ctx.arc(bow.cx, bow.y, rad, bow.a0 + bow.dir * from, bow.a0 + bow.dir * to, bow.dir < 0);
    ctx.stroke();
  }

  // ------------------------------------------------------------ the woodpecker

  // A great spotted woodpecker, big (about six cells tall), clinging to the
  // log just outside the board: on whichever side of the board has room on
  // this screen, as near as it can to where it's working. It flies in when
  // sudden death starts, the way a woodpecker flies (a few wingbeats, wings
  // tucked in a dip, beats again), and lands with a flare of its wings.
  // Perched, it clings upright braced on its tail, bobs, shifts its grip, and
  // its head moves as birds' do, in quick jerks, then still; its eye looks at
  // whatever moves nearby, now and then at you, and blinks. It eyes its next
  // chunk (which glows and cracks, faster and faster as the strike nears),
  // its head turned and tilted to it; flies to it and drums it, a blow on
  // every knock of the drum you hear, chips flying, the last blow on the
  // strike; flies back, and says "kik!" as it settles. It's drawn on its own
  // layer, the board and the room round it its perch and its flights need,
  // from parts drawn once (see birdPart).
  let birdLayer = null, birdG = null, birdShown = false;
  // The board on the page, in CSS px, and how far the free page runs round it
  // before the page's own furniture (the tags, the speed buttons, the chatter)
  // and the screen's safe area, how tall the ledge under it is (on a phone
  // held upright; else 0), and where across the ledge the frame's moss and
  // leaves hang into it ([left, right] each): the game keeps them current.
  const boardRect = { x: 0, y: 0, w: 0, left: 0, top: 0, right: 0, bottom: 0, ledge: 0, hang: [] };
  function setBoardRect(x, y, w, free = null) {
    boardRect.x = x; boardRect.y = y; boardRect.w = w;
    boardRect.left = free ? free.left : 0; boardRect.top = free ? free.top : 0;
    boardRect.right = free ? free.right : innerWidth; boardRect.bottom = free ? free.bottom : innerHeight;
    boardRect.ledge = free?.ledge || 0;
    boardRect.hang = free?.hang || [];
    perches.clear(); drumAt.clear(); birdLayout++; // (its perches and where it drums are worked out again: the room round the board has changed)
  }
  const BU = CELL * 0.85; // the bird's unit
  const BILL = [2.55, -1.72]; // its beak tip, in units, before its head moves
  const BIRD_BOX = [-1.15, -2.55, 2.65, 3.2]; // (all of it, round its feet, in units, facing right: its back, crown, beak tip, tail)
  const PERCH_NEAR = 0.65, PERCH_MIN_PX = 30, PERCH_FLOOR_PX = 22; // (how small it may perch: on a nearer side; and, CSS px tall, where there's no room anywhere; and on a phone held upright of a height in between, where the page leaves it room for 24)
  const PERCH_GAP_PX = 1.5, BOX_EDGE = 0.1; // (how far, CSS px, it keeps off the cells, its ink's soft edge never touching one; and, units, how far its outline and its beak, turned to look, reach past its box)
  const LEDGE_LOOK = 0.3, CROUCH = 0.25; // (on the ledge, how far it may look up at its chunk, radians, with its beak still under the board; and how far its crouch lowers it, units)
  const FLIGHT_BACK = 6; // (units: how far behind the spot it strikes its wings reach as it flies in, its beak's length and a wingbeat back)
  // Where it perches to work on a spot (board px), and how big (s): beside
  // the board on the nearest side with room for it on this screen (or with
  // room for it a little smaller), its beak just short of the board; with
  // less room, on the left or right where it still fits at PERCH_MIN_PX
  // tall (a phone on its side: the gap beside the column), the nearer if
  // both. There it keeps its outline and a hair (PERCH_GAP_PX) off the
  // cells and off what's beside it, its beak turned to look too. On a phone
  // held upright the board runs edge to edge, with no room beside it, so it
  // stands on the ledge under the board: just below the bottom edge, beside
  // the spot on the middle's side, facing out to it (so it flies to drum it
  // over the board, never past the screen's edge), clear of the moss and
  // leaves hanging there, as big as the ledge lets it be (about 53 px tall
  // on a 390 px phone), and it only looks up a little at its chunk (its
  // beak stays under the board). On a phone held upright of a height in
  // between (the ledge only partly on the screen, the gutter narrow), it's
  // smaller instead, on the ledge or beside the board, whichever lets it be
  // the bigger, down to PERCH_FLOOR_PX. With room nowhere (a tablet held
  // upright, or a phone too short for its ledge), as it always was: on the frame's
  // left or right, whichever is nearer the spot, shrunk to fit, its outline
  // still on the screen, about 32 px tall in a tablet's gutter (it's taller
  // than it's deep, so above or below the board it would be smaller still).
  // Only where that would leave it under PERCH_MIN_PX tall does its beak
  // reach over the board's edge; otherwise, like the corner leaves, it never
  // covers a cell. Its whole box stays on the screen and off the page's
  // furniture, crouching too. It always stands upright, facing the spot.
  function perchFor(tx, ty) {
    const sc = boardRect.w / SIZE, gap = sc ? PERCH_GAP_PX / sc : 0;
    const room = sc ? {
      left: (boardRect.x - boardRect.left) / sc, right: (Math.min(innerWidth, boardRect.right) - boardRect.x - boardRect.w) / sc,
      top: (boardRect.y - boardRect.top) / sc, bottom: (Math.min(innerHeight, boardRect.bottom) - boardRect.y - boardRect.w) / sc,
    } : { left: 999, right: 0, top: 0, bottom: 0 };
    const deep = (BIRD_BOX[2] - BIRD_BOX[0]) * BU, tall = (BIRD_BOX[3] - BIRD_BOX[1]) * BU; // (back to beak tip; crown to tail)
    const least = sc ? Math.min(1, PERCH_MIN_PX / (tall * sc)) : 1, floor = sc ? Math.min(1, PERCH_FLOOR_PX / (tall * sc)) : 1; // (the smallest it perches; and on a phone held upright, where neither the ledge nor a gutter has room for that)
    const beside = r => Math.min(1, (r - 2 * gap) / (deep + 2 * BOX_EDGE * BU)); // (its outline and the gap, on both sides)
    const whole = r => (r - 2 * gap >= tall + (2 * BOX_EDGE + CROUCH) * BU ? 1 : 0); // (above or below the board: all of it, crouching too, and the gap. With less room, pushed back onto the screen, it hung over the board's edge rows, as on a phone on its side under 600 px wide, its board shorter than the screen)
    const fit = { left: beside(room.left), right: beside(room.right), top: whole(room.top), bottom: whole(room.bottom) };
    const ledge = boardRect.ledge > 0 && sc ? Math.min(1, (room.bottom - 2 * gap) / (tall + (2 * BOX_EDGE + CROUCH) * BU)) : 0; // (how big it can stand there)
    const shrunk = k => Math.min(1, room[k] / (deep + 2 * BOX_EDGE * BU)); // (how big beside the board, its beak's tip touching it)
    const dist = { left: tx, right: SIZE - tx, top: ty, bottom: SIZE - ty };
    const nearer = (p, q) => dist[p] - dist[q] || fit[q] - fit[p];
    let side = ledge >= least ? 'ledge'
      : Object.keys(dist).filter(k => fit[k] >= PERCH_NEAR).sort(nearer)[0]
      || ['left', 'right'].filter(k => fit[k] >= least).sort(nearer)[0]
      || (nearer('left', 'right') <= 0 ? 'left' : 'right');
    // (a phone held upright of a height in between, its board too big to
    // leave it a gutter and too tall to show the ledge whole: there it's
    // smaller rather than over the cells, on the ledge or beside the board,
    // whichever lets it be the bigger, down to PERCH_FLOOR_PX tall; the page
    // leaves it room for that much, see style.css)
    const between = boardRect.ledge > 0 && (side === 'left' || side === 'right') && !(fit[side] >= least) && shrunk(side) < least;
    if (between && ledge >= floor && ledge >= shrunk(side)) side = 'ledge';
    const nowhere = (side === 'left' || side === 'right') && !(fit[side] >= least);
    const s = side === 'ledge' ? ledge : nowhere ? Math.max(between ? floor : least, shrunk(side)) : Math.max(least, fit[side]);
    const e = BOX_EDGE * s * BU + (nowhere ? 0 : gap), short = nowhere ? 0.05 * s * BU : e; // (how far it keeps clear all round, its outline at least; and its beak, of the board)
    const along = v => Math.max(BU * 2, Math.min(SIZE - BU * 2, v));
    const face = tx < SIZE / 2 ? 1 : -1; // (above or below the board, it stands off to one side of the spot)
    const p = side === 'left' ? { x: -(BIRD_BOX[2] * s * BU + short), y: along(ty) + BU * 1.75 * s, flip: 1, s }
      : side === 'right' ? { x: SIZE + BIRD_BOX[2] * s * BU + short, y: along(ty) + BU * 1.75 * s, flip: -1, s }
      : side === 'top' ? { x: along(tx) - face * BU * 1.6, y: -Math.min(BU * 3.3, Math.max(BU * 1.5, room.top - BU * 2.6)), flip: face, s }
      : side === 'ledge' ? { x: along(tx) + face * BU * 1.6 * s, y: SIZE + e - BIRD_BOX[1] * s * BU, flip: -face, s, up: LEDGE_LOOK }
      : { x: along(tx) - face * BU * 1.6, y: SIZE + e - BIRD_BOX[1] * s * BU, flip: face, s, up: LEDGE_LOOK }; // (below the board, as on the ledge: its crown just under the board, and only looking up a little at its chunk)
    // (then all of it on the screen, off the furniture, its outline and its crouch too: its back first, if it can't all fit)
    const x0 = (p.flip > 0 ? BIRD_BOX[0] : -BIRD_BOX[2]) * s * BU - e, x1 = (p.flip > 0 ? BIRD_BOX[2] : -BIRD_BOX[0]) * s * BU + e;
    const lo = -room.left - x0, hi = SIZE + room.right - x1;
    if (p.flip > 0) p.x = Math.max(lo, Math.min(hi, p.x));
    else p.x = Math.min(hi, Math.max(lo, p.x));
    p.y = Math.max(-room.top - BIRD_BOX[1] * s * BU + e, Math.min(SIZE + room.bottom - (BIRD_BOX[3] + CROUCH) * s * BU - e, p.y));
    // (on the ledge, clear of the moss and leaves hanging into it: where it
    // stands if that's clear, else the nearest place beside one that is,
    // still facing its spot, and still on the screen. Not on the outer side
    // of a spot near the screen's edge, if there's any such place on the
    // middle's side, though further off: flying in from the outer side to
    // strike there, its wings would beat past the screen's edge)
    if (side === 'ledge' && boardRect.hang.length) {
      const hang = boardRect.hang.map(([l, r]) => [(l - boardRect.x) / sc - gap, (r - boardRect.x) / sc + gap]);
      const box = f => (f > 0 ? [BIRD_BOX[0] * s * BU - e, BIRD_BOX[2] * s * BU + e] : [-BIRD_BOX[2] * s * BU - e, -BIRD_BOX[0] * s * BU + e]);
      const fits = (x, [a, b]) => x + a >= -room.left - 1e-6 && x + b <= SIZE + room.right + 1e-6 && hang.every(([l, r]) => x + b <= l || x + a >= r);
      const onScreen = f => (f > 0 ? tx - FLIGHT_BACK * BU >= -room.left : tx + FLIGHT_BACK * BU <= SIZE + room.right); // (its wings, flying in to strike facing that way)
      let best = null;
      for (const f of [p.flip, -p.flip]) {
        if (best && !onScreen(f)) break;
        const [a, b] = box(f);
        for (const x of [p.x, ...hang.flatMap(([l, r]) => [l - b, r - a])]) {
          if ((tx - x) * f < 0 || !fits(x, [a, b])) continue; // (its spot behind it, or no room)
          if (!best || Math.abs(x - p.x) < Math.abs(best.x - p.x) - 1e-6) best = { x, f };
        }
      }
      if (best) { p.x = best.x; p.flip = best.f; }
    }
    p.side = side;
    return p;
  }
  // Its perches, one for each spot it works on (worked out as it first needs
  // one, and again only when the room round the board changes: see
  // setBoardRect), and how it clings to drum each (see drumPoseAt).
  const perches = new Map(), drumAt = new Map();
  let birdLayout = 0;
  function perchAt(spot) {
    let p = perches.get(spot);
    if (!p) {
      const x = spot % GRID;
      p = perchFor(x * CELL + CELL / 2, (spot - x) / GRID * CELL + CELL / 2);
      p.rot = 0;
      perches.set(spot, p);
    }
    return p;
  }
  // The cell of a patch it works on: the one nearest the patch's middle (of
  // those as near, the first by row), so it's always on the patch, round a
  // bend too. Before its first patch it rests where the engine has it come
  // to, the middle of the top row (ARRIVAL_SPOT).
  function spotIn(cells) {
    let sx = 0, sy = 0, best = -1, near = Infinity;
    for (const k of cells) { sx += k % GRID; sy += (k - k % GRID) / GRID; }
    sx /= cells.length; sy /= cells.length;
    for (const k of cells) {
      const x = k % GRID, y = (k - x) / GRID, d = (x - sx) * (x - sx) + (y - sy) * (y - sy);
      if (d < near - 1e-9 || (d < near + 1e-9 && k < best)) { near = d; best = k; }
    }
    return best;
  }
  const ARRIVAL_SPOT = GRID / 2;
  const restSpot = w => (w.last.length ? spotIn(w.last) : Math.max(0, Math.min(GRID - 1, Math.round(w.y))) * GRID + Math.max(0, Math.min(GRID - 1, Math.round(w.x))));

  // Its layer: the board and the room round it the bird can use, not the
  // whole page (that cost 2 to 3.5 ms of the GPU's time every frame of
  // sudden death): on each side as far as the free page runs (to the tags,
  // the header, a column beside the board, a notch), at least BIRD_ROOM
  // units (a wingtip over the tags, as it drums the top row) and at most
  // BIRD_REACH (perched on the ledge or in a margin, crouching too, or
  // drumming an edge row), cut at the screen's left and right. Below the
  // board always BIRD_REACH, whatever the screen's height, so a phone's
  // address bar coming and going never makes it again, nor does the page
  // scrolling: it's only moved (a transform).
  const BIRD_REACH = 6.5, BIRD_ROOM = 1.2;
  const lay = { x: 0, y: 0, w: 0, h: 0, W: 0, H: 0, dpr: 0, sc: 1, ox: 0, oy: 0 }; // (where it is and how big, CSS px; its pixels; and the board's units to them)
  function placeLayer(dpr) {
    const css = boardRect.w / SIZE, most = BIRD_REACH * BU * css, least = BIRD_ROOM * BU * css, m = v => Math.max(least, Math.min(most, v));
    const left = Math.floor(boardRect.x - m(boardRect.x - boardRect.left)), right = Math.ceil(boardRect.x + boardRect.w + m(boardRect.right - boardRect.x - boardRect.w));
    const top = m(boardRect.y - boardRect.top), x = Math.max(0, left), y = Math.floor(boardRect.y - top);
    const w = Math.max(1, Math.min(innerWidth, right) - x), h = Math.ceil(top + boardRect.w + most) + 1;
    let fresh = false;
    if (w !== lay.w || h !== lay.h || dpr !== lay.dpr) {
      lay.w = w; lay.h = h; lay.dpr = dpr;
      lay.W = birdLayer.width = Math.max(1, Math.round(w * dpr)); lay.H = birdLayer.height = Math.max(1, Math.round(h * dpr));
      birdLayer.style.width = `${w}px`; birdLayer.style.height = `${h}px`;
      fresh = true;
    }
    if (fresh || x !== lay.x || y !== lay.y) { lay.x = x; lay.y = y; birdLayer.style.transform = `translate(${x}px, ${y}px)`; fresh = true; }
    lay.sc = css * lay.W / w;
    lay.ox = (boardRect.x - x) * lay.W / w; lay.oy = (boardRect.y - y) * lay.H / h;
    return fresh;
  }
  // Where any of it may be drawn (board units): on the screen and its layer,
  // a hair in. Flying and drumming, it keeps inside (see fitBird, drumPoseAt).
  const room = { x0: 0, y0: 0, x1: 0, y1: 0 };
  function birdRoom() {
    const css = boardRect.w / SIZE, e = 1.5;
    room.x0 = (Math.max(0, lay.x) + e - boardRect.x) / css; room.x1 = (Math.min(innerWidth, lay.x + lay.w) - e - boardRect.x) / css;
    room.y0 = (Math.max(0, lay.y) + e - boardRect.y) / css; room.y1 = (Math.min(innerHeight, lay.y + lay.h) - e - boardRect.y) / css;
  }
  const useBase = g => g.setTransform(lay.sc, 0, 0, lay.sc, lay.ox, lay.oy);

  // Its pose: where it is (its feet, board units), how big, which way it
  // faces, how far it's tipped (rot), crouched, its wings (how far out, up
  // or down in the beat (stroke), swept forward to land; near and far: how
  // much of each the screen has room for), its feet out or tucked, its head
  // turned (turn) and driven forward or drawn back (thrust; blurred when it
  // drums too fast to see), its beak open (gape), how high in the air (for
  // its shadow), and what it's doing (phase) and looking at (fx, fy).
  const pose = { x: 0, y: 0, s: 1, flip: 1, rot: 0, crouch: 0, wing: 0, stroke: 1, sweep: 0, near: 1, far: 1, feet: 1, turn: 0, thrust: 0, blur: 0, gape: 0, alpha: 1, air: 0, blink: false,
    phase: '', free: false, up: 1.2, fx: 0, fy: 0, drum: null, blows: 0, t: 0, tp: 0, u: 0 };
  // What it keeps between frames: its head's jerks and tilts, what it's
  // watching, its eye, its blinks, its grip; where it was drawn (to clear).
  const bird = { turn: 0, turnTo: 0, hold: 0, cock: 0, cockAt: 0, gx: 1, gy: 0, focus: null, focusUntil: 0, spot: { x: 0, y: 0 },
    nextBlink: 0, blinkUntil: 0, gripAt: 0, gripFrom: -1e9, box: [0, 0, 0, 0], drawn: false, clear: true, force: null };
  function resetBird(now = 0) {
    bird.turn = bird.turnTo = 0; bird.hold = 0; bird.cock = 0; bird.cockAt = 0; bird.gx = 1; bird.gy = 0; bird.focus = null; bird.focusUntil = 0;
    bird.nextBlink = now + T.BLINK_MIN; bird.blinkUntil = 0; bird.gripAt = now + 1800; bird.gripFrom = -1e9; bird.clear = true;
  }

  // Its timings (ms on the board's clock): settling as it lands, crouching to
  // take off, lingering after the strike, the least it looks at its chunk
  // before it goes, coming in as sudden death starts, a wingbeat, chips in
  // the air; and how far its head draws back between blows (units). A
  // flight takes longer the further it goes (flightMs, hopMs).
  const B_SETTLE = 120, B_TAKEOFF = 200, B_LINGER = 90, B_LOOK = 260, B_ARRIVE = 900, B_BEAT = 104, B_CHIPS = 340, B_BACK = 0.42;
  const flightMs = d => Math.max(240, Math.min(540, 200 + 0.42 * d));
  const hopMs = d => Math.max(180, Math.min(380, 140 + 0.35 * d));
  const smooth = t => t * t * (3 - 2 * t), clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);
  const tickMs = () => (window.SnakeEngine ? SnakeEngine.tickMs(game) : T.MIN_TICK);
  // The drum, as the sound has it (SnakeAudio.drumBlows: one table for the
  // knocks you hear and the blows you see); the same numbers if it isn't there.
  const DRUM_OWN = [];
  function drumTable(strike) {
    if (window.SnakeAudio?.drumBlows) return SnakeAudio.drumBlows(strike);
    const s = Math.max(0, Math.min(12, strike | 0));
    if (!DRUM_OWN[s]) { const n = s < 3 ? 14 : Math.max(6, 14 - 2 * (s - 2)), out = []; for (let i = 0, at = 0; i < n; at += 28 + 2 * i, i++) out.push(at); DRUM_OWN[s] = out; }
    return DRUM_OWN[s];
  }

  // Its plan for a patch, from the woodpecker's own state (the tick of its
  // strike, the patch, the one before, how many it's struck) and the board,
  // so every screen, a friend's too, draws the same bird at the same moment:
  // from where it rests, a hop to the perch for this spot (along the ledge,
  // or along its side of the board; to the board's other side it flies
  // straight in from where it is instead), a look, the flight in, a
  // landing, the drum (a blow on each knock, the last on the strike), timed
  // back from the strike; the flights shortened to fit the aim, leaving it
  // B_LOOK at least to look before it goes. With reduced motion, a blow on
  // every third knock, the last on the strike.
  // Where it clings to drum is chosen as the aim starts, and again each
  // tick while it's still on its perch (its hop done, before it crouches to
  // go): the way that hides least of what you need to see (see drumChoice),
  // as the board stands that tick. Then it's kept.
  const plan = { strikeAt: -1, spot: -1, prev: -1, pecks: -1, layout: -1, ms: 0, aim: 0, lively: true,
    tx: 0, ty: 0, from: null, hop: null, drum: null, times: [], D: 0, F: 0, H: 0, H0: 0, aimMs: 0, depart: 0, chose: -1 };
  function aimPlan(w, ms, to = Infinity) {
    const A = plan, spot = spotIn(w.target), prev = w.last.length ? spotIn(w.last) : ARRIVAL_SPOT, pecks = w.pecks || 0, lively = !reduced;
    if (A.strikeAt === w.strikeAt && A.spot === spot && A.prev === prev && A.pecks === pecks && A.layout === birdLayout && A.ms === ms && A.aim === T.PECK_AIM_TICKS && A.lively === lively) {
      if (A.chose !== game.tick && A.aimMs - to >= A.H && to > A.depart + B_TAKEOFF) { // (still on its perch: look again)
        A.chose = game.tick;
        const d = drumChoice(w, spot, A.from.flip);
        if (d !== A.drum) {
          const F = flightMs(Math.hypot(d.x - A.from.x, d.y - A.from.y)), k = Math.max(0.4, Math.min(1, (A.aimMs - B_LOOK - B_TAKEOFF - B_SETTLE - A.D) / (F + A.H0)));
          if (to > A.D + B_SETTLE + F * k + B_TAKEOFF) { A.drum = d; A.F = F * k; A.depart = A.D + B_SETTLE + A.F; } // (its hop kept as it was)
        }
      }
      return A;
    }
    A.strikeAt = w.strikeAt; A.spot = spot; A.prev = prev; A.pecks = pecks; A.layout = birdLayout; A.ms = ms; A.aim = T.PECK_AIM_TICKS; A.lively = lively;
    A.tx = (spot % GRID) * CELL + CELL / 2; A.ty = Math.floor(spot / GRID) * CELL + CELL / 2;
    const was = perchAt(prev), at = perchAt(spot), beside = k => k === 'left' || k === 'right';
    A.from = beside(was.side) && beside(at.side) && was.side !== at.side ? was : at;
    A.hop = A.from === at && Math.hypot(at.x - was.x, at.y - was.y) > 1 ? was : null;
    A.drum = drumChoice(w, spot, A.from.flip); A.chose = game.tick;
    const blows = drumTable(pecks), n = blows.length;
    A.D = blows[n - 1];
    A.times.length = 0;
    for (let i = 0; i < n; i++) if (lively || (n - 1 - i) % 3 === 0) A.times.push(blows[i] - A.D);
    A.aimMs = T.PECK_AIM_TICKS * ms;
    const F = flightMs(Math.hypot(A.drum.x - A.from.x, A.drum.y - A.from.y)), H = A.hop ? hopMs(Math.hypot(at.x - was.x, at.y - was.y)) : 0;
    const k = Math.max(0.4, Math.min(1, (A.aimMs - B_LOOK - B_TAKEOFF - B_SETTLE - A.D) / (F + H)));
    A.F = F * k; A.depart = A.D + B_SETTLE + A.F;
    A.H0 = H; A.H = Math.min(H * k, Math.max(0, A.aimMs - A.depart - 60));
    return A;
  }
  // ...and after the strike: a moment at the hole, the flight back to the
  // perch for the spot it struck, and settling there (its "kik!": the game
  // asks birdHome when), all within its rest.
  const home = { struckAt: -1, spot: -1, layout: -1, ms: 0, rest: 0, lively: true, drum: null, to: null, tx: 0, ty: 0, F: 0, total: Infinity };
  function homePlan(w, ms) {
    const H = home, spot = spotIn(w.last), rest = (w.restUntil - w.struckAt) * ms, lively = !reduced;
    if (H.struckAt === w.struckAt && H.spot === spot && H.layout === birdLayout && H.ms === ms && H.rest === rest && H.lively === lively) return H;
    H.struckAt = w.struckAt; H.spot = spot; H.layout = birdLayout; H.ms = ms; H.rest = rest; H.lively = lively;
    H.tx = (spot % GRID) * CELL + CELL / 2; H.ty = Math.floor(spot / GRID) * CELL + CELL / 2;
    H.to = perchAt(spot);
    H.drum = plan.strikeAt === w.struckAt && plan.spot === spot && plan.layout === birdLayout ? plan.drum : drumPoseAt(spot, H.to.flip);
    H.F = Math.max(160, Math.min(flightMs(Math.hypot(H.to.x - H.drum.x, H.to.y - H.drum.y)), rest - B_LINGER - B_SETTLE - 120));
    H.total = B_LINGER + H.F + B_SETTLE;
    return H;
  }

  // Its pose at this moment (tp: the tick, and how far through it, as drawn).
  const ARRIVE_FROM = { x: 0, y: 0, s: 0.3, flip: 1, rot: 0 };
  function posture(w, tp, now) {
    const P = pose, ms = tickMs(), lively = !reduced;
    P.alpha = 1; P.thrust = 0; P.blur = 0; P.gape = 0; P.air = 0; P.wing = 0; P.stroke = 1; P.sweep = 0; P.near = P.far = 1; P.feet = 1; P.crouch = 0; P.rot = 0;
    P.free = false; P.up = 1.2; P.drum = null; P.blows = 0; P.blink = false;
    if (w.target.length) {
      const to = (w.strikeAt - tp) * ms, A = aimPlan(w, ms, to), into = A.aimMs - to;
      P.fx = A.tx; P.fy = A.ty;
      if (A.hop && into < A.H) flight(A.hop, perchAt(A.spot), Math.max(0, into) / A.H, A.H, P, 'hop', 0, 0);
      else if (to > A.depart) { perched(A.from, P, 'eye'); if (lively) P.crouch = smooth(clamp01(1 - (to - A.depart) / B_TAKEOFF)); }
      else if (to > A.D + B_SETTLE) flight(A.from, A.drum, (A.depart - to) / A.F, A.F, P, 'out', lively ? 1 : 0, 0);
      else if (to > A.D + 1e-6) { landing(A.drum, (A.D + B_SETTLE - to) / B_SETTLE, P, 'land'); windUp(A, -to, P); }
      else drumming(A, -to, P);
      return;
    }
    if (w.struckAt >= 0 && w.last.length) {
      const H = homePlan(w, ms), since = (tp - w.struckAt) * ms;
      P.fx = H.to.x; P.fy = H.to.y - BU * 2;
      if (since < B_LINGER) { P.fx = H.tx; P.fy = H.ty; lingering(H.drum, clamp01(since / B_LINGER), P); chipsAfter(w, since, P); return; }
      if (since < B_LINGER + H.F) { flight(H.drum, H.to, (since - B_LINGER) / H.F, H.F, P, 'back', 0, 0.6); chipsAfter(w, since, P); return; }
      if (since < H.total) { landing(H.to, (since - B_LINGER - H.F) / B_SETTLE, P, 'settle'); return; }
      perched(H.to, P, 'rest');
      const kik = since - H.total; // (its "kik!" as it settles: its beak opens)
      if (kik < 110) P.gape = 0.3 * Math.sin(Math.PI * kik / 110);
      return;
    }
    const to = perchAt(restSpot(w));
    if (!w.last.length && w.struckAt < 0) {
      // Coming in from far off, small, as sudden death starts ("kik! kik!
      // kik!"), the moment the engine has it come (its first patch is
      // PECK_ARRIVE_TICKS on).
      const msA = (tp - (w.restUntil - T.PECK_ARRIVE_TICKS)) * ms;
      if (msA >= 0 && msA < B_ARRIVE) {
        if (!lively) { perched(to, P, 'rest'); P.alpha = clamp01(msA / 400); return; }
        const F = B_ARRIVE - B_SETTLE;
        ARRIVE_FROM.x = to.x + (SIZE / 2 - to.x) * 0.55; ARRIVE_FROM.y = SIZE * 0.1; ARRIVE_FROM.flip = to.x < ARRIVE_FROM.x ? -1 : 1;
        P.fx = to.x; P.fy = to.y - BU * 2;
        if (msA < F) { flight(ARRIVE_FROM, to, msA / F, F, P, 'arrive', 0, 0); P.alpha = clamp01(msA / (F * 0.25)); }
        else landing(to, (msA - F) / B_SETTLE, P, 'settle');
        if (msA < 390) P.gape = 0.3 * Math.sin(Math.PI * Math.min(1, (msA % 130) / 70)); // (its three calls: its beak opens on each)
        return;
      }
    }
    perched(to, P, 'rest');
  }
  function perched(p, P, phase) {
    P.x = p.x; P.y = p.y; P.s = p.s; P.flip = p.flip; P.rot = 0; P.feet = 1; P.wing = 0; P.up = p.up ?? 1.2; P.phase = phase;
  }
  // A flight from a to b (u: how far through, 0 to 1; ms: how long it takes):
  // bounding as a woodpecker does, a burst of wingbeats lifting it, its wings
  // tucked as it dips, then beats again, the whole in a swoop; its body
  // tipped the way it's going, upright as it takes off, and leaning back
  // with its wings up and swept forward as it comes in to land. Off its
  // perch crouched (crouch), or with its wings half open already (wing).
  // With reduced motion, one smooth glide, its wings out and still.
  let PX = 0, PY = 0;
  function pathAt(a, b, u, ms, lively) {
    const e = smooth(u), dx = b.x - a.x, dy = b.y - a.y, hump = Math.min(BU * 1.1, Math.hypot(dx, dy) * 0.12);
    PX = a.x + dx * e; PY = a.y + dy * e - hump * Math.sin(Math.PI * u);
    if (lively) {
      const nb = Math.max(1, Math.round(ms / 240)), q = u * nb, p = q - Math.min(nb - 1, Math.floor(q));
      PY -= BU * 0.32 * Math.min(1, ms / 300) * Math.sin(Math.PI * u) * Math.sin(Math.PI * p);
    }
  }
  function flight(a, b, u, ms, P, phase, crouch, wing) {
    u = clamp01(u);
    const lively = !reduced, dx = b.x - a.x;
    pathAt(a, b, u, ms, lively);
    P.x = PX; P.y = PY;
    P.flip = u > 0.86 ? b.flip : Math.abs(dx) > BU * 1.2 ? Math.sign(dx) : b.flip; // (it turns to land, if it must)
    P.s = a.s + (b.s - a.s) * smooth(u);
    const far = Math.hypot(dx, b.y - a.y) || 1;
    let vx = dx / far, vy = (b.y - a.y) / far; // (the way it's going overall, swaying with each swoop and dip)
    if (lively) { pathAt(a, b, Math.min(1, u + 0.02), ms, true); const x1 = PX, y1 = PY; pathAt(a, b, Math.max(0, u - 0.02), ms, true); const ix = x1 - PX, iy = y1 - PY, il = Math.hypot(ix, iy) || 1; vx += 0.6 * ix / il; vy += 0.6 * iy / il; }
    const pitch = Math.max(-0.35, Math.min(1.15, (Math.atan2(vy, vx * P.flip) + Math.PI / 2) * 0.75)); // (0: going straight up; level at about 1.15, and no further nose down)
    const k0 = smooth(clamp01(u / 0.16)), k1 = smooth(clamp01((1 - u) / 0.22));
    P.rot = ((pitch * k0 + a.rot * a.flip * (1 - k0)) * k1 + (b.rot * b.flip - 0.3) * (1 - k1)) * P.flip;
    P.feet = 0; P.air = smooth(clamp01(Math.min(u / 0.15, (1 - u) / 0.2)));
    P.crouch = crouch * (1 - smooth(clamp01(u / 0.15)));
    if (lively) {
      const nb = Math.max(1, Math.round(ms / 240)), q = u * nb, j = Math.min(nb - 1, Math.floor(q)), p = q - j;
      const beat = j < nb - 1 && p > 0.55 ? Math.max(0, 1 - (p - 0.55) / 0.07) : 1; // (tucked, dipping)
      P.wing = Math.max(beat * Math.min(1, wing + u / 0.05), 1 - k1);
      P.stroke = Math.cos(TAU * u * ms / B_BEAT) * k1 + (1 - k1);
    } else {
      P.wing = Math.min(1, wing + u / 0.1);
      P.stroke = 0.55 * k1 + (1 - k1);
    }
    P.sweep = 0.45 * (1 - k1);
    P.phase = phase; P.free = true; P.u = u;
  }
  // Landing (u, 0 to 1, over B_SETTLE): its wings folding from the flare, its
  // body righting, a little settle onto its feet.
  function landing(b, u, P, phase) {
    u = clamp01(u);
    const k = smooth(clamp01(u / 0.55));
    P.x = b.x; P.y = b.y; P.s = b.s; P.flip = b.flip;
    P.rot = (b.rot * b.flip - 0.3 * (1 - k)) * b.flip;
    P.wing = 1 - k; P.stroke = 1; P.sweep = 0.45 * (1 - k);
    P.feet = u > 0.2 ? 1 : 0;
    P.crouch = reduced ? 0 : 0.8 * Math.sin(Math.PI * clamp01(u / 0.85));
    P.air = 0.3 * (1 - k); P.up = b.up ?? 1.2;
    P.phase = phase;
  }
  // As it lands on its chunk, it draws its head back for the first blow.
  function windUp(A, t, P) {
    const t0 = A.times[0];
    if (t <= t0 - 100) return;
    P.thrust = t < t0 - 30 ? -1.3 * B_BACK * smooth(clamp01((t - (t0 - 100)) / 70)) : -1.3 * B_BACK * (1 - ((t - (t0 - 30)) / 30) ** 2);
  }
  // Drumming (t: ms to the strike, as a negative): a blow on each of the
  // drum's knocks (A.times), its head driving in and drawing back between
  // them, a blur when they come too fast to see; the last on the strike.
  function drumming(A, t, P) {
    const d = A.drum, n = A.times.length;
    P.x = d.x; P.y = d.y; P.s = d.s; P.flip = d.flip; P.rot = d.rot; P.feet = 1; P.phase = 'drum';
    let i = 0;
    while (i + 1 < n && A.times[i + 1] <= t) i++;
    if (i < n - 1) {
      const gap = A.times[i + 1] - A.times[i], p = clamp01((t - A.times[i]) / gap);
      P.thrust = 0.06 - (B_BACK + 0.06) * Math.pow(Math.sin(Math.PI * p), 0.8);
      P.blur = reduced ? 0 : clamp01((46 - gap) / 16);
    } else P.thrust = 0.06;
    P.drum = A; P.blows = i + 1; P.t = t;
  }
  // The strike made: its head pulled out of the hole, wings opening, a lean back.
  function lingering(d, u, P) {
    P.x = d.x; P.y = d.y; P.s = d.s; P.flip = d.flip; P.feet = 1; P.phase = 'linger';
    P.rot = (d.rot * d.flip - 0.15 * smooth(u)) * d.flip;
    P.thrust = -1.2 * B_BACK * smooth(u); P.wing = 0.6 * smooth(u); P.stroke = 1;
  }
  // The last blows' chips, still in the air after the strike.
  function chipsAfter(w, since, P) {
    if (plan.strikeAt === w.struckAt && since < B_CHIPS) { P.drum = plan; P.blows = -1; P.t = since; }
  }

  // How it clings to drum a spot: upright, facing the way it came (flip),
  // its beak's tip on the spot, if all of it fits on the screen there (its
  // head drawn back, its settle and its lean back as it lands too); else leaning, else facing the
  // other way, else lying level, its beak down at the spot (the bottom
  // rows, with the board's bottom at the screen's) or up; else smaller.
  // (Upright on the bottom row, its tail hung four cells below the board,
  // past the bottom of a phone on its side.) With it, the other ways it
  // could cling there as big (alts, the first this one): upright or
  // leaning, facing either way (or, where it must lie level, lying level),
  // for drumChoice.
  const DRUM_TRIES = [0, 1, 0.45, 1, -0.45, 1, 0, -1, 0.45, -1, -0.45, -1, Math.PI / 2, 1, -Math.PI / 2, 1, Math.PI / 2, -1, -Math.PI / 2, -1], DRUM_SIZES = [1, 0.85, 0.72, 0.6];
  const DRUM_UPRIGHT = 12; // (the tries upright or leaning: the first six)
  const probe = { x: 0, y: 0, s: 1, flip: 1, rot: 0, crouch: 0, wing: 0, stroke: 1, sweep: 0, near: 1, far: 1, feet: 1, turn: 0, thrust: 0, air: 0 };
  function drumPoseAt(spot, flip) {
    const key = spot * 2 + (flip > 0 ? 1 : 0);
    let d = drumAt.get(key);
    if (d) return d;
    const tx = (spot % GRID) * CELL + CELL / 2, ty = Math.floor(spot / GRID) * CELL + CELL / 2, Q = probe;
    let best = null, least = Infinity;
    for (const s of DRUM_SIZES) {
      for (let i = 0; i < DRUM_TRIES.length; i += 2) {
        if (d && (i < DRUM_UPRIGHT) !== d.upright) break; // (no lying level where it can stand)
        const f = flip * DRUM_TRIES[i + 1];
        Q.s = s; Q.flip = f; Q.rot = DRUM_TRIES[i] * f; Q.x = Q.y = 0; Q.turn = 0; Q.thrust = 0; Q.crouch = 0;
        birdMats(Q);
        Q.x = tx - atX(HM, BILL[0], BILL[1]); Q.y = ty - atY(HM, BILL[0], BILL[1]);
        Q.thrust = 0.06; birdBox(Q, true);
        Q.thrust = -1.3 * B_BACK; Q.crouch = 0.8; birdBox(Q, false);
        Q.crouch = 0; Q.rot = (DRUM_TRIES[i] - 0.3) * f; birdBox(Q, false); Q.rot = DRUM_TRIES[i] * f; // (and leaning back as it lands, or as it pulls out of the hole)
        const over = Math.max(room.x0 - box.x0, room.y0 - box.y0, box.x1 - room.x1, box.y1 - room.y1);
        if (over <= 0) { const p = { x: Q.x, y: Q.y, s, flip: f, rot: Q.rot, upright: i < DRUM_UPRIGHT }; if (d) d.alts.push(p); else { d = p; d.alts = [p]; } }
        else if (!d && over < least) { least = over; best = { x: Q.x, y: Q.y, s, flip: f, rot: Q.rot }; }
      }
      if (d) break;
    }
    if (!d) { d = best; d.alts = [best]; }
    drumAt.set(key, d);
    return d;
  }
  // Which of those ways it clings by, drumming: the one that hides least of
  // what you need to see then, as the board stands: the rings where the
  // food in its mark will land (the strike's promise; four times what the
  // food itself counts), then that food, trembling. As it came, upright, if
  // that's as clear. (What it still covers is drawn over it: see
  // drawWoodpecker.)
  const SEE_RING = 4, SEE_FOOD = 1;
  let seeN = 0, seeX = new Float32Array(32), seeY = new Float32Array(32), seeW = new Float32Array(32);
  function drumChoice(w, spot, flip) {
    const d = drumPoseAt(spot, flip);
    if (d.alts.length < 2) return d;
    const lands = knockCells(w);
    seeN = 0;
    const see = (x, y, wt) => {
      if (seeN === seeX.length) { const grow = a => { const b = new Float32Array(2 * a.length); b.set(a); return b; }; seeX = grow(seeX); seeY = grow(seeY); seeW = grow(seeW); }
      seeX[seeN] = (x + 0.5) * CELL; seeY[seeN] = (y + 0.5) * CELL; seeW[seeN++] = wt;
    };
    for (let i = 0; i < lands.length; i += 2) see(lands[i], lands[i + 1], SEE_RING);
    for (const f of game.food) if (w.target.includes(f.y * GRID + f.x)) see(f.x, f.y, SEE_FOOD);
    if (!seeN) return d;
    let pick = d, least = Infinity;
    for (const p of d.alts) {
      const c = hides(p);
      if (c < least - 1e-6) { least = c; pick = p; }
    }
    return pick;
  }
  // How much of those (seeX, seeY: each a ring's round, its middle and eight
  // points on it) the bird drumming in pose p covers: its body, its tail,
  // its head and beak, ink and all.
  const SEE_R = CELL * 0.4;
  function hides(p) {
    const Q = probe;
    Q.x = p.x; Q.y = p.y; Q.s = p.s; Q.flip = p.flip; Q.rot = p.rot; Q.turn = 0; Q.thrust = 0.06; Q.crouch = 0;
    birdMats(Q);
    let sum = 0;
    for (let j = 0; j < seeN; j++) {
      let n = 0;
      for (let q = 0; q < 9; q++) {
        const a = q * TAU / 8, x = seeX[j] + (q < 8 ? Math.cos(a) * SEE_R : 0), y = seeY[j] + (q < 8 ? Math.sin(a) * SEE_R : 0);
        if (covers(x, y)) n++;
      }
      sum += seeW[j] * n / 9;
    }
    return sum;
  }
  function covers(x, y) { // (is board point x, y under the bird as its frames BM and HM stand?)
    let m = BM, det = m[0] * m[3] - m[1] * m[2], dx = x - m[4], dy = y - m[5];
    let u = (m[3] * dx - m[2] * dy) / det, v = (m[0] * dy - m[1] * dx) / det;
    if (((u + 0.1) / 1.07) ** 2 + ((v - 0.3) / 1.67) ** 2 <= 1 || inTri(u, v, -0.55, 1.1, -0.15, 3.1, 0.3, 1.2)) return true; // (its body; its tail)
    m = HM; det = m[0] * m[3] - m[1] * m[2]; dx = x - m[4]; dy = y - m[5];
    u = (m[3] * dx - m[2] * dy) / det; v = (m[0] * dy - m[1] * dx) / det;
    return ((u - 0.45) / 0.84) ** 2 + ((v + 1.75) / 0.82) ** 2 <= 1 || (u + 0.12) ** 2 + (v + 1.95) ** 2 <= 0.42 ** 2 || inTri(u, v, 1.05, -2.0, BILL[0], BILL[1], 1.05, -1.5); // (its head, its nape, its beak)
  }
  function inTri(x, y, ax, ay, bx, by, cx, cy) {
    const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by), d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy), d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }

  // Its frame (2D matrices, as setTransform takes them, from its own units,
  // 1 = BU, to the board's): its body (BM), its head (HM: turned at the
  // neck, driven forward or drawn back), a wing (WM).
  const BM = new Float64Array(6), HM = new Float64Array(6), WM = new Float64Array(6), TM = new Float64Array(6), UNIT = new Float64Array([1, 0, 0, 1, 0, 0]);
  function mThen(out, m, x, y, rot, sx, sy) { // (out: m, then moved to x, y, turned and scaled; out may be m)
    const c = Math.cos(rot), s = Math.sin(rot), a = c * sx, b = s * sx, cc = -s * sy, d = c * sy, m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3];
    out[4] = m0 * x + m2 * y + m[4]; out[5] = m1 * x + m3 * y + m[5];
    out[0] = m0 * a + m2 * b; out[1] = m1 * a + m3 * b; out[2] = m0 * cc + m2 * d; out[3] = m1 * cc + m3 * d;
  }
  const atX = (m, x, y) => m[0] * x + m[2] * y + m[4], atY = (m, x, y) => m[1] * x + m[3] * y + m[5]; // (where m takes a point)
  const useM = (g, m) => g.setTransform(lay.sc * m[0], lay.sc * m[1], lay.sc * m[2], lay.sc * m[3], lay.sc * m[4] + lay.ox, lay.sc * m[5] + lay.oy);
  function birdMats(P) {
    const z = P.s * (1 + 0.08 * P.air) * BU; // (a touch bigger in the air: nearer to you)
    mThen(BM, UNIT, P.x, P.y, P.rot, P.flip * z, z);
    mThen(BM, BM, 0, P.crouch * CROUCH, 0, 1, 1);
    mThen(HM, BM, 0.25, -1.15, P.turn, 1, 1);
    mThen(HM, HM, P.thrust - 0.25, 1.15, 0, 1, 1);
  }
  // A wing: from its shoulder, up over its back at the top of the beat
  // (stroke 1), down under its belly at the bottom (-1), short as it passes
  // edge-on between; swept forward to land; the far one behind its body.
  function wingMat(P, far) {
    const a = Math.PI / 2 + Math.PI / 2 * P.stroke + P.sweep, len = P.wing * (0.35 + 0.65 * Math.abs(P.stroke)) * (far ? 0.9 * P.far : P.near);
    mThen(WM, BM, far ? 0.05 : -0.1, far ? -0.55 : -0.4, a, len, 1);
  }
  // Where all of it is (board units, in box): round the points of its parts, each with its reach.
  const box = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const PTS_BODY = [-0.1, -0.45, 1.13, -0.1, 1.05, 1.13, -0.15, 3.1, 0.2, -0.55, 1.1, 0.16, 0.3, 1.2, 0.16, 0.95, 0.55, 0.22, 0.95, 1.05, 0.22];
  const PTS_HEAD = [0.45, -1.75, 0.84, -0.12, -1.95, 0.44, 2.55, -1.72, 0.15, 1.05, -2.0, 0.14, 1.05, -1.5, 0.14];
  const PTS_WING = [1.5, 0, 0.64, 3.1, 0, 0.64];
  const BOTH = [false, true];
  function boxAdd(m, pts, k) {
    for (let i = 0; i < pts.length; i += 3) {
      const x = atX(m, pts[i], pts[i + 1]), y = atY(m, pts[i], pts[i + 1]), r = pts[i + 2] * k;
      if (x - r < box.x0) box.x0 = x - r;
      if (x + r > box.x1) box.x1 = x + r;
      if (y - r < box.y0) box.y0 = y - r;
      if (y + r > box.y1) box.y1 = y + r;
    }
  }
  function birdBox(P, fresh = true) {
    birdMats(P);
    if (fresh) { box.x0 = box.y0 = Infinity; box.x1 = box.y1 = -Infinity; }
    const k = Math.hypot(BM[0], BM[1]);
    boxAdd(BM, PTS_BODY, k); boxAdd(HM, PTS_HEAD, k);
    if (P.wing > 0.02) for (const far of BOTH) { wingMat(P, far); boxAdd(WM, PTS_WING, k); }
  }
  // All of it on the screen: a wing that would reach past its edge (or its
  // layer's) beats short of it, folded a little; flying, the bird keeps in
  // from the edge. Perched, landing or drumming, it's where it was placed
  // to fit (perchFor, drumPoseAt).
  function fitBird(P) {
    if (P.wing > 0.02) {
      birdMats(P);
      const k = Math.hypot(BM[0], BM[1]);
      for (const far of BOTH) {
        if (wingFits(P, far, k)) continue;
        let lo = 0.2, hi = 1;
        for (let i = 0; i < 6; i++) { const mid = (lo + hi) / 2; if (far) P.far = mid; else P.near = mid; if (wingFits(P, far, k)) lo = mid; else hi = mid; }
        if (far) P.far = lo; else P.near = lo;
      }
    }
    if (!P.free) return;
    birdBox(P);
    P.x += box.x0 < room.x0 ? room.x0 - box.x0 : box.x1 > room.x1 ? room.x1 - box.x1 : 0;
    P.y += box.y0 < room.y0 ? room.y0 - box.y0 : box.y1 > room.y1 ? room.y1 - box.y1 : 0;
  }
  function wingFits(P, far, k) {
    wingMat(P, far);
    for (let i = 0; i < PTS_WING.length; i += 3) {
      const x = atX(WM, PTS_WING[i], 0), y = atY(WM, PTS_WING[i], 0), r = PTS_WING[i + 2] * k;
      if (x - r < room.x0 || x + r > room.x1 || y - r < room.y0 || y + r > room.y1) return false;
    }
    return true;
  }

  // Its head and its eye. Resting, it watches whatever moves near it (a
  // head, a beetle), now and then you, and blinks; its head jerks to each
  // thing and holds still, as birds' heads do. Through the aim its head
  // turns to its chunk and tilts this way and that, its eye on it; flying
  // in, its eye stays on it. Its pupil turns as the snakes' do: eased toward
  // what it looks at, the way it looks turned into its head's frame.
  function headAndEye(P, now, dt) {
    const lively = !reduced, ph = P.phase, perchedNow = ph === 'rest' || ph === 'eye';
    let want = 0;
    if (ph === 'rest') { birdWatch(P, now); P.fx = bird.spot.x; P.fy = bird.spot.y; }
    if (perchedNow || ph === 'hop' || ph === 'out') {
      const hx = P.x + P.flip * 0.45 * BU * P.s, hy = P.y - 1.75 * BU * P.s, up = perchedNow ? P.up : 0.6;
      want = Math.atan2(P.fy - hy, (P.fx - hx) * P.flip) - P.rot * P.flip;
      if (ph === 'eye' && lively) { // (tilting its head this way and that, to look at it)
        if (now > bird.cockAt) { bird.cock = bird.cock ? 0 : 0.16; bird.cockAt = now + 380 + 320 * Math.random(); }
        want += want > 0 ? -bird.cock : bird.cock;
      }
      want = Math.max(-up, Math.min(perchedNow ? 1.2 : 0.6, want));
      if (ph === 'out') want *= 1 - smooth(clamp01((P.u - 0.6) / 0.4)); // (its beak coming round to strike as it comes in)
      if (ph === 'rest') want = Math.max(-0.7, Math.min(1, want)); // (resting, it looks round, not straight up or down)
    } else if (ph === 'drum' || ph === 'linger' || ph === 'land') bird.turn = bird.turnTo = 0;
    if (lively && perchedNow) {
      if (Math.abs(want - bird.turnTo) > 0.1 || now > bird.hold) { bird.turnTo = want + (ph === 'rest' ? (Math.random() - 0.5) * 0.3 : 0); bird.hold = now + 260 + 640 * Math.random(); }
      bird.turn += (bird.turnTo - bird.turn) * (1 - Math.exp(-dt / 30));
    } else bird.turn += (want - bird.turn) * (1 - Math.exp(-dt / (lively ? 45 : 200)));
    if (perchedNow) bird.turn = Math.max(-P.up, Math.min(1.2, bird.turn));
    P.turn = bird.force == null ? bird.turn : perchedNow ? Math.max(-P.up, Math.min(1.2, bird.force)) : bird.force; // (held so for the tests, as far as it may turn there)
    // Resting, a small bob, and now and then it shifts its grip (a hitch down the log and back).
    if (lively && perchedNow) {
      let c = 0.18 * (0.5 - 0.5 * Math.cos(TAU * now / 1700));
      if (now > bird.gripAt) { bird.gripFrom = now; bird.gripAt = now + 2600 + 2800 * Math.random(); }
      const gp = (now - bird.gripFrom) / 420;
      if (gp >= 0 && gp < 1) c += 0.75 * (gp < 0.25 ? smooth(gp / 0.25) : 1 - smooth((gp - 0.25) / 0.75));
      P.crouch = Math.min(1, P.crouch + c);
    }
    // Its eye, from where it is to what it looks at.
    birdMats(P);
    const tx = P.fx - atX(HM, 0.75, -1.9), ty = P.fy - atY(HM, 0.75, -1.9), len = Math.hypot(tx, ty) || 1, k = 1 - Math.pow(1 - T.GLANCE_EASE, dt / 16.7);
    bird.gx += (tx / len - bird.gx) * k; bird.gy += (ty / len - bird.gy) * k;
    if (now > bird.nextBlink) { bird.blinkUntil = now + T.BLINK_MS; bird.nextBlink = now + T.BLINK_MIN + Math.random() * (T.BLINK_MAX - T.BLINK_MIN); }
    P.blink = now < bird.blinkUntil && (perchedNow || ph === 'settle');
  }
  // What it watches, resting: you now and then (if you're on the log), else
  // the nearest head or beetle within 9 cells of its head, else a look round;
  // a new pick every second or so, or when that one's gone.
  function birdWatch(P, now) {
    let f = bird.focus;
    if (f && (f.body ? !f.alive : f.kind ? !game.food.includes(f) : false)) f = null;
    if (!f || now >= bird.focusUntil) {
      bird.focusUntil = now + 600 + 1400 * Math.random();
      const hx = P.x + P.flip * 0.45 * BU * P.s, hy = P.y - 1.75 * BU * P.s, you = findById(viewerId);
      f = null;
      if (you && you.alive && Math.random() < 0.25) f = you;
      else {
        let near = (9 * CELL) ** 2;
        for (const s of game.snakes) if (s.alive) { const c = s.body[0], d = (c.x * CELL + CELL / 2 - hx) ** 2 + (c.y * CELL + CELL / 2 - hy) ** 2; if (d < near) { near = d; f = s; } }
        for (const b of game.food) if (b.kind === 'beetle') { const d = (b.x * CELL + CELL / 2 - hx) ** 2 + (b.y * CELL + CELL / 2 - hy) ** 2; if (d < near) { near = d; f = b; } }
      }
      if (!f) { const a = (Math.random() - 0.5) * 1.1; f = { x: hx + P.flip * Math.cos(a) * 300, y: hy + Math.sin(a) * 300 }; }
      bird.focus = f;
    }
    const c = f.body ? f.body[0] : f.kind ? f : null;
    bird.spot.x = c ? c.x * CELL + CELL / 2 : f.x; bird.spot.y = c ? c.y * CELL + CELL / 2 : f.y;
  }

  // Its parts, each drawn once (at this screen's size, and at half that for
  // a small perch) and laid on with its pose: its ink (every part a line's
  // width bigger, laid under the lot, so parts overlapping show no line
  // between them), then its colours. Its rim of light (along its upper
  // left, whichever way it's tipped), its beak (it opens to call) and its
  // eye are drawn as it stands. Each: its box in units, facing right, and
  // how it's drawn. Inked like everything else on the board, and lit by a
  // warm rim, so its black still reads on the dark page beside it.
  const BIRD_INK = '#3a2614', BIRD_RIM = '#e8d9b0'; // (Ink, and Parchment-2)
  const birdTail = g => { g.beginPath(); g.moveTo(-0.55, 1.1); g.lineTo(-0.15, 3.1); g.lineTo(0.3, 1.2); g.closePath(); };
  const birdFeet = g => { g.beginPath(); g.moveTo(0.5, 0.7); g.lineTo(0.95, 0.55); g.moveTo(0.5, 0.95); g.lineTo(0.95, 1.05); };
  const oval = (g, cx, cy, rx, ry, a = 0) => { g.beginPath(); g.ellipse(cx, cy, rx, ry, a, 0, TAU); };
  function bodyInk(g, feet) {
    g.strokeStyle = BIRD_INK; g.lineWidth = 0.24;
    birdTail(g); g.stroke();
    oval(g, -0.1, 0.3, 0.95, 1.55, 0.08); g.stroke();
    oval(g, 0.38, 0.45, 0.52, 1.15, 0.12); g.stroke();
    if (feet) { g.lineWidth = 0.36; birdFeet(g); g.stroke(); }
  }
  function bodyPart(g, folded, feet) { // (the stiff tail it props itself on, its body, its buff belly, the red under its tail; folded, its wing's white shoulder and bars)
    g.fillStyle = '#18181b';
    birdTail(g); g.fill();
    oval(g, -0.1, 0.3, 0.95, 1.55, 0.08); g.fill();
    g.fillStyle = '#efe9dc'; oval(g, 0.38, 0.45, 0.52, 1.15, 0.12); g.fill();
    g.fillStyle = '#dc2626'; oval(g, 0.22, 1.42, 0.36, 0.3); g.fill();
    if (folded) {
      g.fillStyle = '#f5f5f4'; oval(g, -0.3, -0.5, 0.32, 0.52, 0.2); g.fill();
      g.beginPath();
      for (let row = 0; row < 3; row++) for (let i = 0; i < 3; i++) { g.moveTo(-0.62 + i * 0.22 + 0.075, 0.15 + row * 0.38); g.arc(-0.62 + i * 0.22, 0.15 + row * 0.38, 0.075, 0, TAU); }
      g.fill();
    }
    if (feet) { g.strokeStyle = '#57534e'; g.lineWidth = 0.12; birdFeet(g); g.stroke(); } // (gripping the bark)
  }
  function headInk(g) { g.strokeStyle = BIRD_INK; g.lineWidth = 0.24; oval(g, 0.45, -1.75, 0.72, 0.7); g.stroke(); oval(g, -0.12, -1.95, 0.3, 0.28); g.stroke(); }
  function headPart(g) { // (black, a red nape, a white cheek under a black moustache stripe)
    g.fillStyle = '#18181b'; oval(g, 0.45, -1.75, 0.72, 0.7); g.fill();
    g.fillStyle = '#dc2626'; oval(g, -0.12, -1.95, 0.3, 0.28); g.fill();
    g.fillStyle = '#f5f5f4'; oval(g, 0.62, -1.58, 0.44, 0.33); g.fill();
    g.strokeStyle = '#18181b'; g.lineWidth = 0.15;
    g.beginPath(); g.moveTo(0.2, -1.25); g.quadraticCurveTo(0.6, -1.38, 1.0, -1.3); g.stroke();
  }
  function wingPart(g, far) { // (big and black, barred white; the far one darker)
    g.strokeStyle = BIRD_INK; g.lineWidth = 0.24; oval(g, 1.5, 0, 1.6, 0.55); g.stroke();
    g.fillStyle = far ? '#0c0c0e' : '#18181b'; g.fill();
    g.fillStyle = far ? '#a8a29e' : '#f5f5f4';
    g.beginPath();
    for (let i = 0; i < 4; i++) { const x = 0.8 + i * 0.42, y = i % 2 ? 0.12 : -0.12; g.moveTo(x + 0.1, y); g.arc(x, y, 0.1, 0, TAU); }
    g.fill();
  }
  const PARTS = {
    inkPerch: [-1.3, -1.5, 1.3, 3.4, g => bodyInk(g, true)], inkFly: [-1.3, -1.5, 1.3, 3.4, g => bodyInk(g, false)], inkHead: [-0.6, -2.65, 1.35, -0.9, headInk],
    perch: [-1.3, -1.5, 1.3, 3.4, g => bodyPart(g, true, true)], tuck: [-1.3, -1.5, 1.3, 3.4, g => bodyPart(g, true, false)], fly: [-1.3, -1.5, 1.3, 3.4, g => bodyPart(g, false, false)],
    head: [-0.6, -2.65, 1.35, -0.9, headPart], wing: [-0.25, -0.75, 3.25, 0.75, g => wingPart(g, false)], farWing: [-0.25, -0.75, 3.25, 0.75, g => wingPart(g, true)],
    shadow: [-1.2, -2.1, 1.2, 2.1, g => { g.fillStyle = '#000'; oval(g, 0, 0, 1.1, 2); g.fill(); }],
  };
  const partsFull = new Map(), partsHalf = new Map();
  let partsK = 0; // (device px a unit they were drawn for: the bird at 1.12, a touch bigger than it ever flies)
  function layPart(g, name, half) {
    const cache = half ? partsHalf : partsFull, [x0, y0, x1, y1, draw] = PARTS[name];
    let c = cache.get(name);
    if (!c) {
      const k = partsK * (half ? 0.5 : 1);
      c = makeLayer((x1 - x0) * k, (y1 - y0) * k);
      const pg = c.getContext('2d'), sx = c.width / (x1 - x0), sy = c.height / (y1 - y0);
      pg.setTransform(sx, 0, 0, sy, -x0 * sx, -y0 * sy);
      pg.lineJoin = pg.lineCap = 'round';
      draw(pg);
      cache.set(name, c);
    }
    g.drawImage(c, x0, y0, x1 - x0, y1 - y0);
  }
  // Its beak, a chisel (its lower half opening by gape), as a path.
  function beakPath(g, gape) {
    g.beginPath();
    if (!gape) { g.moveTo(1.05, -2.0); g.lineTo(BILL[0], BILL[1]); g.lineTo(1.05, -1.5); g.closePath(); return; }
    g.moveTo(1.05, -2.0); g.lineTo(BILL[0], BILL[1]); g.lineTo(1.05, -1.72); g.closePath();
    const c = Math.cos(gape), s = Math.sin(gape), tx = BILL[0] - 1.05, ty = BILL[1] + 1.72;
    g.moveTo(1.05, -1.72); g.lineTo(1.05 + tx * c - ty * s, -1.72 + tx * s + ty * c); g.lineTo(1.05 + 0.22 * s, -1.72 + 0.22 * c); g.closePath();
  }
  function birdRim(g, cx, cy, rx, ry, a, at) { g.beginPath(); g.ellipse(cx, cy, rx - 0.07, ry - 0.07, a, at - a - 0.7, at - a + 0.7); g.stroke(); } // (a rim inside an oval's edge, round angle at)
  const ghostHead = P => { mThen(TM, BM, 0.25, -1.15, P.turn, 1, 1); mThen(TM, TM, -B_BACK - 0.25, 1.15, 0, 1, 1); }; // (its head drawn back, as it was a moment ago: the blur)
  function drawBird(g, P, half) {
    birdMats(P);
    const sun = P.flip > 0 ? Math.PI * 1.25 - P.rot : Math.PI * 1.75 + P.rot; // (the screen's upper left, in its own frame)
    // Its shadow, on the bark only (on the page beside the board it was a smudge).
    g.save();
    useBase(g); g.beginPath(); g.rect(0, 0, SIZE, SIZE); g.clip();
    mThen(TM, BM, 0.35 + 0.6 * P.air, 0.6 + 0.9 * P.air, 0, 1, 1); useM(g, TM);
    g.globalAlpha = P.alpha * (0.28 - 0.1 * P.air);
    layPart(g, 'shadow', half);
    g.restore();
    g.globalAlpha = P.alpha;
    g.lineJoin = g.lineCap = 'round';
    if (P.wing > 0.02) { wingMat(P, true); useM(g, WM); layPart(g, 'farWing', half); }
    // Its ink, then its colours.
    useM(g, BM); layPart(g, P.feet ? 'inkPerch' : 'inkFly', half);
    g.strokeStyle = BIRD_INK; g.lineWidth = 0.24;
    if (P.blur > 0) { ghostHead(P); g.globalAlpha = P.alpha * 0.4 * P.blur; useM(g, TM); layPart(g, 'inkHead', half); beakPath(g, 0); g.stroke(); g.globalAlpha = P.alpha; }
    useM(g, HM); layPart(g, 'inkHead', half); beakPath(g, P.gape); g.stroke();
    useM(g, BM); layPart(g, P.wing > 0.5 ? 'fly' : P.feet ? 'perch' : 'tuck', half);
    g.strokeStyle = BIRD_RIM; g.lineWidth = 0.11;
    g.beginPath(); // (lit down its tail's sunny side, whichever way it faces)
    if (P.flip > 0) { g.moveTo(-0.33, 1.84); g.lineTo(-0.16, 2.69); } else { g.moveTo(0.08, 1.83); g.lineTo(-0.13, 2.7); }
    g.stroke();
    birdRim(g, -0.1, 0.3, 0.95, 1.55, 0.08, sun);
    if (P.blur > 0) { ghostHead(P); g.globalAlpha = P.alpha * 0.4 * P.blur; useM(g, TM); layPart(g, 'head', half); g.fillStyle = '#71717a'; beakPath(g, 0); g.fill(); g.globalAlpha = P.alpha; }
    useM(g, HM); layPart(g, 'head', half);
    g.strokeStyle = BIRD_RIM; g.lineWidth = 0.11;
    birdRim(g, 0.45, -1.75, 0.72, 0.7, 0, sun - P.turn);
    g.fillStyle = '#71717a'; beakPath(g, P.gape); g.fill(); // (the chisel beak, darker along its top)
    g.fillStyle = '#3f3f46'; g.beginPath(); g.moveTo(1.05, -2.0); g.lineTo(BILL[0], BILL[1]); g.lineTo(1.05, -1.78); g.closePath(); g.fill();
    // Its eye: a pupil turned to what it looks at (the way it looks, turned into its head's frame), with a glint; or shut.
    const c = Math.cos(P.rot), s = Math.sin(P.rot), x1 = (bird.gx * c + bird.gy * s) * P.flip, y1 = -bird.gx * s + bird.gy * c;
    const ct = Math.cos(P.turn), st = Math.sin(P.turn), ex = x1 * ct + y1 * st, ey = -x1 * st + y1 * ct;
    g.fillStyle = '#fffbea';
    if (P.blink) { oval(g, 0.75, -1.9, 0.21, 0.05); g.fill(); }
    else {
      oval(g, 0.75, -1.9, 0.21, 0.21); g.fill();
      const px = 0.75 + ex * 0.094, py = -1.9 + ey * 0.094;
      g.fillStyle = '#0a0a0a'; oval(g, px, py, 0.1, 0.1); g.fill();
      g.fillStyle = '#ffffff'; oval(g, px + 0.035, py - 0.035, 0.035, 0.035); g.fill();
    }
    if (P.wing > 0.02) {
      wingMat(P, false); useM(g, WM); layPart(g, 'wing', half);
      g.strokeStyle = BIRD_RIM; g.lineWidth = 0.11;
      birdRim(g, 1.5, 0, 1.6, 0.55, 0, sun - (Math.PI / 2 + Math.PI / 2 * P.stroke + P.sweep));
    }
    g.globalAlpha = 1;
  }

  // On its chunk, drumming: a dent where its beak strikes, deeper blow by
  // blow, with splits running from it along the grain and across (the
  // mark's own cracks are the board's: this is the bird's work), gone once
  // the strike has made it a hole (the board draws the hole), and none over
  // a body lying there; and chips flying off each blow and falling (not
  // with reduced motion).
  function drawDent(g, A, done) {
    const sx = A.spot % GRID, sy = (A.spot - sx) / GRID;
    for (const s of game.snakes) if (s.alive) for (const c of s.body) if (c.x === sx && c.y === sy) return;
    const f = done / A.times.length, r = CELL * (0.07 + 0.15 * f);
    useBase(g);
    g.fillStyle = 'rgba(20,10,4,0.85)';
    oval(g, A.tx, A.ty, r, r * 0.82); g.fill();
    g.strokeStyle = 'rgba(20,10,4,0.8)'; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath();
    for (let m = 0; m < 4; m++) {
      const a = (m === 0 ? -Math.PI / 2 : m === 1 ? Math.PI / 2 : m === 2 ? 0.4 : Math.PI + 0.4) + (hash01(A.spot * 13 + m) - 0.5) * 0.6, l = r * (1.1 + (m < 2 ? 1.6 : 0.8) * f);
      g.moveTo(A.tx + Math.cos(a) * r * 0.7, A.ty + Math.sin(a) * r * 0.7); g.lineTo(A.tx + Math.cos(a) * l, A.ty + Math.sin(a) * l);
    }
    g.stroke();
    g.fillStyle = 'rgba(254,243,199,0.65)'; // (a fleck of pale wood on its far side, where the light falls in)
    oval(g, A.tx + r * 0.35, A.ty + r * 0.3, r * 0.35, r * 0.3); g.fill();
  }
  const CHIP_COLS = ['#e9cf9c', '#5a3b22'];
  function drawChips(g, A, t) {
    useBase(g);
    const up = -Math.PI / 2 - 0.6 * A.drum.flip; // (up and back toward the bird, out of the hole)
    for (let c = 0; c < 2; c++) {
      g.fillStyle = CHIP_COLS[c];
      for (let i = 0; i < A.times.length; i++) {
        const age = t - A.times[i];
        if (age < 0) break;
        if (age >= B_CHIPS) continue;
        g.globalAlpha = 1 - age / B_CHIPS;
        for (let j = c; j < 4; j += 2) {
          const h = A.strikeAt * 7919 + i * 31 + j * 7, a = up + (hash01(h) - 0.5) * 2.2, v = 0.16 + 0.26 * hash01(h + 1), sz = 2.6 + 3 * hash01(h + 2);
          const x = A.tx + Math.cos(a) * v * age, y = A.ty + Math.sin(a) * v * age + 0.0011 * age * age;
          if (x - sz < room.x0 || x + sz > room.x1 || y - sz < room.y0 || y + sz > room.y1) continue;
          g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        }
      }
    }
    g.globalAlpha = 1;
  }
  function hash01(n) {
    let h = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function drawWoodpecker(alpha, now, dt) {
    const w = game.woodpecker;
    if (!w || !birdLayer) {
      if (birdShown) { birdLayer.style.display = 'none'; birdShown = false; }
      return;
    }
    if (!birdShown) { birdLayer.style.display = 'block'; birdShown = true; resetBird(now); }
    if (!boardRect.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, quality === 2 ? 2 : quality === 1 ? 1.5 : 1);
    if (placeLayer(dpr)) bird.clear = true;
    const g = birdG;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (bird.clear) g.clearRect(0, 0, lay.W, lay.H);
    else if (bird.drawn) g.clearRect(bird.box[0], bird.box[1], bird.box[2], bird.box[3]);
    bird.clear = bird.drawn = false;
    const k = lay.sc * BU * 1.12;
    if (Math.abs(k - partsK) > partsK * 0.01) { partsK = k; partsFull.clear(); partsHalf.clear(); }
    birdRoom();
    const P = pose;
    P.tp = game.tick - 1 + alpha;
    posture(w, P.tp, now);
    headAndEye(P, now, dt);
    fitBird(P);
    // Where it's drawn, to clear next frame: all of it, its shadow, its chips.
    birdBox(P);
    const e = 3.6 * BU * P.s; // (its shadow, cast down and to the right of it, however it's tipped)
    let x0 = box.x0 - e, y0 = box.y0 - e, x1 = box.x1 + e, y1 = box.y1 + e;
    if (P.drum) {
      const A = P.drum;
      if (P.blows > 0) drawDent(g, A, P.blows);
      if (!reduced) drawChips(g, A, P.t);
      x0 = Math.min(x0, A.tx - 5 * CELL); x1 = Math.max(x1, A.tx + 5 * CELL); y0 = Math.min(y0, A.ty - 5 * CELL); y1 = Math.max(y1, A.ty + 5 * CELL); // (as far as its chips fly)
    }
    drawBird(g, P, lay.sc * BU * P.s < partsK * 0.55);
    overBird(g, w, alpha, now);
    const bx = Math.max(0, Math.floor(lay.ox + x0 * lay.sc) - 2), by = Math.max(0, Math.floor(lay.oy + y0 * lay.sc) - 2);
    bird.box[0] = bx; bird.box[1] = by;
    bird.box[2] = Math.max(0, Math.min(lay.W, Math.ceil(lay.ox + x1 * lay.sc) + 2) - bx); bird.box[3] = Math.max(0, Math.min(lay.H, Math.ceil(lay.oy + y1 * lay.sc) + 2) - by);
    bird.drawn = true;
  }
  // A promise is never hidden by the bird: where it's over a ring (the food
  // in its mark will land there) or over a piece in the air, knocked out of
  // the patch or spat, that's drawn again over it, on its own pixels only
  // (so nothing is drawn twice where it isn't), moved with the board as it
  // shakes. The bird still covers the food in its mark, lying where its
  // beak is at work: the rings say where that goes.
  let overOn = true; // (off only for the tests, to see it against the bird without)
  function overBird(g, w, alpha, now) {
    if (!overOn) return;
    const rings = w.target.length > 0 && knockCells(w).length > 0;
    let flying = false;
    if (!reduced) for (const f of game.food) { const b = f.kind !== 'beetle' && born.get(f.y * GRID + f.x); if (b && b.spat && b.movedAt && now - b.movedAt < b.fly) { flying = true; break; } }
    if (!rings && !flying) return;
    useBase(g);
    g.translate(shakeX / k, shakeY / k);
    g.globalCompositeOperation = 'source-atop';
    if (rings) knockRings(w, aimed(alpha), now, g);
    if (flying) { const was = ctx; ctx = g; try { drawTossed(now); } finally { ctx = was; } }
    g.globalCompositeOperation = 'source-over';
  }
  // When it lands back on its perch after its last strike, ms after it, as
  // drawn (the game says "kik!" then); Infinity if it isn't on its way back.
  const birdHome = () => (game?.woodpecker && game.woodpecker.struckAt >= 0 && home.struckAt === game.woodpecker.struckAt ? home.total : Infinity);

  // On the board: the chunk it's eyeing glows and cracks, the pulse quickening
  // as the strike nears, and its pecks dent the rim. It's traced with the
  // outline its pit will have, and all of it lies on the bark, under the
  // snakes: a body lying over it bridges the hole to come (only a head on
  // the ground in it falls in), so nothing is drawn across a body.
  const markSprite = () => sprite('mark', '', drawMark);
  const drawMark = g => {
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, CELL * 0.85);
    grad.addColorStop(0, 'rgba(239,68,68,0.55)');
    grad.addColorStop(0.55, 'rgba(220,38,38,0.3)');
    grad.addColorStop(1, 'rgba(220,38,38,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(0, 0, CELL * 0.85, 0, TAU); g.fill();
  };
  // How far through its aim it is (0..1), or -1 if it isn't aiming.
  function aimed(alpha) {
    const w = game.woodpecker;
    if (!w || !w.target.length) return -1;
    return Math.max(0, Math.min(1, 1 - (w.strikeAt - (game.tick - 1 + alpha)) / T.PECK_AIM_TICKS));
  }
  function drawPatch(alpha, now) {
    const prog = aimed(alpha), w = game.woodpecker;
    if (prog < 0) return;
    const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now * (0.008 + 0.03 * prog));
    // A red glow welling up through the chunk (soft, cell by cell, so it runs together)...
    ctx.globalAlpha = 0.45 + 0.45 * pulse * (0.4 + prog * 0.6);
    const w2 = SPRITE * CELL * 0.95;
    for (const k of w.target) ctx.drawImage(markSprite(), (k % GRID) * CELL + CELL / 2 - w2 / 2, Math.floor(k / GRID) * CELL + CELL / 2 - w2 / 2, w2, w2);
    ctx.globalAlpha = 1;
    // ...a darker inside, and a pale rim round it (inked, so it shows on pale
    // snakes), bolder and brighter as the strike nears: to colour-blind eyes
    // the red is olive on olive bark, but the dark patch and its rim still
    // read. The rim is its pit's torn lip to come, just inside the patch's
    // edge, wobbling as the lip will, its corners well rounded (a straight
    // piece along every cell's edge, meeting square at every notch, or a thin
    // even line with small corners, read as a computer's selection box). (It
    // used to close in from outside, over cells it wouldn't take.)
    outlinePatch(w);
    const line = 3.6 + 2.2 * prog, half = line / 2;
    ctx.globalAlpha = 0.45 + 0.4 * prog;
    ctx.fillStyle = 'rgba(20,8,2,0.4)';
    ctx.beginPath();
    patchPath(0, MARK_R + half, Math.max(0, PATCH_R_IN - half), MARK_TEAR); // (out to the rim's own outer edge)
    ctx.fill();
    // Cracks spreading from each cell's middle along the grain, as wood
    // splits (faded in as they start, or they're specks), lit along their far
    // lip like a burrow's...
    if (prog > 0) {
      ctx.globalAlpha = Math.min(1, prog * 5);
      ctx.lineCap = ctx.lineJoin = 'round';
      for (const [col, off, lw] of CRACK_LINES) {
        ctx.strokeStyle = col;
        for (let part = 0; part < 2; part++) { // (tapering: from the middle, then on to the tip)
          ctx.lineWidth = lw * (part ? 0.55 : 0.9);
          ctx.beginPath();
          for (let i = 0; i < markN; i++) {
            const x = markCX[i] + off, y = markCY[i] + off;
            for (let p = 8 * i; p < 8 * i + 8; p += 4) {
              if (part) { ctx.moveTo(x + markCr[p] * prog, y + markCr[p + 1] * prog); ctx.lineTo(x + markCr[p + 2] * prog, y + markCr[p + 3] * prog); }
              else { ctx.moveTo(x, y); ctx.lineTo(x + markCr[p] * prog, y + markCr[p + 1] * prog); }
            }
          }
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    patchPath(half, MARK_R, PATCH_R_IN, MARK_TEAR);
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20,8,2,0.75)';
    ctx.lineWidth = line;
    ctx.stroke();
    ctx.strokeStyle = rgba('#fef3c7', 0.75 + 0.25 * prog);
    ctx.lineWidth = 1.6 + 1.6 * prog;
    ctx.stroke();
    // ...and its pecks, nicks bitten into the rim from outside, more and more
    // as the strike nears, first and thickest where the bird is at it.
    const dents = Math.floor(prog * dentN);
    if (dents) {
      ctx.fillStyle = '#140a04';
      ctx.beginPath();
      for (let n = 0; n < dents; n++) { const d = dentOrder[n]; ctx.moveTo(dentX[d] + dentR[d], dentY[d]); ctx.arc(dentX[d], dentY[d], dentR[d], 0, TAU); }
      ctx.fill();
      ctx.fillStyle = 'rgba(254,243,199,0.7)'; // (a fleck of pale wood on each one's far side, where the light falls in)
      ctx.beginPath();
      for (let n = 0; n < dents; n++) { const d = dentOrder[n], rr = dentR[d], x = dentX[d] + rr * 0.45, y = dentY[d] + rr * 0.45; ctx.moveTo(x + rr * 0.4, y); ctx.arc(x, y, rr * 0.4, 0, TAU); }
      ctx.fill();
    }
    knockRings(w, prog, now); // (and where the food in it will be knocked to)
  }
  // The patch's outline, traced once each time it changes (see traceCells),
  // kept as its corners, loop by loop (round the outside, and round any cell
  // it encloses), in cells, with the ways in and out of each; and with it,
  // each cell's cracks and the dents round the rim.
  const PATCH_R = 7, PATCH_R_IN = 3, PIT_PUSH = 14; // (how round its pit's corners are, and its notches, in units; how far it runs on under the frame at the board's edge)
  const MARK_R = 11, MARK_TEAR = 1.1; // (how round the mark's own corners are, and how far its rim wobbles, in units)
  const DENT_R = 2.1, DENT_EVERY = 12; // (a dent's size, give or take a third, and about how far apart they come round the rim, in units)
  const patch = new Uint8Array(N2); // (the patch's cells, marked while it's traced)
  const patchWas = new Int16Array(N2); // (the cells it was traced for)
  const pGX = new Int8Array(4 * N2), pGY = new Int8Array(4 * N2), pIn = new Int8Array(4 * N2), pOut = new Int8Array(4 * N2), pLoopEnd = new Int32Array(N2);
  const DIRX = [1, 0, -1, 0], DIRY = [0, 1, 0, -1], dirOf = (dx, dy) => dx > 0 ? 0 : dy > 0 ? 1 : dx < 0 ? 2 : 3;
  const markCX = new Float32Array(N2), markCY = new Float32Array(N2), markCr = new Float32Array(8 * N2);
  const dentX = new Float32Array(4 * N2), dentY = new Float32Array(4 * N2), dentR = new Float32Array(4 * N2), dentAt = new Float32Array(4 * N2), dentOrder = new Int16Array(4 * N2);
  let patchWasN = -1, pLoops = 0, markN = 0, dentN = 0;
  function outlinePatch(w) {
    const target = w.target;
    let same = target.length === patchWasN;
    for (let i = 0; same && i < target.length; i++) same = patchWas[i] === target[i];
    if (same) return;
    patchWasN = target.length;
    patch.fill(0);
    for (let i = 0; i < target.length; i++) { patchWas[i] = target[i]; patch[target[i]] = 1; }
    traceCells(patch);
    let nc = 0;
    for (let l = 0; l < tLoops; l++) {
      const a = tAt[l], n = tAt[l + 1] - a;
      for (let j = 0; j < n; j++) {
        const p = a + (j + n - 1) % n, i = a + j, q = a + (j + 1) % n;
        const ax = tX[i] - tX[p], ay = tY[i] - tY[p], bx = tX[q] - tX[i], by = tY[q] - tY[i];
        if (ax === bx && ay === by) continue;
        pGX[nc] = tX[i]; pGY[nc] = tY[i]; pIn[nc] = dirOf(ax, ay); pOut[nc] = dirOf(bx, by); nc++;
      }
      pLoopEnd[l] = nc;
    }
    pLoops = tLoops;
    // Each cell's cracks: one up the log, one down, wandering a little off the grain.
    markN = target.length;
    for (let i = 0; i < markN; i++) {
      const key = target[i], x = key % GRID, y = (key - x) / GRID;
      markCX[i] = x * CELL + CELL / 2; markCY[i] = y * CELL + CELL / 2;
      for (let c = 0; c < 2; c++) {
        const base = c ? Math.PI / 2 : -Math.PI / 2, a1 = base + (noise(key, c, 11) - 0.5) * 0.7, a2 = a1 + (noise(key, c, 12) - 0.5) * 0.7;
        const l1 = CELL * (0.16 + 0.08 * noise(key, c, 13)), l2 = l1 + CELL * (0.12 + 0.1 * noise(key, c, 14)), p = 8 * i + 4 * c;
        markCr[p] = Math.cos(a1) * l1; markCr[p + 1] = Math.sin(a1) * l1;
        markCr[p + 2] = markCr[p] + Math.cos(a2) * (l2 - l1); markCr[p + 3] = markCr[p + 1] + Math.sin(a2) * (l2 - l1);
      }
    }
    // The dents: nicks round the rim (on the board), each its own size and
    // unevenly spaced (dots evenly spaced on the rim read as a dotted
    // selection box), set out past the rim's line so it stays whole, closer
    // together near where the bird pecks, and coming there first.
    dentN = 0;
    const inset = 2.6, bx = (w.x + 0.5) * CELL, by = (w.y + 0.5) * CELL;
    for (let l = 0, i0 = 0; l < pLoops; i0 = pLoopEnd[l++]) {
      const m = pLoopEnd[l] - i0;
      for (let j = 0; j < m; j++) {
        const c0 = i0 + j, c1 = i0 + (j + 1) % m;
        const x0 = cornerX(c0, inset, PIT_PUSH), y0 = cornerY(c0, inset, PIT_PUSH), x1 = cornerX(c1, inset, PIT_PUSH), y1 = cornerY(c1, inset, PIT_PUSH);
        const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
        for (let d = MARK_R * 0.7 + DENT_EVERY * noise(pGX[c0], pGY[c0], 24); d < len - MARK_R * 0.7;) {
          const x = x0 + ux * d, y = y0 + uy * d, near = Math.hypot(x - bx, y - by) / CELL, at = Math.round(x) * 977 + Math.round(y);
          const rr = DENT_R * (0.67 + 0.66 * noise(at, 1, 23));
          d += DENT_EVERY * (0.6 + noise(at, 2, 23)) * (near < 1.6 ? 0.65 : 1);
          if (x < 2 || y < 2 || x > SIZE - 2 || y > SIZE - 2) continue;
          dentX[dentN] = x + uy * rr * 0.6; dentY[dentN] = y - ux * rr * 0.6; dentR[dentN] = rr; // (out, away from its cells)
          dentAt[dentN] = near + 1.5 * noise(at, 3, 23); dentOrder[dentN] = dentN; dentN++;
        }
      }
    }
    dentOrder.subarray(0, dentN).sort((p, q) => dentAt[p] - dentAt[q]);
  }
  // Corner c of the traced patch, `inset` units in toward it (pushed on
  // under the frame at the board's edge, as its pit will be).
  function cornerX(c, inset, push) {
    const x = pGX[c] * CELL - inset * (DIRY[pIn[c]] + DIRY[pOut[c]]);
    return pGX[c] === 0 ? x - push : pGX[c] === GRID ? x + push : x;
  }
  function cornerY(c, inset, push) {
    const y = pGY[c] * CELL + inset * (DIRX[pIn[c]] + DIRX[pOut[c]]);
    return pGY[c] === 0 ? y - push : pGY[c] === GRID ? y + push : y;
  }
  // The traced outline, added to the current path: `inset` units inside the
  // patch, its corners rounded by `outer` and its notches by `inner`, its
  // straight runs wobbling out by up to `tear` as its pit's lip will (see
  // raggedPath: the same wobble, seeded by where it is).
  function patchPath(inset, outer, inner, tear = 0) {
    for (let l = 0, i0 = 0; l < pLoops; i0 = pLoopEnd[l++]) {
      const m = pLoopEnd[l] - i0;
      if (m < 4) continue;
      for (let j = 0; j < m; j++) {
        const c = i0 + j;
        qx[j] = cornerX(c, inset, PIT_PUSH); qy[j] = cornerY(c, inset, PIT_PUSH);
        qr[j] = DIRX[pIn[c]] * DIRY[pOut[c]] - DIRY[pIn[c]] * DIRX[pOut[c]] > 0 ? outer : inner; // (a right turn: a corner of the patch; a left one: a notch)
        qdx[j] = DIRX[pOut[c]]; qdy[j] = DIRY[pOut[c]]; qgx[j] = pGX[c] * CELL; qgy[j] = pGY[c] * CELL;
      }
      if (tear) raggedPath(ctx, m, tear, 1, 1); else cornersPath(ctx, m);
    }
  }

  // Holes are pits in the log, one per hollow (holes side by side run
  // together), traced along the cell edges, so a hole's edge is its cell's
  // edge: a torn lip of fresh pale wood, inked; a dark floor, and its far
  // wall (lower right) lit from the upper left, like everything else on the
  // board, the grain showing in it; splinters over the rim and sawdust
  // round it; and at the board's edge, a notch bitten out of the log (its
  // outline runs on under the frame). (One round dark disc a cell read as
  // bubble wrap.) They're on the static layer, under everything: a body
  // lying across a hole bridges it, and is drawn over it. Every wobble,
  // splinter and speck is seeded by where it is, so a piece painted again
  // matches what's beside it, and a strike paints again only the box round
  // its new holes (see paintStatic).
  const PIT_LIP = 1, PIT_RIM = 3.5; // (how far the lip reaches out over the bark, and the pit's edge in from the cell's, in units)
  const holeMask = new Uint8Array(N2);
  // A number 0..1 for a place and a salt, the same every time.
  function noise(x, y, salt) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1103515245);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // Draw any holes added since last time onto the static layer (a Set keeps
  // insertion order, so new holes are always at the end): the box round
  // them, a cell more (where a hollow widens, its old lip goes), painted again.
  function syncHoles() {
    if (!game || !staticLayer || game.holes.size === holesDrawn) return;
    if (game.holes.size < holesDrawn) resetStatic();
    let x0 = GRID, y0 = GRID, x1 = -1, y1 = -1, i = 0;
    for (const key of game.holes) {
      if (i++ < holesDrawn) continue;
      holeMask[key] = 1;
      const x = key % GRID, y = (key - x) / GRID;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    holesDrawn = game.holes.size;
    paintStatic(x0 - 1, y0 - 1, x1 + 1, y1 + 1);
  }
  // Paint the static layer again over cells cx0..cx1, cy0..cy1, in its
  // order: the bark, the scorch marks drawn so far, the pits.
  function paintStatic(cx0, cy0, cx1, cy1) {
    cx0 = Math.max(0, cx0); cy0 = Math.max(0, cy0); cx1 = Math.min(GRID - 1, cx1); cy1 = Math.min(GRID - 1, cy1);
    if (cx1 < cx0 || cy1 < cy0) return;
    const g = staticLayer.getContext('2d');
    const X0 = Math.floor(cx0 * CELL * k), Y0 = Math.floor(cy0 * CELL * k);
    const X1 = cx1 === GRID - 1 ? staticLayer.width : Math.ceil((cx1 + 1) * CELL * k), Y1 = cy1 === GRID - 1 ? staticLayer.height : Math.ceil((cy1 + 1) * CELL * k);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.beginPath(); g.rect(X0, Y0, X1 - X0, Y1 - Y0); g.clip();
    g.drawImage(barkLayer, X0, Y0, X1 - X0, Y1 - Y0, X0, Y0, X1 - X0, Y1 - Y0);
    g.setTransform(k, 0, 0, k, 0, 0);
    drawScorch(g, cx0, cy0, cx1, cy1);
    drawPits(g, holeMask, cx0 - 1, cy0 - 1, cx1 + 1, cy1 + 1);
    g.restore();
  }
  // The pits of the holes in m that reach cells bx0..bx1, by0..by1, on g (in
  // the board's units). Only the holes within a cell of those are traced (a
  // hollow's far reaches change nothing near them, and where the window cuts
  // a hollow, what's drawn stays outside the box being painted): a strike
  // late in sudden death traces a corner of a big hollow, not all of it.
  const pitWindow = new Uint8Array(N2);
  function drawPits(g, m, bx0, by0, bx1, by1) {
    pitWindow.fill(0);
    for (let y = Math.max(0, by0 - 1); y <= Math.min(GRID - 1, by1 + 1); y++) {
      for (let x = Math.max(0, bx0 - 1); x <= Math.min(GRID - 1, bx1 + 1); x++) pitWindow[y * GRID + x] = m[y * GRID + x];
    }
    traceCells(pitWindow);
    const lipInk = new Path2D(), lip = new Path2D(), pitInk = new Path2D(), pit = new Path2D(), deep = new Path2D(), grain = new Path2D();
    const dust = [new Path2D(), new Path2D()], spl = [new Path2D(), new Path2D()];
    let any = false;
    for (let l = 0; l < tLoops; l++) {
      const a = tAt[l], end = tAt[l + 1];
      let x0 = GRID, y0 = GRID, x1 = 0, y1 = 0;
      for (let j = a; j < end; j++) { x0 = Math.min(x0, tX[j]); x1 = Math.max(x1, tX[j]); y0 = Math.min(y0, tY[j]); y1 = Math.max(y1, tY[j]); }
      if (x1 <= bx0 || x0 > bx1 + 1 || y1 <= by0 || y0 > by1 + 1) continue; // (its grid points' box against the cells')
      any = true;
      // (each line a fill a little bigger than what's filled over it, not a
      // stroke: a stroke of a long torn edge is several fills' work)
      raggedPath(lipInk, cornersOf(l, -PIT_LIP - 0.8, 9.8, 4.2, PIT_PUSH), 0.9, 1, 1);
      raggedPath(lip, cornersOf(l, -PIT_LIP, 9, 5, PIT_PUSH), 0.9, 1, 1);
      raggedPath(pitInk, cornersOf(l, PIT_RIM - 0.9, PATCH_R + 0.9, PATCH_R_IN - 0.9, PIT_PUSH), 1.4, -1, 2);
      raggedPath(pit, cornersOf(l, PIT_RIM + 0.9, PATCH_R - 0.9, PATCH_R_IN + 0.9, PIT_PUSH), 1.4, -1, 2);
      cornersPath(deep, cornersOf(l, PIT_RIM + 2, PATCH_R, PATCH_R_IN, PIT_PUSH));
      for (let j = a; j < end; j++) sideBits(j, a, end, dust, spl);
    }
    if (!any) return;
    for (let y = Math.max(0, by0); y <= Math.min(GRID - 1, by1); y++) {
      for (let x = Math.max(0, bx0); x <= Math.min(GRID - 1, bx1); x++) {
        const key = y * GRID + x;
        if (!m[key]) continue;
        for (let n = 0; n < 4; n++) grain.rect(x * CELL + 4 + noise(key, n, 3) * 24, y * CELL, 0.8, CELL); // (the grain, down the far wall)
      }
    }
    g.lineJoin = 'round';
    g.fillStyle = 'rgba(226,190,136,0.7)'; g.fill(dust[0]);
    g.fillStyle = 'rgba(176,124,70,0.75)'; g.fill(dust[1]);
    g.fillStyle = 'rgba(28,14,5,0.5)'; g.fill(lipInk);
    g.fillStyle = '#9a683a'; g.fill(lip);
    g.fillStyle = '#140a04'; g.fill(pitInk);
    g.save();
    g.fillStyle = '#5c3a1f'; g.fill(pit); // (the far wall...)
    g.clip(pit);
    g.translate(-4.5, -5.5);
    g.fillStyle = '#2a170a'; g.fill(pit); // (...shaded but where the light falls in from the upper left...)
    g.translate(-3, -3);
    g.fillStyle = '#0f0804'; g.fill(deep); // (...and the dark floor)
    g.translate(7.5, 8.5);
    g.fillStyle = 'rgba(30,15,5,0.35)'; g.fill(grain);
    g.restore();
    g.fillStyle = '#b58350'; g.fill(spl[0]);
    g.fillStyle = '#7e522c'; g.fill(spl[1]);
  }
  // The corners at hand (from cornersOf) as a torn edge on p: each corner
  // rounded in a few straight pieces, each straight run wobbling out (sgn
  // 1, away from the cells) or in (-1) by up to amp, sampled every 3 units
  // at fixed places on the board, so a run wobbles alike wherever it starts
  // (and alike at any inset: an outline and its ink keep together).
  function raggedPath(p, m, amp, sgn, salt) {
    if (m < 4) return;
    for (let j = 0; j < m; j++) {
      const pj = (j + m - 1) % m, ix = qdx[pj], iy = qdy[pj], ox = qdx[j], oy = qdy[j], r = qr[j];
      const ax = qx[j] - ix * r, ay = qy[j] - iy * r, bx = qx[j] + ox * r, by = qy[j] + oy * r;
      for (let s = 0; s <= 4; s++) {
        const t = s / 4, u = 1 - t, x = u * u * ax + 2 * u * t * qx[j] + t * t * bx, y = u * u * ay + 2 * u * t * qy[j] + t * t * by;
        if (j || s) p.lineTo(x, y); else p.moveTo(x, y);
      }
      const nj = (j + 1) % m, ex = qx[nj] - ox * qr[nj], ey = qy[nj] - oy * qr[nj], nx = oy * sgn, ny = -ox * sgn;
      const from = ox ? bx : by, to = ox ? ex : ey, step = 3 * (ox || oy);
      for (let v = (step > 0 ? Math.floor(from / 3) + 1 : Math.ceil(from / 3) - 1) * 3; step > 0 ? v < to - 1 : v > to + 1; v += step) {
        const x = ox ? v : bx, y = ox ? by : v, at = Math.round(v * 2), on = ox ? qgy[j] : qgx[j], w = amp * noise(at, on, salt) * (noise(at, on, salt + 5) < 0.2 ? 2 : 1);
        p.lineTo(x + nx * w, y + ny * w);
      }
    }
    p.closePath();
  }
  // A traced side's sawdust on the bark and splinters over the rim (none
  // along the board's edge, and none in a rounded corner), seeded by the side.
  function sideBits(j, a, end, dust, spl) {
    const e = tSide[j], i = e >> 2, sd = e & 3, cx = i % GRID, cy = (i - cx) / GRID, nx = NX[sd], ny = NY[sd];
    if (cx + nx < 0 || cy + ny < 0 || cx + nx >= GRID || cy + ny >= GRID) return;
    const q = j + 1 < end ? j + 1 : a, pr = j > a ? j - 1 : end - 1, n2 = q + 1 < end ? q + 1 : a;
    const sx = tX[j] * CELL, sy = tY[j] * CELL, dx = tX[q] - tX[j], dy = tY[q] - tY[j];
    const lo = tX[j] - tX[pr] !== dx || tY[j] - tY[pr] !== dy ? 7 : 0, hi = tX[n2] - tX[q] !== dx || tY[n2] - tY[q] !== dy ? CELL - 7 : CELL; // (clear of a rounded corner at either end)
    for (let s = 0; s < 6; s++) { // sawdust, on the bark just past the lip
      const along = 2.5 + s * 5.4 + (noise(e, s, 6) - 0.5) * 3;
      if (along < lo || along > hi || noise(e, s, 7) < 0.45) continue;
      const out = PIT_LIP + 2 + noise(e, s, 8) * 6, r = 0.6 + noise(e, s, 9) * 1.1, x = sx + dx * along + nx * out, y = sy + dy * along + ny * out;
      const p = dust[noise(e, s, 10) < 0.5 ? 0 : 1]; // (a chip: four corners, cheaper to fill than a round speck, and a speck that size looks no different)
      p.moveTo(x + r, y); p.lineTo(x, y + r); p.lineTo(x - r, y); p.lineTo(x, y - r); p.closePath();
    }
    const across = sd === 0 || sd === 2, slots = across ? 4 : 2; // (torn across the grain, the top and bottom edges splinter most)
    for (let s = 0; s < slots; s++) {
      if (noise(e, s, 16) < (across ? 0.2 : 0.4)) continue;
      const along = (s + 0.5) * CELL / slots + (noise(e, s, 17) - 0.5) * (CELL / slots - 4);
      if (along < lo + 1 || along > hi - 1) continue;
      const lift = noise(e, s, 18) < 0.25 ? -1 : 1; // (a quarter lift outward, onto the lip)
      const len = (across ? 2.5 + noise(e, s, 19) * 4.5 : 1.2 + noise(e, s, 19) * 2) * (lift < 0 ? 0.7 : 1), w = 0.7 + noise(e, s, 20) * 0.9, bend = (noise(e, s, 21) - 0.5) * 2.4;
      const bx = sx + dx * along - nx * (PIT_RIM - 0.5), by = sy + dy * along - ny * (PIT_RIM - 0.5);
      const tx = bx - nx * len * lift + dx * bend, ty = by - ny * len * lift + dy * bend;
      const p = spl[noise(e, s, 22) < 0.6 ? 0 : 1];
      p.moveTo(bx - dx * w, by - dy * w); p.lineTo(tx, ty); p.lineTo(bx + dx * w, by + dy * w); p.closePath();
    }
  }

  // ------------------------------------------------------------ the frame

  let shakeUntil = 0, shakePx = 0, lastNow = 0;
  // The game's clock as drawn. game.time only moves on a tick, so it's eased
  // from the last tick's time to this one's, as the bodies are: whatever
  // fills or fades with it (your leap's arc, a wrap's gold) moves every
  // frame, not ten steps a second.
  let timeFrom = 0, timeAt = 0, shownTime = 0;

  // alpha: how far the current tick has played out (0..1).
  function frame(alpha, now) {
    if (!game || !sized) return;
    lastDrawAt = performance.now(); // (the next round's log waits until nothing's drawn)
    if (!staticLayer) resetStatic();
    const dt = lastNow ? Math.min(64, Math.max(0, now - lastNow)) : 16; // (never backwards: a clock a hair behind another)
    lastNow = now;
    frameDt = Math.max(1, dt);
    shownTime = game.time === timeAt ? timeFrom + (timeAt - timeFrom) * Math.min(1, alpha) : game.time;
    leadNow = game.tick === 0 && alpha >= 1 ? 0 : leadTicks; // (drawn ahead from the round's Go: see prepare)
    let alive = 0;
    for (const s of game.snakes) if (s.alive) alive++;
    leadRest = alive < 2;
    syncHoles();
    trackFire(now);
    syncScorch();
    easeSky(dt);
    if (deaths.length || corpses.length) updateCorpses(now);

    let sx = 0, sy = 0;
    if (!reduced && now < shakeUntil) {
      const t = (shakeUntil - now) / T.SHAKE_MS;
      sx = Math.round((Math.random() * 2 - 1) * shakePx * t * k);
      sy = Math.round((Math.random() * 2 - 1) * shakePx * t * k);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = BARK; // the bark shifts, so fill the sliver it uncovers
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    shakeX = sx; shakeY = sy;
    ctx.setTransform(1, 0, 0, 1, sx, sy);
    ctx.drawImage(staticLayer, 0, 0);
    ctx.setTransform(k, 0, 0, k, sx, sy);
    drawCanopy(now);
    drawSnowCover(); // (drifts lie on the bark, under everything on it)

    drawFields(now); // (Sovereign's and Colonist's land, its borders and flags)

    drawBurrows(now);
    drawPatch(alpha, now); // (the woodpecker's next patch, on the bark under the snakes)
    drawLeaves(now, dt);
    drawFood(alpha, now);
    drawDive(now);
    drawFire(alpha, now);
    drawSkyTint();
    drawStrikes(alpha, now); // (lightning on its way: over the gloom)
    drawRainbow(now);

    if (corpses.length) drawCorpses(alpha, now);
    drawWrapEdges(now);
    if (streaks.length) drawStreaks(now); // (under the snakes: beside the dasher, never through it)
    drawSnakes(alpha, now); // (and the fields' light round any rival in them, under its body)
    drawTossed(now); // (a bead spat over a head)
    drawRipples(now);
    drawRefusal(now);
    drawRain(now);
    drawSnow(now);
    drawEmbers(now);
    if (sky.snow > 0.5) breathe(now);
    drawBolt(now);
    drawMotes(dt);
    drawBlasts(now);
    drawParticles(dt);
    drawYou(now);
    drawFloaters(dt);
    drawPress(); // (over the Bonk! a crash puts where you'll press)
    drawFlash(now);
    drawWoodpecker(alpha, now, dt);
  }

  // ------------------------------------------------------------ the world

  // The first seconds of a round: which snake is yours. A bouncing arrow and
  // YOU over your head (under it, heading down or near the top edge), a ring
  // pulsing round it, chevrons marching the way you're heading; friends
  // online get their names. Each screen marks its own snake. It fades once
  // you steer (or a few seconds in): the game says when (showYou).
  let youOn = false, youA = 0;
  function showYou(on) { youOn = !!on; }
  function drawYou(now) {
    youA += ((youOn ? 1 : 0) - youA) * Math.min(1, frameDt / 180);
    if (youA < 0.02 || !game) return;
    const c = CELL, t = reduced ? 0 : now / 1000;
    for (const s of game.snakes) {
      if (!s.alive || s.persona) continue; // (people only)
      const a = anim.get(s);
      if (!a || !a.n) continue;
      const hx = a.pts[0], hy = a.pts[1], mine = s.id === viewerId, col = colorOf(s);
      ctx.globalAlpha = youA;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      const sgn = youSide(s, a, hy);
      if (!mine) { // a friend: the same arrow (a touch smaller), with the name they picked
        marker(hx, hy, sgn, col, s.name, 0.82, t);
        continue;
      }
      // A ring pulsing round your head...
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.strokeStyle = '#fffbea';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(hx, hy, c * (0.75 + 0.15 * pulse), 0, TAU); ctx.stroke();
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // ...chevrons marching the way you're heading...
      ctx.strokeStyle = col;
      ctx.lineWidth = c * 0.09;
      ctx.lineCap = 'round';
      const dx = s.dir.x, dy = s.dir.y;
      for (let i = 1; i <= 3; i++) {
        const along = i + ((t * 2) % 1) - 0.3, f = 1 - (along - 0.7) / 3;
        if (f <= 0) continue;
        const cx = hx + dx * c * along, cy = hy + dy * c * along, w = c * 0.22;
        if (cx < 0 || cy < 0 || cx > SIZE || cy > SIZE) continue;
        ctx.globalAlpha = youA * Math.min(1, f);
        ctx.beginPath();
        ctx.moveTo(cx - dx * w + dy * w, cy - dy * w + dx * w);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx - dx * w - dy * w, cy - dy * w - dx * w);
        ctx.stroke();
      }
      // ...and a bouncing arrow with YOU on it.
      ctx.globalAlpha = youA;
      marker(hx, hy, sgn, col, 'YOU', 1, t);
    }
    ctx.globalAlpha = 1;
  }
  // Which side of its head a snake's arrow goes (-1 over it, 1 under it):
  // over it, unless its own body's there (heading down, as seat 2 starts
  // online: the arrow and YOU covered the very snake they pointed at), and
  // under it then; by an edge, the side with room, body or not. It stays on
  // its side until that side goes wrong, so it doesn't jump about as the
  // snake turns, or as it fades out.
  function youSide(s, a, hy) {
    let sgn = a.youSgn || -1;
    if (s.dir.y === -sgn) sgn = -sgn; // (its neck's on that side)
    if (sgn < 0 ? hy < CELL * 2.6 : hy > SIZE - CELL * 2.6) sgn = -sgn; // (no room for it there)
    return (a.youSgn = sgn);
  }
  // A bouncing arrow over a head (under it, sgn 1: see youSide) with a
  // label in the snake's colour; scale 1 for yours.
  function marker(hx, hy, sgn, col, label, scale, t) {
    const c = CELL * scale;
    const bob = Math.sin(t * 5) * c * 0.18, tip = hy + sgn * (CELL * 0.9 + Math.abs(bob)), aw = c * 0.55, ah = c * 0.6;
    ctx.fillStyle = '#fffbea';
    ctx.strokeStyle = INK;
    ctx.lineWidth = c * 0.07;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, tip);
    ctx.lineTo(hx - aw, tip + sgn * ah);
    ctx.lineTo(hx - aw * 0.42, tip + sgn * ah);
    ctx.lineTo(hx - aw * 0.42, tip + sgn * ah * 1.7);
    ctx.lineTo(hx + aw * 0.42, tip + sgn * ah * 1.7);
    ctx.lineTo(hx + aw * 0.42, tip + sgn * ah);
    ctx.lineTo(hx + aw, tip + sgn * ah);
    ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.font = markerFont(Math.round(c * (label === 'YOU' ? 0.85 : 0.62)));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ly = tip + sgn * (ah * 1.7 + c * 0.6), half = Math.min(SIZE / 2, ctx.measureText(label).width / 2 + 4), lx = Math.min(SIZE - half, Math.max(half, hx));
    ctx.lineWidth = c * 0.16; ctx.strokeStyle = 'rgba(58,38,20,0.9)'; ctx.strokeText(label, lx, ly);
    ctx.fillStyle = col; ctx.fillText(label, lx, ly);
  }
  const markerFonts = new Map(); // size -> font (a size or two: no string built per frame)
  function markerFont(px) {
    let f = markerFonts.get(px);
    if (!f) markerFonts.set(px, f = `700 ${px}px Fredoka, system-ui, sans-serif`);
    return f;
  }

  // A jump or a flash that can't go: a quick inked × on what it couldn't hop
  // (or where it would have gone), in the press's own accent (sky for a
  // jump, ember for a flash), so the press shows as heard, and refused (yours
  // only: it answers your press, as the thunk does). It pops in; with
  // reduced motion it's simply there. Both fade.
  const REFUSE_MS = 320, REFUSE_REACH = CELL * 0.24 + 3.75; // (how far its arms and their ink reach from its middle, once it's popped in)
  const refusal = { x: 0, y: 0, at: -1e9, tick: -1, flash: false };
  function drawRefusal(now) {
    const t = (now - refusal.at) / REFUSE_MS;
    if (t < 0 || t >= 1) return;
    const x = refusal.x, y = refusal.y, d = CELL * 0.24 * (reduced ? 1 : 1 + 0.4 * Math.max(0, 1 - t * 5));
    ctx.globalAlpha = t < 0.6 ? 1 : (1 - t) / 0.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
    ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d);
    ctx.strokeStyle = INK; ctx.lineWidth = 7.5; ctx.stroke();
    ctx.strokeStyle = refusal.flash ? EMBER : SKY; ctx.lineWidth = 3.6; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Call after every tick, with that tick's events: sets off pops, gulps and puffs.
  function onTick(events) {
    if (!game) return;
    const now = lastNow || performance.now(); // the frame clock, like everything else drawn
    if (game.time !== timeAt) { // (the drawn clock eases from the last tick's time to this one's: from a tick ago, not across a jump)
      timeFrom = game.time > timeAt && game.time - timeAt < 1000 ? timeAt : game.time;
      timeAt = game.time;
    }
    if (tickNow) tickEvery += (Math.max(0, Math.min(1000, now - tickNow)) - tickEvery) * 0.3; // (see prebuild)
    tickNow = now;
    for (let i = scurries.length - 1; i >= 0; i--) if (scurries[i].tick < game.tick) scurries.splice(i, 1); // (a tick's own: see drawBeetle)
    for (let i = bugPops.length - 1; i >= 0; i--) if (bugPops[i].tick < game.tick) bugPops.splice(i, 1);
    for (const e of events) {
      if (e.type === 'eat') {
        let x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
        const a = animOf(e.snake, now);
        if (e.kind !== 'mushroom') {
          a.gulps[a.gulpAt] = game.tick - 1; a.gulpAt = (a.gulpAt + 1) % 4;
          // Gobbler (and Capricious in a Gobbler mood) wolfs it down: a big gulp, cheeks puffed.
          const big = lookOf(e.snake) === 'gobbler';
          a.gulpR = big ? T.GOBBLE : T.GULP;
          a.gulpW = big ? T.GOBBLE_LENGTH : T.GULP_LENGTH;
        }
        a.ateAt = now; // every bite: the head squashes and the mouth chews
        x += e.snake.dir.x * CELL * 0.5; // the crumbs fly from the mouth, not over the face
        y += e.snake.dir.y * CELL * 0.5;
        if (e.kind === 'golden') spawn(x, y, T.PARTICLES_EAT + 6, 220, T.PARTICLE_LIFE, 3.2, '#fde68a', '#fbbf24');
        else if (e.kind === 'beetle') spawn(x, y, T.PARTICLES_EAT + (e.gold ? 10 : 4), e.gold ? 240 : 200, T.PARTICLE_LIFE, 3, e.gold ? '#fde68a' : '#059669', e.gold ? '#d4a017' : '#fbbf24'); // emerald and gold, a crunchy catch (a golden one: a burst of Honey, a power's gold)
        else if (e.kind === 'pellet') spawn(x, y, T.PARTICLES_EAT - 4, 150, T.PARTICLE_LIFE * 0.8, 2.6, beadFill(e), '#f6ecd2'); // (the bead's own colour, as it was drawn)
        else if (e.kind === 'mushroom') { // poison: a puff of spores, and it goes queasy green for a moment
          spawn(x, y, T.PARTICLES_EAT - 2, 160, T.PARTICLE_LIFE, 2.6, '#c084fc', '#84cc16');
          a.queasyAt = now;
        }
        else spawn(x, y, T.PARTICLES_EAT, 180, T.PARTICLE_LIFE, 2.8, '#a3e635', '#f6ecd2'); // sprout and parchment: visible on bark and on green snakes alike (gold means a power)
        eatenNow.add(e.y * GRID + e.x);
        if (e.snake.id === viewerId && e.kind !== 'mushroom') floater(e.x * CELL + CELL / 2, Math.max(CELL * 1.3, e.y * CELL - CELL * 0.6), GROWN[e.kind === 'golden' ? T.GOLDEN_GROWTH : e.kind === 'beetle' ? T.BEETLE_GROWTH : e.cooked ? T.COOKED_GROWTH : 1] || '+1');
      } else if (e.type === 'choke') { // gagged on its own bead: a quick puff of its cheeks, and the bead spat aside (then it coughs: see drawCough)
        animOf(e.snake, now).chokeAt = now;
        moveFood(e.x, e.y, e.tx ?? e.x, e.ty ?? e.y, now, true, false, e.snake);
      } else if (e.type === 'nudge') { // food its coughing head reached, nudged aside: it rolls there, or a beetle scurries
        if (e.kind === 'beetle') scurries.push({ x: e.x, y: e.y, tx: e.tx ?? e.x, ty: e.ty ?? e.y, tick: game.tick });
        else moveFood(e.x, e.y, e.tx ?? e.x, e.ty ?? e.y, now, false);
      } else if (e.type === 'knock') { // the woodpecker's strike knocks food out of its patch: it flies to where the rule says, in an arc as high and long as the throw (see knockFly), and a beetle scurries there; with nowhere to go, the bird has it
        const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
        if (e.tx == null || e.ty == null) { eatenNow.add(e.y * GRID + e.x); spawn(x, y, 8, 160, 420, 2.2, e.kind === 'beetle' ? '#059669' : '#c08a4a', '#f6ecd2'); }
        else if (e.kind === 'beetle') scurries.push({ x: e.x, y: e.y, tx: e.tx, ty: e.ty, tick: game.tick });
        else moveFood(e.x, e.y, e.tx, e.ty, now, true, true);
      } else if (e.type === 'death') {
        deaths.push(e.snake); // bursts on the next frame, unless the moment is held
        noteRemains(e.snake, now);
        // A comic-book word where it went down, one that means out (Bonk! is
        // for knocks it survives): KO! if a snake did it, Fwoosh! in the fire,
        // Boom! for a dash with nowhere to go, Crunch! for the rest.
        const k = e.snake.killer, h = e.snake.body[0];
        if (!reduced && e.snake.killerId === viewerId && e.snake.id !== viewerId && e.snake.killer !== 'self') shake(3); // (your kill: you feel it)
        const word = k === 'fire' ? 'Fwoosh!' : e.snake.fatal === 'boom' ? 'Boom!' : k === 'wall' || k === 'self' || e.snake.killerId == null ? 'Crunch!' : 'KO!';
        if (k !== 'hunger') floater(h.x * CELL + CELL / 2, Math.max(CELL * 1.3, h.y * CELL - CELL * 0.2), word);
      } else if (e.type === 'crash') { // a bonk where it hit, the head's lunge, and its tail breaking off as beads
        const s = e.snake, a = animOf(s, now), h = s.body[0];
        a.crashAt = now; a.crashDx = s.dir.x; a.crashDy = s.dir.y;
        if (s.id === viewerId && press.stun < 0) press.dir = null; // (what you'd pressed was for a board that's gone, as the game says)
        // (its tail breaks off as beads in its own markings, last segment last)
        const prev = s.prev || [];
        for (let i = s.body.length; i < s.body.length + e.lost && i < prev.length; i++) {
          const key = prev[i].y * GRID + prev[i].x;
          if (!born.has(key)) born.set(key, { kind: 'pellet', at: now + (i - s.body.length) * RIPPLE_MS, i, next: 0, gen: bornGen, v: beadOf(s, i) });
        }
        const px = (h.x + 0.5 + s.dir.x * 0.5) * CELL, py = (h.y + 0.5 + s.dir.y * 0.5) * CELL;
        const other = e.killerId != null ? game.snakes[e.killerId] : null, col = other ? colorOf(other) : '', bow = other && bowOf(other);
        if (bow) spawnBow(px, py, 12, 220, 480, 2.6, bow); // (a rainbow's in its colours: see burst)
        else if (other && col[0] === '#') spawn(px, py, 12, 220, 480, 2.6, col, '#fffbea');
        else spawn(px, py, 12, 220, 480, 2.6, '#c08a4a', '#3b2412'); // (chips of bark)
        // Bonk! at the point of impact, and your -N over your head, behind
        // it, each kept clear of the stars, a refused leap's × and the edges:
        // - with the stars or the × on the point of impact, or no room there
        //   for the word, Bonk! steps aside (heading up or down, to the
        //   roomier side; heading across, away from the stars);
        // - with no room there to rise and stay on the board, it goes beside
        //   the head instead, a little further out (along the row, heading across);
        // - and a -N the top edge would push down (onto Bonk!, the neck and
        //   the stars, where they read as one word) goes under Bonk!.
        const hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2, dx = s.dir.x, dy = s.dir.y, side = hx < SIZE / 2 ? 1 : -1;
        const stars = starsOff(s), refused = s.id === viewerId && refusal.tick === game.tick, half = floatHalfOf('Bonk!');
        let bx = px + dx * CELL * 0.4, by = py + dy * CELL * 0.4;
        if (dy && (refused || (stars < 0) === (dy < 0))) bx += side * CELL * 1.2;
        else if (dx && (refused || bx < half || bx > SIZE - half)) by += stars < 0 ? CELL : -CELL;
        if (by < FLOAT_TOP || by > FLOAT_LOW) {
          const on = dx && hx + dx * CELL * 1.9 > half && hx + dx * CELL * 1.9 < SIZE - half; // (room on along the row)
          bx = hx + (dx ? (on ? dx : -dx) : side) * CELL * 1.9;
          by = Math.min(FLOAT_LOW, Math.max(FLOAT_TOP, hy));
        }
        floater(bx, by, 'Bonk!');
        if (s.id === viewerId) {
          if (e.lost >= 1 && e.lost <= 3) {
            const under = hy - CELL * 1.9 < FLOAT_TOP;
            floater(under ? bx : hx - dx * CELL * 1.2, under ? by + CELL * 0.85 : hy - CELL * 1.9, '-' + e.lost);
          }
          if (!reduced) shake(4);
        }
      } else if (e.type === 'fizzle') { // asked to jump or flash, and it couldn't: refused, on what it couldn't hop (and then ran into), or where it would have gone
        const s = e.snake;
        if (s.id === viewerId) {
          refusal.flash = !!e.flash;
          // The cell it faced, as the engine saw it (a stunned snake's
          // auto-turn has turned it since). Off the board, at the edge it
          // faced: on the edge, its whole ink just inside (never wrapped
          // round to the far side for a snake that doesn't wrap: the
          // engine wraps it for one that does).
          const h = s.prev?.[0] || s.body[0], cx = e.x ?? h.x + s.dir.x, cy = e.y ?? h.y + s.dir.y, m = REFUSE_REACH;
          refusal.x = Math.min(SIZE - m, Math.max(m, cx * CELL + CELL / 2));
          refusal.y = Math.min(SIZE - m, Math.max(m, cy * CELL + CELL / 2));
          refusal.at = now; refusal.tick = game.tick;
        }
      } else if (e.type === 'leap') { // up and over (see liftOf): puffs of dust kicked back where it took off (and gold, for a golden leap)
        const a = animOf(e.snake, now), h = e.snake.body[e.reach || 1] || e.snake.body[0];
        hopped(e.snake, e, now);
        a.leapUntil = game.tick + e.snake.body.length + 1; // (until the arch has run off its tail)
        spawn(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, 8, 140, 420, 2.2, '#d6b480', '#c08a4a'); // (bark dust: the plain leap's no power)
        dustPuffs(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, e.snake.dir.x, e.snake.dir.y);
        if (e.gold) spawn(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, 10, 120, 600, 1.8, '#d4a017', '#fffbea'); // (in Honey, a power's gold)
      } else if (e.type === 'dash') { // a streak along the way it went: a golden dash's in gold and ember, with flecks of both; a plain flash's in ember, lighter
        const da = animOf(e.snake, now);
        da.dashTick = game.tick;
        da.bursts++; da.burstAt = now; // (a rainbow's colours burst on: see bowHue)
        if (e.plain && lookOf(e.snake) === 'star') animOf(e.snake, now).flareAt = now; // (Star's flash spent: its twinkles burst off its points as they go dim, see drawStarHead)
        const h = e.snake.body[0], seen = streaks.findIndex(k => k.s === e.snake && k.pre === game.tick - 1); // (seen coming: see prepare)
        if (seen >= 0 && streaks[seen].fx === e.x && streaks[seen].fy === e.y && streaks[seen].tx === h.x && streaks[seen].ty === h.y) { streaks[seen].pre = -1; sparksOf(streaks[seen]); } // (as it was seen: it stays, and now its flecks fly)
        else { if (seen >= 0) streaks.splice(seen, 1); streakOf(e.snake, e.x, e.y, h.x, h.y, !!e.plain, now, -1); }
      } else if (e.type === 'douse') { // a fire put out: a hiss of steam
        const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
        spawn(x, y, 10, 80, 600, 2.4, '#e2e8f0', '#94a3b8');
        if (!reduced) for (let k = 0; k < 4; k++) mote(x + (Math.random() - 0.5) * CELL * 0.6, y, (Math.random() - 0.5) * 12, -20 - Math.random() * 14, 1200, 4 + Math.random() * 3, 2);
      } else if (e.type === 'cut') { // a golden flash (a dash) cut through it (the woodpecker's cuts, its "Ouch!", went in round four)
        floater(e.x * CELL + CELL / 2, Math.max(CELL * 1.3, e.y * CELL - CELL * 0.2), e.by != null ? 'Snip!' : 'Ouch!');
        if (e.by != null) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 12, 220, 500, 2.4, '#d4a017', e.snake.color || '#fffbea');
      } else if (e.type === 'alight') { // crawled into the fire: a burst of flame
        const h = e.snake.body[0];
        spawn(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, 14, 200, 520, 2.6, '#f97316', '#fde047');
      } else if (e.type === 'singe') { // a piece falls off in the flames
        const tl = e.snake.body[e.snake.body.length - 1];
        spawn(tl.x * CELL + CELL / 2, tl.y * CELL + CELL / 2, 6, 120, 420, 2.2, '#f97316', '#78716c');
        if (e.snake.id === viewerId) floater(e.snake.body[0].x * CELL + CELL / 2, Math.max(CELL * 1.3, e.snake.body[0].y * CELL - CELL * 1.1), '-1');
      } else if (e.type === 'baked') { // done: a puff of steam and a glint
        const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
        for (let i = 0; i < 4; i++) mote(x + (Math.random() - 0.5) * CELL * 0.4, y - CELL * 0.2, (Math.random() - 0.5) * 10, -20 - Math.random() * 10, 1200, 2.5, 4);
        spawn(x, y, 6, 120, 420, 2, '#fdba74', '#fffbea');
      } else if (e.type === 'ash') { // burnt to nothing: grey ash and smoke
        const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
        eatenNow.add(e.y * GRID + e.x);
        spawn(x, y, 10, 140, 600, 2.4, '#a8a29e', '#57534e');
        for (let i = 0; i < 3; i++) mote(x, y - CELL * 0.2, (Math.random() - 0.5) * 8, -16, 1400, 3, 2);
      } else if (e.type === 'rot') { // rotted away: a brown puff (a bead, in its own colour)
        spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 8, 110, 460, 2.2, e.kind === 'pellet' ? beadFill(e) : '#8a6a2a', '#57534e');
      } else if (e.type === 'peck') { // a chunk comes out: chips flying from every cell, and a thump
        for (const k of e.cells || []) spawn((k % GRID) * CELL + CELL / 2, Math.floor(k / GRID) * CELL + CELL / 2, 4, 240, 520, 2.8, '#c08a4a', '#3b2412');
        if (e.cells?.length && !reduced) shake(5);
      } else if ((e.type === 'spawn' && e.kind === 'beetle') || e.type === 'emerge') {
        bugPops.push({ x: e.x, y: e.y, tick: game.tick, at: now }); // (it pops out of its burrow, kicking up a little sawdust)
        if (e.x >= 0) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 6, 110, 420, 2, '#d6b480', '#a16207');
      } else if (e.type === 'dig') { // a cornered beetle digs in: sawdust bursts off it (and sprays while it digs: see drawDig)
        if (!reduced) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 8, 140, 420, 2, '#e6cc96', '#b07d48');
      } else if (e.type === 'dive') { // down its burrow, or the bore it dug
        let b = null;
        for (const o of bugs) if (Math.abs(o.x - e.x) + Math.abs(o.y - e.y) <= (b ? 0 : 1)) b = o; // (where it went in, or beside it)
        dives.push({ x: e.x, y: e.y, at: now, ang: b?.ang ?? 0, gold: b ? b.gold : !!e.gold, dug: e.dug ? Math.max(0.3, b?.dig || DIG_STILL) : 0 });
        spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 6, 110, 420, 2, '#d6b480', '#a16207');
      } else if (e.type === 'burrow') { // cracked open (bark chips), or left by a dig (pale sawdust: it's freshly bored, see drawFresh)
        if (e.dug) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 10, 150, 520, 2.2, '#f2e2bb', '#d9b77c');
        else spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 12, 170, 520, 2.4, '#d6b480', '#3b2412');
      } else if (e.type === 'heal') { // one closing over: sawdust and moss fill it, and it fades into the bark (see drawHeals)
        const key = e.y * GRID + e.x;
        heals.push({ x: e.x, y: e.y, at: now, v: BURROW_LOOKS[key % 4], cs: crackSprites.get(key) || null });
        crackSprites.delete(key); burrowSeen.delete(key); // (a burrow opening there again cracks and pops anew)
        if (!reduced) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 6, 80, 420, 1.8, '#e6cc96', '#3a5520');
      } else if (e.type === 'gust' && e.x >= 0) { // an apple knocked loose: it drops in
        born.set(e.y * GRID + e.x, { kind: 'food', at: now, i: 0, next: 0, gen: bornGen, v: '', fell: true });
      } else if (e.type === 'strike') {
        const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2, pts = [[x + (Math.random() - 0.5) * CELL * 6, -CELL]];
        for (let i = 1; i < 9; i++) { const f = i / 9; pts.push([pts[0][0] + (x - pts[0][0]) * f + (Math.random() - 0.5) * CELL * 1.6 * (1 - f), -CELL + (y + CELL) * f]); }
        pts.push([x, y]);
        bolt = { pts, at: now };
        flashAt = now;
        if (!reduced) { shake(3); spawn(x, y, 14, 260, 520, 2.6, '#fde047', '#f5f3ff'); }
      } else if (e.type === 'ember') {
        embers.push({ fx: e.fx, fy: e.fy, x: e.x, y: e.y, at: now });
      } else if (e.type === 'rainbow') {
        rainbow = { x: e.x, y: e.y, at: now };
      } else if (e.type === 'flown') { // a beetle nobody caught takes off
        spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 8, 260, T.PARTICLE_LIFE * 1.2, 2.2, '#d1fae5', '#059669');
      }
    }
  }

  // A dead snake bursts into meat, or with reduced motion fades over its meat.
  // When the game holds the moment (your death), the snakes that died on that
  // tick keep their pose, eyes screwed shut and covering their meat, until the
  // hold ends. corpses: { s, until (burst/fade time), fade (true once fading) }.
  const deaths = [], corpses = [];
  const FADE_MS = T.CORPSE_FADE_MS;
  const heldCells = new Uint8Array(GRID * GRID);

  function hold(until) {
    for (const s of deaths) corpses.push({ s, until, fade: false });
    deaths.length = 0;
  }

  // Out: it goes off with a pop. A comic starburst and a shockwave ring in
  // its colour at its head (both inked, like everything else on the board), a
  // burst of pieces from the head and along the body, and smoke. A rainbow
  // (Star's, or Copycat's copy of it) goes off in its colours: the ring in
  // six arcs round the rainbow, the pieces in pairs of them (in Star's
  // stand-in colour in text, the ring and the pieces were gold and cream, a
  // golden pickup's).
  const blasts = []; // { x, y, at, color, bow (a rainbow's ramps, by hue, or null) }
  function burst(s) {
    const col = colorOf(s), hex = col[0] === '#' ? col : '#f6ecd2', h = s.body[0], bow = bowOf(s);
    const hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2;
    blasts.push({ x: hx, y: hy, at: lastNow, color: hex, bow });
    if (bow) spawnBow(hx, hy, 26, 380, T.PARTICLE_LIFE * 1.3, 3.4, bow);
    else spawn(hx, hy, 26, 380, T.PARTICLE_LIFE * 1.3, 3.4, hex, '#fffbea');
    for (let i = 1; i < s.body.length; i += 2) {
      const c = s.body[i];
      spawn(c.x * CELL + CELL / 2, c.y * CELL + CELL / 2, Math.max(2, Math.round(T.PARTICLES_DEATH / Math.ceil(s.body.length / 2))), 240, T.PARTICLE_LIFE * 1.2, 3, bow ? bow(TWINKLE_HUES[(i >> 1) % TWINKLE_HUES.length])[0] : hex, '#a16207'); // (a rainbow's in its colours, as its beads)
    }
    for (let i = 0; i < 6; i++) mote(hx + (Math.random() - 0.5) * CELL, hy + (Math.random() - 0.5) * CELL, (Math.random() - 0.5) * 30, -18 - Math.random() * 18, 1400, 4 + Math.random() * 3, 2);
  }
  // n pieces in a rainbow's six colours, a pair at a time.
  function spawnBow(x, y, n, speed, life, size, bow) {
    for (let j = 0; j < TWINKLE_HUES.length; j += 2) spawn(x, y, Math.ceil(n / 3), speed, life, size, bow(TWINKLE_HUES[j])[0], bow(TWINKLE_HUES[j + 1])[0]);
  }
  const BLAST_SPAN = 5; // (cells across the starburst's sprite)
  const blastSprite = () => {
    let byVariant = sprites.get('blast');
    if (!byVariant) sprites.set('blast', byVariant = new Map());
    let sp = byVariant.get('');
    if (sp) return sp;
    const size = Math.max(2, Math.round(BLAST_SPAN * CELL * k));
    sp = makeLayer(size, size);
    const g = sp.getContext('2d'), scale = size / (BLAST_SPAN * CELL);
    g.setTransform(scale, 0, 0, scale, size / 2, size / 2);
    const burstPath = (r0, r1, n, twist) => { // (a star of n uneven points)
      g.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * TAU + twist, r = i % 2 ? r0 : r1 * (0.8 + 0.2 * ((i * 7) % 5) / 4);
        if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
    };
    g.lineJoin = 'round';
    burstPath(CELL * 1.25, CELL * 2.2, 11, 0.2);
    g.fillStyle = '#fb923c'; g.fill();
    g.lineWidth = CELL * 0.1; g.strokeStyle = '#3a2614'; g.stroke();
    burstPath(CELL * 0.8, CELL * 1.45, 9, 0.5);
    g.fillStyle = '#fed7aa'; g.fill(); // (pale orange: gold means a power)
    burstPath(CELL * 0.35, CELL * 0.75, 7, 0.9);
    g.fillStyle = '#fffbea'; g.fill();
    byVariant.set('', sp);
    return sp;
  };
  function drawBlasts(now) {
    for (let i = blasts.length - 1; i >= 0; i--) {
      const b = blasts[i], t = (now - b.at) / 480;
      if (t >= 1 || t < 0) { blasts.splice(i, 1); continue; }
      const grow = reduced ? 0.5 : t, pop = reduced ? 1 : 1 - (1 - Math.min(1, t * 2.5)) ** 3; // (it bursts out fast, then holds; with reduced motion, it's simply there, fading)
      const w = BLAST_SPAN * CELL * (0.5 + 0.55 * pop);
      ctx.globalAlpha = t < 0.55 ? 1 : (1 - t) / 0.45;
      ctx.drawImage(blastSprite(), b.x - w / 2, b.y - w / 2, w, w);
      ctx.globalAlpha = 1 - t; // the shockwave: an ink ring under one in its colour (a rainbow's: six arcs round it)
      const rr = CELL * (0.6 + 3.3 * grow);
      ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, TAU);
      ctx.strokeStyle = '#3a2614';
      ctx.lineWidth = 8 * (1 - t) + 3;
      ctx.stroke();
      ctx.lineWidth = 8 * (1 - t);
      if (b.bow) {
        ctx.lineCap = 'butt';
        for (let j = 0; j < TWINKLE_HUES.length; j++) {
          const a0 = (j / TWINKLE_HUES.length - 0.25) * TAU;
          ctx.beginPath(); ctx.arc(b.x, b.y, rr, a0, a0 + TAU / TWINKLE_HUES.length);
          ctx.strokeStyle = b.bow(TWINKLE_HUES[j])[0];
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = b.color;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  // While the edges wrap round for someone: a warm gold seam inside the
  // frame, with two glints running round it, and bright by a wrapping head
  // (fading calmly over the last WRAP_WARN_MS).
  const edgeAt = [0, 0]; // (scratch: a point round the seam)
  function alongEdge(d, inset) { // d px round the seam, clockwise from the top-left corner
    const L = SIZE - 2 * inset, p = ((d % (4 * L)) + 4 * L) % (4 * L);
    if (p < L) { edgeAt[0] = inset + p; edgeAt[1] = inset; }
    else if (p < 2 * L) { edgeAt[0] = SIZE - inset; edgeAt[1] = inset + p - L; }
    else if (p < 3 * L) { edgeAt[0] = SIZE - inset - (p - 2 * L); edgeAt[1] = SIZE - inset; }
    else { edgeAt[0] = inset; edgeAt[1] = SIZE - inset - (p - 3 * L); }
    return edgeAt;
  }
  function drawWrapEdges(now) {
    let any = 0;
    for (const s of game.snakes) if (s.alive && s.wrapUntil > shownTime) any = Math.max(any, Math.min(1, (s.wrapUntil - shownTime) / T.WRAP_WARN_MS));
    if (!any) return;
    const inset = 3, run = 4 * (SIZE - 2 * inset);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = rgba('#d4a017', 0.5 * any);
    ctx.strokeRect(inset, inset, SIZE - 2 * inset, SIZE - 2 * inset);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba('#fde68a', 0.75 * any);
    ctx.strokeRect(inset, inset, SIZE - 2 * inset, SIZE - 2 * inset);
    // Two glints, opposite each other, running round with a fading tail.
    const head = reduced ? run * 0.1 : (now / 1000) * CELL * 6, tail = CELL * 2.4, STEPS = 8;
    ctx.lineWidth = 2.5;
    for (let g = 0; g < 2; g++) {
      for (let i = 0; i < STEPS; i++) {
        const d0 = head + g * run / 2 - tail * (1 - i / STEPS), d1 = d0 + tail / STEPS;
        ctx.globalAlpha = any * (i + 1) / STEPS;
        ctx.strokeStyle = '#fffbea';
        ctx.beginPath();
        const p0 = alongEdge(d0, inset); ctx.moveTo(p0[0], p0[1]);
        const p1 = alongEdge(d1, inset); ctx.lineTo(p1[0], p1[1]);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    for (const s of game.snakes) { // (by a wrapping head: a glow on the edge it's near)
      if (!s.alive || !(s.wrapUntil > shownTime)) continue;
      const h = s.body[0], hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2;
      edgeGlow(0, hy, h.x, any); edgeGlow(SIZE, hy, GRID - 1 - h.x, any);
      edgeGlow(hx, 0, h.y, any); edgeGlow(hx, SIZE, GRID - 1 - h.y, any);
      ctx.globalAlpha = 1;
    }
  }
  // The glow at (ex, ey) on the edge, for a wrapping head d cells from it.
  function edgeGlow(ex, ey, d, any) {
    if (d > 3) return;
    const w = SPRITE * CELL * (1.6 - d * 0.3);
    ctx.globalAlpha = 0.7 * any * (1 - d / 4);
    ctx.drawImage(glowSprite(), ex - w / 2, ey - w / 2, w, w);
  }

  const len3 = (x, y) => Math.hypot(x, y) || 1;
  // A dash's streak, under the snakes (over the dasher it ran a line through
  // its face): a speed line down each side, from where it started to the
  // back of its head, inked so it reads on the bark, tapering back to the
  // start; gone in a moment. The lines run just clear of everything drawn
  // round the dasher's body (its outline, a gold line), which used to cover
  // them. (A wedge of honey light between them is gone: where it showed past
  // the body, it was a translucent khaki block, cut square by the head.) A
  // golden dash's lines are gold with an ember core; a plain flash's are
  // ember, thinner, inked more faintly and shorter (from a third of the
  // way), so the golden one is the bigger deal.
  const streaks = []; // { x0, y0, x1, y1, at, s, plain, fx, fy, tx, ty (its cells), pre (seen coming on that tick, until it goes) }
  const STREAK_GAP = 2; // (between the dasher's drawn edge and a line's inked edge, in units)
  // A dash's streak from cell (fx, fy) to (tx, ty): at its tick, with its
  // flecks and the scuff where it set off; or (pre: that tick) as soon as
  // it's drawn there, seen coming, its flecks and scuff once it's gone (a
  // guess put right, or that didn't go, leaves none: see unstreak).
  function streakOf(s, fx, fy, tx, ty, plain, now, pre) {
    const x0 = fx * CELL + CELL / 2, y0 = fy * CELL + CELL / 2, x1 = tx * CELL + CELL / 2, y1 = ty * CELL + CELL / 2;
    if (Math.abs(x1 - x0) + Math.abs(y1 - y0) > CELL * (T.DASH_LENGTH + 0.5)) return; // (not across a wrapped edge)
    const k = { x0, y0, x1, y1, at: now, s, plain, fx, fy, tx, ty, pre };
    streaks.push(k);
    if (pre < 0) sparksOf(k);
  }
  function sparksOf({ x0, y0, x1, y1, plain }) {
    for (let k = 0; k <= 3; k++) spawn(x0 + (x1 - x0) * k / 3, y0 + (y1 - y0) * k / 3, plain ? 2 : 4, 90, 500, 1.8, plain ? EMBER : HONEY, plain ? GLINT : EMBER);
    if (!reduced) for (let k = 0; k < 4; k++) mote(x0 + (Math.random() - 0.5) * CELL * 0.6, y0 + (Math.random() - 0.5) * CELL * 0.6, -(x1 - x0) / len3(x1 - x0, y1 - y0) * 20 + (Math.random() - 0.5) * 10, -(y1 - y0) / len3(x1 - x0, y1 - y0) * 20 - 6, 700, 3 + Math.random() * 2, 2); // (a scuff of dust where it set off)
  }
  // A streak seen coming this tick that won't go as seen: gone.
  function unstreak(s) {
    for (let i = streaks.length - 1; i >= 0; i--) if (streaks[i].s === s && streaks[i].pre === game.tick) streaks.splice(i, 1);
  }
  function drawStreaks(now) {
    for (let i = streaks.length - 1; i >= 0; i--) {
      const k = streaks[i], t = (now - k.at) / T.STREAK_MS;
      if (t >= 1 || t < 0 || (k.pre >= 0 && k.pre < game.tick)) { streaks.splice(i, 1); continue; } // (or seen coming, and it didn't go)
      const dx = k.x1 - k.x0, dy = k.y1 - k.y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
      const ex = k.x1 - ux * CELL * 0.35, ey = k.y1 - uy * CELL * 0.35; // (the back of its head)
      const sx = k.plain ? k.x0 + (ex - k.x0) * 0.35 : k.x0, sy = k.plain ? k.y0 + (ey - k.y0) * 0.35 : k.y0; // (where its lines start)
      const speedLine = (off, w, over) => { // (pointed at both ends, widest near the head; `over` runs it a touch past them, for its ink)
        const mx = sx + (ex - sx) * 0.8, my = sy + (ey - sy) * 0.8;
        ctx.moveTo(sx - ux * over + nx * off, sy - uy * over + ny * off);
        ctx.lineTo(mx + nx * (off + w), my + ny * (off + w));
        ctx.lineTo(ex + ux * over + nx * off, ey + uy * over + ny * off);
        ctx.lineTo(mx + nx * (off - w), my + ny * (off - w));
        ctx.closePath();
      };
      const a = anim.get(k.s), w = CELL * (k.plain ? 0.085 : 0.1) * (1 - 0.5 * t), ink = 1.4;
      const side = CELL * 0.44 + (a ? edgeOf(k.s, a) : 0) + STREAK_GAP + ink + w; // (the body's half-width by the neck, and what's drawn round it)
      ctx.fillStyle = rgba('#3a2614', (k.plain ? 0.7 : 0.8) * (1 - t));
      ctx.beginPath(); speedLine(-side, w + ink, ink * 2); speedLine(side, w + ink, ink * 2); ctx.fill();
      ctx.fillStyle = rgba(k.plain ? EMBER : HONEY, 0.95 * (1 - t));
      ctx.beginPath(); speedLine(-side, w, 0); speedLine(side, w, 0); ctx.fill();
      if (k.plain) continue;
      ctx.fillStyle = rgba(EMBER_LINE, 0.9 * (1 - t)); // (the ember core)
      ctx.beginPath(); speedLine(-side, w * 0.4, -len * 0.25); speedLine(side, w * 0.4, -len * 0.25); ctx.fill();
    }
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

  // Held corpses are drawn at the frame's own point in the tick (a snake that
  // starved moved before it died), the head pressed into what it hit, with a spark.
  function drawCorpses(alpha, now) {
    for (const c of corpses) {
      const opacity = c.fade ? Math.max(0, 1 - (now - c.until) / FADE_MS) : 1;
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

  // Confetti: for a win, a new best (all over the board), or the winner of a
  // round you're watching (from its head).
  const CONFETTI = ['#f6ecd2', '#a3e635', '#f472b6', '#7dd3fc', '#fb923c', '#c4b5fd', '#84cc16']; // (the board's own colours: parchment, leaf, petal, sky, orange, lilac; no gold: gold means a power)
  function celebrate(s = null) {
    if (reduced) return;
    if (s && s.body.length) {
      const h = s.body[0];
      for (let i = 0; i < 4; i++) spawn(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, 9, 320, T.PARTICLE_LIFE * 3, 4.4, CONFETTI[i], CONFETTI[i + 3], 1);
      return;
    }
    for (let i = 0; i < 12; i++) spawn((i + 0.5) / 12 * SIZE, SIZE * (0.25 + (i % 3) * 0.12), 9, 400, T.PARTICLE_LIFE * 4, 5.6, CONFETTI[i % CONFETTI.length], CONFETTI[(i + 3) % CONFETTI.length], 1);
  }

  function shake(px) {
    shakePx = px;
    shakeUntil = (lastNow || performance.now()) + T.SHAKE_MS; // (the board's clock, which runs faster when watching faster)
  }

  // Where a snake's head is drawn right now, in CSS pixels from the board's
  // top-left (for speech bubbles). boardPx is the board's CSS width.
  function headPx(s, alpha, boardPx, out) {
    const a = anim.get(s);
    if (a && a.drawnAt === lastNow && lastNow) { out.x = a.bx * boardPx / SIZE; out.y = a.by * boardPx / SIZE; return out; } // (as drawn this frame: ahead, and easing out of any wrong guess)
    const c = s.body[0], p = s.prev && s.prev[0] ? s.prev[0] : c;
    const scale = boardPx / GRID, px = nearOf(p.x, c.x), py = nearOf(p.y, c.y); // (across a wrapped edge: from just off it)
    out.x = (px + (c.x - px) * alpha + 0.5) * scale;
    out.y = (py + (c.y - py) * alpha + 0.5) * scale;
    return out;
  }

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
    PERSONAS = opts.personas;
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
    bugs.length = bugPops.length = scurries.length = dives.length = heals.length = 0;
    bugFor.clear();
    knockFor = -1; tickNow = 0;
    fallenFlags.length = 0;
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
    press.dir = null; press.stun = -1; press.tick = -1;
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

  return {
    showYou,
    // (your jump's back, or with 'flash' your flash: its half-ring's flick; the renderer sees both itself, so this only makes sure)
    ready: (s, kind) => { const a = animOf(s, lastNow || performance.now()), now = lastNow || performance.now(); if (kind === 'flash') { if (!(now - a.flashFx < 600)) a.flashFx = now; } else if (!(now - a.readyAt < 600)) a.readyAt = now; },
    init, setGame, resize, frame, onTick, shake, hold, headPx, colorOf, markOf, celebrate, setQuality, setBoardRect, pressed,
    get quality() { return quality; },
    holding: () => deaths.length > 0 || corpses.length > 0,
    setViewer(id) { viewerId = id; },
    setReducedMotion(v) { reduced = v; },
    setLead(ticks) { leadTicks = ticks; },
    guideSprite, // (the Field guide's pictures)
    get particles() { return pLive; },
    get motes() { let n = 0; for (let i = 0; i < MAX_M; i++) if (mlife[i] > 0) n++; return n; }, // (dust, smoke and the like in the air: for the tests)
    streaked: () => streaks.map(k => ({ from: [k.fx, k.fy], to: [k.tx, k.ty], seen: k.pre >= 0 })), // (the dash streaks drawn: for the tests)
    hues(on) { huesOn = !!on; }, // (a land's colour round a rival on it, drawn or not: for the benchmark, which times it)
    landShown: (s, x, y) => !!realms.get(s)?.shown[y * GRID + x], // (whether a cell of s's land is drawn: for the tests)
    prebuild(on) { prebuilding = !!on; if (!on) { pre.ready = false; pre.key = NaN; } }, // (the land a strike leaves made ahead, or not: for the tests, comparing the two)
    get prebuilt() { return pre.ready; }, // (made ahead, and waiting for the strike: for the tests)
    get landMade() { return { swapped: landSwaps, built: landBuilds, stale: landStale, unready: landUnready }; }, // (how often a realm's layers were swapped in, made ahead, and made; strikes made the old way, and why: for the tests)
    // (s's land's layers and the dashes as drawn, as a hash of their pixels, where they land and how big: for the tests)
    landPixels(s) {
      const r = realms.get(s), out = {};
      const hash = c => { if (!c || !c.width) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 2166136261; for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619); return `${c.width}x${c.height}:${h >>> 0}`; };
      if (r) { out.any = r.any; out.at = [r.X, r.Y]; out.layer = r.any ? hash(r.layer) : null; out.glow = r.any ? hash(r.glow) : null; out.shared = r.shared.length; }
      out.dash = dash.any ? [dash.X, dash.Y, hash(dash.layer)] : null;
      return out;
    },
    flick(s, p) { const a = animOf(s, lastNow), [, len] = FLICKS[lookOf(s)] || FLICKS.player; a.tongueMs = T.TONGUE_MS * len; a.tongueUntil = lastNow + (1 - p) * a.tongueMs; a.nextTongue = lastNow + 1e9; }, // (its tongue or gag p of the way through, and then no more: for the tests)
    birdHome, // (when the woodpecker lands back on its perch after a strike, ms after it: the game's "kik!")
    knockFlight: (x, y, tx, ty) => knockFly(Math.hypot(tx - x, ty - y)), // (how long a piece the strike knocks from (x, y) to (tx, ty) is in the air, ms: the knock sound's landing)
    // (the woodpecker as last drawn: its pose, what it's doing, where its eye is and where it looks, its layer; and its plan's timings, ms: for the tests)
    birdPose() {
      birdMats(pose);
      const k = lay.sc, u = Math.hypot(HM[0], HM[1]);
      return { phase: pose.phase, tp: pose.tp, x: pose.x, y: pose.y, s: pose.s, flip: pose.flip, rot: pose.rot, turn: pose.turn, thrust: pose.thrust, wing: pose.wing, stroke: pose.stroke, crouch: pose.crouch, blur: pose.blur, blows: pose.blows, blink: pose.blink,
        gaze: [bird.gx, bird.gy], looks: [pose.fx, pose.fy], eye: [lay.ox + k * atX(HM, 0.75, -1.9), lay.oy + k * atY(HM, 0.75, -1.9), k * u * 0.21], eyeAt: [atX(HM, 0.75, -1.9), atY(HM, 0.75, -1.9)], beak: [atX(HM, BILL[0], BILL[1]), atY(HM, BILL[0], BILL[1])],
        layer: { x: lay.x, y: lay.y, w: lay.w, h: lay.h, W: lay.W, H: lay.H } };
    },
    birdPlan: () => ({ strikeAt: plan.strikeAt, spot: [plan.tx, plan.ty], aim: plan.aimMs, depart: plan.depart, settle: B_SETTLE, drum: plan.D, times: plan.times.slice(), flight: plan.F, hop: plan.hop ? plan.H : 0, home: home.total, back: home.F, linger: B_LINGER }),
    birdLook(turn) { bird.force = turn ?? null; }, // (its head held turned so, or null: for the tests)
    birdOver(on) { overOn = !!on; }, // (the rings and pieces in the air it covers drawn over it, or not: for the tests)
    birdFrame(alpha, now) { if (game && sized) drawWoodpecker(alpha, now, 16); }, // (the woodpecker alone drawn, the board left as it is: for the tests, frame by frame through its flights)
  };
})();
