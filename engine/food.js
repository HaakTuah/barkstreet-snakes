// An apple: it rots away after a while (and another drops somewhere else).
const apple = game => ({ kind: 'food', expires: game.tick + Math.round(T.APPLE_TICKS * between(0.75, 1.25)) });
// How many apples the board keeps: two; in winter, one; one fewer in a lean
// season and one more in a plentiful one (2i), never none.
const seasonApples = (season, snow = false) => Math.max(1, (snow ? T.SNOW_APPLES : T.APPLES) + T.SEASONS[season].apples); // (the Field guide and the lesson count them here too)
const applesWanted = game => seasonApples(game.season, game.weather.kind === 'snow');
function fillFood(game) {
  // Apples, golden apples and beads rot, mushrooms wither, and beetles nobody caught fly off.
  if (game.food.some(f => f.expires != null && f.expires <= game.tick)) {
    for (const f of game.food) {
      if (f.expires > game.tick) continue;
      if (f.kind === 'beetle') game.events.push({ type: 'flown', x: f.x, y: f.y });
      else if (f.kind === 'food') game.events.push({ type: 'rot', x: f.x, y: f.y, kind: 'apple' });
      else if (f.kind === 'pellet') game.events.push({ type: 'rot', x: f.x, y: f.y, kind: 'pellet', color: f.color });
    }
    game.food = game.food.filter(f => f.expires == null || f.expires > game.tick);
  }
  // Once the woodpecker is here, nothing new grows, but the last apples
  // fall one at a time: with none on the board, another drops, each wait
  // longer than the last (SD_APPLE_GAP ticks, then twice that, and so on).
  // The first is announced. Beetles still come out.
  if (suddenDeath(game)) {
    if (game.food.some(f => f.kind === 'food')) game.sdAppleAt = null;
    else if (game.sdAppleAt == null) game.sdAppleAt = game.tick + T.SD_APPLE_GAP * (game.sdApples + 1);
    else if (game.tick >= game.sdAppleAt) {
      const at = foodPlacer(game)(apple(game));
      game.sdAppleAt = null;
      if (at && !game.sdApples++) game.events.push({ type: 'lastApples', x: at.x, y: at.y });
    }
    let beetles = 0;
    for (const f of game.food) if (f.kind === 'beetle') beetles++;
    beetleOut(game, foodPlacer(game), beetles);
    return;
  }

  let apples = 0, mushrooms = 0, golden = 0, beetles = 0;
  for (const f of game.food) {
    if (f.kind === 'food') apples++;
    else if (f.kind === 'mushroom') mushrooms++;
    else if (f.kind === 'golden') golden++;
    else if (f.kind === 'beetle') beetles++;
  }
  for (const s of game.snakes) if (s.alive && s.cheek) mushrooms++; // (one in a cheek is still about: it comes back up)
  mushrooms += game.spits.length; // (and one in the air: it comes down, 3b+)

  const place = foodPlacer(game);
  const raining = game.weather.kind === 'rain', winter = game.weather.kind === 'snow';
  // (Winter: fewer apples, no new mushrooms.)
  for (const n = applesWanted(game); apples < n; apples++) place(apple(game));
  // (Rain: more mushrooms sprout. Never right by a head: nobody could see one come up in front of them in time.)
  for (; !winter && mushrooms < T.MUSHROOMS + (raining ? T.RAIN_MUSHROOMS : 0); mushrooms++) place({ kind: 'mushroom', expires: game.tick + T.MUSHROOM_TICKS }, false, T.SHROOM_GAP);
  // (Sun: golden hour. Winter: hardly any. It lands somewhere quiet: a race you can see.)
  const goldenChance = winter ? 0 : T.GOLDEN_CHANCE * (game.weather.kind === 'sun' ? T.SUN_GOLDEN : 1); // (none in winter)
  if (!golden && Math.random() < goldenChance && place({ kind: 'golden', expires: game.tick + T.GOLDEN_TICKS }, true)) {
    const g = game.food[game.food.length - 1];
    game.events.push({ type: 'spawn', kind: 'golden', x: g.x, y: g.y });
  }
  beetleOut(game, place, beetles);
}
// Picks free cells (no bodies, holes, food, burrows, fire or the
// woodpecker's next patch), worked out only when something actually needs
// placing. place(props, quiet, gap, apart): puts food there (props: null to only
// pick a cell), and returns the cell. quiet: pick the spot farthest from
// any head, of a few tries; gap: never this close to a head, or nearer;
// apart: only a cell at least this far from every burrow, while there's one.
function foodPlacer(game) {
  let free = null;
  return (props, quiet = false, gap = -1, apart = 0) => {
    if (!free) {
      markBodies(game);
      for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
      for (const k of game.holes) bodyStamp[k] = stamp;
      for (const b of game.burrows) bodyStamp[key(b.x, b.y)] = stamp;
      for (const k of game.fires.keys()) bodyStamp[k] = stamp;
      if (game.woodpecker) for (const k of game.woodpecker.target) bodyStamp[k] = stamp;
      if (game.woodpecker?.landings) for (const [, k] of game.woodpecker.landings) if (k >= 0) bodyStamp[k] = stamp; // (nor on a ring the woodpecker has promised)
      free = [];
      for (let k = 0; k < CELLS; k++) if (bodyStamp[k] !== stamp) free.push(k);
    }
    if (!free.length) return null; // a full board: nothing grows, and that's fine
    let pool = null; // (the places in free it may pick from, if not all of them)
    if (apart > 0 && game.burrows.length) {
      pool = [];
      for (let i = 0; i < free.length; i++) { const x = free[i] % GRID, y = Math.floor(free[i] / GRID); if (game.burrows.every(h => Math.abs(h.x - x) + Math.abs(h.y - y) >= apart)) pool.push(i); }
      if (!pool.length) pool = null; // (nowhere that far from them: anywhere, as before)
    }
    const any = () => pool ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * free.length);
    let at = any();
    if (gap >= 0 && headGap(game, free[at] % GRID, Math.floor(free[at] / GRID)) <= gap) { // (too close: another, from the cells far enough away)
      const far = [];
      for (let i = 0; i < free.length; i++) if (headGap(game, free[i] % GRID, Math.floor(free[i] / GRID)) > gap) far.push(i);
      if (!far.length) return null;
      at = far[Math.floor(Math.random() * far.length)];
    }
    if (quiet) {
      let best = -1;
      for (let t = 0; t < 8; t++) {
        const i = any(), c = free[i];
        const gap = headGap(game, c % GRID, Math.floor(c / GRID));
        if (gap > best) { best = gap; at = i; }
      }
    }
    const [k] = free.splice(at, 1);
    const cell = { x: k % GRID, y: Math.floor(k / GRID) };
    if (props) game.food.push({ ...cell, ...props });
    return cell;
  };
}
// Every living head that moved onto food eats it (not in the air), and a
// dash eats what was on the cells it passed. But not its own beads (the
// tail a crash knocked off, or a cut took): its head squashes one, at
// once and for nothing (round six B: food for nobody, so chasing your own
// beads denies them to everyone else). Nothing is pushed aside. (A
// starving snake that squashes a bead on the tick it runs out isn't
// saved: it ate nothing.)
function eat(game) {
  for (const s of game.snakes) {
    if (!s.alive) continue;
    const moved = s.stunUntil <= game.tick || s.landing; // (a crash, or a stun: its head is where it was, and found nothing new; but a jump whose landing was taken came down on what it hopped)
    const cells = s.air || !moved ? s.passed || [] : s.passed ? [...s.passed, s.body[0]] : [s.body[0]]; // (in the air: not what's under its head)
    for (const c of cells) {
      const i = game.food.findIndex(f => f.x === c.x && f.y === c.y);
      if (i < 0) continue;
      const f = game.food[i], own = f.kind === 'pellet' && f.owner === s.id;
      if ((s.cheek || f.spitBy === s.id && game.tick < f.slideUntil) && !own) continue; // (its mouth is full, or it's what it just spat: it goes over it, and it stays)
      game.food.splice(i, 1);
      if (own) game.events.push({ type: 'squash', snake: s, x: c.x, y: c.y });
      else consume(game, s, f, c.x, c.y);
    }
  }
}
// Where food can roll to: on the board, not a hole, not burning, no food
// or burrow there, and no body that'll still be there next tick (a tail
// end moving on is free).
function foodRoom(game, x, y) {
  return foodPast(game, x, y) && !game.food.some(f => f.x === x && f.y === y) && !burrowAt(game, x, y);
}
// Round six B, dropped charges: a snake out with golden jumps or dashes
// held spills them where its head fell, one golden pickup anyone can grab:
// on the nearest cell with nothing on it (bodies, food and burrows are
// stamped by the caller), within SPILL_NEAR, never a hole or fire; none,
// and they're lost. Only a knockout: a bump keeps them.
function spill(game, s) {
  if (!(s.leaps > 0) && !(s.dashes > 0)) return;
  const h = s.body[0], leaps = s.leaps, dashes = s.dashes;
  s.leaps = 0; s.dashes = 0;
  for (let r = 0; r <= T.SPILL_NEAR; r++) for (let dx = -r; dx <= r; dx++) for (const dy of r - Math.abs(dx) ? [Math.abs(dx) - r, r - Math.abs(dx)] : [0]) {
    const x = h.x + dx, y = h.y + dy, k = key(x, y);
    if (!inside(x, y) || bodyStamp[k] === stamp || game.holes.has(k) || game.fires.has(k)) continue;
    bodyStamp[k] = stamp;
    game.food.push({ x, y, kind: 'spill', leaps, dashes, expires: game.tick + T.SPILL_TICKS });
    game.events.push({ type: 'spill', snake: s, x, y, leaps, dashes });
    return;
  }
}
// A head eats food.
function consume(game, s, f, x, y) {
  game.events.push({ type: 'eat', snake: s, kind: f.kind, x, y, color: f.color, cooked: !!f.cooked, gold: !!f.gold });
  // Golden powers add up: each kind on top of what's held, any kinds at once.
  if (f.gold) s.leaps = Math.min(T.LEAP_MAX, s.leaps + T.LEAP_CHARGES); // (a golden beetle: golden jumps)
  if (f.kind === 'leaf') s.dashes = Math.min(T.DASH_MAX, s.dashes + T.DASH_CHARGES); // (a golden leaf: golden flashes, dashes)
  if (f.kind === 'spill') { s.leaps = Math.min(T.LEAP_MAX, s.leaps + f.leaps); s.dashes = Math.min(T.DASH_MAX, s.dashes + f.dashes); } // (a knocked-out snake's charges: all it held)
  if (f.kind === 'goldcap') s.wrapUntil = Math.min(Math.max(s.wrapUntil, game.time) + T.WRAP_MS, game.time + T.WRAP_MAX_MS); // (a golden mushroom: the edges wrap, a while longer)
  if (f.kind === 'mushroom') {
    // It shrinks you by its strength, and sits in your cheek, to come back up (see spit).
    const power = f.power || T.SHRINK;
    shrink(s, power);
    s.cheek = { power, spitAt: game.tick + T.CHEEK_TICKS, left: f.expires != null ? Math.max(0, f.expires - game.tick) : T.MUSHROOM_TICKS };
  } else {
    const growth = f.kind === 'golden' ? T.GOLDEN_GROWTH : f.kind === 'beetle' ? T.BEETLE_GROWTH : f.cooked ? T.COOKED_GROWTH : 1;
    // (A meal never leaves it less time than it had: one just after HUNGER_MID_FROM_MS on top of one just before keeps the longer; mealMs, what a full bar means, is then that long.)
    const lasts = Math.max(mealLasts(game), hungerLeft(game, s));
    s.lastAte = game.time - (T.HUNGER_MS - lasts);
    s.nextStarve = game.time + lasts;
    s.mealMs = lasts;
    s.ateTick = game.tick; // (a snake out of time that reaches food grows instead of starving this tick)
    s.grow += growth;
    s.eaten += growth;
    if (f.kind === 'golden') s.restedAt = Math.min(s.restedAt, game.time); // (2u+: a golden apple fills the bar...)
    refill(game, s, growth * T.STAMINA_FOOD_MS); // (...and every meal puts some back: past the full bar, it banks)
    if (f.kind === 'golden' && T.GOLDEN_SHIELD_MS) s.shieldUntil = game.time + T.GOLDEN_SHIELD_MS;
    if (f.kind === 'pellet') s.pellets++;
  }
}
// Shrink by n: pending growth goes first, then tail segments (never below MIN_LENGTH).
function shrink(s, n) {
  const fromGrow = Math.min(s.grow, n);
  s.grow -= fromGrow;
  n -= fromGrow;
  while (n-- > 0 && s.body.length > T.MIN_LENGTH) s.body.pop();
}
// Mushrooms come back up (round six B), and the spit flies along the line
// (3b+). A mushroom in a cheek, its time up, leaves the head the way the
// snake faces, a segment stronger (to SHRINK_MAX), and flies straight on,
// SPIT_SPEED cells a tick, up to SPIT_REACH (over the edge only where the
// edges wrapped for the spitter as it left; a gold portal is a way through
// for snakes, not for what they spit). It stops at the first thing in its
// way (see spitHits): a head swallows it (shrinking, and spitting it on in
// its turn), unless its own mouth is full: then it bounces off, as off a
// body; a body, the spitter's too, or food or a burrow: it rolls off by
// the roll rule (see rollSide), and with nowhere to roll it's gone; off the
// board, in a hole or a fire, it's gone. Nothing in its way, it lies on the
// bark where it ran out, wilting in half the time it had left. The spitter's
// own head goes over it, in the air or lying (spitBy, slideUntil: see eat),
// as a full mouth goes over food. It flies at the start of each tick, before
// anyone moves (in seat order, the ones in the air first): it leaves from the
// head and the way it faces as the dotted line showed them; and a head that
// moves onto it where it hangs between ticks is hit too (see spitCaught).
// Never kills: a shrink stops at MIN_LENGTH.
function spit(game) {
  const flying = game.spits;
  game.spits = [];
  for (const m of flying) spitFly(game, m);
  for (const s of game.snakes) {
    if (!s.alive || !s.cheek || game.tick < s.cheek.spitAt) continue;
    const h = s.body[0], power = Math.min(T.SHRINK_MAX, s.cheek.power + 1);
    const m = { x: h.x, y: h.y, dir: s.dir, left: T.SPIT_REACH, power, wilt: Math.max(T.SPIT_WILT_MIN, Math.round(s.cheek.left / 2)), by: s.id, wrap: wraps(game, s) };
    s.cheek = null;
    game.events.push({ type: 'spit', snake: s, x: h.x, y: h.y, power });
    spitFly(game, m);
  }
}
// On SPIT_SPEED cells, or as far as it has left, till it stops.
function spitFly(game, m) {
  m.fx = m.x; m.fy = m.y; // (where it was as the tick began, for whoever draws its flight)
  for (let n = 0; n < T.SPIT_SPEED && m.left > 0; n++) {
    let x = m.x + m.dir.x, y = m.y + m.dir.y;
    if (m.wrap) { x = (x + GRID) % GRID; y = (y + GRID) % GRID; }
    m.x = x; m.y = y; m.left--;
    const k = key(x, y);
    if (!inside(x, y) || game.holes.has(k) || burning(game, k)) return spat(game, m, -1, null); // (gone)
    if (spitHits(game, m, false)) return;
  }
  if (m.left > 0) return void game.spits.push(m);
  game.food.push({ x: m.x, y: m.y, kind: 'mushroom', power: m.power, expires: game.tick + m.wilt, spitBy: m.by, slideUntil: game.tick + T.OWN_SPIT_TICKS });
  spat(game, m, -1, m);
}
// What a mushroom in the air meets in its cell, if anything: a head (not
// the spitter's: that goes over it), a body, food or a burrow (moved: only
// a head that's just come there, or dashed over it, after everyone moved).
// True if it stopped there.
function spitHits(game, m, moved) {
  const here = c => c.x === m.x && c.y === m.y;
  const o = game.snakes.find(o => o.id !== m.by && o.alive && (here(o.body[0]) || (moved && o.passed?.some(here))));
  if (o && !o.cheek) { // (swallowed)
    shrink(o, m.power);
    o.cheek = { power: m.power, spitAt: game.tick + T.CHEEK_TICKS, left: m.wilt };
    spat(game, m, o.id, null);
    return true;
  }
  if (moved ? !o : foodRoom(game, m.x, m.y) || (!o && game.snakes[m.by]?.alive && here(game.snakes[m.by].body[0]))) return false;
  // (a body, food or a burrow there: it rolls off, as off the body it hit, or the way it flew)
  const b = game.snakes.find(b => b.alive && b.body.some(p => p.x === m.x && p.y === m.y));
  const j = b ? b.body.findIndex(p => p.x === m.x && p.y === m.y) : -1;
  const along = b ? { body: b.body.slice(j), dir: j > 0 ? stepWay(b.body[j], b.body[j - 1]) || b.dir : b.dir } : { body: [m], dir: m.dir };
  const at = rollSide(game, along, m.x, m.y, (x, y) => foodRoom(game, x, y), (x, y) => foodPast(game, x, y));
  if (at) game.food.push({ x: at.x, y: at.y, kind: 'mushroom', power: m.power, expires: game.tick + m.wilt, spitBy: m.by, slideUntil: game.tick + T.OWN_SPIT_TICKS });
  spat(game, m, -1, at); // (nowhere to roll: gone)
  return true;
}
// A head that moved onto a mushroom in the air is hit by it, as if it had
// flown into that head (after everyone moved, before anyone eats).
function spitCaught(game) {
  if (game.spits.length) game.spits = game.spits.filter(m => !spitHits(game, m, true));
}
// Where a mushroom stopped (x, y; from fx, fy this tick), whom it hit, where it lies (null: swallowed or gone).
function spat(game, m, hit, at) {
  game.events.push({ type: 'spat', snake: game.snakes[m.by], x: m.x, y: m.y, fx: m.fx, fy: m.fy, power: m.power, hit, lx: at ? at.x : null, ly: at ? at.y : null });
}
