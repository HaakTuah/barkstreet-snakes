// ---------------------------------------------------------------- round six A: the rivals
// What an AI sees of a hand-built game, as it stands, coughs included.
const lookNow = g => {
  look(g);
  g.history[0].snakes.forEach(o => { o.cough = Math.max(0, g.snakes[o.id].coughUntil - g.tick); });
};
const ownBead = (x, y, owner = 0) => ({ x, y, kind: 'pellet', owner, color: '#000', expires: 999 });
const dirOf = d => Object.keys(D).find(k => D[k] === d);

{ // Its own bead is no food: it would choke on it and cough. Hungry or fed, it goes round one to the apple beyond.
  const view = hungerLeft => () => aiView({ me: aiMe(line(8, 12, 6), 'right', { hungerLeft, starveIn: hungerLeft }), others: [aiRival(1, line(20, 2, 5), 'right')], food: [ownBead(9, 12), { x: 11, y: 12, kind: 'food', expires: 999 }] });
  const choked = [];
  for (const key of Object.keys(AI.PERSONAS)) {
    for (const hungerLeft of [3000, 99999]) {
      if (hungerLeft > 9999 && AI.PERSONAS[key].w.turn > 0) continue; // (fed, a rival that hates turning may take the cough instead)
      if (picks(view(hungerLeft), key, 10).right) choked.push(`${key}${hungerLeft < 9999 ? ' (hungry)' : ''}`);
    }
  }
  check('nobody steers into its own bead: it goes round to the apple beyond, hungry or fed', !choked.length, choked.join(', '));
  // ...a rival's bead is a meal: straight on.
  const theirs = picks(() => aiView({ me: aiMe(line(8, 12, 6), 'right', { hungerLeft: 3000, starveIn: 3000 }), others: [aiRival(1, line(20, 2, 5), 'right')], food: [ownBead(9, 12, 1), { x: 11, y: 12, kind: 'food', expires: 999 }] }));
  check("...but a rival's bead in the same place it eats", theirs.right === 50, JSON.stringify(theirs));
}

{ // Coughing, nothing is food: what its head reaches is only nudged aside. A mushroom in its way costs it nothing then,
  // where it would rather turn (at two apples a turn) than eat one; and it doesn't turn for an apple it would only nudge.
  const w = AI.PERSONAS.drab.w, fussy = { ...AI.PERSONAS.drab, w: { ...w, turn: 2 * (w.food * w.foodRange + w.eat) } };
  const view = coughIn => () => aiView({ me: aiMe(line(8, 12, 6), 'right', { coughIn }), others: [aiRival(1, line(20, 2, 5), 'right')], food: [{ x: 9, y: 12, kind: 'mushroom', expires: 999 }] });
  const ate = coughIn => { let n = 0; for (let i = 0; i < 20; i++) if (AI.decide(view(coughIn)(), fussy, {}) === D.right) n++; return n; };
  check('coughing, it goes straight over a mushroom it would turn from otherwise (it only nudges it aside)', ate(0) === 0 && ate(T.COUGH_TICKS - 1) === 20, `${ate(0)} and ${ate(T.COUGH_TICKS - 1)} of 20 went on`);
  // An apple 3 on, a rival's head 5 from it (as I see it, coming up): mine. Coughing, I'd get there with nothing to eat it
  // with, and the rival could be there before I'm over it: I leave it. (With the rival far off, it waits for me.)
  const race = (coughIn, rival) => () => aiView({ me: aiMe(line(8, 12, 6), 'right', { coughIn }), others: [aiRival(1, rival, 'up')], food: [{ x: 11, y: 12, kind: 'food', expires: 999 }] });
  const near = [[11, 19], [11, 20], [11, 21], [11, 22]];
  const fed = picks(race(0, near)), coughing = picks(race(T.COUGH_TICKS - 1, near));
  check("...and coughing, it leaves an apple a rival could take before it's over", fed.right === 50 && !coughing.right, JSON.stringify({ fed, coughing }));
}

