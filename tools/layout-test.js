#!/usr/bin/env node
// The page on phones, tablets and desktops, in headless Chrome (the
// DevTools protocol: each device's size, density, touch and safe area). It
// checks what DESIGN's "Phones" promises:
// - The board is as big as the call said: edge to edge on a phone held
//   upright (346 → about 382 px on a 390 px phone), the full height less a
//   thin rim on its side (268 → about 310 at 780×320), 880 px beside the
//   column on a 1080p desktop's browser, and no smaller than before
//   anywhere else. On a phone too short for edge to edge (an iPhone SE with
//   Safari's bars showing), it's as big as fits over the row under it (or
//   leaves the woodpecker its 13 px beside the frame), wholly on the
//   screen, and the header and tags keep their 12 px from the screen's edge.
//   On a phone, and wherever the header is over the board, the board is
//   never smaller than on main before the page was one screen tall (the
//   owner's call: the board first, the help and the chatter give way),
//   main's measured once and pinned: the upright phones below, 12 screens
//   over the board (STACKED: near-square and narrow windows with a mouse
//   and with touch, a Surface Duo, iPads), held upright at every 10 px of
//   height from 440 to 940 at seven widths, and over the board at five
//   widths every 80 px of height from 560 to 1120, with a mouse and touch.
//   Nothing needed the no-scroll checks relaxed for that: they hold on
//   every one of those screens too, in every state.
// - One screen (DESIGN's "One screen"): nothing scrolls, down or sideways,
//   on any screen, in any state: the start card, the countdown, playing,
//   playing with the chatter full, a nap, your death's card, the round's
//   card, the Hall of Fame and the Field guide open, and watching with the
//   chatter full; on the 24 screens below and on desktops as browsers have
//   them (1920×945 to 2560×1305, at 125% and 150%, zoomed in and out), and
//   held upright at every 10 px of height from 440 to 940 at seven widths.
//   Nothing is cut off: the name tags, the header's buttons, the row under
//   the board (the chatter's switch, the help line, the speed buttons) and
//   the buttons of the cards over the board (the start card, a nap, your
//   death, the round's end) are all on the screen and take a tap. While you
//   play, the help under the board is either wholly on the screen or not
//   shown (and then a short phone's first Go tells you about the powers). A
//   full chatter, playing and watching, shows whole lines inside its box
//   and the page, under the row under the board, the newest at least (cut
//   to the rows that fit only where it alone doesn't), and no row sliced
//   through, or none at all where it has no room for a row, its switch
//   still there; while watching, the help gives it its room only where,
//   with the help, it couldn't show a row. Lines streaming in never move
//   the board, and set off no resize observer's loop. On its side, the
//   column keeps off the screen's top and bottom, and the frame's moss and
//   leaves aren't cut by the screen's edge. On a small board your death's
//   card has its two buttons side by side. A focus ring at the column's
//   edge is whole, and with a mouse the header keeps its spacing.
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
//   work's). On 33 more screens too, from 360×640 to 1920×945, short narrow
//   windows and five buttons (no full screen) among them. As Score and
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
//   on the screen, the page is one screen tall, and the board is still
//   bigger than before (or as big as fits the height).
// - Full screen: the button is there where the browser allows it (and not
//   where it doesn't, as on an iPhone), goes in and out on a tap, and its
//   label says which way it goes.
// - The screen stays awake (a stand-in wake lock records every request and
//   release) through the countdown and play and a watched AI round; it's let
//   go for a nap, a card and the Hall of Fame; a hidden tab loses it and
//   coming back asks again when it's wanted; a refusal isn't asked again
//   and again; and with no wake lock at all, nothing breaks.
// - A real touch swipe on the board still turns, held upright and on its side.
// - A banner while you play (DESIGN "Teaching by showing"): held upright, on
//   every phone here and at every height of the upright sweep (put up, and
//   the one up as the screen changes), one line over the header's title
//   row, its words whole, inside the safe area, never over the board, your
//   own tag or the pause button; elsewhere at the board's top or foot, never
//   its middle.
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
// browser's bars showing): the board as big as fits over the row under it,
// or leaving the bird its gutter, and no ledge to speak of, so the bird
// perches in the gutter, as nowhere. main: the board on main before the page
// was one screen tall (2ba41f9, measured once and pinned): on a phone, and
// wherever the header is over the board, it's never smaller (the owner: "on
// the phone, I really don't like that you make the gameplay screen
// smaller"); the help and the chatter give way instead.
const notchUp = { top: 47, bottom: 34, left: 0, right: 0 }, notchSide = { top: 0, bottom: 21, left: 47, right: 47 };
const DEVICES = [
  { name: '320×640 (a small Android, the first iPhone SE)', w: 320, h: 640, dpr: 2, kind: 'upright', least: 308, main: 312, before: 276, head: 80 },
  { name: '320×460 (the same, with its browser\'s bars)', w: 320, h: 460, dpr: 2, kind: 'upright', short: true, least: 270, main: 280, before: 250, head: 80 },
  { name: '360×780', w: 360, h: 780, dpr: 3, kind: 'upright', least: 348, main: 352, before: 316, head: 103.2 },
  { name: '375×667 (iPhone SE)', w: 375, h: 667, dpr: 2, kind: 'upright', least: 363, main: 367, before: 331, head: 87.2 },
  { name: '375×548 (iPhone SE in Safari, its bars showing)', w: 375, h: 548, dpr: 2, kind: 'upright', short: true, nofs: true, least: 331, main: 341, before: 331, head: 87.2 },
  { name: '375×635 (an iPhone 11 Pro in Safari)', w: 375, h: 635, dpr: 3, kind: 'upright', nofs: true, least: 363, main: 367, before: 331, head: 87.2 },
  { name: '390×844 (iPhone 13, 14)', w: 390, h: 844, dpr: 3, kind: 'upright', least: 378, main: 382, before: 346, head: 107.2 }, // (the call: 346 → about 382)
  { name: '412×915 (Pixel)', w: 412, h: 915, dpr: 2.625, kind: 'upright', least: 400, main: 404, before: 368, head: 107.2 },
  { name: '430×932', w: 430, h: 932, dpr: 3, kind: 'upright', least: 418, main: 422, before: 386, head: 107.2 },
  { name: '390×844 with a notch', w: 390, h: 844, dpr: 3, kind: 'upright', insets: notchUp, least: 378, main: 382, before: 346, head: 107.2 },
  { name: '568×320 on its side (the first iPhone SE)', w: 568, h: 320, dpr: 2, kind: 'side', nofs: true, least: 266, before: 268, under: 2, head: 95.4 }, // (under: the board narrower than before by that much, the call: the column keeps 244 px for five buttons in a row, and the bird its 24 px gap)
  { name: '640×320 on its side', w: 640, h: 320, dpr: 2, kind: 'side', least: 300, before: 268, head: 95.4 },
  { name: '667×375 on its side', w: 667, h: 375, dpr: 2, kind: 'side', least: 355, before: 323, head: 95.4 },
  { name: '780×320 on its side, its browser bars showing', w: 780, h: 320, dpr: 3, kind: 'side', least: 300, before: 268, head: 95.4 }, // (the call: 268 → about 310)
  { name: '780×320 on its side with a notch (an iPhone in Safari)', w: 780, h: 320, dpr: 3, kind: 'side', insets: notchSide, nofs: true, least: 289, before: 268, head: 95.4 },
  { name: '844×390 on its side (or 780×320 in full screen)', w: 844, h: 390, dpr: 3, kind: 'side', least: 370, before: 338, head: 95.4 }, // (the call: about 380 in full screen)
  { name: '915×412 on its side', w: 915, h: 412, dpr: 2.625, kind: 'side', least: 392, before: 360, head: 95.4 },
  { name: '932×430 on its side', w: 932, h: 430, dpr: 3, kind: 'side', least: 410, before: 378, head: 95.4 },
  { name: '844×390 on its side with a notch', w: 844, h: 390, dpr: 3, kind: 'side', insets: notchSide, least: 349, before: 338, head: 95.4 },
  { name: '768×1024 (a tablet)', w: 768, h: 1024, dpr: 2, kind: 'tablet', least: 724, main: 724, before: 724, nowhere: true, head: 52 },
  { name: '1024×768 (a tablet on its side)', w: 1024, h: 768, dpr: 2, kind: 'tablet', least: 716, before: 716, head: 172 },
  { name: '1000×480 (a laptop\'s window, its DevTools docked below)', w: 1000, h: 480, dpr: 1, desktop: true, kind: 'side', least: 428, before: 428, head: 85.4 },
  { name: '1280×800 (a laptop)', w: 1280, h: 800, dpr: 1, desktop: true, kind: 'desktop', least: 748, before: 748, head: 130 },
  { name: '1920×1080', w: 1920, h: 1080, dpr: 1, desktop: true, kind: 'desktop', least: 880, before: 800, head: 130 }, // (beside the column now, as up to 1180 px tall: the column's header, as 1280×800's)
];
// More screens for the one-screen checks: desktops as browsers have them
// (a 1080p screen's Chrome with a bookmarks bar and without, at 125% and
// 150%, and zoomed to 110% and 90%; laptops; a 1200p screen's Chrome; a
// 1680×1050 screen; a 1440p one, too tall for the column beside the board;
// a half-screen window), each in every state.
const DESKTOPS = [
  { name: '1920×945 (a 1080p screen\'s Chrome, its bookmarks bar showing)', w: 1920, h: 945, dpr: 1, desktop: true, least: 880 },
  { name: '1920×969 (a 1080p screen\'s Chrome)', w: 1920, h: 969, dpr: 1, desktop: true, least: 880 },
  { name: '1536×730 (the same at 125%, its bookmarks bar showing)', w: 1536, h: 730, dpr: 1.25, desktop: true, least: 678 },
  { name: '1280×609 (the same at 150%)', w: 1280, h: 609, dpr: 1.5, desktop: true, least: 557 },
  { name: '1745×859 (1920×945 zoomed to 110%)', w: 1745, h: 859, dpr: 1.1, desktop: true, least: 807 },
  { name: '2133×1050 (1920×945 zoomed to 90%)', w: 2133, h: 1050, dpr: 0.9, desktop: true, least: 880 },
  { name: '1366×657 (a laptop\'s Chrome)', w: 1366, h: 657, dpr: 1, desktop: true, least: 605 },
  { name: '1920×1065 (a 1200p screen\'s Chrome)', w: 1920, h: 1065, dpr: 1, desktop: true, least: 880 },
  { name: '1680×1050', w: 1680, h: 1050, dpr: 1, desktop: true, least: 880 },
  { name: '2560×1305 (a 1440p screen\'s Chrome: over the board)', w: 2560, h: 1305, dpr: 1, desktop: true, least: 880 },
  { name: '960×945 (half a 1080p screen: over the board)', w: 960, h: 945, dpr: 1, desktop: true, least: 665 },
];

