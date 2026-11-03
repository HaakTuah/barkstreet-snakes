## The owner's playtest

The owner played the live game (6d478ed) on a desktop and sent three findings, from a napping round (Ouroboros, Metagamer, Gobbler, Copycat):
- Ouroboros went round and round right next to a golden apple and wouldn't eat it; with more play, it let almost all food by the edge go ("it approaches it, but cuts off before eating it"). Does any other rival do it? Beside fire, a hole, another snake?
- Clicking a rival's name tag while napping showed its description, and the Napping card took it back after a second or two.
- The Field guide isn't obviously behind the trophy.

### A meal isn't a pin

Its rules are in `39-the-rivals.md` under the same name, and its text as it was, with what it measured and how it was
tested, in `docs/archive/design-rivals.md`.

### A rival's note

Its rules are in `43-the-start-card-and-records.md` under the same name, and its text as it was, with the cause and
what was measured on each board, in `docs/archive/design-online.md`.

### The Field guide's own door

Its rules are in `30-teaching-by-showing.md` under the same name, and its text as it was, with how it was tested,
in `docs/archive/design-page.md`.

### The cards, by the board

Its rules are in `33-one-screen.md` under the same name, and its text as it was, with what was measured, in
`docs/archive/design-page.md`.

### The header's rows

