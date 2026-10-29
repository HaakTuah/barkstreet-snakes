// ---------------------------------------------------------------- round six A: the rivals
// What an AI sees of a hand-built game, as it stands, coughs included.
const lookNow = g => {
  look(g);
  g.history[0].snakes.forEach(o => { o.cough = Math.max(0, g.snakes[o.id].coughUntil - g.tick); });
};
const ownBead = (x, y, owner = 0) => ({ x, y, kind: 'pellet', owner, color: '#000', expires: 999 });
const dirOf = d => Object.keys(D).find(k => D[k] === d);

{ // A beetle runs for its burrow: one bound to get there first isn't worth the chase. Heading right, a beetle 3 on (scared,
  // making for its burrow two beyond), an apple 4 up: with the burrow there, it takes the apple; with none there (closed
  // over), the beetle, cornered, digs in where it is and stays put, and it takes that. It sees the burrows as they are
  // (view.burrows: every burrow on the board, as anyone sees them), not as it last saw a beetle use one.
  const view = burrows => () => aiView({ me: aiMe(line(10, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], tick: 10, burrows,
    food: [{ x: 13, y: 12, kind: 'beetle', expires: 999, dir: D.right, movedAt: 0, px: 12, py: 12, scared: true }, { x: 10, y: 8, kind: 'food', expires: 999 }] });
  const there = picks(view([{ x: 15, y: 12, at: 0 }]), 'drab', 20), gone = picks(view([]), 'drab', 20);
  check("an AI doesn't chase a beetle bound to dive into its burrow first", there.up === 20, JSON.stringify(there));
  check('...but with no burrow there (it sees the burrows as they are), the beetle digs in, and it takes that', gone.right === 20, JSON.stringify(gone));
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
