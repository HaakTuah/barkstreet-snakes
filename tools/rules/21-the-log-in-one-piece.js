// ---------------------------------------------------------------- 2s: a piece cut loose falls, the log stays one piece
// (Haakon, 31 October 2026: "we want to avoid the islands stuff.") The land: a field, a one-cell neck on its right, and a
// 3x3 peninsula beyond it, nine cells (under PECK_FALL_SOFT): a patch that takes the neck cuts the peninsula loose.
const field2s = rect(2, 2, 12, 18), neck2s = [13, 10], penin2s = rect(14, 9, 16, 11);
const land2s = [...field2s, neck2s, ...penin2s];
const peninK = penin2s.map(([x, y]) => K(x, y));
// The bark left once the holes and a mark are out, in pieces (their sizes).
function pieces2s(g, mark) {
  const seen = new Set(), sizes = [];
  for (let k0 = 0; k0 < T.GRID * T.GRID; k0++) {
    if (seen.has(k0) || g.holes.has(k0) || mark.has(k0)) continue;
    const q = [k0]; seen.add(k0);
    for (let i = 0; i < q.length; i++) for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const x = q[i] % T.GRID + dx, y = Math.floor(q[i] / T.GRID) + dy, k = K(x, y);
      if (x < 0 || y < 0 || x >= T.GRID || y >= T.GRID || seen.has(k) || g.holes.has(k) || mark.has(k)) continue;
      seen.add(k); q.push(k);
    }
    sizes.push(q.length);
  }
  return sizes;
}

{ // The mark: a patch that cuts the peninsula loose takes it too, from the aim, shaded as it will fall (w.fall); no mark
  // leaves the log in two pieces.
  const g = island([[[[4, 4], [3, 4], [2, 4]], 'right']], land2s);
  const got = seededWhile(621, () => {
    const out = [];
    g.woodpecker = { x: 12, y: 0, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick };
    for (let t = 0; t < 600 && out.length < 200; t++) {
      feed(g); quiet(g);
      if (g.events.some(e => e.type === 'aim')) out.push({ mark: new Set(g.woodpecker.target), fall: g.woodpecker.fall || [] });
      g.woodpecker.target = []; delete g.woodpecker.fall; g.woodpecker.restUntil = g.tick;
    }
    return out;
  });
  const cut = got.filter(m => m.mark.has(K(...neck2s)));
  check('2s: a patch that cuts a piece loose takes it too, in the mark from the aim, as the piece that falls',
    cut.length > 0 && cut.every(m => peninK.every(k => m.mark.has(k)) && m.fall.every(k => peninK.includes(k))),
    `${cut.length} of ${got.length} marks took the neck; wrong (mark/fall): ${cut.filter(m => !(peninK.every(k => m.mark.has(k)) && m.fall.every(k => peninK.includes(k)))).map(m => `${m.mark.size}/${m.fall.length}`).join(' ')}`);
  check('...so no mark leaves the log in pieces', got.length === 200 && got.every(m => pieces2s(g, m.mark).length === 1),
    `${got.filter(m => pieces2s(g, m.mark).length !== 1).length} of ${got.length} leave pieces`);
  check('...and a mark that cuts nothing loose has nothing to fall', got.every(m => m.mark.has(K(...neck2s)) || !m.fall.length));
}

{ // The strike: the piece falls with it. A head still on it falls too ("Down the hole!"); food on it is gone with it, never
  // knocked; the neck's own food is knocked aside as ever; and the log is one piece after.
  const g = board([[[[15, 10], [14, 10], [14, 11]], 'up'], [[[5, 5], [4, 5], [3, 5]], 'right']], { food: [[16, 9], [13, 10]], time: T.SUDDEN_DEATH_MS });
  for (let k = 0; k < T.GRID * T.GRID; k++) if (!land2s.some(([x, y]) => K(x, y) === k)) g.holes.add(k);
  g.snakes[0].stunUntil = 1e9;
  feed(g);
  g.woodpecker = { x: 13, y: 10, at: g.time, target: [K(...neck2s), ...peninK], fall: [...peninK], strikeAt: g.tick, last: [], struckAt: -1, restUntil: 0 };
  const dying = E.step(g);
  const [a, b] = g.snakes, peck = g.events.find(e => e.type === 'peck');
  check('2s: a head on a piece cut loose falls with it', dying.includes(a) && a.cause === 'fell into a woodpecker hole' && a.fatal === 'hole', a.cause);
  check('...the food on it is gone with it, not knocked', !g.food.some(f => f.x === 16 && f.y === 9) && !g.events.some(e => e.type === 'knock' && e.x === 16 && e.y === 9), JSON.stringify(g.food));
  check('...the patch\'s own food is knocked aside, as ever', g.events.some(e => e.type === 'knock' && e.x === 13 && e.y === 10 && e.tx != null), JSON.stringify(g.events.filter(e => e.type === 'knock')));
  check('...the strike says which cells fell', peck && peck.fall && peck.fall.length === peninK.length && peninK.every(k => peck.fall.includes(k)), JSON.stringify(peck && peck.fall));
  check('...and the log is one piece: the piece is holes now', b.alive && peninK.every(k => g.holes.has(k)) && pieces2s(g, new Set()).length === 1 && !g.woodpecker.fall);
}

