// The renderer (see render/core.js): the woodpecker, its perch, its layer,
// its plan and its poses.

// ------------------------------------------------------------ the woodpecker

// A great spotted woodpecker, big (about eight and a half cells tall), clinging to the
// log just outside the board: on whichever side of the board has room on
// this screen, as near as it can to where it's working. It flies in when
// sudden death starts, the way a woodpecker flies (a few wingbeats, wings
// tucked in a dip, beats again), and lands with a flare of its wings.
// Perched, it clings upright braced on its tail, bobs, shifts its grip, and
// its head moves as birds' do, in quick jerks, then still; its eye looks at
// whatever moves nearby, now and then at you, and blinks. It eyes its next
// chunk (which glows and cracks, faster and faster as the strike nears),
// its head turned and tilted to it; flies to it and drums it, a blow on
// every knock of the drum you hear, chips flying, the last blow on the
// strike; flies back, and says "kik!" as it settles. It's drawn on its own
// layer, the board and the room round it its perch and its flights need,
// from parts drawn once (see birdPart).
let birdLayer = null, birdG = null, birdShown = false;
// The board on the page, in CSS px, and how far the free page runs round it
// before the page's own furniture (the tags, the speed buttons, the chatter)
// and the screen's safe area, how tall the ledge under it is (on a phone
// held upright; else 0), where across the ledge the frame's moss and
// leaves hang into it ([left, right] each), and the buttons' rims under
// the board it may cling to ({ x, top, bottom, face }): the game keeps
// them current; and the words there it perches clear of where it can
// ({ left, right, top, bottom }, 2k+).
const boardRect = { x: 0, y: 0, w: 0, left: 0, top: 0, right: 0, bottom: 0, ledge: 0, upright: false, hang: [], rims: [], words: [] };
function setBoardRect(x, y, w, free = null) {
  boardRect.x = x; boardRect.y = y; boardRect.w = w;
  boardRect.left = free ? free.left : 0; boardRect.top = free ? free.top : 0;
  boardRect.right = free ? free.right : innerWidth; boardRect.bottom = free ? free.bottom : innerHeight;
  boardRect.ledge = free?.ledge || 0;
  boardRect.upright = !!free?.upright || boardRect.ledge > 0; // (a phone held upright: with no ledge, its board leaves the bird a gutter of 13 px at least)
  boardRect.hang = free?.hang || [];
  boardRect.rims = free?.rims || [];
  boardRect.words = free?.words || [];
  perches.clear(); drumAt.clear(); birdLayout++; // (its perches and where it drums are worked out again: the room round the board has changed)
}
const BIRD_GROW = 1.7; // (times its first size: 1.3 since 2c, 1.7 since 2k, on the board and under it alike)
const BU = CELL * 0.85 * BIRD_GROW; // the bird's unit
const BILL = [2.55, -1.72]; // its beak tip, in units, before its head moves
const BIRD_BOX = [-1.15, -2.55, 2.65, 3.2]; // (all of it, round its feet, in units, facing right: its back, crown, beak tip, tail)
const PERCH_NEAR = 0.65 * 1.3 / BIRD_GROW, PERCH_MIN_PX = 30, PERCH_FLOOR_PX = 22; // (how small it may perch: on a nearer side, 0.65 of its size at 2c, so growing never sends it to a smaller perch; and, CSS px tall, where there's no room anywhere; and on a phone held upright of a height in between, where the page leaves it room for 24)
const PERCH_GAP_PX = 1.5, BOX_EDGE = 0.1; // (how far, CSS px, it keeps off the cells, its ink's soft edge never touching one; and, units, how far its outline and its beak, turned to look, reach past its box)
const LEDGE_LOOK = 0.3, CROUCH = 0.25; // (on the ledge, how far it may look up at its chunk, radians, with its beak still under the board; and how far its crouch lowers it, units)
const RIM_GRIP = 0.95, RIM_FEET = 0.8, RIM_REACH = 2.5, RIM_PECK_MS = 360; // (on a button's rim: how far ahead of it its toes grip, and how far under its feet' middle, units; how far along the ledge it goes to one, units; and how long its two pecks at it take)
const FLIGHT_BACK = 6; // (units: how far behind the spot it strikes its wings reach as it flies in, its beak's length and a wingbeat back)
// Where it perches to work on a spot (board px), and how big (s): beside
// the board on the nearest side with room for it on this screen (or with
// room for it a little smaller), its beak just short of the board; with
// less room, on the left or right where it still fits at PERCH_MIN_PX
// tall (a phone on its side: the gap beside the column), the nearer if
// both. There it keeps its outline and a hair (PERCH_GAP_PX) off the
// cells and off what's beside it, its beak turned to look too. On a phone
// held upright the board runs edge to edge, with no room beside it, so it
// stands on the ledge under the board (0 px tall since "The phone gap": it
// stands over the row under the board and the chatter, its room running to
// the screen's foot, and taps pass through its layer to them): just below
// the bottom edge, beside
// the spot on the middle's side, facing out to it (so it flies to drum it
// over the board, never past the screen's edge), clear of the moss and
// leaves hanging there, as big as the ledge lets it be (about 53 px tall
// on a 390 px phone), and it only looks up a little at its chunk (its
// beak stays under the board). On a phone held upright of a height in
// between (the ledge only partly on the screen, the gutter narrow), it's
// smaller instead, on the ledge or beside the board, whichever lets it be
// the bigger, down to PERCH_FLOOR_PX. With room nowhere (a tablet held
// upright, or a phone too short for its ledge), as it always was: on the frame's
// left or right, whichever is nearer the spot, shrunk to fit, its outline
// still on the screen, about 32 px tall in a tablet's gutter (it's taller
// than it's deep, so above or below the board it would be smaller still).
// Only where that would leave it under PERCH_MIN_PX tall does its beak
// reach over the board's edge; otherwise, like the corner leaves, it never
// covers a cell. Its whole box stays on the screen and off the page's
// furniture, crouching too. It always stands upright, facing the spot.
function perchFor(tx, ty) {
  const sc = boardRect.w / SIZE, gap = sc ? PERCH_GAP_PX / sc : 0;
  const room = sc ? {
    left: (boardRect.x - boardRect.left) / sc, right: (Math.min(innerWidth, boardRect.right) - boardRect.x - boardRect.w) / sc,
    top: (boardRect.y - boardRect.top) / sc, bottom: (Math.min(innerHeight, boardRect.bottom) - boardRect.y - boardRect.w) / sc,
  } : { left: 999, right: 0, top: 0, bottom: 0 };
  const deep = (BIRD_BOX[2] - BIRD_BOX[0]) * BU, tall = (BIRD_BOX[3] - BIRD_BOX[1]) * BU; // (back to beak tip; crown to tail)
  const least = sc ? Math.min(1, PERCH_MIN_PX / (tall * sc)) : 1, floor = sc ? Math.min(1, PERCH_FLOOR_PX / (tall * sc)) : 1; // (the smallest it perches; and on a phone held upright, where neither the ledge nor a gutter has room for that)
  const beside = r => Math.min(1, (r - 2 * gap) / (deep + 2 * BOX_EDGE * BU)); // (its outline and the gap, on both sides)
  const whole = r => (r - 2 * gap >= tall + (2 * BOX_EDGE + CROUCH) * BU ? 1 : 0); // (above or below the board: all of it, crouching too, and the gap. With less room, pushed back onto the screen, it hung over the board's edge rows, as on a phone on its side under 600 px wide, its board shorter than the screen)
  const fit = { left: beside(room.left), right: beside(room.right), top: whole(room.top), bottom: whole(room.bottom) };
  const ledge = boardRect.ledge > 0 && sc ? Math.min(1, (room.bottom - 2 * gap) / (tall + (2 * BOX_EDGE + CROUCH) * BU)) : 0; // (how big it can stand there)
  const shrunk = k => Math.min(1, room[k] / (deep + 2 * BOX_EDGE * BU)); // (how big beside the board, its beak's tip touching it)
  const dist = { left: tx, right: SIZE - tx, top: ty, bottom: SIZE - ty };
  const nearer = (p, q) => dist[p] - dist[q] || fit[q] - fit[p];
  let side = ledge >= least ? 'ledge'
    : Object.keys(dist).filter(k => fit[k] >= PERCH_NEAR).sort(nearer)[0]
    || ['left', 'right'].filter(k => fit[k] >= least).sort(nearer)[0]
    || (nearer('left', 'right') <= 0 ? 'left' : 'right');
  // (a phone held upright of a height in between, its board too big to
  // leave it a gutter and too tall to show the ledge whole: there it's
  // smaller rather than over the cells, on the ledge or beside the board,
  // whichever lets it be the bigger, down to PERCH_FLOOR_PX tall; the page
  // leaves it room for that much, see style/)
  const between = boardRect.upright && (side === 'left' || side === 'right') && !(fit[side] >= least) && shrunk(side) < least;
  if (between && ledge >= floor && ledge >= shrunk(side)) side = 'ledge';
  const nowhere = (side === 'left' || side === 'right') && !(fit[side] >= least);
  const s = side === 'ledge' ? ledge : nowhere ? Math.max(between ? floor : least, shrunk(side)) : Math.max(least, fit[side]);
  const e = BOX_EDGE * s * BU + (nowhere ? 0 : gap), short = nowhere ? 0.05 * s * BU : e; // (how far it keeps clear all round, its outline at least; and its beak, of the board)
  const along = v => Math.max(BU * 2, Math.min(SIZE - BU * 2, v));
  const face = tx < SIZE / 2 ? 1 : -1; // (above or below the board, it stands off to one side of the spot)
  const p = side === 'left' ? { x: -(BIRD_BOX[2] * s * BU + short), y: along(ty) + BU * 1.75 * s, flip: 1, s }
    : side === 'right' ? { x: SIZE + BIRD_BOX[2] * s * BU + short, y: along(ty) + BU * 1.75 * s, flip: -1, s }
    : side === 'top' ? { x: along(tx) - face * BU * 1.6, y: -Math.min(BU * 3.3, Math.max(BU * 1.5, room.top - BU * 2.6)), flip: face, s }
    : side === 'ledge' ? { x: along(tx) + face * BU * 1.6 * s, y: SIZE + e - BIRD_BOX[1] * s * BU, flip: -face, s, up: LEDGE_LOOK }
    : { x: along(tx) - face * BU * 1.6, y: SIZE + e - BIRD_BOX[1] * s * BU, flip: face, s, up: LEDGE_LOOK }; // (below the board, as on the ledge: its crown just under the board, and only looking up a little at its chunk)
  // (then all of it on the screen, off the furniture, its outline and its crouch too: its back first, if it can't all fit)
  const x0 = (p.flip > 0 ? BIRD_BOX[0] : -BIRD_BOX[2]) * s * BU - e, x1 = (p.flip > 0 ? BIRD_BOX[2] : -BIRD_BOX[0]) * s * BU + e;
  const lo = -room.left - x0, hi = SIZE + room.right - x1;
  if (p.flip > 0) p.x = Math.max(lo, Math.min(hi, p.x));
  else p.x = Math.min(hi, Math.max(lo, p.x));
  p.y = Math.max(-room.top - BIRD_BOX[1] * s * BU + e, Math.min(SIZE + room.bottom - (BIRD_BOX[3] + CROUCH) * s * BU - e, p.y));
  // (on the ledge, clear of the moss and leaves hanging into it: where it
  // stands if that's clear, else the nearest place beside one that is,
  // still facing its spot, and still on the screen. Not on the outer side
  // of a spot near the screen's edge, if there's any such place on the
  // middle's side, though further off: flying in from the outer side to
  // strike there, its wings would beat past the screen's edge)
  // (and clear of the row's words, 2k+, those level with it: between two
  // buttons, or over a gap or the chatter's empty end, the nearest such
  // place, as with the moss. It never shrinks for them: where no place
  // at its size clears them all, it perches as it would without them)
  const hang = side === 'ledge' ? boardRect.hang.map(([l, r]) => [(l - boardRect.x) / sc - gap, (r - boardRect.x) / sc + gap]) : [];
  const ys = [boardRect.y + (p.y + BIRD_BOX[1] * s * BU - e) * sc, boardRect.y + (p.y + (BIRD_BOX[3] + CROUCH) * s * BU + e) * sc];
  const words = side === 'ledge' ? boardRect.words.filter(w => w.bottom > ys[0] && w.top < ys[1]).map(w => [(w.left - boardRect.x) / sc, (w.right - boardRect.x) / sc]) : []; // (its box keeps its outline and the gap off them)
  const box = f => (f > 0 ? [BIRD_BOX[0] * s * BU - e, BIRD_BOX[2] * s * BU + e] : [-BIRD_BOX[2] * s * BU - e, -BIRD_BOX[0] * s * BU + e]);
  const clearOf = off => (x, [a, b]) => x + a >= -room.left - 1e-6 && x + b <= SIZE + room.right + 1e-6 && off.every(([l, r]) => x + b <= l || x + a >= r);
  const onScreen = f => (f > 0 ? tx - FLIGHT_BACK * BU >= -room.left : tx + FLIGHT_BACK * BU <= SIZE + room.right); // (its wings, flying in to strike facing that way)
  const place = off => { // (where it stands if that's clear, else the nearest place beside one that is)
    const fits = clearOf(off);
    let best = null;
    for (const f of [p.flip, -p.flip]) {
      if (best && !onScreen(f)) break;
      const [a, b] = box(f);
      for (const x of [p.x, ...off.flatMap(([l, r]) => [l - b, r - a])]) {
        if ((tx - x) * f < 0 || !fits(x, [a, b])) continue; // (its spot behind it, or no room)
        if (!best || Math.abs(x - p.x) < Math.abs(best.x - p.x) - 1e-6) best = { x, f };
      }
    }
    return best;
  };
  let fits = clearOf(hang);
  if (hang.length || words.length) {
    let best = words.length ? place([...hang, ...words]) : null;
    if (best) fits = clearOf([...hang, ...words]);
    else if (hang.length) best = place(hang);
    if (best) { p.x = best.x; p.flip = best.f; }
  }
  // (on the ledge, it clings to a button's rim where one's near, as it
  // clings to the log: its toes on the button's side, facing it and its
  // spot, its feet's height on the button. Still on the screen, clear of
  // the moss and leaves, and over the row and the chatter, never the
  // cells. Resting there, now and then it pecks at the button: see
  // headAndEye)
  if (side === 'ledge' && boardRect.rims.length) {
    const feet = boardRect.y + (p.y + RIM_FEET * s * BU) * sc, reach = RIM_REACH * s * BU, ab = box(p.flip);
    let near = null;
    for (const r of boardRect.rims) {
      if (r.face !== p.flip || feet < r.top || feet > r.bottom) continue;
      const x = (r.x - boardRect.x) / sc - p.flip * RIM_GRIP * s * BU;
      if (Math.abs(x - p.x) > reach || (tx - x) * p.flip < 0 || !fits(x, ab)) continue;
      if (near == null || Math.abs(x - p.x) < Math.abs(near - p.x)) near = x;
    }
    if (near != null) { p.x = near; p.rim = true; }
  }
  p.side = side;
  return p;
}
// Its perches, one for each spot it works on (worked out as it first needs
// one, and again only when the room round the board changes: see
// setBoardRect), and how it clings to drum each (see drumPoseAt).
const perches = new Map(), drumAt = new Map();
let birdLayout = 0;
function perchAt(spot) {
  let p = perches.get(spot);
  if (!p) {
    const x = spot % GRID;
    p = perchFor(x * CELL + CELL / 2, (spot - x) / GRID * CELL + CELL / 2);
    p.rot = 0;
    perches.set(spot, p);
  }
  return p;
}
// The cell of a patch it works on: the one nearest the patch's middle (of
// those as near, the first by row), so it's always on the patch, round a
// bend too. Before its first patch it rests where the engine has it come
// to, the middle of the top row (ARRIVAL_SPOT).
function spotIn(cells) {
  let sx = 0, sy = 0, best = -1, near = Infinity;
  for (const k of cells) { sx += k % GRID; sy += (k - k % GRID) / GRID; }
  sx /= cells.length; sy /= cells.length;
  for (const k of cells) {
    const x = k % GRID, y = (k - x) / GRID, d = (x - sx) * (x - sx) + (y - sy) * (y - sy);
    if (d < near - 1e-9 || (d < near + 1e-9 && k < best)) { near = d; best = k; }
  }
  return best;
}
const ARRIVAL_SPOT = GRID / 2;
// Where its beak strikes the cell it works on: the middle, or, with a
// snake lying there, the free corner or edge farthest from the body (drawn
// narrower than its cell, so that spot shows), so it's seen chipping the
// log beside the snake, which the strike leaves unhurt. Only where it's
// drawn: the tiles go as they always did. From the bodies as the tick
// stands (and as they slide through it), and when they move it shifts its grip to the new spot in half a
// tick. AX, AY: from the cell's middle, units, as drawn;
// AFREE: how far the nearest body's edge is from there (Infinity: none on
// the cell). The bodies round the cell are kept for the dent's cracks (see
// clearOf).
const AIM_IN = 1, AIM_RIM = 2, AIM_TIE = 0.5; // (how far inside the cell's edge it aims; a body's ink round it; how near as clear two spots count as the same, units)
const aimAt = { spot: -1, from: 0, ox: 0, oy: 0, free: Infinity, px: 0, py: 0, dx: 0, dy: 0 };
let AX = 0, AY = 0, AFREE = Infinity, segN = 0;
const segs = new Float32Array(5 * 128); // (x0, y0, x1, y1, r: the bodies' pieces round the cell)
function addSeg(x0, y0, x1, y1, r) { // (cells; r, units)
  if (segN * 5 === segs.length) return;
  const k = 5 * segN++;
  segs[k] = x0 * CELL + CELL / 2; segs[k + 1] = y0 * CELL + CELL / 2; segs[k + 2] = x1 * CELL + CELL / 2; segs[k + 3] = y1 * CELL + CELL / 2; segs[k + 4] = r;
}
function freeAim(spot, bx, by) { // (bx, by: where it clings; of spots as clear, the nearest that)
  const A = aimAt, sx = spot % GRID, sy = (spot - sx) / GRID, mx = sx * CELL + CELL / 2, my = sy * CELL + CELL / 2;
  let on = false;
  segN = 0;
  for (const s of game.snakes) {
    if (!s.alive) continue;
    // (where it lies this tick and lay the last, and its head's half step on:
    // it's drawn sliding from half a tick behind to half a tick ahead)
    for (const b of s.prev?.length ? [s.body, s.prev] : [s.body]) {
      const n = b.length, rad = i => (i === 0 ? 0.54 : 0.44 - 0.1 * i / Math.max(1, n - 1)) * CELL + AIM_RIM; // (as render/lead.js's radius has it)
      for (let i = 0; i < n; i++) {
        const c = b[i];
        let d = i + 1 < n ? b[i + 1] : c;
        if (b === s.body && c.x === sx && c.y === sy) on = true;
        if (Math.abs(c.x - d.x) + Math.abs(c.y - d.y) > 1) d = c; // (across a wrap: each end is its own)
        if (Math.max(Math.abs(c.x - sx), Math.abs(c.y - sy)) > 1 && Math.max(Math.abs(d.x - sx), Math.abs(d.y - sy)) > 1) continue;
        addSeg(c.x, c.y, d.x, d.y, Math.max(rad(i), i + 1 < n ? rad(i + 1) : 0));
        if (i === 0 && b === s.body && s.dir) addSeg(c.x, c.y, c.x + s.dir.x / 2, c.y + s.dir.y / 2, rad(0));
      }
    }
  }
  A.ox = A.oy = 0; A.free = Infinity;
  if (!on) return;
  const h = CELL / 2 - AIM_IN;
  let best = -Infinity, near = Infinity;
  for (let q = 0; q < 16; q++) { // (round the cell's rim: its corners, and three points along each edge)
    const side = q >> 2, t = (q & 3) / 2 - 1, u = side === 0 ? t : side === 1 ? 1 : side === 2 ? -t : -1, v = side === 0 ? -1 : side === 1 ? t : side === 2 ? 1 : -t;
    const c = clearOf(mx + u * h, my + v * h), d = Math.hypot(mx + u * h - bx, my + v * h - by);
    if (c > best + AIM_TIE || (c > best - AIM_TIE && d < near)) { best = Math.max(best, c); near = d; A.ox = u * h; A.oy = v * h; A.free = c; }
  }
}
// How far board point x, y lies from the nearest body's edge round the cell, units.
function clearOf(x, y) {
  let least = Infinity;
  for (let k = 0; k < 5 * segN; k += 5) {
    const ax = segs[k], ay = segs[k + 1], dx = segs[k + 2] - ax, dy = segs[k + 3] - ay, l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)) : 0;
    least = Math.min(least, Math.hypot(x - ax - t * dx, y - ay - t * dy) - segs[k + 4]);
  }
  return least;
}
function aimOff(spot, t, d) { // (t: ticks from the strike, as drawn)
  const A = aimAt, wx = A.ox, wy = A.oy;
  freeAim(spot, d.x, d.y);
  if (A.spot !== spot) { A.spot = spot; A.px = A.dx = A.ox; A.py = A.dy = A.oy; A.from = t; }
  else if (A.ox !== wx || A.oy !== wy) { A.px = A.dx; A.py = A.dy; A.from = t; }
  const e = smooth(clamp01((t - A.from) * 2)); // (half a tick to shift its grip)
  A.dx = A.px + (A.ox - A.px) * e; A.dy = A.py + (A.oy - A.py) * e;
  AX = A.dx; AY = A.dy; AFREE = A.free;
}
const aimed1 = { x: 0, y: 0, s: 1, flip: 1, rot: 0 }; // (a drumming pose moved to where it aims)
const atAim = d => { aimed1.x = d.x + AX; aimed1.y = d.y + AY; aimed1.s = d.s; aimed1.flip = d.flip; aimed1.rot = d.rot; return aimed1; };
const restSpot = w => (w.last.length ? spotIn(w.last) : Math.max(0, Math.min(GRID - 1, Math.round(w.y))) * GRID + Math.max(0, Math.min(GRID - 1, Math.round(w.x))));

