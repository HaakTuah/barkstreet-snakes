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

  // The bark, drawn once per round at the current resolution: a different
  // stretch of the same tree each round (a new seed). Light through the canopy,
  // furrows, raised plates with lit edges, cracks, knots with growth rings,
  // moss and lichen. Faint carved grid lines are baked in so they land on
  // whole device pixels.
  let barkLayer = null, staticLayer = null, holesDrawn = 0, sized = false;
  let barkSeed = 7;

  function buildBark() {
    const px = SIZE * k;
    const b = makeLayer(px, px);
    const g = b.getContext('2d');
    g.scale(k, k);
    let seed = barkSeed;
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
    // Raised plates between the furrows, lit along their upper-left edge.
    for (let i = 0; i < 170; i++) {
      const x = rnd() * SIZE, y = rnd() * SIZE, w = 5 + rnd() * 9, h = 18 + rnd() * 46, a = (rnd() - 0.5) * 0.2;
      g.fillStyle = `rgba(122,86,50,${0.1 + rnd() * 0.14})`;
      g.beginPath(); g.ellipse(x, y, w, h, a, 0, TAU); g.fill();
      g.strokeStyle = `rgba(196,154,102,${0.1 + rnd() * 0.12})`;
      g.lineWidth = 1.4;
      g.beginPath(); g.ellipse(x, y, w, h, a, Math.PI * 0.85, Math.PI * 1.2); g.stroke();
    }
    // Cracks: thin, dark and jagged.
    g.strokeStyle = 'rgba(16,8,2,0.45)';
    g.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      let x = rnd() * SIZE, y = rnd() * SIZE;
      g.lineWidth = 1 + rnd() * 1.5;
      g.beginPath(); g.moveTo(x, y);
      for (let j = 0, n = 3 + rnd() * 4; j < n; j++) { x += (rnd() - 0.5) * 10; y += 6 + rnd() * 12; g.lineTo(x, y); }
      g.stroke();
    }
    // Knots, with the growth rings round them.
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
    // Moss: soft clusters of muted green flecks (dull, so they never pass for food).
    for (let i = 0; i < 6; i++) {
      const cx = rnd() * SIZE, cy = rnd() * SIZE, spread = 16 + rnd() * 26;
      for (let j = 0; j < 70; j++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * spread;
        g.fillStyle = `rgba(${92 + rnd() * 26 | 0},${112 + rnd() * 26 | 0},52,${0.22 + rnd() * 0.28})`;
        dot(cx + Math.cos(a) * d * 0.8, cy + Math.sin(a) * d * 1.3, 1.2 + rnd() * 2.4);
      }
    }
    // Lichen: faint, pale grey-green crusts.
    for (let i = 0; i < 7; i++) {
      const cx = rnd() * SIZE, cy = rnd() * SIZE, r = 6 + rnd() * 9;
      g.fillStyle = 'rgba(190,202,166,0.1)';
      for (let j = 0; j < 12; j++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * r; dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 1.4, 2 + rnd() * 3); }
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

  // Leaf shadows from the canopy overhead: soft dark dapples on a small layer
  // (it's all soft, so a low resolution is plenty), drawn stretched over the
  // board and swaying in the wind. Built once per round.
  let shadeLayer = null;
  function buildShade() {
    const n = 256, s = makeLayer(n, n), g = s.getContext('2d');
    let seed = barkSeed * 7 + 3;
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
  function drawCanopy(now) {
    if (!shadeLayer) shadeLayer = buildShade();
    const t = reduced ? 0 : now / 1000, over = SIZE * 0.06;
    const dx = Math.sin(t * 0.43) * 8 + Math.sin(t * 1.7) * 1.6, dy = Math.cos(t * 0.37) * 6 + Math.sin(t * 1.3) * 1.2;
    ctx.drawImage(shadeLayer, dx - over, dy - over, SIZE + 2 * over, SIZE + 2 * over);
  }

  // Now and then an autumn leaf drifts down the trunk, swaying and turning
  // (under the food and the snakes, so it never hides anything that matters).
  const fallen = [];
  let nextLeaf = 0;
  const LEAVES = ['#d97706', '#ca8a04', '#b45309', '#a16207'];
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
    if (reduced) { fallen.length = 0; return; }
    if (!nextLeaf) nextLeaf = now + 1500 + Math.random() * 3000;
    if (now > nextLeaf && fallen.length < 3) {
      nextLeaf = now + 4500 + Math.random() * 6500;
      fallen.push({
        x: SIZE * (0.1 + Math.random() * 0.8), y: -CELL, vx: (Math.random() - 0.5) * 30, vy: 26 + Math.random() * 18,
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

  function drawAppleShape(g, body) {
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
  // colours and markings (Wildcard's rainbow, Mason's bricks, Colonist's
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

  // A jewel beetle, drawn live: an emerald shell with a gold rim, six legs and
  // feelers. It steps off and settles into its next cell during the tick it
  // moves (a beetle's walk: step, pause), legs scuttling, and turns smoothly.
  // Between steps it's never quite still: its feelers wave, it breathes, and
  // every few seconds it lifts its wing cases and buzzes, as if about to fly
  // off. Scared, it trembles. It pops in when it comes out.
  let beetleAng = null, beetleAt = 0;
  function drawBeetle(f, alpha, now) {
    const moved = game && f.movedAt === game.tick - 1 && f.px != null;
    const e = moved ? alpha * alpha * (3 - 2 * alpha) : 1;
    const gx = moved ? f.px + (f.x - f.px) * e : f.x, gy = moved ? f.py + (f.y - f.py) * e : f.y;
    let x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2;
    const c = CELL, lively = !reduced, t = now / 1000;
    const walking = moved && lively;
    const pop = beetleAt ? popOf(now - beetleAt) : 1;
    if (pop <= 0) return;
    const heading = Math.atan2(f.dir.y, f.dir.x);
    if (beetleAng === null || !lively) beetleAng = heading;
    else beetleAng += Math.atan2(Math.sin(heading - beetleAng), Math.cos(heading - beetleAng)) * Math.min(1, frameDt / 60);
    if (lively && f.scared && !moved) { x += Math.sin(now / 23) * 0.7; y += Math.cos(now / 31) * 0.7; } // trembling
    const step = walking ? Math.sin(now / (f.scared ? 28 : 45)) : 0;
    const cycle = ((now - beetleAt) / 1000) % 3.4; // the wing cases lift late in each cycle, if it's not walking
    const lift = lively && !walking && cycle > 2.7 ? Math.sin((cycle - 2.7) / 0.7 * Math.PI) : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; // shadow
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, c * 0.38 * pop, c * 0.3 * pop, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(beetleAng + step * 0.07);
    const size = 1.35 * pop * (1 + (lively ? Math.sin(t * 3.1) * 0.02 : 0)); // about an apple's size, so it's easy to spot
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
      for (const sg of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(-c * 0.26 * lift, sg * c * 0.14 * lift, c * 0.34 * buzz * lift, c * 0.1, -sg * 0.45 * lift, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
    // ...then the shell: two emerald wing cases with a gold rim, which swing
    // out from the front when it lifts them; the split down the middle and a shine.
    ctx.lineWidth = c * 0.03;
    for (const sg of [-1, 1]) {
      ctx.save();
      if (lift > 0) { ctx.translate(c * 0.16, 0); ctx.rotate(-sg * 0.4 * lift); ctx.translate(-c * 0.16, 0); }
      ctx.fillStyle = '#059669';
      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(-c * 0.02, 0, c * 0.22, c * 0.17, 0, sg < 0 ? Math.PI : 0, sg < 0 ? TAU : Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (sg < 0) { ctx.fillStyle = 'rgba(209,250,229,0.55)'; circle(c * 0.04, -c * 0.08, c * 0.045); }
      ctx.restore();
    }
    if (!lift) {
      ctx.strokeStyle = 'rgba(6,47,35,0.8)';
      ctx.beginPath();
      ctx.moveTo(c * 0.18, 0); ctx.lineTo(-c * 0.23, 0);
      ctx.stroke();
    }
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
  const FLOAT_FILL = { 'KO!': '#f87171', 'Bonk!': '#fdba74' }; // (the rest in honey)
  const drawFloat = (g, text) => {
    g.font = FLOAT_FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = CELL * 0.14;
    g.strokeStyle = 'rgba(58,38,20,0.85)';
    g.strokeText(text, 0, 0);
    g.fillStyle = FLOAT_FILL[text] || '#fde68a';
    g.fillText(text, 0, 0);
  };
  let fNext = 0;
  function floater(x, y, text) {
    const half = CELL * (text.length > 3 ? 1.15 : 0.7); // (kept inside the board, words and all)
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
      const sp = sprite('float', ftext[i], drawFloat);
      if (reduced || t < 0.86) blitCrisp(sp, fx[i], y, Math.min(1, t * 1.6));
      else { // ...after popping in, from big
        const w = SPRITE * CELL * (1 + (t - 0.86) / 0.14 * 0.7);
        ctx.drawImage(sp, fx[i] - w / 2, y - w / 2, w, w);
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
    if (look === 'mason') { // Caesar in marble: grey veins wandering across every segment, now and then a gold one
      ctx.lineCap = 'round';
      for (let gold = 0; gold < 2; gold++) {
        ctx.strokeStyle = gold ? 'rgba(201,162,39,0.75)' : 'rgba(100,116,139,0.55)';
        ctx.lineWidth = gold ? 1.1 : 1.4;
        ctx.beginPath();
        for (let i = 1; i < n; i++) {
          if (gold !== (i % 4 === 3 ? 1 : 0)) continue;
          marbleVein(pts[2 * i], pts[2 * i + 1], rad[i], i);
        }
        ctx.stroke();
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
  const DASH = [3, 3], NO_DASH = [], MOOD_DASH = [5, 7];

  // Marble veins across a disc (centre x, y, radius r), their own way for
  // each segment i: a long wandering one and a short faint one beside it,
  // added to the current path.
  function marbleVein(x, y, r, i) {
    const a = i * 2.39996, f = i % 2 ? 1 : -1;
    const arc = (a0, a1, bend, reach) => {
      const x0 = x + Math.cos(a0) * r * reach, y0 = y + Math.sin(a0) * r * reach;
      const x1 = x + Math.cos(a1) * r * reach, y1 = y + Math.sin(a1) * r * reach;
      const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(mx, my, x1, y1);
    };
    arc(a, a + 2.6, 0.35 * f, 0.85);
    arc(a + 3.6, a + 4.7, -0.5 * f, 0.7);
  }

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
    joker: [1, 2.2, blower], copycat: [1.2, 1.4, blep],
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
    flickP = 1 - (a.tongueUntil - now) / a.tongueMs;
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
    const tube = (x0, len, w) => {
      ctx.fillStyle = '#d4a017';
      ctx.fillRect(c * x0, -c * w, c * len, c * w * 2);
      ctx.fillStyle = '#fde68a'; // a shine along the top
      ctx.fillRect(c * x0, -c * w, c * len, c * w * 0.6);
      ctx.fillStyle = '#78350f'; // a ring at the front
      ctx.fillRect(c * (x0 + len - 0.03), -c * w, c * 0.03, c * w * 2);
    };
    ctx.fillStyle = '#bae6fd'; // the lens
    ctx.fillRect(c * (x + 0.38 * e + 0.17), -c * 0.06, c * 0.035, c * 0.12);
    tube(x + 0.38 * e, 0.19, 0.075); // the thinnest slides furthest...
    tube(x + 0.2 * e, 0.2, 0.095);
    tube(x, 0.22, 0.12); // ...out of the widest
  }

  // Vulture: a bone, held crosswise and chewed on a moment.
  function bone(t, p) {
    const c = CELL, k = stayOut(t, 3);
    ctx.translate(c * 0.64, 0);
    ctx.rotate(0.3 + Math.sin(p * 14) * 0.08);
    ctx.scale(k, k);
    const shape = () => {
      ctx.beginPath();
      ctx.rect(-c * 0.045, -c * 0.25, c * 0.09, c * 0.5);
      for (const y of [-0.26, 0.26]) for (const x of [-0.05, 0.05]) {
        ctx.moveTo(c * (x + 0.06), c * y);
        ctx.arc(c * x, c * y, c * 0.06, 0, TAU);
      }
    };
    ctx.strokeStyle = '#57534e'; // an outline round the whole bone...
    ctx.lineWidth = c * 0.05;
    shape();
    ctx.stroke();
    ctx.fillStyle = '#f5f5f4'; // ...then the bone over it
    shape();
    ctx.fill();
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
    const roll = (x, rad) => { // a rolled end: the roll, its rod's knobs either side
      ctx.fillStyle = '#d9c38c';
      ctx.fillRect(c * (x - rad), -c * (w + 0.015), c * rad * 2, c * (w + 0.015) * 2);
      ctx.fillStyle = 'rgba(58,38,20,0.25)';
      ctx.fillRect(c * (x + rad * 0.3), -c * (w + 0.015), c * rad * 0.7, c * (w + 0.015) * 2);
      ctx.fillStyle = '#7c2d12';
      circle(c * x, -c * (w + 0.05), c * 0.04);
      circle(c * x, c * (w + 0.05), c * 0.04);
    };
    roll(x0, 0.035);
    roll(x1, rr);
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
    ctx.font = `800 ${c * 0.2}px sans-serif`;
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

  // Joker: a party blower that unrolls with a toot, then curls back up.
  function blower(t) {
    const c = CELL, e = stayOut(t, 1.4), k = Math.min(1, t * 5);
    ctx.translate(c * 0.4, 0); // (pops out of the mouth)
    ctx.scale(k, k);
    ctx.translate(-c * 0.4, 0);
    const x = 0.46 + 0.5 * e, rr = 0.03 + 0.07 * (1 - e), sweep = 0.4 + 5 * (1 - e);
    ctx.lineWidth = c * 0.1;
    ctx.beginPath();
    ctx.moveTo(c * 0.44, 0); ctx.lineTo(c * x, 0);
    ctx.arc(c * x, -c * rr, c * rr, Math.PI / 2, Math.PI / 2 - sweep, true);
    ctx.strokeStyle = '#a21caf';
    ctx.stroke();
    ctx.setLineDash([c * 0.05, c * 0.05]); // striped
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.fillStyle = '#facc15'; // the mouthpiece
    ctx.fillRect(c * 0.36, -c * 0.05, c * 0.1, c * 0.1);
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

  // Your face: white eyes whose pupils glance toward the nearest food, a
  // mouth that opens for a bite, a blink now and then, and a forked tongue flick.

  function drawPlayerFace(s, a, now, blinking) {
    const c = CELL;
    const open = mouthOpen(s, a);
    tongue(a, now, open, 'player', true);
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
    const flicks = look === 'copycat' ? copiedLook(s) : look;
    tongue(a, lastNow, open, flicks, flicks === 'gobbler', look !== 'sniper');
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

  // The Union Flag, as flown over the Empire's colonies (a redcoat's flag: St
  // George's cross for England, St Andrew's saltire for Scotland, St Patrick's,
  // counterchanged, for Ireland), 5:3, its hoist at the sprite's centre.
  const UNION_W = 0.95, UNION_H = 0.57;
  const unionSprite = () => sprite('union', '', drawUnion);
  const drawUnion = g => {
    const c = CELL, w = c * UNION_W, h = c * UNION_H, y0 = -h / 2, u = h / 30;
    g.save();
    g.beginPath(); g.rect(0, y0, w, h); g.clip();
    g.fillStyle = '#012169';
    g.fillRect(0, y0, w, h);
    const cx = w / 2, cy = 0;
    g.lineCap = 'butt';
    g.strokeStyle = '#ffffff';
    g.lineWidth = 6 * u;
    g.beginPath(); g.moveTo(0, y0); g.lineTo(w, y0 + h); g.moveTo(w, y0); g.lineTo(0, y0 + h); g.stroke();
    // St Patrick's: each arm offset to one side of the white (anticlockwise), so it turns like a pinwheel.
    g.strokeStyle = '#c8102e';
    g.lineWidth = 2 * u;
    g.beginPath();
    for (const [ex, ey] of [[0, y0], [w, y0], [w, y0 + h], [0, y0 + h]]) {
      const len = Math.hypot(ex - cx, ey - cy), dx = (ex - cx) / len, dy = (ey - cy) / len, nx = dy * u, ny = -dx * u;
      g.moveTo(cx + nx, cy + ny); g.lineTo(ex + nx, ey + ny);
    }
    g.stroke();
    g.fillStyle = '#ffffff';
    g.fillRect(0, -5 * u, w, 10 * u);
    g.fillRect(cx - 5 * u, y0, 10 * u, h);
    g.fillStyle = '#c8102e';
    g.fillRect(0, -3 * u, w, 6 * u);
    g.fillRect(cx - 3 * u, y0, 6 * u, h);
    g.restore();
    g.strokeStyle = 'rgba(15,23,42,0.4)';
    g.lineWidth = 1;
    g.strokeRect(0, y0, w, h);
  };
  // Drawn in vertical strips that ripple from the pole outward, so it flies.
  const FLAG_STRIPS = 8;
  function drawFlag(x, top, now, phase) {
    const sp = unionSprite(), half = SPRITE * CELL / 2, dev = sp.width / (SPRITE * CELL);
    const w = CELL * UNION_W, h = CELL * UNION_H, sw = w / FLAG_STRIPS;
    for (let i = 0; i < FLAG_STRIPS; i++) {
      const out = (i + 0.5) / FLAG_STRIPS;
      const dy = reduced ? 0 : Math.sin(now / 180 - i * 0.9 + phase) * CELL * 0.05 * out;
      // (each strip a hair wider than its slot, so no seams show between them)
      ctx.drawImage(sp, (half + i * sw) * dev, (half - h / 2) * dev, (sw + 0.6) * dev, h * dev, x + i * sw, top + dy, sw + 0.6, h);
    }
  }

  // Colonist's colonies: a dashed ring and the Union Flag flying over each.
  function drawColonies(s, now) {
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
      ctx.beginPath(); ctx.moveTo(x, y + CELL * 0.6); ctx.lineTo(x, y - CELL * 0.95); ctx.stroke();
      ctx.fillStyle = '#facc15'; // a gilt finial
      circle(x, y - CELL * 0.97, 2.6);
      drawFlag(x + 1.5, y - CELL * 0.92, now, c.x * 0.7 + c.y * 1.3);
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
        b = { kind: f.kind, at: now + (fresh ? 200 + 90 * n : 0), i: 0, next: 0, gen: 0, v: (f.color || '#a16207') + '|' };
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

  // A dead snake's beads: what each one looks like, and a ripple from head to tail.
  function noteRemains(s, now) {
    for (let i = 0; i < s.body.length; i++) {
      const key = s.body[i].y * GRID + s.body[i].x, old = born.get(key);
      if (old && old.kind !== 'pellet') continue; // (food there stays food)
      born.set(key, { kind: 'pellet', at: now + i * RIPPLE_MS, i, next: 0, gen: bornGen, v: beadOf(s, i) });
    }
  }

  // The bead a snake leaves at body segment i: its own colours and markings.
  function beadOf(s, i) {
    const look = lookOf(s), col = colorOf(s);
    let fill = col[0] === '#' ? col : '#a16207', mark = '';
    if (s.personaKey === 'wildcard') fill = i === 0 ? '#f59a52' : i === 1 ? '#f8fafc' : HUES[(i * 28) % 360];
    else if (look === 'joker') fill = i === 0 ? '#f8fafc' : i % 2 ? '#f59e0b' : '#a21caf';
    else if (look === 'sniper' && i % 3 === 2) fill = mix(fill, '#fca5a5', 0.35);
    else if (look === 'vulture' && i < 2) fill = i ? '#f5f5f4' : '#f9a8d4';
    else if (look === 'desperado' && i === 1) fill = '#dc2626';
    else if (look === 'desperado' && i >= 4 && i % 4 === 0) fill = '#fde68a';
    if (!s.persona) mark = MARKS[col] || '';
    else if (look === 'mason') mark = i % 4 === 3 ? 'marble2' : 'marble';
    else if (look === 'colonist') mark = i % 2 ? 'strap' : 'strap2';
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
  function drawMushroomAt(f, x, y, t, pop) {
    const lively = !reduced;
    const left = f.expires != null ? f.expires - game.tick : 99;
    const wilt = left < 30 ? 1 - left / 30 : 0;
    const breathe = lively ? Math.sin(t * 5.1) * 0.04 : 0;
    const lean = (lively ? Math.sin(t * 2.5) * 0.12 : 0) + 0.5 * wilt * (f.x % 2 ? 1 : -1);
    ctx.globalAlpha = 1 - 0.4 * wilt;
    shadowAt(x + 1, y + CELL * 0.36, pop * (1 - 0.25 * wilt));
    blitAbout(mushroomSprite(), x, y, 0, CELL * 0.34, pop * (1 - 0.2 * wilt) * (1 - breathe * 0.5), pop * (1 - 0.3 * wilt) * (1 + breathe), lean);
    ctx.globalAlpha = 1;
  }

  // Ambient motes from a small pool: spores drifting up off the mushrooms
  // (kind 0) and glints twinkling round a golden apple (kind 1).
  const MAX_M = 48;
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
  function drawMotes(dt) {
    if (!mLive) return;
    const st = dt / 1000;
    let live = 0;
    ctx.fillStyle = '#fdf2f8';
    for (let i = 0; i < MAX_M; i++) {
      if (mlife[i] <= 0) continue;
      mlife[i] -= dt;
      mx[i] += mvx[i] * st;
      my[i] += mvy[i] * st;
      const t = Math.max(0, mlife[i] / mmax[i]), fade = Math.sin(t * Math.PI); // in and out
      live++;
      if (mkind[i] === 0) {
        mx[i] += Math.sin(mlife[i] / 160) * 0.15; // wafting
        ctx.globalAlpha = 0.75 * fade;
        circle(mx[i], my[i], msize[i]);
      } else {
        const w = SPRITE * CELL * msize[i] * fade;
        ctx.globalAlpha = fade;
        ctx.drawImage(starSprite(), mx[i] - w / 2, my[i] - w / 2, w, w);
      }
    }
    ctx.globalAlpha = 1;
    mLive = live;
  }

  // Every piece of food on the board, under the snakes.
  function drawFood(alpha, now) {
    trackFood(now);
    const lively = !reduced;
    for (const f of game.food) {
      if (f.kind === 'beetle') { drawBeetle(f, alpha, now); continue; }
      const key = f.y * GRID + f.x, b = born.get(key);
      if (f.kind === 'pellet' && heldCells[key]) { if (b) b.at = now + b.i * RIPPLE_MS; continue; } // (under a held corpse: not yet)
      const pop = b ? popOf(now - b.at) : 1;
      if (pop <= 0) continue;
      const x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2;
      const t = now / 1000 + ((f.x * 7 + f.y * 13) % 10) * 0.63; // each piece on its own beat
      if (f.kind === 'food') drawAppleAt(appleSprite(), x, y, t, pop, 1);
      else if (f.kind === 'pellet') {
        const h = lively ? 0.5 - 0.5 * Math.cos(t * 3) : 0;
        shadowAt(x + 1, y + CELL * 0.3, pop * 0.85 * (1 - 0.2 * h));
        const sz = pop * (1 + (lively ? Math.sin(t * 6) * 0.03 : 0));
        blitAbout(beadSprite(b ? b.v : (f.color || '#a16207') + '|'), x, y - h * 1.8, 0, 0, sz, sz, 0);
      } else if (f.kind === 'mushroom') {
        drawMushroomAt(f, x, y, t, pop);
        if (lively && b && pop >= 1 && now > b.next) {
          b.next = now + 800 + Math.random() * 1000;
          mote(x + (Math.random() - 0.5) * CELL * 0.5, y - CELL * 0.12, (Math.random() - 0.5) * 8, -12 - Math.random() * 8, 1700, 1.3 + Math.random() * 0.9, 0);
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
    drawCanopy(now);

    for (const s of game.snakes) {
      if (!s.alive) continue;
      if (s.memory.home) drawHome(s);
      if (s.memory.colonies) drawColonies(s, now);
    }

    // The woodpecker perches on its newest hole (which can never be played
    // on), facing into the board, under anything it shares a cell with.
    const wp = game.woodpecker;
    if (wp) {
      const peck = reduced ? 0 : Math.max(0, 1 - (game.time - wp.at) / T.PECK_MS) * 3;
      const right = wp.x < GRID / 2;
      blitCrisp(birdSprite(right ? 'r' : 'l'), wp.x * CELL + CELL / 2 + (right ? peck : -peck), wp.y * CELL + CELL * 0.4);
    }

    drawLeaves(now, dt);
    drawFood(alpha, now);

    if (corpses.length) drawCorpses(alpha, now);
    drawSnakes(alpha, now);
    drawMotes(dt);
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
        eatenNow.add(e.y * GRID + e.x);
        if (e.snake.id === viewerId && e.kind !== 'mushroom') floater(e.x * CELL + CELL / 2, Math.max(CELL * 1.3, e.y * CELL - CELL * 0.6), e.kind === 'golden' ? '+3' : e.kind === 'beetle' ? '+2' : '+1');
      } else if (e.type === 'death') {
        deaths.push(e.snake); // bursts on the next frame, unless the moment is held
        noteRemains(e.snake, now);
        // A comic-book word where it went down: KO! if a snake did it, Bonk! for a wall or a hole.
        const k = e.snake.killer, h = e.snake.body[0];
        if (k !== 'hunger') floater(h.x * CELL + CELL / 2, Math.max(CELL * 1.3, h.y * CELL - CELL * 0.2), k === 'wall' || k === 'self' || !game.snakes.some(o => o.name === k) ? 'Bonk!' : 'KO!');
      } else if (e.type === 'peck') {
        spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 5, 120, 380, 2, '#a16207', '#f6ecd2');
      } else if (e.type === 'spawn' && e.kind === 'beetle') {
        beetleAt = now; // (it pops in)
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

  // Confetti: for a win, a new best (all over the board), or the winner of a
  // round you're watching (from its head).
  const CONFETTI = ['#fde68a', '#a3e635', '#f472b6', '#22d3ee', '#fb923c', '#c4b5fd', '#fffbea'];
  function celebrate(s = null) {
    if (reduced) return;
    if (s && s.body.length) {
      const h = s.body[0];
      for (let i = 0; i < 4; i++) spawn(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, 9, 320, T.PARTICLE_LIFE * 2.2, 3.4, CONFETTI[i], CONFETTI[i + 3]);
      return;
    }
    for (let i = 0; i < 12; i++) spawn((i + 0.5) / 12 * SIZE, SIZE * (0.25 + (i % 3) * 0.12), 9, 400, T.PARTICLE_LIFE * 2.8, 4.6, CONFETTI[i % CONFETTI.length], CONFETTI[(i + 3) % CONFETTI.length]);
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
    mLive = 0;
    mlife.fill(0);
    born.clear();
    eatenNow.clear();
    bornTick = -1;
    fresh = true;
    beetleAng = null;
    beetleAt = 0;
    fallen.length = 0;
    nextLeaf = 0;
    // A different stretch of the tree each round.
    barkSeed = 1 + Math.floor(Math.random() * 2147483645);
    barkLayer = null;
    shadeLayer = null;
    resetStatic();
  }

  return {
    init, setGame, resize, frame, onTick, shake, hold, headPx, colorOf, markOf, celebrate,
    holding: () => deaths.length > 0 || corpses.length > 0,
    setViewer(id) { viewerId = id; },
    setReducedMotion(v) { reduced = v; },
    get particles() { return pLive; },
  };
})();
