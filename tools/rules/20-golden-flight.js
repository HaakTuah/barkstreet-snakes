// ---------------------------------------------------------------- round six B, part 4: leap now, the golden flight, bumps in the air
// (DESIGN "The plain jump hops islands" (leap now), "The golden jump flies", "Bumps in the air".) People here, through
// the same engine calls a rival makes (leap, letGo); the rivals' part is below.

const fly = (g, n) => { const at = []; for (let i = 0; i < n; i++) { quiet(g); at.push(g.snakes[0].body[0].x + ',' + g.snakes[0].body[0].y + (g.snakes[0].flight ? '^' : '')); } return at.join(' '); };

{ // Leap now: one press over open ground waits for something to hop; a second sends it at once, a full plain hop.
  const g = board([[line(5, 10, 6), 'right'], [line(4, 25, 4), 'right']]);
  const me = g.snakes[0];
  E.leap(g, me); E.letGo(g, me);
  quiet(g);
  check('one press over open ground: the jump waits, nothing goes', !g.events.some(e => e.type === 'leap') && !me.flight && me.body[0].x === 6);
  E.leap(g, me); E.letGo(g, me);
  const way = fly(g, 4);
  check('a second press while it waits: leap now, up three ticks and down on the fourth cell', way === '7,10^ 8,10^ 9,10^ 10,10' && me.alive, way);
  check('...at the plain jump\'s price', me.body.length === 6 - T.LEAP_COST && me.leapReadyAt > 0);
}

{ // The golden jump flies: held, on up to GOLD_FLY cells in the air, down on the next; let go, down on the next cell.
  const g = board([[line(3, 10, 6), 'right'], [line(4, 25, 4), 'right']]);
  const me = g.snakes[0];
  me.leaps = 2;
  E.leap(g, me); E.leap(g, me); // (twice: over open ground, now; and held)
  const way = fly(g, T.GOLD_FLY + 1);
  check(`held, a golden jump flies ${T.GOLD_FLY} cells and comes down on the next`, way === '4,10^ 5,10^ 6,10^ 7,10^ 8,10^ 9,10' && me.alive && me.body.length === 6, way);
  const g2 = board([[line(3, 10, 6), 'right'], [line(4, 25, 4), 'right']]);
  const me2 = g2.snakes[0];
  me2.leaps = 1;
  E.leap(g2, me2); E.leap(g2, me2);
  let way2 = fly(g2, 4);
  E.letGo(g2, me2);
  way2 += ' ' + fly(g2, 1);
  check('...let go, it comes down on the next cell', way2 === '4,10^ 5,10^ 6,10^ 7,10^ 8,10', way2);
  const g3 = board([[line(3, 10, 6), 'right'], [line(4, 25, 4), 'right']]);
  const me3 = g3.snakes[0];
  me3.leaps = 1;
  E.leap(g3, me3); E.leap(g3, me3);
  let way3 = fly(g3, 2);
  me3.queue.push(D.down);
  way3 += ' ' + fly(g3, 4);
  check('...and steers in the air, a turn a tick', way3 === '4,10^ 5,10^ 5,11^ 5,12^ 5,13^ 5,14' && me3.alive && joined(me3.body), way3);
}

