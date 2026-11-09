// The woodpecker's fight (entry 6, part 2): at the floor (see logFloor) it
// stops cutting and pecks at the snakes instead, aimed and warned like
// any strike, so they must dodge. It goes for the snake with the most log
// (see regions), where its head will be as the strike lands if it keeps
// on the way it's going (PECK_AIM_TICKS moves ahead, stopping at the
// log's end), or as near that as it may, a plus of up to five cells (w.zone) round a
// centre it takes (w.target, a single tile: a tile here and there in the
// very late game). Never within FIGHT_GAP of a head as it aims, never
// shutting anyone in (it has the whole warning to steer clear), never
// taking a tile that would cut a piece loose.
function fightAim(game) {
  const { owner, sizes } = regions(game), order = richest(game, sizes);
  if (!order.length) return null;
  const r = order[0], s = game.snakes[r], h = s.body[0];
  let ax = h.x, ay = h.y;
  for (let n = 0; n < T.PECK_AIM_TICKS; n++) {
    const nx = ax + s.dir.x, ny = ay + s.dir.y;
    if (!inside(nx, ny) || game.holes.has(key(nx, ny))) break;
    ax = nx; ay = ny;
  }
  const room = { now: null };
  const cands = [];
  for (let k = 0; k < CELLS; k++) if (owner[k] === r && !game.holes.has(k)) cands.push(k);
  const far = k => { const x = k % GRID; return Math.abs(x - ax) + Math.abs((k - x) / GRID - ay); };
  cands.sort((a, b) => far(a) - far(b) || a - b);
  for (const c of cands.slice(0, 40)) {
    const cx = c % GRID, cy = (c - cx) / GRID, zone = [c];
    for (const d of CRAWL) { const nx = cx + d.x, ny = cy + d.y; if (inside(nx, ny) && !game.holes.has(key(nx, ny))) zone.push(key(nx, ny)); }
    if (zone.some(k => headGap(game, k % GRID, (k - k % GRID) / GRID) <= T.FIGHT_GAP)) continue;
    if (cutLoose(game, new Set([c])).length) continue;
    if (shutsIn(game, zone, room)) continue;
    return { target: [c], zone };
  }
  return null;
}
// The fight's strike: a head on the ground in its zone takes a crash (as
// any crash: CRASH_LOSS off, stunned; at its smallest, out, "Pecked!").
// Returns the snakes it hit (their heads stay on their cells: the tile
// under a head isn't taken, so a hit is never a fall).
function fightHit(game, zone, dying, drops) {
  const hit = [];
  for (const s of game.snakes) {
    if (!s.alive || s.flight) continue;
    const k = key(s.body[0].x, s.body[0].y);
    if (!zone.has(k)) continue;
    hit.push(k);
    if (s.body.length <= T.MIN_LENGTH) {
      s.cause = 'got pecked by the woodpecker'; s.killer = 'wall'; s.killerId = null; s.fatal = 'pecked';
      s.alive = false; dying.push(s);
      continue;
    }
    s.shielded = s.shieldUntil > game.time; // (a golden apple eaten this very tick shields it too)
    const { lost, shield } = crashCost(game, s, drops);
    game.events.push({ type: 'crash', snake: s, x: s.body[0].x, y: s.body[0].y, cause: 'got pecked by the woodpecker', killer: 'wall', killerId: null, lost, ...(shield ? { shield: 1 } : {}) });
  }
  return hit;
}
