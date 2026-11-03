// Food: how desperate I am, how much food matters now (and my nerve at a
// contested apple), and what each thing on the board is worth to me,
// knocked food and burrows included.

// Desperate: hunger will finish me soon. My own clock, as a person sees
// their bar: till my next shrink, then a segment every STARVE_EVERY_MS
// down to my smallest (all of it faster in snow). Nothing else matters
// now: no errands, any food I can reach in time (a rival's too), and
// risks I wouldn't take otherwise. With no food in reach, I hunt: a
// rival that crashes drops beads.
// (readDesperation() sets these for each decision:)
let myLen, winter, lifeMs, lifeTicks, desperate;
function readDesperation() {
  myLen = me.body.length + me.grow;
  winter = view.weather === 'snow';
  lifeMs = me.starveIn == null ? Infinity : (me.starveIn + (myLen - TUNE.MIN_LENGTH) * TUNE.STARVE_EVERY_MS) / (winter ? TUNE.SNOW_HUNGER : 1);
  lifeTicks = lifeMs / Math.max(TUNE.MIN_TICK, TUNE.START_TICK - (TUNE.START_TICK - TUNE.MIN_TICK) * view.timeMs / TUNE.RAMP_MS);
  desperate = lifeMs < TUNE.AI_DESPERATE_MS;
  memory.desperate = desperate;
  if (desperate) {
    const w0 = intent.w;
    intent.w = {
      ...w0, contested: 1, foodRange: Math.max(60, w0.foodRange), normalFood: 1, pellet: Math.max(1, w0.pellet ?? 1), mushroom: -TUNE.SHRINK,
      margin: Math.min(2, w0.margin), headRisk: 0.4 * w0.headRisk, zoneRisk: 0.3 * w0.zoneRisk,
      territory: 0.5 * w0.territory, aggression: 0, distance: 0, tail: 0, thrill: 0, turn: 0, coil: null, thick: 0, hunt: HUNT,
    };
    intent.victim = -1; intent.target = null; intent.lure = -1; intent.avoid = null; intent.home = null; intent.mimicDir = null; intent.goal = null;
    const meal = f => f.kind !== 'mushroom' && !(f.kind === 'pellet' && f.owner === me.id) && manhattan(f, myHead) <= lifeTicks;
    if (others.length && !food.some(meal)) pickVictim(all, HUNT);
  }
}

// How much food matters right now, given how long I already am. Hunger
// trumps that: with under 10 s before I start starving, everyone goes
// looking for food, harder the closer it gets (and food a rival may
// reach first counts for more); desperate, harder still.
// (readAppetite() sets these for each decision:)
let hunger, lean, fed, foodW0, eatW0, foodW, eatW, contested, starved, nerveKeep;
function readAppetite() {
  hunger = me.hungerLeft == null ? 0 : Math.min(1, Math.max(0, (TUNE.AI_HUNGRY_MS - me.hungerLeft) / TUNE.AI_HUNGRY_MS));
  // (Once the woodpecker's here nothing new grows: nobody can afford to be picky.)
  lean = view.timeMs >= TUNE.SUDDEN_DEATH_MS;
  fed = !hunger && !lean && myLen >= (w.hungryBelow ?? Infinity);
  foodW0 = fed ? w.food * w.fedFactor : Math.max(w.food, 8 * hunger) * (1 + 2 * hunger);
  eatW0 = fed ? w.eat * w.fedFactor : Math.max(w.eat, 150 * hunger) * (1 + 2 * hunger);
  foodW = desperate ? Math.max(60, foodW0) : foodW0, eatW = desperate ? Math.max(600, eatW0) : eatW0;
  contested = Math.max(Number(w.contested || 0), hunger);
  // Nerve: over food, the share of a rival's threat still counted, both its
  // head-on and where it may be by now (my persona's gamble at a contested
  // apple, not a reading of the risk: the maps stay as they are).
  starved = me.hungerLeft == null ? 0 : Math.min(1, Math.max(0, 1 - me.hungerLeft / TUNE.HUNGER_MS));
  nerveKeep = w.nerve ? 1 - Math.min(NERVE_MAX, (w.nerve.base || 0) + (w.nerve.hungry || 0) * starved) : 1;
}

