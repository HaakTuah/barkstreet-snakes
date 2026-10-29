// ---------------------------------------------------------------- the owner's playtest: a meal isn't a pin
{ // Food by the edge, in a corner, or beside a hole, fire or another snake's body: every rival takes it when
  // nothing threatens it, though a rival is about ten ticks off (the neck test's old allowance made any rival
  // within a dozen cells a trap, so they turned away a cell or two short and circled it). And where it would
  // truly be pinned or cut off, every rival still refuses. All hungry (4 s before they start shrinking), so it's
  // the trap test that decides, not taste. (Self-contained: its own helpers and its own seeded randomness.)
  const was = Math.random;
  let seed = 11;
  Math.random = () => { // (mulberry32)
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try {
    const N = T.GRID, at = (x, y) => y * N + x, HUNGRY = 4000;
    // A body from its head, then the way each next cell lies (U, D, L, R): its head moves away from the second cell.
    const trail = (x, y, moves) => {
      const b = [{ x, y }];
      for (const m of moves) { x += m === 'R' ? 1 : m === 'L' ? -1 : 0; y += m === 'D' ? 1 : m === 'U' ? -1 : 0; b.push({ x, y }); }
      return b;
    };
    const dirOf = b => Object.values(D).find(d => d.x === Math.sign(b[0].x - b[1].x) && d.y === Math.sign(b[0].y - b[1].y));
    const personas = Object.keys(AI.PERSONAS);
    // In the game: the rival (12 long) and a snake that only goes straight on (no threat: heading off, about ten
    // ticks from the food); did the rival eat the food within 6 ticks?
    const eats = (persona, scene) => {
      const g = E.createGame({ withPlayer: false, personas: [persona, 'drab'] });
      g.snakes = g.snakes.slice(0, 2);
      const [a, b] = g.snakes;
      g.time = 30000;
      a.body = scene.me.map(c => ({ ...c })); a.dir = dirOf(a.body);
      b.body = scene.other.map(c => ({ ...c })); b.dir = dirOf(b.body); b.isPlayer = true; b.persona = null; b.queue = [];
      a.lastAte = g.time - (T.HUNGER_MS - HUNGRY); a.nextStarve = g.time + HUNGRY;
      b.lastAte = g.time; b.nextStarve = g.time + T.HUNGER_MS;
      g.food = [{ kind: 'food', expires: 999, ...scene.food }];
      const given = at(scene.food.x, scene.food.y);
      for (const c of scene.holes || []) g.holes.add(at(c.x, c.y));
      for (const c of scene.fire || []) { g.fires.set(at(c.x, c.y), { from: 0, until: 9999, group: 1, strike: false }); g.fireGroups.set(1, 1); }
      g.history = [{ // (what it sees, as things stand: a board built by hand has no history yet)
        snakes: g.snakes.map(o => ({ id: o.id, body: o.body.map(c => ({ ...c })), dir: o.dir, stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0 })),
        food: g.food.map(f => ({ ...f })), holes: g.holes.size, fires: [...g.fires.keys()], pecks: [],
      }];
      for (let t = 0; t < 6 && a.alive; t++) {
        g.food = g.food.filter(f => at(f.x, f.y) === given); // (only the food the scene put there)
        E.step(g);
        if (!g.food.some(f => at(f.x, f.y) === given)) return a.eaten > 0; // (gone: eaten by it, or not)
      }
      return false;
    };
    const row = (x0, x1, y) => Array.from({ length: x1 - x0 + 1 }, (_, i) => ({ x: x0 + i, y }));
    const up = trail(10, 13, 'DDDDDDDDDDD'); // (heading up the middle, the food 2 ahead at (10, 11))
    const SCENES = [
      ['an apple in the open (the control)', { me: up, other: trail(17, 8, 'UUU'), food: { x: 10, y: 11 } }],
      ['an apple on the edge, 2 ahead', { me: trail(10, 2, 'DDDDDDDDDDD'), other: trail(17, 3, 'UUU'), food: { x: 10, y: 0 } }],
      ['a golden apple in the corner, coming along the top edge', { me: trail(2, 0, 'RRRRRRRRRRR'), other: trail(8, 8, 'RRRR'), food: { x: 0, y: 0, kind: 'golden' } }],
      ['...or down the left edge', { me: trail(0, 3, 'DDDDDDDDDDD'), other: trail(8, 8, 'RRRR'), food: { x: 0, y: 0, kind: 'golden' } }],
      ['a golden apple by the corner, at (2, 1), coming along the top edge (the owner\'s screenshot)', { me: trail(5, 0, 'RRRRRRRRRRR'), other: trail(8, 8, 'RRRR'), food: { x: 2, y: 1, kind: 'golden' } }],
      ['an apple beside woodpecker holes', { me: up, other: trail(17, 8, 'UUU'), food: { x: 10, y: 11 }, holes: row(9, 11, 10) }],
      ['an apple beside fire', { me: up, other: trail(17, 8, 'UUU'), food: { x: 10, y: 11 }, fire: row(9, 11, 10) }],
      ['an apple beside another snake\'s body (its head 9 off)', { me: up, other: trail(18, 13, 'UUULLLLLLLLLLLLLL'), food: { x: 10, y: 11 } }],
    ];
    for (const [what, scene] of SCENES) {
      const left = personas.filter(p => !eats(p, scene));
      check(`nothing threatening it, every rival takes ${what}`, !left.length, `left it: ${left.join(', ')}`);
    }
    // What its first move is, in a view built by hand, over 10 tries: does any persona close in on the food?
    const closesIn = (scene) => {
      const view = {
        grid: N, food: [{ kind: 'food', expires: 999, ...scene.food }], age: 2, tick: 10, timeMs: 30000, weather: 'clear',
        holes: new Set((scene.holes || []).map(c => at(c.x, c.y))), fire: new Set(), pecks: new Set(),
        me: { id: 0, body: scene.me, dir: dirOf(scene.me), grow: 0, hungerLeft: HUNGRY, starveIn: HUNGRY, leaps: 0, dashes: 0, wrap: 0, leapIn: 9999, flashIn: 9999, bumped: -1 },
        others: scene.others.map((o, k) => ({ id: k + 1, body: o, dir: dirOf(o), stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0 })),
      };
      const h = scene.me[0], f = scene.food, away = Math.abs(h.x - f.x) + Math.abs(h.y - f.y);
      return personas.filter(p => {
        for (let i = 0; i < 10; i++) { const d = AI.decide(view, AI.PERSONAS[p], {}); if (Math.abs(h.x + d.x - f.x) + Math.abs(h.y + d.y - f.y) < away) return true; }
        return false;
      });
    };
    const far = [trail(20, 20, 'DDD'), trail(22, 15, 'DDD')];
    const TRAPS = [
      ['an apple in a pocket of holes too small for it (9 cells; it is 12 long)', { me: trail(5, 1, 'RRRRRRRRRRR'), others: far, food: { x: 1, y: 1 }, holes: [{ x: 3, y: 0 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 0, y: 3 }] }],
      ['an apple in a channel a cell wide (the edge and a row of holes), a rival\'s head by its far end', { me: trail(16, 1, 'DDDDDDDDDDD'), others: [trail(4, 3, 'DDDD'), ...far], food: { x: 14, y: 0 }, holes: row(6, 15, 1) }],
      ['an apple on the edge, a rival\'s head 2 along the edge coming at it', { me: trail(10, 2, 'DDDDDDDDDDD'), others: [trail(12, 0, 'RRRR'), ...far], food: { x: 10, y: 0 } }],
      ['a golden apple in the corner, a rival\'s head coming up the other edge', { me: trail(2, 0, 'RRRRRRRRRRR'), others: [trail(0, 3, 'DDDD'), ...far], food: { x: 0, y: 0, kind: 'golden' } }],
    ];
    for (const [what, scene] of TRAPS) {
      const went = closesIn(scene);
      check(`...but every rival still refuses ${what}`, !went.length, `closed in: ${went.join(', ')}`);
    }
  } finally {
    Math.random = was;
  }
}

// ---------------------------------------------------------------- the owner's playtest: hunters close easy pins
{ // A rival 6 long heading right along the top edge, its only way on straight ahead: the hunter, 9 long, runs
  // along the row below it, 4 cells ahead of its head as last seen (a moment ago: age 1). Moving up closes it: the
  // rival has three cells left, then nowhere. Every hunter closes it, on every edge, a third snake or not (it's far
  // off, heading away). (The neck test used to read the board as it is now, so the very rival it was pinning
  // looked as if it could come round through its body and shut it in; and against the edge itself, any rival
  // within a dozen cells made the hunter's own spot a trap. No hunter closed one.) But where closing it would be
  // the hunter's end too (a hole right beyond the cell, against the edge), every hunter leaves it.
  const N = T.GRID, rot = (k, [x, y]) => { for (let i = 0; i < k; i++) [x, y] = [N - 1 - y, x]; return [x, y]; };
  const turn = (k, d) => { const order = ['right', 'down', 'left', 'up']; return order[(order.indexOf(d) + k) % 4]; };
  const HUNTERS = ['sniper', 'mute', 'sovereign', 'colonist', 'metagamer', 'joker'];
  // (Each with its own weights, hunting the pinned rival: Sniper's and Mute's way of picking a victim, Joker's own.)
  const hunting = key => ({ ...AI.PERSONAS[key], driver: key === 'joker' ? 'joker' : 'sniper' });
  const pin = ({ k, third, hole }) => {
    const v = line(9, 0, 6), h = line(13, 1, 9), at = c => rot(k, c);
    const others = [aiRival(1, v.map(at), turn(k, 'right'))];
    if (third) others.push(aiRival(2, line(20, 14, 6).map(at), turn(k, 'right')));
    const holes = new Set(hole ? [at([14, 0])].map(([x, y]) => y * N + x) : []);
    return { view: aiView({ age: 1, me: aiMe(h.map(at), turn(k, 'right')), others, holes }), close: at([13, 0]) };
  };
  const closes = (key, scene) => {
    let n = 0;
    for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) {
      const { view, close } = pin({ k, ...scene }), d = AI.decide(view, hunting(key), { victimId: 1 }), h = view.me.body[0];
      if (h.x + d.x === close[0] && h.y + d.y === close[1]) n++;
    }
    return n;
  };
  for (const third of [false, true]) {
    const got = Object.fromEntries(HUNTERS.map(key => [key, closes(key, { third })]));
    check(`every hunter closes an easy pin against the edge, on every edge${third ? ', a third snake far off' : ''}`, HUNTERS.every(key => got[key] === 12), JSON.stringify(got));
  }
  const fatal = Object.fromEntries(HUNTERS.map(key => [key, closes(key, { third: true, hole: true })]));
  check('...but not where closing it would be its own end (a hole just beyond)', HUNTERS.every(key => fatal[key] === 0), JSON.stringify(fatal));
}

