// The game controller (see game/core.js): the banners for a round's big
// moments, where they go and how long they stay; and the cards.

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
      return toast(small ? FLAVOR.youCrashToThree : pick(FLAVOR.youCrash), 3000, 'warn', 'lesson');
    }
    const wrapLeft = me.wrapUntil - theGame.time;
    if (wrapLeft > 0 && wrapLeft <= TUNE.WRAP_WARN_MS && !theGame.toldWrapEnd) { theGame.toldWrapEnd = true; return toast(pick(FLAVOR.wrapEnding(Math.round(TUNE.WRAP_WARN_MS / 1000))), 1800, 'warn', 'lesson', { still: () => me.alive && me.wrapUntil > theGame.time }); }
    if (wrapLeft > TUNE.WRAP_WARN_MS) theGame.toldWrapEnd = false;
    const left = Engine.hungerLeft(theGame, me);
    const warnAt = TUNE.HUNGER_WARN_MS * (small ? 1.5 : 1); // (at your smallest, starving is the end: a little earlier, and sharper)
    if (left < warnAt && !theGame.warnedHunger) { theGame.warnedHunger = true; Sound.play('hungerWarn'); return toast(small ? FLAVOR.youStarvingSmall : pick(FLAVOR.youHungry), 2800, 'warn', 'lesson'); }
    if (left > warnAt) theGame.warnedHunger = false;
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
    if (e.type === 'eat' && e.kind === 'mushroom' && once('mushroom')) return toast(FLAVOR.youMushroomSpit, 2600, 'warn', 'lesson'); // (round six B: it comes back up, aimed by steering)
    if (e.type === 'leap' && !e.gold && once('leap')) return toast(FLAVOR.youLeapFirst, 3000, 'you', 'lesson');
    if (e.type === 'dash' && e.snake === me) flashedEver = true; // (you know the key: no more telling)
    if (e.type === 'dash' && !e.plain && once('dash')) return toast(FLAVOR.youDashFirst, 2800, 'gold', 'lesson');
    const refused = e.type === 'fizzle' && (e.flash ? FLAVOR.fizzleFlash : FLAVOR.fizzle)[e.why];
    if (refused && once((e.flash ? 'fizzleFlash' : 'fizzle') + e.why)) return toast(refused, 1800, 'warn', 'lesson');
    if (e.type === 'cut' && e.by === me.id && isMe(e.snake)) { if (once('youDropTail')) return toast(FLAVOR.youDropTail, 2400, 'you', 'lesson'); continue; } // (your own tail: dropped)
    if (e.type === 'cut' && e.by === me.id && once('youCutFirst')) return toast(FLAVOR.youCutFirst, 2400, 'gold', 'lesson');
    if (e.type === 'cut' && e.by === me.id) return toast(FLAVOR.youSnip(who(e.snake, true)), 1800, 'gold');
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
function tailToDrop(s) {
  const G = GRID_SIZE, h = s.body[0], taken = new Set();
  for (const o of theGame.snakes) if (o.alive) for (const c of o.body) taken.add(c.y * G + c.x);
  const blocked = k => theGame.holes.has(k) || !!theGame.fires?.has(k);
  const out = (x, y) => x < 0 || y < 0 || x >= G || y >= G;
  const reach = new Set([h.y * G + h.x]), todo = [h.y * G + h.x];
  let free = 0;
  while (todo.length && free < s.body.length) {
    const k = todo.pop(), x = k % G, y = (k - x) / G;
    for (const [dx, dy] of SIDES4) {
      const nx = x + dx, ny = y + dy, n = ny * G + nx;
      if (out(nx, ny) || reach.has(n) || blocked(n) || taken.has(n)) continue;
      reach.add(n); todo.push(n); free++;
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

// Where a banner goes (DESIGN "Teaching by showing"). On a phone held
// upright it's off the board altogether: above it, over the header's
// title row, between the screen's safe top and the header's row of
// buttons, so it never covers the board, the name tags (yours, with its
// hunger bar) or the pause button; on one line, its words as big as fit
// the row (the phone's own shorter words for the longest, FLAVOR.phone),
// and taps pass through it. Elsewhere it's on the board, at its top or
// its foot: never the middle, where the play is. (A rival's note, asked
// for from its tag while you watch, is too long for a line: it stays on
// the board.)
//
// On the board it keeps out of the way of heads (and the woodpecker's
// mark, a crackle, the steering hint). It comes up in the first of its
// two places that's clear (the top, the foot), and stays there while
// that place is clear: only something coming into it moves it on, to the
// other if that's clear; with both taken, it fades where it is while they
// pass. (Picked afresh every frame, a banner on a short phone hopped about
// three times in its three seconds, half its stays under 0.4 s.) Its size
// is measured once a banner, so this reads no layout. Its time runs while
// you can read it: faded, it stays that much longer (once, up to its hold
// again).
let toastTimer = 0, leaveTimer = 0, toastW = 0, toastH = 0, toastSlot = '', toastUnder = false, toastFresh = true; // (where it is on the board: '' the top, 'low' the foot; whether it's faded there; whether it's a new banner, still to place)
let toastFaded = 0, toastFadedAt = 0, toastLonger = false; // (how long this banner has been faded, since when, and whether it's had its time back)
let bannerText = '', toastAbove = false, aboveBand = null; // (the banner's words; whether it's above the board; where it may go there, measured in placeBoard: null where it's on the board)
const SLOTS = ['', 'low'], SHIFT = [{ opacity: 0 }, { opacity: 1 }];
const headerEl = document.querySelector('header');
function toastFade() {
  if (toastAbove || toastEl.hidden || toastEl.classList.contains('leaving')) return; // (above the board, nothing comes under it; going, it goes from where it is)
  const busy = { '': false, low: false }, soon = { '': false, low: false };
  if (boardPx && theGame) {
    const cell = boardPx / GRID_SIZE;
    const rows = Math.ceil((toastH + 12) / cell), half = toastW / 2 / cell; // (its real size: a long banner on a phone wraps to several lines)
    const under = (x, y, into = busy) => { // (a cell the banner would hide, if it's one that matters)
      if (Math.abs(x + 0.5 - GRID_SIZE / 2) >= half + 0.5 || y < 0 || y >= GRID_SIZE) return;
      if (y < rows) into[''] = true;
      if (y >= GRID_SIZE - rows) into.low = true;
    };
    for (const s of theGame.snakes) {
      if (!s.alive) continue;
      const h = s.body[0], d = s.queue?.[0] || s.dir;
      under(h.x, h.y);
      if (d) for (let i = 1; i <= 2; i++) under(h.x + d.x * i, h.y + d.y * i, soon); // (where it's going)
    }
    if (steerHintOn && Math.abs(hintBox.x + hintBox.w / 2 - boardPx / 2) < (toastW + hintBox.w) / 2) { // (the steering hint, by YOU: the banner makes way)
      const y0 = hintBox.y, y1 = hintBox.y + hintBox.h;
      if (y0 < toastH + 16) busy[''] = true;
      if (y1 > boardPx - toastH - 16) busy.low = true;
    }
    for (const k of theGame.woodpecker?.target || []) under(k % GRID_SIZE, Math.floor(k / GRID_SIZE)); // (the patch it's warning about)
    if (theGame.fires) for (const [k, f] of theGame.fires) if (f.strike && f.from > theGame.tick) under(k % GRID_SIZE, Math.floor(k / GRID_SIZE)); // (a crackle about to strike)
  }
  let slot = toastFresh ? '' : toastSlot, faded = false;
  if (toastFresh || busy[slot]) { // (new, or something's come into its place)
    const clear = SLOTS.filter(k => !busy[k]);
    if (clear.length) slot = clear.find(k => !soon[k]) ?? clear[0];
    else faded = true;
  }
  const moved = !toastFresh && slot !== toastSlot;
  toastFresh = false;
  if (faded !== toastUnder) {
    const now = performance.now();
    if (toastUnder) toastFaded += now - toastFadedAt;
    else toastFadedAt = now;
    toastEl.classList.toggle('under', faded);
    toastUnder = faded;
  }
  if (slot === toastSlot) return;
  toastEl.classList.toggle('low', slot === 'low');
  toastSlot = slot;
  if (moved && !reducedMQ.matches) toastEl.animate?.(SHIFT, { duration: 140, easing: 'ease-out' }); // (it comes up in its new place, rather than blinking there)
}
// The banner showing, put where it goes (and moved, if the screen's turned
// since): above the board, its words on one line as big as fit the title
// row across (no smaller than BANNER_MIN_FONT of its own size, then cut
// short with an ellipsis: no words of the game's need that, and a test
// checks it) and never taller than the row, level with the title; or on
// the board.
function placeToast() {
  const above = !!aboveBand && toastEl.dataset.kind !== 'note';
  if (above !== toastAbove) {
    toastAbove = above;
    (above ? headerEl : boardEl).appendChild(toastEl);
    toastEl.classList.toggle('above', above);
    toastEl.classList.remove('low', 'under');
    toastSlot = ''; toastUnder = false; toastFresh = true;
  }
  const words = above && (toastOpts.phone || FLAVOR.phone[bannerText]) || bannerText;
  if (toastEl.textContent !== words) toastEl.textContent = words;
  toastEl.style.removeProperty('--toast-fs');
  if (!above) return;
  const band = aboveBand, room = band.bottom - band.top;
  toastEl.style.setProperty('--toast-max', `${band.width}px`);
  const cs = getComputedStyle(toastEl), size = parseFloat(cs.fontSize), floor = size * TUNE.BANNER_MIN_FONT;
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const fit = () => {
    let fs = size;
    for (let i = 0; i < 3; i++) { // (a size, measured: once or twice)
      const wide = toastEl.scrollWidth, tall = toastEl.offsetHeight;
      let next = fs;
      if (wide > toastEl.clientWidth + 0.5 && fs > floor) next = Math.max(floor, fs * (toastEl.clientWidth - padX) / (wide - padX)); // (its words on one line, down to the floor; past it, an ellipsis)
      if (tall > room + 0.5) next = Math.min(next, fs * (room - padY) / (tall - padY)); // (and never taller than the row, whatever it takes: any taller, and it's over the pause button)
      next = Math.floor(next * 10) / 10;
      if (next >= fs) break;
      fs = next;
      toastEl.style.setProperty('--toast-fs', `${fs}px`);
    }
  };
  fit();
  if (toastOpts.short && toastEl.scrollWidth > toastEl.clientWidth + 0.5) { // (still cut at the floor: long names. Its shortest words, the cause dropped ("Gran is first out."); a screen reader and the chatter keep the full line)
    toastEl.textContent = toastOpts.short;
    toastEl.style.removeProperty('--toast-fs');
    fit();
  }
  const h = toastEl.offsetHeight;
  toastEl.style.setProperty('--toast-y', `${Math.round(Math.max(band.top, Math.min(band.bottom - h, band.mid - h / 2)))}px`);
}
// kind styles the banner for its moment: kill, gold, beetle, bird (the
// woodpecker), warn, fire, you (a lesson about your own powers, or your
// own tail), go, note (a rival's, asked for), and the weather's own (sun,
// wind, rain, storm, snow). level: 'round' (what changes the round: first
// blood, the last two, the woodpecker, the last apples, land it took,
// friends coming and going), 'lesson' (a rule, the first time it happens
// to you), 'news' (the weather, a spawn), 'asked' (a rival's note, asked
// for from its tag).
// Every banner is held for its reading time, read in glances while you
// steer: BANNER_BASE_MS and BANNER_WORD_MS a word, up to BANNER_MAX_MS (Go!
// and the wake's "Ready…" are beats of the countdown, held their own
// time; a note you asked for, its own reading time). Nothing cuts one
// short but a card: the next waits its turn, in the order they came, and
// shows a breather (BANNER_BREATHE_MS) after the last one's gone. Round
// news and the weather wait as long as it takes; a lesson waits at most
// LESSON_WAIT_MS of the round (behind one banner, never two: its moment
// has passed), and not if it no longer holds (opts.still), and up to
// three lessons wait. Only Go!, the countdown's last beat, and a note you
// asked for come up at once (what a note interrupts goes back to the
// front of the line). While a card is up, only round news. Screen readers
// hear round news and lessons (and the weather), not the chatter of
// spawns. opts: { quiet } (shown, not said: something else says it),
// { still } (a lesson that waits is shown only if this still holds),
// { follows } (a lesson that goes with the banner just before it: it
// waits from when that one comes up), { phone } (its words on a phone
// held upright, one line), { short } (its fewest words there, for when
// long names still don't fit a line: the first out without its cause).
let toastLevel = 'news', toastKind = '', toastOpts = {}, toastHold = 0, freeAt = 0;
const waiting = []; // banners waiting their turn: { text, ms, kind, level, opts, at (the round's time it came) }
const bannerLog = params.has('debug') ? [] : null; // (?debug: every banner and what became of it, for the tests and the audit)
const logBanner = (text, level, fate) => { if (bannerLog && bannerLog.length < 2000) bannerLog.push({ t: Math.round(performance.now()), gt: theGame?.time ?? 0, text, level, fate }); };
const readMs = text => Math.min(TUNE.BANNER_MAX_MS, TUNE.BANNER_BASE_MS + TUNE.BANNER_WORD_MS * text.trim().split(/\s+/).length);
function toast(text, ms = 2800, kind = '', level = 'news', opts = {}) {
  const now = performance.now();
  if (level !== 'round' && !overlay.classList.contains('hidden')) return logBanner(text, level, 'card'); // (a card's up)
  if (kind === 'go' || level === 'asked') { // (at once)
    if (level === 'asked' && !toastEl.hidden && !toastEl.classList.contains('leaving') && toastKind !== 'go' && toastLevel !== 'asked')
      waiting.unshift({ text: bannerText, ms: 0, kind: toastKind, level: toastLevel, opts: toastOpts, at: theGame?.time ?? 0 }); // (what the note interrupts goes back to the front of the line)
    return showToast(text, ms, kind, level, opts);
  }
  if (now < freeAt || waiting.length) { // (one showing, going, or taking its breather: this one waits its turn)
    if (level === 'lesson' && waiting.filter(w => w.level === 'lesson').length >= 3) return logBanner(text, level, 'dropped');
    waiting.push({ text, ms, kind, level, opts, at: theGame?.time ?? 0 });
    logBanner(text, level, 'queued');
    if (!toastTimer) toastTimer = setTimeout(nextToast, Math.max(0, freeAt - now));
    return;
  }
  showToast(text, ms, kind, level, opts);
}
function showToast(text, ms, kind, level, opts) {
  const now = performance.now(), hold = kind === 'go' || level === 'asked' ? ms : readMs(text);
  clearTimeout(toastTimer); clearTimeout(leaveTimer); leaveTimer = 0;
  toastLevel = level; toastKind = kind; toastOpts = opts; bannerText = text;
  toastHold = now + hold;
  freeAt = toastHold + TUNE.BANNER_FADE_MS + TUNE.BANNER_BREATHE_MS;
  toastEl.classList.remove('settled', 'leaving'); // (a new banner settles in)
  toastEl.dataset.kind = kind;
  toastEl.hidden = false;
  placeToast();
  toastW = toastEl.offsetWidth; toastH = toastEl.offsetHeight; // (measured once a banner)
  toastFaded = 0; toastFadedAt = now; toastLonger = false;
  toastFresh = true;
  toastFade(); // (placed before it's first drawn: a new banner doesn't start where the last one was)
  if (!opts.quiet && (level !== 'news' || kind in FLAVOR.weather)) say(text);
  logBanner(text, level, 'shown');
  if (waiting[0]?.opts.follows) waiting[0].at = theGame?.time ?? 0; // (a lesson that goes with this banner, next in line: its moment is this one's)
  toastTimer = setTimeout(endToast, hold);
}
// Its time is up: it fades, and the next waiting takes its turn after a
// breather. (A banner that spent a while faded under the heads first gets
// that time back, once.)
function endToast() {
  toastTimer = 0;
  const now = performance.now(), faded = toastFaded + (toastUnder ? now - toastFadedAt : 0);
  if (toastKind !== 'go' && toastLevel !== 'asked' && !toastLonger && !toastEl.hidden && faded >= 300) {
    toastLonger = true;
    const more = Math.min(faded, readMs(bannerText));
    toastHold = now + more;
    freeAt = toastHold + TUNE.BANNER_FADE_MS + TUNE.BANNER_BREATHE_MS;
    toastTimer = setTimeout(endToast, more);
    return;
  }
  hideToast(true);
}
// The first waiting banner that may still show: a lesson whose moment has
// passed, or that no longer holds, is let go.
function nextToast() {
  toastTimer = 0;
  while (waiting.length) {
    const w = waiting.shift();
    if (w.level === 'lesson' && theGame && theGame.time - w.at > TUNE.LESSON_WAIT_MS) { logBanner(w.text, w.level, 'stale'); continue; }
    if (w.opts.still && !w.opts.still()) { logBanner(w.text, w.level, 'skipped'); continue; }
    return showToast(w.text, w.ms, w.kind, w.level, w.opts);
  }
}
// Gone at once (a card is coming up: the banners waiting go with it), or
// faded out (its time is up, or its tag tapped again), the next waiting
// after a breather. It settles in with a short drop and fades out, and
// with reduced motion only fades (style/).
function hideToast(fade = false) {
  clearTimeout(toastTimer); toastTimer = 0;
  if (!fade && !toastEl.hidden && !toastEl.classList.contains('leaving') && performance.now() < toastHold) logBanner(bannerText, toastLevel, 'cut');
  toastHold = 0;
  if (!fade) {
    for (const w of waiting) logBanner(w.text, w.level, 'card');
    waiting.length = 0;
    freeAt = 0;
    clearTimeout(leaveTimer); leaveTimer = 0;
    toastEl.hidden = true;
    toastEl.classList.remove('leaving');
    return;
  }
  freeAt = performance.now() + TUNE.BANNER_FADE_MS + TUNE.BANNER_BREATHE_MS;
  if (waiting.length) toastTimer = setTimeout(nextToast, TUNE.BANNER_FADE_MS + TUNE.BANNER_BREATHE_MS);
  if (toastEl.hidden || toastEl.classList.contains('leaving')) return;
  toastEl.classList.add('leaving');
  leaveTimer = setTimeout(() => { leaveTimer = 0; toastEl.hidden = true; toastEl.classList.remove('leaving'); }, TUNE.BANNER_FADE_MS);
}
toastEl.addEventListener('animationend', e => { if (e.animationName === 'settle' || e.animationName === 'toast-fade-in') toastEl.classList.add('settled'); });

// Screen reader announcements (a permanently rendered, visually hidden region).
function say(text) { announcer.textContent = text; }

// (Pops only scale, so the compositor runs them: no repaint, even on a bite.)
const BUMP = [{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: 0.4 }, { transform: 'scale(1)' }];
const BUMP_TIMING = { duration: 280, easing: 'ease-out' };
function bump(el, frames = BUMP) {
  if (!reducedMQ.matches) el.animate?.(frames, BUMP_TIMING);
}
// A tag's length when it changes, a tag
// knocked out of the round, and a tag taking the lead.
const TAG_BUMP = [{ transform: 'scale(1)' }, { transform: 'scale(1.45)', offset: 0.35 }, { transform: 'scale(1)' }];
const KNOCK = [
  { transform: 'translateX(0) rotate(0)', backgroundColor: '#fca5a5' },
  { transform: 'translateX(-6px) rotate(-2deg)', offset: 0.18 },
  { transform: 'translateX(5px) rotate(2deg)', offset: 0.4 },
  { transform: 'translateX(-3px) rotate(-1deg)', offset: 0.65 },
  { transform: 'translateX(0) rotate(0)', backgroundColor: 'rgba(246, 236, 210, 0.66)' },
];
const REFUSED = [{ boxShadow: 'inset 0 0 0 2px #be123c' }, { boxShadow: 'inset 0 0 0 2px #be123c', offset: 0.6 }, { boxShadow: 'inset 0 0 0 0 rgba(190,18,60,0)' }];
const NUDGE = [{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)', offset: 0.25 }, { transform: 'translateX(3px)', offset: 0.6 }, { transform: 'translateX(0)' }];
const CROWNED = [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: 0.4 }, { transform: 'scale(1)' }];
function knock(el) {
  if (!reducedMQ.matches) el.animate?.(KNOCK, { duration: 480, easing: 'ease-out' });
}

// The frame lights up round its edge for the big moments, in the moment's
// colour (only its opacity animates, so it's cheap).
const GLOW = { gold: '#fde68a', beetle: '#34d399', kill: '#ef4444', bird: '#f97316', go: '#a3e635', win: '#fde68a', sun: '#fbbf24', wind: '#86efac', rain: '#60a5fa', storm: '#c4b5fd', snow: '#e0f2fe' };
function flashFrame(kind, strong = false) {
  if (reducedMQ.matches || !glowEl?.animate) return;
  glowEl.style.setProperty('--glow', GLOW[kind]);
  glowEl.animate([{ opacity: 0 }, { opacity: strong ? 1 : 0.75, offset: 0.12 }, { opacity: 0 }], { duration: strong ? 1500 : 800, easing: 'ease-out' });
}

// ----------------------------------------------------------- the cards

// card = { title, text, flavor, primary, secondary, opponents, reward, quiet,
//   friends (show "Play with friends"), lobby (which lobby parts, see renderLobby),
//   actions: { primary, secondary } (what the buttons do, instead of the usual) }
let cardActions = null, howRow = null;
function showCard(card) {
  hideToast();
  shownCard = card;
  cardTitle.textContent = card.title;
  setText(cardText, card.text || '');
  cardText.hidden = !card.text;
  flavorEl.textContent = (card.flavor || '').replace(/^\*(.+)\*$/, '$1');
  flavorEl.hidden = !card.flavor;
  opponentsEl.hidden = !card.opponents;
  hintEl.hidden = state !== 'ready';
  closeNote(); // (a new card: its own words)
  helpEl.hidden = state === 'ready'; // the start card already shows the controls
  startBtn.hidden = !card.primary;
  if (card.primary) startBtn.textContent = card.primary;
  watchBtn.hidden = !card.secondary;
  if (card.secondary) watchBtn.textContent = card.secondary;
  friendsBtn.hidden = !card.friends;
  howBtn.hidden = !card.how; // (the Field guide, from the start card, the nap and your death's card)
  if (card.how) howBtn.textContent = card.how;
  howRow = card.howRow || null; // (your death's card: the guide opens at what got you)
  cardLinks.hidden = friendsBtn.hidden && howBtn.hidden;
  // In the lobby the tags would show the solo round behind the card, not who's playing.
  tagsEl.style.visibility = state === 'lobby' ? 'hidden' : '';
  cardActions = card.actions || null;
  renderLobby(card.lobby);

  // The reward: a new best gets its own moment; the Hall of Fame asks for a
  // name only when the round really earned a place there.
  badgeEl.hidden = true;
  nameRow.hidden = true;
  if (card.reward && theGame.entryId) {
    if (theGame.newBest && !theGame.celebrated) {
      theGame.celebrated = true;
      Sound.play('best');
      Render.celebrate();
      flashFrame('win', true);
    }
    if (theGame.newBest) { badgeEl.textContent = FLAVOR.newBest(best); badgeEl.hidden = false; }
    const rank = yourRank();
    if (rank.overall && (rank.overall <= 3 || theGame.newBest)) {
      nameRank.textContent = Records.hasName() ? `Hall of Fame #${rank.overall}, as ${Records.getName()}.` : `Hall of Fame #${rank.overall}. ${CARVE}`;
      nameRow.hidden = false;
    } else if (rank.personal === 1 && theGame.newBest) {
      nameRank.textContent = Records.hasName() ? `Top of your own list, as ${Records.getName()}.` : `Top of your own list. ${CARVE}`;
      nameRow.hidden = false;
    }
    if (!nameRow.hidden && theGame.carveOffered && theGame.carveOffered !== card.title && document.activeElement !== nameInput) nameRow.hidden = true; // (offered once: the round-over card after your death card doesn't ask again)
    if (!nameRow.hidden) theGame.carveOffered = card.title;
    if (!nameRow.hidden && document.activeElement !== nameInput) nameInput.value = Records.hasName() ? Records.getName() : '';
    if (document.activeElement !== nameInput) nameRow.classList.toggle('carved', Records.hasName()); // (a name's in: on the smallest boards the field gives the card's links their room back)
    if (!nameRow.hidden) namingEntry = theGame.entryId;
  }

  overlay.querySelector('.card').classList.toggle('beat', !!card.beat); // the countdown: a big number
  overlay.querySelector('.card').classList.toggle('ended', state === 'over' && !!player() && !player().alive); // the round's card when your death ended it: its words say more than your death's (style/: how long you lasted), so more gives way to fit (a win keeps its badge)
  overlay.classList.remove('hidden');
  overlay.querySelector('.card').scrollTop = 0;
  if (!card.quiet) say(announcement(card));
  // Focus: the card itself on the first card, on a countdown (a focused Go!
  // mustn't take a key meant for the round) and when the carve is offered
  // (Tab goes to the name field); otherwise its main button.
  if (document.activeElement !== nameInput) {
    const cardEl = overlay.querySelector('.card');
    (firstCard || card.beat || card.focusCard || !nameRow.hidden ? cardEl : card.primary ? startBtn : card.secondary ? watchBtn : cardEl).focus({ preventScroll: true });
    firstCard = false;
  }
  updateControls();
}

// The carve is offered, never pressed on you: on a keyboard the card keeps
// focus (R, Enter and Space mean what they always do) and Tab reaches the field.
const CARVE = touchFirst ? 'Carve your name:' : 'Tab to carve your name:';

// Your Hall of Fame rank. Before the round is over, the snakes still alive
// haven't been saved, but they'll all finish ahead of you, so they count.
function yourRank() {
  const rank = Records.rankOf(theGame.entryId);
  if (state === 'over' || !rank.overall) return rank;
  let ahead = 0;
  for (const s of theGame.snakes) if (s.alive && (!online || (s.isPlayer && s.owner))) ahead++;
  const overall = rank.overall + ahead;
  return { overall: overall <= Records.MAX_SCORES ? overall : 0, personal: rank.personal };
}

// A card as a screen reader hears it: whole sentences (" · " would be read
// as "dot"), plus the new-best badge and the name prompt.
function announcement(card) {
  const sentence = t => (/[.!?…:]$/.test(t) ? t : `${t}.`);
  const unstar = t => t && t.replace(/^\*(.+)\*$/, 'Mimed: $1'); // (Mute's lines are stage directions: "star" isn't a word)
  const parts = [card.title, card.text && card.text.replaceAll(' · ', ', '), unstar(card.flavor),
    !badgeEl.hidden && badgeEl.textContent, !nameRow.hidden && nameRank.textContent];
  return parts.filter(Boolean).map(sentence).join(' ');
}

function hideCard() {
  closeNote();
  overlay.classList.add('hidden');
  shownCard = null;
  keepAwake(); // (back to the board: a round going on keeps the screen on)
}

// The roll-call on the start and countdown cards: every rival, AIs with a
// word on how they play, friends tagged as friends. On the start card each
// rival's seat is a button: who sits there is yours to choose (openPicker).
function buildOpponents() {
  opponentsEl.textContent = '';
  const seats = state === 'ready' && !online ? Records.seats(SnakeAI.POOL) : null;
  let seat = 0;
  for (const s of theGame.snakes) {
    if (isMe(s) || (!s.persona && !online)) continue;
    const li = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = dotColor(s);
    const name = document.createElement('strong');
    name.textContent = s.name;
    const blurb = document.createElement('span');
    blurb.className = 'blurb';
    blurb.textContent = s.persona ? s.persona.blurb : 'Your friend. For now.';
    if (seats && s.persona && seat < Records.SEATS) {
      const i = seat++;
      li.append(seatButton(i, dot, name, !!seats[i]), ' ', blurb);
    } else li.append(dot, name, ' ', blurb);
    opponentsEl.append(li);
  }
  const tip = document.createElement('li'); // (shown only where the blurbs are hidden: a small board)
  tip.className = 'tap-tip';
  tip.textContent = FLAVOR.tapTip;
  opponentsEl.append(tip);
}

// A rival's seat as a button that opens the picker: on the start card, and
// in the lobby for the host. A chosen one wears a ring.
function seatButton(i, dot, name, chosen) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'seat' + (chosen ? ' chosen' : '');
  button.dataset.seat = i;
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-label', `${name.textContent}, ${chosen ? 'chosen' : 'dealt'}. Choose who sits here`);
  button.title = 'Choose who sits here';
  const swap = document.createElement('span');
  swap.className = 'swap';
  swap.setAttribute('aria-hidden', 'true');
  swap.innerHTML = '<svg viewBox="0 0 12 12"><path d="M2 4h8M7.5 1.5 10 4 7.5 6.5M10 8H2M4.5 5.5 2 8l2.5 2.5"/></svg>';
  button.append(dot, name, swap);
  return button;
}

// YOU over your snake, from the countdown till a few seconds in (or just
// after you steer), and beside its arrow how to steer, until you do.
function markYou(on) {
  Render.showYou(on);
  if (on && !theGame.steered && player()) showSteerHint(); else hideSteerHint();
}
const steerHintEl = $('steer-hint'), hintAt = { x: 0, y: 0 }, hintBox = { x: 0, y: 0, w: 0, h: 0 };
let steerHintOn = false;
function showSteerHint() {
  if (steerHintOn) return;
  steerHintEl.textContent = FLAVOR.steerHint;
  steerHintEl.classList.add('on');
  hintBox.w = steerHintEl.offsetWidth; hintBox.h = steerHintEl.offsetHeight; // (measured once a round: no layout reads in the loop)
  steerHintOn = true;
  hintSpot = 0;
  placeSteerHint();
}
function hideSteerHint() {
  if (!steerHintOn) return;
  steerHintOn = false;
  steerHintEl.classList.remove('on');
}
// Level with the YOU label: over your head (under it heading down, or by
// the top edge, as the arrow goes), on whichever side has room and no
// rival's speech bubble (else the other side, else level with your head's
// other side: a line a rival's just started saying stays readable). It
// rides along with your head (a transform: the compositor's work).
const bubbles = [], bubbleSize = new WeakMap(); // (the bubbles' boxes this frame; each one's size, measured once, as the chatter does)
let hintSpot = 0;
function placeSteerHint() {
  const me = player();
  if (!me?.alive || !boardPx) return hideSteerHint();
  Render.headPx(me, drawAlpha, boardPx, hintAt);
  const c = boardPx / GRID_SIZE, w = hintBox.w, h = hintBox.h;
  let sgn = me.dir.y > 0 ? 1 : -1;
  if (sgn < 0 ? hintAt.y < c * 2.6 : hintAt.y > boardPx - c * 2.6) sgn = -sgn;
  const right = hintAt.x + c * 1.3, left = hintAt.x - c * 1.3 - w;
  const sides = right + w <= boardPx - 4 ? [right, left] : [Math.max(4, left), right];
  const spots = [];
  for (const s of [sgn, -sgn]) for (const x of sides) if (x >= 4 && x + w <= boardPx - 4) spots.push({ x, y: Math.min(boardPx - h - 4, Math.max(4, hintAt.y + s * c * 2.5 - h / 2)) });
  bubbleBoxes();
  const clear = p => bubbles.every(b => p.x >= b.x + b.w + 4 || b.x >= p.x + w + 4 || p.y >= b.y + b.h + 4 || b.y >= p.y + h + 4);
  if (!(spots[hintSpot] && clear(spots[hintSpot]))) hintSpot = Math.max(0, spots.findIndex(clear)); // (it stays put while it can: no hopping to and fro)
  const spot = spots[hintSpot] || { x: sides[0], y: hintAt.y + sgn * c * 2.5 - h / 2 }; // (no spot clear: where it'd be anyway)
  hintBox.x = Math.round(spot.x);
  hintBox.y = Math.round(spot.y);
  steerHintEl.style.transform = `translate(${hintBox.x}px, ${hintBox.y}px)`;
}
// The rivals' speech bubbles on the board, as the chatter placed them (its
// transforms: no layout read but a new bubble's size, once).
function bubbleBoxes() {
  bubbles.length = 0;
  for (const el of boardEl.querySelectorAll('.bubble')) {
    const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(el.style.transform);
    if (!m) continue;
    let size = bubbleSize.get(el);
    if (!size) bubbleSize.set(el, size = { w: el.offsetWidth, h: el.offsetHeight });
    bubbles.push({ x: Number(m[1]), y: Number(m[2]), w: size.w, h: size.h });
  }
}
