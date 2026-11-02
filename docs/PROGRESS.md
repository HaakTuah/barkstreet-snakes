# Progress

What is done and what comes next, in order (how to work through it: `AGENTS.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add the owner's new tasks where he places them, with his words quoted.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

**2 November 2026, a fresh week:** the main lane is part 4 (#198), then 2x, then part 5 (#202, parked); the polish
lane and the workshop lane run beside it, each claimed by a draft PR.

## For the owner

Everything for the owner is an issue: [questions and readings](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Afor-owner)
(`for-owner`) and [ideas](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aidea) (`idea`), by
"Questions, readings and ideas" in `AGENTS.md`. Answered rows from before 2 November 2026: `docs/archive/progress-done.md`,
"For the owner, answered".

## The polish lane

A side lane of small refinements, beside the AI and engine lane and never ahead of it (the owner, 31 October 2026: "Should
we add a polish point to each that it can spend the last credits on also?" and, to the design session's shape of it,
"Yes, and make things as refined as possible!"). Taken when the main lane's current entry is merged or parked, and on
the second account until its usage is spent; on the main account the brake closes it first (from about 85%).
- **What belongs:** whatever makes the game feel finished without changing how it plays: things drawn wrong, out of
  place, overlapping, flickering or cut off; the same thing drawn, named or worded differently in two places (a
  rival's colours, a move's name in the lesson and the Field guide); layout at 390 px and desktop, phone held upright and
  sideways, reduced motion, tap targets and contrast; typos and wording in banners, chatter, the Field guide and
  menus; errors or warnings in the console; sound levels that jar; slow frames that can be made smooth.
- **What does not:** anything that changes a rule, a number, a rival's play or the online messages; those go to their
  entries.
- **How:** look for them by playing the live build, on a phone-sized screen and on desktop, through every screen, a
  lesson, an online lobby, and whole rounds watched at top speed; each find is its own small PR (about half an hour),
  with a before-and-after picture on `pr-media`, the suites green and the simulation's fingerprints unchanged (seeds 3
  and 11), so nothing that changes play slips in; merged at once, one line per fix under this lane. Nothing is left
  half done: a fix not finished when usage ends is left unstarted, its find noted for the next session.

*Done in the lane:* each fix's line is in `docs/archive/progress-done.md`, "The polish lane, done" (the README for
players, any key wakes, the woodpecker bigger on a phone, the flash become the dash, the room card and Join on a phone,
and the owner's notes of 2 November, among them).

## The workshop lane (splits by meaning, leftovers, the file-by-file review)

- **The file-by-file review** (the owner, 2 November 2026; draft PR #334, in a few parts): its spec is in
  `docs/handoff/queue-specs.md` under the same title.
- *Done:* `audio.js` and `chatter/zh.js` split (PRs #225, #226), the chatter split by meaning (PR #318), the workshop
  check's point (2) (this file 10 KB, `AGENTS.md` 20 KB, 2 November) and point (5), the unused-code check (PR #331):
  `docs/archive/progress-done.md`, "The split lane, done".
- **Waiting for the main lane** (PR #198 and its parked #202 have them open): `ai.js` (139 KB), `engine.js` (128 KB) and
  `render/world.js` (51 KB). Split each in a PR of its own once the main lane merges, proven by fingerprints and suites.

## The queue, in order

**Done:** every finished entry, 1 to 2w, with its PR, is in `docs/archive/progress-done.md`, "The queue, done".

### 2x. The spitter slides over its own mushroom (the owner, 2 November 2026; an engine-rules entry, next, ahead of part 5)

Taken out of 3b+ and moved to the front, since it still bites (the owner: "Still get the bug with swallowing a mushroom over and over again after puking it up."): the spec is 3b+'s "The spitter slides over its own mushroom" in `docs/handoff/queue-specs.md`, entry 5.

### 5. Round six B: the new moves (DESIGN "Round six B")

The golden jump that flies, leap now, gold portals, dropped charges, the spit along the line and one pricing model for every power, each its own playable PR that the rivals use well. *Done:* parts 1, 2, 3 and 3b (PRs #158, #174, #183, #195). **Next, in order:** part 4 (draft PR #198, 2r folded in; the owner answered on 1 November 2026 that the moves stay as designed and the rivals are improved until their users come out ahead: the row is in `docs/archive/progress-done.md`, "For the owner, answered"), then 2q (2s done, PR #289; part 4's both-ways test runs again on its log when part 4 goes on), part 3b+ (the spit flies along the line), part 5 (#202, gold portals), part 6 (built on `round6b/dropped-charges`) and part 7 (parked on `round6b/pricing`; it also fixes the trademark measures and lifts Joker into the band, see the spec); then the teaching system (item 4). Spec: `docs/handoff/queue-specs.md`, "5. Round six B: the new moves". **When part 4 merges:** run the census on seeds 3 and 11 again (`scripts/sim.sh 200 --seed 3 --census --check`): chased beetles must still get away a third to 45% of the time (2w measured it before the flight was in; `--check` fails a census outside that band).

### 2r. No hop onto a doomed island (30 October 2026; part of item 5's part 4)

Before a hop or a flight a rival weighs where it lands, above all whether it can jump off again; built into part 4 (#198). Spec: `docs/handoff/queue-specs.md`, "2r. No hop onto a doomed island".

### 2q. Rivals notice like people (30 October 2026; an AI entry, after 2s)

Every rival sees another snake as late as a person would notice it: `REACTION_MS` near its own head, growing to about 400 ms across the board, measured with `tools/abtest.js`. Spec: `docs/handoff/queue-specs.md`, "2q. Rivals notice like people".

### 2b. Hunger's worth at a contested apple, for every rival (the owner, 29 October 2026; an AI entry)

A contested apple is worth what it saves: a starving rival contests it because it is worth more; Gobbler contests even when fed; Desperado is less risk-averse everywhere. Spec: `docs/handoff/queue-specs.md`, "2b. Hunger's worth at a contested apple, for every rival".

### 2h. The endgame: eat what keeps you alive, not what boxes you in (the owner, 29 October 2026; an AI entry, after 2b)

Grown on 31 October 2026: the tail drop planned ahead, a length target (a crash and hunger buffer, no more), and the denial play where it pays; the reasoning now, its numbers again after entry 6.

In the endgame a meal is worth the life it buys against the room it costs: a rival eats when hunger would end it before room would. Spec: `docs/handoff/queue-specs.md`, "2h. The endgame: eat what keeps you alive, not what boxes you in".

### 2i. Food seasons: lean, normal and plentiful rounds (the owner, 29 October 2026; an engine-rules entry, after 2h)

Each round draws a food season, lean, normal or plentiful, seen in a start banner, taught, and played by the rivals; online with a protocol bump. Spec: `docs/handoff/queue-specs.md`, "2i. Food seasons: lean, normal and plentiful rounds".

### 3b. The rivals who change: Capricious, Copycat and Wildcard (Wildcard's part after 5)

Capricious done (PR #126) and Copycat done (PR #142). **Wildcard's part waits** until after 5, built on the branch `wildcard-shows-its-mix`; its "left to do" is in the spec. Spec: `docs/handoff/queue-specs.md`, "3b. The rivals who change: Capricious, Copycat and Wildcard".

### 3c. A new rival: the Charmer (the owner, 29 October 2026; an AI entry, after 2b and 3b)

Charmer, a vain show-off who courts the biggest snake on the board and steals its meals; his look and his mark on death wait for the owner's description. Spec: `docs/handoff/queue-specs.md`, "3c. A new rival: the Charmer".

### 4. The teaching system, steps 2–6 (DESIGN "Teaching by showing") — after 5, whose new moves it must teach

Teaches every move of item 5 by showing, each with its picture or cue, its lesson and its Field guide row; it starts as soon as item 5's last part merges, as a lane of its own. Spec: `docs/handoff/queue-specs.md`, "4. The teaching system, steps 2–6".

### 6. Round six C: the woodpecker in three acts

The woodpecker cuts shapes that fall, down to a floor, then fights; hunger stays a trade-off to the end; and the food
A/B, chips, skeletons and memorials beside it. Spec: `docs/handoff/queue-specs.md`, "6. Round six C: the woodpecker in
three acts" (its draft: `docs/handoff/woodpecker-acts-draft.md`).

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

### 8. Near the end: beetles who meet, fight (the owner, 29 October 2026; an engine-rules entry, last but the writing pass)

Two beetles that meet fight a shoving match, and a snake that gets there in time can catch them while they do; last of the rules, before the writing pass. Spec: `docs/handoff/queue-specs.md`, "8. Near the end: beetles who meet, fight".

### 9. At the very end: the writing pass (the owner, 31 October 2026; Fable 5.1, after everything else, entry 8 included)

Every rival's lines given a make-over by a Fable 5.1 session with creative control, outside what the owner protects: his own lines, the lines he likes, and the gags (Mason's bad Latin, "vidi vici veni"). After everything else, so it covers every line the queue adds. Spec: `docs/handoff/queue-specs.md`, "9. At the very end: the writing pass".

## Noted, not yet queued

Ideas are issues labelled `idea` now ("For the owner" above); the four noted here moved there on 2 November 2026 (#324 to
#327).
