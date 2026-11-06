## Teaching by showing

How the game teaches: the one-time lessons and how they're chosen and spaced, the banner that carries them and the
round's news (its levels, its hold and queue, its place and its words), the Field guide and its doors, the first seconds
of a round, and the plan to teach by showing rather than telling, as the third pass, round four, round six A and B and
"Teaching by showing" settled them (their text, with what was measured, is in `docs/archive/design-teaching.md`).
Every new rule comes with a visible cue, a one-time lesson and a Field guide row ("Rules that stand" in `AGENTS.md`).
Elsewhere: each move's, food's and danger's own lesson and Field guide row (`40-powers-and-moves.md`, `41-crashes.md`,
`04-food-and-the-world.md`, `38-the-woodpecker.md`); the page round the banner and the cards (`31-phones.md`,
`33-one-screen.md`); a rival's note asked for from its tag ("A rival's note" in `43-the-start-card-and-records.md`);
the words' voice (`09-voice-and-copy.md`) and the rivals' lines (`13-lines-and-announcements.md`); and the keys a
lesson names ("Controls anyone can guess" in `42-controls.md`).

### The narrator speaks less, and better

Every banner goes through one queue (`toast()` in `game/toasts.js`; what a round says, and when, is
`game/banners.js`), at one of four levels:
- **Round news** (`round`): what changes the round: first blood (or the first out), the last two, the woodpecker, the
  last apples, a flag or a capital the woodpecker took (the first of each in a round, for everyone, watchers too,
  chatter on or off), friends coming and going. It waits as long as it takes, and it's the only level that gets
  through while a card is up.
- **Lessons** (`lesson`): a rule, the first time it happens (the first crash, the first jump, a power's first pickup,
  dropping to your smallest). See "Lessons", below.
- **News** (`news`): the weather, which waits as long as it takes, and spawns (a golden apple, a beetle, a golden
  beetle, a leaf, a golden mushroom, a rainbow, baked food) and the first border you cross in a round, which show only
  when the banner is free, else the next one tells it.
- **Asked** (`asked`): a rival's note, asked for from its tag while you watch, which comes up at once
  ("A rival's note" in `43-the-start-card-and-records.md`).
- **Repeats** don't get banners: only the first golden apple and the first beetle of a round are announced, and a
  repeat crash or a pickup's "+3" is left to the board's own floaters.
- **While a card is up,** only what changes the round gets through.

Lessons are one idea and 60 characters or fewer, with the keys and on touch (input-test checks every one). The fine
print lives in the README and the Field guide, or comes when it happens (*Snip!*).

### Lessons

- **Once a round,** the first time its moment comes in that round (`theGame.told`), never once ever: a line missed in a
  busy moment comes back the next round. A few say what has changed and come each time: hunger's warning (each time
  hunger comes back), a golden pickup's count, the edges coming back, and being cut ("Snip. Name dashed right through
  you."). The dash's key is taught once a round, from 6 s in, until you've dashed (once a visit); the powers' lesson
  at Go once a visit ("The first seconds", below).
- **Yours, or everyone's:** most are about your own snake, and only while you're alive. Those about the log (the
  woodpecker eating a beetle, a piece cut loose, the first neck cut, a dig's burrow and burrows growing shut) are for
  everyone, watchers too.
- **When the banner is free:** a lesson that's over in a moment (a dig near you, a burrow, a piece cut loose, the
  woodpecker eating a beetle, a neck cut), or one looked for on the board (a bridge near you, a tail to drop, a ring in
  reach, a flier to leap at, an island to hop, the dash's key), shows only when the banner is free (`newsFree`: no
  card up, nothing showing, fading, breathing or waiting), and isn't spent otherwise: the next such moment teaches it.
