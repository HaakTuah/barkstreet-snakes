# Progress

What is done and what comes next, in order (how to work through it: `CLAUDE.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add Haakon's new tasks where he places them, with his words quoted.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

**Resumed 31 October 2026 on a second account**, spent to the end before Monday. The main lane took up part 4 (#198,
2r folded in), making leap now and the flight pay the rivals; 2s now runs before 2q, then 3b+, parts 5 to 7. Merged
since: 2n (the original hair, lick reversed, #208), 2u (#221), the Voices icon (#224), live with milestone #227; then 2v
(#223). Open lanes: the audio and Chinese splits (#225, #226), the polish fixes and the improvement audit (#220). The
older state notes are in `docs/archive/plan-history.md`.

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
  branches", and the older ones went by the "Delete merged branches" button in Actions (31 October 2026). Then archive leftovers nobody uses.
- **The README, done** (PR #241; Haakon, 31 October 2026: "Yes, expertly to both!"): `README.md` is for players, up to
  the game as it plays now; the developer part is in `docs/developing.md`. From here every entry keeps it current ("A
  change a player sees updates the README" in `CLAUDE.md`); 2v adds the update between rounds when it merges.
- **Next, any key wakes from a nap** (Haakon, 31 October 2026: "Space should also pause and unpause on Barkstreet Snakes." Told that Space is the jump: "Ahh, true! yeah, really any button should unpause, no?" Then, to the design session's shape of it: "Yes, please! Expertly!"): as the Pause row of "Voice and copy" (`docs/design/09-voice-and-copy.md`) now says. Any playing key, or a tap on the board on touch, wakes; the waking press never fires a power (a steering key wakes and steers, as it always has: "A power only when you ask"); G, H, M, N, V and the speed keys keep their jobs; the card says "Any key to wake up" / "Tap to wake up"; the help line, the Field guide and the README to match. Online: a nap is local only as now. A rules or input test both ways: Space wakes without a jump, G opens the Field guide and the game stays napping.
- **Next, the woodpecker bigger on a phone** (Haakon, 31 October 2026, with a desktop screenshot beside it: "And also, I really think the woodpecker needs to be even bigger on the phone than what it is now. Look on the PC, it looks proper threatning. Phone, not so much."): on a
  phone, upright and on its side, it is drawn bigger than 2k's 1.7 times, so it looks as threatening there as it does
  beside the board on a desktop; the desktop is unchanged. Pictures first, at 390×844 and 780×320, perched and striking,
  at three sizes side by side on `pr-media`, and Haakon picks before it merges, as with Wildcard's hair (2n). A bigger
  bird may cover more of the row and the chatter under the board (his answer on the help line), never a card (PR #243),
  and never the board's play for longer than a strike does now. Presentation only: the fingerprints unchanged.
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
- Your lesson fades once you're out (PR #231): "Crashes cost tail. You're at 3…" and the hunger warning no longer stay up after you're out.
- The Hall of Fame's "Clear everything" (PR #230): shown only once something is kept (a row, a round in your story, a Best).
- "AIs" read as "Als" in the round font (PR #229): "Watch AIs" is "Watch rivals" (start and round-over cards), and the lobby says "Empty seats go to rivals" and "A rival, unless a friend joins".
- The start card's tip says what both taps do (PR #242): "Tap names to swap, tags to see how they play." (it named only the tags, right under the names that swap).
- The Field guide's Beetles row split in two (PR #244): Beetles, and Burrows after it, the same words (it was eleven lines on a phone).
- A start card whose names wrap fits a small board (PR #234): at 320 px upright or 568 px sideways its tip goes, then its lines sit closer, so the buttons never cover a name.
- Score and Best step aside under a banner above the board, on a phone held upright (PR #232; the audit's first find).
- The woodpecker flies under a card that's up, no longer across its title (PR #243; the audit's third find).
- *Left as it is, by Haakon's answer:* the woodpecker over the help line between rounds (the audit's second find; PR #240 closed). On a 390 px phone it may cover part of the help line or the chatter's words; nothing essential is hidden, it moves often and taps pass through it ("Clear of the row's words (2k+)" in `docs/design/32-the-owners-playtest.md`). Not to be raised again.
- *Not reproduced:* bubbles overlapping at 4× (the audit's fourth find). In 8 watched phone rounds and 3 desktop rounds at 4×, the longest overlap was 0.4 s on the phone and 0.19 s on desktop, only while bubbles glide to a new side. Dropping the older bubble after 0.25 s of overlap made no measurable difference, so nothing was merged.
- *Measured, nothing to fix:* sound piling up while watching (PR #248, `tools/dev/sound-levels.js`). At 4× the round asks for about 10 cues a second and the gaps let 4.5 through, at most 5 in any 250 ms; rivals' chomps 2 a second, the babble one every 4 s at most. Same shape at 1× and 2×, halved. The chatter's words were scanned too: no typos, apostrophes consistent.
- *As designed:* the empty chatter-log line (the audit's sixth find): it's a new line's 0.4 s slide-in (`log-in`) caught mid-fade. Over 3 watched rounds on a phone on its side, 23 of 621 visible-row samples caught one, and none stayed empty. No fix.
- The tail-drop lesson only in a real pocket, not when you've coiled with room to crawl out after your tail (PR #246; the audit's fifth find).

- The friends card's Join on a small phone on its side (PR #NN): at 568x320 it ran 15 px off the card's edge; its row is a little tighter there.

## The split lane (the workshop check's files over about 50 KB)

- `audio.js` became `audio/` (PR #225): `cues.js` and `sound.js`, sound proven unchanged by `tools/dev/same-sound.js`.
  `chatter/zh.js` became `zh.js` and `zh-more.js` (PR #226), checked by `tools/dev/same-zh.js`.
- **Waiting for the main lane** (PR #198 and its parked #202 have them open): `ai.js` (139 KB), `engine.js` (128 KB) and
  `render/world.js` (51 KB). Split each in a PR of its own once the main lane merges, proven by fingerprints and suites.

## The queue, in order

**Done** (each in `docs/archive/progress-done.md`): 1 and 1b (cheaper development and previews (PRs #39, #41), the big files split (PRs #43, #45, #46)); 1b+ (Wildcard's hair, again (PR #107)); 1b+++ (Wildcard's hair, Trump's (PR #110)); 1b++ (the phone's bottom (PR #112)); 1c (the big test files split (PRs #95, #96, #97, #100, #102, #103, #104)); 2 (types for the multiplayer messages (PR #48)); 2c (the woodpecker, 1.3 times (PR #139)); 2d (rivals' chomps (PR #150)); 2e (the woodpecker pecks beside a snake, not on it (PR #141)); 2f (Wildcard's hair, lacquered (PR #144, version F)); 2f+ (Wildcard's hair, a size smaller (PR #156, `WILD_SIZE` 0.85)); 2g (the meal goes down (PR #146)); 2j (babble voices for the rivals' bubbles, never distracting (PR #162; on by default, the Voices switch under the board between rounds, V at any time)); 2k (the woodpecker, as big as it gets, 1.7 times (PR #170)); 2k+ (the woodpecker perches clear of the buttons' words, at 1.7 times (PR #191)); 2l (flags that bend as a snake goes over them (PR #186)); 2m (beetles and the woodpecker (PR #199: burrows keep up, beetles flee the beak, the bird eats one still under it)); 2o (a squashed bead leaves a splat (PR #210)); 2p (flags in depth, hit head-on, and bent by their owners (PR #211)); 2t (Capricious without its ring, and a costume change for every change (PR #212)); 2u (picked rivals for this visit; unmet rivals back into the deck (PR #221)); 2v (the newest version, by itself between rounds (PR #223)).

### 5. Round six B: the new moves (DESIGN "Round six B"); next AI entry, right after Copycat's part of 3b

The golden jump that flies, leap now, gold portals, dropped charges, the spit along the line and one pricing model for every power, each its own playable PR that the rivals use well. *Done:* parts 1, 2, 3 and 3b (PRs #158, #174, #183, #195). **Next, in order:** part 4 (draft PR #198, 2r folded in: its A/B comes out even, so it waits until the rivals use the moves well: the flight and leap now measured apart, the rivals taught the flight's uses, the golden flash measured on its own in the same pass, and the flight merged without leap now if only the flight pays; Haakon, 31 October 2026), then 2s and 2q (2s first: Haakon, 31 October 2026, "Agreed to all, expertly!"), part 3b+ (the spit flies along the line), part 5 (#202, gold portals), part 6 (built on `round6b/dropped-charges`) and part 7 (parked on `round6b/pricing`; it also fixes the trademark measures and lifts Joker into the band, see the spec); then the teaching system (item 4). Spec: `docs/handoff/queue-specs.md`, "5. Round six B: the new moves".

### 2s. A piece cut loose falls: the log stays one piece (30 October 2026, rewritten 31 October 2026; an engine-rules entry, after part 4; ahead of 2q)

No more islands (Haakon, 31 October 2026: "Yes, I think that's it. can still be jumpable gaps, but we want to avoid the islands stuff. it becomes too much rng, and isn't very exciting."): any piece of log no longer attached to the log falls away, warned, so the log is always one piece with holes in it, and jumps and flights cross the gaps inside it. Replaces "every island stays a hop from another". Spec: `docs/handoff/queue-specs.md`, "2s. A piece cut loose falls".

### 2w. Beetles get away at least a third of the time (Haakon, 31 October 2026; an engine-rules entry, after part 4)

The escape band moves from 20–35% to at least a third (33–45%): measured on `develop` once part 4's flight is in, and the beetles' side tuned if it falls short, never the rivals made worse. Spec: `docs/handoff/queue-specs.md`, "2w. Beetles get away at least a third of the time".

### 2r. No hop onto a doomed island (30 October 2026; part of item 5's part 4)

Before a hop or a flight a rival weighs where it lands, above all whether it can jump off again; built into part 4 (#198). Spec: `docs/handoff/queue-specs.md`, "2r. No hop onto a doomed island".

### 2q. Rivals notice like people (30 October 2026; an AI entry, after 2s)

Every rival sees another snake as late as a person would notice it: `REACTION_MS` near its own head, growing to about 400 ms across the board, measured with `tools/abtest.js`. Spec: `docs/handoff/queue-specs.md`, "2q. Rivals notice like people".

### 2b. Hunger's worth at a contested apple, for every rival (Haakon, 29 October 2026; an AI entry)

A contested apple is worth what it saves: a starving rival contests it because it is worth more; Gobbler contests even when fed; Desperado is less risk-averse everywhere. Spec: `docs/handoff/queue-specs.md`, "2b. Hunger's worth at a contested apple, for every rival".

### 2h. The endgame: eat what keeps you alive, not what boxes you in (Haakon, 29 October 2026; an AI entry, after 2b)

Grown on 31 October 2026: the tail drop planned ahead, a length target (a crash and hunger buffer, no more), and the denial play where it pays; the reasoning now, its numbers again after entry 6.

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

- **Its pace and fairness, and hunger in the endgame** (Haakon, 31 October 2026: "Sounds good! though I think it should take fewer chunks at once as a rule, because the map shrinks really quickly now! and i also think when there is just a little bit of space, it should slow down again, so it isn't and rng competition where it is who's island it pecks at next that decides it, capiche? Whats your take?" Then, to the design session's take: "Yes, to everything, expertly! and i also want hunger to be a factor! right now, food and beads jjust become a negative at the end. if we manage to balance this right, we can make it a trade-off, just like we tried with everything else, like mushrooms. that's a sign of good game design, conditional goods. thomas sowell in game mechanics."). These come before the draft's numbers and win where they differ:
  - **Like the final Bowser, as a woodpecker** (Haakon, 31 October 2026: "Bowser 2 in Super Mario 64 is what I always compare my imagined woodpecker to, and it doesn't break down the map until there is no space.", then "sorry! final bowser!"; to the design session's take: "Yes, though I don't know about in a few big moments, I think perhaps I like what we've planned already better. Fits a woodpecker. but what if it takes few chunks at once, but it is cutting out a shape, and when that shape is no longer attached to anyhting, it falls? I really like your idea about a floor, and how it continues to peck which you must avoid, without taking out much anymore. maybe just a tile here and there in the late late game. what do you think, expert?"; then "Yes, I think that's it. can still be jumpable gaps, but we want to avoid the islands stuff. it becomes too much rng, and isn't very exciting."). It cuts shapes, never melts the log:
    - **A few cells a peck, along an outline.** Its pecks trace a dotted cut across the log, so everyone can watch the outline close round a piece; when the last peck cuts it loose, the piece falls away (2s's rule). The gaze in act 1 says where it will start cutting. The last peck is warned like any strike, and a snake still on the piece falls with it ("Down the hole!"), unless it crawled or jumped off in time; it never cuts loose a piece a snake couldn't leave in the warning's time ("The woodpecker plays fair"). The draft's combos give way to the outline. **It aims small, nothing is banned** (Haakon, 31 October 2026: "No outline should be banned from falling, but ideally, it never takes out half the trunk."): it plans its outlines round edges and corners, pieces small next to the log (about a sixth at most, a first guess), and never plans a cut that halves the trunk; but no size is banned from falling, so a piece that ends up cut loose falls, whatever its size, by 2s's rule. Measured: the biggest piece that fell in a round.
    - **A floor.** It cuts shapes only while the log is bigger than the room the snakes left need to play (about twice their length together, a first guess, set by simulation). At the floor it stops cutting.
    - **Then it fights.** At the floor it keeps pecking at the snakes, aimed and warned (its rings), so they must dodge; a peck that catches a snake is a crash, never instant death, and never unavoidable ("No refuges" both ways). It takes only a tile here and there in the very late game.
    - **It cuts where there is the most log per snake,** never at random, so whose piece goes next never decides a round. Measured: how often a round is decided by where it cut, with the draft's "the biggest island not deciding the round".
  - **Hunger stays a factor to the end: food a conditional good.** Today food and beads only hurt at the end, since length fills the room. Balanced so a meal is a real trade-off there too, as the mushrooms are: life bought against room cost, each winning sometimes. The hunger clock is tuned with the bird's pace for it. Measured by three versions of the rivals head to head in the endgame: ones that always eat, ones that never eat, and 2h's weighing. Neither always nor never may win; the weighing must, and both starving and boxed-in deaths must show among the endgame's causes.

- Also: an A/B test of food knocked aside against food falling into the hole, with a `?food=fall` knob for the owner's playtests.
- If the knock stays, it gets bark chips spraying out and a little bounce where it lands.
- Ghost's memorial: the planned smoke wisp, or the owner's idea of a broken shackle with a few chain links. Ghost's tongue stays smoke.
- The earlier "the bird eats the food" variant for that A/B is in `tools/dev/r6-study-tools/patch-flex3.js` (PECK_FOOD).

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

### 8. Near the end: beetles who meet, fight (Haakon, 29 October 2026; an engine-rules entry, last but the writing pass)

Two beetles that meet fight a shoving match, and a snake that gets there in time can catch them while they do; last of the rules, before the writing pass. Spec: `docs/handoff/queue-specs.md`, "8. Near the end: beetles who meet, fight".

### 9. At the very end: the writing pass (Haakon, 31 October 2026; Fable 5.1, after everything else, entry 8 included)

Every rival's lines given a make-over by a Fable 5.1 session with creative control, outside what Haakon protects: his own lines, the lines he likes, and the gags (Mason's bad Latin, "vidi vici veni"). After everything else, so it covers every line the queue adds. Spec: `docs/handoff/queue-specs.md`, "9. At the very end: the writing pass".

## Noted, not yet queued

- **Apples by the edge rot** (found in PR #142's census, `tools/dev/rotten-apples.js`): 80% of the apples that rot lie
  on the edge row or one in, passed up by rivals whose heads came within 2. The room and margin weights likely count an
  edge cell against a move even when the apple is safe; an AI entry could test a safe-meal exception like the one for
  meals by the neck (`MEAL_DAWDLE`).

- **The improvement audit (31 October 2026, PR #220)**: its three questions are answered (Haakon, 31 October: "Agreed to
  all, expertly!"; `docs/handoff/queue-specs.md`, part 7 and 2s; the rows are in `docs/archive/progress-done.md`), and
  the whole list, with how to see each and where in the code, is in that PR. For the AI and engine lanes: Ghost starves
  most (11% of its rounds on seed 3, the band's worst; it keeps its distance from food's company too); on seed 11 the
  edge-huggers (4% of snakes) won 43% against 24%, on seed 3 27% against 25%, so the edge's shelter stays on part 7's
  watch list; the rivals' bubbles overlap each other at 4× for a second or so, 29 times in three watched rounds (the
  chatter's, not a rule); once, on a phone, a snake of about 15 steered by Ouroboros's AI starved 4 s after its hunger
  warning (a tick-by-tick probe over three more rounds saw only the slow shrink, so unexplained: likely its own tail
  dropped out of its coil with the hunger clock at zero, which the AI's trap test doesn't weigh); a person's exploits
  need a person: nothing in the AI-only censuses shows one.

Small things found on the way, for Haakon to place in the queue:
- (None now.)

