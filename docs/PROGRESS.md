# Progress

What is done and what comes next, in order (how to work through it: `AGENTS.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add the owner's new tasks where he places them, with his words quoted.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

**The main lane is 2u;** part 4 (#198, merged as it stands), 2y, 2y+, part 5, 2x and 2z before it are done. The
polish lane and the workshop lane run beside it, each claimed by a draft PR.

## For the owner

Everything for the owner is an issue: [questions and readings](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aquestion)
(`question`), [ideas](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aenhancement) (`enhancement`) and
[bugs](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Abug) (`bug`), by
"Questions, readings and ideas" in `AGENTS.md`. Answered rows from before 2 November 2026: `docs/archive/progress-done/owner-answered.md`,
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
  Each kind of text is reviewed as every review is ("Reviews" in `docs/claude-and-codex.md`); here a 10 means
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
  *Next on resume:* the menus (the start card, the room card and the nap card's words), then the news lines.
  *Left:* the menus, the news lines and the README's player text; the guide's Burrows, Jump, Cuts and Golden beetle rows
  and one name for each thing (hole, pit or gap; jump, hop or leap; the rings), once part 5 (#202) merges. Wildcard's
  and Mason's protected lines stay as they are; the Chinese is rewritten with each changed line.
- **Mason's vein, marble not gold** (#431; the owner, 3 November 2026): his marble's vein turns a marble colour, slate
  or rose, so gold stays for powers alone; a picture on its PR.
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

*Next find:* the rivals' speech bubbles overlap (#326; the owner, 2 November 2026).

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
  `docs/handoff/queue-specs.md` under the same title. Step 1 is the owner's.
- **The browser suites' one ending** (#526): `tools/render-test.js` and `tools/input-test.js` end with `report.end(b)`
  like the others, once entry 2u, which holds them, merges.
- **The rule-file audit's larger moves** (the workshop check's point 6; archive, 3 November 2026): (1)
  `docs/claude-and-codex.md` (23 KB) is past the 20 KB warning: the sections that wait until Codex can build, "What goes
  to Codex" to "When Codex is not there", into a file of their own; (2) the slop bar a home of its own, since
  `docs/review-guidelines.md` points to the slop audit's entry in this file, which moves to the archive when done.
- **Waiting for a gap, a split by meaning:** `render/world.js` (40 KB), the file-by-file review's last part, in a PR
  of its own when no open lane touches it, proven by fingerprints and suites.

## The queue, in order

**Done:** every finished entry, 1 to 2w, with its PR, is in `docs/archive/progress-done/queue-done.md`, "The queue, done".

**From the issues** (the owner, 2 November 2026): Ghost starving most (#325) is measured in the next AI entry, as its
trademark (distance) or a fault; in the same entry, apples by the edge rotting (#324): 80% of the apples that rot lie on
the edge row or one in, passed up by rivals whose room and margin weights count a safe edge cell against them, so it
tests a safe-meal exception like the one by the neck (`MEAL_DAWDLE`), measured both ways; the snake that starved 4 s after its warning (#327) was a snake of 4 in snow, warned on the hunger clock: fixed in the warning (PR #397).

### 2y++. The golden flight, followed up (the owner, 2 November 2026; #399 and #401; side lanes now, the last step after part 7)

2y left the flight even both ways (24.9% against 25.1% head to head; +0.10 ± 0.15 place a use): between rivals a
landing is almost never contestable. The flight stays as built for now, and no rule changes yet:
1. **The ring tinted by its taker** (#401): done, PR #550 (the cue: "Taking a landing" in design 40).
2. **The flight measured against fliers who fly like people** (a measurement, a side lane now): fliers who take off into
   contested rings, as people do, against the rivals who now take landings; per use and head to head.
3. **Portals with a real cost** (#447; the owner, 3 November 2026): portals stay as built, followed one round in five
   but never winning places, so the wrap's trade-off is not yet real. A measured experiment: a follower coming out
   of the portal may cut off its owner. Built only if it makes following matter both ways, with no refuge for owner
   or follower.
4. **Measured again after 2u and part 7,** whose stamina and pricing change what a flight costs. Only if it is still
   even then does a bigger change go to the owner as a question: a longer flight, or the ring shown before take-off.

### 2aa. Dash on the key you're going (the owner, 4 November 2026; an input entry, a side lane now)

The steering key of the way you're going dashes again, as a swipe ahead does, behind touch's guard: its spec is in
`docs/handoff/queue-specs.md` under the same title.

### 2u. One stamina for jump and dash (the owner, 2 November 2026; an engine-rules entry, after 2z and before part 7)

One stamina for both plain powers, shown in how each snake looks, no tail cost, each power a third to two thirds of
plain power uses and neither better in aggregate, the pace kept: `docs/design/37-one-stamina.md`. Part 7's pricing then
prices the one stamina. Once it merges, the golden apple is measured again with the stamina refilled in place of the
two rests (2z, #460): "The golden apple's worth" in `docs/design/04-food-and-the-world.md`.

**Who builds it** (the owner, 6 November 2026; #530): the second account's builder, which merges its parked
`entry/2u-stamina-looks` into `entry/2u-one-stamina` and finishes 2u in PR #462.

### 2u+. The stamina economy and the golden apple's worth (the owner, 3 and 4 November 2026; #460; a measurement right after 2u, then an engine-rules entry for what pays)

Where the one stamina comes from (food, its own recharge, banking to a cap) and what the golden apple gives (a full
refill, a one-bump shield), measured for every rival: its spec is in `docs/handoff/queue-specs.md` under the same title.

### 5. Round six B: the new moves (DESIGN "Round six B")

The golden jump that flies, leap now, gold portals, dropped charges, the spit along the line and one pricing model for every power, each its own playable PR that the rivals use well. *Done:* parts 1, 2, 3 and 3b (PRs #158, #174, #183, #195). **Next, in order:** part 4 (draft PR #198, 2r folded in; the owner answered on 1 November 2026 that the moves stay as designed and the rivals are improved until their users come out ahead: the row is in `docs/archive/progress-done/owner-answered.md`, "For the owner, answered"), then 2x (done, PR #456), then 2q (2s done, PR #289; part 4's both-ways test runs again on its log when part 4 goes on), part 3b+ (the spit flies along the line), part 5 (done, PR #202: gold portals; its finding, that following feeds but wins no places, is #447), part 6 (built on `round6b/dropped-charges`) and part 7 (parked on `round6b/pricing`; it also fixes the trademark measures and lifts Joker into the band, see the spec); then the teaching system (item 4). Spec: `docs/handoff/queue-specs.md`, "5. Round six B: the new moves". **When part 4 merges:** run the census on seeds 3 and 11 again (`scripts/sim.sh 200 --seed 3 --census --check`): chased beetles must still get away a third to 45% of the time (2w measured it before the flight was in; `--check` fails a census outside that band).

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
three acts" (its draft: `docs/handoff/woodpecker-acts-draft.md`).

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

### 8. Near the end: beetles who meet, fight (the owner, 29 October 2026; an engine-rules entry, last but the writing pass)

Two beetles that meet fight a shoving match, and a snake that gets there in time can catch them while they do; last of the rules, before the writing pass. Spec: `docs/handoff/queue-specs.md`, "8. Near the end: beetles who meet, fight".

### 9. At the very end: the writing pass (the owner, 31 October 2026; Fable 5.1, after everything else, entry 8 included)

Every rival's lines given a make-over, Fable 5.1 holding the creative control (voice guides, samples, spot-checks) and Opus writing the bulk, outside what the owner protects: his own lines, the lines he likes, and the gags (Mason's bad Latin, "vidi vici veni"). After everything else, so it covers every line the queue adds. Spec: `docs/handoff/queue-specs.md`, "9. At the very end: the writing pass".

## Noted, not yet queued

Ideas are issues now (Feature requests, `enhancement`: "For the owner" above); the four noted here moved there on 2 November
2026 (#324 to #327).
