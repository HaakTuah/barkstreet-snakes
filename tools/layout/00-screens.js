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
