// The flash and golden dashes, weighed as moves (see powerPick in ai/powers.js):
// a race to food, a cut through a rival, and what's worth flashing for.

// A race: food straight on, or that way, that a rival could get to
// just as soon as I'd crawl there (but not as soon as I'd flash there,
// a tick sooner).
function race(d) {
  for (const f of food) {
    const i = f.y * N + f.x, k = Math.abs(f.x - myHead.x) + Math.abs(f.y - myHead.y);
    if (foodValue[i] > 0 && reach[framed[i]] === k && Math.abs(f.x - myHead.x - 2 * d.x) + Math.abs(f.y - myHead.y - 2 * d.y) === k - 2) return true;
  }
  return false;
}

// The cells a power passes, from my head, into path; false if one's off the board.
function trace(d, n) {
  let x = myHead.x, y = myHead.y;
  for (let i = 0; i < n; i++) {
    const c = cellAt(x + d.x, y + d.y);
    if (c < 0) return false;
    x = c % N; y = (c - x) / N;
    path[i] = c;
  }
  return true;
}

// A flash, as the engine takes it (round six B: the flashes cut): the
// plain one FLASH_LENGTH cells this tick along the ground, a golden one
// (a dash) DASH_LENGTH. Through a body up to FLASH_THICK thick (a dash,
// DASH_THICK) with free log beyond it, it cuts it: a rival's (worth its
// tail to me in apples, more readily the more aggressive I am, and its
// life if I leave it fewer than MIN_LENGTH in front: the neck cut) or my
// own (dropping my tail: the search sees the room it leaves me, less
// the length). Never a flash that fails (into the edge, a hole or the
// woodpecker's mark, a head, a body too thick or with nothing free
// beyond), nor a plain one into a second fire. (ownCut: my body's
// length after, if I cut my own.)
function flashOpt(d, gold) {
  const n = gold ? TUNE.DASH_LENGTH : TUNE.FLASH_LENGTH, thick = gold ? TUNE.DASH_THICK : TUNE.FLASH_THICK;
  if (!trace(d, n)) return null;
  const agg = (w.aggression || 0) + (w.hunt ? 0.5 : 0);
  const body = i => myCells[i] === stampM || (mineFree[i] > 1 && (!holes.has(i) || (fire.has(i) && others.some(o => o.body.some(q => q.y * N + q.x === i))))); // (mine, or a rival's that'll still be there, on fire too)
  let cut = 0, got = false, fires = 0, run = 0;
  ownCut = -1; cutKills = false; covered = 0;
  for (let i = 0; i < n; i++) {
    const c = path[i];
    if (holes.has(c) && !fire.has(c)) return null; // (a hole, or the woodpecker's mark: it'd fail or blow up, or soon)
    if (fire.has(c) && !gold && fires++) return null; // (a second fire: it'd go in)
    if (ringCover.length) { cut += coverAt(c, i + 2 - n) / U; covered |= coverHit; } // (my body on a flier's ring from this move: see ringCover)
    if (!run && body(c)) {
      let r = 0, b = c, bx = c % N, by = (c - bx) / N;
      for (; r <= thick && b >= 0 && body(b); r++) { bx += d.x; by += d.y; b = cellAt(bx, by); }
      if (r > thick || b < 0 || pitHole(b) || myCells[b] === stampM || mineFree[b] > 1) return null; // (too thick, or nothing free beyond: it'd fail)
      for (let k = 0, x = c % N, y = (c - x) / N; k < r && i + k < n; k++, x += d.x, y += d.y) { // (a layer beyond its reach isn't cut: it's only why it can't go on)
        if (myCells[cellAt(x, y)] === stampM) { // (my own: my tail drops, only to get out of a trap)
          const j = me.body.findIndex(q => q.x === x && q.y === y);
          if (j < TUNE.MIN_LENGTH || !trapped) return null; // (only when it's that or the end: dropped any sooner (boxed), rivals dropped 5 tails a round and starved small)
          if (ownCut < 0 || j + n - 1 < ownCut) ownCut = j + n - 1;
          continue;
        }
        let o = null, j0 = -1;
        for (const q of others) { j0 = q.body.findIndex(p => p.x === x && p.y === y); if (j0 >= 0) { o = q; break; } }
        if (!o || j0 === 0) return null; // (a head, or where one may be)
        const j = j0 + Math.max(0, age - (o.stun || 0)); // (where it's cut: it's moved on since I saw it)
        const mark = o.id === memory.victimId ? 2 : 1; // (my target, twice over: Sniper cuts off its target, Mute its boxed one)
        if (j < TUNE.MIN_LENGTH) cutKills = true; // (it's out)
        cut += mark * (j < TUNE.MIN_LENGTH ? KILL * (0.5 + agg) : Math.min(CUT_TAIL, Math.max(0, o.body.length - j)) * 0.1 * (0.5 + agg)); // (in apples: out, or its tail off, up to CUT_TAIL of it: at 0.4 a segment, uncapped, rivals cut 14 times a round and the beads swamped the board; at 0.15, 10 times, and the cut starved small)
      }
      run = r;
    }
    if (run) run--;
    if (gold) for (const f of food) if (f.y * N + f.x === c && (f.kind === 'golden' || f.kind === 'leaf' || f.kind === 'goldcap' || f.gold)) got = true;
  }
  if (covered & sureCover) cutKills = true; // (it's out, near enough sure)
  if (gold && !cut && !got && !trapped && ownCut < 0) { // (just for speed: only a habit's, and at anyone's price, so only for a real gain; free, it spent both at once, a zig-zag that got it nothing)
    if (!habit.dashSpend) return null;
    idle = true;
  }
  return groundOpt(n, cut * U);
}
// Is there a body within a flash's reach that way (worth weighing a cut there)?
function bodyNear(d) {
  for (let i = 1, x = myHead.x, y = myHead.y; i <= TUNE.FLASH_LENGTH; i++) {
    const c = cellAt(x += d.x, y += d.y);
    if (c < 0) return false;
    if (myCells[c] === stampM || (!holes.has(c) && mineFree[c] > 1)) return true;
  }
  return false;
}
// ...or a flier's ring I'd lie on in time (see ringCover)?
function coverNear(d) {
  if (!ringCover.length) return false;
  for (let i = 1, x = myHead.x, y = myHead.y; i <= TUNE.FLASH_LENGTH; i++) {
    const c = cellAt(x += d.x, y += d.y);
    if (c < 0) return false;
    if (coverAt(c, i + 1 - TUNE.FLASH_LENGTH)) return true;
  }
  return false;
}
