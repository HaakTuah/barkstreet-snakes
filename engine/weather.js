// Spells of weather, one after another with clear spells between: sun
// (golden hour), wind (gusts knock apples loose; fire flings burning
// leaves downwind), rain (mushrooms sprout, fires go out; a rainbow when it
// stops, with a golden apple at its end), storms (lightning, which crackles
// where it'll strike first, never near a head, and sets the bark alight)
// and snow (winter: less food, hunger runs faster, fires go out).
// Everyone sees all of it.
function weather(game) {
  const w = game.weather;
  // (Once the woodpecker is here, the sky clears and stays clear.)
  if (game.time >= w.until || (suddenDeath(game) && w.kind !== 'clear')) {
    let next = 'clear';
    if (suddenDeath(game)) next = 'clear';
    else if (w.kind === 'clear') next = spell(game);
    else if (w.kind === 'storm' && luck(game) < T.AFTER_STORM_RAIN) next = 'rain';
    else if (w.kind === 'rain' && luck(game) < T.RAINBOW_CHANCE) rainbowAfter(game);
    const span = next === 'clear' ? between(game, T.CLEAR_MIN_MS, T.CLEAR_MAX_MS) : between(game, T.SPELL_MIN_MS, T.SPELL_MAX_MS);
    if (next !== w.kind) game.events.push({ type: 'weather', kind: next });
    game.weather = { kind: next, since: next === w.kind ? w.since : game.time, until: game.time + span, nextGust: game.time + 600, nextStrike: game.time + between(game, 1200, 2500) };
    // (Rain: once in a while, a golden mushroom comes up some time in it.)
    if (next === 'rain' && luck(game) < T.GOLDCAP_CHANCE) game.weather.goldcapAt = game.time + between(game, 1000, Math.max(1000, span - 4000));
  }
  const now = game.weather;
  if (now.kind === 'wind' && game.time >= now.nextGust) {
    now.nextGust = game.time + T.GUST_EVERY_MS;
    let apples = 0;
    for (const f of game.food) if (f.kind === 'food') apples++;
    const fell = apples < applesWanted(game) + T.WINDFALL_MAX ? foodPlacer(game)(apple(game)) : null;
    game.events.push({ type: 'gust', x: fell ? fell.x : -1, y: fell ? fell.y : -1 });
    // Now and then a gust brings a golden leaf (one at a time): dashes. It
    // lands somewhere quiet, like every golden thing.
    if (luck(game) < T.LEAF_CHANCE && !game.food.some(f => f.kind === 'leaf')) {
      const at = foodPlacer(game)({ kind: 'leaf', expires: game.tick + T.LEAF_TICKS }, true);
      if (at) game.events.push({ type: 'spawn', kind: 'leaf', x: at.x, y: at.y });
    }
  }
  if (now.kind === 'rain' && now.goldcapAt != null && game.time >= now.goldcapAt) { // a golden mushroom comes up
    now.goldcapAt = null;
    const at = foodPlacer(game)({ kind: 'goldcap', expires: game.tick + T.GOLDCAP_TICKS }, true);
    if (at) game.events.push({ type: 'spawn', kind: 'goldcap', x: at.x, y: at.y });
  }
  if (now.kind === 'storm' && game.time >= now.nextStrike) {
    now.nextStrike = game.time + between(game, T.STRIKE_MIN_MS, T.STRIKE_MAX_MS);
    strike(game);
  }
  // Winter: hunger runs faster (the clock to everyone's next meal runs
  // down quicker: hungerRate), and apples rot twice as fast.
  const rate = hungerRate(game);
  if (rate !== 1) {
    const extra = tickLength(game) * (rate - 1);
    for (const s of game.snakes) if (s.alive) { s.lastAte -= extra; s.nextStarve -= extra; }
  }
  if (now.kind === 'snow') for (const f of game.food) if (f.kind === 'food' && f.expires != null && !f.cooked) f.expires--;
  burn(game);
}
// The next spell, drawn from a shuffled bag (WEATHER_ODDS of each kind), so
// every kind comes before any comes again. Storms can't come before
// STORM_FROM_MS, nor snow before SNOW_FROM_MS: they stay in the bag for
// later (with nothing else left in it, the next bag goes in behind).
function spell(game) {
  const bag = game.weatherBag, ok = k => (k !== 'storm' || game.time >= T.STORM_FROM_MS) && (k !== 'snow' || game.time >= T.SNOW_FROM_MS);
  if (!bag.some(ok)) {
    const more = [];
    for (const [k, n] of Object.entries(T.WEATHER_ODDS)) for (let i = 0; i < n; i++) more.push(k);
    for (let i = more.length - 1; i > 0; i--) { const j = Math.floor(luck(game) * (i + 1)); [more[i], more[j]] = [more[j], more[i]]; }
    bag.push(...more);
  }
  const i = bag.findIndex(ok);
  return i < 0 ? 'clear' : bag.splice(i, 1)[0];
}
// After the rain: a rainbow, and a golden apple at its end (if there isn't one).
function rainbowAfter(game) {
  if (game.food.some(f => f.kind === 'golden')) return;
  const at = foodPlacer(game)({ kind: 'golden', expires: game.tick + T.GOLDEN_TICKS }, true);
  if (at) game.events.push({ type: 'rainbow', x: at.x, y: at.y });
}
// Lightning picks a free cell well away from every head, and crackles there
// for a moment before it strikes.
function strike(game) {
  markBodies(game);
  for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
  const spots = [];
  for (let k = 0; k < CELLS; k++) {
    const x = k % GRID, y = Math.floor(k / GRID);
    if (bodyStamp[k] === stamp || game.holes.has(k) || game.fires.has(k) || burrowAt(game, x, y)) continue;
    if (headGap(game, x, y) <= T.STRIKE_CLEARANCE) continue;
    spots.push(k);
  }
  if (!spots.length) return;
  const k = spots[Math.floor(luck(game) * spots.length)], from = game.tick + T.STRIKE_WARN_TICKS;
  const group = ++game.fireGroup;
  game.fires.set(k, { from, until: from + T.FIRE_TICKS, group, strike: true });
  game.fireGroups.set(group, 1); game.fireTotals.set(group, 1);
  game.events.push({ type: 'charge', x: k % GRID, y: Math.floor(k / GRID) });
}
// Fire: a strike lands when its crackling's done, burning cells now and then
// catch a neighbour (smouldering first, so everyone sees it coming: at most
// FIRE_MAX of one fire's cells at once, and FIRE_TOTAL over its life, so it
// burns itself out), and cells burn out. Rain puts it all out. (Times are
// ticks: the next tick is game.tick + 1, when anything that's burning by
// then can kill.)
function burn(game) {
  if (!game.fires.size) return;
  const next = game.tick + 1, raining = game.weather.kind === 'rain' || game.weather.kind === 'snow'; // (rain or snow: it goes out)
  const windy = game.weather.kind === 'wind' || game.weather.kind === 'storm';
  let marked = false;
  for (const [k, f] of game.fires) {
    if (raining) f.until = Math.min(f.until, Math.max(f.from, next) + T.RAIN_DOUSE_TICKS);
    if (f.until <= next) { putOut(game, k); continue; } // burnt out
    if (f.strike && f.from === next) game.events.push({ type: 'strike', x: k % GRID, y: Math.floor(k / GRID) });
    // Wind: a burning leaf blown downwind (to the right), to start a small fire where it lands.
    if (windy && !raining && !f.ember && game.tick >= f.from && game.fires.size < T.FIRE_BOARD_MAX && luck(game) < T.EMBER_CHANCE) ember(game, k);
    if (f.ember || raining || game.tick < f.from || luck(game) >= T.FIRE_SPREAD || (game.fireGroups.get(f.group) || 0) >= T.FIRE_MAX || (game.fireTotals.get(f.group) || 1) >= T.FIRE_TOTAL || game.fires.size >= T.FIRE_BOARD_MAX) continue;
    if (!marked) {
      markBodies(game);
      for (const fo of game.food) if (fo.kind === 'beetle') bodyStamp[key(fo.x, fo.y)] = stamp; // (food can catch; a beetle runs)
      marked = true;
    }
    const x = k % GRID, y = Math.floor(k / GRID);
    const d = CRAWL[Math.floor(luck(game) * 4)], nx = x + d.x, ny = y + d.y, nk = key(nx, ny);
    if (!inside(nx, ny) || bodyStamp[nk] === stamp || game.holes.has(nk) || game.fires.has(nk) || burrowAt(game, nx, ny)) continue;
    const from = next + T.FIRE_SMOLDER_TICKS;
    game.fires.set(nk, { from, until: from + T.FIRE_TICKS, group: f.group, strike: false });
    game.fireGroups.set(f.group, (game.fireGroups.get(f.group) || 0) + 1);
    game.fireTotals.set(f.group, (game.fireTotals.get(f.group) || 1) + 1);
  }
  cook(game);
}
// A cell's fire gone (burnt out, put out by a dash, or pecked out), and its fire's counts with it.
function putOut(game, k) {
  const f = game.fires.get(k);
  game.fires.delete(k);
  const left = (game.fireGroups.get(f.group) || 1) - 1;
  if (left > 0) game.fireGroups.set(f.group, left);
  else { game.fireGroups.delete(f.group); game.fireTotals.delete(f.group); }
}
// Food in a burning cell cooks: an apple or a bead bakes (worth more, and
// it stops rotting for a while), and anything left in too long goes to ash.
function cook(game) {
  let ash = false;
  for (const f of game.food) {
    if (f.kind === 'beetle') continue;
    const fire = game.fires.get(key(f.x, f.y));
    if (!fire || game.tick < fire.from) continue;
    f.heat = (f.heat || 0) + 1;
    if (f.heat === T.COOK_TICKS && (f.kind === 'food' || f.kind === 'pellet')) {
      f.cooked = 1;
      if (f.expires != null) f.expires = Math.max(f.expires, game.tick + T.APPLE_TICKS / 2);
      game.events.push({ type: 'baked', x: f.x, y: f.y, kind: f.kind });
    }
    if (f.heat >= T.ASH_TICKS) { f.ash = true; ash = true; game.events.push({ type: 'ash', x: f.x, y: f.y, kind: f.kind }); }
  }
  if (ash) game.food = game.food.filter(f => !f.ash);
}
// A burning leaf flung from cell k, landing 2 to EMBER_REACH cells downwind
// (a cell either side, perhaps) on a free cell, never by a head: it smoulders
// there first, longer than spreading fire does, then burns briefly, small.
function ember(game, k) {
  markBodies(game);
  for (const fo of game.food) bodyStamp[key(fo.x, fo.y)] = stamp;
  const x = k % GRID, y = Math.floor(k / GRID);
  const nx = x + 2 + Math.floor(luck(game) * (T.EMBER_REACH - 1)), ny = y + Math.floor(luck(game) * 3) - 1, nk = key(nx, ny);
  if (!inside(nx, ny) || bodyStamp[nk] === stamp || game.holes.has(nk) || game.fires.has(nk) || burrowAt(game, nx, ny) || headGap(game, nx, ny) <= 1) return;
  const from = game.tick + 1 + T.EMBER_SMOLDER_TICKS, group = ++game.fireGroup;
  game.fires.set(nk, { from, until: from + T.EMBER_FIRE_TICKS, group, strike: false, ember: true });
  game.fireGroups.set(group, 1);
  game.events.push({ type: 'ember', x: nx, y: ny, fx: x, fy: y });
}
// Is cell k burning on this tick (and so sets alight a head that enters)?
const burning = (game, k) => { const f = game.fires.get(k); return !!f && game.tick >= f.from && game.tick < f.until; };
function douse(game, k) {
  putOut(game, k);
  game.events.push({ type: 'douse', x: k % GRID, y: Math.floor(k / GRID) });
}
