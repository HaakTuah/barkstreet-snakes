// The renderer (see render/core.js): the pieces of a face (eyes, lids,
// mouths and the shapes of hats and beaks), then every look's face.

// ---------------------------------------------------------------- faces

// Shared helpers draw in the head's local frame (+x forward, one cell = CELL).
// gazeX/gazeY: where this snake's eyes point (a unit vector in that frame).
let blinkNow = false, gazeX = 1, gazeY = 0;
let headCos = 1, headSin = 0; // the heading the face is drawn turned to
// The way the head faces, as drawn (the way it's drawn heading: see
// prepare): it swings round smoothly when the snake turns, and when a
// rival turns again and again (a staircase, a wiggle) it holds a steady
// line between them, instead of whipping round every tick and flinging its
// tongue from side to side. Yours turns quickly, busy or not
// (FACE_EASE_MS): it's your press, and your face is how you see it taken.
function steer(s, a, now) {
  const dx = a.tdx, dy = a.tdy;
  if (a.hc === undefined) { a.hx = a.hc = dx; a.hy = a.hs = dy; a.ldx = dx; a.ldy = dy; a.turned = [-1e9, -1e9]; }
  if (dx !== a.ldx || dy !== a.ldy) { a.ldx = dx; a.ldy = dy; a.turned[0] = a.turned[1]; a.turned[1] = now; }
  const busy = now - a.turned[0] < 650; // (two turns close together)
  const k = reduced ? 1 : 1 - Math.exp(-frameDt / (s.id === viewerId ? T.FACE_EASE_MS : busy ? 300 : 70));
  a.hx += (dx - a.hx) * k;
  a.hy += (dy - a.hy) * k;
  const len = Math.hypot(a.hx, a.hy) || 1;
  a.hc = a.hx / len; a.hs = a.hy / len;
}

// Closed eyes: two short lids (at x, ±y), or crosses if knocked out.
function lids(r, x = 0.14, y0 = 0.2) {
  const c = CELL;
  ctx.strokeStyle = INK;
  ctx.lineWidth = c * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const sg of SIDES2) {
    const y = sg * y0;
    if (deadNow) { cross(x, y, Math.max(r, 0.08) * 0.85); continue; } // knocked out, not asleep
    ctx.moveTo(c * x, c * (y - r));
    ctx.quadraticCurveTo(c * (x + r * 0.9), c * y, c * x, c * (y + r));
  }
  ctx.stroke();
}

// An X at (x, y), half-width d, added to the current path.
function cross(x, y, d) {
  const c = CELL;
  ctx.moveTo(c * (x - d), c * (y - d)); ctx.lineTo(c * (x + d), c * (y + d));
  ctx.moveTo(c * (x + d), c * (y - d)); ctx.lineTo(c * (x - d), c * (y + d));
}

// Plain dark eyes, shifted a touch toward what the snake is looking at.
function eyes(r, fill) {
  if (blinkNow) return lids(r);
  const c = CELL, ox = gazeX * c * 0.03, oy = gazeY * c * 0.03;
  ctx.fillStyle = fill;
  circle(c * 0.15 + ox, -c * 0.2 + oy, c * r);
  circle(c * 0.15 + ox, c * 0.2 + oy, c * r);
}

// Small white eyes whose pupils turn toward what the snake is looking at.
// r: the pupil's radius (the white is a size up).
function lookingEyes(r, x = 0.15, y = 0.2, wide = 1.55) {
  if (blinkNow) return lids(r * 1.3, x, y);
  const c = CELL, w = r * wide, reach = (w - r) * 0.85;
  ctx.fillStyle = '#fffbea';
  circle(c * x, -c * y, c * w);
  circle(c * x, c * y, c * w);
  ctx.fillStyle = INK;
  const ox = gazeX * c * reach, oy = gazeY * c * reach;
  circle(c * x + ox, -c * y + oy, c * r);
  circle(c * x + ox, c * y + oy, c * r);
  if (r >= 0.045) catchlights(c * x + ox, c * y, oy, c * r);
}

// A small mouth at the front of the head, open by `open` (0..1).
function mouth(open, x = 0.42) {
  if (open < 0.08) return;
  const c = CELL;
  ctx.fillStyle = '#3b0d0d';
  ctx.beginPath();
  ctx.ellipse(c * x, 0, c * (0.03 + 0.04 * open), c * (0.05 + 0.1 * open), 0, 0, TAU);
  ctx.fill();
}

function poly(pts, sign, fill) {
  const c = CELL;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0] * c, pts[1] * c * sign);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] * c, pts[i + 1] * c * sign);
  ctx.fill();
}

