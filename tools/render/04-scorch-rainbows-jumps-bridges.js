// Scorch: soot, not holes (no canopy or falling leaves: SnakeDebug.pinQuality(0)).
const soot = await ev(`(() => {
  seeds(32);
  SnakeDebug.pinQuality(0);
  const g = stage(['gobbler', 'ghost', 'mason']);
  const cells = [[10, 5], [11, 5], [12, 5], [10, 6], [11, 6], [12, 6], [11, 7], [5, 12]];
  show(g); drawN(10);
  const look = () => cells.map(([x, y]) => ({ mid: lum(pixels(x + 0.35, y + 0.35, 0.3, 0.3)), cell: lum(pixels(x, y, 1, 1)) }));
  const before = look();
  g.fires = new Map(cells.map(([x, y]) => [y * TUNING.GRID + x, { from: 0, until: 1e9 }])); g.tick++; drawN(3);
  g.fires = new Map(); g.tick++; drawN(150); // (the smoke cleared)
  const after = look();
  SnakeDebug.pinQuality(2);
  return cells.map((c, i) => ({ cell: +(after[i].cell / before[i].cell).toFixed(2), mid: +(after[i].mid / before[i].mid).toFixed(2) }));
})()`);
check(soot.every(s => s.cell >= 0.78), 'a burned cell is no more than a little darker', soot.map(s => s.cell).join(', '));
check(soot.every(s => s.mid >= 0.8 * s.cell), 'and not darkest in its middle (no dark disc)', soot.map(s => `${s.mid}/${s.cell}`).join(', '));

// A rainbow, upright from any apple, high or low (the arch hung upside
// down in the upper half once, then showed only its rising side from an
// apple near the middle, and rose only about a cell from one by the
// middle). Each apple's rainbow grown and glowing, and the
// same frame drawn again without it: in each column of cells from the
// apple to the far edge, the highest pixel it changed (its glow's outer
// edge) traces the arch. That's highest on the board (not cut off by the
// top edge), between the apple and the far edge, and lower on either
// side; and at its top, the reddest band is above the bluest.
const bows2 = await ev(`(() => {
  seeds(33);
  SnakeDebug.pinQuality(0);
  const out = [], c = document.getElementById('game'), k = c.width / (TUNING.GRID * ${CELL}), W = c.width;
  show(stage(['gobbler', 'ghost', 'mason'])); // (one board for them all)
  for (const [ax, ay] of [[1, 6], [6, 6], [11, 6], [12, 6], [17, 6], [22, 6], [6, 3], [17, 3], [1, 3], [22, 3], [3, 10], [20, 10], [1, 14], [11, 14], [12, 18], [6, 20], [17, 20], [3, 19], [11, 22], [22, 22]]) {
    drawN(5);
    R.onTick([{ type: 'rainbow', x: ax, y: ay }]); drawN(80); // (grown, and not fading yet)
    const on = c.getContext('2d').getImageData(0, 0, W, c.height).data;
    rainbow = null; __t -= 33; drawN(1);
    const off = c.getContext('2d').getImageData(0, 0, W, c.height).data;
    const d = (px, py, ch) => on[(py * W + px) * 4 + ch] - off[(py * W + px) * 4 + ch];
    const side = ax < TUNING.GRID / 2 ? 1 : -1, cols = [], tops = [];
    for (let cx = ax + side; cx >= 0 && cx < TUNING.GRID; cx += side) {
      const px = Math.round((cx + 0.5) * ${CELL} * k);
      let top = -1;
      for (let py = 0; py < c.height && top < 0; py++) if (Math.abs(d(px, py, 0)) + Math.abs(d(px, py, 1)) + Math.abs(d(px, py, 2)) > 30) top = py;
      if (top >= 0) { cols.push(cx); tops.push(+(top / (${CELL} * k)).toFixed(2)); }
    }
    const i = tops.indexOf(Math.min(...tops)), apex = cols[i], px = Math.round((apex + 0.5) * ${CELL} * k);
    let red = -1, blue = -1, rb = -1e9, br = -1e9;
    for (let py = Math.round(tops[i] * ${CELL} * k); py < Math.round((tops[i] + 3) * ${CELL} * k); py++) {
      const v = d(px, py, 0) - d(px, py, 2);
      if (v > rb) { rb = v; red = py; }
      if (-v > br) { br = -v; blue = py; }
    }
    out.push({ ax, ay, cols, tops, apex, top: tops[i], rises: tops.length > 2 && tops[0] > tops[i] + 0.3, falls: tops.length > 2 && tops[tops.length - 1] > tops[i] + 0.3, between: i > 0 && i < tops.length - 1, onBoard: tops[i] > 0, redOut: red >= 0 && red < blue });
  }
  SnakeDebug.pinQuality(2);
  return out;
})()`);
const bowSays = r => `apple ${r.ax},${r.ay}: top ${r.top} cells down at column ${r.apex}; from the apple, ${r.tops.join(' ')}`;
for (const r of bows2) check(r.onBoard && r.between && r.rises && r.falls && r.redOut, `a rainbow from an apple at ${r.ax},${r.ay} rises from it to its top on the board and down toward the far side, upright, red outermost`, bowSays(r) + (r.redOut ? '' : '; not red outermost'));
const mids = bows2.filter(r => r.ax === 11 || r.ax === 12), rise = r => +(r.ay + 0.5 - r.top).toFixed(2); // (to its glow's top, about 1.35 cells over the arch's middle: 2.25 when its centre was 1.15 boards down)
check(mids.every(r => rise(r) > 4.5), 'from an apple by the middle, high or low, a rainbow rises clearly before it comes down', mids.map(r => `${r.ax},${r.ay}: ${rise(r)} cells`).join(', '));