{ // A rival coughing can't eat till it's over: food it gets to first meanwhile is anyone's. Heading down the middle,
  // a golden apple 6 below (a rival's head 3 below it as I see it, coming up), another 9 to the left: the rival's,
  // and I take the other; but coughing a while yet, it would only nudge it aside (to the left, by the rule), and I go for it.
  const split = cough => () => aiView({
    me: aiMe([[12, 4], [12, 3], [12, 2], [12, 1], [11, 1], [10, 1], [9, 1], [8, 1], [7, 1], [6, 1], [5, 1], [4, 1]], 'down'),
    others: [{ ...aiRival(1, [[12, 15], [12, 16], [12, 17], [12, 18]], 'up'), cough }],
    food: [{ x: 12, y: 10, kind: 'golden', expires: 999 }, { x: 3, y: 4, kind: 'golden', expires: 999 }],
  });
  const none = picks(split(0)), short = picks(split(4)), long = picks(split(14));
  check('a rival coughing a while yet: an AI takes the food the rival can\'t eat in time', none.left === 50 && long.down === 50, JSON.stringify({ none, long }));
  check('...but not if the cough is over before it gets there', short.left === 50, JSON.stringify(short));
}

{ // A rival can't eat its own beads either: Sniper, heading down the middle, takes a bead the rival dropped though the
  // rival gets there first (and would choke on it), where the same bead dropped by anyone else is the rival's, and it goes left.
  const split = owner => () => aiView({
    me: aiMe([[12, 4], [12, 3], [12, 2], [12, 1], [11, 1], [10, 1], [9, 1], [8, 1], [7, 1], [6, 1], [5, 1], [4, 1]], 'down'),
    others: [aiRival(1, [[12, 15], [12, 16], [12, 17], [12, 18]], 'up')],
    food: [{ ...ownBead(12, 10, owner), cooked: 1 }, { ...ownBead(8, 4, 9), cooked: 1 }], // (roast beads)
  });
  const its = picks(split(1), 'sniper'), anyones = picks(split(9), 'sniper');
  check("a rival's own bead is anyone's but its: an AI takes one the rival gets to first", its.down === 50 && anyones.left === 50, JSON.stringify({ its, anyones }));
}

{ // In the game: a coughing rival (a person, going straight up) knocks an apple aside, to the left (a hole on its right);
  // Drab, coming along that row, takes it where it rolled (in its own time: it lets a rival's food be). (The same apple to a
  // rival that isn't coughing: the rival eats it.)
  // (Seeded: Drab wanders at random in its own time, and from about one
  // start in 250 it wandered off and didn't come for the apple, in these 24
  // ticks or in 40: so about one run in 250 failed.)
  for (const cough of [true, false]) seededWhile(181, () => {
    const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
    g.snakes = g.snakes.slice(0, 2);
    const [a, b] = g.snakes;
    a.body = line(6, 12, 4).map(([x, y]) => ({ x, y })); a.dir = D.right;
    b.body = [[12, 16], [12, 17], [12, 18], [12, 19]].map(([x, y]) => ({ x, y })); b.dir = D.up; b.isPlayer = true; b.persona = null; b.queue = [];
    g.holes.add(K(13, 12));
    if (cough) b.coughUntil = 999;
    const [apple] = lay(g, { x: 12, y: 12, kind: 'food', expires: 999 }, { x: 3, y: 21, kind: 'food', expires: 999 });
    lookNow(g);
    let rolled = null, ate = null;
    for (let t = 0; t < 24 && !ate; t++) {
      feed(g); kept(g);
      rolled ||= g.events.find(e => e.type === 'nudge' && e.snake === b);
      ate = g.events.find(e => e.type === 'eat' && e.x === apple.x && e.y === apple.y);
    }
    if (cough) check('in the game: a coughing rival knocks an apple aside, and Drab takes it where it rolled', rolled && at(rolled, 12, 12) && at(apple, 11, 12) && ate && ate.snake === a, JSON.stringify({ rolled: rolled && [rolled.tx, rolled.ty], by: ate && ate.snake.id }));
    else check('...where a rival that isn\'t coughing eats it', ate && ate.snake === b, JSON.stringify({ by: ate && ate.snake.id }));
  });
}

