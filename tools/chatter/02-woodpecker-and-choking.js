{ // The woodpecker under a body: at most every 12 s, and only for the living.
  const g = stage(['mason'], { 0: [3, 20], 1: [12, 12] }), [, mason] = g.snakes;
  const peck = () => [{ type: 'peck', x: 11, y: 12, cells: [K(11, 12)], under: [mason.id] }];
  check(tick(g, peck()).length === 1, 'pecked under: a line');
  check(tick(g, peck(), 6000).length === 0, '...and none 6 s later');
  check(says(tick(g, peck(), 6500), mason, VOICES.mason.under), '...but another 12.5 s after the first');
  mason.alive = false;
  check(tick(g, peck(), 13000).length === 0, '...and none from a snake that\'s out');
}
{ // Put out by the weather, not by burning out in the dry.
  const g = stage(['gobbler'], { 1: [12, 12] }), [, gob] = g.snakes;
  gob.burnFrom = g.tick; gob.burnUntil = g.tick + 2;
  tick(g);
  check(tick(g).length === 0, 'a fire that burns out in the dry: nothing about the rain');
  g.weather.kind = 'snow'; gob.burnFrom = g.tick; gob.burnUntil = g.tick + 2;
  tick(g, [], 5000);
  check(says(tick(g), gob, VOICES.gobbler.doused), 'put out in the snow: a doused line');
}
{ // The rain comes while a rival burns: someone else remarks on the rain, and the one on fire on being put out.
  const g = stage(['gobbler', 'drab'], { 1: [12, 12], 2: [12, 18] }), [, gob, drab] = g.snakes;
  gob.burnFrom = g.tick; gob.burnUntil = g.tick + 10;
  tick(g, [], 5000);
  g.weather.kind = 'rain';
  const h = tick(g, [{ type: 'weather', kind: 'rain' }]);
  check(says(h, drab, VOICES.drab.weather.rain) && !h.some(x => x.s === gob), 'the rain starts: the snake on fire leaves the weather to others');
  gob.burnUntil = g.tick + 1;
  check(says(tick(g, [], 600), gob, VOICES.gobbler.doused), '...and is put out with a word');
}
{ // Ash and rot are for whoever was nearest (you included), and near; and nobody mourns a mushroom.
  const g = stage(['vulture'], { 0: [15, 12], 1: [12, 12] }), [you, vul] = g.snakes;
  check(tick(g, [{ type: 'ash', x: 13, y: 12, kind: 'mushroom' }]).length === 0, 'a mushroom burnt to ash: nothing');
  check(tick(g, [{ type: 'ash', x: 14, y: 12, kind: 'food' }], 5000).length === 0, 'ash nearer your head than the rival\'s: the rival says nothing');
  check(tick(g, [{ type: 'rot', x: 12, y: 18, kind: 'apple' }], 5000).length === 0, 'rot 6 cells away: nothing');
  check(says(tick(g, [{ type: 'rot', x: 12, y: 14, kind: 'apple' }], 5000), vul, VOICES.vulture.rot), 'rot 2 cells away: a rot line');
  check(tick(g, [{ type: 'rot', x: 12, y: 14, kind: 'pellet' }], 20000).length === 0, '...and no other for 40 s');
  void you;
}
{ // Sovereign: rot and pecks on its land, by the one land rule (radius + LAND_REACH: no nub at the tips).
  const g = stage(['sovereign'], { 0: [3, 22], 1: [20, 2] }), [, sov] = g.snakes;
  sov.memory.home = { x: 10, y: 10, radius: 4 };
  tick(g);
  check(tick(g, [{ type: 'rot', x: 15, y: 10, kind: 'apple' }], 5000).length === 0, 'rot on the old nub (radius + 1, straight out): not Sovereign\'s land');
  check(says(tick(g, [{ type: 'rot', x: 13, y: 13, kind: 'apple' }], 5000), sov, VOICES.sovereign.realm.rotten), 'rot on its land: Sovereign minds');
  check(tick(g, [{ type: 'rot', x: 14, y: 10, kind: 'pellet' }], 10000).length === 0, '...but not again within 30 s');
  check(tick(g, [{ type: 'peck', x: 15, y: 10, cells: [K(15, 10)], under: [] }], 5000).length === 0, 'a peck on the old nub: not its land either');
  check(says(tick(g, [{ type: 'peck', x: 14, y: 10, cells: [K(14, 10)], under: [] }], 5000), sov, VOICES.sovereign.realm.pecked), 'a peck on its land: Sovereign minds');
}
{ // Colonist: rot in a colony.
  const g = stage(['colonist'], { 0: [3, 22], 1: [22, 2] }), [, col] = g.snakes;
  col.memory.colonies = [{ x: 6, y: 6, radius: 4, n: 1 }, { x: 14, y: 8, radius: 4, n: 2 }];
  col.memory.planted = 2;
  tick(g);
  check(says(tick(g, [{ type: 'rot', x: 17, y: 10, kind: 'pellet' }], 5000), col, VOICES.colonist.colony.rotten), 'rot in a colony: Colonist minds');
}
{ // A colony on Sovereign's land: only where their land really meets.
  const g = stage(['sovereign', 'colonist'], { 0: [3, 22], 1: [22, 2], 2: [22, 20] }), [, sov, col] = g.snakes;
  sov.memory.home = { x: 8, y: 10, radius: 3 };
  col.memory.colonies = [{ x: 16, y: 10, radius: 4, n: 1 }]; col.memory.planted = 1;
  let h = tick(g, [], 5000);
  check(!says(h, sov, VOICES.sovereign.realm.invaded, col), 'a colony that only reaches the realm\'s old (radius + 1) edge: Sovereign says nothing');
  col.memory.colonies.push({ x: 15, y: 10, radius: 4, n: 2 }); col.memory.planted = 2;
  h = tick(g, [], 5000);
  check(says(h, sov, VOICES.sovereign.realm.invaded, col), 'a colony sharing a cell of the realm: "A colony? On OUR land?!"');
}
{ // Desperate: once a spell, and not again for 30 s if it comes and goes.
  const g = stage(['colonist'], { 1: [12, 12] }), [, col] = g.snakes;
  col.memory.desperate = true;
  check(says(tick(g), col, VOICES.colonist.desperate), 'starving soon: a desperate line');
  check(tick(g, [], 5000).length === 0, '...once a spell');
  col.memory.desperate = false; tick(g);
  col.memory.desperate = true;
  check(tick(g, [], 5000).length === 0, '...and not again so soon');
  col.memory.desperate = false; tick(g);
  col.memory.desperate = true;
  check(tick(g, [], 40000).some(x => x.s === col), '...but in a new spell later on (its one line rests 45 s too)');
}
{ // A golden dash keeps its own lines; a plain flash with nobody near says nothing; flash lines rest 30 s.
  const g = stage(['desperado'], { 0: [3, 22], 1: [12, 12] }), [you, des] = g.snakes;
  check(says(tick(g, [{ type: 'dash', snake: des, x: 9, y: 12, n: 3 }]), des, VOICES.desperado.dash), 'a golden dash: a dash line');
  check(tick(g, [{ type: 'dash', snake: des, x: 10, y: 12, n: 2, plain: 1 }], 5000).length === 0, 'a plain flash on its own: nothing');
  you.body = at(13, 13);
  check(says(tick(g, [{ type: 'dash', snake: des, x: 10, y: 12, n: 2, plain: 1 }], 5000), des, VOICES.desperado.flash.past, you), 'a flash past your head: a flash line');
  check(tick(g, [{ type: 'dash', snake: des, x: 10, y: 12, n: 2, plain: 1 }], 6000).length === 0, '...and no other for 30 s');
}
{ // A dash cut: the dasher crows, and the one cut names it.
  const g = stage(['sovereign', 'wildcard'], { 1: [12, 12], 2: [12, 16] }), [, sov, wild] = g.snakes;
  const h = tick(g, [{ type: 'cut', snake: wild, x: 10, y: 16, lost: 2, by: sov.id }]);
  check(says(h, sov, VOICES.sovereign.snip, wild) && says(h, wild, VOICES.wildcard.cut, sov), `cut by a dash: "${lineOf(h, sov)}" / "${lineOf(h, wild)}"`);
}
{ // What whole rounds bring now and then, staged: last words naming the killer, Vulture at a death, a mushroom eaten,
  // Metagamer's small talk with its label for you, someone at the woodpecker's coming, and Sovereign's realm growing,
  // shrinking and on fire.
  let g = stage(['sniper', 'vulture'], { 1: [12, 12], 2: [12, 18] });
  const [you, sniper, vul] = g.snakes;
  Object.assign(sniper, { alive: false, killer: you.name, killerId: you.id });
  let h = tick(g, [{ type: 'death', snake: sniper }]);
  check(says(h, sniper, VOICES.sniper.dies.filter(l => l.includes('{who}')), you), `last words name the killer (said: ${lineOf(h, sniper)})`);
  Object.assign(you, { alive: false, killer: 'wall' });
  h = tick(g, [{ type: 'death', snake: you }], 5000);
  check(says(h, vul, VOICES.vulture.death, you), `Vulture marks a death (said: ${lineOf(h, vul)})`);
  // Last words know what killed them when no snake did: Mason says "Et tu" to it.
  for (const [cause, killer, fatal, by] of [['hit the edge', 'wall', 'boxed', 'edge'], ['bit itself', 'self', 'boxed', 'self'], ['fell into a woodpecker hole', 'wall', 'hole', 'hole'],
    ['got pecked by the woodpecker', 'wall', 'pecked', 'woodpecker'], ['starved', 'hunger', 'hunger', 'hunger'], ['burned up', 'fire', 'fire', 'fire']]) {
    const gm = stage(['mason'], { 1: [12, 12] }), mason = gm.snakes[1];
    Object.assign(mason, { alive: false, cause, killer, killerId: killer === 'self' ? mason.id : null, fatal });
    const hm = tick(gm, [{ type: 'death', snake: mason }]);
    check(says(hm, mason, VOICES.mason.diesBy[by]), `Mason's last words, dying by ${by}: ${lineOf(hm, mason)}`);
  }
  { // (A hole's rim it crashed into is no fall: its plain last words.)
    const gm = stage(['mason'], { 1: [12, 12] }), mason = gm.snakes[1];
    Object.assign(mason, { alive: false, cause: 'hit a woodpecker hole', killer: 'wall', killerId: null, fatal: 'boxed' });
    const hm = tick(gm, [{ type: 'death', snake: mason }]);
    check(says(hm, mason, VOICES.mason.dies.filter(l => !l.includes('{who}'))), `Mason's last words at a hole's rim are his plain ones: ${lineOf(hm, mason)}`);
  }
  g = stage(['gobbler'], { 1: [12, 12] });
  h = tick(g, [{ type: 'eat', snake: g.snakes[1], kind: 'mushroom', x: 12, y: 12 }]);
  check(says(h, g.snakes[1], VOICES.gobbler.mushroom), `a rival that eats a mushroom grimaces (said: ${lineOf(h, g.snakes[1])})`);
  g = stage(['metagamer'], { 1: [12, 12] });
  const meta = g.snakes[1];
  meta.memory.labels = { [g.snakes[0].id]: 'greedy' };
  h = tick(g, [], 4000, 0.01); // (a roll low enough for small talk, and its first line)
  check(lineOf(h, meta) === `${g.snakes[0].name}: greedy. Noted.`, `Metagamer's small talk says what it makes of you (said: ${lineOf(h, meta)})`);
  h = tick(g, [{ type: 'woodpecker' }], 5000);
  check(says(h, meta, VOICES.metagamer.woodpecker), `...and someone remarks on the woodpecker's coming (said: ${lineOf(h, meta)})`);
  g = stage(['sovereign'], { 0: [3, 22], 1: [20, 2] });
  const sov = g.snakes[1];
  sov.memory.home = { x: 10, y: 10, radius: 4 };
  tick(g);
  sov.memory.home = { x: 10, y: 10, radius: 5 };
  check(says(tick(g, [], 5000), sov, VOICES.sovereign.realm.grow), 'Sovereign\'s realm grows: it says so');
  sov.memory.home = { x: 10, y: 10, radius: 4 };
  check(says(tick(g, [], 5000), sov, VOICES.sovereign.realm.shrink), '...and shrinks: that too');
  g.fires.set(K(11, 10), { from: g.tick, until: g.tick + 50, group: 1, strike: true });
  h = [];
  for (let i = 0; i < 10 && !h.length; i++) h = tick(g, [], i ? 100 : 5000);
  check(says(h, sov, VOICES.sovereign.realm.burning), 'fire on its land: Sovereign minds');
}
console.log('ok   the rarer lines keep to their rests; land is radius + LAND_REACH; ash and rot go to whoever was nearest; last words, a mushroom, small talk, the woodpecker and a realm changing, staged');

