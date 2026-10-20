#!/usr/bin/env node
// The owner's playtest, in headless Chrome with real mouse, key and touch
// events (the DevTools protocol), on a desktop (1280x800) and on phones
// (390x844 and 320x640). It checks what DESIGN's "The owner's playtest" promises:
// - A rival's note: a click, a tap or Enter on a name tag while a card is up
//   (napping, your death's card, the round's end) puts the rival's note in
//   place of the card's words, and it stays until you're done with it (it
//   used to be swapped back after 3.2 s): its tag again, another tag (which
//   swaps it), its ×, Esc (before anything else Esc does), a click on the
//   card or the log; a new card brings its own words. Your own tag: your
//   powers, or that you're out. It keeps up with the round behind your
//   death's card. While you play, a tag puts nothing over the log; while you
//   watch, its note is a banner, up as long as it takes to read.
// - The Field guide's doors: its own button in the header (named on a
//   desktop), G, How to play on the start card, Field guide on the nap card,
//   and your death's card naming what got you (the guide opens at that row,
//   lit, under the book's tabs and its ×, which stay on the screen and close
//   it), and the round's card too when your death ends it. Each door opens
//   the book on its own tab, and the book is named for what it shows; in
//   the book, H and G go to their tabs, or close it from there. The basics
//   have the renderer's pictures.
// - The header: held upright (390 and 320 px), the title with Score and
//   Best, then the six buttons on a row of their own, the Field guide named
//   at 390; over the board, one row, Score over Best and the full-screen
//   button last, the guide named on a 1080p desktop's browser (maximized,
//   with a bookmarks bar), an iPad mini and an iPad held upright, both on
//   1920x1080, neither at 1920x860; a window 460 px wide (500 with touch)
//   with the title, Score and Best and then every button, both named; and
//   as Score and Best grow to 1000, nothing moves. At every step over the
//   board (one row, each door's word, two rows on a short window's narrower
//   page), with six buttons and five, a mouse and touch: the step's page
//   and a pixel under it, and at 100 and 1000 nothing moves. Beside the
//   board: a laptop's column watching with the chatter full (the doors in
//   its own row or the icons', the guide named without full screen), and a
//   narrow column's six icons in a row.
// - The cards on phones' boards, upright and on their sides, from 280 to
//   440 px: the start card (the longest blurbs, a note or not), and the
//   fullest death card (a real first good round's: the new best's badge,
//   the carve, the Field guide's link), with the longest reason and quip, a
//   note or not (the smallest lets the link wait while you carve, and has it
//   back once your name's in); and the round's card when your death ends
//   it, with its longest words. At 568x320 the start card's links share a row.
//
//   node tools/ui-test.js
const { launch, serve, HELPERS } = require('./browser');

