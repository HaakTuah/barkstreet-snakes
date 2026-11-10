// Mushrooms: the shots I could take with one, and the ones I'd dodge.

// Mushrooms come back up (round six B). A segment off a rival's length,
// hit with a spat mushroom, is worth SPIT_SEG of an apple to me (my own
// segment, lost to one, a whole apple); AIM: how much I aim mine (0: I
// spit it wherever I'm facing; times w.aim, my own); SPIT_HIT: the chance I'd guess a shot has
// of landing on a head, when I weigh eating one on purpose (w.spit: how
// much a shot is worth to me; SPIT: anyone's).
// A shot is weighed only at a mushroom within SPIT_NEAR of my head, with a
// rival's head within a spit of it: farther, it's a guess, not a shot.
const SPIT_SEG = 0.5, AIM = 1, SPIT_HIT = 0.35, SPIT = 0.5, SPIT_NEAR = 4;

// Mushrooms come back up (round six B). Where a rival's head will be
// after m more moves, as I'd guess: straight on from where I think it is
// now, till something's in the way.
// (readSpit() sets these for each decision:)
let headAfter, firingAt, appleW, dodge, mySpitAt, aim, closeOn;
function readSpit() {
  headAfter = (k, m) => {
    const o = others[k];
    let x = heads[k].x, y = heads[k].y;
    for (let n = 1; n <= m; n++) {
      const nx = x + o.dir.x, ny = y + o.dir.y;
      if (!inGrid(nx, ny) || otherFree[ny * N + nx] - age > n) break;
      x = nx; y = ny;
    }
    return { x, y };
  };
  // Where I could spit from to hit rival k (the spit flies along the line,
  // 3b+): a cell in line with its head, up to SPIT_REACH off, leading it by
  // the moves the mushroom takes to get there; within `budget` moves of
  // `from`: the nearest such cell, or null.
  firingAt = (k, m, from, budget) => {
    let best = null, bestD = budget + 1;
    for (let j = 1; j <= TUNE.SPIT_REACH; j++) {
      const q = headAfter(k, m + flightMoves(j));
      for (const d of DIR_LIST) {
        const x = q.x - d.x * j, y = q.y - d.y * j, dd = Math.abs(x - from.x) + Math.abs(y - from.y);
        if (inGrid(x, y) && !holes.has(y * N + x) && dd < bestD) { bestD = dd; best = { x, y }; }
      }
    }
    return best;
  };
  // A segment's worth, in what the search counts an apple.
  appleW = w.food * w.foodRange + w.eat;
  // Mushrooms coming at me: one in a rival's cheek flies from its head after
  // the moves its bulge says (as I saw it, `age` ago: it may have gone
  // since, unseen yet), along the line it faces then: likeliest straight
  // on, else to a side; one in the air flies
  // on from where I saw it. I keep my head out of each line, where and when
  // the mushroom would be there, unless my own mouth is full then (it
  // bounces off); a body in its way shields me. Not my own: I slide over it.
  // dodge: [move, cell, what it'd cost me] for each.
  dodge = [];
  const loss = p => Math.min(p || TUNE.SHRINK, me.body.length - TUNE.MIN_LENGTH);
  others.forEach((o, k) => {
    const m = (o.spitIn || 0) - age, v = loss(o.spitPower);
    if (!o.spitIn || m <= -flightMoves(TUNE.SPIT_REACH) - 1 || m > steps || v <= 0) return;
    const p = m >= 0 ? headAfter(k, m) : { x: heads[k].x + o.dir.x * m, y: heads[k].y + o.dir.y * m }; // (gone already, as I reckon it: from where its head was then)
    for (const d of DIR_LIST) if (d.x !== -o.dir.x || d.y !== -o.dir.y) spitLine(p.x, p.y, d, TUNE.SPIT_REACH, m, v * appleW * (sameDir(d, o.dir) ? 1 : 0.5), o.wrap > 0);
  });
  for (const f of view.spits || EMPTY_SPITS) if (f.by !== me.id) spitLine(f.x, f.y, f.dir, f.left, -age, loss(TUNE.SHRINK) * appleW, f.wrap);
  // Mine: after me.spitIn moves it flies from my head, the way I face then.
  // aim: [moves, cell, worth, guess] for each rival head I might hit, where I
  // guess it'll be after as many moves as the mushroom takes to get there (a
  // segment of theirs SPIT_SEG of an apple, as many as it'd shrink them;
  // beside where I guess it'll be, a third: it may turn into it; never just
  // behind, where its neck will be). Two guesses, as even odds (guess 1: a
  // move further on than I reckon, since I may have seen it late): a shot
  // good for both is worth twice one good for either. Not one whose own
  // mouth is full by then: it would bounce off.
  mySpitAt = me.spitIn || 0, aim = [];
  // (Till then, farther off than the search sees: I close in on the rival
  // I'd hit hardest, to a cell in line with its head, at the search's
  // last step. closeOn: [rival, worth].)
  closeOn = [];
  if (AIM && mySpitAt > steps) {
    let bestV = 0, bx = 0, by = 0;
    others.forEach((o, k) => {
      if ((o.spitIn || 0) - age >= mySpitAt) return;
      const v = Math.min(me.spitPower || TUNE.SHRINK, o.body.length - TUNE.MIN_LENGTH), p = v > bestV && firingAt(k, mySpitAt, myHead, mySpitAt);
      if (p) { bestV = v; bx = p.x; by = p.y; }
    });
    if (bestV > 0) closeOn.push(bx, by, AIM * (w.aim ?? 1) * SPIT_SEG * appleW * bestV / 2);
  }
  if (AIM && mySpitAt >= 1 && mySpitAt <= steps) others.forEach((o, k) => {
    if ((o.spitIn || 0) - age >= mySpitAt) return;
    const v = AIM * (w.aim ?? 1) * SPIT_SEG * appleW * Math.min(me.spitPower || TUNE.SHRINK, o.body.length - TUNE.MIN_LENGTH);
    if (v <= 0) return;
    for (let n = mySpitAt; n <= mySpitAt + flightMoves(TUNE.SPIT_REACH) + 1; n++) for (let guess = 0; guess < 2; guess++) {
      const q = headAfter(k, n + guess);
      aim.push(n, q.y * N + q.x, v / 2, guess);
      for (const d of DIR_LIST) if (inGrid(q.x + d.x, q.y + d.y) && !sameDir(d, { x: -o.dir.x, y: -o.dir.y })) aim.push(n, (q.y + d.y) * N + q.x + d.x, v / 6, guess); // (not behind it: its neck by then)
    }
  });
}
const EMPTY_SPITS = [];
// The spit flies along the line (3b+), SPIT_SPEED cells a tick before anyone
// moves: the cell j out is reached after this many more moves (and a head
// that moves onto it where it hangs, one more).
const flightMoves = j => Math.ceil(j / TUNE.SPIT_SPEED) - 1;
// The cell j out from (x, y) the way d, over the edge if it wraps there for the spitter (else off the board).
const lineCell = (x, y, d, j, wrap) => wrap ? [((x + d.x * j) % N + N) % N, ((y + d.y * j) % N + N) % N] : [x + d.x * j, y + d.y * j];
// A mushroom's line, from (x, y) the way d, `left` cells, leaving after m
// moves of mine: where my head would be hit, and when, into dodge (worth v
// to keep out of), till something's in its way.
function spitLine(x, y, d, left, m, v, wrap) {
  for (let j = 1; j <= left; j++) {
    const n = m + flightMoves(j), [cx, cy] = lineCell(x, y, d, j, wrap);
    if (!inGrid(cx, cy) || otherFree[cy * N + cx] - age > n) return; // (off the board, a hole or fire, or a body still there: it stops)
    if (n >= 1 && n >= (me.spitIn || 0)) dodge.push(n, cy * N + cx, v);
    if (j % TUNE.SPIT_SPEED === 0 && j < left && n + 1 >= Math.max(1, me.spitIn || 0)) dodge.push(n + 1, cy * N + cx, v); // (hanging there between ticks)
  }
}
// My own, as I'd face after the move that comes before it flies (from
// x, y the way d): what it's worth, as the first head in its way, by each
// of my guesses where they'll be (aim); nothing past a hole, the edge or a body.
function aimGain(x, y, d) {
  let gain = 0, open = 3; // (bit g: guess g not yet settled)
  for (let j = 1; j <= TUNE.SPIT_REACH && open; j++) {
    const n = mySpitAt + flightMoves(j), [cx, cy] = lineCell(x, y, d, j, me.wrap > 0), c = cy * N + cx, hangs = j % TUNE.SPIT_SPEED === 0 && j < TUNE.SPIT_REACH;
    if (!inGrid(cx, cy)) break;
    const best = [0, 0];
    for (let i = 0; i < aim.length; i += 4) if (aim[i + 1] === c && (aim[i] === n || (hangs && aim[i] === n + 1))) best[aim[i + 3]] = Math.max(best[aim[i + 3]], aim[i + 2]);
    for (let g = 0; g < 2; g++) if (open & (1 << g) && best[g] > 0) { gain += best[g]; open &= ~(1 << g); }
    if (otherFree[c] - age > n) break;
  }
  return gain;
}
