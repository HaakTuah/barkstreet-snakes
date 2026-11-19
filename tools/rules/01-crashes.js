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
