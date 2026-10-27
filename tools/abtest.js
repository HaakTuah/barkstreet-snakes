#!/usr/bin/env node
// Compares two copies of the game on the same seeded rounds, paired: round r
// of seed s under A against round r of seed s under B (the same rivals drawn,
// the same board to start; with --at, the very same round up to then). For
// every number asked for it prints A, B, the difference and a confidence
// interval, and a verdict: B higher, B lower, the same (the whole interval
// inside the margin that matters), or not known yet (?).
//
// It plays in looks, a batch of rounds on every seed at a time, and stops
// as soon as every row it waits for has a verdict, so a clear difference (or
// a clear lack of one) costs a fraction of the full 2 x 600. It stays sound
// however early it stops, and however many rows: the intervals are repeated
// confidence intervals, each at 1 - alpha/(K R) for K planned looks and R
// rows (Bonferroni over both), so with 95% confidence every interval of every
// row at every look holds at once. The chance that any verdict in the table
// is wrong is at most 5%, however many rows it has (and the wrong rows to
// expect, at most 0.05); the price of a row is a slightly wider interval for
// every other, so ask only for what the question is about. Each personality's
// win rate and place (win, place) can't usually be pinned within a margin
// that matters (a few hundred rounds each), so they're shown but don't hold
// up the stop, unless they're all that's asked for.
//
// The rounds are played by tools/simulate.js (this copy's, with --root), so
// it waits its turn, runs gently and reads back what's been played before:
// the A side of one experiment is free in the next, and so is a plain
// simulate.js run of the same rounds afterwards.
//
// Head to head (--head-to-head): A's AI and B's in the same rounds, under
// A's rules (A and B must have the same tuning.js and engine.js: it compares
// two AIs, or rivals with a move against rivals without it, on one set of
// rules). Every round is played twice, as duplicate bridge is: once with B's
// AI steering the snakes with even ids and A's the odd, once the other way
// round (simulate.js --versus). So every personality on every spawn plays
// once for each side, and the rows set A's snakes against B's over the
// pair: who wins, places better, lives longer, eats more, kills more. Since
// they meet on the same board, it measures skill against each other, where
// the plain mode measures what each does in a field of its own kind. Given
// the same AI twice, the two plays of a round are the same game with the
// sides swapped, so every row comes out exactly even (an identity check);
// two copies that differ only in which random numbers they draw come out
// even within noise.
// (Check it after a change to this mode or to simulate.js: `node
// tools/abtest.js . . --head-to-head --metrics side,deaths,powers,trademarks
// --rounds 20 --batch 20` must give B-A = 0 on every row.) Two trademarks
// read the AI's own memory (Sovereign's home, Mute's victimId): if B's
// ai.js renames those, its snakes measure as 0 there, a false difference.
//
//   node tools/abtest.js [A] B [--seed N ...] [--rounds N] [--batch N] [--metrics LIST] [--at MS]
//                        [--alpha P] [--margin ROW=X ...] [--workers N] [--json]
//   node tools/abtest.js [A] B --head-to-head [--seed N ...] [--rounds N] [--batch N] [--metrics LIST] [--alpha P] ...
//
//   A, B        the two copies (folders with tuning.js, ai.js and engine.js); A defaults to this one
//   --seed N    a seed to play (repeat it for more; default 3 and 11, the screening's: confirm
//               what they chose on seeds they haven't played, 29 and 41 say)
//   --rounds N  at most this many rounds a seed (default 600)
//   --batch N   rounds a seed in a look (default 100: six looks; with fewer than about 50 pairs a look, the intervals are rough)
//   --metrics   the rows to print and decide on, by group (default length,sd: the ones a
//               change to the game's pace is about, and they can decide early):
//                 length    the median round
//                 sd        sudden death: its median length (of the rounds that reached it), and how many did
//                 deaths    what snakes died of (each cause's share of the deaths)
//                 starving  the share of snake-time starving, before the woodpecker and after
//                 powers    plain flashes a minute alive, plain jumps, golden leaps used, golden dashes and golden power food a round
//                 win       each personality's win rate (of the rounds it played; shown, not waited for)
//                 place     each personality's average place (shown, not waited for)
//                 trademarks  each personality's trademark, as simulate.js --signatures measures it
//                           (Mason's straight runs, Ghost's distance, Star's flashes...; played with --signatures)
//   --head-to-head  A's AI and B's in the same rounds (above); its rows, by group (default side):
//                 side      each side's snakes: win%, average place, time alive, food and kills a snake
//                 deaths    each side's snakes: the share that died of each cause
//                 powers    each side's snakes: plain flashes a minute alive, plain jumps, golden leaps and
//                           dashes and golden power food a snake (how often a side used a move)
//                 win, place, trademarks  each personality's, when it played for A and for B
//                 (win and place shown, not waited for, as above). Not with --at
//   --at MS     fast-forward: store every round at game time MS as A plays it (simulate.js
//               --save-at), and play both on from there; for questions about the late game
//               (2:00, the woodpecker, is 120000). Only what happens after MS can differ
//   --alpha P   1 - the confidence, for the whole table (default 0.05: any verdict wrong at most 5% of the time)
//   --margin ROW=X  a difference smaller than X doesn't matter, for a row (sd, win.Star...) or a group (win=5)
//   --workers N passed on to simulate.js
//   --json      print the rows as JSON
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const { TRADEMARKS } = require('./simulate.js');

