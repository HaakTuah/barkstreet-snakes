---
name: next-round-ideas
description: "THE PLAN (2026-10-18): three PRs after round five. PR A fairness and fixes; PR B the new moves and power styles; PR C weather, polish, onboarding, optimization. Built continuously, never waiting for review."
metadata:
  node_type: memory
  type: project
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-26T20:04:42.358Z
---

## HANDOFF (2026-10-26): branch handoff/2026-10-26 (19e3d15, pushed, no PR) has docs/HANDOFF.md with the whole queue plus the local-only files (the tasks verbatim, the teaching prototypes, the acts draft, the glitch repro, the jumps WIP). #33-#36 are all MERGED (main 8b1eccd). Start from there.

## WHERE I STOPPED (2026-10-20, weekly usage 94%, wrapped up; see [[usage-plan]])

- **#32, #33 and #34 (one screen, with the board-first fix) all MERGED.** CI was green on #34.
  - Open from #34: phones with no chatter panel lose the round-ending snake's last words; 390x664 cuts the strip's line with an ellipsis.
- **#35 DRAFT, "Teaching by showing, step 1"** (feature/teaching at 590d746; worktree .git/perry-tools/teach-build/wt; Auto-fix on). It holds:
  - DESIGN's round six B and "Teaching by showing";
  - step 1 (251f955): banners held for their reading time (1 s + 0.4 s a word, at most 4.5 s), queued with a 0.5 s breather, lessons waiting at most 6 s, never mid-board, on upright phones one line over the header's title, no slam.

  Banner time ROSE to 55-61% (from 48%), because lessons are still banners; step 3 (the voice) is what brings it to about 20%. Six of 79 lessons were skipped after 6 s.

  input-test failed 4 checks in 1 of 5 runs after the build: find the flaky check. The PR body has no pictures yet. Logs in .git/perry-tools/teach-build.
- **BURROWS CLUSTER (the owner, 2026-10-20: "2 or all 3 of the burrows end up clustered really close now after the update")**: confirmed and diagnosed with .git/perry-tools/burrow-cluster/measure.js (100 AI rounds, seed 3, 24x24).
  - The median distance between the nearest two burrows is 9 (15 before round six A). A pair within 4 cells shows up in 24% of rounds (10% before).
  - Cause 1: a dug burrow opens about 7 cells from the nearest (median 7), because a beetle digs only when no burrow is within 7 (BEETLE_HOME_REACH).
  - Cause 2: a burrow a beetle opens when it comes out is placed "where it's quiet" with no spacing from other burrows, and round six A opens twice as many.
  - The fix, prototyped: a new burrow from a beetle coming out tries for 10+ cells from the others (up to 6 quiet picks); a dug burrow closes any burrow within 11 of it (it takes its place).
  - Result: median 15, no pair within 4 in any round.
  - Before shipping: check escapes stay in the 20-35% band, beetles caught, the persona band, a rules test, a DESIGN note and a Field guide line, on more seeds. Small: its own fix commit, early next session.
- **BURROWS GROW SHUT, NOT INSTANTLY** (the owner, 2026-10-20: "Can you make it so burrow nr. 3 doesn't disappear instantly when a new burrow appears? ... some noise to when a burrow closes up ... a graphical effect? It grows shut, or gets filled up"). The call, built WITH the spacing fix as one burrow change:
  - When a new burrow opens at BURROW_MAX, the stalest starts closing over a seeded random time (about 6-14 s, e.g. BURROW_CLOSE_MS 10 s ±40%). So there are 4 for a while, 3 most of the time. The same goes for a burrow a dig takes the place of.
  - While closing, it still takes a beetle diving in, but none comes out of it: a last refuge that runs out.
  - The cue: the opening shrinks steadily as sawdust creeps in from the rim and moss and bark grain grow over it. You can read how long it has left. At the end, today's 1.1 s plug and moss (drawHeals), then a faint scar.
  - Needs: online sync (a protocol bump), the AI and beetle prediction through the same engine rule, a rules test, a lesson or Field guide line ("A burrow left unused grows shut."), and escapes kept in the 20-35% band.
- **GLITCH: a body over a fresh pit** (the owner, 2026-10-20: "The part of you that is over the hole gets a really odd outline"). Reproduced with .git/perry-tools/bridge-glitch/stage.js, scene `bridge` (run: node stage.js <repo> p390 390x844@3t bridge; shots in shots/).
  - Over the pit, the segments' round beads bulge above the body's line, and its pale rim is gone on that stretch.
  - Suspect render.js's bridging: rad shrinks by sunk() in the two-pass bodyFills, while the bands and beads (shadeBands, shadeUnder) and the rim don't follow it.
  - Fix with a render-test check.
