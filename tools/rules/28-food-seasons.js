// ---------------------------------------------------------------- 2i: food seasons
// (The queue's entry: "if food levels varied more, that would change things up.") Each round draws lean, normal or
// plentiful; everyone sees it.

{ // A season's apples: one fewer when lean, one more in plenty; in winter too, never none.
  const count = (season, snow) => {
    const g = board([[line(5, 5, 3), 'right'], [[[5, 15], [4, 15], [3, 15]], 'right']], { season });
    if (snow) g.weather = { kind: 'snow', since: 0, until: 1e9, nextGust: 0, nextStrike: 0 };
    g.food = [];
    E.step(g);
    return g.food.filter(f => f.kind === 'food').length;
  };
  check('a lean season keeps one apple fewer, a plentiful one one more', count('lean') === T.APPLES - 1 && count('normal') === T.APPLES && count('plentiful') === T.APPLES + 1, [count('lean'), count('normal'), count('plentiful')].join());
  check('...and in winter, never none', count('lean', true) === 1 && count('plentiful', true) === T.SNOW_APPLES + 1);
}

{ // Beetles: fewer in a lean season, more in plenty. With the draw for a beetle between the lean chance and the plain
  // one, one comes out in a normal season but not a lean one; between the plain and the plentiful, only in plenty.
  const out = (season, draw) => {
    const g = board([[line(5, 5, 3), 'right']], { season, time: T.BEETLE_FIRST_MS });
    g.food = [{ x: 20, y: 20, kind: 'food' }, { x: 20, y: 18, kind: 'food' }, { x: 18, y: 20, kind: 'food' }, { x: 2, y: 20, kind: 'mushroom' }, { x: 2, y: 18, kind: 'mushroom' }];
    return seededWhile(5, () => { const r = Math.random; Math.random = () => draw; try { E.step(g); } finally { Math.random = r; } return g.food.some(f => f.kind === 'beetle'); });
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
