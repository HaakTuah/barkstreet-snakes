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

**The cast palette is a deliberate exception.** The 15 personalities plus you need 16 separable identities, which 8 colors can't give. Each character keeps its own color, but it's never the only identifier: every character also has a face or body pattern (crown, tricorn and cross-belts, a scope and a squint, bricks and laurel, jester two-tone, rainbow and hair, cat ears, and so on). You get a cream outline.

### Shape, line, texture, corners

- **Corners:** everything is rounded, on one scale:
  - 6 px for small chips
  - 10 px for name tags, bubbles and banners
  - 16 px for cards and the dialog
  - 20 px for the frame
  - pills only for buttons
- **Lines:** parchment surfaces get a 2–3 px inset ring of Parchment-2, and color dots get a 1.5 px ink ring. On the board, the canvas maps 1:1 onto device pixels (nothing is resampled), and the carved grid lines land on whole pixels.
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
- **A bite:** the mouth opens when food is right ahead, the head squashes at the bite and chews twice, and a gulp bulge travels down the body, one segment per tick.
- **A bright cream outline with a soft halo**, so you find yourself at a glance without relying on green. Friends online get a thinner, plainer outline: people still read as people, but only you glow.

The rivals keep their faces and patterns, and share the blink, the bite and the gulp. **Every snake looks at something**, and what it looks at says who it is (drawing only: it never changes how anyone plays). Gobbler eyes the nearest food, its eyes growing as it gets close. Sniper swings its scope onto its target, Sovereign and Colonist watch intruders (Colonist otherwise eyes its next flag), Vulture watches the snake it expects to die, Copycat its model, Creeper the tail it rides, and Ghost, Metagamer, Desperado and Joker the nearest head. Wildcard's mismatched eyes wander, one of them the wrong way. Drab and Mason keep their eyes front. Most have small white eyes and a little mouth; Ghost, Creeper and Copycat keep their special eyes, which still turn, and Vulture's beak gapes instead. Gobbler wolfs its food down: a gulp twice the size, and hamster cheeks either side of its mouth that puff up with every bite and slowly go down. Capricious gets a permanent pink head ring, so you can always find it whatever mood it's in.

## Food and the world

- **Apples:** green apples bob gently.
- **The golden apple** shimmers with a small rotating sparkle star (a non-hue cue). Instead of blinking before it rots, it dims calmly.
- **Mushrooms** sway slightly.
- **Beetles** (your Flåklypa idea): a jewel beetle, emerald with a gold rim, that walks the bark cell by cell with scuttling legs and bolts from heads. It's the one food that moves, so it adds a chase to the core loop: you catch one by cutting it off, not by reaching it. Tuned in the simulator: it bolts at snake speed once a head is within 2 cells; with that, a little over half get caught, after about 9 s (median), and the rest fly off or outlast the round. The AIs value it at what it's worth (two apples) and see it through their usual reaction delay; rounds run a few seconds shorter and busier (median 64 s vs 71 s over 150 seeded rounds), and every personality still wins 10-41% of its rounds. A skitter when one appears, a crunch when you catch it, and Gobbler, Desperado, Sniper and Mason have something to say about it (Mason: "Scarabaeus captus!").
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
| Death titles | Matched to the cause: "Bonk!" for the edge, "Tangled!" for biting yourself, "Squashed!" for a rival's body, "Head-on!" for a head-on crash, **Starved!** for hunger and **Down the hole!** for the woodpecker |
| Death flavor | Cause-specific lines, or the killer's own line, rewritten to be cause-neutral |
| New best | **"New best: 14!"** with a short fanfare and a gold burst. Hall of Fame: "Hall of Fame #2. Carve your name:" |
| Round over | "You win!" / "{Name} wins" with the winner's punchline, without repeating the title |
| Control hints | Keyboard: "Arrows or WASD steer · Space naps · Enter starts over · H for the Hall of Fame" (plus "M sound · N music" under the board); touch: "Swipe on the bark to steer · tap ⏸ to nap" |

**Rules for every string:**
- One noun for the measure: **Score** (food eaten) and **Best**.
- "you" in the middle of a sentence, never "You".
- The snakes call you by your Hall of Fame name, or **Green** if you haven't set one.
- Mason speaks only phony Latin. His *Life of Brian* moments get answers: the Metagamer corrects "Romanes eunt domus", and "Biggus Dickus" (then "Incontinentia Buttocks") sets the others off giggling, as it does Pilate's guards.
- A rival's name says how it plays. Hunter became **Sniper**: it picks the snake it has the best shot at and cuts in front of its head, and "Hunter" could describe half the cast. Old Hall of Fame rows and kill counts carry over to the new name.
- Kill lines fit any way of dying to that rival (you ran into it, it ran into you, head-on), and win lines follow the "{Name} wins" title instead of repeating it.

## Feel targets (checked in Phase 7)

