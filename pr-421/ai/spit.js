// Mushrooms: the shots I could take with one, and the ones I'd dodge.

// Mushrooms come back up (round six B). A segment off a rival's length,
// hit with a spat mushroom, is worth SPIT_SEG of an apple to me (my own
// segment, lost to one, a whole apple); AIM: how much I aim mine (0: I
// spit it wherever I'm facing); SPIT_HIT: the chance I'd guess a shot has
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
  // Where I could spit from to hit rival k after m moves (its head then,
  // as I'd guess it, SPIT_REACH ahead of mine, whichever way I'd face),
  // within `budget` moves of `from`: the nearest such cell, or null.
  firingAt = (k, m, from, budget) => {
    const q = headAfter(k, m), R = TUNE.SPIT_REACH;
    let best = null, bestD = budget + 1;
    for (const d of DIR_LIST) {
      const x = q.x - d.x * R, y = q.y - d.y * R, dd = Math.abs(x - from.x) + Math.abs(y - from.y);
      if (inGrid(x, y) && !holes.has(y * N + x) && dd < bestD) { bestD = dd; best = { x, y }; }
    }
    return best;
  };
  // A segment's worth, in what the search counts an apple.
  appleW = w.food * w.foodRange + w.eat;
  // Rivals with one in their cheek: it comes up SPIT_REACH ahead of their
  // head after the moves their bulge says (as I saw it, `age` ago), aimed
  // as they steer: likeliest straight on, else to a side. I keep my head
  // out of that ring when it comes, unless my own mouth is full then (it
  // bounces off). dodge: [move, cell, what it'd cost me] for each.
  dodge = [];
  others.forEach((o, k) => {
    const m = (o.spitIn || 0) - age;
    if (m < 1 || m > steps || (me.spitIn || 0) >= m) return;
    const loss = Math.min(o.spitPower || TUNE.SHRINK, me.body.length - TUNE.MIN_LENGTH);
    if (loss <= 0) return;
    const p = headAfter(k, m), R = TUNE.SPIT_REACH;
    for (const d of DIR_LIST) {
      if (d.x === -o.dir.x && d.y === -o.dir.y) continue;
      const x = p.x + d.x * R, y = p.y + d.y * R;
      if (inGrid(x, y)) dodge.push(m, y * N + x, loss * appleW * (sameDir(d, o.dir) ? 1 : 0.5));
    }
  });
  // Mine: after me.spitIn moves it comes up SPIT_REACH ahead, the way I
  // face then. aim: [cell, worth] for each rival head I might hit there (a
  // segment of theirs SPIT_SEG of an apple, as many as it'd shrink them;
  // beside where I guess it'll be, a third: it may turn into it). Not one
  // whose own mouth is full by then: it would bounce off.
  mySpitAt = me.spitIn || 0, aim = [];
  // (Till then, farther off than the search sees: I close in on the rival
  // I'd hit hardest, to about SPIT_REACH from its head, at the search's
  // last step. closeOn: [rival, worth].)
  closeOn = [];
  if (AIM && mySpitAt > steps) {
    let bestV = 0, bx = 0, by = 0;
    others.forEach((o, k) => {
      if ((o.spitIn || 0) - age >= mySpitAt) return;
      const v = Math.min(me.spitPower || TUNE.SHRINK, o.body.length - TUNE.MIN_LENGTH), p = v > bestV && firingAt(k, mySpitAt, myHead, mySpitAt);
      if (p) { bestV = v; bx = p.x; by = p.y; }
    });
    if (bestV > 0) closeOn.push(bx, by, AIM * SPIT_SEG * appleW * bestV / 2);
  }
  if (AIM && mySpitAt >= 1 && mySpitAt <= steps) others.forEach((o, k) => {
    if ((o.spitIn || 0) - age >= mySpitAt) return;
    const v = AIM * SPIT_SEG * appleW * Math.min(me.spitPower || TUNE.SHRINK, o.body.length - TUNE.MIN_LENGTH);
    if (v <= 0) return;
    const q = headAfter(k, mySpitAt);
    aim.push(q.y * N + q.x, v);
    for (const d of DIR_LIST) if (inGrid(q.x + d.x, q.y + d.y)) aim.push((q.y + d.y) * N + q.x + d.x, v / 3);
  });
}
