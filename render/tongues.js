// The renderer (see render/core.js): the tongues, one for each look.

// ------------------------------------------------------- tongues
// Every few seconds each snake flicks its tongue out and back. You and your
// friends have the real, forked thing; each rival flicks out something that
// fits it instead, drawn in the head's frame from the mouth (x = 0.42).
// Per look: [how often (1 = like you), how long it stays out (1 = like
// yours), what comes out]. Capricious flicks its mood's; Copycat its model's.
const FLICKS = {
  player: [1, 1, forked], capricious: [1.2, 1, forked],
  creeper: [0.8, 1.5, slither], drab: [1.8, 1.6, limp], gobbler: [0.6, 1.4, lick], ghost: [1.8, 1.8, wisp],
  sniper: [1.2, 1.5, laser], sovereign: [1.6, 2.4, carpet], colonist: [1.4, 2.2, telescope], vulture: [1.6, 3, bone],
  mason: [1.4, 2.4, papyrus], metagamer: [1.4, 2, keyboard], wildcard: [1.2, 2, bill], desperado: [1.1, 2, revolver],
  joker: [1, 2.4, blower], copycat: [1.2, 1.4, blep], mute: [1.1, 2, innerJaw], ouroboros: [1.6, 1.6, fangs],
  star: [0.9, 1.8, fakeStache], // (Star's own is its mustache, twirling: see stacheSprite; this is Copycat's copy of it)
};
let flickP = -1, flickT = 0; // the flick being drawn: how far through it is (or -1), and how far out (0..1..0)

// Time this snake's flick (more often near food, if `keen`) and draw it,
// unless `draw` is false (Sniper's comes out of its scope instead).
function tongue(a, now, open, look, keen = false, draw = true) {
  const [rate, len, fn] = FLICKS[look] || FLICKS.player;
  flickP = -1; flickT = 0;
  if (deadNow) return;
  if (now > a.nextTongue) {
    a.tongueMs = T.TONGUE_MS * len;
    a.tongueUntil = now + a.tongueMs;
    a.nextTongue = now + T.TONGUE_EVERY * rate * (keen && a.near <= 3 ? 0.4 : 0.7 + Math.random() * 0.8);
  }
  if (now >= a.tongueUntil || open >= 0.08) return;
  flickP = Math.min(1, Math.max(0, 1 - (a.tongueUntil - now) / a.tongueMs)); // (kept in 0..1, whatever the clock does)
  flickT = 1 - Math.abs(flickP * 2 - 1); // out and back
  if (!draw) return;
  ctx.save();
  fn(flickT, flickP);
  ctx.restore();
}

// Out all the way for the middle of the flick, not just at its peak.
const stayOut = (t, k = 1.6) => Math.min(1, t * k);
// Only what's past the lips shows (for things that slide out of the mouth).
function fromMouth() {
  ctx.beginPath();
  ctx.rect(CELL * 0.38, -CELL, CELL * 2, CELL * 2);
  ctx.clip();
}

// The look Copycat's tongue copies: its model's, or a cat's own blep.
function copiedLook(s) {
  const m = findById(s.memory.modelId);
  const look = m && m.alive ? lookOf(m) : 'copycat';
  return FLICKS[look] ? look : 'copycat';
}

// A snake's own: thin, red and forked.
function forked(t) {
  const c = CELL, reach = c * (0.42 + 0.3 * t);
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = c * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(c * 0.42, 0); ctx.lineTo(reach, 0);
  ctx.moveTo(reach, 0); ctx.lineTo(reach + c * 0.1, -c * 0.07);
  ctx.moveTo(reach, 0); ctx.lineTo(reach + c * 0.1, c * 0.07);
  ctx.stroke();
}

// Creeper: the snakiest tongue of all, long and wriggling.
function slither(t, p) {
  const c = CELL, len = 0.55 * t;
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = c * 0.05;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(c * 0.42, 0);
  let x = 0.42, y = 0;
  for (let i = 1; i <= 10; i++) {
    x = 0.42 + len * i / 10;
    y = Math.sin(i * 0.9 - p * 30) * 0.06 * i / 10;
    ctx.lineTo(c * x, c * y);
  }
  ctx.lineTo(c * (x + 0.1), c * (y - 0.07));
  ctx.moveTo(c * x, c * y); ctx.lineTo(c * (x + 0.1), c * (y + 0.07));
  ctx.stroke();
}

