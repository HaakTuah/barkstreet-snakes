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
//   the page's furniture; upright on a phone it stands under the board,
//   over the row under it and the chatter (taps passing through to them),
//   at least 48 px tall where the screen's foot allows ("The phone gap":
//   on a ledge of its own before, between the board and the row), and on its side
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
// The checks are in tools/layout/, one file per area, run in name order as the body of this one
// (tools/parts.js): 00 the screens, 01 the page's probes, 02 the helpers, 03 every device, 04 upright
// heights in between, 05 Score and Best growing, 06 one screen in every state, 07 over the board,
// 08-09 every 10 and 80 px of height, 10 the chatter streaming and the header on more screens, 11 on
// its side and old browsers, 12 the cards, full screen, the screen awake and swipes, 13 the phone's
// bottom, 14 the bigger woodpecker, 99 what it measured. A new check goes in its area's file, or a new one, and a new file into one of JOBS.
//   LAYOUT_JOB=N node tools/layout-test.js: only the parts of job N of JOBS (or its share of a
//   part's screens), as CI runs them side by side; the screens, the probes, the helpers and the
//   summary (00-02, 99) run in every job.
const path = require('path');
const fs = require('fs');
const runParts = require('./parts.js');
const { launch, serve, HELPERS } = require('./browser');

// CI's jobs, by the time each part took (of about 1150 s on a cloud machine): 03 every device
// 308 s, 04 154, 05 44, 06 one screen in every state 354, 07 43, 08 87, 09 50, 10 46, 11 19, 12 45,
// 14 about 90.
// '03/1' is the first of two shares of part 03's screens (share() in the part), '03/2' the second.
const JOBS = { 1: ['03/1', '07', '09'], 2: ['03/2', '05', '13'], 3: ['06/1', '10', '14'], 4: ['06/2', '11', '12'], 5: ['04', '08'] };
const ALWAYS = ['00', '01', '02', '99'];
const DIR = path.join(__dirname, 'layout');
const job = process.env.LAYOUT_JOB;
const mine = job ? JOBS[job] || [] : null; // (null: every part, whole)
{ // (every part always run, or in one job whole, or in shares 1 to n of n: none left out of CI)
  const entries = [...ALWAYS, ...Object.values(JOBS).flat()];
  const loose = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => f.slice(0, 2)).filter(n => {
    const of = entries.filter(e => e.split('/')[0] === n), n2 = of.length;
    return !(n2 === 1 && of[0] === n || n2 > 1 && Array.from({ length: n2 }, (_, i) => `${n}/${i + 1}`).every(e => of.includes(e)));
  });
  if (loose.length) { console.error(`parts not in JOBS once, or in shares 1 to n: ${loose.join(', ')}`); process.exit(1); }
  if (job && !JOBS[job]) { console.error(`no job ${job} in JOBS`); process.exit(1); }
}
// A part's share of a list of screens in this job: all of it but where JOBS splits that part.
const share = (part, list) => {
  const e = mine && mine.find(x => x.startsWith(part + '/'));
  if (!e) return list;
  const n = Object.values(JOBS).flat().filter(x => x.startsWith(part + '/')).length, i = Number(e.split('/')[1]) - 1;
  return list.slice(Math.floor(list.length * i / n), Math.floor(list.length * (i + 1) / n));
};

const results = [];
let failed = 0;
const check = (ok, what, detail = '') => {
  results.push(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
};

(async () => {
  const site = await serve();
  const b = await launch();
  const ev = expr => b.eval(expr);
  const board = [];
  try {
    await runParts.inside(DIR, { HELPERS, results, check, share, site, b, ev, board },
      file => !mine || [...ALWAYS, ...mine.map(e => e.split('/')[0])].includes(path.basename(file).slice(0, 2)));
    if (b.errors.length) { console.log('page errors:', b.errors); failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log(`\nall passed (${results.length} checks${job ? `, job ${job} of ${Object.keys(JOBS).length}` : ''})`);
})().catch(e => { console.error(e); process.exit(1); });
