# Progress

What is done and what comes next, in order (how to work through it: `AGENTS.md`). When an entry merges into `main`, move it to
`docs/archive/progress-done/queue-done.md` with its PR; add the owner's new tasks where he places them, with a pointer
to his words in the archive.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

**The main lane is 2y++'s last step** (the flight measured again after part 7), the first open entry that waits on
nothing: entry 5 ended with part 7's 7f, Vulture's circling (PR #785, not taken: Vulture keeps its driver; design 39,
"The cast and their trademarks"), so entry 5 and its 2r are done (`docs/archive/progress-done/queue-done.md`); 3b++ and
Wildcard's part of 3b wait on nothing either, in the queue's order (3c waits on 3b's Wildcard part, 3d on 3c), and entry
4, the teaching system, can start now as a lane of its own, as its entry says. Entry 6's 3++ is closed as measured (the stand-in's verdict of 19 November on #655: no rule
keyed on length is the lever). The entries before these are done (`docs/archive/progress-done/queue-done.md`). The polish lane and the workshop lane run
beside it, each claimed by a draft PR.

## For the owner

Open [ideas](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aenhancement) (`enhancement`) and
[bugs](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Abug) (`bug`), by
`core/modules/inbox.md`. Answered rows from before 2 November 2026: `docs/archive/progress-done/owner-answered.md`, "For
the owner, answered".

## The polish lane

The game's polish lane (`core/modules/work-flow.md`, point 4; the owner, 31 October 2026).
- **First: the slop audit** (the owner, 2 November 2026: "Are these 2 games ai sloppy?", then "Yes, please,
  expertly!"): its bar and method are in `docs/slop-bar.md`; the lines it has fixed so far, in
  `docs/archive/progress-done/polish-lane.md`, "The slop audit, done so far". Done: nothing left (one name for each
  thing, the last item: PR #776).
- **What belongs, here:** the same thing drawn, named or worded differently in two places (a rival's colours, a move's
  name in the lesson and the Field guide); the phone held upright and sideways; the wording of banners, chatter, the
  Field guide and menus; sound levels that jar. Never the online messages: they go to their entries.
- **How, here:** a lesson and an online lobby among the screens; the picture on `pr-media`, and play proven unchanged by
  the suites and the simulation's fingerprints (seeds 3 and 11); one line per fix under this lane.

*Next find:* more by playing, as "How" says (#739, the Field guide's rows for the weather and a friend gone quiet and
the Jump row's early press, is done: PR #778; the book's tabs, which jumped as a finger changed pages, stay put: the
next PR, from the play of 19 November).

*Done in the lane:* each fix's line is in `docs/archive/progress-done/polish-lane.md`, "The polish lane, done" (the README for
players, any key wakes, the woodpecker bigger on a phone, the flash become the dash, the room card and Join on a phone,
the owner's notes of 2 November, the portals blue and orange and the woodpecker's piece washed, among them).

## The workshop lane (splits by meaning, leftovers, the file-by-file review)

*Done in the lane:* each line is in `docs/archive/workshop-lane-done.md`.

- **The core's game rules this game does not meet yet** (the design session, 11 November 2026; from "What each game does
  not yet do" in `reports/2026-11-10-step-3-now.md` of the core's own repository, which no copy holds): (1) whether one
  `tools/abtest.js` run plays all three groups of "Using a feature must pay" (where it fits, always, never), and its
  threshold for "by more than chance" listed as a first guess; points (2) to (4) are done (`docs/archive/workshop-lane-done.md`).
  What changes the AI, the engine's rules or the online messages goes to the main lane as an entry of its own.
- **The owner's audit, prune and trials** (agreed in chat, 14 and 15 November 2026; the stand-in's yes, 19 November):
  #764, the audit of how the code is put together, done (PR #780: `docs/audits/`, its baseline for #771's view on the stack; its
  cleaning lane is #783 and its two small drifts #784, waiting for the stand-in's verdicts); #765, the
  prune of the records of the owner's words, a routine lane, next; and the trials, nothing merged, each reporting to the core:
  #766 (a first-time player), #769 (the change probe), #767 (a public rule set) and #768 (two rival entries measured
  side by side: the next two in the main lane on different files).