// Drab: can't be bothered. A short, limp tongue, no fork, flopping to one side.
function limp(t) {
  const c = CELL, r = 0.2 * t;
  ctx.strokeStyle = '#d9a3a8';
  ctx.lineWidth = c * 0.075;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(c * 0.42, 0);
  ctx.quadraticCurveTo(c * (0.42 + r), 0, c * (0.42 + r * 1.1), c * r * 0.7);
  ctx.stroke();
}

// Gobbler: a fat pink tongue that licks its lips, side to side.
function lick(t, p) {
  const c = CELL, len = 0.2 * stayOut(t, 2);
  ctx.translate(c * 0.38, 0);
  ctx.rotate(Math.sin(p * TAU) * 0.7);
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.ellipse(c * len * 0.6, 0, c * (0.06 + len * 0.6), c * 0.11, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e11d48'; // the groove down the middle
  ctx.lineWidth = c * 0.025;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(c * 0.05, 0); ctx.lineTo(c * len, 0);
  ctx.stroke();
}

// Ghost: a breath of ectoplasm that wafts out and fades back in.
function wisp(t, p) {
  const c = CELL;
  ctx.globalAlpha *= 0.85 * stayOut(t, 2);
  ctx.fillStyle = '#f0f9ff';
  for (let k = 0; k < 3; k++) {
    const x = 0.48 + (0.15 + 0.16 * k) * t, y = Math.sin(p * 9 + k * 1.7) * 0.07;
    circle(c * x, c * y, c * (0.1 - 0.022 * k));
  }
}

// Sniper: the laser sight, a beam and a dot (from the scope, x0 = its lens).
function laser(t, p, x0 = 0.42) {
  const c = CELL, end = c * (x0 + 1.3 * stayOut(t, 4));
  ctx.strokeStyle = 'rgba(239,68,68,0.75)';
  ctx.lineWidth = c * 0.025;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(c * x0, 0); ctx.lineTo(end, 0);
  ctx.stroke();
  ctx.fillStyle = 'rgba(239,68,68,0.35)';
  circle(end, 0, c * 0.09);
  ctx.fillStyle = '#ef4444';
  circle(end, 0, c * 0.045);
  ctx.fillStyle = '#fee2e2';
  circle(end, 0, c * 0.018);
}

// Sovereign rolls out the red carpet (for itself): gold-edged, with the roll
// still to unroll at the far end.
function carpet(t) {
  const c = CELL, e = stayOut(t), x0 = 0.4, len = 0.6 * e, x1 = x0 + len, rr = 0.045 + 0.04 * (1 - e);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(c * x0, -c * 0.12, c * len, c * 0.24);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(c * x0, -c * 0.12, c * len, c * 0.03);
  ctx.fillRect(c * x0, c * 0.09, c * len, c * 0.03);
  ctx.fillStyle = '#dc2626'; // the roll
  ctx.fillRect(c * (x1 - rr), -c * 0.13, c * rr * 2, c * 0.26);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(c * (x1 - rr), -c * 0.13, c * rr * 2, c * 0.03);
  ctx.fillRect(c * (x1 - rr), c * 0.1, c * rr * 2, c * 0.03);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(c * (x1 + rr * 0.2), -c * 0.13, c * rr * 0.8, c * 0.26);
}

// Colonist: a brass spyglass that draws out, section by section, to look
// for land to claim.
function telescope(t) {
  const c = CELL, e = stayOut(t), x = 0.38 - 0.24 * (1 - e);
  fromMouth();
  ctx.fillStyle = '#bae6fd'; // the lens
  ctx.fillRect(c * (x + 0.38 * e + 0.17), -c * 0.06, c * 0.035, c * 0.12);
  spyglassTube(x + 0.38 * e, 0.19, 0.075); // the thinnest slides furthest...
  spyglassTube(x + 0.2 * e, 0.2, 0.095);
  spyglassTube(x, 0.22, 0.12); // ...out of the widest
}
function spyglassTube(x0, len, w) {
  const c = CELL;
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(c * x0, -c * w, c * len, c * w * 2);
  ctx.fillStyle = '#fde68a'; // a shine along the top
  ctx.fillRect(c * x0, -c * w, c * len, c * w * 0.6);
  ctx.fillStyle = '#78350f'; // a ring at the front
  ctx.fillRect(c * (x0 + len - 0.03), -c * w, c * 0.03, c * w * 2);
}

// Vulture: a bone, held crosswise and chewed on a moment.
function bone(t, p) {
  const c = CELL, k = stayOut(t, 3);
  ctx.translate(c * 0.64, 0);
  ctx.rotate(0.3 + Math.sin(p * 14) * 0.08);
  ctx.scale(k, k);
  ctx.strokeStyle = '#57534e'; // an outline round the whole bone...
  ctx.lineWidth = c * 0.05;
  boneShape();
  ctx.stroke();
  ctx.fillStyle = '#f5f5f4'; // ...then the bone over it
  boneShape();
  ctx.fill();
}
function boneShape() {
  const c = CELL;
  ctx.beginPath();
  ctx.rect(-c * 0.045, -c * 0.25, c * 0.09, c * 0.5);
  for (let y = -0.26; y < 0.3; y += 0.52) for (let x = -0.05; x < 0.1; x += 0.1) { // (two knobs at each end)
    ctx.moveTo(c * (x + 0.06), c * y);
    ctx.arc(c * x, c * y, c * 0.06, 0, TAU);
  }
}

// Mason: a papyrus scroll, unrolled from the mouth: lines of writing (Latin,
// naturally), a wooden rod at each end, and what's still rolled up at the far end.
function papyrus(t) {
  const c = CELL, e = stayOut(t), x0 = 0.4, len = 0.56 * e, x1 = x0 + len, w = 0.17, rr = 0.035 + 0.045 * (1 - e);
  ctx.fillStyle = '#ecdcae'; // the sheet...
  ctx.fillRect(c * x0, -c * w, c * len, c * w * 2);
  ctx.fillStyle = 'rgba(146,110,52,0.35)'; // ...browner along its edges
  ctx.fillRect(c * x0, -c * w, c * len, c * 0.025);
  ctx.fillRect(c * x0, c * (w - 0.025), c * len, c * 0.025);
  ctx.strokeStyle = 'rgba(58,38,20,0.6)'; // the writing
  ctx.lineWidth = c * 0.02;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0, x = x0 + 0.07; x < x1 - rr - 0.03; i++, x += 0.065) {
    ctx.moveTo(c * x, -c * (w - 0.05));
    ctx.lineTo(c * x, c * (w - 0.05 - (i % 3) * 0.05));
  }
  ctx.stroke();
  scrollEnd(x0, 0.035, w);
  scrollEnd(x1, rr, w);
}
// A rolled end of the scroll (w: half the sheet's width): the roll, its rod's knobs either side.
function scrollEnd(x, rad, w) {
  const c = CELL;
  ctx.fillStyle = '#d9c38c';
  ctx.fillRect(c * (x - rad), -c * (w + 0.015), c * rad * 2, c * (w + 0.015) * 2);
  ctx.fillStyle = 'rgba(58,38,20,0.25)';
  ctx.fillRect(c * (x + rad * 0.3), -c * (w + 0.015), c * rad * 0.7, c * (w + 0.015) * 2);
  ctx.fillStyle = '#7c2d12';
  circle(c * x, -c * (w + 0.05), c * 0.04);
  circle(c * x, c * (w + 0.05), c * 0.04);
}

