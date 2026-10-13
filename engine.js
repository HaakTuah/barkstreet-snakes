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
  const between = (a, b) => a + Math.random() * (b - a);
  const WEATHER = ['clear', 'sun', 'wind', 'rain', 'storm', 'snow'];

  function makeSnake(id, spawn, props) {
    const d = spawn.dir;
    const body = [0, 1, 2].map(k => ({ x: spawn.x - d.x * k, y: spawn.y - d.y * k }));
    return {
      id, body, dir: d, alive: true, grow: 0, eaten: 0, pellets: 0, lastAte: 0, ateTick: -1, nextStarve: T.HUNGER_MS,
      // stunUntil: the tick it moves again after a crash; burnUntil, burnFrom: on fire (from, until)
      stunUntil: -1, burnUntil: -1, burnFrom: -1,
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
    const people = (humans || (withPlayer ? [{ name: 'You', color: PLAYER_COLOR }] : [])).slice(0, SPAWNS.length);
    const wanted = T.OPPONENTS + 1 - people.length;
    const keys = (personas || pickOpponents(wanted)).filter(k => Object.prototype.hasOwnProperty.call(PERSONAS, k)).slice(0, wanted);
    const snakes = [];
    // (The killer of a snake that hit a wall, itself or hunger is that word, so no one may be called it.)
    const taken = new Set([...keys.map(k => PERSONAS[k].name), 'wall', 'self', 'hunger', 'fire']);
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
      // Beetle burrows ({ x, y, at: the tick it cracked open }), the beetle
      // underground (if one is), fire (cell -> { from, until, group, strike }:
      // it burns (setting alight any head that enters) from tick `from` to `until`; before that it's
      // only smouldering, or crackling where lightning will strike), and the
      // weather ({ kind, since, until, nextGust, nextStrike }, in game time).
      burrows: [], underground: null, fires: new Map(), fireGroups: new Map(), fireGroup: 0,
      weather: { kind: 'clear', since: 0, until: T.WEATHER_FIRST_MS, nextGust: 0, nextStrike: 0 },
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
  const hungerLeft = (game, s) => s.lastAte + T.HUNGER_MS - game.time;

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

  function fillFood(game) {
    // Apples and golden apples rot, mushrooms wither, and beetles nobody caught fly off.
    if (game.food.some(f => f.expires != null && f.expires <= game.tick)) {
      for (const f of game.food) {
        if (f.expires > game.tick) continue;
        if (f.kind === 'beetle') game.events.push({ type: 'flown', x: f.x, y: f.y });
        else if (f.kind === 'food') game.events.push({ type: 'rot', x: f.x, y: f.y });
      }
      game.food = game.food.filter(f => f.expires == null || f.expires > game.tick);
    }
    // Once the woodpecker is here, nothing new grows.
    if (suddenDeath(game)) return;

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
    for (; apples < (winter ? T.SNOW_APPLES : T.APPLES); apples++) place(apple(game));
    // (Rain: more mushrooms sprout.)
    for (; !winter && mushrooms < T.MUSHROOMS + (raining ? T.RAIN_MUSHROOMS : 0); mushrooms++) place({ kind: 'mushroom', expires: game.tick + T.MUSHROOM_TICKS });
    // (Sun: golden hour. Winter: hardly any.)
    const goldenChance = T.GOLDEN_CHANCE * (game.weather.kind === 'sun' ? T.SUN_GOLDEN : winter ? 0.2 : 1);
    if (!golden && Math.random() < goldenChance && place({ kind: 'golden', expires: game.tick + T.GOLDEN_TICKS })) {
      const g = game.food[game.food.length - 1];
      game.events.push({ type: 'spawn', kind: 'golden', x: g.x, y: g.y });
    }
    // Now and then a beetle comes out of a burrow for a crawl (one at a time).
    // The first cracks a burrow open where it's quiet; later ones come out of
    // a free burrow, or now and then open another.
    if (!beetles && !game.underground && game.time >= T.BEETLE_FIRST_MS && Math.random() < T.BEETLE_CHANCE) {
      let b = freeBurrow(game, -1);
      if (game.burrows.length < T.BURROW_MAX && (!b || Math.random() < T.BURROW_NEW_CHANCE)) {
        const at = place(null, true);
        if (at) {
          b = { x: at.x, y: at.y, at: game.tick };
          game.burrows.push(b);
          game.events.push({ type: 'burrow', x: b.x, y: b.y });
        }
      }
      if (b) {
        game.food.push({ x: b.x, y: b.y, kind: 'beetle', expires: game.tick + T.BEETLE_TICKS, dir: CRAWL[Math.floor(Math.random() * 4)], movedAt: game.tick });
        game.events.push({ type: 'spawn', kind: 'beetle', x: b.x, y: b.y });
      }
    }
  }

  // Picks free cells (no bodies, holes, food, burrows or fire), worked out
  // only when something actually needs placing. place(props, quiet): puts
  // food there (props: null to only pick a cell), and returns the cell.
  // quiet: pick the spot farthest from any head, of a few tries.
  function placer(game) {
    let free = null;
    return (props, quiet = false) => {
      if (!free) {
        markBodies(game);
        for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
        for (const k of game.holes) bodyStamp[k] = stamp;
        for (const b of game.burrows) bodyStamp[key(b.x, b.y)] = stamp;
        for (const k of game.fires.keys()) bodyStamp[k] = stamp;
        free = [];
        for (let k = 0; k < CELLS; k++) if (bodyStamp[k] !== stamp) free.push(k);
      }
      if (!free.length) return null; // a full board: nothing grows, and that's fine
      let at = Math.floor(Math.random() * free.length);
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
  // A scared beetle heads for a burrow if one's near, and dives in when it
  // gets there; it comes out of a burrow (another, if there is one) a moment later.
  function crawl(game) {
    const u = game.underground;
    if (u && game.tick >= u.until) {
      if (game.tick >= u.expires || suddenDeath(game)) game.underground = null; // (it stays home)
      else {
        const b = freeBurrow(game, u.from);
        if (b) {
          game.food.push({ x: b.x, y: b.y, kind: 'beetle', expires: u.expires, dir: CRAWL[Math.floor(Math.random() * 4)], movedAt: game.tick });
          game.events.push({ type: 'emerge', x: b.x, y: b.y });
          game.underground = null;
        }
      }
    }
    let marked = false;
    for (const b of game.food) {
      if (b.kind !== 'beetle') continue;
      let fear = 99, hx = 0, hy = 0;
      for (const s of game.snakes) {
        if (!s.alive) continue;
        const h = s.body[0], d = Math.abs(h.x - b.x) + Math.abs(h.y - b.y);
        if (d < fear) { fear = d; hx = h.x; hy = h.y; }
      }
      const scared = fear <= T.BEETLE_FEAR;
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
      let home = null, homeGap = 7;
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
        game.underground = { until: game.tick + Math.round(between(T.BEETLE_UNDER_MIN, T.BEETLE_UNDER_MAX)), expires: b.expires, from: key(b.x, b.y) };
        game.events.push({ type: 'dive', x: b.x, y: b.y });
        break; // (there's only ever one beetle)
      }
    }
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
    }
    const now = game.weather;
    if (now.kind === 'wind' && game.time >= now.nextGust) {
      now.nextGust = game.time + T.GUST_EVERY_MS;
      let apples = 0;
      for (const f of game.food) if (f.kind === 'food') apples++;
      const fell = apples < T.APPLES + T.WINDFALL_MAX ? placer(game)(apple(game)) : null;
      game.events.push({ type: 'gust', x: fell ? fell.x : -1, y: fell ? fell.y : -1 });
    }
    if (now.kind === 'storm' && game.time >= now.nextStrike) {
      now.nextStrike = game.time + between(T.STRIKE_MIN_MS, T.STRIKE_MAX_MS);
      strike(game);
    }
    // Winter: hunger runs faster (the clock to everyone's next meal runs down quicker).
    if (now.kind === 'snow') {
      const extra = tickMs(game) * (T.SNOW_HUNGER - 1);
      for (const s of game.snakes) if (s.alive) { s.lastAte -= extra; s.nextStarve -= extra; }
    }
    burn(game);
  }

  function spell(game) {
    const odds = Object.entries(T.WEATHER_ODDS).filter(([k]) => k !== 'storm' || game.time >= T.STORM_FROM_MS);
    let roll = Math.random() * odds.reduce((a, [, n]) => a + n, 0);
    for (const [k, n] of odds) if ((roll -= n) < 0) return k;
    return 'clear';
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
    game.fireGroups.set(group, 1);
    game.events.push({ type: 'charge', x: k % GRID, y: Math.floor(k / GRID) });
  }

  // Fire: a strike lands when its crackling's done, burning cells now and then
  // catch a neighbour (smouldering first, so everyone sees it coming), and
  // cells burn out. Rain puts it all out. (Times are ticks: the next tick is
  // game.tick + 1, when anything that's burning by then can kill.)
  function burn(game) {
    if (!game.fires.size) return;
    const next = game.tick + 1, raining = game.weather.kind === 'rain' || game.weather.kind === 'snow'; // (rain or snow: it goes out)
    const windy = game.weather.kind === 'wind' || game.weather.kind === 'storm';
    let marked = false;
    for (const [k, f] of game.fires) {
      if (raining) f.until = Math.min(f.until, Math.max(f.from, next) + T.RAIN_DOUSE_TICKS);
      if (f.until <= next) { // burnt out
        game.fires.delete(k);
        const left = (game.fireGroups.get(f.group) || 1) - 1;
        if (left > 0) game.fireGroups.set(f.group, left); else game.fireGroups.delete(f.group);
        continue;
      }
      if (f.strike && f.from === next) game.events.push({ type: 'strike', x: k % GRID, y: Math.floor(k / GRID) });
      // Wind: a burning leaf blown downwind (to the right), to start a small fire where it lands.
      if (windy && !raining && !f.ember && game.tick >= f.from && game.fires.size < T.FIRE_BOARD_MAX && Math.random() < T.EMBER_CHANCE) ember(game, k);
      if (f.ember || raining || game.tick < f.from || Math.random() >= T.FIRE_SPREAD || (game.fireGroups.get(f.group) || 0) >= T.FIRE_MAX || game.fires.size >= T.FIRE_BOARD_MAX) continue;
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
    }
    cook(game);
  }
  // Food in a burning cell cooks: an apple or a piece of meat bakes (worth
  // more, and an apple stops rotting for a while), and anything left in too
  // long goes to ash.
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
  // lands, then over and over: picks a patch of PECK_CHUNK cells somewhere on
  // the log (clear of every body and all food, and PECK_CLEARANCE cells from
  // every head, while there's such a spot), eyes it for PECK_AIM_TICKS
  // (everyone sees where, and the AIs keep out of it, like a hole), hammers
  // it all out at once, and rests a good while. Whatever's in the patch when
  // it strikes goes: food, fire, a burrow, and any part of a snake. A head
  // there, and that snake's out; a body there is cut, and everything behind
  // the cut falls off as food (out too, if what's left is less than
  // MIN_LENGTH).
  // game.woodpecker: { at (time it came), target: [cells it's aiming at],
  //   strikeAt (tick), last: [cells it took out last], struckAt (tick), restUntil (tick), x, y (where it's busy) }
  function peck(game, dying, drops) {
    if (!suddenDeath(game)) return;
    let w = game.woodpecker;
    if (!w) {
      w = game.woodpecker = { x: GRID / 2, y: 0, at: game.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: game.tick + T.PECK_ARRIVE_TICKS };
      game.events.push({ type: 'woodpecker' });
      return;
    }
    if (w.target.length && game.tick >= w.strikeAt) {
      const zone = new Set(w.target.filter(k => !game.holes.has(k)));
      for (const s of game.snakes) {
        if (!s.alive) continue;
        const i = s.body.findIndex(c => zone.has(key(c.x, c.y)));
        if (i < 0) continue;
        if (i < T.MIN_LENGTH) { // (its head, or too little left behind it)
          s.cause = 'fell into a woodpecker hole'; s.killer = 'wall'; s.killerId = null;
          s.alive = false;
          dying.push(s);
          continue;
        }
        const cut = s.body.splice(i);
        for (const c of cut) if (!zone.has(key(c.x, c.y))) drops.push({ x: c.x, y: c.y, color: s.color });
        game.events.push({ type: 'cut', snake: s, x: cut[0].x, y: cut[0].y, lost: cut.length });
      }
      for (const k of zone) { game.holes.add(k); game.fires.delete(k); } // (a burning cell pecked out: the fire there's gone too)
      game.food = game.food.filter(f => !zone.has(key(f.x, f.y)));
      game.burrows = game.burrows.filter(b => !zone.has(key(b.x, b.y))); // (a burrow pecked open is a hole now)
      const hit = [...zone];
      game.events.push({ type: 'peck', x: w.x, y: w.y, cells: hit });
      w.last = hit; w.struckAt = game.tick; w.target = []; w.restUntil = game.tick + T.PECK_REST_TICKS;
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

  // A patch for the woodpecker: grown cell by cell from a random start. It
  // keeps clear of everyone while it can: first of every body, all food and
  // PECK_CLEARANCE cells round every head; failing that, of bodies and heads
  // themselves; failing that, anywhere left.
  const PATCH_TRIES = [[true, T.PECK_CLEARANCE], [true, 0], [false, -1]];
  function pickPatch(game) {
    markBodies(game);
    const foodAt = new Set(game.food.map(f => key(f.x, f.y)));
    for (const [clear, gap] of PATCH_TRIES) {
      const ok = k => {
        if (game.holes.has(k)) return false;
        if (!clear) return true;
        if (bodyStamp[k] === stamp || foodAt.has(k)) return false;
        return headGap(game, k % GRID, Math.floor(k / GRID)) > gap;
      };
      for (let t = 0; t < 30; t++) {
        const seed = Math.floor(Math.random() * CELLS);
        if (!ok(seed)) continue;
        const patch = [seed], edge = [seed], inPatch = new Set(patch);
        while (patch.length < T.PECK_CHUNK && edge.length) {
          const from = edge[Math.floor(Math.random() * edge.length)], x = from % GRID, y = Math.floor(from / GRID);
          const opts = CRAWL.map(d => [x + d.x, y + d.y]).filter(([nx, ny]) => inside(nx, ny) && !inPatch.has(key(nx, ny)) && ok(key(nx, ny)));
          if (!opts.length) { edge.splice(edge.indexOf(from), 1); continue; }
          const [nx, ny] = opts[Math.floor(Math.random() * opts.length)], nk = key(nx, ny);
          patch.push(nk); edge.push(nk); inPatch.add(nk);
        }
        if (patch.length >= Math.ceil(T.PECK_CHUNK / 2)) return patch;
      }
    }
    return [];
  }

  function snapshot(game) {
    game.history.push({
      snakes: game.snakes.filter(s => s.alive).map(s => ({
        id: s.id, body: s.body.map(c => ({ x: c.x, y: c.y })), dir: s.dir,
      })),
      food: game.food.map(f => ({ ...f })),
      holes: game.holes.size,
      // (Fire, crackling, smouldering or burning, and the woodpecker's next chunk: keep out.)
      fires: game.fires.size || game.woodpecker?.target.length ? [...game.fires.keys(), ...(game.woodpecker?.target || NO_FIRES)] : NO_FIRES,
    });
    if (game.history.length > T.HISTORY) game.history.shift();
  }

  const NO_FIRES = [];

  // What an AI must keep out of in a snapshot: its holes and any fire (as
  // walls). Worked out once per snapshot, shared by every AI.
  function blockedSeen(game, snap) {
    const holes = holesSeen(game, snap.holes);
    if (!snap.fires.length) return holes;
    if (snap.blocked?.n !== holes.size) {
      const set = new Set(holes);
      for (const k of snap.fires) set.add(k);
      snap.blocked = { n: holes.size, set };
    }
    return snap.blocked.set;
  }

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

  // What an AI "sees": its own body now, everything else (holes and fire
  // included) as of its reaction time ago, like a person would. Rivals are just ids and
  // bodies; nothing says which one is human.
  function aiView(game, snake) {
    const delay = Math.max(1, Math.round(T.REACTION_MS / tickMs(game)));
    const idx = Math.max(0, game.history.length - 1 - delay);
    const snap = game.history[idx];
    return {
      grid: GRID,
      me: { id: snake.id, body: snake.body, dir: snake.dir, grow: snake.grow, hungerLeft: hungerLeft(game, snake) },
      others: snap.snakes.filter(o => o.id !== snake.id),
      food: snap.food,
      holes: blockedSeen(game, snap),
      age: game.history.length - 1 - idx,
      tick: game.tick,
      timeMs: game.time,
    };
  }

  // The game can let an AI think ahead of the tick (spread over the frames in
  // between), as long as nothing it looks at can change before the tick:
  // everything in aiView() is fixed between ticks, except a snake about to
  // starve, which shrinks at the start of the tick and must decide after that.
  // (A stunned snake doesn't decide at all until it can move again.)
  const canThinkAhead = (game, s) => s.alive && (!s.isPlayer || !!s.autopilot) && game.time < s.nextStarve && s.plannedTick !== game.tick && s.stunUntil <= game.tick;

  // A person's snake is handed to an AI (autopilot: a persona) when they leave.
  const brainOf = s => s.autopilot || s.persona;

  function thinkAhead(game, s) {
    s.planned = decide(aiView(game, s), brainOf(s), s.memory);
    s.plannedTick = game.tick;
  }

  // Advance one tick. All snakes move at the same time. Returns the snakes that died.
  // game.events lists what happened this tick, for the chatter, sounds and banners:
  // { type: 'eat', snake, kind } | { type: 'death', snake } | { type: 'spawn', kind, x, y }
  // | { type: 'crash', snake, x, y, cause, killer, killerId, lost } (it bounced, lost `lost` segments, and is stunned)
  // | { type: 'alight', snake } (crawled into fire) | { type: 'singe', snake } (lost a segment to the flames)
  // | { type: 'starving', snake } | { type: 'woodpecker' } (it came) | { type: 'aim', x, y } | { type: 'peck', x, y, cells } (a patch taken out)
  // | { type: 'cut', snake, x, y, lost } (the woodpecker cut it: its tail fell off) | { type: 'flown', x, y } (a beetle got away)
  // | { type: 'rot', x, y } (an apple rotted away) | { type: 'baked', x, y, kind } | { type: 'ash', x, y, kind } (food in the fire)
  // | { type: 'burrow', x, y } (one cracked open) | { type: 'dive', x, y } | { type: 'emerge', x, y } (a beetle went down one, came out of one)
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
    const moving = [];
    for (const s of alive) {
      s.tailMoves = false;
      if (s.stunUntil > game.tick) { s.next = null; continue; }
      const steered = s.isPlayer && !s.autopilot && s.queue.length > 0;
      if (s.isPlayer && !s.autopilot) {
        if (s.queue.length) s.dir = s.queue.shift();
      } else {
        s.dir = s.plannedTick === game.tick ? s.planned : decide(aiView(game, s), brainOf(s), s.memory);
      }
      s.planned = null;
      s.plannedTick = -1;
      // Over a crash and still facing what it hit, without having steered: it turns to where there's room.
      if (s.stunUntil === game.tick && !steered && blocked(game, s.body[0].x + s.dir.x, s.body[0].y + s.dir.y)) s.dir = recoil(game, s);
      s.next = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
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
    for (const s of moving) {
      if (!inside(s.next.x, s.next.y)) continue; // off-board heads never meet anyone
      const k = key(s.next.x, s.next.y);
      if (headStamp[k] !== stamp) { headStamp[k] = stamp; headCount[k] = 0; headFirst[k] = s.id; }
      headCount[k]++;
    }

    // Who crashes: into the edge, a hole, a body, or head-on. killer: 'wall'
    // (walls and holes), 'self', or the name of the snake that was hit
    // (killerId: its id). Causes use names; the game turns the name of
    // whoever is watching into "you". A snake that crashes stays put, so its
    // tail stays too, and anyone heading into that tail crashes as well.
    const crashes = new Map();
    const crashOf = s => {
      const { x, y } = s.next;
      const k = key(x, y);
      if (!inside(x, y)) return { cause: 'hit the wall', killer: 'wall', killerId: null };
      if (game.holes.has(k)) return { cause: 'fell into a woodpecker hole', killer: 'wall', killerId: null };
      if (bodyStamp[k] === stamp) {
        const other = game.snakes[bodyOwner[k]];
        // Two heads swapping cells met head-on, just as if they'd met in one.
        const swapped = other !== s && x === other.body[0].x && y === other.body[0].y && other.next?.x === s.body[0].x && other.next?.y === s.body[0].y;
        return { cause: other === s ? 'bit itself' : swapped ? `crashed head-on into ${other.name}` : `ran into ${other.name}`, killer: other === s ? 'self' : other.name, killerId: other.id };
      }
      if (headStamp[k] === stamp && headCount[k] > 1) {
        const other = moving.find(o => o !== s && o.next.x === x && o.next.y === y);
        return { cause: `crashed head-on into ${other.name}`, killer: other.name, killerId: other.id };
      }
      return null;
    };
    for (let more = true; more;) {
      more = false;
      for (const s of moving) {
        if (crashes.has(s)) continue;
        const c = crashOf(s);
        if (!c) continue;
        crashes.set(s, c);
        more = true;
        if (s.tailMoves) { const t = s.body[s.body.length - 1], k = key(t.x, t.y); bodyStamp[k] = stamp; bodyOwner[k] = s.id; }
      }
    }

    // A crash costs CRASH_LOSS segments off the tail (they fall off as food)
    // and a moment's stun. At MIN_LENGTH, or with nowhere to turn, it's the end.
    for (const [s, c] of crashes) {
      if (s.body.length <= T.MIN_LENGTH || !canTurn(game, s)) {
        s.cause = c.cause; s.killer = c.killer; s.killerId = c.killerId;
        dying.push(s);
        continue;
      }
      const lost = Math.min(T.CRASH_LOSS, s.body.length - T.MIN_LENGTH);
      for (let n = 0; n < lost; n++) { const t = s.body.pop(); drops.push({ x: t.x, y: t.y, color: s.color }); }
      s.stunUntil = game.tick + 1 + T.STUN_TICKS;
      game.events.push({ type: 'crash', snake: s, x: s.next.x, y: s.next.y, ...c, lost });
    }

    for (const s of moving) {
      if (crashes.has(s)) continue;
      s.body.unshift(s.next);
      if (s.tailMoves) s.body.pop(); else s.grow--;
      if (burning(game, key(s.next.x, s.next.y))) { // crawled into the fire: alight
        if (!(s.burnUntil > game.tick)) { s.burnFrom = game.tick; game.events.push({ type: 'alight', snake: s }); }
        s.burnUntil = game.tick + T.BURN_TICKS;
      }
    }
    for (const s of dying) s.alive = false;

    eat(game);
    for (const s of starving) {
      if (!s.alive || s.ateTick === game.tick) continue; // crashed anyway, or reached food in time
      s.cause = 'starved'; s.killer = 'hunger'; s.alive = false;
      dying.push(s);
    }
    singe(game, dying, drops);

    crawl(game);
    peck(game, dying, drops);

    // Dead snakes turn into meat, and broken-off pieces into food (never on
    // food, living bodies, holes or fire).
    if (dying.length || drops.length) {
      markBodies(game);
      for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
      const meat = (x, y, color, cooked) => {
        const k = key(x, y);
        if (bodyStamp[k] === stamp || game.holes.has(k) || game.fires.has(k)) return;
        bodyStamp[k] = stamp;
        game.food.push(cooked ? { x, y, kind: 'pellet', color, cooked: 1 } : { x, y, kind: 'pellet', color });
      };
      for (const s of dying) {
        s.diedAt = game.tick;
        game.events.push({ type: 'death', snake: s });
        for (const c of s.body) meat(c.x, c.y, s.color, s.burnUntil > game.tick);
      }
      for (const d of drops) meat(d.x, d.y, d.color, d.cooked);
    }

    fillFood(game);
    weather(game);
    game.time += tickMs(game);
    game.tick++;
    snapshot(game);
    return dying;
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

  // Just over a crash, facing what it hit: the way to turn, the open side
  // with the most room round it (counted a short way), or straight on if
  // there's none.
  function recoil(game, s) {
    const h = s.body[0], back = s.body[1];
    let best = s.dir, most = -1;
    for (const d of CRAWL) {
      const x = h.x + d.x, y = h.y + d.y;
      if ((back && x === back.x && y === back.y) || blocked(game, x, y)) continue;
      const room = roomFrom(game, x, y, 24);
      if (room > most) { most = room; best = d; }
    }
    return best;
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

  // After a crash, is there anywhere to turn? A neighbouring cell (not back
  // into its own neck) that's on the board, not a hole, and not taken by a
  // body or another head this tick. (Fire counts: you can go through fire.)
  function canTurn(game, s) {
    const h = s.body[0], back = s.body[1];
    for (const d of CRAWL) {
      const x = h.x + d.x, y = h.y + d.y, k = key(x, y);
      if ((back && x === back.x && y === back.y) || !inside(x, y) || game.holes.has(k) || bodyStamp[k] === stamp) continue;
      if (headStamp[k] === stamp && headCount[k] > 0) continue;
      return true;
    }
    return false;
  }

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
        s.cause = 'burned up'; s.killer = 'fire'; s.killerId = null; s.alive = false;
        dying.push(s);
        continue;
      }
      const t = s.body.pop();
      drops.push({ x: t.x, y: t.y, color: s.color, cooked: true });
      game.events.push({ type: 'singe', snake: s });
    }
  }

  // Every living head on food eats it.
  function eat(game) {
    for (const s of game.snakes) {
      if (!s.alive) continue;
      const h = s.body[0];
      const i = game.food.findIndex(f => f.x === h.x && f.y === h.y);
      if (i < 0) continue;
      const [f] = game.food.splice(i, 1);
      game.events.push({ type: 'eat', snake: s, kind: f.kind, x: h.x, y: h.y, color: f.color, cooked: !!f.cooked });
      if (f.kind === 'mushroom') {
        // Shrink: cancel pending growth first, then drop tail segments.
        let n = T.SHRINK;
        const fromGrow = Math.min(s.grow, n);
        s.grow -= fromGrow;
        n -= fromGrow;
        while (n-- > 0 && s.body.length > T.MIN_LENGTH) s.body.pop();
      } else {
        const growth = f.kind === 'golden' ? T.GOLDEN_GROWTH : f.kind === 'beetle' ? T.BEETLE_GROWTH : f.cooked ? T.COOKED_GROWTH : 1;
        s.lastAte = game.time;
        s.ateTick = game.tick;
        s.nextStarve = game.time + T.HUNGER_MS;
        s.grow += growth;
        s.eaten += growth;
        if (f.kind === 'pellet') s.pellets++;
      }
    }
  }

  return {
    GRID, PLAYER_COLOR, PERSONAS, DIRS, WEATHER,
    createGame, step, tickMs, hungerLeft, aiView, canThinkAhead, thinkAhead, suddenDeath,
  };
})();
