// ---------------------------------------------------------------- round six B (2m): beetles and the woodpecker
// A beetle under the beak (on the woodpecker's mark as it aims) treats it as danger: it runs for a burrow in reach if it
// can get there before the strike and dives in, else off the mark, else it digs in if it can be gone in time (leaving no
// burrow in the mark); one still there at the strike is the bird's. None comes up under the beak. (The burrows keeping up,
// and the bird eating one too late to run, are in 10-beetles.js and 09-woodpecker.js.)
const beakBoard = (mark, ahead, { burrows = [] } = {}) => {
  const g = board([[line(3, 3, 4), 'right'], [line(20, 22, 4), 'right']], { time: T.SUDDEN_DEATH_MS + 5000 });
  for (const o of g.snakes) o.stunUntil = 1e9; // (nobody moves: only the beak scares it)
  g.burrows = burrows.map(([x, y]) => ({ x, y, at: 0, used: 0 }));
  g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }]; // (no more come out meanwhile)
  g.woodpecker = { x: 12, y: 12, at: g.time, target: mark.map(([x, y]) => K(x, y)), strikeAt: g.tick + ahead, last: [], struckAt: -1, restUntil: 1e9 };
  return g;
};
// Steps through the strike; what the beetle did (dig, dive, the knock that ate it) and where it ended up.
const throughStrike = (g, bug) => {
  const seen = [];
  for (let t = 0; t < 30 && g.woodpecker.target.length; t++) { feed(g); kept(g); for (const e of g.events) if (['dig', 'dive', 'knock', 'burrow'].includes(e.type)) seen.push({ type: e.type, x: e.x, y: e.y, ...(e.dug ? { dug: 1 } : {}), ...(e.type === 'knock' ? { tx: e.tx } : {}) }); }
  return { seen, alive: g.food.includes(bug), at: [bug.x, bug.y], under: g.unders.length };
};

{ // A burrow in reach, beyond the mark: it runs there across the mark and dives in before the strike.
  const mark = rect(10, 9, 14, 11), g = beakBoard(mark, 12, { burrows: [[16, 10]] });
  const [bug] = lay(g, { x: 12, y: 10, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10 });
  const r = throughStrike(g, bug);
  check('a beetle under the beak runs for a burrow it can reach before the strike, and dives in', !r.alive && r.seen.some(e => e.type === 'dive' && !e.dug && e.x === 16 && e.y === 10) && !r.seen.some(e => e.type === 'knock'), JSON.stringify(r));
}

{ // No burrow: it runs off the mark, and is still out when the strike's done.
  const mark = rect(10, 9, 14, 11), g = beakBoard(mark, 12);
  const [bug] = lay(g, { x: 12, y: 10, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10 });
  const r = throughStrike(g, bug);
  check('...with none, it runs off the mark, and is out after the strike', r.alive && !mark.some(([x, y]) => x === bug.x && y === bug.y) && !g.holes.has(K(bug.x, bug.y)) && !r.seen.some(e => e.type === 'knock' || e.type === 'dig'), JSON.stringify(r));
}

{ // Too far in to run off in time, it digs in (gone before the strike), leaving no burrow where the beak's coming.
  const mark = rect(7, 6, 15, 14), g = beakBoard(mark, 7); // (9 by 9: the middle is 5 from the bark, 9 ticks' scurry; a dig takes 6)
  const [bug] = lay(g, { x: 11, y: 10, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10 });
  const r = throughStrike(g, bug);
  check('...too far in to get off in time, it digs in and is gone before the strike, leaving no burrow in the mark', !r.alive && r.seen[0]?.type === 'dig' && r.seen.some(e => e.type === 'dive' && e.dug) && !r.seen.some(e => e.type === 'knock' || e.type === 'burrow') && r.under === 2 && !g.burrows.some(b => b.x === 11 && b.y === 10), JSON.stringify(r));
}

{ // One already digging that won't be gone in time stops, and runs.
  const mark = rect(10, 9, 14, 11), g = beakBoard(mark, 8);
  const [bug] = lay(g, { x: 12, y: 10, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10, digUntil: g.tick + 20 });
  const r = throughStrike(g, bug);
  check('...one digging that wouldn\'t be gone in time stops, and runs off the mark', r.alive && !('digUntil' in bug) && !mark.some(([x, y]) => x === bug.x && y === bug.y), JSON.stringify(r));
}

{ // None comes up under the beak: due up, it takes a burrow off the mark, though the one on it is quieter.
  const g = beakBoard(rect(18, 18, 20, 20), 12, { burrows: [[19, 19], [8, 3]] });
  g.snakes[1].body = cellsOf(line(14, 3, 4)); // (a head near the burrow off the mark)
  g.food = []; g.unders = [{ until: 0, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }];
  E.step(g);
  const out = g.food.find(f => f.kind === 'beetle');
  check('none comes up under the beak: it takes a burrow off the mark', out && out.x === 8 && out.y === 3, JSON.stringify(out));
}

{ // The rivals read it: a beetle under the beak with a burrow beyond is read as gone down it (not worth the chase: Drab
  // takes the apple up the board); with none, it runs off the mark toward Drab's side, and Drab goes for it.
  const MARK2 = rect(12, 11, 14, 13).map(([x, y]) => K(x, y));
  const view = burrows => () => aiView({ me: aiMe(line(8, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], tick: 10, timeMs: T.SUDDEN_DEATH_MS + 5000,
    holes: new Set(MARK2), pecks: new Set(MARK2), strikeAt: 20, burrows,
    food: [{ x: 12, y: 12, kind: 'beetle', expires: 999, dir: D.left, movedAt: 0 }, { x: 8, y: 7, kind: 'food', expires: 999 }] });
  const home = picks(view([{ x: 16, y: 12, at: 0 }]), 'drab', 20), off = picks(view([]), 'drab', 20);
  check('an AI reads a beetle under the beak: bound for a burrow beyond, it isn\'t chased', home.up === 20, JSON.stringify(home));
  check('...and with none, it comes off the mark, and the AI goes for it', off.right === 20, JSON.stringify(off));
}
