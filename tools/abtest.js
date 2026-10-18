#!/usr/bin/env node
// Compares two copies of the game on the same seeded rounds, paired: round r
// of seed s under A against round r of seed s under B (the same rivals drawn,
// the same board to start; with --at, the very same round up to then). For
// every number asked for it prints A, B, the difference and a confidence
// interval, and a verdict: B higher, B lower, the same (the whole interval
// inside the margin that matters), or not known yet (?).
//
// It plays in looks, a batch of rounds on every seed at a time, and stops
// as soon as every row asked for has a verdict, so a clear difference (or a
// clear lack of one) costs a fraction of the full 2 x 600. It stays sound
// however early it stops: the intervals are repeated confidence intervals,
// each at 1 - alpha/K for K planned looks (Bonferroni over the looks), so
// with 95% confidence every interval at every look holds at once, and a
// verdict taken at any look is wrong at most 5% of the time for each row.
// (Over many rows, expect about one in twenty to be wrong by chance.)
//
// The rounds are played by tools/simulate.js (this copy's, with --root), so
// it waits its turn, runs gently and reads back what's been played before:
// the A side of one experiment is free in the next, and so is a plain
// simulate.js run of the same rounds afterwards.
//
//   node tools/abtest.js [A] B [--seed N ...] [--rounds N] [--batch N] [--metrics LIST] [--at MS]
//                        [--alpha P] [--margin ROW=X ...] [--workers N] [--json]
//
//   A, B        the two copies (folders with tuning.js, ai.js and engine.js); A defaults to this one
//   --seed N    a seed to play (repeat it for more; default 3 and 11)
//   --rounds N  at most this many rounds a seed (default 600)
//   --batch N   rounds a seed in a look (default 100: six looks; with fewer than about 50 pairs a look, the intervals are rough)
//   --metrics   the rows to print and decide on, by group (default all of them but trademarks):
//                 length    the median round
//                 sd        sudden death: its median length (of the rounds that reached it), and how many did
//                 deaths    what snakes died of (each cause's share of the deaths)
//                 starving  the share of snake-time starving, before the woodpecker and after
//                 powers    plain flashes a minute alive, plain jumps, golden leaps used, golden dashes and golden power food a round
//                 win       each personality's win rate (of the rounds it played)
//                 place     each personality's average place
//                 trademarks  each personality's trademark, as simulate.js --signatures measures it
//                           (Mason's straight runs, Ghost's distance, Star's flashes...; played with --signatures)
//   --at MS     fast-forward: store every round at game time MS as A plays it (simulate.js
//               --save-at), and play both on from there; for questions about the late game
//               (2:00, the woodpecker, is 120000). Only what happens after MS can differ
//   --alpha P   1 - the confidence (default 0.05)
//   --margin ROW=X  a difference smaller than X doesn't matter, for a row (sd, win.Star...) or a group (win=5)
//   --workers N passed on to simulate.js
//   --json      print the rows as JSON
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { TRADEMARKS } = require('./simulate.js');

const GROUPS = ['length', 'sd', 'deaths', 'starving', 'powers', 'win', 'place', 'trademarks'];
const USUAL = GROUPS.filter(g => g !== 'trademarks'); // (trademarks need rounds played with --signatures: asked for, not by default)

// What one round says, for the rows (from simulate.js --per-round).
function valuesOf(res) {
  const t = res.total, c = t.census, per = Object.values(res.per);
  return {
    length: t.times[0] / 1000, sd: t.sudden ? c.sdTimes[0] / 1000 : null, reached: t.sudden,
    causes: t.causes, deaths: Object.values(t.causes).reduce((a, b) => a + b, 0),
    starvingEarly: c.starvingEarly, aliveEarly: c.aliveEarly, starvingLate: c.starvingLate, aliveLate: c.aliveLate,
    minutes: per.reduce((n, p) => n + p.aliveMs, 0) / 60000, snakes: per.reduce((n, p) => n + p.rounds, 0),
    flashes: c.flashes, jumps: c.jumps, goldLeaps: c.goldLeaps, goldGot: c.goldGot, dashes: c.dashes, pickups: c.pickups,
    per: res.per,
  };
}

