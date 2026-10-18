#!/usr/bin/env node
// Headless balance check. Plays AI-only rounds with the game's own rules and
// AI (tuning.js, ai.js and engine.js, loaded unchanged) and prints how each
// personality did. Needs only Node. It's gentle on the machine by default:
// half the cores, at below-normal priority (whoever's using the computer
// comes first), one run at a time across the machine (a second run waits
// its turn), and a seeded round already played with the same files and
// options is read back from a cache instead of played again (round by
// round: 600 rounds after 200 plays only the 400 new ones).
//
//   node tools/simulate.js [rounds] [--seed N] [--ahead] [--check] [--json] [--census] [--signatures] [--root DIR]
//                          [--save-at MS [--save FILE]] [--from FILE] [--per-round] [--workers N] [--fresh] [--no-wait]
//
//   rounds    how many rounds (default 200)
//   --seed N  a fixed random seed, so a run can be repeated exactly (each round
//             has its own seed, so it doesn't matter how many cores you have)
//   --ahead   let every AI decide during the frames before its tick, the way
//             the browser does; with the same seed the rounds must come out
//             identical to a run without it
//   --check   fail (exit 1) if a round stalls, or a personality never wins
//   --json    print the raw totals instead of the table
//   --census  also print what a round holds: golden things, weather and
//             lightning, the woodpecker (and any aim it had to make near a
//             head), the powers used, how sudden death goes, and how hungry
//             snakes are before the woodpecker comes and after, and the
//             beads: how many were eaten (and how many by the snake they
//             broke off), how often a snake choked on its own, and what it
//             nudged aside coughing
//   --signatures  also print each personality's trademark, measured on
//             every snake so each has the field to stand against: Mason's
//             straight runs and its body lying beside itself, Ouroboros's
//             coils, Creeper riding tails, Ghost's distance, Gobbler's share
//             of the food and Vulture's of the beads, Sovereign at home,
//             Mute boxing its target, Joker's lures, Desperado's skims and
//             Star's powers (see SIGNS)
//   --root    play another copy of the game (to compare versions)
//   --save-at MS  fast-forward: play each round only to game time MS (2:00,
//             when the woodpecker comes, is 120000) and store it as it stands
//             then, the game and where its random numbers had got to (a round
//             over before then is stored whole). Needs --seed. The rounds are
//             kept with the cache (its file is printed; again with the same
//             files only new rounds are played); --save FILE copies them there
//   --from FILE  go on with the rounds stored in FILE (all of them, or the
//             first `rounds`), under this copy's files (--root): with the
//             files that stored them, every round comes out exactly as played
//             straight through; with others, they play the rest of the round
//             their way. The numbers are the whole round's (the part before
//             the save is the same for every copy). A study of the late game
//             (sudden death, say) needn't play the openings again
//   --per-round  with --json, each round's own numbers too (rounds, in order: what tools/abtest.js pairs)
//   --workers N  how many cores to use (default: half of them; or SIM_WORKERS)
//   --fresh   play it even if the cache has it
//   --no-wait don't wait for another run on the machine to finish
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const State = require('./snapshots/state.js');

// (Workers don't see the command line, so the root travels with each job.)
const argRoot = process.argv.indexOf('--root');
const ROOT = isMainThread ? (argRoot > 0 ? path.resolve(process.argv[argRoot + 1]) : path.join(__dirname, '..')) : workerData.root;
const MAX_TIME = 600000; // a round still going after 10 minutes counts as stalled
const GAME_FILES = ['tuning.js', 'ai.js', 'engine.js'];

// mulberry32: a small, fast seeded random number generator. (state(): where
// it's got to; seeded(that) goes on from there.)
function seeded(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.state = () => a;
  return next;
}

// The game's files in a fresh context, with our own Math.random.
// Math.random draws from `rng`, which can be reseeded for every round.
let rng = Math.random;
function loadGame(files = GAME_FILES) {
  const M = Object.create(Math);
  M.random = () => rng();
  const ctx = vm.createContext({ window: {}, console, Math: M });
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return { E: ctx.window.SnakeEngine, T: ctx.window.TUNING, ctx };
}

// How a snake died, finer than the game's killer field.
const causeOf = s => s.fatal === 'pecked' ? 'pecked' : s.fatal === 'boom' ? 'boom' : s.killer === 'self' ? 'self' : s.killer === 'hunger' ? 'starved' : s.killer === 'fire' ? 'fire'
  : /woodpecker hole/.test(s.cause) ? 'hole' : s.killer === 'wall' ? 'wall' : /cut in two/.test(s.cause) ? 'cut'
  : s.cause.startsWith('crashed') ? 'head-on' : 'body';

