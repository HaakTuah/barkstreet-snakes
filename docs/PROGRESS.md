# Progress

What is done and what comes next, in order (how to work through it: `AGENTS.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add the owner's new tasks where he places them, with his words quoted.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

**2 November 2026, a fresh week:** the main lane is part 4 (#198, merged as it stands so the owner can play it), then
2y (done, PR #373; the flight’s question is #399), then 2y+ (done: `ai/` and `engine/`, PRs #406, #408, #407), then part 5 (#202, unparked: the wrap's trade-off), then 2x, then 2z, then 2u; the polish
lane and the workshop lane run beside it, each claimed by a draft PR.

## For the owner

Everything for the owner is an issue: [questions and readings](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aquestion)
(`question`), [ideas](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Aenhancement) (`enhancement`) and
[bugs](https://github.com/HaakTuah/barkstreet-snakes/issues?q=is%3Aopen+label%3Abug) (`bug`), by
"Questions, readings and ideas" in `AGENTS.md`. Answered rows from before 2 November 2026: `docs/archive/progress-done.md`,
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

*Done in the lane:* each fix's line is in `docs/archive/progress-done.md`, "The polish lane, done" (the README for
players, any key wakes, the woodpecker bigger on a phone, the flash become the dash, the room card and Join on a phone,
and the owner's notes of 2 November, among them).

## The workshop lane (splits by meaning, leftovers, the file-by-file review)

- *Done:* the woodpecker's two unplayed cues removed (`audio/cues.js`, `audio/sound.js`; PR #434).
- *Done:* the workshop check's point (2): `AGENTS.md` from 21.5 to 20.0 KB, every rule kept; the workshop check's marks
  moved to `docs/orchestrating.md`, the file table's detail to `docs/developing.md` (PR #420).
- *Done:* the render suite's virtual clock starts at a fixed time, so the woodpecker's ring check (and every staged
  check) draws at the same phase on every run, whatever the load (#424, PR #427).
- *Done:* the input suite's "rivals have all thought" check, counted round after round to its 100-tick floor and its
  round started on the virtual clock, so neither a short random round nor load can flip it (#414, PR #415).
- *Done:* the layout suite in cloud sessions (#383): it never hung, it ran about 28 minutes in one process, silent
  until its end; `scripts/test.sh` now runs its five CI jobs side by side, each part's end is printed, and the banner
  probe no longer misreads a banner on its way out (PR #396).
- *Done:* the workflows' actions, `actions/checkout` and `actions/setup-node` 4 to 7 (Dependabot, PR #361).
- *Done:* TypeScript 6.0.2 to 7.0.2, the native compiler, its 20 platform packages audited (Dependabot, PR #390).
- *Done:* CI and the cloud setup on Node 26 (from 22; suites green, fingerprints unchanged; PR #369).
- *Done:* licences audited (`tools/licences.json`), gated on every PR (`.github/workflows/licences.yml`) and their notices
  shipped (`THIRD-PARTY-NOTICES.txt`); two lists, what ships and tools that only run (PR #377).
- *Done:* every version where Dependabot sees it: the tools' packages in `tools/package.json` (Playwright 1.49.1 to
  1.64.1), Dependabot's npm updates, and a monthly check of the rest, PeerJS and Node (`tools/versions.json`; PR #385).

- **The file-by-file review** (the owner, 2 November 2026; part 1, the docs every session reads, done in PR #334;
  part 2, `docs/design/`, PR #335; part 3, the code, draft PR #337): its spec is in
  `docs/handoff/queue-specs.md` under the same title.
- *Done:* `audio.js` and `chatter/zh.js` split (PRs #225, #226), the chatter split by meaning (PR #318), the workshop
  check's point (2) (this file 10 KB, `AGENTS.md` 20 KB, 2 November; condensed again from 23.6 to 19.8 KB, PR #360)
  and point (5), the unused-code check (PR #331):
  `docs/archive/progress-done.md`, "The split lane, done".
- **The file-by-file review's moves:** done, a folder a PR (#341, #342, #343, #344, #345):
  `docs/archive/progress-done.md`, "The split lane, done". Left: `render/world.js`'s part, which waits with it below.
  `render/food.js` split by meaning: its burrows and the beetle's bore to `render/burrows.js` (66 to 43.5 and 22.6 KB;
  PR #421).
- **The design by topic, not by round** (#336; the owner, 2 November 2026): each topic's current rule moves from the
  round files into its topic file in `docs/design/`, superseded versions and measurements to `docs/archive/`. A slow
  side lane, one topic per docs-only PR, taken when a lane is free; code comments citing a section are checked.
  Done: food (round four's "Food", round six A's food and beetles into `04-food-and-the-world.md`; PR #425). The
  playtest's burrows and beetles (32) followed (PR #426). The woodpecker
  followed, in a file of its own, `38-the-woodpecker.md` (PR #428). The rivals
  followed, in `39-the-rivals.md` (PR #429). The snakes'
  looks followed, in `03-the-snake-as-a-character.md` (PR #430). The powers and
  moves followed, in `40-powers-and-moves.md`, and the crashes in `41-crashes.md` (PR #432). Sound followed, in
  `21-sound.md` (PR #433). The page followed, in `31-phones.md`, `33-one-screen.md` and `42-controls.md`
  (PR #435). Online and the start card followed, in `22-play-with-friends-online.md` and a new
  `43-the-start-card-and-records.md` (PR #PRNUM). Next: teaching, then what's left in the round files.
- **Waiting for a gap:** `render/world.js` (50 KB), the last big file now that `ai/` and `engine/` are split (2y+). Split
  in a PR of its own when no open lane touches it, proven by fingerprints and suites.

## The queue, in order

**Done:** every finished entry, 1 to 2w, with its PR, is in `docs/archive/progress-done.md`, "The queue, done".

**From the issues** (the owner, 2 November 2026): Ghost starving most (#325) is measured in the next AI entry, as its
trademark (distance) or a fault; in the same entry, apples by the edge rotting (#324): 80% of the apples that rot lie on
the edge row or one in, passed up by rivals whose room and margin weights count a safe edge cell against them, so it
tests a safe-meal exception like the one by the neck (`MEAL_DAWDLE`), measured both ways; the snake that starved 4 s after its warning (#327) was a snake of 4 in snow, warned on the hunger clock: fixed in the warning (PR #397).

### 2y++. The golden flight, followed up (the owner, 2 November 2026; #399 and #401; side lanes now, the last step after part 7)

2y left the flight even both ways (24.9% against 25.1% head to head; +0.10 ± 0.15 place a use): between rivals a
landing is almost never contestable. The flight stays as built for now, and no rule changes yet:
1. **The ring tinted by its taker** (#401; a side lane now, drawing only): when a snake's head is closing on another's
   ring and could get there in time, the ring is tinted briefly in that snake's colour, for everyone. `render/looks.js`
   is at the 50 KB mark, so its step 0 split comes first.
2. **The flight measured against fliers who fly like people** (a measurement, a side lane now): fliers who take off into
   contested rings, as people do, against the rivals who now take landings; per use and head to head.
3. **Measured again after 2u and part 7,** whose stamina and pricing change what a flight costs. Only if it is still
   even then does a bigger change go to the owner as a question: a longer flight, or the ring shown before take-off.

### 5 (part 5). Gold portals, unparked (the owner, 2 November 2026; an engine-rules entry, right after 2y)

The golden mushroom's wrap has no cost while the edges open for its holder alone, a small refuge from the edge; part 5's
gold portals are its counterweight (anyone may follow through for about a second), so #202 comes off the shelf right
after 2y (the owner: "Yes, expertly to all 3!"). Its spec and A/B are as entry 5 says.

### 2z. The golden apple's worth (the owner, 2 November 2026; a measurement, then an engine-rules entry if needed)

The only golden food without a power: +3, a race to it before it fades. A census on fresh seeds: how often it is
contested, and whether a snake that eats one places or wins better than one that does not. If it pays, it stays as it
is. If it does not: +3 and both rests refilled ("the apple of vigour"), measured both ways like any rule.

### 2u. One stamina for jump and dash (the owner, 2 November 2026; an engine-rules entry, after 2z and before part 7)

One bar for both plain powers, no tail cost, each power a third to two thirds of plain power uses and neither better in
aggregate, the pace kept: `docs/design/37-one-stamina.md`. Part 7's pricing then prices the one stamina.

### 2x. The spitter slides over its own mushroom (the owner, 2 November 2026; an engine-rules entry, after part 5)

Taken out of 3b+ and moved to the front, since it still bites (the owner: "Still get the bug with swallowing a mushroom over and over again after puking it up."): the spec is 3b+'s "The spitter slides over its own mushroom" in `docs/handoff/queue-specs.md`, entry 5.

### 5. Round six B: the new moves (DESIGN "Round six B")

The golden jump that flies, leap now, gold portals, dropped charges, the spit along the line and one pricing model for every power, each its own playable PR that the rivals use well. *Done:* parts 1, 2, 3 and 3b (PRs #158, #174, #183, #195). **Next, in order:** part 4 (draft PR #198, 2r folded in; the owner answered on 1 November 2026 that the moves stay as designed and the rivals are improved until their users come out ahead: the row is in `docs/archive/progress-done.md`, "For the owner, answered"), then 2x (above), then 2q (2s done, PR #289; part 4's both-ways test runs again on its log when part 4 goes on), part 3b+ (the spit flies along the line), part 5 (#202, gold portals), part 6 (built on `round6b/dropped-charges`) and part 7 (parked on `round6b/pricing`; it also fixes the trademark measures and lifts Joker into the band, see the spec); then the teaching system (item 4). Spec: `docs/handoff/queue-specs.md`, "5. Round six B: the new moves". **When part 4 merges:** run the census on seeds 3 and 11 again (`scripts/sim.sh 200 --seed 3 --census --check`): chased beetles must still get away a third to 45% of the time (2w measured it before the flight was in; `--check` fails a census outside that band).

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

Every rival's lines given a make-over by a Fable 5.1 session with creative control, outside what the owner protects: his own lines, the lines he likes, and the gags (Mason's bad Latin, "vidi vici veni"). After everything else, so it covers every line the queue adds. Spec: `docs/handoff/queue-specs.md`, "9. At the very end: the writing pass".

## Noted, not yet queued

Ideas are issues now (Feature requests, `enhancement`: "For the owner" above); the four noted here moved there on 2 November
2026 (#324 to #327).
