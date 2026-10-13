# Design: Bark & Bite

## The vision in one paragraph

A storybook diorama of a tree trunk seen from above. Four caterpillar-snakes wind across warm bark under a carved wooden frame, while notes on parchment tell you what's going on. Everything should look cut from the same few materials: **bark, heartwood, parchment, ink and leaf**. Nothing should look like a generic app widget. The game isn't classic snake: it's a small rivalry between you and three characters with their own minds and voices. Polish means making every part of that rivalry readable, fair, smooth and charming, not adding more of it.

**The second pass** (see AUDIT.md) adds nothing new to play. It goes after the moments that still felt off when looked at frame by frame: the death freeze-frame that jumped, bends that pulsed, a woodpecker that could peck the cell right in front of you, a Hall of Fame rank that changed its mind, phones and laptops that hid the board or the Play button, and online rooms that broke after a few rejoins. It also moves the frame budget to where the time really goes: the GPU drawing long snakes.

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

The rivals keep their faces and patterns, and share the blink, the bite, the gulp and the forked tongue, each flicking at its own pace: Gobbler often (more near food), Creeper with relish, Drab and Ghost hardly at all, and Vulture never (it has a beak). **Every snake looks at something**, and what it looks at says who it is (drawing only: it never changes how anyone plays). Gobbler eyes the nearest food, its eyes growing as it gets close. Sniper swings its scope onto its target, Sovereign and Colonist watch intruders (Colonist otherwise eyes its next flag), Vulture watches the snake it expects to die, Copycat its model, Creeper the tail it rides, and Ghost, Metagamer, Desperado and Joker the nearest head. Drab lazily eyes the nearest food under heavy lids, and Mason keeps an eye on whoever is near his wall. With nothing of its own to watch, any snake watches the nearest head, so no face ever just stares ahead. Wildcard has an orange tan under a puffy golden combover swept across and forward to a curl over one eye, a white collar and a long red tie that bends with its rainbow body; it squints, pouts, and lets its eyes wander wherever they like. Most have small white eyes with a catchlight, closed eyes that curve like a cartoon's when they blink, and a little mouth; Ghost, Creeper and Copycat keep their special eyes, which still turn, and Vulture's beak gapes instead. Gobbler wolfs its food down: a gulp twice the size, and hamster cheeks either side of its mouth that puff up with every bite and slowly go down. Capricious gets a permanent pink head ring, so you can always find it whatever mood it's in.

## Food and the world

