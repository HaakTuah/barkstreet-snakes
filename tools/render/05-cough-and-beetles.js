// Choking and the cough (round six A), staged as the engine reports them
// (the choke and nudge events, s.coughUntil). Joker chokes on its own
// bead right in front of it and spits it aside: its cheeks puff out for
// a moment (its white face wider across) with the bead in its mouth,
// none of it drawn (over its face, on a phone, the bead was the whole
// head); then it's spat out of its cheek on the side it lands, never
// over its face, up off its shadow on the ground, and lands where it went.
// Gobbler coughs with an apple right ahead: its mouth stays shut (it
// gapes at food otherwise) and puffs of breath come out past it, with
// reduced motion too. Food a coughing head nudges rolls there (half way,
// it's between the cells), and a beetle scurries. Every count and centre
// is of pixels the snakes and food changed: against the same board with
// nobody near and nothing on it (the same log under it), so none depends
// on the bark (a knot's ink beside Joker's face passed for its cheeks).
const choke = await ev(`(() => {
  seeds(40);
  SnakeDebug.pinQuality(0);
  const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
  const g = stage(['joker', 'gobbler', 'mason']), [you, jo, gob, ma] = g.snakes;
  // The bare board: everyone still along the bottom row, where stage() put them, no food. (Shown again, below, it gets the same log.)
  show(g); R.setViewer(99); drawN(20, 0.5);
  const cv = document.getElementById('game'), W = cv.width, kk = W / (TUNING.GRID * ${CELL}), bare = cv.getContext('2d').getImageData(0, 0, W, cv.height).data;
  const changed = (x, y, w, h, is, each) => { // (each pixel in the box that passes is() and isn't what the bare board has there)
    const p = pixels(x, y, w, h), d = p.data, px = Math.round(x * ${CELL} * kk), py = Math.round(y * ${CELL} * kk);
    for (let i = 0; i < d.length; i += 4) {
      const col = (i / 4) % p.width, row = Math.floor(i / 4 / p.width), j = ((py + row) * W + px + col) * 4;
      if (is(d[i], d[i + 1], d[i + 2]) && Math.abs(d[i] - bare[j]) + Math.abs(d[i + 1] - bare[j + 1]) + Math.abs(d[i + 2] - bare[j + 2]) > 24) each(col, row);
    }
    return p;
  };
  const count = (x, y, w, h, is) => { let n = 0; changed(x, y, w, h, is, () => n++); return n; };
  const centre = (x, y, w, h, is) => { let n = 0, sx = 0, sy = 0; const p = changed(x, y, w, h, is, (c, r) => { n++; sx += c; sy += r; }); return n ? [+(x + sx / n / p.width * w).toFixed(2), +(y + sy / n / p.height * h).toFixed(2)] : null; };
  const sky = (r, g, b) => b > 200 && g > 150 && r < 120, face = (r, g, b) => Math.min(r, g, b) > 215 || Math.max(r, g, b) < 40, mouth = (r, g, b) => r > 40 && r < 90 && g < 30 && b < 30, darker = (r, g, b) => r + g + b < 160;
  const lime = (r, g, b) => g > 150 && r > 100 && r < 170 && b < 60, emerald = (r, g, b) => g > 110 && g > r + 60 && b > 80 && b < g;
  const pale = (r, g, b) => Math.min(r, g, b) > 200 && b > 180;
  const out = {};
  setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
  setBody(jo, Array.from({ length: 6 }, (_, i) => [8 - i, 8]), 'right');
  setBody(gob, Array.from({ length: 6 }, (_, i) => [8 - i, 16]), 'right');
  setBody(ma, Array.from({ length: 6 }, (_, i) => [16, 6 - i]), 'down');
  g.food.push({ x: 8, y: 10, kind: 'pellet', color: '#38bdf8', owner: jo.id, expires: g.tick + 900 }); // (sky: nothing else here is)
  g.food.push({ x: 10, y: 16, kind: 'food', expires: g.tick + 900 });
  g.food.push({ x: 15, y: 12, kind: 'food', expires: g.tick + 900 });
  g.food.push({ x: 4, y: 12, kind: 'beetle', dir: E.DIRS.right, movedAt: g.tick - 50, expires: g.tick + 900 });
  show(g); R.setViewer(99); drawN(20, 0.5); // (half way through the tick, drawn at its cells: nobody's moving)
  { // (the bark far from everyone, cells 19 to 23 across, 8 to 10 down, is just as it was bare: the same log)
    const x0 = Math.round(19 * ${CELL} * kk), y0 = Math.round(8 * ${CELL} * kk), w = W - x0, d = cv.getContext('2d').getImageData(x0, y0, w, Math.round(3 * ${CELL} * kk)).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) { const j = ((y0 + Math.floor(i / 4 / w)) * W + x0 + (i / 4) % w) * 4; if (d[i] !== bare[j] || d[i + 1] !== bare[j + 1] || d[i + 2] !== bare[j + 2]) n++; }
    if (n) throw new Error('the choke board’s bark far from everyone isn’t as it was bare (' + n + ' pixels): its counts would be against another log');
  }
  // (each measured from where its head's drawn that frame, as it eases out of the move the drawing guessed it'd make)
  const cheeks = () => { const [x, y] = at(jo); return count(x + 0.05, y - 0.8, 0.6, 0.24, face); }; // (white or ink, just past its face, on the side the bead doesn't fly over)
  const shut = () => { const [x, y] = at(gob); return count(x, y - 0.4, 0.8, 0.8, mouth); }, puffed = () => { const [x, y] = at(gob); return count(x + 0.45, y - 0.6, 1.2, 1.2, pale); };
  const orange = (r, g, b) => r > 200 && g > 100 && g < 190 && b < 110, front = () => { const [x, y] = at(gob); let m = -1; const p = changed(x - 0.5, y - 0.6, 1.4, 1.2, orange, c => { m = Math.max(m, c); }); return m < 0 ? null : x - 0.5 + (m + 1) / p.width * 1.4; }; // (how far its head reaches ahead, cells)
  out.before = { cheeks: cheeks(), mouth: shut() };
  g.tick++;
  jo.coughUntil = g.tick + 9; gob.coughUntil = g.tick + 9;
  R.onTick([{ type: 'choke', snake: jo, x: 9, y: 8, tx: 8, ty: 10 }, { type: 'nudge', snake: ma, kind: 'food', x: 16, y: 13, tx: 15, ty: 12 }, { type: 'nudge', snake: ma, kind: 'beetle', x: 5, y: 12, tx: 4, ty: 12 }]);
  const [hx, hy] = at(jo), onFace = () => count(hx - 0.35, hy - 0.35, 0.7, 0.7, sky); // (its eyes and snout)
  drawN(1, 0.05, 80);
  out.gag = { cheeks: cheeks(), bead: count(6.5, 6.5, 4, 5, sky) };
  drawN(1, 0.5, 80); // (half way: 160 ms)
  const bead = centre(7.5, 7.5, 3, 4, sky);
  out.mid = { bead, face: onFace(), shadow: bead && centre(bead[0] - 0.5, bead[1] + 0.5, 1, 0.8, darker), apple: centre(14.2, 11.2, 3, 3, lime), beetle: centre(3, 11, 3, 2, emerald) }; // (its shadow on the ground: below where its ink rim reaches)
  g.tick++; drawN(4, 0.5, 80); // (the next tick: all of it there)
  out.end = { bead: centre(7.5, 7.5, 3, 4, sky), apple: centre(14.2, 11.2, 3, 3, lime), beetle: centre(3, 11, 3, 2, emerald) };
  let reach = 0;
  const puffs = () => { let n = 0; reach = 0; for (let i = 0; i < 10; i++) { drawN(1, 0.5, 30); n = Math.max(n, puffed()); reach = Math.max(reach, front()); } return n; };
  out.cough = { mouth: shut(), puffs: puffs(), reach };
  R.setReducedMotion(true);
  out.still = { puffs: puffs(), reach };
  R.setReducedMotion(false);
  gob.coughUntil = -1; g.tick++; drawN(10, 0.5, 30);
  out.after = { mouth: shut(), puffs: puffed(), reach: front() };
  out.cellPx = Math.round((W / TUNING.GRID) ** 2);
  SnakeDebug.pinQuality(2);
  return out;
})()`);
const between = (c, x0, y0, x1, y1) => !!c && Math.min(x0, x1) + 0.1 < c[0] && c[0] < Math.max(x0, x1) - 0.1 && Math.min(y0, y1) - 0.05 < c[1] && c[1] < Math.max(y0, y1) + 0.05;
const bead = choke.mid.bead, shade = choke.mid.shadow;
check(choke.gag.cheeks > choke.before.cheeks + 8 && choke.gag.bead === 0 && between(bead, 8.3, 8.9, 9.6, 10.5) && choke.mid.face === 0 && !!shade && shade[1] - bead[1] > 0.45 && !!choke.end.bead && Math.abs(choke.end.bead[0] - 8.5) < 0.12 && Math.abs(choke.end.bead[1] - 10.5) < 0.2,
  'choking on its own bead, its cheeks puff out with the bead in its mouth, then it spits it aside out of its cheek, never over its face, up in a little arc, to land where it went',
  `its face just past its cheeks ${choke.before.cheeks} pixels, then ${choke.gag.cheeks} as it gags, the bead's ${choke.gag.bead} pixels drawn then; half way at ${bead?.slice(0, 2)}, ${choke.mid.face} over its face, its shadow on the ground at y ${shade?.[1]}; then at ${choke.end.bead}`);
