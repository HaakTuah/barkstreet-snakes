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
  const h = s.body[0];
  check('its time up, it is spat SPIT_REACH ahead of your head', e && e.snake === s && e.tx === h.x + T.SPIT_REACH && e.ty === h.y, JSON.stringify(e && [e.tx, e.ty, h.x, h.y]));
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
  check('steering aims it: turned down, it lands 3 below your head', e && e.tx === s.body[0].x && e.ty === s.body[0].y + T.SPIT_REACH, JSON.stringify(e && [e.tx, e.ty, s.body[0]]));
}

// A spitter at (x, y) facing right, its cheek due now: the next tick it moves to x + 1 and spits to x + 1 + SPIT_REACH.
function loaded(bodies, power = T.SHRINK) {
  const g = board(bodies);
  g.snakes[0].cheek = { power, spitAt: g.tick, left: 120 };
  return g;
}

{ // On a head: that snake swallows it (shrinking, its mouth full), and spits it on in its turn, a shade stronger again.
  const g = loaded([[line(5, 10, 5), 'right'], [[[9, 9], [9, 8], [9, 7], [9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1], [9, 0]], 'down']]);
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
  const g = loaded([[line(5, 10, 5), 'right'], [[[9, 9], [9, 8], [9, 7], [9, 6]], 'down']], T.SHRINK_MAX);
  const o = g.snakes[1];
  calm(g);
  const e = spitOf(g);
  check(`a mushroom at its strongest stays ${T.SHRINK_MAX}`, e && e.power === T.SHRINK_MAX);
  check('...and a hit shrinks a snake no further than MIN_LENGTH: it lives', e && e.hit === o.id && o.alive && o.body.length === T.MIN_LENGTH, JSON.stringify(e && [e.hit, o.body.length]));
}

{ // A head whose mouth is full: it bounces off, as off a body.
  const g = loaded([[line(5, 10, 5), 'right'], [[[9, 9], [9, 8], [9, 7], [9, 6], [9, 5], [9, 4]], 'down']]);
  const o = g.snakes[1];
  o.cheek = { power: 3, spitAt: g.tick + 5, left: 80 };
  calm(g);
  const e = spitOf(g);
  check('on a head with its mouth full, it bounces off and lies beside', e && e.hit === -1 && e.lx != null && !(e.lx === e.tx && e.ly === e.ty) && o.body.length === 6, JSON.stringify(e));
}

{ // On a body: it rolls off by the roll rule; off the board or into a hole: gone.
  const g = loaded([[line(5, 10, 5), 'right'], [Array.from({ length: 12 }, (_, i) => [9, 4 + i]), 'up']]);
  calm(g);
  const e = spitOf(g), lies = e && g.food.find(f => f.kind === 'mushroom' && f.x === e.lx && f.y === e.ly);
  check('on a body, it rolls off and lies beside it', e && e.tx === 9 && e.hit === -1 && !!lies && Math.abs(e.lx - 9) === 1 && e.ly === 10, JSON.stringify(e));

  const edge = loaded([[line(T.GRID - 3, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  calm(edge);
  const off = spitOf(edge);
  check('over the edge, it is gone', off && off.lx === null && off.hit === -1 && !edge.food.some(f => f.power), JSON.stringify(off));

  const pit = loaded([[line(5, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  pit.holes.add(K(9, 10));
  calm(pit);
  const down = spitOf(pit);
  check('into a hole, it is gone', down && down.tx === 9 && down.lx === null && !pit.food.some(f => f.power), JSON.stringify(down));
}
