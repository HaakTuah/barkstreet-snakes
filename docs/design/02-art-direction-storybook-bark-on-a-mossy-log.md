## Art direction: "storybook bark", on a mossy log

**A log, with the tree's looks.** As the board grew weather, burrows, a woodpecker and force fields, "the bark of a standing tree" stopped making sense: apples fall onto it, snow settles on it, things lie on it rather than cling to it, and snakes don't climb trees. A meadow was considered and turned down: it would lose the woodpecker (it pecks wood), the bark beetles and their burrows, burning wood, and the name *Bark & Bite* (now *Barkstreet Snakes*, still bark). A log on the forest floor, under an apple tree, keeps all of those and fixes the physics: everything lies on top, apples drop from the branches above, snow settles, and snakes really do bask on logs. The first log (a horizontal grain, a strong roll, heavy cushions of moss, a frame of log ends) was busier and darker than the tree, and the tree looked better. So the log now keeps the tree's looks: the same warm bark with its grain running top to bottom (the log runs that way), the same soft sun and shade and the carved heartwood frame, plus a little shadow down both sides where the log rounds away. Moss is a trim, not a carpet: a dozen small soft cushions, mostly down the sides where it wraps round the log, a few on top. Each is a clump of small rounded tufts with a shadow under it, every tuft lit on its upper left and darker round its edge, with fine fuzz and, on the bigger ones, a few red-brown spore stalks. It's dark and olive, well apart from the apples' bright lime, so it never passes for food. The moss along the frame's edges is the same moss, in the same colours. Faint lichen was tried and dropped: at play size its pale rosettes passed for puffs of smoke, which on this board means fire.

**Why it suits snake.** Snakes and caterpillars belong on bark. The texture gives the grid a sense of place. There are no grid lines (they made it look like squared paper): everything on the bark sits on the cells, so they stay easy to read without them. Warm, mid-dark bark lets bright characters and food pop by brightness, not only by hue. It's also the direction you chose, inspired by the caterpillar game in *Flåklypa Grand Prix*. It's kept and refined rather than replaced.

### Palette: the 8 interface colors

Everything in the UI uses only these. (The drawn characters bring their own colours: the cast on the board, and the title's snake S, whose shadow side is a caramel, `#d19a45`, so that no gold on a snake ever means anything but a power.)

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

