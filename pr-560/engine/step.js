// Advance one tick. All snakes move at the same time. Returns the snakes that died.
// game.events lists what happened this tick, for the chatter, sounds and banners:
// { type: 'eat', snake, kind, x, y, color, cooked, gold } | { type: 'death', snake } | { type: 'spawn', kind, x, y }
// | { type: 'squash', snake, x, y } (its own bead at x, y: squashed under its head, food for nobody)
// | { type: 'crash', snake, x, y, cause, killer, killerId, lost } (it bounced, lost `lost` segments, and is stunned)
// | { type: 'leap', snake, x, y, gold, reach } (it took off over the cell x, y; reach: the cells it flies over, a tick each, landing the tick after)
// | { type: 'dash', snake, x, y, n, plain } (it went n cells from x, y: plain 1, a flash; else a golden dash) | { type: 'douse', x, y } (a dash put a fire out)
// | { type: 'fizzle', snake, why, x, y, flash } (asked to jump, or flash (flash: 1), but couldn't: 'resting' or
//   'landing'; x, y the cell it faced, off the board at the edge)
// | { type: 'alight', snake } (crawled into fire) | { type: 'singe', snake } (lost a segment to the flames)
// | { type: 'starving', snake } | { type: 'woodpecker' } (it came) | { type: 'aim', x, y }
// | { type: 'peck', x, y, cells, under } (a patch taken out; under: ids of the snakes whose bodies lay across it, bridging it)
// | { type: 'knock', kind, x, y, tx, ty, gold, color } (food the strike knocked from x, y to tx, ty, or eaten: tx, ty null;
//   gold: 1, a golden beetle; color: a bead's)
// | { type: 'cut', snake, x, y, lost, by } (a dash (by: who) cut it: its tail fell off) | { type: 'flown', x, y } (a beetle got away)
// | { type: 'rot', x, y, kind, color } (an apple (kind 'apple') or a bead ('pellet', in its color) rotted away)
// | { type: 'lastApples', x, y } (sudden death's first apple fell: the last apples come one at a time)
// | { type: 'baked', x, y, kind } | { type: 'ash', x, y, kind } (food in the fire)
// | { type: 'burrow', x, y, dug } (one cracked open; dug: 1, left by a dig) | { type: 'shut', x, y, at } (one starts growing shut, closing over at game time `at`) | { type: 'heal', x, y } (one closed over: sawdust and moss)
// | { type: 'dive', x, y, dug } | { type: 'emerge', x, y } (a beetle went down one,
//   or down where it dug in (dug: 1), came out of one) | { type: 'dig', x, y, until } (a cornered beetle digs in: gone at tick until)
// | { type: 'weather', kind } | { type: 'gust', x, y } (x -1 if no apple fell) | { type: 'charge', x, y } (lightning on its way)
// | { type: 'strike', x, y } | { type: 'rainbow', x, y } (and a golden apple there) | { type: 'ember', x, y, fx, fy } (a burning leaf blown)
function step(game) {
  game.events = [];

  // Hunger: each overdue snake loses a segment. One already at its minimum
  // length starves this tick, unless its head reaches food first.
  const dying = [], starving = [], drops = [];
  for (const s of game.snakes) {
    if (!s.alive || game.time < s.nextStarve) continue;
    s.nextStarve = game.time + T.STARVE_EVERY_MS;
    if (s.grow > 0) s.grow--;
    else if (s.body.length > T.MIN_LENGTH) s.body.pop();
    else { starving.push(s); continue; }
    if (hungerLeft(game, s) > -T.STARVE_EVERY_MS) game.events.push({ type: 'starving', snake: s });
  }

  // Mushrooms in cheeks whose time is up come back up, before anyone moves:
  // from where the ring has shown it would land all along.
  spit(game);

  const alive = game.snakes.filter(s => s.alive);

  // Everyone decides, except the stunned: they stay put (and can steer meanwhile).
  const moving = [], fallback = new Map(), held = new Map(); // (fallback: the auto-turn, for a power asked for over a crash that may not go after all; held: a flash there that can't go, and why)
  for (const s of alive) {
    s.tailMoves = false; s.air = false; s.landing = false; s.boom = false; s.failed = false; s.passed = null; s.bumped = false;
    s.shielded = s.shieldUntil > game.time; // (2u+: a crash this tick costs it nothing: see lossOf)
    if (s.stunUntil > game.tick) { s.next = null; continue; }
    let land = null;
    const f = s.flight;
    if (f?.gold) { // a golden flight: steered in the air, one turn a tick, on from where it is that way (round six B)
      if (f.held && f.flown < T.GOLD_FLY && !(s.isPlayer && !s.autopilot)) { // (a rival plans again where to come down, every move it's up: part 4, "the rivals fly it as a person would")
        aiDecide(aiView(game, s), brainOf(s), s.memory);
        if (s.memory.flyAt === game.tick) { const t = s.memory.flyTurn; s.flyTurn = t ? { at: t.at, dir: Object.values(DIRS).find(q => q.x === t.dir.x && q.y === t.dir.y) } : null; }
      }
      const d = f.held ? airTurn(game, s, f) : null; // (steered only while held: a quick press is a plain-length hop, its turns waiting till it's down)
      if (d) { f.dir = d; f.over = []; f.land = ahead(game, s, s.body[0].x, s.body[0].y, d); }
    }
    if (f?.over.length) { // in the air: on over the next cell it hops, a cell a tick (turns wait till it's landed, but a golden flight's)
      s.dir = f.dir;
      land = f.over.shift();
      s.air = true;
    } else if (f?.gold && f.held && f.flown < T.GOLD_FLY && flyOn(game, s, f)) { // held, a golden flight flies on, up to GOLD_FLY cells in the air
      s.dir = f.dir;
      land = f.land;
      f.land = ahead(game, s, land.x, land.y, f.dir);
      s.air = true;
    } else if (f) { // ...and then it comes down where it was going (let go: the next cell)
      s.dir = f.dir;
      s.flew = f.gold ? f.flown : 0; // (how many cells a golden flight was in the air, for whoever counts)
      land = f.land;
      s.flight = null;
      s.landing = true;
    } else {
      let steered = false;
      if (s.isPlayer && !s.autopilot) {
        while (s.queue.length) { // (never into its own neck, whatever was pressed: a backstop for the game's own check)
          const d = s.queue.shift(), c = ahead(game, s, s.body[0].x, s.body[0].y, d), n = s.body[1];
          if (n && c.x === n.x && c.y === n.y) continue;
          s.dir = d;
          steered = true;
          break;
        }
      } else {
        s.dir = s.plannedTick === game.tick ? s.planned : aiDecide(aiView(game, s), brainOf(s), s.memory);
        if (s.memory.power === game.tick) { // (it asked to jump, or flash, as a person would: twice for now; held for as far as it means to fly)
          leap(game, s);
          if (s.memory.leapNow === game.tick) leap(game, s);
          const t = s.memory.flyTurn;
          s.flyTurn = t ? { at: t.at, dir: Object.values(DIRS).find(q => q.x === t.dir.x && q.y === t.dir.y) } : null;
          if (!s.memory.fly) letGo(game, s); // (held for the full flight, or let go: the plain hop)
        }
        if (s.memory.flash === game.tick) flash(game, s);
      }
      s.planned = null;
      s.plannedTick = -1;
      // Over a crash and still facing what it hit (or the cell it met another
      // head in, while that's shut to it: see shutTo), without having
      // steered: it turns to where there's room. (Two heads that met in an
      // empty cell would otherwise both go for it again, and again, until
      // one of them was too small to bounce.)
      if (s.stunUntil === game.tick) {
        const { x: nx, y: ny } = ahead(game, s, s.body[0].x, s.body[0].y, s.dir), shut = shutTo(game, s);
        if (!steered && (blocked(game, nx, ny) || (shut && s.bounce.x === nx && s.bounce.y === ny))) {
          // A power asked for counts as steering, if it can go (either, of
          // two); one that can't says why, and the auto-turn takes it clear:
          // it isn't sent back into what it hit, nor blown up, for a press
          // that was never going to work. (One that can go and then doesn't,
          // its landing taken as it goes, gets the auto-turn too: see below.
          // So does a flash that can't go asked with a jump that can: it
          // waits on the jump, and says why once the jump hasn't gone.)
          const jump = s.leapArmed >= game.tick && leapWontGo(game, s), fl = s.flashArmed >= game.tick && flashWontGo(game, s, shut); // (false: not asked; null: it can go)
          const turn = recoil(game, s, shut);
          if (jump === null || fl === null) { fallback.set(s, turn); if (fl) held.set(s, fl); }
          else {
            if (jump || fl) { game.events.push({ type: 'fizzle', snake: s, why: fl || jump, x: nx, y: ny, flash: fl ? 1 : 0 }); s.leapArmed = -1; s.flashArmed = -1; } // (where it faced: the auto-turn is about to turn it)
            s.dir = turn;
          }
        }
        s.bounce = null;
      }
    }
    s.next = land ? { x: land.x, y: land.y } : ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
    if (s.air) { s.flight.flown++; s.flight.path.push(key(s.next.x, s.next.y)); }
    s.tailMoves = s.grow === 0;
    moving.push(s);
  }

  // Cells still occupied by bodies after everyone moves (tails that move
  // away are free; a stunned snake's isn't), and how many heads arrive in
  // each on-board cell.
  // (A body lifted in the air, over the cells its flight has passed, is no
  // wall to a head on the ground: that passes under it. See airCells.)
  stamp++;
  for (const s of alive) {
    const keep = s.tailMoves ? s.body.length - 1 : s.body.length, up = s.air && s.flight ? s.flight.path : null;
    for (let j = 0; j < keep; j++) {
      const k = key(s.body[j].x, s.body[j].y);
      if (up && up.includes(k)) continue;
      bodyStamp[k] = stamp;
      bodyOwner[k] = s.id;
    }
  }
  // Powers, for each snake that asked (see leap() and flash()). A jump
  // goes first if it can (something right in front to hop, somewhere to
  // land): no flash gets past that, so a jump and a flash pressed together
  // hop it, and the flash waits till it's landed, like one asked for in the
  // air. So does a flash that would only get as far as something further
  // on that the jump is for (see jumpFor): the snake crawls up to it and
  // hops it, so the two pressed together are never worse than the jump
  // alone. Else the flash goes (golden: a dash), and a jump waits its few
  // ticks for something to hop. The flashes are all worked out on the board
  // as it was before any of them moved, and two through one cell meet
  // there, so no seat goes first. A snake cut in two by a dash, too short
  // to go on, is out (gone).
  const gone = new Set(), hops = [], plans = [], went = new Set(), cuts = [];
  moving0 = moving; // (a jump won't take off toward a landing another head is moving into)
  for (const s of moving) {
    if (s.landing || s.air) { if (s.flashArmed >= game.tick) s.flashArmed = game.tick + 1; continue; } // (in the air, or on its way down: once it's moving on the ground)
    const jump = s.leapArmed >= game.tick, fl = s.flashArmed >= game.tick;
    if (jump && (!fl || held.has(s) || hopPlan(game, s))) { hops.push(s); if (fl) s.flashArmed = game.tick + 1; continue; }
    if (!fl) continue;
    const p = flashPlan(game, s), k = jump ? jumpFor(game, s, p) : -1;
    if (k < 0) { plans.push(p); continue; }
    s.flashArmed = game.tick + 1; // (it waits on the jump: right in front, the jump says why it can't go; further on, the snake goes straight on to it, no auto-turn)
    if (k === 0) hops.push(s); else went.add(s);
  }
  settle(game, plans);
  for (const p of plans) if (flashGo(game, p, cuts)) went.add(p.s);
  // (Of two cuts in one snake, the one nearer its head is the one that counts.)
  // (Its own body: the cell where it was, not where its head has just
  // gone through it.)
  const cutIndex = c => c.o === c.by ? c.o.body.findLastIndex(b => b.x === c.x && b.y === c.y) : c.o.body.findIndex(b => b.x === c.x && b.y === c.y);
  for (const c of cuts) c.j = cutIndex(c);
  cuts.sort((a, b) => a.o.id - b.o.id || a.j - b.j);
  for (const c of cuts) {
    const j = cutIndex(c);
    if (j > 0 && !gone.has(c.o)) cutAt(game, c.o, j, c.by, gone, dying, drops);
  }
  for (const s of hops) if (!gone.has(s)) hop(game, s);
  for (const [s, why] of held) { // (the jump it waited on hasn't gone: it says why it can't, where it faced, and the auto-turn takes it clear)
    if (gone.has(s) || s.air || !(s.flashArmed > game.tick)) continue;
    const c = ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
    game.events.push({ type: 'fizzle', snake: s, why, x: c.x, y: c.y, flash: 1 });
    s.flashArmed = -1;
  }
  for (const [s, d] of fallback) if (!s.air && !went.has(s)) { s.dir = d; s.next = ahead(game, s, s.body[0].x, s.body[0].y, d); }
  if (gone.size) for (let i = moving.length - 1; i >= 0; i--) if (gone.has(moving[i])) moving.splice(i, 1);
  const bumps = airBumps(game, moving);
  for (const s of moving) {
    if (s.air || s.bumped || !inside(s.next.x, s.next.y)) continue; // (off-board heads, heads in the air, and a flier bumped down where it was (it never gets there) never meet anyone)
    const k = key(s.next.x, s.next.y);
    if (headStamp[k] !== stamp) { headStamp[k] = stamp; headCount[k] = 0; headFirst[k] = s.id; }
    headCount[k]++;
  }

  // Who crashes: into the edge, a hole, a body, or head-on. killer: 'wall'
  // (walls and holes), 'self', or the name of the snake that was hit
  // (killerId: its id). Causes use names; the game turns the name of
  // whoever is watching into "you". A snake that crashes stays put, so its
  // tail stays too, and anyone heading into that tail crashes as well.
  const crashes = crashes0 = new Map(bumps);
  moving0 = moving;
  const crashOf = s => {
    const { x, y } = s.next;
    const k = key(x, y);
    if (!inside(x, y)) return { cause: s.boom ? 'dashed into the edge and blew up' : 'hit the edge', killer: 'wall', killerId: null };
    if (bridgeAt(game, s, x, y)) return headOnAt(s, x, y); // (round six B: another's body over a pit is a bridge, crossed on its back)
    if (bodyStamp[k] === stamp && !s.boom) { // (a body first: one lying over a hole is what it hit)
      const other = game.snakes[bodyOwner[k]];
      // Two heads swapping cells met head-on, just as if they'd met in one.
      const swapped = other !== s && x === other.body[0].x && y === other.body[0].y && other.next?.x === s.body[0].x && other.next?.y === s.body[0].y;
      return { cause: other === s ? 'bit itself' : swapped ? `crashed head-on into ${other.name}` : `ran into ${other.name}`, killer: other === s ? 'self' : other.name, killerId: other.id, headOn: swapped };
    }
    if (game.holes.has(k)) return { cause: s.boom ? 'dashed into a woodpecker hole and blew up' : 'hit a woodpecker hole', killer: 'wall', killerId: null }; // (it bounces off a hole's rim like the edge; only a leap coming down on one falls in)
    return headOnAt(s, x, y);
  };
  const headOnAt = (s, x, y) => {
    const k = key(x, y);
    if (headStamp[k] === stamp && headCount[k] > 1) {
      const other = moving.find(o => o !== s && !o.air && o.next.x === x && o.next.y === y);
      return { cause: `crashed head-on into ${other.name}`, killer: other.name, killerId: other.id, headOn: true, meet: true };
    }
    return null;
  };
  for (let more = true; more;) {
    more = false;
    for (const s of moving) {
      if (crashes.has(s) || s.air) continue;
      const c = crashOf(s);
      if (!c) continue;
      crashes.set(s, c);
      more = true;
      if (s.tailMoves) { const t = s.body[s.body.length - 1], k = key(t.x, t.y); bodyStamp[k] = stamp; bodyOwner[k] = s.id; }
    }
  }

  // A crash costs CRASH_LOSS segments off the tail (they fall off as food)
  // and a moment's stun. It's the end at MIN_LENGTH, dashing into the edge
  // or a hole, or if there'll be nowhere to turn when the stun's over (see
  // roomAfterStun: the cells its
  // tail breaks off from, cells rivals' tails will have left by then, and
  // a snake that's out count as room). A cell heads met in is room for one
  // of them once every other head that met there is out or has room of its
  // own (that one turns away; see recoil). Worked out until nothing
  // changes, since a snake that's out frees its cells for everyone else;
  // when nothing does, the shortest of those still boxed in are out first
  // (and the rest looked at again): so of two snakes that meet head-on, or
  // run into each other, each with nowhere else to turn, the longer one
  // bounces (the other's body, turned to food, makes room), and the same
  // length, both are out.
  const out = new Set(), live = new Set();
  const why = new Map(); // (why a crash was the end: for the card)
  for (const [s, c] of crashes) {
    // (A landing that crashed: its head comes down on what it hopped; a
    // hole, and in it goes, unless a body lies across it that's still
    // there once everyone's moved: that holds it up, till it moves on too,
    // and then it falls in (see fallIn). A body that crashes this tick
    // stays, but for the tail it loses, and none of it if it's blown up or
    // at its smallest: it's out.)
    const h = s.body[0], stays = (o, j) => crashes.has(o) ? !o.boom && o.body.length > T.MIN_LENGTH && j < o.body.length - Math.min(lossOf(o), o.body.length - T.MIN_LENGTH) : j < o.body.length - 1 || !o.tailMoves || !moving.includes(o);
    const down = s.landing || s.bumped; // (come down where it is: a landing that crashed, or bumped in the air)
    const under = down && game.snakes.find(o => o !== s && o.alive && !gone.has(o) && o.body.some((b, j) => b.x === h.x && b.y === h.y && stays(o, j)));
    if (down && game.holes.has(key(h.x, h.y)) && !under) {
      Object.assign(c, { cause: 'fell into a woodpecker hole', killer: 'wall', killerId: null, headOn: false, meet: false });
      out.add(s); why.set(s, 'hole');
    } else if (down && under && !game.holes.has(key(h.x, h.y))) { // (round six B: down onto a body, it's trapped there: out)
      Object.assign(c, { cause: `came down on ${under.name}`, killer: under.name, killerId: under.id, headOn: false, meet: false });
      out.add(s); why.set(s, 'boxed');
    } else if (s.landing && !out.has(s) && c.killer === 'wall' && inside(s.next.x, s.next.y) && game.holes.has(key(s.next.x, s.next.y))) { // (let go over a hole's rim: it comes down in the hole, whatever lies under it now)
      Object.assign(c, { cause: 'fell into a woodpecker hole', killer: 'wall', killerId: null, headOn: false, meet: false });
      out.add(s); why.set(s, 'hole');
    } else if (s.landing && !out.has(s) && c.killerId != null && !c.meet) { // (its landing taken by a body: the same bump, and out, whatever lies under it: "a fast golden flash through a landing cell steals the landing, and the jumper with it")
      const o = game.snakes.find(q => q.id === c.killerId);
      Object.assign(c, { cause: `came down on ${o === s ? 'itself' : o.name}`, killer: o === s ? 'self' : o.name, killerId: o.id, headOn: false, meet: false });
      out.add(s); why.set(s, 'boxed');
    }
    if (s.boom) { out.add(s); why.set(s, 'boom'); } // (blown up)
    else if (s.body.length <= T.MIN_LENGTH) { out.add(s); why.set(s, 'tiny'); } // (too small to bounce)
  }
  const room = s => {
    if (roomAfterStun(game, s, out)) return true;
    const h = s.body[0], back = s.body[1];
    for (const d of CRAWL) { // (a cell heads met in: the others there are out, or have room of their own)
      const { x, y } = ahead(game, s, h.x, h.y, d);
      if ((back && x === back.x && y === back.y) || !inside(x, y)) continue;
      const met = metAt(s, x, y);
      if (met && met.every(o => out.has(o) || roomAfterStun(game, o, out))) return true;
    }
    return false;
  };
  for (let undecided = true; undecided;) {
    let changed = false;
    for (const [s] of crashes) if (!out.has(s) && !live.has(s) && room(s)) { live.add(s); changed = true; }
    if (changed) continue;
    let least = Infinity;
    for (const [s] of crashes) if (!out.has(s) && !live.has(s)) least = Math.min(least, s.body.length);
    undecided = least < Infinity;
    for (const [s] of crashes) if (!out.has(s) && !live.has(s) && s.body.length === least) out.add(s); // (the shortest still boxed in)
  }
  // Why each one out was out (before any survivor loses its tail: the
  // lengths as they met): at its smallest, blown up, down a hole, or boxed
  // in; and of two that met head-on, the shorter one, or the same length.
  for (const [s, c] of crashes) {
    if (!out.has(s)) continue;
    const o = c.headOn ? game.snakes[c.killerId] : null;
    s.fatal = why.get(s) || (o && live.has(o) && o.body.length > s.body.length ? 'shorter' : o && out.has(o) && o.body.length === s.body.length && !why.has(o) ? 'even' : 'boxed');
  }
  for (const [s, c] of crashes) {
    if (out.has(s)) {
      s.cause = c.cause; s.killer = c.killer; s.killerId = c.killerId;
      s.queue.length = 0; // (out: nothing it pressed is ever going to happen)
      dying.push(s);
      continue;
    }
    s.queue.length = 0; // (a crash: whatever was pressed before it was for a board that's gone)
    const shield = s.shielded; // (2u+: a golden apple's shield takes this crash, and is gone)
    if (shield) s.shieldUntil = -1;
    const lost = Math.min(lossOf(s), s.body.length - T.MIN_LENGTH);
    for (let n = 0; n < lost; n++) { const t = s.body.pop(); drops.push({ x: t.x, y: t.y, color: s.color, owner: s.id }); }
    s.stunUntil = game.tick + 1 + stunOf(s);
    if (s.flashArmed > game.tick) s.flashArmed = s.stunUntil; // (a flash waiting on a jump, or on its landing: it goes when it moves again, as one pressed in a stun does)
    if ((s.landing || s.bumped) && burning(game, key(s.body[0].x, s.body[0].y))) { // (come down on fire: alight)
      if (!(s.burnUntil > game.tick)) { s.burnFrom = game.tick; game.events.push({ type: 'alight', snake: s }); }
      s.burnUntil = game.tick + T.BURN_TICKS;
    }
    s.bounce = c.headOn ? { x: s.next.x, y: s.next.y, by: c.killerId } : null;
    if (c.headOn) s.bumpedBy = { id: c.killerId, tick: game.tick };
    game.events.push({ type: 'crash', snake: s, x: s.next.x, y: s.next.y, cause: c.cause, killer: c.killer, killerId: c.killerId, lost, ...(s.failed ? { failed: 1 } : {}), ...(c.air ? { air: 1 } : {}), ...(shield ? { shield: 1 } : {}) });
  }

  for (const s of moving) {
    if (crashes.has(s)) continue;
    s.body.unshift(s.next);
    if (s.tailMoves) s.body.pop(); else s.grow--;
    if (!s.air && burning(game, key(s.next.x, s.next.y))) { // crawled into the fire: alight (not over it, in the air)
      if (!(s.burnUntil > game.tick)) { s.burnFrom = game.tick; game.events.push({ type: 'alight', snake: s }); }
      s.burnUntil = game.tick + T.BURN_TICKS;
    }
  }
  for (const s of dying) s.alive = false;

  eat(game);
  for (const s of starving) {
    if (!s.alive || s.ateTick === game.tick) continue; // crashed anyway, or reached food in time
    s.cause = 'starved'; s.killer = 'hunger'; s.fatal = 'hunger'; s.alive = false;
    dying.push(s);
  }
  singe(game, dying, drops);

  crawl(game);
  peck(game, dying);
  fallIn(game, dying);

  // Dead snakes fall to beads (every other segment: see leavesBead), and
  // broken-off pieces too (all of them), never on food, living bodies,
  // holes, fire or a burrow (nothing grows on one, and food there would
  // stop it up). Each bead remembers whose it was (you choke on your
  // own: see eat), and rots after a while, roasted ones later.
  if (dying.length || drops.length) {
    markBodies(game);
    for (const f of game.food) bodyStamp[key(f.x, f.y)] = stamp;
    for (const b of game.burrows) bodyStamp[key(b.x, b.y)] = stamp;
    const meat = (x, y, color, owner, cooked) => {
      const k = key(x, y);
      if (bodyStamp[k] === stamp || game.holes.has(k) || game.fires.has(k)) return;
      bodyStamp[k] = stamp;
      const expires = game.tick + Math.round(T.PELLET_TICKS * (cooked ? T.PELLET_COOKED : 1) * between(0.75, 1.25));
      game.food.push(cooked ? { x, y, kind: 'pellet', color, owner, expires, cooked: 1 } : { x, y, kind: 'pellet', color, owner, expires });
    };
    for (const s of dying) {
      s.diedAt = game.tick;
      game.events.push({ type: 'death', snake: s });
      s.body.forEach((c, j) => { if (leavesBead(j, s.body.length)) meat(c.x, c.y, s.color, s.id, s.burnUntil > game.tick); });
    }
    for (const d of drops) meat(d.x, d.y, d.color, d.owner, d.cooked);
  }

  fillFood(game);
  weather(game);
  const moved = game.time; // (the time this tick's moves were made at: who the edges wrapped for then)
  game.time += tickLength(game);
  game.tick++;
  promiseLandings(game);
  portals(game, moved);
  snapshot(game);
  return dying;
}

window.SnakeEngine = {
  GRID, PLAYER_COLOR, PERSONAS, DIRS, WEATHER,
  createGame, step, tickMs: tickLength, hungerLeft, hungerWarning, aiView, canThinkAhead, thinkAhead, suddenDeath, leap, letGo, leapIn, flash, flashIn, stamina, staminaIn, staminaStep, rollSide, knockTo, knocks, beakDepth, beakGap,
};