// Metagamer: a keyboard, slid out to type up its notes on you (a key or two
// lighting up as it types).
function keyboard(t, p) {
  const c = CELL;
  fromMouth();
  ctx.translate(-c * 0.62 * (1 - stayOut(t)), 0);
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = c * 0.025;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(c * 0.38, -c * 0.19, c * 0.6, c * 0.38, c * 0.05); else ctx.rect(c * 0.38, -c * 0.19, c * 0.6, c * 0.38);
  ctx.fill();
  ctx.stroke();
  const typing = Math.floor(p * 24); // which keys are down right now
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      if (row === 2 && col > 1 && col < 5) continue; // (the space bar's there)
      const lit = (col * 7 + row * 3 + typing * 5) % 11 === 0;
      ctx.fillStyle = lit ? '#22d3ee' : '#e2e8f0';
      ctx.fillRect(c * (0.42 + col * 0.077), c * (-0.15 + row * 0.105), c * 0.06, c * 0.08);
    }
  }
  ctx.fillStyle = typing % 4 === 1 ? '#22d3ee' : '#e2e8f0';
  ctx.fillRect(c * (0.42 + 2 * 0.077), c * (-0.15 + 2 * 0.105), c * (3 * 0.077 - 0.017), c * 0.08);
}

// Wildcard: a dollar bill, slid out like a tip.
const BILL_FONT = `800 ${CELL * 0.2}px sans-serif`;
function bill(t, p) {
  const c = CELL;
  fromMouth();
  ctx.translate(-c * 0.52 * (1 - stayOut(t)), 0);
  ctx.rotate(Math.sin(p * 18) * 0.04); // a little flutter
  ctx.fillStyle = '#c7e3b8';
  ctx.strokeStyle = '#3f6212';
  ctx.lineWidth = c * 0.025;
  ctx.fillRect(c * 0.36, -c * 0.12, c * 0.52, c * 0.24);
  ctx.strokeRect(c * 0.36, -c * 0.12, c * 0.52, c * 0.24);
  ctx.strokeStyle = '#65a30d'; // the inner border...
  ctx.lineWidth = c * 0.012;
  ctx.strokeRect(c * 0.4, -c * 0.085, c * 0.44, c * 0.17);
  ctx.fillStyle = '#3f6212'; // ...and the dollar sign in the middle
  ctx.font = BILL_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', c * 0.62, c * 0.01);
}

