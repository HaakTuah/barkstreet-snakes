## The woodpecker

A great spotted woodpecker comes for the log in three acts, and it is what ends a round. The rules as the
round's arc, round four, round six A and the owner's playtest settled them (their text, with what was tried and measured,
is in `docs/archive/design-woodpecker.md`). Elsewhere: how beetles flee its mark ("Beetles and the woodpecker" in
`04-food-and-the-world.md`), the last apples that fall meanwhile ("Food on the log", there), its perch on a phone
("The woodpecker's perch" in `31-phones.md`), the sound's levels (`21-sound.md`), and a flag it pecks out ("A pecked
flag is a lost colony" in `44-realms-and-colonies.md`).

### Its three acts

Entry 6 (round six C; the owner, 19 October 2026: the round had "just 2 stages. Chill start where nothing happens, then
sudden elimination"). Each act starts at a time drawn in its window after the one before (`ACT_WATCH_MS`,
`ACT_PECKS_MS`, `ACT_FRENZY_MS` in `tuning.js`; `game.acts`, drawn by the host), so a round is never quite predictable;
`E.actOf` gives the act. A playtest pins them in the address: `?acts=70,140,200` (seconds, three rising times).
- **0. Calm,** from the start: food, weather, beetles.
- **1. The watcher** (50–75 s in; the owner's starting point, 60–90 s, then 50–80 s and 50–80 s, made rounds of
  246 s at the median, against the draft's 3 to 3.5 minutes): it lands outside the board and scouts it. No pecks. It watches a spot on the log
  (`w.gaze`, anywhere that isn't a hole), then moves to a new vantage 2 to 4 times (`WATCH_LOOKS`), its last look
  `WATCH_LAST` (1.6) times as long as each of the others; each spot one it could start cutting from as things stand
  (`cutSeeds`: the edge of the most log per snake, see "It cuts a shape"). **Its gaze is a tell:** act 2's first
  outline starts within `GAZE_NEAR` (4) cells of where it looked last, while it can (measured: 86–89% of rounds).
  - **Shown on the log:** where its eye settles, a pale diamond of its attention lies over the spot, brightest at the
    middle, its dotted rim round the cells within `GAZE_NEAR` (`render/watch.js`): where its first cut may start, and
    the ground the rivals weigh. It eases in over a second at each new look, steady, under the snakes. Its head alone
    showed only a row from a side perch, or a column from a phone's ledge, while the rivals read the spot itself: the
    diamond shows anyone what they read.
  - **Its look:** its crest raised while it watches (its red nape, up), its head cocked at the spot, and a soft "kik!"
    as it settles at each new vantage.
- **2. The first pecks** (40–60 s after it came): it cuts its outline `CUT_STEP_2` (2) cells a peck, a rest of
  `FIRST_REST_TICKS` (50, about 5 s) between, while food still grows.
- **3. The frenzy, sudden death** (35–50 s after act 2): nothing new grows but the last apples, and the weather clears
  (a meal keeps you as long as all round: "Food on the log" in `04-food-and-the-world.md`). It cuts `CUT_STEP_3` (3) cells a peck, a cell more for each piece fallen in the
  frenzy (`w.fury`) up to `CUT_STEP_MAX` (5), each rest `PECK_REST_TICKS` (20) times `PECK_HUNGRIER` (0.85) for each of
  them, never under `PECK_REST_MIN` (8); down to the floor, where it fights.
- **Each peck:** eyed for `PECK_AIM_TICKS` (17, about 1.6 s), struck, then the rest.
- **Its look in the frenzy:** its eyes glow red, its feathers darken, and its crest ruffles up dark red, coming over it in a
  second and a half and then steady (no flicker, with reduced motion too), and the page's sky dims (`html.frenzy` in
  `style/base.css`).
- **The music** has a stage for each act (`audio/music.js`): the watcher adds a low, slow drone under the mid-round
  loop; the first pecks add its own drum, a quick roll of light knocks at each bar's end; the frenzy is faster (116 bpm),
  in a minor key with wood-block knocks and toms, the drum at every half bar.
- **Measured** (seeds 3 and 11, 200 rounds each; with the outline, part 2): rounds of 218 and 219 s at the median (181 and
  182 with the woodpecker at 2:00, 214 and 211 s with the acts' patches); deaths spread over the acts, calm 7 and 7%, the
  watcher 19 and 13%, the first pecks 15 and 21%, the frenzy 59 and 60% (at 2:00, about four in five came after it);
  sealed deaths (out within 3 s of a strike) 2.5 and 1.4% of sudden death's (6.2% at 2:00, 9.1 and 6.1% with the
  patches).

### It cuts a shape

Entry 6, part 2 (the owner, 31 October 2026: "what if it takes few chunks at once, but it is cutting out a shape, and
when that shape is no longer attached to anyhting, it falls?"; "No outline should be banned from falling, but ideally,
it never takes out half the trunk."). It never melts the log: it plans a piece and cuts round it (`engine/outline.js`).
- **Where: the most log per snake.** Each snake's region is the log its head reaches first (`regions`: a flood from
  every head, bodies passable, ties nobody's); it cuts in the biggest (ties: the longer snake's), a rule, never chance,
  so whose piece goes next never decides a round. Its first, in act 2, from where it looked last.
- **What:** a piece and its cut (the log cells beside it) `CUT_OF_REGION` (0.25) of that region, at least `CUT_MIN`
  (8) cells and at most `CUT_SHARE_MAX` (1/8) of the log, grown from a seed on the region's edge with the board or an
  old hollow more than `PECK_CLEARANCE` (4) from every head, a cell at a time (the one with most solid sides, then
  nearest the seed): of `CUT_SEEDS` (10) tries, the one whose cut is the least of it, so edges and hollows do the work.
  Never one with a head on it, and never one that halves the trunk (the rest of the log stays one piece, but for
  islands that stay no bigger than a piece; crumbs of `PECK_NO_ORPHANS` (2) cells or fewer go with the piece). Failing the biggest region: any, then with the cap at a third
  of the log; failing all, it waits (or, in the frenzy at the floor, fights).
- **How: a few cells a peck, as a perforation.** It pecks the cut in order along it, every other cell first (dots), then
  the rest, so the piece hangs on by the cells between until its last peck; each peck takes the next cells it may: more
  than `PECK_CLEARANCE` from every head, then any off a head, shutting nobody in. A cell it may not take yet waits its
  turn; with none it may take, it waits, and after `CUT_GIVEUP_TICKS` (100) plans elsewhere (its holes stay).
- **The last peck cuts the piece loose** (2s's rule, "The log stays one piece"): its mark shows the piece, shaded, the
  whole aim, and it falls with the strike, food and all; before the frenzy, a piece at the board's edge stays instead, an
  island, ringed pale in its mark (3+, "Islands that stay"). Measured: about ten pieces a woodpecker round, 27 cells each; the
  biggest in a round 51 cells at the median, 60 at most; none ever left the log in pieces. Where it cuts doesn't pick
  the loser: of deaths within 10 s of a piece falling, the snake whose log it was 42–43% (chance, among those alive, about
  41.5%); the last snakes never ended on islands of their own (part 2's numbers, before 3+'s islands: "Islands that
  stay" has them since).
- **It may cover food:** food in the mark is knocked aside at the strike (see "It knocks food aside").
- **The cue:** each cell its cut has still to go is nicked on the bark, a short dark slit with a pale rim
  (`render/cut.js`), so you can watch the line close round the piece; the pecked ones are pits.
- **The wash** (#612: a person sees the piece the rivals are handed, `aiView`'s `piece`, not only the nicks): while any
  nick is left, the piece lies under a faint dark wash with a dashed pale edge, exactly `piece`'s cells (crumbs
  that go with it included) and no more. It has none of the cut-loose
  shading's sliding streaks, so the two differ by more than darkness, and it stays still with reduced motion. The last
  peck aimed, no nick is left and "The log stays one piece" takes over, the shading deeper (below). A piece that will
  stand as an island (before the frenzy, at the board's edge: 3+) has no wash: a solid pale rim instead, from the first
  nick (`pieceStanding`; any crumbs or out-of-reach island it takes in keep the wash, as they fall), so what will fall and
  what will stay show the whole cut.

### The floor

It cuts only while the log is `CUT_MIN` more than the floor: `FLOOR_PER_LENGTH` (2) times the living snakes' lengths
together (growth to come too), never under `FLOOR_MIN` (24) cells (`logFloor`). An outline that would go past it is
given up (its holes stay). The floor falls as snakes starve or go, so it may cut again, a little: a tile here and there
in the very late game.

### Then it fights

At the floor, in the frenzy, it pecks at the snakes instead (`engine/fight.js`), aimed and warned like any peck:
- **Whom and where:** the snake with the most log (`regions`, the same rule), where its head will be as the strike
  lands if it keeps on the way it's going (`PECK_AIM_TICKS` moves ahead, stopping at the log's end), or as near that as
  it may, in its region, so it must turn or slow to dodge; its plus is the tile and
  the log cells beside it (`w.zone`), the tile its mark (`w.target`).
- **Fair:** the whole plus more than `FIGHT_GAP` (2) cells from every head as it aims, shutting nobody in, and never a tile
  that would cut a piece loose; it has the aim's warning to steer clear. A rest of `FIGHT_REST_TICKS` (30) between.
- **The strike:** a head on the ground in the plus takes a crash (`CRASH_LOSS` off and stunned, as any crash; a golden
  apple's shield takes it, except at its smallest: out, "Pecked!"), never a fall: the tile under a head isn't taken. Otherwise
  the tile is a hole, food on it knocked aside.
- **The cue:** its plus shaded red cell by cell (what the rivals keep out of), a red ring round it tightening as the strike
  nears, a tick on each arm, the tile marked as any.
- **Measured:** a fight in 18–22% of rounds, two or three strikes in each, each aimed into a head's path; the rivals turn
  aside every time (they read the plus; a person must too).

### The woodpecker plays fair

It won't shut you in: no peck leaves any snake less room than its length (it waits instead). Room is a timed flood of
the engine's own (tails leaving, stuns and growth counted) against the snake's length plus what it has still to grow; a
snake already shut in doesn't count. **The peck that cuts a piece loose** counts room as a head could get it: crossing
the piece and the mark within the aim's warning less `FALL_REACT_TICKS` (5, half a second to see it), and never counting
them (`shutsIn`'s `until`), so it's aimed only if every head on the piece can get off in time.

### The log stays one piece

2s. The log is the biggest piece of bark once a peck is out (`cutLoose`); any other piece it cuts loose goes into the mark
from the aim (`w.fall`) and falls with the strike, but for an island that stays (below). No size is banned from falling:
what ends up cut loose falls (a rules test proves it); it plans small (see "It cuts a shape").
- **Islands that stay** (entry 6, part 3+; the owner, 9 November 2026, #611: "maybe not island was a bit harsh. makes
  jumping between them never happen, it was just bad before how each always ended up on each their island on each their
  edge", then, to "a cut may leave an island standing when a jump can reach it", "Yes to all, expertly! and islands
  should always be attached to the edges, one must be able to tell clearly what will fall, and what will stay!"): a
  piece cut off from the log stays standing, as an island, only while it touches the board's edge and lies a jump from
  the log (`LEAP_REACH`, 3 cells of gap or fewer, straight across: `isleHolds`); a piece attached to nothing, or out of a
  jump's reach, falls, in the mark from the aim. The piece it cuts out: **before the frenzy**, one at the board's edge
  stays, an island a cell from the log (one round an old hollow, touching no edge, falls); **in the frenzy**, every
  piece it cuts out falls, as part 2 built it. An island stands only *while*: a later cut that takes the log within its
  jump drops it with that strike, and the outline it plans then takes it in, washed as its piece (`oneTrunk`); never one
  with a head on it that couldn't get off (as any fall: "The woodpecker plays fair"). It plans no island bigger than a
  piece may be (`CUT_SHARE_MAX` of the log; a third in its last try), and crumbs of `PECK_NO_ORPHANS` cells go with the
  piece. Its fight leaves no island (a tile that would split the log is never its aim). Why the frenzy differs: before
  it, islands give the snakes somewhere to hop to and from; in it, the log must keep shrinking, and an island out of reach
  goes, so the last snakes don't each end on one of their own.
  - **The cue:** a piece its outline is cutting that will stand is ringed with a solid pale line from its first nick, in
    place of the wash (`pieceStanding`); as a mark comes that leaves an island standing, the island is ringed so (each
    side that faces the gap or the mark; `render/cut.js`, `newIsles`), brightening as the strike nears; a piece that falls is
    dark with sliding streaks (below). What stays and what falls differ by line against shading, not by colour alone;
    the rim stays still with reduced motion.
  - **Taught:** a lesson the first time a mark leaves an island ("Pale ring: this piece stays. Dark streaks: it falls."),
    and the Field guide's Islands row. The rivals read islands as any land: the holes round them, the jump that
    reaches them, and `fall` for an island about to go.
  - **Measured:** jumps between pieces of log, strikes leaving the log in pieces, and the rounds whose last snakes ended
    each on an island of their own (the census; the PR's table).
- **A head on it:** the mark shows it the whole aim; one that gets off in time lives, one still on it at the strike falls
  with it ("Down the hole!"); it's aimed only if every head on it can get off in time ("The woodpecker plays fair"). A body
  lying over it bridges the new hole, as over any peck.
- **What falls:** food and beetles on it go with it.
- **The cue:** the piece is shaded dark in the mark, with pale streaks sliding down it; at the strike it tips away into
  the pit with a creak and a far-off thud.
- **The rivals** are shown which cells fall (`aiView`'s `fall`), so they never count on food there being knocked aside.

### The strike

At the strike every cell of the patch becomes a hole, for good: holes are only ever added (the squeeze is what ends
rounds, and online play relies on it).
- **Only a head falls in.** A head on the ground in the patch is out ("Pecked!"; on a piece cut loose, "Down the
  hole!"); a head in the air isn't in it. (A fight's strike is a crash instead: "Then it fights".)
- **A body lying over a fresh hole bridges it:** it isn't cut and drops nothing, and the cell is an ordinary hole once
  the tail has passed. A jump whose landing was taken meanwhile comes down on a bridging body, not into the hole under
  it; if that body moves on while the head is still there, stunned, it falls in.
- **What else is there:** a fire in the patch goes out; a burrow is a hole now; food is knocked aside (below); a beetle
  still on the mark is the bird's ("Beetles and the woodpecker" in `04-food-and-the-world.md`).

### It knocks food aside

At the strike each piece of food in the patch is knocked to the nearest free cell outside it (free: no body, food, hole,
fire or burrow; nothing grows on a burrow, and food there would stop it up). Ties go to the one nearest the middle of
the log, then the first by row. It's a rule, never chance, so a rival can work it out, and so can you.
- **The knock:** `E.knockTo` gives a piece's landing (as the crow flies, then nearest the middle, then the first by
  row), and `E.knocks` every landing in the strike's order, each taken before the next, so no two share a cell. The
  strike, the rings and the rivals read that one list. Food with nowhere to go is the bird's. A knocked beetle scurries
  there and stops digging; it may dig again where it lands.
- The strike works its landings out before the heads in its patch are out, so a body it pecks under still lies where it
  lay, and its beads fall there, not under the food.

### The ring is a promise

Through the aim, a faint ring shows where each piece in the mark will land, worked out on the log as it will be at the
strike (`strikeIn` gives the moves left): a body's cell counts as free once its tail will have left it, stuns counted;
growth still to come doesn't, so a friend's screen, which isn't sent it, draws the same rings.
- **`PECK_PROMISE_TICKS` (5) moves before the strike** the woodpecker keeps each piece's landing (`w.landings`, [from,
  to] cells, to −1 for the bird's). At the strike, `E.knocks(game, cells, w.landings)` lands each piece on its kept cell
  while that cell is still free; the rest go by the rule as the board stands then, never onto a cell kept for another
  piece. Only a head or a beetle on a ring at the strike sends that piece elsewhere: as near its ring as it can land.
- Food that comes into the mark after the promise (a crash's beads) is promised then, and nothing grows on a promised
  ring.

### The pits and the mark

- **The pits:** one per connected hollow, traced along the cell edges: a torn, inked lip; a dark floor; a far wall lit
  from the top left like everything else; splinters over the rim and sawdust round it; at the board's edge, a notch
  bitten out of the log. They lie on the static layer under the snakes, so a body bridging a hole is drawn across it,
  and a strike paints again only the box round its new holes. (A body over a pit: "A body over a pit, smooth" in
  `03-the-snake-as-a-character.md`.)
- **The mark** is traced with the same outline, its rim the pit's torn lip to come (the same wobble, corners rounder: 11
  units against the pits' 7), and glows red. It covers the crumbs and pieces it will take. Its cracks run along the
  grain under the snakes, and as the strike nears the pecks bite nicks in from outside the rim, each its own size and
  unevenly spaced, first and closest together where the bird is at it.
- **Knocked food:** through the aim the food in the mark trembles, more as the strike nears (1 CSS px each way as the aim
  starts, 2.5 by the strike, through the board's scale, so it shows on any screen), and a faint dashed ring, parchment
  over ink, marks each landing. At the strike it flies there over the snakes, 320 ms and 70 ms a cell (at most 620), 0.6
  of a cell high and 0.22 more a cell (at most 1.5), so a long throw clears the bodies it crosses; a bead in the air is
  ringed in ink and parchment; a beetle scurries; what the bird eats goes in crumbs. With reduced motion it's simply
  there, with no tremble, and the rings stay.

### A strike that doesn't stutter

The land a strike leaves (Sovereign's realm, Colonist's colonies) is drawn ahead during the aim, one step a frame, for
every realm the patch cuts or runs beside, with the contested dashes: the plan, then each stroke (the wash, the three
soft bands and the riband, the keyline and hatching, the ink, the glow), then the dashes. Each step goes to the GPU in
its own frame. Watched fast, it takes up to four steps a frame when the strike is nearer than its steps. It's swapped
in at the strike only if every realm's land, the holes and the resolution are as predicted; otherwise the land is
rebuilt the old way, the same pixel for pixel either way (render-test).

### A woodpecker you can believe

It moves the way a great spotted woodpecker does, a big bird on its own layer over the page.
- **It flies like one:** bursts of wingbeats (104 ms a beat) lifting it, wings tucked in the dips (a bound about every
  240 ms of flight), in a swoop; its body tipped the way it goes, upright as it climbs, near level across, never
  nose-down past level. A flight takes 240–540 ms by distance, shortened to fit the aim. It lands with its wings up and
  swept forward, leaning back, and folds them over 120 ms with a little settle. Arriving, it flies in from far off over
  the board, small and fading in.
- **Its plan** is drawn from the woodpecker's own state (the strike's tick, the patch, the last patch, how many it has
  struck), so every screen draws the same bird at the same moment, a friend's too. Through the aim: a hop to the new
  spot's perch (along the ledge or its side of the board; to the board's other side it flies straight in instead), a
  look of at least 260 ms, a 200 ms crouch, the flight in, the landing, then the drum. After the strike: 90 ms at the
  hole, the flight home, settling, and "kik!". It works on the patch's cell nearest the patch's middle.
- **Perched, it's alive:** it clings upright, braced on its stiff tail, bobs (a 1.7 s breath) and shifts its grip every
  2.6–5.4 s (a hitch down the log and back, 420 ms). Its head snaps to what it watches in about 30 ms and holds still
  0.26–0.9 s.
- **It looks:** its eye is white, its pupil eased toward what it looks at as the snakes' are, and it blinks as they do.
  Resting, it watches you a quarter of the time (when you're on the log), else the nearest head or beetle within 9
  cells, else it looks round; a new pick every 0.6–2 s, never straight up. Through the aim its head turns to the patch
  and tilts 0.16 radians this way and that every 0.4–0.7 s, its eye on the patch, so you can see where it's going
  before it goes. On the ledge it only looks up a little.
- **It pecks for real** (the drum): one table, `SnakeAudio.drumBlows`, for the knocks you hear and the blows you see: 14
  knocks 28 → 52 ms apart (520 ms) for its first three strikes, then 12, 10, 8 and 6. A blow on each knock, its beak on
  the spot, drawn back between, with a blur when they come under 46 ms apart; 4 chips of pale wood and bark a blow, in
  the air 340 ms; a dent with splits along the grain deepening on its own layer (never over a body), gone at the
  strike. The game starts the drum from the aim's progress on the drawing's clock, so its last knock lands on the
  strike, as the patch gives way.
- **At the screen's edge:** to drum, it clings upright facing the way it came if all of it fits; else it leans, turns
  round, lies level (beak down on the bottom rows, up on the top rows), or is smaller, down to 0.6 of its size (a
  phone's bigger bird smaller still). Flying, a wing beats short of the edge and the bird keeps in.
- **Drumming, it weighs what it would hide:** of the ways it fits there (upright or leaning, facing either way), it
  clings the one that hides least of the rings (each counting four), the heads and the food (two each) and the tiles of
  its mark (two, all of them together), chosen as the aim starts and again each tick while it's still on its perch,
  then kept. A ring or a piece in the air that it still covers is drawn again over it, on its own pixels only.
- **With reduced motion:** one glide with the wings out and still; no bob, grip shifts or chips; it fades in at its
  perch as it comes. The eye still looks, and the head eases instead of jerking. A blow on every third knock counting
  back from the strike (5 of 14), while the sound keeps all its knocks.
- **Its layer** is the board and the room round it: on each side as far as the free page runs (to the tags, the header,
  a column beside the board, a notch), at least 1.2 and at most 6.5 bird units, and always 6.5 below. It's cut at the
  screen's sides and moved with a CSS transform, so a phone's address bar coming and going, or the page scrolling,
  never makes it again. Its parts are bitmaps drawn once at the screen's size (a half-size set for small perches); the
  rim light, the beak (it opens on its kiks) and the eye are drawn as it stands, and only the box it was drawn in is
  cleared each frame.

### The woodpecker pecks beside a snake

On a tile with a snake on it, the bird pecks beside the body, not on it. Its beak aims at the spot on the cell's rim
(its corners and three points along each edge, just inside the edge) farthest from the edge of any body there, as drawn;
of spots about as clear (half a unit), the one nearest where it clings, so a body straight across the cell has it peck
the edge on its own side. The dent and its splits start there and run in toward the cell's middle, stopping short of
the body, and none is drawn where no room shows (the body fills the cell); the chips fly from there. When a body comes
or goes it shifts its grip to the new spot in half a tick. On an empty tile it pecks the middle. Drawing only (`aimOff`
and `freeAim` in `render/bird-perch.js`): the tiles go at the same moment, and the simulation does not load the
renderer, so its fingerprints cannot change.

### The woodpecker, as big as it gets

Drawing only, so play is unchanged. The bird's unit (`BU`) is `BIRD_GROW` (1.7) times its first size, and everything
that sizes it (its perches, its room round the board, its flights, its drum poses, its rims under the board) grows with
it; it is one size, perched and drumming, wherever the screen has room for it (all in `render/bird-perch.js`).
- **Where the gutter beside the board is narrow** it perches a little smaller: a perch is "near enough" if it has room
  for 0.65 of its size at 1.3 (`PERCH_NEAR`), so growing never sends it to a smaller perch on the far side. Beside the
  board it never lies over any word, nor, perched, over a cell.
- **Its blow goes as deep as at 1.3** (`B_IN`), so pecking beside a snake its beak stays in the cell, and its drum poses
  keep room for that aim (`AIM_REACH` in `render/bird-drum.js`: it moves the whole bird by up to half a cell).
- **On a phone held upright** it stands over the row under the board and the chatter, its crown just under the board;
  taps pass through it.

### Clear of the row's words (2k+)

On a phone held upright it perches over the row under the board, but clear of its words: the speed buttons' and the
switches' labels, and the speed's and the chatter's captions (`words` from `placeBoard` in `game/screen.js`, those level
with the bird). Where it would stand covers one, it takes the nearest place that covers none, as round the frame's moss.
It never shrinks for this: where no place at its size clears them, it perches as it would, and that stays (in your own
round after you're out, the help line's words share the row, and on a 390 px phone no place clears them). The chatter's
lines are left out: they change every few seconds, and the bird would move with each. No perch lower, no help line
stepping aside, no smaller bird.

### Bigger on a phone

On a phone (a screen no more than `PHONE_SHORT_PX`, 500 px, on its short side) it grows `PHONE_GROW` (1.6) times more;
the desktop is unchanged. Its depth into the bark and its smallest perch stay what they were at 1.3, whatever its size
(`growBird` in `render/bird-perch.js`), and its size is worked out again only when the screen's width changes, so a
phone's address bar never resizes it.
- **Held upright,** it is that size or as big as still stands whole on the ledge under the board, one size perched and
  striking.
- **On its side,** it perches in the gap on the side that runs to the screen's edge, its beak short of the board and its
  eye in the gap, inside the safe area, the rest past the edge; its size there is the full one or, where the gap is
  narrower, as big as still leaves its eye in the gap, the same perched and striking, never covering the board while it
  perches.
- **Never smaller than 2k's:** where even that leaves no room (a 375×667 phone upright; a sideways screen whose gap won't
  hold its eye), it is 2k's bird, perched as before.

### The rivals tell a mark from a hole

- **They read the acts** as a person does (`aiView`'s `act` and `gaze`): while it watches, the ground within
  `GAZE_NEAR` of its spot counts as risky to linger in (`AI_GAZE_RISK` of each rival's soft zone at its middle, less
  out to the edge, in `ai/risk.js`), so a careful rival like Ghost gives it a wide berth and Desperado, whose zone
  counts for little, skims it; in the frenzy every rival not desperate wants `AI_FRENZY_MARGIN` (2) more spare room
  (`ai/decide.js`). Its marks: below.

- **What they see** (`aiView`): the piece its outline cuts round (`piece`: ground to get off, `AI_CUT_RISK` of each
  rival's soft zone on it, `ai/risk.js`), a fight's plus (`zone`: walls, never a pit), the mark apart from the holes (`view.pecks`), the strike's tick while the bird aims
  (`strikeAt`: anyone sees it drum the patch, its last blow on the strike), the pieces it cuts loose (`fall`), and, from
  the promise, the promised landings (`landings`: the rings show them to everyone).
- **Off a doomed piece:** a rival whose head is in the mark takes its search's move if that lives; deeper in than the
  search lets it cross (below), where it reads the mark as walls and sees no way out, it walks off the shortest way that
  makes it before the strike (`escapeMark` in `ai/decide.js`), reading bodies as its search does, never a first step a
  rival's head could take too, and onto room for its length if it can.
- **A mark isn't a hole yet** (7c of round six B). While the bird aims, a rival crawls onto the mark wherever it would
  be off it before the strike with a move to spare: a cell of the mark at move s is open to it while s plus the moves
  from it onto the bark, walking round the pits (`markOut` in `ai/sight.js`; the beetles' straight-line `beakDepth`
  would let it out across a pit), is no more than the moves before the strike less one (`canEnter` in
  `ai/evaluate.js`; the strike comes after move strikeAt − tick + 1); so it
  crosses a mark for food beyond it, or onto a piece cut loose and back, and is off when the strike comes. Fire on the
  mark (or the fight's plus) stays a wall. Its room and its trap tests still count the mark as the hole it will be; where
  a rival could step next, and its wider reach, count the mark as crossable to it too (`readRisk` in `ai/risk.js`). A jump of theirs may hop real holes but never a mark; a
  flash, plain or golden, treats a mark as a wall.
- **Knocked food:** a rival works out each landing with the engine's own `E.knocks`, on the board as it sees it (the
  other snakes a moment late), and values the food there from the move after the strike's tick, never where it lies.
  Knocked food is anyone's: whoever would get to the landing first counts it as theirs. It pulls from when it lands, and
  every move a rival would be there before then counts a little more (`EARLY` in `ai/room.js`, 0.1 a move), so it waits
  nearby and is on the food as it lands. A rival that's nearer makes it a race, which Gobbler and Vulture run by their
  weights, and so does anyone desperate.
- **A beetle in the mark** is moved in their search by the engine's rule ("Beetles and the woodpecker" in
  `04-food-and-the-world.md`), and knocked to its landing at the strike.

### Cues, lessons and the Field guide

- **The banners,** each act's news as it starts, dressed in the woodpecker's orange (`game/core.js`, with their phone
  words in `FLAVOR.phone`): as it comes (`FLAVOR.woodpecker`), its first mark (`woodpeckerPecks`: "It's started
  pecking! Keep off its mark."), and the frenzy (`woodpeckerFrenzy`: "Sudden death! The woodpecker's in a frenzy.").
- **The lessons** (`game/core.js`, told by `game/banners.js`):
  - once a round, as it comes, after its banner and only while you're alive: "The woodpecker's watching… Mind where it
    looks." (`youWatched`: its gaze is the tell);
  - once a round, at its first mark, the same way: "Food in the woodpecker's mark flies to its ring." (the one idea you
    can act on, one line on a phone; that it won't shut you in if it can help it is the Field guide's);
  - the first time it pecks under you: "Pecking under you! Only your head can fall in.";
  - the first mark that cuts a piece loose (or as it falls, if the banner was busy): "The shaded piece is cut loose and will fall.
    Get off it!";
  - the first beetle it eats: "The woodpecker eats beetles too.";
  - its first peck along an outline: "It's cutting a piece out: get off before it falls!";
  - its first fight: "Little log left: now it pecks at snakes. Dodge!".
- **Death:** the card's title is **Pecked!** (or "Drilled!") for a head in the patch, "Down the hole!" for one on a
  piece cut loose, and "Flattened!" for a hole you hit (`09-voice-and-copy.md`, "Death titles").
- **The Field guide's** Woodpecker row (`game/friends.js`, with a picture of an apple flying out of the mark to its
  ring) says when it comes, that it won't shut you in if it can help it, that a piece it cuts loose is shaded and falls
  with the strike, and where knocked food goes; the Holes, Beetles and Lost flags rows say the rest.

### Its sounds

The sound topic is `21-sound.md` ("Round six A's cues", "The woodpecker's drum is its blows"); in short:
- **The drum:** a knock for every blow (see "A woodpecker you can believe"), its last on the strike, with the crash.
- **"kik!":** three as it arrives; one softer as it settles back on its perch after a strike, on the frame it lands.
- **The knock:** a hollow tok, pitched under the drum's knocks, and a whoosh as the food flies, stretched with the first
  piece's flight, with a soft bump as that piece is drawn landing. Once a strike, at half volume, from where the first
  piece that flies was; nothing for what the bird eats.
- **A piece cut loose:** a creak and a far-off thud as it falls.

### Its voice

- **Every rival reacts to it** in its own voice as it comes (`woodpecker` in `chatter/voices/*.js`; Sovereign: "Who
  invited that bird?"; Vulture: "Ah. A colleague."; Mute *covers its ears*), and to it pecking under them (`under`, at
  most every 12 s; Colonist: "Mind the gap!"; Mason: "Pons sum!"), and dying by it (`diesBy.woodpecker`).
- **Food it knocked aside** and someone else ate where it landed within 6 s (`KNOCKED_MS` in `chatter/talk.js`): the
  rival that was after it (the nearest head to where the piece lay at the strike, the eater's aside, within 8 cells,
  `KNOCKED_NEAR`) grumbles at the eater by name (`knocked`), every time, at most every 40 s (`KNOCKED_REST`). Its own
  bead was never its meal, so then the next nearest head was after it; when you were the one after it, nobody speaks
  for you. Never for a mushroom or what the bird ate; a knocked beetle caught within 4 cells counts.
- **No rival announces its fair play:** the lesson does (a chatter test keeps it so).
- Sovereign and Colonist mind their land pecked full of holes (`13-lines-and-announcements.md`, "Land lines").

### Online

When the acts start crosses with each tick (`ac`, since protocol 30). The woodpecker's row carries where it is, its mark (`target`), the strike's tick, the last patch, when it struck and
rests, how many it has struck, the promised landings and the pieces cut loose (`WoodpeckerRow` in `online.js`; the
landings since protocol 10, `fall` since protocol 20; since protocol 31 its outline, `plan` (the cut's cells left, the
piece, when it began waiting), and a fight's `zone`, five cells at most, each cell on the board and once). The events `aim`, `peck` (its cells, the bodies it pecked under,
what fell, a fight's plus) and `knock` (the kind, from where to where, or nowhere when the bird ate it; golden; a bead's colour) cross
too. Each is checked before it's drawn: a landing a cell and a cell or none.
