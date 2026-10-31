// Adds rounds' numbers up (in round order, so the table's order and the
// fingerprint are the same whatever the cores, or the cache, did).
function merge(results, suddenAt) {
  const per = {}, total = totals();
  for (const r of results) {
    for (const k of ['rounds', 'timeSum', 'sudden', 'draws', 'stalled', 'beetles', 'caught', 'flown', 'crashes', 'alight', 'cuts', 'baked', 'ash', 'rot', 'rotBeads']) total[k] += r.total[k];
    total.times.push(...r.total.times);
    total.trace.push(...r.total.trace);
    for (const [c, n] of Object.entries(r.total.causes)) total.causes[c] = (total.causes[c] || 0) + n;
    for (const [k, v] of Object.entries(r.total.census)) {
      if (Array.isArray(v)) total.census[k].push(...v);
      else if (k === 'causesSD') for (const [c, n] of Object.entries(v)) total.census.causesSD[c] = (total.census.causesSD[c] || 0) + n;
      else total.census[k] += v;
    }
    for (const [name, p] of Object.entries(r.per)) {
      const t = (per[name] ||= { deaths: {} });
      for (const [k, v] of Object.entries(p)) {
        if (k === 'deaths' || k === 'sig') for (const [d, n] of Object.entries(v)) (t[k] ||= {})[d] = (t[k][d] || 0) + n;
        else t[k] = (t[k] || 0) + v;
      }
    }
  }
  // One fingerprint for the whole run, in round order.
  total.trace = total.trace.sort((a, b) => a[0] - b[0]).reduce((h, [, t]) => (h * 131 + t) % 1000000007, 7);
  return { per, total, suddenAt };
}

