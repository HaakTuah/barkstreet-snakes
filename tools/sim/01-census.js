// How a snake died, finer than the game's killer field.
const causeOf = s => s.fatal === 'pecked' ? 'pecked' : s.fatal === 'boom' ? 'boom' : s.killer === 'self' ? 'self' : s.killer === 'hunger' ? 'starved' : s.killer === 'fire' ? 'fire'
  : /woodpecker hole/.test(s.cause) ? 'hole' : s.killer === 'wall' ? 'wall' : /cut in two/.test(s.cause) ? 'cut'
  : s.cause.startsWith('crashed') ? 'head-on' : 'body';

// What --census counts (summed over rounds; rounds: how many rounds had any;
// an array: every round's, put together).
const census = () => ({
  golden: 0, goldBeetles: 0, leaves: 0, goldcaps: 0, mushrooms: 0, strikes: 0, sun: 0, wind: 0, rain: 0, storm: 0, snow: 0,
  goldBeetleRounds: 0, leafRounds: 0, goldcapRounds: 0, stormRounds: 0, starvedEarly: 0,
  cutsPlain: 0, cutsGold: 0, cutsOwn: 0, failed: 0, failedGold: 0, edgeTicks: 0, huggers: 0, huggerWins: 0, huggerPlace: 0, others: 0, otherWins: 0, otherPlace: 0, // (round six B, the flashes cut: cuts by plain flashes and dashes, of them its own tail dropped; failed flashes (golden ones); snake-ticks with the head on the board's edge; snakes whose head was on the edge an eighth of their time or more (twice the field's 6% before part 3) ("huggers"), and the rest: how many, wins, places)
  rides: 0, rideTicks: 0, rideDeaths: 0, rideFalls: 0, // (bridges: rides begun, snake-ticks with a head on another's back over a pit, deaths while on one, and of them falls)
  hop1: 0, hop2: 0, hop3: 0, hopHole: 0, hopFail: 0, hopDie: 0, // (round six B's island hop: jumps by the cells they went over, those over a hole, those whose landing crashed, and jumpers out within 3 s of taking off)
  pecks: 0, holes: 0, aims: 0, aimsNear: 0, flashes: 0, jumps: 0, goldLeaps: 0, goldGot: 0, dashes: 0, pickups: 0, greedy: 0,
  aliveEarly: 0, hungryEarly: 0, starvingEarly: 0, aliveLate: 0, hungryLate: 0, starvingLate: 0, // (snake-ticks before and after the woodpecker: alive, in the hunger warning, starving)
  beads: 0, ownBeads: 0, chokes: 0, chokeRounds: 0, nudges: 0, nudgedBeads: 0, // (beads eaten, and by the snake they broke off; chokes; food nudged aside coughing, and the beads among it)
  knocks: 0, knockedEaten: 0, knockedTaken: 0, knockedTicks: [], digs: 0, digsCaught: 0, // (food the woodpecker's strike knocked aside, of it what it ate, with nowhere to knock it, and what a snake ate where it landed within 6 s, how many ticks after the strike; beetles digging in, and caught while digging)
  midMs: 0, mealsMid: 0, // (mid-round, from HUNGER_MID_FROM_MS to the woodpecker: snake-time alive, and meals then, a snake's in a tick counted once)
  // Each time a beetle is above ground (out of a burrow, to caught, down a
  // burrow, dug in, flown off or eaten by the bird; a round's end leaves it
  // out): all of them, and those chased (a head came within BEETLE_FEAR).
  bugs: 0, bugsCaught: 0, bugsDived: 0, bugsDug: 0, bugsFlown: 0, bugsPecked: 0,
  chases: 0, chasesCaught: 0, chasesDived: 0, chasesDug: 0, chasesFlown: 0, chasesPecked: 0, chaseTicks: [], // (chaseTicks: from a head first near to the catch)
  divesDugBurrow: 0, // (dives into a burrow a dig left)
  ticks: 0, burrowTicks: 0, ticksEarly: 0, freeEarly: 0, // (ticks, and burrows open summed over them; before the woodpecker, cells free for an apple summed over them)
  // The woodpecker's fairness: aims whose mark left a snake less room than
  // its length (timed: tails leaving), and of them, the snake out by 3 s
  // (30 ticks) after the strike; islands of one or two cells a strike cut
  // off (with food on them, a snake on them); and the rounds whose last
  // snakes ended up on islands of their own, of them how often the one on
  // the biggest won (chance: what a blind pick would get).
  seals: 0, sealedOut: 0, crumbs: 0, crumbsFood: 0, crumbsSnake: 0, split: 0, splitBiggest: 0, splitChance: 0,
  causesSD: {}, sdTimes: [],
});

