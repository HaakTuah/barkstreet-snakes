## The snake as a character

How the snakes look: bodies, outlines, markings and colours; faces, eyes, mouths, hats and tongues; each rival's costume;
how a look changes in play (powers, jumps, bodies over a pit, hunger); and how you tell your own snake apart. The rules
as the third pass, round four, round five, round six A and the owner's playtest settled them (their text, with what was
tried and measured, is in `docs/archive/design-looks.md`). All of it is drawing only: nothing here changes how anyone
plays. Elsewhere: the interface's eight colours (`02-art-direction-storybook-bark-on-a-mossy-log.md`); beads and remains
("Remains" in `04-food-and-the-world.md`); the YOU marker at the start ("YOU" in `16-the-first-seconds.md`) and friends'
arrows and the crash's bang (`19-looks-and-lines.md`); people's seat colours and markings (`22-play-with-friends-online.md`);
Capricious's and Copycat's play
(`35-capricious-copycat-and-wildcard.md`); each move's own cue (its section in `40-powers-and-moves.md`); the
woodpecker (`38-the-woodpecker.md`); the rivals' play (`39-the-rivals.md`).

### Your snake

Your snake is the protagonist, so it gets the most life:
- **Eyes that glance at the nearest food:** white sclera with ink pupils that ease toward it.
- **A blink** every 2.6 to 6 s at random (`BLINK_MIN`, `BLINK_MAX`), for 130 ms (`BLINK_MS`). Every snake blinks so.
- **A forked tongue flick** about every 2.8 s (`TONGUE_EVERY`), more often with food within 3 cells.
- **A body that tapers to the tail**, with smooth rounded curves at corners. The spine follows the real cells, so the
  body never cuts a corner. **It's a caterpillar: one round segment per cell**, each joined to the next by a narrower
  band (`PINCH`, 0.8 of the segment's radius, in `render/lead.js`) and lit on its upper left, so you can count a
  snake's length at a glance. The shadow and outline follow the same pinched shape.
- **A head that turns smoothly.** It swings round over a moment when the snake turns. A rival's eases over about 70 ms,
  and when it turns again and again (two turns within 650 ms: a staircase, a wiggle), over 300 ms, so it holds a steady
  line between the two ways instead of whipping its tongue from side to side. Yours always turns in about 60 ms
  (`FACE_EASE_MS`), as soon as your head is drawn heading the new way. A face's turn is settled once a frame, before
  its shadow and outlines.
- **A bite:** the mouth opens when food is right ahead, the head squashes at the bite and chews twice (`CHEW_MS`, 420),
  and a gulp bulge (`GULP`, 0.2 of a cell on the radius, over `GULP_LENGTH`, 1.3 segments) travels down the body, one
  segment per tick. The crumbs fly from the mouth; an eaten bead's crumbs are the bead's own colour.

### Telling you apart

- **A bright cream outline with a soft halo** (`#fffef8`, a few faint steps of cream round the body and a touch more
  round the head; `drawHalo` in `render/bodies.js`), so you find yourself at a glance without relying on green.
- **Friends online** get a thinner, plainer outline (`#cdbd9f`) and no halo: people still read as people, but only you
  glow. People share one face, so their seats differ by a colour and a marking ("People get seat colors" in
  `22-play-with-friends-online.md`).
- **Only you and friends have a real forked tongue** (and Capricious while it's undecided: `FLICKS` in
  `render/tongues.js`).
- **Dark rivals get a pale rim** (`#9a8069`) so they read on the bark: Vulture, Mute (whatever its mood) and any body
  whose colour is darker than 0.4 in luma; never Joker, whose amber and white read already.

### The cast palette

The 18 personalities plus you need 19 separable identities, which the interface's 8 colours can't give. Each character
keeps its own colour, but it's never the only identifier: every character also has a face or body pattern (crown,
tricorn and cross-belts, a scope and a squint, marble veins and laurel, jester two-tone, the flag and hair, a mime's
face, cat ears, a mustached star, and so on). You get a cream outline.

### Faces

