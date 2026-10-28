// ------------------------------------------------- last words on phones
// The snake whose death ends the round has its last words read whole
// where a phone's player sees them: where the log can't show them (a
// folded strip of one row at 390x664 and 375x553, no panel at 320x460),
// they stay in their bubble where it went out, whole, on the board and
// unfaded by your snake beside it, and the round's card waits for them
// (it came up 600 ms after the death, clearing them, the strip's line cut
// and the panel none). Beside the board on a desktop the log shows them:
// no bubble, and the card as soon as ever.
const LAST = `(() => new Promise(res => {
  const g = SnakeDebug.game(), m = g.snakes.find(s => !s.isPlayer), seen = [];
  m.burnFrom = g.tick; m.burnUntil = g.tick + 400;
  let over = 0;
  const t = setInterval(() => {
    if (m.alive) { m.body.length = Math.min(m.body.length, 3); m.grow = 0; return; }
    if (SnakeDebug.state() !== 'over') return;
    over ||= performance.now();
    const bd = document.querySelector('.board').getBoundingClientRect(), bu = document.querySelector('.board .bubble');
    if (bu) { const r = bu.getBoundingClientRect(), sp = bu.querySelector('span'); seen.push({ text: bu.textContent, inside: r.left >= bd.left && r.right <= bd.right && r.top >= bd.top && r.bottom <= bd.bottom, near: bu.classList.contains('near'), cut: sp.scrollHeight > sp.clientHeight + 1 || sp.scrollWidth > sp.clientWidth + 1, card: cardUp() }); }
    if (cardUp()) {
      clearInterval(t);
      const log = document.querySelector('#chatlog li');
      res({ wait: Math.round(performance.now() - over), said: log ? log.textContent.slice(m.name.length).trim() : '', fit: document.querySelector('.chatter').dataset.fit, seen, after: document.querySelectorAll('.board .bubble').length });
    }
  }, 40);
}))()`;
for (const [w, h, phone] of [[390, 664, true], [375, 553, true], [320, 460, true], [1280, 800, false]]) {
  await b.viewport(w, h, phone ? { scale: 2, mobile: true } : {});
  await load();
  await fresh(['mason']);
  const r = await ev(LAST), tag = `${w}x${h}`;
  const before = r.seen.filter(s => !s.card);
  if (phone) {
    check(before.length && before.every(s => s.text === r.said && s.inside && !s.near && !s.cut), `${tag}: the last rival out says its last words in their bubble where it went out, whole, on the board, unfaded (the chatter ${r.fit})`, `“${r.said}”: ${before.length} looks, ${JSON.stringify(before.find(s => s.text !== r.said || !s.inside || s.near || s.cut) || 'all whole')}`);
    check(r.wait >= 1500 && r.wait <= 2600 && !r.seen.some(s => s.card) && !r.after, `${tag}: ...the round’s card waits for them (their time on the board), and takes them away as it comes up`, `the card ${r.wait} ms after the round’s end; ${r.after} bubbles with it`);
  } else check(!r.seen.length && r.wait < 1200 && r.said, `${tag}: beside the board the log shows the last words, no bubble, and the card comes as ever`, `“${r.said}”, the card ${r.wait} ms after, ${r.seen.length} bubble looks`);
}