// Its layer: the board and the room round it the bird can use, not the
// whole page (that cost 2 to 3.5 ms of the GPU's time every frame of
// sudden death): on each side as far as the free page runs (to the tags,
// the header, a column beside the board, a notch), at least BIRD_ROOM
// units (a wingtip over the tags, as it drums the top row) and at most
// BIRD_REACH (perched on the ledge or in a margin, crouching too, or
// drumming an edge row), cut at the screen's left and right. Below the
// board always BIRD_REACH, whatever the screen's height, so a phone's
// address bar coming and going never makes it again, nor does the page
// scrolling: it's only moved (a transform).
const BIRD_REACH = 6.5, BIRD_ROOM = 1.2;
const lay = { x: 0, y: 0, w: 0, h: 0, W: 0, H: 0, dpr: 0, sc: 1, ox: 0, oy: 0 }; // (where it is and how big, CSS px; its pixels; and the board's units to them)
function placeLayer(dpr) {
  const css = boardRect.w / SIZE, most = BIRD_REACH * BU * css, least = BIRD_ROOM * BU * css, m = v => Math.max(least, Math.min(most, v));
  const left = Math.floor(boardRect.x - m(boardRect.x - boardRect.left)), right = Math.ceil(boardRect.x + boardRect.w + m(boardRect.right - boardRect.x - boardRect.w));
  const top = m(boardRect.y - boardRect.top), x = Math.max(0, left), y = Math.floor(boardRect.y - top);
  const w = Math.max(1, Math.min(innerWidth, right) - x), h = Math.ceil(top + boardRect.w + most) + 1;
  let fresh = false;
  if (w !== lay.w || h !== lay.h || dpr !== lay.dpr) {
    lay.w = w; lay.h = h; lay.dpr = dpr;
    lay.W = birdLayer.width = Math.max(1, Math.round(w * dpr)); lay.H = birdLayer.height = Math.max(1, Math.round(h * dpr));
    birdLayer.style.width = `${w}px`; birdLayer.style.height = `${h}px`;
    fresh = true;
  }
  if (fresh || x !== lay.x || y !== lay.y) { lay.x = x; lay.y = y; birdLayer.style.transform = `translate(${x}px, ${y}px)`; fresh = true; }
  lay.sc = css * lay.W / w;
  lay.ox = (boardRect.x - x) * lay.W / w; lay.oy = (boardRect.y - y) * lay.H / h;
  return fresh;
}
// Where any of it may be drawn (board units): on the screen and its layer,
// a hair in. Flying and drumming, it keeps inside (see fitBird, drumPoseAt).
const room = { x0: 0, y0: 0, x1: 0, y1: 0 };
function birdRoom() {
  const css = boardRect.w / SIZE, e = 1.5;
  room.x0 = (Math.max(0, lay.x) + e - boardRect.x) / css; room.x1 = (Math.min(innerWidth, lay.x + lay.w) - e - boardRect.x) / css;
  room.y0 = (Math.max(0, lay.y) + e - boardRect.y) / css; room.y1 = (Math.min(innerHeight, lay.y + lay.h) - e - boardRect.y) / css;
}
const useBase = g => g.setTransform(lay.sc, 0, 0, lay.sc, lay.ox, lay.oy);

