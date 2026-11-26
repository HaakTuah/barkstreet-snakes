// decide(view, persona, memory, draw): the AI's one way in. It reads the board in
// parts (seeBoard, readRisk, ...: see ai/core.js), runs the persona's driver,
// picks the best move, then weighs the powers against it.

// view = { grid, me: { id, body, dir, grow }, others: [{ id, body, dir }],
//          food: [{ x, y, kind }], holes: Set of cell indexes, age, tick, timeMs,
//          pecks: the woodpecker's mark (among the holes), strikeAt: its strike's tick,
//          landings: where it promised the food in its mark would land (its rings in the last PECK_PROMISE_TICKS moves),
//          fall: the cells of its mark on pieces it cuts loose (2s: they fall at the strike, with any food on them),
//          burrows: [{ x, y, shutAt (once it grows shut: the game time it closes over) }] }
// memory: an object kept for this snake for the whole round.
// draw: the stream this decision draws its chances from (the engine gives each its own; Math.random if none).
// What decide() sees and weighs, set afresh for each decision (the rest is set in its parts, each where it's read):
let view, persona, memory, intent, indexOf, fire, mark, pitAt, pit, all, w, bestDir, bestScore, picked;
function decide(viewIn, personaIn, memoryIn = {}, draw = null) {
  view = viewIn; persona = personaIn; memory = memoryIn; aiDraw = draw || MATH_DRAW;
  seeBoard();

  // ------------------------------------------------------------- drivers
  // intent: the effective weights for this decision plus who to hunt / lure
  // toward / keep away from. Drivers fill it in from the game state.
  intent = { w: persona.w, victim: -1, target: null, lure: -1, avoid: null, home: null, mimicDir: null, goal: null }; // (every field from the start: one shape)
  indexOf = id => others.findIndex(o => o.id === id);
  // A hole the woodpecker made, as I see it (among the holes I keep out
  // of, fire and its mark aren't pits).
  fire = view.fire || EMPTY, mark = view.pecks || EMPTY;
  const zone = view.zone || EMPTY;
  pitAt = i => holes.has(i) && !fire.has(i) && !mark.has(i) && !zone.has(i), pit = (x, y) => pitAt(y * N + x);

  all = others.map((_, k) => k);

  if (persona.driver && others.length) DRIVERS[persona.driver]();
  readDesperation();
  w = weighed(intent.w);
  if (view.act === 3 && !desperate) w.margin += TUNE.AI_FRENZY_MARGIN; // (entry 6: in the frenzy, caution rises: room counted more, so long ways round are shunned)
  readRisk();
  readSpit();
  readReach();
  readAppetite();
  readLandings();
  readFood();
  readBeetles();
  readLines();
  setUpSearch();

  // In the air on a golden flight (round six B, part 4: "the rivals fly it
  // as a person would"): every move I'm up, I plan again where to come
  // down, by what I see now: on, or a turn (2y: it always flies GOLD_FLY
  // cells, so where it comes down is only steered). The same weighing as
  // at take-off (leapOpt, in the air); the engine reads it as a turn, as a
  // person's (memory.flyTurn: counted from take-off).
  if (me.flight) {
    const pick = powerPick(-Infinity, me.flight.dir);
    if (pick) { memory.flyAt = view.tick; memory.flyTurn = pick.turn ? { at: me.flight.flown + pick.turn.at, dir: pick.turn.dir } : null; }
    return me.flight.dir;
  }
  bestDir = me.dir, bestScore = -Infinity;
  for (const d of DIR_LIST) {
    if (d.x === -me.dir.x && d.y === -me.dir.y) continue;
    let s = move(me.body, me.body.length, me.grow, d, depth, 0, 0);
    if (s === null) {
      const nx = myHead.x + d.x, ny = myHead.y + d.y;
      s = throughFire(nx, ny) ? 1.5 * DEAD : 2 * DEAD + maybeFree(nx, ny);
    }
    else if (intent.mimicDir && sameDir(d, intent.mimicDir)) s += w.mimic;
    s += aiDraw() * 1e-3; // tie-break
    if (s > bestScore) { bestScore = s; bestDir = d; }
  }
  // Off a doomed piece (part 2): my head in the woodpecker's mark (on the
  // piece it cuts loose, or its cut). The search's move, if it lives: it
  // crosses the mark only where I'd be off it before the strike (7c:
  // canEnter); otherwise (deeper in than that, it reads the mark as walls
  // and sees no way at all) the shortest way off, if I can make it in time.
  const off = view.strikeAt != null && mark.has(myHead.y * N + myHead.x) && bestScore <= DEAD ? escapeMark(true) || escapeMark(false) : null;
  if (off) return off;
  // Powers: each weighed as a move. The same search as crawling, from
  // where the power leaves me and to the same horizon, plus what it eats on
  // the way, less the risk where it lands and a price in apples (what an
  // apple is worth to me right now). Pressed only when it beats the best
  // crawl, and asked for just as a person presses (memory.flash, memory.power).
  picked = powerPick(bestScore, bestDir);
  if (picked) {
    bestDir = picked.d;
    if (picked.styled) memory.styled = view.tick; // (pressed for my power style: the census counts these)
    if (picked.flash) memory.flash = view.tick;
    else { memory.power = view.tick; memory.leapNow = picked.now ? view.tick : -1; memory.fly = picked.fly || 0; memory.flyTurn = picked.turn || null; } // (pressed twice for now; held for as far as it means to fly, steered where it means to turn)
  }
  return bestDir;
}

