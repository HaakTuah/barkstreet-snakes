// The renderer (see render/core.js): sprites, cached once and drawn turned
// as needed; the Field guide's pictures; the beetles; and the particles.

// -------------------------------------------------------------- sprites

// Sprites are drawn once per resolution into small canvases centered on
// their cell, SPRITE cells across, and blitted with one drawImage.
const SPRITE = 2;
const sprites = new Map(); // name -> variant (a colour, a label, or '') -> canvas

function sprite(name, variant, draw) {
  let byVariant = sprites.get(name);
  if (!byVariant) sprites.set(name, byVariant = new Map());
  let s = byVariant.get(variant);
  if (s) return s;
  const size = Math.max(2, Math.round(SPRITE * CELL * k));
  s = makeLayer(size, size);
  const g = s.getContext('2d');
  const scale = size / (SPRITE * CELL);
  g.setTransform(scale, 0, 0, scale, size / 2, size / 2);
  draw(g, variant);
  byVariant.set(variant, s);
  return s;
}

// A sprite that isn't rotated, on whole device pixels: never resampled.
function blitCrisp(s, x, y, alpha) {
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(s, Math.round(x * k + shakeX - s.width / 2), Math.round(y * k + shakeY - s.height / 2));
  ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
  if (alpha !== undefined) ctx.globalAlpha = 1;
}

function blit(s, x, y, alpha) {
  const half = SPRITE * CELL / 2;
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.drawImage(s, x - half, y - half, SPRITE * CELL, SPRITE * CELL);
  if (alpha !== undefined) ctx.globalAlpha = 1;
}

// (Food sprites have no shadow of their own: it's drawn apart, on the bark,
// so the food can bob up off it.)
const shadowSprite = () => sprite('shadow', '', drawShadowBlob);
const drawShadowBlob = g => {
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath(); g.ellipse(0, 0, CELL * 0.29, CELL * 0.09, 0, 0, TAU); g.fill();
};
function shadowAt(x, y, scale) {
  const w = SPRITE * CELL * scale;
  ctx.drawImage(shadowSprite(), x - w / 2, y - w / 2, w, w);
}

