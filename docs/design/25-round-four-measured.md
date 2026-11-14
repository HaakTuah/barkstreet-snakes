## Round four, measured

AI-only rounds as `tools/simulate.js` plays them (`--census` prints most of this): 600 seeded rounds each on seeds 3 and 11, every cell "seed 3 / seed 11" unless it says otherwise. The builds:
- **final**: cb45603, after both of round four's critique rounds. The first gave:
  - a meal mid-round that keeps you 13 s;
  - the plain flash priced at two apples and a mushroom at three;
  - a jump pressed with a flash goes first;
  - flashes worked out together;
  - a power that can't go in a stun says so.

  The second gave:
  - a jump pressed with a flash also goes first when the hurdle is two or three cells ahead;
  - a meal just after 0:45 never shortens your time;
  - two flashes head-on meet;
  - a landing on a bridge whose owner crashes that tick holds;
  - Gobbler more careful near heads (headRisk 2200, zoneRisk 700) and twice as wary of mushrooms.

  Fingerprints 709828060 / 633168818, both `--check` ok. `simulate.js 60 --seed 3` gives 109438746 with and without `--ahead`.
- **first critique**: fed9bff, after the first critique round only (275874727 / 211829363). Numbers below marked "first critique" come from it.
- **merged**: the branch before the critique. From 234abd3 on, only drawing, input and docs changed, so e1afcb0 plays the same rounds. Fingerprints 716587532 / 346214756; `simulate.js 60 --seed 3` gives 153523588 with and without `--ahead`.
- **after balance**: the balance pass's final build, the same rules as merged but for the rivals telling the woodpecker's mark from a hole (165991245 / 15180574). Some numbers the census doesn't print; they come from this build, and say so.
- **before balance**: round four's rules and AI before the balance pass (2a8158c: two apples after 0:45, patches of 7 to 14, golden mushrooms 0.4; 288269477 / 789394841).

### The targets

Merged, all were met. Final, all but two: the win rates on single seeds (two personalities a point or two outside the band, each within its sampling error), and the plain flashes, which are fewer on purpose.

| Target | Before balance | Merged | Final |
|---|---|---|---|
| Median round (155–175 s) | 180 / 181 s | 169 / 171 s (middle half 160–178 / 162–180) | 170 / 171 s (middle half 159–179 / 162–179) |
| Rounds reaching the woodpecker (at least 90%) | 99.7 / 100% | 99 / 100% | 100 / 100% |
| Sudden death, median (35–60 s) | 60 / 61 s | 49 / 51 s (middle half 40–58 / 42–60) | 50 / 51 s (middle half 39–59 / 42–59) |
| Starving (at most 8% of deaths) | 6 / 8% | 2 / 1% | 3 / 2% |
| A starvation before 1:00 (under 5% of rounds) | 0.3 / 0.3% | 0.2 / 0.3% (after balance) | 1% / under 0.5% |
| Every personality's win rate (15–35%) | 18–31 / 18–32% | 18–33 / 16–33% | 15–**37** / **13**–32% (both seeds together: 16.5–34%) |
| Holes, share of sudden death's deaths (at most 25%) | 25 / 25% | 22 / 22% | 22 / 24% |
| Woodpecker aims near a head (rare) | 7 of 12,751 / 4 of 12,892 | 4 of 10,062 / 0 of 10,497 | 1 of 10,196 / 0 of 10,431 |
| Plain flashes a minute alive (about 3–5) | 2.94 / 2.92 | 3.1 / 3.1 | **2.1 / 2.1** |
| Golden jumps used (over 90%) | 99 / 99% | 99 / 99% | 99 / 99% |
| A storm in a round (at least 80%) | 87 / 87% | 87 / 89% | 89 / 84% |
| Snake-time in the hunger warning before 2:00 (at least 8%: the critique's) | | 3.0 / 3.2% (the critique's census of e1afcb0) | 8.5 / 8.7% |

- **Win rates.** Each personality plays about 140 rounds a seed here, so its rate wanders about 3.5 points either way from seed to seed.
  - **First critique:** Gobbler won 12% on seed 11 (17% on seed 3). The second critique made it more careful near heads (headRisk 2200, zoneRisk 700) and twice as wary of mushrooms; with no mushroom-lover left, it was eating as many as anyone, against its "hates mushrooms".
  - **Final:** Gobbler wins 20% on seed 3 and 13% on seed 11. Over 800 rounds with Gobbler in every one, the first critique measured 16.0% against 15.6% on e1afcb0, so seed 11 reads as a bad draw for it rather than a weak snake. Gobbler is still the personality to watch.
  - **Final, at the top:** Mute wins 37% on seed 3 and 31% on seed 11, 34% over both.
  - **Merged:** Desperado on seed 11 (16%) was closest to the edge, and Vulture was on top on both seeds (33%).