// The rows of the groups asked for. A ratio row is a sum over the rounds
// over another (num / den), times scale; a median row, the median of a value
// over the rounds that have one. margin: a difference that doesn't matter.
function rowsFor(As, Bs, groups = USUAL, margins = new Map()) {
  const rows = [], add = (group, key, label, unit, spec, margin) => groups.includes(group) && rows.push({ group, key, label, unit, margin: margins.get(key) ?? margins.get(group) ?? margin, ...spec });
  add('length', 'length', 'round length, median', 's', { median: v => v.length }, 3);
  add('sd', 'sd', 'sudden death length, median', 's', { median: v => v.sd }, 4);
  add('sd', 'reached', 'rounds reaching the woodpecker', '%', { num: v => v.reached, den: () => 1, scale: 100 }, 2);
  const causes = [...new Set([...As, ...Bs].flatMap(v => Object.keys(v.causes)))].sort();
  for (const k of causes) add('deaths', 'deaths.' + k, `deaths: ${k}`, '%', { num: v => v.causes[k] || 0, den: v => v.deaths, scale: 100 }, 3);
  add('starving', 'starving.early', 'starving, before the woodpecker', '%', { num: v => v.starvingEarly, den: v => v.aliveEarly, scale: 100 }, 0.5);
  add('starving', 'starving.late', 'starving, after', '%', { num: v => v.starvingLate, den: v => v.aliveLate, scale: 100 }, 0.5);
  add('powers', 'flashes', 'plain flashes a minute alive', '', { num: v => v.flashes, den: v => v.minutes }, 0.2);
  add('powers', 'jumps', 'plain jumps a round', '', { num: v => v.jumps, den: () => 1 }, 0.5);
  add('powers', 'leapsUsed', 'golden leaps used', '%', { num: v => v.goldLeaps, den: v => v.goldGot, scale: 100 }, 3);
  add('powers', 'dashes', 'golden dashes a round', '', { num: v => v.dashes, den: () => 1 }, 0.2);
  add('powers', 'golden', 'golden power food a snake a round', '', { num: v => v.pickups, den: v => v.snakes }, 0.05);
  const names = [...new Set([...As, ...Bs].flatMap(v => Object.keys(v.per)))].sort();
  const of = (v, name, k) => v.per[name]?.[k] || 0;
  for (const n of names) add('win', 'win.' + n, `win%: ${n}`, '%', { num: v => of(v, n, 'wins'), den: v => of(v, n, 'rounds'), scale: 100 }, 3);
  for (const n of names) add('place', 'place.' + n, `place: ${n}`, '', { num: v => of(v, n, 'placeSum'), den: v => of(v, n, 'rounds') }, 0.1);
  // (each a ratio of two of its sums, as simulate.js's TRADEMARKS has it; a % row's margin is 2 points, another's a tenth of A's value)
  const sign = (v, name, k) => { const p = v.per[name]; return !p ? 0 : k === 'rounds' ? p.rounds : k === 'minutes' ? p.aliveMs / 60000 : p.sig?.[k] || 0; };
  for (const [who, what, a, b, unit] of TRADEMARKS) {
    if (!names.includes(who)) continue;
    const spec = { num: v => sign(v, who, a), den: v => sign(v, who, b), scale: unit === '%' ? 100 : 1 };
    let margin = 2;
    if (unit !== '%') { let N = 0, D = 0; for (const v of As) { N += spec.num(v); D += spec.den(v); } margin = D ? +(0.1 * N / D).toPrecision(2) : null; }
    add('trademarks', `trademark.${who}.${a}`, `${who}: ${what}`, unit === '%' ? '%' : '', spec, margin);
  }
  return rows;
}

// The normal distribution's quantile (Acklam's), and Student's t from it (Cornish-Fisher).
function zOf(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - lo) return -zOf(1 - p);
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
function tOf(p, df) {
  const z = zOf(p), z3 = z ** 3, z5 = z ** 5, z7 = z ** 7;
  return z + (z3 + z) / (4 * df) + (5 * z5 + 16 * z3 + 3 * z) / (96 * df ** 2) + (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * df ** 3);
}

// mulberry32, for the bootstrap: the same intervals every time for the same rounds.
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
// The median of the first n of xs (reordering them).
function median(xs, n = xs.length) {
  if (!n) return NaN;
  const kth = k => {
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const pivot = xs[(lo + hi) >> 1];
      let i = lo, j = hi;
      while (i <= j) { while (xs[i] < pivot) i++; while (xs[j] > pivot) j--; if (i <= j) { const t = xs[i]; xs[i] = xs[j]; xs[j] = t; i++; j--; } }
      if (k <= j) hi = j; else if (k >= i) lo = i; else return xs[k];
    }
    return xs[k];
  };
  return n % 2 ? kth(n >> 1) : (kth(n / 2 - 1) + kth(n / 2)) / 2;
}

