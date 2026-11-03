## The owner's playtest

The owner played the live game (6d478ed) on a desktop and sent three findings, from a napping round (Ouroboros, Metagamer, Gobbler, Copycat):
- Ouroboros went round and round right next to a golden apple and wouldn't eat it; with more play, it let almost all food by the edge go ("it approaches it, but cuts off before eating it"). Does any other rival do it? Beside fire, a hole, another snake?
- Clicking a rival's name tag while napping showed its description, and the Napping card took it back after a second or two.
- The Field guide isn't obviously behind the trophy.

### A meal isn't a pin

Its rules are in `39-the-rivals.md` under the same name, and its text as it was, with what it measured and how it was
tested, in `docs/archive/design-rivals.md`.

### A rival's note

**The cause:** a click on a tag put the rival's line in the card's own paragraph, in italics, and put the card's words back 3.2 s later, though the game was napping. The line wasn't where the eye goes from the tag, and only the italics changed, so finding it took most of a second and left about two to read. A rival's line runs 8–14 words, 21–27 with what it holds; at 200 words a minute one rival in 18 fits in 3.2 s. The same handler did nothing on your death's card or while watching (it gave up whenever the round was running, and the round goes on behind your death's card), and in the countdown the next beat wiped it after 180 ms.

**The call: the line is the rival's note, and it stays until you're done with it.**
- On any card that's up (napping, your death's, the round's end, the start), a click, a tap or Enter on a rival's name opens its note in place of the card's words: a slip of darker parchment edged in its colour, its dot and name, how it plays, and what it holds now in smaller type, kept live (the round goes on behind your death's card; "Out of this round." once it's out). Your own tag gives your powers, or "You’re out of this round."
- It stays until you act: its tag again, another tag (which swaps it), its ×, Esc (before anything else Esc does: Esc again wakes, or keeps watching, as ever), a click or tap anywhere but a button, a field or a tag, or the card going. A new card brings its own words.
- Its tag wears a cream ring while its note is up, its name tells a screen reader so (`aria-expanded`), and the note is read out as it opens. Esc or its × give focus back to the name, where Enter opens it again rather than asking to start over.
- Watching with no card up (after you're out, or Watch AIs): a banner edged in the rival's colour, up as long as it takes to find and read: 1 s and 55 ms a character (about 200 words a minute), 3.5 to 9 s. Its level, `asked`, comes up at once (you asked for it): every other banner waits its turn behind it, and the one it interrupted goes back to the front of the line (until "Teaching by showing", round news pushed it off). It stays on the board on a phone held upright too: three lines of it over the title row would cover the tags.
- While you play, in the countdown and in the lobby, a tag shows nothing (your eyes belong on the log); a desktop's tooltip still does.
- On a small board (380 px or less: a phone on its side, a laptop's short window) the note also stands in for the start card's row of names, the new best's badge and the carve (unless you're typing in it), and on the smallest (300 px) for the card's links too; they come back with its words. (At first only the smallest let the badge and the carve go: on a 316 px board a note on a first good round's card slid the carve under Play again, and a finger dragging the card to reach it closed the note.) The phones work's edge-to-edge boards are a little bigger than 380 on most phones, so there the note stands in for the start card's roll-call up to 403 px (2 px), and for the badge and the carve up to 455 (on a 390 px phone's 382 px board a note on your death's card made it scroll 27 px, on a 412's 404, 5; on the round's card, whose words say more, 25 at 422 and 7 at 440), held upright or on its side (see "The cards, by the board" below).
- *Turned down:* a longer timer, or one by the line's length (the game's napping: any timer takes the words from someone still reading; the banner has one only because the round moves on); a popover by the tag (on a desktop it covers the other tags and the chatter, on a phone the board and the card); closing it on any key (P, Enter, R, H, M and N all mean something already); notes while you play or in the countdown.

### The Field guide's own door

**The cause:** the trophy was the guide's only door. It's called Hall of Fame and shows only its icon on a laptop and a phone, and nothing in the game says "guide" or "how to play" anywhere a first-timer looks. The one hint, "H opens the Hall of Fame", led to an empty Hall of Fame with the guide a quiet third tab beside it, and the book reopened on whichever tab was used last, still called Hall of Fame.

