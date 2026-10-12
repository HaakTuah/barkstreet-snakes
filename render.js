// The canvas renderer for Bark & Bite.
//
// The board is drawn in a fixed logical space of GRID cells of CELL units
// (768 × 768). The canvas backing store is sized to the board's real size ×
// devicePixelRatio, so everything stays crisp, and one transform maps logical
// units to device pixels.
//
// Cost control: the bark, grid lines and woodpecker holes live on a
// prerendered static layer; food, meat and the woodpecker are cached sprites;
// particles come from a fixed pool; nothing in the per-frame path allocates
// (no closures, array literals, spreads or string building).
window.SnakeRender = (() => {
  const T = window.TUNING;
  const GRID = T.GRID;
  const CELL = 32;
  const SIZE = GRID * CELL;
  const BARK = '#5a3b22';
  const INK = '#0b1210';
  const TAU = Math.PI * 2;

  let canvas, ctx, PERSONAS, PLAYER_COLOR;
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
  let barkLayer = null, staticLayer = null, holesDrawn = 0;

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
    // Carved grid lines, one device pixel wide, on whole pixels.
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.strokeStyle = 'rgba(0,0,0,0.17)';
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 1; i < GRID; i++) {
      const p = Math.round(i * CELL * k) + 0.5;
      g.moveTo(p, 0); g.lineTo(p, px);
      g.moveTo(0, p); g.lineTo(px, p);
    }
    g.stroke();
    return b;
  }

  // The static layer is the bark plus every hole pecked so far.
  function resetStatic() {
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
  const sprites = new Map();

  function sprite(name, color, draw) {
    const key = color ? name + color : name;
    let s = sprites.get(key);
    if (s) return s;
    s = makeLayer(SPRITE * CELL * k, SPRITE * CELL * k);
    const g = s.getContext('2d');
    g.setTransform(k, 0, 0, k, SPRITE * CELL * k / 2, SPRITE * CELL * k / 2);
    draw(g, color);
    sprites.set(key, s);
    return s;
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

  const appleSprite = () => sprite('apple', null, g => drawAppleShape(g, '#84cc16'));
  const goldenSprite = () => sprite('golden', null, g => drawAppleShape(g, '#fbbf24'));
  const glowSprite = () => sprite('glow', null, g => {
    const grad = g.createRadialGradient(0, 0, CELL * 0.2, 0, 0, CELL * 0.8);
    grad.addColorStop(0, 'rgba(253,224,71,0.55)');
    grad.addColorStop(1, 'rgba(253,224,71,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(0, 0, CELL * 0.8, 0, TAU); g.fill();
  });
  // A four-point sparkle: the golden apple's non-color cue.
  const starSprite = () => sprite('star', null, g => {
    g.fillStyle = '#fffbea';
    g.beginPath();
    const r1 = CELL * 0.2, r2 = CELL * 0.05;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU, r = i % 2 ? r2 : r1;
      if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(r, 0);
    }
    g.fill();
  });
  const mushroomSprite = () => sprite('mushroom', null, g => {
    const c = CELL;
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(c * 0.03, c * 0.36, c * 0.3, c * 0.08, 0, 0, TAU); g.fill();
    g.fillStyle = '#fef3c7';
    g.fillRect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36);
    g.fillStyle = '#dc2626';
    g.beginPath(); g.ellipse(0, 0, c * 0.4, c * 0.3, 0, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,20,8,0.45)';
    g.lineWidth = c * 0.05;
    g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(-c * 0.18, -c * 0.1, c * 0.06, 0, TAU); g.fill();
    g.beginPath(); g.arc(c * 0.06, -c * 0.2, c * 0.06, 0, TAU); g.fill();
    g.beginPath(); g.arc(c * 0.22, -c * 0.06, c * 0.05, 0, TAU); g.fill();
  });
  // A drumstick tinted by the snake it came from, with a light rim so it reads on bark.
  const meatSprite = color => sprite('meat', color, (g, col) => {
    const c = CELL;
    g.rotate(-0.7);
    g.fillStyle = '#f5f5f4';
    g.fillRect(c * 0.05, -c * 0.05, c * 0.28, c * 0.1);
    g.beginPath(); g.arc(c * 0.34, -c * 0.06, c * 0.07, 0, TAU); g.fill();
    g.beginPath(); g.arc(c * 0.34, c * 0.06, c * 0.07, 0, TAU); g.fill();
    g.fillStyle = mix(col && col[0] === '#' ? col : '#b45309', '#c2410c', 0.3);
    g.beginPath(); g.ellipse(-c * 0.08, 0, c * 0.24, c * 0.18, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,240,220,0.6)';
    g.lineWidth = c * 0.05;
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.3)';
    g.beginPath(); g.arc(-c * 0.14, -c * 0.06, c * 0.06, 0, TAU); g.fill();
  });
  // The woodpecker, beak pointing right (flip for left). Drawn about 1.6 cells tall.
  const birdSprite = () => sprite('bird', null, g => {
    const c = CELL * 0.85;
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.arc(-c * 0.05, c * 0.12, c * 0.48, 0, TAU); g.fill();
    g.fillStyle = '#18181b';
    g.beginPath(); g.ellipse(-c * 0.1, 0, c * 0.32, c * 0.5, 0, 0, TAU); g.fill();
    g.fillStyle = '#f5f5f4';
    g.fillRect(-c * 0.24, -c * 0.25, c * 0.18, c * 0.07);
    g.fillRect(-c * 0.24, c * 0.05, c * 0.18, c * 0.07);
    g.beginPath(); g.arc(c * 0.12, -c * 0.32, c * 0.12, 0, TAU); g.fill();
    g.fillStyle = '#18181b';
    g.beginPath(); g.arc(c * 0.1, -c * 0.38, c * 0.16, 0, TAU); g.fill();
    g.fillStyle = '#dc2626';
    g.beginPath(); g.arc(c * 0.02, -c * 0.5, c * 0.12, 0, TAU); g.fill();
    g.fillStyle = '#f5f5f4';
    g.beginPath(); g.arc(c * 0.16, -c * 0.4, c * 0.04, 0, TAU); g.fill();
    g.fillStyle = '#71717a';
    g.beginPath(); g.moveTo(c * 0.24, -c * 0.44); g.lineTo(c * 0.62, -c * 0.36); g.lineTo(c * 0.24, -c * 0.32); g.fill();
  });

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
  let fNext = 0;
  function floater(x, y, text) {
    fx[fNext] = x; fy[fNext] = y; flife[fNext] = 700; ftext[fNext] = text;
    fNext = (fNext + 1) % MAX_F;
  }
  function drawFloaters(dt) {
    let any = false;
    for (let i = 0; i < MAX_F; i++) if (flife[i] > 0) { any = true; break; }
    if (!any) return;
    ctx.font = FLOAT_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = CELL * 0.14;
    ctx.strokeStyle = 'rgba(58,38,20,0.85)';
    for (let i = 0; i < MAX_F; i++) {
      if (flife[i] <= 0) continue;
      flife[i] -= dt;
      const t = Math.max(0, flife[i] / 700);
      const y = fy[i] - (reduced ? 0 : (1 - t) * CELL * 0.8); // rises, unless motion is reduced
      ctx.globalAlpha = Math.min(1, t * 1.6);
      ctx.strokeText(ftext[i], fx[i], y);
      ctx.fillStyle = '#fde68a';
      ctx.fillText(ftext[i], fx[i], y);
    }
    ctx.globalAlpha = 1;
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
        gx: 1, gy: 0, gulps: [-99, -99, -99, -99], gulpAt: 0,
        gulpR: 0.12, gulpW: 1, ateAt: -1e9, // gulp size and length (Gobbler's are bigger), last bite
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
      const model = game.snakes[0] && findById(s.memory.modelId);
      if (model && model.alive) return mix(model.personaKey === 'capricious' ? colorOf(model) : model.color, '#ffffff', 0.45);
    }
    return s.color;
  }

  function findById(id) {
    if (id == null || !game) return null;
    for (const o of game.snakes) if (o.id === id) return o;
    return null;
  }

  function segmentFill(look, color, i, n, now, wild) {
    if (wild) return HUES[Math.floor((reduced ? 0 : now / 15) + i * 28) % 360];
    if (look === 'joker') return i === 0 ? '#f8fafc' : i % 2 ? '#f59e0b' : '#a21caf';
    if (look === 'vulture' && i === 0) return '#f9a8d4'; // bald pink head
    if (look === 'vulture' && i === 1) return '#f5f5f4'; // white neck ruff
    if (look === 'desperado' && i === 1) return '#dc2626'; // bandana
    if (look === 'desperado' && i > 1 && i % 4 === 0) return '#fde68a'; // poncho stripe
    let fill = color;
    if (look === 'sniper' && i % 3 === 2) fill = mix(color, '#fca5a5', 0.35);
    const t = i / (n > 1 ? n - 1 : 1); // 0 at the head, 1 at the tail
    const fade = look === 'ghost' ? Math.round(75 * t) / 100
      : look === 'creeper' ? Math.round(15 + 45 * t) / 100
      : look === 'drab' ? 0.15
      : Math.round(30 * t) / 100;
    return fade ? mix(fill, BARK, fade) : fill;
  }

  // Scratch buffer for interpolated segment centers (x, y pairs).
  let pts = new Float32Array(2 * 256);

  function drawSnake(s, alpha, now) {
    const look = lookOf(s);
    const color = colorOf(s);
    const n = s.body.length;
    if (pts.length < n * 2) pts = new Float32Array(n * 4);
    const prev = s.prev;
    for (let i = 0; i < n; i++) {
      const c = s.body[i];
      const p = prev && i < prev.length ? prev[i] : c;
      pts[2 * i] = (p.x + (c.x - p.x) * alpha) * CELL + CELL / 2;
      pts[2 * i + 1] = (p.y + (c.y - p.y) * alpha) * CELL + CELL / 2;
    }
    const a = animOf(s, now);
    const wild = s.personaKey === 'wildcard';
    const isPlayer = !s.persona;
    const darkBody = color[0] === '#' && luma(color) < 0.4;

    // Gulps: a bulge that travels one segment per tick after each bite.
    const tickPos = game ? game.tick - 1 + alpha : 0;

    // Shadow, in one path.
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    for (let i = n - 1; i >= 0; i--) {
      const r = radius(i, n, a, tickPos);
      ctx.moveTo(pts[2 * i] + 2 + r, pts[2 * i + 1] + 4);
      ctx.arc(pts[2 * i] + 2, pts[2 * i + 1] + 4, r, 0, TAU);
    }
    ctx.fill();

    // Your cream outline: a slightly wider spine behind the body.
    if (isPlayer) {
      ctx.strokeStyle = '#fffbea';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = CELL * 0.98;
      spine(n);
      ctx.stroke();
      ctx.fillStyle = '#fffbea';
      circle(pts[0], pts[1], CELL * 0.6);
    }

    // Tail to head, so the head ends up on top.
    ctx.lineCap = 'round';
    for (let i = n - 1; i >= 0; i--) {
      const x = pts[2 * i], y = pts[2 * i + 1];
      const r = radius(i, n, a, tickPos);
      const fill = segmentFill(look, color, i, n, now, wild);
      if (i < n - 1) { // band joining this segment to the one behind it
        ctx.strokeStyle = segmentFill(look, color, i + 1, n, now, wild);
        ctx.lineWidth = radius(i + 1, n, a, tickPos) * 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(pts[2 * i + 2], pts[2 * i + 3]);
        ctx.stroke();
      }
      ctx.fillStyle = fill;
      circle(x, y, r);
    }

    // Highlights in one path: a little roundness on every segment.
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const r = radius(i, n, a, tickPos);
      const hx = pts[2 * i] - r * 0.3, hy = pts[2 * i + 1] - r * 0.35;
      ctx.moveTo(hx + r * 0.35, hy);
      ctx.arc(hx, hy, r * 0.35, 0, TAU);
    }
    ctx.fill();

    // Body details, each in one batched stroke.
    if (look === 'mason') {
      ctx.strokeStyle = 'rgba(30,41,59,0.6)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const x = pts[2 * i], y = pts[2 * i + 1], r = radius(i, n, a, tickPos);
        const off = (s.body[i].x + s.body[i].y) % 2 ? -r * 0.35 : r * 0.35;
        const ch = 0.937 * r; // half-chord of the circle at ±0.35r, so lines end on the edge
        ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
        ctx.moveTo(x + off, y - ch); ctx.lineTo(x + off, y);
        ctx.moveTo(x - off, y); ctx.lineTo(x - off, y + ch);
      }
      ctx.stroke();
    } else if (look === 'colonist') {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const x = pts[2 * i], y = pts[2 * i + 1], d = radius(i, n, a, tickPos) * 0.62;
        ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
        ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d);
      }
      ctx.stroke();
    }
    if (darkBody || look === 'vulture') { // a pale rim so dark bodies read on the bark
      ctx.strokeStyle = 'rgba(255,240,220,0.38)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = look === 'vulture' ? 2 : 0; i < n; i++) {
        const r = radius(i, n, a, tickPos) - 1;
        ctx.moveTo(pts[2 * i] + r, pts[2 * i + 1]);
        ctx.arc(pts[2 * i], pts[2 * i + 1], r, 0, TAU);
      }
      ctx.stroke();
    }
    if (s.personaKey === 'copycat') { // dashed rings: a copy of someone
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash(DASH);
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const r = radius(i, n, a, tickPos) - 2;
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
      ctx.arc(pts[0], pts[1], radius(0, n, a, tickPos) + 2, 0, TAU);
      ctx.stroke();
    }

    // Head features, drawn in a frame where +x points the way the snake faces.
    const blinking = now < a.blinkUntil;
    if (now > a.nextBlink) {
      a.blinkUntil = now + T.BLINK_MS;
      a.nextBlink = now + T.BLINK_MIN + Math.random() * (T.BLINK_MAX - T.BLINK_MIN);
    }
    ctx.save();
    ctx.translate(pts[0], pts[1]);
    ctx.rotate(Math.atan2(s.dir.y, s.dir.x));
    ctx.scale(1.1, 1.1);
    if (isPlayer) drawPlayerFace(s, a, now, blinking);
    else drawFace(s, look, color, blinking);
    ctx.restore();

    // Capricious: a ring that flashes out when its mood changes.
    if (!reduced && s.personaKey === 'capricious' && s.memory.moodChangedAt != null && game) {
      const age = game.time - s.memory.moodChangedAt;
      if (age < 900) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1 - age / 900;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pts[0], pts[1], CELL * (0.6 + 1.6 * age / 900), 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  const DASH = [3, 3], NO_DASH = [];

  // Segment radius: a big head, a body that tapers to the tail, plus any gulp passing through.
  function radius(i, n, a, tickPos) {
    let r = i === 0 ? CELL * 0.54 : CELL * (0.44 - 0.1 * (i / (n > 1 ? n - 1 : 1)));
    if (i > 0) {
      for (let g = 0; g < 4; g++) {
        const d = i - (tickPos - a.gulps[g]);
        if (d > -a.gulpW && d < a.gulpW) r += CELL * a.gulpR * (1 - Math.abs(d) / a.gulpW);
      }
    }
    return r;
  }

  // The path through all segment centers, head to tail.
  function spine(n) {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
  }

  // ---------------------------------------------------------------- faces

  // Shared helpers draw in the head's local frame (+x forward, one cell = CELL).
  let blinkNow = false;

  function eyes(r, fill) {
    const c = CELL;
    if (blinkNow) { // closed: two short lids
      ctx.strokeStyle = INK;
      ctx.lineWidth = c * 0.05;
      ctx.beginPath();
      ctx.moveTo(c * 0.15, -c * 0.2 - c * r); ctx.lineTo(c * 0.15, -c * 0.2 + c * r);
      ctx.moveTo(c * 0.15, c * 0.2 - c * r); ctx.lineTo(c * 0.15, c * 0.2 + c * r);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = fill;
    circle(c * 0.15, -c * 0.2, c * r);
    circle(c * 0.15, c * 0.2, c * r);
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
  const WHISKERS = [0.3, 0.45, 0.6];

  // Your face: white eyes whose pupils glance toward the nearest food, a
  // blink now and then, and a forked tongue flick.
  function drawPlayerFace(s, a, now, blinking) {
    const c = CELL;
    // Where's the food? Turn the gaze toward it (in the head's local frame), eased.
    let tx = 1, ty = 0, best = 1e9;
    const h = s.body[0];
    if (game) {
      for (const f of game.food) {
        if (f.kind === 'mushroom') continue;
        const dx = f.x - h.x, dy = f.y - h.y, d = dx * dx + dy * dy;
        if (d < best && d > 0) { best = d; tx = dx; ty = dy; }
      }
    }
    const ang = -Math.atan2(s.dir.y, s.dir.x);
    const lx = tx * Math.cos(ang) - ty * Math.sin(ang), ly = tx * Math.sin(ang) + ty * Math.cos(ang);
    const len = Math.hypot(lx, ly) || 1;
    a.gx += (lx / len - a.gx) * T.GLANCE_EASE;
    a.gy += (ly / len - a.gy) * T.GLANCE_EASE;

    // Tongue: every few seconds, more often when food is within 3 cells.
    if (now > a.nextTongue) {
      a.tongueUntil = now + T.TONGUE_MS;
      a.nextTongue = now + T.TONGUE_EVERY * (best <= 9 ? 0.4 : 0.7 + Math.random() * 0.8);
    }
    if (now < a.tongueUntil) {
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

    if (blinking) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = c * 0.06;
      ctx.beginPath();
      ctx.moveTo(c * 0.06, -c * 0.2); ctx.lineTo(c * 0.26, -c * 0.2);
      ctx.moveTo(c * 0.06, c * 0.2); ctx.lineTo(c * 0.26, c * 0.2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = '#fffbea';
    circle(c * 0.16, -c * 0.2, c * 0.13);
    circle(c * 0.16, c * 0.2, c * 0.13);
    ctx.fillStyle = INK;
    const ox = a.gx * c * 0.05, oy = a.gy * c * 0.05;
    circle(c * 0.16 + ox, -c * 0.2 + oy, c * 0.07);
    circle(c * 0.16 + ox, c * 0.2 + oy, c * 0.07);
  }

  function drawFace(s, look, color, blinking) {
    const c = CELL;
    blinkNow = blinking;
    switch (look) {
      case 'sniper': { // one eye squeezed shut, the other behind a scope
        ctx.strokeStyle = INK;
        ctx.lineWidth = c * 0.06;
        ctx.beginPath();
        ctx.moveTo(c * 0.08, c * 0.11); ctx.lineTo(c * 0.2, c * 0.2); ctx.lineTo(c * 0.08, c * 0.29);
        ctx.stroke();
        ctx.fillStyle = '#1c1917'; // the scope: eyepiece, tube and a wider front bell
        circle(c * 0.1, -c * 0.2, c * 0.14);
        ctx.fillRect(c * 0.1, -c * 0.29, c * 0.34, c * 0.18);
        circle(c * 0.46, -c * 0.2, c * 0.15);
        ctx.fillStyle = '#57534e'; // a sheen along the top of the tube
        ctx.fillRect(c * 0.1, -c * 0.29, c * 0.34, c * 0.045);
        ctx.fillStyle = '#7dd3fc'; // the lens, with a glint
        circle(c * 0.5, -c * 0.2, c * 0.09);
        ctx.fillStyle = '#ffffff';
        circle(c * 0.53, -c * 0.24, c * 0.03);
        break;
      }
      case 'gobbler': { // stuffed hamster cheeks either side of the mouth, a mouth that opens near food
        // After a bite the cheeks puff up fast and go down slowly (still with reduced motion: no movement, just size).
        const t = (lastNow - (anim.get(s)?.ateAt ?? -1e9)) / 900;
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
        let hungry = false;
        const h = s.body[0];
        if (game) for (const f of game.food) if (f.kind !== 'mushroom' && Math.abs(f.x - h.x) + Math.abs(f.y - h.y) <= 3) { hungry = true; break; }
        ctx.fillStyle = INK;
        ctx.beginPath();
        if (hungry) ctx.arc(c * 0.38, 0, c * 0.2, -Math.PI / 2, Math.PI / 2);
        else ctx.ellipse(c * 0.38, 0, c * 0.04, c * 0.12, 0, 0, TAU);
        ctx.fill();
        eyes(0.08, INK);
        break;
      }
      case 'ghost': // hollow, tall eyes
        if (blinking) { eyes(0.12, INK); break; }
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(c * 0.12, -c * 0.2, c * 0.1, c * 0.14, 0, 0, TAU);
        ctx.ellipse(c * 0.12, c * 0.2, c * 0.1, c * 0.14, 0, 0, TAU);
        ctx.fill();
        break;
      case 'sovereign': // a golden crown, spikes pointing back
        poly(CROWN, 1, '#facc15');
        ctx.fillStyle = '#dc2626';
        circle(-c * 0.06, 0, c * 0.07);
        eyes(0.08, INK);
        break;
      case 'colonist': // redcoat's black tricorn hat with gold trim
        poly(TRICORN, 1, '#111827');
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = c * 0.04;
        ctx.beginPath();
        ctx.moveTo(c * 0.05, 0); ctx.lineTo(-c * 0.45, -c * 0.45);
        ctx.lineTo(-c * 0.45, c * 0.45); ctx.closePath();
        ctx.stroke();
        eyes(0.08, INK);
        break;
      case 'drab': // bored, half-closed eyes
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(c * 0.13, -c * 0.2, c * 0.09, Math.PI / 2, Math.PI * 1.5);
        ctx.arc(c * 0.13, c * 0.2, c * 0.09, Math.PI / 2, Math.PI * 1.5);
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = c * 0.05;
        ctx.beginPath();
        ctx.moveTo(c * 0.13, -c * 0.32); ctx.lineTo(c * 0.13, -c * 0.08);
        ctx.moveTo(c * 0.13, c * 0.08); ctx.lineTo(c * 0.13, c * 0.32);
        ctx.stroke();
        break;
      case 'vulture': // beady eyes and a hooked beak
        poly(BEAK, 1, '#52525b');
        eyes(0.05, INK);
        break;
      case 'mason': { // laurel wreath around the back of the head
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        for (let ang = Math.PI * 0.55; ang <= Math.PI * 1.45; ang += Math.PI * 0.15) {
          const ex = Math.cos(ang) * c * 0.36, ey = Math.sin(ang) * c * 0.36;
          ctx.moveTo(ex, ey);
          ctx.ellipse(ex, ey, c * 0.11, c * 0.06, ang + Math.PI / 2, 0, TAU);
        }
        ctx.fill();
        eyes(0.08, INK);
        break;
      }
      case 'creeper': // narrow glinting eyes
        if (blinking) { eyes(0.12, INK); break; }
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(c * 0.15, -c * 0.2, c * 0.035, c * 0.12, 0, 0, TAU);
        ctx.ellipse(c * 0.15, c * 0.2, c * 0.035, c * 0.12, 0, 0, TAU);
        ctx.fill();
        break;
      case 'metagamer': // round glasses, taped at the bridge
        eyes(0.06, INK);
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
      case 'wildcard': { // a big swept-over golden hairdo and mismatched eyes
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-c * 0.45, c * 0.3);
        ctx.quadraticCurveTo(-c * 0.5, -c * 0.45, c * 0.05, -c * 0.5);
        ctx.quadraticCurveTo(c * 0.35, -c * 0.5, c * 0.3, -c * 0.25);
        ctx.quadraticCurveTo(-c * 0.05, -c * 0.3, -c * 0.1, c * 0.35);
        ctx.fill();
        ctx.fillStyle = 'rgba(180,83,9,0.5)';
        ctx.fillRect(-c * 0.32, -c * 0.35, c * 0.3, c * 0.05);
        if (blinking) { eyes(0.1, INK); break; }
        ctx.fillStyle = '#ffffff';
        circle(c * 0.22, -c * 0.14, c * 0.12);
        ctx.fillStyle = INK;
        circle(c * 0.25, -c * 0.14, c * 0.06);
        circle(c * 0.2, c * 0.2, c * 0.05);
        break;
      }
      case 'copycat': { // cat ears, cat eyes, whiskers, and a party pin
        poly(EAR, -1, color);
        poly(EAR, 1, color);
        poly(EAR_IN, -1, '#f9a8d4');
        poly(EAR_IN, 1, '#f9a8d4');
        if (blinking) eyes(0.1, INK);
        else {
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.ellipse(c * 0.15, -c * 0.2, c * 0.08, c * 0.1, 0, 0, TAU);
          ctx.ellipse(c * 0.15, c * 0.2, c * 0.08, c * 0.1, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = INK;
          ctx.beginPath();
          ctx.ellipse(c * 0.15, -c * 0.2, c * 0.08, c * 0.025, 0, 0, TAU);
          ctx.ellipse(c * 0.15, c * 0.2, c * 0.08, c * 0.025, 0, 0, TAU);
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
        if (blinking) { eyes(0.1, INK); break; }
        ctx.fillStyle = '#ffffff';
        circle(c * 0.2, -c * 0.2, c * 0.1);
        circle(c * 0.2, c * 0.2, c * 0.1);
        ctx.fillStyle = INK;
        circle(c * 0.15, -c * 0.2, c * 0.06);
        circle(c * 0.15, c * 0.2, c * 0.06);
        break;
      }
      case 'joker': // jester hat with bells, red nose
        poly(JESTER, -1, '#a21caf');
        poly(JESTER, 1, '#f59e0b');
        ctx.fillStyle = '#facc15';
        circle(-c * 0.55, -c * 0.62, c * 0.08);
        circle(-c * 0.55, c * 0.62, c * 0.08);
        ctx.fillStyle = '#ef4444';
        circle(c * 0.36, 0, c * 0.1);
        eyes(0.07, INK);
        break;
      default:
        eyes(0.09, INK);
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
    if (!game) return;
    const dt = lastNow ? Math.min(64, now - lastNow) : 16;
    lastNow = now;
    syncHoles();

    let sx = 0, sy = 0;
    if (!reduced && now < shakeUntil) {
      const t = (shakeUntil - now) / T.SHAKE_MS;
      sx = Math.round((Math.random() * 2 - 1) * shakePx * t * k);
      sy = Math.round((Math.random() * 2 - 1) * shakePx * t * k);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = BARK; // the bark shifts, so fill the sliver it uncovers
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.setTransform(1, 0, 0, 1, sx, sy);
    ctx.drawImage(staticLayer, 0, 0);
    ctx.setTransform(k, 0, 0, k, sx, sy);

    for (const s of game.snakes) {
      if (!s.alive) continue;
      if (s.memory.home) drawHome(s);
      if (s.memory.colonies) drawColonies(s);
    }

    const bob = reduced ? 0 : 1;
    for (const f of game.food) {
      const x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2;
      const phase = (f.x * 7 + f.y * 13) % 10; // each item bobs on its own beat
      if (f.kind === 'food') blit(appleSprite(), x, y + bob * Math.sin(now / 420 + phase) * 1.6);
      else if (f.kind === 'pellet') blit(meatSprite(f.color), x, y);
      else if (f.kind === 'mushroom') {
        ctx.save();
        ctx.translate(x, y + CELL * 0.3);
        ctx.rotate(bob * Math.sin(now / 650 + phase) * 0.06);
        blit(mushroomSprite(), 0, -CELL * 0.3);
        ctx.restore();
      } else if (f.kind === 'golden') {
        // A calm dim instead of a blink when it's about to rot.
        const left = f.expires - game.tick;
        const fade = left > 30 ? 1 : 0.45 + 0.55 * (left / 30);
        blit(glowSprite(), x, y, fade);
        blit(goldenSprite(), x, y + bob * Math.sin(now / 380 + phase) * 1.8, fade);
        ctx.save();
        ctx.translate(x + CELL * 0.2, y - CELL * 0.22);
        ctx.rotate(reduced ? 0 : now / 900);
        blit(starSprite(), 0, 0, fade);
        ctx.restore();
      }
    }

    // The woodpecker perches on its newest hole, which can never be played on.
    const wp = game.woodpecker;
    if (wp) {
      const x = wp.x * CELL + CELL / 2, y = wp.y * CELL + CELL / 2;
      const peck = reduced ? 0 : Math.max(0, 1 - (game.time - wp.at) / 250) * 3;
      const flip = wp.x < GRID / 2 ? 1 : -1;
      ctx.save();
      ctx.translate(x + flip * peck, y - CELL * 0.1);
      ctx.scale(flip * 1.4, 1.4);
      blit(birdSprite(), 0, 0);
      ctx.restore();
    }

    for (const s of game.snakes) if (s.alive) drawSnake(s, alpha, now);
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
        const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
        const a = animOf(e.snake, now);
        if (e.kind !== 'mushroom') {
          a.gulps[a.gulpAt] = game.tick - 1; a.gulpAt = (a.gulpAt + 1) % 4;
          // Gobbler (and Capricious in a Gobbler mood) wolfs it down: a big gulp, cheeks puffed.
          const big = lookOf(e.snake) === 'gobbler';
          a.gulpR = big ? 0.24 : 0.12;
          a.gulpW = big ? 1.6 : 1;
          if (big) a.ateAt = now;
        }
        if (e.kind === 'golden') spawn(x, y, T.PARTICLES_EAT + 6, 220, T.PARTICLE_LIFE, 3.2, '#fde68a', '#fbbf24');
        else if (e.kind === 'pellet') spawn(x, y, T.PARTICLES_EAT - 4, 150, T.PARTICLE_LIFE * 0.8, 2.6, e.color && e.color[0] === '#' ? e.color : '#c2410c', '#f6ecd2');
        else if (e.kind === 'mushroom') spawn(x, y, T.PARTICLES_EAT - 2, 160, T.PARTICLE_LIFE, 2.6, '#dc2626', '#fffbea');
        else spawn(x, y, T.PARTICLES_EAT, 180, T.PARTICLE_LIFE, 2.8, '#a3e635', '#fde68a'); // sprout and honey: visible on bark and on green snakes alike
        if (!e.snake.persona && e.kind !== 'mushroom') floater(x, y - CELL * 0.6, e.kind === 'golden' ? '+3' : '+1');
      } else if (e.type === 'death') {
        const s = e.snake;
        const col = colorOf(s);
        for (let i = 0; i < s.body.length; i += 3) {
          const c = s.body[i];
          spawn(c.x * CELL + CELL / 2, c.y * CELL + CELL / 2, Math.max(2, Math.round(T.PARTICLES_DEATH / Math.ceil(s.body.length / 3))), 200, T.PARTICLE_LIFE * 1.2, 3, col[0] === '#' ? col : '#f6ecd2', '#a16207');
        }
      } else if (e.type === 'peck') {
        spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 5, 120, 380, 2, '#a16207', '#f6ecd2');
      }
    }
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
  // where supported). Very dense screens are capped at 3x for speed.
  function resize(cssPx, devicePx) {
    const dpr = window.devicePixelRatio || 1;
    const estimate = Math.round(cssPx * dpr);
    const exact = devicePx && Math.abs(devicePx - estimate) <= 2 ? devicePx : estimate;
    const target = Math.max(GRID, dpr > 3 ? Math.round(cssPx * 3) : exact);
    if (target === canvas.width) return false;
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
    PLAYER_COLOR = opts.playerColor;
    k = canvas.width / SIZE;
    resetStatic();
  }

  function setGame(g) {
    game = g;
    pLive = 0;
    plife.fill(0);
    flife.fill(0);
    resetStatic();
  }

  return {
    init, setGame, resize, frame, onTick, shake, headPx, colorOf, lookOf,
    setReducedMotion(v) { reduced = v; },
    get particles() { return pLive; },
  };
})();