// What --census counts (summed over rounds; rounds: how many rounds had any).
const census = () => ({
  golden: 0, goldBeetles: 0, leaves: 0, goldcaps: 0, mushrooms: 0, strikes: 0, sun: 0, wind: 0, rain: 0, storm: 0, snow: 0,
  goldBeetleRounds: 0, leafRounds: 0, goldcapRounds: 0, stormRounds: 0, starvedEarly: 0,
  pecks: 0, holes: 0, aims: 0, aimsNear: 0, flashes: 0, jumps: 0, goldLeaps: 0, goldGot: 0, dashes: 0, pickups: 0, greedy: 0,
  aliveEarly: 0, hungryEarly: 0, starvingEarly: 0, aliveLate: 0, hungryLate: 0, starvingLate: 0, // (snake-ticks before and after the woodpecker: alive, in the hunger warning, starving)
  beads: 0, ownBeads: 0, chokes: 0, chokeRounds: 0, nudges: 0, nudgedBeads: 0, // (beads eaten, and by the snake they broke off; chokes; food nudged aside coughing, and the beads among it)
  causesSD: {}, sdTimes: [],
});
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
const SIGNS = ['moves', 'runs', 'cells', 'beside', 'long', 'coiled', 'riding', 'apart', 'foodShare', 'beadShare', 'homeTicks', 'atHome', 'hunting', 'boxing', 'luring', 'skims', 'flashes', 'jumps', 'ticks'];

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
    const p = per[s.name].sig, h = s.body[0], L = s.body.length;
    const w = was[s.id];
    p.ticks++;
    if (h.x !== w.x || h.y !== w.y) { p.moves++; if (s.dir !== w.dir || !w.moved) p.runs++; w.moved = true; }
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
    if (e.type === 'dash') per[e.snake.name].sig.flashes++;
    else if (e.type === 'leap') per[e.snake.name].sig.jumps++;
  }
}

