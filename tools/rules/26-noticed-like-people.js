// ---------------------------------------------------------------- the rivals notice like people (2q)
// (39-the-rivals, "What a rival sees": a snake near a rival's head is seen REACTION_MS late, one across the
// board later, up to REACTION_FAR_MS, give or take a little that drifts; never going back in time.)

// How many ticks late snake 0 sees each other snake, read off the board's snapshots, over many ticks.
{
  const g = board([[line(3, 3, 4), 'right'], [line(3, 5, 4), 'right'], [line(12, 21, 4), 'right']], { time: 60000 });
  const lags = { near: [], far: [] }, seenAt = {};
  let tick = 0, back = 0;
  for (let t = 0; t < 80 && g.snakes.every(s => s.alive); t++) {
    const was = g.time;
    E.step(g); tick = g.time - was;
    const v = E.aiView(g, g.snakes[0]), last = g.history.length - 1;
    if (last < T.HISTORY - 1) continue;
    for (const o of v.others) {
      const k = [...g.history].reverse().findIndex(h => JSON.stringify(h.snakes.find(s => s.id === o.id)?.body) === JSON.stringify(o.body));
      lags[o.id === g.snakes[1].id ? 'near' : 'far'].push(k);
      if (g.tick - k < seenAt[o.id]) back++;
      seenAt[o.id] = g.tick - k;
    }
  }
  const near = T.REACTION_MS / tick, mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  check('2q: a snake beside a rival\'s head is seen its reaction time late, on average, give or take a tick',
    lags.near.length >= 6 && Math.min(...lags.near) >= Math.floor(near) && Math.abs(mean(lags.near) - near) < 0.6, `${lags.near.join(',')} (${near.toFixed(2)} ticks)`);
  check('2q: one across the board is seen later, up to REACTION_FAR_MS give or take',
    mean(lags.far) > mean(lags.near) + 0.5 && Math.max(...lags.far) <= Math.round((T.REACTION_FAR_MS + T.REACTION_JITTER_MS) / tick),
    `${lags.far.join(',')} (near ${lags.near.join(',')})`);
  check('2q: ...and what a rival sees of a snake never goes back in time', back === 0 && lags.far.length >= 6, `${back} times back`);
}
{ // ...over many moments: two snakes closing in and drawing apart, two steps a tick, at the fastest ticks.
  const noticeDelay = vm.runInContext('noticeDelay', ctx), me = { id: 2, body: [{ x: 0, y: 0 }] };
  let back = 0, prev = null;
  for (let tick = 0; tick < 4000; tick++) {
    const d = Math.abs((tick * 2) % 92 - 46); // (0 to 46 steps apart and back)
    const delay = noticeDelay({ tick }, me, { id: 5, body: [{ x: Math.min(23, d), y: Math.max(0, d - 23) }] }, T.MIN_TICK);
    if (prev != null && delay > prev + 1) back++;
    prev = delay;
  }
  check('2q: ...however the distance and the variation move', back === 0, `${back} times back`);
}
{ // ...nor when the rival's own head jumps across the board (over a wrapped edge): the snake beside it is now far off.
  const g = board([[line(3, 3, 4), 'right'], [line(3, 4, 4), 'right']], { time: 150000 }); // (the fastest ticks: the most ticks between near and far)
  for (let t = 0; t < 8; t++) E.step(g);
  const me = g.snakes[0], o = g.snakes[1], body = q => JSON.stringify(q.body);
  const lateOf = v => [...g.history].reverse().findIndex(h => body(h.snakes.find(s => s.id === o.id)) === body(v.others[0]));
  const before = lateOf(E.aiView(g, me));
  me.body = me.body.map((c, i) => ({ x: 23, y: 23 - i }));
  const after = lateOf(E.aiView(g, me));
  check('2q: ...nor when its own head jumps across the board', g.snakes.every(s => s.alive) && before >= 0 && after >= 0 && after <= before, `${before} then ${after} ticks late`);
}
