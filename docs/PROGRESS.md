# Progress

What is done and what comes next, in order (how to work through it: `CLAUDE.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add Haakon's new tasks where he places them, with his words quoted.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

**The main lane stopped here** (30 October 2026, at about 88% of the weekly usage, by the same words). Part 4 of item 5,
with 2r folded in, is built, reviewed and parked as draft PR #198 (protocol 20): its rivals who leap now and fly come out
even with rivals who never do, in three head-to-heads (last, on fresh seeds 47 and 59: 24.7% to 25.2%), so by "No part
merges until the rivals use its moves well" it waits, as Haakon agreed (30 October 2026), for a session that makes leap
now and the flight pay the rivals; its "Still to do" list
says what is left. Part 5 (#202) stays parked behind it. Nothing newer (3b+, 2q, 2s, parts 6 and 7) has been started.

**The art lane stopped here** (30 October 2026, at about 88% of the weekly usage: Haakon, "I want them to finish what they
have started, if we believe they can"). 2o, 2p and 2t are merged (PRs #210, #211, #212). 2n's second try was turned
down (Haakon: "it looks horrible"); the third, the original with its lick reversed and nothing else, has his yes (31
October 2026) and merges with PR #208. 2u is merged (PR #221).

## For Haakon

Every open question for Haakon, until he answers it ("Questions come back to Haakon directly" under "Standing
instructions" in `CLAUDE.md`). Each task's last message and each milestone PR open with the same list. Answered rows: `docs/archive/progress-done.md`, "For Haakon, answered".

| Task | Question | Reading taken or suggested | State |
|---|---|---|---|
| (none open) | | | |

## The polish lane

A side lane of small refinements, beside the AI and engine lane and never ahead of it (Haakon, 31 October 2026: "Should
we add a polish point to each that it can spend the last credits on also?" and, to the design session's shape of it,
"Yes, and make things as refined as possible!"). Taken when the main lane's current entry is merged or parked, and on
the second account until its usage is spent; on the main account the brake closes it first (from about 85%).
- **First, the housekeeping:** done (PR #222, and the design session's move of the open entries' specs to
  `docs/handoff/queue-specs.md`, 31 October 2026); merged branches now go by GitHub's "Automatically delete head
  branches", which Haakon turns on, and the older ones may stay. Then archive leftovers nobody uses.
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

*Done in the lane:*
- The housekeeping (PR #222): done entries and done parts' detail moved to `docs/archive/progress-done.md`; this file
  is now about 33 KB, all of it open entries, kept word for word.
- The open entries' specs moved word for word to `docs/handoff/queue-specs.md` by the design session (31 October
  2026); each entry here keeps its title, a line and a pointer, and this file is now about 12 KB.
- The Voices switch's icon (PR #224): a head speaking, no longer the header's sound speaker.
- Score and Best step aside under a banner above the board, on a phone held upright (PR #232; the audit's first find).

## The queue, in order

**Done** (each in `docs/archive/progress-done.md`): 1 and 1b (cheaper development and previews (PRs #39, #41), the big files split (PRs #43, #45, #46)); 1b+ (Wildcard's hair, again (PR #107)); 1b+++ (Wildcard's hair, Trump's (PR #110)); 1b++ (the phone's bottom (PR #112)); 1c (the big test files split (PRs #95, #96, #97, #100, #102, #103, #104)); 2 (types for the multiplayer messages (PR #48)); 2c (the woodpecker, 1.3 times (PR #139)); 2d (rivals' chomps (PR #150)); 2e (the woodpecker pecks beside a snake, not on it (PR #141)); 2f (Wildcard's hair, lacquered (PR #144, version F)); 2f+ (Wildcard's hair, a size smaller (PR #156, `WILD_SIZE` 0.85)); 2g (the meal goes down (PR #146)); 2j (babble voices for the rivals' bubbles, never distracting (PR #162; on by default, the Voices switch under the board between rounds, V at any time)); 2k (the woodpecker, as big as it gets, 1.7 times (PR #170)); 2k+ (the woodpecker perches clear of the buttons' words, at 1.7 times (PR #191)); 2l (flags that bend as a snake goes over them (PR #186)); 2m (beetles and the woodpecker (PR #199: burrows keep up, beetles flee the beak, the bird eats one still under it)); 2o (a squashed bead leaves a splat (PR #210)); 2p (flags in depth, hit head-on, and bent by their owners (PR #211)); 2t (Capricious without its ring, and a costume change for every change (PR #212)); 2u (picked rivals for this visit; unmet rivals back into the deck (PR #221)).

### 5. Round six B: the new moves (DESIGN "Round six B"); next AI entry, right after Copycat's part of 3b

The golden jump that flies, leap now, gold portals, dropped charges, the spit along the line and one pricing model for every power, each its own playable PR that the rivals use well. *Done:* parts 1, 2, 3 and 3b (PRs #158, #174, #183, #195). **Next, in order:** part 4 (draft PR #198, 2r folded in: its A/B comes out even, so it waits until leap now and the flight pay the rivals), then 2q, 2s, part 3b+ (the spit flies along the line), part 5 (#202, gold portals), part 6 (built on `round6b/dropped-charges`) and part 7 (parked on `round6b/pricing`); then the teaching system (item 4). Spec: `docs/handoff/queue-specs.md`, "5. Round six B: the new moves".

### 2n. Wildcard's hair: every version side by side, Haakon picks (30 October 2026; small, an art lane)

The original hair as it was at a79946b, with only its lick reversed, curling up and back; nothing else changes. Haakon, 31 October 2026, on the third try (PR #208): "The hair looks 'okay' now." That is his yes: PR #208 gets its review and merges. Spec: `docs/handoff/queue-specs.md`, "2n. Wildcard's hair: every version side by side, Haakon picks".

### 2q. Rivals notice like people (30 October 2026; an AI entry, after part 4)

Every rival sees another snake as late as a person would notice it: `REACTION_MS` near its own head, growing to about 400 ms across the board, measured with `tools/abtest.js`. Spec: `docs/handoff/queue-specs.md`, "2q. Rivals notice like people".

### 2r. No hop onto a doomed island (30 October 2026; part of item 5's part 4)

Before a hop or a flight a rival weighs where it lands, above all whether it can jump off again; built into part 4 (#198). Spec: `docs/handoff/queue-specs.md`, "2r. No hop onto a doomed island".

### 2s. The log breaks, but never drifts apart (30 October 2026; an engine-rules entry, after 2q)

The woodpecker never pecks a patch that would leave a piece of the log out of a plain hop's reach of every other piece, so islands form but nobody is stranded on one. Spec: `docs/handoff/queue-specs.md`, "2s. The log breaks, but never drifts apart".

### 2v. The newest version, by itself between rounds (30 October 2026; small, a UI lane)

The page looks for a newer version when shown again and every 30 minutes, and reloads into it by itself between rounds, never during one, with a line of what changed; online the host updates first. Lane: draft PR #223. Spec: `docs/handoff/queue-specs.md`, "2v. The newest version, by itself between rounds".

### 2b. Hunger's worth at a contested apple, for every rival (Haakon, 29 October 2026; an AI entry)

A contested apple is worth what it saves: a starving rival contests it because it is worth more; Gobbler contests even when fed; Desperado is less risk-averse everywhere. Spec: `docs/handoff/queue-specs.md`, "2b. Hunger's worth at a contested apple, for every rival".

### 2h. The endgame: eat what keeps you alive, not what boxes you in (Haakon, 29 October 2026; an AI entry, after 2b)

In the endgame a meal is worth the life it buys against the room it costs: a rival eats when hunger would end it before room would. Spec: `docs/handoff/queue-specs.md`, "2h. The endgame: eat what keeps you alive, not what boxes you in".

### 2i. Food seasons: lean, normal and plentiful rounds (Haakon, 29 October 2026; an engine-rules entry, after 2h)

Each round draws a food season, lean, normal or plentiful, seen in a start banner, taught, and played by the rivals; online with a protocol bump. Spec: `docs/handoff/queue-specs.md`, "2i. Food seasons: lean, normal and plentiful rounds".

### 3. Fixes and polish (the owner's playtest of 2026-10-20)

Its done entries (PRs #49 to #124) are in `docs/archive/progress-done.md`, "Item 3, done".

### 3b. The rivals who change: Capricious, Copycat and Wildcard (Wildcard's part after 5)

Capricious done (PR #126) and Copycat done (PR #142). **Wildcard's part waits** until after 5, built on the branch `wildcard-shows-its-mix`; its "left to do" is in the spec. Spec: `docs/handoff/queue-specs.md`, "3b. The rivals who change: Capricious, Copycat and Wildcard".

### 3c. A new rival: the Charmer (Haakon, 29 October 2026; an AI entry, after 2b and 3b)

Charmer, a vain show-off who courts the biggest snake on the board and steals its meals; his look and his mark on death wait for Haakon's description. Spec: `docs/handoff/queue-specs.md`, "3c. A new rival: the Charmer".

### 4. The teaching system, steps 2–6 (DESIGN "Teaching by showing") — after 5, whose new moves it must teach

Teaches every move of item 5 by showing, each with its picture or cue, its lesson and its Field guide row; it starts as soon as item 5's last part merges, as a lane of its own. Spec: `docs/handoff/queue-specs.md`, "4. The teaching system, steps 2–6".

### 6. Round six C: the woodpecker in three acts

The draft is in `docs/handoff/woodpecker-acts-draft.md`.

- Also: an A/B test of food knocked aside against food falling into the hole, with a `?food=fall` knob for the owner's playtests.
- If the knock stays, it gets bark chips spraying out and a little bounce where it lands.
- Ghost's memorial: the planned smoke wisp, or the owner's idea of a broken shackle with a few chain links. Ghost's tongue stays smoke.
- The earlier "the bird eats the food" variant for that A/B is in `tools/dev/r6-study-tools/patch-flex3.js` (PECK_FOOD).

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

### 8. Last: beetles who meet, fight (Haakon, 29 October 2026; an engine-rules entry, after everything else)

Two beetles that meet fight a shoving match, and a snake that gets there in time can catch them while they do; last of all. Spec: `docs/handoff/queue-specs.md`, "8. Last: beetles who meet, fight".

## Noted, not yet queued

- **Apples by the edge rot** (found in PR #142's census, `tools/dev/rotten-apples.js`): 80% of the apples that rot lie
  on the edge row or one in, passed up by rivals whose heads came within 2. The room and margin weights likely count an
  edge cell against a move even when the apple is safe; an AI entry could test a safe-meal exception like the one for
  meals by the neck (`MEAL_DAWDLE`).

Small things found on the way, for Haakon to place in the queue:
- (None now.)