// Plays round r of the run, from its own seed, to its end; or goes on with
// one stored part way (saved: see --save-at). With saveAt, it stops at that
// game time instead and hands back the round as it stands (st, its own
// numbers so far among it, and where the random numbers had got to).
// A round's numbers are { per, total }, as merge() adds them up.
function playRound(E, T, r, { seed, ahead, signs, saveAt }, saved) {
  // (Is any living head within the woodpecker's clearance of cell k?)
  const nearHead = (g, k) => g.snakes.some(s => s.alive && Math.abs(s.body[0].x - k % T.GRID) + Math.abs(s.body[0].y - Math.floor(k / T.GRID)) <= T.PECK_CLEARANCE);
  let st;
  if (saved) {
    st = saved.st;
    rng = seeded(saved.rng);
  } else {
    rng = seed == null ? Math.random : seeded(seed + r * 7919);
    const g = E.createGame({ withPlayer: false }), per = {}, total = totals();
    total.rounds = 1;
    for (const s of g.snakes) {
      per[s.name] ||= {
        rounds: 0, wins: 0, placeSum: 0, eaten: 0, pellets: 0, beetles: 0, kills: 0, aliveMs: 0, deaths: {},
        ...(signs ? { sig: Object.fromEntries(SIGNS.map(k => [k, 0])) } : {}),
      };
      per[s.name].rounds++;
    }
    st = {
      g, per, total, trace: 0,
      was: g.snakes.map(s => ({ x: s.body[0].x, y: s.body[0].y, dir: s.dir, moved: false })), // (for --signatures)
      place: new Map(),
      seen: new Set(), picked: g.snakes.map(() => 0), // (what this round had; golden power food each snake ate)
    };
  }
  const { g, per, total, was, place, seen, picked } = st, c = total.census;
  let trace = st.trace;
  while (g.snakes.some(s => s.alive) && g.snakes.filter(s => s.alive).length > 1 && g.time < MAX_TIME) {
    if (saveAt != null && g.time >= saveAt) { st.trace = trace; return { r, state: { rng: rng.state(), st } }; }
    // In order, stopping at the first snake that must decide in the tick, so
    // the random numbers are drawn in the same order as without --ahead.
    if (ahead) for (const s of g.snakes) { if (!s.alive) continue; if (!E.canThinkAhead(g, s)) break; E.thinkAhead(g, s); }
    const held = g.snakes.map(s => s.leaps), late = E.suddenDeath(g);
    for (const s of g.snakes) if (s.alive) { const left = E.hungerLeft(g, s); c[late ? 'aliveLate' : 'aliveEarly']++; if (left < T.HUNGER_WARN_MS) c[late ? 'hungryLate' : 'hungryEarly']++; if (left < 0) c[late ? 'starvingLate' : 'starvingEarly']++; }
    const dying = E.step(g);
    if (signs) signatures(g, T, per, was);
    for (const e of g.events) {
      if (e.type === 'spawn' && e.kind === 'beetle') { total.beetles++; if (e.gold) { c.goldBeetles++; seen.add('goldBeetle'); } }
      else if (e.type === 'eat' && e.kind === 'beetle') { total.caught++; per[e.snake.name].beetles++; }
      else if (e.type === 'flown') total.flown++;
      else if (e.type === 'crash') total.crashes++;
      else if (e.type === 'alight') total.alight++;
      else if (e.type === 'cut') total.cuts++;
      else if (e.type === 'baked') total.baked++;
      else if (e.type === 'ash') total.ash++;
      else if (e.type === 'rot') { if (e.kind === 'pellet') total.rotBeads++; else total.rot++; }
      // (the rest only for --census)
      else if ((e.type === 'spawn' && e.kind === 'golden') || e.type === 'rainbow') c.golden++;
      else if (e.type === 'spawn') { c[e.kind === 'leaf' ? 'leaves' : 'goldcaps']++; seen.add(e.kind); }
      else if (e.type === 'weather' && e.kind !== 'clear') { c[e.kind]++; seen.add(e.kind); }
      else if (e.type === 'strike') c.strikes++;
      else if (e.type === 'peck') c.pecks++;
      else if (e.type === 'aim') { c.aims++; if (g.woodpecker.target.some(k => nearHead(g, k))) c.aimsNear++; }
      else if (e.type === 'leap') { if (e.gold) c.goldLeaps++; else c.jumps++; }
      else if (e.type === 'dash') { if (e.plain) c.flashes++; else c.dashes++; }
      if (e.type === 'choke') { c.chokes++; seen.add('choke'); }
      else if (e.type === 'nudge') { c.nudges++; if (e.kind === 'pellet') c.nudgedBeads++; }
      if (e.type === 'eat') {
        if (e.kind === 'pellet') { c.beads++; if (e.own) c.ownBeads++; }
        if (e.kind === 'mushroom') c.mushrooms++;
        if (e.gold || e.kind === 'leaf' || e.kind === 'goldcap') picked[e.snake.id]++;
      }
    }
    // (golden leaps got: what's held now, and spent this tick, over what was held)
    for (const s of g.snakes) c.goldGot += Math.max(0, s.leaps + g.events.filter(e => e.type === 'leap' && e.gold && e.snake === s).length - held[s.id]);
    const left = g.snakes.filter(s => s.alive).length;
    for (const s of dying) {
      place.set(s, left + 1);
      per[s.name].aliveMs += g.time;
      const cause = causeOf(s);
      per[s.name].deaths[cause] = (per[s.name].deaths[cause] || 0) + 1;
      total.causes[cause] = (total.causes[cause] || 0) + 1;
      if (E.suddenDeath(g)) c.causesSD[cause] = (c.causesSD[cause] || 0) + 1;
      if (cause === 'starved' && g.time < 60000) seen.add('starvedEarly');
      const killer = g.snakes.find(o => o.name === s.killer && o !== s);
      if (killer) per[killer.name].kills++;
    }
    // A cheap fingerprint of every move, to compare runs exactly.
    for (const s of g.snakes) if (s.alive) trace = (trace * 31 + s.body[0].x * 24 + s.body[0].y + g.tick) % 1000000007;
  }
  total.trace.push([r, trace]);
  const alive = g.snakes.filter(s => s.alive);
  if (g.time >= MAX_TIME) total.stalled++;
  else if (alive.length === 1) { per[alive[0].name].wins++; place.set(alive[0], 1); }
  else total.draws++;
  const food = g.snakes.reduce((n, s) => n + s.eaten, 0), beads = g.snakes.reduce((n, s) => n + s.pellets, 0);
  for (const s of g.snakes) {
    const p = per[s.name];
    p.placeSum += place.get(s) || 1;
    p.eaten += s.eaten;
    p.pellets += s.pellets;
    if (s.alive) p.aliveMs += g.time;
    if (signs) { p.sig.foodShare += s.eaten / Math.max(1, food); p.sig.beadShare += s.pellets / Math.max(1, beads); }
  }
  total.timeSum += g.time;
  total.times.push(g.time);
  if (E.suddenDeath(g)) { total.sudden++; c.sdTimes.push(g.time - T.SUDDEN_DEATH_MS); c.holes += g.holes.size; }
  for (const k of ['goldBeetle', 'leaf', 'goldcap', 'storm', 'starvedEarly', 'choke']) if (seen.has(k)) c[k === 'starvedEarly' ? k : k + 'Rounds']++;
  for (const n of picked) { c.pickups += n; if (n > 2) c.greedy++; }
  return { r, result: { per, total } };
}