{ // Bumps in the air: a flying head into another's air (its flying head, or its body lifted over the cells its flight
  // passed) costs what a crash does, and it drops where it is. A flies right along row 10; B, golden too, up column 8,
  // a tick ahead of it: A's head goes into B's lifted body at (8,10).
  const setup = () => {
    const g = board([[line(3, 10, 8), 'right'], [Array.from({ length: 6 }, (_, i) => [8, 14 + i]), 'up']]);
    const [a, b] = g.snakes;
    a.leaps = 1; b.leaps = 1;
    for (const s of [a, b]) { E.leap(g, s); E.leap(g, s); }
    return g;
  };
  const g = setup(), [a, b] = g.snakes;
  let bump = null;
  for (let n = 0; n < 6 && !bump; n++) { quiet(g); bump = g.events.find(e => e.type === 'crash' && e.air); }
  check('a flying head into another\'s air bumps', bump && bump.snake === a && bump.killerId === b.id && b.alive, JSON.stringify(bump && [bump.snake.id, bump.x, bump.y]));
  check('...costs what a crash does, and drops where it is: over bark, stunned there', a.alive && !a.flight && a.stunUntil > g.tick && a.body[0].x === 7 && a.body.length === 8 - T.CRASH_LOSS, JSON.stringify([a.body[0], a.body.length]));
  const g2 = setup(), [a2] = g2.snakes;
  g2.holes.add(K(7, 10));
  for (let n = 0; n < 6 && a2.alive; n++) quiet(g2);
  check('...over a hole, it falls in: out', !a2.alive && a2.fatal === 'hole', a2.cause);
  const g3 = setup(), [a3] = g3.snakes;
  g3.fires.set(K(7, 10), { from: 0, until: 999, group: 1, strike: false }); g3.fireGroups.set(1, 1);
  for (let n = 0; n < 6 && !(a3.stunUntil > g3.tick); n++) quiet(g3);
  check('...over fire, it catches alight too', a3.alive && a3.burnUntil > g3.tick && a3.stunUntil > g3.tick);
}

{ // Down onto a body, it's trapped: out. A plain hop over a rival lying still, its landing taken by another head.
  const g = board([[line(5, 10, 8), 'right'], wall(6, 7, 7), [[[7, 12], [7, 13], [7, 14], [7, 15]], 'up']]);
  const [me, w, r] = g.snakes;
  w.stunUntil = 1e9;
  E.leap(g, me); E.letGo(g, me);
  for (let n = 0; n < 3 && me.alive; n++) quiet(g);
  check('its landing taken, it comes down on the body it hopped: trapped, out', !me.alive && /came down on/.test(me.cause), me.cause);
}

{ // Ground and air pass each other: a head on the ground goes under a body lifted in a flight.
  const g = board([[line(3, 10, 5), 'right'], [[[5, 13], [5, 14], [5, 15], [5, 16]], 'up']]);
  const [a, b] = g.snakes;
  a.leaps = 1;
  E.leap(g, a); E.leap(g, a);
  for (let n = 0; n < 3; n++) quiet(g);
  check('a head on the ground passes under a flight\'s lifted body', b.alive && b.body[0].x === 5 && b.body[0].y === 10 && !g.events.some(e => e.type === 'crash'), JSON.stringify(b.body[0]));
}

{ // A rival steers in the air as a person does, through the same engine rule: the turn it planned as it took off
  // (flyTurn: after how many cells in the air, which way) and where it lets go (flyFor). The same flight as the
  // person's above: two cells right, then down, held for GOLD_FLY.
  const g = board([[line(3, 10, 6), 'right'], [line(4, 25, 4), 'right']]);
  const me = g.snakes[0];
  me.leaps = 1; me.autopilot = true;
  E.leap(g, me); E.leap(g, me);
  me.flyTurn = { at: 2, dir: D.down }; me.flyFor = T.GOLD_FLY;
  const way = fly(g, 6);
  check('a rival\'s planned turn in the air is flown as a person\'s is', way === '4,10^ 5,10^ 5,11^ 5,12^ 5,13^ 5,14' && me.alive && joined(me.body), way);
}

{ // ...and it plans one when it pays. A rival heading right into a rival lying down a whole column, in a column of
  // pits but for its own cell. Over the column, flying straight, it can only come down in a pocket one cell big (pits
  // round it, and on to the edge): it would be out on its next move. Turned in the air past the pit beside the pocket,
  // it comes down on open bark.
  const N = T.GRID, x = N - 5;
  const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = Array.from({ length: 5 }, (_, i) => ({ x: x - i, y: 10 })); a.dir = D.right; a.leaps = 1; a.flashReadyAt = 1e9;
  b.body = Array.from({ length: N }, (_, i) => ({ x: x + 1, y: i })); b.dir = D.up; b.isPlayer = true; b.persona = null; b.queue = []; b.stunUntil = 1e9;
  for (let y = 0; y < N; y++) if (y !== 10) g.holes.add(K(x, y));
  for (const k of [K(x + 3, 10), K(x + 4, 10), K(x + 2, 9), K(x + 2, 11)]) g.holes.add(k);
  g.food = []; g.time = 30000;
  let from = null, turned = false;
  for (let n = 0; n < 8 && a.alive && !(from && !a.flight); n++) { look(g); quiet(g); if (a.flight) { from ||= a.flight.dir; if (a.flight.dir !== from) turned = true; } }
  check('a rival with a golden jump steers in the air onto open bark, where flying straight comes down in a pocket', a.alive && turned && !a.flight && a.body[0].x === x + 2 && Math.abs(a.body[0].y - 10) >= 2 && !g.holes.has(K(a.body[0].x, a.body[0].y)), JSON.stringify({ head: a.body[0], turned, alive: a.alive, cause: a.cause }));
}

