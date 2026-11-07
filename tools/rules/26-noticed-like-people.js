// ---------------------------------------------------------------- the rivals notice like people (2q)
// (39-the-rivals, "What a rival sees": a snake near a rival's head is seen REACTION_MS late, one across the
// board later, up to REACTION_FAR_MS, give or take a little; never sooner than REACTION_MS.)

// How many ticks late snake 0 sees each other snake, read off the board's snapshots, over many ticks.
{
  const g = board([[line(3, 3, 4), 'right'], [line(3, 5, 4), 'right'], [line(3, 21, 4), 'right']], { time: 60000 });
  const lags = { near: [], far: [] };
  let tick = 0;
  for (let t = 0; t < 40 && g.snakes.every(s => s.alive); t++) {
    const was = g.time;
    E.step(g); tick = g.time - was;
    const me = g.snakes[0], v = E.aiView(g, me), last = g.history.length - 1;
    if (last < T.HISTORY - 1) continue;
    for (const o of v.others) {
      const k = [...g.history].reverse().findIndex(h => JSON.stringify(h.snakes.find(s => s.id === o.id)?.body) === JSON.stringify(o.body));
      lags[o.id === g.snakes[1].id ? 'near' : 'far'].push(k);
    }
  }
  const base = Math.max(1, Math.round(T.REACTION_MS / tick));
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  check('2q: a snake beside a rival\'s head is seen its reaction time late, never sooner',
    lags.near.length >= 6 && Math.min(...lags.near) >= base && mean(lags.near) < base + 1, `${lags.near.join(',')} (base ${base})`);
  check('2q: one across the board is seen later, up to REACTION_FAR_MS give or take, and not always the same',
    mean(lags.far) > mean(lags.near) && Math.max(...lags.far) <= Math.round((T.REACTION_FAR_MS + T.REACTION_JITTER_MS) / tick) && new Set(lags.far).size > 1,
    `${lags.far.join(',')} (near ${lags.near.join(',')})`);
}
