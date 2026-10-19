// The rules of Barkstreet Snakes: no DOM, no drawing. The game (snake.js) and the
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
  // One cell on from (x, y) in direction d: off the board, unless the edges
  // wrap round for this snake (a golden mushroom).
  const wraps = (game, s) => s.wrapUntil > game.time;
  function ahead(game, s, x, y, d) {
    let nx = x + d.x, ny = y + d.y;
    if (wraps(game, s)) { nx = (nx + GRID) % GRID; ny = (ny + GRID) % GRID; }
    return { x: nx, y: ny };
  }
  const between = (a, b) => a + Math.random() * (b - a);
  const WEATHER = ['clear', 'sun', 'wind', 'rain', 'storm', 'snow'];

  function makeSnake(id, spawn, props) {
    const d = spawn.dir;
    const body = Array.from({ length: T.START_LENGTH }, (_, k) => ({ x: spawn.x - d.x * k, y: spawn.y - d.y * k }));
    return {
      id, body, dir: d, alive: true, grow: 0, eaten: 0, pellets: 0, lastAte: 0, ateTick: -1, nextStarve: T.HUNGER_MS, mealMs: T.HUNGER_MS, // (mealMs: how long its last meal keeps it, for the hunger bar)
      // stunUntil: the tick it moves again after a crash; burnUntil, burnFrom: on fire (from, until);
      // coughUntil: the tick it can eat again after choking on its own bead (see eat)
      stunUntil: -1, burnUntil: -1, burnFrom: -1, coughUntil: -1,
      // Powers. leaps: golden leaps held (golden beetles); dashes: golden
      // flashes held (golden leaves); both can be held at once. leapReadyAt,
      // flashReadyAt: when it can next jump, or flash, plainly (game time);
      // wrapUntil: the edges wrap round for it till then (a golden mushroom);
      // flight: { dir } while it's in the air (it lands next tick); leapArmed:
      // the last tick a jump it asked for waits; flashArmed: the tick a flash
      // it asked for goes (the next one it moves).
      leaps: 0, dashes: 0, leapReadyAt: 0, flashReadyAt: 0, wrapUntil: -1, flight: null, leapArmed: -1, flashArmed: -1,
      queue: [], cause: null, killer: null, killerId: null, diedAt: null, memory: {}, planned: null, plannedTick: -1, ...props,
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

  // humans: [{ name, color }] for the snakes people steer (isPlayer: driven by
  // an input queue): one by default, none for an AI-only round, up to four
  // online. AI snakes fill the other seats, from persona keys (random by
  // default). Names are made unique, so a person called "Sniper" can't be
  // mistaken for the rival of that name.
  function createGame({ humans = null, withPlayer = true, personas = null } = {}) {
    const people = (humans || (withPlayer ? [{ name: 'Green', color: PLAYER_COLOR }] : [])).slice(0, SPAWNS.length);
    const wanted = T.OPPONENTS + 1 - people.length;
    const keys = (personas || pickOpponents(wanted)).filter(k => Object.prototype.hasOwnProperty.call(PERSONAS, k)).slice(0, wanted);
    const snakes = [];
    // (The killer of a snake that hit the edge, itself, hunger, fire or the woodpecker is that word, so no one may be called it.)
    const taken = new Set([...keys.map(k => PERSONAS[k].name), 'wall', 'self', 'hunger', 'fire', 'woodpecker']);
    for (const h of people) {
      const base = String(h.name || 'Green');
      let name = base;
      for (let n = 2; taken.has(name); n++) name = `${base} ${n}`;
      taken.add(name);
      snakes.push(makeSnake(snakes.length, SPAWNS[snakes.length], { name, color: h.color || PLAYER_COLOR, isPlayer: true }));
    }
    keys.forEach(k => {
      const id = snakes.length;
      snakes.push(aiSnake(id, SPAWNS[id % SPAWNS.length], k));
    });
    const game = {
      snakes, food: [], tick: 0, time: 0, history: [], withPlayer: people.length > 0, events: [],
      holes: new Set(), woodpecker: null,
      // Beetle burrows ({ x, y, at: the tick it cracked open, used, dug: see openBurrow }), the beetles
      // underground (unders: [{ until: the tick it may come up, expires,
      // from: the cell it went down, gold }]), fire (cell -> { from, until, group, strike }:
      // it burns (setting alight any head that enters) from tick `from` to `until`; before that it's
      // only smouldering, or crackling where lightning will strike), and the
      // weather ({ kind, since, until, nextGust, nextStrike }, in game time).
      // fireGroups: how many cells each fire has burning now; fireTotals: how
      // many it has caught over its life. weatherBag: the spells still to come
      // before any kind repeats (see spell). sdApples: apples fallen since the
      // woodpecker came; sdAppleAt: the tick the next falls.
      burrows: [], unders: [], fires: new Map(), fireGroups: new Map(), fireTotals: new Map(), fireGroup: 0,
      weather: { kind: 'clear', since: 0, until: T.WEATHER_FIRST_MS, nextGust: 0, nextStrike: 0 }, weatherBag: [],
      sdApples: 0, sdAppleAt: null,
    };
    fillFood(game);
    snapshot(game);
    return game;
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
  // (lastAte is when it ate as the clock counts it: a meal that lasts less
  // than HUNGER_MS counts as eaten that much earlier, and winter moves it on.)
  const hungerLeft = (game, s) => s.lastAte + T.HUNGER_MS - game.time;
  // How long a meal keeps a snake from shrinking: HUNGER_MS in the opening
  // and once the woodpecker's here, HUNGER_MID_MS between, when food is
  // everywhere (with a long clock, hunger hardly ever mattered then).
  const mealLasts = game => game.time >= T.HUNGER_MID_FROM_MS && !suddenDeath(game) ? T.HUNGER_MID_MS : T.HUNGER_MS;

  // Mark every living body cell in the occupancy grid (with a fresh stamp).
  function markBodies(game) {
    stamp++;
    for (const s of game.snakes) {
      if (!s.alive) continue;
      for (const c of s.body) { bodyStamp[key(c.x, c.y)] = stamp; bodyOwner[key(c.x, c.y)] = s.id; }
    }
  }

  // An apple: it rots away after a while (and another drops somewhere else).
  const apple = game => ({ kind: 'food', expires: game.tick + Math.round(T.APPLE_TICKS * between(0.75, 1.25)) });
  // How many apples the board keeps: two; in winter, one.
  const applesWanted = game => game.weather.kind === 'snow' ? T.SNOW_APPLES : T.APPLES;

  function fillFood(game) {
    // Apples, golden apples and beads rot, mushrooms wither, and beetles nobody caught fly off.
    if (game.food.some(f => f.expires != null && f.expires <= game.tick)) {
      for (const f of game.food) {
        if (f.expires > game.tick) continue;
        if (f.kind === 'beetle') game.events.push({ type: 'flown', x: f.x, y: f.y });
        else if (f.kind === 'food') game.events.push({ type: 'rot', x: f.x, y: f.y, kind: 'apple' });
        else if (f.kind === 'pellet') game.events.push({ type: 'rot', x: f.x, y: f.y, kind: 'pellet', color: f.color });
      }
      game.food = game.food.filter(f => f.expires == null || f.expires > game.tick);
    }
    // Once the woodpecker is here, nothing new grows, but the last apples
    // fall one at a time: with none on the board, another drops, each wait
    // longer than the last (SD_APPLE_GAP ticks, then twice that, and so on).
    // The first is announced. Beetles still come out.
    if (suddenDeath(game)) {
      if (game.food.some(f => f.kind === 'food')) game.sdAppleAt = null;
      else if (game.sdAppleAt == null) game.sdAppleAt = game.tick + T.SD_APPLE_GAP * (game.sdApples + 1);
      else if (game.tick >= game.sdAppleAt) {
        const at = placer(game)(apple(game));
        game.sdAppleAt = null;
        if (at && !game.sdApples++) game.events.push({ type: 'lastApples', x: at.x, y: at.y });
      }
      let beetles = 0;
      for (const f of game.food) if (f.kind === 'beetle') beetles++;
      beetleOut(game, placer(game), beetles);
      return;
    }

    let apples = 0, mushrooms = 0, golden = 0, beetles = 0;
    for (const f of game.food) {
      if (f.kind === 'food') apples++;
      else if (f.kind === 'mushroom') mushrooms++;
      else if (f.kind === 'golden') golden++;
      else if (f.kind === 'beetle') beetles++;
    }

    const place = placer(game);
    const raining = game.weather.kind === 'rain', winter = game.weather.kind === 'snow';
    // (Winter: fewer apples, no new mushrooms.)
    for (const n = applesWanted(game); apples < n; apples++) place(apple(game));
    // (Rain: more mushrooms sprout. Never right by a head: nobody could see one come up in front of them in time.)
    for (; !winter && mushrooms < T.MUSHROOMS + (raining ? T.RAIN_MUSHROOMS : 0); mushrooms++) place({ kind: 'mushroom', expires: game.tick + T.MUSHROOM_TICKS }, false, T.SHROOM_GAP);
    // (Sun: golden hour. Winter: hardly any. It lands somewhere quiet: a race you can see.)
    const goldenChance = winter ? 0 : T.GOLDEN_CHANCE * (game.weather.kind === 'sun' ? T.SUN_GOLDEN : 1); // (none in winter)
    if (!golden && Math.random() < goldenChance && place({ kind: 'golden', expires: game.tick + T.GOLDEN_TICKS }, true)) {
      const g = game.food[game.food.length - 1];
      game.events.push({ type: 'spawn', kind: 'golden', x: g.x, y: g.y });
    }
    beetleOut(game, place, beetles);
  }

  // Now and then a beetle comes out of a burrow for a crawl (BEETLE_MAX at
  // most out at once, above ground or under; `beetles`: how many are above).
  // The first cracks a burrow open where it's quiet; later ones come out of
  // a free burrow, or now and then open another.
  function beetleOut(game, place, beetles) {
    if (beetles + game.unders.length >= T.BEETLE_MAX || game.time < T.BEETLE_FIRST_MS || Math.random() >= T.BEETLE_CHANCE) return;
    let b = freeBurrow(game, -1);
    if (game.burrows.length < T.BURROW_MAX && (!b || Math.random() < T.BURROW_NEW_CHANCE)) {
      const at = place(null, true);
      if (at) b = openBurrow(game, at.x, at.y);
    }
    if (b) {
      const gold = Math.random() < T.GOLD_BEETLE_CHANCE;
      b.used = game.time;
      game.food.push({ x: b.x, y: b.y, kind: 'beetle', expires: game.tick + T.BEETLE_TICKS, dir: CRAWL[Math.floor(Math.random() * 4)], movedAt: game.tick, ...(gold ? { gold: 1 } : {}) });
      game.events.push({ type: 'spawn', kind: 'beetle', x: b.x, y: b.y, gold });
    }
  }
  // A burrow cracks open at (x, y): { x, y, at: the tick it opened, used:
  // the game time a beetle last went into or came out of it (or it opened),
  // dug: 1 if a beetle's dig left it (see BURROW_FROM_DIG) }. At BURROW_MAX,
  // the one unused longest closes over to make room.
  function openBurrow(game, x, y, dug = false) {
    if (game.burrows.length >= T.BURROW_MAX) {
      let old = game.burrows[0];
      for (const h of game.burrows) if ((h.used ?? 0) < (old.used ?? 0)) old = h;
      closeBurrow(game, old);
    }
    const b = { x, y, at: game.tick, used: game.time, ...(dug ? { dug: 1 } : {}) };
    game.burrows.push(b);
    game.events.push({ type: 'burrow', x, y, ...(dug ? { dug: 1 } : {}) });
    return b;
  }
  // A burrow closes over: sawdust and moss fill it.
  function closeBurrow(game, b) {
    game.burrows.splice(game.burrows.indexOf(b), 1);
    game.events.push({ type: 'heal', x: b.x, y: b.y });
  }

  // Picks free cells (no bodies, holes, food, burrows, fire or the
  // woodpecker's next patch), worked out only when something actually needs
  // placing. place(props, quiet, gap): puts food there (props: null to only
  // pick a cell), and returns the cell. quiet: pick the spot farthest from
  // any head, of a few tries; gap: never this close to a head, or nearer.
  function placer(game) {
    let free = null;
    return (props, quiet = false, gap = -1) => {
      if (!free) {
        markBodies(game);
        for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
        for (const k of game.holes) bodyStamp[k] = stamp;
        for (const b of game.burrows) bodyStamp[key(b.x, b.y)] = stamp;
        for (const k of game.fires.keys()) bodyStamp[k] = stamp;
        if (game.woodpecker) for (const k of game.woodpecker.target) bodyStamp[k] = stamp;
        free = [];
        for (let k = 0; k < CELLS; k++) if (bodyStamp[k] !== stamp) free.push(k);
      }
      if (!free.length) return null; // a full board: nothing grows, and that's fine
      let at = Math.floor(Math.random() * free.length);
      if (gap >= 0 && headGap(game, free[at] % GRID, Math.floor(free[at] / GRID)) <= gap) { // (too close: another, from the cells far enough away)
        const far = [];
        for (let i = 0; i < free.length; i++) if (headGap(game, free[i] % GRID, Math.floor(free[i] / GRID)) > gap) far.push(i);
        if (!far.length) return null;
        at = far[Math.floor(Math.random() * far.length)];
      }
      if (quiet) {
        let best = -1;
        for (let t = 0; t < 8; t++) {
          const i = Math.floor(Math.random() * free.length), c = free[i];
          const gap = headGap(game, c % GRID, Math.floor(c / GRID));
          if (gap > best) { best = gap; at = i; }
        }
      }
      const [k] = free.splice(at, 1);
      const cell = { x: k % GRID, y: Math.floor(k / GRID) };
      if (props) game.food.push({ ...cell, ...props });
      return cell;
    };
  }

  // How far (in cells) the nearest living head is.
  function headGap(game, x, y) {
    let gap = 99;
    for (const s of game.snakes) if (s.alive) gap = Math.min(gap, Math.abs(s.body[0].x - x) + Math.abs(s.body[0].y - y));
    return gap;
  }

  // A burrow a beetle can come out of: nothing on it (not `not`, if
  // there's another), the one farthest from any head.
  function freeBurrow(game, not) {
    markBodies(game);
    for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
    let best = null, gap = -1, fallback = null;
    for (const b of game.burrows) {
      const k = key(b.x, b.y);
      if (bodyStamp[k] === stamp || game.fires.has(k) || game.holes.has(k)) continue;
      if (k === not) { fallback = b; continue; }
      const g = headGap(game, b.x, b.y);
      if (g > gap) { gap = g; best = b; }
    }
    return best || fallback;
  }
  const burrowAt = (game, x, y) => game.burrows.some(b => b.x === x && b.y === y);

  // Beetles crawl a cell every few ticks: mostly straight on, now and then
  // turning. With a head close by they scurry away, faster. Never into a body,
  // a hole, other food or off the board; boxed in, they wait.
  const CRAWL = [DIRS.up, DIRS.right, DIRS.down, DIRS.left];
  // A scared beetle heads for a burrow if one's near (nearer than
  // BEETLE_HOME_REACH), and dives in when it gets there; it comes out of a
  // burrow (another, if there is one) a moment later. One cornered, a head
  // within BEETLE_DIG_FEAR and no burrow in reach, digs in where it is: it
  // stays put BEETLE_DIG ticks (b.digUntil: the tick it's gone; it can still
  // be caught), then it's underground, as after a dive, and a burrow opens
  // where it dug (BURROW_FROM_DIG; at BURROW_MAX the one unused longest
  // closes over to make room), so the burrows follow the hunting. (Off unless
  // BURROW_HEAL_MS is set: a burrow nobody has used for that long closes over.)
  function crawl(game) {
    if (T.BURROW_HEAL_MS > 0) for (const h of [...game.burrows]) {
      if (game.time - (h.used ?? 0) >= T.BURROW_HEAL_MS && !game.food.some(f => f.x === h.x && f.y === h.y)) closeBurrow(game, h);
    }
    for (let i = 0; i < game.unders.length; i++) {
      const u = game.unders[i];
      if (game.tick < u.until) continue;
      if (game.tick >= u.expires) { game.unders.splice(i--, 1); continue; } // (it stays home)
      const b = freeBurrow(game, u.from);
      if (!b) continue;
      b.used = game.time;
      game.food.push({ x: b.x, y: b.y, kind: 'beetle', expires: u.expires, dir: CRAWL[Math.floor(Math.random() * 4)], movedAt: game.tick, ...(u.gold ? { gold: 1 } : {}) });
      game.events.push({ type: 'emerge', x: b.x, y: b.y });
      game.unders.splice(i--, 1);
    }
    let marked = false;
    for (const b of [...game.food]) {
      if (b.kind !== 'beetle') continue;
      let fear = 99, hx = 0, hy = 0;
      for (const s of game.snakes) {
        if (!s.alive) continue;
        const h = s.body[0], d = Math.abs(h.x - b.x) + Math.abs(h.y - b.y);
        if (d < fear) { fear = d; hx = h.x; hy = h.y; }
      }
      const scared = fear <= T.BEETLE_FEAR;
      if (!(b.digUntil > 0) && fear <= T.BEETLE_DIG_FEAR && !game.burrows.some(h => Math.abs(h.x - b.x) + Math.abs(h.y - b.y) < T.BEETLE_HOME_REACH)) {
        b.digUntil = game.tick + T.BEETLE_DIG;
        game.events.push({ type: 'dig', x: b.x, y: b.y, until: b.digUntil });
      }
      if (b.digUntil > 0) {
        if (game.tick < b.digUntil) continue; // (digging: it stays put)
        game.food.splice(game.food.indexOf(b), 1);
        goUnder(game, b);
        game.events.push({ type: 'dive', x: b.x, y: b.y, dug: 1 });
        if (T.BURROW_FROM_DIG) openBurrow(game, b.x, b.y, true);
        continue;
      }
      if (game.tick - b.movedAt < (scared ? T.BEETLE_SCARED_EVERY : T.BEETLE_EVERY)) continue;
      if (!marked) {
        markBodies(game);
        for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
        for (const k of game.holes) bodyStamp[k] = stamp;
        for (const k of game.fires.keys()) bodyStamp[k] = stamp; // (beetles keep out of fire...)
        if (game.woodpecker) for (const k of game.woodpecker.target) bodyStamp[k] = stamp; // (...and the woodpecker's way)
        marked = true;
      }
      // The nearest burrow, if one's close enough to run for.
      let home = null, homeGap = T.BEETLE_HOME_REACH;
      if (scared) for (const h of game.burrows) {
        const g = Math.abs(h.x - b.x) + Math.abs(h.y - b.y);
        if (g < homeGap) { homeGap = g; home = h; }
      }
      let best = null, bestScore = -Infinity;
      for (const d of CRAWL) {
        const nx = b.x + d.x, ny = b.y + d.y;
        if (!inside(nx, ny) || bodyStamp[key(nx, ny)] === stamp) continue;
        let score = Math.random(); // a little wandering
        if (d === b.dir) score += 1.5; // it likes to keep going
        else if (d.x === -b.dir.x && d.y === -b.dir.y) score -= 1;
        if (scared) score += 3 * (Math.abs(nx - hx) + Math.abs(ny - hy) - fear); // away from the nearest head...
        if (home) score += 2 * (homeGap - Math.abs(home.x - nx) - Math.abs(home.y - ny)); // ...and home, if it's near
        if (score > bestScore) { bestScore = score; best = d; }
      }
      if (!best) continue;
      b.px = b.x; b.py = b.y;
      b.x += best.x; b.y += best.y;
      b.dir = best;
      b.movedAt = game.tick;
      b.scared = scared;
      bodyStamp[key(b.x, b.y)] = stamp;
      if (scared && burrowAt(game, b.x, b.y)) { // home: down it goes
        game.food.splice(game.food.indexOf(b), 1);
        game.burrows.find(h => h.x === b.x && h.y === b.y).used = game.time;
        goUnder(game, b);
        game.events.push({ type: 'dive', x: b.x, y: b.y });
      }
    }
  }
  // A beetle gone underground, where it went down (a burrow, or a dig): it
  // comes up a while later.
  function goUnder(game, b) {
    game.unders.push({ until: game.tick + Math.round(between(T.BEETLE_UNDER_MIN, T.BEETLE_UNDER_MAX)), expires: b.expires, from: key(b.x, b.y), gold: !!b.gold });
  }

  // ------------------------------------------------------------- weather

  // Spells of weather, one after another with clear spells between: sun
  // (golden hour), wind (gusts knock apples loose; fire flings burning
  // leaves downwind), rain (mushrooms sprout, fires go out; a rainbow when it
  // stops, with a golden apple at its end), storms (lightning, which crackles
  // where it'll strike first, never near a head, and sets the bark alight)
  // and snow (winter: less food, hunger runs faster, fires go out).
  // Everyone sees all of it.
  function weather(game) {
    const w = game.weather;
    // (Once the woodpecker is here, the sky clears and stays clear.)
    if (game.time >= w.until || (suddenDeath(game) && w.kind !== 'clear')) {
      let next = 'clear';
      if (suddenDeath(game)) next = 'clear';
      else if (w.kind === 'clear') next = spell(game);
      else if (w.kind === 'storm' && Math.random() < T.AFTER_STORM_RAIN) next = 'rain';
      else if (w.kind === 'rain' && Math.random() < T.RAINBOW_CHANCE) rainbow(game);
      const span = next === 'clear' ? between(T.CLEAR_MIN_MS, T.CLEAR_MAX_MS) : between(T.SPELL_MIN_MS, T.SPELL_MAX_MS);
      if (next !== w.kind) game.events.push({ type: 'weather', kind: next });
      game.weather = { kind: next, since: next === w.kind ? w.since : game.time, until: game.time + span, nextGust: game.time + 600, nextStrike: game.time + between(1200, 2500) };
      // (Rain: once in a while, a golden mushroom comes up some time in it.)
      if (next === 'rain' && Math.random() < T.GOLDCAP_CHANCE) game.weather.goldcapAt = game.time + between(1000, Math.max(1000, span - 4000));
    }
    const now = game.weather;
    if (now.kind === 'wind' && game.time >= now.nextGust) {
      now.nextGust = game.time + T.GUST_EVERY_MS;
      let apples = 0;
      for (const f of game.food) if (f.kind === 'food') apples++;
      const fell = apples < applesWanted(game) + T.WINDFALL_MAX ? placer(game)(apple(game)) : null;
      game.events.push({ type: 'gust', x: fell ? fell.x : -1, y: fell ? fell.y : -1 });
      // Now and then a gust brings a golden leaf (one at a time): dashes. It
      // lands somewhere quiet, like every golden thing.
      if (Math.random() < T.LEAF_CHANCE && !game.food.some(f => f.kind === 'leaf')) {
        const at = placer(game)({ kind: 'leaf', expires: game.tick + T.LEAF_TICKS }, true);
        if (at) game.events.push({ type: 'spawn', kind: 'leaf', x: at.x, y: at.y });
      }
    }
    if (now.kind === 'rain' && now.goldcapAt != null && game.time >= now.goldcapAt) { // a golden mushroom comes up
      now.goldcapAt = null;
      const at = placer(game)({ kind: 'goldcap', expires: game.tick + T.GOLDCAP_TICKS }, true);
      if (at) game.events.push({ type: 'spawn', kind: 'goldcap', x: at.x, y: at.y });
    }
    if (now.kind === 'storm' && game.time >= now.nextStrike) {
      now.nextStrike = game.time + between(T.STRIKE_MIN_MS, T.STRIKE_MAX_MS);
      strike(game);
    }
    // Winter: hunger runs faster (the clock to everyone's next meal runs
    // down quicker), and apples rot twice as fast.
    if (now.kind === 'snow') {
      const extra = tickMs(game) * (T.SNOW_HUNGER - 1);
      for (const s of game.snakes) if (s.alive) { s.lastAte -= extra; s.nextStarve -= extra; }
      for (const f of game.food) if (f.kind === 'food' && f.expires != null && !f.cooked) f.expires--;
    }
    burn(game);
  }

  // The next spell, drawn from a shuffled bag (WEATHER_ODDS of each kind), so
  // every kind comes before any comes again. Storms can't come before
  // STORM_FROM_MS, nor snow before SNOW_FROM_MS: they stay in the bag for
  // later (with nothing else left in it, the next bag goes in behind).
  function spell(game) {
    const bag = game.weatherBag, ok = k => (k !== 'storm' || game.time >= T.STORM_FROM_MS) && (k !== 'snow' || game.time >= T.SNOW_FROM_MS);
    if (!bag.some(ok)) {
      const more = [];
      for (const [k, n] of Object.entries(T.WEATHER_ODDS)) for (let i = 0; i < n; i++) more.push(k);
      for (let i = more.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [more[i], more[j]] = [more[j], more[i]]; }
      bag.push(...more);
    }
    const i = bag.findIndex(ok);
    return i < 0 ? 'clear' : bag.splice(i, 1)[0];
  }

  // After the rain: a rainbow, and a golden apple at its end (if there isn't one).
  function rainbow(game) {
    if (game.food.some(f => f.kind === 'golden')) return;
    const at = placer(game)({ kind: 'golden', expires: game.tick + T.GOLDEN_TICKS }, true);
    if (at) game.events.push({ type: 'rainbow', x: at.x, y: at.y });
  }

  // Lightning picks a free cell well away from every head, and crackles there
  // for a moment before it strikes.
  function strike(game) {
    markBodies(game);
    for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
    const spots = [];
    for (let k = 0; k < CELLS; k++) {
      const x = k % GRID, y = Math.floor(k / GRID);
      if (bodyStamp[k] === stamp || game.holes.has(k) || game.fires.has(k) || burrowAt(game, x, y)) continue;
      if (headGap(game, x, y) <= T.STRIKE_CLEARANCE) continue;
      spots.push(k);
    }
    if (!spots.length) return;
    const k = spots[Math.floor(Math.random() * spots.length)], from = game.tick + T.STRIKE_WARN_TICKS;
    const group = ++game.fireGroup;
    game.fires.set(k, { from, until: from + T.FIRE_TICKS, group, strike: true });
    game.fireGroups.set(group, 1); game.fireTotals.set(group, 1);
    game.events.push({ type: 'charge', x: k % GRID, y: Math.floor(k / GRID) });
  }

  // Fire: a strike lands when its crackling's done, burning cells now and then
  // catch a neighbour (smouldering first, so everyone sees it coming: at most
  // FIRE_MAX of one fire's cells at once, and FIRE_TOTAL over its life, so it
  // burns itself out), and cells burn out. Rain puts it all out. (Times are
  // ticks: the next tick is game.tick + 1, when anything that's burning by
  // then can kill.)
  function burn(game) {
    if (!game.fires.size) return;
    const next = game.tick + 1, raining = game.weather.kind === 'rain' || game.weather.kind === 'snow'; // (rain or snow: it goes out)
    const windy = game.weather.kind === 'wind' || game.weather.kind === 'storm';
    let marked = false;
    for (const [k, f] of game.fires) {
      if (raining) f.until = Math.min(f.until, Math.max(f.from, next) + T.RAIN_DOUSE_TICKS);
      if (f.until <= next) { putOut(game, k); continue; } // burnt out
      if (f.strike && f.from === next) game.events.push({ type: 'strike', x: k % GRID, y: Math.floor(k / GRID) });
      // Wind: a burning leaf blown downwind (to the right), to start a small fire where it lands.
      if (windy && !raining && !f.ember && game.tick >= f.from && game.fires.size < T.FIRE_BOARD_MAX && Math.random() < T.EMBER_CHANCE) ember(game, k);
      if (f.ember || raining || game.tick < f.from || Math.random() >= T.FIRE_SPREAD || (game.fireGroups.get(f.group) || 0) >= T.FIRE_MAX || (game.fireTotals.get(f.group) || 1) >= T.FIRE_TOTAL || game.fires.size >= T.FIRE_BOARD_MAX) continue;
      if (!marked) {
        markBodies(game);
        for (const fo of game.food) if (fo.kind === 'beetle') bodyStamp[key(fo.x, fo.y)] = stamp; // (food can catch; a beetle runs)
        marked = true;
      }
      const x = k % GRID, y = Math.floor(k / GRID);
      const d = CRAWL[Math.floor(Math.random() * 4)], nx = x + d.x, ny = y + d.y, nk = key(nx, ny);
      if (!inside(nx, ny) || bodyStamp[nk] === stamp || game.holes.has(nk) || game.fires.has(nk) || burrowAt(game, nx, ny)) continue;
      const from = next + T.FIRE_SMOLDER_TICKS;
      game.fires.set(nk, { from, until: from + T.FIRE_TICKS, group: f.group, strike: false });
      game.fireGroups.set(f.group, (game.fireGroups.get(f.group) || 0) + 1);
      game.fireTotals.set(f.group, (game.fireTotals.get(f.group) || 1) + 1);
    }
    cook(game);
  }
  // A cell's fire gone (burnt out, put out by a dash, or pecked out), and its fire's counts with it.
  function putOut(game, k) {
    const f = game.fires.get(k);
    game.fires.delete(k);
    const left = (game.fireGroups.get(f.group) || 1) - 1;
    if (left > 0) game.fireGroups.set(f.group, left);
    else { game.fireGroups.delete(f.group); game.fireTotals.delete(f.group); }
  }
  // Food in a burning cell cooks: an apple or a bead bakes (worth more, and
  // it stops rotting for a while), and anything left in too long goes to ash.
  function cook(game) {
    let ash = false;
    for (const f of game.food) {
      if (f.kind === 'beetle') continue;
      const fire = game.fires.get(key(f.x, f.y));
      if (!fire || game.tick < fire.from) continue;
      f.heat = (f.heat || 0) + 1;
      if (f.heat === T.COOK_TICKS && (f.kind === 'food' || f.kind === 'pellet')) {
        f.cooked = 1;
        if (f.expires != null) f.expires = Math.max(f.expires, game.tick + T.APPLE_TICKS / 2);
        game.events.push({ type: 'baked', x: f.x, y: f.y, kind: f.kind });
      }
      if (f.heat >= T.ASH_TICKS) { f.ash = true; ash = true; game.events.push({ type: 'ash', x: f.x, y: f.y, kind: f.kind }); }
    }
    if (ash) game.food = game.food.filter(f => !f.ash);
  }
  // A burning leaf flung from cell k, landing 2 to EMBER_REACH cells downwind
  // (a cell either side, perhaps) on a free cell, never by a head: it smoulders
  // there first, longer than spreading fire does, then burns briefly, small.
  function ember(game, k) {
    markBodies(game);
    for (const fo of game.food) bodyStamp[key(fo.x, fo.y)] = stamp;
    const x = k % GRID, y = Math.floor(k / GRID);
    const nx = x + 2 + Math.floor(Math.random() * (T.EMBER_REACH - 1)), ny = y + Math.floor(Math.random() * 3) - 1, nk = key(nx, ny);
    if (!inside(nx, ny) || bodyStamp[nk] === stamp || game.holes.has(nk) || game.fires.has(nk) || burrowAt(game, nx, ny) || headGap(game, nx, ny) <= 1) return;
    const from = game.tick + 1 + T.EMBER_SMOLDER_TICKS, group = ++game.fireGroup;
    game.fires.set(nk, { from, until: from + T.EMBER_FIRE_TICKS, group, strike: false, ember: true });
    game.fireGroups.set(group, 1);
    game.events.push({ type: 'ember', x: nx, y: ny, fx: x, fy: y });
  }

  // Is cell k burning on this tick (and so sets alight a head that enters)?
  const burning = (game, k) => { const f = game.fires.get(k); return !!f && game.tick >= f.from && game.tick < f.until; };

  // Sudden death: the woodpecker takes the log away a patch at a time. It
  // lands, then over and over (hungrier each time: a shorter rest, a patch a
  // cell bigger): picks a patch of PECK_CHUNK cells somewhere on the log
  // (PECK_CLEARANCE cells from every head, shutting nobody in, while there's
  // such a spot: see pickPatch), eyes it for PECK_AIM_TICKS (everyone sees
  // where, and the AIs keep out of it, like a hole), hammers it all out at
  // once, and rests a good while. Food in the patch when it strikes is
  // knocked aside (see knockTo; a beetle scurries there), or eaten if there's
  // nowhere to knock it; fire and a burrow there go. A head on the ground
  // there, and that snake's out; a body lying across it bridges the new hole
  // (it isn't cut, and drops nothing), and the cell is a hole like any other
  // once its tail has passed. Where knocked food lands is a promise: the
  // rings through the aim's last tick (see promiseLandings) are kept while
  // their cells are still free.
  // game.woodpecker: { at (time it came), target: [cells it's aiming at],
  //   strikeAt (tick), last: [cells it took out last], struckAt (tick), restUntil (tick), x, y (where it's busy),
  //   pecks (strikes so far), landings (from the end of the tick before a strike: [[from, to], ...] cells, to -1 for none) }
  function peck(game, dying) {
    if (!suddenDeath(game)) return;
    let w = game.woodpecker;
    if (!w) {
      w = game.woodpecker = { x: GRID / 2, y: 0, at: game.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: game.tick + T.PECK_ARRIVE_TICKS };
      game.events.push({ type: 'woodpecker' });
      return;
    }
    if (w.target.length && game.tick >= w.strikeAt) {
      const zone = new Set(w.target.filter(k => !game.holes.has(k)));
      // Where its food goes: the landings its rings promised, each while its
      // cell's still free, else the rule as the board stands; worked out
      // before anyone's head in it is out, so a body it pecks under still
      // lies where it lay (its beads go there, never under the food).
      const flying = knocks(game, zone, w.landings);
      const under = []; // (whose bodies lay across it: they're fine)
      for (const s of game.snakes) {
        if (!s.alive) continue;
        if (!s.flight && zone.has(key(s.body[0].x, s.body[0].y))) { // (a head in the air isn't in it)
          s.cause = 'got pecked by the woodpecker'; s.killer = 'wall'; s.killerId = null; s.fatal = 'pecked';
          s.alive = false;
          dying.push(s);
          continue;
        }
        if (s.body.some((c, i) => i && zone.has(key(c.x, c.y)))) under.push(s.id);
      }
      for (const k of zone) { game.holes.add(k); if (game.fires.has(k)) putOut(game, k); } // (a burning cell pecked out: the fire there's gone too)
      for (const { food: f, to } of flying) {
        game.events.push({ type: 'knock', kind: f.kind, x: f.x, y: f.y, tx: to ? to.x : null, ty: to ? to.y : null, ...(f.gold ? { gold: 1 } : {}), ...(f.color ? { color: f.color } : {}) });
        if (!to) { game.food.splice(game.food.indexOf(f), 1); continue; } // (nowhere to go: the bird eats it)
        if (f.kind === 'beetle') { // (a beetle scurries there, and isn't digging any more)
          const dx = to.x - f.x, dy = to.y - f.y;
          f.px = f.x; f.py = f.y; f.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? DIRS.right : DIRS.left) : dy > 0 ? DIRS.down : DIRS.up; f.movedAt = game.tick; f.scared = true;
          delete f.digUntil;
        }
        f.x = to.x; f.y = to.y;
      }
      game.burrows = game.burrows.filter(b => !zone.has(key(b.x, b.y))); // (a burrow pecked open is a hole now)
      const hit = [...zone];
      game.events.push({ type: 'peck', x: w.x, y: w.y, cells: hit, under });
      w.pecks = (w.pecks || 0) + 1; // (it gets hungrier: shorter rests, bigger patches)
      delete w.landings;
      w.last = hit; w.struckAt = game.tick; w.target = []; w.restUntil = game.tick + Math.max(T.PECK_REST_MIN, Math.round(T.PECK_REST_TICKS * Math.pow(T.PECK_HUNGRIER, w.pecks)));
      return;
    }
    if (!w.target.length && game.tick >= w.restUntil) {
      const patch = pickPatch(game);
      if (!patch.length) return;
      w.target = patch;
      w.strikeAt = game.tick + T.PECK_AIM_TICKS;
      let sx = 0, sy = 0;
      for (const k of patch) { sx += k % GRID; sy += Math.floor(k / GRID); }
      w.x = sx / patch.length; w.y = sy / patch.length;
      game.events.push({ type: 'aim', x: Math.round(w.x), y: Math.round(w.y) });
    }
  }

  // A head on the ground over a hole, with nothing across it any more,
  // falls in. (A jump whose landing was taken comes down on what it hopped:
  // a body lying across a hole holds it up, until that body moves on.)
  function fallIn(game, dying) {
    if (!game.holes.size) return;
    for (const s of game.snakes) {
      const h = s.body[0];
      if (!s.alive || s.flight || !game.holes.has(key(h.x, h.y))) continue;
      if (game.snakes.some(o => o !== s && o.alive && o.body.some(b => b.x === h.x && b.y === h.y))) continue;
      s.cause = 'fell into a woodpecker hole'; s.killer = 'wall'; s.killerId = null; s.fatal = 'hole';
      s.alive = false;
      dying.push(s);
    }
  }

  // A patch for the woodpecker, grown cell by cell from a start: under a body
  // PECK_UNDER_BODY of the time (any snake's, never a head), beside an old
  // hollow PECK_WIDEN of the time (fewer, bigger hollows), else anywhere. It
  // grows compact (a cell with more of the patch, or old holes, beside it is
  // likelier), is rounded off (see smoothPatch), and takes any crumbs it
  // would cut off (see crumbs). It may cover food: that's knocked aside at
  // the strike (see knockTo). It keeps PECK_CLEARANCE cells from every head
  // and shuts nobody in (see shutsIn) while it can; failing that, it keeps
  // clear of heads themselves, shutting nobody in; failing that, those two
  // again, shutting someone in; failing that, anywhere left. (Each try:
  // [keep clear, of heads by more than this, shut nobody in].)
  const PATCH_TRIES = [[true, T.PECK_CLEARANCE, true], [true, 0, true], [true, T.PECK_CLEARANCE, false], [true, 0, false], [false, -1, false]];
  function pickPatch(game) {
    const roll = Math.random();
    const nearHole = k => CRAWL.some(d => { const x = k % GRID + d.x, y = Math.floor(k / GRID) + d.y; return inside(x, y) && game.holes.has(key(x, y)); });
    const room = { now: null }; // (each snake's room as things stand: worked out once, if a try asks)
    for (const [clear, gap, fair] of PATCH_TRIES) {
      const ok = k => {
        if (game.holes.has(k)) return false;
        if (!clear) return true;
        return headGap(game, k % GRID, Math.floor(k / GRID)) > gap;
      };
      // Where it'd like to start this time (tried first, then anywhere).
      const pool = [];
      if (roll < T.PECK_UNDER_BODY) {
        for (const s of game.snakes) if (s.alive) for (let j = 1; j < s.body.length; j++) { const k = key(s.body[j].x, s.body[j].y); if (ok(k)) pool.push(k); }
      } else if (roll < T.PECK_UNDER_BODY + T.PECK_WIDEN && game.holes.size) {
        for (let k = 0; k < CELLS; k++) if (ok(k) && nearHole(k)) pool.push(k);
      }
      for (let t = pool.length ? -15 : 0; t < 30; t++) {
        const seed = t < 0 ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * CELLS);
        if (!ok(seed)) continue;
        const patch = [seed], edge = [seed], inPatch = new Set(patch);
        const chunk = Math.min(T.PECK_CHUNK_MAX, T.PECK_CHUNK + (game.woodpecker?.pecks || 0)); // (a cell bigger each time)
        while (patch.length < chunk && edge.length) {
          const from = edge[Math.floor(Math.random() * edge.length)], x = from % GRID, y = Math.floor(from / GRID);
          const opts = CRAWL.map(d => [x + d.x, y + d.y]).filter(([nx, ny]) => inside(nx, ny) && !inPatch.has(key(nx, ny)) && ok(key(nx, ny)));
          if (!opts.length) { edge.splice(edge.indexOf(from), 1); continue; }
          // (each way weighs (1 + 3 for each neighbour in the patch + 2 for each old hole beside it), squared)
          let total = 0;
          const weights = opts.map(([ox, oy]) => {
            let n = 1;
            for (const d of CRAWL) {
              const ax = ox + d.x, ay = oy + d.y;
              if (!inside(ax, ay)) continue;
              if (inPatch.has(key(ax, ay))) n += 3; else if (game.holes.has(key(ax, ay))) n += 2;
            }
            total += n * n;
            return n * n;
          });
          let r = Math.random() * total, i = 0;
          while (i < opts.length - 1 && (r -= weights[i]) >= 0) i++;
          const nk = key(opts[i][0], opts[i][1]);
          patch.push(nk); edge.push(nk); inPatch.add(nk);
        }
        if (patch.length < Math.ceil(chunk / 2)) continue;
        smoothPatch(game, patch, inPatch, ok);
        if (patch.length >= Math.ceil(chunk / 2) && (!clear || crumbs(game, patch)) && !(fair && shutsIn(game, patch, room))) return patch;
      }
    }
    return [];
  }
  // Rounder hollows: after it grows, a patch takes any cell beside it with
  // three or more of its four neighbours in the patch, an old hole or off the
  // board (twice over, so a notch two deep fills), never a head; then drops
  // its one-cell spurs, cells with only one neighbour in the patch or a hole
  // (twice over), while three cells or more are left.
  function smoothPatch(game, patch, inPatch, ok) {
    const heads = new Set();
    for (const s of game.snakes) if (s.alive) heads.add(key(s.body[0].x, s.body[0].y));
    const solid = (x, y, edge) => !inside(x, y) ? edge : inPatch.has(key(x, y)) || game.holes.has(key(x, y));
    const around = (k, edge) => { const x = k % GRID, y = Math.floor(k / GRID); let n = 0; for (const d of CRAWL) if (solid(x + d.x, y + d.y, edge)) n++; return n; };
    for (let pass = 0; pass < 2; pass++) {
      const add = [];
      for (const p of patch) for (const d of CRAWL) {
        const x = p % GRID + d.x, y = Math.floor(p / GRID) + d.y;
        if (!inside(x, y)) continue;
        const k = key(x, y);
        if (inPatch.has(k) || add.includes(k) || heads.has(k) || !ok(k)) continue;
        if (around(k, true) >= 3) add.push(k);
      }
      if (!add.length) break;
      for (const k of add) { patch.push(k); inPatch.add(k); }
    }
    for (let pass = 0; pass < 2; pass++) {
      const drop = patch.filter(k => around(k, false) <= 1);
      if (!drop.length || patch.length - drop.length < 3) break;
      for (const k of drop) { patch.splice(patch.indexOf(k), 1); inPatch.delete(k); }
    }
  }
  // No crumbs: islands of PECK_NO_ORPHANS cells or fewer that the patch
  // would cut off from the rest of the log go into it (so they're in the
  // mark from the start). False if a snake is on one: then it's not this patch.
  const crumbSeen = new Int32Array(CELLS), crumbQ = new Int32Array(CELLS);
  let crumbStamp = 0;
  function crumbs(game, patch) {
    const max = T.PECK_NO_ORPHANS;
    if (!max) return true;
    const inP = new Set(patch), bodyAt = new Set(), add = [];
    for (const s of game.snakes) if (s.alive) for (const c of s.body) bodyAt.add(key(c.x, c.y));
    for (const p of patch) for (const d of CRAWL) {
      const x0 = p % GRID + d.x, y0 = Math.floor(p / GRID) + d.y;
      if (!inside(x0, y0)) continue;
      const n0 = key(x0, y0);
      if (inP.has(n0) || game.holes.has(n0)) continue;
      const st = ++crumbStamp; // (the land from here, counted up to one more than a crumb)
      crumbSeen[n0] = st; crumbQ[0] = n0;
      let r = 0, w = 1;
      while (r < w && w <= max) {
        const i = crumbQ[r++], x = i % GRID, y = Math.floor(i / GRID);
        for (const dd of CRAWL) {
          const nx = x + dd.x, ny = y + dd.y;
          if (!inside(nx, ny)) continue;
          const ni = key(nx, ny);
          if (crumbSeen[ni] === st || inP.has(ni) || game.holes.has(ni)) continue;
          crumbSeen[ni] = st; crumbQ[w++] = ni;
          if (w > max) break;
        }
      }
      if (w > max) continue; // (an island too big to be a crumb, or the rest of the log)
      for (let j = 0; j < w; j++) {
        if (bodyAt.has(crumbQ[j])) return false;
        add.push(crumbQ[j]);
      }
    }
    for (const c of add) if (!inP.has(c)) { inP.add(c); patch.push(c); }
    return true;
  }
  // Never shut anyone in: would this patch leave a snake less room than its
  // length (pending growth too), where it has that much now? Room is timed,
  // as a snake really has it (see timedRoom). room.now: each snake's room
  // without the patch, worked out the first time it's asked.
  const SHUT = 1 << 30;
  const openAt = new Int32Array(CELLS), roomSeen = new Int32Array(CELLS), roomQ = new Int32Array(CELLS);
  let roomStamp = 0;
  const roomNeed = s => s.body.length + Math.max(0, s.grow);
  function shutsIn(game, patch, room) {
    if (!room.now) {
      timedGrid(game);
      room.now = new Map();
      for (const s of game.snakes) if (s.alive) room.now.set(s, timedRoom(game, s, null, roomNeed(s)));
    }
    const set = new Set(patch);
    for (const s of game.snakes) {
      if (!s.alive) continue;
      const need = roomNeed(s);
      if (room.now.get(s) < need) continue; // (shut in already: not the patch's doing)
      if (timedRoom(game, s, set, need) < need) return true;
    }
    return false;
  }
  // When each cell opens up, in ticks from now: a hole never; a body's cell
  // once its tail has passed it (later for a snake still stunned, or still
  // to grow); the rest now.
  function timedGrid(game) {
    openAt.fill(0);
    for (const k of game.holes) openAt[k] = SHUT;
    for (const s of game.snakes) {
      if (!s.alive) continue;
      const L = s.body.length, extra = Math.max(0, s.stunUntil - game.tick) + Math.max(0, s.grow);
      s.body.forEach((c, j) => { const k = key(c.x, c.y); openAt[k] = Math.max(openAt[k], L - j + extra); });
    }
  }
  // A snake's room: the cells its head can reach, each by the time it's
  // open (see timedGrid), never through `shut` (a patch), counted up to `need`.
  function timedRoom(game, s, shut, need) {
    const st = ++roomStamp, h0 = key(s.body[0].x, s.body[0].y);
    roomSeen[h0] = st; roomQ[0] = h0;
    let read = 0, write = 1, room = 0;
    for (let d = 1; read < write && room < need; d++) {
      const end = write;
      while (read < end) {
        const i = roomQ[read++], x = i % GRID, y = (i - x) / GRID;
        for (const dd of CRAWL) {
          const nx = x + dd.x, ny = y + dd.y;
          if (!inside(nx, ny)) continue;
          const ni = key(nx, ny);
          if (roomSeen[ni] === st || openAt[ni] > d || (shut && shut.has(ni))) continue;
          roomSeen[ni] = st; room++; roomQ[write++] = ni;
        }
      }
    }
    return room;
  }

  // Where a piece of food at (x, y), in the woodpecker's patch (cells), is
  // knocked to when it strikes: the nearest free cell outside the patch, as
  // the crow flies; of those as near, the one nearest the middle of the log;
  // then the first by row. Null if there's none (the bird eats it). Free: on
  // the board, not a hole, not in the patch, no body, no food, no burrow
  // (nothing grows on one, and food there would stop it up), not burning.
  // A rule, never chance, so anyone can see where it'll land. isFree(x, y):
  // may it land there? (The engine's: see knockRoom; an AI may pass its own,
  // as for rollSide. The patch and the board's edge hold whatever it says.)
  function knockTo(game, x, y, cells, isFree = null) {
    const patch = cells instanceof Set ? cells : new Set(cells), free = isFree || knockRoom(game);
    let best = -1, near = Infinity, mid = Infinity;
    for (let k = 0; k < CELLS; k++) {
      if (patch.has(k)) continue;
      const cx = k % GRID, cy = (k - cx) / GRID, d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
      if (d > near) continue;
      const m = Math.abs(2 * cx - (GRID - 1)) + Math.abs(2 * cy - (GRID - 1)); // (twice the steps to the middle)
      if ((d < near || m < mid) && free(cx, cy)) { best = k; near = d; mid = m; }
    }
    return best < 0 ? null : { x: best % GRID, y: Math.floor(best / GRID) };
  }
  // The engine's "free", for knockTo, as the board stands.
  function knockRoom(game) {
    const taken = new Uint8Array(CELLS);
    for (const s of game.snakes) if (s.alive) for (const c of s.body) taken[key(c.x, c.y)] = 1;
    for (const f of game.food) taken[key(f.x, f.y)] = 1;
    for (const b of game.burrows) taken[key(b.x, b.y)] = 1;
    return (x, y) => inside(x, y) && !taken[key(x, y)] && !game.holes.has(key(x, y)) && !burning(game, key(x, y));
  }
  // Where everything in the patch (cells) would be knocked, as the board
  // stands: [{ food, to }] (to null: eaten), in the order the strike does
  // them, each landing taken before the next is knocked. The strike's own
  // list, and what anyone can work out through the aim. promised: the
  // woodpecker's landings (see promiseLandings), or none: a piece promised a
  // cell that's still free (on the board, out of the patch, as knockRoom
  // says) lands there, wherever else has come free since; one whose cell was
  // taken meanwhile (a head or a beetle moved onto it) lands as near its ring
  // as it can, by the same rule; the rest go by the rule from where they lie;
  // never onto a promised cell. So knocks(game, w.target, w.landings) is what
  // the rings show and the strike does.
  function knocks(game, cells, promised = null) {
    const patch = cells instanceof Set ? cells : new Set(cells), room = knockRoom(game), landed = new Set(), out = [];
    const free = (x, y) => room(x, y) && !landed.has(key(x, y));
    const kept = new Map(), broken = new Map(); // (food: the cell it was promised, still free; or taken since)
    if (promised) for (const [from, to] of promised) {
      if (!(to >= 0) || patch.has(to) || !patch.has(from)) continue;
      const f = game.food.find(o => key(o.x, o.y) === from);
      if (!f || kept.has(f) || broken.has(f)) continue;
      if (landed.has(to) || !room(to % GRID, (to - to % GRID) / GRID)) { broken.set(f, to); continue; }
      kept.set(f, to); landed.add(to);
    }
    for (const f of game.food) {
      if (!patch.has(key(f.x, f.y))) continue;
      const k = kept.get(f), b = broken.get(f);
      const to = k != null ? { x: k % GRID, y: (k - k % GRID) / GRID } : b != null ? knockTo(game, b % GRID, (b - b % GRID) / GRID, patch, free) : knockTo(game, f.x, f.y, patch, free);
      if (to && k == null) landed.add(key(to.x, to.y));
      out.push({ food: f, to });
    }
    return out;
  }
  // The woodpecker's promise: at the end of the tick before its strike (the
  // board its rings last showed), where each piece in its mark will land.
  // The strike keeps each while that cell is still free (see knocks): a
  // head or a beetle that moves onto one sends that piece as near it as it can.
  function promiseLandings(game) {
    const w = game.woodpecker;
    if (!w || !w.target.length || game.tick < w.strikeAt || w.landings) return;
    const out = knocks(game, w.target);
    if (out.length) w.landings = out.map(({ food: f, to }) => [key(f.x, f.y), to ? key(to.x, to.y) : -1]);
  }

  function snapshot(game) {
    game.history.push({
      snakes: game.snakes.filter(s => s.alive).map(s => ({
        id: s.id, body: s.body.map(c => ({ x: c.x, y: c.y })), dir: s.dir,
        stun: Math.max(0, s.stunUntil - game.tick), leaps: s.leaps, // (all of it shows: stars, pips, a gold outline, cough puffs...)
        dashes: s.dashes, wrap: Math.max(0, s.wrapUntil - game.time), air: s.flight ? 1 : 0, cough: Math.max(0, s.coughUntil - game.tick),
      })),
      holes: game.holes.size,
      // (Fire, crackling, smouldering or burning, and the woodpecker's next patch: keep out.)
      fires: game.fires.size ? [...game.fires.keys()] : NO_FIRES,
      pecks: game.woodpecker?.target.length ? [...game.woodpecker.target] : NO_FIRES,
    });
    if (game.history.length > T.HISTORY) game.history.shift();
  }

  const NO_FIRES = [];

  // What an AI must keep out of in a snapshot: its holes and any fire (as
  // walls). Worked out once per snapshot, shared by every AI.
  function blockedSeen(game, snap) {
    const holes = holesSeen(game, snap.holes);
    if (!snap.fires.length && !snap.pecks.length) return holes;
    if (snap.blocked?.n !== holes.size) {
      const set = new Set(holes);
      for (const k of snap.fires) set.add(k);
      for (const k of snap.pecks) set.add(k);
      snap.blocked = { n: holes.size, set };
    }
    return snap.blocked.set;
  }
  const NO_CELLS = new Set();
  const fireSeen = snap => snap.fires.length ? (snap.fireSet ||= new Set(snap.fires)) : NO_CELLS;

  // The holes as they were in a snapshot (the first `n` pecked; a Set keeps
  // insertion order). Shared by every AI deciding on the same tick.
  function holesSeen(game, n) {
    if (n >= game.holes.size) return game.holes;
    if (game.holesView?.n !== n || game.holesView.of !== game.holes) {
      const set = new Set();
      for (const k of game.holes) { if (set.size === n) break; set.add(k); }
      game.holesView = { n, of: game.holes, set };
    }
    return game.holesView.set;
  }

  // What an AI "sees": its own body now, the other snakes (and holes and
  // fire) as of its reaction time ago, like a person would; the food as it
  // is now (a beetle as it is: where it is, which way it faces, when it last
  // moved, and whether it's scurrying). Rivals are just ids and bodies;
  // nothing says which one is human.
  function aiView(game, snake) {
    const delay = Math.max(1, Math.round(T.REACTION_MS / tickMs(game)));
    const idx = Math.max(0, game.history.length - 1 - delay);
    const snap = game.history[idx];
    return {
      grid: GRID,
      me: {
        // (its hunger, as a person sees their bar: how long till it starts shrinking, and till its next shrink)
        id: snake.id, body: snake.body, dir: snake.dir, grow: snake.grow, hungerLeft: hungerLeft(game, snake), starveIn: snake.nextStarve - game.time,
        // (its powers: golden leaps and dashes held, how long the edges still wrap for it, how long till it can jump, and flash)
        leaps: snake.leaps, dashes: snake.dashes, wrap: Math.max(0, snake.wrapUntil - game.time), leapIn: leapIn(game, snake), flashIn: flashIn(game, snake),
        // (who it just met head-on, if it was in the last 3 s or so: it keeps clear of them for a while)
        bumped: snake.bumpedBy && game.tick - snake.bumpedBy.tick < 30 ? snake.bumpedBy.id : -1,
        // (how many of its next moves eat nothing: it's coughing, after choking on its own bead)
        coughIn: Math.max(0, snake.coughUntil - game.tick),
      },
      others: snap.snakes.filter(o => o.id !== snake.id),
      food: game.food, // (as it is: it only changes on a tick, so thinking ahead sees what the tick would)
      holes: blockedSeen(game, snap),
      fire: fireSeen(snap), // (among the holes: the cells that are only fire, which it can go through, at a price)
      pecks: snap.pecks.length ? (snap.peckSet ||= new Set(snap.pecks)) : NO_CELLS, // (among them too: the woodpecker's mark, not a hole yet: nothing to hop)
      // (When its strike comes, as anyone sees the bird drum it (its last blow
      // lands on the strike), and on the aim's last tick where it promised
      // each piece in its mark would land: the rings show them to everyone.)
      strikeAt: game.woodpecker?.target.length ? game.woodpecker.strikeAt : null,
      landings: game.woodpecker?.landings || null,
      burrows: game.burrows, // (as they are: a person sees every burrow on the board, [{ x, y, at }])
      age: game.history.length - 1 - idx,
      tick: game.tick,
      timeMs: game.time,
      weather: game.weather.kind, // (everyone sees the weather: in winter, apples rot twice as fast)
    };
  }

  // The game can let an AI think ahead of the tick (spread over the frames in
  // between), as long as nothing it looks at can change before the tick:
  // everything in aiView() is fixed between ticks (the food too: it only
  // moves, grows or goes during a tick, after everyone has decided), except
  // a snake about to starve, which shrinks at the start of the tick and must
  // decide after that.
  // (A stunned snake doesn't decide at all until it can move again, nor one in the air.)
  const canThinkAhead = (game, s) => s.alive && (!s.isPlayer || !!s.autopilot) && game.time < s.nextStarve && s.plannedTick !== game.tick && s.stunUntil <= game.tick && !s.flight;

  // A person's snake is handed to an AI (autopilot: a persona) when they leave.
  const brainOf = s => s.autopilot || s.persona;

  // A snake asks to jump: a person with Space or a tap, an AI by saying so
  // when it decides (memory.power: the tick). It leaps (golden, or the plain
  // one when it's ready) as soon as there's something right in front to hop
  // and somewhere to land, waiting a few ticks for that.
  function leap(game, s) {
    if (s?.alive) s.leapArmed = Math.max(game.tick, s.stunUntil) + T.LEAP_WINDOW; // (stunned: from when it moves again)
  }
  // A snake asks to flash: a person with E, Shift or a swipe the way they're
  // going, an AI by saying so (memory.flash: the tick). It goes the next tick
  // it moves on the ground (in the air, once it's down): golden (a dash) if
  // it holds any, else the plain one if rested.
  function flash(game, s) {
    if (s?.alive) s.flashArmed = Math.max(game.tick, s.stunUntil); // (stunned: when it moves again)
  }
  // How long until it can jump, or flash (ms; 0: now), golden charges included.
  const leapIn = (game, s) => s.leaps > 0 ? 0 : s.body.length <= T.MIN_LENGTH ? Infinity : Math.max(0, s.leapReadyAt - game.time);
  const flashIn = (game, s) => s.dashes > 0 ? 0 : T.FLASH_COST > 0 && s.body.length <= T.MIN_LENGTH ? Infinity : Math.max(0, s.flashReadyAt - game.time);

  function thinkAhead(game, s) {
    s.planned = decide(aiView(game, s), brainOf(s), s.memory);
    s.plannedTick = game.tick;
  }

  // Advance one tick. All snakes move at the same time. Returns the snakes that died.
  // game.events lists what happened this tick, for the chatter, sounds and banners:
  // { type: 'eat', snake, kind, x, y, color, cooked, gold } | { type: 'death', snake } | { type: 'spawn', kind, x, y }
  // | { type: 'choke', snake, x, y, tx, ty } (its own bead at x, y: spat to tx, ty (x, y if it stays), and it coughs)
  // | { type: 'nudge', snake, kind, x, y, tx, ty } (food its coughing head reached, rolled aside; a beetle scurries)
  // | { type: 'crash', snake, x, y, cause, killer, killerId, lost } (it bounced, lost `lost` segments, and is stunned)
  // | { type: 'leap', snake, x, y, gold, reach } (it took off over the cell x, y; reach: cells it rises over, landing next tick)
  // | { type: 'dash', snake, x, y, n, plain } (it went n cells from x, y: plain 1, a flash; else a golden dash) | { type: 'douse', x, y } (a dash put a fire out)
  // | { type: 'fizzle', snake, why, x, y, flash } (asked to jump, or flash (flash: 1), but couldn't: 'resting', 'small' or
  //   'landing'; x, y the cell it faced, off the board at the edge)
  // | { type: 'alight', snake } (crawled into fire) | { type: 'singe', snake } (lost a segment to the flames)
  // | { type: 'starving', snake } | { type: 'woodpecker' } (it came) | { type: 'aim', x, y }
  // | { type: 'peck', x, y, cells, under } (a patch taken out; under: ids of the snakes whose bodies lay across it, bridging it)
  // | { type: 'knock', kind, x, y, tx, ty, gold, color } (food the strike knocked from x, y to tx, ty, or eaten: tx, ty null;
  //   gold: 1, a golden beetle; color: a bead's)
  // | { type: 'cut', snake, x, y, lost, by } (a dash (by: who) cut it: its tail fell off) | { type: 'flown', x, y } (a beetle got away)
  // | { type: 'rot', x, y, kind, color } (an apple (kind 'apple') or a bead ('pellet', in its color) rotted away)
  // | { type: 'lastApples', x, y } (sudden death's first apple fell: the last apples come one at a time)
  // | { type: 'baked', x, y, kind } | { type: 'ash', x, y, kind } (food in the fire)
  // | { type: 'burrow', x, y, dug } (one cracked open; dug: 1, left by a dig) | { type: 'heal', x, y } (one closed over: sawdust and moss)
  // | { type: 'dive', x, y, dug } | { type: 'emerge', x, y } (a beetle went down one,
  //   or down where it dug in (dug: 1), came out of one) | { type: 'dig', x, y, until } (a cornered beetle digs in: gone at tick until)
  // | { type: 'weather', kind } | { type: 'gust', x, y } (x -1 if no apple fell) | { type: 'charge', x, y } (lightning on its way)
  // | { type: 'strike', x, y } | { type: 'rainbow', x, y } (and a golden apple there) | { type: 'ember', x, y, fx, fy } (a burning leaf blown)
  function step(game) {
    game.events = [];

    // Hunger: each overdue snake loses a segment. One already at its minimum
    // length starves this tick, unless its head reaches food first.
    const dying = [], starving = [], drops = [];
    for (const s of game.snakes) {
      if (!s.alive || game.time < s.nextStarve) continue;
      s.nextStarve = game.time + T.STARVE_EVERY_MS;
      if (s.grow > 0) s.grow--;
      else if (s.body.length > T.MIN_LENGTH) s.body.pop();
      else { starving.push(s); continue; }
      if (hungerLeft(game, s) > -T.STARVE_EVERY_MS) game.events.push({ type: 'starving', snake: s });
    }

    const alive = game.snakes.filter(s => s.alive);

    // Everyone decides, except the stunned: they stay put (and can steer meanwhile).
    const moving = [], fallback = new Map(), held = new Map(); // (fallback: the auto-turn, for a power asked for over a crash that may not go after all; held: a flash there that can't go, and why)
    for (const s of alive) {
      s.tailMoves = false; s.air = false; s.landing = false; s.boom = false; s.passed = null; s.from = null;
      if (s.stunUntil > game.tick) { s.next = null; continue; }
      let land = null;
      if (s.flight) { // in the air: it comes down where it was going (turns wait till it's landed)
        s.dir = s.flight.dir;
        land = s.flight.land;
        s.flight = null;
        s.landing = true;
      } else {
        let steered = false;
        if (s.isPlayer && !s.autopilot) {
          while (s.queue.length) { // (never into its own neck, whatever was pressed: a backstop for the game's own check)
            const d = s.queue.shift(), c = ahead(game, s, s.body[0].x, s.body[0].y, d), n = s.body[1];
            if (n && c.x === n.x && c.y === n.y) continue;
            s.dir = d;
            steered = true;
            break;
          }
        } else {
          s.dir = s.plannedTick === game.tick ? s.planned : decide(aiView(game, s), brainOf(s), s.memory);
          if (s.memory.power === game.tick) leap(game, s); // (it asked to jump, or flash, as a person would)
          if (s.memory.flash === game.tick) flash(game, s);
        }
        s.planned = null;
        s.plannedTick = -1;
        // Over a crash and still facing what it hit (or the cell it met another
        // head in, while that's shut to it: see shutTo), without having
        // steered: it turns to where there's room. (Two heads that met in an
        // empty cell would otherwise both go for it again, and again, until
        // one of them was too small to bounce.)
        if (s.stunUntil === game.tick) {
          const { x: nx, y: ny } = ahead(game, s, s.body[0].x, s.body[0].y, s.dir), shut = shutTo(game, s);
          if (!steered && (blocked(game, nx, ny) || (shut && s.bounce.x === nx && s.bounce.y === ny))) {
            // A power asked for counts as steering, if it can go (either, of
            // two); one that can't says why, and the auto-turn takes it clear:
            // it isn't sent back into what it hit, nor blown up, for a press
            // that was never going to work. (One that can go and then doesn't,
            // its landing taken as it goes, gets the auto-turn too: see below.
            // So does a flash that can't go asked with a jump that can: it
            // waits on the jump, and says why once the jump hasn't gone.)
            const jump = s.leapArmed >= game.tick && leapWontGo(game, s), fl = s.flashArmed >= game.tick && flashWontGo(game, s, shut); // (false: not asked; null: it can go)
            const turn = recoil(game, s, shut);
            if (jump === null || fl === null) { fallback.set(s, turn); if (fl) held.set(s, fl); }
            else {
              if (jump || fl) { game.events.push({ type: 'fizzle', snake: s, why: fl || jump, x: nx, y: ny, flash: fl ? 1 : 0 }); s.leapArmed = -1; s.flashArmed = -1; } // (where it faced: the auto-turn is about to turn it)
              s.dir = turn;
            }
          }
          s.bounce = null;
        }
      }
      s.next = land ? { x: land.x, y: land.y } : ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
      s.tailMoves = s.grow === 0;
      moving.push(s);
    }

    // Cells still occupied by bodies after everyone moves (tails that move
    // away are free; a stunned snake's isn't), and how many heads arrive in
    // each on-board cell.
    stamp++;
    for (const s of alive) {
      const keep = s.tailMoves ? s.body.length - 1 : s.body.length;
      for (let j = 0; j < keep; j++) {
        const k = key(s.body[j].x, s.body[j].y);
        bodyStamp[k] = stamp;
        bodyOwner[k] = s.id;
      }
    }
    // Powers, for each snake that asked (see leap() and flash()). A jump
    // goes first if it can (something right in front to hop, somewhere to
    // land): no flash gets past that, so a jump and a flash pressed together
    // hop it, and the flash waits till it's landed, like one asked for in the
    // air. So does a flash that would only get as far as something further
    // on that the jump is for (see jumpFor): the snake crawls up to it and
    // hops it, so the two pressed together are never worse than the jump
    // alone. Else the flash goes (golden: a dash), and a jump waits its few
    // ticks for something to hop. The flashes are all worked out on the board
    // as it was before any of them moved, and two through one cell meet
    // there, so no seat goes first. A snake cut in two by a dash, too short
    // to go on, is out (gone).
    const gone = new Set(), hops = [], plans = [], went = new Set(), cuts = [];
    moving0 = moving; // (a jump won't take off toward a landing another head is moving into)
    for (const s of moving) {
      if (s.landing) { if (s.flashArmed >= game.tick) s.flashArmed = game.tick + 1; continue; } // (on its way down: once it's moving on the ground)
      const jump = s.leapArmed >= game.tick, fl = s.flashArmed >= game.tick;
      if (jump && (!fl || held.has(s) || hopPlan(game, s))) { hops.push(s); if (fl) s.flashArmed = game.tick + 1; continue; }
      if (!fl) continue;
      const p = flashPlan(game, s), k = jump ? jumpFor(game, s, p) : -1;
      if (k < 0) { plans.push(p); continue; }
      s.flashArmed = game.tick + 1; // (it waits on the jump: right in front, the jump says why it can't go; further on, the snake goes straight on to it, no auto-turn)
      if (k === 0) hops.push(s); else went.add(s);
    }
    settle(game, plans);
    for (const p of plans) if (flashGo(game, p, cuts)) went.add(p.s);
    // (Of two cuts in one snake, the one nearer its head is the one that counts.)
    for (const c of cuts) c.j = c.o.body.findIndex(b => b.x === c.x && b.y === c.y);
    cuts.sort((a, b) => a.o.id - b.o.id || a.j - b.j);
    for (const c of cuts) {
      const j = c.o.body.findIndex(b => b.x === c.x && b.y === c.y);
      if (j > 0 && !gone.has(c.o)) cutAt(game, c.o, j, c.by, gone, dying, drops);
    }
    for (const s of hops) if (!gone.has(s)) hop(game, s);
    for (const [s, why] of held) { // (the jump it waited on hasn't gone: it says why it can't, where it faced, and the auto-turn takes it clear)
      if (gone.has(s) || s.air || !(s.flashArmed > game.tick)) continue;
      const c = ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
      game.events.push({ type: 'fizzle', snake: s, why, x: c.x, y: c.y, flash: 1 });
      s.flashArmed = -1;
    }
    for (const [s, d] of fallback) if (!s.air && !went.has(s)) { s.dir = d; s.next = ahead(game, s, s.body[0].x, s.body[0].y, d); }
    if (gone.size) for (let i = moving.length - 1; i >= 0; i--) if (gone.has(moving[i])) moving.splice(i, 1);
    for (const s of moving) {
      if (s.air || !inside(s.next.x, s.next.y)) continue; // (off-board heads, and heads in the air, never meet anyone)
      const k = key(s.next.x, s.next.y);
      if (headStamp[k] !== stamp) { headStamp[k] = stamp; headCount[k] = 0; headFirst[k] = s.id; }
      headCount[k]++;
    }

    // Who crashes: into the edge, a hole, a body, or head-on. killer: 'wall'
    // (walls and holes), 'self', or the name of the snake that was hit
    // (killerId: its id). Causes use names; the game turns the name of
    // whoever is watching into "you". A snake that crashes stays put, so its
    // tail stays too, and anyone heading into that tail crashes as well.
    const crashes = crashes0 = new Map();
    moving0 = moving;
    const crashOf = s => {
      const { x, y } = s.next;
      const k = key(x, y);
      if (!inside(x, y)) return { cause: s.boom ? 'flashed into the edge and blew up' : 'hit the edge', killer: 'wall', killerId: null };
      if (bodyStamp[k] === stamp && !s.boom) { // (a body first: one lying over a hole is what it hit)
        const other = game.snakes[bodyOwner[k]];
        // Two heads swapping cells met head-on, just as if they'd met in one.
        const swapped = other !== s && x === other.body[0].x && y === other.body[0].y && other.next?.x === s.body[0].x && other.next?.y === s.body[0].y;
        return { cause: other === s ? 'bit itself' : swapped ? `crashed head-on into ${other.name}` : `ran into ${other.name}`, killer: other === s ? 'self' : other.name, killerId: other.id, headOn: swapped };
      }
      if (game.holes.has(k)) return { cause: s.boom ? 'flashed into a woodpecker hole and blew up' : 'hit a woodpecker hole', killer: 'wall', killerId: null }; // (it bounces off a hole's rim like the edge; only a leap coming down on one falls in)
      if (headStamp[k] === stamp && headCount[k] > 1) {
        const other = moving.find(o => o !== s && !o.air && o.next.x === x && o.next.y === y);
        return { cause: `crashed head-on into ${other.name}`, killer: other.name, killerId: other.id, headOn: true, meet: true };
      }
      return null;
    };
    for (let more = true; more;) {
      more = false;
      for (const s of moving) {
        if (crashes.has(s) || s.air) continue;
        const c = crashOf(s);
        if (!c) continue;
        crashes.set(s, c);
        more = true;
        if (s.tailMoves) { const t = s.body[s.body.length - 1], k = key(t.x, t.y); bodyStamp[k] = stamp; bodyOwner[k] = s.id; }
      }
    }

    // A crash costs CRASH_LOSS segments off the tail (they fall off as food)
    // and a moment's stun. It's the end at MIN_LENGTH, dashing into the edge
    // or a hole, or if there'll be nowhere to turn when the stun's over (see
    // roomAfterStun: the cells its
    // tail breaks off from, cells rivals' tails will have left by then, and
    // a snake that's out count as room). A cell heads met in is room for one
    // of them once every other head that met there is out or has room of its
    // own (that one turns away; see recoil). Worked out until nothing
    // changes, since a snake that's out frees its cells for everyone else;
    // when nothing does, the shortest of those still boxed in are out first
    // (and the rest looked at again): so of two snakes that meet head-on, or
    // run into each other, each with nowhere else to turn, the longer one
    // bounces (the other's body, turned to food, makes room), and the same
    // length, both are out.
    const out = new Set(), live = new Set();
    const why = new Map(); // (why a crash was the end: for the card)
    for (const [s, c] of crashes) {
      // (A landing that crashed: its head comes down on what it hopped; a
      // hole, and in it goes, unless a body lies across it that's still
      // there once everyone's moved: that holds it up, till it moves on too,
      // and then it falls in (see fallIn). A body that crashes this tick
      // stays, but for the tail it loses, and none of it if it's blown up or
      // at its smallest: it's out.)
      const h = s.body[0], stays = (o, j) => crashes.has(o) ? !o.boom && o.body.length > T.MIN_LENGTH && j < o.body.length - Math.min(T.CRASH_LOSS, o.body.length - T.MIN_LENGTH) : j < o.body.length - 1 || !o.tailMoves || !moving.includes(o);
      if (s.landing && game.holes.has(key(h.x, h.y)) && !game.snakes.some(o => o !== s && o.alive && !gone.has(o) && o.body.some((b, j) => b.x === h.x && b.y === h.y && stays(o, j)))) {
        Object.assign(c, { cause: 'fell into a woodpecker hole', killer: 'wall', killerId: null, headOn: false, meet: false });
        out.add(s); why.set(s, 'hole');
      }
      if (s.boom) { out.add(s); why.set(s, 'boom'); } // (blown up)
      else if (s.body.length <= T.MIN_LENGTH) { out.add(s); why.set(s, 'tiny'); } // (too small to bounce)
    }
    const room = s => {
      if (roomAfterStun(game, s, out)) return true;
      const h = s.body[0], back = s.body[1];
      for (const d of CRAWL) { // (a cell heads met in: the others there are out, or have room of their own)
        const { x, y } = ahead(game, s, h.x, h.y, d);
        if ((back && x === back.x && y === back.y) || !inside(x, y)) continue;
        const met = metAt(s, x, y);
        if (met && met.every(o => out.has(o) || roomAfterStun(game, o, out))) return true;
      }
      return false;
    };
    for (let undecided = true; undecided;) {
      let changed = false;
      for (const [s] of crashes) if (!out.has(s) && !live.has(s) && room(s)) { live.add(s); changed = true; }
      if (changed) continue;
      let least = Infinity;
      for (const [s] of crashes) if (!out.has(s) && !live.has(s)) least = Math.min(least, s.body.length);
      undecided = least < Infinity;
      for (const [s] of crashes) if (!out.has(s) && !live.has(s) && s.body.length === least) out.add(s); // (the shortest still boxed in)
    }
    // Why each one out was out (before any survivor loses its tail: the
    // lengths as they met): at its smallest, blown up, down a hole, or boxed
    // in; and of two that met head-on, the shorter one, or the same length.
    for (const [s, c] of crashes) {
      if (!out.has(s)) continue;
      const o = c.headOn ? game.snakes[c.killerId] : null;
      s.fatal = why.get(s) || (o && live.has(o) && o.body.length > s.body.length ? 'shorter' : o && out.has(o) && o.body.length === s.body.length && !why.has(o) ? 'even' : 'boxed');
    }
    for (const [s, c] of crashes) {
      if (out.has(s)) {
        s.cause = c.cause; s.killer = c.killer; s.killerId = c.killerId;
        s.queue.length = 0; // (out: nothing it pressed is ever going to happen)
        dying.push(s);
        continue;
      }
      s.queue.length = 0; // (a crash: whatever was pressed before it was for a board that's gone)
      const lost = Math.min(T.CRASH_LOSS, s.body.length - T.MIN_LENGTH);
      for (let n = 0; n < lost; n++) { const t = s.body.pop(); drops.push({ x: t.x, y: t.y, color: s.color, owner: s.id }); }
      s.stunUntil = game.tick + 1 + T.STUN_TICKS;
      if (s.flashArmed > game.tick) s.flashArmed = s.stunUntil; // (a flash waiting on a jump, or on its landing: it goes when it moves again, as one pressed in a stun does)
      if (s.landing && burning(game, key(s.body[0].x, s.body[0].y))) { // (come down on fire: alight)
        if (!(s.burnUntil > game.tick)) { s.burnFrom = game.tick; game.events.push({ type: 'alight', snake: s }); }
        s.burnUntil = game.tick + T.BURN_TICKS;
      }
      s.bounce = c.headOn ? { x: s.next.x, y: s.next.y, by: c.killerId } : null;
      if (c.headOn) s.bumpedBy = { id: c.killerId, tick: game.tick };
      game.events.push({ type: 'crash', snake: s, x: s.next.x, y: s.next.y, cause: c.cause, killer: c.killer, killerId: c.killerId, lost });
    }

    for (const s of moving) {
      if (crashes.has(s)) continue;
      s.body.unshift(s.next);
      if (s.tailMoves) s.body.pop(); else s.grow--;
      if (!s.air && burning(game, key(s.next.x, s.next.y))) { // crawled into the fire: alight (not over it, in the air)
        if (!(s.burnUntil > game.tick)) { s.burnFrom = game.tick; game.events.push({ type: 'alight', snake: s }); }
        s.burnUntil = game.tick + T.BURN_TICKS;
      }
    }
    for (const s of dying) s.alive = false;

    eat(game);
    for (const s of starving) {
      if (!s.alive || s.ateTick === game.tick) continue; // crashed anyway, or reached food in time
      s.cause = 'starved'; s.killer = 'hunger'; s.fatal = 'hunger'; s.alive = false;
      dying.push(s);
    }
    singe(game, dying, drops);

    crawl(game);
    peck(game, dying);
    fallIn(game, dying);

    // Dead snakes fall to beads (every other segment: see leavesBead), and
    // broken-off pieces too (all of them), never on food, living bodies,
    // holes, fire or a burrow (nothing grows on one, and food there would
    // stop it up). Each bead remembers whose it was (you choke on your
    // own: see eat), and rots after a while, roasted ones later.
    if (dying.length || drops.length) {
      markBodies(game);
      for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
      for (const b of game.burrows) bodyStamp[key(b.x, b.y)] = stamp;
      const meat = (x, y, color, owner, cooked) => {
        const k = key(x, y);
        if (bodyStamp[k] === stamp || game.holes.has(k) || game.fires.has(k)) return;
        bodyStamp[k] = stamp;
        const expires = game.tick + Math.round(T.PELLET_TICKS * (cooked ? T.PELLET_COOKED : 1) * between(0.75, 1.25));
        game.food.push(cooked ? { x, y, kind: 'pellet', color, owner, expires, cooked: 1 } : { x, y, kind: 'pellet', color, owner, expires });
      };
      for (const s of dying) {
        s.diedAt = game.tick;
        game.events.push({ type: 'death', snake: s });
        s.body.forEach((c, j) => { if (leavesBead(j, s.body.length)) meat(c.x, c.y, s.color, s.id, s.burnUntil > game.tick); });
      }
      for (const d of drops) meat(d.x, d.y, d.color, d.owner, d.cooked);
    }

    fillFood(game);
    weather(game);
    game.time += tickMs(game);
    game.tick++;
    promiseLandings(game);
    snapshot(game);
    return dying;
  }

  // Does segment j (from the head) of a dead snake n long leave a bead? Every
  // CORPSE_EVERY-th one does (a kill is worth less than the whole snake, so
  // the first big fight doesn't snowball), and at least MIN_LENGTH of them:
  // the other segments nearest its tail end make up the number.
  function leavesBead(j, n) {
    if (j % T.CORPSE_EVERY === 0) return true;
    const wanted = Math.min(n, T.MIN_LENGTH) - Math.ceil(n / T.CORPSE_EVERY);
    if (wanted <= 0) return false;
    let behind = 0; // (skipped segments between this one and the tail end)
    for (let i = j + 1; i < n; i++) if (i % T.CORPSE_EVERY) behind++;
    return behind < wanted;
  }

  // Is this cell somewhere a head can't go (off the board, a hole, a body as
  // things stand, or burning)?
  function blocked(game, x, y) {
    if (!inside(x, y)) return true;
    const k = key(x, y);
    if (game.holes.has(k) || burning(game, k)) return true;
    for (const s of game.snakes) if (s.alive && s.body.some(c => c.x === x && c.y === y)) return true;
    return false;
  }

  // Just over a head-on: is the cell it met the other head in shut to it?
  // Only one of the two may go back in, the longer one (the same length:
  // the one that came first), so they can't meet there again; it's open to
  // either once the other is out, still stunned, or no longer beside it.
  function shutTo(game, s) {
    const b = s.bounce, o = b && game.snakes[b.by];
    if (!b || !o || !o.alive || o.stunUntil > game.tick || Math.abs(o.body[0].x - b.x) + Math.abs(o.body[0].y - b.y) !== 1) return false;
    return o.body.length > s.body.length || (o.body.length === s.body.length && o.id < s.id);
  }

  // Just over a crash, facing what it hit: the way to turn, the open side
  // with the most room round it (counted a short way; a tail leaving this
  // very tick counts as open, as it did for the verdict), and of sides with
  // as much room, the longest open run ahead, then the one furthest from the
  // edge (on an open board every side has room, and the first one tried used
  // to win: often straight at the nearest edge). Straight on if there's none. Never the cell it met another head in while that's shut
  // to it, and, if it can help it, not a cell another head could step into
  // this tick too (two heads side by side across a corner would otherwise
  // both turn into the corner they share, and meet again; the head it met,
  // if that cell's its own to take, won't).
  function recoil(game, s, shut) {
    const h = s.body[0], back = s.body[1], b = s.bounce;
    let best = s.dir, most = -Infinity;
    for (const d of CRAWL) {
      const { x, y } = ahead(game, s, h.x, h.y, d), met = b && b.x === x && b.y === y;
      if ((back && x === back.x && y === back.y) || (blocked(game, x, y) && !leavingNow(game, x, y)) || (met && shut)) continue;
      let room = Math.min(24, roomFrom(game, x, y, 24)); // (a side that reaches the cap is as roomy as any other)
      for (const o of game.snakes) if (o !== s && o.alive && !(met && o.id === b.by) && Math.abs(o.body[0].x - x) + Math.abs(o.body[0].y - y) === 1) room -= 100;
      let run = 0; // (the open run ahead: cells straight on until something's in the way)
      for (let rx = x, ry = y; run < GRID; run++) { rx += d.x; ry += d.y; if (blocked(game, rx, ry)) break; }
      const edge = Math.min(x, y, GRID - 1 - x, GRID - 1 - y);
      const score = room * 1000 + run * 20 + edge;
      if (score > most) { most = score; best = d; }
    }
    return best;
  }
  // Facing what it hit, with a power asked for: why it can't go ('resting',
  // 'small' or 'landing'), or null if it can. A jump needs to be ready (or
  // golden), and somewhere to land.
  function leapWontGo(game, s) {
    if (!(s.leaps > 0)) {
      if (s.body.length <= T.MIN_LENGTH) return 'small';
      if (game.time < s.leapReadyAt) return 'resting';
    }
    for (let c = ahead(game, s, s.body[0].x, s.body[0].y, s.dir), i = 0; i < (s.leaps > 0 ? 2 : 1); i++) {
      c = ahead(game, s, c.x, c.y, s.dir);
      if (inside(c.x, c.y) && (!blocked(game, c.x, c.y) || leavingNow(game, c.x, c.y))) return null; // (a tail leaving this tick is free by the time it lands, as for the auto-turn)
    }
    return 'landing';
  }
  // A flash needs to be rested (or golden), and somewhere to go: a plain one
  // gets nowhere into what it hit (or the cell it met a head in, shut to it),
  // and a golden one would blow up at the edge or a hole on its way, or
  // crash straight back into anything it can't cut through.
  function flashWontGo(game, s, shut) {
    const golden = s.dashes > 0, first = ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
    if (!golden && T.FLASH_COST > 0 && s.body.length <= T.MIN_LENGTH) return 'small';
    if (!golden && game.time < s.flashReadyAt) return 'resting';
    if (shut && s.bounce.x === first.x && s.bounce.y === first.y) return 'landing';
    if (!golden) return blocked(game, first.x, first.y) && !leavingNow(game, first.x, first.y) ? 'landing' : null;
    for (let c = first, i = 1; i <= T.DASH_LENGTH; i++, c = ahead(game, s, c.x, c.y, s.dir)) {
      if (!inside(c.x, c.y) || game.holes.has(key(c.x, c.y))) return 'landing';
      if (leavingNow(game, c.x, c.y)) continue;
      const o = game.snakes.find(o => o.alive && o.body.some(b => b.x === c.x && b.y === c.y));
      if (!o) continue;
      const past = ahead(game, s, c.x, c.y, s.dir);
      if (o === s || (o.body[0].x === c.x && o.body[0].y === c.y) || o.body.some(b => b.x === past.x && b.y === past.y)) return i === 1 ? 'landing' : null; // (it'd crash there: straight back in, or a little way on)
    }
    return null;
  }
  // Is (x, y) a tail end that moves on this very tick (its snake moving, not
  // growing)? Not if it lies over a hole: what it leaves is the hole.
  function leavingNow(game, x, y) {
    if (game.holes.has(key(x, y))) return false;
    for (const o of game.snakes) {
      if (!o.alive || o.grow > 0 || o.stunUntil > game.tick) continue;
      const t = o.body[o.body.length - 1];
      if (t.x === x && t.y === y) return true;
    }
    return false;
  }
  function roomFrom(game, x0, y0, cap) {
    const seen = new Set([key(x0, y0)]), queue = [[x0, y0]];
    while (queue.length && seen.size < cap) {
      const [x, y] = queue.shift();
      for (const d of CRAWL) {
        const nx = x + d.x, ny = y + d.y, k = key(nx, ny);
        if (seen.has(k) || blocked(game, nx, ny)) continue;
        seen.add(k);
        queue.push([nx, ny]);
      }
    }
    return seen.size;
  }

  // After a crash: will there be anywhere to turn when the stun's over (not
  // counting a cell heads met in: see the verdict in step)? A neighbouring
  // cell (not back into its own neck), on the board and not a hole, that's
  // free by the tick it moves again: free now; a cell another head arrives
  // in, or a body cell, that'll have been left by then (see freeBy); its own
  // tail that breaks off in the crash (or its tail end, leaving as it moves);
  // or a body that's out this tick (it turns to food). Fire counts as room:
  // you can go through fire. (out: snakes found to be out this tick.)
  function roomAfterStun(game, s, out) {
    const h = s.body[0], back = s.body[1], keep = s.body.length - Math.min(T.CRASH_LOSS, s.body.length - T.MIN_LENGTH);
    for (const d of CRAWL) {
      const { x, y } = ahead(game, s, h.x, h.y, d), k = key(x, y);
      if ((back && x === back.x && y === back.y) || !inside(x, y) || game.holes.has(k)) continue;
      const by = arrivalAt(x, y); // (a head that gets there this tick, on the ground or in the air: the cell's its head now...)
      if (by && !out.has(by) && !freeBy(game, by, -1)) continue;
      if (!by && headStamp[k] === stamp && headCount[k] > 0 && metAt(s, x, y)) continue; // (only heads that crashed there: a cell they met in)
      // (...and a body there, under one in the air, counts as well)
      if (bodyStamp[k] !== stamp) return true;
      const o = game.snakes[bodyOwner[k]];
      if (!o || out.has(o)) return true;
      const j = o.body.findIndex(c => c.x === x && c.y === y);
      if (j < 0) return true;
      if (o === s) { if (j >= keep - (s.grow > 0 ? 0 : 1)) return true; continue; } // (its own: the tail that breaks off, or the tail end, leaving as it moves)
      if (freeBy(game, o, j)) return true;
    }
    return false;
  }
  // Will cell j of snake o (-1: the cell its head's arriving in) be free by
  // the tick a snake that crashed this tick moves again (1 + STUN_TICKS
  // ticks after this one)? It's left on o's (length - j + growth)th move
  // (a head may take a cell on the tick a tail leaves it), and o's moves
  // start this tick, or once its stun's over (stunned, or crashed this tick:
  // then its tail breaks off now, as food).
  function freeBy(game, o, j) {
    let L = o.body.length, wait = 0;
    if (crashes0.has(o)) {
      const lost = Math.min(T.CRASH_LOSS, L - T.MIN_LENGTH);
      if (j >= L - lost) return true;
      L -= lost;
      wait = 1 + T.STUN_TICKS;
    } else wait = Math.max(0, o.stunUntil - game.tick);
    return wait + L - j + o.grow <= 2 + T.STUN_TICKS;
  }
  // A head that gets to (x, y) this tick (it doesn't crash), if one does.
  function arrivalAt(x, y) {
    for (const o of moving0) if (o.next && o.next.x === x && o.next.y === y && !crashes0.has(o)) return o;
    return null;
  }
  // The other heads that met in (x, y) this tick (an empty cell where heads
  // arrived and crashed), or null if no heads met there.
  function metAt(s, x, y) {
    let met = null;
    for (const o of moving0) {
      if (!o.next || o.next.x !== x || o.next.y !== y || !crashes0.has(o)) continue;
      if (!crashes0.get(o).meet) return null;
      if (o !== s) (met ||= []).push(o);
    }
    return met;
  }
  let crashes0 = new Map(), moving0 = []; // (this tick's crashes and moving snakes, for roomAfterStun)

  // A snake on fire loses a segment every BURN_EVERY ticks (they fall off,
  // roasted) until it goes out; rain and snow put it out sooner. At
  // MIN_LENGTH, the flames finish it.
  function singe(game, dying, drops) {
    const wet = game.weather.kind === 'rain' || game.weather.kind === 'snow';
    for (const s of game.snakes) {
      if (!s.alive || !(s.burnUntil > game.tick)) continue;
      if (wet) s.burnUntil = Math.min(s.burnUntil, game.tick + T.BURN_RAIN_TICKS);
      if (!(s.burnUntil > game.tick) || (game.tick - s.burnFrom) % T.BURN_EVERY !== T.BURN_EVERY - 1) continue;
      if (s.body.length <= T.MIN_LENGTH) {
        s.cause = 'burned up'; s.killer = 'fire'; s.killerId = null; s.fatal = 'fire'; s.alive = false;
        dying.push(s);
        continue;
      }
      const t = s.body.pop();
      drops.push({ x: t.x, y: t.y, color: s.color, owner: s.id, cooked: true });
      game.events.push({ type: 'singe', snake: s });
    }
  }

  // ------------------------------------------------------------- powers

  // A leap: up over the cell in front (a golden leap: over the two in front,
  // the first of them this tick), its head in the air over the last, landing
  // beyond it next tick. Only if there's something to hop (a body, a hole or
  // fire) and somewhere to land (none of those). The plain leap costs the tip
  // of its tail (it needs more than MIN_LENGTH) and needs a moment before the
  // next; golden ones are free.
  function hop(game, s) {
    const path = hopPlan(game, s);
    if (path) return leapGo(game, s, path);
    // Nothing went. Asked with something right in front to hop: say why not
    // (once), so a press isn't silently lost.
    const c = ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
    if (!inside(c.x, c.y)) { game.events.push({ type: 'fizzle', snake: s, why: 'landing', x: c.x, y: c.y }); s.leapArmed = -1; return; } // (the edge: nothing to hop, nowhere to land)
    if (hurdle(game, c)) {
      const why = s.leaps > 0 || game.time >= s.leapReadyAt ? (s.body.length <= T.MIN_LENGTH && !s.leaps ? 'small' : 'landing') : s.body.length <= T.MIN_LENGTH ? 'small' : 'resting';
      game.events.push({ type: 'fizzle', snake: s, why, x: c.x, y: c.y });
      s.leapArmed = -1;
    }
  }
  // Could it leap now? Golden: over two, or over one, landing on the first
  // free cell; else the plain one, if it's ready. Its way, or null.
  function hopPlan(game, s) {
    if (s.leaps > 0) return leapPath(game, s, 2) || leapPath(game, s, 1);
    return game.time >= s.leapReadyAt && s.body.length > T.MIN_LENGTH ? leapPath(game, s, 1) : null;
  }
  // A flash asked for with a jump (p: its plan): if it would stop at a hurdle
  // (run into it, or blow up in it: not a snake one thick a dash cuts, nor
  // fire it puts out) that the jump could clear once it's right in front,
  // how many cells before it that is (0: right in front), else -1. The way
  // there must be free, the jump ready (golden, or rested), still asked for
  // by then, and somewhere to land beyond the hurdle as things stand.
  function jumpFor(game, s, p) {
    if (p.why) return -1;
    const k = p.cells.length - 1, end = p.cells[k];
    if (!inside(end.x, end.y) || !hurdle(game, end) || (p.gold && !p.boom && !(p.solid[k] && !p.cuts.some(x => x.i === k)))) return -1;
    if (p.cells.slice(0, k).some(c => hurdle(game, c)) || s.leapArmed < game.tick + k) return -1;
    if (!(s.leaps > 0 || (game.time >= s.leapReadyAt && s.body.length > T.MIN_LENGTH))) return -1;
    for (let c = end, i = 0; i < (s.leaps > 0 ? 2 : 1); i++) {
      c = ahead(game, s, c.x, c.y, s.dir);
      if (!inside(c.x, c.y)) return -1;
      if (!hurdle(game, c)) return k;
    }
    return -1;
  }
  // Something a leap goes over: a body (still there after this tick's crawl), a hole or fire.
  const hurdle = (game, c) => { const k = key(c.x, c.y); return bodyStamp[k] === stamp || game.holes.has(k) || burning(game, k); };
  // A leap over `reach` cells (1, or 2 for a golden one), landing on the
  // next: those cells, or null if there's nothing to hop or nowhere to land.
  function leapPath(game, s, reach) {
    const path = [];
    for (let c = s.body[0], i = 0; i <= reach; i++) {
      c = ahead(game, s, c.x, c.y, s.dir);
      if (!inside(c.x, c.y)) return null; // (never off the board)
      path.push(c);
    }
    if (!path.slice(0, reach).some(c => hurdle(game, c)) || hurdle(game, path[reach])) return null;
    const land = path[reach]; // (nor toward a landing another head on the ground is moving into this tick: it'd come down on it)
    if (moving0.some(o => o !== s && !o.air && !o.flight && o.next && o.next.x === land.x && o.next.y === land.y)) return null;
    return path;
  }
  function leapGo(game, s, path) {
    const golden = s.leaps > 0, reach = path.length - 1;
    if (golden) s.leaps--;
    else {
      s.leapReadyAt = game.time + T.LEAP_COOLDOWN_MS;
      for (let n = 0; n < T.LEAP_COST; n++) trim(s);
    }
    s.from = s.body.slice(0, 2); // (where it set off, for food it knocks aside on the way: see eat)
    for (let i = 0; i < reach - 1; i++) {
      if (!hurdle(game, path[i])) (s.passed ||= []).push(path[i]); // (crawling over a free cell on the way: what's there is eaten after the move)
      advance(s, path[i]);
    }
    s.next = path[reach - 1];
    s.air = true;
    s.flight = { dir: s.dir, land: path[reach] };
    s.leapArmed = -1;
    game.events.push({ type: 'leap', snake: s, x: path[0].x, y: path[0].y, gold: golden ? 1 : 0, reach });
  }

  // A flash asked for, as it would go on the board before any power moves:
  // { s, why, x, y } if it can't go (resting, or too small), else { s, gold,
  // cells: the way it goes, ending where its head goes (or what it runs
  // into, or blows up at), solid: a body in each of them, boom, cuts, douse }.
  //   The plain flash: FLASH_LENGTH cells this tick, along the ground, then
  // it rests. It cuts nothing and puts nothing out; whatever's in the way (a
  // body, a hole, the edge, fire) it gets that far and runs into, as a crawl
  // would.
  //   Golden flashes held, a dash: DASH_LENGTH cells. A snake lying across
  // the way (one cell thick: not two of it in a row) is cut in two there
  // (everything behind the cut falls off as food; out, if less than
  // MIN_LENGTH is left in front of it); fire is put out; food on the way is
  // eaten. The edge or a hole: it blows up. Anything else (a head, a snake
  // two thick, its own body): it gets that far and crashes into it.
  function flashPlan(game, s) {
    const gold = s.dashes > 0, small = !gold && T.FLASH_COST > 0 && s.body.length <= T.MIN_LENGTH;
    if (small || (!gold && game.time < s.flashReadyAt)) {
      const c = ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
      return { s, why: small ? 'small' : 'resting', x: c.x, y: c.y };
    }
    const p = { s, gold, cells: [], solid: [], boom: false, cuts: [], douse: [] };
    const cutFrom = new Map(); // (a snake it cuts on the way, and where: the rest of it is falling off)
    const bodyAt = c => {
      const k = key(c.x, c.y);
      if (!inside(c.x, c.y) || bodyStamp[k] !== stamp) return null;
      const o = game.snakes[bodyOwner[k]], j = o ? o.body.findIndex(b => b.x === c.x && b.y === c.y) : -1;
      return o && j >= 0 && cutFrom.get(o) <= j ? null : { o, j };
    };
    for (let c = s.body[0], i = 0; i < (gold ? T.DASH_LENGTH : T.FLASH_LENGTH); i++) {
      c = ahead(game, s, c.x, c.y, s.dir);
      const k = key(c.x, c.y), b = bodyAt(c);
      p.cells.push(c);
      p.solid.push(!!b);
      if (!gold) {
        if (!inside(c.x, c.y) || game.holes.has(k) || b || burning(game, k)) break;
        continue;
      }
      if (!inside(c.x, c.y)) { p.boom = true; break; }
      if (b) { // (a body first: one lying over a hole is cut, and then it's into the hole)
        if (!b.o || b.o === s || b.j <= 0 || bodyAt(ahead(game, s, c.x, c.y, s.dir))?.o === b.o) break; // (it crashes into that)
        p.cuts.push({ o: b.o, x: c.x, y: c.y, i });
        cutFrom.set(b.o, b.j);
      }
      if (game.holes.has(k)) { p.boom = true; break; }
      const fire = game.fires.get(k);
      if (fire && !(fire.strike && game.tick < fire.from)) p.douse.push({ k, i }); // (not lightning still on its way)
    }
    return p;
  }
  // How many of a flash's cells its head gets through or into (not the
  // last, if it runs into what's there, or blows up).
  function reachOf(game, p) {
    const n = p.cells.length, c = p.cells[n - 1];
    return !inside(c.x, c.y) || game.holes.has(key(c.x, c.y)) || (p.solid[n - 1] && !p.cuts.some(x => x.i === n - 1)) ? n - 1 : n;
  }
  // Two flashes through one cell this tick: each stops there (it cuts
  // nothing there), and they meet as two heads do, whatever their seats.
  // Two head-on along one line pass through a stretch of cells both ways,
  // each reaching its own first of them before the other's: they meet
  // halfway, both in its middle cell, or (an even stretch) each going into
  // the middle cell the other has just taken, a swap, which is a head-on as
  // it is for two crawling heads (see crashOf).
  function settle(game, plans) {
    for (let again = plans.length > 1; again;) {
      again = false;
      const at = new Map(), reach = new Map(), first = new Map(), stops = []; // (at: each cell a head gets through or into, and the flashes that do; first: each flash's first cell another passes too)
      for (const p of plans) {
        if (!p.cells) continue;
        reach.set(p, reachOf(game, p));
        for (let i = 0; i < reach.get(p); i++) { const k = key(p.cells[i].x, p.cells[i].y); if (!at.has(k)) at.set(k, []); at.get(k).push(p); }
      }
      for (const [p, n] of reach) for (let i = 0; i < n; i++) if (at.get(key(p.cells[i].x, p.cells[i].y)).length > 1) { first.set(p, i); break; }
      for (const [p, i] of first) {
        const there = at.get(key(p.cells[i].x, p.cells[i].y)), q = there.length === 2 && there.find(o => o !== p), y = q && q.cells[first.get(q)];
        let stop = i;
        if (y && at.get(key(y.x, y.y)).length === 2) for (let n = i + 1; n < reach.get(p); n++) if (p.cells[n].x === y.x && p.cells[n].y === y.y) { stop = i + Math.floor((n - i + 1) / 2); break; } // (passing each other: halfway)
        stops.push([p, stop]);
      }
      for (const [p, i] of stops) {
        if (i === p.cells.length - 1 && !p.cuts.some(x => x.i === i)) continue; // (they meet where it was going anyway)
        p.cells.length = p.solid.length = i + 1;
        p.boom = false;
        p.cuts = p.cuts.filter(x => x.i < i);
        p.douse = p.douse.filter(x => x.i <= i);
        again = true;
      }
    }
  }
  // A flash goes (see flashPlan): it moves, and says so; the cuts it makes
  // are made once every flash has moved (see step). False if it couldn't go.
  function flashGo(game, p, cuts) {
    const s = p.s;
    s.flashArmed = -1;
    if (p.why) { game.events.push({ type: 'fizzle', snake: s, why: p.why, x: p.x, y: p.y, flash: 1 }); return false; }
    if (p.gold) s.dashes--;
    else {
      s.flashReadyAt = game.time + T.FLASH_COOLDOWN_MS;
      for (let n = 0; n < T.FLASH_COST; n++) trim(s);
    }
    const from = s.body[0], last = p.cells.length - 1;
    s.from = s.body.slice(0, 2); // (where it set off, for food it knocks aside on the way: see eat)
    for (let i = 0; i < last; i++) {
      advance(s, p.cells[i]);
      (s.passed ||= []).push(p.cells[i]); // (food on the way: eaten after everyone's moved, with what its head finds)
    }
    s.next = p.cells[last]; // (its head goes here, with everyone else's)
    s.boom = p.boom;
    for (const { k } of p.douse) if (game.fires.has(k)) douse(game, k);
    for (const c of p.cuts) cuts.push({ o: c.o, x: c.x, y: c.y, by: s });
    game.events.push({ type: 'dash', snake: s, x: from.x, y: from.y, n: last + 1, ...(p.gold ? {} : { plain: 1 }) });
    return true;
  }
  // A dash cuts o at body index j (by: the dasher).
  function cutAt(game, o, j, by, gone, dying, drops) {
    if (j < T.MIN_LENGTH) { // (too little left in front of the cut: out)
      for (const b of o.body) unstamp(o, b);
      o.cause = `got cut in two by ${by.name}`; o.killer = by.name; o.killerId = by.id; o.fatal = 'cut';
      dying.push(o);
      gone.add(o);
      return;
    }
    const cut = o.body.splice(j);
    for (const b of cut) unstamp(o, b);
    for (let i = 1; i < cut.length; i++) drops.push({ x: cut[i].x, y: cut[i].y, color: o.color, owner: o.id });
    if (o.tailMoves) unstamp(o, o.body[o.body.length - 1]); // (its new tail moves on this tick)
    game.events.push({ type: 'cut', snake: o, x: cut[0].x, y: cut[0].y, lost: cut.length, by: by.id });
  }
  function douse(game, k) {
    putOut(game, k);
    game.events.push({ type: 'douse', x: k % GRID, y: Math.floor(k / GRID) });
  }
  // Mid-tick, for the cells a leap or a dash passes on the way: its head on a
  // cell (now part of its body), and the tail end moving up after it.
  function advance(s, c) {
    s.body.unshift({ x: c.x, y: c.y });
    const k = key(c.x, c.y);
    bodyStamp[k] = stamp; bodyOwner[k] = s.id;
    trim(s);
  }
  // Its tail end gone (pending growth first), as the stamps go: if its new
  // tail will move on this tick, that cell's free.
  function trim(s) {
    if (s.grow > 0) s.grow--; else s.body.pop();
    s.tailMoves = s.grow === 0;
    if (s.tailMoves) unstamp(s, s.body[s.body.length - 1]);
  }
  function unstamp(s, c) {
    const k = key(c.x, c.y);
    if (bodyStamp[k] === stamp && bodyOwner[k] === s.id) bodyStamp[k] = 0;
  }

  // Every living head that moved onto food eats it (not in the air), and a
  // dash eats what was on the cells it passed. But not its own beads (the
  // tail a crash knocked off, or a cut took): it chokes on one, spits it
  // aside (it stays food for anyone else) and coughs for COUGH_TICKS, eating
  // nothing; food its coughing head reaches is nudged aside, out in the open
  // (left under it, no one else could see it, and it would wait there for
  // the cougher). More of its own beads met while it coughs are only nudged:
  // a cough never chains. Where things roll is a rule (see rollSide). (A
  // starving snake that chokes, or coughs, on the tick it runs out isn't
  // saved: it ate nothing.)
  function eat(game) {
    const room = (x, y) => foodRoom(game, x, y), past = (x, y) => foodPast(game, x, y);
    for (const s of game.snakes) {
      if (!s.alive) continue;
      const moved = s.stunUntil <= game.tick || s.landing; // (a crash, or a stun: its head is where it was, and found nothing new; but a jump whose landing was taken came down on what it hopped)
      const cells = s.air || !moved ? s.passed || [] : s.passed ? [...s.passed, s.body[0]] : [s.body[0]]; // (in the air: not what's under its head)
      for (let n = 0; n < cells.length; n++) {
        const c = cells[n], i = game.food.findIndex(f => f.x === c.x && f.y === c.y);
        if (i < 0) continue;
        const f = game.food[i], coughing = game.tick < s.coughUntil;
        if (!coughing && !(f.kind === 'pellet' && f.owner === s.id)) { consume(game, s, game.food.splice(i, 1)[0], c.x, c.y); continue; }
        // (where its head came from: a power's way across the board this tick, or its body)
        const to = rollSide(game, s.from ? { body: [...cells.slice(0, n + 1).reverse(), ...s.from], dir: s.dir } : s, c.x, c.y, room, past) || c;
        if (coughing) {
          game.events.push({ type: 'nudge', snake: s, kind: f.kind, x: c.x, y: c.y, tx: to.x, ty: to.y });
          if (f.kind === 'beetle' && to !== c) { // (a beetle scurries off, out of any hole it was digging)
            f.px = c.x; f.py = c.y; f.dir = CRAWL.find(d => d.x === to.x - c.x && d.y === to.y - c.y); f.movedAt = game.tick; f.scared = true;
            delete f.digUntil;
          }
        } else {
          s.coughUntil = game.tick + T.COUGH_TICKS;
          game.events.push({ type: 'choke', snake: s, x: c.x, y: c.y, tx: to.x, ty: to.y });
        }
        f.x = to.x; f.y = to.y;
      }
    }
  }
  // Where food can roll to: on the board, not a hole, not burning, no food
  // or burrow there, and no body that'll still be there next tick (a tail
  // end moving on is free).
  function foodRoom(game, x, y) {
    return foodPast(game, x, y) && !game.food.some(f => f.x === x && f.y === y) && !burrowAt(game, x, y);
  }
  // What food can roll past (see rollSide): on the board, not a hole, not
  // burning, and no body that'll still be there next tick. (Food or a
  // burrow lying there it rolls over; it just can't stop there.)
  function foodPast(game, x, y) {
    if (!inside(x, y)) return false;
    const k = key(x, y);
    if (game.holes.has(k) || burning(game, k)) return false;
    for (const o of game.snakes) {
      if (!o.alive) continue;
      const keep = o.grow === 0 && o.stunUntil <= game.tick + 1 ? o.body.length - 1 : o.body.length;
      for (let j = 0; j < keep; j++) if (o.body[j].x === x && o.body[j].y === y) return false;
    }
    return true;
  }
  // Which way a step from cell a to the next, b, went (a step through the
  // wrapped edge too).
  function stepWay(a, b) {
    let dx = b.x - a.x, dy = b.y - a.y;
    if (dx > 1) dx = -1; else if (dx < -1) dx = 1;
    if (dy > 1) dy = -1; else if (dy < -1) dy = 1;
    return CRAWL.find(d => d.x === dx && d.y === dy) || null;
  }
  // Where food a head knocks at (x, y) rolls: { x, y }, or null if it can't
  // go anywhere (it stays where it is). A rule, never chance, so anyone can
  // see where it'll go. With d the move that brought the head there and p
  // the move before it:
  //   1. a turn (d isn't p): to the inside of the turn, a cell back against
  //      p, beside the neck (on the outside, a cell on in p, it lay just
  //      where a head going on round, up, right, up, right, came next, and
  //      it was nudged along under the head all through a cough); if that's
  //      taken, the outside;
  //   2. straight on: to the side with more open log (free cells in a row
  //      going out that way, up to 4); a tie goes to the side nearer the
  //      middle of the board, then to the snake's right; if that side's
  //      taken, the other;
  //   3. both taken: it rolls on the way it would have gone first, over
  //      whatever lies on the log there (food, a burrow), to the first free
  //      cell within ROLL_ON; failing that, the other way. Only with both
  //      ways shut (the edge, a hole, fire or a body in the way) does it stay
  //      under the head. (Without this, a bead met crossing a line of beads
  //      stayed under the head, and then the body, hidden from everyone:
  //      about 4 chokes in 10. Rolling straight ahead as well was tried: it
  //      lay where the head went next, and the cougher pushed it along.)
  // s: the snake, or anything with its body (the head at (x, y), or (x, y)
  // the cell the head's about to move into) and dir. isFree(x, y): may food
  // stop there? canPass(x, y): may it roll past there (where it can't stop:
  // food or a burrow there)? (The engine's are foodRoom and foodPast; an AI
  // passes its own. Without canPass, nothing rolls on past the next cell.)
  // The wrapped edge is an edge here: nothing rolls through it. (game:
  // unused for now.)
  const ROLL_ON = 4;
  function rollSide(game, s, x, y, isFree, canPass = null) {
    const b = s.body, here = !!b[0] && b[0].x === x && b[0].y === y;
    const prev = here ? b[1] : b[0], before = here ? b[2] : b[1];
    const d = (prev && stepWay(prev, { x, y })) || s.dir;
    const p = (prev && before && stepWay(before, prev)) || d;
    const ok = (dx, dy) => inside(x + dx, y + dy) && isFree(x + dx, y + dy);
    let ways;
    if (d.x !== p.x || d.y !== p.y) ways = [{ x: -p.x, y: -p.y }, p];
    else {
      const right = { x: -d.y, y: d.x }, left = { x: d.y, y: -d.x }, mid = (GRID - 1) / 2;
      const open = w => { let n = 0; while (n < 4 && ok(w.x * (n + 1), w.y * (n + 1))) n++; return n; };
      const toMid = w => Math.abs(x + w.x - mid) + Math.abs(y + w.y - mid);
      const r = open(right), l = open(left);
      ways = (r !== l ? r > l : toMid(left) >= toMid(right)) ? [right, left] : [left, right];
    }
    for (const w of ways) if (ok(w.x, w.y)) return { x: x + w.x, y: y + w.y };
    const on = w => { // (rolling on, over what lies there)
      if (canPass) for (let n = 1; n < ROLL_ON; n++) {
        if (!inside(x + w.x * n, y + w.y * n) || !canPass(x + w.x * n, y + w.y * n)) break;
        if (ok(w.x * (n + 1), w.y * (n + 1))) return { x: x + w.x * (n + 1), y: y + w.y * (n + 1) };
      }
      return null;
    };
    return on(ways[0]) || on(ways[1]);
  }
  // A head eats food.
  function consume(game, s, f, x, y) {
    game.events.push({ type: 'eat', snake: s, kind: f.kind, x, y, color: f.color, cooked: !!f.cooked, gold: !!f.gold });
    // Golden powers add up: each kind on top of what's held, any kinds at once.
    if (f.gold) s.leaps = Math.min(T.LEAP_MAX, s.leaps + T.LEAP_CHARGES); // (a golden beetle: golden jumps)
    if (f.kind === 'leaf') s.dashes = Math.min(T.DASH_MAX, s.dashes + T.DASH_CHARGES); // (a golden leaf: golden flashes, dashes)
    if (f.kind === 'goldcap') s.wrapUntil = Math.min(Math.max(s.wrapUntil, game.time) + T.WRAP_MS, game.time + T.WRAP_MAX_MS); // (a golden mushroom: the edges wrap, a while longer)
    if (f.kind === 'mushroom') {
      // Shrink: cancel pending growth first, then drop tail segments.
      let n = T.SHRINK;
      const fromGrow = Math.min(s.grow, n);
      s.grow -= fromGrow;
      n -= fromGrow;
      while (n-- > 0 && s.body.length > T.MIN_LENGTH) s.body.pop();
    } else {
      const growth = f.kind === 'golden' ? T.GOLDEN_GROWTH : f.kind === 'beetle' ? T.BEETLE_GROWTH : f.cooked ? T.COOKED_GROWTH : 1;
      // (A meal never leaves it less time than it had: one just after HUNGER_MID_FROM_MS on top of one just before keeps the longer; mealMs, what a full bar means, is then that long.)
      const lasts = Math.max(mealLasts(game), hungerLeft(game, s));
      s.lastAte = game.time - (T.HUNGER_MS - lasts);
      s.nextStarve = game.time + lasts;
      s.mealMs = lasts;
      s.ateTick = game.tick; // (a snake out of time that reaches food grows instead of starving this tick)
      s.grow += growth;
      s.eaten += growth;
      if (f.kind === 'pellet') s.pellets++;
    }
  }

  return {
    GRID, PLAYER_COLOR, PERSONAS, DIRS, WEATHER,
    createGame, step, tickMs, hungerLeft, aiView, canThinkAhead, thinkAhead, suddenDeath, leap, leapIn, flash, flashIn, rollSide, knockTo, knocks,
  };
})();
