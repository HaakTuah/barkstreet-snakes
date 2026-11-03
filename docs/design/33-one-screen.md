## One screen

The page on every screen: one screen tall, the board first, the row under the board and the chatter in what's left,
the header's rows and the Field guide's door, and the cards by the board, as one screen and the owner's playtest
settled them (their text, with what was tried and measured, is in `docs/archive/design-page.md`). Every number is CSS
px, measured in headless Chrome. Elsewhere: the page on a phone, upright and on its side, full screen and the screen
kept awake (`31-phones.md`); the keys, the mouse and touch (`42-controls.md`); a rival's note on a card ("A rival's
note" in `32-the-owners-playtest.md`); the words on the cards and in the hints (`09-voice-and-copy.md`); and a
banner's place (the placement under "As built, step 1" in `30-teaching-by-showing.md`).

The owner asked for it: "I notice that you have to scroll to see all the ui elements outside of the gameplay screen. Is
it possible to make it all fit on screen so you don't have to scroll?" (on a 1920×1080 desktop's Chrome with its
bookmarks bar, a 1920×945 page, and on a phone).

### The page is the screen's height

- **The chatter is what's left.** The header, the tags, the board and the row under the board keep their size; the
  chatter takes the rest, down to nothing, so nothing scrolls, on any screen, in any state. What it shows is decided
  from that room alone (game/screen.js `fitChatter`, as lines come and as the room changes, never per frame), so nothing
  comes and goes as lines of one row or two arrive: its caption and as many whole lines as fit, newest first, 5 at most
  (`CHAT_SHOWN`); with less room, the lines without the caption, a strip; where not even the newest fits whole, it's
  cut to the rows that do, ending in an ellipsis; with no room for a row, no panel, and the rivals' lines in their
  bubbles on the board (as in a strip, for the long ones). A line is never sliced through, and an older one shows whole
  or not at all.
- **The row under the board** (`.foot`) holds the speed buttons (while you watch), the help, and the voices' and the
  chatter's switches, its height kept (`--foot`: 30 px with a mouse, the help's two lines; a fingertip's 44 on a touch
  screen), so the board never changes between playing and watching. The chatter's switch is a speech bubble and its
  word (On, Off), named "Bark chatter" in its tooltip and to a screen reader, there when the chatter has no room; the
  voices' is "Voices (V)" ("The switches" in `21-sound.md`). Alone in the row, at the start card (whose card has the
  keys), they sit in the middle. Beside the board, the help has a row of its own, then the speed buttons and the
  switches, just over the chatter; on a phone, see `31-phones.md`.
- **The help gives way** wherever it doesn't fit its row (game/screen.js `fitColumn`): an item squeezed past its box
  (watching on a narrow touch screen, the speed buttons and the switches beside it), or its lines making the row taller
  and taking it off the screen (the keys' help on four to six lines in a narrow window with a mouse). The start card,
  the nap's card and How to play have the keys; on a touch screen the first Go says how to jump and dash.

### Beside the board

On a screen at least 5:4, 480 px wide or more and up to 1180 px tall (laptops, a 1080p or 1200p desktop's browser,
short windows, phones on their side), the header and the tags sit in a column beside the board (180 to 300 px wide,
20 px from it), which takes the full height up to 900 px (`--board`: the window's height less 32 px, and its width less
260). The column is as tall as the board: the header, the tags, the help on a row of its own, then the speed buttons and
the switches, and the chatter in what's left. 880 px at 1920×945, 1920×969, 1920×1065 and 1680×1050, with all five
lines of the chatter beside it. The Field guide's and the Hall of Fame's own row (a window 700 px tall or more: "The
Field guide's own door", below) costs the chatter lines, never a scroll. A phone on its side has its own compact
column (`31-phones.md`).

### Over the board

Taller than 1180 px (a 1440p screen's browser, 2560×1305), narrower than 5:4 (half a 1080p screen, 960×945; a
near-square window), or a tablet held upright: the header and the tags are over the board and the row and the chatter
under it, the page as wide as the board. The board leaves room above it for the header and the tags as they are,
measured (`--above`: game/screen.js `measureAbove`), and under it for the row and a chatter of its caption and two lines
(`--below`, `--chat-room` 84 px), up to 900 px; but never smaller than the window's height less 260 px (the owner's
call, below), and where that is the bigger board, it's the board, and the chatter and the help give way under it. A
narrower board can take the header and the tags onto more rows, so what's above is worked out from one row of each up,
until it holds: the biggest board that does, whatever the window was before. 674 at 960×945; 724 at 768×1024 and 880 at
2560×1305.

### The board first

The owner's call, having looked at it: "I like how you have altered the layout for desktop and made it more space
effective... But on the phone, I really don't like that you make the gameplay screen smaller." So on a phone, and
wherever the header is over the board (a phone held upright, a tablet held upright, a near-square or narrow window, a
1440p screen's browser), the board is never smaller than it was before the page was one screen tall (over the board,
the window's height less 260 px; on a phone, the phones work's: both pinned in `tools/layout/00-screens.js`, `main`).
Where the page can't then hold everything, the help and the chatter give way, never the board:
- the chatter to a strip or to none, the rivals' lines in their bubbles on the board (800×800: none; 1000×860 and
  720×860: a strip of one line);