// Adds rounds' numbers up (in round order, so the table's order and the
// fingerprint are the same whatever the cores, or the cache, did).
function merge(results, suddenAt) {
  const per = {}, total = totals();
  for (const r of results) {
    for (const k of ['rounds', 'timeSum', 'sudden', 'draws', 'stalled', 'beetles', 'caught', 'flown', 'crashes', 'alight', 'cuts', 'baked', 'ash', 'rot', 'rotBeads']) total[k] += r.total[k];
    total.times.push(...r.total.times);
    total.trace.push(...r.total.trace);
    for (const [c, n] of Object.entries(r.total.causes)) total.causes[c] = (total.causes[c] || 0) + n;
    for (const [k, v] of Object.entries(r.total.census)) {
      if (k === 'sdTimes') total.census.sdTimes.push(...v);
      else if (k === 'causesSD') for (const [c, n] of Object.entries(v)) total.census.causesSD[c] = (total.census.causesSD[c] || 0) + n;
      else total.census[k] += v;
    }
    for (const [name, p] of Object.entries(r.per)) {
      const t = (per[name] ||= { deaths: {} });
      for (const [k, v] of Object.entries(p)) {
        if (k === 'deaths' || k === 'sig') for (const [d, n] of Object.entries(v)) (t[k] ||= {})[d] = (t[k][d] || 0) + n;
        else t[k] = (t[k] || 0) + v;
      }
    }
  }
  // One fingerprint for the whole run, in round order.
  total.trace = total.trace.sort((a, b) => a[0] - b[0]).reduce((h, [, t]) => (h * 131 + t) % 1000000007, 7);
  return { per, total, suddenAt };
}

