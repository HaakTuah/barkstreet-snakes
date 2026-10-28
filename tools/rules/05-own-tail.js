// ---------------------------------------------------------------- choking on your own tail
// (A step with only the food a test laid, wherever it has rolled to since: nothing that grows mid-test gets in the way.)
const lay = (g, ...food) => { g.food = food; g.mine = new Set(food); return food; };
const kept = g => { g.food = g.food.filter(f => g.mine.has(f)); return E.step(g); };
const bead = (o, x, y) => ({ x, y, kind: 'pellet', color: o.color, owner: o.id, expires: 9999 });
const far = [line(20, 22, 3, 1), 'left']; // (a second snake, out of the way)
const at = (c, x, y) => !!c && c.x === x && c.y === y;
// What a person (or a rival) can work out before the move: where it'll roll, on this board as it stands (where it
// may stop, and what it may roll on over: food lying there, but not a hole or a body).
const passHere = g => (x, y) => !g.holes.has(K(x, y)) && !g.snakes.some(o => o.alive && o.body.some(c => c.x === x && c.y === y));
const freeHere = g => (x, y) => passHere(g)(x, y) && !g.food.some(f => f.x === x && f.y === y);

{ // Your own bead: you choke on it, spit it aside (it stays food), and cough. You lose nothing, but you get nothing back. Anyone else's is a meal.
  const g = board([[line(5, 5, 5), 'right'], [line(5, 15, 5), 'right']], { time: 5000 });
  const [a, b] = g.snakes;
  a.lastAte = 1000; a.nextStarve = 1000 + T.HUNGER_MS; b.lastAte = 1000; b.nextStarve = 1000 + T.HUNGER_MS;
  const [mine, theirs] = lay(g, bead(a, 6, 5), bead(a, 6, 15));
  kept(g);
  const choke = g.events.find(e => e.type === 'choke');
  check('your own bead: you choke on it, and spit it aside, still food', choke && choke.snake === a && at(choke, 6, 5) && g.food.includes(mine) && !at(mine, 6, 5) && at(mine, choke.tx, choke.ty), JSON.stringify(choke && { x: choke.x, y: choke.y, tx: choke.tx, ty: choke.ty }));
  check('...no length, no score, no meal', a.body.length === 5 && a.grow === 0 && a.eaten === 0 && a.pellets === 0 && a.lastAte === 1000 && a.nextStarve === 1000 + T.HUNGER_MS && !g.events.some(e => e.type === 'eat' && e.snake === a), JSON.stringify({ length: a.body.length, grow: a.grow, eaten: a.eaten, lastAte: a.lastAte }));
  check('...and you cough for COUGH_TICKS', a.coughUntil === g.tick - 1 + T.COUGH_TICKS, a.coughUntil);
  check("...someone else's bead is a meal", b.eaten === 1 && b.lastAte === 5000 && !g.food.includes(theirs) && g.events.some(e => e.type === 'eat' && e.snake === b && e.kind === 'pellet'), b.lastAte);
}