Most rivals have small white eyes with a catchlight, closed eyes that curve like a cartoon's when they blink, and a
little mouth, and share the blink, the bite and the gulp. Ghost, Creeper and Copycat keep their special eyes, which
still turn, and Vulture's beak gapes instead. Stunned, a head wobbles and three cream stars, inked, go round it until
it moves again.

### What each snake looks at

**Every snake looks at something**, and what it looks at says who it is. Gobbler eyes the nearest food, its eyes
growing as it gets close; Star the nearest golden power (a golden beetle, leaf or mushroom), and otherwise the nearest
head. Sniper swings its scope onto its target, and Sovereign and Mute watch theirs; Colonist watches its target, else
the site of its next flag. Vulture watches the snake it expects to die (the least room for its length), Copycat its model, Creeper the tail it rides (a
snake of 8 or more), and Ghost, Metagamer, Desperado, Joker and Mason the nearest head. Drab lazily eyes the nearest
food under heavy lids, and Wildcard lets its eyes wander, to a new spot every 0.9 to 2.5 s. With nothing of its own to
watch, any snake watches the nearest head, so no face ever just stares ahead. A turn you've pressed that hasn't shown
yet turns your eyes that way first.

### The tongue gags

Every few seconds each rival flicks out something that fits it instead of a tongue, on the same out-and-back rhythm,
each at its own pace (`FLICKS` in `render/tongues.js`), so the gag reads as the snake's tongue:
- **Wildcard** slides out a dollar bill.
- **Joker** toots a party horn: a white mouthpiece and a flat paper tube, striped pink, yellow and purple, outlined, that
  unrolls from a visible curl; at full stretch its fringed tip flutters and a puff of confetti flies off it, and then it
  rolls back up.
- **Desperado** pokes out a silver six-shooter (bang: a flash and a puff of smoke).
- **Sniper's** laser sight blinks on from its scope.
- **Sovereign** rolls out the red carpet for itself, gold-edged.
- **Colonist** draws out a brass spyglass, section by section, to look for land.
- **Mason** unrolls a papyrus scroll (Latin, naturally).
- **Metagamer** slides out a keyboard to type up its notes on you, keys lighting up as it types.
- **Vulture** chews on a bone.
- **Star** twirls its mustache ("Star's mustache").
- **Gobbler** licks its lips with a fat pink tongue, often (more near food); **Creeper's** tongue is the snakiest, long
  and wriggling; **Drab's** is short and limp and can't be bothered; **Ghost** breathes out a wisp of ectoplasm.
- **Mute's** painted lips part wide and a second, inner jaw shoots out on a ribbed, glossy stalk, its little silver
  teeth snapping, and back in (a mime with a secret; drawn big from the mouth so it reads at play size).
- **Ouroboros** bares its fangs.
- **Capricious** flicks its mood's (undecided, a forked one), and **Copycat** copies its model's (with no one to
  copy, it bleps like a cat; copying Star, it holds up a stick-on mustache and twirls it).

Everything that comes out is drawn with a dark outline or a bright colour so it still reads at phone size.

### The rivals' looks

- **Sniper:** dark red, every third segment a lighter stripe. One eye squeezed shut (it never blinks on the job), the
  other behind a scope that swings onto its target; knocked out, its squint becomes a cross and the scope slumps off to
  the side, lens cracked.
- **Gobbler:** wolfs its food down: a gulp 1.7 times the size and longer (`GOBBLE` 0.34 over `GOBBLE_LENGTH` 2), and
  hamster cheeks either side of its mouth that puff up with every bite and slowly go down. Its big mouth opens wide
  near food.
