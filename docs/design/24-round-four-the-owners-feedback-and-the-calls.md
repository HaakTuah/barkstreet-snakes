## Round four: the owner's feedback, and the calls

After the third pass the owner played and sent a list: the controls feel delayed, the powers should be two presses, a flash for everyone, holes under bodies, holes that look better, borders instead of force fields, rivals that use their powers, a food economy that's too rich in the middle and too thin at the end, and a check that everything promised is actually in. Seven investigators measured each area first (headless Chrome with real key and touch events, and instrumented copies of the simulator, hundreds of seeded rounds a variant). These are the calls, each with the reason, as built. Numbers marked *measured* come from those runs; where the build went another way than the call, it says so and why. The build's own numbers are in "Round four, measured".

### Two powers, two presses

Its rules are in `40-powers-and-moves.md` under the same name, and its text as it was, with what was measured, in
`docs/archive/design-powers.md`.

### A flash for everyone

Its rules are in `40-powers-and-moves.md` under the same name, and its text as it was, with what was measured, in
`docs/archive/design-powers.md`.

### Holding more than one

Its rules are in `40-powers-and-moves.md` under the same name, and its text as it was in `docs/archive/design-powers.md`.

### Telling powers apart

Its rules are in `03-the-snake-as-a-character.md` under the same name, and its text as it was in
`docs/archive/design-looks.md`.

### The woodpecker: holes under you, and holes that look like holes

