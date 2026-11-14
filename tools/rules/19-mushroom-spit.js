// ---------------------------------------------------------------- round six B, part 3b: mushrooms come back up
// (DESIGN "Mushrooms come back up" and "The spit flies along the line".) Swallowed, a mushroom shrinks you by its
// strength and sits in your cheek for CHEEK_TICKS, your mouth full; then it's spat straight ahead, the way you face, a
// segment stronger (to SHRINK_MAX), and flies SPIT_SPEED cells a tick, up to SPIT_REACH, till something's in its way.
// People here, steered by their queues; the rivals' part is below.

// One tick, with nothing new growing: only the food given, and mushrooms spat since.
const calm = g => { g.food = g.food.filter(f => g.given.has(f.y * T.GRID + f.x) || f.power); return E.step(g); };
const spitOf = g => g.events.find(e => e.type === 'spit'), spatOf = g => g.events.find(e => e.type === 'spat');
// Steps until someone's mushroom stops (at most n), returning that tick's spat, with the spit it left on (e.from).
function untilSpat(g, n = T.CHEEK_TICKS + 4, each = () => {}) {
  let from = null;
  for (let i = 0; i < n; i++) {
    each(i); calm(g);
    from = spitOf(g) || from;
    const e = spatOf(g);
    if (e) return Object.assign(e, { from });
  }
  return null;
}

{ // Swallowed: shrunk by SHRINK, not stunned, the mouth full (an apple met meanwhile stays where it was), then spat
  // straight ahead, flying two a tick, to lie five out, a shade stronger.
  const g = board([[line(9, 10, 10), 'right'], [line(4, 25, 4), 'right']], { food: [[10, 10, 'mushroom'], [13, 10, 'food']] });
  g.food[0].expires = g.tick + 100;
  const s = g.snakes[0];
  calm(g);
  check('a mushroom swallowed shrinks you by SHRINK', s.body.length === 10 - T.SHRINK, s.body.length);
  check('...and sits in your cheek, for about a second', !!s.cheek && s.cheek.spitAt === g.tick - 1 + T.CHEEK_TICKS, JSON.stringify(s.cheek));
  check('...with no stun', s.stunUntil < g.tick);
  for (let i = 0; i < 3; i++) calm(g);
  check('your mouth full, you go over an apple and it stays', s.body[0].x === 13 && g.food.some(f => f.kind === 'food' && f.x === 13) && s.eaten === 0);
  let flying = null, e = null;
  for (let i = 0; i < T.CHEEK_TICKS + 4 && !e; i++) { calm(g); if (spitOf(g)) flying = { at: g.tick, from: spitOf(g), spits: g.spits.map(m => [m.x, m.y]) }; e = spatOf(g); }
  const h = flying && flying.from; // (where its head was as the tick began: it's spat before anyone moves, along the dotted line)
  check('its time up, it leaves your head and flies SPIT_SPEED cells that tick, in the air', h && h.snake === s && flying.spits.length === 1 && flying.spits[0][0] === h.x + T.SPIT_SPEED && flying.spits[0][1] === h.y, JSON.stringify(flying));
  check('...and with nothing in its way, it comes down SPIT_REACH ahead of where it left', e && e.hit === -1 && e.lx === h.x + T.SPIT_REACH && e.ly === h.y && g.tick - flying.at === Math.ceil(T.SPIT_REACH / T.SPIT_SPEED) - 1, JSON.stringify([e, g.tick - flying.at]));
  const lying = e && g.food.find(f => f.kind === 'mushroom' && f.x === e.lx && f.y === e.ly);
  check('...and lies there on bark, a shade stronger: SHRINK + 1', !!lying && lying.power === T.SHRINK + 1 && e.power === T.SHRINK + 1, JSON.stringify(lying));
  check('...wilting in half the time it had left (at least SPIT_WILT_MIN)', lying && lying.expires - g.tick + 1 === Math.max(T.SPIT_WILT_MIN, Math.round(100 / 2)), lying && lying.expires - g.tick);
  check('...and your mouth is empty again, nothing left in the air', s.cheek === null && !g.spits.length);
}

