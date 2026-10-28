## Teaching by showing

The owner (2026-10-20): the lessons "flash before you, too quick to really register", sometimes "in your face in the middle of the screen" on a phone, and the woodpecker is very small on a phone. Their idea: your own snake's speech bubbles, and pictures in play of what you can do.

**Measured first** (18 real rounds in headless Chrome as a new player, on a 390×844 phone, a 360×640 phone and a 1920×945 desktop):
- Banners were up for 39–50% of play.
- Most lessons were held 2.6–3.2 s, and the first 0.46 s of each is the slam. A text of 9–14 words needs about twice its plain reading time when you can only glance away from your head.
- Hunger's lesson came 3.4 times a round, often over your own body.
- Round news replaces a waiting lesson at once, and the lesson is lost.
- The new player's jump presses nearly all ran out: 35 "nothing to hop" or "too early" lessons against 2 "Hup!".
- On an upright phone the perched woodpecker was 7–8.5 mm tall.

Three directions were built as prototypes: your snake talks; pictures drawn on the log; and a first round that teaches. Three judges scored them, and all three chose one system made of the best of each.

**1. Banners carry only round news everyone shares:** the woodpecker (and PR C's acts), first blood, the last two, weather, spawns, lost land and the last apples.
- Each is held for its reading time (1 s plus 0.4 s a word, at most 4.5 s), queued with a 0.5 s breather, and never cut short except by a card. Nothing is dropped, so weather that carries a rule ("Winter. Less food…") always gets its turn.
- No middle slot. On an upright phone they sit above the board, over the header's title row, never over your own tag or the pause button, and taps pass through. Elsewhere they go at the board's top or foot.
- They settle in with a short drop and a fade: no slam, no red throb, no shine.
- The weather gets one-line phone versions of its two-line texts.

**2. Your snake's voice.** Every lesson about you becomes a line your own snake says, in a bubble at its head, with the rivals' bubble rules.
- *Where:* it keeps off your head, the 3 cells ahead, a turn you've pressed, the banner and the thing the line is about. It stays put while it can; when it must move it fades across in about 0.1 s, never gliding over your head. Its first place is chosen from the head's next tick, so it doesn't jump in its first half second. Rival bubbles make way for it.
- *The words:* first person, one idea, at most 32 characters (a test checks every line), each mirroring the rivals' line for the same moment. Where the prototypes differ, the shorter line wins. Exclamation marks are rationed: pain and surprise get one, and everything else ends in a full stop or an ellipsis. The narrator (the banners) stays calm. The owner judges the tone.
- *The cue:* a line that asks for a press carries a key cap ([Space], [E], [↓]) or a drawn fingertip tapping or swiping. Its key is named only until you've used it.
- *How long:* its reading time, 1.2 s plus 0.45 s a word, 2.4–4.2 s. One line at a time. What just hurt you, or what you just got, takes over. The cough's line waits for the choke's. A line that can't show yet isn't used up.
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
- The first round keeps its full field of rivals. A first round with one rival fewer was rejected, because it would be an easier game for people only, and its wins count in the Hall of Fame.
- powersFirst, flashKey, leapNothing, leapEarly and youLeapFirst stop being banners. They become the coach and short lines: "Nothing to hop!", "Too soon!", "Hup! That cost my tail tip."

**4. Pictures on the log,** for the moves you're learning, drawn in two passes (under the snakes and over them), so the pips and faces stay clear.
- *The jump:* a dotted arc to the landing ring. It's faint from 5 cells away, then bright with a breathing ring once a press would go. An × marks where there's nowhere to land, and dots run out for a press with nothing in reach. A -1 shows at your tail tip on your first jumps.
- *The flash:* two ember chevrons and a ghost head two cells on, and an × where it would bump.
- *The golden flash:* Honey chevrons along its path, the cut line with "Snip!", and a starburst with "Boom!" at an edge or hole. A picture says "never at an edge" better than words.
- *How long:* these predictive pictures show only while you're learning (until you've used the move 3 times). After that, only the cues drawn for every snake's moves stay, such as PR B's ring once a jump is pressed, so you read the rivals' moves as they read yours. Danger predictions left on for good were rejected: they'd be an aid only you have, and they'd trim the timing skill the moves are meant to need.
- *One source of truth:* the pictures come from one pure engine query ("what would a press do now, given this view"), not from rules re-derived in render.js. PR B's islands, flights and bridges then change one place, and a test checks that the picture matches the outcome on staged boards. The shapes are worked out once a tick, and the renderer hands their box to the bubble layout, so your bubble never sits over what's drawn.
- Line widths have a floor in CSS px, so they read on a 360 px phone. With reduced motion they only fade.
- No "hints off" switch: it would only bring the old banners back. Instead the Field guide gets "Tell me again", which clears 'snake-taught', and new rows for crashes and hunger. The Field guide stays the full reference.