- **Plain flashes.** Below the balance pass's 3–5 a minute on purpose: at one apple a flash, rivals flashed 3.1 times a minute and did no better than never flashing, so the critique priced it at two (see Rivals).

### What a round holds

| | Merged | Final |
|---|---|---|
| Crashes survived a round | 10.6 / 10.2 | 10.2 / 10.4 |
| Draws, of 600 | 2 / 1 (no round stalls) | 0 / 1 (no round stalls) |
| Golden apples a round | 5.2 / 5.3 | 5.3 / 5.3 |
| Golden beetles a round (rounds with one) | 1.61 (86%) / 1.58 (83%) | 1.59 (82%) / 1.63 (84%) |
| Golden leaves a round (rounds with one) | 0.84 (57%) / 0.85 (61%) | 0.78 (54%) / 0.80 (57%) |
| Golden mushrooms a round (rounds with one) | 0.71 (61%) / 0.68 (59%) | 0.69 (60%) / 0.66 (57%) |
| Golden power food eaten, a snake a round (more than 2) | 0.73 (4%) / 0.72 (3%) | 0.71 (4%) / 0.72 (3%) |
| Mushrooms eaten a round (about 15 sprout) | 2.0 / 2.0 | 1.3 / 1.3 |
| Rotted a round: apples, beads | 7.0, 2.9 / 7.1, 3.0 | 6.3, 2.9 / 6.4, 2.9 |
| Beetles a round (caught) | 4.1 (90%) / 4.1 (90%) | 4.0 (91%) / 4.0 (93%) |
| Spells a round: sun, wind, rain, storm, snow | 0.80, 0.85, 1.31, 0.87, 0.78 / 0.80, 0.83, 1.30, 0.89, 0.80 | 0.83, 0.81, 1.31, 0.89, 0.78 / 0.80, 0.84, 1.29, 0.84, 0.82 |
| Lightning strikes a round | 4.0 / 4.1 | 4.0 / 3.8 |
| Woodpecker strikes a sudden death; holes at the end | 16.4; 233 / 17.1; 244 | 16.5; 235 / 16.9; 241 |
| Plain flashes a minute alive | 3.1 / 3.1 | 2.1 / 2.1 |
| Plain jumps a round; golden flashes a round (cutting someone) | 3.88; 1.50 (1.0) / 3.81; 1.51 (1.1) | 3.84; 1.37 (1.0) / 3.79; 1.45 (1.1) |
| Deaths, all: body, self, hole, edge, pecked, head-on, starved, cut | 42, 25, 19, 5, 4, 4, 2, 0% / 43, 25, 19, 5, 4, 3, 1, 1% | 45, 22, 17, 5, 4, 3, 3, 0% / 40, 23, 20, 6, 5, 4, 2, 0% |
| Sudden death's deaths: body, self, hole, edge, pecked, head-on, starved | 37, 27, 22, 5, 5, 3, 2% / 39, 27, 22, 5, 4, 2, 1% | 39, 24, 22, 6, 5, 3, 2% / 34, 25, 24, 6, 5, 3, 2% |
| Snake-time in the hunger warning (starving), before the woodpecker; after | | 8.5% (2.1%); 27.8% (14.6%) / 8.7% (2.2%); 27.8% (14.6%) |

From the after-balance build (seed 3 / seed 11), what the census doesn't print, not measured again since:
- the first death comes at a median 127 / 126 s (137 / 138 before balance); 0.5 deaths a round come before 2:00;
- the last apples: about 5 a round, the first at a median 126 s;
- a golden thing of some kind turns up in 98 / 99% of rounds;
- the first storm comes at a median 45 / 48 s, and every round sees a median four kinds of weather;
- lightning fires live a median 12.4 / 12.7 s (the longest 26 s): 29% burn themselves out, 63–65% are put out by rain or snow, and 6–9% are still burning at 2:00 or the end;
- 45% of strikes have a body across the patch;
- starving is 0.8% of snake-time before 2:00 and 12% after (1.2% and 17% before balance). Final, with a meal mid-round keeping you 13 s, the census gives 2.1 / 2.2% before the woodpecker and 14.6 / 14.6% after (above; counted its own way, so not quite comparable).

