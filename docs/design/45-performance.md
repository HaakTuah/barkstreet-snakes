## Performance

Keeping the game smooth on every device: the frame budget, the quality governor that draws less where frames drop,
what is cached, what the page's own work costs, watching at 2× and 4×, and the cost rules for a new look, as the third
pass and the fourth performance pass settled them (their text, with what was measured, is in
`docs/archive/design-performance.md`). Elsewhere: the budget's numbers (the "Frame budget" and "Honest speed" rows of
`10-feel-targets-checked-in-phase-7.md`, and "Frame cost" in the third pass's feel targets,
`11-the-third-pass-what-it-settles.md`), round four's costs as measured ("What it costs" in
`25-round-four-measured.md`), the guidelines this answers (prerendering, zero allocation, the simulation on the main
thread, nothing drawn while hidden: `34-skipped-or-adapted-guidelines.md`), the rivals' thinking spread over the
frames ("Controls that keep up" in `42-controls.md`), the rivals' thinking time ("How they think quickly" in
`39-the-rivals.md`), and a woodpecker strike's land made ahead ("A strike that doesn't stutter" in
`38-the-woodpecker.md`).

### The frame budget

The budget a frame keeps is set in the feel targets (above): script, the GPU's raster and the browser's own work
together. A frame that comes late never makes the round jump:
- **After a stall** (a busy machine, a debugger) the round moves on at most `MAX_FRAME_MS` (250 ms) in one frame
  (`tuning.js`; `onFrame` in `game/core.js`).
- **Playing alone,** it catches up at most `SOLO_CATCHUP` (1) tick a frame, so a hitch is a moment's slow-down, not a
  jump of several cells. **Online, or watching,** at most `MAX_CATCHUP` (4): there the clock is everyone's, and
  fairness to it matters more. Time owed past that is dropped, never raced through.

### A quality governor

It keeps the game playable anywhere (`govern` in `game/core.js`): if a device keeps dropping frames in a round, the
board draws less, for good (nothing raises it again until the page loads afresh).
- **Late** means longer than 1.6 times the shortest frame in the window, and over 12 ms, so 60, 120 and 144 Hz screens
  are judged alike.
- **A window** is 180 frames (about three seconds at 60 Hz). A window with over 12% of its frames late is a strike; two
  strikes running lower the quality one level (`Render.setQuality`), and the count starts again.
- **Only a round's own frames count:** a running round past its first 1.5 s, the tab visible. Benchmarks pin the
  quality, and the governor stays out (`pinQuality`).
- **The levels** (`quality` in `render/world.js`): 2 draws everything; 1 drops the canopy shadows and the second sheet
  of rain and layer of snow, and draws at most 1.5 device pixels per CSS pixel (the woodpecker's layer too, which
  is at most 2 at level 2); 0 also drops the falling leaves, at 1 device pixel per CSS pixel.

### What is cached

- **The static layer:** the bark, its soot and its pits are prerendered offscreen, once a round (the next round's
  built ahead while a card is up, so a new round's first frame doesn't rebuild the bark); a woodpecker's strike paints
  again only the box round its new holes, and a cell that burns out only its own box.
- **Sprites:** food, beads, the woodpecker, the "+1"s and the words that pop up (made before the first bite, with a
  crash's starburst), and Star's head, star and mustache, turned as they're drawn (as paths they cost the GPU too much:
  "Prerender" in `34-skipped-or-adapted-guidelines.md`).
- **Colours** come from cached ramps (Star's rainbow and Copycat's copy of it too), so a frame builds no colour
  strings; Sovereign's and Colonist's land are cached layers, made again only when the land changes.
- **The veil:** a translucent shape of overlapping pieces (every snake's shadow, a land's colour round a rival on it)
  is drawn opaque into one offscreen layer and laid on once, an even shade.

The renderer's own account, file by file, is the header of `render/core.js`.

### Keeping it smooth

What a frame or a bite costs, as the third pass settled it:
- **The corner leaves** sway as a whole, by their `transform`, which the compositor runs; their mirroring into the
  corners is inside each SVG.
- **The score and tag pops only scale** (a colour change forces a repaint).
- **Each snake's shadow** goes into the veil (above), filled once, not dozens of translucent shapes.
- **The words that pop up** are drawn before the first bite.

### The page's own work

The browser's own work round the board (restyling, layerizing, painting) can cost more than drawing it, so the page
does none it needn't every frame:
- **An animation that keeps running** runs on the compositor (`transform` and `opacity`), never by a property or a
  pseudo-element that re-layerizes or restyles the page every frame.
- **The frame's light sweep** is a real element (a pseudo-element's animation restyled the page every frame).
- **The leader's crown** bobs three times when it's crowned, then rests; **the title's "&"** rests during a round.
- **Speech bubbles** move their tail in 5% steps (every change restyles them).
- **The woodpecker's layer:** "A woodpecker you can believe" in `38-the-woodpecker.md`.

### Watching at 2× and 4×

Watching a round alone, at 2× or 4×, the board's own effects (tongues, beetles, particles, weather) run on a clock that
speeds up with it (`boardClock` in `game/core.js`); every round starts at 1×. Online there's no speed to set.

### The cost rules for a new look

- **Measure it,** script and GPU both: `tools/bench.js` (its staged scenes against their twins, and `--base` against
  the build before, alternated in one page) and `tools/trace.js` for the browser's own work. A shared machine drifts
  more than most looks cost, so only interleaved ratios count.
- **Within the budget:** a land on the board at most 1.5 times the same board without it, and the long-snake scene
  within its frame cost (the feel targets, above).
- **Nothing built per frame:** no strings, closures or arrays in a frame's path (colours from ramps); a costly shape
  is a sprite or a cached layer, as Star's look and the land are; a translucent one of many pieces goes through the
  veil.
- **Its own cost note** stays in its topic file: the weather's flames, rain and embers ("Cost." in `05-weather.md`),
  the borders' dashes (`44-realms-and-colonies.md`), Mute's colour steps and Star's mustache
  (`03-the-snake-as-a-character.md`), a crash's starburst (`41-crashes.md`) and a strike's land made ahead
  (`38-the-woodpecker.md`).
