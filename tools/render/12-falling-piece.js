// 2s: a piece cut loose falls. While the bird aims, the cells of its mark
// that will fall (w.fall) are shaded darker than the patch it pecks, so the
// whole piece reads as going; at the strike the piece tips away into the pit,
// its food and beetles with it, and is gone within a second.
const fallen = await ev(`(() => {
  seeds(220);
  SnakeDebug.pinQuality(0);
  const g = stage(['gobbler', 'mason', 'ghost']), N = TUNING.GRID, K = (x, y) => y * N + x;
  g.time = g.acts.frenzy + 5000; g.tick = 2000;
  g.snakes.forEach((s, i) => setBody(s, [[3 + 4 * i, 20], [2 + 4 * i, 20], [1 + 4 * i, 20]], 'right'));
  for (let y = 0; y <= 5; y++) for (const x of [16, 17]) g.holes.add(K(x, y));
  const fall = [], patch = [];
  for (let y = 0; y <= 5; y++) for (let x = 18; x < N; x++) fall.push(K(x, y));
  for (let x = 16; x < N; x++) patch.push(K(x, 6));
  g.woodpecker = { x: 17, y: 7, at: g.time - 9000, target: [...patch, ...fall], fall, strikeAt: g.tick + 6, last: [], struckAt: g.tick - 40, restUntil: g.tick, pecks: 4 };
  g.food = [{ x: 20, y: 3, kind: 'food' }, { x: 21, y: 1, kind: 'beetle', dir: { x: 1, y: 0 }, movedAt: 0 }];
  show(g); drawN(12);
  const shade = lum(pixels(20, 2, 1, 1)), pecked = lum(pixels(20, 6, 1, 1));
  for (const k of [...patch, ...fall]) g.holes.add(k);
  g.food = [];
  Object.assign(g.woodpecker, { target: [], last: [...patch, ...fall], struckAt: g.tick, restUntil: g.tick + 20 }); delete g.woodpecker.fall;
  g.tick++;
  R.onTick([{ type: 'peck', x: 17, y: 7, cells: [...patch, ...fall], under: [], fall }]);
  const onSlab = pieceFalls[0] ? pieceFalls[0].on.length : -1;
  drawN(6, 0.5, 33);
  const mid = lum(pixels(20, 2, 1, 1));
  drawN(30, 0.5, 33);
  const after = lum(pixels(20, 2, 1, 1));
  return { shade, pecked, mid, after, onSlab };
})()`);
check(fallen.shade < fallen.pecked - 5, '2s: the piece a mark cuts loose is shaded darker than the patch itself while the bird aims', JSON.stringify(fallen));
check(fallen.mid > fallen.after + 2, '...and at the strike it tips away into the pit, gone within a second', JSON.stringify(fallen));
check(fallen.onSlab === 2, '...its apple and its beetle going down with it', JSON.stringify(fallen));

// Part 2's outline, before its last peck: the piece it cuts round lies under a
// faint wash while any nick is left (what the rivals are handed as aiView's
// piece), with none of the cut-loose shading's sliding streaks, and the cut-loose
// shading, once the last peck is aimed, is the darker of the two.
const washed = await ev(`(() => {
  seeds(225);
  SnakeDebug.pinQuality(0);
  const g = stage(['gobbler', 'mason', 'ghost']), N = TUNING.GRID, K = (x, y) => y * N + x;
  g.time = g.acts.frenzy + 5000; g.tick = 2000;
  g.snakes.forEach((s, i) => setBody(s, [[3 + 4 * i, 20], [2 + 4 * i, 20], [1 + 4 * i, 20]], 'right'));
  const piece = [], cut = [];
  for (let y = 0; y <= 5; y++) for (let x = 18; x < N; x++) piece.push(K(x, y));
  for (let x = 17; x < N; x++) cut.push(K(x, 6));
  for (let y = 0; y <= 5; y++) cut.push(K(17, y));
  g.woodpecker = { x: 17, y: 7, at: g.time - 9000, target: [], strikeAt: -1, last: [], struckAt: g.tick - 60, restUntil: g.tick + 1e6, pecks: 2, plan: { cut: cut.slice(), piece, waitFrom: -1 } };
  R.setReducedMotion(false);
  const plan = g.woodpecker.plan; delete g.woodpecker.plan;
  show(g); drawN(12);
  const inside = () => lum(pixels(19, 1, 4, 4)), base = inside(); // (a few cells' mean, so the streaks' own lines are averaged in)
  g.woodpecker.plan = plan; drawN(12);
  const wash = inside(); drawN(7, 0.5, 71); const washLater = inside();
  Object.assign(g.woodpecker, { target: cut.slice(), fall: piece.slice(), strikeAt: g.tick + 4 }); // (the last peck aimed, well on: nothing left to nick)
  drawN(12); const loose = inside(); drawN(7, 0.5, 71); const looseLater = inside();
  g.woodpecker.fall = []; g.woodpecker.target = []; plan.cut = [];
  drawN(12); const none = inside();
  return { base, wash, washLater, loose, looseLater, none };
})()`);
check(washed.wash < washed.base - 2 && washed.wash > washed.loose + 3, 'an outline\'s piece is washed lightly while nicks are left, lighter than the cut-loose shading', JSON.stringify(washed));
check(washed.wash === washed.washLater, '...with no sliding streaks, the wash steady frame to frame', JSON.stringify(washed));
check(Math.abs(washed.none - washed.base) < 2, '...and no wash on a piece whose cut has no nicks left and is not aimed', JSON.stringify(washed));