Its rules are in `33-one-screen.md` under the same name, and its text as it was, with how it was tested (and
the tests of the note and the guide's doors), in `docs/archive/design-page.md`.

### Burrows grow shut

Its rules are in `04-food-and-the-world.md` under the same name, and its text as it was, with how it was tested and
measured, in `docs/archive/design-food.md`.

### A body over a pit, smooth

Its rules are in `03-the-snake-as-a-character.md` under the same name, and its text as it was, with the finding, its cause
and how it was tested, in `docs/archive/design-looks.md`.

### Rainbows upright

**The cause:** `drawRainbow` (`render/weather.js`) drew the arch round a centre level with the golden apple. From an apple in the log's upper half there was no room over it, so it deliberately hung the arch downward, red outermost at the bottom: a rainbow upside down.

**The call** (27 October 2026): always upright, red outermost. An apple in the lower half keeps its arch. For one in the upper half the arch is part of a great circle centred 1.15 boards down, below the log, passing through the apple: it rises out of the apple, over, and down off the far side (the side of the board farther from the apple), ending where the circle leaves the board's bottom (well beyond the far edge). (Its numbers were replaced twice since, below.)

**Where its top is** (27 October 2026, after PR #57 put the top 0.06 of the board from the top edge with the radius fixed at 1.09 boards, which left an apple near the middle of the top half showing only the rising side): the arch's top is half way from the apple to the far edge, so the arch is even between them and comes back down to the apple's height at the far edge. The side is the far side by the apple's column, fixed for that rainbow (the board has an even number of columns, so no apple is in the middle), and within each half the arch changes smoothly as the apple's place does.

**Rounder, and the same in both halves** (27 October 2026, the owner on the follow-ups PR #61 left open: "And I agree, queue!"; this PR): with its centre 1.15 boards down, an arch over a short stretch was shallow (from an apple by the middle it rose about a cell), and an apple in the lower half kept the old half circle round its own height, so one low near the middle showed only its rising side. Now every rainbow, from either half, follows the one rule: up out of the apple, its top half way to the far edge, down to the apple's height at that edge and on off the board. Each is the same round arch, its centre below the apple by half the arch's half-width (d, half the way to the far edge): its radius 1.12 d, its top 0.62 d above the apple, the arc from the apple to the far edge 127°. From an apple by the middle (d about 6.25 cells) it rises 3.9 cells, from one low by a side edge 7. Where its top would come nearer the top edge than 0.06 of the board (or half the apple's height, for an apple in the top 0.12 of the board), it's flatter instead, its centre lower so its top is just that, and the change is smooth where the two meet. A low apple's arch is smaller than the old half circle (whose top was 0.1 of the board from the top edge from anywhere), but it's always whole. render-test checks twenty apples, left, middle and right, high and low in both halves, and that from one by the middle, high or low, it rises clearly (its glow's top over 4.5 cells above the apple's middle; 5.2 now, 2.25 before).

### Hunger on the body

Its rules are in `03-the-snake-as-a-character.md` under the same name, and its text as it was, with how a new player's
starving rate was measured, in `docs/archive/design-looks.md`.

### The phone gap

Its rules are in `31-phones.md` under the same name (the woodpecker's perch under "The woodpecker's perch"
there), and its text as it was, with how it was tested, in `docs/archive/design-page.md`.

### The phone's bottom

Its rules are in `31-phones.md` under the same name (the woodpecker's perch and its play with the controls
under "The woodpecker's perch" there, its size in "The woodpecker, as big as it gets" in `38-the-woodpecker.md`),
and its text as it was, with what was measured, in `docs/archive/design-page.md`.

### Wildcard's hair

Its rules are in `03-the-snake-as-a-character.md` under the same name, and its text as it was, with each hair before
it, in `docs/archive/design-looks.md`.

### Copycat's face

Its rules are in `03-the-snake-as-a-character.md` under the same name, and its text as it was in
`docs/archive/design-looks.md`.

### The rival line-up

Its rules are in `39-the-rivals.md` under the same name, and its text as it was, with how dealing went before, in
`docs/archive/design-rivals.md`.

### The woodpecker, 1.3 times

Since grown again ("The woodpecker, as big as it gets"): its size now is in `38-the-woodpecker.md` under that name, and
this section's text as it was, with what it measured, in `docs/archive/design-woodpecker.md`.

### The woodpecker, as big as it gets

Its rules are in `38-the-woodpecker.md` under the same name (with "Clear of the row's words (2k+)" and "Bigger on a
phone"), and its text as it was, with how it was tested and measured, in `docs/archive/design-woodpecker.md`.

### The woodpecker pecks beside a snake

Its rules are in `38-the-woodpecker.md` under the same name, and its text as it was in
`docs/archive/design-woodpecker.md`.

### Flags that bend under a snake

The owner (29 October 2026; entry 2l): Sovereign's banner and Colonist's flags bend over while any part of any snake lies
on their tile. The pole tips from its foot the way that snake stepped onto the tile, and the cloth trails behind and
droops. The snake already on it keeps it; when it leaves, another snake there takes over and the flag eases to the new
way. A north or south push also leans the flag out to its cloth's side (east), because a pole leaning straight along a
body lay hidden on it. North stretches the pole a touch and hangs the cloth; south shortens the pole. While a flag
leans it is drawn over the snakes, since under them it couldn't be seen. Freed, it springs upright with a wobble that
dies away in under a second. With reduced motion it leans and stands up at once. The banner bends only at rest on its
cell, never while it glides or pops up at a new capital. A flag that falls into a pit drops its bend.
Drawing only (`bendOn` in `render/flags.js`): each screen draws it from the snakes it has, so online play needs no
protocol change, and the simulation doesn't load the renderer.

### Flags in depth, hit head-on (2p)

The owner (30 October 2026): "the flag bends now. But i would like to give it some perspective also. So people that pass
behind it, dont show up in front of it. They should be behind it. Also, it doesn't quiet know what to do when a snake
hits it dead on, so that must be accounted for. And it should also react to soverign and colonists hitting it."
- **In depth.** Every flag and banner is drawn over the snakes (`drawBentFlags` in `render/flags.js`), upper rows first, so
  anything on the tiles behind it goes under its pole and cloth. Over the row in front of it, it is cut away where a
  snake lies (`clipFront`: each body cell a fifth of a cell above its row for its outline, a head's a third for its face), so
  whatever stands in front hides the pole's foot.
- **Head-on.** A head that comes onto the tile from the north or the south has no side to push the pole to: it is knocked
  flat ahead of the head (`look[4]`, how flat: laid towards you, the pole turns right round and lies down the screen; laid
  away, it lies up it), and for `WRAP_MS` (260 ms) its cloth is wrapped round the head, over it, its ends folded back along
  the head's sides (`wrapCloth`). Then it lies under the body, drawn under the snakes, and springs back as any flag does
  once the tile is free. A flag laid away swings up through upright as it springs back, never flattening towards you. With
  reduced motion there is no wrap.
- **Owners.** Sovereign over its own banner and Colonist over its own flags bend them as anyone does (they already did;
  a render test now proves it). What looked wrong was the head-on case, which owners meet most, heading for their own
  flag.
- **Planted under a snake** (PR #255, polish). A flag that wasn't on the board a moment ago (not drawn in the last frame drawn, by frames, not ms, so watching at 4x never counts a flag in sight as new; Sovereign's banner counts as in sight while it glides)
  and turns up with a snake already on its tile, as each new colony does under Colonist's head, is bent from its first
  frame: never seen standing, it doesn't stand for a frame and then snap over, and a head-on one lies flat under the
  head without wrapping the face that planted it.
- Drawing only, from the snakes each screen has: no simulation, no protocol change.

### Beetles and the woodpecker

Its rules are in `04-food-and-the-world.md` under the same name.
