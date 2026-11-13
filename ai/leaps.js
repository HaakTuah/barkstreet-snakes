// The jump and golden flights, weighed as moves (see powerPick in ai/powers.js):
// where each comes down, a flier's ring to take or to spare, a rival shut in
// by my landing, and a landing on an island that's doomed.

// The island hop, as the engine takes it: up over what's right in
// front, on over up to LEAP_REACH cells of hurdles, a cell a tick, and
// down on the first free cell beyond, the tick after the last (span:
// the cells it goes over; down span + 1 moves from now).
function leapOpt(d) {
  const golden = !!air || me.leaps > 0;
  leapNow = false; leapFly = 0; leapTurn = null;
  let span = 0, n = 0; // (n: the cells on the board traced)
  // (In the air: the cells I can still fly, GOLD_FLY less those flown;
  // path[0] is the next cell, path[far] where I come down.)
  const far = air ? TUNE.GOLD_FLY - air.flown : golden ? TUNE.GOLD_FLY : TUNE.LEAP_REACH;
  if (far < 0) return null;
  for (let x = myHead.x, y = myHead.y; n <= far; ) {
    const c = cellAt(x + d.x, y + d.y);
    if (c < 0) break; // (never off the board)
    x = c % N; y = (c - x) / N;
    path[n++] = c;
  }
  if (!n) return null;
  // The island hop, as the engine takes it: up over what's right in
  // front, on over up to LEAP_REACH cells of hurdles, and down on the
  // first free cell beyond, or a bridge that lasts. Over open ground,
  // leap now (pressed twice): over LEAP_REACH cells, down on the next,
  // else the farthest free short of it. Golden, held: on, always
  // GOLD_FLY cells in the air (2y), or the last before the edge.
  // (Safe, for the moves of round six B, part 4 (leap now, flying on,
  // steering): only where no rival's head could get before I come down,
  // and leave its body there. Coming down on a body is the end, and at
  // first they did it 0.6 times a round, and lost the head-to-head for it.
  // Up in the air (2y), with rivals coming for my ring, a landing one
  // could get to first is priced instead (landOpt): a wall, and I'd dive
  // for the cramped spots nobody can reach.)
  const lands = (i, safe) => i < n && (freeSoon(path[i]) || bridgeUntil[path[i]] > i + 1) && !(safe && reach[framed[path[i]]] <= i);
  let first = -1, now = false;
  if (air) first = 0; // (in the air I pass over whatever's below: down on any free cell from the next on)
  else if (inTheWay(path[0])) {
    for (span = 1; span <= Math.min(TUNE.LEAP_REACH, n - 1); span++) if (!inTheWay(path[span])) break;
    if (span > Math.min(TUNE.LEAP_REACH, n - 1)) for (span = 1; span <= Math.min(TUNE.LEAP_REACH, n - 1); span++) if (bridgeUntil[path[span]] > span + 1) break; // (as the engine: a bridge that lasts only when no free cell is in reach)
    if (span > TUNE.LEAP_REACH || span >= n || !lands(span, false)) return null;
    first = span;
  } else {
    if (!golden && !trapped && !ringCover.length) return null; // (leap now: only out of a trap, above, or down on a flier's ring before it)
    for (span = Math.min(TUNE.LEAP_REACH, n - 1); span >= 1 && !lands(span, false); span--); // (where the engine puts it down: the farthest free cell; safe or not, below)
    if (span < 1 || (!golden && !trapped && !coverAt(path[span], span + 1))) return null;
    first = span; now = true;
  }
  let bestS = null, bestSpan = first;
  const full = Math.min(far, n - 1); // (a held flight's landing)
  for (let k = air ? full : first; k <= (golden ? full : first); k += Math.max(1, full - first)) {
    if ((k > first || now || air) && !lands(k, !air)) continue; // (a leap now or flying on: only down where it's safe; from the air, anywhere free, a rival that could be there first priced, see landOpt)
    const v = landOpt(d, k, golden, now);
    if (v !== null && (bestS === null || v > bestS)) { bestS = v; bestSpan = k; }
  }
  // Golden, steered: on that way for `at` cells, then a turn (left or
  // right: the engine's airTurn, a person's as much as mine), and on,
  // down GOLD_FLY cells in the air (or the last before the edge), if
  // better than flying straight.
  let turn = null;
  if (golden) {
    straight.set(path);
    const n0 = n;
    for (const d2 of DIR_LIST) {
      if (d2.x === d.x || d2.y === d.y) continue; // (a turn: not on, nor back)
      for (let at = air ? 0 : 1; at < far; at++) { // (in the air, a turn now: the next cell already that way)
        if (at >= n0) break; // (a turn over a cell I can still fly past: as the engine (flyOn), never over the last before the edge, where I come down)
        path.set(straight);
        n = at;
        for (let x = at ? path[at - 1] % N : myHead.x, y = at ? (path[at - 1] - path[at - 1] % N) / N : myHead.y; n <= far; ) {
          const c = cellAt(x + d2.x, y + d2.y);
          if (c < 0) break;
          x = c % N; y = (c - x) / N;
          path[n++] = c;
        }
        for (let k = Math.max(at, n - 1); k < n; k++) {
          if (!lands(k, !air)) continue;
          const v = landOpt(d2, k, true, now);
          if (v !== null && (bestS === null || v > bestS)) { bestS = v; bestSpan = k; turn = { at, dir: d2 }; }
        }
      }
    }
    path.set(straight); n = n0;
  }
  leapNow = now; leapTurn = turn; leapFly = golden && (turn || bestSpan > first || (air && bestS !== null)) ? bestSpan : 0;
  return bestS;
}
// A jump along d down on path[span], span + 1 moves from now (the cells before it in the air).
function landOpt(d, span, golden, now) {
  const land = path[span];
  const down = span + 1;
  sureGain = 0;
  const isle = islandGain(land);
  const doom = doomed(land, span, golden);
  if (doom >= 0) return DEAD + (span + 1 + doom) * 1000; // (the death it is, that many moves on: taken only if staying is worse)
  if (!golden && !boxed && !isle && !meal(land, down) && !now) { // (the plain jump: out of a crash or a box, to an island, or onto food, or just short of it)
    const lx = land % N, past = cellAt(lx + d.x, (land - lx) / N + d.y);
    // (A habit's jump, for its own sake, only where no rival could get
    // to the landing before I'm down: one moving in as I take off and
    // the jump doesn't go, and I crawl into what I meant to hop.)
    if (!(past >= 0 && meal(past, down + 1)) && !(habit.jumpAny && reach[framed[land]] > down)) return null;
  }
  let L = me.body.length, g = me.grow;
  for (let i = 0; i <= span; i++) { if (g > 0) g--; else L--; L++; }
  const nb = bodies[down];
  for (let j = 0; j < L; j++) {
    if (j <= span) { const c = path[span - j]; nb[j].x = c % N; nb[j].y = (c - nb[j].x) / N; }
    else { const b = me.body[j - span - 1]; nb[j].x = b.x; nb[j].y = b.y; }
  }
  for (let s = 0; s < span; s++) for (let b = 0; b < bugCount; b++) bugStep(b, s, s + 1, s, path[s] % N, (path[s] - path[s] % N) / N, otherBug(b, s)); // (a beetle runs from me in the air, and I come down where it is then)
  const shut = golden ? shutIn(nb, L, g, down, land) : 0; // (before it eats: the body as it comes down)
  eatOn(-1, land, -1, L, g, 0.85, down); // (it eats where it lands)
  bugsOn(span, land % N, (land - land % N) / N);
  endRisk = risk[land] + strikes[land] + ringRisk(land, down) + (air ? contest(land, down) : 0);
  const take = coverAt(land, down), lone = golden && !air && span === TUNE.GOLD_FLY && !spare(span); // (down on a flier's ring before it; a held flight with nowhere else to come down, see spare)
  covered = coverHit;
  const gain = ateGain + isle * U - 0.6 * endRisk + shut * U + take - (lone ? SPARE * U : 0);
  sureGain = Math.max(0, isle + shut + take / U); // (what the crawl can't have: the island, a rival shut in, a flier's ring; see consider)
  const score = depth > down ? search(nb, ateL, ateG, depth - down, down, gain) : evaluate(nb, ateL, ateG, down) + gain;
  covered = 0;
  uneat();
  return score;
}
// Up in the air (2y): each rival on the ground that could get to where
// I'd come down before I'm down (as I last saw it), a head-on's price,
// twice if it was heading straight for it.
function contest(land, down) {
  const lx = land % N, ly = (land - lx) / N;
  let v = 0;
  others.forEach((o, k) => {
    if (o.air || Math.abs(heads[k].x - lx) + Math.abs(heads[k].y - ly) > down - 1) return;
    let line = 1;
    for (let m = 1; m < down && line === 1; m++) if (heads[k].x + o.dir.x * m === lx && heads[k].y + o.dir.y * m === ly) line = 2;
    v += line * w.headRisk;
  });
  return v;
}
// Is there another safe landing left, from the cell I'm over two moves
// before I'd be down on path[span] (the last turn I could make: on, or
// to a side, three cells)? A held flight without one is a dead ring
// if a rival comes for it.
function spare(span) {
  const base = path[span - 3], prev = span > 3 ? path[span - 4] : myHead.y * N + myHead.x;
  const bx = base % N, ix = unit(bx - prev % N), iy = unit((base - bx) / N - (prev - prev % N) / N);
  for (const e of DIR_LIST) {
    if (e.x === -ix && e.y === -iy) continue;
    let c = base;
    for (let s = 0; s < 3 && c >= 0; s++) c = cellAt(c % N + e.x, (c - c % N) / N + e.y);
    if (c >= 0 && c !== path[span] && freeSoon(c) && reach[framed[c]] > span) return true;
  }
  return false;
}

