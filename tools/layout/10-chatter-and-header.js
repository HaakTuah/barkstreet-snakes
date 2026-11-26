// ----------------------------------------------- the chatter streaming in
// Lines coming and going in the log while you play (the chatter fits
// them as they come, never per frame): the board never moves or changes
// size, nothing scrolls, and no resize observer's loop is reported, on a
// phone whose chatter has room for lines, one with a strip, one with
// none, and a desktop's column.
for (const d of [CALLS, sized(375, 635), sized(320, 460), DESKTOPS[0]]) {
  if (only && !d.name.includes(only)) continue;
  await open(d);
  await toRound();
  const rect = `(() => { const r = document.getElementById('game').getBoundingClientRect(); return [r.x, r.y, r.width].map(v => Math.round(v * 10) / 10).join(','); })()`;
  const at0 = await ev(rect), fits = new Set(), moved = [];
  await ev(`__errs.length = 0; 'ok'`);
  for (let i = 0; i < 24; i++) {
    await ev(`(() => { const log = document.getElementById('chatlog'), li = document.createElement('li'); li.innerHTML = '<strong>Gobbler</strong> <span>' + ['Mine!', 'Out of my way! I’m starving, and the bark is bare!', 'Is it lunchtime? It feels like lunchtime.'][${i} % 3] + '</span>'; log.prepend(li); while (log.children.length > 5) log.lastElementChild.remove(); return 'ok'; })()`);
    await b.sleep(25);
    if (i % 4 === 3) {
      await settle();
      fits.add(await ev(`document.querySelector('.chatter').dataset.fit`));
      const r = await ev(rect), s = await ev(SCROLL);
      if (r !== at0 || s.h > s.vh) moved.push(`${i + 1} lines in: the board ${r}${s.h > s.vh ? `, the page ${s.h} of ${s.vh}` : ''}`);
    }
  }
  const errs = await ev(`__errs.join(' | ')`);
  check(!moved.length && !errs, `${d.name}: lines streaming into the chatter (24, the log keeping 5) never move the board or scroll the page, and set off no resize observer's loop`, [...moved, errs].filter(Boolean).join('; ') || `the board ${at0}; the chatter ${[...fits].join(', ')}`);
  await ev(`window.__autoRaf = true; 'ok'`);
}

// ---------------------------------------------- the header on more screens
// The header's checks (above) on the screens between: a 1080p desktop's
// browser maximized (1920×945) and with a bookmarks bar (1920×920), in
// the column beside the board now, with the doors' own row (they had the
// header over the board, its one row); a 1440p one's (2560×1305) and
// half a 1080p screen's window (960×945), over the board still;
// laptops (1366×657, 1366×768, 1440×900, 1536×864), 4:3 windows and touch
// screens (800×600, 1000×800 and 1040×760 with touch), iPads upright
// (the mini, 744×1133; an Air, 820×1180), narrow windows (460×900, and
// 500×1000 with touch: an iPad's Split View; 600×900), and phones
// (360×640, 371×800, 384×854, 393×851, 414×896 and 428×926 without full
// screen, 440×900); narrow windows that aren't tall, whose page narrows
// with the board (460×612, 480×638 and 470×376, with a mouse and with
// touch: the full-screen button went onto a row of its own, and at
// 470×376 the title onto two lines, 32 px over the phones work's), and a
// window 230 px wider than tall (920×690: its column's six icons in a
// row); and without full screen (an older Safari, a page in a frame),
// where the doors' words have the sixth button's room: 1366×657, 1920×945,
// an iPad mini and an iPad upright. And as Score and Best grow to 1000,
// the header keeps its rows and its height. (head: the phones work's,
// where it's no taller.)
for (const [w, h, dpr, touch, nofs, head] of [[1920, 945, 1], [1920, 920, 1], [2560, 1305, 1], [960, 945, 1], [1366, 657, 1], [1366, 768, 1], [1440, 900, 1], [1536, 864, 1], [800, 600, 1, false, false, 204], [800, 600, 2, true],
  [1000, 800, 2, true], [1040, 760, 2, true], [744, 1133, 2, true], [820, 1180, 2, true], [460, 900, 1], [500, 1000, 2, true], [600, 900, 1], [360, 640, 3, true],
  [371, 800, 3, true], [384, 854, 3, true], [393, 851, 3, true], [414, 896, 3, true, true], [428, 926, 3, true, true], [440, 900, 3, true],
  [460, 612, 1, false, false, 136], [480, 638, 1, false, false, 136], [470, 376, 1, false, false, 136], [460, 612, 2, true, false, 156], [490, 652, 2, true, false, 156], [470, 376, 2, true, false, 156],
  [920, 690, 1, false, false, 162], [1366, 657, 1, false, true], [1920, 945, 1, false, true], [744, 1133, 2, true, true], [768, 1024, 2, true, true]]) {
  const tag = `${w}×${h}${touch ? ' (touch)' : ''}${nofs ? ' without full screen' : ''}`;
  if (only && !tag.includes(only)) continue;
  const d = { w, h, dpr, desktop: !touch, nofs, head };
  await open(d);
  const at0 = await headerChecks(tag, d);
  await ev(`(() => { document.getElementById('score').textContent = '1000'; document.getElementById('best').textContent = '1000'; return 'ok'; })()`);
  await settle();
  const at1000 = await ev(HEADER);
  check(at1000.rows.join(' / ') === at0.rows.join(' / ') && Math.abs(at1000.height - at0.height) < 0.5, `${tag}: with Score and Best at 1000, the header keeps its rows and its height`, `${at1000.rows.join(' / ')}, ${r1(at1000.height)} px`);
}