{ // Where a spat bead goes is a rule, never chance, and anyone can work it out before the move.
  // P0 heads right along row y (or turns down at (5,5)); holes block cells, and more of its own beads lie at `beads`;
  // returns the choke and what was predicted.
  const spit = ({ y = 5, turn = false, holes = [], beads = [], wrap = false, n = 3 }) => {
    const g = board([[line(5, y, n), 'right'], far]);
    const [a] = g.snakes;
    if (wrap) a.wrapUntil = 1e9;
    for (const [x, hy] of holes) g.holes.add(K(x, hy));
    const next = turn ? { x: 5, y: y + 1 } : { x: 6, y };
    if (turn) a.queue = [D.down];
    const [b] = lay(g, bead(a, next.x, next.y), ...beads.map(([x, by]) => bead(a, x, by)));
    const guess = E.rollSide(g, a, next.x, next.y, freeHere(g), passHere(g)); // (before the move: the cell it's about to go into)
    kept(g);
    const e = g.events.find(e => e.type === 'choke' && e.snake === a);
    return { e, b, guess, to: e && { x: e.tx, y: e.ty } };
  };
  const cases = [
    ['a turn knocks it to the inside of the turn, beside the neck', { turn: true }, [4, 6]],
    ['...the outside, if the inside is taken', { turn: true, holes: [[4, 6]] }, [6, 6]],
    ['...both taken, it rolls on the inside way, over food lying there, to the first free cell', { turn: true, holes: [[6, 6]], beads: [[4, 6]] }, [3, 6]],
    ['...the outside way, if the inside way is shut', { turn: true, holes: [[3, 6]], beads: [[4, 6], [6, 6]] }, [7, 6]],
    ['...and only with both ways shut, it stays (never straight ahead, where the head goes next)', { turn: true, holes: [[4, 6], [6, 6]] }, [5, 6]],
    ['going straight, it rolls to the side with more open log', { holes: [[6, 7]] }, [6, 4]], // (down: one free cell, then a hole; up: open; the middle and the right are both down)
    ['...a tie goes toward the middle of the board', { y: 18 }, [6, 17]], // (heading right, its right is down: the middle is up)
    ['...the other side, if that one is taken', { y: 18, holes: [[6, 17]] }, [6, 19]],
    ['...food on both sides: it rolls on over it, the way it would have gone first', { beads: [[6, 4], [6, 6]] }, [6, 7]], // (a tie: down, toward the middle)
    ['...as far as 4 cells', { beads: [[6, 4], [6, 6], [6, 7], [6, 8]] }, [6, 9]], // (down, toward the middle: three beads, then a free cell)
    ['...not past that: then the other way', { beads: [[6, 4], [6, 6], [6, 7], [6, 8], [6, 9]] }, [6, 3]],
    ['...and only with both ways shut, it stays', { holes: [[6, 4], [6, 6]] }, [6, 5]],
    ['...past food, too: a hole beyond it on each side', { beads: [[6, 4], [6, 6]], holes: [[6, 3], [6, 7]] }, [6, 5]],
    ['...the edge is an edge, even when the edges wrap for it', { y: 0, wrap: true, holes: [[6, 1]] }, [6, 0]],
  ];
  for (const [name, opts, [x, y]] of cases) {
    const { e, b, guess, to } = spit(opts);
    check(`a spat bead: ${name}`, at(to, x, y) && at(b, x, y), JSON.stringify(to));
    check('...as worked out before the move', at(guess || { x: e?.x, y: e?.y }, x, y), JSON.stringify(guess));
  }
  // A tie both ways (no nearer side) goes to the snake's right. On the 24-cell log there's no middle column or
  // row, so the middle always settles a tie: only an odd-sized board has one.
  const c = vm.createContext({ window: {}, console, Math });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'tuning.js'), 'utf8'), c, { filename: 'tuning.js' });
  c.window.TUNING = Object.freeze({ ...c.window.TUNING, GRID: 25 });
  for (const f of ['ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), c, { filename: f });
  const E25 = c.window.SnakeEngine, D25 = E25.DIRS, all = () => true;
  const up = E25.rollSide(null, { body: [{ x: 12, y: 10 }, { x: 12, y: 11 }, { x: 12, y: 12 }], dir: D25.up }, 12, 10, all);
  const down = E25.rollSide(null, { body: [{ x: 12, y: 14 }, { x: 12, y: 13 }, { x: 12, y: 12 }], dir: D25.down }, 12, 14, all);
  check("...a tie with no nearer side goes to the snake's right (a 25-cell board)", at(up, 13, 10) && at(down, 11, 14), JSON.stringify([up, down]));
}

{ // The cough: COUGH_TICKS moves that eat nothing (the choke's and the rest); food the coughing head reaches is nudged aside by the same rule.
  const g = board([[line(5, 5, 5), 'right'], far]);
  const [a] = g.snakes;
  lay(g, bead(a, 6, 5));
  kept(g);
  const nudged = [];
  let ateAt = -1;
  for (let k = 1; k <= T.COUGH_TICKS && ateAt < 0; k++) {
    const apple = { x: a.body[0].x + 1, y: 5, kind: 'food', expires: 9999 };
    g.food.push(apple); g.mine.add(apple);
    kept(g);
    const e = g.events.find(e => e.snake === a && (e.type === 'nudge' || e.type === 'eat'));
    if (e?.type === 'eat') ateAt = k;
    else if (e) nudged.push({ e, apple });
  }
  check('the cough: COUGH_TICKS moves eat nothing, and then it eats', nudged.length === T.COUGH_TICKS - 1 && ateAt === T.COUGH_TICKS && a.eaten === 1, `${nudged.length} nudged, ate on move ${ateAt}`);
  check('...what the coughing head reached was nudged aside, by the rule, and is still there', nudged.every(({ e, apple }) => e.kind === 'food' && e.y === 5 && at(apple, e.x, 6) && e.tx === e.x && e.ty === 6 && g.food.includes(apple)), JSON.stringify(nudged.map(({ e }) => [e.x, e.y, e.tx, e.ty])));
  check('...and nothing was eaten meanwhile', !g.events.some(e => e.type === 'choke') && a.grow === 1 && a.body.length === 5, `${a.body.length} long, grow ${a.grow}`);
}

{ // No dribbling: going round a staircase (up, right, up, right) coughing, the food a turn reaches goes beside the neck,
  // out in the open, and the next step leaves it there. (On the outside of the turn it lay just where the next step
  // went, and was nudged along under the head all through the cough, to be eaten as it ended.)
  const g = board([[[[10, 14], [10, 15], [10, 16], [10, 17], [10, 18]], 'up'], far]);
  const [a] = g.snakes;
  a.coughUntil = 99;
  const [apple] = lay(g, { x: 11, y: 14, kind: 'food', expires: 9999 });
  const nudges = [];
  for (const d of [D.right, D.up, D.right, D.up, D.right, D.up]) {
    a.queue = [d];
    kept(g);
    for (const e of g.events) if (e.type === 'nudge' && e.snake === a) nudges.push([e.x, e.y, e.tx, e.ty]);
  }
  check('no dribbling: coughing round a staircase, the food a turn reaches goes beside the neck, and stays there', JSON.stringify(nudges) === JSON.stringify([[11, 14, 11, 15]]) && at(apple, 11, 15) && at(a.body[0], 13, 11), JSON.stringify({ nudges, apple, head: a.body[0] }));
}

{ // A cough never chains: more of your own beads met while coughing are nudged aside, and the cough ends when it would have.
  const g = board([[line(5, 5, 5), 'right'], far]);
  const [a] = g.snakes;
  const [, second] = lay(g, bead(a, 6, 5), bead(a, 8, 5));
  kept(g); kept(g); kept(g);
  const e = g.events.find(e => e.snake === a && (e.type === 'nudge' || e.type === 'choke'));
  check('a cough never chains: your own bead met while coughing is only nudged', e?.type === 'nudge' && e.kind === 'pellet' && at(e, 8, 5) && at(second, e.tx, e.ty) && a.coughUntil === T.COUGH_TICKS, JSON.stringify(e && { type: e.type, coughUntil: a.coughUntil }));
}

{ // What's spat or nudged aside stays food for anyone else: a rival comes along and eats it.
  for (const [what, food] of [['a spat bead', a => bead(a, 6, 5)], ['food nudged aside', () => ({ x: 6, y: 5, kind: 'food', expires: 9999 })]]) {
    const g = board([[line(5, 5, 5), 'right'], [line(9, 6, 3, 1), 'left']]); // (the rival comes along row 6, to (6,6) on its third move)
    const [a, b] = g.snakes;
    if (what !== 'a spat bead') a.coughUntil = 99;
    const [f] = lay(g, food(a));
    kept(g);
    const rolled = at(f, 6, 6);
    kept(g); kept(g);
    const e = g.events.find(e => e.type === 'eat' && e.snake === b);
    check(`${what} is food for anyone else`, rolled && e && at(e, 6, 6) && !g.food.includes(f) && b.eaten === 1, JSON.stringify({ rolled, f, eaten: b.eaten }));
  }
}

{ // A snake out of time at its smallest, reaching food: it eats instead of starving. Not if it chokes or coughs: it ate nothing.
  for (const [what, setup] of [['chokes on its own bead', (g, s) => lay(g, bead(s, 6, 5))], ['is coughing', (g, s) => { s.coughUntil = 99; lay(g, { x: 6, y: 5, kind: 'food', expires: 9999 }); }]]) {
    const g = board([[[[5, 5], [4, 5], [3, 5]], 'right'], [[[15, 15], [14, 15], [13, 15]], 'right']]);
    const s = g.snakes[0];
    s.nextStarve = 0; s.lastAte = -T.HUNGER_MS;
    setup(g, s);
    const dying = kept(g);
    check(`a snake out of time that ${what} isn't saved by it`, dying.includes(s) && s.killer === 'hunger' && g.events.some(e => (e.type === 'choke' || e.type === 'nudge') && e.snake === s), s.alive ? 'alive' : s.cause);
  }
}

{ // A golden dash over two of its own beads: it chokes on the first, and the second is nudged (a cough never chains), each aside by the rule.
  const g = board([[line(5, 5, 5), 'right'], far]);
  const [a] = g.snakes;
  a.dashes = 1;
  const [first, second] = lay(g, bead(a, 6, 5), bead(a, 7, 5));
  E.flash(g, a);
  kept(g);
  const ev = g.events.filter(e => e.snake === a && ['choke', 'nudge', 'eat'].includes(e.type)).map(e => [e.type, e.x, e.y, e.tx, e.ty]);
  check('a dash over your own beads: a choke on the first, the next nudged', JSON.stringify(ev) === JSON.stringify([['choke', 6, 5, 6, 6], ['nudge', 7, 5, 7, 6]]) && at(first, 6, 6) && at(second, 7, 6) && at(a.body[0], 5 + T.DASH_LENGTH, 5), JSON.stringify(ev));
  // Turning into a dash, at its smallest (the cells it set off from are gone from its body by the end): the first cell's a turn, the inside is back against the way it was going.
  const g2 = board([[line(5, 5, T.MIN_LENGTH), 'right'], far]);
  const [s] = g2.snakes;
  s.dashes = 1; s.queue = [D.down];
  const [b] = lay(g2, bead(s, 5, 6));
  E.flash(g2, s);
  kept(g2);
  check('...turning into a dash, its own bead goes to the inside of the turn', at(b, 4, 6) && g2.events.some(e => e.type === 'choke' && at(e, 5, 6)) && at(s.body[0], 5, 5 + T.DASH_LENGTH), JSON.stringify(b));
}

{ // A head that stays put (a crash, a stun) finds nothing new under it, but a jump whose landing was taken comes down on what it hopped: food cooking in the fire there is eaten.
  const g = board([[line(5, 10, 6), 'right'], far, [[[7, 12], [7, 13], [7, 14], [7, 15]], 'up']]);
  const [me, , q] = g.snakes; // (q comes up column 7 into the landing, (7,10), as me comes down)
  g.fires.set(K(6, 10), { from: 0, until: 999, group: 1, strike: false }); g.fireGroups.set(1, 1); g.fireTotals.set(1, 1);
  lay(g, { x: 6, y: 10, kind: 'food', expires: 9999 });
  E.leap(g, me);
  kept(g); kept(g);
  const ate = g.events.find(e => e.type === 'eat' && e.snake === me);
  check('a jump whose landing is taken comes down on food in the fire it hopped, and eats it', me.alive && at(me.body[0], 6, 10) && ate && at(ate, 6, 10) && g.events.some(e => e.type === 'crash' && e.snake === me) && q.alive, JSON.stringify({ head: me.body[0], ate: !!ate }));
}

{ // A coughing head that reaches a beetle sends it scurrying aside, by the same rule (it doesn't get eaten).
  const g = board([[line(5, 5, 5), 'right'], far]);
  const [a] = g.snakes;
  a.coughUntil = 99;
  const [bug] = lay(g, { x: 6, y: 5, kind: 'beetle', expires: 9999, dir: D.left, movedAt: -10 });
  kept(g);
  const e = g.events.find(e => e.type === 'nudge');
  check('a coughing head sends a beetle scurrying aside', e && e.kind === 'beetle' && at(bug, 6, 6) && bug.px === 6 && bug.py === 5 && bug.dir === D.down && bug.movedAt === g.tick - 1 && bug.scared && g.food.includes(bug) && !g.events.some(e => e.type === 'eat'), JSON.stringify(bug));
  // Apples on both sides: it scurries on over one, facing the way it ran, and crawls on from there.
  const h = board([[line(5, 5, 5), 'right'], far]);
  h.snakes[0].coughUntil = 99;
  h.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }];
  h.burrows = [{ x: 10, y: 9, at: 0, used: 0 }]; // (one in reach, so it runs for it rather than digging in)
  const [b2] = lay(h, { x: 6, y: 5, kind: 'beetle', expires: 9999, dir: D.left, movedAt: -10 }, { x: 6, y: 4, kind: 'food', expires: 9999 }, { x: 6, y: 6, kind: 'food', expires: 9999 });
  kept(h);
  const ran = { x: b2.x, y: b2.y, dir: b2.dir };
  let crawled = true;
  try { for (let t = 0; t < 8; t++) kept(h); } catch (err) { crawled = String(err); }
  check('...over food on both sides, it scurries on over it, facing the way it ran, and crawls on from there', at(ran, 6, 7) && ran.dir === D.down && crawled === true, JSON.stringify({ ran, crawled }));
}

