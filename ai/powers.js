// The powers, each weighed as a move (powerPick), and where each comes down:

// - The plain jump and flash spend one stamina (2u), each priced by the
//   share of it it takes (STAMINA_PRICE apples a full bar), and by what it
//   leaves: what's spent on one isn't there for the other. Each of us
//   keeps a reserve: what the other power needs (more or less as I'm
//   cautious: my margin), and a spend that leaves less costs RESERVE_PRICE
//   apples a full bar for the wait till it's back. Out of a trap (every
//   crawl ends in a crash) the reserve is what it's for: no wait is priced.
//   Both at two and a half times what they were (2 and 2.4 apples): the
//   search's guess at what a power gains has to be that much bigger. What
//   a power surely gains, that the crawl can't have (a cut, a flier's ring,
//   an island: sureGain), isn't a guess: each apple of it takes SURE_BACK
//   apples off the price, down to SURE_FLOOR of it, what it was. A race for a golden
//   apple costs nothing: the apple fills the bar it spends.
// - The flash, with its share in the bar: two cells in a tick along the
//   ground, every one of them free by then, only the way I'd crawl anyway
//   (or any way out of a crash). Its full price (when it rested apart, two
//   apples: at one, rivals flashed three times a minute and did no better
//   than the same rivals never flashing, or worse; an edge that small is
//   mostly the search's own guesswork), or half to win a race (food a
//   rival could reach as soon as I'd crawl there, but not as soon as I'd
//   flash), to get out of a crash, or to cut the rival I'm hunting (2u+:
//   at a dash's price of 9.5 s, Sniper stopped cutting). (Weighing every way cost half as
//   much again as the whole decision, for a third more flashes; the rest
//   were no better for it.)
// - Golden dashes: only to cut someone in two (more readily the more
//   aggressive I am), to grab something golden first, or as the way out.
//   (Spent on speed, they stopped cutting anyone.)
// - Golden leaps: whenever one pays (they're free, and held they're wasted).
// - The plain jump: out of a crash, or to come down on food (jumping for
//   position, or just in case, lost when it cost a segment and a rest).
// Desperate, every power is half the price. (Of the others' stamina, I see
// only how tired each looks: see ai/risk.js.)
// A power habit (w.powers: Star's) prices them all far lower, and may
// weigh the flash every way, jump any hurdle there's somewhere to land
// beyond that no rival could get to first, and spend golden dashes on
// speed (at the full price: free, it threw both away at once); by the
// same tests of where each goes (it never takes one into a crash) and the
// same risk where it ends. One that ends where a rival could strike costs
// it the full price.
const STAMINA_PRICE = 5; // (apples, a full bar of stamina: each power costs its share of that; and a meal's stamina is worth as much, see ai/food.js)
const RESERVE_PRICE = 6; // (apples, a full bar's worth of waiting below my reserve)
const SURE_BACK = 1.5; // (apples off a plain power's price for each apple it surely gains)
const SURE_FLOOR = 0.4; // (the least of its price a sure gain leaves: 2 of 5 and 2.4 of 6, the prices before part 7a)
const RESERVE_MARGIN = DRAB.margin; // (the margin, spare room wanted, of a snake that keeps all the other power needs: the default's; less cautious, less; more, more)
// (powerPick() sets these for each call:)
let crawlScore, crawlDir, air, jump, U, habit, safe, cheap, keep, stampM, trapped, boxed, dropping, roomsHere, foodHere, hereFree,
  hereFood, landFood, landCells, pecks, cellAt, freeSoon, inTheWay, path, straight, leapNow, leapFly, leapTurn, ate, ateV,
  ateL, ateG, ateGain, endRisk, idle, muteWas, ateBug, ateWas, meal, bugsOn, cutter, bestPower, ownCut, cutKills, cutTarget, consider,
  waitPrice, sureGain = 0;
