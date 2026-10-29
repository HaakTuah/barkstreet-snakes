// ---------------------------------------------------------------- round six B, part 3b: mushrooms come back up
// (DESIGN "Mushrooms come back up".) Swallowed, a mushroom shrinks you by its strength and sits in your cheek
// for CHEEK_TICKS, your mouth full; then it's spat SPIT_REACH ahead, the way you face, a segment stronger (to
// SHRINK_MAX). People here, steered by their queues; the rivals' part is below.

// One tick, with nothing new growing: only the food given, and mushrooms spat since.
const calm = g => { g.food = g.food.filter(f => g.given.has(f.y * T.GRID + f.x) || f.power); return E.step(g); };
const spitOf = g => g.events.find(e => e.type === 'spit');
// Steps until someone spits (at most n), returning that tick's spit.
function untilSpit(g, n = T.CHEEK_TICKS + 2, each = () => {}) {
  for (let i = 0; i < n; i++) { each(i); calm(g); const e = spitOf(g); if (e) return e; }
  return null;
}

{ // Swallowed: shrunk by SHRINK, not stunned, the mouth full (an apple met meanwhile stays where it was), then spat 3 ahead, a shade stronger.
  const g = board([[line(10, 10, 10), 'right'], [line(4, 25, 4), 'right']], { food: [[11, 10, 'mushroom'], [14, 10, 'food']] });
  g.food[0].expires = g.tick + 100;
  const s = g.snakes[0];
  calm(g);
  check('a mushroom swallowed shrinks you by SHRINK', s.body.length === 10 - T.SHRINK, s.body.length);
  check('...and sits in your cheek, for about a second', !!s.cheek && s.cheek.spitAt === g.tick - 1 + T.CHEEK_TICKS, JSON.stringify(s.cheek));
  check('...with no stun', s.stunUntil < g.tick);
  for (let i = 0; i < 3; i++) calm(g);
  check('your mouth full, you go over an apple and it stays', s.body[0].x === 14 && g.food.some(f => f.kind === 'food' && f.x === 14) && s.eaten === 0);
  const e = untilSpit(g);
  const h = s.body[1]; // (where its head was as the tick began: it's spat before anyone moves, where the ring showed)
  check('its time up, it is spat SPIT_REACH ahead of your head', e && e.snake === s && e.x === h.x && e.y === h.y && e.tx === h.x + T.SPIT_REACH && e.ty === h.y, JSON.stringify(e && [e.x, e.y, e.tx, e.ty, h.x, h.y]));
  const lying = g.food.find(f => f.kind === 'mushroom' && f.x === e.tx && f.y === e.ty);
  check('...and lies there on bark, a shade stronger: SHRINK + 1', !!lying && lying.power === T.SHRINK + 1 && e.power === T.SHRINK + 1, JSON.stringify(lying));
  check('...wilting in half the time it had left (at least SPIT_WILT_MIN)', lying && lying.expires - g.tick + 1 === Math.max(T.SPIT_WILT_MIN, Math.round(100 / 2)), lying && lying.expires - g.tick);
  check('...and your mouth is empty again', s.cheek === null);
}

{ // Aimed by steering: a turn before it's spat sends it the way you now face.
  const g = board([[line(10, 10, 6), 'right'], [line(4, 25, 4), 'right']], { food: [[11, 10, 'mushroom']] });
  const s = g.snakes[0];
  calm(g);
  const e = untilSpit(g, T.CHEEK_TICKS + 2, i => { if (i === T.CHEEK_TICKS - 3) s.queue.push(D.down); });
  check('steering aims it: turned down, it lands 3 below your head', e && e.tx === s.body[1].x && e.ty === s.body[1].y + T.SPIT_REACH && e.x === s.body[1].x, JSON.stringify(e && [e.tx, e.ty, s.body[1]]));
}

// A spitter at (x, y) facing right, its cheek due now: the next tick, before anyone moves, it spits to x + SPIT_REACH.
function loaded(bodies, power = T.SHRINK) {
  const g = board(bodies);
  g.snakes[0].cheek = { power, spitAt: g.tick, left: 120 };
  return g;
}