- **JUMPS (the owner, 2026-10-20):** they considered auto-jump, then reconsidered: it would have jumped them into a trap they'd have survived by bumping. Agreed: NO auto-jump.
  - Instead, make the timing easy. A press could stay armed until a hurdle 4-5 cells ahead is reached (LEAP_WINDOW is 3 ticks now; the audit found most new players' presses ran out early). It applies to rivals too.
  - The landing ring (PR B, and the coach's bright ring) shows where you'd land, so judging the landing is the skill, not button timing. No trap warnings: the judges rejected danger predictions.
  - Rivals already weigh a jump by searching on from its landing against their best crawl, bump included.
- **BURROW SPACING SHIPPED as PR #36** (fix/burrow-spacing at a68cdf9; worktree .git/perry-tools/burrow-fix/wt): BURROW_SPACING 10 (placer `apart`), a dig takes a near burrow's place, the burrowTaken lesson.
  - Rules, online, chatter and records suites pass; the browser suites run on CI.
  - The escape check (simulate 200 rounds on seeds 3 and 11, main against the fix) is in .git/perry-tools/burrow-fix/sim-*.log: read it and note it on #36.
  - The owner wants usage kept for the rest of the week: do nothing more until the reset.
- **HUNGER WHERE YOUR EYES ARE** (the owner, 2026-10-20). On the wide desktop layout they sometimes starve, because the tag's hunger bar is off to the side and "your eyes never go to the side". This undercuts the teaching design's "after round 2, hunger has only its tag's bar and rumble".
  - The call: hunger shows on the snakes themselves, for EVERY snake (so you can read rivals too):
    - the body slims as hunger grows (plump when fed, thin when hungry);
    - in the last seconds before starving, the head wobbles with growl lines, beside today's gurgle sound;
    - starving, it pales.
  - Measure the new player's starving rate in the audit's play runs, before and after. Fold it into the teaching PR (step 3 or 4).
- **PHONE GAP** (the owner, 2026-10-20, .git/perry-tools/owner-shots/phone-gap-2026-10-20.jpg). They like the phone layout, but there's a big empty gap between the board and the controls and chatter, which sit squished at the bottom. They say the woodpecker may be bigger and cover some buttons (they stay tappable), and question whether the chat log matters on a phone at all.
  - The call:
    - close the gap: the speed and help row and the chatter sit right under the board;
    - the woodpecker perches at FULL size over that row, with taps passing through it (this matches the teaching judges' bird call);
    - on upright phones the chatter is folded to a one-line strip of the newest line by default (rivals' lines are in their bubbles anyway), and a tap opens it; leftover height goes below.
  - The board can't grow on an upright phone (it's width-bound), so this is about looks and reach, not board size.
- **Wildcard's hair** (the owner, 2026-10-20: "Wildcard has a combover hairstyle, which real-life Trump doesn't have"). Redraw it as his actual swoop: a big, fluffy golden-blond pompadour, swept back on top and then forward and to one side at the front, with volume, not a thin comb-over. Keep it readable at phone size.
- **Copycat's face** (the owner, 2026-10-20: its constant strong red against a constantly shifting body stands out). The call: while it copies, its head takes the copied colour mixed about half and half with its red, so it reads as part of its body. A thin red rim and the yellow star pin keep it Copycat. Uncopied, it's full flag red as now. Its name tag keeps the red.
- **Desktop chatter** (the owner asked, 2026-10-20: should the computer get more dialogue too? It's short, with lots of space under it). Yes: on desktop the log fills the column down to the board's bottom edge, as many whole lines as fit (it stops at about 5 now, with about 290 px empty under it at 1920x945). Newest at the bottom, older lines fading at the top, scrollable to read back. No tap needed there; the tap-to-open strip is for phones.
- **Rival line-up** (the owner asked if it's biased, 2026-10-20). It isn't: engine.js pickOpponents draws OPPONENTS (3) uniformly without repeats from all 18 (ai.js POOL), with no memory between rounds. So 44% of rounds share a rival with the last one, and a given rival is missing for 10+ rounds about 16% of the time.
  - **Shuffle bag: APPROVED** (the owner: "Sounds good"). Per device: deal through all 18 before any repeats, so you meet everyone within 6 rounds. Online, the host's bag.
  - **Choose your rivals** (the owner: "maybe we could add the option to customize who you play against"). The call:
    - on the start card each rival seat gets a swap button that opens a picker of all 18 (face, name, one-line note) plus "Any";
    - "Any" seats are filled from the bag; the choice is remembered per device (a NEW key, e.g. snake-lineup; never rename the old ones);
    - online, the host chooses;
    - rounds against chosen rivals still count, but their Hall of Fame entries are marked "chosen", so wins against hand-picked rivals (say, three Drabs' worth of easy) show as such.
- **Upside-down rainbows** (the owner, 2026-10-20: "Rainbows sometimes appear upside down"). It's by design in render.js drawRainbow: from a golden apple in the log's upper half, the half-circle hangs DOWN (`up` false), because an upright one was a stub off the top edge.
  - The fix: always upright. For an upper-half apple, use a great circle centred below the log (for example cy = 1.15*SIZE, its top about 0.06*SIZE from the top edge). The arch rises out of the apple, over, and down the far side, off the edge, with the far foot fading. Red stays outermost.
  - Check it with a staged shot. Small.
- **Long names** (the owner asked for a cap, 2026-10-20). There is already one: 16 characters (records.js MAX_NAME, the inputs' maxlength, and cleanName on everything received online or stored). Only the "first out" banner with a long cause can overflow, at 320 px. The call: keep 16, and when that banner doesn't fit, drop the cause from it ("Gran is first out."); the chatter keeps the full line. A tiny fix with an input-test check.
- **FIRST AFTER THE RESET (Oct 26): the owner's "cheaper development and playable previews" task**, in one session, with no subagents or workflows. The full spec is in .git/perry-tools/infra-task-2026-10-21.md:
  - CLAUDE.md's "How to work";
  - DESIGN.md split into docs/design/;
  - render.js split into modules, with identical fingerprints, skipped if risky;
  - PR previews on Pages at /pr-N/, with sw.js kept apart;
  - one PR, with sizes before and after.
  The owner chose to WAIT for the reset (usage was 96% on 2026-10-21).
  - THEN a second small PR, in the same file: // @ts-check plus JSDoc message types for net.js and online.js only, and tsc --noEmit in CI. No build step, nothing new shipped. Also in it:
    - a hand-written typedef of the engine fields online.js reads;
    - a round-trip test for every message kind;
    - a pinned fingerprint of the message shapes together with the VERSION, which fails when the shapes change without a version bump.
  - Then carry on with the rounds.
- **NEXT SESSION:** burrows growing shut (on top of #36) and the bridge glitch above; check #35's CI and its flake; then the teaching steps 2-6 on feature/teaching; then PR B (rebase onto feature/teaching); then PR C.
- **TEACHING DESIGN DONE:** the judges agreed on one combined system, written into DESIGN.md "## Teaching by showing" (feature/powers-3 at eb3b878, pushed; no PR for powers-3 yet).
  - The judges' text is in .git/perry-tools/teach-judges.txt.
  - The prototypes are .git/perry-tools/teach/{voice,show,first}/design.patch: voice is the base; show has the pictures and the bird's deep perch; first has the coach, blockedFor and R.teachBoxes.
- **TEACHING PR (#35):** branch feature/teaching (worktree .git/perry-tools/teach-build/wt), made of feature/powers-3 plus main. Step 1 (the banner queue and placement) is DONE. Still to come:
  - 2. the full-size bird;
  - 3. your snake's voice;
  - 4. the coach and pictures, with one engine query;
  - 5. the Field guide rows and "Tell me again";
  - 6. tests.
  It targets main, carrying #34 until #34 merges, and goes BEFORE PR B's moves.
- **PAUSED:** the PR B rules chain (wf_acc93a92-3bf; a 76-line unverified start is saved as .git/perry-tools/r6b/jumps-wip-unverified.patch). Rebase PR B onto feature/teaching when it resumes.
- **Next after that:** PR B (its moves taught through the teaching system), then PR C (the woodpecker in three acts, .git/perry-tools/r6c-woodpecker-acts.md), then PR D.

## How to run it (the owner, 2026-10-18)

- **Three PRs, one after another.** "always continue with the next one, once finished. don't wait up the night for me!"
  - Each PR branches from the previous PR's branch and targets main; it carries the earlier commits until those merge.
  - Never stop between PRs to wait for review.
- **EVERY new rule needs a visible cue AND a lesson** (a one-time lesson banner and a Field guide row). The owner called this "very important".
- **Every rival accounts for every gameplay change.**
  - It uses the rule (a rules test where the AI uses it when it pays).
  - It sees it used against it (a rules test where it avoids it).
  - It goes through the same engine calls, with no isPlayer. Keep a checklist per rule. See [[game-ai-fairness]].
- **Persona signatures must survive:** measure each rival's trademark before and after.
  - Mason's straight runs (the owner: "Keep watch!"), Ouroboros's coiling, Creeper's tail-riding, Ghost's distance.
  - Gobbler's food share, Vulture's beads, Sovereign's time home, Mute's boxing, Joker's lures, Desperado's skims, Star's flash rate.
- **Balance:** tune how often you can flash and jump, the costs, and the golden charges together by simulation. State the chosen numbers for the owner's playtest.
- **Kept on purpose, overriding my "candidates to cut" suggestion:**
  - The failed-flash penalty stays. Without a higher risk, everyone flashes all the time with no drawback; the risk is what keeps cautious play from being a losing proposition, and stops Star crushing everyone.
  - Mid-air collisions stay. Colliding with a body mid-air costs the same as a usual collision and you fall: a pit beneath you means death, a body or the ground means the normal crash rules where you drop. Two snakes airborne in the same cell both take that.
- **Scratch work:**
  - the study in scratchpad/r6-study (woodpecker, food, beetles, fire and weather stats);
  - the lag-spike diagnosis in scratchpad/r6-spike.
  - Fold both in.

## FIRST, before more big sims: make the simulations efficient (the owner's TOP priority, 2026-10-18)

The owner: the sims made the laptop unusable; "the most important step we can do as early as possible, as it is the bottleneck impacting all else".

- **Done** (a297480 plus the cache-key fix): simulate.js uses half the cores at below-normal priority, a machine-wide one-at-a-time lock, and a seeded-run cache (keyed on tuning, ai, engine and simulate). browser.js spawns Chrome at below-normal priority (BARKBITE_PRIORITY=normal for timing runs). A background PowerShell loop re-lowers node and headless chrome priority (task b5lqc3nnn, 10 h).
- **Profile** (6 rounds, 1 worker): ai.js is 95.5% of sim CPU. `evaluate` alone is 73% (a timed flood fill plus a WHOLE-BOARD territory multi-source BFS per search leaf), decide 14%, engine 3%.
- **DONE and MERGED into feature/powers-2** (8361ea8, then main merged in at 120c258): the optimization. ai.js 2.4x faster with identical decisions (fingerprints 139025481/745200860/489503396 at 300 rounds on seeds 3/11/29; 353710037 at 60 on seed 3). Tools: bench-ai, abtest, --save-at/--from, a per-round cache. Suites trimmed: CI 1,275 -> 108 CPU-s; online-test 94 -> 6.5. Approximate territory: not adopted. Full report in .git/perry-tools/opt-result.json.
- **Follow-up MERGED** (854eb81 into feature/powers-2 at 56632c7) plus 8d9cde2: simulations queue first come first served (tickets in tmpdir/barkbite-sim-queue; tested: a waiting run goes right after the current one, not after a back-to-back loop); bench-ai exits 2 when a persona went unchecked.
- **2026-10-19 night: #31 (phones) MERGED** (main 69b8993). Wave 2 part two merged into round six: AI 855eaab (the rivals learned knocks, the dig, live burrows and two beetles; Gobbler hurry 1.5; Ghost 6->5; Colonist 1.4->1.3; Joker margin 4->6) and the woodpecker 1268e84 (bounding flight, a watching eye, 14 blows on the drum's table, its layer the board plus perch, ~20% less GPU). Then the dig tuned: BEETLE_DIG 5 and BEETLE_DIG_FEAR 7, escapes back to about 21% (0c8e913). Round six at 554ebf4, fingerprint 582354997. **THE PR A CRITIQUE IS RUNNING** (wf_e6c24c9f-e8d). Open: Vulture and Mute went past 35% on fresh seeds. Then the measured table, the PR pictures and PR A.
- **PR B STARTED (2026-10-20):** branch feature/powers-3 from PR A; DESIGN's "## Round six B: the new moves" at f338275 (with teaching by showing and Gobbler's endgame). Rules chain running (wf_acc93a92-3bf): jumps, flights, bumps and bridges, then flashes, cuts, self-cut and portals, then the rivals (power styles, Mason's double walls, Gobbler), then balance by simulation. Each step's report carries a CONTRACT for wave B2 (render, UI with held jump and online, voice, teaching), which waits for the teaching design (wf_4b5ac324-bd1).
- **PR A OPEN as #32 (2026-10-20)**: feature/powers-2 at 3a6e6ad -> main; pictures on pr-media 0d6250e; body in .git/perry-tools/r6a-finish/pr-body.md. Gobbler is 18.3% pooled (left for PR B's endgame move); every persona is 18-32% pooled over five seeds; CI has three jobs (layout on its own). NEXT: PR B (the new moves) on top of feature/powers-2, with the teaching system (show, don't tell) as its foundation once that design lands.
- **PR A CRITIQUE DONE** (2026-10-20): 35 findings, 34 fixed, all merged into feature/powers-2 at 15d51d7 (fingerprint 78597151). Notable: the dig is now 6 ticks from 6 cells (5/7 was unwinnable when you triggered it); the bird clings away from its rings; food retuned (less fruit hadn't made food scarcer); the cough staircase fixed. FINISHING (wf_134c9b12-75f): the check's 5 items (the Coughing row, comments, the knock flight, Gobbler at the 15% floor plus Vulture and Mute on five seeds), the docDeltas, "Round six A, measured", PR pictures in .git/perry-tools/r6a-finish/shots/final, then a verify. THEN OPEN PR A (feature/powers-2 -> main).
- **PLAYTEST REBUILT** (fix/playtest-2 at f004bce: the header redesigned for the Field guide's book plus fullscreen on every kind of screen; 8 check fixes; my fix 778e2f3 keeps a win's New best badge; main merged). layout-test 1083, ui-test 234. **NO-SCROLL BUILD RUNNING** on top of it (wf_3264aa95-243, branch fix/playtest-3). Then ONE PR to main: the playtest fixes plus no scrolling, with pictures.
- **SHOW, DON'T TELL** (the owner, 2026-10-20): lessons flash by too fast to read while playing (26 banners, mostly 2.6-3 s) and sit mid-screen on phones; the woodpecker is too small on phones. The owner's idea: teach with your OWN snake's speech bubbles (it speaks when it does something it shouldn't) and clear pictures in play (you can jump here, a bridge on someone's back, how a flash will cut). The design workflow (wf_4b5ac324-bd1, folder .git/perry-tools/teach) is DONE: an audit, three directions (your snake talks; show it in the board; a first round that teaches), then judges and a build order. The combined call is in DESIGN "## Teaching by showing". It is built as its own PR, before PR B (see WHERE I STOPPED).
- **No-scroll WINNER** (results in .git/perry-tools/noscroll/result.json): "the column fills the screen" (flex/design.patch) with the side-by-side layout up to max-height 1180 grafted on (the owner's 1080p Chrome window gets the column beside an 880 board instead of a 685 stacked one). Fixes: keep the short phones' board floors. BUILD it on fix/playtest-2 after the playtest rebuild lands.
- **No scrolling** (the owner, 2026-10-19: "you have to scroll to see all the ui elements outside of the gameplay screen. Is it possible to make it all fit on screen"): the whole page fits one screen, every screen and state. A measure, design and judge workflow is running (wf_377ce8ee-cc0, folder .git/perry-tools/noscroll): three directions (the column fills, fewer things folded in, the board yields a little). Then BUILD the winner on top of fix/playtest-2 (after its rebuild) so it fits the final header, check it on every screen, and ship it in the playtest PR.
- **2026-10-19 evening:** #30 (the snake S) MERGED. **#31 OPEN** (phones, feature/phones at 31fae23, with main merged; layout-test 759 checks; pictures on pr-media fe9c1d2). Round six (feature/powers-2 at 303c4dd) has phones+S+main merged, wave 2 part one plus its fixes, the broken-promise call (a broken promise lands nearest its ring), the meal fix, and CI with layout-test. Fingerprint 329961303. RUNNING: wave 2 part two (wf_a3bc985a-bcf: ai + woodpecker, with aiExtra/birdExtra) and the playtest rebuilt on phones+S (wf_be236997-190, branch fix/playtest-2) for its PR after #31 merges.
- **PLAYTEST DONE** (fix/playtest at 8ff0d73, from main; results in .git/perry-tools/playtest/result.json). The cause: the neck test's PINNED_DAWDLE 8 made any rival within ~12 cells a trap after eating by an edge, hole, fire, mark or body. The fix "a meal isn't a pin": MEAL_DAWDLE 2 for 3 plies after eating. Edge meals 50 -> 79%, golden on the edge 60 -> 90%, circling 45 -> 10. The cost: early self-crashes 1.5-2x, rounds 172 -> 165 s. Mason territory 1.8 -> 1.6 on main. Also the nap note and the Field guide doors (button, G, How to play, the death-card link). The final check left 1 medium: the header's guide name versus the phones PR's fullscreen button. So ORDER: the phones PR first; then rework the playtest header on top of main+phones, plus check 5's 4 lows; then the playtest PR. Round six's copy of the AI fix is on branch r6a-meal (981842d), to merge after the wave-2a fix round (its knock-landing fix makes the knock rules test pass).
- **Wave 2 part one JOINED UP and merged** (cf7e427): online identical to the host on every tick, all suites pass, fingerprint 938379800. A fix round is running (wf_d93e4671-ed7): knock rings miss 9% (make the landings binding from the tick before the strike); the dug burrow plays the crack-open cue; a burrow-rule lesson banner; right-click named in hints; "never shuts you in" softened; burrow rows cell-checked; beads off burrows. The AI agent (part two) must also: read view.burrows live (memory.burrows keeps closed ones), value knocked food at the engine's landings, model the dig (stays put, then a burrow appears), use T.BEETLE_HOME_REACH, handle two beetles, retune Gobbler, and measure the trademarks (verifier finding 4 in .git/perry-tools/wave2-integrate/verify-findings.json).
- **WAVE 2 PART ONE MERGED** into feature/powers-2 at 9c1b057 (engine 24d36f9, render dbad796, ui e7ea8d0, voice 95b9532; reports in .git/perry-tools/r6a-wave2a.json). Sealed SD deaths 21% -> 2-3%; crumbs 2.9 -> 0; the biggest island wins 45-49% (a blind pick is 48%); beetles caught 5 -> 15; escapes 9 -> 33%; round 168 s. The burrow experiment: a dig leaves a burrow (escapes 29.5 -> 32.8%), closing over is off. Integration (online sync of burrows used/dug, heal, knock color; sounds dig/scrabble/knock; Copycat's dot; knock rings via E.knocks; no knocks onto burrows; the dug and closing burrow cues) plus docs and verify are running (wf_dd5d09b1-3a5). The fingerprint is now 855383246.
- (was:) - **WAVE 2 PART ONE RUNNING** (2026-10-19, wf_7349749e-c31, base 8d9cde2): engine, render, ui, voice. The script takes args.parts, args.aiStart, args.aiExtra and args.birdExtra. PART TWO, once the playtest and phones land: `ai` (aiStart = the engine's commit merged with the playtest's food fix ported to the optimized ai.js; aiExtra = the diagnosis) and `woodpecker` (base including feature/phones).
- Its parts:
  1. Exact speed-ups of evaluate and decide: identical fingerprints on 3 seeds.
  2. An optional approximate one: rivals' territory BFS once per decision; adopt only if balance and signatures are unchanged.
  3. Tooling: start sudden-death studies from saved 2:00 states; tools/abtest (paired seeds, CIs, early stop); built-in per-persona census.
  4. Trim test suites without losing coverage: online-test (20 full rounds), chatter-test (whole rounds), the determinism rounds; split CI.
- **Measured under load:** rules-test took 180 s (12 s quiet), online-test 415 s.

## r6 study: DONE (2026-10-18; full report in the task output; copies in .git/perry-tools/r6-study-tools and scratchpad/r6-study)

The package to build in PR A wave 2:
- **Woodpecker:** PECK_NO_SEAL; PECK_NO_ORPHANS 2; PECK_FOOD 'knock' (food in a patch knocked to the nearest free cell); PECK_SMOOTH (fill cells with 3+ patch, hole or edge neighbours, drop one-cell spurs); PECK_CHUNK 12; PECK_CHUNK_MAX 20; PECK_REST_TICKS 30; PECK_REST_MIN 10. Arrival stays at 2:00.
- **Food:** APPLES 2, made safe by beetles in sudden death.
- **Beetles:** BEETLE_MAX 2; BEETLE_CHANCE 0.012; BEETLE_SD true; GOLD_BEETLE_CHANCE 0.12 (golden leaps stay about 3 a round); BEETLE_DIG 8 (a cornered beetle digs in over 8 ticks when a head is within 6 and no burrow within 7: needs a visible tell and an online event).
- **Results** (600 rounds, seeds 3 and 11): median 172/170 s; sudden death 51/50 s; starving 3.1/3.3%.
  - Sealed deaths: 21% of sudden-death deaths down to 3%.
  - The biggest island wins 41% (from 60-64%): no longer a lottery.
  - Tiny islands 2.3 to 0. Meals mid-round 19.8 to 16.6 a minute. Beetles caught 3.7 to 13 a round.
  - Escapes with competent hunters: 28% (target 20-35%).
- **Misses:** Gobbler at 14.3% on seed 11 (tune it, e.g. value beetles more). Watch Star: 12.7% in one screen with competent hunters alone.
- **Crossing the mark:** defer to PR B (powers with intent).
- **Not changed:** arrival time, meal clock, rot.
- **For PR B:** smoothing removes 1-cell gaps. A 3-cell hop reaches the next island for about 26% of boxed snakes, 4 cells about 41%, about 27% sit 5+ away. 40-45% of sudden-death deaths are in a pocket smaller than the snake: a self-cut helps.
- **Fire and weather today:**
  - Fire is scenery: 0.02 alight a round and nobody dies; fires come within 1 cell of a head 68% of the time.
  - Snow is the only weather that matters: meals 13.7 vs 20 a minute, deaths 2x.
- **Lesson:** another agent's clean-up deleted the scratchpad/r6-study files mid-run; see [[workflow-agents-share-scratchpad]].

## The game is now "Barkstreet Snakes" (the owner's rename, 2026-10-18; commit 6fc1607 on feature/powers-2)

- Changed: the title, h1 (the S of Snakes wriggles in Honey where the "&" did), cards, the share sheet, README, DESIGN, AUDIT, file headers, and the sw.js cache name 'barkstreet-snakes-1'.
- Kept on purpose: storage keys (snake-*, barkbite-muted/music), net.js PREFIX 'barkbite-', tool temp names. Changing them would wipe records and settings or split online play.
- render.js line 1 done (b8c41f5). The repo itself is now barkstreet-snakes (see [[repo-rename]]); the local folder stays snake-game.
- At 320 px a max-width:340px rule keeps the title, Score and Best on one row.

## PR A: fairness and fixes

- **Phones** (feature/phones at 99b971f after the first fix round: boards 346->382 upright and 268->310 on its side; layout-test with 558 checks). The recheck found a new HIGH: at in-between heights upright, the bird sits over the edge column. Round 2 (eee32e7) fixed it: a 580-size sweep found 0 px over cells, the bird at least 24 px, layout-test at 629 checks. Round 3 is running (wf_4c3b22a1-8cf) for four lows: the board shrinks mid-round when the score reaches 3 digits at in-between heights; 568x320 slices the chatter; the help hides at 321-340 tall; the DESIGN list. Then the PR to main, with pictures from .git/perry-tools/phones/build/after.
- **PR #30 OPEN (2026-10-19): the snake S** (feature/snake-s: e34f0db plus 8902976, the copy and palette fixes from the verify), to main; pictures on pr-media f6fdcd9.
- **2026-10-19: the weekly usage limit stopped four runs mid-way** (resets 6am Oslo). They were resumed from their journals:
  - the S verify (wf_d331af06-bf8; build e34f0db on branch s-snake: the inked honey snake, judges 3-0);
  - phones fix and recheck (wf_9c1b5ce6-b7c; build 8e0f720 on feature/phones);
  - the playtest (wf_5f45a451-801; nap and guide diagnoses cached);
  - opt-followup (wf_567081e6-69b, script in .git/perry-tools; the bench fix 9859bda cached; tooling and tests continue from their 3 commits each).
  Then: three PRs to main (S, phones, playtest), and wave 2 after merging the opt-followup into feature/powers-2.
- **Copycat in the flag's red** (the owner, 2026-10-19): #de2910 with a #ffde00 pin. Its head keeps them while its body copies; a yellow star on its tag dot. DESIGN 2026-10-19; wave-2 render task 6.
- **A snake across a pit is a bridge** (the owner, 2026-10-19), for PR B: the part of a body over a pit is crossable by others until its tail passes; heads over open pit fall. Drafted in .git/perry-tools/r6b-design.md.
- **Burrow experiment** (the owner: "just an idea", 2026-10-18): a dig leaves a burrow (BURROW_FROM_DIG), and unused burrows close over (BURROW_HEAL_MS). The wave-2 engine agent builds both behind switches that are off by default and measures them with abtest. Keep them only if escapes stay within 20-35% and the round stays as long. If adopted, the cues and online fields follow (DESIGN 7bafb40).
- **A woodpecker you can believe** (the owner, 2026-10-18): bounding flight, alive on its perch, an eye that looks and a head that tilts toward its aim, real pecks ending on the strike, each a knock of the drum. DESIGN ff2fbc6. It is a 6th agent in the wave-2 script (it owns the bird's drawing, layer and perch, and its sounds). Wave 2 starts after opt-followup AND the phones PR land (the perch ledge).
- **The owner's playtest of the live game** (2026-10-18), workflow wf_4d38489c-1d3, branch fix/playtest from main, files in .git/perry-tools/playtest. Three items:
  1. Ouroboros circled a golden apple in the top-left corner and would not eat it; then the owner saw it let almost ALL edge food go (it approaches, then turns away just short), and asked to check every rival: an edge-food table per persona, a loiter detector, the cause, an ai.js fix on main (rerun as wf_dfd2256b-aca).
  2. Tapping a rival's tag while napping: the Napping card took its text back after 3.2 s, too fast to read. The note should stay until you act.
  3. The Field guide is hidden behind the trophy (a tab of the Hall of Fame): its own button, a G key, a start-card link.
  Carry each to feature/powers-2 afterwards (its ai.js and snake.js differ).
- **Phones PULLED FORWARD** (the owner: "Yes, please! If that is possible without impacting the rest"): its own PR from main, branch feature/phones, workflow wf_9c1b5ce6-b7c (build, three checkers, fix, recheck; files in .git/perry-tools/phones). Wake lock, the edge-to-edge portrait board, the landscape board at full height, fullscreen, iOS metas, the perch ledge (perchFor), and a NEW tools/layout-test.js. It doesn't touch the test suites the optimization rewrites, the title S, or the bird layer and lag spike. Wave 2 no longer has these items. Before wave 2, merge main (#29 and these PRs) into feature/powers-2, and move DESIGN's planned "Phones" block to point at the as-built "## Phones" section.
- **The S of Snakes as a real snake** (the owner, 2026-10-18): workflow wf_d331af06-bf8 (three directions, judges, build, verify; files in .git/perry-tools/s-snake). It goes in its own small PR from main (PR #29 is merged), then into feature/powers-2.

- **Wave 1 MERGED** into feature/powers-2 (8007bbc, b8c41f5, docs 4ac476d): choking/cough/nudge, live food, beetle prediction, the flag fix, Star's mustache, bridges and jumps, voice, online protocol 9 (the UI agent had forgotten to bump VERSION; fixed). All node suites pass; online-test crosses real chokes. Wave-1 agents' notes: .git/perry-tools/r6a-wave1-notes.md.
- Wave-1 leftovers for wave 2: a 'cough' guideSprite (the Coughing row uses an emoji stand-in); your spat bead is hard to tell from your body at phone size; the leaps trail costs 1.21x while airborne; "Round six A, measured" still to write; Mute's box doesn't show on any simple measure.

- **CI.** .github/workflows/tests.yml, committed on feature/powers-2 at 18b97b1. browser.js adds --no-sandbox when CI is set.
- **Woodpecker fairness** (the owner saw Mute sealed in by a mark beside it):
  - never pick a patch that leaves a snake less room than its length;
  - rivals may cross a mark if out before the strike;
  - no orphan islands of 1-2 cells;
  - patches may include food, knocked deterministically to the nearest free cell outside (ties toward the middle), or eaten (the study decides);
  - arrival time and patch sizes from the study;
  - hole SHAPES (the owner: "often a rather odd shape"): patches should read as deliberate rounded hollows, not scribbles. Candidates: stronger compactness, a disc or rounded rectangle round a centre, smoothing (fill cells with 3+ patch neighbours, drop 1-cell spurs). Added to the r6 study.
- **Flag bug.** Land outlives a pecked flag; ai.js never drops a colony whose centre became a hole.
  - A pecked colony is lost: the flag falls in, the land shrinks, Colonist may replant.
  - Sovereign's pecked capital moves at once to the nearest good land.
- **Beetles.**
  - Rivals chase stale positions: aiView gives `food: snap.food` from the delayed snapshot. Fix: food is seen live, and the beetle's next step is predicted.
  - Escapes about 20-35% at every stage against competent hunters: two burrows early, BURROW_MAX, a visible "dig in" when cornered, pace (from the study).
  - Food and beetle supply per the study (the owner thinks food is too plentiful; wants more beetles).
- **Choking and coughing.**
  - Your own beads can't be eaten back: you gag and spit the bead aside.
  - Then a cough of about 1 s: you can't eat. It doesn't chain; food your coughing head reaches is nudged one cell aside.
  - The nudge and spit direction is RULES-BASED, never random:
    1. turning, it goes to the outside of the turn;
    2. straight, to the side with more open cells;
    3. a tie goes toward the middle;
    4. if blocked, the other side; if both are blocked, it stays.
  - The AI predicts this. A lesson: "You choke on your own tail!"
- **Star's tongue** (the owner dislikes it): a mustache gag (the ends twirl and flick up, a harrumph puff).
- **Visuals.**
  - Bridges over pits: the shadow drops onto the pit floor, the span is shaded with a slight sag, and the tail over a hole droops into it.
  - A clear jump: the body lifts along the neck, the shadow stays on the ground, dust at take-off, a squash and dust ring on landing, the hurdle passing under, a faint arc trail.
- **Lag spike: FOUND** (scratchpad/r6-spike; tools, logs, prototypes). It's the woodpecker strike that cuts Sovereign's or Colonist's land.
  - Each realm keys on holes.size, so a strike forces a full buildRealm plus buildDashes in the strike frame: wide round-joined strokes and hatching under an even-odd clip, all GPU.
  - Staged: +34 to +67 ms per strike frame (pits alone +5 to +9); one Colonist rebuild alone 24-28 ms.
  - Frames over 100 ms in its runs were the loaded machine, not the game.
  - Fixes for PR A wave 2 (render):
    1. pre-build each realm's post-strike land during the 17-tick aim (spare canvases, one a frame, swapped in at the strike; fall back if the land changes otherwise); same paint code, so the pixels match;
    2. (optional) windowed repaints round the change, which needs board-anchored hatching (prototype in fixwin2: +24-33 down to +18-19 ms);
    3. a smaller woodpecker layer: today a full-window canvas redrawn every sudden-death frame (2-3.5 ms GPU) and reallocated when innerHeight changes (phone address bar).
  - For PR C's optimization pass: a cheaper land paint (band strokes and hatching are about 2/3 of every rebuild, growth rings, shrinks); a GPU hitch of about 100 ms when the next round's bark is built about 1.7 s after a round ends (makeNext); per-frame sudden-death GPU split (snakes 6-7, shadows 2-5, land colour round rivals 3-4, bird 2-3.5 ms).
- **Star's rainbow** (the owner asked whether it still changes colour as Wildcard's and Mute's did).
  - It does: render.js bowHue cycles at a degree every 15 ms (5.4 s a cycle), flowing head to tail (the old one flowed toward the head), held still with prefers-reduced-motion.
  - Proposed: a slow in-place colour drift even with reduced motion (no movement). Keep head-to-tail unless the owner prefers the old direction.
  - The owner: "didn't look like it was animated to me anymore"; analyse and pick what looks best.
  - Measured: the colours DO cycle (segment 2 ran purple, pink, red, orange, yellow, green over 2.4 s). But the flow is 2.4 segments/s toward the tail while the snake crawls about 9 cells/s forward, so relative to the log the colours move forward at about 6.6 cells/s and look painted on (the old Wildcard/Mute flow went toward the head, adding up to about 11 cells/s: obvious shimmer).
  - **Decision for PR A wave 2 render:**
    - tie the flow to the distance travelled (ticks plus alpha), at about 1.25x the crawl, so the colours visibly stream BACKWARD over the log behind Star like a trail; it settles when stunned or stopped, and bursts on a flash;
    - each segment changes hue about once a second (well under 3 Hz);
    - reduced motion: a slow in-place drift;
    - Copycat's pale copy stays in sync.
- **Screen wake lock** (the owner asked: keep the phone awake while playing or watching an AI game).
  - navigator.wakeLock.request('screen') while running, in the countdown, or watching; release when napping, on cards or menus.
  - Re-request on visibilitychange when visible again; no fallback hacks (no hidden video); guard if unsupported.
  - In snake.js, after wave 1 merges.
- **A bigger board on phones** (the owner: "playable, but not optimal", space wasted on the border).
  - Measured at 390x844: the field is 346 of 390 points, with body padding 12 a side and the log frame about 10 a side; about 115 points of height unused at the bottom (the board is square, so width is the limit).
  - Plan: the board goes edge to edge on phones (no page padding beside it; the frame slims to a thin rim; moss and corner leaves smaller and allowed to bleed off the edge). That is 346 to about 382 points (cells 14.4 to about 15.9, +10%).
  - Landscape (the owner: "miniscule"). Measured at 780x320 (browser bars showing): the board is 268 (cells about 11), the left column about 400 wide, vertical margins about 50. Plan:
    1. The board takes the full height minus a thin rim (safe areas), and the left column gets compact: 268 to about 310 (+16%).
    2. A full-screen button (Fullscreen API on documentElement where supported, e.g. Android Chrome): the whole height, a board of about 380 (+40%).
    3. iPhone: no page fullscreen. Add the apple-mobile-web-app-capable (and status-bar style) meta so "Add to Home Screen" runs standalone without Safari bars. No icon files: README promises "no asset files", so it gets the default snapshot icon unless a drawn icon can be inlined.
  - No camera or zoom (you must see the whole log).
  - **The woodpecker's perch** (the owner asked where it goes): render.js perchFor() puts it beside the board on the side with room; on phones it is shrunk into the gutter (about 33 px), and under PERCH_MIN_PX its beak reaches over the board. With an edge-to-edge portrait board there's no gutter.
    - Portrait: a perch ledge between the board and the chatter, using the spare height (about 115 px unused today), so the bird perches on the log's bottom edge at a readable size (or on top, if a gap exists under the tags).
    - Landscape: the sides, as now.
    - Rule: perched, it never covers a cell.
    - The layout and perchFor() change together.
  - Check 360, 390, 412 wide and landscape: no sideways scroll, swipes intact.
  - Files: style.css and snake.js layout, after wave 1 merges.

## PR B: the new moves and power styles

- **Island-hopping.**
  - A longer plain jump sized to the measured gaps between islands (the study measures them). It keeps its rest and its segment cost, and none at length 3.
  - The golden jump: farther (about 4-5), free, aimable: hold to go farther, steer in the air to choose where you land (Mario-style). The owner loves it.
  - A landing marker and a ground shadow.
- **Mid-air collisions** as above (kept).
- **Golden flash steals landings.**
- **Flashes.**
  - **Plain flash:** cuts a body one cell thick; puts out 1 fire cell it passes, if it lands clear; a FAILED flash (into the edge, a two-thick body or a head) has a harsher penalty (e.g. 5 segments and a longer stun); a longer rest (about 10-12 s).
  - **Golden flash:** cuts two thick (one cut, nearest the head); puts out all fire on its cells; blows up at the edge or a hole.
  - **Jumping** never puts fire out but hops it; the golden jump clears wide fire.
- **Self-cut** (dropping your tail): a cutting flash into your own body, one or two thick, with a free cell beyond; keep at least 3 in front; the tail becomes beads others can eat (you choke on them).
- **Wrap as gold portal pairs** (not blue and orange, which clash with sky = jump and ember = flash):
  - the entry swirls in, the exit spills out, each trimmed in the snake's colour, and the frame gilded during the wrap;
  - others can follow through the doorway while the wrapper's body passes plus about 1 s;
  - coming out onto the wrapper's body is a crash;
  - an online protocol bump.
- **Mason** builds doubled walls to resist plain-flash cuts; measure.
- **18 power styles:**
  - Sniper cuts off its target, Mute seals boxes, Gobbler races for food, Vulture flashes to beads, Ghost keeps an escape flash;
  - Sovereign and Colonist chase intruders, Mason finishes walls, Creeper flashes behind tails, Desperado for thrills, Joker springs lures, Ouroboros jumps its coils and drops its own tail;
  - Star is the addict; Wildcard random; Capricious and Copycat borrow; Metagamer reads rivals; Drab is the baseline.
  - Plus a reserve value for a ready flash, length-for-room trades, and keeping a jumpable exit.
  - Target: powers on clearly beat powers off in the seat-split A/B (today neutral, 2.499 vs 2.497); every persona at 15-35%.
- **The flash's price** (the owner, 2026-10-20: "getting to something quicker also makes them available to pursue something else afterwards quicker... Holding onto flashes constantly isn't really optimal, but they shouldn't be junkies for it either, like Star").
  - Today a flash costs 2 apples' worth, or 1 to win a race. The look-ahead sees the 2 cells gained only for a few moves, and the price ignores how long the flash has sat ready.
  - For PR B's reserve value:
    - a tempo credit for time saved, beyond the look-ahead;
    - the price falls the longer the flash sits ready, since an unused rest is wasted;
    - a floor that keeps a flash for escapes (higher for Ghost);
    - Star stays the addict by habit.
  - Caution: at a flat 1-apple price, rivals flashed 3 times a minute and did no better than never flashing. So judge it by the seat-split A/B (powers on must clearly beat off), flashes a minute per persona, and the trademarks.
- **One pricing model for every power** (the owner, 2026-10-20: "Does jumping need the same kind of overhaul? ... both regular jumping and flashing will have a lot more utility. At the same time as miscalculation a flash will be far more punitive"). Yes: PR B replaces the fixed apple prices for both.
  - **Gain:** searched from where the power ends, as now, plus tempo for flashes and access for jumps (the room and food on the island you reach).
  - **Cost:**
    - the jump's tail tip, priced at what length is worth NOW: early it's score and a crash cushion; late, in a shrinking log, often a burden (Gobbler dies of length), so cheap;
    - the rest: an idle power gets cheaper, with a floor kept for a way out.
  - **Risk:** a flash's chance of failing (a rival's head stepping into the path, a body that's really two thick) times the new penalty (about 5 segments and a longer stun), and a jump's chance of a mid-air bump, each weighed by the persona's risk appetite (Desperado takes it, Ghost never).
  - The AI asks the same engine query as the teaching pictures ("what would a press do now"), so it knows what a person sees.
  - Tune it all together by simulation against PR B's balance targets.
- **Dropped charges** (the owner asked, 2026-10-20: "Should a bump make you drop one of your power charges for someone else to pick up?"). My recommendation: NOT on every bump, but YES on a knockout.
  - A snake that dies holding golden jumps or flashes spills them where its head fell, as a golden pickup anyone can grab (it expires after a while). Today they just vanish.
  - Why not every bump:
    - a crash already costs tail, and the beads already go to others;
    - new players crash most, so they'd lose the gold most;
    - the snake you bump into is right there, so Mute's and Mason's traps would snowball;
    - golden jumps are 99% used soon after pickup, so a drop on a bump would come up rarely and feel random.
  - Needs:
    - a cue: the pips bursting off the head;
    - a lesson in your snake's voice;
    - the rivals valuing spilled charges (Vulture especially);
    - a Field guide row.
  - Test it with PR B's balance (powers on clearly beat powers off; every persona 15-35%). Record the call in DESIGN round six B when PR B resumes.
- **Second test case** (the owner, 2026-10-20, .git/perry-tools/r6b/owner-sniper-islands.webp): Sniper won at 54, coiled on the left strip, while the islands across 1-3 cell gaps held beads nobody could reach. The owner: "jumping is pretty critical to making this game more tense and skill based, rather than RNG. And island jumping just sounds really fun!" Make PR B's island hop the priority move.
- **Test case:** the owner's screenshot. Gobbler, 59 long, folded on a strip, an open island across a hollow. The rival must find the jump or the tail-drop.
- **Effects:** take-off and landing dust, the flight shadow, mid-air bumps, cuts, tail drops, fire put out.

## PR C: weather, fire, polish, onboarding, optimization

- **PR C'S CENTREPIECE (the owner said yes, 2026-10-19, "Expertly!"): the woodpecker in three acts.** Calm; then the watcher (it arrives at 60-90 s, scouts from outside the board, no pecks; its gaze is a tell: act 2's first patch grows where it watched last); then the first pecks (50-80 s later: rare, small strikes while food still grows; the music's percussion is its drum); then the frenzy, which is sudden death (50-80 s later: shorter rests, 2-3 patch combos marked together and struck in turn, red eyes and a possessed storybook look, a darker sky, a sudden-death theme of our own). Each act starts at a SEEDED random time in its window (the owner asked for that, so it isn't perfectly predictable). The owner's timings are the start; tune by simulation (median round about 3-3.5 min, deaths spread across the acts), then the owner playtests with a ?acts=70,140,200 URL knob. Cues and lessons for each act; rivals read the acts; online protocol bump. Draft in .git/perry-tools/r6c-woodpecker-acts.md. The owner: rounds "can be fun to last a couple of minutes" with build-up; at the old 3:00 woodpecker they dragged for lack of tension.
- **ALSO IN PR C: A/B test food knocked aside against falling in** (the owner, 2026-10-20: "Maybe both options can be tested in one of the rounds").
  - Their counterpoints:
    - the bird pecks burrows away, which limits beetles late;
    - the longer snake may lose the final duels more often. Measure it; I had no number.
  - Run abtest under the acts, plus a `?food=fall` knob so the owner can try both. The plan is in the acts draft.
  - If the knock stays: bark chips spray out with the food, and it bounces a little where it lands. The owner: "this is the way to do it".


- **Fire and weather** (today almost nobody catches fire: about 0.02 a round against about 4 strikes):
  - wind carries flashes and jumps (+1 downwind, -1 upwind in a gust);
  - lightning drawn toward the leader;
  - a burning snake leaves a fire trail;
  - cooking worth the risk;
  - optional: a sudden-death storm with never-seal fairness.
- **Skeletons for the dead.**
  - Vertebrae beads in the snake's colours and a skull wearing its trademark; crash drops stay beads.
  - Rot bleaches and crumbles. Must read as food.
- **Trademark memorials** on the head tile after death: decoration, about 15 s.
  - Desperado's hat, Sovereign's crown, Colonist's tricorn, Mason's wreath, Joker's hat, Mute's beret, Wildcard's tie, Metagamer's glasses, Sniper's cracked scope, Star's mustache.
  - Copycat's ears, Capricious's ring, Vulture's bone, Ghost's wisp (or the owner's idea, 2026-10-20, "just an idea": a broken shackle and a few chain links, for the classic chained ghost; NOT as its tongue, which stays smoke), Ouroboros's shed skin, Gobbler's apple core, Creeper's eyes, Drab's pillow, the player's green tuft.
- **Flags.** Flags and the banner sway or are knocked over by direction and force (crawl, flash, jump landing). Drawing plus owner lines.
- **Land.**
  - Disputed land where realms overlap: sparks, a crossed-swords mark, a pulse.
  - Fill enclaves (pockets of up to about 3 cells enclosed by one owner's land), with ONE shared land-mask helper for AI, chatter, HUD and render, and a test that they agree.
- **A full effects audit** (every event with weak feedback).
- **A gentler first five minutes for new players.**
- **Loose ends:** Gobbler at the bottom; Star's lemon segment beside the gold pips; low-end phone frame times.
- **Finally, the thorough optimization pass.**
  - Covers frame cost (script and GPU, phone-throttled), AI decide() p99, allocations and GC, start-up and first frame, memory and canvases, net message size.
  - Interleaved before/after; pixel-identical staged scenes; identical fingerprints.
  - No loss of gameplay or visual fidelity.

## Controls for everyone, and PR D: local two-player (the owner, 2026-10-18)

- **Context:** the owner's father wouldn't know the WASD convention. Arrow keys ALREADY steer ("Arrows or WASD steer" on the start card and hints). Make it obvious.
  - **PR A:** clearer arrow-first wording; mouse buttons as an option for one player (left click = jump, right click = flash, no context menu over the board).
  - **PR C:** onboarding shows a small picture of the keys on the start card (arrows, Space, Shift) instead of text.
- **PR D (after C, continuous): local two-player on one keyboard,** plus a key-settings screen to rebind keys (layouts differ: Mac has no right Ctrl, Norwegian punctuation moves).
  - Reuses the online multi-human seat machinery: names, colours, name arrows; two AI rivals fill the rest.
  - Default keys:
    - **Player 1 (left):** WASD, Q jump, E flash.
    - **Player 2 (right):** arrows, Right Ctrl jump, Right Shift flash.
    - Space stays the one-player jump only (central, so either player could hit it).
  - Per-player HUD, death and round cards, lessons. The AI doesn't know who is human, as always.
  - Only where a keyboard exists (the owner agreed):
    - hidden on touch-only devices (matchMedia '(hover: none) and (pointer: coarse)');
    - shown on computers;
    - revealed on a tablet once a real keydown is seen (no reliable keyboard detection).
  - **Local + online together** (the owner asked: a friend beside you and one online). Design it in from the start:
    - a screen may own several seats (host or guest), up to 4 humans in all, AI filling the rest;
    - the turn, pow and swipe messages carry the seat;
    - the host's input delay applies to all its local players;
    - each screen marks its own players (glow, YOU, draw lead: setViewer becomes a set), others as friends with name arrows;
    - the lobby and Hall of Fame list everyone;
    - extend online-test to cover two-seat screens.
  - **Up to 4 local players** (the owner asked: controllers, or more key sets). Seats are input devices; any device can take a seat:
    - keyboard sets 1-4 via the key settings;
    - the Gamepad API (d-pad or left stick steers, A jump, B or X flash, Start nap; press a button to join; gamepadconnected reveals local play even on tablets);
    - the mouse buttons.
    - Warn in the key settings about keyboard ghosting/rollover for 3-4 keyboard players; recommend controllers.
    - With several local players, each snake wears its player's name and colour instead of "YOU".
    - Local + online up to 4 humans in all.
  - Possible later, only if two-player catches on: split-screen touch on a tablet (each player's half), which needs its own touch rules.

## Background numbers

- The powers package was neutral in the seat-split A/B; the plain flash at 2 apples was break-even.
- Self is about 25% of sudden death's deaths.
- 24% of bead meals were the eater's own.
- Possible tweak only if it feels unfair: a golden flash about to blow up falls back to a plain flash.

Related: [[round5-star]], [[round4-feedback]], [[game-ai-fairness]], [[pr-pictures-branch]].

## State notes from docs/PROGRESS.md (27 October 2026)

Queue item 3, the fixes and polish from the owner's playtest, is under way: "Burrows grow shut" (PR #49), "The
outline glitch over a hole" (PR #52), "Rainbows upside down" (PR #57), "Hunger where your eyes are" (PR #66), "Rainbows, the follow-ups" (PR #68), "The phone gap" (PR #70) "Desktop chatter" (PR #72), "Wildcard's hair" (PR #74) and "Copycat's face" (PR #78), "Rival line-up" (PR #86), "The lobby shows the line-up" (PR #116), "Last words on phones" (PR #124), the head-to-head mode in `tools/abtest.js` (PR #80) and "Hunters miss easy pins" (PR #81) are done; next is the first open entry below. Queue items 1, 1b and 2 are done (2: PR
#48, the online messages typed; 1: PR #41, render.js split into `render/`, and PR previews on Pages). The previews wait
on one setting: Pages still serves `main` (every "pages build and deployment" run so far has built `main`), so the
preview links in PRs do not open until Haakon switches Pages to "Deploy from a branch: gh-pages, / (root)". Everything
through PR #52 is in `main` (milestone #53); since 27 October the builder merges the develop-to-main PR itself
("Standing instructions" in `CLAUDE.md`). input-test failed 4 checks in 1 of 5 runs after #35's build; #38's fix of the
lessons block is probably that flake. Watch for it.

The plan and history that led here are in `docs/archive/plan-history.md`.