function report({ per, total, suddenAt }, withCensus) {
  const pct = (a, b) => Math.round(100 * a / Math.max(1, b));
  const times = total.times.sort((a, b) => a - b);
  const sec = ms => `${Math.round(ms / 1000)}s`;
  console.log(`${total.rounds} rounds · length median ${sec(times[times.length >> 1])}, middle half ${sec(times[times.length >> 2])}-${sec(times[(times.length * 3) >> 2])}`
    + ` · ${pct(total.sudden, total.rounds)}% reached the woodpecker (${sec(suddenAt)}) · draws ${total.draws} · stalled ${total.stalled}`);
  const each = n => (n / Math.max(1, total.rounds)).toFixed(1);
  console.log(`a round: ${each(total.crashes)} crashes survived, ${each(total.alight)} snakes set alight, ${each(total.cuts)} cut by a dash · food: ${each(total.baked)} baked, ${each(total.ash)} to ash, ${each(total.rot)} apples and ${each(total.rotBeads)} beads rotted`);
  if (total.beetles) console.log(`beetles: ${(total.beetles / total.rounds).toFixed(1)} a round, ${pct(total.caught, total.beetles)}% caught, ${pct(total.flown, total.beetles)}% flew off`);
  const deaths = Object.values(total.causes).reduce((a, b) => a + b, 0);
  console.log('deaths: ' + Object.entries(total.causes).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${pct(n, deaths)}%`).join(', ')
    + ` · into holes: ${((total.causes.hole || 0) / Math.max(1, total.sudden)).toFixed(2)} per woodpecker round`);
  console.log(`fingerprint ${total.trace}`);
  if (Object.values(per).some(p => p.versus)) { // (--versus: how each AI's snakes did)
    const sum = k => Object.values(per).reduce((n, p) => n + (p[k] || 0), 0), theirs = [sum('versusWins'), sum('versus')], mine = [sum('wins') - theirs[0], sum('rounds') - theirs[1]];
    console.log(`head to head: the --versus AI's snakes won ${theirs[0]} of ${theirs[1]} (${pct(...theirs)}%), this copy's ${mine[0]} of ${mine[1]} (${pct(...mine)}%)`);
  }
  if (withCensus) {
    const c = total.census, R = Math.max(1, total.rounds), sd = Math.max(1, total.sudden), a = n => (n / R).toFixed(2), of = n => `${pct(n, R)}%`;
    const snakeRounds = Object.values(per).reduce((n, p) => n + p.rounds, 0), minutes = Object.values(per).reduce((n, p) => n + p.aliveMs, 0) / 60000;
    const sdTimes = c.sdTimes.sort((x, y) => x - y), sdDeaths = Object.values(c.causesSD).reduce((x, y) => x + y, 0);
    console.log(`a round holds: golden apples ${a(c.golden)}, golden beetles ${a(c.goldBeetles)} (in ${of(c.goldBeetleRounds)} of rounds), golden leaves ${a(c.leaves)} (${of(c.leafRounds)}), golden mushrooms ${a(c.goldcaps)} (${of(c.goldcapRounds)}), mushrooms eaten ${a(c.mushrooms)}, lightning ${a(c.strikes)}`
      + ` · weather: sun ${a(c.sun)}, wind ${a(c.wind)}, rain ${a(c.rain)}, storms ${a(c.storm)} (in ${of(c.stormRounds)} of rounds), snow ${a(c.snow)}`);
    console.log(`sudden death: median ${sec(sdTimes[sdTimes.length >> 1] || 0)}, middle half ${sec(sdTimes[sdTimes.length >> 2] || 0)}-${sec(sdTimes[(sdTimes.length * 3) >> 2] || 0)} · the woodpecker strikes ${(c.pecks / sd).toFixed(1)} times, ${Math.round(c.holes / sd)} holes at the end`
      + ` · aims near a head (no spot clear of every head): ${c.aimsNear} of ${c.aims} · deaths: ` + Object.entries(c.causesSD).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${pct(n, sdDeaths)}%`).join(', '));
    console.log(`powers: ${(c.flashes / Math.max(1, minutes)).toFixed(1)} plain flashes a minute alive, ${a(c.jumps)} plain jumps a round, golden leaps ${pct(c.goldLeaps, c.goldGot)}% used, ${a(c.dashes)} dashes`
      + ` · golden power food: ${(c.pickups / Math.max(1, snakeRounds)).toFixed(2)} a snake a round (more than 2: ${pct(c.greedy, snakeRounds)}%) · a starvation before 1:00 in ${of(c.starvedEarly)} of rounds`);
    const hops = c.hop1 + c.hop2 + c.hop3;
    console.log(`the island hop: ${a(hops)} jumps a round, over 1/2/3 cells ${[c.hop1, c.hop2, c.hop3].map(n => pct(n, hops) + '%').join('/')}, over a hole ${pct(c.hopHole, hops)}% · landings that crashed ${pct(c.hopFail, hops)}% · out within 3 s of a jump ${pct(c.hopDie, hops)}% · down on another island smaller than itself ${a(c.smallIsle)} a round (${pct(c.smallIsle, hops)}% of jumps)`);
    const snakeTicks = c.aliveEarly + c.aliveLate, deathsAll = Object.values(total.causes).reduce((x, y) => x + y, 0);
    console.log(`the flashes cut: ${a(c.cutsPlain)} plain cuts and ${a(c.cutsGold)} golden a round (own tail dropped ${a(c.cutsOwn)}), neck cuts ${a(total.causes.cut || 0)}, failed flashes ${a(c.failed)} (${pct(c.failed, c.flashes + c.dashes)}% of flashes; dashes blown up ${a(c.failedGold)}) · along the edge ${(100 * c.edgeTicks / Math.max(1, snakeTicks)).toFixed(1)}% of snake-time; huggers (an eighth of their time or more) ${pct(c.huggers, c.huggers + c.others)}% of snakes, winning ${pct(c.huggerWins, c.huggers)}% (place ${(c.huggerPlace / Math.max(1, c.huggers)).toFixed(2)}) against ${pct(c.otherWins, c.others)}% (place ${(c.otherPlace / Math.max(1, c.others)).toFixed(2)})`);
    console.log(`bridges: ${a(c.rides)} rides a round, ${(100 * c.rideTicks / Math.max(1, snakeTicks)).toFixed(2)}% of snake-time on a back · out while riding ${c.rideDeaths} (falls ${c.rideFalls}): ${(1000 * c.rideDeaths / Math.max(1, c.rideTicks)).toFixed(1)} per 1000 ticks riding, against ${(1000 * (deathsAll - c.rideDeaths) / Math.max(1, snakeTicks - c.rideTicks)).toFixed(1)} off`);
    const share = (n, d) => (100 * n / Math.max(1, d)).toFixed(1) + '%';
    console.log(`hunger: before the woodpecker, ${share(c.hungryEarly, c.aliveEarly)} of snake-time in the hunger warning (${share(c.starvingEarly, c.aliveEarly)} starving); after, ${share(c.hungryLate, c.aliveLate)} (${share(c.starvingLate, c.aliveLate)})`
      + ` · meals a snake-minute mid-round (from HUNGER_MID_FROM_MS to the woodpecker) ${(c.mealsMid / Math.max(1e-9, c.midMs / 60000)).toFixed(1)}`);
    console.log(`leap now's refuge check: out within 3 s of a leap now ${pct(c.nowDie, c.leapsNow)}% of them · its users (more than the round's average) win ${pct(c.nowUserWins, c.nowUsers)}% (place ${(c.nowUserPlace / Math.max(1, c.nowUsers)).toFixed(2)}), the rest ${pct(c.nowOtherWins, c.nowOthers)}% (place ${(c.nowOtherPlace / Math.max(1, c.nowOthers)).toFixed(2)})`);
    console.log(`the golden flight and leap now: ${a(c.leapsNow)} leaps now a round, ${a(c.goldFlights)} golden flights (${(c.goldFlown / Math.max(1, c.goldFlights)).toFixed(2)} cells in the air each, ${a(c.airTurns)} turns in the air a round) · flights past the plain hop ${a(c.flyPast)} a round, out within 3 s of one ${pct(c.flyDie, c.flyPast)}% · bumps in the air ${a(c.bumps)} a round, down on a body (out) ${a(c.downOnBody)}`);
    console.log(`mushrooms come back up: ${a(c.mushrooms)} eaten a round, ${a(c.spits)} spat, ${a(c.spitHits)} on a head (${pct(c.spitHits, c.spits)}%), ${a(c.spitLies)} lying on the log`);
    console.log(`beads: ${a(c.beads)} eaten a round, ${share(c.ownBeads, c.beads)} of them by the snake they broke off · own beads squashed ${a(c.chokes)} a round (in ${of(c.chokeRounds)} of rounds)`);
    const chaseT = [...c.chaseTicks].sort((x, y) => x - y), escaped = c.chasesDived + c.chasesDug + c.chasesFlown;
    console.log(`beetles: above ground ${a(c.bugs)} times a round, and then caught ${share(c.bugsCaught, c.bugs)}, down a burrow ${share(c.bugsDived, c.bugs)}, dug in ${share(c.bugsDug, c.bugs)}, flew off ${share(c.bugsFlown, c.bugs)}, eaten by the woodpecker ${share(c.bugsPecked, c.bugs)}`
      + ` · chased (a head came within BEETLE_FEAR) ${a(c.chases)} a round: escaped ${share(escaped, c.chases)} (down a burrow ${share(c.chasesDived, c.chases)}, dug in ${share(c.chasesDug, c.chases)}, flew off ${share(c.chasesFlown, c.chases)}), caught ${share(c.chasesCaught, c.chases)} after a median ${chaseT.length ? chaseT[chaseT.length >> 1] : '-'} ticks`
      + ` · digs ${a(c.digs)} a round (caught while digging ${a(c.digsCaught)}) · dives into a burrow a dig left ${a(c.divesDugBurrow)} a round · burrows open ${(c.burrowTicks / Math.max(1, c.ticks)).toFixed(2)} on average · cells free for an apple before the woodpecker ${Math.round(c.freeEarly / Math.max(1, c.ticksEarly))} on average`);
    console.log(`beetles and the woodpecker: burrows cracked open ${a(c.burrowsOpened)} a round, open ${(c.sdBurrowTicks / Math.max(1, c.sdTicks)).toFixed(2)} on average once the woodpecker's here · beetles waiting under with no burrow ${(c.underWait / Math.max(1, c.ticks) * 100).toFixed(1)}% of ticks`
      + ` · under the beak as it aims ${a(c.beakBugs)} a round: ran off ${share(c.beakRan, c.beakBugs)}, down a burrow ${share(c.beakDived, c.beakBugs)}, dug in ${share(c.beakDug, c.beakBugs)}, caught ${share(c.beakCaught, c.beakBugs)}, eaten by the woodpecker ${share(c.beakPecked, c.beakBugs)}`);
    const knockT = [...c.knockedTicks].sort((x, y) => x - y);
    console.log(`the woodpecker's fairness: food knocked aside ${a(c.knocks)} a round (${a(c.knockedEaten)} eaten, with nowhere to knock it; ${a(c.knockedTaken)} eaten by a snake where it landed, within 6 s: within 2 s ${a(knockT.filter(n => n <= 20).length)}, a median ${knockT.length ? knockT[knockT.length >> 1] : '-'} ticks after the strike) · marks shutting a snake in ${a(c.seals)} a round; sealed deaths (out within 3 s of the strike) ${share(c.sealedOut, sdDeaths)} of sudden-death deaths`
      + ` · islands of 1-2 cells cut off ${(c.crumbs / sd).toFixed(2)} a woodpecker round (food on ${(c.crumbsFood / sd).toFixed(2)}, a snake on ${(c.crumbsSnake / sd).toFixed(2)})`
      + ` · the last snakes split onto islands of their own in ${of(c.split)} of rounds; the biggest island's won ${share(c.splitBiggest, c.split)} of those (a blind pick: ${share(c.splitChance, c.split)})`);
  }
  console.table(Object.entries(per).map(([name, p]) => ({
    name,
    rounds: p.rounds,
    'win%': pct(p.wins, p.rounds),
    place: +(p.placeSum / p.rounds).toFixed(2),
    food: +(p.eaten / p.rounds).toFixed(1),
    'meat%': pct(p.pellets, p.eaten),
    beetles: +(p.beetles / p.rounds).toFixed(2),
    kills: +(p.kills / p.rounds).toFixed(2),
    alive: sec(p.aliveMs / p.rounds),
    'self/wall%': pct((p.deaths.self || 0) + (p.deaths.wall || 0), p.rounds),
    'starved%': pct(p.deaths.starved || 0, p.rounds),
  })).sort((a, b) => b['win%'] - a['win%'] || a.place - b.place));
}

