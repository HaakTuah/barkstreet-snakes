// A snake asks to jump: a person with Space or a tap, an AI by saying so
// when it decides (memory.power: the tick). It leaps (golden, or the plain
// one when it's ready) as soon as there's something right in front to hop
// and somewhere to land, waiting a few ticks for that.
// A second press while a jump waits sends it now, wherever it is, open
// ground included (round six B, leap now: see nowPath). The press is held
// (a key down, a finger on the glass) until letGo() lets go: a golden jump
// flies on while it's held (see GOLD_FLY).
function leap(game, s) {
  if (!s?.alive || s.flight) return; // (in the air already: the press does nothing)
  s.leapNow = s.leapArmed >= game.tick ? 1 : 0;
  s.leapArmed = Math.max(game.tick, s.stunUntil) + T.LEAP_WINDOW; // (stunned: from when it moves again)
  s.jumpHeld = 1;
}
// The jump let go (a key up, a finger lifted). Over the plain hop's cells a
// golden jump let go is the plain hop, down where it was going; held past
// them, it's committed: it always flies GOLD_FLY cells, steered, and letting
// go no longer brings it down (2y, the owner: "should it be you have to go 5 tiles").
function letGo(game, s) {
  if (!s?.alive) return;
  s.jumpHeld = 0;
  if (s.flight?.over.length) s.flight.held = 0;
  if (s.flight) s.flight.ring = flightRing(game, s);
}
// Where a jump in the air comes down, as its ring shows everyone: { x, y,
// n: moves till it's down }. A committed golden flight flies on, as the
// engine flies it (flyOn), to GOLD_FLY cells in the air; else down where
// it was going, past the cells it hops.
function flightRing(game, s) {
  const f = s.flight;
  let land = f.land, n = 1 + f.over.length, flown = f.flown + f.over.length;
  if (f.gold && f.held) while (flown < T.GOLD_FLY && flyOn(game, s, { land, dir: f.dir })) { land = ahead(game, s, land.x, land.y, f.dir); flown++; n++; }
  return { x: land.x, y: land.y, n };
}
// A snake asks to flash: a person with E, Shift or a swipe the way they're
// going, an AI by saying so (memory.flash: the tick). It goes the next tick
// it moves on the ground (in the air, once it's down): golden (a dash) if
// it holds any, else the plain one if rested.
function flash(game, s) {
  if (s?.alive) s.flashArmed = Math.max(game.tick, s.stunUntil); // (stunned: when it moves again)
}
// One stamina for both plain powers (2u): s.restedAt, when its bar is full
// again (game time), so how much is spent is how long till then, in ms of
// refill. A plain power goes with its share (JUMP_STAMINA_MS or
// DASH_STAMINA_MS) in the bar. Food puts
// some back (STAMINA_FOOD_MS a segment it grows you), and what's put back
// past the full bar banks in s.bank, up to STAMINA_BANK bars in all (2u+);
// a power is paid from the bank first, so a snake with any banked is full.
// (At time t: the renderer asks on the clock as drawn, and ahead of it.)
const spent = (game, s, t = game.time) => Math.max(0, s.restedAt - t);
// What's in the bar and the bank (ms of stamina), at time t.
const stamina = (game, s, t = game.time) => T.STAMINA_MS - spent(game, s, t) + s.bank;
// How long until it has `cost` in the bar (ms; 0: now), at time t.
const staminaIn = (game, s, cost, t = game.time) => Math.max(0, spent(game, s, t) - (T.STAMINA_MS - cost));
function tire(game, s, cost) {
  const b = Math.min(s.bank, cost);
  s.bank -= b;
  if (cost > b) s.restedAt = Math.max(s.restedAt, game.time) + cost - b;
}
// ms of stamina put back (a meal): the bar first, the rest banked.
function refill(game, s, ms) {
  const gap = spent(game, s);
  if (ms <= gap) { s.restedAt -= ms; return; }
  s.restedAt = Math.min(s.restedAt, game.time);
  s.bank = Math.min((T.STAMINA_BANK - 1) * T.STAMINA_MS, s.bank + ms - gap);
}
// How long until it can jump, or flash (ms; 0: now), golden charges included.
const leapIn = (game, s) => s.leaps > 0 ? 0 : staminaIn(game, s, T.JUMP_STAMINA_MS);
const flashIn = (game, s) => s.dashes > 0 ? 0 : staminaIn(game, s, T.DASH_STAMINA_MS);
// How its stamina shows on it (37-one-stamina), as anyone on the log sees
// it, at time t: 0 tired (it can afford neither power), 1 awake (one, or
// golden ones), 2 game on (a full bar), 3 charged (some banked above it:
// 2u+). Never more than the step.
function staminaStep(game, s, t = game.time) {
  if (s.bank > 0) return 3;
  const left = T.STAMINA_MS - spent(game, s, t);
  if (left >= T.STAMINA_MS) return 2;
  return s.leaps > 0 || s.dashes > 0 || left >= Math.min(T.JUMP_STAMINA_MS, T.DASH_STAMINA_MS) ? 1 : 0;
}
// A leap, the island hop: up over what's right in front (a body, a hole or
// fire), and on over up to LEAP_REACH cells of it, a cell a tick, coming
// down on the first free cell beyond (none of those) the tick after: over
// three, it's up three ticks and lands on the fourth. Only if there's
// somewhere to land within reach, on the board. Its body follows its
// head's path, over what it hopped. The plain leap takes its share of the
// stamina; golden ones are the same hop, free.
function hop(game, s) {
  const path = hopPlan(game, s);
  if (path) return leapGo(game, s, path);
  // Nothing went. Asked with something right in front to hop: say why not
  // (once), so a press isn't silently lost.
  const c = ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
  if (!inside(c.x, c.y)) { game.events.push({ type: 'fizzle', snake: s, why: 'landing', x: c.x, y: c.y }); s.leapArmed = -1; return; } // (the edge: nothing to hop, nowhere to land)
  if (hurdle(game, c)) {
    const why = leapIn(game, s) === 0 ? 'landing' : 'resting';
    game.events.push({ type: 'fizzle', snake: s, why, x: c.x, y: c.y });
    s.leapArmed = -1;
  }
}
// Could it leap now? Golden, or the plain one if it's ready. Its way, or null.
function hopPlan(game, s) {
  return leapIn(game, s) === 0 ? leapPath(game, s) : null;
}
// A flash asked for with a jump (p: its plan): if it would stop at a hurdle
// (run into it, or blow up in it: not a snake one thick a dash cuts, nor
// fire it puts out) that the jump could clear once it's right in front,
// how many cells before it that is (0: right in front), else -1. The way
// there must be free, the jump ready (golden, or rested), still asked for
// by then, and somewhere to land beyond the hurdle as things stand.
function jumpFor(game, s, p) {
  if (p.why) return -1;
  const k = p.cells.length - 1, end = p.cells[k];
  if (!inside(end.x, end.y) || !hurdle(game, end) || !p.stop) return -1;
  if (p.cells.slice(0, k).some(c => hurdle(game, c)) || s.leapArmed < game.tick + k) return -1;
  if (leapIn(game, s) > 0) return -1;
  for (let c = end, i = 0; i < T.LEAP_REACH; i++) {
    c = ahead(game, s, c.x, c.y, s.dir);
    if (!inside(c.x, c.y)) return -1;
    if (!hurdle(game, c)) return k;
  }
  return -1;
}
// Something a leap goes over: a body (still there after this tick's crawl), a hole or fire.
const hurdle = (game, c) => { const k = key(c.x, c.y); return bodyStamp[k] === stamp || game.holes.has(k) || burning(game, k); };
// The island hop's way: the cells it goes over (the first right in front,
// and every one a hurdle), then the first free cell beyond, within
// LEAP_REACH, where it lands; or null if there's nothing to hop or nowhere
// to land.
function leapPath(game, s) {
  if (s.leapNow) { const c = ahead(game, s, s.body[0].x, s.body[0].y, s.dir); if (inside(c.x, c.y) && !hurdle(game, c)) return nowPath(game, s); } // (leap now, over open ground: else the hop it would take anyway)
  const path = [];
  for (let c = s.body[0], i = 0; i <= T.LEAP_REACH; i++) {
    c = ahead(game, s, c.x, c.y, s.dir);
    if (!inside(c.x, c.y)) break; // (never off the board)
    path.push(c);
    if (!hurdle(game, c)) break;
  }
  if (path.length < 2) return null;
  if (hurdle(game, path[path.length - 1])) { // (nowhere free within reach: a bridge, where it'll still be there when it comes down (see bridgeAt), else nowhere)
    const i = path.findIndex((c, i) => i > 0 && lasting(game, s, c, i + 1));
    if (i < 0) return null;
    path.length = i + 1;
  }
  const land = path[path.length - 1];
  // (Nor toward a landing another head on the ground is moving into this tick: it'd come down on it.)
  if (moving0.some(o => o !== s && !o.air && !o.flight && o.next && o.next.x === land.x && o.next.y === land.y)) return null;
  return path;
}
// Leap now over open ground (round six B): over LEAP_REACH cells,
// whatever's there, a cell a tick, and down on the next, the fourth;
// else, short of it, on the farthest free cell (or bridge that lasts),
// never off the board, nor onto a landing another head is moving into.
function nowPath(game, s) {
  const path = [];
  for (let c = s.body[0], i = 0; i <= T.LEAP_REACH; i++) {
    c = ahead(game, s, c.x, c.y, s.dir);
    if (!inside(c.x, c.y)) break;
    path.push(c);
  }
  for (let n = path.length - 1; n >= 1; n--) {
    const c = path[n];
    if (hurdle(game, c) && !lasting(game, s, c, n + 1)) continue;
    if (moving0.some(o => o !== s && !o.air && !o.flight && o.next && o.next.x === c.x && o.next.y === c.y)) continue;
    path.length = n + 1;
    path.now = 1;
    return path;
  }
  return null;
}
// A golden flight's turn in the air: a person's next queued turn (not back
// on itself), a tick at a time; a rival's, the one it planned as it took
// off (flyTurn: after how many cells in the air, which way). null: on as it was.
function airTurn(game, s, f) {
  if (!s.isPlayer || s.autopilot) {
    const t = s.flyTurn;
    if (!t || f.flown !== t.at) return null;
    s.flyTurn = null;
    return t.dir.x === f.dir.x || t.dir.y === f.dir.y ? null : t.dir; // (a turn: not on, nor back)
  }
  while (s.queue.length) {
    const d = s.queue.shift();
    if ((d.x === -f.dir.x && d.y === -f.dir.y) || (d.x === f.dir.x && d.y === f.dir.y)) continue;
    return d;
  }
  return null;
}
// May a held golden flight fly on over the cell it would come down on?
// Only if the cell after that is on the board (it never flies off it).
function flyOn(game, s, f) {
  if (!inside(f.land.x, f.land.y)) return false;
  const c = ahead(game, s, f.land.x, f.land.y, f.dir);
  return inside(c.x, c.y);
}
function leapGo(game, s, path) {
  const golden = s.leaps > 0, reach = path.length - 1;
  if (golden) s.leaps--;
  else tire(game, s, T.JUMP_STAMINA_MS);
  s.next = path[0];
  s.air = true;
  // (held: a golden one flies on while the jump's held; flown: the cells it's been in the air over; path: their keys, its lifted body's)
  s.flight = { dir: s.dir, over: path.slice(1, reach), land: path[reach], gold: golden ? 1 : 0, held: golden && s.jumpHeld ? 1 : 0, flown: 1, path: [key(path[0].x, path[0].y)] };
  s.leapArmed = -1; s.leapNow = 0;
  game.events.push({ type: 'leap', snake: s, x: path[0].x, y: path[0].y, gold: golden ? 1 : 0, reach, ...(path.now ? { now: 1 } : {}) });
}
// A flash asked for, as it would go on the board before any power moves:
// { s, why, x, y } if it can't go (resting), else { s, gold,
// cells: the way it goes, ending where its head goes (or what it runs
// into, or blows up at), solid: what it runs into in each of them (a body
// it can't cut), boom, fail, stop, cuts, douse }.
//   The plain flash: FLASH_LENGTH cells this tick, along the ground; a
// golden one, a dash: DASH_LENGTH. Either cuts through a body (anyone's,
// its own too) up to its thickness (FLASH_THICK; a dash, DASH_THICK) where
// there's free log beyond it (on the board, no hole, no body: so a body
// along the edge, or against a hole or another body, can't be cut from
// that side). The cut is one a snake, where its cells crossed are nearest
// its head: everything behind falls off as beads (out, if less than
// MIN_LENGTH is left in front of it; never so for its own: that can't be
// reached straight ahead). Food on the way is eaten. The plain flash puts
// out the first fire it passes and goes into a second; a dash puts every
// fire out. Anything else in the way (a head, a body too thick, or with
// nothing free beyond, the edge or a hole) the flash gets as far as and
// runs into, and it has failed (see FAIL_LOSS); a dash at the edge or a
// hole blows up. (A dash cuts a body lying over a hole, then blows up in
// it; a plain flash fails there.) stop: it ends in something it doesn't
// get through (a failed one, a blown-up one, or into fire).
function flashPlan(game, s) {
  const gold = s.dashes > 0;
  if (flashIn(game, s) > 0) {
    const c = ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
    return { s, why: 'resting', x: c.x, y: c.y };
  }
  const p = { s, gold, cells: [], solid: [], boom: false, fail: false, stop: false, cuts: [], douse: [] };
  const cutFrom = new Map(); // (a snake it cuts on the way, and where: the rest of it is falling off)
  const bodyAt = c => {
    const k = key(c.x, c.y);
    if (!inside(c.x, c.y) || bodyStamp[k] !== stamp) return null;
    const o = game.snakes[bodyOwner[k]], j = o ? o.body.findIndex(b => b.x === c.x && b.y === c.y) : -1;
    return !o || j < 0 || cutFrom.get(o) <= j ? null : { o, j };
  };
  const n = gold ? T.DASH_LENGTH : T.FLASH_LENGTH, thick = gold ? T.DASH_THICK : T.FLASH_THICK;
  let run = 0, fires = 0; // (run: cells of a body it's cutting through still to cross)
  for (let c = s.body[0], i = 0; i < n; i++) {
    c = ahead(game, s, c.x, c.y, s.dir);
    const k = key(c.x, c.y), b = run ? null : bodyAt(c);
    p.cells.push(c);
    p.solid.push(false);
    if (!inside(c.x, c.y)) { if (gold) p.boom = true; else p.fail = true; break; }
    if (b) { // (a body: through it, if it's thin enough with free log beyond; else it's run into. A body first: one lying over a hole is cut, and then it's into the hole)
      const span = [b];
      let past = ahead(game, s, c.x, c.y, s.dir), q;
      while (span.length <= thick && (q = bodyAt(past))) { span.push({ ...q, c: past }); past = ahead(game, s, past.x, past.y, s.dir); }
      span[0].c = c;
      const clear = span.length <= thick && inside(past.x, past.y) && !game.holes.has(key(past.x, past.y));
      if (!clear || span.some(x => x.j === 0) || (!gold && span.some(x => game.holes.has(key(x.c.x, x.c.y))))) { p.solid[i] = true; p.fail = true; break; } // (a head can't be cut; nor what's too thick, or with nothing free beyond)
      for (const [k, x] of span.entries()) { // (one cut a snake, nearest its head, among the cells it reaches: one lying beyond its reach is only what it can't go on through)
        if (i + k >= n) break;
        const was = p.cuts.find(y => y.o === x.o && y.i === i);
        if (was && was.j <= x.j) continue;
        if (was) p.cuts.splice(p.cuts.indexOf(was), 1);
        p.cuts.push({ o: x.o, x: x.c.x, y: x.c.y, i, j: x.j });
      }
      for (const x of p.cuts) if (x.i === i) cutFrom.set(x.o, x.j);
      run = span.length;
    }
    if (run) run--;
    if (game.holes.has(k)) { if (gold) p.boom = true; else p.fail = true; break; }
    const fire = game.fires.get(k);
    if (fire && !(fire.strike && game.tick < fire.from)) { // (not lightning still on its way)
      if (!gold && fires++) { p.stop = true; break; } // (the plain flash: a second fire, it goes into)
      p.douse.push({ k, i });
    }
  }
  if (p.fail) { p.stop = true; if (!gold) p.douse.length = 0; } // (the plain one puts fire out only if it lands clear)
  if (p.boom) p.stop = true;
  return p;
}
// How many of a flash's cells its head gets through or into (not the
// last, if it runs into what's there, or blows up).
function reachOf(game, p) {
  const n = p.cells.length, c = p.cells[n - 1];
  return !inside(c.x, c.y) || game.holes.has(key(c.x, c.y)) || p.solid[n - 1] ? n - 1 : n;
}
// Two flashes through one cell this tick: each stops there (it cuts
// nothing there), and they meet as two heads do, whatever their seats.
// Two head-on along one line pass through a stretch of cells both ways,
// each reaching its own first of them before the other's: they meet
// halfway, both in its middle cell, or (an even stretch) each going into
// the middle cell the other has just taken, a swap, which is a head-on as
// it is for two crawling heads (see crashOf).
function settle(game, plans) {
  for (let again = plans.length > 1; again;) {
    again = false;
    const at = new Map(), reach = new Map(), first = new Map(), stops = []; // (at: each cell a head gets through or into, and the flashes that do; first: each flash's first cell another passes too)
    for (const p of plans) {
      if (!p.cells) continue;
      reach.set(p, reachOf(game, p));
      for (let i = 0; i < reach.get(p); i++) { const k = key(p.cells[i].x, p.cells[i].y); if (!at.has(k)) at.set(k, []); at.get(k).push(p); }
    }
    for (const [p, n] of reach) for (let i = 0; i < n; i++) if (at.get(key(p.cells[i].x, p.cells[i].y)).length > 1) { first.set(p, i); break; }
    for (const [p, i] of first) {
      const there = at.get(key(p.cells[i].x, p.cells[i].y)), q = there.length === 2 && there.find(o => o !== p), y = q && q.cells[first.get(q)];
      let stop = i;
      if (y && at.get(key(y.x, y.y)).length === 2) for (let n = i + 1; n < reach.get(p); n++) if (p.cells[n].x === y.x && p.cells[n].y === y.y) { stop = i + Math.floor((n - i + 1) / 2); break; } // (passing each other: halfway)
      stops.push([p, stop]);
    }
    for (const [p, i] of stops) {
      if (i === p.cells.length - 1 && !p.cuts.some(x => x.i === i)) continue; // (they meet where it was going anyway)
      p.cells.length = p.solid.length = i + 1;
      p.boom = p.fail = false;
      p.cuts = p.cuts.filter(x => x.i < i);
      p.douse = p.douse.filter(x => x.i <= i);
      again = true;
    }
  }
}
// A flash goes (see flashPlan): it moves, and says so; the cuts it makes
// are made once every flash has moved (see step). False if it couldn't go.
function flashGo(game, p, cuts) {
  const s = p.s;
  s.flashArmed = -1;
  if (p.why) { game.events.push({ type: 'fizzle', snake: s, why: p.why, x: p.x, y: p.y, flash: 1 }); return false; }
  if (p.gold) s.dashes--;
  else tire(game, s, T.DASH_STAMINA_MS);
  const from = s.body[0], last = p.cells.length - 1;
  for (let i = 0; i < last; i++) {
    advance(s, p.cells[i]);
    (s.passed ||= []).push(p.cells[i]); // (food on the way: eaten after everyone's moved, with what its head finds)
  }
  s.next = p.cells[last]; // (its head goes here, with everyone else's)
  s.boom = p.boom;
  s.failed = p.fail && !p.boom; // (if it crashes now, it's a failed flash: see FAIL_LOSS)
  for (const { k } of p.douse) if (game.fires.has(k)) douse(game, k);
  for (const c of p.cuts) cuts.push({ o: c.o, x: c.x, y: c.y, by: s });
  game.events.push({ type: 'dash', snake: s, x: from.x, y: from.y, n: last + 1, ...(p.gold ? {} : { plain: 1 }) });
  return true;
}
// A dash cuts o at body index j (by: the dasher).
function cutAt(game, o, j, by, gone, dying, drops) {
  if (j < T.MIN_LENGTH && o === by) return; // (its own: never out by its own flash (it can't reach so near its head straight on anyway))
  if (j < T.MIN_LENGTH) { // (too little left in front of the cut: out)
    for (const b of o.body) unstamp(o, b);
    o.cause = `got cut in two by ${by.name}`; o.killer = by.name; o.killerId = by.id; o.fatal = 'cut';
    dying.push(o);
    gone.add(o);
    return;
  }
  const cut = o.body.splice(j);
  for (const b of cut) if (o !== by || !o.body.some(c => c.x === b.x && c.y === b.y)) unstamp(o, b); // (its own: not where its head has just gone through)
  for (let i = 1; i < cut.length; i++) drops.push({ x: cut[i].x, y: cut[i].y, color: o.color, owner: o.id });
  if (o.tailMoves) unstamp(o, o.body[o.body.length - 1]); // (its new tail moves on this tick)
  game.events.push({ type: 'cut', snake: o, x: cut[0].x, y: cut[0].y, lost: cut.length, by: by.id });
}
// Mid-tick, for the cells a leap or a dash passes on the way: its head on a
// cell (now part of its body), and the tail end moving up after it.
function advance(s, c) {
  s.body.unshift({ x: c.x, y: c.y });
  const k = key(c.x, c.y);
  bodyStamp[k] = stamp; bodyOwner[k] = s.id;
  trim(s);
}
// Its tail end gone (pending growth first), as the stamps go: if its new
// tail will move on this tick, that cell's free.
function trim(s) {
  if (s.grow > 0) s.grow--; else s.body.pop();
  s.tailMoves = s.grow === 0;
  if (s.tailMoves) unstamp(s, s.body[s.body.length - 1]);
}
function unstamp(s, c) {
  const k = key(c.x, c.y);
  if (bodyStamp[k] === stamp && bodyOwner[k] === s.id) bodyStamp[k] = 0;
}