// One row on the paired rounds (As[i] and Bs[i] are the same round): A's
// number, B's, B - A, and its interval at confidence 1 - level.
function measure(row, As, Bs, level, draws = 4000) {
  const n = As.length;
  if (row.median) {
    const a = As.map(row.median), b = Bs.map(row.median), xa = new Float64Array(n), xb = new Float64Array(n);
    const med = (vals, idx, into) => { let m = 0; for (const i of idx) if (vals[i] != null) into[m++] = vals[i]; return median(into, m); };
    const every = Array.from({ length: n }, (_, i) => i), A0 = med(a, every, xa), B0 = med(b, every, xb);
    if (Number.isNaN(A0) || Number.isNaN(B0)) return null;
    // The paired bootstrap: the rounds drawn again, with replacement, both sides together.
    const random = seeded(n * 7919 + 1), diffs = new Float64Array(draws), idx = new Int32Array(n);
    let k = 0;
    for (let d = 0; d < draws; d++) {
      for (let i = 0; i < n; i++) idx[i] = Math.floor(random() * n);
      const da = med(a, idx, xa), db = med(b, idx, xb);
      if (!Number.isNaN(da) && !Number.isNaN(db)) diffs[k++] = db - da;
    }
    const sorted = diffs.subarray(0, k).sort();
    return { a: A0, b: B0, diff: B0 - A0, lo: sorted[Math.floor(k * level / 2)], hi: sorted[Math.max(0, Math.ceil(k * (1 - level / 2)) - 1)] };
  }
  // A ratio of sums, by the delta method: each round's share of the error
  // (its numerator less the ratio times its denominator, over the mean
  // denominator), B's less A's round by round; their spread is the error's.
  const scale = row.scale || 1;
  let NA = 0, DA = 0, NB = 0, DB = 0;
  for (let i = 0; i < n; i++) { NA += row.num(As[i]); DA += row.den(As[i]); NB += row.num(Bs[i]); DB += row.den(Bs[i]); }
  if (!DA || !DB) return null;
  const RA = NA / DA, RB = NB / DB, mA = DA / n, mB = DB / n;
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const d = (row.num(Bs[i]) - RB * row.den(Bs[i])) / mB - (row.num(As[i]) - RA * row.den(As[i])) / mA;
    ss += d * d;
  }
  const se = Math.sqrt(ss / Math.max(1, n - 1) / n), t = tOf(1 - level / 2, Math.max(1, n - 1)), diff = RB - RA;
  return { a: scale * RA, b: scale * RB, diff: scale * diff, lo: scale * (diff - t * se), hi: scale * (diff + t * se) };
}
const verdictOf = (m, margin) => !m ? 'n/a' : m.lo > 0 ? 'higher' : m.hi < 0 ? 'lower' : margin != null && m.lo > -margin && m.hi < margin ? 'same' : '?';

module.exports = { valuesOf, rowsFor, measure, verdictOf, median, zOf, tOf };