{ // An AI sees how many of its moves will eat nothing (as a person sees the puffs), a rival's cough as it saw it, and the food as it is now.
  const g = board([[line(5, 5, 5), 'right'], far]);
  const [a, b] = g.snakes;
  lay(g, bead(a, 6, 5));
  kept(g);
  const snap = g.history[g.history.length - 1].snakes.find(o => o.id === a.id);
  check('an AI sees how long it coughs, and a rival does too', E.aiView(g, a).me.coughIn === T.COUGH_TICKS - 1 && E.aiView(g, b).me.coughIn === 0 && snap.cough === T.COUGH_TICKS - 1, JSON.stringify([E.aiView(g, a).me.coughIn, snap.cough]));
  check('...and the food as it is, not as it was', E.aiView(g, b).food === g.food && E.aiView(g, a).food === g.food);
  const fresh = E.createGame({ withPlayer: false });
  check('...no one coughs at the start', fresh.snakes.every(o => o.coughUntil < 0 && E.aiView(fresh, o).me.coughIn === 0));
}

{ // A meal keeps you HUNGER_MS in the opening and once the woodpecker's here, but only HUNGER_MID_MS in between, when food is everywhere.
  const meal = time => {
    const g = board([[line(5, 10, 5), 'right'], [line(5, 20, 3), 'right']], { food: [[6, 10]], time });
    g.weather.until = 1e12; // (clear: no winter)
    const t0 = g.time;
    quiet(g);
    const s = g.snakes[0];
    return [Math.round(E.hungerLeft(g, s) + g.time - t0), Math.round(s.nextStarve - t0)]; // (as it ate: the time left, and when it starts shrinking)
  };
  const opening = meal(T.HUNGER_MID_FROM_MS - 5000), mid = meal(T.HUNGER_MID_FROM_MS + 5000), late = meal(T.SUDDEN_DEATH_MS + 1000);
  check('a meal lasts HUNGER_MS in the opening, HUNGER_MID_MS mid-round, HUNGER_MS once the woodpecker\'s here', [opening, mid, late].map(String).join(' ') === [[T.HUNGER_MS, T.HUNGER_MS], [T.HUNGER_MID_MS, T.HUNGER_MID_MS], [T.HUNGER_MS, T.HUNGER_MS]].map(String).join(' '), JSON.stringify([opening, mid, late]));
  // A meal just before HUNGER_MID_FROM_MS, then one just after: the second never takes time away (nor does the bar fill for less than is left).
  const g = board([[line(5, 10, 5), 'right'], [line(5, 20, 3), 'right']], { food: [[6, 10]], time: T.HUNGER_MID_FROM_MS - 100 });
  g.weather.until = 1e12;
  const s = g.snakes[0];
  feed(g); quiet(g);
  const first = s.nextStarve;
  while (g.time < T.HUNGER_MID_FROM_MS + 1000) quiet(g);
  g.food = [{ x: s.body[0].x + 1, y: s.body[0].y, kind: 'food' }]; g.given = new Set([g.food[0].y * T.GRID + g.food[0].x]);
  const before = E.hungerLeft(g, s);
  quiet(g);
  check('...and a meal just after HUNGER_MID_FROM_MS never shortens what an earlier one left', s.ateTick === g.tick - 1 && before > T.HUNGER_MID_MS && Math.abs(s.nextStarve - first) < 1e-6 && Math.abs(s.mealMs - before) < 1e-6, JSON.stringify({ first, now: s.nextStarve, before, mealMs: s.mealMs }));
}