{ // Aimed by steering: a turn before it's spat sends it the way you now face.
  const g = board([[line(10, 10, 6), 'right'], [line(4, 25, 4), 'right']], { food: [[11, 10, 'mushroom']] });
  calm(g);
  const e = untilSpat(g, T.CHEEK_TICKS + 4, i => { if (i === T.CHEEK_TICKS - 3) g.snakes[0].queue.push(D.down); });
  check('steering aims it: turned down, it flies down and lies SPIT_REACH below where it left', e && e.lx === e.from.x && e.ly === e.from.y + T.SPIT_REACH, JSON.stringify(e && [e.lx, e.ly, e.from.x, e.from.y]));
}

// A spitter at (x, y) facing right, its cheek due now: the next tick, before anyone moves, it spits from (x, y).
function loaded(bodies, power = T.SHRINK) {
  const g = board(bodies);
  g.snakes[0].cheek = { power, spitAt: g.tick, left: 120 };
  return g;
}
const column = (x, y, n, dy = -1) => Array.from({ length: n }, (_, i) => [x, y + dy * i]); // (a body down from its head at (x, y): dy -1, it came from above)

{ // On a head: that snake swallows it (shrinking, its mouth full), and spits it on in its turn, a shade stronger again.
  const g = loaded([[line(6, 10, 5), 'right'], [column(8, 10, 10), 'down']]);
  const [s, o] = g.snakes;
  calm(g);
  const e = spatOf(g);
  check('a spit on a head two out is swallowed at once: it shrinks that snake by the spat strength', e && e.hit === o.id && e.x === 8 && o.body.length === 10 - (T.SHRINK + 1), JSON.stringify(e && [e.x, e.y, e.hit, o.body.length]));
  check('...and it sits in that snake\'s cheek, to come back up', !!o.cheek && o.cheek.power === T.SHRINK + 1);
  o.queue.push(D.left);
  const back = untilSpat(g);
  check('...which spits it on, a shade stronger again', back && back.from.snake === o && back.power === T.SHRINK + 2, JSON.stringify(back && [back.power, back.x, back.y]));
}

{ // Farther out, it takes time to get there: it hits where the head is when it arrives (lead your shots), and the
  // target has that time to step out of the line.
  const lead = loaded([[line(6, 10, 5), 'right'], [column(10, 9, 8), 'down']]); // (four out, a move above the line: in it when the mushroom gets there)
  calm(lead); calm(lead);
  const e = spatOf(lead);
  check('four out, it hits the head that has moved into the line by the time it gets there, the tick after the spit', e && e.hit === 1 && e.x === 10 && e.y === 10 && !!lead.snakes[1].cheek, JSON.stringify(e));
  const caught = loaded([[line(6, 10, 5), 'right'], [column(8, 11, 8, 1), 'up']]); // (just below its second cell, heading up into it)
  calm(caught);
  const c = spatOf(caught);
  check('a head that moves onto it where it hangs between ticks is hit too', c && c.hit === 1 && c.x === 8 && c.y === 10, JSON.stringify(c));
  const out = loaded([[line(6, 10, 5), 'right'], [[[11, 10], [12, 10], [13, 10], [14, 10]], 'left']]); // (five out, coming at it, and it steps out)
  out.snakes[1].queue.push(D.up);
  const d = untilSpat(out, 4);
  check('...and one that steps out of the line in time isn\'t: it flies on past', d && d.hit === -1 && !out.snakes[1].cheek, JSON.stringify(d));
}

{ // A golden dash straight through where one hangs is hit by it too (nothing passes through a mushroom), but the
  // spitter's own head dashing past its own goes over it, and it flies on.
  const g = loaded([[line(6, 10, 5), 'right'], [column(8, 12, 4, 1), 'up']]);
  const o = g.snakes[1];
  o.dashes = 2; E.flash(g, o);
  calm(g);
  const e = spatOf(g);
  check('a head that dashes over a mushroom where it hangs is hit by it', e && e.hit === o.id && !!o.cheek, JSON.stringify(e && [e.x, e.y, e.hit]));
  const own = loaded([[line(6, 10, 5), 'right'], [line(4, 25, 4), 'right']]), s = own.snakes[0];
  s.dashes = 2; E.flash(own, s);
  calm(own); calm(own);
  check('...while the spitter dashing past its own goes over it: no hit, no bounce off its own head', !spatOf(own) && !s.cheek && s.body.length === 5, JSON.stringify(own.events.filter(e => e.type === 'spat')));
}

