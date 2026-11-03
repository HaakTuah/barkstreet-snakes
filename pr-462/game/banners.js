// The game controller (see game/core.js): what a round says: the banners for its big moments (announce, news)
// and the lessons, with what they look for on the board. The banner itself is in toasts.js.

// Banners for the big moments of a round (one per tick, most important
// first). Spawns are news once a round; what happens to you is a lesson
// the first time; repeats are left to the board's own floaters.
function announce(dying) {
  for (const key of landLost()) if (!(theGame.lostLand ||= []).includes(key)) theGame.lostLand.push(key); // (its lesson, when news next gets to it)
  if (player() && dying.includes(player())) { // (your own death: its card is a moment away, and says it; nothing over the freeze-frame)
    if (!theGame.firstBlood) { theGame.firstBlood = true; Sound.play('stinger'); }
    return;
  }
  news(dying);
  // Sudden death's trickle (once a round): round news that waits its turn,
  // after whatever this tick said.
  if (theGame.events.some(e => e.type === 'lastApples')) toast(FLAVOR.lastApples, 2800, '', 'round');
}
// Land the woodpecker took this tick, as the chatter sees it (chatter/moments.js):
// 'lostColony' for a colony gone from its snake's memory with a hole where
// its flag stood, 'lostCapital' for a realm moved off a centre that's now
// a hole. A snake's land changes as it thinks, a moment after the strike,
// so each tick's is kept to compare (on a friend's screen too: the memory
// comes with the host's ticks).
function landLost() {
  const was = (theGame.landWas ||= new Map()), hole = c => theGame.holes.has(c.y * GRID_SIZE + c.x), lost = [];
  for (const s of theGame.snakes) {
    const m = s.memory, before = was.get(s.id);
    if (!m?.home && !m?.colonies && !before) continue;
    const home = m.home ? { x: m.home.x, y: m.home.y } : null, cols = (m.colonies || []).map(c => ({ n: c.n, x: c.x, y: c.y }));
    if (before?.home && home && (home.x !== before.home.x || home.y !== before.home.y) && hole(before.home) && !lost.includes('lostCapital')) lost.push('lostCapital');
    if (before?.cols.some(c => hole(c) && !cols.some(k => k.n === c.n && k.x === c.x && k.y === c.y)) && !lost.includes('lostColony')) lost.push('lostColony');
    was.set(s.id, { home, cols });
  }
  return lost;
}
// The first out's banner: its words, and its fewer words on a phone held
// upright (the cause shorter, and where long names don't fit even so, no
// cause at all: "Gran is first out.").
function firstOut(dying) {
  const v = dying[0];
  const killer = theGame.snakes.find(o => o.name === v.killer && o !== v);
  const names = dying.map(d => who(d, true));
  const all = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return [dying.length > 1 ? `First out: ${all}.` : killer && killer.alive ? `First blood: ${who(killer, true)} got ${who(v, true)}.` : killer ? `First out: ${who(v, true)} and ${who(killer, true)}, head-on.` : `First out: ${who(v, true)} ${causeFor(v)}.`,
    { phone: dying.length === 1 && !killer ? `First out: ${who(v, true)} ${shortCause(causeFor(v))}.` : '', // (one line on a phone: the cause in fewer words)
      short: dying.length > 1 ? '' : killer && !killer.alive ? `${who(v)} and ${who(killer, true)} are first out.` : isMe(v) ? 'You’re first out.' : `${v.name} is first out.` }];
}
function news(dying) {
  const alive = theGame.snakes.filter(s => s.alive);
  if (dying.length && !theGame.firstBlood) {
    theGame.firstBlood = true;
    Sound.play('stinger');
    if (alive.length !== 2) { const [text, opts] = firstOut(dying); return toast(text, 2800, 'kill', 'round', opts); } // (down to two: that's the bigger news, below)
  }
  const me = player();
  const once = key => !theGame.told?.[key] && ((theGame.told ||= {})[key] = true); // (the first time this round)
  for (const e of theGame.events) if (e.type === 'woodpecker') {
    flashFrame('bird', true);
    toast(lineFor('woodpecker'), 2800, 'bird', 'round');
    if (me?.alive && once('fairPecks')) toast(FLAVOR.youWoodpecker, 3000, 'bird', 'lesson', { still: () => me.alive, follows: true }); // (its rule: it waits its turn, after the news, its moment the news's)
    return;
  }
  if (dying.length && alive.length === 2) {
    const [a, b] = isMe(alive[0]) ? [alive[1], alive[0]] : alive;
    Sound.play('riser');
    return toast(`It’s down to ${who(a)} and ${who(b, true)}.`, 2800, 'kill', 'round');
  }
  const newsOnce = key => newsFree() && once(key); // (news that can't show now waits for its next chance, not spent on nothing)
  if (me?.alive) {
    const small = me.body.length <= TUNE.MIN_LENGTH;
    // Your first crash: the rule, first (landing at 3, the lesson says so too).
    if (theGame.events.some(e => e.type === 'crash' && e.snake === me) && once('crash')) {
      if (small) once('atThree');
      return toast(small ? FLAVOR.youCrashToThree : pick(FLAVOR.youCrash), 3000, 'warn', 'lesson', { still: () => me.alive });
    }
    const wrapLeft = me.wrapUntil - theGame.time;
    if (wrapLeft > 0 && wrapLeft <= TUNE.WRAP_WARN_MS && !theGame.toldWrapEnd) { theGame.toldWrapEnd = true; return toast(pick(FLAVOR.wrapEnding(Math.round(TUNE.WRAP_WARN_MS / 1000))), 1800, 'warn', 'lesson', { still: () => me.alive && me.wrapUntil > theGame.time }); }
    if (wrapLeft > TUNE.WRAP_WARN_MS) theGame.toldWrapEnd = false;
    const warned = Engine.hungerWarning(theGame, me) < 1; // (at your smallest, or a shrink from it, starving is the end: a little earlier, and at your smallest sharper)
    if (warned && !theGame.warnedHunger) { theGame.warnedHunger = true; Sound.play('hungerWarn'); return toast(small ? FLAVOR.youStarvingSmall : pick(FLAVOR.youHungry), 2800, 'warn', 'lesson', { still: () => me.alive }); }
    if (!warned) theGame.warnedHunger = false;
    if (small && theGame.time > 1000 && once('atThree')) return toast(pick(FLAVOR.youAtThree), 2600, 'warn', 'lesson', { still: () => me.alive && me.body.length <= TUNE.MIN_LENGTH });
  }
  // A flag or a capital the woodpecker pecked out (see landLost): its rule,
  // the first time each goes in a round, for everyone watching too (the
  // chatter may be off, and the rival's line with it): round news, that
  // waits its turn; the flag's fall and the land shrinking stay on the board.
  while (theGame.lostLand?.length) {
    const key = theGame.lostLand.shift();
    if (once(key)) return toast(FLAVOR[key], 2800, 'bird', 'round');
  }
  for (const e of theGame.events) {
    if (e.type === 'strike') flashFrame('storm', true);
    if (e.type === 'strike' && !theGame.struck && theGame.weather?.kind === 'storm') { theGame.struck = true; return toast(pick(FLAVOR.strike), 2200, 'fire'); } // (a storm's last bolt, landing in the rain after it: the bolt, flash and thunder say it)
    if (e.type === 'weather' && e.kind === 'storm') theGame.struck = false;
    if (e.type === 'weather' && FLAVOR.weather[e.kind]) { flashFrame(e.kind); return toast(pick((!playerAlive() && FLAVOR.weatherWatch[e.kind]) || FLAVOR.weather[e.kind]), 2800, e.kind); }
    if (e.type === 'rainbow') { flashFrame('gold', true); if (newsOnce('rainbow')) return toast(lineFor('rainbow'), 2800, 'gold'); }
    if (e.type === 'shut' && theGame.told?.digBurrow && newsFree()) { const took = theGame.events.some(o => o.type === 'burrow' && o.dug && Math.abs(o.x - e.x) + Math.abs(o.y - e.y) < TUNE.BURROW_SPACING); if (once(took ? 'burrowTaken' : 'burrowHeal')) return toast(took ? FLAVOR.burrowTaken : FLAVOR.burrowHeal, 2600, 'beetle', 'lesson'); } // (a dig by a burrow takes its place: that one starting to grow shut and the dug burrow come in the same tick) // (one starting to grow shut: once the burrow's lesson is told, the first time the banner's free for it, else the next one teaches it. A dig at the cap starts one growing shut on its burrow's tick, the shut first: that tick teaches the burrow)
    if (e.type === 'burrow' && e.dug && newsFree() && once('digBurrow')) return toast(once('dig') ? FLAVOR.digAndBurrow : FLAVOR.digBurrow, 2600, 'beetle', 'lesson'); // (its rule, the first time the banner's free for one: shown then, or the next one teaches it. Not taught the dig yet (it was far from you, or the banner was busy), it teaches both, the dig first)
    if (e.type === 'spawn' && e.kind === 'golden') { flashFrame('gold'); if (newsOnce('golden')) return toast(pick(FLAVOR.golden), 2800, 'gold'); }
    if (e.type === 'spawn' && e.kind === 'beetle' && e.gold) { flashFrame('gold'); if (newsOnce('goldBeetle')) return toast(lineFor('goldBeetle'), 2600, 'gold'); }
    if (e.type === 'spawn' && e.kind === 'beetle') { flashFrame('beetle'); if (newsOnce('beetle')) return toast(pick(FLAVOR.beetle), 2200, 'beetle'); }
    if (e.type === 'spawn' && e.kind === 'leaf') { flashFrame('gold'); if (newsOnce('leaf')) return toast(lineFor('leaf'), 2400, 'gold'); }
    if (e.type === 'spawn' && e.kind === 'goldcap') { flashFrame('gold'); if (newsOnce('goldcap')) return toast(lineFor('goldcap'), 2400, 'gold'); }
    if (e.type === 'knock' && e.kind === 'beetle' && e.tx == null && newsFree() && once('birdBeetle')) return toast(FLAVOR.birdBeetle, 2400, 'bird', 'lesson'); // (round six B, 2m: the first beetle the bird eats, anyone's to catch)
    if ((e.type === 'aim' ? theGame.woodpecker?.fall?.length : e.type === 'peck' && e.fall?.length) && newsFree() && once('cutLoose')) return toast(FLAVOR.cutLoose, 2600, 'bird', 'lesson'); // (2s: the first piece cut loose, as its mark shows it, or as it falls if the banner was busy)
    if (e.type === 'through' && newsFree() && once('portalFollow')) return toast(FLAVOR.portalFollow, 2600, 'gold', 'lesson'); // (round six B, part 5: the first time anyone follows anyone through a gold portal)
    if (e.type === 'peck' && me?.alive && e.under?.includes(me.id) && once('peckedUnder')) return toast(FLAVOR.youPeckedUnder, 2800, 'bird', 'lesson'); // (struck under your body: a bridge, not a cut)
    if (e.type === 'death' && e.snake.fatal === 'cut' && newsFree() && once('neckCut')) return toast(FLAVOR.neckCut, 2400, 'warn', 'lesson'); // (the first neck cut you see, anyone's)
    if (e.type === 'dig' && me?.alive && Math.abs(me.body[0].x - e.x) + Math.abs(me.body[0].y - e.y) <= DIG_NEAR && newsFree() && once('dig')) return toast(FLAVOR.youDig, 2600, 'beetle', 'lesson'); // (it's over in a second: shown now or kept for the next one, never left waiting)
    if (e.type === 'spit' && me?.alive && e.hit === me.id && once('spatOn')) { once('mushroom'); return toast(FLAVOR.youSpatOn(who(e.snake, true)), 2800, 'warn', 'lesson'); } // (round six B: hit by one; it teaches the aim, as a first mushroom would)
    if (!me || !isMe(e.snake || {}) && e.by !== me.id) continue; // (the rest is about you)
    if (e.type === 'squash' && once('squash')) return toast(FLAVOR.youSquash, 2600, 'you', 'lesson');
    if (e.type === 'eat' && e.gold) { flashFrame('gold', true); return toast(FLAVOR.youGoldBeetle(e.snake.leaps), 3000, 'gold', 'lesson'); }
    if (e.type === 'eat' && e.kind === 'leaf') { flashFrame('gold', true); return toast(FLAVOR.youLeaf(e.snake.dashes), 3200, 'gold', 'lesson'); }
    if (e.type === 'eat' && e.kind === 'goldcap') { flashFrame('gold', true); return toast(FLAVOR.youGoldcap(Math.round((me.wrapUntil - theGame.time) / 1000)), 3000, 'gold', 'lesson'); } // (a second one adds to the first: the real total)
    if (e.type === 'eat' && e.kind === 'beetle') flashFrame('beetle');
    if (e.type === 'eat' && e.kind === 'golden') flashFrame('gold', true);
    if (e.type === 'spit' && e.lx != null && once('spitWet')) return toast(FLAVOR.youSpitWet, 2400, 'warn', 'lesson'); // (2x: your first spit that lies: wet, you slide over it)
    if (e.type === 'eat' && e.kind === 'mushroom' && once('mushroom')) return toast(FLAVOR.youMushroomSpit, 2600, 'warn', 'lesson'); // (round six B: it comes back up, aimed by steering)
    if ((e.type === 'leap' && !e.gold || e.type === 'dash' && e.plain) && once('stamina')) return toast(FLAVOR.youStamina, 3000, 'you', 'lesson');
    if (e.type === 'dash' && e.snake === me) flashedEver = true; // (you know the key: no more telling)
    if (e.type === 'dash' && !e.plain && once('dash')) return toast(FLAVOR.youDashFirst, 2800, 'gold', 'lesson');
    const refused = e.type === 'fizzle' && (e.flash ? FLAVOR.fizzleFlash : FLAVOR.fizzle)[e.why];
    if (refused && once((e.flash ? 'fizzleFlash' : 'fizzle') + e.why)) return toast(refused, 1800, 'warn', 'lesson');
    if (e.type === 'cut' && e.by === me.id && isMe(e.snake)) { if (once('youDropTail')) return toast(FLAVOR.youDropTail, 2400, 'you', 'lesson'); continue; } // (your own tail: dropped)
    if (e.type === 'cut' && e.by === me.id && once('youCutFirst')) return toast(FLAVOR.youCutFirst, 2400, 'gold', 'lesson');
    if (e.type === 'cut' && e.by === me.id) return toast(FLAVOR.youSnip(who(e.snake, true)), 1800, 'gold');
    if (e.type === 'crash' && e.air && isMe(e.snake) && once('youBumped')) return toast(FLAVOR.youBumped, 2400, 'warn', 'lesson');
    if (e.type === 'leap' && e.gold && isMe(e.snake) && once('youGoldFly')) return toast(FLAVOR.youGoldFly, 2800, 'gold', 'lesson');
    if (e.type === 'crash' && e.failed && once('youFlashFailed')) return toast(FLAVOR.youFlashFailed, 2600, 'warn', 'lesson');
    if (e.type === 'cut' && e.by != null) return toast(FLAVOR.youSnipped(theGame.snakes[e.by]?.name || 'Someone'), 2200, 'warn', 'lesson');
    if (e.type === 'alight') { flashFrame('kill'); if (once('alight')) return toast(pick(FLAVOR.youAlight), 2600, 'fire', 'lesson'); } // (later burns: the flames and the -1s say it)
  }
  // A few seconds in, your flash ready and never used yet (this visit): its key, once a round.
  if (me?.alive && !flashedEver && theGame.time >= 6000 && Engine.flashIn(theGame, me) === 0 && newsFree() && once('flashKey')) return toast(FLAVOR.flashKey, 3200, 'you', 'lesson');
  if (me?.alive && me.leapArmed >= 0 && me.leapArmed === theGame.tick - 1 && !theGame.events.some(e => e.snake === me && (e.type === 'leap' || e.type === 'dash' || e.type === 'fizzle')) ) { // (it ran out: too early, with a hurdle on the line, or nothing to hop at all)
    const early = hurdleAhead(me, 8);
    if (once(early ? 'leapEarly' : 'leapNothing')) return toast(early ? FLAVOR.leapEarly : FLAVOR.leapNothing, 2600, 'you', 'lesson');
  }
  // Another snake lying across a pit near you: bridges, once.
  if (me?.alive && theGame.tick % 4 === 2 && newsFree() && !theGame.told?.bridge && bridgeNear(me) && once('bridge')) return toast(FLAVOR.bridgeFirst, 3000, 'you', 'lesson');
  // In a pocket smaller than you, your own body one thick in front and your flash ready: dropping your tail, once.
  if (me?.alive && !me.flight && theGame.tick % 4 === 1 && newsFree() && !theGame.told?.dropTail && !theGame.told?.youDropTail && Engine.flashIn(theGame, me) === 0 && tailToDrop(me) && once('dropTail')) return toast(FLAVOR.dropTail, 3000, 'you', 'lesson');
  // 2y, a landing to take: a flier's ring you could crawl to before it's down; and your own ring, a rival's head that could. Once each.
  if (me?.alive && !me.flight && theGame.tick % 4 === 1 && newsFree() && !theGame.told?.ringRace && ringsInReach(me).length && once('ringRace')) return toast(FLAVOR.ringRace, 2800, 'you', 'lesson');
  if (me?.alive && me.flight?.ring && theGame.tick % 2 === 0 && newsFree() && !theGame.told?.youRingRaced && theGame.snakes.some(o => o !== me && o.alive && !o.flight && ringsInReach(o).includes(me)) && once('youRingRaced')) return toast(FLAVOR.youRingRaced, 2800, 'warn', 'lesson');
  // A flier coming down on your line, within a leap now's reach, your jump ready: you could have cut it off. Once.
  if (me?.alive && !me.flight && theGame.tick % 4 === 3 && newsFree() && !theGame.told?.leapNow && Engine.leapIn(theGame, me) === 0 && fliersAhead(me) && once('leapNow')) return toast(touchFirst ? FLAVOR.leapNow.replace('Press', 'Tap') : FLAVOR.leapNow, 2800, 'you', 'lesson');
  // Boxed in, with a gap you could hop to an island and your jump ready: the island hop, once.
  if (me?.alive && !me.flight && theGame.tick % 4 === 0 && newsFree() && !theGame.told?.islandHop && Engine.leapIn(theGame, me) === 0 && islandNear(me) && once('islandHop')) return toast(FLAVOR.islandHop, 3000, 'you', 'lesson');
  for (const e of theGame.events) if (e.type === 'baked' && newsOnce('baked')) return toast(lineFor('baked'), 2600, 'fire');
}

