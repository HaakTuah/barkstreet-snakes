// The renderer (see render/core.js): the board drawn half a tick ahead,
// where each body goes next and how a wrong guess is eased out; and a body's
// shape (its segments, bands and outline paths).

// ------------------------------------------- drawing half a tick ahead
// The board is drawn DRAW_LEAD_MS ahead (drawing only: no rule
// changes, and nobody learns anything sooner), so the cell your head is
// drawn in is the cell your press turns at. Past its cell's centre, each
// snake goes on toward where it'll be next: its head to the cell it moves
// into, the rest one cell on (a growing tail stays, a segment more).
let leadNow = 0, leadRest = false; // (this frame's lead, in ticks; and whether the board rests at its cells: the round's over)
let leadTicks = 0.5; // (the lead, in ticks at the speed it's played: the game says, see setLead)
// Cells a body will still be on after the next move (a tail that moves on
// leaves its cell; a stunned or growing snake's stays), once a tick.
// (And how many snakes' bodies lie on each cell now, and the last of them:
// a body crossing another's, after a jump, is held up over it: see liftOf.)
const stays = new Uint8Array(GRID * GRID), cover = new Uint8Array(GRID * GRID), coverBy = new Int16Array(GRID * GRID);
let staysTick = -1, staysGame = null;
function syncStays() {
  if (staysTick === game.tick && staysGame === game) return;
  staysTick = game.tick; staysGame = game;
  stays.fill(0); cover.fill(0); coverBy.fill(-1);
  for (const o of game.snakes) {
    if (!o.alive) continue;
    const keep = o.stunUntil > game.tick || o.grow > 0 ? o.body.length : o.body.length - 1;
    for (let j = 0; j < o.body.length; j++) {
      const c = o.body[j];
      if (c.x < 0 || c.y < 0 || c.x >= GRID || c.y >= GRID) continue;
      const key = c.y * GRID + c.x;
      if (j < keep) stays[key] = 1;
      if (coverBy[key] !== o.id) { coverBy[key] = o.id; cover[key]++; }
    }
  }
}
const burningAt = (x, y) => { const f = game.fires.get(y * GRID + x); return !!f && game.tick >= f.from && game.tick < f.until; };
const offBoard = (x, y) => x < 0 || y < 0 || x >= GRID || y >= GRID;
const hurdleAt = (x, y) => !offBoard(x, y) && (stays[y * GRID + x] === 1 || game.holes.has(y * GRID + x) || burningAt(x, y)); // (what a leap hops)
const wrapX = (s, v) => s.wrapUntil > game.time ? (v + GRID) % GRID : v;
// Would a turn take it back into its own neck (the game never takes one)?
function intoNeck(s, d) {
  const n = s.body[1];
  return !!n && wrapX(s, s.body[0].x + d.x) === n.x && wrapX(s, s.body[0].y + d.y) === n.y;
}
// Your press, as this screen saw it, not yet taken: online the queue is
// the host's (a friend's screen never has it, and the host's own press
// waits a round trip), so it shows from the press. For a few ticks at most.
const PRESS_TICKS = 3;
const heardOf = s => pressSeen.stun < 0 && !!pressSeen.dir && pressSeen.tick >= game.tick - PRESS_TICKS && !(pressSeen.dir.x === s.dir.x && pressSeen.dir.y === s.dir.y) && !intoNeck(s, pressSeen.dir);
// The way a snake goes next: a person's first queued turn (as the game
// takes it: never into its own neck), or your press as this screen saw it;
// a rival's plan made ahead of the tick; else on as it's going.
function wayOf(s) {
  if (s.isPlayer && !s.autopilot) {
    for (let i = 0; i < s.queue.length; i++) if (!intoNeck(s, s.queue[i])) return s.queue[i];
    return s.id === viewerId && heardOf(s) ? pressSeen.dir : s.dir;
  }
  return s.plannedTick === game.tick && s.planned ? s.planned : s.dir;
}
// Has it asked to jump, or to flash, for this tick? (Asked both, the game
// hops first if the jump can go, and so does the guess: see predict.)
const asksJump = s => s.leapArmed >= game.tick || ((!s.isPlayer || s.autopilot) && s.plannedTick === game.tick && s.memory.power === game.tick);
const asksFlash = s => s.flashArmed >= game.tick || ((!s.isPlayer || s.autopilot) && s.plannedTick === game.tick && s.memory.flash === game.tick);
// Where a snake goes next, as far as this screen can tell (a.mx, a.my;
// drawing only: read from what the game already knows, never deciding
// anything). A stunned snake stays. One about to crash (off the board, a
// hole, a body still there after the move) holds at its cell's centre,
// and the crash's lunge plays at the tick. One in the air comes down where
// it was going. A jump asked for that can go (see hops) leaps: it starts
// rising before its tick, whether or not a flash is asked for too (the
// game hops first: the flash waits till it's landed). Else a flash asked
// for that's sure to go and take it more than a cell runs on ahead (a.mf:
// the cells past the next): from when its head is drawn past its cell's
// centre, it's drawn where the flash takes it, as it will be at the tick.
// (Fire isn't a crash: a crawl goes in.)
function predict(s, a) {
  const h = s.body[0];
  a.mx = h.x; a.my = h.y; a.mv = 0; a.mg = 0; a.ml = 0; a.mf = 0; a.lr = 0;
  if (!s.alive || s.stunUntil > game.tick) return;
  const d = s.flight ? s.flight.dir : wayOf(s), x = wrapX(s, h.x + d.x), y = wrapX(s, h.y + d.y);
  a.mx = x; a.my = y; a.mv = 1; a.mg = s.grow > 0 ? 1 : 0; a.mdx = d.x; a.mdy = d.y;
  if (s.flight?.over.length) return; // (in the air: on over what it hops, a cell a tick, then down where it's going)
  if (!s.flight && asksJump(s) && ringAhead(s, h, d)) { a.lr = 1; a.lx = landX; a.ly = landY; } // (where it'll come down, while the press waits: see drawLandings)
  if (!s.flight && asksJump(s) && hops(s, h, d, game.time)) { a.ml = 1; return; }
  if (!s.flight && asksFlash(s)) {
    const go = flashReach(s, d, x, y);
    if (go > 1) { a.mf = go - 1; a.mx = wrapX(s, h.x + d.x * go); a.my = wrapX(s, h.y + d.y * go); return; }
  }
  if (offBoard(x, y) || game.holes.has(y * GRID + x) || stays[y * GRID + x]) { a.mv = 0; a.mg = 0; }
}
// Would a jump asked for go, its head at h heading d, the game's clock at
// t (as the game's hopPlan has it)? Golden, or the plain one rested and
// long enough; something right in front to hop and a free cell to land on
// within LEAP_REACH beyond it. Where it lands (hopsTo: landX, landY), or
// false.
let landX = 0, landY = 0;
function hops(s, h, d, t) {
  if (!(s.leaps > 0) && (t < s.leapReadyAt || s.body.length <= T.MIN_LENGTH)) return false;
  return hopsTo(s, h, d);
}
// A jump asked for, waiting: the first hurdle on its way within the
// LEAP_WINDOW moves the press waits, and where it'd land hopping it from
// the cell before (landX, landY), if the jump will be ready.
function ringAhead(s, h, d) {
  if (!(s.leaps > 0) && (s.body.length <= T.MIN_LENGTH || s.leapReadyAt > game.time + (s.leapArmed - game.tick) * (timeAt - timeFrom || T.START_TICK))) return false;
  let x = h.x, y = h.y;
  for (let i = 0; i < Math.max(1, s.leapArmed - game.tick + 1) && i < T.LEAP_WINDOW; i++) {
    const nx = wrapX(s, x + d.x), ny = wrapX(s, y + d.y);
    if (offBoard(nx, ny)) return false;
    if (hurdleAt(nx, ny)) return hopsTo(s, { x, y }, d);
    x = nx; y = ny;
  }
  return false;
}
function hopsTo(s, h, d) {
  let x = wrapX(s, h.x + d.x), y = wrapX(s, h.y + d.y);
  if (offBoard(x, y) || !hurdleAt(x, y)) return false;
  for (let i = 0; i < T.LEAP_REACH; i++) {
    x = wrapX(s, x + d.x); y = wrapX(s, y + d.y);
    if (offBoard(x, y)) return false;
    if (!hurdleAt(x, y)) { landX = x; landY = y; return true; }
  }
  return false;
}
// How many cells a flash asked for takes a head this tick, (x, y) being
// the first, as the game moves it: a plain one, if it's rested, up to
// FLASH_LENGTH, stopping short of what it'd run into (into fire, as a crawl
// goes); a golden one, a dash, DASH_LENGTH, through a body one cell thick
// (it cuts it) and fire. 0 if it won't go, or blows up (a dash into the
// edge or a hole: that shows at its tick).
function flashReach(s, d, x, y) {
  const gold = s.dashes > 0;
  if (!gold && (game.time < s.flashReadyAt || (T.FLASH_COST > 0 && s.body.length <= T.MIN_LENGTH))) return 0;
  const len = gold ? T.DASH_LENGTH : T.FLASH_LENGTH;
  for (let i = 1; ; i++) {
    const k = y * GRID + x;
    if (gold) {
      if (offBoard(x, y)) return 0;
      if (stays[k] && !cutsAt(s, x, y, d)) return i - 1;
      if (game.holes.has(k)) return 0;
    } else if (offBoard(x, y) || game.holes.has(k) || stays[k]) return i - 1;
    else if (burningAt(x, y)) return i;
    if (i === len) return i;
    x = wrapX(s, x + d.x); y = wrapX(s, y + d.y);
  }
}
// Would a dash heading d cut the body at (x, y)? Another snake's, behind
// its head, one cell thick there.
function cutsAt(s, x, y, d) {
  const o = snakeAt(x, y), j = o ? o.body.findIndex(c => c.x === x && c.y === y) : -1;
  if (!o || o === s || j <= 0) return false;
  const px = wrapX(s, x + d.x), py = wrapX(s, y + d.y);
  return offBoard(px, py) || !stays[py * GRID + px] || snakeAt(px, py) !== o;
}
const snakeAt = (x, y) => game.snakes.find(o => o.alive && o.body.some(c => c.x === x && c.y === y)) || null; // (whose body is on (x, y))
// The j-th cell of the way a snake with a flash on ahead (a.mf) is drawn
// heading, into chX, chY: the cells the flash takes its head through, from
// where it lands, then its body (segment i goes from cell i + 1 to cell
// i). With `last`, its last guess's, on its last body (or on `body`).
let chX = 0, chY = 0;
function along(s, a, j, last, body = last ? s.prev : s.body) {
  const go = (last ? a.pmf : a.mf) + 1;
  if (j < go) { const h = body[0]; chX = wrapX(s, h.x + (last ? a.pmdx : a.mdx) * (go - j)); chY = wrapX(s, h.y + (last ? a.pmdy : a.mdy) * (go - j)); }
  else { const c = body[Math.min(j - go, body.length - 1)]; chX = c.x; chY = c.y; }
}
// Two heads going into the same cell meet head-on: both hold (heads in the air never meet).
function meetings() {
  for (let i = 0; i < live.length; i++) {
    const p = anim.get(live[i]);
    if (!p.mv || p.ml) continue;
    for (let j = i + 1; j < live.length; j++) {
      const q = anim.get(live[j]);
      if (q.mv && !q.ml && q.mx === p.mx && q.my === p.my) { p.mv = q.mv = 0; p.mg = q.mg = 0; }
    }
  }
}
// Easing out of a wrong guess. Nothing drawn ever jumps: when where a
// snake's drawn heading changes (a plan made late, your press in the
// second half of a tick, a crash nobody saw coming, or the tick shows it
// went elsewhere), the difference stays on each segment as an offset that
// fades over about FIX_MS. A dash isn't eased: it's there at once; nor is
// a flash seen coming (it's there at once, as a dash is). But a flash seen
// coming that then goes another way (a turn pressed after it, even in the
// tick's own frame), or somewhere else, is put right as any other guess
// is, as fast as a dash goes (FIX_DASH); one that doesn't go at all eases
// back as any other. (behind: dashed this tick, where its tail is drawn
// from, a cell back along its body: see prepare.)
const FIX_MS = 35, FIX_SPEED = CELL * 0.012, FIX_DASH = CELL * 0.03; // (units a ms: 12 cells a second, about a snake's top speed; 30, about a dash's)
const wd = v => v > GRID / 2 ? v - GRID : v < -GRID / 2 ? v + GRID : v; // (a step in cells, across a wrapped edge)
function refix(s, a, at, snap, behind) {
  const n = s.body.length, fix = a.fix, body = s.body, prev = s.prev;
  if (a.fixOn) { // (what's left fades, never faster than FIX_SPEED: a big one takes a little longer)
    const keep = Math.exp(-frameDt / (FIX_MS / 3)), most = (a.fixFast ? FIX_DASH : FIX_SPEED) * frameDt;
    let left = 0;
    for (let i = 0; i < fix.length; i += 2) {
      const x = fix[i], y = fix[i + 1], d = Math.hypot(x, y);
      if (!d) continue;
      const k = Math.max(keep, 1 - most / d);
      fix[i] = x * k; fix[i + 1] = y * k;
      left = Math.max(left, d * k);
    }
    if (left < 0.25) unfix(a);
  }
  const same = a.pTick === game.tick, from = same ? body[0] : prev?.[0]; // (where its head was when it last guessed)
  const fresh = !!from && from.x === a.phx && from.y === a.phy && (same || a.pTick === game.tick - 1); // (it last guessed from where it was: this tick, or the last)
  if (reduced || !fresh || (snap && !same && !(a.pmf && behind))) { // (a dash not seen coming, too long since, or put somewhere else: start afresh)
    if (a.fixOn) unfix(a);
  } else if (same && a.mf && !a.pmf) { // (a flash seen coming: it's there at once, as a dash is)
    if (a.fixOn) unfix(a);
  } else if (same && a.pmf && (a.mf !== a.pmf || a.mx !== a.pmx || a.my !== a.pmy || a.mdx !== a.pmdx || a.mdy !== a.pmdy)) { // (a flash seen coming that's now going another way, or somewhere else, or not at all)
    const k2 = Math.max(0, at - 1);
    if (k2 > 0) for (let i = 0; i < n; i++) {
      drawnOff(s, a, i, k2, true); const ox = offX, oy = offY;
      drawnOff(s, a, i, k2, false);
      fixAdd(a, i, ox - offX, oy - offY, 2 * T.DASH_LENGTH); // (two guesses at right angles: never more than this apart)
    }
    if (a.fixOn) a.fixFast = true;
  } else if (same) { // (the same tick: a different guess)
    const kk = Math.max(0, at - 1);
    if (kk > 0 && (a.pmv !== a.mv || a.pmx !== a.mx || a.pmy !== a.my)) {
      const hx = body[0].x, hy = body[0].y;
      fixAdd(a, 0, kk * (a.pmv * wd(a.pmx - hx) - a.mv * wd(a.mx - hx)), kk * (a.pmv * wd(a.pmy - hy) - a.mv * wd(a.my - hy)));
      if (a.pmv !== a.mv) for (let i = 1; i < n; i++) fixAdd(a, i, kk * (a.pmv - a.mv) * wd(body[i - 1].x - body[i].x), kk * (a.pmv - a.mv) * wd(body[i - 1].y - body[i].y));
    }
  } else { // (a tick on: where the last guess would have it now, against where it is; a flash seen coming that's gone, from where it's drawn going on from)
    const k1 = Math.min(1, at);
    for (let i = 0; i < n && i < prev.length; i++) {
      const p = prev[i], b = !behind ? p : i < n - 1 ? body[i + 1] : behind;
      let gx, gy; // (where the last guess would have it now, from p)
      if (a.pmf) { along(s, a, i + 1, true); const fx = chX, fy = chY; along(s, a, i, true); gx = wd(fx - p.x) + wd(chX - fx) * at; gy = wd(fy - p.y) + wd(chY - fy) * at; } // (a flash that didn't go, or went)
      else { const qx = i ? prev[i - 1].x : a.pmx, qy = i ? prev[i - 1].y : a.pmy; gx = a.pmv * wd(qx - p.x) * at; gy = a.pmv * wd(qy - p.y) * at; }
      const ex = gx - wd(b.x - p.x) - wd(body[i].x - b.x) * k1, ey = gy - wd(b.y - p.y) - wd(body[i].y - b.y) * k1;
      if (ex || ey) fixAdd(a, i, ex, ey, behind ? 2 * T.DASH_LENGTH : 2.5);
    }
    if (behind && a.fixOn) a.fixFast = true;
  }
  if (a.fixOn && a.fixFar) unfix(a); // (more than a guess could be out by: it jumped, so it jumps)
  a.fixFar = false;
  a.pmx = a.mx; a.pmy = a.my; a.pmv = a.mv; a.pmf = a.mf; a.pmdx = a.mdx; a.pmdy = a.mdy; a.pTick = game.tick; a.phx = body[0].x; a.phy = body[0].y;
}
function fixAdd(a, i, dx, dy, far = 2.5) {
  if (Math.abs(dx) + Math.abs(dy) < 0.01) return;
  if (Math.abs(dx) + Math.abs(dy) > far) a.fixFar = true;
  a.fixOn = true;
  a.fix[2 * i] += dx * CELL; a.fix[2 * i + 1] += dy * CELL;
}
function unfix(a) { a.fix.fill(0); a.fixOn = false; a.fixFast = false; }
// Where segment i is drawn, k2 (> 0) on past its cell, as this frame's
// guess has it (or with `last`, the last frame's, this tick), in cells
// from its cell: into offX, offY. (As prepare draws it: see there.)
let offX = 0, offY = 0;
function drawnOff(s, a, i, k2, last) {
  const c = s.body[i];
  if (last ? a.pmf : a.mf) {
    along(s, a, i + 1, last, s.body); const fx = wd(chX - c.x), fy = wd(chY - c.y);
    along(s, a, i, last, s.body); offX = fx + (wd(chX - c.x) - fx) * k2; offY = fy + (wd(chY - c.y) - fy) * k2;
  } else {
    const v = last ? a.pmv : a.mv, nx = i ? s.body[i - 1].x : last ? a.pmx : a.mx, ny = i ? s.body[i - 1].y : last ? a.pmy : a.my;
    offX = v * wd(nx - c.x) * k2; offY = v * wd(ny - c.y) * k2;
  }
}

