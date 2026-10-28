# Progress

What is done and what comes next, in order (how to work through it: `CLAUDE.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add Haakon's new tasks where he places them, with his words quoted.

## State (27 October 2026)

Queue item 3, the fixes and polish from the owner's playtest, is under way: "Burrows grow shut" (PR #49), "The
outline glitch over a hole" (PR #52), "Rainbows upside down" (PR #57), "Hunger where your eyes are" (PR #66), "Rainbows, the follow-ups" (PR #68), "The phone gap" (PR #70) "Desktop chatter" (PR #72), "Wildcard's hair" (PR #74) and "Copycat's face" (PR #78), "Rival line-up" (PR #86), "The lobby shows the line-up" (PR #116), the head-to-head mode in `tools/abtest.js` (PR #80) and "Hunters miss easy pins" (PR #81) are done; next is the first open entry below. Queue items 1, 1b and 2 are done (2: PR
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
| Nerve at a contested apple | Gobbler takes the gamble only once it's hungry (about 4 s left), which is rare, so in play its share of contested apples didn't move (17% both). Should a fed Gobbler gamble too? | Taken: no, as built ("the more the hungrier it is"); a fed Gobbler would need a nerve of about 0.9, near fearless (PR #92) | Open |
| The woodpecker's size under the board (1b++) | Measured, it was already its board size under the board: 78 to 80 px tall on a 390 px phone, drumming on the board 78 to 85 ([PR #112](https://github.com/HaakTuah/barkstreet-snakes/pull/112)); what looks small is likely its slim side view beside the 44 px buttons, while on the board its wings are open. Should it be bigger, on the board and under it alike (say 1.3 times, so it covers more of the board as it drums), or bigger only under the board (then not one size)? | Taken: one size, as the entry says, so unchanged; it now clings to the buttons and pecks them. Suggested, if bigger: 1.3 times everywhere | Open |
| Wildcard's hair, the new pass (1b+++) | Does the new pass ([PR #110](https://github.com/HaakTuah/barkstreet-snakes/pull/110), beside B and C) read as Trump's hair now, or should C go back in? | Taken: the new pass ships (merged); C comes back in one small PR if you prefer it | Open |

## The queue, in order

### 1 and 1b. Done: cheaper development and previews (PRs #39, #41), the big files split (PRs #43, #45, #46); in `docs/archive/progress-done.md`.

### 1b+. Done: Wildcard's hair, again (PR #107); in `docs/archive/progress-done.md`.

### 1b+++. Done: Wildcard's hair, Trump's (PR #110); in `docs/archive/progress-done.md`.

### 1b++. Done: the phone's bottom (PR #112); in `docs/archive/progress-done.md`.

### 1c. Done: the big test files split (PRs #95, #96, #97, #100, #102, #103, #104); in `docs/archive/progress-done.md`.

### 2. Done: types for the multiplayer messages (PR #48); in `docs/archive/progress-done.md`.

### 3. Fixes and polish (the owner's playtest of 2026-10-20)

Its done entries (PRs #49 to #122) are in `docs/archive/progress-done.md`, "Item 3, done".

- **Last words on phones.** Haakon (27 October 2026): "Yes to all, expertly!" On phones with no chatter panel, the
  round-ending snake's last words are lost, and at 390x664 the strip's line is cut with an ellipsis (from #34;
  `docs/archive/plan-history.md`). Show the last words whole where a phone player sees them, without crowding the board.
### 3b. The rivals who change: Capricious, Copycat and Wildcard

As `docs/design/35-capricious-copycat-and-wildcard.md` describes: Capricious does impressions of every other rival from
a shuffled deck, each with its costume and an opening line; Copycat plays as the leader plays, copying a person by what
they do; Wildcard draws a few strong traits a round and shows them. One PR, or one per rival if that is cleaner.

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