{ // Sudden death: the last apples fall one at a time, each wait longer than the last; the first is announced; nothing else grows (beetles still come out).
  const g = board([[line(3, 2, 3), 'right'], [line(3, 21, 3), 'right']], { time: T.SUDDEN_DEATH_MS });
  for (const o of g.snakes) o.stunUntil = 1e9;
  g.food = [];
  const falls = [];
  let told = 0, other = 0, gone = g.tick;
  for (let t = 0; t < 300 && falls.length < 3; t++) {
    feed(g); E.step(g);
    told += g.events.filter(e => e.type === 'lastApples').length;
    other += g.food.filter(f => f.kind !== 'food' && f.kind !== 'beetle').length;
    if (g.food.some(f => f.kind === 'food')) { falls.push(g.tick - gone); g.food = g.food.filter(f => f.kind === 'beetle'); gone = g.tick; }
  }
  check('sudden death: the last apples fall one at a time, each later than the last', falls.length === 3 && falls.every((n, i) => Math.abs(n - T.SD_APPLE_GAP * (i + 1)) <= 2), JSON.stringify(falls));
  check('...the first is announced, once', told === 1, told);
  check('...and nothing else grows (beetles still come out)', other === 0, other);
}

{ // Golden apples and golden leaves land somewhere quiet; mushrooms never sprout right by a head.
  const g = board([[line(12, 12, 4), 'right'], [line(6, 6, 4), 'right']]);
  for (const o of g.snakes) o.stunUntil = 1e9;
  const gapOf = f => Math.min(...g.snakes.map(o => Math.abs(o.body[0].x - f.x) + Math.abs(o.body[0].y - f.y)));
  const gaps = { golden: [], leaf: [], food: [], mushroom: [] };
  for (let t = 0; t < 3000; t++) {
    g.time = 1000; g.weather = { kind: t % 2 ? 'sun' : 'wind', since: 0, until: 1e12, nextGust: 0, nextStrike: 1e12 };
    feed(g); E.step(g);
    for (const f of g.food) if (gaps[f.kind]) gaps[f.kind].push(gapOf(f));
    g.food = [];
  }
  const mean = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
  check('golden apples land somewhere quiet', gaps.golden.length > 5 && mean(gaps.golden) > mean(gaps.food) + 3, `${gaps.golden.length} at ${mean(gaps.golden).toFixed(1)} cells from a head, apples ${mean(gaps.food).toFixed(1)}`);
  check('...and golden leaves', gaps.leaf.length > 50 && mean(gaps.leaf) > mean(gaps.food) + 3, `${gaps.leaf.length} at ${mean(gaps.leaf).toFixed(1)}`);
  check('mushrooms never sprout right by a head', gaps.mushroom.length > 500 && Math.min(...gaps.mushroom) > T.SHROOM_GAP, `${gaps.mushroom.length}, nearest ${Math.min(...gaps.mushroom)}`);
}

