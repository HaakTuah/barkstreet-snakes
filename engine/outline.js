// The woodpecker's outline (entry 6, part 2): it cuts a shape out of the
// log a few cells a peck, along a dotted line, and when the last peck
// cuts it loose the piece falls (2s's rule, see cutLoose). Where it cuts:
// the most log per snake (see regions), round the edges and old hollows,
// small next to the log, never halving the trunk; down to a floor, the
// room the snakes left need (see logFloor), where it stops cutting and
// fights (engine/fight.js).
// w.plan: { cut: [cells in peck order, the ones left], piece: [cells that fall once it's cut], waitFrom (tick, or -1) }.

// Each snake's region: the log cells its head reaches first, crawling
// (bodies passable, holes not), ties nobody's. owner[k]: the snake's
// index in game.snakes, -1 none or a tie; sizes[i]: how many.
const regionOwner = new Int16Array(CELLS), regionDist = new Int16Array(CELLS), regionQ = new Int32Array(CELLS);
function regions(game) {
  regionOwner.fill(-1); regionDist.fill(-1);
  const sizes = game.snakes.map(() => 0);
  let write = 0;
  game.snakes.forEach((s, i) => {
    if (!s.alive) return;
    const k = key(s.body[0].x, s.body[0].y);
    if (game.holes.has(k)) return;
    if (regionDist[k] === 0) { regionOwner[k] = -2; return; } // (two heads on one cell: nobody's)
    regionDist[k] = 0; regionOwner[k] = i; regionQ[write++] = k;
  });
  for (let read = 0; read < write;) {
    const k = regionQ[read++], o = regionOwner[k], x = k % GRID, y = (k - x) / GRID;
    for (const d of CRAWL) {
      const nx = x + d.x, ny = y + d.y;
      if (!inside(nx, ny)) continue;
      const n = key(nx, ny);
      if (game.holes.has(n)) continue;
      if (regionDist[n] < 0) { regionDist[n] = regionDist[k] + 1; regionOwner[n] = o; regionQ[write++] = n; }
      else if (regionDist[n] === regionDist[k] + 1 && regionOwner[n] !== o) regionOwner[n] = -2; // (as near to two: nobody's)
    }
  }
  for (let k = 0; k < CELLS; k++) { if (regionOwner[k] === -2) regionOwner[k] = -1; else if (regionOwner[k] >= 0) sizes[regionOwner[k]]++; }
  return { owner: regionOwner, sizes };
}
// The regions, richest first (ties: the longer snake): its indices.
const richest = (game, sizes) => sizes.map((n, i) => i).filter(i => sizes[i] > 0)
  .sort((a, b) => sizes[b] - sizes[a] || game.snakes[b].body.length - game.snakes[a].body.length);
