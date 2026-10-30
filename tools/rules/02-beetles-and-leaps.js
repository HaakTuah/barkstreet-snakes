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
  const g3 = board([[line(5, 10, 5), 'right'], wall(6), wall(7)]); // (four abreast, two bodies and two holes: past its reach)
  g3.holes.add(K(8, 10)); g3.holes.add(K(9, 10));
  E.leap(g3, g3.snakes[0]); quiet(g3);
  check('...never onto a body, nor further than it reaches', !g3.events.some(e => e.type === 'leap') && g3.events.some(e => e.type === 'crash'));
  const g4 = board([[line(5, 10, 5), 'right'], wall(7, 9)]);
  const me = g4.snakes[0];
  E.leap(g4, me);
  quiet(g4); // (open ground ahead: no leap yet)
  const waited = !g4.events.some(e => e.type === 'leap');
  g4.snakes[1].queue = [D.up];
  quiet(g4); // (the body's right in front now)
  check('...it waits a moment for something to hop', waited && g4.events.some(e => e.type === 'leap') && me.body[0].x === 7, JSON.stringify(me.body[0]));
}

{ // The island hop: over up to LEAP_REACH cells of hurdles (here a body, a hole and fire), a cell a tick, landing on the first free cell beyond.
  const g = board([[line(5, 10, 6), 'right'], wall(6)]);
  g.holes.add(K(7, 10));
  g.fires.set(K(8, 10), { from: 0, until: 999, group: 1, strike: false }); g.fireGroups.set(1, 1);
  const me = g.snakes[0];
  E.leap(g, me);
  const seen = [];
  for (let n = 0; n < 4; n++) { quiet(g); seen.push([me.body[0].x, !!me.flight]); }
  check('an island hop: over three, up three ticks, a cell a tick', JSON.stringify(seen.slice(0, 3)) === '[[6,true],[7,true],[8,true]]' && g.events.length >= 0, JSON.stringify(seen));
  check('...and down on the fourth, on the first free cell beyond', me.alive && JSON.stringify(seen[3]) === '[9,false]' && joined(me.body) && !(me.burnUntil > g.tick), JSON.stringify(seen[3]));
  check('...its body over what it hopped (a hole holds it), and the one hopped is fine', me.body.slice(1, 4).every((c, i) => c.x === 8 - i && c.y === 10) && g.snakes[1].alive && me.body.length === 6 - T.LEAP_COST);
  const g2 = board([[line(5, 10, 5), 'right'], wall(6), wall(7)]); // (two abreast, the first free cell is the third)
  E.leap(g2, g2.snakes[0]); quiet(g2); quiet(g2); quiet(g2);
  check('...over two, it lands on the third tick', g2.snakes[0].body[0].x === 8 && !g2.snakes[0].flight && g2.snakes.every(o => o.alive), JSON.stringify(g2.snakes[0].body[0]));
}

{ // A golden leap: the same island hop, free.
  const g = board([[line(5, 10, 5), 'right'], wall(6), wall(7)]);
  const me = g.snakes[0];
  me.leaps = 2;
  E.leap(g, me);
  quiet(g);
  check('a golden leap: up over what\'s in front', me.body[0].x === 6 && !!me.flight && me.leaps === 1 && g.events.some(e => e.type === 'leap' && e.gold && e.reach === 2));
  quiet(g); quiet(g);
  check('...landing on the first free cell beyond', me.alive && me.body[0].x === 8 && !me.flight && joined(me.body) && g.snakes.every(o => o.alive), JSON.stringify(me.body[0]));
  check('...free, and ready again at once', me.body.length === 5 && me.leapReadyAt === 0, me.body.length);
}

{ // A press stays armed LEAP_WINDOW ticks: pressed with the hurdle 5 cells ahead, it hops when it gets there; and nothing hops without a press.
  const g = board([[line(5, 10, 5), 'right'], [line(3, 20, 3), 'right']]);
  g.holes.add(K(10, 10));
  const me = g.snakes[0];
  E.leap(g, me);
  for (let n = 0; n < 5; n++) quiet(g);
  check('a press made with the hurdle 5 cells ahead still hops it', me.alive && me.body[0].x === 10 && !!me.flight, JSON.stringify(me.body[0]));
  const g2 = board([[line(5, 10, 5), 'right'], wall(6)]);
  quiet(g2);
  check('...and no press, no jump: it crashes', !g2.events.some(e => e.type === 'leap') && g2.events.some(e => e.type === 'crash'));
}

