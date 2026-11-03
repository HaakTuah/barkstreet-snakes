# The rivals, as it was decided: the round files' text

The rivals' sections as the round files and the owner's playtest had them, word for word, with their superseded
versions and measurements. "The rivals look further ahead" was a file of its own, so its headings sit a level lower here.
The current rules are in `docs/design/39-the-rivals.md`.

## From the round's arc (`12-the-rounds-arc.md`)

**A cornered AI makes the sensible last move.** When every move looks fatal, a wall, a hole or its own body is certain death, but a rival's cell may already be free (it sees rivals as they were a moment ago), so it bets on the cell that frees up soonest. It used to pick at random, and those were the deaths that looked dumbest: self-bites fell from 15% to 8% of AI deaths and wall crashes from 7% to 2%. Two heads that swap cells now count as a head-on, as they look.

## From the rivals look further ahead (`15-the-rivals-look-further-ahead.md`)

### The rivals look further ahead

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

#### Hunters close easy pins (the owner's playtest, 27 October 2026)

The owner (26 October 2026): "it seems they try to box you, but often don't on really easy opportunities where they got you squeezed against the wall."

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

**The shared cause with "Rivals read heads better":** both come from fear read off the board as it is now, not off the line being played. Here, it was a gap a sealed-off rival "could" shut. There, it is `headRisk` beside every rival head, including cells the rival can't or wouldn't enter, and cells the snake will have left before the rival could get there. `lineOn` and `lineFill` give that task what it needs: a rival's timed reach on the line's own board. The cell beside a pinned rival's head is the same overlap, and it's left to that task.

#### Rivals read heads better (the owner's playtest, 27 October 2026)

The owner (27 October 2026): "it seems to me the rival snakes might be a bit too adverse to have their heads next to each other, even if the other snake can't cut you off, or if the would see and have time to react ahead of time." And: "they seemingly always chicken out when competiting with you for resources."

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

#### Nerve at a contested apple (28 October 2026)

The owner (28 October 2026), answering PR #83's question: "gobbler and Desperados should take the gamble more, that fits their playstyle, no?"

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

## From round four (`24-round-four-the-owners-feedback-and-the-calls.md`)

### Rivals