check(choke.before.mouth > 20 && choke.cough.mouth * 3 < choke.before.mouth && choke.after.mouth > 20 && choke.cough.puffs > 10 && choke.still.puffs > 10 && choke.after.puffs === 0, 'coughing, its mouth stays shut and puffs of breath come out past it (with reduced motion too)',
  `Gobbler’s mouth, an apple right ahead: ${choke.before.mouth} pixels open, ${choke.cough.mouth} coughing, ${choke.after.mouth} after; puffs ${choke.cough.puffs}, with reduced motion ${choke.still.puffs}, after ${choke.after.puffs}`);
const jolt = choke.cough.reach - choke.after.reach, calmJolt = choke.still.reach - choke.after.reach;
check(choke.cough.puffs > 0.1 * choke.cellPx && choke.still.puffs > 0.1 * choke.cellPx && jolt > 0.09 && Math.abs(calmJolt) < 0.03, 'a cough reads at a phone’s size: a puff a good part of a cell, the head jolting forward with it (with reduced motion, no jolt)',
  `the puff at its biggest ${(choke.cough.puffs / choke.cellPx).toFixed(2)} of a cell (${(choke.still.puffs / choke.cellPx).toFixed(2)} with reduced motion); the head’s front ${jolt.toFixed(2)} cells further forward at a cough (${calmJolt.toFixed(2)} with reduced motion)`);