// Jumps you can see (round six A: a jump was mostly the head swelling).
// Your snake jumps Gobbler's body, lying one thick across its way, and
// then, golden, Gobbler's and Sniper's side by side; the jump asked for
// a tick ahead, as a press is, and drawn half a tick ahead, as the game
// draws it. At the top of the jump its neck is up behind its head, in an
// arch (wider than its body further back), and its shadow, left on the
// ground, falls across the body it hops (just below it and to the right,
// that body darkens: the shadow was drawn under every body). Two ticks
// on, its body still arches over what it crossed (the segment over it
// wider than the rest), over both for the golden jump. Lively, dust
// puffs where it takes off and rings where it lands, and a faint trail
// marks its way; with reduced motion, none of either, but the lift and
// the shadow still show.
await b.viewport(800, 800, { scale: 2 });
await ev('__settle()');
const jumps = await ev(`(() => {
  seeds(34);
  SnakeDebug.pinQuality(0);
  const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
  const green = (r, g, b) => g > 150 && g > r + 40 && g > b + 30, trail = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b > 140 && b > 110 && !green(r, g, b);
  const doStep = g => { for (const s of g.snakes) s.prev = s.body.map(c => ({ ...c })); E.step(g); g.food.length = 0; R.onTick(g.events); }; // (no food: an apple that turned up would pass for a body)
  const frame = al => { __t += 30; R.frame(al, __t); };
  const out = {};
  for (const still of [false, true]) for (const gold of [false, true]) {
    R.setReducedMotion(still);
    const g = stage(['gobbler', 'sniper', 'mason']), [you, gob, sn, ma] = g.snakes;
    for (const s of g.snakes) s.nextStarve = 1e15;
    setBody(ma, [[2, 22], [1, 22], [0, 22]], 'right'); ma.stunUntil = 1e9;
    setBody(sn, [[6, 22], [5, 22], [4, 22]], 'right'); sn.stunUntil = 1e9;
    setBody(you, Array.from({ length: 8 }, (_, i) => [9 - i, 12]), 'right'); you.leapReadyAt = 0;
    setBody(gob, Array.from({ length: 9 }, (_, i) => [10, 8 + i]), 'down'); gob.stunUntil = 1e9;
    if (gold) { setBody(sn, Array.from({ length: 9 }, (_, i) => [11, 16 - i]), 'up'); you.leaps = 2; }
    show(g); R.setViewer(99); R.setLead(0.5); drawN(10, 1); // (no rests round its head, nor halo: they'd pass for the trail)
    frame(0);
    const under0 = lum(pixels(9.62, 13.4, 0.76, 0.35)); // (the body it hops, below it, clear of its outline)
    E.leap(g, you);
    for (const al of [0.25, 0.5, 0.75]) frame(al);
    doStep(g);
    for (const al of [0, 0.25, 0.5]) frame(al); // (the top of the jump)
    const hx = R.headPx(you, 0.5, TUNING.GRID * ${CELL}, {}).x / ${CELL}; // (where its head's drawn: its neck's a cell behind, and measured just ahead of it, clear of the dust kicked up behind)
    const r = { under: +(lum(pixels(9.62, 13.4, 0.76, 0.35)) / under0).toFixed(2), neck: count(hx - 0.65, 11, 0.2, 2, green), back: count(hx - 3.65, 11, 0.2, 2, green), off: R.motes };
    doStep(g);
    frame(0.25); const m0 = R.motes;
    frame(0.5); // (down)
    r.ring = R.motes - m0;
    r.trail = count(9.85, 11.5, 1.5, 0.2, trail) + count(9.85, 13.3, 1.5, 0.2, trail);
    doStep(g); frame(0.5);
    r.cross = count(10.4, 11, 0.2, 2, green); r.cross2 = count(11.4, 11, 0.2, 2, green); r.flat = count(7.4, 11, 0.2, 2, green);
    out[(still ? 'reduced ' : '') + (gold ? 'golden' : 'plain')] = r;
  }
  R.setReducedMotion(false);
  R.setLead(0.5);
  SnakeDebug.pinQuality(2);
  return out;
})()`);
for (const [what, r] of Object.entries(jumps)) {
  const still = what.startsWith('reduced');
  check(r.neck > 1.12 * r.back && r.under < 0.96, `a ${what} jump: at its top its neck arches up behind its head, and its shadow falls across what it hops`,
    `its neck ${r.neck} pixels across, ${r.back} further back; the body under it, below and to the right, at ${r.under} of its brightness`);
  check(r.cross > 1.15 * r.flat && (!what.includes('golden') || r.cross2 > 1.15 * r.flat), `a ${what} jump: two ticks on, its body still arches over what it crossed`,
    `the segment over it ${r.cross}${what.includes('golden') ? ` and ${r.cross2}` : ''} pixels across, ${r.flat} on the bark`);
  if (still) check(r.off === 0 && r.ring === 0 && r.trail === 0, `a ${what} jump: no dust and no trail`, `${r.off} motes as it took off, ${r.ring} more as it landed; ${r.trail} trail pixels`);
  else check(r.off >= 4 && r.ring >= 8 && (what.includes('golden') || r.trail > 30), `a ${what} jump: dust puffs as it takes off and rings it as it lands, and a faint trail marks its way`,
    `${r.off} motes as it took off, ${r.ring} more as it landed${what.includes('golden') ? '' : `; ${r.trail} trail pixels beside its way`}`);
}

