// ------------------------------------------ the column beside the board
// A 1366x768 laptop's browser (1366x657): the doors stay in the icons'
// row, pictures beside the full-screen button (the six fill it), and
// watching with the chatter's log full (five lines) the page doesn't
// scroll. 1280x800 has the height for the doors' own row, both named,
// and keeps it with the log full.
const column = `(() => {
  const cy = id => { const r = document.getElementById(id).getBoundingClientRect(); return r.top + r.height / 2; };
  const log = document.getElementById('chatlog'); log.textContent = '';
  for (const [n, t] of [['Ouroboros', 'Round and round I go, and so do you.'], ['Gobbler', 'Is that an apple? Mine, all mine!'], ['Metagamer', 'I saw that coming two moves ago.'], ['Copycat', 'Anything you can do, I can do too.'], ['Mason', 'Brick by brick, row by row, wall by wall.']]) { const li = document.createElement('li'); li.innerHTML = '<strong></strong> <span></span>'; li.firstChild.textContent = n; li.lastChild.textContent = t; log.append(li); }
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r({
    inIconsRow: Math.abs(cy('guide-open') - cy('mute')) < 4 && Math.abs(cy('records-open') - cy('mute')) < 4,
    guide: vis(document.querySelector('#guide-open .trophy-text')), trophy: vis(document.querySelector('#records-open .trophy-text')),
    scroll: document.documentElement.scrollHeight - innerHeight,
  }))));
})()`;
// A 1080p screen's browser (1920x945 with its bookmarks bar, 1920x913,
// and 1920x1080) has the column too, now that it goes up to 1180 px
// tall, and the height for the doors' own row: its rows, both doors
// named, and with Score and Best at 1000 nothing moves.
for (const [w, h] of [[1920, 945], [1920, 913], [1920, 1080]]) {
  await b.viewport(w, h);
  await load();
  const r = await ev(headerRows), want = 'title / Score Best / pause music mute fullscreen / guide-open records-open';
  check(r.rows.join(' / ') === want && r.guide && r.trophy && !r.sideways, `${w}x${h}: beside the board, the title, Score and Best, the icons, and the doors' own row, both named`, JSON.stringify(r));
  await ev(grow);
  const r1000 = await ev(headerRows);
  check(r1000.rows.join(' / ') === want && r1000.height === r.height, `${w}x${h}: with Score and Best at 1000, nothing moves`, JSON.stringify(r1000));
}
for (const [w, h, iconsRow, guideNamed, trophy, q] of [[1366, 657, true, false, false, ''], [1280, 800, false, true, true, ''], [1366, 657, true, true, false, '&nofs'], [1920, 945, false, true, true, '']]) {
  await b.viewport(w, h);
  await load(q);
  await fresh(['ouroboros', 'metagamer', 'gobbler'], true);
  const c = await ev(column);
  check(c.inIconsRow === iconsRow && c.guide === guideNamed && c.trophy === trophy && c.scroll <= 0, `${w}x${h}${q ? ' without full screen' : ''}, watching with the chatter full: ${iconsRow ? `the doors in the icons’ row, ${guideNamed ? 'the Field guide by name (the sixth icon’s room)' : 'their pictures'}` : 'the doors’ own row, both named'}, and the page doesn’t scroll`, JSON.stringify(c));
}
// A 4:3 or 5:4 window's narrow column (216 to 253 px with a mouse): the
// six icons share their row, 32 px, and the header is no taller than the
// phones work's (162 px: the full-screen button took the corner beside
// the title, 176).
for (const [w, h] of [[920, 690], [800, 600]]) {
  await b.viewport(w, h);
  await load();
  const r = await ev(headerRows), icon = await ev(`document.getElementById('pause').getBoundingClientRect().width`);
  check(r.rows.join(' / ') === 'title / Score Best / pause music mute guide-open records-open fullscreen' && r.height <= 162 && icon === 32, `${w}x${h}: the column's six icons in one row, 32 px, the header no taller than the phones work's`, `${JSON.stringify(r)}, icons ${icon} px`);
}
