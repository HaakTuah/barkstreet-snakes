// ---------------------------------------------------------------- round six B: bridges
// (DESIGN "Round six B", "A snake across a pit is a bridge". A pit three wide and three
// deep, x 10-12, y 10-12; the bridge, P1, lies across its top row heading right.)
const pit = g => { for (let x = 10; x <= 12; x++) for (let y = 10; y <= 12; y++) g.holes.add(K(x, y)); };
const across = (n, hx = 14) => Array.from({ length: n }, (_, i) => [hx - i, 10]); // (P1: its head at (14, 10), on bark past the far rim)

{ // A head crawls onto a body lying over a pit, along its back, and off onto bark at the rim.
  const g = board([[[[11, 8], [11, 7], [11, 6]], 'down'], [across(12), 'right']]);
  pit(g);
  const [me, br] = g.snakes;
  const at = [];
  for (const q of [null, null, D.left, D.up]) { if (q) me.queue = [q]; feed(g); quiet(g); at.push(`${me.body[0].x},${me.body[0].y}`); }
  check('a head crawls onto a body lying across a pit, a bridge', at[1] === '11,10' && me.alive && br.alive, at.join(' '));
  check('...along its back, and off onto bark at the rim', me.alive && at[3] === '10,9' && !g.events.some(e => e.type === 'crash'), at.join(' '));
}

{ // On bark, a body is still a wall; a head's own body over a pit is no bridge for it; and never onto the head.
  const g = board([[Array.from({ length: 8 }, (_, i) => [9, 9 - i]), 'down'], [across(12), 'right']]);
  pit(g);
  quiet(g);
  check('on bark, a body is still a wall', g.events.some(e => e.type === 'crash' && e.snake === g.snakes[0]));
  const g2 = board([[[[11, 9], [12, 9], [13, 9], [13, 10], [12, 10], [11, 10], [10, 10], [9, 10]], 'left']]);
  pit(g2);
  g2.snakes[0].queue = [D.down];
  quiet(g2);
  check('...and its own body over a pit is no bridge for its own head', g2.events.some(e => e.type === 'crash' && e.snake === g2.snakes[0]));
}

{ // The bridge lasts as long as the body: once the tail has passed under a head held there, it falls in.
  const g = board([[Array.from({ length: 8 }, (_, i) => [11, 9 - i]), 'down'], [across(6), 'right']]); // (P1's tail at (9, 10): it leaves (11, 10) in three moves)
  pit(g);
  const [me] = g.snakes;
  feed(g); quiet(g); // (onto the bridge at (11, 10))
  const on = me.alive && me.body[0].x === 11 && me.body[0].y === 10;
  me.stunUntil = g.tick + 6; // (held there)
  for (let n = 0; n < 5 && me.alive; n++) { feed(g); quiet(g); } // (straight on is the pit: a bump holds it there, stunned, till the tail passes)
  check('once its tail has passed, the bridge is pit again, and a head held on it falls in', on && !me.alive && me.fatal === 'hole', JSON.stringify({ on, alive: me.alive, cause: me.cause }));
}

{ // Head to head on a bridge is the usual head-on; cutting the bridge drops a head on the part cut off.
  const g = board([[Array.from({ length: 8 }, (_, i) => [11, 9 - i]), 'down'], [across(12), 'right'], [Array.from({ length: 8 }, (_, i) => [10, 9 - i]), 'down']]);
  pit(g);
  const [a, , c] = g.snakes;
  a.queue = [D.down]; c.queue = [D.down];
  feed(g); quiet(g);
  a.queue = [D.left]; c.queue = [D.right]; // (into each other on the bridge: a at (11, 10) goes left, c at (10, 10) right)
  feed(g); quiet(g);
  check('head to head on a bridge is a head-on', [a, c].some(q => /crashed head-on/.test(q.cause || '')) || g.events.some(e => e.type === 'crash' && /crashed head-on/.test(e.cause || '')), JSON.stringify([a.cause, c.cause]));
  const g2 = board([[Array.from({ length: 8 }, (_, i) => [11, 9 - i]), 'down'], [across(12), 'right'], [[[13, 13], [13, 14], [13, 15], [13, 16], [13, 17]], 'up']]);
  g2.snakes[1].body = across(17, 19).map(([x, y]) => ({ x, y })); // (longer, its head further on: cut well behind it)
  pit(g2);
  const [r, br, cutter] = g2.snakes;
  feed(g2); quiet(g2); // (r onto the bridge at (11, 10))
  cutter.dashes = 1; cutter.queue = [D.up];
  r.queue = [D.left];
  E.flash(g2, cutter); // (up through (13, 12)? no: the dash goes from (13, 12) over (13, 11) to cut at (13, 10), past the bridge's far end)
  feed(g2); quiet(g2);
  const cut = g2.events.find(e => e.type === 'cut'), seen2 = g2.events.map(e => e.type + (e.snake ? e.snake.id : '') + (e.cause || '')).join(' ') + ' cutter ' + JSON.stringify(cutter.body[0]) + ' r ' + JSON.stringify(r.body[0]);
  for (let n = 0; n < 2 && r.alive; n++) { feed(g2); quiet(g2); }
  check('cutting the bridge drops a head on the part cut off', !!cut && !r.alive && /hole/.test(r.cause), JSON.stringify({ cut: !!cut, alive: r.alive, cause: r.cause, head: r.body[0], seen2 }));
}