// Over the board, not a phone: near-square and narrow windows, touch
// screens held upright (a Surface Duo, iPads), each with main's board
// before the page was one screen tall (2ba41f9, measured once and pinned;
// the board took the window's height less 260 px). The board is never
// smaller (the owner's call: the board first, the chatter and the help give
// way), and still nothing scrolls in any state. (On the one-screen work's
// first build the board here took room for the chatter's two lines: 800×800
// 520 → 452, the Surface Duo 440 → 348.)
const STACKED = [
  { name: '800×800 (a near-square window)', w: 800, h: 800, dpr: 1, desktop: true, main: 520 },
  { name: '800×800 with touch', w: 800, h: 800, dpr: 2, main: 520 },
  { name: '1000×860 (a window)', w: 1000, h: 860, dpr: 1, desktop: true, main: 580 },
  { name: '720×860 (a window)', w: 720, h: 860, dpr: 1, desktop: true, main: 580 },
  { name: '460×612 (a narrow window)', w: 460, h: 612, dpr: 1, desktop: true, main: 332 },
  { name: '460×612 with touch', w: 460, h: 612, dpr: 2, main: 332 },
  { name: '540×720 (a Surface Duo)', w: 540, h: 720, dpr: 2.5, main: 440 },
  { name: '600×700 with touch', w: 600, h: 700, dpr: 2, main: 420 },
  { name: '600×900 (a narrow window)', w: 600, h: 900, dpr: 1, desktop: true, main: 556 },
  { name: '500×1000 (an iPad\'s Split View)', w: 500, h: 1000, dpr: 2, main: 456 },
  { name: '744×1133 (an iPad mini)', w: 744, h: 1133, dpr: 2, main: 700 },
  { name: '820×1106 (an iPad in Safari)', w: 820, h: 1106, dpr: 2, main: 776 },
];
// main's boards (2ba41f9, pinned) at the sizes the sweeps below go through:
// held upright, every 10 px of height from 440 to 940 at seven widths (touch,
// the screen resized under the page); and over the board, windows 460 to
// 1040 px wide, every 80 px of height from 560 to 1120 narrower than 5:4
// (main's were the same with a mouse and with touch).
const MAIN_UP = {
  320: [260, 270, 280, 286, 286, 286, 295, 305, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312],
  360: [256.8, 266.8, 276.8, 286.8, 296.8, 306.8, 316.8, 326, 326, 326, 331.8, 341.8, 351.8, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352, 352],
  375: [252.8, 262.8, 272.8, 282.8, 292.8, 302.8, 312.8, 322.8, 332.8, 341, 341, 341, 347.8, 357.8, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367, 367],
  390: [252.8, 262.8, 272.8, 282.8, 292.8, 302.8, 312.8, 322.8, 332.8, 342.8, 352.8, 356, 356, 357.8, 367.8, 377.8, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382, 382],
  412: [252.8, 262.8, 272.8, 282.8, 292.8, 302.8, 312.8, 322.8, 332.8, 342.8, 352.8, 362.8, 372.8, 378, 378, 378, 387.8, 397.8, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 404],
  414: [252.8, 262.8, 272.8, 282.8, 292.8, 302.8, 312.8, 322.8, 332.8, 342.8, 352.8, 362.8, 372.8, 380, 380, 380, 387.8, 397.8, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406],
  430: [252.8, 262.8, 272.8, 282.8, 292.8, 302.8, 312.8, 322.8, 332.8, 342.8, 352.8, 362.8, 372.8, 382.8, 392.8, 396, 396, 397.8, 407.8, 417.8, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422, 422],
};
const MAIN_OVER = {'460x560': 280, '460x640': 360, '460x720': 416, '460x800': 416, '460x880': 416, '460x960': 416, '460x1040': 416, '460x1120': 416, '600x560': 280, '600x640': 360, '600x720': 440, '600x800': 520, '600x880': 556, '600x960': 556, '600x1040': 556, '600x1120': 556, '760x640': 360, '760x720': 440, '760x800': 520, '760x880': 600, '760x960': 680, '760x1040': 716, '760x1120': 716, '900x800': 520, '900x880': 600, '900x960': 680, '900x1040': 760, '900x1120': 840, '1040x880': 600, '1040x960': 680, '1040x1040': 760, '1040x1120': 840};

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

