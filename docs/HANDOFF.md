# Handoff (2026-10-26)

## State

Nothing is in progress. Every PR is merged: #33 (playtest), #34 (one screen), #35 (teaching step 1: banners you can read) and #36 (burrows keep apart). main is at 8b1eccd.

This branch holds only this note and the files in `docs/handoff/`. Until now they lived only in the conversation and in local files outside the repo (`.git/perry-tools`, the assistant's memory). Nothing here changes the game.

## How to check

- The suites, one at a time:
  - `node tools/rules-test.js`
  - `online-test`
  - `chatter-test`
  - `records-test`
  - `render-test`
  - `input-test`
  - `layout-test`
  - `ui-test`

  All are under `tools/`; CI runs them in three jobs (node, browser, layout).
- Balance: `node tools/simulate.js 200 --seed 3 --census` (and seed 11). A change that should keep behaviour must keep the fingerprints; `--root DIR` runs another copy of the game files.
- input-test failed 4 checks in 1 of 5 runs after #35's build. It may be a flaky timing check. Find it.

## How the owner wants the work done

- A question is a question: answer it, and don't act on it unless asked.
- Match effort to the task. Docs, READMEs, small fixes and config get one pass and no subagents.
- Use at most 2 agents unless the owner asks. Never stop to ask about this: pick the cheaper way, and say in the PR what you chose.
- Usage is limited: take the cheapest approach that does the job well.
- Read only the parts of large files a task needs.
- Run long simulations in the background and wait for the completion notice.
- At each milestone, open a PR the owner can play, say what to try, and carry on without waiting for review.
- Never push to main, never force-push, never merge. PRs target main.
- Check weekly usage after every commit, and wrap up as it approaches 95%.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, and PR bodies end with the Claude Code line.
- Rules that stand:
  - the rivals never treat a person differently: no `isPlayer` in AI logic, and no ability only people use;
  - every new rule needs a visible cue and a lesson;
  - every rival keeps its trademark;
  - never rename the storage keys (`snake-*`, `barkbite-muted`/`music`) or `net.js`'s PREFIX `'barkbite-'`.

## The queue, in order

### 1. Cheaper development and playable previews: one PR, no subagents

The owner's words are in `docs/handoff/next-tasks-verbatim.md`, with their two additions and one correction:

- CLAUDE.md's "How to work".
- DESIGN.md split into `docs/design/`, moved as it is.
- render.js split into modules:
  - fully, if it can be done cleanly with identical simulation results;
  - otherwise only the clean parts, saying in the PR what was left.
- PR previews on Pages at `/pr-<n>/`:
  - every push to main updates the site root;
  - `sw.js` must not mix main's and the previews' caches;
  - say exactly which Pages setting the owner must change.
- Sizes before and after, in the PR.

### 2. Types for the multiplayer messages: a small PR

Also in `next-tasks-verbatim.md`:

- `// @ts-check` and JSDoc message types in `net.js` and `online.js` only.
- `tsc --noEmit` in CI as a check. Nothing new is shipped and there's no build step.
- A hand-written typedef of the engine fields online.js reads.
- A round-trip test for every message kind.
- A pinned fingerprint of the message shapes together with the protocol version. It fails when the shapes change without a version bump.

### 3. Fixes and polish (the owner's playtest of 2026-10-20)

- **Burrows grow shut, not instantly.**
  - When a new burrow opens at the limit, the stalest starts closing over a seeded random time of about 6 to 14 s. So there are 3 burrows most of the time and briefly 4.
  - While closing, a beetle can still dive in, but none comes out.
  - The cue: the opening shrinks as sawdust creeps in from the rim and moss and bark grain grow over it. At the end comes today's plug and moss, then a faint scar.
  - It needs online sync (a protocol bump), the rivals reading it through the same rule, a rules test, and a Field guide line ("A burrow left unused grows shut.").
  - Escapes must stay at 20–35%.
- **The outline glitch over a hole.** Over a pit, the body's round segments bulge above its line and its pale rim disappears.
  - Repro: `node docs/handoff/stage-bridge-glitch.js <repo> p390 390x844@3t bridge`, with shots in a `shots/` folder beside the script.
  - Suspect: render.js's bridging shrinks the radius (`sunk()`) in the two-pass `bodyFills`, but the bands and beads (`shadeBands`, `shadeUnder`) and the rim don't follow.
  - Add a render-test check.
- **Rainbows upside down.** `drawRainbow` deliberately hangs the arch downward from an apple in the log's upper half.
  - Fix: always upright. For an apple in the upper half, use a great circle centred below the log (cy about 1.15 × the board, its top about 0.06 × the board from the top edge). It rises out of the apple, over, and down off the far side, with red outermost.
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

### 5. Round six B: the new moves (DESIGN "Round six B")

- **The island hop comes first.** The owner: "jumping is pretty critical to making this game more tense and skill based, rather than RNG". There are two test cases:
  - Gobbler folded on a strip;
  - `docs/handoff/owner-sniper-islands.webp`: Sniper won coiled on a strip, beside islands of beads across gaps of 1 to 3 cells.
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

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.
