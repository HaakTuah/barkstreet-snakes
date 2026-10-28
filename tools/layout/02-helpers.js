await b.send('Page.addScriptToEvaluateOnNewDocument', { source: PRE });
let insetsByCdp = true;
// Until the page has been laid out and drawn since the last change, and
// its own resize observers have run (they place the board for the
// woodpecker, hide a help line the screen cuts, size the board's
// drawing): a new observer's first call comes in the same update, after
// theirs. Twice, for what their own calls change. (A fixed wait alone
// read the page too early now and then, on a busy machine.)
const settle = async () => {
  for (let i = 0; i < 2; i++) await ev(`new Promise(done => { const o = new ResizeObserver(() => { o.disconnect(); done('ok'); }); o.observe(document.documentElement); })`);
};
const open = async (d, query = '') => {
  await b.viewport(d.w, d.h, { scale: d.dpr, mobile: !d.desktop });
  if (insetsByCdp) {
    try { await b.send('Emulation.setSafeAreaInsetsOverride', { insets: d.insets || {} }); } catch { insetsByCdp = false; }
  }
  await b.go(`${site.url}index.html?debug${d.nofs ? '&nofs' : ''}${query}`);
  if (d.insets && !insetsByCdp) { // (an older Chrome: the padded variant, the safe area set by hand)
    const i = d.insets;
    await ev(`(() => { const s = document.createElement('style'); s.textContent = ':root { --safe-t: ${i.top}px; --safe-r: ${i.right}px; --safe-b: ${i.bottom}px; --safe-l: ${i.left}px; } body { padding-top: max(12px, ${i.top}px) !important; padding-bottom: max(16px, ${i.bottom}px) !important; }'; document.head.append(s); dispatchEvent(new Event('resize')); return 'ok'; })()`);
    await b.sleep(100);
  }
  await settle();
};
const toRound = async (button = 'start') => {
  await ev(`document.getElementById('${button}').click(); 'ok'`);
  await ev(`SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`); // (through the countdown, then held still)
  await b.sleep(120);
  await settle();
};
// The header (DESIGN's "The header's rows"): its rows as designed for
// the screen (held upright: the title with Score and Best, then the
// buttons, Best ending their row where only five share it; over the
// board: one row, or the title with Score over Best and then the
// buttons; beside it: the title, Score and Best, the icons, and on a
// tall laptop's column the doors' own row); no button on a row of its
// own, the full-screen button ending a row; each door named wherever its
// row has room for its word (with 5 px to spare), else its picture with
// its name in its tooltip and for a screen reader; and the Field guide's
// door costs the header no height (no taller than the phones work's,
// where that's known), but where it's the doors' own row.
const headerChecks = async (tag, d) => {
  const h = await ev(HEADER), say = h.rows.join(' / ');
  const rowOf = n => h.rows.findIndex(r => r.split(' ').includes(n)), on = (i, n) => i >= 0 && h.rows[i].split(' ').includes(n);
  const fs = rowOf('fullscreen') >= 0, icons = rowOf('pause'), doors = rowOf('guide-open');
  const alone = h.rows.filter(r => !r.includes(' ') && !['title', 'Score', 'Best'].includes(r));
  const doorsOwn = doors !== icons && h.rows[doors] === 'guide-open records-open';
  const full = rowOf('fullscreen'), fullEnds = !fs || h.rows[full].endsWith('fullscreen');
  check(!alone.length && on(icons, 'music') && on(icons, 'mute') && doors === rowOf('records-open') && (doors === icons || doorsOwn) && fullEnds,
    `${tag}: no button on a row of its own; nap, music and mute on one row, the doors in it or in a row of their own${fs ? ', the full-screen button ending a row' : ''}`, say);
  const B = fs ? ' fullscreen' : '';
  const want = {
    upright: fs ? [['title Score Best', 'pause music mute guide-open records-open fullscreen']]
      : d.w <= 340 ? [['title Score Best', 'pause music mute guide-open records-open']] : [['title Score', 'pause music mute guide-open records-open Best']],
    side: [[`title${B}`, 'Score Best', 'pause music mute guide-open records-open']],
    over: [[`title Score Best pause music mute guide-open records-open${B}`], ['title Score Best', `pause music mute guide-open records-open${B}`]],
    column: [[`title${B}`, 'Score Best', 'pause music mute guide-open records-open'], ['title', `Score Best${B}`, 'pause music mute guide-open records-open'],
      ['title', 'Score Best', `pause music mute guide-open records-open${B}`], ['title', 'Score Best', `pause music mute${B}`, 'guide-open records-open']],
  }[h.place];
  check(want.some(w => w.join(' / ') === say), `${tag}: the header's rows, as designed ${{ upright: 'held upright', side: 'on its side', over: 'over the board', column: 'beside the board' }[h.place]}`, say);
  if (doorsOwn) check(h.guide && h.trophy && d.h >= (d.desktop ? 700 : 780), `${tag}: the doors' own row, both named, only on a column tall enough`);
  // Each door shown by its picture: its word, with 5 px to spare, has no room in its row.
  for (const [id, n] of [['guide-open', 'Field guide'], ['records-open', 'Hall of Fame']]) {
    if (id === 'guide-open' ? h.guide : h.trophy) continue;
    await ev(DOOR(id, 'word'));
    await settle();
    const w = await ev(HEADER);
    await ev(`document.getElementById('door-test').remove(); 'ok'`);
    await settle();
    const fits = w.rows.join(' / ') === say && Math.abs(w.height - h.height) < 0.5;
    check(!fits, `${tag}: the ${n} is its picture only where its row has no room for its word (with 5 px to spare)`, fits ? `it would fit: ${w.rows.join(' / ')}` : `its word would make it ${w.rows.join(' / ')}, ${r1(w.height)} px tall`);
  }
  check(h.tip === 'Field guide (G)' && h.label === 'Field guide', `${tag}: the Field guide's door says its name in its tooltip and to a screen reader`, `${h.guide ? 'named' : 'its open book'}; "${h.tip}", "${h.label}"`);
  await ev(DOOR('guide-open', 'hidden'));
  await settle();
  const without = await ev(HEADER);
  await ev(`document.getElementById('door-test').remove(); 'ok'`);
  await settle();
  check(doorsOwn || without.height >= h.height - 0.5, `${tag}: the Field guide's door costs the header no height`, `${r1(h.height)} px, ${r1(without.height)} without it`);
  if (d.head) check(h.height <= d.head + (doorsOwn ? 50 : 0) + 0.5, `${tag}: the header is no taller than the phones work's, ${d.head} px${doorsOwn ? ', but for the doors\' own row' : ''}`, `${r1(h.height)} px`);
  return h;
};