// Whether the help, shown, fits the row under the board: an item squeezed
// past its box (the speed buttons and the switch beside it), or its lines
// making the row taller than it is and taking it off the screen. Where it
// doesn't, it gives way (snake.js fitColumn).
const HELP_FITS = `(() => { const h = document.getElementById('help'), f = document.querySelector('.foot'); if (!h.getClientRects().length) return { squeezed: false, pushes: false };
  return { squeezed: h.scrollWidth > h.clientWidth + 1, pushes: h.getBoundingClientRect().height > parseFloat(getComputedStyle(f).minHeight) + 0.5 && f.getBoundingClientRect().bottom + scrollY > innerHeight + 0.5 }; })()`;

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
    header: box(q('header')), tags: box(q('#scoreboard')), speed: box(q('#speed')), foot: box(q('.foot')), chatter: box(q('.chatter')), chatlog: box(q('#chatlog')), help: box(q('#help')),
    helpShown: getComputedStyle(q('#help')).visibility !== 'hidden', decor,
    hanging: decor.filter(f => /moss bottom|leaves b/.test(f.what) && board && f.b > board.b),
  };
})()`;

// A banner, put up as the round would (with these words; or the one up now,
// show false), and where it is (DESIGN "Teaching by showing"): above the
// board or on it; over the board, your own name tag or the pause button;
// its middle against the board's, in boards from its top; inside the
// screen's safe top; its lines, and whether its words are whole. (Its
// settling in finished first: it drops 6 px as it comes.)
const BANNERS = [ // (the widest a phone shows: a lesson with no shorter words, round news in its phone words, Go!)
  ['On fire: 3 bites of tail, and at 3 it ends you. Rain helps.', '', 'lesson'],
  ['Rat-a-tat. The woodpecker has come for the log, a patch at a time.', 'bird', 'round'],
  ['First out: Capricious got cut in two by Metagamer.', 'kill', 'round', { phone: 'First out: Capricious was cut by Metagamer.' }],
  ['Let the wriggling begin.', 'go', 'round'],
];
const BANNER = ([text, kind, level, opts] = [], show = true) => `(() => {
  const t = document.getElementById('toast');
  if (${show}) SnakeDebug.banner(${JSON.stringify(text)}, ${JSON.stringify(kind)}, ${JSON.stringify(level)}, ${JSON.stringify(opts || {})});
  if (t.hidden) return null;
  for (const a of t.getAnimations()) a.finish();
  const box = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom }; };
  const hit = (a, c) => a.x < c.r - 0.5 && c.x < a.r - 0.5 && a.y < c.b - 0.5 && c.y < a.b - 0.5;
  const me = SnakeDebug.game().snakes.find(s => s.isPlayer), cs = getComputedStyle(t);
  const tb = box(t), board = box(document.getElementById('game')), tag = me?.tag?.li ? box(me.tag.li) : null, pause = box(document.getElementById('pause'));
  return { text: t.textContent, above: t.classList.contains('above'), box: tb, onBoard: hit(tb, board), onTag: !!tag && hit(tb, tag), onPause: hit(tb, pause),
    mid: ((tb.y + tb.b) / 2 - board.y) / (board.b - board.y), safeTop: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-t')) || 0, vw: innerWidth,
    lines: t.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) > parseFloat(cs.fontSize) * 1.4 ? 2 : 1, whole: t.scrollWidth <= t.clientWidth + 1 };
})()`;
// What's wrong with a banner's place, held upright or not (an empty list: nothing).
const bannerWrong = (p, upright) => !p ? ['not shown'] : upright
  ? [!p.above && 'on the board, not above it', p.onBoard && 'over the board', p.onTag && 'over your tag', p.onPause && 'over the pause button', p.box.y < p.safeTop - 0.5 && 'over the screen\'s safe top',
    (p.box.x < -0.5 || p.box.r > p.vw + 0.5) && 'off the screen\'s side', p.lines > 1 && 'two lines', !p.whole && 'its words cut'].filter(Boolean)
  : [p.above && 'above the board', p.mid > 0.25 && p.mid < 0.75 && `in the board's middle (${p.mid.toFixed(2)})`].filter(Boolean);

// Whether each element takes a tap where it is (the topmost thing at its
// middle is it, or inside it), and is on the screen.
const REACH = sels => `(() => [...document.querySelectorAll(${JSON.stringify(sels)})].filter(el => !el.hidden && el.getBoundingClientRect().width).map(el => {
  const b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
  const top = document.elementFromPoint(x, y);
  return { what: el.id || el.textContent.trim().slice(0, 18) || el.className, on: b.left >= -0.5 && b.right <= innerWidth + 0.5 && b.top >= -0.5 && b.bottom <= innerHeight + 0.5, taps: !!top && (top === el || el.contains(top)) };
}))()`;

// The woodpecker for a spot (cells), drawn on the held board: perched,
// resting (pose false: its head turned as far up and down as it looks
// round, and level) or eyeing its chunk (true: its head turned and tilted
// to it, crouched as it's about to take off). Then its own layer's pixels
// read back: where it is (CSS px), how many of them lie over the board's
// cells and over each of the page's furniture (rects, CSS px), and the
// edges of the screen it's cut off at (its solid pixels on the screen's
// outermost rows or columns, which run on past it; or on its layer's, where
// that ends inside the screen: cut off by its layer). Its layer is the board
// and the room round it, placed with CSS, not the screen.
const PERCH = (x, y, pose, rects = {}) => `(() => {
  const g = SnakeDebug.game(), R = SnakeRender, E = SnakeEngine, cell = ${y * 24 + x};
  g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000);
  g.woodpecker = null; SnakeDebug.draw(); // (gone a moment, so it's placed afresh rather than flying over)
  const aim = ${pose !== false}, ms = E.tickMs(g);
  let now = performance.now();
  g.woodpecker = { x: ${x}, y: ${y}, at: g.time, target: aim ? [cell] : [], strikeAt: aim ? g.tick + 17 : -1, last: aim ? [cell] : [], struckAt: aim ? g.tick - 60 : -1, restUntil: aim ? g.tick : g.tick + 1e6, pecks: aim ? 1 : 0 };
  R.frame(0.5, now += 16);
  const L = document.getElementById('bird-layer');
  if (!L || L.style.display === 'none') return null;
  const read = () => {
    const lb = L.getBoundingClientRect(), sx = L.width / lb.width, sy = L.height / lb.height, W = L.width, H = L.height;
    const data = L.getContext('2d').getImageData(0, 0, W, H).data;
    const b = document.getElementById('game').getBoundingClientRect();
    const bx0 = Math.floor((b.left - lb.left) * sx), bx1 = Math.ceil((b.right - lb.left) * sx), by0 = Math.floor((b.top - lb.top) * sy), by1 = Math.ceil((b.bottom - lb.top) * sy);
    const Rs = Object.entries(${JSON.stringify(rects)}).map(([k, f]) => [k, Math.floor((f.x - lb.left) * sx), Math.ceil((f.r - lb.left) * sx), Math.floor((f.y - lb.top) * sy), Math.ceil((f.b - lb.top) * sy)]), on = {};
    const el = Math.max(0, Math.floor(-lb.left * sx)), er = Math.min(W - 1, Math.ceil((innerWidth - lb.left) * sx) - 1), et = Math.max(0, Math.floor(-lb.top * sy)), eb = Math.min(H - 1, Math.ceil((innerHeight - lb.top) * sy) - 1); // (the screen's edges, or its layer's inside them)
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, over = 0, cl = false, cr = false, ct = false, cb = false;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const a = data[(j * W + i) * 4 + 3];
      if (a < 24) continue; // (not its faint shadow's edge)
      if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j;
      if (i >= bx0 && i < bx1 && j >= by0 && j < by1) over++;
      for (const [k, l, r, t, bt] of Rs) if (i >= l && i < r && j >= t && j < bt) on[k] = (on[k] || 0) + 1;
      if (a >= 200) { cl ||= i <= el; cr ||= i >= er; ct ||= j <= et; cb ||= j >= eb; } // (not the soft edge of a line ending a hair inside the screen)
    }
    if (x1 < 0) return null;
    return { over, on, cut: [cl && 'left', ct && 'top', cr && 'right', cb && 'bottom'].filter(Boolean), x: lb.left + x0 / sx, y: lb.top + y0 / sy, r: lb.left + (x1 + 1) / sx, b: lb.top + (y1 + 1) / sy };
  };
  const all = [];
  if (aim) { // (its head turned and tilted to its chunk, crouched to take off)
    const depart = R.birdPlan().depart + 2, K = Math.ceil(depart / ms);
    g.woodpecker.strikeAt = g.tick - 1 + K;
    for (let i = 0; i < 12; i++) R.frame(K - depart / ms, now += 16);
    all.push(read());
  } else {
    for (const turn of [-1.2, 1.2, 0]) { R.birdLook(turn); for (let i = 0; i < 3; i++) R.frame(0.5, now += 16); all.push(read()); }
    R.birdLook(null);
  }
  if (all.some(q => !q)) return null;
  const on = {};
  for (const q of all) for (const k in q.on) on[k] = Math.max(on[k] || 0, q.on[k]);
  const p = { over: Math.max(...all.map(q => q.over)), on, cut: [...new Set(all.flatMap(q => q.cut))], x: Math.min(...all.map(q => q.x)), y: Math.min(...all.map(q => q.y)), r: Math.max(...all.map(q => q.r)), b: Math.max(...all.map(q => q.b)) };
  p.h = p.b - p.y;
  return p;
})()`;
const SPOTS = [[1, 1], [12, 1], [22, 1], [1, 12], [12, 12], [22, 12], [1, 22], [6, 22], [12, 22], [17, 22], [22, 22]];

