// Scratch buffers, reused between calls (grid size is fixed per page), so the
// search allocates next to nothing however many positions it scores. Besides
// the per-cell grids: `nbr` lists each cell's neighbours in DIR_LIST order
// (-1 off the board), and `queue` holds a breadth-first search, one distance
// after another. No search visits a cell twice, so N * N is always enough.
let bufN = 0, mineFree, otherFree, ownFree, risk, strikes, visited;
let bridgeUntil, ridesWas, foodValue, foodGrow, denyValue, foodFrom, foodCells, goldCells, beadCells, queue, nbr, necks, reach, lineAt, lineSeen, lineMark, lineIn, lineOut, myCells, marks, leave, leaveStamp, chase, chaseKey;
let nearStamp, nearHead, nearWho, nearHome, nearGap, nearBeak;
let markStamp = 0;
// The board the searches of a search state run on (see evaluate), framed
// by a border of HOLE so a cell's neighbours are just a row either side of
// it and a cell either side (W wide; `framed` gives a cell's index on it,
// `unframed` its index on the grid again, -1 for the frame). `terr` holds
// for each cell when it frees up for a rival, my body placed on it, or once
// the territory search claims it, CLAIMED plus when, and whose it is (in
// its lowest bits); `terrFree` is what every search state starts from
// (copied in whole: quicker than undoing one); `meLater` is when a cell
// frees up for me, where that's later (a rival may be where I last saw it
// heading: the cells in laterCells, laterWas keeping the board's own while
// my room's fill reads them). inBody marks my body in a search state;
// seenF and distF, where my room's fill got to and how soon; seenH, where
// a hunted rival's room did. `reach` is on it too, and reachBlock, when a
// cell frees up for a rival's reach.
let W = 0, framed, unframed, bridgeF, terr, terrFree, meLater, laterCells, laterWas, inBody, seenF, seenH, distF, reachBlock;
const CLAIMED = HOLE + (HOLE >> 1), NOW = -HOLE; // (NOW: free already)
function ensureBuffers(N) {
  if (bufN === N) return;
  bufN = N;
  const size = N * N;
  mineFree = new Int32Array(size);
  otherFree = new Int32Array(size);
  ownFree = new Int32Array(size);
  risk = new Float32Array(size);
  strikes = new Float32Array(size); // (a rival's head next tick, and its body after: see decide)
  visited = new Int32Array(size);
  bridgeUntil = new Int32Array(size);
  ridesWas = new Int32Array(size); // (round six B: a rival's body over a pit, a bridge for my head till it leaves, ticks from now; 0: none)
  foodValue = new Float64Array(size); // what eating a cell is worth
  foodGrow = new Int8Array(size);     // what eating a cell does to my length
  denyValue = new Float64Array(size); // what eating a cell keeps from a starving rival (2h), however many meals I've had
  foodFrom = new Int32Array(size);    // the first move that can eat it, if it isn't there yet (food the woodpecker will knock there, or a mushroom I just spat, which I slide over till then; 0: it's there)
  foodCells = new Int32Array(size);   // food never shares a cell
  goldCells = new Int32Array(size);
  beadCells = new Int32Array(size);   // (the rivals' own beads among them)
  queue = new Int32Array(size);
  necks = new Int32Array(size * 4); // (a neck: its one or two cells (on the framed board), the room before it, and how far it is)
  myCells = new Int32Array(size);   // my own body as it is (marked with a stamp)
  marks = new Int32Array(size);     // where there is food, and whose own beads (marked with stamps)
  leave = new Int32Array(size);     // when each cell of my body as it is is left (where leaveStamp has a stamp)
  leaveStamp = new Int32Array(size);
  chase = new Int32Array(size * BUGS); // a beetle's chase played out from a cell (where chaseKey holds what it was worked out for), each beetle's apart
  chaseKey = new Float64Array(size * BUGS * CHASE_KEY);
  nearStamp = new Int32Array(size);   // for a beetle on a cell (where nearStamp has a stamp): how near the nearest rival's head is, and whose;
  nearHead = new Int32Array(size);    // and the nearest burrow in reach (-1: none), and how far
  nearWho = new Int32Array(size);
  nearHome = new Int32Array(size);
  nearGap = new Int32Array(size);
  nearBeak = new Int32Array(size);    // and how far off the woodpecker's mark (on it, less than 0: see E.beakGap)
  nbr = new Int32Array(size * 4);
  for (let i = 0; i < size; i++) {
    const x = i % N, y = (i - x) / N;
    DIR_LIST.forEach((d, k) => {
      const nx = x + d.x, ny = y + d.y;
      nbr[4 * i + k] = nx >= 0 && ny >= 0 && nx < N && ny < N ? ny * N + nx : -1;
    });
  }
  W = N + 2;
  framed = new Int32Array(size);
  unframed = new Int32Array(W * W).fill(-1);
  for (let i = 0; i < size; i++) { framed[i] = W + 1 + i + 2 * Math.floor(i / N); unframed[framed[i]] = i; }
  terr = new Int32Array(W * W).fill(HOLE);
  bridgeF = new Int32Array(W * W); // (bridgeUntil on the framed board, for my room: see fillRoom)
  terrFree = new Int32Array(W * W).fill(HOLE);
  meLater = new Int32Array(W * W).fill(NOW);
  inBody = new Int32Array(W * W);   // (my body in a search state, marked with a stamp)
  laterCells = new Int32Array(size);
  laterWas = new Int32Array(size);
  seenF = new Int32Array(W * W);
  seenH = new Int32Array(W * W);
  reach = new Int32Array(W * W);      // the soonest any rival could be in a cell (ticks from now)
  lineAt = new Int32Array(W * W);     // ...on a line of mine (see decide's lineOn), and the line's cells
  lineSeen = new Int32Array(W * W); lineMark = new Int32Array(W * W); lineIn = new Int32Array(W * W); lineOut = new Int32Array(W * W);
  reachBlock = new Int32Array(W * W).fill(HOLE);
  distF = new Int32Array(W * W);
}