{ // The rivals see a piece a mark would cut loose as gone at the strike, and keep off it, through the same engine calls: a
  // rival heading for food on a piece beyond a neck three wide goes for it with no mark there, and stays on the field with
  // one (the neck and the piece in the mark, the piece to fall).
  const neck3 = rect(13, 9, 13, 11), piece3 = rect(14, 5, 19, 15), land3 = [...field2s, ...neck3, ...piece3];
  const run = marked => seededWhile(622, () => {
    const g = E.createGame({ withPlayer: false, personas: ['drab'] });
    g.snakes = g.snakes.slice(0, 1);
    const r = g.snakes[0];
    // (its head more than PECK_CLEARANCE from the neck, as a mark is from heads; alone, so nothing else draws it)
    r.body = [[7, 10], [6, 10], [5, 10], [4, 10]].map(([x, y]) => ({ x, y })); r.dir = D.right; r.flashReadyAt = 1e9; r.leapReadyAt = 1e9;
    g.food = [{ x: 15, y: 10, kind: 'food' }]; g.given = new Set([K(15, 10)]);
    for (let k = 0; k < T.GRID * T.GRID; k++) if (!land3.some(([x, y]) => K(x, y) === k)) g.holes.add(k);
    g.time = T.SUDDEN_DEATH_MS;
    g.woodpecker = marked
      ? { x: 13, y: 10, at: g.time, target: [...neck3, ...piece3].map(([x, y]) => K(x, y)), fall: piece3.map(([x, y]) => K(x, y)), strikeAt: g.tick + 20, last: [], struckAt: -1, restUntil: 0 }
      : { x: 3, y: 4, at: g.time, target: [K(3, 4)], strikeAt: g.tick + 20, last: [], struckAt: -1, restUntil: 0 };
    let on = 0;
    for (let t = 0; t < 16 && r.alive; t++) { feed(g); quiet(g); if (piece3.some(([x, y]) => r.body[0].x === x && r.body[0].y === y)) on++; }
    return { alive: r.alive, on, ate: !g.food.some(f => f.x === 15 && f.y === 10) };
  });
  const free = run(false), shown = run(true);
  check('2s: with no mark there, a rival goes out onto the piece for its food', free.ate && free.on > 0, JSON.stringify(free));
  check('...and with the piece marked to fall, it keeps off it', shown.alive && shown.on === 0 && !shown.ate, JSON.stringify(shown));
}

{ // The rivals are shown which cells fall (aiView's fall, the same for everyone), and the knock rule they work landings out
  // with (E.knocks, as the strike does) says food on a falling piece falls with it: no landing for it to chase, and the
  // patch's own food still flies to its ring.
  const g = board([[[[5, 5], [4, 5], [3, 5]], 'right'], [[[5, 12], [4, 12], [3, 12]], 'right']], { food: [[16, 9], [13, 10]], time: T.SUDDEN_DEATH_MS });
  for (let k = 0; k < T.GRID * T.GRID; k++) if (!land2s.some(([x, y]) => K(x, y) === k)) g.holes.add(k);
  g.woodpecker = { x: 13, y: 10, at: g.time, target: [K(...neck2s), ...peninK], fall: [...peninK], strikeAt: g.tick + 10, last: [], struckAt: -1, restUntil: 0 };
  const view = E.aiView(g, g.snakes[0]);
  check('2s: a rival is shown the cells that will fall', Array.isArray(view.fall) && view.fall.length === peninK.length && peninK.every(k => view.fall.includes(k)), JSON.stringify(view.fall));
  const seen = E.knocks({ ...g, woodpecker: { strikeAt: g.woodpecker.strikeAt, fall: view.fall } }, g.woodpecker.target, null);
  const onPiece = seen.find(o => o.food.x === 16 && o.food.y === 9), onNeck = seen.find(o => o.food.x === 13 && o.food.y === 10);
  check('...and works out that food on it falls, never lands', onPiece && onPiece.to === null && onPiece.fell, JSON.stringify(onPiece));
  check('...while the patch\'s own food lands outside the mark', onNeck && onNeck.to && !g.woodpecker.target.includes(K(onNeck.to.x, onNeck.to.y)), JSON.stringify(onNeck));
}