{ // On a head: that snake swallows it (shrinking, its mouth full), and spits it on in its turn, a shade stronger again.
  const g = loaded([[line(6, 10, 5), 'right'], [Array.from({ length: 10 }, (_, i) => [9, 10 - i]), 'down']]);
  const [s, o] = g.snakes;
  calm(g);
  const e = spitOf(g);
  check('a spit on a head is swallowed: it shrinks that snake by the spat strength', e && e.hit === o.id && o.body.length === 10 - (T.SHRINK + 1), JSON.stringify(e && [e.tx, e.ty, e.hit, o.body.length]));
  check('...and it sits in that snake\'s cheek, to come back up', !!o.cheek && o.cheek.power === T.SHRINK + 1);
  o.queue.push(D.left);
  const back = untilSpit(g);
  check('...which spits it on, a shade stronger again', back && back.snake === o && back.power === T.SHRINK + 2, JSON.stringify(back && [back.power, back.tx, back.ty]));
}

{ // Never stronger than SHRINK_MAX, and it never kills: it shrinks you no further than MIN_LENGTH.
  const g = loaded([[line(6, 10, 5), 'right'], [[[9, 10], [9, 9], [9, 8], [9, 7]], 'down']], T.SHRINK_MAX);
  const o = g.snakes[1];
  calm(g);
  const e = spitOf(g);
  check(`a mushroom at its strongest stays ${T.SHRINK_MAX}`, e && e.power === T.SHRINK_MAX);
  check('...and a hit shrinks a snake no further than MIN_LENGTH: it lives', e && e.hit === o.id && o.alive && o.body.length === T.MIN_LENGTH, JSON.stringify(e && [e.hit, o.body.length]));
}

{ // A head whose mouth is full: it bounces off, as off a body.
  const g = loaded([[line(6, 10, 5), 'right'], [Array.from({ length: 6 }, (_, i) => [9, 10 - i]), 'down']]);
  const o = g.snakes[1];
  o.cheek = { power: 3, spitAt: g.tick + 5, left: 80 };
  calm(g);
  const e = spitOf(g);
  check('on a head with its mouth full, it bounces off and lies beside', e && e.hit === -1 && e.lx != null && !(e.lx === e.tx && e.ly === e.ty) && o.body.length === 6, JSON.stringify(e));
}

