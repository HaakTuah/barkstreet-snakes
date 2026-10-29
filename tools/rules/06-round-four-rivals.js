// ---------------------------------------------------------------- round four: the rivals
// A view built by hand (what an AI sees), and what it picks over many tries.
const cellsOf = a => a.map(([x, y]) => ({ x, y }));
const aiMe = (body, dir, more = {}) => ({ id: 0, body: cellsOf(body), dir: D[dir], grow: 0, hungerLeft: 99999, starveIn: 99999, leaps: 0, dashes: 0, wrap: 0, leapIn: 9999, flashIn: 9999, ...more });
const aiRival = (id, body, dir) => ({ id, body: cellsOf(body), dir: D[dir], stun: 0, leaps: 0, dashes: 0, wrap: 0 });
const aiView = more => ({ grid: T.GRID, food: [], holes: new Set(), fire: new Set(), age: 2, tick: 10, timeMs: 30000, ...more });
const picks = (view, persona = 'drab', n = 50) => {
  const out = {};
  for (let i = 0; i < n; i++) { const d = AI.decide(view(), AI.PERSONAS[persona], {}); const k = Object.keys(D).find(q => D[q] === d); out[k] = (out[k] || 0) + 1; }
  return out;
};

{ // The board split gives rivals their territory: food a rival gets to first isn't counted as mine.
  // Heading down the middle: a golden apple 6 below (a rival's head 5 below it, coming up), another 9 to the left.
  const split = (hungerLeft, length) => () => aiView({
    me: aiMe([[12, 4], [12, 3], [12, 2], [12, 1], [11, 1], [10, 1], [9, 1], [8, 1], [7, 1], [6, 1], [5, 1], [4, 1]].slice(0, length), 'down', { hungerLeft, starveIn: hungerLeft }),
    others: [aiRival(1, [[12, 15], [12, 16], [12, 17], [12, 18]], 'up')],
    food: [{ x: 12, y: 10, kind: 'golden', expires: 999 }, { x: 3, y: 4, kind: 'golden', expires: 999 }],
  });
  const fed = picks(split(99999, 12));
  check('a rival gets territory in the board split: an AI goes for the food it reaches first', fed.left === 50, JSON.stringify(fed));
  // ...and a starving one (desperate: four long, 4 s from its next shrink) takes the nearer one, a rival's or not.
  const calm = picks(split(15000, 4)), starving = picks(split(4000, 4));
  check('a desperate AI takes a contested apple it would otherwise leave', calm.left === 50 && starving.down === 50, JSON.stringify({ calm, starving }));
  const memory = {};
  AI.decide(split(4000, 4)(), AI.PERSONAS.drab, memory);
  check('...and says so (memory.desperate)', memory.desperate === true);
}

{ // Desperate, with no food it could reach in time, it hunts: a rival that crashes drops beads.
  const memory = {};
  AI.decide(aiView({ me: aiMe(line(5, 5, 4), 'right', { hungerLeft: 2000, starveIn: 2000 }), others: [aiRival(7, line(15, 15, 6), 'right')] }), AI.PERSONAS.ghost, memory);
  check('a desperate AI with no food in reach hunts', memory.desperate && memory.victimId === 7, JSON.stringify(memory));
}

{ // Starving, its own beads are no meal: it goes for a rival's bead, though its own are nearer.
  const view = () => aiView({
    me: aiMe(line(12, 12, 4), 'right', { hungerLeft: 3000, starveIn: 3000 }),
    others: [aiRival(1, line(20, 22, 4), 'right')],
    food: [{ x: 12, y: 9, kind: 'pellet', owner: 0, expires: 999 }, { x: 12, y: 8, kind: 'pellet', owner: 0, expires: 999 }, { x: 12, y: 16, kind: 'pellet', owner: 1, expires: 999 }],
  });
  const p = picks(view);
  check("a starving AI doesn't chase its own beads", p.down === 50, JSON.stringify(p));
  // ...nor a bead that'll have rotted before it gets there.
  const rotting = () => aiView({
    me: aiMe(line(12, 12, 4), 'right', { hungerLeft: 3000, starveIn: 3000 }),
    others: [aiRival(1, line(20, 22, 4), 'right')],
    food: [{ x: 12, y: 8, kind: 'pellet', owner: 1, expires: 13 }, { x: 12, y: 17, kind: 'pellet', owner: 1, expires: 999 }],
  });
  const r = picks(rotting);
  check("...nor a bead that'll rot before it gets there", r.down === 50, JSON.stringify(r));
}

{ // Nobody steers for a mushroom: with one right in front and room everywhere else, no persona eats it (hungry or not).
  const ate = [];
  for (const key of Object.keys(AI.PERSONAS)) {
    for (const hungerLeft of [99999, 3000]) {
      const view = () => aiView({ me: aiMe(line(8, 12, 6), 'right', { hungerLeft, starveIn: hungerLeft }), others: [aiRival(1, line(20, 2, 5), 'right')], food: [{ x: 9, y: 12, kind: 'mushroom', expires: 999 }] });
      const p = picks(view, key, 10);
      if (p.right) ate.push(`${key}${hungerLeft < 9999 ? ' (hungry)' : ''}`);
    }
  }
  check('nobody steers for a mushroom', !ate.length, ate.join(', '));
}