// The land in sudden death, for the census: 4-connected islands of cells
// that aren't holes (comp: each cell's island, -1 a hole; sizes: each
// island's), and a snake's timed room (as the woodpecker counts it).
const land = { comp: null, q: null, sizes: [], holes: -1, free: null, seen: null, stamp: 0 };
function landArrays(N) {
  const C = N * N;
  if (!land.comp) { land.comp = new Int32Array(C); land.q = new Int32Array(C); land.free = new Int32Array(C); land.seen = new Int32Array(C); }
}
function labelLand(g, N) {
  const C = N * N;
  landArrays(N);
  const { comp, q } = land, sizes = [];
  comp.fill(-1);
  for (let k = 0; k < C; k++) {
    if (comp[k] >= 0 || g.holes.has(k)) continue;
    const id = sizes.length;
    let r = 0, w = 0;
    q[w++] = k; comp[k] = id;
    while (r < w) {
      const i = q[r++], x = i % N, y = (i - x) / N;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = x + dx, ny = y + dy, ni = ny * N + nx;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || comp[ni] >= 0 || g.holes.has(ni)) continue;
        comp[ni] = id; q[w++] = ni;
      }
    }
    sizes.push(w);
  }
  land.sizes = sizes;
  land.holes = g.holes.size;
}
function timedRoom(g, N, s, shut, need) {
  landArrays(N);
  const { free, seen, q } = land, st = ++land.stamp, h0 = s.body[0].y * N + s.body[0].x;
  seen[h0] = st; q[0] = h0;
  let r = 0, w = 1, n = 0;
  for (let d = 1; r < w && n < need; d++) {
    const end = w;
    while (r < end) {
      const i = q[r++], x = i % N, y = (i - x) / N;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = x + dx, ny = y + dy, ni = ny * N + nx;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || seen[ni] === st || free[ni] > d || (shut && shut.has(ni))) continue;
        seen[ni] = st; n++; q[w++] = ni;
      }
    }
  }
  return n;
}
// Cells an apple could drop on: no body, hole, food, burrow, fire or the woodpecker's mark.
function freeCells(g, N) {
  landArrays(N);
  const { seen } = land, st = ++land.stamp;
  let used = 0;
  const take = k => { if (seen[k] !== st) { seen[k] = st; used++; } };
  for (const s of g.snakes) if (s.alive) for (const c of s.body) take(c.y * N + c.x);
  for (const k of g.holes) take(k);
  for (const f of g.food) take(f.y * N + f.x);
  for (const b of g.burrows) take(b.y * N + b.x);
  for (const k of g.fires.keys()) take(k);
  if (g.woodpecker) for (const k of g.woodpecker.target) take(k);
  return N * N - used;
}
function timedGrid(g, N) {
  landArrays(N);
  const { free } = land;
  free.fill(0);
  for (const k of g.holes) free[k] = 1 << 30;
  for (const s of g.snakes) {
    if (!s.alive) continue;
    const L = s.body.length, extra = Math.max(0, s.stunUntil - g.tick) + Math.max(0, s.grow);
    s.body.forEach((c, j) => { const k = c.y * N + c.x; free[k] = Math.max(free[k], L - j + extra); });
  }
}
const totals = () => ({ rounds: 0, timeSum: 0, times: [], sudden: 0, draws: 0, stalled: 0, trace: [], beetles: 0, caught: 0, flown: 0, causes: {}, crashes: 0, alight: 0, cuts: 0, baked: 0, ash: 0, rot: 0, rotBeads: 0, census: census() });

// What --signatures measures, per snake (summed over its ticks and rounds;
// each trademark is read against everyone else's, the field):
//   moves, runs        moves made, and runs of them the same way (Mason: long straight runs)
//   cells, beside      body cells, and those lying beside another part of the same body (Mason's thick walls)
//   long, coiled       ticks 10 or more long, and of those, with the head within 3 of its own tail (Ouroboros)
//   riding             ticks with the head within 2 of the tail end of a rival 8 or longer (Creeper)
//   apart              distance from the nearest rival head, summed over ticks (capped at 14: Ghost)
//   foodShare, beadShare  its share of the round's food eaten, and of the beads (summed over rounds: Gobbler, Vulture)
//   homeTicks, atHome  ticks with a realm, and of those, the head on it (Sovereign)
//   hunting, boxing    ticks with a target, and of those, closing the box: the target's head within 4 of its own (Mute: the rule its mood ring shows)
//   luring             ticks with a rival head 2 to 4 away: just out of its reach, close enough to follow (Joker)
//   skims              ticks with the head beside the edge, a hole or a body (not its own neck), or a rival head within 2 (Desperado)
//   flashes, jumps     plain and golden flashes, and jumps of both kinds (Star: a minute alive)
//   eats, beadsEaten   food eaten, and of it beads (Gobbler and Vulture by the minute, for Capricious's impressions of them)
const SIGNS = ['moves', 'runs', 'cells', 'beside', 'long', 'coiled', 'riding', 'apart', 'foodShare', 'beadShare', 'homeTicks', 'atHome', 'hunting', 'boxing', 'luring', 'skims', 'flashes', 'jumps', 'eats', 'beadsEaten', 'ticks'];