const CROWN = [0.02, -0.34, 0.02, 0.34, -0.42, 0.34, -0.22, 0.17, -0.42, 0, -0.22, -0.17, -0.42, -0.34];
const TRICORN = [0.05, 0, -0.45, -0.45, -0.45, 0.45];
const BEAK = [0.32, -0.12, 0.6, 0, 0.32, 0.12];
const EAR = [-0.3, 0.1, -0.05, 0.42, -0.45, 0.5];
const EAR_IN = [-0.28, 0.18, -0.12, 0.38, -0.38, 0.42];
const JESTER = [-0.1, 0.3, -0.55, 0.62, -0.32, 0.05];
const HARLEQUIN = [-0.07, 0.2, 0.15, 0.08, 0.31, 0.2, 0.15, 0.32];
const WHISKERS = [0.3, 0.45, 0.6];
const PARTY_YELLOW = '#ffde00'; // (Copycat's pin, the flag's yellow, on its head of the flag's red)
// Colonist's tricorn: three corners (one forward), the brim wider than the head.
const TRI_F = [0.1, 0], TRI_L = [-0.5, -0.6], TRI_R = [-0.5, 0.6], TRI_BOW = 0.1;
function tricornSide(c, a, b) { // each side's middle pulled in toward the crown
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  ctx.quadraticCurveTo(c * (mx + (-0.28 - mx) * TRI_BOW * 2.4), c * (my * (1 - TRI_BOW * 2.4)), c * b[0], c * b[1]);
}

// Your face: white eyes whose pupils glance toward the nearest food, a
// mouth that opens for a bite, a blink now and then, and a forked tongue flick.

function drawPlayerFace(s, a, now, blinking) {
  const c = CELL;
  const open = mouthOpen(s, a);
  tongue(a, now, coughing(s) ? 1 : open, 'player', true); // (coughing, its mouth is shut)
  mouth(open, 0.44);
  if (!deadNow && coughing(s)) { // (coughing, a mouth shut tight, as the Field guide shows it: there's nothing else on your face to shut)
    ctx.strokeStyle = INK; ctx.lineWidth = c * 0.06; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(c * 0.3, c * 0.07); ctx.quadraticCurveTo(c * 0.4, c * 0.02, c * 0.47, c * 0.05); ctx.stroke();
  }

  if (blinking) return lids(0.11);
  ctx.fillStyle = '#fffbea';
  circle(c * 0.16, -c * 0.2, c * 0.13);
  circle(c * 0.16, c * 0.2, c * 0.13);
  ctx.fillStyle = INK;
  const ox = gazeX * c * 0.05, oy = gazeY * c * 0.05;
  circle(c * 0.16 + ox, -c * 0.2 + oy, c * 0.07);
  circle(c * 0.16 + ox, c * 0.2 + oy, c * 0.07);
  catchlights(c * 0.16 + ox, c * 0.2, oy, c * 0.07);
}

// A speck of light in each pupil (at x, ±y + oy, pupils of radius pr), so eyes look alive.
// (The face is drawn turned to the heading, so the light's offset is turned back.)
function catchlights(x, y, oy, pr) {
  catchlight(x, -y + oy, pr);
  catchlight(x, y + oy, pr);
}
function catchlight(x, y, pr) {
  const dx = -pr * 0.35, dy = -pr * 0.35;
  ctx.fillStyle = '#ffffff';
  circle(x + headCos * dx + headSin * dy, y - headSin * dx + headCos * dy, pr * 0.38);
}