{ // An AI sees its own hunger as a person sees their bar: how long till its next shrink.
  const g = E.createGame({ withPlayer: false });
  const s = g.snakes[0];
  s.nextStarve = g.time + 4321;
  check('an AI sees how long till its next hunger shrink', E.aiView(g, s).me.starveIn === 4321, E.aiView(g, s).me.starveIn);
}

{ // Lightning never lands near a head, crackles first, and only then burns.
  // (Ten seeded rounds, the same every run, in a storm that strikes every
  // tick: 1,200 strikes. At its own pace, every 2-4 s, they brought about 45,
  // and a clearance kept for all but one cell in 13 was caught by one strike
  // of them, or none, as a change to the engine re-rolled them. This way any
  // such rounds catch it, about twenty times.)
  let near = 0, early = 0, strikes = 0;
  for (let r = 0; r < 10; r++) seededWhile(151 + r, () => {
    const g = E.createGame({ withPlayer: false });
    g.time = 50000;
    g.weather = { kind: 'storm', since: 50000, until: 1e9, nextGust: 0, nextStrike: 0 };
    for (let t = 0; t < 120 && g.snakes.some(s => s.alive); t++) {
      g.weather.nextStrike = 0; // (it strikes this tick)
      E.step(g);
      const heads = g.snakes.filter(s => s.alive).map(s => s.body[0]); // (where they were when the lightning chose its spot)
      for (const e of g.events) {
        if (e.type === 'charge') {
          strikes++;
          if (heads.some(h => Math.abs(h.x - e.x) + Math.abs(h.y - e.y) <= T.STRIKE_CLEARANCE)) near++;
          const f = g.fires.get(K(e.x, e.y));
          if (!f || f.from - g.tick < T.STRIKE_WARN_TICKS - 1) early++;
        }
      }
    }
  });
  check('storms strike', strikes > 1000, `${strikes} strikes`);
  check('lightning keeps its distance from heads', near === 0, `${near} too close`);
  check('lightning crackles before it burns', early === 0, `${early} without warning`);
}

