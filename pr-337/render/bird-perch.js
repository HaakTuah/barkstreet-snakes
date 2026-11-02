// The renderer (see render/core.js): the woodpecker's size (on a phone too),
// where it perches, where it aims beside a snake, and its layer.

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
let grownFor = ''; // (the screen's width, and whether it's a phone's, the bird's size was worked out for)
const boardRect = { x: 0, y: 0, w: 0, left: 0, top: 0, right: 0, bottom: 0, ledge: 0, upright: false, phone: false, hang: [], rims: [], words: [] };
function setBoardRect(x, y, w, free = null) {
  boardRect.x = x; boardRect.y = y; boardRect.w = w;
  boardRect.left = free ? free.left : 0; boardRect.top = free ? free.top : 0;
  boardRect.right = free ? free.right : innerWidth; boardRect.bottom = free ? free.bottom : innerHeight;
  boardRect.ledge = free?.ledge || 0;
  boardRect.upright = !!free?.upright || boardRect.ledge > 0; // (a phone held upright: with no ledge, its board leaves the bird a gutter of 13 px at least)
  boardRect.hang = free?.hang || [];
  boardRect.rims = free?.rims || [];
  boardRect.words = free?.words || [];
  boardRect.phone = Math.min(innerWidth, innerHeight) <= PHONE_SHORT_PX;
  if (`${innerWidth} ${boardRect.phone}` !== grownFor) { // (worked out again only when the screen's width changes, turned round, say: a phone's address bar coming and going never resizes it, nor its layer)
    grownFor = w && free ? `${innerWidth} ${boardRect.phone}` : ''; // (not until the page has laid the board out)
    let grow = boardRect.phone ? BIRD_GROW * PHONE_GROW : BIRD_GROW;
    if (boardRect.phone && boardRect.ledge > 0 && w) { // (held upright: no bigger than stands whole on the ledge, so it's one size perched and striking; never smaller than 2k's)
      const fits = 0.999 * (Math.min(innerHeight, boardRect.bottom) - y - w - 2 * PERCH_GAP_PX) / ((BIRD_BOX[3] - BIRD_BOX[1] + 2 * BOX_EDGE + CROUCH) * CELL * 0.85 * w / SIZE);
      grow = Math.max(BIRD_GROW, Math.min(grow, fits));
    } else if (boardRect.phone && w) { // (on its side: no bigger than leaves its beak, head and eye in the gap beside the board on a side that runs to the screen's edge, its back off the screen; never smaller than 2k's, perching as it did where the gap won't hold its eye)
      const rooms = [boardRect.left <= EDGE_SLACK_PX ? x - boardRect.left : 0, boardRect.right >= innerWidth - EDGE_SLACK_PX ? Math.min(innerWidth, boardRect.right) - x - w : 0];
      const fits = 0.999 * (Math.max(...rooms) - 2 * PERCH_GAP_PX) / ((BILL[0] - EYE_BACK + BOX_EDGE) * CELL * 0.85 * w / SIZE);
      grow = Math.max(BIRD_GROW, Math.min(grow, fits));
    }
    growBird(grow);
  }
  perches.clear(); drumAt.clear(); birdLayout++; // (its perches and where it drums are worked out again: the room round the board has changed)
}
const BIRD_GROW = 1.7; // (times its first size: 1.3 since 2c, 1.7 since 2k, on the board and under it alike)
// On a phone (a screen no more than PHONE_SHORT_PX on its short side,
// held upright or on its side) its board is less than half a desktop's,
// so the bird grows PHONE_GROW times more, to look as threatening there as
// beside a desktop's board (Haakon, 31 October 2026). Everything sized by
// it (BU and what's worked out from it) is set by growBird as the layout
// changes, never in the middle of a frame.
const PHONE_SHORT_PX = 500, PHONE_GROW = 1.6;
const EYE_BACK = 0.2, EDGE_SLACK_PX = 60; // (units behind its head's middle its eye's back edge is, so beak to eye is BILL[0] - EYE_BACK; and how far, CSS px, the free page may stop short of the screen's edge, a notch's safe area, and still count as running to it)
let BU = CELL * 0.85 * BIRD_GROW; // the bird's unit
const BILL = [2.55, -1.72]; // its beak tip, in units, before its head moves
const BIRD_BOX = [-1.15, -2.55, 2.65, 3.2]; // (all of it, round its feet, in units, facing right: its back, crown, beak tip, tail)
let PERCH_NEAR = 0.65 * 1.3 / BIRD_GROW; const PERCH_MIN_PX = 30, PERCH_FLOOR_PX = 22; // (how small it may perch: on a nearer side, 0.65 of its size at 2c, so growing never sends it to a smaller perch; and, CSS px tall, where there's no room anywhere; and on a phone held upright of a height in between, where the page leaves it room for 24)
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
  // (a phone on its side, Haakon's answer for #270: at its full size, partly
  // off the screen: its beak, head and eye in the gap beside the board, on
  // the side that runs to the screen's edge, inside the safe area; its back
  // and tail cut off by the screen's edge. Smaller only where even its eye
  // wouldn't fit, and never over the board while it perches)
  const edgeSide = k => (k === 'right' ? boardRect.right >= innerWidth - EDGE_SLACK_PX : boardRect.left <= EDGE_SLACK_PX);
  const cutSide = boardRect.phone && !boardRect.upright && sc && BU > CELL * 0.85 * BIRD_GROW * 1.001 ? ['left', 'right'].filter(k => fit[k] < 1 && edgeSide(k)).sort(nearer)[0] : null;
  const cutS = cutSide ? Math.min(1, (room[cutSide] - gap) / ((BILL[0] - EYE_BACK + BOX_EDGE) * BU)) : 0;
  const cut = cutS >= Math.max(least, fit[cutSide] || 0) && (side === 'left' || side === 'right'); // (only where it's bigger so than all of it on the screen)
  if (cut) side = cutSide;
  const nowhere = !cut && (side === 'left' || side === 'right') && !(fit[side] >= least);
  const s = cut ? cutS : side === 'ledge' ? ledge : nowhere ? Math.max(between ? floor : least, shrunk(side)) : Math.max(least, fit[side]);
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
  if (cut) { /* (its back off the screen: where it is, beak short of the board) */ }
  else if (p.flip > 0) p.x = Math.max(lo, Math.min(hi, p.x));
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
  const big = boardRect.phone && !boardRect.upright && BU > CELL * 0.85 * BIRD_GROW * 1.001; // (a phone on its side, its bird bigger: perched with its back past the screen's edge, so its layer runs to that edge, not the safe area's, and the screen cuts it)
  const L0 = big && boardRect.left <= EDGE_SLACK_PX ? 0 : boardRect.left, R0 = big && boardRect.right >= innerWidth - EDGE_SLACK_PX ? innerWidth : boardRect.right;
  const left = Math.floor(boardRect.x - m(boardRect.x - L0)), right = Math.ceil(boardRect.x + boardRect.w + m(R0 - boardRect.x - boardRect.w));
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

