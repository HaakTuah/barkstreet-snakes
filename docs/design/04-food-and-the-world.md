## Food and the world

- **Everything moves smoothly.** Food used to snap to whole pixels, so its small bob moved in visible steps; now it's drawn at its true position. Each piece has its own shadow on the bark, apart from the sprite, so it lifts off it. **New food pops in** with a little overshoot, and at the start of a round the board's food pops in one piece after another. A mushroom that withers or a golden apple that rots goes with a small poof.
- **Apples** bob up off their shadows, squash a touch as they come down, sway their leaf, and now and then a glint winks on them.
- **The golden apple** bobs too, in a glow that breathes, with a small rotating sparkle star (a non-hue cue) and glints twinkling round it. Instead of blinking before it rots, it dims calmly.
- **Mushrooms** sway on their stems, breathe, and let go of a spore now and then. In their last few seconds they wilt: they lean over, shrink and fade.
- **Beetles** (your Flåklypa idea): a jewel beetle, emerald with a gold rim, that comes out where it's quiet and walks the bark cell by cell with scuttling legs. Each step sets off and settles (step, pause: a beetle's walk), and it turns smoothly. Between steps it's never quite still: its feelers wave, it breathes, and every few seconds it lifts its wing cases and buzzes its clear wings, as if about to fly off. Scared, it trembles and its feelers twitch. It pops in when it comes out. It's the one food that moves, so it adds a chase to the core loop. **Tuned in the simulator (250 seeded rounds per setting):** a beetle that bolts as fast as a snake was a death trap (rounds 75 s -> 57 s, and 20% of deaths happened within 4 cells of a beetle, as snakes followed it into tight spots); one that scurries at half a snake's speed from any head within 4 cells leaves rounds as they were (72 s, deaths near a beetle 5%) and still makes you chase: 89% are caught, after about 4 s of pursuit. The AIs value one at what it's worth (two apples) and, since round six A, see it as it is (they used to see it through their usual reaction delay, and chased where it had been). A skitter when one appears, a crunch when you catch it, and Gobbler, Desperado, Sniper and Mason have something to say about it (Mason: "Scarabaeus captus!"). (*Since round six A* up to two are out at once, in sudden death too, one scurries from a head within 6 cells, and a cornered one digs in: see "Less fruit, more beetles".)
- **Remains:** a dead snake falls to pieces: glossy beads in its own colours and markings, popping in from head to tail. Wildcard leaves the Stars and Stripes (and an orange-tan head), Mute the colour of its last mood, Joker purple and amber, Vulture black with a white ruff and a pink head, Mason marble, Colonist its cream strap, Copycat dashed rings, Ghost pale see-through beads, Star and Copycat their rainbow as it ran down the body when they went (the pieces they burst into too), and a friend online its spots. They bob gently, each on its own beat. A light rim and a dark edge keep every bead readable on the bark. (They used to be roast drumsticks, ringed in the snake's colour: the same for every snake, and a snake turning into chicken was a strange thing to see.) **Since round four** a dead snake leaves a bead on every other segment (at least 3), not one on each. **Since 2 November 2026** each bead stands for its stretch of the body, from its own segment to the next bead's: it takes the fills those segments had as last drawn, half and half (its own upper left, the next's lower right), and their markings (Mason's gold vein if either has it, Colonist's two straps crossed), so Joker's beads are purple and amber, Wildcard's run collar, stars and red and white stripes, and nothing is squeezed. A crash's and a cut's beads take their own segment's look the same way. Beads go off as their time runs out (about 14 s), as apples do: a dull film and brown spots come over them (a dark bead, Vulture's black or Wildcard's navy, grows a pale mould instead, a grey film and grey-beige spots, so its rot shows as early as any other's), they shrink and dim, and go in a puff of their own colour. You squash your own beads (see "Choking on your own tail" in `41-crashes.md`).
- **Burrows** (the beetles' homes): an oval opening in the bark, splintered round its rim with a little sawdust, and cracks that spread from it over about half a minute, each burrow's its own. Wood splits along its grain, so the cracks run along the log either way from the hole, tapering, now and then forking (they used to fan out in every direction, and with a beetle beside them they looked like a spider's legs). The first beetle cracks one open where it's quiet; later ones come out of a free burrow or, half the time, open another (up to three). A scared beetle runs for a burrow within 6 cells and dives in (it shrinks away into the hole), then comes out of another a second or so later. Burrows are safe to cross, and nothing grows on them. **Tuned in the simulator (300 seeded rounds):** beetles are still caught 90% of the time (91% before), and rounds are as long (68 s median, 69 before). **Since round six A** a cornered beetle's dig leaves a burrow too, freshly bored rather than popping open, and past three the one unused longest closes over (sawdust and moss fill it; since the owner's playtest it grows shut over 6 to 14 s first, beetles going in but none coming out: see "Burrows grow shut"); knocked food never lands on one, nor, since the verify pass, a dead snake's beads or a tail a crash knocks off (before, a bead on a burrow sat there 2 to 3 s a round). A bead a choke spits, or food a cough nudges, can still roll onto one (the roll's rule has no burrow in it, and the rivals work rolls out by the same rule): about once in 40 rounds. See "Less fruit, more beetles".
- **Holes** are pits in the log, one per hollow, traced along the cell edges: a torn inked lip, a dark floor, the far wall lit from the upper left, splinters over the rim and sawdust round it, and at the board's edge a notch bitten out of the log. They lie on the static layer under everything, so a body bridging a hole is drawn across it. A strike paints again only the box round its new holes. (Until round four they were ragged gouges, then one dark disc a cell, which read as bubble wrap.)
- **The corner leaves move onto the frame** and never cover playable cells.
- **Borders: Sovereign's realm and Colonist's colonies** (round four; they were force fields). The land is drawn as on a map: its cells, exactly the land the rules mean, under a light wash in the owner's colour; a band and a riband of the colour inside a true ink line with rounded corners, a parchment keyline just inside the ink, so a border reads for every eye (no line along the board's edge or round a hole: holes are lost land); where two owners' land meets, the line is dashed in both colours over true ink, the dashes standing still, and land both claim is hatched in both. (Without the keyline, Colonist's rose went grey-khaki to colour-blind eyes, its ink no darker than the bark's grain.) Land grows a ring of cells at a time as a realm widens, and shrinks back into its capital when its owner goes. The border flares as it changes and when lightning strikes, breathes while a rival's head is on it, and lights up from where a head crosses in. A rival on the land wears the land's colour round its pieces on the land's own cells, with a parchment keyline outside it, so it shows round a red body too. If it's you, you hear it: a muffled drum and a fife (see Sound). (Drawing only: the rules of trespass are as they were, and the AIs know nothing more than before.) *History:* they began as flat tinted discs with a hard edge, and nothing happened when you went in. The third pass made them domes of light with a honeycomb, ripples, sparks round the rim, rain dimples, frost and a wind shiver; those cost 2.3–2.6 times the same board without them, and round four replaced them with these borders (see "Borders, not force fields").
- **Sovereign's realm grows and moves.** It starts at radius 4 and gains a cell of radius for every 8 segments Sovereign grows, up to 7. If Sovereign wastes away, it shrinks back (2 segments' grace, so it doesn't flicker). Every 1.5 s it checks whether a cell's step would put clearly more of it on open log (holes and fire are lost land) and drifts that way, one cell at a time. On screen its land grows or shrinks a ring of cells at a time, and its border flares. Its capital flies a swallow-tailed banner in parchment and ink, its crown inked, trimmed in the realm's colour (no gold: gold means a power). Sovereign remarks on it ("Our realm expands!", "A strategic retreat. A royal one.", "The court relocates."). Over 600 seeded rounds it wins as often as before (28% to 27%); over 120 rounds against two others its realm reached radius 5 to 7 in four rounds of five.
- **Colonist's flags.** It plants the Union Flag and it flies (drawn in strips that ripple out from the pole), on an inked pole with a parchment knob (round four; it had a gilt finial). It used to be St George's cross, which is England's flag; redcoats were the British Army from 1707, and the colonies were claimed under the Union Flag. The game uses the 1801 flag everyone recognises, the one of the Empire's great colonising century (a tricorn-era purist would leave out St Patrick's red saltire). **Its later colonies fly colonial ensigns**, as the Empire's colonies did: the Union Flag in the corner of a Blue Ensign with the Southern Cross (the second, fourth, …) or a Red Ensign with the colony's badge, here the log's own oak on a white roundel (the third, fifth, …). The first colony keeps the Union Flag. Each colony remembers its number, so its flag never changes.


### Food on the log

How much food there is and how long a meal keeps you, as round four and round six A settled it (their text, with what
was tried and measured, is in `docs/archive/design-food.md`).

- **Two apples all round** (`APPLES`; one in winter, `SNOW_APPLES`: see "Weather"): eaten or rotted, another drops
  somewhere. Beetles carry more of the food (see "Less fruit, more beetles").
- **A meal keeps you 20 s** (`HUNGER_MS`) in the opening and once the woodpecker has come, and **12 s mid-round**
  (`HUNGER_MID_MS`, from 0:45, `HUNGER_MID_FROM_MS`), so hunger matters in the middle of the round too. Each snake keeps
  how long its last meal keeps it (`mealMs`, carried online), and its tag's bar is measured against that, so it's full
  after any meal. Under `HUNGER_WARN_MS` (6 s) left, the tag shows it's starving: the bar in Berry, a ring pulsing round
  the tag, and "starving" for a screen reader.
- **Your own beads aren't a meal:** you squash them (see "Choking on your own tail" in `41-crashes.md`). Beads carry
  their owner, so it's the same rule for everyone, rivals included. Poison would punish picking your tail back up after
  a crash, and seat colours can look alike.
- **Body food rots:** beads fade, shrink and go after about 14 s (`PELLET_TICKS`, give or take a quarter; roasted ones
  last half again), in a puff of their own colour, as apples do.
- **A body leaves every other segment** (at least 3 beads, from the head; where there are too few, the skipped segments
  nearest the tail make up the number), so a kill doesn't snowball. Crash drops, cut tails and burnt bits stay whole.
- **The last apples fall one at a time.** In sudden death, once the board has no apple, another drops, each wait longer
  than the last (`SD_APPLE_GAP`, 20 ticks, times its number: about 2 s, 4 s, 6 s…), never in the woodpecker's mark.
  It's announced once, with its own falling notes: "The last apples are falling." (Round news, after the tick's
  other news: it waits its turn, and gets through a card; "The narrator speaks less, and better" in
  `30-teaching-by-showing.md`.)
- **No winter before 45 s** (`SNOW_FROM_MS`): snow in the first half-minute starved short snakes.
- **Mushrooms never sprout within 2 cells of a head:** nobody could see one appear in front of them in time.
- **Golden apples, leaves and mushrooms land somewhere quiet** (the farthest of 8 tries from every head), so each is a
  race you can see.
- **Online** (the general rules: `22-play-with-friends-online.md`): each food row carries its kind, a bead's colour and
  owner, its heat and whether it's cooked, and a spat mushroom's strength (`MealRow` in `online.js`), and each snake's
  row its `mealMs`; the events say what was eaten, what rotted (an apple or a bead, and the bead's colour), what baked
  or burned to ash, what came, and where the last apples started to fall (`lastApples`).

### Rivals see food as it is

Rivals see other snakes a quarter of a second late, like a person's reaction, and food as it is now (seen late, they
chased where a beetle had been).

- A rival aims where a fleeing beetle is heading, from the way it faces and its pace, which anyone can see: straight on,
  then away from the nearest head toward a burrow nearer than `BEETLE_HOME_REACH` (7), and diving in. A cornered one (a
  head within `BEETLE_DIG_FEAR` and no burrow in reach) digs in where it is and stays put until it's gone. Every move
  the search tries moves every beetle that's out, and from where each search ends each chase is played out.
- Catching sooner counts twice what a step closer to an apple does (`BUG_HURRY`; Gobbler's `hurry` is 1.5, so it keeps
  after a running beetle longer than anyone), so a catch in hand isn't dropped for an errand.
- Rivals see every burrow on the board, as a person does (`view.burrows`): a dug one the moment it's bored, a closed one
  the moment it closes.
- They go for a digging beetle when they can get there first and in time, and leave one they can't reach before it's
  under. They predict a cornered beetle's dig by the engine's rule as their search moves it, and the burrow it leaves,
  which a second beetle may run for.

### Less fruit, more beetles

The owner wanted food "a bit too plentiful most of the time" made scarcer, and more beetles. With the rivals hunting
beetles well, beetles carry more of the food (this section also holds what "Fewer beetles after all" settled).

- **Up to two beetles at once**, above ground or under (`BEETLE_MAX`), coming out at 0.008 a tick (`BEETLE_CHANCE`)
  while fewer are out, from 15 s (`BEETLE_FIRST_MS`) and in sudden death too; one in six is golden
  (`GOLD_BEETLE_CHANCE`), about two a round.
- **A beetle scurries from a head within 6** (`BEETLE_FEAR`) at half a snake's speed, running for a burrow nearer than 7
  (`BEETLE_HOME_REACH`), and dives in.
- **The escape band: at least a third** (the owner, 31 October 2026: "Yeah, I feel it should be at least a third of the
  time."). Escapes from a chase are kept at 33–45%; with `--census`, the simulation's `--check` fails a run outside it.
  A chase counts from a head within 6 cells, fixed (`CHASE_NEAR` in the simulation), so a change to how soon beetles take
  fright is measured on the same chases.
- **A cornered beetle digs in:** with a head within 6 (`BEETLE_DIG_FEAR`) and no burrow nearer than 7, it stops and bores
  into the bark for 4 ticks (`BEETLE_DIG`, under half a second). It can still be caught while it digs; then it's
  underground and comes out of a burrow later, as after a dive. It's a race the beetle wins from an approach: come
  straight at it from where it starts digging and it's gone two ticks before you're there; a head already nearer, or
  one that cut it off from its burrow, still catches it. Knocked aside by the woodpecker or nudged by a cough, it
  scurries out of its hole, and may dig again where it lands.
- **A dig leaves a burrow** (`BURROW_FROM_DIG`), counting toward the three burrows at most (`BURROW_MAX`): past three, the
  one unused longest closes over, growing shut first (see "Burrows grow shut"). Closing over when unused is off
  (`BURROW_HEAL_MS` 0, kept as a switch): the cap already makes the burrows follow the hunting.
- **Burrows keep apart** (`BURROW_SPACING` 10; the owner: "2 or all 3 of the burrows end up clustered really close"): a
  new burrow opens at least 10 from the others whenever there's room (the quietest of a few such spots), and a dig nearer
  than 10 to a burrow takes its place: that one closes over.
- **The dig's cue:** it stops, wiggles and trembles; sawdust sprays every 60–130 ms; it sinks, up to 45% smaller and
  darker, into a collar of sawdust that thickens as it goes. Gone, the collar closes and the burrow's there without a pop
  (it was bored, not cracked open), freshly bored: a raw pale rim, and splinters torn out past a ring of its sawdust. It
  holds that for 1.2 s and settles into an ordinary burrow by 4 s. With reduced motion it's half sunk and still, with no
  spray.
- **A burrow closing over** fills with a plug of sawdust from the middle out, a cushion of the log's own dark olive moss
  creeps over it, and it fades into the bark with its cracks in about 1.1 s, throwing a few specks of sawdust and moss;
  with reduced motion it's filled and mossed at once, then fades. Both looks are timed on the page's clock from when it
  first drew the burrow, so watched at 4× they last a quarter as long in game time.
- **The sound:** the dig is a quick scrabbling bore (about 450 ms: legs scratching, a rasp sinking into the wood, a low
  grind a phone can hear, a puff of sawdust), heard as yours when your head is the nearest, otherwise as a rival's, whose
  legs' scratches skip the rival dulling so it's heard over the sudden-death music. The dug dive and the burrow it leaves
  are silent, since the bore said it. A beetle going down a burrow or coming up keeps its quiet scrabble (`scrabble`). A
  burrow closing over is a muffled crumble (`heal`, about 350 ms: grains of sawdust trickling in, then a hushed pat as
  the moss settles), the world's, about level with a beetle's skitter; two digs ending together make one crumble. Their
  levels as rendered are in `docs/archive/design-food.md`.
- **The lessons**, each when the banner is free for it, else the next such moment teaches it:
  - a dig within `DIG_NEAR` (the dig's length plus one, across and down) of your head, one you could still catch: "A
    cornered beetle digs in. Grab it before it's gone!";
  - the first burrow a dig leaves in a round, anywhere on the log: "A beetle that digs in leaves a burrow behind." With
    the dig's lesson not told yet, that burrow teaches both: "A cornered beetle digs in, leaving a burrow.";
  - the first burrow starting to grow shut once the burrow's lesson is told, once a round, for watchers too: "Old burrows
    grow shut: beetles go in, none come out." (see "Burrows grow shut");
  - a dig that takes a nearer burrow's place, the first time in a round: "A beetle that digs in by a burrow takes its
    place."
- **The Field guide:** the Apple row says how many are on the log; the Beetles row tells the dig as a race (come straight
  at it and it's gone, so be nearer, or cut it off from its burrow), and the Burrows row the burrow a dig leaves and the
  growing shut. Their words are in `game/friends.js`, written from the tuning.
- **The voice:** a beetle that digs in and gets away: the rival that cornered it (the nearest head as it started, within
  6) says so as it goes under, at most every 30 s (Gobbler: "NO! My snack went DOWN!"; Mason: "Diggus escapus.";
  Desperado: "Varmint went to ground."; Mute *knocks on the bark, then shrugs*; Copycat: 深挖洞，广积粮！). One caught
  mid-dig is just a catch, and nobody speaks for you.
- **Online:** each beetle's row carries its dig (`digUntil`, `BeetleRow` in `online.js`); the beetles underground
  cross as `game.unders` (when each comes up, when it would fly off, where it went down, golden or not: `UnderRow`);
  the burrows as the engine keeps them (where, the tick each opened, when a beetle last used it, whether a dig left it:
  `BurrowRow`); and the events `dig`, `dive` (and whether it was a dig), `burrow` (a dug one opening) and `heal` (one
  closing over). Each is checked before it's drawn: a kind that exists, cells on the board, a burrow on the board and
  opened on a tick. The knocks and the promised landings are the woodpecker's ("Online" in `38-the-woodpecker.md`).

### Burrows grow shut

A burrow past the cap doesn't close over at once: it grows shut (the owner's playtest, 27 October 2026; its text, with
how it was tested and measured, is in `docs/archive/design-food.md`).

- **The rule.** A new burrow that opens while three are open (`BURROW_MAX`) starts the stalest growing shut. It takes a
  random time between `BURROW_SHUT_MIN_MS` and `BURROW_SHUT_MAX_MS` (6 and 14 s of game time; the engine's seeded
  randomness) and then closes over. The cap counts only open burrows, so there are three most of the time and briefly
  four. A dig nearer than `BURROW_SPACING` to a burrow also starts that one growing shut. While it grows shut, a scared
  beetle can still run for it and dive in, but none comes out of it: `freeBurrow` skips it, so a beetle below comes up
  out of an open one, or waits.
- **The rivals** read it by the same rule, from `view.burrows` (each one carries `shutFrom` and `shutAt`): a burrow
  growing shut is a home a scared beetle runs to and dives into until it closes, as in the engine.
- **The cue** (`drawShutting` in `render/burrows.js`), evenly over its time:
  - the opening's area shrinks evenly to a tenth (`SHUT_HOLE`), keeping its dark rim, as sawdust fills in from the rim,
    lumps of it creeping over the opening's edge; its pale rim and specks round it stay;
  - the bark's grain grows across it, along the log;
  - four cushions of the log's moss grow in over the rim one after another, each to about a third of a cell across;
  - its cracks fade to half.
  At the end comes the closing over (`drawHeals`, see "Less fruit, more beetles"): it starts from the look it had grown
  to, packs the plug in under its moss, then the big cushion and the fade. Then a faint scar (a greyed oval of sawdust
  with the grain across it, at 0.45) stays where it was, fading over `SCAR_MS` (20 s). With reduced motion the growing
  shut is as it is (a slow change of look, not motion), and the closing over keeps its calm version.
- **The sound:** silent while it grows shut, then the crumble (`heal`) as it closes over.
- **The lesson** (once a round, once the burrow's lesson is told, the first time the banner is free for one starting to
  grow shut): "Old burrows grow shut: beetles go in, none come out."
- **The Field guide's** Burrows row says which one grows shut (past three, the one unused longest) and what it means for
  play (beetles still go in, none come out), not only that it does: alone, that would read as a timer.
- **Online** (protocol 11): each burrow row carries `shutFrom` and `shutAt` (−1 while it's open), checked before it's
  drawn (a row that shuts before it started counts as open), and the event `['shut', x, y, at]` marks one starting to
  grow shut.

### Beetles and the woodpecker

The owner (29 October 2026; entry 2m): beetles should "quickly try to escape down their burrow when woodpecker targets
their little island"; burrows ran out as the woodpecker pecked them; and beetles under a strike teleported. The rules
(`crawl`, `beakDepth`, `beakGap` and `knocks` in `engine/`):
- **Burrows keep up.** A beetle due up from underground with no free burrow cracks a new one open where it's quiet,
  by `beetleOut`'s rule (`BURROW_SPACING` apart, at most `BURROW_MAX` open). None comes up under the beak: `freeBurrow`
  and `placer` leave the mark out.
- **The mark is danger, as a head is.** While the woodpecker aims, a beetle within `BEETLE_FEAR` of its mark scurries
  away from it and for a burrow in reach, and dives in. On the mark, it plans against the strike: a burrow in reach it
  can get to in time (pulled there straight, twice as hard as a head-scared run), else off the mark by the shortest
  way, else it digs in if the dig is done before the strike. A dig there leaves no burrow, and it comes up elsewhere. A
  dig already under way that won't be done in time is dropped, and it runs.
- **No teleporting.** A beetle still on the mark at the strike is the bird's: a `knock` with no landing, a puff and a
  soft crunch, no ring through the aim. Its lesson, the first time: "The woodpecker eats beetles too!". The Field
  guide's Beetles and Woodpecker rows say so.
- **The rivals** move each beetle in their search by the same rule (`bugCrawl` in `ai/beetles.js`, with `E.beakDepth` and
  `E.beakGap`). So a beetle bound down a burrow beyond the mark isn't chased, and one running off it toward a rival is.
  One gap, not worth its code: the AI's copy lets a fleeing beetle cross a body lying on the mark (the mark's cells
  read as holes there), where the engine stops it.
