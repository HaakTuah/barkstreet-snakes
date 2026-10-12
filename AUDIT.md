# Audit: Bark & Bite, second polish pass

Baseline: `main` at `9848d00` (after PR #9: online play, beetles, faces with gaze, the look book). The first pass's audit is at [`3e2d8bc`](https://github.com/HaakTuah/snake-game/blob/3e2d8bc/AUDIT.md); almost all of it was fixed in PR #4.

## How this audit was done

- **Read in full:** every file, through seven lenses, by seven independent reviewers: loop, input and online; rules, fairness and AI; visuals; copy; performance; accessibility and layout; robustness and code health. Each reviewer was told what DESIGN.md already decided, so settled choices weren't re-reported.
- **Played:** in headless Chrome, with an autopilot steering your snake through real key events, at 800×800, on a 375×812 phone and on an 812×375 landscape phone. The reviewers also drove real touch, mouse and keyboard input, two- and three-tab online rounds (and one round through the real PeerJS broker), and 21 viewport sizes from 320×256 to 2560×1329.
- **Measured, not guessed:** simulated rounds for the rules and balance (over 3,000), Chrome traces for the frame budget, contrast computed from the rendered colours, and hostile input fed to the records and the protocol.
- **Verified:** I checked every high and medium finding against the code myself; several were also found independently by two reviewers (the death freeze-frame, Space going to clicked buttons, the Hall of Fame rank, the online Hall of Fame mid-round).
- **"Before" screenshots** of every state are in `docs/screenshots/before-2/`.

Severity: **high** breaks play, **medium** is a clear defect or a real cost, **low** is polish. Plan: **fix**, **adapt** (fixed differently from the suggestion), or **skip** (with the reason).

---

## Baseline performance

The first pass measured script time only. This time the reviewers also traced Chrome's GPU process, and that's where the real cost turned out to be. All numbers: headless Chrome 155, 800×800 at 2× density (1040 px canvas), Intel Iris Xe, a quiet machine.

| Measurement | median | p95 | p99 | worst | notes |
|---|---|---|---|---|---|
| Script per frame, watching at 1× (60 s) | 0.2 ms | 1.5 | 3.5 | 7.5 | 6 of 6,877 frames over 6.94 ms (one 144 Hz frame) |
| Script per frame, watching at 4× (60 s) | 1.1 ms | 6.2 | 8.6 | 18.8 | 110 of 3,429 frames over 6.94 ms; half the frame rate of 1× |
| Main thread per frame, all work (20 s trace, 1×) | 0.95 ms | 1.52 | 2.04 | 6.64 | style recalc on every frame (0.13 ms median) |
| GPU process (CrGpuMain), watching at 1× | | | | | **58% busy** (580 ms per second) |
| **GPU raster, long-snake scene** (4 × 70 segments, 30 meat, 40 holes) | **6.55 ms** | | | | three runs: 6.53, 6.56, 6.56; script for the same frames 0.5 ms |
| `step()` including every AI decision (4 AI-only rounds) | 0.9 ms | 1.9 | 2.3 | 8.9 | the think-ahead spreads this over frames |
| Load | | | | | first contentful paint 256 ms, about 280 KB of scripts |

**The headline:** a frame's script is cheap, but drawing long snakes costs the GPU process 6.5 ms a frame, nearly a whole 144 Hz frame on its own, and grows with length (10.4 ms at 110 segments). Each body band is stroked between two circles, which breaks Chrome's batching, and the shadow, highlight and brick paths are many-contour paths that get triangulated every frame (P1).

---

## 1. Loop, timing and input (including online)

| # | Sev | Issue | Where | Plan |
|---|---|---|---|---|
| L1 | medium | **The death freeze-frame jumps every snake a cell ahead, holds it, then snaps it back.** During the freeze the draw position is forced to the end of the tick; afterwards it falls back mid-tick. Measured: a rival leapt a full cell in one frame, held 350 ms, then jumped back 0.6 cell. The round's last frame jumps the same way. (Also found by the visuals reviewer.) | snake.js:171, 176 | fix: draw at the true mid-tick position during the freeze; ease the last frame of a round instead of jumping |
| L2 | medium | **On touch, swipes during the 3-2-1 countdown are swallowed.** The swipe listeners are on the canvas, which the countdown card covers, so a swipe neither skips nor steers, and a finger put down during the countdown never steers after Go. | snake.js:737, style.css:260 | fix: listen on the board, not the canvas |
| L3 | medium | **Online, a friend who switches tabs loses their snake.** Hidden tabs throttle the 4-per-second "still here" to once a second, so the stand-in AI flickers on and off (it steered 1 tick in 10) and the snake mostly drives straight. The host's own snake has no stand-in at all while the host's tab is hidden. | snake.js:1039, net.js:147 | fix: the tab says "away" and "back" itself; hand back only on a real turn |
| L4 | medium | **Online, the host's death freezes the round for everyone** for 350 ms (guest tick gaps 121, 119, 460 ms). | snake.js:157, 373 | fix: the host's simulation never freezes; only its own drawing and card do |
| L5 | low-med | **Clicking another window during the countdown doesn't pause**, so the round then runs unattended. | snake.js:812 | fix |
| L6 | low-med | **Space and Enter go to whichever HUD button you last clicked** (mute, music, speed, chatter, Hall of Fame) instead of napping or starting over. Holding Enter on a card button also repeats and skips the countdown. (Also found by the accessibility reviewer.) | snake.js:723 | fix |
| L7 | low | **A friend's screen can keep a speech bubble on the round-over screen**: the host's last chatter arrives after the round ended there. | snake.js:1161 | fix |
| L8 | low | **The host's input delay is half what fairness needs.** A friend sees each tick half a round trip late *and* their turn takes another half to arrive; the host only waits half. (Also found by the rules reviewer.) | snake.js:692 | fix: delay the host by the full round trip (capped) |
| L9 | low | **Online, H opens the Hall of Fame mid-round and your arrows stop working**; nobody steers your snake. (Also found by the accessibility reviewer.) | snake.js:715, 820 | fix: not while you're alive in an online round |
| L10 | low | The host's delayed turns can fire out of order when the round-trip estimate changes between two quick presses. | snake.js:694 | fix: first in, first out |
| L11 | low | Space (or hiding the tab) while the death card is up swaps it for the nap card, and waking hides your death card for good. | snake.js:699, 807 | fix: the death card comes back |
| L12 | low | Arrows on the start card do nothing. | snake.js:678 | fix: an arrow starts the round, already turning |
| L13 | low | Friends' screens have no jitter buffer: a late tick stalls the glide. | snake.js:155 | skip: measured tick spacing is steady (118-122 ms, even with the host's tab hidden); a buffer would add latency for everyone |
| L14 | low | Any lost connection says "{host} closed the room", and there's no way back in. | net.js:142, snake.js:1181 | fix: "Lost the connection" unless it was really closed, and a Rejoin button |
| L15 | low | A friend renaming on the round-over card can lose the name if the host starts the next round mid-typing (unverified). | snake.js:800 | fix |
| L16 | low | Coming back to the page from the back/forward cache leaves a frozen online board (unverified). | snake.js:1237 | fix |
| L17 | v. low | On Colemak/Workman, physical WASD wins over the command letters (Colemak's R is the physical S). | snake.js:719 | skip: the alternative would restart your round when a Colemak player steers down |

## 2. Rules, fairness and AI

| # | Sev | Issue | Where | Plan |
|---|---|---|---|---|
| R1 | medium | **The AIs see woodpecker holes instantly** (everything else they see is 2-3 ticks old), **and the woodpecker often pecks the cell right in front of a moving head**: 45 times in 67 sudden-death rounds. A person gets at most one tick (90 ms) of warning; Drab dodged the same hole 200 times out of 200. | engine.js:255, 215 | fix: the woodpecker never pecks within 3 cells of a head (it comes back later), and the AIs see holes with the same delay as everything else |
| R2 | medium | **When every move looks blocked, the AI picks at random, including certain death**, even when one cell is "blocked" only by a rival's tail that has already moved on. 8.8% of AI deaths are these coin flips, most into a wall or its own body: the deaths that look dumbest. | ai.js:827 | fix: a wall, hole or own body is certain death; a rival's old position is only maybe |
| R3 | low | Two heads swapping cells is reported as "ran into", not a head-on (31% of head-ons). | engine.js:335 | fix |
| R4 | low | A person named "wall", "self" or "hunger" turns their kills into walls, self-bites or starvation (title, flavour, stats). | engine.js:337 | fix: reserve those names |
| R5 | low | The woodpecker silently deletes a beetle (or an apple) under its beak. | engine.js:224 | fix: it pecks around food |
| R6 | low | A snake starving this tick dies even as its head reaches an apple. | engine.js:284 | fix: reaching food in time saves you |
| R7 | low | The AI's model of a mushroom ignores pending growth. | ai.js:796 | fix |
| R8 | low | ai.js hard-codes growth, shrink, minimum length and a 10 s hunger window instead of reading tuning.js (which loads after it). | ai.js:584-604 | fix |
| R9 | low | Gobbler wins about 11% of rounds, below the 13-40% DESIGN.md promises. | DESIGN.md:133 | re-measure after R1/R2, then retune or correct the doc |

## 3. Visuals

| # | Sev | Issue | Where | Plan |
|---|---|---|---|---|
| V2 | medium | **The freeze-frame doesn't show your snake or what you hit**: it has already turned into meat. | render.js:1301 | fix: the dying snake holds its pose (eyes shut tight) through the freeze, then bursts |
| V3 | medium | **Bends cut their corner mid-tick and square it again on the tick**, so every bend pulses 8 times a second; most visible on your outline. | render.js:634, 759 | fix: bands go through the corner cell |
| V4 | medium | **Mason's bricks flip every tick**: the pattern follows the board, not the skin. | render.js:664 | fix |
| V5 | medium | **Short landscape phones hide Play and Host** (568×320: the start card hides 231 px), and the header overflows. | style.css:586 | fix: compact cards with the buttons always in view |
| V6 | medium | **Laptops get a small board**: 440 px at 1280×720, with the header wrapping and 800 px of empty width. (Also found by the accessibility reviewer at 1280×560.) | style.css:51 | fix: side by side on wide, short screens |
| V7 | med-low | On 320 px phones "Hall of Fame" wraps to three lines, Score and Best stack, and the death card hides Play again. | style.css | fix: a trophy icon button on small screens |
| V8 | med-low | The woodpecker is blurry (cached at 1×, drawn 1.4× larger) and reads as a black bean. | render.js:256, 1296 | fix: redrawn at size, with a red crest and a white cheek |
| V9 | low | Every food sprite is slightly resampled (sprite size rounded up, drawn at fractional pixels). | render.js:170 | fix |
| V10 | med-low | Banners cover the top 2-4 rows; the woodpecker banner hides the holes it announces. | style.css:395 | fix: banners fade out of the way when a head is beneath |
| V11 | med-low | Chinese bubbles are clipped at the board edge (their width is estimated for Latin text). | chatter.js:473 | fix |
| V12 | low | A bubble always sits above the head, covering the path of a snake heading up. | chatter.js:475 | fix: away from the way it's heading |
| V13 | low | Colonist's white X on every segment reads as a stack of "close" icons. | render.js:671 | fix: a bandolier stripe |
| V14 | low | Dark bodies get a rim on every segment (strings of beads); your outline ignores the taper. | render.js:620, 682 | fix |
| V15 | low | With reduced motion a dying snake just vanishes. | render.js:350 | fix: it fades |
| V16 | low | At the bite, the burst and the "+1" cover the face, right when it gulps; "+1" is clipped on the top row. | render.js:1324, 397 | fix |
| V17 | low | Catchlights turn with the head; every other highlight is lit from the top left. | render.js:872 | fix |
| V18 | low | Each snake's shadow falls on the snakes drawn before it. | render.js:1301 | fix: all shadows first |
| V19 | low | Eyes turn 2.4× faster at 144 Hz than at 60 Hz. | render.js:534 | fix |
| V20 | low | Palette drift on the canvas and page: several golds and near-whites, radii off the 6/10/16/20 scale. | render.js:18, style.css | adapt: radii and bubble colours fixed; pupils stay near-black (they need the contrast) |
| V21 | low | Lobby: the room-code placeholder is clipped, an empty status line and hidden tags leave gaps. | style.css:369 | fix |
| V22 | low | Grid lines are 1 device pixel: nearly invisible on 3× phones. | render.js:111 | fix |
| V24 | low | Creeper's and Ghost's faded tails are hard to see (about 1.4:1 and 2:1), and they kill on contact. (Also found by the accessibility reviewer.) | render.js:564 | fix: a floor on the fade |
| O2 | low | The score's pop spreads into its label: "Score15". | style.css:148 | fix |

## 4. Copy

| # | Sev | Issue | Where | Plan |
|---|---|---|---|---|
| T1 | medium | **The narrator talks to "you" in rounds you're only watching**: "Off you go!", "Catch it if you can!", and screen readers hear "The AIs are off." | snake.js:46, 59, 349 | fix |
| T2 | medium | The start card says "Enter starts over"; the hints mix grammar ("H for the Hall of Fame"); the touch hint starts "tap" in lowercase. | snake.js:42 | fix |
| T3 | medium | The death card's "Watch" vs online "Keep watching" for the same action; bare "Watch" reads like "Watch AIs". | snake.js:381 | fix: "Keep watching" |
| T4 | medium | Screen readers hear "Bonk!. You hit the wall dot 4th place dot score 2 The tree goes on." (and the card twice). (Also found by the accessibility reviewer.) | snake.js:563 | fix |
| T5 | medium | Kill and win lines repeat the chatter word for word (Desperado's "Draw, partner", Metagamer's "As calculated.", Joker's "Gotcha!"). | ai.js:163, 183, 194 | fix |
| T6 | medium | A draw says "You finished 1st" under "Draw / Nobody made it out." | snake.js:398 | fix: "You shared 1st" |
| T7 | medium | Curly and straight apostrophes are mixed across the game. | all | fix (the Chinese table is keyed by the English, so lookups normalise quotes) |
| T8-T17 | low | "That was your own tail" (it almost never is), Mason's line for a head-on, the Life of Brian payoff too long to bubble on phones, "First blood: You…", nemesis "Yourself / Starvation", records wording, "best" meaning two things, too many exclamation marks, Wildcard praising an "apple" while eating meat, voice slips. | snake.js, ai.js, chatter.js, records.js | fix |
| T18-T21 | low | Online copy: friends missing from the roll-call, "the host's room" placeholder, "Room closed" for a dropped connection, long network errors, the woodpecker banner. | snake.js, net.js | fix |
| T22-T29 | low | The pause card's widow and fragment, thin rotations (two lines each), the win card saying it three times, blurbs unreachable on phones, repeated phrases, giggles from Ghost, README drift, the start card's title repeating the header. | various | fix |

## 5. Performance

| # | Sev | Issue | Where | Plan |
|---|---|---|---|---|
| P1 | **high** | **Snake bodies are bound by GPU raster**: 6.5 ms a frame for 4 × 70 segments (see the baseline). Bands interleaved with circles break batching; shadow, highlight and brick paths are many-contour paths. The reviewer measured a fix at 2.85 ms (−57%) with 0.17% of pixels changed. | render.js:596-705 | fix: bands first as rectangles, then all circles; separate circles for shadows and highlights; bricks as rectangles |
| P2 | medium | AI decisions sometimes land in a frame with other work: worst 8.5-20 ms, mostly the first decision of a round (JIT warm-up). | snake.js:170, ai.js | fix: no thinking in a frame that just ticked; warm every rival's brain on the start card |
| P3 | medium | The hunger bars' CSS transition forces a style recalc and pre-paint on every frame (−28% main-thread work without it). | style.css:207 | fix |
| P4 | medium | The per-segment colour lookup builds strings every frame: half of render script time, 5.7 MB/s of garbage in the long scene. | render.js:553 | fix: a cached colour ramp per snake |
| P5 | low-med | Bite, death and card frames stack work: a forced reflow for the score pop, "+1" text drawn per frame, `focus()` layout. | snake.js:508, render.js:394 | fix |
| P6 | low | The "starving" rumble animates box-shadow, repainting the tags every frame. | style.css:210 | fix |
| P7 | low | Speech bubbles write two inline styles every frame. | chatter.js:466 | fix: only on change |
| P8 | low | Other per-frame allocations (closures, array literals, sprite-key strings). | render.js | fix |
| P9 | low | Idle screens keep the animation loop running for the music clock (0.1 ms a frame, GPU idle). | snake.js:135 | skip: nothing is drawn; the cost is negligible and one clock is simpler |
| P10 | low | The static layer is built twice at startup and on every resize event. | render.js:1365 | fix |
| P11 | low | A friend's screen deletes keys on AI memory every tick (slow objects for the renderer). | online.js:119 | fix |

## 6. Accessibility, layout and craft

| # | Sev | Issue | Where | Plan |
|---|---|---|---|---|
| A1 | medium | **On short boards the card's Play button is hidden below a scroll, with keyboard focus on it** (1280×560 window, 200% zoom, landscape phones, the 320 px death card). | style.css:274 | fix: the buttons always stay in view (with V5) |
| A3 | medium | On landscape phones the board covers the Hall of Fame button. | style.css:146 | fix |
| A4 | medium | Windows High Contrast: the icons disappear and the text fields lose their edges and focus ring. | style.css:114, 343 | fix |
| A5 | medium | Contrast below AA: lobby errors 4.10:1, the pressed speed button 4.24, dead tags 4.44, faded chat names 4.25, placeholders 4.24, hover states 4.25 and 3.62, input edges 1.2:1. | style.css | fix |
| A6 | medium | Online, seats 3 and 4 (lavender and sky) are nearly identical with deuteranopia, and friends share a face and outline. | online.js:23 | fix: each friend's snake gets its own marking |
| A8 | low | Announcements are lost while the Hall of Fame is open (the announcer is inside the inert main). | index.html:104 | fix |
| A9 | low | (see V6) | | |
| A10 | low | Horizontal scrolling at 400% zoom. | style.css:606 | fix |
| A11 | low | Touch targets under 44 px (Play 40, "Play with friends" 28, Reset 27, inputs 36). | style.css | fix |
| A12 | low | On phones the page scrolls during play (82 px at 320×568) and a swipe on the frame or the tags scrolls the board away. | style.css | fix: the board fits the first screen, and swipes work anywhere during play |
| A14 | low | Visible labels missing from accessible names ("Carve your name:", "Have a code?", the "On" switch). | index.html:56, 71, 98 | fix |
| A15 | low | No focus ring on load, so the first Tab silently skips Play. | snake.js:569 | fix |
| A16 | low | The 3× density cap blurs 3.5× phones. | render.js:1365 | fix: cap the canvas size, not the density |
| A17 | low | Bubbles duplicate the log for screen readers; the canvas has no `role="img"`; tags read as "Sniper 3"; the "this round" row has no non-visual marker. | various | fix |
| A20 | low | No bottom safe-area padding on notched phones. | style.css:44 | fix |

## 7. Robustness and code health

| # | Sev | Issue | Where | Plan |
|---|---|---|---|---|
| B1 | **high** | **Online rooms break after about seven joins.** Every friend who joins (or rejoins after a reload) appends their Hall of Fame rows to a list the host re-sends in full. Past 16 KB, PeerJS refuses the message with an error, which the host treats as every friend leaving at once; nobody can join that room again. Reproduced end to end with two browsers. | snake.js:1015, net.js:88 | fix: one set of rows per person, replaced on rejoin and removed on leave; oversize messages never drop anyone; a size check in the protocol test |
| B2 | medium | One friend's row with an impossible date breaks your Hall of Fame for good, and spreads to everyone in the room. | records.js:35, 214 | fix |
| B3 | medium | Colours from the network go into a `style` string, so a modified client can inject CSS into your saved Hall of Fame. | records.js:203 | fix: only `#rrggbb` |
| B4 | medium | Hosting and joining can hang forever, and Back then leaves Play disabled. | snake.js:956, net.js:26 | fix: time limits, and Play is re-enabled |
| B5 | low | Names like "constructor" corrupt your stats. | records.js:65 | fix |
| B6 | low | Guests don't check the shape of the host's messages. | online.js:101 | fix |
| B7 | low | Connections that never said hello still get every broadcast; round-trip samples aren't checked. | net.js:75, 85 | fix |
| B8 | low | A modified client can claim your player id and swallow your result. DESIGN.md calls the id private; it isn't. | records.js:165 | fix |
| B9 | low | Names with `$'` or `` $` `` mangle chatter lines. | chatter.js:439 | fix |
| B10 | low | Names keep control and bidi characters; the 16-character cut can split an emoji. | online.js:33 | fix: one shared name cleaner |
| B11 | low | Stored values aren't range-checked ("−2 rounds", "1.5th place"). | records.js | fix |
| B12 | low | Browsers too old for the code show a dead Play button. | index.html | fix: a one-line message |
| B13 | low | Numbers that shape play live outside tuning.js. (With R8.) | various | fix |
| B14-B16 | low | Dead code, misleading comments ("nothing allocates"), duplicated logic. | various | fix |
| B17 | low | Inconsistent naming (storage keys, `pellet` vs meat). | various | skip: renaming storage keys would orphan saved records; the rest is cosmetic |
| B18 | low | snake.js is 1,350 lines; `drawFace` and `decide()` are long. | | skip: a big move with no player-visible change; noted for later |
| B19 | low | Tests: the simulator asserts nothing, the protocol test never checks sizes or hostile input. | tools/ | fix: assertions, size and hostile-input checks, one runner |

## 8. Found while playing

| # | Sev | Issue | Where | Plan |
|---|---|---|---|---|
| O1 | medium | **The death card says "Hall of Fame #1", then the round-over card says "#3"** for the same round: the rivals who outlast you are saved at the end of the round. (Also found by the accessibility reviewer.) | snake.js:424, 550 | fix: the death card already counts the snakes still alive |

---

## Already good, keep

- **The loop:** one rAF fixed-timestep loop with the remainder carried, sane after stalls, AI thinking paced across frames with identical decisions (fingerprint-checked).
- **The rules:** order-independent collisions, tail-leaving legal, food never on a body (30k ticks checked), 4-fold symmetric spawns, rounds always end, no `isPlayer` anywhere in the AI.
- **Input:** a 3-deep queue with no reversal path (including the host's delayed turns and autopilot hand-back), physical WASD, name fields never hijacked.
- **The faces:** each rival has a distinct silhouette, gaze shows intent, and the shared blink, chew and gulp work.
- **Crispness:** the canvas matches device pixels exactly at every common density, the bark and grid are prerendered on whole pixels.
- **Accessibility:** focus rings everywhere at about 13:1, a proper modal Hall of Fame, one polite status region, `zh-Hans` on Chinese lines, reduced motion covered in CSS and canvas.
- **Robustness:** every storage access wrapped; the game plays with storage blocked, full or corrupt and with Web Audio missing; nothing from storage or the network reaches the DOM as HTML; the loop survives exceptions; all three tools pass.
- **Copy:** the voice holds; many lines are genuinely funny ("The tree goes on. You don't.", "Veni, vidi, Mason.", the whole Biggus Dickus chain).