function powerPick(crawlIn, crawlDirIn) {
  crawlScore = crawlIn; crawlDir = crawlDirIn;
  air = me.flight || null; // (up on a golden flight: only where to come down is weighed, see leapOpt)
  jump = air || me.leapIn === 0;
  if (me.flashIn !== 0 && !jump) return null;
  U = Math.max(40, foodW * w.foodRange + eatW); // (an apple, to me, now)
  habit = w.powers || NO_HABIT, safe = habit.risk ?? Infinity;
  cheap = desperate ? 0.5 : 1;
  // (the wait a plain spend leaves me below what I keep for the other
  // power. Star (keepFlash) keeps only a flash's worth for its jumps, for
  // its flashes, its trademark, and minds that wait keepFlash as much as
  // anyone; its flashes mind the jump's worth as anyone's do, 7c: spent
  // to the last, it had nothing left to get out of a box)
  waitPrice = (cost, flash) => {
    if (trapped) return 0;
    const reserve = flash ? TUNE.JUMP_STAMINA_MS * w.margin / RESERVE_MARGIN : TUNE.DASH_STAMINA_MS * (habit.keepFlash !== undefined ? 1 : w.margin / RESERVE_MARGIN);
    return RESERVE_PRICE * (flash ? 1 : habit.keepFlash ?? 1) * (w.style ? w.style.keep : 1) * Math.max(0, reserve - (me.stamina - cost)) / TUNE.STAMINA_MS; // (Ghost's style minds it more: ai/styles.js)
  };
  keep = me.grow > 0 ? me.body.length : me.body.length - 1, stampM = ++markStamp;
  for (let j = 0; j < keep; j++) myCells[me.body[j].y * N + me.body[j].x] = stampM;
  trapped = crawlScore < DEAD / 2, boxed = crawlScore < -NECK_COST;
  // (2h: my own tail dropped while I still can, once the search sees me
  // boxed in, not only when every crawl crashes: in the endgame, and all
  // round for a snake that drops readily (Creeper); a late one (Mason)
  // waits for the crash. A boxed snake rarely still has its flash rested,
  // a body one thick and a free cell beyond, so it plans the drop.)
  dropping = trapped || (boxed && (w.drop === 'ready' || (endgame && w.drop !== 'late')));
  roomsHere = new Int32Array(others.length).fill(-1), foodHere = new Int32Array(others.length); // (each rival's room and moves to food as I am, once asked: see shutIn)
  hereFree = -1, hereFood = false, landFood = false, landCells = 0; // (the free log round me, and whether there's food on it: see islandGain) // (boxed: the crawl leaves me less room than I need, or only through a gap a rival could shut)
  pecks = view.pecks; // (the woodpecker's mark, if I'm shown it apart from the holes)
  cellAt = (x, y) => {
    if (me.wrap > 0) { x = (x + N) % N; y = (y + N) % N; } // (the edges wrap for me)
    return inGrid(x, y) ? y * N + x : seenPortals.length ? portalCell(x, y) : -1; // (or through a portal open there)
  };
  freeSoon = i => i >= 0 && myCells[i] !== stampM && mineFree[i] <= 1; // (free by next tick)
  // Leap now (pressed twice, over open ground) is weighed only out of a
  // trap: every crawl ends in a crash. Anywhere else it does what a crawl
  // would, or what the plain hop does a move later at the hurdle, for the
  // tip of my tail and a rest I then don't have for a real hurdle. (Part
  // 4, the rest of the round forked at each use: out of a trap, +0.10 ±
  // 0.07 place a use (206 uses); also over a head-on coming (Ghost's and
  // Desperado's style, a try), −0.02 ± 0.08, and −0.28 before sudden
  // death; weighed everywhere at twice the jump's price, even.) And (2y)
  // down on a flier's ring before it comes down there: see ringCover.
  // Something to hop: a body still there next tick (mine too), or fire;
  // a hole, if I can tell it from the woodpecker's mark (a mark isn't a
  // hole yet: I'd crawl in), or if it's that or a crash.
  inTheWay = i => myCells[i] === stampM || (mineFree[i] > 1 && (mineFree[i] < HOLE || fire.has(i) || (pecks ? !pecks.has(i) : trapped)));
  path = new Int32Array(Math.max(3, TUNE.LEAP_REACH + 1, TUNE.GOLD_FLY + 1));
  straight = new Int32Array(path.length); // (the straight way, kept while a turned flight is tried in path)
  leapNow = false, leapFly = 0, leapTurn = null; // (how the best jump leapOpt found goes: pressed twice, now; held, a golden flight's cells in the air, and its turn: { at: cells flown, dir })
  ate = [-1, -1, -1], ateV = [0, 0, 0];
  ateL = 0, ateG = 0, ateGain = 0, endRisk = 0, idle = false, muteWas = 0, ateBug = 0, ateWas = -HOLE; // (endRisk: the risk where the last one weighed ends; idle: it was a golden dash just for speed; muteWas, ateBug (which beetles, a bit each): for uneat)
  meal = (i, step) => foodValue[i] > 0 && foodFrom[i] <= step; // (food there, on my move `step`)
  // (Each beetle's crawl after my move s + 1, my head then at (hx, hy):
  // the ones I ate there are gone.)
  bugsOn = (s, hx, hy) => { for (let b = 0; b < bugCount; b++) if (ateBug & (1 << b)) { const n = b * BUG_SLOTS + s + 1; bugCell[n] = -1; bugDug[n] = -1; } else bugStep(b, s, s + 1, s, hx, hy, otherBug(b, s)); };
  cutter = !!w.hunt || (w.aggression || 0) >= 0.5; // (the hunters and the aggressive weigh a cut off to the side too)
  bestPower = null, ownCut = -1, cutKills = false, cutTarget = false; // (ownCut, cutKills, cutTarget: see flashOpt)
  consider = (d, flash, v, price, extra, wait = 0, gain = 0, share = 1) => { // (wait: what it leaves me below my reserve, priced apart: a habit doesn't make that free; gain: what it surely gains, a plain power's; share: my power style's, ai/styles.js)
    const full = endRisk > safe || idle;
    idle = false;
    if (v === null) return;
    const cost = (price * (full ? 1 : habit.price) + wait) * cheap;
    v += extra - Math.max(cost * SURE_FLOOR, Math.min(cost * share, cost - SURE_BACK * gain)) * U; // (a sure gain or my style takes it down, the better of the two, to what it was at most)
    const styled = share < 1 || (!flash && coilJump);
    if (v > (bestPower ? bestPower.v : crawlScore + 1)) bestPower = { d, flash, v, now: !flash && leapNow, fly: flash ? 0 : leapFly, turn: flash ? null : leapTurn, styled };
  };
  if (air) { const v = leapOpt(air.dir); return v === null ? null : { d: air.dir, flash: false, v, now: false, fly: leapFly, turn: leapTurn }; } // (in the air: where to come down, from here)
  for (const d of DIR_LIST) {
    if (d.x === -me.dir.x && d.y === -me.dir.y) continue;
    const extra = (intent.mimicDir && sameDir(d, intent.mimicDir) ? w.mimic : 0) - (w.turn && !sameDir(d, me.dir) ? w.turn : 0);
    if (me.dashes > 0) { const v = flashOpt(d, true); if (trapped || cutKills || habit.dashSpend || (dropping && ownCut >= 0)) consider(d, true, v, 0.6, extra); } // (a golden dash, held: out of a trap, or for a cut that puts a rival out; spent so, it gains (see part 4's chosen numbers); spent as it came, −0.11 ± 0.09 place a use; Star (dashSpend), its trademark, spends them as they come)
    else if (me.flashIn === 0 && (dropping || d === crawlDir || habit.everyWay || (cutter && bodyNear(d)) || coverNear(d) || styleWay(d))) { const v = flashOpt(d, false), won = race(d), gold = won && won.kind === 'golden'; consider(d, true, v, gold ? 0 : STAMINA_PRICE * TUNE.DASH_STAMINA_MS / TUNE.STAMINA_MS * (trapped || cutTarget || won ? 0.5 : 1), extra, gold ? 0 : waitPrice(TUNE.DASH_STAMINA_MS, true), sureGain, gold ? 1 : styleShare(d, won, cutTarget)); } // (a golden apple won: it fills the bar; my power style's share: ai/styles.js)
    if (jump) { const v = leapOpt(d); consider(d, false, v, (me.leaps > 0 ? 0.35 : STAMINA_PRICE * TUNE.JUMP_STAMINA_MS / TUNE.STAMINA_MS) * (leapNow ? (w.leapNow ?? 1) : 1), extra, me.leaps > 0 ? 0 : waitPrice(TUNE.JUMP_STAMINA_MS, false), me.leaps > 0 ? 0 : sureGain); } // (leap now, at the jump's price times my style's: only out of a trap, see leapOpt)
  }
  return bestPower;
}

