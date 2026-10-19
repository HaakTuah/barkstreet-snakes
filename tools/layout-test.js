#!/usr/bin/env node
// The page on phones, tablets and desktops, in headless Chrome (the
// DevTools protocol: each device's size, density, touch and safe area). It
// checks what DESIGN's "Phones" promises:
// - The board is as big as the call said: edge to edge on a phone held
//   upright (346 → about 382 px on a 390 px phone), the full height less a
//   thin rim on its side (268 → about 310 at 780×320), and no smaller than
//   before anywhere else. On a phone too short for edge to edge (an iPhone
//   SE with Safari's bars showing), it's as big as fits, wholly on the
//   screen, and the header and tags keep their 12 px from the screen's edge.
// - Nothing scrolls sideways; on its side, nothing scrolls at all. Nothing
//   is cut off: the name tags, the header's buttons, the chatter's switch,
//   the help line, and the buttons of the cards over the board (the start
//   card, a nap, your death, the round's end) are all on the screen and take
//   a tap. While you play, the help under the board is either wholly on the
//   screen or not shown (and then a short phone's first Go tells you about
//   the powers). On its side, the column keeps off the screen's top and
//   bottom; a full chatter's log, playing and watching, is cut inside its
//   box and the page, never to less than a row of words and never through
//   one (while watching, the help gives it its room only where, with the
//   help, it couldn't show a row); and the frame's moss and leaves aren't
//   cut by the screen's edge. On a small board your death's card has its two
//   buttons side by side. A focus ring at the column's edge is whole, and
//   with a mouse the header keeps its spacing.
// - In a browser without svh and dvh (Safari before 15.4, Chrome before
//   108), the board, its frame and the ledge are as they are with them.
// - The header (with the playtest's Field guide door): its rows as designed
//   for the screen. Held upright, the title with Score and Best, then the
//   buttons on their own row (so a button there never crowds the title),
//   but where only five share it (no full screen: an iPhone), wider than
//   340 px, the title and Score, then the buttons and Best; over the board,
//   one row, or the title with Score over Best and then the buttons; beside
//   it, the title (the full-screen button at its corner on a phone on its
//   side), Score and Best, the icons, and on a tall laptop's column the
//   doors' own row. No button on a row of its own; the full-screen button
//   ending a row; each door named wherever its row has room for its word,
//   else its picture, named in its tooltip and for a screen reader; the
//   guide's door costing the header no height (no taller than the phones
//   work's). On 22 more screens too, from 360×640 to 1920×945. As Score and
//   Best grow (0, 99, 100, 1000), the header keeps its rows and the board
//   its size and place (at 390×545-600 and 412×604 the header grew a row
//   at 100 or 1000, and the board shrank in the middle of a round).
// - The woodpecker, perched (resting, and eyeing its chunk) for spots all
//   over the board: never over a cell (its drawn pixels, read back from its
//   layer), on the screen and inside its safe area (not under a notch), off
//   the page's furniture; upright on a phone it stands on the ledge under
//   the board, at least 48 px tall (36 on a short phone, whose ledge is
//   smaller), clear of the moss and leaves hanging there, and on its side
//   it's beside the board (under 600 px wide, or under it, where all of it
//   fits there, looking up only a little). Flying out to a spot at the board's edge and
//   drumming it, through its whole wingbeat, it isn't cut off by the
//   screen's edge either (on its side, drumming the bottom rows still is,
//   and flying in to the top corners: that's the flight's and the drum's
//   pose, for the woodpecker's own later work, and it's printed).
// - Held upright at every height in between (too tall for the board to
//   leave a gutter, too short to show the ledge whole: 320, 375, 390 and
//   414 px wide, every 5 px), the woodpecker perched still covers no cell
//   (a beak's tip at most, as on a tablet), is 24 px tall or more, and is all
//   on the screen, and the board is still bigger than before.
// - Full screen: the button is there where the browser allows it (and not
//   where it doesn't, as on an iPhone), goes in and out on a tap, and its
//   label says which way it goes.
// - The screen stays awake (a stand-in wake lock records every request and
//   release) through the countdown and play and a watched AI round; it's let
//   go for a nap, a card and the Hall of Fame; a hidden tab loses it and
//   coming back asks again when it's wanted; a refusal isn't asked again
//   and again; and with no wake lock at all, nothing breaks.
// - A real touch swipe on the board still turns, held upright and on its side.
// - No error events on the page, playing, watching or resized (a resize
//   observer's loop, which isn't an exception, among them).
// It prints what it measured: each device's board, before and now.
//
//   node tools/layout-test.js [part of a screen's name, such as 390]
const { launch, serve, HELPERS } = require('./browser');

