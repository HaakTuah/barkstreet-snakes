// ---------------------------------------------------------------- round six B: the new moves
// (DESIGN "Round six B"; tools/rules/02 has the hop's own rules: reach, landing, the press that waits.)

// A rival folded on a strip of log, everything round it holes but an island
// `gap` cells across the hollow: the owner's two cases. Its body runs down
// x = 2 and back up x = 1, its head at (2, 9) going up. (A board built by
// hand has no history: what the rivals see is the board as it is now.)
function stripScene(persona, gap, food) {
  const g = E.createGame({ withPlayer: false, personas: [persona, 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [s, o] = g.snakes;
  const strip = (x, y) => x >= 1 && x <= 2 && y >= 2 && y <= 21, isle = (x, y) => x >= 3 + gap && x <= 9 + gap && y >= 8 && y <= 14;
  const far = (x, y) => x >= 18 && x <= 22 && y >= 2 && y <= 6;
  for (let y = 0; y < T.GRID; y++) for (let x = 0; x < T.GRID; x++) if (!strip(x, y) && !isle(x, y) && !far(x, y)) g.holes.add(K(x, y));
  s.body = [];
  for (let y = 9; y <= 21; y++) s.body.push({ x: 2, y });
  for (let y = 21; y >= 9; y--) s.body.push({ x: 1, y });
  s.dir = D.up;
  o.body = [{ x: 20, y: 4 }, { x: 19, y: 4 }, { x: 18, y: 4 }]; o.dir = D.right;
  g.food = food.map(([x, y, kind = 'food']) => kind === 'pellet' ? { x, y, kind, color: '#888', owner: 9, expires: 9999 } : { x, y, kind, expires: 9999 });
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  const snap = () => ({ snakes: g.snakes.map(q => ({ id: q.id, body: q.body.map(c => ({ ...c })), dir: q.dir, stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0, land: -1, cough: 0 })), holes: g.holes.size, fires: [], pecks: [] });
  g.history = [snap(), snap(), snap()];
  return g;
}
// Steps until the rival hops (at most `n` ticks): the leap, or null.
function hopsWithin(g, n) {
  for (let i = 0; i < n; i++) {
    quiet(g);
    const e = g.events.find(e => e.type === 'leap' && e.snake === g.snakes[0]);
    if (e) return e;
  }
  return null;
}

{ // The owner's first case: Gobbler, folded on a strip, an island across a hollow with food on it. It finds the hop.
  const g = stripScene('gobbler', 3, [[10, 12]]);
  const e = hopsWithin(g, 30);
  for (let n = 0; n < 4; n++) quiet(g);
  check('Gobbler folded on a strip hops the hollow to the island', !!e && e.reach === 3 && g.snakes[0].alive && g.snakes[0].body[0].x >= 6, JSON.stringify(e && { reach: e.reach, head: g.snakes[0].body[0] }));
}

{ // The owner's second case (docs/handoff/owner-sniper-islands.jpg): Sniper coiled on a strip, islands of beads across gaps of 1 to 3.
  for (const gap of [1, 2, 3]) {
    const g = stripScene('sniper', gap, [[4 + gap, 9, 'pellet'], [6 + gap, 11, 'pellet'], [5 + gap, 13, 'pellet']]);
    const e = hopsWithin(g, 30);
    check(`Sniper on a strip hops a gap of ${gap} to an island of beads`, !!e && e.reach === gap, JSON.stringify(e && e.reach));
  }
}

{ // ...and the hop is for an island: with room and food on its own side, and none across, a rival doesn't spend its jump.
  const g = E.createGame({ withPlayer: false, personas: ['gobbler', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [s, o] = g.snakes;
  for (let y = 0; y < T.GRID; y++) for (let x = 12; x <= 13; x++) g.holes.add(K(x, y)); // (a hollow down the middle: the far side as big as this one)
  s.body = line(11, 10, 5).map(([x, y]) => ({ x, y })); s.dir = D.right;
  o.body = [{ x: 20, y: 20 }, { x: 19, y: 20 }, { x: 18, y: 20 }]; o.dir = D.right;
  g.food = [{ x: 9, y: 4, kind: 'food', expires: 9999 }];
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  const snap = () => ({ snakes: g.snakes.map(q => ({ id: q.id, body: q.body.map(c => ({ ...c })), dir: q.dir, stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0, land: -1, cough: 0 })), holes: g.holes.size, fires: [], pecks: [] });
  g.history = [snap(), snap(), snap()];
  quiet(g);
  check('...not with room and food on its own side', !g.events.some(e => e.type === 'leap') && s.alive, JSON.stringify(s.body[0]));
}
