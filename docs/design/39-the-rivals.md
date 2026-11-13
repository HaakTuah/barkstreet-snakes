## The rivals

Three rivals play every round with you (four when you watch), dealt from a cast of eighteen. Each is the same AI with
its own weights and, for some, a driver that runs once a decision. The rules as the rivals' look ahead, round four,
round five, round six A and B and the owner's playtest settled them (their text, with what was tried and measured, is
in `docs/archive/design-rivals.md`). Elsewhere: what they do with food and beetles (`04-food-and-the-world.md`, from
"Rivals see food as it is"), with the woodpecker ("The rivals tell a mark from a hole" in `38-the-woodpecker.md`),
with fire, head-ons and their own beads (`41-crashes.md`), with each move (`40-powers-and-moves.md`); the power styles'
measure ("Balance targets", below); their looks (`03-the-snake-as-a-character.md`); their
lines (`09-voice-and-copy.md`, and the chatter, with Star's voice, in `13-lines-and-announcements.md`); Capricious,
Copycat and Wildcard (`35-capricious-copycat-and-wildcard.md`); Sovereign's realm and Colonist's flags, and a pecked
flag (`44-realms-and-colonies.md`); the tools that time and measure them
(`28-the-rivals-think-faster-round-six-as-optimization.md`); and how each round measured them ("Round four, measured"
in `25-round-four-measured.md`, "Round five, measured" in `26-round-five-star.md`, "Round six A, measured" in
`27-round-six-a-fairness-and-fixes.md`).

### What a rival sees

- **A person's reaction time.** A rival sees the holes, fire and the woodpecker's mark as they were `REACTION_MS`
  (240, about a quarter of a second, and never less than a tick) ago, and another snake as late as a person would
  notice it (2q): `REACTION_MS` near its own head, growing with the steps to that snake's nearest cell to
  `REACTION_FAR_MS` (400) at `REACTION_FAR_CELLS` (24) or more, give or take up to `REACTION_JITTER_MS` (50), drifting
  from moment to moment (`REACTION_DRIFT_TICKS`), and near it averages `REACTION_MS` as the ticks fall. What it sees
  of a snake never goes back in time, even when its own head jumps (over a wrapped edge, in a flight): it remembers
  the moment it last saw each. It reckons where a snake seen later has got to as for any snake, from its look then;
  its turns since, it doesn't see. The variation is drawn from the tick and the two snakes' ids, so every copy of the
  game, online too, sees the same. It knows its own body, hunger and powers exactly, and sees food, burrows, the
  weather and the woodpecker's strike and promised landings as they are now ("Rivals see food as it is" in
  `04-food-and-the-world.md`). All of it comes through `aiView()` (`engine/view.js`).
