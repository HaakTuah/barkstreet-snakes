// The board as I see it, read afresh for each decision (seeBoard): bodies
// as last seen, bridges over pits, where each rival's head is now, and how
// much room each snake has (roomOf).

// (seeBoard() sets these for each decision:)
let N, me, others, food, age, holes, depth, steps, inGrid, myHead, stunLeft, pitHole, heads, laterCount, tagBits,
  tags, roomFood;
const markFree = new Map(); // (each cell of the woodpecker's mark: when it's free of bodies, as mineFree has it; the mark itself a wall to everything else)
const markOut = new Map(); // (each cell of the mark: the moves from it onto bark, walking round the pits; none: no way off)
function seeBoard() {
  N = view.grid;
  ;({ me, others, food, age } = view);
  holes = view.holes || new Set();
  depth = persona.depth ?? 3;
  ensureBuffers(N);
  ensureOwners(others.length + 1);
  steps = Math.max(1, depth); // even a depth-0 search makes one move
  ensureBodies(Math.max(TUNE.GOLD_FLY + 2, steps), me.body.length + steps + TUNE.GOLD_FLY + 4); // a body grows at most one cell a step (a power moves up to three at once, eating; a jump is down LEAP_REACH + 1 steps on, a golden flight GOLD_FLY + 1)
  mineFree.fill(0); otherFree.fill(0); risk.fill(0); strikes.fill(0);

  inGrid = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
  myHead = me.body[0];
  readPortals(); // (the portals open now: a rival may have gone through one since I saw it)

  // Woodpecker holes never close: treat them like walls. (Its mark is one
  // too, but only once the bodies across it are read: see markFree.)
  const marked = view.pecks || EMPTY, burns = i => (view.fire || EMPTY).has(i) || (view.zone || EMPTY).has(i); // (fire or the fight's plus in the mark: a wall still, never crossed)
  for (const i of holes) if (!marked.has(i) || burns(i)) otherFree[i] = HOLE;

  // Opponent bodies as last seen. A segment j from the head leaves its cell
  // after (len - j) ticks; we ignore the time that has passed since the
  // snapshot, which is conservative in case they ate something.
  // (A rival I saw stunned stays put that much longer: its stars show.)
  stunLeft = o => Math.max(0, (o.stun || 0) - age);
  for (const o of others) occupy(otherFree, o.body, o.body.length, stunLeft(o), N);
  mineFree.set(otherFree);
  // Bridges (round six B): a rival's body over a pit (behind its head) I
  // may crawl onto while it's still there: till it leaves, as I'd see it
  // (less the time since I saw it, the soonest it could be gone).
  pitHole = i => holes.has(i) && !(view.fire || EMPTY).has(i) && !(view.pecks || EMPTY).has(i) && !(view.zone || EMPTY).has(i); // (a hole, not fire nor the woodpecker's mark or its fight's plus)
  bridgeUntil.fill(0); bridgeF.fill(0);
  for (const o of others) {
    if (o.air || pitHole(o.body[0].y * N + o.body[0].x)) continue; // (its own head over a pit: its body holds nobody up)
    const moved = Math.max(0, age - (o.stun || 0)); // (the moves it has made since I saw it, at least)
    for (let j = 1; j < o.body.length; j++) {
      const c = o.body[j], i = c.y * N + c.x;
      if (pitHole(i)) { bridgeUntil[i] = Math.max(bridgeUntil[i], o.body.length - j - moved); bridgeF[framed[i]] = bridgeUntil[i]; }
    }
  }

  // Where is each opponent now? Assume it kept going straight for `age`
  // ticks and treat that path as occupied (for me only).
  heads = [];
  for (const o of others) {
    const L = o.body.length;
    let hx = o.body[0].x, hy = o.body[0].y;
    for (let s = Math.min(age, o.stun || 0) + 1; s <= age; s++) { // (stunned, it didn't move)
      let nx = hx + o.dir.x, ny = hy + o.dir.y;
      if (o.wrap > 0 || (!inGrid(nx, ny) && portalOut(hx, hy, o.dir, 1))) { nx = (nx + N) % N; ny = (ny + N) % N; } // (the edges wrap for it a while, or a portal is open that way)
      if (!inGrid(nx, ny) || otherFree[ny * N + nx] > s) break;
      hx = nx; hy = ny;
      mineFree[hy * N + hx] = Math.max(mineFree[hy * N + hx], L);
    }
    headX[heads.length] = hx; headY[heads.length] = hy;
    heads.push({ x: hx, y: hy });
  }
  markFree.clear();
  for (const i of marked) if (holes.has(i) && !burns(i)) { markFree.set(i, mineFree[i]); mineFree[i] = otherFree[i] = HOLE; }
  markOut.clear();
  const side = (i, f) => { const x = i % N; if (x > 0) f(i - 1); if (x < N - 1) f(i + 1); if (i >= N) f(i - N); if (i < N * (N - 1)) f(i + N); };
  let ring = [];
  for (const i of markFree.keys()) side(i, j => { if (!holes.has(j) && !markOut.has(i)) { markOut.set(i, 1); ring.push(i); } });
  for (let d = 2; ring.length; d++) { const next = []; for (const i of ring) side(i, j => { if (markFree.has(j) && !markOut.has(j)) { markOut.set(j, d); next.push(j); } }); ring = next; }
  // The territory search's board, from the same tables.
  laterCount = frameBoards(N);
  tagBits = 32 - Math.clz32(others.length + 1), tags = (1 << tagBits) - 1; // (see evaluate)

  // How much room snake k has from its predicted head. `blockT` > 0 means my
  // body (as placed in ownFree for a search state at time blockT) is in the way.
  // (Only what it gets to in `upTo` moves, if given; and into roomFood, how
  // many moves to the first food it gets to: HOLE, none.)
  roomFood = HOLE;
}
function roomOf(k, blockT = 0, upTo = HOLE) {
  const h = heads[k];
  const start = h.y * N + h.x;
  const stampS = ++markStamp;
  visited[start] = stampS;
  queue[0] = start;
  // queue[read, write) is still to expand; it holds one distance at a time.
  let read = 0, write = 1, room = 0;
  roomFood = HOLE;
  for (let d = 1; read < write && room < ROOM_CAP && d <= upTo; d++) {
    const levelEnd = write;
    while (read < levelEnd) {
      const i = queue[read++];
      for (let n = 4 * i; n < 4 * i + 4; n++) {
        const ni = nbr[n];
        if (ni < 0 || visited[ni] === stampS || otherFree[ni] > d || (ownFree[ni] && ownFree[ni] > d - blockT)) continue; // (a cell that isn't my body is free of me)
        visited[ni] = stampS;
        if (foodValue[ni] > 0 && d < roomFood) roomFood = d;
        room++;
        queue[write++] = ni;
      }
    }
  }
  return Math.min(room, ROOM_CAP);
}
