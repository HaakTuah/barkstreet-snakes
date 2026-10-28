// ------------------------------- the fullest death card on a phone's board
// A first good round's real card (a new best, the Hall of Fame's carve
// and the Field guide's link), its reason made the longest a round
// gives: it fits its board, nothing under the sticky buttons and no
// scroll. What it shows follows the board: the badge, the carve and the
// link from 331 px (on boards up to 403 the death's quip waits while the
// carve is offered: at 390x844, 382 px, the card scrolled 15 px), the
// carve and the link from 301, and on the smallest the carve alone,
// the link back once your name's in ("Carved: …", the field gone). With
// a rival's note up, the badge and the carve wait, and come back with
// the card's words. The same on a phone on its side, whose board (381
// to 440 px here) had the desktop's card and scrolled (15 px at
// 896x414, a note on the start card 69), and on a Galaxy Fold's cover
// screen (336 px: the badge gives way to the carve up to 340; it scrolled
// 6 px). Before your round, the start card fits, with the longest blurbs
// and with a note. And where your death ends the round (one rival), its
// card says how you died with more words ("· lasted 2:41"): with the
// longest, and the longest win line, it fits too (the badge waits up to
// 390 px, the quip up to 419).
const LONG = 'You crashed head-on into Capricious, the same length: both out · 4th place · score 128';
const LONG_ROUND = 'You crashed head-on into Capricious, the same length: both out · shared 1st · lasted 2:41 · score 128';
const QUIP = 'Gobbler was thinking about apples. It always is.', WIN = 'It copied the winner until it was one.';
const words = (text, flavor) => `(() => { document.getElementById('overlay-text').textContent = ${JSON.stringify(text)}; const f = document.getElementById('overlay-flavor'); f.textContent = ${JSON.stringify(flavor)}; f.hidden = false; return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1)))); })()`;
const over = `(() => { const c = document.querySelector('#overlay .card'); return c.scrollHeight - c.clientHeight; })()`;
const fitNow = `(() => {
  const $ = id => document.getElementById(id), card = document.querySelector('#overlay .card'), bt = document.querySelector('#overlay .buttons').getBoundingClientRect();
  const shown = [['overlay-badge', 'badge'], ['name-row', 'carve'], ['how', 'link']].filter(([id]) => vis($(id))).map(([, n]) => n).join('+');
  return { board: Math.round(document.querySelector('.board').getBoundingClientRect().height), over: card.scrollHeight - card.clientHeight, shown, rank: $('name-rank').textContent, field: vis($('name-input')), under: vis($('name-input')) ? Math.round(Math.max(0, $('name-input').getBoundingClientRect().bottom - bt.top)) : 0 };
})()`;
for (const [w, h, want, round] of [[390, 844, 'badge+carve+link', 'carve+link'], [375, 667, 'badge+carve+link'], [428, 926, 'badge+carve+link'], [360, 640, 'badge+carve+link'], [320, 640, 'carve+link'], [320, 460, 'carve'],
  [344, 882, 'carve+link'], [844, 391, 'badge+carve+link', 'carve+link'], [896, 414, 'badge+carve+link', 'badge+carve+link'], [929, 430, 'badge+carve+link'], [972, 450, 'badge+carve+link']]) {
  await b.viewport(w, h, { scale: 2, mobile: true });
  await load();
  await ev(`['snake-highscores', 'snake-stats', 'snake-name'].forEach(k => localStorage.removeItem(k)); localStorage.setItem('snake-best', '5'); 1`); // (a best to beat, an empty Hall of Fame, no name yet)
  await load();
  await ev(`SnakeDebug.setup(['joker', 'capricious', 'vulture']); 'ok'`); // (the longest blurbs)
  await b.sleep(300);
  const start = await ev(over);
  await tap(await tagAt('Joker'));
  const startNote = await ev(over);
  p = await P();
  check(start <= 0 && startNote <= 0 && p.note.startsWith('Joker'), `phone ${w}x${h}: the start card fits, and with a rival's note on it`, `${start} / ${startNote} px over`);
  await tap(await at('#note-close'));
  // (your death's card, not the round's end that can follow it: the rivals go on behind it)
  const yourCard = `SnakeDebug.state() !== 'over' && document.getElementById('how').textContent.startsWith('Field guide:')`;
  for (let tries = 0; tries < 3; tries++) {
    await fresh(['joker', 'capricious', 'vulture']);
    await ev(`me().eaten = 30; 1`);
    await die();
    if (await ev(yourCard)) break;
  }
  await ev(words(LONG, QUIP));
  let f = await ev(fitNow);
  check(f.over <= 0 && f.under === 0 && f.shown === want, `phone ${w}x${h}: the fullest death card, the longest reason and quip, fits its ${f.board} px board (${want})`, JSON.stringify(f));
  { // (a rival's note, on every screen)
    await tap(await tagAt('Joker'));
    f = await ev(fitNow);
    p = await P();
    check(p.note.startsWith('Joker') && f.over <= 0 && !/badge|carve/.test(f.shown), `phone ${w}x${h}: with a note on it, the badge and the carve wait, and it still fits`, JSON.stringify(f));
    await tap(await at('#note-close'));
    f = await ev(fitNow);
    check(f.shown === want && f.over <= 0, `phone ${w}x${h}: closing the note brings them back`, JSON.stringify(f));
  }
  if (h === 460) {
    await tap(await at('#name-input'));
    await b.send('Input.insertText', { text: 'Perry' });
    await key('Enter');
    f = await ev(fitNow);
    check(f.rank === 'Carved: Perry.' && !f.field && f.shown === 'carve+link' && f.over <= 0, `phone ${w}x${h}: once your name's carved, the field goes and the Field guide's link is back, and it still fits`, JSON.stringify(f));
    await key('Escape'); // (keep watching)
    await wait(`!cardUp()`);
    await ev(`pilot.on = false; 1`);
    await fresh(['joker', 'capricious', 'vulture']);
    await ev(`me().eaten = 40; 1`);
    await die();
    f = await ev(fitNow);
    check(/^Hall of Fame #\d+, as Perry\.$/.test(f.rank) && !f.field && f.shown === 'carve+link' && f.over <= 0, `phone ${w}x${h}: the next good round, with a name already carved, the link is there from the start`, JSON.stringify(f));
  }
  if (round) {
    await key('Escape'); // (keep watching)
    await wait(`!cardUp()`);
    await ev(`pilot.on = false; 1`);
    await fresh(['copycat']);
    await ev(`me().eaten = 40; pilot.crash = true; 1`); // (a new best: the carve offered again, no name yet)
    await wait(`SnakeDebug.state() === 'over' && cardUp()`);
    await b.sleep(1000);
    await ev(words(LONG_ROUND, WIN));
    f = await ev(fitNow);
    check(f.over <= 0 && f.under === 0 && f.shown === round, `phone ${w}x${h}: your death ends the round, and its fullest card, the longest words, fits (${round})`, JSON.stringify(f));
    if (w === 390) { // (a win's round card keeps its badge: what gives way is for the card your death ended)
      await ev(`pilot.on = false; 1`);
      await fresh(['copycat']);
      await ev(`me().eaten = 99; pilot.on = false; const r = SnakeDebug.game().snakes.find(s => s !== me()); r.alive = false; r.diedAt = SnakeDebug.game().time; 1`);
      await wait(`SnakeDebug.state() === 'over' && cardUp()`);
      await b.sleep(1000);
      f = await ev(fitNow);
      check(/badge/.test(f.shown) && f.over <= 0, `phone ${w}x${h}: a win with a new best keeps its badge on the round's card`, JSON.stringify(f));
    }
  }
}

// On a 568x320 board (266 px), the start card's two links share a row
// (at 215 px of its 214 they took two, and the rivals' names went under
// Play).
await b.viewport(568, 320, { scale: 2, mobile: true });
await load();
const linkRows = await ev(`new Set([...document.querySelectorAll('#overlay .card-links > *')].filter(e => vis(e)).map(e => Math.round(e.getBoundingClientRect().top))).size`);
check(linkRows === 1, 'a phone on its side at 568x320: the start card’s How to play and Play with friends share a row', `${linkRows} rows`);
