// The renderer (see render/core.js): the outlines, the gold line of a power
// held, and the body itself, with its shading over a pit.

// Pass 2: people's cream outline (yours bright with a soft halo, so you find
// yourself at a glance; friends' plainer), or a dark body's pale rim. Each is
// a slightly bigger copy of the body, so it follows the taper and every corner.
const FRIEND_OUTLINE = '#cdbd9f', RIM = '#9a8069';
// People share one face, so online seats differ by a marking as well as a
// colour (lavender and sky look alike to many colour-blind players).
const MARKS = { '#fde047': 'spots', '#c4b5fd': 'rings', '#7dd3fc': 'dots' };
const markOf = color => MARKS[color] || '';
// Holding a golden power: golden leaps or dashes, or the edges wrapping
// round for it (fading calmly over its last WRAP_WARN_MS: no strobe).
const powered = s => s.leaps > 0 || s.dashes > 0 || s.wrapUntil > shownTime;
const wrapFade = s => Math.max(0, Math.min(1, (s.wrapUntil - shownTime) / T.WRAP_WARN_MS));
const poweredFade = s => s.leaps > 0 || s.dashes > 0 ? 1 : wrapFade(s);
const GOLD_EDGE = 3.9; // (how far the gold line and its ink reach outside a snake's own outline)
// Power marks. Gold (Honey) is the family: a gold line round a snake says
// it holds a power. Each kind adds an accent of its own, with a shape and
// a motion, so it reads without its hue: jumps are sky (round pips),
// flashes are ember (diamond pips, dashes running back along the gold
// line, a streak), and the wrap is a glint running slowly round the gold.
// Sky against ember is the pair colour-blind eyes tell apart best; the
// accents appear on power marks only.
const HONEY = '#fde68a', GLINT = '#fffbea';
const SKY = '#a8dcf5', EMBER = '#f7a866', EMBER_LINE = '#b5531d'; // (sky's own line, #2f6f96, isn't needed: ink outlines every sky mark)
const PIP_KEY = 0.9, PIP_RING = 2.3; // (a pip's parchment keyline reaches this far past its colour, and its ink past that, in units)
let PIPS = new Float64Array(3 * (T.LEAP_MAX + T.DASH_MAX)); // (each pip's place and spoke, this frame)
const RUN_DASH = [CELL * 0.14, CELL * 0.36], GLINT_DASH = [CELL * 1.4, CELL * 40]; // (ember dashes; a glint, alone)
// Your soft halo: a few faint steps of cream round your body, each wider
// and fainter than the last (a soft edge without a blur), and a touch more
// round your head. [width or radius (cells), alpha] pairs, outermost first.
const HALO = [1.42, 0.07, 1.22, 0.1, 1.04, 0.14], HALO_HEAD = [0.8, 0.07, 0.72, 0.1];
function drawHalo(s, a) {
  if (!a.isPlayer || s.id !== viewerId) return;
  const was = ctx.globalAlpha;
  ctx.strokeStyle = ctx.fillStyle = '#fffbea';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  spine(a);
  for (let i = 0; i < HALO.length; i += 2) { ctx.globalAlpha = was * HALO[i + 1]; ctx.lineWidth = CELL * HALO[i]; ctx.stroke(); }
  for (let i = 0; i < HALO_HEAD.length; i += 2) { ctx.globalAlpha = was * HALO_HEAD[i + 1]; circle(a.pts[0], a.pts[1], CELL * HALO_HEAD[i]); }
  ctx.globalAlpha = was;
}
// (halo: false for a snake up in the air, whose halo went down with the
// ground's outlines: see drawSnakes)
function drawOutline(s, a, halo = true) {
  if (halo) drawHalo(s, a); // (your soft halo, so you find yourself at a glance)
  const own = edgeOf(s, a, false); // (the outline it has anyway)
  if (powered(s)) { // a golden power: a thin, opaque gold line round its own outline, inked outside so it reads on any colour
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * poweredFade(s);
    ctx.fillStyle = INK;
    outlineFills(a, own + GOLD_EDGE);
    ctx.fillStyle = HONEY; // (Honey: gold means a power)
    outlineFills(a, own + 2.5);
    if (s.alive && (s.dashes > 0 || s.wrapUntil > shownTime)) goldRuns(s, a, own);
    ctx.globalAlpha = was;
  }
  if (a.isPlayer) {
    ctx.fillStyle = s.id === viewerId ? '#fffef8' : FRIEND_OUTLINE;
    outlineFills(a, own);
  } else if (a.rim) {
    ctx.fillStyle = RIM;
    outlineFills(a, own);
  }
}
// Along the gold line, in its own shape (the body and any outline of its
// own cover the rest): for golden flashes, short ember dashes running back
// from the head over its first few segments, as if it's going fast; for the
// wrap, a slow glint running down it, fading with the gold over its last
// WRAP_WARN_MS. Each is clipped to the few segments it's on (a whole long
// body's shape as a clip cost the GPU several ms a frame). With reduced
// motion they hold still.
const RUN_SEGS = 6, GLINT_GAP = 6, GLINT_SPEED = 3; // (segments the dashes run along; cells between one glint and the next; cells a second)
function goldRuns(s, a, own) {
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  if (s.dashes > 0) {
    const i1 = Math.min(a.n - 1, RUN_SEGS);
    ctx.save();
    shape(a, own + 2.5, 0, i1);
    ctx.clip();
    spine(a, 0, i1);
    ctx.lineWidth = CELL * 1.8;
    ctx.strokeStyle = EMBER_LINE;
    ctx.setLineDash(RUN_DASH);
    ctx.lineDashOffset = reduced ? 0 : -lastNow * CELL / 260;
    ctx.stroke();
    ctx.restore();
  }
  if (s.wrapUntil > shownTime && a.n > 1) {
    const g = reduced ? 1 : (lastNow / 1000 * GLINT_SPEED) % (a.n - 1 + GLINT_GAP); // (how far down it the glint is, in segments)
    if (g < a.n - 1) {
      const i0 = Math.max(0, Math.floor(g) - 1), i1 = Math.min(a.n - 1, Math.floor(g) + 2), was = ctx.globalAlpha;
      ctx.save();
      shape(a, own + 2.5, i0, i1);
      ctx.clip();
      spine(a, i0, i1);
      ctx.globalAlpha = s.leaps > 0 || s.dashes > 0 ? was * wrapFade(s) : was; // (the gold itself fades with it when the wrap is all it holds)
      ctx.lineWidth = CELL * 1.8;
      ctx.strokeStyle = GLINT;
      ctx.setLineDash(GLINT_DASH);
      ctx.lineDashOffset = GLINT_DASH[0] / 2 - (g - i0) * CELL; // (the glint's middle at g)
      ctx.stroke();
      ctx.restore();
    }
  }
}
// An opaque outline: fast separate fills, unless it's being drawn see-through
// (a corpse fading), where overlapping pieces would show.
const outlineFills = (a, grow) => ctx.globalAlpha < 1 ? silhouette(a, grow) : bodyFills(a, grow);
// How far a snake's drawn shape reaches beyond its body (units): its own
// outline (people's cream, a dark body's rim), and with gold, its gold line.
function edgeOf(s, a, gold = true) {
  const own = a.isPlayer ? (s.id === viewerId ? 3.5 : 2.5) : a.rim ? 1.5 : 0;
  return gold && powered(s) ? own + GOLD_EDGE : own;
}