// The chatter full (five long lines, two rows each on a phone), playing
// or watching, anywhere: the page one screen tall; the chatter's lines
// whole, inside its panel and its box, under the row under the board,
// the newest at least (cut to its rows that fit only where it alone
// doesn't), and no row sliced through; or, with no room for a row, no
// panel, its switch still on the screen and taking a tap. On its side,
// the column off the screen's top and bottom. Watching (but held
// upright on a phone, where the speed buttons take the help's place),
// the help gives the chatter its room only where the log couldn't show
// a row beside it: the help made to show, the chatter shows none.
// (Before the page was one screen tall, this ran only on its side, where
// the column was the screen's height: the log was cut at its last whole
// row, by a clip, at its box, the chatter's or the page's bottom.)
// Beside the board on a desktop (style/screens.css, game/screen.js
// fadeChatter), a round's 40 lines: the panel runs down to the board's
// bottom edge, the newest at its bottom, whole; a line cut by the log's
// top edge doesn't show (faded to nothing), the ones under the fade
// whole; the wheel reads back to the oldest, whole and unfaded; and it
// scrolls the log, never the page. Elsewhere the log doesn't scroll.
const chatterScroll = async (tag, desk) => {
  const scrolls = await ev(`getComputedStyle(document.getElementById('chatlog')).overflowY === 'auto'`);
  if (!desk) {
    check(!scrolls, `${tag}: the chatter's log doesn't scroll here (only beside the board on a desktop)`);
    const many = await ev(`(() => { const log = document.getElementById('chatlog'), keep = log.innerHTML; for (let i = 0; i < 40; i++) log.insertAdjacentHTML('afterbegin', '<li><strong>Star</strong> <span>Mine!</span></li>'); return new Promise(r => setTimeout(() => { const n = [...log.children].filter(li => li.getBoundingClientRect().height).length; log.innerHTML = keep; r(n); }, 80)); })()`);
    check(many <= 5, `${tag}: with a round's lines, the chatter shows the newest 5 at most here, as before`, `${many} shown`);
    await b.sleep(60);
    return;
  }
  check(scrolls, `${tag}: beside the board on a desktop, the chatter's log scrolls`);
  if (!scrolls) return;
  await ev(`(() => { const log = document.getElementById('chatlog'); log.textContent = ''; for (let i = 0; i < 40; i++) log.insertAdjacentHTML('afterbegin', '<li data-i="' + i + '"><strong>Gobbler</strong> <span>' + (i % 2 ? 'Mine!' : 'Out of my way! I’m starving, and the bark is bare!') + '</span></li>'); return 'ok'; })()`);
  await b.sleep(500); // (past the lines' entrance, their opacity from nothing)
  await settle();
  const SEEN = `(() => { const log = document.getElementById('chatlog'), lb = log.getBoundingClientRect(), edge = lb.top + log.clientTop, foot = lb.bottom - log.clientTop; const ls = [...log.children].map(li => { const r = li.getBoundingClientRect(); return { i: +li.dataset.i, t: r.top, b: r.bottom, o: +getComputedStyle(li).opacity }; }); return { edge, foot, ls, scrollY, fit: document.querySelector('.chatter').dataset.fit }; })()`;
  const L = await ev(LAYOUT), at = await ev(SEEN);
  const shown = at.ls.filter(l => l.b > at.edge + 0.5 && l.t < at.foot - 0.5), cut = shown.filter(l => l.t < at.edge - 0.5), whole = shown.filter(l => l.t >= at.edge - 0.5 && l.b <= at.foot + 0.5);
  const bottom = shown.reduce((m, l) => l.b > m.b ? l : m, shown[0] || { i: -1 });
  check(at.fit === 'full' && Math.abs(L.chatlog.b - L.frame.b) <= 1.5 && L.chatlog.b <= L.chatter.b + 0.5, `${tag}: with a round's lines, the chatter's panel runs down to the board's bottom edge`, `the panel to ${r1(L.chatlog.b)}, the board's frame to ${r1(L.frame.b)}, ${at.fit}`);
  check(bottom.i === 39 && bottom.o === 1 && whole.length >= 5, `${tag}: the newest line at the panel's bottom, whole, under the older lines (${whole.length} whole)`, `the bottom line #${bottom.i}, opacity ${bottom.o}`);
  check(cut.every(l => l.o === 0) && whole.filter(l => l.t - at.edge > 40).every(l => l.o === 1), `${tag}: the older lines fade at the log's top, a line cut by its edge not shown at all`, cut.map(l => `#${l.i} cut, opacity ${l.o}`).join(', ') || 'none cut');
  await b.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: L.chatlog.x + L.chatlog.w / 2, y: L.chatlog.y + L.chatlog.h / 2, deltaX: 0, deltaY: -20000 });
  await b.sleep(400);
  await settle();
  const back = await ev(SEEN), oldest = back.ls.find(l => l.i === 0);
  check(back.scrollY === at.scrollY && oldest.t >= back.edge - 0.5 && oldest.o === 1, `${tag}: the wheel reads back to the oldest line, whole and unfaded, scrolling the log, not the page`, `the oldest from ${r1(oldest.t)} (the log's edge ${r1(back.edge)}), opacity ${oldest.o}`);
  await ev(`(() => { const log = document.getElementById('chatlog'); log.scrollTop = 0; while (log.children.length > 5) log.lastElementChild.remove(); return 'ok'; })()`);
  await b.sleep(60);
};
const chatterFull = async (tag, watching, si = { bottom: 0 }, side = false, upright = false) => {
  const what = watching ? 'watching' : 'playing';
  await ev(`(() => { const log = document.getElementById('chatlog'); for (let i = 0; i < 5; i++) log.insertAdjacentHTML('afterbegin', '<li><strong>Gobbler</strong> <span>Out of my way! I’m starving, and the bark is bare!</span></li>'); return 'ok'; })()`);
  await b.sleep(60);
  await settle();
  const full = await ev(LAYOUT), rows = await ev(LOG_ROWS), fit = await ev(`document.querySelector('.chatter').dataset.fit`);
  check(full.scrollH <= full.vh && full.scrollW <= full.vw, `${tag}: ${what}, the chatter full, nothing scrolls: the page is one screen tall`, `${full.scrollW}×${full.scrollH} of ${full.vw}×${full.vh}; the chatter ${fit}, ${rows.lines} of 5 lines${rows.parts ? ' (the newest cut)' : ''}`);
  if (side) check(full.header.y >= 4 && full.chatter.b <= full.vh - Math.max(2, si.bottom), `${tag}: ${what}, the column keeps off the screen's top and bottom`, `header from ${r1(full.header.y)}, the chatter's box down to ${r1(full.chatter.b)} of ${full.vh}`);
  if (fit === 'none') {
    const reach = await ev(REACH('#chatter-toggle'));
    check(!full.chatlog && reach.length === 1 && reach[0].on && reach[0].taps, `${tag}: ${what}, with no room for a row, the chatter shows none, and its switch is on the screen and takes a tap`, `the chatter's box ${full.chatter ? r1(full.chatter.h) : 0} px`);
  } else {
    check(full.chatlog.b <= full.chatter.b + 0.5 && rows.end <= full.chatlog.b - 2.5 && full.foot.b <= full.chatter.y + 0.5, `${tag}: ${what}, a full chatter's lines end inside its panel, and the panel inside its box, under the row under the board`, `words down to ${r1(rows.end)}, the panel to ${r1(full.chatlog.b)}, its box to ${r1(full.chatter.b)}`);
    check(rows.whole >= 1 && !rows.sliced && rows.lines >= 1 && (rows.parts === 0 || rows.lines === 1), `${tag}: ${what}, a full chatter shows whole lines, the newest at least (cut to its rows only where it alone doesn't fit), and no row sliced through`, `${rows.lines} lines${rows.parts ? ', the newest cut' : ''}, ${rows.whole} rows whole, ${rows.sliced} sliced`);
  }
  if (upright && fit !== 'none') {
    // (held upright, the chatter folded: a strip of one row, the newest
    // line; a tap opens it to as many whole lines as fit, the caption
    // first where there's room for two rows, and another folds it)
    const folded = await ev(`document.querySelector('.chatter').getAttribute('aria-expanded')`);
    const ROWS_SHOWN = `(() => { const log = document.getElementById('chatlog'), row = parseFloat(getComputedStyle(log).lineHeight); let h = 0; for (const li of log.children) { const r = li.getBoundingClientRect(), st = getComputedStyle(li); if (r.height) h += r.height - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom); } return Math.round(h / row * 10) / 10; })()`;
    const foldedRows = await ev(ROWS_SHOWN);
    check(folded === 'false' && fit === 'strip' && rows.lines === 1 && foldedRows === 1, `${tag}: ${what}, held upright, the chatter is folded: one row, the newest line`, `aria-expanded ${folded}, ${fit}, ${rows.lines} lines, ${foldedRows} rows`);
    const tapChatter = async (below = false) => { // (a finger's tap on the strip, through the page's own touch handling; or under it, in the chatter's box's empty rest)
      const at = await ev(`(() => { const r = document.getElementById('chatlog').getBoundingClientRect(), box = document.querySelector('.chatter').getBoundingClientRect(); return ${below} ? (box.bottom - r.bottom >= 12 ? { x: r.left + r.width / 3, y: (r.bottom + Math.min(box.bottom, innerHeight)) / 2 } : null) : { x: r.left + r.width / 3, y: r.top + Math.min(8, r.height / 2) }; })()`);
      if (!at) return false;
      await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...at, id: 1 }] });
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await b.sleep(60);
      return true;
    };
    if (await tapChatter(true)) check(await ev(`document.querySelector('.chatter').getAttribute('aria-expanded')`) === 'false', `${tag}: ${what}, held upright, a tap under the folded strip, in the chatter's empty rest, leaves it folded (it's the board's: a jump)`);
    const tap = await tapChatter();
    await settle();
    const opened = await ev(LAYOUT), orows = await ev(LOG_ROWS), ofit = await ev(`document.querySelector('.chatter').dataset.fit`), oexp = await ev(`document.querySelector('.chatter').getAttribute('aria-expanded')`);
    const openRows = await ev(ROWS_SHOWN);
    check(tap && oexp === 'true' && !orows.sliced && (full.vh < 780 ? openRows >= foldedRows : openRows > foldedRows && ofit === 'full' && orows.lines >= 2) && opened.scrollH <= opened.vh && opened.board.w === full.board.w, `${tag}: ${what}, held upright, a tap opens the chatter to the lines that fit (the board unmoved, nothing scrolls)`, `${tap ? '' : 'the tap went elsewhere; '}aria-expanded ${oexp}, ${ofit}, ${orows.lines} lines, ${openRows} rows, ${orows.sliced} sliced`);
    await tapChatter();
    await settle();
    check(await ev(`document.querySelector('.chatter').getAttribute('aria-expanded')`) === 'false', `${tag}: ${what}, held upright, another tap folds it`);
  }
  if (!watching || upright) return;
  await ev(`(() => { const st = document.createElement('style'); st.id = 'help-made-to-show'; st.textContent = 'main #help { display: block !important; }'; document.head.append(st); return 'ok'; })()`);
  await settle();
  const shown = await ev(`document.querySelector('.chatter').dataset.fit`), crowded = await ev(HELP_FITS);
  await ev(`document.getElementById('help-made-to-show').remove(); 'ok'`);
  await settle();
  const gone = !full.help, room = shown !== 'none';
  check(gone === (!room || crowded.squeezed || crowded.pushes), `${tag}: watching, the help gives the chatter its room only where, beside it, the log couldn't show a row of words (or where it doesn't fit its row)`, `the help ${gone ? 'gone' : 'shown'}; beside it, the chatter would show ${shown}${crowded.squeezed ? ', the help squeezed past its box' : ''}${crowded.pushes ? ', the help taking the row off the screen' : ''}`);
};
// One screen (DESIGN's "One screen"): in every state, the page is the
// screen's height and width, never more: the start card, the countdown,
// playing, playing with the chatter full, a nap, your death's card, the
// round's card, the Hall of Fame and the Field guide open (over the page,
// which must still fit behind them), and watching with the chatter full.
// (Before, with the chatter full, the page ran 78 to 116 px past a 1080p
// desktop's browser, 61 to 117 past a tablet held upright, and 25 to
// 347 past a phone held upright.)
const oneScreen = async (tag, d) => {
  const seen = [];
  const look = async state => { await settle(); seen.push({ state, ...(await ev(SCROLL)) }); };
  await open(d);
  await ev(HELPERS);
  await look('the start card');
  await ev(`document.getElementById('start').click(); 'ok'`);
  await b.sleep(120);
  await look('the countdown');
  await ev(`SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`);
  await b.sleep(100);
  await look('playing');
  await ev(FILL);
  await look('playing, the chatter full');
  await ev(`window.__autoRaf = true; document.getElementById('pause').click(); 'ok'`);
  await b.sleep(250);
  await look('a nap');
  await ev(`document.getElementById('pause').click(); __kill.push(0); 'ok'`);
  const died = await ev(`waitFor(() => cardUp() && SnakeDebug.state() !== 'paused', 15000).then(() => true, () => false)`);
  await b.sleep(700);
  await ev(FILL);
  await look('your death\'s card');
  await ev(`document.getElementById('watch').click(); __kill.push(1, 2); 'ok'`);
  const over = await ev(`waitFor(() => SnakeDebug.state() === 'over' && cardUp(), 15000).then(() => true, () => false)`);
  await b.sleep(700);
  await ev(FILL);
  await look('the round\'s card');
  await ev(`document.getElementById('records-open').click(); 'ok'`);
  await b.sleep(350);
  await look('the Hall of Fame open');
  await ev(`document.querySelector('#records .tab[data-tab="guide"]').click(); 'ok'`);
  await b.sleep(250);
  await look('the Field guide open');
  await ev(`document.getElementById('records-close').click(); 'ok'`);
  await open(d);
  await ev(`document.getElementById('watch').click(); SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`);
  await b.sleep(100);
  await ev(FILL);
  await look('watching, the chatter full');
  const board = await ev(`document.getElementById('game').getBoundingClientRect().width`);
  await ev(`window.__autoRaf = true; 'ok'`);
  check(died && over, `${tag}: a round played to your death and to its end`);
  for (const s of seen) check(s.h <= s.vh && s.w <= s.vw, `${tag}: ${s.state}, nothing scrolls`, `${s.w}×${s.h} of ${s.vw}×${s.vh}`);
  return board;
};
// What more than one part fills in or reads (so each CI job can run on its own: LAYOUT_JOB in the
// runner): the heights in between and the desktops' boards, for the summary, and the board's width.
const between = [];
const oneBoards = [];
const BOARD_W = `document.getElementById('game').getBoundingClientRect().width`;