const results = [];
let failed = 0;
const check = (ok, what, detail = '') => {
  results.push(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
};

// What the page shows, in one look.
const PROBE = `(() => {
  const $ = id => document.getElementById(id), card = document.querySelector('#overlay .card'), note = $('rival-note'), ot = $('overlay-text');
  const vis = el => !!el && !el.hidden && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
  const rec = $('records');
  window.vis = vis;
  window.__probe = () => ({
    state: SnakeDebug.state(), card: !$('overlay').classList.contains('hidden'), title: $('overlay-title').textContent,
    text: vis(ot) ? ot.textContent : '', flavor: vis($('overlay-flavor')) ? $('overlay-flavor').textContent : '',
    note: vis(note) ? note.textContent.replace(/\\s+/g, ' ').trim() : '', toast: $('toast').hidden ? '' : $('toast').textContent, kind: $('toast').dataset.kind,
    sr: $('announcer').textContent, noted: [...document.querySelectorAll('#scoreboard li.noted .name')].map(n => n.textContent).join(','),
    expanded: [...document.querySelectorAll('#scoreboard button.name[aria-expanded="true"]')].map(n => n.textContent).join(','),
    how: vis($('how')) ? $('how').textContent : '', hint: vis($('hint')) ? $('hint').textContent : '', help: $('help').textContent,
    book: !rec.hidden, label: rec.getAttribute('aria-label'), tab: rec.querySelector('.tab[aria-pressed="true"]')?.dataset.tab,
    pageTop: rec.querySelector('.records-card').scrollTop, firstHead: rec.querySelector('.guide-head')?.textContent || '',
    spot: rec.querySelector('.guide li.spot')?.dataset.kind || '',
    spotIn: (() => { const s = rec.querySelector('.guide li.spot'), p = rec.querySelector('.records-card'), h = rec.querySelector('.records-head'); if (!s) return false; const a = s.getBoundingClientRect(), b = p.getBoundingClientRect(); return a.top >= h.getBoundingClientRect().bottom - 0.5 && a.bottom <= b.bottom; })(), // (under the book's head, which stays at the top of its page)
    closeOn: (() => { const x = $('records-close'), r = x.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !rec.hidden && r.top >= 0 && r.bottom <= innerHeight && (hit === x || x.contains(hit)); })(), // (its ×, on the screen and on top where it shows)
    focus: document.activeElement === document.body ? 'body' : document.activeElement.id || document.activeElement.className,
  });
  return 'ok';
})()`;

const KEYS = {
  Tab: { key: 'Tab', code: 'Tab', vk: 9 }, Enter: { key: 'Enter', code: 'Enter', vk: 13, text: '\r' }, Escape: { key: 'Escape', code: 'Escape', vk: 27 },
  p: { key: 'p', code: 'KeyP', vk: 80, text: 'p' }, g: { key: 'g', code: 'KeyG', vk: 71, text: 'g' }, h: { key: 'h', code: 'KeyH', vk: 72, text: 'h' },
};

(async () => {
  const site = await serve();
  const b = await launch();
  // ?nofs: a browser without full screen for a page (an older Safari, a page in a frame), as layout-test does
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { if (new URLSearchParams(location.search).has('nofs')) Object.defineProperty(Document.prototype, 'fullscreenEnabled', { configurable: true, get: () => false }); })();` });
  const ev = expr => b.eval(expr);
  const P = () => ev('__probe()');
  const wait = (cond, ms = 30000) => ev(`waitFor(() => ${cond}, ${ms}).then(() => 1)`);
  const key = async name => {
    const k = KEYS[name];
    await b.send('Input.dispatchKeyEvent', { type: k.text ? 'keyDown' : 'rawKeyDown', key: k.key, code: k.code, windowsVirtualKeyCode: k.vk, text: k.text });
    await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k.key, code: k.code, windowsVirtualKeyCode: k.vk });
    await b.sleep(150);
  };
  const mouse = async ([x, y]) => {
    await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await b.sleep(200);
  };
  const tap = async ([x, y]) => {
    await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await b.sleep(60);
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await b.sleep(250);
  };
  const at = sel => ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  const tag = name => `[...document.querySelectorAll('#scoreboard li')].find(l => l.querySelector('.name').textContent === ${JSON.stringify(name)})`;
  const nameAt = name => ev(`(() => { const r = ${tag(name)}.querySelector('.name').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  const tagAt = name => ev(`(() => { const r = ${tag(name)}.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  const powers = (name, leaps, dashes, wrap) => ev(`(() => { const g = SnakeDebug.game(), s = g.snakes.find(o => o.name === ${JSON.stringify(name)}); s.leaps = ${leaps}; s.dashes = ${dashes}; s.wrapUntil = ${wrap ? 'g.time + 60000' : 0}; return 1; })()`);
  const load = async (q = '') => {
    await b.go(site.url + '?debug' + q);
    await ev(HELPERS);
    await wait(`window.SnakeDebug && SnakeDebug.state() === 'ready'`, 15000);
    await ev(PROBE);
  };
  // A round with these rivals, going (your snake steered by a rival's brain), 2.5 s in.
  const fresh = async (personas, watch = false) => {
    await ev(`SnakeDebug.setup(${JSON.stringify(personas)}); 'ok'`);
    await b.sleep(300);
    await ev(`document.getElementById('${watch ? 'watch' : 'start'}').click(); pilot.on = ${!watch}; pilot.crash = false; 'ok'`);
    await wait(`SnakeDebug.state() === 'running' && SnakeDebug.game().time > 2500`);
  };
  const die = async () => {
    await ev(`pilot.crash = true; 'ok'`);
    await wait(`cardUp() && !me().alive`);
    await b.sleep(900);
  };

  try {
    // ------------------------------------------------------------ desktop
    await b.viewport(1280, 800);
    await load();
    let p = await P();
    check(p.how === 'How to play', 'the start card has How to play', p.how);
    check(/G opens the Field guide/.test(p.hint), 'the start card’s keys say G opens the Field guide', p.hint);
    const doors = await ev(`[...document.querySelectorAll('header button.trophy')].map(d => ({ id: d.id, named: getComputedStyle(d.querySelector('.trophy-text')).display !== 'none', on: vis(d) }))`);
    check(doors.length === 2 && doors[0].id === 'guide-open' && doors.every(d => d.named && d.on), 'the header has two named doors on a desktop: Field guide, then Hall of Fame', JSON.stringify(doors));

    await mouse(await at('#guide-open'));
    p = await P();
    check(p.book && p.tab === 'guide' && p.label === 'Field guide', 'the Field guide’s button opens the book on the guide, and the book is named for it', `${p.tab} / ${p.label}`);
    check(p.pageTop === 0 && p.firstHead === 'The basics', 'it opens at the top, on The basics', `${p.pageTop} / ${p.firstHead}`);
    const pics = await ev(`(() => { const rows = [...document.querySelectorAll('#records .guide li')]; const basics = rows.filter(li => li.dataset.kind.startsWith('basic-')); return { basics: basics.length, drawn: basics.filter(li => li.querySelector('canvas.guide-art')).length, standIns: document.querySelectorAll('#records .stand-in').length }; })()`);
    check(pics.basics === 4 && pics.drawn === 4 && !pics.standIns, 'the basics’ four pictures are the renderer’s (no stand-ins anywhere)', JSON.stringify(pics));
    const ink = await ev(`(() => { const out = {}; for (const k of ['basic-win', 'basic-steer', 'basic-crash', 'basic-hunger']) { const c = SnakeRender.guideSprite(k, 72), d = c.getContext('2d').getImageData(0, 0, 72, 72).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; out[k] = n; } return out; })()`);
    check(Object.values(ink).every(n => n > 400), 'each basic’s picture draws', JSON.stringify(ink));
    await key('Escape');
    p = await P();
    check(!p.book && p.focus === 'start', 'Esc closes it, and focus goes back to the card’s Play (as from the trophy)', p.focus);

    await key('g');
    p = await P();
    check(p.book && p.tab === 'guide' && p.label === 'Field guide', 'G opens the guide');
    await key('h');
    p = await P();
    check(p.book && p.tab === 'scores' && p.label === 'Hall of Fame', 'in the book, H goes to the Hall of Fame', `${p.tab} / ${p.label}`);
    await key('g');
    p = await P();
    check(p.book && p.tab === 'guide', '...and G back to the guide', p.tab);
    await key('g');
    p = await P();
    check(!p.book, '...and G again closes it');
    await key('h');
    p = await P();
    check(p.book && p.tab === 'scores' && p.label === 'Hall of Fame', 'H opens the Hall of Fame, even after a visit to the guide', `${p.tab} / ${p.label}`);
    await mouse(await at('#records .tab[data-tab="stats"]'));
    await key('Escape');
    await key('h');
    p = await P();
    check(p.tab === 'stats' && p.label === 'Your story', 'H opens Your story if that’s where you were; the book says so', `${p.tab} / ${p.label}`);
    await key('h');
    p = await P();
    check(!p.book, '...and H again closes it');
    await mouse(await at('#how'));
    p = await P();
    check(p.book && p.tab === 'guide' && p.pageTop === 0, 'How to play opens the guide, at the top', `${p.tab} / ${p.pageTop}`);
    await key('Escape');

    // Napping: a rival's note, and the guide's link.
    await fresh(['ouroboros', 'metagamer', 'gobbler']);
    await key('p');
    const nap = await P();
    check(nap.state === 'paused' && nap.how === 'Field guide', 'the napping card has a Field guide link', nap.how);
    await mouse(await at('#how'));
    p = await P();
    check(p.book && p.tab === 'guide' && p.state === 'paused', '...which opens the guide, still napping', p.state);
    await key('Escape');
    p = await P();
    check(!p.book && p.card && p.title === 'Napping', '...and closing it, the napping card is back');

    await mouse(await nameAt('Ouroboros'));
    p = await P();
    check(p.note.startsWith('Ouroboros') && p.note.includes('Chases its own tail') && !p.text, 'a click on a rival’s name puts its note on the napping card, in place of the card’s words', p.note);
    check(p.noted === 'Ouroboros' && p.expanded === 'Ouroboros', '...its tag is marked, and its name says its note is open', `${p.noted} / ${p.expanded}`);
    check(p.sr.startsWith('Ouroboros: Chases'), '...and a screen reader hears it', p.sr);
    await b.sleep(5000);
    p = await P();
    check(p.note.startsWith('Ouroboros') && p.state === 'paused', 'it is still there 5 s later (it used to go after 3.2 s)', p.note.slice(0, 30));
    await mouse(await nameAt('Gobbler'));
    p = await P();
    check(p.note.startsWith('Gobbler') && p.noted === 'Gobbler', 'another tag swaps it', p.note.slice(0, 30));
    await mouse(await nameAt('Gobbler'));
    p = await P();
    check(!p.note && p.text === nap.text && !p.noted && !p.expanded, 'its tag again closes it, and the card’s words come back', p.text);
    await mouse(await nameAt('Metagamer'));
    await mouse(await at('#overlay-title'));
    p = await P();
    check(!p.note && p.text === nap.text && p.state === 'paused', 'a click on the card closes it, and doesn’t wake');
    await mouse(await nameAt('Metagamer'));
    await mouse(await at('#note-close'));
    p = await P();
    check(!p.note && p.state === 'paused', 'its × closes it');
    await mouse(await nameAt('Metagamer'));
    await mouse([1100, 760]);
    p = await P();
    check(!p.note && p.state === 'paused', 'a click on the log outside the card closes it');
    await powers('Ouroboros', 3, 3, true);
    await b.sleep(200);
    await mouse(await nameAt('Ouroboros'));
    p = await P();
    check(p.note.includes('Holding 3 golden jumps and 3 golden flashes. The edges wrap for it.'), 'what it holds now is on its note', p.note);
    await powers('Ouroboros', 0, 0, false);
    await mouse(await tagAt('You'));
    p = await P();
    check(p.note.startsWith('You') && p.note.includes('Space jumps'), 'your own tag: your powers, as your note', p.note);
    // Keys: Tab to a name, Enter opens it (focus stays on the name), Enter closes; Esc closes it first.
    await ev(`document.querySelector('#overlay .card').focus(); 'ok'`);
    for (let i = 0; i < 24 && !(await ev(`document.activeElement.textContent === 'Metagamer'`)); i++) await key('Tab');
    await key('Enter');
    p = await P();
    check(p.note.startsWith('Metagamer') && p.focus === 'name', 'keys: Enter on a name Tabbed to opens its note; focus stays on the name', `${p.note.slice(0, 20)} / ${p.focus}`);
    await key('Enter');
    p = await P();
    check(!p.note && p.text === nap.text, '...Enter again closes it');
    await key('Enter');
    await key('Escape');
    p = await P();
    check(!p.note && p.state === 'paused' && p.focus === 'name', '...Esc closes the note first (still napping, focus on the name)', `${p.state} / ${p.focus}`);
    await key('Enter');
    for (let i = 0; i < 30 && !(await ev(`document.activeElement.id === 'note-close'`)); i++) await key('Tab');
    const onClose = await ev('document.activeElement.id');
    await key('Enter');
    p = await P();
    check(onClose === 'note-close' && !p.note && p.state === 'paused' && p.focus === 'name', '...Tab reaches its ×, and Enter there closes it, focus back on the name', `${onClose} / ${p.focus}`);
    await key('Enter');
    p = await P();
    check(p.note.startsWith('Metagamer') && p.title === 'Napping', '...where Enter opens it again (not a start over)', p.title);
    await key('p');
    p = await P();
    check(!p.note && !p.card && p.state !== 'paused', 'P wakes, and the note goes with the card', p.state);
    await wait(`SnakeDebug.state() === 'running' && !cardUp()`);

    // Playing: a tag puts nothing over the log.
    await mouse(await nameAt('Ouroboros'));
    p = await P();
    check(!(p.kind === 'note' && p.toast) && !p.note, 'playing: a click on a tag puts nothing over the log');

    // Your death's card: a note there too, kept up to date; and a link to what got you, in the guide.
    await die();
    const death = await P();
    check(/^Field guide: (Crashes|Hunger|Fire|Holes|Golden leaf)$/.test(death.how), 'your death’s card names what got you, in the Field guide', death.how);
    await mouse(await nameAt('Gobbler'));
    p = await P();
    check(p.note.startsWith('Gobbler') && !p.text && !p.flavor, 'your death’s card: a rival’s note stands in for the card’s words', p.note.slice(0, 30));
    await powers('Gobbler', 2, 0, false);
    await b.sleep(400);
    p = await P();
    check(/Holding [12] golden jumps?\./.test(p.note) || p.note.includes('Out of this round.'), '...and keeps up with the round going on behind the card', p.note);
    await mouse(await tagAt('You'));
    p = await P();
    check(p.note === 'You You’re out of this round.', 'your own tag, once you’re out: no powers to offer', p.note);
    await key('Escape');
    p = await P();
    check(p.card && !p.note && p.title === death.title && p.text === death.text, 'Esc takes the note first, and the card’s words come back', p.text);
    await mouse(await at('#how'));
    p = await P();
    const row = { 'Field guide: Crashes': 'basic-crash', 'Field guide: Hunger': 'basic-hunger', 'Field guide: Fire': 'fire', 'Field guide: Holes': 'hole', 'Field guide: Golden leaf': 'leaf' }[death.how];
    check(p.book && p.tab === 'guide' && p.spot === row && p.spotIn && p.closeOn, 'its link opens the guide at that row, lit and in view, the book’s × on the screen', `${p.spot} / in view: ${p.spotIn} / ×: ${p.closeOn}`);
    await key('Escape');
    await key('Escape');
    p = await P();
    check(!p.card && !p.book, 'Esc closes the book; Esc again keeps watching, as before');

    // Watching (no card): a banner, up as long as it takes to read. Round
    // news (a rival out, the woodpecker) may take its place, as it should:
    // then it's timed again, up to three times.
    let up = 0, by = '', want = 0;
    for (let tries = 0; tries < 3; tries++) {
      await ev(`(() => { const t = document.getElementById('toast'); window.__banner?.obs.disconnect(); const B = window.__banner = { shown: 0, gone: 0, by: '' }; B.obs = new MutationObserver(() => { const on = !t.hidden && t.dataset.kind === 'note' && t.textContent.startsWith('Ouroboros'); if (on && !B.shown) B.shown = performance.now(); if (!on && B.shown && !B.gone) { B.gone = performance.now(); B.by = t.hidden ? '' : t.dataset.kind + ': ' + t.textContent; } }); B.obs.observe(t, { attributes: true, childList: true, characterData: true, subtree: true }); return 1; })()`);
      await mouse(await nameAt('Ouroboros'));
      p = await P();
      if (!tries) check(p.kind === 'note' && p.toast.startsWith('Ouroboros: Chases') && p.sr.startsWith('Ouroboros'), 'watching: a click on a tag shows its note as a banner, and a screen reader hears it', p.toast);
      want = Math.min(9000, Math.max(3500, 1000 + 55 * p.toast.length));
      await wait(`__banner.gone || (SnakeDebug.state() !== 'running')`, 15000).catch(() => 0);
      ({ up, by } = await ev(`({ up: __banner.gone && __banner.shown ? Math.round(__banner.gone - __banner.shown) : 0, by: __banner.by })`));
      if (!/^(kill|bird):/.test(by) || await ev(`SnakeDebug.state() !== 'running' || cardUp()`)) break;
    }
    check(up >= want - 50 && up <= want + 700, `...up as long as it takes to read (${p.toast.length} characters: ${want} ms, then its fade)`, `up ${up} ms${by ? `, then ${by}` : ''}`);
    await mouse(await nameAt('Metagamer'));
    await mouse(await nameAt('Metagamer'));
    await b.sleep(300);
    p = await P();
    check(!(p.kind === 'note' && p.toast.startsWith('Metagamer')), '...and its tag again takes it away');

    // The round's card. Your death ends this one (one rival): its card says
    // how you died, so it names what got you too, as your death's card does
    // (it had no link: a third of losing rounds end on your death).
    await fresh(['ouroboros']);
    await ev(`pilot.crash = true; 'ok'`);
    await wait(`SnakeDebug.state() === 'over' && cardUp()`);
    await b.sleep(1000);
    const ended = await P();
    const endRow = { 'Field guide: Crashes': 'basic-crash', 'Field guide: Hunger': 'basic-hunger', 'Field guide: Fire': 'fire', 'Field guide: Holes': 'hole', 'Field guide: Golden leaf': 'leaf' }[ended.how];
    check(ended.title === 'Ouroboros wins' && /^You /.test(ended.text) && !!endRow, 'your death ended the round: its card says how, and names what got you, in the Field guide', `${ended.title} / ${ended.text} / ${ended.how}`);
    await mouse(await at('#how'));
    p = await P();
    check(p.book && p.tab === 'guide' && p.spot === endRow && p.spotIn && p.closeOn, '...which opens the guide at that row, lit and in view', `${p.spot} / in view: ${p.spotIn}`);
    await key('Escape');
    p = await P();
    check(!p.book && p.card && p.title === 'Ouroboros wins', '...and Esc brings the round’s card back');
    await mouse(await nameAt('Ouroboros'));
    p = await P();
    check(p.note.startsWith('Ouroboros') && p.title === 'Ouroboros wins', 'the round’s card takes a note too', p.note.slice(0, 30));
    await ev(`SnakeDebug.setup(); 'ok'`);
    await b.sleep(300);
    p = await P();
    check(!p.note && !p.noted && p.title.startsWith('Ready'), 'a new card brings its own words');

    // A death whose row is below the fold (Fire, near the guide's end): the
    // link still opens the guide at it, lit and in view (focus on the book's
    // Close without scrolling it back up). A crash's row is always in view.
    // (Held at 3 segments while it burns: the pilot eats, and a snake that eats as fast as it burns lives on.)
    const fire = `(() => { const g = SnakeDebug.game(), m = me(); m.burnFrom = g.tick; m.burnUntil = g.tick + 400; const hold = setInterval(() => { if (!m.alive || SnakeDebug.game() !== g) return clearInterval(hold); m.body.length = Math.min(m.body.length, 3); m.grow = 0; }, 5); return 1; })()`;
    await fresh(['ouroboros', 'metagamer', 'gobbler']);
    await ev(fire);
    await wait(`cardUp() && !me().alive`);
    await b.sleep(900);
    p = await P();
    check(p.how === 'Field guide: Fire', 'burned up: your death’s card says Field guide: Fire', p.how);
    await mouse(await at('#how'));
    p = await P();
    check(p.book && p.spot === 'fire' && p.spotIn && p.pageTop > 0 && p.focus === 'records-close' && p.closeOn, '...which opens the guide at Fire, far down it, lit and in view under the book’s head, focus on its × and the × on the screen (it scrolled away with the page)', `${p.spot} / in view: ${p.spotIn} / scrolled ${p.pageTop} / ${p.focus} / ×: ${p.closeOn}`);
    await mouse(await at('#records-close'));
    p = await P();
    check(!p.book, '...and a click on its × closes the book');

    // ------------------------------------------ the header over the board
    // Its rows (what's on each, left to right, grouped by where each sits;
    // Score over Best beside the title count as one), whether each door
    // shows its word, and whether the page scrolls sideways.
    const headerRows = `(() => {
      const hd = document.querySelector('header'), stats = document.querySelector('.stats'), pair = getComputedStyle(stats).display !== 'contents' ? stats : null;
      const items = [['title', document.querySelector('h1')], ...[...hd.querySelectorAll('.hud .stat')].map((el, i) => [i ? 'Best' : 'Score', pair || el]), ...[...hd.querySelectorAll('.hud button')].filter(vis).map(el => [el.id, el])];
      let rows = [];
      for (const [n, el] of items) {
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el), top = r.top - parseFloat(cs.marginTop), bottom = r.bottom + parseFloat(cs.marginBottom);
        let row = rows.find(q => Math.min(bottom, q.bottom) - Math.max(top, q.top) > 2);
        if (!row) rows.push(row = { top, bottom, items: [] });
        row.top = Math.min(row.top, top); row.bottom = Math.max(row.bottom, bottom);
        row.items.push({ n, l: n === 'Best' && pair ? r.left + 0.5 : r.left });
      }
      for (let merged = true; merged;) {
        merged = false;
        for (const a of rows) for (const c of rows) if (a !== c && !merged && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 2) { a.items.push(...c.items); a.top = Math.min(a.top, c.top); a.bottom = Math.max(a.bottom, c.bottom); rows = rows.filter(q => q !== c); merged = true; }
      }
      rows.sort((a, c) => a.top - c.top);
      const named = id => vis(document.querySelector('#' + id + ' .trophy-text'));
      return { page: Math.round(document.querySelector('main').getBoundingClientRect().width), height: Math.round(hd.getBoundingClientRect().height * 10) / 10, rows: rows.map(r => r.items.sort((a, c) => a.l - c.l).map(i => i.n).join(' ')),
        guide: named('guide-open'), trophy: named('records-open'), sideways: document.documentElement.scrollWidth > innerWidth,
        titleLines: (() => { const h1 = document.querySelector('h1'), cs = getComputedStyle(h1); return Math.round(h1.getBoundingClientRect().height / (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize))); })() };
    })()`;
    const grow = `(() => { document.getElementById('score').textContent = '1000'; document.getElementById('best').textContent = '1000'; return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res(1)))); })()`;
    // In one row, Score over Best beside the title and the full-screen
    // button last, each door named where the row has room for its word: a
    // 1920x1080 screen's maximized browser (a 685 px page), with a bookmarks
    // bar (653), and an iPad mini held upright (720) name the Field guide,
    // the trophy its picture (the guide was its book there with the full
    // screen, and the 1080p browser with the bar showed two bare icons);
    // 1920x1080 (820) names both; a 1000x860 window (a 600 px page) has
    // both pictures. A window 460 px wide, or 500 with touch (an iPad's Split
    // View), has the title with Score and Best, then all the buttons on the
    // next row, both named (the trophy went alone onto a third). And as
    // Score and Best grow to 1000, nothing moves.
    for (const [w, h, touch, label, oneRow, guide, trophy] of [
      [1920, 945, false, '1920x945, a maximized browser', true, true, false], [1920, 913, false, '1920x913, with a bookmarks bar', true, true, false],
      [1920, 1080, false, '1920x1080', true, true, true], [1000, 860, false, 'a 1000x860 window', true, false, false], [744, 1133, true, 'an iPad mini upright', true, true, false],
      [768, 1024, true, 'an iPad upright', true, true, false], [460, 900, false, 'a window 460 px wide', false, true, true], [500, 1000, true, 'a touch window 500 px wide', false, true, true]]) {
      await b.viewport(w, h, { scale: touch ? 2 : 1, mobile: touch });
      await load();
      const r = await ev(headerRows), want = oneRow ? 'title Score Best pause music mute guide-open records-open fullscreen' : 'title Score Best / pause music mute guide-open records-open fullscreen';
      check(r.rows.join(' / ') === want && r.guide === guide && r.trophy === trophy && r.height <= (oneRow ? 56 : 108) && !r.sideways,
        `${label}: ${oneRow ? 'the header in one row' : 'the title with Score and Best, then every button'}, the full-screen button last, the Field guide ${guide ? 'named' : 'its open book'}, the trophy ${trophy ? 'named' : 'its picture'}`, JSON.stringify(r));
      await ev(grow);
      const r1000 = await ev(headerRows);
      check(r1000.rows.join(' / ') === want && r1000.height === r.height && r1000.guide === guide, `${label}: with Score and Best at 1000, nothing moves`, JSON.stringify(r1000));
    }

    // ---------------------------- the header over the board, at its steps
    // At each step's page, and a pixel under it (a tall window 24 px wider;
    // under 417 px, a window 470 px wide and short, whose page narrows with
    // the board): one row from where it fits, each door named from where
    // its word does, with six buttons and with five (no full screen: the
    // steps were six's, and five showed both doors' pictures where their
    // words fit), with a mouse and with touch; narrower, two rows, the title
    // on one line and no button on a row of its own (under 384 px the
    // full-screen button went onto a third, and under 352 the title took
    // two lines). And at each step, with Score and Best at 100 and at 1000,
    // nothing moves (they kept room for two digits: at 100 the row wrapped
    // at each step's page, the board 45 px lower).
    const STEPS = [ // [touch, five, one row from, the guide named from, both from; in two rows, both named from, the guide from]
      [false, false, 592, 649, 716, 384, 317], [false, true, 552, 609, 676, 340, 280],
      [true, false, 652, 699, 756, 404, 347], [true, true, 602, 649, 706, 354, 297]];
    const digits = n => `(() => { document.getElementById('score').textContent = '${n}'; document.getElementById('best').textContent = '${n}'; return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res(1)))); })()`;
    for (const [touch, five, one, guide, both, twoBoth, twoGuide] of STEPS) {
      const kind = `${touch ? 'touch' : 'a mouse'}, ${five ? 'five buttons' : 'six'}`, btns = `pause music mute guide-open records-open${five ? '' : ' fullscreen'}`;
      await b.viewport(1000, 1400, { scale: 1, mobile: touch });
      await load(five ? '&nofs' : '');
      const steps = [one, guide, both, twoBoth, twoGuide];
      for (const P of steps.flatMap(q => [q, q - 1]).filter(q => q >= 280)) {
        if (P >= 417) await b.viewport(P + 24, 1400, { scale: 1, mobile: touch }); else await b.viewport(470, P + 260, { scale: 1, mobile: touch });
        await ev(digits(0));
        const r = await ev(headerRows), oneRow = P >= one, g = oneRow ? P >= guide : P >= twoGuide, t = oneRow ? P >= both : P >= twoBoth;
        check(r.page === P && r.rows.join(' / ') === (oneRow ? `title Score Best ${btns}` : `title Score Best / ${btns}`) && r.guide === g && r.trophy === t && r.titleLines === 1 && !r.sideways,
          `${kind}, a ${P} px page: ${oneRow ? 'one row' : 'the title with Score and Best, then the buttons'}, the Field guide ${g ? 'named' : 'its book'}, the trophy ${t ? 'named' : 'its picture'}`, JSON.stringify(r));
        if (!steps.includes(P)) continue;
        for (const n of [100, 1000]) {
          await ev(digits(n));
          const m = await ev(headerRows);
          check(m.rows.join(' / ') === r.rows.join(' / ') && m.height === r.height && m.guide === r.guide && m.trophy === r.trophy, `${kind}, a ${P} px page: with Score and Best at ${n}, nothing moves`, JSON.stringify(m));
        }
      }
    }

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
    for (const [w, h, iconsRow, guideNamed, trophy, q] of [[1366, 657, true, false, false, ''], [1280, 800, false, true, true, ''], [1366, 657, true, true, false, '&nofs']]) {
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

    // -------------------------------------------------------------- phones
    for (const [w, h] of [[390, 844], [320, 640]]) {
      await b.viewport(w, h, { scale: 2, mobile: true });
      await load();
      const row = await ev(headerRows), named = w >= 371;
      check(row.rows.join(' / ') === 'title Score Best / pause music mute guide-open records-open fullscreen' && row.guide === named && !row.trophy && !row.sideways,
        `phone ${w}: the title with Score and Best, then the six buttons on a row of their own, the guide’s door beside the trophy (${named ? 'by its name' : 'its open book'}), the full screen last`, JSON.stringify(row));
      await ev(grow);
      const row1000 = await ev(headerRows);
      check(row1000.rows.join(' / ') === row.rows.join(' / ') && row1000.height === row.height, `phone ${w}: with Score and Best at 1000, the header keeps its rows`, JSON.stringify(row1000));
      await load();
      await tap(await at('#guide-open'));
      p = await P();
      check(p.book && p.tab === 'guide', `phone ${w}: a tap on the guide’s door opens the guide`, p.tab);
      await tap(await at('#records-close'));
      p = await P();
      check(p.how === 'How to play', `phone ${w}: the start card has How to play`, p.how);
      await tap(await at('#how'));
      p = await P();
      check(p.book && p.tab === 'guide' && p.firstHead === 'The basics', `phone ${w}: How to play opens the guide on The basics`, p.firstHead);
      await tap(await at('#records-close'));
      await fresh(['ouroboros', 'metagamer', 'gobbler']);
      await tap(await at('#pause'));
      await b.sleep(300);
      const pn = await P();
      await tap(await tagAt('Ouroboros'));
      p = await P();
      check(p.note.startsWith('Ouroboros') && !p.text, `phone ${w}: a tap on a tag puts its note on the napping card`, p.note.slice(0, 30));
      await b.sleep(4000);
      p = await P();
      check(p.note.startsWith('Ouroboros'), `phone ${w}: still there 4 s later`);
      await tap(await at('#overlay-title'));
      p = await P();
      check(!p.note && p.text === pn.text && p.state === 'paused', `phone ${w}: a tap on the card closes it, and doesn’t wake`);
      await tap(await tagAt('Ouroboros'));
      await tap(await at('#note-close'));
      p = await P();
      check(!p.note && p.state === 'paused', `phone ${w}: its × closes it`);
      await tap(await tagAt('Ouroboros'));
      await tap(await at('#start'));
      p = await P();
      check(!p.note && p.state !== 'paused', `phone ${w}: Wake up wakes, and the note goes with the card`, p.state);
      await wait(`SnakeDebug.state() === 'running' && !cardUp()`);
      await die();
      await tap(await tagAt('Gobbler'));
      p = await P();
      check(p.note.startsWith('Gobbler'), `phone ${w}: your death’s card takes a note`, p.note.slice(0, 30));
      await tap(await at('#watch'));
      await tap(await tagAt('Metagamer'));
      p = await P();
      check(p.kind === 'note' && p.toast.startsWith('Metagamer'), `phone ${w}: watching, a tap on a tag is a banner`, p.toast);
      await fresh(['ouroboros', 'metagamer', 'gobbler']);
      await ev(fire);
      await wait(`cardUp() && !me().alive`);
      await b.sleep(900);
      await tap(await at('#how'));
      p = await P();
      check(p.book && p.spot === 'fire' && p.spotIn && p.closeOn, `phone ${w}: burned up, the card’s link opens the guide at Fire, lit and in view, its × on the screen`, `${p.spot} / in view: ${p.spotIn} / scrolled ${p.pageTop} / ×: ${p.closeOn}`);
      await tap(await at('#records-close'));
      p = await P();
      check(!p.book, `phone ${w}: a tap on the book’s × closes it`);
    }
    if (b.errors.length) { results.push(`FAIL page errors: ${b.errors.join(' | ')}`); failed++; }
  } catch (e) {
    results.push(`FAIL ${e.message}`);
    failed++;
  } finally {
    await b.close();
    site.close();
  }
  console.log(results.join('\n'));
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log('\nall passed');
})().catch(e => { console.error(e); process.exit(1); });
