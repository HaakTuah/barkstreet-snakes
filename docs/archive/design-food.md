# Food, as it was decided: the round files' text

The food topic's sections as the round files and the owner's playtest had them, word for word, with their superseded
versions and measurements.
The current rules are in `docs/design/04-food-and-the-world.md`, under the same names.

## From the round's arc (`12-the-rounds-arc.md`)

**Starving is decided after eating.** A snake whose head reaches food on the tick it would starve eats instead.

## From round four (`24-round-four-the-owners-feedback-and-the-calls.md`)

### Food

**Does your own food poison you?** No, and it won't. Poison would punish the natural move of picking your tail back up after a crash, and seat colours can look alike. But **your own beads aren't a meal**: they give the length back (and the score), not the hunger clock.

*Measured*, 24% of the beads eaten were the eater's own, and crashing on purpose and then eating your own beads was a free hunger reset.
- **Telling it:** a muted Parchment +1 (+2 roasted) with no hunger refill, and once: "Your own tail won't feed you." (*Replaced in round six A:* you choke on your own beads instead, and the mercy below is gone.)
- **Owners:** beads carry their owner, so this is the same rule for everyone, AI included.
- **One mercy:** a snake out of time that reaches its own bead that very tick grows instead of starving (as with any food); its next shrink takes the growth back.

**Body food rots.** Beads fade, shrink and go after about 14 s (`PELLET_TICKS`, ± a quarter; roasted ones last half again), in a puff of their own colour, as apples do.

**A body leaves every other segment** (at least 3 beads, from the head; where there are too few, the skipped segments nearest the tail make up the number), not all of it. A kill was worth +30 to +70, and the winner of the first big fight snowballed. Crash drops, cut tails and burnt bits stay whole.

**Too much food mid-round, too little at the end?** Yes on both counts. *Measured:*
- Before 2:00, hunger mattered for 0.8% of snake-time: the median gap between meals was 1.4 s against a 20 s clock.
- After 2:00, 24% of snake-time was starving, and two thirds of sudden-death starvations happened with no food on the board at all.

The calls:
- **Three apples all round** (*since round six A*, two all round, with beetles carrying more of the food: see "Less fruit, more beetles"). Two after 0:45 was the first call, so hunger would matter mid-round. *Measured*, it hardly did: before 2:00 snakes spent 4.4% of their time in the hunger warning, against 2.9% with three. What it did do: shorter snakes at 2:00 left more room once the woodpecker came, so rounds ran 5 s longer, a quarter of sudden death's deaths were in holes, and starving rose from 2% to 7% of all deaths. So the dial was taken out (`APPLES_LATE` is gone). Beads that rot, a dead snake leaving every other segment and your own beads not being a meal made the middle a little leaner, but not by enough: the critique measured 3.0 / 3.2% of snake-time in the hunger warning before 2:00 (seeds 3 / 11). So, after it:
- **A meal mid-round keeps you 13 s, not 20** (`HUNGER_MID_MS`, from 0:45 until the woodpecker comes; one in the opening or in sudden death keeps you 20 s, `HUNGER_MS`), with three apples still all round (*since round six A*, 12 s, with two apples and fewer beetles: see "Fewer beetles after all"). *Measured* with the census, 600 rounds on seeds 3 and 11: snake-time in the hunger warning before 2:00 went from 3.0 / 3.2% to 8.8 / 8.9%. The round (169 / 170 s) and sudden death (49 / 50 s) didn't move, and starving went from 2 / 1% of deaths to 3 / 2%. Also tried: 13 s from the start (10.9%; its first death came at 120 s), 11 s (17.9%), 15 s (7.5%), and apples rotting sooner mid-round (no change: they're eaten long before). Two apples after 0:45 had given 4.4%, with longer rounds and more starving at the end.
  - *The hunger bar.* Each snake keeps how long its last meal keeps it (`mealMs`), and its tag's bar is measured against that, so it's full after any meal, though one mid-round lasts less. Under `HUNGER_WARN_MS` (6 s) left, the tag shows it's starving: the bar in Berry, a ring pulsing round the tag, and "starving" for a screen reader. (Measured against 20 s, a mid-round meal filled it two thirds; online, protocol 8 carries `mealMs`.)
