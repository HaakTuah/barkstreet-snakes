// ---------------------------------------------------------------- round six A: the woodpecker plays fair (its knocks and rings; its outline: 30-outline-floor-fight.js)
// A board in sudden death whose only land is `land` (cells: [x, y]) and the
// snakes on it, each stunned for good (they stay put) and fed; more: grow.
const CELLS = T.GRID * T.GRID;
function island(bodies, land, { grow = 0 } = {}) {
  const g = board(bodies, { time: FRENZY });
  const keep = new Set([...land.map(([x, y]) => K(x, y)), ...g.snakes.flatMap(s => s.body.map(c => K(c.x, c.y)))]);
  for (let k = 0; k < CELLS; k++) if (!keep.has(k)) g.holes.add(k);
  for (const s of g.snakes) { s.stunUntil = 1e9; s.grow = grow; }
  return g;
}
const rect = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };

{ // Knocked aside: the nearest free cell outside the patch as the crow flies, then nearest the middle of the log, then the
  // first by row; null with none. A rule, never chance.
  const g = board([[line(5, 3, 4), 'right'], [line(20, 22, 4), 'right']]);
  const at = (c, x, y) => !!c && c.x === x && c.y === y;
  check('knocked: to the nearest free cell; of those, nearest the middle; then the first by row', at(E.knockTo(g, 10, 10, [K(10, 10)]), 11, 10), JSON.stringify(E.knockTo(g, 10, 10, [K(10, 10)])));
  const diamond = (x0, y0, r) => { const out = []; for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) if (x >= 0 && y >= 0 && x < T.GRID && y < T.GRID && Math.abs(x - x0) + Math.abs(y - y0) <= r) out.push(K(x, y)); return out; };
  check('...as the crow flies: two over and one down before three over, though three over is nearer the middle', at(E.knockTo(g, 2, 11, diamond(2, 11, 2)), 4, 12), JSON.stringify(E.knockTo(g, 2, 11, diamond(2, 11, 2))));
  g.holes.add(K(11, 10)); g.food.push({ x: 10, y: 11, kind: 'food' });
  check('...never into a hole, onto food or a body, or into fire', at(E.knockTo(g, 10, 10, [K(10, 10)]), 10, 9), JSON.stringify(E.knockTo(g, 10, 10, [K(10, 10)])));
  g.fires.set(K(10, 9), { from: g.tick, until: g.tick + 50, group: 1, strike: false });
  g.snakes[0].body = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  check('...(so with all four sides taken, a diagonal)', at(E.knockTo(g, 10, 10, [K(10, 10)]), 11, 11), JSON.stringify(E.knockTo(g, 10, 10, [K(10, 10)])));
  // Never onto a burrow: nothing grows on one, and food there would stop it up. (The strike's own list, and the rings
  // and the rivals that read it, go by the same rule.)
  g.burrows.push({ x: 11, y: 11, at: 0, used: 0 });
  g.food.push({ x: 10, y: 10, kind: 'food' });
  const offHole = E.knocks(g, [K(10, 10)]);
  check('...nor onto a burrow (the next diagonal, by the same ties), in the strike\'s own list too', at(E.knockTo(g, 10, 10, [K(10, 10)]), 11, 9) && offHole.length === 1 && at(offHole[0].to, 11, 9),
    JSON.stringify({ to: E.knockTo(g, 10, 10, [K(10, 10)]), all: offHole.map(k => k.to) }));
  g.food.pop(); g.burrows.length = 0;
  const all = []; for (let k = 0; k < CELLS; k++) all.push(k);
  check('...and nowhere: null', E.knockTo(g, 10, 10, all) === null);
  // At the strike: each piece in the patch knocked, by the same rule, one after another (none lands where another did); a beetle
  // still there (one that couldn't get away: it has only just moved, and its dig won't be done in time) is the bird's, as is
  // anything with nowhere to go (round six B, 2m: no beetle flies off the patch). Each says so.
  const s = board([[line(3, 3, 4), 'right'], [line(20, 22, 4), 'right']], { time: FRENZY });
  feed(s);
  const apple = { x: 12, y: 12, kind: 'food', expires: 9999 }, bead = { x: 12, y: 13, kind: 'pellet', color: '#abc', owner: 1, expires: 9999 };
  const bug = { x: 13, y: 12, kind: 'beetle', gold: 1, expires: 9999, dir: D.up, movedAt: s.tick, digUntil: 50 };
  s.food = [apple, bead, bug]; s.given = new Set(s.food.map(f => K(f.x, f.y)));
  const patch = [K(12, 12), K(12, 13), K(13, 12), K(13, 13)];
  const ahead = E.knocks(s, patch).map(({ food, to }) => [food.kind, to ? to.x : null, to ? to.y : null]);
  s.woodpecker = { x: 12, y: 12, at: s.time, target: patch, strikeAt: s.tick, last: [], struckAt: -1, restUntil: 0 };
  E.step(s);
  const ks = s.events.filter(e => e.type === 'knock');
  const where = ks.map(e => [e.kind, e.tx, e.ty]);
  const flew = where.filter(([, x]) => x != null);
  check('at the strike, food in the patch is knocked aside by the rule, as anyone could work it out through the aim', JSON.stringify(where) === JSON.stringify(ahead) && flew.length === 2 && new Set(flew.map(([, x, y]) => K(x, y))).size === 2 && flew.every(([, x, y]) => !patch.includes(K(x, y))),
    JSON.stringify({ where, ahead }));
  check('...each says what, from where to where (a golden beetle, a bead in its colour)', ks.length === 3 && ks.every(e => typeof e.x === 'number' && (e.kind === 'beetle' ? e.tx === null : typeof e.tx === 'number')) && ks.find(e => e.kind === 'beetle').gold === 1 && ks.find(e => e.kind === 'pellet').color === '#abc', JSON.stringify(ks));
  check('...a beetle still under the beak is the bird\'s: gone, never moved off the patch (its dig would have come too late)', !s.food.includes(bug) && at(bug, 13, 12) && !('digUntil' in bug) && s.food.includes(apple) && at(apple, ks[0].tx, ks[0].ty), JSON.stringify(bug));
  const t = board([[line(3, 3, 4), 'right'], [line(20, 22, 4), 'right']], { time: FRENZY });
  feed(t);
  const lone = { x: 12, y: 12, kind: 'food', expires: 9999 };
  t.food = [lone];
  for (let k = 0; k < CELLS; k++) if (k !== K(12, 12) && !t.snakes.some(o => o.body.some(c => K(c.x, c.y) === k))) t.holes.add(k);
  t.woodpecker = { x: 12, y: 12, at: t.time, target: [K(12, 12)], strikeAt: t.tick, last: [], struckAt: -1, restUntil: 1e9 };
  for (const o of t.snakes) o.stunUntil = 1e9;
  E.step(t);
  const eaten = t.events.find(e => e.type === 'knock');
  check('...and with nowhere to knock it, the bird eats it', eaten && eaten.tx === null && eaten.ty === null && !t.food.includes(lone), JSON.stringify(eaten));
}