{ // Fire reaches an AI with its reaction delay, and then it keeps out like it keeps out of holes.
  const g = E.createGame({ withPlayer: false });
  const s = g.snakes[0];
  for (let t = 0; t < 3; t++) E.step(g);
  const k = K(12, 12);
  g.fires.set(k, { from: g.tick, until: g.tick + 99, group: 9, strike: true });
  check('fire is unseen at first', !E.aiView(g, s).holes.has(k));
  for (let t = 0; t < 8; t++) { g.snakes.forEach(o => { o.body = o.body.slice(0, 3); }); E.step(g); if (!g.fires.has(k)) g.fires.set(k, { from: 0, until: g.tick + 99, group: 9, strike: false }); }
  check('fire reaches the AI after its reaction time', E.aiView(g, g.snakes.find(o => o.alive)).holes.has(k));
}

{ // Rain puts fire out, and the sky clears for the woodpecker.
  const g = E.createGame({ withPlayer: false });
  g.fires.set(K(1, 1), { from: 0, until: 500, group: 1, strike: true });
  g.weather = { kind: 'rain', since: 0, until: 1e9, nextGust: 0, nextStrike: 0 };
  for (let t = 0; t < T.RAIN_DOUSE_TICKS + 2; t++) E.step(g);
  check('rain puts fire out', !g.fires.has(K(1, 1)));
  g.time = T.SUDDEN_DEATH_MS;
  E.step(g);
  check('the sky clears for the woodpecker', g.weather.kind === 'clear', g.weather.kind);
}

