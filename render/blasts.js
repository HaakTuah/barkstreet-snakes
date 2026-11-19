// The renderer (see render/core.js): a snake going out with a pop: the
// starburst, its shockwave ring and the flying pieces.

// Out: it goes off with a pop. A comic starburst and a shockwave ring in
// its colour at its head (both inked, like everything else on the board), a
// burst of pieces from the head and along the body, and smoke. A rainbow
// (Star's, or Copycat's copy of it) goes off in its colours: the ring in
// six arcs round the rainbow, the pieces in pairs of them (in Star's
// stand-in colour in text, the ring and the pieces were gold and cream, a
// golden pickup's).
const blasts = []; // { x, y, at, color, bow (a rainbow's ramps, by hue, or null) }
function burst(s) {
  const col = colorOf(s), hex = col[0] === '#' ? col : '#f6ecd2', h = s.body[0], bow = bowOf(s);
  const hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2;
  blasts.push({ x: hx, y: hy, at: lastNow, color: hex, bow });
  if (bow) spawnBow(hx, hy, 26, 380, T.PARTICLE_LIFE * 1.3, 3.4, bow);
  else spawn(hx, hy, 26, 380, T.PARTICLE_LIFE * 1.3, 3.4, hex, '#fffbea');
  const fills = animOf(s, lastNow).fills;
  for (let i = 1; i < s.body.length; i += 2) {
    const c = s.body[i], f = fills[i];
    spawn(c.x * CELL + CELL / 2, c.y * CELL + CELL / 2, Math.max(2, Math.round(T.PARTICLES_DEATH / Math.ceil(s.body.length / 2))), 240, T.PARTICLE_LIFE * 1.2, 3, f && f[0] === '#' ? f : hex, '#a16207'); // (each piece its segment's colour as last drawn, as its beads)
  }
  for (let i = 0; i < 6; i++) mote(hx + (Math.random() - 0.5) * CELL, hy + (Math.random() - 0.5) * CELL, (Math.random() - 0.5) * 30, -18 - Math.random() * 18, 1400, 4 + Math.random() * 3, 2);
}
// n pieces in a rainbow's six colours, a pair at a time.
function spawnBow(x, y, n, speed, life, size, bow) {
  for (let j = 0; j < TWINKLE_HUES.length; j += 2) spawn(x, y, Math.ceil(n / 3), speed, life, size, bow(TWINKLE_HUES[j])[0], bow(TWINKLE_HUES[j + 1])[0]);
}
const BLAST_SPAN = 5; // (cells across the starburst's sprite)
const blastSprite = () => {
  let byVariant = sprites.get('blast');
  if (!byVariant) sprites.set('blast', byVariant = new Map());
  let sp = byVariant.get('');
  if (sp) return sp;
  const size = Math.max(2, Math.round(BLAST_SPAN * CELL * k));
  sp = makeLayer(size, size);
  const g = sp.getContext('2d'), scale = size / (BLAST_SPAN * CELL);
  g.setTransform(scale, 0, 0, scale, size / 2, size / 2);
  const burstPath = (r0, r1, n, twist) => { // (a star of n uneven points)
    g.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * TAU + twist, r = i % 2 ? r0 : r1 * (0.8 + 0.2 * ((i * 7) % 5) / 4);
      if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
  };
  g.lineJoin = 'round';
  burstPath(CELL * 1.25, CELL * 2.2, 11, 0.2);
  g.fillStyle = '#fb923c'; g.fill();
  g.lineWidth = CELL * 0.1; g.strokeStyle = '#3a2614'; g.stroke();
  burstPath(CELL * 0.8, CELL * 1.45, 9, 0.5);
  g.fillStyle = '#fed7aa'; g.fill(); // (pale orange: gold means a power)
  burstPath(CELL * 0.35, CELL * 0.75, 7, 0.9);
  g.fillStyle = '#fffbea'; g.fill();
  byVariant.set('', sp);
  return sp;
};
function drawBlasts(now) {
  for (let i = blasts.length - 1; i >= 0; i--) {
    const b = blasts[i], t = (now - b.at) / 480;
    if (t >= 1 || t < 0) { blasts.splice(i, 1); continue; }
    const grow = reduced ? 0.5 : t, pop = reduced ? 1 : 1 - (1 - Math.min(1, t * 2.5)) ** 3; // (it bursts out fast, then holds; with reduced motion, it's simply there, fading)
    const w = BLAST_SPAN * CELL * (0.5 + 0.55 * pop);
    ctx.globalAlpha = t < 0.55 ? 1 : (1 - t) / 0.45;
    ctx.drawImage(blastSprite(), b.x - w / 2, b.y - w / 2, w, w);
    ctx.globalAlpha = 1 - t; // the shockwave: an ink ring under one in its colour (a rainbow's: six arcs round it)
    const rr = CELL * (0.6 + 3.3 * grow);
    ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, TAU);
    ctx.strokeStyle = '#3a2614';
    ctx.lineWidth = 8 * (1 - t) + 3;
    ctx.stroke();
    ctx.lineWidth = 8 * (1 - t);
    if (b.bow) {
      ctx.lineCap = 'butt';
      for (let j = 0; j < TWINKLE_HUES.length; j++) {
        const a0 = (j / TWINKLE_HUES.length - 0.25) * TAU;
        ctx.beginPath(); ctx.arc(b.x, b.y, rr, a0, a0 + TAU / TWINKLE_HUES.length);
        ctx.strokeStyle = b.bow(TWINKLE_HUES[j])[0];
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = b.color;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