- **Apples:** green apples bob gently.
- **The golden apple** shimmers with a small rotating sparkle star (a non-hue cue). Instead of blinking before it rots, it dims calmly.
- **Mushrooms** sway slightly.
- **Beetles** (your Flåklypa idea): a jewel beetle, emerald with a gold rim, that comes out where it's quiet and walks the bark cell by cell with scuttling legs. It's the one food that moves, so it adds a chase to the core loop. **Tuned in the simulator (250 seeded rounds per setting):** a beetle that bolts as fast as a snake was a death trap (rounds 75 s -> 57 s, and 20% of deaths happened within 4 cells of a beetle, as snakes followed it into tight spots); one that scurries at half a snake's speed from any head within 4 cells leaves rounds as they were (72 s, deaths near a beetle 5%) and still makes you chase: 89% are caught, after about 4 s of pursuit. The AIs value one at what it's worth (two apples) and see it through their usual reaction delay. A skitter when one appears, a crunch when you catch it, and Gobbler, Desperado, Sniper and Mason have something to say about it (Mason: "Scarabaeus captus!").
- **Meat:** a roast drumstick, ringed in the colour of the snake it came from, with a light edge so it reads against the bark. (It used to be tinted all over, and green or purple meat looked spoiled.)
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
| Start prompt | **"Ready, Green?"** (your Hall of Fame name, once you have one: the header already says *Bark & Bite*), then "Three rivals. One tree. Last snake wriggling wins." The control hint below adapts to keyboard or touch. |
| Countdown | Rotating roll-calls ("Up the tree with you:", "Sharing your bark:") above the rival list |
| Go | "Slither!" when you're playing; "And they're off." when you're watching (the narrator never talks to "you" in a round you're not in) |
| Pause | Title **Napping**, then a rotating line ("Snakes need rest too."), then "Space or P to wake up" on keyboard or "Tap Wake up" on touch |
| Death titles | Matched to the cause: "Bonk!" for the edge, "Tangled!" for biting yourself, "Squashed!" for a rival's body, "Head-on!" for a head-on crash, **Starved!** for hunger and **Down the hole!** for the woodpecker |
| Death flavor | Cause-specific lines, or the killer's own line, rewritten to be cause-neutral |
| New best | **"New best: 14!"** with a short fanfare and a gold burst. Hall of Fame: "Hall of Fame #2. Carve your name:" |
| Round over | "You win!" / "{Name} wins" with the winner's punchline, without repeating the title. A win says "Won in 2:10 · score 14"; a draw says "You shared 1st" |
| Control hints | Every item is a key and a verb. Start card: "Arrows or WASD steer · Space naps · Enter starts · H opens the Hall of Fame"; under the board, "Enter starts over" instead, plus "M mutes · N toggles the music"; touch: "Swipe to steer · Tap ⏸ to nap" |
| Screen readers | A card is announced as sentences ("Bonk! You hit the wall, 4th place, score 2. The tree goes on. You don't. New best: 14!"), never "dot" |

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
| Touch precision | A swipe registers once the finger has travelled half a cell (at least 12 px, about 3 mm, against finger jitter), without lifting; one touch can chain several turns. **During a round a swipe works anywhere on the screen**, including over the countdown, and the page never scrolls or refreshes |
| Never a dead moment | Every key in every state does something visible, or is documented as ignored (arrows while napping or on a round-over card). Space and Enter always mean nap and start over, unless a card or dialog button has keyboard focus |
| Rivals explained everywhere | Desktop cards list each rival with a line on how it plays; on small boards the card lists names only, and tapping a rival's tag above the board shows its line (phones have no tooltips) |
| The board fits | On every screen from a 320×460 phone to a 1280×720 laptop, the whole board and the card's buttons are visible without scrolling; wide, short screens put the board beside the scores |

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

**The woodpecker comes at 2:00, not 3:00** (your call, and the numbers agree). With hunger, food is what keeps a round going, and late rounds were dragging. Over 600 simulated AI rounds the median round lasts 71 s, the middle half 46-112 s, and 21% of rounds reach the woodpecker, so it's a real event rather than a rarity. Every personality wins 15-31% of the rounds it plays. (Gobbler had slipped to 8%: it chased food straight into other snakes. It now flinches from heads a little more, so it lives longer and, true to form, eats a third more.)

**The woodpecker plays fair.** It pecks the next free cell of the ring, but never one within 3 cells of a head, and never under food; it comes back for skipped cells later. Before, it could peck the cell right in front of you, leaving one tick (90 ms) to react, while the AIs, who saw holes instantly, always dodged. Now the AIs see holes with the same reaction delay as everything else. Over 600 simulated rounds the AIs fall into holes *less* often than before (0.23 times per woodpecker round, down from 0.31), because there's always time to see one coming.

**A cornered AI makes the sensible last move.** When every move looks fatal, a wall, a hole or its own body is certain death, but a rival's cell may already be free (it sees rivals as they were a moment ago), so it bets on the cell that frees up soonest. It used to pick at random, and those were the deaths that looked dumbest: self-bites fell from 15% to 8% of AI deaths and wall crashes from 7% to 2%. Two heads that swap cells now count as a head-on, as they look.

**Starving is decided after eating.** A snake whose head reaches food on the tick it would starve eats instead.