function report({ per, total, suddenAt }, withCensus) {
  const pct = (a, b) => Math.round(100 * a / Math.max(1, b));
  const times = total.times.sort((a, b) => a - b);
  const sec = ms => `${Math.round(ms / 1000)}s`;
  console.log(`${total.rounds} rounds · length median ${sec(times[times.length >> 1])}, middle half ${sec(times[times.length >> 2])}-${sec(times[(times.length * 3) >> 2])}`
    + ` · ${pct(total.sudden, total.rounds)}% reached the woodpecker (${sec(suddenAt)}) · draws ${total.draws} · stalled ${total.stalled}`);
  const each = n => (n / Math.max(1, total.rounds)).toFixed(1);
  console.log(`a round: ${each(total.crashes)} crashes survived, ${each(total.alight)} snakes set alight, ${each(total.cuts)} cut by a dash · food: ${each(total.baked)} baked, ${each(total.ash)} to ash, ${each(total.rot)} apples and ${each(total.rotBeads)} beads rotted`);
  if (total.beetles) console.log(`beetles: ${(total.beetles / total.rounds).toFixed(1)} a round, ${pct(total.caught, total.beetles)}% caught, ${pct(total.flown, total.beetles)}% flew off`);
  const deaths = Object.values(total.causes).reduce((a, b) => a + b, 0);
  console.log('deaths: ' + Object.entries(total.causes).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${pct(n, deaths)}%`).join(', ')
    + ` · into holes: ${((total.causes.hole || 0) / Math.max(1, total.sudden)).toFixed(2)} per woodpecker round`);
  console.log(`fingerprint ${total.trace}`);
  if (withCensus) {
    const c = total.census, R = Math.max(1, total.rounds), sd = Math.max(1, total.sudden), a = n => (n / R).toFixed(2), of = n => `${pct(n, R)}%`;
    const snakeRounds = Object.values(per).reduce((n, p) => n + p.rounds, 0), minutes = Object.values(per).reduce((n, p) => n + p.aliveMs, 0) / 60000;
    const sdTimes = c.sdTimes.sort((x, y) => x - y), sdDeaths = Object.values(c.causesSD).reduce((x, y) => x + y, 0);
    console.log(`a round holds: golden apples ${a(c.golden)}, golden beetles ${a(c.goldBeetles)} (in ${of(c.goldBeetleRounds)} of rounds), golden leaves ${a(c.leaves)} (${of(c.leafRounds)}), golden mushrooms ${a(c.goldcaps)} (${of(c.goldcapRounds)}), mushrooms eaten ${a(c.mushrooms)}, lightning ${a(c.strikes)}`
      + ` · weather: sun ${a(c.sun)}, wind ${a(c.wind)}, rain ${a(c.rain)}, storms ${a(c.storm)} (in ${of(c.stormRounds)} of rounds), snow ${a(c.snow)}`);
    console.log(`sudden death: median ${sec(sdTimes[sdTimes.length >> 1] || 0)}, middle half ${sec(sdTimes[sdTimes.length >> 2] || 0)}-${sec(sdTimes[(sdTimes.length * 3) >> 2] || 0)} · the woodpecker strikes ${(c.pecks / sd).toFixed(1)} times, ${Math.round(c.holes / sd)} holes at the end`
      + ` · aims near a head (no spot clear of every head): ${c.aimsNear} of ${c.aims} · deaths: ` + Object.entries(c.causesSD).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${pct(n, sdDeaths)}%`).join(', '));
    console.log(`powers: ${(c.flashes / Math.max(1, minutes)).toFixed(1)} plain flashes a minute alive, ${a(c.jumps)} plain jumps a round, golden leaps ${pct(c.goldLeaps, c.goldGot)}% used, ${a(c.dashes)} dashes`
      + ` · golden power food: ${(c.pickups / Math.max(1, snakeRounds)).toFixed(2)} a snake a round (more than 2: ${pct(c.greedy, snakeRounds)}%) · a starvation before 1:00 in ${of(c.starvedEarly)} of rounds`);
    const share = (n, d) => (100 * n / Math.max(1, d)).toFixed(1) + '%';
    console.log(`hunger: before the woodpecker, ${share(c.hungryEarly, c.aliveEarly)} of snake-time in the hunger warning (${share(c.starvingEarly, c.aliveEarly)} starving); after, ${share(c.hungryLate, c.aliveLate)} (${share(c.starvingLate, c.aliveLate)})`);
    console.log(`beads: ${a(c.beads)} eaten a round, ${share(c.ownBeads, c.beads)} of them by the snake they broke off · chokes ${a(c.chokes)} a round (in ${of(c.chokeRounds)} of rounds), food nudged aside coughing ${a(c.nudges)} (beads ${a(c.nudgedBeads)})`);
  }
  console.table(Object.entries(per).map(([name, p]) => ({
    name,
    rounds: p.rounds,
    'win%': pct(p.wins, p.rounds),
    place: +(p.placeSum / p.rounds).toFixed(2),
    food: +(p.eaten / p.rounds).toFixed(1),
    'meat%': pct(p.pellets, p.eaten),
    beetles: +(p.beetles / p.rounds).toFixed(2),
    kills: +(p.kills / p.rounds).toFixed(2),
    alive: sec(p.aliveMs / p.rounds),
    'self/wall%': pct((p.deaths.self || 0) + (p.deaths.wall || 0), p.rounds),
    'starved%': pct(p.deaths.starved || 0, p.rounds),
  })).sort((a, b) => b['win%'] - a['win%'] || a.place - b.place));
}