{ // Over the edge where the edges wrap for the spitter: it flies on from the far side.
  const g = loaded([[line(T.GRID - 2, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  g.snakes[0].wrapUntil = g.time + 5000;
  const e = untilSpat(g, 4);
  check('where the edges wrap for the spitter, it flies on over the edge from the far side', e && e.hit === -1 && e.lx === T.SPIT_REACH - 2 && e.ly === 10, JSON.stringify(e && [e.lx, e.ly]));
}

{ // A mushroom in the air still counts toward the board's mushrooms, as one in a cheek does: none grows meanwhile.
  const g = loaded([[line(6, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  g.food = Array.from({ length: T.MUSHROOMS - 1 }, (_, i) => ({ x: 2 + i, y: 2, kind: 'mushroom', expires: 9999 }));
  E.step(g);
  check('while one is in the air, no new mushroom grows in its place', g.spits.length === 1 && g.food.filter(f => f.kind === 'mushroom').length === T.MUSHROOMS - 1, JSON.stringify([g.spits.length, g.food.filter(f => f.kind === 'mushroom').length]));
}

{ // Never stronger than SHRINK_MAX, and it never kills: it shrinks you no further than MIN_LENGTH.
  const g = loaded([[line(6, 10, 5), 'right'], [column(8, 10, 4), 'down']], T.SHRINK_MAX);
  const o = g.snakes[1];
  calm(g);
  const e = spatOf(g);
  check(`a mushroom at its strongest stays ${T.SHRINK_MAX}`, e && e.power === T.SHRINK_MAX);
  check('...and a hit shrinks a snake no further than MIN_LENGTH: it lives', e && e.hit === o.id && o.alive && o.body.length === T.MIN_LENGTH, JSON.stringify(e && [e.hit, o.body.length]));
}

{ // A head whose mouth is full: it bounces off, as off a body.
  const g = loaded([[line(6, 10, 5), 'right'], [column(8, 10, 6), 'down']]);
  const o = g.snakes[1];
  o.cheek = { power: 3, spitAt: g.tick + 5, left: 80 };
  calm(g);
  const e = spatOf(g);
  check('on a head with its mouth full, it bounces off and lies beside', e && e.hit === -1 && e.lx != null && !(e.lx === e.x && e.ly === e.y) && o.body.length === 6, JSON.stringify(e));
}

{ // On a body: it rolls off by the roll rule, and the head behind that body is shielded; off the board or into a hole: gone.
  const g = loaded([[line(6, 10, 5), 'right'], [column(8, 4, 12, 1), 'up'], [line(11, 10, 4, 1), 'left']]);
  calm(g);
  const e = spatOf(g), lies = e && g.food.find(f => f.kind === 'mushroom' && f.x === e.lx && f.y === e.ly);
  check('on a body, it stops there and rolls off beside it', e && e.x === 8 && e.hit === -1 && !!lies && Math.abs(e.lx - 8) === 1 && e.ly === 10, JSON.stringify(e));
  check('...and the head behind that body is safe: a body in the line is a shield', !g.snakes[2].cheek);

  const edge = loaded([[line(T.GRID - 2, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  calm(edge);
  const off = spatOf(edge);
  check('over the edge, it is gone', off && off.lx === null && off.hit === -1 && !edge.food.some(f => f.power) && !edge.spits.length, JSON.stringify(off));

  const pit = loaded([[line(6, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  pit.holes.add(K(9, 10));
  calm(pit); calm(pit);
  const down = spatOf(pit);
  check('into a hole three out, it is gone, the tick after the spit', down && down.x === 9 && down.lx === null && !pit.food.some(f => f.power), JSON.stringify(down));
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
  for (const s of g.snakes) { s.lastAte = g.time; s.nextStarve = g.time + T.HUNGER_MS; s.restedAt = 1e9; } // (fed; no jump or flash: it's the mushroom that's weighed)
  const snap = k => ({ snakes: g.snakes.map(q => ({ id: q.id, body: q.body.map(c => q === p ? { x: c.x - p.dir.x * k, y: c.y - p.dir.y * k } : { ...c }), dir: q.dir, stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0, land: -1,
    spitIn: q.cheek ? q.cheek.spitAt - (g.tick - k) : 0, spitPower: q.cheek ? Math.min(T.SHRINK_MAX, q.cheek.power + 1) : 0 })), holes: 0, fires: [], pecks: [] });
  g.reset = () => { g.history = Array.from({ length: back + 1 }, (_, i) => snap(back - i)); };
  g.reset();
  return g;
}

{ // Aiming: a rival with a mushroom in its cheek steers so its line meets a head, leading it. The person heads up
  // column 13 from (13,14), eight long; the rival, its cheek due after four moves, at (6,10) facing right. Straight
  // on, it spits from (10,10) into the person's neck: a miss; turning up once on the way, it spits along row 9, and
  // the person's head comes up into (13,9) as the mushroom gets there.
  const hits = {};
  for (const key of ['sniper', 'joker', 'drab', 'gobbler', 'mason', 'ghost']) {
    const g = spitScene(key, [line(6, 10, 6), 'right'], [Array.from({ length: 8 }, (_, i) => [13, 14 + i]), 'up']);
    g.snakes[1].cheek = { power: T.SHRINK, spitAt: g.tick + 4, left: 100 };
    g.reset();
    const e = untilSpat(g, 8);
    hits[key] = e ? (e.hit === 0 ? 'hit' : `missed at ${e.x},${e.y}`) : 'none';
  }
  // (The person is far, so a rival notices them a little late (2q) and may guess their head a move behind; it hedges
  // by leading for both, and the line along row 9, which the person walks into, is good for either.)
  check('a rival with a mushroom in its cheek aims it at a head, leading it', Object.values(hits).filter(v => v === 'hit').length >= 5, JSON.stringify(hits));
}

{ // Dodging: a person's mushroom leaves after three moves from (8,5), flying right along row 5; a rival heading up
  // column 12 from (12,9), ten long, after the apple at (12,4), would come into (12,5) just as it gets there. It sees
  // the dotted line and keeps its head out of it (the apple can wait a tick).
  const hit = {};
  for (const key of ['sniper', 'joker', 'drab', 'gobbler', 'mason', 'ghost']) {
    const g = spitScene(key, [Array.from({ length: 10 }, (_, i) => [12, 9 + i]), 'up'], [line(5, 5, 4), 'right'], { food: [[12, 4]] });
    g.snakes[0].cheek = { power: T.SHRINK, spitAt: g.tick + 3, left: 100 };
    g.reset();
    const e = untilSpat(g, 7);
    hit[key] = e ? (e.hit === 1 ? 'hit' : 'dodged') : 'none';
  }
  check('a rival keeps its head out of a line pointed at it', Object.values(hit).every(v => v === 'dodged'), JSON.stringify(hit));
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
  const e = untilSpat(g, 3);
  check('onto an apple three out, it rolls off beside it', e && e.lx != null && Math.abs(e.lx - 9) + Math.abs(e.ly - 10) === 1 && g.food.some(f => f.kind === 'food' && f.x === 9), JSON.stringify(e));
  const shut = loaded([[line(6, 10, 5), 'right'], [line(4, 25, 4), 'right']]);
  for (const [x, y] of [[9, 9], [9, 11], [10, 10], [8, 9], [8, 11], [10, 9], [10, 11]]) shut.holes.add(K(x, y));
  shut.food = [{ x: 9, y: 10, kind: 'food', expires: 9999 }]; shut.given = new Set([K(9, 10)]);
  const gone = untilSpat(shut, 3);
  check('...and with holes all round it, nowhere to roll: gone', gone && gone.lx === null && gone.hit === -1 && !shut.food.some(f => f.power), JSON.stringify(gone));
}

{ // The spitter slides over its own mushroom (2x): for OWN_SPIT_TICKS after the spit, its head goes over it as a full
  // mouth goes over food, and it stays; anyone else is hit by it as before. (Before, a snake that kept going ate it
  // a few moves later, shrank again, and spat it again: a loop.) The spitter, ten long, swallows the mushroom at
  // (10,10) going right and spits it from (18,10), to lie at (23,10).
  const scene = () => {
    const g = board([[line(9, 10, 10), 'right'], [Array.from({ length: 4 }, (_, i) => [2, 5 - i]), 'down']], { food: [[10, 10, 'mushroom']] });
    g.food[0].expires = g.tick + 200;
    calm(g);
    return [g, untilSpat(g)];
  };
  const [g, e] = scene(), s = g.snakes[0], long = s.body.length;
  while (e && s.body[0].x < e.lx) calm(g);
  check('going straight on, the spitter slides over its own mushroom: no shrink, its mouth empty', e && s.body[0].x === e.lx && s.body.length === long && !s.cheek, JSON.stringify([e && e.lx, s.body[0], s.body.length, long]));
  check('...and the mushroom stays where it lay', e && g.food.some(f => f.kind === 'mushroom' && f.x === e.lx && f.y === e.ly));
  // After OWN_SPIT_TICKS it's a mushroom like any: turned down, the mushroom put in its way on the last move it
  // slides (it came down on move 1 of OWN_SPIT_TICKS), then again on the first move after.
  const [h] = scene(), r = h.snakes[0], m = h.food.find(f => f.kind === 'mushroom' && f.power); // (the spat one: a mushroom the round grows at (10,10), where the first lay, is kept by calm() and comes first)
  r.queue.push(D.down);
  for (let i = 2; i < T.OWN_SPIT_TICKS; i++) calm(h);
  const inWay = () => Object.assign(m, { x: r.body[0].x, y: r.body[0].y + 1 });
  inWay(); calm(h);
  const last = !r.cheek && h.food.includes(m);
  inWay(); calm(h);
  check('...but only for OWN_SPIT_TICKS: it slides over it on the last of them, and swallows it on the next as anyone would', last && !!r.cheek, JSON.stringify([last, r.body[0]]));
  // Anyone else: hit as before. Just after the spit, another snake heads up onto it from right below.
  const [o, e3] = scene(), q = o.snakes[1];
  q.body = Array.from({ length: 6 }, (_, i) => ({ x: e3.lx, y: e3.ly + 1 + i })); q.dir = D.up;
  calm(o);
  check('...while anyone else who comes over it swallows it, as before', !!q.cheek, JSON.stringify(q.body[0]));
}

{ // The rivals know it too (2x): a rival that has just spat its mushroom two ahead of it, an apple three beyond, plays
  // as if the mushroom weren't there, as a person can, and slides over it; any other mushroom there turns most aside.
  const paths = shroom => {
    const out = {};
    for (const key of ['sniper', 'joker', 'drab', 'mason', 'gobbler', 'ghost', 'vulture', 'creeper']) {
      const g = spitScene(key, [line(8, 12, 6), 'right'], [Array.from({ length: 5 }, (_, i) => [17 + i, 22]), 'left'], { food: shroom ? [[10, 12, 'mushroom'], [13, 12]] : [[13, 12]] });
      const r = g.snakes[1], path = [];
      if (shroom === 'own') Object.assign(g.food[0], { power: T.SHRINK + 1, spitBy: r.id, slideUntil: g.tick + T.OWN_SPIT_TICKS });
      // (Over the mushroom and onto the apple: after it, the planner sees the spit turn a mushroom like any, and may rightly turn.)
      for (let n = 0; n < 5; n++) { calm(g); path.push(`${r.body[0].x},${r.body[0].y}${r.cheek ? ' swallowed' : ''}`); }
      out[key] = path.join(' ');
    }
    return out;
  };
  const none = paths(null), own = paths('own'), any = paths('any');
  const same = Object.keys(none).filter(k => own[k] === none[k]), aside = Object.keys(none).filter(k => any[k] !== none[k]);
  check('a rival plays on over its own fresh spit as if it weren\'t there, and slides over it', same.length === 8, JSON.stringify(own));
  check('...where any other mushroom there turns most of them aside', aside.length >= 6, JSON.stringify(any));
}