**The Hall of Fame ranks by place, then time alive, then food** (your call). Food stops appearing at 2:00, so food eaten mostly measures how early you died; time alive measures how well you played. The rank on your death card already counts the snakes still alive (they'll all finish ahead of you), so it's the rank the round-over card will show.

## Sound

Every sound is synthesised live with the Web Audio API, through one AudioContext, created on the first key or tap (browsers require a gesture). There are no audio files, so it works offline with nothing to download.

- **Cues** are short and round: a marimba pluck for an apple (nudged in pitch each time, so a run of apples doesn't grate), a rising sparkle for gold, a low "nom" for meat, a wobbling "boing" for a mushroom, a far-off thud when a rival dies, a two-note sigh for your death, a fanfare for a new best and a bouncier phrase for a win, wood-block countdown beats and a "go", the woodpecker's knock-knock and pecks, and a tummy gurgle when you start starving.
- **Mixing:** everything goes through a compressor so four snakes eating at once can't clip. At most 6 cues sound at once (death, best and win always get through), and each cue has a minimum gap so it can't machine-gun.
- **Music** is scheduled note by note on the audio clock, a quarter second ahead, from the game loop, and switches arrangement at bar lines so changes land on the beat. It has its own bus and its own switch (N), separate from all sound (M). Both are remembered.

## Play with friends (online)

Friends-only rooms, peer to peer, so it stays a static site with nothing to deploy and no accounts.

- **The host's browser runs the game**, exactly the code that runs alone (`engine.js`, the AIs, the chatter). Every tick it sends friends a compact picture of the board (about 0.9 KB, so about 8 KB/s per friend); friends send back only their turns. Their screens glide between ticks with the same renderer. `tools/online-test.js` checks that a friend's board matches the host's on every tick, and two real browsers matched on every tick of whole rounds.
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
- **"Speech bubbles"** *(not in the brief, but they affect readability):* kept and toned down. They're smaller, slightly translucent, follow the gliding head, never outlive their round, and long lines go to the log only on small boards. They sit beside a snake going up or down (never over its path or its body), fade while your head is near one, and a snake doesn't repeat a line within 45 s of game time; Mason's *Life of Brian* routines come once per visit. Banners move to the board's foot while a head passes under them.

### Second pass

- **"Move the simulation off the main thread":** *still adapted, with a corrected reason.* A Web Worker built from a blob does run from `file://` (the host's hidden-tab clock already is one), so that wasn't the obstacle. The real cost is that the renderer and the chatter read ten fields of each AI's memory every frame, which a worker would have to mirror back each tick. The measured tail came from the first decision of a round (the JIT warming up) and from decisions sharing a frame with a tick, so instead every rival's brain is warmed on the start card and no thinking happens in a frame that has just ticked.
- **"Throttle rendering when paused or hidden":** *already true, one part skipped.* Nothing is drawn while napping, on a card or in a hidden tab (GPU idle). The animation loop itself keeps running on those screens to schedule the music, at 0.1 ms a frame; a second clock for the idle case isn't worth the complexity.
- **"Zero allocation in the hot path":** *now applied to the renderer too.* The per-segment colour lookup built strings every frame (half of the render script time in the long-snake scene); colours now come from a cached ramp per snake, and the remaining closures and array literals are hoisted. The engine's one snapshot per tick for the AIs' reaction delay stays, as before.
- **"Batch draw calls into one path":** *reversed, on measurement.* With Chrome's GPU canvas, one path of 70 circles is triangulated every frame, and bands stroked between circles break batching; separate circle fills batch into one GPU operation even across colours. So bodies are drawn as all bands (rectangles), then all circles.
- **A jitter buffer for friends' screens:** *skipped.* Tick spacing measured steady (118-122 ms, even with the host's tab hidden), and a buffer would add latency for everyone.
- **Command letters on Colemak and Workman:** *skipped.* WASD is read by physical key so it works on any layout; on Colemak, the physical S key types "r", so giving letters priority would restart your round when you steer down.
- **Renaming the storage keys and `pellet`:** *skipped.* Renaming keys would orphan everyone's saved Hall of Fame; the rest is cosmetic.
- **Splitting snake.js (the friends' lobby into its own file) and the long `drawFace` and `decide()`:** *skipped for now.* Big moves with no change a player can see; noted in AUDIT.md for later.
