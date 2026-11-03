## Realms and colonies

Sovereign's realm and Colonist's colonies: the land each claims on the log, drawn as borders on a map, and the flags
that mark it. The rules as food and the world, looks and lines, round four, round six A and the owner's playtest
settled them (their text, with what was tried and measured, is in `docs/archive/design-realms.md`). Elsewhere: how the
two play their land (`39-the-rivals.md`), their land lines ("Land lines" in `19-looks-and-lines.md`), the drum and fife
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
