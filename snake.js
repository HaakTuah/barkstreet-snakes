(() => {
  const GRID = 30;
  const FOOD_COUNT = 3;
  const START_TICK = 120; // ms per tick at the start of a round
  const MIN_TICK = 90;
  const RAMP_MS = 120000; // reach MIN_TICK after this much game time
  const HISTORY = 8;      // board snapshots kept for the AIs' reaction delay
  const REACTION_MS = 240; // how stale the AIs' view of other snakes is (same for all)
  const OPPONENTS = 3;

  const { DIRS, PERSONAS, POOL, decide } = window.SnakeAI;
  const PLAYER_COLOR = '#4ade80';

  const SPAWNS = [
    { x: 6, y: 4, dir: DIRS.right },
    { x: 25, y: 6, dir: DIRS.down },
    { x: 23, y: 25, dir: DIRS.left },
    { x: 4, y: 23, dir: DIRS.up },
  ];

  // ---------------------------------------------------------------- engine

  function makeSnake(id, spawn, props) {
    const d = spawn.dir;
    const body = [0, 1, 2].map(k => ({ x: spawn.x - d.x * k, y: spawn.y - d.y * k }));
    return { id, body, dir: d, alive: true, grow: 0, eaten: 0, pellets: 0, queue: [], cause: null, diedAt: null, memory: {}, ...props };
  }

  const aiSnake = (id, spawn, key) => {
    const p = PERSONAS[key];
    return makeSnake(id, spawn, { name: p.name, color: p.color, persona: p, personaKey: key });
  };

  function pickOpponents(n) {
    const pool = [...POOL];
    const picks = [];
    while (picks.length < n && pool.length) picks.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
    return picks;
  }

  // personas: persona keys for the AI snakes (random by default). Without a
  // player (simulator), the first one takes the player's spawn.
  function createGame({ withPlayer = true, personas = null } = {}) {
    const keys = personas || pickOpponents(withPlayer ? OPPONENTS : OPPONENTS + 1);
    const snakes = [];
    if (withPlayer) snakes.push(makeSnake(0, SPAWNS[0], { name: 'You', color: PLAYER_COLOR, isPlayer: true }));
    keys.forEach(key => {
      const id = snakes.length;
      snakes.push(aiSnake(id, SPAWNS[id % SPAWNS.length], key));
    });
    const game = { snakes, food: [], tick: 0, time: 0, history: [] };
    fillFood(game);
    snapshot(game);
    return game;
  }

  const key = (x, y) => y * GRID + x;

  function tickMs(game) {
    return Math.max(MIN_TICK, START_TICK - (START_TICK - MIN_TICK) * game.time / RAMP_MS);
  }

  function fillFood(game) {
    const taken = new Set();
    for (const s of game.snakes) if (s.alive) for (const c of s.body) taken.add(key(c.x, c.y));
    for (const f of game.food) taken.add(key(f.x, f.y));
    let missing = FOOD_COUNT - game.food.filter(f => f.kind === 'food').length;
    if (missing <= 0) return;
    const free = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) if (!taken.has(key(x, y))) free.push({ x, y });
    }
    while (missing-- > 0 && free.length) {
      const [cell] = free.splice(Math.floor(Math.random() * free.length), 1);
      game.food.push({ ...cell, kind: 'food' });
    }
  }

  function snapshot(game) {
    game.history.push({
      snakes: game.snakes.filter(s => s.alive).map(s => ({
        id: s.id, body: s.body.map(c => ({ ...c })), dir: s.dir,
      })),
      food: game.food.map(f => ({ ...f })),
    });
    if (game.history.length > HISTORY) game.history.shift();
  }

  // What an AI "sees": its own body now, everything else as of its reaction
  // time ago. Rivals are just ids and bodies; nothing says which one is human.
  function aiView(game, snake) {
    const delay = Math.max(1, Math.round(REACTION_MS / tickMs(game)));
    const idx = Math.max(0, game.history.length - 1 - delay);
    const snap = game.history[idx];
    return {
      grid: GRID,
      me: { id: snake.id, body: snake.body, dir: snake.dir, grow: snake.grow },
      others: snap.snakes.filter(o => o.id !== snake.id),
      food: snap.food,
      age: game.history.length - 1 - idx,
      tick: game.tick,
      timeMs: game.time,
    };
  }

  // Advance one tick. All snakes move at the same time. Returns the snakes that died.
  function step(game) {
    const alive = game.snakes.filter(s => s.alive);

    for (const s of alive) {
      if (s.isPlayer) {
        if (s.queue.length) s.dir = s.queue.shift();
      } else {
        s.dir = decide(aiView(game, s), s.persona, s.memory);
      }
      s.next = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
      s.tailMoves = s.grow === 0;
    }

    // Cells still occupied by bodies after everyone moves (tails that move away are free).
    const occupied = new Map();
    for (const s of alive) {
      const keep = s.tailMoves ? s.body.length - 1 : s.body.length;
      for (let j = 0; j < keep; j++) occupied.set(key(s.body[j].x, s.body[j].y), s);
    }
    const heads = new Map();
    for (const s of alive) {
      const k = key(s.next.x, s.next.y);
      heads.set(k, [...(heads.get(k) || []), s]);
    }

    // killer: 'wall', 'self', or the name of the snake that was hit.
    const dying = [];
    for (const s of alive) {
      const { x, y } = s.next;
      const k = key(x, y);
      if (x < 0 || y < 0 || x >= GRID || y >= GRID) {
        s.cause = 'hit the wall'; s.killer = 'wall';
      } else if (occupied.has(k)) {
        const other = occupied.get(k);
        s.killer = other === s ? 'self' : other.name;
        s.cause = other === s ? 'bit itself' : `ran into ${other.isPlayer ? 'you' : other.name}`;
      } else if (heads.get(k).length > 1) {
        const other = heads.get(k).find(o => o !== s);
        s.cause = `crashed head-on into ${other.isPlayer ? 'you' : other.name}`; s.killer = other.name;
      } else continue;
      dying.push(s);
    }

    for (const s of alive) {
      if (dying.includes(s)) continue;
      s.body.unshift(s.next);
      if (s.tailMoves) s.body.pop(); else s.grow--;
    }

    // Dead snakes turn into pellets.
    const foodAt = new Set(game.food.map(f => key(f.x, f.y)));
    const bodyAt = new Set();
    for (const s of alive) if (!dying.includes(s)) for (const c of s.body) bodyAt.add(key(c.x, c.y));
    for (const s of dying) {
      s.alive = false;
      s.diedAt = game.tick;
      for (const c of s.body) {
        const k = key(c.x, c.y);
        if (foodAt.has(k) || bodyAt.has(k)) continue;
        foodAt.add(k);
        game.food.push({ x: c.x, y: c.y, kind: 'pellet', color: s.color });
      }
    }

    for (const s of game.snakes) {
      if (!s.alive) continue;
      const h = s.body[0];
      const i = game.food.findIndex(f => f.x === h.x && f.y === h.y);
      if (i >= 0) {
        const [f] = game.food.splice(i, 1);
        s.grow++;
        s.eaten++;
        if (f.kind === 'pellet') s.pellets++;
      }
    }

    fillFood(game);
    game.time += tickMs(game);
    game.tick++;
    snapshot(game);
    return dying;
  }

  // -------------------------------------------------------------------- UI

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const cell = canvas.width / GRID;

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const boardEl = document.getElementById('scoreboard');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayText = document.getElementById('overlay-text');
  const startBtn = document.getElementById('start');
  const watchBtn = document.getElementById('watch');
  const nameRow = document.getElementById('name-row');
  const nameRank = document.getElementById('name-rank');
  const nameInput = document.getElementById('name-input');
  const recordsEl = document.getElementById('records');
  const recordsBody = document.getElementById('records-body');
  const recordsTabs = [...document.querySelectorAll('#records .tab[data-tab]')];
  const filterEl = document.getElementById('scores-filter');
  const filterTabs = [...filterEl.querySelectorAll('.tab')];
  const opponentsEl = document.getElementById('opponents');

  const Records = window.SnakeRecords;

  const KEYS = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
  };

  let game, state, timer;
  let best = loadBest();
  bestEl.textContent = best;

  function loadBest() {
    try { return Number(localStorage.getItem('snake-best')) || 0; } catch { return 0; }
  }

  function saveBest(value) {
    try { localStorage.setItem('snake-best', String(value)); } catch { /* storage unavailable */ }
  }

  const player = () => game.snakes[0];

  function newGame(personas) {
    game = createGame({ personas });
    buildScoreboard();
    buildOpponents();
    updateHud();
  }

  // A fresh round gets a short countdown so you can see who you're up against.
  // The round shown on the start screen is used as-is.
  function start() {
    if (state !== 'ready') newGame();
    state = 'countdown';
    draw();
    countdown(3);
  }

  function countdown(n) {
    if (state !== 'countdown') return;
    if (n === 0) return go();
    showOverlay(String(n), 'Your opponents this round:', 'Go!');
    clearTimeout(timer);
    timer = setTimeout(() => countdown(n - 1), 700);
  }

  function go() {
    state = 'running';
    hideOverlay();
    schedule();
  }

  function buildOpponents() {
    opponentsEl.innerHTML = '';
    for (const s of game.snakes) {
      if (!s.persona) continue;
      const li = document.createElement('li');
      li.innerHTML = '<span class="dot"></span><strong></strong> <span class="blurb"></span>';
      li.querySelector('.dot').style.background = dotColor(s);
      li.querySelector('strong').textContent = s.name;
      li.querySelector('strong').style.color = s.color;
      li.querySelector('.blurb').textContent = s.persona.blurb;
      opponentsEl.appendChild(li);
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(tick, tickMs(game));
  }

  function tick() {
    if (state !== 'running') return;
    const wasAlive = player().alive;

    const dying = step(game);
    updateHud();
    draw();

    // Everyone still alive finished ahead of the snakes that just died; if
    // nobody is, they share first place (a draw).
    const alive = game.snakes.filter(s => s.alive);
    for (const s of dying) finishSnake(s, { place: alive.length + 1, draw: alive.length === 0 });
    if (alive.length <= 1) {
      if (alive.length) finishSnake(alive[0], { place: 1, won: true });
      return endRound();
    }
    if (wasAlive && !player().alive) {
      showOverlay('You died', `You ${player().cause} · ${Records.ordinal(game.result.place)} place · score ${player().eaten}`, 'Play again', 'Watch');
    }
    schedule();
  }

  // Record a snake's round on the high scores once, as soon as its placement is known.
  function finishSnake(s, { place, won = false, draw = false }) {
    if (s.result) return;
    s.result = { place, won, draw, eaten: s.eaten };
    if (s.isPlayer) {
      game.result = s.result;
      game.entryId = Records.recordPlayer({ ...s.result, killer: s.alive ? null : s.killer });
      recordBest();
    } else {
      Records.addScore({ ...s.result, name: s.name, color: s.color, ai: true });
    }
  }

  function turn(name) {
    const p = player();
    const next = DIRS[name];
    // Compare against the last queued direction so fast key presses chain correctly.
    const last = p.queue.length ? p.queue[p.queue.length - 1] : p.dir;
    if (next === last || (next.x === -last.x && next.y === -last.y)) return;
    if (p.queue.length < 3) p.queue.push(next);
  }

  function togglePause() {
    if (state === 'running') {
      state = 'paused';
      clearTimeout(timer);
      showOverlay('Paused', 'Press Space or P to continue', 'Resume');
    } else if (state === 'paused') {
      state = 'running';
      hideOverlay();
      schedule();
    }
  }

  function recordBest() {
    const score = player().eaten;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      saveBest(best);
    }
  }

  function endRound() {
    state = 'over';
    clearTimeout(timer);
    recordBest();
    const survivors = game.snakes.filter(s => s.alive);
    const title = survivors.length === 0 ? 'Draw'
      : survivors[0].isPlayer ? 'You win!'
      : `${survivors[0].name} wins`;
    const { place, won } = game.result;
    showOverlay(title, `You finished ${won ? '1st' : Records.ordinal(place)} · score ${player().eaten}`, 'Play again');
  }

  function showOverlay(title, text, button, secondary) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startBtn.textContent = button;
    watchBtn.hidden = !secondary;
    if (secondary) watchBtn.textContent = secondary;
    opponentsEl.hidden = state !== 'ready' && state !== 'countdown';
    // Offer to name a high score from this round, on the death and round-over screens.
    // Re-checked every time: AIs finishing later in the round can push you down.
    const rank = state !== 'paused' && game.entryId ? Records.rankOf(game.entryId) : { overall: 0, personal: 0 };
    nameRow.hidden = !rank.overall && !rank.personal;
    if (!nameRow.hidden) {
      nameRank.textContent = rank.overall ? `New high score: #${rank.overall}!` : `Personal best: #${rank.personal}`;
      nameInput.value = Records.getName();
    }
    overlay.classList.remove('hidden');
    startBtn.focus();
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function buildScoreboard() {
    boardEl.innerHTML = '';
    for (const s of game.snakes) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="dot"></span><span class="name"></span><span class="len"></span>';
      li.querySelector('.dot').style.background = dotColor(s);
      li.querySelector('.name').textContent = s.name;
      li.title = s.persona ? `${s.name}: ${s.persona.blurb}` : 'You';
      boardEl.appendChild(li);
      s.row = li;
    }
  }

  function updateHud() {
    scoreEl.textContent = player().eaten;
    for (const s of game.snakes) {
      s.row.querySelector('.dot').style.background = dotColor(s);
      s.row.classList.toggle('dead', !s.alive);
      s.row.querySelector('.len').textContent = s.alive ? s.body.length : 'out';
    }
  }

  function draw() {
    const css = getComputedStyle(document.documentElement);
    ctx.fillStyle = css.getPropertyValue('--panel');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Checkerboard grid
    ctx.fillStyle = css.getPropertyValue('--grid');
    for (let y = 0; y < GRID; y++) {
      for (let x = (y % 2); x < GRID; x += 2) ctx.fillRect(x * cell, y * cell, cell, cell);
    }

    for (const s of game.snakes) if (s.alive && s.memory.home) drawHome(s);

    for (const f of game.food) {
      if (f.kind === 'pellet') {
        ctx.fillStyle = f.color;
        circle(f.x * cell + cell / 2, f.y * cell + cell / 2, cell * 0.22);
      } else {
        drawApple(f.x * cell + cell / 2, f.y * cell + cell / 2);
      }
    }

    for (const s of game.snakes) if (s.alive) drawSnake(s);
  }

  // ---------------------------------------------------------------- looks

  function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blend two #rrggbb colors; t = 0 gives a, t = 1 gives b.
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  function drawApple(x, y) {
    ctx.fillStyle = '#ef4444';
    circle(x, y + cell * 0.04, cell * 0.34);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    circle(x - cell * 0.12, y - cell * 0.06, cell * 0.08);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = cell * 0.07;
    ctx.beginPath();
    ctx.moveTo(x, y - cell * 0.22);
    ctx.lineTo(x + cell * 0.04, y - cell * 0.42);
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(x + cell * 0.17, y - cell * 0.36, cell * 0.14, cell * 0.07, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Warden's home turf: a faint tint and a dashed border.
  function drawHome(s) {
    const { x, y, radius } = s.memory.home;
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = s.color;
    for (let gy = y - radius; gy <= y + radius; gy++) {
      for (let gx = x - radius; gx <= x + radius; gx++) {
        if (Math.hypot(gx - x, gy - y) <= radius) ctx.fillRect(gx * cell, gy * cell, cell, cell);
      }
    }
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(x * cell + cell / 2, y * cell + cell / 2, (radius + 0.5) * cell, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

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
    if (s.personaKey === 'copycat') {
      const model = game.snakes.find(o => o.id === s.memory.modelId && o.alive);
      if (model) return mix(colorOf(model).startsWith('#') ? colorOf(model) : model.color, '#ffffff', 0.45);
    }
    return s.color;
  }

  // Scoreboard / opponent-list dot: the current color, or a rainbow for Wildcard.
  const dotColor = s => s.personaKey === 'wildcard'
    ? 'conic-gradient(#f87171, #facc15, #4ade80, #22d3ee, #818cf8, #f472b6, #f87171)'
    : colorOf(s);

  function drawSnake(s) {
    const look = lookOf(s);
    const color = colorOf(s);
    const n = s.body.length;
    const now = performance.now();

    s.body.forEach((c, i) => {
      const x = c.x * cell, y = c.y * cell;
      let alpha = i === 0 ? 1 : Math.max(0.45, 1 - i / (n * 1.4));
      let fill = color;
      if (look === 'ghost') alpha = 0.85 - 0.7 * (i / Math.max(1, n - 1));
      if (look === 'creeper') alpha = i === 0 ? 0.9 : Math.max(0.3, 0.75 - i / (n * 1.6));
      if (look === 'drab') alpha = i === 0 ? 1 : 0.7;
      if (look === 'hunter' && i % 3 === 1) fill = mix(color, '#000000', 0.4);
      if (s.personaKey === 'wildcard') fill = `hsl(${(now / 15 + i * 28) % 360}, 85%, 62%)`;
      if (look === 'vulture' && i === 0) fill = '#f9a8d4'; // bald pink head
      if (look === 'vulture' && i === 1) fill = '#f5f5f4'; // white neck ruff
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
      roundRect(x + 1, y + 1, cell - 2, cell - 2, 5);

      if (look === 'mason') { // mortar lines: a brick pattern
        ctx.strokeStyle = 'rgba(70,40,10,0.55)';
        ctx.lineWidth = 1.2;
        const off = (c.x + c.y) % 2 ? cell * 0.3 : cell * 0.7;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + cell / 2); ctx.lineTo(x + cell - 2, y + cell / 2);
        ctx.moveTo(x + off, y + 2); ctx.lineTo(x + off, y + cell / 2);
        ctx.moveTo(x + cell - off, y + cell / 2); ctx.lineTo(x + cell - off, y + cell - 2);
        ctx.stroke();
      }
      if (s.personaKey === 'copycat') { // dashed outline: a copy of someone
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x + 2.5, y + 2.5, cell - 5, cell - 5);
        ctx.setLineDash([]);
      }
    });
    ctx.globalAlpha = 1;

    // Head features, drawn in a frame where +x points the way the snake faces.
    const h = s.body[0];
    ctx.save();
    ctx.translate(h.x * cell + cell / 2, h.y * cell + cell / 2);
    ctx.rotate(Math.atan2(s.dir.y, s.dir.x));
    drawFace(s, look, color);
    ctx.restore();

    // Capricious: a ring that flashes out when its mood changes.
    if (s.personaKey === 'capricious' && s.memory.moodChangedAt != null) {
      const age = game.time - s.memory.moodChangedAt;
      if (age < 900) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1 - age / 900;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(h.x * cell + cell / 2, h.y * cell + cell / 2, cell * (0.6 + 1.6 * age / 900), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawFace(s, look, color) {
    const c = cell;
    const dark = '#0b1210';
    const eyes = (r = 0.09, fill = dark) => {
      ctx.fillStyle = fill;
      circle(c * 0.15, -c * 0.2, c * r);
      circle(c * 0.15, c * 0.2, c * r);
    };

    switch (look) {
      case 'hunter': { // fangs and angry brows
        ctx.fillStyle = '#ffffff';
        for (const k of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(c * 0.36, k * c * 0.06);
          ctx.lineTo(c * 0.36, k * c * 0.2);
          ctx.lineTo(c * 0.56, k * c * 0.12);
          ctx.fill();
        }
        eyes(0.08, '#fde047');
        ctx.strokeStyle = dark;
        ctx.lineWidth = c * 0.08;
        for (const k of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(c * 0.02, k * c * 0.34);
          ctx.lineTo(c * 0.3, k * c * 0.1);
          ctx.stroke();
        }
        break;
      }
      case 'gobbler': { // puffy cheeks, a mouth that opens near food
        ctx.fillStyle = mix(color, '#ffffff', 0.25);
        circle(-c * 0.02, -c * 0.42, c * 0.2);
        circle(-c * 0.02, c * 0.42, c * 0.2);
        ctx.fillStyle = 'rgba(244,114,182,0.6)';
        circle(-c * 0.02, -c * 0.42, c * 0.08);
        circle(-c * 0.02, c * 0.42, c * 0.08);
        const h = s.body[0];
        const hungry = game.food.some(f => Math.abs(f.x - h.x) + Math.abs(f.y - h.y) <= 3);
        ctx.fillStyle = dark;
        ctx.beginPath();
        if (hungry) ctx.arc(c * 0.38, 0, c * 0.2, -Math.PI / 2, Math.PI / 2);
        else ctx.ellipse(c * 0.38, 0, c * 0.04, c * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        eyes(0.08);
        break;
      }
      case 'ghost': // hollow, tall eyes
        ctx.fillStyle = '#334155';
        for (const k of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(c * 0.12, k * c * 0.2, c * 0.1, c * 0.14, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'warden': // visor with a glowing slit
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(c * 0.02, -c * 0.38, c * 0.3, c * 0.76);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = c * 0.07;
        ctx.beginPath();
        ctx.moveTo(c * 0.17, -c * 0.3);
        ctx.lineTo(c * 0.17, c * 0.3);
        ctx.stroke();
        break;
      case 'drab': // bored, half-closed eyes
        ctx.fillStyle = dark;
        for (const k of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(c * 0.13, k * c * 0.2, c * 0.09, Math.PI / 2, Math.PI * 1.5);
          ctx.fill();
        }
        ctx.strokeStyle = dark;
        ctx.lineWidth = c * 0.05;
        ctx.beginPath();
        ctx.moveTo(c * 0.13, -c * 0.32); ctx.lineTo(c * 0.13, -c * 0.08);
        ctx.moveTo(c * 0.13, c * 0.08); ctx.lineTo(c * 0.13, c * 0.32);
        ctx.stroke();
        break;
      case 'vulture': // beady eyes and a hooked beak
        ctx.fillStyle = '#52525b';
        ctx.beginPath();
        ctx.moveTo(c * 0.32, -c * 0.12);
        ctx.lineTo(c * 0.6, 0);
        ctx.lineTo(c * 0.32, c * 0.12);
        ctx.fill();
        eyes(0.05);
        break;
      case 'creeper': // narrow glinting eyes
        ctx.fillStyle = '#fde047';
        for (const k of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(c * 0.15, k * c * 0.2, c * 0.035, c * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'metagamer': // round glasses
        eyes(0.06);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = c * 0.06;
        for (const k of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(c * 0.15, k * c * 0.2, c * 0.14, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(c * 0.15, -c * 0.06); ctx.lineTo(c * 0.15, c * 0.06);
        ctx.stroke();
        break;
      case 'wildcard': // mismatched eyes
        ctx.fillStyle = '#ffffff';
        circle(c * 0.15, -c * 0.2, c * 0.14);
        ctx.fillStyle = dark;
        circle(c * 0.18, -c * 0.2, c * 0.07);
        circle(c * 0.15, c * 0.22, c * 0.06);
        break;
      case 'copycat': // white mask
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(c * 0.04, -c * 0.38, c * 0.24, c * 0.76);
        eyes(0.08);
        break;
      default: // the player, Mason
        eyes();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();
  }

  // High scores / stats panel
  let recordsTab = 'scores';
  let scoresFilter = 'all';

  function openRecords() {
    if (state === 'countdown') state = 'running'; // pausing ends the countdown
    if (state === 'running' && player().alive) togglePause();
    renderRecords();
    recordsEl.hidden = false;
    document.getElementById('records-close').focus();
  }

  function closeRecords() {
    recordsEl.hidden = true;
  }

  function renderRecords() {
    recordsTabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === recordsTab)));
    filterTabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.filter === scoresFilter)));
    filterEl.hidden = recordsTab !== 'scores';
    recordsBody.innerHTML = '';
    if (recordsTab === 'scores') {
      Records.renderScores(recordsBody, game.entryId, scoresFilter, PLAYER_COLOR);
    } else {
      // Every persona's color, not just this round's, plus Viper (Hunter's old name).
      const colors = { self: PLAYER_COLOR, Viper: '#c084fc' };
      for (const p of Object.values(PERSONAS)) colors[p.name] = p.color;
      Records.renderStats(recordsBody, colors);
    }
  }

  recordsTabs.forEach(t => t.addEventListener('click', () => { recordsTab = t.dataset.tab; renderRecords(); }));
  filterTabs.forEach(t => t.addEventListener('click', () => { scoresFilter = t.dataset.filter; renderRecords(); }));
  document.getElementById('records-open').addEventListener('click', openRecords);
  document.getElementById('records-close').addEventListener('click', closeRecords);
  recordsEl.addEventListener('click', e => { if (e.target === recordsEl) closeRecords(); });
  document.getElementById('records-reset').addEventListener('click', () => {
    if (!confirm('Delete all your high scores and stats?')) return;
    Records.reset();
    nameRow.hidden = true;
    renderRecords();
  });

  // Renaming a high score from the death / round-over screen.
  nameInput.addEventListener('input', () => {
    if (game.entryId) Records.rename(game.entryId, nameInput.value);
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.target === nameInput) {
      if (e.key === 'Enter') { e.preventDefault(); nameInput.blur(); startBtn.focus(); }
      return;
    }
    if (!recordsEl.hidden) {
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') { e.preventDefault(); closeRecords(); }
      return;
    }
    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      openRecords();
    } else if (KEYS[e.key]) {
      e.preventDefault();
      if ((state === 'running' || state === 'countdown') && player().alive) turn(KEYS[e.key]);
    } else if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (state === 'running' || state === 'paused') togglePause();
      else if (state === 'countdown') go();
      else start();
    } else if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      start();
    }
  });

  // Touch swipes
  let touchStart = null;
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', e => {
    if (!touchStart || (state !== 'running' && state !== 'countdown') || !player().alive) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });

  startBtn.addEventListener('click', () => {
    if (state === 'paused') togglePause();
    else if (state === 'countdown') go();
    else start();
  });
  watchBtn.addEventListener('click', hideOverlay);

  // Start screen: show this round's opponents.
  function ready(personas) {
    clearTimeout(timer);
    newGame(personas);
    state = 'ready';
    showOverlay('Snake', 'Outlast your rivals. Arrow keys / WASD to move · Swipe on touch screens', 'Play');
    draw();
  }
  ready();

  // Tuning tools: open the page with ?debug, then in the console:
  //   await SnakeDebug.simulate({ rounds: 50 })   4 random AIs per round, stats per persona
  //   SnakeDebug.setup(['hunter', 'warden', 'ghost'])   start screen with chosen opponents
  if (new URLSearchParams(location.search).has('debug')) {
    window.SnakeDebug = {
      game: () => game,
      createGame,
      step,
      setup: ready,
      draw,
      async simulate(opts = {}) {
        const { rounds = 20, personas = null, maxTicks = 3000 } = typeof opts === 'number' ? { rounds: opts } : opts;
        const per = {};
        const out = { rounds, draws: 0, timeouts: 0, avgTicks: 0, msPerTick: 0, personas: per };
        let ticks = 0;
        const t0 = performance.now();
        for (let r = 0; r < rounds; r++) {
          await new Promise(res => setTimeout(res, 0)); // keep the page responsive
          out.progress = r;
          const g = createGame({ withPlayer: false, personas });
          const stat = {};
          for (const s of g.snakes) {
            per[s.name] ||= { rounds: 0, wins: 0, placeSum: 0, lengthSum: 0, eatenSum: 0, pelletSum: 0, kills: 0,
              aliveTicks: 0, distSum: 0, tailTicks: 0, homeTicks: 0, samples: 0, deaths: {} };
            per[s.name].rounds++;
            s.place = null;
            stat[s.id] = per[s.name];
          }
          while (g.snakes.filter(s => s.alive).length > 1 && g.tick < maxTicks) {
            const live = g.snakes.filter(s => s.alive);
            for (const s of live) {
              const p = stat[s.id], h = s.body[0];
              let d = Infinity, tail = false;
              for (const o of live) {
                if (o === s) continue;
                d = Math.min(d, Math.abs(h.x - o.body[0].x) + Math.abs(h.y - o.body[0].y));
                const t = o.body[o.body.length - 1];
                if (o.body.length >= 5 && Math.abs(h.x - t.x) + Math.abs(h.y - t.y) <= 3) tail = true;
              }
              const home = s.memory.home;
              p.samples++;
              p.distSum += d;
              if (tail) p.tailTicks++;
              if (home && Math.hypot(h.x - home.x, h.y - home.y) <= home.radius) p.homeTicks++;
            }
            const dying = step(g);
            const left = g.snakes.filter(s => s.alive).length;
            for (const s of dying) {
              s.place = left + 1;
              const k = s.killer === 'self' ? 'itself' : s.killer;
              stat[s.id].deaths[k] = (stat[s.id].deaths[k] || 0) + 1;
              const killer = g.snakes.find(o => o.name === s.killer && o !== s);
              if (killer) stat[killer.id].kills++;
            }
          }
          ticks += g.tick;
          const alive = g.snakes.filter(s => s.alive);
          if (g.tick >= maxTicks) out.timeouts++;
          else if (alive.length === 1) { stat[alive[0].id].wins++; alive[0].place = 1; }
          else out.draws++;
          for (const s of g.snakes) {
            const p = stat[s.id];
            p.placeSum += s.place || 1;
            p.lengthSum += s.body.length;
            p.eatenSum += s.eaten;
            p.pelletSum += s.pellets;
            p.aliveTicks += s.alive ? g.tick : s.diedAt;
          }
        }
        out.table = Object.entries(per).map(([name, p]) => ({
          name,
          rounds: p.rounds,
          win: Math.round(100 * p.wins / p.rounds),
          place: +(p.placeSum / p.rounds).toFixed(2),
          eaten: Math.round(p.eatenSum / p.rounds),
          pelletPct: Math.round(100 * p.pelletSum / Math.max(1, p.eatenSum)),
          kills: +(p.kills / p.rounds).toFixed(2),
          survive: Math.round(p.aliveTicks / p.rounds),
          dist: +(p.distSum / Math.max(1, p.samples)).toFixed(1),
          tailPct: Math.round(100 * p.tailTicks / Math.max(1, p.samples)),
          homePct: Math.round(100 * p.homeTicks / Math.max(1, p.samples)),
          selfOrWall: (p.deaths.itself || 0) + (p.deaths.wall || 0),
        })).sort((a, b) => b.win - a.win);
        out.avgTicks = Math.round(ticks / rounds);
        out.msPerTick = +((performance.now() - t0) / ticks).toFixed(2);
        return out;
      },
    };
  }
})();
