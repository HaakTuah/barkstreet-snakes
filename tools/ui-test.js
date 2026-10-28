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
//   button last, the guide named on half a 1080p screen's window, an iPad
//   mini and an iPad held upright, both on a 1440p screen's browser,
//   neither on a 1000x860 window; a window 460 px wide (500 with touch)
//   with the title, Score and Best and then every button, both named; and as Score
//   and Best grow to 1000, nothing moves. At every step over the board (one
//   row, each door's word, two rows on a short window's narrower page),
//   with six buttons and five, a mouse and touch: the step's page and a
//   pixel under it, and at 100 and 1000 nothing moves. Beside the board: a
//   1080p desktop's browser (maximized, with a bookmarks bar, and 1920x1080),
//   the doors' own row, both named; a laptop's column and a 1080p browser's,
//   watching with the chatter full, not scrolling (the doors in its own row
//   or the icons', the guide named without full screen), and a narrow
//   column's six icons in a row.
// - The cards on phones' boards, upright and on their sides, from 280 to
//   440 px: the start card (the longest blurbs, a note or not), and the
//   fullest death card (a real first good round's: the new best's badge,
//   the carve, the Field guide's link), with the longest reason and quip, a
//   note or not (the smallest lets the link wait while you carve, and has it
//   back once your name's in); and the round's card when your death ends
//   it, with its longest words. At 568x320 the start card's links share a row.
//
//   node tools/ui-test.js
// The checks are in tools/ui/, one file per area, run in name order as the body of this one
// (tools/parts.js): 01 on a desktop, the rivals' picker, the cards and their notes, 02 the death and
// round cards, 03 the header over the board, at its steps too, 04 the column beside it, 05 the
// fullest death card on a phone's board, 06 phones. A new check goes in its area's file, or a new one.
const path = require('path');
const runParts = require('./parts.js');
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

    await runParts.inside(path.join(__dirname, 'ui'), { launch, serve, HELPERS, results, check, PROBE, KEYS, site, b, ev, P, wait, key, mouse, tap, at, tag, nameAt, tagAt, powers, load, fresh, die });
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
  console.log(`\nall passed (${results.length} checks)`);
})().catch(e => { console.error(e); process.exit(1); });