// Another snake's body over a pit (behind its head), within 4 cells of your head?
function bridgeNear(s) {
  const h = s.body[0];
  return theGame.snakes.some(o => o.alive && o !== s && o.body.some((c, j) => j > 0 && Math.abs(c.x - h.x) + Math.abs(c.y - h.y) <= 4 && theGame.holes.has(c.y * GRID_SIZE + c.x)));
}

// Boxed in (less free log you can crawl to than your length), with a hop
// from your head, any way but back, that lands on log you can't crawl to?
function islandNear(s) {
  const G = GRID_SIZE, h = s.body[0], taken = new Set();
  for (const o of theGame.snakes) if (o.alive) for (const c of o.body) taken.add(c.y * G + c.x);
  const blocked = k => theGame.holes.has(k) || !!theGame.fires?.has(k);
  const reach = new Set([h.y * G + h.x]), todo = [h.y * G + h.x];
  let free = 0;
  while (todo.length && free < s.body.length) {
    const k = todo.pop(), x = k % G, y = (k - x) / G;
    for (const [dx, dy] of SIDES4) {
      const nx = x + dx, ny = y + dy, n = ny * G + nx;
      if (nx < 0 || ny < 0 || nx >= G || ny >= G || reach.has(n) || blocked(n)) continue;
      reach.add(n); todo.push(n);
      if (!taken.has(n)) free++;
    }
  }
  if (free >= s.body.length) return false;
  for (const [dx, dy] of SIDES4) {
    if (dx === -s.dir.x && dy === -s.dir.y) continue;
    let x = h.x + dx, y = h.y + dy;
    if (x < 0 || y < 0 || x >= G || y >= G || !(blocked(y * G + x) || taken.has(y * G + x))) continue;
    for (let i = 0; i < TUNE.LEAP_REACH; i++) {
      x += dx; y += dy;
      if (x < 0 || y < 0 || x >= G || y >= G) break;
      const n = y * G + x;
      if (blocked(n) || taken.has(n)) continue;
      if (!reach.has(n)) return true;
      break;
    }
  }
  return false;
}
const SIDES4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// In a pocket smaller than you (less free log you can crawl to than your
// length), with your own body one thick within a flash ahead, free log
// beyond it, and at least 3 left in front of the cut?
// A rival in the air coming down on the line ahead of you, within LEAP_REACH + 1 cells: a leap now could meet it (see leapNow).
function fliersAhead(me) {
  const h = me.body[0], d = me.dir;
  return theGame.snakes.some(o => o !== me && o.alive && o.flight && [1, 2, 3, 4].slice(0, TUNE.LEAP_REACH + 1).some(n => landingOf(o).x === h.x + d.x * n && landingOf(o).y === h.y + d.y * n));
}
// Where a jump in the air comes down: its ring (a committed golden flight's, GOLD_FLY cells out).
const landingOf = o => o.flight.ring || o.flight.land;
// The fliers whose rings s's head could crawl onto before they're down (2y: a body there takes the landing).
function ringsInReach(s) {
  const h = s.body[0];
  return theGame.snakes.filter(o => o !== s && o.alive && o.flight?.ring && o.flight.ring.n >= 2 && Math.abs(o.flight.ring.x - h.x) + Math.abs(o.flight.ring.y - h.y) <= o.flight.ring.n - 1);
}
function tailToDrop(s) {
  const G = GRID_SIZE, h = s.body[0], taken = new Set();
  for (const o of theGame.snakes) if (o.alive) for (const c of o.body) taken.add(c.y * G + c.x);
  const blocked = k => theGame.holes.has(k) || !!theGame.fires?.has(k);
  const out = (x, y) => x < 0 || y < 0 || x >= G || y >= G;
  // (your own body counts as free where its tail will have left by the time
  // your head could crawl there: a coil you can crawl out of is no pocket)
  const own = new Map(s.body.map((c, j) => [c.y * G + c.x, j])), len = s.body.length;
  const reach = new Map([[h.y * G + h.x, 0]]), todo = [h.y * G + h.x];
  let free = 0;
  for (let q = 0; q < todo.length && free < len; q++) {
    const k = todo[q], x = k % G, y = (k - x) / G, d = reach.get(k) + 1;
    for (const [dx, dy] of SIDES4) {
      const nx = x + dx, ny = y + dy, n = ny * G + nx;
      if (out(nx, ny) || reach.has(n) || blocked(n)) continue;
      if (taken.has(n) && !(own.has(n) && d >= len - own.get(n))) continue;
      reach.set(n, d); todo.push(n); free++;
    }
  }
  if (free >= s.body.length) return false;
  for (let i = 1, x = h.x, y = h.y; i <= TUNE.FLASH_LENGTH; i++) {
    x += s.dir.x; y += s.dir.y;
    if (out(x, y)) return false;
    const j = s.body.findIndex(c => c.x === x && c.y === y);
    if (j < 0) { if (blocked(y * G + x) || taken.has(y * G + x)) return false; continue; }
    const bx = x + s.dir.x, by = y + s.dir.y;
    return j >= TUNE.MIN_LENGTH && !out(bx, by) && !theGame.holes.has(by * G + bx) && !taken.has(by * G + bx);
  }
  return false;
}