{ // The ring is a promise. PECK_PROMISE_TICKS moves before the strike the woodpecker keeps where each piece in its mark
  // will land (w.landings: the rings shown then), and the strike lands it there while that cell is still free. Through
  // the aim the rings are worked out on the board as it will be at the strike: a body's cell its tail will have left by
  // then is free.
  // An apple in a 2x2 mark, a snake lying round it whose head goes into the mark on the strike's tick (stunned on the tick
  // before). Its body is in the way but for its tail end, which will have moved on by the strike: the ring is there,
  // beside the apple. The strike pecks its head, and the apple lands on the ring: not on the body of the snake the strike
  // kills (its beads lie there).
  const patch = [K(12, 12), K(13, 12), K(12, 13), K(13, 13)];
  const strike = (bodies, stun) => {
    const g = board(bodies, { time: FRENZY });
    feed(g);
    g.food = [{ x: 12, y: 12, kind: 'food', expires: 9999 }]; g.given = new Set([K(12, 12)]);
    g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }]; // (no beetles come out meanwhile)
    g.woodpecker = { x: 12, y: 12, at: g.time, target: patch, strikeAt: g.tick + 1, last: [], struckAt: -1, restUntil: 1e9 };
    g.snakes[stun].stunUntil = g.tick + 1;
    E.step(g); feed(g);
    const w = g.woodpecker, promised = JSON.stringify(w.landings), ring = E.knocks(g, w.target, w.landings).map(k => k.to);
    E.step(g);
    return { g, promised, ring, knock: g.events.find(e => e.type === 'knock'), kept: 'landings' in w };
  };
  const at = (c, x, y) => !!c && c.x === x && c.y === y;
  const a = strike([[[[13, 11], [12, 11], [11, 11], [11, 12], [11, 13]], 'down'], [line(5, 20, 4), 'right']], 0);
  const pecked = a.g.snakes[0];
  check('the ring is a promise: kept before the strike, where the rings show it (on a tail end that will have moved on by then)', a.promised === JSON.stringify([[K(12, 12), K(11, 13)]]) && at(a.ring[0], 11, 13), JSON.stringify({ promised: a.promised, ring: a.ring }));
  check('...food in the mark beside a snake the strike kills lands on its ring, not on that body',
    !pecked.alive && pecked.fatal === 'pecked' && a.knock && a.knock.tx === 11 && a.knock.ty === 13 && at(a.g.food.find(f => f.kind === 'food'), 11, 13) && !a.kept,
    JSON.stringify({ knock: a.knock && [a.knock.tx, a.knock.ty], alive: pecked.alive, fatal: pecked.fatal }));
  check('...and its beads lie on its body, where they would', a.g.food.some(f => f.kind === 'pellet' && f.x === 12 && f.y === 11), JSON.stringify(a.g.food.map(f => [f.kind, f.x, f.y])));
  // Through a whole aim: a snake crawling away from the mark, its tail on the cell beside the apple (the other beside it a
  // hole). From the first tick the ring is on that cell, where the tail will have left by the strike, and it never moves
  // as the body passes (worked out on the board as it stood, it showed two cells off, then hopped as the tail left); the
  // promise is made PECK_PROMISE_TICKS moves before the strike, on that cell, and the apple lands there.
  {
    const g = board([[[[8, 12], [9, 12], [10, 12], [11, 12]], 'left'], [line(5, 20, 4), 'right']], { time: FRENZY });
    feed(g);
    g.food = [{ x: 12, y: 12, kind: 'food', expires: 9999 }]; g.given = new Set([K(12, 12)]);
    g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }];
    g.holes.add(K(12, 11));
    g.woodpecker = { x: 12, y: 12, at: g.time, target: patch, strikeAt: g.tick + 10, last: [], struckAt: -1, restUntil: 1e9 };
    const rings = [], promisedAt = [], standing = E.knocks(g, patch, null, 0)[0].to; // (standing: as the board stands, the tail there)
    for (let t = 0; t <= 10; t++) {
      if (g.woodpecker.target.length) {
        const [k] = E.knocks(g, g.woodpecker.target, g.woodpecker.landings);
        rings.push(k.to && [k.to.x, k.to.y]);
        if (g.woodpecker.landings && !promisedAt.length) promisedAt.push(g.woodpecker.strikeAt - g.tick + 1, JSON.stringify(g.woodpecker.landings));
      }
      feed(g); E.step(g);
    }
    const knock = g.events.find(e => e.type === 'knock');
    check('...through the aim the ring stays on a cell a tail will have left by the strike, as the body passes (as the board stood, it was off at ' + (standing && [standing.x, standing.y]) + ')',
      rings.length === 11 && rings.every(r => r && r[0] === 11 && r[1] === 12) && standing && !at(standing, 11, 12), JSON.stringify(rings));
    check(`...promised ${T.PECK_PROMISE_TICKS} moves before the strike, and kept`, promisedAt[0] === T.PECK_PROMISE_TICKS && promisedAt[1] === JSON.stringify([[K(12, 12), K(11, 12)]]) && knock && knock.tx === 11 && knock.ty === 12, JSON.stringify({ promisedAt, knock: knock && [knock.tx, knock.ty] }));
  }
  // A head that comes onto the ring on the strike's tick: the piece lands as near its ring as it can, by the rule, as
  // the board stands then (the free cell beside the ring nearest the middle, and nobody's hurt), never far from where
  // the ring showed it.
  const b = strike([[[[12, 10], [12, 9], [12, 8], [12, 7]], 'down'], [line(5, 20, 4), 'right']], 0);
  check('...a ring a head moves onto at the strike: that piece lands as near its ring as it can, by the rule', b.promised === JSON.stringify([[K(12, 12), K(12, 11)]]) && b.knock && b.knock.tx === 11 && b.knock.ty === 11 && b.g.snakes[0].alive && at(b.g.snakes[0].body[0], 12, 11),
    JSON.stringify({ promised: b.promised, knock: b.knock && [b.knock.tx, b.knock.ty], head: b.g.snakes[0].body[0] }));
  // Two pieces: the first's ring taken by a head, it lands as near that ring as it can, but never onto the second's
  // ring (still kept).
  const g = board([[[[12, 10], [12, 9], [12, 8], [12, 7]], 'down'], [line(5, 20, 4), 'right']], { time: FRENZY });
  feed(g);
  g.food = [{ x: 12, y: 12, kind: 'food', expires: 9999 }, { x: 12, y: 13, kind: 'food', expires: 9999 }]; g.given = new Set([K(12, 12), K(12, 13)]);
  g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }];
  g.snakes[0].stunUntil = g.tick + 1;
  const twoRings = E.knocks(g, patch, [[K(12, 12), K(12, 11)], [K(12, 13), K(11, 12)]]).map(k => k.to);
  g.snakes[0].body.unshift({ x: 12, y: 11 }); g.snakes[0].body.pop(); // (its head on the first ring)
  const after = E.knocks(g, patch, [[K(12, 12), K(12, 11)], [K(12, 13), K(11, 12)]]).map(k => k.to);
  check('...and never onto a ring still kept for another piece', at(twoRings[0], 12, 11) && at(twoRings[1], 11, 12) && at(after[1], 11, 12) && after[0] && !at(after[0], 11, 12) && !at(after[0], 12, 11) && at(after[0], 11, 11),
    JSON.stringify({ twoRings, after }));
}