if (require.main === module) {
  const SIM = path.join(__dirname, 'simulate.js');
  const args = process.argv.slice(2);
  const WITH_VALUE = ['--seed', '--rounds', '--batch', '--metrics', '--at', '--alpha', '--margin', '--workers'];
  const all = name => args.flatMap((a, i) => a === name ? [args[i + 1]] : []);
  const one = name => all(name).pop() ?? null;
  const fail = why => { console.error(why); process.exit(1); };
  const roots = args.filter((a, i) => !a.startsWith('--') && !WITH_VALUE.includes(args[i - 1]));
  if (!roots.length || roots.length > 2) fail('usage: node tools/abtest.js [A] B [--seed N ...] [--rounds N] [--batch N] [--metrics LIST] [--at MS] [--alpha P] [--margin ROW=X ...] [--workers N] [--json]');
  const [A, B] = (roots.length === 1 ? [path.join(__dirname, '..'), roots[0]] : roots).map(r => path.resolve(r));
  for (const r of [A, B]) if (!['tuning.js', 'ai.js', 'engine.js'].every(f => fs.existsSync(path.join(r, f)))) fail(`${r} isn't a copy of the game (no tuning.js, ai.js and engine.js)`);
  const seeds = all('--seed').map(Number);
  if (!seeds.length) seeds.push(3, 11);
  const MAX = Number(one('--rounds')) || 600, BATCH = Math.min(MAX, Number(one('--batch')) || 100), LOOKS = Math.ceil(MAX / BATCH);
  const ALPHA = Number(one('--alpha')) || 0.05, LEVEL = ALPHA / LOOKS; // (each look's intervals: Bonferroni over the looks)
  const at = one('--at'), json = args.includes('--json'), workers = one('--workers');
  const groups = (one('--metrics') || USUAL.join(',')).split(',').map(g => g.trim()).filter(Boolean);
  for (const g of groups) if (!GROUPS.includes(g)) fail(`no metric ${g} (there are ${GROUPS.join(', ')})`);
  const signs = groups.includes('trademarks') ? ['--signatures'] : [];
  const margins = new Map(all('--margin').map(m => { const [k, v] = m.split('='); return [k, Number(v)]; }));

  // Playing, through simulate.js (what it played, and the CPU it took, is added up in spent).
  const spent = { A: { rounds: 0, cpu: 0 }, B: { rounds: 0, cpu: 0 } };
  const simulate = (side, ...more) => {
    const out = execFileSync(process.execPath, [SIM, ...more, '--root', side === 'A' ? A : B, '--json', ...(workers ? ['--workers', workers] : [])],
      { encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'inherit'] });
    const result = JSON.parse(out.trim().split('\n').pop());
    spent[side].rounds += result.played.rounds;
    spent[side].cpu += result.played.cpu;
    return result;
  };
  // The first n rounds of a seed under one side, each round's own numbers.
  const roundsOf = (side, seed, n) => {
    if (at == null) return simulate(side, String(n), '--seed', String(seed), '--per-round', ...signs).rounds;
    const { states } = simulate('A', String(n), '--seed', String(seed), '--save-at', String(at), ...signs); // (stored as A plays them; cached, so a look plays only its new rounds' openings)
    return simulate(side, String(n), '--from', states, '--per-round').rounds; // (with --signatures if they were stored with them)
  };

  // The looks: a batch more on every seed, till every row has a verdict.
  let As = [], Bs = [], results = [], look = 0, n = 0;
  while (look < LOOKS) {
    look++;
    n = Math.min(MAX, look * BATCH);
    As = []; Bs = [];
    for (const seed of seeds) {
      As.push(...roundsOf('A', seed, n).map(valuesOf));
      Bs.push(...roundsOf('B', seed, n).map(valuesOf));
    }
    results = rowsFor(As, Bs, groups, margins).map(row => { const m = measure(row, As, Bs, LEVEL); return { row, m, verdict: verdictOf(m, row.margin) }; });
    const open = results.filter(x => x.verdict === '?').length;
    console.error(`(look ${look} of ${LOOKS}: ${n} rounds a seed, ${As.length} pairs; ${results.length - open} of ${results.length} rows decided)`);
    if (!open) break;
  }

  const how = look < LOOKS || !results.some(x => x.verdict === '?') ? `stopped after ${n} of ${MAX} rounds a seed (look ${look} of ${LOOKS}): every row decided` : `all ${MAX} rounds a seed (${LOOKS} looks), some rows still undecided`;
  if (json) {
    console.log(JSON.stringify({ A, B, seeds, at: at == null ? null : Number(at), rounds: n, pairs: As.length, looks: look, plannedLooks: LOOKS, alpha: ALPHA, played: spent,
      rows: results.map(({ row, m, verdict }) => ({ key: row.key, label: row.label, unit: row.unit, margin: row.margin, ...(m || {}), verdict })) }));
  } else {
    console.log(`A: ${A}\nB: ${B}`);
    console.log(`seeds ${seeds.join(', ')}${at != null ? `, from ${at / 1000}s (stored as A played them)` : ''} · ${As.length} paired rounds · ${how}`);
    console.log(`intervals: ${Math.round(100 * (1 - ALPHA))}% over all ${LOOKS} looks (each look's at ${(100 * (1 - LEVEL)).toFixed(2)}%) · same: the whole interval within ±margin · higher, lower: B against A`);
    const fmt = (x, unit) => x == null || Number.isNaN(x) ? '-' : (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2)) + unit;
    const signed = (x, unit) => (x > 0 ? '+' : '') + fmt(x, unit);
    const table = results.map(({ row, m, verdict }) => [row.label, m ? fmt(m.a, row.unit) : '-', m ? fmt(m.b, row.unit) : '-', m ? signed(m.diff, row.unit) : '-',
      m ? `[${signed(m.lo, row.unit)}, ${signed(m.hi, row.unit)}]` : '-', verdict === 'same' ? `same (±${row.margin}${row.unit})` : verdict]);
    const head = ['', 'A', 'B', 'B-A', 'interval', 'verdict'], width = head.map((h, i) => Math.max(h.length, ...table.map(r => r[i].length)));
    for (const r of [head, ...table]) console.log(r.map((c, i) => i === 0 || i === 5 ? c.padEnd(width[i]) : c.padStart(width[i])).join('  ').trimEnd());
    const cpu = s => `${spent[s].rounds} rounds, ${Math.round(spent[s].cpu)} s of CPU`;
    console.log(`played: A ${cpu('A')}${at != null ? ' (openings included)' : ''}; B ${cpu('B')}; the rest read back from the cache`);
  }
}
