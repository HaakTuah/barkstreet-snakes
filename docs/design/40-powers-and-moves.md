## Powers and moves

Snake plus a little Smash Bros: movement with options, a cost, and a moment to wait. Every snake can jump and flash, a
golden beetle, leaf or mushroom gives golden ones, and a crash costs length rather than everything. The rules as the
crashes, the powers, round four, round six A and round six B settled them (their text, with what was tried and
measured, is in `docs/archive/design-powers.md`). Elsewhere: how a held power, a jump and a bridge look
(`03-the-snake-as-a-character.md`: "Gold means power", "A power is one token, not a ring", "Telling powers apart" and
"Bridges and jumps you can see"); how often golden food comes, and food and beetles (`04-food-and-the-world.md`: "More golden
power food" in "Food on the log"); the woodpecker's holes
(`38-the-woodpecker.md`); how a rival weighs a power, and the power styles and pricing still to build
(`39-the-rivals.md`, "Rivals use their powers, when it pays" and "Every rival has a power style"; "Balance targets" there); what each move measured, with the numbers chosen
(round six B's "chosen numbers" in `docs/archive/design-powers.md`); the keys, swipes, taps and the mouse (`42-controls.md`); teaching
(`30-teaching-by-showing.md`); Capricious, Copycat and Wildcard (`35-capricious-copycat-and-wildcard.md`); sound in
general (`21-sound.md`); one stamina for both plain powers, to build (`37-one-stamina.md`); and crashes, head-ons,
fire on snakes and your own beads squashed (`41-crashes.md`).

### The words

The rules and the code say *leap* for a jump and *dash* for a golden flash; the plain flash is `flash`. On the page the
two powers are the **jump** and the **dash** (since 1 November 2026: "One word for each thing" in
`09-voice-and-copy.md`), and a golden leaf's are *golden dashes*. Below, "flash" is the plain one and
"golden flash" or "dash" the golden one, as the code has them; every quoted line is the page's.

### Two powers, two presses

The jump and the flash are two presses, so holding a golden flash never turns a press meant to hop a hole into a dash
into it.

- **Jump:** Space or a click on the board, or a tap on a phone. Golden jumps go first, and are free.
- **Flash:** E, either Shift or a right-click on the board, or on a phone a swipe the way you're already going. Golden
  flashes go first.
- **Pressed together,** the jump goes first if it can (something right in front to hop, somewhere to land), because no
  flash gets past that; the flash goes once you're down. A flash pressed in the air goes once you're down too.
- **Steering keys only steer.** Pressing the way you're already going does nothing. For swipes only,
  `POWER_AFTER_TURN_MS` (300) stays: a fresh swipe the way the last swipe turned you, while that one's still down or
  within 300 ms of its lift, is the turn swiped twice, not a flash. Only a swipe that turned counts, so golden flashes
  swiped back to back still go. Keys need no guard.
- **Nap is P and Esc** (and the ⏸ button), since Space jumps. Enter, R or an arrow starts and starts over; P and Esc
  don't start a round from the start or round-over card.
- **Space, E and Shift never start or dismiss anything.** They're the keys you mash in a fight. A button you Tabbed to
  still takes Space (tracked from the Tab key itself). Waking a nap is the one exception: any key that plays wakes it,
  Space included, and the waking press never fires a power (the Pause row of `09-voice-and-copy.md`).
- **On a phone, a tap jumps** once it's clearly a tap. It jumps on the lift: within `TAP_STILL_PX` (6 px) of where it
  touched, or a quick touch, under `TAP_QUICK_MS` (250 ms), that never went as far as a swipe. Held still for
  `TAP_JUMP_MS` (80 ms), it jumps before the lift, but only with something to hop within reach on the way it's going: a
  thumb resting on the glass isn't a jump. A jump a hold asked for that hasn't gone yet is taken back if the touch turns
  out to be a swipe, and a thumb resting while the other swipes isn't tapping. A touch on a button or a name tag never
  jumps.
- **A card that comes up by itself** (your death's, the round's end) takes no tap or mouse press on its buttons that
  began before it came up or within `CARD_TAP_MS` (500 ms) of it, nor one in a run of touches, each within
  `CARD_MASH_MS` (350 ms) of the last, that began then. Mashing jump never plays again.
- **Teaching it.** The flash's key is taught once a round, from 6 s in, until you've flashed: "Your dash is ready: E,
  Shift or right-click." (on a phone, "Your dash is ready: swipe the way you’re going."). A short phone teaches both on
  the first Go: "Tap jumps. Swipe ahead dashes." The key help reads "Arrow keys steer (or WASD) · Space or click jumps ·
  E, Shift or right-click dashes · …" ("Swipe to steer · Tap to jump · Swipe ahead to dash" on a phone).

### Pressing during a stun

A power you ask for while stunned goes the way you pressed when the stun's over (it counts as steering, if it can go,
so the snake isn't turned aside first). A power that can't get anywhere says so, with an inked × and, the first time
in a round, a line ("Nowhere to land.", "Nowhere to dash."; resting, "Your jump needs a moment." or "Your dash needs a
moment."), and the auto-turn takes you clear. For a
flash, that's a plain one into what you hit, or a golden one that would blow up at the edge or a hole on its way, or
crash straight back in; a golden flash at a body one thick still goes, since that's its cut. A power that could go but
then can't (a jump whose landing another head takes as it goes) gets the auto-turn too.

### Holding more than one

Golden powers add up:
- each golden beetle gives `LEAP_CHARGES` (2) golden jumps, up to `LEAP_MAX` (3) held;
- each golden leaf gives `DASH_CHARGES` (2) golden flashes, up to `DASH_MAX` (3) held;
- each golden mushroom adds `WRAP_MS` (12 s) of wrap, up to `WRAP_MAX_MS` (20 s).

You can hold golden jumps and golden flashes at once, since they're different presses. Golden charges are spent before
the plain power and leave the stamina alone. Nobody holds a power the others can't see: a snake holding one wears gold
("Telling powers apart" in `03-the-snake-as-a-character.md`), and the rivals see everyone's golden powers in their view
(`leaps`, `dashes`, `wrap`), their own stamina exactly (`stamina`, `leapIn`, `flashIn`), and each other snake's only
as its look shows it (`step`: "Stamina on the body" in `03-the-snake-as-a-character.md`).

### Where golden powers come from

- **A golden beetle** (`GOLD_BEETLE_CHANCE` of the beetles that come out) gives golden jumps. Announced as it comes out
  ("A golden beetle! Catch it for golden jumps."), and when you catch one ("Golden: 2 long jumps, free. Space or a click
  to jump.").
- **A golden leaf** comes only on the wind (`LEAF_CHANCE` a gust, one at a time, landing somewhere quiet) and blows away
  after `LEAF_TICKS` (90). Eaten, it gives golden flashes ("2 golden dashes: E or right-click. Never at edges or
  holes."; on a phone, "…: swipe ahead. …"). It's a broad ginkgo fan in Honey, inked and lit along its top, fluttering
  face-on in a glow.
- **A golden mushroom** comes up only in the rain (`GOLDCAP_CHANCE` a rain spell) and withers after `GOLDCAP_TICKS`
  (120). Eaten, it gives the wrap ("A golden mushroom: 12 seconds with no edges."). It's the mushroom's shape with a gold
  cap, white spots and a shine.

To the rivals these are food worth chasing; how much is in `39-the-rivals.md`.

### The plain jump hops islands

Everyone can jump, always. *Why:* in sudden death most deaths are in a pocket smaller than the snake, and a one-cell
hop rarely reaches the next island across a hollow.

- **What it hops:** a body (one that's still there after this tick's crawl), a hole or fire, right in front. It goes
  over up to `LEAP_REACH` (3) cells of them and lands on the first free cell beyond, never off the board. It flies a
  cell a tick: over three cells, the head is in the air for three ticks and lands on the fourth. The body follows the
  head's path, bridging what it crosses. It hops fire and never puts it out.
- **In the air,** nothing on the ground can hurt you, and nothing that arrives under you either; the woodpecker can't
  get a head in the air. A turn you press while in the air waits till you've landed, and you land where you were going
  when you took off. If the landing's been taken meanwhile, you come down on what you hopped: on a hole, in you go; on
  fire, you catch; on a body over a pit, see "A snake across a pit is a bridge"; on a body, see "Bumps in the air".
- **It waits:** a press waits up to `LEAP_WINDOW` (5) moves for something to hop and somewhere to land within reach,
  and isn't spent on open ground ("Too early: a jump waits 5 moves, then gives up."; "Nothing to jump. Jumps clear a
  snake, a hole or fire.").
- **It costs** its share of the one stamina (`JUMP_STAMINA_MS`; "One stamina for jump and dash",
  `37-one-stamina.md`), and nothing off your tail (before 2u: the tip of it, and a 4 s rest of its own). A leap is a
  crash you saw coming, traded for stamina instead of three segments and a stun.
- *The cue:* the landing cell gets a ring while the jump waits; the flight is the arch, shadow and dust of "Bridges and
  jumps you can see" (`03-the-snake-as-a-character.md`). The stamina ring round your head (see "One stamina for
  jump and dash") has a sky notch at a jump's worth; when the stamina is back up to it, one bright sky flick and a
  wooden tick.
- *The lessons:* the first plain jump or dash that leaves you tired, "One stamina: jump or dash, your choice."; the first time you're boxed in
  with a jumpable gap, "Space hops up to three cells. Hop the gap!" ("Tap to hop up to three cells. Hop the gap!" on a
  phone).
- *The Field guide's Jump row:* "Space or a click on the log: hop snakes, holes or fire, up to 3 cells, to the first
  free cell: across a gap too. Press twice to leap now, open ground too. A ring shows where you’ll land. It takes two
  fifths of your stamina. Bump into a flier in the air and you drop: onto a body or into a hole, you’re out. Lie on a
  flier’s ring before it lands and it’s out: rivals will try it on you." (On a phone: "A tap", "Tap twice".)
- *The sound:* a springy boing up and a whoosh of air.
- *The rivals* ask for it through the same call (`memory.power` from `decide()`: `leap()` in `engine/powers.js`), with
  the same rules and the same waiting: out of a crash or a box, to another island, or to come down on food. They don't
  hop onto an island too small to live on unless they can hop off again in time (`doomed`).

### Leap now

A second press while a jump waits sends it at once, wherever you are, open ground included (on a phone, a double tap).
Over open ground it flies a full plain hop, over `LEAP_REACH` cells whatever's there, and down on the fourth (short of
it, on the farthest free cell or a bridge that lasts; never off the board, nor onto a landing another head is moving
into), with its ring, at the same price. So the air is a place you can use: jump into a rival's flight to bump it down,
or come down right in front of a snake to cut it off. One press still waits for a hurdle, so nothing is worse for anyone
who never double-presses.
- *Never a refuge:* ground snakes pass under a flight, so a leap also dodges a head-on or a trap for a few ticks: a
  timed escape with a price, not a way to be safe.
- *The lesson:* the first time a flier comes down just ahead of you (you could have cut it off), "Press twice to leap
  now, anywhere!"
- *The rivals* use it through the same engine call, only out of a trap, when every crawl crashes, at each style's price
  (`leapNow`: cheaper for Desperado and Ghost, dearer for Drab).

### The golden jump flies

- **A quick press** is the plain hop, free and with no rest.
- **Held past it,** you commit to the full flight: always `GOLD_FLY` (5) cells in the air, steering as you go (turns
  work in flight as on the ground, one a tick, and the body follows the bend; `airTurn`), and letting go no longer
  brings you down early (`letGo()`). It never flies off the board. So the flight is a trade-off, not a free upgrade of
  the hop ("Conditional goods"): it crosses what a hop can't, but you must steer to a safe landing 5 out, and others can
  read the ring and go for it.
- **Wherever you come down counts:** bark, and you're fine; a hole, and you fall in; a body, and it's a bump ("Bumps in
  the air").
- *The cue:* a gold ring marks where you'll land, from the moment you commit, and moves only as you steer. A golden
  leap rises higher than a plain one, with a puff of gold.
- *The lesson:* on your first golden jump, "Hold the jump to fly 5 cells. Steer to land!"
- *The Field guide's Golden beetle row:* "2 golden jumps: free, no rest. Tap for the plain hop; hold the jump and you
  fly 5 cells, always, steering in the air to land where it's safe. Hold up to 3."
- *The rivals* plan a flight as they take off, straight or with one turn (left or right, after any number of cells):
  the plain hop, or the full 5. The engine flies it by the same rule as a person's turn (`airTurn`, from the rival's
  `flyTurn`), and the rival plans its turn again every move it's up. A leap now, a held flight and a turned one take
  off only toward a landing no rival's head could get to first; once up, a landing a rival could reach first is priced
  as a head-on, so it steers away where something better is left.
- *What a landing is worth to a rival:* one that shuts a nearby rival in is worth apples (`shutIn`): the share of the
  room that rival reaches in 10 moves that its landed body takes away (4 apples for all of it), and the moves it adds
  to that rival's nearest food (2 apples at 12 moves or more); times (0.5 + its aggression, +0.5 for a hunter), its
  victim twice, half for a rival holding a golden jump. A held flight with no other safe landing left at its last turn
  costs `SPARE` (0.3 apples).

### Taking a landing

A flier's ring is where it will come down, so anyone who gets there first, by crawling, a flash or dash through it, or
a leap now down on it, puts the flier out (it comes down on a body).
- *The cue:* a ring someone is going for takes that snake's colour (#401), for everyone: the nearest snake on the
  ground whose head came closer to it on its last move and could crawl onto it before the flier is down, by the
  lesson's own reach (`inRingReach` in `render/jumps.js`). It eases in and out over 150 ms, so it shows only while the
  race is on. It says who could get there, never who will, and the flier can read it and steer away.
- *The lesson:* the first time a flier's ring is in your reach before it comes down, "A flier lands on its ring. Get
  there first and it’s out!"
- *The rivals* go for a ring they can reach in time, planned from the ring as they saw it (a reaction late), never by
  reaction. A flier put out is worth what a neck cut that puts a rival out is (`KILL`, 6 apples, times 0.5 + its
  aggression, its target twice), times its style (`w.landing`: Sniper 1.5, Desperado 1.2, Drab 0.15, the rest 0.6),
  times the chance the ring stays put (`STAY` 0.8 for each of the flier's moves), halved if another rival is nearer.
  Its head on the ring on the landing move is a head-on, so it's priced as one, and the moves either side at half.

### A snake across a pit is a bridge

- A body lying over a pit holds (only a head falls in), and the part of it over the pit is a bridge for anyone: a head
  may move onto it there, crawling along its back, or land on it from a jump. Everywhere else a body is still a wall.
- The bridge lasts as long as the body does: once its tail has passed, the cell is open pit again, and a head over it
  falls in. A body's cells free up on a schedule anyone can see (the tail end leaves one a move), so get your head to
  solid ground before the tail end reaches you.
- Your own body over a pit is as safe as any; it's only your head that needs the bridge.
- Head to head on a bridge is the usual head-on; cutting the bridge (a golden flash) drops whatever head is on the
  cut-off part.
- **Never a way to be safe:** only over a pit (on bark a body is a wall, so riding is never a way out of a crash, a trap
  or a box on solid ground); you're over a pit with a deadline, and can't stop or turn back; the bridge snake's body is
  a wall again where it reaches the far rim, so you must step off sideways onto bark at the rim; a head-on on the
  bridge is a head-on, and a cut bridge drops you; and a jump may land on a bridge only where it will still be there
  when you land.
- *The cue:* a body over a pit is drawn as a bridge, and a head on another's back rides on top of it, with its shadow
  on the back below (`03-the-snake-as-a-character.md`, "Bridges and jumps you can see"). The tail end's last cells over
  the pit get a creak and a sag as it nears.
- *The lesson:* the first time a snake lies across a pit near you, "A snake across a pit is a bridge, until its tail
  passes!"
- *The Field guide's Bridges row:* "A snake lying across a pit is a bridge: crawl onto its back there, or land on it
  from a jump. Get off onto bark before its tail passes, or you fall in."
- *The rivals* plan across bridges with the time each cell frees up, use them to reach an island, and never start
  across one they can't leave in time; a pit with a bridge over it is no barrier to them while the bridge lasts.

### Bumps in the air

- In the air are each flying head and the part of its body lifted over what it hops. Flying into another snake's air
  is a bump; two flying heads in one cell both bump. Something on the ground passes under a flight, and a flight passes
  over the ground.
- A bump costs what a crash does (`CRASH_LOSS` and `STUN_TICKS`: "Crashes, not deaths" in `41-crashes.md`), and you drop where you are:
  - over bark, you're stunned there, and the ground's test for being trapped holds as for any crash: if there'll be
    nowhere to turn when the stun's over, you're out;
  - over fire, you're stunned there and catch alight as if you'd crawled in ("Fire on snakes" in `41-crashes.md`);
  - over a hole, you fall in and you're out;
  - onto a body, you're out: you drop straight down, and the snake under you blocks your landing.
- Coming down on a body at the end of a flight is the same, and puts you out. So a golden flash through a landing cell
  steals the landing, and the jumper with it: the landing ring is the warning.
- *The cue:* a spark and a puff of dust in the air, then the drop.
- *The lesson:* the first time you bump in the air, "Bumped in mid-air! Down you go."
- *The rivals* weigh the risk: a jump only goes where its landing will still be free, as far as they can see
  (`airBumps` in `engine/crashes.js` is the rule).

### A flash for everyone

Everyone can flash: **two cells in one tick, along the ground, for its share of the one stamina** (`FLASH_LENGTH` 2,
`DASH_STAMINA_MS`; before 2u it rested 12 s on its own). It eats what it passes. It goes the next tick the snake moves
on the ground (in the air, once it's down). *Why no tail:* a flash that cost a tail segment made rounds longer and
starved snakes, in simulation.
- *The cue:* ember speed lines either side, thinner and shorter than a golden flash's. The stamina ring has an ember
  notch at a flash's worth; when the stamina is back up to it, an ember flick and a small spark.
- *The Field guide's Dash row:* "E, Shift or a right-click on the log: two cells in a blink, for three quarters of
  your stamina." (each share is written from `tuning.js`)
  (On a phone: "A swipe the way you’re going".)
- *The sound:* a short whoosh of air, lighter than a golden flash's zip.
- *The rivals* flash through the same call (`memory.flash`: `flash()`), weighed in their own search
  ("Rivals use their powers, when it pays" in `39-the-rivals.md`).

### The plain flash cuts

- Through a body `FLASH_THICK` (1) cell thick with free log beyond (on the board, no hole, no body), it cuts that body:
  the part behind the cut falls to beads, food for anyone (its owner squashes them: "Choking on your own tail" in `41-crashes.md`). The cut
  is one a snake, where the cells the flash crosses are nearest that snake's head; a layer beyond the flash's last cell
  is only why it can't go on.
- It puts out the first fire it passes, and goes into a second.
- Two flashes through one cell on the same tick each stop there and meet as two heads do, whatever their seats; flashes
  are worked out on the board as it was before any of them moved, and cuts are made once every flash has moved.
- *The cue:* the cut is a snip of light across the body and the beads spill, with a "Snip!".
- *The lessons:* your first cut, "A dash cuts through a thin body."; "Snip! You cut Name in two."; cut yourself,
  "Snip. Name dashed right through you."
- *The Field guide's Cuts row:* "A dash cuts through a body one thick with free log beyond: the part behind falls to
  beads. Leave fewer than 3 in front and that snake is out. Your own body too: drop your tail to fit a pocket. Along the
  edge, or against a hole or another body, nothing can be cut from that side."
- *The rivals:* a cut rival's tail is worth to them 0.1 apple a segment, up to 12, times (0.5 + aggression), their
  target's twice; only the hunters and the aggressive weigh a cut off to the side.

### The neck cut

A cut that leaves another snake fewer than `MIN_LENGTH` (3) segments in front of it puts it out ("got cut in two by…"),
as a crash at your smallest does. It's the flash's skilled kill: a one-thick spot right behind a moving head, with free
log beyond; a misjudged one hits the head instead, which is a failed flash (a head can't be cut). The same holds for
golden cuts. The death card: "Name’s dash cut you right behind the head".
- *The lesson:* the first neck cut you see, "Snip! Too short to go on."

### A failed flash

A flash that runs into what it can't get through (the edge, a hole, a body too thick or with nothing free beyond, a
head) gets as far as it can and has failed: it costs `FAIL_LOSS` (5) segments and a longer stun, `FAIL_STUN_TICKS` (6),
not a crash's 3 and 4 ("Crashes, not deaths" in `41-crashes.md`). Without the risk, everyone would flash all the time and cautious play would lose.
- *The cue:* a bigger bonk, with the stars staying longer.
- *The lesson:* your first failed flash, "Too thick! A failed dash costs 5 off your tail."
- *The Field guide's Failed dash row:* "Dash into a head, a body too thick, the edge or a hole and it fails: 5 off your
  tail and a longer stun."

### The edge is a shelter, measured

A cut needs free log beyond the body, so a body lying along the edge, or against a hole or another body, can't be cut
from that side, a neck cut included. The edge keeps that upside, with its price (fewer ways out). Measured in round six
B's part 3: no refuge ("Part 3, the chosen numbers" in `docs/archive/design-powers.md`).

### The golden flash cuts deeper

A golden flash, a *dash*, goes `DASH_LENGTH` (3) cells in one tick along the ground. It cuts through a body up to
`DASH_THICK` (2) thick (one cut, as the plain flash's), puts out every fire cell on its way (a hiss of steam; lightning
still crackling on its way isn't put out), and eats food on the way. **The edge, or a woodpecker hole: you blow up**
(out, with a bang: "Kaboom!"; it cuts a body lying over a hole, then blows up in it). Anything else in the way it gets as
far as and runs into, as a failed flash. It goes when you press, before the plain flash, and leaves the plain flash's
rest alone.
- *The cue:* gold speed lines with an ember core, and gold and ember flecks.
- *The lesson:* your first, "Golden dashes cut bodies two thick and put out fire."
- *The Field guide's Golden leaf row:* "2 golden dashes: three cells at once, cutting through a body up to 2 thick and
  putting out every fire. Never at an edge or a hole: you blow up."
- *The sound:* a zip, rising fast, and a rush of air; a cut, a snip; blowing up, a boom.
- *The rivals* keep a held golden dash for a trap, or for a cut that puts a rival out; Star spends them as they come
  (`dashSpend`), its trademark.

### Dropping your tail

A flash can cut your own body, by the same rules: the plain one through one thick, the golden one through two. The part
behind the cut becomes beads, which others can eat and you squash. A cut of your own never puts you out. It's how a long
snake gets out of a pocket too small for it, at the price of the length.
- *The lessons:* the first time you're in a pocket smaller than you, your flash ready and your own body one thick in
  front, "Dash through your own tail to drop it."; your first own cut, "Tail dropped: lighter, and out of the pocket."
- *The rivals* drop their own tail only when trapped.

### The wrap

While you wrap, the edges wrap round for you: off one side, in at the other (the cell there has to be free, as usual),
so the edges can't hurt you; a leap or a dash wraps too. The woodpecker's holes still swallow you. Two seconds before it
ends (`WRAP_WARN_MS`), you're warned ("The edges are back in 2 seconds.").
- *The cue:* the board's edge shimmers with running gold while anyone has it, glowing where a wrapping head is near,
  and your body is drawn across the edge, partly on each side.
- *The Field guide's Golden mushroom row:* "Up in the rain. The edges wrap round for you, 12 s a mushroom (up to 20)."
- *The rivals:* while the edges wrap for one, its look-ahead wraps too, and every rival allows for a rival that can come
  in over the edge.

### Gold portals for the wrap

Built in part 5 of round six B (PR #202):
- Going off an edge while wrapping opens a pair of gold portals, one on each side, trimmed in your colour. The entry
  swirls in and the exit spills out. The frame is gilded while you wrap. Gold, not blue and orange: on this board sky
  blue means jump and ember means flash.
- Others may follow you through while your body passes and for a while after (`PORTAL_MS`, 2 s). Coming out
  onto your body is a crash.
- *Open long enough to matter:* the time a portal stays open after your tail is lengthened, step by step, until
  following through makes a difference from time to time (rivals follow in a fair share of rounds, a first guess at
  least one round in five, and those who follow come out ahead in the both-ways A/B). First the AI is checked: if
  rivals miss portals because they don't see the chance in time (`portalLeft`, the search's horizon), that is fixed
  first. A portal never makes anyone safe, and how often its owner is caught or escapes through it is measured with
  each step.
- *The lesson:* the first time someone follows, "Anyone can follow you through a portal, for a moment."
- *The rivals* see a portal as a way through from afar, not only a cell they can step into: their room fill, territory
  split and power paths link an entry to its exit for as long as it stays open (`ai/portals.js`), and they keep their
  heads off an exit a rival could come out of. No persona weights of its own: each follows when its own plan pays.
- **The chosen numbers** (PR #202): `PORTAL_MS` 2000. At 1 s, with the rivals blind past their 3-move search, someone
  followed in 8% of rounds; seeing the way through raised that to 13 and 16% (seeds 3 and 11); at 1.5 s 17 and 19%,
  at 2 s 21 and 21% (0.29 and 0.34 follows a round), at 3 s 24 and 28%. Rounds, deaths by cause, and owners and
  followers out within 3 s (0 to 1%) unchanged: no refuge either way. Head to head (seeds 811/813, 1,200 paired
  rounds, against rivals who never follow but see portals used against them): 25.2% against 24.7% (interval −1.5 to
  +2.5), place and time alive the same: too rare to move whole rounds, so it is judged per use (below). A competing
  approach (the rivals planning for portals in their goals and hunts) needed 5 s for the same share, and came out even
  too.
  Per use (`tools/dev/fork-moves.js --move portal --rest`, seeds 902–904, 232 follows): a follower is 3.1 ± 0.8 cells
  longer 10 s later, but places no better (−0.10 ± 0.10 a follow). The move doesn't matter to places, which is a design
  finding for the owner (#447); it is kept as built until he answers. Every trademark is within noise.

### Mushrooms come back up

A mushroom is a weapon you aim:
- **Swallow, keep moving.** Eating one shrinks you by its strength, and you aren't stunned. It sits in your cheek for
  `CHEEK_TICKS` (9, about a second), a green bulge anyone can see, and your mouth is full meanwhile: you eat nothing
  else (you go over it, and it stays). The bulge counts down: it swells from a mouthful (0.12 of a cell) to fit to burst
  (0.22) as the second runs out, and on each of the last three moves it throbs (0.06 bigger as the move starts,
  settling through it), so the spit comes on the beat after the third; with reduced motion it swells, without the
  throbs.
- **Aim by steering.** While it's in your cheek, a small ring marks the cell `SPIT_REACH` (3) ahead of your head,
  wherever you face. When the time is up, you spit it there in an arc, over anything between: it leaves at the start of
  that tick, before anyone moves, from the head and the way it faces then, exactly where the ring has been.
- **Where it lands:** on bark, it lies there, poisonous; on a head, that snake swallows it (shrinking, and spitting it on
  in its turn), unless its own mouth is full, when it bounces off as off a body; on a body, food or a burrow, it rolls
  off by the roll rule ("Where it rolls is a rule, never chance"), and with nowhere to roll it's gone; off the board, in
  a hole or in a fire, it's gone.
- **You slide over your own.** For `OWN_SPIT_TICKS` (6) moves after the spit, the spitter's head goes over the mushroom
  it spat, as a full mouth goes over food, and it stays; anyone else who comes over it swallows it as ever. (2x, the
  owner's playtest: before, a snake that kept going swallowed it again three moves later, shrank, and spat it again, a
  loop.) *The cue:* it lies wet, a green slick under it and a glint on its cap, drying as the moves run out. The rivals
  know it as you do (`ai/food.js`: their own fresh spit can't be eaten till then).
- **Stronger each time.** A mushroom takes `SHRINK` (3) segments the first time, and one more each time it comes back
  up, to `SHRINK_MAX` (5); it darkens a shade each time. It never kills by itself: it shrinks you no further than
  `MIN_LENGTH`. A spat mushroom wilts in half the time it had left, but lies at least `SPIT_WILT_MIN` (20) ticks.
  Golden mushrooms are a power, eaten as before. A mushroom in a cheek still counts toward the board's mushrooms, so the
  log holds no more poison than before.
- **Eating one on purpose** is a real choice: a few segments for a shot at a rival, best when you're long and they're
  close.
- *The cue:* the green bulge, the ring, the arc and a "ptoo"; a hit is a green puff on the target's head.
- *The lessons:* your first, "Bleh! Steer to aim it: it lands three ahead."; your first spit that lies, "Still wet: you
  slide over your own."; the first time one hits you, "Ptoo! Name
  got you. Steer to spit it back."
- *The Field guide's Mushroom row:* "Poison: 3 off your tail (never below 3). A second later it comes back up, three
  ahead of you: steer to aim it at a head; you slide over it while it's wet. Each time it comes back up it takes one more, up to 5, a shade darker. Keep
  out of a green ring."
- *The rivals* (`ai/spit.js`): everyone aims one in the cheek (the last moves before the spit), closes in on where it
  could hit a head before that, and keeps its head out of any ring due within its search;
  eating one on purpose is weighed only at a mushroom within 4 of its head with a rival's head close and a line to spit
  along, as a shot worth its taste for it × 0.35 (`SPIT_HIT`) × half an apple (`SPIT_SEG`) for each segment it would
  take off ("Mushrooms, to a rival" in `39-the-rivals.md`).

### The spit flies along the line

To build (3b+ of round six B, in `docs/PROGRESS.md`; the spitter sliding over its own mushroom, 2x, goes first): the
arc to a ring 3 ahead goes; the mushroom flies straight ahead of you, the way you face when the second is up, up to 5
cells (`SPIT_REACH`), two cells a tick, and stops at the first thing in its way: a **head** swallows it (poisoned); a
**body**, yours or anyone's, bounces it off by the roll rule; **food or a burrow** rolls it off; **the edge or a hole**
and it's gone; nothing in the way, and it lies on the bark 5 cells out. While it's in your cheek, a dotted line marks its
path from your head instead of the ring, so a target still has its second to get out of the line, and a body between
you and it is a shield. *The rivals* lead their shots and step out of any line pointed at them, each in its style
(Sniper's head shots its trademark). *The A/B:* the spitters should come out ahead, and hiding behind a body only blocks
one line. *The cue:* the dotted line, the mushroom flying, the green puff. *The lesson:* "Bleh! Steer to aim it: it
flies straight ahead." Online: a protocol bump. First guesses: reach 5, two cells a tick.

### Where it rolls is a rule, never chance

Where a spat mushroom rolls off what it lands on is a rule, so anyone can predict it (`rollSide` in `engine/roll.js`):
1. after a turn, it goes to the inside of the turn, beside the neck; to the outside only if the inside is taken;
2. going straight, it rolls to the side with more open log (free cells in a row, up to 4);
3. a tie goes toward the middle (then to the snake's right, which never comes up on the 24-cell log);
4. if that side is taken, it goes to the other; if both are, it rolls on the way it would have gone first, over food
   or a burrow, to the first free cell within `ROLL_ON` (4), and failing that the other way.

"Free" means on the board, not a hole, not burning, no food, no burrow, and no body still there next tick (a tail end
moving on is free); it may roll past food or a burrow but not stop there. The wrapped edge is an edge here. Nothing
else is pushed aside by a head.

### Online

Everything here crosses to a friend's screen (protocol 22; `VERSION` in `online.js` lists each bump): a power press is its own message
(`{t:'pow', k}`: `'leap'`, `'flash'`, `'unleap'`, a jump a finger held still asked for, taken back, and `'letgo'`, a
jump let go); each snake's row carries its golden charges (`leaps`, `dashes`), its stamina (`restedAt`, protocol
25), a waiting press (`leapArmed`, `flashArmed`), its wrap (`wrapUntil`), its stun and burn, its flight
(`flight`, `land`, `airLeft`, `airGold`, and the ring, `ring` and `ringIn`) and its cheek (`cheek`, `spitAt`); and the
events carry leaps (golden, how far, a leap now), dashes (plain or golden), fizzles (a press that couldn't go), cuts,
douses, crashes (a failed flash's, and one in the air, say so), squashes and spits (where it came down, whom it hit,
where it lies). Bridges and cuts changed no message: they're rules both sides
play by.