{ // ...on anyone: in the game, Sniper closes the same pin on a person as on a rival (what it sees of them is the
  // same), and the pin costs the pinned snake: segments lost crashing into the hunter, or one to jump it.
  const outcome = person => {
    const g = E.createGame({ withPlayer: false, personas: ['sniper', 'drab'] });
    g.snakes = g.snakes.slice(0, 2);
    const [a, b] = g.snakes;
    g.time = 30000;
    a.body = line(13, 1, 9).map(([x, y]) => ({ x, y })); a.dir = D.right;
    b.body = line(9, 0, 6).map(([x, y]) => ({ x, y })); b.dir = D.right;
    for (const s of [a, b]) { s.lastAte = g.time; s.nextStarve = g.time + T.HUNGER_MS; } // (fed: it's the hunt that decides)
    b.flashReadyAt = 1e9; // (its flash resting: rested, it may cut its way out through the hunter, one thick)
    if (person) { b.isPlayer = true; b.persona = null; b.queue = []; }
    a.memory.victimId = b.id;
    g.food = [{ x: 20, y: 20, kind: 'food', expires: 9999 }];
    g.given = new Set([20 * T.GRID + 20]);
    look(g);
    quiet(g);
    const closed = a.body[0].x === 13 && a.body[0].y === 0;
    for (let t = 0; t < 4; t++) quiet(g);
    return { closed, cost: b.body.length < 6 || !b.alive, hunterAlive: a.alive };
  };
  const onPerson = outcome(true), onRival = outcome(false);
  check('Sniper closes the pin on a person as on a rival, and it costs the pinned snake', onPerson.closed && onRival.closed && onPerson.cost && onRival.cost && onPerson.hunterAlive && onRival.hunterAlive, JSON.stringify({ onPerson, onRival }));
}
