## The fourth performance pass: the page's own work

**Measured first, on a simulated mid-range phone** (headless Chrome, CPU slowed 4x, a 412 px phone screen at 2.5x, a busy watched round: force fields, a ring, a storm, long snakes): drawing the board (`R.frame`) took about 2.5 ms a frame, but the browser's own work round it took more. Restyling, layerizing and painting the page came to over 3 ms a frame, and tracing it with things switched off one at a time showed why: CSS animations that couldn't run on the compositor, so the page did main-thread work every frame for them, and speech bubbles restyling as they moved.

- **The corner leaves** swayed with the `rotate` property (their `transform` mirrored them into the corners), and the page was re-layerized every frame. The mirroring is now inside each SVG, so they sway by `transform`, which the compositor runs.
- **The frame's light sweep** was a pseudo-element; it's a real element now (pseudo-element animations restyled the page every frame).
- **The leader's crown** bobs three times when it's crowned, then rests (it bobbed forever). **The title's "&"** rests during a round.
- **Speech bubbles** move their tail in 5% steps (every change restyled them).
- **The woodpecker's layer** covered the whole page; only the patch round the bird is cleared each frame, not the whole page. (*Replaced in round six A:* the layer is the board and the room round it, moved with a transform and never made again when a phone's address bar moves; see "A woodpecker you can believe".)
- (Drawing each body segment's band into its circle, as one shape, was tried and measured slower than a fast rectangle plus a circle, so it stayed as it was.)

**After, back to back with the same round, per frame:** layerizing 1.45 → 0.37 ms, painting 0.54 → 0.07 ms, restyling 1.20 → 0.63 ms, pre-paint 0.87 → 0.48 ms, commit 1.38 → 1.06 ms. With that much less of the browser's own work, the same 12 seconds fit 1755 frames instead of 1078 (63% more headroom on the main thread). Drawing the board is unchanged (about 2.5 ms a frame at 4x slower; 0.4 ms median on a desktop), and so is everything you see.