// A flight down to cut a rival off, in apples: the owner's flight, where
// "someone really skillful can time cutting someone else off midair".
// Each rival near where I'd land: its room (roomOf: from its head, my
// body in the way, what it gets to in SHUT_MOVES moves) as I am, and
// with me down there; the share of that I'd take away (in its way, or
// shut in against bodies, holes or the edge) is worth SHUT_IN apples;
// and the moves on to its nearest food (up to
// FOOD_CUT), SHUT_FOOD apples, all of them. As much more as I'm
// aggressive (a hunter's victim twice, as with the cut), half to one
// holding a golden jump (its pips show it can hop out).
function shutIn(nb, L, g, down, land) {
  const agg = (w.aggression || 0) + (w.hunt ? 0.5 : 0);
  if (!agg) return 0;
  const lx = land % N, ly = (land - lx) / N;
  const near = k => Math.abs(heads[k].x - lx) + Math.abs(heads[k].y - ly) <= TUNE.GOLD_FLY + 2;
  let v = 0, placed = false;
  for (let k = 0; k < others.length; k++) { // (each near rival's room as I am, first: my own body alone in ownFree)
    if (!near(k) || roomsHere[k] >= 0) continue;
    body0ToOwnFree(me.body, me.body.length, me.grow); roomsHere[k] = roomOf(k, 0, SHUT_MOVES); foodHere[k] = Math.min(FOOD_CUT, roomFood); clearOwnFree(me.body, me.body.length);
  }
  for (let k = 0; k < others.length; k++) { // (...then with me down there)
    const o = others[k], before = roomsHere[k];
    if (!near(k) || !before) continue;
    if (!placed) { body0ToOwnFree(nb, L, g); placed = true; }
    const after = roomOf(k, down, SHUT_MOVES), late = Math.min(FOOD_CUT, roomFood) - foodHere[k];
    const cut = Math.max(0, SHUT_IN * (before - after) / before) + Math.max(0, SHUT_FOOD * late / FOOD_CUT);
    if (cut > 0) v += (o.id === memory.victimId ? 2 : 1) * (o.leaps > 0 ? 0.5 : 1) * (0.5 + agg) * cut;
  }
  if (placed) clearOwnFree(nb, L);
  return v;
}

