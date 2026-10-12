(() => {
  const GRID = 24;
  const APPLES = 3;          // green apples on the board at all times
  const MUSHROOMS = 2;       // red mushrooms on the board at all times
  const MUSHROOM_TICKS = 180; // a mushroom withers (and regrows elsewhere) after this many ticks
  const GOLDEN_CHANCE = 0.004; // per tick, while there is no golden apple
  const GOLDEN_TICKS = 120;  // a golden apple rots after this many ticks
  const GOLDEN_GROWTH = 3;
  const SHRINK = 3;          // a mushroom takes this many segments off
  const MIN_LENGTH = 3;
  const START_TICK = 120; // ms per tick at the start of a round
  const MIN_TICK = 90;
  const RAMP_MS = 120000; // reach MIN_TICK after this much game time
  const SUDDEN_DEATH_MS = 180000; // the woodpecker arrives after three minutes
  const PECK_EVERY = 2;   // ticks between holes once it's here
  const HISTORY = 8;      // board snapshots kept for the AIs' reaction delay
  const REACTION_MS = 240; // how stale the AIs' view of other snakes is (same for all)
  const OPPONENTS = 3;

  const { DIRS, PERSONAS, POOL, decide } = window.SnakeAI;
  const PLAYER_COLOR = '#4ade80';

  const SPAWNS = [
    { x: 5, y: 3, dir: DIRS.right },
    { x: 20, y: 5, dir: DIRS.down },
    { x: 18, y: 20, dir: DIRS.left },
    { x: 3, y: 18, dir: DIRS.up },
  ];

  // ---------------------------------------------------------------- engine

  function makeSnake(id, spawn, props) {
    const d = spawn.dir;
    const body = [0, 1, 2].map(k => ({ x: spawn.x - d.x * k, y: spawn.y - d.y * k }));
    return {
      id, body, dir: d, alive: true, grow: 0, eaten: 0, pellets: 0, mushrooms: 0,
      queue: [], cause: null, diedAt: null, memory: {}, ...props,
    };
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
  // player (AI-only rounds), the first AI takes the player's spawn.
  function createGame({ withPlayer = true, personas = null } = {}) {
    const keys = personas || pickOpponents(withPlayer ? OPPONENTS : OPPONENTS + 1);
    const snakes = [];
    if (withPlayer) snakes.push(makeSnake(0, SPAWNS[0], { name: 'You', color: PLAYER_COLOR, isPlayer: true }));
    keys.forEach(key => {
      const id = snakes.length;
      snakes.push(aiSnake(id, SPAWNS[id % SPAWNS.length], key));
    });
    const game = {
      snakes, food: [], tick: 0, time: 0, history: [], withPlayer,
      holes: new Set(), peckOrder: ringOrder(), peckAt: 0, woodpecker: null,
    };
    fillFood(game);
    snapshot(game);
    return game;
  }

  const key = (x, y) => y * GRID + x;

  // Every cell, outermost ring first, each ring clockwise from the top-left:
  // the order the woodpecker pecks holes in.
  function ringOrder() {
    const order = [];
    for (let r = 0; r < GRID / 2; r++) {
      const lo = r, hi = GRID - 1 - r;
      for (let x = lo; x <= hi; x++) order.push({ x, y: lo });
      for (let y = lo + 1; y <= hi; y++) order.push({ x: hi, y });
      for (let x = hi - 1; x >= lo; x--) order.push({ x, y: hi });
      for (let y = hi - 1; y > lo; y--) order.push({ x: lo, y });
    }
    return order;
  }

  function tickMs(game) {
    return Math.max(MIN_TICK, START_TICK - (START_TICK - MIN_TICK) * game.time / RAMP_MS);
  }

  const suddenDeath = game => game.time >= SUDDEN_DEATH_MS;

  function fillFood(game) {
    // Golden apples rot and mushrooms wither.
    game.food = game.food.filter(f => f.expires == null || f.expires > game.tick);
    // Once the woodpecker is here, nothing new grows.
    if (suddenDeath(game)) return;

    const taken = new Set(game.holes);
    for (const s of game.snakes) if (s.alive) for (const c of s.body) taken.add(key(c.x, c.y));
    for (const f of game.food) taken.add(key(f.x, f.y));
    const free = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) if (!taken.has(key(x, y))) free.push({ x, y });
    }
    const place = props => {
      if (!free.length) return;
      const [cell] = free.splice(Math.floor(Math.random() * free.length), 1);
      game.food.push({ ...cell, ...props });
    };
    const count = kind => game.food.filter(f => f.kind === kind).length;
    for (let n = count('food'); n < APPLES; n++) place({ kind: 'food' });
    for (let n = count('mushroom'); n < MUSHROOMS; n++) place({ kind: 'mushroom', expires: game.tick + MUSHROOM_TICKS });
    if (!count('golden') && Math.random() < GOLDEN_CHANCE) {
      place({ kind: 'golden', expires: game.tick + GOLDEN_TICKS });
      game.events?.push({ type: 'spawn', kind: 'golden' });
    }
  }

  // Sudden death: peck the next free cell, outermost ring first.
  function peck(game) {
    if (!suddenDeath(game) || game.tick % PECK_EVERY) return;
    const busy = new Set();
    for (const s of game.snakes) if (s.alive) for (const c of s.body) busy.add(key(c.x, c.y));
    for (let i = game.peckAt; i < game.peckOrder.length; i++) {
      const c = game.peckOrder[i];
      const k = key(c.x, c.y);
      if (game.holes.has(k) || busy.has(k)) continue;
      game.holes.add(k);
      game.food = game.food.filter(f => f.x !== c.x || f.y !== c.y);
      if (!game.woodpecker) game.events.push({ type: 'woodpecker' });
      game.woodpecker = { x: c.x, y: c.y, at: game.time };
      break;
    }
    const order = game.peckOrder;
    while (game.peckAt < order.length && game.holes.has(key(order[game.peckAt].x, order[game.peckAt].y))) game.peckAt++;
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
  // Holes don't move, so those are always current.
  function aiView(game, snake) {
    const delay = Math.max(1, Math.round(REACTION_MS / tickMs(game)));
    const idx = Math.max(0, game.history.length - 1 - delay);
    const snap = game.history[idx];
    return {
      grid: GRID,
      me: { id: snake.id, body: snake.body, dir: snake.dir, grow: snake.grow },
      others: snap.snakes.filter(o => o.id !== snake.id),
      food: snap.food,
      holes: game.holes,
      age: game.history.length - 1 - idx,
      tick: game.tick,
      timeMs: game.time,
    };
  }

  // Advance one tick. All snakes move at the same time. Returns the snakes that died.
  // game.events lists what happened this tick, for the chatter and banners:
  // { type: 'eat', snake, kind } | { type: 'death', snake } | { type: 'spawn', kind } | { type: 'woodpecker' }
  function step(game) {
    game.events = [];
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

    // killer: 'wall' (walls and holes), 'self', or the name of the snake that was hit.
    const dying = [];
    for (const s of alive) {
      const { x, y } = s.next;
      const k = key(x, y);
      if (x < 0 || y < 0 || x >= GRID || y >= GRID) {
        s.cause = 'hit the wall'; s.killer = 'wall';
      } else if (game.holes.has(k)) {
        s.cause = 'fell into a woodpecker hole'; s.killer = 'wall';
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

    // Dead snakes turn into meat.
    const foodAt = new Set(game.food.map(f => key(f.x, f.y)));
    const bodyAt = new Set();
    for (const s of alive) if (!dying.includes(s)) for (const c of s.body) bodyAt.add(key(c.x, c.y));
    for (const s of dying) {
      s.alive = false;
      s.diedAt = game.tick;
      game.events.push({ type: 'death', snake: s });
      for (const c of s.body) {
        const k = key(c.x, c.y);
        if (foodAt.has(k) || bodyAt.has(k) || game.holes.has(k)) continue;
        foodAt.add(k);
        game.food.push({ x: c.x, y: c.y, kind: 'pellet', color: s.color });
      }
    }

    for (const s of game.snakes) {
      if (!s.alive) continue;
      const h = s.body[0];
      const i = game.food.findIndex(f => f.x === h.x && f.y === h.y);
      if (i < 0) continue;
      const [f] = game.food.splice(i, 1);
      game.events.push({ type: 'eat', snake: s, kind: f.kind });
      if (f.kind === 'mushroom') {
        // Shrink: cancel pending growth first, then drop tail segments.
        let n = SHRINK;
        const fromGrow = Math.min(s.grow, n);
        s.grow -= fromGrow;
        n -= fromGrow;
        while (n-- > 0 && s.body.length > MIN_LENGTH) s.body.pop();
        s.mushrooms++;
      } else {
        const growth = f.kind === 'golden' ? GOLDEN_GROWTH : 1;
        s.grow += growth;
        s.eaten += growth;
        if (f.kind === 'pellet') s.pellets++;
      }
    }

    peck(game);
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
  const flavorEl = document.getElementById('overlay-flavor');
  const toastEl = document.getElementById('toast');
  const speedEl = document.getElementById('speed');

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

  // Words. Picked at random where there's a list.
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const FLAVOR = {
    intro: 'Three rivals. One tree. Arrow keys or WASD to slither, or swipe on a phone.',
    rivals: ['Your rivals today:', 'Up the tree with you:', 'Sharing your bark:'],
    spectators: ['Tonight on the bark:', 'In the ring today:', 'Place your bets:'],
    go: ['Slither!', 'Go go go!', 'Off you go!'],
    pause: ['Having a little nap on the bark.', 'Snakes need rest too.'],
    deathTitle: ['Splat!', 'Bonk!', 'Squashed!', 'Oof.', 'Tangled!'],
    wall: ['The tree goes on. You don\'t.', 'That edge came out of nowhere.'],
    self: ['You tied yourself in a knot.', 'Ouch. That was your own tail.'],
    hole: ['The woodpecker sends its regards.', 'Mind the gap.'],
    win: ['King of the tree!', 'Last snake slithering.', 'You outlasted them all.'],
    draw: ['Nobody made it out.', 'Everyone loses. How fair.'],
    golden: ['A golden apple! Everyone pretends not to have seen it.', 'Something shiny just grew on the bark.'],
    woodpecker: ['The woodpecker is here! Holes are closing in from the edges.'],
    youGolden: ['Golden! +3.', 'Shiny and delicious. +3.'],
    youMushroom: ['You feel smaller. And somehow wiser.', 'Shrunk by 3. Sneaky.'],
  };

  // The human's snake, or null in an AI-only round.
  const player = () => game.snakes.find(s => s.isPlayer) || null;
  const playerAlive = () => !!player()?.alive;
  // Watching: an AI-only round, or you're out and the round goes on.
  const spectating = () => !playerAlive();
  let speed = 1;

  function newGame({ personas, aiOnly = false } = {}) {
    game = createGame({ personas, withPlayer: !aiOnly });
    Chatter.reset(game);
    buildScoreboard();
    buildOpponents();
    updateHud();
  }

  // A fresh round gets a short countdown so you can see who's playing.
  // The round shown on the start screen is used as-is.
  function start({ aiOnly = false } = {}) {
    if (state !== 'ready' || aiOnly !== !game.withPlayer) newGame({ aiOnly });
    state = 'countdown';
    draw();
    countdown(3);
  }

  function countdown(n) {
    if (state !== 'countdown') return;
    if (n === 0) return go();
    if (n === 3) game.rivalsLine = pick(game.withPlayer ? FLAVOR.rivals : FLAVOR.spectators);
    showOverlay(String(n), game.rivalsLine, 'Go!');
    clearTimeout(timer);
    timer = setTimeout(() => countdown(n - 1), 700);
  }

  function go() {
    state = 'running';
    hideOverlay();
    toast(pick(FLAVOR.go), 1200);
    updateSpeedControl();
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
      li.querySelector('strong').style.color = 'var(--ink)';
      li.querySelector('.blurb').textContent = s.persona.blurb;
      opponentsEl.appendChild(li);
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(tick, tickMs(game) / (spectating() ? speed : 1));
  }

  function tick() {
    if (state !== 'running') return;
    const wasAlive = playerAlive();
    const peckingBefore = !!game.woodpecker;

    const dying = step(game);
    updateHud();
    draw();
    Chatter.update();
    announce(dying, peckingBefore);

    // Everyone still alive finished ahead of the snakes that just died; if
    // nobody is, they share first place (a draw).
    const alive = game.snakes.filter(s => s.alive);
    for (const s of dying) finishSnake(s, { place: alive.length + 1, draw: alive.length === 0 });
    if (alive.length <= 1) {
      if (alive.length) finishSnake(alive[0], { place: 1, won: true });
      return endRound();
    }
    if (wasAlive && !playerAlive()) {
      const p = player();
      showOverlay(pick(FLAVOR.deathTitle), `You ${p.cause} · ${Records.ordinal(game.result.place)} place · score ${p.eaten}`,
        'Play again', 'Watch', killLine(p));
      updateSpeedControl();
    }
    schedule();
  }

  // Banners for the big moments of a round.
  function announce(dying, peckingBefore) {
    const alive = game.snakes.filter(s => s.alive);
    if (!peckingBefore && game.woodpecker) return toast(pick(FLAVOR.woodpecker));
    if (dying.length && !game.firstBlood) {
      game.firstBlood = true;
      const v = dying[0];
      const killer = game.snakes.find(o => o.name === v.killer && o !== v);
      return toast(killer ? `First blood! ${who(killer)} got ${who(v, true)}.` : `First blood: ${who(v)} ${v.cause}.`);
    }
    if (dying.length && alive.length === 2) return toast(`It's down to ${who(alive[0])} and ${who(alive[1], true)}.`);
    for (const e of game.events) {
      if (e.type === 'spawn' && e.kind === 'golden') return toast(pick(FLAVOR.golden));
      if (e.type === 'eat' && e.snake.isPlayer && e.kind === 'golden') return toast(pick(FLAVOR.youGolden), 1500);
      if (e.type === 'eat' && e.snake.isPlayer && e.kind === 'mushroom') return toast(pick(FLAVOR.youMushroom), 1800);
    }
  }

  // "you" for the human, the name for everyone else.
  const who = (s, object = false) => s.isPlayer ? (object ? 'you' : 'You') : s.name;

  // Flavor for the death screen: the killer's own line, if an AI got you.
  function killLine(p) {
    const killer = game.snakes.find(s => s.persona && s.name === p.killer);
    if (killer) return killer.persona.kill;
    if (p.cause === 'fell into a woodpecker hole') return pick(FLAVOR.hole);
    if (p.killer === 'self') return pick(FLAVOR.self);
    return pick(FLAVOR.wall);
  }

  // Record a snake's round on the high scores once, as soon as its placement
  // is known. AI-only rounds aren't recorded.
  function finishSnake(s, { place, won = false, draw = false }) {
    if (s.result || !game.withPlayer) return;
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
      showOverlay('Paused', `${pick(FLAVOR.pause)} Space or P to wake up.`, 'Resume');
    } else if (state === 'paused') {
      state = 'running';
      hideOverlay();
      schedule();
    }
  }

  function recordBest() {
    const score = player()?.eaten ?? 0;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      saveBest(best);
    }
  }

  function endRound() {
    state = 'over';
    clearTimeout(timer);
    updateSpeedControl();
    const survivors = game.snakes.filter(s => s.alive);
    const winner = survivors[0];
    const title = !winner ? 'Draw' : winner.isPlayer ? 'You win!' : `${winner.name} wins`;
    const flavor = !winner ? pick(FLAVOR.draw) : winner.isPlayer ? pick(FLAVOR.win) : winner.persona.win;
    if (!game.withPlayer) return showOverlay(title, '', 'Play', 'Watch again', flavor);
    recordBest();
    const { place, won } = game.result;
    showOverlay(title, `You finished ${won ? '1st' : Records.ordinal(place)} · score ${player().eaten}`, 'Play again', 'Watch AIs', flavor);
  }

  function showOverlay(title, text, button, secondary, flavor = '') {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayText.hidden = !text;
    flavorEl.textContent = flavor;
    flavorEl.hidden = !flavor;
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

  // A short message over the board.
  let toastTimer;
  function toast(text, ms = 3000) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
  }

  // Speed buttons, while you're watching.
  function updateSpeedControl() {
    speedEl.hidden = !(state === 'running' || state === 'paused') || !spectating();
    for (const b of speedEl.querySelectorAll('button')) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === speed));
  }

  function setSpeed(n) {
    speed = n;
    updateSpeedControl();
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
    scoreEl.textContent = player()?.eaten ?? 0;
    for (const s of game.snakes) {
      s.row.querySelector('.dot').style.background = dotColor(s);
      s.row.classList.toggle('dead', !s.alive);
      s.row.querySelector('.len').textContent = s.alive ? s.body.length : 'out';
    }
  }

  function draw() {
    ctx.drawImage(bark(), 0, 0);

    // Faint cell lines so the grid stays readable on the bark.
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID; i++) {
      ctx.moveTo(i * cell + 0.5, 0); ctx.lineTo(i * cell + 0.5, canvas.height);
      ctx.moveTo(0, i * cell + 0.5); ctx.lineTo(canvas.width, i * cell + 0.5);
    }
    ctx.stroke();

    for (const k of game.holes) drawHole(k % GRID, Math.floor(k / GRID));
    for (const s of game.snakes) {
      if (!s.alive) continue;
      if (s.memory.home) drawHome(s);
      if (s.memory.colonies) drawColonies(s);
    }

    for (const f of game.food) {
      const x = f.x * cell + cell / 2, y = f.y * cell + cell / 2;
      if (f.kind === 'pellet') drawMeat(x, y, f.color);
      else if (f.kind === 'mushroom') drawMushroom(x, y);
      else if (f.kind === 'golden') {
        // Blinks when it's about to rot.
        const left = f.expires - game.tick;
        if (left > 30 || Math.floor(left / 3) % 2) drawApple(x, y, '#fbbf24', true);
      } else drawApple(x, y, '#84cc16');
    }

    for (const s of game.snakes) if (s.alive) drawSnake(s);
    if (game.woodpecker) drawWoodpecker(game.woodpecker);
  }

  // ---------------------------------------------------------------- scenery

  // Bark, drawn once: vertical grain, knots, and leaves in the corners.
  // Inspired by the caterpillar game in Flåklypa Grand Prix: Gullutgave,
  // but drawn from scratch.
  let barkCanvas = null;
  function bark() {
    if (barkCanvas) return barkCanvas;
    const W = canvas.width, H = canvas.height;
    const b = document.createElement('canvas');
    b.width = W; b.height = H;
    const g = b.getContext('2d');
    let seed = 7; // fixed seed: the same tree every time
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    g.fillStyle = '#5a3b22';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const dark = rnd() < 0.55;
      g.strokeStyle = dark ? `rgba(28,16,6,${0.15 + rnd() * 0.25})` : `rgba(150,108,66,${0.08 + rnd() * 0.15})`;
      g.lineWidth = 2 + rnd() * 10;
      let x = rnd() * W, y = -20;
      g.beginPath();
      g.moveTo(x, y);
      while (y < H + 20) { y += 30 + rnd() * 40; x += (rnd() - 0.5) * 14; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 6; i++) { // knots
      const x = rnd() * W, y = rnd() * H, r = 10 + rnd() * 16;
      const grad = g.createRadialGradient(x, y, 1, x, y, r);
      grad.addColorStop(0, 'rgba(20,10,3,0.8)');
      grad.addColorStop(0.6, 'rgba(60,36,16,0.5)');
      grad.addColorStop(1, 'rgba(60,36,16,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(x, y, r * 0.6, r, 0, 0, Math.PI * 2);
      g.fill();
    }
    const greens = ['#65a30d', '#4d7c0f', '#84cc16', '#3f6212'];
    const corner = (cx, cy, base) => {
      for (let i = 0; i < 7; i++) {
        const a = base + (rnd() - 0.5) * 1.6;
        leaf(g, cx, cy, cell * (1.6 + rnd() * 1.4), a, greens[Math.floor(rnd() * greens.length)]);
      }
    };
    corner(0, 0, Math.PI / 4);
    corner(W, 0, Math.PI * 3 / 4);
    corner(W, H, -Math.PI * 3 / 4);
    corner(0, H, -Math.PI / 4);
    barkCanvas = b;
    return b;
  }

  function leaf(g, x, y, len, angle, color) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(len / 2, -len * 0.32, len, 0);
    g.quadraticCurveTo(len / 2, len * 0.32, 0, 0);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(len * 0.9, 0);
    g.stroke();
    g.restore();
  }

  function drawHole(gx, gy) {
    const x = gx * cell + cell / 2, y = gy * cell + cell / 2;
    const grad = ctx.createRadialGradient(x, y, 1, x, y, cell * 0.5);
    grad.addColorStop(0, '#0b0603');
    grad.addColorStop(0.7, '#1c1007');
    grad.addColorStop(1, '#3b2412');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, cell * 0.46, cell * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // The woodpecker sits next to its latest hole and bobs as it pecks.
  function drawWoodpecker({ x, y, at }) {
    const c = cell;
    const bob = Math.max(0, 1 - (game.time - at) / 250) * c * 0.15;
    // Sit beside the hole, on the side facing the middle of the board.
    const side = x < GRID / 2 ? 1 : -1;
    ctx.save();
    ctx.translate(x * c + c / 2 + side * (c * 1.1 - bob), y * c + c / 2);
    ctx.scale(side * 1.7, 1.7); // beak points at the hole; a big bird
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    circle(c * 0.08, c * 0.1, c * 0.5);
    ctx.fillStyle = '#18181b'; // body
    ctx.beginPath();
    ctx.ellipse(c * 0.1, 0, c * 0.32, c * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5f5f4'; // white wing bars and cheek
    ctx.fillRect(c * 0.05, -c * 0.25, c * 0.18, c * 0.07);
    ctx.fillRect(c * 0.05, c * 0.05, c * 0.18, c * 0.07);
    circle(-c * 0.12, -c * 0.32, c * 0.12);
    ctx.fillStyle = '#18181b';
    circle(-c * 0.1, -c * 0.38, c * 0.16); // head
    ctx.fillStyle = '#dc2626';
    circle(-c * 0.02, -c * 0.5, c * 0.12); // red crest
    ctx.fillStyle = '#f5f5f4';
    circle(-c * 0.16, -c * 0.4, c * 0.04); // eye
    ctx.fillStyle = '#71717a'; // beak
    ctx.beginPath();
    ctx.moveTo(-c * 0.24, -c * 0.44);
    ctx.lineTo(-c * 0.62, -c * 0.36);
    ctx.lineTo(-c * 0.24, -c * 0.32);
    ctx.fill();
    ctx.restore();
  }

  // ------------------------------------------------------------------ items

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

  function drawApple(x, y, color, shine) {
    if (shine) { // golden glow
      const grad = ctx.createRadialGradient(x, y, cell * 0.2, x, y, cell * 0.75);
      grad.addColorStop(0, 'rgba(253,224,71,0.55)');
      grad.addColorStop(1, 'rgba(253,224,71,0)');
      ctx.fillStyle = grad;
      circle(x, y, cell * 0.75);
    }
    ctx.fillStyle = color;
    circle(x, y + cell * 0.04, cell * 0.34);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    circle(x - cell * 0.12, y - cell * 0.06, cell * 0.08);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = cell * 0.07;
    ctx.beginPath();
    ctx.moveTo(x, y - cell * 0.22);
    ctx.lineTo(x + cell * 0.04, y - cell * 0.42);
    ctx.stroke();
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(x + cell * 0.17, y - cell * 0.36, cell * 0.14, cell * 0.07, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMushroom(x, y) {
    ctx.fillStyle = '#fef3c7'; // stem
    ctx.fillRect(x - cell * 0.1, y - cell * 0.02, cell * 0.2, cell * 0.36);
    ctx.fillStyle = '#dc2626'; // cap
    ctx.beginPath();
    ctx.ellipse(x, y, cell * 0.4, cell * 0.3, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circle(x - cell * 0.18, y - cell * 0.1, cell * 0.06);
    circle(x + cell * 0.06, y - cell * 0.2, cell * 0.06);
    circle(x + cell * 0.22, y - cell * 0.06, cell * 0.05);
  }

  // A drumstick, tinted with the color of the snake it came from.
  function drawMeat(x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.7);
    ctx.fillStyle = '#f5f5f4'; // bone
    ctx.fillRect(cell * 0.05, -cell * 0.05, cell * 0.28, cell * 0.1);
    circle(cell * 0.34, -cell * 0.06, cell * 0.07);
    circle(cell * 0.34, cell * 0.06, cell * 0.07);
    ctx.fillStyle = mix(color.startsWith('#') ? color : '#b45309', '#9a3412', 0.55);
    ctx.beginPath();
    ctx.ellipse(-cell * 0.08, 0, cell * 0.24, cell * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    circle(-cell * 0.14, -cell * 0.06, cell * 0.06);
    ctx.restore();
  }

  // Sovereign's home turf: a faint tint and a dashed border.
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
    ringAround(x, y, radius, s.color);
    ctx.restore();
  }

  // Colonist's colonies: a dashed ring and a flag in each.
  function drawColonies(s) {
    ctx.save();
    for (const c of s.memory.colonies) {
      ringAround(c.x, c.y, c.radius, s.color);
      const fx = c.x * cell + cell / 2, fy = c.y * cell + cell / 2;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#e7d7b1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx, fy + cell * 0.6);
      ctx.lineTo(fx, fy - cell * 0.9);
      ctx.stroke();
      const w = cell * 0.9, h = cell * 0.6, top = fy - cell * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx, top, w, h);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(fx + w * 0.4, top, w * 0.2, h);
      ctx.fillRect(fx, top + h * 0.38, w, h * 0.24);
    }
    ctx.restore();
  }

  function ringAround(x, y, radius, color) {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(x * cell + cell / 2, y * cell + cell / 2, (radius + 0.5) * cell, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ----------------------------------------------------------------- snakes

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
    : s.personaKey === 'joker' ? 'linear-gradient(90deg, #a21caf 50%, #22c55e 50%)'
    : s.persona?.ink || colorOf(s);

  // Snakes are drawn like caterpillars: round segments joined by a thick
  // band, a body that tapers toward the tail, and a slightly bigger head.
  // Fades blend toward the bark color rather than using transparency, so
  // overlapping segments don't leave dark seams.
  const BARK = '#5a3b22';

  function segmentFill(s, look, color, i, n, now) {
    const t = i / Math.max(1, n - 1); // 0 at the head, 1 at the tail
    if (s.personaKey === 'wildcard') return `hsl(${(now / 15 + i * 28) % 360}, 85%, 62%)`;
    if (look === 'joker') return i === 0 ? '#f8fafc' : i % 2 ? '#22c55e' : '#a21caf';
    if (look === 'vulture' && i === 0) return '#f9a8d4'; // bald pink head
    if (look === 'vulture' && i === 1) return '#f5f5f4'; // white neck ruff
    let fill = color.startsWith('#') ? color : null;
    if (!fill) return color; // already an rgb() mix (Copycat)
    if (look === 'hunter' && i % 3 === 2) fill = mix(fill, '#000000', 0.45);
    const fade = look === 'ghost' ? 0.75 * t : look === 'creeper' ? 0.15 + 0.45 * t : look === 'drab' ? 0.15 : 0.3 * t;
    return fade ? mix(fill.startsWith('#') ? fill : color, BARK, fade) : fill;
  }

  function drawSnake(s) {
    const look = lookOf(s);
    const color = colorOf(s);
    const n = s.body.length;
    const now = performance.now();
    const radius = i => i === 0 ? cell * 0.54 : cell * (0.44 - 0.1 * (i / Math.max(1, n - 1)));
    const center = c => ({ x: c.x * cell + cell / 2, y: c.y * cell + cell / 2 });

    // Shadow first, the whole snake at once.
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = n - 1; i >= 0; i--) {
      const p = center(s.body[i]);
      circle(p.x + 2, p.y + 4, radius(i));
    }

    // Tail to head, so the head ends up on top.
    for (let i = n - 1; i >= 0; i--) {
      const p = center(s.body[i]);
      const r = radius(i);
      const fill = segmentFill(s, look, color, i, n, now);
      if (i < n - 1) { // band joining this segment to the one behind it
        const q = center(s.body[i + 1]);
        ctx.strokeStyle = segmentFill(s, look, color, i + 1, n, now);
        ctx.lineWidth = radius(i + 1) * 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      ctx.fillStyle = fill;
      circle(p.x, p.y, r);
      // A little highlight gives each segment some roundness.
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      circle(p.x - r * 0.3, p.y - r * 0.35, r * 0.35);

      if (i === 0) continue;
      if (look === 'mason') { // stone bricks
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = 'rgba(30,41,59,0.6)';
        ctx.lineWidth = 1.6;
        const off = (s.body[i].x + s.body[i].y) % 2 ? -r * 0.35 : r * 0.35;
        ctx.beginPath();
        ctx.moveTo(p.x - r, p.y); ctx.lineTo(p.x + r, p.y);
        ctx.moveTo(p.x + off, p.y - r); ctx.lineTo(p.x + off, p.y);
        ctx.moveTo(p.x - off, p.y); ctx.lineTo(p.x - off, p.y + r);
        ctx.stroke();
        ctx.restore();
      }
      if (look === 'colonist') { // white cross-belts
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2.2;
        const d = r * 0.62;
        ctx.beginPath();
        ctx.moveTo(p.x - d, p.y - d); ctx.lineTo(p.x + d, p.y + d);
        ctx.moveTo(p.x + d, p.y - d); ctx.lineTo(p.x - d, p.y + d);
        ctx.stroke();
      }
      if (look === 'vulture' && i > 1) { // pale edge so the black shows on the bark
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r - 1, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (s.personaKey === 'copycat') { // dashed ring: a copy of someone
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r - 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Head features, drawn in a frame where +x points the way the snake faces.
    const h = s.body[0];
    ctx.save();
    ctx.translate(h.x * cell + cell / 2, h.y * cell + cell / 2);
    ctx.rotate(Math.atan2(s.dir.y, s.dir.x));
    ctx.scale(1.1, 1.1);
    drawFace(s, look, color);
    ctx.restore();

    // Capricious: a ring that flashes out when its mood changes.
    if (s.personaKey === 'capricious' && s.memory.moodChangedAt != null) {
      const age = game.time - s.memory.moodChangedAt;
      if (age < 900) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1 - age / 900;
        ctx.lineWidth = 3;
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
    const tri = (pts, fill) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(pts[0] * c, pts[1] * c);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] * c, pts[i + 1] * c);
      ctx.fill();
    };

    switch (look) {
      case 'hunter': { // fangs and angry brows
        for (const k of [-1, 1]) tri([0.36, k * 0.06, 0.36, k * 0.2, 0.56, k * 0.12], '#ffffff');
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
        const hungry = game.food.some(f => f.kind !== 'mushroom' && Math.abs(f.x - h.x) + Math.abs(f.y - h.y) <= 3);
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
      case 'sovereign': // a golden crown, spikes pointing back
        tri([0.02, -0.34, 0.02, 0.34, -0.42, 0.34, -0.22, 0.17, -0.42, 0, -0.22, -0.17, -0.42, -0.34], '#facc15');
        ctx.fillStyle = '#dc2626';
        circle(-c * 0.06, 0, c * 0.07);
        eyes(0.08);
        break;
      case 'colonist': // redcoat's black tricorn hat with gold trim
        tri([0.05, 0, -0.45, -0.45, -0.45, 0.45], '#111827');
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = c * 0.04;
        ctx.beginPath();
        ctx.moveTo(c * 0.05, 0); ctx.lineTo(-c * 0.45, -c * 0.45);
        ctx.lineTo(-c * 0.45, c * 0.45); ctx.closePath();
        ctx.stroke();
        eyes(0.08);
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
        tri([0.32, -0.12, 0.6, 0, 0.32, 0.12], '#52525b');
        eyes(0.05);
        break;
      case 'mason': { // laurel wreath around the back of the head
        ctx.fillStyle = '#65a30d';
        for (let a = Math.PI * 0.55; a <= Math.PI * 1.45; a += Math.PI * 0.15) {
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * c * 0.36, Math.sin(a) * c * 0.36, c * 0.11, c * 0.06, a + Math.PI / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        eyes(0.08);
        break;
      }
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
        ctx.fillStyle = '#ffffff'; // taped-up bridge
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
        ctx.fillStyle = '#ffffff';
        circle(c * 0.22, -c * 0.14, c * 0.12);
        ctx.fillStyle = dark;
        circle(c * 0.25, -c * 0.14, c * 0.06);
        circle(c * 0.2, c * 0.2, c * 0.05);
        break;
      }
      case 'copycat': { // cat ears, cat eyes and whiskers
        for (const k of [-1, 1]) {
          tri([-0.3, k * 0.1, -0.05, k * 0.42, -0.45, k * 0.5], color.startsWith('#') ? color : '#e5e7eb');
          tri([-0.28, k * 0.18, -0.12, k * 0.38, -0.38, k * 0.42], '#f9a8d4');
        }
        ctx.fillStyle = '#16a34a';
        for (const k of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(c * 0.15, k * c * 0.2, c * 0.08, c * 0.1, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = dark;
        for (const k of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(c * 0.15, k * c * 0.2, c * 0.08, c * 0.025, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(15,23,42,0.75)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (const k of [-1, 1]) {
          for (const spread of [0.3, 0.45, 0.6]) {
            ctx.moveTo(c * 0.34, k * c * 0.08);
            ctx.lineTo(c * 0.52, k * c * spread);
          }
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
      case 'joker': // jester hat with bells, red nose
        tri([-0.1, -0.3, -0.55, -0.62, -0.32, -0.05], '#a21caf');
        tri([-0.1, 0.3, -0.55, 0.62, -0.32, 0.05], '#22c55e');
        ctx.fillStyle = '#facc15';
        circle(-c * 0.55, -c * 0.62, c * 0.08);
        circle(-c * 0.55, c * 0.62, c * 0.08);
        ctx.fillStyle = '#ef4444';
        circle(c * 0.36, 0, c * 0.1);
        eyes(0.07);
        break;
      default: // the player
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
    if (state === 'running') togglePause();
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
      // Every persona's color, not just this round's, plus old names (Viper, Warden).
      const colors = { self: PLAYER_COLOR, Viper: '#c084fc', Warden: '#3b82f6' };
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
      if ((state === 'running' || state === 'countdown') && playerAlive()) turn(KEYS[e.key]);
    } else if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (state === 'running' || state === 'paused') togglePause();
      else if (state === 'countdown') go();
      else start();
    } else if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      start();
    } else if (['1', '2', '3'].includes(e.key) && !speedEl.hidden) {
      setSpeed([1, 2, 4][Number(e.key) - 1]);
    }
  });

  // Touch swipes
  let touchStart = null;
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', e => {
    if (!touchStart || (state !== 'running' && state !== 'countdown') || !playerAlive()) return;
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
  const Chatter = window.SnakeChatter;
  Chatter.init({ boardEl: document.querySelector('.board'), logEl: document.getElementById('chatlog'), grid: GRID });
  const chatterBtn = document.getElementById('chatter-toggle');
  const showChatter = () => {
    chatterBtn.textContent = Chatter.isEnabled() ? 'On' : 'Off';
    chatterBtn.setAttribute('aria-pressed', String(Chatter.isEnabled()));
    document.getElementById('chatlog').hidden = !Chatter.isEnabled();
  };
  chatterBtn.addEventListener('click', () => { Chatter.setEnabled(!Chatter.isEnabled()); showChatter(); });
  showChatter();

  // Secondary button: keep watching after you die, or start an AI-only round.
  watchBtn.addEventListener('click', () => {
    if (state === 'running') hideOverlay();
    else start({ aiOnly: true });
  });
  speedEl.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) setSpeed(Number(b.dataset.speed));
  });

  // Start screen: show this round's opponents.
  function ready(personas) {
    clearTimeout(timer);
    newGame({ personas });
    state = 'ready';
    showOverlay('Bark & Bite', FLAVOR.intro, 'Play', 'Watch AIs');
    draw();
  }
  ready();

  // Tuning tools: open the page with ?debug, then in the console:
  //   await SnakeDebug.simulate({ rounds: 50 })   4 random AIs per round, stats per persona
  //   SnakeDebug.setup(['hunter', 'sovereign', 'ghost'])   start screen with chosen opponents
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
