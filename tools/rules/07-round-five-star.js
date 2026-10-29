// ---------------------------------------------------------------- round five: Star
// What each persona does in a view built by hand, over a few tries: the way
// it goes, and "+flash" or "+jump" if it asked for one (memory.flash, memory.power).
const habits = (view, keys, n = 10) => Object.fromEntries(keys.map(key => {
  const out = {};
  for (let i = 0; i < n; i++) {
    const memory = {}, v = view(), d = AI.decide(v, AI.PERSONAS[key], memory);
    const k = Object.keys(D).find(q => D[q] === d) + (memory.flash === v.tick ? '+flash' : '') + (memory.power === v.tick ? '+jump' : '');
    out[k] = (out[k] || 0) + 1;
  }
  return [key, out];
}));
const rest = Object.keys(AI.PERSONAS).filter(k => k !== 'star' && k !== 'wildcard'); // (a Wildcard that shows off this round plays its powers as Star does: see 14-the-rivals-who-change)
const powered = (got, mark) => Object.entries(got).filter(([, out]) => Object.keys(out).some(k => k.includes(mark))).map(([key]) => key);

{ // Star flashes every chance it gets: rested on open ground, an apple four on, it flashes for it; nobody else thinks an apple worth that.
  const view = () => aiView({ me: aiMe(line(6, 12, 5), 'right', { flashIn: 0 }), others: [aiRival(1, line(20, 2, 5), 'right')], food: [{ x: 10, y: 12, kind: 'food', expires: 999 }] });
  const star = habits(view, ['star']).star, others = powered(habits(view, rest, 4), '+flash');
  check('Star flashes where no one else would (an apple four on, open ground)', star['right+flash'] === 10 && !others.length, JSON.stringify({ star, others }));
}

{ // ...weighed every way, but never into a crash: with a body two on across its way, it flashes off to the side.
  const wall = Array.from({ length: 9 }, (_, i) => [8, 8 + i]); // (a rival lying across (8, 8) to (8, 16))
  const view = () => aiView({ me: aiMe(line(6, 12, 5), 'right', { flashIn: 0 }), others: [aiRival(1, wall, 'up')], food: [{ x: 12, y: 12, kind: 'food', expires: 999 }] });
  const star = habits(view, ['star']).star, others = powered(habits(view, rest, 4), '+flash');
  check('...weighed every way: it flashes off to the side of a body two on, never into it', (star['up+flash'] || 0) + (star['down+flash'] || 0) === 10, JSON.stringify(star));
  check('...where nobody else flashes', !others.length, others.join(', '));
  // Hemmed in two cells on every way (the flash would stop in a body), it doesn't flash at all.
  const cup = [[6, 10], [7, 10], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [7, 14], [6, 14], [5, 14], [4, 14], [3, 14]];
  const hemmed = habits(() => aiView({ me: aiMe(line(6, 12, 5), 'right', { flashIn: 0 }), others: [aiRival(1, cup, 'left')] }), ['star']).star;
  check('...and with a body two on every way, it never flashes', !Object.keys(hemmed).some(k => k.includes('+flash')), JSON.stringify(hemmed));
}

