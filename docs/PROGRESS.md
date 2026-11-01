# Progress

What is done and what comes next, in order (how to work through it: `CLAUDE.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add Haakon's new tasks where he places them, with his words quoted.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

**Parked (1 November 2026, 17:40 UTC), waiting on Haakon's answer** (question 1 in the "For Haakon" table once 2s merges): Codex had no environment for this repository (taken back at once); the Opus escalation helper (extra-high effort) found no flaw that hides a gain. Under real rules no snake in 30 no-flight rounds died holding a golden jump (0 of 90 deaths), so the flight has nobody to save; amplified, 12 of 210, at most about +1–2 points of win% even if every one were saved. While holding a charge, fliers die 0.144 times a 1,000 ticks against 0.215, about half a point of win%. Fliers also spend their charges sooner and mostly when in no trouble (84% against 74%): 69 of 95 such flights beat a crawl by under half an apple, within the search's own error. Its one bug fix is in (`doomed` in the air: the charge is already spent, so `me.leaps > (air ? 0 : 1)`); its other idea, keeping the last golden jump for trouble, helps both sides alike and was left out. **Next, by Haakon's answer:** (a) merge the flight and leap now as they are (moves that pay for a person's timing; the rivals use them, no refuge); (b) the flight flies 2 cells a tick while held (it buys time), measured again; (c) more golden beetles. After 2s merges, `develop` goes into this branch and its protocol becomes 21.

**Pick up here (1 November 2026, 16:30 UTC, an Opus session):** the amplified-rules runs were redone with the re-planning AI (every beetle and leaf golden, both sides alike). **The flight, alone: even**, 24.9% with to 25.0% without (seeds 157/163; time alive 154/155 s, food 73.5/74.1, every cause of death the same), though a field of fliers there flies 17.5 golden flights a round, 7.7 past the plain hop, 7.9 turns in the air, 2% out within 3 s. **The golden flash, alone:** its users eat more (69.9 to 63.7), kill more (0.38 to 0.33) and starve less (2.1% to 3.5% of deaths), all decided; wins even (25.0/24.9, seeds 167/173), time alive 155/153 s (not decided). A probe (150 rounds, seed 5, amplified): of about 450 deaths only 17 came holding a golden jump, so the flight has nobody left to save. Reading: a flight moves a cell a tick, as a crawl, so it buys no time; it only crosses a gap of 4 or 5 cells, and that seldom decides a round. Escalated to Codex on #198 (1 November, 16:30). (The before-replanning amplified run, seeds 127/131, came out 24.3% to 25.6%, as the note below says.) Then the Opus escalation helper; then the question for Haakon, #198 parked.

**Pick up here (1 November 2026, 14:30 UTC, the second account's main lane at its limit again; an Opus session carries on):** on `round6b/golden-flight` (#198, `develop` merged in at 14:15, pushed, tree clean, last commit `224bc6f`). *Built since the note below:* **the rivals plan their golden flight again every move they are up** (`ai.js`: `decide` in air mode runs `powerPick`/`leapOpt` from the air cell over the cells it can still fly, any landing or a turn, even a second turn; `engine.js`: `aiView` gives `me.flight` (dir, flown) while held, the flight block calls `decide` for a rival each move it is up and reads `memory.fly`/`memory.flyTurn`, counted from take-off, as a let-go or a turn). Rules suite green (a new test: a rival up on a flight comes down short of a body it sees once up; it failed with the engine that flew the take-off plan only); the full suite, run beside three simulations (the layout suite took 38 minutes): types, scope, rules, render, input, layout, chatter, records, online and sw green, the ui suite 4 checks red on the phone start card (390 and 320: "a tap on the card closes it, and doesn't wake", "its × closes it"; `game/round.js`/`game/hud.js`, 2u's, not this branch's hunks): rerun it idle to tell load from a fault, and if it still fails, check whether `develop` fails too; its seed-3 census (fingerprint 262796843): 3.31 golden flights a round, 3.14 cells in the air each (3.83 at take-off planning), 1.55 turns in the air a round (1.95), flights past the plain hop 1.53 a round (2.42), 2% out within 3 s of one, down on a body 0.14 a round (as before): the replanning comes down sooner and turns less, so check that the in-air weighing isn't favouring the next cell (k = 0) too readily before trusting it. *Measured before the replanning* (today's rules, 1,200 paired rounds each): flight alone even (24.8% with to 25.1% without, seeds 103/107), leap now alone even (25.0 to 24.9, seeds 109/113). *Running at the stop, their rounds in the A/B's cache so rerunning is nearly free:* under amplified rules (every beetle and leaf golden: `GOLD_BEETLE_CHANCE` 0.8, `LEAF_CHANCE` 1.0, both sides alike, copies of `tuning.js`/`engine.js` with the AI before the replanning, commit `18f365e`): fliers against the same AI with flights past the hop and turned flights removed (`k <= first`, `if (false)` for the turns), seeds 127/131, **finished: fliers 24.3% to non-fliers 25.6%** (interval −2.2 to +4.9; time alive 154 s to 155 s; died of a body 31.3% to 29.8%; golden leaps 4.33 a snake to 4.07), so with golden jumps plentiful the take-off-planned flight still doesn't pay: the rivals fly it badly (landing among bodies), which the replanning is the first answer to and must be measured the same way; then golden-dash users against a copy that never flashes while holding dashes (`if (false)` on the dash line, `me.dashes === 0 &&` on the plain one), seeds 137/139, stopped at look 4 of 6 by the session's time limit (its rounds cached); then the same no-dash copy under today's rules against the new AI, seeds 149/151, stopped at look 4 too. *Next:* read those; a fresh amplified run of the replanning AI against its own no-flight copy; if fliers lead, the real-rules check and the merge without leap now (take leap now out: the engine's second press, the input, the 'now' flag in the protocol, the lesson, the Field guide row, the README line) and leap now's question to Haakon; if not, teach the remaining uses (coming down in a rival's path to cut it off; crossing to food is weighed already) and measure again; then the design's "Part 4, the chosen numbers", the review, the merge.

**Pick up here (31 October 2026, the second account's main lane, at its usage limit):** part 4 (#198, `round6b/golden-flight`, `develop` merged in, pushed) is still parked. Leap now was reworked twice and measured head to head against the copy without the moves: try one (only out of trouble: a crash within the search, a neck a rival could shut, or a head-on) 24.1% with the moves to 25.7% without on seeds 83/89; try two (only out of a crash or a head-on, at the jump's price; the branch's last AI commit) 24.1% to 25.8% on seeds 97/101, the users eating a little less and dying of bodies a little more with only 0.57 jumps a snake more. That points at the flight rather than leap now, so two separating head-to-heads were started (in `tools/abtest.js`'s cache if they finished: the branch against a copy with only the flights past the plain hop and the turned flights removed, seeds 103/107; against a copy with only leap now removed, seeds 109/113; the exact commands and copies are in #198's body). **Both finished, both even:** without the flights 24.8% with to 25.1% without (seeds 103/107; interval −2.8 to +3.5; jumps, food, deaths the same); without leap now 25.0% to 24.9% (seeds 109/113; −3.8 to +3.4; 0.53 jumps a snake more, food and deaths within noise). So neither move costs or gains anything 1,200 paired rounds can see (about ±3.5 points), and the earlier gaps were noise. **Next:** the escalation helper's brief (drafted: the problem, both tries, the four tables) or, more likely, the question for Haakon as a design finding, fix whichever move loses (a first lead from a 60-round count: snakes come down on a body after plain hops and leaps now mostly, flights rarely), the escalation helper if both stay even, then the question for Haakon ("Does leap now matter between rivals?"); then the design's chosen numbers, the review, the merge.

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
- **Done in the lane's entries:** the README for players (PR #241) and any key wakes from a nap (PR #271): their words are in `docs/archive/progress-done.md`, "The polish lane, done".
- **Next, the woodpecker bigger on a phone** (Haakon, 31 October 2026, with a desktop screenshot beside it: "And also, I really think the woodpecker needs to be even bigger on the phone than what it is now. Look on the PC, it looks proper threatning. Phone, not so much."): on a
  phone, upright and on its side, it is drawn bigger than 2k's 1.7 times, so it looks as threatening there as it does
  beside the board on a desktop; the desktop is unchanged. Pictures first, at 390×844 and 780×320, perched and striking,
  at three sizes side by side on `pr-media`, and Haakon picks before it merges, as with Wildcard's hair (2n). A bigger
  bird may cover more of the row and the chatter under the board (his answer on the help line), never a card (PR #243),
  and never the board's play for longer than a strike does now. Presentation only: the fingerprints unchanged. **Answered** (Haakon, 1 November 2026, to #270's two questions): size B, 1.6 times (212 px upright, 172 px sideways, the same size beside the board both ways); and sideways it perches at that full size, partly off-screen, its head, beak and eye in the gap beside the board and inside the safe area, its back and tail cut off by the screen edge, so it is the same size perched and striking and never covers the board while it perches ("Seems better than making it super small and have it swell up whenever it attacks", then "Yes.").
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

*Done in the lane:* each fix's line is in `docs/archive/progress-done.md`, "The polish lane, done".

- The room card on a phone (PR #256): its seats as names in a row, as the start card's, each rival's "unless a friend joins" left to the card's own words; it fits a 320 px phone upright (it ran 117 px under its buttons), and on a 568x320 one sideways it scrolls 84 px, not 234.

- The friends card's Join on a small phone on its side (PR #272): at 568x320 it ran 15 px off the card's edge; its row is a little tighter there.

## The split lane (the workshop check's files over about 50 KB)

- *Done:* `audio.js` and `chatter/zh.js` split (PRs #225, #226): `docs/archive/progress-done.md`, "The split lane, done".
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

