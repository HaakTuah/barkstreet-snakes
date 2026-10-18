#!/usr/bin/env node
// The rivals' thinking, timed and checked. decide() is handed positions taken
// from seeded AI-only rounds (what each rival saw, who it is and what it
// remembered), through two copies of the game loaded side by side (before and
// after a change, each as tools/simulate.js loads it), every position in turn
// through both, so a busy machine slows both alike. Every position must come
// out the same from both: the way it goes and everything it notes in its
// memory, with the same random numbers. (Each position is made over in each
// copy's own context first, as that copy's engine would make it.) A change
// that isn't meant to be exact (an approximation) is weighed by how many
// don't: how many went another way, how many only noted something else,
// and for which personas (and then by tools/simulate.js). Needs only
// Node, and is gentle on the machine: one core, at below-normal priority.
//
//   node tools/bench-ai.js [--base REV|DIR] [--root DIR] [--seed N] [--rounds N] [--every K] [--max N]
//                          [--repeat R] [--only before|after] [--fresh]
//
//   --base    the copy to compare against: a git revision or a folder (default HEAD)
//   --root    the copy under test (default: this one, as it is on disk)
//   --seed N, --rounds N  the rounds the positions come from, played by the
//             --base copy (default seed 3, as many rounds as it takes)
//   --every K, --max N  every Kth decision of those rounds, N of them (default 5 and 4000)
//   --repeat R  how many times each position is timed in each copy (the best
//             counts; default 3)
//   --only    time one copy alone, checking nothing (for node --cpu-prof)
//   --fresh   take the positions again (they're kept in the system's temp
//             folder, for the same --base files and options)
//
// Windows counts CPU time in whole ticks of 15.6 ms, so one decision's CPU
// time can't be read: the mean is the CPU counter's over every decision
// (each tick lands on whichever decision is running), and the percentiles
// are of each position's best wall-clock time of R (being kept waiting only
// ever adds to one). Both are this thread's: the compiling V8 does on its
// own threads (again, whenever compiled code meets something it wasn't
// compiled for) isn't counted here, but a whole run of tools/simulate.js
// pays for it.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const v8 = require('v8');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const REPO = path.join(__dirname, '..');
const BASE = option('--base', 'HEAD'), ROOT = path.resolve(option('--root', REPO));
const SEED = Number(option('--seed', 3)), ROUNDS = Number(option('--rounds', 0)) || Infinity;
const EVERY = Number(option('--every', 5)), MAX = Number(option('--max', 4000)), REPEAT = Math.max(1, Number(option('--repeat', 3)));
const ONLY = option('--only', null);
const FILES = ['tuning.js', 'ai.js', 'engine.js'];
const MAX_TIME = 600000; // (as in tools/simulate.js)
try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch {} // (whoever's using the computer comes first)

// A copy's files: from a folder, or from git at a revision.
function sources(where) {
  if (fs.existsSync(where) && fs.statSync(where).isDirectory()) return FILES.map(f => fs.readFileSync(path.join(where, f), 'utf8'));
  return FILES.map(f => execFileSync('git', ['show', `${where}:${f}`], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26 }));
}

// mulberry32, as tools/simulate.js seeds its rounds.
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

// A copy of the game in a fresh context, with its own Math.random (reseeded
// for every round, or every position). `wrap`, if given, stands in for
// decide() before engine.js takes it.
function load(files, label, wrap) {
  const copy = { rng: Math.random, label };
  const M = Object.create(Math);
  M.random = () => copy.rng();
  const ctx = vm.createContext({ window: {}, console, Math: M });
  files.forEach((src, i) => {
    if (FILES[i] === 'engine.js' && wrap) ctx.window.SnakeAI.decide = wrap(ctx.window.SnakeAI.decide, ctx.window.SnakeAI.PERSONAS);
    vm.runInContext(src, ctx, { filename: `${label}/${FILES[i]}` });
  });
  copy.AI = ctx.window.SnakeAI;
  copy.E = ctx.window.SnakeEngine;
  // A position made over in this copy's own context, as its engine would
  // make it (objects from another context have other hidden classes, which
  // the compiled AI would keep stumbling over, as it never does in a game).
  copy.adopt = vm.runInContext(`(x => {
    const made = new Map();
    const make = v => {
      if (typeof v !== 'object' || v === null) return v;
      if (made.has(v)) return made.get(v);
      const tag = Object.prototype.toString.call(v);
      if (tag === '[object Set]') { const s = new Set(); made.set(v, s); for (const e of v) s.add(make(e)); return s; }
      if (tag === '[object Map]') { const m = new Map(); made.set(v, m); for (const [k, e] of v) m.set(make(k), make(e)); return m; }
      const o = tag === '[object Array]' ? [] : {};
      made.set(v, o);
      for (const k of Object.keys(v)) o[k] = make(v[k]);
      return o;
    };
    return make(x);
  })`, ctx);
  return copy;
}