- **Mushrooms.** Desperado and Joker still valued mushrooms at +0.5, left over from before mushrooms became pure poison. They ate about 8 a round and won 11%. Gone: nobody seeks mushrooms now, and to every rival a mushroom only ever counts against a move. *Measured*, rivals ate 6.2 a round before and 2.0 after, out of about 15 that sprout: the ones still eaten were in the way when every other move scored worse. After the critique, a mushroom costs a rival three apples (the three segments it takes), fed or hungry; it was priced at one. Rivals eat about 1.3 a round now (1.30 / 1.33 in the final census, from 1.99 / 1.96), Gobbler, which hates them, half as readily again. Nearly all of those are boxed in or stepping round a trap, every other way scoring far worse.
- **A starving rival takes its chances.** When the hunger it can see (its own clock, as a person sees their bar) leaves it less than about 11 s of life (`AI_DESPERATE_MS`), a rival:
  - drops its personality's errands (home, mimicry, coiling, lures);
  - goes for any food, even food a rival might reach first (never its own beads, which aren't a meal);
  - takes more risk near heads;
  - may jump or flash for food (every power costs it half while it's desperate);
  - with no food in reach, hunts, to make someone crash and drop beads.

  It's the same rule for every snake. *Measured*, it's on for about 1% of snake-time and halved starving deaths. At 6 s a starvation before 1:00 came back in 0.7% of rounds; at 16 s nothing changed.
- **Rivals use their powers, when it pays.** Each power is weighed as a move in the rival's own search, less a price in apples, and pressed only when it beats crawling:
  - *Flashes:* about 2 a minute (*measured*, 2.1), when a flash looks two apples better than crawling, or one to win a race for food (food a rival could reach as soon as it would crawl there, but not as soon as it flashes) or to get out of a crash. Weighed the way the rival would crawl anyway (any way, out of a crash). Weighing every way cost 1.65 times the decision's mean time (1.88 times its p99, over the 1.7 budget) and did no better. *Changed after the critique:* priced at one apple, rivals flashed 3.1 times a minute and did no better than the same rivals never flashing (a seat-split A/B, half the seats never plain-flashing: about 0.03 of a place worse, pooled over 3,400 rounds). At two they do no worse than never flashing, and head to head against the one-apple price they did 0.02 of a place better over 2,000 rounds; a 1,000-round split varies by about 0.05 between seeds, so that's a lean, not a proof.
  - *Jumps:* to escape, and to reach food (landing on it or one cell short, priced at 1.5 apples). About 4 plain jumps a round, nearly all out of a crash.
  - *Golden jumps:* 99% used, instead of 48% (priced at a third of an apple).
  - *Golden flashes:* kept for cuts (0.6 of an apple), for something golden, or for a way out. About 1.4–1.5 a round, cutting someone about once; nobody blows themselves up.
  - Every rival allows for any other flashing 2 cells straight ahead (at half weight).

  *Tried and lost (measured, A/B):* jumping for position, pressing a jump in advance "just in case", and pricing powers under about one apple. Using powers more doesn't win by itself: the whole package measured neutral against the same AI without powers (mean place 2.499 against 2.497 over 1000 rounds). After the critique, also tried for the plain flash: one apple (3 a minute, a little worse than never flashing), three (1.6 a minute, even), never ending a flash within 3 or 4 cells of a head (worse), and every cell of a flash paying its risk (no better).
- **Fixed: the board split.** Since the first pass, rivals never got any territory in the AI's board split (a time-base bug), so aggression and contested food did nothing. Mason, Mute, Gobbler and Vulture were partly missing their characters. It's fixed, and a few personalities were retuned for it: Gobbler counts a rival's apple in full (it really does eat one now) and wants more room; Mason and Mute claim a little less territory; Ghost keeps a cell less distance; Vulture wants a little less room. The rest already sat in the 15–35% band (Sniper's aggression stayed 0.3: at 0.5 it fell to 19%), and the balance pass changed no personality. The trappers (Mute, Mason, Sniper) got the thicker walls promised for them, as a weight for their own body beside their head (dropped when desperate): the share of Mason's body lying beside another stretch of itself went from 14% to 21%, Mute's and Sniper's from 27% to about 30%.

## From round six B (`29-round-six-b-the-new-moves.md`)

**Mason builds double walls.** A plain flash cuts a wall one thick, so Mason, who lives by straight walls ("Keep watch!"), lays them two thick where it can, running back alongside. Its straight runs are measured before and after.

## From the owner's playtest (`32-the-owners-playtest.md`)

### A meal isn't a pin

**The cause** was the neck test's allowance for a head pinned against something (`PINNED_DAWDLE`, 8: see "The rivals look further ahead"), not Ouroboros. Every rival did it, and beside holes, fire, the woodpecker's mark and bodies as well as the edge.
- The rivals look three moves ahead. Eating food on the edge from two away, every line that eats ends with the head still on the edge: one or two ways on, and no room before them. That's a neck right by the head, and it was a trap if any rival could get to both ways on within 8 ticks of the snake (about any rival within a dozen cells, on a 24-cell log). A trap costs 2,400–3,400; the meal was worth 150–500 to Ouroboros (850–2,500 to Gobbler).
- So every line that ate lost to one that stayed a row in, and the snake turned off a cell or two short. A move later the food was out of its three-move window, the food's pull brought it back, and it turned off again: the circling.
- In the AI's own terms, at the turn-aways with room to spare and no head within 6 cells: the pin decided 64% of them at the edge and 57% in corners (none in the open); Ouroboros's coiling, 3%.
- The allowance's reason ("I don't always leave a pocket straight away") doesn't hold just after a meal: the line is there only because the food was, and it leaves on its next move.

**The call:** for 3 moves after a line eats (`MEAL_PLIES`), a neck's allowance is 2 ticks (`MEAL_DAWDLE`): only a head that could get to the gap about as soon as the snake (one that could cut it off) makes it a trap. Everywhere else the neck test is as it was. A jump or a flash that eats on its way counts as a meal too. It's a dozen lines, with no wider search and nothing more to think about.
- *Turned down:* only the pinned neck (corners stay shy: the deeper necks there are its own body); a lower `PINNED_DAWDLE` everywhere (it's the boxed-in dial, and not about food); searching on past a meal (a sixth more lines to score, and a bias toward lines that eat); leaving food cells out of the neck test (it would drop the real refusals too).
- *The screenshot's apple:* dimmed, with something above it and no glow, it reads as a rotten green apple and its fly (a golden apple only dims in its last 3 s, its glow and sparkle with it). It changes nothing: a rotten apple is worth its full 1 to a rival, a dim golden one its 3, until it would be gone before the rival got there. A golden apple at (2, 1) by the corner isn't a pin by itself; refusing it took a body beside it (Ouroboros's own coil) or a rival within a dozen ticks, which is what this fixes.

**Measured** (600 AI-only rounds a seed, seeds 3 and 11, "before → after", as `tools/simulate.js` plays them; food eaten counts every time a snake that's the nearest head, with a way there, comes within 2 cells of it):

| | Seed 3 | Seed 11 |
|---|---|---|
| Apples and golden apples eaten: in the open | 89 → 89% | 88 → 89% |
| ...on the edge | 50 → 79% | 50 → 79% |
| ...in a corner | 66 → 82% | 64 → 82% |
| ...beside a hole, fire or the woodpecker's mark | 58 → 71% | 56 → 71% |
| ...beside another snake's body | 57 → 73% | 57 → 73% |
| ...beside its own body | 66 → 74% | 65 → 73% |
| Golden apples eaten on the edge | 61 → 90% | 60 → 89% |
| Each rival on the edge (lowest–highest; Ouroboros) | 39–60 → 64–86% (47 → 78) | 40–60 → 66–87% (49 → 79) |
| Turned off food by the edge with room to spare and no head within 6, per 100 snake-rounds | 157 → 34 | 155 → 34 |
| Circling (3 or more turn-offs from the same food), by the edge or in a corner, per 100 snake-rounds | 45 → 10 | 47 → 11 |
| Hanging about food (within 5 cells for 3 s), per 100 snake-rounds: all; apples; golden | 12.0 → 6.7; 4.3 → 0.8; 0.4 → 0 | 12.2 → 6.6; 4.1 → 0.4; 0.1 → 0 |
| Median round; sudden death | 172 → 165 s; 52 → 45 s | 172 → 166 s; 52 → 46 s |
| Deaths in holes; starved | 20 → 14%; 2 → 1% | 20 → 17%; 3 → 1% |
| Deaths before the woodpecker, a round | 0.57 → 0.69 | 0.48 → 0.70 |
| Win rates | 19–34 → 18–35% | 17–33 → 16–33% |
| Ouroboros coiled (field) | 42 → 38% (14 → 13) | 42 → 39% (15 → 13) |

- **The rest of it:** what's left of the hanging about is beetles, and some of that is the fix's own. The strictest count, within 3 cells for 3 s, was already mostly beetles, and beetles went up: 0.8 → 1.5 / 1.1 → 1.8 per 100 snake-rounds (0.8 → 2.2 on a fresh seed, 41), apples and golden apples 0 → 0.1 / 0 → 0. Nine in ten are a beetle on the edge or in a corner with a well-fed snake a cell or two off, shadowing it along the edge: the fix makes a line that catches a beetle there worth taking, and the beetle moves on first. About half end in a catch (beetles caught: 92 → 94%); those that don't went 9 → 15 / 17 → 22 in 600 rounds. Round six's rivals (feature/powers-2), who see food where it is now (these see it a reaction time late), hang about no beetle at all (seed 3), with the fix or without. If this ships first, the shadowing comes with it; a beetle-only exception in the neck test was turned down. The edge's share of the meals against its share of the food's time on the log: 0.44 → 0.59 / 0.45 → 0.60 (1 is "eaten as often as it lies there"). Every rival is in it: the lowest on the edge, Vulture (it lives on beads), went 39 → 70 / 40 → 66%.
- **The cost:** rounds a little shorter, and more snakes out early, most of them into themselves. In 600 paired rounds on a fresh seed (41, each round dealt the same both ways): the median round 171 → 166 s (−5 s, between −8.6 and −1.8), sudden death 51 → 46 s. Deaths before the woodpecker (above; 0.50 → 0.66 on seed 41): self-crashes 1.5 to 2 times as many, 0.085 → 0.127 / 0.083 → 0.145 a round (0.057 → 0.115 on seed 41), and crashes into others 0.40 → 0.49 / 0.33 → 0.48 (0.36 → 0.47). It isn't the meals by the edge themselves: per meal, deaths within 15 ticks of one don't rise (seed 41: by the edge 7.0 → 5.1 a thousand meals, in a corner 15.4 → 4.7), and most of the extra self-crashes come 16 ticks or more after the snake's last meal. It's length: snakes eat more (54 / 55 → 59.5 food a snake-round) and are 10–15% longer from a minute in (seed 41: 22.8 → 25.2 cells at 60 s, 30.1 → 34.6 at 90; 27.9 → 33.3 at an early death). `MEAL_DAWDLE` isn't the dial for that: at 4 the diagnosis measured the edge at 71% and corners at 78%, still with 0.60 early deaths a round, and the pinned neck alone 0.64, against 0.48 (seed 11). If the old pace is wanted back, growth or food is what to tune, not the neck test.
- **Mason** gained most: its walls run along the edges, and now it eats there (30 / 36%, from 22 / 27). It claims a little less territory, 1.6 from 1.8 (as in round four, when the board split started counting): 25 / 25%, its straight runs as they were (3.53 / 3.48 cells, against the field's 1.90). That moves every round Mason's in, and Copycat, who copies whoever's winning, came out at 35.2% on seed 3, one win over the band's top (43 of 122; 28% before Mason's change, and on seed 11 it went the other way, 26 → 21%): luck, not a lean. 1.7 was tried and put Gobbler at 12% on seed 11.
- **Character:** every trademark is about where it was. Ouroboros coils a little less (above), still three times the field; Joker's luring, the thinnest lead, is 8.6 / 8.3% against the field's 8.3 / 8.1 (9.2 / 9.0 against 8.5 / 8.3 before).
- `simulate.js 60 --seed 3` gives 829665990 with and without `--ahead`; fingerprints 574216369 / 762530038.

**Tests:** `tools/rules-test.js` stages it in the game, every rival hungry enough that taste doesn't decide (4 s before it starts shrinking) and another snake about ten ticks off: every rival takes an apple on the edge, a golden apple in the corner (along either edge), the golden apple by the corner from the screenshot, and an apple beside woodpecker holes, fire or another snake's body, within a few ticks (on main every rival left the edge's and the corner's, 11 the holes' and the fire's, 7 the body's; the screenshot's own spot was taken); and every rival still refuses an apple in a pocket of holes too small for it, in a channel a cell wide with a rival's head at its far end, on the edge with a rival's head two along the edge coming at it, and a golden apple in the corner with a head coming up the other edge.

**With round six A** (merged in after it shipped): round six A carried this fix onto its own AI (981842d: the same `MEAL_DAWDLE` and `MEAL_PLIES`, a jump's or a flash's meal counting too) with these tests, adapted to its rivals, and measured its rivals with it in (see "Round six A, measured"). So `ai.js` and `tools/rules-test.js` are round six A's: Mason's `territory` stays 1.8 there (its band was measured that way; the 1.6 above was this build's call, on the rivals before round six A), and the numbers and fingerprints above are this build's, before the merge. After it, `simulate.js 60 --seed 3` gives 78597151 with and without `--ahead`, as round six A does: the rest of this work is the page's, not the rules'.

### The rival line-up

Who you meet is dealt from a deck, and you may choose instead, seat by seat.

- *Before:* three rivals drawn uniformly from the eighteen each round, with no memory, so a favourite could go a dozen
  rounds unseen and another come three times running.
- *The deck* (`records.js`, `deal()`, under the new key `snake-deck`): this browser keeps a shuffled deck of the
  eighteen and deals from it, every rival once before any comes round again, across rounds and reloads. When it runs
  out, a fresh shuffle goes in behind whatever it still holds. Watching (four rivals) deals the same way. The
  simulator and tools keep the engine's own uniform pick (`pickOpponents`), so fingerprints are unchanged.
- *Choosing* (`game/cards.js`, `openPicker()`; the seats in `game/cards.js`, `buildOpponents()`): on the start card
  each rival is a button with a swap mark; it opens a picker of "Any" and all eighteen, each with its dot and blurb,
  over the page like the Hall of Fame (Escape or × closes it). A chosen seat wears a ring, and on the start card a
  small pin beside it: a tap on the pin sets the seat back to "Any" (`unpinSeat()`). The choice is kept per seat for
  this visit (2u, 30 October 2026: "Didn't expect them to stay permanently"), round after round and across a reload in
  the same tab, in `sessionStorage` under `snake-visit-lineup` (`seats()`, `setSeat()`); the next time the game is
  opened every seat is "Any" again. The old lasting key `snake-lineup` is no longer read (and never renamed). "Any" seats are
  dealt from the deck, which skips the chosen rivals (they stay in it for later). Choosing a rival already in another
  seat swaps the two. Watching from the start card keeps its three and deals the fourth.
- *Online* the host's choice and deck decide. A guest's own choice and deck are untouched. With more people, fewer
  seats are dealt: the first seats' choices count.
  - *In the lobby* (`game/friends.js`, `hostLineUp()`, `renderPlayers()`): the empty seats show the rivals who'll take
    them, "unless a friend joins". The room opens with the start card's line-up (and what the deck dealt for it); after
    each round the next is dealt, shown on the round's card. The host's seats are the start card's buttons, opening the
    same picker (a chosen one wears its ring); the guests see each seat's rival, and "chosen", as it stands. A seat a
    friend takes sends its rival back to the top of the deck, as does closing the room. Closing the page (a start
    card's or the room's rivals never met) sends them back to a random place among the rivals not yet dealt
    (`undeal(..., { anywhere: true })`), so opening the game gives a fresh cast and everyone is still met first.
  - Protocol 13: the lobby message carries the line-up (`lineup`: each seat's rival and whether the host chose it),
    sent whenever it changes; the round message carries the round's as before.
- *The Hall of Fame:* every entry of a round with any chosen rival (yours, the rivals', a friend's) is marked "chosen"
  after its name. Protocol 12 carries the round's `chosen` flag and a shared best round's.
