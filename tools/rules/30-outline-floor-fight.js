// ---------------------------------------------------------------- entry 6, part 2: the outline, the floor, the fight
// (38-the-woodpecker, "It cuts a shape", "The floor", "Then it fights"; engine/outline.js, engine/fight.js.)

// A frenzy board whose only log is `land` (and the snakes on it), the snakes stunned for good (they stay put) and fed, and
// the woodpecker there and rested: steps until `until` says so, or n ticks.
const cutBoard = (bodies, land = null) => {
  const g = land ? island(bodies, land) : board(bodies, { time: FRENZY });
  for (const s of g.snakes) s.stunUntil = 1e9;
  g.woodpecker = { x: 12, y: 0, at: g.time, came: g.tick, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick, gaze: -1, lookAt: g.tick, looks: 0, unit: 0, lookUntil: 0 };
  return g;
};
const run = (g, n, each = () => false) => { for (let t = 0; t < n; t++) { feed(g); quiet(g); if (each(g)) return true; } return false; };
const touchesEdgeOrHole = (g, cells) => cells.some(k => { const x = k % T.GRID, y = Math.floor(k / T.GRID); return [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => x + dx < 0 || y + dy < 0 || x + dx >= T.GRID || y + dy >= T.GRID || g.holes.has(K(x + dx, y + dy))); });

{ // Its plan: a piece in the snake's region with the most log, round the board's edge, no more than CUT_SHARE_MAX of the
  // log, the rest of the log left in one piece, never with a head on it. Two snakes: one hemmed in the top-left corner by
  // a wall of holes, one with the rest of the log.
  const plans = seededWhile(301, () => Array.from({ length: 20 }, () => {
    const g = cutBoard([[line(2, 2, 3), 'right'], [line(14, 16, 3), 'right']]);
    for (let y = 0; y <= 6; y++) if (y !== 3) g.holes.add(K(6, y)); for (let x = 0; x <= 6; x++) g.holes.add(K(x, 6)); // (a gap at (6, 3): the log stays one piece)
    const p = E.planCut(g, g.woodpecker), region = E.regions(g);
    return { g, p, owner: region.owner };
  }));
  const ok = plans.filter(({ g, p, owner }) => p && [...p.cut, ...p.piece].every(k => owner[k] === 1 || owner[k] === -1)
    && touchesEdgeOrHole(g, [...p.cut, ...p.piece]) && p.cut.length + p.piece.length <= Math.floor(T.CUT_SHARE_MAX * (576 - g.holes.size)) + T.PECK_NO_ORPHANS
    && !g.snakes.some(s => [...p.cut, ...p.piece].includes(K(s.body[0].x, s.body[0].y))));
  check('part 2: it plans its cut in the region of the snake with the most log, from the edge, a piece no more than CUT_SHARE_MAX of the log, never with a head on it',
    ok.length === plans.length, `${ok.length} of ${plans.length}`);
  const one = plans.filter(({ g, p }) => { const h = new Set([...g.holes, ...p.cut, ...p.piece]); const seen = new Set(); let start = -1; for (let k = 0; k < 576; k++) if (!h.has(k)) { start = k; break; }
    const q = [start]; seen.add(start); while (q.length) { const k = q.pop(), x = k % T.GRID, y = Math.floor(k / T.GRID); for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const nx = x + dx, ny = y + dy, n = K(nx, ny); if (nx >= 0 && ny >= 0 && nx < T.GRID && ny < T.GRID && !h.has(n) && !seen.has(n)) { seen.add(n); q.push(n); } } }
    return seen.size === 576 - h.size; });
  check('...and never halves the trunk: what it leaves is one piece', one.length === plans.length, `${one.length} of ${plans.length}`);
}

{ // It pecks the cut a few cells a peck, as a perforation (every other cell first), and only the peck that takes the last
  // of it cuts the piece loose: that peck's mark shows the piece (fall), and the piece falls with it, food and all.
  const g = cutBoard([[line(2, 2, 3), 'right'], [line(2, 21, 3), 'right']]);
  g.woodpecker.plan = E.planCut(g, g.woodpecker);
  const piece = new Set(g.woodpecker.plan.piece), strikes = [];
  g.food = [...piece].slice(0, 1).map(k => ({ x: k % T.GRID, y: Math.floor(k / T.GRID), kind: 'food', expires: 1e9 })); g.given = new Set(g.food.map(f => K(f.x, f.y)));
  run(g, 600, g => { for (const e of g.events) if (e.type === 'peck') strikes.push({ cells: e.cells, fall: e.fall || [] }); return !g.woodpecker.plan; });
  const last = strikes[strikes.length - 1];
  check('part 2: it pecks its cut a few cells a peck, and only the last peck cuts the piece loose, shown in its mark',
    strikes.length >= 2 && strikes.slice(0, -1).every(s => !s.fall.length && s.cells.length <= T.CUT_STEP_MAX) && last.fall.length >= piece.size && [...piece].every(k => last.fall.includes(k)),
    strikes.map(s => `${s.cells.length - s.fall.length}+${s.fall.length}`).join(' '));
  check('...and the piece falls, food and all', [...piece].every(k => g.holes.has(k)) && !g.food.some(f => piece.has(K(f.x, f.y))));
  const first = strikes[0].cells, touching = first.some((a, i) => first.some((b, j) => i !== j && Math.abs(a % T.GRID - b % T.GRID) + Math.abs(Math.floor(a / T.GRID) - Math.floor(b / T.GRID)) === 1));
  check('...its first pecks dots along the line, the piece still joined by the cells between', !touching, JSON.stringify(first));
}

