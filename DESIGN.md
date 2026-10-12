# Design: Bark & Bite

## The vision in one paragraph

A storybook diorama of a tree trunk seen from above. Four caterpillar-snakes wind across warm bark under a carved wooden frame, while notes on parchment tell you what's going on. Everything should look cut from the same few materials: **bark, heartwood, parchment, ink and leaf**. Nothing should look like a generic app widget. The game isn't classic snake: it's a small rivalry between you and three characters with their own minds and voices. Polish means making every part of that rivalry readable, fair, smooth and charming, not adding more of it.

## Art direction: "storybook bark"

**Why it suits snake.** Snakes and caterpillars belong on bark. The texture gives the grid a sense of place, and the grid stays readable through faint carved lines baked into the wood. Warm, mid-dark bark lets bright characters and food pop by brightness, not only by hue. It's also the direction you chose, inspired by the caterpillar game in *Flåklypa Grand Prix*. It's kept and refined rather than replaced.

### Palette: the 8 interface colors

Everything in the UI uses only these.

| Name | Hex | Used for |
|---|---|---|
| **Night Moss** | `#15201a` | page background (with a soft lighter glow at the top) |
| **Bark** | `#5a3b22` | the board |
| **Heartwood** | `#7a4a24` | the frame, small wooden buttons, card titles |
| **Parchment** | `#f6ecd2` | cards, name tags, bubbles, banners, the dialog |
| **Ink** | `#3a2614` | all text on parchment; outlines |
| **Leaf** | `#4d7c0f` | primary buttons (passes AA with cream text) |
| **Sprout** | `#a3e635` | the title, your snake's highlights, the "fresh" accents |
| **Honey** | `#fde68a` | gold accents, flavor lines on dark, the focus ring on dark |

There are also two functional tints that aren't separate colors. **Parchment-2** is a darker parchment used for rings and tracks. **Berry** `#dc2626` is used only for danger: hunger, mushrooms and the "starving" state.

**The cast palette is a deliberate exception.** The 15 personalities plus you need 16 separable identities, which 8 colors can't give. Each character keeps its own color, but it's never the only identifier: every character also has a face or body pattern (crown, tricorn and cross-belts, fangs and stripes, bricks and laurel, jester two-tone, rainbow and hair, cat ears, and so on). You get a cream outline.

### Shape, line, texture, corners

- **Corners:** everything is rounded, on one scale:
  - 6 px for small chips
  - 10 px for name tags, bubbles and banners
  - 16 px for cards and the dialog
  - 20 px for the frame
  - pills only for buttons
- **Lines:** parchment surfaces get a 2–3 px inset ring of Parchment-2, and color dots get a 1.5 px ink ring. On the board, lines are drawn at whole device pixels.
- **Texture:** only the bark has texture. It's prerendered once from a fixed seed, so it's the same tree every round. Parchment stays flat, and its paper feel comes from the ring and a soft shadow.
- **Depth:** buttons have a 3 px "lip" and press down 2 px. Cards float on a soft 0 10 30 shadow. Snakes cast a small offset shadow on the bark. There's no blur anywhere on the canvas.

### Typography

One family: **Fredoka** (rounded), at weights 400–700, with a system rounded/sans fallback. It loads non-blocking, so the game is playable instantly and offline with the fallback font.

## The snake as a character

Your snake is the protagonist, so it gets the most life:
- **Eyes that glance at the nearest food:** white sclera with ink pupils that ease toward the target.
- **A blink** every 3–6 s, at random.
- **A forked tongue flick** every few seconds, more often when food is close.
- **A body that tapers to the tail**, with **smooth rounded curves at corners**. The spine follows the real cells, so the body never cuts a corner.
- **A gulp bulge** that travels down the body, one segment per tick, after every bite.
- **A thin cream outline**, so "you" is identifiable without relying on green.

The rivals keep their faces and patterns, and they share the blink and the gulp. Capricious gets a permanent pink head ring, so you can always find it whatever mood it's in.

## Food and the world

