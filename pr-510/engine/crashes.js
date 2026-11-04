// Does segment j (from the head) of a dead snake n long leave a bead? Every
// CORPSE_EVERY-th one does (a kill is worth less than the whole snake, so
// the first big fight doesn't snowball), and at least MIN_LENGTH of them:
// the other segments nearest its tail end make up the number.
function leavesBead(j, n) {
  if (j % T.CORPSE_EVERY === 0) return true;
  const wanted = Math.min(n, T.MIN_LENGTH) - Math.ceil(n / T.CORPSE_EVERY);
  if (wanted <= 0) return false;
  let behind = 0; // (skipped segments between this one and the tail end)
  for (let i = j + 1; i < n; i++) if (i % T.CORPSE_EVERY) behind++;
  return behind < wanted;
}
// Is this cell somewhere a head can't go (off the board, a hole, a body as
// things stand, or burning)?
function blocked(game, x, y) {
  if (!inside(x, y)) return true;
  const k = key(x, y);
  if (game.holes.has(k) || burning(game, k)) return true;
  for (const s of game.snakes) if (s.alive && s.body.some(c => c.x === x && c.y === y)) return true;
  return false;
}
// Just over a head-on: is the cell it met the other head in shut to it?
// Only one of the two may go back in, the longer one (the same length:
// the one that came first), so they can't meet there again; it's open to
// either once the other is out, still stunned, or no longer beside it.
function shutTo(game, s) {
  const b = s.bounce, o = b && game.snakes[b.by];
  if (!b || !o || !o.alive || o.stunUntil > game.tick || Math.abs(o.body[0].x - b.x) + Math.abs(o.body[0].y - b.y) !== 1) return false;
  return o.body.length > s.body.length || (o.body.length === s.body.length && o.id < s.id);
}
// Just over a crash, facing what it hit: the way to turn, the open side
// with the most room round it (counted a short way; a tail leaving this
// very tick counts as open, as it did for the verdict), and of sides with
// as much room, the longest open run ahead, then the one furthest from the
// edge (on an open board every side has room, and the first one tried used
// to win: often straight at the nearest edge). Straight on if there's none. Never the cell it met another head in while that's shut
// to it, and, if it can help it, not a cell another head could step into
// this tick too (two heads side by side across a corner would otherwise
// both turn into the corner they share, and meet again; the head it met,
// if that cell's its own to take, won't).
function recoil(game, s, shut) {
  const h = s.body[0], back = s.body[1], b = s.bounce;
  let best = s.dir, most = -Infinity;
  for (const d of CRAWL) {
    const { x, y } = ahead(game, s, h.x, h.y, d), met = b && b.x === x && b.y === y;
    if ((back && x === back.x && y === back.y) || (blocked(game, x, y) && !leavingNow(game, x, y) && !bridgeOver(game, s, x, y, 1)) || (met && shut)) continue; // (a bridge is a way on, as for the crash's verdict)
    let room = Math.min(24, roomFrom(game, x, y, 24)); // (a side that reaches the cap is as roomy as any other)
    for (const o of game.snakes) if (o !== s && o.alive && !(met && o.id === b.by) && Math.abs(o.body[0].x - x) + Math.abs(o.body[0].y - y) === 1) room -= 100;
    let run = 0; // (the open run ahead: cells straight on until something's in the way)
    for (let rx = x, ry = y; run < GRID; run++) { rx += d.x; ry += d.y; if (blocked(game, rx, ry)) break; }
    const edge = Math.min(x, y, GRID - 1 - x, GRID - 1 - y);
    const score = room * 1000 + run * 20 + edge;
    if (score > most) { most = score; best = d; }
  }
  return best;
}
// Facing what it hit, with a power asked for: why it can't go ('resting',
// 'small' or 'landing'), or null if it can. A jump needs to be ready (or
// golden), and somewhere to land.
function leapWontGo(game, s) {
  if (!(s.leaps > 0)) {
    if (s.body.length <= T.MIN_LENGTH) return 'small';
    if (game.time < s.leapReadyAt) return 'resting';
  }
  for (let c = ahead(game, s, s.body[0].x, s.body[0].y, s.dir), i = 0; i < T.LEAP_REACH; i++) {
    c = ahead(game, s, c.x, c.y, s.dir);
    if (!inside(c.x, c.y)) break;
    if (!blocked(game, c.x, c.y) || leavingNow(game, c.x, c.y) || bridgeOver(game, s, c.x, c.y, i + 2)) return null; // (a tail leaving this tick is free by the time it lands, as for the auto-turn; a bridge that lasts, as in leapPath)
  }
  return 'landing';
}
// A flash needs to be rested (or golden), and somewhere to go: not
// straight back into what it hit (or the cell it met a head in, shut to
// it), unless that's a body it cuts through (see flashPlan), and a golden
// one never into the edge or a hole on its way (it'd blow up). Further on,
// it goes, and meets what it meets.
function flashWontGo(game, s, shut) {
  const golden = s.dashes > 0, first = ahead(game, s, s.body[0].x, s.body[0].y, s.dir);
  if (!golden && T.FLASH_COST > 0 && s.body.length <= T.MIN_LENGTH) return 'small';
  if (!golden && game.time < s.flashReadyAt) return 'resting';
  if (shut && s.bounce.x === first.x && s.bounce.y === first.y) return 'landing';
  if (golden) for (let c = first, i = 1; i <= T.DASH_LENGTH; i++, c = ahead(game, s, c.x, c.y, s.dir)) if (!inside(c.x, c.y) || game.holes.has(key(c.x, c.y))) return 'landing';
  const owner = c => leavingNow(game, c.x, c.y) ? null : game.snakes.find(o => o.alive && o.body.some(b => b.x === c.x && b.y === c.y));
  if (!inside(first.x, first.y) || game.holes.has(key(first.x, first.y))) return 'landing';
  let c = first, n = 0;
  for (let o; inside(c.x, c.y) && (o = owner(c)); n++, c = ahead(game, s, c.x, c.y, s.dir)) if ((o.body[0].x === c.x && o.body[0].y === c.y) || (!golden && game.holes.has(key(c.x, c.y)))) return 'landing'; // (a head: it can't be cut; nor, by a plain flash, a body over a hole)
  return n && (n > (golden ? T.DASH_THICK : T.FLASH_THICK) || !inside(c.x, c.y) || game.holes.has(key(c.x, c.y))) ? 'landing' : null;
}
// Is (x, y) a tail end that moves on this very tick (its snake moving, not
// growing)? Not if it lies over a hole: what it leaves is the hole.
function leavingNow(game, x, y) {
  if (game.holes.has(key(x, y))) return false;
  for (const o of game.snakes) {
    if (!o.alive || o.grow > 0 || o.stunUntil > game.tick) continue;
    const t = o.body[o.body.length - 1];
    if (t.x === x && t.y === y) return true;
  }
  return false;
}
function roomFrom(game, x0, y0, cap) {
  const seen = new Set([key(x0, y0)]), queue = [[x0, y0]];
  while (queue.length && seen.size < cap) {
    const [x, y] = queue.shift();
    for (const d of CRAWL) {
      const nx = x + d.x, ny = y + d.y, k = key(nx, ny);
      if (seen.has(k) || blocked(game, nx, ny)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  return seen.size;
}
// After a crash: will there be anywhere to turn when the stun's over (not
// counting a cell heads met in: see the verdict in step)? A neighbouring
// cell (not back into its own neck), on the board and not a hole, that's
// free by the tick it moves again: free now; a cell another head arrives
// in, or a body cell, that'll have been left by then (see freeBy); its own
// tail that breaks off in the crash (or its tail end, leaving as it moves);
// or a body that's out this tick (it turns to food). Fire counts as room:
// you can go through fire. (out: snakes found to be out this tick.)
function roomAfterStun(game, s, out) {
  const h = s.body[0], back = s.body[1], keep = s.body.length - Math.min(lossOf(s), s.body.length - T.MIN_LENGTH), wake = 2 + stunOf(s);
  for (const d of CRAWL) {
    const { x, y } = ahead(game, s, h.x, h.y, d), k = key(x, y);
    if ((back && x === back.x && y === back.y) || !inside(x, y)) continue;
    if (game.holes.has(k)) { // (a pit: room only on a bridge that'll still be there when it moves again (see bridgeAt), its snake not out nor crashing now)
      if (bridgeOver(game, s, x, y, wake) && !game.snakes.some(o => (out.has(o) || crashes0.has(o)) && o.body.some((c, j) => j > 0 && c.x === x && c.y === y))) return true;
      continue;
    }
    const by = arrivalAt(x, y); // (a head that gets there this tick, on the ground or in the air: the cell's its head now...)
    if (by && !out.has(by) && !freeBy(game, by, -1, wake)) continue;
    if (!by && headStamp[k] === stamp && headCount[k] > 0 && metAt(s, x, y)) continue; // (only heads that crashed there: a cell they met in)
    // (...and a body there, under one in the air, counts as well)
    if (bodyStamp[k] !== stamp) return true;
    const o = game.snakes[bodyOwner[k]];
    if (!o || out.has(o)) return true;
    const j = o.body.findIndex(c => c.x === x && c.y === y);
    if (j < 0) return true;
    if (o === s) { if (j >= keep - (s.grow > 0 ? 0 : 1)) return true; continue; } // (its own: the tail that breaks off, or the tail end, leaving as it moves)
    if (freeBy(game, o, j, wake)) return true;
  }
  return false;
}
// Will cell j of snake o (-1: the cell its head's arriving in) be free by
// the tick a snake that crashed this tick moves again (wake: 2 + its stun,
// ticks after this one)? It's left on o's (length - j + growth)th move
// (a head may take a cell on the tick a tail leaves it), and o's moves
// start this tick, or once its stun's over (stunned, or crashed this tick:
// then its tail breaks off now, as food).
function freeBy(game, o, j, wake) {
  let L = o.body.length, wait = 0;
  if (crashes0.has(o)) {
    const lost = Math.min(lossOf(o), L - T.MIN_LENGTH);
    if (j >= L - lost) return true;
    L -= lost;
    wait = 1 + stunOf(o);
  } else wait = Math.max(0, o.stunUntil - game.tick);
  return wait + L - j + o.grow <= wake;
}
// What a crash this tick costs a snake, and how long it stuns it: more
// for a failed flash.
const lossOf = s => s.failed ? T.FAIL_LOSS : T.CRASH_LOSS;
const stunOf = s => s.failed ? T.FAIL_STUN_TICKS : T.STUN_TICKS;
// A head that gets to (x, y) this tick (it doesn't crash), if one does.
function arrivalAt(x, y) {
  for (const o of moving0) if (o.next && o.next.x === x && o.next.y === y && !crashes0.has(o)) return o;
  return null;
}
// The other heads that met in (x, y) this tick (an empty cell where heads
// arrived and crashed), or null if no heads met there.
function metAt(s, x, y) {
  let met = null;
  for (const o of moving0) {
    if (!o.next || o.next.x !== x || o.next.y !== y || !crashes0.has(o)) continue;
    if (!crashes0.get(o).meet) return null;
    if (o !== s) (met ||= []).push(o);
  }
  return met;
}
// Bumps in the air (round six B). In the air are each flying head (where
// it's going this tick) and the part of its body lifted over the cells its
// flight has passed. A flying head that goes into another snake's air
// bumps (two flying heads in one cell both do): it costs what a crash
// does, and it drops where it is (see the crashes: over a hole it falls
// in, onto a body it's trapped and out, into fire it's alight). Ground and
// air pass each other: a head on the ground goes under a flight (see the
// stamping above), and a flight over the ground. Returns [snake, crash]
// for each bumped, its flight over.
function airBumps(game, moving) {
  const fliers = moving.filter(s => s.air && s.flight);
  if (fliers.length < 2) return [];
  const owners = new Map();
  const put = (k, o) => { const a = owners.get(k); if (!a) owners.set(k, [o]); else if (!a.includes(o)) a.push(o); };
  for (const o of fliers) {
    put(key(o.next.x, o.next.y), o);
    const keep = o.tailMoves ? o.body.length - 1 : o.body.length;
    for (let j = 0; j < keep; j++) { const k = key(o.body[j].x, o.body[j].y); if (o.flight.path.includes(k)) put(k, o); }
  }
  const out = [];
  for (const s of fliers) {
    if (!inside(s.next.x, s.next.y)) continue;
    const o = owners.get(key(s.next.x, s.next.y)).find(o => o !== s);
    if (o) out.push([s, { cause: `bumped into ${o.name} in mid-air`, killer: o.name, killerId: o.id, air: 1 }]);
  }
  for (const [s] of out) {
    s.air = false; s.flight = null; s.bumped = true;
    for (const c of s.body) { const k = key(c.x, c.y); bodyStamp[k] = stamp; bodyOwner[k] = s.id; } // (it stays put, its tail too, and its lifted body comes down: a wall again to heads on the ground)
  }
  return out;
}
let crashes0 = new Map(), moving0 = []; // (this tick's crashes and moving snakes, for roomAfterStun)
// A snake on fire loses a segment every BURN_EVERY ticks (they fall off,
// roasted) until it goes out; rain and snow put it out sooner. At
// MIN_LENGTH, the flames finish it.
function singe(game, dying, drops) {
  const wet = game.weather.kind === 'rain' || game.weather.kind === 'snow';
  for (const s of game.snakes) {
    if (!s.alive || !(s.burnUntil > game.tick)) continue;
    if (wet) s.burnUntil = Math.min(s.burnUntil, game.tick + T.BURN_RAIN_TICKS);
    if (!(s.burnUntil > game.tick) || (game.tick - s.burnFrom) % T.BURN_EVERY !== T.BURN_EVERY - 1) continue;
    if (s.body.length <= T.MIN_LENGTH) {
      s.cause = 'burned up'; s.killer = 'fire'; s.killerId = null; s.fatal = 'fire'; s.alive = false;
      dying.push(s);
      continue;
    }
    const t = s.body.pop();
    drops.push({ x: t.x, y: t.y, color: s.color, owner: s.id, cooked: true });
    game.events.push({ type: 'singe', snake: s });
  }
}