const results = [];
let failed = 0;
const check = (ok, what, detail = '') => {
  results.push(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
};

// Each device: its size and density, touch or not, its safe area (a notch,
// the home bar), and the board it should get at least (before: what it got
// before this round's phone work). head: the header's height in the phones
// work, before the Field guide's door came: it's no taller now (but on a
// laptop's tall column, where the doors have a row of their own). nowhere: no room for the woodpecker
// beside the board, and no ledge (a tablet held upright): it perches in the
// frame's gutter as small as it may be, as it always did there, its beak's
// tip touching the board's edge (a pixel or three of it, softened). short:
// a phone held upright too short for the board to run edge to edge (the
// browser's bars showing): the board as big as fits the height, and the
// ledge below the fold, so the bird perches in the gutter, as nowhere.
const notchUp = { top: 47, bottom: 34, left: 0, right: 0 }, notchSide = { top: 0, bottom: 21, left: 47, right: 47 };
const DEVICES = [
  { name: '320×640 (a small Android, the first iPhone SE)', w: 320, h: 640, dpr: 2, kind: 'upright', least: 308, before: 276, head: 80 },
  { name: '320×460 (the same, with its browser\'s bars)', w: 320, h: 460, dpr: 2, kind: 'upright', short: true, least: 270, before: 250, head: 80 },
  { name: '360×780', w: 360, h: 780, dpr: 3, kind: 'upright', least: 348, before: 316, head: 103.2 },
  { name: '375×667 (iPhone SE)', w: 375, h: 667, dpr: 2, kind: 'upright', least: 363, before: 331, head: 87.2 },
  { name: '375×548 (iPhone SE in Safari, its bars showing)', w: 375, h: 548, dpr: 2, kind: 'upright', short: true, nofs: true, least: 331, before: 331, head: 87.2 },
  { name: '375×635 (an iPhone 11 Pro in Safari)', w: 375, h: 635, dpr: 3, kind: 'upright', nofs: true, least: 363, before: 331, head: 87.2 },
  { name: '390×844 (iPhone 13, 14)', w: 390, h: 844, dpr: 3, kind: 'upright', least: 378, before: 346, head: 107.2 }, // (the call: 346 → about 382)
  { name: '412×915 (Pixel)', w: 412, h: 915, dpr: 2.625, kind: 'upright', least: 400, before: 368, head: 107.2 },
  { name: '430×932', w: 430, h: 932, dpr: 3, kind: 'upright', least: 418, before: 386, head: 107.2 },
  { name: '390×844 with a notch', w: 390, h: 844, dpr: 3, kind: 'upright', insets: notchUp, least: 378, before: 346, head: 107.2 },
  { name: '568×320 on its side (the first iPhone SE)', w: 568, h: 320, dpr: 2, kind: 'side', nofs: true, least: 266, before: 268, under: 2, head: 95.4 }, // (under: the board narrower than before by that much, the call: the column keeps 244 px for five buttons in a row, and the bird its 24 px gap)
  { name: '640×320 on its side', w: 640, h: 320, dpr: 2, kind: 'side', least: 300, before: 268, head: 95.4 },
  { name: '667×375 on its side', w: 667, h: 375, dpr: 2, kind: 'side', least: 355, before: 323, head: 95.4 },
  { name: '780×320 on its side, its browser bars showing', w: 780, h: 320, dpr: 3, kind: 'side', least: 300, before: 268, head: 95.4 }, // (the call: 268 → about 310)
  { name: '780×320 on its side with a notch (an iPhone in Safari)', w: 780, h: 320, dpr: 3, kind: 'side', insets: notchSide, nofs: true, least: 289, before: 268, head: 95.4 },
  { name: '844×390 on its side (or 780×320 in full screen)', w: 844, h: 390, dpr: 3, kind: 'side', least: 370, before: 338, head: 95.4 }, // (the call: about 380 in full screen)
  { name: '915×412 on its side', w: 915, h: 412, dpr: 2.625, kind: 'side', least: 392, before: 360, head: 95.4 },
  { name: '932×430 on its side', w: 932, h: 430, dpr: 3, kind: 'side', least: 410, before: 378, head: 95.4 },
  { name: '844×390 on its side with a notch', w: 844, h: 390, dpr: 3, kind: 'side', insets: notchSide, least: 349, before: 338, head: 95.4 },
  { name: '768×1024 (a tablet)', w: 768, h: 1024, dpr: 2, kind: 'tablet', least: 724, before: 724, nowhere: true, head: 52 },
  { name: '1024×768 (a tablet on its side)', w: 1024, h: 768, dpr: 2, kind: 'tablet', least: 716, before: 716, head: 172 },
  { name: '1000×480 (a laptop\'s window, its DevTools docked below)', w: 1000, h: 480, dpr: 1, desktop: true, kind: 'side', least: 428, before: 428, head: 85.4 },
  { name: '1280×800 (a laptop)', w: 1280, h: 800, dpr: 1, desktop: true, kind: 'desktop', least: 748, before: 748, head: 130 },
  { name: '1920×1080', w: 1920, h: 1080, dpr: 1, desktop: true, kind: 'desktop', least: 800, before: 800, head: 52 },
];

// Before the page's own scripts: a switch for its animation loop (the board
// held still for the woodpecker's portrait); a stand-in wake lock that
// records what's asked of it (?nowake: none at all, as in an older browser);
// a tab that can be hidden and shown (__setHidden); ?nofs: a browser without
// full screen for a page, as on an iPhone; and the round's end on demand
// (__kill: snakes that go out on the next tick, by seat); and the page's
// error events, which aren't exceptions (__errs: a resize observer's loop,
// say, when one's call changes what it observes).
const PRE = `(() => {
  window.__errs = [];
  addEventListener('error', e => window.__errs.push(e.message || String(e)));
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

// The page's layout, as the test reads it. (hanging: the frame's moss and
// leaves that hang below the board's bottom edge, into the ledge; decor:
// all of them that show; helpShown: the help isn't hidden for being cut.)
const LAYOUT = `(() => {
  const box = el => { if (!el) return null; const b = el.getBoundingClientRect(); return b.width || b.height ? { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom } : null; };
  const q = s => document.querySelector(s);
  const se = document.scrollingElement, board = box(q('#game'));
  const decor = [...document.querySelectorAll('.frame .moss, .frame .leaves')].map(el => ({ what: el.getAttribute('class'), ...box(el) })).filter(f => f.w);
  return {
    vw: innerWidth, vh: innerHeight, scrollW: se.scrollWidth, scrollH: se.scrollHeight,
    board, frame: box(q('.frame')), ledge: box(q('#perch-ledge')),
    header: box(q('header')), tags: box(q('#scoreboard')), speed: box(q('#speed')), chatter: box(q('.chatter')), chatlog: box(q('#chatlog')), help: box(q('#help')),
    helpShown: getComputedStyle(q('#help')).visibility !== 'hidden', decor,
    hanging: decor.filter(f => /moss bottom|leaves b/.test(f.what) && board && f.b > board.b),
  };
})()`;

// Whether each element takes a tap where it is (the topmost thing at its
// middle is it, or inside it), and is on the screen.
const REACH = sels => `(() => [...document.querySelectorAll(${JSON.stringify(sels)})].filter(el => !el.hidden && el.getBoundingClientRect().width).map(el => {
  const b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
  const top = document.elementFromPoint(x, y);
  return { what: el.id || el.textContent.trim().slice(0, 18) || el.className, on: b.left >= -0.5 && b.right <= innerWidth + 0.5 && b.top >= -0.5 && b.bottom <= innerHeight + 0.5, taps: !!top && (top === el || el.contains(top)) };
}))()`;

// The woodpecker for a spot (cells), drawn on the held board: perched,
// resting (pose false) or eyeing its chunk (true: crouched, its head turned
// to it), or, a number k, its strike due k ticks from now (2, 1: flying out
// to it; -1: drumming it). Then its own layer's pixels read back: where it
// is (CSS px), how many of them lie over the board's cells and over each of
// the page's furniture (rects, CSS px), and the edges of the screen it's cut
// off at (the layer is the screen: its pixels in the layer's outermost rows
// or columns run on past it).
const PERCH = (x, y, pose, rects = {}) => `(() => {
  const g = SnakeDebug.game();
  g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000);
  g.woodpecker = null; SnakeDebug.draw(); // (gone a moment, so it's placed afresh rather than hopping over)
  const aim = ${pose !== false}, k = ${typeof pose === 'number' ? pose : 4};
  g.woodpecker = { x: ${x}, y: ${y}, at: g.time, target: aim ? [${y * 24 + x}] : [], strikeAt: aim ? g.tick + k : -1, last: [], struckAt: -1, restUntil: g.tick + 1e6 };
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
  const solid = (i, j) => data[(j * L.width + i) * 4 + 3] >= 200; // (not the soft edge of a line ending a hair inside the screen)
  let cl = false, cr = false, ct = false, cb = false;
  for (let j = 0; j < L.height; j++) { cl = cl || solid(0, j); cr = cr || solid(L.width - 1, j); }
  for (let i = 0; i < L.width; i++) { ct = ct || solid(i, 0); cb = cb || solid(i, L.height - 1); }
  const cut = [cl && 'left', ct && 'top', cr && 'right', cb && 'bottom'].filter(Boolean);
  return { over, on, cut, x: x0 / sx, y: y0 / sy, r: (x1 + 1) / sx, b: (y1 + 1) / sy, h: (y1 - y0 + 1) / sy };
})()`;
const SPOTS = [[1, 1], [12, 1], [22, 1], [1, 12], [12, 12], [22, 12], [1, 22], [6, 22], [12, 22], [17, 22], [22, 22]];

// The woodpecker flying out to a spot and drumming it, through its whole
// wingbeat: at points all along the flight out, from just off its perch to
// the moment before the strike, and drumming, each drawn at eight moments of
// the beat (it beats every 2π × 55 ms, and its head drives as it drums);
// then which edges of the screen it's cut off at, flying and drumming (its
// solid pixels in its layer's outermost rows or columns: the layer is the
// screen). A wing that reaches past the screen at one moment of the beat
// and not another is still caught.
const FLIGHT = (x, y) => `(() => {
  const g = SnakeDebug.game();
  g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000);
  const L = document.getElementById('bird-layer'), G = L.getContext('2d'), W = L.width, H = L.height;
  const solid = (a, b, c, d) => { const p = G.getImageData(a, b, c, d).data; for (let i = 3; i < p.length; i += 4) if (p[i] >= 200) return true; return false; };
  const cut = { fly: new Set(), drum: new Set() };
  g.woodpecker = null; SnakeDebug.draw();
  const t0 = performance.now();
  // (k, alpha: its strike k ticks off, drawn alpha through the tick: how far out it's flown, 0.1 to 0.99 of the way, or drumming)
  for (const [k, a] of [[3, 0.75], [2, 0.25], [2, 0.75], [1, 0], [1, 0.5], [1, 0.875], [1, 0.975], [-1, 0.5]]) {
    g.woodpecker = { x: ${x}, y: ${y}, at: g.time, target: [${y * 24 + x}], strikeAt: g.tick + k, last: [], struckAt: -1, restUntil: g.tick + 1e6 };
    for (let i = 0; i < 8; i++) {
      SnakeRender.frame(a, t0 + i * 43.2);
      const at = k < 0 ? cut.drum : cut.fly;
      if (solid(0, 0, 1, H)) at.add('left');
      if (solid(0, 0, W, 1)) at.add('top');
      if (solid(W - 1, 0, 1, H)) at.add('right');
      if (solid(0, H - 1, W, 1)) at.add('bottom');
    }
  }
  g.woodpecker = null; SnakeDebug.draw();
  return { fly: [...cut.fly], drum: [...cut.drum] };
})()`;
const FLIGHT_SPOTS = [[0, 12], [23, 12], [12, 23], [1, 22], [3, 22], [4, 22], [19, 22], [0, 0], [23, 0]];

// The chatter's log, cut at its box (and maybe ending at its last whole row,
// by a clip: snake.js fitLog), and at the page's bottom (it's clipped
// there): where it ends as drawn, whether it shows a whole row of words,
// and whether any row is sliced through by where it ends.
const LOG_ROWS = `(() => {
  const log = document.getElementById('chatlog'), lb = log.getBoundingClientRect(), cp = log.style.clipPath;
  const end = Math.min(lb.bottom - (cp ? parseFloat(cp.replace('inset(', '').split(' ')[2]) : 0), document.querySelector('main').getBoundingClientRect().bottom);
  const range = document.createRange();
  let whole = 0, sliced = 0;
  for (const li of log.children) {
    range.selectNodeContents(li);
    for (const f of range.getClientRects()) if (f.height) { if (f.bottom <= end + 0.5) whole++; else if (f.top < end - 0.5) sliced++; }
  }
  return { whole, sliced, end, top: lb.top };
})()`;

// A browser without svh or dvh: the page's own stylesheet, those units made
// unknown to the browser (and its tests for them false). A declaration with
// one that has var() in it isn't checked until it's used, so a second one
// can't fall back to a first: it would lose its property. Then the page is
// laid out again.
const NO_SVH = `(async () => {
  const link = document.querySelector('link[href="style.css"]');
  const css = await (await fetch(link.href)).text();
  const st = document.createElement('style');
  st.textContent = css.replace(/(\\d)([sd]vh)\\b/g, '$1zzh');
  link.replaceWith(st);
  await new Promise(r => setTimeout(r, 200));
  dispatchEvent(new Event('resize'));
  await new Promise(r => setTimeout(r, 200));
  return (css.match(/\\d[sd]vh\\b/g) || []).length;
})()`;

// The header, as rows: what's on each, left to right (the title, Score,
// Best and each button shown, by its id), grouped by where each sits (a
// button's margin box: one reaching past its row on negative margins, the
// full-screen button at a phone's column corner, counts on the row it's
// laid out in; Score over Best, beside the title, count as one); its
// height; whether each door shows its word; and the Field guide's tooltip
// and spoken name.
const HEADER = `(() => {
  const vis = el => !!el && !el.hidden && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  const hd = document.querySelector('header'), stats = document.querySelector('.stats');
  const pair = stats && getComputedStyle(stats).display !== 'contents' ? stats : null;
  const items = [['title', document.querySelector('h1')], ...[...hd.querySelectorAll('.hud .stat')].map((el, i) => [i ? 'Best' : 'Score', pair || el]), ...[...hd.querySelectorAll('.hud button')].filter(vis).map(el => [el.id, el])];
  let rows = [];
  for (const [n, el] of items) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el), top = r.top - parseFloat(cs.marginTop), bottom = r.bottom + parseFloat(cs.marginBottom);
    let row = rows.find(q => Math.min(bottom, q.bottom) - Math.max(top, q.top) > 2);
    if (!row) rows.push(row = { top, bottom, items: [] });
    row.top = Math.min(row.top, top); row.bottom = Math.max(row.bottom, bottom);
    row.items.push({ n, l: n === 'Best' && pair ? r.left + 0.5 : r.left });
  }
  for (let merged = true; merged;) { // (rows that grew into each other are one)
    merged = false;
    for (const a of rows) for (const b of rows) if (a !== b && !merged && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) { a.items.push(...b.items); a.top = Math.min(a.top, b.top); a.bottom = Math.max(a.bottom, b.bottom); rows = rows.filter(q => q !== b); merged = true; }
  }
  rows.sort((a, b) => a.top - b.top);
  const named = id => vis(document.querySelector('#' + id + ' .trophy-text')), g = document.getElementById('guide-open');
  const col = matchMedia('(min-aspect-ratio: 5/4) and (max-height: 900px) and (min-width: 480px)').matches;
  return { height: hd.getBoundingClientRect().height, rows: rows.map(r => r.items.sort((a, b) => a.l - b.l).map(i => i.n).join(' ')), guide: named('guide-open'), trophy: named('records-open'),
    tip: g.title, label: g.getAttribute('aria-label'), place: innerWidth <= 440 ? 'upright' : col ? (innerHeight <= 500 ? 'side' : 'column') : 'over' };
})()`;
// A door shown by its word instead of its picture, 5 px wider still (its
// word with 5 px to spare), or hidden (the header without it).
const DOOR = (id, how) => {
  const css = how === 'hidden' ? `#${id} { display: none !important; }`
    : `#${id} { width: auto !important; min-width: 0 !important; padding-inline: 12px !important; margin-right: 5px !important; } #${id} svg { display: none !important; } #${id} .trophy-text { display: inline !important; }`;
  return `(() => { const st = document.createElement('style'); st.id = 'door-test'; st.textContent = ${JSON.stringify(css)}; document.head.append(st); return 'ok'; })()`;
};

