# Design: Barkstreet Snakes

## The vision in one paragraph

A storybook diorama of a mossy log on the forest floor, seen from above. Four caterpillar-snakes wind across its warm bark, between cushions of moss, while notes on parchment tell you what's going on. Everything should look cut from the same few materials: **bark, moss, heartwood, parchment, ink and leaf**. Nothing should look like a generic app widget. The game isn't classic snake: it's a small rivalry between you and three characters with their own minds and voices. Polish means making every part of that rivalry readable, fair, smooth and charming, not adding more of it.

**The second pass** (see AUDIT.md) adds nothing new to play. It goes after the moments that still felt off when looked at frame by frame: the death freeze-frame that jumped, bends that pulsed, a woodpecker that could peck the cell right in front of you, a Hall of Fame rank that changed its mind, phones and laptops that hid the board or the Play button, and online rooms that broke after a few rejoins. It also moves the frame budget to where the time really goes: the GPU drawing long snakes.

**The third pass** (AUDIT.md) comes after a big round of new rules: crashes that cost length, a smarter AI, leaps, dashes and wrap. Those made the game deeper, and they also made it noisier and harder to read. A held key could fire a power, and the death card no longer explained deaths. A banner came every five seconds, and the powers spoke in a second, lemon gold. Sounds vanished on a phone, and the bodies drifted back to the expensive way of drawing. So this pass is about legibility and restraint. Every rule shows on the board or the card when it matters, the narrator speaks less and better, and gold means power and nothing else. It also fixes the measuring tools first, so the numbers are the game's.

## Art direction: "storybook bark", on a mossy log

**A log, with the tree's looks.** As the board grew weather, burrows, a woodpecker and force fields, "the bark of a standing tree" stopped making sense: apples fall onto it, snow settles on it, things lie on it rather than cling to it, and snakes don't climb trees. A meadow was considered and turned down: it would lose the woodpecker (it pecks wood), the bark beetles and their burrows, burning wood, and the name *Bark & Bite* (now *Barkstreet Snakes*, still bark). A log on the forest floor, under an apple tree, keeps all of those and fixes the physics: everything lies on top, apples drop from the branches above, snow settles, and snakes really do bask on logs. The first log (a horizontal grain, a strong roll, heavy cushions of moss, a frame of log ends) was busier and darker than the tree, and the tree looked better. So the log now keeps the tree's looks: the same warm bark with its grain running top to bottom (the log runs that way), the same soft sun and shade and the carved heartwood frame, plus a little shadow down both sides where the log rounds away. Moss is a trim, not a carpet: a dozen small soft cushions, mostly down the sides where it wraps round the log, a few on top. Each is a clump of small rounded tufts with a shadow under it, every tuft lit on its upper left and darker round its edge, with fine fuzz and, on the bigger ones, a few red-brown spore stalks. It's dark and olive, well apart from the apples' bright lime, so it never passes for food. The moss along the frame's edges is the same moss, in the same colours. Faint lichen was tried and dropped: at play size its pale rosettes passed for puffs of smoke, which on this board means fire.

**Why it suits snake.** Snakes and caterpillars belong on bark. The texture gives the grid a sense of place. There are no grid lines (they made it look like squared paper): everything on the bark sits on the cells, so they stay easy to read without them. Warm, mid-dark bark lets bright characters and food pop by brightness, not only by hue. It's also the direction you chose, inspired by the caterpillar game in *Flåklypa Grand Prix*. It's kept and refined rather than replaced.

### Palette: the 8 interface colors

Everything in the UI uses only these.

| Name | Hex | Used for |
|---|---|---|
| **Night Moss** | `#131d15` | page background: the forest floor (shafts of light from the top, a soft lighter glow) |
| **Bark** | `#5a3b22` | the board |
| **Heartwood** | `#7a4a24` | the frame, small wooden buttons, card titles |
| **Parchment** | `#f6ecd2` | cards, name tags, bubbles, banners, the dialog |
| **Ink** | `#3a2614` | all text on parchment; outlines |
| **Leaf** | `#4d7c0f` | primary buttons (passes AA with cream text) |
| **Sprout** | `#a3e635` | the title, your snake's highlights, the "fresh" accents |
| **Honey** | `#fde68a` | gold accents, flavor lines on dark, the focus ring on dark |

There are also two functional tints that aren't separate colors. **Parchment-2** is a darker parchment used for rings and tracks. **Berry** `#dc2626` is used only for danger: hunger, mushrooms and the "starving" state.