// --signatures: each trademark as a ratio of two sums (see SIGNS), for one
// personality and for the field (everyone else together).
const TRADEMARKS = [
  ['Mason', 'straight run', 'moves', 'runs', 1], ['Mason', 'body beside itself', 'beside', 'cells', '%'],
  ['Ouroboros', 'coiled (10 long or more)', 'coiled', 'long', '%'], ['Creeper', 'riding a tail', 'riding', 'ticks', '%'],
  ['Ghost', 'cells from the nearest head', 'apart', 'ticks', 1], ['Gobbler', 'share of the food', 'foodShare', 'rounds', '%'],
  ['Vulture', 'share of the beads', 'beadShare', 'rounds', '%'], ['Sovereign', 'at home', 'atHome', 'homeTicks', '%'],
  ['Mute', 'closing the box (its target within 4, of ticks hunting)', 'boxing', 'hunting', '%'], ['Joker', 'luring a rival on', 'luring', 'ticks', '%'],
  ['Desperado', 'skimming danger', 'skims', 'ticks', '%'], ['Star', 'flashes a minute', 'flashes', 'minutes', 1], ['Star', 'jumps a minute', 'jumps', 'minutes', 1],
];
function reportSignatures(per) {
  const sum = (names, k) => names.reduce((n, name) => n + (k === 'rounds' ? per[name].rounds : k === 'minutes' ? per[name].aliveMs / 60000 : per[name].sig[k]), 0);
  const ratio = (names, a, b, unit) => { const v = sum(names, a) / Math.max(1e-9, sum(names, b)); return unit === '%' ? (100 * v).toFixed(1) + '%' : v.toFixed(2); };
  const names = Object.keys(per);
  console.log('trademarks (each against the field: everyone else together)');
  for (const [who, what, a, b, unit] of TRADEMARKS) {
    if (!per[who]) continue;
    const field = names.filter(n => n !== who && sum([n], b) > 0);
    console.log(`  ${who}, ${what}: ${ratio([who], a, b, unit)} · field ${field.length ? ratio(field, a, b, unit) : 'none'}`);
  }
  console.table(names.sort().map(name => {
    const one = [name], r = (a, b, unit) => sum(one, b) > 0 ? ratio(one, a, b, unit) : '';
    return { name, run: r('moves', 'runs', 1), beside: r('beside', 'cells', '%'), coiled: r('coiled', 'long', '%'), riding: r('riding', 'ticks', '%'), apart: r('apart', 'ticks', 1),
      food: r('foodShare', 'rounds', '%'), beads: r('beadShare', 'rounds', '%'), home: r('atHome', 'homeTicks', '%'), boxing: r('boxing', 'hunting', '%'), luring: r('luring', 'ticks', '%'),
      skims: r('skims', 'ticks', '%'), 'flash/min': r('flashes', 'minutes', 1), 'jump/min': r('jumps', 'minutes', 1) };
  }));
}