{ // On a body: it rolls off by the roll rule; off the board or into a hole: gone.
  const g = loaded([[line(6, 10, 5), 'right'], [Array.from({ length: 12 }, (_, i) => [9, 4 + i]), 'up']]);
  calm(g);
  const e = spitOf(g), lies = e && g.food.find(f => f.kind === 'mushroom' && f.x === e.lx && f.y === e.ly);
  check('on a body, it rolls off and lies beside it', e && e.tx === 9 && e.hit === -1 && !!lies && Math.abs(e.lx - 9) === 1 && e.ly === 10, JSON.stringify(e));

  const edge = loaded([[line(T.GRID - 2, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  calm(edge);
  const off = spitOf(edge);
  check('over the edge, it is gone', off && off.lx === null && off.hit === -1 && !edge.food.some(f => f.power), JSON.stringify(off));

  const pit = loaded([[line(6, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  pit.holes.add(K(9, 10));
  calm(pit);
  const down = spitOf(pit);
  check('into a hole, it is gone', down && down.tx === 9 && down.lx === null && !pit.food.some(f => f.power), JSON.stringify(down));
}

// ---- The rivals: they aim, they dodge, and they eat one on purpose when it pays, each in its style.

// A rival (persona `key`) and a person, set on the board as given, with the past as the rival saw it: the
// person going straight (its body `back` cells behind where it is now, a snapshot a tick), the rival as it is.
function spitScene(key, rival, person, { back = 3, food = [] } = {}) {
  const g = E.createGame({ humans: [{ name: 'P' }], personas: [key] });
  const [p, r] = g.snakes;
  r.body = rival[0].map(([x, y]) => ({ x, y })); r.dir = D[rival[1]];
  p.body = person[0].map(([x, y]) => ({ x, y })); p.dir = D[person[1]];
  g.food = food.map(([x, y, kind = 'food']) => ({ x, y, kind, expires: 9999 }));
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  for (const s of g.snakes) { s.lastAte = g.time; s.nextStarve = g.time + T.HUNGER_MS; s.leapReadyAt = 1e9; s.flashReadyAt = 1e9; } // (fed; no jump or flash: it's the mushroom that's weighed)
  const snap = k => ({ snakes: g.snakes.map(q => ({ id: q.id, body: q.body.map(c => q === p ? { x: c.x - p.dir.x * k, y: c.y - p.dir.y * k } : { ...c }), dir: q.dir, stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0, land: -1,
    spitIn: q.cheek ? q.cheek.spitAt - (g.tick - k) : 0, spitPower: q.cheek ? Math.min(T.SHRINK_MAX, q.cheek.power + 1) : 0 })), holes: 0, fires: [], pecks: [] });
  g.reset = () => { g.history = Array.from({ length: back + 1 }, (_, i) => snap(back - i)); };
  g.reset();
  return g;
}

{ // Aiming: a rival with a mushroom in its cheek steers so it comes down on a head. The person heads up column 13
  // from (13,14), eight long; the rival, its cheek due after five moves, at (6,10) facing right. Straight on, it
  // spits to (14,10), the person at (13,9) by then: a miss; turning up once on the way, it spits from (10,9) onto (13,9).
  const hits = {};
  for (const key of ['sniper', 'joker', 'drab', 'gobbler', 'mason', 'ghost']) {
    const g = spitScene(key, [line(6, 10, 6), 'right'], [Array.from({ length: 8 }, (_, i) => [13, 14 + i]), 'up']);
    g.snakes[1].cheek = { power: T.SHRINK, spitAt: g.tick + 4, left: 100 };
    g.reset();
    const e = untilSpit(g, 6);
    hits[key] = e ? (e.hit === 0 ? 'hit' : `missed at ${e.tx},${e.ty}`) : 'none';
  }
  check('a rival with a mushroom in its cheek aims it at a head', Object.values(hits).filter(v => v === 'hit').length >= 5, JSON.stringify(hits));
}

{ // Dodging: a person's mushroom comes up in four moves at (12,5), three ahead of where they'll be; a rival heading
  // up column 12 from (12,9), ten long, after the apple at (12,4), would be there just then. It sees the ring and
  // keeps its head out of it (the apple can wait a tick).
  const hit = {};
  for (const key of ['sniper', 'joker', 'drab', 'gobbler', 'mason', 'ghost']) {
    const g = spitScene(key, [Array.from({ length: 10 }, (_, i) => [12, 9 + i]), 'up'], [line(5, 5, 4), 'right'], { food: [[12, 4]] });
    g.snakes[0].cheek = { power: T.SHRINK, spitAt: g.tick + 3, left: 100 };
    g.reset();
    const e = untilSpit(g, 5);
    hit[key] = e ? (e.hit === 1 ? 'hit' : 'dodged') : 'none';
  }
  check('a rival keeps its head out of a ring pointed at it', Object.values(hit).every(v => v === 'dodged'), JSON.stringify(hit));
}

{ // Eating one on purpose, each in its style: long, a mushroom two ahead, a person's head close and on a line it
  // could spit along. Joker takes the shot; Drab, Gobbler (who hates them) and Ghost don't.
  const body = [...line(10, 12, 11), ...Array.from({ length: 15 }, (_, i) => [i, 13])]; // (26 long, folded back under itself)
  const ate = {};
  for (const key of ['joker', 'drab', 'gobbler', 'ghost']) {
    const g = spitScene(key, [body, 'right'], [Array.from({ length: 8 }, (_, i) => [16 + i, 9]), 'left'], { food: [[12, 12, 'mushroom']] });
    const r = g.snakes[1];
    for (let n = 0; n < 3 && !r.cheek; n++) calm(g);
    ate[key] = !!r.cheek;
  }
  check('long, with a rival close in a line, Joker eats a mushroom for the shot; Drab, Gobbler and Ghost leave it', ate.joker && !ate.drab && !ate.gobbler && !ate.ghost, JSON.stringify(ate));
}

{ // Onto food it rolls off; with nowhere at all to roll, it's gone.
  const g = loaded([[line(6, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  g.food = [{ x: 9, y: 10, kind: 'food', expires: 9999 }]; g.given = new Set([K(9, 10)]);
  calm(g);
  const e = spitOf(g);
  check('onto an apple, it rolls off beside it', e && e.lx != null && Math.abs(e.lx - 9) + Math.abs(e.ly - 10) === 1 && g.food.some(f => f.kind === 'food' && f.x === 9), JSON.stringify(e));
  const shut = loaded([[line(6, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  for (const [x, y] of [[9, 9], [9, 11], [10, 10], [8, 9], [8, 11], [10, 9], [10, 11]]) shut.holes.add(K(x, y));
  shut.food = [{ x: 9, y: 10, kind: 'food', expires: 9999 }]; shut.given = new Set([K(9, 10)]);
  calm(shut);
  const gone = spitOf(shut);
  check('...and with holes all round it, nowhere to roll: gone', gone && gone.lx === null && gone.hit === -1 && !shut.food.some(f => f.power), JSON.stringify(gone));
}
