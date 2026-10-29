// --------------------------------------- the woodpecker, as big as it gets
// The woodpecker as big as it can get away with (2k in docs/PROGRESS.md),
// at the screens the entry names (a 390 px phone held upright and on its
// side, a tablet both ways, a laptop), watching. Its other checks hold on
// every screen in 03-devices.js (perched: on the screen, crouching too,
// never over a cell; flying out and drumming: never cut off); here:
// - perched beside the board, none of it lies over any of the page's
//   words (a button's, a tag's, the chatter's, the header's). Held
//   upright it stands over the row under the board and the chatter, as
//   Haakon asked (1b++, "The phone's bottom"): there taps pass through it
//   (03-devices.js, 13-the-phones-bottom.js);
// - drumming, it hides no more of the heads, the food and the tiles of its
//   mark near its spot than it did at 1.3 (60 seeded scenes: the share of
//   nine points a cell under its body, head, beak or tail, through the
//   drum, as measured at 1.3 before 2k on these screens, its least);
// - nothing on the page moves for it: the header, the tags, the board, the
//   row under it and the chatter are where they are with no woodpecker,
//   with it perched and with it drumming.
const AT_13 = { head: 0.19, food: 0.14, tile: 0.1 }; // (at 1.3: 0.20-0.22, 0.15-0.16, 0.11-0.12, tools/dev/woodpecker-size/hides.js)
const PAGE = `(() => Object.fromEntries(['header', '.tags', '#game', '.foot', '.chatter'].map(s => { const el = document.querySelector(s), r = el && el.getBoundingClientRect(); return [s, r ? [r.left, r.top, r.width, r.height].map(v => Math.round(v * 2) / 2) : null]; })))()`;
const WORDS = `(() => { const bd = document.getElementById('game').getBoundingClientRect(), out = [], tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { if (!n.textContent.trim() || n.parentElement.closest('#bird-layer')) continue; const r = document.createRange(); r.selectNodeContents(n);
    for (const q of r.getClientRects()) if (q.width > 1 && q.height > 1 && !(q.left >= bd.left && q.right <= bd.right && q.top >= bd.top && q.bottom <= bd.bottom)) out.push({ x: q.left, y: q.top, r: q.right, b: q.bottom }); }
  return out; })()`;
