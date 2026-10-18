#!/usr/bin/env node
// The page on phones, tablets and desktops, in headless Chrome (the
// DevTools protocol: each device's size, density, touch and safe area). It
// checks what DESIGN's "Phones" promises:
// - The board is as big as the call said: edge to edge on a phone held
//   upright (346 → about 382 px on a 390 px phone), the full height less a
//   thin rim on its side (268 → about 310 at 780×320), and no smaller than
//   before anywhere else.
// - Nothing scrolls sideways; on its side, nothing scrolls at all. Nothing
//   is cut off: the name tags, the header's buttons, the chatter's switch,
//   the help line, and the buttons of the cards over the board (the start
//   card, a nap, your death, the round's end) are all on the screen and take
//   a tap.
// - The header: its buttons on one row everywhere; at 320 px the title,
//   Score and Best on one row, and the buttons on their own row (so a
//   button there never crowds the title).
// - The woodpecker, perched (resting, and eyeing its chunk) for spots all
//   over the board: never over a cell (its drawn pixels, read back from its
//   layer), on the screen, off the page's furniture; upright on a phone it
//   stands on the ledge under the board, at least 48 px tall (36 on a short
//   phone, whose ledge is smaller), and on its side it's beside the board.
// - Full screen: the button is there where the browser allows it (and not
//   where it doesn't, as on an iPhone), goes in and out on a tap, and its
//   label says which way it goes.
// - The screen stays awake (a stand-in wake lock records every request and
//   release) through the countdown and play and a watched AI round; it's let
//   go for a nap, a card and the Hall of Fame; a hidden tab loses it and
//   coming back asks again when it's wanted; a refusal isn't asked again
//   and again; and with no wake lock at all, nothing breaks.
// - A real touch swipe on the board still turns, held upright and on its side.
// It prints what it measured: each device's board, before and now.
//
//   node tools/layout-test.js
const { launch, serve, HELPERS } = require('./browser');