// How many ticks something I saw has left before it rots, withers or
// flies off (in winter an apple rots twice as fast, and has done since I saw it).
// (readFood() sets these for each decision:)
let ticksLeft, appleWorth, craving, worth, spitTaste, shroomWorth, mute, stampFood, stampOwn, marksEnd, burrows,
  engine, strikeAt, lands, beakOf, knockedTo, peckGame, cellOf, foodCount, goldCount, bugCount, bugFood, beadCount;
function readFood() {
  ticksLeft = f => winter && f.kind === 'food' && !f.cooked ? (f.expires - view.tick - age) / 2 : f.expires - view.tick; // (baked, it keeps)

  // Food worth by kind. Negative means "avoid eating".
  appleWorth = w.normalFood ?? 1;
  craving = w.golden || PLAIN_GOLD; // (for golden things: Star's)
  worth = {
    food: Math.max(appleWorth, hunger),
    golden: TUNE.GOLDEN_GROWTH * Math.max(appleWorth, hunger) * craving.apple,
    beetle: TUNE.BEETLE_GROWTH * Math.max(appleWorth, hunger), // it moves, but it's worth what it's worth
    pellet: w.pellet ?? 1,
    mushroom: Math.min(-TUNE.SHRINK, w.mushroom ?? -TUNE.SHRINK), // (it takes SHRINK segments off, and it isn't a meal: as many apples lost, hungry or not)
    leaf: 2 * Math.max(appleWorth, hunger, 0.5) * craving.power, // (golden powers: worth it for what they do)
    goldcap: 1.5 * Math.max(appleWorth, hunger, 0.5) * craving.power,
  };
  // A mushroom (round six B): it costs me as many apples as it's strong;
  // but with a shot, each segment's worth less the longer I am (a whole
  // apple up to 10 long), against the shot: as many segments off the nearest rival I could reach
  // with it (its head within a spit of where I'd swallow it) as it would
  // come back up strong, at SPIT_SEG of an apple each, times my taste for
  // it (w.spit) and the odds of a hit. Never better than a persona that
  // hates them says (w.mushroom), nor than nothing while my mouth is full.
  spitTaste = w.spit ?? SPIT;
  shroomWorth = f => {
    const power = f.power || TUNE.SHRINK, len = me.body.length + me.grow;
    let shot = 0;
    if (spitTaste > 0) others.forEach((o, k) => {
      const away = manhattan(f, myHead);
      if (away <= SPIT_NEAR && Math.abs(heads[k].x - f.x) + Math.abs(heads[k].y - f.y) <= SPIT_NEAR + TUNE.SPIT_REACH && (o.spitIn || 0) - age < away + TUNE.CHEEK_TICKS && firingAt(k, away + TUNE.CHEEK_TICKS, f, TUNE.CHEEK_TICKS)) shot = Math.max(shot, Math.min(Math.min(TUNE.SHRINK_MAX, power + 1), o.body.length - TUNE.MIN_LENGTH));
    });
    if (!shot) return Math.min(-power, w.mushroom ?? -power); // (no shot: what it costs anyone, as it always did)
    const lost = Math.min(power, Math.max(0, len - TUNE.MIN_LENGTH)) * Math.min(1, 10 / Math.max(1, len));
    const v = -lost + spitTaste * SPIT_HIT * SPIT_SEG * shot;
    return Math.min(v, w.mushroom ?? Infinity); // (desperate, w.mushroom is -SHRINK: no shots)
  };
  // My own beads aren't food: my head squashes one (round six B), and
  // then it's food for nobody (worth nothing to me in the search: valued
  // as a meal, it read as eating, and an aggressive rival took risks for
  // it). A rival's own beads are the same to it: whoever gets there
  // first, they're gone. mute: how many of my next moves eat nothing (a
  // mushroom in my cheek, till it's spat). marks: where
  // there's food (stampFood), and my own beads (stampOwn).
  mute = me.spitIn || 0; // (a mushroom in my cheek: my mouth is full till it's spat)
  stampFood = ++markStamp, stampOwn = ++markStamp, marksEnd = stampOwn + 1;
  for (const f of food) marks[f.y * N + f.x] = f.kind === 'pellet' && f.owner === me.id ? stampOwn : stampFood;

  // (The burrows, as anyone sees them: nothing is knocked onto one, and a
  // scared beetle runs for one, one growing shut too: it can still dive in
  // until it closes over.)
  burrows = [];
  if (view.burrows) for (const b of view.burrows) burrows.push(b.y * N + b.x);
  engine = window.SnakeEngine || {};
  // The woodpecker's mark: at the strike, each piece of food in it is
  // knocked aside to where the engine's own rule puts it (E.knocks: what
  // the rings show anyone through the aim, on the board as it will be at
  // the strike, tails moved on; and in its last PECK_PROMISE_TICKS moves
  // where the woodpecker promised), worked out on the board as I see it.
  // It's there from the strike on: the first move that can eat it is the
  // one after the strike's tick (`lands`). Never where it lies: that's a
  // hole by then, and the mark's no place to wait. (A beetle in the mark
  // runs from the beak as the search moves it, and is the bird's if it's
  // still there at the strike: see bugCrawl and knockBug.)
  foodFrom.fill(0);
  strikeAt = mark.size && view.strikeAt != null && view.strikeAt >= view.tick && engine.knocks ? view.strikeAt : -1;
  lands = strikeAt - view.tick + 2;
  beakOf = strikeAt >= 0 && engine.beakDepth ? engine.beakDepth(mark, pitAt) : null; // (how far each cell of the mark is from the bark beyond, as the engine's beetles reckon it)
  knockedTo = null, peckGame = null; // (knocked: cell -> where it lands, -1: the bird eats it)
  if (strikeAt >= 0) {
    peckGame = { snakes: [{ alive: true, body: me.body }, ...others.map(o => ({ alive: true, body: o.body, stunUntil: view.tick + Math.max(0, (o.stun || 0) - age) }))], food, burrows: view.burrows || [], holes, fires: NO_FIRE_SEEN, tick: view.tick, woodpecker: { strikeAt, fall: view.fall || undefined } }; // (2s: food on a piece cut loose falls with it, never knocked: see E.knocks)
    knockedTo = new Map();
    for (const { food: f, to } of engine.knocks(peckGame, mark, view.landings)) {
      const from = f.y * N + f.x, i = to ? to.y * N + to.x : -1;
      knockedTo.set(from, i);
      if (i >= 0) { foodFrom[i] = lands; marks[i] = marks[from]; }
    }
  }
  cellOf = f => {
    const i = f.y * N + f.x;
    if (knockedTo && knockedTo.has(i)) return knockedTo.get(i);
    return i;
  };

  // Per cell: foodValue is what eating it is worth (0 if nothing), foodGrow
  // what it does to my length (a mushroom takes off up to SHRINK; my own
  // bead, nothing). foodCells lists the cells worth something, and goldCells
  // the golden power food among them, for a craving that counts it even
  // where a rival may get there first. (Beetles are worked out apart: they move.)
  foodValue.fill(0); foodGrow.fill(0);
  foodCount = 0, goldCount = 0, bugCount = 0;
  bugFood = [];
  for (const f of food) {
    if (f.kind === 'beetle' && bugCount < BUGS) { bugFood[bugCount++] = f; continue; }
    const own = f.kind === 'pellet' && f.owner === me.id, i = cellOf(f);
    if (i < 0) continue; // (nowhere to knock it: the bird eats it)
    foodGrow[i] = own ? 0 : f.kind === 'mushroom' ? -(f.power || TUNE.SHRINK) : f.kind === 'golden' ? TUNE.GOLDEN_GROWTH : f.kind === 'beetle' ? TUNE.BEETLE_GROWTH : f.cooked ? TUNE.COOKED_GROWTH : 1;
    let v = own ? 0 : f.kind === 'mushroom' ? shroomWorth(f) : worth[f.kind] ?? 0;
    if (!v) continue;
    if (f.cooked && v > 0) v *= TUNE.COOKED_GROWTH; // (baked: worth more)
    if (f.gold && v > 0) v *= 1.5 * craving.power; // (a golden beetle: leaps too)
    const away = foodFrom[i] ? Math.max(foodFrom[i], Math.abs(i % N - myHead.x) + Math.abs((i - i % N) / N - myHead.y)) : manhattan(f, myHead); // (knocked: where it lands, from when)
    if (f.expires != null && ticksLeft(f) < away) continue; // (it'll be gone before I get there)
    if (desperate && v > 0 && away > lifeTicks + 1) continue; // (I'd starve on the way)
    foodValue[i] += v;
    foodCells[foodCount++] = i;
    if (craving.contested && v > 0 && (f.gold || f.kind === 'leaf' || f.kind === 'goldcap')) goldCells[goldCount++] = i;
  }
  // (For the territory search, which can stop once I claim nothing more
  // unless food a rival gets to could still be mine: the rivals' own
  // beads.)
  beadCount = 0;
}
