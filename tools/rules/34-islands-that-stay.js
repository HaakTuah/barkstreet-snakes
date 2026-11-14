// ---------------------------------------------------------------- entry 6, part 3+: islands that stay
// (the owner, 9 November 2026, #611: "islands should always be attached to the edges, one must be able to tell clearly
// what will fall, and what will stay!"; 38-the-woodpecker, "The log stays one piece"; engine/woodpecker.js, cutLoose.)
// A piece cut off from the log stays, as an island, while it touches the board's edge and lies a jump (LEAP_REACH cells
// of gap or fewer, straight across) from the log; anything else cut off falls. So before the frenzy the piece the
// woodpecker cuts out at the edge stays, an island; in the frenzy the piece it cuts out falls, as part 2 built it.

// A frenzy board with these holes (cells: [x, y]) and two snakes far off on the log, out of the way.
const isleBoard = (holes, time = FRENZY) => {
  const g = board([[[[6, 12], [5, 12], [4, 12]], 'right'], [[[6, 18], [5, 18], [4, 18]], 'right']], { time });
  for (const [x, y] of holes) g.holes.add(K(x, y));
  return g;
};
const keys = cells => cells.map(([x, y]) => K(x, y));
const corner = rect(20, 0, 23, 3), cornerK = keys(corner); // (the top-right corner, 16 cells, on two edges of the board)
// The corner cut off by a band of holes `w` wide, left of it and under it, but for a corridor of log along row 2 (the
// neck, w cells) that still joins it to the log.
const band = w => rect(20 - w, 0, 19, 3 + w).concat(rect(20, 4, 23, 3 + w)).filter(([x, y]) => !(y === 2 && x < 20));
const neck = w => keys(rect(20 - w, 2, 19, 2));
const same = (a, b) => a.length === b.length && a.every(k => b.includes(k));

{ // The rule, at its edge: a corner piece cut off across a gap of LEAP_REACH cells stays; one cell more and it falls.
  const near = isleBoard(band(T.LEAP_REACH)), far = isleBoard(band(T.LEAP_REACH + 1));
  check('3+: before the cut, nothing falls', E.cutLoose(near, new Set()).length === 0 && E.cutLoose(far, new Set()).length === 0);
  const stays = E.cutLoose(near, new Set(neck(T.LEAP_REACH))), falls = E.cutLoose(far, new Set(neck(T.LEAP_REACH + 1)));
  check(`3+: a piece cut off that touches the board's edge, ${T.LEAP_REACH} cells of gap from the log (a jump), stays`, stays.length === 0, JSON.stringify(stays));
  check(`...but ${T.LEAP_REACH + 1} cells off, out of a jump's reach, it falls, all of it`, same(falls, cornerK), JSON.stringify(falls));
}

{ // A piece that touches no edge falls, though it lies a single cell from the log: a 3x3 block in the middle, ringed by
  // holes but for a neck on its right.
  const ring = rect(9, 9, 13, 13).filter(([x, y]) => (x === 9 || x === 13 || y === 9 || y === 13) && !(x === 13 && y === 11));
  const g = isleBoard(ring), block = keys(rect(10, 10, 12, 12)), falls = E.cutLoose(g, new Set([K(13, 11)]));
  check('3+: a piece cut off that touches no edge of the board falls, a jump from the log or not', same(falls, block), JSON.stringify(falls));
}

{ // The piece the woodpecker is cutting out, the corner (its plan's piece, at the edge a cell from the log): in the
  // frenzy it falls, as part 2 built it; before the frenzy it stays, an island, and its mark says so (newIsles, the cue's).
  const plain = time => {
    const g = isleBoard(band(1), time);
    g.woodpecker = { x: 19, y: 2, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: 0, plan: { cut: neck(1), piece: cornerK, waitFrom: -1 } };
    return g;
  };
  const frenzy = plain(FRENZY), pecks = plain((ACTS[1] + ACTS[2]) / 2);
  check('3+: in the frenzy, the piece the woodpecker cuts out falls, at the edge and a jump from the log as it is', E.actOf(frenzy) === 3 && same(E.cutLoose(frenzy, new Set(neck(1))), cornerK), JSON.stringify(E.cutLoose(frenzy, new Set(neck(1)))));
  const stays = E.cutLoose(pecks, new Set(neck(1))), shown = [...E.newIsles(pecks, neck(1))];
  check('...before it (its first pecks), the piece it cuts out at the edge stays standing, an island, and its mark shows which cells stay', E.actOf(pecks) === 2 && !stays.length && same(shown, cornerK), `${JSON.stringify(stays)} ${JSON.stringify(shown)}`);
  check('...where in the frenzy the mark shows no island', E.newIsles(frenzy, neck(1)).size === 0);
  check('...and it says so from the first nick: before the frenzy the piece will stand (pieceStanding), in the frenzy not', same([...E.pieceStanding(pecks)], cornerK) && E.pieceStanding(frenzy).size === 0);
  // (Codex's case: a piece that takes in a crumb that falls, here a lone cell ringed by holes in the middle: only the
  // cells that will stand are shown standing.)
  const mixed = plain((ACTS[1] + ACTS[2]) / 2);
  for (const [x, y] of [[12, 11], [13, 12], [12, 13], [11, 12]]) mixed.holes.add(K(x, y));
  mixed.woodpecker.plan.piece = [...cornerK, K(12, 12)];
  check('...only the cells of it that will stand: a crumb it takes in, which falls, is not among them', same([...E.pieceStanding(mixed)], cornerK), JSON.stringify([...E.pieceStanding(mixed)]));
}