// The log left (it stays one piece, 2s) and the floor: the room the snakes
// left need, FLOOR_PER_LENGTH times their lengths (growth to come too),
// never under FLOOR_MIN. It cuts only while the log is CUT_MIN past it.
const logLeft = game => CELLS - game.holes.size;
function logFloor(game) {
  let need = 0;
  for (const s of game.snakes) if (s.alive) need += s.body.length + Math.max(0, s.grow);
  return Math.max(T.FLOOR_MIN, T.FLOOR_PER_LENGTH * need);
}
const canCut = game => logLeft(game) - logFloor(game) >= T.CUT_MIN;
// A cell's solid sides: in the piece, a hole, or off the board.
function solidSides(game, k, inP) {
  const x = k % GRID, y = (k - x) / GRID;
  let n = 0;
  for (const d of CRAWL) { const nx = x + d.x, ny = y + d.y; if (!inside(nx, ny) || game.holes.has(key(nx, ny)) || inP.has(key(nx, ny))) n++; }
  return n;
}
// The cut round a piece: the log cells not in it, beside it.
function cutRound(game, inP) {
  const out = new Set();
  for (const k of inP) {
    const x = k % GRID, y = (k - x) / GRID;
    for (const d of CRAWL) {
      const nx = x + d.x, ny = y + d.y;
      if (!inside(nx, ny)) continue;
      const n = key(nx, ny);
      if (!game.holes.has(n) && !inP.has(n)) out.add(n);
    }
  }
  return out;
}
// Grows a piece from a seed in a region (owner r, or any with r < 0): a
// cell at a time, the frontier cell with most solid sides, then nearest
// the seed, then first by number; till the piece and its cut make `size`.
function growPiece(game, owner, r, seed, size) {
  const inP = new Set([seed]), sx = seed % GRID, sy = (seed - sx) / GRID;
  for (;;) {
    const cut = cutRound(game, inP);
    if (inP.size + cut.size >= size) return { inP, cut };
    let best = -1, bs = -1, bd = 0;
    for (const k of cut) {
      if (r >= 0 && owner[k] !== r) continue;
      const s = solidSides(game, k, inP), x = k % GRID, d = Math.abs(x - sx) + Math.abs((k - x) / GRID - sy);
      if (s > bs || (s === bs && (d < bd || (d === bd && k < best)))) { best = k; bs = s; bd = d; }
    }
    if (best < 0) return { inP, cut };
    inP.add(best);
  }
}
// Does taking these cells leave the rest of the log in one piece? Crumbs
// of PECK_NO_ORPHANS or fewer it adds to `inP` (they go with the piece);
// a bigger second piece: false.
function oneTrunk(game, inP, cut) {
  pieceOf.fill(-1);
  const sizes = [];
  for (let k0 = 0; k0 < CELLS; k0++) {
    if (pieceOf[k0] >= 0 || game.holes.has(k0) || inP.has(k0) || cut.has(k0)) continue;
    const id = sizes.length;
    pieceOf[k0] = id; pieceQ[0] = k0;
    let read = 0, write = 1;
    while (read < write) {
      const i = pieceQ[read++], x = i % GRID, y = (i - x) / GRID;
      for (const d of CRAWL) {
        const nx = x + d.x, ny = y + d.y;
        if (!inside(nx, ny)) continue;
        const ni = key(nx, ny);
        if (pieceOf[ni] >= 0 || game.holes.has(ni) || inP.has(ni) || cut.has(ni)) continue;
        pieceOf[ni] = id; pieceQ[write++] = ni;
      }
    }
    sizes.push(write);
  }
  if (sizes.length < 2) return true;
  const trunk = sizes.indexOf(Math.max(...sizes));
  for (let i = 0; i < sizes.length; i++) if (i !== trunk && sizes[i] > T.PECK_NO_ORPHANS) return false;
  for (let k = 0; k < CELLS; k++) if (pieceOf[k] >= 0 && pieceOf[k] !== trunk) inP.add(k);
  return true;
}
// Where a cut may start in region r: its cells on the board's edge or an
// old hollow's, more than PECK_CLEARANCE from every head (for the first,
// where it looked last: any of its cells, off a head and the cells beside
// it; each peck keeps its own distance, see nextPeck).
function cutSeeds(game, owner, r, any = false) {
  const out = [];
  for (let k = 0; k < CELLS; k++) {
    if (owner[k] !== r || game.holes.has(k)) continue;
    const x = k % GRID, y = (k - x) / GRID;
    if ((any || CRAWL.some(d => !inside(x + d.x, y + d.y) || game.holes.has(key(x + d.x, y + d.y)))) && headGap(game, x, y) > (any ? 1 : T.PECK_CLEARANCE)) out.push(k);
  }
  return out;
}
// The cut in peck order: along it as a chain (from the end nearest
// `start`, or with fewest cut cells round it), a step to a touching cell
// (corners count) while there is one, else to the nearest; then pecked as
// a perforation: every other cell first (dots), then the rest (bridges).
function cutOrder(cut, start) {
  const left = new Set(cut), near8 = (a, b) => { const ax = a % GRID, bx = b % GRID; return Math.max(Math.abs(ax - bx), Math.abs((a - ax) / GRID - (b - bx) / GRID)); };
  const around = k => { let n = 0; for (const o of left) if (o !== k && near8(k, o) === 1) n++; return n; };
  const fromStart = k => { const kx = k % GRID, sx = start % GRID; return Math.abs(kx - sx) + Math.abs((k - kx) / GRID - (start - sx) / GRID); };
  let at = -1;
  for (const k of left) {
    const v = start >= 0 ? fromStart(k) * 9 + around(k) : around(k);
    const best = at < 0 ? Infinity : start >= 0 ? fromStart(at) * 9 + around(at) : around(at);
    if (v < best || (v === best && k < at)) at = k;
  }
  const chain = [];
  while (at >= 0) {
    chain.push(at); left.delete(at);
    let next = -1, nd = Infinity;
    for (const k of left) { const d = near8(at, k); if (d < nd || (d === nd && k < next)) { nd = d; next = k; } }
    at = next;
  }
  return [...chain.filter((k, i) => i % 2 === 0), ...chain.filter((k, i) => i % 2 === 1)];
}
// A new plan: a piece in the richest region it can (then any, then with
// the cap at a third of the log), its size CUT_OF_REGION of that region,
// between CUT_MIN and CUT_SHARE_MAX of the log and never past the floor;
// grown from a seed on the region's edge with the board or a hole, more
// than PECK_CLEARANCE from every head (the first, near where it looked
// last); of CUT_SEEDS tries, the one whose cut is the least of it. Never
// with a head on it, and never halving the trunk. Null if none.
function planCut(game, w) {
  if (!canCut(game)) return null;
  const { owner, sizes } = regions(game), order = richest(game, sizes), log = logLeft(game), room = log - logFloor(game);
  const heads = new Set();
  for (const s of game.snakes) if (s.alive) heads.add(key(s.body[0].x, s.body[0].y));
  const gaze = !w.pecks && w.gaze >= 0 ? w.gaze : -1;
  // (the first, act 2's: from where it looked last, in whosever region that
  // is now, while it can; then the richest region, any, a third of the log)
  const tiers = [[order.slice(0, 1), T.CUT_SHARE_MAX], [order, T.CUT_SHARE_MAX], [order, 1 / 3]];
  const gazeNear = k => { const gx = gaze % GRID, kx = k % GRID; return Math.abs(kx - gx) + Math.abs((k - kx) / GRID - (gaze - gx) / GRID) <= T.GAZE_NEAR; };
  if (gaze >= 0) { // (whose region it looked at: the cell's, or the nearest owned one's)
    let g = -1, gd = Infinity;
    for (let k = 0; k < CELLS; k++) if (owner[k] >= 0 && gazeNear(k)) { const kx = k % GRID, d = Math.abs(kx - gaze % GRID) + Math.abs((k - kx) / GRID - Math.floor(gaze / GRID)); if (d < gd) { gd = d; g = owner[k]; } }
    if (g >= 0) tiers.unshift([[g], T.CUT_SHARE_MAX, true]);
  }
  for (const [regs, share, near] of tiers) for (const r of regs) {
    const size = Math.min(room, Math.max(T.CUT_MIN, Math.min(Math.round(T.CUT_OF_REGION * sizes[r]), Math.floor(share * log))));
    if (size < T.CUT_MIN) continue;
    let seeds = cutSeeds(game, owner, r, !!near);
    if (near) seeds = seeds.filter(gazeNear);
    let best = null;
    for (let t = 0; t < T.CUT_SEEDS && seeds.length; t++) {
      const seed = seeds.splice(Math.floor(Math.random() * seeds.length), 1)[0];
      const { inP, cut } = growPiece(game, owner, r, seed, size);
      if ([...inP, ...cut].some(k => heads.has(k)) || !cut.size || (near && ![...cut].some(gazeNear))) continue; // (the first: its cut starts where it looked)
      if (!oneTrunk(game, inP, cut)) continue;
      const score = cut.size / (inP.size + cut.size);
      if (!best || score < best.score) best = { score, inP, cut };
    }
    if (best) return { cut: cutOrder(best.cut, gaze), piece: [...best.inP], waitFrom: -1 };
  }
  return null;
}
// The next peck of the plan: up to its step (CUT_STEP_2 in act 2;
// CUT_STEP_3 and a cell more for each piece fallen in the frenzy, up to
// CUT_STEP_MAX) of the cut's cells left, in order, more than
// PECK_CLEARANCE from every head, then any off a head; shutting nobody
// in, and, if it cuts a piece loose, only if every head on it can get off
// in the warning's time (FALL_REACT_TICKS short of the aim). Returns
// { patch, fall } (fall: what it cuts loose, which goes with it), or null
// to wait for a better moment (the plan is dropped after CUT_GIVEUP_TICKS).
function nextPeck(game, w) {
  const plan = w.plan;
  plan.cut = plan.cut.filter(k => !game.holes.has(k));
  if (!plan.cut.length) return null;
  const step = actOf(game) === 3 ? Math.min(T.CUT_STEP_MAX, T.CUT_STEP_3 + (w.fury || 0)) : T.CUT_STEP_2;
  const room = { now: null };
  for (const gap of [T.PECK_CLEARANCE, 0]) {
    const patch = [];
    for (const k of plan.cut) {
      if (patch.length >= step) break;
      if (headGap(game, k % GRID, (k - k % GRID) / GRID) <= gap) continue;
      const tryP = new Set([...patch, k]), fall = cutLoose(game, tryP);
      const shut = new Set([...tryP, ...fall]);
      if (shutsIn(game, shut, room, fall.length ? T.PECK_AIM_TICKS + 1 - T.FALL_REACT_TICKS : 0)) continue;
      patch.push(k);
    }
    if (patch.length) {
      const inP = new Set(patch), fall = cutLoose(game, inP);
      return { patch: [...patch, ...fall.filter(k => !inP.has(k))], fall };
    }
  }
  return null;
}