// Desperado: the six-shooter. Out, bang (a flash and a puff of smoke), back.
function revolver(t, p) {
  const c = CELL;
  ctx.save();
  fromMouth();
  ctx.translate(-c * 0.55 * (1 - stayOut(t)), 0);
  ctx.fillStyle = '#d6d3d1'; // the barrel, silver and outlined...
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = c * 0.025;
  ctx.fillRect(c * 0.5, -c * 0.055, c * 0.4, c * 0.11);
  ctx.strokeRect(c * 0.5, -c * 0.055, c * 0.4, c * 0.11);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(c * 0.52, -c * 0.035, c * 0.36, c * 0.025);
  ctx.fillStyle = '#292524'; // ...its front sight...
  ctx.fillRect(c * 0.84, -c * 0.02, c * 0.04, c * 0.04);
  ctx.fillStyle = '#a8a29e'; // ...and the cylinder, six chambers
  circle(c * 0.47, 0, c * 0.13);
  ctx.stroke();
  ctx.fillStyle = '#292524';
  for (let i = 0; i < 6; i++) circle(c * (0.47 + Math.cos(i * TAU / 6) * 0.075), c * Math.sin(i * TAU / 6) * 0.075, c * 0.025);
  ctx.restore();
  if (p > 0.4 && p < 0.52) { // bang
    ctx.fillStyle = '#fde047';
    circle(c * 0.98, 0, c * 0.1);
    ctx.fillStyle = '#ffffff';
    circle(c * 0.98, 0, c * 0.05);
  }
  const sp = (p - 0.45) / 0.55;
  if (sp > 0) { // the smoke drifting off
    ctx.globalAlpha *= 0.85 * (1 - sp);
    ctx.fillStyle = '#f5f5f4';
    for (let k = 0; k < 3; k++) circle(c * (0.98 + 0.14 * sp + 0.08 * k), c * (k - 1) * 0.06 * (1 + sp), c * (0.06 + 0.05 * sp) * (1 - k * 0.15));
  }
}

