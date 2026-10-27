# Progress

What is done and what comes next, in order (how to work through it: `CLAUDE.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add Haakon's new tasks where he places them, with his words quoted.

## State (27 October 2026)

Queue item 3, the fixes and polish from the owner's playtest, is under way: "Burrows grow shut" (PR #49), "The
outline glitch over a hole" (PR #52) and "Rainbows upside down" (PR #57) are done, and "Hunger where your eyes are" is next. Queue items 1, 1b and 2 are done (2: PR
#48, the online messages typed; 1: PR #41, render.js split into `render/`, and PR previews on Pages). The previews wait
on one setting: Pages still serves `main` (every "pages build and deployment" run so far has built `main`), so the
preview links in PRs do not open until Haakon switches Pages to "Deploy from a branch: gh-pages, / (root)". Everything
through PR #52 is in `main` (milestone #53); since 27 October the builder merges the develop-to-main PR itself
("Standing instructions" in `CLAUDE.md`). input-test failed 4 checks in 1 of 5 runs after #35's build; #38's fix of the
lessons block is probably that flake. Watch for it.

The plan and history that led here are in `docs/archive/plan-history.md`.

## For Haakon

Every open question for Haakon, until he answers it ("Questions come back to Haakon directly" under "Standing
instructions" in `CLAUDE.md`). Each task's last message and each milestone PR open with the same list.

| Task | Question | Reading taken or suggested | State |
|---|---|---|---|
| Sniper's kill line | Which words, beside "One shot."? | Haakon (27 October 2026): "One shot, one whoppertunity" (queued under item 3) | Answered |

## The queue, in order

### 1. Cheaper development and playable previews: one PR, no subagents

The owner's words are in `docs/handoff/next-tasks-verbatim.md`, with their two additions and one correction:

- CLAUDE.md's "How to work". *Done on 26 October 2026 (PR #39).*
- DESIGN.md split into `docs/design/`, moved as it is. *Done on 26 October 2026 (PR #39).*
- render.js split into modules, fully: the seventeen files of `render/`, sharing one scope. *Done on 26 October 2026 (PR #41).*
- PR previews on Pages at `/pr-<n>/` (`.github/workflows/pages.yml`, from the gh-pages branch), with main at the root and `sw.js`
  keeping their caches apart. *Done on 26 October 2026 (PR #41).* Haakon must switch Pages to "Deploy from a branch:
  gh-pages, / (root)" (the PR says how).
- Sizes before and after, in the PR. *Done (PR #41).*

### 1b. The other big files, split the same way (recommended by Claude, 26 October 2026)

After render.js, split the other game files over about 100 KB into modules by responsibility, one PR each, by the
same rule as render.js: only with identical simulation results and the suites passing, and only the parts that split
cleanly. render.js's way may suit them too (see the top of `render/core.js`: plain scripts sharing one scope, loaded in
order; engine.js and ai.js are also loaded by the Node tools, which would need the new list). In order: snake.js (196 KB), chatter.js (154 KB), engine.js (113 KB), ai.js (109 KB), style.css (101 KB). Every
later task then reads a few small files instead of these. Haakon may veto it.

- snake.js into the seven files of `game/` (renames where its names met render/'s; `tools/scope-test.js` guards the shared
  scope). *Done on 27 October 2026 (PR #43).*
- chatter.js into the four files of `chatter/` (its lines, in English and Chinese, and the talk). *Done on 27 October 2026
  (PR #45).*
- engine.js and ai.js stay whole (decided 27 October 2026). ai.js's `decide()` alone is one 68 KB function: splitting it
  means restructuring its inner closures, not a clean split. The engine's internals in the page's shared scope could be
  reached by name from the AI's code, against "what the AI is shown (`aiView()` only)"; kept in its closure, they can't.
- style.css into the three stylesheets of `style/`, linked in the same order. *Done on 27 October 2026 (PR #46).* With it,
  item 1b is done.

### 2. Types for the multiplayer messages: a small PR

Also in `next-tasks-verbatim.md`:

- `// @ts-check` and JSDoc message types in `net.js` and `online.js` only.
- `tsc --noEmit` in CI as a check. Nothing new is shipped and there's no build step.
- A hand-written typedef of the engine fields online.js reads.
- A round-trip test for every message kind.
- A pinned fingerprint of the message shapes together with the protocol version. It fails when the shapes change without a version bump.

*Done on 27 October 2026 (PR #48)*: see "The messages, typed" in `docs/design/22-play-with-friends-online.md`.

### 3. Fixes and polish (the owner's playtest of 2026-10-20)

- **Burrows grow shut, not instantly.**
  - When a new burrow opens at the limit, the stalest starts closing over a seeded random time of about 6 to 14 s. So there are 3 burrows most of the time and briefly 4.
  - While closing, a beetle can still dive in, but none comes out.
  - The cue: the opening shrinks as sawdust creeps in from the rim and moss and bark grain grow over it. At the end comes today's plug and moss, then a faint scar.
  - It needs online sync (a protocol bump), the rivals reading it through the same rule, a rules test, and a Field guide line ("A burrow left unused grows shut.").
  - Escapes must stay at 20–35%.
  - *Done on 27 October 2026 (PR #49)*: see "Burrows grow shut" in `docs/design/32-the-owners-playtest.md`.
- **Burrows grow shut, evened out.** Haakon (27 October 2026): "Yes, you can try that and see if it adds to the game! Review it afterwards and make an expert call." ("That": the change spread evenly over its 6–14 s, bolder moss at phone size, a slightly stronger scar, and the Field guide line weighed.)
  - *Done on 27 October 2026 (PR #55)*: see "The cue, evened out" in `docs/design/32-the-owners-playtest.md`.
- **The outline glitch over a hole.** Over a pit, the body's round segments bulge above its line and its pale rim disappears.
  - Repro: `node docs/handoff/stage-bridge-glitch.js <repo> p390 390x844@3t bridge`, with shots in a `shots/` folder beside the script.
  - Suspect: render.js's bridging shrinks the radius (`sunk()`) in the two-pass `bodyFills`, but the bands and beads (`shadeBands`, `shadeUnder`) and the rim don't follow.
  - Add a render-test check.
  - *Done on 27 October 2026 (PR #52)*: see "A body over a pit, smooth" in `docs/design/32-the-owners-playtest.md`.
- **Rainbows upside down.** `drawRainbow` deliberately hangs the arch downward from an apple in the log's upper half.
  - Fix: always upright. For an apple in the upper half, use a great circle centred below the log (cy about 1.15 × the board, its top about 0.06 × the board from the top edge). It rises out of the apple, over, and down off the far side, with red outermost.
  - *Done on 27 October 2026 (PR #57; its top on the board from every apple, over and down to the far side, in the PR after it)*: see "Rainbows upright" in `docs/design/32-the-owners-playtest.md`.
- **Rainbows, the follow-ups** (left open by PR #61). Haakon (27 October 2026), on Claude's three recommendations: "And I agree, queue!" One PR, render only:
  - *Rounder over the middle.* From an apple near the middle the arch rises only about a cell, which barely reads as a rainbow. Move the circle's centre higher (today 1.15 boards below the top edge) so the arch from a mid-board apple rises clearly before it comes down; keep its top on the board and red outermost. This changes the numbers of "Rainbows upright": record the new ones there, with before/after pictures.
  - *The lower half, mirrored.* An apple low on the board near the middle can still show only the rising side. Give the lower half the same rule as the top: up out of the apple, over, and down toward the far side, with the render check's 12 apples extended to cover it.
  - *A render check that doesn't depend on order.* The choking check in `tools/render-test.js` passes or fails by how many boards earlier checks set up, since each moves the random seed along. Give each check its own seed so adding one can't break another.
  - Accepted as it is: for an apple in the top two rows, the outer red band runs partly off the top edge. A rainbow clipped by the edge looks natural.
- **Hunger where your eyes are.** On a wide desktop the tag's hunger bar goes unseen, and the owner starved.
  - Show hunger on every snake: the body slims as hunger grows, the head wobbles with growl lines in the last seconds, and a starving snake pales.
  - Measure a new player's starving rate before and after.
- **The phone gap.** On upright phones there's empty space between the board and the controls.
  - Put the speed/help row and the chatter right under the board.
  - The woodpecker perches at full size over that row, and taps pass through it.
  - The chatter is folded by default to a one-line strip of the newest line, and a tap opens it.
- **Desktop chatter.** Fill the column down to the board's bottom edge with as many whole lines as fit (today it stops at about 5). Older lines fade at the top, and you can scroll back.
- **Wildcard's hair.** Not a comb-over: his real swoop, a big fluffy golden-blond pompadour swept back, then forward and to one side. It must read at phone size.
- **Copycat's face.**
  - While copying, the head mixes the copied colour about half and half with its red.
  - A thin red rim and the yellow star pin keep it Copycat. Uncopied, it stays full flag red.
- **Rival line-up.**
  - The pick isn't biased (3 uniformly from 18, with no memory between rounds).
  - Approved: a per-device shuffle deck, dealing all 18 before any repeat. Online, the host's deck decides.
  - Planned: choose your rivals. Each seat on the start card gets a swap button opening a picker of all 18 plus "Any".
    - "Any" seats come from the deck.
    - The choice is remembered under a NEW storage key.
    - Online, the host chooses.
    - Hall of Fame entries from chosen line-ups are marked "chosen".
- **Long names.** The 16-character cap already exists. When the "first out" banner doesn't fit, it drops the cause ("Gran is first out."), and the chatter keeps the full line.
- **Hunters miss easy pins.** Haakon (26 October 2026): "it seems they try to box you, but often don't on really easy
  opportunities where they got you squeezed against the wall."
  - Stage pins: a snake against the edge with one way out and a hunter beside it. Every hunter should close it, unless
    closing it would kill the hunter.
  - Suspects: the hunter's own fear of being pinned against the edge (it has to go to the wall to close one), its
    safety margin, and how far ahead the squeeze looks.
  - A rules test per hunter. Trademarks and win bands kept, and the rivals close pins on anyone, never on you in
    particular.
- **Sniper's longer kill line.** Haakon's words (27 October 2026): "One shot, one whoppertunity". Add it to Sniper's
  kill lines in `chatter/voices.js` beside "One shot.", with its translation in each language file (as `chatter/zh.js`
  has "One shot."), keeping the pun where the language allows. It must fit the banner and the chatter strip on a phone.
- **Mason's Caesar, the punchline and "Et tu" for everything.** Haakon (27 October 2026), on Claude's suggestion: "Yes,
  that would be quiet cool! Then it would show if they died from the edge, falling, or a mushroom also. Or lightning."
  - *The joke as his kill line.* Mason's kill line becomes "Vidi, vici, veni." (he saw, he conquered, then he came), and
    "Veni, vidi, vici." leaves his lines, so the proper version never spoils the punchline. "Veni, vidi, aedificavi."
    and "Veni, vidi, edi." stay.
  - *Last words that know what killed him.* Today a snake's last words know only a killer that is a snake ("Et tu,
    {who}?"); a death by anything else gets his plain lines. Give the last words the cause the engine already records
    (`cause` and `killer` on the crash), so Mason says "Et tu, …?" to whatever killed him: the edge ("Et tu, margo?"),
    a fall into a hole ("Et tu, fovea?"), fire ("Et tu, ignis?"), hunger ("Et tu, fames?"), the woodpecker ("Et tu,
    picus?"), a mushroom ("Et tu, fungus?"), lightning ("Et tu, Iuppiter?") and his own tail ("Et tu, cauda mea?"),
    for whichever of these the game has.
  - *Every rival, the same way.* The cause is there for all eighteen, so each gets last words for the deaths it can
    have, in its own voice, where they are funny, and the chatter shows how they died. Translations in each language
    file; the lines fit the banner and the chatter strip on a phone.
- **Last words on phones.** Haakon (27 October 2026): "Yes to all, expertly!" On phones with no chatter panel, the
  round-ending snake's last words are lost, and at 390x664 the strip's line is cut with an ellipsis (from #34;
  `docs/archive/plan-history.md`). Show the last words whole where a phone player sees them, without crowding the board.
- **A head-to-head mode in `tools/abtest.js`.** Haakon (27 October 2026): "Yes to all, expertly!" Old and new AI mixed in
  the same rounds on paired seats, which the optimization bar in `CLAUDE.md` calls for (the assistant's note of
  2026-10-18), and which the standing instruction "every new move is tested both ways" uses: rivals with a move and
  rivals without it on the same board. Before item 5, whose new moves need it.

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
- (None now: the last ones were queued on 27 October, and Sniper's kill line waits under "For Haakon".)