// Choking on your own bead (round six A): the choker's line, at most every
// 20 s; the thanks of whoever eats what a choke spat or a cough nudged aside,
// now and then; and the woodpecker taking a colony's flag or the capital.
{ // A choke: a line, then none for 20 s; not from a snake that's out; nobody speaks for you; Copycat in Chinese.
  const g = stage(['sniper', 'copycat'], { 0: [3, 20], 1: [12, 12], 2: [12, 18] }), [you, sniper, cat] = g.snakes;
  const choke = s => [{ type: 'choke', snake: s, x: s.body[0].x, y: s.body[0].y, tx: s.body[0].x, ty: s.body[0].y - 1 }];
  check(says(tick(g, choke(sniper)), sniper, VOICES.sniper.choke), 'Sniper chokes on its own bead: a choke line');
  check(tick(g, choke(sniper), 12000).length === 0, '...and none when it chokes again 12 s later');
  check(says(tick(g, choke(sniper), 9000), sniper, VOICES.sniper.choke), '...but another 21 s after the first');
  check(tick(g, choke(you), 5000).length === 0, 'you choke: nobody speaks for you');
  check(says(tick(g, choke(cat), 5000), cat, VOICES.copycat.choke), 'Copycat chokes: in Chinese');
  sniper.alive = false;
  check(tick(g, choke(sniper), 30000).length === 0, '...and a snake that\'s out says nothing');
}
{ // A choke is news: said even just after the crash that broke the bead off had its say (a crash's bonk, then the choke on its beads 1.9 s on), but never two lines in a tick.
  const g = stage(['sniper', 'joker'], { 0: [3, 20], 1: [12, 12], 2: [12, 18] }), [, sniper, joker] = g.snakes;
  const crash = s => ({ type: 'crash', snake: s, x: s.body[0].x + 1, y: s.body[0].y, killerId: null });
  const choke = s => ({ type: 'choke', snake: s, x: s.body[0].x, y: s.body[0].y, tx: s.body[0].x, ty: s.body[0].y - 1 });
  check(says(tick(g, [crash(sniper)]), sniper, VOICES.sniper.bonk), 'Sniper crashes: its bonk line');
  let h = tick(g, [choke(sniper)], 1900);
  check(says(h, sniper, VOICES.sniper.choke), `...and chokes on the beads it broke off 1.9 s later: its choke line too ("${lineOf(h, sniper)}")`);
  check(tick(g, [crash(sniper)], 5000).length === 1 && tick(g, [choke(sniper)], 1900).length === 0, '...but it crashes and chokes again 7 s on: the bonk, and no choke line (20 s between)');
  h = tick(g, [crash(joker), choke(joker)], 30000);
  check(h.filter(x => x.s === joker).length === 1, `a crash and a choke in the same tick: one line (${h.filter(x => x.s === joker).map(x => `"${x.text}"`).join(', ')})`);
}
{ // A windfall: what a choke spat or a cough nudged aside, eaten by a rival soon after (the same tick too): thanks, half the time, at most every 30 s.
  const g = stage(['vulture', 'gobbler'], { 0: [3, 20], 1: [12, 12], 2: [12, 18] }), [you, vul, gob] = g.snakes;
  const nudge = (s, x, y, tx, ty, kind = 'food') => ({ type: 'nudge', snake: s, kind, x, y, tx, ty });
  const eat = (s, x, y, kind = 'food') => ({ type: 'eat', snake: s, kind, x, y });
  const thanks = (h, s, who) => says(h, s, VOICES[s.personaKey].windfall, who);
  let h = tick(g, [eat(vul, 4, 19, 'pellet'), { type: 'choke', snake: you, x: 4, y: 20, tx: 4, ty: 19 }]);
  check(thanks(h, vul, you), `your bead, spat aside and eaten by Vulture the same tick: "${lineOf(h, vul)}"`);
  check(tick(g, [nudge(you, 5, 20, 5, 19), eat(gob, 5, 19)], 5000, 0.6).length === 0, 'an apple your cough nudged, eaten by Gobbler, and the roll says no: nothing');
  check(tick(g, [eat(gob, 5, 19)], 5000).length === 0, '...and that settled it: another apple there later is just an apple');
  tick(g, [nudge(you, 6, 20, 6, 19)], 100);
  check(tick(g, [eat(gob, 6, 19)], 7000).length === 0, 'one eaten 7 s after it was nudged: just an apple');
  tick(g, [nudge(gob, 7, 18, 7, 17)], 100);
  check(tick(g, [eat(gob, 7, 17)], 1500).length === 0, 'Gobbler eats what its own cough nudged, once it\'s over: nothing');
  tick(g, [nudge(you, 8, 20, 8, 19)], 100);
  check(tick(g, [eat(you, 8, 19)], 500).length === 0 && tick(g, [eat(gob, 8, 19)], 500).length === 0, 'you eat what your cough nudged: nothing, and that settled it');
  tick(g, [nudge(you, 9, 9, 9, 10, 'beetle')], 5000);
  h = tick(g, [eat(gob, 11, 11, 'beetle')], 1000);
  check(thanks(h, gob, you) && !says(h, gob, VOICES.gobbler.caught), `a beetle your cough nudged scurries off, and Gobbler catches it 3 cells on: thanks, not its catch line ("${lineOf(h, gob)}")`);
  check(!thanks(tick(g, [nudge(you, 4, 4, 4, 5), eat(gob, 4, 5)], 10000), gob, you), '...and no thanks again 10 s later');
  h = tick(g, [nudge(vul, 14, 4, 14, 5), eat(gob, 14, 5)], 25000);
  check(thanks(h, gob, vul), `...but 35 s after, for an apple Vulture's cough nudged: thanks, naming Vulture ("${lineOf(h, gob)}")`);
  tick(g, [nudge(you, 2, 2, 2, 3, 'beetle')], 40000);
  h = tick(g, [eat(gob, 9, 9, 'beetle')], 1000);
  check(!thanks(h, gob, you) && says(h, gob, VOICES.gobbler.caught), 'a beetle caught far from where it was nudged: its own catch, no thanks');
}
{ // Colonist: the woodpecker pecks out a colony's flag cell and the colony is lost: it says so, even just after another line, and the peck itself goes without its "pecked" line. Planting one too many lets the oldest go: no loss.
  const g = stage(['colonist'], { 0: [3, 22], 1: [22, 2] }), [, col] = g.snakes;
  const [one, two] = col.memory.colonies = [{ x: 6, y: 6, radius: 4, n: 1 }, { x: 14, y: 8, radius: 4, n: 2 }];
  col.memory.planted = 1;
  tick(g);
  check(tick(g, [{ type: 'peck', x: 14, y: 8, cells: [K(14, 8), K(15, 8)], under: [] }], 5000).length === 0, 'the woodpecker pecks out a flag cell: no "pecked" line');
  g.holes.add(K(14, 8)); g.holes.add(K(15, 8));
  check(says(tick(g, [{ type: 'rot', x: 7, y: 7, kind: 'apple' }], 5000), col, VOICES.colonist.colony.rotten), '...rot in the other colony: its line');
  col.memory.colonies = [one]; // (the AI drops the lost colony at once)
  let h = tick(g, [], 1000);
  check(says(h, col, VOICES.colonist.colony.lost), `...and the colony is lost a second later: "${lineOf(h, col)}"`);
  col.memory.colonies = [{ x: 18, y: 18, radius: 4, n: 3 }]; col.memory.planted = 2; // (a new flag, and the oldest let go)
  h = tick(g, [], 5000);
  check(says(h, col, VOICES.colonist.flag) && !says(h, col, VOICES.colonist.colony.lost), 'a new flag, the oldest let go: a flag line, no loss');
  void two;
}
{ // Sovereign: the woodpecker pecks out its capital and the realm moves at once: it says so, even just after another line; the peck itself goes without its "pecked" line; a drift elsewhere is a plain move.
  const g = stage(['sovereign'], { 0: [3, 22], 1: [20, 2] }), [, sov] = g.snakes;
  sov.memory.home = { x: 10, y: 10, radius: 3 };
  tick(g);
  check(tick(g, [{ type: 'peck', x: 10, y: 10, cells: [K(10, 10), K(10, 11)], under: [] }], 5000).length === 0, 'the woodpecker pecks out the capital: no "pecked" line');
  g.holes.add(K(10, 10)); g.holes.add(K(10, 11));
  check(says(tick(g, [{ type: 'rot', x: 11, y: 9, kind: 'apple' }], 5000), sov, VOICES.sovereign.realm.rotten), '...rot in the realm: its line');
  sov.memory.home = { x: 12, y: 10, radius: 3 }; // (the AI moves it at once, to good land)
  let h = tick(g, [], 1000);
  check(says(h, sov, VOICES.sovereign.realm.capital), `...and the realm moves off its pecked capital a second later: "${lineOf(h, sov)}"`);
  sov.memory.home = { x: 13, y: 10, radius: 4 };
  h = tick(g, [], 5000);
  check(says(h, sov, VOICES.sovereign.realm.grow) && !says(h, sov, VOICES.sovereign.realm.capital), 'later, it grows as it drifts: a grow line, not the capital again');
  sov.memory.home = { x: 14, y: 10, radius: 4 };
  check(says(tick(g, [], 5000), sov, VOICES.sovereign.realm.move), '...and a drift off good land: a plain move');
}
console.log('ok   choking: the choker\'s line at most every 20 s; a rival who eats what a choke spat or a cough nudged aside thanks the cougher, now and then; a colony or capital the woodpecker took is news, and its peck goes without the "pecked" line');
