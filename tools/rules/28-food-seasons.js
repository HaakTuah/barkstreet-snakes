// ---------------------------------------------------------------- 2i: food seasons
// (The queue's entry: "if food levels varied more, that would change things up.") Each round draws lean, normal or
// plentiful; everyone sees it.

{ // A season's apples: one fewer when lean (from the first beetles: #616), one more in plenty; in winter too, never none.
  const count = (season, snow, at = T.BEETLE_FIRST_MS) => {
    const g = board([[line(5, 5, 3), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']], { season });
    g.time = at;
    if (snow) g.weather = { kind: 'snow', since: 0, until: 1e9, nextGust: 0, nextStrike: 0 };
    g.food = [];
    E.step(g);
    return g.food.filter(f => f.kind === 'food').length;
  };
  check('a lean season keeps one apple fewer, a plentiful one one more', count('lean') === T.APPLES - 1 && count('normal') === T.APPLES && count('plentiful') === T.APPLES + 1, [count('lean'), count('normal'), count('plentiful')].join());
  check('...but in the opening, a lean one keeps them all', count('lean', false, 0) === T.APPLES && count('plentiful', false, 0) === T.APPLES + 1);
  check('...and in winter, never none', count('lean', true) === 1 && count('plentiful', true) === T.SNOW_APPLES + 1);
}

{ // Beetles: fewer in a lean season, more in plenty. With the draw for a beetle between the lean chance and the plain
  // one, one comes out in a normal season but not a lean one; between the plain and the plentiful, only in plenty.
  const out = (season, draw) => {
    const g = board([[line(5, 5, 3), 'right']], { season, time: T.BEETLE_FIRST_MS });
    g.food = [{ x: 20, y: 20, kind: 'food' }, { x: 20, y: 18, kind: 'food' }, { x: 18, y: 20, kind: 'food' }, { x: 2, y: 20, kind: 'mushroom' }, { x: 2, y: 18, kind: 'mushroom' }];
    const r = ctx.luck; ctx.luck = () => draw; // (every draw the rules make: luck in engine/core.js)
    try { E.step(g); } finally { ctx.luck = r; }
    return g.food.some(f => f.kind === 'beetle');
  };
  const S = T.SEASONS, low = T.BEETLE_CHANCE * (S.lean.beetles + S.normal.beetles) / 2, high = T.BEETLE_CHANCE * (S.normal.beetles + S.plentiful.beetles) / 2;
  check('beetles come out less often in a lean season', !out('lean', low) && out('normal', low));
  check('...and more often in plenty', !out('normal', high) && out('plentiful', high));
}

{ // The season is drawn by its odds (about a quarter lean, half normal, a quarter plentiful), and everyone sees it.
  const n = { lean: 0, normal: 0, plentiful: 0 };
  for (let r = 0; r < 400; r++) n[E.createGame({ withPlayer: false }).season]++;
  check('seasons come by their odds', n.lean > 70 && n.lean < 130 && n.plentiful > 70 && n.plentiful < 130 && n.normal > 160, JSON.stringify(n));
  const g = E.createGame({ withPlayer: false, season: 'lean' });
  check('...and every rival sees the season, as it sees the weather', g.season === 'lean' && g.snakes.every(s => E.aiView(g, s).season === 'lean'));
}

{ // A lean season's meal keeps a snake SEASONS.lean.meal as long, mid-round and before.
  const lasts = (season, time) => {
    const g = board([[line(5, 5, 4), 'right']], { season, time, food: [[6, 5]] });
    Object.assign(g.snakes[0], { lastAte: time - T.HUNGER_MS + 1000, nextStarve: time + 1000 }); // (hungry)
    E.step(g);
    return g.snakes[0].mealMs;
  };
  check('a lean meal keeps a snake less long (mid-round and in the opening), a plentiful one as a normal one',
    lasts('lean', 60000) === T.HUNGER_MS * T.SEASONS.lean.meal && lasts('normal', 60000) === T.HUNGER_MS && lasts('plentiful', 60000) === T.HUNGER_MS
    && lasts('lean', 5000) === T.HUNGER_MS * T.SEASONS.lean.meal, [lasts('lean', 60000), lasts('normal', 60000), lasts('lean', 5000)].join());
}
{ // ...but a meal never leaves a snake less time than it had: a lean apple in the first seconds keeps the start's longer clock.
  const g = board([[line(5, 5, 4), 'right']], { season: 'lean', time: 100, food: [[6, 5]] });
  const before = g.snakes[0].nextStarve;
  E.step(g);
  check('an early lean meal never brings starving forward', g.snakes[0].eaten === 1 && g.snakes[0].nextStarve >= before, [before, g.snakes[0].nextStarve].join());
}

// The rivals play the season. A long snake, an apple three cells to its side (below), nobody near.
const seasonTakes = (season, key, len, others = [aiRival(1, [[22, 2], [22, 3], [22, 4]], 'down')]) => {
  const cells = [];
  for (let i = 0, x = 10, y = 12; i < len; i++) { cells.push([x, y]); if (i < 9) x--; else if (y < 22) y++; else x++; }
  let toward = 0;
  for (let i = 0; i < 6; i++) if (AI.decide(aiView({ season, food: [{ x: 10, y: 15, kind: 'food', expires: 999 }], me: aiMe(cells, 'right'), others }), AI.PERSONAS[key], {}).y === 1) toward++;
  return toward >= 5;
};
{ // Lean: nobody is too fed to eat. Ghost and Sniper, fed past their length (hungryBelow), pass it up in a normal round, not in a lean one.
  const fed = ['ghost', 'sniper'].map(k => [seasonTakes('normal', k, 22), seasonTakes('lean', k, 22)]);
  check('in a lean season no rival is too fed to eat (Ghost and Sniper, long and fed, take an apple they pass up in a normal round)', fed.every(([n, l]) => !n && l), JSON.stringify(fed));
}
{ // Plentiful: on a crowded log a long rival weighs growing against the room it costs (as in the endgame): it passes up an apple it takes in a normal round.
  const row = (y0, n) => { const c = []; for (let i = 0, x = 23, y = y0, d = -1; i < n; i++) { c.push([x, y]); x += d; if (x < 0 || x > 23) { d = -d; x += d; y++; } } return c; };
  const crowd = [aiRival(1, row(0, 60), 'left'), aiRival(2, row(4, 60), 'left'), aiRival(3, row(8, 40), 'left')];
  const took = ['drab', 'mute'].map(k => [seasonTakes('normal', k, 40, crowd), seasonTakes('plentiful', k, 40, crowd)]);
  check('in a plentiful season a long rival on a crowded log passes up growth it takes in a normal round (Drab, Mute)', took.every(([n, p]) => n && !p), JSON.stringify(took));
}
