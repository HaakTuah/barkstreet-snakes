# The snakes' looks, as it was decided: the round files' text

The snakes' looks as the round files and the topic files had them, word for word, with their superseded versions and
measurements. "The snake as a character" was a file of its own, so its heading sits a level lower here. The current
rules are in `docs/design/03-the-snake-as-a-character.md`.

## From the art direction (`02-art-direction-storybook-bark-on-a-mossy-log.md`)

**The cast palette is a deliberate exception.** The 18 personalities plus you need 19 separable identities, which 8 colors can't give. Each character keeps its own color, but it's never the only identifier: every character also has a face or body pattern (crown, tricorn and cross-belts, a scope and a squint, bricks and laurel, jester two-tone, the flag and hair, a mime's face, cat ears, a mustached star, and so on). You get a cream outline.

## From the snake as a character (`03-the-snake-as-a-character.md`)

### The snake as a character

Your snake is the protagonist, so it gets the most life:
- **Eyes that glance at the nearest food:** white sclera with ink pupils that ease toward the target.
- **A blink** every 3–6 s, at random.
- **A forked tongue flick** every few seconds, more often when food is close.
- **A body that tapers to the tail**, with **smooth rounded curves at corners**. The spine follows the real cells, so the body never cuts a corner. **It's a caterpillar: one round segment per cell**, each joined to the next by a narrower band and lit on its upper left, so you can count a snake's length at a glance. (For a while bodies were smooth tubes; they looked less alive and hid how long a snake was, so the segments came back. The shadow and outline follow the same pinched shape.)
- **A head that turns smoothly and holds its line:** it swings round over a moment when the snake turns, and when it turns again and again (a staircase, a wiggle), it holds a steady line between the two ways instead of whipping round every tick (which flung Joker's party blower, and every other tongue, from side to side). Since round four that steady line is the rivals' only: yours turns in about 60 ms (`FACE_EASE_MS`), even in swift play, as soon as your head is drawn heading the new way.
- **A bite:** the mouth opens when food is right ahead, the head squashes at the bite and chews twice, and a gulp bulge travels down the body, one segment per tick.
- **A bright cream outline with a soft halo**, so you find yourself at a glance without relying on green. Friends online get a thinner, plainer outline: people still read as people, but only you glow.

The rivals keep their faces and patterns, and share the blink, the bite and the gulp. **Only you (and friends online) have a real forked tongue.** Every few seconds each rival flicks out something that fits it instead, on the same out-and-back rhythm, each at its own pace, so the gag reads as the snake's tongue: Wildcard slides out a dollar bill, Joker toots a party horn that unrolls from its curl, its fringed tip fluttering and a puff of confetti at full stretch, Desperado pokes out a silver six-shooter (bang: a flash and a puff of smoke), Sniper's laser sight blinks on from its scope, Sovereign rolls out the red carpet for itself, Colonist draws out a brass spyglass to look for land, Mason unrolls a papyrus scroll (Latin, naturally), Metagamer (who now wears red-and-cyan 3D glasses, in a card frame outlined so it reads on its cyan head) slides out a keyboard to type up its notes on you, keys lighting up as it types, Vulture chews on a bone, and Star flicks out a tiny spinning star on a ribbon of rainbow, a glint at full stretch (*since round six A* it twirls its mustache instead: see "Star's mustache"). Gobbler licks its lips with a fat pink tongue, often (more near food); Creeper's tongue is the snakiest, long and wriggling; Drab's is short and limp and can't be bothered; Ghost breathes out a wisp of ectoplasm. Capricious flicks its mood's, and Copycat copies its model's (with no one to copy, it bleps like a cat). Everything that comes out is drawn with a dark outline or a bright colour so it still reads at phone size, and it's drawing only: none of it touches the game. **Every snake looks at something**, and what it looks at says who it is (drawing only: it never changes how anyone plays). Gobbler eyes the nearest food, its eyes growing as it gets close; Star the nearest golden power (a golden beetle, leaf or mushroom), the thing it craves. Sniper swings its scope onto its target, Sovereign and Colonist watch intruders (Colonist otherwise eyes its next flag), Vulture watches the snake it expects to die, Copycat its model, Creeper the tail it rides, and Ghost, Metagamer, Desperado and Joker the nearest head. Drab lazily eyes the nearest food under heavy lids, and Mason keeps an eye on whoever is near his wall. **Mason is Caesar in marble:** a warm white body with grey veins wandering across every segment (now and then a gold one), so with his laurel wreath his head reads as a marble bust. (He used to be grey stone bricks: a builder, but not a Caesar.) With nothing of its own to watch, any snake watches the nearest head, so no face ever just stares ahead. Wildcard has an orange tan under a big fluffy golden pompadour, swept back, its lick at the front curling up and back (see "Wildcard's hair"), a white collar and a long red tie that bends with its rainbow body; it squints, pouts, and lets its eyes wander wherever they like. Most have small white eyes with a catchlight, closed eyes that curve like a cartoon's when they blink, and a little mouth; Ghost, Creeper and Copycat keep their special eyes, which still turn, and Vulture's beak gapes instead. Vulture glares from under slanting brows over a big hooked beak, pale horn with a dark tip, outlined so it still reads at phone size; Joker wears a harlequin diamond round each eye, in its hat's purple and orange. Sniper never blinks on the job; knocked out, its squint becomes a cross and the scope slumps off to the side, lens cracked. **Capricious starts every round undecided** (its own pink self, one eye big, one small, a brow cocked, playing it safe) for 3.5–5.5 s before its first mood, and dithers like that for 1.2–2 s between moods. Before, it picked a mood on its very first move, so you never saw its own face. Gobbler wolfs its food down: a gulp twice the size, and hamster cheeks either side of its mouth that puff up with every bite and slowly go down. Capricious is always pink, so you can always find it whatever mood it's in; each change of mood is a costume change, a puff round its head with the old face popping off and the new one on (see "A costume change" in `35-capricious-copycat-and-wildcard.md`), and Copycat's change of model looks the same, in its red. **Wildcard wears the Stars and Stripes** behind his tan, white collar and red tie: two segments of navy with white stars, then red and white stripes, with the white collar segment kept as it is (the rainbow went to Mute, and on to its moods). **Mute** is a mood-ring mime: white greasepaint, a black beret, a painted tear and small dark lips, its body (and the blush on its cheeks) the colour of how it feels, its brows and mouth acting it out (see Looks and lines); its painted lips part and a second, inner jaw shoots out, snapping (it used to be a white glove, waving); it never speaks, so its bubbles are mimed (*pulls an invisible rope*, *draws a box in the air around you*), and it plays a boxer-in: it picks a target and squeezes its room (wins 28% of its rounds in the simulator, mid-pack). **Capricious does impressions:** in a mood it speaks that rival's own lines (its Mason quotes Latin, its Ghost says "…"), and taking up a mood it does a turn and can't help asking how it went ("Headshot! …Is that how Sniper says it?").

## From the third pass (`11-the-third-pass-what-it-settles.md`)

**Gold means power.** The powers brought their own lemon yellows (`#fde047`, `#fef08a`, `#eab308`), greenish next to the warm Honey of the gold banner and the crown. They're folded into Honey: fills `#fde68a`, lines `#d4a017`, glints `#fffbea`. The decorative autumn leaves move to russet and brown, and Mute's proud mood leaves gold too, so on this board gold always means a power.

**A power is one token, not a ring.** A golden power used to draw a ring round the head with pips, on top of the stun halo, Capricious's ring, the ready ring and YOU's ring. Now it's:
- a thin opaque gold line round the body, with an ink line outside it so it reads on any colour, drawn outside your cream outline;
- pips on a short arc behind the head, turned with it: since round four, sky round pips for golden jumps and ember diamonds for golden flashes; holding both, the golden jumps' pips sit on the snake's left of the arc and the golden flashes' on its right.

The plain leap's cooldown was a thin arc round your own head that filled and closed into the ready flash. **Since round four** your two plain rests are two half-rings round your head, fixed to the screen: the jump's on the left in sky, the flash's on the right in ember. Each fills from the bottom over a faint track while it rests (not shown while you hold golden ones of that kind) and gives one bright flick when it's back. That's on the board, where you're looking, not only on the tag. On the tags, a power is a 6 px chip (the chip radius) with small inline icons in ink (a hop, a double chevron, a loop) instead of fallback-font glyphs; since round four, one chip per power (golden jumps sky, golden flashes ember, both on Honey with the count), and your own tag always shows your plain jump and flash, each filling in its accent as it rests. A name never gives way to it: on a narrow tag the chip drops its counts and keeps its icons (the pips on the board and the screen reader's words still give the number).

**Height is scale.** The board is seen from above, so a leap rises toward you: the head and neck swell along their path at the top of the arc, and the shadow on the bark spreads and softens. It no longer lifts up the screen, which read as a lunge or a flinch depending on the heading. Drawn ahead (round four, unless you're watching alone), a jump that's sure to go starts rising before its tick.

## From the first seconds (`16-the-first-seconds.md`)

**Looks.** Joker's tongue is a real party horn now (it read as a striped straw): a white mouthpiece and a flat paper tube, striped pink, yellow and purple, outlined, that unrolls from a visible curl; at full stretch its fringed tip flutters and a puff of confetti flies off it, and then it rolls back up. Mute's glove is gone: its painted lips part wide and a second, inner jaw shoots out on a ribbed, glossy stalk, its little silver teeth snapping, and back in (a mime with a secret; drawn big from the mouth so it reads at play size). Mushrooms look poisonous, now that length is armour and a mushroom only costs you: a violet haze that breathes, two wavy stink lines rising, and violet spores; eat one and you go queasy green for a moment.

## From looks and lines (`19-looks-and-lines.md`)

- **Mute is a mood ring, not a rainbow.** A mime is all expression, so its colour follows how it feels, from what anyone can see on the board: calm violet; deep violet stalking someone; deep rose closing the box (its target within four cells); white as a sheet when hemmed in or with a rival's head right by its own; dazed grey when knocked out; proud pink just after a kill (gold is for powers). Its moods are spread in lightness as well as hue, and its pale rim is its own, not its mood's. Its brows and mouth act it out too (arched, knitted, a steep scowl, raised in the middle with an O of a mouth, flat, a smug curl), and the colour changes over 0.4 s in a few steps (each a cached colour ramp, so it costs nothing). Purely for show: it never changes how Mute plays.
- **Holding a power shows.** A snake holding leaps (a golden beetle's) wears a thin, opaque Honey line round its outline, inked outside, until the last one is spent (a golden mushroom's wrap fades calmly over its last seconds), so everyone (people and rivals: the AIs see `leaps` in their view) can see who might hop over them.

## From round four (`24-round-four-the-owners-feedback-and-the-calls.md`)

### Telling powers apart

Gold stays the family colour: an outline of gold means "this snake holds a power". Each kind also gets an accent of its own, plus a shape and a motion, so you can read it at a glance without relying on hue:
- **Jumps are sky:** round pips.
- **Flashes are ember:** diamond pips, short ember strokes running back along the gold line from the head (over its first 6 segments: clipping to a whole long body cost the GPU up to 7 ms a frame), and a streak.
- **The wrap** is a slow glint running down the gold line, fading with it over the wrap's last 2 s.

Sky against ember is the pair colour-blind eyes separate best, and the shapes carry it without colour too. This bends the third pass's "gold means power and nothing else" a little: gold is still only ever power, and the accents appear only on power marks. (So Desperado's poncho stripes went from Honey to cream.)

The pips sit on a short arc behind the head, a little bigger now; holding both kinds, the golden jumps' pips sit on the snake's left of the arc and the golden flashes' on its right. Since the critique, each is ringed in a parchment keyline inside an ink line, so ember reads on Gobbler's orange and sky on Metagamer's cyan (0.14 of a cell, 0.12 with three or more, then the rings). The diamonds are slim lozenges pointing along the arc's spokes, spaced so they never touch (three that touched read as a zigzag seam). At the board's edge the whole arc moves in, so no pip is cut off, and the stun stars sit a little further out to clear them. Your two plain rests show as two half-rings round your head, fixed to the screen: jump on the left in sky, flash on the right in ember. Each fills from the bottom over a faint track as it rests (not shown while you hold golden ones of that kind) and gives one bright flick when it's ready. A stunned press shows the jump's hop or the flash's double chevron in its accent (Honey when golden), and a press that can't go an inked × in it. On the tags, one chip per power: golden jumps sky, golden flashes ember, both on Honey with the count. Your own tag always shows your plain jump and flash, filling in their accents as they rest; rivals show chips only while they hold golden powers or the wrap.

## From round five (`26-round-five-star.md`)

**The look.** It's our own star, not a copy:
- **The head** is a five-pointed star with softly rounded points (a sharp star, points 1.3 and valleys 0.68 head radii, grown round), its points turning with its heading, one to the back, into its trail. **Its face stays upright** at every heading, its chin tipped 18° toward the way it's going across the screen: tall oval ink eyes with a catchlight, bushy white brows outlined in ink, and a huge white walrus mustache under them, its mouth and its tongue gag (downward) beneath. Heading down, left or right, the mustache droops over its two lower points; heading up, its back point sits under its chin. (As built at first, the face turned with the heading like every other face, and heading up the mustache sat above the eyes and read as huge angry brows: the critique turned it upright.) It wobbles when it's stunned.
- **The head's colour.** Star is sunflower yellow (`#f9c22e`), deeper than Honey, with an orange rim (`#e8890c`) and an ink outline. Gold means power, and Star's yellow must never pass for a power mark. Sovereign's crown and Wildcard's pompadour set the precedent: a yellow on a face is a look, and the gold outline round a body is the power. When Star holds golden powers, it gets that outline like anyone: its gold line, its shadow and a land's colour round it follow its points (sunflower, then ink, then Honey, then ink, so the head never reads as the gold line), its pips sit past its points, and its stun stars a quarter of a cell further out than a round head's.
- **The body** is the old rainbow (`hsl(h, 85%, 62%)`, 28° of hue a segment, moving a degree every 15 ms), flowing down from the head toward the tail: the other way to the old one, whose hues flowed up toward Wildcard's and Mute's heads. It fades toward the bark at the tail like everyone's, holds still with reduced motion, and stops where it was when Star is out. (*Since round six A* it streams back by the distance Star travels, and drifts slowly with reduced motion: see "Star's rainbow streams".)
- **Its tail sheds a small four-point twinkle** in one of the rainbow's six colours every 0.3 to 0.7 s, only with motion on. There's no halo: only you glow.
- **For its tongue gag**, it flicks out a tiny spinning star on a ribbon of rainbow, with a glint at full stretch. (*Since round six A*, its mustache twirls instead: see "Star's mustache".)
- **It looks at** the nearest golden power (a golden beetle, a golden leaf or a golden mushroom), and otherwise at the nearest head.
- **Its beads** come out in rainbow order from its head (red, orange, yellow, green, blue, violet, and round again), and the pieces it bursts into take the same colours.

**The tell: a countdown on its five points.** An addict's weakness is the comedown.
- **Its middle is always its sunflower.**
- **As it flashes,** its points go dim (`#b0893a`, rimmed `#8a5c24`) and its twinkles burst off them.
- **As its rest runs down,** they light again one by one: a point every 1.2 s, from its back point round.
- **The fifth lights when the flash is back,** and two twinkles go round its points. Holding golden flashes, all five are lit.
- **Its brows** knit as it flashes and relax early in its rest.
- **With reduced motion,** each point lights at once, one at a time, and nothing blinks.

Count its points to see how soon it can flash again, and box it in while they're dim. This is drawing only. It shows what the rules already know, and the rivals don't use it: they assume anyone may flash, as before.

*Why a countdown:* as first built, Star was bright only while its flash was ready. It flashes the tick its rest ends, so that was 5% of the time in a real round, 0 to 234 ms at a stretch. It was a mustard biscuit on 9 frames in 10, and its "ready" was a blink, and with reduced motion a flash of the whole head. Now a watched round shows it two-thirds sunflower, and never all dim.

**The cast** is eighteen now. Star's dot on the tags is a little rainbow round a sunflower middle. Its colour in text is a darker yellow than its star: its persona colour, `#eab308`, which its name in the log and the Hall of Fame and a bubble's edge use, against the drawn sunflower `#f9c22e`.

**Copycat copying Star** wears a pale copy of its rainbow (each hue 0.45 toward white), flowing in step with Star's and holding still with reduced motion, with pale rainbow beads; as a single colour (its tag dot's middle, and where one colour is all there is) it's a pale violet, `#d19df7`. (*Since round six A* its head keeps the flag's red and its tag dot is its own starred one in every state: see "Copycat in the flag's red". The pale violet stays where one colour is all there is.) It used to take Star's text yellow, lightened: a pale gold snake, as if it held a power, and its gold line all but vanished when it did. It copies Star a third of its living time when they share a round. **Star's burst** (and Copycat's while it copies Star) is a shockwave of six rainbow arcs and rainbow pieces, and its knock-out sparks are rainbow: they were the gold and cream of a golden pickup.

**Along the way, for everyone.** A face's turn is settled once a frame, before its shadow and outlines, so across a wrapped edge a face no longer turns twice as fast; an eaten bead's crumbs are the bead's own colour, not its owner's.

**Worth a look.** Two things the build left for the owner's eye: the rainbow's lemon segment (hue 55) can sit right behind gold pips, the closest thing on the board to Honey, though it reads as part of the rainbow; and dim Star's points are close in tone to the Honey line round it at phone size, kept apart by the ink between them (`mobile-star-gold.jpg` in the shots tour shows both).

## From round six A (`27-round-six-a-fairness-and-fixes.md`)

**Star's mustache** (the owner: "I am not really a big fan of the tongue of the new rival 'Star'."). Its tongue gag was a tiny star on a ribbon of rainbow. Its gag is now its mustache: on the same beat, the ends bend up toward its eyes and curl into inked twirls, and a little "harrumph" puffs out from under it. Nothing comes out of its mouth. (16 cached steps; with reduced motion, the twirl without the puff.) Copycat copying Star holds up a stick-on mustache and twirls it.

**Bridges and jumps you can see.**
- **A body over a hole** looked as if it hovered (the owner: "looks a bit bad that it just hovers above it"). Now:
  - its shadow drops onto the pit floor, deeper and softer than on the bark;
  - the span over the gap is shaded underneath and sags a little between the rims;
  - the tail end over a hole droops down into it.
- **A jump was easy to miss** (mostly the head swelling; the owner: "leaping should maybe look more apparent"). Now:
  - the body lifts along the neck in an arc;
  - its shadow stays on the ground, visibly apart;
  - the hurdle passes underneath with the shadow across it;
  - dust puffs at take-off, and a faint arc trails behind;
  - landing brings a squash and a ring of dust.

  Both read at phone size and hold still with reduced motion.
- **As built:**
  - *the jump:* the head rises, tops out over the hopped cells and comes down; the neck follows at 0.7, 0.4 and 0.15 of the head's lift. After landing, the arch holds at 0.45 over a body it crossed for as long as that body lies under it. At the top the shadow falls 0.62 cells right and 0.82 down, 15% smaller and never swollen, laid over the bodies on the ground. Dust puffs to the sides at take-off; a ring of dust and a 230 ms squash on landing; two faint parchment arcs mark the path, bowing out over the hurdle and fading 260 ms after. With reduced motion: the lift (a still pose for the head) and the shadow only.
  - *the bridge:* a segment over a pit hangs by how far in from the rim it is. Its shadow drops 0.2 and 0.28 cells further, a little bigger, and leaves the bark once half way over. Its underside is a crescent in a darker step of its own colour, and since the critique the shade runs on along the bands between the segments too, so a span reads as one body, not two darker beads; a span sags (up to 22.5% smaller in the middle; it was 15%, under a pixel at 390); a tail end past the rim droops, up to 30% smaller and darker, until it leaves the cell, smoothly between.
  - *a lit pit floor* (the critique: on the all but black floor a span's shadow had nothing to darken, and at phone size the gap under the body didn't show): the floor round where the shadow falls catches a little light, four faint steps laid on in the shadows' veil, and the shadow lies dark in it, further off down and to the right than on the bark. It's drawn as rectangles worked out from the cells (each straight run of what's well over the pit, cut to the hole cells near it, short of the rim), since a layer of its own cost 0.3 ms of GPU a frame and up to 2 ms of waiting, and a mask 0.7 ms.
  - *the cost:* nothing new is clipped or veiled; shadows over a pit go in the bark's veil, crescents are cached colour steps, and what's near a hole is worked out once a tick. Against 11fb49a, in one page with interleaved frames: the long, long-star, fields and holes scenes within noise (0.95 to 1.03); the new bridges scene 1.10, and leaps 1.21 while a jump is in the air (about half a second a jump). Measured again in wave 2, against 8d9cde2, the 1.21 didn't come back: leaps 1.0, no dearer than the long scene. A jump's trail costs about 0.2 ms a frame (now mitred, with one straight run over the top: the same line, 7% cheaper), and its shadow in the air about 0.75 ms. With the critique's lit floor and sag, against 554ebf4 (20 pairs): bridges 1.05 (quartiles 1.00 to 1.13), long 1.00, leaps 1.04, holes 1.06, woodpecker 1.07, all within their quartiles.

**Copycat in the flag's red** (the owner: Copycat is a parody of the Chinese Communist Party, "but it has a pink color. Should its natural color be closer to that of the red in the flag? it already has the yellow symbol."). Its own colour was a pale red, `#fca5a5`, read by everyone as pink. Now it's the red of the flag, `#de2910`, and its party pin the flag's yellow, `#ffde00`. Two things keep it apart from the cast's other reds (Sniper's dark red, Colonist's redcoat crimson, Wildcard's Old Glory):
- **Its head stays its own.** Copying someone, its body still wears a pale copy of their colours (that's the joke: it can't help copying), but its cat-eared head keeps the flag's red and the yellow pin, so it always reads as red-and-gold at a glance.
- **A yellow star on its tag's dot**, where the others have plain dots, and its beads keep their dashed rings.

It's checked beside Sniper, Colonist and Wildcard, on the board, in the tags and in the chatter log, and through red-green colour-blind filters.
- **As built** (wave 2): its inner ears are a deeper red (pink read as the old Copycat), and the yellow pin has an ink outline so it reads on the red head. Its tag dot is the flag's red with a small yellow star, the same in every state (copying Star too) and in the Hall of Fame and Your story.
- **Measured** (CIEDE2000 of its body colour; the filters Machado's, at severity 1): it's nearest Sniper (9.4; 9.8 through deuteranopia, 8.2 through protanopia) and, through deuteranopia, Colonist (7.3, the same lightness); the old pink was 35 from Sniper. Its dashed rings, its head and its starred dot keep it apart at a glance in all three views.
- **In the chatter log** (the critique: there it was pink again, rgb(239,148,136)). A name too dark to read on the log's wood used to be mixed halfway to white, which turned the flag's red into the old pink and the cast's four reds into four pinks. Now it's lightened only as far as it needs to read (4.5:1 against the log at its lightest, about 5.5:1 where it sits), keeping its hue and saturation: Copycat is rgb(244,114,96), Sniper 234,119,119, Colonist 237,114,141 and Wildcard 229,121,134. Copycat is further from each than before, as seen and through deuteranopia and protanopia (CIEDE2000 from Sniper 5.6 → 6.4, Colonist 11.2 → 14.1, Wildcard 8.9 → 11.3), and the closest pair of names is 3.6 apart (Vulture and Capricious were 1.6). Names that read already are unchanged; Mason's stone ink is a mid grey. (A fixed lightness, the first idea, left Sovereign, Mute, Sniper, Colonist and Wildcard at 3.2–3.4:1, too dim to read.)

**Star's rainbow streams.** The owner asked whether the rainbow still changes colour as it did for Wildcard and Mute: "It just didn't look like it was animated to me anymore". It did change, but its colours flowed back along the body at about a quarter of the crawl, so over the log they crept forward with the snake and looked painted on. (The old one flowed toward the head, which added up to an obvious shimmer.) Now the flow is tied to the distance Star travels, about 1.25 times its crawl, so the colours stream backward over the log behind it like a trail. Each segment changes hue about once a second. It settles when Star is stunned or stops, and bursts on a flash. With reduced motion the colours drift slowly in place instead. Copycat's pale copy stays in step.
- **As built** (wave 2): the hue at its head is (cells travelled × 1.25 + a burst) × 28°, the cells counted once a tick from the head's move (a flash counts all its cells) plus the frame's way through the move. At the opening speed a segment goes round the rainbow about every 1.3 s (about 280° a second), and a colour moves back over the log at about a quarter of the crawl. Stunned or stopped, it's still; a flash adds 6 segments' worth, easing out over 360 ms; with reduced motion it drifts 10° a second wherever Star is. Copycat's copy goes by its model's distance and bursts.

## From the owner's playtest (`32-the-owners-playtest.md`)

### A body over a pit, smooth

**The finding** (the playtest of 20 October, queue item 3; the owner: "The part of you that is over the hole gets a really odd outline"): over a pit, the body's round segments bulged above its line and its cream rim seemed to go.

**The cause:** over a pit a span is drawn slimmer (round six A: it sags, see "Bridges and jumps you can see" in `27-round-six-a-fairness-and-fixes.md`), but its segments stay a cell apart, so they parted: round beads above a thin band between them, the outline scalloped round each bead, and the shade underneath drawn as a crescent on every bead and a narrower strip on each band. Measured, the top of your body varied 0.09 cells along a span (0.05 on the bark).

**The call** (27 October 2026):
- **The bands fill out** (`bandR` in `render/lead.js`): over a pit, a band's half-width eases from `PINCH` of its segment's radius to the narrower of its two segments' radii, by how far over the pit they are. Never past either: a head over the pit (it doesn't sag) or a gulp stays round, its band no square shoulder. What's up in the air keeps its pinch. Every shape a body is drawn with follows it: the body, its outlines and rim, the gold line, its shadows and the land's colour round a rival. So the span is still slimmer by the same sag, but its line and rim are as smooth as on the bark (the top edge now varies 0.00 cells). Its sheen dots stay, one a segment, so you can still count them.
- **Shaded as one body** (`shadeUnder`, `shadeBands` in `render/bodies.js`): a straight run over the pit is shaded by a strip along its lower side (its right one going down), drawn after the segments so it runs on through them, each half of a band in the darker step of the segment it's nearer. A round segment (`roundAt`: an end, a turn, or one more than a unit wider than its bands, like a head or a gulp) keeps its crescent, and the strips by it and round a turn go down before the segments, which cover their ends.

**Tested:** `tools/render-test.js`: you across a hollow three cells wide, its top edge level along the middle of it and the cream rim as thick as on the bark; then your head over it and your neck on the bark, no band wider than either of its segments. The bridge check's band sample moved to the wider band's lower edge, and its sag is measured on the whole body, shaded part included (32 pixels across before and after, against 36 on the bark).

### Hunger on the body

**The finding** (the playtest of 20 October): on a wide desktop the hunger bar on your tag is far from your snake, out of sight, and the owner starved without seeing it come.

**The call** (27 October 2026): every snake shows its hunger on its body, read from the clock its tag reads (`hungerLook` in `render/looks.js`), so you see it where your eyes already are, on yourself and on every rival:
- **It slims** as its last meal runs out: its body (not its head) up to 22% thinner, by the share of the meal gone to the power 1.5, so a snake just fed looks as it always did, a hungry one is plainly thinner, and the change creeps in rather than jumps.
- **It growls** in the warning's seconds (the toast's, `Engine.hungerWarning`: 6 s before it starts shrinking, or 9 before it would starve if that's sooner, in real time, snow or not; until #327 it read the hunger clock, so a snake of 4 in snow was warned only 4.5 s before the end): two short arcs either side of its head, cream under ink so they read on the bark and on any body, swelling out and fading on each rumble (520 ms, a beat the "Your tummy is rumbling" toast and the rumble sound go with), and its head shakes a little, both stronger toward the end. With reduced motion the arcs hold still and the head doesn't shake.
- **It pales** while starving (shrinking a segment every 1.5 s): a parchment wash over its whole shape, full within the first segment lost. On the palest bodies (Mason's marble, Ghost) it barely shows; the slimness and the growl carry it there.
- The Field guide's Hunger row says it: "A hungry snake grows thin, then growls; one gone pale is shrinking. At 3 it starves. Your bar is under your name."

The rivals are shown nothing new (their own clock was always in `aiView()`, as a person sees their bar); online, the tag already carries `lastAte` and `mealMs` (protocol 8), so a guest sees the same. **Tested:** `tools/render-test.js`, Sniper just fed, with 2 s left and starving: slimmer in its own colour, growl lines beside its head, and starving paler.

**A new player's starving rate** (`tools/dev/hunger-seen/measure.js`): there is no model of a person, so a stand-in. AI rounds with the game's own rules, seat 0 standing in for a new player (a rival plays it), with its view of its own hunger hidden until it would notice it, then a second late: never (the owner on a wide desktop), at the warning toast (before this change), once its body is visibly thinner (5%, at 37% of its meal gone: after), or always (a rival, or someone watching the bar). 

*Measured*, 300 rounds a seed on fresh seeds 61 / 73:

| Seat 0 notices its hunger | Rounds it starved in | Its deaths by starving | Snake-time in the warning (starving) | Wins |
| --- | --- | --- | --- | --- |
| never (the bar unseen) | 6.7 / 9.3% | 9.0 / 12.3% | 14.7 / 16.1% (5.0 / 5.7) | 25.7 / 24.0% |
| at the toast (before) | 1.3 / 1.3% | 1.9 / 1.8% | 13.6 / 13.4% (3.7 / 3.5) | 29.0 / 24.7% |
| from its body (after) | 0.3 / 2.3% | 0.4 / 3.1% | 12.4 / 14.0% (3.0 / 4.4) | 24.3 / 24.7% |
| always | 1.3 / 1.3% | 1.8 / 1.8% | 12.2 / 12.6% (3.4 / 3.5) | 24.3 / 26.0% |

So what starves a new player is not seeing hunger at all: unseen, 8.0% of rounds end in starving (48 of 600); seen in any of the three ways, 1.3% (8 of 600 each). Seeing it earlier on the body adds nothing over a toast acted on at once, by this measure; the stand-in reads 6 s as plenty, as the rivals do. The change is where it shows: the toast is easy to miss, as the owner did on a wide desktop, and your body is where you are looking. A person's real rate needs a person: the owner's next desktop rounds will say.

### Wildcard's hair

The owner: "Not a comb-over: his real swoop, a big fluffy golden-blond pompadour swept back, then forward and to one side.
It must read at phone size."

- *Before:* a flat golden patch combed across the back of the head to a small curl over one eye, the same size as the
  head; at phone size it read as a yellow cap.
- *Then* (PR #74, `pompadour()`): the roll swooped forward along one side to a flick past that eye. The owner (28
  October): "It flips to the front side, you know like a blond emo/goth haircut"; heading up, it read like a turban.
- *Then* (PR #107, `render/faces.js`, `hairBack()` and `hairRoll()`), seen from above with the head pointing +x and -y the
  far side: two shapes, each with a dark amber outline so they read at phone size. Nothing is in front of the brow: a
  lighter raised roll runs along the hairline just behind the eyes (its front edge at x = 0.12 of a cell, no further),
  with a shine along its crest, fuller at the far end. Behind it, the fluffy golden mass puffs out past the head, most
  at the back and the far side; its strands run straight back over the crown and turn to the far side at their ends, so
  the comb reads up, back and round. The eyes, pout and squint are as they were.
- *Then* PR #110's lacquered mop, PR #144's version F and PR #156's F at 85%. The owner (30 October): "trump looks like
  David Lynch now. I actually think the very first or second hairstyle trump had in the game is better", and picked the
  first, "but have the swirl point upwards instead of downwards".
- *Now* (2n, `render/faces.js`, `hairBack()`, `pompadour()`, `wildHair()`): PR #74's pompadour exactly as it was
  (shape, size, strands, colours and outline), with one change: its lick, the curl at the near end of the roll that came
  forward over the brow to a flick past the eye, is turned round, curling up and back over the hair behind it, its two
  combed strands following it. Two tries that reworked more were turned down; the owner (31 October): "it looks horrible.
  I want the original hair, but I want the lick reversed. That's all. Keep it that simple."
- Drawn in the head's own frame, so it is the same at every heading, and still: nothing in it moves, with reduced motion
  or without. Capricious's Wildcard mood wears it too. Drawing only.

### Copycat's face

While copying, its head mixes the copied colour about half and half with its red; a thin red rim and the yellow star
pin keep it Copycat. Uncopied, it stays full flag red.

- *Before* (since "Copycat in the flag's red"): its head kept the flag's red whoever it copied, so only its pale body
  told you it was copying, and whom.
- *Now* (`render/looks.js`, `fillsOf()`; the rim in `render/bodies.js`): copying, its head (and its cat ears, with the
  deeper red inside) is its model's own colour, full rather than the body's pale copy, mixed half and half with
  `#de2910` (`COPY_HEAD`, 0.5, in plain RGB). Copying Star it takes the rainbow's hue at Star's head, flowing in step;
  copying Mute, its colour of the moment (Capricious keeps its own pink in every mood, since 3b). A 1.5-unit rim of the flag's red runs round the head inside
  its edge, and the yellow pin is as it was. Copying no one (or its model out), the head is all red and has no rim.
- A colour opposite red mixes to a neutral: Metagamer's cyan gives a grey head, Sovereign's blue a plum one, Vulture's
  black a dark red. The rim and pin keep these Copycat; it's the honest half and half.
- Drawn from what both screens know (its model, synced online as `memory.modelId`, and the model's colour), so host and
  guest show the same head. Drawing only.
