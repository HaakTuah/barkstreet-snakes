## The owner's playtest

The owner played the live game (6d478ed) on a desktop and sent three findings, from a napping round (Ouroboros, Metagamer, Gobbler, Copycat):
- Ouroboros went round and round right next to a golden apple and wouldn't eat it; with more play, it let almost all food by the edge go ("it approaches it, but cuts off before eating it"). Does any other rival do it? Beside fire, a hole, another snake?
- Clicking a rival's name tag while napping showed its description, and the Napping card took it back after a second or two.
- The Field guide isn't obviously behind the trophy.

### A meal isn't a pin

**The cause** was the neck test's allowance for a head pinned against something (`PINNED_DAWDLE`, 8: see "The rivals look further ahead"), not Ouroboros. Every rival did it, and beside holes, fire, the woodpecker's mark and bodies as well as the edge.
- The rivals look three moves ahead. Eating food on the edge from two away, every line that eats ends with the head still on the edge: one or two ways on, and no room before them. That's a neck right by the head, and it was a trap if any rival could get to both ways on within 8 ticks of the snake (about any rival within a dozen cells, on a 24-cell log). A trap costs 2,400–3,400; the meal was worth 150–500 to Ouroboros (850–2,500 to Gobbler).
- So every line that ate lost to one that stayed a row in, and the snake turned off a cell or two short. A move later the food was out of its three-move window, the food's pull brought it back, and it turned off again: the circling.
- In the AI's own terms, at the turn-aways with room to spare and no head within 6 cells: the pin decided 64% of them at the edge and 57% in corners (none in the open); Ouroboros's coiling, 3%.
- The allowance's reason ("I don't always leave a pocket straight away") doesn't hold just after a meal: the line is there only because the food was, and it leaves on its next move.

