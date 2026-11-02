// ------------------------------------------------ staged boards
await ev(`window.__autoRaf = true; 'ok'`);
await b.go(site.url + '?debug', { settle: 0 });
await ev('__settle()');
await ev(STAGE);

// A dead snake's beads: every other segment, each standing for its stretch
// of two, half and half (its own segment's colour upper left, the next's
// lower right), in its own markings.
const beads = await ev(`(() => {
  seeds(0);
  const g = stage(['joker', 'wildcard', 'colonist']), [you, joker, wild] = g.snakes;
  setBody(joker, Array.from({ length: 16 }, (_, i) => [20 - i, 4]), 'right');
  setBody(wild, Array.from({ length: 16 }, (_, i) => [20 - i, 10]), 'right');
  show(g); drawN(10);
  for (const s of [joker, wild]) { s.alive = false; s.killer = 'wall'; s.body.forEach((c, j) => { if (j % TUNING.CORPSE_EVERY === 0) g.food.push({ x: c.x, y: c.y, kind: 'pellet', color: s.color, owner: s.id, expires: g.tick + 900 }); }); }
  g.tick++;
  R.onTick([{ type: 'death', snake: joker }, { type: 'death', snake: wild }]);
  drawN(90);
  const at = (y, n) => [rgb(20 - n * TUNING.CORPSE_EVERY + 0.27, y + 0.46), rgb(20 - n * TUNING.CORPSE_EVERY + 0.56, y + 0.53)]; // (a box in each half (rgb reads 0.12 of a cell from its corner), clear of the gloss and the stars)
  return { joker: [1, 2, 3, 4, 5].map(n => at(4, n)), wild: [1, 2, 3, 4, 5].map(n => at(10, n)) };
})()`);
const amber = ([r, g, b]) => r > b + 80 && g > b + 40, purple = ([r, g, b]) => r > g + 50 && b > g + 50, red = ([r, g, b]) => r > g + 60 && r > b + 50;
const navy = ([r, g, b]) => b > r + 15 && b > g + 15, white = ([r, g, b]) => Math.min(r, g, b) > 140 && Math.max(r, g, b) - Math.min(r, g, b) < 45;
check(beads.joker.every(([u, l]) => purple(u) && amber(l)), 'Joker’s beads are purple and amber, as its body', JSON.stringify(beads.joker));
const wildWant = [[navy, navy], [white, red], [white, red], [white, red], [white, red]];
check(beads.wild.every(([u, l], i) => wildWant[i][0](u) && wildWant[i][1](l)), 'Wildcard’s beads keep the stars and stripes', JSON.stringify(beads.wild));

// A tail cut off by a dash falls as beads in its own markings, each its
// own segment's (Joker's amber and purple in turn), not the plain colour.
const cutTail = await ev(`(() => {
  seeds(250);
  const g = stage(['joker', 'mason', 'ghost']), jo = g.snakes[1];
  setBody(jo, Array.from({ length: 12 }, (_, i) => [20 - i, 16]), 'right');
  show(g); drawN(10);
  const cut = jo.body.splice(6);
  for (const c of cut.slice(1)) g.food.push({ x: c.x, y: c.y, kind: 'pellet', color: jo.color, owner: jo.id, expires: g.tick + 900 });
  g.tick++;
  R.onTick([{ type: 'cut', snake: jo, x: cut[0].x, y: cut[0].y, lost: cut.length, by: g.snakes[2].id }]);
  drawN(60);
  return [7, 8, 9, 10].map(j => rgb(20 - j + 0.27, 16 + 0.46));
})()`);
check(cutTail.every((c, i) => (i % 2 ? purple : amber)(c)), 'a tail cut off falls as beads in its markings, each its own segment’s', JSON.stringify(cutTail));

// A peer's tick with food off the board (or between cells), each bead its
// own colour: none of it is drawn, so the bead sprites stay those of the
// beads on the log, made once, not every frame.
const offBoard = await ev(`(() => {
  seeds(251);
  const g = stage(['joker', 'mason', 'ghost']);
  show(g); drawN(3); // (the round under way: food after this pops in at once)
  g.food = [{ x: 5, y: 5, kind: 'pellet', color: '#123456', expires: g.tick + 900 }];
  for (let i = 0; i < 700; i++) g.food.push({ x: i % 2 ? -1 - i : 3.5 + i / 2000, y: 4, kind: 'pellet', color: '#' + (0x100000 + i).toString(16), expires: g.tick + 900 });
  g.tick++; drawN(20);
  const made = sprites.get('bead'), keys = [...made.keys()];
  drawN(3);
  return { kept: made.size, same: keys.every(k => made.has(k)) && [...made.keys()].length === keys.length, odd: keys.filter(k => k.startsWith('#1') && k !== '#123456|').length };
})()`);
check(offBoard.odd === 0 && offBoard.same, 'food a peer puts off the board or between cells is never drawn, so its beads make no sprites', JSON.stringify(offBoard));

