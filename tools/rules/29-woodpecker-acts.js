// ---------------------------------------------------------------- entry 6: the woodpecker's three acts
// (38-the-woodpecker, "Its three acts": calm, the watcher, the first pecks, the frenzy; its gaze a tell.)

{ // The acts are drawn in their windows, each after the one before; a playtest's pins win, if they make sense.
  const make = E.createGame;
  let inWindows = true;
  for (let i = 0; i < 40; i++) {
    const { watch, pecks, frenzy } = make({ withPlayer: false, acts: null }).acts;
    const [w0, w1] = T.ACT_WATCH_MS, [p0, p1] = T.ACT_PECKS_MS, [f0, f1] = T.ACT_FRENZY_MS;
    if (!(watch >= w0 && watch <= w1 && pecks - watch >= p0 && pecks - watch <= p1 && frenzy - pecks >= f0 && frenzy - pecks <= f1)) inWindows = false;
  }
  check('each act starts at a random time in its window, after the one before', inWindows);
  const pinned = make({ withPlayer: false, acts: [70000, 140000, 200000] }).acts;
  check('...and ?acts= pins them', pinned.watch === 70000 && pinned.pecks === 140000 && pinned.frenzy === 200000, JSON.stringify(pinned));
  const odd = [[140000, 70000, 200000], [70000, NaN, 200000], [70000, 140000]].map(a => make({ withPlayer: false, acts: a }).acts);
  check('...but times out of order, or not numbers, or too few, are ignored', odd.every(a => a.watch >= T.ACT_WATCH_MS[0] && a.watch <= T.ACT_WATCH_MS[1]), JSON.stringify(odd));
}

// Two snakes far from the middle, held still (stunned) and fed; the round run on to `until`, starting at `from`.
const actsBoard = from => {
  const g = board([[line(4, 2, 4), 'right'], [line(4, 21, 4), 'right']], { time: from });
  g.weather = { kind: 'clear', since: 0, until: 1e9, nextGust: 0, nextStrike: 0 };
  for (const s of g.snakes) s.stunUntil = 1e9;
  return g;
};
const runTo = (g, until, each = () => {}) => {
  for (let n = 0; g.time < until && n < 2000; n++) {
    for (const s of g.snakes) { s.lastAte = g.time; s.nextStarve = g.time + T.HUNGER_MS; }
    E.step(g);
    each(g);
  }
};

{ // Act 1, the watcher: it comes at its time, and looks (a spot on the log), moving on 2 to 4 times; no pecks.
  const g = actsBoard(ACTS[0] - 500);
  const looks = new Set();
  let came = null, aims = 0;
  runTo(g, ACTS[1] - 100, g => {
    if (g.events.some(e => e.type === 'woodpecker')) came = g.time;
    if (g.woodpecker) looks.add(g.woodpecker.gaze);
    aims += g.events.filter(e => e.type === 'aim' || e.type === 'peck').length;
  });
  check('act 1: the woodpecker comes when the watcher\'s act starts', came !== null && came >= ACTS[0] && came < ACTS[0] + 200, `${came}`);
  check('...watches spots on the log, 3 to 5 in all (it moves on 2 to 4 times)', looks.size >= T.WATCH_LOOKS[0] + 1 && looks.size <= T.WATCH_LOOKS[1] + 1 && [...looks].every(k => k >= 0 && !g.holes.has(k)), [...looks].join());
  check('...and pecks nothing', aims === 0 && g.holes.size === 0);
  const v = E.aiView(g, g.snakes[0]);
  check('...and every rival sees the act, and where it looks', v.act === 1 && v.gaze === g.woodpecker.gaze);
}

