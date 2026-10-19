#!/usr/bin/env node
// Rule checks on hand-built boards: node tools/rules-test.js [--seed N]
// Loads tuning.js, ai.js and engine.js unchanged, the way the game does.
// (N: other randomness for the checks that don't seed their own.)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ window: {}, console, Math });
for (const f of ['tuning.js', 'ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const { SnakeEngine: E, SnakeAI: AI, TUNING: T } = ctx.window;
const D = E.DIRS;

// mulberry32, as simulate.js has it: the game's randomness from a seed.
const seeded = seed => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
// The game's randomness from a seed for a while (fn), then as it was: whole
// rounds played for their numbers come out the same every run, whatever
// changes in the checks before them.
function seededWhile(seed, fn) {
  const was = Math.random;
  Math.random = seeded(seed);
  try { return fn(); } finally { Math.random = was; }
}
// ...and from a seed for the whole run, so every check sees the same numbers
// every run. Some count what comes at random, or set things where the game
// happens to drop them, and with the run's own randomness one of them failed
// now and then with nothing wrong: the winter apple dropped right in front
// of a head and eaten before it could rot (one run in 300), three golden
// apples in clear weather where four were wanted (one in 250), and those
// seeded below on their own (Drab wandering off, a woodpecker's patch hemmed
// in, Wildcard drawn fond of leaves): about one run in 25 in all.
const SEED = process.argv.includes('--seed') ? Number(process.argv[process.argv.indexOf('--seed') + 1]) : 1;
Math.random = seeded(SEED);

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
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
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
  check('swapping heads is a head-on (at their smallest, both out)', dying.length === 2 && dying.every(s => s.cause.startsWith('crashed head-on')), dying.map(s => s.cause).join(' / '));
}

// ---------------------------------------------------------------- crashes
const line = (x0, y, n, dx = -1) => Array.from({ length: n }, (_, i) => [x0 + dx * i, y]);
const K = (x, y) => y * T.GRID + x;
const feed = g => { for (const o of g.snakes) { o.lastAte = g.time; o.nextStarve = g.time + T.HUNGER_MS; } };

{ // A crash into the edge: the head bounces, three segments break off as food, a stun; then it goes on.
  const g = board([[line(23, 5, 8), 'right'], [line(5, 20, 3), 'right']]);
  const s = g.snakes[0], tail = s.body.slice(-3).map(c => [c.x, c.y]);
  const dying = E.step(g);
  const crash = g.events.find(e => e.type === 'crash');
  check('a crash is not the end', s.alive && !dying.includes(s));
  check('...it costs three segments', s.body.length === 5, s.body.length);
  check('...which fall off as food', tail.every(([x, y]) => g.food.some(f => f.kind === 'pellet' && f.x === x && f.y === y)), JSON.stringify(g.food));
  check('...and says what it hit', crash && crash.snake === s && crash.killer === 'wall' && crash.lost === 3, JSON.stringify(crash && { k: crash.killer, lost: crash.lost }));
  const head = { ...s.body[0] };
  for (let t = 0; t < T.STUN_TICKS; t++) { feed(g); E.step(g); }
  check('...it stays put while stunned', s.body[0].x === head.x && s.body[0].y === head.y);
  feed(g);
  E.step(g);
  check("...then turns to where there's room and goes on", s.alive && (s.body[0].x !== head.x || s.body[0].y !== head.y) && s.dir !== D.right, JSON.stringify(s.body[0]));
}

{ // Every snake starts one longer than the least, so its first crash costs a segment, not the round.
  const g = E.createGame({ withPlayer: true });
  check('snakes start at START_LENGTH', g.snakes.every(o => o.body.length === T.START_LENGTH), g.snakes.map(o => o.body.length).join());
  const me = g.snakes[0];
  me.body = line(23, 12, T.START_LENGTH).map(([x, y]) => ({ x, y })); me.dir = D.right; me.queue = [];
  g.snakes.slice(1).forEach((o, i) => { o.body = line(3, 2 + i * 4, T.START_LENGTH).map(([x, y]) => ({ x, y })); o.dir = D.right; o.isPlayer = true; o.persona = null; o.queue = []; });
  const dying = E.step(g);
  check('...and survives its first crash, one segment down', me.alive && !dying.includes(me) && me.body.length === T.MIN_LENGTH, me.body.length);
}

{ // Boxed in, an AI goes through fire rather than crash (it costs the same, and it keeps moving).
  // Me heading up at the top edge: up is the edge, right a rival's body, left is burning.
  const fireCell = K(4, 0);
  const view = {
    grid: T.GRID,
    me: { id: 0, body: [{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }], dir: D.up, grow: 0, hungerLeft: 99999 },
    others: [{ id: 1, body: [{ x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 }, { x: 10, y: 0 }, { x: 11, y: 0 }, { x: 12, y: 0 }, { x: 13, y: 0 }, { x: 14, y: 0 }, { x: 15, y: 0 }], dir: D.left }],
    food: [], holes: new Set([fireCell]), fire: new Set([fireCell]), age: 2, tick: 10, timeMs: 1000,
  };
  const picks = {};
  for (let i = 0; i < 100; i++) { const d = AI.decide(view, AI.PERSONAS.drab, {}); const n = Object.keys(D).find(k => D[k] === d); picks[n] = (picks[n] || 0) + 1; }
  check('a boxed-in AI goes through fire rather than crash', picks.left === 100, JSON.stringify(picks));
  // ...but with an open way, it keeps out of fire.
  const open = { ...view, others: [] };
  const picks2 = {};
  for (let i = 0; i < 100; i++) { const d = AI.decide(open, AI.PERSONAS.drab, {}); const n = Object.keys(D).find(k => D[k] === d); picks2[n] = (picks2[n] || 0) + 1; }
  check('...but never as a shortcut', !picks2.left, JSON.stringify(picks2));
}

// ---------------------------------------------------------------- golden beetles and leaps
{ // A golden beetle gives leaps.
  const g = board([[line(5, 5, 4), 'right'], [line(5, 20, 3), 'right']]);
  g.food = [{ x: 6, y: 5, kind: 'beetle', gold: 1, expires: 999, dir: D.up, movedAt: g.tick }];
  E.step(g);
  check('a golden beetle gives leaps', g.snakes[0].leaps === T.LEAP_CHARGES && g.snakes[0].eaten === T.BEETLE_GROWTH, g.snakes[0].leaps);
}

// What an AI sees, as things stand now (a board built by hand has no history yet).
const look = g => {
  g.history = [{
    snakes: g.snakes.filter(o => o.alive).map(o => ({ id: o.id, body: o.body.map(c => ({ ...c })), dir: o.dir, stun: 0, leaps: o.leaps, dashes: o.dashes, wrap: 0, air: 0 })),
    food: g.food.map(f => ({ ...f })), holes: g.holes.size, fires: [...g.fires.keys()], pecks: [],
  }];
};
const joined = b => b.every((c, i) => !i || Math.abs(c.x - b[i - 1].x) + Math.abs(c.y - b[i - 1].y) === 1);
const wall = (x, y0 = 8, n = 5) => [Array.from({ length: n }, (_, i) => [x, y0 + i]), 'up']; // (a snake across row 10, heading up)

// (A step with only the food a test put there: nothing that grows mid-test lands in the way.)
const quiet = g => { if (g.given) g.food = g.food.filter(f => g.given.has(f.y * T.GRID + f.x)); return E.step(g); };

{ // Anyone can leap: pressing the way you're going hops the body in front, two cells in two ticks, for the tip of its tail.
  const g = board([[line(5, 10, 5), 'right'], wall(6)]);
  const me = g.snakes[0];
  E.leap(g, me);
  quiet(g);
  check('a leap: up over the body in front', me.alive && me.body[0].x === 6 && me.body[0].y === 10 && !!me.flight && g.events.some(e => e.type === 'leap' && !e.gold), JSON.stringify(me.body[0]));
  check('...for the tip of its tail', me.body.length === 5 - T.LEAP_COST, me.body.length);
  me.queue = [D.down]; // (a turn while it's in the air waits till it lands)
  quiet(g);
  check('...and down on the far side next tick', me.alive && me.body[0].x === 7 && me.body[0].y === 10 && me.body[1].x === 6 && !me.flight, JSON.stringify(me.body.slice(0, 2)));
  check('...its body still joined up, and the one hopped is fine', joined(me.body) && g.snakes[1].alive);
  quiet(g);
  check('...then the turn', me.body[0].x === 7 && me.body[0].y === 11, JSON.stringify(me.body[0]));
  check('...and it needs a moment before the next', E.leapIn(g, me) > 0 && E.leapIn(g, me) <= T.LEAP_COOLDOWN_MS, E.leapIn(g, me));
}

{ // ...not again until it's ready: a crash instead.
  const g = board([[line(5, 10, 6), 'right'], wall(6), wall(8, 4, 12)]);
  const me = g.snakes[0];
  E.leap(g, me); quiet(g); quiet(g); // (over the first, landing at 7)
  E.leap(g, me); quiet(g);
  check('a leap needs a moment before the next', !g.events.some(e => e.type === 'leap') && g.events.some(e => e.type === 'crash' && e.snake === me));
  const g2 = board([[line(5, 10, 6), 'right'], wall(6), wall(8, 4, 12)]);
  const m2 = g2.snakes[0];
  E.leap(g2, m2); quiet(g2); quiet(g2);
  g2.time += T.LEAP_COOLDOWN_MS;
  feed(g2);
  E.leap(g2, m2); quiet(g2);
  check('...and then it can again', g2.events.some(e => e.type === 'leap') && m2.body[0].x === 8);
}

{ // Never at its smallest (it costs a segment), never off the board, never onto a body; it waits for something to hop.
  const g = board([[line(5, 10, T.MIN_LENGTH), 'right'], wall(6)]);
  E.leap(g, g.snakes[0]);
  quiet(g);
  check('no leap at its smallest', !g.events.some(e => e.type === 'leap'));
  const g2 = board([[line(22, 10, 5), 'right'], wall(23)]);
  E.leap(g2, g2.snakes[0]); quiet(g2);
  check('...never off the board', !g2.events.some(e => e.type === 'leap') && g2.events.some(e => e.type === 'crash'));
  const g3 = board([[line(5, 10, 5), 'right'], wall(6), wall(7)]);
  E.leap(g3, g3.snakes[0]); quiet(g3);
  check('...never onto a body', !g3.events.some(e => e.type === 'leap') && g3.events.some(e => e.type === 'crash'));
  const g4 = board([[line(5, 10, 5), 'right'], wall(7, 9)]);
  const me = g4.snakes[0];
  E.leap(g4, me);
  quiet(g4); // (open ground ahead: no leap yet)
  const waited = !g4.events.some(e => e.type === 'leap');
  g4.snakes[1].queue = [D.up];
  quiet(g4); // (the body's right in front now)
  check('...it waits a moment for something to hop', waited && g4.events.some(e => e.type === 'leap') && me.body[0].x === 7, JSON.stringify(me.body[0]));
}

{ // A golden leap: three cells in two ticks, hopping up to two, free.
  const g = board([[line(5, 10, 5), 'right'], wall(6), wall(7)]);
  const me = g.snakes[0];
  me.leaps = 2;
  E.leap(g, me);
  quiet(g);
  check('a golden leap: two cells up and over at once', me.body[0].x === 7 && me.body[1].x === 6 && !!me.flight && me.leaps === 1 && g.events.some(e => e.type === 'leap' && e.gold), JSON.stringify(me.body.slice(0, 2)));
  quiet(g);
  check('...landing on the third next tick', me.alive && me.body[0].x === 8 && joined(me.body) && g.snakes.every(o => o.alive), JSON.stringify(me.body[0]));
  check('...free, and ready again at once', me.body.length === 5 && me.leapReadyAt === 0, me.body.length);
}

{ // An AI asks for its power the way a person does: boxed in, with a leap, it hops instead of crashing.
  // At the top edge, heading right: up is the edge, down its own body, right a rival's body (and beyond it, room).
  for (const golden of [true, false]) {
    const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
    g.snakes = g.snakes.slice(0, 2);
    const [a, b] = g.snakes;
    a.body = [[5, 0], [4, 0], [4, 1], [5, 1], [5, 2], [4, 2]].map(([x, y]) => ({ x, y })); a.dir = D.right; a.leaps = golden ? 1 : 0;
    b.body = [...Array.from({ length: 13 }, (_, i) => ({ x: 6, y: 12 - i })), { x: 7, y: 0 }]; b.dir = D.down;
    b.isPlayer = true; b.persona = null; b.queue = [];
    g.food = [];
    look(g);
    quiet(g);
    look(g);
    quiet(g);
    const lands = golden ? [[8, 0], [5, 3]] : [[7, 0]]; // (golden: over the rival, or over its own body, whichever lands better)
    check(`a boxed-in AI with a ${golden ? 'golden' : 'plain'} leap hops instead of crashing`, a.alive && g.snakes.every(o => o.alive) && lands.some(([x, y]) => a.body[0].x === x && a.body[0].y === y) && a.leaps === 0, JSON.stringify(a.body[0]));
  }
}

{ // A golden leaf's dash: three cells in one tick, eating what's on the way.
  const g = board([[line(5, 10, 5), 'right'], [line(5, 20, 3), 'right']], { food: [[6, 10], [8, 10]] });
  const me = g.snakes[0];
  me.dashes = 2;
  E.flash(g, me);
  quiet(g);
  check('a dash: three cells in one tick', me.body[0].x === 8 && me.body[0].y === 10 && joined(me.body) && me.dashes === 1 && g.events.some(e => e.type === 'dash' && e.n === 3), JSON.stringify(me.body.slice(0, 4)));
  check('...eating what was on the way', me.eaten === 2 && !g.food.some(f => f.y === 10 && (f.x === 6 || f.x === 8)), me.eaten);
  const g2 = board([[line(5, 10, 5), 'right'], [line(5, 20, 3), 'right']]);
  g2.fires.set(K(7, 10), { from: 0, until: 99, group: 1, strike: false }); g2.fireGroups.set(1, 1);
  g2.snakes[0].dashes = 1;
  E.flash(g2, g2.snakes[0]); quiet(g2);
  check('...putting out fire on the way', !g2.fires.size && !(g2.snakes[0].burnUntil > g2.tick) && g2.events.some(e => e.type === 'douse'));
}

{ // A dash cuts through a snake lying across its way, one cell thick: the rest of it falls off as food.
  const across = [Array.from({ length: 13 }, (_, i) => [7, 4 + i]), 'up']; // (7,4) to (7,16), (7,10) six from its head
  const g = board([[line(5, 10, 5), 'right'], across]);
  const [me, o] = g.snakes;
  me.dashes = 1;
  E.flash(g, me); quiet(g);
  check('a dash cuts a snake in two', me.alive && me.body[0].x === 8 && o.alive && o.body.length === 6 && g.events.some(e => e.type === 'cut' && e.snake === o && e.by === me.id), o.body.length);
  check('...the rest falls off as food', [11, 12, 13, 14, 15, 16].every(y => g.food.some(f => f.kind === 'pellet' && f.x === 7 && f.y === y)), JSON.stringify(g.food.map(f => [f.x, f.y])));
  const g2 = board([[line(5, 10, 5), 'right'], [Array.from({ length: 8 }, (_, i) => [7, 9 + i]), 'up']]); // (cut right behind its head)
  E.flash(g2, Object.assign(g2.snakes[0], { dashes: 1 }));
  const dying = quiet(g2);
  check('...too near its head, and it\'s out', dying.includes(g2.snakes[1]) && g2.snakes[1].cause === 'got cut in two by P0' && g2.snakes[0].alive, g2.snakes[1].cause);
}

{ // An AI with a dash uses it to cut a rival in two right behind its head.
  const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = line(5, 10, 5).map(([x, y]) => ({ x, y })); a.dir = D.right; a.dashes = 1;
  b.body = Array.from({ length: 12 }, (_, i) => ({ x: 7, y: 9 + i })); b.dir = D.up; // (its head at 7,9: cut at 7,10, right behind it)
  b.isPlayer = true; b.persona = null; b.queue = [];
  g.food = [];
  look(g);
  const dying = quiet(g);
  check('an AI with a dash cuts a rival in two', dying.includes(b) && a.alive && a.dashes === 0, b.cause);
}

{ // A dash crashes into anything it can't cut: a snake two thick (it gets that far first).
  const along = [[[12, 10], [11, 10], [10, 10], [9, 10], [8, 10], [7, 10]], 'right']; // (its tail at 7 moves on)
  const g = board([[line(5, 10, 8), 'right'], along]);
  const me = g.snakes[0];
  me.dashes = 1;
  E.flash(g, me); quiet(g);
  const crash = g.events.find(e => e.type === 'crash' && e.snake === me);
  check('a dash into a snake two thick: it gets that far and crashes', me.alive && me.body[0].x === 7 && crash && crash.x === 8, JSON.stringify(me.body[0]));
}

{ // Dashing into the edge, or a hole: it blows up.
  const g = board([[line(22, 10, 8), 'right'], [line(5, 20, 3), 'right']]);
  E.flash(g, Object.assign(g.snakes[0], { dashes: 1 }));
  const dying = quiet(g);
  check('a dash into the edge blows up', dying.includes(g.snakes[0]) && g.snakes[0].cause === 'flashed into the edge and blew up', g.snakes[0].cause);
  const g2 = board([[line(5, 10, 8), 'right'], [line(5, 20, 3), 'right']]);
  g2.holes.add(K(7, 10));
  E.flash(g2, Object.assign(g2.snakes[0], { dashes: 1 }));
  check('...and into a hole', quiet(g2).includes(g2.snakes[0]) && g2.snakes[0].cause === 'flashed into a woodpecker hole and blew up', g2.snakes[0].cause);
}

{ // A golden mushroom: for a while the edges wrap round.
  const g = board([[line(5, 10, 5), 'right'], [line(5, 20, 3), 'right']], { food: [[6, 10, 'goldcap']] });
  const me = g.snakes[0];
  quiet(g);
  check('a golden mushroom: the edges wrap', me.wrapUntil > g.time && me.wrapUntil <= g.time + T.WRAP_MS);
  me.body = line(23, 10, 5).map(([x, y]) => ({ x, y }));
  quiet(g);
  check('...off one side, in at the other', me.alive && me.body[0].x === 0 && me.body[0].y === 10 && !g.events.some(e => e.type === 'crash'), JSON.stringify(me.body[0]));
  me.wrapUntil = g.time;
  me.body = line(23, 10, 5).map(([x, y]) => ({ x, y }));
  feed(g); quiet(g);
  check('...for a while', g.events.some(e => e.type === 'crash' && e.snake === me && e.killer === 'wall'));
}

{ // An AI whose edges wrap goes through one when that's the way out.
  // At the right edge heading down: below a hole, left a rival's body, behind its own; right, the edge.
  const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = [[23, 5], [23, 4], [23, 3], [23, 2], [23, 1]].map(([x, y]) => ({ x, y })); a.dir = D.down; a.wrapUntil = g.time + 5000;
  b.body = Array.from({ length: 9 }, (_, i) => ({ x: 22, y: 12 - i })); b.dir = D.down; // (22,12) up to (22,4)
  b.isPlayer = true; b.persona = null; b.queue = [];
  g.holes.add(K(23, 6));
  g.food = [];
  look(g);
  quiet(g);
  check("an AI whose edges wrap goes through one when that's the way out", a.alive && a.body[0].x === 0 && a.body[0].y === 5 && !g.events.some(e => e.type === 'crash' && e.snake === a), JSON.stringify(a.body[0]));
}

{ // Golden leaps wait for something to hop too, and aren't spent on open ground; one that can't land three on lands two on, still free.
  const g = board([[line(5, 10, 5), 'right'], wall(8, 9)]);
  const me = g.snakes[0];
  me.leaps = 1;
  E.leap(g, me); quiet(g);
  check('a golden leap isn\'t spent on open ground', me.leaps === 1 && !g.events.some(e => e.type === 'leap'));
  const g2 = board([[line(5, 10, 5), 'right'], wall(6), wall(8)]); // (over 6, but 8 is no place to land: it lands on 7)
  const m2 = g2.snakes[0];
  m2.leaps = 1;
  E.leap(g2, m2); quiet(g2); quiet(g2);
  check('...one that can\'t land three on lands on the first free cell, still free', m2.leaps === 0 && m2.alive && m2.body[0].x === 7 && m2.leapReadyAt <= g2.time && m2.body.length === 5, JSON.stringify(m2.body[0]));
}

{ // In the air: no eating, no catching fire, and nothing arriving under you meets you.
  const g = board([[line(5, 10, 5), 'right'], wall(6), wall(9, 9)], { food: [[7, 10]] }); // (an apple on the golden leap's mid-air cell)
  const me = g.snakes[0];
  me.leaps = 1;
  E.leap(g, me); quiet(g);
  check('in the air, it doesn\'t eat', me.body[0].x === 7 && me.eaten === 0 && g.food.some(f => f.x === 7 && f.y === 10), me.eaten);
  const g2 = board([[line(5, 10, 5), 'right'], [[[5, 20], [4, 20], [3, 20]], 'right']]);
  g2.fires.set(K(6, 10), { from: 0, until: 999, group: 1, strike: false }); g2.fireGroups.set(1, 1);
  E.leap(g2, g2.snakes[0]); quiet(g2); quiet(g2);
  check('...leaps over fire without catching it', g2.snakes[0].body[0].x === 7 && !(g2.snakes[0].burnUntil > g2.tick) && g2.events.length >= 0, g2.snakes[0].burnUntil);
}

{ // A dash crashes into a head, or its own body, like anything it can't cut.
  const g = board([[line(5, 10, 6), 'right'], [[[7, 10], [7, 11], [7, 12], [7, 13], [7, 14]], 'up']]); // (a head in the way)
  E.flash(g, Object.assign(g.snakes[0], { dashes: 1 }));
  quiet(g);
  check('a dash into a head crashes', g.snakes[0].alive && g.snakes[1].alive && g.events.some(e => e.type === 'crash' && e.snake === g.snakes[0]) && !g.events.some(e => e.type === 'cut'));
  const coil = [[5, 10], [5, 11], [6, 11], [7, 11], [7, 10], [7, 9], [6, 9], [5, 9], [4, 9], [3, 9]]; // ((7,10), two ahead, is its own body)
  const g2 = board([[coil, 'right'], [[[5, 20], [4, 20], [3, 20]], 'right']]);
  E.flash(g2, Object.assign(g2.snakes[0], { dashes: 1 }));
  quiet(g2);
  check('...and into its own body', g2.snakes[0].alive && g2.events.some(e => e.type === 'crash' && e.snake === g2.snakes[0] && e.killer === 'self'), JSON.stringify(g2.events.map(e => e.type)));
}

{ // Rain schedules a golden mushroom now and then (and no other weather does).
  const g = board([[line(5, 5, 4), 'right'], [line(5, 15, 4), 'right']]);
  for (const o of g.snakes) o.stunUntil = 1e9;
  let rains = 0, capsInRain = 0, capsElse = 0;
  for (let t = 0; t < 4000; t++) {
    g.time = 0; g.weather = { kind: 'clear', since: 0, until: 0, nextGust: 1e12, nextStrike: 1e12 }; feed(g); quiet(g);
    if (g.weather.kind === 'rain') { rains++; if (g.weather.goldcapAt != null) capsInRain++; } else if (g.weather.goldcapAt != null) capsElse++;
  }
  const rate = capsInRain / rains;
  check('rain schedules a golden mushroom now and then (and nothing else does)', rains > 300 && Math.abs(rate - T.GOLDCAP_CHANCE) < 0.06 && capsElse === 0, `${capsInRain}/${rains} rains, ${capsElse} otherwise`);
}

{ // The woodpecker gets hungrier: each rest shorter than the last, each patch a cell bigger.
  // (Seeded: a patch hemmed in by the holes before it can't grow its full
  // size, and takes half or more; from about one start in 700 the sixth
  // came out 7 or 8 cells, not 14, and the bigger patches failed.)
  const pecks = seededWhile(191, () => {
    const g = board([[line(3, 2, 3), 'right'], [line(3, 21, 3), 'right']], { time: T.SUDDEN_DEATH_MS });
    for (const o of g.snakes) o.stunUntil = 1e9;
    const pecks = [];
    for (let t = 0; t < 1200 && pecks.length < 6; t++) { feed(g); quiet(g); for (const e of g.events) if (e.type === 'peck') pecks.push({ at: g.tick, n: e.cells.length }); }
    return pecks;
  });
  const rests = pecks.slice(1).map((p, i) => p.at - pecks[i].at);
  check('the woodpecker gets hungrier: shorter rests', pecks.length === 6 && rests.every((r, i) => !i || r <= rests[i - 1]) && rests[rests.length - 1] < rests[0], JSON.stringify(rests));
  check('...and bigger patches', pecks[pecks.length - 1].n > T.PECK_CHUNK && pecks[pecks.length - 1].n <= T.PECK_CHUNK_MAX, JSON.stringify(pecks.map(p => p.n)));
}

{ // Golden powers add up: a leaf on top of golden leaps keeps them; another leaf adds, up to DASH_MAX.
  const g = board([[line(5, 10, 5), 'right'], [line(5, 20, 3), 'right']], { food: [[6, 10, 'leaf']] });
  g.snakes[0].leaps = 2; g.snakes[0].dashes = 2;
  E.step(g);
  check('golden powers add up (a leaf, holding leaps and dashes)', g.snakes[0].dashes === Math.min(T.DASH_MAX, 2 + T.DASH_CHARGES) && g.snakes[0].leaps === 2, JSON.stringify([g.snakes[0].leaps, g.snakes[0].dashes]));
  const g2 = board([[line(5, 10, 5), 'right'], [line(5, 20, 3), 'right']], { food: [[6, 10, 'goldcap']] });
  g2.snakes[0].wrapUntil = g2.time + 9500;
  const t0 = g2.time;
  E.step(g2);
  check('...a second golden mushroom adds its time, up to WRAP_MAX_MS', g2.snakes[0].wrapUntil - t0 <= 9500 + T.WRAP_MS && g2.snakes[0].wrapUntil - g2.time <= T.WRAP_MAX_MS && g2.snakes[0].wrapUntil - g2.time > T.WRAP_MS + 5000, g2.snakes[0].wrapUntil - g2.time);
}

{ // Jump and flash are separate presses: holding golden dashes, a jump still hops (it doesn't dash into the hole).
  const g = board([[line(5, 10, 5), 'right'], [line(5, 20, 3), 'right']]);
  const me = g.snakes[0];
  me.dashes = 1;
  g.holes.add(K(6, 10));
  E.leap(g, me); quiet(g);
  check('holding dashes, a jump hops a hole (it doesn\'t dash in)', me.alive && me.dashes === 1 && g.events.some(e => e.type === 'leap'), me.cause);
}

{ // Everyone can flash: two cells in one tick along the ground, then it rests.
  const g = board([[line(5, 10, 5), 'right'], [line(5, 20, 3), 'right']], { food: [[6, 10]] });
  const me = g.snakes[0];
  E.flash(g, me); quiet(g);
  check('a plain flash: two cells in one tick, eating on the way', me.body[0].x === 7 && joined(me.body) && me.eaten === 1 && g.events.some(e => e.type === 'dash' && e.plain && e.n === T.FLASH_LENGTH), JSON.stringify(me.body.slice(0, 3)));
  check('...then it rests', E.flashIn(g, me) > 0 && E.flashIn(g, me) <= T.FLASH_COOLDOWN_MS);
  E.flash(g, me); quiet(g);
  check('...a flash while resting fizzles (a crawl instead)', me.body[0].x === 8 && g.events.some(e => e.type === 'fizzle' && e.why === 'resting' && e.flash), JSON.stringify(g.events.map(e => e.type)));
  const g2 = board([[line(5, 10, 5), 'right'], [[[7, 8], [7, 9], [7, 10], [7, 11], [7, 12], [7, 13]], 'up']]);
  E.flash(g2, g2.snakes[0]); quiet(g2);
  check('...into a body it doesn\'t cut: it gets that far and runs into it', g2.snakes[0].body[0].x === 6 && g2.snakes[1].body.length === 6 && g2.events.some(e => e.type === 'crash' && e.snake === g2.snakes[0]), JSON.stringify(g2.snakes[0].body[0]));
}

{ // Golden leaves come on the wind, golden mushrooms in the rain, and never otherwise.
  const still = () => {
    const g = board([[line(5, 5, 4), 'right'], [line(5, 15, 4), 'right']]);
    for (const o of g.snakes) o.stunUntil = 1e9; // (nobody moves)
    return g;
  };
  const kinds = (g, kind, ticks) => {
    let n = 0;
    for (let t = 0; t < ticks; t++) { feed(g); E.step(g); n += g.events.filter(e => e.type === 'spawn' && e.kind === kind).length; g.food = g.food.filter(f => f.kind !== kind); }
    return n;
  };
  const wind = still();
  let leaves = 0;
  for (let t = 0; t < 400; t++) { wind.weather = { kind: 'wind', since: 0, until: 1e12, nextGust: 0, nextStrike: 1e12 }; leaves += kinds(wind, 'leaf', 1); }
  const rain = still();
  rain.weather = { kind: 'rain', since: 0, until: 1e12, nextGust: 0, nextStrike: 1e12, goldcapAt: 0 };
  const caps = kinds(rain, 'goldcap', 5);
  let other = 0;
  for (const kind of ['clear', 'sun', 'storm', 'snow', 'rain']) {
    const g = still();
    g.weather = { kind, since: 0, until: 1e12, nextGust: 0, nextStrike: 1e12 };
    other += kinds(g, 'leaf', 300) + (kind === 'rain' ? 0 : kinds(g, 'goldcap', 300));
  }
  check('golden leaves come on the wind', Math.abs(leaves - 400 * T.LEAF_CHANCE) < 200 * T.LEAF_CHANCE + 5, `${leaves} in 400 gusts`);
  check('...golden mushrooms in the rain', caps === 1, caps);
  check('...and never otherwise', other === 0, other);
}

{ // Two heads that meet in an empty cell bounce, and don't go for it (or each other) again when the stun's over.
  for (const [a0, a1, label] of [[['right', 10, 10], ['left', 12, 10], 'face to face'], [['down', 16, 15], ['right', 15, 16], 'across a corner']]) {
    const mk = ([dir, x, y]) => [Array.from({ length: 8 }, (_, i) => [x - D[dir].x * i, y - D[dir].y * i]), dir];
    const g = board([mk(a0), mk(a1)]);
    let headOns = 0;
    for (let t = 0; t < 1 + T.STUN_TICKS + 4; t++) { feed(g); for (const o of g.snakes) o.queue = []; E.step(g); headOns += g.events.filter(e => e.type === 'crash' && e.cause.startsWith('crashed head-on')).length; }
    check(`heads that meet (${label}) bounce once, not again and again`, headOns === 2 && g.snakes.every(o => o.alive), `${headOns / 2} head-ons`);
  }
}

{ // Head-on, both boxed in: the longer bounces, the shorter's out; the same length, both out.
  // A heads right into (6,5), boxed by its own coils above and below; B heads left into it, boxed the same way.
  const A = [[5, 5], [4, 5], [4, 6], [5, 6], [6, 6], [6, 7], [5, 7], [4, 7], [3, 7], [3, 6], [3, 5], [3, 4], [4, 4], [5, 4], [5, 3], [5, 2], [5, 1], [5, 0]];
  const B = [[7, 5], [8, 5], [8, 4], [7, 4], [7, 3], [8, 3], [9, 3], [9, 4], [9, 5], [9, 6], [8, 6], [7, 6], [7, 7], [8, 7], [9, 7], [9, 8], [9, 9], [9, 10]];
  const g = board([[A, 'right'], [B.slice(0, 16), 'left']]);
  const dying = E.step(g);
  check('head-on, both boxed in: the longer bounces', g.snakes[0].alive && g.snakes[0].stunUntil > g.tick, g.snakes[0].cause);
  check('...and the shorter is out', dying.includes(g.snakes[1]) && g.snakes[1].cause.startsWith('crashed head-on'), g.snakes[1].cause);
  const g2 = board([[A, 'right'], [B, 'left']]);
  check('...the same length: both out', E.step(g2).length === 2);
  // Against one at its smallest (out anyway), the long one bounces too.
  const g3 = board([[A, 'right'], [[[7, 5], [8, 5], [9, 5]], 'left']]);
  const d3 = E.step(g3);
  check('...and against one at its smallest', g3.snakes[0].alive && d3.includes(g3.snakes[1]), g3.snakes[0].cause);
}

{ // Head-on where only one is boxed in: the other has room of its own and turns away, so the cell they met in is the boxed one's way out.
  const A = [[10, 10], [9, 10], [9, 9], [10, 9], [11, 9], [11, 8], [10, 8], [9, 8], [8, 8], [8, 9], [8, 10], [8, 11], [9, 11], [10, 11], [11, 11], [11, 12], [11, 13], [11, 14], [11, 15]];
  const g = board([[A, 'right'], [[[12, 10], [13, 10], [14, 10], [15, 10], [16, 10]], 'left']]);
  const [a, b] = g.snakes;
  const dying = E.step(g);
  check('head-on, only one boxed in: both bounce', !dying.length && a.alive && b.alive && a.stunUntil > g.tick && b.stunUntil > g.tick, a.cause);
  for (let t = 0; t < T.STUN_TICKS + 1; t++) { feed(g); E.step(g); }
  check('...the other turns away, the boxed one takes the cell they met in', a.alive && b.alive && a.body[0].x === 11 && a.body[0].y === 10 && b.body[0].x === 12 && b.body[0].y !== 10, JSON.stringify([a.body[0], b.body[0]]));
}

{ // After a head-on, the longer one may go back into the cell they met in (the other may not): it isn't turned into a dead end.
  const A = [[10, 10], [9, 10], [8, 10], [8, 11], [9, 11], [10, 11], [11, 11], [11, 12], [11, 13], [11, 14], [11, 15], [11, 16]];
  const g = board([[A, 'right'], [[[12, 10], [13, 10], [14, 10], [15, 10], [16, 10]], 'left']]);
  for (const [x, y] of [[10, 8], [9, 9], [11, 9]]) g.holes.add(K(x, y)); // ((10,9), above A's head: a dead end)
  const [a, b] = g.snakes;
  E.step(g);
  let again = 0;
  for (let t = 0; t < T.STUN_TICKS + 1; t++) { feed(g); E.step(g); again += g.events.filter(e => e.type === 'crash').length; }
  check('after a head-on the longer one takes the cell they met in, not a dead end', a.alive && b.alive && !again && a.body[0].x === 11 && a.body[0].y === 10 && b.body[0].x === 12 && b.body[0].y !== 10, JSON.stringify([a.body[0], b.body[0]]));
}

{ // An AI doesn't chase an apple that'll have rotted before it gets there.
  const g = E.createGame({ withPlayer: false, personas: ['gobbler', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [a, b] = g.snakes;
  a.body = line(5, 10, 4).map(([x, y]) => ({ x, y })); a.dir = D.right;
  b.body = line(20, 22, 4).map(([x, y]) => ({ x, y })); b.dir = D.right;
  g.food = [{ x: 5, y: 4, kind: 'food', expires: g.tick + 3 }, { x: 5, y: 17, kind: 'food', expires: g.tick + 999 }];
  g.history = [{ snakes: g.snakes.map(o => ({ id: o.id, body: o.body.map(c => ({ ...c })), dir: o.dir, stun: 0, leaps: 0 })), food: g.food.map(f => ({ ...f })), holes: 0, fires: [], pecks: [] }]; // (what it sees: the board as built)
  E.step(g);
  check("an AI skips an apple that'll rot before it gets there", a.body[0].x === 5 && a.body[0].y === 11, JSON.stringify(a.body[0]));
}

{ // Over a crash on an open board, not having steered: the auto-turn goes the way with the longest open run, not at the nearest edge.
  // Heading up into a snake's body at (6,4), near the left edge: left has 6 cells of run, right 17.
  const g = board([[[[6, 5], [6, 6], [6, 7], [6, 8], [6, 9]], 'up'], [Array.from({ length: 9 }, (_, i) => [2 + i, 4]), 'right']]);
  const me = g.snakes[0];
  g.snakes[1].stunUntil = 1e9; // (the body stays put)
  E.step(g);
  for (let t = 0; t < T.STUN_TICKS + 1; t++) { feed(g); E.step(g); }
  check('the auto-turn after a crash goes the way with room to run, not at the edge', me.alive && me.body[0].x === 7 && me.body[0].y === 5, JSON.stringify(me.body[0]));
}

{ // A crash clears your queued turns; a power you press while stunned goes when the stun's over; a press that can't leap says so.
  const A = [[23, 5], [22, 5], [21, 5], [20, 5], [19, 5], [18, 5], [17, 5], [16, 5]];
  const g = board([[A, 'right'], [Array.from({ length: 7 }, (_, i) => [23, 6 + i]), 'down']]);
  g.snakes[1].stunUntil = 1e9; // (a body below that stays put)
  const me = g.snakes[0];
  me.queue = [D.down, D.left]; // (down: into the body below)
  E.step(g);
  check('a crash clears the turns pressed before it', me.alive && me.queue.length === 0 && me.stunUntil > g.tick);
  const g2 = board([[line(6, 10, 8), 'right'], wall(7, 6, 12)]); // (a body right in front)
  const m2 = g2.snakes[0];
  m2.stunUntil = g2.tick + 3; // (stunned for 3 more ticks)
  E.leap(g2, m2); // (pressed at the start of the stun)
  for (let t = 0; t < 4; t++) { feed(g2); quiet(g2); }
  check('...a power pressed early in a stun still goes when it ends', !!m2.flight || m2.body[0].x === 8, JSON.stringify(m2.body[0]));
  const g3 = board([[line(6, 10, 8), 'right'], wall(7, 6, 12)]);
  const m3 = g3.snakes[0];
  m3.leapReadyAt = g3.time + 3000; // (resting)
  E.leap(g3, m3); quiet(g3);
  check('...a press that can\'t leap says why', g3.events.some(e => e.type === 'fizzle' && e.why === 'resting'), JSON.stringify(g3.events.map(e => e.type)));
}

{ // Why a crash was the end, for the card: at its smallest.
  const g = board([[line(23, 5, 3), 'right'], [line(5, 20, 3), 'right']]);
  check('a crash at its smallest is "tiny"', E.step(g).includes(g.snakes[0]) && g.snakes[0].fatal === 'tiny', g.snakes[0].fatal);
}

{ // Of two that meet head-on, both boxed in, the shorter is out "because it was shorter", whichever seat either sits in.
  const A = [[5, 5], [4, 5], [4, 6], [5, 6], [6, 6], [6, 7], [5, 7], [4, 7], [3, 7], [3, 6], [3, 5], [3, 4], [4, 4], [5, 4], [5, 3], [5, 2], [5, 1], [5, 0]];
  const B = [[7, 5], [8, 5], [8, 4], [7, 4], [7, 3], [8, 3], [9, 3], [9, 4], [9, 5], [9, 6], [8, 6], [7, 6], [7, 7], [8, 7], [9, 7], [9, 8], [9, 9], [9, 10]];
  const g1 = board([[A, 'right'], [B.slice(0, 16), 'left']]), out1 = E.step(g1);
  const g2 = board([[B.slice(0, 16), 'left'], [A, 'right']]), out2 = E.step(g2);
  check('a lost head-on is "shorter" with the longer snake in the first seat', out1.length === 1 && out1[0] === g1.snakes[1] && out1[0].fatal === 'shorter', out1.map(s => s.fatal).join());
  check('...and in the second', out2.length === 1 && out2[0] === g2.snakes[0] && out2[0].fatal === 'shorter', out2.map(s => s.fatal).join());
}

{ // A leap asked for in a stun that can't go (too small, resting, or at the edge) says so, and the auto-turn still takes you clear.
  for (const [what, setup] of [['resting', s => { s.leapReadyAt = 1e9; }], ['at the edge', () => {}]]) {
    const g = board([[line(23, 5, 8), 'right'], [line(5, 20, 3), 'right']]);
    const me = g.snakes[0];
    setup(me);
    E.step(g); // (into the edge: a crash, a stun)
    E.leap(g, me); // (pressed ahead while the stars go round)
    let fizzled = false;
    for (let i = 0; i < T.STUN_TICKS + 2; i++) { feed(g); quiet(g); if (g.events.some(e => e.type === 'fizzle' && e.snake === me)) fizzled = true; }
    check(`a leap asked for in a stun that can't go (${what}) doesn't send you back into the edge`, me.alive && me.body[0].x < 23 || me.body[0].y !== 5, JSON.stringify(me.body[0]));
    check(`...and says why (${what})`, fizzled);
  }
}

{ // A leap asked for in a stun lands on a tail that leaves the tick the stun ends (it's free by then), and isn't refused.
  const g = board([[line(10, 10, 8), 'right'], [[[11, 6], [11, 7], [11, 8], [11, 9], [11, 10], [11, 11], [11, 12]], 'up'], [[[12, 7], [12, 8], [12, 9], [12, 10]], 'up']]);
  const [me, wall, tail] = g.snakes;
  wall.stunUntil = 1e9; // (the body in front stays put)
  tail.stunUntil = 1e9;
  me.leapReadyAt = 0;
  E.step(g); // (into the body: a crash, a stun)
  tail.stunUntil = me.stunUntil; // (still till the very tick the stun ends, then on its way: its tail leaves (12,10) then)
  E.leap(g, me);
  let fizzled = false;
  for (let i = 0; i < T.STUN_TICKS + 1 && !me.flight; i++) { feed(g); quiet(g); if (g.events.some(e => e.type === 'fizzle' && e.snake === me)) fizzled = true; }
  check('a leap asked for in a stun may land on a tail leaving that tick', !fizzled && (!!me.flight || me.body[0].x === 12), JSON.stringify(me.body[0]));
}

{ // A leap asked for in a stun whose landing another head moves into that very tick: it can't go, and the auto-turn still takes it clear.
  const g = board([[[[5, 10], [4, 10], [3, 10], [2, 10], [1, 10], [0, 10], [0, 11], [0, 12], [0, 13]], 'right'], [Array.from({ length: 6 }, (_, i) => [6, 6 + i]), 'up'], [[[7, 16], [7, 17], [7, 18], [7, 19]], 'up']]);
  const [me, wall, runner] = g.snakes;
  wall.stunUntil = 1e9; // (one thick, across column 6; the runner comes up column 7 into the landing, (7,10), the tick the stun ends)
  let crashes = 0, fizzled = false;
  for (let t = 0; t < 2 + T.STUN_TICKS + 2; t++) {
    if (t === 1) E.leap(g, me);
    runner.queue = [D.up];
    feed(g); quiet(g);
    crashes += g.events.filter(e => e.type === 'crash' && e.snake === me).length;
    if (g.events.some(e => e.type === 'fizzle' && e.snake === me)) fizzled = true;
  }
  check('a leap asked for in a stun whose landing is taken as it goes: the auto-turn takes it clear', me.alive && crashes === 1 && me.body.length === 6 && me.body[0].x === 5 && me.body[0].y !== 10, `${crashes} crashes, ${JSON.stringify(me.body[0])}`);
  check('...and it says why', fizzled);
}

{ // A flash asked for in a stun that can't get anywhere (into the edge or body it hit; golden, into the edge or a hole) says so, and the auto-turn takes it clear: it isn't sent back in, nor blown up.
  const atEdge = () => board([[line(23, 5, 8), 'right'], [line(5, 20, 3), 'right']]);
  const atBody = () => { const g = board([[line(6, 10, 8), 'right'], wall(7, 6, 12)]); g.snakes[1].stunUntil = 1e9; return g; };
  const atHole = () => { const g = board([[line(6, 10, 8), 'right'], [line(5, 20, 3), 'right']]); g.holes.add(K(7, 10)); return g; };
  for (const [what, make, dashes] of [['plain, at the edge', atEdge, 0], ['plain, at a body', atBody, 0], ['golden, at the edge', atEdge, 2], ['golden, at a hole', atHole, 2]]) {
    const g = make(), me = g.snakes[0];
    me.dashes = dashes;
    feed(g); quiet(g); // (a crash, a stun)
    const head = { ...me.body[0] }, len = me.body.length;
    E.flash(g, me); // (pressed, or swiped the way it faces, while the stars go round)
    let fizzled = false, crashes = 0;
    for (let i = 0; i < T.STUN_TICKS + 2; i++) {
      feed(g); quiet(g);
      if (g.events.some(e => e.type === 'fizzle' && e.snake === me && e.flash && e.why === 'landing')) fizzled = true;
      crashes += g.events.filter(e => e.type === 'crash' && e.snake === me).length;
    }
    check(`a flash asked for in a stun that can't get anywhere (${what}) doesn't send you back in`, me.alive && crashes === 0 && me.body.length === len && (me.body[0].x !== head.x || me.body[0].y !== head.y) && me.dashes === dashes, `${me.cause || ''} ${crashes} crashes, ${JSON.stringify(me.body[0])}`);
    check(`...and says why (${what})`, fizzled);
  }
  const g = atBody(), [me, o] = g.snakes; // (golden, at a body one thick: that's a cut, and it goes)
  feed(g); quiet(g);
  me.dashes = 1;
  E.flash(g, me);
  for (let i = 0; i < T.STUN_TICKS + 1; i++) { feed(g); quiet(g); }
  check('...but a golden one at a body one thick goes: it cuts it', me.alive && me.dashes === 0 && o.body.length === 4 && me.body[0].x === 9, JSON.stringify(me.body[0]));
}

{ // A jump and a flash asked for together in a stun, where only the jump could go and its landing's taken as it goes: the flash
  // doesn't go instead (back into what it hit, or blown up in it); it says why, and the auto-turn takes it clear.
  for (const [what, hole, dashes] of [['at a hole, holding golden flashes', true, 1], ['at a hole', true, 0], ['at a body', false, 0]]) {
    const g = board([[[[5, 10], [4, 10], [3, 10], [2, 10], [1, 10], [0, 10], [0, 11], [0, 12], [0, 13]], 'right'], hole ? [line(20, 2, 4), 'right'] : [Array.from({ length: 6 }, (_, i) => [6, 6 + i]), 'up'], [[[7, 16], [7, 17], [7, 18], [7, 19]], 'up']]);
    const [me, other, runner] = g.snakes;
    other.stunUntil = 1e9; // (the runner comes up column 7 into the landing, (7,10), the tick the stun ends)
    if (hole) g.holes.add(K(6, 10));
    me.dashes = dashes;
    let crashes = 0, said = 0;
    for (let t = 0; t < 2 + T.STUN_TICKS + 2 && me.alive; t++) {
      if (t === 1) { E.leap(g, me); E.flash(g, me); }
      runner.queue = [D.up];
      feed(g); quiet(g);
      crashes += g.events.filter(e => e.type === 'crash' && e.snake === me).length;
      said += g.events.filter(e => e.type === 'fizzle' && e.snake === me && e.flash && e.why === 'landing').length;
    }
    check(`a jump and a flash asked for in a stun, the jump's landing taken (${what}): no flash back in, and the auto-turn takes it clear`, me.alive && crashes === 1 && me.body.length === 6 && me.dashes === dashes && me.body[0].x === 5 && me.body[0].y !== 10, `${me.cause || ''} ${crashes} crashes, ${JSON.stringify(me.body[0])}`);
    check(`...and the flash says why (${what})`, said === 1, said);
  }
  // Over a head-on in an empty cell that's shut to it (the other's longer), facing it: nothing there to hop, and no flash through it.
  const g = board([[line(5, 10, 8), 'right'], [Array.from({ length: 10 }, (_, i) => [6, 11 + i]), 'up']]);
  const [a, b] = g.snakes;
  let bumps = 0, said = 0;
  for (let t = 0; t < 8 && a.alive && b.alive; t++) {
    if (t === 2) { E.leap(g, a); E.flash(g, a); }
    feed(g); quiet(g);
    bumps += g.events.filter(e => e.type === 'crash').length;
    said += g.events.filter(e => e.type === 'fizzle' && e.snake === a && e.flash).length;
  }
  check('a jump and a flash asked for in a stun, facing the cell shut to it after a head-on: no flash through it, and it turns away', a.alive && b.alive && bumps === 2 && said === 1 && b.body.length === 7 && a.body.length === 5, `${bumps} crashes, ${said} said, ${a.body.length} / ${b.body.length}`);
}

// ---------------------------------------------------------------- jump and flash together
{ // A jump and a flash pressed together with something right in front: it hops it (no flash gets past that, and none blows up in a hole), then flashes once it's down.
  for (const [what, gold] of [['a body', false], ['a hole, holding golden flashes', true]]) {
    const g = board([[line(5, 10, 6), 'right'], gold ? [line(5, 20, 3), 'right'] : wall(6)]);
    const me = g.snakes[0];
    if (gold) { g.holes.add(K(6, 10)); me.dashes = 1; }
    E.leap(g, me); E.flash(g, me);
    quiet(g);
    check(`a jump and a flash pressed together at ${what}: it hops`, me.alive && !!me.flight && g.events.some(e => e.type === 'leap' && e.snake === me) && !g.events.some(e => e.snake === me && (e.type === 'dash' || e.type === 'crash')), JSON.stringify(g.events.map(e => e.type)));
    feed(g); quiet(g); // (down on the far side)
    const early = g.events.some(e => e.type === 'dash' && e.snake === me);
    feed(g); quiet(g);
    check(`...and flashes once it's down (${what})`, me.alive && !early && g.events.some(e => e.type === 'dash' && e.snake === me) && me.body[0].x === 7 + (gold ? T.DASH_LENGTH : T.FLASH_LENGTH), JSON.stringify(me.body[0]));
  }
  for (const gold of [false, true]) { // (Space a moment early, then E as the hole comes up)
    const g = board([[line(5, 10, 6), 'right'], [line(5, 20, 3), 'right']]);
    const me = g.snakes[0];
    g.holes.add(K(7, 10));
    me.dashes = gold ? 1 : 0;
    E.leap(g, me); quiet(g); // (open ground: the jump waits)
    E.flash(g, me); quiet(g); // (the hole's right in front)
    check(`a jump pressed early, then a flash as a hole comes up${gold ? ' (golden)' : ''}: it hops`, me.alive && g.events.some(e => e.type === 'leap' && e.snake === me) && !g.events.some(e => e.type === 'dash'), me.cause);
  }
  // Further on: a flash that would only get as far as what the jump's for (running into it, or blowing up in it)
  // waits, the snake crawls up to it and hops it, then flashes. Pressed together, never worse than the jump alone.
  for (const [what, dist, gold, hole] of [['a hole two ahead', 2, false, true], ['a hole two ahead, holding golden flashes', 2, true, true], ['a hole three ahead, holding golden flashes', 3, true, true], ['a body two ahead', 2, false, false], ['a body two ahead, holding golden flashes', 2, true, false]]) {
    const g = board([[line(5, 10, 6), 'right'], hole ? [line(5, 20, 3), 'right'] : wall(5 + dist)]);
    const me = g.snakes[0];
    if (hole) g.holes.add(K(5 + dist, 10)); else g.snakes[1].stunUntil = 1e9;
    me.dashes = gold ? 1 : 0;
    E.leap(g, me); E.flash(g, me);
    const seen = [];
    for (let t = 0; t < dist + 3 && me.alive; t++) { feed(g); quiet(g); for (const e of g.events) if (e.snake === me && ['leap', 'dash', 'crash', 'fizzle'].includes(e.type)) seen.push(`${e.type}@${g.tick - 1}`); }
    const want = gold && !hole ? 'dash@0' : `leap@${dist - 1},dash@${dist + 1}`; // (a golden flash cuts a body one thick: it goes at once)
    check(`a jump and a flash pressed together with ${what}: ${gold && !hole ? 'the flash cuts it' : 'it crawls up, hops, then flashes'}`, me.alive && seen.join() === want && me.dashes === 0, `${seen.join()} ${me.cause || ''}`);
  }
}

{ // A flash pressed in the air isn't lost: it goes once the snake's down.
  const g = board([[line(5, 10, 6), 'right'], wall(6)]);
  const me = g.snakes[0];
  E.leap(g, me); quiet(g); // (up)
  E.flash(g, me); feed(g); quiet(g); // (pressed in the air; down on the far side)
  const early = g.events.some(e => e.type === 'dash');
  feed(g); quiet(g);
  check('a flash pressed in the air goes once it\'s down', !early && g.events.some(e => e.type === 'dash' && e.snake === me && e.plain) && me.body[0].x === 7 + T.FLASH_LENGTH && E.flashIn(g, me) > 0, JSON.stringify(me.body[0]));
}

{ // A flash waiting on a jump isn't lost when the jump doesn't land cleanly: it goes when the snake moves again, as one pressed in a stun does.
  // Pressed in the air, and the landing's taken (it comes down on what it hopped, stunned).
  const g = board([[line(5, 10, 8), 'right'], wall(6, 7, 7), [[[7, 12], [7, 13], [7, 14], [7, 15]], 'up']]);
  const [me, w, r] = g.snakes;
  w.stunUntil = 1e9; // (r comes up column 7 into the landing, (7,10), as me comes down)
  E.leap(g, me);
  const seen = [];
  for (let t = 0; t < 3 + T.STUN_TICKS && me.alive; t++) {
    if (t === 1) E.flash(g, me);
    if (t === 2) r.stunUntil = 1e9;
    feed(g); quiet(g);
    for (const e of g.events) if (e.snake === me && ['leap', 'dash', 'crash', 'fizzle'].includes(e.type)) seen.push(`${e.type}@${g.tick - 1}`);
  }
  check('a flash pressed in the air, the landing taken: it goes when the stun\'s over', me.alive && seen.join() === `leap@0,crash@1,dash@${2 + T.STUN_TICKS}`, seen.join());
  // Pressed with a jump that was to go first, but another's flash takes its landing as it goes (jumps go after flashes):
  // it crawls into what it meant to hop, and its golden flash goes when the stun's over (it cuts through).
  const g2 = board([[line(5, 10, 8), 'right'], wall(6, 7, 7), [[[7, 12], [7, 13], [7, 14], [7, 15], [7, 16]], 'up']]);
  const [a, w2, f] = g2.snakes;
  w2.stunUntil = 1e9;
  a.dashes = 1;
  E.leap(g2, a); E.flash(g2, a); E.flash(g2, f); // (f flashes up column 7, through (7,10))
  const seen2 = [];
  for (let t = 0; t < 2 + T.STUN_TICKS && a.alive; t++) {
    feed(g2); quiet(g2);
    for (const e of g2.events) if ((e.snake === a || e.by === a.id) && ['leap', 'dash', 'crash', 'fizzle', 'cut'].includes(e.type)) seen2.push(`${e.type}@${g2.tick - 1}`);
  }
  check('a jump and a flash pressed together, the jump\'s landing taken as it goes: the flash goes when the stun\'s over', a.alive && seen2.join() === `fizzle@0,crash@0,dash@${1 + T.STUN_TICKS},cut@${1 + T.STUN_TICKS}` && a.dashes === 0, seen2.join());
}

{ // Two flashes through one cell in one tick meet there head-on, whichever seat either sits in; golden ones too.
  const A = [line(5, 10, 6), 'right'], B = [[[6, 11], [6, 12], [6, 13], [6, 14], [6, 15], [6, 16]], 'up'];
  for (const gold of [false, true]) {
    const outcome = [[A, B], [B, A]].map(order => {
      const g = board(order);
      for (const s of g.snakes) { s.dashes = gold ? 1 : 0; E.flash(g, s); }
      quiet(g);
      const of = s => `${s.alive ? 'alive' : 'out'} ${s.body.length} at ${s.body[0].x},${s.body[0].y}${g.events.some(e => e.type === 'crash' && e.snake === s && e.cause.startsWith('crashed head-on')) ? ', head-on' : ''}`;
      const [a, b] = order[0] === A ? g.snakes : [g.snakes[1], g.snakes[0]];
      return `A ${of(a)}; B ${of(b)}`;
    });
    check(`two ${gold ? 'golden ' : ''}flashes through one cell meet head-on, whatever their seats`, outcome[0] === outcome[1] && (outcome[0].match(/head-on/g) || []).length === 2, outcome.join(' / '));
  }
  // Head-on along one line, they meet wherever their ways cross, whatever the gap (even or odd), plain or golden, whatever their seats.
  const wrong = [];
  for (let gap = 0; gap <= 6; gap++) for (const [ga, gb] of [[0, 0], [1, 1], [0, 1], [1, 0]]) {
    const ra = Math.min(gap, ga ? T.DASH_LENGTH : T.FLASH_LENGTH), rb = Math.min(gap, gb ? T.DASH_LENGTH : T.FLASH_LENGTH);
    const meet = gap === 0 || ra + rb > gap; // (their ways share a cell; at no gap, each runs into the other's head)
    const outcome = [0, 1].map(order => {
      const A = [line(5, 10, 6), 'right'], B = [line(6 + gap, 10, 6, 1), 'left'];
      const g = board(order ? [B, A] : [A, B]);
      const [a, b] = order ? [g.snakes[1], g.snakes[0]] : g.snakes;
      a.dashes = ga; b.dashes = gb;
      E.flash(g, a); E.flash(g, b);
      quiet(g);
      const headOn = s => g.events.some(e => e.type === 'crash' && e.snake === s && e.cause.startsWith('crashed head-on'));
      return `${headOn(a) ? 'head-on' : 'no'}/${headOn(b) ? 'head-on' : 'no'} at ${a.body[0].x}/${b.body[0].x}`;
    });
    if (outcome[0] !== outcome[1] || !outcome[0].startsWith(meet ? 'head-on/head-on' : 'no/no')) wrong.push(`gap ${gap} ${ga ? 'golden' : 'plain'}/${gb ? 'golden' : 'plain'}: ${outcome.join(' | ')}`);
  }
  check('two flashes head-on along a line meet wherever their ways cross (any gap, plain or golden, either seat)', !wrong.length, wrong.join('; '));
}

{ // A jump whose landing is taken comes down on what it hopped. A body lying across a hole holds it up, till that body moves on: then it falls in.
  for (const [n, what] of [[5, 'moving on at once'], [8, 'moving on in its stun'], [13, 'there till its stun is over']]) {
    const g = board([[line(5, 10, 6), 'right'], [Array.from({ length: n }, (_, i) => [6, 7 + i]), 'up'], [[[7, 12], [7, 13], [7, 14], [7, 15]], 'up']]);
    const [me, r, q] = g.snakes; // (q comes up column 7 into the landing, (7,10), as me comes down)
    g.holes.add(K(6, 10));
    E.leap(g, me);
    let left = -1, off = -1;
    for (let t = 0; t < 12 && me.alive; t++) {
      const tick = g.tick;
      feed(g); quiet(g);
      if (t === 1) q.stunUntil = 1e9; // (after the head-on, q stays put)
      if (left < 0 && t > 0 && !r.body.some(c => c.x === 6 && c.y === 10)) left = tick;
      if (off < 0 && t > 0 && me.alive && (me.body[0].x !== 6 || me.body[0].y !== 10)) off = tick;
    }
    const fell = !me.alive && me.cause === 'fell into a woodpecker hole';
    check(`a jump that comes down on a body bridging a hole (${what}) falls in when it's gone, not before`, n === 13 ? me.alive && off > 0 : fell && me.diedAt === left, `${me.alive ? 'alive' : me.cause} died ${me.diedAt}, bridge gone ${left}, off ${off}`);
  }
  // The bridge's snake crashes as it comes down: the tail it loses is no bridge (in it goes, no crash first), the rest still is.
  for (const [n, lost] of [[11, true], [15, false]]) {
    const g = board([[line(5, 10, 6), 'right'], [Array.from({ length: n }, (_, i) => [6, 1 + i]), 'up'], [[[7, 12], [7, 13], [7, 14], [7, 15]], 'up']]);
    const [me] = g.snakes; // (the bridge heads up into the top edge, and crashes there as me comes down; (6,10) is its tail end then, or well inside it)
    g.holes.add(K(6, 10));
    E.leap(g, me);
    feed(g); quiet(g); feed(g); quiet(g);
    const crashed = g.events.some(e => e.type === 'crash' && e.snake === me);
    check(`a jump coming down on a bridge whose snake crashes as it lands: ${lost ? 'the bridge is in the tail it loses, so in it goes, with no crash first' : 'the bridge is in what it keeps, so it holds'}`, lost ? !me.alive && me.cause === 'fell into a woodpecker hole' && !crashed : me.alive && crashed, `${me.alive ? 'alive' : me.cause}, crashed ${crashed}`);
  }
}

{ // Boxed in only if there'll be nowhere to turn when the stun's over: a rival's tail moving on in time counts as room.
  // A hits the right edge at (23,5): below is its own body, above a rival's body that's leaving.
  const A = [[23, 5], [22, 5], [22, 6], [23, 6], [23, 7], [23, 8], [23, 9], [23, 10], [23, 11]];
  const near = [[19, 4], [20, 4], [21, 4], [22, 4], [23, 4], [23, 3], [23, 2]];                      // (23,4) is left in 3 ticks
  const just = [[19, 4], [20, 4], [21, 4], [22, 4], [23, 4], [23, 3], [23, 2], [23, 1], [23, 0], [22, 0]]; // ...in 6: the tick A moves again
  const late = [...just, [21, 0]];                                                                       // ...in 7: too late
  const g = board([[A, 'right'], [near, 'left']]);
  check('a rival\'s tail moving on before the stun ends counts as room', !E.step(g).includes(g.snakes[0]) && g.snakes[0].alive);
  const g1 = board([[A, 'right'], [just, 'left']]);
  check('...even on the very tick it moves again', !E.step(g1).includes(g1.snakes[0]));
  const g2 = board([[A, 'right'], [late, 'left']]);
  check('...one that won\'t, doesn\'t', E.step(g2).includes(g2.snakes[0]));
  // Its own tail breaking off can open the way too: coiled so the cell above is its own tail end.
  const coiled = [[23, 5], [22, 5], [22, 6], [23, 6], [23, 7], [22, 7], [21, 7], [21, 6], [21, 5], [21, 4], [22, 4], [23, 4]];
  const g3 = board([[coiled, 'right'], [[[5, 20], [4, 20], [3, 20]], 'right']]);
  check('...and so does its own tail breaking off', !E.step(g3).includes(g3.snakes[0]));
  // The cell it ran into counts too, if that tail's gone by then (heading up into (23,4): a hole to its left, the edge to its right).
  const up = [[23, 5], [23, 6], [23, 7], [23, 8], [23, 9], [23, 10], [23, 11]];
  const g4 = board([[up, 'up'], [near, 'left']]);
  g4.holes.add(K(22, 5));
  check('...and so does the tail it ran into', !E.step(g4).includes(g4.snakes[0]), g4.snakes[0].cause);
  // A rival that crashes this tick too: the tail that breaks off it is room at once (it's food).
  const R = [[19, 3], [20, 3], [21, 3], [22, 3], [23, 3], [23, 4], [22, 4]]; // ((23,4) is its sixth cell; a hole ahead of it)
  const g5 = board([[A, 'right'], [R, 'left']]);
  g5.holes.add(K(18, 3));
  check('...and so does a rival\'s tail breaking off in a crash', !E.step(g5).includes(g5.snakes[0]), g5.snakes[0].cause);
  const g6 = board([[A, 'right'], [R, 'left']]);
  g6.snakes[1].stunUntil = 50; // (stunned, not crashing: its tail stays)
  check('...not a stunned one\'s', E.step(g6).includes(g6.snakes[0]));
}

{ // Winter is the lean season: one apple, rotting twice as fast, and no golden apples.
  const g = board([[line(5, 5, 4), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']]);
  g.weather = { kind: 'snow', since: 0, until: 1e9, nextGust: 0, nextStrike: 0 };
  g.food = [];
  let golden = 0;
  for (let t = 0; t < 400; t++) { feed(g); for (const o of g.snakes) o.queue = [t % 8 < 4 ? D.down : D.up]; E.step(g); golden += g.food.filter(f => f.kind === 'golden').length; if (t === 2) break; }
  const apple = g.food.find(f => f.kind === 'food');
  check('winter: one apple', g.food.filter(f => f.kind === 'food').length === T.SNOW_APPLES && T.SNOW_APPLES === 1);
  const left = apple.expires - g.tick;
  feed(g); E.step(g);
  check('...rotting twice as fast', apple.expires - g.tick === left - 2, `${left} then ${apple.expires - g.tick}`);
  // (Nobody moves, for a long while, the clock held back so sudden death never comes: in clear weather golden apples come; in winter, none.)
  const goldens = kind => {
    const g2 = board([[line(5, 5, 4), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']]);
    for (const o of g2.snakes) o.stunUntil = 1e9;
    let n = 0;
    for (let t = 0; t < 3000; t++) { g2.time = 0; g2.weather = { kind, since: 0, until: 1e12, nextGust: 1e12, nextStrike: 1e12 }; feed(g2); E.step(g2); n += g2.events.filter(e => e.type === 'spawn' && e.kind === 'golden').length; g2.food = g2.food.filter(f => f.kind !== 'golden'); }
    return n;
  };
  golden = goldens('snow');
  const clear = goldens('clear');
  check('...and no golden apples', golden === 0 && clear > 3, `${golden} in winter, ${clear} in clear weather`);
}

{ // Steering while stunned: it goes your way when the stun's over.
  const g = board([[line(23, 5, 8), 'right'], [line(5, 20, 3), 'right']]);
  const s = g.snakes[0];
  E.step(g);
  s.queue = [D.up];
  for (let t = 0; t <= T.STUN_TICKS; t++) { feed(g); E.step(g); }
  check('a stunned snake can steer for when it moves again', s.dir === D.up && s.body[0].y === 4, JSON.stringify(s.body[0]));
}

{ // At its smallest, a crash is the end; and so is a crash with nowhere to turn.
  const g = board([[line(23, 5, 3), 'right'], [line(5, 20, 3), 'right']]);
  check('a crash at the smallest size is the end', E.step(g).includes(g.snakes[0]));
  // In the top-right corner, facing the edge, its own body wrapped round it: nowhere to go.
  const g2 = board([[[[23, 0], [22, 0], [22, 1], [23, 1], [23, 2], [22, 2], [21, 2], [21, 1], [21, 0]], 'up'], [line(5, 20, 3), 'right']]);
  const dying = E.step(g2);
  check('a crash with nowhere to turn is the end', dying.includes(g2.snakes[0]) && g2.snakes[0].killer === 'wall', g2.snakes[0].cause);
}

{ // Into a long rival's body: the one who ran into it pays; the rival's fine.
  const g = board([[line(5, 6, 6), 'right'], [[[6, 9], [6, 8], [6, 7], [6, 6], [6, 5], [6, 4]], 'down']]);
  E.step(g);
  const [a, b] = g.snakes;
  check('running into a body costs you, not them', a.alive && a.body.length === 3 && b.alive && b.body.length === 6 && b.body[0].y === 10, `${a.body.length} / ${b.body.length}`);
}

{ // A crashed snake's tail doesn't move, so a head heading for it crashes too.
  // P0 hits the edge going right along row 5; P1 comes down column 18 into P0's tail cell (18, 5).
  const g = board([[line(23, 5, 6), 'right'], [[[18, 4], [18, 3], [18, 2]], 'down']]);
  const dying = E.step(g);
  const p1 = g.snakes[1];
  check("a crashed snake's tail stays put, and is in the way", dying.includes(p1) && p1.cause === 'ran into P0', p1.cause);
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

{ // The woodpecker aims clear of heads (while there's room), under bodies too, and warns before it strikes; food in the mark is knocked aside.
  // (Eight seeded rounds, with the same rivals and boards every run, and no
  // rests: it takes aim again the moment it has struck, so they bring about
  // 160 aims and 155 strikes. With its rests, six rounds brought 85, and
  // caught a clearance kept for all but one cell in 13 only two or three
  // times in some of them, as a change to the engine re-rolls them all. This
  // way any such rounds catch it, about a dozen times. Its rests are checked
  // above. A crumb it takes, cut off by the patch and old holes, may be
  // nearer a head: nobody can step into one without crossing the mark.)
  let near = 0, early = 0, underFood = 0, knocked = 0, badKnocks = 0, strikes = 0, cells = 0, aims = 0, underBodies = 0, besideHoles = 0, under = 0, cuts = 0;
  for (let r = 0; r < 8; r++) seededWhile(101 + r, () => {
    const g = E.createGame({ withPlayer: false });
    g.time = T.SUDDEN_DEATH_MS;
    for (const s of g.snakes) { s.lastAte = g.time; s.nextStarve = g.time + T.HUNGER_MS; s.grow = 30; } // (fed, so they last, and long, as by 2:00)
    let aimedAt = -1;
    for (let t = 0; t < 500 && g.snakes.filter(s => s.alive).length > 1; t++) {
      const w = g.woodpecker;
      if (w && !w.target.length) w.restUntil = Math.min(w.restUntil, g.tick + 1); // (no rest: it aims this tick)
      const foodCells = new Set(g.food.map(f => f.y * T.GRID + f.x)), holes = new Set(g.holes);
      E.step(g);
      const heads = g.snakes.filter(s => s.alive).map(s => s.body[0]); // (as they were when it took aim)
      const bodies = new Set(g.snakes.filter(s => s.alive).flatMap(s => s.body.map(c => c.y * T.GRID + c.x)));
      for (const e of g.events) {
        if (e.type === 'aim') {
          aimedAt = g.tick;
          aims++;
          const mark = new Set(g.woodpecker.target);
          const open = k => [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => { const x = k % T.GRID + dx, y = Math.floor(k / T.GRID) + dy; return x >= 0 && y >= 0 && x < T.GRID && y < T.GRID && !mark.has(K(x, y)) && !holes.has(K(x, y)); });
          for (const k of g.woodpecker.target) {
            if (open(k) && heads.some(h => Math.abs(h.x - k % T.GRID) + Math.abs(h.y - Math.floor(k / T.GRID)) <= T.PECK_CLEARANCE)) near++;
            if (foodCells.has(k)) underFood++;
          }
          if (g.woodpecker.target.some(k => bodies.has(k))) underBodies++;
          if (g.woodpecker.target.some(k => [-1, 1, -T.GRID, T.GRID].some(d => holes.has(k + d)))) besideHoles++;
        }
        if (e.type === 'peck') {
          strikes++;
          cells += e.cells.length;
          under += e.under.length;
          if (g.tick - aimedAt < T.PECK_AIM_TICKS) early++;
          // (what was in the patch: knocked to a free cell outside it, there now (or rotted away there this very tick), or eaten)
          const zone = new Set(e.cells);
          for (const n of g.events) if (n.type === 'knock') {
            knocked++;
            if (n.tx == null) continue;
            if (zone.has(K(n.tx, n.ty)) || g.holes.has(K(n.tx, n.ty)) || !zone.has(K(n.x, n.y)) || !g.food.some(f => f.x === n.tx && f.y === n.ty && f.kind === n.kind) && !g.events.some(o => o.type === 'rot' && o.x === n.tx && o.y === n.ty)) badKnocks++;
          }
        }
        if (e.type === 'cut') cuts++;
      }
    }
  });
  check('the woodpecker strikes in patches', strikes > 20 && cells / strikes > T.PECK_CHUNK / 2, `${strikes} strikes, ${(cells / Math.max(1, strikes)).toFixed(1)} cells each`);
  check('the woodpecker aims well away from heads', near === 0, `${near} cells too close`);
  check('the woodpecker gives warning', early === 0, `${early} without`);
  check('the woodpecker\'s patches cover food now, and knock it out of the way', underFood > 10 && knocked >= underFood / 2 && badKnocks === 0, `${underFood} food under marks, ${knocked} knocked, ${badKnocks} landed wrong`);
  check('...but under bodies, often', underBodies > aims * T.PECK_UNDER_BODY && under > 0, `${underBodies} of ${aims} aims, ${under} snakes under strikes`);
  check('...widens old hollows', besideHoles > aims * T.PECK_WIDEN, `${besideHoles} of ${aims} aims beside an old hole`);
  check('...and never cuts', cuts === 0, `${cuts} cuts`);
}

{ // A body lying across the patch when it strikes bridges the new hole: no cut, nothing dropped; the hole's there once its tail has passed.
  const g = board([[line(12, 10, 9), 'right'], [line(12, 16, 4), 'right'], [line(5, 20, 3), 'right']]);
  g.time = T.SUDDEN_DEATH_MS;
  feed(g);
  // P0 (head at 12,10, nine long) lies across (8, 10); P1 turns up out of the patch, its neck left in it; P2's head goes into it.
  g.woodpecker = { x: 8, y: 10, at: g.time, target: [K(8, 10), K(8, 9), K(8, 11), K(12, 16), K(12, 17), K(6, 20)], strikeAt: g.tick, last: [], struckAt: -1, restUntil: 0 };
  g.snakes[1].queue = [D.up];
  const dying = E.step(g);
  const [a, b, c] = g.snakes, peck = g.events.find(e => e.type === 'peck');
  check('a body across the struck patch bridges it (no cut)', a.alive && a.body.length === 9 && joined(a.body) && !g.events.some(e => e.type === 'cut'), a.body.length);
  check('...and drops nothing', !g.food.some(f => f.kind === 'pellet' && f.owner === a.id), JSON.stringify(g.food.filter(f => f.kind === 'pellet' && f.owner === a.id)));
  check('...a neck in the patch is fine too', b.alive && b.body.length === 4, b.cause);
  check('...the strike says whose bodies lay under it', peck && peck.under.length === 2 && peck.under.includes(a.id) && peck.under.includes(b.id), JSON.stringify(peck && peck.under));
  check('...but a head on the ground in it is out', dying.includes(c) && c.cause === 'got pecked by the woodpecker' && c.fatal === 'pecked', c.cause);
  for (let t = 0; t < 5; t++) { feed(g); quiet(g); }
  check('...and once its tail has passed, it\'s a hole like any other', a.alive && g.holes.has(K(8, 10)) && !a.body.some(p => p.x === 8 && p.y === 10), JSON.stringify(a.body.slice(-2)));
}

{ // Bodies lying over holes: running into one is running into that snake, a dash cuts it and then blows up in the hole, and an auto-turn never takes a tail over a hole for room.
  const g = board([[line(5, 5, 6), 'right'], [[[6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8]], 'up']]);
  g.holes.add(K(6, 5)); // (under P1's third segment)
  E.step(g);
  const crash = g.events.find(e => e.type === 'crash' && e.snake === g.snakes[0]);
  check('running into a body that lies over a hole is running into that snake', crash && crash.cause === 'ran into P1' && crash.killerId === g.snakes[1].id, crash && crash.cause);
  const g2 = board([[line(5, 10, 5), 'right'], [[[7, 6], [7, 7], [7, 8], [7, 9], [7, 10], [7, 11], [7, 12], [7, 13]], 'up']]);
  g2.holes.add(K(7, 10)); // (under P1's fifth segment)
  g2.snakes[0].dashes = 1;
  E.flash(g2, g2.snakes[0]);
  const dying = quiet(g2);
  check('a dash cuts a body lying over a hole...', g2.snakes[1].alive && g2.snakes[1].body.length === 4 && g2.events.some(e => e.type === 'cut' && e.by === g2.snakes[0].id), g2.snakes[1].body.length);
  check('...and then blows up in the hole', dying.includes(g2.snakes[0]) && g2.snakes[0].cause === 'flashed into a woodpecker hole and blew up', g2.snakes[0].cause);
  // A's stun ends facing the edge: up is P1's tail end, leaving this tick but lying over a hole; down's a dead end, but open.
  const g3 = board([[[[23, 5], [22, 5], [21, 5], [20, 5], [19, 5], [18, 5]], 'right'], [[[20, 1], [21, 1], [22, 1], [23, 1], [23, 2], [23, 3], [23, 4]], 'left']]);
  for (const k of [K(23, 4), K(22, 6), K(23, 7)]) g3.holes.add(k);
  g3.snakes[0].stunUntil = g3.tick; g3.snakes[0].bounce = null;
  g3.snakes[1].queue = [D.left];
  feed(g3); quiet(g3);
  check('after a stun, it never turns into a hole under a leaving tail', g3.snakes[0].alive && g3.snakes[0].dir === D.down && g3.snakes[0].body[0].y === 6, JSON.stringify(g3.snakes[0].body[0]));
}

{ // An AI sees a new hole only after its reaction time, like a person.
  const g = E.createGame({ withPlayer: false });
  for (let t = 0; t < 10; t++) E.step(g);
  const k = 12 * T.GRID + 12;
  g.holes.add(k);
  E.step(g);
  const seen = () => { const o = g.snakes.find(s => s.alive); return o ? E.aiView(g, o).holes.has(k) : true; };
  const early = seen();
  for (let t = 0; t < 8; t++) E.step(g);
  check('holes reach the AI with its reaction delay', !early && seen(), `at once: ${early}`);
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

// ---------------------------------------------------------------- fire, weather and burrows


{ // Crawling into fire sets you alight: a segment lost every so often, roasted, until it goes out; smouldering bark doesn't.
  const g = board([[line(9, 5, 10), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']]);
  g.fires.set(K(10, 5), { from: 0, until: 3, group: 1, strike: true });
  g.fires.set(K(6, 15), { from: 5, until: 100, group: 2, strike: false });
  g.fireGroups.set(1, 99); g.fireGroups.set(2, 99); // (no spreading)
  const s = g.snakes[0];
  E.step(g);
  check('a head that crawls into fire catches alight', s.alive && s.burnUntil > g.tick && g.events.some(e => e.type === 'alight' && e.snake === s));
  check('smouldering bark is still safe', g.snakes[1].alive && !(g.snakes[1].burnUntil > g.tick));
  // (round and round a square, away from the fire)
  const loop = 'DDDDLLLLUUUURRRR', way = c => ({ D: D.down, L: D.left, U: D.up, R: D.right })[c];
  let singed = 0, roasted = false;
  for (let t = 0; t < T.BURN_TICKS + 2; t++) { feed(g); g.food = []; for (const o of g.snakes) o.queue = [way(loop[t % 16])]; E.step(g); singed += g.events.filter(e => e.type === 'singe').length; roasted ||= g.food.some(f => f.kind === 'pellet' && f.cooked); }
  check('...it loses segments while it burns', singed === Math.floor(T.BURN_TICKS / T.BURN_EVERY) && s.body.length === 10 - singed, `${singed} singes, ${s.body.length} long`);
  check('...which fall off roasted', roasted);
  check('...and then it goes out', !(s.burnUntil > g.tick));
  // At its smallest, the flames finish it.
  const g2 = board([[line(5, 5, 3), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']]);
  g2.fires.set(K(6, 5), { from: 0, until: 100, group: 1, strike: true });
  const dead = [];
  for (let t = 0; t < T.BURN_EVERY + 1; t++) { feed(g2); g2.food = []; if (t) g2.snakes[0].queue = [D.down]; dead.push(...E.step(g2)); }
  check('...at its smallest, it burns up', dead.includes(g2.snakes[0]) && g2.snakes[0].killer === 'fire', g2.snakes[0].cause);
  // Rain puts a burning snake out sooner.
  const g3 = board([[line(9, 5, 10), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']]);
  g3.fires.set(K(10, 5), { from: 0, until: 100, group: 1, strike: true });
  g3.weather = { kind: 'rain', since: 0, until: 1e9, nextGust: 0, nextStrike: 0 };
  E.step(g3);
  for (let t = 0; t < T.BURN_RAIN_TICKS + 1; t++) { feed(g3); g3.snakes[0].queue = [D.down]; E.step(g3); }
  check('...rain puts it out sooner', !(g3.snakes[0].burnUntil > g3.tick));
}

{ // Food in the fire bakes (worth more), then goes to ash.
  const g = board([[line(5, 5, 3), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']], { food: [[18, 3]] });
  g.fires.set(K(18, 3), { from: 0, until: 999, group: 1, strike: false });
  g.fireGroups.set(1, 99); // (it doesn't spread)
  const apple = g.food.find(f => f.x === 18 && f.y === 3);
  let baked = false, ash = false;
  for (let t = 0; t < T.ASH_TICKS + 2; t++) {
    feed(g);
    for (const o of g.snakes) o.queue = [t % 2 ? D.right : D.down];
    E.step(g);
    if (g.events.some(e => e.type === 'baked' && e.x === 18)) baked = apple.cooked === 1;
    if (g.events.some(e => e.type === 'ash' && e.x === 18)) ash = !g.food.includes(apple);
  }
  check('an apple in the fire bakes', baked);
  check('...and burns to ash if it stays in', ash);
  const g2 = board([[line(5, 5, 3), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']]);
  g2.food = [{ x: 6, y: 5, kind: 'food', cooked: 1 }];
  E.step(g2);
  check('a baked apple is worth two', g2.snakes[0].eaten === T.COOKED_GROWTH, g2.snakes[0].eaten);
}

{ // Apples rot away (and another drops somewhere).
  const g = board([[line(5, 5, 3), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']]);
  g.food = [];
  E.step(g);
  const apples = g.food.filter(f => f.kind === 'food');
  check('apples come with a time to rot', apples.length === T.APPLES && apples.every(f => f.expires > g.tick && f.expires <= g.tick + T.APPLE_TICKS * 1.25 + 1), JSON.stringify(apples.map(f => f.expires)));
  const first = apples[0];
  Object.assign(first, { x: 20, y: 9, expires: g.tick + 1 }); // (well away from both heads: nobody eats it first)
  let rotted = false;
  for (let t = 0; t < 3; t++) { feed(g); for (const o of g.snakes) o.queue = [t % 2 ? D.down : D.right]; E.step(g); rotted ||= g.events.some(e => e.type === 'rot' && e.kind === 'apple' && e.x === first.x && e.y === first.y); }
  check('...rot away', rotted && !g.food.includes(first));
  check('...and another drops', g.food.filter(f => f.kind === 'food').length === T.APPLES);
  // Three all round, late in the round too (in winter, one).
  const g2 = board([[line(5, 5, 3), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']], { time: 100000 });
  g2.food = [];
  E.step(g2);
  check('...three all round', g2.food.filter(f => f.kind === 'food').length === T.APPLES, g2.food.filter(f => f.kind === 'food').length);
}

{ // Beads remember whose they were, and rot (roasted ones later): crash drops, singes, cut tails and corpses alike.
  const life = (f, g, k = 1) => f.expires - g.tick >= Math.floor(T.PELLET_TICKS * k * 0.75) - 1 && f.expires - g.tick <= Math.ceil(T.PELLET_TICKS * k * 1.25) + 1;
  const g = board([[line(23, 5, 8), 'right'], [line(5, 20, 3), 'right']]);
  const [a] = g.snakes;
  quiet(g);
  const crashed = g.food.filter(f => f.kind === 'pellet');
  check('a crash\'s beads are its own, and rot', crashed.length === 3 && crashed.every(f => f.owner === a.id && f.color === a.color && life(f, g)), JSON.stringify(crashed));
  crashed[0].expires = g.tick + 1;
  let rot = null;
  for (let t = 0; t < 3 && !rot; t++) { feed(g); E.step(g); rot = g.events.find(e => e.type === 'rot' && e.kind === 'pellet'); }
  check('...a rotten bead goes, in its own colour', rot && rot.x === crashed[0].x && rot.y === crashed[0].y && rot.color === a.color && !g.food.includes(crashed[0]), JSON.stringify(rot));
  // Roasted bits off a burning snake: its own, and they last PELLET_COOKED times as long.
  const g2 = board([[line(9, 5, 10), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']]);
  g2.fires.set(K(10, 5), { from: 0, until: 3, group: 1, strike: true }); g2.fireGroups.set(1, 99);
  const loop = 'DDDDLLLLUUUURRRR', way = c => ({ D: D.down, L: D.left, U: D.up, R: D.right })[c];
  let roast = null;
  E.step(g2); // (into the fire)
  for (let t = 0; t < T.BURN_TICKS + 2 && !roast; t++) { feed(g2); g2.food = g2.food.filter(f => f.kind === 'pellet'); for (const o of g2.snakes) o.queue = [way(loop[t % 16])]; E.step(g2); roast = g2.food.find(f => f.kind === 'pellet' && f.cooked); }
  check('...roasted bits too, lasting longer', roast && roast.owner === g2.snakes[0].id && life(roast, g2, T.PELLET_COOKED), JSON.stringify(roast));
  // A dash's cut: the tail's beads are the cut snake's.
  const g3 = board([[line(5, 10, 5), 'right'], [Array.from({ length: 13 }, (_, i) => [7, 4 + i]), 'up']]);
  g3.snakes[0].dashes = 1;
  E.flash(g3, g3.snakes[0]); quiet(g3);
  const tail = g3.food.filter(f => f.kind === 'pellet');
  check('...a cut tail\'s beads are the cut snake\'s', tail.length === 6 && tail.every(f => f.owner === g3.snakes[1].id && life(f, g3)), JSON.stringify(tail.map(f => f.owner)));
}

{ // A dead snake leaves a bead on every other segment (at least MIN_LENGTH of them), each its own.
  const corpse = n => {
    const g = board([[line(23, 5, n), 'right'], [line(5, 20, 3), 'right']]);
    const [a] = g.snakes, cells = a.body.map(c => [c.x, c.y]);
    g.holes.add(K(23, 4)); g.holes.add(K(23, 6)); // (facing the edge, a hole either side: out, whatever its length)
    const dying = quiet(g);
    const beads = g.food.filter(f => f.kind === 'pellet' && f.owner === a.id);
    return { out: dying.includes(a), at: cells.map(([x, y], j) => beads.some(f => f.x === x && f.y === y) ? j : -1).filter(j => j >= 0) };
  };
  const nine = corpse(9), three = corpse(3), four = corpse(4);
  check('a dead snake leaves a bead on every other segment', nine.out && nine.at.join() === '0,2,4,6,8', JSON.stringify(nine));
  check('...and at least MIN_LENGTH of them', three.out && three.at.join() === '0,1,2' && four.out && four.at.join() === '0,2,3', JSON.stringify([three, four]));
}

// ---------------------------------------------------------------- choking on your own tail
// (A step with only the food a test laid, wherever it has rolled to since: nothing that grows mid-test gets in the way.)
const lay = (g, ...food) => { g.food = food; g.mine = new Set(food); return food; };
const kept = g => { g.food = g.food.filter(f => g.mine.has(f)); return E.step(g); };
const bead = (o, x, y) => ({ x, y, kind: 'pellet', color: o.color, owner: o.id, expires: 9999 });
const far = [line(20, 22, 3, 1), 'left']; // (a second snake, out of the way)
const at = (c, x, y) => !!c && c.x === x && c.y === y;
// What a person (or a rival) can work out before the move: where it'll roll, on this board as it stands.
const freeHere = g => (x, y) => !g.holes.has(K(x, y)) && !g.food.some(f => f.x === x && f.y === y) && !g.snakes.some(o => o.alive && o.body.some(c => c.x === x && c.y === y));

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
  // P0 heads right along row y (or turns down at (5,5)); holes block cells; returns the choke and what was predicted.
  const spit = ({ y = 5, turn = false, holes = [], wrap = false, n = 3 }) => {
    const g = board([[line(5, y, n), 'right'], far]);
    const [a] = g.snakes;
    if (wrap) a.wrapUntil = 1e9;
    for (const [x, hy] of holes) g.holes.add(K(x, hy));
    const next = turn ? { x: 5, y: y + 1 } : { x: 6, y };
    if (turn) a.queue = [D.down];
    const [b] = lay(g, bead(a, next.x, next.y));
    const guess = E.rollSide(g, a, next.x, next.y, freeHere(g)); // (before the move: the cell it's about to go into)
    kept(g);
    const e = g.events.find(e => e.type === 'choke' && e.snake === a);
    return { e, b, guess, to: e && { x: e.tx, y: e.ty } };
  };
  const cases = [
    ['a turn knocks it to the outside of the turn', { turn: true }, [6, 6]],
    ['...the inside, if the outside is taken', { turn: true, holes: [[6, 6]] }, [4, 6]],
    ['...and if both are taken, it stays', { turn: true, holes: [[6, 6], [4, 6]] }, [5, 6]],
    ['going straight, it rolls to the side with more open log', { holes: [[6, 7]] }, [6, 4]], // (down: one free cell, then a hole; up: open; the middle and the right are both down)
    ['...a tie goes toward the middle of the board', { y: 18 }, [6, 17]], // (heading right, its right is down: the middle is up)
    ['...the other side, if that one is taken', { y: 18, holes: [[6, 17]] }, [6, 19]],
    ['...and if both are taken, it stays', { holes: [[6, 4], [6, 6]] }, [6, 5]],
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
  // Turning into a dash, at its smallest (the cells it set off from are gone from its body by the end): the first cell's a turn, the outside is the way it was going.
  const g2 = board([[line(5, 5, T.MIN_LENGTH), 'right'], far]);
  const [s] = g2.snakes;
  s.dashes = 1; s.queue = [D.down];
  const [b] = lay(g2, bead(s, 5, 6));
  E.flash(g2, s);
  kept(g2);
  check('...turning into a dash, its own bead goes to the outside of the turn', at(b, 6, 6) && g2.events.some(e => e.type === 'choke' && at(e, 5, 6)) && at(s.body[0], 5, 5 + T.DASH_LENGTH), JSON.stringify(b));
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
  a.body = line(5, 10, 4).map(([x, y]) => ({ x, y })); a.dir = D.right; a.leaps = 1;
  b.body = Array.from({ length: 15 }, (_, i) => ({ x: 6, y: 3 + i })); b.dir = D.up; // (6,3) to (6,17): a long way round
  b.isPlayer = true; b.persona = null; b.queue = [];
  g.food = [{ x: 8, y: 10, kind: 'food', expires: 999 }];
  g.given = new Set(g.food.map(f => f.y * T.GRID + f.x));
  look(g);
  quiet(g);
  look(g);
  quiet(g);
  check('an AI spends a golden leap when it pays', a.alive && a.leaps === 0 && a.body[0].x === 8 && a.body[0].y === 10 && a.eaten === 1, JSON.stringify({ head: a.body[0], leaps: a.leaps, eaten: a.eaten }));
}

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
const rest = Object.keys(AI.PERSONAS).filter(k => k !== 'star');
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
  // making for its burrow two beyond), an apple 4 up: knowing the burrow, it takes the apple; not knowing it, the beetle.
  const view = () => aiView({ me: aiMe(line(10, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], tick: 10,
    food: [{ x: 13, y: 12, kind: 'beetle', expires: 999, dir: D.right, movedAt: 0, px: 12, py: 12, scared: true }, { x: 10, y: 8, kind: 'food', expires: 999 }] });
  const go = memory => { const out = {}; for (let i = 0; i < 20; i++) { const d = dirOf(AI.decide(view(), AI.PERSONAS.drab, JSON.parse(JSON.stringify(memory)))); out[d] = (out[d] || 0) + 1; } return out; };
  const knows = go({ burrows: [K(15, 12)] }), blind = go({});
  check("an AI doesn't chase a beetle bound to dive into its burrow first", knows.up === 20, JSON.stringify(knows));
  check('...unless it doesn\'t know the burrow is there', blind.right === 20, JSON.stringify(blind));
  // It learns a burrow by seeing a beetle come out of it (one that hasn't moved since is on its burrow), and forgets one pecked open.
  const memory = {};
  AI.decide(aiView({ me: aiMe(line(10, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], food: [{ x: 4, y: 4, kind: 'beetle', expires: 999, dir: D.up, movedAt: 9 }, { x: 20, y: 20, kind: 'beetle', expires: 999, dir: D.up, movedAt: 9, px: 20, py: 21 }] }), AI.PERSONAS.drab, memory);
  const learnt = [...memory.burrows];
  AI.decide(aiView({ me: aiMe(line(10, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], holes: new Set([K(4, 4)]) }), AI.PERSONAS.drab, memory);
  check('...it learns a burrow by seeing a beetle come out of it, and forgets one pecked open', JSON.stringify(learnt) === JSON.stringify([K(4, 4)]) && !memory.burrows.length, JSON.stringify({ learnt, now: memory.burrows }));
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

// ---------------------------------------------------------------- round six A: the woodpecker plays fair
// A board in sudden death whose only land is `land` (cells: [x, y]) and the
// snakes on it, each stunned for good (they stay put) and fed; more: grow.
const CELLS = T.GRID * T.GRID;
function island(bodies, land, { grow = 0 } = {}) {
  const g = board(bodies, { time: T.SUDDEN_DEATH_MS });
  const keep = new Set([...land.map(([x, y]) => K(x, y)), ...g.snakes.flatMap(s => s.body.map(c => K(c.x, c.y)))]);
  for (let k = 0; k < CELLS; k++) if (!keep.has(k)) g.holes.add(k);
  for (const s of g.snakes) { s.stunUntil = 1e9; s.grow = grow; }
  return g;
}
// The woodpecker's marks, one a tick: it aims, and instead of striking, aims
// afresh the next tick (pecks: as hungry as after that many strikes).
function marks(g, n, pecks = 0) {
  const out = [];
  g.woodpecker = { x: 12, y: 0, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick, pecks };
  for (let t = 0; t < n * 3 && out.length < n; t++) {
    feed(g); quiet(g);
    if (g.events.some(e => e.type === 'aim')) out.push(new Set(g.woodpecker.target));
    g.woodpecker.target = []; g.woodpecker.restUntil = g.tick;
  }
  return out;
}
const rect = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const heads = g => new Set(g.snakes.filter(s => s.alive).map(s => K(s.body[0].x, s.body[0].y)));

{ // It never shuts you in while it has another patch to pick. A snake at the mouth of a winding corridor, 36 cells long and a
  // dead end, with growth to come that needs 35 of them (so any patch in it shuts the snake in), and a field far off.
  const corridor = [...rect(4, 12, 23, 12), ...rect(23, 13, 23, 20), ...rect(15, 20, 22, 20)], field = rect(0, 0, 11, 8);
  const snake = [[[3, 12], [2, 12], [1, 12], [0, 12]], 'right'];
  const inCorridor = m => corridor.some(([x, y]) => m.has(K(x, y)));
  const fair = seededWhile(601, () => marks(island([snake], [...corridor, ...field], { grow: 31 }), 30));
  check('the woodpecker never shuts a snake in while it has another patch: every mark is in the field', fair.length === 30 && !fair.some(inCorridor), `${fair.filter(inCorridor).length} of ${fair.length} in the corridor`);
  const only = seededWhile(602, () => marks(island([snake], corridor, { grow: 31 }), 10));
  check('...and with no other, it still takes one (the old tiers)', only.length === 10 && only.every(inCorridor), `${only.length} marks`);
}

{ // No crumbs: a patch that would cut off an island of one or two cells takes it too, in the mark from the aim. A field, with a
  // one-cell bay and a two-cell bay on its left; a snake's head just within the clearance of each (they're never part of a
  // patch's own growth), on land of its own.
  const field = rect(10, 6, 21, 17), bay1 = [[9, 11]], bay2 = [[9, 14], [8, 14]];
  const a = [[[5, 11], [4, 11], [3, 11], [2, 11]], 'right'], c = [[[5, 14], [4, 14], [3, 14], [2, 14]], 'right'];
  const g = island([a, c], [...field, ...bay1, ...bay2]);
  const got = seededWhile(611, () => marks(g, 200));
  const has = (m, cells) => cells.every(([x, y]) => m.has(K(x, y)));
  const cut1 = got.filter(m => m.has(K(10, 11))), cut2 = got.filter(m => m.has(K(10, 14)));
  check('a patch that cuts off a one-cell island takes it too, in the mark from the aim', cut1.length > 0 && cut1.every(m => has(m, bay1)) && !got.some(m => !m.has(K(10, 11)) && has(m, bay1)), `${cut1.length} of ${got.length} marks cut it off`);
  check('...and a two-cell one', cut2.length > 0 && cut2.every(m => has(m, bay2)), `${cut2.length} of ${got.length} marks cut it off`);
  // (No mark leaves an island of one or two cells beside it: the land less holes and mark, in islands.)
  const crumbsLeft = m => {
    let n = 0;
    for (const k0 of m) for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const x0 = k0 % T.GRID + dx, y0 = Math.floor(k0 / T.GRID) + dy, s0 = K(x0, y0);
      if (x0 < 0 || y0 < 0 || x0 >= T.GRID || y0 >= T.GRID || m.has(s0) || g.holes.has(s0)) continue;
      const isle = [s0], seen = new Set(isle);
      for (let i = 0; i < isle.length && isle.length <= 2; i++) for (const [ex, ey] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const x = isle[i] % T.GRID + ex, y = Math.floor(isle[i] / T.GRID) + ey, k = K(x, y);
        if (x < 0 || y < 0 || x >= T.GRID || y >= T.GRID || m.has(k) || g.holes.has(k) || seen.has(k)) continue;
        seen.add(k); isle.push(k);
      }
      if (isle.length <= 2) n++;
    }
    return n;
  };
  check('...so no mark leaves a crumb beside it', got.every(m => !crumbsLeft(m)), `${got.filter(m => crumbsLeft(m)).length} of ${got.length}`);
  // A snake lying through the bay's mouth with its tail in the bay: a patch there would cut it off with the snake on it, so
  // none is picked. Its tail one cell short of the bay, the mouth is taken now and then, bay and all.
  const through = n => [[[16, 11], ...Array.from({ length: n }, (_, i) => [15 - i, 11])], 'right'];
  const on = seededWhile(612, () => marks(island([a, through(7), c], [...field, ...bay1, ...bay2]), 200));
  const off = seededWhile(612, () => marks(island([a, through(6), c], [...field, ...bay1, ...bay2]), 200));
  check('...but a patch that would cut off a snake on one isn\'t picked', on.length === 200 && !on.some(m => m.has(K(10, 11))) && off.some(m => m.has(K(10, 11)) && m.has(K(9, 11))),
    `${on.filter(m => m.has(K(10, 11))).length} with the snake on it, ${off.filter(m => m.has(K(10, 11))).length} without`);
}

{ // Rounder hollows. A 3x4 field with a one-cell bay off its side: the patch grows 12 of the 13 cells, and the one it left
  // out, with three or more sides closed (the patch, old holes or the edge), is filled in: all 13, every time.
  const g = island([[[[20, 20], [21, 20], [22, 20], [23, 20]], 'left']], [...rect(9, 1, 11, 4), [12, 2]]);
  const got = seededWhile(621, () => marks(g, 20));
  check('a patch fills in a notch it left (12 grown, and the 13th filled)', got.length === 20 && got.every(m => m.size === 13 && rect(9, 1, 11, 4).every(([x, y]) => m.has(K(x, y))) && m.has(K(12, 2))), JSON.stringify(got.map(m => m.size)));
  // A 3x3 field with a cell sticking out at the top edge, between two heads (two snakes lying down its sides, stunned): the
  // spur (only one side in the patch: the edge and the heads are open) is dropped; the heads, with three sides closed,
  // are never filled in. (Every first try is too near them; the heads go in only in the last, anywhere-left one.)
  const s1 = [[[9, 0], [9, 1], [9, 2], [9, 3]], 'up'], s2 = [[[11, 0], [11, 1], [11, 2], [11, 3]], 'up'];
  const h = island([s1, s2], [...rect(9, 1, 11, 3), [10, 0]], { grow: 100 });
  const spurs = seededWhile(622, () => marks(h, 20)).filter(m => !m.has(K(9, 0)) && !m.has(K(11, 0)));
  check('...drops a one-cell spur', spurs.length >= 10 && spurs.every(m => m.size === 9 && rect(9, 1, 11, 3).every(([x, y]) => m.has(K(x, y))) && !m.has(K(10, 0))), `${spurs.length} marks: ${JSON.stringify(spurs.map(m => m.size))}`);
}

{ // Knocked aside: the nearest free cell outside the patch as the crow flies, then nearest the middle of the log, then the
  // first by row; null with none. A rule, never chance.
  const g = board([[line(5, 3, 4), 'right'], [line(20, 22, 4), 'right']]);
  const at = (c, x, y) => !!c && c.x === x && c.y === y;
  check('knocked: to the nearest free cell; of those, nearest the middle; then the first by row', at(E.knockTo(g, 10, 10, [K(10, 10)]), 11, 10), JSON.stringify(E.knockTo(g, 10, 10, [K(10, 10)])));
  const diamond = (x0, y0, r) => { const out = []; for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) if (x >= 0 && y >= 0 && x < T.GRID && y < T.GRID && Math.abs(x - x0) + Math.abs(y - y0) <= r) out.push(K(x, y)); return out; };
  check('...as the crow flies: two over and one down before three over, though three over is nearer the middle', at(E.knockTo(g, 2, 11, diamond(2, 11, 2)), 4, 12), JSON.stringify(E.knockTo(g, 2, 11, diamond(2, 11, 2))));
  g.holes.add(K(11, 10)); g.food.push({ x: 10, y: 11, kind: 'food' });
  check('...never into a hole, onto food or a body, or into fire', at(E.knockTo(g, 10, 10, [K(10, 10)]), 10, 9), JSON.stringify(E.knockTo(g, 10, 10, [K(10, 10)])));
  g.fires.set(K(10, 9), { from: g.tick, until: g.tick + 50, group: 1, strike: false });
  g.snakes[0].body = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  check('...(so with all four sides taken, a diagonal)', at(E.knockTo(g, 10, 10, [K(10, 10)]), 11, 11), JSON.stringify(E.knockTo(g, 10, 10, [K(10, 10)])));
  // Never onto a burrow: nothing grows on one, and food there would stop it up. (The strike's own list, and the rings
  // and the rivals that read it, go by the same rule.)
  g.burrows.push({ x: 11, y: 11, at: 0, used: 0 });
  g.food.push({ x: 10, y: 10, kind: 'food' });
  const offHole = E.knocks(g, [K(10, 10)]);
  check('...nor onto a burrow (the next diagonal, by the same ties), in the strike\'s own list too', at(E.knockTo(g, 10, 10, [K(10, 10)]), 11, 9) && offHole.length === 1 && at(offHole[0].to, 11, 9),
    JSON.stringify({ to: E.knockTo(g, 10, 10, [K(10, 10)]), all: offHole.map(k => k.to) }));
  g.food.pop(); g.burrows.length = 0;
  const all = []; for (let k = 0; k < CELLS; k++) all.push(k);
  check('...and nowhere: null', E.knockTo(g, 10, 10, all) === null);
  // At the strike: each piece in the patch knocked, by the same rule, one after another (none lands where another did); a beetle
  // scurries there (and isn't digging any more); with nowhere to go, the bird eats it. Each says so.
  const s = board([[line(3, 3, 4), 'right'], [line(20, 22, 4), 'right']], { time: T.SUDDEN_DEATH_MS });
  feed(s);
  const apple = { x: 12, y: 12, kind: 'food', expires: 9999 }, bead = { x: 12, y: 13, kind: 'pellet', color: '#abc', owner: 1, expires: 9999 };
  const bug = { x: 13, y: 12, kind: 'beetle', gold: 1, expires: 9999, dir: D.up, movedAt: 0, digUntil: 50 };
  s.food = [apple, bead, bug]; s.given = new Set(s.food.map(f => K(f.x, f.y)));
  const patch = [K(12, 12), K(12, 13), K(13, 12), K(13, 13)];
  const ahead = E.knocks(s, patch).map(({ food, to }) => [food.kind, to.x, to.y]);
  s.woodpecker = { x: 12, y: 12, at: s.time, target: patch, strikeAt: s.tick, last: [], struckAt: -1, restUntil: 0 };
  E.step(s);
  const ks = s.events.filter(e => e.type === 'knock');
  const where = ks.map(e => [e.kind, e.tx, e.ty]);
  check('at the strike, food in the patch is knocked aside by the rule, as anyone could work it out through the aim', JSON.stringify(where) === JSON.stringify(ahead) && new Set(where.map(([, x, y]) => K(x, y))).size === 3 && where.every(([, x, y]) => !patch.includes(K(x, y))),
    JSON.stringify({ where, ahead }));
  check('...each says what, from where to where (a golden beetle, a bead in its colour)', ks.length === 3 && ks.every(e => typeof e.x === 'number' && typeof e.tx === 'number') && ks.find(e => e.kind === 'beetle').gold === 1 && ks.find(e => e.kind === 'pellet').color === '#abc', JSON.stringify(ks));
  check('...a knocked beetle scurries there (and digs no more)', at(bug, ks[2].tx, ks[2].ty) && bug.px === 13 && bug.py === 12 && bug.scared && bug.movedAt === s.tick - 1 && !('digUntil' in bug) && s.food.includes(apple) && at(apple, ks[0].tx, ks[0].ty), JSON.stringify(bug));
  const t = board([[line(3, 3, 4), 'right'], [line(20, 22, 4), 'right']], { time: T.SUDDEN_DEATH_MS });
  feed(t);
  const lone = { x: 12, y: 12, kind: 'food', expires: 9999 };
  t.food = [lone];
  for (let k = 0; k < CELLS; k++) if (k !== K(12, 12) && !t.snakes.some(o => o.body.some(c => K(c.x, c.y) === k))) t.holes.add(k);
  t.woodpecker = { x: 12, y: 12, at: t.time, target: [K(12, 12)], strikeAt: t.tick, last: [], struckAt: -1, restUntil: 1e9 };
  for (const o of t.snakes) o.stunUntil = 1e9;
  E.step(t);
  const eaten = t.events.find(e => e.type === 'knock');
  check('...and with nowhere to knock it, the bird eats it', eaten && eaten.tx === null && eaten.ty === null && !t.food.includes(lone), JSON.stringify(eaten));
}

{ // The ring is a promise. At the end of the tick before the strike the woodpecker keeps where each piece in its mark will
  // land (w.landings: the rings that tick shows), and the strike lands it there while that cell is still free.
  // An apple in a 2x2 mark, a snake lying round it whose head goes into the mark on the strike's tick (stunned on the tick
  // before, so it's there when the ring is drawn). Its body was in the way, so the ring is two cells up; the strike pecks
  // its head, but the apple still lands on the ring: not on the body of the snake the strike kills (its beads lie there),
  // nor in the cell its tail just left, nearer now.
  const patch = [K(12, 12), K(13, 12), K(12, 13), K(13, 13)];
  const strike = (bodies, stun) => {
    const g = board(bodies, { time: T.SUDDEN_DEATH_MS });
    feed(g);
    g.food = [{ x: 12, y: 12, kind: 'food', expires: 9999 }]; g.given = new Set([K(12, 12)]);
    g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }]; // (no beetles come out meanwhile)
    g.woodpecker = { x: 12, y: 12, at: g.time, target: patch, strikeAt: g.tick + 1, last: [], struckAt: -1, restUntil: 1e9 };
    g.snakes[stun].stunUntil = g.tick + 1;
    E.step(g); feed(g);
    const w = g.woodpecker, promised = JSON.stringify(w.landings), ring = E.knocks(g, w.target, w.landings).map(k => k.to);
    E.step(g);
    return { g, promised, ring, knock: g.events.find(e => e.type === 'knock'), kept: 'landings' in w };
  };
  const at = (c, x, y) => !!c && c.x === x && c.y === y;
  const a = strike([[[[13, 11], [12, 11], [11, 11], [11, 12], [11, 13]], 'down'], [line(5, 20, 4), 'right']], 0);
  const pecked = a.g.snakes[0];
  check('the ring is a promise: kept at the end of the tick before the strike, where the rings show it', a.promised === JSON.stringify([[K(12, 12), K(12, 10)]]) && at(a.ring[0], 12, 10), JSON.stringify({ promised: a.promised, ring: a.ring }));
  check('...food in the mark beside a snake the strike kills lands on its ring, not on that body (nor where its tail just left)',
    !pecked.alive && pecked.fatal === 'pecked' && a.knock && a.knock.tx === 12 && a.knock.ty === 10 && at(a.g.food.find(f => f.kind === 'food'), 12, 10) && !a.kept,
    JSON.stringify({ knock: a.knock && [a.knock.tx, a.knock.ty], alive: pecked.alive, fatal: pecked.fatal }));
  check('...and its beads lie on its body, where they would', a.g.food.some(f => f.kind === 'pellet' && f.x === 12 && f.y === 11), JSON.stringify(a.g.food.map(f => [f.kind, f.x, f.y])));
  // A head that comes onto the ring on the strike's tick: the piece lands as near its ring as it can, by the rule, as
  // the board stands then (the free cell beside the ring nearest the middle, and nobody's hurt), never far from where
  // the ring showed it.
  const b = strike([[[[12, 10], [12, 9], [12, 8], [12, 7]], 'down'], [line(5, 20, 4), 'right']], 0);
  check('...a ring a head moves onto at the strike: that piece lands as near its ring as it can, by the rule', b.promised === JSON.stringify([[K(12, 12), K(12, 11)]]) && b.knock && b.knock.tx === 11 && b.knock.ty === 11 && b.g.snakes[0].alive && at(b.g.snakes[0].body[0], 12, 11),
    JSON.stringify({ promised: b.promised, knock: b.knock && [b.knock.tx, b.knock.ty], head: b.g.snakes[0].body[0] }));
  // Two pieces: the first's ring taken by a head, it lands as near that ring as it can, but never onto the second's
  // ring (still kept).
  const g = board([[[[12, 10], [12, 9], [12, 8], [12, 7]], 'down'], [line(5, 20, 4), 'right']], { time: T.SUDDEN_DEATH_MS });
  feed(g);
  g.food = [{ x: 12, y: 12, kind: 'food', expires: 9999 }, { x: 12, y: 13, kind: 'food', expires: 9999 }]; g.given = new Set([K(12, 12), K(12, 13)]);
  g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }];
  g.snakes[0].stunUntil = g.tick + 1;
  const twoRings = E.knocks(g, patch, [[K(12, 12), K(12, 11)], [K(12, 13), K(11, 12)]]).map(k => k.to);
  g.snakes[0].body.unshift({ x: 12, y: 11 }); g.snakes[0].body.pop(); // (its head on the first ring)
  const after = E.knocks(g, patch, [[K(12, 12), K(12, 11)], [K(12, 13), K(11, 12)]]).map(k => k.to);
  check('...and never onto a ring still kept for another piece', at(twoRings[0], 12, 11) && at(twoRings[1], 11, 12) && at(after[1], 11, 12) && after[0] && !at(after[0], 11, 12) && !at(after[0], 12, 11) && at(after[0], 11, 11),
    JSON.stringify({ twoRings, after }));
}

// ---------------------------------------------------------------- round six A: beetles
{ // A cornered beetle digs in: a head within BEETLE_DIG_FEAR and no burrow within reach. It stays put while it digs, and
  // can be caught. (Another beetle underground for good on each board, so no more come out meanwhile.)
  const bug = () => ({ x: 10, y: 10, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10 });
  const away = () => [{ until: 1e9, expires: 1e9, from: -1, gold: false }];
  const g = board([[line(5, 10, 4), 'right'], [line(20, 22, 4), 'right']], { time: 30000 });
  const [b] = lay(g, bug());
  g.unders = away();
  feed(g); kept(g);
  const dig = g.events.find(e => e.type === 'dig');
  check('a cornered beetle digs in', dig && dig.x === 10 && dig.y === 10 && dig.until === g.tick - 1 + T.BEETLE_DIG && b.digUntil === dig.until, JSON.stringify(dig));
  let caught = null;
  for (let t = 0; t < T.BEETLE_DIG && !caught; t++) { feed(g); kept(g); if (!(b.x === 10 && b.y === 10)) break; caught = g.events.find(e => e.type === 'eat' && e.kind === 'beetle'); }
  check('...stays put while it digs, and can still be caught', caught && caught.x === 10 && caught.y === 10, JSON.stringify(b));
  // Nobody comes for it: when it's done it's underground, a burrow opens where it dug (BURROW_FROM_DIG), and it comes out
  // of a burrow later (another, if there is one).
  const h = board([[line(5, 10, 4), 'right'], [line(20, 22, 4), 'right']], { time: 30000 });
  h.burrows = [{ x: 20, y: 4, at: 0 }];
  h.unders = away();
  lay(h, bug());
  for (const o of h.snakes) o.stunUntil = 1e9;
  const seen = [];
  for (let t = 0; t < T.BEETLE_DIG + T.BEETLE_UNDER_MAX + 4; t++) { feed(h); kept(h); for (const e of h.events) if (['dig', 'dive', 'emerge'].includes(e.type)) seen.push({ ...e, at: h.tick - 1, unders: h.unders.length }); }
  const [d0, d1, d2] = seen;
  const dugBurrow = h.burrows.some(b => b.x === 10 && b.y === 10 && b.dug === 1);
  check(`...done digging, it goes underground (${T.BURROW_FROM_DIG ? 'leaving a burrow where it dug' : 'and makes no burrow'})`, d0?.type === 'dig' && d1?.type === 'dive' && d1.dug === 1 && d1.at === d0.until && d1.unders === 2
    && h.burrows.length === (T.BURROW_FROM_DIG ? 2 : 1) && dugBurrow === !!T.BURROW_FROM_DIG, JSON.stringify({ seen, burrows: h.burrows }));
  check('...and comes out of a burrow a while later', d2?.type === 'emerge' && d2.x === 20 && d2.y === 4 && d2.at - d1.at >= T.BEETLE_UNDER_MIN && d2.unders === 1, JSON.stringify(seen));
  // Not cornered: with a burrow in reach it runs for it and dives in, as before.
  const r = board([[line(7, 10, 4), 'right'], [line(20, 22, 4), 'right']], { time: 30000 });
  r.burrows = [{ x: 12, y: 10, at: 0 }];
  r.unders = away();
  lay(r, { ...bug(), dir: D.right });
  r.snakes[1].stunUntil = 1e9;
  const ran = [];
  for (let t = 0; t < 4; t++) { feed(r); kept(r); for (const e of r.events) if (['dig', 'dive'].includes(e.type)) ran.push(e); }
  check('...but one with a burrow in reach runs for it instead, and dives in', ran.length === 1 && ran[0].type === 'dive' && !ran[0].dug && ran[0].x === 12 && ran[0].y === 10, JSON.stringify(ran));
}

{ // Up to BEETLE_MAX beetles out at once (above ground or under), and they still come out once the woodpecker's here.
  const most = seededWhile(631, () => {
    const g = board([[line(3, 2, 4), 'right'], [line(3, 21, 4), 'right']], { time: 30000 });
    for (const o of g.snakes) o.stunUntil = 1e9;
    let most = 0, two = 0;
    for (let t = 0; t < 3000; t++) {
      feed(g); E.step(g);
      const n = g.food.filter(f => f.kind === 'beetle').length;
      most = Math.max(most, n + g.unders.length);
      if (n === 2) two++;
    }
    return { most, two };
  });
  check(`up to ${T.BEETLE_MAX} beetles out at once, never more`, most.most === T.BEETLE_MAX && most.two > 50, JSON.stringify(most));
  const sd = seededWhile(632, () => {
    const g = board([[line(3, 2, 4), 'right'], [line(3, 21, 4), 'right']], { time: T.SUDDEN_DEATH_MS });
    for (const o of g.snakes) o.stunUntil = 1e9;
    g.burrows = [{ x: 12, y: 12, at: 0 }];
    g.unders = [{ until: 1, expires: 9999, from: -1, gold: false }];
    const seen = { emerge: 0, spawn: 0 };
    for (let t = 0; t < 400; t++) { feed(g); E.step(g); for (const e of g.events) { if (e.type === 'emerge') seen.emerge++; if (e.type === 'spawn' && e.kind === 'beetle') seen.spawn++; } }
    return seen;
  });
  check('...and they still come out once the woodpecker\'s here', sd.emerge >= 1 && sd.spawn >= 1, JSON.stringify(sd));
}

{ // Round six A's experiment, the owner's idea: a dig that leaves a burrow (kept: BURROW_FROM_DIG), and burrows that close
  // over unused (off: BURROW_HEAL_MS 0). Played in a copy of the game with both on.
  let text = fs.readFileSync(path.join(ROOT, 'tuning.js'), 'utf8');
  text = text.replace(/BURROW_FROM_DIG: *\w+,/, 'BURROW_FROM_DIG: true,').replace(/BURROW_HEAL_MS: *\d+,/, 'BURROW_HEAL_MS: 30000,');
  const on = vm.createContext({ window: {}, console, Math });
  vm.runInContext(text, on, { filename: 'tuning.js' });
  for (const f of ['ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), on, { filename: f });
  const E2 = on.window.SnakeEngine, T2 = on.window.TUNING;
  const staged = () => {
    const g = E2.createGame({ humans: [{ name: 'P0' }, { name: 'P1' }], personas: [] });
    g.snakes[0].body = cellsOf(line(5, 10, 4)); g.snakes[1].body = cellsOf(line(20, 22, 4));
    g.time = 30000;
    for (const o of g.snakes) { o.stunUntil = 1e9; o.lastAte = g.time; o.nextStarve = g.time + T2.HUNGER_MS; }
    g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }]; // (no more come out meanwhile)
    return g;
  };
  const g = staged();
  g.burrows = [{ x: 20, y: 2, at: 0, used: 25000 }, { x: 22, y: 4, at: 0, used: 20000 }, { x: 18, y: 2, at: 0, used: 29000 }];
  g.food = [{ x: 10, y: 10, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10 }];
  const seen = [];
  for (let t = 0; t <= T2.BEETLE_DIG; t++) { E2.step(g); g.food = g.food.filter(f => f.kind === 'beetle'); for (const e of g.events) if (['burrow', 'heal'].includes(e.type)) seen.push(e); }
  check('a dig leaves a burrow, and at the most the one unused longest closes over', JSON.stringify(seen) === JSON.stringify([{ type: 'heal', x: 22, y: 4 }, { type: 'burrow', x: 10, y: 10, dug: 1 }])
    && g.burrows.length === T2.BURROW_MAX && g.burrows.some(b => b.x === 10 && b.y === 10 && b.dug === 1), JSON.stringify(seen));
  const h = staged();
  h.burrows = [{ x: 20, y: 2, at: 0, used: 0 }, { x: 22, y: 4, at: 0, used: 0 }, { x: 18, y: 2, at: 0, used: 25000 }];
  h.food = [{ x: 22, y: 4, kind: 'beetle', expires: 9999, dir: D.up, movedAt: 1e9 }];
  E2.step(h);
  check('(off in the game) a burrow unused for BURROW_HEAL_MS closes over, but not with a beetle on it', JSON.stringify(h.events.filter(e => e.type === 'heal')) === JSON.stringify([{ type: 'heal', x: 20, y: 2 }]) && h.burrows.length === 2, JSON.stringify(h.burrows));
}

{ // Everyone sees every burrow on the board, as it is.
  const g = board([[line(5, 10, 4), 'right'], [line(20, 22, 4), 'right']]);
  g.burrows = [{ x: 3, y: 3, at: 0 }];
  E.step(g);
  check('an AI sees the burrows as they are', E.aiView(g, g.snakes[1]).burrows === g.burrows && E.createGame().unders.length === 0);
}

{ // Nothing grows on a burrow, beads included: a snake out across one leaves no bead on it, and neither does a tail a crash
  // knocks off (the beads elsewhere fall as ever).
  const g = board([[line(23, 5, 3), 'right'], [line(23, 15, 8), 'right'], [line(5, 20, 4), 'right']]);
  g.burrows = [{ x: 21, y: 5, at: 0, used: 0 }, { x: 16, y: 15, at: 0, used: 0 }];
  g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }];
  feed(g);
  const dying = E.step(g), beads = g.food.filter(f => f.kind === 'pellet').map(f => [f.x, f.y]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const on = (x, y) => beads.some(([bx, by]) => bx === x && by === y);
  check('beads never fall on a burrow: a snake out across one, a tail a crash knocks off across another',
    dying.length === 1 && dying[0] === g.snakes[0] && !on(21, 5) && on(23, 5) && on(22, 5) && !on(16, 15) && on(17, 15) && on(18, 15) && g.snakes[1].alive,
    JSON.stringify({ beads, out: dying.map(s => s.id) }));
}

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


console.log(failed ? `${failed} failed` : 'all good');
process.exit(failed ? 1 : 0);
