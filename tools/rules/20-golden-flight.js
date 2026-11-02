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

{ // The golden jump flies: held, GOLD_FLY cells in the air, always, down on the next (2y); a quick press, the plain hop.
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
  let way2 = fly(g2, 1);
  const ring2 = me2.flight && me2.flight.ring;
  way2 += ' ' + fly(g2, 3);
  E.letGo(g2, me2);
  way2 += ' ' + fly(g2, 2);
  check(`2y: held past the plain hop's cells, it's committed: let go, it flies on all the same, ${T.GOLD_FLY} cells, and comes down on the next`, way2 === '4,10^ 5,10^ 6,10^ 7,10^ 8,10^ 9,10' && me2.alive && !me2.flight, way2);
  check('...its ring shows where, from the first cell up', ring2 && ring2.x === 9 && ring2.y === 10 && ring2.n === 5, JSON.stringify(ring2));
  const g6 = board([[line(3, 10, 6), 'right'], [line(4, 25, 4), 'right']]);
  const me6 = g6.snakes[0];
  me6.leaps = 1;
  E.leap(g6, me6); E.leap(g6, me6);
  let way6 = fly(g6, 1);
  E.letGo(g6, me6); // (still over the plain hop's cells)
  const ring6 = me6.flight && { ...me6.flight.ring };
  way6 += ' ' + fly(g6, 3);
  check('...let go over the plain hop\'s cells, it\'s the plain hop: down where the plain hop comes down, and its ring moves there', way6 === '4,10^ 5,10^ 6,10^ 7,10' && me6.alive && !me6.flight && ring6 && ring6.x === 7 && ring6.y === 10, way6 + ' ' + JSON.stringify(ring6));
  const g3 = board([[line(3, 10, 6), 'right'], [line(4, 25, 4), 'right']]);
  const me3 = g3.snakes[0];
  me3.leaps = 1;
  E.leap(g3, me3); E.leap(g3, me3);
  let way3 = fly(g3, 2);
  me3.queue.push(D.down);
  way3 += ' ' + fly(g3, 4);
  check('...and steers in the air, a turn a tick', way3 === '4,10^ 5,10^ 5,11^ 5,12^ 5,13^ 5,14' && me3.alive && joined(me3.body), way3);
  const g4 = board([[line(6, 10, 6), 'right'], [Array.from({ length: 7 }, (_, i) => [7, 7 + i]), 'up']]);
  const me4 = g4.snakes[0];
  me4.leaps = 1; g4.snakes[1].stunUntil = 1e9;
  E.leap(g4, me4); E.letGo(g4, me4);
  let way4 = fly(g4, 1);
  me4.queue.push(D.down); // (pressed in the air, over the body it hops)
  way4 += ' ' + fly(g4, 2);
  check('...a quick golden press is the plain hop: a turn pressed before it lands waits till it\'s down, never dropping it on what it hopped', way4 === '7,10^ 8,10 8,11' && me4.alive, way4);
  const g5 = board([[line(3, 10, 6), 'right'], [Array.from({ length: 9 }, (_, i) => [9, 6 + i]), 'up']]);
  const me5 = g5.snakes[0];
  me5.leaps = 1; g5.snakes[1].stunUntil = 1e9;
  E.leap(g5, me5); E.leap(g5, me5);
  let way5 = fly(g5, 4);
  E.letGo(g5, me5); // (a body lying where it comes down: letting go won't bring it down short)
  way5 += ' ' + fly(g5, 2);
  check('...committed, a body lying on its landing takes it: letting go doesn\'t bring it down short, and it\'s out', !me5.alive && /came down on/.test(me5.cause || ''), way5 + ' ' + JSON.stringify([me5.alive, me5.cause]));
  const g7 = board([[line(3, 10, 6), 'right'], [line(4, 25, 4), 'right']]);
  const me7 = g7.snakes[0];
  me7.leaps = 1; g7.holes.add(K(9, 10));
  E.leap(g7, me7); E.leap(g7, me7);
  let way7 = fly(g7, 4);
  E.letGo(g7, me7);
  way7 += ' ' + fly(g7, 2);
  check('...and with a hole on its landing, it comes down in the hole', !me7.alive && /fell into/.test(me7.cause || ''), way7 + ' ' + JSON.stringify([me7.alive, me7.cause]));
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
  // (flyTurn: after how many cells in the air, which way). The same flight as the person's above: two cells right,
  // then down, held for GOLD_FLY.
  const g = board([[line(3, 10, 6), 'right'], [line(4, 25, 4), 'right']]);
  const me = g.snakes[0];
  me.leaps = 1; me.autopilot = true;
  E.leap(g, me); E.leap(g, me);
  me.flyTurn = { at: 2, dir: D.down };
  Object.defineProperty(me.memory, 'flyAt', { get: () => -1, set() {} }); // (the plan pinned: a rival plans again every move it's up, which the next check is about; here the engine's flying of a plan is the rule tested)
  const way = fly(g, 6);
  check('a rival\'s planned turn in the air is flown as a person\'s is', way === '4,10^ 5,10^ 5,11^ 5,12^ 5,13^ 5,14' && me.alive && joined(me.body), way);
}