{ // Star jumps any hurdle with somewhere free to land: over a rival lying across its way, onto open ground (the apple's two beyond).
  // Everyone else jumps only out of a crash, or onto food (or one short of it), and goes round.
  const wall = Array.from({ length: 17 }, (_, i) => [7, 4 + i]); // (a rival lying across (7, 4) to (7, 20), right in front)
  const view = () => aiView({ me: aiMe(line(6, 12, 5), 'right', { leapIn: 0 }), others: [aiRival(1, wall, 'up')], food: [{ x: 10, y: 12, kind: 'food', expires: 999 }] });
  const star = habits(view, ['star']).star, others = powered(habits(view, rest, 4), '+jump');
  check('Star jumps a hurdle onto open ground, where no one else would', star['right+jump'] === 10 && !others.length, JSON.stringify({ star, others }));
  // In the game: up over the rival, and down on the far side.
  const g = E.createGame({ withPlayer: false, personas: ['star', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = line(6, 12, 5).map(([x, y]) => ({ x, y })); a.dir = D.right;
  b.body = wall.map(([x, y]) => ({ x, y })); b.dir = D.up;
  g.food = [{ x: 10, y: 12, kind: 'food', expires: 999 }];
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  look(g);
  quiet(g);
  quiet(g);
  check('...in the game, up over it and down on the far side', a.alive && a.body[0].x === 8 && a.body[0].y === 12 && g.snakes.every(o => o.alive), JSON.stringify(a.body[0]));
  // But only where no rival could get to the landing before it's down: another's head three cells above
  // the landing (as Star saw it, a moment ago), bound to turn, and it goes round. (A head moving into the
  // landing as it takes off, and the jump doesn't go: Star crawls into the body it meant to hop.)
  const near = habits(() => aiView({ me: aiMe(line(6, 12, 5), 'right', { leapIn: 0 }), others: [aiRival(1, wall, 'up'), aiRival(2, line(8, 9, 5, 1), 'left')], food: [{ x: 10, y: 12, kind: 'food', expires: 999 }] }), ['star']).star;
  check('...but not where a rival\'s head could get to the landing first', !Object.keys(near).some(k => k.includes('+jump')), JSON.stringify(near));
}

{ // Star spends golden dashes on speed too, but at anyone's price for one: on open ground, with nothing to cut and
  // nothing golden on the way, it holds them (free to it, it threw both away in the two ticks after a leaf, a
  // zig-zag that got it nothing). Racing a rival to an apple, it dashes; and it dashes to take a golden leaf.
  const view = (food, rival = aiRival(1, line(20, 2, 5), 'right')) => () => aiView({ me: aiMe(line(6, 12, 5), 'right', { dashes: 2, flashIn: 0 }), others: [rival], food: food.map(([x, y, kind = 'food']) => ({ x, y, kind, expires: 999 })) });
  const idle = [view([]), view([[14, 12]])].map(v => habits(v, ['star']).star);
  check('Star holds its golden dashes where one gets it nothing (open ground; an apple well on)', idle.every(got => !Object.keys(got).some(k => k.includes('+flash'))), JSON.stringify(idle));
  const race = habits(view([[10, 12]], aiRival(1, [[10, 7], [10, 6], [10, 5], [10, 4]], 'down')), ['star']).star;
  check('...but dashes to beat a rival to an apple', race['right+flash'] === 10, JSON.stringify(race));
  const leaf = habits(view([[9, 12, 'leaf'], [15, 12]]), ['star']).star;
  check('...and to take a golden leaf in its way', leaf['right+flash'] === 10, JSON.stringify(leaf));
  // In the game: two golden dashes, as from a leaf, on open ground; four ticks on it still holds one at least.
  const g = E.createGame({ withPlayer: false, personas: ['star', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = line(6, 12, 5).map(([x, y]) => ({ x, y })); a.dir = D.right; a.dashes = 2;
  b.body = line(20, 2, 5).map(([x, y]) => ({ x, y })); b.dir = D.right;
  g.food = [{ x: 16, y: 12, kind: 'food', expires: 999 }];
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  look(g);
  for (let t = 0; t < 4; t++) quiet(g);
  check('...in the game, it doesn\'t spend both the moment it has them', a.alive && a.dashes >= 1, JSON.stringify({ dashes: a.dashes, head: a.body[0] }));
}

{ // Star craves golden things: a golden leaf four to the right, an apple three to the left. Star goes for the leaf; anyone who likes apples takes the apple first.
  // (Seeded: Wildcard draws its weights at random, afresh each time here, and
  // about one draw in 200 goes for the leaf: so one run in 50 failed.)
  const view = () => aiView({
    me: aiMe([[12, 12], [12, 13], [12, 14], [12, 15]], 'up'),
    others: [aiRival(1, line(22, 22, 5), 'right')],
    food: [{ x: 16, y: 12, kind: 'leaf', expires: 999 }, { x: 9, y: 12, kind: 'food', expires: 999 }],
  });
  const fond = rest.filter(k => (AI.PERSONAS[k].w.normalFood ?? 1) >= 1);
  const [star, got] = seededWhile(171, () => [habits(view, ['star']).star, habits(view, fond, 4)]);
  const leafFirst = fond.filter(k => got[k].left !== 4);
  check('Star chases a golden leaf over an apple', star.right === 10, JSON.stringify(star));
  check('...where everyone else who likes apples takes the apple first', !leafFirst.length, leafFirst.join(', '));
}