// Its pose: where it is (its feet, board units), how big, which way it
// faces, how far it's tipped (rot), crouched, its wings (how far out, up
// or down in the beat (stroke), swept forward to land; near and far: how
// much of each the screen has room for), its feet out or tucked, its head
// turned (turn) and driven forward or drawn back (thrust; blurred when it
// drums too fast to see), its beak open (gape), how high in the air (for
// its shadow), and what it's doing (phase) and looking at (fx, fy).
const pose = { x: 0, y: 0, s: 1, flip: 1, rot: 0, crouch: 0, wing: 0, stroke: 1, sweep: 0, near: 1, far: 1, feet: 1, turn: 0, thrust: 0, blur: 0, gape: 0, alpha: 1, air: 0, blink: false,
  phase: '', free: false, up: 1.2, fx: 0, fy: 0, drum: null, blows: 0, t: 0, tp: 0, u: 0 };
// What it keeps between frames: its head's jerks and tilts, what it's
// watching, its eye, its blinks, its grip; where it was drawn (to clear).
const bird = { turn: 0, turnTo: 0, hold: 0, cock: 0, cockAt: 0, gx: 1, gy: 0, focus: null, focusUntil: 0, spot: { x: 0, y: 0 },
  nextBlink: 0, blinkUntil: 0, gripAt: 0, gripFrom: -1e9, peckAt: 0, peckFrom: -1e9, box: [0, 0, 0, 0], drawn: false, clear: true, force: null };
