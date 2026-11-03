## Phones

The page on a phone, held upright and on its side: the board's size and place, the row and the chatter under it, the
smallest phones, the woodpecker's perch there, full screen and the screen kept awake, as the phones work, one screen and
the owner's playtest settled them (their text, with what was tried and measured, is in `docs/archive/design-page.md`).
Every number is CSS px, measured in headless Chrome by `tools/layout-test.js`; the least board each screen gets is
pinned in `tools/layout/00-screens.js`. Elsewhere: the page on every screen, the header's rows and the cards
(`33-one-screen.md`); the keys, touch and swipes (`42-controls.md`); how a tap and a swipe use the powers ("Two
powers, two presses" in `40-powers-and-moves.md`); the woodpecker's size on a phone ("The woodpecker, as big as it
gets", "Clear of the row's words (2k+)" and "Bigger on a phone" in `38-the-woodpecker.md`); and a banner's place over
the header (the placement under "As built, step 1" in `30-teaching-by-showing.md`).

### Held upright

A phone held upright is a screen up to 440 px wide.
- **The board runs edge to edge:** no page margin beside it, its frame a 4 px rim (a 9 px radius). The moss and the
  corner leaves (28 px, their blades along the rim, never over a cell) run off the screen's edges, where the page clips
  them, so nothing scrolls sideways. The header, the tags, the row under the board and the chatter keep 12 px from the
  screen's edge. You see the whole log: no camera, no zoom. 382 px on a 390 px phone.
- **As big as fits:** the board is as big as fits, up to edge to edge, under what's above it (the page's top, the
  header and the tags, as the page measures them, whatever their rows and font: game/screen.js `measureAbove`) and over
  the row under the board (`--room`); a phone too short for edge to edge (an iPhone SE with Safari's bars showing, a
  small Android with its browser's bar) has it centred. It is never smaller than before the page was one screen tall
  (the owner's call: "The board first" in `33-one-screen.md`).
- **Laid out for the bars showing** (`svh`), so the board doesn't grow and shrink as Safari's bars come and go; only
  the chatter, the rest of the screen, does. A browser without `svh` (Safari before 15.4, Chrome before 108) falls back
  to `vh`. Each `svh` with a `var()` in it, and the side's `dvh` in a custom property, is in an `@supports` test of its
  own: such a value is only checked as it's used, so a second declaration couldn't fall back to a first.
- **The header** is two rows, the title with Score (and Best) and then the buttons; where Score and Best sit, and the
  title's size, are under "The header's rows" in `33-one-screen.md`. The tagline shows only from 800 px tall, the two
  rows are 6 px apart, and the tags 25 px a row, 6 px under the header and over the frame, sitting over the frame's top
  moss and corner leaves (which reach 12 px up into that gap).

### The phone gap

- *The row under the board* (the help, or the speed buttons while you watch, and the voices' and the chatter's
  switches) is right under the board, 6 px under its frame (`--over-foot`; 2 px on a phone less than 1.7 times as tall
  as wide), and the chatter right under that. Watching, the speed buttons take the help's place in the row, so the
  chatter keeps its room. The ledge (`#perch-ledge`) is still laid out, 0 px tall: it tells the page and the bird that
  the phone is upright. The frame's bottom moss and corner leaves are left off wherever the row is closer than they
  hang (12 px), which is any phone held upright (`.snug`, game/screen.js `placeBoard`): over the help and the switches
  they're clutter.
- *The help under the board* is always on the screen. Wherever it isn't wholly on the screen or isn't shown as a round
  starts, the first Go teaches the powers instead: "Tap jumps. Swipe ahead dashes." (`powersFirst`).
- *The woodpecker* perches over that row: "The woodpecker's perch", below.

### The phone's bottom

- *The chatter keeps the row's gap.* Open or folded, its panel starts `--over-foot` (6 px) under the row under the
  board, so the buttons' rims never meet it.
- *Open where there is room.* At the start, and as the phone turns or changes size, the chatter opens (its caption and
  as many whole lines as fit, down to the screen's foot, its safe area kept) wherever three lines of a row fit open
  (`CHAT_OPEN_ROWS`); where they don't (375×667) it starts folded: a strip of one row, the newest line cut to it, with
  a down caret at its end (open, an up caret at its caption). A tap anywhere on it folds or opens it, and that choice is
  kept from round to round and visit to visit (`snake-chatter-open`, `open` or `folded`, read and written in try/catch;
  game/screen.js `fitChatter`). Mid-round the tap opens it (game/input.js treats the chatter as a button there), and a
  swipe started on it still steers. Folded, the rivals' long lines also show in their bubbles on the board, as in any
  strip. With no room for a row, no panel.

### The smallest phones

- *Phones less than 1.7 times as tall as wide* (an iPhone SE or mini in Safari, 375×548 to 635; a small Android with
  its browser's bars, 320×460; 390 and 414 px wide under about 660 and 700 tall): the row's buttons are 30 px tall, not
  a fingertip's 44 (24 is the least for a target), the help's two lines a little closer, the row 2 px under the board
  and the page 2 px off the screen's bottom and 4 px off its top (the header's rows 4 px apart). So no board is smaller
  than the phones work made it: 280 at 320×460, 341 at 375×548.
- *The chatter* has no room for a row at 320×460, 375×548 to 553 and 390 and 414 px wide up to about 600 tall: its
  switch is in the row, and the rivals' lines are in their bubbles on the board. Where it's a strip (375×635, 360×640,
  390×664) it's slim, its padding 1 px over the words and 2 under them, so a line of two rows is whole in it where it
  fits; where only one row fits, the newest line is cut to it, its words whole in its bubble on the board.
- *A Galaxy Fold folded* (280 px; any screen up to 300 px wide), watching: the speed buttons drop their word, "Speed"
  (the group's name, "Watching speed", says it), so the switch isn't cut by the screen's edge.
- **Last words on phones.** Where the log can't show them whole (no panel at 320×460, a folded strip of one row), the
  last words of the snake whose death ends the round stay in their bubble where it went out, whole and unfaded by your
  snake beside it, and the round's card waits for them, their 2 s (chatter/talk.js `LAST_WORDS_MS`) from the death in
  place of the usual 600 ms; it takes them away as it comes up. Beside the board, where the log shows them, nothing
  changes. `tools/ui/07-last-words-on-phones.js`.

### On its side

A phone on its side is a screen at least 5:4, 480 px wide or more and 500 px tall or less; a laptop's window that short
(its DevTools docked below, say) is laid out the same way.
- **The board** takes the full height less a 5 px rim (a 12 px radius) and the safe area (a notch, the home bar), so
  nothing scrolls at all: about 310 px with a phone's browser bars showing (780×320), about 380 in full screen
  (844×390). Under about 600 px wide (568×320, the first iPhone SE) it's as wide as the column leaves it, shorter than
  the screen.
- **The column beside it** keeps at least 244 px (five 44 px buttons in a row, the tags two by two) and the woodpecker
  a 24 px gap between it and the board, and takes the screen's whole height, 6 px off its top and 4 off its bottom: the
  title smaller (1.4rem) and no tagline, the tags two by two, smaller words, and the chatter taking what height is left,
  its newest lines first, whole (`fitChatter`). The page is clipped only at the top and bottom, so a focus ring at the
  column's left edge is whole.
- **The row:** the help sits beside the switches, in smaller words. Watching, the speed buttons take a row; where the
  chatter would then have no room for a row of words beside the help (780×320 in Safari, less a notch's home bar of 21
  px), the help, which only says what the speed buttons do, gives the chatter its room, and the speed buttons drop
  their word (`help-yields`). It's decided with the help shown, as the window changes, the font arrives and the speed
  buttons come and go (game/screen.js `fitColumn`), so where a row fits beside the help, it stays: 780×320 without a
  notch, 780×340, a notched 844×340.
- **The frame's rim** meets the screen's top and bottom, with no room for moss to hang off it, so there's no moss on
  the frame, and the two left leaves (24 px) rest beside its corners, in the gap by the column, growing out from the
  rim; the two on the right are left off, against the screen's edge or in the bird's margin.
- **Its cards** go by the board's size: "The cards, by the board" in `33-one-screen.md`.

### The woodpecker's perch

Its size, and where it clings on its side, are in `38-the-woodpecker.md` ("The woodpecker, as big as it gets", "Clear
of the row's words (2k+)" and "Bigger on a phone"); its flights and drums at the board's edges, in "A woodpecker you can
believe" there.
- *Held upright,* it perches over the row under the board, its crown just under the board, at full size. Its room runs
  from the board's bottom to the screen's, inside the safe area; the row and the chatter don't stop it (game/screen.js
  `placeBoard`), so on the shortest phones it stands down over the chatter's strip too, and only where the screen's
  foot is near (320×460, 375×548: 33 px) is it smaller. Its layer takes no taps (`pointer-events: none`), so a tap on the
  help, a speed button or a switch under it goes through.
- *It plays with the controls.* Under the board it clings to a button's rim where one is near (2.5 of its units, about
  34 px on a 390 px phone): its toes on the side of a speed button or a switch, facing the button and its spot, as it
  clings to the log; resting there, every 3 to 7 s it pecks at the button, two quick taps (render/bird-perch.js
  `perchFor`, render/bird.js `headAndEye`). Going from one spot to the next it hops from rim to rim. With reduced
  motion it clings but doesn't peck.
- *On its side,* it perches beside the board: in the margin where there is one, else in the 24 px gap between the
  column and the board.
- *Perched, resting or eyeing its chunk, it never covers a cell.* It keeps its outline, and its beak as it turns to look,
  1.5 px off the cells and off the page's furniture and the moss and leaves, and it stays inside the safe area, not
  under a notch; crouching as the strike nears, it keeps its tail on the screen too. Only with room nowhere (a tablet
  held upright, 22 px of gutter) is it shrunk to fit, its beak's tip touching the edge.
- The page and the perch change together: the game tells the renderer where the free page runs round the board, where
  the safe area runs, the moss and leaves hanging off the frame, the buttons' rims and the words under the board
  (`placeBoard`, `Render.setBoardRect`), and `perchFor()` stands the bird there.

### Full screen

- **A button** where the browser allows it (Android, desktops, iPads: `document.fullscreenEnabled`) gives the game the
  whole screen; on a phone on its side that's a board of about 380 instead of 310. A tap goes in, another comes out, and
  its icon (corners going out, or coming in) and its label ("Full screen", "Leave full screen", its tooltip "Leave full
  screen (Esc)") follow; Esc leaves too. Where the browser can't, there's no button.
- **Where it is:** in the header, last in the row of buttons, after the Hall of Fame; on a phone on its side, or a
  window 500 px tall or less, it takes the column's top corner beside the title ("The header's rows" in
  `33-one-screen.md`).
- **An iPhone** can't give a page the whole screen, so there "Add to Home Screen" opens the game on its own, without
  Safari's bars, under a see-through status bar that the page keeps clear of by the safe area. Its home-screen icon is
  the iPhone's own snapshot, since the game has no asset files.

### The screen stays awake

While you play, through the countdown, and while you watch a round, an AI round or the rest of yours after you're out,
the game holds a screen wake lock (game/screen.js `keepAwake`). It's let go when you nap, when a card is up (your
death's, the round's end) and while the Hall of Fame or the rival picker is open. A hidden tab loses it (the browser
lets go); coming back asks again if it's still wanted then. Alone, you'll be napping by then, so waking asks; online,
the round goes on, so it's asked at once. A refusal (a battery saver, say) isn't asked again until the next time it's
wanted. Where there's no wake lock, nothing changes, and there are no hidden-video tricks.

### Tests

`tools/layout-test.js` (its parts in `tools/layout/`) checks all of this in headless Chrome on 24 screens, upright and
on their sides, with and without a notch (the safe area set through the DevTools protocol), with a browser's bars
showing, tablets and desktops, and held upright at every 5 px of height in between; the screens' least boards are
pinned in `tools/layout/00-screens.js`. On each:
- the board's size, wholly on the first screen held upright, and the header and tags 12 px from the screen's edge; no
  scroll, down or sideways; in a browser without `svh` and `dvh`, the board, its frame and the ledge as with them;
- every button (the header's, the tags, the switches, the help, the cards') on the screen and taking a tap; while you
  play, the help wholly on the screen or hidden, and then the powers' lesson at Go;
- on its side, the column off the screen's top and bottom, a full chatter's log cut inside its box and the page, a row
  of words at least and none sliced, and the help giving way while you watch only where, shown, it would leave the log
  no row; no moss or leaf cut by the screen's edge, and the nap button's focus ring whole;
- held upright, the row at most 6 px under the frame and the ledge 0 px tall; the chatter folded and opened by a real
  tap with the board unmoved and nothing scrolling; and (`tools/layout/13-the-phones-bottom.js`, at 390×844, 360×780,
  412×915 and 375×667, playing and watching, open and folded) no button, the help or the chatter's panel meeting
  another, the chatter's gap at least the row's, the chatter starting open exactly where three lines fit, a tap's choice
  kept on the next visit, and a real tap on a speed button under the perched bird pressing it;
- the woodpecker perched, resting and eyeing its chunk, from its own layer's pixels: never over a cell, the page's
  furniture or the moss and leaves, never past the screen's edge or into its safe area, the switch and the chatter
  taking a tap under it; and flying out to the board's edges and corners, drumming and flying home, drawn every 10 ms,
  never cut off by the screen's edge or its layer's, on every screen;
- the full-screen button, in and out on a real tap, and none where it isn't allowed; the wake lock, through a stand-in
  that records every request and release, through the countdown, play, a nap, the Hall of Fame, a hidden tab, a lock
  the browser let go, your death's card, keeping watching, the round's end, a watched AI round, a refusal, and a
  browser with none; a real touch swipe on the board, upright and on its side;
- and no error events on the page, playing, watching or resized (the game sets what's above the board as the window
  changes, never from inside a resize observer's call). Each reading waits until the page has been drawn and its own
  resize observers have run.

`tools/ui/06-phones.js` checks the phones' header at 390 and 320 px; the one-screen checks are under "Tests" in
`33-one-screen.md`.
