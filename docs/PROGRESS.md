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
| (none open) | | | |

## The queue, in order

### 1 and 1b. Done: cheaper development and previews (PRs #39, #41), the big files split (PRs #43, #45, #46); in `docs/archive/progress-done.md`.

### 1b+. Done: Wildcard's hair, again (PR #107); in `docs/archive/progress-done.md`.

### 1b+++. Done: Wildcard's hair, Trump's (PR #110); in `docs/archive/progress-done.md`.

### 1b++. Done: the phone's bottom (PR #112); in `docs/archive/progress-done.md`.

### 1c. Done: the big test files split (PRs #95, #96, #97, #100, #102, #103, #104); in `docs/archive/progress-done.md`.

### 2. Done: types for the multiplayer messages (PR #48); in `docs/archive/progress-done.md`.

### 5. Round six B: the new moves (DESIGN "Round six B"); next AI entry, right after Copycat's part of 3b

Moved up by Haakon (29 October 2026): "It's the one I am most interested in playing, and it has been pushed back for a
long time now. Also, the teaching system will have to account for it." It is the next AI entry once Copycat's part of
3b (PR #142) merges, ahead of Wildcard's part of 3b, 2b, 2h, 2i and 3c; the art and sound lanes (2d, 2f, 2j) run
beside it as before. A playable draft PR as early as it can be, so Haakon can try it this evening.

*Done so far:* **the island hop** and **no auto-jump** (PR #158: a jump goes over up to 3 cells, a cell a tick; a press waits 5 moves; the landing ring; protocol 16).

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

**Every move of the round, in this order** (Haakon, 29 October 2026, when the design session found the entry listed only
part of "Round six B": "Yes, they are all part of the power update! What i have been looking forwards to!"). Each part
is its own playable PR, tested both ways (`tools/abtest.js`) with every trademark measured, as the island hop was; the
design's words for each are in `docs/design/29-round-six-b-the-new-moves.md`:
1. **The island hop and no auto-jump** (done, PR #158).
2. **Bridges** (under way on `round6b/bridges`).
3. **The flashes cut:** the plain flash through a body one thick, the golden through two (and fire out), and a cut
   that leaves a snake fewer than 3 segments puts it out ("The neck cut"; a flash into a head is a failed flash); a failed flash
   costs 5 and a longer stun, its rest 10 to 12 s; **dropping your own tail** by the same cut; and **Mason's double
   walls**, since a wall one thick can now be cut (its straight runs measured before and after).
4. **The golden jump flies:** hold to fly up to 5 cells, steer in the air, the gold ring where you'd come down; with
   **leap now** (a second press while a jump waits sends it at once, open ground included: "Leap now" in the design); with
   **bumps in the air** (a crash's cost, and you drop where you are: over fire you catch alight too, over a hole you
   fall in, onto a snake you're out, trapped).
5. **Gold portals for the wrap:** anyone may follow through for about a second after your body passes.
6. **Dropped charges** on a knockout, as above.
7. **One pricing model for every power,** as above, last, so it prices every move together, with **each rival's power
   style** ("Every rival has a power style"); the design's "Balance targets" are its measure.
Then the teaching system (item 4), which teaches all of them.

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

### 2c. Done: the woodpecker, 1.3 times (PR #139); in `docs/archive/progress-done.md`.

### 2d. Done: rivals' chomps (PR #150); in `docs/archive/progress-done.md`.

### 2e. Done: the woodpecker pecks beside a snake, not on it (PR #141); in `docs/archive/progress-done.md`.

### 2f. Done: Wildcard's hair, lacquered (PR #144, version F); in `docs/archive/progress-done.md`.

### 2f+. Done: Wildcard's hair, a size smaller (PR #156, `WILD_SIZE` 0.85); in `docs/archive/progress-done.md`.

### 2g. Done: the meal goes down (PR #146); in `docs/archive/progress-done.md`.

### Fix. Done: the layout suite's screen-awake checks no longer hang on the machine's speed (PR #161): the section holds the round's loop still, so your snake can't crash on its own between steps on a slow machine. (`scripts/test.sh` exits 1 on a failure; piped through `tail`, use `set -o pipefail`.)

### 2h. The endgame: eat what keeps you alive, not what boxes you in (Haakon, 29 October 2026; an AI entry, after 2b)

Haakon (29 October 2026): "snakes should maybe avoid food more with the woodpecker about? I see snakes gorging on the
remains of other snakes, when they have only a few tiles left to move on. They are not doing a context relevant tradeoff
calculation there, clearly." And: "But sometimes starving still lasts you longer than increased length will, with so
little room also."

Today `decide()` sets `lean` once sudden death begins ("nobody can afford to be picky"), so food counts in full however
little room is left, and rivals grow into the space they need to turn in. The trade-off, for every rival through the
shared template:
- **A meal is worth the life it buys, against the room it costs.** Weigh how long the snake lasts each way: starving,
  it shrinks a segment every 1.5 s and frees room as it goes; eating, it gets a meal's time but grows into its pocket.
  It eats when hunger would end it before room would, and leaves the food when the length would box it in first. With
  room to spare, food counts as today.
- **Personality still shapes it:** Gobbler stays the greediest (its food share is its trademark), the careful ones
  the most sparing.
- **Measured** head to head on fresh seeds against the AI 2b leaves: deaths in sudden death by cause (self, body, boxed
  in, starved), who outlasts whom in the endgame, per-rival wins, every trademark within noise.

### 2i. Food seasons: lean, normal and plentiful rounds (Haakon, 29 October 2026; an engine-rules entry, after 2h)

Haakon (29 October 2026): "I think it should be a but more agressive. Someone should at least die from it once in a
blue moon. Now games maybe feel a bit too samey? It's pretty predictable. But if food levels varied more, that would
change things up."

Starving is 1 to 3% of deaths (round four's measure, `docs/design/25-round-four-measured.md`), so a snake almost never
starves, and rounds feel alike. Each round draws its **food season**, as it draws its weather:
- **Lean:** apples and beetles come more sparsely, so hunger bites and a snake starves now and then. **Normal:** as
  today. **Plentiful:** more food, snakes grow long, and the danger is crowding. First guesses for the odds (lean 1 in
  4, normal 1 in 2, plentiful 1 in 4) and the rates, set by measuring and left to tuning.
- **Seen and taught:** a start banner names it ("A lean season…", "A season of plenty…"), with a one-time lesson and a
  Field guide row ("Every new rule needs a visible cue and a lesson"). Everyone, rivals included, sees the season, as
  they see the weather (`aiView()`), and the rivals play it: sparing and hungry-minded in a lean round, wary of
  crowding in a plentiful one.
- **Measured:** starving reaches about 5 to 8% of deaths overall, more in lean rounds; the spread of round lengths and
  of deaths by cause widens, per season; per-rival wins within noise overall; every trademark kept; no refuges.
- **Online:** the host draws the season and sends it; a protocol bump.

### 2j. Babble voices for the chatter, never distracting (Haakon, 29 October 2026; a sound lane)

Haakon (29 October 2026): "And should the chat lines be voiced?" Then, to babble voices: "And make sure the voices
arent distracting! That would be a real turn off!"
- **Babble, not speech:** when a rival's bubble appears, a short synthesized burble in its own voice (pitch, timbre,
  rhythm: Mason clipped and deep, Gobbler gobbly, Ghost faint, and so on; Mute stays silent), made in `audio.js` with
  Web Audio, no recordings and no dependencies.
- **Never distracting, first of all:** well under the eating sound, at most about half a second whatever the line's
  length, never two at once, at most one every few seconds, never over your own sounds (eating, warnings, crashes), and
  quieter still in tight moments. Its own switch in the sound settings ("Voices").
- **Haakon judges it:** the PR stays a draft until he has played its preview and says it isn't distracting; if he
  isn't sure, it ships switched off by default.
- Rivals only for now (your own snake's lines, from the teaching system, stay silent). Online, each player hears it on
  their own machine: no protocol change.

### 2k. The woodpecker, as big as it can get away with (Haakon, 29 October 2026; small, an art lane)

Haakon (29 October 2026): "I think the woodpecker should be even bigger". Then, when the design session asked for a
simulation check: "How should a visual change alter the actual game in any way?" It can't: the bird's size is one
drawing constant (`BU` in `render/bird.js`), while the rules peck by target cells (`game.woodpecker`), so no
simulation is run for it. And then: "Maybe make it as big as you can get away with without it falling out of the
screen, or being pushed onto the gameplay screen when not pecking, or anything."
- **The biggest that passes every check,** found by trying sizes up from 1.3, not guessed: one size wherever the screen
  has room for it, as 2c set, and on screens with less room the biggest each of its perches allows (the perches
  already shrink it, `PERCH_MIN_PX` and `PERCH_FLOOR_PX`; they keep doing so, from the new size).
- **The checks,** at a 390-pixel phone held upright and on its side, a tablet both ways and desktop: all of it stays on
  the screen, in every pose and flight (crouching, its tail, its wings open); perched, it never reaches onto the board,
  nor over the buttons' words or the chatter; drumming, it hides no food, no head and none of the tiles it is about to
  peck beyond what it hides at 1.3; and nothing else on the page moves to make room for it. The layout suite gets a
  test for each check, so a later change can't break them.
- The PR shows 1.3 beside the new size on each of those screens, perched, flying and drumming, says the size it found
  and what stopped it growing further, and merges once the render and layout suites pass.

### 2l. Flags that bend as a snake goes over them (Haakon, 29 October 2026; small, an art lane beside 2k)

Haakon (29 October 2026): "would be cool if the flags of sovereign and colonists bends away from a snakes body,
depending on direction it was hit when a part of a snake occupies its tile". Drawing only (`render/flags.js`), so no
simulation; online, each player draws it from the snakes they already have: no protocol change.
- **Pushed the way it was hit:** when any part of any snake lies on the tile of Sovereign's banner or a colony's flag,
  the pole bends over from its foot in the direction that snake was travelling as it came onto the tile (from the cell
  before it in the body to that one), so a snake going east pushes it east, and the cloth trails low behind it. It
  stays bent while the body lies on it, and bends the new way if another snake comes over it from another side.
- **Springs back:** once the tile is free, it swings upright with a short wobble that dies away, then flies as before.
  With reduced motion it simply leans while covered and stands up again, without the wobble.
- **One flag, one look:** it works with what flags already do (the banner's tilt as it's carried, its shake when
  pecked, a colony flag falling into its pit), never fighting them; the falling flag wins. The PR shows a snake
  crossing a banner and a colony flag from each side at a 390-pixel phone and desktop 2x (pictures and a short clip),
  and merges once the render suite passes.

### 3. Fixes and polish (the owner's playtest of 2026-10-20)

Its done entries (PRs #49 to #124) are in `docs/archive/progress-done.md`, "Item 3, done".

### 3b. The rivals who change: Capricious, Copycat and Wildcard (Wildcard's part after 5)

*Capricious done (PR #126), Copycat done (PR #142), 29 October 2026; the readings are in the design file.* **Wildcard's
part waits** (after 5), built on the branch `wildcard-shows-its-mix`: two or three traits a round from eight (`TRAITS`
in `ai.js`), its tag's note ("This round: hungry, reckless and hunts"), a brag as its first line (with its Chinese), a
Field guide row, protocol 16 with `mix` synced, rules tests, and the simulation's `--signatures` reading each trait's
trademark. Left to do: merge `develop` into it (its `ai.js` predates 5), re-check the traits that showed weakly in a
first 40-round look (coward, tail-rider: given Ghost's and Creeper's room weights since), the A/B and head to head,
pictures, review.

As `docs/design/35-capricious-copycat-and-wildcard.md` describes: Capricious does impressions of every other rival from
a shuffled deck, each with its costume and an opening line; Copycat plays as the leader plays, copying a person by what
they do; Wildcard draws a few strong traits a round and shows them. One PR, or one per rival if that is cleaner.

Haakon (29 October 2026), playing: "I am seeing copycat shy rotten apples twice now, that was within reach. Both were
next to the map edge." Copycat left an apple it could reach, beside the board's edge, until it rotted. Likely suspects:
its mimic weight (120) outweighing the pull of food, and the room and margin weights that count an edge cell against a
move. Copycat's part of 3b fixes it, and first checks with a census whether every rival does it: of the apples that
rot, how many were within a rival's reach, and how far each was from the edge. A competent snake takes a safe apple by
the wall ("Clever rivals, human reactions"); one it takes into a dead end doesn't count as safe.
*Checked in PR #142* (`tools/dev/rotten-apples.js`, 150 rounds, seed 21): Copycat had been the worst, 0.20 apples
passed up (its head within 2) and left to rot a minute alive, 0.15 by the edge; with its copied habits and its pull to
mimic cut from 120 to 40, 0.13 and 0.09, mid-field. But every rival does it: 80% of the apples that rot lie on the edge
row or one in, and Sniper (0.19), Capricious, Mason and Mute pass up as many. A general edge-apple fix is noted below.

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

### 4. The teaching system, steps 2–6 (DESIGN "Teaching by showing") — after 5, whose new moves it must teach

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

### 6. Round six C: the woodpecker in three acts

The draft is in `docs/handoff/woodpecker-acts-draft.md`.

- Also: an A/B test of food knocked aside against food falling into the hole, with a `?food=fall` knob for the owner's playtests.
- If the knock stays, it gets bark chips spraying out and a little bounce where it lands.
- Ghost's memorial: the planned smoke wisp, or the owner's idea of a broken shackle with a few chain links. Ghost's tongue stays smoke.
- The earlier "the bird eats the food" variant for that A/B is in `tools/dev/r6-study-tools/patch-flex3.js` (PECK_FOOD).

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

### 8. Last: beetles who meet, fight (Haakon, 29 October 2026; an engine-rules entry, after everything else)

Haakon (29 October 2026), watching two beetles walk about an island the woodpecker made, away from the snakes: "Looked
a bit boring that they just walked around like that, I wanted something to happen. Therefore, given how rare it is, i
thought it should feel special." Then, to the design session's take: "Love how you described it! And it should come
late, it is probably the most uneasecary feature we have discussed here, so leave it last or close to last".
- **They notice each other:** two beetles within about 4 cells, with no head near enough to scare them, stop wandering
  and walk towards each other, sizing each other up, so you can see it coming.
- **A shoving match:** head to head, wing cases up, a buzzing clack, a second or two of pushing.
- **One loses:** the loser flips onto its back, legs waving, for about a second, then rights itself and runs for a
  burrow; the winner lifts its wing cases and buzzes, as they do now and then, but bigger.
- **The gamble:** while they fight they only bolt from a head within 2 or 3 cells, not 6, so a snake that spots it
  and gets there in time (over a hole by a jump, if need be) can take one or both. The rivals see fighting beetles as
  they are, an easier catch, and go for it when it pays, as for any food; a rules test proves it, through the same
  engine calls.
- **Every new rule needs a visible cue and a lesson:** the frame lights up emerald as for a beetle, the clack and buzz
  as world cues, and a Field guide row.
- **Online stays in step:** a protocol bump if the beetles' messages change.
- **Measured:** the simulation counts fights a round (rare is fine, as long as it happens), and deaths near a beetle,
  the one real risk, stay within noise.

## Noted, not yet queued

- **Apples by the edge rot** (found in PR #142's census, `tools/dev/rotten-apples.js`): 80% of the apples that rot lie
  on the edge row or one in, passed up by rivals whose heads came within 2. The room and margin weights likely count an
  edge cell against a move even when the apple is safe; an AI entry could test a safe-meal exception like the one for
  meals by the neck (`MEAL_DAWDLE`).

Small things found on the way, for Haakon to place in the queue:
- (None now.)