function resetBird(now = 0) {
  bird.turn = bird.turnTo = 0; bird.hold = 0; bird.cock = 0; bird.cockAt = 0; bird.gx = 1; bird.gy = 0; bird.focus = null; bird.focusUntil = 0;
  bird.nextBlink = now + T.BLINK_MIN; bird.blinkUntil = 0; bird.gripAt = now + 1800; bird.gripFrom = -1e9; bird.peckAt = now + 2400; bird.peckFrom = -1e9; bird.clear = true;
}

// Its timings (ms on the board's clock): settling as it lands, crouching to
// take off, lingering after the strike, the least it looks at its chunk
// before it goes, coming in as sudden death starts, a wingbeat, chips in
// the air; and how far its head draws back between blows (units). A
// flight takes longer the further it goes (flightMs, hopMs).
const B_SETTLE = 120, B_TAKEOFF = 200, B_LINGER = 90, B_LOOK = 260, B_ARRIVE = 900, B_BEAT = 104, B_CHIPS = 340, B_BACK = 0.42;
const B_IN = 0.06 * 1.3 / BIRD_GROW; // (how far its beak goes into the bark on a blow, units: as deep as at 1.3, whatever its size, so it stays in the cell it pecks)
const flightMs = d => Math.max(240, Math.min(540, 200 + 0.42 * d));
const hopMs = d => Math.max(180, Math.min(380, 140 + 0.35 * d));
const smooth = t => t * t * (3 - 2 * t), clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);
const tickMs = () => (window.SnakeEngine ? SnakeEngine.tickMs(game) : T.MIN_TICK);
// The drum, as the sound has it (SnakeAudio.drumBlows: one table for the
// knocks you hear and the blows you see); the same numbers if it isn't there.
const DRUM_OWN = [];
function drumTable(strike) {
  if (window.SnakeAudio?.drumBlows) return SnakeAudio.drumBlows(strike);
  const s = Math.max(0, Math.min(12, strike | 0));
  if (!DRUM_OWN[s]) { const n = s < 3 ? 14 : Math.max(6, 14 - 2 * (s - 2)), out = []; for (let i = 0, at = 0; i < n; at += 28 + 2 * i, i++) out.push(at); DRUM_OWN[s] = out; }
  return DRUM_OWN[s];
}