**The call:** for 3 moves after a line eats (`MEAL_PLIES`), a neck's allowance is 2 ticks (`MEAL_DAWDLE`): only a head that could get to the gap about as soon as the snake (one that could cut it off) makes it a trap. Everywhere else the neck test is as it was. A jump or a flash that eats on its way counts as a meal too. It's a dozen lines, with no wider search and nothing more to think about.
- *Turned down:* only the pinned neck (corners stay shy: the deeper necks there are its own body); a lower `PINNED_DAWDLE` everywhere (it's the boxed-in dial, and not about food); searching on past a meal (a sixth more lines to score, and a bias toward lines that eat); leaving food cells out of the neck test (it would drop the real refusals too).
- *The screenshot's apple:* dimmed, with something above it and no glow, it reads as a rotten green apple and its fly (a golden apple only dims in its last 3 s, its glow and sparkle with it). It changes nothing: a rotten apple is worth its full 1 to a rival, a dim golden one its 3, until it would be gone before the rival got there. A golden apple at (2, 1) by the corner isn't a pin by itself; refusing it took a body beside it (Ouroboros's own coil) or a rival within a dozen ticks, which is what this fixes.

**Measured** (600 AI-only rounds a seed, seeds 3 and 11, "before → after", as `tools/simulate.js` plays them; food eaten counts every time a snake that's the nearest head, with a way there, comes within 2 cells of it):

| | Seed 3 | Seed 11 |
|---|---|---|
| Apples and golden apples eaten: in the open | 89 → 89% | 88 → 89% |
| ...on the edge | 50 → 79% | 50 → 79% |
| ...in a corner | 66 → 82% | 64 → 82% |
| ...beside a hole, fire or the woodpecker's mark | 58 → 71% | 56 → 71% |
| ...beside another snake's body | 57 → 73% | 57 → 73% |
| ...beside its own body | 66 → 74% | 65 → 73% |
| Golden apples eaten on the edge | 61 → 90% | 60 → 89% |
| Each rival on the edge (lowest–highest; Ouroboros) | 39–60 → 64–86% (47 → 78) | 40–60 → 66–87% (49 → 79) |
| Turned off food by the edge with room to spare and no head within 6, per 100 snake-rounds | 157 → 34 | 155 → 34 |
| Circling (3 or more turn-offs from the same food), by the edge or in a corner, per 100 snake-rounds | 45 → 10 | 47 → 11 |
| Hanging about food (within 5 cells for 3 s), per 100 snake-rounds: all; apples; golden | 12.0 → 6.7; 4.3 → 0.8; 0.4 → 0 | 12.2 → 6.6; 4.1 → 0.4; 0.1 → 0 |
| Median round; sudden death | 172 → 165 s; 52 → 45 s | 172 → 166 s; 52 → 46 s |
| Deaths in holes; starved | 20 → 14%; 2 → 1% | 20 → 17%; 3 → 1% |
| Deaths before the woodpecker, a round | 0.57 → 0.69 | 0.48 → 0.70 |
| Win rates | 19–34 → 18–35% | 17–33 → 16–33% |
| Ouroboros coiled (field) | 42 → 38% (14 → 13) | 42 → 39% (15 → 13) |

- **The rest of it:** what's left of the hanging about is beetles, and some of that is the fix's own. The strictest count, within 3 cells for 3 s, was already mostly beetles, and beetles went up: 0.8 → 1.5 / 1.1 → 1.8 per 100 snake-rounds (0.8 → 2.2 on a fresh seed, 41), apples and golden apples 0 → 0.1 / 0 → 0. Nine in ten are a beetle on the edge or in a corner with a well-fed snake a cell or two off, shadowing it along the edge: the fix makes a line that catches a beetle there worth taking, and the beetle moves on first. About half end in a catch (beetles caught: 92 → 94%); those that don't went 9 → 15 / 17 → 22 in 600 rounds. Round six's rivals (feature/powers-2), who see food where it is now (these see it a reaction time late), hang about no beetle at all (seed 3), with the fix or without. If this ships first, the shadowing comes with it; a beetle-only exception in the neck test was turned down. The edge's share of the meals against its share of the food's time on the log: 0.44 → 0.59 / 0.45 → 0.60 (1 is "eaten as often as it lies there"). Every rival is in it: the lowest on the edge, Vulture (it lives on beads), went 39 → 70 / 40 → 66%.
- **The cost:** rounds a little shorter, and more snakes out early, most of them into themselves. In 600 paired rounds on a fresh seed (41, each round dealt the same both ways): the median round 171 → 166 s (−5 s, between −8.6 and −1.8), sudden death 51 → 46 s. Deaths before the woodpecker (above; 0.50 → 0.66 on seed 41): self-crashes 1.5 to 2 times as many, 0.085 → 0.127 / 0.083 → 0.145 a round (0.057 → 0.115 on seed 41), and crashes into others 0.40 → 0.49 / 0.33 → 0.48 (0.36 → 0.47). It isn't the meals by the edge themselves: per meal, deaths within 15 ticks of one don't rise (seed 41: by the edge 7.0 → 5.1 a thousand meals, in a corner 15.4 → 4.7), and most of the extra self-crashes come 16 ticks or more after the snake's last meal. It's length: snakes eat more (54 / 55 → 59.5 food a snake-round) and are 10–15% longer from a minute in (seed 41: 22.8 → 25.2 cells at 60 s, 30.1 → 34.6 at 90; 27.9 → 33.3 at an early death). `MEAL_DAWDLE` isn't the dial for that: at 4 the diagnosis measured the edge at 71% and corners at 78%, still with 0.60 early deaths a round, and the pinned neck alone 0.64, against 0.48 (seed 11). If the old pace is wanted back, growth or food is what to tune, not the neck test.
- **Mason** gained most: its walls run along the edges, and now it eats there (30 / 36%, from 22 / 27). It claims a little less territory, 1.6 from 1.8 (as in round four, when the board split started counting): 25 / 25%, its straight runs as they were (3.53 / 3.48 cells, against the field's 1.90). That moves every round Mason's in, and Copycat, who copies whoever's winning, came out at 35.2% on seed 3, one win over the band's top (43 of 122; 28% before Mason's change, and on seed 11 it went the other way, 26 → 21%): luck, not a lean. 1.7 was tried and put Gobbler at 12% on seed 11.
- **Character:** every trademark is about where it was. Ouroboros coils a little less (above), still three times the field; Joker's luring, the thinnest lead, is 8.6 / 8.3% against the field's 8.3 / 8.1 (9.2 / 9.0 against 8.5 / 8.3 before).
- `simulate.js 60 --seed 3` gives 829665990 with and without `--ahead`; fingerprints 574216369 / 762530038.

**Tests:** `tools/rules-test.js` stages it in the game, every rival hungry enough that taste doesn't decide (4 s before it starts shrinking) and another snake about ten ticks off: every rival takes an apple on the edge, a golden apple in the corner (along either edge), the golden apple by the corner from the screenshot, and an apple beside woodpecker holes, fire or another snake's body, within a few ticks (on main every rival left the edge's and the corner's, 11 the holes' and the fire's, 7 the body's; the screenshot's own spot was taken); and every rival still refuses an apple in a pocket of holes too small for it, in a channel a cell wide with a rival's head at its far end, on the edge with a rival's head two along the edge coming at it, and a golden apple in the corner with a head coming up the other edge.

**With round six A** (merged in after it shipped): round six A carried this fix onto its own AI (981842d: the same `MEAL_DAWDLE` and `MEAL_PLIES`, a jump's or a flash's meal counting too) with these tests, adapted to its rivals, and measured its rivals with it in (see "Round six A, measured"). So `ai.js` and `tools/rules-test.js` are round six A's: Mason's `territory` stays 1.8 there (its band was measured that way; the 1.6 above was this build's call, on the rivals before round six A), and the numbers and fingerprints above are this build's, before the merge. After it, `simulate.js 60 --seed 3` gives 78597151 with and without `--ahead`, as round six A does: the rest of this work is the page's, not the rules'.

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

**The finding** (the playtest of 20 October, queue item 3): past three burrows the stalest one closed over at once, in about a second, which looked abrupt.

**The call** (27 October 2026):
- **The rule.** A new burrow that opens while three are open (`BURROW_MAX`) starts the stalest growing shut. It takes a random time between `BURROW_SHUT_MIN_MS` and `BURROW_SHUT_MAX_MS` (6 and 14 s of game time; the engine's seeded randomness) and then closes over. The cap counts only open burrows, so there are three most of the time and briefly four. A dig nearer than `BURROW_SPACING` to a burrow also starts that one growing shut, instead of closing it at once. While it grows shut, a scared beetle can still run for it and dive in, but none comes out of it: `freeBurrow` skips it, so a beetle below comes up out of an open one, or waits.
- **The rivals** read it by the same rule, from `view.burrows` (each one carries `shutFrom` and `shutAt`): a burrow growing shut is a home a scared beetle runs to and dives into until it closes, as in the engine. A beetle doesn't come up out of it, and the AI never predicts where one comes up anyway. (A first build dropped a burrow from the AI's homes in its last second. The review caught that the engine has no such rule, so it was removed.)
- **The cue** (`drawShutting` in `render/food.js`), evenly over its time (it was eased out at first, which looked done by a third; see "The cue, evened out" below):
  - the opening's area shrinks evenly to a tenth (`SHUT_HOLE`), keeping its dark rim, as sawdust fills in from the rim, lumps of it creeping over the opening's edge; its pale rim and specks round it stay;
  - the bark's grain grows across it, along the log;
  - four cushions of the log's moss grow in over the rim one after another, each to about a third of a cell across;
  - its cracks fade to half.
  At the end comes today's closing over (`drawHeals`): it starts from the look it had grown to, packs the plug in under its moss, then the big cushion and the fade. Then a faint scar (a greyed oval of sawdust with the grain across it) stays where it was, fading over `SCAR_MS` (20 s).
- **The sound:** silent while it grows shut, then today's crumble (`heal`) as it closes over.
- **The lesson** (once a round, once the burrow's lesson is told, the first time the banner is free for one starting to grow shut): "Old burrows grow shut: beetles go in, none come out." It replaces "Past three burrows, the stalest one closes over.", and the wording with "Past three" didn't fit on one line on a 320 px phone.
- **The Field guide** (Beetles): "A burrow left unused grows shut (past three, the one unused longest): beetles still go in, but none come out."
- **Online** (protocol 11): each burrow row carries `shutFrom` and `shutAt` (−1 while it's open), checked before it's drawn (a row that shuts before it started counts as open). There is a new event, `['shut', x, y, at]`, for one starting to grow shut.

**Tested:**
- `tools/rules-test.js`:
  - the stalest starts growing shut within 6 to 14 s, and stays meanwhile;
  - none comes out of it;
  - a scared beetle still dives in;
  - it closes over on time;
  - a rival reads a beetle bound for one as going in;
  - the cap's tests, now with growing shut.
- `tools/online-test.js` crosses the rows and the event, and feeds the guest malformed ones.
- `tools/render-test.js` checks the opening shrinking with sawdust and moss coming in, the closing over from there, and the scar gone after 22 s.
- `tools/input-test.js` checks the lesson and the sound.

**The cue, evened out** (27 October 2026, PR #55). Haakon: "Yes, you can try that and see if it adds to the game! Review it afterwards and make an expert call." Staged frames at 0, 1/3, 2/3 and 0.95 of its time had shown it all but done by a third (the plug drawn at full width early, the opening's rim and specks covered) and two thirds and nearly shut alike, the moss only small flecks. Now it goes evenly (above), the moss in cushions that read at phone size, and the scar a little stronger (0.45, was 0.3). With reduced motion nothing changes in it: it is a slow change of look, not motion, and the closing over keeps its calm version. The Field guide keeps its longer line over the spec's "A burrow left unused grows shut.": that alone reads as a timer, and the longer line says which one (past three, the one unused longest) and what it means for play (beetles still go in, none come out). `tools/render-test.js` checks the opening's dark pixels and the sawdust and moss in it changing by like steps each third, and the moss over a good part of a cell by the end. `tools/dev/burrow-shut/frames.js` stages the frames.

**Measured** (600 rounds each, seeds 3 and 11, against e55855a):

| | Before (seed 3 / 11) | After (seed 3 / 11) |
| --- | --- | --- |
| Chased beetles escaping | 25.4 / 25.5% | 24.8 / 25.9% |
| Burrows open, on average | 2.02 / 1.98 | 2.07 / 2.04 |
| Round, median | 166 / 166 s | 165 / 166 s |
| Deaths by cause | as they were, within a point or three | |

Escapes stay inside the 20–35%. The simulation's check passed on both seeds.

### A body over a pit, smooth

**The finding** (the playtest of 20 October, queue item 3; the owner: "The part of you that is over the hole gets a really odd outline"): over a pit, the body's round segments bulged above its line and its cream rim seemed to go.

**The cause:** over a pit a span is drawn slimmer (round six A: it sags, see "Bridges and jumps you can see" in `27-round-six-a-fairness-and-fixes.md`), but its segments stay a cell apart, so they parted: round beads above a thin band between them, the outline scalloped round each bead, and the shade underneath drawn as a crescent on every bead and a narrower strip on each band. Measured, the top of your body varied 0.09 cells along a span (0.05 on the bark).

**The call** (27 October 2026):
- **The bands fill out** (`bandR` in `render/lead.js`): over a pit, a band's half-width eases from `PINCH` of its segment's radius to the narrower of its two segments' radii, by how far over the pit they are. Never past either: a head over the pit (it doesn't sag) or a gulp stays round, its band no square shoulder. What's up in the air keeps its pinch. Every shape a body is drawn with follows it: the body, its outlines and rim, the gold line, its shadows and the land's colour round a rival. So the span is still slimmer by the same sag, but its line and rim are as smooth as on the bark (the top edge now varies 0.00 cells). Its sheen dots stay, one a segment, so you can still count them.
- **Shaded as one body** (`shadeUnder`, `shadeBands` in `render/bodies.js`): a straight run over the pit is shaded by a strip along its lower side (its right one going down), drawn after the segments so it runs on through them, each half of a band in the darker step of the segment it's nearer. A round segment (`roundAt`: an end, a turn, or one more than a unit wider than its bands, like a head or a gulp) keeps its crescent, and the strips by it and round a turn go down before the segments, which cover their ends.

**Tested:** `tools/render-test.js`: you across a hollow three cells wide, its top edge level along the middle of it and the cream rim as thick as on the bark; then your head over it and your neck on the bark, no band wider than either of its segments. The bridge check's band sample moved to the wider band's lower edge, and its sag is measured on the whole body, shaded part included (32 pixels across before and after, against 36 on the bark).

### Rainbows upright

**The cause:** `drawRainbow` (`render/weather.js`) drew the arch round a centre level with the golden apple. From an apple in the log's upper half there was no room over it, so it deliberately hung the arch downward, red outermost at the bottom: a rainbow upside down.

**The call** (27 October 2026): always upright, red outermost. An apple in the lower half keeps its arch. For one in the upper half the arch is part of a great circle centred 1.15 boards down, below the log, passing through the apple: it rises out of the apple, over, and down off the far side (the side of the board farther from the apple), ending where the circle leaves the board's bottom (well beyond the far edge). (Its numbers were replaced twice since, below.)

**Where its top is** (27 October 2026, after PR #57 put the top 0.06 of the board from the top edge with the radius fixed at 1.09 boards, which left an apple near the middle of the top half showing only the rising side): the arch's top is half way from the apple to the far edge, so the arch is even between them and comes back down to the apple's height at the far edge. The side is the far side by the apple's column, fixed for that rainbow (the board has an even number of columns, so no apple is in the middle), and within each half the arch changes smoothly as the apple's place does.

**Rounder, and the same in both halves** (27 October 2026, Haakon on the follow-ups PR #61 left open: "And I agree, queue!"; this PR): with its centre 1.15 boards down, an arch over a short stretch was shallow (from an apple by the middle it rose about a cell), and an apple in the lower half kept the old half circle round its own height, so one low near the middle showed only its rising side. Now every rainbow, from either half, follows the one rule: up out of the apple, its top half way to the far edge, down to the apple's height at that edge and on off the board. Each is the same round arch, its centre below the apple by half the arch's half-width (d, half the way to the far edge): its radius 1.12 d, its top 0.62 d above the apple, the arc from the apple to the far edge 127°. From an apple by the middle (d about 6.25 cells) it rises 3.9 cells, from one low by a side edge 7. Where its top would come nearer the top edge than 0.06 of the board (or half the apple's height, for an apple in the top 0.12 of the board), it's flatter instead, its centre lower so its top is just that, and the change is smooth where the two meet. A low apple's arch is smaller than the old half circle (whose top was 0.1 of the board from the top edge from anywhere), but it's always whole. render-test checks twenty apples, left, middle and right, high and low in both halves, and that from one by the middle, high or low, it rises clearly (its glow's top over 4.5 cells above the apple's middle; 5.2 now, 2.25 before).

### Hunger on the body

**The finding** (the playtest of 20 October): on a wide desktop the hunger bar on your tag is far from your snake, out of sight, and the owner starved without seeing it come.

**The call** (27 October 2026): every snake shows its hunger on its body, read from the clock its tag reads (`hungerLook` in `render/looks.js`), so you see it where your eyes already are, on yourself and on every rival:
- **It slims** as its last meal runs out: its body (not its head) up to 22% thinner, by the share of the meal gone to the power 1.5, so a snake just fed looks as it always did, a hungry one is plainly thinner, and the change creeps in rather than jumps.
- **It growls** in the warning's seconds (the toast's: 6 s left, 9 at its smallest): two short arcs either side of its head, cream under ink so they read on the bark and on any body, swelling out and fading on each rumble (520 ms, a beat the "Your tummy is rumbling" toast and the rumble sound go with), and its head shakes a little, both stronger toward the end. With reduced motion the arcs hold still and the head doesn't shake.
- **It pales** while starving (shrinking a segment every 1.5 s): a parchment wash over its whole shape, full within the first segment lost. On the palest bodies (Mason's marble, Ghost) it barely shows; the slimness and the growl carry it there.
- The Field guide's Hunger row says it: "A hungry snake grows thin, then growls; one gone pale is shrinking. At 3 it starves. Your bar is under your name."

The rivals are shown nothing new (their own clock was always in `aiView()`, as a person sees their bar); online, the tag already carries `lastAte` and `mealMs` (protocol 8), so a guest sees the same. **Tested:** `tools/render-test.js`, Sniper just fed, with 2 s left and starving: slimmer in its own colour, growl lines beside its head, and starving paler.

**A new player's starving rate** (`tools/dev/hunger-seen/measure.js`): there is no model of a person, so a stand-in. AI rounds with the game's own rules, seat 0 standing in for a new player (a rival plays it), with its view of its own hunger hidden until it would notice it, then a second late: never (the owner on a wide desktop), at the warning toast (before this change), once its body is visibly thinner (5%, at 37% of its meal gone: after), or always (a rival, or someone watching the bar). 

*Measured*, 300 rounds a seed on fresh seeds 61 / 73:

| Seat 0 notices its hunger | Rounds it starved in | Its deaths by starving | Snake-time in the warning (starving) | Wins |
| --- | --- | --- | --- | --- |
| never (the bar unseen) | 6.7 / 9.3% | 9.0 / 12.3% | 14.7 / 16.1% (5.0 / 5.7) | 25.7 / 24.0% |
| at the toast (before) | 1.3 / 1.3% | 1.9 / 1.8% | 13.6 / 13.4% (3.7 / 3.5) | 29.0 / 24.7% |
| from its body (after) | 0.3 / 2.3% | 0.4 / 3.1% | 12.4 / 14.0% (3.0 / 4.4) | 24.3 / 24.7% |
| always | 1.3 / 1.3% | 1.8 / 1.8% | 12.2 / 12.6% (3.4 / 3.5) | 24.3 / 26.0% |

So what starves a new player is not seeing hunger at all: unseen, 8.0% of rounds end in starving (48 of 600); seen in any of the three ways, 1.3% (8 of 600 each). Seeing it earlier on the body adds nothing over a toast acted on at once, by this measure; the stand-in reads 6 s as plenty, as the rivals do. The change is where it shows: the toast is easy to miss, as the owner did on a wide desktop, and your body is where you are looking. A person's real rate needs a person: the owner's next desktop rounds will say.

### The phone gap

**The finding** (the playtest of 20 October, queue item 3): on an upright phone there was empty space between the board and the controls: the woodpecker's ledge, 34 to 49 px (49 on a 390×844 phone), between the board and the row under it, and at heights in between a 25 px sill under the board for it (see "The woodpecker's perch" in `31-phones.md` and "Held upright on a phone" in `33-one-screen.md`, which this replaces where they differ).

**The call** (27 October 2026, the queue's words: "Put the speed/help row and the chatter right under the board. The woodpecker perches at full size over that row, and taps pass through it. The chatter is folded by default to a one-line strip of the newest line, and a tap opens it."):
- *The row under the board* (the help, or the speed buttons while you watch, and the chatter's switch) is right under the board, 6 px under its frame (2 on a phone less than 1.7 times as tall as wide), and the chatter right under that. The ledge (`#perch-ledge`) is still laid out, 0 px tall: it tells the page and the bird that the phone is upright. The board is as big as fits over the row, up to edge to edge: with no sill, a phone of a height in between has a board up to 25 px bigger. The frame's bottom moss and corner leaves, which hung 12 px into the ledge, are left off there (`.snug`, as on a short phone before): over the help and the switch they're clutter.
- *The woodpecker* perches at full size over that row, its crown just under the board: 80 px of drawn bird on a 390 px phone (73 to 88 from 360 to 430 px wide; on the old ledge it was shrunk to fit, at least 48). Its room runs from the board's bottom to the screen's, inside the safe area; the row and the chatter don't stop it (game/screen.js `placeBoard`), so on the shortest phones, where the row is slim, it stands down over the chatter's strip too, and only where the screen's foot is near (320×460, 375×548: 33 px) is it smaller. Its layer takes no taps, so a tap on the help, a speed button or the switch under it goes through.
- *The chatter* was folded by default (open where there is room since "The phone's bottom", below): a strip of one row, the newest line cut to it, with a down caret at its end. A tap anywhere on it opens it to as many whole lines as the screen leaves (with its caption and an up caret, where there's room for two rows); another tap folds it. Mid-round the tap opens it (game/input.js treats the chatter as a button there), and a swipe started on it still steers. Folded, the rivals' long lines also show in their bubbles on the board, as in any strip. Folded or open isn't remembered: each visit starts folded. With no room for a row, no panel, as before.
- Everywhere else (a tablet, a desktop, a phone on its side) nothing changes.

**Tested:** `tools/layout-test.js` on its upright phones: the row at most 6 px under the frame and the ledge 0 px tall; the bird perched under the board, over the row, at least 48 px tall where the screen's foot allows (the room to it less 8 px elsewhere), and the switch and the chatter taking a tap under it (its layer's `pointer-events: none`); playing and watching with the chatter full, folded to one row of the newest line, a finger's tap opening it to whole lines with the board unmoved and nothing scrolling, and another tap folding it. Pictures: `tools/dev/phone-gap-shots.js`.

### The phone's bottom

**The finding** (Haakon, 28 October 2026, queue item 1b++, with two screenshots): on an upright phone, watching, the
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
  is unchanged, and what looked small is its slim perched profile beside the 44 px buttons (see "For Haakon").
- *It plays with the controls.* Under the board it clings to a button's rim where one is near (2.5 of its units, about
  34 px on a 390 px phone): its toes on the side of a speed button or the chatter's switch, facing the button and its
  spot, as it clings to the log; resting there, every 3 to 7 s it pecks at the button, two quick taps (render/bird.js
  `perchFor`, render/bird-draw.js `headAndEye`). Going from one spot to the next it hops from rim to rim. It still
  never covers a cell, stays on the screen and clear of the frame's moss and leaves, and taps pass through it (its
  layer's `pointer-events: none`, as decided on 20 October). With reduced motion it clings but doesn't peck.

**Tested:** `tools/layout/13-the-phones-bottom.js` (layout job 2), at 390×844, 360×780, 412×915 and 375×667, playing and
watching, the chatter open and folded: no button, the help or the chatter's panel meets another; the chatter's gap under
the row at least the row's under the board; the chatter starts open exactly where three lines fit open; a tap's choice
kept on the next visit; a real tap on a speed button under the perched bird presses it; and the bird's scale the same
perched under the board, flying and drumming on it.

### Wildcard's hair

Haakon: "Not a comb-over: his real swoop, a big fluffy golden-blond pompadour swept back, then forward and to one side.
It must read at phone size."

- *Before:* a flat golden patch combed across the back of the head to a small curl over one eye, the same size as the
  head; at phone size it read as a yellow cap.
- *Then* (PR #74, `pompadour()`): the roll swooped forward along one side to a flick past that eye. Haakon (28
  October): "It flips to the front side, you know like a blond emo/goth haircut"; heading up, it read like a turban.
- *Then* (PR #107, `render/faces.js`, `hairBack()` and `hairRoll()`), seen from above with the head pointing +x and -y the
  far side: two shapes, each with a dark amber outline so they read at phone size. Nothing is in front of the brow: a
  lighter raised roll runs along the hairline just behind the eyes (its front edge at x = 0.12 of a cell, no further),
  with a shine along its crest, fuller at the far end. Behind it, the fluffy golden mass puffs out past the head, most
  at the back and the far side; its strands run straight back over the crown and turn to the far side at their ends, so
  the comb reads up, back and round. The eyes, pout and squint are as they were.
- *Then* PR #110's lacquered mop, PR #144's version F and PR #156's F at 85%. Haakon (30 October): "trump looks like
  David Lynch now. I actually think the very first or second hairstyle trump had in the game is better", and picked the
  first, "but have the swirl point upwards instead of downwards".
- *Now* (2n, `render/faces.js`, `hairBack()`, `pompadour()`, `wildHair()`): PR #74's pompadour exactly as it was
  (shape, size, strands, colours and outline), with one change: its lick, the curl at the near end of the roll that came
  forward over the brow to a flick past the eye, is turned round, curling up and back over the hair behind it, its two
  combed strands following it. Two tries that reworked more were turned down; Haakon (31 October): "it looks horrible.
  I want the original hair, but I want the lick reversed. That's all. Keep it that simple."
- Drawn in the head's own frame, so it is the same at every heading, and still: nothing in it moves, with reduced motion
  or without. Capricious's Wildcard mood wears it too. Drawing only.

### Copycat's face

While copying, its head mixes the copied colour about half and half with its red; a thin red rim and the yellow star
pin keep it Copycat. Uncopied, it stays full flag red.

- *Before* (since "Copycat in the flag's red"): its head kept the flag's red whoever it copied, so only its pale body
  told you it was copying, and whom.
- *Now* (`render/looks.js`, `fillsOf()`; the rim in `render/bodies.js`): copying, its head (and its cat ears, with the
  deeper red inside) is its model's own colour, full rather than the body's pale copy, mixed half and half with
  `#de2910` (`COPY_HEAD`, 0.5, in plain RGB). Copying Star it takes the rainbow's hue at Star's head, flowing in step;
  copying Mute, its colour of the moment (Capricious keeps its own pink in every mood, since 3b). A 1.5-unit rim of the flag's red runs round the head inside
  its edge, and the yellow pin is as it was. Copying no one (or its model out), the head is all red and has no rim.
- A colour opposite red mixes to a neutral: Metagamer's cyan gives a grey head, Sovereign's blue a plum one, Vulture's
  black a dark red. The rim and pin keep these Copycat; it's the honest half and half.
- Drawn from what both screens know (its model, synced online as `memory.modelId`, and the model's colour), so host and
  guest show the same head. Drawing only.

### The rival line-up

Who you meet is dealt from a deck, and you may choose instead, seat by seat.

- *Before:* three rivals drawn uniformly from the eighteen each round, with no memory, so a favourite could go a dozen
  rounds unseen and another come three times running.
- *The deck* (`records.js`, `deal()`, under the new key `snake-deck`): this browser keeps a shuffled deck of the
  eighteen and deals from it, every rival once before any comes round again, across rounds and reloads. When it runs
  out, a fresh shuffle goes in behind whatever it still holds. Watching (four rivals) deals the same way. The
  simulator and tools keep the engine's own uniform pick (`pickOpponents`), so fingerprints are unchanged.
- *Choosing* (`game/hud.js`, `openPicker()`; the seats in `game/banners.js`, `buildOpponents()`): on the start card
  each rival is a button with a swap mark; it opens a picker of "Any" and all eighteen, each with its dot and blurb,
  over the page like the Hall of Fame (Escape or × closes it). A chosen seat wears a ring, and on the start card a
  small pin beside it: a tap on the pin sets the seat back to "Any" (`unpinSeat()`). The choice is kept per seat for
  this visit (2u, 30 October 2026: "Didn't expect them to stay permanently"), round after round and across a reload in
  the same tab, in `sessionStorage` under `snake-visit-lineup` (`seats()`, `setSeat()`); the next time the game is
  opened every seat is "Any" again. The old lasting key `snake-lineup` is no longer read (and never renamed). "Any" seats are
  dealt from the deck, which skips the chosen rivals (they stay in it for later). Choosing a rival already in another
  seat swaps the two. Watching from the start card keeps its three and deals the fourth.
- *Online* the host's choice and deck decide. A guest's own choice and deck are untouched. With more people, fewer
  seats are dealt: the first seats' choices count.
  - *In the lobby* (`game/friends.js`, `hostLineUp()`, `renderPlayers()`): the empty seats show the rivals who'll take
    them, "unless a friend joins". The room opens with the start card's line-up (and what the deck dealt for it); after
    each round the next is dealt, shown on the round's card. The host's seats are the start card's buttons, opening the
    same picker (a chosen one wears its ring); the guests see each seat's rival, and "chosen", as it stands. A seat a
    friend takes sends its rival back to the top of the deck, as does closing the room. Closing the page (a start
    card's or the room's rivals never met) sends them back to a random place among the rivals not yet dealt
    (`undeal(..., { anywhere: true })`), so opening the game gives a fresh cast and everyone is still met first.
  - Protocol 13: the lobby message carries the line-up (`lineup`: each seat's rival and whether the host chose it),
    sent whenever it changes; the round message carries the round's as before.
- *The Hall of Fame:* every entry of a round with any chosen rival (yours, the rivals', a friend's) is marked "chosen"
  after its name. Protocol 12 carries the round's `chosen` flag and a shared best round's.

### The woodpecker, 1.3 times

Haakon (29 October 2026): 1.3 times its size, on the board and under it alike (one size; entry 2c). The bird's unit
(`BU` in `render/bird.js`) is 1.3 times what it was, so everything that sizes it (its perches, its room round the board,
its flights, its drum poses, its rims under the board) grows with it, and it stays one size, perched and drumming,
wherever the screen has room for it: about 101 px of drawn bird on a 390×844 phone (from 78), and one size on every
phone held upright from 320 to 430 px wide (83 to 112 px, from 64 to 86), and 177 to 233 px on desktops from 1280×720 to 1920×1080 (from 136 to 179). Where the gutter beside the board
is narrow it still perches a little smaller, as it always has ("with room for it a little smaller", see "The phone
gap"): at 1440×900 it perches at 191 px and drums at 224 (it was 173 for both), and on a phone on its side 96 against
101; a tablet held upright or a 1024×768 window still tuck it into the gutter at 32 to 39 px, as before. It is drawn
only, so play is unchanged: the simulation's fingerprints are identical.

### The woodpecker, as big as it gets

Haakon (29 October 2026; entry 2k): "as big as you can get away with without it falling out of the screen, or being
pushed onto the gameplay screen when not pecking, or anything." Drawing only (`BIRD_GROW` in `render/bird.js`, 1.7
times its first size, from 1.3), so play is unchanged and no simulation was run. Found by trying 1.5 to 2.0 against
the layout and render suites. Two things stopped it first and were fixed (below: its drum poses' room for the aim, the
blow's depth). What stops it now: at 1.8, on an iPhone SE held upright (375×667) the room under the board is too short
for it whole, so it would perch at 0.98 of the size it drums at, no longer one size (2c). Measured (drawn bird, CSS px,
1.3 → 1.7): perched under the board and drumming on phones held upright, 84 to 114 → 110 to 149 (101 → 132 on a 390×844
phone); drumming on a phone on its side 101 → 132, a tablet 192 → 251 (upright) and 190 → 248 (on its side), a
1280×800 laptop 198 → 259. Perched beside the board it is the biggest that perch allows, as before: where a gutter was
already as small as the room let it be, unchanged (844×390 96, a tablet's 32 to 39, a 1280×800 laptop's 148 to 178);
where there was more, bigger (1920×1080 234-279 → 306-364, 915×412 105-128 → 130-158, 1000×480 123-150 → 142-173).
- *A nearer side counts as at 2c.* A perch is "near enough" if it has room for 0.65 of the bird's size at 2c, not of
  its new size, so growing never sends it to a smaller perch on the far side (without that, at 1.5 on a 1280×800
  laptop, it perched at 46 px for some spots instead of 177).
- *Its blow goes as deep as at 1.3* (`B_IN`), so pecking beside a snake its beak stays in the cell.
- *Drumming, it weighs what it would hide:* of the ways it can cling, it takes the one that hides least of the rings
  (four), the heads and the food (two each) and the tiles of its mark (two, all of them together). Bigger, it hides
  less than it did at 1.3, over the five screens: a head near its spot 15% of the time against 21%, food 17.5% against
  20%, its mark's tiles 3.5% against 4.2%.
- *Its drum poses keep room for its aim beside a snake* (`AIM_REACH`): since 2e that aim moves the whole bird by up to
  half a cell, which, bigger, carried its landing in a top corner past the screen's edge (from 1.6 on a 1024×768
  tablet, from 1.65 on a 1000×480 laptop window). Near the board's foot on a phone on its side it lies level to drum
  where it can't stand, as its design allows.
- *On a phone held upright* it still stands over the row under the board and the chatter, as Haakon asked in 1b++, so
  bigger it covers more of their words (at 1.3 it already hid a speed button's label whole at some spots); taps pass
  through it. Beside the board it never lies over any word.

**Tested:** `tools/layout/14-the-bigger-woodpecker.js` (layout job 5) at the screens the entry names: perched beside the
board, off the page's words; drumming, no more of the heads, food and mark's tiles hidden than at 1.3 (24 scenes a
screen, a 3 by 4 mark, compared over the five screens); nothing on the page moves for it. The rest (on the screen in every pose and flight, never over a cell perched) is
`03-devices.js` on every screen. Pictures: `tools/dev/woodpecker-size/shots.js`.

- *Clear of the row's words (2k+).* Haakon (29 October 2026): "Keep the bird 1.7x. And agreed with everything else."
  On a phone held upright it perches over the row under the board as before, but clear of its words: the speed
  buttons' and the switches' labels, and the speed's and the chatter's captions (`words` from `placeBoard` in
  `game/screen.js`, those level with the bird). Where it would stand covers one, it takes the nearest place that
  covers none, as it already did round the frame's moss (at 390 and 320 px wide, the gap between 4× and the switches,
  over the chatter's empty end). It never shrinks for this: where no place at its size clears them, it
  perches as it did. The chatter's lines are left out: they change every few seconds, and the bird would move with
  each. At 320 px wide the gap is 79 px for its 78, so its box counts its outline and gap but nothing more round the
  words. Tested in `tools/layout/15-the-perch-clear-of-words.js` (layout job 2) at 390×844 and 320×640; pictures from
  `tools/dev/woodpecker-perch/shots.js`. In your own round, after you're out, the help line's words share the row too,
  and on a 390 px phone no place at the bird's size clears them; it perches as it would, and that stays (Haakon, 31
  October 2026, of the bird covering part of the help line or the chatter: "Don't really care if it covers that a
  bit. None essential, you still see, and you can click through. It also moves about frequently, so it doesn't cover
  the same spot all the time.", then "yes, leave it."). No perch lower, no help line stepping aside, no smaller bird.
- *Bigger on a phone* (Haakon, 31 October 2026: "And also, I really think the woodpecker needs to be even bigger on the phone than what it is now. Look on the PC, it looks proper threatning. Phone, not so much."). PR #270: on a phone (a screen no more than 500 px on its short side, `PHONE_SHORT_PX`) it grows 1.6 times more (`PHONE_GROW`), size B of the three he was shown; the desktop is unchanged. Upright, it stands 212 px tall on a 390×844 phone, perched and striking (132 before). On its side, Haakon (31 October 2026): "Sideways, the bird perches at its full B size, partly off-screen: head, beak and eye in the gap beside the board and inside the safe area, its back and tail cut off by the screen edge. Same size perched and striking, never covering the board while it perches." So on its side it perches in the gap on the side that runs to the screen's edge, its beak short of the board and its eye in the gap, inside the safe area, the rest past the edge; its size there is B or, where the gap is narrower, as big as still leaves its eye in the gap (164 px tall at 780×320, 157 px at 844×390), the same perched and striking. Held upright, it is B or as big as still stands whole on the ledge under the board (212 px at 390×844, 164 px at 320×640), again one size perched and striking. Never smaller than 2k's: where even that leaves no room (a 375×667 phone upright; a sideways screen whose gap won't hold its eye), it is 2k's bird, perched as before. Its size is worked out again only when the screen's width changes, so a phone's address bar never resizes it. At 320×640 it covers the row's words, which Haakon accepted. Its depth into the bark and its smallest perch stay what they were at 1.3, whatever its size (`growBird` in `render/bird.js`).

### The woodpecker pecks beside a snake

Haakon (29 October 2026; entry 2e): on a tile with a snake on it, the bird pecks beside the body, not on it. Its beak
aims at the spot on the cell's rim (its corners and three points along each edge, just inside the edge) farthest from
the edge of any body there, as drawn; of spots about as clear (half a unit), the one nearest where it clings, so a body
straight across the cell has it peck the edge on its own side. The dent and its splits start there and run in toward
the cell's middle, stopping short of the body, and none is drawn where no room shows (the body fills the cell); the
chips fly from there. When a body comes or goes it shifts its grip to the new spot in half a tick. On an empty tile it
pecks the middle, as before. Drawing only (`aimOff` in `render/bird.js`): the tiles go at the same moment, and the
simulation does not load the renderer, so its fingerprints cannot change.

### Flags that bend under a snake

Haakon (29 October 2026; entry 2l): Sovereign's banner and Colonist's flags bend over while any part of any snake lies
on their tile. The pole tips from its foot the way that snake stepped onto the tile, and the cloth trails behind and
droops. The snake already on it keeps it; when it leaves, another snake there takes over and the flag eases to the new
way. A north or south push also leans the flag out to its cloth's side (east), because a pole leaning straight along a
body lay hidden on it. North stretches the pole a touch and hangs the cloth; south shortens the pole. While a flag
leans it is drawn over the snakes, since under them it couldn't be seen. Freed, it springs upright with a wobble that
dies away in under a second. With reduced motion it leans and stands up at once. The banner bends only at rest on its
cell, never while it glides or is carried, and keeps its shake if pecked. A flag that falls into a pit drops its bend.
Drawing only (`bendOn` in `render/flags.js`): each screen draws it from the snakes it has, so online play needs no
protocol change, and the simulation doesn't load the renderer.

### Flags in depth, hit head-on (2p)

Haakon (30 October 2026): "the flag bends now. But i would like to give it some perspective also. So people that pass
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
- **Planted under a snake** (PR #255, polish). A flag that wasn't on the board a moment ago (not drawn in the last frame drawn, by frames, not ms, so watching at 4x never counts a flag in sight as new; Sovereign's banner counts as in sight while it glides or is carried)
  and turns up with a snake already on its tile, as each new colony does under Colonist's head, is bent from its first
  frame: never seen standing, it doesn't stand for a frame and then snap over, and a head-on one lies flat under the
  head without wrapping the face that planted it.
- Drawing only, from the snakes each screen has: no simulation, no protocol change.

### Beetles and the woodpecker

Haakon (29 October 2026; entry 2m): beetles should "quickly try to escape down their burrow when woodpecker targets
their little island"; burrows ran out as the woodpecker pecked them; and beetles under a strike teleported. The rules
(`crawl`, `beakDepth`, `beakGap` and `knocks` in `engine.js`):
- **Burrows keep up.** A beetle due up from underground with no free burrow cracks a new one open where it's quiet,
  by `beetleOut`'s rule (`BURROW_SPACING` apart, at most `BURROW_MAX` open). None comes up under the beak: `freeBurrow`
  and `placer` leave the mark out.
- **The mark is danger, as a head is.** While the woodpecker aims, a beetle within `BEETLE_FEAR` of its mark scurries
  away from it and for a burrow in reach, and dives in. On the mark, it plans against the strike: a burrow in reach it
  can get to in time (pulled there straight, twice as hard as a head-scared run), else off the mark by the shortest
  way, else it digs in if the dig is done before the strike. A dig there leaves no burrow, and it comes up elsewhere. A
  dig already under way that won't be done in time is dropped, and it runs.
- **No teleporting.** A beetle still on the mark at the strike is the bird's: a `knock` with no landing, a puff and a
  soft crunch, no ring through the aim. Its lesson, the first time: "The woodpecker eats beetles too!". The Field
  guide's Beetles and Woodpecker rows say so.
- **The rivals** move each beetle in their search by the same rule (`bugCrawl` in `ai.js`, with `E.beakDepth` and
  `E.beakGap`). So a beetle bound down a burrow beyond the mark isn't chased, and one running off it toward a rival is.
  One gap, not worth its code: the AI's copy lets a fleeing beetle cross a body lying on the mark (the mark's cells
  read as holes there), where the engine stops it.