// Where each snake's territory search starts, for up to `n` snakes.
let ownersCap = 0, srcI, srcT, srcOwn, headX, headY;
function ensureOwners(n) {
  if (n <= ownersCap) return;
  ownersCap = n;
  headX = new Int32Array(n); // (the rivals' heads where I reckon they are now, for the beetle)
  headY = new Int32Array(n);
  srcI = new Int32Array(n);
  srcT = new Int32Array(n);
  srcOwn = new Int8Array(n);
}

// Bodies for the search, one buffer per step: a move at step s writes the
// new body into bodies[s] and reads only bodies[s - 1]. A buffer holds at
// least `cells` cells, and the length in use is passed alongside it.
const bodies = [];
function ensureBodies(steps, cells) {
  for (let s = 1; s <= steps; s++) {
    const b = (bodies[s] ||= []);
    while (b.length < cells) b.push({ x: 0, y: 0 });
  }
}

// The searches over the framed board, kept apart from decide and evaluate
// (they read only these tables and plain numbers), so each is compiled once
// and stays so: a function that meets something of a new shape (a persona,
// a kind of food) is compiled again, which costs more the bigger it is, and
// runs uncompiled meanwhile. Each cell's four neighbours are written out, in
// DIR_LIST order: they're the hot loops.

// A body on a table of when each cell frees up: its segment j of len
// leaves after len - j + extra ticks (where something else is there
// longer, that stays).
function occupy(table, body, len, extra, N) {
  for (let j = 0; j < len; j++) {
    const c = body[j], i = c.y * N + c.x, v = len - j + extra;
    if (v > table[i]) table[i] = v;
  }
}

// The territory board's tables, from otherFree and mineFree (a cell free
// now: NOW), and the cells meLater holds longer, in laterCells. Returns how many.
function frameBoards(N) {
  let n = 0;
  for (let i = 0; i < N * N; i++) {
    const p = framed[i], o = otherFree[i], m = mineFree[i];
    terrFree[p] = o > 0 ? o : NOW;
    meLater[p] = m > o ? m : NOW;
    if (m > o) laterCells[n++] = p;
  }
  return n;
}
