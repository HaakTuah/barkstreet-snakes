## The woodpecker

From 2:00 a great spotted woodpecker comes for the log, a patch at a time: it is what ends a round. The rules as the
round's arc, round four, round six A and the owner's playtest settled them (their text, with what was tried and measured,
is in `docs/archive/design-woodpecker.md`). Elsewhere: how beetles flee its mark ("Beetles and the woodpecker" in
`04-food-and-the-world.md`), the last apples that fall meanwhile ("Food on the log", there), its perch on a phone
(`31-phones.md`, and "The phone gap" and "The phone's bottom" in `32-the-owners-playtest.md`), the sound's levels
(`21-sound.md`), and a flag it pecks out ("A pecked flag is a lost colony" in `27-round-six-a-fairness-and-fixes.md`).

### When it comes

- **At 2:00** (`SUDDEN_DEATH_MS`), when sudden death starts, and it stays to the end of the round. It lands, looks round
  for `PECK_ARRIVE_TICKS` (12), then aims its first patch.
- **Then, over and over:** it picks a patch, eyes it for `PECK_AIM_TICKS` (17, about 1.6 s), strikes, and rests. It
  gets hungrier: each rest is `PECK_REST_TICKS` (30) times `PECK_HUNGRIER` (0.85) for every strike so far, never under
  `PECK_REST_MIN` (10).

### How it picks a patch

