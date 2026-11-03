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

Its rules are in `42-controls.md` under the same name (its chained swipes under "Touch precision" there), and
its text as it was, with what was measured, in `docs/archive/design-page.md`.

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

Protocol 7 and 8's messages: what each move and thing on the log sends now is in its topic file's "Online"
(`40-powers-and-moves.md`, `41-crashes.md`, `04-food-and-the-world.md`), the general rules and the plan message in
`22-play-with-friends-online.md`, and this section as it was in `docs/archive/design-online.md`.