- **Ghost:** pale, fading the most toward its tail (but never so far that you can't see a tail that kills), with
  hollow, tall eyes.
- **Creeper:** fades from the head on, with narrow glinting eyes.
- **Drab:** one flat, faded colour, bored heavy-lidded eyes.
- **Sovereign:** a golden crown, its spikes pointing back.
- **Colonist:** a redcoat's tricorn seen from above (three corners, one forward, thin gold lace) and its cross-belts, a
  cream strap zig-zagging down its body.
- **Vulture:** black, with a bald pink head and a white neck ruff. It glares from under slanting brows over a big hooked
  beak, pale horn with a dark tip, outlined so it reads at phone size, that gapes at a meal.
- **Mason is Caesar in marble:** a warm white body with grey veins wandering across every segment (every fourth
  segment's vein is gold), so with his laurel wreath his head reads as a marble bust.
- **Metagamer:** red-and-cyan 3D glasses in a card frame, outlined so it reads on its cyan head.
- **Wildcard** wears the Stars and Stripes behind an orange tan and a white collar: two segments of navy with white
  stars, then red and white stripes. Under a big fluffy golden pompadour ("Wildcard's hair"), it squints, pouts, wears
  a long red tie that bends with its body, and lets its eyes wander wherever they like.
- **Joker:** a white head on a purple-and-amber body, a jester's hat with bells, a clown's red grin (wider when it's
  about to bite) and nose, and a harlequin diamond round each eye, in its hat's purple and orange.
- **Desperado:** a cowboy hat tipped back, a red bandana on its neck, and woven cream poncho stripes every fourth
  segment (cream, not Honey: gold means a power).
- **Ouroboros,** the snake that eats its own tail, is the first that looks like a real snake: dark gold (`#b8860b`) with
  a python's dark diamonds down its back (a pale fleck in each), a wedge-shaped head with a diamond on the crown, amber
  eyes with black slits, nostrils. When its own tail is right in front of it, it opens wide and bites it: the symbol
  itself, for a moment. Its remains are gold beads with a dark diamond. One head only: a decoy head would mislead you,
  where which end is the head decides everything.
- **Mute** is a mood-ring mime ("Mute is a mood ring, not a rainbow").
- **Copycat** is in the flag's red ("Copycat in the flag's red" and "Copycat's face"), with dashed rings round its
  segments: a copy of someone.
- **Capricious** is always pink, so you can always find it whatever mood it's in. **It starts every round undecided**
  (its own pink self, one eye big, one small, a brow cocked) for 3.5 to 5.5 s before its first mood, and dithers like
  that for 1.2 to 2 s between moods. In a mood it wears that rival's face, as a costume over its own pink body; each
  change of mood is a costume change ("A costume change"), and Copycat's change of model looks the same, in its
  red.
- **Star** is a sunflower star trailing a rainbow ("Star").

### A costume change (2t)

Capricious is always pink, so it needs no ring round its head to be found while its mood changes: its pink coat does
that. Instead, one animation shows every change of costume (the owner's call, 30 October 2026; his words in
`docs/archive/design-rivals.md`).
- *How* (`costumeChange` and `drawChange` in `render/looks.js`): over `COSTUME_MS` (500 ms), in the face's frame.
  Capricious taking up a mood, putting one down (undecided again), or changing one for another; Copycat taking on a new
  model, or losing one. A puff of nine little clouds swells round the head and clears, in Capricious's pink or in
  Copycat's red. The old costume (its face, and its head's colour, so Copycat's old copied head goes too) pops off,
  growing and fading, in the first half. The new one pops on from 30% of the way, past full size and back, as food pops
  in. With reduced motion it is a plain crossfade.
- *Seen, not played:* each screen draws it from the mood and the model it has, so online play needs nothing new.
- The name tag's dot in the list beside the board keeps its pink ring (`game/hud.js`): it is not on the board, and in a
  list of dots it still marks the one that changes.

### Mute is a mood ring, not a rainbow

A mime is all expression, so its colour follows how it feels, from what anyone can see on the board (`MUTE_MOODS` and
`muteMood()` in `render/looks.js`):
- **calm:** lavender (`#c084fc`);
- **stalking** someone: deep violet (`#5b21b6`);
- **closing the box** (its target within four cells): deep plum (`#86198f`);
- **scared** (hemmed in on three sides, or another head within two cells): pale lilac (`#ddd6fe`);
- **dazed** while stunned: grey (`#9ca3af`);
- **proud** just after a kill: orchid (`#e879f9`; gold is for powers).

The moods keep to violets and magentas no other rival wears, and are spread in lightness as well as hue: dark for a
hunt, light for a feeling, palest for fear. Its pale rim is its own, not its mood's. It wears white greasepaint, a
black beret, a painted tear and small dark lips, its body and the blush on its cheeks in its mood's colour, its brows
and mouth acting it out (arched, knitted, a steep scowl, raised in the middle with an O of a mouth, flat, a smug curl).
The colour changes over 0.4 s (`MUTE_FADE`) in a few steps, each a cached colour ramp.

### Wildcard's hair

The owner: "Not a comb-over: his real swoop, a big fluffy golden-blond pompadour swept back, then forward and to one side.
It must read at phone size."

`render/faces.js`, `hairBack()`, `pompadour()` and `wildHair()`: a big fluffy golden pompadour, swept back, with a dark
amber outline. Its lick, the curl at the near end of the roll, curls up and back over the hair behind it, its two combed
strands following it. It's drawn in the head's own frame, so it's the same at every heading, and still: nothing in it
moves, with reduced motion or without. Capricious's Wildcard mood wears it too.

### Copycat in the flag's red

Copycat's own colour is the red of the flag, `#de2910`, and its party pin (a little hammer and sickle on the back of its
head) the flag's yellow, `#ffde00`, inked round so it reads on the red head. Its inner ears are a deeper red. Three
things keep it apart from the cast's other reds (Sniper's dark red, Colonist's redcoat crimson, Wildcard's Old Glory):
- **its head** (see "Copycat's face");
- **a yellow star on its tag's dot**, where the others have plain dots: the flag's red with a small yellow star, the
  same in every state (copying Star too) and in the Hall of Fame and Your story;
