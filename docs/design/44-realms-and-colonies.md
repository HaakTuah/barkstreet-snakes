## Realms and colonies

Sovereign's realm and Colonist's colonies: the land each claims on the log, drawn as borders on a map, and the flags
that mark it. The rules as food and the world, looks and lines, round four, round six A and the owner's playtest
settled them (their text, with what was tried and measured, is in `docs/archive/design-realms.md`). Elsewhere: how the
two play their land (`39-the-rivals.md`), their land lines ("Land lines" in `13-lines-and-announcements.md`), the drum and fife
when you cross in ("Borders sound like borders" in `21-sound.md`), snow on the land ("Winter" in `05-weather.md`), and
the land a strike leaves, drawn ahead during the aim (`38-the-woodpecker.md`).

### Borders, not force fields

The land is drawn as on a map (round four; it was domes of light): drawing only, so the rules of trespass are as they
were and the rivals know nothing more than before.
- **Land is one rule everywhere** (the AI, the chatter, the HUD and the borders): a cell is land if its centre is within
  the field's radius plus `LAND_REACH` (0.5) of the field's centre.
- **The land:** its cells, exactly the land the rules mean, under a light wash in the owner's colour.
- **The border:** a band and a riband of the colour along the inside of a true ink line (`#1c1209`, `LAND_INK` in
  `render/land.js`), its corners rounded, with a parchment keyline just inside the ink, so a border reads for every
  eye: without it, Colonist's rose went grey-khaki to colour-blind eyes, its ink no darker than the bark's grain. No line
  along the board's edge or round a hole: holes are lost land.
- **Where two owners' land meets:** see "Fields that overlap".
- **It moves:** land grows a ring of cells at a time as a realm widens, and shrinks back into its capital when its owner
  goes. The border flares as it changes and when lightning strikes, breathes while a rival's head is on it, and lights
  up from where a head crosses in.
- **A snake on the land** (any but its owner, you too) wears the land's colour round its pieces on the land's own
  cells (where two claim it, the later realm's colour), with a parchment keyline outside it, so it shows round a red
  body too. Crossing in, you hear it.
- **No dome left:** snow lies on land like anywhere else, tinted by it, and of the domes' weather effects only a flare
  when lightning strikes stays.

### Fields that overlap

- **A snake's own land is one:** where its fields overlap (Colonist's colonies), they are drawn as one land with one
  line round the lot, not rings crossing rings.
- **Where two snakes' land meets** (a colony planted in Sovereign's realm, say), the line between them is dashed in both
  colours over true ink, standing still (cached in one small layer: marching, their many short pieces cost about as
  much as all the rest of the land), and the land both claim is hatched in both.
- **Colonist may plant in anyone's land:** the border is a look, and the rules don't change.

### Sovereign's realm grows and moves

- **Its size:** radius 4 at the start, a cell of radius more for every 8 segments Sovereign grows, up to 7 (`home` in
  `ai/rivals/sovereign.js`: `radius`, `grow`, `max`). If Sovereign wastes away, it shrinks back, with 2 segments'
  grace so it doesn't flicker.
- **It drifts:** every 15 ticks (about 1.5 s, `drift`) it checks whether a cell's step would put clearly more of it on
  open log (holes and fire are lost land) and drifts that way, one cell at a time. On screen its land grows or shrinks a
  ring of cells at a time, and its border flares.
- **Its banner:** its capital flies a swallow-tailed banner in parchment and ink, its crown inked, trimmed in the
  realm's colour (a blue banner vanished into the blue wash; no gold: gold means a power).
