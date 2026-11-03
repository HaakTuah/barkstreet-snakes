## The rivals

Three rivals play every round with you (four when you watch), dealt from a cast of eighteen. Each is the same AI with
its own weights and, for some, a driver that runs once a decision. The rules as the rivals' look ahead, round four,
round six B and the owner's playtest settled them (their text, with what was tried and measured, is in
`docs/archive/design-rivals.md`). Elsewhere: what they do with food and beetles (`04-food-and-the-world.md`, from
"Rivals see food as it is"), with the woodpecker ("The rivals tell a mark from a hole" in `38-the-woodpecker.md`),
with fire, head-ons and their own beads (`41-crashes.md`), with each move (`40-powers-and-moves.md`), and the power styles still to build ("Every
rival has a power style", "Balance targets" and "Gobbler's endgame" in `29-round-six-b-the-new-moves.md`); their looks
(`03-the-snake-as-a-character.md`); their lines
(`09-voice-and-copy.md`, `13-lines-and-announcements.md`, `19-looks-and-lines.md`); Capricious, Copycat and Wildcard
(`35-capricious-copycat-and-wildcard.md`); Ouroboros (`17-ouroboros-and-the-golden-beetles-leap.md`); Star
(`26-round-five-star.md`); Sovereign's realm and Colonist's flags, and a pecked flag
(`44-realms-and-colonies.md`); how they think quickly, and its tools
(`28-the-rivals-think-faster-round-six-as-optimization.md`); and how each round measured them ("Round four, measured" in
`25-round-four-measured.md`, "Round six A, measured" in `27-round-six-a-fairness-and-fixes.md`).

### What a rival sees

- **A person's reaction time.** A rival sees the other snakes, the holes, fire and the woodpecker's mark as they were
  `REACTION_MS` (240, about a quarter of a second, and never less than a tick) ago. It knows its own body, hunger and
  powers exactly, and sees food, burrows, the weather and the woodpecker's strike and promised landings as they are now
  ("Rivals see food as it is" in `04-food-and-the-world.md`). All of it comes through `aiView()` (`engine/view.js`).
- **Nobody is singled out.** A rival is never told which snake is a person: every snake is an id and a body, and it reads
  a person by what they do, as any snake ("Rules that stand" in `AGENTS.md`).
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
- **A rival's flash I fear only when it has a reason to flash.** A plain flash costs its rest: a snake spends one racing
  for food on its line, not to cross a cell it can't crawl to. So its flash cells count (half a head's risk) only with
  food straight ahead of it within the flash's reach and one cell more, or when it holds a golden leap or dash, or faces
  something it could hop.