// Is there something to hop on your line, within n cells (a body, a hole, fire)?
// (next: on the way it goes next, a turn queued included.)
function hurdleAhead(s, n, next = false) {
  const d = next && s.queue.length ? s.queue[0] : s.dir, wrap = s.wrapUntil > theGame.time;
  for (let i = 1, x = s.body[0].x, y = s.body[0].y; i <= n; i++) {
    x += d.x; y += d.y;
    if (wrap) { x = (x + GRID_SIZE) % GRID_SIZE; y = (y + GRID_SIZE) % GRID_SIZE; } // (the edges wrapping: on round)
    else if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return false;
    const k = y * GRID_SIZE + x;
    if (theGame.holes.has(k) || theGame.fires?.has(k)) return true;
    for (const o of theGame.snakes) if (o.alive && o.body.some(c => c.x === x && c.y === y)) return true;
  }
  return false;
}

// Could a routine banner show now (no card up, none showing, fading or
// taking its breather, none waiting)? News and lessons that are over in a
// moment (a spawn, a dig) show only then, and aren't spent otherwise: the
// next one tells it.
const newsFree = () => overlay.classList.contains('hidden') && !waiting.length && performance.now() >= freeAt;
const DIG_NEAR = TUNE.BEETLE_DIG + 1; // (a beetle digging in this near your head, in cells across and down: one you could still catch, a move a tick through its dig and one flash's extra cell)