{ // A rival leaps now when it pays, in its style. Heading right with pits on both sides of its head, a person's head
  // crossing up into the cell in front of it next tick: crawling on is a head-on, turning is a pit, and one press would
  // wait for something to hop until too late. Ghost ("a leap now to slip a trap") presses twice, leaps at once over the
  // crossing and comes down beyond it. Drab, which hardly ever leaps now (four times the price), takes the bump.
  for (const key of ['ghost', 'drab']) {
    const g = E.createGame({ withPlayer: false, personas: [key, 'drab'] });
    g.snakes = g.snakes.slice(0, 2);
    const [a, b] = g.snakes;
    a.body = Array.from({ length: 7 }, (_, i) => ({ x: 6 - i, y: 10 })); a.dir = D.right; a.leaps = 0; a.leapReadyAt = 0; a.flashReadyAt = 1e9;
    b.body = Array.from({ length: 5 }, (_, i) => ({ x: 7, y: 11 + i })); b.dir = D.up; b.isPlayer = true; b.persona = null; b.queue = [];
    for (const k of [K(6, 9), K(6, 11), K(5, 9), K(5, 11)]) g.holes.add(k);
    g.food = []; g.time = 30000;
    let now = null;
    for (let n = 0; n < 6 && a.alive; n++) { feed(g); look(g); quiet(g); now ||= g.events.find(e => e.type === 'leap' && e.snake === a && e.now); }
    if (key === 'ghost') check('a rival leaps now (pressed twice) over a head crossing in front of it, where crawling on is a head-on and turning a pit', now && a.alive && a.body[0].x >= 9, JSON.stringify({ now: !!now, head: a.body[0], alive: a.alive, cause: a.cause }));
    else check('...in its style: Drab, which hardly ever leaps now, takes the bump instead', !now, JSON.stringify({ now: !!now, head: a.body[0] }));
  }
}

{ // ...and never over open ground for its own sake: Star, the power addict, on open bark with an apple four cells
  // ahead and a rival near but not in its way, crawls (weighed everywhere, it leapt now onto the apple at once, for
  // the tip of its tail and a rest). A leap now is weighed only when the crawl is in trouble (a crash within its search, a neck a
  // rival could shut, a head-on on its first move): over open ground it does what a crawl does, for the tip of the tail
  // and a rest then wanting for a real hurdle (at twice the jump's price, weighed everywhere, rivals with it came out
  // even with rivals without, in three head-to-heads).
  const g = E.createGame({ withPlayer: false, personas: ['star', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = Array.from({ length: 7 }, (_, i) => ({ x: 6 - i, y: 10 })); a.dir = D.right; a.leaps = 0; a.leapReadyAt = 0; a.flashReadyAt = 1e9;
  b.body = Array.from({ length: 5 }, (_, i) => ({ x: 11, y: 13 + i })); b.dir = D.up; b.flashReadyAt = 1e9; b.leapReadyAt = 1e9;
  g.food = [{ x: 10, y: 10, kind: 'food', expires: g.tick + 900 }]; g.given = new Set([10 * T.GRID + 10]); g.time = 30000;
  let now = null;
  for (let n = 0; n < 8 && a.alive; n++) { feed(g); look(g); quiet(g); now ||= g.events.find(e => e.type === 'leap' && e.snake === a && e.now); }
  check('a rival with its jump rested never leaps now over open ground, nobody in its way: it crawls', !now && a.alive, JSON.stringify({ now: !!now, head: a.body[0], alive: a.alive }));
}
