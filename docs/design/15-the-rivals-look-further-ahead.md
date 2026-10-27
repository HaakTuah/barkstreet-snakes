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
