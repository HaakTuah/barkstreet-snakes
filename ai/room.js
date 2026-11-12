// The flood fills the search counts with: a rival's reach, my room (and
// the necks in it), and the territory split.

// A rival's reach (see decide), from cell h on the framed board, where it
// moves again from t0: the soonest it could be in each cell, into `reach`
// (where anyone's is sooner, that stays).
function reachFrom(h, t0) {
  const stampR = ++markStamp, Q = queue, S = seenF, B = reachBlock, R = reach, Wd = W;
  Q[0] = h;
  S[h] = stampR;
  R[h] = Math.min(R[h], t0);
  let read = 0, write = 1;
  for (let s = t0 + 1; read < write; s++) {
    const levelEnd = write;
    while (read < levelEnd) {
      const p = Q[read++];
      let q = p - Wd;
      if (S[q] !== stampR && B[q] <= s) { S[q] = stampR; if (s < R[q]) R[q] = s; Q[write++] = q; }
      q = p + Wd;
      if (S[q] !== stampR && B[q] <= s) { S[q] = stampR; if (s < R[q]) R[q] = s; Q[write++] = q; }
      q = p - 1;
      if (S[q] !== stampR && B[q] <= s) { S[q] = stampR; if (s < R[q]) R[q] = s; Q[write++] = q; }
      q = p + 1;
      if (S[q] !== stampR && B[q] <= s) { S[q] = stampR; if (s < R[q]) R[q] = s; Q[write++] = q; }
    }
  }
}

// How much room a rival has from its head at start, with my body on the
// territory board in its way (see decide's roomOf: the same count, for a
// search state), marked in seenH.
function roomOn(start) {
  const stampS = ++markStamp, Q = queue, S = seenH, B = terr, Wd = W;
  S[start] = stampS;
  Q[0] = start;
  let read = 0, write = 1, room = 0;
  for (let d = 1; read < write && room < ROOM_CAP; d++) {
    const levelEnd = write;
    while (read < levelEnd) {
      const p = Q[read++];
      let q = p - Wd;
      if (S[q] !== stampS && B[q] <= d) { S[q] = stampS; room++; Q[write++] = q; }
      q = p + Wd;
      if (S[q] !== stampS && B[q] <= d) { S[q] = stampS; room++; Q[write++] = q; }
      q = p - 1;
      if (S[q] !== stampS && B[q] <= d) { S[q] = stampS; room++; Q[write++] = q; }
      q = p + 1;
      if (S[q] !== stampS && B[q] <= d) { S[q] = stampS; room++; Q[write++] = q; }
    }
  }
  return Math.min(room, ROOM_CAP);
}

// What food that isn't there yet pulls (the woodpecker will knock it
// there: see foodFrom), as food `range` pulls: there from move `from`, I'd
// be there on move `at` (from t; my mouth full till `mute`, I'd only nudge it).
// It counts from when it lands, and every move I'd be there before I need
// be counts EARLY more: nearby, I can be on it as it lands; anywhere I
// could just get back from in time, I'm racing the clock.
const EARLY = 0.1;
const latePull = (range, t, at, from, mute) => Math.max(0, range + t - Math.max(from, mute + 1) + EARLY * (from - at));