### Are the events' timings and chances right?

Most were. Three changed in the balance pass, and one after the critique:
- three apples all round (see Food);
- the woodpecker's patches start at 9 cells and grow to 16. Nearly every snake reaches 2:00 now, so sudden death had more to finish and ran a minute; now it's about 50 s;
- golden mushrooms in 55% of rain spells (from 40%), so every kind of golden power food turns up in most rounds;
- after the critique, a meal between 0:45 and the woodpecker keeps you 13 s (see Food), so hunger matters mid-round: 8.8 / 8.9% of snake-time in the warning before 2:00, from 3.0 / 3.2%, with the round as long as it was.

Tried and left as they were (300 seeded rounds each, against a median of 179 s with 59 s of sudden death):
- a hungrier woodpecker (each rest 0.8 of the last): no change;
- shorter shortest rests (8 ticks): 2 s shorter;
- a fifth of strikes under bodies: no clear change in hole deaths;
- more strikes widening old hollows: 4 s longer, more hole deaths;
- the last apples twice as often: no change; half as often: 4 s longer, with starving at 9% of deaths;
- beads lasting longer: no change;
- a dead snake leaving every segment: 4 s shorter, but the first big fight snowballs again (win rates 12–39%).

### Should a power be stronger or weaker?

No:
- **Flash rest:** at 8 s the rivals flash 2.7 times a minute instead of 3.1, and nothing else changes (the win spread widened to 9–41%); at 5 s, 3.3, and nothing else changes. (Measured with the flash priced at one apple; the critique found that price didn't pay, and at two apples rivals flash 2.1 times a minute: see Rivals.)
- **Jump rest:** 3 s or 6 s makes no measurable difference. The rivals jump about 4 times a round, nearly all out of a crash.
- **Golden jumps** are 99% used. **Golden flashes:** about 1.4–1.5 a round, cutting someone about once; nobody blows themselves up.
- **Desperate mode:** a rival turns desperate with 11 s of hunger left. At 6 s, a starvation before 1:00 comes back in 0.7% of rounds; at 16 s, nothing changes.

**Worth knowing:** the first death came at a median 2:07 after balance (the balance pass puts it at about 1:20 before round four); it hasn't been measured on the final build, where a meal mid-round keeps you 13 s. The flash, desperate mode and the fixed board split keep the rivals alive until the woodpecker comes.

### What the rules alone did

The engine's changes measured with the AI as it was before round four (eb58b62), 300 rounds a seed. This build still had two apples after 0:45, which alone made rounds about 5 s longer.

| | Before | After |
|---|---|---|
| Median round | 167 / 165 s | 177 / 182 s |
| Sudden death, median | 48 / 46 s | 57 / 62 s |
| Starving, share of snake-time in sudden death | 23 / 24% | 18 / 18% |
| Food a snake a round | 59 / 56 | 46 / 45 |
| Mean length at 2:00 | 41 / 40 | 32 / 32 |
| Golden power pickups a round | 1.7 / 1.6 | 2.6 / 2.8 |
| Rounds with a storm | 57 / 58% | 82 / 85% |
| Snow before 0:45, a round | 0.30 / 0.38 | 0 |
| Woodpecker cuts a round | 0.69 / 0.65 | 0 |
| Strikes a round, seed 3 (under a body) | 16.3 | 19.2 (6.2) |

The trickle of last apples is what keeps starving down: without it, starving was 41% of snake-time in sudden death.

### What the AI step did

Round four's rules with the AI from before round four (538a773's) against the AI as built (2a8158c), 600 rounds a seed:
- win rates 16–40% / 17–37% → 18–31% / 18–32%;
- starved, of all deaths: 14% → 6–8%; desperate mode is on for 1% of snake-time and halved starving deaths;
- plain flashes a minute: 0 → 2.9 (7% of them eat something, 2% crash that tick);
- jumps a minute: 0.37 → 0.60; golden jumps used: 48% → 99%;
- cuts a round by golden flashes: 0.82 → 1.05 (kills 0.015);
- mushrooms eaten a round: 6.2 → 1.6;
- own beads, of bead meals: 25–26% → 21%;
- blow-ups: none either way.

A/B tests, 1000 rounds each (mean place, ±0.025 a group, lower is better): the whole powers package against the same AI without powers 2.499 / 2.497 (neutral); flash against no flash 2.483 / 2.512 (within noise); weighing the flash only the way it crawls against every way 2.497 / 2.499; rivals' flashes at a quarter weight against half 2.498 / 2.498.