const GROUPS = ['length', 'sd', 'deaths', 'starving', 'powers', 'win', 'place', 'trademarks'];
const H2H = ['side', 'deaths', 'powers', 'win', 'place', 'trademarks']; // (--head-to-head's)
const USUAL = ['length', 'sd']; // (the rest asked for: each row widens every interval a little, and trademarks need rounds played with --signatures)
const SHOWN = ['win', 'place']; // (shown, not waited for, unless they're all that's asked)

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

// Head to head: the two plays of a round (simulate.js --versus, B on the
// even seats, then the odd), as A's snakes' values and B's, each with its
// snakes' numbers added up (per: by personality, as in a plain round).
function sidesOf(...plays) {
  const side = () => ({ h2h: true, per: {}, snakes: 0, wins: 0, placeSum: 0, minutes: 0, eaten: 0, kills: 0, causes: {}, flashes: 0, jumps: 0, leaps: 0, dashes: 0, golden: 0 });
  const out = { A: side(), B: side() };
  for (const res of plays) {
    for (const [name, p] of Object.entries(res.per)) {
      const v = out[p.versus ? 'B' : 'A'], t = (v.per[name] ||= { deaths: {} });
      for (const [k, x] of Object.entries(p)) {
        if (k === 'deaths' || k === 'sig') for (const [d, n] of Object.entries(x)) (t[k] ||= {})[d] = (t[k][d] || 0) + n;
        else t[k] = (t[k] || 0) + x;
      }
      v.snakes += p.rounds; v.minutes += p.aliveMs / 60000;
      for (const k of ['wins', 'placeSum', 'eaten', 'kills', 'flashes', 'jumps', 'leaps', 'dashes', 'golden']) v[k] += p[k];
      for (const [c, n] of Object.entries(p.deaths)) v.causes[c] = (v.causes[c] || 0) + n;
    }
  }
  return out;
}

