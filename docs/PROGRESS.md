# Progress

What is done and what comes next, in order (how to work through it: `CLAUDE.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add Haakon's new tasks where he places them, with his words quoted.

## State (27 October 2026)

Queue item 3, the fixes and polish from the owner's playtest, is under way: "Burrows grow shut" (PR #49), "The
outline glitch over a hole" (PR #52), "Rainbows upside down" (PR #57), "Hunger where your eyes are" (PR #66), "Rainbows, the follow-ups" (PR #68), "The phone gap" (PR #70) "Desktop chatter" (PR #72), "Wildcard's hair" (PR #74) and "Copycat's face" (PR #78), "Rival line-up" (PR #86), "The lobby shows the line-up" (PR #116), "Last words on phones" (PR #124), the head-to-head mode in `tools/abtest.js` (PR #80) and "Hunters miss easy pins" (PR #81) are done; next is the first open entry below. Queue items 1, 1b and 2 are done (2: PR
#48, the online messages typed; 1: PR #41, render.js split into `render/`, and PR previews on Pages). The previews wait
on one setting: Pages still serves `main` (every "pages build and deployment" run so far has built `main`), so the
preview links in PRs do not open until Haakon switches Pages to "Deploy from a branch: gh-pages, / (root)". Everything
through PR #52 is in `main` (milestone #53); since 27 October the builder merges the develop-to-main PR itself
("Standing instructions" in `CLAUDE.md`). input-test failed 4 checks in 1 of 5 runs after #35's build; #38's fix of the
lessons block is probably that flake. Watch for it.

The plan and history that led here are in `docs/archive/plan-history.md`.

## For Haakon

Every open question for Haakon, until he answers it ("Questions come back to Haakon directly" under "Standing
instructions" in `CLAUDE.md`). Each task's last message and each milestone PR open with the same list. Answered rows: `docs/archive/progress-done.md`, "For Haakon, answered".

| Task | Question | Reading taken or suggested | State |
|---|---|---|---|

## The queue, in order

### 1 and 1b. Done: cheaper development and previews (PRs #39, #41), the big files split (PRs #43, #45, #46); in `docs/archive/progress-done.md`.

### 1b+. Done: Wildcard's hair, again (PR #107); in `docs/archive/progress-done.md`.

### 1b+++. Done: Wildcard's hair, Trump's (PR #110); in `docs/archive/progress-done.md`.

### 1b++. Done: the phone's bottom (PR #112); in `docs/archive/progress-done.md`.

### 1c. Done: the big test files split (PRs #95, #96, #97, #100, #102, #103, #104); in `docs/archive/progress-done.md`.

### 2. Done: types for the multiplayer messages (PR #48); in `docs/archive/progress-done.md`.

### 2b. Hunger's worth at a contested apple, for every rival (Haakon, 29 October 2026; an AI entry)

Haakon (29 October 2026), on the "For Haakon" question whether a fed Gobbler should gamble too: "Agreed to all,
expertly! Shouldn't the others contest apples more if they're hungry? They're worth more than, because usually apples
just gove you plus 1, but if you are starving, they give you 1 and save you 1, so become plus 2? But yes, gobbler should
contest it regardless. And Desperados being an adrenalin junkie, should generally be less risk averse?"

Today hunger already makes every rival look for food harder (`foodW0`, `eatW0` in `decide()`), but only Gobbler and
Desperado set aside any of a rival's threat at a contested apple (`w.nerve`), so a starving rival still backs off an
apple it needs. Build it from the cause, in the one template every rival shares:
- **An apple is worth what it saves.** For every rival, a contested apple's worth counts the length it adds and, when
  the rival is starving or close to it, the length it stops it losing: about one more, as Haakon says, and more as the
  hunger clock runs down. The planner weighs that against the head-on risk as it reads it, so a starving rival contests
  because the apple is worth more, not because of a special rule. Each rival's own weights still shape it: the cautious
  ones (Ghost) still give way sooner than the bold.
- **Gobbler contests even when fed:** a moderate nerve at any hunger, rising with it to the cap (today's 0.85), since
  "eats everything, even a rival's apple" is its character.
- **Desperado is less risk-averse everywhere,** not only at food: a lower fear of rivals' heads and of where they might
  be, as an adrenaline junkie's; its skims stay its trademark.
- **Measured** with `tools/abtest.js` on fresh seeds, against today's AI: per rival, the share of contested apples won,
  deaths head-on, starving deaths and length lost to hunger, and wins; every trademark within noise, except the two
  meant to move (Gobbler's food share up; Desperado's skims and risks up, its survival not collapsing). "No refuges" and
  "Clever rivals, human reactions" stand: better choices, never faster reactions.

### 2c. The woodpecker, 1.3 times (Haakon, 29 October 2026; a layout lane)

Haakon (29 October 2026), "Agreed to all, expertly!", to the "For Haakon" question on its size and the design session's
take: **1.3 times its size, on the board and under it alike** (one size). Under the board it still clings to and pecks
the buttons. Since it covers more of the board as it drums, check with the simulation that round length, deaths by
cause and per-rival wins stay within noise; pictures at a 390-pixel phone and desktop, as for PR #112.

### 2d. Rivals' chomps (Haakon, 29 October 2026; small, a sound lane)

Haakon (29 October 2026): "Yes, queue it. Feels strange that there is no sound, when your snake makes loud sound when
eating." Today only your own snake's eating sounds (`sounds()` in `game/round.js`: `e.type === 'eat' && isMe(e.snake)`);
a rival's makes no sound, except a golden mushroom, which already plays softer and further off (`{ rival: true, ...at(e.x) }`).
- **Every rival's eating sounds,** each kind with its own cue as yours does (apple, golden, meat, mushroom, beetle,
  leaf), but softer and further off, placed where it ate on the board (`at(e.x)`), so you can hear a rival feeding where
  you aren't looking. Your own stays the loudest and the only one with the streak's rising pitch.
- **Never a pile-up:** four snakes eating at once must not drown your own chomp or clip (the compressor and the cues'
  spacing in `audio.js`); rivals' chomps give way to yours, as other rival sounds do.
- Muted and the sound settings work as for every cue; online, each player hears it on their own machine, so no
  protocol change. A test checks that a rival's eat plays its rival cue and yours plays yours.

### 2e. The woodpecker pecks beside a snake, not on it (Haakon, 29 October 2026; small, an art lane after 2c, which draws the same bird)

Haakon (29 October 2026): "Looks a bit weird when the woodpecker pecks a tile with a snake tail on, and the snake isn't
hurt. Is it possible to make it so visually, it doesn't peck exactly on the snake? So it looks natural that the tiles
go, but that the snake is left unhurt? Just a visual issue, nothing gameplaywise." And: "Yes please, expertly!"
- **Drawing only** (`render/bird.js`, `render/bird-draw.js`): the tiles go at exactly the same moment as today; no rule,
  timing, simulation fingerprint or online message changes.
- **On a tile with a snake on it, the beak aims at the free corner or edge farthest from the body** (the body is drawn
  narrower than its cell, so that spot shows), and the tile cracks and crumbles from that spot inward, so the bird is
  seen chipping the log beside the snake, and the snake being unhurt reads as natural. On an empty tile it pecks the
  middle, as now.
- The aim's mark and the trembling of what lies in it (`render/food.js`) stay as they are. Reduced motion: the same
  aim, no crumble animation, as today's peck.
- Pictures in the PR: before and after of a peck beside a tail and on an empty tile, at a 390-pixel phone and desktop.
  Entry 6 (the woodpecker in three acts) keeps this aim.

### 2f. Wildcard's hair: lacquered, not a mop (Haakon, 29 October 2026; small, an art lane, next)

Haakon (29 October 2026), on PR #110's hair as it plays: "Trump's hair looks like a mop now…" Then, to one more pass:
"Yes, and make it do it expertly! I want trump's hair for Pete's sake!"

Three passes so far: two blobs (#107), a golden bun (#110's C), and now twenty fine strands with no outline, which read
as straw or a mop. His hair is none of those: **one smooth, lacquered mass, combed and sprayed into place**, glossy and
solid, never stringy. Seen from above (the head points +x):
- **One sculpted shape,** C's overall outline with B's smaller back, puffed a little past the head over the ears and
  behind, never over the face. Its edge is set off by a soft darker-gold shadow on the head beneath it, not a dark
  stroke round the hair and not a feathered fringe.
- **Asymmetric: the comb-over.** A parting on one side; from it the top is combed across the crown to the other side
  and swept back, so one side reads fuller and the whole top reads as one sweep in one direction. The asymmetry is
  what makes it his.
- **The front: one big wave,** just behind the brow, rolled up and over to the side as a single curl, with its
  shadow on the brow; both eyes clear in all four headings.
- **A few long, broad comb grooves,** three to five, all following the sweep: not twenty strands, not scoring on a loaf.
- **Gloss:** one long highlight along the crest of the wave and the sweep, near-white, so it reads as sprayed hair.
- **Colour:** pale gold-blond, yellow highlights, a warm orange-gold only in the grooves' shadows.
- **The test before the pictures go to Haakon:** a fresh helper (Haiku, given only the true-size and 3x crops of the
  versions, never this entry or the reference) is asked "describe this snake's hair in five words". A version passes
  if the answer reads as a swept, combed, glossy hairstyle, and fails on mop, straw, bun, bread, helmet or hat. Show
  only versions that pass.
- **Up to three versions that pass, side by side with C and the current hair,** at true phone size (390 px), phone 3x
  and desktop 2x, all four headings, clear and storm boards. **The PR stays a draft and does not merge until Haakon
  picks one** (#110 merged before his verdict; this one waits). Only his pick ships.
- Art only: the render suite and looks checks pass; reduced motion unchanged.

### 2g. The meal goes down: a hungry snake fills out from the head (Haakon, 29 October 2026; small, an art lane)

Haakon (29 October 2026): "I notice snakes imidately become plump again when after eating while starving. I feel it
should be an animation where you see it transform to getting plump and its color back." And: "Yes, expertly!"

Today `hungerLook()` (`render/looks.js`) works out `slim` and `pale` afresh every frame from the hunger clock, so when a
hungry snake eats, the clock resets and it snaps back to plump and its own colour at once.
- **The meal travels down the body:** from the head, the body swells back segment by segment, as if the food were
  going down, and the colour floods back with it, over about 0.6 to 0.8 s (a first guess; judged by eye). Each
  segment eases from how slim and pale it was to how the new clock says it should be, so a meal that only partly
  refills the clock fills it out only that far. Eating again mid-swell starts a new wave from the head.
- **Every snake alike,** yours and the rivals', and the corpse rule unchanged (starved, it stays thin).
- **Reduced motion:** no travelling wave; the whole body eases back in a short plain fade.
- **Drawing only:** the hunger clock, the rules, the simulation's fingerprint and online play are unchanged (each
  player draws it from the same clock on their own machine).
- Pictures in the PR: a frame strip of a starving snake eating, at a 390-pixel phone and desktop.

### 3. Fixes and polish (the owner's playtest of 2026-10-20)

Its done entries (PRs #49 to #124) are in `docs/archive/progress-done.md`, "Item 3, done".

### 3b. The rivals who change: Capricious, Copycat and Wildcard

As `docs/design/35-capricious-copycat-and-wildcard.md` describes: Capricious does impressions of every other rival from
a shuffled deck, each with its costume and an opening line; Copycat plays as the leader plays, copying a person by what
they do; Wildcard draws a few strong traits a round and shows them. One PR, or one per rival if that is cleaner.

Haakon (29 October 2026), playing: "I am seeing copycat shy rotten apples twice now, that was within reach. Both were
next to the map edge." Copycat left an apple it could reach, beside the board's edge, until it rotted. Likely suspects:
its mimic weight (120) outweighing the pull of food, and the room and margin weights that count an edge cell against a
move. Copycat's part of 3b fixes it, and first checks with a census whether every rival does it: of the apples that
rot, how many were within a rival's reach, and how far each was from the edge. A competent snake takes a safe apple by
the wall ("Clever rivals, human reactions"); one it takes into a dead end doesn't count as safe.

### 3c. A new rival: the Charmer (Haakon, 29 October 2026; an AI entry, after 2b and 3b)

Haakon (29 October 2026): "add Charmer to the queue, exactly as I have prescribed, with his clingy unique playstyle."
A vain show-off, named **Charmer**. His look, and the mark he leaves on the map when he dies, are Haakon's to give: this
entry doesn't specify them, and the art waits for his description. Everything else:
- **The trademark: courting.** He picks the biggest snake on the board, whoever it is (by length, never by who plays
  it: "The rivals never treat a person differently"), sidles up and slithers alongside it, two or three cells off its
  flank, matching its turns. Nobody else in the cast runs beside a rival: Creeper rides tails, Sniper cuts snakes off.
- **Why it pays:** riding alongside, he sees where his "date" is heading and beats it to the apple, stealing its meal at
  the last moment.
- **Rejected:** when the courted snake turns toward him, he backs off, and that dodge can leave him exposed to a third
  snake, so anyone who reads him can beat him ("No refuges").
- **Vain:** he loves the open middle of the board, where everyone can see him, and hates coiling into corners; he goes
  for golden food (the spotlight) and shuns mushrooms (shrinking ruins the look); overconfident in open space, so easy
  to bait into a Sniper's line.
- **His tongue is a hairspray can:** a little spritz when he flicks it.
- **Lines** in his own voice for kills, wins and chatter, as every rival has (`chatter/`), and a blurb for the start
  screen.
- **Built from the one template** (`ai.js`: his weights, and a driver for courting), measured like every rival: his
  trademark (time spent alongside a rival's head, and apples stolen from the snake he courts) and an `abtest.js` run on
  fresh seeds showing courting pays against a Charmer who doesn't court; every other rival's trademark within noise.
- **The cast grows to nineteen:** the start screen, the Field guide's row for him, the lobby's line-up, `CLAUDE.md`'s
  "a cast of eighteen", and Capricious's deck of impressions (3b) gain him; online play gets a protocol bump.

### 4. The teaching system, steps 2–6 (DESIGN "Teaching by showing")

Step 1 is merged (#35):
- 2. the full-size woodpecker on upright phones;
- 3. your snake's voice;
- 4. the coach and the pictures, from one engine query;
- 5. the Field guide's rows and "Tell me again";
- 6. the tests.

The prototypes and the judges' verdicts are in `docs/handoff/teaching-prototypes/`:
- `voice.patch` is the base;
- `show.patch` has the pictures and the bird's deep perch;
- `first.patch` has the coach, `blockedFor` and `R.teachBoxes`.

Banner time rose to 55–61% of play in step 1, because lessons are still banners; step 3 should bring it to about 20%.
The teaching audits in `tools/dev/teach/audit` and `tools/dev/teach-build/audit` play rounds as a new player and measure
every banner: use them to measure it. The patches were made before DESIGN.md was split: their DESIGN.md hunks now belong
in `docs/design/29-round-six-b-the-new-moves.md` and `docs/design/30-teaching-by-showing.md`.

### 5. Round six B: the new moves (DESIGN "Round six B")

- **The island hop comes first.** The owner: "jumping is pretty critical to making this game more tense and skill based, rather than RNG". There are two test cases:
  - Gobbler folded on a strip;
  - `docs/handoff/owner-sniper-islands.jpg`: Sniper won coiled on a strip, beside islands of beads across gaps of 1 to 3 cells.
- **No auto-jump** (the owner agreed). A press stays armed until a hurdle 4–5 cells ahead is reached (`LEAP_WINDOW` is 3 ticks today), for rivals too. The landing ring shows where you'd land, and it gives no trap warnings.
- **One pricing model for every power:**
  - gain is searched from where the power ends, plus a tempo credit for flashes and the island reached for jumps;
  - the tail tip is priced at what length is worth now (cheap late in the round);
  - an idle power gets cheaper, with a floor kept for a way out;
  - risk is a failed flash (about 5 segments and a longer stun) or a bump in the air, weighed by each rival's nature;
  - not a junkie like Star, and not hoarding.
  - Caution: at a flat 1-apple price, rivals flashed 3 times a minute and did no better. Judge it by the seat-split A/B.
- **Dropped charges:** not on every bump. On a knockout, the charges spill where the head fell as a golden pickup anyone can grab.
- **Bridges:** as in DESIGN. Crawl on where the body crosses the rim, or land on it from a jump where it will still be there.
- The earlier start on jumps is `docs/handoff/jumps-wip-unverified.patch` (on f338275). It's unverified; redo it or check it first.

### 6. Round six C: the woodpecker in three acts

The draft is in `docs/handoff/woodpecker-acts-draft.md`.

- Also: an A/B test of food knocked aside against food falling into the hole, with a `?food=fall` knob for the owner's playtests.
- If the knock stays, it gets bark chips spraying out and a little bounce where it lands.
- Ghost's memorial: the planned smoke wisp, or the owner's idea of a broken shackle with a few chain links. Ghost's tongue stays smoke.
- The earlier "the bird eats the food" variant for that A/B is in `tools/dev/r6-study-tools/patch-flex3.js` (PECK_FOOD).

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

## Noted, not yet queued

Small things found on the way, for Haakon to place in the queue:
- (None now.)
