# Performance, as it was decided: the design files' text

The performance sections as the design files had them, word for word, with what was measured. The current rules are in
`docs/design/45-performance.md`; each look's own cost stays in its topic file (the weather's "Cost." in
`docs/design/05-weather.md`, a strike's land made ahead in `docs/design/38-the-woodpecker.md`), and the rivals'
thinking time in `docs/design/39-the-rivals.md`, under "How they think quickly".

## From keeping it smooth (`06-keeping-it-smooth.md`)

Eating could drop frames on slower machines, so the third pass went after everything a frame or a bite costs. The corner leaves swayed by animating the SVG's insides, which made the page lay out and repaint on every frame; they now turn as a whole, on the compositor. The score and tag pops only scale (a colour change forces a repaint). Each snake's shadow and outline are one path, filled once, instead of dozens of shapes (an even shade, too). The words that pop up are drawn before the first bite. Over 20 s of play the main thread went from 9.5 s to 6.7 s of work, frame drawing from 3.8 s to 2.4 s, layouts from 4,711 to 720 and paints from 5,712 to 2,105. **A quality governor** keeps it playable anywhere: if a device keeps dropping frames in a round (over 12% of frames late, two windows of about three seconds running), the board draws less, for good: first no canopy shadows and at most 1.5 device pixels per CSS pixel, then 1 and no falling leaves.

Watching at 2× or 4×, the board's own effects (tongues, beetles, particles, weather) run on a clock that speeds up with it; every round starts at 1×. (Bodies were made smooth tubes here, one highlight down their length; they went back to segments later, see "The snake as a character".)

## From the fourth performance pass (`20-the-fourth-performance-pass-the-pages-own-work.md`)

**Measured first, on a simulated mid-range phone** (headless Chrome, CPU slowed 4x, a 412 px phone screen at 2.5x, a busy watched round: force fields, a ring, a storm, long snakes): drawing the board (`R.frame`) took about 2.5 ms a frame, but the browser's own work round it took more. Restyling, layerizing and painting the page came to over 3 ms a frame, and tracing it with things switched off one at a time showed why: CSS animations that couldn't run on the compositor, so the page did main-thread work every frame for them, and speech bubbles restyling as they moved.

- **The corner leaves** swayed with the `rotate` property (their `transform` mirrored them into the corners), and the page was re-layerized every frame. The mirroring is now inside each SVG, so they sway by `transform`, which the compositor runs.
- **The frame's light sweep** was a pseudo-element; it's a real element now (pseudo-element animations restyled the page every frame).
- **The leader's crown** bobs three times when it's crowned, then rests (it bobbed forever). **The title's "&"** rests during a round.
- **Speech bubbles** move their tail in 5% steps (every change restyled them).
- **The woodpecker's layer** covered the whole page; only the patch round the bird is cleared each frame, not the whole page. (*Replaced in round six A:* the layer is the board and the room round it, moved with a transform and never made again when a phone's address bar moves; see "A woodpecker you can believe".)
- (Drawing each body segment's band into its circle, as one shape, was tried and measured slower than a fast rectangle plus a circle, so it stayed as it was.)

**After, back to back with the same round, per frame:** layerizing 1.45 → 0.37 ms, painting 0.54 → 0.07 ms, restyling 1.20 → 0.63 ms, pre-paint 0.87 → 0.48 ms, commit 1.38 → 1.06 ms. With that much less of the browser's own work, the same 12 seconds fit 1755 frames instead of 1078 (63% more headroom on the main thread). Drawing the board is unchanged (about 2.5 ms a frame at 4x slower; 0.4 ms median on a desktop), and so is everything you see.