- **Apples:** green apples bob gently.
- **The golden apple** shimmers with a small rotating sparkle star (a non-hue cue). Instead of blinking before it rots, it dims calmly.
- **Mushrooms** sway slightly.
- **Meat:** a drumstick tinted by the snake it came from, with a light rim so it reads against the bark.
- **Holes** are baked into the static layer the moment they're pecked. The woodpecker perches on its newest hole, which can never be played on again, never on a playable cell.
- **The corner leaves move onto the frame** and never cover playable cells.
- **Sovereign's home** is a smooth, clearly visible tinted disc whose edge matches the trespass rule exactly. Colonist flags keep their St George cross.

## Borders and frames

One treatment, used everywhere:
- **Board:** a carved Heartwood frame with leaves resting on its corners.
- **Panels:** parchment with an inset Parchment-2 ring. This covers the cards, the dialog, the name tags, banners and bubbles.
- **Buttons:** pills with a lip.
  - Primary: Leaf with cream text.
  - Secondary: transparent with an Ink ring.
  - Small: Heartwood with cream text.
- **Focus:** a Honey ring on dark backgrounds and an Ink ring on parchment, always visible with `:focus-visible`.

## Voice and copy

**Tone: a wry woodland storyteller.** Short, warm and a little cheeky, never more than two short sentences. Exclamation marks are rare. The narrator speaks to you in the second person, and the snakes speak for themselves in their own voices.

| Moment | Copy |
|---|---|
| Title / subtitle | **Bark & Bite** / *A snake game up a tree* |
| Start prompt | "Three rivals. One tree. Last snake wriggling wins." The control hint below adapts to keyboard or touch. |
| Countdown | Rotating roll-calls ("Up the tree with you:", "Sharing your bark:") above the rival list |
| Pause | Title **Napping**, then a rotating line ("Snakes need rest too."), then "Space or P to wake up" on keyboard or "Tap Wake up" on touch |
| Death titles | Rotating ("Splat!", "Bonk!", "Tangled!", "Oof."), then **Starved!** for hunger and **Down the hole!** for the woodpecker |
| Death flavor | Cause-specific lines, or the killer's own line, rewritten to be cause-neutral |
| New best | **"New best: 14!"** with a short fanfare and a gold burst. Hall of Fame: "Hall of Fame #2. Carve your name:" |
| Round over | "You win!" / "{Name} wins" with the winner's punchline, without repeating the title |
| Control hints | Keyboard: "Arrows / WASD steer · Space naps · Enter restarts · H Hall of Fame"; touch: "Swipe to steer · tap ⏸ to nap" |

**Rules for every string:**
- One noun for the measure: **Score** (food eaten) and **Best**.
- "you" in the middle of a sentence, never "You".
- The snakes call you by your Hall of Fame name, or **Green** if you haven't set one.
- Mason speaks only phony Latin.

## Feel targets (checked in Phase 7)

| Target | Concrete check |
|---|---|
| Smooth motion at 60/120/144 Hz | Fixed timestep driven from one rAF loop with interpolation; a snake moves exactly one cell per tick, never stalls at cell boundaries |
| Frame budget | script + render per frame: **p95 ≤ 3 ms, worst ≤ 6.9 ms** (one 144 Hz frame) in the long-snake scene and at death and particle moments |
| Honest speed | Spectator 4× runs at 4.0× (±2%); ticks don't drift by their own cost |
| Input never lost | Two turns pressed within one tick both apply, on consecutive ticks; no input combo ever reverses into the neck |
| Eating feels good | Pop, particles, sound and score bump appear in the same frame as the bite tick; the gulp travels the body |
| Death lands softly | A 350 ms freeze-frame with a puff (plus a 4 px shake, only for your death and only without reduced motion), then the card rises in over about 250 ms |
| Restart is instant | Enter/R/Play: a short 3-beat countdown (3 × 350 ms) that **any direction key or swipe skips** (and steers) |
| Gentle difficulty | Tick 120 ms → 90 ms over 2 minutes; the first 3 ticks of a round are eased (170 → 120 ms) so the opening is forgiving |
| Touch precision | A swipe registers once the finger has travelled 0.5 of a cell, without lifting; one touch can chain several turns; the page never scrolls or refreshes |
| Never a dead moment | Every key in every state does something visible, or is documented as ignored (e.g. arrows while paused) |