{ // Only while: an island already standing (the corner, a gap of LEAP_REACH + 1 all round but for row 1, where one cell of
  // log comes within a jump) falls with the peck that takes the cell its jump would come down on.
  const w = T.LEAP_REACH + 1, g = isleBoard(band(w).concat(neck(w).map(k => [k % T.GRID, Math.floor(k / T.GRID)])).filter(([x, y]) => !(x === 20 - w && y === 1)));
  check('3+: an island a jump from the log stands: nothing falls', E.cutLoose(g, new Set()).length === 0);
  const falls = E.cutLoose(g, new Set([K(20 - w, 1)]));
  check('...until a peck takes the log its jump comes down on: then it falls with that strike, shown in its mark', same(falls, cornerK), JSON.stringify(falls));
}

{ // The strike: a corner piece the peck cuts off, at the edge and a jump from the log, stays standing, and a head on it
  // lives; the patch is a hole as ever.
  const g = isleBoard(band(1));
  g.snakes[0].body = [[21, 1], [22, 1], [23, 1]].map(([x, y]) => ({ x, y })); g.snakes[0].dir = D.left;
  for (const s of g.snakes) s.stunUntil = 1e9;
  feed(g);
  const target = neck(1), fall = E.cutLoose(g, new Set(target));
  g.woodpecker = { x: 19, y: 2, at: g.time, target, strikeAt: g.tick, last: [], struckAt: -1, restUntil: 0, ...(fall.length ? { fall } : {}) };
  quiet(g);
  check('3+: at the strike, an island that stays stands: its bark is still there, and a head on it lives',
    g.snakes[0].alive && cornerK.every(k => !g.holes.has(k)) && target.every(k => g.holes.has(k)), `${g.snakes[0].cause || ''} ${cornerK.filter(k => g.holes.has(k)).length} holes`);
}

{ // Its plan, on logs already pecked about: what its cut leaves is the log and islands that stay, nothing else; each island
  // it makes no bigger than a third of the log (its widest cap); and crumbs go with its piece.
  const N = T.GRID, inside = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
  const parts = gone => { // (the bark left, in pieces: each its cells)
    const seen = new Set(), out = [];
    for (let k0 = 0; k0 < N * N; k0++) {
      if (seen.has(k0) || gone.has(k0)) continue;
      const q = [k0]; seen.add(k0);
      for (let i = 0; i < q.length; i++) for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const x = q[i] % N + dx, y = Math.floor(q[i] / N) + dy, k = K(x, y);
        if (inside(x, y) && !seen.has(k) && !gone.has(k)) { seen.add(k); q.push(k); }
      }
      out.push(q);
    }
    return out.sort((a, b) => b.length - a.length);
  };
  const holds = (isle, log) => isle.some(k => { const x = k % N, y = Math.floor(k / N); return !x || !y || x === N - 1 || y === N - 1; })
    && isle.some(k => [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => { for (let j = 2; j <= T.LEAP_REACH + 1; j++) { const x = k % N + dx * j, y = Math.floor(k / N) + dy * j; if (!inside(x, y)) return false; if (log.has(K(x, y))) return true; } return false; }));
  let plans = 0, bad = 0, isles = 0, crumbs = 0;
  seededWhile(342, () => {
    for (let t = 0; t < 60; t++) {
      const holes = [];
      for (let r = 0; r < 3 + Math.floor(Math.random() * 4); r++) { // (a few old hollows, from the edge or not)
        const w = 2 + Math.floor(Math.random() * 5), h = 1 + Math.floor(Math.random() * 3), x = Math.floor(Math.random() * (N - w)), y = Math.floor(Math.random() * (N - h));
        holes.push(...rect(x, y, x + w - 1, y + h - 1));
      }
      const g = isleBoard(holes.filter(([x, y]) => x > 8 || (y !== 12 && y !== 18))); // (never under the snakes)
      if (parts(g.holes).length > 1) continue; // (the log in one piece to start)
      g.woodpecker = { x: 12, y: 0, at: g.time, came: g.tick, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick, gaze: -1, lookAt: g.tick, looks: 0, unit: 0, lookUntil: 0 };
      const p = E.planCut(g, g.woodpecker);
      if (!p) continue;
      plans++;
      const left = parts(new Set([...g.holes, ...p.cut, ...p.piece])), log = new Set(left[0]), cap = Math.floor((576 - g.holes.size) / 3);
      for (const isle of left.slice(1)) {
        if (isle.length <= T.PECK_NO_ORPHANS) crumbs++;
        else if (!holds(isle, log) || isle.length > cap) bad++;
        else isles++;
      }
    }
  });
  check('3+: what its cut leaves is the log and islands that stay (at the edge, a jump from it, a third of it at most): nothing else to fall, no crumbs', plans >= 30 && !bad && !crumbs, `${plans} plans, ${bad} bad, ${crumbs} crumbs, ${isles} islands`);
}