// Files of rounds, one JSON line each, { "r": round, ... }: the cache's
// played rounds ({ r, result }), and stored states ({ r, state } or, for a
// round over before then, { r, done }: its numbers) after a first line
// saying how they were stored. Written whole to a side file and renamed into
// place, so a reader never sees half of one. (.gz: gzipped.)
function readLines(file) {
  let data;
  try { data = fs.readFileSync(file); } catch { return []; }
  try { if (file.endsWith('.gz')) data = zlib.gunzipSync(data); } catch { return []; }
  return data.toString('utf8').split('\n').filter(Boolean);
}
function writeLines(file, lines) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const side = `${file}.${process.pid}.tmp`, data = lines.join('\n') + '\n';
  fs.writeFileSync(side, file.endsWith('.gz') ? zlib.gzipSync(data, { level: 6 }) : data);
  fs.renameSync(side, file);
}
// The cache keeps what's been used in the last fortnight (a file read is
// touched, so it counts as used).
const KEEP_MS = 14 * 24 * 3600 * 1000;
function tidy(dir) {
  try {
    for (const f of fs.readdirSync(dir)) {
      const file = path.join(dir, f);
      try { if (Date.now() - fs.statSync(file).mtimeMs > KEEP_MS) fs.unlinkSync(file); } catch {}
    }
  } catch {}
}
// Each round's line, by round (the last for a round wins; one cut short is
// left out, so it's played again). A line is read only as far as its round.
const ROUND = /^\{"r":(\d+),"(result|state|done)":/;
function linesByRound(lines) {
  const out = new Map();
  for (const line of lines) {
    const m = ROUND.exec(line);
    if (m && line.endsWith('}')) out.set(Number(m[1]), line);
  }
  return out;
}
const lineOf = (r, kind, value) => `{"r":${r},"${kind}":${JSON.stringify(value)}}`;
const parsed = line => JSON.parse(line)[ROUND.exec(line)[2]];

if (isMainThread) {
  const args = process.argv.slice(2);
  const flag = name => args.includes(name);
  const WITH_VALUE = ['--seed', '--root', '--workers', '--save-at', '--save', '--from'];
  const text = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const value = name => { const v = text(name); return v == null ? null : Number(v); };
  const fail = why => { console.error(why); process.exit(1); };
  const given = Number(args.find((a, i) => /^\d+$/.test(a) && !WITH_VALUE.includes(args[i - 1]))) || null;
  const ahead = flag('--ahead'), json = flag('--json'), saveAt = value('--save-at'), fromFile = text('--from') && path.resolve(text('--from'));
  let seed = value('--seed'), signs = flag('--signatures'), rounds = given || 200;
  if (saveAt != null && seed == null) fail('--save-at needs --seed (a round must play the same way again to be worth storing)');
  if (saveAt != null && fromFile) fail("--save-at and --from don't go together");
  try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch {} // (the machine's own user comes first; the worker threads share this priority)
  const hash = (...parts) => crypto.createHash('sha1').update(parts.join('\u0000')).digest('hex');
  const read = f => fs.readFileSync(f, 'utf8');
  // (What rounds are played with: the game's files, and this file and the
  // state store too, since what a run counts can change.)
  const filesKey = hash(...GAME_FILES.map(f => read(path.join(ROOT, f))), read(__filename), read(require.resolve('./snapshots/state.js')));
  const CACHE = path.join(os.tmpdir(), 'barkbite-sim-cache');

  // --from: the stored rounds (the first line says how they were stored).
  let stored = null, fromKey = null;
  if (fromFile) {
    const lines = readLines(fromFile);
    let how = null;
    try { how = JSON.parse(lines[0]); } catch {}
    if (!how || how.states !== 2) fail(`${fromFile} isn't a file of rounds stored by this simulate.js (see --save-at)`);
    if (seed != null && seed !== how.seed) fail(`${fromFile} holds rounds of seed ${how.seed}, not ${seed}`);
    if (signs && !how.signs) fail(`${fromFile} was stored without --signatures, so they can't be counted for the part before ${how.saveAt / 1000}s`);
    seed = how.seed;
    signs = how.signs; // (counted on whether printed or not, so its rounds' numbers stay whole)
    fromKey = how.key;
    stored = linesByRound(lines.slice(1));
    let n = 0;
    while (stored.has(n)) n++;
    if (given > n) fail(`${fromFile} holds ${n} rounds, not ${given} (store more with --save-at)`);
    rounds = given || n;
    if (!json) console.log(`(going on with ${rounds} of the rounds of seed ${seed} stored at ${how.saveAt / 1000}s)`);
  }
  const workers = Math.max(1, Math.min(rounds, value('--workers') || Number(process.env.SIM_WORKERS) || Math.floor(os.cpus().length / 2)));

  // A seeded round is the same every time with the same files and options,
  // so each is cached (in the system's temp folder) and read back; stored
  // states too, by the files and seed that played them.
  const statesKey = saveAt == null ? null : hash(filesKey, JSON.stringify({ seed, signs, saveAt, v: 2 }));
  const cached = seed == null ? null : saveAt != null ? path.join(CACHE, `states-${statesKey}.jsonl.gz`)
    : path.join(CACHE, hash(filesKey, JSON.stringify({ seed, ahead, signs, from: fromKey, v: 2 })) + '.jsonl.gz');
  const head = () => JSON.stringify({ states: 2, key: statesKey, seed, saveAt, signs, root: ROOT });
  const cachedLines = () => { const lines = readLines(cached); return saveAt != null ? lines.slice(1) : lines; };
  const fromCache = () => !cached || flag('--fresh') ? new Map() : linesByRound(cachedLines());
  const have = fromCache(); // (round -> its line)
  if (have.size) { try { fs.utimesSync(cached, new Date(), new Date()); } catch {} }
  const missing = () => Array.from({ length: rounds }, (_, r) => r).filter(r => !have.has(r) && !(stored && ROUND.exec(stored.get(r))[2] === 'done'));

  const finish = merged => {
    if (json) console.log(JSON.stringify(merged));
    else {
      report(merged, flag('--census'));
      if (flag('--signatures')) reportSignatures(merged.per);
    }
    if (flag('--check')) {
      const never = Object.entries(merged.per).filter(([, p]) => p.rounds >= 20 && !p.wins).map(([n]) => n);
      const problems = [merged.total.stalled && `${merged.total.stalled} stalled`, never.length && `never won: ${never.join(', ')}`].filter(Boolean);
      if (problems.length) { console.error('check failed: ' + problems.join('; ')); process.exit(1); }
      console.log('check ok');
    }
  };
  // (played: what this run played, and the CPU it took, for --json.)
  const done = (played = { rounds: 0, cpu: 0 }) => {
    if (saveAt != null) {
      const lines = Array.from({ length: rounds }, (_, r) => have.get(r)), going = lines.filter(l => ROUND.exec(l)[2] === 'state').length;
      const out = text('--save') && path.resolve(text('--save'));
      if (out) writeLines(out, [head()].concat(lines));
      const file = out || cached;
      if (json) console.log(JSON.stringify({ states: file, rounds, going, played }));
      else console.log(`${rounds} rounds stored at ${saveAt / 1000}s (${going} still going then, ${rounds - going} over before) in ${file}\n  go on with them: node tools/simulate.js --from ${JSON.stringify(file)} [--root DIR]`);
      return;
    }
    const results = Array.from({ length: rounds }, (_, r) => parsed(have.get(r) || stored.get(r)));
    const T = (() => { const ctx = vm.createContext({ window: {} }); vm.runInContext(read(path.join(ROOT, 'tuning.js')), ctx); return ctx.window.TUNING; })();
    const merged = merge(results, T.SUDDEN_DEATH_MS);
    if (json) { merged.played = played; if (flag('--per-round')) merged.rounds = results; }
    finish(merged);
  };
  let todo = missing();
  if (!todo.length) {
    if (!json && saveAt == null && have.size) console.log('(played before with these files and options: read from the cache; --fresh plays it again)');
    done();
    return;
  }
  // One run at a time on the machine: a lock file, taken over if its owner's gone.
  const lock = path.join(os.tmpdir(), 'barkbite-sim.lock');
  const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
  const take = () => { try { fs.writeFileSync(lock, String(process.pid), { flag: 'wx' }); return true; } catch { return false; } };
  if (!flag('--no-wait')) {
    let told = false;
    while (!take()) {
      let owner = 0;
      try { owner = Number(fs.readFileSync(lock, 'utf8')); } catch {}
      if (!owner || !alive(owner)) { try { fs.unlinkSync(lock); } catch {} continue; }
      if (!told) { console.error(`(waiting for another simulation on this machine, pid ${owner}; --no-wait runs at once)`); told = true; }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
    }
    process.on('exit', () => { try { if (fs.readFileSync(lock, 'utf8') === String(process.pid)) fs.unlinkSync(lock); } catch {} });
    for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));
    if (told) { for (const [r, line] of fromCache()) if (!have.has(r)) have.set(r, line); todo = missing(); } // (whoever went first may have played these very rounds)
  }
  // The rounds go out one at a time to whichever core is free, so a long one
  // doesn't hold the rest up. (Each round has its own seed: it comes out the
  // same whichever core plays it, after whichever round.)
  const queue = [...todo], cores = Math.min(workers, todo.length), cpu = process.cpuUsage(), t0 = Date.now();
  Promise.all(Array.from({ length: cores }, () => new Promise((resolve, reject) => {
    const w = new Worker(__filename, { workerData: { root: ROOT, seed, ahead, signs, saveAt } });
    const feed = () => { const r = queue.shift(); w.postMessage(r === undefined ? null : { r, saved: stored ? stored.get(r) : null }); };
    w.on('message', ({ r, line }) => { have.set(r, line); feed(); });
    w.once('error', reject);
    w.once('exit', resolve);
    feed();
  }))).then(() => {
    const used = process.cpuUsage(cpu), seconds = (used.user + used.system) / 1e6, rest = rounds - todo.length;
    if (!json) console.error(`(played ${todo.length} round${todo.length === 1 ? '' : 's'}${saveAt != null ? ` to ${saveAt / 1000}s` : ''} on ${cores} core${cores === 1 ? '' : 's'}: ${Math.round(seconds)} s of CPU in ${Math.round((Date.now() - t0) / 1000)} s`
      + `${rest ? `; ${rest} ${stored ? 'over before the save or ' : ''}read from the cache` : ''})`);
    // (Into the cache, with whatever another run has put there meanwhile.)
    if (cached) {
      try {
        const now = linesByRound(cachedLines());
        for (const r of todo) now.set(r, have.get(r));
        const lines = [...now.keys()].sort((a, b) => a - b).map(r => now.get(r));
        writeLines(cached, saveAt != null ? [head()].concat(lines) : lines);
      } catch (e) { console.error(`(couldn't write the cache: ${e.message})`); }
      tidy(CACHE);
    }
    done({ rounds: todo.length, cpu: seconds });
  }).catch(err => { console.error(err); process.exit(1); });
} else {
  // A core: plays the rounds it's handed (or goes on with them), one at a time.
  const { E, T, ctx } = loadGame();
  const roots = { SnakeAI: ctx.window.SnakeAI, SnakeEngine: ctx.window.SnakeEngine, TUNING: ctx.window.TUNING };
  const known = State.known(roots), decode = State.decoder(ctx), pristine = State.fingerprint(roots);
  parentPort.on('message', job => {
    if (!job) { parentPort.close(); return; }
    const saved = job.saved && decode(parsed(job.saved), known);
    const out = playRound(E, T, job.r, workerData, saved);
    if (out.state && State.fingerprint(roots) !== pristine) throw new Error("the game changed its own objects (its personalities, DIRS or TUNING) while playing, so a stored round wouldn't go on exactly");
    parentPort.postMessage({ r: out.r, line: out.state ? lineOf(out.r, 'state', State.encode(out.state, known)) : lineOf(out.r, workerData.saveAt != null ? 'done' : 'result', out.result) });
  });
}
