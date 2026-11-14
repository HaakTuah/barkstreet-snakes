// The renderer (see render/core.js): what only you are shown at the start of a
// round (YOU over your snake, the arrow, ring and chevrons; friends' names over
// theirs), the frenzy's band on your body (drawHeld), and what only your press
// answers with (the × on a jump or flash that can't go).

// The first seconds of a round: which snake is yours. A bouncing arrow and
// YOU over your head (under it, heading down or near the top edge), a ring
// pulsing round it, chevrons marching the way you're heading; friends
// online get their names. Each screen marks its own snake. It fades once
// you steer (or a few seconds in): the game says when (showYou).
let youOn = false, youA = 0;
function showYou(on) { youOn = !!on; }
function drawYou(now) {
  youA += ((youOn ? 1 : 0) - youA) * Math.min(1, frameDt / 180);
  if (youA < 0.02 || !game) return;
  const c = CELL, t = reduced ? 0 : now / 1000;
  for (const s of game.snakes) {
    if (!s.alive || s.persona) continue; // (people only)
    const a = anim.get(s);
    if (!a || !a.n) continue;
    const hx = a.pts[0], hy = a.pts[1], mine = s.id === viewerId, col = colorOf(s);
    ctx.globalAlpha = youA;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const sgn = youSide(s, a, hy);
    if (!mine) { // a friend: the same arrow (a touch smaller), with the name they picked
      marker(hx, hy, sgn, col, s.name, 0.82, t);
      continue;
    }
    // A ring pulsing round your head...
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.strokeStyle = '#fffbea';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hy, c * (0.75 + 0.15 * pulse), 0, TAU); ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // ...chevrons marching the way you're heading...
    ctx.strokeStyle = col;
    ctx.lineWidth = c * 0.09;
    ctx.lineCap = 'round';
    const dx = s.dir.x, dy = s.dir.y;
    for (let i = 1; i <= 3; i++) {
      const along = i + ((t * 2) % 1) - 0.3, f = 1 - (along - 0.7) / 3;
      if (f <= 0) continue;
      const cx = hx + dx * c * along, cy = hy + dy * c * along, w = c * 0.22;
      if (cx < 0 || cy < 0 || cx > SIZE || cy > SIZE) continue;
      ctx.globalAlpha = youA * Math.min(1, f);
      ctx.beginPath();
      ctx.moveTo(cx - dx * w + dy * w, cy - dy * w + dx * w);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx - dx * w - dy * w, cy - dy * w - dx * w);
      ctx.stroke();
    }
    // ...and a bouncing arrow with YOU on it.
    ctx.globalAlpha = youA;
    marker(hx, hy, sgn, col, 'YOU', 1, t);
  }
  ctx.globalAlpha = 1;
}
// The frenzy's band (entry 6, part 3++): the woodpecker leaves you room
// only for your length as the frenzy began (game.woodpecker.held, see
// engine/outline.js), so once you've grown past it, a pale band across
// your body marks where: what lies behind it is length the log leaves no
// room for. Yours alone, as long as you're longer; still, with reduced
// motion too.
function drawHeld() {
  const held = game?.woodpecker?.held;
  if (!held) return;
  const i = game.snakes.findIndex(s => s.id === viewerId), s = game.snakes[i], a = s && anim.get(s), at = held[i];
  if (!s?.alive || !a || !(at >= 1) || at >= a.n) return;
  const x0 = a.pts[2 * at - 2], y0 = a.pts[2 * at - 1], x1 = a.pts[2 * at], y1 = a.pts[2 * at + 1], d = Math.hypot(x1 - x0, y1 - y0);
  if (!d || d > CELL * 1.5) return; // (two segments on a wrap or a portal's two sides: nowhere between them to draw it)
  const r = Math.max(a.rad[at - 1], a.rad[at]) * 1.6, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, px = -(y1 - y0) / d * r, py = (x1 - x0) / d * r;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(mx - px, my - py); ctx.lineTo(mx + px, my + py);
  ctx.strokeStyle = INK; ctx.lineWidth = CELL * 0.32; ctx.stroke();
  ctx.strokeStyle = '#fffbea'; ctx.lineWidth = CELL * 0.17; ctx.stroke();
}
// Which side of its head a snake's arrow goes (-1 over it, 1 under it):
// over it, unless its own body's there (heading down, as seat 2 starts
// online: the arrow and YOU covered the very snake they pointed at), and
// under it then; by an edge, the side with room, body or not. It stays on
// its side until that side goes wrong, so it doesn't jump about as the
// snake turns, or as it fades out.
function youSide(s, a, hy) {
  let sgn = a.youSgn || -1;
  if (s.dir.y === -sgn) sgn = -sgn; // (its neck's on that side)
  if (sgn < 0 ? hy < CELL * 2.6 : hy > SIZE - CELL * 2.6) sgn = -sgn; // (no room for it there)
  return (a.youSgn = sgn);
}
// A bouncing arrow over a head (under it, sgn 1: see youSide) with a
// label in the snake's colour; scale 1 for yours.
function marker(hx, hy, sgn, col, label, scale, t) {
  const c = CELL * scale;
  const bob = Math.sin(t * 5) * c * 0.18, tip = hy + sgn * (CELL * 0.9 + Math.abs(bob)), aw = c * 0.55, ah = c * 0.6;
  ctx.fillStyle = '#fffbea';
  ctx.strokeStyle = INK;
  ctx.lineWidth = c * 0.07;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(hx, tip);
  ctx.lineTo(hx - aw, tip + sgn * ah);
  ctx.lineTo(hx - aw * 0.42, tip + sgn * ah);
  ctx.lineTo(hx - aw * 0.42, tip + sgn * ah * 1.7);
  ctx.lineTo(hx + aw * 0.42, tip + sgn * ah * 1.7);
  ctx.lineTo(hx + aw * 0.42, tip + sgn * ah);
  ctx.lineTo(hx + aw, tip + sgn * ah);
  ctx.closePath();
  ctx.stroke(); ctx.fill();
  ctx.font = markerFont(Math.round(c * (label === 'YOU' ? 0.85 : 0.62)));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ly = tip + sgn * (ah * 1.7 + c * 0.6), half = Math.min(SIZE / 2, ctx.measureText(label).width / 2 + 4), lx = Math.min(SIZE - half, Math.max(half, hx));
  ctx.lineWidth = c * 0.16; ctx.strokeStyle = 'rgba(58,38,20,0.9)'; ctx.strokeText(label, lx, ly);
  ctx.fillStyle = col; ctx.fillText(label, lx, ly);
}
const markerFonts = new Map(); // size -> font (a size or two: no string built per frame)
function markerFont(px) {
  let f = markerFonts.get(px);
  if (!f) markerFonts.set(px, f = `700 ${px}px Fredoka, system-ui, sans-serif`);
  return f;
}

// A jump or a flash that can't go: a quick inked × on what it couldn't hop
// (or where it would have gone), in the press's own accent (sky for a
// jump, ember for a flash), so the press shows as heard, and refused (yours
// only: it answers your press, as the thunk does). It pops in; with
// reduced motion it's simply there. Both fade.
const REFUSE_MS = 320, REFUSE_REACH = CELL * 0.24 + 3.75; // (how far its arms and their ink reach from its middle, once it's popped in)
const refusal = { x: 0, y: 0, at: -1e9, tick: -1, flash: false };
function drawRefusal(now) {
  const t = (now - refusal.at) / REFUSE_MS;
  if (t < 0 || t >= 1) return;
  const x = refusal.x, y = refusal.y, d = CELL * 0.24 * (reduced ? 1 : 1 + 0.4 * Math.max(0, 1 - t * 5));
  ctx.globalAlpha = t < 0.6 ? 1 : (1 - t) / 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
  ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d);
  ctx.strokeStyle = INK; ctx.lineWidth = 7.5; ctx.stroke();
  ctx.strokeStyle = refusal.flash ? EMBER : SKY; ctx.lineWidth = 3.6; ctx.stroke();
  ctx.globalAlpha = 1;
}