// Its plan for a patch, from the woodpecker's own state (the tick of its
// strike, the patch, the one before, how many it's struck) and the board,
// so every screen, a friend's too, draws the same bird at the same moment:
// from where it rests, a hop to the perch for this spot (along the ledge,
// or along its side of the board; to the board's other side it flies
// straight in from where it is instead), a look, the flight in, a
// landing, the drum (a blow on each knock, the last on the strike), timed
// back from the strike; the flights shortened to fit the aim, leaving it
// B_LOOK at least to look before it goes. With reduced motion, a blow on
// every third knock, the last on the strike.
// Where it clings to drum is chosen as the aim starts, and again each
// tick while it's still on its perch (its hop done, before it crouches to
// go): the way that hides least of what you need to see (see drumChoice),
// as the board stands that tick. Then it's kept.
const plan = { strikeAt: -1, spot: -1, prev: -1, pecks: -1, layout: -1, ms: 0, aim: 0, lively: true,
  tx: 0, ty: 0, from: null, hop: null, drum: null, times: [], D: 0, F: 0, H: 0, H0: 0, aimMs: 0, depart: 0, chose: -1 };
function aimPlan(w, ms, to = Infinity) {
  const A = plan, spot = spotIn(w.target), prev = w.last.length ? spotIn(w.last) : ARRIVAL_SPOT, pecks = w.pecks || 0, lively = !reduced;
  if (A.strikeAt === w.strikeAt && A.spot === spot && A.prev === prev && A.pecks === pecks && A.layout === birdLayout && A.ms === ms && A.aim === T.PECK_AIM_TICKS && A.lively === lively) {
    if (A.chose !== game.tick && A.aimMs - to >= A.H && to > A.depart + B_TAKEOFF) { // (still on its perch: look again)
      A.chose = game.tick;
      const d = drumChoice(w, spot, A.from.flip);
      if (d !== A.drum) {
        const F = flightMs(Math.hypot(d.x - A.from.x, d.y - A.from.y)), k = Math.max(0.4, Math.min(1, (A.aimMs - B_LOOK - B_TAKEOFF - B_SETTLE - A.D) / (F + A.H0)));
        if (to > A.D + B_SETTLE + F * k + B_TAKEOFF) { A.drum = d; A.F = F * k; A.depart = A.D + B_SETTLE + A.F; } // (its hop kept as it was)
      }
    }
    return A;
  }
  A.strikeAt = w.strikeAt; A.spot = spot; A.prev = prev; A.pecks = pecks; A.layout = birdLayout; A.ms = ms; A.aim = T.PECK_AIM_TICKS; A.lively = lively;
  A.tx = (spot % GRID) * CELL + CELL / 2; A.ty = Math.floor(spot / GRID) * CELL + CELL / 2;
  const was = perchAt(prev), at = perchAt(spot), beside = k => k === 'left' || k === 'right';
  A.from = beside(was.side) && beside(at.side) && was.side !== at.side ? was : at;
  A.hop = A.from === at && Math.hypot(at.x - was.x, at.y - was.y) > 1 ? was : null;
  A.drum = drumChoice(w, spot, A.from.flip); A.chose = game.tick;
  const blows = drumTable(pecks), n = blows.length;
  A.D = blows[n - 1];
  A.times.length = 0;
  for (let i = 0; i < n; i++) if (lively || (n - 1 - i) % 3 === 0) A.times.push(blows[i] - A.D);
  A.aimMs = T.PECK_AIM_TICKS * ms;
  const F = flightMs(Math.hypot(A.drum.x - A.from.x, A.drum.y - A.from.y)), H = A.hop ? hopMs(Math.hypot(at.x - was.x, at.y - was.y)) : 0;
  const k = Math.max(0.4, Math.min(1, (A.aimMs - B_LOOK - B_TAKEOFF - B_SETTLE - A.D) / (F + H)));
  A.F = F * k; A.depart = A.D + B_SETTLE + A.F;
  A.H0 = H; A.H = Math.min(H * k, Math.max(0, A.aimMs - A.depart - 60));
  return A;
}
// ...and after the strike: a moment at the hole, the flight back to the
// perch for the spot it struck, and settling there (its "kik!": the game
// asks birdHome when), all within its rest.
const home = { struckAt: -1, spot: -1, layout: -1, ms: 0, rest: 0, lively: true, drum: null, to: null, tx: 0, ty: 0, F: 0, total: Infinity };
function homePlan(w, ms) {
  const H = home, spot = spotIn(w.last), rest = (w.restUntil - w.struckAt) * ms, lively = !reduced;
  if (H.struckAt === w.struckAt && H.spot === spot && H.layout === birdLayout && H.ms === ms && H.rest === rest && H.lively === lively) return H;
  H.struckAt = w.struckAt; H.spot = spot; H.layout = birdLayout; H.ms = ms; H.rest = rest; H.lively = lively;
  H.tx = (spot % GRID) * CELL + CELL / 2; H.ty = Math.floor(spot / GRID) * CELL + CELL / 2;
  H.to = perchAt(spot);
  H.drum = plan.strikeAt === w.struckAt && plan.spot === spot && plan.layout === birdLayout ? plan.drum : drumPoseAt(spot, H.to.flip);
  H.F = Math.max(160, Math.min(flightMs(Math.hypot(H.to.x - H.drum.x, H.to.y - H.drum.y)), rest - B_LINGER - B_SETTLE - 120));
  H.total = B_LINGER + H.F + B_SETTLE;
  return H;
}