**The call: one book, two doors.** The guide stays the third tab of the same book (its napping, its focus, the online check and the narrow-screen tabs are all the book's already, and Your story sits well beside it: your nemesis, then its row), but it gets a door everywhere a player looks:
- **Its own button**, an open book, before the trophy. A door that has room in its row for its word says it ("Field guide", "Hall of Fame", as the Hall of Fame always did on a desktop), else it's its picture, round like the icons beside it, with its name in its tooltip ("Field guide (G)") and for a screen reader. Where each goes on every screen, with the phones work's full-screen button as a sixth, is under "The header's rows" below: the guide is named on a 1920×1080 screen's maximized browser (in the doors' own row beside the board since "One screen", the trophy named too; over the board it was a 685 px page, a 653 one with a bookmarks bar), an iPad mini and an iPad held upright, a phone 371 px wide or more with full screen (399 without: an iPhone Plus or Pro Max), a phone on its side with a 297 px column (780×320, 844×390 and up), a window 500 px tall or less with a mouse, and a laptop's column without full screen (1366×657: five icons leave it room); it's its book on narrower phones, a laptop's column of six icons (1366×657) and pages of 592 to 648 px (552 to 608 without full screen). (At first, with the full screen in the row, a 1080p desktop's browser and the iPad mini showed both doors as bare icons.)
- **A laptop's column** beside the board gives both doors a row of their own, with their pictures and names, under the icons (50 px: 130 → 178 at 1280×800; the board doesn't move), but only where the column still ends above the board's bottom with the chatter's log full (five lines): a window 700 px tall or more (780 with touch) and a column 236 px wide or more. (Since "One screen" the column is the board's height and the chatter what's left of it, so the row costs the chatter lines where it's short, never a scroll; a 1080p desktop's browser has the column now, and the row.) Elsewhere the doors stay in the icons' row, where the trophy always was, and the column is as tall as before. At first the row was there from 501 px: watching at 1280×520 the page scrolled, at 1366×657 it did once the chatter filled, and in an 800×600 window's 216 px column each door took a row of its own (92 px).
- An upright phone keeps its buttons on one row, and a phone on its side its three rows (see "The header's rows").
- **G** opens the guide, and H the Hall of Fame (or Your story, if that's where you were), never the guide. In the book, H and G go to their tab, or close it from there; Esc closes it. The book is named for its tab, and a door opens it at its top.
- **How to play** on the start card, beside Play with friends, opens the guide at a new first section, **The basics**: Winning, Steering, Crashes and Hunger, in the renderer's own pictures (your snake in the win's confetti, your head with a turn ahead of it, your head dazed with its stars, a tag's hunger bar).
- **Field guide** on the napping card: a nap is when people read.
- **Your death's card**, playing alone, names what got you: "Field guide: Crashes" (or Hunger, Fire, Holes, Golden leaf). It opens the guide at that row, scrolled into view and lit in Honey for 2.4 s (with reduced motion, lit and still); focus goes to the book's Close without scrolling the page back up (at first it did, so Fire, Holes and, on a phone, Golden leaf were lit out of sight), and the book's tabs and its × stay at the top of its page as it scrolls, inside its ring, where they were at rest. (Opened at a row far down, the × had gone up with the page, 460 to 990 px off a phone's screen and on its side 36 to 109 px for Crashes and Hunger too, with the focus ring round it; a phone held upright had only 8 to 16 px of backdrop beside the book to tap instead.) The lit row is wholly in view under them. **The round's card**, when your death ends the round (you came second, or a draw: about one losing round in three, and the closest), is your death's card: it says how you died, so it names what got you too (it had no link), and so does the round's card after your death's. The fullest card, a first good round's with the new best's badge, the carve and the link, fits its board with the longest reason a round gives ("You crashed head-on into Capricious, the same length: both out · 4th place · score 128"): up to 403 px the death's quip waits while the carve is offered (on a 390 px phone's 382 px board the card scrolled 15 px with it), up to 340 the badge gives way to the carve (as it did under 300; it was 330, and a Galaxy Fold's cover screen's 336 px board scrolled 6 px), and under 300 the link waits while you carve. The round's card, a line longer, gives way a little sooner (see "The cards, by the board"). Once your name's in ("Carved: Perry.", or "Hall of Fame #4, as Perry." if you had one) the field goes, the row is one line and the link is back (it never came back: the row kept its field, so on those boards every good round's card lost the link). The rename that a field would offer there is the one thing given up, on the smallest boards only. Every rule needs a cue and a lesson; this is the lesson, when it's wanted.
- **The keys** under the board say "G opens the Field guide" too, and the start card's say it instead of H's (a first-timer's Hall of Fame is empty). The touch hints have no room to spare: How to play is their way in.
- *Turned down:* a dialog of its own (the book's machinery twice over); a "?" icon (it reads as help or about; the book matches the name, and How to play on the start card teaches it); a button called How to play (the button should say what its tab says); opening the guide by itself on a first visit (pushy); a "press G" banner (banners are short, and the death card's link does it at the moment it's wanted).

### The cards, by the board

**The cause:** a phone's card (tighter, and the rivals as a row of names: a tag's tap gives how one plays) went by the screen's width, 440 px or less, and the steps for the fullest cards were set on phones held upright. On its side, and in a window 441 to 520 px wide, a board of 381 to 470 px had the desktop's card, and scrolled: the start card 50 px at 381 (844×391, a phone in full screen) and 14 at 397 (a 441 px window), with a rival's note 69 at 404 (896×414) and 37 at 416 (460×900), the fullest death card 15 at 404. The same boards held upright fit.

**The call:** the card goes by the board's size (the board is a size container): a phone's card on any board up to 490 px, which is every phone's, held upright (up to 432) or on its side (up to 490 in full screen), and a short or narrow window's. The steps set held upright hold on its side with the same card: the start card, the nap's, the fullest death card and each with a note fit on every phone on its side from 381 to 440 px, and on a 441 to 520 px window's board. Held upright, and on a board over 490, nothing changed.
- *A Galaxy Fold's cover screen* (344×882, a 336 px board): the fullest death card scrolled 6 px (10 at 340×700's 332); the badge gives way to the carve up to 340 px.
- *568×320* (the first iPhone SE on its side, 266 px): How to play and Play with friends took 215 px of the start card's 214 (the phones work's board is 2 px smaller), so they went onto two rows, the card scrolled 52 px, not 22, and the rivals' names went under Play; at 2 px from their edges and 6 apart they share a row again (205 px), and it scrolls 18 px (22 in the phones work: with the longest names the last of them is half under the buttons' fade, as it was there).
- *The round's card when your death ends it* (it has the carve, the badge and the link then) says a little more than your death's card ("· lasted 2:41"), a line more with the longest reason: while the carve is offered, its quip waits up to 419 px (with it the card scrolled 13 px at 404), and the new best's badge up to 390 (5 px at 382), and a note stands in for the badge and the carve up to 455 (25 px at 422). At 568×320 it still scrolls 10 px with the longest words, past nothing but its bottom edge: everything left on it is wanted.
- *Measured* on 39 screens, from 320×460 to 1920×1080, a real round each (the longest reason, blurbs, quip, win line and note): the start card, a nap, the fullest death card, while you type your name and once it's carved, the next good round's, the round's card when your death ends it, and a note on each. Everything fits but the start card and the round's at 568×320 (18 and 10 px, above). On the smallest boards the last pixels went too: up to 330 px the roll-call's names are 1 px from each other's rows, not 2 (the start card with the longest names scrolled 2 to 3 px at 310 and 312), and up to 300 a note keeps 4 px over the buttons, not 6 (a nap's longest note scrolled 1 px at 266).

### The header's rows

**The cause:** with the phones work merged, the header has six buttons where the browser allows full screen (Android, desktops, iPads): nap, music, mute, the guide's book, the trophy and the full screen. The rows each work had settled for five broke: held upright from 341 to 395 px, Best wrapped onto a third row (the board 28 px lower at 390×844, and on a short phone smaller); on its side and in a laptop's column, the full-screen button wrapped onto a row of its own (48 px, and at 640×320 the chatter lost its last row of words); over the board, the guide's name lost out to it on a 1920×1080 browser (685 px page) and an iPad mini (720), and a window 441 to 482 px wide (512 with touch) put the Hall of Fame alone on a third row.

**The call:** rows for each screen, nothing alone on a row, the board where the phones work put it (the header no taller than it was there, but the laptop's doors' own row), each door named where its row has room for its word with 5 px to spare and Score and Best at four digits:
- **Held upright,** with six buttons: Score and Best beside the title, as on the narrowest phones, and the buttons on a row of their own. The title is as big as leaves the two room for four digits each, and its line keeps the height it had, so the header's rows and the board don't move: 1.4rem at 360 px, 1.63 at 390, all 1.7rem from 400 (with Score and Best in 0.9rem, as at 360). Its size is the page's width less theirs, not the window's (a desktop window's 15 px scrollbar took Best's room, and at four digits it went onto a row of its own from 341 to 410 px), and the tagline (on a phone taller than 720 px, where it shows) is no wider than the title, so four digits fit beside it too: under 354 px it was wider, and at 1000 Score and Best went onto a row of their own (a Galaxy Fold's cover screen, 344 px; it's 0.8rem there now, not 0.85). The guide's word from 371 px, the trophy's too from 428 (427 left it 4.96 px to spare). With five (no full screen: an iPhone) Best ends the buttons' row under Score, as the phones work made it, and the guide's word fits from 399. *Turned down:* Best beside six only where it fits, from 396 px (Android phones would change layouts at 396, and a 412 px one would have no room for the guide's word); 40 px buttons 4 px apart, which fit Best beside six at 360 px, under a fingertip's 44; the full-screen button on the title's row, which leaves Score's digits no longer over Best's; a third row.
- **Over the board** (a desktop, a tablet held upright, a narrow window): Score over Best beside the title, its two lines (the title and the tagline) beside their two, their words to the right and their digits in a column with room for four, in 0.9rem as on a phone, so the pair takes the width of one and nothing moves as they grow. (The room for four was written, but a rule for two came after it and won: at 100 the row wrapped on each step's page, and the header grew 45 px in the middle of a round. At 1rem, four digits cost the row 18 px, and a 1080p browser with a bookmarks bar the guide's name; at 0.9rem, 10.) One row from a 592 px page (652 with touch), the guide's word from 649 (699), both from 716 (756); the buttons 6 px apart up to 727 (767), 8 from there. With five buttons (no full screen: an older Safari, a page in a frame) each step is a button sooner: one row from 552 (602), the guide from 609 (649), both from 676 (706), 8 px apart from 686 (716). (The steps were six's, so without full screen the doors were pictures where their words fit: an iPad, an iPad mini, 1920×945.) Narrower, the title with Score and Best has the first row and the buttons the next, both named from a 384 px page (404 with touch; 340 and 354 with five), the Field guide alone from 317 (347; with five, always with a mouse, 297 with touch). The page is the window less 24 px, or less where the window isn't tall: it narrows with the board (a 460×612 window's is 352: "One screen" took it to 292 for a while, room under the board for its row and the chatter's two lines, until the owner's call put the board first). The steps went by the window, so there the full-screen button went onto a row of its own (a window 450 to 490 px wide and not tall), and under 352 px the title onto two lines beside Score and Best (470×376, the header 32 px taller than the phones work's); under 352 (348 with touch) the title is as big as leaves Score and Best their room, and under 299 a touch screen's six buttons are 40 px, 4 apart. Each step leaves 5 px to spare, Score and Best at four digits; in the stand-in font (offline, where Fredoka never arrives) nothing wraps either, though the first 4 px of a step have less. (Side by side, the two take 155 px at four digits, the stacked pair 73: with the full screen in the row, the guide kept its name only from a 715 px page, and the one row held only from 651.) *Turned down:* a shorter word ("Guide": the button says what its tab says); keeping the full screen out of the row with a mouse (F11 isn't findable).
- **Beside the board,** the title, Score and Best, then the icons. On a phone on its side, or a window 500 px tall or less, the full-screen button takes the column's top corner, beside the smaller title (59 px or more to spare), reaching down beside Score and Best on margins that keep the title's row as tall as it was, so the column has the phones work's three rows (95 px) and the icons' row its five (244 px, as it was designed); there's room for the guide's word from a 297 px column (273 with a mouse: 780×320, 844×390 and up). On a laptop's column the six icons share their row: 34 px with a mouse where they fit (254 px: 1366×657, the guide its book), else 32 px, 4 apart (212 px, in a 4:3 or 5:4 window's 216 px column, 800×600, and a window 230 to 250 px wider than tall, 920×690): the header 158 px, against the phones work's 162 with five (and 204 at 800×600, where the full-screen button had a row of its own). (At first the full-screen button took the corner beside the title, two lines in that column: 176 px, and watching at 920×690 with the chatter full the page scrolled 45 px; it's 27 now, 16 in the phones work, the rest the help's line for G.) With touch, six fit from 294 px; narrower, the title is two lines already and the full-screen button takes the corner beside them (a tablet on its side in full screen, 244: 224 → 182 where it had a row of its own), and a touch column of 264 to 293 px, where the title is one line, has it end Score and Best's row instead (25 px taller). With five icons (no full screen) a laptop's column has the guide's word from 273 px (297 with touch), as on a phone on its side: 1366×657. A tall column keeps the doors' own row, the full screen in the icons' row. A touch column under 244 px (a 4:3 or 5:4 touch screen in full screen) has its icons 40 px, 4 px apart: at 44 the trophy wrapped onto a second row (+52 px).
- **Tested:** `tools/layout-test.js` checks the header on its 24 screens and 33 more (35 since "One screen", with 2560×1305 and 960×945), from 360×640 to 1920×945 (short narrow windows, 920×690's column and five buttons among them): its rows as designed for the screen, no button alone on a row, the full-screen button ending a row, each door its picture only where its word (put in to see, 5 px wider) would wrap the row, the guide's tooltip and spoken name, the guide's door costing the header no height, the header no taller than the phones work's, and Score and Best at 1000 moving nothing (1083 checks in all). `tools/ui-test.js` checks each step over the board, its page and a pixel under it, with six buttons and five, a mouse and touch, and at each, Score and Best at 100 and 1000 moving nothing.

**Tests:** `tools/ui-test.js` (new) checks the note's ways in and out and every door to the guide, with a mouse, keys and touch, on a desktop and on phones at 390 and 320 px, and the phones' header. Since the fixes it also burns you up (Fire's row, far down the guide, lit and in view, on a desktop and both phones), checks the header over the board at 1920×945, 1920×913, 1920×1080, a 1000×860 window, an iPad mini and an iPad upright (one row, the guide named where designed; since "One screen" the three 1920s have the column beside the board and the doors' own row, and the 1000×860 window two rows) and in windows 460 px wide and 500 with touch (two rows, both named), and as Score and Best grow to 1000; the phones' header at 390 and 320 px; the column at 1366×657 and 1280×800 watching with the chatter full (no scroll); and a real first good round's death card, with the longest reason, on phones from 320×460 to 428×926, with a note and without, and at 320×460 carving your name and the next good round. Since the last check: the book's × on the screen when a death's link opens it far down, and a real click or tap on it closing the book; the round's card naming what got you when your death ends it, and opening the guide there; the header at every step over the board (above); 920×690's and 800×600's column, its six icons in a row and no taller than the phones work's, and 1366×657 without full screen, the guide named; the start card and the fullest death card, with the longest reason and quip, a note or not, on phones on their sides (844×391, 896×414, 929×430, 972×450) and on a Galaxy Fold's cover screen (344×882), and the round's card when your death ends it at 390×844, 844×391 and 896×414; and the start card's two links on one row at 568×320: 233 checks. A rival's banner is timed again when round news takes its place, as it may.


### Burrows grow shut

Its rules are in `04-food-and-the-world.md` under the same name, and its text as it was, with how it was tested and
measured, in `docs/archive/design-food.md`.

### A body over a pit, smooth

Its rules are in `03-the-snake-as-a-character.md` under the same name, and its text as it was, with the finding, its cause
and how it was tested, in `docs/archive/design-looks.md`.

### Rainbows upright

**The cause:** `drawRainbow` (`render/weather.js`) drew the arch round a centre level with the golden apple. From an apple in the log's upper half there was no room over it, so it deliberately hung the arch downward, red outermost at the bottom: a rainbow upside down.

**The call** (27 October 2026): always upright, red outermost. An apple in the lower half keeps its arch. For one in the upper half the arch is part of a great circle centred 1.15 boards down, below the log, passing through the apple: it rises out of the apple, over, and down off the far side (the side of the board farther from the apple), ending where the circle leaves the board's bottom (well beyond the far edge). (Its numbers were replaced twice since, below.)

**Where its top is** (27 October 2026, after PR #57 put the top 0.06 of the board from the top edge with the radius fixed at 1.09 boards, which left an apple near the middle of the top half showing only the rising side): the arch's top is half way from the apple to the far edge, so the arch is even between them and comes back down to the apple's height at the far edge. The side is the far side by the apple's column, fixed for that rainbow (the board has an even number of columns, so no apple is in the middle), and within each half the arch changes smoothly as the apple's place does.

**Rounder, and the same in both halves** (27 October 2026, the owner on the follow-ups PR #61 left open: "And I agree, queue!"; this PR): with its centre 1.15 boards down, an arch over a short stretch was shallow (from an apple by the middle it rose about a cell), and an apple in the lower half kept the old half circle round its own height, so one low near the middle showed only its rising side. Now every rainbow, from either half, follows the one rule: up out of the apple, its top half way to the far edge, down to the apple's height at that edge and on off the board. Each is the same round arch, its centre below the apple by half the arch's half-width (d, half the way to the far edge): its radius 1.12 d, its top 0.62 d above the apple, the arc from the apple to the far edge 127°. From an apple by the middle (d about 6.25 cells) it rises 3.9 cells, from one low by a side edge 7. Where its top would come nearer the top edge than 0.06 of the board (or half the apple's height, for an apple in the top 0.12 of the board), it's flatter instead, its centre lower so its top is just that, and the change is smooth where the two meet. A low apple's arch is smaller than the old half circle (whose top was 0.1 of the board from the top edge from anywhere), but it's always whole. render-test checks twenty apples, left, middle and right, high and low in both halves, and that from one by the middle, high or low, it rises clearly (its glow's top over 4.5 cells above the apple's middle; 5.2 now, 2.25 before).

### Hunger on the body

Its rules are in `03-the-snake-as-a-character.md` under the same name, and its text as it was, with how a new player's
starving rate was measured, in `docs/archive/design-looks.md`.

### The phone gap

**The finding** (the playtest of 20 October, queue item 3): on an upright phone there was empty space between the board and the controls: the woodpecker's ledge, 34 to 49 px (49 on a 390×844 phone), between the board and the row under it, and at heights in between a 25 px sill under the board for it (see "The woodpecker's perch" in `31-phones.md` and "Held upright on a phone" in `33-one-screen.md`, which this replaces where they differ).

**The call** (27 October 2026, the queue's words: "Put the speed/help row and the chatter right under the board. The woodpecker perches at full size over that row, and taps pass through it. The chatter is folded by default to a one-line strip of the newest line, and a tap opens it."):
- *The row under the board* (the help, or the speed buttons while you watch, and the chatter's switch) is right under the board, 6 px under its frame (2 on a phone less than 1.7 times as tall as wide), and the chatter right under that. The ledge (`#perch-ledge`) is still laid out, 0 px tall: it tells the page and the bird that the phone is upright. The board is as big as fits over the row, up to edge to edge: with no sill, a phone of a height in between has a board up to 25 px bigger. The frame's bottom moss and corner leaves, which hung 12 px into the ledge, are left off there (`.snug`, as on a short phone before): over the help and the switch they're clutter.
- *The woodpecker* perches at full size over that row, its crown just under the board: 80 px of drawn bird on a 390 px phone (73 to 88 from 360 to 430 px wide; on the old ledge it was shrunk to fit, at least 48). Its room runs from the board's bottom to the screen's, inside the safe area; the row and the chatter don't stop it (game/screen.js `placeBoard`), so on the shortest phones, where the row is slim, it stands down over the chatter's strip too, and only where the screen's foot is near (320×460, 375×548: 33 px) is it smaller. Its layer takes no taps, so a tap on the help, a speed button or the switch under it goes through.
- *The chatter* was folded by default (open where there is room since "The phone's bottom", below): a strip of one row, the newest line cut to it, with a down caret at its end. A tap anywhere on it opens it to as many whole lines as the screen leaves (with its caption and an up caret, where there's room for two rows); another tap folds it. Mid-round the tap opens it (game/input.js treats the chatter as a button there), and a swipe started on it still steers. Folded, the rivals' long lines also show in their bubbles on the board, as in any strip. Folded or open isn't remembered: each visit starts folded. With no room for a row, no panel, as before.
- Everywhere else (a tablet, a desktop, a phone on its side) nothing changes.

**Tested:** `tools/layout-test.js` on its upright phones: the row at most 6 px under the frame and the ledge 0 px tall; the bird perched under the board, over the row, at least 48 px tall where the screen's foot allows (the room to it less 8 px elsewhere), and the switch and the chatter taking a tap under it (its layer's `pointer-events: none`); playing and watching with the chatter full, folded to one row of the newest line, a finger's tap opening it to whole lines with the board unmoved and nothing scrolling, and another tap folding it. Pictures: `tools/dev/phone-gap-shots.js`.

### The phone's bottom

**The finding** (the owner, 28 October 2026, queue item 1b++, with two screenshots): on an upright phone, watching, the
folded chatter's strip touched the speed buttons' rims; it started folded though nothing else used the screen under it;
and the woodpecker looked too small down there. "It is important that it is big ... It should stay much more
consistent. And it it purches on and interact with us elements down there, then that just looks cool really."

**The call, as built** (it replaces "folded by default" in "The phone gap" above):
- *The chatter keeps the row's gap.* Open or folded, its panel starts 6 px under the row under the board (`--over-foot`,
  the gap the row keeps under the board); before, the folded strip sat flush against the row, 0 px.
- *Open where there is room.* At the start, and as the phone turns or changes size, the chatter opens (its caption and as
  many whole lines as fit, down to the screen's foot, its safe area kept) wherever three lines of a row fit open; only
  where they don't (375×667, with its 83 px) does it start folded. A tap folds or opens it, and that choice is kept
  (`snake-chatter-open`, `open` or `folded`, read and written in try/catch; game/screen.js `fitChatter`).
- *The woodpecker, one size.* Measured before the change: perched under the board it was already the size it is on the
  board (scale 1 in every phase, 78 to 80 px of drawn bird on a 390×844 phone, drumming 78 to 85), at all four phones;
  only on a phone under about 600 px tall did it shrink (to 0.51 at 375×560), which is outside this entry. So its size
  is unchanged, and what looked small is its slim perched profile beside the 44 px buttons (its question and answer: `docs/archive/progress-done.md`, "For the owner, answered").
- *It plays with the controls.* Under the board it clings to a button's rim where one is near (2.5 of its units, about
  34 px on a 390 px phone): its toes on the side of a speed button or the chatter's switch, facing the button and its
  spot, as it clings to the log; resting there, every 3 to 7 s it pecks at the button, two quick taps (render/bird-perch.js
  `perchFor`, render/bird-draw.js `headAndEye`). Going from one spot to the next it hops from rim to rim. It still
  never covers a cell, stays on the screen and clear of the frame's moss and leaves, and taps pass through it (its
  layer's `pointer-events: none`, as decided on 20 October). With reduced motion it clings but doesn't peck.

**Tested:** `tools/layout/13-the-phones-bottom.js` (layout job 2), at 390×844, 360×780, 412×915 and 375×667, playing and
watching, the chatter open and folded: no button, the help or the chatter's panel meets another; the chatter's gap under
the row at least the row's under the board; the chatter starts open exactly where three lines fit open; a tap's choice
kept on the next visit; a real tap on a speed button under the perched bird presses it; and the bird's scale the same
perched under the board, flying and drumming on it.

### Wildcard's hair

Its rules are in `03-the-snake-as-a-character.md` under the same name, and its text as it was, with each hair before
it, in `docs/archive/design-looks.md`.

### Copycat's face

Its rules are in `03-the-snake-as-a-character.md` under the same name, and its text as it was in
`docs/archive/design-looks.md`.

### The rival line-up

Its rules are in `39-the-rivals.md` under the same name, and its text as it was, with how dealing went before, in
`docs/archive/design-rivals.md`.

### The woodpecker, 1.3 times

Since grown again ("The woodpecker, as big as it gets"): its size now is in `38-the-woodpecker.md` under that name, and
this section's text as it was, with what it measured, in `docs/archive/design-woodpecker.md`.

### The woodpecker, as big as it gets

Its rules are in `38-the-woodpecker.md` under the same name (with "Clear of the row's words (2k+)" and "Bigger on a
phone"), and its text as it was, with how it was tested and measured, in `docs/archive/design-woodpecker.md`.

### The woodpecker pecks beside a snake

Its rules are in `38-the-woodpecker.md` under the same name, and its text as it was in
`docs/archive/design-woodpecker.md`.

### Flags that bend under a snake

The owner (29 October 2026; entry 2l): Sovereign's banner and Colonist's flags bend over while any part of any snake lies
on their tile. The pole tips from its foot the way that snake stepped onto the tile, and the cloth trails behind and
droops. The snake already on it keeps it; when it leaves, another snake there takes over and the flag eases to the new
way. A north or south push also leans the flag out to its cloth's side (east), because a pole leaning straight along a
body lay hidden on it. North stretches the pole a touch and hangs the cloth; south shortens the pole. While a flag
leans it is drawn over the snakes, since under them it couldn't be seen. Freed, it springs upright with a wobble that
dies away in under a second. With reduced motion it leans and stands up at once. The banner bends only at rest on its
cell, never while it glides or pops up at a new capital. A flag that falls into a pit drops its bend.
Drawing only (`bendOn` in `render/flags.js`): each screen draws it from the snakes it has, so online play needs no
protocol change, and the simulation doesn't load the renderer.

### Flags in depth, hit head-on (2p)

The owner (30 October 2026): "the flag bends now. But i would like to give it some perspective also. So people that pass
behind it, dont show up in front of it. They should be behind it. Also, it doesn't quiet know what to do when a snake
hits it dead on, so that must be accounted for. And it should also react to soverign and colonists hitting it."
- **In depth.** Every flag and banner is drawn over the snakes (`drawBentFlags` in `render/flags.js`), upper rows first, so
  anything on the tiles behind it goes under its pole and cloth. Over the row in front of it, it is cut away where a
  snake lies (`clipFront`: each body cell a fifth of a cell above its row for its outline, a head's a third for its face), so
  whatever stands in front hides the pole's foot.
- **Head-on.** A head that comes onto the tile from the north or the south has no side to push the pole to: it is knocked
  flat ahead of the head (`look[4]`, how flat: laid towards you, the pole turns right round and lies down the screen; laid
  away, it lies up it), and for `WRAP_MS` (260 ms) its cloth is wrapped round the head, over it, its ends folded back along
  the head's sides (`wrapCloth`). Then it lies under the body, drawn under the snakes, and springs back as any flag does
  once the tile is free. A flag laid away swings up through upright as it springs back, never flattening towards you. With
  reduced motion there is no wrap.
- **Owners.** Sovereign over its own banner and Colonist over its own flags bend them as anyone does (they already did;
  a render test now proves it). What looked wrong was the head-on case, which owners meet most, heading for their own
  flag.
- **Planted under a snake** (PR #255, polish). A flag that wasn't on the board a moment ago (not drawn in the last frame drawn, by frames, not ms, so watching at 4x never counts a flag in sight as new; Sovereign's banner counts as in sight while it glides)
  and turns up with a snake already on its tile, as each new colony does under Colonist's head, is bent from its first
  frame: never seen standing, it doesn't stand for a frame and then snap over, and a head-on one lies flat under the
  head without wrapping the face that planted it.
- Drawing only, from the snakes each screen has: no simulation, no protocol change.

### Beetles and the woodpecker

Its rules are in `04-food-and-the-world.md` under the same name.
