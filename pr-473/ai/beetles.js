// Beetles: where each one goes as the search plays it out, and catching one.

const BUG_AHEAD = 16;    // how many moves ahead I read a beetle's way...
const BUG_HURRY = 2;     // ...and how much a move longer to catch one counts against it, as a step further counts for an apple (a beetle on the run is a meal only while I keep after it: at 1, chases dragged on)
const BUG_WAYS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]; // (the order a beetle weighs its ways in: up, right, down, left)
// The beetles as the search moves them (up to BUGS, as many as can be out
// at once), each in BUG_SLOTS slots from b * BUG_SLOTS: its state after s of its
// crawls (slot s; 0: as it is; BUG_SLOT and the next: playing a chase
// out): its cell (-1: eaten, down a burrow or dug in), its way (in
// BUG_WAYS; -1: none), when it last moved, the tick it's gone if it's
// digging in (0: it isn't), and once it's dug in, where (a burrow's there
// now: -1 for none).
const BUG_SLOT = 10, BUG_SLOTS = BUG_SLOT + 2, BUGS = Math.max(1, TUNE.BEETLE_MAX || 1);
const bugCell = new Int32Array(BUG_SLOTS * BUGS), bugWay = new Int32Array(BUG_SLOTS * BUGS), bugMoved = new Float64Array(BUG_SLOTS * BUGS);
const bugDig = new Float64Array(BUG_SLOTS * BUGS), bugDug = new Int32Array(BUG_SLOTS * BUGS);
const bugV = new Float64Array(BUGS), bugUntil = new Float64Array(BUGS), bugGold = new Uint8Array(BUGS); // (each one's worth, when it flies off, and whether I crave it)
const CHASE_KEY = 8;

