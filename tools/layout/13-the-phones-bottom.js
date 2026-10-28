// ------------------------------------------------------ the phone's bottom
// The phone's bottom (1b++ in docs/PROGRESS.md), held upright at the four
// phones the entry names, playing and watching, the chatter open and
// folded: the page's own parts never overlap (the row under the board,
// its buttons and the help, and the chatter's panel: no box meets
// another's, and the chatter keeps the gap under the row that the row
// keeps under the board; the woodpecker not counted); the chatter opens at
// the start where three lines fit, and starts folded only where they
// don't, and a tap's choice is kept on the next visit; a tap reaches a
// button under the perched woodpecker; and the woodpecker is one size,
// perched under the board, flying and drumming on it.
const BOTTOM = `(() => {
  const box = el => { const r = el.getBoundingClientRect(); return r.width && r.height ? { what: el.id || el.className || el.tagName, x: r.left, y: r.top, r: r.right, b: r.bottom } : null; };
  const q = s => document.querySelector(s), frame = q('.frame').getBoundingClientRect(), foot = q('.foot').getBoundingClientRect();
  const parts = [...q('.foot').querySelectorAll('button, .help')].map(box).filter(Boolean);
  const panel = [q('.chatter-head'), q('#chatlog')].map(box).filter(Boolean), log = panel.length ? { what: 'the chatter', x: Math.min(...panel.map(p => p.x)), y: Math.min(...panel.map(p => p.y)), r: Math.max(...panel.map(p => p.r)), b: Math.max(...panel.map(p => p.b)) } : null;
  const all = log ? [...parts, log] : parts, meet = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i], c = all[j]; if (a.x < c.r - 0.5 && c.x < a.r - 0.5 && a.y < c.b - 0.5 && c.y < a.b - 0.5) meet.push(a.what + ' / ' + c.what); }
  return { meet, over: foot.top - frame.bottom, under: log ? log.y - Math.max(...parts.map(p => p.b)) : null, open: q('.chatter').getAttribute('aria-expanded'), fit: q('.chatter').dataset.fit };
})()`;
const GRID_PX = 24 * 32; // (the board, in its own px: GRID cells of CELL)
const ONE_ROW = `(() => { const log = document.getElementById('chatlog'); for (const t of ['Hm.', 'Mine!', 'Mind the bark.', 'Not you again.', 'Ha!']) log.insertAdjacentHTML('afterbegin', '<li><strong>Gobbler</strong> <span>' + t + '</span></li>'); return 'ok'; })()`;
const tapAt = async at => {
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...at, id: 1 }] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await b.sleep(60);
};
const tapLog = async () => tapAt(await ev(`(() => { const r = document.getElementById('chatlog').getBoundingClientRect(); return { x: r.left + r.width / 3, y: r.top + Math.min(8, r.height / 2) }; })()`));
const ROWS_OPEN = `(() => { const log = document.getElementById('chatlog'); return [...log.children].filter(li => li.getBoundingClientRect().height && !li.classList.contains('gone')).length; })()`;
for (const d of [CALLS, sized(360, 780), sized(412, 915), sized(375, 667)]) {
  if (only && !d.name.includes(only)) continue;
  for (const watching of [false, true]) {
    const what = `${d.name}, ${watching ? 'watching' : 'playing'}`;
    await open(d);
    await toRound(watching ? 'watch' : 'start');
    await ev(ONE_ROW);
    await settle();
    // (the chatter opens where three lines of a row fit: open, how many show)
    const first = await ev(BOTTOM);
    if (first.open !== 'true') { await tapLog(); await settle(); }
    const shown = await ev(ROWS_OPEN), opened = await ev(BOTTOM);
    check((first.open === 'true') === (shown >= 3) && opened.open === 'true' && (d.h < 700 || first.open === 'true'), `${what}: the chatter starts ${first.open === 'true' ? 'open' : 'folded'}, as three lines ${shown >= 3 ? 'fit' : 'don’t fit'} open`, `${shown} lines open`);
    await tapLog();
    await settle();
    const folded = await ev(BOTTOM);
    for (const [state, at] of [['open', opened], ['folded', folded]]) {
      check(!at.meet.length && at.under >= at.over - 0.5, `${what}, the chatter ${state}: no part of the row under the board meets another or the chatter, and the chatter keeps the row's gap under it`, `${at.meet.join(', ') || 'none meet'}; ${r1(at.under)} px under the row, the row ${r1(at.over)} px under the board`);
    }
    if (!watching) { // (a tap's choice kept: folded now, it starts folded on the next visit)
      await b.go(`${site.url}index.html?debug`);
      await settle();
      await toRound();
      const kept = await ev(BOTTOM);
      check(folded.open === 'false' && kept.open === 'false', `${d.name}: a tap's choice (folded) is kept on the next visit`, `aria-expanded ${kept.open}`);
      continue;
    }
    // (watching, the woodpecker perched over a speed button: a tap there
    // reaches the button, through the bird)
    let reached = null;
    for (const x of [3, 6, 9, 12]) {
      const p = await ev(PERCH(x, 20, false));
      if (!p) continue;
      const hit = await ev(`(() => { for (const btn of document.querySelectorAll('#speed button')) { const r = btn.getBoundingClientRect(), x0 = Math.max(r.left, ${p.x}), x1 = Math.min(r.right, ${p.r}), y0 = Math.max(r.top, ${p.y}), y1 = Math.min(r.bottom, ${p.b}); if (x1 - x0 > 6 && y1 - y0 > 6 && btn.getAttribute('aria-pressed') !== 'true') return { id: btn.textContent.trim(), x: (x0 + x1) / 2, y: (y0 + y1) / 2 }; } return null; })()`);
      if (!hit) continue;
      await tapAt({ x: hit.x, y: hit.y });
      reached = { ...hit, pressed: await ev(`[...document.querySelectorAll('#speed button')].find(b => b.textContent.trim() === ${JSON.stringify(hit.id)}).getAttribute('aria-pressed')`) };
      break;
    }
    check(reached && reached.pressed === 'true', `${d.name}: a tap on a speed button under the perched woodpecker reaches it`, reached ? `${reached.id} pressed ${reached.pressed}` : 'the bird over no speed button');
    // (one size: perched under the board, flying, and drumming on it)
    const sizes = await ev(`(() => { // (one strike staged on the held board, tick by tick: its aim, the flight out, the drum, the flight back and its rest)
      const g = SnakeDebug.game(), R = SnakeRender, seen = {}, cell = 18 * 24 + 12, t0 = g.tick, S = t0 + 40;
      g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000); g.woodpecker = null; SnakeDebug.draw();
      g.woodpecker = { x: 12, y: 18, at: g.time, target: [cell], strikeAt: S, last: [], struckAt: -1, restUntil: t0, pecks: 0 };
      let now = performance.now();
      const run = (a, b) => { for (let t = a; t < b; t++) { g.tick = t; for (const u of [0, 0.25, 0.5, 0.75]) { R.frame(u, now += 16); const p = R.birdPose(), k = p.phase + (p.y > ${GRID_PX} ? ' below' : ' on'); (seen[k] ||= new Set()).add(Math.round(p.s * 100) / 100); } } };
      run(t0, S);
      Object.assign(g.woodpecker, { target: [], last: [cell], struckAt: S, strikeAt: S, restUntil: S + TUNING.PECK_REST_MIN, pecks: 1 });
      run(S, S + 40);
      return Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, [...v]])); })()`);
    const all = [...new Set(Object.values(sizes).flat())];
    check(all.length === 1 && sizes['rest below'] && sizes['drum on'], `${d.name}: the woodpecker is one size, perched under the board and drumming on it`, Object.entries(sizes).map(([k, v]) => `${k} ${v.join('/')}`).join(', '));
    await ev(`window.__autoRaf = true; 'ok'`);
  }
}