{ // 2s+: the bird aims small (PECK_FALL_SOFT, 12 cells: its first tries cut nothing bigger loose; past them any size
  // may fall, as the design says under "The log stays one piece"). A field, a neck and a 4x4 peninsula beyond it (16
  // cells, over the cap), a snake far off on the field: with the field to peck, no mark cuts the peninsula loose; on the
  // same seed, with the nine-cell peninsula instead, under the cap, some marks take the neck and cut it loose, so the
  // bigger one was a patch it could have taken.
  const marksOf = (g, n, seed) => seededWhile(seed, () => {
    const out = [];
    g.woodpecker = { x: 12, y: 0, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick };
    for (let t = 0; t < n * 4 && out.length < n; t++) {
      feed(g); quiet(g);
      if (g.events.some(e => e.type === 'aim')) out.push({ mark: new Set(g.woodpecker.target), fall: g.woodpecker.fall || [] });
      g.woodpecker.target = []; delete g.woodpecker.fall; g.woodpecker.restUntil = g.tick;
    }
    return out;
  });
  const big = rect(14, 8, 17, 11);
  const a = marksOf(island([[[[4, 4], [3, 4], [2, 4]], 'right']], [...field2s, neck2s, ...big]), 120, 631);
  const small = marksOf(island([[[[4, 4], [3, 4], [2, 4]], 'right']], land2s), 120, 631);
  check('2s+: the bird aims small: with any other patch to take, none cuts a piece bigger than PECK_FALL_SOFT loose', T.PECK_FALL_SOFT < big.length && a.length === 120 && a.every(m => m.fall.length <= T.PECK_FALL_SOFT) && small.some(m => m.mark.has(K(...neck2s)) && m.fall.length), `${a.filter(m => m.fall.length > T.PECK_FALL_SOFT).length} of ${a.length} cut a bigger piece loose; the nine-cell one cut loose ${small.filter(m => m.mark.has(K(...neck2s)) && m.fall.length).length} of ${small.length} times`);
}

{ // 2s+: no size is banned from falling. The log is one cell wide, a long line bent at a corner, a snake lying at each
  // end (an S of 68 cells): any patch on it splits it in two with a head on each side, so every try that keeps clear
  // of heads is refused (a crumb only never under a head, a bigger piece as clear of heads as the patch), and the last
  // try, "anywhere left", still marks, cutting loose the smaller side: over PECK_FALL_SOFT cells when the patch lies
  // well inside it.
  const line = [...rect(1, 1, 22, 1), [22, 2], ...rect(1, 3, 22, 3), [1, 4], ...rect(1, 5, 22, 5)];
  const g = island([[[[1, 1], [2, 1], [3, 1]], 'left'], [[[22, 5], [21, 5], [20, 5]], 'right']], line);
  const got = seededWhile(641, () => {
    const out = [];
    g.woodpecker = { x: 12, y: 0, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick };
    for (let t = 0; t < 160 && out.length < 40; t++) {
      feed(g); quiet(g);
      if (g.events.some(e => e.type === 'aim')) out.push({ mark: g.woodpecker.target.length, fall: (g.woodpecker.fall || []).length });
      g.woodpecker.target = []; delete g.woodpecker.fall; g.woodpecker.restUntil = g.tick;
    }
    return out;
  });
  check('2s+: and when nothing smaller is left it still cuts a bigger piece loose (no size is banned): on a log one cell wide between two heads', got.length === 40 && got.some(m => m.fall > T.PECK_FALL_SOFT),
    `${got.length} marks; pieces to fall ${got.map(m => m.fall).join(' ')}`);
}