- **The last apples fall one at a time.** In sudden death, food no longer stops dead. Once the board has no apple, another drops, each wait longer than the last (`SD_APPLE_GAP`, 20 ticks, times its number: about 2 s, 4 s, 6 s…), never in the woodpecker's mark. It's announced once, with its own falling notes: "The last apples are falling." (At a lesson's level, after the tick's other news: it waits out a banner that's holding, such as the woodpecker's arrival, instead of cutting it short, and replaces only routine news.)
- **No winter before 45 s.** Snow in the first half-minute starved 5-long snakes in about 1 round in 5. *Measured*, 55% of early starving happened in snow, which is 8% of that time.
- **Mushrooms never sprout within 2 cells of a head.** Nobody can see one appear in front of them in time.
- **Golden apples, leaves and mushrooms land somewhere quiet** (the farthest of 8 tries from every head). They become a race you can see, instead of gone in 1.5 s.

## From round six A (`27-round-six-a-fairness-and-fixes.md`)

**Rivals see food as it is.** Rivals see other snakes a quarter of a second late, like a person's reaction, and DESIGN only ever promised that. By accident they saw food that late too. It didn't matter for apples, which don't move. For beetles it did: they chased where a beetle *was*, wiggled behind it and lost it ("self-sabotage", the owner said). Now:
- food is seen as it is now;
- the delay stays for snakes;
- a rival aims where a fleeing beetle is heading, from the way it faces and its pace, which anyone can see: straight on, then away from the nearest head toward a burrow nearer than `BEETLE_HOME_REACH` (7), and diving in. Since wave 2, a cornered one (a head within `BEETLE_DIG_FEAR` and no burrow in reach) digs in where it is and stays put until it's gone. Every move the search tries moves every beetle that's out (two at once since wave 2), and from where each search ends each chase is played out;
- catching sooner counts twice what a step closer to an apple does (`BUG_HURRY`), so a catch in hand isn't dropped for an errand;
- rivals see every burrow on the board, as a person does (`view.burrows`, since the rivals' pass in wave 2). Until then they learned the burrows by watching beetles come out of them: they missed a burrow a dig left until a beetle used it, and remembered ones that had closed over (about 2.5 close a round), so they expected scared beetles to dive into burrows that were gone.

Escapes from a chase went from about half (51%) to 43% with live food alone, and to 12% with all three; the ticks of chase per catch from 18.5 to 8.7, and catches from 3.6 to 5.1 a round.

**Less fruit, more beetles** (the owner: food is "a bit too plentiful most of the time", and more beetles, please). Rivals now hunt beetles well (above), so beetles can carry more of the food:
- two apples on the log, not three;
- up to two beetles out at once (it was one), and still coming in sudden death (they stopped at 2:00); coming out at 0.008 a tick while fewer than two are out (it was 0.006 while none was; 0.012 until the critique, see "Fewer beetles after all" below);
- one in six is golden (it was two in five; one in eight until the critique), so golden beetles stay about two a round;
- **The escape band: at least a third** (the owner, 31 October 2026: "Yeah, I feel it should be at least a third of the time."). Escapes from a chase are kept at 33–45%, up from the 20–35% the tuning below was held to. *Done (2w):* the dig is 4 ticks (`BEETLE_DIG`, from 6). Measured on seeds 3/11 (200 rounds each), escapes went from 25.7/24.8% to 40.5/38.4%; the rounds stayed as long (175 to 173/175 s), deaths by cause and every trademark stayed within noise, and beetles caught a round went from 12.4 to 12.0/11.9. A chase counts from a head within 6 cells, fixed (`CHASE_NEAR` in the simulation), not `BEETLE_FEAR`, so a change to how soon they take fright is measured on the same chases. The levers that didn't move it, each on seed 19 (150 rounds, 23.5% before): more burrows (`BURROW_MAX` 5: 24.4%), a longer run for one (`BEETLE_HOME_REACH` 9 with it: 23.4%), digging from farther with the same race (7 and 7: 25.2%), and scurrying at a snake's speed (28.5%). A dig of 5 brought 34.4%, then 33.1/31.8% on seeds 3/11, short of a third. With `--census`, the simulation's `--check` fails a run outside 33–45%. Measured before part 4's flight was in (the entry said after); to check again once it is.
- **a cornered beetle digs in:** with a head within 6 cells and no burrow nearer than 7, it stops and bores into the bark for 4 ticks (under half a second; 6 until 2w: the dig's cue, its sawdust spraying and the collar closing over it, plays out in that time, and a player near enough to catch it has the lesson). It can still be caught while it digs; then it's underground, comes out of a burrow later, as after a dive, and its bore is left a burrow (the burrow experiment, below). *Since 2w* it's a race the beetle wins from an approach: come straight at it from where it starts digging (6 cells) and it's gone two ticks before you're there; a head already nearer, or one that cut it off from its burrow, still catches it (the lesson, "Grab it before it's gone!", shows only for a dig that near: `DIG_NEAR`, the dig's length plus one). Before 2w: come straight at it and you were on it as its last tick ran out. Without the dig, a beetle in open bark was nearly always caught once the rivals hunted well (escapes fell to about 11%); with it they're inside the 20–35% that keeps a chase worth it, 27% at round six A's finish (the owner: "It is a bit more fun to chase them, and have them escape into a burrow sometimes … especially important, if the rivals actually become competent beetle hunters"). How it got here:
  - *the first build:* 8 ticks from a head within 6: escapes 28% in the study, and 33% once a dig left a burrow (the rivals as wave 1 left them);
  - *retuned after the rivals learned the dig* (wave 2): reading it, they reached most digging beetles in time and escapes fell to 13%; 5 ticks from a head within 7 brought them back to about 21% (19.9% and 21.7% on fresh seeds 41 and 29, 300 rounds each; the round as long). Digging earlier alone did little (a hunter covers a cell a tick, as many as the dig lasts); a shorter dig did it, and 5 was kept over 4 (22%) because the dig stays longer on the screen, where a player can see it;
  - *made a race by the critique:* 5 ticks from a head within 7 could never be won from an approach. Coming at it, your head is 7 cells off as the dig starts and it's gone 5 ticks later, 2 short (0 of 58 digs started by an approach were caught, in the critique's probe on seed 29), yet the banner said "Grab it before it's gone!". Now it's 6 ticks from a head within 6 (`BEETLE_DIG` never fewer than `BEETLE_DIG_FEAR`), and 70 of 91 such digs are caught. A dig you can win is mostly won, so escapes fell to 14%; more burrows (`BURROW_MAX` 4: 12–13%) and a longer run for one (`BEETLE_HOME_REACH` 9: 11–12%) only fed the hunters. What brought them back: a beetle runs from a head within 6 (`BEETLE_FEAR`, from 4), so it reaches a burrow more often. Escapes from a chase are 27.5 / 27.0 / 26.5% on fresh seeds 29 / 41 / 53 (600 rounds each; a chase now counts from a head within 6, not 4), and of all the beetles out, about 70% are caught, as before.
  - *The cue:* it stops, sawdust sprays, it sinks into the bark as the time runs out, and the collar of sawdust closes over it; its bore is left a burrow, freshly bored (see As built). (First called as a plug: its hole filled with sawdust behind it and left a little heap, with no burrow. The experiment below replaced that.)
  - *The lessons:* the first time one digs in near enough to catch, "A cornered beetle digs in. Grab it before it's gone!" The burrow it leaves has its own (the verify pass: the burrow rule had its cue and its Field guide row, but no banner): the first one a dig leaves in a round, "A beetle that digs in leaves a burrow behind." Most digs are far from you, so in about half of rounds that came before the dig's lesson, or without it; since the critique a dug burrow with the dig not yet taught teaches both, the dig first: "A cornered beetle digs in, leaving a burrow." And the closing over has its own (the critique: it had only its row in the Field guide), once the burrow's is told: "Past three burrows, the stalest one closes over."
  - *The rivals* (since their pass) see a digging beetle stay put until it's gone. They go for it when they can get there first and in time, and leave one they can't reach before it's under. They predict a cornered beetle's dig by the engine's rule as their search moves it, and the burrow it leaves, which a second beetle may run for.
  - *The burrow experiment* (the owner's idea, "just an idea"): a dig that leaves a burrow, and burrows that close over when nobody has used them for a while (sawdust and moss fill an old bore hole on dead wood), so the burrows follow the hunting instead of three fixed holes for the round. Each switch alone and both together, against the package without them, paired on fresh seeds 29 and 41 (600 rounds a seed; `abtest.js` for the round's length):
    - **A dig leaves a burrow: kept** (`BURROW_FROM_DIG`). Escapes from a chase 29.5% → 32.8%, inside the 20–35% (down a burrow 14.6 → 19.5%, dug in 14.7 → 12.9%; 2.5 dives a round into a burrow a dig left). Beetles caught (15.2 → 15.0 a round), the chase (10.3 → 10.6 ticks to a catch), room for apples (488 free cells), the round (168 → 167 s, the same within 3 s) and starving before the woodpecker (2.05 → 2.01% of snake-time) as they were; after it, 7.1 → 7.4%, undecided. No personality's win rate moved, within the test's ±12–14 points. Burrows open 2.21 → 2.29 on average: they still number three at most, and at three a dig's new burrow closes over the one unused longest. It's the one setting with escapes clearly inside the band and nothing else moved.
    - **Closing over when unused: tried, and off** (`BURROW_HEAL_MS` 0, kept as a switch). At 30 s it only left fewer burrows open (1.86; escapes 30.4%, undecided); at 60 s nothing at all. With digs leaving burrows it brought escapes nearer the ceiling: 33.7% at 30 s (its interval reaching 35.3%), 33.2% at 60 s. The cap already makes the burrows follow the hunting.
    - **Burrows keep apart** (`BURROW_SPACING` 10; the owner: "2 or all 3 of the burrows end up clustered really close"). Two causes:
      - a dig comes only where no burrow is within 7, so a dug burrow opened about 7 from the next;
      - a beetle coming out opened a new burrow where it's quiet, with no thought for the others, and round six A opens twice as many.

      In 100 AI rounds the nearest two were a median 9 cells apart (15 before round six A), and a quarter of rounds had two within 4. Now:
      - a new burrow opens at least 10 from the others whenever there's room (the quietest of a few such spots);
      - a dig nearer than 10 to a burrow takes its place: that one closes over, with its own lesson the first time in a round ("A beetle that digs in by a burrow takes its place.").

      The nearest two are now a median 16 apart, and none within 6.
- **As built** (wave 2, and the critique's numbers):
  - two apples (`APPLES`); up to two beetles at once, above ground or under (`BEETLE_MAX`; `game.unders` holds the ones underground, replacing `game.underground`), coming out at 0.008 a tick (`BEETLE_CHANCE`) in sudden death too, and coming up there too; one in six golden (`GOLD_BEETLE_CHANCE` 0.16);
  - a beetle scurries from a head within 6 (`BEETLE_FEAR`; 4 until the critique), running for a burrow nearer than 7 (`BEETLE_HOME_REACH`);
  - the dig: a head within 6 (`BEETLE_DIG_FEAR`) and no burrow nearer than 7, the reach it runs for, 6 ticks (`BEETLE_DIG`; 8 from 6 in the first build, 5 from 7 after the rivals learned it, until the critique). Knocked aside by the woodpecker or nudged by a cough, it scurries out of its hole, and may dig again where it lands;
  - *the dig's cue:* it stops, wiggles and trembles; sawdust sprays every 60–130 ms; it sinks, up to 45% smaller and darker, into a collar of sawdust that thickens as it goes. Gone, the collar closes and the burrow's there without a pop (it was bored, not cracked open), freshly bored: a raw pale rim, and splinters torn out past a ring of its sawdust. It holds that for 1.2 s and settles into an ordinary burrow by 4 s. With reduced motion it's half sunk and still, with no spray;
  - *a burrow closing over* (at the cap; since the owner's playtest it first grows shut over 6 to 14 s, see "Burrows grow shut" in `32-the-owners-playtest.md`) fills with a plug of sawdust from the middle out, a cushion of the log's own dark olive moss creeps over it, and it fades into the bark with its cracks in about 1.1 s, throwing a few specks of sawdust and moss; with reduced motion it's filled and mossed at once, then fades. It crumbles (see the sound; it was silent until the verify pass, and under the music until the critique). Both looks are timed on the page's clock from when it first drew the burrow, so watched at 4× they last a quarter as long in game time;
  - *the sound:* the dig is a quick scrabbling bore (about 450 ms: legs scratching, a rasp sinking into the wood, a low grind a phone can hear, a puff of sawdust), heard as yours when your head is the nearest, otherwise as a rival's; the dug dive is silent, since the bore said it, and so is the burrow it leaves (no creak: it was bored, not cracked open; until the verify pass it played the crack-open `burrow` cue. The old news line for a burrow cracking open is gone: a burrow only ever opens with a beetle coming out of it, which speaks for both). Rendered offline after a silent lead-in (see "Sound"), it's −32.7 dBFS at its loudest 50 ms (a rival's −38.4), about 8 dB under an apple (−24.7) and 4 under a burrow cracking open (−28.6), over a beetle's skitter (−41.6) by 9. (First rendered at the start of a render, which under-reads a sharp attack, it seemed level with an apple, −34.0 against −34.3.) A rival's dig is dulled like any rival's cue (softer, its top cut off), but since the critique its legs' scratches skip the dulling, at the rival's softer volume, so it's heard over the sudden-death music: at 3–6 kHz it lifts that music 9.9 dB (5.9 before), still about 6 dB under yours. A beetle going down a burrow or coming up keeps its quiet scrabble (`scrabble`, which was `dig`). A burrow closing over is a muffled crumble (`heal`, about 350 ms: five grains of sawdust trickling in, each lower and fainter, with a fleck of sawdust ticking in high over each, then a hushed pat as the moss settles), the world's: −40.3 dBFS at its loudest rendered offline the same way, about level with a beetle's skitter (−41.6), 9 dB over a beetle's scrabble (−49.8) and 8 under your dig. Until the critique it was 12 dB softer (−52.9, under even the scrabble), and the music hid it: now it lifts the sudden-death music 8.8 dB at 3–6 kHz and 7.8 above 6 kHz, where it lifted nothing. Its gap (400 ms) makes two digs ending together, closing two, one crumble;
  - *the lesson* is for a dig within `BEETLE_DIG` + 1 cells (7, across and down) of your head, one you could still catch: a move a tick through its 6-tick dig, and a flash's extra cell (it was 8, from when a dig lasted 8 ticks, so it taught digs nobody could reach). It shows only when the banner is free: a dig is over in half a second, so the next one teaches it;
  - *the burrow's lesson* (the verify pass) is for the first burrow a dig leaves in a round, anywhere on the log, when the banner is free for it (nothing showing or waiting, since "Teaching by showing"), else the next dug burrow teaches it; once a round: "A beetle that digs in leaves a burrow behind." Since the critique, with the dig's lesson not told yet, that burrow teaches both, "A cornered beetle digs in, leaving a burrow.", and neither comes again that round;
  - *the closing over's lesson* (the critique) is for the first burrow closing over once the burrow's lesson is told, when the banner is free for it, once a round, for watchers too: "Past three burrows, the stalest one closes over." (the stalest is the Field guide's "the one unused longest"). A dig at the cap closes the old burrow on its new burrow's tick, the closing first, so that tick teaches the burrow and a later one the closing over;
  - *the Field guide:* the Apple row says how many are on the log; the Beetle row is now Beetles (pictures of a beetle and one digging in): "Worth 2, up to two out at once, even in sudden death. They scurry from heads at half your speed. A cornered one digs in, so be quick, and leaves a burrow; past three burrows, the one unused longest closes over.";
  - *the voice:* a beetle that digs in and gets away: the rival that cornered it (the nearest head as it started, within 6, `BEETLE_DIG_FEAR`) says so as it goes under, at most every 30 s (Gobbler: "NO! My snack went DOWN!"; Mason: "Diggus escapus."; Desperado: "Varmint went to ground."; Mute *knocks on the bark, then shrugs*; Copycat: 深挖洞，广积粮！). One caught mid-dig is just a catch, and nobody speaks for you;
  - *the rivals* (since their pass) read the burrows as anyone sees them (`view.burrows`): a dug one the moment it's bored, a closed one the moment it closes. (Before, they learned burrows by watching beetles come out of them, so they missed a dug burrow until a beetle used it, and remembered one that had closed over.)
- **Measured** (600 rounds, seeds 3 and 11, against 8d9cde2; the rivals as wave 1 left them): beetles caught 5.2 → 15.1 / 15.0 a round, after a median 6 ticks of chase as before; escapes from a chase 9% → 32.8% (down a burrow 19–20%, dug in 13%); 6.9 / 6.8 digs a round, 2.6 / 2.4 dives into a burrow a dig left; burrows open 1.7 → 2.3; cells free for an apple before the woodpecker 477 / 475 → 488; starving 2 / 3% → 2 / 2% of deaths; snake-time in the hunger warning before the woodpecker 7.5% → 9.8%, after it 24.7 / 24.0% → 18.5 / 17.5%; every personality wins 19–33 / 16–31% (was 18–32 / 18–30%). A simulated round costs 14% more CPU (more beetles to model). (The study's: meals mid-round 19.8 → 16.6 a minute, beetles caught 3.7 → 13 a round.)
- **Fewer beetles after all** (the critique). Less fruit hadn't made food scarcer, as the owner meant it to: with the rivals hunting well, about 15 beetles a round more than made up the third apple, and every snake grew more, 23.1 cells a snake-minute against main's 21.4. Snake-time in the hunger warning before the woodpecker was 8.0 / 7.9%, less than main's 8.7 / 8.6% and under round four's target of at least 8% on three seeds of four; the aim was clearly above main's, about 9.5–10%. Fewer beetles alone barely moved it (0.012 → 0.008: 8.2 → 8.3% on seeds 3 / 11), since beads (about 64 a round) and the rivals' steadier meals carry it. So, three dials together:
  - beetles come out at 0.008 a tick, not 0.012 (still two at once, still in sudden death);
  - one in six is golden, not one in eight, so golden beetles stay about two a round (1.85);
  - a meal mid-round keeps you 12 s, not 13 (`HUNGER_MID_MS`, round four's dial for this: 12.5 s gave 9.0–9.6%).

  *Measured* (600 rounds a seed on fresh seeds 29 / 41 / 53, against 554ebf4): snake-time in the hunger warning before the woodpecker 7.9 / 7.8 / 7.9% → 10.1 / 9.9 / 10.0% (main 8.7 / 8.6% on seeds 3 / 11); starving before it 1.6 → 1.9% of snake-time (main 2.2%); growth 23.1 → 22.2–22.4 cells a snake-minute; beetles caught 15 → 11 a round, golden ones 2.0 → 1.85; abtest on 29 and 41, every row decided: the median round 164 → 167 s (+2.9 s, interval +0.4 to +4.9, inside the 155–175 s it's held to), sudden death 44 → 47 s, starving after the woodpecker 6.7 → 8.4% of snake-time; every trademark the same.
- **Gobbler** came out lowest (14.3% on seed 11) with fewer apples, so it's tuned: beetles are its food too. (As built it won 19 / 16%; the package alone had it at 12 / 22%; and 16 / 15% once the rivals read digs and knocked food.) Its tuning came with the rivals' pass: a new weight, `hurry`, how much a move longer to catch a beetle counts against it (`BUG_HURRY`, 2, for everyone else). At 1.5 Gobbler keeps after a running beetle longer than anyone. It won 20 / 26%, and its share of all food eaten was 28.8 / 27.8% against the field's 24.8 / 24.9% (28.4 / 26.4% before). With the dig shortened to 5 ticks (above) it was 16 / 24%, and 11 / 16% on fresh seeds 29 and 41: the lowest of the cast, near the band's floor. At round six A's finish (the dig a race, fewer beetles) it wins 18.3% over five seeds, and 16.8% with Gobbler in every round of seeds 3, 11, 29 and 41, its share of the food ahead on each; none of the 25 retunes tried, `hurry` among them, moved it beyond the noise, so its weights stay (see "Gobbler, at the floor" under "Round six A, measured").
- **Three more were retuned in the rivals' pass**, to stay inside 15–35% (600 rounds, seeds 3 / 11, with the dig at 8 ticks):
  - Ghost keeps a cell less distance (`distance` 6 → 5): 39 / 31% → 30 / 29%. It still keeps 11.0 cells from the nearest head, against the field's 9.7;
  - Colonist claims a little less land (`territory` 1.4 → 1.3): 27 / 37% → 29 / 27%;
  - Joker wants a little more room behind its lures (`margin` 4 → 6): 12 / 18% → 16 / 23%.

## From the owner's playtest (`32-the-owners-playtest.md`)

#### Burrows grow shut

**The finding** (the playtest of 20 October, queue item 3): past three burrows the stalest one closed over at once, in about a second, which looked abrupt.

**The call** (27 October 2026):
- **The rule.** A new burrow that opens while three are open (`BURROW_MAX`) starts the stalest growing shut. It takes a random time between `BURROW_SHUT_MIN_MS` and `BURROW_SHUT_MAX_MS` (6 and 14 s of game time; the engine's seeded randomness) and then closes over. The cap counts only open burrows, so there are three most of the time and briefly four. A dig nearer than `BURROW_SPACING` to a burrow also starts that one growing shut, instead of closing it at once. While it grows shut, a scared beetle can still run for it and dive in, but none comes out of it: `freeBurrow` skips it, so a beetle below comes up out of an open one, or waits.
- **The rivals** read it by the same rule, from `view.burrows` (each one carries `shutFrom` and `shutAt`): a burrow growing shut is a home a scared beetle runs to and dives into until it closes, as in the engine. A beetle doesn't come up out of it, and the AI never predicts where one comes up anyway. (A first build dropped a burrow from the AI's homes in its last second. The review caught that the engine has no such rule, so it was removed.)
- **The cue** (`drawShutting` in `render/burrows.js`), evenly over its time (it was eased out at first, which looked done by a third; see "The cue, evened out" below):
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

**The cue, evened out** (27 October 2026, PR #55). The owner: "Yes, you can try that and see if it adds to the game! Review it afterwards and make an expert call." Staged frames at 0, 1/3, 2/3 and 0.95 of its time had shown it all but done by a third (the plug drawn at full width early, the opening's rim and specks covered) and two thirds and nearly shut alike, the moss only small flecks. Now it goes evenly (above), the moss in cushions that read at phone size, and the scar a little stronger (0.45, was 0.3). With reduced motion nothing changes in it: it is a slow change of look, not motion, and the closing over keeps its calm version. The Field guide keeps its longer line over the spec's "A burrow left unused grows shut.": that alone reads as a timer, and the longer line says which one (past three, the one unused longest) and what it means for play (beetles still go in, none come out). `tools/render-test.js` checks the opening's dark pixels and the sawdust and moss in it changing by like steps each third, and the moss over a good part of a cell by the end. `tools/dev/burrow-shut/frames.js` stages the frames.

**Measured** (600 rounds each, seeds 3 and 11, against e55855a):

| | Before (seed 3 / 11) | After (seed 3 / 11) |
| --- | --- | --- |
| Chased beetles escaping | 25.4 / 25.5% | 24.8 / 25.9% |
| Burrows open, on average | 2.02 / 1.98 | 2.07 / 2.04 |
| Round, median | 166 / 166 s | 165 / 166 s |
| Deaths by cause | as they were, within a point or three | |

Escapes stay inside the 20–35%. The simulation's check passed on both seeds.

#### Beetles and the woodpecker

The owner (29 October 2026; entry 2m): beetles should "quickly try to escape down their burrow when woodpecker targets
their little island"; burrows ran out as the woodpecker pecked them; and beetles under a strike teleported. The rules
(`crawl`, `beakDepth`, `beakGap` and `knocks` in `engine/`):
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
- **The rivals** move each beetle in their search by the same rule (`bugCrawl` in `ai/beetles.js`, with `E.beakDepth` and
  `E.beakGap`). So a beetle bound down a burrow beyond the mark isn't chased, and one running off it toward a rival is.
  One gap, not worth its code: the AI's copy lets a fleeing beetle cross a body lying on the mark (the mark's cells
  read as holes there), where the engine stops it.
