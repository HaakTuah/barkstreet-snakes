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
    const want = !hole ? 'dash@0' : `leap@${dist - 1},dash@${dist + 1}`; // (a flash cuts a body one thick: it goes at once)
    check(`a jump and a flash pressed together with ${what}: ${!hole ? 'the flash cuts it' : 'it crawls up, hops, then flashes'}`, me.alive && seen.join() === want && me.dashes === 0, `${seen.join()} ${me.cause || ''}`);
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
  let near = 0, nearAims = 0, early = 0, underFood = 0, knocked = 0, badKnocks = 0, strikes = 0, cells = 0, aims = 0, underBodies = 0, besideHoles = 0, under = 0, cuts = 0;
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
          const nearBefore = near;
          for (const k of g.woodpecker.target) {
            if (open(k) && heads.some(h => Math.abs(h.x - k % T.GRID) + Math.abs(h.y - Math.floor(k / T.GRID)) <= T.PECK_CLEARANCE)) near++;
            if (foodCells.has(k)) underFood++;
          }
          if (near > nearBefore) nearAims++;
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
        if (e.type === 'cut' && !g.events.some(d => d.type === 'dash' && d.snake.id === e.by)) cuts++; // (the woodpecker's: not a flash's)
      }
    }
  });
  check('the woodpecker strikes in patches', strikes > 20 && cells / strikes > T.PECK_CHUNK / 2, `${strikes} strikes, ${(cells / Math.max(1, strikes)).toFixed(1)} cells each`);
  // (A patch nearer a head is its fallback when every spot clear of them would shut a snake in, or none of its tries
  // found one: late in these restless rounds, a couple of aims in about 160 at most, depending on how the rounds went.
  // With the clearance ignored, 86 of them were near a head.)
  check('the woodpecker aims well away from heads', nearAims <= 3, `${nearAims} of ${aims} aims near a head (${near} cells too close)`);
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

{ // Bodies lying over holes: a bridge (round six B), a dash cuts it and then blows up in the hole, and an auto-turn never takes a tail over a hole for room.
  const g = board([[line(5, 5, 6), 'right'], [[[6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8]], 'up']]);
  g.holes.add(K(6, 5)); // (under P1's third segment)
  E.step(g);
  const crash = g.events.find(e => e.type === 'crash' && e.snake === g.snakes[0]);
  check('a body that lies over a hole is a bridge since round six B: a head crawls onto its back (see tools/rules/17-bridges.js)', !crash && g.snakes[0].alive && g.snakes[0].body[0].x === 6 && g.snakes[0].body[0].y === 5, crash && crash.cause);
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