// Beetles: their ways are there for anyone to read. One crawls a cell
// every BEETLE_EVERY ticks, straight on till something's in the way; with
// a head within BEETLE_FEAR it scurries, a cell every BEETLE_SCARED_EVERY,
// away from the nearest head (on its way if it can), toward a burrow
// nearer than BEETLE_HOME_REACH, and dives in. Cornered (a head within
// BEETLE_DIG_FEAR and no burrow in reach) it digs in where it is: it
// stays put till it's gone, BEETLE_DIG ticks on, and leaves a burrow
// there. (It wanders a little too, which nobody can read.) The search
// moves each one along with every way it tries (it runs from my head
// where the search puts it), and from where a search ends, it plays each
// chase out: how soon I'd catch it going straight for it, or that it's
// away first. The burrows are the ones anyone can see.
// (readBeetles() sets these for each decision:)
let stampL, stampC, stampN, otherBug, bugRest;
function readBeetles() {
  stampL = 0, stampC = 0, stampN = 0;
  for (let b = 0; b < bugCount; b++) {
    const f = bugFood[b], o = b * BUG_SLOTS;
    bugV[b] = worth.beetle * (f.gold ? 1.5 * craving.power : 1);
    bugGold[b] = f.gold && craving.contested ? 1 : 0;
    bugUntil[b] = f.expires != null ? ticksLeft(f) : Infinity;
    if (desperate) bugUntil[b] = Math.min(bugUntil[b], lifeTicks + 1); // (I'd starve first)
    bugCell[o] = f.y * N + f.x; bugMoved[o] = f.movedAt ?? view.tick; bugDig[o] = f.digUntil > 0 ? f.digUntil : 0; bugDug[o] = -1;
    bugWay[o] = f.dir ? BUG_WAYS.findIndex(d => sameDir(d, f.dir)) : -1;
  }
  if (bugCount) {
    stampL = ++markStamp; stampC = ++markStamp; stampN = ++markStamp; // (my body as it is, and when each cell of it is left: a beetle can't go there)
    me.body.forEach((c, j) => { leaveStamp[c.y * N + c.x] = stampL; leave[c.y * N + c.x] = me.body.length - j + me.grow; });
  }
  // (The other beetle's state in slot s, for beetle b: where it's dug in
  // by then, a burrow's there. -1: there's no other.)
  otherBug = (b, s) => bugCount === 2 ? (1 - b) * BUG_SLOTS + s : -1;
  // A beetle's crawl after my move s + 1 (the tick s from now), with my
  // head then at (hx, hy): beetle b from its state in slot `from` into slot
  // `to`. In the engine's order: digging in, it stays put till it's gone;
  // cornered, it digs in; or it crawls, when it's time; then the
  // woodpecker's strike, which knocks it out of the mark. other: where
  // another beetle's state is then (see otherBug).
  bugRest = Math.min(TUNE.BEETLE_SCARED_EVERY, TUNE.BEETLE_EVERY); // (it never crawls sooner than this)
}
// (For a beetle on cell c, at (x, y): the nearest rival's head, as I
// reckon they are now, and the nearest burrow in reach, worked out the
// first time a beetle's there.)
function bugNear(c, x, y) {
  let d = HOLE, who = -1, home = -1, gap = TUNE.BEETLE_HOME_REACH;
  for (let k = 0; k < others.length; k++) { const e = Math.abs(x - headX[k]) + Math.abs(y - headY[k]); if (e < d) { d = e; who = k; } }
  for (let k = 0; k < burrows.length; k++) { const h = burrows[k], g = Math.abs(h % N - x) + Math.abs((h - h % N) / N - y); if (g < gap) { gap = g; home = h; } }
  nearStamp[c] = stampN; nearHead[c] = d; nearWho[c] = who; nearHome[c] = home; nearGap[c] = gap; nearBeak[c] = beakOf ? engine.beakGap(mark, beakOf, x, y) : 99;
}
function bugStep(b, from, to, s, hx, hy, other) {
  const o = b * BUG_SLOTS, p = o + from, n = o + to, c = bugCell[p];
  bugCell[n] = c; bugWay[n] = bugWay[p]; bugMoved[n] = bugMoved[p]; bugDig[n] = bugDig[p]; bugDug[n] = bugDug[p];
  if (c < 0) return;
  const now = view.tick + s;
  bugCrawl(o, n, c, now, s, hx, hy, other >= 0 ? bugDug[other] : -1);
  if (now === strikeAt && bugCell[n] >= 0 && mark.has(bugCell[n])) knockBug(n);
}
function bugCrawl(o, n, c, now, s, hx, hy, dug) {
  const x = c % N, y = (c - x) / N;
  if (nearStamp[c] !== stampN) bugNear(c, x, y);
  const gap = beakOf && now <= strikeAt ? nearBeak[c] : 99, beak = -gap; // (the beak, as the engine's crawl has it: how far off the mark, less than 0 on it)
  if (bugDig[n] > 0 && gap < 0 && bugDig[n] > strikeAt) bugDig[n] = 0; // (a dig it can't finish before the strike: it runs instead)
  if (bugDig[n] > 0) { if (now >= bugDig[n]) { bugCell[n] = -1; bugDug[n] = gap < 0 ? -1 : c; } return; } // (digging in: there till it's gone, and a burrow's there, unless the beak's coming)
  let home = nearHome[c], homeGap = nearGap[c]; // (the nearest burrow in reach: another beetle's dig leaves one too)
  if (dug >= 0) { const g = Math.abs(dug % N - x) + Math.abs((dug - dug % N) / N - y); if (g < homeGap) { homeGap = g; home = dug; } }
  const since = now - bugMoved[n];
  let fear = Math.abs(x - hx) + Math.abs(y - hy), fx = hx, fy = hy, plan = 0;
  if (nearHead[c] < fear) { const k = nearWho[c]; fear = nearHead[c]; fx = headX[k]; fy = headY[k]; }
  const beaked = gap <= TUNE.BEETLE_FEAR;
  if (gap < 0) { // (under the beak: home if it can get there first, else off the mark, else it digs in, if it can be gone in time)
    const E = TUNE.BEETLE_SCARED_EVERY, first = Math.max(now, bugMoved[n] + E), inTime = m => first + E * (m - 1) <= strikeAt;
    if (home >= 0 && inTime(homeGap)) plan = 1;
    else if (inTime(beak)) plan = 2;
    else if (now + TUNE.BEETLE_DIG <= strikeAt) { bugDig[n] = now + TUNE.BEETLE_DIG; return; }
    else plan = 2;
    if (plan !== 1) home = -1;
    if (since < E) return;
  } else {
    if (home >= 0 && since < bugRest) return; // (too soon to crawl, scared or not, and with a burrow in reach it won't dig)
    if (home < 0 && fear <= TUNE.BEETLE_DIG_FEAR) { bugDig[n] = now + TUNE.BEETLE_DIG; return; } // (cornered: it digs in, and stays put)
    if (since < (fear <= TUNE.BEETLE_FEAR || beaked ? TUNE.BEETLE_SCARED_EVERY : TUNE.BEETLE_EVERY)) return;
    if (fear > TUNE.BEETLE_FEAR && !beaked) home = -1; // (only a scared one runs for home)
  }
  const fled = fear <= TUNE.BEETLE_FEAR, scared = fled || beaked;
  let best = -1, bestScore = -Infinity;
  for (let k = 0; k < 4; k++) {
    const nx = x + BUG_WAYS[k].x, ny = y + BUG_WAYS[k].y, ni = ny * N + nx;
    if (nx < 0 || ny < 0 || nx >= N || ny >= N || (mineFree[ni] > s + 1 && !(plan && beakOf.has(ni))) || (leaveStamp[ni] === stampL && leave[ni] > s + 1) || (nx === hx && ny === hy) || (ni !== bugCell[o] && marks[ni] >= stampFood && marks[ni] < marksEnd)) continue;
    let score = 0.5; // (its wandering, on average)
    const way = bugWay[n];
    if (k === way) score += 1.5; else if (way >= 0 && k === (way + 2) % 4) score -= 1;
    if (fled) score += 3 * (Math.abs(nx - fx) + Math.abs(ny - fy) - fear);
    if (home >= 0) score += (plan === 1 ? 4 : 2) * (homeGap - Math.abs(home % N - nx) - Math.abs((home - home % N) / N - ny));
    if (plan === 2 || (!plan && beaked)) { if (nearStamp[ni] !== stampN) bugNear(ni, nx, ny); score += 3 * (nearBeak[ni] - gap); }
    if (score > bestScore) { bestScore = score; best = k; }
  }
  if (best < 0) return;
  const ni = c + BUG_WAYS[best].y * N + BUG_WAYS[best].x;
  bugCell[n] = scared && (ni === dug || burrows.includes(ni)) ? -1 : ni; bugWay[n] = best; bugMoved[n] = now;
}
// The strike: a beetle still in the mark is the bird's (round six B, 2m).
function knockBug(n) {
  bugCell[n] = -1; bugDug[n] = -1; bugDig[n] = 0;
}
// From a search's end (my head at (hx, hy) after t moves): the move I'd
// catch beetle b on, going straight for it (the longer way first); too
// far to tell, as many moves again as it's away then; or -1 if it's away
// first (down a burrow, dug in, flown off, or I'd starve). (Searches that
// end on the same cell, the beetle as it was, play out the same chase:
// it's worked out once.)
function bugCatch(b, t, hx, hy, other) {
  const p = b * BUG_SLOTS + t, at = b * N * N + hy * N + hx, k = CHASE_KEY * at, dug = other >= 0 ? bugDug[other] : -1;
  if (chaseKey[k] === stampC && chaseKey[k + 1] === t && chaseKey[k + 2] === mute && chaseKey[k + 3] === bugCell[p] && chaseKey[k + 4] === bugWay[p] && chaseKey[k + 5] === bugMoved[p] && chaseKey[k + 6] === bugDig[p] && chaseKey[k + 7] === dug) return chase[at];
  chaseKey[k] = stampC; chaseKey[k + 1] = t; chaseKey[k + 2] = mute; chaseKey[k + 3] = bugCell[p]; chaseKey[k + 4] = bugWay[p]; chaseKey[k + 5] = bugMoved[p]; chaseKey[k + 6] = bugDig[p]; chaseKey[k + 7] = dug;
  return (chase[at] = playChase(b, t, hx, hy, other));
}
function playChase(b, t, hx, hy, other) {
  const o = b * BUG_SLOTS;
  let from = BUG_SLOT;
  const p = o + t, q = o + from;
  bugCell[q] = bugCell[p]; bugWay[q] = bugWay[p]; bugMoved[q] = bugMoved[p]; bugDig[q] = bugDig[p]; bugDug[q] = bugDug[p];
  for (let m = t + 1; m <= BUG_AHEAD; m++) {
    const c = bugCell[o + from];
    if (c < 0 || m >= bugUntil[b]) return -1;
    const x = c % N, y = (c - x) / N, dx = Math.sign(x - hx), dy = Math.sign(y - hy);
    const along = Math.abs(x - hx) >= Math.abs(y - hy), nx = along ? hx + dx : hx, ny = along ? hy : hy + dy;
    if (!(mineFree[ny * N + nx] > m)) { hx = nx; hy = ny; } else if (along && dy) hy += dy; else if (!along && dx) hx += dx;
    if (hx === x && hy === y && m > mute) return m;
    const to = from === BUG_SLOT ? BUG_SLOT + 1 : BUG_SLOT;
    bugStep(b, from, to, m - 1, hx, hy, other);
    from = to;
  }
  const c = bugCell[o + from];
  if (c < 0) return -1;
  const m = BUG_AHEAD + Math.abs(c % N - hx) + Math.abs((c - c % N) / N - hy);
  return bugDig[o + from] > 0 && view.tick + m - 1 > bugDig[o + from] ? -1 : m; // (digging in: gone before I'd get there)
}
