// Plays round r of the run, from its own seed, to its end; or goes on with
// one stored part way (saved: see --save-at). With saveAt, it stops at that
// game time instead and hands back the round as it stands (st, its own
// numbers so far among it, and where the random numbers had got to).
// A round's numbers are { per, total }, as merge() adds them up.
function playRound(E, T, r, { seed, ahead, signs, saveAt, seats }, saved) {
  // (Is any living head within the woodpecker's clearance of cell k?)
  const nearHead = (g, k) => g.snakes.some(s => s.alive && Math.abs(s.body[0].x - k % T.GRID) + Math.abs(s.body[0].y - Math.floor(k / T.GRID)) <= T.PECK_CLEARANCE);
  let st;
  if (saved) {
    st = saved.st;
    rng = seeded(saved.rng);
  } else {
    rng = seed == null ? Math.random : seeded(seed + r * 7919);
    const g = E.createGame({ withPlayer: false }), per = {}, total = totals();
    total.rounds = 1;
    for (const s of g.snakes) {
      per[s.name] ||= {
        rounds: 0, wins: 0, placeSum: 0, eaten: 0, pellets: 0, beetles: 0, kills: 0, aliveMs: 0, deaths: {},
        flashes: 0, jumps: 0, dashes: 0, leaps: 0, golden: 0, chokes: 0, crashes: 0, shrooms: 0, hits: 0, hitBy: 0, // (round six B: mushrooms eaten, spits that hit a head, and taken; (for --census: plain flashes and jumps, golden dashes and leaps, golden power food, own beads squashed (chokes before round six B), crashes survived)
        ...(signs ? { sig: Object.fromEntries(SIGNS.map(k => [k, 0])) } : {}),
      };
      per[s.name].rounds++;
      if (seats != null && s.id % 2 === seats) { // (--versus: this snake is the other AI's)
        if (!theirKeys.has(s.personaKey)) throw new Error(`the --versus copy's ai.js has no personality ${s.personaKey}`);
        theirs.add(s.memory);
        per[s.name].versus = 1;
      }
    }
    st = {
      g, per, total, trace: 0,
      was: g.snakes.map(s => ({ x: s.body[0].x, y: s.body[0].y, dir: s.dir, moved: false })), // (for --signatures)
      place: new Map(),
      seen: new Set(), picked: g.snakes.map(() => 0), // (what this round had; golden power food each snake ate)
      bugs: new Map(), sealed: [], split: null, // (for --census: each beetle above ground (the tick a head first came near it, or -1); [id, the strike's tick] of each snake a mark shut in; the last snakes' islands, once each has its own)
    };
  }
  const { g, per, total, was, place, seen, picked } = st, c = total.census, N = T.GRID;
  st.bugs ||= new Map(); st.sealed ||= []; // (a round stored before these were counted)
  for (const [k, v] of Object.entries(census())) if (!(k in c)) c[k] = v;
  land.holes = -1; // (the islands are worked out afresh for this round)
  let trace = st.trace;
  while (g.snakes.some(s => s.alive) && g.snakes.filter(s => s.alive).length > 1 && g.time < MAX_TIME) {
    if (saveAt != null && g.time >= saveAt) { st.trace = trace; return { r, state: { rng: rng.state(), st } }; }
    // In order, stopping at the first snake that must decide in the tick, so
    // the random numbers are drawn in the same order as without --ahead.
    if (ahead) for (const s of g.snakes) { if (!s.alive) continue; if (!E.canThinkAhead(g, s)) break; E.thinkAhead(g, s); }
    const held = g.snakes.map(s => s.leaps), late = E.suddenDeath(g);
    for (const s of g.snakes) if (s.alive) { const left = E.hungerLeft(g, s); c[late ? 'aliveLate' : 'aliveEarly']++; if (left < T.HUNGER_WARN_MS) c[late ? 'hungryLate' : 'hungryEarly']++; if (left < 0) c[late ? 'starvingLate' : 'starvingEarly']++; }
    const mid = !late && g.time >= T.HUNGER_MID_FROM_MS;
    if (mid) c.midMs += E.tickMs(g) * g.snakes.filter(s => s.alive).length;
    c.ticks++;
    c.burrowTicks += g.burrows.length;
    if (late) { c.sdTicks++; c.sdBurrowTicks += g.burrows.length; }
    for (const u of g.unders) if (g.tick >= u.until) c.underWait++;
    if (!late) { c.ticksEarly++; c.freeEarly += freeCells(g, N); }
    const bugs = g.food.filter(f => f.kind === 'beetle');
    for (const f of bugs) { const b = st.bugs.get(f); if (b && b.near < 0 && g.snakes.some(s => s.alive && Math.abs(s.body[0].x - f.x) + Math.abs(s.body[0].y - f.y) <= T.BEETLE_FEAR)) b.near = g.tick; }
    const riding = new Set(g.snakes.filter(s => s.alive && !s.flight && g.holes.has(s.body[0].y * N + s.body[0].x)));
    const dying = E.step(g);
    st.edge ||= g.snakes.map(() => [0, 0]); // (each snake's ticks alive, and with its head on the edge)
    for (const s of g.snakes) if (s.alive) { const h = s.body[0], on = h.x === 0 || h.y === 0 || h.x === N - 1 || h.y === N - 1; st.edge[s.id][0]++; if (on) { st.edge[s.id][1]++; c.edgeTicks++; } }
    for (const s of dying) if (/blew up/.test(s.cause || '')) c.failedGold++;
    for (const s of g.snakes) if (s.alive && !s.flight && g.holes.has(s.body[0].y * N + s.body[0].x)) { c.rideTicks++; if (!riding.has(s)) c.rides++; }
    for (const s of dying) if (riding.has(s)) { c.rideDeaths++; if (s.fatal === 'hole' || /hole/.test(s.cause || '')) c.rideFalls++; }
    beetleCensus(g, c, st, bugs);
    woodpeckerCensus(g, c, st, dying, N, T);
    if (mid) c.mealsMid += new Set(g.events.filter(e => e.type === 'eat' && e.kind !== 'mushroom').map(e => e.snake)).size;
    if (signs) signatures(g, T, per, was);
    for (const e of g.events) {
      if (e.type === 'leap') { // (the island hop: how far, over a hole, and when, for a jumper out soon after)
        c['hop' + Math.min(3, e.reach)]++;
        if (Array.from({ length: e.reach }, (_, i) => (e.y + e.snake.dir.y * i) * N + e.x + e.snake.dir.x * i).some(k => g.holes.has(k))) c.hopHole++;
        (st.hopAt ||= new Map()).set(e.snake, g.tick);
      }
      if (e.type === 'spawn' && e.kind === 'beetle') { total.beetles++; if (e.gold) { c.goldBeetles++; seen.add('goldBeetle'); } }
      else if (e.type === 'eat' && e.kind === 'beetle') { total.caught++; per[e.snake.name].beetles++; }
      else if (e.type === 'flown') total.flown++;
      else if (e.type === 'crash') { total.crashes++; per[e.snake.name].crashes++; if (e.snake.landing) c.hopFail++; if (e.failed) c.failed++; }
      else if (e.type === 'alight') total.alight++;
      else if (e.type === 'cut') { total.cuts++; if (e.by === e.snake.id) c.cutsOwn++; if (g.events.some(d => d.type === 'dash' && d.snake.id === e.by && d.plain)) c.cutsPlain++; else c.cutsGold++; }
      else if (e.type === 'baked') total.baked++;
      else if (e.type === 'ash') total.ash++;
      else if (e.type === 'rot') { if (e.kind === 'pellet') total.rotBeads++; else total.rot++; }
      // (the rest only for --census)
      else if ((e.type === 'spawn' && e.kind === 'golden') || e.type === 'rainbow') c.golden++;
      else if (e.type === 'spawn') { c[e.kind === 'leaf' ? 'leaves' : 'goldcaps']++; seen.add(e.kind); }
      else if (e.type === 'weather' && e.kind !== 'clear') { c[e.kind]++; seen.add(e.kind); }
      else if (e.type === 'strike') c.strikes++;
      else if (e.type === 'peck') c.pecks++;
      else if (e.type === 'aim') { c.aims++; if (g.woodpecker.target.some(k => nearHead(g, k))) c.aimsNear++; }
      else if (e.type === 'leap') { if (e.gold) { c.goldLeaps++; per[e.snake.name].leaps++; } else { c.jumps++; per[e.snake.name].jumps++; } }
      else if (e.type === 'dash') { if (e.plain) { c.flashes++; per[e.snake.name].flashes++; } else { c.dashes++; per[e.snake.name].dashes++; } }
      if (e.type === 'spit') { c.spits++; if (e.hit >= 0) { c.spitHits++; per[e.snake.name].hits++; per[g.snakes[e.hit].name].hitBy++; } else if (e.lx != null) c.spitLies++; }
      if (e.type === 'squash') { c.chokes++; per[e.snake.name].chokes++; seen.add('choke'); } // (round six B: its own bead squashed, counted where the chokes were)
      if (e.type === 'eat') {
        if (e.kind === 'pellet') { c.beads++; if (e.own) c.ownBeads++; }
        if (e.kind === 'mushroom') { c.mushrooms++; per[e.snake.name].shrooms++; }
        if (e.gold || e.kind === 'leaf' || e.kind === 'goldcap') picked[e.snake.id]++;
      }
    }
    // (golden leaps got: what's held now, and spent this tick, over what was held)
    for (const s of g.snakes) c.goldGot += Math.max(0, s.leaps + g.events.filter(e => e.type === 'leap' && e.gold && e.snake === s).length - held[s.id]);
    const left = g.snakes.filter(s => s.alive).length;
    for (const s of dying) {
      if (st.hopAt?.has(s) && g.tick - st.hopAt.get(s) <= 30) c.hopDie++;
      place.set(s, left + 1);
      per[s.name].aliveMs += g.time;
      const cause = causeOf(s);
      per[s.name].deaths[cause] = (per[s.name].deaths[cause] || 0) + 1;
      total.causes[cause] = (total.causes[cause] || 0) + 1;
      if (E.suddenDeath(g)) c.causesSD[cause] = (c.causesSD[cause] || 0) + 1;
      if (cause === 'starved' && g.time < 60000) seen.add('starvedEarly');
      const killer = g.snakes.find(o => o.name === s.killer && o !== s);
      if (killer) per[killer.name].kills++;
    }
    // A cheap fingerprint of every move, to compare runs exactly.
    for (const s of g.snakes) if (s.alive) trace = (trace * 31 + s.body[0].x * 24 + s.body[0].y + g.tick) % 1000000007;
  }
  total.trace.push([r, trace]);
  const alive = g.snakes.filter(s => s.alive);
  if (g.time >= MAX_TIME) total.stalled++;
  else if (alive.length === 1) { per[alive[0].name].wins++; place.set(alive[0], 1); }
  else total.draws++;
  const food = g.snakes.reduce((n, s) => n + s.eaten, 0), beads = g.snakes.reduce((n, s) => n + s.pellets, 0);
  for (const s of g.snakes) { // (the edge's huggers, and the rest)
    const [ticks, on] = st.edge?.[s.id] || [0, 0], hug = ticks && on >= ticks / 8, won = alive.length === 1 && alive[0] === s && g.time < MAX_TIME ? 1 : 0;
    c[hug ? 'huggers' : 'others']++; c[hug ? 'huggerWins' : 'otherWins'] += won; c[hug ? 'huggerPlace' : 'otherPlace'] += place.get(s) || 1;
  }
  for (const s of g.snakes) {
    const p = per[s.name];
    p.placeSum += place.get(s) || 1;
    p.eaten += s.eaten;
    p.pellets += s.pellets;
    p.golden += picked[s.id];
    if (s.alive) p.aliveMs += g.time;
    if (p.versus) p.versusWins = p.wins;
    if (signs) { p.sig.foodShare += s.eaten / Math.max(1, food); p.sig.beadShare += s.pellets / Math.max(1, beads); }
  }
  total.timeSum += g.time;
  total.times.push(g.time);
  if (E.suddenDeath(g)) { total.sudden++; c.sdTimes.push(g.time - T.SUDDEN_DEATH_MS); c.holes += g.holes.size; }
  if (st.split && alive.length === 1 && g.time < MAX_TIME) { // (the last snakes on islands of their own: did the biggest island's win?)
    const sizes = Object.entries(st.split.size), most = Math.max(...sizes.map(([, n]) => n)), top = sizes.filter(([, n]) => n === most).map(([id]) => +id);
    c.split++;
    c.splitChance += 1 / st.split.n;
    if (top.includes(alive[0].id)) c.splitBiggest += 1 / top.length;
  }
  for (const k of ['goldBeetle', 'leaf', 'goldcap', 'storm', 'starvedEarly', 'choke']) if (seen.has(k)) c[k === 'starvedEarly' ? k : k + 'Rounds']++;
  for (const n of picked) { c.pickups += n; if (n > 2) c.greedy++; }
  return { r, result: { per, total } };
}