// Along the ground: n cells this tick (path[0..n-1]), eating them.
function groundOpt(n, bonus) {
  let L = me.body.length, g = me.grow;
  for (let i = 0; i < n; i++) { if (g > 0) g--; else L--; L++; }
  if (ownCut >= 0) L = Math.min(L, ownCut); // (my tail dropped)
  const nb = bodies[1];
  for (let j = 0; j < L; j++) {
    if (j < n) { const c = path[n - 1 - j]; nb[j].x = c % N; nb[j].y = (c - nb[j].x) / N; }
    else { const b = me.body[j - n]; nb[j].x = b.x; nb[j].y = b.y; }
  }
  eatOn(path[0], path[1], n > 2 ? path[2] : -1, L, g, 1, 1);
  bugsOn(0, path[n - 1] % N, (path[n - 1] - path[n - 1] % N) / N);
  endRisk = risk[path[n - 1]] + strikes[path[n - 1]] + ringRisk(path[n - 1], 1);
  const gain = bonus + ateGain - endRisk;
  sureGain = Math.max(0, bonus / U); // (a cut, a flier's ring: what the crawl can't have; food on the way it has a tick later)
  powered = true; // (the flash this line starts with: see jumpOut)
  const score = depth > 1 ? search(nb, ateL, ateG, depth - 1, 1, gain) : evaluate(nb, ateL, ateG, 1) + gain;
  covered = 0; powered = false;
  uneat();
  return score;
}

