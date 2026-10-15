// Online play between friends: the messages. One browser (the host) runs the
// game exactly as it does alone; every tick it sends the others a compact
// picture of the board, and they send back nothing but their turns. This file
// is the protocol only (no networking: that's net.js), so it runs in Node too.
//
// Host -> guest
//   { t: 'welcome' }                        you're in the room
//   { t: 'reject', why }                    'full' | 'version'
//   { t: 'lobby', players: [{ name, color, host }], playing }
//   { t: 'round', id, humans, personas, rivals, first }  a new round's line-up, plus its first tick
//   { t: 'scores', from: [{ color, entries }] }  everyone's best rounds, for each other's Halls of Fame
//   { t: 'phase', s: 'countdown', beat } | { t: 'phase', s: 'go' }
//   { t: 'tick', ... }                      see tick() below
//   { t: 'plan', k, s }                     where each snake goes next, once the rivals have thought (see plan())
//   { t: 'say', id, text }                  a line of chatter
//   { t: 'closed' }                         the host closed the room
// Guest -> host
//   { t: 'hello', v, name, owner, scores }  v: VERSION; owner: a player id; scores: your best rounds
//   { t: 'turn', d }                        'up' | 'down' | 'left' | 'right' (a key: it only steers)
//   { t: 'swipe', d }                       a fresh swipe: the way you're going flashes, any other way steers
//   { t: 'pow', k }                         'leap' (Space, a tap) | 'flash' (E, Shift) | 'unleap' (a jump a finger held still asked for, taken back: it was a swipe)
window.SnakeOnline = (() => {
  const VERSION = 8; // 2: burrows, fire and weather; 3: the woodpecker's chunks, winter; 4: crashes, burning snakes, cooking, rot; 5: golden beetles and leaps, Ouroboros; 6: powers (everyone leaps; golden leaves, dashes; golden mushrooms, wrap); 7: jump and flash apart (everyone flashes), beads' owners and rot, holes under bodies, the last apples; 8: plans, so friends draw everyone ahead the way they're going, and a held jump taken back
  const POWERS = ['leap', 'flash', 'unleap'];
  const MAX_PEOPLE = 4;
  // Seat colors for people: the host is green; friends get colors no rival wears.
  const HUMAN_COLORS = ['#4ade80', '#fde047', '#c4b5fd', '#7dd3fc'];
  // Room codes avoid look-alikes (no 0/O, 1/I/L).
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const CODE_LENGTH = 5;
  const DIR_NAMES = ['up', 'down', 'left', 'right'];
  const KINDS = ['food', 'golden', 'mushroom', 'pellet', 'beetle', 'leaf', 'goldcap'];
  const WEATHER = ['clear', 'sun', 'wind', 'rain', 'storm', 'snow']; // (the engine's order)
  // Events that only say where something happened (and, for food, what).
  const AT = ['burrow', 'dive', 'emerge', 'gust', 'charge', 'strike', 'rainbow', 'aim', 'douse', 'lastApples'];
  const FOOD_AT = ['baked', 'ash'];
  // Events about one snake.
  const SNAKE = ['starving', 'alight', 'singe'];

  const newCode = () => Array.from({ length: CODE_LENGTH }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  const cleanCode = text => String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
  const isCode = text => cleanCode(text).length === CODE_LENGTH && [...cleanCode(text)].every(c => CODE_CHARS.includes(c));
  const cleanName = text => window.SnakeRecords.cleanName(text); // (one cleaner for every name)

  // A new round's line-up: everything a guest needs to lay out the same board.
  // humans: [{ name, color, peer, owner }] in seat order; peer tells each guest which seat is
  // theirs. id names the round, so everyone's Hall of Fame records it once.
  function round(game, humans, rivals, id) {
    return {
      t: 'round', v: VERSION, id, humans, rivals,
      personas: game.snakes.filter(s => s.persona).map(s => s.personaKey),
      first: tick(game, { holesFrom: 0, tickLen: 0 }),
    };
  }

  // What a guest's renderer needs from a snake's memory (including who it's looking at).
  // (desperate: starving soon and taking its chances, which the chatter may voice.)
  const MEMORY = ['home', 'colonies', 'mood', 'moodChangedAt', 'modelId', 'victimId', 'lureId', 'site', 'desperate'];

  // One tick as the host saw it. holesFrom: how many holes the guest already has
  // (holes only ever get added, in order).
  function tick(game, { holesFrom, tickLen }) {
    const cells = s => {
      const out = new Array(s.body.length);
      for (let i = 0; i < s.body.length; i++) out[i] = s.body[i].y * 1000 + s.body[i].x;
      return out;
    };
    const holes = [];
    let i = 0;
    for (const k of game.holes) if (i++ >= holesFrom) holes.push(k);
    return {
      t: 'tick', k: game.tick, ms: game.time, len: tickLen,
      s: game.snakes.map(s => [
        s.alive ? 1 : 0, DIR_NAMES.indexOf(dirName(s.dir)), s.eaten, s.lastAte, s.nextStarve, cells(s),
        memoryOf(s), s.autopilot ? 1 : 0, s.stunUntil, s.burnUntil, s.burnFrom, s.leaps, s.leapArmed,
        s.dashes, s.leapReadyAt, s.wrapUntil, s.flight ? DIR_NAMES.indexOf(dirName(s.flight.dir)) : -1,
        s.flashReadyAt, s.flashArmed,
      ]),
      // A beetle also says which way it faces and where it came from, so it
      // walks on every screen; a bead, whose it was (it rots, as all food does).
      f: game.food.map(f => f.kind === 'beetle'
        ? [f.x, f.y, KINDS.indexOf(f.kind), f.expires ?? -1, 0, DIR_NAMES.indexOf(dirName(f.dir)), f.px ?? -1, f.py ?? -1, f.movedAt, f.scared ? 1 : 0, f.gold ? 1 : 0]
        : [f.x, f.y, KINDS.indexOf(f.kind), f.expires ?? -1, f.color || 0, f.heat || 0, f.cooked ? 1 : 0, f.owner ?? -1]),
      h: holes,
      w: game.woodpecker ? [game.woodpecker.x, game.woodpecker.y, game.woodpecker.at, game.woodpecker.target, game.woodpecker.strikeAt, game.woodpecker.last, game.woodpecker.struckAt, game.woodpecker.restUntil, game.woodpecker.pecks || 0] : 0,
      // Burrows, fire (cell, burning from, until, struck by lightning, which fire), the weather.
      bu: game.burrows.map(b => [b.x, b.y, b.at]),
      fi: [...game.fires].map(([k, f]) => [k, f.from, f.until, f.strike ? 1 : f.ember ? 2 : 0, f.group]),
      sky: [WEATHER.indexOf(game.weather.kind), game.weather.since, game.weather.until],
      e: game.events.map(encodeEvent).filter(Boolean),
    };
  }

  // Where each snake goes next, as the host knows it between ticks, so a
  // friend's screen draws everyone ahead the way they're really going (see
  // the renderer's lead): a rival's plan once it's thought (and whether it
  // asked to jump or flash), a person's first queued turn and powers asked
  // for. Per snake: [way (DIR_NAMES index; -1: not known, on as it's going),
  // jump, flash], or 0 for the dead. Drawing only: the next tick says what
  // really happened.
  function plan(game) {
    return {
      t: 'plan', k: game.tick,
      s: game.snakes.map(s => {
        if (!s.alive) return 0;
        const ai = !s.isPlayer || !!s.autopilot, thought = ai && s.plannedTick === game.tick;
        const d = ai ? (thought ? s.planned : null) : s.queue[0] || null;
        const jump = ai ? thought && s.memory.power === game.tick : s.leapArmed >= game.tick;
        const flash = ai ? thought && s.memory.flash === game.tick : s.flashArmed >= game.tick;
        return [d ? DIR_NAMES.indexOf(dirName(d)) : -1, jump ? 1 : 0, flash ? 1 : 0];
      }),
    };
  }

  // A plan from the host, on a friend's screen (only for the tick it's for;
  // mine: this screen's own seat, whose presses it shows itself).
  function applyPlan(game, msg, DIRS, mine = -1) {
    if (!msg || msg.k !== game.tick || !Array.isArray(msg.s)) return false;
    msg.s.forEach((p, id) => {
      const s = game.snakes[id];
      if (!s?.alive || id === mine || !Array.isArray(p)) return;
      const d = DIRS[DIR_NAMES[p[0]]] || null;
      if (!s.isPlayer || s.autopilot) {
        s.planned = d;
        s.plannedTick = d ? game.tick : -1;
        if (p[1]) s.memory.power = game.tick;
        if (p[2]) s.memory.flash = game.tick;
      } else {
        s.queue.length = 0;
        if (d) s.queue.push(d);
        if (p[1]) s.leapArmed = Math.max(s.leapArmed, game.tick);
        if (p[2]) s.flashArmed = Math.max(s.flashArmed, game.tick);
      }
    });
    return true;
  }

  function memoryOf(s) {
    let m = 0;
    for (const k of MEMORY) if (s.memory[k] != null) (m ||= {})[k] = s.memory[k];
    return m;
  }

  function dirName(d) {
    return d.y < 0 ? 'up' : d.y > 0 ? 'down' : d.x < 0 ? 'left' : 'right';
  }

  function encodeEvent(e) {
    switch (e.type) {
      case 'eat': return ['eat', e.snake.id, KINDS.indexOf(e.kind), e.x, e.y, e.color || 0, e.cooked ? 1 : 0, e.gold ? 1 : 0, e.own ? 1 : 0];
      case 'leap': return ['leap', e.snake.id, e.x, e.y, e.gold ? 1 : 0, e.reach];
      case 'dash': return ['dash', e.snake.id, e.x, e.y, e.n, e.plain ? 1 : 0];
      case 'death': return ['death', e.snake.id, e.snake.cause, e.snake.killer, e.snake.killerId, e.snake.diedAt, e.snake.fatal || 0];
      case 'fizzle': return ['fizzle', e.snake.id, e.why, e.x, e.y, e.flash ? 1 : 0];
      case 'crash': return ['crash', e.snake.id, e.x, e.y, e.cause, e.killer, e.killerId, e.lost];
      case 'cut': return ['cut', e.snake.id, e.x, e.y, e.lost, e.by ?? -1];
      case 'spawn': return ['spawn', e.kind, e.x ?? -1, e.y ?? -1, e.gold ? 1 : 0];
      case 'weather': return ['weather', WEATHER.indexOf(e.kind)];
      case 'ember': return ['ember', e.x, e.y, e.fx, e.fy];
      case 'woodpecker': return ['woodpecker'];
      case 'peck': return ['peck', e.x, e.y, e.cells || [], e.under || []];
      case 'rot': return ['rot', e.x, e.y, e.kind === 'pellet' ? 1 : 0, e.color || 0]; // (an apple, or a bead in its colour)
      case 'flown': return ['flown', e.x, e.y];
      default:
        if (SNAKE.includes(e.type)) return [e.type, e.snake.id];
        if (FOOD_AT.includes(e.type)) return [e.type, e.x, e.y, KINDS.indexOf(e.kind)];
        return AT.includes(e.type) ? [e.type, e.x, e.y] : null;
    }
  }

  // The renderer reads these every frame, so a malformed one could break every frame.
  function saneMemory(k, v) {
    if (k === 'mood') return typeof v === 'string' && Object.prototype.hasOwnProperty.call(window.SnakeAI.PERSONAS, v);
    if (k === 'colonies') return Array.isArray(v) && v.length <= 64 && v.every(c => c && Number.isFinite(c.x) && Number.isFinite(c.y));
    if (k === 'home' || k === 'site') return typeof v === 'object' && Number.isFinite(v.x) && Number.isFinite(v.y);
    if (k === 'desperate') return typeof v === 'boolean';
    return Number.isFinite(v);
  }

  // Bring a guest's game up to the host's tick. Returns the snakes that died in it.
  // DIRS: the engine's direction objects (shared, so `s.dir === DIRS.up` holds).
  function apply(game, msg, DIRS) {
    game.tick = msg.k;
    game.time = msg.ms;
    const num = v => Number.isFinite(v);
    msg.s.forEach(([alive, dir, eaten, lastAte, nextStarve, cells, memory, autopilot, stunUntil, burnUntil, burnFrom, leaps, leapArmed, dashes, leapReadyAt, wrapUntil, flight, flashReadyAt, flashArmed], id) => {
      const s = game.snakes[id];
      if (!s) return;
      s.alive = !!alive;
      s.dir = DIRS[DIR_NAMES[dir]] || s.dir;
      s.eaten = eaten;
      s.lastAte = lastAte;
      s.nextStarve = nextStarve;
      s.autopilot = !!autopilot;
      s.stunUntil = num(stunUntil) ? stunUntil : -1;
      s.burnUntil = num(burnUntil) ? burnUntil : -1;
      s.burnFrom = num(burnFrom) ? burnFrom : -1;
      s.leaps = num(leaps) ? leaps : 0;
      s.leapArmed = num(leapArmed) ? leapArmed : -1;
      s.dashes = num(dashes) ? dashes : 0;
      s.leapReadyAt = num(leapReadyAt) ? leapReadyAt : 0;
      s.wrapUntil = num(wrapUntil) ? wrapUntil : -1;
      s.flight = num(flight) && flight >= 0 && DIRS[DIR_NAMES[flight]] ? { dir: DIRS[DIR_NAMES[flight]] } : null;
      s.flashReadyAt = num(flashReadyAt) ? flashReadyAt : 0;
      s.flashArmed = num(flashArmed) ? flashArmed : -1;
      s.planned = null; s.plannedTick = -1; s.queue.length = 0; // (the last tick's plan is spent: this one's follows, see applyPlan)
      const body = s.body;
      body.length = cells.length;
      for (let i = 0; i < cells.length; i++) {
        const x = cells[i] % 1000, y = (cells[i] - x) / 1000;
        if (body[i]) { body[i].x = x; body[i].y = y; } else body[i] = { x, y };
      }
      for (const k of MEMORY) {
        if (memory && memory[k] != null && saneMemory(k, memory[k])) s.memory[k] = memory[k];
        else if (s.memory[k] != null) s.memory[k] = null; // (null, not delete: the renderer reads these every frame)
      }
    });
    game.food = msg.f.map(([x, y, kind, expires, color, ...more]) => {
      const f = { x, y, kind: KINDS[kind] };
      if (expires >= 0) f.expires = expires;
      if (color) f.color = color;
      if (f.kind === 'beetle') {
        const [dir, px, py, movedAt, scared, gold] = more;
        Object.assign(f, { dir: DIRS[DIR_NAMES[dir]] || DIRS.right, movedAt, scared: !!scared });
        if (gold) f.gold = 1;
        if (px >= 0) { f.px = px; f.py = py; }
      } else {
        const [heat, cooked, owner] = more;
        if (num(heat) && heat > 0) f.heat = heat;
        if (cooked) f.cooked = 1;
        if (Number.isInteger(owner) && owner >= 0) f.owner = owner;
      }
      return f;
    });
    for (const k of msg.h) game.holes.add(k);
    const cellsOf = v => (Array.isArray(v) ? v : []).filter(k => Number.isInteger(k) && k >= 0 && k < 10000);
    game.woodpecker = msg.w ? { x: msg.w[0], y: msg.w[1], at: msg.w[2], target: cellsOf(msg.w[3]), strikeAt: msg.w[4], last: cellsOf(msg.w[5]), struckAt: msg.w[6], restUntil: msg.w[7], ...(Number(msg.w[8]) > 0 ? { pecks: Number(msg.w[8]) } : {}) } : null;
    game.burrows = (Array.isArray(msg.bu) ? msg.bu : []).filter(b => Array.isArray(b) && b.every(num)).map(([x, y, at]) => ({ x, y, at }));
    game.fires = new Map((Array.isArray(msg.fi) ? msg.fi : []).filter(f => Array.isArray(f) && f.every(num))
      .map(([k, from, until, strike, group]) => [k, strike === 2 ? { from, until, group, strike: false, ember: true } : { from, until, strike: !!strike, group }]));
    if (Array.isArray(msg.sky) && msg.sky.every(num)) game.weather = { kind: WEATHER[msg.sky[0]] || 'clear', since: msg.sky[1], until: msg.sky[2] };

    const dying = [];
    game.events = msg.e.map(e => {
      const snake = typeof e[1] === 'number' ? game.snakes[e[1]] : null;
      switch (e[0]) {
        case 'eat': return { type: 'eat', snake, kind: KINDS[e[2]], x: e[3], y: e[4], color: e[5] || undefined, cooked: !!e[6], gold: !!e[7], ...(e[8] ? { own: 1 } : {}) };
        case 'leap': return snake ? { type: 'leap', snake, x: e[2], y: e[3], gold: e[4] ? 1 : 0, reach: Number(e[5]) || 1 } : null;
        case 'dash': return snake ? { type: 'dash', snake, x: e[2], y: e[3], n: Number(e[4]) || 1, ...(e[5] ? { plain: 1 } : {}) } : null;
        case 'death':
          Object.assign(snake, { alive: false, cause: e[2], killer: e[3], killerId: e[4], diedAt: e[5], fatal: typeof e[6] === 'string' ? e[6] : null });
          dying.push(snake);
          return { type: 'death', snake };
        case 'crash': return { type: 'crash', snake, x: e[2], y: e[3], cause: String(e[4] || ''), killer: e[5], killerId: Number.isInteger(e[6]) ? e[6] : null, lost: Number(e[7]) || 0 };
        case 'fizzle': return snake ? { type: 'fizzle', snake, why: String(e[2] || ''), x: Number(e[3]) || 0, y: Number(e[4]) || 0, flash: e[5] ? 1 : 0 } : null;
        case 'cut': return snake ? { type: 'cut', snake, x: e[2], y: e[3], lost: Number(e[4]) || 0, by: Number.isInteger(e[5]) && e[5] >= 0 ? e[5] : null } : null;
        case 'spawn': return { type: 'spawn', kind: e[1], x: e[2], y: e[3], gold: !!e[4] };
        case 'weather': return { type: 'weather', kind: WEATHER[e[1]] || 'clear' };
        case 'ember': return { type: 'ember', x: e[1], y: e[2], fx: e[3], fy: e[4] };
        case 'woodpecker': return { type: 'woodpecker' };
        case 'peck': return { type: 'peck', x: e[1], y: e[2], cells: Array.isArray(e[3]) ? e[3].filter(Number.isInteger) : [], under: Array.isArray(e[4]) ? e[4].filter(Number.isInteger) : [] };
        case 'rot': return { type: 'rot', x: e[1], y: e[2], kind: e[3] ? 'pellet' : 'apple', ...(typeof e[4] === 'string' ? { color: e[4] } : {}) };
        case 'flown': return { type: 'flown', x: e[1], y: e[2] };
        default:
          if (SNAKE.includes(e[0])) return snake ? { type: e[0], snake } : null;
          if (FOOD_AT.includes(e[0])) return { type: e[0], x: e[1], y: e[2], kind: KINDS[e[3]] };
          return AT.includes(e[0]) ? { type: e[0], x: e[1], y: e[2] } : null;
      }
    }).filter(Boolean);
    return dying;
  }

  return { VERSION, MAX_PEOPLE, HUMAN_COLORS, DIR_NAMES, POWERS, newCode, cleanCode, isCode, cleanName, round, tick, apply, plan, applyPlan };
})();