- **its dashed rings**, on its body and its beads.

Copying someone, its body wears a pale copy of their colours (each mixed 0.45 toward white): that's the joke, it can't
help copying. Where one colour is all there is, copying Star, it's a pale violet, `#d19df7` (`COPY_STAR`).

In the chatter log, a name too dark to read on the log's wood is lightened only as far as it needs to read (4.5:1
against the log at its lightest: `LOG_CONTRAST` in `chatter/talk.js`), keeping its hue and saturation, so the cast's
reds stay reds.

### Copycat's face

While copying, its head mixes the copied colour about half and half with its red; a thin red rim and the yellow star
pin keep it Copycat. Uncopied, it stays full flag red.
- `render/looks.js`, `fillsOf()`; the rim in `render/bodies.js`: copying, its head (and its cat ears, with the deeper
  red inside) is its model's own colour, full rather than the body's pale copy, mixed half and half with `#de2910`
  (`COPY_HEAD`, 0.5, in plain RGB). Copying Star it takes the rainbow's hue at Star's head, flowing in step; copying
  Mute, its colour of the moment (Capricious keeps its own pink in every mood). A 1.5-unit rim of the flag's red runs
  round the head inside its edge. Copying no one (or its model out), the head is all red and has no rim.
- A colour opposite red mixes to a neutral: Metagamer's cyan gives a grey head, Sovereign's blue a plum one, Vulture's
  black a dark red. The rim and pin keep these Copycat.