Its rules are in `38-the-woodpecker.md` ("The strike", "Fewer, bigger hollows", "The pits and the mark" and "The rivals tell a
mark from a hole"), and its text as it was, with its measurements, in `docs/archive/design-woodpecker.md`.

### Food

The rules this section settled are in `04-food-and-the-world.md` ("Food on the log"), and its text as it was, with
its measurements, in `docs/archive/design-food.md`.

### Rivals

Its rules are in `39-the-rivals.md` ("A starving rival takes its chances", "Rivals use their powers, when it pays",
"Mushrooms, to a rival", "The board split" and "Mason builds double walls"), and its text as it was, with its
measurements, in `docs/archive/design-rivals.md`.

### Borders, not force fields

Sovereign's realm and Colonist's colonies are drawn as **borders on a map**, like a grand strategy game, not as domes:
- the land, cell-exact, under a light wash in the owner's colour;
- a band and a riband of colour along the inside of a true ink line (`#1c1209`), its corners rounded, with a parchment keyline just inside the ink (no line along the board's edge or round a hole). The keyline came with the critique: without it, Colonist's rose went grey-khaki to colour-blind eyes, its ink no darker than the bark's grain;
- where two claims meet, a line dashed in both colours over true ink, and hatching on land both claim;
- land that grows a ring of cells at a time as a realm widens, and shrinks back into its capital when its owner dies;
- a border that flares as it changes and when lightning strikes, breathes while a rival's head is on it, and lights up from where a head crosses in;
- a rival on the land wearing the land's colour round its pieces on the land's own cells (where two claim it, the later realm's colour), with a parchment keyline outside it, so it shows round a red body too (an ink ring outside that as well took a third fill pass, and put the land over its budget);
- Sovereign's capital marked with a swallow-tailed banner in parchment and ink, its crown inked, trimmed in the realm's colour (a blue banner vanished into the blue wash), and Colonist's flags on inked poles with parchment knobs. No gold: gold means power.

*As built*, the contested dashes stand still. Marching, their many short pieces cost about as much as all the rest of the land together, so they're cached in one small layer. The optional light sweep across the land was left out.

The land rule becomes one rule everywhere (the AI, the chatter, the HUD and the borders): a cell is land if its centre is within radius + `LAND_REACH` (0.5) of a field's centre. That removes the one-cell nubs the old radius + 1 left at the four tips. Snow lies on land like anywhere else, tinted by it. The domes' weather effects go, except a flare when lightning strikes. Crossing a border sounds like a muffled drum knock with a fife note, not an electric hum.

*Why:* the domes cost about 3.3 ms a frame in a real round (2.6 times the same board without them). *Measured* as built, the staged scene with both owners' land costs 1.28–1.40 times the same board without it (the domes 2.26–2.62), and their canvases hold 5.2 MB instead of 23.9. They read better at phone size.

### Events and timings

- **Weather comes from a shuffled bag:** every kind before any repeats. *Measured*, 42% of rounds saw no storm, and half saw three kinds or fewer. `WEATHER_ODDS` now counts how many of each kind go in the bag: one each, since two of a kind could repeat before the others came. A storm drawn before 0:30, or snow before 0:45, waits in the bag.
- **A lightning fire has a budget:** at most 12 cells over its life (`FIRE_TOTAL`), besides 6 at once. Fires kept themselves going until rain came, some for over a minute.
- **More golden power food.** Golden things are worth more now that they stack and the rivals use them: leaves 0.07 → 0.25 a gust, golden mushrooms 0.12 → 0.55 a rain spell (at 0.4 the wrap still missed most rounds), golden beetles 0.3 → 0.4 (0.16 since round six A, with beetles out more often).
- **Unchanged, because measured right:** the woodpecker at 2:00, and the 120 → 90 ms speed ramp.
- **Changed once the rest was built:** the woodpecker's patches; their sizes now are in `38-the-woodpecker.md` ("How it picks a
  patch"), and this call as it was, with its measurements, in `docs/archive/design-woodpecker.md`.

### Controls that keep up

*Measured*, the delay wasn't lost input. The board was drawn one tick in the past, so the moment your head was drawn reaching a cell was the moment its turn window closed. A press made when you saw the head arrive was late 77–88% of the time. The AI looked swift because it decides on the tick, against its own exact position.

- **The board is drawn ahead:** 60 ms (`DRAW_LEAD_MS`), but never more than half a tick (`DRAW_LEAD_MAX` 0.5): half a tick at 120 ms ticks (60 ms), and half a tick at full speed (45 ms). The cell your head is drawn in is the cell your press turns at, at every speed. (It was built as half a tick, as first called. The merge made it 60 ms at full speed too, more than half a tick there, to cover a press made as the head is seen to arrive. But then, late in a tick at full speed, your head was drawn in the next cell while a press still turned it at this one, and it was pulled back: 22 of 160 random presses, as the critique measured. So it's at most half a tick again.) *Measured* with real keys on a virtual 60 Hz clock, half a tick ahead: on-time presses went from 13–21% to 72–88% at 120 ms ticks, and from 12–26% to 60–73% at 90 ms. It changes the drawing only, never a rule:
  - rivals' next step comes from the plans they've already made, and they make them before the board is drawn into their next move: in the frames after the tick, up to the one that draws the next move, one decision a frame and at most two, never in the frame that ticked unless none is left (*measured* after the critique: no decision in a tick frame, at 1× or 4×; playing, a frame's thinking and stepping take 2.0 / 3.0 ms at p95 / p99, from 2.7 / 4.0, when the lead had packed every decision into the tick's frame);
  - a head about to crash holds at its cell centre instead of overshooting (fire isn't a crash, so a head heading into fire doesn't hold);
  - a guess that turns out wrong (a plan made late, a press in the second half of a tick) eases to the right place, never faster than a snake moves;
  - a flash, plain or golden, that's sure to go is drawn ahead too: from when the head is drawn past its cell's centre (before its tick) it's where the flash takes it, streak and all, and at the tick it glides on from a cell back along its body, never standing still. A flash guessed but not taken eases back like any wrong guess. A flash used to snap 1.5–2.5 cells at its tick and then stand still for 3 frames. *Measured* on the final build while playing, on a virtual 60 Hz clock (an autopilot steering, E pressed at random moments, golden flashes handed out): the rivals' flashes were shown before their tick 64 times of 66 and yours 115 of 142 at 120 ms ticks, 14 of 15 and 33 of 42 at full speed. The rest were presses in a tick's last frame or two, or flashes that stopped short, and showed at their tick. `tools/render-test.js`: after the tick, an even 0.14 of a cell a frame at 120 ms ticks, 0.18 at full speed. In Watch AIs the board has no lead (see below), so a flash shows at its tick (none of 75 before it), a cell on, or two for a golden one, and glides on from there;
  - online, the host sends where everyone goes next once its rivals have thought (a rival's plan, a person's queued turn, powers asked for), and again when a press changes it; friends draw ahead from that (protocol 8; before, a friend's screen drew nearly every rival's turn half a cell the wrong way, then dragged it back);
  - the board rests at its cells before Go and once the round's over;
  - it's only while you're playing on this screen: watching alone (Watch AIs, or after your death, alone), the board is drawn on its ticks, easing there after a death.
- **Your press shows at once.** Every steering press, not only a stunned one, and online too: your eyes look and your head leans the way you pressed, and it's drawn ahead from there, before the tick takes it.
- **Your face turns quickly** (about 60 ms, `FACE_EASE_MS`). The 300 ms "steady line" stays for the rivals, whose tongues it was for. *Measured*, in swift play your face lagged 214 ms. As built, it comes within 45° of the new way 53 ms after the press (180 ms before, on the same test).
- **Chained swipes are lighter.** A finger already swiping chains turns at 8 px (a new touch still needs 12, to tell it from a tap). The anchor keeps up with the finger while it goes the way it registered, so a turn counts from where the finger turns (*measured*, about 19 ms after the corner at 0.6 px/ms). A turn's way must be half again the other (`SWIPE_AXIS` 1.5), so a diagonal waits until it's clearly one way, or (since the critique) until the finger has gone twice the swipe's distance (`SWIPE_SURE` 2), when its main way counts: a long stroke 35–45° off the axis used to wait forever.

### What was promised and missing

The completeness audit went through every request across three sessions. About 100 items were done. These were promised and not built, and are built now:
- rivals planning with their powers;
- the board-split fix;
- the trappers' thicker walls;
- lines for being put out by rain, for ash and for rot, and Sovereign and Colonist complaining when rot ruins their land (see "Lines and announcements");
- a steering hint beside the YOU arrow: "Swipe to steer" or "Arrows or WASD to steer" ("Arrow keys to steer (or WASD)" since round six A), riding with your head until you steer (a banner moves aside for it), on whichever side of YOU is clear of the rivals' speech bubbles (since the critique: it used to sit on top of one).

Things an expert would expect, added:
- a **Field guide** beside Hall of Fame and Your story: every food and power, with its picture and a one-line rule, and the keys for each power. Since the critique it also shows how a held power looks (a snake in gold with a sky pip and an ember diamond: "Golden powers") and your two rests ("Resting"), and its mushroom sits on bark in its purple haze (its cream stem vanished on the card). A screen reader hears each row's name, a pause, then its rule. On phones (440 px or narrower) the Hall of Fame tab is a trophy, so three tabs fit 320 px; "Clear everything" hides on the guide;
- powers you can tell apart (above);
- beads that rot (above);
- a stop to eating back your own crash;
- new lessons: "Your own tail won't feed you.", "Pecking under you! Only your head can fall in.", the flash's key, and the round's news "The last apples are falling."

Docs that contradicted the game are corrected: the holes were said to be trenches, the power marks were described from before the third pass, the "rare" golden apple came 5 times a round, and Joker's mushroom habit was missing. The critique found that the older sections still described the game before round four (force fields, Space naps, pressing ahead to leap, a woodpecker that cuts); they're brought up to it now, each older call kept and marked as superseded.

### Online

Protocol 7, and 8 after the critique:
- presses are three messages: a key's turn (`{t:'turn'}`, it only steers), a fresh swipe (`{t:'swipe'}`: the host decides whether it's "ahead", against its own queue, which a friend can't see) and a power (`{t:'pow'}`, jump or flash);
- each snake's flash rest and flash request, and plain flashes;
- beads' owner, and eating your own;
- holes under bodies;
- rot, saying whether it was an apple or a bead (and the bead's colour);
- the trickle of last apples, and where the first fell;
- whether a rival is desperate (the chatter voices it);
- (8) where everyone goes next, from the host once its rivals have thought and again when a press changes it: `{t:'plan', k, s: [[way, jump, flash], …]}`, so a friend's screen draws everyone ahead the way they're really going;
- (8) `'unleap'` among a friend's `{t:'pow'}` kinds: a jump a finger held still asked for, taken back (it turned out to be a swipe);
- (8) each snake's `mealMs`, how long its last meal keeps it, for the hunger bar.

