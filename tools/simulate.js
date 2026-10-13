#!/usr/bin/env node
// Headless balance check. Plays AI-only rounds with the game's own rules and
// AI (tuning.js, ai.js and engine.js, loaded unchanged) and prints how each
// personality did. Runs on all cores; needs only Node.
//
//   node tools/simulate.js [rounds] [--seed N] [--ahead] [--check] [--json] [--root DIR]
//
//   rounds    how many rounds (default 200)
//   --seed N  a fixed random seed, so a run can be repeated exactly (each round
//             has its own seed, so it doesn't matter how many cores you have)
//   --ahead   let every AI decide during the frames before its tick, the way
//             the browser does; with the same seed the rounds must come out
//             identical to a run without it
//   --check   fail (exit 1) if a round stalls, or a personality never wins
//   --json    print the raw totals instead of the table
//   --root    play another copy of the game (to compare versions)
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// (Workers don't see the command line, so the root travels with each job.)
const argRoot = process.argv.indexOf('--root');
const ROOT = isMainThread ? (argRoot > 0 ? path.resolve(process.argv[argRoot + 1]) : path.join(__dirname, '..')) : workerData.root;
const MAX_TIME = 600000; // a round still going after 10 minutes counts as stalled

// mulberry32: a small, fast seeded random number generator.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The game's files in a fresh context, with our own Math.random.
// Math.random draws from `rng`, which can be reseeded for every round.
let rng = Math.random;
function loadGame() {
  const M = Object.create(Math);
  M.random = () => rng();
  const ctx = vm.createContext({ window: {}, console, Math: M });
  for (const f of ['tuning.js', 'ai.js', 'engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return { E: ctx.window.SnakeEngine, T: ctx.window.TUNING };
}

// How a snake died, finer than the game's killer field.
const causeOf = s => s.killer === 'self' ? 'self' : s.killer === 'hunger' ? 'starved'
  : s.cause === 'fell into a woodpecker hole' ? 'hole' : s.killer === 'wall' ? 'wall'
  : s.cause.startsWith('crashed') ? 'head-on' : 'body';

// Plays rounds [from, to) of the run, each from its own seed.
function play({ from, to, seed, ahead }) {
  const { E, T } = loadGame();
  const per = {};
  const total = { rounds: to - from, timeSum: 0, times: [], sudden: 0, draws: 0, stalled: 0, trace: [], beetles: 0, caught: 0, flown: 0, causes: {} };
  for (let r = from; r < to; r++) {
    rng = seed == null ? Math.random : seeded(seed + r * 7919);
    let trace = 0;
    const g = E.createGame({ withPlayer: false });
    for (const s of g.snakes) {
      per[s.name] ||= { rounds: 0, wins: 0, placeSum: 0, eaten: 0, pellets: 0, beetles: 0, kills: 0, aliveMs: 0, deaths: {} };
      per[s.name].rounds++;
    }
    const place = new Map();
    while (g.snakes.some(s => s.alive) && g.snakes.filter(s => s.alive).length > 1 && g.time < MAX_TIME) {
      // In order, stopping at the first snake that must decide in the tick, so
      // the random numbers are drawn in the same order as without --ahead.
      if (ahead) for (const s of g.snakes) { if (!s.alive) continue; if (!E.canThinkAhead(g, s)) break; E.thinkAhead(g, s); }
      const dying = E.step(g);
      for (const e of g.events) {
        if (e.type === 'spawn' && e.kind === 'beetle') total.beetles++;
        else if (e.type === 'eat' && e.kind === 'beetle') { total.caught++; per[e.snake.name].beetles++; }
        else if (e.type === 'flown') total.flown++;
      }
      const left = g.snakes.filter(s => s.alive).length;
      for (const s of dying) {
        place.set(s, left + 1);
        per[s.name].aliveMs += g.time;
        const cause = causeOf(s);
        per[s.name].deaths[cause] = (per[s.name].deaths[cause] || 0) + 1;
        total.causes[cause] = (total.causes[cause] || 0) + 1;
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
    for (const s of g.snakes) {
      const p = per[s.name];
      p.placeSum += place.get(s) || 1;
      p.eaten += s.eaten;
      p.pellets += s.pellets;
      if (s.alive) p.aliveMs += g.time;
    }
    total.timeSum += g.time;
    total.times.push(g.time);
    if (E.suddenDeath(g)) total.sudden++;
  }
  return { per, total, suddenAt: T.SUDDEN_DEATH_MS };
}

function merge(results) {
  const per = {}, total = { rounds: 0, timeSum: 0, times: [], sudden: 0, draws: 0, stalled: 0, trace: [], beetles: 0, caught: 0, flown: 0, causes: {} };
  for (const r of results) {
    for (const k of ['rounds', 'timeSum', 'sudden', 'draws', 'stalled', 'beetles', 'caught', 'flown']) total[k] += r.total[k];
    total.times.push(...r.total.times);
    total.trace.push(...r.total.trace);
    for (const [c, n] of Object.entries(r.total.causes)) total.causes[c] = (total.causes[c] || 0) + n;
    for (const [name, p] of Object.entries(r.per)) {
      const t = (per[name] ||= { deaths: {} });
      for (const [k, v] of Object.entries(p)) {
        if (k === 'deaths') for (const [d, n] of Object.entries(v)) t.deaths[d] = (t.deaths[d] || 0) + n;
        else t[k] = (t[k] || 0) + v;
      }
    }
  }
  // One fingerprint for the whole run, in round order (whatever the number of workers).
  total.trace = total.trace.sort((a, b) => a[0] - b[0]).reduce((h, [, t]) => (h * 131 + t) % 1000000007, 7);
  return { per, total, suddenAt: results[0].suddenAt };
}

function report({ per, total, suddenAt }) {
  const pct = (a, b) => Math.round(100 * a / Math.max(1, b));
  const times = total.times.sort((a, b) => a - b);
  const sec = ms => `${Math.round(ms / 1000)}s`;
  console.log(`${total.rounds} rounds · length median ${sec(times[times.length >> 1])}, middle half ${sec(times[times.length >> 2])}-${sec(times[(times.length * 3) >> 2])}`
    + ` · ${pct(total.sudden, total.rounds)}% reached the woodpecker (${sec(suddenAt)}) · draws ${total.draws} · stalled ${total.stalled}`);
  if (total.beetles) console.log(`beetles: ${(total.beetles / total.rounds).toFixed(1)} a round, ${pct(total.caught, total.beetles)}% caught, ${pct(total.flown, total.beetles)}% flew off`);
  const deaths = Object.values(total.causes).reduce((a, b) => a + b, 0);
  console.log('deaths: ' + Object.entries(total.causes).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${pct(n, deaths)}%`).join(', ')
    + ` · into holes: ${((total.causes.hole || 0) / Math.max(1, total.sudden)).toFixed(2)} per woodpecker round`);
  console.log(`fingerprint ${total.trace}`);
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

if (isMainThread) {
  const args = process.argv.slice(2);
  const flag = name => args.includes(name);
  const value = name => { const i = args.indexOf(name); return i >= 0 ? Number(args[i + 1]) : null; };
  const rounds = Number(args.find((a, i) => /^\d+$/.test(a) && args[i - 1] !== '--seed')) || 200;
  const seed = value('--seed');
  const ahead = flag('--ahead');
  const workers = Math.max(1, Math.min(rounds, os.cpus().length - 1));
  const jobs = Array.from({ length: workers }, (_, i) => ({
    from: Math.floor(rounds * i / workers),
    to: Math.floor(rounds * (i + 1) / workers),
    seed,
    ahead,
    root: ROOT,
  }));
  Promise.all(jobs.map(job => new Promise((resolve, reject) => {
    const w = new Worker(__filename, { workerData: job });
    w.once('message', resolve);
    w.once('error', reject);
  }))).then(results => {
    const merged = merge(results);
    if (flag('--json')) console.log(JSON.stringify(merged));
    else report(merged);
    if (flag('--check')) {
      const never = Object.entries(merged.per).filter(([, p]) => p.rounds >= 20 && !p.wins).map(([n]) => n);
      const problems = [merged.total.stalled && `${merged.total.stalled} stalled`, never.length && `never won: ${never.join(', ')}`].filter(Boolean);
      if (problems.length) { console.error('check failed: ' + problems.join('; ')); process.exit(1); }
      console.log('check ok');
    }
  }, err => { console.error(err); process.exit(1); });
} else {
  parentPort.postMessage(play(workerData));
}