{ // A jump comes down on a bridge only with no free cell within reach, and only where the bridge will still be there.
  const g = board([[[[11, 7], [11, 6], [11, 5], [11, 4], [11, 3]], 'down'], [across(12), 'right']]);
  for (let x = 10; x <= 12; x++) for (let y = 8; y <= 14; y++) if (y !== 10) g.holes.add(K(x, y)); // (pits on both sides of the bridge, too deep to clear)
  g.holes.add(K(11, 10));
  const [me] = g.snakes;
  E.leap(g, me);
  for (let n = 0; n < 5 && (me.flight || !g.events.some(e => e.type === 'leap')); n++) { feed(g); quiet(g); }
  check('with nowhere free within reach, a jump comes down on a bridge that lasts', me.alive && me.body[0].x === 11 && me.body[0].y === 10 && !me.flight, JSON.stringify(me.body[0]));
  const g2 = board([[[[11, 7], [11, 6], [11, 5], [11, 4], [11, 3]], 'down'], [[[14, 10], [13, 10], [12, 10], [11, 10]], 'right']]); // (its tail on the landing: gone before it'd come down)
  for (let x = 10; x <= 12; x++) for (let y = 8; y <= 14; y++) g2.holes.add(K(x, y));
  E.leap(g2, g2.snakes[0]); quiet(g2);
  check('...never on one that won\'t be there when it comes down', !g2.events.some(e => e.type === 'leap'));
}

// The rivals use bridges too, through the same engine calls: folded on a strip, food on an
// island across a pit, and a person's body lying across it (its tail end trailing down the pit).
function bridgeScene(persona, tail) {
  const g = E.createGame({ withPlayer: true, personas: [persona] });
  g.snakes = g.snakes.slice(0, 2);
  const [b, s] = g.snakes;
  const strip = (x, y) => x >= 1 && x <= 2 && y >= 2 && y <= 21, isle = (x, y) => (x >= 6 && x <= 16 && y >= 4 && y <= 18) || (x === 5 && y === 10);
  for (let y = 0; y < T.GRID; y++) for (let x = 0; x < T.GRID; x++) if (!strip(x, y) && !isle(x, y)) g.holes.add(K(x, y));
  s.body = []; for (let y = 12; y <= 21; y++) s.body.push({ x: 2, y }); for (let y = 21; y >= 12; y--) s.body.push({ x: 1, y }); s.dir = D.up;
  b.body = []; for (let x = 7; x >= 3; x--) b.body.push({ x, y: 11 }); for (let y = 12; y < 12 + tail; y++) b.body.push({ x: 3, y }); b.dir = D.right; b.queue = [];
  s.leapReadyAt = 1e12; // (no jumping: the bridge only)
  g.food = [{ x: 12, y: 11, kind: 'food', expires: 9999 }];
  g.given = new Set([K(12, 11)]);
  const snap = () => ({ snakes: g.snakes.map(q => ({ id: q.id, body: q.body.map(c => ({ ...c })), dir: q.dir, stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0, land: -1, cough: 0 })), holes: g.holes.size, fires: [], pecks: [] });
  g.history = [snap(), snap(), snap()];
  let rode = false, over = false;
  for (let n = 0; n < 40 && s.alive && !over; n++) {
    b.queue = b.body[0].x >= 15 ? [b.body[0].y < 11 ? D.down : D.up] : []; // (it keeps going, round the island)
    feed(g); quiet(g);
    const h = s.body[0];
    if (g.holes.has(K(h.x, h.y))) rode = true;
    if (rode && h.x >= 6 && !g.holes.has(K(h.x, h.y))) over = true;
  }
  return { rode, over, alive: s.alive };
}
{
  const long = bridgeScene('gobbler', 9);
  check('a rival crosses a bridge to an island when it pays, and gets off in time', long.rode && long.over && long.alive, JSON.stringify(long));
  const short = bridgeScene('gobbler', 3);
  check('...and on one too short to cross, never caught on it when its tail passes', short.alive && !short.over, JSON.stringify(short));
}