// The positions: every EVERYth decision of seeded AI-only rounds played by
// the base copy, as simulate plays them, each taken just before it's made
// (the view, the persona's key and the memory, serialized).
function record(files) {
  const positions = [];
  let n = 0;
  const game = load(files, 'record', (decide, personas) => {
    const keyOf = new Map(Object.entries(personas).map(([k, p]) => [p, k]));
    return (view, persona, memory) => {
      if (++n % EVERY === 0 && positions.length < MAX) positions.push(v8.serialize({ view, key: keyOf.get(persona), memory }));
      return decide(view, persona, memory);
    };
  });
  let rounds = 0;
  for (let r = 0; r < ROUNDS && positions.length < MAX; r++, rounds++) {
    game.rng = seeded(SEED + r * 7919);
    const g = game.E.createGame({ withPlayer: false });
    while (g.snakes.filter(s => s.alive).length > 1 && g.time < MAX_TIME && positions.length < MAX) game.E.step(g);
  }
  return { positions, rounds };
}

// Two memories (or anything in them) the same: the same fields, whatever
// order they were set in, holding the same values. (Each copy makes its
// objects in its own context, so a Set is told by its tag, not instanceof.)
const tag = x => Object.prototype.toString.call(x);
function same(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b || tag(a) !== tag(b)) return false;
  if (tag(a) === '[object Set]' || tag(a) === '[object Map]') return same([...a], [...b]);
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && same(a[k], b[k]));
}
const differences = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => !same(a[k], b[k]));
const dirName = (AI, d) => Object.keys(AI.DIRS).find(k => AI.DIRS[k] === d) ?? `not one of its DIRS: ${JSON.stringify(d)}`;

const q = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
const ms = x => x.toFixed(3);

