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
//   lit). Each door opens the book on its own tab, and the book is named for
//   what it shows; in the book, H and G go to their tabs, or close it from
//   there. The basics have the renderer's pictures.
// - The header on an upright phone keeps its buttons on one row, with room
//   for one more (a full-screen button) at 320 px; on a 1920x1080 screen's
//   maximized browser and an iPad held upright it's one row with the Field
//   guide named, and stays one row with a sixth button.
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
    spotIn: (() => { const s = rec.querySelector('.guide li.spot'), p = rec.querySelector('.records-card'); if (!s) return false; const a = s.getBoundingClientRect(), b = p.getBoundingClientRect(); return a.top >= b.top && a.bottom <= b.bottom; })(),
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
  const load = async () => {
    await b.go(site.url + '?debug');
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
    check(p.book && p.tab === 'guide' && p.spot === row && p.spotIn, 'its link opens the guide at that row, lit and in view', `${p.spot} / in view: ${p.spotIn}`);
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

    // The round's card.
    await fresh(['ouroboros']);
    await ev(`pilot.crash = true; 'ok'`);
    await wait(`SnakeDebug.state() === 'over' && cardUp()`);
    await b.sleep(1000);
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
    check(p.book && p.spot === 'fire' && p.spotIn && p.pageTop > 0 && p.focus === 'records-close', '...which opens the guide at Fire, far down it, lit and in view (focus on its Close)', `${p.spot} / in view: ${p.spotIn} / scrolled ${p.pageTop} / ${p.focus}`);
    await key('Escape');

    // ------------------------------------- a one-row header's tight range
    // A 1920x1080 screen's maximized browser (a 685 px page) and an iPad held
    // upright (744): the Field guide keeps its name beside its book, the
    // trophy is an icon, and the header stays one row; with a sixth button
    // (a stand-in for the phones work's full screen) the row still holds.
    const doorsRow = `(() => {
      const hdr = document.querySelector('header'), bs = [...hdr.querySelectorAll('button')].filter(vis);
      const tops = new Set(bs.map(x => Math.round(x.getBoundingClientRect().top))), named = id => vis(document.querySelector('#' + id + ' .trophy-text'));
      return { page: Math.round(document.querySelector('main').getBoundingClientRect().width), height: Math.round(hdr.getBoundingClientRect().height), rows: tops.size, guide: named('guide-open'), trophy: named('records-open'), book: vis(document.querySelector('#guide-open svg')) };
    })()`;
    const sixth = `(() => { const x = document.createElement('button'); x.className = 'icon'; x.innerHTML = '<svg viewBox="0 0 20 20"></svg>'; document.querySelector('.hud').appendChild(x); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1)))); })()`;
    for (const [w, h, touch, label] of [[1920, 945, false, '1920x945, a maximized browser'], [768, 1024, true, 'an iPad upright']]) {
      await b.viewport(w, h, { scale: touch ? 2 : 1, mobile: touch });
      await load();
      const r = await ev(doorsRow);
      check(r.rows === 1 && r.guide && r.book && !r.trophy && r.height <= 56, `${label}: the header in one row, the Field guide named beside its book, the trophy an icon`, JSON.stringify(r));
      await ev(sixth);
      const r6 = await ev(doorsRow);
      check(r6.rows === 1 && r6.height === r.height, `${label}: with a sixth button in the header, still one row`, JSON.stringify(r6));
    }

    // ------------------------------------------ the column beside the board
    // A 1366x768 laptop's browser (1366x657): the doors stay in the icons'
    // row, the Field guide by name, and watching with the chatter's log full
    // (five lines) the page doesn't scroll. 1280x800 has the height for the
    // doors' own row, and keeps it with the log full.
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
    for (const [w, h, iconsRow, trophy] of [[1366, 657, true, false], [1280, 800, false, true]]) {
      await b.viewport(w, h);
      await load();
      await fresh(['ouroboros', 'metagamer', 'gobbler'], true);
      const c = await ev(column);
      check(c.inIconsRow === iconsRow && c.guide && c.trophy === trophy && c.scroll <= 0, `${w}x${h}, watching with the chatter full: ${iconsRow ? 'the doors in the icons’ row, the Field guide by name' : 'the doors’ own row, both named'}, and the page doesn’t scroll`, JSON.stringify(c));
    }

    // ------------------------------- the fullest death card on a small board
    // A first good round's: the new best's badge and the carve as well as the
    // Field guide's link. It fits the board (nothing under the sticky
    // buttons); with a rival's note up, the badge and the carve wait, and come
    // back with the card's words. (At 360x640 the board is 316 px: the badge
    // gives way to the carve; at 320x640, 276 px: the link does, while you carve.)
    for (const [w, h, want] of [[360, 640, 'carve+link'], [320, 640, 'carve']]) {
      await b.viewport(w, h, { scale: 2, mobile: true });
      await load();
      await fresh(['joker', 'capricious', 'vulture']);
      await die();
      const fitNow = `(() => {
        const $ = id => document.getElementById(id), card = document.querySelector('#overlay .card'), bt = document.querySelector('#overlay .buttons').getBoundingClientRect();
        const shown = [['overlay-badge', 'badge'], ['name-row', 'carve'], ['how', 'link']].filter(([id]) => vis($(id))).map(([, n]) => n).join('+');
        return { over: card.scrollHeight - card.clientHeight, shown, under: vis($('name-input')) ? Math.round(Math.max(0, $('name-input').getBoundingClientRect().bottom - bt.top)) : 0 };
      })()`;
      await ev(`(() => { const $ = id => document.getElementById(id); $('overlay-badge').textContent = 'New best: 12!'; $('overlay-badge').hidden = false; $('name-rank').textContent = 'Hall of Fame #2. Carve your name:'; $('name-row').hidden = false; return 1; })()`);
      await b.sleep(150);
      let f = await ev(fitNow);
      check(f.over <= 0 && f.under === 0 && f.shown === want, `phone ${w}x${h}: the fullest death card fits its board (${want})`, JSON.stringify(f));
      await tap(await tagAt('Joker'));
      f = await ev(fitNow);
      p = await P();
      check(p.note.startsWith('Joker') && f.over <= 0 && !/badge|carve/.test(f.shown), `phone ${w}x${h}: with a note on it, the badge and the carve wait, and it still fits`, JSON.stringify(f));
      await tap(await at('#note-close'));
      f = await ev(fitNow);
      check(f.shown === want && f.over <= 0, `phone ${w}x${h}: closing the note brings them back`, JSON.stringify(f));
    }

    // -------------------------------------------------------------- phones
    for (const [w, h] of [[390, 844], [320, 640]]) {
      await b.viewport(w, h, { scale: 2, mobile: true });
      await load();
      const row = await ev(`(() => {
        const bs = [...document.querySelectorAll('header button')].filter(vis), r = bs.map(x => x.getBoundingClientRect());
        const one = r.every(q => Math.abs(q.top - r[0].top) < 2), page = document.querySelector('header').getBoundingClientRect();
        const used = r.reduce((s, q) => s + q.width, 0), room = page.width - used - (bs.length) * 6; // (room for one more 44 px button, with every gap at least 6 px)
        return { n: bs.length, one, room: Math.round(room), sideways: document.documentElement.scrollWidth > innerWidth, ids: bs.map(x => x.id).join(' ') };
      })()`);
      check(row.one && row.ids === 'pause music mute guide-open records-open' && !row.sideways, `phone ${w}: the header’s buttons on one row, the guide’s door beside the trophy`, JSON.stringify(row));
      check(row.room >= 44, `phone ${w}: room on that row for one more button (a full screen)`, `${row.room} px`);
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
      check(p.book && p.spot === 'fire' && p.spotIn, `phone ${w}: burned up, the card’s link opens the guide at Fire, lit and in view`, `${p.spot} / in view: ${p.spotIn} / scrolled ${p.pageTop}`);
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