- **Nobody is singled out.** A rival is never told which snake is a person: every snake is an id and a body, and it reads
  a person by what they do, as any snake ("Rules that stand" in `AGENTS.md`). So the food it is shown has no colour on a
  dropped tail (a person chooses the colour of theirs; the pellet is known by its owner, a snake's id), and nothing in
  its timing differs: the rules suite (`tools/rules/31-never-know-a-person.js`) plays a board with a seat first a rival's,
  then a person's, and every rival is shown the same, chooses the same and decides on the same ticks.
- **What shows, it reads:** a snake's stun (its stars), the golden leaps and dashes it holds, its wrap, the ring of a
  flight coming down, a mushroom in its cheek. Nobody's rests are told.

### The rivals look further ahead

Rivals get boxed in less by planning better, not by reacting faster, not by all playing the same way, and not at a cost
to the frame rate.
- **The search** tries every line of moves 3 deep (`depth`), and scores where each ends with a timed flood fill (do I
  still have room?), the board split (see "The board split") and the food it can reach before anyone else.
- **A reach map,** once a decision: the soonest any rival could be in each cell, spreading from where it was last seen
  (once any stun is over).
- **The tail test:** if I can get onto my own trail (a cell my body leaves before I get there), I can chase my tail round
  and round, so I'm not trapped however little room there is.
- **The neck test:** if the room I need is only through a gap one or two cells wide, and a rival could get to that gap
  no more than `DAWDLE` (8) ticks after me (a snake doesn't leave a pocket straight away), the room beyond doesn't count,
  and the line pays nearly as much as a sure trap. Nine times in ten the gap is right beside the head: pinned against
  the edge or a body with one or two ways on that a rival could come round to. That case has its own allowance,
  `PINNED_DAWDLE` (8), the dial between fewer boxed-in deaths and longer rounds. After a meal, see "A meal isn't a pin".
- **The hunters close in:** the hunters' squeeze (Sniper, Sovereign, Colonist, Mute, Joker, Metagamer, and Wildcard and
  Capricious when they hunt) shrinks its victim's room.

### A meal isn't a pin

A line against the edge, a hole or a body only because the food was there leaves on its next move. So for 3 moves after
a line eats (`MEAL_PLIES`), a neck's allowance is 2 ticks (`MEAL_DAWDLE`): only a head that could get to the gap about as
soon as the snake (one that could cut it off) makes it a trap. A jump or a flash that eats on its way counts as a meal
too. Everywhere else the neck test is as above.

Apples by the edge rot six times as often as the rest (#324, measured in entry 2b), though only about 2% of apples
rot at all. What turns rivals from an apple on the edge row, fed and with no rival near, is territory: from the edge,
more of the board is nearer a rival's head. Two exceptions for a line that has just eaten were measured: wanting no
room to spare beyond its length left about a sixth fewer apples to rot with nothing lost, but no staged board showed
it deciding a move, so it was left out; a floor under territory made every rival contest apples more, and was dropped.

### Hunters close easy pins

- **The neck test reads the rivals on the line's own board.** Where `reach` says a rival could shut a gap, the AI looks
  again with a timed flood fill from every rival (`lineFill`, from where it was last seen, from when it moves again) on
  the board as the line leaves it: the cells the line moved into are the snake's from when its head got there to when
  its tail leaves (`lineOn`). It's done only when `reach` says there's a threat, once per scored line. So the snake a
  hunter is sealing in no longer looks as if it could come round through the hunter's body and shut it in.
- **A pin I close isn't a pin on me,** as with a meal. On a line that seals in the rival it's hunting (its timed room on
  that line is less than its length, where it had that room before), the hunter is against the edge only because the
  pin was there, and it leaves on its next move. So only a rival that could get to the gap about as soon as the hunter
  makes it a trap (`MEAL_DAWDLE`), for a gap any rival could shut.
- **The risk beside a rival's head stays:** a hunter won't close where the pinned snake, as last seen, could flash or
  dash into the same cell (a head-on), so it closes a cell later. The rivals see nobody differently, so they close pins
  on a person exactly as on a rival.

### Rivals read heads better

Every persona fears the cells a rival could strike next (`headRisk`) and where it may be by now (`zoneRisk`), read so:
- **A rival's flash I fear only when it has a reason to flash.** A plain flash costs stamina: a snake spends one racing
  for food on its line, not to cross a cell it can't crawl to. So its flash cells count (half a head's risk) only with
  food straight ahead of it within the flash's reach and one cell more, or when it holds a golden leap or dash, or faces
  something it could hop.
- **A tired rival can't reach further** (2u): while it looks tired (its stamina step, `step` in `aiView()`'s others,
  nothing more exact), it can afford neither plain power, so only its golden ones reach past the next cell.
