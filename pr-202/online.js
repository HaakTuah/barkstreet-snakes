// @ts-check
// Online play between friends: the messages. One browser (the host) runs the
// game exactly as it does alone; every tick it sends the others a compact
// picture of the board, and they send back nothing but their turns. This file
// is the protocol only (no networking: that's net.js), so it runs in Node too.
//
// The messages, as JSON over PeerJS (net.js adds 'ping', 'pong' and 'k'), are
// typed below; `tsc --noEmit -p jsconfig.json` checks this file and net.js
// against them. Many are positional arrays, narrowed on their first element.
// A change to any shape needs VERSION bumped: tools/online-test.js pins the
// shapes with the version (node tools/online-test.js --pin records a new pair).
//
// Host -> guest
/**
 * @typedef {WelcomeMsg | RejectMsg | LobbyMsg | RoundMsg | ScoresMsg | PhaseMsg | TickMsg | PlanMsg | SayMsg | ClosedMsg} HostMessage
 * @typedef {{ t: 'welcome', name: string }} WelcomeMsg  you're in the room, as name
 * @typedef {{ t: 'reject', why: 'full' | 'version' }} RejectMsg
 * @typedef {{ t: 'lobby', players: { id: string, name: string, color: string, host: boolean }[], lineup: { key: string, chosen: boolean }[] }} LobbyMsg
 *   who's in the room, and the rivals who'll take the seats left (lineup: the host's line-up, seat by seat; chosen: the host chose that one)
 * @typedef {{ t: 'round', v: number, id: string, humans: Human[], rivals: string, personas: string[], chosen: boolean, first: TickMsg }} RoundMsg
 *   a new round's line-up (chosen: the host chose some of them), plus its first tick (see round())
 * @typedef {{ name: string, color: string, peer?: string, owner?: string }} Human  a seat: peer tells each guest which is theirs
 * @typedef {{ t: 'scores', from: { color: string, entries: ScoreRow[] }[] }} ScoresMsg  everyone's best rounds, for each other's Halls of Fame
 * @typedef {{ id: string, name: string, place: number, won: boolean, draw: boolean, eaten: number, survived: number, date: number, round: string, owner: string, chosen: boolean }} ScoreRow
 *   (records.js: shareable, cleanShared)
 * @typedef {{ t: 'phase', s: 'countdown', beat: number } | { t: 'phase', s: 'go' }} PhaseMsg
 * @typedef {{ t: 'say', id: number, text: string, reply?: boolean }} SayMsg  a line of chatter (reply: answering another)
 * @typedef {{ t: 'closed' }} ClosedMsg  the host closed the room
 *
 * @typedef {{ t: 'tick', k: number, ms: number, len: number, s: SnakeRow[], f: FoodRow[], un: UnderRow[], h: number[],
 *   w: WoodpeckerRow | 0, bu: BurrowRow[], po: PortalRow[], fi: FireRow[], sky: [kind: number, since: number, until: number], e: EventRow[] }} TickMsg
 *   one tick as the host saw it (see tick())
 * @typedef {0 | 1} Flag
 * @typedef {[alive: Flag, dir: number, eaten: number, lastAte: number, nextStarve: number, cells: number[], memory: Engine.Memory | 0,
 *   autopilot: Flag, stunUntil: number, burnUntil: number, burnFrom: number, leaps: number, leapArmed: number, dashes: number,
 *   leapReadyAt: number, wrapUntil: number, flight: number, flashReadyAt: number, flashArmed: number, mealMs: number,
 *   land: number, airLeft: number, airGold: Flag, cheek: number, spitAt: number]} SnakeRow  land: where a jump in the air comes down (y * 1000 + x; -1: on the ground); airLeft: cells it still flies over; cheek: the segments a mushroom in its cheek took (0: none), spat at tick spitAt
 * @typedef {[x: number, y: number, kind: number, expires: number, zero: 0, dir: number, px: number, py: number, movedAt: number,
 *   scared: Flag, gold: Flag, digUntil: number]} BeetleRow
 * @typedef {[x: number, y: number, kind: number, expires: number, color: string | 0, heat: number, cooked: Flag, owner: number, power: number]} MealRow  power: a mushroom come back up's (0: a fresh one)
 * @typedef {BeetleRow | MealRow} FoodRow
 * @typedef {[until: number, expires: number, from: number, gold: Flag]} UnderRow
 * @typedef {[x: number, y: number, at: number, target: number[], strikeAt: number, last: number[], struckAt: number, restUntil: number,
 *   pecks: number, landings: [from: number, to: number][] | 0]} WoodpeckerRow
 * @typedef {[x: number, y: number, at: number, used: number, dug: Flag, shutFrom: number, shutAt: number]} BurrowRow
 * @typedef {[x: number, y: number, dx: number, dy: number, tx: number, ty: number, owner: number, shutAt: number]} PortalRow  a gold portal: its entry and the way through, its exit, whose, when it shuts (0: its owner's body is still through it)
 * @typedef {[cell: number, from: number, until: number, how: 0 | 1 | 2, group: number]} FireRow  how: 1 struck by lightning, 2 an ember
 *
 * An event (see encodeEvent()): snake is a snake's id; kind KINDS's index (a string for spawn).
 * @typedef {['eat', snake: number, kind: number, x: number, y: number, color: string | 0, cooked: Flag, gold: Flag]
 *   | ['leap', snake: number, x: number, y: number, gold: Flag, reach: number]
 *   | ['dash', snake: number, x: number, y: number, n: number, plain: Flag]
 *   | ['death', snake: number, cause: string, killer: string | null, killerId: number | null, diedAt: number, fatal: string | 0]
 *   | ['fizzle', snake: number, why: string, x: number, y: number, flash: Flag]
 *   | ['crash', snake: number, x: number, y: number, cause: string, killer: string | null, killerId: number | null, lost: number, failed: 0 | 1]
 *   | ['cut', snake: number, x: number, y: number, lost: number, by: number]
 *   | ['squash', snake: number, x: number, y: number]
 *   | ['spit', snake: number, x: number, y: number, tx: number, ty: number, power: number, hit: number, lx: number | null, ly: number | null]
 *   | ['dig', x: number, y: number, until: number]
 *   | ['dive', x: number, y: number, dug: Flag]
 *   | ['knock', kind: number, x: number, y: number, tx: number | null, ty: number | null, gold: Flag, color: string | 0]
 *   | ['burrow', x: number, y: number, dug: Flag]
 *   | ['shut', x: number, y: number, at: number]
 *   | ['heal', x: number, y: number]
 *   | [type: 'portal' | 'through', snake: number, x: number, y: number, tx: number, ty: number, owner: number]
 *   | ['portalShut', x: number, y: number, tx: number, ty: number]
 *   | ['spawn', kind: string, x: number, y: number, gold: Flag]
 *   | ['weather', kind: number]
 *   | ['ember', x: number, y: number, fx: number, fy: number]
 *   | ['woodpecker']
 *   | ['peck', x: number, y: number, cells: number[], under: number[]]
 *   | ['rot', x: number, y: number, bead: Flag, color: string | 0]
 *   | ['flown', x: number, y: number]
 *   | [type: 'starving' | 'alight' | 'singe', snake: number]
 *   | [type: 'baked' | 'ash', x: number, y: number, kind: number]
 *   | [type: 'emerge' | 'gust' | 'charge' | 'strike' | 'rainbow' | 'aim' | 'douse' | 'lastApples', x: number, y: number]} EventRow
 *
 * @typedef {{ t: 'plan', k: number, s: ([way: number, jump: Flag, flash: Flag] | 0)[] }} PlanMsg
 *   where each snake goes next, once the rivals have thought (see plan())
 */