check(between(choke.mid.apple, 15.5, 12.5, 16.5, 13.5) && !!choke.end.apple && Math.abs(choke.end.apple[0] - 15.5) < 0.15 && between(choke.mid.beetle, 4.5, 12.5, 5.5, 12.5) && !!choke.end.beetle && Math.abs(choke.end.beetle[0] - 4.5) < 0.15,
  'food a coughing head nudges rolls aside, and a beetle scurries', `the apple half way at ${choke.mid.apple}, then ${choke.end.apple}; the beetle ${choke.mid.beetle}, then ${choke.end.beetle}`);

// Beetles and the woodpecker's knock (round six A), staged as the engine
// reports them: two beetles out at once; b.digUntil and the dig and dive
// events; the woodpecker's mark and the knock events, to where the
// engine's knocks says (the strike's own list). Two beetles: one walks on, a cell every other
// tick, and both are drawn every frame; the other, cornered, digs in:
// smaller as it goes down, a collar of sawdust round it, sawdust spraying
// off it to the end; gone (its dive), its bore is left a burrow, as the
// engine leaves it (BURROW_FROM_DIG): freshly bored at first (raw pale
// wood and sawdust round its hole, far more than an ordinary burrow has),
// and a few seconds later as an ordinary one, its hole open all along.
// With reduced motion: no spray, and it's drawn sunk part way, still. A
// dug dive that leaves no burrow leaves nothing (no heap without a
// burrow). A burrow closing over: half way, its hole is stopped up with
// sawdust and moss is over it; a second on, the bark is as it was (with
// reduced motion, filled and mossed at once). Through the aim, food in the mark trembles
// and food outside it doesn't, and a ring marks where the rule will knock
// each piece (one for each); at the strike it flies there, up in an arc, rimmed in ink and
// parchment over whatever it crosses (a longer throw higher, and longer in the air), and a beetle knocked scurries
// there. Counts and centres are of pixels changed against the bare
// board, as the choke's are.
const dug = await ev(`(() => {
  seeds(41);
  SnakeDebug.pinQuality(0);
  const N = TUNING.GRID;
  const cv = document.getElementById('game'), W = cv.width, kk = W / (N * ${CELL});
  let bare = null;
  const bareNow = () => { bare = cv.getContext('2d').getImageData(0, 0, W, cv.height).data; };
  const changed = (x, y, w, h, is, each) => {
    const p = pixels(x, y, w, h), d = p.data, px = Math.round(x * ${CELL} * kk), py = Math.round(y * ${CELL} * kk);
    for (let i = 0; i < d.length; i += 4) {
      const col = (i / 4) % p.width, row = Math.floor(i / 4 / p.width), j = ((py + row) * W + px + col) * 4;
      if (is(d[i], d[i + 1], d[i + 2]) && Math.abs(d[i] - bare[j]) + Math.abs(d[i + 1] - bare[j + 1]) + Math.abs(d[i + 2] - bare[j + 2]) > 24) each(col, row);
    }
    return p;
  };
  const count = (x, y, w, h, is) => { let n = 0; changed(x, y, w, h, is, () => n++); return n; };
  const centre = (x, y, w, h, is) => { let n = 0, sx = 0, sy = 0; const p = changed(x, y, w, h, is, (c, r) => { n++; sx += c; sy += r; }); return n ? [+(x + sx / n / p.width * w).toFixed(2), +(y + sy / n / p.height * h).toFixed(2)] : null; };
  const emerald = (r, g, b) => g > 110 && g > r + 60 && b > 80 && b < g, green = (r, g, b) => g > r + 25 && g > 50 && b < g, tan = (r, g, b) => r > 170 && g > 125 && b > 70 && b < 175 && r > b + 45;
  const sky = (r, g, b) => b > 200 && g > 150 && r < 120, paler = (r, g, b) => r > 150 && g > 130 && b > 95, parch = (r, g, b) => Math.min(r, g, b) > 228;
  const raw = (r, g, b) => r > 165 && g > 130 && r > b + 25, dark = (r, g, b) => r + g + b < 90, olive = (r, g, b) => g > r + 12 && g > b + 25 && r < 120, any = () => true;
  const out = { a: [], b: [], drawn: [], collar: [], parts: [], cellPx: Math.round((W / N) * (W / N)) };
  // Two beetles, one digging in.
  const g = stage(['mason', 'ghost', 'drab']);
  show(g); R.setViewer(99); drawN(20, 0.5); bareNow();
  const A = { x: 5, y: 6, kind: 'beetle', dir: E.DIRS.right, movedAt: g.tick - 50, expires: g.tick + 900 };
  const B = { x: 15, y: 6, kind: 'beetle', dir: E.DIRS.up, movedAt: g.tick - 50, expires: g.tick + 900, scared: true, digUntil: g.tick + TUNING.BEETLE_DIG };
  g.food.push(A, B);
  g.burrows.push({ x: 20, y: 10, at: g.tick, used: g.time }); // (an ordinary one, to hold the dug one up against)
  show(g); R.setViewer(99); drawN(8, 0.5, 30);
  out.full = count(14, 5, 3, 3, emerald);
  R.onTick([{ type: 'dig', x: 15, y: 6, until: B.digUntil }]);
  for (let t = 0; t < TUNING.BEETLE_DIG; t++) { // (the whole dig, tick by tick)
    if (t) { g.tick++; if (t % 2 === 0) { A.px = A.x; A.py = A.y; A.x++; A.movedAt = g.tick - 1; } R.onTick([]); }
    for (const al of [0.25, 0.5, 0.75, 1]) {
      __t += 30; R.frame(al, __t);
      out.a.push(count(A.x - 1.5, 5, 3, 3, emerald)); out.b.push(count(14, 5, 3, 3, emerald)); out.drawn.push(count(14, 5, 3, 3, green)); out.collar.push(count(14, 5, 3, 3, tan)); out.parts.push(R.particles);
    }
  }
  g.tick++; g.food.splice(g.food.indexOf(B), 1);
  g.burrows.push({ x: 15, y: 6, at: g.tick, used: g.time, dug: 1 }); // (its bore, left a burrow, as the engine does)
  R.onTick([{ type: 'dive', x: 15, y: 6, dug: 1 }, { type: 'burrow', x: 15, y: 6, dug: 1 }]);
  drawN(12, 0.5, 40);
  out.fresh = { raw: count(14.85, 5.85, 1.3, 1.3, raw), hole: count(15.3, 6.3, 0.4, 0.4, dark), plain: count(19.85, 9.85, 1.3, 1.3, raw), bugGone: count(14, 5, 3, 3, emerald) };
  drawN(60, 0.5, 80); // (4.8 s on)
  out.settled = { raw: count(14.85, 5.85, 1.3, 1.3, raw), hole: count(15.3, 6.3, 0.4, 0.4, dark), plain: count(19.85, 9.85, 1.3, 1.3, raw) };
  // With reduced motion: no spray, a still sink.
  R.setReducedMotion(true);
  const C = { x: 10, y: 15, kind: 'beetle', dir: E.DIRS.up, movedAt: g.tick - 50, expires: g.tick + 900, scared: true, digUntil: g.tick + TUNING.BEETLE_DIG };
  g.food.push(C); drawN(10, 0.5, 60); // (the sprays before it, settled)
  out.calm = { parts: [], bug: [] };
  R.onTick([{ type: 'dig', x: 10, y: 15, until: C.digUntil }]);
  for (let t = 0; t < TUNING.BEETLE_DIG - 1; t++) { g.tick++; R.onTick([]); drawN(2, 0.5, 60); out.calm.parts.push(R.particles); out.calm.bug.push(count(9, 14, 3, 3, emerald)); }
  R.setReducedMotion(false);
  // The knock: a bead and a beetle in the mark, another bead outside it.
  const g2 = stage(['mason', 'ghost', 'drab']);
  show(g2); R.setViewer(99); drawN(20, 0.5); bareNow();
  const P = [];
  for (let y = 11; y <= 13; y++) for (let x = 10; x <= 13; x++) P.push(y * N + x);
  const bead = { x: 11, y: 12, kind: 'pellet', color: '#38bdf8', owner: 1, expires: g2.tick + 900 }, other = { x: 4, y: 4, kind: 'pellet', color: '#38bdf8', owner: 1, expires: g2.tick + 900 };
  const bug = { x: 13, y: 11, kind: 'beetle', dir: E.DIRS.up, movedAt: g2.tick - 50, expires: g2.tick + 900 };
  g2.food.push(bead, other, bug);
  g2.time = 130000;
  g2.woodpecker = { x: 11.5, y: 12, at: g2.time - 5000, target: P, strikeAt: g2.tick + 4, last: [], struckAt: -1, restUntil: 1e9, pecks: 1 };
  show(g2); R.setViewer(99); drawN(25, 0.5, 30); // (the food popped in)
  const spots = [[], []];
  for (let i = 0; i < 8; i++) { drawN(1, 0.5, 23); spots[0].push(centre(10, 11, 3, 3, sky)); spots[1].push(centre(3, 3, 3, 3, sky)); }
  const spread = list => list.every(Boolean) ? +(Math.max(...list.map(c => c[0])) - Math.min(...list.map(c => c[0]))).toFixed(3) : -1; // (across: a bead bobs up and down where it lies, in or out of the mark)
  out.tremble = spread(spots[0]); out.steady = spread(spots[1]);
  const cell = c => c && (typeof c === 'number' ? [c % N, Math.floor(c / N)] : Array.isArray(c) ? c : [c.x, c.y]);
  const [tx, ty] = cell(E.knockTo(g2, 11, 12, P));
  out.to = [tx, ty];
  out.ring = count(tx - 0.2, ty - 0.2, 1.4, 1.05, paler); out.noRing = count(18, 18, 1.4, 1.05, paler); // (clear of the mark's own rim, a cell below)
  out.rings = E.knocks(g2, P).filter(({ to }) => to && count(to.x - 0.2, to.y - 0.2, 1.4, 1.05, paler) > 10).length; // (one for each piece in the mark)
  // On the aim's last tick, the engine's promise (w.landings): the bead's ring where it was promised (a free cell
  // nothing else is drawn on), though the rule as the board stands would put it elsewhere; the beetle's by the rule.
  const free = ([x, y]) => !g2.snakes.some(s => s.alive && s.body.some(c => c.x === x && c.y === y)) && !g2.food.some(f => f.x === x && f.y === y) && count(x - 0.2, y - 0.2, 1.4, 1.05, paler) === 0;
  const vow = [[18, 16], [16, 18], [18, 20], [20, 18], [20, 6]].find(free);
  g2.woodpecker.landings = [[12 * N + 11, vow[1] * N + vow[0]]];
  g2.tick++; drawN(2, 0.5, 30);
  out.promised = { at: vow, ring: count(vow[0] - 0.2, vow[1] - 0.2, 1.4, 1.05, paler), rule: count(tx - 0.2, ty - 0.2, 1.4, 1.05, paler),
    rings: E.knocks(g2, P, g2.woodpecker.landings).filter(({ to }) => to && count(to.x - 0.2, to.y - 0.2, 1.4, 1.05, paler) > 10).length };
  out.promised.ruleIsBeetles = E.knocks(g2, P, g2.woodpecker.landings).some(({ food, to }) => food === bug && to && to.x === tx && to.y === ty);
  delete g2.woodpecker.landings;
  for (const k of P) g2.holes.add(k);
  g2.woodpecker.target = []; g2.woodpecker.struckAt = g2.tick;
  bead.x = tx; bead.y = ty;
  const [bx, by] = cell(E.knockTo(g2, 13, 11, P));
  bug.px = 13; bug.py = 11; bug.x = bx; bug.y = by; bug.movedAt = g2.tick;
  g2.tick++;
  R.onTick([{ type: 'knock', kind: 'pellet', x: 11, y: 12, tx, ty }, { type: 'knock', kind: 'beetle', x: 13, y: 11, tx: bx, ty: by }]);
  drawN(1, 0.05, 1);
  drawN(1, 0.5, 225); // (about half way through its flight)
  const mid = centre(9, 7, 5, 7, sky);
  out.mid = { bead: mid, beetle: centre(12, 10, 4, 3, emerald), rim: mid ? count(mid[0] - 0.6, mid[1] - 0.6, 1.2, 1.2, parch) : 0 };
  drawN(4, 0.5, 120); g2.tick++; drawN(2, 0.5, 60);
  const end = centre(9, 7, 5, 7, sky);
  out.end = { bead: end, beetle: centre(12, 10, 4, 3, emerald), rim: end ? count(end[0] - 0.6, end[1] - 0.6, 1.2, 1.2, parch) : 0, bug: [bx, by] };
  // A longer throw is in the air longer and flies higher: a bead knocked a cell, then one knocked 4, each
  // followed through its flight (its centre every 30 ms; up is less y).
  out.throws = [];
  for (const D of [1, 4]) {
    drawN(10, 0.5, 60); bareNow();
    const f = { x: 3 + D, y: 17, kind: 'pellet', color: '#38bdf8', owner: 1, expires: g2.tick + 900 };
    g2.food.push(f); g2.tick++;
    R.onTick([{ type: 'knock', kind: 'pellet', x: 3, y: 17, tx: f.x, ty: f.y }]);
    const path = [];
    for (let i = 0; i < 26; i++) { drawN(1, 0.5, 30); path.push(centre(2, 14, 9, 4.5, sky)); }
    const at = c => !!c && Math.abs(c[0] - (f.x + 0.5)) < 0.15 && Math.abs(c[1] - 17.5) < 0.15;
    let landed = path.length; while (landed > 0 && at(path[landed - 1])) landed--;
    out.throws.push({ D, top: Math.min(...path.filter(Boolean).map(c => c[1])), landsBy: 30 * (landed + 1), down: at(path[path.length - 1]) });
    g2.food.splice(g2.food.indexOf(f), 1); g2.tick++; R.onTick([]);
  }
  // No heap without a burrow: a dug dive that leaves none (BURROW_FROM_DIG off) leaves nothing, once the collar's closed.
  // Then a burrow closing over, and one with reduced motion.
  const g3 = stage(['mason', 'ghost', 'drab']);
  show(g3); R.setViewer(99); drawN(20, 0.5); bareNow();
  R.onTick([{ type: 'dive', x: 10, y: 15, dug: 1 }]);
  drawN(3, 0.5, 40); out.noHeap = { during: count(9, 14, 3, 3, any) };
  drawN(15, 0.5, 40); out.noHeap.after = count(9, 14, 3, 3, any);
  const H = { x: 6, y: 15, at: g3.tick - 400, used: 0 }, H2 = { x: 17, y: 15, at: g3.tick - 400, used: 0 };
  g3.burrows.push(H, H2); drawN(25, 0.5, 40);
  const healAt = (x, y) => ({ hole: count(x - 0.2, y - 0.2, 0.4, 0.4, dark), dust: count(x - 0.25, y - 0.2, 0.5, 0.4, (r, g, b) => tan(r, g, b) || olive(r, g, b)), plug: count(x - 0.5, y - 0.5, 1, 1, tan), moss: count(x - 0.5, y - 0.5, 1, 1, olive), all: count(x - 1.5, y - 1.5, 3, 3, any) });
  out.heal = { before: healAt(6.5, 15.5) };
  g3.burrows.splice(0, 1); g3.tick++;
  R.onTick([{ type: 'heal', x: 6, y: 15 }]);
  drawN(1, 0.5, 33); out.heal.start = healAt(6.5, 15.5);
  drawN(13, 0.5, 33); out.heal.mid = healAt(6.5, 15.5); // (about 0.46 s)
  drawN(30, 0.5, 33); out.heal.end = healAt(6.5, 15.5); // (about 1.45 s: its scar)
  drawN(70, 0.5, 300); out.heal.gone = healAt(6.5, 15.5); // (about 22 s: the scar's gone too)
  // A burrow growing shut: its opening shrinking as sawdust and moss come in over the 6 to 14 s.
  const H3 = { x: 12, y: 15, at: g3.tick - 400, used: 0 };
  g3.burrows.push(H3); g3.tick++; R.onTick([]); drawN(25, 0.5, 40);
  out.shut = { open: healAt(12.5, 15.5) };
  for (const [name, done] of [['third', 1 / 3], ['twoThirds', 2 / 3], ['nearly', 0.95]]) {
    H3.shutFrom = g3.time - 10000 * done; H3.shutAt = H3.shutFrom + 10000; g3.tick++; R.onTick([]);
    drawN(3, 0.5, 33); out.shut[name] = healAt(12.5, 15.5);
  }
  g3.burrows.splice(g3.burrows.indexOf(H3), 1); g3.tick++;
  R.onTick([{ type: 'heal', x: 12, y: 15 }]);
  drawN(1, 0.5, 33); out.shut.closing = healAt(12.5, 15.5);
  R.setReducedMotion(true);
  g3.burrows.splice(0, 1); g3.tick++;
  R.onTick([{ type: 'heal', x: 17, y: 15 }]);
  drawN(1, 0.5, 60); out.heal.calm = healAt(17.5, 15.5);
  drawN(30, 0.5, 50); out.heal.calmEnd = healAt(17.5, 15.5);
  R.setReducedMotion(false);
  SnakeDebug.pinQuality(2);
  return out;
})()`);
{
  const min = a => Math.min(...a), max = a => Math.max(...a), late = a => a.slice(-4), early = a => a.slice(0, 4); // (the dig's first tick and its last: four frames each)
  check(min(dug.a) > 40 && min(dug.drawn) > 10, 'two beetles out at once, each drawn every frame (one walking on, one digging in)', `the walker’s emerald pixels ${min(dug.a)} to ${max(dug.a)}, the digger’s green ${min(dug.drawn)} to ${max(dug.drawn)}`);
  check(max(late(dug.b)) < 0.6 * min(early(dug.b)) && min(late(dug.collar)) > max(early(dug.collar)) + 20 && min(late(dug.parts)) > 0,
    'a cornered beetle digs in: it sinks into the bark, a collar of sawdust round it, sawdust spraying off it to the end',
    `its emerald pixels ${early(dug.b).join(', ')} as it starts (${dug.full} before), ${late(dug.b).join(', ')} at the end; sawdust ${early(dug.collar).join(', ')}, then ${late(dug.collar).join(', ')}; particles in the air at the end ${late(dug.parts).join(', ')}`);
  const fr = dug.fresh, se = dug.settled;
  check(fr.bugGone === 0 && fr.hole > 10 && se.hole > 10 && fr.raw > 2 * fr.plain + 0.12 * dug.cellPx && se.raw <= se.plain + 0.03 * dug.cellPx,
    'gone in, its bore is left a burrow: freshly bored (raw wood and sawdust round it), an ordinary burrow a few seconds on',
    `raw wood and sawdust ${fr.raw} pixels just after, ${se.raw} 4.8 s on (an ordinary burrow ${fr.plain}, ${se.plain}); its hole ${fr.hole}, then ${se.hole} dark pixels; ${fr.bugGone} of the beetle (a cell ${dug.cellPx})`);
  check(dug.noHeap.during > 20 && dug.noHeap.after === 0, 'no heap without a burrow: a dig that leaves none leaves nothing once its collar has closed', `${dug.noHeap.during} pixels changed as it closes, ${dug.noHeap.after} after`);
  const hl = dug.heal;
  check(hl.before.hole > 10 && hl.start.hole > 5 && hl.mid.hole * 4 < hl.before.hole && hl.mid.plug + hl.mid.moss > 0.08 * dug.cellPx && hl.mid.moss > 0.025 * dug.cellPx && hl.end.hole === 0 && hl.end.moss === 0 && hl.end.all > 0 && hl.gone.all === 0,
    'a burrow closing over fills with sawdust, moss over it, and is gone into the bark in about a second, leaving a faint scar a while',
    `its hole ${hl.before.hole} dark pixels, ${hl.start.hole} as it starts, ${hl.mid.hole} half way, with ${hl.mid.plug} of sawdust and ${hl.mid.moss} of moss; ${hl.end.all} pixels changed 1.45 s on (its scar), ${hl.gone.all} 22 s on (a cell ${dug.cellPx})`);
  const sh = dug.shut;
  const steps = k => [sh.open[k], sh.third[k], sh.twoThirds[k]].map((v, i, a) => i ? v - a[i - 1] : 0).slice(1), even = ([p, q]) => Math.min(p, q) > 0 && Math.max(p, q) < 2 * Math.min(p, q);
  const holeSteps = steps('hole').map(v => -v), dustSteps = steps('dust');
  check(sh.open.hole > 10 && even(holeSteps) && even(dustSteps) && sh.nearly.hole < 0.3 * sh.open.hole && sh.nearly.hole > 0
    && sh.third.moss > 0 && sh.twoThirds.moss > sh.third.moss && sh.nearly.moss > sh.twoThirds.moss && sh.nearly.moss > 0.12 * dug.cellPx && sh.closing.hole <= sh.nearly.hole + 2,
    'a burrow growing shut, evenly over its time: its opening shrinks and sawdust comes in from the rim by like steps each third, moss grows over it (a good part of a cell by the end), and it closes over from there',
    `its hole ${sh.open.hole} dark pixels open, ${sh.third.hole} a third of the way, ${sh.twoThirds.hole} two thirds, ${sh.nearly.hole} nearly shut, ${sh.closing.hole} closing over (steps ${holeSteps}); sawdust and moss in its opening ${sh.open.dust}, ${sh.third.dust}, ${sh.twoThirds.dust} (steps ${dustSteps}); moss ${sh.third.moss}, ${sh.twoThirds.moss}, ${sh.nearly.moss} (a cell ${dug.cellPx})`);
  check(hl.calm.hole * 4 < hl.before.hole && hl.calm.plug + hl.calm.moss > 0.08 * dug.cellPx && hl.calm.moss > 0.025 * dug.cellPx && hl.calmEnd.hole === 0 && hl.calmEnd.moss === 0,
    'with reduced motion, it’s filled and mossed at once, then fades', `its hole ${hl.calm.hole}, sawdust ${hl.calm.plug}, moss ${hl.calm.moss} at once; ${hl.calmEnd.all} pixels changed after`);
  check(max(dug.calm.parts) === 0 && max(dug.calm.bug) - min(dug.calm.bug) <= 3 && max(dug.calm.bug) < 0.8 * dug.full && min(dug.calm.bug) > 10,
    'with reduced motion, it’s drawn sunk part way, still, and no sawdust flies', `its emerald pixels ${dug.calm.bug.join(', ')} (${dug.full} up on the bark); particles ${max(dug.calm.parts)}`);
  check(dug.tremble > 0.02 && dug.steady < dug.tremble / 4 && dug.ring > 10 && dug.noRing === 0 && dug.rings === 2, 'through the woodpecker’s aim, food in its mark trembles, food outside it is still, and a ring marks where it’ll be knocked to (the engine’s list: one for each piece)',
    `the bead in the mark moves ${dug.tremble} cells across, frame to frame, the one outside ${dug.steady}; ${dug.ring} ring pixels at ${dug.to} (the rule’s cell), ${dug.noRing} at a cell nothing lands on; rings at ${dug.rings} of the 2 landings`);
  const vow = dug.promised;
  check(vow.ring > 10 && vow.rings === 2 && (vow.ruleIsBeetles || vow.rule <= 2), 'on the aim’s last tick, the rings show the engine’s promise (where the strike will land each piece while its cell is free)',
    `${vow.ring} ring pixels at the promised ${vow.at}, rings at ${vow.rings} of the 2 landings; ${vow.rule} at the rule’s ${dug.to}${vow.ruleIsBeetles ? ' (the beetle’s by the rule now)' : ''}`);
  const [tx, ty] = dug.to, b = dug.mid.bead, e = dug.end.bead;
  check(!!b && b[1] < ty + 0.5 - 0.3 && Math.abs(b[0] - (tx + 0.5)) < 0.3 && dug.mid.rim > dug.end.rim + 15 && !!e && Math.abs(e[0] - (tx + 0.5)) < 0.15 && Math.abs(e[1] - (ty + 0.5)) < 0.2,
    'at the strike, the food flies to where the rule said, up in an arc, rimmed so it reads over a body', `the bead half way at ${b} (it lands at ${tx + 0.5},${ty + 0.5}), then at ${e}; parchment round it ${dug.mid.rim} in the air, ${dug.end.rim} landed`);
  const [near, far] = dug.throws;
  check(near.down && far.down && far.landsBy >= near.landsBy + 120 && far.top < near.top - 0.3 && near.top < 17.5 - 0.4,
    'a longer throw is in the air longer and flies higher (the knock’s arc grows with the way it goes)',
    `knocked 1 cell, up to y ${near.top} (it lies at 17.5), down by ${near.landsBy} ms; knocked 4 cells, up to y ${far.top}, down by ${far.landsBy} ms`);
  const bm = dug.mid.beetle, be = dug.end.beetle, [bx, by] = dug.end.bug, d = (c, x, y) => Math.hypot(c[0] - x, c[1] - y);
  check(!!bm && d(bm, 13.5, 11.5) > 0.25 && d(bm, bx + 0.5, by + 0.5) > 0.25 && d(bm, 13.5, 11.5) + d(bm, bx + 0.5, by + 0.5) < d([13.5, 11.5], bx + 0.5, by + 0.5) + 0.2 && !!be && d(be, bx + 0.5, by + 0.5) < 0.2,
    'a beetle knocked out of the mark scurries there', `half way at ${bm}, then ${be} (from 13.5,11.5 to ${bx + 0.5},${by + 0.5})`);
}
