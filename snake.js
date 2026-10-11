(() => {
  const GRID = 30;
  const FOOD_COUNT = 3;
  const START_TICK = 120; // ms per tick at the start of a round
  const MIN_TICK = 90;
  const RAMP_MS = 120000; // reach MIN_TICK after this much game time
  const HISTORY = 8;      // board snapshots kept for the AIs' reaction delay

  const { DIRS, PERSONAS, decide } = window.SnakeAI;
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
    return { id, body, dir: d, alive: true, grow: 0, eaten: 0, queue: [], cause: null, diedAt: null, ...props };
  }

  function createGame({ withPlayer = true } = {}) {
    const snakes = [];
    if (withPlayer) snakes.push(makeSnake(0, SPAWNS[0], { name: 'You', color: PLAYER_COLOR, isPlayer: true }));
    ['viper', 'gobbler', 'warden'].forEach((key, k) => {
      const p = PERSONAS[key];
      snakes.push(makeSnake(k + 1, SPAWNS[k + 1], { name: p.name, color: p.color, persona: p }));
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
        id: s.id, body: s.body.map(c => ({ ...c })), dir: s.dir, isPlayer: !!s.isPlayer,
      })),
      food: game.food.map(f => ({ ...f })),
    });
    if (game.history.length > HISTORY) game.history.shift();
  }

  // What an AI "sees": its own body now, everything else as of its reaction time ago.
  function aiView(game, snake) {
    const delay = Math.max(1, Math.round(snake.persona.reactionMs / tickMs(game)));
    const idx = Math.max(0, game.history.length - 1 - delay);
    const snap = game.history[idx];
    return {
      grid: GRID,
      me: { body: snake.body, dir: snake.dir, grow: snake.grow },
      others: snap.snakes.filter(o => o.id !== snake.id),
      food: snap.food,
      age: game.history.length - 1 - idx,
    };
  }

  // Advance one tick. All snakes move at the same time. Returns the snakes that died.
  function step(game) {
    const alive = game.snakes.filter(s => s.alive);

    for (const s of alive) {
      if (s.isPlayer) {
        if (s.queue.length) s.dir = s.queue.shift();
      } else {
        s.dir = decide(aiView(game, s), s.persona);
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
      heads.set(k, (heads.get(k) || 0) + 1);
    }

    const dying = [];
    for (const s of alive) {
      const { x, y } = s.next;
      const k = key(x, y);
      let cause = null;
      if (x < 0 || y < 0 || x >= GRID || y >= GRID) cause = 'hit the wall';
      else if (occupied.has(k)) {
        const other = occupied.get(k);
        cause = other === s ? 'bit itself' : `ran into ${other.isPlayer ? 'you' : other.name}`;
      } else if (heads.get(k) > 1) cause = 'crashed head-on';
      if (cause) { s.cause = cause; dying.push(s); }
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
        game.food.splice(i, 1);
        s.grow++;
        s.eaten++;
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

  function newGame() {
    game = createGame();
    buildScoreboard();
    updateHud();
  }

  function start() {
    newGame();
    state = 'running';
    hideOverlay();
    schedule();
    draw();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(tick, tickMs(game));
  }

  function tick() {
    if (state !== 'running') return;
    const wasAlive = player().alive;

    step(game);
    updateHud();
    draw();

    if (game.snakes.filter(s => s.alive).length <= 1) return endRound();
    if (wasAlive && !player().alive) {
      recordBest();
      showOverlay('You died', `You ${player().cause} · score ${player().eaten}`, 'Play again', 'Watch');
    }
    schedule();
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
    showOverlay(title, `Your score: ${player().eaten}`, 'Play again');
  }

  function showOverlay(title, text, button, secondary) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startBtn.textContent = button;
    watchBtn.hidden = !secondary;
    if (secondary) watchBtn.textContent = secondary;
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
      li.querySelector('.dot').style.background = s.color;
      li.querySelector('.name').textContent = s.name;
      boardEl.appendChild(li);
      s.row = li;
    }
  }

  function updateHud() {
    scoreEl.textContent = player().eaten;
    for (const s of game.snakes) {
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

    const foodColor = css.getPropertyValue('--food');
    for (const f of game.food) {
      const pellet = f.kind === 'pellet';
      ctx.fillStyle = pellet ? f.color : foodColor;
      ctx.beginPath();
      ctx.arc(f.x * cell + cell / 2, f.y * cell + cell / 2, cell * (pellet ? 0.22 : 0.38), 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of game.snakes) if (s.alive) drawSnake(s);
  }

  function drawSnake(s) {
    s.body.forEach((c, i) => {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = i === 0 ? 1 : Math.max(0.45, 1 - i / (s.body.length * 1.4));
      roundRect(c.x * cell + 1, c.y * cell + 1, cell - 2, cell - 2, 5);
    });
    ctx.globalAlpha = 1;

    // Eyes
    const h = s.body[0], dir = s.dir;
    ctx.fillStyle = '#0b1210';
    const cx = h.x * cell + cell / 2, cy = h.y * cell + cell / 2;
    const ox = dir.y !== 0 ? cell * 0.2 : 0, oy = dir.x !== 0 ? cell * 0.2 : 0;
    const fx = dir.x * cell * 0.15, fy = dir.y * cell * 0.15;
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + fx + ox * k, cy + fy + oy * k, cell * 0.08, 0, Math.PI * 2);
      ctx.fill();
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

  // Keyboard
  document.addEventListener('keydown', e => {
    if (KEYS[e.key]) {
      e.preventDefault();
      if (state === 'running' && player().alive) turn(KEYS[e.key]);
    } else if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (state === 'running' || state === 'paused') togglePause();
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
    if (!touchStart || state !== 'running' || !player().alive) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });

  startBtn.addEventListener('click', () => {
    if (state === 'paused') togglePause();
    else start();
  });
  watchBtn.addEventListener('click', hideOverlay);

  newGame();
  state = 'ready';
  draw();

  // Headless AI-vs-AI rounds for tuning: open the page with ?debug and run
  // SnakeDebug.simulate(10) in the console.
  if (new URLSearchParams(location.search).has('debug')) {
    window.SnakeDebug = {
      game: () => game,
      createGame,
      step,
      simulate(rounds = 10, maxTicks = 3000) {
        const out = { rounds, wins: {}, draws: 0, timeouts: 0, avgTicks: 0, causes: {}, msPerTick: 0 };
        let ticks = 0;
        const t0 = performance.now();
        for (let r = 0; r < rounds; r++) {
          const g = createGame({ withPlayer: false });
          while (g.snakes.filter(s => s.alive).length > 1 && g.tick < maxTicks) step(g);
          ticks += g.tick;
          const alive = g.snakes.filter(s => s.alive);
          if (g.tick >= maxTicks) out.timeouts++;
          else if (alive.length === 1) out.wins[alive[0].name] = (out.wins[alive[0].name] || 0) + 1;
          else out.draws++;
          for (const s of g.snakes) {
            if (s.alive) continue;
            const c = (out.causes[s.name] ||= {});
            c[s.cause] = (c[s.cause] || 0) + 1;
          }
        }
        out.avgTicks = Math.round(ticks / rounds);
        out.msPerTick = +((performance.now() - t0) / ticks).toFixed(2);
        return out;
      },
    };
  }
})();
