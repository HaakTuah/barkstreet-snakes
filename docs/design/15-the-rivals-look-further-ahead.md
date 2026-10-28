## The rivals look further ahead

**What was asked:** rivals that get boxed in less, by planning better, not by reacting faster (they still see the board a quarter of a second late, like you), not by all playing the same way, and not at a cost that hurts the frame rate. Over 600 seeded rounds, 88% of all deaths were snakes boxed in.

**How it was chosen.** Four ways of looking ahead were each built and tuned in isolation, all measured the same way (deaths over 400 seeded rounds, win rates over 600, step time interleaved with the old AI in one process), and then judged against each other:
- *worst-case room*: race every rival for the room round each position the search reaches (78% boxed in, 1.4–1.6× the cost);
- *a deeper, narrower look* at the move it likes best, up to 8 moves on (77%, the most code);
- *the rival's best reply*: assume the nearest rivals do their worst next (83%; the fewest bumps, but the least gain);
- *pockets, necks and the tail* (70%, the cheapest, and the smallest change). This one won.

**What it does.** Once a decision, a reach map: the soonest any rival could be in each cell, spreading from where it was last seen (once any stun is over). Then, at the end of every line the search looks at:
- **the tail test**: if I can get onto my own trail (a cell my body leaves before I get there), I can chase my tail round and round, so I'm not trapped however little room there is;
- **the neck test**: if the room I need is only through a gap one or two cells wide, and a rival could get to that gap no more than `DAWDLE` (8) ticks after me (a snake doesn't leave a pocket straight away), the room beyond doesn't count, and the line pays nearly as much as a sure trap. **Nine times in ten the gap is right beside the head**: pinned against the edge or a body with one or two ways on that a rival could come round to. That case has its own allowance, `PINNED_DAWDLE` (8), and it's the dial between fewer boxed-in deaths and longer rounds (the judge's runs: 8 → 67% boxed in, median 159 s; off → 82%, 124 s). (Since the owner's playtest, not just after a meal: see "A meal isn't a pin".)

**A bug fixed on the way.** The hunters' squeeze (Sniper, Sovereign, Colonist, Mute, Joker, Metagamer, and Wildcard and Capricious when they hunt) counted every empty cell as their own body two moves or more ahead, so it was always 0: the hunters never actually closed in. They do now. (Another one found, and left for its own round: the board split never lets rivals spread, so "aggression" is a constant and Gobbler's and Vulture's contested food never applies; fixing it moves win rates a lot and needs every personality retuned. Fixed in round four: see "Rivals" there.)

**Nobody's picky in sudden death.** Once the woodpecker's here nothing new grows (since round four, but for the last apples, one at a time), so the "fed" state switches off for everyone and every snake eats what it can (so did the "mushroom lover" one, until round four did away with it: nobody seeks mushrooms now). Ghost, which stays small on purpose, was starving after the woodpecker in 140 of its 182 deaths, at its smallest; it still keeps small, but not starvation-small (it eats up to 14, and wants mushrooms past 18, from 10 and 12). Over three seeds Ghost went from about 11% to 13%.

**And the gaps from the new rules** (in the same round): a rival seen stunned can't strike until its stun's over (its stars show), so its head isn't feared meanwhile; a rival just met head-on gets twice the berth for about 3 s; baked food is worth what it's worth, a golden beetle half again for its leaps, and an apple that'll have rotted before it gets there isn't chased.

**Over 600 seeded rounds, against the same seeds before** (the final code, after the review fixes below):

| | Before | After |
|---|---|---|
| Deaths: boxed in | 88% | 66% |
| Deaths: starved | 8% | 24% |
| Median round | 101 s (middle half 74–135) | 166 s (137–194) |
| Rounds reaching the woodpecker | 34% | 88% |
| Crashes survived a round | 4.7 | 9.0 |
| Head-on loops a round | 0.34 | 0.20 |
| Win rates | 15–38% | 13–34% (another seed: 9–35) |
| Step time (interleaved, mean / p95 / p99) | 0.77 / 1.26 / 1.44 ms | 0.96 / 1.55 / 3.27 ms (1.25× / 1.23× / 2.3×) |

The trade-off every approach ran into: a snake that dodges traps lives into sudden death, and then mostly starves, so rounds run longer and most reach the woodpecker (you said you hadn't seen an AI-only round get there any more; now most do). Boxed-in deaths before the woodpecker roughly halved. The slowest steps (p99) cost 2.3× what they did, because longer rounds grow longer snakes; 3.3 ms is still well inside a frame, and the AI thinks between ticks. The personalities moved: the hunters gained (Metagamer 34%, Sniper and Colonist 33%), Ouroboros came down from the top (38% to 32%), and Ghost (13%; 9% on another seed) and Desperado (15%; it likes to skim walls and heads, which the neck test discourages) are at the bottom. Ghost is the one to watch: it's built to stay small, and length is armour now.


### Hunters close easy pins (the owner's playtest, 27 October 2026)

Haakon (26 October 2026): "it seems they try to box you, but often don't on really easy opportunities where they got you squeezed against the wall."

**The cause** was the neck test again, in two ways. A hunter has to go to the edge to close a pin, and then every line ends with its head against the edge or its own body, with one or two ways on: a neck right by the head.
- The test asked whether a rival could get to that gap, reading `reach`, which is worked out once on the board as it is now. The rival being pinned could get there on that board: along the edge, through the cell the hunter's line had just moved into. So the very snake it was sealing in looked as if it could come round through its body and shut it in. On a staged pin (a rival heading along the top edge with its only way on straight ahead, the hunter running along the row below, 2 to 5 cells ahead), no hunter closed it, on any edge, at any reaction delay: 0 of 48 tries each, for Sniper, Mute, Sovereign, Colonist, Metagamer and Joker.
- With that fixed, any third rival within about a dozen cells still made the closing line a trap, through `PINNED_DAWDLE` (8: "I don't always leave a pocket straight away"). That allowance is the boxed-in dial and stays.

**The calls:**
- **The neck test reads the rivals on the line's own board.** Where `reach` says a rival could shut a gap, the AI looks again with a timed flood fill from every rival (`lineFill`, from where it was last seen, from when it moves again) on the board as the line leaves it: the cells the line moved into are the snake's from when its head got there to when its tail leaves (`lineOn`). It's done only when `reach` says there's a threat, once per scored line. It makes the AI about 10% slower a decision (0.36 to 0.40 ms in `tools/bench-ai.js` on seed 3; a tick is about 110 ms). The first cut, with a fill for each neck, was 15–20% slower.
- **A pin I close isn't a pin on me,** as with a meal ("A meal isn't a pin" in `32-the-owners-playtest.md`). On a line that seals in the rival it's hunting (its timed room on that line is less than its length, where it had that room before), the hunter is against the edge only because the pin was there, and it leaves on its next move. So only a rival that could get to the gap about as soon as the hunter makes it a trap (`MEAL_DAWDLE`). Like the meal rule, this holds for a gap any rival could shut. The deaths by cause below say it costs the hunters nothing.
- Unchanged: the risk beside a rival's head. A hunter still won't close where the pinned snake, as last seen, could flash or dash into the same cell (a head-on), so it closes a cell later. The weights and reaction times are as they were. The rivals see nobody differently, so they close pins on a person exactly as on a rival.

**Measured** (`tools/dev/easy-pins/census.js`, 200 AI-only rounds, seed 5). A pin is a move after which a rival against the edge, near the snake's head, has 3 cells left at most, where another move would leave it room, and the snake still has room itself.
- An easy pin came up about once a round. Runs of ticks with a pin open fell from 116 to 92 (pins are closed sooner).
- Missed pins fell from 35 to 14: 70% of them closed before, 85% after.
- At a hunter's own victim, 65% were closed before and 75% after.

Old against new AI with `tools/abtest.js` on fresh seeds:
- **Head to head** (seeds 53, 67, 71, 89; 2,400 paired rounds):
  - win% a snake 23.9 → 26.0 (+2.1, interval [−0.6, +4.7]);
  - food a snake 54.9 → 56.0 and kills 0.34 → 0.40 (both higher);
  - time alive the same.
  - No persona's win rate moved beyond noise; Sniper's −3.3 is within [−13, +6].
  - Every trademark is the same or a little stronger: Mason's body beside itself +1.6 points, Desperado's skims +1.1.
  - Deaths by cause were all the same within ±3 points, except crashes into bodies (−2.5, still open).
- **Feel** (seeds 53, 67; 1,200 paired rounds, each AI in a field of its own kind):
  - median round 166 → 164 s ([−3.5, +0.3]);
  - sudden death 46 → 44 s (same);
  - head-on deaths 3.7% → 2.7% (same).
  - Every other cause of death and starving moved by less than 1.6 points.

**The shared cause with "Rivals too shy of heads":** both come from fear read off the board as it is now, not off the line being played. Here, it was a gap a sealed-off rival "could" shut. There, it is `headRisk` beside every rival head, including cells the rival can't or wouldn't enter, and cells the snake will have left before the rival could get there. `lineOn` and `lineFill` give that task what it needs: a rival's timed reach on the line's own board. The cell beside a pinned rival's head is the same overlap, and it's left to that task.

### Rivals read heads better (the owner's playtest, 27 October 2026)

Haakon (27 October 2026): "it seems to me the rival snakes might be a bit too adverse to have their heads next to each other, even if the other snake can't cut you off, or if the would see and have time to react ahead of time." And: "they seemingly always chicken out when competiting with you for resources."

**Measured first** (`tools/dev/shy-heads/census.js`: at every decision the same view also goes to a copy of the AI with no fear of heads; where their first moves differ, the snake swerved, and since a rival's next move was decided on a view at least a tick old, whether the fearless move would have met a head is known exactly):
- About 8 swerves per 1,000 decisions. 99% of them avoided a cell that was safe on the next tick; of the swerves that gave up an apple, a rival ate it 55% of the time.
- 56% of all swerves were from a rival's **flash** cells, two straight ahead of its head. Without food on its line, about 1 in 4,300 of those would have been a head-on. The cells right beside a head were really dangerous: about 8% to the side, 15–20% straight ahead, 11–17% beside an apple.
- A copy with no head fear at all comes out even with the real AI in wins and food, head to head. But every way of fearing the cells beside a head less (half for a side cell, which a snake turns into about a quarter of the time; half for a rival no longer than me; half only when I go straight on; half for the cut-in risk) raised head-on crashes by 10–30% (1.93 a round before; 2.1–2.6). Those cells are dangerous enough that a discount trades swerves for crashes, so none of them went in.
- A staged board can mislead. A rival seen level with me is read as `age` cells (two or three) ahead by now, so swerving from its side is right; with the rival placed where it really is, all 18 personas already go on.

**The calls:**
- **A rival's flash I fear only when it has a reason to flash.** A plain flash costs its rest: a snake spends one racing for food on its line, not to cross a cell it can't crawl to. So its flash cells count as before (half a head's risk) only with food straight ahead of it within the flash's reach and one cell more, or when it holds a golden leap or dash, or faces something it could hop. A rule test: a rival heading up at my lane, two cells below it by now, its flash the only way into my next cell: 16 or 17 of 18 personas cross in front of it to the apple (none did). The same rival with a golden dash, or with an apple on its line, still turns nearly every one away.
- **Only cells it can step into:** not back into its neck, a hole or a body still there.
- **Fear by when I'd get there.** A cell beside a rival's head is a head-on on my first move, and, for the next `age` moves, its body if it went there (I can't see that yet). After that, I'd see where it went in time to turn, so it counts nothing. (The search is three moves deep, so this changes little.)
- Unchanged: each persona's `headRisk`, the zone fear, twice the berth after a head-on, reaction times. The rivals see nobody differently.

**Measured, old against new** (fresh seeds):
- Swerves 8.0 → 2.9 per 1,000 decisions (−64%; 100 rounds, seed 5). Apples given up in a swerve: 1,357 → 658. The swerves left are the ones that matter: the cell avoided was really hit 7% of the time, against 1.5% before.
- Head-on crashes a round (300 rounds a seed): 1.93 → 2.21, 2.13 → 2.06, 2.08 → 2.10 (seeds 211, 307, 401). Over all three, 2.05 → 2.12: within noise.
- **Head to head** (seeds 127 and 131, 2,400 paired rounds):
  - win% a snake 25.2 → 24.8 ([−4.3, +3.4]); food 54.5 → 55.0; time alive the same;
  - head-on deaths 2.0% → 1.5% (the same);
  - no persona's win rate moved beyond noise;
  - powers used the same, Star's flashes and jumps the same;
  - every trademark the same, Mason's straight runs a little longer (3.52 → 3.59).
- **Feel** (the same seeds, each AI in a field of its own kind): the median round 165 s both; sudden death 44.8 s both; head-on deaths 2.55% → 2.58%; every other cause and starving within noise.
- Decision speed the same (`tools/bench-ai.js`, seed 3: 1.00×).
- Easy pins (`tools/dev/easy-pins/census.js`, 100 rounds, seed 5): chances taken 70% → 87%, and pins closed in the end 84% → 91%. That was the overlap #81 left: a pinned snake's flash is now feared only with food on its line.

**Left as it is:** right at a contested apple the rivals still back off when the other head is next to it. That fear is earned (about 1 in 8 of those cells would be a crash, which costs about what the apple is worth). How much a rival risks there is its persona's nerve, not a misreading.

### Nerve at a contested apple (28 October 2026)

Haakon (28 October 2026), answering PR #83's question: "gobbler and Desperados should take the gamble more, that fits their playstyle, no?"

**Measured first** (`tools/dev/nerve/census.js`; a staged duel in `tools/rules-test.js`):
- An apple a step from me and a step from a rival's head as I read it now (seen `age` ticks ago, gone straight on since): no persona went for it.
- With the head-on fear (`strikes`) gone, still none did. The fear that holds them back there is the zone fear (`risk`: where the rival may be by now), read at the same cell.
- So a nerve over the head-on fear alone changed nothing measurable.

**The call:**
- **A persona's nerve:** `nerve: { base, hungry }`, the share of a rival's threat set aside at a cell with food on it.
  - It covers both the head-on fear and the zone fear, as they are read for that cell in the search. The maps themselves are not changed, so every other cell, and the risk where a power lands, reads as before.
  - `hungry` adds that much more for every share of the hunger clock (`HUNGER_MS`) gone since the last meal.
  - The nerve is never more than 0.85: the odds still count, even starving.
- **Desperado:** 0.7, always. In the staged duel it takes the apple at every hunger.
- **Gobbler:** 0.3, plus 0.7 of its hunger. Its head-on fear is the highest of all, so it takes the gamble only once it's hungry: with 4 s left, not with 8.
- **Everyone else:** no nerve, the hunters included. Capricious borrows Gobbler's or Desperado's whole weights with its mood, nerve and all.

**Measured, old against new** (fresh seeds):
- **Contested apples** (the census, seeds 601 to 604, 400 rounds):
  - Desperado won 18% of them (29 of 163) before and 25% (39 of 156) after, with 4 head-ons against 5.
  - Gobbler won 17% before and after (78 of 450, 76 of 435), with 2 head-ons against 4. It is rarely hungry enough for its nerve to tip the choice.
  - Everyone else is unchanged.
- **Head to head** (seeds 911 to 914, 2,400 paired rounds):
  - win% a snake 24.8 → 25.0; food 55.2 both; head-on deaths 2.05% → 1.93%.
  - Desperado 23.8 → 24.0%; Gobbler 15.3 → 17.7% (within noise).
  - Every trademark the same: Desperado's skims 41.3 → 41.2%, Gobbler's food share 27.0% both.
- **Feel** (seeds 921 to 924, 1,200 rounds, each AI in a field of its own kind): the median round 164 s both; head-on deaths 2.69% → 2.44%; every cause, sudden death and starving within noise.
- Personas without a nerve play exactly as before: with the nerve weights taken out, the fingerprint is develop's.
- The cap at 0.85 came after these runs (from the review). It changes only a Gobbler with under 4.3 s of its hunger clock left.