// A piece of 12 cells in the top-left corner, cut round by a line of 9; a snake's head on it at (cx, 1): its plan, all
// but one cell of the cut pecked already.
const cornerPlan = cx => {
  const piece = rect(0, 0, 3, 2).map(([x, y]) => K(x, y)), cut = [...rect(4, 0, 4, 3), ...rect(0, 3, 3, 3)].map(([x, y]) => K(x, y));
  const g = cutBoard([[[[cx, 1], [cx, 2], [cx + (cx ? -1 : 1), 2]], 'up'], [line(14, 18, 3), 'right']]);
  for (const k of cut.slice(1)) g.holes.add(k);
  g.woodpecker.plan = { cut: [cut[0]], piece, waitFrom: -1 };
  return g;
};
{ // Fair to get off: the peck that cuts a piece loose is aimed only if every head on it can get off within its warning (less
  // FALL_REACT_TICKS); otherwise it waits, and in CUT_GIVEUP_TICKS plans elsewhere.
  const near = cornerPlan(3);
  near.snakes[0].stunUntil = 0; // (free to move: up to (3, 0), its way off two moves on)
  run(near, 1);
  check('part 2: the peck that cuts a piece loose is aimed with a head on it that can get off in time (shown, the piece shaded)', near.woodpecker.target.length > 0 && (near.woodpecker.fall || []).length >= 12);
  // (A strip two cells deep along the top, cut round below and at its right end but for (23, 0): a head at its left end
  // is 23 moves from the way off, past the warning less FALL_REACT_TICKS.)
  const strip = rect(0, 0, 22, 1).map(([x, y]) => K(x, y)), stripCut = [K(23, 0), K(23, 1), ...rect(0, 2, 23, 2).map(([x, y]) => K(x, y))];
  const deep = cutBoard([[[[0, 0], [0, 1], [1, 1]], 'up'], [line(14, 18, 3), 'right']]);
  for (const k of stripCut.slice(1)) deep.holes.add(k);
  deep.woodpecker.plan = { cut: [stripCut[0]], piece: strip, waitFrom: -1 };
  let aimed = false;
  run(deep, T.CUT_GIVEUP_TICKS + 5, g => { if (g.woodpecker.fall?.includes(K(0, 0))) aimed = true; return false; });
  check('...but never with a head on it that couldn\'t get off in time: it waits, and gives up its plan', !aimed && !(deep.woodpecker.plan?.piece.includes(K(0, 0))) && 23 > T.PECK_AIM_TICKS + 1 - T.FALL_REACT_TICKS, `aimed ${aimed}, its plan now ${JSON.stringify(deep.woodpecker.plan?.piece.slice(0, 6))}`);
}

{ // Nothing banned: a piece that ends up cut loose falls whatever its size (a plan whose piece is half the log).
  const g = cutBoard([[line(2, 20, 3), 'right'], [line(12, 22, 3), 'right']]);
  const piece = rect(0, 0, 23, 9).map(([x, y]) => K(x, y)), cut = rect(0, 10, 23, 10).map(([x, y]) => K(x, y));
  for (const k of cut.slice(1)) g.holes.add(k);
  g.woodpecker.plan = { cut: [cut[0]], piece, waitFrom: -1 };
  run(g, 40, g => g.events.some(e => e.type === 'peck'));
  check('part 2: no size is banned from falling: a piece of 240 cells cut loose falls', piece.every(k => g.holes.has(k)), `${piece.filter(k => g.holes.has(k)).length} of ${piece.length}`);
}

{ // The floor: it cuts only while the log is CUT_MIN more than FLOOR_PER_LENGTH times the snakes' lengths (FLOOR_MIN at
  // least); there, in the frenzy, it fights; in act 2, it waits.
  // (A 12x12 log, two snakes of 3 with 40 still to grow each: the floor, 172 cells, is past the log.)
  const land = rect(2, 2, 13, 13), atFloor = () => { const g = cutBoard([[line(4, 4, 3), 'right'], [line(11, 11, 3), 'left']], land); for (const s of g.snakes) s.grow = 40; return g; };
  const small = atFloor();
  check('part 2: at the floor it plans no cut', E.planCut(small, small.woodpecker) === null);
  let zone = null;
  run(small, 10, g => { zone = g.woodpecker.zone || null; return !!zone; });
  check('...and in the frenzy it fights instead: a tile (its mark) and a plus round it, more than FIGHT_GAP from every head', zone && zone.length <= 5 && small.woodpecker.target.length === 1 && zone.includes(small.woodpecker.target[0])
    && zone.every(k => small.snakes.every(s => Math.abs(s.body[0].x - k % T.GRID) + Math.abs(s.body[0].y - Math.floor(k / T.GRID)) > T.FIGHT_GAP)), JSON.stringify(zone));
  const calm = atFloor();
  calm.time = ACTS[1] + 1000;
  run(calm, 10);
  check('...but not in act 2', !calm.woodpecker.zone && !calm.woodpecker.target.length);
}