- **Only cells it can step into:** not back into its neck, a hole or a body still there.
- **Fear by when I'd get there.** A cell beside a rival's head is a head-on on my first move, and, for the next `age`
  moves, its body if it went there (I can't see that yet). After that, I'd see where it went in time to turn, so it
  counts nothing.
- Right at a contested apple, with the other head next to it, a rival backs off by its fear: about 1 in 8 of those cells
  would be a crash. How much it risks there is its persona's nerve (below).

### Nerve at a contested apple

- **A persona's nerve:** `nerve: { base, hungry }`, the share of a rival's threat set aside at a cell with food on it.
  It covers both the head-on fear and the zone fear, as they are read for that cell in the search; the maps themselves
  are not changed, so every other cell, and the risk where a power lands, reads as before. `hungry` adds that much more
  for every share of the hunger clock (`HUNGER_MS`) gone since the last meal. The nerve is never more than 0.85
  (`NERVE_MAX`): the odds still count, even starving.
- **Desperado:** 0.7, always.
- **Gobbler:** 0.3, plus 0.7 of its hunger. Its head-on fear is the highest of all, so it takes the gamble only once
  it's hungry.
- **Everyone else:** no nerve, the hunters included. Capricious borrows Gobbler's or Desperado's whole weights with its
  mood, nerve and all.
- To build: a contested apple worth what it saves, for every rival (entry 2b in `docs/PROGRESS.md`).

### Stuns, head-ons and food that won't keep

- A rival seen stunned can't strike until its stun's over (its stars show), so its head isn't feared meanwhile.
- A rival just met head-on gets twice the berth for about 3 s (30 ticks: `bumped` in `aiView`).
- Baked food is worth what it's worth, a golden beetle half again for its leaps, and an apple that'll have rotted before
  the rival gets there isn't chased.

### Nobody's picky in sudden death

Past a length of its own (`hungryBelow`), a fed rival wants food only `fedFactor` as much. Once the woodpecker's here
(`SUDDEN_DEATH_MS`) nothing new grows but the last apples, so the "fed" state switches off for everyone and every snake
eats what it can. Hunger trumps it too: with under 10 s before it starts starving (`AI_HUNGRY_MS`), any rival goes
looking for food, harder the closer it gets. Ghost, which stays small on purpose, keeps small but not starvation-small:
food counts in full for it under 18 cells (`hungryBelow` 18, `fedFactor` 0.4).

### A starving rival takes its chances

When the hunger it can see (its own clock, as a person sees their bar) leaves it less than about 11 s of life
(`AI_DESPERATE_MS`), a rival:
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
- *The plain flash:* two apples, or one to win a race for food (food a rival could reach as soon as it would crawl
  there, but not as soon as it flashes) or to get out of a crash. Weighed the way the rival would crawl anyway (any way,
  out of a crash; the hunters and the aggressive, a cut to the side too).
- *The plain jump:* out of a crash or a box, to another island, or to come down on food or just short of it, priced at
  1.5 apples (`LEAP_COST` and a rest).
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
Mason's longer straight runs (29 October 2026: `docs/archive/progress-done.md`).

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
"Its voice" in `26-round-five-star.md`). *Why it belongs:* every rival prices jumps and flashes the same way, and Star
is the first whose whole character is the powers, a power addict that jumps and flashes as often as it can, so it
shows what they can do; a shooting star dragging a rainbow is the most natural home the rainbow has had.

It prices powers far below anyone else, by the same rules and the same engine calls, through two persona weights that
are off for everyone else, so rounds without Star play exactly as if it didn't exist:
- **`w.powers`** `{ price: 0, risk: 350, everyWay, jumpAny, dashSpend }`. Its powers are free to it, unless one ends
  where its risk is over 350 (a rival could strike there: in reach of its powers, or nearer), and there it pays the
  full price, as anyone would. A power still has to beat crawling by a point.
  - **Flashes:** whenever it's rested and the flash doesn't run into anything, weighed every way, not just the way it
    would crawl: about four times as often as anyone else.
  - **Jumps:** any hurdle with somewhere free to land beyond it that no rival could get to before it's down, not just
    out of a crash or onto food.
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

### The band

Every persona wins 15–35% of the rounds it plays, over several seeds (one persona on one seed is about 130 rounds, ±7
points of noise; over five seeds about 660, ±3). A persona outside it is retuned, without losing its trademark; one at
the floor whose retunes don't hold up on fresh seeds keeps its weights ("Gobbler, at the floor" under "Round six A,
measured"). The latest rates by persona are in "Win rates by personality" there.

### How a change to the rivals is measured

- **A change meant to keep every decision:** `tools/bench-ai.js` first (every position the same way, its memory and
  random draws too), then the fingerprints.
- **A change that moves decisions:** old against new with `tools/abtest.js` on fresh seeds, head to head (win rate, food
  and time alive a snake, each persona's win rate, deaths by cause, every trademark) and for feel, each AI in a field of
  its own kind (the median round, sudden death, deaths by cause, starving), all within noise unless the change means to
  move them ("Rules that stand" in `AGENTS.md`). A behaviour the census can't count gets a census of its own in
  `tools/dev/`.
- **The cost:** a decision's time, from `tools/bench-ai.js`. Every new weight goes in `WEIGHTS` (`ai/rivals.js`), or
  every search that reads it is slower ("One shape of weights" in `28-the-rivals-think-faster-round-six-as-optimization.md`).

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