// Bridges you can see (round six A: a body over a hole looked as if it
// hovered). Sniper lies across a hollow three cells long (its body over
// the middle one) and Gobbler's tail lies over a hole, its head on the
// bark; each against the same body with no hole there, and the hollow
// against itself with nobody over it. Over the pit, the span is shaded
// underneath (its lower edge darker, its upper half as it was) and sags
// (narrower), and its shadow shows on the pit's floor, further off than
// on the bark: just below the span it's dark, in a floor lit round it
// (on the all but black floor, a shadow alone didn't show: the pit
// below it was barely darker); the tail hanging over the hole droops
// into it, darker.
const bridge = await ev(`(() => {
  seeds(38);
  SnakeDebug.pinQuality(0);
  const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
  const reddish = (r, g, b) => r > 120 && r > g + 50 && r > b + 40, body = (r, g, b) => r > 60 && r > g + 50 && r > b + 40; // (its red, lit; or in shade too, but not the pit's floor lit round it)
  const g = stage(['sniper', 'gobbler', 'mason']), [you, sn, gob, ma] = g.snakes;
  setBody(you, [[2, 22], [1, 22], [0, 22]], 'right'); you.stunUntil = 1e9;
  setBody(ma, [[2, 2], [1, 2], [0, 2]], 'right'); ma.stunUntil = 1e9;
  const HOLES = [11 * 24 + 10, 12 * 24 + 10, 13 * 24 + 10, 5 * 24 + 18];
  const look = () => ({ width: count(10.45, 11.3, 0.1, 2.4, body), edge: lum(pixels(10.3, 12.7, 0.4, 0.14)), top: lum(pixels(10.3, 12.16, 0.4, 0.14)), shade: lum(pixels(10.3, 12.9, 0.4, 0.25)), lit: lum(pixels(10.3, 13.3, 0.4, 0.2)), tail: lum(pixels(18.3, 5.3, 0.4, 0.4)),
    band: lum(pixels(10.12, 12.75, 0.15, 0.06)), bandTop: lum(pixels(10.12, 12.24, 0.15, 0.08)) }); // (shade: just below the span; lit: the floor a little further; band: the lower edge of the band into it, between the segments)
  const place = () => { setBody(sn, Array.from({ length: 8 }, (_, i) => [13 - i, 12]), 'right'); sn.stunUntil = 1e9; setBody(gob, [[15, 5], [16, 5], [17, 5], [18, 5]], 'left'); gob.stunUntil = 1e9; };
  for (const k of HOLES) g.holes.add(k);
  place(); show(g); drawN(10, 1);
  const over = look();
  setBody(sn, Array.from({ length: 8 }, (_, i) => [13 - i, 20]), 'right'); setBody(gob, [[15, 8], [16, 8], [17, 8], [18, 8]], 'left');
  g.tick++; drawN(4, 1);
  const empty = look();
  for (const k of HOLES) g.holes.delete(k);
  place(); g.tick++; drawN(4, 1);
  const bark = look();
  SnakeDebug.pinQuality(2);
  return { over, empty, bark };
})()`);
const { over, empty, bark } = bridge, f2 = v => v.toFixed(2);
check(over.edge / over.top < 0.85 * bark.edge / bark.top && over.band / over.bandTop < 0.92 * bark.band / bark.bandTop && over.width < 0.93 * bark.width, 'a body over a pit is shaded underneath, the bands between its segments too, and sags between the rims',
  `its lower edge at ${f2(over.edge / over.top)} of its upper half's brightness (${f2(bark.edge / bark.top)} on the bark), the band's ${f2(over.band / over.bandTop)} (${f2(bark.band / bark.bandTop)}); ${over.width} pixels across, ${bark.width} on the bark`);
