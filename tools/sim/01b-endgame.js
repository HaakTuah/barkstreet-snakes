// --census, the endgame (2h): in sudden death, how often a snake is in a
// pocket smaller than itself (its timed room, tails leaving, below its
// length), the deaths there (boxed in 2 s or more before: sealed in, not a
// last wrong turn), the meals it ate there (growing into the room
// it needs to turn in) and its own tail dropped (and whether it lived 5 s on).
const endgameCounts = () => ({ sdPocketDeaths: 0, sdSealedDeaths: 0, sdBoxed: 0, sdBoxedMeals: 0, sdMeals: 0, sdDrops: 0, sdDropsLived: 0, sdDropsFree: 0, sdLenSum: 0, sdLenTicks: 0 });
function endgameCensus(g, c, st, dying, N) {
  const pocket = st.pocket ||= new Map(); // (the ids in a pocket smaller than themselves as of the last tick, and since when)
  for (const s of dying) { if (pocket.has(s.id)) { c.sdPocketDeaths++; if (g.tick - pocket.get(s.id) > 20) c.sdSealedDeaths++; } }
  for (const e of g.events) {
    if (e.type === 'eat' && e.kind !== 'mushroom') { c.sdMeals++; if (pocket.has(e.snake.id)) c.sdBoxedMeals++; }
    if (e.type === 'cut' && e.by === e.snake.id) { c.sdDrops++; const p = st.per[e.snake.name]; p.sdDrops = (p.sdDrops || 0) + 1; if (!pocket.has(e.snake.id)) c.sdDropsFree++; (st.dropAt ||= new Map()).set(e.snake, g.tick); }
  }
  if (st.dropAt) for (const [s, at] of st.dropAt) if (!s.alive || g.tick - at >= 50) { if (s.alive) { c.sdDropsLived++; const p = st.per[s.name]; p.sdDropsLived = (p.sdDropsLived || 0) + 1; } st.dropAt.delete(s); }
  timedGrid(g, N);
  const now = new Map();
  for (const s of g.snakes) {
    if (!s.alive || s.flight) continue;
    const need = s.body.length + Math.max(0, s.grow);
    c.sdLenSum += s.body.length; c.sdLenTicks++;
    if (timedRoom(g, N, s, null, need) < need) { now.set(s.id, pocket.get(s.id) ?? g.tick); if (!pocket.has(s.id)) c.sdBoxed++; }
  }
  st.pocket = now;
}
const endgameLine = (c, sdDeaths, sd, per) => `the endgame (2h): boxed in (a pocket smaller than the snake) ${(c.sdBoxed / sd).toFixed(2)} times a woodpecker round; deaths there ${(100 * c.sdPocketDeaths / Math.max(1, sdDeaths)).toFixed(1)}% of sudden death's, boxed in 2 s or more ${(100 * c.sdSealedDeaths / Math.max(1, sdDeaths)).toFixed(1)}% · a snake ${(c.sdLenSum / Math.max(1, c.sdLenTicks)).toFixed(1)} long on average`
  + ` · meals eaten boxed in ${(100 * c.sdBoxedMeals / Math.max(1, c.sdMeals)).toFixed(1)}% of sudden death's ${(c.sdMeals / sd).toFixed(1)} a round`
  + ` · own tail dropped ${(c.sdDrops / sd).toFixed(2)} a woodpecker round (before boxed in ${c.sdDropsFree}, alive 5 s on ${c.sdDropsLived} of ${c.sdDrops})`
  + ` · own tail dropped by rival (alive 5 s on): ${Object.entries(per).filter(([, p]) => p.sdDrops).sort((x, y) => y[1].sdDrops - x[1].sdDrops).map(([n, p]) => `${n} ${p.sdDrops} (${p.sdDropsLived || 0})`).join(', ') || 'none'}`;