// Joker: a party horn (a blowout). A mouthpiece, then a flat paper tube,
// striped, that unrolls from its curl with a toot: at full stretch its
// fringed tip flutters and a puff of confetti flies off it; then it rolls
// back up. Outlined, so it reads at phone size.
const HORN = ['#ec4899', '#facc15', '#8b5cf6', '#facc15'], CURL = new Float64Array(64); // (CURL: its spiral's points, x, y, ...)
function blower(t, p) {
  const c = CELL, e = stayOut(t, 1.4), k = Math.min(1, t * 5);
  ctx.translate(c * 0.4, 0); // (pops out of the mouth)
  ctx.scale(k, k);
  ctx.translate(-c * 0.4, 0);
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#f8fafc'; // the mouthpiece
  ctx.strokeStyle = INK;
  ctx.lineWidth = c * 0.025;
  ctx.beginPath(); ctx.rect(c * 0.36, -c * 0.05, c * 0.15, c * 0.1); ctx.fill(); ctx.stroke();
  // The tube, as far as it's unrolled...
  const w = c * 0.17, x0 = c * 0.5, len = c * 0.95 * e, n = Math.max(1, Math.round(len / (c * 0.1)));
  if (len > 0.5) {
    ctx.fillStyle = INK;
    ctx.fillRect(x0, -w / 2 - c * 0.02, len, w + c * 0.04);
    for (let i = 0; i < n; i++) { ctx.fillStyle = HORN[i % 4]; ctx.fillRect(x0 + len * i / n, -w / 2, len / n + 0.4, w); }
  }
  const x1 = x0 + len, curl = 1 - e;
  if (curl > 0.04) { // ...and the rest still rolled up at its end: a spiral, curling up and back
    const R = c * (0.05 + 0.12 * curl), turns = 0.8 + 1.6 * curl, steps = Math.ceil(turns * 10), pts = CURL;
    pts[0] = x1; pts[1] = 0;
    for (let i = 1; i <= steps; i++) {
      const a = i / steps * turns * TAU, rr = R * (1 - 0.6 * i / steps);
      pts[2 * i] = x1 + Math.sin(a) * rr; pts[2 * i + 1] = -R + Math.cos(a) * rr;
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = w * 0.8 + c * 0.04;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 1; i <= steps; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
    ctx.stroke();
    ctx.lineWidth = w * 0.8;
    for (let i = 1; i <= steps; i++) {
      ctx.strokeStyle = HORN[(n + i) % 4];
      ctx.beginPath(); ctx.moveTo(pts[2 * i - 2], pts[2 * i - 1]); ctx.lineTo(pts[2 * i], pts[2 * i + 1]); ctx.stroke();
    }
  } else { // full stretch: a fringe fluttering at the tip, and a toot of confetti
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = c * 0.03;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {
      const a = -0.5 + j * 0.33 + Math.sin(p * 40 + j * 1.7) * 0.18, y0 = (j - 1.5) * w / 4;
      ctx.moveTo(x1, y0); ctx.lineTo(x1 + Math.cos(a) * c * 0.17, y0 + Math.sin(a) * c * 0.17);
    }
    ctx.stroke();
    const q = Math.max(0, Math.min(1, (p - 0.3) / 0.4));
    if (q > 0 && q < 1) {
      ctx.globalAlpha *= 1 - q;
      for (let j = 0; j < 5; j++) {
        ctx.fillStyle = HORN[j % 4];
        ctx.fillRect(x1 + c * (0.12 + 0.35 * q + 0.04 * j), Math.sin(j * 2.3) * c * 0.22 * q - c * 0.025, c * 0.05, c * 0.05);
      }
    }
  }
}

// Mute: its painted lips part, and a second, inner jaw shoots out on its
// stalk (glossy, dark, with little silver teeth, snapping), then back in.
// A mime with a secret. It still never says a word.
function innerJaw(t, p) {
  const c = CELL, e = stayOut(t, 2.2), x = c * (0.44 + 0.34 * e);
  ctx.translate(c * 0.4, 0); // (drawn big, from the mouth, so it reads at play size)
  ctx.scale(1.6, 1.6);
  ctx.translate(-c * 0.4, 0);
  ctx.fillStyle = '#1c1917'; // the lips parted wide...
  ctx.beginPath(); ctx.ellipse(c * 0.4, 0, c * 0.06, c * 0.11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f1f5f9'; // ...teeth showing
  for (const sg of SIDES2) for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(c * (0.4 + i * 0.03), sg * c * 0.1); ctx.lineTo(c * (0.415 + i * 0.03), sg * c * 0.05); ctx.lineTo(c * (0.43 + i * 0.03), sg * c * 0.1); ctx.fill();
  }
  if (e < 0.05) return;
  const mid = (c * 0.42 + x) / 2;
  ctx.fillStyle = '#334155'; // the stalk: tapering, ribbed, glossy
  ctx.beginPath();
  ctx.moveTo(c * 0.42, -c * 0.065); ctx.quadraticCurveTo(mid, -c * 0.035, x - c * 0.08, -c * 0.045);
  ctx.lineTo(x - c * 0.08, c * 0.045); ctx.quadraticCurveTo(mid, c * 0.035, c * 0.42, c * 0.065);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let rx = c * 0.47; rx < x - c * 0.1; rx += c * 0.05) { ctx.moveTo(rx, -c * 0.04); ctx.lineTo(rx, c * 0.04); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = c * 0.015;
  ctx.beginPath(); ctx.moveTo(c * 0.44, -c * 0.035); ctx.lineTo(x - c * 0.1, -c * 0.028); ctx.stroke();
  const bite = 0.5 + 0.5 * Math.sin(p * TAU * 4); // (snapping)
  ctx.fillStyle = '#1e293b'; // the inner head: a glossy dome...
  ctx.beginPath(); ctx.ellipse(x, 0, c * 0.13, c * 0.09, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.ellipse(x - c * 0.03, -c * 0.045, c * 0.06, c * 0.02, -0.15, 0, TAU); ctx.fill();
  const mx = x + c * 0.1, gap = c * (0.015 + 0.035 * bite); // ...its jaws open at the front...
  ctx.fillStyle = '#0b0f19';
  ctx.beginPath(); ctx.ellipse(mx, 0, c * 0.05, gap + c * 0.012, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e2e8f0'; // ...two rows of little silver teeth
  for (const sg of SIDES2) {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const tx = mx - c * 0.045 + i * c * 0.026, ty = sg * (gap + c * 0.01);
      ctx.moveTo(tx, ty); ctx.lineTo(tx + c * 0.013, ty - sg * c * 0.032); ctx.lineTo(tx + c * 0.026, ty);
    }
    ctx.fill();
  }
}

// Ouroboros: no forked tongue (only people have that): it bares its fangs.
function fangs(t) {
  const c = CELL, e = stayOut(t, 2), x0 = c * 0.55; // (from the tip of its snout, past the wedge of its head)
  ctx.fillStyle = '#1c1917'; // the jaw, dropping open
  ctx.beginPath(); ctx.ellipse(x0, 0, c * 0.06, c * (0.04 + 0.1 * e), 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = 'rgba(58,36,8,0.85)';
  ctx.lineWidth = c * 0.02;
  for (const sg of SIDES2) { // two long fangs, curving forward and in
    ctx.beginPath();
    ctx.moveTo(x0 - c * 0.03, sg * c * 0.06);
    ctx.quadraticCurveTo(x0 + c * (0.14 + 0.08 * e), sg * c * 0.08, x0 + c * (0.16 + 0.14 * e), sg * c * (0.02 - 0.04 * e));
    ctx.lineTo(x0 + c * 0.06, sg * c * 0.13);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

// Copycat with no one to copy: a cat's blep, the tip of a pink tongue.
function blep(t) {
  const c = CELL, e = stayOut(t, 2);
  ctx.fillStyle = '#f472b6'; // (deeper than its pale head)
  ctx.beginPath();
  ctx.ellipse(c * (0.44 + 0.06 * e), 0, c * (0.03 + 0.05 * e), c * 0.075, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#be185d';
  ctx.lineWidth = c * 0.02;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(c * 0.44, 0); ctx.lineTo(c * (0.45 + 0.07 * e), 0);
  ctx.stroke();
}

// Star's gag is its mustache, twirling (see stacheSprite): nothing comes
// out of its mouth. Copycat copying it can't grow one, so it holds up a
// stick-on mustache under its nose for the length of a flick, and twirls
// that (the same sprite, smaller, in its own face's frame).
function fakeStache(t, p) {
  const e = Math.min(1, t * 3);
  if (e < 0.05) return;
  const sc = 0.72 * e / 1.1; // (the sprite is at a face's scale already)
  ctx.translate(CELL * 0.14, 0);
  ctx.scale(sc, sc);
  blit(stacheSprite(Math.max(1, Math.min(STACHE_STEPS - 1, Math.round(p * STACHE_STEPS)))), 0, 0);
}
