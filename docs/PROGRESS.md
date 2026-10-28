# Progress

What is done and what comes next, in order (how to work through it: `CLAUDE.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add Haakon's new tasks where he places them, with his words quoted.

## State (27 October 2026)

Queue item 3, the fixes and polish from the owner's playtest, is under way: "Burrows grow shut" (PR #49), "The
outline glitch over a hole" (PR #52), "Rainbows upside down" (PR #57), "Hunger where your eyes are" (PR #66), "Rainbows, the follow-ups" (PR #68), "The phone gap" (PR #70) "Desktop chatter" (PR #72), "Wildcard's hair" (PR #74) and "Copycat's face" (PR #78), "Rival line-up" (PR #86), the head-to-head mode in `tools/abtest.js` (PR #80) and "Hunters miss easy pins" (PR #81) are done; next is the first open entry below. Queue items 1, 1b and 2 are done (2: PR
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
| Wildcard's hair (1b+++) | Which one: A, B or C? ([PR #110](https://github.com/HaakTuah/barkstreet-snakes/pull/110), pictures side by side; A a small wave and short swirl, B a middle wave with the swirl carried round to the far side, C a big wave swept well out to the side) | Suggested: B; the draft waits for the pick | Open |

## The queue, in order

### 1 and 1b. Done: cheaper development and previews (PRs #39, #41), the big files split (PRs #43, #45, #46); in `docs/archive/progress-done.md`.

### 1b+. Done: Wildcard's hair, again (PR #107); in `docs/archive/progress-done.md`.

### 1b+++. Wildcard's hair: Trump's hair, seen from above (Haakon, 28 October 2026; small, next, a UI lane beside the AI work)

Haakon (28 October 2026), on PR #107's pictures: "Also, looks like it is messing up wildcards hair again. But now by just
making it look like 2 weird yellow blobs instead. You can take a look and see how it is making it now. Hope that isn't
what it ends up going with." Then: "Can't you just describe who's hair it is making? Is it that difficult to make trump's
hair?" And, to sending it back with three versions for him to pick from: "Yes please, expertly!"

[PR #107's after](https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/32e97b81e878686f4951b3b21f27a411b3bc18e7/pr107-desk-clear.jpg)
draws a roll and a back mass as two shapes with a dark seam between them: two yellow halves, not a head of hair, and
heading up or down it covers most of the head. 1b+'s entry asked for a roll and a back mass, and #107 drew exactly that;
the wrong part was again the entry's. The reference is simply **Trump's hair**, which Wildcard caricatures (with the
stars-and-stripes body and the red tie): draw that, as seen from straight above (the head points +x).
- **One shape.** A single golden mass with no seam, gap or dark line inside it; it replaces `hairRoll()` and
  `hairBack()` as two shapes.
- **Front: a high wave.** Just behind the brow, swept up and back, its front edge at the hairline (about x = 0.12 of a
  cell, as now), with a lighter crest along it. Nothing over the eyes: both eyes show in all four headings.
- **Crown: the comb-over.** From the wave the hair is combed back and over to one side, the strands curving the same
  way, so the top of the head reads as one swirl to that side.
- **Sides and back fuller,** over where the ears would be and at the back, puffed a little past the head's outline, but
  not over the face.
- **Colour:** straw-gold, darker orange in the grooves between strands, one or two light strands for the shine.
- **Judged at real size.** The outline has to read on its own on a 390-pixel phone at its true size, not only in a
  zoomed crop.
- **Three versions for Haakon to pick:** A, B and C, differing in the size of the front wave and how far the swirl goes
  to the side. The PR shows them side by side, all four headings, on the clear and storm boards, at phone size (true
  size and 3x) and desktop 2x, and asks Haakon in "Questions for Haakon" which one; it stays a draft until he answers,
  and the lane goes on with other work meanwhile. Only the chosen one ships: no option in the game, the others deleted.
- Art only, no rule changes: the render suite and its looks checks pass; reduced motion unchanged; no reviewer needed
  beyond the pictures and Haakon's pick.

### 1b++. The phone's bottom: the chatter, the controls and the woodpecker (small, next, a UI lane beside the AI work)

Haakon (28 October 2026), with two screenshots from his phone ([the chatter open](https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/3a098b38f41f596834c3bd0fefc5c453eede2b1f/owner-2026-10-28-chat-open.jpg),
[the chatter shrunk](https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/3a098b38f41f596834c3bd0fefc5c453eede2b1f/owner-2026-10-28-chat-shrunk.jpg)): "See how the chat display overlaps with the buttons when it
is shrunk? Also, it defaults to shrunk at start, even though the space below is used for nothing else. And the
woodpecker is still too small when it is down there." Then, on whether it may cover things down there: "Really, I don't
mine if it covers stuff up down there. It isn't important. But it is important that it is big. Rather now it is big when
it enters the game screen, and shrinks to a miniature when it goes down there. It should stay much more consistent. And
it it purches on and interact with us elements down there, then that just looks cool really."
- **The page's own parts never overlap.** The shrunk chatter bar sits clear below the speed row, with the gap the other
  rows have; no button, row or line of chatter is laid over another. The woodpecker is the exception (below).
- **Open by default where there is room.** At the start, and on a resize or turn of the phone, the chatter opens to fill
  the space below the controls with as many whole lines as fit, down to the screen's bottom edge (its safe area kept),
  as the desktop chatter fills its column (PR #72). It starts shrunk only where fewer than three lines fit. A player who
  shrinks or opens it keeps that choice (in storage, read and written in try/catch).
- **The woodpecker keeps one size.** Below the board it is the size it is on the board, scaled with the board's cell,
  never shrunk to a miniature as today. It moves freely down there and may perch on, and play with, the controls and
  the chatter: landing on a button's rim, pecking at the chatter's edge, hopping between rows. Covering them is fine
  (taps pass through it, as decided on 20 October); what matters is that it is big and consistent, and alive there.
- **Proved by the layout suite** at phone sizes (390x844, 360x780, 412x915 and a short 375x667), with the chatter open
  and shrunk: no control's box meets another's or the chatter's text (the woodpecker not counted), taps reach a control
  under the woodpecker, the bird's size below matches its size on the board, and the chatter opens where three lines fit. Before and after crops at a phone's size in the PR.
- UI only, no rules changed; it runs as its own lane beside the AI work ("as many lanes as can run in parallel").

### 1c. Done: the big test files split (PRs #95, #96, #97, #100, #102, #103, #104); in `docs/archive/progress-done.md`.

### 2. Done: types for the multiplayer messages (PR #48); in `docs/archive/progress-done.md`.

### 3. Fixes and polish (the owner's playtest of 2026-10-20)

Its done entries (PRs #49 to #92) are in `docs/archive/progress-done.md`, "Item 3, done".

- **The lobby shows the line-up.** The answer to the rival line-up's question (28 October 2026): online, the lobby
  shows the host's line-up from the start card, and the host (only) can change it there with the same seats to choose,
  so online play stays in step with local play ("Online stays in step", with a protocol bump if a message changes).
  A small follow-up; the guests see the line-up as it stands.
- **Long names.** The 16-character cap already exists. When the "first out" banner doesn't fit, it drops the cause ("Gran is first out."), and the chatter keeps the full line.
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
    picus?"), a mushroom ("Et tu, fungus?"), lightning ("Et tu, Iuppiter?") and his own body ("Et… ego?", Haakon's pause, in Latin: "ego" is both "I" and what kills a wall-builder who bites himself),
    for whichever of these the game has.
  - *Every rival, the same way.* The cause is there for all eighteen, so each gets last words for the deaths it can
    have, in its own voice, where they are funny, and the chatter shows how they died. Translations in each language
    file; the lines fit the banner and the chatter strip on a phone.
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
- (None now: the last ones were queued on 27 October, and Sniper's kill line waits under "For Haakon".)