- **The cleaning lane from the code audit** (#783; the stand-in's yes, sure, 19 November, on the owner's words of 14
  November quoted in #764: "They are not allowed to get worse, and audits should run, and major refactoring runs
  scheduled"), each step its own small PR with behaviour proven unchanged, in order: (1) the part check, a suite with
  today's crossings as its baseline; (2) `game/friends.js` split as a pure move; (3) one teaching file for each rule's
  lesson words, guide row and trigger, checked that each lesson has its row; (4) the controller's round flags into
  their own per-round object, and the event switches into tables. Steps 1 to 3 go before item 4, the teaching system,
  starts. Step 5, in the engine and the AI, is entry 8c.
- **The file-by-file review** (the owner, 2 November 2026; part 1, the docs every session reads, done in PR #334;
  part 2, `docs/design/`, PR #335; part 3, the code, PR #337): its spec is in
  `docs/handoff/queue-specs.md` under the same title.
- **The shared core** (archive, 5 November 2026): the rules common to every project live in one repository, each
  project carrying a checked copy (here `core/`); its spec is in `docs/handoff/queue-specs.md` under the same title.
  Step 3 is done (#636, #637).

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

### 3b++. The spit lands more, and stays a shot you can dodge (the owner, 9 November 2026; #583; after part 7)

Between rivals 2% of spits hit a head. Make it land more as a skill shot fired in front of a snake, which the target sees
coming and can step out of (longer reach, the spitter choosing its moment, a lead), never by a shorter warning or a
flight too quick for 2q's reaction time. Done when spitters come out ahead both ways. Design 40, "The spit flies along
the line".

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
3. **Done** (PR #615): hunger a conditional good to the end, by one hunger clock for the whole round (#616; design 04),
   and the opening it made too hungry eased: a lean round keeps both apples until the first beetles, and the rivals turn
   desperate with 6 s of life left, not 11 (#673; design 04 and 39). Its weighing beats never eating but only ties always
   eating. 3+. **Done** (PR #756): islands that stay (#611; design 38, "Islands that stay"): a piece cut off stays standing while it touches the board's edge and lies a hop from the log; before the
   frenzy the piece it cuts out at the edge stays, in the frenzy its pieces fall. 3++. **Closed as measured** (#655,
   "Make length cost more in the endgame, so always eating there loses clearly"; the stand-in's no, sure, of 19
   November there): three floor shapes (PR #760; design 38, "The floor") and more of the last apples (PR #777; design
   04, "The last apples fall one at a time") left the weighing tied with always eating, since in the frenzy which meals
   a snake takes moves its length only a segment or two against a cut's thirty, so no rule keyed on length can tell the
   two apart. Part 3's tie stands: never eating does clearly worse, always eating comes out even. 4. The food A/B
   (`?food=fall`), with part 3's head to head again (falling food takes meals out of the frenzy: never eating must still
   do worse),
   chips and a bounce if the knock stays (the old study patches, `tools/dev/r6-study-tools/patch-flex*.js`, rebuilt for
   it). 5. Skeletons and trademark memorials. 6. 2h's numbers measured again.

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

### 8. Near the end: beetles who meet, fight (the owner, 29 October 2026; an engine-rules entry, last but the writing pass)

Two beetles that meet fight a shoving match, and a snake that gets there in time can catch them while they do; last of the rules, before the writing pass. Spec: `docs/handoff/queue-specs.md`, "8. Near the end: beetles who meet, fight".

### 8b. Fed rivals take the apple on the edge row (#595, "Idea: fed rivals turn from an apple on the edge row because the edge counts against their territory"; an AI entry, after 8, before the writing pass)

A person takes a free apple on the edge, but eleven of the eighteen rivals refuse one three cells along it when fed: from
the edge more of the board is nearer their head, so the meal looks like ground lost, though the snake leaves the edge
on its next move. A line that has just eaten counts its territory as it will be once it leaves the edge. An AI entry,
run one at a time, with the design check, after the hunger part (entry 6, part 3) merges, since it touches
`ai/food.js`; measured both ways with `tools/abtest.js` on fresh seeds, with a staged-board rules test (a fed rival with
no one near takes the apple), the rot by the edge from `tools/dev/nerve/census.js` and `--signatures` for every
trademark. Spec: the issue's text; design 39, "A meal isn't a pin".

### 8c. The cleaning lane's engine and AI step (#783, step 5; one at a time, as engine and AI work)

`DIRS` and the cast registry out of the AI's files, `decide()` returning a declared plan instead of `memory` keys, and
`step` split by phase, each proven by the fingerprints; then an engine-owned snapshot for online, with its protocol
bump. Spec: #783 and the audit's "Findings and proposals" it names.

### 9. At the very end: the writing pass (the owner, 31 October 2026; Fable, after everything else, entry 8 included)

Every rival's lines given a make-over, Fable holding the creative control (voice guides, samples, spot-checks) and Opus writing the bulk, outside what the owner protects: his own lines, the lines he likes, and the gags (Mason's bad Latin, "vidi vici veni"). After everything else, so it covers every line the queue adds. Spec: `docs/handoff/queue-specs.md`, "9. At the very end: the writing pass".

## Noted, not yet queued

Ideas are issues now (Feature requests, `enhancement`: "For the owner" above); the four noted here moved there on 2 November
2026 (#324 to #327).
