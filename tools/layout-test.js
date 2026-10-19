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
//   bottom, the chatter's log is cut inside its box, and the frame's moss
//   and leaves aren't cut by the screen's edge. On a small board your
//   death's card has its two buttons side by side. A focus ring at the
//   column's edge is whole, and with a mouse the header keeps its spacing.
// - The header: its buttons on one row everywhere; at 320 px the title,
//   Score and Best on one row, and the buttons on their own row (so a
//   button there never crowds the title).
// - The woodpecker, perched (resting, and eyeing its chunk) for spots all
//   over the board: never over a cell (its drawn pixels, read back from its
//   layer), on the screen and inside its safe area (not under a notch), off
//   the page's furniture; upright on a phone it stands on the ledge under
//   the board, at least 48 px tall (36 on a short phone, whose ledge is
//   smaller), clear of the moss and leaves hanging there, and on its side
//   it's beside the board. Flying out to a spot at the board's edge and
//   drumming it, it isn't cut off by the screen's edge either (on its side,
//   drumming the bottom rows still is: that's the drum's pose, for the
//   woodpecker's own later work, and it's printed).
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
// before this round's phone work). nowhere: no room for the woodpecker
// beside the board, and no ledge (a tablet held upright): it perches in the
// frame's gutter as small as it may be, as it always did there, its beak's
// tip touching the board's edge (a pixel or three of it, softened). short:
// a phone held upright too short for the board to run edge to edge (the
// browser's bars showing): the board as big as fits the height, and the
// ledge below the fold, so the bird perches in the gutter, as nowhere.
const notchUp = { top: 47, bottom: 34, left: 0, right: 0 }, notchSide = { top: 0, bottom: 21, left: 47, right: 47 };
const DEVICES = [
  { name: '320×640 (a small Android, the first iPhone SE)', w: 320, h: 640, dpr: 2, kind: 'upright', least: 308, before: 276 },
  { name: '320×460 (the same, with its browser\'s bars)', w: 320, h: 460, dpr: 2, kind: 'upright', short: true, least: 270, before: 250 },
  { name: '360×780', w: 360, h: 780, dpr: 3, kind: 'upright', least: 348, before: 316 },
  { name: '375×667 (iPhone SE)', w: 375, h: 667, dpr: 2, kind: 'upright', least: 363, before: 331 },
  { name: '375×548 (iPhone SE in Safari, its bars showing)', w: 375, h: 548, dpr: 2, kind: 'upright', short: true, nofs: true, least: 331, before: 331 },
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
  { name: '1000×480 (a laptop\'s window, its DevTools docked below)', w: 1000, h: 480, dpr: 1, desktop: true, kind: 'side', least: 428, before: 428 },
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
    hanging: decor.filter(f => /moss bottom|leaves b/.test(f.what) && f.b > board.b),
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
      if (upright && !d.short) check(ready.frame.x <= 0.5 && ready.frame.r >= ready.vw - 0.5 && ready.board.x <= 6 && ready.board.r >= ready.vw - 6, `${tag}: the board runs edge to edge, its frame a thin rim`, `frame ${r1(ready.frame.x)}-${r1(ready.frame.r)}, board ${r1(ready.board.x)}-${r1(ready.board.r)} of ${ready.vw}`);
      if (d.short) check(Math.abs(ready.frame.x + ready.frame.r - ready.vw) < 1 && ready.frame.b <= ready.vh + 0.5 && ready.frame.b >= ready.vh - 12, `${tag}: too short for edge to edge, the board is as big as fits the height, centred, its frame wholly on the screen`, `frame ${r1(ready.frame.x)}-${r1(ready.frame.r)}, down to ${r1(ready.frame.b)} of ${ready.vh}`);
      if (upright) check(ready.board.b <= ready.vh - (d.insets ? d.insets.bottom : 0) + 0.5, `${tag}: the whole board is on the first screen`, `down to ${r1(ready.board.b)} of ${ready.vh}`);
      if (upright) check(['header', 'tags'].every(k => Math.abs(ready[k].x - 12) < 0.5 && Math.abs(ready.vw - ready[k].r - 12) < 0.5), `${tag}: the header and the tags keep 12 px from the screen's edges`, ['header', 'tags'].map(k => `${k} ${r1(ready[k].x)}-${r1(ready[k].r)}`).join(', '));
      if (side) check(ready.frame.h >= ready.vh - (d.insets ? d.insets.top + d.insets.bottom : 0) - 0.5 && ready.board.h >= ready.frame.h - 12, `${tag}: the board takes the full height less a thin rim`, `frame ${r1(ready.frame.h)}, board ${r1(ready.board.h)} of ${ready.vh}`);
      if (side) {
        const cutDecor = ready.decor.filter(f => f.y < -0.5 || f.b > ready.vh + 0.5 || f.x < -0.5 || f.r > ready.vw + 0.5);
        check(!cutDecor.length, `${tag}: on its side, none of the frame's moss and leaves is cut off by the screen's edge`, cutDecor.map(f => `${f.what} ${r1(f.x)},${r1(f.y)}-${r1(f.r)},${r1(f.b)}`).join('; ') || `${ready.decor.length} shown`);
        const ring = await ev(`(() => { const m = getComputedStyle(document.querySelector('main')), p = document.getElementById('pause').getBoundingClientRect(), mb = document.querySelector('main').getBoundingClientRect(); return m.overflowX === 'visible' || p.left - 5 >= mb.left; })()`);
        check(ring, `${tag}: the nap button's focus ring isn't clipped at the column's edge`);
      }
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
      if (d.desktop) {
        const gapNow = await ev(`getComputedStyle(document.querySelector('header')).columnGap`);
        check(gapNow === '10px', `${tag}: with a mouse, the header's buttons keep their 10 px apart`, gapNow);
      }
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
        check(beside && small >= 29.5, `${tag}: upright with the ledge below the fold, it perches in the gutter beside the board, at least 30 px tall`, `${r1(small)}-${r1(Math.max(...tall))} px tall`);
      } else if (upright) {
        const onLedge = drawn.every(q => q.p.y >= play.board.b - 0.5 && q.p.b <= play.ledge.b + 16);
        const least = d.h >= 780 ? 48 : 36; // (a short phone has less height to spare: a smaller ledge, still bigger than the old gutter's 34 px)
        check(onLedge && small >= least, `${tag}: upright, it stands on the ledge under the board, at least ${least} px tall`, `${r1(small)}-${r1(Math.max(...tall))} px tall`);
      } else if (side) {
        const beside = drawn.every(q => q.p.r <= play.board.x + 0.5 || q.p.x >= play.board.r - 0.5);
        check(beside && small >= 30, `${tag}: on its side, it perches beside the board, at least 30 px tall`, `${r1(small)}-${r1(Math.max(...tall))} px tall`);
      }
      d.bird = `${r1(small)}-${r1(Math.max(...tall))}`;

      // Flying out to a spot at the board's edge (two moments of the
      // flight) and drumming it: on the ledge, never cut off by the screen's
      // edge (it stands on the middle's side of the spot); beside the board,
      // its drum at the left and right edges isn't either. The rest is the
      // flight's and the drum's own pose, not the perch's, and is printed:
      // with the board meeting the screen's bottom, the drum at the bottom
      // rows hangs past it, and from a perch near the screen's edge the
      // wings beat past it as it takes off.
      if (upright || side) {
        const ledge = upright && !d.short;
        const flights = [];
        for (const [x, y] of [[0, 12], [23, 12], [12, 23], [1, 22]]) for (const k of [2, 1, -1]) flights.push({ x, y, k, p: await ev(PERCH(x, y, k)) });
        const owed = f => ledge || (!gutter && f.k < 0 && f.y < 20); // (what the perch answers for: from a gutter with no room, nothing more than before)
        const cutOff = flights.filter(f => f.p && f.p.cut.length && owed(f));
        check(flights.every(f => f.p) && !cutOff.length, `${tag}: ${ledge ? 'flying out to a spot at the board\'s edge and drumming it' : 'drumming a spot at the board\'s left or right edge'}, it isn't cut off by the screen`, cutOff.map(f => `${f.x},${f.y} ${f.k < 0 ? 'drumming' : 'flying'}: cut off at the ${f.p.cut.join(' and ')}`).join('; '));
        const known = flights.filter(f => f.p && f.p.cut.length && !owed(f));
        if (known.length) d.drumGap = known.map(f => `${f.x},${f.y} ${f.k < 0 ? 'drumming' : `flying (${f.k})`} (${f.p.cut.join(', ')})`).join('; ');
      }

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
      check(wp.every(p => p && p.over <= (gutter ? 4 : 0) && !Object.keys(p.on).length && !outside(p).length), `${tag}: watching, the perched woodpecker covers no cell, keeps off the speed buttons and the rest, and is all on the screen`, wp.map(p => (p ? `${p.over} px over cells${Object.keys(p.on).map(k => `, ${p.on[k]} over the ${k}`).join('')}${outside(p).length ? `, ${outside(p).join(', ')}` : ''}` : 'none')).join('; '));
      if (side) {
        // The chatter full (five long lines): its log cut inside its box, and the column off the screen's top and bottom.
        await ev(`(() => { const log = document.getElementById('chatlog'); for (let i = 0; i < 5; i++) log.insertAdjacentHTML('afterbegin', '<li><strong>Gobbler</strong> <span>Out of my way! I’m starving, and the bark is bare!</span></li>'); return 'ok'; })()`);
        await b.sleep(60);
        const full = await ev(LAYOUT);
        check(full.header.y >= 4 && full.help.b <= full.vh - 2 && full.scrollH <= full.vh, `${tag}: watching, the column keeps off the screen's top and bottom`, `header from ${r1(full.header.y)}, help down to ${r1(full.help.b)} of ${full.vh}`);
        check(full.chatlog.b <= full.chatter.b - 5.5 && full.chatter.b <= full.help.y, `${tag}: watching, a full chatter's log is cut inside its box, clear of its edge`, `log down to ${r1(full.chatlog.b)}, its box to ${r1(full.chatter.b)}`);
      }
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
    check(noFs && buttonsNoFs === 4, 'where the browser has no full screen for a page (an iPhone), there\'s no button', `${buttonsNoFs} buttons in the header`);

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