| Target | Concrete check |
|---|---|
| Smooth motion at 60/120/144 Hz | Fixed timestep driven from one rAF loop with interpolation; a snake moves exactly one cell per tick, never stalls at cell boundaries |
| Frame budget | script + render per frame: **p95 ≤ 3 ms, worst ≤ 6.9 ms** (one 144 Hz frame) in the long-snake scene and at death and particle moments. *Measured in Chrome at 2× density, watching at normal speed, over five runs: p95 0.9-1.9 ms, p99 2.1-5.3 ms, worst 6.7-13.1 ms (0-0.3% of frames over 6.94 ms), and no frame over 16.7 ms in any run. The p95 target is met. The worst-case target is not reliably met: now and then one AI decision on a crowded board lands in the same frame as a draw. At 4× watching speed (four times the ticks), a few frames a minute go over 16.7 ms.* |
| Honest speed | Spectator 4× runs at 4.0× (±2%); ticks don't drift by their own cost |
| Input never lost | Two turns pressed within one tick both apply, on consecutive ticks; no input combo ever reverses into the neck |
| Eating feels good | Pop, particles, sound and score bump appear in the same frame as the bite tick; the gulp travels the body |
| Death lands softly | A 350 ms freeze-frame with a puff (plus a 4 px shake, only for your death and only without reduced motion), then the card rises in over about 250 ms |
| Restart is instant | Enter/R/Play: a short 3-beat countdown (3 × 350 ms) that **any direction key or swipe skips** (and steers) |
| Gentle difficulty | Tick 120 ms → 90 ms over 2 minutes; the first 3 ticks of a round are eased (170 → 120 ms) so the opening is forgiving |
| Touch precision | A swipe registers once the finger has travelled half a cell (at least 12 px, about 3 mm, against finger jitter), without lifting; one touch can chain several turns; the page never scrolls or refreshes |
| Never a dead moment | Every key in every state does something visible, or is documented as ignored (e.g. arrows while paused) |

## The round's arc

A round has a shape, and the music follows it:

| Moment | Rules | Music |
|---|---|---|
| Start card, countdown, round over | - | A calm marimba loop (84 bpm) |
| Opening | The first 3 ticks are eased (170 → 120 ms) | The loop plus a soft bass |
| 0:45 | The speed-up (120 → 90 ms over 2 minutes) is well under way | A shaker joins; the tempo creeps up with the game's speed |
| 2:00 | **Sudden death:** no new food; the woodpecker pecks holes ring by ring | Minor key, wood-block knocks |
| Last two snakes | - | Faster and tense, with a heartbeat kick |
| Watching | - | Quieter, no percussion |
| Napping | - | Ducked to about a third |

**The woodpecker comes at 2:00, not 3:00** (your call, and the numbers agree). With hunger, food is what keeps a round going, and late rounds were dragging. Over 600 simulated AI rounds the median round now lasts 72 s, the middle half 45-108 s, and 20% of rounds reach the woodpecker, so it's a real event rather than a rarity. Every personality still wins 13-40% of the rounds it plays.

**The Hall of Fame ranks by place, then time alive, then food** (your call). Food stops appearing at 2:00, so food eaten mostly measures how early you died; time alive measures how well you played.

## Sound

Every sound is synthesised live with the Web Audio API, through one AudioContext, created on the first key or tap (browsers require a gesture). There are no audio files, so it works offline with nothing to download.

