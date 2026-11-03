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

Its rules are in `44-realms-and-colonies.md` under the same name, and its text as it was, with its measurements, in
`docs/archive/design-realms.md`.

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
- a steering hint beside the YOU arrow: its rule is in `30-teaching-by-showing.md` under "The first seconds", and
  this item as it was in `docs/archive/design-teaching.md`.

Things an expert would expect, added:
- a **Field guide** beside Hall of Fame and Your story: its rules are in `30-teaching-by-showing.md` under "The Field
  guide", and this item as it was in `docs/archive/design-teaching.md`;
- powers you can tell apart (above);
- beads that rot (above);
- a stop to eating back your own crash;
- new lessons: each lesson as it is now is in its topic file (the woodpecker's in `38-the-woodpecker.md`, the
  dash's key in `40-powers-and-moves.md`, the last apples' news in `04-food-and-the-world.md`; your own tail is
  squashed, not eaten, since round six B: `41-crashes.md`), and this item as it was in `docs/archive/design-teaching.md`.

Docs that contradicted the game are corrected: the holes were said to be trenches, the power marks were described from before the third pass, the "rare" golden apple came 5 times a round, and Joker's mushroom habit was missing. The critique found that the older sections still described the game before round four (force fields, Space naps, pressing ahead to leap, a woodpecker that cuts); they're brought up to it now, each older call kept and marked as superseded.

### Online

Protocol 7 and 8's messages: what each move and thing on the log sends now is in its topic file's "Online"
(`40-powers-and-moves.md`, `41-crashes.md`, `04-food-and-the-world.md`), the general rules and the plan message in
`22-play-with-friends-online.md`, and this section as it was in `docs/archive/design-online.md`.