function drawFace(s, look, color, blinking, a) {
  const c = CELL;
  blinkNow = blinking;
  const open = mouthOpen(s, a);
  const flicks = look === 'copycat' ? copiedLook(s) : look;
  tongue(a, lastNow, coughing(s) ? 1 : open, flicks, flicks === 'gobbler', look !== 'sniper' && look !== 'star'); // (Sniper's comes out of its scope, and Star's is its mustache: see drawStarHead; coughing, its mouth is shut)
  switch (look) {
    case 'sniper': { // one eye squeezed shut (it never blinks on the job), the other behind a scope that swings onto its target
      ctx.strokeStyle = INK;
      ctx.lineWidth = c * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (deadNow) cross(0.14, 0.2, 0.085);
      else { ctx.moveTo(c * 0.08, c * 0.11); ctx.lineTo(c * 0.2, c * 0.2); ctx.lineTo(c * 0.08, c * 0.29); }
      ctx.stroke();
      mouth(open, 0.4);
      ctx.save();
      ctx.translate(c * 0.1, -c * 0.2);
      // Aim, within reason; knocked out, the scope slumps off to the side.
      ctx.rotate(deadNow ? -1.25 : Math.max(-0.45, Math.min(0.45, Math.atan2(gazeY, gazeX))));
      ctx.fillStyle = '#1c1917'; // the scope: eyepiece, tube and a wider front bell
      circle(0, 0, c * 0.14);
      ctx.fillRect(0, -c * 0.09, c * 0.34, c * 0.18);
      circle(c * 0.36, 0, c * 0.15);
      ctx.fillStyle = '#57534e'; // a sheen along the top of the tube
      ctx.fillRect(0, -c * 0.09, c * 0.34, c * 0.045);
      ctx.fillStyle = deadNow ? '#475569' : '#7dd3fc'; // the lens, with a glint (or cracked)
      circle(c * 0.4, 0, c * 0.09);
      if (deadNow) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = c * 0.02;
        ctx.beginPath();
        ctx.moveTo(c * 0.34, -c * 0.06); ctx.lineTo(c * 0.4, -c * 0.01); ctx.lineTo(c * 0.37, c * 0.02); ctx.lineTo(c * 0.45, c * 0.06);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffffff';
        circle(c * 0.43, -c * 0.04, c * 0.03);
      }
      if (flickP >= 0) laser(flickT, flickP, 0.49); // its tongue: the laser sight
      ctx.restore();
      break;
    }
    case 'gobbler': { // stuffed hamster cheeks either side of the mouth, a mouth that opens near food
      // After a bite the cheeks puff up fast and go down slowly (still with reduced motion: no movement, just size).
      const t = (lastNow - a.ateAt) / T.CHEEKS_MS;
      const puff = t < 0 || t >= 1 ? 0 : t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
      const cr = c * (0.25 + 0.1 * puff), cy = c * (0.27 + 0.06 * puff);
      ctx.fillStyle = color; // the cheeks swell the head's own outline toward the front...
      circle(c * 0.24, -cy, cr);
      circle(c * 0.24, cy, cr);
      ctx.fillStyle = mix(color, '#ffffff', 0.22); // ...catch the light on top...
      circle(c * 0.2, -cy - c * 0.03, cr * 0.6);
      circle(c * 0.2, cy + c * 0.03, cr * 0.6);
      ctx.fillStyle = puff > 0.3 ? 'rgba(244,114,182,0.65)' : 'rgba(244,114,182,0.45)'; // ...and blush toward the mouth
      ctx.beginPath();
      ctx.ellipse(c * 0.3, -cy - c * 0.03, c * 0.11, c * 0.07, 0, 0, TAU);
      ctx.moveTo(c * 0.41, cy + c * 0.03); // a separate shape, not joined to the first
      ctx.ellipse(c * 0.3, cy + c * 0.03, c * 0.11, c * 0.07, 0, 0, TAU);
      ctx.fill();
      // A big mouth: open wide within 3 cells of food, and chomping after a bite.
      const hungry = a.near <= 3 && !coughing(s) ? 1 : 0; // (coughing, its mouth stays shut)
      const gape = Math.max(open, hungry);
      ctx.fillStyle = '#3b0d0d';
      ctx.beginPath();
      if (gape > 0.5) ctx.arc(c * 0.38, 0, c * (0.12 + 0.08 * gape), -Math.PI / 2, Math.PI / 2);
      else ctx.ellipse(c * 0.38, 0, c * 0.04, c * (0.12 + 0.08 * gape), 0, 0, TAU);
      ctx.fill();
      // Eyes that grow as food gets closer.
      const greed = Math.max(0, 1 - a.near / 6);
      lookingEyes(0.055 * (1 + 0.8 * greed), 0.12, 0.2);
      break;
    }
    case 'ghost': { // hollow, tall eyes that drift toward the nearest threat
      mouth(open * 0.6, 0.4);
      if (blinking) { lids(0.12); break; }
      const ox = gazeX * c * 0.04, oy = gazeY * c * 0.04;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(c * 0.12 + ox, -c * 0.2 + oy, c * 0.1, c * 0.14, 0, 0, TAU);
      ctx.ellipse(c * 0.12 + ox, c * 0.2 + oy, c * 0.1, c * 0.14, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1'; // a pale glint in each hollow, turned to what it's watching
      circle(c * 0.12 + ox * 2.2, -c * 0.2 + oy * 2.2, c * 0.03);
      circle(c * 0.12 + ox * 2.2, c * 0.2 + oy * 2.2, c * 0.03);
      break;
    }
    case 'sovereign': // a golden crown, spikes pointing back
      poly(CROWN, 1, '#facc15');
      ctx.fillStyle = '#dc2626';
      circle(-c * 0.06, 0, c * 0.07);
      mouth(open);
      lookingEyes(0.055);
      break;
    case 'colonist': { // a redcoat's tricorn from above: three corners (one forward), brims bowing in, thin gold lace, a raised crown
      // The brim: three rounded corners joined by sides that curve inward.
      ctx.beginPath();
      ctx.moveTo(c * TRI_F[0], c * TRI_F[1]);
      tricornSide(c, TRI_F, TRI_L); tricornSide(c, TRI_L, TRI_R); tricornSide(c, TRI_R, TRI_F);
      ctx.closePath();
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = '#facc15'; // gold lace along the edge
      ctx.lineWidth = c * 0.035;
      ctx.fill();
      ctx.stroke();
      ctx.lineJoin = 'miter';
      ctx.fillStyle = '#2f2a27'; // the crown, catching a little light
      ctx.beginPath();
      ctx.ellipse(-c * 0.27, 0, c * 0.15, c * 0.22, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      circle(-c * 0.31, -c * 0.06, c * 0.045);
      mouth(open);
      lookingEyes(0.055);
      break;
    }
    case 'drab': { // bored, heavy-lidded eyes that do drift toward lunch
      mouth(open * 0.5);
      if (blinking) { lids(0.09); break; }
      const ox = gazeX * c * 0.035, oy = gazeY * c * 0.04;
      ctx.fillStyle = '#fffbea';
      circle(c * 0.15, -c * 0.2, c * 0.09);
      circle(c * 0.15, c * 0.2, c * 0.09);
      ctx.fillStyle = INK;
      circle(c * 0.17 + ox, -c * 0.2 + oy, c * 0.045);
      circle(c * 0.17 + ox, c * 0.2 + oy, c * 0.045);
      ctx.fillStyle = mix(color, '#000000', 0.18); // the lids, drooping over the back half
      ctx.beginPath();
      ctx.arc(c * 0.15, -c * 0.2, c * 0.1, Math.PI / 2, Math.PI * 1.5);
      ctx.arc(c * 0.15, c * 0.2, c * 0.1, Math.PI / 2, Math.PI * 1.5);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = c * 0.035;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(c * 0.15, -c * 0.3); ctx.lineTo(c * 0.15, -c * 0.1);
      ctx.moveTo(c * 0.15, c * 0.1); ctx.lineTo(c * 0.15, c * 0.3);
      ctx.stroke();
      break;
    }
    case 'vulture': { // beady eyes under a scowl, and a big hooked beak that gapes at a meal
      ctx.fillStyle = '#e7d7a8'; // pale horn, outlined dark so it reads small
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = c * 0.04;
      ctx.lineJoin = 'round';
      vultureBeak();
      ctx.fill();
      ctx.save();
      vultureBeak();
      ctx.clip();
      ctx.fillStyle = '#a8a29e'; // a grey cere across the base...
      ctx.fillRect(c * 0.18, -c * 0.2, c * 0.1, c * 0.4);
      ctx.fillStyle = '#44403c'; // ...and a dark hooked tip
      ctx.beginPath();
      ctx.moveTo(c * 0.58, -c * 0.2);
      ctx.quadraticCurveTo(c * 0.62, c * 0.02, c * 0.56, c * 0.2);
      ctx.lineTo(c * 0.9, c * 0.2); ctx.lineTo(c * 0.9, -c * 0.2);
      ctx.fill();
      if (open > 0.08) { // gaping at a meal
        ctx.fillStyle = '#3b0d0d';
        ctx.beginPath();
        ctx.ellipse(c * 0.46, c * 0.03, c * 0.22 * open, c * 0.05, 0.08, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      vultureBeak();
      ctx.stroke();
      ctx.fillStyle = '#44403c'; // a nostril
      ctx.beginPath();
      ctx.ellipse(c * 0.36, -c * 0.07, c * 0.04, c * 0.018, 0.2, 0, TAU);
      ctx.fill();
      lookingEyes(0.05, 0.1, 0.24);
      if (!deadNow) { // brows slanting down to the beak
        ctx.strokeStyle = INK;
        ctx.lineWidth = c * 0.06;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-c * 0.01, -c * 0.34); ctx.lineTo(c * 0.1, -c * 0.15);
        ctx.moveTo(-c * 0.01, c * 0.34); ctx.lineTo(c * 0.1, c * 0.15);
        ctx.stroke();
      }
      break;
    }
    case 'mason': { // laurel wreath around the back of the head; eyes on the job
      // Two branches from a knot at the back, round the sides of the head, open at the front.
      ctx.strokeStyle = '#3f6212';
      ctx.lineWidth = c * 0.03;
      ctx.beginPath();
      ctx.arc(0, 0, c * 0.36, Math.PI * 0.52, Math.PI * 1.48);
      ctx.stroke();
      for (let side = -1; side <= 1; side += 2) {
        for (let k = 0; k < 4; k++) {
          const ang = Math.PI + side * (0.12 + k * 0.12) * Math.PI;
          const ex = Math.cos(ang) * c * 0.36, ey = Math.sin(ang) * c * 0.36;
          const along = ang + side * Math.PI / 2; // the way the branch grows (toward the front)
          for (let tilt = -0.6; tilt < 1; tilt += 1.2) { // a pair of leaves either side of the stem
            const dir = along + tilt;
            ctx.fillStyle = tilt < 0 ? '#65a30d' : '#4d7c0f';
            ctx.beginPath();
            ctx.ellipse(ex + Math.cos(dir) * c * 0.05, ey + Math.sin(dir) * c * 0.05, c * 0.07, c * 0.032, dir, 0, TAU);
            ctx.fill();
          }
        }
      }
      ctx.fillStyle = '#facc15'; // the knot
      circle(-c * 0.37, 0, c * 0.04);
      mouth(open);
      lookingEyes(0.055);
      break;
    }
    case 'creeper': { // narrow glinting eyes on whoever's tail it rides
      mouth(open * 0.6, 0.4);
      if (blinking) { lids(0.12); break; }
      const ox = gazeX * c * 0.05, oy = gazeY * c * 0.05;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(c * 0.15 + ox, -c * 0.2 + oy, c * 0.035, c * 0.12, 0, 0, TAU);
      ctx.ellipse(c * 0.15 + ox, c * 0.2 + oy, c * 0.035, c * 0.12, 0, 0, TAU);
      ctx.fill();
      break;
    }
    case 'metagamer': { // 3D glasses (red and cyan, card frame), eyes on whoever it's studying through them
      mouth(open);
      lookingEyes(0.05);
      lens3d(-1, 'rgba(239,68,68,0.62)'); // left eye red...
      lens3d(1, 'rgba(14,165,233,0.6)'); // ...right eye cyan
      for (let pass = 0; pass < 2; pass++) { // the card frame, outlined so it reads on a cyan head
        ctx.strokeStyle = pass ? '#f8fafc' : '#0f172a';
        ctx.lineWidth = c * (pass ? 0.05 : 0.085);
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let sg = -1; sg <= 1; sg += 2) {
          const y0 = sg < 0 ? -c * 0.33 : c * 0.07;
          if (ctx.roundRect) ctx.roundRect(c * 0.03, y0, c * 0.25, c * 0.26, c * 0.06); else ctx.rect(c * 0.03, y0, c * 0.25, c * 0.26);
          ctx.moveTo(c * 0.1, sg * c * 0.33); ctx.lineTo(-c * 0.14, sg * c * 0.36); // the arms, back over the head
        }
        ctx.moveTo(c * 0.15, -c * 0.07); ctx.lineTo(c * 0.15, c * 0.07); // the bridge
        ctx.stroke();
      }
      break;
    }
    case 'wildcard': { // Trump's hair, seen from above: a high wave at the front, combed back and over to the far side; squinty eyes, a pout
      wildHair();
      // A pout.
      if (open > 0.08) mouth(open, 0.43);
      else {
        ctx.fillStyle = '#f472b6';
        ctx.beginPath(); ctx.ellipse(c * 0.42, 0, c * 0.045, c * 0.06, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#9d174d';
        ctx.beginPath(); ctx.ellipse(c * 0.43, 0, c * 0.018, c * 0.025, 0, 0, TAU); ctx.fill();
      }
      if (blinking) { lids(0.08); break; }
      // Squinting eyes, both wandering about together.
      const ox = gazeX * c * 0.03, oy = gazeY * c * 0.035;
      ctx.fillStyle = '#fffbea';
      ctx.beginPath();
      ctx.ellipse(c * 0.2, -c * 0.06, c * 0.065, c * 0.08, 0, 0, TAU);
      ctx.ellipse(c * 0.2, c * 0.22, c * 0.065, c * 0.08, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = INK;
      circle(c * 0.21 + ox, -c * 0.06 + oy, c * 0.04);
      circle(c * 0.21 + ox, c * 0.22 + oy, c * 0.04);
      ctx.fillStyle = '#ffffff';
      circle(c * 0.2 + ox, -c * 0.075 + oy, c * 0.015);
      circle(c * 0.2 + ox, c * 0.205 + oy, c * 0.015);
      ctx.strokeStyle = INK; // the squint: heavy lids across the back of each eye
      ctx.lineWidth = c * 0.03;
      ctx.beginPath();
      ctx.moveTo(c * 0.17, -c * 0.14); ctx.quadraticCurveTo(c * 0.14, -c * 0.06, c * 0.17, c * 0.02);
      ctx.moveTo(c * 0.17, c * 0.14); ctx.quadraticCurveTo(c * 0.14, c * 0.22, c * 0.17, c * 0.3);
      ctx.stroke();
      break;
    }
    case 'copycat': { // cat ears (its head's colour: the flag's red, half its model's while it copies), cat eyes, whiskers, and a party pin
      poly(EAR, -1, a.fills[0]);
      poly(EAR, 1, a.fills[0]);
      const inner = mix(a.fills[0][0] === '#' ? a.fills[0] : '#de2910', INK, 0.3); // (a deeper red inside: pink read as the pale old Copycat)
      poly(EAR_IN, -1, inner);
      poly(EAR_IN, 1, inner);
      mouth(open * 0.7, 0.4);
      if (blinking) lids(0.1);
      else {
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.ellipse(c * 0.15, -c * 0.2, c * 0.08, c * 0.1, 0, 0, TAU);
        ctx.ellipse(c * 0.15, c * 0.2, c * 0.08, c * 0.1, 0, 0, TAU);
        ctx.fill();
        const ox = gazeX * c * 0.03, oy = gazeY * c * 0.05; // slit pupils on its model
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.ellipse(c * 0.15 + ox, -c * 0.2 + oy, c * 0.025, c * 0.08, 0, 0, TAU);
        ctx.ellipse(c * 0.15 + ox, c * 0.2 + oy, c * 0.025, c * 0.08, 0, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(15,23,42,0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let w = 0; w < 3; w++) {
        ctx.moveTo(c * 0.34, -c * 0.08); ctx.lineTo(c * 0.52, -c * WHISKERS[w]);
        ctx.moveTo(c * 0.34, c * 0.08); ctx.lineTo(c * 0.52, c * WHISKERS[w]);
      }
      ctx.stroke();
      // Party member: a little hammer and sickle on the back of the head,
      // in the flag's yellow on its red, inked round so it reads as a pin
      // (a power's gold is Honey, rounder and paler, and never on a head).
      ctx.save();
      ctx.translate(-c * 0.2, 0);
      ctx.rotate(Math.PI / 2);
      ctx.lineCap = 'butt';
      for (let pass = 0; pass < 2; pass++) {
        const w = pass ? 0 : c * 0.035;
        ctx.strokeStyle = ctx.fillStyle = pass ? PARTY_YELLOW : INK;
        ctx.lineWidth = c * 0.05 + 2 * w;
        ctx.beginPath();
        ctx.arc(0, 0, c * 0.15, -Math.PI * 0.25, Math.PI * 0.95);
        ctx.stroke();
        ctx.save();
        ctx.rotate(-Math.PI / 4);
        ctx.fillRect(-c * 0.02 - w, -c * 0.16 - w, c * 0.04 + 2 * w, c * 0.3 + 2 * w); // handle
        ctx.fillRect(-c * 0.09 - w, -c * 0.18 - w, c * 0.18 + 2 * w, c * 0.06 + 2 * w); // head
        ctx.restore();
      }
      ctx.restore();
      break;
    }
    case 'desperado': { // cowboy hat tipped back, eyes peeking out in front
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(-c * 0.24, 0, c * 0.3, c * 0.56, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#a16207';
      ctx.beginPath();
      ctx.ellipse(-c * 0.26, 0, c * 0.16, c * 0.26, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#3f1d0a';
      ctx.fillRect(-c * 0.13, -c * 0.27, c * 0.05, c * 0.54); // hat band
      mouth(open, 0.43);
      lookingEyes(0.06, 0.2, 0.2);
      break;
    }
    case 'ouroboros': { // a real snake's head: a wedge, scaled, slit-pupilled amber eyes, nostrils
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(58,36,8,0.8)';
      ctx.lineWidth = c * 0.04;
      ctx.beginPath(); // (wider at the jaw, a rounded snout)
      ctx.moveTo(-c * 0.3, -c * 0.44);
      ctx.quadraticCurveTo(c * 0.2, -c * 0.4, c * 0.46, -c * 0.12);
      ctx.quadraticCurveTo(c * 0.54, 0, c * 0.46, c * 0.12);
      ctx.quadraticCurveTo(c * 0.2, c * 0.4, -c * 0.3, c * 0.44);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(58,36,8,0.75)'; // a diamond on its crown
      ctx.beginPath(); ctx.moveTo(-c * 0.22, 0); ctx.lineTo(-c * 0.06, -c * 0.12); ctx.lineTo(c * 0.1, 0); ctx.lineTo(-c * 0.06, c * 0.12); ctx.closePath(); ctx.fill();
      if (open > 0.08) mouth(open, 0.46);
      ctx.fillStyle = INK; // nostrils
      circle(c * 0.42, -c * 0.06, c * 0.022); circle(c * 0.42, c * 0.06, c * 0.022);
      if (blinking || deadNow) { lids(0.1, 0.14, 0.22); break; }
      for (const sg of SIDES2) { // amber eyes, a black slit each, turned to what it's watching
        ctx.fillStyle = '#facc15';
        circle(c * 0.14, sg * c * 0.22, c * 0.1);
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.ellipse(c * 0.14 + gazeX * c * 0.035, sg * c * 0.22 + gazeY * c * 0.035, c * 0.025, c * 0.085, 0, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'mute': { // a mime: white greasepaint, a black beret, high arched brows, a painted tear, small dark lips
      // The beret: a small disc worn at an angle on the crown, its rim lit
      // and its stalk in the middle (at the back of the head it read as a hole).
      ctx.fillStyle = '#18181b';
      ctx.beginPath(); ctx.ellipse(-c * 0.25, -c * 0.14, c * 0.18, c * 0.22, 0.65, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3f3f46'; // (a sheen across the felt)
      ctx.beginPath(); ctx.ellipse(-c * 0.29, -c * 0.2, c * 0.09, c * 0.12, 0.65, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = c * 0.035;
      ctx.beginPath(); ctx.ellipse(-c * 0.25, -c * 0.14, c * 0.16, c * 0.2, 0.65, Math.PI * 0.9, Math.PI * 1.65); ctx.stroke();
      ctx.fillStyle = '#18181b';
      circle(-c * 0.27, -c * 0.16, c * 0.04);
      const mood = muteState.get(s)?.key || 'calm', brow = MUTE_BROWS[mood];
      if (!open || open < 0.08) { // the lips: a small dark bow (a big lopsided smirk when proud, an O when scared)
        ctx.fillStyle = ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = c * 0.05;
        ctx.lineCap = 'round';
        if (mood === 'proud') { ctx.beginPath(); ctx.arc(c * 0.24, c * 0.04, c * 0.17, -0.95, 0.45); ctx.stroke(); }
        else if (mood === 'scared') { ctx.fillStyle = '#18181b'; circle(c * 0.39, 0, c * 0.07); ctx.stroke(); }
        else { ctx.beginPath(); ctx.ellipse(c * 0.4, 0, c * 0.035, c * 0.08, 0, 0, TAU); ctx.fill(); }
      } else mouth(open);
      ctx.fillStyle = rgba(color, 0.5); // (cheeks blushing its mood)
      circle(c * 0.24, -c * 0.26, c * 0.07); circle(c * 0.24, c * 0.26, c * 0.07);
      if (mood === 'scared') { // (wide O eyes, ringed in ink: on greasepaint the whites don't show)
        lookingEyes(0.035, 0.15, 0.2, 3.2);
        if (!blinkNow) {
          ctx.strokeStyle = INK;
          ctx.lineWidth = c * 0.03;
          ctx.beginPath(); ctx.arc(c * 0.15, -c * 0.2, c * 0.112, 0, TAU); ctx.moveTo(c * 0.262, c * 0.2); ctx.arc(c * 0.15, c * 0.2, c * 0.112, 0, TAU); ctx.stroke();
        }
      } else lookingEyes(0.055);
      if (!blinking) { // brows, bold enough to read at play size: arched high when calm, knitted when it's hunting, raised in the middle when scared...
        ctx.strokeStyle = INK;
        ctx.lineWidth = c * 0.07;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (const sg of SIDES2) { ctx.moveTo(c * brow[0], sg * c * 0.34); ctx.quadraticCurveTo(c * brow[1], sg * c * 0.2, c * brow[2], sg * c * 0.07); }
        ctx.stroke();
      } // ...and a tear under one eye

      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.moveTo(c * 0.27, c * 0.2); ctx.quadraticCurveTo(c * 0.33, c * 0.24, c * 0.3, c * 0.27); ctx.quadraticCurveTo(c * 0.27, c * 0.24, c * 0.27, c * 0.2); ctx.fill();
      break;
    }
    case 'joker': // jester hat with bells, harlequin diamonds round its eyes, a clown's red grin and nose, eyes on its mark
      poly(JESTER, -1, '#a21caf');
      poly(JESTER, 1, '#f59e0b');
      ctx.fillStyle = '#facc15';
      circle(-c * 0.55, -c * 0.62, c * 0.08);
      circle(-c * 0.55, c * 0.62, c * 0.08);
      ctx.strokeStyle = '#dc2626'; // the grin, wider when it's about to bite
      ctx.lineWidth = c * (0.05 + 0.03 * open);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(c * 0.24, 0, c * 0.22, -0.85, 0.85);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      circle(c * 0.33, 0, c * 0.09);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      circle(c * 0.3, -c * 0.03, c * 0.025);
      poly(HARLEQUIN, -1, '#a21caf'); // a diamond painted round each eye
      poly(HARLEQUIN, 1, '#f59e0b');
      lookingEyes(0.055);
      break;
    case 'capricious': { // (until its first mood) can't make its mind up: one eye big, one small, a brow cocked
      mouth(open);
      if (blinking) { lids(0.09); break; }
      oddEye(-0.21, 0.12, 0.07);
      oddEye(0.21, 0.075, 0.045);
      ctx.strokeStyle = INK;
      ctx.lineWidth = c * 0.045;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(c * 0.03, c * 0.11);
      ctx.quadraticCurveTo(-c * 0.09, c * 0.2, c * 0.02, c * 0.31);
      ctx.stroke();
      break;
    }
    case 'star': { // a star's face (the star itself and its huge white walrus mustache: see drawStarHead): tall oval eyes, bushy white brows
      mouth(open, 0.36); // (under the mustache)
      // Tall oval eyes, glancing at what it's after, a catchlight in each.
      if (blinking) lids(0.08, -0.01, 0.105);
      else {
        const ox = gazeX * c * 0.035, oy = gazeY * c * 0.03;
        ctx.fillStyle = INK;
        for (const sg of SIDES2) { ctx.beginPath(); ctx.ellipse(-c * 0.02 + ox, sg * c * 0.105 + oy, c * 0.135, c * 0.072, 0, 0, TAU); ctx.fill(); }
        catchlights(-c * 0.05 + ox, c * 0.105, oy, c * 0.1);
      }
      if (!a.star) blitAbout(stacheSprite(stacheStep(s, a, lastNow)), 0, 0, 0, 0, a.rad[0] / STAR_R / 1.1, a.rad[0] / STAR_R / 1.1, 0); // (Capricious doing Star: the mustache, on its own round head)
      // Bushy white brows, a puffy tuft over each eye: knitted (grumpy) as
      // it flashes, raised again through the first part of its rest (see
      // drawStarHead). (Each puff a circle of its own: the GPU's quickest shape.)
      if (!deadNow) {
        const up = a.brow, inner = -0.12 - 0.09 * up, outer = -0.25 + 0.06 * up;
        for (let pass = 0; pass < 2; pass++) {
          ctx.fillStyle = pass ? '#fffdf6' : INK;
          for (const sg of SIDES2) for (let j = 0; j < 3; j++) {
            const u = j / 2;
            circle(c * (inner + (outer - inner) * u - 0.04 * Math.sin(u * Math.PI)), sg * c * (0.07 + 0.15 * u), c * (0.062 - 0.012 * u) + (pass ? 0 : c * 0.028));
          }
        }
      }
      break;
    }
    default:
      mouth(open);
      lookingEyes(0.06);
  }
  blinkNow = false;
}
// (Shapes for the faces, here rather than made afresh every frame.)
// Vulture's beak, as the current path.
function vultureBeak() {
  const c = CELL;
  ctx.beginPath();
  ctx.moveTo(c * 0.2, -c * 0.17);
  ctx.quadraticCurveTo(c * 0.56, -c * 0.17, c * 0.8, c * 0.04); // over the top to the hook
  ctx.quadraticCurveTo(c * 0.62, c * 0.14, c * 0.2, c * 0.17);
  ctx.closePath();
}
// One lens of Metagamer's 3D glasses (sg: -1 left, 1 right), filled with its tint.
function lens3d(sg, tint) {
  const c = CELL;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(c * 0.03, sg < 0 ? -c * 0.33 : c * 0.07, c * 0.25, c * 0.26, c * 0.06);
  else ctx.rect(c * 0.03, sg < 0 ? -c * 0.33 : c * 0.07, c * 0.25, c * 0.26);
  ctx.fillStyle = tint;
  ctx.fill();
}
// Wildcard's hair (Trump's), seen from above: the head points +x, and -y is
// the far side. One smooth, lacquered mass, combed and sprayed into place:
// parted on the near side, the top combed from the parting across the crown
// and swept back over the far side, so that side reads fuller; at the front
// one big wave behind the brow, rolled up and over to the far side (clear of
// the eyes). A few broad comb grooves follow the sweep, one long near-white
// gloss runs along the wave's crest and on round the sweep, and no outline:
// its soft shadow on the head sets it off. (Three versions, D, E and F, for
// Haakon to pick from: how big the wave is, how far the sweep overhangs.)
const WILD_HAIRS = { D: { wave: 0, side: 0, grooves: 3 }, E: { wave: 0.05, side: 0.06, grooves: 4 }, F: { wave: 0.1, side: 0.12, grooves: 4 } };
let wildHairPick = 'E';
function wildHairEdge(v) {
  const c = CELL, b = (x1, y1, x2, y2, x, y) => ctx.bezierCurveTo(c * x1, c * y1, c * x2, c * y2, c * x, c * y);
  const w = v.wave, s = v.side;
  ctx.beginPath();
  ctx.moveTo(-c * 0.04, c * 0.3); // the parting's front end
  b(0.08, 0.26, 0.12 + w, 0.02, 0.1 + w * 0.8, -0.2); // the wave, standing up behind the brow
  b(0.08 + w, -0.44 - s, 0.04, -0.66 - s, -0.08, -0.68 - s); // rolled over to the far side, overhanging it
  b(-0.18, -0.7 - s, -0.22, -0.7 - s, -0.3, -0.72 - s); // (where the curl meets the sweep)
  b(-0.5, -0.84 - s, -0.76, -0.74 - s, -0.86, -0.5 - s * 0.5); // swept back along the far side, fuller
  b(-0.96, -0.26, -0.92, 0.1, -0.74, 0.26); // round the back
  b(-0.56, 0.46, -0.26, 0.44, -0.04, 0.3); // the near side, short below the parting
  ctx.closePath();
}
// One comb groove (or its lit ridge), from the parting across the crown and
// swept back over the far side, all of them gathering towards the back of it:
// t from 0 (the front, after the wave) to 1.
function wildGroove(v, t, shift) {
  const c = CELL, x0 = -0.04 - t * 0.5 + shift;
  ctx.moveTo(c * x0, c * 0.32);
  ctx.bezierCurveTo(c * (x0 + 0.1 - 0.06 * t), c * 0.0, c * (-0.08 - 0.3 * t + shift), -c * (0.5 + v.side), c * (-0.62 - 0.1 * t + shift), -c * (0.66 + v.side * 0.7 - 0.12 * t));
}
function wildHair() {
  const c = CELL, v = WILD_HAIRS[wildHairPick];
  ctx.save();
  ctx.translate(-c * 0.07, 0); // (set back, so most of the face shows)
  ctx.save(); // its soft shadow on the head, darker gold, falling on the brow in front of the wave
  ctx.fillStyle = 'rgba(146,84,14,0.16)';
  ctx.translate(c * 0.07, c * 0.03); wildHairEdge(v); ctx.fill();
  ctx.translate(-c * 0.03, -c * 0.01); wildHairEdge(v); ctx.fill();
  ctx.restore();
  ctx.save();
  wildHairEdge(v);
  const gold = ctx.createLinearGradient(c * 0.1, c * 0.4, -c * 0.6, -c * 0.8); // lit at the parting, deeper where it overhangs
  gold.addColorStop(0, '#fde58a'); gold.addColorStop(0.45, '#f7c948'); gold.addColorStop(1, '#e09a2a');
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.clip();
  ctx.lineCap = 'round';
  // The comb grooves: a warm orange-gold shadow, and beside it the lit ridge.
  const n = v.grooves, grooves = (shift, width, colour) => {
    ctx.strokeStyle = colour; ctx.lineWidth = c * width;
    ctx.beginPath();
    for (let i = 0; i < n; i++) wildGroove(v, (i + 0.7) / n, shift);
    ctx.stroke();
  };
  grooves(0, 0.045, 'rgba(194,110,18,0.4)');
  grooves(0.035, 0.025, 'rgba(255,244,190,0.55)');
  // The wave: the hollow behind its crest, then the gloss along the crest and
  // on round the sweep, a soft broad sheen with a bright line down it.
  ctx.lineWidth = c * 0.07;
  ctx.strokeStyle = 'rgba(194,110,18,0.45)';
  ctx.beginPath(); wildGroove(v, 0, -0.06); ctx.stroke();
  const gloss = () => { ctx.beginPath(); wildGroove(v, 0, 0.02); };
  ctx.lineWidth = c * 0.13; ctx.strokeStyle = 'rgba(255,250,225,0.35)'; gloss(); ctx.stroke();
  ctx.lineWidth = c * 0.04; ctx.strokeStyle = 'rgba(255,253,244,0.95)'; gloss(); ctx.stroke();
  // The parting.
  ctx.strokeStyle = 'rgba(180,98,20,0.6)';
  ctx.lineWidth = c * 0.025;
  ctx.beginPath(); ctx.moveTo(-c * 0.06, c * 0.31); ctx.quadraticCurveTo(-c * 0.3, c * 0.3, -c * 0.6, c * 0.36); ctx.stroke();
  ctx.restore();
  ctx.restore();
}
// One of undecided Capricious's eyes (at y: the white's radius w, the pupil's r), turned to what it's watching.
function oddEye(y, w, r) {
  const c = CELL, reach = (w - r) * 0.85, ox = gazeX * c * reach, oy = gazeY * c * reach;
  ctx.fillStyle = '#fffbea';
  circle(c * 0.15, c * y, c * w);
  ctx.fillStyle = INK;
  circle(c * 0.15 + ox, c * y + oy, c * r);
  catchlight(c * 0.15 + ox, c * y + oy, c * r);
}