After the critique (its rules fix, seat-split A/B: half the seats never plain-flash): at one apple a plain flash came out about 0.03 of a place worse than never flashing, pooled over 3,400 rounds, with 13.6% of flashes followed by a crash or a death within 3 s (6.6% at any moment). At two apples, even (+0.031 and −0.023 on two seeds); head to head against the one-apple price, 0.02 of a place better over 2,000 rounds. A 1,000-round split varies by about 0.05 between seeds, so that last is a lean, not a proof.

### What it costs

- **The AI's decision** (`decide()`), against 538a773's AI on the same positions: 1.35–1.41 times the mean and 1.33–1.44 times the p99 (budget: p99 at most 1.7 times).
- **The AI's pacing:** the lead had packed every decision into the frame that ticked. Since the critique they're spread over the frames after it (see "Controls that keep up"): no decision in a tick frame; a frame's thinking and stepping at p95 / p99, 2.0 / 3.0 ms playing (from 2.7 / 4.0), 0.8 / 1.3 watching at 1× (from 1.4 / 2.1), 2.7 / 4.3 at 4× (from 3.4 / 5.0).
- **The land** (staged scenes, full cost to a readback, against the same board without land; budget 1.5 times): 1.28–1.40 times, against 2.26–2.62 for the force fields. In a real round, the one quiet run gave +1.1 to +1.3 ms a frame against the domes' +2.9 to +6.6, before the last two cost cuts; the merged build measured +3.6 ms under load (the domes +5.7 to +6.5 in the same conditions). The budget is +1.0 ms, so a quiet re-run is still owed. Canvases 5.2 MB (budget 8), against 23.9. Land is rebuilt about 50 times a round, median 0.1–0.3 ms, worst 0.7–4.0 ms. With the critique's keyline (two fill passes for a rival on the land; an ink ring outside it too took a third, and 1.6 times), interleaved on a heavily loaded machine: the land 1.50 times against 1.53 for the build before it, a rival on the land 1.47 against 1.38. That machine's absolute times were unusable, so the quiet re-run is owed for these too.
- **The pits:** a strike's frame costs 1.5–1.6 ms of script (1.1–1.2 before; a steady frame 0.9–1.2), and 1.9–2.0 ms of full cost more than a steady frame on a near-quiet machine (0.7–1.0 before; the woodpecker report asked for 2 ms or less). Painting a whole board of holes again costs 1.5–1.7 ms. A strike's box repaint matches a full repaint but for at most 896 pixels of about a million, each off by at most 8 levels.
- **Soot** (the critique): a cell that burns out paints its box again, about 0.2 ms of script a cell (a three-cell burn-out frame, about 0.6 ms more than a steady one). Against a full repaint, 59 burned cells and a strike: 0 pixels differ (the old scorch marks: 835, by up to 68 levels).
- **Telling powers apart:** frame cost within noise. The worst case, 4 snakes of 70 all holding golden jumps, golden flashes and the wrap, is 11.3 ms full both before and after (measured before the critique ringed the pips).

All on a shared, noisy machine (Iris Xe graphics, headless Chrome at 800×800, 2x); ratios between interleaved runs hold up better than absolute times.

### The controls

With real keys and touches on a virtual 60 Hz clock (`tools/input-test.js`; merged, all 25 checks passed; final, 30 checks, all pass):
- Every press reaches the engine within a tick plus a frame. Merged: turns, mean 66–72 ms from press to tick, at most 132 (the limit is 136.7); jumps, mean 52–82 ms, at most 123; flashes, mean 62–78 ms, at most 132. Final, one run: turns mean 69 ms, at most 126; jumps 68, at most 107; flashes 69, at most 126.
- Two presses in one tick turn on consecutive ticks, 20 times of 20.
- A tap jumps at its lift or 80 ms after touch-down, whichever comes first (merged). Final: held still, a touch jumps 80 ms after touch-down only with something to hop (with a hole ahead, 7 taps held 30–400 ms each jumped by 80 ms); with nothing to hop, at its lift. A quick tap that drifts 3–11 px as it lifts jumps (16 of 16); a thumb resting 90–200 ms before it swipes, or while the other swipes, never does.
- A swipe registers, at the median, after about 91 ms at 0.15 px/ms, 48 at 0.3, 27 at 0.6 and 18 at 1.2 (merged; final, one run: 90, 46, 29 and 21). A chained turn registers about 19 ms after the finger's corner at 0.6 px/ms (merged; final, 28).
- Swipes that jumped: 0 of 160 (8 speeds, 5 slants, 4 ways). Merged, the 32 at 40° never registered, by design; final, a stroke that goes on registers its main way, so none fail to (and a long stroke at 35° or 44° turns, 2 of 2 each). None went the wrong way.
- Final: a second swipe the way the last one turned you is that turn again at every gap tried up to 250 ms after its lift (the guard is 300), and a flash at 400; mashing jump over your death's card never plays again (9 taps landed on Play again; one after a pause started the countdown).

