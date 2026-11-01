// ------------------------------------- the woodpecker, clear of the words
// The woodpecker perches clear of the buttons' words (2k+ in
// docs/PROGRESS.md): on a phone held upright, watching, at 390 and 320 px
// wide (each has a clear perch at its size, between two buttons or over a
// gap), perched under the board at rest and eyeing its chunk, for spots
// all along the board, none of it lies over the row's labels (the speed
// buttons', the switches', the speed's and the chatter's captions); and it
// is the size it was (2k: 1.7 times, never shrunk for this). At 320 px,
// since #270's bigger bird on a phone (164 px tall there), no place at its
// size clears them, so it perches as it would (2k+: never shrunk for them;
// Haakon, of it covering the row: "Don't really care if it covers that a
// bit"): there only its size is checked.
const LABELS = `(() => { const out = {};
  for (const el of document.querySelectorAll('.foot .speed > span, .foot button, #chatter-label')) { const r = document.createRange(); r.selectNodeContents(el); const q = r.getBoundingClientRect();
    if (q.width && q.height) out[el.textContent.trim() || el.id] = { x: q.left, y: q.top, r: q.right, b: q.bottom }; }
  return out; })()`;
const SMALL = sized(320, 640);
for (const d of [CALLS, SMALL]) {
  if (only && !d.name.includes(only)) continue;
  const tag = `${d.name}, the woodpecker clear of the words`;
  await open(d);
  await toRound('watch');
  const labels = await ev(LABELS), over = [], sizes = new Set();
  for (const [x, y] of [[1, 22], [6, 22], [12, 22], [17, 22], [22, 22], [1, 12], [22, 12], [12, 18]]) for (const aim of [false, true]) {
    const p = await ev(PERCH(x, y, aim, labels));
    if (!p) { over.push(`${x},${y}: not perched`); continue; }
    sizes.add(await ev(`SnakeRender.birdPose().s.toFixed(3)`));
    if (Object.keys(p.on).length) over.push(`${x},${y}${aim ? ' eyeing' : ''}: over ${Object.keys(p.on).join(', ')}`);
  }
  if (d !== SMALL) check(Object.keys(labels).length >= 5 && !over.length, `${tag}: perched under the board, none of it lies over the row's labels`, over.join('; ') || `16 perches, ${Object.keys(labels).length} labels`);
  check(sizes.size === 1 && [...sizes][0] === '1.000', `${tag}: at its full size there, one size at every perch`, [...sizes].join(', '));
  await ev(`window.__autoRaf = true; 'ok'`);
}