- the help, in any state, where it doesn't fit its row (above).

### Desktop chatter

Beside the board on a desktop (the column beside it, 501 to 1180 px tall: not a phone on its side, whose column is too
short), the chatter reads like a chat: newest at the bottom, the panel growing with its lines down to the board's
bottom edge, then scrolling. A line's opacity runs from nothing at the log's top edge to whole two rows under it (a
third of the log at most), so a line cut by the edge never shows sliced; scrolled back to the oldest, nothing fades,
and the newest never fades (game/screen.js `fadeChatter`). The wheel or the scroll bar reads back through the round's
last 50 lines (chatter/talk.js `LOG_SIZE`), the log's own scroll, never the page's. Everything else as above: the
caption first to go, a strip, or none where not a row shows; elsewhere (over the board, a phone either way) the newest
first, whole lines only, 5 at most. A tablet on its side has the scroll too, but mid-round a finger on the log steers
and jumps (the board's touch handling comes first), so it reads back by touch between rounds, while watching or after
your death. The owner asked on 20 October whether the computer should get more dialogue: "It's short, with lots of
space under it".

### What gives on the smallest screens

- *Narrow or near-square windows over the board, not tall,* keep their board (the owner's call, above): 1000×860 580,
  460×612 332, 800×800 520, a Surface Duo 440. Their chatter is a strip or none, and the keys' help gives way where its
  lines don't fit its row. Smaller still, windows under about 500 px tall and narrower than about 620 px (470×376 among
  them), the board keeps its least, 280 px, and the page scrolls in every state.
- *Phones:* "The smallest phones" in `31-phones.md`.
- *Where four tags in a row would cut the rivals' names* (a near-square window), they sit in two rows of two, as on a
  phone.

### The header's rows

The header holds the title (and its tagline), Score and Best, and its buttons: nap, music, mute, the Field guide's
book, the Hall of Fame's trophy and, where the browser allows full screen (Android, desktops, iPads), full screen: six,
or five without it (an iPhone, an older Safari, a page in a frame). Rows for each screen, nothing alone on a row, the
board where the phones work put it (the header no taller than it was there, but for the laptop's doors' own row), each
door named where its row has room for its word with 5 px to spare, and Score and Best with room for four digits, so
nothing moves as they grow from 0 to 1000.
- **Held upright,** two rows. With six buttons, Score and Best sit beside the title and the buttons have a row of their
  own; the title is as big as leaves the two room for four digits each (1.4rem at 360 px, 1.63 at 390, 1.7rem from
  400, with Score and Best in 0.9rem), from the page's width less theirs, and its line keeps its height, so the rows and
  the board don't move; the tagline (on a phone 800 px tall or more) is no wider than the title. The guide's word from
  371 px, the trophy's too from 428. With five, Score is on the title's row and Best ends the buttons' row under it, its
  room kept for four digits, its digits under Score's; the guide's word from 399. On the narrowest phones (320 to 340
  px) the title, Score and Best share the first row (the title 1.25rem). A touch screen's buttons are 6 px apart at
  least. *Turned down:* Best beside six only where it fits, from 396 px (Android phones would change layouts at 396, and
  a 412 px one would have no room for the guide's word); 40 px buttons 4 px apart, under a fingertip's 44; the
  full-screen button on the title's row, which leaves Score's digits no longer over Best's; a third row.
- **Over the board** (a desktop, a tablet held upright, a narrow window): Score over Best beside the title, their words
  to the right and their digits in a column with room for four, in 0.9rem, so the pair takes the width of one. The steps
  go by the page's width (the window's less 24 px, or less where the window isn't tall: the page narrows with the
  board, a 460×612 window's is 352), a mouse's 34 px buttons and a touch screen's 44:

  | Page from (px) | Mouse, six | five | Touch, six | five |
  |---|---|---|---|---|
  | One row, both doors pictures | 592 | 552 | 652 | 602 |
  | ...the Field guide named | 649 | 609 | 699 | 649 |
  | ...both named | 716 | 676 | 756 | 706 |
  | ...the buttons 8 px apart (6 under) | 728 | 686 | 768 | 716 |
  | Two rows, both named | 384 | 340 | 404 | 354 |
  | ...the Field guide named | 317 | any | 347 | 297 |

  Narrower than one row, the title with Score and Best has the first row and the buttons the next. Under 352 px (348
  with touch) the title is as big as leaves Score and Best their room, and under 299 a touch screen's six buttons are 40
  px, 4 apart. In the stand-in font (offline, where Fredoka never arrives) nothing wraps either. *Turned down:* a
  shorter word ("Guide": the button says what its tab says); keeping the full screen out of the row with a mouse (F11
  isn't findable).
- **Beside the board,** the title, Score and Best, then the icons. On a phone on its side, or a window 500 px tall or
  less, the full-screen button takes the column's top corner, beside the smaller title, reaching down beside Score and
  Best, so the column has three rows (95 px) and the icons' row its five (244 px); the guide's word from a 297 px column
  (273 with a mouse: 780×320, 844×390 and up). On a laptop's column the six icons share their row: 34 px with a mouse
  where they fit (254 px: 1366×657, the guide its book), else 32 px, 4 apart (in a 4:3 or 5:4 window's 216 px column,
  800×600, and a window 230 to 250 px wider than tall, 920×690). With touch, six fit from 294 px; narrower, the title is
  two lines and the full-screen button takes the corner beside them (a tablet on its side in full screen, 244 px), and a
  touch column of 264 to 293 px, where the title is one line, has it end Score and Best's row instead. With five icons
  a laptop's column has the guide's word from 273 px (297 with touch). A tall column keeps the doors' own row, the full
  screen in the icons' row. A touch column under 244 px (a 4:3 or 5:4 touch screen in full screen) has its icons 40 px,
  4 px apart.

### The Field guide's own door

The guide is the third tab of the same book as the Hall of Fame and Your story (its napping, its focus, the online
check and the narrow-screen tabs are the book's), with a door everywhere a player looks:
- **Its own button,** an open book, before the trophy. A door with room in its row for its word says it ("Field guide",
  "Hall of Fame"), else it's its picture, round like the icons beside it, with its name in its tooltip ("Field guide
  (G)") and for a screen reader (where, on each screen: "The header's rows", above).
- **A laptop's column** beside the board gives both doors a row of their own, with their pictures and names, under the
  icons (50 px), where the column still ends above the board's bottom with the chatter's log full: a window 700 px tall
  or more (780 with touch) and a column 236 px wide or more. Elsewhere the doors stay in the icons' row.
- **G** opens the guide, and H the Hall of Fame (or Your story, if that's where you were), never the guide. In the
  book, H and G go to their tab, or close it from there; Esc closes it. The book is named for its tab, and a door opens
  it at its top.
- **How to play** on the start card, beside Play with friends, opens the guide at its first section, **The basics**:
  Winning, Steering, Crashes and Hunger, in the renderer's own pictures (your snake in the win's confetti, your head with
  a turn ahead of it, your head dazed with its stars, a tag's hunger bar).
- **Field guide** on the napping card: a nap is when people read.
- **Your death's card,** playing alone, names what got you: "Field guide: Crashes" (or Hunger, Fire, Holes, Golden
  leaf). It opens the guide at that row, scrolled into view and lit in Honey for 2.4 s (with reduced motion, lit and
  still); focus goes to the book's Close without scrolling the page back up, and the book's tabs and its × stay at the
  top of its page as it scrolls, inside its ring. The lit row is wholly in view under them. **The round's card,** when
  your death ends the round (you came second, or a draw), is your death's card: it names what got you too, and so does
  the round's card after your death's. Every rule needs a cue and a lesson; this is the lesson, when it's wanted.
- **The keys** under the board say "G opens the Field guide" too, and the start card's say it instead of H's (a
  first-timer's Hall of Fame is empty). The touch hints have no room to spare: How to play is their way in.
- *Turned down:* a dialog of its own (the book's machinery twice over); a "?" icon (it reads as help or about; the book
  matches the name, and How to play on the start card teaches it); a button called How to play (the button should say
  what its tab says); opening the guide by itself on a first visit (pushy); a "press G" banner (banners are short, and
  the death card's link does it at the moment it's wanted).

### The cards, by the board

The cards (the start card, a nap's, your death's, the round's end) sit on the board, and go by the board's size (the
board is a size container), whichever way the phone is held:
- **A phone's card** on any board up to 490 px, which is every phone's, held upright (up to 432) or on its side (up to
  490 in full screen), and a short or narrow window's: tighter, and the rivals as a row of names (a tag's tap gives how
  one plays). On a small board (380 px or less) a rival's note stands in for the start card's row of names, the new
  best's badge and the carve ("A rival's note" in `32-the-owners-playtest.md`).
- **Two buttons side by side** on a board up to 330 px (a phone's edge-to-edge board, 310 on its side, 312 at
  320×640), so the card covers about half the board rather than three quarters.
- **The fullest card,** a first good round's with the new best's badge, the carve and the Field guide's link, fits its
  board with the longest reason a round gives ("You crashed head-on into Capricious, the same length: both out · 4th
  place · score 128"): up to 403 px the death's quip waits while the carve is offered, up to 340 the badge gives way to
  the carve (a Galaxy Fold's cover screen, 336 px), and up to 300 the card's links wait while you carve. A note stands
  in for the badge and the carve up to 455 px. Once your name's in ("Carved: Perry.", or "Hall of Fame #4, as Perry." if
  you had one) the field goes, the row is one line and the link is back. The rename that a field would offer there is
  the one thing given up, on the smallest boards only.
- **The round's card when your death ends it** (it has the carve, the badge and the link then) says a little more
  ("· lasted 2:41"): while the carve is offered, its quip waits up to 419 px, and the new best's badge up to 390.
- **On the smallest boards** the last pixels go too: up to 330 px the roll-call's names are 1 px from each other's rows,
  and up to 300 a note keeps 4 px over the buttons, How to play and Play with friends share a row (2 px from their edges
  and 6 apart), and the hint keeps its first two items ("Swipe to steer · Tap to jump").
- **What still scrolls:** at 568×320 (the first iPhone SE on its side, a 266 px board) the start card scrolls 18 px with
  the longest names, and the round's card 10 px with the longest words, past nothing but its bottom edge: everything
  left on it is wanted. Everything else fits, from 320×460 to 1920×1080.

### Not tested on real devices

iOS Safari as its bars come and go: the page is the dynamic height and the board is laid out for the bars showing, so
only the chatter should grow and shrink. Windows Chrome's own scrollbar: none should show, as nothing runs past the
screen (headless Chrome has none to show), and a fraction of a pixel at 125%, 150% or zoomed in or out doesn't make one
(checked at each).

### Tests

- `tools/layout-test.js` (its parts in `tools/layout/`) fails if anything scrolls, down or sideways, in any of 10 states
  (the start card, the countdown, playing, playing with the chatter full, a nap, your death's card, the round's card,
  the Hall of Fame and the Field guide open, watching with the chatter full) on its 24 screens and on 11 desktops as
  browsers have them (1920×945 and 969, 1536×730 at 125%, 1280×609 at 150%, 1920×945 zoomed to 110% and 90%, 1366×657,
  1920×1065, 1680×1050, 2560×1305, 960×945); held upright at every 10 px of height from 440 to 940 at seven widths; and
  over the board at five widths from 460 to 1040, every 80 px of height from 560 to 1120, with a mouse and with touch.
  On every screen: a full chatter's lines whole under the row (or none, the switch on the screen and taking a tap), the
  switch's name, the speed buttons in the row and taking a tap, the help giving way where the chatter would have no row
  or where it doesn't fit its row, and never squeezed past its box or the screen's edge; lines streaming in that never
  move the board or set off a resize observer's loop; the boards' floors (`least`), and on every stacked screen the
  board against main's (`main`, pinned in `tools/layout/00-screens.js`); the desktop chatter on every screen beside the
  board (the panel to the board's bottom edge, the newest at its bottom, a cut line not shown, the wheel back to the
  oldest, the page unscrolled) and the log scrolling nowhere else.
- The header, on its 24 screens and 35 more from 360×640 to 2560×1305: its rows as designed for the screen, no button
  alone on a row, the full-screen button ending a row, each door its picture only where its word (put in to see, 5 px
  wider) would wrap the row, the guide's tooltip and spoken name, the guide's door costing the header no height, the
  header no taller than the phones work's, and Score and Best at 100 and 1000 moving nothing.
- `tools/ui-test.js` (its parts in `tools/ui/`): a rival's note's ways in and out and every door to the guide, with a
  mouse, keys and touch, on a desktop and on phones at 390 and 320 px; Fire's row, far down the guide, lit and in view;
  the book's × on the screen when a death's link opens it far down, and a real click or tap on it closing the book; the
  round's card naming what got you when your death ends it, and opening the guide there; the header at every step over
  the board, its page and a pixel under it, with six buttons and five, a mouse and touch, and Score and Best at 100 and
  1000 moving nothing; the columns at 1366×657 (with full screen and without), 1280×800, 920×690 and 800×600, watching
  with the chatter full (no scroll); a real first good round's death card, with the longest reason, on phones from
  320×460 to 428×926, with a note and without, and at 320×460 carving your name and the next good round; the start card
  and the fullest death card on phones on their sides (844×391, 896×414, 929×430, 972×450) and on a Galaxy Fold's cover
  screen (344×882); the round's card when your death ends it at 390×844, 844×391 and 896×414; and the start card's two
  links on one row at 568×320.