// Pass 3: the body (bands, then circles tail to head, so the head ends up on
// top), its pattern and its face.
function drawBody(s, a, now, dead) {
  const { n, pts, rad, fills, look, color } = a;
  // Segments: narrower bands joining them, then a round one per cell.
  // (Bands as rectangles, fillRect's fast path; folding them into each
  // segment's circle as one shape measured slower.)
  for (let i = n - 2; i >= 0; i--) { ctx.fillStyle = fills[i + 1]; band(a, i, bandR(a, i)); }
  if (a.bridging && !dead) shadeBands(a, true); // (over a pit: the shade along the bands by its round segments, which cover their ends)
  for (let i = n - 1; i >= 0; i--) {
    if (i < n - 1 && bends(a, i)) { ctx.fillStyle = fills[i + 1]; circle(a.cor[2 * i], a.cor[2 * i + 1], bandR(a, i)); }
    if (i === 0 && a.star) break; // (a star's head is drawn with its face)
    ctx.fillStyle = fills[i];
    circle(pts[2 * i], pts[2 * i + 1], rad[i]);
  }
  if (a.bridging && !dead) shadeUnder(a); // (over a pit: shaded underneath, along its bands and through its segments, a hanging tail darker)

  // A little roundness on every segment (light from the top left): separate
  // circles, which never touch (a tail that's just grown sits on the segment
  // before it for a moment: that one's lit once).
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  let lx = -1e9, ly = -1e9, lr = 0;
  for (let i = a.star ? 1 : 0; i < n; i++) {
    const hr = rad[i] * 0.35, hx = pts[2 * i] - rad[i] * 0.3, hy = pts[2 * i + 1] - rad[i] * 0.35;
    if (Math.abs(hx - lx) + Math.abs(hy - ly) < hr + lr) continue;
    circle(hx, hy, hr);
    lx = hx; ly = hy; lr = hr;
  }

  // Patterns. Each follows the skin (by segment), not the board.
  if (a.isPlayer) {
    const mark = MARKS[color];
    if (mark === 'rings') {
      ctx.strokeStyle = 'rgba(58,38,20,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 1; i < n; i++) { const r = rad[i] * 0.55; ctx.moveTo(pts[2 * i] + r, pts[2 * i + 1]); ctx.arc(pts[2 * i], pts[2 * i + 1], r, 0, TAU); }
      ctx.stroke();
    } else if (mark) {
      ctx.fillStyle = 'rgba(58,38,20,0.45)';
      for (let i = 1; i < n; i++) {
        const x = pts[2 * i], y = pts[2 * i + 1], r = rad[i];
        if (mark === 'dots') circle(x, y, r * 0.3);
        else { circle(x - r * 0.38, y + r * 0.12, r * 0.17); circle(x + r * 0.38, y - r * 0.12, r * 0.17); }
      }
    }
  }
  if (s.personaKey === 'wildcard' && n > 2) {
    ctx.fillStyle = '#ffffff'; // stars on the blue
    for (let i = 2; i < Math.min(4, n); i++) for (const [dx, dy] of STARS) star(pts[2 * i] + dx * rad[i], pts[2 * i + 1] + dy * rad[i], rad[i] * 0.2);
    drawTie(a);
  }
  const coat = coatOf(s); // (Capricious's mood is a costume on its head, not its body)
  if (coat === 'mason') { // Caesar in marble: grey veins wandering across every segment, now and then a gold one
    ctx.lineCap = 'round'; // (as the veins always left it, for the wreath)
    for (let i = 1; i < n; i++) {
      // (each segment's own sprite, drawn at the segment's size before any gulp, and scaled)
      const rb = Math.round(CELL * (0.44 - 0.1 * (i / (n - 1)))), sp = veinSprite(i, rb), h = (rb + 2) * rad[i] / rb;
      ctx.drawImage(sp, pts[2 * i] - h, pts[2 * i + 1] - h, 2 * h, 2 * h);
    }
  } else if (coat === 'ouroboros') { // a python's back: a dark diamond on every segment, a pale fleck in each
    ctx.fillStyle = 'rgba(58,36,8,0.75)';
    ctx.beginPath();
    for (let i = 1; i < n; i++) {
      const x = pts[2 * i], y = pts[2 * i + 1], d = rad[i] * 0.62;
      ctx.moveTo(x, y - d); ctx.lineTo(x + d, y); ctx.lineTo(x, y + d); ctx.lineTo(x - d, y); ctx.closePath();
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(253,230,138,0.6)';
    ctx.beginPath();
    for (let i = 1; i < n; i++) {
      const x = pts[2 * i], y = pts[2 * i + 1], d = rad[i] * 0.2;
      ctx.moveTo(x, y - d); ctx.lineTo(x + d, y); ctx.lineTo(x, y + d); ctx.lineTo(x - d, y); ctx.closePath();
    }
    ctx.fill();
  } else if (coat === 'colonist') { // a redcoat's cross-belts: a cream strap zig-zagging down the body
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    for (let i = 1; i < n; i++) {
      const x = pts[2 * i], y = pts[2 * i + 1], d = rad[i] * 0.66;
      if (i % 2) { ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); }
      else { ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); }
    }
    ctx.stroke();
  }
  if (s.personaKey === 'copycat') { // dashed rings: a copy of someone
    if (copying(s)) { // (and copying, its head's thin rim of its own red: see fillsOf)
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pts[0], pts[1], rad[0] - 0.75, 0, TAU);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash(DASH);
    ctx.beginPath();
    for (let i = 1; i < n; i++) {
      const r = rad[i] - 2;
      ctx.moveTo(pts[2 * i] + r, pts[2 * i + 1]);
      ctx.arc(pts[2 * i], pts[2 * i + 1], r, 0, TAU);
    }
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
  }
  if (a.star && !dead) shedTwinkle(s, a, now);

  // Head features, drawn in a frame where +x points the way the snake faces.
  const blinking = dead || now < a.blinkUntil;
  if (!dead && now > a.nextBlink) {
    a.blinkUntil = now + T.BLINK_MS;
    a.nextBlink = now + T.BLINK_MIN + Math.random() * (T.BLINK_MAX - T.BLINK_MIN);
  }
  if (!dead) updateGaze(s, look, a, now); // (it's turned in prepare: see steer)
  const dizzy = !dead && s.stunUntil >= game.tick; // (stunned: its head wobbles, and stars go round it, until the tick it moves again)
  const q = dead ? null : queuedOf(s, a), lean = dead ? 0 : leanOf(s, a, q);
  if (a.star) { const h = starFace(a) + lean; headCos = Math.cos(h); headSin = Math.sin(h); } // (a star's face is upright, whichever way it heads)
  else if (lean) { const h = Math.atan2(a.hs, a.hc) + lean; headCos = Math.cos(h); headSin = Math.sin(h); }
  else { headCos = a.hc; headSin = a.hs; }
  gazeX = a.gx * headCos + a.gy * headSin; // the gaze, turned into the face's frame
  gazeY = -a.gx * headSin + a.gy * headCos;
  deadNow = dead;
  if (a.star) drawStarHead(s, a, now, dead); // (its head: a star, its points turned with its heading, its mustache upright with its face)
  ctx.save();
  ctx.translate(pts[0], pts[1]);
  ctx.rotate((a.star ? a.face : a.turn) + lean); // (and stunned, its wobble: see prepare)
  const faceScale = 1.1 * (1 + a.bump) * (1 + a.swell);
  ctx.scale(faceScale * (1 - 0.22 * a.squash), faceScale * (1 + 0.12 * a.squash)); // (come down from a jump: squashed along the way it's going, a moment)
  const change = dead ? -1 : costumeChange(s, a, now); // (how far through a costume change, or -1)
  if (a.isPlayer) drawPlayerFace(s, a, now, blinking);
  else if (change < 0) drawFace(s, look, color, blinking, a);
  else drawChange(s, a, look, color, blinking, change);
  if (!dead && a.growl) drawGrowl(a, now); // (hungry, in the warning's seconds: its growl)
  ctx.restore();

  // Golden powers held: a pip for each on a short arc behind the head,
  // turned with it: round, in sky, for a golden leap; a diamond, in ember,
  // for a dash. Holding both, the leaps go on its left and the dashes on
  // its right, a gap between. The gold outline carries the glow; no ring
  // of its own. Three or more don't fit in the neck's pinch (the outer two
  // sat across its outline), so they go a little further back, over the
  // first segment, where the body's widest. Each is ringed in parchment
  // inside an ink line, so it reads on any body (ember on Gobbler's
  // orange, sky on Metagamer's cyan), and a diamond points along the arc's
  // spokes, so side by side they never touch (three of them read as a
  // zigzag seam). At the board's edge the arc swings round the head onto
  // the board, so none is cut off and none lands on the head (on a phone
  // the tag hides the counts: the pips are them).
  const leaps = dead ? 0 : s.leaps, dashes = dead ? 0 : s.dashes;
  if (leaps || dashes) drawPips(pts[0], pts[1], Math.atan2(a.hs, a.hc) + Math.PI, a.star ? rad[0] * STAR_TIP : rad[0], a.swell, leaps, dashes, !a.offs); // (not across a wrapped edge: there it shows at the other)
  if (!dead && s.id === viewerId && game) drawRests(s, a, now);
  if (dizzy) { // three stars going round, cream and inked (gold by a head means a power), clear of its pips and the edge: see starsOff
    const t = reduced ? 0 : now / 240, cy = pts[1] + starsOff(s);
    ctx.fillStyle = '#fffbea';
    ctx.strokeStyle = 'rgba(58,38,20,0.85)';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      const a2 = t + i * TAU / 3;
      star(pts[0] + Math.cos(a2) * CELL * 0.55, cy + Math.sin(a2) * CELL * 0.18, CELL * 0.22);
      ctx.stroke();
    }
  }
}
const DASH = [3, 3], NO_DASH = [];
// A costume change (2t): Capricious taking up a mood (or putting one
// down), or Copycat a new model (or none). One animation for all of them,
// in the face's frame, over COSTUME_MS: a quick puff round the head, in
// Capricious's pink or Copycat's red; the old costume popping off (bigger,
// fading, its head's old colour with it) and the new one popping on. With
// reduced motion, a plain crossfade. (Seen, not played: each screen sees
// the mood and the model it has.)
const COSTUME_MS = 500;
function costumeChange(s, a, now) {
  const cap = s.personaKey === 'capricious';
  if (!cap && s.personaKey !== 'copycat') return -1;
  const key = cap ? a.look : copying(s) ? String(s.memory.modelId) : '';
  if (a.costume !== key) {
    if (a.costume !== null) { a.costumeAt = now; a.oldLook = a.wornLook; a.oldColor = a.wornColor; a.oldHead = a.wornHead; }
    a.costume = key;
  }
  a.wornLook = a.look; a.wornColor = a.color; a.wornHead = a.fills[0]; // (as worn this frame: the old costume, next change)
  const u = (now - a.costumeAt) / COSTUME_MS;
  return u >= 0 && u < 1 ? u : -1;
}
function drawChange(s, a, look, color, blinking, u) {
  const r = a.rad[0] / 1.1, g = ctx.globalAlpha;
  if (reduced) {
    ctx.globalAlpha = g * (1 - u); oldCostume(s, a, blinking, r);
    ctx.globalAlpha = g * u; drawFace(s, look, color, blinking, a);
    ctx.globalAlpha = g;
    return;
  }
  const on = popOf((u - 0.3) / 0.7 * POP_MS); // (on from 30% of the way, past full size and back)
  if (on > 0) { ctx.save(); ctx.scale(on, on); drawFace(s, look, color, blinking, a); ctx.restore(); }
  if (u < 0.5) { // (off: bigger, and gone)
    const v = u / 0.5, k = 1 + 0.5 * v;
    ctx.save(); ctx.globalAlpha = g * (1 - v) * (1 - v); ctx.scale(k, k);
    oldCostume(s, a, blinking, r);
    ctx.restore();
  }
  const col = s.personaKey === 'copycat' ? s.color : '#ec4899', pale = s.personaKey === 'copycat' ? '#fecaca' : '#fbcfe8';
  const p = Math.sin(Math.min(1, u / 0.85) * Math.PI); // (the puff: swells round the head, then clears)
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const ang = i * TAU / 9 + u * 0.9, d = r * (0.95 + 0.6 * u), pr = r * (0.26 + 0.1 * (i % 2)) * p;
    if (pr <= 0) continue;
    ctx.moveTo(Math.cos(ang) * d + pr, Math.sin(ang) * d); ctx.arc(Math.cos(ang) * d, Math.sin(ang) * d, pr, 0, TAU);
  }
  ctx.globalAlpha = g * Math.min(1, 1.6 * (1 - u));
  ctx.fillStyle = pale; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = CELL * 0.05; ctx.stroke();
  ctx.globalAlpha = g;
}
// The costume it wore before the change: its head's colour and its face.
function oldCostume(s, a, blinking, r) {
  if (a.oldHead == null) return;
  ctx.fillStyle = a.oldHead;
  circle(0, 0, r);
  const head = a.fills[0];
  a.fills[0] = a.oldHead; // (its face's own colours from it: Copycat's ears)
  drawFace(s, a.oldLook, a.oldColor, blinking, a);
  a.fills[0] = head;
}
// A body over a pit (see sinkOf): with nothing under it to light it from
// below, its side away from the light (down and to the right) is in shade,
// the more the further over the pit it is; and a tail end hanging into the
// pit darkens the deeper it hangs. Drawn over its segments as they are,
// before their sheen and markings. Over the pit its bands are as wide as
// its segments (see bandR), so a straight run is shaded like one: a strip
// of shade along its lower side (or its right one going down), each half
// of a band's in a darker step of the colour of the segment it's nearer,
// by how far over the pit that is, running on through the segments
// (shadeBands). A round segment (an end, a turn, or a head or a gulp wider
// than its bands: roundAt) covers the strips' ends by it, and is drawn again
// in its darker step, then in its own colour a little up and to the left
// and smaller, leaving a crescent of shade along its lower right, as wide
// as the strip. (A crescent on every segment read as a row of beads over
// the pit, and the bands' narrower strips as a rod between them: the
// outline glitch.) (Two circles a segment and rectangles a band, the GPU's
// quickest shapes, and no clip: a clip to a body's shape costs it dearly.
// Each step of shade is a cached colour, four of them.)
const UNDER = '#140a04', UNDER_DARK = 0.42, UNDER_IN = 0.11; // (the shade at its darkest; how far its lit part moves in, in radii)
const shadeOf = (c, o) => mix(c, UNDER, Math.ceil(o * 4) / 4 * UNDER_DARK);
// Is segment i round over the pit (shaded with a crescent: an end, a turn,
// or wider than the bands either side, like a head or a gulp), or part of
// a straight run as wide as it (shaded by its bands' strips)?
const ROUND_GAP = 1; // (units wider than its bands)
const roundAt = (a, i) => i === 0 || i >= a.n - 1 || !straightAt(a, i) || a.rad[i] > Math.max(bandR(a, i - 1), bandR(a, i)) + ROUND_GAP;
function shadeBands(a, round) { // (a strip along each band's lower side, as wide as a segment's crescent at its lowest, each half by its own segment: with round, the halves by a round segment, before the segments, which cover their ends; else the rest, after them, running on through them)
  const { n, rad, fills, hang, pts: p, cor: c } = a;
  for (let i = n - 2; i >= 0; i--) {
    if (hang[i] < 0.02 && hang[i + 1] < 0.02) continue;
    const h = bandR(a, i), s = rad[i + 1] * UNDER_IN * (1 + Math.SQRT2);
    const x1 = p[2 * i], y1 = p[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
    let qx = c[2 * i], qy = c[2 * i + 1];
    const straight = (near(x1, qx) && near(qx, x2)) || (near(y1, qy) && near(qy, y2));
    if (straight) { qx = (x1 + x2) / 2; qy = (y1 + y2) / 2; } // (straight: halved in the middle; turning, its corner's round covers the ends there)
    if (!straight && !round) continue;
    if (hang[i] >= 0.02 && (!straight || roundAt(a, i) === round)) { ctx.fillStyle = shadeOf(fills[i], hang[i]); shadeStrip(x1, y1, qx, qy, h, s); }
    if (hang[i + 1] >= 0.02 && (!straight || roundAt(a, i + 1) === round)) { ctx.fillStyle = shadeOf(fills[i + 1], hang[i + 1]); shadeStrip(qx, qy, x2, y2, h, s); }
  }
}
function shadeStrip(x1, y1, x2, y2, h, s) {
  if (near(y1, y2)) { if (!near(x1, x2)) ctx.fillRect(Math.min(x1, x2), y1 + h - s, Math.abs(x2 - x1), s); }
  else if (near(x1, x2)) ctx.fillRect(x1 + h - s, Math.min(y1, y2), s, Math.abs(y2 - y1));
}
function shadeUnder(a) {
  const { n, pts, rad, fills, hang, sink } = a;
  for (let i = n - 1; i >= 0; i--) {
    const o = hang[i];
    if (o < 0.02 || (i === 0 && a.star) || !roundAt(a, i)) continue; // (a star's head is drawn with its face; a straight run's segment, by its bands' strips)
    const x = pts[2 * i], y = pts[2 * i + 1], r = rad[i], d = r * UNDER_IN;
    ctx.fillStyle = shadeOf(fills[i], o);
    circle(x, y, r);
    ctx.fillStyle = fills[i];
    circle(x - d, y - d, r - d * Math.SQRT2);
  }
  shadeBands(a, false);
  ctx.fillStyle = UNDER;
  for (let i = 0; i < n; i++) {
    if (sink[i] <= SAG) continue;
    ctx.globalAlpha = Math.min(1, (sink[i] - SAG) / (1 - SAG)) * 0.7; // (hanging into the pit: darker, the deeper)
    circle(pts[2 * i], pts[2 * i + 1], rad[i]);
  }
  ctx.globalAlpha = 1;
}
