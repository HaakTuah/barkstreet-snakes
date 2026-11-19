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
