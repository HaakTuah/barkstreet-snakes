(() => {
  const GRID = 20;
  const START_SPEED = 140; // ms per tick
  const MIN_SPEED = 60;
  const SPEED_STEP = 4;    // ms faster per food eaten

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const cell = canvas.width / GRID;

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayText = document.getElementById('overlay-text');
  const startBtn = document.getElementById('start');

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const KEYS = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
  };

  let snake, dir, queue, food, score, speed, state, timer;
  let best = loadBest();
  bestEl.textContent = best;

  function loadBest() {
    try { return Number(localStorage.getItem('snake-best')) || 0; } catch { return 0; }
  }

  function saveBest(value) {
    try { localStorage.setItem('snake-best', String(value)); } catch { /* storage unavailable */ }
  }

  function reset() {
    const mid = Math.floor(GRID / 2);
    snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
    dir = DIRS.right;
    queue = [];
    score = 0;
    speed = START_SPEED;
    scoreEl.textContent = score;
    placeFood();
  }

  function placeFood() {
    const free = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
      }
    }
    food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  function start() {
    reset();
    state = 'running';
    hideOverlay();
    schedule();
    draw();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(tick, speed);
  }

  function tick() {
    if (state !== 'running') return;

    if (queue.length) dir = queue.shift();

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const eating = food && head.x === food.x && head.y === food.y;
    // The tail moves out of the way this tick unless we're growing.
    const body = eating ? snake : snake.slice(0, -1);

    const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID;
    const hitSelf = body.some(s => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) return gameOver();

    snake.unshift(head);
    if (eating) {
      score++;
      scoreEl.textContent = score;
      speed = Math.max(MIN_SPEED, speed - SPEED_STEP);
      placeFood();
      if (!food) return win();
    } else {
      snake.pop();
    }

    draw();
    schedule();
  }

  function turn(name) {
    const next = DIRS[name];
    // Compare against the last queued direction so fast key presses chain correctly.
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (next === last || (next.x === -last.x && next.y === -last.y)) return;
    if (queue.length < 3) queue.push(next);
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

  function endGame(title) {
    state = 'over';
    clearTimeout(timer);
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      saveBest(best);
    }
    draw();
    showOverlay(title, `Score: ${score}`, 'Play again');
  }

  function gameOver() { endGame('Game over'); }
  function win() { endGame('You win!'); }

  function showOverlay(title, text, button) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startBtn.textContent = button;
    overlay.classList.remove('hidden');
    startBtn.focus();
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
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

    if (food) {
      ctx.fillStyle = css.getPropertyValue('--food');
      ctx.beginPath();
      ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    const accent = css.getPropertyValue('--accent');
    snake.forEach((s, i) => {
      ctx.fillStyle = accent;
      ctx.globalAlpha = i === 0 ? 1 : Math.max(0.45, 1 - i / (snake.length * 1.4));
      roundRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2, 5);
    });
    ctx.globalAlpha = 1;

    // Eyes
    const h = snake[0];
    ctx.fillStyle = '#062b14';
    const cx = h.x * cell + cell / 2, cy = h.y * cell + cell / 2;
    const ox = dir.y !== 0 ? cell * 0.2 : 0, oy = dir.x !== 0 ? cell * 0.2 : 0;
    const fx = dir.x * cell * 0.15, fy = dir.y * cell * 0.15;
    [[-1], [1]].forEach(([k]) => {
      ctx.beginPath();
      ctx.arc(cx + fx + ox * k, cy + fy + oy * k, cell * 0.08, 0, Math.PI * 2);
      ctx.fill();
    });
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
      if (state === 'running') turn(KEYS[e.key]);
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
    if (!touchStart || state !== 'running') return;
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

  reset();
  state = 'ready';
  draw();
})();