// Capricious in a mood: its signatures count for it, and again under the
// mood's name ('mason.runs'...), so each impression's trademark can be read
// against the rival's own. (twin: its sums, as one object that adds to both.)
const twins = new WeakMap();
function twin(sig, mood) {
  let byMood = twins.get(sig);
  if (!byMood) twins.set(sig, byMood = new Map());
  let t = byMood.get(mood);
  if (!t) {
    t = {};
    for (const k of SIGNS) Object.defineProperty(t, k, { get: () => sig[k], set: v => { sig[`${mood}.${k}`] = (sig[`${mood}.${k}`] || 0) + v - sig[k]; sig[k] = v; } });
    byMood.set(mood, t);
  }
  return t;
}
const sigOf = (per, s) => s.memory.mood ? twin(per[s.name].sig, s.memory.mood) : per[s.name].sig;

// Takes one tick's signatures, after the step (was: each snake's head and
// heading before it, and whether it has moved yet this round; brought up to date).
function signatures(g, T, per, was) {
  const N = T.GRID, mark = signatures.mark ||= new Int32Array(N * N);
  const stampOf = () => (signatures.stamp = (signatures.stamp || 0) + 1);
  const alive = g.snakes.filter(s => s.alive);
  const all = stampOf(); // (every living body's cells, for the skims)
  for (const s of alive) for (const c of s.body) mark[c.y * N + c.x] = all;
  const bodyAt = (x, y) => x >= 0 && y >= 0 && x < N && y < N && mark[y * N + x] === all;
  for (const s of alive) {
    const p = sigOf(per, s), h = s.body[0], L = s.body.length;
    const w = was[s.id];
    p.ticks++;
    if (h.x !== w.x || h.y !== w.y) { p.moves++; if (s.dir.x !== w.dir.x || s.dir.y !== w.dir.y || !w.moved) p.runs++; w.moved = true; }
    w.x = h.x; w.y = h.y; w.dir = s.dir;
    // Lying beside itself: a cell with another of its own (not the one before or after it) beside it.
    const index = signatures.index ||= new Int32Array(N * N), own = stampOf();
    s.body.forEach((c, j) => { mark[c.y * N + c.x] = own; index[c.y * N + c.x] = j; });
    s.body.forEach((c, j) => {
      p.cells++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = c.x + dx, y = c.y + dy, i = y * N + x;
        if (x >= 0 && y >= 0 && x < N && y < N && mark[i] === own && Math.abs(index[i] - j) > 1) { p.beside++; break; }
      }
    });
    for (const c of s.body) mark[c.y * N + c.x] = all; // (back to everyone's)
    if (L >= 10) { p.long++; if (Math.abs(h.x - s.body[L - 1].x) + Math.abs(h.y - s.body[L - 1].y) <= 3) p.coiled++; }
    let nearest = 14, lure = false, ride = false;
    for (const o of alive) {
      if (o === s) continue;
      const oh = o.body[0], d = Math.abs(oh.x - h.x) + Math.abs(oh.y - h.y), t = o.body[o.body.length - 1];
      nearest = Math.min(nearest, d);
      if (d >= 2 && d <= 4) lure = true;
      if (o.body.length >= 8 && Math.abs(t.x - h.x) + Math.abs(t.y - h.y) <= 2) ride = true;
    }
    p.apart += nearest;
    if (lure) p.luring++;
    if (ride) p.riding++;
    let skim = nearest <= 2;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = h.x + dx, y = h.y + dy;
      if (L > 1 && x === s.body[1].x && y === s.body[1].y) continue;
      if (x < 0 || y < 0 || x >= N || y >= N || g.holes.has(y * N + x) || bodyAt(x, y)) skim = true;
    }
    if (skim) p.skims++;
    const home = s.memory.home;
    if (home) { p.homeTicks++; if (Math.hypot(h.x - home.x, h.y - home.y) <= home.radius + T.LAND_REACH) p.atHome++; }
    const victim = s.memory.victimId != null && g.snakes.find(o => o.id === s.memory.victimId);
    if (victim && victim.alive) {
      p.hunting++;
      const vh = victim.body[0];
      if (Math.abs(vh.x - h.x) + Math.abs(vh.y - h.y) <= 4) p.boxing++;
    }
  }
  for (const e of g.events) {
    if (e.type === 'dash') sigOf(per, e.snake).flashes++;
    else if (e.type === 'leap') sigOf(per, e.snake).jumps++;
    else if (e.type === 'eat' && e.snake) { const p = sigOf(per, e.snake); p.eats++; if (e.kind === 'pellet') p.beadsEaten++; }
  }
}