window.SnakeAI = { DIRS, PERSONAS, POOL, decide, watchStyles, traitsOf, styleOf, STYLE_TRAITS };

// The first step of the shortest crawl out of the woodpecker's mark, to a
// cell off it that's no hole and no body (bodies as seen, a tail as it
// leaves; and as the search reads the board, mineFree: a rival's path
// since I saw it), within the moves left before its strike; null if none. Wary:
// never a first step a rival's head could take too (`strikes`: a head-on),
// and only off onto room for me (no dead end just past the mark).
function escapeMark(wary) {
  const left = view.strikeAt - view.tick, start = myHead.y * N + myHead.x, from = new Map([[start, null]]);
  const occupied = (x, y, t) => [me, ...others].some(o => o.body.some((c, j) => c.x === x && c.y === y && o.body.length - j + (o === me ? Math.max(0, me.grow) : stunLeft(o)) > t)); // (a body's cell till its tail has passed: mine later while I grow, a stunned rival's while it's stunned)
  const blocked = (nk, t) => pitAt(nk) || fire.has(nk) || (view.zone || EMPTY).has(nk) || occupied(nk % N, (nk - nk % N) / N, t) || (!holes.has(nk) && mineFree[nk] > t);
  const roomy = (k0, t) => { // (as many free cells off the mark from there as I'm long)
    const seen = new Set([k0]), todo = [k0];
    while (todo.length && seen.size < me.body.length) {
      const k = todo.pop(), x = k % N, y = (k - x) / N;
      for (const d of DIR_LIST) { const nx = x + d.x, ny = y + d.y, nk = ny * N + nx; if (inGrid(nx, ny) && !seen.has(nk) && !mark.has(nk) && !blocked(nk, t)) { seen.add(nk); todo.push(nk); } }
    }
    return seen.size >= me.body.length;
  };
  let level = [start];
  for (let t = 1; t <= left && level.length; t++) {
    const next = [];
    for (const k of level) {
      const x = k % N, y = (k - x) / N;
      for (const d of DIR_LIST) {
        const nx = x + d.x, ny = y + d.y;
        if (!inGrid(nx, ny)) continue;
        const nk = ny * N + nx;
        if (from.has(nk) || blocked(nk, t) || (wary && t === 1 && strikes[nk] > 0)) continue;
        from.set(nk, k);
        if (!mark.has(nk) && (!wary || roomy(nk, t))) { let c = nk; while (from.get(c) !== start) c = from.get(c); const cx = c % N, cy = (c - cx) / N; return DIR_LIST.find(q => q.x === cx - myHead.x && q.y === cy - myHead.y); }
        next.push(nk);
      }
    }
    level = next;
  }
  return null;
}