// Its pose at this moment (tp: the tick, and how far through it, as drawn).
const ARRIVE_FROM = { x: 0, y: 0, s: 0.3, flip: 1, rot: 0 };
function posture(w, tp, now) {
  const P = pose, ms = tickMs(), lively = !reduced;
  P.alpha = 1; P.thrust = 0; P.blur = 0; P.gape = 0; P.air = 0; P.wing = 0; P.stroke = 1; P.sweep = 0; P.near = P.far = 1; P.feet = 1; P.crouch = 0; P.rot = 0;
  P.free = false; P.up = 1.2; P.drum = null; P.blows = 0; P.blink = false; P.rim = false;
  AX = AY = 0; AFREE = Infinity;
  if (w.target.length) {
    const to = (w.strikeAt - tp) * ms, A = aimPlan(w, ms, to), into = A.aimMs - to;
    if (to <= A.depart) aimOff(A.spot, tp - w.strikeAt, A.drum);
    P.fx = A.tx + AX; P.fy = A.ty + AY;
    if (A.hop && into < A.H) flight(A.hop, perchAt(A.spot), Math.max(0, into) / A.H, A.H, P, 'hop', 0, 0);
    else if (to > A.depart) { perched(A.from, P, 'eye'); if (lively) P.crouch = smooth(clamp01(1 - (to - A.depart) / B_TAKEOFF)); }
    else if (to > A.D + B_SETTLE) flight(A.from, atAim(A.drum), (A.depart - to) / A.F, A.F, P, 'out', lively ? 1 : 0, 0);
    else if (to > A.D + 1e-6) { landing(atAim(A.drum), (A.D + B_SETTLE - to) / B_SETTLE, P, 'land'); windUp(A, -to, P); }
    else { drumming(A, -to, P); P.x += AX; P.y += AY; }
    return;
  }
  if (w.struckAt >= 0 && w.last.length) {
    const H = homePlan(w, ms), since = (tp - w.struckAt) * ms;
    P.fx = H.to.x; P.fy = H.to.y - BU * 2;
    if (since < B_LINGER + H.F) aimOff(H.spot, tp - w.struckAt, H.drum);
    if (since < B_LINGER) { P.fx = H.tx + AX; P.fy = H.ty + AY; lingering(atAim(H.drum), clamp01(since / B_LINGER), P); chipsAfter(w, since, P); return; }
    if (since < B_LINGER + H.F) { flight(atAim(H.drum), H.to, (since - B_LINGER) / H.F, H.F, P, 'back', 0, 0.6); chipsAfter(w, since, P); return; }
    if (since < H.total) { landing(H.to, (since - B_LINGER - H.F) / B_SETTLE, P, 'settle'); return; }
    perched(H.to, P, 'rest');
    const kik = since - H.total; // (its "kik!" as it settles: its beak opens)
    if (kik < 110) P.gape = 0.3 * Math.sin(Math.PI * kik / 110);
    return;
  }
  const to = perchAt(restSpot(w));
  if (!w.last.length && w.struckAt < 0) {
    // Coming in from far off, small, as sudden death starts ("kik! kik!
    // kik!"), the moment the engine has it come (its first patch is
    // PECK_ARRIVE_TICKS on).
    const msA = (tp - (w.restUntil - T.PECK_ARRIVE_TICKS)) * ms;
    if (msA >= 0 && msA < B_ARRIVE) {
      if (!lively) { perched(to, P, 'rest'); P.alpha = clamp01(msA / 400); return; }
      const F = B_ARRIVE - B_SETTLE;
      ARRIVE_FROM.x = to.x + (SIZE / 2 - to.x) * 0.55; ARRIVE_FROM.y = SIZE * 0.1; ARRIVE_FROM.flip = to.x < ARRIVE_FROM.x ? -1 : 1;
      P.fx = to.x; P.fy = to.y - BU * 2;
      if (msA < F) { flight(ARRIVE_FROM, to, msA / F, F, P, 'arrive', 0, 0); P.alpha = clamp01(msA / (F * 0.25)); }
      else landing(to, (msA - F) / B_SETTLE, P, 'settle');
      if (msA < 390) P.gape = 0.3 * Math.sin(Math.PI * Math.min(1, (msA % 130) / 70)); // (its three calls: its beak opens on each)
      return;
    }
  }
  perched(to, P, 'rest');
}
function perched(p, P, phase) {
  P.x = p.x; P.y = p.y; P.s = p.s; P.flip = p.flip; P.rot = 0; P.feet = 1; P.wing = 0; P.up = p.up ?? 1.2; P.phase = phase; P.rim = !!p.rim;
}
// A flight from a to b (u: how far through, 0 to 1; ms: how long it takes):
// bounding as a woodpecker does, a burst of wingbeats lifting it, its wings
// tucked as it dips, then beats again, the whole in a swoop; its body
// tipped the way it's going, upright as it takes off, and leaning back
// with its wings up and swept forward as it comes in to land. Off its
// perch crouched (crouch), or with its wings half open already (wing).
// With reduced motion, one smooth glide, its wings out and still.
let PX = 0, PY = 0;
function pathAt(a, b, u, ms, lively) {
  const e = smooth(u), dx = b.x - a.x, dy = b.y - a.y, hump = Math.min(BU * 1.1, Math.hypot(dx, dy) * 0.12);
  PX = a.x + dx * e; PY = a.y + dy * e - hump * Math.sin(Math.PI * u);
  if (lively) {
    const nb = Math.max(1, Math.round(ms / 240)), q = u * nb, p = q - Math.min(nb - 1, Math.floor(q));
    PY -= BU * 0.32 * Math.min(1, ms / 300) * Math.sin(Math.PI * u) * Math.sin(Math.PI * p);
  }
}
function flight(a, b, u, ms, P, phase, crouch, wing) {
  u = clamp01(u);
  const lively = !reduced, dx = b.x - a.x;
  pathAt(a, b, u, ms, lively);
  P.x = PX; P.y = PY;
  P.flip = u > 0.86 ? b.flip : Math.abs(dx) > BU * 1.2 ? Math.sign(dx) : b.flip; // (it turns to land, if it must)
  P.s = a.s + (b.s - a.s) * smooth(u);
  const far = Math.hypot(dx, b.y - a.y) || 1;
  let vx = dx / far, vy = (b.y - a.y) / far; // (the way it's going overall, swaying with each swoop and dip)
  if (lively) { pathAt(a, b, Math.min(1, u + 0.02), ms, true); const x1 = PX, y1 = PY; pathAt(a, b, Math.max(0, u - 0.02), ms, true); const ix = x1 - PX, iy = y1 - PY, il = Math.hypot(ix, iy) || 1; vx += 0.6 * ix / il; vy += 0.6 * iy / il; }
  const pitch = Math.max(-0.35, Math.min(1.15, (Math.atan2(vy, vx * P.flip) + Math.PI / 2) * 0.75)); // (0: going straight up; level at about 1.15, and no further nose down)
  const k0 = smooth(clamp01(u / 0.16)), k1 = smooth(clamp01((1 - u) / 0.22));
  P.rot = ((pitch * k0 + a.rot * a.flip * (1 - k0)) * k1 + (b.rot * b.flip - 0.3) * (1 - k1)) * P.flip;
  P.feet = 0; P.air = smooth(clamp01(Math.min(u / 0.15, (1 - u) / 0.2)));
  P.crouch = crouch * (1 - smooth(clamp01(u / 0.15)));
  if (lively) {
    const nb = Math.max(1, Math.round(ms / 240)), q = u * nb, j = Math.min(nb - 1, Math.floor(q)), p = q - j;
    const beat = j < nb - 1 && p > 0.55 ? Math.max(0, 1 - (p - 0.55) / 0.07) : 1; // (tucked, dipping)
    P.wing = Math.max(beat * Math.min(1, wing + u / 0.05), 1 - k1);
    P.stroke = Math.cos(TAU * u * ms / B_BEAT) * k1 + (1 - k1);
  } else {
    P.wing = Math.min(1, wing + u / 0.1);
    P.stroke = 0.55 * k1 + (1 - k1);
  }
  P.sweep = 0.45 * (1 - k1);
  P.phase = phase; P.free = true; P.u = u;
}
// Landing (u, 0 to 1, over B_SETTLE): its wings folding from the flare, its
// body righting, a little settle onto its feet.
function landing(b, u, P, phase) {
  u = clamp01(u);
  const k = smooth(clamp01(u / 0.55));
  P.x = b.x; P.y = b.y; P.s = b.s; P.flip = b.flip;
  P.rot = (b.rot * b.flip - 0.3 * (1 - k)) * b.flip;
  P.wing = 1 - k; P.stroke = 1; P.sweep = 0.45 * (1 - k);
  P.feet = u > 0.2 ? 1 : 0;
  P.crouch = reduced ? 0 : 0.8 * Math.sin(Math.PI * clamp01(u / 0.85));
  P.air = 0.3 * (1 - k); P.up = b.up ?? 1.2;
  P.phase = phase;
}
// As it lands on its chunk, it draws its head back for the first blow.
function windUp(A, t, P) {
  const t0 = A.times[0];
  if (t <= t0 - 100) return;
  P.thrust = t < t0 - 30 ? -1.3 * B_BACK * smooth(clamp01((t - (t0 - 100)) / 70)) : -1.3 * B_BACK * (1 - ((t - (t0 - 30)) / 30) ** 2);
}
// Drumming (t: ms to the strike, as a negative): a blow on each of the
// drum's knocks (A.times), its head driving in and drawing back between
// them, a blur when they come too fast to see; the last on the strike.
function drumming(A, t, P) {
  const d = A.drum, n = A.times.length;
  P.x = d.x; P.y = d.y; P.s = d.s; P.flip = d.flip; P.rot = d.rot; P.feet = 1; P.phase = 'drum';
  let i = 0;
  while (i + 1 < n && A.times[i + 1] <= t) i++;
  if (i < n - 1) {
    const gap = A.times[i + 1] - A.times[i], p = clamp01((t - A.times[i]) / gap);
    P.thrust = B_IN - (B_BACK + B_IN) * Math.pow(Math.sin(Math.PI * p), 0.8);
    P.blur = reduced ? 0 : clamp01((46 - gap) / 16);
  } else P.thrust = B_IN;
  P.drum = A; P.blows = i + 1; P.t = t;
}
// The strike made: its head pulled out of the hole, wings opening, a lean back.
function lingering(d, u, P) {
  P.x = d.x; P.y = d.y; P.s = d.s; P.flip = d.flip; P.feet = 1; P.phase = 'linger';
  P.rot = (d.rot * d.flip - 0.15 * smooth(u)) * d.flip;
  P.thrust = -1.2 * B_BACK * smooth(u); P.wing = 0.6 * smooth(u); P.stroke = 1;
}
// The last blows' chips, still in the air after the strike.
function chipsAfter(w, since, P) {
  if (plan.strikeAt === w.struckAt && since < B_CHIPS) { P.drum = plan; P.blows = -1; P.t = since; }
}