function drawAppleShape(g, body, leaf = '#15803d') {
  const c = CELL;
  g.fillStyle = body;
  g.beginPath(); g.arc(0, c * 0.04, c * 0.34, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(30,20,8,0.45)';
  g.lineWidth = c * 0.05;
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.beginPath(); g.arc(-c * 0.12, -c * 0.06, c * 0.08, 0, TAU); g.fill();
  g.strokeStyle = '#78350f';
  g.lineWidth = c * 0.07;
  g.beginPath(); g.moveTo(0, -c * 0.22); g.lineTo(c * 0.04, -c * 0.42); g.stroke();
  g.fillStyle = leaf;
  g.beginPath(); g.ellipse(c * 0.17, -c * 0.36, c * 0.14, c * 0.07, -0.5, 0, TAU); g.fill();
}

// An apple as it ages (it rots away in the end): fresh; bruised, with brown
// spots; rotten, brown and wrinkled, its leaf dead. Or baked in a fire:
// deep red, glazed and split, a little caramel oozing.
const APPLE_LOOKS = { fresh: ['#84cc16', '#15803d'], bruised: ['#9fb53a', '#4d7c0f'], rotten: ['#8a6a2a', '#78716c'], baked: ['#9a3412', '#57534e'] };
const drawApple = (g, v) => {
  const [body, leaf] = APPLE_LOOKS[v] || APPLE_LOOKS.fresh, c = CELL;
  drawAppleShape(g, body, leaf);
  if (v === 'bruised' || v === 'rotten') {
    g.fillStyle = v === 'rotten' ? 'rgba(66,38,12,0.6)' : 'rgba(110,66,20,0.5)';
    for (const [x, y, rr] of [[0.1, 0.12, 0.07], [-0.1, 0.18, 0.05], [0.17, -0.02, 0.045]]) { g.beginPath(); g.arc(c * x, c * y, c * rr, 0, TAU); g.fill(); }
  }
  if (v === 'rotten') { // wrinkles
    g.strokeStyle = 'rgba(52,30,10,0.6)';
    g.lineWidth = c * 0.03;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-c * 0.2, -c * 0.02); g.quadraticCurveTo(-c * 0.12, c * 0.06, -c * 0.2, c * 0.14);
    g.moveTo(c * 0.02, c * 0.24); g.quadraticCurveTo(c * 0.1, c * 0.16, c * 0.2, c * 0.22);
    g.stroke();
  }
  if (v === 'baked') { // glazed and split, caramel in the split
    g.strokeStyle = '#fbbf24';
    g.lineWidth = c * 0.05;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(-c * 0.06, c * 0.02); g.lineTo(c * 0.02, c * 0.12); g.lineTo(-c * 0.02, c * 0.22); g.stroke();
    g.strokeStyle = 'rgba(254,215,170,0.8)';
    g.lineWidth = c * 0.04;
    g.beginPath(); g.arc(0, c * 0.04, c * 0.26, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
  }
};
const drawGolden = g => drawAppleShape(g, '#fbbf24');
const appleSprite = (v = 'fresh') => sprite('apple', v, drawApple);
const goldenSprite = () => sprite('golden', '', drawGolden);
const glowSprite = () => sprite('glow', '', drawGlow);
const drawGlow = g => { // (in Honey: gold means a power)
  const grad = g.createRadialGradient(0, 0, CELL * 0.2, 0, 0, CELL * 0.8);
  grad.addColorStop(0, 'rgba(253,230,138,0.55)');
  grad.addColorStop(1, 'rgba(253,230,138,0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(0, 0, CELL * 0.8, 0, TAU); g.fill();
};
// A four-point sparkle: the golden apple's non-color cue.
const starSprite = () => sprite('star', '', drawStar);
const drawStar = g => {
  g.fillStyle = '#fffbea';
  g.beginPath();
  const r1 = CELL * 0.2, r2 = CELL * 0.05;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, r = i % 2 ? r2 : r1;
    if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(r, 0);
  }
  g.fill();
};
// A golden leaf (on the wind: dashes): a broad ginkgo fan about a cell
// across, in Honey, inked like every other pickup and lit along its top:
// nothing like the slim autumn leaves blowing past.
const goldLeafSprite = () => sprite('goldleaf', '', drawGoldLeaf);
const drawGoldLeaf = g => {
  const c = CELL;
  const fan = () => {
    g.beginPath();
    g.moveTo(0, c * 0.26); // (the base, where the stalk joins)
    g.quadraticCurveTo(-c * 0.16, c * 0.05, -c * 0.46, -c * 0.1);
    g.quadraticCurveTo(-c * 0.42, -c * 0.42, -c * 0.07, -c * 0.44);
    g.lineTo(0, -c * 0.31); // (the notch in its edge)
    g.lineTo(c * 0.07, -c * 0.44);
    g.quadraticCurveTo(c * 0.42, -c * 0.42, c * 0.46, -c * 0.1);
    g.quadraticCurveTo(c * 0.16, c * 0.05, 0, c * 0.26);
    g.closePath();
  };
  g.strokeStyle = '#3a2614'; // the stalk
  g.lineWidth = c * 0.07;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, c * 0.24); g.quadraticCurveTo(c * 0.02, c * 0.4, c * 0.08, c * 0.48); g.stroke();
  const grad = g.createLinearGradient(0, -c * 0.44, 0, c * 0.26);
  grad.addColorStop(0, '#fffbea'); grad.addColorStop(0.35, '#fde68a'); grad.addColorStop(1, '#d4a017');
  fan();
  g.fillStyle = grad; g.fill();
  g.strokeStyle = 'rgba(180,120,10,0.7)'; // veins, fanning out from the base
  g.lineWidth = c * 0.022;
  g.beginPath();
  for (const a of [-1.05, -0.6, -0.2, 0.2, 0.6, 1.05]) { g.moveTo(0, c * 0.2); g.lineTo(Math.sin(a) * c * 0.4, c * 0.2 - Math.cos(a) * c * 0.56); }
  g.stroke();
  fan();
  g.lineJoin = 'round';
  g.strokeStyle = '#3a2614'; g.lineWidth = c * 0.05; g.stroke();
  g.strokeStyle = '#fffbea'; g.lineWidth = c * 0.03; // (its top edge, catching the light)
  g.beginPath(); g.moveTo(-c * 0.36, -c * 0.24); g.quadraticCurveTo(-c * 0.3, -c * 0.38, -c * 0.1, -c * 0.4); g.stroke();
};
// A golden mushroom (in the rain: the edges wrap): the mushroom's shape,
// its cap in the golden leaf's Honey and inked like it, with white spots
// (ringed, so they show on the pale gold) and a shine.
const goldcapSprite = () => sprite('goldcap', '', drawGoldcap);
const drawGoldcap = g => {
  const c = CELL;
  g.lineJoin = 'round';
  g.strokeStyle = '#3a2614';
  g.lineWidth = c * 0.05;
  g.fillStyle = '#fef3c7';
  g.beginPath();
  if (g.roundRect) g.roundRect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36, c * 0.07); else g.rect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36);
  g.fill(); g.stroke();
  const grad = g.createLinearGradient(0, -c * 0.32, 0, 0);
  grad.addColorStop(0, '#fffbea'); grad.addColorStop(0.35, '#fde68a'); grad.addColorStop(1, '#d4a017');
  g.fillStyle = grad;
  g.beginPath(); g.ellipse(0, 0, c * 0.42, c * 0.32, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#ffffff';
  g.strokeStyle = 'rgba(180,120,10,0.7)'; // (the leaf's veins)
  g.lineWidth = c * 0.022;
  for (const [x, y, r] of GOLDCAP_SPOTS) { g.beginPath(); g.arc(c * x, c * y, c * r, 0, TAU); g.fill(); g.stroke(); }
  g.strokeStyle = 'rgba(255,251,234,0.85)'; // a shine on the cap
  g.lineWidth = c * 0.04;
  g.lineCap = 'round';
  g.beginPath(); g.arc(0, 0, c * 0.3, Math.PI * 1.2, Math.PI * 1.45); g.stroke();
};
const GOLDCAP_SPOTS = [[-0.19, -0.1, 0.06], [0.06, -0.21, 0.06], [0.23, -0.06, 0.05]];
const mushroomSprite = () => sprite('mushroom', '', drawMushroom);
const drawMushroom = g => {
  const c = CELL;
  g.fillStyle = '#fef3c7';
  g.beginPath(); // a rounded stem, like every other shape on the board
  if (g.roundRect) g.roundRect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36, c * 0.07); else g.rect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36);
  g.fill();
  g.fillStyle = '#dc2626';
  g.beginPath(); g.ellipse(0, 0, c * 0.4, c * 0.3, 0, Math.PI, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(30,20,8,0.45)';
  g.lineWidth = c * 0.05;
  g.stroke();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(-c * 0.18, -c * 0.1, c * 0.06, 0, TAU); g.fill();
  g.beginPath(); g.arc(c * 0.06, -c * 0.2, c * 0.06, 0, TAU); g.fill();
  g.beginPath(); g.arc(c * 0.22, -c * 0.06, c * 0.05, 0, TAU); g.fill();
};
// What's left of a snake: it falls to pieces, glossy beads in its own
// colours and markings (Star's rainbow, Mason's marble, Colonist's
// strap, a friend's spots), so no two snakes leave the same remains. A light
// rim and a dark edge keep every bead readable on the bark.
// variant: 'fill|mark', mark one of '', marble, marble2 (a gold vein), strap, strap2, spots, rings, dots, copy, ghost.
const beadSprite = v => sprite('bead', v, drawBead);
const drawBead = (g, v) => {
  const c = CELL, r = c * 0.26, bar = v.indexOf('|'), fill = v.slice(0, bar), mark = v.slice(bar + 1);
  const disc = (x, y, rr) => { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); };
  if (mark === 'ghost') g.globalAlpha = 0.72;
  g.fillStyle = 'rgba(255,244,226,0.5)';
  disc(0, 0, r + c * 0.05);
  g.fillStyle = fill;
  disc(0, 0, r);
  g.strokeStyle = 'rgba(30,20,8,0.5)';
  g.lineWidth = c * 0.03;
  g.stroke();
  g.fillStyle = 'rgba(30,41,59,0.6)';
  if (mark === 'marble' || mark === 'marble2') {
    g.strokeStyle = mark === 'marble2' ? 'rgba(201,162,39,0.85)' : 'rgba(100,116,139,0.6)';
    g.lineWidth = c * 0.03;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-r * 0.7, -r * 0.45); g.quadraticCurveTo(0, r * 0.1, r * 0.75, -r * 0.2);
    g.moveTo(-r * 0.15, r * 0.75); g.quadraticCurveTo(r * 0.05, r * 0.35, r * 0.6, r * 0.45);
    g.stroke();
  } else if (mark === 'strap' || mark === 'strap2') {
    g.strokeStyle = '#fef3c7';
    g.lineWidth = c * 0.07;
    g.beginPath();
    const d = r * 0.7, sg = mark === 'strap' ? 1 : -1;
    g.moveTo(-d, -d * sg); g.lineTo(d, d * sg);
    g.stroke();
  } else if (mark === 'spots' || mark === 'dots') {
    g.fillStyle = 'rgba(58,38,20,0.45)';
    if (mark === 'dots') disc(0, 0, r * 0.32);
    else { disc(-r * 0.38, r * 0.12, r * 0.18); disc(r * 0.38, -r * 0.12, r * 0.18); }
  } else if (mark === 'diamond') {
    g.fillStyle = 'rgba(58,36,8,0.75)';
    g.beginPath(); g.moveTo(0, -r * 0.6); g.lineTo(r * 0.6, 0); g.lineTo(0, r * 0.6); g.lineTo(-r * 0.6, 0); g.closePath(); g.fill();
  } else if (mark === 'rings' || mark === 'copy') {
    g.strokeStyle = mark === 'copy' ? 'rgba(255,255,255,0.75)' : 'rgba(58,38,20,0.5)';
    g.lineWidth = c * 0.04;
    if (mark === 'copy') g.setLineDash([c * 0.07, c * 0.07]);
    g.beginPath(); g.arc(0, 0, r * (mark === 'copy' ? 0.75 : 0.55), 0, TAU); g.stroke();
    g.setLineDash([]);
  }
  g.fillStyle = 'rgba(255,255,255,0.55)'; // the gloss
  g.beginPath(); g.ellipse(-r * 0.32, -r * 0.38, r * 0.3, r * 0.2, -0.6, 0, TAU); g.fill();
};
// The Field guide's pictures (beside each rule on its card): one thing,
// px device pixels square on a canvas of its own, drawn with the board's
// own sprites; a power as a small glyph in its accent colour inside the
// gold every power wears; a hole, fire and land on a tile of bark. Made
// once a kind and size. Kinds: apple, golden, mushroom, goldcap, leaf,
// beetle, goldbeetle, pellet, roast (a roasted bead), baked (a baked
// apple), jump, flash, wrap, hole, fire, land, held (a snake holding
// golden powers: its gold line and a pip of each kind), rests (you, your
// jump and flash resting: your two half-rings), choke (you spitting your
// own bead aside), cough (you coughing: mouth shut, puffs of breath),
// lostflag (a colony's flag falling into its pit), dig (a beetle half
// sunk in sawdust, digging in), knock (an apple flying out of the
// woodpecker's mark to the ring where it lands), and the basics (How to
// play's first rows): basic-win, basic-steer, basic-crash, basic-hunger.
const guideSprites = new Map(); // kind and size -> canvas
function guideSprite(kind, px) {
  px = Math.max(8, Math.round(px));
  const key = kind + ' ' + px;
  let c = guideSprites.get(key);
  if (c) return c;
  c = makeLayer(px, px);
  const g = c.getContext('2d'), tile = GUIDE_TILE[kind], s = px / (CELL * (tile ? 2 * tile : 1.2));
  g.setTransform(s, 0, 0, s, px / 2, px / 2); // (the thing's middle in the middle, in the board's units)
  if (tile) barkTile(g, tile * CELL);
  (GUIDE[kind] || GUIDE.apple)(g);
  guideSprites.set(key, c);
  return c;
}
const GUIDE_TILE = { hole: 1.5, land: 1.25, fire: 0.95, mushroom: 0.95, held: 1.1, rests: 1.05, choke: 1.15, lostflag: 1.2, cough: 1.15, dig: 0.9, knock: 1.35, 'basic-win': 1.1, 'basic-steer': 1.1, 'basic-crash': 1.1 }; // (on a tile of bark this many cells either side of the middle)
const COUGH_GUIDE = [[0.74, 0.02, 0.21, 1], [0.97, -0.46, 0.13, 0.75]]; // (the guide's puffs: x, y, radius in cells, and how faint)
const DIG_SPRAY = [[-0.62, -0.42, 0.045], [0.6, -0.5, 0.04], [0.66, 0.36, 0.05], [-0.5, 0.58, 0.04], [0.05, -0.7, 0.035], [-0.72, 0.1, 0.035]];
const GUIDE = {
  apple: g => drawApple(g, 'fresh'),
  baked: g => drawApple(g, 'baked'),
  golden: g => { guideGlow(g); drawGolden(g); g.translate(CELL * 0.2, -CELL * 0.22); drawStar(g); },
  mushroom: g => { g.scale(1.2, 1.2); drawHaze(g); g.translate(0, CELL * 0.04); drawMushroom(g); }, // (on bark, as on the log: its cream stem vanished on the card; and the purple haze its rule mentions)
  goldcap: g => { guideGlow(g); g.translate(0, CELL * 0.04); drawGoldcap(g); },
  leaf: g => { guideGlow(g); drawGoldLeaf(g); },
  beetle: g => drawGuideBeetle(g, false),
  goldbeetle: g => { guideGlow(g); drawGuideBeetle(g, true); },
  pellet: g => { g.scale(1.5, 1.5); drawBead(g, '#fb923c|'); },
  roast: g => { g.scale(1.5, 1.5); drawBead(g, ROAST); },
  jump: g => drawPowerGlyph(g, 'jump'),
  flash: g => drawPowerGlyph(g, 'flash'),
  wrap: g => drawPowerGlyph(g, 'wrap'),
  fire: g => { drawFireGlow(g); g.scale(1.3, 1.3); drawFlames(g, '0'); },
  hole: g => { guideCells(GUIDE_HOLE); g.translate(-12 * CELL, -12 * CELL); drawPits(g, guideMask, 0, 0, GRID - 1, GRID - 1); },
  land: g => { guideCells(GUIDE_LAND); g.translate(-12 * CELL, -12 * CELL); paintLand(g, null, guideMask, guideNone, '#2563eb', 0, NO_HOLES); },
  held: g => guideSnake(g, '#2563eb', false, (x, y) => drawPips(x, y, Math.PI, CELL * 0.54, 0, 1, 1, false)),
  rests: g => guideSnake(g, '#4ade80', true, (x, y) => { const rr = CELL * 0.84; restHalf(x, y, rr, -1, 0.6, SKY); restHalf(x, y, rr, 1, 0.3, EMBER); }),
  choke: g => guideSnake(g, '#4ade80', true, x => { // (choking on its own bead: cheeks puffed, the bead spat aside in an arc, a cough of breath)
    const c = CELL;
    g.beginPath();
    for (const sg of SIDES2) { g.moveTo(x + c * 0.56, sg * c * 0.38); g.arc(x + c * 0.4, sg * c * 0.38, c * 0.16, 0, TAU); }
    g.strokeStyle = INK; g.lineWidth = c * 0.04; g.stroke();
    g.fillStyle = '#4ade80'; g.fill();
    for (const sg of SIDES2) { g.fillStyle = '#fffbea'; circle(x + c * 0.16, sg * c * 0.2, c * 0.13); g.fillStyle = INK; circle(x + c * 0.2, sg * c * 0.2, c * 0.07); } // (its eyes again, over its cheeks)
    g.strokeStyle = 'rgba(255,251,234,0.8)'; g.lineWidth = c * 0.045; g.lineCap = 'round'; g.setLineDash([c * 0.07, c * 0.09]);
    g.beginPath(); g.moveTo(x + c * 0.55, c * 0.12); g.quadraticCurveTo(x + c * 1.0, c * 0.02, x + c * 0.8, c * 0.5); g.stroke();
    g.setLineDash(NO_DASH);
    g.save(); g.translate(x + c * 0.78, c * 0.74); drawBead(g, '#4ade80|'); g.restore();
    const px = x + c * 0.8, py = -c * 0.5, r = c * 0.13; // (a puff of a cough)
    g.beginPath();
    for (let j = 0; j < COUGH_PUFF.length; j += 3) { const cx = px + COUGH_PUFF[j] * r, cy = py + COUGH_PUFF[j + 1] * r, cr = COUGH_PUFF[j + 2] * r; g.moveTo(cx + cr, cy); g.arc(cx, cy, cr, 0, TAU); }
    g.strokeStyle = 'rgba(58,38,20,0.6)'; g.lineWidth = c * 0.05; g.stroke();
    g.fillStyle = '#fbf7ec'; g.fill();
  }),
  cough: g => guideSnake(g, '#4ade80', true, x => { // (coughing: its mouth shut, puffs of breath coming out past it)
    const c = CELL;
    g.strokeStyle = INK; g.lineWidth = c * 0.04; g.lineCap = 'round'; // (its mouth, shut)
    g.beginPath(); g.moveTo(x + c * 0.3, c * 0.07); g.quadraticCurveTo(x + c * 0.4, c * 0.02, x + c * 0.47, c * 0.05); g.stroke();
    for (const [px, py, r, a] of COUGH_GUIDE) {
      g.globalAlpha = a;
      g.beginPath();
      for (let j = 0; j < COUGH_PUFF.length; j += 3) { const cx = x + c * px + COUGH_PUFF[j] * c * r, cy = c * py + COUGH_PUFF[j + 1] * c * r, cr = COUGH_PUFF[j + 2] * c * r; g.moveTo(cx + cr, cy); g.arc(cx, cy, cr, 0, TAU); }
      g.strokeStyle = 'rgba(58,38,20,0.6)'; g.lineWidth = c * 0.05; g.stroke();
      g.fillStyle = '#fbf7ec'; g.fill();
    }
    g.globalAlpha = 1;
  }),
  dig: g => { // (a cornered beetle digging in: half sunk in its bore, a collar of sawdust round it, sawdust flying off)
    const c = CELL, was = ctx;
    ctx = g;
    try {
      g.fillStyle = 'rgba(20,10,4,0.8)';
      g.beginPath(); g.ellipse(0, 0, c * 0.36, c * 0.3, 0, 0, TAU); g.fill();
      g.save(); g.scale(0.82, 0.82); drawGuideBeetle(g, false);
      g.fillStyle = 'rgba(20,10,4,0.3)'; g.beginPath(); g.ellipse(0, 0, c * 0.3, c * 0.38, 0, 0, TAU); g.fill();
      g.restore();
      digCollar(0, 0, 0.5, 5);
      g.fillStyle = '#e6cc96'; g.strokeStyle = 'rgba(92,60,28,0.8)'; g.lineWidth = c * 0.025; // (sawdust flying off it)
      for (const [x, y, r] of DIG_SPRAY) { g.beginPath(); g.arc(c * x, c * y, c * r, 0, TAU); g.fill(); g.stroke(); }
    } finally { ctx = was; }
  },
  knock: g => { // (an apple knocked out of the woodpecker's marked patch, flying in an arc to the ring where it lands)
    const c = CELL, px = -1.2 * c, py = 0.05 * c, pw = 1.2 * c, ph = 1.05 * c;
    g.save(); g.translate(px + pw / 2, py + ph / 2); g.scale(1.25, 1.1); drawMark(g); g.restore();
    g.beginPath();
    if (g.roundRect) g.roundRect(px, py, pw, ph, c * 0.32); else g.rect(px, py, pw, ph);
    g.fillStyle = 'rgba(20,8,2,0.4)'; g.fill();
    g.lineWidth = 5; g.strokeStyle = 'rgba(20,8,2,0.75)'; g.stroke();
    g.lineWidth = 2.8; g.strokeStyle = '#fef3c7'; g.stroke();
    const lx = 0.72 * c, ly = 0.62 * c; // (where it lands: a faint ring)
    g.setLineDash(KNOCK_DASH); g.lineCap = 'butt';
    for (const [col, w] of [['rgba(20,10,4,0.7)', 3.4], ['#fef3c7', 1.6]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(lx, ly, c * 0.38, 0, TAU); g.stroke(); }
    g.setLineDash([c * 0.07, c * 0.09]); g.lineCap = 'round'; // (its way through the air)
    g.strokeStyle = 'rgba(255,251,234,0.8)'; g.lineWidth = c * 0.045;
    g.beginPath(); g.moveTo(px + pw / 2, py + ph / 2); g.quadraticCurveTo(0, -1.25 * c, lx, ly - c * 0.1); g.stroke();
    g.setLineDash(NO_DASH);
    g.save(); g.translate(0.08 * c, -0.48 * c); g.rotate(0.35); g.scale(0.9, 0.9); drawApple(g, 'fresh'); g.restore();
  },
  lostflag: g => { // (a colony lost to the woodpecker: its flag tipping into the pit pecked out under it)
    guideCells(GUIDE_PIT); g.save(); g.translate(-12.5 * CELL, -12.5 * CELL); drawPits(g, guideMask, 0, 0, GRID - 1, GRID - 1); g.restore();
    const was = ctx;
    ctx = g;
    try { g.translate(-CELL * 0.2, CELL * 0.25); g.rotate(0.5); g.scale(0.8, 0.8); g.translate(0, -CELL * 0.6); flagPole(0, 0); drawFlag(1.5, -CELL * 0.92, 0, 0, 'blue'); } finally { ctx = was; }
  },
  // The basics (How to play's first rows): your snake, the last one
  // wriggling, in the win's confetti; your head with a turn ahead of it;
  // your head dazed by a crash, its stars going round, as on the log; and
  // a tag's hunger bar, running low.
  capricious: g => guideSnake(g, '#ec4899', false, (x, y) => { // (Capricious doing Sovereign: the crown on its own pink head, its pink ring round it)
    g.save(); g.translate(x, y);
    poly(CROWN, 1, '#facc15');
    g.fillStyle = '#dc2626'; circle(-CELL * 0.06, 0, CELL * 0.07);
    g.strokeStyle = '#ec4899'; g.lineWidth = CELL * 0.08;
    g.beginPath(); g.arc(0, 0, CELL * 0.68, 0, TAU); g.stroke();
    g.restore();
  }),
  copycat: g => { // (Copycat shadowing Sovereign: its body a pale copy of Sovereign's blue, its cat-eared head half its red)
    guideSnake(g, '#9fbcf3', false, (x, y) => {
      g.fillStyle = '#904b8f'; circle(x, y, CELL * 0.5); // (its head, half and half)
      for (const sg of SIDES2) { g.fillStyle = '#de2910'; g.beginPath(); g.moveTo(x - CELL * 0.3, sg * CELL * 0.2); g.lineTo(x - CELL * 0.62, sg * CELL * 0.5); g.lineTo(x - CELL * 0.05, sg * CELL * 0.42); g.closePath(); g.fill(); }
      for (const sg of SIDES2) { g.fillStyle = '#fffbea'; circle(x + CELL * 0.16, sg * CELL * 0.2, CELL * 0.13); g.fillStyle = INK; circle(x + CELL * 0.2, sg * CELL * 0.2, CELL * 0.07); }
      g.fillStyle = '#ffde00'; circle(x - CELL * 0.18, 0, CELL * 0.08); // (its pin)
    });
  },
  'basic-win': g => guideSnake(g, '#4ade80', true, (x, y) => {
    for (let i = 0; i < 7; i++) {
      const a = -2.75 + i * 0.78, r = CELL * (0.74 + (i % 2) * 0.2);
      g.save();
      g.translate(x - CELL * 0.15 + Math.cos(a) * r, y + Math.sin(a) * r * 0.95);
      g.rotate(i * 1.3);
      g.fillStyle = CONFETTI[i % CONFETTI.length];
      g.fillRect(-CELL * 0.1, -CELL * 0.055, CELL * 0.2, CELL * 0.11);
      g.restore();
    }
  }),
  'basic-steer': g => guideSnake(g, '#4ade80', true, (x, y) => {
    const ax = x + CELL * 0.78, top = y - CELL * 0.62;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const [w, ink] of [[CELL * 0.22, INK], [CELL * 0.11, '#fffbea']]) { // (inked, then cream: the turn it's about to take)
      g.strokeStyle = ink;
      g.lineWidth = w;
      g.beginPath(); g.moveTo(x + CELL * 0.5, y); g.quadraticCurveTo(ax, y, ax, top); g.stroke();
      g.fillStyle = ink;
      const h = w * 1.45;
      g.beginPath(); g.moveTo(ax, top - h * 0.9); g.lineTo(ax - h, top + h * 0.35); g.lineTo(ax + h, top + h * 0.35); g.closePath(); g.fill();
    }
  }),
  'basic-crash': g => guideSnake(g, '#4ade80', true, (x, y) => {
    ctx.fillStyle = '#fffbea';
    ctx.strokeStyle = 'rgba(58,38,20,0.85)';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      const a2 = 0.5 + i * TAU / 3;
      star(x + Math.cos(a2) * CELL * 0.55, y - CELL * 0.72 + Math.sin(a2) * CELL * 0.18, CELL * 0.22);
      ctx.stroke();
    }
  }),
  'basic-hunger': g => { // (a name tag, in parchment on the dark page: your dot, your name, and its bar along the bottom)
    const w = CELL * 1.12, h = CELL * 0.6, r = CELL * 0.14;
    const pill = () => { g.beginPath(); if (g.roundRect) g.roundRect(-w / 2, -h / 2, w, h, r); else g.rect(-w / 2, -h / 2, w, h); };
    g.fillStyle = '#2b1c10';
    pill(); g.fill();
    g.save(); g.translate(0, -CELL * 0.03); g.scale(0.94, 0.88); g.fillStyle = '#f6ecd2'; pill(); g.fill(); g.restore();
    g.fillStyle = '#4ade80';
    g.beginPath(); g.arc(-w / 2 + CELL * 0.2, -CELL * 0.07, CELL * 0.1, 0, TAU); g.fill();
    g.fillStyle = 'rgba(58,38,20,0.55)';
    g.beginPath(); if (g.roundRect) g.roundRect(-w / 2 + CELL * 0.37, -CELL * 0.12, CELL * 0.52, CELL * 0.1, CELL * 0.05); else g.rect(-w / 2 + CELL * 0.37, -CELL * 0.12, CELL * 0.52, CELL * 0.1); g.fill();
    const bx = -w / 2 + CELL * 0.14, bw = w - CELL * 0.28, by = CELL * 0.1, bh = CELL * 0.09;
    g.fillStyle = 'rgba(58,38,20,0.18)';
    g.beginPath(); if (g.roundRect) g.roundRect(bx, by, bw, bh, bh / 2); else g.rect(bx, by, bw, bh); g.fill();
    g.fillStyle = '#4d7c0f';
    g.beginPath(); if (g.roundRect) g.roundRect(bx, by, bw * 0.3, bh, bh / 2); else g.rect(bx, by, bw * 0.3, bh); g.fill();
  },
};
// A guide's snake: its head and neck heading right on the tile, in the
// board's own shapes (drawn on the guide's canvas for the moment): a
// rival's in its colour (gold round it: it holds golden powers), or yours
// in your cream outline; then marks(x, y) round its head.
function guideSnake(g, color, you, marks) {
  const was = ctx;
  ctx = g;
  try {
    const hx = you ? 0 : CELL * 0.2, a = { n: 3, pts: new Float32Array([hx, 0, hx - CELL, 0, hx - 2 * CELL, 0]), cor: new Float32Array([hx - CELL * 0.5, 0, hx - CELL * 1.5, 0]), rad: new Float32Array([CELL * 0.54, CELL * 0.44, CELL * 0.39]) };
    if (!you) { g.fillStyle = INK; bodyFills(a, GOLD_EDGE); g.fillStyle = HONEY; bodyFills(a, 2.5); }
    else { g.fillStyle = '#fffef8'; bodyFills(a, 3.5); }
    g.fillStyle = color;
    bodyFills(a, 0);
    g.fillStyle = 'rgba(255,255,255,0.18)'; // (each segment's sheen)
    for (let i = 0; i < 3; i++) circle(a.pts[2 * i] - a.rad[i] * 0.3, -a.rad[i] * 0.3, a.rad[i] * 0.32);
    for (const sg of SIDES2) { // (its eyes, ahead)
      g.fillStyle = '#fffbea'; circle(hx + CELL * 0.16, sg * CELL * 0.2, CELL * 0.13);
      g.fillStyle = INK; circle(hx + CELL * 0.2, sg * CELL * 0.2, CELL * 0.07);
    }
    marks(hx, 0);
  } finally { ctx = was; }
}
const guideGlow = g => { g.save(); g.scale(0.72, 0.72); drawGlow(g); g.restore(); }; // (a power's glow, all of it inside the picture)
// The cells of the guide's hole (an L, in the middle of a board) and its land (a staircase across it).
const GUIDE_HOLE = [[11, 11], [12, 11], [11, 12]], GUIDE_PIT = [[12, 12]], GUIDE_LAND = [];
for (let y = 9; y < 16; y++) for (let x = 9; x < 16; x++) if (x + y >= 24) GUIDE_LAND.push([x, y]);
const guideMask = new Uint8Array(GRID * GRID), guideNone = new Uint8Array(GRID * GRID), NO_HOLES = new Set();
function guideCells(cells) {
  guideMask.fill(0);
  for (const [x, y] of cells) guideMask[y * GRID + x] = 1;
}
// A rounded tile of bark, `half` units either side of the middle (clipped to: the rest goes on it).
function barkTile(g, half) {
  g.beginPath();
  if (g.roundRect) g.roundRect(-half, -half, 2 * half, 2 * half, half * 0.25); else g.rect(-half, -half, 2 * half, 2 * half);
  g.fillStyle = BARK;
  g.fill();
  g.clip();
  g.lineCap = 'round';
  for (let i = 0; i < 9; i++) { // (a few furrows along the grain)
    const x = -half + (i + 0.5) * 2 * half / 9 + (noise(i, 1, 30) - 0.5) * 6;
    g.strokeStyle = i % 2 ? 'rgba(28,16,6,0.3)' : 'rgba(150,108,66,0.18)';
    g.lineWidth = 2 + noise(i, 2, 30) * 4;
    g.beginPath(); g.moveTo(x, -half); g.quadraticCurveTo(x + (noise(i, 3, 30) - 0.5) * 8, 0, x, half); g.stroke();
  }
}
// A beetle, standing still and heading up, as drawBeetle draws it between steps (a golden one in Honey).
const drawGuideBeetle = (g, gold) => {
  const c = CELL;
  g.save();
  g.rotate(-Math.PI / 2);
  g.scale(1.25, 1.25);
  g.strokeStyle = '#1c1917';
  g.lineWidth = c * 0.05;
  g.lineCap = 'round';
  g.beginPath();
  for (let leg = -1; leg <= 1; leg++) {
    const bx = leg * c * 0.12;
    g.moveTo(bx, -c * 0.12); g.lineTo(bx + c * 0.06 * leg, -c * 0.32);
    g.moveTo(bx, c * 0.12); g.lineTo(bx + c * 0.06 * leg, c * 0.32);
  }
  g.moveTo(c * 0.26, -c * 0.04); g.quadraticCurveTo(c * 0.38, -c * 0.06, c * 0.42, -c * 0.18);
  g.moveTo(c * 0.26, c * 0.04); g.quadraticCurveTo(c * 0.38, c * 0.06, c * 0.42, c * 0.18);
  g.stroke();
  g.fillStyle = '#14532d';
  g.beginPath(); g.arc(c * 0.22, 0, c * 0.08, 0, TAU); g.fill();
  let shell = '#059669';
  if (gold) {
    shell = g.createLinearGradient(c * 0.2, 0, -c * 0.24, 0);
    shell.addColorStop(0, '#fffbea'); shell.addColorStop(0.35, '#fde68a'); shell.addColorStop(1, '#d4a017');
  }
  g.lineWidth = c * 0.03;
  for (const sg of SIDES2) {
    g.fillStyle = shell;
    g.strokeStyle = gold ? '#047857' : '#fbbf24';
    g.beginPath(); g.ellipse(-c * 0.02, 0, c * 0.22, c * 0.17, 0, sg < 0 ? Math.PI : 0, sg < 0 ? TAU : Math.PI); g.closePath();
    g.fill(); g.stroke();
  }
  g.fillStyle = gold ? 'rgba(255,255,255,0.7)' : 'rgba(209,250,229,0.55)';
  g.beginPath(); g.arc(c * 0.04, -c * 0.08, c * 0.045, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(6,47,35,0.8)';
  g.beginPath(); g.moveTo(c * 0.18, 0); g.lineTo(-c * 0.23, 0); g.stroke();
  g.restore();
};
// A power's glyph: its shape stroked thick in ink, then in the gold every
// power wears, then in its own accent (sky for the jump, ember for the
// flash, the gold itself for the wrap), so it reads by its shape too: a
// hop arc for the jump, a double chevron for the flash, a looped arrow for
// the wrap.
const POWER_ACCENT = { jump: '#a8dcf5', flash: '#f7a866', wrap: '#fde68a' };
const drawPowerGlyph = (g, kind) => {
  const c = CELL;
  const shape = () => {
    g.beginPath();
    if (kind === 'jump') { // up and over, landing beyond
      g.moveTo(-c * 0.36, c * 0.26); g.quadraticCurveTo(-c * 0.06, -c * 0.62, c * 0.3, c * 0.2);
      g.moveTo(c * 0.08, c * 0.12); g.lineTo(c * 0.3, c * 0.2); g.lineTo(c * 0.36, -c * 0.03);
    } else if (kind === 'flash') { // two chevrons, onward
      for (const dx of [-0.2, 0.1]) { g.moveTo(c * (dx - 0.1), -c * 0.26); g.lineTo(c * (dx + 0.14), 0); g.lineTo(c * (dx - 0.1), c * 0.26); }
    } else { // round and back in again
      const end = Math.PI * 1.3, r = c * 0.24, ex = Math.cos(end) * r, ey = Math.sin(end) * r, tx = -Math.sin(end), ty = Math.cos(end), L = c * 0.15, W = c * 0.13;
      g.arc(0, c * 0.02, r, -Math.PI * 0.4, end);
      g.moveTo(ex - L * tx + W * Math.cos(end), c * 0.02 + ey - L * ty + W * Math.sin(end));
      g.lineTo(ex, c * 0.02 + ey);
      g.lineTo(ex - L * tx - W * Math.cos(end), c * 0.02 + ey - L * ty - W * Math.sin(end));
    }
  };
  g.lineCap = g.lineJoin = 'round';
  for (const [col, w] of [['#3a2614', 0.27], [kind === 'wrap' ? '#d4a017' : '#fde68a', 0.19], [POWER_ACCENT[kind], 0.1]]) {
    g.strokeStyle = col;
    g.lineWidth = c * w;
    shape();
    g.stroke();
  }
};
// ------------------------------------------------------------ beetles

// A jewel beetle, drawn live: an emerald shell with a gold rim, six legs and
// feelers. It steps off and settles into its next cell during the tick it
// moves (a beetle's walk: step, pause), legs scuttling, and turns smoothly.
// Between steps it's never quite still: its feelers wave, it breathes, and
// every few seconds it lifts its wing cases and buzzes, as if about to fly
// off. Scared, it trembles. It pops in when it comes out. Sent scurrying
// (nudged aside by a coughing head, knocked aside by the woodpecker), it
// scurries there. Cornered, it digs in (see digOf).
//
// Up to two are out at once, each with its own heading, pop and wing beat:
// each beetle's look is kept from frame to frame by where it is (where it
// came from, if it moved this tick), not by its object (a guest online
// gets fresh ones every tick). bugs: { x, y, ang, at (when it popped out,
// or 0), t0 (its wings' beat), gold, dig (how far it has sunk, as last
// drawn), spray (its next spray of sawdust), frame (last drawn) }.
const bugs = [], bugFor = new Map(); // (bugFor: this frame's beetles -> their looks)
const bugPops = [], scurries = []; // (this tick's: where one came out, { x, y, tick, at }; one sent scurrying, { x, y, tx, ty, tick })
let bugFrame = 0;
function scurryOf(f) {
  for (const k of scurries) if (k.tick === game.tick && k.tx === f.x && k.ty === f.y) return k;
  return null;
}
function bugAt(x, y) {
  for (const b of bugs) if (b.frame !== bugFrame && b.x === x && b.y === y) return b;
  return null;
}
function trackBugs(now) {
  bugFrame++;
  bugFor.clear();
  for (let pass = 0; pass < 2; pass++) { // (those that moved this tick first, by where they came from; then the rest, by where they are)
    for (const f of game.food) {
      if (f.kind !== 'beetle' || bugFor.has(f)) continue;
      let b = null;
      if (!pass) {
        const k = scurryOf(f);
        if (k) b = bugAt(k.x, k.y);
        else if (f.movedAt === game.tick - 1 && f.px != null) b = bugAt(f.px, f.py);
        if (!b) continue;
      } else {
        b = bugAt(f.x, f.y);
        if (!b) {
          b = { x: f.x, y: f.y, ang: null, at: 0, t0: now - 1700 * bugs.length, gold: false, dig: 0, spray: 0, frame: 0 };
          for (const p of bugPops) if (p.tick === game.tick && p.x === f.x && p.y === f.y) b.at = p.at;
          bugs.push(b);
        }
      }
      b.x = f.x; b.y = f.y; b.gold = !!f.gold; b.frame = bugFrame;
      bugFor.set(f, b);
    }
  }
  for (let i = bugs.length - 1; i >= 0; i--) if (bugs[i].frame !== bugFrame) bugs.splice(i, 1); // (caught, gone down a burrow or flown)
}
function drawBeetle(f, alpha, now) {
  const st = bugFor.get(f);
  if (!st) return;
  const sc = scurryOf(f); // (sent scurrying this tick: it scurries there)
  const moved = !!sc || (f.movedAt === game.tick - 1 && f.px != null);
  const e = moved ? alpha * alpha * (3 - 2 * alpha) : 1, fx = sc ? sc.x : f.px, fy = sc ? sc.y : f.py;
  const gx = moved ? fx + (f.x - fx) * e : f.x, gy = moved ? fy + (f.y - fy) * e : f.y;
  let x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2;
  const c = CELL, lively = !reduced, t = now / 1000;
  const walking = moved && lively;
  const pop = st.at ? popOf(now - st.at) : 1;
  if (pop <= 0) return;
  const heading = Math.atan2(f.dir.y, f.dir.x);
  if (st.ang === null || !lively) st.ang = heading;
  else st.ang += Math.atan2(Math.sin(heading - st.ang), Math.cos(heading - st.ang)) * Math.min(1, frameDt / 60);
  const dig = digOf(f, alpha); // (digging in: how far it has sunk)
  st.dig = dig;
  if (lively && (f.scared || dig) && !moved) { x += Math.sin(now / 23) * 0.7; y += Math.cos(now / 31) * 0.7; } // trembling (digging, it's frantic)
  if (dig) { drawDig(st, x, y, dig, now); if (dig >= 1) return; }
  const step = walking ? Math.sin(now / (f.scared ? 28 : 45)) : dig && lively ? Math.sin(now / 30) : 0;
  const cycle = ((now - st.t0) / 1000) % 3.4; // the wing cases lift late in each cycle, if it's not walking (or digging)
  const lift = lively && !walking && !dig && cycle > 2.7 ? Math.sin((cycle - 2.7) / 0.7 * Math.PI) : 0;
  const sunk = 1 - DIG_SHRINK * dig; // (sinking into the bark: smaller, the lower it is)
  if (f.gold) { // a golden beetle glows, and glints now and then
    const w = SPRITE * CELL * pop * (1 + (lively ? 0.12 * Math.sin(t * 4) : 0));
    ctx.globalAlpha = lively ? 0.75 + 0.25 * Math.sin(t * 4) : 0.9;
    ctx.drawImage(glowSprite(), x - w / 2, y - w / 2, w, w);
    ctx.globalAlpha = 1;
    if (lively && Math.random() < 0.06) mote(x + (Math.random() - 0.5) * c, y + (Math.random() - 0.5) * c, 0, -6, 650, 0.3 + Math.random() * 0.3, 1);
  }
  if (dig < 0.5) {
    ctx.fillStyle = dig ? rgba('#000000', 0.3 * (1 - 2 * dig)) : 'rgba(0,0,0,0.3)'; // shadow (down in its bore, none)
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, c * 0.38 * pop * sunk, c * 0.3 * pop * sunk, 0, 0, TAU);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(st.ang + step * 0.07);
  const size = 1.35 * pop * sunk * (1 + (lively ? Math.sin(t * 3.1) * 0.02 : 0)); // about an apple's size, so it's easy to spot
  ctx.scale(size, size);
  // Legs: three a side, alternate pairs swinging.
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = c * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let leg = -1; leg <= 1; leg++) {
    const sw = (leg === 0 ? -step : step) * c * 0.06;
    const bx = leg * c * 0.12;
    ctx.moveTo(bx, -c * 0.12); ctx.lineTo(bx + c * 0.06 * leg + sw, -c * 0.32);
    ctx.moveTo(bx, c * 0.12); ctx.lineTo(bx + c * 0.06 * leg - sw, c * 0.32);
  }
  // Feelers, waving (twitching when it's scared).
  const wave = lively ? Math.sin(t * (f.scared ? 15 : 4.5)) * 0.05 : 0;
  ctx.moveTo(c * 0.26, -c * 0.04); ctx.quadraticCurveTo(c * 0.38, -c * (0.06 + wave), c * 0.42, -c * (0.18 - wave));
  ctx.moveTo(c * 0.26, c * 0.04); ctx.quadraticCurveTo(c * 0.38, c * (0.06 - wave), c * 0.42, c * (0.18 + wave));
  ctx.stroke();
  // Head, then (when the wing cases are lifted) the dark body under them and
  // the clear wings unfolding behind, buzzing...
  ctx.fillStyle = '#14532d';
  circle(c * 0.22, 0, c * 0.08);
  if (lift > 0) {
    ctx.fillStyle = '#052e16';
    ctx.beginPath(); ctx.ellipse(-c * 0.04, 0, c * 0.2, c * 0.12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(240,249,255,0.7)';
    ctx.strokeStyle = 'rgba(148,163,184,0.7)';
    ctx.lineWidth = c * 0.015;
    const buzz = 0.9 + 0.1 * Math.sin(now / 9);
    for (const sg of SIDES2) {
      ctx.beginPath();
      ctx.ellipse(-c * 0.26 * lift, sg * c * 0.14 * lift, c * 0.34 * buzz * lift, c * 0.1, -sg * 0.45 * lift, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  // ...then the shell: two emerald wing cases with a gold rim, which swing
  // out from the front when it lifts them; the split down the middle and a
  // shine. A golden one's are in Honey, like the golden leaf's and the
  // golden mushroom's (gold means a power), pale at the front and deep at
  // the back, rimmed in emerald.
  ctx.lineWidth = c * 0.03;
  for (const sg of SIDES2) {
    ctx.save();
    if (lift > 0) { ctx.translate(c * 0.16, 0); ctx.rotate(-sg * 0.4 * lift); ctx.translate(-c * 0.16, 0); }
    ctx.fillStyle = f.gold ? honeyShell() : '#059669';
    ctx.strokeStyle = f.gold ? '#047857' : '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(-c * 0.02, 0, c * 0.22, c * 0.17, 0, sg < 0 ? Math.PI : 0, sg < 0 ? TAU : Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (sg < 0) { ctx.fillStyle = f.gold ? 'rgba(255,255,255,0.7)' : 'rgba(209,250,229,0.55)'; circle(c * 0.04, -c * 0.08, c * 0.045); }
    ctx.restore();
  }
  if (!lift) {
    ctx.strokeStyle = 'rgba(6,47,35,0.8)';
    ctx.beginPath();
    ctx.moveTo(c * 0.18, 0); ctx.lineTo(-c * 0.23, 0);
    ctx.stroke();
  }
  if (dig) { // (going down into the dark of its bore)
    ctx.fillStyle = rgba('#140a04', 0.4 * dig);
    ctx.beginPath(); ctx.ellipse(0, 0, c * 0.3, c * 0.24, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
  if (dig) digCollar(x, y, dig, st.x * 7 + st.y * 13);
}

// A cornered beetle digs in (round six A): it stops where it is and bores
// into the bark (BEETLE_DIG ticks), frantic, sawdust spraying off it, and
// sinks into the bark as its time runs out: smaller, darker, a collar of
// sawdust closing in round it. It can still be caught. Then it's gone,
// its collar closing over it (see drawDive), and its bore is left a
// burrow (BURROW_FROM_DIG), freshly bored for a few seconds (see
// drawFresh): no heap without a burrow. With reduced motion: no spray,
// and it's drawn sunk part way, still, until it's gone.
const DIG_SHRINK = 0.45, DIG_STILL = 0.5;
// How far a digging beetle has sunk (0 if it isn't digging; up to 1).
function digOf(f, alpha) {
  if (f.digUntil == null || !(f.digUntil >= game.tick)) return 0;
  if (reduced) return DIG_STILL;
  const D = T.BEETLE_DIG || 8, p = Math.max(0, Math.min(1, (game.tick - 1 + alpha - (f.digUntil - D)) / D));
  return Math.max(0.04, Math.min(0.95, p * p * (3 - 2 * p)));
}
// Under it: the bore it's making, a dark hollow opening as it goes down;
// and sawdust spraying off it now and then.
function drawDig(st, x, y, dig, now) {
  const c = CELL, r = c * (0.18 + 0.2 * Math.min(1, dig * 1.6));
  ctx.fillStyle = 'rgba(20,10,4,0.8)';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.82, 0, 0, TAU); ctx.fill();
  if (!reduced && now >= st.spray) {
    st.spray = now + 60 + Math.random() * 70;
    spawn(x, y, 2, 120, 360, 1.8, '#e6cc96', '#b07d48');
  }
}
// Over it: a collar of the sawdust it's pushing out, heaped round its
// bore and over its edges, deeper as it sinks (seeded by where it is, so
// it holds still): lumps run together into a ring, in its shadow, then
// sawdust, then paler crumbs on top, lit from the upper left.
const COLLAR_N = 16;
function digCollar(x, y, dig, seed) {
  const c = CELL, up = Math.min(1, dig * 2.5), ri = c * (0.3 - 0.1 * dig), ro = ri + c * (0.04 + 0.1 * up + 0.04 * dig), rm = (ri + ro) / 2, rl = (ro - ri) / 2;
  for (let pass = 0; pass < 3; pass++) {
    ctx.fillStyle = pass === 0 ? 'rgba(70,42,18,0.8)' : pass === 1 ? '#d7b47a' : '#efdcb0';
    const dx = pass === 0 ? 1 : pass === 1 ? 0 : -0.7, dy = pass === 0 ? 1.3 : pass === 1 ? 0 : -0.9;
    ctx.beginPath();
    for (let i = 0; i < COLLAR_N; i++) {
      if (pass === 2 && noise(seed, i, 43) < 0.45) continue; // (crumbs on top, here and there)
      const a = (i + 0.5 * noise(seed, i, 41)) * TAU / COLLAR_N, r = rm + rl * 0.35 * (noise(seed, i, 44) - 0.5);
      const cr = (pass === 2 ? 0.45 : 1) * (rl * (0.6 + 0.9 * noise(seed, i, 42)) + 0.6), px = x + Math.cos(a) * r + dx, py = y + Math.sin(a) * r * 0.9 + dy;
      ctx.moveTo(px + cr, py); ctx.arc(px, py, cr, 0, TAU);
    }
    ctx.fill();
  }
}
// A golden beetle's Honey, front to back: made once, in the shell's own
// units, so it turns with the beetle (as its shine does).
let honeyGrad = null;
function honeyShell() {
  if (!honeyGrad) {
    honeyGrad = ctx.createLinearGradient(CELL * 0.2, 0, -CELL * 0.24, 0);
    honeyGrad.addColorStop(0, '#fffbea'); honeyGrad.addColorStop(0.35, '#fde68a'); honeyGrad.addColorStop(1, '#d4a017');
  }
  return honeyGrad;
}

// --------------------------------------------------------- particles

// A fixed pool: positions, velocities and life in typed arrays, colors as
// indexes into a small palette, so bursts never allocate.
const MAX_P = 320;
const px = new Float32Array(MAX_P), py = new Float32Array(MAX_P);
const pvx = new Float32Array(MAX_P), pvy = new Float32Array(MAX_P);
const plife = new Float32Array(MAX_P), pmax = new Float32Array(MAX_P), psize = new Float32Array(MAX_P);
const pcol = new Uint8Array(MAX_P), pshape = new Uint8Array(MAX_P); // shape: 0 a crumb, 1 a scrap of paper (confetti)
let pNext = 0, pLive = 0;
const PCOLORS = ['#a3e635', '#84cc16', '#fde68a', '#fbbf24', '#fffbea', '#dc2626', '#f6ecd2', '#c2410c', '#a16207'];
const PCOLOR_INDEX = new Map(PCOLORS.map((c, i) => [c, i]));
const colorIndex = c => {
  let i = PCOLOR_INDEX.get(c);
  if (i === undefined && PCOLORS.length < 255) { i = PCOLORS.length; PCOLORS.push(c); PCOLOR_INDEX.set(c, i); }
  return i ?? 0;
};

function spawn(x, y, n, speed, life, size, c1, c2, shape = 0) {
  if (reduced) return;
  const i1 = colorIndex(c1), i2 = colorIndex(c2);
  for (let j = 0; j < n; j++) {
    const i = pNext;
    pNext = (pNext + 1) % MAX_P;
    const a = Math.random() * TAU, v = speed * (0.4 + Math.random() * 0.6);
    px[i] = x; py[i] = y;
    pvx[i] = Math.cos(a) * v; pvy[i] = Math.sin(a) * v - speed * 0.35;
    pmax[i] = plife[i] = life * (0.7 + Math.random() * 0.5);
    psize[i] = size * (0.6 + Math.random() * 0.6);
    pcol[i] = j % 2 ? i1 : i2;
    pshape[i] = shape;
  }
  pLive = Math.min(MAX_P, pLive + n);
}

function drawParticles(dt) {
  if (!pLive) return;
  const step = dt / 1000;
  let live = 0;
  for (let c = 0; c < PCOLORS.length; c++) {
    let started = false;
    for (let i = 0; i < MAX_P; i++) {
      if (plife[i] <= 0 || pcol[i] !== c) continue;
      if (!started) { ctx.fillStyle = PCOLORS[c]; started = true; }
      plife[i] -= dt;
      pvy[i] += 900 * step; // a little gravity
      px[i] += pvx[i] * step;
      py[i] += pvy[i] * step;
      const t = Math.max(0, plife[i] / pmax[i]);
      ctx.globalAlpha = t;
      if (pshape[i]) { // a scrap of paper, spinning and turning over as it falls
        pvx[i] *= 0.985; pvy[i] *= 0.97; // (paper floats)
        const sz = psize[i], turn = Math.cos(plife[i] / 70 + i), spin = plife[i] / 260 + i * 1.3;
        const ax = Math.cos(spin) * sz, ay = Math.sin(spin) * sz; // (along the scrap)
        const bx = -Math.sin(spin) * sz * 0.6 * Math.abs(turn), by = Math.cos(spin) * sz * 0.6 * Math.abs(turn); // (across it, thin as it turns edge-on)
        ctx.beginPath();
        ctx.moveTo(px[i] - ax - bx, py[i] - ay - by); ctx.lineTo(px[i] + ax - bx, py[i] + ay - by);
        ctx.lineTo(px[i] + ax + bx, py[i] + ay + by); ctx.lineTo(px[i] - ax + bx, py[i] - ay + by);
        ctx.fill();
        if (turn < 0) { // (its back: paler)
          ctx.globalAlpha = t * 0.45;
          ctx.fillStyle = '#fffbea';
          ctx.fill();
          ctx.fillStyle = PCOLORS[c];
        }
      } else {
        ctx.beginPath();
        ctx.arc(px[i], py[i], psize[i] * (0.5 + 0.5 * t), 0, TAU);
        ctx.fill();
      }
      live++;
    }
  }
  ctx.globalAlpha = 1;
  pLive = live;
}

// Floating "+1" / "+3" over your head when you eat, from a tiny pool.
const MAX_F = 6;
const fx = new Float32Array(MAX_F), fy = new Float32Array(MAX_F), flife = new Float32Array(MAX_F);
const ftext = new Array(MAX_F).fill('');
const FLOAT_FONT = `700 ${Math.round(CELL * 0.72)}px Fredoka, system-ui, sans-serif`;
const FLOAT_FILL = { 'KO!': '#f87171', 'Crunch!': '#f87171', 'Boom!': '#f87171', 'Fwoosh!': '#fb923c', 'Bonk!': '#fdba74', 'Ouch!': '#fdba74', 'Snip!': '#fffbea', '-1': '#fca5a5', '-2': '#fca5a5', '-3': '#fca5a5' }; // (what you grow, +1 and so on, in Sprout: Honey by your head means a power)
const GROWN = ['', '+1', '+2', '+3', '+4', '+5']; // (what a bite was worth, without building a string)
const FLOAT_TOP = CELL * 1.3, FLOAT_LOW = SIZE - CELL * 0.5; // (a word starts between these, so it can rise and stay on the board)
const drawFloat = (g, text) => {
  const muted = text[0] === '~', word = muted ? text.slice(1) : text;
  g.font = FLOAT_FONT;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = CELL * 0.14;
  g.strokeStyle = muted ? 'rgba(58,38,20,0.55)' : 'rgba(58,38,20,0.85)';
  g.strokeText(word, 0, 0);
  g.fillStyle = muted ? '#d9c9a3' : FLOAT_FILL[word] || '#a3e635'; // (muted: Parchment, not Sprout)
  g.fillText(word, 0, 0);
};
// A word's sprite: two cells tall like any other, and as wide as the word
// needs (a long word used to shrink to fit, which left a death's Crunch!
// smaller than the Bonk! you survive). Drawn once per resolution.
const floatHalf = new Map(); // word -> half its width with its ink edge, in units
let measureG = null; // (a tiny canvas's context, for measuring a word before its sprite is made)
function floatSprite(text) {
  let byText = sprites.get('float');
  if (!byText) sprites.set('float', byText = new Map());
  let s = byText.get(text);
  if (s) return s;
  if (!measureG) measureG = makeLayer(1, 1).getContext('2d');
  measureG.font = FLOAT_FONT;
  const w = measureG.measureText(text[0] === '~' ? text.slice(1) : text).width + CELL * 0.3, span = Math.max(SPRITE * CELL, w); // (room for its ink edge)
  floatHalf.set(text, w / 2);
  s = makeLayer(Math.max(2, Math.round(span * k)), Math.max(2, Math.round(SPRITE * CELL * k)));
  const g = s.getContext('2d');
  g.setTransform(s.width / span, 0, 0, s.height / (SPRITE * CELL), s.width / 2, s.height / 2);
  drawFloat(g, text);
  byText.set(text, s);
  return s;
}
// Half a word's width, as it's kept inside the board (its sprite made, if it isn't yet).
const floatHalfOf = text => { floatSprite(text); return Math.max(CELL * (text.length > 3 ? 1.15 : 0.7), floatHalf.get(text)); };
let fNext = 0;
function floater(x, y, text) {
  const half = floatHalfOf(text); // (kept inside the board, words and all)
  fx[fNext] = Math.min(SIZE - half, Math.max(half, x)); fy[fNext] = y; flife[fNext] = T.FLOAT_MS; ftext[fNext] = text;
  fNext = (fNext + 1) % MAX_F;
}
function drawFloaters(dt) {
  let any = false;
  for (let i = 0; i < MAX_F; i++) if (flife[i] > 0) { any = true; break; }
  if (!any) return;
  for (let i = 0; i < MAX_F; i++) {
    if (flife[i] <= 0) continue;
    flife[i] -= dt;
    const t = Math.max(0, flife[i] / T.FLOAT_MS);
    const y = fy[i] - (reduced ? 0 : (1 - t) * CELL * 0.8); // rises, unless motion is reduced
    const sp = floatSprite(ftext[i]);
    if (reduced || t < 0.86) blitCrisp(sp, fx[i], y, Math.min(1, t * 1.6));
    else { // ...after popping in, from big
      const grow = (1 + (t - 0.86) / 0.14 * 0.7) / k, w = sp.width * grow, h = sp.height * grow;
      ctx.drawImage(sp, fx[i] - w / 2, y - h / 2, w, h);
    }
  }
}
