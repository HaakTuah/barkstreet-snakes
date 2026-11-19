// ----------------------------------------- upright, heights in between
// A phone held upright too tall for its board to leave a gutter and too
// short to show the ledge whole (an iPhone 8 Plus in Safari, 414×622; an
// iPhone SE in an app's browser): every 5 px of height, the screen
// resized under a round held still (a fresh page at the first height, and
// at a few phones' own sizes). The woodpecker perched, resting and eyeing
// its chunk, covers no cell (a beak's tip at most, 4 px, as on a tablet),
// is 24 px tall or more (the page leaves it that much room, on the ledge
// or beside the board), and is all on the screen and off the page's
// furniture; the page, the chatter full, is one screen tall; and the
// board is wholly on the screen and bigger than before (6d478ed: the
// page 24 px narrower than the screen or 190 px shorter, less a 10 px rim
// each side), or as big as fits the height where that ran off the screen.
const atSize = async (w, h, dpr, fresh) => {
  if (fresh) { await open({ w, h, dpr }); await toRound(); await ev(FILL); }
  else { await b.viewport(w, h, { scale: dpr, mobile: true }); await b.sleep(150); await settle(); }
  const l = await ev(LAYOUT), ps = [];
  for (const [x, y] of [[1, 12], [22, 12], [12, 22], [1, 22], [22, 1]]) for (const aim of [false, true]) ps.push({ x, y, aim, p: await ev(PERCH(x, y, aim, furnitureOf(l, true))) });
  const before = Math.min(w - 24, Math.max(240, h - 190)) - 20, drawn = ps.filter(q => q.p);
  const why = q => !q.p ? ['not drawn'] : [q.p.over > 4 && `${q.p.over} px over the cells`, q.p.h < 23.5 && `${r1(q.p.h)} px tall`, ...q.p.cut.map(e => `cut off at the screen's ${e}`),
    (q.p.x < -0.5 || q.p.r > l.vw + 0.5 || q.p.y < -0.5 || q.p.b > l.vh + 0.5) && 'off the screen', ...Object.keys(q.p.on).map(k => `${q.p.on[k]} px over the ${k}`)].filter(Boolean);
  const bad = ps.filter(q => why(q).length).map(q => `${w}×${h} ${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${why(q).join(', ')}`);
  const fits = l.vh - l.frame.y - (l.frame.h - l.board.h); // (as big as fits the height: where the old board ran off the screen, that's as big as it can be)
  const errs = await ev(`__errs.splice(0).join(' | ')`);
  if (errs) bad.push(`${w}×${h}: error events on the page: ${errs}`);
  if (l.scrollH > l.vh || l.scrollW > l.vw) bad.push(`${w}×${h}: the page scrolls, ${l.scrollW}×${l.scrollH} (the chatter full)`);
  if (l.board.w < Math.min(before, fits) - 0.5 || l.board.b > l.vh + 0.5) bad.push(`${w}×${h}: the board ${r1(l.board.w)} px, down to ${r1(l.board.b)} (before: ${before}; as big as fits the height: ${r1(fits)})`);
  between.push({ w, h, board: l.board.w, before, fits, bird: Math.min(...drawn.map(q => q.p.h)), over: Math.max(0, ...drawn.map(q => q.p.over)), bad });
};
for (const [w, h0, h1, dpr] of [[320, 460, 540, 2], [375, 545, 640, 2], [390, 545, 640, 3], [414, 545, 640, 3]]) {
  if (only && !String(w).includes(only)) continue;
  for (let h = h0; h <= h1; h += 5) await atSize(w, h, dpr, h === h0);
}
for (const [w, h, dpr] of [[414, 622, 3], [412, 604, 2.625], [375, 553, 2]]) if (!only || String(w).includes(only)) await atSize(w, h, dpr, true);
for (const w of [...new Set(between.map(s => s.w))]) {
  const at = between.filter(s => s.w === w), bad = at.flatMap(s => s.bad);
  check(!bad.length, `${w} px wide, upright, ${Math.min(...at.map(s => s.h))} to ${Math.max(...at.map(s => s.h))} px tall: perched, the woodpecker covers no cell (a beak's tip at most), is 24 px tall or more, all on the screen and off the page's furniture, the page one screen tall with the chatter full, and the board is bigger than before (or as big as fits the height)`,
    bad.join('; ') || `${at.length} heights: the bird ${r1(Math.min(...at.map(s => s.bird)))} px tall or more, ${Math.max(...at.map(s => s.over))} px over the cells at most; the board ${r1(Math.min(...at.filter(s => s.board >= s.before - 0.5).map(s => s.board - s.before)))} px bigger than before or more${at.some(s => s.board < s.before - 0.5) ? `, but as big as fits the height at ${at.filter(s => s.board < s.before - 0.5).map(s => `${s.w}×${s.h} (${r1(s.board)}, before ${s.before} ran off the screen)`).join(', ')}` : ''}`);
}