(() => {
  const baseFiles = sources(BASE), rootFiles = sources(ROOT);
  const cacheFile = path.join(os.tmpdir(), 'barkbite-bench-ai', require('crypto').createHash('sha1')
    .update(baseFiles.concat(fs.readFileSync(__filename, 'utf8')).join('\u0000'))
    .update(JSON.stringify({ SEED, ROUNDS, EVERY, MAX, v: 1 })).digest('hex') + '.bin');
  let taken;
  if (!args.includes('--fresh') && fs.existsSync(cacheFile)) taken = v8.deserialize(fs.readFileSync(cacheFile));
  else {
    const c0 = process.cpuUsage();
    taken = record(baseFiles);
    const c = process.cpuUsage(c0);
    console.log(`(took ${taken.positions.length} positions from ${taken.rounds} rounds in ${((c.user + c.system) / 1e6).toFixed(1)} s of CPU; kept for next time)`);
    try { fs.mkdirSync(path.dirname(cacheFile), { recursive: true }); fs.writeFileSync(cacheFile, v8.serialize(taken)); } catch {}
  }
  const { positions } = taken;
  const P = positions.length;
  const copies = [load(baseFiles, 'before'), load(rootFiles, 'after')].filter((c, i) => !ONLY || ONLY === ['before', 'after'][i]);
  console.log(`before: ${BASE} · after: ${path.relative(process.cwd(), ROOT) || '.'}`);
  // One decision: a fresh copy of the position, the same random numbers for
  // both copies. (Its CPU time is this thread's, where there's a counter for
  // it: the compiler's and the collector's own threads are left out.)
  const cpuNow = process.threadCpuUsage ? c0 => process.threadCpuUsage(c0) : c0 => process.cpuUsage(c0);
  const decideIn = (copy, p) => {
    const { view, key, memory } = copy.adopt(v8.deserialize(positions[p]));
    copy.rng = seeded(p * 7919 + 1);
    const t0 = process.hrtime.bigint(), c0 = cpuNow();
    const d = copy.AI.decide(view, copy.AI.PERSONAS[key], memory);
    const c = cpuNow(c0), t = Number(process.hrtime.bigint() - t0) / 1e6;
    return { d, memory, key, t, cpu: (c.user + c.system) / 1000 };
  };

  // A first pass over a few hundred, untimed, so both are compiled and warm.
  for (let p = 0; p < Math.min(P, 300); p++) for (const copy of copies) decideIn(copy, p);
  const best = copies.map(() => new Float64Array(P).fill(Infinity)), cpu = copies.map(() => 0);
  const byKey = {}, wrongBy = {};
  let wrong = 0, turned = 0;
  for (let p = 0; p < P; p++) {
    for (let r = 0; r < REPEAT; r++) {
      const order = (p + r) % 2 && copies.length > 1 ? [1, 0] : copies.map((_, i) => i);
      const out = [];
      for (const i of order) {
        const o = out[i] = decideIn(copies[i], p);
        if (o.t < best[i][p]) best[i][p] = o.t;
        cpu[i] += o.cpu;
      }
      if (copies.length < 2 || r) continue;
      byKey[out[0].key] ||= [];
      byKey[out[0].key].push(p);
      const [a, b] = out, da = dirName(copies[0].AI, a.d), db = dirName(copies[1].AI, b.d), diff = differences(a.memory, b.memory);
      if (da !== db || diff.length) {
        wrongBy[a.key] = (wrongBy[a.key] || 0) + 1;
        if (da !== db) turned++;
        if (++wrong <= 10) console.log(`DIFFERENT at position ${p} (${a.key}): ${da !== db ? `goes ${da} against ${db}` : ''}${diff.length ? ` memory: ${diff.join(', ')}` : ''}`);
      }
    }
  }

  const rows = {};
  copies.forEach((copy, i) => {
    const s = [...best[i]].sort((x, y) => x - y), mean = s.reduce((x, y) => x + y, 0) / P;
    rows[copy.label] = { 'cpu mean': ms(cpu[i] / (P * REPEAT)), mean: ms(mean), p50: ms(q(s, 0.5)), p95: ms(q(s, 0.95)), p99: ms(q(s, 0.99)), worst: ms(s[P - 1]) };
  });
  console.log(`${P} positions (seed ${SEED}, every ${EVERY}th decision of ${taken.rounds} rounds), each timed ${REPEAT} times in each copy; ms a decision:`);
  console.table(rows);
  if (copies.length < 2) return;
  const ratio = k => (Number(rows[copies[0].label][k]) / Number(rows[copies[1].label][k])).toFixed(2) + 'x';
  console.log(`after is faster by: cpu mean ${ratio('cpu mean')}, mean ${ratio('mean')}, p50 ${ratio('p50')}, p95 ${ratio('p95')}, p99 ${ratio('p99')}`);
  const mean = (i, ps) => ps.reduce((x, p) => x + best[i][p], 0) / ps.length;
  console.table(Object.fromEntries(Object.entries(byKey).sort().map(([k, ps]) => [k, {
    positions: ps.length, before: ms(mean(0, ps)), after: ms(mean(1, ps)), 'faster by': (mean(0, ps) / mean(1, ps)).toFixed(2) + 'x',
    ...(wrong ? { different: wrongBy[k] || 0 } : {}), // (only when some are: for weighing a change that isn't meant to be exact)
  }])));
  if (wrong) {
    const pct = n => (100 * n / P).toFixed(1) + '%';
    console.log(`${wrong} of ${P} positions (${pct(wrong)}) came out DIFFERENT: ${turned} (${pct(turned)}) went another way, ${wrong - turned} only noted something else in memory`);
    process.exit(1);
  }
  console.log(`all ${P} positions came out the same in both: the way it went, and its memory`);
})();