- **Its lines:** Sovereign remarks on it ("Our realm expands!", "A strategic retreat. A royal one.", "The court
  relocates.").

### Colonist's flags

- **The Union Flag:** Colonist plants it and it flies (drawn in strips that ripple out from the pole), on an inked pole
  with a parchment knob. It is the 1801 flag everyone recognises, the one of the Empire's great colonising century: the
  redcoats were the British Army from 1707, and the colonies were claimed under the Union Flag (St George's cross alone
  is England's).
- **Its later colonies fly colonial ensigns,** as the Empire's colonies did: the Union Flag in the corner of a Blue
  Ensign with the Southern Cross (the second, fourth, …) or a Red Ensign with the colony's badge, here the log's own oak
  on a white roundel (the third, fifth, …). The first colony keeps the Union Flag. Each colony remembers its number
  (`n`), so its flag never changes.

### A pecked flag is a lost colony

The owner: "territory stays behind when the woodpecker takes out the flag. Probably shouldn't do that." So land never
outlives its flag:
- **Colonist:** a colony whose flag cell becomes a hole is lost. Colonist forgets it, its land shrinks into the pit
  ring by ring, and Colonist sets off at once to plant another (swapping a pecked site it was heading for).
- **Sovereign:** a pecked capital moves the realm at once, banner and all, to the nearest centre that isn't a pit (the
  most land among those as near); its slow drift never moves onto one.
- **The fall:** the flag tips over and drops into the pit, shrinking and fading (760 ms, `FALL_MS` in
  `render/flags.js`; with reduced motion it fades in place). A pecked capital's banner falls into the pit the same way,
  and a new one pops up at the new capital (the owner, 2 November 2026: flags fall, they don't jump); a banner only
  glides, 240 ms, when the realm drifts a cell. A flag or banner on a piece the strike cuts loose rides that piece down,
  upright, shrinking and fading with it (750 ms), as its food does.
- **The lines,** even just after another line (the peck itself goes without its usual one): Colonist, "The flag's gone
  down the hole! Abandon colony!"; Sovereign, "The capital has fallen. Into a hole."
- **The lesson,** the first time each happens in a round, for everyone, players and watchers, chatter on or off: "The
  woodpecker took a flag: that colony's lost." or "The woodpecker took a capital: its realm moves." It's seen as the
  chatter sees it, a tick after the strike (a colony gone from its snake's memory with a hole where its flag stood, or a
  realm moved off a centre that's now a hole), so a colony Colonist simply lets go says nothing; it waits behind a
  lesson holding the banner.
- **The Field guide** has a row for it (Lost flags) and a picture.

### Flags that bend under a snake

The owner (29 October 2026; entry 2l): Sovereign's banner and Colonist's flags bend over while any part of any snake
lies on their tile. Drawing only (`bendOn` in `render/flags.js`): each screen draws it from the snakes it has, so online
play needs no protocol change, and the simulation doesn't load the renderer.
- **The way it bends:** the pole tips from its foot the way that snake stepped onto the tile, and the cloth trails behind
  and droops. The snake already on it keeps it; when it leaves, another snake there takes over and the flag eases to the
  new way.
- **North and south:** a north or south push also leans the flag out to its cloth's side (east), since a pole leaning
  straight along a body lay hidden on it. North stretches the pole a touch and hangs the cloth; south shortens the pole.
  A head that comes on dead from the north or south knocks it flat instead (see "Flags in depth, hit head-on").
- **Freed,** it springs upright with a wobble that dies away in under a second. With reduced motion it leans and stands
  up at once.
- **The banner** bends only at rest on its cell, never while it glides or pops up at a new capital. A flag that falls
  into a pit drops its bend.

### Flags in depth, hit head-on

The owner (30 October 2026): "the flag bends now. But i would like to give it some perspective also. So people that pass
behind it, dont show up in front of it. They should be behind it. Also, it doesn't quiet know what to do when a snake
hits it dead on, so that must be accounted for. And it should also react to soverign and colonists hitting it."
Drawing only, from the snakes each screen has: no simulation, no protocol change.
- **In depth.** Every flag and banner is drawn over the snakes (`drawBentFlags` in `render/flags.js`), upper rows
  first, so anything on the tiles behind it goes under its pole and cloth. Over the row in front of it, a snake's drawn
  shape (its body, outline and any gold line; a dead one's too, while it is held where it died) is cut out of it (`frontOf` and `frontCut`: the flag drawn on a small
  layer of its own, then laid on the board), so whatever stands in front hides the pole's foot, and only what its body
  covers: the pole stands to the outline's edge (#512).
- **Head-on.** A head that comes onto the tile from the north or the south has no side to push the pole to: it is
  knocked flat ahead of the head (`look[4]`, how flat: laid towards you, the pole turns right round and lies down the
  screen; laid away, it lies up it), and for `WRAP_MS` (260 ms) its cloth is wrapped round the head, over it, its ends
  folded back along the head's sides (`wrapCloth`). Then it lies under the body, drawn under the snakes, and springs
  back as any flag does once the tile is free. A flag laid away swings up through upright as it springs back, never
  flattening towards you. With reduced motion there is no wrap.
- **Owners:** Sovereign over its own banner and Colonist over its own flags bend them as anyone does, head-on too, which
  owners meet most, heading for their own flag (a render test proves it).
- **Planted under a snake.** A flag that wasn't on the board a moment ago (not drawn in the last frame drawn, by frames,
  not ms, so watching at 4x never counts a flag in sight as new; Sovereign's banner counts as in sight while it glides)
  and turns up with a snake already on its tile, as each new colony does under Colonist's head, is bent from its first
  frame: it doesn't stand for a frame and then snap over, and a head-on one lies flat under the head without wrapping
  the face that planted it.