- **Only cells it can step into:** not back into its neck, a hole or a body still there.
- **Fear by when I'd get there.** A cell beside a rival's head is a head-on on my first move, and, for the next `age`
  moves, its body if it went there (I can't see that yet). After that, I'd see where it went in time to turn, so it
  counts nothing.
- Right at a contested apple, with the other head next to it, a rival backs off by its fear: about 1 in 8 of those cells
  would be a crash. How much it risks there is its persona's nerve (below).

### Nerve at a contested apple

- **A meal is worth what it saves, for every rival** (entry 2b): the length it adds and, hungry, the length it stops
  the rival losing, from nothing 10 s before its first shrink (`AI_HUNGRY_MS`) to one more at the shrink and two a
  while into starving. At a cell with food on it, the threat is counted over that worth (times 1 / (1 + what it
  saves)), so a hungry rival contests an apple because it is worth more, not by a rule of its own. Each persona's
  fear still shapes it: in a staged duel, nearly starving, Sniper, Sovereign and Joker take an apple a rival's head is
  beside, and Ghost still gives way.
- **A persona's nerve:** `nerve: { base, hungry }`, the share of a rival's threat set aside at a cell with food on it,
  on top of the worth above. It covers both the head-on fear and the zone fear, as they are read for that cell in the
  search; the maps themselves are not changed, so every other cell, and the risk where a power lands, reads as before.
  `hungry` adds that much more for every share of the hunger clock (`HUNGER_MS`) gone since the last meal. The nerve
  is never more than 0.85 (`NERVE_MAX`): the odds still count, even starving.
- **Desperado:** 0.7, always; and, an adrenaline junkie, less afraid of heads and of where they may be everywhere
  (`headRisk` 450, `zoneRisk` 25). Its skims come from its taste for the thrill (`thrill`), not from that fear: they
  stayed the same with less of it.
- **Gobbler:** 0.5 at any hunger, plus 0.7 of its hunger, so it contests even fed. Its head-on fear is the highest of
  all, so it takes a sure head-on only from half-way hungry.
- **Everyone else:** no nerve, the hunters included. Capricious borrows Gobbler's or Desperado's whole weights with its
  mood, nerve and all.

### Stuns, head-ons and food that won't keep

- A rival seen stunned can't strike until its stun's over (its stars show), so its head isn't feared meanwhile.
- A rival just met head-on gets twice the berth for about 3 s (30 ticks: `bumped` in `aiView`).
- Baked food is worth what it's worth, a golden beetle half again for its leaps, and an apple that'll have rotted before
  the rival gets there isn't chased.

### The endgame: a meal is worth the life it buys

Past a length of its own (`hungryBelow`), a fed rival wants food only `fedFactor` as much. Once the woodpecker's frenzy starts
(sudden death, its third act: `view.act` 3) nothing new grows but the last apples, so the "fed" state switches off for everyone (and all
round in a lean food season; a plentiful one starts the weighing below before the woodpecker: "Food seasons" in
`04-food-and-the-world.md`). Hunger trumps
it too: with under 10 s before it starts starving (`AI_HUNGRY_MS`; in the endgame, before hunger would take it below
the length worth keeping, below), any rival goes looking for food, harder the closer it gets. Ghost, which stays small on purpose, keeps small but not starvation-small: before the woodpecker food counts
in full for it under 18 cells (`hungryBelow` 18, `fedFactor` 0.4), and in the endgame it keeps the least (below), and hungry it keeps its distance from heads less (none, desperate), so its
distance doesn't cost it the meals it needs.

In the endgame a meal is worth the life it buys against the room it costs (2h, the owner, 29 and 31 October 2026).
There's no clock to run out then (the round ends when one snake is left), so length is worth a crash buffer (a crash
costs 3, and one at the smallest puts a snake out) and a hunger buffer, and no more; beyond that it only fills the
room a snake needs to turn in.
- **The length worth keeping:** `keep` segments over the smallest (`KEEP`, 10, by default: two crashes and four
  shrinks). Past it a meal is worth only the hunger it stops: one bead to stop hunger, not the whole heap, and along a
  line of moves the meals after the first count only their stamina or power. With room to spare (`ROOMY`: four times its length of free
  log a snake, and more) food counts as before. Gobbler stays the greediest (`keep` 24: its food share is its
  trademark), Mason keeps 16 (its walls, two thick, need the length), and Ghost, which keeps small on purpose, is the
  most sparing (7); the default is already sparing for the rest.