// A coordinate (in cells) moved a whole board's width, if that brings it
// near ref (a segment that moved across a wrapped edge: any real move is
// three cells at most, a crossing nearly the board's width).
const nearOf = (v, ref) => v - ref > GRID / 2 ? v - GRID : ref - v > GRID / 2 ? v + GRID : v;
// ...and the same for a drawn point (in units), a whole board's width.
const nearIn = (v, ref) => v - ref > SIZE / 2 ? v - SIZE : ref - v > SIZE / 2 ? v + SIZE : v;
// A body that runs across a wrapped edge, made one unbroken chain from the
// head (so parts of it lie off the board), and the offsets to draw it at
// as well, so what's off one edge shows at the other. (Every frame, for a
// snake that's had the edges wrap this round: the offsets go in arrays
// kept on its anim, and in OFF_XS and OFF_YS, so none is made a frame.)
const OFFS = [[0, 0]], OFF_XS = [], OFF_YS = [];
function unwrap(a, n) {
  const { pts, cor } = a;
  for (let i = 0; i < n - 1; i++) {
    cor[2 * i] = nearIn(cor[2 * i], pts[2 * i]); cor[2 * i + 1] = nearIn(cor[2 * i + 1], pts[2 * i + 1]);
    pts[2 * i + 2] = nearIn(pts[2 * i + 2], cor[2 * i]); pts[2 * i + 3] = nearIn(pts[2 * i + 3], cor[2 * i + 1]);
  }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < n; i++) {
    x0 = Math.min(x0, pts[2 * i]); x1 = Math.max(x1, pts[2 * i]);
    y0 = Math.min(y0, pts[2 * i + 1]); y1 = Math.max(y1, pts[2 * i + 1]);
  }
  if (x0 >= 0 && y0 >= 0 && x1 <= SIZE && y1 <= SIZE) return null;
  const xs = OFF_XS, ys = OFF_YS, offs = a.offList, pool = a.offPool;
  xs.length = ys.length = offs.length = 0;
  xs.push(0); ys.push(0);
  if (x0 < 0) xs.push(SIZE);
  if (x1 > SIZE) xs.push(-SIZE);
  if (y0 < 0) ys.push(SIZE);
  if (y1 > SIZE) ys.push(-SIZE);
  for (let i = 0; i < xs.length; i++) {
    for (let j = 0; j < ys.length; j++) {
      const p = pool[offs.length] || (pool[offs.length] = [0, 0]);
      p[0] = xs[i]; p[1] = ys[j];
      offs.push(p);
    }
  }
  return offs;
}