{ // An AI asks for its power the way a person does: boxed in, with a leap, it hops instead of crashing.
  // At the top edge, heading right: up is the edge, down its own body, right a rival's body (and beyond it, room).
  for (const golden of [true, false]) {
    const g = E.createGame({ withPlayer: false, personas: ['drab', 'drab'] });
    g.snakes = g.snakes.slice(0, 2);
    const [a, b] = g.snakes;
    a.body = [[5, 0], [4, 0], [4, 1], [5, 1], [5, 2], [4, 2]].map(([x, y]) => ({ x, y })); a.dir = D.right; a.leaps = golden ? 1 : 0; a.flashReadyAt = 1e9; // (its flash resting: it could cut through the rival)
    b.body = [...Array.from({ length: 13 }, (_, i) => ({ x: 6, y: 12 - i })), { x: 7, y: 0 }]; b.dir = D.down;
    b.isPlayer = true; b.persona = null; b.queue = [];
    g.food = [];
    look(g);
    quiet(g);
    let hopped = g.events.some(e => e.type === 'leap');
    for (let n = 0; n < 3 && (a.flight || !hopped); n++) { look(g); quiet(g); hopped ||= g.events.some(e => e.type === 'leap'); }
    const lands = golden ? [[7, 0], [5, 3]] : [[7, 0], [5, 3]]; // (over the rival, or over its own body, whichever lands better)
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
  me.wrapUntil = g.time; g.portals = []; // (and no gold portal left open from the last time: see 21-gold-portals.js)
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
  const g = board([[line(5, 10, 5), 'right'], wall(6)], { food: [[7, 10]] }); // (an apple in the fire it hops over)
  g.fires.set(K(7, 10), { from: 0, until: 999, group: 1, strike: false }); g.fireGroups.set(1, 1);
  const me = g.snakes[0];
  E.leap(g, me); quiet(g); quiet(g);
  check('in the air, it doesn\'t eat', me.body[0].x === 7 && !!me.flight && me.eaten === 0 && g.food.some(f => f.x === 7 && f.y === 10), me.eaten);
  const g2 = board([[line(5, 10, 5), 'right'], [[[5, 20], [4, 20], [3, 20]], 'right']]);
  g2.fires.set(K(6, 10), { from: 0, until: 999, group: 1, strike: false }); g2.fireGroups.set(1, 1);
  E.leap(g2, g2.snakes[0]); quiet(g2); quiet(g2);
  check('...leaps over fire without catching it', g2.snakes[0].body[0].x === 7 && !(g2.snakes[0].burnUntil > g2.tick) && g2.events.length >= 0, g2.snakes[0].burnUntil);
}

{ // A dash into a head fails, as into anything it can't cut; through its own body one thick, it drops its tail.
  const g = board([[line(5, 10, 9), 'right'], [[[7, 10], [7, 11], [7, 12], [7, 13], [7, 14]], 'up']]); // (a head in the way)
  E.flash(g, Object.assign(g.snakes[0], { dashes: 1 }));
  quiet(g);
  const bonk = g.events.find(e => e.type === 'crash' && e.snake === g.snakes[0]);
  check('a dash into a head fails: five off and the longer stun', g.snakes[0].alive && g.snakes[1].alive && bonk?.failed === 1 && bonk.lost === T.FAIL_LOSS && g.snakes[0].stunUntil === g.tick + T.FAIL_STUN_TICKS && !g.events.some(e => e.type === 'cut'), JSON.stringify(bonk));
  const coil = [[5, 10], [5, 11], [6, 11], [7, 11], [7, 10], [7, 9], [6, 9], [5, 9], [4, 9], [3, 9]]; // ((7,10), two ahead, is its own body)
  const g2 = board([[coil, 'right'], [[[5, 20], [4, 20], [3, 20]], 'right']]);
  E.flash(g2, Object.assign(g2.snakes[0], { dashes: 1 }));
  quiet(g2);
  const me = g2.snakes[0];
  check('...and through its own body, it drops its tail', me.alive && me.body[0].x === 8 && g2.events.some(e => e.type === 'cut' && e.snake === me && e.by === me.id) && !g2.events.some(e => e.type === 'crash') && me.body.length < coil.length, `${JSON.stringify(g2.events.map(e => e.type))} ${me.body.length}`);
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
}

{ // Round six B, the flashes cut: the plain flash cuts through a body one thick with free log beyond; anything else it runs into, and it has failed.
  const col = (x, y0, n) => Array.from({ length: n }, (_, i) => [x, y0 + i]); // (a body down column x, heading up)
  const flashAt = (bodies, set = () => {}) => { const g = board(bodies); for (const o of g.snakes.slice(1)) o.stunUntil = 1e9; set(g); E.flash(g, g.snakes[0]); quiet(g); return g; };
  const g = flashAt([[line(5, 10, 6), 'right'], [col(7, 4, 10), 'up']]); // ((7,10) is its seventh segment)
  const [me, o] = g.snakes;
  check('a plain flash through a body one thick cuts it: the part behind falls to beads', me.alive && me.body[0].x === 7 && o.alive && o.body.length === 6 && g.events.some(e => e.type === 'cut' && e.snake === o && e.by === me.id && e.lost === 4) && g.food.filter(f => f.kind === 'pellet' && f.owner === o.id).length === 3, `${JSON.stringify(me.body[0])} ${o.body.length}`);
  const g2 = flashAt([[line(5, 10, 6), 'right'], [col(6, 8, 6), 'up']]); // ((6,10): its third segment)
  check('...the neck cut: fewer than 3 left in front, and it\'s out', !g2.snakes[1].alive && g2.snakes[1].fatal === 'cut' && g2.snakes[1].killerId === g2.snakes[0].id && g2.snakes[0].alive, g2.snakes[1].cause);
  const failed = (g, n) => { const e = g.events.find(e => e.type === 'crash' && e.snake === g.snakes[0]); return !!e && e.failed === 1 && e.lost === Math.min(T.FAIL_LOSS, n - T.MIN_LENGTH) && g.snakes[0].stunUntil === g.tick + T.FAIL_STUN_TICKS && !g.events.some(e => e.type === 'cut'); };
  const g3 = flashAt([[line(5, 10, 9), 'right'], [col(7, 4, 10), 'up'], [col(8, 4, 10), 'up']]);
  check('...a body two thick it can\'t cut: it gets that far and runs into it, a failed flash (five off, the longer stun)', g3.snakes[0].body[0].x === 6 && g3.snakes[1].body.length === 10 && failed(g3, 9), JSON.stringify(g3.events));
  const g4b = flashAt([[line(5, 10, 9), 'right'], [col(6, 10, 6), 'up']]); // (a head right in front)
  check('...into a head, it fails', failed(g4b, 9) && g4b.snakes[1].alive && g4b.snakes[1].body.length === 6, JSON.stringify(g4b.events));
  const g5 = flashAt([[line(22, 10, 9, -1).map(([x, y]) => [x, y]), 'right'], [col(23, 4, 12), 'up']]); // (a body along the edge: nothing free beyond)
  check('...the edge shelters a body: nothing free beyond, no cut, and the flash fails', g5.snakes[1].body.length === 12 && failed(g5, 9), JSON.stringify(g5.events));
  const g6 = flashAt([[line(5, 10, 9), 'right'], [col(6, 4, 12), 'up']], g => g.holes.add(K(7, 10))); // (a hole beyond)
  check('...nor against a hole', g6.snakes[1].body.length === 12 && failed(g6, 9), JSON.stringify(g6.events));
  const g7 = flashAt([[line(5, 10, 9), 'right'], [line(5, 20, 3), 'right']], g => { g.fires.set(K(6, 10), { from: 0, until: 999, group: 1, strike: false }); g.fireGroups.set(1, 1); });
  check('...it puts out the first fire it passes', !g7.fires.has(K(6, 10)) && g7.snakes[0].body[0].x === 7 && !(g7.snakes[0].burnUntil > g7.tick), JSON.stringify(g7.events.map(e => e.type)));
  const g8 = flashAt([[line(23, 10, 9), 'right'], [line(5, 20, 3), 'right']]);
  check('...into the edge, a plain flash fails (a golden one blows up)', g8.snakes[0].alive && failed(g8, 9), JSON.stringify(g8.events));
  check('...and it rests 10 to 12 s', T.FLASH_COOLDOWN_MS >= 10000 && T.FLASH_COOLDOWN_MS <= 12000);
  const g10 = flashAt([[line(5, 10, 9), 'right'], [col(8, 4, 12), 'up'], [col(9, 9, 6), 'up']], g => { g.snakes[0].dashes = 1; }); // (a golden flash's last cell, (8,10), one thick; a neck one beyond its reach, at (9,10))
  check('a golden flash cuts only what it reaches: a neck one cell beyond its last is left alone', g10.snakes[2].alive && g10.snakes[1].body.length < 12 && g10.snakes[0].body[0].x === 8 && g10.events.filter(e => e.type === 'cut').length === 1, JSON.stringify(g10.events.map(e => e.type)));
  const coil = [[5, 10], [5, 11], [6, 11], [7, 11], [7, 10], [7, 9], [6, 9], [5, 9], [4, 9], [3, 9], [2, 9], [1, 9]]; // ((7,10), two ahead, its own fifth segment; (8,10) free)
  const g9 = flashAt([[coil, 'right'], [line(5, 20, 3), 'right']]);
  const m9 = g9.snakes[0];
  check('dropping your tail: a plain flash through your own body one thick cuts it (the rest, beads you can\'t eat back)', m9.alive && m9.body[0].x === 7 && g9.events.some(e => e.type === 'cut' && e.snake === m9 && e.by === m9.id) && m9.body.length === 5 && joined(m9.body), `${JSON.stringify(m9.body)} ${JSON.stringify(g9.events.map(e => e.type))}`);
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

{ // A flash asked for in a stun that can't get anywhere (into the edge, or a head it hit; golden, into the edge or a hole) says so, and the auto-turn takes it clear: it isn't sent back in, nor blown up.
  const atEdge = () => board([[line(23, 5, 8), 'right'], [line(5, 20, 3), 'right']]);
  const atHead = () => { const g = board([[line(6, 10, 8), 'right'], [Array.from({ length: 6 }, (_, i) => [7, 10 + i]), 'up']]); g.snakes[1].stunUntil = 1e9; return g; }; // (a head can't be cut)
  const atBody = () => { const g = board([[line(6, 10, 8), 'right'], wall(7, 6, 12)]); g.snakes[1].stunUntil = 1e9; return g; };
  const atHole = () => { const g = board([[line(6, 10, 8), 'right'], [line(5, 20, 3), 'right']]); g.holes.add(K(7, 10)); return g; };
  for (const [what, make, dashes] of [['plain, at the edge', atEdge, 0], ['plain, at a head', atHead, 0], ['golden, at the edge', atEdge, 2], ['golden, at a hole', atHole, 2]]) {
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
  for (const dashes of [1, 0]) { // (at a body one thick: that's a cut, and it goes)
    const g = atBody(), [me, o] = g.snakes;
    feed(g); quiet(g);
    me.dashes = dashes;
    E.flash(g, me);
    for (let i = 0; i < T.STUN_TICKS + 1; i++) { feed(g); quiet(g); }
    check(`...but a ${dashes ? 'golden' : 'plain'} one at a body one thick goes: it cuts it`, me.alive && me.dashes === 0 && o.body.length === 4 && me.body[0].x === (dashes ? 9 : 8), JSON.stringify(me.body[0]));
  }
}

{ // A jump and a flash asked for together in a stun, where only the jump could go and its landing's taken as it goes: the flash
  // doesn't go instead (back into what it hit, or blown up in it); it says why, and the auto-turn takes it clear.
  for (const [what, hole, dashes] of [['at a hole, holding golden flashes', true, 1], ['at a hole', true, 0], ['at a head', false, 0]]) {
    const g = board([[[[5, 10], [4, 10], [3, 10], [2, 10], [1, 10], [0, 10], [0, 11], [0, 12], [0, 13]], 'right'], hole ? [line(20, 2, 4), 'right'] : [Array.from({ length: 6 }, (_, i) => [6, 10 + i]), 'up'], [[[7, 16], [7, 17], [7, 18], [7, 19]], 'up']]);
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
