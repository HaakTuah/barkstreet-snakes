## Food and the world

- **Everything moves smoothly.** Food used to snap to whole pixels, so its small bob moved in visible steps; now it's drawn at its true position. Each piece has its own shadow on the bark, apart from the sprite, so it lifts off it. **New food pops in** with a little overshoot, and at the start of a round the board's food pops in one piece after another. A mushroom that withers or a golden apple that rots goes with a small poof.
- **Apples** bob up off their shadows, squash a touch as they come down, sway their leaf, and now and then a glint winks on them.
- **The golden apple** bobs too, in a glow that breathes, with a small rotating sparkle star (a non-hue cue) and glints twinkling round it. Instead of blinking before it rots, it dims calmly.
- **Mushrooms** sway on their stems, breathe, and let go of a spore now and then. In their last few seconds they wilt: they lean over, shrink and fade.
- **Beetles** (your Flåklypa idea): a jewel beetle, emerald with a gold rim, that comes out where it's quiet and walks the bark cell by cell with scuttling legs. Each step sets off and settles (step, pause: a beetle's walk), and it turns smoothly. Between steps it's never quite still: its feelers wave, it breathes, and every few seconds it lifts its wing cases and buzzes its clear wings, as if about to fly off. Scared, it trembles and its feelers twitch. It pops in when it comes out. It's the one food that moves, so it adds a chase to the core loop. **Tuned in the simulator (250 seeded rounds per setting):** a beetle that bolts as fast as a snake was a death trap (rounds 75 s -> 57 s, and 20% of deaths happened within 4 cells of a beetle, as snakes followed it into tight spots); one that scurries at half a snake's speed from any head within 4 cells leaves rounds as they were (72 s, deaths near a beetle 5%) and still makes you chase: 89% are caught, after about 4 s of pursuit. The AIs value one at what it's worth (two apples) and, since round six A, see it as it is (they used to see it through their usual reaction delay, and chased where it had been). A skitter when one appears, a crunch when you catch it, and Gobbler, Desperado, Sniper and Mason have something to say about it (Mason: "Scarabaeus captus!"). (*Since round six A* up to two are out at once, in sudden death too, one scurries from a head within 6 cells, and a cornered one digs in: see "Less fruit, more beetles".)
- **Remains:** a dead snake falls to pieces: glossy beads in its own colours and markings, popping in from head to tail. Wildcard leaves the Stars and Stripes (and an orange-tan head), Mute the colour of its last mood, Joker purple and amber, Vulture black with a white ruff and a pink head, Mason marble, Colonist its cream strap, Copycat dashed rings, Ghost pale see-through beads, Star and Copycat their rainbow as it ran down the body when they went (the pieces they burst into too), and a friend online its spots. They bob gently, each on its own beat. A light rim and a dark edge keep every bead readable on the bark. (They used to be roast drumsticks, ringed in the snake's colour: the same for every snake, and a snake turning into chicken was a strange thing to see.) **Since round four** a dead snake leaves a bead on every other segment (at least 3), not one on each. **Since 2 November 2026** each bead stands for its stretch of the body, from its own segment to the next bead's: it takes the fills those segments had as last drawn, half and half (its own upper left, the next's lower right), and their markings (Mason's rose vein if either has it, Colonist's two straps crossed), so Joker's beads are purple and amber, Wildcard's run collar, stars and red and white stripes, and nothing is squeezed. A crash's and a cut's beads take their own segment's look the same way. Beads go off as their time runs out (about 14 s), as apples do: a dull film and brown spots come over them (a dark bead, Vulture's black or Wildcard's navy, grows a pale mould instead, a grey film and grey-beige spots, so its rot shows as early as any other's), they shrink and dim, and go in a puff of their own colour. You squash your own beads (see "Choking on your own tail" in `41-crashes.md`).
- **Burrows** (the beetles' homes): an oval opening in the bark, splintered round its rim with a little sawdust, and cracks that spread from it over about half a minute, each burrow's its own. Wood splits along its grain, so the cracks run along the log either way from the hole, tapering, now and then forking (they used to fan out in every direction, and with a beetle beside them they looked like a spider's legs). The first beetle cracks one open where it's quiet; later ones come out of a free burrow or, half the time, open another (up to three). A scared beetle runs for a burrow within 6 cells and dives in (it shrinks away into the hole), then comes out of another a second or so later. Burrows are safe to cross, and nothing grows on them. **Tuned in the simulator (300 seeded rounds):** beetles are still caught 90% of the time (91% before), and rounds are as long (68 s median, 69 before). **Since round six A** a cornered beetle's dig leaves a burrow too, freshly bored rather than popping open, and past three the one unused longest closes over (sawdust and moss fill it; since the owner's playtest it grows shut over 6 to 14 s first, beetles going in but none coming out: see "Burrows grow shut"); knocked food never lands on one, nor, since the verify pass, a dead snake's beads or a tail a crash knocks off (before, a bead on a burrow sat there 2 to 3 s a round). A bead a choke spits, or food a cough nudges, can still roll onto one (the roll's rule has no burrow in it, and the rivals work rolls out by the same rule): about once in 40 rounds. See "Less fruit, more beetles".
- **Holes** are pits in the log, one per hollow, traced along the cell edges: a torn inked lip, a dark floor, the far wall lit from the upper left, splinters over the rim and sawdust round it, and at the board's edge a notch bitten out of the log. They lie on the static layer under everything, so a body bridging a hole is drawn across it. A strike paints again only the box round its new holes. (Until round four they were ragged gouges, then one dark disc a cell, which read as bubble wrap.)
- **The corner leaves move onto the frame** and never cover playable cells.
- **Borders: Sovereign's realm and Colonist's colonies**, **Sovereign's realm grows and moves** and **Colonist's
  flags**: their rules are in `44-realms-and-colonies.md` ("Borders, not force fields" and the same names), and their
  text as it was in `docs/archive/design-realms.md`.


### Food on the log

How much food there is and how long a meal keeps you, as round four and round six A settled it (their text, with what
was tried and measured, is in `docs/archive/design-food.md`).

- **Two apples all round** (`APPLES`; one in winter, `SNOW_APPLES`: see "Weather"; a food season adds or takes one:
  see "Food seasons"): eaten or rotted, another drops somewhere. Beetles carry more of the food (see "Less fruit, more
  beetles").
- **A meal keeps you 12 s** (`HUNGER_MS`), one clock for the whole round (the owner, 9 November 2026, #616), so a
  meal is a trade-off to the end (entry 6, part 3): late in the round it buys life but costs room in a shrinking log.
  Its length is set by the endgame test, rivals that always eat and rivals that never eat in the woodpecker's frenzy
  against ones that weigh each meal ("The endgame: a meal is worth the life it buys" in `39-the-rivals.md`): at 12 s
  never eating does clearly worse, and always eating comes out even (why: "Hunger read against that length" there;
  #655 would make length cost room).
  Each snake keeps how long its last meal keeps it (`mealMs`, carried online), and its tag's bar is measured against
  that, so it's full after any meal. Under `HUNGER_WARN_MS` (6 s) left, the tag shows it's starving: the bar in Berry,
  a ring pulsing round the tag, and "starving" for a screen reader.
- **Starving is decided after eating:** a snake whose head reaches food on the tick it would starve eats instead
  (`ateTick`, in `engine/food.js` and `engine/step.js`). A mushroom doesn't save it, nor does its own bead, which it
  squashes.
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
- **More golden power food,** since golden powers stack and the rivals use them: a gust of wind may blow in a golden
  leaf (`LEAF_CHANCE`, 0.25 a gust, one at a time), a rain spell may bring up a golden mushroom (`GOLDCAP_CHANCE`, 0.55,
  one a spell at most), and one beetle in six is golden (`GOLD_BEETLE_CHANCE`; see "Less fruit, more beetles").
- **No winter before 45 s** (`SNOW_FROM_MS`): snow in the first half-minute starved short snakes.
- **Mushrooms never sprout within 2 cells of a head:** nobody could see one appear in front of them in time.
- **Golden apples, leaves and mushrooms land somewhere quiet** (the farthest of 8 tries from every head), so each is a
  race you can see.
- **Online** (the general rules: `22-play-with-friends-online.md`): each food row carries its kind, a bead's colour and
  owner, its heat and whether it's cooked, and a spat mushroom's strength (`MealRow` in `online.js`), and each snake's
  row its `mealMs`; the events say what was eaten, what rotted (an apple or a bead, and the bead's colour), what baked
  or burned to ash, what came, and where the last apples started to fall (`lastApples`).

### Food seasons

Each round draws its food season, as it draws its weather, so rounds don't feel alike (the owner, 29 October 2026, in
`docs/handoff/queue-specs.md`, "2i"): lean one round in four, normal one in two, plentiful one in four (`SEASON_ODDS`;
what each changes: `SEASONS` in `tuning.js`).
- **Lean:** one apple fewer from the first beetles (`BEETLE_FIRST_MS`, 15 s; in the opening, while everyone is at its
  smallest, the log keeps both: #616), never none (in winter it stays one), beetles half as often, and a meal keeps you 70% as
  long (12 s becomes 8.4).
- **Plentiful:** one apple more and beetles half again as often (winter keeps two). Snakes grow long, and the log crowds.
- **Seen and taught:** a lean or plentiful round says so in a banner after Go ("A lean season…", "A season of
  plenty!"), its colour dry bark or fresh leaves, and the first time each comes in a visit a lesson follows with its
  rule; a normal round says nothing. The Field guide's "Seasons" row (after the apple) holds the rule. Everyone, the
  rivals included, sees the season (`aiView().season`).
- **The rivals play it** (`readAppetite` in `ai/food.js`): in a lean round none is ever too fed to eat (Ghost's and
  Sniper's `hungryBelow` doesn't apply), and in a plentiful one each weighs growth past `AI_CROWD_KEEP` times its
  endgame keep against the room it costs, as everyone does from the woodpecker on ("The endgame: a meal is worth the
  life it buys", `39-the-rivals.md`). A lean round's sparing needs no rule of its own: with fewer meals less stamina
  comes back (2u+), and its snakes use their powers about a fifth less.
- **Online** the host draws the season and sends it with the weather (`sky`, protocol 29).
- **Measured** (the shipped build, 200 rounds each on seeds 3 and 11; develop had 3% of deaths starved, and every
  round's middle half ran about 172 to 187 s):
  - **Starving** is 5 to 6% of all deaths: 15 to 18% of a lean round's, 3% of a normal one's, 1 to 2% of a plentiful
    one's. Fewer apples and beetles alone moved a lean round only to 8% (beads are most of the food), hence the
    shorter meal.
  - **Length:** snakes are about 28 long when the woodpecker comes in a lean round, 38 in a normal one and 40 to 42 in a
    plentiful one. Meals (bites, not growth) run about 19, 26 and 29 to 32 a snake-minute.
  - **Deaths by cause** shift by season: a lean round has fewer deaths against bodies (30 to 33% against 45 to 49%)
    and more neck cuts (15 to 16% against 7 to 8%) besides the starving; a plentiful one has 19 to 26% self-crashes (a normal
    one 21%).
  - **Round lengths** barely move (medians 180 to 184 s each): the woodpecker at 2:00 and sudden death set them, and
    every round but one or two in 200 reaches the woodpecker. A lean round's middle half runs 170 to 189 s.
  - **Powers:** a plentiful round's snakes use theirs 4 to 12% more a minute than a normal round's (4.7 to 4.9 against
    4.4 to 4.5): more, not spam, since meals put stamina back (2u+). Rivals blind to the season used 15% more, and at
    `AI_CROWD_KEEP` 2 the weighing cancelled most of the season (meals 7% over a normal round), so it is 3. A lean
    round's use theirs about a fifth less (3.4 to 3.7).
  - **Every trademark** keeps its place against the field (`--signatures`), and per-rival wins move within the noise
    of about 90 rounds each (at most 13 points either way, as many up as down; Gobbler 20 to 9%, Creeper 19 to 32%,
    Ghost 34 to 24% and Sniper 39 to 27% are the ones to watch). Ghost's and Sniper's drop isn't their lean play: the
    same rounds with their fed restraint kept in a lean round give them 0 to 2 points more.
  - **The season play, head to head** (rivals that play it against a copy blind to it, 600 paired rounds on seeds 21
    and 22, at `AI_CROWD_KEEP` 2): even in wins, place, time alive and kills, eating 2 less a snake a round, so the play
    is a matter of character, not an edge (#602 asks the owner whether to keep it).

### Apples rot

So nobody camps an apple, as crashes, not deaths, settled it (its text, with what was measured, is in
`docs/archive/design-food.md`).
- **An apple lasts about `APPLE_TICKS`** (110 ticks, give or take a quarter: about 10 to 16 s early in a round, 8 to 12
  s once it's at full speed), twice as fast in winter (see "Weather").
- **It goes off as it goes:** it bruises (brown spots), then rots (brown, wrinkled, its leaf dead, a fly circling),
  shrivels and goes with a brown puff.
- **A fresh one drops** from the tree above somewhere else: every new apple mid-round drops in from above, like a
  windfall.

### Food in the fire cooks

Fire spreads onto food (see "Lightning and fire, fairly" in `05-weather.md`), as crashes, not deaths, settled it (its
text is in `docs/archive/design-food.md`):
- **Baked:** an apple or a bead that's been in a burning cell for `COOK_TICKS` (18 ticks) is baked, worth
  `COOKED_GROWTH` (2), steaming, glazed and split; it stops rotting for a while (it lasts at least `APPLE_TICKS / 2`
  more).
- **Ash:** any food but a beetle (which runs) left in for `ASH_TICKS` (45 ticks) goes to ash in a grey puff.
- **Getting at it** means waiting for the fire to die down, or taking the heat ("Fire on snakes" in `41-crashes.md`).

### Mushrooms look poisonous

A mushroom shrinks whoever eats it, so it looks it, as the first seconds settled it (its text is in
`docs/archive/design-looks.md`, under "Looks"):
- a violet haze round it that breathes, two wavy violet stink lines rising, and violet spores drifting off it
  (`render/food.js`);
- eat one and you go queasy green for a moment, in a puff of spores.

### Rivals see food as it is

Rivals see other snakes as a person would notice them, a quarter of a second late near them and later across the log
("What a rival sees" in `39-the-rivals.md`), and food as it is now (seen late, they
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
  soft crunch, no ring through the aim. Its lesson, the first time: "The woodpecker eats beetles too.". The Field
  guide's Beetles and Woodpecker rows say so.
- **The rivals** move each beetle in their search by the same rule (`bugCrawl` in `ai/beetles.js`, with `E.beakDepth` and
  `E.beakGap`). So a beetle bound down a burrow beyond the mark isn't chased, and one running off it toward a rival is.
  One gap, not worth its code: the AI's copy lets a fleeing beetle cross a body lying on the mark (the mark's cells
  read as holes there), where the engine stops it.

## The golden apple's worth (2z, measured 3 November 2026)

The golden apple (+3) doesn't pay. The rivals eat every one, 19 ticks after it comes up, and only 12–15% are contested
(another head within 5 cells). Played on from each eat with and without it (`tools/dev/fork-moves.js --move golden`; 903
eats on seeds 101 to 104), eating one gains −0.01 ± 0.05 places and costs 2.9 ± 1.2 s alive: the length outweighs the
meal. "The apple of vigour" (both rests refilled as well) adds +0.01 ± 0.02 places, since the rests are mostly ready when
it's eaten (0.36 of 2 still resting). So 2z left the apple as it was, to be measured again against the one stamina
(the owner's question, #460; answered, and built by 2u+ below).

**2u+ (PR #560):** the golden apple now also fills the bar (only its growth's share of stamina banks) and gives a
shield (`GOLDEN_SHIELD_MS`, 10 s): the next crash you live through costs no tail (the stun stays: without it, snakes
bounced straight back into what they hit), and the shield is gone; boxed in, it can't save you, and where only the
tail a crash sheds would leave you room it isn't spent (you pay the crash as anyone would). Its cue is a cream ring
round the head (`render/shield.js`), flickering over its last 2 s and bursting when it takes a crash; its lesson comes
with your first golden apple. Forked at each eat as it ships (seeds 524 and 525, about 237 eats each), the full bar
comes out a hair below even (0.000 ± 0.027 and −0.111 ± 0.037 places: rivals flash more than pays, #536, and a full
bar invites it), and the shield on top even (−0.025 and +0.017 ± 0.030 places) while saving a fifth of a segment at
10 s: it never makes anyone safe. The +3 itself is a little ahead of a plain +1 there, within noise (+0.15 ± 0.10 places on each seed),
where on 2u it cost (−10.5 ± 4.1 points of wins on seed 521). Neither extra moves whole rounds; they are built as
the owner asked, and part 7 prices every power. Everyone sees a shield by its ring, the rivals too (`aiView()`), and
each knows its own: a rival gives a shielded head twice the berth (`ai/risk.js`), so nobody can ram rivals with it.
Shielded itself, a rival keeps its usual berth: fearing a head-on half as much then cost it 0.12 ± 0.04 places a
golden apple.