// Eating the cells a power passes (a, b, c; -1: none) on my move
// `step`, as a move eats: what it's worth (ateGain), and my length and
// growth after (ateL, ateG; a mushroom shrinks me). Coughing, nothing
// (and choking on my own bead, I cough from there). The food's off the
// board meanwhile: uneat puts it back. (Food the woodpecker hasn't
// knocked there yet isn't there.)
function eatOn(a, b, c, L, g, soon, step) {
  ate[0] = a; ate[1] = b; ate[2] = c;
  ateGain = 0; muteWas = mute; ateBug = 0; ateWas = ateAt;
  for (let k = 0; k < 3; k++) {
    const i = ate[k];
    ateV[k] = 0;
    if (i < 0 || step <= mute) continue;
    const late = foodFrom[i] > step, here = late ? 0 : foodValue[i];
    let caught = -1;
    for (let q = 0; q < bugCount; q++) if (bugCell[q * BUG_SLOTS + step - 1] === i) { caught = q; break; }
    const v = mealAfter(i, here, L + g) + (caught >= 0 ? bugV[caught] : 0), change = (late ? 0 : foodGrow[i]) + (caught >= 0 ? TUNE.BEETLE_GROWTH : 0);
    if (change < 0) { // (a mushroom: my mouth is full after it, the rest of the way too)
      mute = Math.max(mute, step + TUNE.CHEEK_TICKS);
      let n = -change;
      const fromGrow = Math.min(g, n);
      g -= fromGrow;
      n -= fromGrow;
      for (; n > 0 && L > TUNE.MIN_LENGTH; n--) L--;
    } else g += change;
    if (caught >= 0) ateBug |= 1 << caught;
    if (!v) continue;
    ateGain += v * (foodW * w.foodRange + eatW * soon);
    ateV[k] = here;
    if (!late) foodValue[i] = 0;
    if (v > 0) ateAt = step;
  }
  ateL = L; ateG = g;
}
function uneat() {
  for (let k = 0; k < 3; k++) if (ateV[k]) foodValue[ate[k]] = ateV[k];
  mute = muteWas;
  ateAt = ateWas;
}