{ // Winter: snow puts fire out, there's less food, and hunger runs faster.
  const g = E.createGame({ withPlayer: false });
  g.fires.set(K(1, 1), { from: 0, until: 500, group: 1, strike: true });
  g.weather = { kind: 'snow', since: 0, until: 1e9, nextGust: 0, nextStrike: 0 };
  g.food = g.food.filter(f => f.kind !== 'food');
  const before = g.snakes.map(s => E.hungerLeft(g, s));
  for (let t = 0; t < 10; t++) E.step(g);
  // (Measured on a snake that ate nothing meanwhile: a bite resets the clock.)
  const s = g.snakes.find(o => o.ateTick < 0) || g.snakes[0];
  const ran = before[g.snakes.indexOf(s)] - E.hungerLeft(g, s);
  check('snow puts fire out', !g.fires.has(K(1, 1)));
  check('winter brings fewer apples', g.food.filter(f => f.kind === 'food').length <= T.SNOW_APPLES, g.food.filter(f => f.kind === 'food').length + ' apples');
  check('hunger runs faster in winter', !s.alive || ran > g.time * 1.3 * (10 / 11), `${Math.round(ran)} ms of hunger in ${Math.round(g.time)} ms`);
}

{ // Wind blows burning leaves downwind; they smoulder first, then burn small, and don't spread.
  let embers = 0, upwind = 0, early = 0, spread = 0;
  for (let r = 0; r < 40; r++) {
    const g = board([[[[2, 2], [1, 2], [0, 2]], 'right'], [[[2, 20], [1, 20], [0, 20]], 'right']]);
    g.weather = { kind: 'wind', since: 0, until: 1e9, nextGust: 1e9, nextStrike: 0 };
    g.fires.set(K(8, 10), { from: 0, until: 400, group: 1, strike: false });
    g.fireGroups.set(1, 1);
    g.fireGroup = 1; // (its own group: leaves start their own)
    for (let t = 0; t < 120; t++) {
      for (const s of g.snakes) { s.lastAte = g.time; s.nextStarve = g.time + T.HUNGER_MS; s.body = s.body.slice(0, 3); }
      E.step(g);
      for (const e of g.events) {
        if (e.type !== 'ember') continue;
        embers++;
        if (e.x <= e.fx + 1) upwind++;
        const f = g.fires.get(K(e.x, e.y));
        if (!f || f.from - g.tick < T.EMBER_SMOLDER_TICKS) early++;
      }
      for (const f of g.fires.values()) if (f.ember && (g.fireGroups.get(f.group) || 0) > 1) spread++;
    }
  }
  check('wind blows burning leaves', embers > 5, `${embers} leaves`);
  check('...downwind', upwind === 0, `${upwind} upwind`);
  check('...that smoulder first', early === 0, `${early} without warning`);
  check('...and burn small, without spreading', spread === 0, `${spread} spread`);
}