{ // ...and it plans one when it pays, and plans again every move it's up. A rival heading right into a rival lying
  // down a whole column, in a column of pits but for its own cell. Over the column, flying straight, it can only come
  // down in a pocket one cell big (pits round it, and on to the edge): it would be out on its next move. Turned in the
  // air past the pit beside the pocket, it comes down on open bark (where exactly is its own plan, made as it flies:
  // one draw turns once and comes down two cells off the pocket's row, another turns again and flies back over the
  // column to the open log).
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
  turned ||= a.alive && a.body[0].y !== 10; // (a turn on the last cell in the air comes down the same tick: off the row it flew)
  check('a rival with a golden jump steers in the air onto open bark, where flying straight comes down in a pocket', a.alive && turned && !a.flight && !(a.body[0].x === x + 2 && a.body[0].y === 10) && !g.holes.has(K(a.body[0].x, a.body[0].y)), JSON.stringify({ head: a.body[0], turned, alive: a.alive, cause: a.cause }));
}

{ // A rival leaps now only out of a trap, never over a head that might cross. Heading right with pits on both sides
  // of its head, a person's head crossing up into the cell in front of it next tick: crawling on may be a head-on,
  // turning is a pit. Ghost and Drab alike crawl on, keeping the tip of the tail and the jump's rest (part 4, the round
  // forked at each use: leaps now over a head-on that might come, Ghost's and Desperado's style in a try, cost −0.28 ±
  // 0.18 place a use before sudden death; only out of a trap, +0.10 ± 0.07).
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
    check(`${key === 'ghost' ? 'a rival' : '...Drab too'} doesn't leap now over a head crossing in front of it, where crawling on may be a head-on and turning a pit: it crawls on`, !now, JSON.stringify({ now: !!now, head: a.body[0], alive: a.alive }));
  }
}

{ // ...and leaps now when it is trapped. Heading right down a corridor of pits two cells long, a pit across its end:
  // every crawl crashes within its search, and nothing is right in front to hop yet. Ghost and Desperado, whose
  // style makes a leap now cheap, press twice, through the same engine call as a person's, and come down past the pit
  // (Drab, at four times the price, crawls on and hops a wall of the corridor once it's beside it: as good a way out).
  for (const key of ['ghost', 'desperado']) {
    const g = E.createGame({ withPlayer: false, personas: [key, 'drab'] });
    g.snakes = g.snakes.slice(0, 2);
    const [a, b] = g.snakes;
    a.body = Array.from({ length: 7 }, (_, i) => ({ x: 6 - i, y: 10 })); a.dir = D.right; a.leaps = 0; a.leapReadyAt = 0; a.flashReadyAt = 1e9;
    b.body = Array.from({ length: 5 }, (_, i) => ({ x: 20, y: 20 + i })); b.dir = D.up; b.flashReadyAt = 1e9; b.leapReadyAt = 1e9;
    for (let x = 5; x <= 8; x++) { g.holes.add(K(x, 9)); g.holes.add(K(x, 11)); }
    g.holes.add(K(9, 10));
    g.food = []; g.time = 30000;
    let now = null;
    for (let n = 0; n < 6 && a.alive && !(now && !a.flight); n++) { feed(g); look(g); quiet(g); now ||= g.events.find(e => e.type === 'leap' && e.snake === a && e.now); }
    check(`${key === 'ghost' ? 'a rival' : '...Desperado too'} in a dead end, every crawl a crash, leaps now and comes down past the pit`, !!now && a.alive && !a.flight && a.body[0].x >= 10, JSON.stringify({ now: !!now, head: a.body[0], alive: a.alive, cause: a.cause }));
  }
}

{ // ...and never over open ground for its own sake: Star, the power addict, on open bark with an apple four cells
  // ahead and a rival near but not in its way, crawls (weighed everywhere, it leapt now onto the apple at once, for
  // the tip of its tail and a rest). A leap now is weighed only out of a trap (every crawl crashes within its search): over open ground it does what a crawl does, for the tip of the tail
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

{ // A rival plans again every move it's up ("the rivals fly it as a person would"): what it sees in the air counts. Up
  // on a golden leap now, held for the full flight, with a rival's body lying where that flight would come down (seen
  // only once it's up): committed (2y), it turns, and lives. Flown as planned at take-off, it came down on the body and
  // was out.
  const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = Array.from({ length: 6 }, (_, i) => ({ x: 5 - i, y: 10 })); a.dir = D.right; a.leaps = 1; a.flashReadyAt = 1e9;
  b.body = Array.from({ length: 7 }, (_, i) => ({ x: 14 - i, y: 10 })); b.dir = D.right; b.isPlayer = true; b.persona = null; b.queue = []; b.stunUntil = 1e9;
  g.food = []; g.time = 30000;
  E.leap(g, a); E.leap(g, a);
  look(g); quiet(g);
  check('(the flight is up: a golden leap now)', !!a.flight && a.flight.gold && a.body[0].x === 6, JSON.stringify(a.body[0]));
  a.flight.held = 1; a.flyTurn = null; // (held for the whole flight, straight: down on the body at x 11)
  for (let n = 0; n < 6 && a.alive && a.flight; n++) { look(g); quiet(g); }
  check('a rival up on a golden flight plans again as it flies: it steers clear of a body it sees on its landing, and lives', a.alive && !a.flight && !b.body.some(c => c.x === a.body[0].x && c.y === a.body[0].y), JSON.stringify({ head: a.body[0], alive: a.alive, cause: a.cause }));
}
