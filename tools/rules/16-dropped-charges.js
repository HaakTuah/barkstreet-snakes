// ---------------------------------------------------------------- round six B: dropped charges
// (DESIGN "Round six B"; the queue's entry: "not on every bump. On a knockout, the charges spill where the head fell as a golden pickup anyone can grab.")

{ // Knocked out holding golden jumps and flashes, a snake spills them where its head fell: one golden pickup.
  const g = board([[line(5, 10, T.MIN_LENGTH), 'right'], wall(6), [line(5, 20, 4), 'right']]);
  const [me] = g.snakes;
  me.leaps = 2; me.dashes = 1;
  quiet(g);
  const f = g.food.find(f => f.kind === 'spill'), e = g.events.find(e => e.type === 'spill');
  check('knocked out, a snake spills its golden charges where its head fell', !me.alive && !!f && f.x === 5 && f.y === 10 && f.leaps === 2 && f.dashes === 1 && !!e && me.leaps === 0 && me.dashes === 0, JSON.stringify(f));
  check('...one pickup, and no bead under it', g.food.filter(q => q.x === 5 && q.y === 10).length === 1);
  // Whoever gets there takes them all (up to what anyone can hold).
  const [, , o] = g.snakes;
  o.body = [[5, 11], [5, 12], [5, 13], [5, 14]].map(([x, y]) => ({ x, y })); o.dir = D.up; o.leaps = 2;
  g.given.add(K(5, 10)); // (the spill stays for the step)
  quiet(g);
  check('...anyone can grab it: all of them, up to what anyone holds', o.alive && o.leaps === T.LEAP_MAX && o.dashes === 1 && !g.food.some(q => q.kind === 'spill'), JSON.stringify({ leaps: o.leaps, dashes: o.dashes }));
}

{ // Not on a bump: a crash it survives keeps them.
  const g = board([[line(5, 10, 8), 'right'], wall(6)]);
  const me = g.snakes[0];
  me.leaps = 1; me.dashes = 2;
  quiet(g);
  check('a bump keeps the charges: no spill', me.alive && me.leaps === 1 && me.dashes === 2 && !g.food.some(f => f.kind === 'spill') && g.events.some(e => e.type === 'crash'));
}

{ // Out with nothing held: nothing spills. Out over a hole: it spills on the nearest free cell, never into the pit.
  const g = board([[line(5, 10, T.MIN_LENGTH), 'right'], wall(6)]);
  quiet(g);
  check('out with no charges: nothing spills', !g.snakes[0].alive && !g.food.some(f => f.kind === 'spill'));
  const g2 = board([[line(5, 10, 5), 'right'], [line(3, 20, 3), 'right']]);
  g2.holes.add(K(6, 10));
  const m2 = g2.snakes[0];
  m2.dashes = 2; m2.leapReadyAt = 1e9; // (no jump: it crawls on)
  m2.body.unshift({ x: 6, y: 10 }); m2.body.pop(); m2.stunUntil = g2.tick + 3; // (its head over the hole, held there, nothing under it: it falls in)
  quiet(g2);
  const f = g2.food.find(f => f.kind === 'spill');
  check('...out down a hole: they spill on the rim, beside it', !m2.alive && m2.fatal === 'hole' && !!f && !g2.holes.has(K(f.x, f.y)) && Math.abs(f.x - 6) + Math.abs(f.y - 10) <= 3, JSON.stringify({ f, alive: m2.alive, fatal: m2.fatal, head: m2.body[0], ev: g2.events.map(e => e.type) }));
}

{ // The rivals want it too, through the same food search: one grabs the spill over an apple as far.
  const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = line(10, 10, 4).map(([x, y]) => ({ x, y })); a.dir = D.right;
  b.body = [[20, 20], [19, 20], [18, 20]].map(([x, y]) => ({ x, y })); b.dir = D.right;
  g.food = [{ x: 10, y: 6, kind: 'food', expires: 999 }, { x: 10, y: 14, kind: 'spill', leaps: 2, dashes: 1, expires: 999 }];
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  const snap = () => ({ snakes: g.snakes.map(q => ({ id: q.id, body: q.body.map(c => ({ ...c })), dir: q.dir, stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0, cough: 0 })), holes: 0, fires: [], pecks: [] });
  g.history = [snap(), snap(), snap()];
  quiet(g);
  check('a rival goes for a spill over an apple as far', a.body[0].y === 11, JSON.stringify(a.body[0]));
}
