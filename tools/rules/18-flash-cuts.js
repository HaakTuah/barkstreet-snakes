// ---------------------------------------------------------------- round six B, part 3: the flashes cut
// (DESIGN "The plain flash cuts", "Dropping your tail"; tools/rules/02 has the engine's own rules: the
// cut, the neck cut, a failed flash, the edge's shelter.) The rivals use each through the same engine
// calls as a person: they cut, neck-cut and drop their own tails when it pays, and never fail a flash.

// A board built by hand, with a history of itself as it is now (what the rivals see).
function cutScene(personas, bodies, { holes = [], food = [] } = {}) {
  const g = E.createGame({ withPlayer: false, personas });
  g.snakes = g.snakes.slice(0, bodies.length);
  bodies.forEach(([cells, dir], i) => { g.snakes[i].body = cells.map(([x, y]) => ({ x, y })); g.snakes[i].dir = D[dir]; });
  for (const k of holes) g.holes.add(k);
  g.food = food.map(([x, y]) => ({ x, y, kind: 'food', expires: 9999 }));
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  for (const s of g.snakes) { s.lastAte = g.time; s.nextStarve = g.time + T.HUNGER_MS; s.restedAt = 0; } // (fed; the stamina full, a jump possible too: only the flash is weighed)
  const snap = () => ({ snakes: g.snakes.map(q => ({ id: q.id, body: q.body.map(c => ({ ...c })), dir: q.dir, stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0, land: -1, cough: 0 })), holes: g.holes.size, fires: [], pecks: [] });
  g.history = [snap(), snap(), snap()];
  return g;
}

{ // Folded in a pocket of its own body smaller than it is, its own body one thick in front and open log beyond: it drops its tail and gets out.
  // The pocket: (5..7, 9..11) inside a ring of its own body (and a hole); the head at (6,10) facing right, its own body at (8,10), open log beyond.
  const ring = [[6, 10], [5, 10], [4, 10], [4, 9], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [8, 9], [8, 10], [8, 11], [8, 12], [7, 12], [6, 12], [5, 12], [4, 12], [4, 13], [4, 14]];
  const tail = Array.from({ length: 16 }, (_, i) => [5 + i, 14]), long = [...ring, ...tail]; // (35 long: the pocket holds 7)
  const drops = {};
  for (const key of ['drab', 'gobbler', 'ouroboros', 'ghost']) {
    const g = cutScene([key, 'drab'], [[long, 'right'], [line(20, 2, 3), 'right']], { holes: [K(4, 11)] }), s = g.snakes[0]; // (a hole shuts its one gap)
    let cut = false, ev = [];
    for (let n = 0; n < 6 && s.alive && !cut; n++) { quiet(g); ev.push(...g.events.map(e => e.type)); cut = g.events.some(e => e.type === 'cut' && e.snake === s && e.by === s.id); }
    for (let n = 0; n < 6 && s.alive; n++) quiet(g);
    drops[key] = cut && s.alive ? 'dropped' : ev.includes('leap') && s.alive ? 'hopped' : s.alive ? 'alive' : 'out'; // (one stamina: a snake that can flash can jump, and hopping its own body is as good a way out; the next check rules the hop out)
  }
  check('boxed in a pocket of its own body, every rival gets out (drops its tail, or hops it, a jump being as free as a flash now)', Object.values(drops).every(v => v === 'dropped' || v === 'hopped'), JSON.stringify(drops));
}
{ // The same pocket in the log's corner, where no hop can land (off the log north and west; holes south; east, a cell
  // shut in on three sides): one stamina pays for a jump whenever it pays for a flash, so it's the hop that's ruled out.
  // (It circles its pocket a few moves before it cuts: the way on is a turn into what falls, not straight ahead.)
  const ring = [[2, 2], [1, 2], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [1, 4], [0, 4], [0, 5], [0, 6]];
  const long = [...ring, ...Array.from({ length: 16 }, (_, i) => [1 + i, 6])];
  const holes = [K(0, 3), K(6, 2), ...[5, 6, 7].flatMap(x => [K(x, 1), K(x, 3)]), ...[1, 2, 3].flatMap(x => [K(x, 5), K(x, 7)])]; // (east: (5, 2) shut in, and every landing within reach beyond it)
  const drops = {};
  for (const key of ['drab', 'gobbler', 'ouroboros', 'ghost']) {
    const g = cutScene([key, 'drab'], [[long, 'right'], [line(20, 12, 3), 'right']], { holes }), s = g.snakes[0];
    let cut = false, hop = false;
    for (let n = 0; n < 12 && s.alive && !cut; n++) { quiet(g); hop ||= g.events.some(e => e.type === 'leap' && e.snake === s); cut = g.events.some(e => e.type === 'cut' && e.snake === s && e.by === s.id); }
    for (let n = 0; n < 6 && s.alive; n++) quiet(g);
    drops[key] = cut && s.alive ? 'dropped' : hop ? 'hopped' : s.alive ? 'alive' : 'out';
  }
  check('boxed in a pocket of its own body with nowhere to hop, every rival drops its tail and gets out', Object.values(drops).every(v => v === 'dropped'), JSON.stringify(drops));
}