// Segment radius: a big head, a body that tapers to the tail, plus any gulp passing through.
function radius(i, n, a, tickPos) {
  let r = i === 0 ? CELL * 0.54 * (1 + a.bump) : CELL * (0.44 - 0.1 * (i / (n > 1 ? n - 1 : 1)));
  if (i > 0) {
    for (let g = 0; g < 4; g++) {
      const d = i - (tickPos - a.gulps[g]);
      if (d > -a.gulpW && d < a.gulpW) r += CELL * a.gulpR * (1 - Math.abs(d) / a.gulpW);
    }
  }
  return r;
}

const near = (u, v) => Math.abs(u - v) < 0.01;

// The band from segment i to i + 1, half-width h: through its corner cell,
// as rectangles (see rectPiece). Straight, it's
// one piece (two pieces meeting mid-band leave a hairline seam when a cell
// isn't a whole number of pixels); at a bend the corner's circle covers the join.
function band(a, i, h) {
  const p = a.pts, c = a.cor;
  const x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
  if ((near(x1, cx) && near(cx, x2)) || (near(y1, cy) && near(cy, y2))) rectPiece(x1, y1, x2, y2, h);
  else { rectPiece(x1, y1, cx, cy, h); rectPiece(cx, cy, x2, y2, h); }
}