// --census, after a tick: how each beetle that was above ground (before:
// those there before the tick) left it, and the ones come up.
function beetleCensus(g, c, st, before) {
  const at = (e, f) => e.x === f.x && e.y === f.y;
  for (const f of before) {
    if (g.food.includes(f)) continue;
    const b = st.bugs.get(f);
    st.bugs.delete(f);
    if (!b) continue;
    let how = null;
    for (const e of g.events) {
      if (e.type === 'eat' && e.kind === 'beetle' && at(e, f)) how = 'Caught';
      else if (e.type === 'dive' && at(e, f)) how = e.dug ? 'Dug' : 'Dived';
      else if (e.type === 'flown' && at(e, f)) how = 'Flown';
      else if (e.type === 'knock' && e.kind === 'beetle' && e.tx == null && at(e, f)) how = 'Pecked';
      if (how) break;
    }
    if (!how) continue;
    c.bugs++; c['bugs' + how]++;
    if (how === 'Caught' && f.digUntil > 0) c.digsCaught++;
    if (b.near < 0) continue;
    c.chases++; c['chases' + how]++;
    if (how === 'Caught') c.chaseTicks.push(g.tick - 1 - b.near);
  }
  for (const f of g.food) if (f.kind === 'beetle' && !st.bugs.has(f)) st.bugs.set(f, { near: -1 });
  for (const e of g.events) {
    if (e.type === 'dig') c.digs++;
    else if (e.type === 'dive' && !e.dug && g.burrows.some(h => at(e, h) && h.dug)) c.divesDugBurrow++;
  }
}

// --census, after a tick: what the woodpecker did, fairly or not (see census).
function woodpeckerCensus(g, c, st, dying, N) {
  const landed = st.landed ||= new Map(); // (where each piece the strike knocked aside landed: the strike's tick; a beetle runs on, so it's left out)
  for (const e of g.events) {
    if (e.type === 'knock') { c.knocks++; if (e.tx == null) c.knockedEaten++; else if (e.kind !== 'beetle') landed.set(e.ty * N + e.tx, g.tick - 1); }
    else if ((e.type === 'eat' || e.type === 'rot') && landed.has(e.y * N + e.x)) {
      const after = g.tick - 1 - landed.get(e.y * N + e.x);
      if (e.type === 'eat' && after <= 60) { c.knockedTaken++; c.knockedTicks.push(after); }
      landed.delete(e.y * N + e.x);
    }
    else if (e.type === 'aim') {
      timedGrid(g, N);
      const mark = new Set(g.woodpecker.target);
      for (const s of g.snakes) {
        if (!s.alive) continue;
        const need = s.body.length + Math.max(0, s.grow);
        if (timedRoom(g, N, s, null, need) < need) continue; // (shut in already: not the mark's doing)
        if (timedRoom(g, N, s, mark, need) < need) { c.seals++; st.sealed.push([s.id, g.woodpecker.strikeAt]); }
      }
    } else if (e.type === 'peck') {
      labelLand(g, N);
      const { comp, sizes } = land, foodAt = new Set(g.food.map(f => f.y * N + f.x)), bodyAt = new Set(g.snakes.filter(s => s.alive).flatMap(s => s.body.map(b => b.y * N + b.x)));
      const crumbs = new Set();
      for (const k of e.cells) for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const x = k % N + dx, y = Math.floor(k / N) + dy;
        if (x < 0 || y < 0 || x >= N || y >= N || comp[y * N + x] < 0 || sizes[comp[y * N + x]] > 2) continue;
        crumbs.add(comp[y * N + x]);
      }
      for (const id of crumbs) {
        const cells = []; for (let k = 0; k < N * N; k++) if (comp[k] === id) cells.push(k);
        c.crumbs++;
        if (cells.some(k => foodAt.has(k))) c.crumbsFood++;
        if (cells.some(k => bodyAt.has(k))) c.crumbsSnake++;
      }
    }
  }
  for (const s of dying) { // (shut in by a mark, and out by 3 s after its strike)
    if (!st.sealed.some(([id, at]) => id === s.id && g.tick - 1 <= at + 30)) continue;
    c.sealedOut++;
    st.sealed = st.sealed.filter(([id]) => id !== s.id);
  }
  // The last snakes, each on an island of its own: the first time it's so.
  const alive = g.snakes.filter(s => s.alive);
  if (!st.split && g.woodpecker && alive.length >= 2) {
    if (land.holes !== g.holes.size) labelLand(g, N);
    const ids = alive.map(s => land.comp[s.body[0].y * N + s.body[0].x]);
    if (ids.every(i => i >= 0) && new Set(ids).size === ids.length) st.split = { n: alive.length, size: Object.fromEntries(alive.map((s, i) => [s.id, land.sizes[ids[i]]])) };
  }
}