// The island a jump reaches, in apples: folded up where I am, with
// less free log round me than my length, or no food on it (the strip
// the owner saw Gobbler fold up and die on), the free log I'd land on
// beyond what I have here, per my length (at most 2), and an apple
// more if there's food there and none here. Free log: cells I can
// crawl to without crossing a hole (but on a bridge), nobody's body on them (counted up
// to 3 lengths). 0 where I'm not cramped, the far side is no roomier,
// or it's the same log (I could crawl there).
function islandGain(land) {
  const L = me.body.length, cap = 3 * L, headI = myHead.y * N + myHead.x;
  if (hereFree < 0) { hereFree = landFree(headI, cap); hereFood = landFood; }
  if (hereFree >= L && hereFood) return 0;
  const there = landFree(land, cap);
  if (visited[headI] === markStamp || there <= hereFree) return 0;
  return Math.min(2, (there - hereFree) / L) + (landFood && !hereFood ? 1 : 0);
}
// 2r, no hop onto a doomed island: where I'd come down is another
// piece of log (not joined to mine) with less free room than my
// length, and I can't jump off it again (a hop from its rim to other
// log, with a jump's worth of stamina back before I've filled it up). The owner (30
// October 2026): "I see snakes jumping onto small islands where they
// have no chance to survive for very long". The moves I'd live there,
// or -1 if it isn't doomed.
function doomed(land, span, golden) {
  const L = me.body.length;
  const room = landFree(land, L), stampS = markStamp, cells = landCells;
  if (room >= L || visited[myHead.y * N + myHead.x] === stampS) return -1;
  const tickMs = Math.max(TUNE.MIN_TICK, TUNE.START_TICK - (TUNE.START_TICK - TUNE.MIN_TICK) * (view.timeMs || 0) / TUNE.RAMP_MS);
  const rest = golden ? (me.leaps > (air ? 0 : 1) ? 0 : Math.max(0, TUNE.JUMP_STAMINA_MS - me.stamina)) : Math.max(0, 2 * TUNE.JUMP_STAMINA_MS - me.stamina); // (till a jump's worth of stamina is back, from when it takes off: this one's spent, if plain)
  if (rest / tickMs - (span + 1) + 1 >= room) return room; // (its rest left once down, and a move to hop off: it fills the island first)
  for (let q = 0; q < cells; q++) for (let k = 0; k < 4; k++) { // (a hop off: from a cell of it, over 1 to LEAP_REACH cells of holes, onto other log)
    let j = nbr[4 * queue[q] + k], over = 0;
    while (j >= 0 && over <= TUNE.LEAP_REACH && holes.has(j) && !(bridgeUntil[j] > 0)) { over++; j = nbr[4 * j + k]; }
    if (over >= 1 && over <= TUNE.LEAP_REACH && j >= 0 && visited[j] !== stampS) return -1;
  }
  return room;
}
function landFree(start, cap) {
  const stampS = ++markStamp;
  visited[start] = stampS;
  queue[0] = start;
  let read = 0, write = 1, n = 0;
  landFood = false;
  while (read < write && n < cap) {
    const i = queue[read++];
    if (myCells[i] !== stampM && mineFree[i] <= 1) n++;
    if (foodValue[i] > 0) landFood = true;
    for (let k = 4 * i; k < 4 * i + 4; k++) {
      const j = nbr[k];
      if (j < 0 || visited[j] === stampS || (holes.has(j) && !(bridgeUntil[j] > 0))) continue; // (a bridge leads on)
      visited[j] = stampS;
      queue[write++] = j;
    }
  }
  landCells = write;
  return n;
}