**The cast palette is a deliberate exception.** The 18 personalities plus you need 19 separable identities, which 8 colors can't give. Each character keeps its own color, but it's never the only identifier: every character also has a face or body pattern (crown, tricorn and cross-belts, a scope and a squint, bricks and laurel, jester two-tone, the flag and hair, a mime's face, cat ears, a mustached star, and so on). You get a cream outline.

### Shape, line, texture, corners

- **Corners:** everything is rounded, on one scale:
  - 6 px for small chips
  - 10 px for name tags, bubbles and banners
  - 16 px for cards and the dialog
  - 20 px for the frame
  - pills only for buttons
- **Lines:** parchment surfaces get a 2–3 px inset ring of Parchment-2, and color dots get a 1.5 px ink ring. On the board, the canvas maps 1:1 onto device pixels (nothing is resampled).
- **Texture:** only the log has texture, prerendered once a round: **a different stretch of log every round** (a new seed), so no two rounds look alike. Soft patches of sun and shade, furrows along the grain, raised plates lit along one edge, a few cracks, knots with growth rings, a little shadow down both sides, and small cushions of moss. The moss is dark and olive on purpose so it never passes for food. Parchment stays flat, and its paper feel comes from the ring and a soft shadow.
- **A living wood:** the shadows of leaves overhead sway gently over the log (one small soft layer, drawn stretched over the board each frame), and now and then an autumn leaf drifts down onto it, turning as it goes, under the food and the snakes so it never hides anything that matters. With reduced motion, the shadows hold still and no leaves fall.
- **Depth:** buttons have a 3 px "lip" and press down 2 px. Cards float on a soft 0 10 30 shadow. Snakes cast a small offset shadow on the bark. There's no blur anywhere on the canvas.

### Typography

One family: **Fredoka** (rounded), at weights 400–700, with a system rounded/sans fallback. It loads non-blocking, so the game is playable instantly and offline with the fallback font.

## The snake as a character

Your snake is the protagonist, so it gets the most life:
- **Eyes that glance at the nearest food:** white sclera with ink pupils that ease toward the target.
- **A blink** every 3–6 s, at random.
- **A forked tongue flick** every few seconds, more often when food is close.
- **A body that tapers to the tail**, with **smooth rounded curves at corners**. The spine follows the real cells, so the body never cuts a corner. **It's a caterpillar: one round segment per cell**, each joined to the next by a narrower band and lit on its upper left, so you can count a snake's length at a glance. (For a while bodies were smooth tubes; they looked less alive and hid how long a snake was, so the segments came back. The shadow and outline follow the same pinched shape.)
- **A head that turns smoothly and holds its line:** it swings round over a moment when the snake turns, and when it turns again and again (a staircase, a wiggle), it holds a steady line between the two ways instead of whipping round every tick (which flung Joker's party blower, and every other tongue, from side to side). Since round four that steady line is the rivals' only: yours turns in about 60 ms (`FACE_EASE_MS`), even in swift play, as soon as your head is drawn heading the new way.
- **A bite:** the mouth opens when food is right ahead, the head squashes at the bite and chews twice, and a gulp bulge travels down the body, one segment per tick.
- **A bright cream outline with a soft halo**, so you find yourself at a glance without relying on green. Friends online get a thinner, plainer outline: people still read as people, but only you glow.

The rivals keep their faces and patterns, and share the blink, the bite and the gulp. **Only you (and friends online) have a real forked tongue.** Every few seconds each rival flicks out something that fits it instead, on the same out-and-back rhythm, each at its own pace, so the gag reads as the snake's tongue: Wildcard slides out a dollar bill, Joker toots a party horn that unrolls from its curl, its fringed tip fluttering and a puff of confetti at full stretch, Desperado pokes out a silver six-shooter (bang: a flash and a puff of smoke), Sniper's laser sight blinks on from its scope, Sovereign rolls out the red carpet for itself, Colonist draws out a brass spyglass to look for land, Mason unrolls a papyrus scroll (Latin, naturally), Metagamer (who now wears red-and-cyan 3D glasses, in a card frame outlined so it reads on its cyan head) slides out a keyboard to type up its notes on you, keys lighting up as it types, Vulture chews on a bone, and Star flicks out a tiny spinning star on a ribbon of rainbow, a glint at full stretch. Gobbler licks its lips with a fat pink tongue, often (more near food); Creeper's tongue is the snakiest, long and wriggling; Drab's is short and limp and can't be bothered; Ghost breathes out a wisp of ectoplasm. Capricious flicks its mood's, and Copycat copies its model's (with no one to copy, it bleps like a cat). Everything that comes out is drawn with a dark outline or a bright colour so it still reads at phone size, and it's drawing only: none of it touches the game. **Every snake looks at something**, and what it looks at says who it is (drawing only: it never changes how anyone plays). Gobbler eyes the nearest food, its eyes growing as it gets close; Star the nearest golden power (a golden beetle, leaf or mushroom), the thing it craves. Sniper swings its scope onto its target, Sovereign and Colonist watch intruders (Colonist otherwise eyes its next flag), Vulture watches the snake it expects to die, Copycat its model, Creeper the tail it rides, and Ghost, Metagamer, Desperado and Joker the nearest head. Drab lazily eyes the nearest food under heavy lids, and Mason keeps an eye on whoever is near his wall. **Mason is Caesar in marble:** a warm white body with grey veins wandering across every segment (now and then a gold one), so with his laurel wreath his head reads as a marble bust. (He used to be grey stone bricks: a builder, but not a Caesar.) With nothing of its own to watch, any snake watches the nearest head, so no face ever just stares ahead. Wildcard has an orange tan under a puffy golden combover swept across and forward to a curl over one eye, a white collar and a long red tie that bends with its rainbow body; it squints, pouts, and lets its eyes wander wherever they like. Most have small white eyes with a catchlight, closed eyes that curve like a cartoon's when they blink, and a little mouth; Ghost, Creeper and Copycat keep their special eyes, which still turn, and Vulture's beak gapes instead. Vulture glares from under slanting brows over a big hooked beak, pale horn with a dark tip, outlined so it still reads at phone size; Joker wears a harlequin diamond round each eye, in its hat's purple and orange. Sniper never blinks on the job; knocked out, its squint becomes a cross and the scope slumps off to the side, lens cracked. **Capricious starts every round undecided** (its own pink self, one eye big, one small, a brow cocked, playing it safe) for 3.5–5.5 s before its first mood, and dithers like that for 1.2–2 s between moods. Before, it picked a mood on its very first move, so you never saw its own face. Gobbler wolfs its food down: a gulp twice the size, and hamster cheeks either side of its mouth that puff up with every bite and slowly go down. Capricious gets a permanent pink head ring, so you can always find it whatever mood it's in. The ring breathes, and pale dashes run round it. **Wildcard wears the Stars and Stripes** behind his tan, white collar and red tie: two segments of navy with white stars, then red and white stripes, with the white collar segment kept as it is (the rainbow went to Mute, and on to its moods). **Mute** is a mood-ring mime: white greasepaint, a black beret, a painted tear and small dark lips, its body (and the blush on its cheeks) the colour of how it feels, its brows and mouth acting it out (see Looks and lines); its painted lips part and a second, inner jaw shoots out, snapping (it used to be a white glove, waving); it never speaks, so its bubbles are mimed (*pulls an invisible rope*, *draws a box in the air around you*), and it plays a boxer-in: it picks a target and squeezes its room (wins 28% of its rounds in the simulator, mid-pack). **Capricious does impressions:** in a mood it speaks that rival's own lines (its Mason quotes Latin, its Ghost says "…"), and taking up a mood it does a turn and can't help asking how it went ("Headshot! …Is that how Sniper says it?").

## Food and the world

- **Everything moves smoothly.** Food used to snap to whole pixels, so its small bob moved in visible steps; now it's drawn at its true position. Each piece has its own shadow on the bark, apart from the sprite, so it lifts off it. **New food pops in** with a little overshoot, and at the start of a round the board's food pops in one piece after another. A mushroom that withers or a golden apple that rots goes with a small poof.
- **Apples** bob up off their shadows, squash a touch as they come down, sway their leaf, and now and then a glint winks on them.
- **The golden apple** bobs too, in a glow that breathes, with a small rotating sparkle star (a non-hue cue) and glints twinkling round it. Instead of blinking before it rots, it dims calmly.
- **Mushrooms** sway on their stems, breathe, and let go of a spore now and then. In their last few seconds they wilt: they lean over, shrink and fade.
- **Beetles** (your Flåklypa idea): a jewel beetle, emerald with a gold rim, that comes out where it's quiet and walks the bark cell by cell with scuttling legs. Each step sets off and settles (step, pause: a beetle's walk), and it turns smoothly. Between steps it's never quite still: its feelers wave, it breathes, and every few seconds it lifts its wing cases and buzzes its clear wings, as if about to fly off. Scared, it trembles and its feelers twitch. It pops in when it comes out. It's the one food that moves, so it adds a chase to the core loop. **Tuned in the simulator (250 seeded rounds per setting):** a beetle that bolts as fast as a snake was a death trap (rounds 75 s -> 57 s, and 20% of deaths happened within 4 cells of a beetle, as snakes followed it into tight spots); one that scurries at half a snake's speed from any head within 4 cells leaves rounds as they were (72 s, deaths near a beetle 5%) and still makes you chase: 89% are caught, after about 4 s of pursuit. The AIs value one at what it's worth (two apples) and see it through their usual reaction delay. A skitter when one appears, a crunch when you catch it, and Gobbler, Desperado, Sniper and Mason have something to say about it (Mason: "Scarabaeus captus!").
- **Remains:** a dead snake falls to pieces: glossy beads in its own colours and markings, popping in from head to tail. Wildcard leaves the Stars and Stripes (and an orange-tan head), Mute the colour of its last mood, Joker purple and amber, Vulture black with a white ruff and a pink head, Mason marble, Colonist its cream strap, Copycat dashed rings, Ghost pale see-through beads, Star its rainbow (red, orange, yellow, green, blue and violet from its head, and round again; the pieces it bursts into too), and a friend online its spots. They bob gently, each on its own beat. A light rim and a dark edge keep every bead readable on the bark. (They used to be roast drumsticks, ringed in the snake's colour: the same for every snake, and a snake turning into chicken was a strange thing to see.) **Since round four** a dead snake leaves a bead on every other segment (at least 3), not one on each, and the beads it leaves still take its markings in turn (Joker's purple and amber alternate; Wildcard's head, collar, stars and stripes come in order). Beads go off as their time runs out (about 14 s), as apples do: a dull film and brown spots come over them (a dark bead, Vulture's black or Wildcard's navy, grows a pale mould instead, a grey film and grey-beige spots, so its rot shows as early as any other's), they shrink and dim, and go in a puff of their own colour. Your own beads give you the length back but aren't a meal (see "Food" under round four).
- **Burrows** (the beetles' homes): an oval opening in the bark, splintered round its rim with a little sawdust, and cracks that spread from it over about half a minute, each burrow's its own. Wood splits along its grain, so the cracks run along the log either way from the hole, tapering, now and then forking (they used to fan out in every direction, and with a beetle beside them they looked like a spider's legs). The first beetle cracks one open where it's quiet; later ones come out of a free burrow or, half the time, open another (up to three). A scared beetle runs for a burrow within 6 cells and dives in (it shrinks away into the hole), then comes out of another a second or so later. Burrows are safe to cross, and nothing grows on them. **Tuned in the simulator (300 seeded rounds):** beetles are still caught 90% of the time (91% before), and rounds are as long (68 s median, 69 before).
- **Holes** are pits in the log, one per hollow, traced along the cell edges: a torn inked lip, a dark floor, the far wall lit from the upper left, splinters over the rim and sawdust round it, and at the board's edge a notch bitten out of the log. They lie on the static layer under everything, so a body bridging a hole is drawn across it. A strike paints again only the box round its new holes. (Until round four they were ragged gouges, then one dark disc a cell, which read as bubble wrap.)
- **The corner leaves move onto the frame** and never cover playable cells.
- **Borders: Sovereign's realm and Colonist's colonies** (round four; they were force fields). The land is drawn as on a map: its cells, exactly the land the rules mean, under a light wash in the owner's colour; a band and a riband of the colour inside a true ink line with rounded corners, a parchment keyline just inside the ink, so a border reads for every eye (no line along the board's edge or round a hole: holes are lost land); where two owners' land meets, the line is dashed in both colours over true ink, the dashes standing still, and land both claim is hatched in both. (Without the keyline, Colonist's rose went grey-khaki to colour-blind eyes, its ink no darker than the bark's grain.) Land grows a ring of cells at a time as a realm widens, and shrinks back into its capital when its owner goes. The border flares as it changes and when lightning strikes, breathes while a rival's head is on it, and lights up from where a head crosses in. A rival on the land wears the land's colour round its pieces on the land's own cells, with a parchment keyline outside it, so it shows round a red body too. If it's you, you hear it: a muffled drum and a fife (see Sound). (Drawing only: the rules of trespass are as they were, and the AIs know nothing more than before.) *History:* they began as flat tinted discs with a hard edge, and nothing happened when you went in. The third pass made them domes of light with a honeycomb, ripples, sparks round the rim, rain dimples, frost and a wind shiver; those cost 2.3–2.6 times the same board without them, and round four replaced them with these borders (see "Borders, not force fields").
- **Sovereign's realm grows and moves.** It starts at radius 4 and gains a cell of radius for every 8 segments Sovereign grows, up to 7. If Sovereign wastes away, it shrinks back (2 segments' grace, so it doesn't flicker). Every 1.5 s it checks whether a cell's step would put clearly more of it on open log (holes and fire are lost land) and drifts that way, one cell at a time. On screen its land grows or shrinks a ring of cells at a time, and its border flares. Its capital flies a swallow-tailed banner in parchment and ink, its crown inked, trimmed in the realm's colour (no gold: gold means a power). Sovereign remarks on it ("Our realm expands!", "A strategic retreat. A royal one.", "The court relocates."). Over 600 seeded rounds it wins as often as before (28% to 27%); over 120 rounds against two others its realm reached radius 5 to 7 in four rounds of five.
- **Colonist's flags.** It plants the Union Flag and it flies (drawn in strips that ripple out from the pole), on an inked pole with a parchment knob (round four; it had a gilt finial). It used to be St George's cross, which is England's flag; redcoats were the British Army from 1707, and the colonies were claimed under the Union Flag. The game uses the 1801 flag everyone recognises, the one of the Empire's great colonising century (a tricorn-era purist would leave out St Patrick's red saltire). **Its later colonies fly colonial ensigns**, as the Empire's colonies did: the Union Flag in the corner of a Blue Ensign with the Southern Cross (the second, fourth, …) or a Red Ensign with the colony's badge, here the log's own oak on a white roundel (the third, fifth, …). The first colony keeps the Union Flag. Each colony remembers its number, so its flag never changes.

## Weather

**Spells of weather**, with clear spells between (the first after 15 s, the clear spells 8 to 16 s; they were 20 s and 14 to 26 s, and lightning came so seldom you could play a few rounds without seeing any): **sun** (golden hour: golden apples five times as likely; a warm glow over the bark), **wind** (gusts every 3.5 s knock an apple loose, up to three more than usual, and the apple drops in from above; leaves stream across the board and the canopy's shadows thrash), **rain** (two more mushrooms sprout; any fire goes out within 6 ticks; rain sheets down over everything, and the bark greys) and **storms** (from 30 s: lightning every 2 to 4 s, from 3 to 6; a violet gloom; a few drops). **Since round four the spells come from a shuffled bag** (one of each kind, `WEATHER_ODDS`), so every kind comes before any repeats; a storm can't come before 0:30 nor snow before 0:45, and one drawn sooner waits in the bag. A storm is followed by rain six times in ten (that rain is extra, not from the bag), and rain by a rainbow half the time: one great arch right across the log, rising out of a golden apple (its foot fading into the apple) and over, its top on the board where there's room, its other foot beyond the far edge. (It used to be a short arc round the apple, which looked small and odd.) When the woodpecker arrives, the sky clears and stays clear. Each change of weather gets a banner in its own colour, a glow round the frame, and a remark from a rival who has one (Mason: "Iuppiter iratus est!"; Wildcard: "Nobody knows more about lightning than me.").

**Lightning and fire, fairly.** Lightning picks a free cell more than 4 cells from every head, and crackles there for 10 ticks (about a second: an inked bolt in the cell, and an inked ring closing in on it, over the storm's gloom, shows how long is left) before it strikes: a bolt, a soft single flash (no strobing; none with reduced motion), thunder, and the bark catches fire. Each tick a burning cell catches a neighbour one time in ten, smouldering harmlessly for 4 ticks first; one strike's fire covers at most 6 cells at once and catches at most 12 over its life (`FIRE_TOTAL`, round four), so it burns itself out (and the whole board at most 30), and each cell burns for 50 ticks (about 5 s) before it burns out and leaves a scorch mark. **Scorch is soot, not a hole** (round four's critique): the cells of one burn run together into one soft smudge of char along the grain, at most about 0.3 alpha, with ash over its middle, char streaks and a few pale cinders; no ring and no dark centre (each cell was a dark disc, which read as the retired bubble-wrap holes). A burned cell paints its box on the static layer again, seamless. It doesn't fade in rain or over time (not built). Fire never spreads onto bodies, holes, burrows or a beetle (it runs), but it does spread onto food, and cooks it (below). **The AIs see fire (crackling, smouldering or burning) as walls, with their usual reaction delay**, exactly as they see holes, so nobody knows about it sooner than you do. (Fire used to kill a head that crawled into it; now it sets the snake alight, see "Crashes, not deaths".)

**Cost.** Flames are eight cached frames of a flicker, the rain is one seamless sheet of streaks scrolled in two layers, and embers, smoke and spores are drawn in batches (one shape per kind and fade). A storm with 24 burning cells costs 0.2 ms of script per frame at the median.

**Winter** (a spell of snow, never before 0:45 since round four) is a real lean season now: one apple, rotting twice as fast, no new mushrooms, no golden apples, and hunger runs 1.75 times as fast (it was two apples, golden apples a fifth as likely, and half as fast again, which hardly bit). Snow puts fire out like rain. It falls in two drifting layers, the log slowly whitens under low drifts lying in the furrows, long ragged wedges that grow longer and fatter as it snows (a soft white top over a blue-grey underside, inked along the lower edge only; never on a burrow or in a hole; on Sovereign's and Colonist's land like anywhere else, tinted by it), and shrink within a few seconds once it stops, the light goes a cold blue, and every snake's breath shows in little puffs. **Wind spreads fire:** in wind and storms a burning cell now and then flings a burning leaf (it arcs, spinning, trailing sparks) 2 to 4 cells downwind, never next to a head; where it lands it smoulders for 8 ticks (more warning than spreading fire gives, since a jump is a surprise), then burns small and briefly (22 ticks) and doesn't spread. Rules tests cover both.

## Keeping it smooth

Eating could drop frames on slower machines, so the third pass went after everything a frame or a bite costs. The corner leaves swayed by animating the SVG's insides, which made the page lay out and repaint on every frame; they now turn as a whole, on the compositor. The score and tag pops only scale (a colour change forces a repaint). Each snake's shadow and outline are one path, filled once, instead of dozens of shapes (an even shade, too). The words that pop up are drawn before the first bite. Over 20 s of play the main thread went from 9.5 s to 6.7 s of work, frame drawing from 3.8 s to 2.4 s, layouts from 4,711 to 720 and paints from 5,712 to 2,105. **A quality governor** keeps it playable anywhere: if a device keeps dropping frames in a round (over 12% of frames late, two windows of about three seconds running), the board draws less, for good: first no canopy shadows and at most 1.5 device pixels per CSS pixel, then 1 and no falling leaves.

Watching at 2× or 4×, the board's own effects (tongues, beetles, particles, weather) run on a clock that speeds up with it; every round starts at 1×. (Bodies were made smooth tubes here, one highlight down their length; they went back to segments later, see "The snake as a character".)

## Borders and frames

One treatment, used everywhere:
- **Board:** a carved Heartwood frame with leaves resting on its corners. The leaves sway, each from its stalk on its own beat; now and then a band of light runs along the wood; and **the frame lights up round its edge for the big moments**, in the moment's colour: green for Go!, gold for a golden apple, emerald for a beetle, red for a knockout (strongest for yours), orange for the woodpecker, honey for a win or a new best.
- **Panels:** parchment with an inset Parchment-2 ring. This covers the cards, the dialog, the name tags, banners and bubbles.
- **Buttons:** pills with a lip.
  - Primary: Leaf with cream text.
  - Secondary: transparent with an Ink ring.
  - Small: Heartwood with cream text.
- **Focus:** a Honey ring on dark backgrounds and an Ink ring on parchment, always visible with `:focus-visible`.

## Grabbing attention

The board and the page around it are never still for long, and the big moments are loud. All of it is drawing and styling only, animates only transform or opacity (except a banner's warning throb), and holds still with reduced motion.
- **The countdown** slams each number down, and the main button calls you with a ring rippling out from it.
- **Banners slam in** (from big, overshooting, settling) and fade away instead of vanishing, each dressed for its moment: a red ring for a knockout or the last two, gold with a shine running across it for a golden apple, emerald for a beetle, orange for the woodpecker, a throbbing red ring when you're starving, and a big leaf-green **Go!**.
- **On the board:** **Bonk!** for a knock a snake survives; where one goes out, a comic-book **KO!** if another snake did it, **Fwoosh!** in the fire, **Boom!** for a golden flash with nowhere to go and **Crunch!** for the rest; **confetti** for a win or a new best (all over the board), or from the winner's head when you're watching: paper scraps that flutter and tumble as they fall, not dots. **The woodpecker's next chunk** glows red from within, cell by cell, and cracks along the grain, under the snakes (a body over it bridges the hole), pulsing faster as the strike nears. Its rim is the pit's torn lip to come: it wobbles as the lip will, its corners a little rounder, and the bird's pecks are nicks bitten in from outside it, each its own size and unevenly spaced, coming first and closer together where it's striking (it used to be marked with dashed boxes, the one thing on the board that looked like a computer's; round four traced it with the pits' own outline, but its dents, evenly spaced dots on the rim, still read as a dotted selection box until the critique made them nicks). The lightning's closing ring has a soft glow round it.
- **The name tags:** a length pops when it changes, a snake knocked out of the round shakes its tag (flushing red), and the leader (the longest snake, if one is longest) wears a gold ring and a bobbing crown.
- **Chatter:** each new line slides into the log; bubbles pop out of their tail (see below).
- **The title's ampersand** gives a wiggle now and then.

## Voice and copy

**Tone: a wry woodland storyteller.** Short, warm and a little cheeky, never more than two short sentences. Exclamation marks are rare. The narrator speaks to you in the second person, and the snakes speak for themselves in their own voices.

| Moment | Copy |
|---|---|
| Title / subtitle | **Barkstreet Snakes** (called *Bark & Bite* until 2026-10-18; the S of Snakes wriggles in Honey as the ampersand did) / *A snake game on a mossy log* |
| Start prompt | **"Ready, Green?"** (your Hall of Fame name, once you have one: the header already says *Barkstreet Snakes*), then "Three rivals. One mossy log. Last snake wriggling wins." The control hint below adapts to keyboard or touch. |
| Countdown | Rotating roll-calls ("Up on the log with you:", "Sharing your bark:") above the rival list |
| Go | "Slither!" when you're playing; "And they're off." when you're watching (the narrator never talks to "you" in a round you're not in) |
| Pause | Title **Napping**, then a rotating line ("Snakes need rest too."), then "P or Esc to wake up" on keyboard or "Tap Wake up" on touch (Space jumps since round four, so it no longer wakes) |
| Death titles | Matched to the cause, in a word that means out (never "Bonk!": that's for a knock you survive): "Flattened!" for the edge (or a woodpecker hole you hit), "Down the hole!" for a jump that comes down in one, **Pecked!** for the woodpecker, "Tangled!" for biting yourself, "Squashed!" for a rival's body, "Out cold!" for a head-on crash, "Toasted!" for fire, "Sliced!" for a cut (Snip! is for a cut you survive; the card's own verb is never the title too), "Kaboom!" for a golden flash with nowhere to go and **Starved!** for hunger. Most have a second ("Splintered!", "Splat!", "Lights out!", "Halved!", "Drilled!"); a starving card says "You ran out of food at your smallest" and a peck "The woodpecker struck right under your head" (only a head in the patch is out), so the fact line never repeats the title, so a death isn't always the same word |
| Death flavor | Cause-specific lines, or the killer's own line, rewritten to be cause-neutral |
| New best | **"New best: 14!"** with a short fanfare and a gold burst. Hall of Fame: "Hall of Fame #2. Carve your name:" |
| Round over | "You win!" / "{Name} wins" with the winner's punchline, without repeating the title. A win says "Won in 2:10 · score 14"; a draw says "You shared 1st" |
| Control hints | Every item is a key and a verb. Start card: "Arrows or WASD steer · Space jumps · E or Shift flashes · P naps · Enter starts · H opens the Hall of Fame"; under the board, "P or Esc naps · Enter starts over" instead, plus "M mutes · N toggles the music"; touch: "Swipe to steer · Tap to jump · Swipe ahead to flash · Tap ⏸ to nap"; watching: "1, 2, 4 set the speed · P naps · Enter plays · …". A small card keeps the first three items (steer, jump, flash), the smallest (300 px) two. (Before round four: "Press ahead to leap · Space naps".) |
| Screen readers | A card is announced as sentences ("Flattened! You hit the edge at your smallest, 4th place, score 14. The log goes on. You don't. New best: 14!"), never "dot" |
| Hall of Fame | Empty: "No legends yet. Go make one." and "You haven't played yet. The log is waiting." (after a clear, "A clean slate. The log is waiting.": never "you haven't played" to someone who has). A browser that won't keep anything still has the session's rounds, and says "This browser isn't keeping records, so these last until you close the tab." What got you calls each thing by one name, on its bar and as your nemesis: "Edge & holes" and "the edge & holes", "Woodpecker" and "the woodpecker", "Hunger" and "hunger", "Fire" and "fire", "Yourself" and "yourself" |

**Rules for every string:**
- One noun for the measure: **Score** (food eaten) and **Best**.
- Typographer's apostrophes and quotes (’ “ ”) and a real ellipsis (…) everywhere a player can see. The Chinese lines are keyed by the English, so the two change together.
- A kill or win line never repeats the chatter the player has just seen (Desperado's "Draw, partner" belongs to his chatter; his kill line is "Desperado drew first.").
- "you" in the middle of a sentence, never "You".
- The snakes call you by your Hall of Fame name, or **Green** if you haven't set one.
- Mason speaks only phony Latin. His *Life of Brian* moments get answers: the Metagamer corrects "Romanes eunt domus", and "Biggus Dickus" (then "Incontinentia Buttocks") sets the others off giggling, as it does Pilate's guards.
- A rival's name says how it plays. Hunter became **Sniper**: it picks the snake it has the best shot at and cuts in front of its head, and "Hunter" could describe half the cast. Old Hall of Fame rows and kill counts carry over to the new name.
- Kill lines fit any way of dying to that rival (you ran into it, it ran into you, head-on), and win lines follow the "{Name} wins" title instead of repeating it.

## Feel targets (checked in Phase 7)

| Target | Concrete check |
|---|---|
| Smooth motion at 60/120/144 Hz | Fixed timestep driven from one rAF loop with interpolation; a snake moves exactly one cell per tick, never stalls at cell boundaries |
| Frame budget | Script per frame **p95 ≤ 2 ms, worst ≤ 6.9 ms** (one 144 Hz frame). **GPU raster for the long-snake scene (4 × 70 segments) ≤ 3.5 ms**, half a 144 Hz frame, so the browser's own work fits beside ours. The first pass measured script time only; the second pass traced the GPU process and found that long snakes cost it 6.5 ms a frame (see AUDIT.md). *Measured after the second pass: script p95 0.7-1.2 ms (met); GPU raster 2.0 ms, down from 6.5 (met); the worst frame in a minute is 5-7 ms at normal speed and up to 12 ms at 4x, so the worst-case target is still not reliably met (an AI decision sharing a frame with a draw). Details in the "After" section of AUDIT.md.* |
| Honest speed | Spectator 4× runs at 4.0× (±2%); ticks don't drift by their own cost |
| Input never lost | Two turns pressed within one tick both apply, on consecutive ticks; no input combo ever reverses into the neck |
| Eating feels good | Pop, particles, sound and score bump appear in the same frame as the bite tick; the gulp travels the body |
| Death lands softly | A 350 ms freeze-frame **of the moment of impact**: every snake stays exactly where it was drawn, and yours holds its pose, eyes crossed out, its head pressed into whatever it hit, with a spark at the point of contact and a 4 px shake of the board at the impact (only for your death, and only without reduced motion). Then it bursts into meat with a puff (with reduced motion it fades instead), and the card rises in over about 250 ms. Online the round never stops for anyone: your snake still holds its pose for the moment, and only your card waits |
| The round's last frame | The final move glides like any other, then the board rests |
| Restart is instant | Enter/R/Play: a short 3-beat countdown (3 × 350 ms) that **any direction key or swipe skips** (and steers). An arrow on the start card starts the round already turning |
| Gentle difficulty | Tick 120 ms → 90 ms over 2 minutes; the first 3 ticks of a round are eased (170 → 120 ms) so the opening is forgiving |
| Touch precision | A swipe registers once the finger has travelled half a cell (at least 12 px, about 3 mm, against finger jitter), without lifting; one touch can chain several turns, each after 8 px counted from where the finger turns (round four). A turn's way must be half again the other (`SWIPE_AXIS` 1.5) until the finger has gone twice the swipe's distance (`SWIPE_SURE` 2), so a 40° diagonal waits, and a long slanted stroke then turns its main way. A tap jumps on lift (within 6 px, or a quick touch under 250 ms that never went as far as a swipe), or once held still for 80 ms with something to hop; a swipe never jumps (round four's `tools/input-test.js`: 0 of 160 swipes at 0.15–1.2 px/ms), nor does a thumb resting before it swipes or while the other swipes. **During a round a swipe works anywhere on the screen**, including over the countdown, and the page never scrolls or refreshes |
| Never a dead moment | Every key in every state does something visible, or is documented as ignored (arrows while napping or on a round-over card). Since round four: P and Esc nap and wake, Enter, R or an arrow start and start over, Space jumps, E and Shift flash. Space, E and Shift never start, wake or dismiss anything; only a button you Tabbed to takes Space. P and Esc do nothing on the start and round-over cards. (Until round four, Space and Enter always meant nap and start over.) |
| Rivals explained everywhere | Desktop cards list each rival with a line on how it plays; on small boards the card lists names only, and tapping a rival's tag above the board shows its line (phones have no tooltips) |
| The board fits | On every screen from a 320×460 phone to a 1280×720 laptop, the whole board and the card's buttons are visible without scrolling; wide, short screens put the board beside the scores |

## The third pass: what it settles

**Gold means power.** The powers brought their own lemon yellows (`#fde047`, `#fef08a`, `#eab308`), greenish next to the warm Honey of the gold banner and the crown. They're folded into Honey: fills `#fde68a`, lines `#d4a017`, glints `#fffbea`. The decorative autumn leaves move to russet and brown, and Mute's proud mood leaves gold too, so on this board gold always means a power.

**A power is one token, not a ring.** A golden power used to draw a ring round the head with pips, on top of the stun halo, Capricious's ring, the ready ring and YOU's ring. Now it's:
- a thin opaque gold line round the body, with an ink line outside it so it reads on any colour, drawn outside your cream outline;
- pips on a short arc behind the head, turned with it: since round four, sky round pips for golden jumps and ember diamonds for golden flashes; holding both, the golden jumps' pips sit on the snake's left of the arc and the golden flashes' on its right.

The plain leap's cooldown was a thin arc round your own head that filled and closed into the ready flash. **Since round four** your two plain rests are two half-rings round your head, fixed to the screen: the jump's on the left in sky, the flash's on the right in ember. Each fills from the bottom over a faint track while it rests (not shown while you hold golden ones of that kind) and gives one bright flick when it's back. That's on the board, where you're looking, not only on the tag. On the tags, a power is a 6 px chip (the chip radius) with small inline icons in ink (a hop, a double chevron, a loop) instead of fallback-font glyphs; since round four, one chip per power (golden jumps sky, golden flashes ember, both on Honey with the count), and your own tag always shows your plain jump and flash, each filling in its accent as it rests. A name never gives way to it: on a narrow tag the chip drops its counts and keeps its icons (the pips on the board and the screen reader's words still give the number).

**Height is scale.** The board is seen from above, so a leap rises toward you: the head and neck swell along their path at the top of the arc, and the shadow on the bark spreads and softens. It no longer lifts up the screen, which read as a lunge or a flinch depending on the heading. Drawn ahead (round four, unless you're watching alone), a jump that's sure to go starts rising before its tick.

**Reduced motion removes movement, never information.** Being in the air is a rule, so a leap keeps a still airborne pose. The woodpecker cuts between perches instead of swooping. Rain holds still rather than vanishing (it puts fire out), a burning leaf appears where it lands instead of flying, and a death is a still starburst that fades.

**The narrator speaks less, and better.** Banners go through a small queue:
- **Lessons** (the first crash, the first leap, a power's first pickup, dropping to your smallest) hold for 2.5 s.
- **Routine news** waits for a lesson, or is dropped.
- **Repeats** don't get banners: only the first golden apple and the first beetle of a round are announced, and a repeat crash or a pickup's "+3" is left to the board's own floaters.
- **While a card is up,** only what changes the round gets through.

Lessons are one idea and 60 characters or fewer. The fine print lives in the README, or comes when it happens (*Snip!*).

**One word for each thing.** The leap was *ahead*: "Press ahead to leap", "Swipe ahead to leap". Since round four the two powers are a *jump* and a *flash*, each with its own press: "Space jumps", "E or Shift flashes", "Tap to jump", "Swipe ahead to flash" (a golden beetle's are *golden jumps* and a golden leaf's *golden flashes*; the rules and the AI call them leaps and dashes). The edge of the log is the *edge*, never a wall. *Bonk!* is for a knock you survive; a death gets a word that means out.

**Every death says why.** The engine records why a crash was fatal, and the card's first line says it:
- boxed in ("…with nowhere to turn");
- at your smallest;
- the shorter one in a head-on;
- pecked;
- blown up.

The rival's quip stays as flavour. A death that ends the round says it on the round-over card too.

**Small mercies at the keys.** A slip shouldn't cost a round, and a press should never be lost without a word:
- *R* and *Enter* sit next to the steering keys, so mid-round they ask "Start over?" first, naming the key you pressed. The same key again confirms; P, Escape or an arrow keeps going at once (an arrow steers too; Space did too, until it became the jump in round four). In the countdown, *R* is Go, like Enter (never online, where everyone starts together).
- The nap keys always nap: P and Escape (and Space, until round four made it the jump), in a round or in its countdown (the phone rang). Go is the Go! button, Enter, R or an arrow. On your own death card they keep watching instead (napping would hide why you died), and on the Napping card Enter asks "Start over?" as R does. A button you Tabbed to keeps its own keys (Enter on 2× sets the speed); a new round lets go of it.
- The press that starts or wakes a round is a steer, never a power (you always start facing right: pressing right to go isn't asking to leap). A turn pressed twice within 120 ms is always the turn; up to 180 ms it's a leap you meant only once the turn has happened, and never with dashes, which go at once. (Superseded by round four: steering keys only steer, and the guard, `POWER_AFTER_TURN_MS`, is kept for swipes only: since the critique, 300 ms from the lift of the swipe that turned you.)
- Waking from a nap goes through one quiet countdown beat (no YOU, no riser; the round's music carries on), so your hand is back on the keys before the board moves. An arrow skips the beat, and steers. A round napped before its Go gets its real Go on waking. Watching, waking is at once.
- A nap never covers a death that's about to be told: the card comes up as it would.
- Stunned, the latest press wins (you get more than one guess while the stars go round, and a small inked chevron by your head shows which way you pressed, or (since round four) the jump's hop or the flash's double chevron, in its accent (sky or ember; Honey when golden), for a power asked for, until the moment you move, online too), checked against your neck, not the way you were facing when you crashed. Reversing a queued turn that hasn't happened yet changes your mind instead of being ignored, and a U-turn's two keys rolled together count even when the second lands a hair early.
- On a phone every finger is its own swipe: a thumb resting on the glass doesn't block the other, and can still steer once the other lifts. During a round a swipe may start on a button (the Go! in the middle of the board); a short tap is still a tap.
- A first round's score is a best only by default: no fanfare until there's a best to beat. Carving your name is offered once a round, not on both cards, and never pressed on you: on a keyboard the card keeps the focus (R and Enter mean what they always mean; Space, since round four, starts nothing) and Tab reaches the field. It stays while you type, even if the round ends under it; named already, the card says "as Haakon"; carving says "Carved".
- Where four tags in a row would cut the rivals' names (a near-square window), they sit in two rows of two, as on a phone.

**Every sound survives a phone speaker.** A cue's weight can't live only below 150 Hz, so the low cues (death, bonks, thunder, boom, the stinger, the heartbeat) get a midrange knock or body that implies their bass. Every envelope starts from silence. Your own sounds come before rivals', and both come before the world's. A cue's shortest gap between plays (so a burst doesn't stack up) is kept apart for yours: a rival's waits on yours and on other rivals', and yours waits only on your own, so a rival's flash or jump, golden or plain, never silences yours. A golden flash's gap (50 ms) is under a tick and a jump's (120 ms) under two, so your own golden ones in a row are each heard (round four's critique; `tools/chatter-test.js` plays the sound to check). Ambient beds stop when the round does.

### Feel targets for the third pass

| Target | Concrete check |
|---|---|
| A power only when you ask | A key held down, an auto-repeat, a turn pressed twice within 120 ms, or the press that starts or wakes a round never fires a leap or a dash (checked with real key events in headless Chrome). Since round four each power has its own press, and `tools/input-test.js` checks that pressing the way you're going, a held key and its auto-repeat, and the press that starts or wakes a round never fire one, and that a swipe never jumps |
| The first knock really is free | A player who never steers survives their first crash and isn't steered into the edge (the auto-turn breaks ties by the open run ahead) |
| You can always see why | Every death card names the reason. Your leap's cooldown shows at your head (since round four, both rests: the jump's and the flash's half-rings). A press that can't go gives a thunk and an inked × (sky for a jump, ember for a flash) on what it couldn't hop |
| A calmer narrator | In watched AI rounds, about one banner every 8 s or fewer (it was one every 4–5 s), and no lesson replaced within 2.5 s |
| Frame cost | Full cost per frame (script and GPU, measured to a readback): the long-snake scene ≤ 4 ms (second pass 3.4–3.6; round four, interleaved with the build before it on one machine: 3.5–4.5 against 3.6–4.2, the same within noise); with Sovereign's and Colonist's land on the board ≤ 1.5× the same board without (`tools/bench.js` prints it; round four's borders measured 1.28–1.40×, the force fields before them 2.26–2.62×; the same staged scene, interleaved: 3.0–3.2 ms with the borders against 4.9–5.2 with the force fields); a new round's first frame doesn't rebuild the bark |
| No clicks | Every cue rendered offline starts from silence (no sample-level step) |
| Small speakers | Through a 300 Hz high-pass (a phone speaker), your death still lands louder than an apple |
| Memory stays flat | Drawing the land for a minute retains no growing heap (the colour cache is bounded) |

## The round's arc

A round has a shape, and the music follows it:

| Moment | Rules | Music |
|---|---|---|
| Start card, countdown, round over | - | A calm marimba loop (84 bpm) |
| Opening | The first 3 ticks are eased (170 → 120 ms) | The loop plus a soft bass |
| 0:45 | The speed-up (120 → 90 ms over 2 minutes) is well under way | A shaker joins; the tempo creeps up with the game's speed |
| 2:00 | **Sudden death:** nothing new grows, but the last apples fall one at a time (round four); the woodpecker pecks the log away a patch at a time | Minor key, wood-block knocks |
| Last two snakes | - | Faster and tense, with a heartbeat kick |
| Watching | - | Quieter, no percussion |
| Napping | - | Ducked to about a third |

**The woodpecker comes at 2:00, not 3:00** (your call, and the numbers agree). With hunger, food is what keeps a round going, and late rounds were dragging. Over 600 simulated AI rounds the median round lasts 71 s, the middle half 46-112 s, and 21% of rounds reach the woodpecker, so it's a real event rather than a rarity. Every personality wins 15-31% of the rounds it plays. (Gobbler had slipped to 8%: it chased food straight into other snakes. It now flinches from heads a little more, so it lives longer and, true to form, eats a third more.)

**The woodpecker, rebuilt: big, telegraphed, in chunks** (since reworked again: patches anywhere, see "Crashes, not deaths"). It used to sit on the board as a small sprite, pecking a cell every other tick. Now a big great spotted woodpecker (about six cells tall) lands beside the board, on its own layer over the page, on whichever side has room on this screen (with room nowhere, as on a phone, shrunk into the gutter on the side nearer its patch, its beak never over a cell). Then, over and over: it picks the next run of up to 8 free cells along the outermost ring left (never within 3 cells of a head, never a body or food), eyes it for 13 ticks (about a second and a half; the chunk glows red and cracks, the pulse quickening, and the bird crouches), swoops in, drums it all out in a shower of chips (except any cell a body is on by then), flies back, and rests for 6 ticks. The AIs keep out of a marked chunk as they keep out of holes, with their usual reaction delay. Over 300 simulated rounds the median round is as long as before (69 s); deaths in its holes fell from 0.29 to 0.06 per woodpecker round, because every strike is announced, so the squeeze now comes from shrinking room and hunger (starving rose from 2% to 5% of deaths). Online it's protocol 3.

**A cornered AI makes the sensible last move.** When every move looks fatal, a wall, a hole or its own body is certain death, but a rival's cell may already be free (it sees rivals as they were a moment ago), so it bets on the cell that frees up soonest. It used to pick at random, and those were the deaths that looked dumbest: self-bites fell from 15% to 8% of AI deaths and wall crashes from 7% to 2%. Two heads that swap cells now count as a head-on, as they look.

**Starving is decided after eating.** A snake whose head reaches food on the tick it would starve eats instead.

**The Hall of Fame ranks by place, then time alive, then food** (your call). Food stops appearing at 2:00 (since round four, all but the last apples), so food eaten mostly measures how early you died; time alive measures how well you played. The rank on your death card already counts the snakes still alive (they'll all finish ahead of you), so it's the rank the round-over card will show.

## Lines and announcements

**A pass over the lines.** Every rival now reacts to the woodpecker in its own voice (Sovereign: "Who invited that bird?"; Vulture: "Ah. A colleague."; Mute *covers its ears*), most react to a rainbow (Colonist: "A rainbow! Plant a flag at the end of it!"; Mute *hugs the rainbow*), Colonist hoists its ensigns ("Run up the ensign!"), and Sovereign remarks on its realm growing, shrinking or moving. The narrator's rainbow and golden-apple lines follow the log (the gold is at the rainbow's foot; apples drop onto the log), and the first time in a round you cross into a rival's land, a banner says whose it is ("You're in Sovereign's realm now. It noticed."). Every line has its Chinese for Copycat, and `tools/chatter-test.js` checks that none is missing.

**Round four's lines.** Every rival now has lines for the woodpecker pecking under it (Colonist: "Mind the gap!"; Mason: "Pons sum!"; Mute *tightrope-walks over the hole*), at most every 12 s; for being put out by rain or snow (Sovereign: "We are put out. In every sense."); for food it was nearest to burning to ash or rotting; for starting to take its chances when starving (Sovereign: "Forget the realm. Food, at once!"); and for being cut by a golden flash (some name the snake that flashed). Some also have lines for a flash that beats someone to food or shoots past their head, and for the last apples. The woodpecker no longer cuts anyone, so the old "cut" lines are a golden flash's now. Ash and rot go to the snake whose head was nearest (within 5 cells), if it's a rival; being put out is worked out by the chatter (a burning rival going out while it rains or snows). All have their Chinese for Copycat, and `tools/chatter-test.js` plays the chatter through staged moments for each.

## Crashes, not deaths (the rules, reworked)

**Why.** Snake is one mistake and out, and the longer you are, the more there is to bump into. Over 400 simulated rounds, a snake of length 20 or more died about twice as often per minute (1.1) as one of length 3 to 5 (0.5): past a certain point, eating was a punishment. So a crash now costs length rather than everything, and length becomes your armour.

**A crash** (into the edge, a hole, any body, or another head) bounces your head back: it stays put, you lose `CRASH_LOSS` (3) segments off your tail (never below 3; they break off as beads in your markings, food for anyone; since round four, your own give you the length back but aren't a meal), and you're stunned for `STUN_TICKS` (4, about half a second): your head wobbles, stars go round it, and your body stays where it is (so someone can run into it). You can steer meanwhile, and go your way when the stun's over; if you haven't steered and you're still facing what you hit, you turn to the open side with the most room. A head-on bounces both. A crashed snake's tail doesn't move that tick, so a head heading for it crashes too (worked out until nothing changes). **You're out** if you crash at your smallest (3), or if there'll be nowhere to turn **when the stun's over**: every neighbour (the cell you hit included) off the board, a hole, or a body that'll still be there by the tick you move again. Room is judged with the real timings: a cell j from a snake's head is left on that snake's (length − j + growth)th move, and a head may take a cell on the very tick its tail leaves; a stunned snake's moves start when its stun's over. So your own tail breaking off in the crash makes room (and your tail end, leaving as you move), a rival's tail that'll have moved on makes room, a rival that crashed this tick too loses its tail at once (it's food), and a snake that's out this tick is all food. A cell another head is arriving in is that head's now, and counts the same way. (At first "boxed in" was judged as things stood at the moment of the crash, so a crash into a tail about to move on was fatal, which looked unfair. A review then found the cell you hit never counted at all, since your own head was counted as "arriving" there; and that a tail leaving on the very tick you move again didn't count either. Both fixed, with rules tests.) So a short snake plays the classic game; a long one can take a few knocks, and every bite counts. The AIs play by exactly the same rules (they still steer clear of crashes; a stunned AI doesn't think until it can move again, and rounds come out identical whether AIs think ahead or not). Online it's protocol 4.


**Head-on, both boxed in: the longer one bounces.** Two snakes that meet head-on, each with nowhere to turn, used to both go out, even when both were long ("I saw 2 snakes die on a head on collision, when they were plenty long"). Now the longer one survives (the shorter one's body, turned to food, is its room); the same length, both out. How it's worked out: the cell two heads met in is room for one of them once every other head that met there is out or has room of its own (that one will turn away); everything is worked out until nothing changes, and when nothing does, **the shortest of those still boxed in go out first** and the rest are looked at again. So it's the same whether they met in a cell or swapped, whether the shorter is at its smallest (out anyway) or not, whether only one of them is boxed in, and when two snakes run into each other's bodies, each boxed in only by the other.

**No more head-butting loops.** Two heads that met in an empty cell used to bounce, wait out the stun, both go for the same cell again, and again, until the shorter was too small to bounce. Now **only one of the two may go back into the cell they met in: the longer one** (the same length, the one that came first). The other, coming out of its stun still facing it without having steered, turns away, to the open side with the most room, avoiding a cell next to another head if it can. Once the other is out, still stunned or gone, the cell is anyone's. (At first neither could go back in, which could turn the winner of a head-on into a dead end beside it, and overrode an AI's own choice.) The AIs keep twice their usual berth from a snake they just met head-on for about 3 s. Over 400 seeded rounds, head-on repeats within 12 ticks went from 0.63 to 0.28 a round, and head-on deaths at the end of such a loop from 33 to 13; double deaths of two long snakes from 90 to 36.

**Fire on snakes.** Crawl into a burning cell and you catch alight for `BURN_TICKS` (18, about 2 s; going back in starts it again): every `BURN_EVERY` (6) ticks a segment falls off, roasted (a roast bead is worth 2), 3 in all, the same as a crash; at your smallest, the flames finish you ("burned up"). Rain or snow puts you out within 6 ticks. Flames run along your back, with embers and smoke. (It was 30 ticks, 5 segments, at first: worse than a crash, so never worth it. At the same price, it's a real choice: a crash stops you dead and stuns you; fire lets you keep going.) **The rivals gamble on fire the same way:** they still plan round it like a wall, but when every other move is a crash or worse, they go through the fire rather than crash; never as a shortcut. (A rules test boxes one in at the top edge, a rival's body on one side and fire on the other: it takes the fire every time, and with an open way it never does.)

**Food in the fire cooks.** Fire can now spread onto food: an apple or a bead that's been in a burning cell for `COOK_TICKS` (18) is baked (worth `COOKED_GROWTH`, 2; an apple stops rotting for a while), steaming, glazed and split; left in for `ASH_TICKS` (45) it goes to ash in a grey puff. Getting at it means waiting for the fire to die down, or taking the heat.

**Apples rot.** Each apple lasts about `APPLE_TICKS` (110, ±25%: about 10 to 16 s early in a round, 8 to 12 s once it's at full speed; it was 160, and apples still mostly got eaten before they went): it bruises (brown spots), then rots (brown, wrinkled, its leaf dead, a fly circling), shrivels and goes with a brown puff, and a fresh one drops from the tree above somewhere else (every new apple mid-round drops in from above, like a windfall). It keeps snakes from camping an apple. At first apples lasted 40 s and hardly any rotted (0.1 a round: they were eaten first), so they were shortened: about 1.2 rotted a round at 160 ticks, and about 7 do now (600 seeded rounds; the rounds are longer too).

**The woodpecker, gentler and stranger.** It no longer eats the log from the edges in: every `PECK_REST_TICKS` (36, about 3.5 s) it picks a patch of `PECK_CHUNK` (7) cells grown at random from a start anywhere on the log, aimed clear of every body and all food and more than `PECK_CLEARANCE` (2) cells from every head while there's such a spot (failing that, clear of bodies; failing that, anywhere). It eyes it for `PECK_AIM_TICKS` (17, about 1.6 s; the AIs keep out, like a hole), swoops in and drums it out. **Whatever's in the patch when it strikes goes**: food, fire, a burrow, and any part of a snake. A body caught there is cut, and everything behind the cut falls off as beads; a head caught there (or a cut that leaves less than 3) is out. Sudden death still ends rounds: no new food, apples rotting away, and hunger. *Superseded by round four* (see "The woodpecker: holes under you"): patches of 9 growing to 16, aimed clear of food and more than 4 cells from every head, a third of them starting under a body; a body across the patch bridges the new hole instead of being cut, only a head on the ground falls in, and the last apples fall one at a time.

**What it did, over 600 seeded rounds (against the same seeds before):** the median round went from 70 s to 94 s (middle half 65–128 s, from 43–109), a third more rounds reach the woodpecker (30%, from 20%), draws fell from 55 to 23, and nothing stalls. About 4 crashes a round are survived. The spread of win rates is about what it was (18% to 37%, from 13% to 35%); the biggest eater gained most (Gobbler 13% to 21%) and the one who hardly eats lost most (Ghost 24% to 18%, starving more): exactly the point. The AIs treat fire as walls and the woodpecker avoided bodies (until round four, when it stopped cutting them), so burning and cuts mostly catch people out, and apples are mostly eaten before they rot.

**Feel.** A crash: the head lunges into what it hit and bounces back, chips of bark (or the other snake's colour) fly, a "Bonk!" pops up, and for you a "-3", a shake, and a hollow wooden bonk with a spring's boing and a twinkle; someone else's crash is a dull thud. Catching fire: a burst of flame and a whoosh; each piece lost, a hiss and a pop. Baked: a sizzle, a pop, steam; ash: a soft puff. A cut: a snap and an "Ouch!" (the woodpecker's; since round four only a golden flash cuts, and that's a "Snip!"). The narrator explains each new rule the first time it happens to you in a round ("Bonk! That cost you your tail. Crash when you're tiny, or boxed in, and you're out."), and the death card says when you were boxed in ("Nowhere left to turn."). Every rival has lines for crashing, catching fire and losing its tail, some gloat when you bounce off them ("Bow, Green. Do not bump."), and a few relish baked food.

## The rivals look further ahead

**What was asked:** rivals that get boxed in less, by planning better, not by reacting faster (they still see the board a quarter of a second late, like you), not by all playing the same way, and not at a cost that hurts the frame rate. Over 600 seeded rounds, 88% of all deaths were snakes boxed in.

**How it was chosen.** Four ways of looking ahead were each built and tuned in isolation, all measured the same way (deaths over 400 seeded rounds, win rates over 600, step time interleaved with the old AI in one process), and then judged against each other:
- *worst-case room*: race every rival for the room round each position the search reaches (78% boxed in, 1.4–1.6× the cost);
- *a deeper, narrower look* at the move it likes best, up to 8 moves on (77%, the most code);
- *the rival's best reply*: assume the nearest rivals do their worst next (83%; the fewest bumps, but the least gain);
- *pockets, necks and the tail* (70%, the cheapest, and the smallest change). This one won.

**What it does.** Once a decision, a reach map: the soonest any rival could be in each cell, spreading from where it was last seen (once any stun is over). Then, at the end of every line the search looks at:
- **the tail test**: if I can get onto my own trail (a cell my body leaves before I get there), I can chase my tail round and round, so I'm not trapped however little room there is;
- **the neck test**: if the room I need is only through a gap one or two cells wide, and a rival could get to that gap no more than `DAWDLE` (8) ticks after me (a snake doesn't leave a pocket straight away), the room beyond doesn't count, and the line pays nearly as much as a sure trap. **Nine times in ten the gap is right beside the head**: pinned against the edge or a body with one or two ways on that a rival could come round to. That case has its own allowance, `PINNED_DAWDLE` (8), and it's the dial between fewer boxed-in deaths and longer rounds (the judge's runs: 8 → 67% boxed in, median 159 s; off → 82%, 124 s).

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

## The first seconds

**Who you are, and a first knock you survive.** Watching a new player, the round could end before they'd found their snake: they didn't know which one was theirs, and at length 3 the first bump was the end. Two changes:

- **YOU.** From the countdown until a few seconds into the round (or just after you first steer), your snake is marked: a big bouncing arrow over your head (under it, near the top edge) with YOU in your colour, a ring pulsing round your head, and chevrons marching the way you're heading. Online, every screen marks its own snake, and friends' snakes carry their names. It's drawn over the board, under the floaters, and fades out softly.
- **Everyone starts at 4** (`START_LENGTH`), one more than the least. A crash never takes you below 3, so your first crash costs one segment, not the round; the second, at 3, is the end. (6 was considered; 4 gives the same one-knock grace with a smaller change to the opening: shorter snakes, a less crowded start.) Over 600 seeded rounds, the median round is the same (94 s) and draws fell from 23 to 14.

**Looks.** Joker's tongue is a real party horn now (it read as a striped straw): a white mouthpiece and a flat paper tube, striped pink, yellow and purple, outlined, that unrolls from a visible curl; at full stretch its fringed tip flutters and a puff of confetti flies off it, and then it rolls back up. Mute's glove is gone: its painted lips part wide and a second, inner jaw shoots out on a ribbed, glossy stalk, its little silver teeth snapping, and back in (a mime with a secret; drawn big from the mouth so it reads at play size). Mushrooms look poisonous, now that length is armour and a mushroom only costs you: a violet haze that breathes, two wavy stink lines rising, and violet spores; eat one and you go queasy green for a moment.

## Ouroboros, and the golden beetle's leap

**Ouroboros** (the snake that eats its own tail) is the 17th rival, and the first that looks like a real snake: dark gold with a python's dark diamonds down its back (a pale fleck in each), a wedge-shaped head with a diamond on the crown, amber eyes with black slits, nostrils. Its tongue gag is its fangs (only people get a forked tongue), and when its own tail is right in front of it, it opens wide and bites it: the symbol itself, for a moment. Its remains are gold beads with a dark diamond. **How it plays:** a new `coil` weight rewards keeping its head close behind its own tail once it's 10 or longer, so it moves as a ring (head within 3 cells of its tail about two thirds of the time when long); food pulls it along, so the ring rolls over food, and anything caught inside is boxed in. It's distinct from Mute (who boxes in one chosen victim) and Sovereign (who guards land). A two-headed, head-on-tail look was considered and turned down: in a game where which end is the head decides everything, a decoy head would mislead you. **Tuned in the simulator:** at first it won 32-34% (the ring is a strong, safe shape; a stronger coil made it stronger still, 39%), so it got a gentler coil (weight 20 from length 10), less caution and less appetite: over 1600 seeded rounds it wins 31%, level with Mason at the top of a field running 16% to 31%. Its lines are cyclical ("All things return.", "Full circle, Green.", "…and begin again.").

**Golden beetles and the leap.** About one beetle in three (`GOLD_BEETLE_CHANCE`; two in five since round four) comes out golden: a gold shell rimmed in emerald, a glow and glints. Catch one and you get `LEAP_CHARGES` (2) leaps (`LEAP_MAX` 3 held), shown as a Honey pip for each on a short arc behind your head (it was a golden ring round it; see the third pass). **To leap, press the way you're already going** (on a phone, swipe forward; for a friend online, it's the same message as a turn; superseded by round four: Space or a tap jumps, golden leaps first, and online it's a message of its own): if there's a body or a hole right in front and a free cell beyond, you hop over it, moving two cells in one tick, your body arching over what's in between (still joined up, so nothing else changes); the head arcs up through the air, drawn on top until the arch has run off your tail. The leap waits `LEAP_WINDOW` (3) ticks for something to hop and isn't spent on open ground (so pressing early or mashing the key wastes nothing), and never goes off the board or onto a body. **The rivals leap too**, without asking: whenever they'd otherwise crash. It pairs with the crash rules: a leap is the way out of a box. One power, not a set: warp and wrap-around were considered and left out (they'd make the edges meaningless and muddle the woodpecker's work); if the leap feels good, another could follow. (It did: see Powers. Everyone leaps now, the golden beetle's leap is the long one, and the rivals ask for theirs the way a person does.) About 0.8 golden beetles come out a round (1.6 since round four). The narrator announces them ("A golden beetle! Catch it, and you can leap over things."), explains the leap when you catch one, and a springy boing goes with every leap. Online it's protocol 5.

## Powers: everyone leaps, and golden things do more

Snake plus a little Smash Bros: movement with options, a cost, and a moment to wait. Every power went through the one input there already was, **pressing the way you're already going** (on a phone, swiping that way), and the AIs ask for theirs through the same call (`memory.power` from `decide()`: `leap()` in the engine), with the same rules and the same waiting. (*Superseded by round four:* two powers, two presses, Space or a tap to jump and E, Shift or a swipe ahead to flash; the AIs ask the same two ways, `memory.power` and `memory.flash`: `leap()` and `flash()`. See "Two powers, two presses".) Nobody gets a power the others can't see: a snake holding a golden power wears a gold outline, with marks of its kind (as first built, a golden ring round its head and badges like `⤴2`, `»2`, `⟳9` on the tags; now as in "Telling powers apart"). The AIs see each other's golden powers in their view, and their own (`leaps`, `dashes`, `wrap`, `leapIn`, and since round four `flashIn`).

- **The leap (everyone, always; the *jump* since round four).** Press the way you're going (since round four, Space or a tap): if there's a body, a hole or fire right in front and a free cell beyond, you go up over it and come down on the far side, **two cells in two ticks** (the same speed as crawling), your head in the air for one tick: nothing under you can hurt you, and nothing that arrives under you either. A turn you press while in the air waits till you've landed, and you land where you were going when you took off. If the landing's been taken meanwhile, you crash there as usual, your head coming down on what you hopped: on a hole, in you go; on fire, you catch; on a body lying across a hole (round four's bridges), it holds you up while it's there, and if it moves on before you do, in you go. The woodpecker can't get a head in the air. It costs **the tip of your tail** (`LEAP_COST` 1; so it needs more than `MIN_LENGTH`) and then needs **4 s** (`LEAP_COOLDOWN_MS`) before the next. It waits `LEAP_WINDOW` (3) ticks for something to hop and isn't spent on open ground. While it cools, a thin arc round your head fills (and your tag's leap chip fills with it); when it's back, a ring of light goes out from your head and a soft tick sounds. (Since round four it's the left half-ring, in sky, that fills, with one bright flick and a wooden tick when it's back; see "A power is one token".) The first time you leap in a round, the narrator says what it costs. Why a cost and a wait: a free leap would make every crash avoidable; a leap is a crash you saw coming, traded for one segment instead of three and a stun.
- **The golden leap (golden beetles).** `LEAP_CHARGES` (2) of them, up to `LEAP_MAX` (3) held. **Three cells in two ticks**, hopping up to two cells (over a snake two thick, or two snakes side by side), free and with no wait: a burst that can carry you across someone's path to cut them off. Where a golden leap can't land (three cells on is taken) but the plain one can, you get the plain one (with its cost and wait).
- **The dash (golden leaves).** Golden leaves come only on the wind: now and then a gust (`LEAF_CHANCE` 0.07 a gust, one at a time) blows one onto the log, and it blows away after `LEAF_TICKS` (90). In 200 AI rounds, one turned up in 22% of rounds. (Round four: 0.25 a gust, landing somewhere quiet; one turns up in about 6 rounds in 10, and its dashes are pressed with the flash's press, as golden flashes.) Eat it for `DASH_CHARGES` (2) dashes: **three cells in one tick, along the ground**. A snake lying across your way, one cell thick, is **cut in two** there: everything behind the cut falls off as food, and if less than `MIN_LENGTH` is left in front of the cut, it's out ("got cut in two by…"). Fire on the way is **put out** (a hiss of steam). Food on the way is eaten. **The edge, or a woodpecker hole: you blow up** (out, with a bang: "Kaboom!"). Anything else in the way (a head, a snake two thick, your own body): you get that far and crash into it, as usual. It doesn't wait for anything: it goes when you press (and a leap you pressed for before you caught the leaf doesn't turn into a dash). Fire that's burning is put out; lightning still crackling on its way isn't (you can't stamp out a storm).
- **The wrap (golden mushrooms).** Only in the rain, and rarely (`GOLDCAP_CHANCE` 0.12 a rain spell: it comes up some time during it; 11% of rounds; round four: 0.55, in about 6 rounds in 10), and it withers after `GOLDCAP_TICKS` (120). Eat it and for **12 s** (`WRAP_MS`) the edges wrap round for you (since round four, another adds 12 s more, up to 20): off one side, in at the other (the cell there has to be free, as usual), so the edges can't hurt you. The board's edge shimmers with running gold while anyone has it, glowing where a wrapping head is near, and your body is drawn across the edge, partly on each side. Two seconds before it ends, the narrator warns you. The woodpecker's holes still swallow you, and a leap or a dash wraps too.
- **Pressing during a stun.** A power you ask for while stunned goes the way you pressed when the stun's over (it counts as steering, if it can go, so the snake isn't turned aside first). On a phone, a fresh swipe the way you're going leaps (since round four, it flashes, and a tap jumps); a finger that keeps travelling the same way doesn't (it used to fire a power on every half-cell of an ordinary swipe). A power that can't get anywhere says so, with an inked × and, the first time in a round, a line ("Nowhere to land.", "Nowhere to flash."), and the auto-turn takes you clear, as a jump that couldn't land already did (round four's critique: a flash used to go straight back into what you hit). For a flash, that's a plain one into what you hit, or a golden one that would blow up at the edge or a hole on its way, or crash straight back in; a golden flash at a body one thick still goes, since that's its cut. A power that could go but then can't (a jump whose landing another head takes as it goes) gets the auto-turn too.

**One golden power at a time.** A golden beetle's leaps and a golden leaf's dashes are both pressed the same way, so a new one replaces the old (the wrap is separate: it's a while, not a charge). While you hold dashes, pressing forward dashes rather than leaps. (*Superseded by round four:* they're different presses now, so they add up; see "Holding more than one".)

**The rivals use them.** (*As first built; round four replaced this with powers weighed in the rivals' own search: see "Rivals" there.*) They ask for a leap when every move is a crash or worse and there's somewhere to land (golden if they have it). With dashes, they dash to cut someone in two right behind the head (it's out) or to take a good length off a rival (more readily the more aggressive the personality: `0.5 + aggression` per segment cut), to snatch something golden first, or as the way out; never into the edge or a hole, never where it'd crash, and only landing with room around. Golden leaves and mushrooms are food worth chasing to them (twice and one and a half times an apple). While the edges wrap for one, its look-ahead wraps too; and every rival allows for the others' powers: a rival with dashes or golden leaps can be three cells on in a tick, anyone two if there's something in front of it to hop, and a rival with a golden mushroom can come in over the edge. In 200 seeded AI rounds: about 3 plain and 1.2 golden leaps a round, 0.54 dashes (0.35 cutting someone), 0.64 trips across a wrapped edge, and no snake ever blew itself up; a golden leaf turned up in 23% of rounds and a golden mushroom in 17%, and nearly all were eaten.

**Sudden death closes in.** With everyone leaping out of boxes, rounds ran long (median 194 s, 97% reaching the woodpecker) and ended in slow starving: a long snake takes a minute or more to starve once nothing grows. Making hunger bite harder in sudden death shortened them, but turned the end into a starving contest (half of all deaths); so instead **the woodpecker gets hungrier**: each rest is `PECK_HUNGRIER` (0.85) of the one before (down to `PECK_REST_MIN`, 12 ticks), and each patch a cell bigger than the last (up to `PECK_CHUNK_MAX`, 14; 16 since round four, from 9). The log shrinks faster and faster, so the end comes from the board closing in, not from waiting. **Ghost changed with it:** built to stay small (it ate mushrooms on purpose past 18), it starved first in every long endgame and won 5–7%; now it keeps its distance from everyone and slips through the gaps, with a normal appetite (it eats until 18 long, and keeps nibbling after). Its blurb says so.

**600 seeded rounds, powers and all** (against the AI of the first PR, same seeds): median round 164 s (middle half 151–179, from 137–194); deaths: boxed in 66%, the woodpecker 15% (from 4%), starving 13% (from 24%), too small 6%; win rates 15–36% (another seed: 18–37), Ghost 29%; 11.6 crashes survived a round; the AI's step 1.06× the cost (mean; p99 1.6×, on longer snakes).

**Look and sound.** The golden leaf is a broad ginkgo fan in Honey, inked and lit along its top, fluttering face-on in a glow; the golden mushroom is the mushroom's shape with a gold cap, white spots and a shine. A leap rises toward you over what it's hopping (the head and neck swell, the shadow pulls away on the bark) and comes down on the far side the next tick (a golden leap rises higher, with a puff of gold). A dash is there at once, speed lines either side of it and gold flecks, with a zip; a cut says "Snip!". (Since round four a golden flash's lines are gold with an ember core, its flecks gold and ember; a plain flash's lines are ember, thinner and shorter, with a whoosh of air.) The rivals have lines for dashing ("Make way for the crown!"), for cutting someone ("You're cut, Green! Tremendously cut."), and a few for the wrap (Mason: "Sine muro! No wall at all!"), all with their Chinese. Plain leaps are common now, so a rival only sometimes remarks on one (always on a golden one).

**Online.** Protocol 6 (7 in round four, 8 after its critique: see its Online): each snake's dashes, when it can next leap, how long it wraps, and whether it's in the air; the new food kinds; dash, douse and cut-by events; how many times the woodpecker has struck.

**Reviewed.** A review panel (rules, AI, looks and UI, sync and docs; every finding handed to two skeptics to refute) found 35 things. All of them are fixed or deliberately kept:
- **Fixed in the rules:** a power asked for during a stun went where recoil turned you, not where you pressed. Food on a dash's way left stale cells behind. A leap request turned into a dash after catching a leaf. Golden-leap holders couldn't do the plain leap. A wrap ending mid-flight moved the landing. The woodpecker could hit a head in the air.
- **Fixed in the AI:** dash kills were never spotted (an off-by-one). Fire stopped dashes. Rivals' wrap wasn't modelled.
- **Fixed on screen and in the controls:** a swipe repeat fired your power. A golden leap was drawn a board's width away for anyone who'd ever wrapped. Dash bends cut corners and the streak was hidden. Corpses and bubbles across an edge were wrong. Two wrap lines and a sound were unreachable. The badge squeezed names.
- **Fixed in the tests:** several were flaky or weak.
- **Kept on purpose:** powers resolve in seat order when two snakes dash on the same tick (rare, and deterministic). *Fixed in round four's critique:* flashes and dashes are worked out on the board as it was before any of them moved. Two through one cell meet there head-on, whatever their seats, and cuts are made once every flash has moved. (Two golden leaps passing over the same free cell on the same tick still go in seat order; it takes two of them side by side.)

## Looks and lines

- **Friends get their own arrow.** Online, the bouncing arrow that says YOU over your head at the start also points out each friend, a touch smaller, with the name they picked in their colour, so you know at a glance who's who (each screen shows its own YOU).
- **A crash you don't survive goes off with a bang.** A comic starburst (flat, inked, a cached sprite) and a thick shockwave ring in the snake's colour with an ink edge at its head, a spray of pieces from the head and along the body, and a little smoke; your kill shakes the board a touch. (Before, a snake just burst into its beads, which read the same as a crash you survive.) With reduced motion it's a still starburst and ring, fading.
- **Mute is a mood ring, not a rainbow.** A mime is all expression, so its colour follows how it feels, from what anyone can see on the board: calm violet; deep violet stalking someone; deep rose closing the box (its target within four cells); white as a sheet when hemmed in or with a rival's head right by its own; dazed grey when knocked out; proud pink just after a kill (gold is for powers). Its moods are spread in lightness as well as hue, and its pale rim is its own, not its mood's. Its brows and mouth act it out too (arched, knitted, a steep scowl, raised in the middle with an O of a mouth, flat, a smug curl), and the colour changes over 0.4 s in a few steps (each a cached colour ramp, so it costs nothing). Purely for show: it never changes how Mute plays.
- **Holding a power shows.** A snake holding leaps (a golden beetle's) wears a thin, opaque Honey line round its outline, inked outside, until the last one is spent (a golden mushroom's wrap fades calmly over its last seconds), so everyone (people and rivals: the AIs see `leaps` in their view) can see who might hop over them.
- **Fields that overlap.** A snake's own fields that overlap (Colonist's colonies) are drawn as one merged field with one rim round the lot, not rings crossing rings. Where two snakes' fields meet (a colony planted in Sovereign's realm, say), the border between them crackles: a jagged, flickering seam of pale light, throwing the odd spark, outlining the contested ground. Colonist may plant in anyone's land; the field is a look, and the rules don't change. (Round four's borders keep the merging: one line round a snake's own land, and where two owners' land meets, a line dashed in both colours, standing still, with the land both claim hatched; the seam and its sparks went with the domes.)
- **Land lines.** Sovereign and Colonist mind their land: fire in it ("Our realm is ablaze! Fetch the royal bucket!", "I say, the colony's on fire!", at most every 12 s), the woodpecker pecking it ("That bird is pecking holes in OUR land!"), food rotting on it (round four: "Something is rotten in our realm.", "I say, something's gone off in the colony.", at most every 30 s), and, for Sovereign, a colony planted in its realm ("A colony? On OUR land, Colonist?!"). All with their Chinese for Copycat. Land is one rule everywhere since round four (the AI, the chatter, the HUD and the borders): a cell whose centre is within the field's radius plus `LAND_REACH` (0.5) of its centre.

## The fourth performance pass: the page's own work

**Measured first, on a simulated mid-range phone** (headless Chrome, CPU slowed 4x, a 412 px phone screen at 2.5x, a busy watched round: force fields, a ring, a storm, long snakes): drawing the board (`R.frame`) took about 2.5 ms a frame, but the browser's own work round it took more. Restyling, layerizing and painting the page came to over 3 ms a frame, and tracing it with things switched off one at a time showed why: CSS animations that couldn't run on the compositor, so the page did main-thread work every frame for them, and speech bubbles restyling as they moved.

- **The corner leaves** swayed with the `rotate` property (their `transform` mirrored them into the corners), and the page was re-layerized every frame. The mirroring is now inside each SVG, so they sway by `transform`, which the compositor runs.
- **The frame's light sweep** was a pseudo-element; it's a real element now (pseudo-element animations restyled the page every frame).
- **The leader's crown** bobs three times when it's crowned, then rests (it bobbed forever). **The title's "&"** rests during a round.
- **Speech bubbles** move their tail in 5% steps (every change restyled them).
- **The woodpecker's layer** covers the whole page; only the patch round the bird is cleared each frame, not the whole page.
- (Drawing each body segment's band into its circle, as one shape, was tried and measured slower than a fast rectangle plus a circle, so it stayed as it was.)

**After, back to back with the same round, per frame:** layerizing 1.45 → 0.37 ms, painting 0.54 → 0.07 ms, restyling 1.20 → 0.63 ms, pre-paint 0.87 → 0.48 ms, commit 1.38 → 1.06 ms. With that much less of the browser's own work, the same 12 seconds fit 1755 frames instead of 1078 (63% more headroom on the main thread). Drawing the board is unchanged (about 2.5 ms a frame at 4x slower; 0.4 ms median on a desktop), and so is everything you see.

## Sound

**Borders sound like borders** (round four). When your head crosses into a rival's land (Sovereign's realm or one of Colonist's colonies), a muffled drum knocks twice and a fife answers with a short call, panned to where you are. It plays once per crossing, at most every 0.8 s. (With the force fields it was a low electric hum: two detuned saws, filtered, with a rising shimmer and a fizz of noise.)

**Round four's other cues.** A plain flash is a short whoosh of air, lighter than a golden flash's zip, and your flash coming back from its rest is a small ember spark (the jump's is a wooden tick). The last apples starting to fall get soft notes falling down the minor key over a low note.

**The second sound pass: tension you can feel.** Every cue can come from where it happens (a stereo pan from the board's x). Apples eaten in quick succession climb a semitone each (up to seven), so a streak sings. Taking a rival out lands a knockout punch (a low thump, a crack, two bright notes); any other death is a far-off thud. A near miss (your head next to a rival's) whooshes past. First blood gets a dark minor stab; the last two, and the countdown's last beat, a riser. The woodpecker calls "kik-kik-kik" with a beat of wings, ticks tensely as it takes aim, and drums a burst of knocks that slows like a real one, as the chunk crunches out. Winter has glassy bells; a burning leaf, a whoosh and a crackle. Your death lands with a soft impact before its sigh. **The music feels the danger:** each tick the game measures how close a rival's head is to yours and how much room is ahead; past a quarter, a heartbeat (lub-dub on the beat) comes in, the bass drives on the off-beats, and past six tenths a dissonant minor second creeps into the tune. The arrangements are fuller: a soft, slightly detuned pad holds each bar's chord, bells answer the tune mid-round, sudden death adds low toms, and the duel races at 124 bpm with hats on every sixteenth. **The weather has its own sound**, looping beds of filtered noise on the music bus: rain hisses, wind swells and falls, a storm rumbles under a little rain, winter is a high, airy hush; a new one fades in as the old fades out.

Every sound is synthesised live with the Web Audio API, through one AudioContext, created on the first key or tap (browsers require a gesture). There are no audio files, so it works offline with nothing to download.

- **Cues** are short and round: a marimba pluck for an apple (nudged in pitch each time, so a run of apples doesn't grate), a rising sparkle for gold, a low "nom" for meat, a wobbling "boing" for a mushroom, a far-off thud when a rival dies, a two-note sigh for your death, a fanfare for a new best and a bouncier phrase for a win, wood-block countdown beats and a "go", the woodpecker's knock-knock and pecks, and a tummy gurgle when you start starving.
- **Mixing:** everything goes through a compressor so four snakes eating at once can't clip. At most 6 cues sound at once (death, best and win always get through), and each cue has a minimum gap so it can't machine-gun.
- **Music** is scheduled note by note on the audio clock, a quarter second ahead, from the game loop, and switches arrangement at bar lines so changes land on the beat. It has its own bus and its own switch (N), separate from all sound (M). Both are remembered.

## Play with friends (online)

Friends-only rooms, peer to peer, so it stays a static site with nothing to deploy and no accounts.

- **The host's browser runs the game**, exactly the code that runs alone (`engine.js`, the AIs, the chatter). Every tick it sends friends a compact picture of the board (about 0.9 KB, so about 8 KB/s per friend); friends send back only their presses: turns, fresh swipes and powers (`{t:'turn'}`, `{t:'swipe'}`, `{t:'pow'}` since round four; a swipe is its own message because only the host knows which way is "ahead" in its queue). Their screens glide between ticks with the same renderer (since round four's critique, drawing everyone ahead from the host's plans: see its Online). `tools/online-test.js` checks that a friend's board matches the host's on every tick, and two real browsers matched on every tick of whole rounds.
- **Fair, in keeping with the AI rule:** the rivals never know who's a person. Lag would favour the host, who has none. A friend sees each tick half a round trip late, and their turn takes another half to arrive, so the host's own turns wait **a full average round trip** (at most 150 ms), in the order they were pressed.
- **Never stalls:** a friend's browser says "still here" four times a second. After 0.75 s of silence an AI steers their snake (so a hiccup doesn't drive them into a wall), and any turn they send hands it straight back; a banner appears only if the silence lasts 2 s. **A friend who switches tabs says so at once**, and the AI steers until they turn again (a hidden tab's "still here" slows to once a second, which used to make the AI flicker on and off). The host's own snake gets the same stand-in while the host's tab is hidden. If a friend leaves, the AI finishes their round. If the host leaves, friends get a card saying so; if the connection drops, the card says that instead and offers to rejoin.
- **Rooms stay healthy:** each person's shared Hall of Fame rows are kept once, replaced when they rejoin and dropped when they leave, so messages stay far under PeerJS's 16 KB limit however often people come and go. Everything from the network is checked and clamped (names, colours, dates, numbers) before it's stored or drawn.
- **The host's tab may be hidden:** browsers stop animation frames there, so a tiny worker clock keeps the round going.
- **What changes online:** no napping, no countdown skipping, no watching speeds; your Hall of Fame and stats keep only your own result; chatter is the host's, passed on, so everyone sees the same lines.
- **Connecting:** PeerJS (from cdnjs with an integrity hash, loaded only when someone opens Play with friends) and its free public broker introduce the browsers; STUN finds a route for most networks. Strict ones need a relay (TURN), which needs a signup, so it's left as a marked spot in `net.js`.
- **A shared Hall of Fame** (your idea): on joining, each browser sends its own best rounds (up to 10, never AI rows), and the host passes everyone's on, so friends' rows appear in each other's tables in their seat colors, tagged "friend". Each browser also records every person's result in rounds played together. Every browser has a random player id (the friends you play with see it; a result claiming to be yours is never taken from a friend, so no one can pass for you) and every round an id, so a round is stored once, whoever recorded or shared it first (`tools/records-test.js`). Shared rows are kept once per person and checked like anything else from outside: names, colours, dates and numbers are cleaned, and only a person's own rows are passed on. **Only you**, your best and your stats count only your own rounds. AI results aren't kept for online rounds, or every table would fill with the host's rivals.
- **People get seat colors** (green, lemon, lavender, sky), each with its own marking on the body and in its dot (plain, spots, rings, dots: lavender and sky look alike to many colour-blind players), and the same cream outline, and names are made unique (a friend called "Sniper" becomes "Sniper 2" in a round with the rival).

## Architecture change (and why)

`snake.js` was 1,500 lines mixing the rules engine, the renderer, the UI, input and debug tools. It is split into:
- **`tuning.js`:** every number that shapes how the game plays and feels, in one frozen object.
- **`engine.js`:** the pure rules. It's used unchanged by the game and by `tools/simulate.js`. It has no DOM.
- **`render.js`:** the canvas renderer: layers, sprite caches, particles and character animation.
- **`audio.js`:** a tiny Web Audio synthesiser for the cues and the adaptive music.
- **`snake.js`:** the game controller: the loop, input, overlays, HUD, records glue, the friends lobby and the dev frame-time overlay (`?perf`).
- **`online.js` and `net.js`:** play with friends: the protocol (testable in Node) and the connections.
- **`tools/simulate.js`:** the balance simulator, moved out of the page into Node. It runs on all cores, and with `--seed` it repeats a run exactly, which is how the engine split, the AI's think-ahead and the AI optimisation were proven to change no decision.

`ai.js`, `chatter.js` and `records.js` keep their roles. Plain `<script>` tags still work from `file://`, with no build step.

## Round four: the owner's feedback, and the calls

After the third pass the owner played and sent a list: the controls feel delayed, the powers should be two presses, a flash for everyone, holes under bodies, holes that look better, borders instead of force fields, rivals that use their powers, a food economy that's too rich in the middle and too thin at the end, and a check that everything promised is actually in. Seven investigators measured each area first (headless Chrome with real key and touch events, and instrumented copies of the simulator, hundreds of seeded rounds a variant). These are the calls, each with the reason, as built. Numbers marked *measured* come from those runs; where the build went another way than the call, it says so and why. The build's own numbers are in "Round four, measured".

### Two powers, two presses

The one power press (pressing the way you're going) is split in two. A press that did "whatever power you happen to hold" blew snakes up: holding a golden dash, pressing forward to hop a hole dashed into it instead.

- **Jump:** Space, or a tap on a phone. It hops one cell (a body, a hole or fire) as before, waiting up to `LEAP_WINDOW` ticks for something to hop; golden jumps go first and are free.
- **Flash:** E (by where it sits, like WASD), or either Shift (the sprint key in most PC games, and the right Shift sits beside the arrows), or on a phone a swipe the way you're already going. Golden flashes go first.
- **Pressed together**, the jump goes first if it can (something right in front to hop, somewhere to land), because no flash gets past that; the flash goes once you're down. A flash pressed in the air goes once you're down too. (Round four's critique: the flash used to win even when it couldn't go, so mashing both crashed you, or with golden flashes held blew you up in a hole; and a flash pressed in the air was dropped.)
- **Steering keys only steer.** Pressing the way you're already going does nothing now. It was the old power press, and held keys and auto-repeat fired it by accident; the 120 ms double-tap guard goes with it. The other one (`POWER_AFTER_TURN_MS`) stays, for swipes only: a fresh swipe the way the last swipe turned you, while that one's still down or within 300 ms of its lift, is the turn swiped twice, not a flash, so a quick double flick to make sure can't fire a golden flash into an edge. (It was 180 ms from the turn's registering; a double flick puts its second touch down 150–280 ms after the first lifts. Only a swipe that turned counts, so golden flashes swiped back to back still go.) Keys need no guard.
- **Nap moves to P and Esc** (and the ⏸ button). Space can't both nap and jump, and jumping is what Space is for in a game. Enter, R or an arrow starts and starts over, as before; P and Esc no longer start a round from the start or round-over card.
- **Space, E and Shift never start, wake or dismiss anything.** They're the keys you mash in a fight, and mashing jump just after you die mustn't start a new round. A button you Tabbed to still takes Space, as buttons do. (That's tracked from the Tab key itself: a card's button the game focused after a keypress also looks keyboard-focused to the browser, and mashed Space would start a round.)
- **On a phone, a tap jumps** once it's clearly a tap. It jumps on the lift: within 6 px of where it touched (`TAP_STILL_PX`), or a quick touch, under 250 ms (`TAP_QUICK_MS`), that never went as far as a swipe (a finger rolls 7–11 px as it lifts in a hurry). Held still for `TAP_JUMP_MS` (80 ms), it jumps before the lift, but only with something to hop within reach on the way it's going: a thumb resting on the glass, ready to steer, isn't a jump. A jump a hold asked for that hasn't gone yet is taken back if the touch turns out to be a swipe, and a thumb resting while the other swipes isn't tapping. Going on touch-down would fire a jump on every dodge, because a swipe takes 15–50 ms to tell apart from a tap and a dodge always has something in front to hop. *As built*, 80 ms rather than 60: the slowest swipe measured (0.15 px/ms) is seen moving by about 57 ms, since touch moves arrive once a frame, so 60 left a 3 ms margin and 80 leaves about 23. (Round four's critique made the hold need something to hop, and the drifting quick tap a jump: a thumb resting 90–200 ms before it swiped left a jump armed, and a quick tap that drifted 7–11 px was dropped.) A touch on a button or a name tag (yours too) never jumps.
- **A card that comes up by itself** (your death's, the round's end) takes no tap on its buttons that began before it came up or within `CARD_TAP_MS` (500 ms) of it, nor one in a run of touches, each within `CARD_MASH_MS` (350 ms) of the last, that began then. Mashing jump never plays again. Keys are unchanged (Space presses only a button you Tabbed to).
- **Teaching it.** The flash's key is taught once a round, from 6 s in, until you've flashed. A short phone (where the help under the board is off the screen) teaches both on the first Go, as a lesson in one line: "Tap jumps. Swipe ahead flashes." (It was Go!'s big banner, three lines on a 320 px phone and faded under the heads for most of its life; see "Speech bubbles" for where banners go now.) Steering is taught beside YOU (see "What was promised and missing").

This changes the third pass's feel-target promise ("Space and Enter always mean nap and start over"). It now reads: P and Esc nap, Enter starts over, Space jumps.

### A flash for everyone

Everyone can flash: **two cells in one tick, along the ground, free, then a 6 s rest** (`FLASH_LENGTH`, `FLASH_COST`, `FLASH_COOLDOWN_MS`). It eats what it passes. It cuts nothing and puts nothing out: whatever is in the way, it gets that far and runs into, as a crawl would.

**Why free:** *measured*, a flash that cost a tail segment made rounds 6 s longer and pushed starving from 16% to 26% of deaths. A free one at 6 s kept rounds as they were, and the investigators' AI used it about 4 times a minute, to its advantage. As built, rivals flash about twice a minute (2.1): a flash must look two apples better than crawling, or one to win a race for food. At one apple they flashed 3 times a minute and did no better than never flashing (see Rivals).

Golden leaves now give **golden flashes** (the rules and the AI still call them dashes, as they call golden jumps leaps): three cells, cutting a snake one cell thick, putting fire out, and blowing up at the edge or a hole. They go before the plain flash and leave its rest alone.

### Holding more than one

Golden powers add up:
- Each golden beetle gives 2 golden jumps, up to 3 held.
- Each golden leaf gives 2 golden flashes, up to 3 held.
- Each golden mushroom adds 12 s of wrap, up to 20 s.

You can hold golden jumps and golden flashes at once, since they're different presses. Before this, a beetle wiped your golden flashes, a leaf your golden jumps, and a second mushroom only reset the clock.

### Telling powers apart

Gold stays the family colour: an outline of gold means "this snake holds a power". Each kind also gets an accent of its own, plus a shape and a motion, so you can read it at a glance without relying on hue:
- **Jumps are sky:** round pips.
- **Flashes are ember:** diamond pips, short ember strokes running back along the gold line from the head (over its first 6 segments: clipping to a whole long body cost the GPU up to 7 ms a frame), and a streak.
- **The wrap** is a slow glint running down the gold line, fading with it over the wrap's last 2 s.

Sky against ember is the pair colour-blind eyes separate best, and the shapes carry it without colour too. This bends the third pass's "gold means power and nothing else" a little: gold is still only ever power, and the accents appear only on power marks. (So Desperado's poncho stripes went from Honey to cream.)

The pips sit on a short arc behind the head, a little bigger now; holding both kinds, the golden jumps' pips sit on the snake's left of the arc and the golden flashes' on its right. Since the critique, each is ringed in a parchment keyline inside an ink line, so ember reads on Gobbler's orange and sky on Metagamer's cyan (0.14 of a cell, 0.12 with three or more, then the rings). The diamonds are slim lozenges pointing along the arc's spokes, spaced so they never touch (three that touched read as a zigzag seam). At the board's edge the whole arc moves in, so no pip is cut off, and the stun stars sit a little further out to clear them. Your two plain rests show as two half-rings round your head, fixed to the screen: jump on the left in sky, flash on the right in ember. Each fills from the bottom over a faint track as it rests (not shown while you hold golden ones of that kind) and gives one bright flick when it's ready. A stunned press shows the jump's hop or the flash's double chevron in its accent (Honey when golden), and a press that can't go an inked × in it. On the tags, one chip per power: golden jumps sky, golden flashes ember, both on Honey with the count. Your own tag always shows your plain jump and flash, filling in their accents as they rest; rivals show chips only while they hold golden powers or the wrap.

### The woodpecker: holes under you, and holes that look like holes

- **It pecks under bodies too.** A third of its strikes start under a snake (`PECK_UNDER_BODY`, any body but never a head; the same share on every strike, the first included). A body lying over a fresh hole **bridges it**: it isn't cut and drops nothing, and the cell is an ordinary hole once the tail has passed. Only a head on the ground in the patch falls in. A jump whose landing was taken meanwhile comes down on a bridging body, not into the hole under it; if that body moves on while the head is still there, stunned, it falls in. (Round four's critique: it was left standing on an open hole, and walked off it.)
  - *Why:* the old cut took 32 segments on average and was decided by reaction time. *Measured*, 40 of 49 cuts were heads already heading into the mark, exactly within the 240 ms nobody can react in.
- **It aims at least 5 cells from every head** (`PECK_CLEARANCE` 4, from 2), and clear of all food, while there's such a spot, so nobody can be inside a fresh mark before they can see it. (In 600 AI rounds on each of two seeds it had to aim nearer a head 4 times in about 20,000 aims; 6 times on the final build.)
- **Fewer, bigger hollows.** Half the strikes widen an old hollow (`PECK_WIDEN`), and patches grow compact. The log ends up with a few big hollows instead of a pegboard.
- **Bigger patches** (decided in the balance pass, once the rest was built): 9 cells, a cell bigger each strike up to 16 (`PECK_CHUNK`, `PECK_CHUNK_MAX`; from 7 and 14). See "Events and timings".
- **Holes stay permanent and only ever added.** The squeeze is what ends rounds, and online play relies on it.
- **The look.** One pit per connected hollow, traced along the cell edges:
  - a torn, inked lip;
  - a dark floor;
  - a far wall lit from the top left like everything else;
  - splinters over the rim and sawdust round it;
  - at the board's edge, a notch bitten out of the log.

  They lie on the static layer under the snakes, so a body bridging a hole is drawn across it, and a strike paints again only the box round its new holes. The old look, one round dark disc a cell, read as bubble wrap.
- **The aim marker.** It's traced with the same outline, its rim the pit's torn lip to come (the same wobble, corners rounder: 11 units against the pits' 7), and still glows red. Its cracks run along the grain under the snakes, and as the strike nears the pecks bite nicks in from outside the rim, each its own size and unevenly spaced, first and closest together where the bird is at it. (Evenly spaced dents on the rim, as first built, read as a dotted selection box.)
- **The rivals tell a mark from a hole** (`view.pecks`, added at the merge). A mark isn't a hole yet, so a golden jump or a jump for food may hop real holes but never a mark; a flash, plain or golden, treats a mark as a wall.
- **The first time it pecks under you:** "Pecking under you! Only your head can fall in." (It replaces "The woodpecker took your tail.")

### Food

**Does your own food poison you?** No, and it won't. Poison would punish the natural move of picking your tail back up after a crash, and seat colours can look alike. But **your own beads aren't a meal**: they give the length back (and the score), not the hunger clock.

*Measured*, 24% of the beads eaten were the eater's own, and crashing on purpose and then eating your own beads was a free hunger reset.
- **Telling it:** a muted Parchment +1 (+2 roasted) with no hunger refill, and once: "Your own tail won't feed you."
- **Owners:** beads carry their owner, so this is the same rule for everyone, AI included.
- **One mercy:** a snake out of time that reaches its own bead that very tick grows instead of starving (as with any food); its next shrink takes the growth back.

**Body food rots.** Beads fade, shrink and go after about 14 s (`PELLET_TICKS`, ± a quarter; roasted ones last half again), in a puff of their own colour, as apples do.

**A body leaves every other segment** (at least 3 beads, from the head; where there are too few, the skipped segments nearest the tail make up the number), not all of it. A kill was worth +30 to +70, and the winner of the first big fight snowballed. Crash drops, cut tails and burnt bits stay whole.

**Too much food mid-round, too little at the end?** Yes on both counts. *Measured:*
- Before 2:00, hunger mattered for 0.8% of snake-time: the median gap between meals was 1.4 s against a 20 s clock.
- After 2:00, 24% of snake-time was starving, and two thirds of sudden-death starvations happened with no food on the board at all.

The calls:
- **Three apples all round.** Two after 0:45 was the first call, so hunger would matter mid-round. *Measured*, it hardly did: before 2:00 snakes spent 4.4% of their time in the hunger warning, against 2.9% with three. What it did do: shorter snakes at 2:00 left more room once the woodpecker came, so rounds ran 5 s longer, a quarter of sudden death's deaths were in holes, and starving rose from 2% to 7% of all deaths. So the dial was taken out (`APPLES_LATE` is gone). Beads that rot, a dead snake leaving every other segment and your own beads not being a meal made the middle a little leaner, but not by enough: the critique measured 3.0 / 3.2% of snake-time in the hunger warning before 2:00 (seeds 3 / 11). So, after it:
- **A meal mid-round keeps you 13 s, not 20** (`HUNGER_MID_MS`, from 0:45 until the woodpecker comes; one in the opening or in sudden death keeps you 20 s, `HUNGER_MS`), with three apples still all round. *Measured* with the census, 600 rounds on seeds 3 and 11: snake-time in the hunger warning before 2:00 went from 3.0 / 3.2% to 8.8 / 8.9%. The round (169 / 170 s) and sudden death (49 / 50 s) didn't move, and starving went from 2 / 1% of deaths to 3 / 2%. Also tried: 13 s from the start (10.9%; its first death came at 120 s), 11 s (17.9%), 15 s (7.5%), and apples rotting sooner mid-round (no change: they're eaten long before). Two apples after 0:45 had given 4.4%, with longer rounds and more starving at the end.
  - *The hunger bar.* Each snake keeps how long its last meal keeps it (`mealMs`), and its tag's bar is measured against that, so it's full after any meal, though one mid-round lasts less. Under `HUNGER_WARN_MS` (6 s) left, the tag shows it's starving: the bar in Berry, a ring pulsing round the tag, and "starving" for a screen reader. (Measured against 20 s, a mid-round meal filled it two thirds; online, protocol 8 carries `mealMs`.)
- **The last apples fall one at a time.** In sudden death, food no longer stops dead. Once the board has no apple, another drops, each wait longer than the last (`SD_APPLE_GAP`, 20 ticks, times its number: about 2 s, 4 s, 6 s…), never in the woodpecker's mark. It's announced once, with its own falling notes: "The last apples are falling." (At a lesson's level, after the tick's other news: it waits out a banner that's holding, such as the woodpecker's arrival, instead of cutting it short, and replaces only routine news.)
- **No winter before 45 s.** Snow in the first half-minute starved 5-long snakes in about 1 round in 5. *Measured*, 55% of early starving happened in snow, which is 8% of that time.
- **Mushrooms never sprout within 2 cells of a head.** Nobody can see one appear in front of them in time.
- **Golden apples, leaves and mushrooms land somewhere quiet** (the farthest of 8 tries from every head). They become a race you can see, instead of gone in 1.5 s.

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

### Borders, not force fields

Sovereign's realm and Colonist's colonies are drawn as **borders on a map**, like a grand strategy game, not as domes:
- the land, cell-exact, under a light wash in the owner's colour;
- a band and a riband of colour along the inside of a true ink line (`#1c1209`), its corners rounded, with a parchment keyline just inside the ink (no line along the board's edge or round a hole). The keyline came with the critique: without it, Colonist's rose went grey-khaki to colour-blind eyes, its ink no darker than the bark's grain;
- where two claims meet, a line dashed in both colours over true ink, and hatching on land both claim;
- land that grows a ring of cells at a time as a realm widens, and shrinks back into its capital when its owner dies;
- a border that flares as it changes and when lightning strikes, breathes while a rival's head is on it, and lights up from where a head crosses in;
- a rival on the land wearing the land's colour round its pieces on the land's own cells (where two claim it, the later realm's colour), with a parchment keyline outside it, so it shows round a red body too (an ink ring outside that as well took a third fill pass, and put the land over its budget);
- Sovereign's capital marked with a swallow-tailed banner in parchment and ink, its crown inked, trimmed in the realm's colour (a blue banner vanished into the blue wash), and Colonist's flags on inked poles with parchment knobs. No gold: gold means power.

*As built*, the contested dashes stand still. Marching, their many short pieces cost about as much as all the rest of the land together, so they're cached in one small layer. The optional light sweep across the land was left out.

The land rule becomes one rule everywhere (the AI, the chatter, the HUD and the borders): a cell is land if its centre is within radius + `LAND_REACH` (0.5) of a field's centre. That removes the one-cell nubs the old radius + 1 left at the four tips. Snow lies on land like anywhere else, tinted by it. The domes' weather effects go, except a flare when lightning strikes. Crossing a border sounds like a muffled drum knock with a fife note, not an electric hum.

*Why:* the domes cost about 3.3 ms a frame in a real round (2.6 times the same board without them). *Measured* as built, the staged scene with both owners' land costs 1.28–1.40 times the same board without it (the domes 2.26–2.62), and their canvases hold 5.2 MB instead of 23.9. They read better at phone size.

### Events and timings

- **Weather comes from a shuffled bag:** every kind before any repeats. *Measured*, 42% of rounds saw no storm, and half saw three kinds or fewer. `WEATHER_ODDS` now counts how many of each kind go in the bag: one each, since two of a kind could repeat before the others came. A storm drawn before 0:30, or snow before 0:45, waits in the bag.
- **A lightning fire has a budget:** at most 12 cells over its life (`FIRE_TOTAL`), besides 6 at once. Fires kept themselves going until rain came, some for over a minute.
- **More golden power food.** Golden things are worth more now that they stack and the rivals use them: leaves 0.07 → 0.25 a gust, golden mushrooms 0.12 → 0.55 a rain spell (at 0.4 the wrap still missed most rounds), golden beetles 0.3 → 0.4.
- **Unchanged, because measured right:** the woodpecker at 2:00, and the 120 → 90 ms speed ramp.
- **Changed once the rest was built:** the woodpecker's patches start at 9 cells and grow to 16 (`PECK_CHUNK`, `PECK_CHUNK_MAX`; from 7 and 14). With a flash for everyone and rivals that see starving coming, nearly every snake now reaches 2:00, so sudden death ran a minute. Now it's about 50 s, and the median round about 170 s. (The woodpecker's speed turned out to be the weak lever: hungrier rests changed nothing, and shorter shortest rests saved 2 s.)

### Controls that keep up

*Measured*, the delay wasn't lost input. The board was drawn one tick in the past, so the moment your head was drawn reaching a cell was the moment its turn window closed. A press made when you saw the head arrive was late 77–88% of the time. The AI looked swift because it decides on the tick, against its own exact position.

- **The board is drawn ahead:** 60 ms (`DRAW_LEAD_MS`), but never more than half a tick (`DRAW_LEAD_MAX` 0.5): half a tick at 120 ms ticks (60 ms), and half a tick at full speed (45 ms). The cell your head is drawn in is the cell your press turns at, at every speed. (It was built as half a tick, as first called. The merge made it 60 ms at full speed too, more than half a tick there, to cover a press made as the head is seen to arrive. But then, late in a tick at full speed, your head was drawn in the next cell while a press still turned it at this one, and it was pulled back: 22 of 160 random presses, as the critique measured. So it's at most half a tick again.) *Measured* with real keys on a virtual 60 Hz clock, half a tick ahead: on-time presses went from 13–21% to 72–88% at 120 ms ticks, and from 12–26% to 60–73% at 90 ms. It changes the drawing only, never a rule:
  - rivals' next step comes from the plans they've already made, and they make them before the board is drawn into their next move: in the frames after the tick, up to the one that draws the next move, one decision a frame and at most two, never in the frame that ticked unless none is left (*measured* after the critique: no decision in a tick frame, at 1× or 4×; playing, a frame's thinking and stepping take 2.0 / 3.0 ms at p95 / p99, from 2.7 / 4.0, when the lead had packed every decision into the tick's frame);
  - a head about to crash holds at its cell centre instead of overshooting (fire isn't a crash, so a head heading into fire doesn't hold);
  - a guess that turns out wrong (a plan made late, a press in the second half of a tick) eases to the right place, never faster than a snake moves;
  - a flash, plain or golden, that's sure to go is drawn ahead too: from when the head is drawn past its cell's centre (before its tick) it's where the flash takes it, streak and all, and at the tick it glides on from a cell back along its body, never standing still. A flash guessed but not taken eases back like any wrong guess. A flash used to snap 1.5–2.5 cells at its tick and then stand still for 3 frames. *Measured* on the final build while playing, on a virtual 60 Hz clock (an autopilot steering, E pressed at random moments, golden flashes handed out): the rivals' flashes were shown before their tick 64 times of 66 and yours 115 of 142 at 120 ms ticks, 14 of 15 and 33 of 42 at full speed. The rest were presses in a tick's last frame or two, or flashes that stopped short, and showed at their tick. `tools/render-test.js`: after the tick, an even 0.14 of a cell a frame at 120 ms ticks, 0.18 at full speed. In Watch AIs the board has no lead (see below), so a flash shows at its tick (none of 75 before it), a cell on, or two for a golden one, and glides on from there;
  - online, the host sends where everyone goes next once its rivals have thought (a rival's plan, a person's queued turn, powers asked for), and again when a press changes it; friends draw ahead from that (protocol 8; before, a friend's screen drew nearly every rival's turn half a cell the wrong way, then dragged it back);
  - the board rests at its cells before Go and once the round's over;
  - it's only while you're playing on this screen: watching alone (Watch AIs, or after your death, alone), the board is drawn on its ticks, easing there after a death.
- **Your press shows at once.** Every steering press, not only a stunned one, and online too: your eyes look and your head leans the way you pressed, and it's drawn ahead from there, before the tick takes it.
- **Your face turns quickly** (about 60 ms, `FACE_EASE_MS`). The 300 ms "steady line" stays for the rivals, whose tongues it was for. *Measured*, in swift play your face lagged 214 ms. As built, it comes within 45° of the new way 53 ms after the press (180 ms before, on the same test).
- **Chained swipes are lighter.** A finger already swiping chains turns at 8 px (a new touch still needs 12, to tell it from a tap). The anchor keeps up with the finger while it goes the way it registered, so a turn counts from where the finger turns (*measured*, about 19 ms after the corner at 0.6 px/ms). A turn's way must be half again the other (`SWIPE_AXIS` 1.5), so a diagonal waits until it's clearly one way, or (since the critique) until the finger has gone twice the swipe's distance (`SWIPE_SURE` 2), when its main way counts: a long stroke 35–45° off the axis used to wait forever.

### What was promised and missing

The completeness audit went through every request across three sessions. About 100 items were done. These were promised and not built, and are built now:
- rivals planning with their powers;
- the board-split fix;
- the trappers' thicker walls;
- lines for being put out by rain, for ash and for rot, and Sovereign and Colonist complaining when rot ruins their land (see "Lines and announcements");
- a steering hint beside the YOU arrow: "Swipe to steer" or "Arrows or WASD to steer", riding with your head until you steer (a banner moves aside for it), on whichever side of YOU is clear of the rivals' speech bubbles (since the critique: it used to sit on top of one).

Things an expert would expect, added:
- a **Field guide** beside Hall of Fame and Your story: every food and power, with its picture and a one-line rule, and the keys for each power. Since the critique it also shows how a held power looks (a snake in gold with a sky pip and an ember diamond: "Golden powers") and your two rests ("Resting"), and its mushroom sits on bark in its purple haze (its cream stem vanished on the card). A screen reader hears each row's name, a pause, then its rule. On phones (440 px or narrower) the Hall of Fame tab is a trophy, so three tabs fit 320 px; "Clear everything" hides on the guide;
- powers you can tell apart (above);
- beads that rot (above);
- a stop to eating back your own crash;
- new lessons: "Your own tail won't feed you.", "Pecking under you! Only your head can fall in.", the flash's key, and the round's news "The last apples are falling."

Docs that contradicted the game are corrected: the holes were said to be trenches, the power marks were described from before the third pass, the "rare" golden apple came 5 times a round, and Joker's mushroom habit was missing. The critique found that the older sections still described the game before round four (force fields, Space naps, pressing ahead to leap, a woodpecker that cuts); they're brought up to it now, each older call kept and marked as superseded.

### Online

Protocol 7, and 8 after the critique:
- presses are three messages: a key's turn (`{t:'turn'}`, it only steers), a fresh swipe (`{t:'swipe'}`: the host decides whether it's "ahead", against its own queue, which a friend can't see) and a power (`{t:'pow'}`, jump or flash);
- each snake's flash rest and flash request, and plain flashes;
- beads' owner, and eating your own;
- holes under bodies;
- rot, saying whether it was an apple or a bead (and the bead's colour);
- the trickle of last apples, and where the first fell;
- whether a rival is desperate (the chatter voices it);
- (8) where everyone goes next, from the host once its rivals have thought and again when a press changes it: `{t:'plan', k, s: [[way, jump, flash], …]}`, so a friend's screen draws everyone ahead the way they're really going;
- (8) `'unleap'` among a friend's `{t:'pow'}` kinds: a jump a finger held still asked for, taken back (it turned out to be a swipe);
- (8) each snake's `mealMs`, how long its last meal keeps it, for the hunger bar.

## Round four, measured

AI-only rounds as `tools/simulate.js` plays them (`--census` prints most of this): 600 seeded rounds each on seeds 3 and 11, every cell "seed 3 / seed 11" unless it says otherwise. The builds:
- **final**: cb45603, after both of round four's critique rounds. The first gave:
  - a meal mid-round that keeps you 13 s;
  - the plain flash priced at two apples and a mushroom at three;
  - a jump pressed with a flash goes first;
  - flashes worked out together;
  - a power that can't go in a stun says so.

  The second gave:
  - a jump pressed with a flash also goes first when the hurdle is two or three cells ahead;
  - a meal just after 0:45 never shortens your time;
  - two flashes head-on meet;
  - a landing on a bridge whose owner crashes that tick holds;
  - Gobbler more careful near heads (headRisk 2200, zoneRisk 700) and twice as wary of mushrooms.

  Fingerprints 709828060 / 633168818, both `--check` ok. `simulate.js 60 --seed 3` gives 109438746 with and without `--ahead`.
- **first critique**: fed9bff, after the first critique round only (275874727 / 211829363). Numbers below marked "first critique" come from it.
- **merged**: the branch before the critique. From 234abd3 on, only drawing, input and docs changed, so e1afcb0 plays the same rounds. Fingerprints 716587532 / 346214756; `simulate.js 60 --seed 3` gives 153523588 with and without `--ahead`.
- **after balance**: the balance pass's final build, the same rules as merged but for the rivals telling the woodpecker's mark from a hole (165991245 / 15180574). Some numbers the census doesn't print; they come from this build, and say so.
- **before balance**: round four's rules and AI before the balance pass (2a8158c: two apples after 0:45, patches of 7 to 14, golden mushrooms 0.4; 288269477 / 789394841).

### The targets

Merged, all were met. Final, all but two: the win rates on single seeds (two personalities a point or two outside the band, each within its sampling error), and the plain flashes, which are fewer on purpose.

| Target | Before balance | Merged | Final |
|---|---|---|---|
| Median round (155–175 s) | 180 / 181 s | 169 / 171 s (middle half 160–178 / 162–180) | 170 / 171 s (middle half 159–179 / 162–179) |
| Rounds reaching the woodpecker (at least 90%) | 99.7 / 100% | 99 / 100% | 100 / 100% |
| Sudden death, median (35–60 s) | 60 / 61 s | 49 / 51 s (middle half 40–58 / 42–60) | 50 / 51 s (middle half 39–59 / 42–59) |
| Starving (at most 8% of deaths) | 6 / 8% | 2 / 1% | 3 / 2% |
| A starvation before 1:00 (under 5% of rounds) | 0.3 / 0.3% | 0.2 / 0.3% (after balance) | 1% / under 0.5% |
| Every personality's win rate (15–35%) | 18–31 / 18–32% | 18–33 / 16–33% | 15–**37** / **13**–32% (both seeds together: 16.5–34%) |
| Holes, share of sudden death's deaths (at most 25%) | 25 / 25% | 22 / 22% | 22 / 24% |
| Woodpecker aims near a head (rare) | 7 of 12,751 / 4 of 12,892 | 4 of 10,062 / 0 of 10,497 | 1 of 10,196 / 0 of 10,431 |
| Plain flashes a minute alive (about 3–5) | 2.94 / 2.92 | 3.1 / 3.1 | **2.1 / 2.1** |
| Golden jumps used (over 90%) | 99 / 99% | 99 / 99% | 99 / 99% |
| A storm in a round (at least 80%) | 87 / 87% | 87 / 89% | 89 / 84% |
| Snake-time in the hunger warning before 2:00 (at least 8%: the critique's) | | 3.0 / 3.2% (the critique's census of e1afcb0) | 8.5 / 8.7% |

- **Win rates.** Each personality plays about 140 rounds a seed here, so its rate wanders about 3.5 points either way from seed to seed.
  - **First critique:** Gobbler won 12% on seed 11 (17% on seed 3). The second critique made it more careful near heads (headRisk 2200, zoneRisk 700) and twice as wary of mushrooms; with no mushroom-lover left, it was eating as many as anyone, against its "hates mushrooms".
  - **Final:** Gobbler wins 20% on seed 3 and 13% on seed 11. Over 800 rounds with Gobbler in every one, the first critique measured 16.0% against 15.6% on e1afcb0, so seed 11 reads as a bad draw for it rather than a weak snake. Gobbler is still the personality to watch.
  - **Final, at the top:** Mute wins 37% on seed 3 and 31% on seed 11, 34% over both.
  - **Merged:** Desperado on seed 11 (16%) was closest to the edge, and Vulture was on top on both seeds (33%).
- **Plain flashes.** Below the balance pass's 3–5 a minute on purpose: at one apple a flash, rivals flashed 3.1 times a minute and did no better than never flashing, so the critique priced it at two (see Rivals).

### What a round holds

| | Merged | Final |
|---|---|---|
| Crashes survived a round | 10.6 / 10.2 | 10.2 / 10.4 |
| Draws, of 600 | 2 / 1 (no round stalls) | 0 / 1 (no round stalls) |
| Golden apples a round | 5.2 / 5.3 | 5.3 / 5.3 |
| Golden beetles a round (rounds with one) | 1.61 (86%) / 1.58 (83%) | 1.59 (82%) / 1.63 (84%) |
| Golden leaves a round (rounds with one) | 0.84 (57%) / 0.85 (61%) | 0.78 (54%) / 0.80 (57%) |
| Golden mushrooms a round (rounds with one) | 0.71 (61%) / 0.68 (59%) | 0.69 (60%) / 0.66 (57%) |
| Golden power food eaten, a snake a round (more than 2) | 0.73 (4%) / 0.72 (3%) | 0.71 (4%) / 0.72 (3%) |
| Mushrooms eaten a round (about 15 sprout) | 2.0 / 2.0 | 1.3 / 1.3 |
| Rotted a round: apples, beads | 7.0, 2.9 / 7.1, 3.0 | 6.3, 2.9 / 6.4, 2.9 |
| Beetles a round (caught) | 4.1 (90%) / 4.1 (90%) | 4.0 (91%) / 4.0 (93%) |
| Spells a round: sun, wind, rain, storm, snow | 0.80, 0.85, 1.31, 0.87, 0.78 / 0.80, 0.83, 1.30, 0.89, 0.80 | 0.83, 0.81, 1.31, 0.89, 0.78 / 0.80, 0.84, 1.29, 0.84, 0.82 |
| Lightning strikes a round | 4.0 / 4.1 | 4.0 / 3.8 |
| Woodpecker strikes a sudden death; holes at the end | 16.4; 233 / 17.1; 244 | 16.5; 235 / 16.9; 241 |
| Plain flashes a minute alive | 3.1 / 3.1 | 2.1 / 2.1 |
| Plain jumps a round; golden flashes a round (cutting someone) | 3.88; 1.50 (1.0) / 3.81; 1.51 (1.1) | 3.84; 1.37 (1.0) / 3.79; 1.45 (1.1) |
| Deaths, all: body, self, hole, edge, pecked, head-on, starved, cut | 42, 25, 19, 5, 4, 4, 2, 0% / 43, 25, 19, 5, 4, 3, 1, 1% | 45, 22, 17, 5, 4, 3, 3, 0% / 40, 23, 20, 6, 5, 4, 2, 0% |
| Sudden death's deaths: body, self, hole, edge, pecked, head-on, starved | 37, 27, 22, 5, 5, 3, 2% / 39, 27, 22, 5, 4, 2, 1% | 39, 24, 22, 6, 5, 3, 2% / 34, 25, 24, 6, 5, 3, 2% |
| Snake-time in the hunger warning (starving), before the woodpecker; after | | 8.5% (2.1%); 27.8% (14.6%) / 8.7% (2.2%); 27.8% (14.6%) |

From the after-balance build (seed 3 / seed 11), what the census doesn't print, not measured again since:
- the first death comes at a median 127 / 126 s (137 / 138 before balance); 0.5 deaths a round come before 2:00;
- the last apples: about 5 a round, the first at a median 126 s;
- a golden thing of some kind turns up in 98 / 99% of rounds;
- the first storm comes at a median 45 / 48 s, and every round sees a median four kinds of weather;
- lightning fires live a median 12.4 / 12.7 s (the longest 26 s): 29% burn themselves out, 63–65% are put out by rain or snow, and 6–9% are still burning at 2:00 or the end;
- 45% of strikes have a body across the patch;
- starving is 0.8% of snake-time before 2:00 and 12% after (1.2% and 17% before balance). Final, with a meal mid-round keeping you 13 s, the census gives 2.1 / 2.2% before the woodpecker and 14.6 / 14.6% after (above; counted its own way, so not quite comparable).

### Are the events' timings and chances right?

Most were. Three changed in the balance pass, and one after the critique:
- three apples all round (see Food);
- the woodpecker's patches start at 9 cells and grow to 16. Nearly every snake reaches 2:00 now, so sudden death had more to finish and ran a minute; now it's about 50 s;
- golden mushrooms in 55% of rain spells (from 40%), so every kind of golden power food turns up in most rounds;
- after the critique, a meal between 0:45 and the woodpecker keeps you 13 s (see Food), so hunger matters mid-round: 8.8 / 8.9% of snake-time in the warning before 2:00, from 3.0 / 3.2%, with the round as long as it was.

Tried and left as they were (300 seeded rounds each, against a median of 179 s with 59 s of sudden death):
- a hungrier woodpecker (each rest 0.8 of the last): no change;
- shorter shortest rests (8 ticks): 2 s shorter;
- a fifth of strikes under bodies: no clear change in hole deaths;
- more strikes widening old hollows: 4 s longer, more hole deaths;
- the last apples twice as often: no change; half as often: 4 s longer, with starving at 9% of deaths;
- beads lasting longer: no change;
- a dead snake leaving every segment: 4 s shorter, but the first big fight snowballs again (win rates 12–39%).

### Should a power be stronger or weaker?

No:
- **Flash rest:** at 8 s the rivals flash 2.7 times a minute instead of 3.1, and nothing else changes (the win spread widened to 9–41%); at 5 s, 3.3, and nothing else changes. (Measured with the flash priced at one apple; the critique found that price didn't pay, and at two apples rivals flash 2.1 times a minute: see Rivals.)
- **Jump rest:** 3 s or 6 s makes no measurable difference. The rivals jump about 4 times a round, nearly all out of a crash.
- **Golden jumps** are 99% used. **Golden flashes:** about 1.4–1.5 a round, cutting someone about once; nobody blows themselves up.
- **Desperate mode:** a rival turns desperate with 11 s of hunger left. At 6 s, a starvation before 1:00 comes back in 0.7% of rounds; at 16 s, nothing changes.

**Worth knowing:** the first death came at a median 2:07 after balance (the balance pass puts it at about 1:20 before round four); it hasn't been measured on the final build, where a meal mid-round keeps you 13 s. The flash, desperate mode and the fixed board split keep the rivals alive until the woodpecker comes.

### What the rules alone did

The engine's changes measured with the AI as it was before round four (eb58b62), 300 rounds a seed. This build still had two apples after 0:45, which alone made rounds about 5 s longer.

| | Before | After |
|---|---|---|
| Median round | 167 / 165 s | 177 / 182 s |
| Sudden death, median | 48 / 46 s | 57 / 62 s |
| Starving, share of snake-time in sudden death | 23 / 24% | 18 / 18% |
| Food a snake a round | 59 / 56 | 46 / 45 |
| Mean length at 2:00 | 41 / 40 | 32 / 32 |
| Golden power pickups a round | 1.7 / 1.6 | 2.6 / 2.8 |
| Rounds with a storm | 57 / 58% | 82 / 85% |
| Snow before 0:45, a round | 0.30 / 0.38 | 0 |
| Woodpecker cuts a round | 0.69 / 0.65 | 0 |
| Strikes a round, seed 3 (under a body) | 16.3 | 19.2 (6.2) |

The trickle of last apples is what keeps starving down: without it, starving was 41% of snake-time in sudden death.

### What the AI step did

Round four's rules with the AI from before round four (538a773's) against the AI as built (2a8158c), 600 rounds a seed:
- win rates 16–40% / 17–37% → 18–31% / 18–32%;
- starved, of all deaths: 14% → 6–8%; desperate mode is on for 1% of snake-time and halved starving deaths;
- plain flashes a minute: 0 → 2.9 (7% of them eat something, 2% crash that tick);
- jumps a minute: 0.37 → 0.60; golden jumps used: 48% → 99%;
- cuts a round by golden flashes: 0.82 → 1.05 (kills 0.015);
- mushrooms eaten a round: 6.2 → 1.6;
- own beads, of bead meals: 25–26% → 21%;
- blow-ups: none either way.

A/B tests, 1000 rounds each (mean place, ±0.025 a group, lower is better): the whole powers package against the same AI without powers 2.499 / 2.497 (neutral); flash against no flash 2.483 / 2.512 (within noise); weighing the flash only the way it crawls against every way 2.497 / 2.499; rivals' flashes at a quarter weight against half 2.498 / 2.498.

After the critique (its rules fix, seat-split A/B: half the seats never plain-flash): at one apple a plain flash came out about 0.03 of a place worse than never flashing, pooled over 3,400 rounds, with 13.6% of flashes followed by a crash or a death within 3 s (6.6% at any moment). At two apples, even (+0.031 and −0.023 on two seeds); head to head against the one-apple price, 0.02 of a place better over 2,000 rounds. A 1,000-round split varies by about 0.05 between seeds, so that last is a lean, not a proof.

### What it costs

- **The AI's decision** (`decide()`), against 538a773's AI on the same positions: 1.35–1.41 times the mean and 1.33–1.44 times the p99 (budget: p99 at most 1.7 times).
- **The AI's pacing:** the lead had packed every decision into the frame that ticked. Since the critique they're spread over the frames after it (see "Controls that keep up"): no decision in a tick frame; a frame's thinking and stepping at p95 / p99, 2.0 / 3.0 ms playing (from 2.7 / 4.0), 0.8 / 1.3 watching at 1× (from 1.4 / 2.1), 2.7 / 4.3 at 4× (from 3.4 / 5.0).
- **The land** (staged scenes, full cost to a readback, against the same board without land; budget 1.5 times): 1.28–1.40 times, against 2.26–2.62 for the force fields. In a real round, the one quiet run gave +1.1 to +1.3 ms a frame against the domes' +2.9 to +6.6, before the last two cost cuts; the merged build measured +3.6 ms under load (the domes +5.7 to +6.5 in the same conditions). The budget is +1.0 ms, so a quiet re-run is still owed. Canvases 5.2 MB (budget 8), against 23.9. Land is rebuilt about 50 times a round, median 0.1–0.3 ms, worst 0.7–4.0 ms. With the critique's keyline (two fill passes for a rival on the land; an ink ring outside it too took a third, and 1.6 times), interleaved on a heavily loaded machine: the land 1.50 times against 1.53 for the build before it, a rival on the land 1.47 against 1.38. That machine's absolute times were unusable, so the quiet re-run is owed for these too.
- **The pits:** a strike's frame costs 1.5–1.6 ms of script (1.1–1.2 before; a steady frame 0.9–1.2), and 1.9–2.0 ms of full cost more than a steady frame on a near-quiet machine (0.7–1.0 before; the woodpecker report asked for 2 ms or less). Painting a whole board of holes again costs 1.5–1.7 ms. A strike's box repaint matches a full repaint but for at most 896 pixels of about a million, each off by at most 8 levels.
- **Soot** (the critique): a cell that burns out paints its box again, about 0.2 ms of script a cell (a three-cell burn-out frame, about 0.6 ms more than a steady one). Against a full repaint, 59 burned cells and a strike: 0 pixels differ (the old scorch marks: 835, by up to 68 levels).
- **Telling powers apart:** frame cost within noise. The worst case, 4 snakes of 70 all holding golden jumps, golden flashes and the wrap, is 11.3 ms full both before and after (measured before the critique ringed the pips).

All on a shared, noisy machine (Iris Xe graphics, headless Chrome at 800×800, 2x); ratios between interleaved runs hold up better than absolute times.

### The controls

With real keys and touches on a virtual 60 Hz clock (`tools/input-test.js`; merged, all 25 checks passed; final, 30 checks, all pass):
- Every press reaches the engine within a tick plus a frame. Merged: turns, mean 66–72 ms from press to tick, at most 132 (the limit is 136.7); jumps, mean 52–82 ms, at most 123; flashes, mean 62–78 ms, at most 132. Final, one run: turns mean 69 ms, at most 126; jumps 68, at most 107; flashes 69, at most 126.
- Two presses in one tick turn on consecutive ticks, 20 times of 20.
- A tap jumps at its lift or 80 ms after touch-down, whichever comes first (merged). Final: held still, a touch jumps 80 ms after touch-down only with something to hop (with a hole ahead, 7 taps held 30–400 ms each jumped by 80 ms); with nothing to hop, at its lift. A quick tap that drifts 3–11 px as it lifts jumps (16 of 16); a thumb resting 90–200 ms before it swipes, or while the other swipes, never does.
- A swipe registers, at the median, after about 91 ms at 0.15 px/ms, 48 at 0.3, 27 at 0.6 and 18 at 1.2 (merged; final, one run: 90, 46, 29 and 21). A chained turn registers about 19 ms after the finger's corner at 0.6 px/ms (merged; final, 28).
- Swipes that jumped: 0 of 160 (8 speeds, 5 slants, 4 ways). Merged, the 32 at 40° never registered, by design; final, a stroke that goes on registers its main way, so none fail to (and a long stroke at 35° or 44° turns, 2 of 2 each). None went the wrong way.
- Final: a second swipe the way the last one turned you is that turn again at every gap tried up to 250 ms after its lift (the guard is 300), and a flash at 400; mashing jump over your death's card never plays again (9 taps landed on Play again; one after a pause started the countdown).

Drawn ahead, with real keys and a press at the first frame the head is drawn reaching the cell, plus 30 ms and a person's scatter (σ), 200 presses each:

| Ticks | σ | On time before | On time drawn half a tick ahead |
|---|---|---|---|
| 120 ms | 25 ms | 13% | 87.5% |
| 120 ms | 40 ms | 21% | 71.5% |
| 90 ms | 25 ms | 12.5% | 73% |
| 90 ms | 40 ms | 25.5% | 59.5% |

What's left is mostly late presses. The final build draws exactly this far ahead: half a tick, 60 ms at 120 ms ticks and 45 ms at full speed, so its on-time presses are these, 60–73% at full speed. The merged build drew 60 ms ahead at full speed too, more than half a tick, hoping to do as well there as at 120 ms ticks; but late in a tick your head was then drawn in the next cell while a press still turned it at this one, and was pulled back (22 of 160 random presses, as the critique measured), so the lead is at most half a tick again.

- Your face comes within 45° of the new way 53 ms after the press in swift play (180 before; p90 82 ms), 52 ms for a turn on its own (88 before).
- Rivals' guessed steps are wrong at the tick 3.6 times in 1000 moves (2.0 in a test with their plans made early, as the merged build makes them). No drawn head moves more than 0.39 of a cell in a frame, except a golden jump (0.57) and a flash, whose cells show at once.
- Flashes drawn ahead (the critique), measured on the final build while playing, on a virtual 60 Hz clock (an autopilot steering, E pressed at random moments, golden flashes handed out; two runs at 120 ms ticks and one at full speed, about 25,600 frames): at 120 ms ticks the rivals' flashes were shown before their tick 64 times of 66 and yours 115 of 142; at full speed 14 of 15 and 33 of 42. The rest were presses in a tick's last frame or two, or flashes that stopped short, and showed at their tick. No head slid back. `tools/render-test.js`: shown before the tick at 120 ms ticks, at full speed and golden, and gliding on after it at an even 0.14 of a cell a frame at 120 ms ticks (0.18 at full speed). Watching alone there's no lead, so in Watch AIs a flash shows at its tick, a cell on or two for a golden one (none of 75 before it). (The critique's own count, 87 of 88 before their tick in watched AI rounds, was made on its branch, when watching still drew ahead.)

### The rest

- **Online** (`tools/online-test.js`): merged, 20 rounds, about 30,500 ticks, the friend's board matching the host's on every tick; about 8,300 power presses and 1,000 plain flashes a run; the biggest message 10,495 bytes (PeerJS's limit is 16 KB). Final, one run: 20 rounds, 33,654 ticks and 538,484 checks, the friend's board and plans (33,654) matching the host's on every tick; 10,595 power presses and 1,365 plain flashes; the biggest message 10,495 bytes.
- **Chatter** (`tools/chatter-test.js`): 717 lines and 688 Chinese ones, 142 punchlines; final, 250 checks of the chatter and the sound playing (merged, 195 of the chatter). On a patched build before the merge, the rivals said as much as before (52.7 lines a round, from 52.6), the hungry lines giving way to desperate ones (1.8 a round, from 2.2, beside 2.2 desperate).
- **Sound** (rendered offline through the whole chain): the new cues sit with the old, peaks −20 to −29 dBFS; the border's crossing is about as loud as the hum it replaces, and a plain flash a little softer than a golden one. After the critique, a rival's cue never silences yours, and your own golden ones in a row are each heard: in a model of 100 seeded rounds (game time), none of yours was swallowed (flashes 0 of 781, jumps 0 of 161, golden flashes 0 of 26). Before, a rival's play could silence yours, and with that fixed, 6 of your 26 golden flashes were still swallowed by your own one before, until the gaps came down to 50 ms for a golden flash and 120 for a jump.

## Round five: Star

The owner's idea: bring back the rainbow body we dropped and give it to a new rival, **Star**. Star is inspired by the stars of the original Paper Mario, the one with the big mustache, so it looks like a star with a rainbow following it. It's a power addict that jumps and flashes as often as it can. These are the calls, as they were built; where the build changed one, it says so.

**Why it belongs.** Round four made jumping and flashing central, but every rival prices them the same way. Star is the first rival whose whole character is the powers: it shows what they can do. The rainbow also finally gets a home that fits.
- It was Wildcard's first, then Mute's.
- Mute became a mood ring, because a mime's colour should be its mood.
- A shooting star dragging a rainbow is the most natural use the rainbow has had.

**The look.** It's our own star, not a copy:
- **The head** is a five-pointed star with softly rounded points (a sharp star, points 1.3 and valleys 0.68 head radii, grown round), its points turning with its heading, one to the back, into its trail. **Its face stays upright** at every heading, its chin tipped 18° toward the way it's going across the screen: tall oval ink eyes with a catchlight, bushy white brows outlined in ink, and a huge white walrus mustache under them, its mouth and its tongue gag (downward) beneath. Heading down, left or right, the mustache droops over its two lower points; heading up, its back point sits under its chin. (As built at first, the face turned with the heading like every other face, and heading up the mustache sat above the eyes and read as huge angry brows: the critique turned it upright.) It wobbles when it's stunned.
- **The head's colour.** Star is sunflower yellow (`#f9c22e`), deeper than Honey, with an orange rim (`#e8890c`) and an ink outline. Gold means power, and Star's yellow must never pass for a power mark. Sovereign's crown and Wildcard's combover set the precedent: a yellow on a face is a look, and the gold outline round a body is the power. When Star holds golden powers, it gets that outline like anyone: its gold line, its shadow and a land's colour round it follow its points (sunflower, then ink, then Honey, then ink, so the head never reads as the gold line), its pips sit past its points, and its stun stars a quarter of a cell further out than a round head's.
- **The body** is the old rainbow (`hsl(h, 85%, 62%)`, 28° of hue a segment, moving a degree every 15 ms), flowing down from the head toward the tail: the other way to the old one, whose hues flowed up toward Wildcard's and Mute's heads. It fades toward the bark at the tail like everyone's, holds still with reduced motion, and stops where it was when Star is out.
- **Its tail sheds a small four-point twinkle** in one of the rainbow's six colours every 0.3 to 0.7 s, only with motion on. There's no halo: only you glow.
- **For its tongue gag**, it flicks out a tiny spinning star on a ribbon of rainbow, with a glint at full stretch.
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

**How it plays.** Star prices powers far below anyone else, by the same rules and the same engine calls. It's two persona weights, both off for everyone else, so rounds without Star play exactly as before (100 rounds drawn without it, seed 3, give the stub's fingerprint, 202796421):
- **`w.powers`** `{ price: 0, risk: 350, everyWay, jumpAny, dashSpend }`. Its powers are free to it, unless one ends where its risk is over 350 (a rival could strike there: in reach of its powers, or nearer), and there it pays the full price, as anyone would. A power still has to beat crawling by a point. (The brief said a fraction of the price: at 0.05 Star flashed 8.2 times a minute and won no more, 22 / 19%.)
  - **Flashes:** whenever it's rested and the flash doesn't run into anything, weighed every way, not just the way it would crawl: about four times as often as anyone else.
  - **Jumps:** any hurdle with somewhere free to land beyond it that no rival could get to before it's down, not just out of a crash or onto food. (A head moving into the landing stops a jump, and it crawled into what it meant to hop: about one avoidable crash every two rounds, until the critique.)
  - **Golden dashes:** spent on speed too, not only on cuts and golden things, but at anyone's price for one (0.6 of an apple), so only for a real gain, such as beating a rival to an apple. (Free to it, it spent both in the two ticks after a leaf, in a zig-zag that cut nobody: 69% of its dashes, against 18% now.)
- **`w.golden`** `{ power: 6, apple: 1.5, contested: 0.5 }`. It craves golden things above everything, to feed the habit: golden power food (golden beetles, golden leaves and golden mushrooms; a plain beetle is worth to it what it's worth to anyone) is worth six times as much to it, a golden apple one and a half times, and golden power food a rival will reach first still counts half. (Without `contested` it ate 1.0 golden power food a round, against 0.68 for the rest.)
- **Territory 1.2**, from the stub's 0.6: of everything tried, the only change that moved its win rate (23% to 26.5%, over 800 rounds with Star in every one).

Round four measured that spending powers on small gains makes a rival weaker. So Star stays a real threat in two ways. Each power goes by the same tests of where it goes as anyone's, and pays the full price where a rival could strike, so it rarely flashes into a crash: 0.5% of its flashes crash that tick, against 1.7% for the rest's, and 1.4% of its plain jumps crash within 0.3 s of taking off. And its craving keeps it stocked with golden jumps. It's tuned by simulation into the same 15–35% band as everyone. Tried and no better (Star in every round, both seeds): more room wanted (`margin` 6); more fear of heads (`headRisk` 900); no habitual jumps (22 / 19%: they neither help nor hurt measurably, and stay because they're the character); the plain jump at a third of its price; `space` 1.4 with `territory` 1.0.

**Its voice.** A jolly old-timer who can't stop showing off, and is never mean: "Whee! Still got it!", "In my day we flashed uphill both ways!" It has a line for every moment anyone has (but the ones that are one voice's own) and four of its own:
- **Showing off** (`zoom`): any plain flash of its own, not just one that beats someone to food or shoots past a head (those keep their `flash.first` and `flash.past` lines); its jumps too, half the time, and all of them together at most every 10 s. Its golden dashes and golden jumps it always cheers when it can talk. `ready`, its flash back ("Back in business!"), comes only once the flash has been back a second: it flashes the tick its rest ends, so that's rare (about 0.4 a round). As first built, `ready` came a tick before almost every flash and was its commonest line (197 of 928, now 20). The numbers in the next lines are from before the critique: since, a flash is cheered about one time in five (21%, from 11%), and a round repeats fewer of its lines (53 from 79, in 48 rounds). In whole AI rounds (60, Star in every one, the chatter's own chances) that's about one plain flash in ten cheered (139 of 1,401), one plain jump in seven and a show-off every 19 s alive, never two within 10 s; half of them are `ready` lines. At its most addicted (staged: a flash every 6 s and a jump every 4, for three minutes) it shows off 12 times.
- **Grumbling** (`resting`): while its flash rests, half its small talk ("Rest, rest, rest. I'll rest when I'm old!").
- **Its stash** (`stash`): a golden beetle it eats ("Golden! Straight in the tank."); a golden leaf gets a golden-flash line as it eats it ("Out of my way, I'm golden!"), since it spends the leaf's flashes there and then. Since the critique, Star's own moments (golden power food, a rainbow, its kill, being cut) are never crowded out by its showing off: it says them every time it can talk (from 39–57% before). A golden mushroom gets its `wrap` lines and a golden apple its `golden` one instead, its own for both; a plain apple it mentions a third as often as anyone (5% of them, against 15%: at 15%, two lines in five were about apples).
- A rainbow is family ("Family!", "Oh, look at you! You've grown!"): Star speaks first if it's alive and free to talk, and otherwise someone else does, as before. In those rounds it greeted half the rainbows it saw (14 of 28).
- Now and then (a quarter of its show-offs, at most every 40 s, 1.1 s later) Wildcard brags back ("Fast? I invented fast, Star.") or Mason answers in Latin ("Festina lente, Star!"): about one a round in four.
- Its kill and win lines ("Make a wish.", "Not bad for an old-timer.") never repeat its chatter. ("Too slow, sonny!" was too close to another game's famous taunt.) Its start-card line: "Jumps and flashes every chance it gets. Catch it when it dims." It joins the gigglers at Mason's *Biggus Dickus* ("Har har! Oh, my mustache!").

All told it says about eight lines a minute alive. Every line has its Chinese for Copycat: 805 lines now (717 before), 776 Chinese, 173 punchlines (142). Also since the critique, for everyone: a golden dash that cuts someone gets the dasher's snip line (a tail off) or its kill line (in two), and its dash line only when those can't be said.

**The cast** is eighteen now. Star's dot on the tags is a little rainbow round a sunflower middle. Its colour in text is a darker yellow than its star: its persona colour, `#eab308`, which its name in the log and the Hall of Fame and a bubble's edge use, against the drawn sunflower `#f9c22e`.

**Copycat copying Star** wears a pale copy of its rainbow (each hue 0.45 toward white), flowing in step with Star's and holding still with reduced motion, with pale rainbow beads; as a single colour (its tag dot's middle, and where one colour is all there is) it's a pale violet, `#d19df7`. It used to take Star's text yellow, lightened: a pale gold snake, as if it held a power, and its gold line all but vanished when it did. It copies Star a third of its living time when they share a round. **Star's burst** (and Copycat's while it copies Star) is a shockwave of six rainbow arcs and rainbow pieces, and its knock-out sparks are rainbow: they were the gold and cream of a golden pickup.

**Along the way, for everyone.** A face's turn is settled once a frame, before its shadow and outlines, so across a wrapped edge a face no longer turns twice as fast; an eaten bead's crumbs are the bead's own colour, not its owner's.

**Worth a look.** Two things the build left for the owner's eye: the rainbow's lemon segment (hue 55) can sit right behind gold pips, the closest thing on the board to Honey, though it reads as part of the rainbow; and dim Star's points are close in tone to the Honey line round it at phone size, kept apart by the ink between them (`mobile-star-gold.jpg` in the shots tour shows both).

### Round five, measured

AI-only rounds as `tools/simulate.js` plays them, 600 a seed on seeds 3 and 11 ("seed 3 / seed 11").
- **Final** (after the critique: Star's jumps keep clear of a landing a rival could take, and its golden dashes cost what anyone's do): fingerprints 324380661 / 626189426, both `--check` ok. `simulate.js 60 --seed 3` gives 83753295 with and without `--ahead`. Star wins 31 / 33%, everyone 19–34 / 17–33%, all inside the band; with Star in every round, 28.4% over 800. Its golden dashes thrown away within 3 ticks of a leaf: 18 / 15% (69 / 65%). Its cuts a round: 0.08 / 0.12 (0.02 / 0.01). Its jumps refused and crashed the same tick: 0.12 / 0.09 a round (0.46 / 0.47), against 0.06–0.25 for the rest. Flashes and jumps unchanged (9.4 a minute, about 11 a round). Rounds drawn without Star play exactly as before.
- **As built**, before the critique (f8ef647; Star's AI 4be85d2's): fingerprints 182329352 / 527997748; `simulate.js 60 --seed 3` 673618742. The rest of this section is from this build unless it says otherwise.
- **The round:** median 172 / 172 s, sudden death 52 / 52 s, starving 2 / 3% of deaths (round four's final: 170 / 171 s, 50 / 51 s, 3 / 2%).
- **Win rates:** Star 27 / 29% as built (31 / 33% final), and everyone inside the band on both seeds, 20–33 / 17–32% (Ghost on top on seed 3, Drab on seed 11).
- **The census's pooled numbers now include Star's habit:** plain flashes 2.6 / 2.5 a minute alive (2.1 in round four's final), plain jumps 6.3 / 6.1 a round (3.8). Round four's flash target was written against the pooled number, so read it per persona now: the rest flash 2.2 times a minute.

Per persona, from a scratch census of the same rounds (the same fingerprints), Star (about 131 rounds a seed) against the rest weighted together:

| | Star | The rest |
|---|---|---|
| Plain flashes a minute alive | 9.5 / 9.5 | 2.2 / 2.2 |
| Plain jumps a round | 11.7 / 11.2 | 1.0 / 1.0 |
| Golden power food eaten a round | 1.55 / 1.30 | 0.68 / 0.69 |
| Golden apples a round | 1.6 / 1.4 | 1.3 / 1.3 |
| Golden jumps a round | 1.7 / 1.6 | about 0.7 |
| Golden flashes a round | 0.85 / 0.53 | 0.36 / 0.33 |
| Flashes that crash that tick | 0.3 / 0.6% (10 of 3,103; 18 of 3,023) | 1.8 / 1.5% |
| A crash or out within 3 s of a flash | 7 / 8% | 15% |
| Crashes survived a round | 3.4 / 3.3 | 2.7 |
| Alive a round | 149 / 145 s | 152 / 154 s |
| Food eaten a round | 62 / 60 | 54 / 55 |

- **Its jumps** (200 rounds with Star in every one, seed 3): none crashed the tick it took off, and 33 of 2,311 (1.4%) crashed within 0.3 s; the rest's, nearly all out of a crash already, 73 of 572 (13%).
- **Its deaths:** a body 55 / 54%, then itself 19% and holes 12% on seed 3, holes 18% and itself 15% on seed 11. It starves in about 2% of its rounds and never blows itself up.
- **Its thinking** (`decide()`) costs no more than anyone's (a quiet run of 80 rounds: mean 0.65 ms, p99 3.2, against 0.78 and 3.5 for the rest): it's rarely rested, so it weighs the flash less often.
- **Its look:** as paths, the star and its mustache cost the GPU about 0.57 ms a frame on the long-snake scene, so they're a sprite (see "Prerender" under Skipped or adapted). Against bf81687, interleaved in one browser (16 rounds, the quickest of 12 batches, 800×800 at 2x): the `long-star` scene (the long-snake scene with Star in Sniper's seat) 1.05 times (rounds 0.85 to 1.19), the `long` scene without Star 0.96 times (0.73 to 1.17), both within noise. `tools/bench.js` times `long-star` beside `long`.
- **Its voice:** above, under "Its voice" (60 whole rounds on the chatter's own chances, seed 5).
- **Tests:** `tools/rules-test.js` has nine checks of Star's habit (five fail on the stub), `tools/render-test.js` six of its look (five fail on the stub; the sixth, its rainbow holding still with reduced motion, passes on the stub's plain fade anyway), and `tools/chatter-test.js` plays its voice through (297 checks of the chatter and the sound, from 250).

## Skipped or adapted guidelines

Each line gives the guideline, what was done, and why.

- **"A perfect classic snake beats a cluttered one; no new modes":** *adapted.* The game is deliberately a four-snake rivalry with 18 personalities, items, chatter and a Watch AIs mode that you designed. Nothing is removed. The polish goes into readability and feel. No new modes were added.
- **"Board-full win state":** *adapted.* With four snakes sharing 576 cells (plus hunger and holes), a full board can't realistically happen. Food spawning stops gracefully if there's no free cell, and the round ends as usual.
- **"Store the body in a ring buffer instead of unshift":** *adapted.* Bodies stay arrays: measured, `unshift`+`pop` costs under 1 µs per tick, and the whole engine is about 1.3% of tick time. The real hot path was the AI search's per-node array spreads and closures, which were rewritten allocation-free instead.
- **"Zero allocation in the hot path":** *applied to the render loop and the AI search.* The search, which scores up to 27 positions per decision, allocates nothing; it went 3× faster, and garbage collections fell from one every 3 decisions to one every ~145. What's left is small and deliberate: each decision builds its helper closures once (about 10 KB), and the engine takes one snapshot per tick for the AIs' reaction delay. Moving those to module state would cost readability for little gain. (Star's moving rainbow, round five, comes from `#rrggbb` ramps made once, at most 360 hues of 31 steps, so a frame still builds no colour strings.)
- **"A soft sound for turning":** *skipped.* Turning happens many times a second and any sound became noise in testing. Your hands already feel the turn.
- **"Tune difficulty by playing":** *adapted.* I can't play at human speed with a real keyboard. The ramp was tuned conservatively (≤33% faster over 2 minutes, an eased opening) and checked with scripted and AI play. It's flagged for you to try.
- **"Colorblind-safe palette":** *adapted.* 18 characters (19 with you) can't all be hue-distinct. Instead, nothing is identified by hue alone: faces and patterns for rivals, a cream outline for you, distinct shapes for food (apple, golden apple with a star, mushroom, glossy bead, beetle), and since round four for powers (round pips for jumps, diamonds for flashes, in sky and ember, the pair colour-blind eyes tell apart best). A border is a true ink line with a parchment keyline, not only its owner's colour (Colonist's rose went grey-khaki to colour-blind eyes).
- **"No external assets":** *adapted.* Fredoka from Google Fonts was already used. It's kept but loaded non-blocking, so the game works offline with the fallback font.
- **"Prerender static layers or stack canvases":** *prerendered.* One visible canvas, with offscreen layers for bark, soot and pits (made once a round; since round four a strike paints again only the box round its new holes, about 0.5 ms of script more than a steady frame, and since its critique a cell that burns out paints its own box again, soot and pits, about 0.2 ms of script a cell; `tools/bench.js` times a three-cell burn-out), a small leaf-shadow layer, and cached sprites (beads by colour and marking; since round five Star's head, its star and its mustache, one sprite for each step of its tell, drawn turned: as paths they cost the GPU about 0.57 ms a frame on the long-snake scene, and as a sprite Star's look costs +0.06 ms against the stub's round head, quartiles −0.06 to +0.24, alternated in one page). That's simpler than syncing stacked canvases.
- **"Move the simulation off the main thread" (implied by the frame budget):** *adapted.* A Web Worker wouldn't run from `file://`. Instead the AI thinking for the next tick is spread evenly over the frames before it (usually one AI per frame), with the same information and the same decisions. In an A/B test, pacing beat a per-frame time budget on every run (p99 2.1-2.5 ms vs 3.2-3.9 ms).
- **"Particles in the palette's colors":** *adapted.* Particles use the palette plus the color of what was eaten (golden for golden apples, the snake's colour for its beads), so the burst says what happened.
- **"High score in localStorage":** *kept and extended.* There's Best plus the existing Hall of Fame and stats, every access in try/catch. Watched AI-only rounds now count in the Hall of Fame (your request), but never in your personal stats.
- **"Pause automatically on blur/visibility":** *applied to hidden tabs, and to window blur only while you're playing.* A watched AI round keeps running when you click elsewhere on the same screen, but pauses when hidden.
- **"Speech bubbles"** *(not in the brief, but they affect readability):* kept and toned down. They're smaller, slightly translucent, follow the gliding head, never outlive their round, and long lines go to the log only on small boards. They sit beside a snake going up or down (never over its path or its body) and above one going sideways. **They don't jump about as a snake turns:** a bubble moves to another side only once that side has been the right one for 0.45 s (or its own has run out of room), and then glides there. Measured over 45 s of watching, a bubble used to jump up to 106 px in a single frame, 61 times; now nothing moves more than 6 px a frame. They fade while your head is near one, and a snake doesn't repeat a line within 45 s of game time; Mason's *Life of Brian* routines come once per visit. Banners move to the board's foot while a head passes under them, or, with heads at the foot too, to the middle of the board; only with heads everywhere do they fade, and a lesson that spent a while faded gets that time back, once (round four's critique: on a 320 px phone the first Go's powers lesson was faded for most of its life). With no card up, bubbles sit over the woodpecker's layer (it covered the rivals' "pecked under" lines); with a card up they stay under it.

### Third pass

- **"Create a new branch from main":** *adapted.* The pass is branched from `feature/powers`, the top of three open PRs (#22, #23 and #24) that change most of the code. Polishing `main` would mean polishing code that's about to be replaced, and merging it back would conflict everywhere. The three were merged during the pass, but #23 and #24 only into their stacked base branches, so their work never reached `main`. This pass's PR therefore targets `main` and carries them; its description links a view of the pass's own commits.
- **"Fixed timestep… buttery smooth on 60/120/144 Hz":** *kept, and one thing changed.* Playing alone, a hitch now catches up at most one tick a frame, so a stall is a moment's slow-down rather than a jump of several cells. Online and when watching fast, wall-clock catch-up stays: there, fairness to the clock matters more.
- **"The first moves after a start are forgiving":** *extended* to the first crash. A player who hasn't steered is turned toward open space, not toward the nearest edge.
- **"An on-ramp for new players"** *(raised by the audit, not the brief):* *skipped.* The skeptic's data showed first rounds aren't lopsided; the eased opening and the first free knock do this job.
- **"Store the body in a ring buffer":** *still adapted*, as before: unshift and pop cost under a microsecond a tick.
- **"The game works offline":** *kept, and extended.* It plays from `file://` as before. Hosted, a small network-first service worker keeps the last version for offline play, without ever serving a stale one when the network is there. Online play needs the network anyway.
- **"A visible mute toggle, remembered":** *kept.* The audio now also suspends while muted or while the tab is hidden, which saves battery and stops beds hissing in the background.

### Second pass

- **"Move the simulation off the main thread":** *still adapted, with a corrected reason.* A Web Worker built from a blob does run from `file://` (the host's hidden-tab clock already is one), so that wasn't the obstacle. The real cost is that the renderer and the chatter read ten fields of each AI's memory every frame, which a worker would have to mirror back each tick. The measured tail came from the first decision of a round (the JIT warming up) and from decisions sharing a frame with a tick, so instead every rival's brain is warmed on the start card and no thinking happens in a frame that has just ticked.
- **"Throttle rendering when paused or hidden":** *already true, one part skipped.* Nothing is drawn while napping, on a card or in a hidden tab (GPU idle). The animation loop itself keeps running on those screens to schedule the music, at 0.1 ms a frame; a second clock for the idle case isn't worth the complexity.
- **"Zero allocation in the hot path":** *now applied to the renderer too.* The per-segment colour lookup built strings every frame (half of the render script time in the long-snake scene); colours now come from a cached ramp per snake, and the remaining closures and array literals are hoisted. The engine's one snapshot per tick for the AIs' reaction delay stays, as before.
- **"Batch draw calls into one path":** *reversed, on measurement.* With Chrome's GPU canvas, one path of 70 circles is triangulated every frame, and bands stroked between circles break batching; separate circle fills batch into one GPU operation even across colours. So bodies are drawn as all bands (rectangles), then all circles.
- **A jitter buffer for friends' screens:** *skipped.* Tick spacing measured steady (118-122 ms, even with the host's tab hidden), and a buffer would add latency for everyone.
- **Command letters on Colemak and Workman:** *skipped.* WASD is read by physical key so it works on any layout; on Colemak, the physical S key types "r", so giving letters priority would restart your round when you steer down.
- **Renaming the storage keys and `pellet`:** *skipped.* Renaming keys would orphan everyone's saved Hall of Fame; the rest is cosmetic.
- **Splitting snake.js (the friends' lobby into its own file) and the long `drawFace` and `decide()`:** *skipped for now.* Big moves with no change a player can see; noted in AUDIT.md for later.