- **Waiting:** a lesson waits at most 6 s of the round (`LESSON_WAIT_MS`): one banner ahead of it takes 5.24 s at most
  (4.5 s, the fade and the breather), so it can wait out one but not two. Up to three lessons wait. One that no longer
  holds (`opts.still`, as yours once you're out) is let go while it waits, and fades early while it shows. The
  woodpecker's rule waits from when its news comes up (`opts.follows`), since its moment is the news's.

### The banner

The lessons are still banners until the snake's voice is built ("Steps 2–6, to build", below), so every banner,
lessons too, keeps these rules.
- *Hold:* every banner is held for its reading time, 1 s and 0.4 s a word, 4.5 s at most (`BANNER_BASE_MS`,
  `BANNER_WORD_MS`, `BANNER_MAX_MS`): one rule for every banner, lessons too. Go! and the wake's "Ready…" keep their
  beat, and a rival's note you ask for keeps its own reading time. A banner that spent 0.3 s or more faded under the
  heads gets that time back once. On a phone the hold is the full words', a little more than the phone's shorter ones
  need.
- *Queue:* in the order they came, each a breather (`BANNER_BREATHE_MS`, 0.5 s) after the last one's 0.24 s fade
  (`BANNER_FADE_MS`). Only a card cuts one short (and clears those waiting; a nap brings them back on waking). Go!, the
  countdown's last beat, and a note you ask for come up at once; what a note interrupts goes back to the front of the
  line. A debug log (`SnakeDebug.banners()`) says what became of each.
- *Placement:* on a phone held upright (the ledge laid out) the banner moves into the header: across it and 4 px past
  each side, level with the title, between 2 px inside the screen's safe top and 3 px above the header's buttons
  (`placeBoard` measures it, `placeToast` fits it), so it's at y 10–34 at 390×844, 8–32 at 360×640, 2–25 at 320×460
  and 49–73 under a notch. One line at 0.86rem, shrinking to fit across down to 80% of that (`BANNER_MIN_FONT`, then
  an ellipsis no words of the game's need), and never taller than the row; under 22 px of row it would go on the
  board, which no screen tested needs. Taps pass through it, and bubbles don't make way for it. A rival's note, three
  lines long, stays on the board. Elsewhere the banner is at the board's top or foot, never its middle: it comes up in
  the first of the two that's clear of heads (and the woodpecker's mark, a crackle, the steering hint), stays while
  that place is clear, and with heads in both it fades where it is.
- *Motion and dress:* it settles in, a 6 px drop and a fade over 0.36 s, and fades out rising 4 px; with reduced
  motion it only fades. No slam, no throb, no shine. Each is dressed for its moment: a red ring for a knockout or the
  last two, gold for a golden apple, emerald for a beetle, orange for the woodpecker, a red ring for a warning, and a
  big leaf-green **Go!**.
- *Phone words* (`FLAVOR.phone`, and `opts.phone` for lines with names), one line on a 360 px phone: the weather's four
  that took two lines there ("Thunder! Lightning strikes where it crackles.", "Winter. Less food, and hunger comes
  faster." for both winters, "Snow. Lean times: eat while you can."), the woodpecker's three, the long golden leaf and
  golden mushroom news, the watcher's and the away lines, the friends' lines, and a first out's cause in fewer words
  (`shortCause`: "First out: Capricious was cut by Metagamer."). Where long names (16 characters, the cap) still don't
  fit its line, the first out drops the cause altogether (`opts.short`: "Gran is first out."; several out at once have
  no cause to drop, and keep their names). A screen reader hears the full words. The smallest a banner gets is 94% of
  its size at 360 px and 82% at 320.
- *Tests:* input-test (the banners in turn, held for their reading time with a breather, round news waiting behind a
  waiting lesson, a lesson let go after 6 s with the round news behind it still shown; the slots, top and foot, never
  the middle; above the board on a phone; every banner one line over the title row at 360 and 320 px), layout-test
  (every phone held upright, and every height of the upright sweep, put up and as the screen changes: one line, words
  whole, inside the safe area, never over the board, your tag or the pause button; elsewhere top or foot), ui-test (a
  note you ask for, nothing cutting it short).

### The Field guide

Every food, power and danger, in six parts (`GUIDE_ROWS` in `game/friends.js`): **The basics** (Winning, Steering,
Crashes, Hunger), **Food**, **Golden things**, **Your powers**, **The log** and **Rivals who change**; its doors are
below.
- **A row** is its picture, drawn by the renderer as it is on the log (a stand-in if it can't be drawn), its name and
  its rule in a line or two, with the numbers from `tuning.js` and the keys for a keyboard or for touch. A screen
  reader hears each row's name, a pause, then its rule.
- **Every new rule gets a row,** with its own words in its topic file. Beside the things on the log, it shows how a
  held power looks (a snake in gold with a sky pip and an ember diamond: "Golden powers") and your two rests
  ("Resting").
- On phones (440 px or narrower) the Hall of Fame tab is a trophy, so three tabs fit 320 px; "Clear everything" hides
  on the guide.

### The Field guide's own door

The guide is the third tab of the same book as the Hall of Fame and Your story (its napping, its focus, the online
check and the narrow-screen tabs are the book's), with a door everywhere a player looks:
- **Its own button,** an open book, before the trophy. A door with room in its row for its word says it ("Field guide",
  "Hall of Fame"), else it's its picture, round like the icons beside it, with its name in its tooltip ("Field guide
  (G)") and for a screen reader (where, on each screen: "The header's rows" in `33-one-screen.md`).
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

### The first seconds

**Who you are, and a first knock you survive.** Watching a new player, the round could end before they'd found their
snake: they didn't know which one was theirs, and at length 3 the first bump was the end.
- **YOU.** From the countdown until a few seconds into the round (`YOU_MS`, 3.5 s, or just after you first steer),
  your snake is marked: a big bouncing arrow over your head (under it, near the top edge) with YOU in your colour, a
  ring pulsing round your head, and chevrons marching the way you're heading. Online, every screen marks its own snake,
  and friends' snakes carry their names ("On a friend's screen" in `22-play-with-friends-online.md`). It's drawn over
  the board, under the floaters, and fades out softly.
- **The steering hint** beside the YOU arrow: "Swipe to steer" or "Arrow keys to steer (or WASD)", riding with your
  head until you steer (a banner moves aside for it), on whichever side of YOU is clear of the rivals' speech bubbles.
- **Go!** is the countdown's last beat ("Slither!", or "And they're off." when you're watching). On a touch screen
  whose help under the board isn't wholly shown, the first Go of a visit is the powers' lesson instead: "Tap jumps.
  Swipe ahead dashes." (how to steer is beside YOU).
- **Everyone starts at 4** (`START_LENGTH`), one more than the least. A crash never takes you below 3, so your first
  crash costs one segment, not the round; the second, at 3, is the end. (6 was considered; 4 gives the same one-knock
  grace with a smaller change to the opening: shorter snakes, a less crowded start.)
- **The first round keeps its full field of rivals.** A first round with one rival fewer was rejected, because it
  would be an easier game for people only, and its wins count in the Hall of Fame.

### Steps 2–6, to build

The owner found the banners too quick to read in a fast game, and in the way on a phone, and asked whether the game
could show rather than tell: your own snake speaking in a bubble, and pictures in play of what you can do (his words,
and what was measured first, are in `docs/archive/design-teaching.md`). Three prototypes (your snake talks; pictures
drawn on the log; a first round that teaches) were scored by three judges, and all three chose one system made of the
best of each. Step 1, the banner above, is built; steps 2–6 are queue entry 4 (`docs/handoff/queue-specs.md`, "4. The
teaching system, steps 2–6"). The aim is banners up for about 20% of play, carrying only round news everyone shares,
and every lesson where your eyes already are.

**2. Your snake's voice.** Every lesson about you becomes a line your own snake says, in a bubble at its head, with the rivals' bubble rules.
- *Where:* it keeps off your head, the 3 cells ahead, a turn you've pressed, the banner and the thing the line is about. It stays put while it can; when it must move it fades across in about 0.1 s, never gliding over your head. Its first place is chosen from the head's next tick, so it doesn't jump in its first half second. Rival bubbles make way for it.
- *The words:* first person, one idea, at most 32 characters (a test checks every line), each mirroring the rivals' line for the same moment. Where the prototypes differ, the shorter line wins. Exclamation marks are rationed: pain and surprise get one, and everything else ends in a full stop or an ellipsis. The narrator (the banners) stays calm. The owner judges the tone.
- *The cue:* a line that asks for a press carries a key cap ([Space], [E], [↓]) or a drawn fingertip tapping or swiping. Its key is named only until you've used it.
- *How long:* its reading time, 1.2 s plus 0.45 s a word, 2.4–4.2 s. One line at a time. What just hurt you, or what you just got, takes over. A line that can't show yet isn't used up.
- *How often,* counted per device in one new key, 'snake-taught':
  - each rule's line comes in the first 2 rounds you meet it;
  - the last-life lines (a crash that leaves you at 3, at 3, starving at 3) come every round;
  - after round 2, hunger has only its tag's bar and its rumble.

  Not once ever, because a line missed in a busy moment would be gone for good.
- It goes in the log under your name and to the screen reader, as the rivals' lines do, and it shows with the chatter off.

**3. The move coach** teaches steering, the jump and the flash, in that order.
- Each prompt waits for a calm moment (no rival head within 5 cells, the way ahead clear) and for you to do the move.
- It comes back no sooner than 12 s later, at most 4 times a round, until you've done the move 3 times. A move you never did comes back next round.
- A jump is offered only over a hurdle that will still be there when you arrive (a tail that will have passed doesn't count).
- The flash isn't taught at "6 s in" any more, but at its first calm moment.
- Steering gets taught too ("[↓], and I'll turn!"), with a dashed turn arrow. For someone who doesn't know WASD, that's the most useful line of all.
- powersFirst, flashKey, leapNothing, leapEarly and youStamina stop being banners. They become the coach and short lines: "Nothing to hop!", "Too soon!", "One stamina: jump or dash, your choice."

**4. Pictures on the log,** for the moves you're learning, drawn in two passes (under the snakes and over them), so the pips and faces stay clear.
- *The jump:* a dotted arc to the landing ring. It's faint from 5 cells away, then bright with a breathing ring once a press would go. An × marks where there's nowhere to land, and dots run out for a press with nothing in reach. Your stamina ring's notches show what each power takes.
- *The flash:* two ember chevrons and a ghost head two cells on, and an × where it would bump.
- *The golden flash:* Honey chevrons along its path, the cut line with "Snip!", and a starburst with "Boom!" at an edge or hole. A picture says "never at an edge" better than words.
- *How long:* these predictive pictures show only while you're learning (until you've used the move 3 times). After that, only the cues drawn for every snake's moves stay, such as PR B's ring once a jump is pressed, so you read the rivals' moves as they read yours. Danger predictions left on for good were rejected: they'd be an aid only you have, and they'd trim the timing skill the moves are meant to need.
- *One source of truth:* the pictures come from one pure engine query ("what would a press do now, given this view"), not from rules re-derived in render.js. PR B's islands, flights and bridges then change one place, and a test checks that the picture matches the outcome on staged boards. The shapes are worked out once a tick, and the renderer hands their box to the bubble layout, so your bubble never sits over what's drawn.
- Line widths have a floor in CSS px, so they read on a 360 px phone. With reduced motion they only fade.
- No "hints off" switch: it would only bring the old banners back. Instead the Field guide gets "Tell me again", which clears 'snake-taught'. (Its rows for crashes and hunger are built, in The basics.) The Field guide stays the full reference.

**The bird** (step 2's full-size woodpecker on an upright phone) is built another way since: it perches at full size
over the row under the board ("The woodpecker's perch" in `31-phones.md`, and "The woodpecker, as big as it gets" and
"Bigger on a phone" in `38-the-woodpecker.md`, the later calls); the plan as it was is in
`docs/archive/design-teaching.md`.

**Build order:**
1. the banner queue and placement, and the phone weather texts (built: "The banner", above);
2. the full-size bird (built by the phones work: "The bird", above);
3. your snake's voice, with every lesson banner mapped to a line;
4. the coach and the pictures for today's jump, flash and golden flash, with the engine query;
5. the Field guide rows and "Tell me again";
6. tests:
   - input-test reads your bubble;
   - every line is 32 characters or fewer;
   - each picture matches its outcome;
   - your bubble never sits over your head or the 3 cells ahead;
   - a real-play run on the three screens against the measured numbers.

**With PR B,** every new move goes through the same coach, voice and query, with its own cue as the picture, and no new banners:
- *island hops:* the arc stretched to the ring up to 3 cells on, offered the first time you're in a pocket with a jumpable gap ("Tap! I can hop that gap."; 2s: the log is one piece, so no islands);
- *the golden flight:* a gold ring that slides as you steer, with a dotted trail to its limit, turning to an × over a hole or a body ("Hold, and I'll fly! Steer me.");
- *bridges:* planks on a body over a pit, its last cells sagging and creaking, and a walkway to a ring on the far rim ("Off before its tail goes!"), with lines for rivals both riding and ridden;
- *cuts:* a snip line across a thin body with the beads-to-be ghosted; the same across your own body for dropping your tail; an × with -5 where a flash would fail, until learned; steam on fire it puts out;
- *bumps in the air:* a spark and a puff;
- *portals:* the exit left open and shrinking for about a second, for everyone.

**With PR C** (round six C, queue entry 6; where its draft and the owner's later calls differ, as its outline in place
of the combos, they win):
- one calm banner per act, with act 3's folding in the last apples ("Frenzy! The last apples are falling.");
- the gaze drawn on the board;
- combo patches numbered 1-2-3 in strike order, steady, not flashing;
- your lines "Eep. That bird's watching me." and "Two marks at once?!";
- the Woodpecker row with the three acts, and "where it looks longest, it pecks first".