const only = process.argv[2];
const sized = (w, h) => DEVICES.find(d => d.w === w && d.h === h && !d.insets);
const CALLS = sized(390, 844), CALLS_SIDE = sized(780, 320); // (the call's phone: upright, and on its side with its browser's bars)
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

    // On its side, the chatter full (five long lines, two rows each),
    // playing or watching: its log cut inside its box and the page, showing
    // a whole row at least and slicing none; and the column off the
    // screen's top and bottom. Watching, the help gives the chatter its room
    // only where the log couldn't show a whole row beside it: the help made
    // to show (and the chatter as tall as with it), the log shows none.
    const chatterFull = async (tag, watching, si = { bottom: 0 }) => {
      const what = watching ? 'watching' : 'playing';
      await ev(`(() => { const log = document.getElementById('chatlog'); for (let i = 0; i < 5; i++) log.insertAdjacentHTML('afterbegin', '<li><strong>Gobbler</strong> <span>Out of my way! I’m starving, and the bark is bare!</span></li>'); return 'ok'; })()`);
      await b.sleep(60);
      await settle();
      const full = await ev(LAYOUT), rows = await ev(LOG_ROWS), last = full.help || full.chatter;
      check(full.header.y >= 4 && last.b <= full.vh - Math.max(2, si.bottom) && full.scrollH <= full.vh, `${tag}: ${what}, the column keeps off the screen's top and bottom`, `header from ${r1(full.header.y)}, ${full.help ? 'help' : 'chatter (the help giving way)'} down to ${r1(last.b)} of ${full.vh}`);
      check(rows.end <= full.chatter.b - 5.5 && (!full.help || full.chatter.b <= full.help.y), `${tag}: ${what}, a full chatter's log is cut inside its box, clear of its edge`, `log drawn down to ${r1(rows.end)} (its own box to ${r1(full.chatlog.b)}), the chatter's box to ${r1(full.chatter.b)}`);
      check(rows.whole >= 1 && !rows.sliced, `${tag}: ${what}, a full chatter shows a whole row of words at least, and no row sliced through`, `log ${r1(full.chatlog.h)} px tall, showing to ${r1(rows.end - rows.top)}; ${rows.whole} pieces of rows whole, ${rows.sliced} sliced`);
      if (!watching) return;
      await ev(`(() => { const st = document.createElement('style'); st.id = 'help-made-to-show'; st.textContent = 'main #help { display: block !important; } main .chatter { max-height: 100% !important; }'; document.head.append(st); return 'ok'; })()`);
      await settle();
      const shown = await ev(LOG_ROWS);
      await ev(`document.getElementById('help-made-to-show').remove(); 'ok'`);
      await settle();
      const gone = !full.help, room = shown.whole >= 1;
      check(gone === !room, `${tag}: watching, the help gives the chatter its room only where, beside it, the log couldn't show a whole row of words`, `the help ${gone ? 'gone' : 'shown'}; beside it, the log would show to ${r1(shown.end - shown.top)} px, ${shown.whole ? 'a row' : 'no row'}`);
    };

    for (const d of DEVICES) {
      if (only && !d.name.includes(only)) continue;
      const tag = d.name;
      // ---------------------------------------------- the start card
      await open(d);
      const ready = await ev(LAYOUT);
      const upright = d.kind === 'upright', side = d.kind === 'side';
      board.push(`  ${d.name.padEnd(48)} ${String(d.before).padStart(4)} → ${r1(ready.board.w)}`);
      check(ready.board.w >= d.least && ready.board.w >= d.before - (d.under || 0), `${tag}: the board is at least ${d.least} px${d.under ? `, ${d.under} px under the ${d.before} before at most (the column's 244 px and the bird's gap)` : ''}`, `${r1(ready.board.w)} px, before ${d.before}`);
      check(ready.scrollW <= ready.vw, `${tag}: nothing scrolls sideways`, `${ready.scrollW} of ${ready.vw}`);
      if (side) check(ready.scrollH <= ready.vh, `${tag}: nothing scrolls at all, the column beside the board as tall as the screen`, `${ready.scrollH} of ${ready.vh}`);
      if (upright && !d.short) check(ready.frame.x <= 0.5 && ready.frame.r >= ready.vw - 0.5 && ready.board.x <= 6 && ready.board.r >= ready.vw - 6, `${tag}: the board runs edge to edge, its frame a thin rim`, `frame ${r1(ready.frame.x)}-${r1(ready.frame.r)}, board ${r1(ready.board.x)}-${r1(ready.board.r)} of ${ready.vw}`);
      if (d.short) check(Math.abs(ready.frame.x + ready.frame.r - ready.vw) < 1 && ready.frame.b <= ready.vh + 0.5 && (ready.frame.b >= ready.vh - 12 || Math.abs(ready.frame.x - 13) < 0.6 || Math.abs(ready.vh - ready.frame.b - 25) < 0.6), `${tag}: too short for edge to edge, the board is as big as fits the height (or leaves the woodpecker its 13 px beside the frame, or 25 under it), centred, its frame wholly on the screen`, `frame ${r1(ready.frame.x)}-${r1(ready.frame.r)}, down to ${r1(ready.frame.b)} of ${ready.vh}`);
      if (upright) check(ready.board.b <= ready.vh - (d.insets ? d.insets.bottom : 0) + 0.5, `${tag}: the whole board is on the first screen`, `down to ${r1(ready.board.b)} of ${ready.vh}`);
      if (upright) check(['header', 'tags'].every(k => Math.abs(ready[k].x - 12) < 0.5 && Math.abs(ready.vw - ready[k].r - 12) < 0.5), `${tag}: the header and the tags keep 12 px from the screen's edges`, ['header', 'tags'].map(k => `${k} ${r1(ready[k].x)}-${r1(ready[k].r)}`).join(', '));
      if (side) check((ready.frame.h >= ready.vh - (d.insets ? d.insets.top + d.insets.bottom : 0) - 0.5 || Math.abs(ready.frame.r - ready.vw + Math.max(12, d.insets ? d.insets.right : 0)) < 0.6) && ready.board.h >= ready.frame.h - 12, `${tag}: the board takes the full height less a thin rim (or, on a narrow screen, the width the column leaves it)`, `frame ${r1(ready.frame.h)} to ${r1(ready.frame.r)}, board ${r1(ready.board.h)} of ${ready.vw}×${ready.vh}`);
      if (side) {
        const cutDecor = ready.decor.filter(f => f.y < -0.5 || f.b > ready.vh + 0.5 || f.x < -0.5 || f.r > ready.vw + 0.5);
        check(!cutDecor.length, `${tag}: on its side, none of the frame's moss and leaves is cut off by the screen's edge`, cutDecor.map(f => `${f.what} ${r1(f.x)},${r1(f.y)}-${r1(f.r)},${r1(f.b)}`).join('; ') || `${ready.decor.length} shown`);
        const ring = await ev(`(() => { const m = getComputedStyle(document.querySelector('main')), p = document.getElementById('pause').getBoundingClientRect(), mb = document.querySelector('main').getBoundingClientRect(); return m.overflowX === 'visible' || p.left - 5 >= mb.left; })()`);
        check(ring, `${tag}: the nap button's focus ring isn't clipped at the column's edge`);
      }
      check(upright ? ready.ledge && ready.ledge.h >= 28 && ready.ledge.y >= ready.frame.b - 0.5 : !ready.ledge, `${tag}: ${upright ? 'a ledge under the board for the woodpecker' : 'no ledge (room enough beside the board)'}`, ready.ledge ? `${r1(ready.ledge.h)} px` : 'none');
      if (d.insets) check(ready.header.y >= d.insets.top - 0.5 && ready.board.x >= d.insets.left - 0.5 && ready.board.r <= ready.vw - d.insets.right + 0.5 && (!side || ready.frame.b <= ready.vh - d.insets.bottom + 0.5), `${tag}: the page keeps inside the safe area`);

      // The header: its rows, its doors, the full-screen button, and what
      // the doors cost (headerChecks, above). With a mouse its buttons keep
      // their 10 px; at 320 px, with the title 8 px wider (as a livelier S
      // might make it), the buttons still have their row.
      await headerChecks(tag, d);
      if (d.desktop) {
        const gapNow = await ev(`getComputedStyle(document.querySelector('header')).columnGap`);
        check(gapNow === '10px', `${tag}: with a mouse, the header's buttons keep their 10 px apart`, gapNow);
      }
      if (d.w === 320) {
        await ev(`(() => { const st = document.createElement('style'); st.id = 'wider-title'; st.textContent = 'h1 { padding-right: 8px; }'; document.head.append(st); return 'ok'; })()`);
        await settle();
        const wider = await ev(HEADER);
        await ev(`document.getElementById('wider-title').remove(); 'ok'`);
        await settle();
        const buttons = wider.rows.find(r => r.includes('pause')) || '';
        check(!buttons.includes('title') && buttons.split(' ').length >= 5 && wider.rows.filter(r => r.includes('pause') || r.includes('mute')).length === 1, `${tag}: with the title 8 px wider, the buttons still have a row of their own`, wider.rows.join(' / '));
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
      if (upright) {
        // (the page can't scroll while you play: a help line cut in half by the screen's edge is hidden)
        const whole = play.help.b <= play.vh + 0.5, gone = play.help.y >= play.vh - 0.5 || !play.helpShown;
        const lesson = await ev(`document.getElementById('toast').textContent`);
        check((whole || gone) && (whole || lesson === 'Tap jumps. Swipe ahead flashes.'), `${tag}: playing, the help under the board is wholly on the screen, or not shown and the first Go says how to jump and flash`,
          `${r1(play.help.y)}-${r1(play.help.b)} of ${play.vh}${play.helpShown ? '' : ', hidden'}; Go said "${lesson}"`);
      }

      // The woodpecker perched, resting and eyeing its chunk, for spots all over the board.
      const perches = [];
      const rects = { ...furnitureOf(play), ...(play.ledge && !d.short ? Object.fromEntries(play.hanging.map((f, i) => [`hanging ${f.what} (${i})`, f])) : {}) }; // (on the ledge: the moss and leaves hanging into it too)
      for (const [x, y] of SPOTS) for (const aim of [false, true]) perches.push({ x, y, aim, p: await ev(PERCH(x, y, aim, rects)) });
      const drawn = perches.filter(q => q.p);
      check(drawn.length === perches.length, `${tag}: the woodpecker is drawn for every spot`, `${drawn.length} of ${perches.length}`);
      const gutter = d.nowhere || d.short;
      const covers = drawn.filter(q => q.p.over > (gutter ? 4 : 0));
      check(!covers.length, `${tag}: perched (resting or eyeing its chunk), it never covers a cell${gutter ? ' (with room nowhere, its beak’s tip touches the edge, as before: 4 px at most)' : ''}`, covers.length ? covers.map(q => `${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${q.p.over} px`).join('; ') : `${drawn.length} perches`);
      const si = { left: 0, right: 0, top: 0, bottom: 0, ...d.insets }; // (inside the safe area, not just the screen: never under a notch)
      const outside = p => [...p.cut.map(e => `cut off at the screen's ${e}`), p.x < si.left - 0.5 && 'left', p.r > play.vw - si.right + 0.5 && 'right', p.y < si.top - 0.5 && 'top', p.b > play.vh - si.bottom + 0.5 && 'bottom'].filter(Boolean);
      const offWhy = q => [...outside(q.p), ...Object.keys(q.p.on).map(k => `${q.p.on[k]} px over the ${k}`)];
      const off = drawn.filter(q => offWhy(q).length);
      check(!off.length, `${tag}: perched, all of it is on the screen, inside its safe area, and off the tags, the chatter, the header${upright ? ' and the moss and leaves hanging under the board' : ''}`, off.map(q => `${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${offWhy(q).join(', ')} (${r1(q.p.x)},${r1(q.p.y)}-${r1(q.p.r)},${r1(q.p.b)})`).join('; '));
      const tall = drawn.map(q => q.p.h), small = Math.min(...tall);
      if (upright && d.short) {
        const beside = drawn.every(q => q.p.r <= play.board.x + 2 || q.p.x >= play.board.r - 2);
        check(beside && small >= 23.5, `${tag}: upright with the ledge below the fold, it perches in the gutter beside the board, at least 24 px tall (the room the page leaves it)`, `${r1(small)}-${r1(Math.max(...tall))} px tall`);
      } else if (upright) {
        const onLedge = drawn.every(q => q.p.y >= play.board.b - 0.5 && q.p.b <= play.ledge.b + 16);
        const least = d.h >= 780 ? 48 : 36; // (a short phone has less height to spare: a smaller ledge, still bigger than the old gutter's 34 px)
        check(onLedge && small >= least, `${tag}: upright, it stands on the ledge under the board, at least ${least} px tall`, `${r1(small)}-${r1(Math.max(...tall))} px tall`);
      } else if (side) {
        const beside = drawn.every(q => q.p.r <= play.board.x + 0.5 || q.p.x >= play.board.r - 0.5);
        check(beside && small >= 30, `${tag}: on its side, it perches beside the board, at least 30 px tall`, `${r1(small)}-${r1(Math.max(...tall))} px tall`);
      }
      d.bird = `${r1(small)}-${r1(Math.max(...tall))}`;

      // Flying out to a spot at the board's edge or corner, or near the
      // screen's edge on the bottom row, and drumming it, through its whole
      // wingbeat: on the ledge, never cut off by the screen's edge (it
      // stands on the middle's side of a spot near the screen's edge, so its
      // wings beat over the board); beside the board, its drum away from
      // the bottom rows isn't either. The rest is the flight's and the
      // drum's own pose, not the perch's, and is printed: with the board
      // meeting the screen's bottom, the drum at the bottom rows hangs past
      // it; flying in to the top row at the corners, a wingbeat reaches past
      // the screen's top; and from a perch near the screen's edge the wings
      // beat past it as it takes off.
      if (upright || side) {
        const ledge = upright && !d.short;
        const flights = [];
        for (const [x, y] of FLIGHT_SPOTS) flights.push({ x, y, f: await ev(FLIGHT(x, y)) });
        const cuts = f => [...f.f.fly.map(e => ({ what: 'flying', e })), ...f.f.drum.map(e => ({ what: 'drumming', e }))];
        const owed = (f, c) => ledge || (!gutter && c.what === 'drumming' && f.y < 20); // (what the perch answers for: from a gutter with no room, nothing more than before)
        const say = (f, list) => `${f.x},${f.y} ${[...new Set(list.map(c => c.what))].map(w => `${w} (${list.filter(c => c.what === w).map(c => c.e).join(', ')})`).join(', ')}`;
        const cutOff = flights.map(f => ({ f, list: cuts(f).filter(c => owed(f, c)) })).filter(q => q.list.length);
        check(!cutOff.length, `${tag}: ${ledge ? 'flying out to a spot at the board\'s edge and drumming it' : 'drumming a spot at the board\'s left or right edge, off the bottom rows'}, through the whole wingbeat, it isn't cut off by the screen`, cutOff.map(q => `cut off: ${say(q.f, q.list)}`).join('; ') || `${flights.length} spots`);
        const known = flights.map(f => ({ f, list: cuts(f).filter(c => !owed(f, c)) })).filter(q => q.list.length);
        if (known.length) d.drumGap = known.map(q => say(q.f, q.list)).join('; ');
      }

      if (side) await chatterFull(tag, false, d.insets);

      // A nap: its card fits, and its buttons take a tap.
      await ev(`window.__autoRaf = true; document.getElementById('pause').click(); 'ok'`);
      await b.sleep(150);
      reach = await ev(REACH('#overlay .buttons button'));
      check(await ev('SnakeDebug.state()') === 'paused' && reach.length >= 1 && reach.every(r => r.on && r.taps), `${tag}: the nap's card and its buttons take a tap`, reach.map(r => `${r.what}${r.on && r.taps ? '' : ' (cut off)'}`).join(', '));
      const errsPlaying = await ev(`__errs.join(' | ')`);

      // ---------------------------------------------- watching
      await open(d);
      await toRound('watch');
      const watch = await ev(LAYOUT);
      check(watch.scrollW <= watch.vw && (!side || watch.scrollH <= watch.vh), `${tag}: watching (the speed buttons showing), nothing scrolls${side ? '' : ' sideways'}`, `${watch.scrollW}×${watch.scrollH} of ${watch.vw}×${watch.vh}`);
      reach = await ev(REACH('#speed button'));
      check(reach.length === 3 && (upright || reach.every(r => r.on && r.taps)), `${tag}: watching, the speed buttons are there${upright ? '' : ', on the screen, and take a tap'}`);
      const wp = [];
      for (const [x, y] of [[1, 22], [12, 22], [22, 22], [22, 1]]) wp.push(await ev(PERCH(x, y, true, furnitureOf(watch))));
      check(wp.every(p => p && p.over <= (gutter ? 4 : 0) && !Object.keys(p.on).length && !outside(p).length), `${tag}: watching, the perched woodpecker covers no cell, keeps off the speed buttons and the rest, and is all on the screen`, wp.map(p => (p ? `${p.over} px over cells${Object.keys(p.on).map(k => `, ${p.on[k]} over the ${k}`).join('')}${outside(p).length ? `, ${outside(p).join(', ')}` : ''}` : 'none')).join('; '));
      if (side) await chatterFull(tag, true, d.insets);
      const errs = [errsPlaying, await ev(`__errs.join(' | ')`)].filter(Boolean).join(' | ');
      check(!errs, `${tag}: no error events on the page, playing or watching (a resize observer's loop, say)`, errs);
      await ev(`window.__autoRaf = true; 'ok'`);
    }

    // ----------------------------------------- upright, heights in between
    // A phone held upright too tall for its board to leave a gutter and too
    // short to show the ledge whole (an iPhone 8 Plus in Safari, 414×622; an
    // iPhone SE in an app's browser): every 5 px of height, the screen
    // resized under a round held still (a fresh page at the first height, and
    // at a few phones' own sizes). The woodpecker perched, resting and eyeing
    // its chunk, covers no cell (a beak's tip at most, 4 px, as on a tablet),
    // is 24 px tall or more (the page leaves it that much room, on the ledge
    // or beside the board), and is all on the screen and off the page's
    // furniture; and the board is wholly on the screen and bigger than before
    // (6d478ed: the page 24 px narrower than the screen or 190 px shorter,
    // less a 10 px rim each side), or as big as fits the height where that
    // ran off the screen.
    const between = [];
    const atSize = async (w, h, dpr, fresh) => {
      if (fresh) { await open({ w, h, dpr }); await toRound(); }
      else { await b.viewport(w, h, { scale: dpr, mobile: true }); await b.sleep(150); await settle(); }
      const l = await ev(LAYOUT), ps = [];
      for (const [x, y] of [[1, 12], [22, 12], [12, 22], [1, 22], [22, 1]]) for (const aim of [false, true]) ps.push({ x, y, aim, p: await ev(PERCH(x, y, aim, furnitureOf(l))) });
      const before = Math.min(w - 24, Math.max(240, h - 190)) - 20, drawn = ps.filter(q => q.p);
      const why = q => !q.p ? ['not drawn'] : [q.p.over > 4 && `${q.p.over} px over the cells`, q.p.h < 23.5 && `${r1(q.p.h)} px tall`, ...q.p.cut.map(e => `cut off at the screen's ${e}`),
        (q.p.x < -0.5 || q.p.r > l.vw + 0.5 || q.p.y < -0.5 || q.p.b > l.vh + 0.5) && 'off the screen', ...Object.keys(q.p.on).map(k => `${q.p.on[k]} px over the ${k}`)].filter(Boolean);
      const bad = ps.filter(q => why(q).length).map(q => `${w}×${h} ${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${why(q).join(', ')}`);
      const fits = l.vh - l.frame.y - (l.frame.h - l.board.h); // (as big as fits the height: where the old board ran off the screen, that's as big as it can be)
      const errs = await ev(`__errs.splice(0).join(' | ')`);
      if (errs) bad.push(`${w}×${h}: error events on the page: ${errs}`);
      if (l.board.w < Math.min(before, fits) - 0.5 || l.board.b > l.vh + 0.5) bad.push(`${w}×${h}: the board ${r1(l.board.w)} px, down to ${r1(l.board.b)} (before: ${before}; as big as fits the height: ${r1(fits)})`);
      between.push({ w, h, board: l.board.w, before, fits, bird: Math.min(...drawn.map(q => q.p.h)), over: Math.max(0, ...drawn.map(q => q.p.over)), bad });
    };
    for (const [w, h0, h1, dpr] of [[320, 460, 540, 2], [375, 545, 640, 2], [390, 545, 640, 3], [414, 545, 640, 3]]) {
      if (only && !String(w).includes(only)) continue;
      for (let h = h0; h <= h1; h += 5) await atSize(w, h, dpr, h === h0);
    }
    for (const [w, h, dpr] of [[414, 622, 3], [412, 604, 2.625], [375, 553, 2]]) if (!only || String(w).includes(only)) await atSize(w, h, dpr, true);
    for (const w of [...new Set(between.map(s => s.w))]) {
      const at = between.filter(s => s.w === w), bad = at.flatMap(s => s.bad);
      check(!bad.length, `${w} px wide, upright, ${Math.min(...at.map(s => s.h))} to ${Math.max(...at.map(s => s.h))} px tall: perched, the woodpecker covers no cell (a beak's tip at most), is 24 px tall or more, all on the screen and off the page's furniture, and the board is bigger than before (or as big as fits the height)`,
        bad.join('; ') || `${at.length} heights: the bird ${r1(Math.min(...at.map(s => s.bird)))} px tall or more, ${Math.max(...at.map(s => s.over))} px over the cells at most; the board ${r1(Math.min(...at.filter(s => s.board >= s.before - 0.5).map(s => s.board - s.before)))} px bigger than before or more${at.some(s => s.board < s.before - 0.5) ? `, but as big as fits the height at ${at.filter(s => s.board < s.before - 0.5).map(s => `${s.w}×${s.h} (${r1(s.board)}, before ${s.before} ran off the screen)`).join(', ')}` : ''}`);
    }

    // ------------------------------------------------ Score and Best growing
    // Held upright, Score and Best growing from 0 to 99, 100 and 1000 in a
    // round held still (Best following Score past it): the header keeps its
    // rows, and the board its size and place. (At 390×545-600 and 412×604
    // the header grew a row at 100 or 1000, the page measured it again, and
    // the board shrank in the middle of a round; taller, it moved down.)
    for (const [w, h, dpr] of [[390, 545, 3], [390, 560, 3], [390, 575, 3], [390, 590, 3], [390, 600, 3], [412, 604, 2.625], [414, 622, 3], [428, 640, 3], [390, 844, 3], [375, 548, 2], [360, 640, 3], [344, 600, 3], [320, 460, 2]]) {
      if (only && !String(w).includes(only)) continue;
      await open({ w, h, dpr });
      await ev(`localStorage.setItem('snake-best', '0'); 'ok'`); // (your Best from the rounds before: none)
      await open({ w, h, dpr });
      await toRound();
      const at = [];
      for (const n of [0, 99, 100, 1000]) {
        await ev(`(() => { for (let i = 0; i < 60 && document.getElementById('score').textContent !== '${n}'; i++) { SnakeDebug.game().snakes[0].eaten = ${n}; SnakeDebug.frames(1); } return 'ok'; })()`); // (shown after the next tick)
        await settle(); await b.sleep(60); await settle(); // (the page measures what's above the board a moment after the header changes)
        at.push({ n, ...(await ev(`(() => { const g = document.getElementById('game').getBoundingClientRect(), hd = document.querySelector('header').getBoundingClientRect(); return { w: g.width, x: g.x, y: g.y, head: hd.height, score: document.getElementById('score').textContent, best: document.getElementById('best').textContent }; })()`)) });
      }
      const moved = at.filter(q => ['w', 'x', 'y', 'head'].some(k => Math.abs(q[k] - at[0][k]) > 0.25));
      const shown = at.every(q => q.score === String(q.n) && q.best === String(q.n));
      check(shown && !moved.length, `${w}×${h}: as Score and Best grow (0, 99, 100, 1000), the header keeps its rows and the board its size and place`,
        moved.length ? moved.map(q => `at ${q.n}: the header ${r1(q.head)} px (from ${r1(at[0].head)}), the board ${r1(q.w)} at ${r1(q.x)},${r1(q.y)} (from ${r1(at[0].w)} at ${r1(at[0].x)},${r1(at[0].y)})`).join('; ') : `the board ${r1(at[0].w)} at ${r1(at[0].x)},${r1(at[0].y)}, the header ${r1(at[0].head)} px${shown ? '' : '; Score and Best not shown as set'}`);
      await ev(`window.__autoRaf = true; 'ok'`);
    }

    // ---------------------------------------------- the header on more screens
    // The header's checks (above) on the screens between: a 1080p desktop's
    // browser maximized (1920×945) and with a bookmarks bar (1920×920),
    // laptops (1366×657, 1366×768, 1440×900, 1536×864), 4:3 windows and touch
    // screens (800×600, 1000×800 and 1040×760 with touch), iPads upright
    // (the mini, 744×1133; an Air, 820×1180), narrow windows (460×900, and
    // 500×1000 with touch: an iPad's Split View; 600×900), and phones
    // (360×640, 371×800, 384×854, 393×851, 414×896 and 428×926 without full
    // screen, 440×900). And as Score and Best grow to 1000, the header keeps
    // its rows and its height.
    for (const [w, h, dpr, touch, nofs] of [[1920, 945, 1], [1920, 920, 1], [1366, 657, 1], [1366, 768, 1], [1440, 900, 1], [1536, 864, 1], [800, 600, 1], [800, 600, 2, true],
      [1000, 800, 2, true], [1040, 760, 2, true], [744, 1133, 2, true], [820, 1180, 2, true], [460, 900, 1], [500, 1000, 2, true], [600, 900, 1], [360, 640, 3, true],
      [371, 800, 3, true], [384, 854, 3, true], [393, 851, 3, true], [414, 896, 3, true, true], [428, 926, 3, true, true], [440, 900, 3, true]]) {
      const tag = `${w}×${h}${touch ? ' (touch)' : ''}${nofs ? ' without full screen' : ''}`;
      if (only && !tag.includes(only)) continue;
      const d = { w, h, dpr, desktop: !touch, nofs };
      await open(d);
      const at0 = await headerChecks(tag, d);
      await ev(`(() => { document.getElementById('score').textContent = '1000'; document.getElementById('best').textContent = '1000'; return 'ok'; })()`);
      await settle();
      const at1000 = await ev(HEADER);
      check(at1000.rows.join(' / ') === at0.rows.join(' / ') && Math.abs(at1000.height - at0.height) < 0.5, `${tag}: with Score and Best at 1000, the header keeps its rows and its height`, `${at1000.rows.join(' / ')}, ${r1(at1000.height)} px`);
    }

    // ------------------------------------ on its side, the help giving way
    // Watching, the chatter full, on more short screens on their side: where
    // a row of words fits beside the help, it stays (780×340, a notched
    // 844×340: it gave way on every screen up to 340 px tall); where none
    // does (a notched 780×330), it gives the chatter its room.
    for (const [w, h, dpr, insets] of [[780, 340, 3], [844, 340, 3, notchSide], [780, 330, 3, notchSide]]) {
      const name = `${w}×${h} on its side${insets ? ' with a notch' : ''}`;
      if (only && !name.includes(only)) continue;
      await open({ w, h, dpr, insets, nofs: !!insets });
      await toRound('watch');
      await chatterFull(name, true, insets);
      await ev(`window.__autoRaf = true; 'ok'`);
    }

    // ------------------------------- on its side, a board narrower than tall
    // On a screen under about 600 px wide on its side the board is as wide as
    // the column leaves it, shorter than the screen, so there's room under
    // it. Perched (resting and eyeing its chunk) for spots all over the board,
    // the woodpecker never covers a cell and is all on the screen: below the
    // board it stands as on the ledge, its crown just under the board,
    // looking up only a little. (With a little less room than all of it
    // needed, pushed back onto the screen, it hung over the bottom row; and
    // eyeing a chunk from under the board its head turned up over it.)
    for (const [w, h, dpr] of [[480, 320, 2], [540, 320, 2], [600, 360, 2]]) {
      const name = `${w}×${h} on its side`;
      if (only && !name.includes(only)) continue;
      await open({ w, h, dpr, nofs: true });
      await toRound();
      const l = await ev(LAYOUT), ps = [];
      for (const [x, y] of SPOTS) for (const aim of [false, true]) ps.push({ x, y, aim, p: await ev(PERCH(x, y, aim, furnitureOf(l))) });
      const bad = ps.filter(q => !q.p || q.p.over || q.p.cut.length || Object.keys(q.p.on).length || q.p.x < -0.5 || q.p.r > l.vw + 0.5 || q.p.y < -0.5 || q.p.b > l.vh + 0.5);
      const under = ps.filter(q => q.p && q.p.y >= l.board.b - 0.5).length;
      check(!bad.length, `${name}: perched, resting or eyeing its chunk, the woodpecker never covers a cell, and is all on the screen and off the column`,
        bad.map(q => `${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${q.p ? `${q.p.over} px over the cells${q.p.cut.length ? ', cut off' : ''}${Object.keys(q.p.on).map(k => `, over the ${k}`).join('')}` : 'not drawn'}`).join('; ') || `${ps.length} perches, ${under} of them under the board`);
      await ev(`window.__autoRaf = true; 'ok'`);
    }

    // ------------------------------------------- a browser without svh or dvh
    // (Safari before 15.4, Chrome before 108): the board, its frame and the
    // ledge are as they are with them (here svh, dvh and vh are the same).
    for (const d of [CALLS, sized(375, 548), CALLS_SIDE, DEVICES.find(x => x.kind === 'side' && x.insets && x.w === 844)]) {
      if (only && !d.name.includes(only)) continue;
      await open(d);
      const was = await ev(LAYOUT), units = await ev(NO_SVH), now = await ev(LAYOUT);
      const same = ['board', 'frame', 'ledge'].every(k => (!was[k] && !now[k]) || (was[k] && now[k] && ['x', 'y', 'w', 'h'].every(m => Math.abs(was[k][m] - now[k][m]) < 0.6)));
      const say = q => (q ? `${r1(q.w)}×${r1(q.h)} at ${r1(q.x)},${r1(q.y)}` : 'none');
      check(units > 0 && same, `${d.name}: in a browser without svh or dvh, the board, its frame and the ledge are as they are with them`, ['board', 'ledge'].map(k => `${k} ${say(now[k])} (with them: ${say(was[k])})`).join('; '));
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
      const pair = await ev(`(() => { const g = document.getElementById('game').getBoundingClientRect(), c = document.querySelector('#overlay .card').getBoundingClientRect(); return { board: g.height, card: c.height, tops: [...document.querySelectorAll('#overlay .buttons button:not(.text-button)')].filter(el => el.getBoundingClientRect().width).map(el => el.getBoundingClientRect().top) }; })()`);
      if (pair.board <= 330) check(pair.tops.length === 2 && Math.abs(pair.tops[0] - pair.tops[1]) < 2, `${d.name}: on a ${Math.round(pair.board)} px board, your death's card has its two buttons side by side (stacked, they'd cover the board)`, `the card ${Math.round(pair.card)} px tall`);
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
    const fsTap = async want => {
      const r = await ev(`document.getElementById('fullscreen').getBoundingClientRect().toJSON()`);
      const at = { x: r.x + r.width / 2, y: r.y + r.height / 2, id: 1 };
      await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] });
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await b.sleep(400);
      // (on a busy machine the change can come later: up to two seconds for the screen to change and the button to follow)
      await ev(`new Promise(done => { const f = document.getElementById('fullscreen'), t0 = performance.now(); (function wait() { if ((!!document.fullscreenElement === ${want} && f.dataset.full === '${want}') || performance.now() - t0 > 2000) done(1); else setTimeout(wait, 50); })(); })`);
      return ev(`(() => { const f = document.getElementById('fullscreen'); return { full: !!document.fullscreenElement, label: f.getAttribute('aria-label'), icon: f.dataset.full }; })()`);
    };
    for (const d of [CALLS, CALLS_SIDE]) {
      await open(d);
      const shown = await ev(`document.fullscreenEnabled && !document.getElementById('fullscreen').hidden`);
      const was = await ev(`document.getElementById('fullscreen').getAttribute('aria-label')`);
      const into = await fsTap(true), out = await fsTap(false);
      check(shown && was === 'Full screen' && into.full && into.label === 'Leave full screen' && into.icon === 'true' && !out.full && out.label === 'Full screen' && out.icon === 'false',
        `${d.name}: the full screen button is there, a tap goes in and another comes out, its label following`, `"${was}" → ${into.full ? 'full' : 'not full'}, "${into.label}" → ${out.full ? 'full' : 'not full'}, "${out.label}"`);
    }
    await open(CALLS, '&nofs');
    const noFs = await ev(`(() => { const f = document.getElementById('fullscreen'); return f.hidden && !f.getBoundingClientRect().width; })()`);
    const buttonsNoFs = await ev(`[...document.querySelectorAll('header .hud button')].filter(el => el.getBoundingClientRect().width).length`);
    check(noFs && buttonsNoFs === 5, 'where the browser has no full screen for a page (an iPhone), there\'s no button', `${buttonsNoFs} buttons in the header`);

    // ----------------------------------------------------- the screen awake
    // What the stand-in wake lock was asked, step by step: request, release,
    // lost (the browser let go, as for a hidden tab).
    await open(CALLS);
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
    await open(CALLS, '&nowake');
    await toRound();
    await ev(`window.__autoRaf = true; document.getElementById('pause').click(); 'ok'`);
    check(await ev('typeof navigator.wakeLock === "undefined" && SnakeDebug.state() === "paused"'), 'with no wake lock at all, a round plays and naps as ever');

    // ------------------------------------------------------------ swipes
    // A real touch swipe on the board, across the way your snake is going, turns it.
    for (const d of [CALLS, sized(320, 640), CALLS_SIDE, sized(640, 320)]) {
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
    if (between.length) {
      console.log('\nheld upright, heights in between (CSS px): the board (before) and the woodpecker perched, its smallest');
      for (const s of between) console.log(`  ${`${s.w}×${s.h}`.padEnd(10)} ${r1(s.board)} (${s.before}), ${r1(s.bird)}`);
    }
    const gaps = DEVICES.filter(d => d.drumGap);
    if (gaps.length) {
      console.log('\nknown, for the woodpecker\'s own later work (its flight and its drum, not its perch), cut off by the screen\'s edge:');
      for (const d of gaps) console.log(`  ${d.name.padEnd(48)} ${d.drumGap}`);
    }
    if (b.errors.length) { console.log('page errors:', b.errors); failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log('\nall passed');
})().catch(e => { console.error(e); process.exit(1); });
