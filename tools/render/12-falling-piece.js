// 2s: a piece cut loose falls. While the bird aims, the cells of its mark
// that will fall (w.fall) are shaded darker than the patch it pecks, so the
// whole piece reads as going; at the strike the piece tips away into the pit,
// and is gone within a second.
const fallen = await ev(`(() => {
  seeds(220);
  SnakeDebug.pinQuality(0);
  const g = stage(['gobbler', 'mason', 'ghost']), N = TUNING.GRID, K = (x, y) => y * N + x;
  g.time = TUNING.SUDDEN_DEATH_MS + 5000; g.tick = 2000;
  g.snakes.forEach((s, i) => setBody(s, [[3 + 4 * i, 20], [2 + 4 * i, 20], [1 + 4 * i, 20]], 'right'));
  for (let y = 0; y <= 5; y++) for (const x of [16, 17]) g.holes.add(K(x, y));
  const fall = [], patch = [];
  for (let y = 0; y <= 5; y++) for (let x = 18; x < N; x++) fall.push(K(x, y));
  for (let x = 16; x < N; x++) patch.push(K(x, 6));
  g.woodpecker = { x: 17, y: 7, at: g.time - 9000, target: [...patch, ...fall], fall, strikeAt: g.tick + 6, last: [], struckAt: g.tick - 40, restUntil: g.tick, pecks: 4 };
  show(g); drawN(12);
  const shade = lum(pixels(20, 2, 1, 1)), pecked = lum(pixels(20, 6, 1, 1));
  for (const k of [...patch, ...fall]) g.holes.add(k);
  Object.assign(g.woodpecker, { target: [], last: [...patch, ...fall], struckAt: g.tick, restUntil: g.tick + 20 }); delete g.woodpecker.fall;
  g.tick++;
  R.onTick([{ type: 'peck', x: 17, y: 7, cells: [...patch, ...fall], under: [], fall }]);
  drawN(6, 0.5, 33);
  const mid = lum(pixels(20, 2, 1, 1));
  drawN(30, 0.5, 33);
  const after = lum(pixels(20, 2, 1, 1));
  return { shade, pecked, mid, after };
})()`);
check(fallen.shade < fallen.pecked - 5, '2s: the piece a mark cuts loose is shaded darker than the patch itself while the bird aims', JSON.stringify(fallen));
check(fallen.mid > fallen.after + 2, '...and at the strike it tips away into the pit, gone within a second', JSON.stringify(fallen));