check(over.shade < 0.6 * over.lit && over.lit > 1.5 * empty.lit, 'its shadow shows on the pit’s floor: dark just below it, in a floor lit round it',
  `just below it ${f2(over.shade)}, the floor a little further ${f2(over.lit)} (${f2(empty.lit)} with nobody over the pit)`);
check(over.tail < 0.75 * bark.tail, 'a tail end over a hole droops into it, darker', `at ${f2(over.tail / bark.tail)} of its brightness on the bark`);

// ...and its outline as smooth over the pit as on the bark (the owner,
// 20 October: "The part of you that is over the hole gets a really odd
// outline": slimmer there, its round segments bulged above its line, a
// bead on a rod, and its cream rim seemed to go). You across a hollow
// three cells wide: along the middle of it, the top of your body is
// level (no segment standing above the bands between), and your cream
// rim runs unbroken over it, as thick as on the bark.
const line = await ev(`(() => {
  seeds(39);
  SnakeDebug.pinQuality(0);
  const g = stage(['sniper', 'gobbler', 'mason']), [you, ...rest] = g.snakes;
  rest.forEach((s, i) => { setBody(s, [[2, 2 + 3 * i], [1, 2 + 3 * i], [0, 2 + 3 * i]], 'right'); s.stunUntil = 1e9; });
  const HOLES = []; for (let y = 16; y <= 18; y++) for (let x = 9; x <= 11; x++) HOLES.push(y * 24 + x);
  const green = (d, i) => d[i + 1] > d[i] + 40 && d[i + 1] > d[i + 2] + 30, cream = (d, i) => d[i] > 235 && d[i + 1] > 230 && d[i + 2] > 215;
  const look = () => { // (along x 9.6 to 11.4: the spread of the body's top edge, and the thinnest cream above it, in cells)
    const p = pixels(9.6, 16.6, 1.8, 0.9), d = p.data, ppc = p.width / 1.8;
    let lo = Infinity, hi = -Infinity, rim = Infinity;
    for (let x = 0; x < p.width; x++) {
      let top = -1, c = 0;
      for (let y = 0; y < p.height; y++) { const i = 4 * (y * p.width + x); if (green(d, i)) { top = y; break; } if (cream(d, i)) c++; }
      if (top < 0) return null;
      lo = Math.min(lo, top); hi = Math.max(hi, top); rim = Math.min(rim, c);
    }
    return { spread: (hi - lo) / ppc, rim: rim / ppc };
  };
  const place = () => { setBody(you, Array.from({ length: 9 }, (_, i) => [14 - i, 17]), 'right'); you.stunUntil = 1e9; };
  for (const k of HOLES) g.holes.add(k);
  place(); show(g); drawN(10, 1);
  const over = look();
  // (your head over the pit, your neck on the bark: no band wider than either of its segments, so no square shoulder by a round head)
  setBody(you, Array.from({ length: 9 }, (_, i) => [10 - i, 17]), 'right'); g.tick++; drawN(4, 1);
  const a = anim.get(you); let wide = 0; for (let i = 0; i < a.n - 1; i++) wide = Math.max(wide, bandR(a, i) - Math.min(a.rad[i], a.rad[i + 1]));
  over.wide = a.bridging ? wide : NaN;
  for (const k of HOLES) g.holes.delete(k);
  place(); g.tick++; drawN(4, 1);
  const bark = look();
  SnakeDebug.pinQuality(2);
  return { over, bark };
})()`);
check(line.over && line.bark && line.over.spread <= 0.02 + 0.25 * line.bark.spread && line.over.rim >= 0.75 * line.bark.rim && line.over.wide <= 1e-3, 'over a pit your outline stays smooth: no segment bulging above the body’s line, the cream rim unbroken, and no band wider than its segments (a head over it stays round)',
  line.over && line.bark ? `its top edge varies ${f2(line.over.spread)} cells over the pit (${f2(line.bark.spread)} on the bark); its cream rim at least ${f2(line.over.rim)} cells (${f2(line.bark.rim)}); bands at most ${f2(line.over.wide)} units wider than a segment, head over the pit` : `no body found ${JSON.stringify(line)}`);
