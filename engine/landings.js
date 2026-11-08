// Never shut anyone in: would this patch leave a snake less room than its
// length (pending growth too), where it has that much now? Room is timed,
// as a snake really has it (see timedRoom). room.now: each snake's room
// without the patch, worked out the first time it's asked. until: moves
// a snake may still cross the patch's cells (entry 6: the severing peck's
// warning, to get off a piece it cuts loose); 0, never.
const SHUT = 1 << 30;
const openAt = new Int32Array(CELLS), roomSeen = new Int32Array(CELLS), roomQ = new Int32Array(CELLS);
let roomStamp = 0;
const roomNeed = s => s.body.length + Math.max(0, s.grow);
function shutsIn(game, patch, room, until = 0) {
  if (!room.now) {
    timedGrid(game);
    room.now = new Map();
    for (const s of game.snakes) if (s.alive) room.now.set(s, timedRoom(game, s, null, roomNeed(s)));
  }
  const set = new Set(patch);
  for (const s of game.snakes) {
    if (!s.alive) continue;
    const need = roomNeed(s);
    if (room.now.get(s) < need) continue; // (shut in already: not the patch's doing)
    if (timedRoom(game, s, set, need, until) < need) return true;
  }
  return false;
}
// When each cell opens up, in ticks from now: a hole never; a body's cell
// once its tail has passed it (later for a snake still stunned, or still
// to grow); the rest now.
function timedGrid(game) {
  openAt.fill(0);
  for (const k of game.holes) openAt[k] = SHUT;
  for (const s of game.snakes) {
    if (!s.alive) continue;
    const L = s.body.length, extra = Math.max(0, s.stunUntil - game.tick) + Math.max(0, s.grow);
    s.body.forEach((c, j) => { const k = key(c.x, c.y); openAt[k] = Math.max(openAt[k], L - j + extra); });
  }
}
// A snake's room: the cells its head can reach, each by the time it's
// open (see timedGrid), through `shut` (a patch) only within its first
// `until` moves and never counting it, counted up to `need`.
function timedRoom(game, s, shut, need, until = 0) {
  const st = ++roomStamp, h0 = key(s.body[0].x, s.body[0].y);
  roomSeen[h0] = st; roomQ[0] = h0;
  let read = 0, write = 1, room = 0;
  for (let d = 1; read < write && room < need; d++) {
    const end = write;
    while (read < end) {
      const i = roomQ[read++], x = i % GRID, y = (i - x) / GRID;
      for (const dd of CRAWL) {
        const nx = x + dd.x, ny = y + dd.y;
        if (!inside(nx, ny)) continue;
        const ni = key(nx, ny);
        if (roomSeen[ni] === st || openAt[ni] > d) continue;
        const inShut = shut && shut.has(ni);
        if (inShut && d >= until) continue;
        roomSeen[ni] = st; if (!inShut) room++; roomQ[write++] = ni;
      }
    }
  }
  return room;
}
// Where a piece of food at (x, y), in the woodpecker's patch (cells), is
// knocked to when it strikes: the nearest free cell outside the patch, as
// the crow flies; of those as near, the one nearest the middle of the log;
// then the first by row. Null if there's none (the bird eats it). Free: on
// the board, not a hole, not in the patch, no body (but for one whose tail
// will have left by the strike: see knockRoom), no food, no burrow
// (nothing grows on one, and food there would stop it up), not burning.
// A rule, never chance, so anyone can see where it'll land. isFree(x, y):
// may it land there? (The engine's: see knockRoom; an AI may pass its own,
// as for rollSide. The patch and the board's edge hold whatever it says.)
function knockTo(game, x, y, cells, isFree = null) {
  const patch = cells instanceof Set ? cells : new Set(cells), free = isFree || knockRoom(game);
  let best = -1, near = Infinity, mid = Infinity;
  for (let k = 0; k < CELLS; k++) {
    if (patch.has(k)) continue;
    const cx = k % GRID, cy = (k - cx) / GRID, d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
    if (d > near) continue;
    const m = Math.abs(2 * cx - (GRID - 1)) + Math.abs(2 * cy - (GRID - 1)); // (twice the steps to the middle)
    if ((d < near || m < mid) && free(cx, cy)) { best = k; near = d; mid = m; }
  }
  return best < 0 ? null : { x: best % GRID, y: Math.floor(best / GRID) };
}
// How many moves everyone still makes before the woodpecker strikes,
// between ticks (or as a tick starts): the strike comes after the moves of
// the tick strikeAt. 0 with no strike coming.
const strikeIn = game => {
  const w = game.woodpecker;
  return w && w.strikeAt >= game.tick ? w.strikeAt - game.tick + 1 : 0;
};
// The engine's "free", for knockTo: the board as it will be at the strike,
// `ahead` moves on, as far as anyone can tell now. A body's cell its tail
// will have left by then is free (a tail moves on a cell a move, once a
// stunned snake moves again): through the aim, the ring then stays put as
// a tail passes, where before it hopped to each cell a tail left (89 of
// 127 rings that moved). Growth to come isn't counted (nobody can see it);
// a tail that stays on a ring after all sends that piece as near it as it
// can (see knocks). At the strike itself (ahead 0), the board as it stands.
function knockRoom(game, ahead = strikeIn(game)) {
  const taken = new Uint8Array(CELLS);
  for (const s of game.snakes) {
    if (!s.alive) continue;
    const L = s.body.length, still = Math.max(0, (s.stunUntil ?? 0) - game.tick);
    for (let j = 0; j < L; j++) if (L - j + still > ahead) taken[key(s.body[j].x, s.body[j].y)] = 1;
  }
  for (const f of game.food) taken[key(f.x, f.y)] = 1;
  for (const b of game.burrows) taken[key(b.x, b.y)] = 1;
  return (x, y) => inside(x, y) && !taken[key(x, y)] && !game.holes.has(key(x, y)) && !burning(game, key(x, y));
}
// Where everything in the patch (cells) would be knocked, on the board as
// it will be at the strike (see knockRoom): [{ food, to }] (to null:
// eaten), in the order the strike does them, each landing taken before the
// next is knocked. The strike's own list, and what anyone can work out
// through the aim. promised: the woodpecker's landings (see
// promiseLandings), or none: a piece promised a cell that's still free (on
// the board, out of the patch, as knockRoom says) lands there, wherever
// else has come free since; one whose cell was taken meanwhile (a head or
// a beetle moved onto it, and is still there) lands as near its ring as it
// can, by the same rule; the rest go by the rule from where they lie;
// never onto a promised cell. So knocks(game, w.target, w.landings) is what
// the rings show and the strike does. ahead: moves still to come before
// the strike (see strikeIn; the strike itself passes 0).
function knocks(game, cells, promised = null, ahead = strikeIn(game)) {
  const patch = cells instanceof Set ? cells : new Set(cells), room = knockRoom(game, ahead), landed = new Set(), out = [], fell = game.woodpecker?.fall;
  const free = (x, y) => room(x, y) && !landed.has(key(x, y));
  const kept = new Map(), broken = new Map(); // (food: the cell it was promised, still free; or taken since)
  if (promised) for (const [from, to] of promised) {
    if (!(to >= 0) || patch.has(to) || !patch.has(from)) continue;
    const f = game.food.find(o => key(o.x, o.y) === from);
    if (!f || kept.has(f) || broken.has(f)) continue;
    if (landed.has(to) || !room(to % GRID, (to - to % GRID) / GRID)) { broken.set(f, to); continue; }
    kept.set(f, to); landed.add(to);
  }
  for (const f of game.food) {
    if (!patch.has(key(f.x, f.y))) continue;
    if (fell?.includes(key(f.x, f.y))) { out.push({ food: f, to: null, fell: true }); continue; } // (2s: on a piece cut loose, it falls with it)
    if (f.kind === 'beetle') { out.push({ food: f, to: null }); continue; } // (round six B, 2m: a beetle still under the beak is the bird's: it had the rings' warning to run)
    const k = kept.get(f), b = broken.get(f);
    const to = k != null ? { x: k % GRID, y: (k - k % GRID) / GRID } : b != null ? knockTo(game, b % GRID, (b - b % GRID) / GRID, patch, free) : knockTo(game, f.x, f.y, patch, free);
    if (to && k == null) landed.add(key(to.x, to.y));
    out.push({ food: f, to });
  }
  return out;
}
// The woodpecker's promise: PECK_PROMISE_TICKS moves before its strike
// (on the board its rings show then), where each piece in its mark will
// land. The strike keeps each while that cell is still free (see knocks):
// a head or a beetle that moves onto one, and is still there, sends that
// piece as near it as it can. (Made on the tick before the strike, a ring
// could still hop in the last 0.2 s, quicker than anyone can react.) Food
// that comes into the mark after that (a crash's beads) is promised where
// its ring is when it does, never on a cell promised already.
function promiseLandings(game) {
  const w = game.woodpecker;
  if (!w || !w.target.length || strikeIn(game) > T.PECK_PROMISE_TICKS) return;
  const had = new Set(), more = [];
  if (w.landings) for (const [from] of w.landings) had.add(from);
  for (const { food: f, to } of knocks(game, w.target, w.landings)) if (!had.has(key(f.x, f.y))) more.push([key(f.x, f.y), to ? key(to.x, to.y) : -1]);
  if (more.length) w.landings = w.landings ? [...w.landings, ...more] : more;
}