{ // Act 2, the first pecks: its first cut starts where it looked last; a few cells a peck, a long rest; food still grows.
  const g = actsBoard(ACTS[0] - 500);
  let gaze = -1, first = null, rest = null, sizes = [];
  let grows = false;
  runTo(g, ACTS[2] - 100, g => {
    if (g.time > ACTS[1] + 10000 && !grows) { g.food = g.food.filter(f => f.kind !== 'food'); E.step(g); grows = g.food.some(f => f.kind === 'food'); }
    if (g.time < ACTS[1] && g.woodpecker) gaze = g.woodpecker.gaze;
    for (const e of g.events) if (e.type === 'peck') { sizes.push(e.cells.length - (e.fall || []).length); if (rest === null && first) rest = g.woodpecker.restUntil - g.woodpecker.struckAt; first ||= e.cells; }
  });
  check('...and food still grows', grows);
  const gx = gaze % T.GRID, gy = Math.floor(gaze / T.GRID);
  const near = first && first.some(k => Math.abs(k % T.GRID - gx) + Math.abs(Math.floor(k / T.GRID) - gy) <= T.GAZE_NEAR);
  check('act 2: its first cut starts where it looked last (its gaze is a tell)', near, `gaze ${gx},${gy}; patch ${first}`);
  check('...each peck a few cells of its outline (the piece it cuts loose aside), and a long rest between', sizes.length >= 2 && sizes.every(n => n <= T.CUT_STEP_2) && rest === T.FIRST_REST_TICKS, `${sizes} rest ${rest}`);
}

{ // Act 3, the frenzy: sudden death, nothing new grows, and it gets hungrier from its first strike in the frenzy.
  const g = actsBoard(ACTS[2] - 3000);
  runTo(g, ACTS[2] + 100);
  check('act 3: the frenzy is sudden death', E.actOf(g) === 3 && E.suddenDeath(g) && E.aiView(g, g.snakes[0]).act === 3);
  const w = g.woodpecker, rests = [];
  runTo(g, ACTS[2] + 15000, g => { if (g.events.some(e => e.type === 'peck')) rests.push(g.woodpecker.restUntil - g.woodpecker.struckAt); });
  check('...its rests from the frenzy\'s own, shorter with each piece that falls', rests.length >= 2 && rests.every((r, i) => !i || r <= rests[i - 1]) && rests.every(r => r === T.FIGHT_REST_TICKS || r <= T.PECK_REST_TICKS) && (!(w.fury > 0) || rests[rests.length - 1] < T.PECK_REST_TICKS), `${rests} fury ${w.fury}`);
}

{ // The rivals read it as a person does: the spot it watches is ground to linger in later. Heading right on row 12, a
  // choice of up or down at a wall (with no gaze, Drab goes up): with its gaze 2 below, still up; 2 above, down.
  const turn = gaze => () => aiView({ me: aiMe(line(20, 12, 5), 'right'), others: [aiRival(1, line(3, 2, 4), 'right')], act: 1, gaze,
    holes: new Set([K(21, 12), K(21, 11), K(21, 13)]) });
  const below = picks(turn(K(20, 14)), 'drab', 20), above = picks(turn(K(20, 10)), 'drab', 20);
  check('a rival keeps off the ground the watching woodpecker looks at', (below.up || 0) > (below.down || 0) && (above.down || 0) > (above.up || 0), `${JSON.stringify(below)} ${JSON.stringify(above)}`);
}

{ // In the frenzy everyone gets hungry FRENZY_HUNGER times as fast (part 3: a meal a trade-off to the end), the warning
  // reading it as everyone's bar does; before it, as ever. One tick, a fed snake: how much of its meal it used up.
  const used = from => {
    const g = actsBoard(from), s = g.snakes[0];
    s.lastAte = g.time; s.nextStarve = g.time + T.HUNGER_MS;
    const before = E.hungerLeft(g, s), t0 = g.time;
    E.step(g);
    return (before - E.hungerLeft(g, s)) / (g.time - t0);
  };
  const calm = used(FRENZY - 5000), frenzy = used(FRENZY + 5000);
  check('part 3: in the frenzy hunger runs FRENZY_HUNGER times as fast; before it, as ever', Math.abs(calm - 1) < 1e-9 && Math.abs(frenzy - T.FRENZY_HUNGER) < 1e-9, `${calm}, ${frenzy}`);
  const warnAt = from => { const g = actsBoard(from), s = g.snakes[0]; s.lastAte = g.time - 8000; s.nextStarve = g.time + T.HUNGER_MS - 8000; return E.hungerWarning(g, s); };
  check('...and the warning comes that much sooner by the clock on the wall', Math.abs(warnAt(FRENZY - 5000) / warnAt(FRENZY + 5000) - T.FRENZY_HUNGER) < 1e-9);
}