{ // A mushroom takes SHRINK segments off: to a rival, fed or not, that's as many apples lost. Keeping off one is worth a turn it dislikes (two apples' worth).
  const w = AI.PERSONAS.drab.w, fussy = { ...AI.PERSONAS.drab, w: { ...w, turn: 2 * (w.food * w.foodRange + w.eat) } }; // (an apple, to a rival not hungry)
  const view = () => aiView({ me: aiMe(line(8, 12, 6), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], food: [{ x: 9, y: 12, kind: 'mushroom', expires: 999 }] });
  let ate = 0;
  for (let i = 0; i < 20; i++) if (AI.decide(view(), fussy, {}) === D.right) ate++;
  check('a mushroom costs a rival three apples: it turns away, though a turn costs it two', !ate, `${ate} of 20 ate it`);
  // Gobbler hates them (as its blurb says): it keeps off one at a turn it dislikes more than the mushroom costs anyone else, where others eat it.
  const atTurn = (key, apples) => { const p = AI.PERSONAS[key], w = p.w; return { ...p, w: { ...w, turn: apples * (w.food * w.foodRange + w.eat) } }; };
  const eats = brain => { let n = 0; for (let i = 0; i < 20; i++) if (AI.decide(view(), brain, {}) === D.right) n++; return n; };
  const gobbler = eats(atTurn('gobbler', 4.5)), drab = eats(atTurn('drab', 4.5));
  check('Gobbler hates mushrooms: it turns away at a turn worth four and a half apples, where Drab eats one', !gobbler && drab === 20, `Gobbler ${gobbler}, Drab ${drab} of 20 ate it`);
}

{ // A hole under its own tail is still a hole once the tail has gone: it never follows its tail in.
  // Heading up into the top edge, its tail just to the left; right, a rival's body (which may be gone by now).
  const corner = hole => () => aiView({
    me: aiMe([[2, 0], [2, 1], [1, 1], [1, 0]], 'up'),
    others: [aiRival(1, [[3, 5], [3, 4], [3, 3], [3, 2], [3, 1], [3, 0], [4, 0]], 'down')],
    holes: new Set(hole ? [K(1, 0)] : []),
  });
  const open = picks(corner(false)), holed = picks(corner(true));
  check('an AI chases its own tail round...', open.left === 50, JSON.stringify(open));
  check('...but never into a hole the tail is leaving', !holed.left, JSON.stringify(holed));
}

{ // The woodpecker's mark is a wall to an AI, as it's seen (with its reaction delay), like the holes.
  const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = line(10, 10, 4).map(([x, y]) => ({ x, y })); a.dir = D.right;
  b.body = line(20, 22, 4).map(([x, y]) => ({ x, y })); b.dir = D.right;
  g.food = [];
  const mark = [K(11, 10), K(11, 9), K(11, 11), K(12, 10)];
  look(g);
  g.history[0].pecks = mark;
  const view = E.aiView(g, a);
  check("the woodpecker's mark is among what an AI keeps out of", mark.every(k => view.holes.has(k)));
  const d = AI.decide(view, AI.PERSONAS.drab, {});
  check('...so it steers clear of it', d !== D.right, Object.keys(D).find(q => D[q] === d));
}

{ // An AI flashes when it pays: a golden apple it and a rival would get to at the same moment, crawling.
  const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = line(4, 12, 4).map(([x, y]) => ({ x, y })); a.dir = D.right;
  b.body = line(14, 12, 4, 1).map(([x, y]) => ({ x, y })); b.dir = D.left; // (its head at 14, coming the other way: both 5 from it)
  b.isPlayer = true; b.persona = null; b.queue = [];
  g.food = [{ x: 9, y: 12, kind: 'golden', expires: 999 }];
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  look(g);
  quiet(g);
  check('an AI flashes when it pays (two cells in a tick, ahead of a rival)', a.body[0].x === 6 && g.events.some(e => e.type === 'dash' && e.snake === a && e.plain), JSON.stringify(a.body[0]));
  const g2 = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
  g2.snakes = g2.snakes.slice(0, 2);
  g2.snakes[0].body = line(4, 12, 4).map(([x, y]) => ({ x, y })); g2.snakes[0].dir = D.right;
  g2.snakes[1].body = line(20, 22, 4).map(([x, y]) => ({ x, y })); g2.snakes[1].dir = D.right;
  g2.snakes[1].isPlayer = true; g2.snakes[1].persona = null; g2.snakes[1].queue = [];
  g2.food = [{ x: 9, y: 12, kind: 'golden', expires: 999 }];
  g2.given = new Set(g2.food.map(f => f.y * T.GRID + f.x));
  look(g2);
  quiet(g2);
  check('...and not when it doesn\'t (the same apple, nobody racing for it)', g2.snakes[0].body[0].x === 5 && !g2.events.some(e => e.type === 'dash'), JSON.stringify(g2.snakes[0].body[0]));
}

{ // An AI spends a golden leap when it pays: over a rival lying across its way, onto the apple beyond.
  const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = line(5, 10, 4).map(([x, y]) => ({ x, y })); a.dir = D.right; a.leaps = 1; a.flashReadyAt = 1e9; // (its flash resting: it could cut through)
  b.body = Array.from({ length: 15 }, (_, i) => ({ x: 6, y: 3 + i })); b.dir = D.up; // (6,3) to (6,17): a long way round
  b.isPlayer = true; b.persona = null; b.queue = [];
  g.food = [{ x: 8, y: 10, kind: 'food', expires: 999 }];
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  for (let n = 0; n < 3; n++) { look(g); quiet(g); } // (up over it, down beyond, and on to the apple)
  check('an AI spends a golden leap when it pays', a.alive && a.leaps === 0 && a.body[0].x === 8 && a.body[0].y === 10 && a.eaten === 1, JSON.stringify({ head: a.body[0], leaps: a.leaps, eaten: a.eaten }));
}
