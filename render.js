// The canvas renderer for Bark & Bite.
//
// The board is drawn in a fixed logical space of GRID cells of CELL units
// (768 × 768). The canvas backing store is sized to the board's real size ×
// devicePixelRatio, so everything stays crisp, and one transform maps logical
// units to device pixels.
//
// Cost control, measured in Chrome's GPU process as well as in script: the
// bark, grid lines and holes live on a prerendered static layer; food, meat,
// the woodpecker and the "+1"s are cached sprites; particles come from a fixed
// pool; colours come from cached ramps. Bodies are drawn as rectangles, then
// circles: separate fills batch into one GPU operation, while one path of many
// circles is triangulated every frame and strokes between circles break the
// batch. The per-frame path builds no strings and no closures.
window.SnakeRender = (() => {
  const T = window.TUNING;
  const GRID = T.GRID;
  const CELL = 32;
  const SIZE = GRID * CELL;
  const BARK = '#5a3b22';
  const INK = '#0b1210';
  const TAU = Math.PI * 2;

  let canvas, ctx, PERSONAS;
  let devPerCss = 1;         // device pixels per CSS pixel on the board
  let shakeX = 0, shakeY = 0; // this frame's shake, in device pixels
  let viewerId = -1; // your snake on this screen (it gets the bright outline), -1 if none
  let k = 1;                 // device pixels per logical unit
  let reduced = false;       // prefers-reduced-motion
  let game = null;

  // ------------------------------------------------------------ utilities

  // Blend two #rrggbb colors; t = 0 gives a, t = 1 gives b. Results are cached,
  // so calling this with the same arguments every frame costs a lookup.
  const mixCache = new Map();
  function mix(a, b, t) {
    const key = a + b + t;
    let out = mixCache.get(key);
    if (out) return out;
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    out = '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
    mixCache.set(key, out);
    return out;
  }

  // Perceived brightness 0..1 of a #rrggbb color.
  function luma(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  // Wildcard's rainbow: 360 precomputed hues instead of a string per segment per frame.
  const HUES = [];
  for (let h = 0; h < 360; h++) HUES.push(`hsl(${h}, 85%, 62%)`);

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

  // The bark, drawn once at the current resolution from a fixed seed: the
  // same tree every round. Faint carved grid lines are baked in so they land
  // on whole device pixels.
  let barkLayer = null, staticLayer = null, holesDrawn = 0, sized = false;

  function buildBark() {
    const px = SIZE * k;
    const b = makeLayer(px, px);
    const g = b.getContext('2d');
    g.scale(k, k);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    g.fillStyle = BARK;
    g.fillRect(0, 0, SIZE, SIZE);
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
    for (let i = 0; i < 6; i++) { // knots
      const x = rnd() * SIZE, y = rnd() * SIZE, r = 10 + rnd() * 16;
      const grad = g.createRadialGradient(x, y, 1, x, y, r);
      grad.addColorStop(0, 'rgba(20,10,3,0.8)');
      grad.addColorStop(0.6, 'rgba(60,36,16,0.5)');
      grad.addColorStop(1, 'rgba(60,36,16,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(x, y, r * 0.6, r, 0, 0, TAU);
      g.fill();
    }
    // A soft vignette, so the edge cells read as the edge of the trunk.
    const v = g.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.42, SIZE / 2, SIZE / 2, SIZE * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.28)');
    g.fillStyle = v;
    g.fillRect(0, 0, SIZE, SIZE);
    // Carved grid lines, about half a CSS pixel wide (at least one device
    // pixel), on whole pixels.
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.strokeStyle = 'rgba(0,0,0,0.17)';
    const lw = Math.max(1, Math.round(devPerCss * 0.6));
    g.lineWidth = lw;
    g.beginPath();
    for (let i = 1; i < GRID; i++) {
      const p = Math.round(i * CELL * k) + (lw % 2 ? 0.5 : 0);
      g.moveTo(p, 0); g.lineTo(p, px);
      g.moveTo(0, p); g.lineTo(px, p);
    }
    g.stroke();
    return b;
  }

  // The static layer is the bark plus every hole pecked so far.
  function resetStatic() {
    if (!sized) { staticLayer = null; holesDrawn = 0; return; } // (built once the board has its real size)
    if (!barkLayer) barkLayer = buildBark();
    if (!staticLayer || staticLayer.width !== barkLayer.width) staticLayer = makeLayer(barkLayer.width, barkLayer.height);
    const g = staticLayer.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(barkLayer, 0, 0);
    holesDrawn = 0;
  }

  // Draw any holes added since last time onto the static layer (a Set keeps
  // insertion order, so new holes are always at the end).
  function syncHoles() {
    if (!game || game.holes.size === holesDrawn) return;
    if (game.holes.size < holesDrawn) resetStatic();
    const g = staticLayer.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    let i = 0;
    for (const key of game.holes) {
      if (i++ < holesDrawn) continue;
      const x = (key % GRID) * CELL + CELL / 2, y = Math.floor(key / GRID) * CELL + CELL / 2;
      const grad = g.createRadialGradient(x, y, 1, x, y, CELL * 0.5);
      grad.addColorStop(0, '#0b0603');
      grad.addColorStop(0.7, '#1c1007');
      grad.addColorStop(1, '#3b2412');
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(x, y, CELL * 0.46, CELL * 0.42, 0, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(160,110,60,0.35)'; // a splintered rim
      g.lineWidth = 1.5;
      g.stroke();
    }
    holesDrawn = game.holes.size;
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

  function drawAppleShape(g, body) {
    const c = CELL;
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(c * 0.04, c * 0.36, c * 0.28, c * 0.09, 0, 0, TAU); g.fill();
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
    g.fillStyle = '#15803d';
    g.beginPath(); g.ellipse(c * 0.17, -c * 0.36, c * 0.14, c * 0.07, -0.5, 0, TAU); g.fill();
  }

  const drawApple = g => drawAppleShape(g, '#84cc16'), drawGolden = g => drawAppleShape(g, '#fbbf24');
  const appleSprite = () => sprite('apple', '', drawApple);
  const goldenSprite = () => sprite('golden', '', drawGolden);
  const glowSprite = () => sprite('glow', '', drawGlow);
  const drawGlow = g => {
    const grad = g.createRadialGradient(0, 0, CELL * 0.2, 0, 0, CELL * 0.8);
    grad.addColorStop(0, 'rgba(253,224,71,0.55)');
    grad.addColorStop(1, 'rgba(253,224,71,0)');
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
  const mushroomSprite = () => sprite('mushroom', '', drawMushroom);
  const drawMushroom = g => {
    const c = CELL;
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(c * 0.03, c * 0.36, c * 0.3, c * 0.08, 0, 0, TAU); g.fill();
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
  // A roast drumstick, ringed in the colour of the snake it came from (a tinted
  // drumstick looked spoiled), with a light edge so it reads on the bark.
  const meatSprite = color => sprite('meat', color || '', drawMeat);
  const drawMeat = (g, col) => {
    const c = CELL;
    g.rotate(-0.7);
    g.fillStyle = '#f5f5f4';
    g.fillRect(c * 0.05, -c * 0.05, c * 0.28, c * 0.1);
    g.beginPath(); g.arc(c * 0.34, -c * 0.06, c * 0.07, 0, TAU); g.fill();
    g.beginPath(); g.arc(c * 0.34, c * 0.06, c * 0.07, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(-c * 0.08, 0, c * 0.24, c * 0.18, 0, 0, TAU);
    g.strokeStyle = 'rgba(255,240,220,0.6)'; // the light edge...
    g.lineWidth = c * 0.13;
    g.stroke();
    g.strokeStyle = col && col[0] === '#' ? col : '#a16207'; // ...the snake's colour inside it...
    g.lineWidth = c * 0.07;
    g.stroke();
    g.fillStyle = '#b4532a'; // ...and the roast
    g.fill();
    g.fillStyle = 'rgba(120,45,15,0.55)';
    g.beginPath(); g.ellipse(-c * 0.02, c * 0.05, c * 0.14, c * 0.09, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)';
    g.beginPath(); g.arc(-c * 0.14, -c * 0.06, c * 0.06, 0, TAU); g.fill();
  };
  // The woodpecker: a great spotted woodpecker clinging to the trunk, beak to
  // the right ('r') or mirrored ('l'). Drawn at its real size, about 1.7 cells
  // tall, so it's as crisp as everything else.
  const birdSprite = side => sprite('bird', side, drawBird);
  const drawBird = (g, side) => {
    const c = CELL * 1.2;
    if (side === 'l') g.scale(-1, 1);
    g.fillStyle = 'rgba(0,0,0,0.3)'; // shadow on the bark
    g.beginPath(); g.ellipse(c * 0.02, c * 0.12, c * 0.3, c * 0.48, 0, 0, TAU); g.fill();
    g.fillStyle = '#18181b'; // the stiff tail it props itself on
    g.beginPath(); g.moveTo(-c * 0.16, c * 0.3); g.lineTo(-c * 0.08, c * 0.66); g.lineTo(c * 0.02, c * 0.3); g.fill();
    g.beginPath(); g.ellipse(-c * 0.07, c * 0.04, c * 0.22, c * 0.36, 0, 0, TAU); g.fill(); // body
    g.fillStyle = '#f5f5f4'; // a white shoulder patch and barred wing
    g.beginPath(); g.ellipse(-c * 0.12, -c * 0.06, c * 0.08, c * 0.14, 0.15, 0, TAU); g.fill();
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-c * (0.2 - i * 0.05), c * (0.12 + i * 0.08), c * 0.028, 0, TAU); g.fill(); }
    g.fillStyle = '#dc2626'; // red under the tail
    g.beginPath(); g.ellipse(-c * 0.02, c * 0.32, c * 0.08, c * 0.06, 0, 0, TAU); g.fill();
    g.fillStyle = '#18181b'; // head
    g.beginPath(); g.arc(c * 0.04, -c * 0.36, c * 0.16, 0, TAU); g.fill();
    g.fillStyle = '#dc2626'; // red nape
    g.beginPath(); g.arc(-c * 0.08, -c * 0.42, c * 0.07, 0, TAU); g.fill();
    g.fillStyle = '#f5f5f4'; // white cheek, with the eye in it
    g.beginPath(); g.ellipse(c * 0.08, -c * 0.33, c * 0.09, c * 0.07, 0, 0, TAU); g.fill();
    g.fillStyle = '#18181b';
    g.beginPath(); g.arc(c * 0.1, -c * 0.35, c * 0.032, 0, TAU); g.fill();
    g.fillStyle = '#52525b'; // a chisel beak, into the bark
    g.beginPath(); g.moveTo(c * 0.17, -c * 0.4); g.lineTo(c * 0.44, -c * 0.37); g.lineTo(c * 0.17, -c * 0.31); g.fill();
  };

  // ------------------------------------------------------------ beetles

  // A jewel beetle, drawn live (it turns and walks): an emerald shell with a
  // gold rim, six legs that scuttle while it moves, and feelers. It glides to
  // its new cell during the tick it moved, then pauses: a beetle's walk.
  function drawBeetle(f, alpha, now) {
    const moved = game && f.movedAt === game.tick - 1 && f.px != null;
    const t = moved ? alpha : 1;
    const gx = moved ? f.px + (f.x - f.px) * t : f.x, gy = moved ? f.py + (f.y - f.py) * t : f.y;
    const x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2;
    const c = CELL;
    const walking = moved && !reduced;
    const step = walking ? Math.sin(now / (f.scared ? 28 : 45)) : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; // shadow
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, c * 0.38, c * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(f.dir.y, f.dir.x));
    ctx.scale(1.35, 1.35); // about an apple's size, so it's easy to spot
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
    // Feelers.
    ctx.moveTo(c * 0.26, -c * 0.04); ctx.quadraticCurveTo(c * 0.38, -c * 0.06, c * 0.42, -c * 0.18);
    ctx.moveTo(c * 0.26, c * 0.04); ctx.quadraticCurveTo(c * 0.38, c * 0.06, c * 0.42, c * 0.18);
    ctx.stroke();
    // Head, then the shell with its gold rim, the split down the middle and a shine.
    ctx.fillStyle = '#14532d';
    circle(c * 0.22, 0, c * 0.08);
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.ellipse(-c * 0.02, 0, c * 0.22, c * 0.17, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = c * 0.03;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(6,47,35,0.8)';
    ctx.beginPath();
    ctx.moveTo(c * 0.18, 0); ctx.lineTo(-c * 0.23, 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(209,250,229,0.55)';
    circle(c * 0.04, -c * 0.08, c * 0.045);
    ctx.restore();
  }

  // --------------------------------------------------------- particles

  // A fixed pool: positions, velocities and life in typed arrays, colors as
  // indexes into a small palette, so bursts never allocate.
  const MAX_P = 320;
  const px = new Float32Array(MAX_P), py = new Float32Array(MAX_P);
  const pvx = new Float32Array(MAX_P), pvy = new Float32Array(MAX_P);
  const plife = new Float32Array(MAX_P), pmax = new Float32Array(MAX_P), psize = new Float32Array(MAX_P);
  const pcol = new Uint8Array(MAX_P);
  let pNext = 0, pLive = 0;
  const PCOLORS = ['#a3e635', '#84cc16', '#fde68a', '#fbbf24', '#fffbea', '#dc2626', '#f6ecd2', '#c2410c', '#a16207'];
  const PCOLOR_INDEX = new Map(PCOLORS.map((c, i) => [c, i]));
  const colorIndex = c => {
    let i = PCOLOR_INDEX.get(c);
    if (i === undefined && PCOLORS.length < 255) { i = PCOLORS.length; PCOLORS.push(c); PCOLOR_INDEX.set(c, i); }
    return i ?? 0;
  };

  function spawn(x, y, n, speed, life, size, c1, c2) {
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
        ctx.beginPath();
        ctx.arc(px[i], py[i], psize[i] * (0.5 + 0.5 * t), 0, TAU);
        ctx.fill();
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
  const drawFloat = (g, text) => {
    g.font = FLOAT_FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = CELL * 0.14;
    g.strokeStyle = 'rgba(58,38,20,0.85)';
    g.strokeText(text, 0, 0);
    g.fillStyle = '#fde68a';
    g.fillText(text, 0, 0);
  };
  let fNext = 0;
  function floater(x, y, text) {
    fx[fNext] = x; fy[fNext] = y; flife[fNext] = T.FLOAT_MS; ftext[fNext] = text;
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
      blitCrisp(sprite('float', ftext[i], drawFloat), fx[i], y, Math.min(1, t * 1.6));
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
        nextTongue: now + T.TONGUE_EVERY * (0.5 + Math.random()), tongueUntil: 0,
        gx: s.dir.x, gy: s.dir.y, near: 99, // where the eyes point (on the screen, eased), and how far that is
        wx: 0, wy: 0, wanderAt: 0,          // Wildcard's eyes wander about on their own
        gulps: [-99, -99, -99, -99], gulpAt: 0,
        gulpR: T.GULP, gulpW: T.GULP_LENGTH, ateAt: -1e9, // gulp size and length (Gobbler's are bigger), last bite
        // This frame's layout (see prepare): segment centres, the corner each
        // band bends through, radii and fills, sized for the body as it grows.
        n: 0, pts: new Float32Array(64), cor: new Float32Array(64), rad: new Float32Array(32), fills: new Array(32),
        look: '', color: '', isPlayer: false, rim: false, bump: 0, tickPos: 0,
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
    if (s.personaKey === 'capricious' && s.memory.mood) return PERSONAS[s.memory.mood].color;
    if (s.personaKey === 'copycat' && game) {
      const model = findById(s.memory.modelId);
      if (model && model.alive) return mix(model.personaKey === 'capricious' ? colorOf(model) : model.color, '#ffffff', 0.45);
    }
    return s.color;
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
      case 'sniper': case 'sovereign': return headOf(m.victimId) || nearest(s, 'head');
      case 'colonist': return headOf(m.victimId) || m.site || nearest(s, 'head');
      case 'vulture': return headOf(m.lureId) || nearest(s, 'head');
      case 'copycat': return headOf(m.modelId) || nearest(s, 'head');
      case 'creeper': return nearest(s, 'tail') || nearest(s, 'head');
      case 'mason': return nearest(s, 'head'); // keeping an eye on whoever's near the wall
      case 'ghost': case 'metagamer': case 'desperado': case 'joker': return nearest(s, 'head');
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

  // The nearest food (not mushrooms), rival head, or long rival's tail. Every
  // snake's eyes follow something, so no face ever just stares ahead.
  function nearest(s, what) {
    const h = s.body[0];
    let best = 1e9, out = null;
    if (what === 'food') {
      for (const f of game.food) {
        if (f.kind === 'mushroom') continue;
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
  function updateGaze(s, look, a, now) {
    const f = game ? focusOf(s, look, a, now) : null;
    let tx = s.dir.x, ty = s.dir.y; // nothing to look at: straight ahead
    if (f) {
      const h = s.body[0], dx = f.x - h.x, dy = f.y - h.y;
      const len = Math.hypot(dx, dy) || 1;
      a.near = len;
      tx = dx / len; ty = dy / len;
    } else a.near = 99;
    const ease = 1 - Math.pow(1 - T.GLANCE_EASE, frameDt / 16.7);
    a.gx += (tx - a.gx) * ease;
    a.gy += (ty - a.gy) * ease;
  }

  // The mouth: open when food is right in front, then a couple of chews after a bite.
  let deadNow = false; // the snake being drawn has just died: mouth shut
  let frameDt = 16;     // this frame's length, for easing
  function mouthOpen(s, a) {
    if (deadNow) return 0;
    const t = (lastNow - a.ateAt) / T.CHEW_MS;
    if (t >= 0 && t < 1) return 0.55 * Math.abs(Math.sin(t * Math.PI * 2));
    if (!game) return 0;
    const h = s.body[0];
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
  const lumas = new Map();
  function lumaOf(c) {
    let l = lumas.get(c);
    if (l === undefined) { l = c[0] === '#' ? luma(c) : 1; lumas.set(c, l); }
    return l;
  }

  // Every segment's fill: the look's pattern, fading toward the bark at the tail.
  function fillsOf(s, a, now) {
    const { look, color, n, fills } = a;
    if (s.personaKey === 'wildcard') { // a rainbow body, but an orange tan and a white collar up front
      const t0 = reduced ? 0 : Math.floor(now / 15);
      for (let i = 0; i < n; i++) fills[i] = HUES[(t0 + i * 28) % 360];
      fills[0] = '#f59a52';
      if (n > 1) fills[1] = '#f8fafc';
      return;
    }
    if (look === 'joker') {
      for (let i = 0; i < n; i++) fills[i] = i === 0 ? '#f8fafc' : i % 2 ? '#f59e0b' : '#a21caf';
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
    if (look === 'desperado') { if (n > 1) fills[1] = '#dc2626'; for (let i = 4; i < n; i += 4) fills[i] = '#fde68a'; } // bandana, poncho stripes
  }

  // Once a frame per snake: where each segment is (between its last two
  // cells), the cell each band bends through, radii and fills.
  function prepare(s, alpha, now, dead, impact = 0) {
    const a = animOf(s, now);
    const n = s.body.length;
    if (a.rad.length < n) {
      a.pts = new Float32Array(4 * n); a.cor = new Float32Array(4 * n);
      a.rad = new Float32Array(2 * n); a.fills = new Array(2 * n);
    }
    a.n = n;
    a.look = lookOf(s);
    a.color = colorOf(s);
    a.isPlayer = !s.persona;
    // A pale rim so dark bodies read on the bark (Joker's amber and white do already).
    a.rim = !a.isPlayer && a.look !== 'joker' && (a.look === 'vulture' || lumaOf(a.color) < 0.4);
    const prev = s.prev, { pts, cor } = a;
    for (let i = 0; i < n; i++) {
      const c = s.body[i];
      const p = prev && i < prev.length ? prev[i] : c;
      pts[2 * i] = (p.x + (c.x - p.x) * alpha) * CELL + CELL / 2;
      pts[2 * i + 1] = (p.y + (c.y - p.y) * alpha) * CELL + CELL / 2;
      // The band to the next segment runs through the cell this one left
      // (where the next one is headed), so a bend never cuts its corner.
      if (i < n - 1) {
        const q = prev && i < prev.length ? prev[i] : s.body[i + 1];
        cor[2 * i] = q.x * CELL + CELL / 2;
        cor[2 * i + 1] = q.y * CELL + CELL / 2;
      }
    }
    // A held corpse presses its head a little into whatever it hit.
    if (impact) { pts[0] += s.dir.x * CELL * impact; pts[1] += s.dir.y * CELL * impact; }
    // Gulps: a bulge that travels one segment per tick after each bite, and
    // the head's squash at the bite itself.
    a.tickPos = game ? game.tick - 1 + alpha : 0;
    const bite = (lastNow - a.ateAt) / T.BITE_MS;
    a.bump = !dead && bite >= 0 && bite < 1 ? (a.gulpR > T.GULP ? 0.2 : 0.12) * Math.sin(bite * Math.PI) : 0;
    for (let i = 0; i < n; i++) a.rad[i] = radius(i, n, a, a.tickPos);
    fillsOf(s, a, now);
    return a;
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

  // One straight piece of a band, half-width h, as a rectangle (pieces always
  // run along the grid; anything else would be a bug, drawn as a line).
  function piece(x1, y1, x2, y2, h) {
    if (near(y1, y2)) { if (!near(x1, x2)) ctx.fillRect(Math.min(x1, x2), y1 - h, Math.abs(x2 - x1), 2 * h); }
    else if (near(x1, x2)) ctx.fillRect(x1 - h, Math.min(y1, y2), 2 * h, Math.abs(y2 - y1));
    else {
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 2 * h;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }

  // The band from segment i to i + 1: through its corner cell. Straight, it's
  // one piece (two pieces meeting mid-band leave a hairline seam when a cell
  // isn't a whole number of pixels); at a bend the corner's circle covers the join.
  function band(a, i, h) {
    const p = a.pts, c = a.cor;
    const x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
    if ((near(x1, cx) && near(cx, x2)) || (near(y1, cy) && near(cy, y2))) piece(x1, y1, x2, y2, h);
    else { piece(x1, y1, cx, cy, h); piece(cx, cy, x2, y2, h); }
  }

  // Does the band from i to i + 1 turn a corner (and need its outside rounded)?
  function bends(a, i) {
    const p = a.pts, c = a.cor;
    const x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
    if ((near(x1, cx) && near(y1, cy)) || (near(x2, cx) && near(y2, cy))) return false;
    return !(near(x1, cx) && near(cx, x2)) && !(near(y1, cy) && near(cy, y2));
  }

  // The body's outline shape, `grow` units bigger all round, in the current fill.
  function silhouette(a, grow) {
    for (let i = a.n - 2; i >= 0; i--) band(a, i, a.rad[i + 1] * 0.8 + grow);
    for (let i = a.n - 1; i >= 0; i--) {
      if (i < a.n - 1 && bends(a, i)) circle(a.cor[2 * i], a.cor[2 * i + 1], a.rad[i + 1] * 0.8 + grow);
      circle(a.pts[2 * i], a.pts[2 * i + 1], a.rad[i] + grow);
    }
  }

  // The path through every segment centre and corner, head to tail.
  function spine(a) {
    ctx.beginPath();
    ctx.moveTo(a.pts[0], a.pts[1]);
    for (let i = 1; i < a.n; i++) {
      ctx.lineTo(a.cor[2 * i - 2], a.cor[2 * i - 1]);
      ctx.lineTo(a.pts[2 * i], a.pts[2 * i + 1]);
    }
  }

  // Pass 1, for every snake before any body: the shadow on the bark.
  function drawShadow(a) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = a.n - 1; i >= 0; i--) circle(a.pts[2 * i] + 2, a.pts[2 * i + 1] + 4, a.rad[i]);
  }

  // Pass 2: people's cream outline (yours bright with a soft halo, so you find
  // yourself at a glance; friends' plainer), or a dark body's pale rim. Each is
  // a slightly bigger copy of the body, so it follows the taper and every corner.
  const FRIEND_OUTLINE = '#cdbd9f', RIM = '#9a8069';
  // People share one face, so online seats differ by a marking as well as a
  // colour (lavender and sky look alike to many colour-blind players).
  const MARKS = { '#fde047': 'spots', '#c4b5fd': 'rings', '#7dd3fc': 'dots' };
  const markOf = color => MARKS[color] || '';
  function drawOutline(s, a) {
    if (a.isPlayer) {
      const mine = s.id === viewerId;
      if (mine) {
        ctx.strokeStyle = 'rgba(255,251,234,0.3)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = CELL * 1.34;
        spine(a);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,251,234,0.3)';
        circle(a.pts[0], a.pts[1], CELL * 0.78);
      }
      ctx.fillStyle = mine ? '#fffef8' : FRIEND_OUTLINE;
      silhouette(a, mine ? 3.5 : 2.5);
    } else if (a.rim) {
      ctx.fillStyle = RIM;
      silhouette(a, 1.5);
    }
  }

  // Pass 3: the body (bands, then circles tail to head, so the head ends up on
  // top), its pattern and its face.
  function drawBody(s, a, now, dead) {
    const { n, pts, rad, fills, look, color } = a;
    for (let i = n - 2; i >= 0; i--) { ctx.fillStyle = fills[i + 1]; band(a, i, rad[i + 1] * 0.8); }
    for (let i = n - 1; i >= 0; i--) {
      if (i < n - 1 && bends(a, i)) { ctx.fillStyle = fills[i + 1]; circle(a.cor[2 * i], a.cor[2 * i + 1], rad[i + 1] * 0.8); }
      ctx.fillStyle = fills[i];
      circle(pts[2 * i], pts[2 * i + 1], rad[i]);
    }

    // A little roundness on every segment.
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < n; i++) circle(pts[2 * i] - rad[i] * 0.3, pts[2 * i + 1] - rad[i] * 0.35, rad[i] * 0.35);

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
    if (s.personaKey === 'wildcard' && n > 2) drawTie(a);
    if (look === 'mason') { // bricks: a mortar line across, the joints staggered
      ctx.fillStyle = 'rgba(30,41,59,0.6)';
      for (let i = 1; i < n; i++) {
        const x = pts[2 * i], y = pts[2 * i + 1], r = rad[i];
        const off = i % 2 ? -r * 0.35 : r * 0.35;
        const ch = 0.937 * r; // half-chord of the circle at ±0.35r, so joints end on the edge
        ctx.fillRect(x - r, y - 0.8, 2 * r, 1.6);
        ctx.fillRect(x + off - 0.8, y - ch, 1.6, ch - 0.8);
        ctx.fillRect(x - off - 0.8, y + 0.8, 1.6, ch - 0.8);
      }
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
    if (s.personaKey === 'capricious') { // always findable, whatever the mood
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pts[0], pts[1], rad[0] + 2, 0, TAU);
      ctx.stroke();
    }

    // Head features, drawn in a frame where +x points the way the snake faces.
    const blinking = dead || now < a.blinkUntil;
    if (!dead && now > a.nextBlink) {
      a.blinkUntil = now + T.BLINK_MS;
      a.nextBlink = now + T.BLINK_MIN + Math.random() * (T.BLINK_MAX - T.BLINK_MIN);
    }
    if (!dead) updateGaze(s, look, a, now);
    headCos = s.dir.x; headSin = s.dir.y;
    gazeX = a.gx * headCos + a.gy * headSin; // the gaze, turned into the face's frame
    gazeY = -a.gx * headSin + a.gy * headCos;
    deadNow = dead;
    ctx.save();
    ctx.translate(pts[0], pts[1]);
    ctx.rotate(Math.atan2(s.dir.y, s.dir.x));
    ctx.scale(1.1 * (1 + a.bump), 1.1 * (1 + a.bump));
    if (a.isPlayer) drawPlayerFace(s, a, now, blinking);
    else drawFace(s, look, color, blinking, a);
    ctx.restore();

    // Capricious: a ring that flashes out when its mood changes.
    if (!reduced && s.personaKey === 'capricious' && s.memory.moodChangedAt != null && game) {
      const age = game.time - s.memory.moodChangedAt;
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
  const DASH = [3, 3], NO_DASH = [];

  // Wildcard's long red tie: knotted under the chin, down over the collar and
  // on along the body, bending with it.
  function drawTie(a) {
    const p = a.pts, c = CELL;
    const seg = (i, j) => { const dx = p[2 * j] - p[2 * i], dy = p[2 * j + 1] - p[2 * i + 1], len = Math.hypot(dx, dy) || 1; return [dx / len, dy / len, len]; };
    const [ax, ay] = seg(0, 1), [bx, by, blen] = seg(1, 2);
    // From the chin (just inside the head's edge) to the collar...
    const kx = p[0] + ax * c * 0.45, ky = p[1] + ay * c * 0.45;
    const mx = p[2], my = p[3];
    // ...then on toward the next segment, ending in a point.
    const end = Math.min(blen, c * 0.85), ex = mx + bx * end, ey = my + by * end;
    const quad = (x1, y1, w1, x2, y2, w2, dx, dy) => {
      ctx.moveTo(x1 - dy * w1, y1 + dx * w1); ctx.lineTo(x2 - dy * w2, y2 + dx * w2);
      ctx.lineTo(x2 + dy * w2, y2 - dx * w2); ctx.lineTo(x1 + dy * w1, y1 - dx * w1); ctx.closePath();
    };
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    quad(kx, ky, c * 0.07, mx, my, c * 0.12, ax, ay);
    quad(mx, my, c * 0.12, ex - bx * c * 0.12, ey - by * c * 0.12, c * 0.15, bx, by);
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

  // The living snakes, in passes, so no snake's shadow falls on another's body.
  const live = [];
  function drawSnakes(alpha, now) {
    live.length = 0;
    for (const s of game.snakes) if (s.alive) live.push(s);
    for (const s of live) drawShadow(prepare(s, alpha, now, false));
    for (const s of live) drawOutline(s, animOf(s, now));
    for (const s of live) drawBody(s, animOf(s, now), now, false);
  }

  // ---------------------------------------------------------------- faces

  // Shared helpers draw in the head's local frame (+x forward, one cell = CELL).
  // gazeX/gazeY: where this snake's eyes point (a unit vector in that frame).
  let blinkNow = false, gazeX = 1, gazeY = 0;
  let headCos = 1, headSin = 0; // the heading the face is drawn turned to

  // Closed eyes: two short lids (at x, ±y), or crosses if knocked out.
  function lids(r, x = 0.14, y0 = 0.2) {
    const c = CELL;
    ctx.strokeStyle = INK;
    ctx.lineWidth = c * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const y of [-y0, y0]) {
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
  function lookingEyes(r, x = 0.15, y = 0.2) {
    if (blinkNow) return lids(r * 1.3, x, y);
    const c = CELL, w = r * 1.55, reach = (w - r) * 0.85;
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
  // Colonist's tricorn: three corners (one forward), the brim wider than the head.
  const TRI_F = [0.1, 0], TRI_L = [-0.5, -0.6], TRI_R = [-0.5, 0.6], TRI_BOW = 0.1;
  function tricornSide(c, a, b) { // each side's middle pulled in toward the crown
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    ctx.quadraticCurveTo(c * (mx + (-0.28 - mx) * TRI_BOW * 2.4), c * (my * (1 - TRI_BOW * 2.4)), c * b[0], c * b[1]);
  }

  // Your face: white eyes whose pupils glance toward the nearest food, a
  // mouth that opens for a bite, a blink now and then, and a forked tongue flick.
  // A forked tongue flicked out and back every few seconds (more often when
  // food is near, if `keen`). `rate` stretches the wait: each snake its own rhythm.
  function tongue(a, now, open, rate, keen = false) {
    if (deadNow) return;
    if (now > a.nextTongue) {
      a.tongueUntil = now + T.TONGUE_MS;
      a.nextTongue = now + T.TONGUE_EVERY * rate * (keen && a.near <= 3 ? 0.4 : 0.7 + Math.random() * 0.8);
    }
    if (now >= a.tongueUntil || open >= 0.08) return;
    const c = CELL;
    const t = 1 - Math.abs((a.tongueUntil - now) / T.TONGUE_MS * 2 - 1); // out and back
    const reach = c * (0.42 + 0.3 * t);
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = c * 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c * 0.42, 0); ctx.lineTo(reach, 0);
    ctx.moveTo(reach, 0); ctx.lineTo(reach + c * 0.1, -c * 0.07);
    ctx.moveTo(reach, 0); ctx.lineTo(reach + c * 0.1, c * 0.07);
    ctx.stroke();
  }
  // How often each rival flicks its tongue (1 = like you; Vulture has a beak).
  const TONGUE_RATE = { gobbler: 0.6, creeper: 0.8, desperado: 0.8, joker: 0.9, drab: 1.8, ghost: 1.8, vulture: 0 };

  function drawPlayerFace(s, a, now, blinking) {
    const c = CELL;
    const open = mouthOpen(s, a);
    tongue(a, now, open, 1, true);
    mouth(open, 0.44);

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
    const rate = TONGUE_RATE[look] ?? 1.2;
    if (rate) tongue(a, lastNow, open, rate, look === 'gobbler');
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
        const hungry = a.near <= 3 ? 1 : 0;
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
        const beak = () => {
          ctx.beginPath();
          ctx.moveTo(c * 0.2, -c * 0.17);
          ctx.quadraticCurveTo(c * 0.56, -c * 0.17, c * 0.8, c * 0.04); // over the top to the hook
          ctx.quadraticCurveTo(c * 0.62, c * 0.14, c * 0.2, c * 0.17);
          ctx.closePath();
        };
        ctx.fillStyle = '#e7d7a8'; // pale horn, outlined dark so it reads small
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = c * 0.04;
        ctx.lineJoin = 'round';
        beak();
        ctx.fill();
        ctx.save();
        beak();
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
        beak();
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
      case 'metagamer': // round glasses, taped at the bridge, eyes on whoever it's studying
        mouth(open);
        lookingEyes(0.05);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = c * 0.06;
        ctx.beginPath();
        ctx.arc(c * 0.15, -c * 0.2, c * 0.14, 0, TAU);
        ctx.moveTo(c * 0.15 + c * 0.14, c * 0.2);
        ctx.arc(c * 0.15, c * 0.2, c * 0.14, 0, TAU);
        ctx.moveTo(c * 0.15, -c * 0.06); ctx.lineTo(c * 0.15, c * 0.06);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(c * 0.09, -c * 0.07, c * 0.12, c * 0.14);
        break;
      case 'wildcard': { // a golden combover swept forward with a flip at the front, squinty eyes, a pout
        // The hair, seen from above: a puffy golden mass at the back, combed
        // across to one side and forward, ending in a curl over that eye.
        const hair = () => {
          ctx.beginPath();
          ctx.moveTo(-c * 0.2, c * 0.44); // the back of the far side...
          ctx.bezierCurveTo(-c * 0.62, c * 0.42, -c * 0.66, -c * 0.3, -c * 0.32, -c * 0.5); // ...puffed out round the back...
          ctx.bezierCurveTo(-c * 0.04, -c * 0.62, c * 0.3, -c * 0.56, c * 0.36, -c * 0.34); // ...swept forward along the near side...
          ctx.bezierCurveTo(c * 0.4, -c * 0.2, c * 0.24, -c * 0.12, c * 0.18, -c * 0.24); // ...the curl over the brow...
          ctx.bezierCurveTo(c * 0.1, -c * 0.34, -c * 0.06, -c * 0.12, -c * 0.06, c * 0.08); // ...the parting line, back across...
          ctx.bezierCurveTo(-c * 0.06, c * 0.26, -c * 0.12, c * 0.38, -c * 0.2, c * 0.44);
          ctx.closePath();
        };
        ctx.save();
        ctx.translate(-c * 0.02, c * 0.03);
        hair();
        ctx.fillStyle = 'rgba(120,53,15,0.35)'; // its shadow on the head
        ctx.fill();
        ctx.restore();
        hair();
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
      case 'copycat': { // cat ears, cat eyes, whiskers, and a party pin
        poly(EAR, -1, color);
        poly(EAR, 1, color);
        poly(EAR_IN, -1, '#f9a8d4');
        poly(EAR_IN, 1, '#f9a8d4');
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
        // Party member: a little hammer and sickle on the back of the head.
        ctx.save();
        ctx.translate(-c * 0.2, 0);
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = '#fde047';
        ctx.fillStyle = '#fde047';
        ctx.lineWidth = c * 0.05;
        ctx.beginPath();
        ctx.arc(0, 0, c * 0.15, -Math.PI * 0.25, Math.PI * 0.95);
        ctx.stroke();
        ctx.rotate(-Math.PI / 4);
        ctx.fillRect(-c * 0.02, -c * 0.16, c * 0.04, c * 0.3); // handle
        ctx.fillRect(-c * 0.09, -c * 0.18, c * 0.18, c * 0.06); // head
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
        const eye = (y, w, r) => {
          const reach = (w - r) * 0.85, ox = gazeX * c * reach, oy = gazeY * c * reach;
          ctx.fillStyle = '#fffbea';
          circle(c * 0.15, c * y, c * w);
          ctx.fillStyle = INK;
          circle(c * 0.15 + ox, c * y + oy, c * r);
          catchlight(c * 0.15 + ox, c * y + oy, c * r);
        };
        eye(-0.21, 0.12, 0.07);
        eye(0.21, 0.075, 0.045);
        ctx.strokeStyle = INK;
        ctx.lineWidth = c * 0.045;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c * 0.03, c * 0.11);
        ctx.quadraticCurveTo(-c * 0.09, c * 0.2, c * 0.02, c * 0.31);
        ctx.stroke();
        break;
      }
      default:
        mouth(open);
        lookingEyes(0.06);
    }
    blinkNow = false;
  }

  // ------------------------------------------------------- homes and flags

  // Sovereign's home: a smooth tinted disc whose edge is exactly the trespass line.
  function drawHome(s) {
    const h = s.memory.home;
    const x = h.x * CELL + CELL / 2, y = h.y * CELL + CELL / 2, r = (h.radius + 1) * CELL;
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = s.color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.setLineDash(RING_DASH);
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.globalAlpha = 1;
  }
  const RING_DASH = [8, 6];

  // Colonist's colonies: a dashed ring and a St George flag in each.
  function drawColonies(s) {
    for (const c of s.memory.colonies) {
      const x = c.x * CELL + CELL / 2, y = c.y * CELL + CELL / 2;
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.setLineDash(RING_DASH);
      ctx.beginPath(); ctx.arc(x, y, (c.radius + 1) * CELL, 0, TAU); ctx.stroke();
      ctx.setLineDash(NO_DASH);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#e7d7b1';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y + CELL * 0.6); ctx.lineTo(x, y - CELL * 0.9); ctx.stroke();
      const w = CELL * 0.9, h = CELL * 0.6, top = y - CELL * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, top, w, h);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + w * 0.4, top, w * 0.2, h);
      ctx.fillRect(x, top + h * 0.38, w, h * 0.24);
    }
  }

  // ------------------------------------------------------------ the frame

  let shakeUntil = 0, shakePx = 0, lastNow = 0;

  // alpha: how far the current tick has played out (0..1).
  function frame(alpha, now) {
    if (!game || !sized) return;
    if (!staticLayer) resetStatic();
    const dt = lastNow ? Math.min(64, now - lastNow) : 16;
    lastNow = now;
    frameDt = Math.max(1, dt);
    syncHoles();
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

    for (const s of game.snakes) {
      if (!s.alive) continue;
      if (s.memory.home) drawHome(s);
      if (s.memory.colonies) drawColonies(s);
    }

    // The woodpecker perches on its newest hole (which can never be played
    // on), facing into the board, under anything it shares a cell with.
    const wp = game.woodpecker;
    if (wp) {
      const peck = reduced ? 0 : Math.max(0, 1 - (game.time - wp.at) / T.PECK_MS) * 3;
      const right = wp.x < GRID / 2;
      blitCrisp(birdSprite(right ? 'r' : 'l'), wp.x * CELL + CELL / 2 + (right ? peck : -peck), wp.y * CELL + CELL * 0.4);
    }

    const bob = reduced ? 0 : 1;
    for (const f of game.food) {
      const x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2;
      const phase = (f.x * 7 + f.y * 13) % 10; // each item bobs on its own beat
      if (f.kind === 'beetle') drawBeetle(f, alpha, now);
      else if (f.kind === 'food') blitCrisp(appleSprite(), x, y + bob * Math.sin(now / 420 + phase) * 1.6);
      else if (f.kind === 'pellet') { if (!heldCells[f.y * GRID + f.x]) blitCrisp(meatSprite(f.color), x, y); }
      else if (f.kind === 'mushroom') {
        ctx.save();
        ctx.translate(x, y + CELL * 0.3);
        ctx.rotate(bob * Math.sin(now / 650 + phase) * 0.06);
        blit(mushroomSprite(), 0, -CELL * 0.3);
        ctx.restore();
      } else if (f.kind === 'golden') {
        // A calm dim instead of a blink when it's about to rot.
        const left = f.expires - game.tick;
        const fade = left > T.GOLDEN_DIM_TICKS ? 1 : 0.45 + 0.55 * (left / T.GOLDEN_DIM_TICKS);
        blitCrisp(glowSprite(), x, y, fade);
        blitCrisp(goldenSprite(), x, y + bob * Math.sin(now / 380 + phase) * 1.8, fade);
        ctx.save();
        ctx.translate(x + CELL * 0.2, y - CELL * 0.22);
        ctx.rotate(reduced ? 0 : now / 900);
        blit(starSprite(), 0, 0, fade);
        ctx.restore();
      }
    }

    if (corpses.length) drawCorpses(alpha, now);
    drawSnakes(alpha, now);
    drawParticles(dt);
    drawFloaters(dt);
  }

  // ------------------------------------------------------------ the world

  // Call after every tick, with that tick's events: sets off pops, gulps and puffs.
  function onTick(events) {
    if (!game) return;
    const now = lastNow || performance.now(); // the frame clock, like everything else drawn
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
        else if (e.kind === 'beetle') spawn(x, y, T.PARTICLES_EAT + 4, 200, T.PARTICLE_LIFE, 3, '#059669', '#fbbf24'); // emerald and gold, a crunchy catch
        else if (e.kind === 'pellet') spawn(x, y, T.PARTICLES_EAT - 4, 150, T.PARTICLE_LIFE * 0.8, 2.6, e.color && e.color[0] === '#' ? e.color : '#c2410c', '#f6ecd2');
        else if (e.kind === 'mushroom') spawn(x, y, T.PARTICLES_EAT - 2, 160, T.PARTICLE_LIFE, 2.6, '#dc2626', '#fffbea');
        else spawn(x, y, T.PARTICLES_EAT, 180, T.PARTICLE_LIFE, 2.8, '#a3e635', '#fde68a'); // sprout and honey: visible on bark and on green snakes alike
        if (e.snake.id === viewerId && e.kind !== 'mushroom') floater(e.x * CELL + CELL / 2, Math.max(CELL * 1.3, e.y * CELL - CELL * 0.6), e.kind === 'golden' ? '+3' : e.kind === 'beetle' ? '+2' : '+1');
      } else if (e.type === 'death') {
        deaths.push(e.snake); // bursts on the next frame, unless the moment is held
      } else if (e.type === 'peck') {
        spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 5, 120, 380, 2, '#a16207', '#f6ecd2');
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

  function burst(s) {
    const col = colorOf(s);
    for (let i = 0; i < s.body.length; i += 3) {
      const c = s.body[i];
      spawn(c.x * CELL + CELL / 2, c.y * CELL + CELL / 2, Math.max(2, Math.round(T.PARTICLES_DEATH / Math.ceil(s.body.length / 3))), 200, T.PARTICLE_LIFE * 1.2, 3, col[0] === '#' ? col : '#f6ecd2', '#a16207');
    }
  }

  // Before drawing: unheld deaths burst; held ones whose time is up burst or start fading.
  function updateCorpses(now) {
    for (const s of deaths) {
      if (reduced) corpses.push({ s, until: now, fade: true });
      else burst(s);
    }
    deaths.length = 0;
    heldCells.fill(0);
    for (let i = corpses.length - 1; i >= 0; i--) {
      const c = corpses[i];
      if (!c.fade && now >= c.until) {
        if (reduced) c.fade = true;
        else { burst(c.s); corpses.splice(i, 1); continue; }
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
      drawShadow(a);
      drawOutline(c.s, a);
      drawBody(c.s, a, now, true);
      ctx.globalAlpha = 1;
      if (hit) { // at the point of contact, kept on the board
        const sx = Math.min(SIZE, Math.max(0, a.pts[0] + c.s.dir.x * CELL * 0.55));
        const sy = Math.min(SIZE, Math.max(0, a.pts[1] + c.s.dir.y * CELL * 0.55));
        blitCrisp(starSprite(), sx, sy);
      }
    }
    ctx.globalAlpha = 1;
  }

  function shake(px) {
    shakePx = px;
    shakeUntil = performance.now() + T.SHAKE_MS;
  }

  // Where a snake's head is drawn right now, in CSS pixels from the board's
  // top-left (for speech bubbles). boardPx is the board's CSS width.
  function headPx(s, alpha, boardPx, out) {
    const c = s.body[0], p = s.prev && s.prev[0] ? s.prev[0] : c;
    const scale = boardPx / GRID;
    out.x = (p.x + (c.x - p.x) * alpha + 0.5) * scale;
    out.y = (p.y + (c.y - p.y) * alpha + 0.5) * scale;
    return out;
  }

  // Size the backing store to the board's real size × devicePixelRatio.
  // cssPx comes from a ResizeObserver, so no layout is read here.
  // The backing store matches the device pixels the canvas covers exactly, so
  // the browser never resamples it (devicePx comes from the ResizeObserver
  // where supported). It's capped at MAX_BACKING pixels across (a large board
  // on a dense screen), not at a density, so small dense phones stay crisp.
  const MAX_BACKING = 2048;
  function resize(cssPx, devicePx) {
    const dpr = window.devicePixelRatio || 1;
    const estimate = Math.round(cssPx * dpr);
    const exact = devicePx && Math.abs(devicePx - estimate) <= 2 ? devicePx : estimate;
    const target = Math.max(GRID, Math.min(MAX_BACKING, exact));
    if (target === canvas.width && sized) return false;
    sized = true;
    devPerCss = target / cssPx;
    canvas.width = canvas.height = target;
    k = target / SIZE;
    barkLayer = null;
    sprites.clear();
    resetStatic();
    syncHoles();
    return true;
  }

  function init(opts) {
    canvas = opts.canvas;
    ctx = canvas.getContext('2d', { alpha: false });
    PERSONAS = opts.personas;
    k = canvas.width / SIZE;
    // Text sprites drawn before the font arrived get redrawn with it.
    document.fonts?.ready.then(() => sprites.delete('float'));
  }

  function setGame(g) {
    game = g;
    deaths.length = 0;
    corpses.length = 0;
    pLive = 0;
    plife.fill(0);
    flife.fill(0);
    resetStatic();
  }

  return {
    init, setGame, resize, frame, onTick, shake, hold, headPx, colorOf, markOf,
    holding: () => deaths.length > 0 || corpses.length > 0,
    setViewer(id) { viewerId = id; },
    setReducedMotion(v) { reduced = v; },
    get particles() { return pLive; },
  };
})();
