# Audit: Bark & Bite before the polish pass

Baseline: `main` at `febd1c3` (after PR #3: hunger, Desperado, smooth movement).

## How this audit was done

- **Read in full:** every file (`index.html`, `style.css`, `ai.js`, `snake.js`, `chatter.js`, `records.js`, `README.md`).
- **Played in the browser:** the game was played in the built-in browser pane, at 800×800 and on an emulated 375×812 phone. "Before" screenshots of every state are in `docs/screenshots/before/`.
- **Seven independent reviewers:** each read the whole codebase through one lens: loop and input, rules, visuals, copy, performance, accessibility and layout, and robustness.
- **One skeptic per finding:** every finding was then handed to a separate reviewer told to *refute* it against the code. 121 findings were raised, **98 were confirmed** (some with corrected severity) and **23 were refuted** and dropped.
- **Your own reports from playing on desktop and phone** are folded in and marked **[reported]**.

Severity: **high** means it breaks play, **medium** is a clear defect or a real cost, **low** is polish.

---

## Baseline performance

Measured in the browser pane on this laptop, timing the real functions with `performance.now()`. The pane runs hidden, which pauses `requestAnimationFrame`, so frame times were measured by calling the frame work directly. That is script plus canvas time, the part we control.

| Measurement | median | p95 | worst |
|---|---|---|---|
| `draw()`: long-snake scene (4 × 70 segments, 40 meat, 60 holes), 500 frames | 0.6 ms | 1.8 ms | 1164 ms¹ |
| `step()`: one simulation tick **including all AI decisions**, 2,454 ticks over 3 AI-only rounds | 2.5 ms | 5.8 ms | 17.3 ms |
| `step()` on ticks where a snake dies (meat conversion and chatter) | 1.8 ms | 5.1 ms | 5.1 ms |

- **46 of 2,454 ticks (1.9%) exceed a 144 Hz frame (6.94 ms) on their own, and 1 exceeds a 60 Hz frame.** A tick runs all three AIs back to back inside one timer callback, so the frame that contains it absorbs the full cost. On fast screens this is the main stutter risk.
- **The AI search spends about 86% of its time in the Voronoi flood** in `evaluate()`. That loop calls a closure for every cell and allocates new level arrays (perf reviewer, confirmed).
- Drawing itself is cheap, but each frame allocates garbage: color strings from `mix()`, `pts` arrays, closures in `drawFace()`, one radial gradient per hole per frame, and per-segment `save/clip/restore` for Mason.

¹ There are rare long outliers on all `draw()` timings in the hidden pane. They look environmental (canvas flushes while the window is hidden). The "after" numbers are measured the same way so the comparison is fair, and medians and p95 are the meaningful figures.

---

## 1. Bugs and edge cases

| # | Sev | Issue | Where |
|---|---|---|---|
| B1 | high | **[reported] Swiping down on a phone refreshes the page.** The CSS restyle changed `body { touch-action: none }` to `manipulation`, the canvas sets no `touch-action`, and nothing calls `preventDefault`, so vertical swipes pan the page and trigger pull-to-refresh. | style.css:34, snake.js:1363 |
| B2 | medium | **[reported] Restart during an AI-only round starts a round with you in it.** Enter/R always calls `start()` with a player. Your unsteered snake drives into the wall a few seconds later ("Squashed!"). | snake.js keydown |
| B3 | medium | **A wall crash can kill an innocent snake.** Off-board heads are keyed with `y*GRID+x`, so (-1, 5) aliases a real cell and a snake legitimately moving there "crashes head-on". | snake.js:209 |
| B4 | medium | **Enter/Space on a focused overlay button is hijacked by the global key handler.** Enter on "Resume" throws the round away; Watch, speed, Hall of Fame and the chatter toggle can't be used from the keyboard. | snake.js:1348 |
| B5 | medium | **Typing a name on the end screen triggers game keys.** Focus jumps to Play, and the overlay re-renders over the half-typed name at round end. | snake.js:560-563 |
| B6 | medium | **No auto-pause when the tab is hidden or the window loses focus.** setTimeout keeps ticking (throttled), so your snake dies unattended and the unattended death is recorded. | — |
| B7 | low | **"New high score: #2!" for a 0-food, 4th-place crash.** Almost every early round triggers it, and the round-over screen repeats it. | snake.js:559, records.js:51 |
| B8 | low | **"You bit itself"** on the death screen and in the first-blood banner. Also **"It's down to You and Hunter."** with a capital You mid-sentence. | snake.js:225, 459 |
| B9 | low | **[reported] Mason says "Et tu, you?"** when a wall, hole or hunger killed him: `{who}` falls back to "you". Lines like "I see you, you." have the same problem when you're the target. | chatter.js:371 |
| B10 | low | **[reported] AI-only rounds never reach the Hall of Fame.** This was a deliberate choice, but you'd like watched rounds to count. | snake.js finishSnake |
| B11 | low | **"Reset scores & stats" leaves the header's Best in place.** | snake.js:1321 |
| B12 | low | **Opening the Hall of Fame during an AI-only countdown hides the speed control** for the whole round. | snake.js:1289 |
| B13 | low | **A death on the woodpecker's first tick swallows "first blood"**, so the next death is announced as first blood. | snake.js:452 |
| B14 | low | **Restarting mid-round keeps the AI entries already recorded** but drops yours. | snake.js:376 |
| B15 | low | **The final frame of a round draws snakes one cell behind**, and paused frames freeze mid-glide. | snake.js:428 |
| B16 | low | **Valid JSON in the wrong shape in storage can stop the loop at the first death** (an exception inside `tick()` before `schedule()`), and Reset becomes unreachable. | records.js:22 |
| B17 | low | **The README debug example crashes** because the `'warden'` persona no longer exists, and `createGame` doesn't validate persona keys. | README.md:78 |
| B18 | low | **Board full:** food just stops spawning (no crash). With four snakes on 576 cells this practically can't happen, so there's no win state for it. | snake.js fillFood |

## 2. Controls and feel

| # | Sev | Issue |
|---|---|---|
| C1 | medium | **Ticks drift by their own cost.** `schedule()` re-arms *after* the AI work, so the glide stalls at every cell boundary, and "4×" actually runs at about 3.4×. Interpolation uses the post-work time. |
| C2 | medium | **[reported] Swipes only register on touchend**, can't be chained within one touch, mix up fingers with multi-touch, and use a fixed 20 px threshold that doesn't scale with the board. |
| C3 | low | **Touch devices have no way to pause** (or restart mid-round). |
| C4 | low | **Key auto-repeat isn't filtered:** holding Space, Enter or H cycles state at about 30 Hz and rerolls opponents. |
| C5 | low | **Ctrl/Cmd/Alt shortcuts are swallowed by the game.** |
| C6 | low | **WASD is matched by `e.key`, so AZERTY players get awkward keys.** (`e.code` fixes it.) |
| C7 | low | **Eaten food and new holes disappear a tick before the gliding snake reaches them.** |
| C8 | low | **The first moves have no extra forgiveness** beyond the countdown and corner spawns. |
| C9 | low | **Some cosmetic animations step at tick rate**, not frame rate: the woodpecker bob, the Capricious ring and speech bubbles. |

## 3. Visuals

| # | Sev | Issue |
|---|---|---|
| V1 | medium | **The canvas is a fixed 768×768 bitmap with no devicePixelRatio handling**, so it is resampled (soft, uneven grid lines) on almost every screen, and nothing handles resize. |
| V2 | medium | **Speech bubbles** are opaque, cover the speaker's path, jump per tick while heads glide, detach near edges, and **stay on screen through pause and the round-over card**. |
| V3 | medium | **The overlay card overflows on phones** (screenshot `mobile-title.jpg`): Play and Watch AIs are cut off, and `focus()` scrolls the card so the title or countdown digit is hidden. |
| V4 | low | **Corner leaves reach up to 3 cells into the playfield in the apple's own green**, camouflaging apples, meat and the player (screenshots `gameplay.jpg`, `game-over.jpg`). |
| V5 | low | **Sovereign's home zone** is a blocky per-cell tint inside a round ring, nearly invisible at 8%, and the trespass rule triggers a cell beyond both. |
| V6 | low | **Toasts are never cleared between rounds** (a stale "First blood" sat on the title screen), sit above the overlay card, and wrap at half the board width because of the shrink-to-fit trap. |
| V7 | low | **The speed control stays visible on the start screen and during the countdown** after a watched round. |
| V8 | low | **Low contrast against the bark:** Hunter's stripes, Joker's purple and the meat drumsticks are at about 1.1-1.6:1. |
| V9 | low | **Joker's green body segments read as the player's green** (screenshot `gameplay.jpg`). The player has no marker that isn't a colour. |
| V10 | low | **The woodpecker covers about 1×2 playable cells** and draws on top of snakes and food. |
| V11 | low | **Capricious looks exactly like whatever it is imitating**, so you lose track of which snake it is. |
| V12 | low | **Copycat's ears turn grey while copying.** |
| V13 | low | **The `.board` inner vignette never renders**, because the opaque canvas covers it. |
| V14 | low | **The fixed 12 px board radius clips corner cells on phones.** |
| V15 | low | **`button:active` gives tabs and the close button a green lip and a 2 px jump.** |
| V16 | low | **The same snake appears in different colours** across the scoreboard, bubbles, log, Hall of Fame and stats. |

## 4. Copy

| # | Sev | Issue |
|---|---|---|
| T1 | low | **The high-score moment is flat and fires too often** ("New high score: #5!" in plain green). It should mean something and sound like the game. |
| T2 | low | **Control hints are keyboard-only on touch devices**, and the pause text tells phone players to press Space. |
| T3 | low | **The start card is too long for a phone:** a duplicate title, plus blurbs with tacked-on tags ("Party member.", "Yeehaw.", "Great hair."). |
| T4 | low | **AI win lines repeat the title** ("Hunter wins" / "Hunter wins. Nobody was safe."), and the article use is inconsistent ("The Joker"). |
| T5 | low | **Some kill lines contradict the cause on the same card** (Gobbler "bumped into you" after a head-on). |
| T6 | low | **Long chatter lines cover about 10% of a phone board.** |
| T7 | low | **Four names for two measures:** Score, Best, Food and "high score". |
| T8 | low | **"Shrunk by 3."** can overstate the real shrink, which stops at length 3. |
| T9 | low | **[reported] Mason should speak only phony Latin**, with "Vidi, vici, veni" and a Life of Brian "Romanes eunt domus" moment. |
| T10 | low | **The README has drifted from the UI:** button names, colours, the debug example and "timid" vs "evasive". |

## 5. Performance

| # | Sev | Issue |
|---|---|---|
| P1 | medium | **All AI thinking happens inside the one frame that contains the tick:** p95 5.8 ms, worst 17.3 ms (see the baseline). |
| P2 | medium | **The Voronoi BFS uses per-cell closure calls and allocates a new array for every BFS level**, and the search spreads `[{...}, ...body]` at every node. |
| P3 | low | **The static layers are repainted every frame:** grid lines, and holes with one new radial gradient each. |
| P4 | low | **Per-frame allocation:** `mix()` colour strings, `pts` arrays, `drawFace` closures, Wildcard's `hsl()` strings, and Mason's `save/clip/restore` per segment. |
| P5 | low | **Redundant synchronous `draw()` in `tick()`**, even though the rAF loop draws anyway. |
| P6 | low | **DOM writes every tick even when nothing changed:** scoreboard dots, lengths and hunger bars, and bubble positions. |
| P7 | low | **Engine allocations per tick:** the `occupied`/`heads` Maps, `fillFood` rebuilding sets, and snapshot copies. These are cheap in absolute terms (the engine is about 1.3% of tick time) but avoidable. |
| P8 | low | **The Google Fonts stylesheet is render-blocking**, and the game isn't explicitly offline-safe. |

## 6. Accessibility and layout

| # | Sev | Issue |
|---|---|---|
| A1 | medium | **Primary buttons fail text contrast:** white on leaf green is 2.9:1, and the active speed button is 2.5:1. |
| A2 | medium | **Stats paint text and bars in raw persona colours on parchment**, so the nemesis name can be invisible (Ghost white). |
| A3 | low | **No `:focus-visible` styles.** |
| A4 | low | **The chatter log is an `aria-live` region that reads out every line.** Copycat's Chinese has no `lang`. |
| A5 | low | **Toasts are written into a live region while it is hidden**, and death, round-over and pause are never announced. |
| A6 | low | **The Hall of Fame dialog doesn't trap focus or restore it on close.** |
| A7 | low | **No `prefers-reduced-motion` support:** rainbow cycling, the flashing ring, the golden blink, the pop and pulse animations. |
| A8 | low | **Landscape phones overflow**, because `max(320px, 100vh - 250px)` forces a 320 px column. A 320 px portrait screen overflows the start card twice over. |
| A9 | low | **The Hall of Fame table overflows at 320 px.** |
| A10 | low | **Small tap targets on touch** (speed, tabs, close, toggles). |
| A11 | low | **The tablist roles are incomplete, and the chatter toggle's accessible name is just "On" or "Off".** |
| A12 | low | **Forced-colors (Windows High Contrast):** buttons lose their outlines, and the dots and selected states vanish. |
| A13 | low | **Secondary text on parchment-2 and dead scoreboard rows fall below 4.5:1.** |

## 7. Robustness and code health

| # | Sev | Issue |
|---|---|---|
| R1 | low | **`snake.js` is 1,500 lines** mixing engine, renderer, UI, input and debug tools. The headless simulator has to slice the engine out by string-matching a comment. |
| R2 | low | **Feel-controlling constants are scattered** across `snake.js`, `chatter.js` and the CSS. |
| R3 | low | **Dead code:** `roundRect` and the `mushrooms` counter are unused, `persona.depth` is undocumented, there's a duplicated `recordBest()`, and two owners for `logEl.hidden`. |

---

## What is already good and must be kept

- **Engine semantics:**
  - Simultaneous movement, with order-independent collisions.
  - Your tail's cell is free only when you aren't growing.
  - Swap head-ons are caught.
  - Mushrooms never shrink a snake below 3.
  - Food is picked uniformly from truly free cells.
  - The woodpecker's ring order covers every cell once and never pecks under a snake.
  - Rounds always end, because hunger plus holes guarantee it.
- **Fair AI:**
  - A shared 240 ms reaction delay.
  - No AI is told which snake is human.
  - AI state is all in game time, so pause, speed and frame rate can't change behaviour.
- **The input queue:** 3 turns, validated against the last queued direction, so rapid combos can never reverse into the neck. Turns can be queued during the countdown.
- **Art direction and identity:**
  - The bark board.
  - Parchment and wood UI.
  - Caterpillar snakes whose fades blend toward bark instead of alpha.
  - Per-persona faces and patterns.
  - The fixed-seed tree that stays the same every round.
- **Voice:**
  - Persona voices (Sovereign's royal *we*, Drab's deadpan, Ghost's ellipses, Creeper's lowercase).
  - Cause-specific death flavor.
  - The empty-state lines.
  - Copycat's complete Chinese table.
- **Robustness:**
  - Every `localStorage` access is in try/catch.
  - Stored data only ever reaches the DOM as text.
  - Bounded storage.
  - Listeners are registered once.
  - A single shared timer, guarded by state.
- **Cheap foundations:** the prerendered bark, typed-array scratch buffers in the AI with the stamp trick, no `shadowBlur`, filters or `fillText` per frame, and no layout reads in hot paths.
