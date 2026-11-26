// The renderer (see render/core.js): the beetles' burrows, from the pop of
// one opening and its cracks to growing shut and healing over, and the bore
// a cornered beetle digs. The food is in food.js.

// ------------------------------------------------------------ burrows

// A beetle burrow: an oval opening in the bark, splintered round its rim,
// a little sawdust about it, and cracks that spread from it as the round
// goes on (the beetles are hollowing the log out). Wood splits along its
// grain, so the cracks run along the log, either way from the hole,
// tapering, now and then forking. Each burrow's cracks
// are its own (seeded by where it is) and grow to full length over about
// half a minute. It opens with a pop.
//
// One a cornered beetle's dig left (dug: 1, round six A) doesn't pop: the
// beetle's collar closes over it (see drawDive) and it's there, freshly
// bored, its rim raw pale wood with splinters sticking out of it and its
// sawdust kicked out round it; over FRESH_MS it settles into an ordinary
// burrow (see drawFresh). One growing shut (shutFrom..shutAt: at the most,
// the one unused longest, to make room) closes up over those 6 to 14 s of
// game time: sawdust creeps in from its rim as the opening shrinks, moss
// creeps over the rim and the bark's grain grows across it (see
// drawShutting). Closing over at the end (a 'heal') the plug fills it, the
// moss covers it, and it fades into the bark over HEAL_MS (see drawHeals);
// with reduced motion, filled and mossed at once, then fading. A faint
// scar stays a while (SCAR_MS) where it was.
const CRACK_GROW_TICKS = 260, FRESH_MS = 4000, FRESH_HOLD = 1200, HEAL_MS = 1100, SCAR_MS = 20000, SHUT_HOLE = 0.9; // (SHUT_HOLE: the share of its opening's area gone as it grows shut)
const heals = []; // { x, y, at, key (its cell), v (its look), cs (its cracks' sprite, as last drawn), grown (how far it had grown shut, 0..1) }
const shutSeen = new Map(); // cell -> how far a burrow there has grown shut, as last drawn (0..1)
const crackCache = new Map(); // cell -> branches of [x, y] points (cells)
const burrowSeen = new Map(); // cell -> when it first showed (for its pop)
function cracksOf(b) {
  const k = b.y * GRID + b.x;
  let br = crackCache.get(k);
  if (br) return br;
  const rnd = seededRnd((k * 7919 + 13) % 2147483647 || 1);
  br = [];
  const split = (x, y, base, len) => {
    const pts = [[x, y]];
    let a = base + (rnd() - 0.5) * 0.4;
    for (let j = 0; j < len; j++) {
      a += (rnd() - 0.5) * 0.5 + (base - a) * 0.4; // (wandering, but kept to the grain)
      const step = 0.35 + rnd() * 0.25;
      x += Math.cos(a) * step; y += Math.sin(a) * step;
      pts.push([x, y]);
    }
    return pts;
  };
  for (const base of [Math.PI / 2, -Math.PI / 2]) { // (up and down the log)
    const main = split(0, 0, base, 5 + Math.floor(rnd() * 4));
    br.push(main);
    if (rnd() < 0.6) { // a fork
      const [fx, fy] = main[2 + Math.floor(rnd() * 2)];
      br.push(split(fx, fy, base + (rnd() < 0.5 ? -0.6 : 0.6), 2 + Math.floor(rnd() * 2)));
    }
  }
  crackCache.set(k, br);
  return br;
}
function drawBurrows(now) {
  if (heals.length) drawHeals(now);
  if (!game.burrows?.length) return;
  const c = CELL;
  ctx.lineCap = ctx.lineJoin = 'round'; // (as it always left them)
  for (const b of game.burrows) {
    const key = b.y * GRID + b.x, x = b.x * c + c / 2, y = b.y * c + c / 2;
    if (!burrowSeen.has(key)) burrowSeen.set(key, now);
    const age = now - burrowSeen.get(key), pop = b.dug ? 1 : popOf(age); // (a dug one is there as the collar closes over it)
    const grow = Math.min(1, Math.max(0.15, (game.tick - b.at) / CRACK_GROW_TICKS));
    // The cracks, from their sprite, on whole device pixels.
    const cs = crackSprite(b, key, grow);
    const shut = b.shutAt > b.shutFrom ? Math.min(1, Math.max(0, (shownTime - b.shutFrom) / (b.shutAt - b.shutFrom))) : 0; // (evenly over its time)
    if (shut > 0) shutSeen.set(key, shut);
    ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
    if (shut > 0) ctx.globalAlpha = 1 - 0.5 * shut; // (its cracks fading as it grows shut)
    ctx.drawImage(cs.c, cs.X, cs.Y);
    ctx.globalAlpha = 1;
    ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
    // The opening (a cached sprite, one of four).
    const w = SPRITE * CELL * pop;
    if (shut > 0) { drawShutting(x, y, key, w, shut); continue; }
    ctx.drawImage(burrowSprite(BURROW_LOOKS[key % 4]), x - w / 2, y - w / 2, w, w);
    if (b.dug && age < FRESH_MS) drawFresh(x, y, key, age);
  }
}
// A burrow growing shut, `shut` of the way (0..1, evenly over its time):
// sawdust creeps in from its rim, the opening shrinking into it (its dark
// rim kept, its area going evenly), the bark's grain grows across, and
// cushions of the log's moss creep in over the rim one after another. In
// two parts, so a closing over (drawHeals) can pack its plug between them.
function drawShutting(x, y, key, w, shut, a = 1) {
  shutBase(x, y, key, w, shut, a);
  shutMoss(x, y, key, w, shut, a);
}
function shutBase(x, y, key, w, shut, a) {
  const c = CELL, s = w / (SPRITE * c), hr = Math.sqrt(1 - SHUT_HOLE * shut), seed = key * 7 + 3;
  const rnd = i => sinHash(seed + i);
  ctx.globalAlpha = a;
  ctx.drawImage(burrowSprite(BURROW_LOOKS[key % 4]), x - w / 2, y - w / 2, w, w); // (its pale rim and specks stay)
  ctx.save();
  ctx.translate(x, y); ctx.rotate(0.4); ctx.scale(s, s); // (the hole's tilted oval)
  ctx.fillStyle = '#c9a46a'; // the sawdust, as wide as the hole
  ctx.beginPath(); ctx.ellipse(0, 0, c * 0.25, c * 0.17, 0, 0, TAU); ctx.fill();
  const hx = c * 0.24 * hr, hy = c * 0.16 * hr; // the opening left in it, with its dark rim
  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, hx);
  grad.addColorStop(0, '#050201'); grad.addColorStop(0.75, '#1c1007'); grad.addColorStop(1, '#3b2412');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(0, 0, hx, hy, 0, 0, TAU); ctx.fill();
  const lumps = [], big = Math.min(1, shut * 4);
  for (let i = 0; i < 16; i++) { // lumps of it: most along the opening's edge, creeping in over it, some out on the packed sawdust
    const t = i * TAU / 16 + rnd(i) * 0.3, out = i % 3 === 2 ? 0.25 + 0.6 * rnd(i + 30) : 0.1 * rnd(i + 30), f = hr + (1 - hr) * out;
    lumps.push([Math.cos(t) * c * 0.245 * f, Math.sin(t) * c * 0.165 * f, c * (0.016 + 0.03 * rnd(i + 60)) * big, rnd(i + 90) < 0.4]);
  }
  if (big > 0) for (let pass = 0; pass < 3; pass++) { // their shadow, the sawdust, the lit tops of some
    ctx.fillStyle = pass === 0 ? 'rgba(52,30,12,0.35)' : pass === 1 ? '#d6b47a' : 'rgba(242,226,187,0.8)';
    const d = pass === 0 ? 0.45 : pass === 1 ? 0 : -0.35;
    ctx.beginPath();
    for (const [lx, ly, r, lit] of lumps) { if (pass === 2 && !lit) continue; const rr = pass === 2 ? r * 0.45 : r; ctx.moveTo(lx + r * d + rr, ly + r * d); ctx.arc(lx + r * d, ly + r * d, rr, 0, TAU); }
    ctx.fill();
  }
  ctx.restore();
  const g = Math.max(0, (shut - 0.1) / 0.9); // the bark's grain, growing across it along the log, as its cracks run
  if (g > 0) {
    ctx.strokeStyle = `rgba(74,44,18,${(0.8 * Math.min(1, g * 1.5)).toFixed(3)})`; ctx.lineWidth = Math.max(1, c * 0.05); // (its alpha under globalAlpha a)
    ctx.beginPath();
    for (const [dx, len] of [[-0.11, 0.3], [0.01, 0.42], [0.12, 0.28]]) { const l = c * len * g / 2; ctx.moveTo(x + c * dx, y - l); ctx.lineTo(x + c * dx + c * 0.02, y + l); }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function shutMoss(x, y, key, w, shut, a) {
  const c = CELL, s = w / (SPRITE * c);
  for (let i = 0; i < 4; i++) { // each cushion its turn, growing in from the rim (each burrow's own)
    const m = Math.min(1, Math.max(0, (shut - 0.12 - i * 0.16) / 0.35));
    if (m <= 0) continue;
    const t = i * TAU / 4 + (key % 7) * 0.5 + (i % 2) * 0.35, ms = w * (0.24 + 0.42 * m), cs = Math.cos(t), sn = Math.sin(t);
    const ex = cs * c * 0.32 * (1 - 0.15 * m), ey = sn * c * 0.23 * (1 - 0.15 * m); // (on the rim's tilted oval, edging in)
    const px = x + s * (ex * Math.cos(0.4) - ey * Math.sin(0.4)), py = y + s * (ex * Math.sin(0.4) + ey * Math.cos(0.4));
    ctx.globalAlpha = a * Math.min(1, m * 3);
    ctx.drawImage(healMossSprite(BURROW_LOOKS[(key + i) % 4]), px - ms / 2, py - ms / 2, ms, ms);
  }
  ctx.globalAlpha = 1;
}
const BURROW_LOOKS = ['0', '1', '2', '3'];
// A dug burrow's fresh look, over the ordinary one: full for FRESH_HOLD,
// then settling away.
function drawFresh(x, y, key, age) {
  const f = age < FRESH_HOLD ? 1 : 1 - (age - FRESH_HOLD) / (FRESH_MS - FRESH_HOLD), a = f * f * (3 - 2 * f), w = SPRITE * CELL;
  if (a <= 0) return;
  ctx.globalAlpha = a;
  ctx.drawImage(freshSprite(BURROW_LOOKS[key % 4]), x - w / 2, y - w / 2, w, w);
  ctx.globalAlpha = 1;
}
// Freshly bored: sawdust kicked out round the hole (a pale bed, lumps lit
// from the upper left, specks further out), its rim raw pale wood, and
// splinters of it sticking out, inked so they read on the bark. Never over
// the hole itself: it's a burrow, open.
const freshSprite = v => sprite('burrowFresh', v, drawFreshBore);
const drawFreshBore = (g, v) => {
  const c = CELL, seed = Number(v) * 17 + 3, rot = 0.4, cs = Math.cos(rot), sn = Math.sin(rot);
  const on = (t, rx, ry) => { const ex = Math.cos(t) * rx, ey = Math.sin(t) * ry; return [ex * cs - ey * sn, ex * sn + ey * cs]; }; // (a point on the hole's tilted oval)
  const rnd = i => sinHash(seed + i);
  g.fillStyle = 'rgba(236,212,160,0.3)'; // (a bed of it round the hole, not over it)
  g.beginPath(); g.ellipse(0, 0, c * 0.5, c * 0.42, rot, 0, TAU); g.ellipse(0, 0, c * 0.25, c * 0.17, rot, 0, TAU); g.fill('evenodd');
  for (let pass = 0; pass < 3; pass++) { // the lumps: their shadow, the sawdust, its lit tops
    g.fillStyle = pass === 0 ? 'rgba(70,42,18,0.5)' : pass === 1 ? '#d9b77c' : '#f2e2bb';
    const dx = pass === 0 ? 0.9 : pass === 1 ? 0 : -0.6, dy = pass === 0 ? 1.2 : pass === 1 ? 0 : -0.8;
    g.beginPath();
    for (let i = 0; i < 14; i++) {
      if (pass === 2 && rnd(i * 5 + 4) < 0.4) continue;
      const [px, py] = on(i * TAU / 14 + rnd(i * 5) * 0.4, c * (0.34 + 0.1 * rnd(i * 5 + 1)), c * (0.27 + 0.1 * rnd(i * 5 + 1)));
      const r = c * (0.045 + 0.04 * rnd(i * 5 + 2)) * (pass === 2 ? 0.5 : 1);
      g.moveTo(px + dx + r, py + dy); g.arc(px + dx, py + dy, r, 0, TAU);
    }
    g.fill();
  }
  g.fillStyle = '#e6cc96'; // (specks thrown further)
  for (let i = 0; i < 12; i++) { const [px, py] = on(rnd(i * 3 + 80) * TAU, c * (0.5 + 0.14 * rnd(i * 3 + 81)), c * (0.44 + 0.14 * rnd(i * 3 + 81))); g.beginPath(); g.arc(px, py, c * (0.018 + 0.016 * rnd(i * 3 + 82)), 0, TAU); g.fill(); }
  g.strokeStyle = '#f3dfb0'; g.lineWidth = c * 0.06; // the raw rim
  g.beginPath(); g.ellipse(0, 0, c * 0.275, c * 0.195, rot, 0, TAU); g.stroke();
  g.lineJoin = 'round';
  for (let i = 0; i < 6; i++) { // splinters of raw wood, torn out from the rim past the sawdust, each with its grain
    const t = i * TAU / 6 + rnd(i * 7 + 40) * 0.7, len = c * (0.3 + 0.14 * rnd(i * 7 + 41)), half = c * (0.03 + 0.012 * rnd(i * 7 + 42));
    const [bx, by] = on(t, c * 0.28, c * 0.2), [tx, ty] = on(t + (rnd(i * 7 + 43) - 0.5) * 0.4, c * 0.28 + len, c * 0.2 + len * 0.85);
    const nx = -(ty - by), ny = tx - bx, n = Math.hypot(nx, ny) || 1;
    g.beginPath(); g.moveTo(bx + nx / n * half, by + ny / n * half); g.lineTo(tx, ty); g.lineTo(bx - nx / n * half, by - ny / n * half); g.closePath();
    g.fillStyle = '#f6e6c0'; g.fill();
    g.strokeStyle = 'rgba(64,38,16,0.9)'; g.lineWidth = c * 0.024; g.stroke();
    g.strokeStyle = 'rgba(176,125,72,0.8)'; g.lineWidth = c * 0.012; // (its grain)
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + (tx - bx) * 0.7, by + (ty - by) * 0.7); g.stroke();
  }
};
// A burrow closing over: its cracks and hole fading, a plug of sawdust
// filling it from the middle out, then moss creeping over it, all fading
// into the bark at the end.
function drawHeals(now) {
  const c = CELL, w = SPRITE * c;
  for (let i = heals.length - 1; i >= 0; i--) {
    const h = heals[i], p = (now - h.at) / HEAL_MS;
    const x = h.x * c + c / 2, y = h.y * c + c / 2;
    if (p >= 1 && p < 1 + SCAR_MS / HEAL_MS && !game.burrows?.some(b => b.x === h.x && b.y === h.y)) { // (its faint scar, fading)
      const f = 1 - (p - 1) * HEAL_MS / SCAR_MS;
      ctx.globalAlpha = 0.45 * f * Math.min(1, (p - 1) * 4); // (faint, but there)
      ctx.drawImage(healScarSprite(h.v), x - w / 2, y - w / 2, w, w);
      ctx.globalAlpha = 1;
      continue;
    }
    if (p >= 1 || p < 0) { heals.splice(i, 1); continue; }
    const f = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45, a = f * f * (3 - 2 * f);
    const fill = reduced ? 1 : Math.min(1, p / 0.4), moss = reduced ? 1 : Math.max(0, Math.min(1, (p - 0.2) / 0.4));
    if (h.cs?.c && h.cs.k === k) { // (its cracks, as last drawn, closing with it)
      ctx.globalAlpha = a * (1 - p) * (1 - 0.5 * (h.grown || 0)); // (from where they'd faded to as it grew shut)
      ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
      ctx.drawImage(h.cs.c, h.cs.X, h.cs.Y);
      ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
    }
    ctx.globalAlpha = a;
    if (h.grown) shutBase(x, y, h.key, w, h.grown, a); // (as far as it had grown shut)
    else ctx.drawImage(burrowSprite(h.v), x - w / 2, y - w / 2, w, w);
    ctx.globalAlpha = h.grown ? a * fill : a; // (grown shut, the plug comes in over its last opening)
    const sf = h.grown ? 1 : 0.3 + 0.7 * fill * (2 - fill); // (eased out; grown shut, it's packed already)
    ctx.drawImage(healPlugSprite(), x - w * sf / 2, y - w * sf / 2, w * sf, w * sf);
    if (h.grown) { shutMoss(x, y, h.key, w, h.grown, a); ctx.globalAlpha = a; } // (its moss on top of the plug)
    if (moss > 0) { const sm = 0.35 + 0.65 * moss * (2 - moss); ctx.globalAlpha = a * Math.min(1, moss * 2); ctx.drawImage(healMossSprite(h.v), x - w * sm / 2, y - w * sm / 2, w * sm, w * sm); }
    ctx.globalAlpha = 1;
  }
}
// The plug: sawdust packed into the hole, heaped a little over its rim.
const healPlugSprite = () => sprite('healPlug', '', drawHealPlug);
const drawHealPlug = g => {
  const c = CELL;
  g.fillStyle = 'rgba(60,36,14,0.4)'; g.beginPath(); g.ellipse(c * 0.03, c * 0.05, c * 0.3, c * 0.22, 0.4, 0, TAU); g.fill();
  g.fillStyle = '#c9a46a'; g.beginPath(); g.ellipse(0, 0, c * 0.29, c * 0.21, 0.4, 0, TAU); g.fill();
  g.fillStyle = '#e4c890';
  g.beginPath();
  for (const [px, py, r] of [[-0.08, -0.05, 0.1], [0.08, -0.02, 0.09], [0, 0.07, 0.08], [-0.15, 0.06, 0.06], [0.16, 0.08, 0.05]]) { g.moveTo(c * (px + r), c * py); g.arc(c * px, c * py, c * r, 0, TAU); }
  g.fill();
};
// The scar it leaves: a pale oval of packed sawdust gone grey, the grain
// healed across it.
const healScarSprite = v => sprite('healScar', v, drawHealScar);
const drawHealScar = (g, v) => {
  const c = CELL, rot = 0.4 + Number(v) * 0.15;
  g.fillStyle = 'rgba(206,180,136,0.55)'; g.beginPath(); g.ellipse(0, 0, c * 0.27, c * 0.19, rot, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(52,30,12,0.6)'; g.lineWidth = Math.max(1, c * 0.03);
  g.beginPath(); g.ellipse(0, 0, c * 0.27, c * 0.19, rot, 0, TAU); g.stroke();
  g.beginPath();
  for (const dx of [-0.1, 0.02, 0.12]) { g.moveTo(c * dx, -c * 0.17); g.lineTo(c * (dx + 0.02), c * 0.17); }
  g.stroke();
};
// Moss over it: a little cushion of the log's own moss (dark olive, never
// the apples' lime), its tufts run together, a shadow under it, each tuft
// lit on its upper left, and fuzz.
const healMossSprite = v => sprite('healMoss', v, drawHealMoss);
const drawHealMoss = (g, v) => {
  const c = CELL, n = Number(v) + 1, rnd = i => sinHash(n * 31 + i);
  const tufts = [[0, 0, 0.11]];
  for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + rnd(i) * 0.6, d = 0.09 + 0.08 * rnd(i + 20); tufts.push([Math.cos(a) * d * 1.15, Math.sin(a) * d * 0.85, 0.06 + 0.035 * rnd(i + 40)]); }
  tufts.sort((p, q) => p[1] - q[1]); // (back to front)
  const clump = (dx, dy, grow) => { g.beginPath(); for (const [x, y, r] of tufts) { g.moveTo(c * (x + dx + r + grow), c * (y + dy)); g.arc(c * (x + dx), c * (y + dy), c * (r + grow), 0, TAU); } };
  g.fillStyle = 'rgba(14,8,2,0.32)'; clump(0.02, 0.035, 0.01); g.fill();
  g.fillStyle = '#3a5520'; clump(0, 0, 0); g.fill();
  for (const [x, y, r] of tufts) {
    const lit = g.createRadialGradient(c * (x - r * 0.35), c * (y - r * 0.4), c * r * 0.1, c * x, c * y, c * r);
    lit.addColorStop(0, 'rgba(128,156,78,0.5)'); lit.addColorStop(0.55, 'rgba(90,120,48,0.12)'); lit.addColorStop(1, 'rgba(18,30,8,0.25)');
    g.fillStyle = lit; g.beginPath(); g.arc(c * x, c * y, c * r, 0, TAU); g.fill();
  }
  for (let i = 0; i < 26; i++) { // fuzz: tiny fronds, light and dark
    const [x, y, r] = tufts[i % tufts.length], a = rnd(i + 60) * TAU, d = r * (0.2 + 0.8 * rnd(i + 90));
    g.fillStyle = i % 2 ? 'rgba(126,154,76,0.5)' : 'rgba(24,40,12,0.45)';
    g.beginPath(); g.arc(c * (x + Math.cos(a) * d), c * (y + Math.sin(a) * d), c * (0.012 + 0.012 * rnd(i + 120)), 0, TAU); g.fill();
  }
};
// A burrow's cracks in a sprite of their own, made again only when they've
// grown (they grow a little each tick for about half a minute, then never):
// dark, with a lit lip along one side, thinning out.
const crackSprites = new Map(); // cell -> { grow, k, c (its canvas), X, Y (where it lands, in device px) }
function crackSprite(b, key, grow) {
  let s = crackSprites.get(key);
  if (s && s.grow === grow && s.k === k) return s;
  if (!s) crackSprites.set(key, s = { grow: -1, k: 0, c: null, X: 0, Y: 0 });
  const branches = cracksOf(b), c = CELL, m = 4; // (m: room for the lines' width and the lip)
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  for (const pts of branches) for (const [px, py] of pts) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
  const cx = (b.x + 0.5) * c * k, cy = (b.y + 0.5) * c * k;
  const X = Math.floor(cx + (x0 * c - m) * k), Y = Math.floor(cy + (y0 * c - m) * k);
  const w = Math.ceil(cx + (x1 * c + m) * k) - X, h = Math.ceil(cy + (y1 * c + m) * k) - Y;
  if (!s.c || s.c.width !== w || s.c.height !== h) s.c = makeLayer(w, h);
  const g = s.c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  g.setTransform(k, 0, 0, k, cx - X, cy - Y); // (the hole's centre at the origin)
  g.lineCap = g.lineJoin = 'round';
  for (const [col, off, lw] of CRACK_LINES) {
    g.strokeStyle = col;
    for (const pts of branches) {
      const shown = (pts.length - 1) * grow, thick = pts[0][0] || pts[0][1] ? 0.6 : 1;
      for (let j = 1; j <= Math.ceil(shown); j++) { // (tapering as it goes)
        const t = Math.min(1, shown - (j - 1)), [px, py] = pts[j - 1], [qx, qy] = pts[j];
        g.lineWidth = lw * thick * (1 - 0.75 * (j - 1) / (pts.length - 1));
        g.beginPath();
        g.moveTo(off + px * c, off + py * c);
        g.lineTo(off + (px + (qx - px) * t) * c, off + (py + (qy - py) * t) * c);
        g.stroke();
      }
    }
  }
  s.X = X; s.Y = Y; s.grow = grow; s.k = k;
  return s;
}
const CRACK_LINES = [['rgba(196,154,102,0.28)', 1.2, 1.6], ['rgba(14,7,2,0.7)', 0, 2.8]];
// A burrow's opening: splinters round the rim, the dark hole, sawdust.
const burrowSprite = v => sprite('burrow', v, drawBurrowHole);
const drawBurrowHole = (g, v) => {
  const c = CELL, seed = Number(v);
  g.fillStyle = 'rgba(214,180,128,0.55)';
  g.beginPath(); g.ellipse(0, 0, c * 0.3, c * 0.22, 0.4, 0, TAU); g.fill();
  const grad = g.createRadialGradient(0, 0, 1, 0, 0, c * 0.24);
  grad.addColorStop(0, '#050201');
  grad.addColorStop(0.75, '#1c1007');
  grad.addColorStop(1, '#3b2412');
  g.fillStyle = grad;
  g.beginPath(); g.ellipse(0, 0, c * 0.24, c * 0.16, 0.4, 0, TAU); g.fill();
  g.fillStyle = 'rgba(232,206,160,0.75)';
  for (let i = 0; i < 6; i++) {
    const a = i * 1.9 + seed;
    g.beginPath(); g.arc(Math.cos(a) * c * (0.34 + (i % 3) * 0.05), Math.sin(a) * c * (0.3 + (i % 2) * 0.06), 1.1 + (i % 2) * 0.5, 0, TAU); g.fill();
  }
};

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