- **Its size:** `PECK_CHUNK` (12) cells, a cell bigger each strike up to `PECK_CHUNK_MAX` (20), grown cell by cell from
  a start, compact (a cell with more of the patch, or old holes, beside it is likelier), then rounded (see "Rounder
  hollows").
- **Its start:** a third of the time under a body (`PECK_UNDER_BODY`, any snake's, never a head; see "The strike"),
  half the time beside an old hollow (see "Fewer, bigger hollows"), else anywhere.
- **Where it may aim,** in order, taking the first that works (`PATCH_TRIES` in `engine/woodpecker.js`):
  1. more than `PECK_CLEARANCE` (4) cells from every head, so nobody can be inside a fresh mark before they can see it,
     shutting nobody in, and cutting loose no piece bigger than `PECK_FALL_SOFT` (see "The log stays one piece");
  2. clear of the heads themselves, the rest as in 1;
  3. and 4. as 1 and 2, cutting loose a piece of any size;
  5. and 6. as 3 and 4, shutting someone in;
  7. anywhere left.
- **It may cover food:** food in the mark is knocked aside at the strike (see "It knocks food aside").

### Fewer, bigger hollows

Half the strikes (`PECK_WIDEN`) start beside an old hollow, and patches grow compact, so the log ends up with a few big
hollows instead of a pegboard.

### Rounder hollows

After a patch grows, two passes fill any cell beside it with 3 or more of its 4 sides patch, old hole or the board's
edge (never a head), then two passes drop one-cell spurs (cells with only one neighbour in the patch or a hole), while
at least 3 cells stay. The holes read as hollows pecked on purpose, not scribbles.

### The woodpecker plays fair

It won't shut you in if it can help it: it won't pick a patch that leaves any snake less room than its length, while it
has another to pick (only the last tries above may). Room is a timed flood of the engine's own (tails leaving, stuns and
growth counted) against the snake's length plus what it has still to grow; a snake already shut in doesn't count.

### No crumbs

A patch that would cut off an island of one or two cells takes those cells too. They're in the mark from the aim, so you
see them go, in every try but the last. If a snake is on one, it picks another patch; food on one is knocked aside with
the rest. A crumb of `PECK_NO_ORPHANS` (2) cells or fewer may lie nearer a head than the clearance (walled in by the mark
and holes, nobody can step into one), but never under one.

### The log stays one piece

No crumbs, grown to any size (2s). The log is the biggest piece of bark once a patch is out; any other piece the patch
cuts loose goes into the mark from the aim (`w.fall`) and falls with the strike.
- **It aims small first:** no piece over `PECK_FALL_SOFT` (12 cells) while it can, then any, so no size is banned (rules
  tests prove both).
- **Clear of heads:** a falling piece keeps the patch's clearance (`PECK_CLEARANCE`), so nobody is on it before they can
  see it; only the last try, when no patch keeps clear of heads at all, can cut loose a piece with a head on it. Then
  the mark shows it the whole aim: a snake that gets off in time lives, and one still on it at the strike falls with it
  ("Down the hole!"). A body lying over it bridges the new hole, as over any patch.
- **What falls:** food and beetles on it go with it.
- **The cue:** the piece is shaded dark in the mark, with pale streaks sliding down it; at the strike it tips away into
  the pit with a creak and a far-off thud.
- **The rivals** are shown which cells fall (`aiView`'s `fall`), so they never count on food there being knocked aside.

### The strike

At the strike every cell of the patch becomes a hole, for good: holes are only ever added (the squeeze is what ends
rounds, and online play relies on it).
- **Only a head falls in.** A head on the ground in the patch is out ("Pecked!"; on a piece cut loose, "Down the
  hole!"); a head in the air isn't in it.
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

- **What they see** (`aiView`): the mark apart from the holes (`view.pecks`), the strike's tick while the bird aims
  (`strikeAt`: anyone sees it drum the patch, its last blow on the strike), the pieces it cuts loose (`fall`), and, from
  the promise, the promised landings (`landings`: the rings show them to everyone).
- **A mark isn't a hole yet.** They keep out of it as out of a hole; a jump of theirs may hop real holes but never a
  mark; a flash, plain or golden, treats a mark as a wall.
- **Knocked food:** a rival works out each landing with the engine's own `E.knocks`, on the board as it sees it (the
  other snakes a moment late), and values the food there from the move after the strike's tick, never where it lies.
  Knocked food is anyone's: whoever would get to the landing first counts it as theirs. It pulls from when it lands, and
  every move a rival would be there before then counts a little more (`EARLY` in `ai/room.js`, 0.1 a move), so it waits
  nearby and is on the food as it lands. A rival that's nearer makes it a race, which Gobbler and Vulture run by their
  weights, and so does anyone desperate.
- **A beetle in the mark** is moved in their search by the engine's rule ("Beetles and the woodpecker" in
  `04-food-and-the-world.md`), and knocked to its landing at the strike.

### Cues, lessons and the Field guide

- **The banner:** as it comes, the round's news, dressed in the woodpecker's orange (`FLAVOR.woodpecker`, or
  `woodpeckerWatch` once you're out, in `game/core.js`, with their phone words in `FLAVOR.phone`).
- **The lessons** (`game/core.js`, told by `game/banners.js`):
  - once a round, as it comes, once its own banner has had its time and only while you're alive: "Food in the
    woodpecker's mark flies to its ring." (the one idea you can act on, one line on a phone; that it won't shut you in
    if it can help it is the Field guide's);
  - the first time it pecks under you: "Pecking under you! Only your head can fall in.";
  - the first mark that cuts a piece loose (or as it falls, if the banner was busy): "Cut loose, it falls! Get off the
    shaded piece.";
  - the first beetle it eats: "The woodpecker eats beetles too!".
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
- Sovereign and Colonist mind their land pecked full of holes (`19-looks-and-lines.md`, "Land lines").

### Online

The woodpecker's row carries where it is, its mark (`target`), the strike's tick, the last patch, when it struck and
rests, how many it has struck, the promised landings and the pieces cut loose (`WoodpeckerRow` in `online.js`; the
landings since protocol 10, `fall` since protocol 20). The events `aim`, `peck` (its cells, the bodies it pecked under,
what fell) and `knock` (the kind, from where to where, or nowhere when the bird ate it; golden; a bead's colour) cross
too. Each is checked before it's drawn: a landing a cell and a cell or none.
