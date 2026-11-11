# Progress

What is done and what comes next, in order (how to work through it: `AGENTS.md`). When an entry merges into `main`, move it to
`docs/archive/progress-done/queue-done.md` with its PR; add the owner's new tasks where he places them, with a pointer
to his words in the archive.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

**The main lane is 6** (round six C: the woodpecker in three acts; parts 1 and 2 done, part 3 next, PR #615), the first
open entry that waits on nothing (3c waits on 3b's Wildcard part, 3d on 3c, and 4 on 5). Item 5's part 7 (one pricing
model, built afresh) is next once 6's part 3 (PR #615) merges, as the queue's order says; 2y++'s last step waits on part
7. The entries before
these are done (`docs/archive/progress-done/queue-done.md`). The polish lane and the workshop lane run beside it, each
claimed by a draft PR.

## For the owner

Open [ideas](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aenhancement) (`enhancement`) and
[bugs](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Abug) (`bug`), by
`core/modules/inbox.md`. Answered rows from before 2 November 2026: `docs/archive/progress-done/owner-answered.md`, "For
the owner, answered".

## The polish lane

A side lane of small refinements, beside the AI and engine lane and never ahead of it (the owner, 31 October 2026:
"Should we add a polish point to each that it can spend the last credits on also?" and, to the design session's shape of
it, "Yes, and make things as refined as possible!"). Taken when the main lane's current entry is merged or parked, and
on the second account until its usage is spent; on the main account the usage brake (`core/modules/claude.md`) closes it
first.
- **First: the slop audit** (the owner, 2 November 2026: "Are these 2 games ai sloppy?", then "Yes, please,
  expertly!"): its bar and method are in `docs/slop-bar.md`; the lines it has fixed so far, in
  `docs/archive/progress-done/polish-lane.md`, "The slop audit, done so far". *Left:* the guide's Burrows, Jump, Cuts
  and Golden beetle rows, and one name for each thing (hole, pit or gap; jump, hop or leap; the rings). Wildcard's and
  Mason's protected lines stay as they are; the Chinese is rewritten with each changed line.
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
  and 11), so nothing that changes play slips in; merged once reviewed, one line per fix under this lane. A fix not finished when usage ends is left as the brake says
  (`core/modules/claude.md`), its find noted for the next session.

*Next find:* first the portals drawn to look like Portal's own (the owner, 10 November 2026; how, in design 40,
"Portals for the wrap"), with before-and-after pictures on a phone and on desktop. Then the code comments in `engine/`, `ai/`, `online.js`, `tuning.js` and the simulation tools that still say "gold portals", renamed to "portals" once #615 (open on those files) has merged; then look for more by playing, as "How" says.

*Done in the lane:* each fix's line is in `docs/archive/progress-done/polish-lane.md`, "The polish lane, done" (the README for
players, any key wakes, the woodpecker bigger on a phone, the flash become the dash, the room card and Join on a phone,
the owner's notes of 2 November and the portals blue and orange, among them).

## The workshop lane (splits by meaning, leftovers, the file-by-file review)

*Done in the lane:* each line is in `docs/archive/workshop-lane-done.md`.

- **The core's game rules this game does not meet yet** (the design session, 11 November 2026; the core's
  `reports/2026-11-10-step-3-now.md`, "What each game does not yet do"): (1) whether one `tools/abtest.js` run plays all
  three groups of "Using a feature must pay" (where it fits, always, never), and its threshold for "by more than chance"
  listed as a first guess; (2) a check that nothing in `aiView()` says which snake is a person and that no rival's
  timing gives one away ("The computer players never know who is a person"); (3) whatever the game shows from the past
  showing its age ("No rule untaught"); (4) online rounds replaying from the log of every input ("Same seed, same
  game"). What changes the AI, the engine's rules or the online messages goes to the main lane as an entry of its own.
  The updating rule needs nothing: `docs/design/36-updating.md` takes a new version between rounds, as the core's
  "Players always play the newest version" now says.
- **The file-by-file review** (the owner, 2 November 2026; part 1, the docs every session reads, done in PR #334;
  part 2, `docs/design/`, PR #335; part 3, the code, PR #337): its spec is in
  `docs/handoff/queue-specs.md` under the same title.
- **The shared core** (archive, 5 November 2026): the rules common to every project live in one repository, each
  project carrying a checked copy (here `core/`); its spec is in `docs/handoff/queue-specs.md` under the same title.
  Step 3 is done (#636, #637).
- **The browser suites' one ending** (#526): `tools/render-test.js` and `tools/input-test.js` end with `report.end(b)`
  like the others.
- **Waiting for a gap, a split by meaning:** `render/world.js` (40 KB), the file-by-file review's last part, in a PR
  of its own when no open lane touches it, proven by fingerprints and suites.

## The queue, in order

**Done:** every finished entry, 1 to 2w, with its PR, is in `docs/archive/progress-done/queue-done.md`, "The queue, done".

### 2y++. The golden flight, followed up (the owner, 2 November 2026; #399 and #401; side lanes now, the last step after part 7)

2y left the flight even both ways (24.9% against 25.1% head to head; +0.10 ± 0.15 place a use): between rivals a
landing is almost never contestable. The flight stays as built for now, and no rule changes yet:
1. **The ring tinted by its taker** (#401): done, PR #550 (the cue: "Taking a landing" in design 40).
2. **The flight measured against fliers who fly like people:** done, PR #588; still even, and no AI change. Fliers that
   take off into contested rings, as people do, came out even with develop's careful ones head to head (wins 25.0%
   against 24.9%, place 2.49 against 2.51, 1,200 pairs on seeds 631 and 632), and so did each flight (+0.03 ± 0.07
   place a use, against develop's −0.02 ± 0.05, seeds 631 to 633). Contested rings rose (3.3 to 3.9 jump-ticks a
   round), but rivals went for one only 0.2 times a round, and fliers came down on a body no more often (0.2 a round).
   Even taking a landing worth ten times as much took no more of them: a ring is almost never reachable in time, so the
   ring costs a flier little.
3. **Portals with a real cost** (#447): done, PR #591; no rule changed. A follower snipping its owner's body out of the
   exit bit in a third of follows but moved no places either way ("Portals for the wrap" in design 40); the
   owner's call is #592.
4. **Measured again after 2u and part 7,** whose stamina and pricing change what a flight costs. Only if it is still
   even then does a bigger change go to the design session: a longer flight, or the ring shown before take-off.

### 5. Round six B: the new moves (DESIGN "Round six B")

The golden jump that flies, leap now, gold portals, dropped charges, the spit along the line and one pricing model for every power, each its own playable PR that the rivals use well. *Done:* parts 1, 2, 3 and 3b (PRs #158, #174, #183, #195). **Next, in order:** part 4 (draft PR #198, 2r folded in; the owner answered on 1 November 2026 that the moves stay as designed and the rivals are improved until their users come out ahead: the row is in `docs/archive/progress-done/owner-answered.md`, "For the owner, answered"), then 2x (done, PR #456), then 2q (done, PR #576, part 4's both-ways test run again on its log), part 3b+ (done, PR #580: the spit flies along the line; its finding, that the spitters come out even, is #583), part 5 (done, PR #202: gold portals; its finding, that following feeds but wins no places, is #447), part 6 (done, PR #584: dropped charges; a grab's charges are worth what a leaf's are, and how far one is worth going is for part 7) and part 7 (parked on `round6b/pricing`; it also fixes the trademark measures and lifts Joker into the band, see the spec); then the teaching system (item 4). Spec: `docs/handoff/queue-specs.md`, "5. Round six B: the new moves". **When part 4 merges:** run the census on seeds 3 and 11 again (`scripts/sim.sh 200 --seed 3 --census --check`): chased beetles must still get away a third to 45% of the time (2w measured it before the flight was in; `--check` fails a census outside that band).

### 3b++. The spit lands more, and stays a shot you can dodge (the owner, 9 November 2026; #583; after part 7)

Between rivals 2% of spits hit a head. Make it land more as a skill shot fired in front of a snake, which the target sees
coming and can step out of (longer reach, the spitter choosing its moment, a lead), never by a shorter warning or a
flight too quick for 2q's reaction time. Done when spitters come out ahead both ways. Design 40, "The spit flies along
the line".

### 2r. No hop onto a doomed island (30 October 2026; part of item 5's part 4)

Before a hop or a flight a rival weighs where it lands, above all whether it can jump off again; built into part 4 (#198). Spec: `docs/handoff/queue-specs.md`, "2r. No hop onto a doomed island".

### 3b. The rivals who change: Capricious, Copycat and Wildcard (Wildcard's part after 5)

Capricious done (PR #126) and Copycat done (PR #142). **Wildcard's part waits** until after 5, built on the branch `wildcard-shows-its-mix`; its "left to do" is in the spec. Spec: `docs/handoff/queue-specs.md`, "3b. The rivals who change: Capricious, Copycat and Wildcard".

### 3c. A new rival: the Charmer (the owner, 29 October 2026; an AI entry, after 2b and 3b)

Charmer, a vain show-off who courts the biggest snake on the board and steals its meals; his look and his mark on death wait for the owner's description. Spec: `docs/handoff/queue-specs.md`, "3c. A new rival: the Charmer".

### 3d. A new rival: Barkis & Boot-Snake, one snake with two sides (the owner, 2 November 2026; an AI entry, after 3c)

One snake with two sides and two minds: it rolls over from time to time and after a scare, and whichever side is up
steers; one head, by every snake's rules, so nothing is theirs alone. The reference lives in their names and nature,
nothing copied from the show. Spec: `docs/handoff/queue-specs.md`, "3d. A new rival: Barkis & Boot-Snake, one snake
with two sides".

### 4. The teaching system, steps 2–6 (DESIGN "Teaching by showing") — after 5, whose new moves it must teach

Teaches every move of item 5 by showing, each with its picture or cue, its lesson and its Field guide row; it starts as soon as item 5's last part merges, as a lane of its own. Spec: `docs/handoff/queue-specs.md`, "4. The teaching system, steps 2–6".

### 6. Round six C: the woodpecker in three acts

The woodpecker cuts shapes that fall, down to a floor, then fights; hunger stays a trade-off to the end; and the food
A/B, chips, skeletons and memorials beside it. Spec: `docs/handoff/queue-specs.md`, "6. Round six C: the woodpecker in
three acts" (its draft: `docs/handoff/woodpecker-acts-draft.md`). In six playable PRs, each merged before the next:
1. **Done** (PR #605): the three acts (calm, the watcher and its gaze, the first pecks, the frenzy), `?acts=`; Sovereign's
   time at home asked in #607.
2. **Done** (PR #610): it cuts shapes along an outline, down to a floor, then fights.
3. Hunger a conditional good to the end, by one hunger clock for the whole round (#616; design 04). 3+. Islands
   that stay (#611; design 38, "The log stays one piece"). 4. The food A/B (`?food=fall`),
   chips and a bounce if the knock stays (the old study patches, `tools/dev/r6-study-tools/patch-flex*.js`, rebuilt for
   it). 5. Skeletons and trademark memorials. 6. 2h's numbers measured again.

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

### 8. Near the end: beetles who meet, fight (the owner, 29 October 2026; an engine-rules entry, last but the writing pass)

Two beetles that meet fight a shoving match, and a snake that gets there in time can catch them while they do; last of the rules, before the writing pass. Spec: `docs/handoff/queue-specs.md`, "8. Near the end: beetles who meet, fight".

### 9. At the very end: the writing pass (the owner, 31 October 2026; Fable, after everything else, entry 8 included)

Every rival's lines given a make-over, Fable holding the creative control (voice guides, samples, spot-checks) and Opus writing the bulk, outside what the owner protects: his own lines, the lines he likes, and the gags (Mason's bad Latin, "vidi vici veni"). After everything else, so it covers every line the queue adds. Spec: `docs/handoff/queue-specs.md`, "9. At the very end: the writing pass".

## Noted, not yet queued

Ideas are issues now (Feature requests, `enhancement`: "For the owner" above); the four noted here moved there on 2 November
2026 (#324 to #327).
