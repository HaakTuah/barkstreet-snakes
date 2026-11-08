// Now and then a beetle comes out of a burrow for a crawl (BEETLE_MAX at
// most out at once, above ground or under; `beetles`: how many are above).
// The first cracks a burrow open where it's quiet; later ones come out of
// a free burrow, or now and then open another.
function beetleOut(game, place, beetles) {
  if (beetles + game.unders.length >= T.BEETLE_MAX || game.time < T.BEETLE_FIRST_MS || Math.random() >= T.BEETLE_CHANCE * T.SEASONS[game.season].beetles) return; // (fewer in a lean season, more in plenty: 2i)
  let b = freeBurrow(game, -1);
  if (openBurrows(game) < T.BURROW_MAX && (!b || Math.random() < T.BURROW_NEW_CHANCE)) {
    const at = place(null, true, -1, T.BURROW_SPACING); // (quiet, and apart from the other burrows: burrows keep apart)
    if (at) b = openBurrow(game, at.x, at.y);
  }
  if (b) {
    const gold = Math.random() < T.GOLD_BEETLE_CHANCE;
    b.used = game.time;
    game.food.push({ x: b.x, y: b.y, kind: 'beetle', expires: game.tick + T.BEETLE_TICKS, dir: CRAWL[Math.floor(Math.random() * 4)], movedAt: game.tick, ...(gold ? { gold: 1 } : {}) });
    game.events.push({ type: 'spawn', kind: 'beetle', x: b.x, y: b.y, gold });
  }
}
// A burrow cracks open at (x, y): { x, y, at: the tick it opened, used:
// the game time a beetle last went into or came out of it (or it opened),
// dug: 1 if a beetle's dig left it (see BURROW_FROM_DIG), and once it's
// growing shut, shutFrom and shutAt: the game times it started and will
// close }. A dug one takes the place of any burrow nearer than
// BURROW_SPACING (that one grows shut); then, at BURROW_MAX open, the one
// unused longest grows shut to make room.
function openBurrow(game, x, y, dug = false) {
  if (dug) for (const h of game.burrows) if (Math.abs(h.x - x) + Math.abs(h.y - y) < T.BURROW_SPACING) shutBurrow(game, h); // (a dig by a burrow takes its place: that one grows shut, so burrows keep apart)
  if (openBurrows(game) >= T.BURROW_MAX) {
    let old = null;
    for (const h of game.burrows) if (!h.shutAt && (!old || (h.used ?? 0) < (old.used ?? 0))) old = h;
    shutBurrow(game, old);
  }
  const b = { x, y, at: game.tick, used: game.time, ...(dug ? { dug: 1 } : {}) };
  game.burrows.push(b);
  game.events.push({ type: 'burrow', x, y, ...(dug ? { dug: 1 } : {}) });
  return b;
}
// The burrows not growing shut (a beetle can come out of those).
const openBurrows = game => { let n = 0; for (const h of game.burrows) if (!h.shutAt) n++; return n; };
// A burrow starts growing shut, over BURROW_SHUT_MIN_MS to BURROW_SHUT_MAX_MS:
// sawdust creeps in from its rim and moss grows over it. A beetle can still
// dive into it meanwhile, but none comes out of it.
function shutBurrow(game, b) {
  if (b.shutAt) return;
  b.shutFrom = game.time;
  b.shutAt = game.time + Math.round(between(T.BURROW_SHUT_MIN_MS, T.BURROW_SHUT_MAX_MS));
  game.events.push({ type: 'shut', x: b.x, y: b.y, at: b.shutAt });
}
// A burrow closes over: the last of the sawdust and moss fill it.
function closeBurrow(game, b) {
  game.burrows.splice(game.burrows.indexOf(b), 1);
  game.events.push({ type: 'heal', x: b.x, y: b.y });
}
// How far (in cells) the nearest living head is.
function headGap(game, x, y) {
  let gap = 99;
  for (const s of game.snakes) if (s.alive) gap = Math.min(gap, Math.abs(s.body[0].x - x) + Math.abs(s.body[0].y - y));
  return gap;
}
// A burrow a beetle can come out of: open, nothing on it (not `not`, if
// there's another), the one farthest from any head.
function freeBurrow(game, not) {
  markBodies(game);
  for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
  let best = null, gap = -1, fallback = null;
  for (const b of game.burrows) {
    const k = key(b.x, b.y);
    if (bodyStamp[k] === stamp || game.fires.has(k) || game.holes.has(k) || b.shutAt || game.woodpecker?.target.includes(k)) continue; // (none comes out of one growing shut, nor under the beak)
    if (k === not) { fallback = b; continue; }
    const g = headGap(game, b.x, b.y);
    if (g > gap) { gap = g; best = b; }
  }
  return best || fallback;
}
const burrowAt = (game, x, y) => game.burrows.some(b => b.x === x && b.y === y);
// Beetles crawl a cell every few ticks: mostly straight on, now and then
// turning. With a head close by they scurry away, faster. Never into a body,
// a hole, other food or off the board; boxed in, they wait.
const CRAWL = [DIRS.up, DIRS.right, DIRS.down, DIRS.left];
// A scared beetle heads for a burrow if one's near (nearer than
// BEETLE_HOME_REACH), and dives in when it gets there; it comes out of a
// burrow (another, if there is one) a moment later. One cornered, a head
// within BEETLE_DIG_FEAR and no burrow in reach, digs in where it is: it
// stays put BEETLE_DIG ticks (b.digUntil: the tick it's gone; it can still
// be caught), then it's underground, as after a dive, and a burrow opens
// where it dug (BURROW_FROM_DIG; at BURROW_MAX the one unused longest
// grows shut to make room), so the burrows follow the hunting. (Off unless
// BURROW_HEAL_MS is set: a burrow nobody has used for that long grows shut.)
// A burrow grown shut closes over.
function crawl(game) {
  for (const h of [...game.burrows]) if (h.shutAt && game.time >= h.shutAt) closeBurrow(game, h);
  if (T.BURROW_HEAL_MS > 0) for (const h of game.burrows) {
    if (game.time - (h.used ?? 0) >= T.BURROW_HEAL_MS && !game.food.some(f => f.x === h.x && f.y === h.y)) shutBurrow(game, h);
  }
  for (let i = 0; i < game.unders.length; i++) {
    const u = game.unders[i];
    if (game.tick < u.until) continue;
    if (game.tick >= u.expires) { game.unders.splice(i--, 1); continue; } // (it stays home)
    let b = freeBurrow(game, u.from);
    if (!b && openBurrows(game) < T.BURROW_MAX) { // (none free, and room for one: it cracks a new one open where it's quiet, as beetleOut does, so burrows keep up with the woodpecker)
      const at = foodPlacer(game)(null, true, -1, T.BURROW_SPACING);
      if (at) b = openBurrow(game, at.x, at.y);
    }
    if (!b) continue;
    b.used = game.time;
    game.food.push({ x: b.x, y: b.y, kind: 'beetle', expires: u.expires, dir: CRAWL[Math.floor(Math.random() * 4)], movedAt: game.tick, ...(u.gold ? { gold: 1 } : {}) });
    game.events.push({ type: 'emerge', x: b.x, y: b.y });
    game.unders.splice(i--, 1);
  }
  let marked = false;
  const w = game.woodpecker, depth = w && w.target.length && game.tick <= w.strikeAt ? beakDepth(w.target, k => game.holes.has(k)) : null; // (the mark, while it's coming: how far each cell of it is from the bark beyond)
  for (const b of [...game.food]) {
    if (b.kind !== 'beetle') continue;
    let fear = 99, hx = 0, hy = 0;
    for (const s of game.snakes) {
      if (!s.alive) continue;
      const h = s.body[0], d = Math.abs(h.x - b.x) + Math.abs(h.y - b.y);
      if (d < fear) { fear = d; hx = h.x; hy = h.y; }
    }
    // The woodpecker's mark, as it aims, is danger as a head is: within
    // BEETLE_FEAR of it, a beetle scurries away from it, and for a burrow
    // in reach, and dives in. On it (under the beak), it scurries for a
    // burrow in reach, if it can get there before the strike; else off
    // the mark; else it digs in, if it can be gone in time (a dig there
    // leaves no burrow: it comes up elsewhere). One already digging that
    // will be gone in time keeps at it; one that won't, runs. Still there
    // at the strike, the bird eats it (see knocks). gap: how far off the
    // mark (on it, less than 0: minus how far it is from the bark beyond,
    // see beakGap); plan, on it: 1 home, 2 off the mark, 3 dig in.
    const gap = depth ? beakGap(w.target, depth, b.x, b.y) : 99, beak = -gap;
    let plan = 0, home = null, homeGap = T.BEETLE_HOME_REACH;
    if (gap < 0) {
      const E = T.BEETLE_SCARED_EVERY, first = Math.max(game.tick, b.movedAt + E), inTime = n => first + E * (n - 1) <= w.strikeAt;
      for (const h of game.burrows) {
        const g = Math.abs(h.x - b.x) + Math.abs(h.y - b.y);
        if (g < homeGap) { homeGap = g; home = h; }
      }
      if (b.digUntil > 0 && b.digUntil <= w.strikeAt) plan = 3;
      else if (home && inTime(homeGap)) plan = 1;
      else if (inTime(beak)) plan = 2;
      else if (!(b.digUntil > 0) && game.tick + T.BEETLE_DIG <= w.strikeAt) plan = 3;
      else plan = 2; // (too late for anything else: it runs anyway)
      if (plan !== 1) home = null;
      if (plan !== 3 && b.digUntil > 0) delete b.digUntil; // (a dig it can't finish in time: it runs instead)
      if (plan === 3 && !(b.digUntil > 0)) {
        b.digUntil = game.tick + T.BEETLE_DIG;
        game.events.push({ type: 'dig', x: b.x, y: b.y, until: b.digUntil });
      }
    } else if (!(b.digUntil > 0) && fear <= T.BEETLE_DIG_FEAR && !game.burrows.some(h => Math.abs(h.x - b.x) + Math.abs(h.y - b.y) < T.BEETLE_HOME_REACH)) {
      b.digUntil = game.tick + T.BEETLE_DIG;
      game.events.push({ type: 'dig', x: b.x, y: b.y, until: b.digUntil });
    }
    const fled = fear <= T.BEETLE_FEAR, scared = fled || gap <= T.BEETLE_FEAR;
    if (b.digUntil > 0) {
      if (game.tick < b.digUntil) continue; // (digging: it stays put)
      game.food.splice(game.food.indexOf(b), 1);
      goUnder(game, b);
      game.events.push({ type: 'dive', x: b.x, y: b.y, dug: 1 });
      if (T.BURROW_FROM_DIG && !depth?.has(key(b.x, b.y))) openBurrow(game, b.x, b.y, true); // (none where the beak's coming)
      continue;
    }
    if (game.tick - b.movedAt < (scared ? T.BEETLE_SCARED_EVERY : T.BEETLE_EVERY)) continue;
    if (!marked) {
      markBodies(game);
      for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
      for (const k of game.holes) bodyStamp[k] = stamp;
      for (const k of game.fires.keys()) bodyStamp[k] = stamp; // (beetles keep out of fire...)
      marked = true;
    }
    // The nearest burrow, if one's close enough to run for.
    if (!plan && scared) for (const h of game.burrows) {
      const g = Math.abs(h.x - b.x) + Math.abs(h.y - b.y);
      if (g < homeGap) { homeGap = g; home = h; }
    }
    let best = null, bestScore = -Infinity;
    for (const d of CRAWL) {
      const nx = b.x + d.x, ny = b.y + d.y, nk = key(nx, ny);
      if (!inside(nx, ny) || bodyStamp[nk] === stamp || (w && !plan && w.target.includes(nk))) continue; // (...and the woodpecker's way, unless it's on it already)
      let score = Math.random(); // a little wandering
      if (d === b.dir) score += 1.5; // it likes to keep going
      else if (d.x === -b.dir.x && d.y === -b.dir.y) score -= 1;
      if (fled) score += 3 * (Math.abs(nx - hx) + Math.abs(ny - hy) - fear); // away from the nearest head...
      if (home) score += (plan === 1 ? 4 : 2) * (homeGap - Math.abs(home.x - nx) - Math.abs(home.y - ny)); // ...and home, if it's near (under the beak, straight there: it reckoned on a straight run)
      if (plan === 2 || (!plan && gap <= T.BEETLE_FEAR)) score += 3 * (beakGap(w.target, depth, nx, ny) - gap); // (...and the beak, off its mark)
      if (score > bestScore) { bestScore = score; best = d; }
    }
    if (!best) continue;
    b.px = b.x; b.py = b.y;
    b.x += best.x; b.y += best.y;
    b.dir = best;
    b.movedAt = game.tick;
    b.scared = scared;
    bodyStamp[key(b.x, b.y)] = stamp;
    if (scared && burrowAt(game, b.x, b.y)) { // home: down it goes
      game.food.splice(game.food.indexOf(b), 1);
      game.burrows.find(h => h.x === b.x && h.y === b.y).used = game.time;
      goUnder(game, b);
      game.events.push({ type: 'dive', x: b.x, y: b.y });
    }
  }
}
// A beetle gone underground, where it went down (a burrow, or a dig): it
// comes up a while later.
function goUnder(game, b) {
  game.unders.push({ until: game.tick + Math.round(between(T.BEETLE_UNDER_MIN, T.BEETLE_UNDER_MAX)), expires: b.expires, from: key(b.x, b.y), gold: !!b.gold });
}
