function snapshot(game) {
  for (const s of game.snakes) if (s.flight) s.flight.ring = flightRing(game, s); // (where each jump in the air comes down, as its ring shows: 2y)
  game.history.push({
    snakes: game.snakes.filter(s => s.alive).map(s => ({
      id: s.id, body: s.body.map(c => ({ x: c.x, y: c.y })), dir: s.dir,
      stun: Math.max(0, s.stunUntil - game.tick), leaps: s.leaps, // (all of it shows: stars, pips, a gold outline, cough puffs...)
      step: staminaStep(game, s), // (2u: tired, awake or game on, as its look shows: never its stamina itself)
      shield: s.shieldUntil > game.time ? 1 : 0, // (2u+: a golden apple's shield, as its ring shows)
      dashes: s.dashes, wrap: Math.max(0, s.wrapUntil - game.time), air: s.flight ? s.flight.ring.n : 0, land: s.flight ? key(s.flight.ring.x, s.flight.ring.y) : -1, // (in the air: how many ticks till it's down, and where: its ring)
      spitIn: s.cheek ? s.cheek.spitAt - game.tick : 0, spitPower: s.cheek ? Math.min(T.SHRINK_MAX, s.cheek.power + 1) : 0, // (a green bulge, and its ring: it's spat after this many more moves, this strong)
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
const fireCellsSeen = snap => snap.fires.length ? (snap.fireSet ||= new Set(snap.fires)) : NO_CELLS;
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
// How many ticks late an AI sees another snake (2q): as late as a person
// would notice it, REACTION_MS near its head growing to REACTION_FAR_MS
// across the board, give or take a little that drifts from moment to moment
// (the same whenever it's asked, and in every copy of the game), so it's
// REACTION_MS near on average, as the ticks fall; never sooner than a tick.
// It drifts slowly, and what's seen of a snake never goes back in time
// (aiView). Its distance is read where the snake was a reaction time ago.
function noticeDelay(game, snake, o, tickMs) {
  const h = snake.body[0];
  let d = Infinity;
  for (const c of o.body) d = Math.min(d, Math.abs(c.x - h.x) + Math.abs(c.y - h.y));
  const u = game.tick / T.REACTION_DRIFT_TICKS, i = Math.floor(u), f = u - i;
  const jitter = noticeJitter(i, snake.id, o.id) * (1 - f) + noticeJitter(i + 1, snake.id, o.id) * f;
  const ms = T.REACTION_MS + (T.REACTION_FAR_MS - T.REACTION_MS) * Math.min(1, d / T.REACTION_FAR_CELLS) + T.REACTION_JITTER_MS * jitter;
  return Math.max(1, Math.round(ms / tickMs));
}
// (A number in [-1, 1) from a moment and the two snakes' ids, the same in every copy of the game.)
function noticeJitter(i, a, b) {
  let r = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(a + 1, 0x85ebca6b) ^ Math.imul(b + 1, 0xc2b2ae35);
  r = Math.imul(r ^ (r >>> 15), 0x27d4eb2f); r ^= r >>> 13;
  return (r >>> 0) / 0x80000000 - 1;
}
// What an AI "sees": its own body now, the other snakes as of when it would
// notice them (noticeDelay) and holes and fire as of its reaction time ago,
// like a person would; the food as it
// is now (a beetle as it is: where it is, which way it faces, when it last
// moved, and whether it's scurrying). Rivals are just ids and bodies;
// nothing says which one is human.
function aiView(game, snake) {
  const tickMs = tickLength(game), last = game.history.length - 1;
  const delay = Math.max(1, Math.round(T.REACTION_MS / tickMs));
  const idx = Math.max(0, last - delay);
  const snap = game.history[idx];
  const others = [];
  for (const o of snap.snakes) {
    if (o.id === snake.id) continue;
    // (Never an older look than the last: its head can jump, over a wrapped edge or in a flight, and with it the
    // distance; `noticed` keeps the tick of the moment it last saw each snake.)
    const at = Math.max(0, last - noticeDelay(game, snake, o, tickMs), last - game.tick + ((snake.noticed ||= {})[o.id] ?? -Infinity)), d = idx - at;
    snake.noticed[o.id] = game.tick - last + at;
    const seen = d !== 0 && game.history[at].snakes.find(l => l.id === o.id); // (none: dead since, so seen as in the rest of the view)
    // (Seen d ticks before the rest (or after, d < 0), its timers are counted on by those d ticks, so every one reads
    // as of `age` ago, as the rest of the view does, and a rival reckons where it's got to as for any snake: a stun
    // under 0 is how long it's been moving before then. Its turns since, it doesn't see.)
    // (late: how many ticks before the rest it was seen, for one who watches the snakes from moment to moment.)
    others.push(!seen ? o : {
      ...seen, late: d, stun: seen.stun - d, spitIn: seen.spitIn && seen.spitIn - d,
      air: seen.air && Math.max(1, seen.air - d), wrap: seen.wrap && Math.max(0, seen.wrap - d * tickMs), // (none stays none)
    });
  }
  return {
    grid: GRID,
    me: {
      // (its hunger, as a person sees their bar: how long till it starts shrinking, and till its next shrink)
      id: snake.id, body: snake.body, dir: snake.dir, grow: snake.grow, hungerLeft: hungerLeft(game, snake), starveIn: snake.nextStarve - game.time,
      // (its powers: golden leaps and dashes held, how long the edges still wrap for it, how long till it can jump, and flash)
      leaps: snake.leaps, dashes: snake.dashes, wrap: Math.max(0, snake.wrapUntil - game.time), leapIn: leapIn(game, snake), flashIn: flashIn(game, snake),
      // (its stamina, in ms of refill (STAMINA_MS full), golden powers held or not, as the ring round its head shows a person theirs)
      stamina: stamina(game, snake),
      // (2u+: how long its golden apple's shield still holds, ms; 0: none)
      shield: Math.max(0, snake.shieldUntil - game.time),
      // (up on a golden flight: which way, and how many cells it's flown, so it can plan where to come down as it flies)
      flight: snake.flight?.gold && snake.flight.held ? { dir: snake.flight.dir, flown: snake.flight.flown } : null,
      // (who it just met head-on, if it was in the last 3 s or so: it keeps clear of them for a while)
      bumped: snake.bumpedBy && game.tick - snake.bumpedBy.tick < 30 ? snake.bumpedBy.id : -1,
      // (a mushroom in its cheek: it's spat after this many more moves (0: none), this strong)
      spitIn: snake.cheek ? Math.max(0, snake.cheek.spitAt - game.tick) : 0, spitPower: snake.cheek ? Math.min(T.SHRINK_MAX, snake.cheek.power + 1) : 0,
    },
    others, // (each as of when I'd notice it: `age` ticks ago near my head, a little more across the board)
    food: game.food, // (as it is: it only changes on a tick, so thinking ahead sees what the tick would)
    holes: blockedSeen(game, snap),
    fire: fireCellsSeen(snap), // (among the holes: the cells that are only fire, which it can go through, at a price)
    pecks: snap.pecks.length ? (snap.peckSet ||= new Set(snap.pecks)) : NO_CELLS, // (among them too: the woodpecker's mark, not a hole yet: nothing to hop)
    // (When its strike comes, as anyone sees the bird drum it (its last blow
    // lands on the strike), and in the aim's last PECK_PROMISE_TICKS moves
    // where it promised each piece in its mark would land: the rings show
    // them to everyone.)
    strikeAt: game.woodpecker?.target.length ? game.woodpecker.strikeAt : null,
    landings: game.woodpecker?.landings || null,
    fall: game.woodpecker?.fall || null, // (2s: the pieces its mark cuts loose, shaded for everyone: they fall at the strike, food and all)
    burrows: game.burrows, // (as they are: a person sees every burrow on the board, [{ x, y, at }])
    portals: game.portals, // (round six B, part 5: the gold portals, as anyone sees them open and shutting)
    tickMs: tickLength(game),
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
// decide after that, and everyone on a tick a mushroom comes back up.
// (A stunned snake doesn't decide at all until it can move again, nor one in the air.)
const canThinkAhead = (game, s) => s.alive && (!s.isPlayer || !!s.autopilot) && game.time < s.nextStarve && s.plannedTick !== game.tick && s.stunUntil <= game.tick && !s.flight && !spitDue(game);
// (A mushroom due to come up this tick changes the board before anyone decides: see spit.)
const spitDue = game => game.snakes.some(o => o.alive && o.cheek && o.cheek.spitAt <= game.tick);
// A person's snake is handed to an AI (autopilot: a persona) when they leave.
const brainOf = s => s.autopilot || s.persona;
function thinkAhead(game, s) {
  s.planned = aiDecide(aiView(game, s), brainOf(s), s.memory);
  s.plannedTick = game.tick;
}