// Guest -> host
/**
 * @typedef {HelloMsg | TurnMsg | PowMsg | AwayMsg} GuestMessage
 * @typedef {{ t: 'hello', v: number, name: string, owner: string, scores: ScoreRow[] }} HelloMsg  v: VERSION; owner: a player id; scores: your best rounds
 * @typedef {'up' | 'down' | 'left' | 'right'} DirName
 * @typedef {{ t: 'turn' | 'swipe', d: DirName }} TurnMsg  turn: a key (it only steers); swipe: a fresh swipe (the way you're going flashes, any other way steers)
 * @typedef {{ t: 'pow', k: 'leap' | 'flash' | 'unleap' }} PowMsg
 *   'leap' (Space, a tap) | 'flash' (E, Shift) | 'unleap' (a jump a finger held still asked for, taken back: it was a swipe)
 * @typedef {{ t: 'away' | 'back' }} AwayMsg  the page went out of sight, and came back
 */
window.SnakeOnline = (() => {
  const VERSION = 21; // 2: burrows, fire and weather; 3: the woodpecker's chunks, winter; 4: crashes, burning snakes, cooking, rot; 5: golden beetles and leaps, Ouroboros; 6: powers (everyone leaps; golden leaves, dashes; golden mushrooms, wrap); 7: jump and flash apart (everyone flashes), beads' owners and rot, holes under bodies, the last apples; 8: plans, so friends draw everyone ahead the way they're going, and a held jump taken back; 9: choking on your own beads (each snake's cough; chokes and nudges, and where each piece rolled); 10: beetles that dig in (each one's digUntil; digs, and dives that were digs), several beetles underground, and food the woodpecker knocks aside (where each piece flew, and a bead's colour; where its strike promised each would land); burrows as the engine keeps them (when each was last used, and whether a dig left it), a dug burrow opening and one closing over; 11: burrows grow shut (when each started and will close over, and one starting to); 12: rivals chosen (a round's, and a shared best round's, chosen flag); 13: the lobby shows the line-up (the host's rivals, seat by seat, and which were chosen); 14: Capricious does every rival (its mood any of them, worn as a costume); 15: Copycat plays as its model plays (the style it reads, for its note); 16: round six B's island hop (a jump in the air: where it comes down, how many cells it still flies over, golden); 17: round six B's bridges (no message changed: a rule both sides must play by); 18: round six B's cuts (a failed flash's crash says so; the plain flash cuts, its own tail too: a rule both sides play by) and your own beads squashed (no choke, cough or nudge: each snake's cough gone; a squash where each went); 19: round six B's mushrooms come back up (each snake's cheek, and when it's spat; a spat mushroom's strength; a spit, where it came down, whom it hit, where it lies); 20: round six B's golden flight, leap now and bumps in the air (part 4); 21: round six B's gold portals (each portal, and portals opening, followed through and shutting)
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
  const AT = ['emerge', 'gust', 'charge', 'strike', 'rainbow', 'aim', 'douse', 'lastApples'];
  const FOOD_AT = ['baked', 'ash'];
  // Events about one snake.
  const SNAKE = ['starving', 'alight', 'singe'];

  /** @type {() => string} */
  const newCode = () => Array.from({ length: CODE_LENGTH }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  /** @param {unknown} text */
  const cleanCode = text => String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
  /** @param {unknown} text */
  const isCode = text => cleanCode(text).length === CODE_LENGTH && [...cleanCode(text)].every(c => CODE_CHARS.includes(c));
  /** @param {unknown} text */
  const cleanName = text => window.SnakeRecords.cleanName(text); // (one cleaner for every name)

  // A new round's line-up: everything a guest needs to lay out the same board.
  // humans: [{ name, color, peer, owner }] in seat order; peer tells each guest which seat is
  // theirs. id names the round, so everyone's Hall of Fame records it once.
  /** @param {Engine.Game} game @param {Human[]} humans @param {string} rivals @param {string} id @returns {RoundMsg} */
  function round(game, humans, rivals, id) {
    return {
      t: 'round', v: VERSION, id, humans, rivals,
      personas: game.snakes.filter(s => s.persona).map(s => /** @type {string} */ (s.personaKey)),
      chosen: !!game.chosen,
      first: tick(game, { holesFrom: 0, tickLen: 0 }),
    };
  }

  // What a guest's renderer needs from a snake's memory (including who it's looking at).
  // (desperate: starving soon and taking its chances, which the chatter may voice.)
  const MEMORY = ['home', 'colonies', 'mood', 'moodChangedAt', 'modelId', 'style', 'victimId', 'lureId', 'site', 'desperate'];

  // One tick as the host saw it. holesFrom: how many holes the guest already has
  // (holes only ever get added, in order).
  /** @param {Engine.Game} game @param {{ holesFrom: number, tickLen: number }} at @returns {TickMsg} */
  function tick(game, { holesFrom, tickLen }) {
    /** @param {Engine.Snake} s */
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
        s.flashReadyAt, s.flashArmed, s.mealMs,
        s.flight ? s.flight.land.y * 1000 + s.flight.land.x : -1, s.flight ? s.flight.over.length : 0, s.flight?.gold ? 1 : 0,
        s.cheek ? s.cheek.power : 0, s.cheek ? s.cheek.spitAt : -1,
      ]),
      // A beetle also says which way it faces and where it came from, so it
      // walks on every screen, and until when it's digging in, if it is (it
      // sinks as the time runs out); a bead, whose it was (it rots, as all food does).
      f: game.food.map(f => f.kind === 'beetle'
        ? [f.x, f.y, KINDS.indexOf(f.kind), f.expires ?? -1, 0, DIR_NAMES.indexOf(dirName(f.dir)), f.px ?? -1, f.py ?? -1, f.movedAt, f.scared ? 1 : 0, f.gold ? 1 : 0, f.digUntil ?? -1]
        : [f.x, f.y, KINDS.indexOf(f.kind), f.expires ?? -1, f.color || 0, f.heat || 0, f.cooked ? 1 : 0, f.owner ?? -1, f.power || 0]),
      // The beetles underground: until (when one comes up), when it flies off, the burrow or dig it went down, golden.
      un: (game.unders || []).map(u => [u.until, u.expires, u.from, u.gold ? 1 : 0]),
      h: holes,
      // The woodpecker, and in the last PECK_PROMISE_TICKS moves before its strike, where it promised each piece
      // in its mark would land (a list that can grow as food comes into the mark; sent whole every tick, so
      // protocol 10 carries it unchanged).
      w: game.woodpecker ? [game.woodpecker.x, game.woodpecker.y, game.woodpecker.at, game.woodpecker.target, game.woodpecker.strikeAt, game.woodpecker.last, game.woodpecker.struckAt, game.woodpecker.restUntil, game.woodpecker.pecks || 0, game.woodpecker.landings || 0] : 0,
      // Burrows (where, the tick it opened, the time a beetle last used it, a dig left it, and once it grows
      // shut, the times it started and will close over, else -1), fire (cell,
      // burning from, until, struck by lightning, which fire), the weather.
      bu: game.burrows.map(b => [b.x, b.y, b.at, b.used ?? -1, b.dug ? 1 : 0, b.shutFrom ?? -1, b.shutAt ?? -1]),
      // The gold portals (round six B, part 5): entry, the way through, exit, whose, when it shuts.
      po: game.portals.map(p => [p.x, p.y, p.dx, p.dy, p.tx, p.ty, p.owner, p.shutAt]),
      fi: [...game.fires].map(([k, f]) => [k, f.from, f.until, f.strike ? 1 : f.ember ? 2 : 0, f.group]),
      sky: [WEATHER.indexOf(game.weather.kind), game.weather.since, game.weather.until],
      e: /** @type {EventRow[]} */ (game.events.map(encodeEvent).filter(Boolean)),
    };
  }

  // Where each snake goes next, as the host knows it between ticks, so a
  // friend's screen draws everyone ahead the way they're really going (see
  // the renderer's lead): a rival's plan once it's thought (and whether it
  // asked to jump or flash), a person's first queued turn and powers asked
  // for. Per snake: [way (DIR_NAMES index; -1: not known, on as it's going),
  // jump, flash], or 0 for the dead. Drawing only: the next tick says what
  // really happened.
  /** @param {Engine.Game} game @returns {PlanMsg} */
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
  /** @param {Engine.Game} game @param {PlanMsg} msg @param {Engine.Dirs} DIRS */
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

  /** @param {Engine.Snake} s @returns {Engine.Memory | 0} */
  function memoryOf(s) {
    /** @type {Engine.Memory | 0} */
    let m = 0;
    for (const k of MEMORY) if (s.memory[k] != null) (m ||= {})[k] = s.memory[k];
    return m;
  }

  /** @param {Engine.Dir} d */
  function dirName(d) {
    return d.y < 0 ? 'up' : d.y > 0 ? 'down' : d.x < 0 ? 'left' : 'right';
  }

  /** @param {Engine.Event} e @returns {EventRow | null} */
  function encodeEvent(e) {
    switch (e.type) {
      case 'eat': return ['eat', e.snake.id, KINDS.indexOf(e.kind), e.x, e.y, e.color || 0, e.cooked ? 1 : 0, e.gold ? 1 : 0];
      case 'leap': return ['leap', e.snake.id, e.x, e.y, e.gold ? 1 : 0, e.reach];
      case 'dash': return ['dash', e.snake.id, e.x, e.y, e.n, e.plain ? 1 : 0];
      case 'death': return ['death', e.snake.id, e.snake.cause, e.snake.killer, e.snake.killerId, e.snake.diedAt, e.snake.fatal || 0];
      case 'fizzle': return ['fizzle', e.snake.id, e.why, e.x, e.y, e.flash ? 1 : 0];
      case 'crash': return ['crash', e.snake.id, e.x, e.y, e.cause, e.killer, e.killerId, e.lost, e.failed ? 1 : 0];
      case 'cut': return ['cut', e.snake.id, e.x, e.y, e.lost, e.by ?? -1];
      // A bead of its own squashed under its head.
      case 'squash': return ['squash', e.snake.id, e.x, e.y];
      // A mushroom spat from x, y to tx, ty (maybe off the board), this strong; hit: whose head swallowed it (-1: none);
      // lx, ly: where it lies (null: swallowed or gone).
      case 'spit': return ['spit', e.snake.id, e.x, e.y, e.tx, e.ty, e.power, e.hit, e.lx, e.ly];
      // A beetle digging in (until it's under), and one going under, down a burrow or where it dug;
      // food the woodpecker knocked aside (to tx, ty; null, null: nowhere to go, so the bird ate it).
      case 'dig': return ['dig', e.x, e.y, e.until];
      case 'dive': return ['dive', e.x, e.y, e.dug ? 1 : 0];
      case 'knock': return ['knock', KINDS.indexOf(e.kind), e.x, e.y, e.tx ?? null, e.ty ?? null, e.gold ? 1 : 0, e.color || 0];
      // A burrow cracking open (dug: a dig left it), one starting to grow shut (closing over at game time `at`),
      // and one closing over (sawdust and moss fill it).
      case 'burrow': return ['burrow', e.x, e.y, e.dug ? 1 : 0];
      case 'shut': return ['shut', e.x, e.y, e.at];
      case 'heal': return ['heal', e.x, e.y];
      case 'portal': case 'through': return [e.type, e.snake.id, e.x, e.y, e.tx, e.ty, e.owner ?? e.snake.id];
      case 'portalShut': return ['portalShut', e.x, e.y, e.tx, e.ty];
      case 'spawn': return ['spawn', e.kind, e.x ?? -1, e.y ?? -1, e.gold ? 1 : 0];
      case 'weather': return ['weather', WEATHER.indexOf(e.kind)];
      case 'ember': return ['ember', e.x, e.y, e.fx, e.fy];
      case 'woodpecker': return ['woodpecker'];
      case 'peck': return ['peck', e.x, e.y, e.cells || [], e.under || []];
      case 'rot': return ['rot', e.x, e.y, e.kind === 'pellet' ? 1 : 0, e.color || 0]; // (an apple, or a bead in its colour)
      case 'flown': return ['flown', e.x, e.y];
      default: { // (the kinds SNAKE, FOOD_AT and AT list)
        const g = /** @type {any} */ (e);
        if (SNAKE.includes(e.type)) return [g.type, g.snake.id];
        if (FOOD_AT.includes(e.type)) return [g.type, g.x, g.y, KINDS.indexOf(g.kind)];
        return AT.includes(e.type) ? [g.type, g.x, g.y] : null;
      }
    }
  }

  // The renderer reads these every frame, so a malformed one could break every frame.
  /** @param {string} k @param {any} v (from outside) */
  function saneMemory(k, v) {
    if (k === 'mood' || k === 'style') return typeof v === 'string' && Object.prototype.hasOwnProperty.call(window.SnakeAI.PERSONAS, v);
    if (k === 'colonies') return Array.isArray(v) && v.length <= 64 && v.every(c => c && Number.isFinite(c.x) && Number.isFinite(c.y));
    if (k === 'home' || k === 'site') return typeof v === 'object' && Number.isFinite(v.x) && Number.isFinite(v.y);
    if (k === 'desperate') return typeof v === 'boolean';
    return Number.isFinite(v);
  }

  // Bring a guest's game up to the host's tick. Returns the snakes that died in it.
  // DIRS: the engine's direction objects (shared, so `s.dir === DIRS.up` holds).
  /** @param {Engine.Game} game @param {TickMsg} msg @param {Engine.Dirs} DIRS @returns {Engine.Snake[]} */
  function apply(game, msg, DIRS) {
    game.tick = msg.k;
    game.time = msg.ms;
    /** @param {unknown} v */
    const num = v => Number.isFinite(v);
    msg.s.forEach(([alive, dir, eaten, lastAte, nextStarve, cells, memory, autopilot, stunUntil, burnUntil, burnFrom, leaps, leapArmed, dashes, leapReadyAt, wrapUntil, flight, flashReadyAt, flashArmed, mealMs, land, airLeft, airGold, cheek, spitAt], id) => {
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
      // (In the air: on over airLeft more cells, straight on, then down at land.)
      const fd = num(flight) && flight >= 0 && num(land) && land >= 0 ? DIRS[DIR_NAMES[flight]] : null, head = cells[0], left = num(airLeft) ? Math.max(0, Math.min(8, airLeft)) : 0;
      s.flight = fd ? { dir: fd, over: Array.from({ length: left }, (_, i) => ({ x: head % 1000 + fd.x * (i + 1), y: Math.floor(head / 1000) + fd.y * (i + 1) })), land: { x: land % 1000, y: (land - land % 1000) / 1000 }, gold: airGold ? 1 : 0 } : null;
      s.flashReadyAt = num(flashReadyAt) ? flashReadyAt : 0;
      s.flashArmed = num(flashArmed) ? flashArmed : -1;
      s.mealMs = num(mealMs) && mealMs > 0 ? mealMs : s.mealMs; // (for the hunger bar)
      s.cheek = Number.isInteger(cheek) && cheek > 0 && Number.isInteger(spitAt) ? { power: Math.min(window.TUNING.SHRINK_MAX, cheek), spitAt, left: 0 } : null; // (the bulge and its ring)
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
      const f = /** @type {any} */ ({ x, y, kind: KINDS[kind] }); // (built up as it's checked)
      if (expires >= 0) f.expires = expires;
      if (color) f.color = color;
      if (f.kind === 'beetle') {
        const [dir, px, py, movedAt, scared, gold, digUntil] = /** @type {any[]} */ (more);
        Object.assign(f, { dir: DIRS[DIR_NAMES[dir]] || DIRS.right, movedAt, scared: !!scared });
        if (gold) f.gold = 1;
        if (px >= 0) { f.px = px; f.py = py; }
        if (Number.isInteger(digUntil) && digUntil >= 0) f.digUntil = digUntil; // (the renderer sinks it by this)
      } else {
        const [heat, cooked, owner, power] = more;
        if (f.kind === 'mushroom' && Number.isInteger(power) && power > 0) f.power = Math.min(window.TUNING.SHRINK_MAX, power); // (its shade)
        if (num(heat) && heat > 0) f.heat = heat;
        if (cooked) f.cooked = 1;
        if (Number.isInteger(owner) && owner >= 0) f.owner = owner;
      }
      return f;
    });
    for (const k of msg.h) game.holes.add(k);
    /** @param {unknown} v */
    const cellsOf = v => (Array.isArray(v) ? v : []).filter(k => Number.isInteger(k) && k >= 0 && k < 10000);
    /** @param {any} v */
    const cell = v => Number.isInteger(v) && v >= 0 && v < window.TUNING.GRID; // (an x or y on the board: the renderer draws or rolls a thing there)
    /** @param {any} v */
    const square = v => Number.isInteger(v) && v >= 0 && v < window.TUNING.GRID * window.TUNING.GRID; // (a cell on the board, as one number)
    const w = /** @type {any} */ (msg.w); // (from outside: checked here)
    const landings = Array.isArray(w?.[9]) ? w[9].filter(p => Array.isArray(p) && p.length === 2 && square(p[0]) && (p[1] === -1 || square(p[1]))) : []; // ([from, to]; to -1: the bird eats it)
    game.woodpecker = msg.w ? { x: w[0], y: w[1], at: w[2], target: cellsOf(w[3]), strikeAt: w[4], last: cellsOf(w[5]), struckAt: w[6], restUntil: w[7], ...(Number(w[8]) > 0 ? { pecks: Number(w[8]) } : {}), ...(landings.length ? { landings } : {}) } : null;
    game.burrows = (Array.isArray(msg.bu) ? msg.bu : []).filter(b => Array.isArray(b) && b.length >= 3 && b.every(num) && cell(b[0]) && cell(b[1]) && Number.isInteger(b[2])) // (on the board, opened on a tick)
      .map(([x, y, at, used, dug, shutFrom, shutAt]) => ({ x, y, at, ...(used >= 0 ? { used } : {}), ...(dug ? { dug: 1 } : {}), ...(shutAt > 0 && shutFrom >= 0 && shutFrom < shutAt ? { shutFrom, shutAt } : {}) })); // (the renderer draws a dug one freshly bored, and one growing shut closing)
    /** @param {any} v */
    const way = v => v === -1 || v === 0 || v === 1;
    game.portals = (Array.isArray(msg.po) ? msg.po : []).filter(p => Array.isArray(p) && p.length === 8 && p.every(num) && cell(p[0]) && cell(p[1]) && way(p[2]) && way(p[3]) && Math.abs(p[2]) + Math.abs(p[3]) === 1 && cell(p[4]) && cell(p[5]))
      .map(([x, y, dx, dy, tx, ty, owner, shutAt]) => ({ x, y, dx, dy, tx, ty, owner, shutAt }));
    game.unders = (Array.isArray(msg.un) ? msg.un : []).filter(u => Array.isArray(u) && u.every(num) && Number.isInteger(u[2]) && u[2] >= 0 && u[2] < window.TUNING.GRID * window.TUNING.GRID)
      .map(([until, expires, from, gold]) => ({ until, expires, from, gold: !!gold }));
    game.fires = new Map((Array.isArray(msg.fi) ? msg.fi : []).filter(f => Array.isArray(f) && f.every(num))
      .map(([k, from, until, strike, group]) => [k, strike === 2 ? { from, until, group, strike: false, ember: true } : { from, until, strike: !!strike, group }]));
    if (Array.isArray(msg.sky) && msg.sky.every(num)) game.weather = { kind: WEATHER[msg.sky[0]] || 'clear', since: msg.sky[1], until: msg.sky[2] };

    /** @type {Engine.Snake[]} */
    const dying = [];
    game.events = /** @type {Engine.Event[]} */ (msg.e.map(/** @returns {Engine.Event | null} */ e => {
      const snake = typeof e[1] === 'number' ? game.snakes[e[1]] : null;
      switch (e[0]) {
        case 'eat': return { type: 'eat', snake: /** @type {Engine.Snake} */ (snake), kind: KINDS[e[2]], x: e[3], y: e[4], color: e[5] || undefined, cooked: !!e[6], gold: !!e[7] };
        case 'leap': return snake ? { type: 'leap', snake, x: e[2], y: e[3], gold: e[4] ? 1 : 0, reach: Number(e[5]) || 1 } : null;
        case 'dash': return snake ? { type: 'dash', snake, x: e[2], y: e[3], n: Number(e[4]) || 1, ...(e[5] ? { plain: 1 } : {}) } : null;
        case 'death':
          if (!snake) throw new Error('death'); // (the tick can't be used: the guest waits for the next)
          Object.assign(snake, { alive: false, cause: e[2], killer: e[3], killerId: e[4], diedAt: e[5], fatal: typeof e[6] === 'string' ? e[6] : null });
          dying.push(snake);
          return { type: 'death', snake };
        case 'crash': return { type: 'crash', snake: /** @type {Engine.Snake} */ (snake), x: e[2], y: e[3], cause: String(e[4] || ''), killer: e[5], killerId: Number.isInteger(e[6]) ? e[6] : null, lost: Number(e[7]) || 0, ...(e[8] === 1 ? { failed: 1 } : {}) };
        case 'fizzle': return snake ? { type: 'fizzle', snake, why: String(e[2] || ''), x: Number(e[3]) || 0, y: Number(e[4]) || 0, flash: e[5] ? 1 : 0 } : null;
        case 'cut': return snake ? { type: 'cut', snake, x: e[2], y: e[3], lost: Number(e[4]) || 0, by: Number.isInteger(e[5]) && e[5] >= 0 ? e[5] : null } : null;
        case 'squash': return snake && e.slice(2, 4).every(cell) ? { type: 'squash', snake, x: e[2], y: e[3] } : null;
        case 'spit': { // (from a head on the board, to a cell that may be off it; lies on the board, or nowhere: both or neither)
          const lies = cell(e[8]) && cell(e[9]), near = /** @param {any} v */ v => Number.isInteger(v) && v >= -8 && v < window.TUNING.GRID + 8;
          return snake && cell(e[2]) && cell(e[3]) && near(e[4]) && near(e[5]) && Number.isInteger(e[6]) && e[6] > 0 && (lies || (e[8] === null && e[9] === null))
            ? { type: 'spit', snake, x: e[2], y: e[3], tx: e[4], ty: e[5], power: Math.min(window.TUNING.SHRINK_MAX, e[6]), hit: Number.isInteger(e[7]) && game.snakes[e[7]] ? e[7] : -1, lx: lies ? e[8] : null, ly: lies ? e[9] : null } : null;
        }
        case 'dig': return cell(e[1]) && cell(e[2]) && Number.isInteger(e[3]) ? { type: 'dig', x: e[1], y: e[2], until: e[3] } : null;
        case 'dive': return cell(e[1]) && cell(e[2]) ? { type: 'dive', x: e[1], y: e[2], ...(e[3] ? { dug: 1 } : {}) } : null;
        case 'knock': { // (where it flew: a cell on the board, or nowhere, eaten)
          const eaten = e[4] === null && e[5] === null;
          return KINDS[e[1]] && cell(e[2]) && cell(e[3]) && (eaten || (cell(e[4]) && cell(e[5]))) ? { type: 'knock', kind: KINDS[e[1]], x: e[2], y: e[3], tx: eaten ? null : e[4], ty: eaten ? null : e[5], ...(e[6] ? { gold: 1 } : {}), ...(typeof e[7] === 'string' ? { color: e[7] } : {}) } : null;
        }
        case 'burrow': return cell(e[1]) && cell(e[2]) ? { type: 'burrow', x: e[1], y: e[2], ...(e[3] ? { dug: 1 } : {}) } : null;
        case 'shut': return cell(e[1]) && cell(e[2]) && num(e[3]) ? { type: 'shut', x: e[1], y: e[2], at: e[3] } : null;
        case 'heal': return cell(e[1]) && cell(e[2]) ? { type: 'heal', x: e[1], y: e[2] } : null;
        case 'portal': case 'through': return snake && cell(e[2]) && cell(e[3]) && cell(e[4]) && cell(e[5]) ? { type: e[0], snake, x: e[2], y: e[3], tx: e[4], ty: e[5], ...(e[0] === 'through' ? { owner: Number(e[6]) } : {}) } : null;
        case 'portalShut': return cell(e[1]) && cell(e[2]) && cell(e[3]) && cell(e[4]) ? { type: 'portalShut', x: e[1], y: e[2], tx: e[3], ty: e[4] } : null;
        case 'spawn': return { type: 'spawn', kind: e[1], x: e[2], y: e[3], gold: !!e[4] };
        case 'weather': return { type: 'weather', kind: WEATHER[e[1]] || 'clear' };
        case 'ember': return { type: 'ember', x: e[1], y: e[2], fx: e[3], fy: e[4] };
        case 'woodpecker': return { type: 'woodpecker' };
        case 'peck': return { type: 'peck', x: e[1], y: e[2], cells: Array.isArray(e[3]) ? e[3].filter(Number.isInteger) : [], under: Array.isArray(e[4]) ? e[4].filter(Number.isInteger) : [] };
        case 'rot': return { type: 'rot', x: e[1], y: e[2], kind: e[3] ? 'pellet' : 'apple', ...(typeof e[4] === 'string' ? { color: e[4] } : {}) };
        case 'flown': return { type: 'flown', x: e[1], y: e[2] };
        default: { // (the kinds SNAKE, FOOD_AT and AT list)
          const g = /** @type {any} */ (e);
          if (SNAKE.includes(e[0])) return snake ? { type: g[0], snake } : null;
          if (FOOD_AT.includes(e[0])) return { type: g[0], x: g[1], y: g[2], kind: KINDS[g[3]] };
          return AT.includes(e[0]) ? { type: g[0], x: g[1], y: g[2] } : null;
        }
      }
    }).filter(Boolean));
    return dying;
  }

  return { VERSION, MAX_PEOPLE, HUMAN_COLORS, DIR_NAMES, POWERS, newCode, cleanCode, isCode, cleanName, round, tick, apply, plan, applyPlan };
})();