// --census, for each personality: a round's worth of each (or a minute alive's).
function reportCensus(per) {
  console.log('census, each personality (a round played; flashes and jumps a minute alive; golden: golden power food picked up)');
  console.table(Object.keys(per).sort().map(name => {
    const p = per[name], R = Math.max(1, p.rounds), minutes = Math.max(1e-9, p.aliveMs / 60000), f = (n, d = R) => +(n / d).toFixed(2);
    return { name, rounds: p.rounds, alive: `${Math.round(p.aliveMs / R / 1000)}s`, food: f(p.eaten), kills: f(p.kills), crashes: f(p.crashes), squashed: f(p.chokes), shrooms: f(p.shrooms), 'spit hits': f(p.hits), 'hit by': f(p.hitBy), 'leap now': f(p.now), bumps: f(p.bumps),
      'flash/min': f(p.flashes, minutes), 'jump/min': f(p.jumps, minutes), golden: f(p.golden), leaps: f(p.leaps), dashes: f(p.dashes) };
  }));
}

// --signatures: each trademark as a ratio of two sums (see SIGNS), for one
// personality and for the field (everyone else together).
const TRADEMARKS = [
  ['Mason', 'straight run', 'moves', 'runs', 1], ['Mason', 'body beside itself', 'beside', 'cells', '%'],
  ['Ouroboros', 'coiled (10 long or more)', 'coiled', 'long', '%'], ['Creeper', 'riding a tail', 'riding', 'ticks', '%'],
  ['Ghost', 'cells from the nearest head', 'apart', 'ticks', 1], ['Gobbler', 'share of the food', 'foodShare', 'rounds', '%'],
  ['Vulture', 'share of the beads', 'beadShare', 'rounds', '%'], ['Sovereign', 'at home', 'atHome', 'homeTicks', '%'],
  ['Mute', 'closing the box (its target within 4, of ticks hunting)', 'boxing', 'hunting', '%'], ['Joker', 'luring a rival on', 'luring', 'ticks', '%'],
  ['Desperado', 'skimming danger', 'skims', 'ticks', '%'], ['Star', 'flashes a minute', 'flashes', 'minutes', 1], ['Star', 'jumps a minute', 'jumps', 'minutes', 1],
];
function reportSignatures(per) {
  const sum = (names, k) => names.reduce((n, name) => n + (k === 'rounds' ? per[name].rounds : k === 'minutes' ? per[name].aliveMs / 60000 : per[name].sig[k]), 0);
  const ratio = (names, a, b, unit) => { const v = sum(names, a) / Math.max(1e-9, sum(names, b)); return unit === '%' ? (100 * v).toFixed(1) + '%' : v.toFixed(2); };
  const names = Object.keys(per);
  console.log('trademarks (each against the field: everyone else together)');
  for (const [who, what, a, b, unit] of TRADEMARKS) {
    if (!per[who]) continue;
    const field = names.filter(n => n !== who && sum([n], b) > 0);
    console.log(`  ${who}, ${what}: ${ratio([who], a, b, unit)} · field ${field.length ? ratio(field, a, b, unit) : 'none'}`);
  }
  // Capricious's impressions: each mood's trademark (its ticks in that mood;
  // a minute of them as long as its own minutes ran), against the rival's own.
  const cap = per.Capricious?.sig;
  if (cap) {
    const minute = cap.ticks / Math.max(1e-9, per.Capricious.aliveMs / 60000);
    const moodSum = (mood, k) => k === 'minutes' ? (cap[`${mood}.ticks`] || 0) / minute : k === 'rounds' ? NaN : cap[`${mood}.${k}`] || 0;
    console.log('Capricious\'s impressions (each mood\'s trademark, against the rival\'s own; shares of food and beads are a round\'s, so not shown)');
    for (const [who, what, a, b, unit] of [...TRADEMARKS, ['Gobbler', 'food a minute', 'eats', 'minutes', 1], ['Vulture', 'beads a minute', 'beadsEaten', 'minutes', 1]]) {
      const mood = who.toLowerCase(), d = moodSum(mood, b);
      if (!(d > 0)) continue;
      const v = moodSum(mood, a) / d;
      console.log(`  Capricious as ${who}, ${what}: ${unit === '%' ? (100 * v).toFixed(1) + '%' : v.toFixed(2)} · ${who} ${per[who] && sum([who], b) > 0 ? ratio([who], a, b, unit) : 'not played'}`);
    }
  }
  console.table(names.sort().map(name => {
    const one = [name], r = (a, b, unit) => sum(one, b) > 0 ? ratio(one, a, b, unit) : '';
    return { name, run: r('moves', 'runs', 1), beside: r('beside', 'cells', '%'), coiled: r('coiled', 'long', '%'), riding: r('riding', 'ticks', '%'), apart: r('apart', 'ticks', 1),
      food: r('foodShare', 'rounds', '%'), beads: r('beadShare', 'rounds', '%'), home: r('atHome', 'homeTicks', '%'), boxing: r('boxing', 'hunting', '%'), luring: r('luring', 'ticks', '%'),
      skims: r('skims', 'ticks', '%'), 'flash/min': r('flashes', 'minutes', 1), 'jump/min': r('jumps', 'minutes', 1) };
  }));
}