// Does the band from i to i + 1 turn a corner (and need its outside rounded)?
function bends(a, i) {
  const p = a.pts, c = a.cor;
  const x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
  if ((near(x1, cx) && near(y1, cy)) || (near(x2, cx) && near(y2, cy))) return false;
  return !(near(x1, cx) && near(cx, x2)) && !(near(y1, cy) && near(cy, y2));
}

// A body is a row of segments, one per cell, each a little round with a
// narrower band joining it to the next: a caterpillar, so you can count
// how long a snake is at a glance.
const PINCH = 0.8;
// A band's half-width (i to i + 1): PINCH of the segment's radius behind
// it. Over a pit a span is slimmer (see sinkOf), but its segments are still
// a cell apart, so they'd part: round beads bulging above a thin rod, their
// outline scalloped round each, and its shade in a crescent on each bead.
// So there its bands fill out to the narrower of its two segments, the
// further over the pit the more (never past either: a head, or a gulp, is
// still round, its band no square shoulder): a slimmer body, its line and
// rim as smooth as on the bark, shaded along its underside (see
// shadeUnder). What's up in the air doesn't sag, and keeps its pinch.
function bandR(a, i) {
  const r = a.rad[i + 1] * PINCH;
  if (!a.bridging) return r;
  let t = Math.max(a.hang[i], a.hang[i + 1]);
  if (a.lifted) t *= 1 - Math.min(1, 3 * Math.max(a.lift[i], a.lift[i + 1]));
  return t > 0 ? r + (Math.min(a.rad[i], a.rad[i + 1]) - r) * t : r;
}
// The body's outline shape, `grow` units bigger all round, as separate
// fills in the current fill: bands as rectangles, joints as circles, the
// same shapes the body is drawn with (they batch into one GPU operation).
// Only for an opaque fill: where pieces overlap, a translucent one darkens
// (that's what the veil and silhouette are for). With a reach, only what's
// within it of (cx, cy), give or take a segment.
// (For a shadow, only some of it: with pit 1, what's on firm ground or by
// a pit's rim, or 2, what's well over a pit (HANG_DRY); with air 1, what's
// on the ground, or 2, what's up in the air: see drawShadows.)
function bodyFills(a, grow, cx = 0, cy = 0, reach = 0, pit = 0, air = 0) {
  const p = a.pts, c = a.cor, rad = a.rad, n = a.n, some = pit || air;
  for (let i = n - 2; i >= 0; i--) {
    if (reach && far(p, i, cx, cy, reach) && far(p, i + 1, cx, cy, reach)) continue;
    if (some && leftOut(a, i, i + 1, pit, air)) continue;
    const h = bandR(a, i) + grow, x1 = p[2 * i], y1 = p[2 * i + 1], qx = c[2 * i], qy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
    if ((near(x1, qx) && near(qx, x2)) || (near(y1, qy) && near(qy, y2))) rectPiece(x1, y1, x2, y2, h); // (straight: one piece, no seam)
    else { rectPiece(x1, y1, qx, qy, h); rectPiece(qx, qy, x2, y2, h); }
  }
  for (let i = n - 1; i >= 0; i--) {
    if (reach && far(p, i, cx, cy, reach) && (i === n - 1 || far(p, i + 1, cx, cy, reach))) continue;
    if (i < n - 1 && bends(a, i) && !(some && leftOut(a, i, i + 1, pit, air))) circle(c[2 * i], c[2 * i + 1], bandR(a, i) + grow);
    if (some && leftOut(a, i, i, pit, air)) continue;
    if (i === 0 && a.star) { ctx.beginPath(); starPath(a, grow); ctx.fill(); }
    else circle(p[2 * i], p[2 * i + 1], rad[i] + grow);
  }
}
const leftOut = (a, i, j, pit, air) => (pit && (a.hang[i] >= HANG_DRY || a.hang[j] >= HANG_DRY) !== (pit === 2)) || (air && (a.lift[i] > 0 || a.lift[j] > 0) !== (air === 2));
const far = (p, i, cx, cy, reach) => (p[2 * i] - cx) * (p[2 * i] - cx) + (p[2 * i + 1] - cy) * (p[2 * i + 1] - cy) > reach * reach;
// The same shape as one path, filled once: an even shade where pieces
// overlap, for a translucent fill. (A path of a hundred contours is
// triangulated every frame, so it's kept for what's rare: a fading corpse,
// a golden outline, a queasy wash.)
function silhouette(a, grow) {
  shape(a, grow);
  ctx.fill();
}
// ...as the current path (to fill, or to clip to).
// (Only segments i0 to i1, for a short stretch: cheap to clip to.)
function shape(a, grow, i0 = 0, i1 = a.n - 1) {
  ctx.beginPath();
  const p = a.pts, c = a.cor;
  for (let i = i1 - 1; i >= i0; i--) {
    const h = bandR(a, i) + grow, x1 = p[2 * i], y1 = p[2 * i + 1], cx = c[2 * i], cy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
    pieceRect(x1, y1, cx, cy, h);
    pieceRect(cx, cy, x2, y2, h);
  }
  for (let i = i1; i >= i0; i--) {
    if (i < i1 && bends(a, i)) { const r = bandR(a, i) + grow; ctx.moveTo(a.cor[2 * i] + r, a.cor[2 * i + 1]); ctx.arc(a.cor[2 * i], a.cor[2 * i + 1], r, 0, TAU); }
    if (i === 0 && a.star) { starPath(a, grow); continue; }
    const r = a.rad[i] + grow;
    ctx.moveTo(p[2 * i] + r, p[2 * i + 1]);
    ctx.arc(p[2 * i], p[2 * i + 1], r, 0, TAU);
  }
}
// One straight piece of a band, filled (pieces run along the grid, but
// for a moment while a head eases out of a wrong guess: see refix; a
// zero-length one fills nothing, as in a silhouette).
function rectPiece(x1, y1, x2, y2, h) {
  if (near(y1, y2)) { if (!near(x1, x2)) ctx.fillRect(Math.min(x1, x2), y1 - h, Math.abs(x2 - x1), 2 * h); }
  else if (near(x1, x2)) ctx.fillRect(x1 - h, Math.min(y1, y2), 2 * h, Math.abs(y2 - y1));
  else { ctx.beginPath(); slant(x1, y1, x2, y2, h); ctx.fill(); }
}
// One straight piece of a band, added to the current path (the same; a
// zero-length one adds nothing).
function pieceRect(x1, y1, x2, y2, h) {
  if (near(y1, y2)) { if (!near(x1, x2)) ctx.rect(Math.min(x1, x2), y1 - h, Math.abs(x2 - x1), 2 * h); }
  else if (near(x1, x2)) ctx.rect(x1 - h, Math.min(y1, y2), 2 * h, Math.abs(y2 - y1));
  else slant(x1, y1, x2, y2, h);
}
// A piece off the grid, as a closed shape wound the way rect() winds (so
// a silhouette's pieces never cancel each other out).
function slant(x1, y1, x2, y2, h) {
  const l = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / l * h, ny = (x2 - x1) / l * h;
  ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x2 - nx, y2 - ny); ctx.lineTo(x2 + nx, y2 + ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.closePath();
}

// The path through every segment centre and corner, head to tail (or from
// segment i0 to i1).
function spine(a, i0 = 0, i1 = a.n - 1) {
  ctx.beginPath();
  ctx.moveTo(a.pts[2 * i0], a.pts[2 * i0 + 1]);
  for (let i = i0 + 1; i <= i1; i++) {
    ctx.lineTo(a.cor[2 * i - 2], a.cor[2 * i - 1]);
    ctx.lineTo(a.pts[2 * i], a.pts[2 * i + 1]);
  }
}