- Drawn from what both screens know (its model, synced online as `memory.modelId`, and the model's colour), so host and
  guest show the same head.

### Star

A shooting star dragging a rainbow, inspired by the stars of the original Paper Mario: our own star, not a copy
(`render/marks.js`, `drawStarHead()`).
- **The head** is a five-pointed star with softly rounded points (a sharp star, points 1.3 and valleys 0.68 head radii,
  grown round: `STAR_OUT`, `STAR_IN`, `STAR_ROUND`), its points turning with its heading, one to the back, into its
  trail. **Its face stays upright** at every heading, its chin tipped 18° (`STAR_LEAN`) toward the way it's going
  across the screen: tall oval ink eyes with a catchlight, bushy white brows outlined in ink, and a huge white walrus
  mustache under them, its mouth beneath. Heading down, left or right, the mustache droops over its two lower points;
  heading up, its back point sits under its chin. It wobbles when it's stunned.
- **The head's colour** is sunflower (`#f9c22e`), deeper than Honey, with an orange rim (`#e8890c`) and an ink outline.
  A yellow on a face is a look (as Sovereign's crown and Wildcard's pompadour are), and the gold line round a body is
  the power. Holding golden powers, it gets that line like anyone: its gold line, its shadow and a land's colour round
  it follow its points (sunflower, then ink, then Honey, then ink, so the head never reads as the gold line), its pips
  sit past its points, and its stun stars a quarter of a cell further out than a round head's.
- **The body** is the rainbow (`hsl(h, 85%, 62%)`, 28° of hue a segment: `RAINBOW_STEP`), streaming back along it
  ("Star's rainbow streams"). It fades toward the bark at the tail like everyone's, and stops where it was when Star is
  out.
- **Its tail sheds a small four-point twinkle** in one of the rainbow's colours every 0.3 to 0.7 s, only with motion on.
  There's no halo: only you glow.
- **In text**, its colour is its persona colour, `#eab308`, a darker yellow than its star: its name in the log and the
  Hall of Fame, and a bubble's edge. Its dot on the tags is a little rainbow round a sunflower middle.
- **Its burst** (and Copycat's while it copies Star) is a shockwave of six rainbow arcs and rainbow pieces, and its
  knock-out sparks are rainbow.
- **Two closenesses,** kept apart by ink: the rainbow's lemon segment (hue 55) can sit right behind gold pips, and dim
  Star's points are close in tone to the Honey line round it at phone size.

### The tell: a countdown on its five points

An addict's weakness is the comedown.
- **Its middle is always its sunflower.**
- **As it flashes,** its points go dim (`#b0893a`, rimmed `#8a5c24`) and its twinkles burst off them.
- **As its stamina comes back to a flash's worth,** they light again one by one, a point for each fifth of the
  way (`DASH_STAMINA_MS` over five; 2u), from its back point round.
- **The fifth lights when the flash is back,** and two twinkles go round its points. Holding golden flashes, all five
  are lit.
- **Its brows** knit as it flashes and relax early in its rest.
- **With reduced motion,** each point lights at once, one at a time, and nothing blinks.

Count its points to see how soon it can flash again, and box it in while they're dim. It shows what the rules already
know, and the rivals don't use it: they assume anyone may flash.

### Star's mustache

Its gag is its mustache: on the tongue's beat, the ends bend up toward its eyes and curl into inked twirls, and a little
"harrumph" puffs out from under it. Nothing comes out of its mouth. It's 16 cached steps (`STACHE_STEPS`); with reduced
motion, the twirl without the puff. Copycat copying Star holds up a stick-on mustache and twirls it.

### Star's rainbow streams

Its colours stream backward over the log behind it like a trail, tied to the distance Star travels at 1.25 times its
crawl (`BOW_FLOW`), so each segment goes round the rainbow about once a second. It settles when Star is stunned or
stops, and bursts on a flash. With reduced motion the colours drift slowly in place instead.
- The hue at its head is (cells travelled × 1.25 + a burst) × 28°, the cells counted once a tick from the head's move (a
  flash counts all its cells) plus the frame's way through the move (`bowHue()`, `flowOf()` in `render/looks.js`). A
  flash adds 6 segments' worth (`BOW_BURST`), easing out over 360 ms (`BOW_BURST_MS`); with reduced motion it drifts
  10° a second (`BOW_DRIFT`) wherever Star is.

### Copycat copying Star

It wears a pale copy of Star's rainbow (each hue 0.45 toward white), flowing in step with Star's (by its model's
distance and bursts), with pale rainbow beads; its head mixes the rainbow's hue at Star's head half and half with its
red ("Copycat's face").

### Gold means power

On this board gold always means a power. The powers' gold is Honey: fills `#fde68a`, lines `#d4a017`, glints
`#fffbea`. Mute's proud mood is orchid, the decorative autumn leaves are russet and brown, Desperado's poncho stripes
are cream, and a yellow on a face (Sovereign's crown, Wildcard's pompadour, Star's sunflower, Copycat's pin) is a look,
never a line round a body.

### A power is one token, not a ring

A golden power held shows as:
- a thin opaque gold line round the body (Honey), with an ink line outside it so it reads on any colour, drawn outside
  any outline the snake has, until the last one is spent (a golden mushroom's wrap fades calmly over its last 2 s,
  `WRAP_WARN_MS`), so everyone (people and rivals: the AIs see `leaps` in their view) can see who might hop over them;
- pips on a short arc behind the head, turned with it ("Telling powers apart").

### Telling powers apart

Gold stays the family colour: an outline of gold means "this snake holds a power". Each kind also gets an accent of its
own, plus a shape and a motion, so you can read it at a glance without relying on hue:
- **Jumps are sky:** round pips.
- **Flashes are ember:** diamond pips, short ember strokes running back along the gold line from the head over its
  first 6 segments (`RUN_SEGS`), and a streak.
- **The wrap** is a slow glint running down the gold line, fading with it over the wrap's last 2 s.

Sky against ember is the pair colour-blind eyes separate best, and the shapes carry it without colour too. The accents
appear only on power marks.

- **Pips:** on a short arc behind the head; holding both kinds, the golden jumps' pips sit on the snake's left of the
  arc and the golden flashes' on its right. Each is ringed in a parchment keyline inside an ink line, so ember reads on
  Gobbler's orange and sky on Metagamer's cyan (0.14 of a cell, 0.12 with three or more, then the rings). The diamonds
  are slim lozenges pointing along the arc's spokes, spaced so they never touch. At the board's edge the whole arc
  moves in, so no pip is cut off, and the stun stars sit a little further out to clear them.
- **Your stamina** (2u: one for jump and flash): a ring round your head, fixed to the screen. It fills from the bottom
  up both sides at once, like water in a glass, over a faint track, and spending drains it from the top. A sky notch
  marks a jump's worth, an ember notch a flash's; the water is ember with a flash's worth in it, sky with a jump's,
  else dark. Full, it shows faintly; each power coming back gives one bright flick in its colour. Holding golden jumps
  and flashes both, no ring. A stunned press shows the jump's hop or the
  flash's double chevron in its accent (Honey when golden), and a press that can't go an inked × in it.
- **Tags:** one 6 px chip per power, with small inline icons in ink (a hop, a double chevron, a loop): golden jumps sky,
  golden flashes ember, both on Honey with the count. Your own tag always shows your plain jump and flash, filling in
  their accents as they rest; rivals show chips only while they hold golden powers or the wrap. A name never gives way
  to a chip: on a narrow tag the chip drops its counts and keeps its icons (the pips on the board and the screen
  reader's words still give the number).

### Bridges and jumps you can see

- **A jump: height is scale.** The board is seen from above, so a jump rises toward you: the head swells (0.38 at the
  top, 0.5 for a golden one: `LEAP_SWELL`, `LEAP_SWELL_GOLD`), rises, tops out over the hopped cells and comes down;
  the neck follows at 0.7, 0.4 and 0.15 of the head's lift. After landing, the arch holds at 0.45 over a body it
  crossed for as long as that body lies under it. Its shadow stays on the ground, visibly apart: at the top it falls
  0.62 cells right and 0.82 down, 15% smaller and never swollen, laid over the bodies on the ground. Dust puffs to the
  sides at take-off; a ring of dust and a 230 ms squash on landing; two faint parchment arcs mark the path, bowing out
  over the hurdle and fading 260 ms after. Drawn ahead (unless you're watching alone), a jump that's sure to go starts
  rising before its tick. With reduced motion: the lift (a still airborne pose for the head) and the shadow only.
- **A body over a hole** is a bridge: a segment over a pit hangs by how far in from the rim it is. Its shadow drops onto
  the pit floor, 0.2 and 0.28 cells further off, a little bigger, and leaves the bark once half way over. The floor
  round where the shadow falls catches a little light (four faint steps), and the shadow lies dark in it. A span between
  rims sags, up to 22.5% smaller in its middle; a tail end past the rim droops, up to 30% smaller and darker, until it
  leaves the cell, smoothly between (`sinkOf()` in `render/looks.js`). What's up in the air doesn't sag.

Both read at phone size. Nothing new is clipped or veiled: shadows over a pit go in the bark's veil, and what's near a
hole is worked out once a tick.

### A body over a pit, smooth

A span over a pit is slimmer but as smooth as on the bark, and shaded as one body:
- **The bands fill out** (`bandR` in `render/lead.js`): over a pit, a band's half-width eases from `PINCH` of its
  segment's radius to the narrower of its two segments' radii, by how far over the pit they are. Never past either: a
  head over the pit (it doesn't sag) or a gulp stays round, its band no square shoulder. What's up in the air keeps its
  pinch. Every shape a body is drawn with follows it: the body, its outlines and rim, the gold line, its shadows and the
  land's colour round a rival. Its sheen dots stay, one a segment, so you can still count them.
- **Shaded as one body** (`shadeUnder`, `shadeBands` in `render/bodies.js`): a straight run over the pit is shaded by a
  strip along its lower side (its right one going down), drawn after the segments so it runs on through them, each
  half of a band in the darker step of the segment it's nearer. A round segment (`roundAt`: an end, a turn, or one more
  than a unit wider than its bands, like a head or a gulp) keeps its crescent of shade along its lower right, and the
  strips by it and round a turn go down before the segments, which cover their ends.

### Hunger on the body

Every snake shows its hunger on its body, read from the clock its tag reads (`hungerLook` in `render/looks.js`), so you
see it where your eyes already are, on yourself and on every rival:
- **It slims** as its last meal runs out: its body (not its head) up to 22% thinner (`HUNGER_SLIM`), by the share of the
  meal gone to the power 1.5, so a snake just fed looks as it always did, a hungry one is plainly thinner, and the
  change creeps in rather than jumps. A snake that starved stays thin.
- **It growls** in the warning's seconds (the toast's, `SnakeEngine.hungerWarning`: 6 s before it starts shrinking, or 9
  before it would starve if that's sooner, in real time, snow or not): two short arcs either side of its head, cream
  under ink so they read on the bark and on any body, swelling out and fading on each rumble (520 ms, `GROWL_BEAT`, a
  beat the "Your tummy is rumbling" toast and the rumble sound go with), and its head shakes a little, both stronger
  toward the end. With reduced motion the arcs hold still and the head doesn't shake.
- **It pales** while starving (shrinking a segment every 1.5 s): a parchment wash over its whole shape, full within the
  first segment lost. On the palest bodies (Mason's marble, Ghost) it barely shows; the slimness and the growl carry it
  there.
- **The meal goes down:** after a meal, each segment eases from how slim and pale it was drawn to how its clock says it
  should be now, in a wave 3 segments deep (`MEAL_SPREAD`) that reaches the tail in 700 ms (`MEAL_MS`), its colour
  flooding back with it; with reduced motion, the whole body eases back in a 250 ms fade.
- The Field guide's Hunger row says it: "A hungry snake grows thin, then growls; one gone pale is shrinking. At 3 it
  starves. Your bar is under your name."

The rivals are shown nothing new (their own clock is in `aiView()`, as a person sees their bar); online, the tag
carries `lastAte` and `mealMs`, so a guest sees the same.

### Stamina on the body

Every snake wears the step its stamina is at (`render/stamina.js`; the steps are `SnakeEngine.staminaStep`, read on the
clock as drawn, and the rule is `37-one-stamina.md`), on yourself and on every rival, never as a bar over it:
- **Tired**, while it can afford neither power: a low gray wash over its shape (`staminaWash`, in the last pass with
  hunger's pale one) and its body 7% thinner (`TIRED_SHRIVEL`, its head as it was), and heavy lids, its head's colour a
  shade darker with an ink edge, down over most of each eye from the back (`heavyLids`), sagging slowly (1.7 s) unless
  motion is reduced.
- **Awake**, once it can afford one: as it always looked.
- **Game on**, at a full bar: bright eyes, the shared eyes' whites a little wider and their catchlights bigger
  (`lightOf`, `wideOf`); eyes with no catchlight of their own (Drab, Creeper, Copycat, Ouroboros) get one
  (`brightSpecks`), and Ghost's and Wildcard's glints grow.
- A step eases in over 250 ms (`STAMINA_FADE`), at once with reduced motion; a dead snake wears none. The face helpers
  in `render/faces.js` read the step from `staminaFace`, set before each face is drawn, so every look gets it; Sniper's
  one eye is behind its scope, so it shows tired by its body alone.
- The Field guide's Stamina row shows a tired snake above an awake one wearing your ring (`guideStamina`).
