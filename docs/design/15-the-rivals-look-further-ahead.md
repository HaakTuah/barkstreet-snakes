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