**The bird.** All three designs reached the same answer. On an upright phone the woodpecker perches at full size (4.9 cells, about 13 mm), standing down into the empty middle of the chatter panel's header row under the ledge, between "Bark chatter" and the On switch.
- It never covers a cell, the label or the switch.
- It's the same size perched, flying and drumming, so it doesn't grow as it takes off.
- Taps pass through its layer.
- It goes there only when that row starts within 24 px of the ledge and a clear spot exists; otherwise it stays on the ledge. The prototype measured 0 overlaps in 120 cases.
- While watching it stays on the ledge, small, because the speed buttons sit there.
- Phones on their side and desktops are unchanged. It's built on the one-screen layout (#34), which reshapes exactly this area.
- Even at full size its eye is 5–6 px, so PR C draws act 1's gaze on the board for everyone (and in the rivals' view): a warm wash that deepens where it looks longest.

**Build order.** It's its own PR on main, before PR B's moves, so every new move is taught through it from the start:
1. the banner queue and placement, and the phone weather texts;
2. the full-size bird, with layout-test's perch checks rewritten as "full size, never over a cell, off the label and switch";
3. your snake's voice, with every lesson banner mapped to a line;
4. the coach and the pictures for today's jump, flash and golden flash, with the engine query;
5. the Field guide rows and "Tell me again";
6. tests:
   - input-test reads your bubble;
   - every line is 32 characters or fewer;
   - each picture matches its outcome;
   - your bubble never sits over your head or the 3 cells ahead;
   - a real-play run on the three screens against the measured numbers.

The aim is banners up for about 20% of play, and every lesson where your eyes already are.

**With PR B,** every new move goes through the same coach, voice and query, with its own cue as the picture, and no new banners:
- *island hops:* the arc stretched to the ring up to 3 cells on, offered the first time you're in a pocket with a jumpable gap ("Tap! I can hop to that island.");
- *the golden flight:* a gold ring that slides as you steer, with a dotted trail to its limit, turning to an × over a hole or a body ("Hold, and I'll fly! Steer me.");
- *bridges:* planks on a body over a pit, its last cells sagging and creaking, and a walkway to a ring on the far rim ("Off before its tail goes!"), with lines for rivals both riding and ridden;
- *cuts:* a snip line across a thin body with the beads-to-be ghosted; the same across your own body for dropping your tail; an × with -5 where a flash would fail, until learned; steam on fire it puts out;
- *bumps in the air:* a spark and a puff;
- *portals:* the exit left open and shrinking for about a second, for everyone.

**With PR C:**
- one calm banner per act, with act 3's folding in the last apples ("Frenzy! The last apples are falling.");
- the gaze drawn on the board;
- combo patches numbered 1-2-3 in strike order, steady, not flashing;
- your lines "Eep. That bird's watching me." and "Two marks at once?!";
- the Woodpecker row with the three acts, and "where it looks longest, it pecks first".