// The rows of the groups asked for. A ratio row is a sum over the rounds
// over another (num / den), times scale; a median row, the median of a value
// over the rounds that have one. margin: a difference that doesn't matter.
function rowsFor(As, Bs, groups = USUAL, margins = new Map()) {
  const rows = [], add = (group, key, label, unit, spec, margin) => groups.includes(group) && rows.push({ group, key, label, unit, margin: margins.get(key) ?? margins.get(group) ?? margin, ...spec });
  if (As[0]?.h2h) { // (head to head: each side's snakes, a snake at a time)
    const snakes = v => v.snakes;
    add('side', 'side.win', 'win% a snake', '%', { num: v => v.wins, den: snakes, scale: 100 }, 3);
    add('side', 'side.place', 'place a snake', '', { num: v => v.placeSum, den: snakes }, 0.1);
    add('side', 'side.alive', 'time alive a snake', 's', { num: v => v.minutes, den: snakes, scale: 60 }, 3);
    add('side', 'side.food', 'food a snake', '', { num: v => v.eaten, den: snakes }, 0.5);
    add('side', 'side.kills', 'kills a snake', '', { num: v => v.kills, den: snakes }, 0.05);
    for (const k of [...new Set([...As, ...Bs].flatMap(v => Object.keys(v.causes)))].sort()) add('deaths', 'deaths.' + k, `died: ${k}`, '%', { num: v => v.causes[k] || 0, den: snakes, scale: 100 }, 3);
    add('powers', 'flashes', 'plain flashes a minute alive', '', { num: v => v.flashes, den: v => v.minutes }, 0.2);
    add('powers', 'jumps', 'plain jumps a snake', '', { num: v => v.jumps, den: snakes }, 0.2);
    add('powers', 'leaps', 'golden leaps a snake', '', { num: v => v.leaps, den: snakes }, 0.05);
    add('powers', 'dashes', 'golden dashes a snake', '', { num: v => v.dashes, den: snakes }, 0.05);
    add('powers', 'golden', 'golden power food a snake', '', { num: v => v.golden, den: snakes }, 0.05);
  } else {
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
  }
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

// A side's values for a median row, put in order once: `xs` the values
// there are, smallest first, and `rank` each round's place among them (-1:
// none), so the median of rounds drawn again is a count, not a sort.
function ranked(vals) {
  const xs = [...new Set(vals.filter(v => v != null))].sort((x, y) => x - y), at = new Map(xs.map((v, i) => [v, i]));
  return { xs, rank: Int32Array.from(vals, v => v == null ? -1 : at.get(v)), count: new Int32Array(xs.length) };
}
// The median of the rounds counted in `count` (m of them): as median() has it.
function countedMedian({ xs, count }, m) {
  if (!m) return NaN;
  const lo = (m - 1) >> 1, hi = m >> 1; // (the middle one, or the middle two)
  let seen = 0, r = 0;
  while (seen + count[r] <= lo) seen += count[r++];
  const first = xs[r];
  if (hi === lo || seen + count[r] > hi) return first;
  do r++; while (!count[r]);
  return (first + xs[r]) / 2;
}

// One row on the paired rounds (As[i] and Bs[i] are the same round): A's
// number, B's, B - A, and its interval at confidence 1 - level.
function measure(row, As, Bs, level, draws) {
  const n = As.length;
  if (row.median) {
    const a = ranked(As.map(row.median)), b = ranked(Bs.map(row.median));
    const all = side => { side.count.fill(0); let m = 0; for (const r of side.rank) if (r >= 0) { side.count[r]++; m++; } return countedMedian(side, m); };
    const A0 = all(a), B0 = all(b);
    if (Number.isNaN(A0) || Number.isNaN(B0)) return null;
    // The paired bootstrap: the rounds drawn again, with replacement, both
    // sides together, and the interval from the differences' own tails. A
    // whole table's level is far out in them, so there are enough draws for
    // 20 beyond each end (4000 at least, 100000 at most). (Measured on real
    // rounds, 200 to 1200 a side, these tails held at every level down to
    // 0.1%; an interval from the draws' standard error left the truth out 1.6
    // to 3.6 times too often: the medians fall on the ticks, and jump.)
    draws ??= Math.min(100000, Math.max(4000, Math.ceil(40 / level)));
    const random = seeded(n * 7919 + 1), diffs = new Float64Array(draws);
    let k = 0;
    for (let d = 0; d < draws; d++) {
      a.count.fill(0); b.count.fill(0);
      let ma = 0, mb = 0;
      for (let i = 0; i < n; i++) {
        const j = Math.floor(random() * n), ra = a.rank[j], rb = b.rank[j];
        if (ra >= 0) { a.count[ra]++; ma++; }
        if (rb >= 0) { b.count[rb]++; mb++; }
      }
      const da = countedMedian(a, ma), db = countedMedian(b, mb);
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

// One look at the paired rounds: every row of the groups asked for, its
// interval and its verdict. The intervals hold all at once with confidence
// 1 - alpha over the `looks` planned and the rows (each at alpha / (looks x
// rows): Bonferroni over both), so the chance that any verdict is wrong, at
// whichever look it stops, is at most alpha, and so is the number of wrong
// rows to expect. (A look with more rows, a cause of death first seen, has
// each a little wider: each look's share of alpha stays alpha / looks.)
// open: rows it waits for (all but win and place, unless they're all that's
// asked) still undecided.
function judge(As, Bs, { groups = USUAL, margins = new Map(), alpha = 0.05, looks = 1, draws } = {}) {
  const rows = rowsFor(As, Bs, groups, margins), level = alpha / (looks * Math.max(1, rows.length));
  const results = rows.map(row => { const m = measure(row, As, Bs, level, draws); return { row, m, verdict: verdictOf(m, row.margin) }; });
  const waitsFor = groups.some(g => !SHOWN.includes(g)) ? x => !SHOWN.includes(x.row.group) : () => true;
  for (const x of results) x.waited = waitsFor(x);
  const waited = results.filter(x => x.waited);
  return { results, level, waited: waited.length, open: waited.filter(x => x.verdict === '?').length };
}

module.exports = { valuesOf, sidesOf, rowsFor, measure, verdictOf, judge, median, zOf, tOf, USUAL, SHOWN, GROUPS, H2H };

if (require.main === module) {
  const SIM = path.join(__dirname, 'simulate.js');
  const args = process.argv.slice(2);
  const WITH_VALUE = ['--seed', '--rounds', '--batch', '--metrics', '--at', '--alpha', '--margin', '--workers'];
  const all = name => args.flatMap((a, i) => a === name ? [args[i + 1]] : []);
  const one = name => all(name).pop() ?? null;
  const fail = why => { console.error(why); process.exit(1); };
  const roots = args.filter((a, i) => !a.startsWith('--') && !WITH_VALUE.includes(args[i - 1]));
  if (!roots.length || roots.length > 2) fail('usage: node tools/abtest.js [A] B [--seed N ...] [--rounds N] [--batch N] [--metrics LIST] [--at MS] [--alpha P] [--margin ROW=X ...] [--workers N] [--json] [--head-to-head]');
  const [A, B] = (roots.length === 1 ? [path.join(__dirname, '..'), roots[0]] : roots).map(r => path.resolve(r));
  for (const r of [A, B]) if (!['tuning.js', 'ai.js', 'engine.js'].every(f => fs.existsSync(path.join(r, f)))) fail(`${r} isn't a copy of the game (no tuning.js, ai.js and engine.js)`);
  const seeds = all('--seed').map(Number);
  if (!seeds.length) seeds.push(3, 11);
  const MAX = Number(one('--rounds')) || 600, BATCH = Math.min(MAX, Number(one('--batch')) || 100), LOOKS = Math.ceil(MAX / BATCH);
  const ALPHA = Number(one('--alpha')) || 0.05; // (for the whole table: see judge)
  const at = one('--at'), json = args.includes('--json'), workers = one('--workers'), h2h = args.includes('--head-to-head');
  const groups = (one('--metrics') || (h2h ? 'side' : USUAL.join(','))).split(',').map(g => g.trim()).filter(Boolean), known = h2h ? H2H : GROUPS;
  for (const g of groups) if (!known.includes(g)) fail(`no metric ${g}${h2h ? ' head to head' : ''} (there are ${known.join(', ')})`);
  if (h2h && at != null) fail("--head-to-head doesn't go with --at");
  for (const f of h2h ? ['tuning.js', 'engine.js'] : []) if (fs.readFileSync(path.join(A, f), 'utf8') !== fs.readFileSync(path.join(B, f), 'utf8'))
    fail(`head to head plays under one set of rules, and A's ${f} and B's differ: give both the same ${f} (a new rule on both sides, its use in B's ai.js only)`);
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
  // Head to head: both plays of each round under A's rules, B's AI on the
  // even seats then the odd, as each side's numbers (sidesOf).
  const sides = new Map();
  const roundsOf = (side, seed, n) => {
    if (h2h) {
      if (!sides.has(`${seed}:${n}`)) {
        const [even, odd] = ['even', 'odd'].map(half => simulate('A', String(n), '--seed', String(seed), '--per-round', '--versus', B, '--seats', half, ...signs).rounds);
        sides.set(`${seed}:${n}`, even.map((r, i) => sidesOf(r, odd[i])));
      }
      return sides.get(`${seed}:${n}`).map(x => x[side]);
    }
    if (at == null) return simulate(side, String(n), '--seed', String(seed), '--per-round', ...signs).rounds;
    const { states } = simulate('A', String(n), '--seed', String(seed), '--save-at', String(at), ...signs); // (stored as A plays them; cached, so a look plays only its new rounds' openings)
    return simulate(side, String(n), '--from', states, '--per-round').rounds; // (with --signatures if they were stored with them)
  };

  // Both copies' files, as the experiment began: its looks must all be of
  // the same two (simulate.js would play an edited copy's rounds afresh, and
  // they'd be another experiment's, under this one's plan of looks).
  const filesOf = root => crypto.createHash('sha1').update(['tuning.js', 'ai.js', 'engine.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\u0000')).digest('hex');
  const began = [filesOf(A), filesOf(B)];
  const unchanged = () => [A, B].forEach((r, i) => { if (filesOf(r) !== began[i]) fail(`${'AB'[i]}'s files (${r}) changed during the experiment, so its looks would mix two copies: start it again`); });

  // The looks: a batch more on every seed, till every row it waits for has a verdict.
  let As = [], Bs = [], judged = null, look = 0, n = 0;
  while (look < LOOKS) {
    look++;
    n = Math.min(MAX, look * BATCH);
    As = []; Bs = [];
    for (const seed of seeds) {
      As.push(...(h2h ? roundsOf('A', seed, n) : roundsOf('A', seed, n).map(valuesOf)));
      Bs.push(...(h2h ? roundsOf('B', seed, n) : roundsOf('B', seed, n).map(valuesOf)));
    }
    unchanged();
    judged = judge(As, Bs, { groups, margins, alpha: ALPHA, looks: LOOKS });
    const shown = judged.results.length - judged.waited;
    console.error(`(look ${look} of ${LOOKS}: ${n} rounds a seed, ${As.length} pairs; ${judged.waited - judged.open} of ${judged.waited} rows decided${shown ? `, and ${shown} shown, not waited for` : ''})`);
    if (!judged.open) break;
  }

  const { results, level } = judged, shown = results.filter(x => !x.waited);
  const how = !judged.open ? `stopped after ${n} of ${MAX} rounds a seed (look ${look} of ${LOOKS}): every row ${shown.length ? 'waited for ' : ''}decided` : `all ${MAX} rounds a seed (${LOOKS} looks), some rows still undecided`;
  if (json) {
    console.log(JSON.stringify({ A, B, headToHead: h2h, seeds, at: at == null ? null : Number(at), rounds: n, pairs: As.length, looks: look, plannedLooks: LOOKS, alpha: ALPHA, level, played: spent,
      rows: results.map(({ row, m, verdict, waited }) => ({ key: row.key, label: row.label, unit: row.unit, margin: row.margin, ...(m || {}), verdict, waited })) }));
  } else {
    const pct = x => +(100 * x).toPrecision(4);
    console.log(`A: ${A}\nB: ${B}`);
    console.log(`seeds ${seeds.join(', ')}${at != null ? `, from ${at / 1000}s (stored as A played them)` : ''} · ${As.length} paired rounds${h2h ? ' (head to head: each round played twice, sides swapped; A, B: each side\'s snakes)' : ''} · ${how}`);
    console.log(`intervals: ${pct(1 - ALPHA)}% for all ${results.length} rows over all ${LOOKS} looks at once (each at ${pct(1 - level)}%), so any verdict here is wrong at most ${pct(ALPHA)}% of the time`
      + ` (wrong rows to expect: at most ${ALPHA}) · same: the whole interval within ±margin · higher, lower: B against A`);
    if (shown.length) console.log(`(${[...new Set(shown.map(x => x.row.group))].join(' and ')}: shown, not waited for)`);
    const fmt = (x, unit) => x == null || Number.isNaN(x) ? '-' : (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2)) + unit;
    const signed = (x, unit) => (x > 0 ? '+' : '') + fmt(x, unit);
    const table = results.map(({ row, m, verdict }) => [row.label, m ? fmt(m.a, row.unit) : '-', m ? fmt(m.b, row.unit) : '-', m ? signed(m.diff, row.unit) : '-',
      m ? `[${signed(m.lo, row.unit)}, ${signed(m.hi, row.unit)}]` : '-', verdict === 'same' ? `same (±${row.margin}${row.unit})` : verdict]);
    const head = ['', 'A', 'B', 'B-A', 'interval', 'verdict'], width = head.map((h, i) => Math.max(h.length, ...table.map(r => r[i].length)));
    for (const r of [head, ...table]) console.log(r.map((c, i) => i === 0 || i === 5 ? c.padEnd(width[i]) : c.padStart(width[i])).join('  ').trimEnd());
    const cpu = s => `${spent[s].rounds} rounds, ${Math.round(spent[s].cpu)} s of CPU`;
    console.log(h2h ? `played: ${cpu('A')} (both plays of each round); the rest read back from the cache`
      : `played: A ${cpu('A')}${at != null ? ' (openings included)' : ''}; B ${cpu('B')}; the rest read back from the cache`);
  }
}
