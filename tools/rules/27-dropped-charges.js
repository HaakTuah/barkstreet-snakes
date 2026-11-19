// ---------------------------------------------------------------- round six B, part 6: dropped charges
// (The queue's entry: "not on every bump. On a knockout, the charges spill where the head fell as a golden pickup anyone
// can grab.") People here, through the same engine calls a rival makes; the rivals' part is below.

{ // Knocked out holding golden jumps and dashes, a snake spills them where its head fell: one golden pickup.
  const g = board([[line(5, 10, T.MIN_LENGTH), 'right'], wall(6), [line(5, 20, 4), 'right']]);
  const [me, , o] = g.snakes;
  me.leaps = 2; me.dashes = 1;
  feed(g); quiet(g);
  const f = g.food.find(f => f.kind === 'spill'), e = g.events.find(e => e.type === 'spill');
  check('knocked out, a snake spills its golden charges where its head fell', !me.alive && !!f && f.x === 5 && f.y === 10 && f.leaps === 2 && f.dashes === 1 && !!e && e.snake === me && me.leaps === 0 && me.dashes === 0, JSON.stringify(f));
  check('...one pickup, and no bead under it', g.food.filter(q => q.x === 5 && q.y === 10).length === 1);
  check('...and it fades after a while', f && f.expires === g.tick - 1 + T.SPILL_TICKS, JSON.stringify(f));
  // Whoever gets there takes them all, up to what anyone can hold.
  o.body = cellsOf([[5, 11], [5, 12], [5, 13], [5, 14]]); o.dir = D.up; o.leaps = 2;
  g.given.add(K(5, 10)); // (the spill stays for the step)
  feed(g); quiet(g);
  check('...anyone can grab it: all of them, up to what anyone holds', o.alive && o.leaps === T.LEAP_MAX && o.dashes === 1 && !g.food.some(q => q.kind === 'spill') && g.events.some(e => e.type === 'eat' && e.kind === 'spill' && e.snake === o), JSON.stringify({ leaps: o.leaps, dashes: o.dashes }));
}

{ // Not on a bump: a crash it lives through keeps them.
  const g = board([[line(5, 10, 8), 'right'], wall(6)]);
  const me = g.snakes[0];
  me.leaps = 1; me.dashes = 2;
  feed(g); quiet(g);
  check('a bump keeps the charges: no spill', me.alive && me.leaps === 1 && me.dashes === 2 && !g.food.some(f => f.kind === 'spill') && g.events.some(e => e.type === 'crash'));
}

{ // Out with nothing held: nothing spills. Out down a hole: they spill on the nearest free cell, never into the pit.
  const g = board([[line(5, 10, T.MIN_LENGTH), 'right'], wall(6)]);
  feed(g); quiet(g);
  check('out with no charges: nothing spills', !g.snakes[0].alive && !g.food.some(f => f.kind === 'spill'));
  const g2 = board([[line(6, 10, 5), 'right'], [line(3, 20, 3), 'right']]);
  g2.holes.add(K(6, 10));
  const m2 = g2.snakes[0];
  m2.dashes = 2; m2.stunUntil = g2.tick + 3; // (its head over the hole, held there, nothing under it: it falls in)
  feed(g2); quiet(g2);
  const f = g2.food.find(f => f.kind === 'spill');
  check('...out down a hole: they spill beside it, never in it', !m2.alive && m2.fatal === 'hole' && !!f && !g2.holes.has(K(f.x, f.y)) && Math.abs(f.x - 6) + Math.abs(f.y - 10) <= T.SPILL_NEAR, JSON.stringify({ f, fatal: m2.fatal }));
}

{ // The rivals want it, through the same food search as anything else: one heads for a spill over an apple as far.
  // Holding all it can, the spill is only a meal to it, and it takes the nearer apple.
  // (Peckish, so food counts: the open room below pulls the other way.)
  const view = (more = {}) => () => aiView({ me: aiMe(line(10, 10, 4), 'right', { hungerLeft: 8000, starveIn: 8000, ...more }), others: [aiRival(1, line(20, 20, 3), 'right')], tickMs: 110,
    food: [{ x: 10, y: 14, kind: 'food', expires: 999 }, { x: 10, y: 5, kind: 'spill', leaps: 2, dashes: 1, expires: 999 }] });
  const want = picks(view(), 'drab', 20), full = picks(view({ leaps: T.LEAP_MAX, dashes: T.DASH_MAX }), 'drab', 20);
  check('an AI goes for spilled charges over an apple nearer', want.up === 20, JSON.stringify(want));
  check('...but not for ones it has no room to hold', full.down === 20, JSON.stringify(full));
}
