# Progress

What is done and what comes next, in order (how to work through it: `AGENTS.md`). Mark an item done here, with its PR,
when it is merged into `main`; add the owner's new tasks where he places them, with his words quoted.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

**The main lane is 6** (round six C: the woodpecker in three acts; parts 1 and 2 done, part 3 next), the first open entry that waits on nothing (3c
waits on 3b's Wildcard part, 3d on 3c, and 4 on 5): item 5's part 7 (one pricing
model, built afresh) waits on nothing now that 2ab is stopped (#574), so it is next once 6's part 3 (PR #615) merges,
as the queue's order says; 2y++'s last step waits on part 7. 2i (PR #599), 2h (PR #596), 2b (PR #593), part 4 (#198,
merged as it stands), 2y, 2y+, part 5, 2x, 2z, 2u, 2u+, 2q, 2y++ steps 1 to 3 (PRs #550, #588, #591), 3b+ (PR #580; its finding, that spitters come out even, is
#583) and part 6 (PR #584) before it are done. The polish lane and the workshop lane run beside it, each claimed by a draft PR.

## For the owner

Everything for the owner is an issue: [questions and readings](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aquestion)
(`question`), [ideas](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aenhancement) (`enhancement`) and
[bugs](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Abug) (`bug`), by
`core/modules/inbox.md`. Answered rows from before 2 November 2026: `docs/archive/progress-done/owner-answered.md`,
"For the owner, answered".

## The polish lane

A side lane of small refinements, beside the AI and engine lane and never ahead of it (the owner, 31 October 2026: "Should
we add a polish point to each that it can spend the last credits on also?" and, to the design session's shape of it,
"Yes, and make things as refined as possible!"). Taken when the main lane's current entry is merged or parked, and on
the second account until its usage is spent; on the main account the brake closes it first (from about 85%).
- **First: the slop audit** (the owner, 2 November 2026: "Are these 2 games ai sloppy?", then "Yes, please,
  expertly!"). Everything a player reads, checked by fresh eyes for the tells of machine-written text, before the
  writing pass at the end, which still comes:
  1. **Scope:** every voice's chatter, impressions, moments and talk (`chatter/`), each rival's blurb, the lessons, the
     Field guide, banners, cards, menus, the news lines and the README's player text.
  2. **A fresh-eyes reviewer** (a helper given only the text and this brief, Opus at high effort) reads each voice or
     screen whole and lists its worst lines, each with the tell: one sentence shape filled in again and again (as in
     Capricious's "Sunshine! I love sunshine! Today." and its siblings), filler and hedging, clichés, every line
     exclaimed, two voices that sound alike, the same joke twice, lines too long to read in play.
  3. **The builder rewrites them** in each character's own voice, keeping every trademark and line count's purpose;
     the PR shows ten lines before and after, so the owner can set the bar.
  4. **A cheap guard after:** a test that fails when too many lines in one voice share one shape (the same opening
     words and punctuation), so the formula cannot creep back.
  Each kind of text is reviewed as every review is (`core/modules/reviews.md`); here a 10 means
  nothing reads machine-made, every voice is its own and no formula repeats. The owner's read of the ten lines before
  and after is the final word. One PR per voice group or screen, in this lane.
  *Done so far* (3 November 2026), one line a merge:
  - Capricious, Metagamer and Star: the "X! I love X!" template, the colon log lines and "in my day" thinned (PR #438).
  - Sovereign, Colonist and Desperado: "royal X", "I say", "partner" and "Yeehaw" thinned; the two posh voices apart (PR #439).
  - Ouroboros, Joker and Sniper: "again", knock-knock and "Target X" thinned; Sniper's "whoppertunity" kept (PR #441).
  - Creeper, Gobbler, Vulture and Mute: light touches where each repeated itself (PR #442).
  - The banners and cards: the deflating tag ("X. For now.") and the repeated jokes gone (PR #443).
  - The lessons and the Field guide: terse lessons and subjectless rows read straight, rules unchanged (PR #445).
  - The guard: the chatter suite fails a voice with more than four lines of one shape (PR #448).
  - The menus: the start card's trailer-shaped intro, the nap card's cliché, the repeated friends joke and errors that didn't say what went wrong (PR #558).
  - The news lines: the repeated "no longer", semicolon lists, "islands" and a stray "Leap now!" gone, the top line left to the milestone (PR #561).
  - The README's player text: run-ons with piled brackets, "So …" summaries and one phrase four times, facts unchanged (PR #562).
  *Next on resume:* the guide's Burrows, Jump, Cuts and Golden beetle rows, once 2u+ and 2aa merge.
  *Left:* the guide's Burrows, Jump, Cuts and Golden beetle rows
  and one name for each thing (hole, pit or gap; jump, hop or leap; the rings), once part 5 (#202) merges. Wildcard's
  and Mason's protected lines stay as they are; the Chinese is rewritten with each changed line.
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

*Next find:* the portals drawn blue and orange, as in the game Portal (the owner, 9 November 2026, #592): the entry
blue, the exit orange, glowing ovals with a thin gold trim, every text that calls them gold portals updated (design 40,
"Gold portals for the wrap"). Then look for more by playing, as "How" says.

*Done in the lane:* each fix's line is in `docs/archive/progress-done/polish-lane.md`, "The polish lane, done" (the README for
players, any key wakes, the woodpecker bigger on a phone, the flash become the dash, the room card and Join on a phone,
and the owner's notes of 2 November, among them).

## The workshop lane (splits by meaning, leftovers, the file-by-file review)

- **The old copy, removed** (archive, 3 November 2026): `tools/copies-baseline.json` lists one, the same probe of the
  page's header in `tools/layout/01-probes.js` and `tools/ui/03-header-over-the-board.js`; one shared helper, and the
  entry dropped.

*Done in the lane:* each line is in `docs/archive/workshop-lane-done.md`.

- **The file-by-file review** (the owner, 2 November 2026; part 1, the docs every session reads, done in PR #334;
  part 2, `docs/design/`, PR #335; part 3, the code, draft PR #337): its spec is in
  `docs/handoff/queue-specs.md` under the same title.
- *Done:* `audio.js` and `chatter/zh.js` split (PRs #225, #226), the chatter split by meaning (PR #318), the workshop
  check's point (2) (this file 10 KB, `AGENTS.md` 20 KB, 2 November; condensed again from 23.6 to 19.8 KB, PR #360)
  and point (5), the unused-code check (PR #331):
  `docs/archive/progress-done/split-lane.md`, "The split lane, done".
- **The shared core** (archive, 5 November 2026), first among the side lanes and before the rule-file audit: the rules
  common to every project move to one repository, each project carrying a checked copy; its spec is in
  `docs/handoff/queue-specs.md` under the same title. Step 3 is done here (PR #637, the core at `2d13e39`,
  after #636 carried `develop` into `main`); next is the rule-file audit, and each later core change comes as a sync PR.
- **The browser suites' one ending** (#526): `tools/render-test.js` and `tools/input-test.js` end with `report.end(b)`
  like the others, once entry 2u, which holds them, merges.
- **The rule-file audit's larger moves** (the workshop check's point 6; archive, 3 November 2026): the slop
  bar a home of its own, since `core-manifest.md`'s *slop bar* points to the slop audit's entry in this file, which
  moves to the archive when done.
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
   exit bit in a third of follows but moved no places either way ("Gold portals for the wrap" in design 40); the
   owner's call is #592.
4. **Measured again after 2u and part 7,** whose stamina and pricing change what a flight costs. Only if it is still
   even then does a bigger change go to the owner as a question: a longer flight, or the ring shown before take-off.

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

### 9. At the very end: the writing pass (the owner, 31 October 2026; Fable, its newest version, after everything else, entry 8 included)

Every rival's lines given a make-over, Fable holding the creative control (voice guides, samples, spot-checks) and Opus writing the bulk, outside what the owner protects: his own lines, the lines he likes, and the gags (Mason's bad Latin, "vidi vici veni"). After everything else, so it covers every line the queue adds. Spec: `docs/handoff/queue-specs.md`, "9. At the very end: the writing pass".

## Noted, not yet queued

Ideas are issues now (Feature requests, `enhancement`: "For the owner" above); the four noted here moved there on 2 November
2026 (#324 to #327).