{ // A beetle runs for its burrow: one bound to get there first isn't worth the chase. Heading right, a beetle 3 on (scared,
  // making for its burrow two beyond), an apple 4 up: with the burrow there, it takes the apple; with none there (closed
  // over), the beetle, cornered, digs in where it is and stays put, and it takes that. It sees the burrows as they are
  // (view.burrows: every burrow on the board, as anyone sees them), not as it last saw a beetle use one.
  const view = burrows => () => aiView({ me: aiMe(line(10, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], tick: 10, burrows,
    food: [{ x: 13, y: 12, kind: 'beetle', expires: 999, dir: D.right, movedAt: 0, px: 12, py: 12, scared: true }, { x: 10, y: 8, kind: 'food', expires: 999 }] });
  const there = picks(view([{ x: 15, y: 12, at: 0 }]), 'drab', 20), gone = picks(view([]), 'drab', 20);
  check("an AI doesn't chase a beetle bound to dive into its burrow first", there.up === 20, JSON.stringify(there));
  check('...but with no burrow there (it sees the burrows as they are), the beetle digs in, and it takes that', gone.right === 20, JSON.stringify(gone));
}

{ // In the game: a beetle crawling along the edge of the log, and running once it's near: Gobbler goes where it's heading and catches it.
  const g = E.createGame({ withPlayer: false, personas: ['gobbler', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = line(6, 19, 5).map(([x, y]) => ({ x, y })); a.dir = D.right;
  b.body = line(20, 2, 4).map(([x, y]) => ({ x, y })); b.dir = D.right; b.isPlayer = true; b.persona = null; b.queue = [];
  lay(g, { x: 9, y: 22, kind: 'beetle', expires: 999, dir: D.right, movedAt: -10, px: 8, py: 22 });
  lookNow(g);
  let caught = -1;
  for (let t = 0; t < 30 && caught < 0; t++) {
    feed(g); kept(g);
    if (g.events.some(e => e.type === 'eat' && e.kind === 'beetle' && e.snake === a)) caught = t + 1;
  }
  check('in the game: it catches a beetle running from it along the edge', caught > 0 && caught <= 12, `caught on move ${caught}`);
}

{ // A flag the woodpecker pecks out is a lost colony: Colonist drops it at once, land and all, and sets off to plant another.
  // A fire on a flag, or the woodpecker's mark (not a hole yet), loses nothing.
  const colonies = () => [{ x: 6, y: 6, radius: 4, n: 1 }, { x: 14, y: 8, radius: 4, n: 2 }, { x: 18, y: 18, radius: 4, n: 3 }];
  const view = (holes, fire = [], pecks = []) => aiView({ me: aiMe(line(10, 12, 6), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], timeMs: 30000,
    holes: new Set([...holes, ...fire, ...pecks]), fire: new Set(fire), pecks: new Set(pecks) });
  const memory = { colonies: colonies(), planted: 2, nextSiteAt: 99999 };
  AI.decide(view([K(14, 8), K(13, 8)]), AI.PERSONAS.colonist, memory);
  check('Colonist loses a colony whose flag is pecked out, at once', JSON.stringify(memory.colonies.map(c => c.n)) === '[1,3]', JSON.stringify(memory.colonies));
  check('...and sets off to plant another', !!memory.site && !(memory.site.x === 14 && memory.site.y === 8), JSON.stringify(memory.site));
  const kept6 = { colonies: colonies(), planted: 2, nextSiteAt: 99999 };
  AI.decide(view([], [K(6, 6)], [K(14, 8)]), AI.PERSONAS.colonist, kept6);
  check('...but a fire on a flag, or the woodpecker\'s mark, loses nothing', kept6.colonies.length === 3 && !kept6.site, JSON.stringify(kept6.colonies.map(c => c.n)));
  // On its way to plant one, the spot is pecked out: it picks another.
  const going = { colonies: colonies(), planted: 2, nextSiteAt: 99999, site: { x: 4, y: 18 } };
  AI.decide(view([K(4, 18)]), AI.PERSONAS.colonist, going);
  check('...and a spot it was going to plant on, pecked out, it trades for another', !!going.site && !(going.site.x === 4 && going.site.y === 18), JSON.stringify(going.site));
}

{ // Sovereign's capital pecked out: the realm moves at once (not when it next drifts) to the nearest good land, banner and all.
  const patch = []; for (let y = 9; y <= 11; y++) for (let x = 9; x <= 11; x++) patch.push(K(x, y));
  const memory = { home: { x: 10, y: 10, radius: 4 }, driftAt: 99999 };
  AI.decide(aiView({ me: aiMe(line(16, 16, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], holes: new Set(patch) }), AI.PERSONAS.sovereign, memory);
  const h = memory.home;
  check("Sovereign's capital pecked out: the realm moves at once to the nearest good land", !patch.includes(K(h.x, h.y)) && Math.abs(h.x - 10) + Math.abs(h.y - 10) === 2 && h.radius === 4, JSON.stringify(h));
  const still = { home: { x: 10, y: 10, radius: 4 }, driftAt: 99999 };
  AI.decide(aiView({ me: aiMe(line(16, 16, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], holes: new Set([K(12, 10)]) }), AI.PERSONAS.sovereign, still);
  check('...but a hole elsewhere in the realm moves nothing till it next drifts', still.home.x === 10 && still.home.y === 10, JSON.stringify(still.home));
}