**As built, step 1: the banner queue and placement, and the phone texts.** The lessons are still banners until step 3, so every banner, lessons too, keeps the new rules.
- *Hold:* every banner is held for its reading time, 1 s and 0.4 s a word, 4.5 s at most (`BANNER_BASE_MS`, `BANNER_WORD_MS`, `BANNER_MAX_MS`). The lessons use the same rule, not the voice's 1.2 s and 0.45 s a word, 2.4–4.2 s: one rule for every banner, and the lessons still banners run 6 to 14 words, where the banners' rule is the longer (4.5 s from 9 words, against the voice's 4.2 s, a cap made for lines of 32 characters); the voice's would add 0.2–0.4 s only to the few short ones. Go! and the wake's "Ready…" keep their beat, and a rival's note you ask for keeps its own reading time. A banner that spent 0.3 s or more faded under the heads gets that time back once (all banners now, not only lessons). On a phone the hold is the full words', a little more than the phone's shorter ones need.
- *Queue:* in the order they came, each a breather (`BANNER_BREATHE_MS`, 0.5 s) after the last one's 0.24 s fade. Only a card cuts one short (and clears those waiting; a nap brings them back on waking). Go!, the countdown's last beat, and a note you ask for come up at once; what a note interrupts goes back to the front of the line. Round news and the weather wait as long as it takes. A lesson waits at most 6 s of the round (`LESSON_WAIT_MS`): one banner ahead of it takes 5.24 s at most (4.5 s, the fade and the breather), so it can wait out one but not two. Up to three lessons wait; the `still` predicates are kept. The woodpecker's rule waits from when its news comes up (`opts.follows`), since its moment is the news's: waiting from its own arrival, it was let go 3 times in 3 rounds at 360 px, behind the news behind another banner. The last apples and the land the woodpecker took are round news now (the code had them as lessons). Spawns and the lessons over in a moment (a dig, a burrow) still show only when the banner is free (`newsFree`: nothing showing, fading, breathing or waiting), and aren't spent otherwise. A debug log (`SnakeDebug.banners()`) says what became of each.
- *Placement,* measured on #34's layout: at 390×844 the header's title row runs from y 8 to 55 (the title 8–35, the tagline under it), its buttons from 61, the tags 111–165 and the board from 175; at 360×640, the title 8–31, the buttons from 37, the tags 87–141, the board from 151. On a phone held upright (the ledge laid out) the banner moves into the header: across it and 4 px past each side, level with the title, between 2 px inside the screen's safe top and 3 px above the header's buttons (`placeBoard` measures it, `placeToast` fits it), so it's at y 10–34 at 390×844, 8–32 at 360×640, 2–25 at 320×460 and 49–73 under a notch. One line at 0.86rem, shrinking to fit across down to 80% of that (`BANNER_MIN_FONT`, then an ellipsis no words of the game's need), and never taller than the row; under 22 px of row it would go on the board, which no screen tested needs. Taps pass through it, and bubbles no longer make way for it. A rival's note, three lines long, stays on the board. Elsewhere the banner is at the board's top or foot, never its middle: with heads in both it fades where it is.
- *Motion:* it settles in, a 6 px drop and a fade over 0.36 s, and fades out rising 4 px; with reduced motion it only fades. No slam, no throb, no shine.
- *Phone words* (`FLAVOR.phone`, and `opts.phone` for lines with names), one line on a 360 px phone: the weather's four that took two lines there ("Thunder! Lightning strikes where it crackles.", "Winter. Less food, and hunger comes faster." for both winters, "Snow. Lean times: eat while you can."), the woodpecker's three, the long golden leaf and golden mushroom news, the watcher's and the away lines, the friends' lines, and a first out's cause in fewer words (`shortCause`: "First out: Capricious was cut by Metagamer."). Where long names (16 characters, the cap) still don't fit its line, the first out drops the cause altogether (`opts.short`: "Gran is first out.", "Gran and Lark are first out."); a screen reader and the chatter keep the full line. A screen reader hears the full words. The smallest a banner gets is 94% of its size at 360 px and 82% at 320.
- *Measured,* the audit's real rounds again (3 rounds each, seed 11, a new player), before and after: a banner up 48%, 49%, 48% of play → 61%, 55%, 60% (390×844, 360×640, 1920×945: the holds are longer, and the lessons are still banners until step 3); the median hold 2.6 s against a median reading time of 4.2–4.5 s, 0–2% of banners held their reading time → 4.2 s, all of them (100%); banners straight after another with no fade or breather 22, 22, 17 → 0, and cut short by another within 1.5 s 3, 3, 4 → 0; news never shown (the weather, dropped behind a lesson) 3, 3, 2 → 0; lessons never shown 0 → 2 of 32, 0 of 23, 4 of 24, each let go after waiting 6 s (four "hungry" lines, whose tag's bar and rumble say it too, a choke, a "pecking under you"), where before every lesson was shown and cut to about 2.6 s; time in the board's middle 28.2, 23.4, 1.1 s → 0; on the phones, time over the board 189 and 132 s → 0, and over your tag or the pause button 0 → 0.
- *Tests:* input-test (the banners in turn, held for their reading time with a breather, round news waiting behind a waiting lesson, a lesson let go after 6 s with the round news behind it still shown; the slots, top and foot, never the middle; above the board on a phone; every banner one line over the title row at 360 and 320 px), layout-test (every phone held upright, and every height of the upright sweep, put up and as the screen changes: one line, words whole, inside the safe area, never over the board, your tag or the pause button; elsewhere top or foot), ui-test (a note you ask for, nothing cutting it short).