{ // A rival lying one thick across the way, a long tail behind the cut and open log beyond: the hunters cut their target.
  const wall = Array.from({ length: 16 }, (_, i) => [8, 4 + i]); // (heading up, its head at (8,4): (8,10) is its seventh segment)
  const cuts = {};
  for (const key of ['sniper', 'mute', 'vulture', 'creeper', 'drab']) {
    let n = 0;
    for (let r = 0; r < 4; r++) {
      const g = cutScene([key, 'drab'], [[line(6, 10, 5), 'right'], [wall, 'up']]);
      const [s, o] = g.snakes;
      o.isPlayer = true; o.persona = null; o.queue = []; // (it goes straight on: a person not pressing)
      s.memory.victimId = o.id; // (the hunters' target: Sniper cuts off its target)
      for (let t = 0; t < 3 && s.alive; t++) { quiet(g); if (g.events.some(e => e.type === 'cut' && e.by === s.id && e.snake === o)) { n++; break; } }
    }
    cuts[key] = n;
  }
  check('...a rival lying one thick across its way, the hunters cut it (Sniper, Mute)', cuts.sniper >= 3 && cuts.mute >= 3, JSON.stringify(cuts));
  // A neck cut: a rival crossing right in front, its neck one thick on the line, open log beyond: out it goes.
  const necks = {};
  for (const key of ['sniper', 'mute']) {
    const g = cutScene([key, 'drab'], [[line(6, 10, 6), 'right'], [[[8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14]], 'up']]);
    const [s, o] = g.snakes;
    o.isPlayer = true; o.persona = null; o.queue = [];
    quiet(g);
    necks[key] = !o.alive && o.fatal === 'cut' && o.killerId === s.id;
  }
  check('...and a rival crossing right in front, its neck on the line: the neck cut', Object.values(necks).every(Boolean), JSON.stringify(necks));
}

{ // Never a flash that fails: a body two thick across the way (nothing to cut), a head in front, or a body along the edge.
  const two = [Array.from({ length: 9 }, (_, i) => [8, 6 + i]), Array.from({ length: 9 }, (_, i) => [9, 14 - i])];
  const failed = [];
  for (const key of Object.keys(AI.PERSONAS)) {
    const g = cutScene([key, 'drab', 'drab'], [[line(6, 10, 5), 'right'], [two[0], 'up'], [two[1], 'down']]);
    for (const o of g.snakes.slice(1)) { o.isPlayer = true; o.persona = null; o.queue = []; o.stunUntil = 1e9; }
    for (let t = 0; t < 3; t++) { quiet(g); if (g.events.some(e => e.type === 'crash' && e.failed)) failed.push(key); }
  }
  check('no rival flashes into a body two thick (a failed flash)', !failed.length, failed.join(', '));
  // A head right in front (it can't be cut), and a body lying along the edge (nothing free beyond): no flash either.
  for (const [what, bodies] of [['a head', [[line(6, 10, 5), 'right'], [Array.from({ length: 9 }, (_, i) => [8, 10 + i]), 'up']]], ['a body along the edge', [[line(21, 10, 5), 'right'], [Array.from({ length: 12 }, (_, i) => [23, 4 + i]), 'up']]]]) {
    const bad = [];
    for (const key of Object.keys(AI.PERSONAS)) {
      const g = cutScene([key, 'drab'], bodies);
      const o = g.snakes[1]; o.isPlayer = true; o.persona = null; o.queue = []; o.stunUntil = 1e9;
      for (let t = 0; t < 2; t++) { quiet(g); if (g.events.some(e => e.type === 'crash' && e.failed)) bad.push(key); }
    }
    check(`...nor into ${what}`, !bad.length, bad.join(', '));
  }
}