Drawn ahead, with real keys and a press at the first frame the head is drawn reaching the cell, plus 30 ms and a person's scatter (σ), 200 presses each:

| Ticks | σ | On time before | On time drawn half a tick ahead |
|---|---|---|---|
| 120 ms | 25 ms | 13% | 87.5% |
| 120 ms | 40 ms | 21% | 71.5% |
| 90 ms | 25 ms | 12.5% | 73% |
| 90 ms | 40 ms | 25.5% | 59.5% |

What's left is mostly late presses. The final build draws exactly this far ahead: half a tick, 60 ms at 120 ms ticks and 45 ms at full speed, so its on-time presses are these, 60–73% at full speed. The merged build drew 60 ms ahead at full speed too, more than half a tick, hoping to do as well there as at 120 ms ticks; but late in a tick your head was then drawn in the next cell while a press still turned it at this one, and was pulled back (22 of 160 random presses, as the critique measured), so the lead is at most half a tick again.

- Your face comes within 45° of the new way 53 ms after the press in swift play (180 before; p90 82 ms), 52 ms for a turn on its own (88 before).
- Rivals' guessed steps are wrong at the tick 3.6 times in 1000 moves (2.0 in a test with their plans made early, as the merged build makes them). No drawn head moves more than 0.39 of a cell in a frame, except a golden jump (0.57) and a flash, whose cells show at once.
- Flashes drawn ahead (the critique), measured on the final build while playing, on a virtual 60 Hz clock (an autopilot steering, E pressed at random moments, golden flashes handed out; two runs at 120 ms ticks and one at full speed, about 25,600 frames): at 120 ms ticks the rivals' flashes were shown before their tick 64 times of 66 and yours 115 of 142; at full speed 14 of 15 and 33 of 42. The rest were presses in a tick's last frame or two, or flashes that stopped short, and showed at their tick. No head slid back. `tools/render-test.js`: shown before the tick at 120 ms ticks, at full speed and golden, and gliding on after it at an even 0.14 of a cell a frame at 120 ms ticks (0.18 at full speed). Watching alone there's no lead, so in Watch AIs a flash shows at its tick, a cell on or two for a golden one (none of 75 before it). (The critique's own count, 87 of 88 before their tick in watched AI rounds, was made on its branch, when watching still drew ahead.)

### The rest

- **Online** (`tools/online-test.js`): merged, 20 rounds, about 30,500 ticks, the friend's board matching the host's on every tick; about 8,300 power presses and 1,000 plain flashes a run; the biggest message 10,495 bytes (PeerJS's limit is 16 KB). Final, one run: 20 rounds, 33,654 ticks and 538,484 checks, the friend's board and plans (33,654) matching the host's on every tick; 10,595 power presses and 1,365 plain flashes; the biggest message 10,495 bytes.
- **Chatter** (`tools/chatter-test.js`): 717 lines and 688 Chinese ones, 142 punchlines; final, 250 checks of the chatter and the sound playing (merged, 195 of the chatter). On a patched build before the merge, the rivals said as much as before (52.7 lines a round, from 52.6), the hungry lines giving way to desperate ones (1.8 a round, from 2.2, beside 2.2 desperate).
- **Sound** (rendered offline through the whole chain): the new cues sit with the old, peaks −20 to −29 dBFS; the border's crossing is about as loud as the hum it replaces, and a plain flash a little softer than a golden one. After the critique, a rival's cue never silences yours, and your own golden ones in a row are each heard: in a model of 100 seeded rounds (game time), none of yours was swallowed (flashes 0 of 781, jumps 0 of 161, golden flashes 0 of 26). Before, a rival's play could silence yours, and with that fixed, 6 of your 26 golden flashes were still swallowed by your own one before, until the gaps came down to 50 ms for a golden flash and 120 for a jump.

