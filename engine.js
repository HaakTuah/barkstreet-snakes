// The rules of Bark & Bite: no DOM, no drawing. The game (snake.js) and the
// headless simulator both run this file unchanged. Tuning lives in tuning.js.
window.SnakeEngine = (() => {
  const T = window.TUNING;
  const { GRID } = T;
  const CELLS = GRID * GRID;
  const { DIRS, PERSONAS, POOL, decide } = window.SnakeAI;
  const PLAYER_COLOR = '#4ade80';

  const SPAWNS = [
    { x: 5, y: 3, dir: DIRS.right },
    { x: 20, y: 5, dir: DIRS.down },
    { x: 18, y: 20, dir: DIRS.left },
    { x: 3, y: 18, dir: DIRS.up },
  ];

  // Occupancy grids for collision checks, reused every tick. A cell counts as
  // marked only when its stamp equals the current tick's stamp, so nothing
  // needs clearing between ticks.
  const bodyStamp = new Int32Array(CELLS), bodyOwner = new Int16Array(CELLS);
  const headStamp = new Int32Array(CELLS), headCount = new Uint8Array(CELLS), headFirst = new Int16Array(CELLS);
  let stamp = 0;

  const key = (x, y) => y * GRID + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < GRID && y < GRID;

  function makeSnake(id, spawn, props) {
    const d = spawn.dir;
    const body = [0, 1, 2].map(k => ({ x: spawn.x - d.x * k, y: spawn.y - d.y * k }));
    return {
      id, body, dir: d, alive: true, grow: 0, eaten: 0, pellets: 0, lastAte: 0, nextStarve: T.HUNGER_MS,
      queue: [], cause: null, killer: null, diedAt: null, memory: {}, planned: null, plannedTick: -1, ...props,
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
    const wanted = withPlayer ? T.OPPONENTS : T.OPPONENTS + 1;
    const keys = (personas || pickOpponents(wanted)).filter(k => PERSONAS[k]).slice(0, wanted);
    const snakes = [];
    if (withPlayer) snakes.push(makeSnake(0, SPAWNS[0], { name: 'You', color: PLAYER_COLOR, isPlayer: true }));
    keys.forEach(k => {
      const id = snakes.length;
      snakes.push(aiSnake(id, SPAWNS[id % SPAWNS.length], k));
    });
    const game = {
      snakes, food: [], tick: 0, time: 0, history: [], withPlayer, events: [],
      holes: new Set(), peckOrder: ringOrder(), peckAt: 0, woodpecker: null,
    };
    fillFood(game);
    snapshot(game);
    return game;
  }

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

  // How long the next tick lasts. The opening ticks ease from OPENING_TICK down
  // to START_TICK, then the speed ramps gently toward MIN_TICK.
  function tickMs(game) {
    if (game.tick < T.OPENING_TICKS) {
      return T.OPENING_TICK + (T.START_TICK - T.OPENING_TICK) * (game.tick / T.OPENING_TICKS);
    }
    return Math.max(T.MIN_TICK, T.START_TICK - (T.START_TICK - T.MIN_TICK) * game.time / T.RAMP_MS);
  }

  const suddenDeath = game => game.time >= T.SUDDEN_DEATH_MS;

  // Milliseconds until a snake starts starving (negative once it has).
  const hungerLeft = (game, s) => s.lastAte + T.HUNGER_MS - game.time;

  // Mark every living body cell in the occupancy grid (with a fresh stamp).
  function markBodies(game) {
    stamp++;
    for (const s of game.snakes) {
      if (!s.alive) continue;
      for (const c of s.body) { bodyStamp[key(c.x, c.y)] = stamp; bodyOwner[key(c.x, c.y)] = s.id; }
    }
  }

  function fillFood(game) {
    // Golden apples rot and mushrooms wither.
    if (game.food.some(f => f.expires != null && f.expires <= game.tick)) {
      game.food = game.food.filter(f => f.expires == null || f.expires > game.tick);
    }
    // Once the woodpecker is here, nothing new grows.
    if (suddenDeath(game)) return;

    let apples = 0, mushrooms = 0, golden = 0;
    for (const f of game.food) {
      if (f.kind === 'food') apples++;
      else if (f.kind === 'mushroom') mushrooms++;
      else if (f.kind === 'golden') golden++;
    }

    // Pick from the truly free cells (no bodies, holes or food), worked out
    // only when something actually needs placing.
    let free = null;
    const place = props => {
      if (!free) {
        markBodies(game);
        for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
        for (const k of game.holes) bodyStamp[k] = stamp;
        free = [];
        for (let k = 0; k < CELLS; k++) if (bodyStamp[k] !== stamp) free.push(k);
      }
      if (!free.length) return false; // a full board: nothing grows, and that's fine
      const [k] = free.splice(Math.floor(Math.random() * free.length), 1);
      game.food.push({ x: k % GRID, y: Math.floor(k / GRID), ...props });
      return true;
    };
    for (; apples < T.APPLES; apples++) place({ kind: 'food' });
    for (; mushrooms < T.MUSHROOMS; mushrooms++) place({ kind: 'mushroom', expires: game.tick + T.MUSHROOM_TICKS });
    if (!golden && Math.random() < T.GOLDEN_CHANCE && place({ kind: 'golden', expires: game.tick + T.GOLDEN_TICKS })) {
      game.events.push({ type: 'spawn', kind: 'golden' });
    }
  }

  // Sudden death: peck the next free cell, outermost ring first.
  function peck(game) {
    if (!suddenDeath(game) || game.tick % T.PECK_EVERY) return;
    markBodies(game);
    const order = game.peckOrder;
    for (let i = game.peckAt; i < order.length; i++) {
      const c = order[i];
      const k = key(c.x, c.y);
      if (game.holes.has(k) || bodyStamp[k] === stamp) continue;
      game.holes.add(k);
      game.food = game.food.filter(f => f.x !== c.x || f.y !== c.y);
      if (!game.woodpecker) game.events.push({ type: 'woodpecker' });
      game.events.push({ type: 'peck', x: c.x, y: c.y });
      game.woodpecker = { x: c.x, y: c.y, at: game.time };
      break;
    }
    while (game.peckAt < order.length && game.holes.has(key(order[game.peckAt].x, order[game.peckAt].y))) game.peckAt++;
  }

  function snapshot(game) {
    game.history.push({
      snakes: game.snakes.filter(s => s.alive).map(s => ({
        id: s.id, body: s.body.map(c => ({ x: c.x, y: c.y })), dir: s.dir,
      })),
      food: game.food.map(f => ({ ...f })),
    });
    if (game.history.length > T.HISTORY) game.history.shift();
  }

  // What an AI "sees": its own body now, everything else as of its reaction
  // time ago. Rivals are just ids and bodies; nothing says which one is human.
  // Holes don't move, so those are always current.
  function aiView(game, snake) {
    const delay = Math.max(1, Math.round(T.REACTION_MS / tickMs(game)));
    const idx = Math.max(0, game.history.length - 1 - delay);
    const snap = game.history[idx];
    return {
      grid: GRID,
      me: { id: snake.id, body: snake.body, dir: snake.dir, grow: snake.grow, hungerLeft: hungerLeft(game, snake) },
      others: snap.snakes.filter(o => o.id !== snake.id),
      food: snap.food,
      holes: game.holes,
      age: game.history.length - 1 - idx,
      tick: game.tick,
      timeMs: game.time,
    };
  }

  // The game can let an AI think ahead of the tick (spread over the frames in
  // between), as long as nothing it looks at can change before the tick:
  // everything in aiView() is fixed between ticks, except a snake about to
  // starve, which shrinks at the start of the tick and must decide after that.
  const canThinkAhead = (game, s) => s.alive && !s.isPlayer && game.time < s.nextStarve && s.plannedTick !== game.tick;

  function thinkAhead(game, s) {
    s.planned = decide(aiView(game, s), s.persona, s.memory);
    s.plannedTick = game.tick;
  }

  // Advance one tick. All snakes move at the same time. Returns the snakes that died.
  // game.events lists what happened this tick, for the chatter, sounds and banners:
  // { type: 'eat', snake, kind } | { type: 'death', snake } | { type: 'spawn', kind }
  // | { type: 'starving', snake } | { type: 'woodpecker' } | { type: 'peck', x, y }
  function step(game) {
    game.events = [];

    const dying = [];
    for (const s of game.snakes) {
      if (!s.alive || game.time < s.nextStarve) continue;
      s.nextStarve = game.time + T.STARVE_EVERY_MS;
      if (s.grow > 0) s.grow--;
      else if (s.body.length > T.MIN_LENGTH) s.body.pop();
      else { s.cause = 'starved'; s.killer = 'hunger'; dying.push(s); continue; }
      if (hungerLeft(game, s) > -T.STARVE_EVERY_MS) game.events.push({ type: 'starving', snake: s });
    }

    const alive = game.snakes.filter(s => s.alive && !dying.includes(s));

    for (const s of alive) {
      if (s.isPlayer) {
        if (s.queue.length) s.dir = s.queue.shift();
      } else {
        s.dir = s.plannedTick === game.tick ? s.planned : decide(aiView(game, s), s.persona, s.memory);
      }
      s.planned = null;
      s.plannedTick = -1;
      s.next = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
      s.tailMoves = s.grow === 0;
    }

    // Cells still occupied by bodies after everyone moves (tails that move
    // away are free), and how many heads arrive in each on-board cell.
    stamp++;
    for (const s of alive) {
      const keep = s.tailMoves ? s.body.length - 1 : s.body.length;
      for (let j = 0; j < keep; j++) {
        const k = key(s.body[j].x, s.body[j].y);
        bodyStamp[k] = stamp;
        bodyOwner[k] = s.id;
      }
    }
    for (const s of alive) {
      if (!inside(s.next.x, s.next.y)) continue; // off-board heads never meet anyone
      const k = key(s.next.x, s.next.y);
      if (headStamp[k] !== stamp) { headStamp[k] = stamp; headCount[k] = 0; headFirst[k] = s.id; }
      headCount[k]++;
    }

    // killer: 'wall' (walls and holes), 'self', 'hunger', or the name of the snake that was hit.
    for (const s of alive) {
      const { x, y } = s.next;
      const k = key(x, y);
      if (!inside(x, y)) {
        s.cause = 'hit the wall'; s.killer = 'wall';
      } else if (game.holes.has(k)) {
        s.cause = 'fell into a woodpecker hole'; s.killer = 'wall';
      } else if (bodyStamp[k] === stamp) {
        const other = game.snakes[bodyOwner[k]];
        s.killer = other === s ? 'self' : other.name;
        s.cause = other === s ? 'bit itself' : `ran into ${other.isPlayer ? 'you' : other.name}`;
      } else if (headStamp[k] === stamp && headCount[k] > 1) {
        const other = alive.find(o => o !== s && o.next.x === x && o.next.y === y);
        s.cause = `crashed head-on into ${other.isPlayer ? 'you' : other.name}`; s.killer = other.name;
      } else continue;
      dying.push(s);
    }

    for (const s of alive) {
      if (dying.includes(s)) continue;
      s.body.unshift(s.next);
      if (s.tailMoves) s.body.pop(); else s.grow--;
    }

    // Dead snakes turn into meat (never on food, living bodies or holes).
    if (dying.length) {
      for (const s of dying) s.alive = false; // before marking, so only the living block meat
      markBodies(game);
      for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
      for (const s of dying) {
        s.diedAt = game.tick;
        game.events.push({ type: 'death', snake: s });
        for (const c of s.body) {
          const k = key(c.x, c.y);
          if (bodyStamp[k] === stamp || game.holes.has(k)) continue;
          bodyStamp[k] = stamp;
          game.food.push({ x: c.x, y: c.y, kind: 'pellet', color: s.color });
        }
      }
    }

    for (const s of game.snakes) {
      if (!s.alive) continue;
      const h = s.body[0];
      const i = game.food.findIndex(f => f.x === h.x && f.y === h.y);
      if (i < 0) continue;
      const [f] = game.food.splice(i, 1);
      game.events.push({ type: 'eat', snake: s, kind: f.kind, x: h.x, y: h.y, color: f.color });
      if (f.kind === 'mushroom') {
        // Shrink: cancel pending growth first, then drop tail segments.
        let n = T.SHRINK;
        const fromGrow = Math.min(s.grow, n);
        s.grow -= fromGrow;
        n -= fromGrow;
        while (n-- > 0 && s.body.length > T.MIN_LENGTH) s.body.pop();
      } else {
        const growth = f.kind === 'golden' ? T.GOLDEN_GROWTH : 1;
        s.lastAte = game.time;
        s.nextStarve = game.time + T.HUNGER_MS;
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

  return {
    GRID, PLAYER_COLOR, PERSONAS, DIRS,
    createGame, step, tickMs, hungerLeft, aiView, canThinkAhead, thinkAhead, suddenDeath,
  };
})();