const HIDES = `(() => {
  const g = SnakeDebug.game(), R = SnakeRender, N = GRID; let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648, ri = n => Math.floor(rnd() * n);
  const tot = { head: 0, food: 0, tile: 0 }, keep = { snakes: g.snakes.map(s => s.body), food: g.food, tick: g.tick };
  let scenes = 0;
  const share = (cx, cy) => { let n = 0; for (let q = 0; q < 9; q++) { const a = q * TAU / 8, x = (cx + 0.5) * CELL + (q < 8 ? Math.cos(a) * CELL * 0.4 : 0), y = (cy + 0.5) * CELL + (q < 8 ? Math.sin(a) * CELL * 0.4 : 0); if (covers(x, y)) n++; } return n / 9; };
  for (let sc = 0; sc < 60; sc++) { // (the corners, edges and middle first, then anywhere)
    const tx = sc < 12 ? [0, 23, 0, 23, 12, 12, 0, 23, 1, 22, 12, 6][sc] : ri(N), ty = sc < 12 ? [0, 0, 23, 23, 0, 23, 12, 12, 22, 1, 12, 20][sc] : ri(N);
    const near = () => { for (;;) { const x = tx + ri(7) - 3, y = ty + ri(7) - 3; if (x >= 0 && y >= 0 && x < N && y < N && (x !== tx || y !== ty)) return [x, y]; } };
    g.snakes.forEach(s => { const [x, y] = near(); s.body = [{ x, y }, { x, y }, { x, y }]; });
    g.food = [0, 1, 2].map(() => { const [x, y] = near(); return { x, y, kind: 'food', expires: g.tick + 9000 }; });
    g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000); g.woodpecker = null; SnakeDebug.draw();
    const t0 = g.tick, S = t0 + 40; let now = performance.now();
    g.woodpecker = { x: tx, y: ty, at: g.time, target: [ty * N + tx], strikeAt: S, last: [], struckAt: -1, restUntil: t0, pecks: 1 };
    const h = { head: 0, food: 0, tile: 0, n: 0 };
    for (let t = t0; t < S + 3; t++) { g.tick = t; for (const u of [0, 0.25, 0.5, 0.75]) { R.frame(u, now += 16); if (pose.phase !== 'drum') continue;
      birdMats(pose); h.n++;
      for (const s of g.snakes) h.head += share(s.body[0].x, s.body[0].y) / g.snakes.length;
      for (const f of g.food) h.food += share(f.x, f.y) / g.food.length;
      h.tile += share(tx, ty); } }
    g.tick = t0;
    if (h.n) { scenes++; for (const k in tot) tot[k] += h[k] / h.n; }
  }
  g.snakes.forEach((s, i) => { s.body = keep.snakes[i]; }); g.food = keep.food; g.tick = keep.tick; g.woodpecker = null; SnakeDebug.draw();
  return { scenes, ...Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, +(v / Math.max(1, scenes)).toFixed(3)])) };
})()`;
for (const d of [CALLS, sized(844, 390), sized(768, 1024), sized(1024, 768), sized(1280, 800)]) {
  if (only && !d.name.includes(only)) continue;
  const tag = `${d.name}, the bigger woodpecker`, upright = d.kind === 'upright';
  await open(d);
  await toRound('watch');
  const away = await ev(`(() => { const g = SnakeDebug.game(); g.woodpecker = null; SnakeDebug.draw(); return 'ok'; })()`) && await ev(PAGE);
  if (!upright) {
    const words = await ev(WORDS), rects = Object.fromEntries(words.map((w, i) => [`word ${i}`, w])), over = [];
    for (const [x, y] of SPOTS) for (const aim of [false, true]) { const p = await ev(PERCH(x, y, aim, rects)); if (p && Object.keys(p.on).length) over.push(`${x},${y}${aim ? ' eyeing' : ''}: ${Object.values(p.on).reduce((a, v) => a + v, 0)} px`); }
    check(!over.length, `${tag}: perched beside the board, none of it lies over the page's words`, over.join('; ') || `${SPOTS.length * 2} perches, ${words.length} words`);
  }
  const perched = (await ev(PERCH(12, 22, false))) && await ev(PAGE);
  const hid = await ev(HIDES);
  const drumming = await ev(`(() => { const g = SnakeDebug.game(), R = SnakeRender, t0 = g.tick, S = t0 + 40; let now = performance.now();
    g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000); g.woodpecker = { x: 12, y: 18, at: g.time, target: [18 * GRID + 12], strikeAt: S, last: [], struckAt: -1, restUntil: t0, pecks: 1 };
    for (let t = t0; t < S + 2; t++) { g.tick = t; for (const u of [0, 0.5]) { R.frame(u, now += 16); if (pose.phase === 'drum') return 'drum'; } }
    return pose.phase; })()`) === 'drum' && await ev(PAGE);
  const moved = [['perched', perched], ['drumming', drumming]].flatMap(([w, at]) => (at ? Object.keys(away).filter(k => JSON.stringify(away[k]) !== JSON.stringify(at[k])).map(k => `${k} ${w}`) : [`${w}: not staged`]));
  check(!moved.length, `${tag}: nothing on the page moves for it (the header, the tags, the board, the row under it, the chatter: the same with it away, perched and drumming)`, moved.join(', '));
  const more = Object.keys(AT_13).filter(k => !(hid[k] <= AT_13[k]));
  check(hid.scenes >= 50 && !more.length, `${tag}: drumming, it hides no more of the heads, the food and its mark's tiles near its spot than at 1.3`,
    `${hid.scenes} scenes: ${Object.keys(AT_13).map(k => `${k} ${hid[k]} (1.3: ${AT_13[k]} at least)`).join(', ')}`);
  await ev(`window.__autoRaf = true; 'ok'`);
}
