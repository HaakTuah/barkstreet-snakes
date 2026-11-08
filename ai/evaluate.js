// Scoring a line of moves (evaluate), and the board as a line of mine
// leaves it for the rivals (the neck and the hunted rival's room).

// Can my head step into cell (x, y) as move number `step` from now?
function canEnter(body, len, grow, x, y, step) {
  if (!inGrid(x, y) || (mineFree[y * N + x] > step && !(bridgeUntil[y * N + x] > step))) return false; // (a bridge: while it lasts)
  const keep = grow > 0 ? len : len - 1;
  for (let j = 0; j < keep; j++) if (body[j].x === x && body[j].y === y) return false;
  return true;
}

// The board as a line of mine leaves it for the rivals, for the neck
// test: my body is the first `len` cells of `body`, t moves on. Unlike
// `reach`, which reads the board as it is now, the cells my line has
// moved into since are mine from when I got there, so a rival my line has
// sealed off (the one I've pinned against the edge, say) can't come round
// through me. (lineOn marks those cells, in lineMark with lineStamp, and
// when I'm in each, lineIn to lineOut; lineFree: whether a cell is free
// for a rival at s, ticks from now.)
// (readLines() sets these for each decision:)
let lineStamp, lineFree, victimLen, victimShut, ateAt;
function readLines() {
  lineStamp = 0;
  lineFree = (q, s) => reachBlock[q] <= s && (lineMark[q] !== lineStamp || s < lineIn[q] || s >= lineOut[q]);
  // The rival I'm hunting: whether it's sealed in already, with less room
  // than its length, whatever I do (then closing it in is nothing new).
  victimLen = intent.victim >= 0 ? others[intent.victim].body.length : 0;
  lineStamp = -1; // (no line: the board as it is)
  victimShut = intent.victim >= 0 && lineFill(intent.victim, HOLE, victimLen) < victimLen;

  ateAt = -HOLE; // (the step the line being scored last ate at)
}
function lineOn(body, len, grow, t) {
  lineStamp = ++markStamp;
  for (let j = 0, n = Math.min(t, len); j < n; j++) { const p = framed[body[j].y * N + body[j].x]; lineMark[p] = lineStamp; lineIn[p] = t - j; lineOut[p] = len - j + grow + t; }
}
// A timed flood fill over that board from rival k's head (every rival's,
// k < 0), from when it moves again, to `by` at the latest: into lineAt,
// the soonest it's in each cell it gets to (marked in seenH with the stamp
// it returns), or with cap > 0, only how many cells, up to cap (marked in
// lineSeen: what it found for the neck test is kept).
function lineFill(k, by, cap) {
  const stampL = ++markStamp, Q = queue, S = cap > 0 ? lineSeen : seenH, A = lineAt, Wd = W;
  let read = 0, write = 0, count = 0, first = HOLE, last = -HOLE;
  for (let o = 0; o < others.length; o++) if (k < 0 || o === k) { const s0 = (others[o].stun || 0) - age; first = Math.min(first, s0); last = Math.max(last, s0); }
  for (let s = first; s <= by; s++) {
    const levelEnd = write;
    while (read < levelEnd) {
      const p = Q[read++];
      let q = p - Wd;
      if (S[q] !== stampL && lineFree(q, s)) { S[q] = stampL; A[q] = s; Q[write++] = q; count++; }
      q = p + Wd;
      if (S[q] !== stampL && lineFree(q, s)) { S[q] = stampL; A[q] = s; Q[write++] = q; count++; }
      q = p - 1;
      if (S[q] !== stampL && lineFree(q, s)) { S[q] = stampL; A[q] = s; Q[write++] = q; count++; }
      q = p + 1;
      if (S[q] !== stampL && lineFree(q, s)) { S[q] = stampL; A[q] = s; Q[write++] = q; count++; }
    }
    for (let o = 0; o < others.length; o++) { // (a rival moves again from here: where I saw it, as `reach` has it)
      const h = others[o].body[0], p = framed[h.y * N + h.x];
      if ((k < 0 || o === k) && (others[o].stun || 0) - age === s && S[p] !== stampL) { S[p] = stampL; A[p] = s; Q[write++] = p; }
    }
    if ((cap > 0 && count >= cap) || (read === write && s >= last)) break;
  }
  return cap > 0 ? Math.min(count, cap) : stampL;
}
function evaluate(body, len, grow, t) {
  const L = len + grow;
  const head = body[0];
  const headI = head.y * N + head.x;
  // A cell can be entered at absolute time T (ticks from now) once its
  // occupant has left: mineFree (or otherFree, for a rival) <= T, and my
  // own body, placed at time t, needs its own time (len - j + grow for
  // segment j) <= T - t.

  // 1. Room: timed flood fill from my head (tail cells open up as I move).
  //    It also finds the best food by distance alone, ignoring rivals.
  //    queue[read, write) is still to expand; it holds one distance at a time.
  //    Two more things it notes, for the trap tests at the end:
  //    - how soon I can get onto my own trail (a cell my body leaves
  //      before I get there): from there I can chase my tail round and
  //      round, so I'm not trapped however little room there is;
  //    - necks: a distance the fill gets through only one or two cells
  //      wide, while the room before it is less than I need. Everything
  //      beyond is through that gap (its cells, the room before it and
  //      its distance go in `necks`).
  //    It runs on the territory board (see 2.), with my body placed on it
  //    at time t: a cell is free for me at time t + d unless that or
  //    meLater says it's still taken.
  const headP = framed[headI], bodyMark = ++markStamp;
  terr.set(terrFree);
  for (let j = 0; j < len; j++) { const p = framed[body[j].y * N + body[j].x], b = terrFree[p], m = len - j + grow + t; terr[p] = b > m ? b : m; inBody[p] = bodyMark; }
  const cap = L * 2 + 20;
  const need = L + w.margin;
  const stampF = ++markStamp;
  // A contested-food eater keeps searching past the room cap until it sees
  // food, so it looks for food as it goes; anyone else, once it's done.
  const eager = !!w.contested;
  let anyFood = fillRoom(headP, t, cap, need, eager, w.foodRange, mute, bodyMark, stampF, laterCount), space = roomFound[0];
  const trail = roomFound[1], neckCount = roomFound[2];
  if (!eager) { // (the food the fill got to, but my head's own cell)
    for (let k = 0; k < foodCount; k++) {
      const i = foodCells[k], v = foodValue[i], p = framed[i];
      if (v > 0 && seenF[p] === stampF && p !== headP) {
        const at = t + distF[p];
        anyFood = Math.max(anyFood, v * (foodFrom[i] > at ? latePull(w.foodRange, t, at, foodFrom[i], mute) : Math.max(0, w.foodRange + t - Math.max(at, mute + 1))));
      }
    }
  }
  space = Math.min(space, cap);
  // (What the hunting and the thrill (see 4. and on) want of the board as it
  // is, before the territory search claims it: the victim's room, and
  // how much right next to my head is taken a move on, the edge too.)
  const victimRoom = intent.victim >= 0 ? roomOn(framed[heads[intent.victim].y * N + heads[intent.victim].x]) : 0;
  let edge = 0;
  if (w.thrill) for (const q of [headP - W, headP + W, headP - 1, headP + 1]) if (terr[q] > t + 1 || meLater[q] > t + 1) edge++;

  // 2. Territory: multi-source BFS, opponents start at their last seen
  //    head `age` ticks in the past, I start at my head at time t.
  //    Sources go in time order: the rivals all start at -age, and on a
  //    tie I go first. It runs on its own board (terr: see the buffers),
  //    with my body placed on it at time t: a cell is claimed at T + 1
  //    once whoever's in it has left (the free tables count ticks from
  //    now: a rival's search starts in the past, when everything empty
  //    now was empty too), and terr says when that is for anyone, or
  //    whose it is since when: CLAIMED + (T + age) * 2^bits + tag, where
  //    the tag is 1 for me, k + 2 for rival k and 0 once contested.
  const bits = tagBits;
  let ns = 0;
  const meFirst = t <= -age;
  if (meFirst) { srcI[ns] = headP; srcT[ns] = t; srcOwn[ns++] = 1; }
  for (let k = 0; k < others.length; k++) {
    const h = others[k].body[0];
    srcI[ns] = framed[h.y * N + h.x]; srcT[ns] = -age; srcOwn[ns++] = k + 2;
  }
  if (!meFirst) { srcI[ns] = headP; srcT[ns] = t; srcOwn[ns++] = 1; }
  // Once I claim nothing more, the rest is the rivals sharing out what's
  // left among themselves, which counts only for an aggressive snake,
  // or where a rival claims food it can't eat (its own bead): with none
  // of that, the search can stop there.
  spreadTerritory(ns, t, age, bits, tags, !w.aggression, beadCount);
  const mine = tally[0], theirs = tally[1]; // (how many cells are mine, and how many the rivals')

  // 3. Food: a steady pull of foodW per step closer. Normally only food I
  //    reach before any rival counts in full. (What I'd reach with my
  //    mouth full, I'd only nudge: it's a meal once I've spat, if no
  //    rival could get there before that.)
  //    Food the woodpecker will knock to a cell is there from the strike
  //    on: mine as any food is, if I'd get there first (whoever's nearer
  //    is nearer as it lands, if both wait for it), from when it lands.
  let foodScore = 0;
  for (let k = 0; k < foodCount; k++) {
    const i = foodCells[k], v = foodValue[i], s = terr[framed[i]], from = foodFrom[i];
    if (v <= 0 || s < CLAIMED || (s & tags) !== 1) continue; // (not mine: a rival's, or contested)
    let when = ((s - CLAIMED) >> bits) - age, early = 0;
    if (from > when) { early = EARLY * (from - when); when = from; } // (see latePull)
    if (when <= mute && reach[framed[i]] <= mute) continue;
    foodScore = Math.max(foodScore, v * Math.max(0, w.foodRange - (Math.max(when, mute + 1) - t) + early));
  }
  //    The beetles: how soon I'd catch each from here, playing the chase
  //    out (it runs, or digs in), or too far to tell, how far it is;
  //    nothing if it's away first. Mine if it's where I'd get to first
  //    now. A longer chase counts BUG_HURRY times a step further (or
  //    w.hurry: a beetle-eater keeps after one longer).
  for (let b = 0; b < bugCount; b++) {
    const c = bugCell[b * BUG_SLOTS + t];
    if (c < 0) continue;
    const m = bugCatch(b, t, head.x, head.y, otherBug(b, t));
    if (m <= 0) continue;
    const pull = bugV[b] * Math.max(0, w.foodRange - (w.hurry ?? BUG_HURRY) * (m - t));
    if (terr[framed[c]] >= CLAIMED && (terr[framed[c]] & tags) === 1) foodScore = Math.max(foodScore, pull);
    else anyFood = Math.max(anyFood, pull);
    if (bugGold[b]) foodScore = Math.max(foodScore, craving.contested * pull);
  }
  // The rest counts as much as I care (contested: hunger raises it), and
  // with nothing uncontested I drift toward the nearest anyway, more weakly.
  foodScore = Math.max(foodScore, (foodScore ? contested : Math.max(0.3, contested)) * anyFood);
  // A craving: golden power food anywhere, a rival's side or not (as the crow flies; knocked, from when it lands).
  for (let k = 0; k < goldCount; k++) {
    const i = goldCells[k], v = foodValue[i], x = i % N;
    if (v > 0) foodScore = Math.max(foodScore, craving.contested * v * Math.max(0, w.foodRange - Math.max(Math.abs(x - head.x) + Math.abs((i - x) / N - head.y), foodFrom[i] - t)));
  }

  let score = w.space * space
    + w.territory * mine
    - (w.aggression || 0) * theirs
    + foodW * foodScore;

  // 4. Hunting: shrink the victim's room and get in front of it.
  if (intent.victim >= 0) {
    score -= w.hunt.squeeze * victimRoom;
    score -= w.hunt.chase * manhattan(head, intent.target);
  }

  // 5. Distance from rivals: from the nearest head (Ghost), or per rival.
  //    Hungry, I keep less of it, and none desperate: a meal it cost me
  //    was length lost (#325: Ghost lost the most to hunger, its distance
  //    the same within noise without those meals).
  if (w.distance) {
    let nearest = DISTANCE_CAP;
    for (const h of heads) nearest = Math.min(nearest, manhattan(head, h));
    score += w.distance * (1 - hunger) * nearest;
  }
  if (intent.avoid) {
    for (let k = 0; k < heads.length; k++) score += intent.avoid[k] * Math.min(DISTANCE_CAP, manhattan(head, heads[k]));
  }

  // 6. Hovering about `dist` from a chosen snake's head.
  if (intent.lure >= 0) score -= w.lure.weight * Math.abs(manhattan(head, heads[intent.lure]) - w.lure.dist);

  // Heading for a spot (Colonist's next flag).
  if (intent.goal) score -= w.goal * manhattan(head, intent.goal);

  // Desperado: the closer to danger, the better.
  if (w.thrill) {
    for (const h of heads) if (manhattan(head, h) <= 3) edge++;
    score += w.thrill * edge;
  }

  // 7. Staying home.
  if (intent.home) {
    const out = Math.hypot(head.x - intent.home.x, head.y - intent.home.y) - intent.home.radius - TUNE.LAND_REACH;
    if (out > 0) score -= w.home.leave * out;
  }

  // 8. Coiling: once long enough, keeping my head close behind my own tail,
  //    so I move as a ring (anything inside it is boxed in).
  if (w.coil && len >= w.coil.from) score += w.coil.weight * Math.max(0, 5 - manhattan(head, body[len - 1]));

  //    Thick walls (the trappers): my own body beside my head (not my
  //    neck). Doubled back along myself, my wall is two thick: nobody
  //    can hop it, and no plain flash can cut it (round six B: Mason's
  //    double walls).
  if (w.thick) {
    const neckP = framed[body[1].y * N + body[1].x];
    for (const q of [headP - W, headP + W, headP - 1, headP + 1]) if (q !== neckP && inBody[q] === bodyMark) score += w.thick;
  }

  // 9. Riding just behind a rival's tail.
  if (w.tail) {
    let best = 0;
    for (const o of others) {
      if (o.body.length < 8) continue; // short snakes' heads are too close to their tails
      best = Math.max(best, 4 - manhattan(head, o.body[o.body.length - 1]));
    }
    score += w.tail * best;
  }

  // Trapped: less room than I need, and no way onto my own trail.
  if (space < need && trail === HOLE) return score - TRAPPED - 100 * (need - space);
  // Nearly as bad: the room I need is through a neck that a rival could
  // get to and shut before I'm through, leaving me only the pocket on my
  // side of it. (Necks nearest first; one I'd get through well before
  // any rival could get there is mine to pass, and a pocket with my own
  // trail in it I can circle. Where the board as it is now says a rival
  // could, I look again with my line on it: see lineOn.)
  let filled = 0, closes = -1;
  for (let k = 0; k < neckCount; k += 4) {
    const d = necks[k + 3], slack = t - ateAt <= MEAL_PLIES ? MEAL_DAWDLE : d === 1 ? PINNED_DAWDLE : DAWDLE, by = t + d + slack;
    if (trail < d) break;
    const a = necks[k], b = necks[k + 1];
    if (reach[a] > by || reach[b] > by) continue;
    if (!filled) { // (once, as far on as any neck needs)
      let far = 0;
      for (let n = k; n < neckCount; n += 4) far = Math.max(far, necks[n + 3]);
      lineOn(body, len, grow, t);
      filled = lineFill(-1, t + far + Math.max(PINNED_DAWDLE, DAWDLE), 0);
    }
    const shut = seenH[a] === filled && seenH[b] === filled ? Math.max(lineAt[a], lineAt[b]) : HOLE;
    if (shut > by) continue;
    // A pin I close isn't a pin on me either: like a meal, the rival I
    // hunt is against the edge (or a body) only because it was there,
    // and I leave on my next move. So on a line that seals it in (less
    // room than its length, where it had that room), only a rival that
    // could get to the gap about as soon as I could makes it a trap.
    if (shut > t + d + MEAL_DAWDLE && intent.victim >= 0 && !victimShut) {
      if (closes < 0) closes = lineFill(intent.victim, HOLE, victimLen) < victimLen ? 1 : 0;
      if (closes) continue;
    }
    return score - Math.min(NECK_COST + 50 * (need - necks[k + 2]), TRAPPED - 1); // (never worse than a sure trap, however long I am)
  }
  return score;
}