{ // The fight's strike: a head in its plus takes a crash (CRASH_LOSS off, stunned), never a fall: the tile under a head
  // stays; at its smallest, out ("Pecked!").
  const strike = len => {
    const g = cutBoard([[line(9, 9, len), 'right'], [line(2, 20, 3), 'right']], rect(0, 0, 23, 23));
    g.woodpecker.zone = [K(9, 9), K(10, 9), K(8, 9), K(9, 8), K(9, 10)]; g.woodpecker.target = [K(9, 9)]; g.woodpecker.strikeAt = g.tick;
    const before = g.snakes[0].body.length;
    feed(g); quiet(g);
    return { g, s: g.snakes[0], before, crash: g.events.find(e => e.type === 'crash' && e.snake === g.snakes[0]) };
  };
  const a = strike(6), b = strike(3);
  check('part 2: a head in the fight\'s plus at the strike takes a crash: tail off and a stun, its tile no hole', a.s.alive && a.s.body.length === a.before - T.CRASH_LOSS && a.s.stunUntil > a.g.tick && a.crash && !a.g.holes.has(K(9, 9)), `${a.s.body.length} long, crash ${!!a.crash}`);
  check('...and at its smallest it is out, "Pecked!"', !b.s.alive && b.s.fatal === 'pecked');
}

{ // The rivals: on a piece its mark will drop, a rival walks off it before the strike (the search alone reads the mark as
  // walls, and sees no way); heading for a fight's plus, it turns aside.
  const mark = rect(0, 0, 3, 5).map(([x, y]) => K(x, y)); // (off it: right, three moves; down, five)
  const off = picks(() => aiView({ me: aiMe([[1, 1], [0, 1], [0, 0]], 'right'), others: [aiRival(1, line(20, 20, 4), 'right')], holes: new Set(mark), pecks: new Set(mark), strikeAt: 18, tick: 10, timeMs: FRENZY + 5000, act: 3 }), 'drab', 10);
  check('part 2: a rival on a piece about to fall walks off it (here: right, the short way)', (off.right || 0) === 10, JSON.stringify(off));
  const zone = [K(12, 12), K(13, 12), K(11, 12), K(12, 11), K(12, 13)];
  const dodge = picks(() => aiView({ me: aiMe(line(10, 12, 4), 'right'), others: [aiRival(1, line(20, 20, 4), 'right')], holes: new Set(zone), pecks: new Set([K(12, 12)]), zone: new Set(zone), strikeAt: 18, tick: 10, timeMs: FRENZY + 5000, act: 3 }), 'drab', 10);
  check('...and keeps out of a fight\'s plus', !dodge.right, JSON.stringify(dodge));
}

{ // Never past the floor: a plan, its crumbs and all, takes no more than the log past it. A 12x12 log, two snakes of 3 with
  // 29 still to grow each: the floor 128, 16 cells to cut.
  const plans = seededWhile(311, () => Array.from({ length: 20 }, () => {
    const g = cutBoard([[line(4, 4, 3), 'right'], [line(11, 11, 3), 'left']], rect(2, 2, 13, 13));
    for (const s of g.snakes) s.grow = 29;
    return { g, p: E.planCut(g, g.woodpecker) };
  }));
  const over = plans.filter(({ g, p }) => p && p.cut.length + p.piece.length > (576 - g.holes.size) - Math.max(T.FLOOR_MIN, T.FLOOR_PER_LENGTH * 64));
  check('part 2: a plan never takes the log past its floor (its crumbs counted)', over.length === 0 && plans.some(({ p }) => p), `${over.length} over, ${plans.filter(({ p }) => p).length} planned`);
}

{ // A rival walking off a doomed piece reckons with its own growth: its tail stays put while it grows (Codex's case: a head
  // in the mark, its tail just above it, one still to grow: up is its own body; right or down are open).
  const mark = rect(0, 0, 3, 3).map(([x, y]) => K(x, y));
  const grown = picks(() => aiView({ me: aiMe([[1, 1], [0, 1], [0, 0], [1, 0]], 'right', { grow: 1 }), others: [aiRival(1, line(20, 20, 4), 'right')], holes: new Set(mark), pecks: new Set(mark), strikeAt: 18, tick: 10, timeMs: FRENZY + 5000, act: 3 }), 'drab', 10);
  check('part 2: ...and never into its own tail while it grows', !grown.up, JSON.stringify(grown));
}