// A flag on a piece cut loose falls with it (the owner, 2 November 2026: flags
// fall with the log, not jump): upright on its slab, shrinking with it
// toward the piece's middle, gone with it within a second; never tipping
// over on its own pole as a flag pecked out from under it does.
const riding = await ev(`(() => {
  seeds(230);
  SnakeDebug.pinQuality(0);
  const g = stage(['colonist', 'mason', 'ghost']), N = TUNING.GRID, K = (x, y) => y * N + x, col = g.snakes[1];
  g.time = g.acts.frenzy + 5000; g.tick = 2000;
  g.snakes.forEach((s, i) => setBody(s, [[3 + 4 * i, 20], [2 + 4 * i, 20], [1 + 4 * i, 20]], 'right'));
  col.memory.colonies = [{ x: 19, y: 4, radius: 2, n: 2 }];
  for (let y = 0; y <= 8; y++) for (const x of [16]) g.holes.add(K(x, y));
  const fall = [];
  for (let y = 0; y <= 8; y++) for (let x = 17; x < N; x++) fall.push(K(x, y));
  show(g); drawN(30, 0.5, 60);
  const navy = (r, gg, b) => b > r + 40 && b > gg + 30, centre = () => { const p = pixels(16, 0, 8, 9); let n = 0, sx = 0, sy = 0; for (let i = 0; i < p.data.length; i += 4) if (navy(p.data[i], p.data[i + 1], p.data[i + 2])) { n++; sx += (i / 4) % p.width; sy += Math.floor(i / 4 / p.width); } return n ? [n, +(16 + sx / n / p.width * 8).toFixed(2), +(sy / n / p.height * 9).toFixed(2)] : [0]; };
  const out = { before: centre() };
  for (const k of fall) g.holes.add(k);
  g.tick++;
  R.onTick([{ type: 'peck', x: 16, y: 9, cells: [K(16, 9)], under: [], fall }]);
  drawN(2, 0.5, 33);
  col.memory.colonies = []; // (a tick later, forgotten, as the rules have it)
  drawN(5, 0.5, 33);
  out.mid = centre();
  drawN(23, 0.5, 33);
  out.after = centre();
  return out;
})()`);
const [bn, bx, by] = riding.before, [mn, mx, my] = riding.mid;
check(bn > 20 && mn > 3 && mn < bn && Math.abs(mx - bx) < 0.6 && my > by - 0.2 && riding.after[0] === 0,
  'a flag on a piece cut loose falls with the piece, upright, shrinking with it, gone with it', JSON.stringify(riding));

// Sovereign's capital pecked out and the realm moved before the next frame
// (a catch-up of ticks, or a guest getting two at once): its banner still
// falls into the pit, and none glides over it to the new capital.
const sameFrame = await ev(`(() => {
  seeds(240);
  SnakeDebug.pinQuality(0);
  const g = stage(['sovereign', 'mason', 'ghost']), N = TUNING.GRID, sov = g.snakes[1];
  g.snakes.forEach((s, i) => setBody(s, [[3 + 4 * i, 22], [2 + 4 * i, 22], [1 + 4 * i, 22]], 'right'));
  sov.memory.home = { x: 17, y: 12, radius: 4 };
  show(g); drawN(30, 0.5, 60);
  for (const k of [12 * N + 17, 12 * N + 16, 13 * N + 17]) g.holes.add(k);
  sov.memory.home = { x: 9, y: 12, radius: 4 }; g.tick += 2;
  R.onTick([{ type: 'peck', x: 17, y: 12, cells: [12 * N + 17, 12 * N + 16, 13 * N + 17] }]);
  drawN(3, 0.5, 60);
  const cream = (r, gg, b) => r > 225 && gg > 215 && b > 180, between = (() => { const p = pixels(11, 10, 5, 3); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (cream(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; })();
  return { fell: fallenFlags.filter(f => f.col && f.x === 17 && f.y === 12).length, between };
})()`);
check(sameFrame.fell === 1 && sameFrame.between < 4, 'a capital pecked out and moved before the next frame: its banner still falls, none glides between', JSON.stringify(sameFrame));