{ // A lightning fire burns itself out: at most FIRE_MAX cells at once, and FIRE_TOTAL over its whole life.
  let most = 0, out = 0;
  const trials = 30;
  for (let r = 0; r < trials; r++) {
    const g = board([[[[2, 2], [1, 2], [0, 2]], 'right'], [[[2, 20], [1, 20], [0, 20]], 'right']]);
    for (const o of g.snakes) o.stunUntil = 1e9;
    g.weather = { kind: 'clear', since: 0, until: 1e12, nextGust: 1e12, nextStrike: 1e12 };
    g.fires.set(K(12, 12), { from: 0, until: T.FIRE_TICKS, group: 1, strike: true }); g.fireGroups.set(1, 1); g.fireTotals.set(1, 1);
    const caught = new Set();
    for (let t = 0; t < 1500 && g.fires.size; t++) { feed(g); quiet(g); for (const [k, f] of g.fires) caught.add(k + ':' + f.from); }
    most = Math.max(most, caught.size);
    if (!g.fires.size) out++;
  }
  check('a lightning fire catches at most FIRE_TOTAL cells over its life', most <= T.FIRE_TOTAL && most > T.FIRE_MAX, `${most} at most`);
  check('...so it burns itself out', out === trials, `${out} of ${trials}`);
}

{ // Weather comes from a shuffled bag: every kind before any repeats. Storms and snow drawn too early wait in it.
  const g = board([[line(5, 5, 4), 'right'], [line(5, 15, 4), 'right']]);
  for (const o of g.snakes) o.stunUntil = 1e9;
  const next = time => { g.time = time; g.weather = { kind: 'clear', since: 0, until: 0, nextGust: 1e12, nextStrike: 1e12 }; feed(g); quiet(g); return g.weather.kind; };
  const bag = Object.entries(T.WEATHER_ODDS).flatMap(([k, n]) => Array(n).fill(k)), late = bag.filter(k => k === 'storm' || k === 'snow');
  const early = Array.from({ length: bag.length - late.length }, () => next(Math.min(T.STORM_FROM_MS, T.SNOW_FROM_MS) - 5000));
  const then = Array.from({ length: late.length }, () => next(Math.max(T.STORM_FROM_MS, T.SNOW_FROM_MS) + 5000));
  check('no storms or snow early on: they wait in the bag', early.sort().join() === bag.filter(k => !late.includes(k)).sort().join(), early.join());
  check('...and come once they may', then.sort().join() === late.sort().join(), then.join());
  const runs = [];
  for (let r = 0; r < 6; r++) runs.push(Array.from({ length: bag.length }, () => next(60000)).sort().join());
  check('...every kind comes before any repeats', runs.every(r => r === bag.sort().join()), runs.join(' / '));
  // A storm's rain comes on top: it doesn't use up the bag's.
  let rains = 0;
  for (let t = 0; t < 30; t++) {
    g.weatherBag = ['rain'];
    g.time = 60000; g.weather = { kind: 'storm', since: 0, until: 0, nextGust: 1e12, nextStrike: 1e12 }; feed(g); quiet(g);
    if (g.weather.kind === 'rain') rains++;
    if (g.weatherBag.join() !== 'rain') break;
  }
  check('...and a storm\'s rain comes on top', rains > 5 && g.weatherBag.join() === 'rain', `${rains} rains, bag ${g.weatherBag.join()}`);
}

{ // A scared beetle on a burrow dives in and comes out of a burrow a while later; food never sits on a burrow.
  const g = board([[[[10, 5], [9, 5], [8, 5]], 'right'], [[[20, 20], [19, 20], [18, 20]], 'left']]);
  g.burrows = [{ x: 12, y: 6, at: 0 }, { x: 2, y: 20, at: 0 }];
  g.food = [{ x: 11, y: 6, kind: 'beetle', expires: 999, dir: D.right, movedAt: -10 }];
  let dived = false, emerged = null;
  for (let t = 0; t < 40; t++) {
    E.step(g);
    for (const e of g.events) { if (e.type === 'dive') dived = true; if (e.type === 'emerge') emerged = e; }
    if (g.food.some(f => f.kind !== 'beetle' && g.burrows.some(b => b.x === f.x && b.y === f.y))) break;
  }
  check('a scared beetle dives into its burrow', dived);
  check('...and comes out of the other one', emerged && emerged.x === 2 && emerged.y === 20, JSON.stringify(emerged));
  check('nothing grows on a burrow', !g.food.some(f => f.kind !== 'beetle' && g.burrows.some(b => b.x === f.x && b.y === f.y)));
}
