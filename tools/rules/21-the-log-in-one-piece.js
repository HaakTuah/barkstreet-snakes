// ---------------------------------------------------------------- 2s: a piece cut loose falls, the log stays one piece
// (the owner, 31 October 2026: "we want to avoid the islands stuff.") The land: a field, a one-cell neck on its right, and a
// 3x3 peninsula beyond it, nine cells: a peck that takes the neck cuts the peninsula loose.
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

{ // The strike: the piece falls with it. A head still on it falls too ("Down the hole!"); food on it is gone with it, never
  // knocked; the neck's own food is knocked aside as ever; and the log is one piece after.
  const g = board([[[[15, 10], [14, 10], [14, 11]], 'up'], [[[5, 5], [4, 5], [3, 5]], 'right']], { food: [[16, 9], [13, 10]], time: FRENZY });
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
    r.body = [[7, 10], [6, 10], [5, 10], [4, 10]].map(([x, y]) => ({ x, y })); r.dir = D.right; r.restedAt = 1e9;
    g.food = [{ x: 15, y: 10, kind: 'food' }]; g.given = new Set([K(15, 10)]);
    for (let k = 0; k < T.GRID * T.GRID; k++) if (!land3.some(([x, y]) => K(x, y) === k)) g.holes.add(k);
    g.time = FRENZY;
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
  const g = board([[[[5, 5], [4, 5], [3, 5]], 'right'], [[[5, 12], [4, 12], [3, 12]], 'right']], { food: [[16, 9], [13, 10]], time: FRENZY });
  for (let k = 0; k < T.GRID * T.GRID; k++) if (!land2s.some(([x, y]) => K(x, y) === k)) g.holes.add(k);
  g.woodpecker = { x: 13, y: 10, at: g.time, target: [K(...neck2s), ...peninK], fall: [...peninK], strikeAt: g.tick + 10, last: [], struckAt: -1, restUntil: 0 };
  const view = E.aiView(g, g.snakes[0]);
  check('2s: a rival is shown the cells that will fall', Array.isArray(view.fall) && view.fall.length === peninK.length && peninK.every(k => view.fall.includes(k)), JSON.stringify(view.fall));
  const seen = E.knocks({ ...g, woodpecker: { strikeAt: g.woodpecker.strikeAt, fall: view.fall } }, g.woodpecker.target, null);
  const onPiece = seen.find(o => o.food.x === 16 && o.food.y === 9), onNeck = seen.find(o => o.food.x === 13 && o.food.y === 10);
  check('...and works out that food on it falls, never lands', onPiece && onPiece.to === null && onPiece.fell, JSON.stringify(onPiece));
  check('...while the patch\'s own food lands outside the mark', onNeck && onNeck.to && !g.woodpecker.target.includes(K(onNeck.to.x, onNeck.to.y)), JSON.stringify(onNeck));
}