// The woodpecker working a spot, from (another spot it rested at before,
// the same by default) through its whole aim and its rest after: the hop
// to its perch, the flight out, landing, drumming, lingering at the hole,
// the flight home and settling, drawn every 10 ms of its plan (a wingbeat
// is 104 ms: each beat seen at ten moments, its bounds and dips too);
// then which edges of the screen it's cut off at, flying (to the spot and
// home) and drumming (its solid pixels on the screen's outermost rows or
// columns, or on its layer's where that ends inside the screen). A wing
// that reaches past the screen at one moment of the beat and not another
// is still caught.
const FLIGHT = (x, y, from = [x, y]) => `(() => {
  const g = SnakeDebug.game(), R = SnakeRender, E = SnakeEngine, cell = ${y * 24 + x}, prev = ${from[1] * 24 + from[0]};
  g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000);
  const L = document.getElementById('bird-layer'), G = L.getContext('2d'), ms = E.tickMs(g);
  const cut = { fly: new Set(), drum: new Set() };
  let now = performance.now();
  g.woodpecker = null; SnakeDebug.draw();
  g.woodpecker = { x: ${x}, y: ${y}, at: g.time, target: [cell], strikeAt: g.tick + 17, last: [prev], struckAt: g.tick - 60, restUntil: g.tick, pecks: 1 };
  R.frame(0.5, now += 16);
  const plan = R.birdPlan(), lb = L.getBoundingClientRect(), sx = L.width / lb.width, sy = L.height / lb.height, W = L.width, H = L.height;
  const el = Math.max(0, Math.floor(-lb.left * sx)), er = Math.min(W - 1, Math.ceil((innerWidth - lb.left) * sx) - 1), et = Math.max(0, Math.floor(-lb.top * sy)), eb = Math.min(H - 1, Math.ceil((innerHeight - lb.top) * sy) - 1);
  // (the four edges laid end to end in one row, read back once a frame: the top, the bottom, the left and the right)
  const S = document.createElement('canvas'); S.width = 2 * W + 2 * H; S.height = 1;
  const sg = S.getContext('2d', { willReadFrequently: true }); sg.imageSmoothingEnabled = false;
  const look = at => {
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, S.width, 1);
    sg.drawImage(L, 0, et, W, 1, 0, 0, W, 1); sg.drawImage(L, 0, eb, W, 1, W, 0, W, 1);
    sg.setTransform(0, 1, 1, 0, 2 * W, 0); sg.drawImage(L, el, 0, 1, H, 0, 0, 1, H);
    sg.setTransform(0, 1, 1, 0, 2 * W + H, 0); sg.drawImage(L, er, 0, 1, H, 0, 0, 1, H);
    const p = sg.getImageData(0, 0, S.width, 1).data;
    for (let i = 0; i < S.width; i++) if (p[i * 4 + 3] >= 200) at.add(i < W ? 'top' : i < 2 * W ? 'bottom' : i < 2 * W + H ? 'left' : 'right');
  };
  for (let m = prev === cell ? plan.depart + 10 : plan.aim; m >= 0; m -= 10) { // (m ms to the strike: its hop, if it has one, then off its perch)
    const K = Math.ceil(m / ms);
    g.woodpecker.strikeAt = g.tick - 1 + K;
    R.birdFrame(K - m / ms, now += 10); // (the bird alone: the board stays as it is)
    look(m > plan.drum ? cut.fly : cut.drum);
  }
  g.woodpecker = { x: ${x}, y: ${y}, at: g.time, target: [], strikeAt: -1, last: [cell], struckAt: -1, restUntil: -1, pecks: 2 };
  for (let m = 0; m <= 1200; m += 10) { // (m ms after it)
    const K = Math.floor(m / ms);
    g.woodpecker.struckAt = g.woodpecker.strikeAt = g.tick - 1 - K; g.woodpecker.restUntil = g.woodpecker.struckAt + TUNING.PECK_REST_MIN;
    R.birdFrame(m / ms - K, now += 10);
    if (m > R.birdHome() + 40) break;
    look(m < plan.linger ? cut.drum : cut.fly);
  }
  g.woodpecker = null; SnakeDebug.draw();
  return { fly: [...cut.fly], drum: [...cut.drum] };
})()`;
const FLIGHT_SPOTS = [[0, 12], [23, 12], [12, 23], [1, 22], [3, 22], [4, 22], [19, 22], [0, 0], [23, 0]];

