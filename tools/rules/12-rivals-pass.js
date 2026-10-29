// ---------------------------------------------------------------- round six A: the rivals' pass (knocked food, beetles that dig in)
// A mark of 3x3 at (12..14, 10..12), and where the strike knocks what's in it: as the rings show it, by the engine's rule.
const MARK = rect(12, 10, 14, 12).map(([x, y]) => K(x, y));
const marked = (more = {}) => aiView({ holes: new Set(MARK), pecks: new Set(MARK), strikeAt: 13, timeMs: T.SUDDEN_DEATH_MS + 5000, ...more });

{ // Food in the woodpecker's mark is knocked aside at the strike, to where the rule puts it (what the rings show anyone):
  // an AI values it there, from the strike on. Heading right along row 11, the mark 4 ahead with a golden apple in its
  // middle (knocked to (11, 11), the free cell beside the mark nearest the middle), an apple far off down the left: it
  // heads for where the golden one will land. (Shown the mark with no strike to come, the golden apple is out of reach
  // behind it, and nothing draws it on more than down toward the other: it goes either way.)
  const g = board([[line(5, 11, 5), 'right'], [line(20, 22, 5), 'right']]);
  g.food = [{ x: 13, y: 11, kind: 'golden', expires: 9999 }];
  const ring = E.knocks(g, MARK)[0].to;
  const view = strikeAt => () => marked({ strikeAt, me: aiMe(line(5, 11, 5), 'right'), others: [aiRival(1, line(20, 22, 5), 'right')],
    food: [{ x: 13, y: 11, kind: 'golden', expires: 9999 }, { x: 2, y: 20, kind: 'food', expires: 9999 }] });
  const knocked = picks(view(13)), blind = picks(view(null));
  check('an AI values food in the mark where the strike will knock it (the rings), and heads there', ring.x === 11 && ring.y === 11 && knocked.right === 50 && blind.right < 40, JSON.stringify({ ring, knocked, blind }));
  // ...and never into the mark for it: right beside the mark with the apple in front of its head, it doesn't wait in the
  // mark for the strike (it's a hole by then), nor go for the apple where it lies.
  const beside = picks(() => marked({ me: aiMe(line(11, 11, 5), 'right'), others: [aiRival(1, line(20, 22, 5), 'right')], food: [{ x: 12, y: 11, kind: 'food', expires: 9999 }] }));
  check('...and never steps into the mark for it', !beside.right && (beside.up || 0) + (beside.down || 0) === 50, JSON.stringify(beside));
}

{ // Knocked food goes to whoever's nearer where it lands, as any food does. Heading right along row 11, 5 from where a
  // golden apple in the mark will land (the strike 6 ticks off); another golden apple 12 down. (Drab and Gobbler without
  // their taste for the board, so it's the food that decides.) With a rival's head 10 from the landing, it's Drab's, and
  // it heads there; with the rival 6 from it (as I see it, a moment ago), nearer than Drab, Drab, which lets a rival's
  // food be, takes the other, while Gobbler, which counts a rival's food in full, races for it, and so does Drab desperate.
  const plain = key => ({ ...AI.PERSONAS[key], w: { ...AI.PERSONAS[key].w, territory: 0, aggression: 0 } });
  const view = (rivalY, hungerLeft = 99999) => marked({ strikeAt: 16, me: aiMe(line(6, 11, 5), 'right', { hungerLeft, starveIn: hungerLeft }), others: [aiRival(1, line(11, rivalY, 5, 1), 'left')],
    food: [{ x: 13, y: 11, kind: 'golden', expires: 9999 }, { x: 6, y: 23, kind: 'golden', expires: 9999 }] });
  const go = (key, rivalY, hungerLeft) => { const out = {}; for (let i = 0; i < 20; i++) { const d = dirOf(AI.decide(view(rivalY, hungerLeft), plain(key), {})); out[d] = (out[d] || 0) + 1; } return out; };
  const mine = go('drab', 1), drab = go('drab', 5), gobbler = go('gobbler', 5), starving = go('drab', 5, 1500);
  check('knocked food is mine if I\'m nearer where it lands; a rival nearer, Drab leaves it', mine.right === 20 && drab.down === 20, JSON.stringify({ mine, drab }));
  check('...but Gobbler races for it, and so does a desperate rival', gobbler.right === 20 && starving.right === 20, JSON.stringify({ gobbler, starving }));
}