- **Cues** are short and round: a marimba pluck for an apple (nudged in pitch each time, so a run of apples doesn't grate), a rising sparkle for gold, a low "nom" for meat, a wobbling "boing" for a mushroom, a far-off thud when a rival dies, a two-note sigh for your death, a fanfare for a new best and a bouncier phrase for a win, wood-block countdown beats and a "go", the woodpecker's knock-knock and pecks, and a tummy gurgle when you start starving.
- **Mixing:** everything goes through a compressor so four snakes eating at once can't clip. At most 6 cues sound at once (death, best and win always get through), and each cue has a minimum gap so it can't machine-gun.
- **Music** is scheduled note by note on the audio clock, a quarter second ahead, from the game loop, and switches arrangement at bar lines so changes land on the beat. It has its own bus and its own switch (N), separate from all sound (M). Both are remembered.

## Play with friends (online)

Friends-only rooms, peer to peer, so it stays a static site with nothing to deploy and no accounts.

- **The host's browser runs the game**, exactly the code that runs alone (`engine.js`, the AIs, the chatter). Every tick it sends friends a compact picture of the board (about 0.9 KB, so about 8 KB/s per friend); friends send back only their turns. Their screens glide between ticks with the same renderer. `tools/online-test.js` checks that a friend's board matches the host's on every tick, and two real browsers matched on every tick of whole rounds.
- **Fair, in keeping with the AI rule:** the rivals never know who's a person. Lag would favour the host, who has none, so the host's own turns are delayed by half the friends' average round trip.
- **Never stalls:** a friend's browser says "still here" four times a second. After 0.75 s of silence an AI steers their snake (so a hiccup doesn't drive them into a wall), and any turn they send hands it straight back; a banner appears only if the silence lasts 2 s. If they leave, the AI finishes their round. If the host leaves, friends get a card saying so.
- **The host's tab may be hidden:** browsers stop animation frames there, so a tiny worker clock keeps the round going.
- **What changes online:** no napping, no countdown skipping, no watching speeds; your Hall of Fame and stats keep only your own result; chatter is the host's, passed on, so everyone sees the same lines.
- **Connecting:** PeerJS (from cdnjs with an integrity hash, loaded only when someone opens Play with friends) and its free public broker introduce the browsers; STUN finds a route for most networks. Strict ones need a relay (TURN), which needs a signup, so it's left as a marked spot in `net.js`.
- **A shared Hall of Fame** (your idea): on joining, each browser sends its own best rounds (up to 10, never AI rows), and the host passes everyone's on, so friends' rows appear in each other's tables in their seat colors, tagged "friend". Each browser also records every person's result in rounds played together. Every browser has a private random player id and every round an id, so a round is stored once, whoever recorded or shared it first (`tools/records-test.js`). **Only you**, your best and your stats count only your own rounds. AI results aren't kept for online rounds, or every table would fill with the host's rivals.
- **People get seat colors** (green, lemon, lavender, sky) and the same cream outline, and names are made unique (a friend called "Sniper" becomes "Sniper 2" in a round with the rival).

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

## Skipped or adapted guidelines

Each line gives the guideline, what was done, and why.

- **"A perfect classic snake beats a cluttered one; no new modes":** *adapted.* The game is deliberately a four-snake rivalry with 15 personalities, items, chatter and a Watch AIs mode that you designed. Nothing is removed. The polish goes into readability and feel. No new modes were added.
- **"Board-full win state":** *adapted.* With four snakes sharing 576 cells (plus hunger and holes), a full board can't realistically happen. Food spawning stops gracefully if there's no free cell, and the round ends as usual.
- **"Store the body in a ring buffer instead of unshift":** *adapted.* Bodies stay arrays: measured, `unshift`+`pop` costs under 1 µs per tick, and the whole engine is about 1.3% of tick time. The real hot path was the AI search's per-node array spreads and closures, which were rewritten allocation-free instead.
- **"Zero allocation in the hot path":** *applied to the render loop and the AI search.* The search, which scores up to 27 positions per decision, allocates nothing; it went 3× faster, and garbage collections fell from one every 3 decisions to one every ~145. What's left is small and deliberate: each decision builds its helper closures once (about 10 KB), and the engine takes one snapshot per tick for the AIs' reaction delay. Moving those to module state would cost readability for little gain.
- **"A soft sound for turning":** *skipped.* Turning happens many times a second and any sound became noise in testing. Your hands already feel the turn.
- **"Tune difficulty by playing":** *adapted.* I can't play at human speed with a real keyboard. The ramp was tuned conservatively (≤33% faster over 2 minutes, an eased opening) and checked with scripted and AI play. It's flagged for you to try.
- **"Colorblind-safe palette":** *adapted.* 16 characters can't all be hue-distinct. Instead, nothing is identified by hue alone: faces and patterns for rivals, a cream outline for you, distinct shapes for food (apple, golden apple with a star, mushroom, drumstick).
- **"No external assets":** *adapted.* Fredoka from Google Fonts was already used. It's kept but loaded non-blocking, so the game works offline with the fallback font.
- **"Prerender static layers or stack canvases":** *prerendered.* One visible canvas, with offscreen layers for bark + grid + holes and cached sprites. That's simpler than syncing stacked canvases.
- **"Move the simulation off the main thread" (implied by the frame budget):** *adapted.* A Web Worker wouldn't run from `file://`. Instead the AI thinking for the next tick is spread evenly over the frames before it (usually one AI per frame), with the same information and the same decisions. In an A/B test, pacing beat a per-frame time budget on every run (p99 2.1-2.5 ms vs 3.2-3.9 ms).
- **"Particles in the palette's colors":** *adapted.* Particles use the palette plus the color of what was eaten (golden for golden apples, the snake's tint for meat), so the burst says what happened.
- **"High score in localStorage":** *kept and extended.* There's Best plus the existing Hall of Fame and stats, every access in try/catch. Watched AI-only rounds now count in the Hall of Fame (your request), but never in your personal stats.
- **"Pause automatically on blur/visibility":** *applied to hidden tabs, and to window blur only while you're playing.* A watched AI round keeps running when you click elsewhere on the same screen, but pauses when hidden.
- **"Speech bubbles"** *(not in the brief, but they affect readability):* kept and toned down. They're smaller, slightly translucent, follow the gliding head, never outlive their round, and long lines go to the log only on small boards.