## Architecture change (and why)

`snake.js` was 1,500 lines mixing the rules engine, the renderer, the UI, input and debug tools. It is split into:
- **`engine.js`:** the pure rules. It's used unchanged by the game and the headless simulator. It has no DOM, and its tuning block sits at the top.
- **`render.js`:** the canvas renderer: layers, sprite caches, particles, character animation, and the dev frame-time overlay.
- **`audio.js`:** a tiny Web Audio synthesiser.
- **`snake.js`:** the game controller: the loop, input, overlays, HUD and records glue.

`ai.js`, `chatter.js` and `records.js` keep their roles. Plain `<script>` tags still work from `file://`, with no build step.

## Skipped or adapted guidelines

Each line gives the guideline, what was done, and why.

- **"A perfect classic snake beats a cluttered one; no new modes":** *adapted.* The game is deliberately a four-snake rivalry with 15 personalities, items, chatter and a Watch AIs mode that you designed. Nothing is removed. The polish goes into readability and feel. No new modes were added.
- **"Board-full win state":** *adapted.* With four snakes sharing 576 cells (plus hunger and holes), a full board can't realistically happen. Food spawning stops gracefully if there's no free cell, and the round ends as usual.
- **"Store the body in a ring buffer instead of unshift":** *adapted.* Bodies stay arrays: measured, `unshift`+`pop` costs under 1 µs per tick, and the whole engine is about 1.3% of tick time. The real hot path was the AI search's per-node array spreads and closures, which were rewritten allocation-free instead.
- **"Zero allocation in the hot path":** *applied to the render loop and the AI search.* The engine still allocates a little per tick (one snapshot for the AIs' reaction delay). That's about 120 ms apart and far from the frame path.
- **"A soft sound for turning":** *skipped.* Turning happens many times a second and any sound became noise in testing. Your hands already feel the turn.
- **"Tune difficulty by playing":** *adapted.* I can't play at human speed with a real keyboard. The ramp was tuned conservatively (≤33% faster over 2 minutes, an eased opening) and checked with scripted and AI play. It's flagged for you to try.
- **"Colorblind-safe palette":** *adapted.* 16 characters can't all be hue-distinct. Instead, nothing is identified by hue alone: faces and patterns for rivals, a cream outline for you, distinct shapes for food (apple, golden apple with a star, mushroom, drumstick).
- **"No external assets":** *adapted.* Fredoka from Google Fonts was already used. It's kept but loaded non-blocking, so the game works offline with the fallback font.
- **"Prerender static layers or stack canvases":** *prerendered.* One visible canvas, with offscreen layers for bark + grid + holes and cached sprites. That's simpler than syncing stacked canvases.
- **"Move the simulation off the main thread" (implied by the frame budget):** *adapted.* A Web Worker wouldn't run from `file://`. Instead the AI thinking for the next tick is spread over the frames between ticks, with the same information and the same decisions.
- **"Particles in the palette's colors":** *adapted.* Particles use the palette plus the color of what was eaten (golden for golden apples, the snake's tint for meat), so the burst says what happened.
- **"High score in localStorage":** *kept and extended.* There's Best plus the existing Hall of Fame and stats, every access in try/catch. Watched AI-only rounds now count in the Hall of Fame (your request), but never in your personal stats.
- **"Pause automatically on blur/visibility":** *applied to hidden tabs, and to window blur only while you're playing.* A watched AI round keeps running when you click elsewhere on the same screen, but pauses when hidden.
- **"Speech bubbles"** *(not in the brief, but they affect readability):* kept and toned down. They're smaller, slightly translucent, follow the gliding head, never outlive their round, and long lines go to the log only on small boards.