// Stunned, a jump and a flash both asked, a turn up pressed, a body one
// thick right above: the game will hop it (a jump goes first), so the
// mark is the jump's hop, in sky, not the flash's chevrons, in ember.
// Four thick, past the jump's reach, there's nowhere to land: the flash's.
const marks = await ev(`(() => {
  seeds(1);
  const out = {};
  for (const thick of [1, 4]) {
    const g = stage(['creeper', 'ghost', 'mason']), [you, o] = g.snakes;
    setBody(you, Array.from({ length: 8 }, (_, i) => [10 - i, 13]), 'right');
    setBody(o, Array.from({ length: 7 * thick }, (_, i) => { const r = Math.floor(i / 7), j = i % 7; return [r % 2 ? 13 - j : 7 + j, 12 - r]; }), 'left'); o.stunUntil = 1e9;
    you.stunUntil = g.tick + 2; you.queue = [E.DIRS.up]; you.leapReadyAt = you.flashReadyAt = 0;
    E.leap(g, you); E.flash(g, you);
    show(g); drawN(10);
    const d = pixels(9, 10.5, 3, 2.5).data, near = (i, c) => Math.abs(d[i] - c[0]) < 30 && Math.abs(d[i + 1] - c[1]) < 30 && Math.abs(d[i + 2] - c[2]) < 30;
    let sky = 0, ember = 0;
    for (let i = 0; i < d.length; i += 4) { if (near(i, [168, 220, 245])) sky++; else if (near(i, [247, 168, 102])) ember++; }
    const did = [];
    for (let k = 0; k < 3; k++) { E.step(g); for (const e of g.events) if (e.snake === you && ['leap', 'dash', 'fizzle', 'crash'].includes(e.type)) did.push(e.type); }
    out[thick] = { sky, ember, did: did.join(', ') || 'nothing' };
  }
  return out;
})()`);
check(marks[1].sky > 8 && marks[1].ember < 3 && marks[1].did.startsWith('leap'), 'stunned, a jump and a flash asked, a body one thick ahead: the jump’s mark (the game hops)', `sky ${marks[1].sky}, ember ${marks[1].ember} pixels; then ${marks[1].did}`);
check(marks[4].ember > 8 && marks[4].sky < 3, 'stunned, both asked, a body four thick ahead: the flash’s mark', `sky ${marks[4].sky}, ember ${marks[4].ember} pixels; then ${marks[4].did}`);

// Golden power pips at the board's edge, the arc behind the head off it
// (a head just turned off an edge, a corner): none cut off (as many of
// their pixels as in the middle of the board), none on the head (no sky
// or ember inside its face: moving the arc in put them over its eyes),
// and stunned, the stars keep clear of them (as many still showing). On
// a bigger board: a pip is a few pixels across on the usual one. Each
// look is drawn on the same clock (the ember dashes running along the
// gold line, and the stars going round, at the same place in every one:
// on the page's own clock, their edges' blend with the gold passed for
// ember a varying amount, and an edge sometimes fell short), with no
// falling leaves.
await b.viewport(1600, 1600);
await ev('__settle()');
const pips = await ev(`(() => {
  seeds(3);
  SnakeDebug.pinQuality(0);
  const look = (body, dir, leaps, dashes, middle, stun) => {
    const g = stage(['creeper', 'vulture', 'mason']), you = g.snakes[0], [hx, hy] = body[0], dx = middle ? 11 - hx : 0, dy = middle ? 11 - hy : 0;
    setBody(you, body.map(([x, y]) => [x + dx, y + dy]), dir); you.leaps = leaps; you.dashes = dashes;
    g.snakes.slice(1).forEach((s, i) => setBody(s, [[19, 19 + 2 * i], [18, 19 + 2 * i], [17, 19 + 2 * i]], 'right'));
    if (stun) you.stunUntil = g.tick + 5;
    __t = 5e6; show(g); drawN(20);
    const x0 = Math.max(0, hx + dx - 3), y0 = Math.max(0, hy + dy - 3), w = Math.min(TUNING.GRID, hx + dx + 4) - x0, h = Math.min(TUNING.GRID, hy + dy + 4) - y0;
    const p = pixels(x0, y0, w, h), d = p.data, ppc = p.width / w, near = (i, c) => Math.abs(d[i] - c[0]) < 30 && Math.abs(d[i + 1] - c[1]) < 30 && Math.abs(d[i + 2] - c[2]) < 30;
    let all = 0, face = 0, sky = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (near(i, [168, 220, 245])) sky++;
      else if (!near(i, [247, 168, 102])) continue;
      all++;
      const px = x0 + ((i / 4) % p.width + 0.5) / ppc, py = y0 + (Math.floor(i / 4 / p.width) + 0.5) / ppc;
      if (Math.hypot(px - (hx + dx + 0.5), py - (hy + dy + 0.5)) < 0.44) face++;
    }
    return { all, face, sky, ember: all - sky };
  };
  const col = (x, y0, n) => Array.from({ length: n }, (_, i) => [x, y0 + i]), row = (x0, y, n) => Array.from({ length: n }, (_, i) => [x0 + i, y]);
  const cases = [
    ['in the first column heading up', col(0, 6, 8), 'up', 2, 2],
    ['in the first column heading right, just turned off it', col(0, 6, 6), 'right', 3, 2],
    ['in the first column heading right, one of each', col(0, 6, 6), 'right', 1, 1],
    ['in the top row heading down', row(12, 0, 6), 'down', 2, 2],
    ['in the bottom-left corner heading right', Array.from({ length: 6 }, (_, i) => [0, 23 - i]), 'right', 3, 3],
    ['in the last column heading left', col(23, 12, 6), 'left', 2, 1],
  ];
  const out = cases.map(([what, body, dir, leaps, dashes]) => ({ what, edge: look(body, dir, leaps, dashes, false, false), stun: look(body, dir, leaps, dashes, false, true), middle: look(body, dir, leaps, dashes, true, false) }));
  SnakeDebug.pinQuality(2);
  return out;
})()`);
for (const { what, edge, stun, middle } of pips) {
  check(middle.all > 0 && edge.all >= 0.85 * middle.all && edge.face === 0 && stun.all >= 0.85 * middle.all,
    `golden power pips ${what}: all on the board, none on the head, clear of the stun stars`, `sky and ember pixels ${edge.sky} and ${edge.ember} (in the middle ${middle.sky} and ${middle.ember}, stunned ${stun.sky} and ${stun.ember}), ${edge.face} inside its face`);
}
