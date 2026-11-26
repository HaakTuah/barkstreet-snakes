# Progress

What comes next, in order (how to work through it: `AGENTS.md`), and nothing done (`core/roles/shared/inbox.md`, "The
*progress file* holds order only"). Each entry says what is next, who builds it and what it waits on, and points to its
spec and pull requests for the rest. When an entry merges into `main`, it leaves this file for
`docs/archive/progress-done/queue-done.md`, with its PR; the owner's new tasks go where the owner places them, with a
pointer to the owner's words in the archive.

## State

The first open entry below is next. **The main lane is 2y++'s last step**, the first open entry that waits on nothing;
3b++ and Wildcard's part of 3b wait on nothing either, in the queue's order (3c waits on 3b's Wildcard part, 3d on 3c),
and entry 4, the teaching system, starts as a lane of its own once #783's steps 2 and 3 have merged. The polish lane and
the workshop lane run beside it, each claimed by a draft PR. What is done: `docs/archive/progress-done/queue-done.md`.

## For the owner

Open [ideas](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aenhancement) (`enhancement`) and
[bugs](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Abug) (`bug`), by
`core/roles/shared/inbox.md`.

## The polish lane

Beside the main lane (`core/roles/shared/work-flow.md`, point 4). *Next find:* more by playing. What belongs and how:
`docs/handoff/queue-specs.md`, "The polish lane"; done: `docs/archive/progress-done/polish-lane.md`.

## The workshop lane (splits by meaning, leftovers, the file-by-file review)

Done: `docs/archive/workshop-lane-done.md`. What changes the AI, the engine's rules or the online messages goes to the
main lane as an entry of its own.

- **The core's game rules this game does not meet yet** (the design session, 11 November 2026): next, point (1),
  whether one `tools/abtest.js` run plays all three groups of "Using a feature must pay" (where it fits, always, never),
  with its threshold for "by more than chance" listed as a first guess.
- #764, the audit of how the code is put together: next, its cleaning lane (#783, below) and its two small drifts
  (#784), which waits for the stand-in's verdicts.
- #765, the prune of the records of the owner's words: superseded by #792.
- #766, #767, #768 and #769, the owner's trials, each reporting to the core: a first-time player, a public rule
  set, two rival entries measured side by side (the next two in the main lane, on different files) and the change probe.
- #783, the cleaning lane from the code audit, each step its own small PR with behaviour proven unchanged: next,
  step 2, `game/friends.js` split as a pure move; then (3) one teaching file for each rule's lesson words, guide row
  and trigger, checked that each lesson has its row; (4) the controller's round flags into their own per-round object,
  and the event switches into tables. Steps 2 and 3 go before entry 4 starts. Step 5 is entry 8c.
- **The file-by-file review** and **the shared core**: their specs are in `docs/handoff/queue-specs.md` under the same
  titles.

## The queue, in order

### 2y++. The golden flight, followed up (#399 and #401; side lanes now, the last step after part 7)

Next, its step 4: the flight measured again after 2u and part 7, whose stamina and pricing change what a flight costs.
Only if it is still even then does a bigger change go to the design session: a longer flight, or the ring shown before
take-off. Steps 1 to 3: PRs #550, #588 and #591.

### 3b++. The spit lands more, and stays a shot you can dodge (#583; after part 7)

Make the spit land more as a skill shot fired in front of a snake, which the target sees coming and can step out of,
never by a shorter warning or a flight too quick for 2q's reaction time. Done when spitters come out ahead both ways.
Design 40, "The spit flies along the line".

### 3b. The rivals who change: Capricious, Copycat and Wildcard (Wildcard's part)

Next, Wildcard's part, on the branch `wildcard-shows-its-mix`. Capricious and Copycat: PRs #126 and #142. Spec:
`docs/handoff/queue-specs.md`, "3b. The rivals who change: Capricious, Copycat and Wildcard".

### 3c. A new rival: the Charmer (an AI entry; waits on 3b's Wildcard part)

Spec: `docs/handoff/queue-specs.md`, "3c. A new rival: the Charmer"; his look and his mark on death wait for the
owner's description.

### 3d. A new rival: Barkis & Boot-Snake, one snake with two sides (an AI entry; waits on 3c)

Spec: `docs/handoff/queue-specs.md`, "3d. A new rival: Barkis & Boot-Snake, one snake with two sides".

### 4. The teaching system, steps 2–6 (DESIGN "Teaching by showing"; a lane of its own, after #783's steps 2 and 3)

Teaches every move of item 5 by showing, each with its picture or cue, its lesson and its Field guide row. Spec:
`docs/handoff/queue-specs.md`, "4. The teaching system, steps 2–6".

### 6. Round six C: the woodpecker in three acts

Next, part 4: the food A/B (`?food=fall`), with part 3's head to head again (falling food takes meals out of the frenzy:
never eating must still do worse), chips and a bounce if the knock stays (the old study patches,
`tools/dev/r6-study-tools/patch-flex*.js`, rebuilt for it). Then 5, skeletons and trademark memorials, and 6, 2h's
numbers measured again; each playable PR merged before the next. Parts 1 to 3++: PRs #605, #610, #615, #756, #760 and
#777. Spec: `docs/handoff/queue-specs.md`, "6. Round six C: the woodpecker in three acts".

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

### 8. Near the end: beetles who meet, fight (an engine-rules entry, last but the writing pass)

Spec: `docs/handoff/queue-specs.md`, "8. Near the end: beetles who meet, fight".

### 8b. #595, fed rivals take the apple on the edge row (an AI entry, one at a time; after 8, before the writing pass)

Spec: the issue's text; design 39, "A meal isn't a pin".

### 8c. The cleaning lane's engine and AI step (#783, step 5; one at a time, as engine and AI work)

Spec: #783 and the audit's "Findings and proposals" it names.

### 9. At the very end: the writing pass (Fable; after everything else, entry 8 included)

Spec: `docs/handoff/queue-specs.md`, "9. At the very end: the writing pass".