// How it clings to drum a spot: upright, facing the way it came (flip),
// its beak's tip on the spot, if all of it fits on the screen there (its
// head drawn back, its settle and its lean back as it lands too); else leaning, else facing the
// other way, else lying level, its beak down at the spot (the bottom
// rows, with the board's bottom at the screen's) or up; else smaller.
// (Upright on the bottom row, its tail hung four cells below the board,
// past the bottom of a phone on its side.) With it, the other ways it
// could cling there as big (alts, the first this one): upright or
// leaning, facing either way (or, where it must lie level, lying level),
// for drumChoice.
const DRUM_TRIES = [0, 1, 0.45, 1, -0.45, 1, 0, -1, 0.45, -1, -0.45, -1, Math.PI / 2, 1, -Math.PI / 2, 1, Math.PI / 2, -1, -Math.PI / 2, -1], DRUM_SIZES = [1, 0.85, 0.72, 0.6];
const AIM_REACH = CELL / 2 - AIM_IN; // (how far its aim beside a snake can move the whole of it, board px: see freeAim. Since 2k, bigger, a pose fitted at the cell's middle could be moved off the screen by it)
const DRUM_UPRIGHT = 12; // (the tries upright or leaning: the first six)
const probe = { x: 0, y: 0, s: 1, flip: 1, rot: 0, crouch: 0, wing: 0, stroke: 1, sweep: 0, near: 1, far: 1, feet: 1, turn: 0, thrust: 0, air: 0 };
function drumPoseAt(spot, flip) {
  const key = spot * 2 + (flip > 0 ? 1 : 0);
  let d = drumAt.get(key);
  if (d) return d;
  const tx = (spot % GRID) * CELL + CELL / 2, ty = Math.floor(spot / GRID) * CELL + CELL / 2, Q = probe;
  let best = null, least = Infinity;
  for (const s of DRUM_SIZES) {
    for (let i = 0; i < DRUM_TRIES.length; i += 2) {
      if (d && (i < DRUM_UPRIGHT) !== d.upright) break; // (no lying level where it can stand)
      const f = flip * DRUM_TRIES[i + 1];
      Q.s = s; Q.flip = f; Q.rot = DRUM_TRIES[i] * f; Q.x = Q.y = 0; Q.turn = 0; Q.thrust = 0; Q.crouch = 0;
      birdMats(Q);
      Q.x = tx - atX(HM, BILL[0], BILL[1]); Q.y = ty - atY(HM, BILL[0], BILL[1]);
      Q.thrust = B_IN; birdBox(Q, true);
      Q.thrust = -1.3 * B_BACK; Q.crouch = 0.8; birdBox(Q, false);
      Q.crouch = 0; Q.rot = (DRUM_TRIES[i] - 0.3) * f; birdBox(Q, false); Q.rot = DRUM_TRIES[i] * f; // (and leaning back as it lands, or as it pulls out of the hole)
      const over = Math.max(room.x0 - box.x0, room.y0 - box.y0, box.x1 - room.x1, box.y1 - room.y1) + AIM_REACH; // (and room for its aim beside a snake to move it, see aimOff)
      if (over <= 0) { const p = { x: Q.x, y: Q.y, s, flip: f, rot: Q.rot, upright: i < DRUM_UPRIGHT }; if (d) d.alts.push(p); else { d = p; d.alts = [p]; } }
      else if (!d && over < least) { least = over; best = { x: Q.x, y: Q.y, s, flip: f, rot: Q.rot }; }
    }
    if (d) break;
  }
  if (!d) { d = best; d.alts = [best]; }
  drumAt.set(key, d);
  return d;
}
// Which of those ways it clings by, drumming: the one that hides least of
// what you need to see then, as the board stands: the rings where the
// food in its mark will land (the strike's promise, twice what anything
// else counts), then the heads, the food (trembling in its mark or lying
// near) and the tiles of its mark (all of them together counting as one
// head, so a ring still outweighs them). As it came, upright,
// if that's as clear. (Since 2k, bigger, it would hide more of those
// beside its spot than it did at 1.3 if it didn't weigh them. What it
// still covers of the rings is drawn over it: see drawWoodpecker.)
const SEE_RING = 4, SEE_HEAD = 2, SEE_FOOD = 2, SEE_TILE = 2;
let seeN = 0, seeX = new Float32Array(32), seeY = new Float32Array(32), seeW = new Float32Array(32);
function drumChoice(w, spot, flip) {
  const d = drumPoseAt(spot, flip);
  if (d.alts.length < 2) return d;
  const lands = knockCells(w);
  seeN = 0;
  const see = (x, y, wt) => {
    if (seeN === seeX.length) { const grow = a => { const b = new Float32Array(2 * a.length); b.set(a); return b; }; seeX = grow(seeX); seeY = grow(seeY); seeW = grow(seeW); }
    seeX[seeN] = (x + 0.5) * CELL; seeY[seeN] = (y + 0.5) * CELL; seeW[seeN++] = wt;
  };
  for (let i = 0; i < lands.length; i += 2) see(lands[i], lands[i + 1], SEE_RING);
  for (const s of game.snakes) if (s.alive && s.body.length) see(s.body[0].x, s.body[0].y, SEE_HEAD);
  for (const f of game.food) see(f.x, f.y, SEE_FOOD);
  for (const c of w.target) see(c % GRID, Math.floor(c / GRID), SEE_TILE / w.target.length);
  if (!seeN) return d;
  let pick = d, least = Infinity;
  for (const p of d.alts) {
    const c = hides(p);
    if (c < least - 1e-6) { least = c; pick = p; }
  }
  return pick;
}
// How much of those (seeX, seeY: each a ring's round, its middle and eight
// points on it) the bird drumming in pose p covers: its body, its tail,
// its head and beak, ink and all.
const SEE_R = CELL * 0.4 + BOX_EDGE * BU; // (its ink's soft edge too, which grew with the bird in 2c)
function hides(p) {
  const Q = probe;
  Q.x = p.x; Q.y = p.y; Q.s = p.s; Q.flip = p.flip; Q.rot = p.rot; Q.turn = 0; Q.thrust = B_IN; Q.crouch = 0;
  birdMats(Q);
  let sum = 0;
  for (let j = 0; j < seeN; j++) {
    let n = 0;
    for (let q = 0; q < 9; q++) {
      const a = q * TAU / 8, x = seeX[j] + (q < 8 ? Math.cos(a) * SEE_R : 0), y = seeY[j] + (q < 8 ? Math.sin(a) * SEE_R : 0);
      if (covers(x, y)) n++;
    }
    sum += seeW[j] * n / 9;
  }
  return sum;
}
function covers(x, y) { // (is board point x, y under the bird as its frames BM and HM stand?)
  let m = BM, det = m[0] * m[3] - m[1] * m[2], dx = x - m[4], dy = y - m[5];
  let u = (m[3] * dx - m[2] * dy) / det, v = (m[0] * dy - m[1] * dx) / det;
  if (((u + 0.1) / 1.07) ** 2 + ((v - 0.3) / 1.67) ** 2 <= 1 || inTri(u, v, -0.55, 1.1, -0.15, 3.1, 0.3, 1.2)) return true; // (its body; its tail)
  m = HM; det = m[0] * m[3] - m[1] * m[2]; dx = x - m[4]; dy = y - m[5];
  u = (m[3] * dx - m[2] * dy) / det; v = (m[0] * dy - m[1] * dx) / det;
  return ((u - 0.45) / 0.84) ** 2 + ((v + 1.75) / 0.82) ** 2 <= 1 || (u + 0.12) ** 2 + (v + 1.95) ** 2 <= 0.42 ** 2 || inTri(u, v, 1.05, -2.0, BILL[0], BILL[1], 1.05, -1.5); // (its head, its nape, its beak)
}
function inTri(x, y, ax, ay, bx, by, cx, cy) {
  const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by), d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy), d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