const results = [];
let failed = 0;
const check = (ok, what, detail = '') => {
  results.push(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
};

// Each device: its size and density, touch or not, its safe area (a notch,
// the home bar), and the board it should get at least (before: what it got
// before this round's phone work). nowhere: no room for the woodpecker
// beside the board, and no ledge (a tablet held upright): it perches in the
// frame's gutter as small as it may be, as it always did there, its beak's
// tip touching the board's edge (a pixel or three of it, softened).
const notchUp = { top: 47, bottom: 34, left: 0, right: 0 }, notchSide = { top: 0, bottom: 21, left: 47, right: 47 };
const DEVICES = [
  { name: '320×640 (a small Android, the first iPhone SE)', w: 320, h: 640, dpr: 2, kind: 'upright', least: 308, before: 276 },
  { name: '360×780', w: 360, h: 780, dpr: 3, kind: 'upright', least: 348, before: 316 },
  { name: '375×667 (iPhone SE)', w: 375, h: 667, dpr: 2, kind: 'upright', least: 363, before: 331 },
  { name: '390×844 (iPhone 13, 14)', w: 390, h: 844, dpr: 3, kind: 'upright', least: 378, before: 346 }, // (the call: 346 → about 382)
  { name: '412×915 (Pixel)', w: 412, h: 915, dpr: 2.625, kind: 'upright', least: 400, before: 368 },
  { name: '430×932', w: 430, h: 932, dpr: 3, kind: 'upright', least: 418, before: 386 },
  { name: '390×844 with a notch', w: 390, h: 844, dpr: 3, kind: 'upright', insets: notchUp, least: 378, before: 346 },
  { name: '640×320 on its side', w: 640, h: 320, dpr: 2, kind: 'side', least: 300, before: 268 },
  { name: '667×375 on its side', w: 667, h: 375, dpr: 2, kind: 'side', least: 355, before: 323 },
  { name: '780×320 on its side, its browser bars showing', w: 780, h: 320, dpr: 3, kind: 'side', least: 300, before: 268 }, // (the call: 268 → about 310)
  { name: '844×390 on its side (or 780×320 in full screen)', w: 844, h: 390, dpr: 3, kind: 'side', least: 370, before: 338 }, // (the call: about 380 in full screen)
  { name: '915×412 on its side', w: 915, h: 412, dpr: 2.625, kind: 'side', least: 392, before: 360 },
  { name: '932×430 on its side', w: 932, h: 430, dpr: 3, kind: 'side', least: 410, before: 378 },
  { name: '844×390 on its side with a notch', w: 844, h: 390, dpr: 3, kind: 'side', insets: notchSide, least: 349, before: 338 },
  { name: '768×1024 (a tablet)', w: 768, h: 1024, dpr: 2, kind: 'tablet', least: 724, before: 724, nowhere: true },
  { name: '1024×768 (a tablet on its side)', w: 1024, h: 768, dpr: 2, kind: 'tablet', least: 716, before: 716 },
  { name: '1280×800 (a laptop)', w: 1280, h: 800, dpr: 1, desktop: true, kind: 'desktop', least: 748, before: 748 },
  { name: '1920×1080', w: 1920, h: 1080, dpr: 1, desktop: true, kind: 'desktop', least: 800, before: 800 },
];

// Before the page's own scripts: a switch for its animation loop (the board
// held still for the woodpecker's portrait); a stand-in wake lock that
// records what's asked of it (?nowake: none at all, as in an older browser);
// a tab that can be hidden and shown (__setHidden); ?nofs: a browser without
// full screen for a page, as on an iPhone; and the round's end on demand
// (__kill: snakes that go out on the next tick, by seat).
const PRE = `(() => {
  const raw = window.requestAnimationFrame.bind(window);
  window.__autoRaf = true;
  window.requestAnimationFrame = cb => raw(function held(ts) { if (window.__autoRaf) cb(ts); else raw(held); }); // (held, not dropped: the loop goes on once it's let go)
  const q = new URLSearchParams(location.search);
  if (q.has('nofs')) Object.defineProperty(Document.prototype, 'fullscreenEnabled', { configurable: true, get: () => false });
  const W = window.__wake = { log: [], held: null, refuse: false };
  if (q.has('nowake')) Object.defineProperty(Navigator.prototype, 'wakeLock', { configurable: true, get: () => undefined });
  else Object.defineProperty(Navigator.prototype, 'wakeLock', { configurable: true, get: () => ({
    request(type) {
      W.log.push('request');
      if (W.refuse) return Promise.reject(new DOMException('battery saver', 'NotAllowedError'));
      const s = new EventTarget();
      s.type = type; s.released = false;
      s.release = () => { if (!s.released) { s.released = true; if (W.held === s) W.held = null; W.log.push('release'); s.dispatchEvent(new Event('release')); } return Promise.resolve(); };
      W.held = s;
      return Promise.resolve(s);
    },
  }) });
  window.__lose = () => { const s = W.held; if (!s) return; s.released = true; W.held = null; W.log.push('lost'); s.dispatchEvent(new Event('release')); }; // (the browser letting go)
  let hidden = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
  window.__setHidden = h => { hidden = h; if (h) __lose(); document.dispatchEvent(new Event('visibilitychange')); };
  window.__kill = [];
  addEventListener('DOMContentLoaded', () => {
    const E = window.SnakeEngine, step = E.step;
    E.step = g => {
      const dying = step(g);
      for (const seat of __kill.splice(0)) {
        const s = g.snakes[seat];
        if (!s || !s.alive) continue;
        Object.assign(s, { alive: false, cause: 'hit the edge', killer: 'wall', killerId: null, fatal: 'wall' });
        dying.push(s);
      }
      return dying;
    };
  });
})();`;

// The page's layout, as the test reads it.
const LAYOUT = `(() => {
  const box = el => { if (!el) return null; const b = el.getBoundingClientRect(); return b.width || b.height ? { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom } : null; };
  const q = s => document.querySelector(s);
  const se = document.scrollingElement;
  return {
    vw: innerWidth, vh: innerHeight, scrollW: se.scrollWidth, scrollH: se.scrollHeight,
    board: box(q('#game')), frame: box(q('.frame')), ledge: box(q('#perch-ledge')),
    header: box(q('header')), tags: box(q('#scoreboard')), speed: box(q('#speed')), chatter: box(q('.chatter')), help: box(q('#help')),
  };
})()`;

// Whether each element takes a tap where it is (the topmost thing at its
// middle is it, or inside it), and is on the screen.
const REACH = sels => `(() => [...document.querySelectorAll(${JSON.stringify(sels)})].filter(el => !el.hidden && el.getBoundingClientRect().width).map(el => {
  const b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
  const top = document.elementFromPoint(x, y);
  return { what: el.id || el.textContent.trim().slice(0, 18) || el.className, on: b.left >= -0.5 && b.right <= innerWidth + 0.5 && b.top >= -0.5 && b.bottom <= innerHeight + 0.5, taps: !!top && (top === el || el.contains(top)) };
}))()`;

// The woodpecker perched for a spot (cells), resting or eyeing its chunk
// (crouched, its head turned to it), drawn on the held board; then its own
// layer's pixels read back: where it is (CSS px) and how many of them lie
// over the board's cells, and over each of the page's furniture (rects, CSS px).
const PERCH = (x, y, aim, rects = {}) => `(() => {
  const g = SnakeDebug.game();
  g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000);
  g.woodpecker = null; SnakeDebug.draw(); // (gone a moment, so it's placed afresh rather than hopping over)
  g.woodpecker = { x: ${x}, y: ${y}, at: g.time, target: ${aim ? `[${y * 24 + x}]` : '[]'}, strikeAt: ${aim ? 'g.tick + 4' : '-1'}, last: [], struckAt: -1, restUntil: g.tick + 1e6 };
  SnakeDebug.draw();
  const L = document.getElementById('bird-layer');
  if (!L || L.style.display === 'none') return null;
  const sx = L.width / innerWidth, sy = L.height / innerHeight;
  const data = L.getContext('2d').getImageData(0, 0, L.width, L.height).data;
  const b = document.getElementById('game').getBoundingClientRect();
  const bx0 = Math.floor(b.left * sx), bx1 = Math.ceil(b.right * sx), by0 = Math.floor(b.top * sy), by1 = Math.ceil(b.bottom * sy);
  const R = Object.entries(${JSON.stringify(rects)}).map(([k, f]) => [k, Math.floor(f.x * sx), Math.ceil(f.r * sx), Math.floor(f.y * sy), Math.ceil(f.b * sy)]), on = {};
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, over = 0;
  for (let j = 0; j < L.height; j++) for (let i = 0; i < L.width; i++) {
    if (data[(j * L.width + i) * 4 + 3] < 24) continue; // (not its faint shadow's edge)
    if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j;
    if (i >= bx0 && i < bx1 && j >= by0 && j < by1) over++;
    for (const [k, l, r, t, bt] of R) if (i >= l && i < r && j >= t && j < bt) on[k] = (on[k] || 0) + 1;
  }
  if (x1 < 0) return null;
  return { over, on, x: x0 / sx, y: y0 / sy, r: (x1 + 1) / sx, b: (y1 + 1) / sy, h: (y1 - y0 + 1) / sy };
})()`;
const SPOTS = [[1, 1], [12, 1], [22, 1], [1, 12], [12, 12], [22, 12], [1, 22], [6, 22], [12, 22], [17, 22], [22, 22]];

const only = process.argv[2];
const furnitureOf = l => Object.fromEntries(['header', 'tags', 'speed', 'chatter'].filter(k => l[k]).map(k => [k, l[k]]));
const r1 = v => Math.round(v * 10) / 10;

(async () => {
  const site = await serve();
  const b = await launch();
  const ev = expr => b.eval(expr);
  const board = [];
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: PRE });
    let insetsByCdp = true;
    const open = async (d, query = '') => {
      await b.viewport(d.w, d.h, { scale: d.dpr, mobile: !d.desktop });
      if (insetsByCdp) {
        try { await b.send('Emulation.setSafeAreaInsetsOverride', { insets: d.insets || {} }); } catch { insetsByCdp = false; }
      }
      await b.go(`${site.url}index.html?debug${query}`);
      if (d.insets && !insetsByCdp) { // (an older Chrome: the padded variant, the safe area set by hand)
        const i = d.insets;
        await ev(`(() => { const s = document.createElement('style'); s.textContent = ':root { --safe-t: ${i.top}px; --safe-r: ${i.right}px; --safe-b: ${i.bottom}px; --safe-l: ${i.left}px; } body { padding-top: max(12px, ${i.top}px) !important; padding-bottom: max(16px, ${i.bottom}px) !important; }'; document.head.append(s); dispatchEvent(new Event('resize')); return 'ok'; })()`);
        await b.sleep(100);
      }
    };
    const toRound = async (button = 'start') => {
      await ev(`document.getElementById('${button}').click(); 'ok'`);
      await ev(`SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`); // (through the countdown, then held still)
      await b.sleep(120);
    };

    for (const d of DEVICES) {
      if (only && !d.name.includes(only)) continue;
      const tag = d.name;
      // ---------------------------------------------- the start card
      await open(d);
      const ready = await ev(LAYOUT);
      const upright = d.kind === 'upright', side = d.kind === 'side';
      board.push(`  ${d.name.padEnd(48)} ${String(d.before).padStart(4)} → ${r1(ready.board.w)}`);
      check(ready.board.w >= d.least && ready.board.w >= d.before, `${tag}: the board is at least ${d.least} px`, `${r1(ready.board.w)} px, before ${d.before}`);
      check(ready.scrollW <= ready.vw, `${tag}: nothing scrolls sideways`, `${ready.scrollW} of ${ready.vw}`);
      if (side) check(ready.scrollH <= ready.vh, `${tag}: nothing scrolls at all, the column beside the board as tall as the screen`, `${ready.scrollH} of ${ready.vh}`);
      if (upright) check(ready.frame.x <= 0.5 && ready.frame.r >= ready.vw - 0.5 && ready.board.x <= 6 && ready.board.r >= ready.vw - 6, `${tag}: the board runs edge to edge, its frame a thin rim`, `frame ${r1(ready.frame.x)}-${r1(ready.frame.r)}, board ${r1(ready.board.x)}-${r1(ready.board.r)} of ${ready.vw}`);
      if (side) check(ready.frame.h >= ready.vh - (d.insets ? d.insets.top + d.insets.bottom : 0) - 0.5 && ready.board.h >= ready.frame.h - 12, `${tag}: the board takes the full height less a thin rim`, `frame ${r1(ready.frame.h)}, board ${r1(ready.board.h)} of ${ready.vh}`);
      check(upright ? ready.ledge && ready.ledge.h >= 28 && ready.ledge.y >= ready.frame.b - 0.5 : !ready.ledge, `${tag}: ${upright ? 'a ledge under the board for the woodpecker' : 'no ledge (room enough beside the board)'}`, ready.ledge ? `${r1(ready.ledge.h)} px` : 'none');
      if (d.insets) check(ready.header.y >= d.insets.top - 0.5 && ready.board.x >= d.insets.left - 0.5 && ready.board.r <= ready.vw - d.insets.right + 0.5 && (!side || ready.frame.b <= ready.vh - d.insets.bottom + 0.5), `${tag}: the page keeps inside the safe area`);

      // The header: its buttons on one row; on a phone held upright, the
      // title with Score and Best on the row above them.
      // (wider: the title made that much wider, as a livelier S might make it)
      const ROWS = wider => `(() => {
        const st = document.createElement('style');
        st.textContent = 'h1 { padding-right: ${wider}px; }';
        document.head.append(st);
        const mid = el => { const b = el.getBoundingClientRect(); return b.top + b.height / 2; };
        const shown = [...document.querySelectorAll('header .hud button')].filter(el => el.getBoundingClientRect().width);
        const title = document.querySelector('h1'), stats = [...document.querySelectorAll('header .stat')];
        const b = shown.map(mid), s = stats.map(mid);
        const tb = title.getBoundingClientRect(), hd = document.querySelector('header');
        const text = document.createRange();
        text.selectNodeContents(title);
        const used = text.getBoundingClientRect().width + ${wider} + stats.reduce((w, el) => w + el.getBoundingClientRect().width + parseFloat(getComputedStyle(hd).columnGap), 0);
        const out = { buttons: shown.length, buttonRow: Math.max(...b) - Math.min(...b) < 4, titleRow: s.every(v => v > tb.top && v < tb.bottom), apart: Math.min(...b) > tb.bottom, slack: hd.getBoundingClientRect().width - used };
        st.remove();
        return out;
      })()`;
      const rows = await ev(ROWS(0));
      check(rows.buttonRow, `${tag}: the header's ${rows.buttons} buttons are on one row`);
      if (d.w === 320) {
        check(rows.titleRow && rows.apart, `${tag}: the title, Score and Best on one row, the buttons on their own row below`, `${r1(rows.slack)} px to spare on the title's row`);
        const wider = await ev(ROWS(8));
        check(wider.buttonRow && wider.apart && wider.buttons === rows.buttons, `${tag}: with the title 8 px wider, the buttons still have a row of their own`, wider.titleRow ? 'the title, Score and Best still on one row too' : 'Score and Best would wrap under the title (its own row: no button there)');
      }

      // Nothing cut off, and everything takes a tap: the header's buttons,
      // the name tags, the start card's buttons; and the chatter's switch
      // (scrolled to: on a short phone held upright the page runs past the
      // screen; on its side, below, it must be on the screen as it is).
      let reach = await ev(REACH('header .hud button, #scoreboard li, #overlay .buttons button'));
      check(reach.length >= 8 && reach.every(r => r.on && r.taps), `${tag}: the header's buttons, the name tags and the start card's buttons are on the screen and take a tap`, reach.filter(r => !r.on || !r.taps).map(r => r.what).join(', ') || `${reach.length} of them`);
      if (!side) {
        await ev(`document.getElementById('chatter-toggle').scrollIntoView({ block: 'nearest' }); 'ok'`);
        reach = await ev(REACH('#chatter-toggle'));
        await ev(`scrollTo(0, 0); 'ok'`);
        check(reach.length === 1 && reach[0].on && reach[0].taps, `${tag}: the chatter's switch takes a tap (scrolled to)`);
      }
      check(ready.tags.x >= -0.5 && ready.tags.r <= ready.vw + 0.5 && (await ev(`[...document.querySelectorAll('#scoreboard li')].every(li => li.getBoundingClientRect().right <= document.getElementById('scoreboard').getBoundingClientRect().right + 0.5)`)), `${tag}: the name tags fit the width`);
      const boardHasCard = await ev(`(() => { const c = document.querySelector('#overlay .card').getBoundingClientRect(), g = document.getElementById('game').getBoundingClientRect(); return c.top >= g.top - 0.5 && c.bottom <= g.bottom + 0.5 && c.left >= g.left - 0.5 && c.right <= g.right + 0.5; })()`);
      check(boardHasCard, `${tag}: the start card fits on the board`);

      // ---------------------------------------------- a round, held still
      await toRound();
      const play = await ev(LAYOUT);
      check(await ev('SnakeDebug.state()') === 'running', `${tag}: a round gets going`);
      check(play.scrollW <= play.vw && (!side || play.scrollH <= play.vh), `${tag}: playing, nothing scrolls${side ? '' : ' sideways'}`, `${play.scrollW}×${play.scrollH} of ${play.vw}×${play.vh}`);
      if (side) {
        reach = await ev(REACH('#chatter-toggle'));
        check(reach.length === 1 && reach[0].on && reach[0].taps, `${tag}: playing, the chatter's switch is on the screen and takes a tap`);
        check(play.help.b <= play.vh + 0.5 && play.help.r <= play.vw + 0.5, `${tag}: playing, the help line is on the screen`);
      }
      check(await ev(`(() => { const h = document.getElementById('help'); return h.scrollWidth <= h.clientWidth + 1; })()`), `${tag}: the help line isn't cut off at the side`);

      // The woodpecker perched, resting and eyeing its chunk, for spots all over the board.
      const perches = [];
      for (const [x, y] of SPOTS) for (const aim of [false, true]) perches.push({ x, y, aim, p: await ev(PERCH(x, y, aim, furnitureOf(play))) });
      const drawn = perches.filter(q => q.p);
      check(drawn.length === perches.length, `${tag}: the woodpecker is drawn for every spot`, `${drawn.length} of ${perches.length}`);
      const covers = drawn.filter(q => q.p.over > (d.nowhere ? 4 : 0));
      check(!covers.length, `${tag}: perched (resting or eyeing its chunk), it never covers a cell${d.nowhere ? ' (with room nowhere, its beak’s tip touches the edge, as before: 4 px at most)' : ''}`, covers.length ? covers.map(q => `${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${q.p.over} px`).join('; ') : `${drawn.length} perches`);
      const offWhy = q => [q.p.x < -0.5 && 'left', q.p.r > play.vw + 0.5 && 'right', q.p.y < -0.5 && 'top', q.p.b > play.vh + 0.5 && 'bottom', ...Object.keys(q.p.on).map(k => `${q.p.on[k]} px over the ${k}`)].filter(Boolean);
      const off = drawn.filter(q => offWhy(q).length);
      check(!off.length, `${tag}: perched, all of it is on the screen and off the tags, the chatter and the header`, off.map(q => `${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${offWhy(q).join(', ')} (${r1(q.p.x)},${r1(q.p.y)}-${r1(q.p.r)},${r1(q.p.b)})`).join('; '));
      const tall = drawn.map(q => q.p.h), small = Math.min(...tall);
      if (upright) {
        const onLedge = drawn.every(q => q.p.y >= play.board.b - 0.5 && q.p.b <= play.ledge.b + 16);
        const least = d.h >= 780 ? 48 : 36; // (a short phone has less height to spare: a smaller ledge, still bigger than the old gutter's 34 px)
        check(onLedge && small >= least, `${tag}: upright, it stands on the ledge under the board, at least ${least} px tall`, `${r1(small)}-${r1(Math.max(...tall))} px tall`);
      } else if (side) {
        const beside = drawn.every(q => q.p.r <= play.board.x + 0.5 || q.p.x >= play.board.r - 0.5);
        check(beside && small >= 30, `${tag}: on its side, it perches beside the board, at least 30 px tall`, `${r1(small)}-${r1(Math.max(...tall))} px tall`);
      }
      d.bird = `${r1(small)}-${r1(Math.max(...tall))}`;

      // A nap: its card fits, and its buttons take a tap.
      await ev(`window.__autoRaf = true; document.getElementById('pause').click(); 'ok'`);
      await b.sleep(150);
      reach = await ev(REACH('#overlay .buttons button'));
      check(await ev('SnakeDebug.state()') === 'paused' && reach.length >= 1 && reach.every(r => r.on && r.taps), `${tag}: the nap's card and its buttons take a tap`, reach.map(r => `${r.what}${r.on && r.taps ? '' : ' (cut off)'}`).join(', '));

      // ---------------------------------------------- watching
      await open(d);
      await toRound('watch');
      const watch = await ev(LAYOUT);
      check(watch.scrollW <= watch.vw && (!side || watch.scrollH <= watch.vh), `${tag}: watching (the speed buttons showing), nothing scrolls${side ? '' : ' sideways'}`, `${watch.scrollW}×${watch.scrollH} of ${watch.vw}×${watch.vh}`);
      reach = await ev(REACH('#speed button'));
      check(reach.length === 3 && (upright || reach.every(r => r.on && r.taps)), `${tag}: watching, the speed buttons are there${upright ? '' : ', on the screen, and take a tap'}`);
      const wp = [];
      for (const [x, y] of [[1, 22], [12, 22], [22, 22], [22, 1]]) wp.push(await ev(PERCH(x, y, true, furnitureOf(watch))));
      check(wp.every(p => p && p.over <= (d.nowhere ? 4 : 0) && !Object.keys(p.on).length), `${tag}: watching, the perched woodpecker covers no cell and keeps off the speed buttons and the rest`, wp.map(p => (p ? `${p.over} px over cells${Object.keys(p.on).map(k => `, ${p.on[k]} over the ${k}`).join('')}` : 'none')).join('; '));
      await ev(`window.__autoRaf = true; 'ok'`);
    }

    // ------------------------------------------- the cards that come by themselves
    // Your death's card and the round's end, on the smallest screens and the
    // owner's: their buttons on the screen and taking a tap.
    for (const d of DEVICES.filter(x => [320, 640, 780].includes(x.w) || (x.w === 390 && !x.insets))) {
      await open(d);
      await ev(HELPERS);
      await toRound();
      await ev(`window.__autoRaf = true; __kill.push(0); 'ok'`);
      const died = await ev(`waitFor(() => cardUp(), 8000).then(() => true, () => false)`);
      await b.sleep(650); // (it takes no tap for a moment)
      let reach = await ev(REACH('#overlay .buttons button'));
      check(died && reach.length >= 2 && reach.every(r => r.on && r.taps), `${d.name}: your death's card and its buttons take a tap`, reach.map(r => `${r.what}${r.on && r.taps ? '' : ' (cut off)'}`).join(', '));
      await ev(`document.getElementById('watch').click(); __kill.push(2, 3); 'ok'`); // (keep watching; then the round ends)
      const over = await ev(`waitFor(() => SnakeDebug.state() === 'over' && cardUp(), 15000).then(() => true, () => false)`);
      await b.sleep(650);
      reach = await ev(REACH('#overlay .buttons button'));
      check(over && reach.length >= 2 && reach.every(r => r.on && r.taps), `${d.name}: the round's end card and its buttons take a tap`, reach.map(r => `${r.what}${r.on && r.taps ? '' : ' (cut off)'}`).join(', '));
    }

    // ------------------------------------------------------- full screen
    // A tap on the button (a real touch: full screen needs one) goes in, and
    // another comes out; its label and icon say which way it goes. Where the
    // browser can't (an iPhone), there's no button.
    const fsTap = async () => {
      const r = await ev(`document.getElementById('fullscreen').getBoundingClientRect().toJSON()`);
      const at = { x: r.x + r.width / 2, y: r.y + r.height / 2, id: 1 };
      await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] });
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await b.sleep(400);
      return ev(`(() => { const f = document.getElementById('fullscreen'); return { full: !!document.fullscreenElement, label: f.getAttribute('aria-label'), icon: f.dataset.full }; })()`);
    };
    for (const d of [DEVICES[3], DEVICES[9]]) {
      await open(d);
      const shown = await ev(`document.fullscreenEnabled && !document.getElementById('fullscreen').hidden`);
      const was = await ev(`document.getElementById('fullscreen').getAttribute('aria-label')`);
      const into = await fsTap(), out = await fsTap();
      check(shown && was === 'Full screen' && into.full && into.label === 'Leave full screen' && into.icon === 'true' && !out.full && out.label === 'Full screen' && out.icon === 'false',
        `${d.name}: the full screen button is there, a tap goes in and another comes out, its label following`, `"${was}" → ${into.full ? 'full' : 'not full'}, "${into.label}" → ${out.full ? 'full' : 'not full'}, "${out.label}"`);
    }
    await open(DEVICES[3], '&nofs');
    const noFs = await ev(`(() => { const f = document.getElementById('fullscreen'); return f.hidden && !f.getBoundingClientRect().width; })()`);
    const buttonsNoFs = await ev(`[...document.querySelectorAll('header .hud button')].filter(el => el.getBoundingClientRect().width).length`);
    check(noFs && buttonsNoFs === 4, 'where the browser has no full screen for a page (an iPhone), there\'s no button', `${buttonsNoFs} buttons in the header`);

    // ----------------------------------------------------- the screen awake
    // What the stand-in wake lock was asked, step by step: request, release,
    // lost (the browser let go, as for a hidden tab).
    await open(DEVICES[3]);
    await ev(HELPERS);
    const expect = async (what, wantHeld, wantLog) => {
      await b.sleep(60);
      const h = await ev(`!!__wake.held`), log = await ev(`__wake.log.join(' ')`);
      check(h === wantHeld && log === wantLog, `the screen stays awake: ${what}`, `${h ? 'held' : 'not held'}; asked: ${log || 'nothing'}${log === wantLog ? '' : `, wanted ${wantLog || 'nothing'}`}`);
    };
    await expect('the start card: not held', false, '');
    await ev(`document.getElementById('start').click(); 'ok'`);
    await expect('the countdown: held', true, 'request');
    await ev(`SnakeDebug.frames(80); 'ok'`);
    check(await ev('SnakeDebug.state()') === 'running', 'the round is going');
    await expect('playing: still held, asked once', true, 'request');
    await ev(`document.getElementById('pause').click(); 'ok'`);
    await expect('a nap lets it go', false, 'request release');
    await ev(`document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
    await expect('waking asks again', true, 'request release request');
    await ev(`document.getElementById('records-open').click(); 'ok'`);
    await expect('the Hall of Fame (a nap) lets it go', false, 'request release request release');
    await ev(`document.getElementById('records-close').click(); 'ok'`);
    await expect('closing it, still napping: not asked', false, 'request release request release');
    await ev(`document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
    await expect('waking again', true, 'request release request release request');
    await ev(`__wake.log.length = 0; __setHidden(true); 'ok'`);
    await expect('a hidden tab loses it (and naps)', false, 'lost');
    await ev(`__setHidden(false); 'ok'`);
    await expect('back, but napping: not asked', false, 'lost');
    await ev(`document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
    await expect('waking asks', true, 'lost request');
    await ev(`__wake.log.length = 0; __lose(); 'ok'`);
    await expect('lost while the round goes on (the browser let go)', false, 'lost');
    await ev(`document.dispatchEvent(new Event('visibilitychange')); 'ok'`);
    await expect('the tab shown again: asked again, as it\'s still wanted', true, 'lost request');
    await ev(`__wake.log.length = 0; window.__autoRaf = true; __kill.push(0); 'ok'`);
    await ev(`waitFor(() => cardUp(), 8000).then(() => 1)`);
    await expect('your death\'s card lets it go', false, 'release');
    await ev(`document.getElementById('watch').click(); 'ok'`);
    await expect('keep watching: held', true, 'release request');
    await ev(`__kill.push(2, 3); 'ok'`);
    await ev(`waitFor(() => SnakeDebug.state() === 'over', 15000).then(() => 1)`);
    await expect('the round over: let go', false, 'release request release');
    await ev(`waitFor(() => cardUp(), 8000).then(() => 1)`);
    await b.sleep(600); // (the card takes no tap for a moment)
    await ev(`__wake.log.length = 0; document.getElementById('watch').click(); 'ok'`); // (Watch AIs)
    await expect('an AI round to watch: its countdown, held', true, 'request');
    await ev(`SnakeDebug.frames(80); 'ok'`);
    check(await ev('SnakeDebug.state() === "running" && !SnakeDebug.game().withPlayer'), 'an AI round is being watched');
    await expect('watching: held', true, 'request');
    await ev(`document.getElementById('pause').click(); 'ok'`);
    await expect('napping the watched round lets it go', false, 'request release');
    await ev(`__wake.log.length = 0; __wake.refuse = true; document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
    await ev(`SnakeDebug.frames(40); document.querySelector('#speed button[data-speed="2"]').click(); SnakeDebug.frames(10); 'ok'`); // (more changes while it's still wanted)
    await expect('refused (a battery saver, say): asked once, not again and again', false, 'request');
    await ev(`document.getElementById('pause').click(); __wake.refuse = false; document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
    await expect('the next time it\'s wanted, asked again', true, 'request request');
    await open(DEVICES[3], '&nowake');
    await toRound();
    await ev(`window.__autoRaf = true; document.getElementById('pause').click(); 'ok'`);
    check(await ev('typeof navigator.wakeLock === "undefined" && SnakeDebug.state() === "paused"'), 'with no wake lock at all, a round plays and naps as ever');

    // ------------------------------------------------------------ swipes
    // A real touch swipe on the board, across the way your snake is going, turns it.
    for (const d of [DEVICES[3], DEVICES[0], DEVICES[9], DEVICES[7]]) {
      await open(d);
      await toRound();
      const g = await ev(`(() => { const r = document.getElementById('game').getBoundingClientRect(), me = SnakeDebug.game().snakes[0], D = SnakeEngine.DIRS; return { x: r.x + r.width / 2, y: r.y + r.height / 2, across: me.dir === D.left || me.dir === D.right }; })()`);
      const way = g.across ? 'up' : 'right', dx = g.across ? 0 : 7, dy = g.across ? -7 : 0;
      await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.x, y: g.y, id: 1 }] });
      for (let i = 1; i <= 8; i++) {
        await b.sleep(16);
        await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: g.x + dx * i, y: g.y + dy * i, id: 1 }] });
      }
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await b.sleep(60);
      const turned = await ev(`(() => { const me = SnakeDebug.game().snakes[0], D = SnakeEngine.DIRS; return me.queue.includes(D.${way}) || me.dir === D.${way}; })()`);
      check(turned, `${d.name}: a swipe ${way} on the board turns your snake ${way}`);
      await ev(`window.__autoRaf = true; 'ok'`);
    }

    console.log(results.join('\n'));
    console.log('\nthe board (CSS px), before → now:');
    console.log(board.join('\n'));
    console.log('\nthe woodpecker perched, CSS px tall:');
    for (const d of DEVICES) if (d.bird) console.log(`  ${d.name.padEnd(48)} ${d.bird}`);
    if (b.errors.length) { console.log('page errors:', b.errors); failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log('\nall passed');
})().catch(e => { console.error(e); process.exit(1); });
