// The rules of Barkstreet Snakes: no DOM, no drawing. The game (game/) and the
// headless simulator both run these files unchanged. Tuning lives in tuning.js.
//
// The engine is split into the files of engine/, by what they hold, so a
// change reads a few small files instead of one big one. They are plain
// scripts that share one scope, like render/'s: index.html loads them in the
// order below (sw.js lists them too), each sees every name the others declare
// (and the AI's, which load before them), and the last, step.js, makes
// window.SnakeEngine. So a file may call anything from inside its functions,
// but what runs as it loads (a table, a constant worked out from another) may
// use only names from itself or the files before it. The scope is the page's,
// shared with ai/, render/ and game/, so every name at a file's top must be
// unique across them all and no browser global (tools/scope-test.js checks
// both).
//
//   core.js        tuning, the grid and the occupancy stamps, snakes and a new game, the tick's length, hunger and meals
//   luck.js        the round's random draws, and each decision's own (Same seed, same game)
//   food.js        apples and filling the board with food, the food placer, eating, mushrooms' cheeks and spitting
//   roll.js        knocked food rolling: which way a head's step went, and where food goes
//   beetles.js     beetles, their burrows, their crawl and going under
//   weather.js     the weather, spells, rainbows, lightning, fire and cooking
//   pits.js        bridges over holes, and falling in
//   woodpecker.js  the woodpecker's peck: its acts, the strike, a piece cut loose, how deep it digs
//   outline.js     where it cuts: each snake's region, the floor, the outline it plans and its next peck
//   fight.js       at the floor, its fight: a tile aimed ahead of a snake, and the crash it gives
//   landings.js    where snakes in a patch land: rooms, knock-aside and the promised landings
//   portals.js     the portals a wrapping snake opens going off an edge, which anyone may follow through
//   view.js        what a snake sees (snapshot, aiView) and what it thinks ahead
//   powers.js      leaps and dashes: their paths, plans, cuts and mid-tick moves
//   crashes.js     what a crash does: recoil, stuns, the room left, bumps in the air
//   step.js        the tick, and the API (window.SnakeEngine)

