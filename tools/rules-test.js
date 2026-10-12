#!/usr/bin/env node
// Rule checks on hand-built boards: node tools/rules-test.js
// Loads tuning.js, ai.js and engine.js unchanged, the way the game does.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ window: {}, console, Math });
for (const f of ['tuning.js', 'ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const { SnakeEngine: E, SnakeAI: AI, TUNING: T } = ctx.window;
const D = E.DIRS;

let failed = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : ` (${detail})`}`);
  if (!ok) failed++;
}

// Two people steered by their queues, with nothing else on the board.
function board(bodies, { food = [], time = 0 } = {}) {
  const g = E.createGame({ humans: bodies.map((b, i) => ({ name: `P${i}` })), personas: [] });
  g.snakes = g.snakes.slice(0, bodies.length);
  bodies.forEach(([cells, dir], i) => {
    const s = g.snakes[i];
    s.body = cells.map(([x, y]) => ({ x, y }));
    s.dir = D[dir];
  });
  g.food = food.map(([x, y, kind = 'food']) => ({ x, y, kind }));
  g.time = time;
  return g;
}

{ // Moving into the cell a tail is leaving is fine.
  const g = board([[[[5, 5], [4, 5], [4, 6], [5, 6]], 'down'], [[[10, 10], [9, 10], [8, 10]], 'right']]);
  E.step(g);
  check('a head may take the cell a tail is leaving', g.snakes[0].alive);
}

{ // Two heads swapping cells is a head-on, for both.
  const g = board([[[[5, 5], [4, 5], [3, 5]], 'right'], [[[6, 5], [7, 5], [8, 5]], 'left']]);
  const dying = E.step(g);
  check('swapping heads is a head-on', dying.length === 2 && dying.every(s => s.cause.startsWith('crashed head-on')), dying.map(s => s.cause).join(' / '));
}

{ // A snake out of time reaches food on the very tick: it eats instead of starving.
  const g = board([[[[5, 5], [4, 5], [3, 5]], 'right'], [[[15, 15], [14, 15], [13, 15]], 'right']], { food: [[6, 5]] });
  const s = g.snakes[0];
  s.nextStarve = 0; s.lastAte = -T.HUNGER_MS; // overdue, at minimum length
  const dying = E.step(g);
  check('reaching food saves a starving snake', s.alive && !dying.includes(s) && s.eaten === 1);
  const g2 = board([[[[5, 5], [4, 5], [3, 5]], 'right'], [[[15, 15], [14, 15], [13, 15]], 'right']]);
  g2.snakes[0].nextStarve = 0;
  check('without food it starves', E.step(g2).some(d => d.killer === 'hunger'));
}

{ // People can't take the names that mean walls, self-bites and hunger.
  const g = E.createGame({ humans: [{ name: 'wall' }, { name: 'self' }, { name: 'hunger' }] });
  check('reserved names are made unique', g.snakes.slice(0, 3).every(s => !['wall', 'self', 'hunger'].includes(s.name)), g.snakes.map(s => s.name).join(', '));
  check('unknown and inherited persona keys are ignored', E.createGame({ personas: ['constructor', 'toString', 'drab'], withPlayer: false }).snakes.every(s => s.color));
}

{ // The woodpecker never pecks near a head, or under food.
  const g = E.createGame({ withPlayer: false });
  g.time = T.SUDDEN_DEATH_MS;
  let near = 0, underFood = 0;
  for (let t = 0; t < 400 && g.snakes.filter(s => s.alive).length > 1; t++) {
    const foodCells = new Set(g.food.map(f => f.y * T.GRID + f.x));
    const heads = g.snakes.filter(s => s.alive).map(s => ({ ...s.body[0] }));
    E.step(g);
    for (const e of g.events) {
      if (e.type !== 'peck') continue;
      if (heads.some(h => Math.abs(h.x - e.x) + Math.abs(h.y - e.y) <= T.PECK_CLEARANCE + 1)) near++; // +1: heads moved this tick
      if (foodCells.has(e.y * T.GRID + e.x)) underFood++;
    }
  }
  check('the woodpecker keeps its distance from heads', near === 0, `${near} pecks too close`);
  check('the woodpecker pecks around food', underFood === 0, `${underFood} pecks under food`);
}

{ // An AI sees a new hole only after its reaction time, like a person.
  const g = E.createGame({ withPlayer: false });
  g.time = T.SUDDEN_DEATH_MS;
  let seenEarly = 0;
  for (let t = 0; t < 60 && g.snakes.some(s => s.alive); t++) {
    E.step(g);
    const someone = g.snakes.find(s => s.alive);
    if (!someone) break;
    const view = E.aiView(g, someone);
    for (const e of g.events) if (e.type === 'peck' && view.holes.has(e.y * T.GRID + e.x)) seenEarly++;
  }
  check('holes reach the AI with its reaction delay', seenEarly === 0, `${seenEarly} seen at once`);
}

{ // Boxed in, an AI prefers a cell a rival may have left over a wall or its own body.
  // Me heading up along the left wall at (0, 5); above is a rival's old tail cell, right is my body.
  const view = {
    grid: T.GRID,
    me: { id: 0, body: [{ x: 0, y: 5 }, { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 1, y: 5 }, { x: 1, y: 4 }], dir: D.up, grow: 0, hungerLeft: 99999 },
    others: [{ id: 1, body: [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }], dir: D.right }],
    food: [], holes: new Set(), age: 2, tick: 10, timeMs: 1000,
  };
  const picks = {};
  for (let i = 0; i < 200; i++) { const d = AI.decide(view, AI.PERSONAS.drab, {}); const n = Object.keys(D).find(k => D[k] === d); picks[n] = (picks[n] || 0) + 1; }
  check('a cornered AI takes the cell that may be free', picks.up === 200, JSON.stringify(picks));
}

console.log(failed ? `${failed} failed` : 'all good');
process.exit(failed ? 1 : 0);