- **Hunger read against that length:** in the endgame a rival's hunger ramp (`AI_HUNGRY_MS`) counts down to when
  hunger would take it below the length worth keeping, not to its first shrink: the shrinks above it cost nothing it
  would keep, so a long rival lets hunger trim it, as one that never ate would, and eats as it nears that length, as
  one would not (entry 6, part 3: read from the meal clock alone, the weighing ate almost as rivals that always eat).
  Head to head it beats rivals that never eat, who starve, but only comes out even with rivals that always eat: in the
  frenzy a cut takes about 30 segments, more than meals give, and a cut tail feeds the cutter, so which meals a rival
  takes hardly moves its length; fewer self-bites and more starving after a cut cancel, and rounds end in crashes (the
  rework: #655, a rule that makes length cost room).
- **The tail drop planned ahead:** a drop needs the flash rested, a body one thick and a free cell beyond, and a boxed
  snake rarely has all three. So in the endgame a rival weighs dropping its tail as soon as the search sees it boxed in
  (every crawl ends in less room than it needs, or only through a gap a rival could shut), not only once every crawl
  crashes; what it drops below the length worth keeping costs an apple a segment. Each in its style (`drop`): Creeper
  readily, all round; Ouroboros and Mason late, only out of a crash (Mason's walls are its body: dropping it planned,
  its body lay beside itself 3.5 points less).
- **The denial play, tried and left out:** a rival seen starving (a segment off, as anyone sees one shrink) made food
  within 8 moves of its head worth eating to keep from it, whatever the eater's length, and a bead of the eater's own
  there worth squashing. Head to head both ways (seeds 71 and 73, 800 paired rounds), its users came out even (win% a
  snake −1.8 points, [−4.2, +0.5]; place the same within 0.1), so it stays out, as the owner's rule for it says.
- **Measured** (PR #596, seeds 71 and 73, head to head against the AI 2b left, 800 paired rounds): win% a snake +12.2
  points, place 0.23 better, and every rival's win% up; deaths into its own body down from 23% to 14%, head-ons up from
  1.2% to 2.9%. Both ways, the length worth keeping +11.7 points of win% and the planned drop +10.5. In sudden death
  (`--census`, "the endgame (2h)") a snake averages 32 long instead of 39, it lasts about 9 s longer, drops its tail
  about 2.9 times a woodpecker round instead of 0.3 (nine in ten alive 5 s on), and the deaths in a pocket smaller than
  itself fall from 89% to about 79%. Every trademark within noise. Its numbers are measured again after the
  woodpecker's makeover (entry 6), which changes the endgame's timing.

### A starving rival takes its chances

When the hunger it can see (its own clock, as a person sees their bar) leaves it less than about 6 s of life
(`AI_DESPERATE_MS`; at 11 s, under one 12 s clock, a rival four long was desperate 2.5 s after every meal, and the
opening's rivals chased the same apples and crashed: #616), a rival:
- drops its personality's errands (home, mimicry, coiling, lures);
- goes for any food, even food a rival might reach first (never its own beads, which aren't a meal);
- takes more risk near heads;
- may jump or flash for food (every power costs it half while it's desperate);
- with no food in reach, hunts, to make someone crash and drop beads.

It's the same rule for every snake (`readDesperation` in `ai/food.js`).

### Mushrooms, to a rival

A mushroom costs a rival as many apples as the segments it takes (`SHRINK`, 3, the first time), fed or hungry; Gobbler,
which hates them, counts it twice (`mushroom` −6). With a shot in reach, a rival weighs eating one on purpose against
the shot, by its taste for it (`spit`: Drab 0.05, Ghost 0.2, Sniper 2.5, Joker 4): "Mushrooms come back up" and "The
spit flies along the line" in `40-powers-and-moves.md`. Desperate, it takes no shots.

### Rivals use their powers, when it pays

Each power is weighed as a move in the rival's own search, from where the power leaves it and to the same horizon, plus
what it eats on the way, less the risk where it ends and a price in apples (what an apple is worth to it now), and
pressed only when it beats crawling (`powerPick` in `ai/powers.js`):
- *The plain flash and jump* spend one stamina (2u), priced by what they take of it: see `ai/powers.js`.
- *The plain flash:* its price, or half to win a race for food (food a rival could reach as soon as it would crawl
  there, but not as soon as it flashes) or to get out of a crash. Weighed the way the rival would crawl anyway (any way,
  out of a crash; the hunters and the aggressive, a cut to the side too).
- *The plain jump:* out of a crash or a box, to another island, or to come down on food or just short of it, at its
  price.
- *Golden jumps:* whenever one pays, at a third of an apple (0.35).
- *Golden dashes:* 0.6 of an apple, pressed out of a trap or for a cut that puts a rival out.
- Desperate, every power is half the price.
- *Star's habit* (`powers`): its powers are free unless one ends where a rival could strike ("Star", below).
- *A style's own price,* where a persona has one: a leap now out of a trap (`leapNow`, times the jump's price: Drab 4,
  Ghost 0.8, Desperado 0.6), and putting a flier out by lying on its ring (`landing`, 0.6 by default: Drab 0.15,
  Desperado 1.2, Sniper 1.5).

How each move is used and seen used against them is in its own section in `40-powers-and-moves.md`; the power
styles and one pricing model for every power are still to build (part 7 of round six B, in `docs/PROGRESS.md`).

### A cornered AI makes the sensible last move

When every move looks fatal, a wall, a hole or its own body is certain death, but a rival's cell may already be free (it
sees rivals as they were a moment ago), so it bets on the cell that frees up soonest (`maybeFree` in `ai/search.js`).
Through fire rather than a crash: "Fire on snakes" in `41-crashes.md`.

### The board split

Every snake's territory is the cells it reaches first. A rival's `territory` is the pull of its own share,
`aggression` the pull of shrinking everyone else's, and `contested` how much food a rival reaches first still counts
(Gobbler counts a rival's apple in full, `contested` 1; Vulture too).

### Mason builds double walls

The trappers want their own body beside their head (`thick`, dropped when desperate), so their walls run two thick:
nobody can hop them, and no plain flash can cut them. Mason, who lives by straight walls ("Keep watch!"), lays them two
thick where it can, running back alongside (`thick` 60); Mute and Sniper less (15). The owner kept the double walls over
Mason's longer straight runs (29 October 2026: `docs/archive/progress-done/owner-answered.md`).

### The cast and their trademarks

Every rival keeps its trademark, measured before and after any change to the rivals ("Rules that stand" in
`AGENTS.md`; the measures are the census's, as in "Trademarks" under "Round six A, measured"). Each rival's weights and
driver are in `ai/rivals/`, over the shared template in `ai/rivals.js` (`DRAB`, `HUNT`).

| Rival | Its blurb | Its trademark, as measured | What makes it |
| --- | --- | --- | --- |
| Mason | "Walls off the board, then keeps the biggest piece." | Straight runs (cells between turns) | `turn` 25, `territory` 1.8, `thick` 60 |
| Ouroboros | "Chases its own tail, then moves as a ring. Mind the middle." | Coiling (coiled, 10 long or more) | `coil` (20, from 10) |
| Creeper | "Sneaks up and rides right behind other snakes’ tails." | Tail-riding | `tail` 45 |
| Ghost | "Keeps its distance from everyone, and slips through the gaps." | Distance (cells from the nearest head) | `distance` 5, `space` 2 |
| Gobbler | "Eats everything, even a rival’s apple. Hates mushrooms." | Food share | `food` 10, `eat` 300, `contested` 1, `hurry` 1.5, `headRisk` 2200, `nerve` |
| Vulture | "Circles snakes in trouble and feasts on what they leave behind." | Beads (its share of them) | its driver (the snake with least room for its length), `lure`, `pellet` 3 |
| Sovereign | "Rules its own patch of bark and attacks anyone who trespasses." | Time home | its driver, `home` |
| Mute | "A mime. Picks someone and closes an invisible box round them." | Boxing (closing the box) | Sniper's driver, `hunt` (`squeeze` 4), `aggression` 0.8 |
| Joker | "Lures chasers into dead ends and swerves away at the last moment." | Lures (luring a rival on) | its driver, `lure` (6, 3 cells) |
| Desperado | "Skims edges, bodies and heads for the thrill of it. Yeehaw." | Skims (skimming danger) | `thrill` 25, `nerve` 0.7 |
| Star | "Jumps and dashes every chance it gets. Catch it when it dims." | Flash rate (flashes a minute) | `powers` (Star's habit), `golden` |
| Sniper | "Picks whichever snake it has the best shot at and cuts it off." | | its driver, `hunt` |
| Colonist | "A redcoat who plants flags all over and defends every one." | | its driver, `colony` |
| Metagamer | "Studies how each rival plays, then counters it." | | its driver |
| Drab | "Plays it safe and sensible. Nothing special." | | `DRAB`, the baseline |
| Capricious | "Does impressions of all the others, by turns, in costume." | | its driver: `35-capricious-copycat-and-wildcard.md` |
| Copycat | "Copies whoever leads: their colours, paled, and how they play. Party member." | | its driver: `35-capricious-copycat-and-wildcard.md` |
| Wildcard | "A random mix of habits, new every round. Great hair." | | its driver: `35-capricious-copycat-and-wildcard.md` |

Still to build (part 7 of round six B, in `docs/PROGRESS.md`): measures that catch Mute's boxing, Joker's lures and
Mason's body beside itself, which show little over the field on a simple measure, and Joker lifted into the band.

### Ouroboros

The snake that eats its own tail, the 17th rival (its look: "The rivals' looks" in `03-the-snake-as-a-character.md`).
Its `coil` weight (`{ weight: 20, from: 10 }`) rewards keeping its head close behind its own tail once it's 10 or
longer, so it moves as a ring; food pulls it along, so the ring rolls over food, and anything caught inside is boxed in.
It's distinct from Mute (who boxes in one chosen victim) and Sovereign (who guards land). The ring is a strong, safe
shape, so its coil is gentle and its caution and appetite low (`headRisk` 800, `food` 3), to keep it in the band.

### Star

The owner's idea: the rainbow body, dropped before, given to a new rival, a star with a rainbow following it, inspired
by the stars of the original Paper Mario (its look and tell: "Star" in `03-the-snake-as-a-character.md`; its voice:
"Star's voice" in `13-lines-and-announcements.md`). *Why it belongs:* every rival prices jumps and flashes the same way, and Star
is the first whose whole character is the powers, a power addict that jumps and flashes as often as it can, so it
shows what they can do; a shooting star dragging a rainbow is the most natural home the rainbow has had.

It prices powers far below anyone else, by the same rules and the same engine calls, through two persona weights that
are off for everyone else, so rounds without Star play exactly as if it didn't exist:
- **`w.powers`** `{ price: 0, risk: 350, everyWay, jumpAny, dashSpend, keepFlash: 0.01 }`. Its powers are free to it, unless one ends
  where its risk is over 350 (a rival could strike there: in reach of its powers, or nearer), and there it pays the
  full price, as anyone would. A power still has to beat crawling by a point.
  - **Flashes:** whenever it has a flash's worth of stamina and the flash doesn't run into anything, weighed every
    way, not just the way it would crawl: about three times as often as the median rival.
  - **Jumps:** any hurdle with somewhere free to land beyond it that no rival could get to before it's down, not just
    out of a crash or onto food: over twice as often as the median rival. What it keeps is a flash's worth of stamina
    (`keepFlash`): a jump that leaves less costs it a hundredth of the wait it costs anyone, so its jumps don't eat
    its flashes, and both stay in the band (2u).
  - **Golden dashes:** spent on speed too, not only on cuts and golden things, but at anyone's price for one (0.6 of
    an apple), so only for a real gain, such as beating a rival to an apple.
- **`w.golden`** `{ power: 6, apple: 1.5, contested: 0.5 }`. It craves golden things above everything, to feed the
  habit: golden power food (golden beetles, golden leaves and golden mushrooms; a plain beetle is worth to it what
  it's worth to anyone) is worth six times as much to it, a golden apple one and a half times, and golden power food a
  rival will reach first still counts half.
- **`territory` 1.2:** of everything tried, the only change that moved its win rate.

Spending powers on small gains makes a rival weaker, so Star stays a threat in two ways: each power goes by the same
tests of where it goes as anyone's, and pays the full price where a rival could strike, so it rarely flashes into a
crash; and its craving keeps it stocked with golden jumps. It's tuned into the same band as everyone; its habitual
jumps neither help nor hurt measurably, and stay because they're the character.

### Every rival has a power style

Each persona uses jumps and flashes its own way, through the same engine calls as a person. Most of it is still to
build (part 7 of round six B, with one pricing model for every power, in `docs/PROGRESS.md`); "Balance targets",
below, is its measure.
- **Built so far:** Star's habit ("Star"); a style's own price for a leap now and for a flier's ring (`leapNow`,
  `landing`: "Rivals use their powers, when it pays") and for a mushroom shot (`spit`: "Mushrooms, to a rival");
  everyone's island hop, and a tail dropped when trapped, or planned once boxed in the endgame ("The plain jump hops
  islands" and "Dropping your tail" in `40-powers-and-moves.md`; "The endgame: a meal is worth the life it buys").
- **To build, each its own:** Sniper cuts off its target; Mute seals boxes; Gobbler races for food; Vulture flashes to
  beads; Ghost keeps a flash ready to escape. Sovereign and Colonist chase intruders off their land; Mason finishes
  walls; Creeper flashes in behind tails; Desperado for the thrill; Joker springs its lures; Ouroboros jumps its own
  coils and drops its own tail. Star is the addict; Wildcard is random; Capricious and Copycat borrow; Metagamer reads
  its rivals; Drab is the baseline.
- **To build, all of them:** a ready flash is worth keeping (a reserve value); length is worth trading for room when
  boxed in (jump to an island, or drop the tail); keep a jumpable way out; cross the woodpecker's mark when they'll be
  out of it before the strike (today they keep out of a mark as out of a hole: "The rivals tell a mark from a hole" in
  `38-the-woodpecker.md`).
- *The test case:* the owner's screenshot (Gobbler folded on a strip, an island across a hollow). The rival must find
  the hop, the flight or the tail drop.

### Gobbler's endgame

To build, with the power styles. Gobbler grows longest, and most of its deaths come late, in pockets too small for it;
no weight change held it up ("Gobbler, at the floor" under "Round six A, measured" in
`27-round-six-a-fairness-and-fixes.md`). Its style is the cure, not a number: it hops to the next island for food, and
drops its tail when a pocket is too small. The aim: Gobbler comfortably inside 15–35%, its food share still the
field's biggest.

### The band

Every persona wins 15–35% of the rounds it plays, over several seeds (one persona on one seed is about 130 rounds, ±7
points of noise; over five seeds about 660, ±3). A persona outside it is retuned, without losing its trademark; one at
the floor whose retunes don't hold up on fresh seeds keeps its weights ("Gobbler, at the floor" under "Round six A,
measured"). The latest rates by persona are in "Win rates by personality" there.

### Balance targets

The measure for the moves and the power styles, as round six B set it (simulation, paired seeds): powers on clearly beat
powers off in the seat-split A/B; every persona in the band (above); rounds about 160–180 s; starving at most 15%
of deaths (8% until entry 6, part 3 made a meal a trade-off in the frenzy, where a long rival now lets itself shrink:
13.7% on seeds 107 and 109, 4.4% before, the time spent starving before the frenzy 2.9% against 2.2%);
failed flashes rare enough to be a risk you take on purpose. The numbers chosen against it are in each move's section
of `40-powers-and-moves.md`; the text as it was, with the A/B as it stood then, is in
`docs/archive/design-arc-and-history.md`.

### How a change to the rivals is measured

- **A change meant to keep every decision:** `tools/bench-ai.js` first (every position the same way, its memory and
  random draws too), then the fingerprints.
- **A change that moves decisions:** old against new with `tools/abtest.js` on fresh seeds, head to head (win rate, food
  and time alive a snake, each persona's win rate, deaths by cause, every trademark) and for feel, each AI in a field of
  its own kind (the median round, sudden death, deaths by cause, starving), all within noise unless the change means to
  move them ("Rules that stand" in `AGENTS.md`). A behaviour the census can't count gets a census of its own in
  `tools/dev/`.
- **The cost:** a decision's time, from `tools/bench-ai.js`. Every new weight goes in `WEIGHTS` (`ai/rivals.js`), or
  every search that reads it is slower ("One shape of weights", below).

### How they think quickly

A rival's thinking (`decide()`, `ai/decide.js`) is most of the time the simulation and CI take, so its searches are
built for speed, and a change made for speed alone keeps every decision ("How a change to the rivals is measured"; the
tools in `28-the-rivals-think-faster-round-six-as-optimization.md`).
- **The framed board.** The territory search, my room's flood fill and each rival's reach run on the grid framed by a
  border of holes (`frameBoards` in `ai/buffers.js`), so a cell's neighbours are just a row up or down and a cell either
  side, and no search tests for the edge. On the territory search's board (`terr`, which my room's fill reads too), one
  Int32 a cell says everything a search asks of it: when the cell frees up for a rival (my body placed on it), or, once
  the territory search has claimed it, `CLAIMED` plus when, with whose it is in the lowest bits. Each search state
  starts from a copy of the board (`terrFree`) instead of undoing the last.
- **Searches compiled once.** The searches over the framed board are functions of their own at the top level
  (`ai/room.js`), outside `decide`, reading only typed arrays and plain numbers, so V8 compiles them once and they stay
  compiled. A function that meets something of a new shape (a persona, a kind of food) is compiled all over again, and
  runs uncompiled meanwhile.
- **One shape of weights.** The search reads every persona's weights through one shape: a copy of the persona's own
  over `WEIGHTS` (`ai/rivals.js`), which lists every weight. **A new weight goes in `WEIGHTS`.** One left out still
  works, but every search that reads it is slower.
- **The territory search stops early.** Once I claim nothing more, the rest is the rivals sharing out what's left among
  themselves, which counts only for an aggressive snake; so for anyone else it stops there, unless a rival could still
  claim food it can't eat (its own bead), which would still be mine to take. (The search still allows for a rival
  that's coughing, `coughs`, but nobody coughs now.)

### The rival line-up

Who you meet is dealt from a deck, and you may choose instead, seat by seat.

- *The deck* (`lineup.js`, `deal()`, under the key `snake-deck`): this browser keeps a shuffled deck of the eighteen and
  deals from it, every rival once before any comes round again, across rounds and reloads. When it runs out, a fresh
  shuffle goes in behind whatever it still holds. Watching (four rivals) deals the same way. The simulator and tools
  keep the engine's own uniform pick (`pickOpponents`), so fingerprints are unchanged.
- *Choosing* (`game/cards.js`, `openPicker()`; the seats in `game/cards.js`, `buildOpponents()`): on the start card
  each rival is a button with a swap mark; it opens a picker of "Any" and all eighteen, each with its dot and blurb,
  over the page like the Hall of Fame (Escape or × closes it). A chosen seat wears a ring, and on the start card a
  small pin beside it: a tap on the pin sets the seat back to "Any" (`unpinSeat()`). The choice is kept per seat for
  this visit (2u, 30 October 2026: "Didn't expect them to stay permanently"), round after round and across a reload in
  the same tab, in `sessionStorage` under `snake-visit-lineup` (`seats()`, `setSeat()` in `lineup.js`); the next time
  the game is opened every seat is "Any" again. The old lasting key `snake-lineup` is no longer read (and never
  renamed). "Any" seats are dealt from the deck, which skips the chosen rivals (they stay in it for later). Choosing a
  rival already in another seat swaps the two. Watching from the start card keeps its three and deals the fourth.
- *Online* the host's choice and deck decide. A guest's own choice and deck are untouched. With more people, fewer
  seats are dealt: the first seats' choices count.
  - *In the lobby* (`game/friends.js`, `hostLineUp()`, `renderPlayers()`): the empty seats show the rivals who'll take
    them, "unless a friend joins". The room opens with the start card's line-up (and what the deck dealt for it); after
    each round the next is dealt, shown on the round's card. The host's seats are the start card's buttons, opening the
    same picker (a chosen one wears its ring); the guests see each seat's rival, and "chosen", as it stands. A seat a
    friend takes sends its rival back to the top of the deck, as does closing the room. Closing the page (a start
    card's or the room's rivals never met) sends them back to a random place among the rivals not yet dealt
    (`undeal(..., { anywhere: true })`), so opening the game gives a fresh cast and everyone is still met first.
  - The lobby message carries the line-up (`lineup`: each seat's rival and whether the host chose it), sent whenever it
    changes (protocol 13); the round message carries the round's as before.
- *The Hall of Fame:* every entry of a round with any chosen rival (yours, the rivals', a friend's) is marked "chosen"
  after its name. The round's `chosen` flag and a shared best round's go online (protocol 12).