{ // In the game: an apple in the mark, Gobbler heading along its row toward it. It doesn't go into the mark (it would be
  // pecked), and once the strike knocks the apple aside it takes it where it landed.
  const g = E.createGame({ withPlayer: false, personas: ['gobbler', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  g.time = T.SUDDEN_DEATH_MS + 5000;
  a.body = cellsOf(line(5, 11, 5)); a.dir = D.right;
  b.body = cellsOf(line(20, 22, 4)); b.dir = D.right; b.isPlayer = true; b.persona = null; b.queue = []; b.stunUntil = 1e9;
  const [apple] = lay(g, { x: 13, y: 11, kind: 'food', expires: 9999 });
  g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }]; // (no beetles come out meanwhile)
  g.woodpecker = { x: 13, y: 11, at: g.time, target: [...MARK], strikeAt: g.tick + 5, last: [], struckAt: -1, restUntil: 1e9 };
  lookNow(g);
  g.history[0].pecks = [...MARK];
  let knock = null, ate = null, inMark = false, promise = null;
  for (let t = 0; t < 20 && !ate && a.alive; t++) {
    if (g.woodpecker.landings) promise ||= { seen: E.aiView(g, a), kept: g.woodpecker.landings, strikeAt: g.woodpecker.strikeAt };
    feed(g); kept(g);
    if (g.woodpecker.target.length && MARK.includes(K(a.body[0].x, a.body[0].y))) inMark = true;
    knock ||= g.events.find(e => e.type === 'knock');
    ate = g.events.find(e => e.type === 'eat' && e.snake === a && e.kind === 'food');
  }
  check('in the game: Gobbler keeps out of the mark, and takes the apple where the strike knocked it', a.alive && !inMark && knock && ate && ate.x === knock.tx && ate.y === knock.ty, JSON.stringify({ alive: a.alive, inMark, knock: knock && [knock.tx, knock.ty], ate: ate && [ate.x, ate.y], head: a.body[0] }));
  check(`...seeing when the strike comes and, in the aim's last ${T.PECK_PROMISE_TICKS} moves, where the woodpecker promised it (as the rings show anyone)`, promise && promise.seen.strikeAt === promise.strikeAt && promise.seen.landings === promise.kept, JSON.stringify(promise && { strikeAt: promise.seen.strikeAt, landings: promise.seen.landings }));
}

{ // A beetle digging in stays put till it's gone: an AI that can get there in time takes it, and one that can't doesn't
  // chase it. Heading right, a beetle digging in 4 ahead (an apple 5 up): gone after the tick 3 on, it's caught on the
  // 4th move, as it goes; gone a tick sooner, the AI takes the apple. (In sudden death, as before it.)
  for (const timeMs of [30000, T.SUDDEN_DEATH_MS + 5000]) {
    const view = dig => () => aiView({ me: aiMe(line(10, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], tick: 10, timeMs,
      food: [{ x: 14, y: 12, kind: 'beetle', expires: 999, dir: D.up, movedAt: 5, digUntil: 10 + dig }, { x: 10, y: 7, kind: 'food', expires: 999 }] });
    const inTime = picks(view(3), 'drab', 20), late = picks(view(2), 'drab', 20);
    check(`an AI goes for a beetle digging in that it can reach before it's gone${timeMs > T.SUDDEN_DEATH_MS ? ' (in sudden death too)' : ''}`, inTime.right === 20, JSON.stringify(inTime));
    check(`...and doesn't chase one it can't${timeMs > T.SUDDEN_DEATH_MS ? ' (in sudden death too)' : ''}`, late.up === 20, JSON.stringify(late));
  }
}

{ // Two beetles out at once, each read the same way: the second, scurrying for its burrow two beyond (bound to dive in
  // first), isn't worth the chase any more than the first would be; an AI takes the apple up the board.
  const view = () => aiView({ me: aiMe(line(10, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], tick: 10, burrows: [{ x: 15, y: 12, at: 0 }],
    food: [{ x: 2, y: 21, kind: 'beetle', expires: 999, dir: D.up, movedAt: 9 },
      { x: 13, y: 12, kind: 'beetle', expires: 999, dir: D.right, movedAt: 0, px: 12, py: 12, scared: true }, { x: 10, y: 8, kind: 'food', expires: 999 }] });
  const got = picks(view, 'drab', 20);
  check('two beetles out: the second is read as the first (bound for its burrow, it isn\'t chased)', got.up === 20, JSON.stringify(got));
}

{ // In the game: a beetle in open bark, no burrow near, Gobbler coming at it from outside BEETLE_DIG_FEAR: cornered as
  // Gobbler comes within it, it digs in where it is (as the AI worked out it would), and Gobbler catches it before it's
  // gone. (It used to start 4 cells off, where no head coming at one ever is when it starts to dig.)
  const g = E.createGame({ withPlayer: false, personas: ['gobbler', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  g.time = 30000;
  a.body = cellsOf(line(13 - T.BEETLE_DIG_FEAR - 2, 12, 5)); a.dir = D.right;
  b.body = cellsOf(line(20, 22, 4)); b.dir = D.right; b.isPlayer = true; b.persona = null; b.queue = []; b.stunUntil = 1e9;
  g.burrows = [{ x: 22, y: 2, at: 0, used: 0 }];
  g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }];
  const [bug] = lay(g, { x: 13, y: 12, kind: 'beetle', expires: 999, dir: D.up, movedAt: -10 });
  lookNow(g);
  let dug = null, caught = null;
  for (let t = 0; t < 20 && !caught; t++) {
    feed(g); kept(g);
    dug ||= g.events.find(e => e.type === 'dig');
    caught = g.events.find(e => e.type === 'eat' && e.kind === 'beetle' && e.snake === a);
    if (g.events.some(e => e.type === 'dive')) break;
  }
  check('in the game: a cornered beetle digs in, and Gobbler catches it before it\'s gone', dug && caught && caught.x === dug.x && caught.y === dug.y && g.tick - 1 <= dug.until, JSON.stringify({ dug, caught: caught && [caught.x, caught.y, g.tick - 1], bug }));
}