const T = window.TUNING;
const GRID = T.GRID;
const CELLS = GRID * GRID;
const PLAYER_COLOR = '#4ade80';
const aiDecide = window.SnakeAI.decide; // (read as the engine loads: the tools swap it in first)

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
// wrap round for this snake (a golden mushroom), or a portal is open
// there that way (round six B, part 5: anyone may follow; see portals.js).
const wraps = (game, s) => s.wrapUntil > game.time;
const portalAt = (game, x, y, d) => game.portals.some(p => p.x === x && p.y === y && p.dx === d.x && p.dy === d.y);
function ahead(game, s, x, y, d) {
  let nx = x + d.x, ny = y + d.y;
  if (wraps(game, s) || (!inside(nx, ny) && portalAt(game, x, y, d))) { nx = (nx + GRID) % GRID; ny = (ny + GRID) % GRID; }
  return { x: nx, y: ny };
}
const WEATHER = ['clear', 'sun', 'wind', 'rain', 'storm', 'snow'];
function makeSnake(id, spawn, props) {
  const d = spawn.dir;
  const body = Array.from({ length: T.START_LENGTH }, (_, k) => ({ x: spawn.x - d.x * k, y: spawn.y - d.y * k }));
  return {
    id, body, dir: d, alive: true, grow: 0, eaten: 0, pellets: 0, lastAte: 0, ateTick: -1, nextStarve: T.HUNGER_MS, mealMs: T.HUNGER_MS, // (mealMs: how long its last meal keeps it, for the hunger bar)
    // stunUntil: the tick it moves again after a crash; burnUntil, burnFrom: on fire (from, until)
    stunUntil: -1, burnUntil: -1, burnFrom: -1,
    // Powers. leaps: golden leaps held (golden beetles); dashes: golden
    // flashes held (golden leaves); both can be held at once. restedAt:
    // when its stamina is full again (game time; see the engine's leapIn),
    // bank: what it has banked above the full bar (2u+, ms of stamina);
    // shieldUntil: its golden apple's shield holds till then (game time);
    // wrapUntil: the edges wrap round for it till then (a golden mushroom);
    // flight: while its head is in the air, { dir, over: [the cells it
    // still flies over, a tick each], land: { x, y } (where it comes down,
    // the tick after the last of them), gold: 1 for a golden jump }; leapArmed:
    // the last tick a jump it asked for waits; flashArmed: the tick a flash
    // it asked for goes (the next one it moves). cheek: a mushroom in its
    // cheek (round six B), { power: the segments it'll take next, spitAt:
    // the tick it's spat, left: the ticks it had left to wilt }, or null.
    leaps: 0, dashes: 0, restedAt: 0, bank: 0, shieldUntil: -1, wrapUntil: -1, flight: null, leapArmed: -1, flashArmed: -1, cheek: null,
    queue: [], cause: null, killer: null, killerId: null, diedAt: null, memory: {}, noticed: {}, planned: null, plannedTick: -1, ...props, // (noticed: the tick of the moment it last saw each other snake, by id: see aiView)
  };
}
const aiSnake = (id, spawn, key) => {
  const p = PERSONAS[key];
  return makeSnake(id, spawn, { name: p.name, color: p.color, persona: p, personaKey: key });
};
function pickOpponents(game, n) {
  const pool = [...POOL];
  const picks = [];
  while (picks.length < n && pool.length) picks.push(...pool.splice(Math.floor(luck(game) * pool.length), 1));
  return picks;
}
// humans: [{ name, color }] for the snakes people steer (isPlayer: driven by
// an input queue): one by default, none for an AI-only round, up to four
// online. AI snakes fill the other seats, from persona keys (random by
// default). Names are made unique, so a person called "Sniper" can't be
// mistaken for the rival of that name. season: the round's food season
// (2i: a key of SEASONS; drawn by SEASON_ODDS if not given, as the host
// draws it for everyone online). acts: when the woodpecker's acts start
// (entry 6: [watch, pecks, frenzy], ms of game time, as ?acts= pins them;
// drawn in their windows if not given, as the host draws them). seed: the
// round's own (a whole number; see luck), drawn if not given.
function createGame({ humans = null, withPlayer = true, personas = null, season = null, acts = null, seed = null } = {}) {
  const own = Number.isInteger(seed) ? seed >>> 0 : Math.floor(Math.random() * 4294967296), luckOf = { seed: own, rng: own }; // (the round's seed: as given, or drawn)
  const people = (humans || (withPlayer ? [{ name: 'Green', color: PLAYER_COLOR }] : [])).slice(0, SPAWNS.length);
  const wanted = T.OPPONENTS + 1 - people.length;
  const keys = (personas || pickOpponents(luckOf, wanted)).filter(k => Object.prototype.hasOwnProperty.call(PERSONAS, k)).slice(0, wanted);
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
    seed: luckOf.seed, rng: luckOf.rng, // (the round's luck: see luck)
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
    // portals: the portals open now (see portals.js); spits: mushrooms flying (see spit).
    portals: [], spits: [], burrows: [], unders: [], fires: new Map(), fireGroups: new Map(), fireTotals: new Map(), fireGroup: 0,
    weather: { kind: 'clear', since: 0, until: T.WEATHER_FIRST_MS, nextGust: 0, nextStrike: 0 }, weatherBag: [],
    sdApples: 0, sdAppleAt: null,
    season: null, acts: null,
  };
  game.season = Object.prototype.hasOwnProperty.call(T.SEASONS, season) ? season : drawSeason(game);
  game.acts = drawActs(game, acts);
  fillFood(game);
  snapshot(game);
  return game;
}
// A round's food season, SEASON_ODDS of each.
function drawSeason(game) {
  const odds = Object.entries(T.SEASON_ODDS);
  let r = luck(game) * odds.reduce((a, [, n]) => a + n, 0);
  for (const [k, n] of odds) if ((r -= n) < 0) return k;
  return 'normal';
}
// When the woodpecker's acts start (entry 6): { watch, pecks, frenzy }, ms
// of game time, each at a random time inside its window after the one
// before (ACT_WATCH_MS, ACT_PECKS_MS, ACT_FRENZY_MS), or as pinned (three
// rising times, ms).
function drawActs(game, pinned) {
  if (Array.isArray(pinned) && pinned.length === 3 && pinned.every((t, i) => Number.isFinite(t) && t >= 0 && (!i || t > pinned[i - 1]))) {
    return { watch: pinned[0], pecks: pinned[1], frenzy: pinned[2] };
  }
  const watch = Math.round(between(game, ...T.ACT_WATCH_MS)), pecks = watch + Math.round(between(game, ...T.ACT_PECKS_MS));
  return { watch, pecks, frenzy: pecks + Math.round(between(game, ...T.ACT_FRENZY_MS)) };
}
// How long the next tick lasts. The opening ticks ease from OPENING_TICK down
// to START_TICK, then the speed ramps gently toward MIN_TICK.
function tickLength(game) {
  if (game.tick < T.OPENING_TICKS) {
    return T.OPENING_TICK + (T.START_TICK - T.OPENING_TICK) * (game.tick / T.OPENING_TICKS);
  }
  return Math.max(T.MIN_TICK, T.START_TICK - (T.START_TICK - T.MIN_TICK) * game.time / T.RAMP_MS);
}
// The act a round is in (entry 6): 0 calm, 1 the watcher, 2 the first
// pecks, 3 the frenzy, which is sudden death.
const actOf = (game, at = game.time) => (at >= game.acts.frenzy ? 3 : at >= game.acts.pecks ? 2 : at >= game.acts.watch ? 1 : 0);
const suddenDeath = game => game.time >= game.acts.frenzy;
// How many times as fast everyone's hunger clock runs: in snow, it's cold.
const hungerRate = game => game.weather.kind === 'snow' ? T.SNOW_HUNGER : 1;
// Milliseconds until a snake starts starving (negative once it has).
// (lastAte is when it ate as the clock counts it: a meal that lasts less
// than HUNGER_MS counts as eaten that much earlier, and winter moves it on.)
const hungerLeft = (game, s) => s.lastAte + T.HUNGER_MS - game.time;
// How much of its hunger warning a snake has left, in real time: 1 or more
// before the warning, under 1 in it (0 or less once the time's up). The
// warning comes HUNGER_WARN_MS before it starts shrinking, or half again
// that before it would starve, whichever is sooner, so a snake with one
// segment to spare is warned as early as one at its smallest. Snow runs the
// clock faster, so it comes sooner by the clock. (The toast, the tag and
// the growl all read this, so they agree; and only what a guest online is
// sent: not grow, which only lengthens its life, so it's warned a little
// early then, never late. A snake of 4 in snow was once warned only 4 s
// before it starved: #327.)
const hungerWarning = (game, s, now = game.time) => {
  const rate = hungerRate(game), left = s.lastAte + T.HUNGER_MS - now;
  const end = Math.max(left, s.nextStarve - now) + (s.body.length - T.MIN_LENGTH) * T.STARVE_EVERY_MS;
  return Math.min(left / T.HUNGER_WARN_MS, end / (1.5 * T.HUNGER_WARN_MS)) / rate;
};
// How long a meal keeps a snake from shrinking: HUNGER_MS, one clock for
// the whole round (#616).
const mealLasts = game => T.HUNGER_MS * T.SEASONS[game.season].meal; // (shorter in a lean season: 2i)
// Mark every living body cell in the occupancy grid (with a fresh stamp).
function markBodies(game) {
  stamp++;
  for (const s of game.snakes) {
    if (!s.alive) continue;
    for (const c of s.body) { bodyStamp[key(c.x, c.y)] = stamp; bodyOwner[key(c.x, c.y)] = s.id; }
  }
}