// The chatter's log as it shows (snake.js fitChatter: an older line with no
// room for all of it isn't shown, and the newest, where it alone doesn't
// fit, is cut to the rows that do, its own box ending there), and the
// page's bottom: where its words end, how many lines show (and whether the
// newest is cut), how many rows of words are whole, and whether any row is
// sliced through by where its line or the page ends.
const LOG_ROWS = `(() => {
  const log = document.getElementById('chatlog'), lb = log.getBoundingClientRect();
  const page = Math.min(document.querySelector('main').getBoundingClientRect().bottom, innerHeight);
  const range = document.createRange();
  let whole = 0, sliced = 0, end = lb.top, lines = 0, parts = 0;
  for (const li of log.children) {
    const r = li.getBoundingClientRect();
    if (!r.height) continue; // (not shown)
    lines++;
    if (li.classList.contains('cut')) parts++;
    const stop = Math.min(page, r.bottom - parseFloat(getComputedStyle(li).paddingBottom)); // (a cut line ends at its own box: its rows past it are clamped away)
    range.selectNodeContents(li);
    for (const f of range.getClientRects()) if (f.height) { if (f.bottom <= stop + 0.5) { whole++; end = Math.max(end, f.bottom); } else if (f.top < stop - 0.5) sliced++; }
  }
  return { whole, sliced, end, top: lb.top, lines, parts };
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
  const col = matchMedia('(min-aspect-ratio: 5/4) and (max-height: 1180px) and (min-width: 480px)').matches;
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
const furnitureOf = l => Object.fromEntries(['header', 'tags', 'foot', 'chatter'].filter(k => l[k]).map(k => [k, l[k]]));
// Five lines from the rivals, the most the log keeps: long ones, two rows
// each on a phone. And the page's scroll, down and across.
const FILL = `(() => { const log = document.getElementById('chatlog'), g = SnakeDebug.game(), names = (g ? g.snakes.filter(s => !s.isPlayer).map(s => s.name) : []).concat(['Gobbler', 'Star', 'Mason']);
  log.textContent = '';
  ['Is it lunchtime? It feels like lunchtime.', 'Trespasser! Guards! …We are the guards.', 'A woodpecker! Someone fetch my musket. Politely.', 'Global warming? Total hoax. Look at all this snow!', 'Out of my way! I’m starving, and the bark is bare!']
    .forEach((t, i) => log.insertAdjacentHTML('afterbegin', '<li><strong>' + names[i % 3] + '</strong> <span>' + t + '</span></li>'));
  return 'ok'; })()`;
const SCROLL = `(() => { const se = document.scrollingElement; return { h: se.scrollHeight, w: se.scrollWidth, vh: innerHeight, vw: innerWidth }; })()`;
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

    // The chatter full (five long lines, two rows each on a phone), playing
    // or watching, anywhere: the page one screen tall; the chatter's lines
    // whole, inside its panel and its box, under the row under the board,
    // the newest at least (cut to its rows that fit only where it alone
    // doesn't), and no row sliced through; or, with no room for a row, no
    // panel, its switch still on the screen and taking a tap. On its side,
    // the column off the screen's top and bottom. Watching (but held
    // upright on a phone, where the speed buttons take the help's place),
    // the help gives the chatter its room only where the log couldn't show
    // a row beside it: the help made to show, the chatter shows none.
    // (Before the page was one screen tall, this ran only on its side, where
    // the column was the screen's height: the log was cut at its last whole
    // row, by a clip, at its box, the chatter's or the page's bottom.)
    const chatterFull = async (tag, watching, si = { bottom: 0 }, side = false, upright = false) => {
      const what = watching ? 'watching' : 'playing';
      await ev(`(() => { const log = document.getElementById('chatlog'); for (let i = 0; i < 5; i++) log.insertAdjacentHTML('afterbegin', '<li><strong>Gobbler</strong> <span>Out of my way! I’m starving, and the bark is bare!</span></li>'); return 'ok'; })()`);
      await b.sleep(60);
      await settle();
      const full = await ev(LAYOUT), rows = await ev(LOG_ROWS), fit = await ev(`document.querySelector('.chatter').dataset.fit`);
      check(full.scrollH <= full.vh && full.scrollW <= full.vw, `${tag}: ${what}, the chatter full, nothing scrolls: the page is one screen tall`, `${full.scrollW}×${full.scrollH} of ${full.vw}×${full.vh}; the chatter ${fit}, ${rows.lines} of 5 lines${rows.parts ? ' (the newest cut)' : ''}`);
      if (side) check(full.header.y >= 4 && full.chatter.b <= full.vh - Math.max(2, si.bottom), `${tag}: ${what}, the column keeps off the screen's top and bottom`, `header from ${r1(full.header.y)}, the chatter's box down to ${r1(full.chatter.b)} of ${full.vh}`);
      if (fit === 'none') {
        const reach = await ev(REACH('#chatter-toggle'));
        check(!full.chatlog && reach.length === 1 && reach[0].on && reach[0].taps, `${tag}: ${what}, with no room for a row, the chatter shows none, and its switch is on the screen and takes a tap`, `the chatter's box ${full.chatter ? r1(full.chatter.h) : 0} px`);
      } else {
        check(full.chatlog.b <= full.chatter.b + 0.5 && rows.end <= full.chatlog.b - 2.5 && full.foot.b <= full.chatter.y + 0.5, `${tag}: ${what}, a full chatter's lines end inside its panel, and the panel inside its box, under the row under the board`, `words down to ${r1(rows.end)}, the panel to ${r1(full.chatlog.b)}, its box to ${r1(full.chatter.b)}`);
        check(rows.whole >= 1 && !rows.sliced && rows.lines >= 1 && (rows.parts === 0 || rows.lines === 1), `${tag}: ${what}, a full chatter shows whole lines, the newest at least (cut to its rows only where it alone doesn't fit), and no row sliced through`, `${rows.lines} lines${rows.parts ? ', the newest cut' : ''}, ${rows.whole} rows whole, ${rows.sliced} sliced`);
      }
      if (!watching || upright) return;
      await ev(`(() => { const st = document.createElement('style'); st.id = 'help-made-to-show'; st.textContent = 'main #help { display: block !important; }'; document.head.append(st); return 'ok'; })()`);
      await settle();
      const shown = await ev(`document.querySelector('.chatter').dataset.fit`), crowded = await ev(HELP_FITS);
      await ev(`document.getElementById('help-made-to-show').remove(); 'ok'`);
      await settle();
      const gone = !full.help, room = shown !== 'none';
      check(gone === (!room || crowded.squeezed || crowded.pushes), `${tag}: watching, the help gives the chatter its room only where, beside it, the log couldn't show a row of words (or where it doesn't fit its row)`, `the help ${gone ? 'gone' : 'shown'}; beside it, the chatter would show ${shown}${crowded.squeezed ? ', the help squeezed past its box' : ''}${crowded.pushes ? ', the help taking the row off the screen' : ''}`);
    };
    // One screen (DESIGN's "One screen"): in every state, the page is the
    // screen's height and width, never more: the start card, the countdown,
    // playing, playing with the chatter full, a nap, your death's card, the
    // round's card, the Hall of Fame and the Field guide open (over the page,
    // which must still fit behind them), and watching with the chatter full.
    // (Before, with the chatter full, the page ran 78 to 116 px past a 1080p
    // desktop's browser, 61 to 117 past a tablet held upright, and 25 to
    // 347 past a phone held upright.)
    const oneScreen = async (tag, d) => {
      const seen = [];
      const look = async state => { await settle(); seen.push({ state, ...(await ev(SCROLL)) }); };
      await open(d);
      await ev(HELPERS);
      await look('the start card');
      await ev(`document.getElementById('start').click(); 'ok'`);
      await b.sleep(120);
      await look('the countdown');
      await ev(`SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`);
      await b.sleep(100);
      await look('playing');
      await ev(FILL);
      await look('playing, the chatter full');
      await ev(`window.__autoRaf = true; document.getElementById('pause').click(); 'ok'`);
      await b.sleep(250);
      await look('a nap');
      await ev(`document.getElementById('pause').click(); __kill.push(0); 'ok'`);
      const died = await ev(`waitFor(() => cardUp() && SnakeDebug.state() !== 'paused', 15000).then(() => true, () => false)`);
      await b.sleep(700);
      await ev(FILL);
      await look('your death\'s card');
      await ev(`document.getElementById('watch').click(); __kill.push(1, 2); 'ok'`);
      const over = await ev(`waitFor(() => SnakeDebug.state() === 'over' && cardUp(), 15000).then(() => true, () => false)`);
      await b.sleep(700);
      await ev(FILL);
      await look('the round\'s card');
      await ev(`document.getElementById('records-open').click(); 'ok'`);
      await b.sleep(350);
      await look('the Hall of Fame open');
      await ev(`document.querySelector('#records .tab[data-tab="guide"]').click(); 'ok'`);
      await b.sleep(250);
      await look('the Field guide open');
      await ev(`document.getElementById('records-close').click(); 'ok'`);
      await open(d);
      await ev(`document.getElementById('watch').click(); SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`);
      await b.sleep(100);
      await ev(FILL);
      await look('watching, the chatter full');
      const board = await ev(`document.getElementById('game').getBoundingClientRect().width`);
      await ev(`window.__autoRaf = true; 'ok'`);
      check(died && over, `${tag}: a round played to your death and to its end`);
      for (const s of seen) check(s.h <= s.vh && s.w <= s.vw, `${tag}: ${s.state}, nothing scrolls`, `${s.w}×${s.h} of ${s.vw}×${s.vh}`);
      return board;
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
      if (d.main) check(ready.board.w >= d.main - 0.5, `${tag}: the board is no smaller than on main before the page was one screen tall, ${d.main} px (the owner's call: the help and the chatter give way instead)`, `${r1(ready.board.w)} px`);
      check(ready.scrollW <= ready.vw, `${tag}: nothing scrolls sideways`, `${ready.scrollW} of ${ready.vw}`);
      check(ready.scrollH <= ready.vh, `${tag}: nothing scrolls at all, the page one screen tall${side ? ', the column beside the board as tall as the screen' : ''}`, `${ready.scrollH} of ${ready.vh}`);
      if (upright && !d.short) check(ready.frame.x <= 0.5 && ready.frame.r >= ready.vw - 0.5 && ready.board.x <= 6 && ready.board.r >= ready.vw - 6, `${tag}: the board runs edge to edge, its frame a thin rim`, `frame ${r1(ready.frame.x)}-${r1(ready.frame.r)}, board ${r1(ready.board.x)}-${r1(ready.board.r)} of ${ready.vw}`);
      // (too short for edge to edge: as big as fits over the row under it,
      // which is on the screen too, or as leaves the bird 13 px beside it.
      // Before the page was one screen tall: as big as fits the height, the
      // row and the chatter below the fold)
      const toFoot = ready.foot.y - ready.frame.b;
      if (d.short) check(Math.abs(ready.frame.x + ready.frame.r - ready.vw) < 1 && ready.foot.b <= ready.vh + 0.5 && toFoot >= 1.5 && (toFoot <= 6.5 || Math.abs(ready.frame.x - 13) < 0.6), `${tag}: too short for edge to edge, the board is as big as fits over the row under it (or leaves the woodpecker its 13 px beside the frame), centred, the row under it on the screen`, `frame ${r1(ready.frame.x)}-${r1(ready.frame.r)}, down to ${r1(ready.frame.b)}; the row under it ${r1(ready.foot.y)}-${r1(ready.foot.b)} of ${ready.vh}`);
      if (upright) check(ready.board.b <= ready.vh - (d.insets ? d.insets.bottom : 0) + 0.5, `${tag}: the whole board is on the first screen`, `down to ${r1(ready.board.b)} of ${ready.vh}`);
      if (upright) check(['header', 'tags'].every(k => Math.abs(ready[k].x - 12) < 0.5 && Math.abs(ready.vw - ready[k].r - 12) < 0.5), `${tag}: the header and the tags keep 12 px from the screen's edges`, ['header', 'tags'].map(k => `${k} ${r1(ready[k].x)}-${r1(ready[k].r)}`).join(', '));
      if (side) check((ready.frame.h >= ready.vh - (d.insets ? d.insets.top + d.insets.bottom : 0) - 0.5 || Math.abs(ready.frame.r - ready.vw + Math.max(12, d.insets ? d.insets.right : 0)) < 0.6) && ready.board.h >= ready.frame.h - 12, `${tag}: the board takes the full height less a thin rim (or, on a narrow screen, the width the column leaves it)`, `frame ${r1(ready.frame.h)} to ${r1(ready.frame.r)}, board ${r1(ready.board.h)} of ${ready.vw}×${ready.vh}`);
      if (side) {
        const cutDecor = ready.decor.filter(f => f.y < -0.5 || f.b > ready.vh + 0.5 || f.x < -0.5 || f.r > ready.vw + 0.5);
        check(!cutDecor.length, `${tag}: on its side, none of the frame's moss and leaves is cut off by the screen's edge`, cutDecor.map(f => `${f.what} ${r1(f.x)},${r1(f.y)}-${r1(f.r)},${r1(f.b)}`).join('; ') || `${ready.decor.length} shown`);
        const ring = await ev(`(() => { const m = getComputedStyle(document.querySelector('main')), p = document.getElementById('pause').getBoundingClientRect(), mb = document.querySelector('main').getBoundingClientRect(); return m.overflowX === 'visible' || p.left - 5 >= mb.left; })()`);
        check(ring, `${tag}: the nap button's focus ring isn't clipped at the column's edge`);
      }
      // (the ledge: 34 px at least where the board's edge to edge (28 before
      // the page was one screen tall, 12 px over the speed buttons or the
      // chatter, 6 now over the row under the board: the bird's room is the
      // same); on a short phone the bird's in the gutter, and the ledge is
      // what the board leaves, or none)
      check(upright && !d.short ? ready.ledge && ready.ledge.h >= 33.5 && ready.ledge.y >= ready.frame.b - 0.5 : upright ? !ready.ledge || ready.ledge.y >= ready.frame.b - 0.5 : !ready.ledge, `${tag}: ${upright && !d.short ? 'a ledge under the board for the woodpecker' : upright ? 'no ledge to speak of (the woodpecker in the gutter beside the board)' : 'no ledge (room enough beside the board)'}`, ready.ledge ? `${r1(ready.ledge.h)} px` : 'none');
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
      // the name tags, the start card's buttons; and the chatter's switch,
      // in the row under the board, on the screen as it is (it used to be
      // scrolled to, held upright: the page ran past the screen).
      let reach = await ev(REACH('header .hud button, #scoreboard li, #overlay .buttons button'));
      check(reach.length >= 8 && reach.every(r => r.on && r.taps), `${tag}: the header's buttons, the name tags and the start card's buttons are on the screen and take a tap`, reach.filter(r => !r.on || !r.taps).map(r => r.what).join(', ') || `${reach.length} of them`);
      reach = await ev(REACH('#chatter-toggle'));
      check(reach.length === 1 && reach[0].on && reach[0].taps, `${tag}: the chatter's switch is on the screen and takes a tap, with nothing scrolled`);
      const sw = await ev(`(() => { const t = document.getElementById('chatter-toggle'); return { name: t.getAttribute('aria-labelledby') && document.getElementById(t.getAttribute('aria-labelledby')).textContent, tip: t.title, word: t.textContent.trim(), checked: t.getAttribute('aria-checked') }; })()`);
      check(sw.name === 'Bark chatter' && sw.tip === 'Bark chatter' && sw.word === 'On' && sw.checked === 'true', `${tag}: the chatter's switch, apart from the chatter's caption, is named "Bark chatter" in its tooltip and to a screen reader, and says On`, JSON.stringify(sw));
      check(ready.tags.x >= -0.5 && ready.tags.r <= ready.vw + 0.5 && (await ev(`[...document.querySelectorAll('#scoreboard li')].every(li => li.getBoundingClientRect().right <= document.getElementById('scoreboard').getBoundingClientRect().right + 0.5)`)), `${tag}: the name tags fit the width`);
      const boardHasCard = await ev(`(() => { const c = document.querySelector('#overlay .card').getBoundingClientRect(), g = document.getElementById('game').getBoundingClientRect(); return c.top >= g.top - 0.5 && c.bottom <= g.bottom + 0.5 && c.left >= g.left - 0.5 && c.right <= g.right + 0.5; })()`);
      check(boardHasCard, `${tag}: the start card fits on the board`);

      // ---------------------------------------------- a round, held still
      await toRound();
      const play = await ev(LAYOUT);
      check(await ev('SnakeDebug.state()') === 'running', `${tag}: a round gets going`);
      check(play.scrollW <= play.vw && play.scrollH <= play.vh, `${tag}: playing, nothing scrolls`, `${play.scrollW}×${play.scrollH} of ${play.vw}×${play.vh}`);
      reach = await ev(REACH('#chatter-toggle'));
      check(reach.length === 1 && reach[0].on && reach[0].taps, `${tag}: playing, the chatter's switch is on the screen and takes a tap`);
      check(!play.help || (play.help.b <= play.vh + 0.5 && play.help.r <= play.vw + 0.5 && play.help.y >= play.foot.y - 0.5 && play.help.b <= play.foot.b + 0.5), `${tag}: playing, the help line is on the screen, in the row under the board`, play.help ? `${r1(play.help.y)}-${r1(play.help.b)}, the row ${r1(play.foot.y)}-${r1(play.foot.b)} of ${play.vh}` : 'not shown');
      check(await ev(`(() => { const h = document.getElementById('help'); return h.scrollWidth <= h.clientWidth + 1; })()`), `${tag}: the help line isn't cut off at the side`);
      if (upright) {
        // (the page can't scroll while you play: a help line cut in half by the screen's edge is hidden)
        const whole = play.help.b <= play.vh + 0.5, gone = play.help.y >= play.vh - 0.5 || !play.helpShown;
        const lesson = await ev(`document.getElementById('toast').textContent`);
        check((whole || gone) && (whole || lesson === 'Tap jumps. Swipe ahead flashes.'), `${tag}: playing, the help under the board is wholly on the screen, or not shown and the first Go says how to jump and flash`,
          `${r1(play.help.y)}-${r1(play.help.b)} of ${play.vh}${play.helpShown ? '' : ', hidden'}; Go said "${lesson}"`);
      }

      // A banner while you play (DESIGN "Teaching by showing"): held upright,
      // one line over the header's title row, its words whole, never over the
      // board, your own tag or the pause button, inside the safe area;
      // elsewhere at the board's top or foot, never its middle.
      {
        const shown = [];
        for (const bn of BANNERS) shown.push({ text: bn[0], p: await ev(BANNER(bn)) });
        const wrong = shown.map(x => ({ ...x, why: bannerWrong(x.p, upright) })).filter(x => x.why.length);
        check(!wrong.length, upright ? `${tag}: playing, a banner is one line over the header's title row, its words whole, never over the board, your tag or the pause button` : `${tag}: playing, a banner is at the board's top or foot, never its middle`,
          wrong.map(x => `“${x.text}”: ${x.why.join(', ')}`).join('; ') || shown.map(x => `${x.p.above ? 'above' : x.p.mid < 0.5 ? 'top' : 'foot'} ${r1(x.p.box.y)}-${r1(x.p.box.b)}`).join(', '));
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

      // Flying out to a spot at the board's edges and corners (from its own
      // perch, and from the far corner's), drumming it, lingering and flying
      // home, through its whole wingbeat: never cut off by the screen's edge
      // (nor by its own layer). To drum at the screen's edge it leans, turns
      // round or lies level, beak down (the bottom rows, with the board's
      // bottom at the screen's), and flying near the edge it keeps in from
      // it, a wing beating short of it.
      {
        const flights = [];
        for (const [x, y] of FLIGHT_SPOTS) for (const from of [[x, y], [23 - x, 23 - y]]) flights.push({ x, y, from, f: await ev(FLIGHT(x, y, from)) });
        const cuts = f => [...f.f.fly.map(e => ({ what: 'flying', e })), ...f.f.drum.map(e => ({ what: 'drumming', e }))];
        const say = (f, list) => `${f.x},${f.y} from ${f.from} ${[...new Set(list.map(c => c.what))].map(w => `${w} (${list.filter(c => c.what === w).map(c => c.e).join(', ')})`).join(', ')}`;
        const cutOff = flights.filter(f => cuts(f).length);
        check(!cutOff.length, `${tag}: flying out to a spot at the board's edges and corners, drumming it and flying home, through the whole wingbeat, it isn't cut off by the screen's edge`, cutOff.map(f => `cut off: ${say(f, cuts(f))}`).join('; ') || `${flights.length} flights`);
      }

      await chatterFull(tag, false, d.insets, side, upright);

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
      check(watch.scrollW <= watch.vw && watch.scrollH <= watch.vh, `${tag}: watching (the speed buttons showing), nothing scrolls`, `${watch.scrollW}×${watch.scrollH} of ${watch.vw}×${watch.vh}`);
      reach = await ev(REACH('#speed button'));
      check(reach.length === 3 && reach.every(r => r.on && r.taps) && watch.speed.y >= watch.foot.y - 0.5 && watch.speed.b <= watch.foot.b + 0.5, `${tag}: watching, the speed buttons are there, in the row under the board, on the screen, and take a tap`);
      const wp = [];
      for (const [x, y] of [[1, 22], [12, 22], [22, 22], [22, 1]]) wp.push(await ev(PERCH(x, y, true, furnitureOf(watch))));
      check(wp.every(p => p && p.over <= (gutter ? 4 : 0) && !Object.keys(p.on).length && !outside(p).length), `${tag}: watching, the perched woodpecker covers no cell, keeps off the speed buttons and the rest, and is all on the screen`, wp.map(p => (p ? `${p.over} px over cells${Object.keys(p.on).map(k => `, ${p.on[k]} over the ${k}`).join('')}${outside(p).length ? `, ${outside(p).join(', ')}` : ''}` : 'none')).join('; '));
      await chatterFull(tag, true, d.insets, side, upright);
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
    // furniture; the page, the chatter full, is one screen tall; and the
    // board is wholly on the screen and bigger than before (6d478ed: the
    // page 24 px narrower than the screen or 190 px shorter, less a 10 px rim
    // each side), or as big as fits the height where that ran off the screen.
    const between = [];
    const atSize = async (w, h, dpr, fresh) => {
      if (fresh) { await open({ w, h, dpr }); await toRound(); await ev(FILL); }
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
      if (l.scrollH > l.vh || l.scrollW > l.vw) bad.push(`${w}×${h}: the page scrolls, ${l.scrollW}×${l.scrollH} (the chatter full)`);
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
      check(!bad.length, `${w} px wide, upright, ${Math.min(...at.map(s => s.h))} to ${Math.max(...at.map(s => s.h))} px tall: perched, the woodpecker covers no cell (a beak's tip at most), is 24 px tall or more, all on the screen and off the page's furniture, the page one screen tall with the chatter full, and the board is bigger than before (or as big as fits the height)`,
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

    // ------------------------------------------ one screen, in every state
    // On every screen above, and on desktops as browsers have them, the
    // page never scrolls, in any of ten states (oneScreen); and on the
    // desktops, the board is as big as said (880 px beside the column on a
    // 1080p screen's Chrome, 665 before, with or without its bookmarks bar,
    // and on a 1200p screen's; side by side up to 1180 px tall, so a 1440p
    // screen's Chrome, 1305 px, has it over the board, as does a half
    // screen's window, narrower than 5:4).
    const oneBoards = [];
    for (const d of [...DEVICES, ...DESKTOPS, ...STACKED]) {
      if (only && !d.name.includes(only)) continue;
      const w = await oneScreen(d.name, d);
      if (DESKTOPS.includes(d)) {
        oneBoards.push(`  ${d.name.padEnd(64)} ${r1(w)}`);
        check(w >= d.least - 0.5, `${d.name}: the board is at least ${d.least} px`, `${r1(w)} px`);
      }
      if (STACKED.includes(d)) {
        oneBoards.push(`  ${d.name.padEnd(64)} ${r1(w)} (main ${d.main})`);
        check(w >= d.main - 0.5, `${d.name}: over the board, the board is no smaller than on main before the page was one screen tall, ${d.main} px`, `${r1(w)} px`);
      }
    }
    const side1080 = DESKTOPS.filter(d => !/^2560|^960/.test(d.name) && (!only || d.name.includes(only)));
    for (const d of side1080) {
      await open(d);
      const l = await ev(LAYOUT);
      check(l.frame.x >= l.header.r && l.frame.x >= l.chatter.r && Math.abs(l.chatter.b - l.frame.b) < 1, `${d.name}: the header, the tags, the row under the board and the chatter in a column beside the board, as tall as it`, `the column ${r1(l.header.x)}-${r1(l.header.r)} down to ${r1(l.chatter.b)}, the frame ${r1(l.frame.x)}-${r1(l.frame.r)} down to ${r1(l.frame.b)}`);
    }
    for (const d of DESKTOPS.filter(x => /^2560|^960/.test(x.name) && (!only || x.name.includes(only)))) {
      await open(d);
      const l = await ev(LAYOUT);
      check(l.frame.y >= l.tags.b && l.foot.y >= l.frame.b && l.chatter.y >= l.foot.b - 0.5, `${d.name}: over the board, the header and tags above it, the row under the board and the chatter under it`, `the frame ${r1(l.frame.y)}-${r1(l.frame.b)}, the row ${r1(l.foot.y)}-${r1(l.foot.b)}, the chatter from ${r1(l.chatter.y)}`);
    }

    // ---------------------------------- over the board, the board first
    // Near-square and narrow windows and touch screens held upright, the
    // header over the board (STACKED): playing and watching with the
    // chatter full, the board as big as on main (pinned), nothing scrolls,
    // the chatter's lines whole or none (its switch there), the help in the
    // row under the board and never squeezed past its box or the screen's
    // edge (watching on a touch screen it ran under the switch and off the
    // screen, and a narrow window's keys took four to six lines, scrolling
    // the page: now it gives way), and the speed buttons in the row, taking
    // a tap.
    for (const d of STACKED) {
      if (only && !d.name.includes(only)) continue;
      const tag = d.name;
      await open(d);
      await toRound();
      const play = await ev(LAYOUT);
      check(play.board.w >= d.main - 0.5, `${tag}: playing, the board is no smaller than on main, ${d.main} px`, `${r1(play.board.w)} px`);
      check(!play.help || (play.help.y >= play.foot.y - 0.5 && play.help.b <= Math.min(play.foot.b, play.vh) + 0.5 && play.help.r <= play.vw + 0.5), `${tag}: playing, the help is in the row under the board and on the screen, or gives way`, play.help ? `${r1(play.help.y)}-${r1(play.help.b)}, the row ${r1(play.foot.y)}-${r1(play.foot.b)} of ${play.vh}` : 'given way');
      check(await ev(`(() => { const h = document.getElementById('help'); return h.scrollWidth <= h.clientWidth + 1; })()`), `${tag}: playing, the help line isn't cut off at the side`);
      await chatterFull(tag, false);
      await ev(`window.__autoRaf = true; 'ok'`);
      await open(d);
      await toRound('watch');
      const watch = await ev(LAYOUT);
      const reach = await ev(REACH('#speed button, #chatter-toggle'));
      check(reach.length === 4 && reach.every(r => r.on && r.taps) && watch.speed.y >= watch.foot.y - 0.5 && watch.speed.b <= watch.foot.b + 0.5, `${tag}: watching, the speed buttons and the chatter's switch are in the row under the board, on the screen, and take a tap`, reach.filter(r => !r.on || !r.taps).map(r => r.what).join(', ') || 'all four');
      const squeezed = await ev(`(() => { const h = document.getElementById('help'); return !!h.getClientRects().length && (h.scrollWidth > h.clientWidth + 1 || h.getBoundingClientRect().right > innerWidth + 0.5); })()`);
      check(!squeezed && watch.scrollW <= watch.vw, `${tag}: watching, the help isn't squeezed past its box or the screen's edge (it gives way), and nothing scrolls sideways`, `${watch.scrollW} of ${watch.vw}${watch.help ? `, the help ${r1(watch.help.x)}-${r1(watch.help.r)}` : ', the help given way'}`);
      await chatterFull(tag, true);
      await ev(`window.__autoRaf = true; 'ok'`);
    }

    // ------------------------------------- held upright, every 10 px of height
    // Phones held upright from 320 to 430 px wide, every 10 px of height
    // from 440 to 940, the screen resized under the page: the start card,
    // playing with the chatter full, and watching with it full. The page is
    // one screen tall at every one (it used to scroll on every phone with
    // its browser's bars showing, even at the start card), and the board is
    // never smaller than on main before the page was one screen tall
    // (MAIN_UP, pinned: the owner's call, the board first; the help and the
    // chatter give way, to a strip or none, its lines in bubbles).
    const BOARD_W = `document.getElementById('game').getBoundingClientRect().width`;
    for (const w of [320, 360, 375, 390, 412, 414, 430]) {
      if (only && !String(w).includes(only)) continue;
      const bad = { 'the start card': [], 'playing, the chatter full': [], 'watching, the chatter full': [] }, small = [], bannerBad = [];
      const sweep = async state => {
        for (let h = 440; h <= 940; h += 10) {
          await b.viewport(w, h, { scale: 3, mobile: true });
          await settle();
          const s = await ev(SCROLL), bw = await ev(BOARD_W), want = MAIN_UP[w][(h - 440) / 10];
          if (s.h > s.vh || s.w > s.vw) bad[state].push(`${h} (${s.w}×${s.h})`);
          if (bw < want - 0.5) small.push(`${h} ${state}: ${r1(bw)} (main ${want})`);
          if (state.startsWith('playing')) { // (a banner: the one up as the screen changed, and one put up now)
            const moved = await ev(BANNER(undefined, false)), fresh = await ev(BANNER(BANNERS[(h / 10) % BANNERS.length]));
            for (const [what, p] of [['as the screen changed', moved], ['put up', fresh]]) if (p && bannerWrong(p, true).length) bannerBad.push(`${h} ${what}: “${p.text}” ${bannerWrong(p, true).join(', ')}`);
          }
        }
      };
      await open({ w, h: 440, dpr: 3 });
      await sweep('the start card');
      await toRound();
      await ev(FILL);
      await sweep('playing, the chatter full');
      await ev(`window.__autoRaf = true; 'ok'`);
      await open({ w, h: 440, dpr: 3 });
      await toRound('watch');
      await ev(FILL);
      await sweep('watching, the chatter full');
      await ev(`window.__autoRaf = true; 'ok'`);
      for (const [state, list] of Object.entries(bad)) check(!list.length, `${w} px wide, upright, 440 to 940 px tall, every 10: ${state}, nothing scrolls`, list.length ? `scrolls at ${list.join(', ')}` : '51 heights');
      check(!small.length, `${w} px wide, upright, 440 to 940 px tall, every 10: the board is never smaller than on main before the page was one screen tall`, small.join('; ') || `${MAIN_UP[w][0]} to ${Math.max(...MAIN_UP[w])} px on main, each height`);
      check(!bannerBad.length, `${w} px wide, upright, 440 to 940 px tall, every 10: playing, a banner is one line over the header's title row, its words whole, never over the board, your tag or the pause button, put up there and as the screen changes`, bannerBad.join('; ') || '51 heights');
    }

    // ------------------------------- over the board, every 80 px of height
    // Windows over the board, narrower than 5:4, 460 to 1040 px wide, every
    // 80 px of height from 560 to 1120, with a mouse and with touch, the
    // window resized under the page: the board is never smaller than on main
    // before the page was one screen tall (MAIN_OVER, pinned: the window's
    // height less 260 px; the one-screen work's first build took up to 92 px
    // off it here, for the chatter's two lines), and nothing scrolls, down or
    // sideways, at the start card, or playing or watching with the chatter
    // full (the chatter and the help give way: to a strip or none, and where
    // the help doesn't fit its row).
    for (const touch of [false, true]) {
      for (const w of [460, 600, 760, 900, 1040]) {
        const tag = `${w} px wide${touch ? ' with touch' : ''}, over the board`;
        if (only && !tag.includes(only)) continue;
        const hs = Object.keys(MAIN_OVER).filter(k => k.startsWith(`${w}x`)).map(k => Number(k.split('x')[1]));
        const bad = { 'the start card': [], 'playing, the chatter full': [], 'watching, the chatter full': [] }, small = [];
        const sweep = async state => {
          for (const h of hs) {
            await b.viewport(w, h, { scale: touch ? 2 : 1, mobile: touch });
            await settle();
            const s = await ev(SCROLL), bw = await ev(BOARD_W), want = MAIN_OVER[`${w}x${h}`];
            if (s.h > s.vh || s.w > s.vw) bad[state].push(`${h} (${s.w}×${s.h})`);
            if (bw < want - 0.5) small.push(`${h} ${state}: ${r1(bw)} (main ${want})`);
          }
        };
        const d = { w, h: hs[0], dpr: touch ? 2 : 1, desktop: !touch };
        await open(d);
        await sweep('the start card');
        await toRound();
        await ev(FILL);
        await sweep('playing, the chatter full');
        await ev(`window.__autoRaf = true; 'ok'`);
        await open(d);
        await toRound('watch');
        await ev(FILL);
        await sweep('watching, the chatter full');
        await ev(`window.__autoRaf = true; 'ok'`);
        for (const [state, list] of Object.entries(bad)) check(!list.length, `${tag}, ${hs[0]} to ${hs[hs.length - 1]} px tall, every 80: ${state}, nothing scrolls`, list.length ? `scrolls at ${list.join(', ')}` : `${hs.length} heights`);
        check(!small.length, `${tag}, ${hs[0]} to ${hs[hs.length - 1]} px tall, every 80: the board is never smaller than on main before the page was one screen tall`, small.join('; ') || hs.map(h => `${h}: ${MAIN_OVER[`${w}x${h}`]}`).join(', '));
      }
    }

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
      await chatterFull(name, true, insets, true);
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
    if (oneBoards.length) console.log(`\non desktops as browsers have them, the board (CSS px):\n${oneBoards.join('\n')}`);
    console.log('\nthe woodpecker perched, CSS px tall:');
    for (const d of DEVICES) if (d.bird) console.log(`  ${d.name.padEnd(48)} ${d.bird}`);
    if (between.length) {
      console.log('\nheld upright, heights in between (CSS px): the board (before) and the woodpecker perched, its smallest');
      for (const s of between) console.log(`  ${`${s.w}×${s.h}`.padEnd(10)} ${r1(s.board)} (${s.before}), ${r1(s.bird)}`);
    }
    if (b.errors.length) { console.log('page errors:', b.errors); failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log('\nall passed');
})().catch(e => { console.error(e); process.exit(1); });