// My room's flood fill (see evaluate), from my head at headP, t moves on,
// marking what it gets to with stampF (and how soon, in distF); my body is
// on the territory board, marked in inBody with bodyMark. eager: look for
// food as it goes (a contested-food eater, which searches on past the room
// cap, up to foodRange, till it sees some). Into `roomFound`: how many cells
// (not capped), how soon I'm on my own trail (HOLE: never) and how many
// necks (in `necks`, four numbers each); it returns the best food it saw if
// eager (food that isn't there yet, from when it is).
const roomFound = new Int32Array(3);
function fillRoom(headP, t, cap, need, eager, foodRange, mute, bodyMark, stampF, laterCount) {
  const Q = queue, S = seenF, B = terr, BU = bridgeF, ML = meLater, D = distF, Wd = W; // (BU: a bridge is a way through while it lasts, but not under my own body)
  // (Where meLater says a cell's taken longer, the board says so too while
  // it runs: one test where it would be two.)
  for (let k = 0; k < laterCount; k++) { const q = laterCells[k]; laterWas[k] = B[q]; if (ML[q] > B[q]) B[q] = ML[q]; }
  S[headP] = stampF;
  Q[0] = headP;
  let read = 0, write = 1, space = 0, anyFood = 0, trail = HOLE, neckCount = 0;
  for (let d = 1; read < write && (space < cap || (eager && !anyFood && d <= foodRange)); d++) {
    const levelEnd = write, by = t + d, pull = eager ? Math.max(0, foodRange - (t + d > mute ? d : mute + 1 - t)) : 0; // (my mouth full, I'd only nudge it)
    while (read < levelEnd) {
      const p = Q[read++];
      let q = p - Wd;
      if (S[q] !== stampF && (B[q] <= by || (BU[q] > by && inBody[q] !== bodyMark))) {
        S[q] = stampF; D[q] = d; Q[write++] = q;
        if (B[q] <= by) { space++; if (d < trail && inBody[q] === bodyMark) trail = d; } // (a bridge: a way through, not room, nor my trail)
        if (eager) { const i = unframed[q], v = foodValue[i]; if (v > 0) anyFood = Math.max(anyFood, v * (foodFrom[i] > by ? latePull(foodRange, t, by, foodFrom[i], mute) : pull)); }
      }
      q = p + Wd;
      if (S[q] !== stampF && (B[q] <= by || (BU[q] > by && inBody[q] !== bodyMark))) {
        S[q] = stampF; D[q] = d; Q[write++] = q;
        if (B[q] <= by) { space++; if (d < trail && inBody[q] === bodyMark) trail = d; } // (a bridge: a way through, not room, nor my trail)
        if (eager) { const i = unframed[q], v = foodValue[i]; if (v > 0) anyFood = Math.max(anyFood, v * (foodFrom[i] > by ? latePull(foodRange, t, by, foodFrom[i], mute) : pull)); }
      }
      q = p - 1;
      if (S[q] !== stampF && (B[q] <= by || (BU[q] > by && inBody[q] !== bodyMark))) {
        S[q] = stampF; D[q] = d; Q[write++] = q;
        if (B[q] <= by) { space++; if (d < trail && inBody[q] === bodyMark) trail = d; } // (a bridge: a way through, not room, nor my trail)
        if (eager) { const i = unframed[q], v = foodValue[i]; if (v > 0) anyFood = Math.max(anyFood, v * (foodFrom[i] > by ? latePull(foodRange, t, by, foodFrom[i], mute) : pull)); }
      }
      q = p + 1;
      if (S[q] !== stampF && (B[q] <= by || (BU[q] > by && inBody[q] !== bodyMark))) {
        S[q] = stampF; D[q] = d; Q[write++] = q;
        if (B[q] <= by) { space++; if (d < trail && inBody[q] === bodyMark) trail = d; } // (a bridge: a way through, not room, nor my trail)
        if (eager) { const i = unframed[q], v = foodValue[i]; if (v > 0) anyFood = Math.max(anyFood, v * (foodFrom[i] > by ? latePull(foodRange, t, by, foodFrom[i], mute) : pull)); }
      }
    }
    // (A portal, open as I'd step through it from its entry: its exit
    // is a move on from there, as near as any neighbour.)
    for (let n = 0; n < portalIn.length; n++) {
      const e = portalIn[n], q = portalEx[n];
      if (S[e] !== stampF || (e === headP ? 0 : D[e]) !== d - 1 || portalLeft[n] < by || S[q] === stampF || !(B[q] <= by || (BU[q] > by && inBody[q] !== bodyMark))) continue;
      S[q] = stampF; D[q] = d; Q[write++] = q;
      if (B[q] <= by) { space++; if (d < trail && inBody[q] === bodyMark) trail = d; }
      if (eager) { const i = unframed[q], v = foodValue[i]; if (v > 0) anyFood = Math.max(anyFood, v * (foodFrom[i] > by ? latePull(foodRange, t, by, foodFrom[i], mute) : pull)); }
    }
    const width = write - levelEnd;
    if (width && width <= 2 && levelEnd - 1 < need) {
      necks[neckCount++] = Q[levelEnd];
      necks[neckCount++] = Q[write - 1];
      necks[neckCount++] = levelEnd - 1;
      necks[neckCount++] = d;
    }
  }
  for (let k = 0; k < laterCount; k++) B[laterCells[k]] = laterWas[k];
  roomFound[0] = space; roomFound[1] = trail; roomFound[2] = neckCount;
  return anyFood;
}

// The territory search (see evaluate): its sources in srcI, srcT, srcOwn
// [0, ns), my body on the board placed at time t. Into `tally`: my count
// and the rivals'. stop: it may stop once I claim nothing more, when no
// rival's own bead is left unclaimed (beadCells[0, beadCount)) (see
// evaluate).
const tally = new Int32Array(2);
function spreadTerritory(ns, t, age, bits, tags, stop, beadCount) {
  const B = terr, Q = queue, ML = meLater, Wd = W;
  let mine = 0, theirs = 0, si = 0, T = srcT[0], read = 0, write = 0; // (Q[read, write): the cells claimed at time T)
  while (read < write || si < ns) {
    while (si < ns && srcT[si] === T) {
      const p = srcI[si], tag = srcOwn[si++];
      if (B[p] < CLAIMED) {
        B[p] = CLAIMED + ((T + age) << bits) + tag;
        if (tag === 1) mine++; else theirs++;
        Q[write++] = p;
      }
    }
    // (Worked out once a level; my cells apart from the rivals'.)
    const levelEnd = write, T1 = T + 1, next = CLAIMED + ((T1 + age) << bits), mineBefore = mine, mineNext = next + 1;
    while (read < levelEnd) {
      const p = Q[read++], tag = B[p] & tags;
      if (tag === 1) { // mine: a cell free by then for me (unless a rival may be there), or a rival's claimed at T + 1 (contested)
        let q = p - Wd, s = B[q];
        if (s <= T1) { if (ML[q] <= T1) { B[q] = mineNext; mine++; Q[write++] = q; } } else if (s >= next && (s & tags) > 1) { theirs--; B[q] = next; }
        q = p + Wd; s = B[q];
        if (s <= T1) { if (ML[q] <= T1) { B[q] = mineNext; mine++; Q[write++] = q; } } else if (s >= next && (s & tags) > 1) { theirs--; B[q] = next; }
        q = p - 1; s = B[q];
        if (s <= T1) { if (ML[q] <= T1) { B[q] = mineNext; mine++; Q[write++] = q; } } else if (s >= next && (s & tags) > 1) { theirs--; B[q] = next; }
        q = p + 1; s = B[q];
        if (s <= T1) { if (ML[q] <= T1) { B[q] = mineNext; mine++; Q[write++] = q; } } else if (s >= next && (s & tags) > 1) { theirs--; B[q] = next; }
      } else if (tag) { // a rival's (0: it became contested): a cell free by then, or someone else's claimed at T + 1 (contested)
        const claim = next + tag;
        let q = p - Wd, s = B[q], o = s & tags;
        if (s <= T1) { B[q] = claim; theirs++; Q[write++] = q; } else if (s >= next && o && o !== tag) { if (o === 1) mine--; else theirs--; B[q] = next; }
        q = p + Wd; s = B[q]; o = s & tags;
        if (s <= T1) { B[q] = claim; theirs++; Q[write++] = q; } else if (s >= next && o && o !== tag) { if (o === 1) mine--; else theirs--; B[q] = next; }
        q = p - 1; s = B[q]; o = s & tags;
        if (s <= T1) { B[q] = claim; theirs++; Q[write++] = q; } else if (s >= next && o && o !== tag) { if (o === 1) mine--; else theirs--; B[q] = next; }
        q = p + 1; s = B[q]; o = s & tags;
        if (s <= T1) { B[q] = claim; theirs++; Q[write++] = q; } else if (s >= next && o && o !== tag) { if (o === 1) mine--; else theirs--; B[q] = next; }
      }
    }
    // (A portal open at T + 1: whoever has its entry at T has its exit
    // at T + 1, as a neighbour, the same way.)
    for (let n = 0; n < portalIn.length; n++) {
      const e = portalIn[n], se = B[e], tag = se & tags;
      if (se < CLAIMED || !tag || portalLeft[n] < T1 || ((se - CLAIMED) >> bits) !== T + age) continue;
      const q = portalEx[n], s = B[q], o = s & tags;
      if (tag === 1) { if (s <= T1) { if (ML[q] <= T1) { B[q] = mineNext; mine++; Q[write++] = q; } } else if (s >= next && o > 1) { theirs--; B[q] = next; } }
      else if (s <= T1) { B[q] = next + tag; theirs++; Q[write++] = q; } else if (s >= next && o && o !== tag) { if (o === 1) mine--; else theirs--; B[q] = next; }
    }
    if (mine === mineBefore && T >= t && stop) {
      let open = false; // (a rival's own bead nobody's claimed yet)
      for (let k = 0; k < beadCount && !open; k++) open = foodValue[beadCells[k]] > 0 && B[framed[beadCells[k]]] < CLAIMED;
      if (!open) break;
    }
    T = read < write || si >= ns ? T + 1 : srcT[si];
  }
  tally[0] = mine; tally[1] = theirs;
}
