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

Its rules are in `38-the-woodpecker.md` ("The strike", "It cuts a shape", "The pits and the mark" and "The rivals tell a
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

- **Weather comes from a shuffled bag:** its rule is in `05-weather.md` ("Spells of weather"), and its text as it was,
  with its measurements, in `docs/archive/design-food.md`.
- **A lightning fire has a budget:** its rule is in `05-weather.md` ("Lightning and fire, fairly"), and its text as it
  was in `docs/archive/design-food.md`.
- **More golden power food.** Its rule is in `04-food-and-the-world.md` (in "Food on the log"), and its text as it was
  in `docs/archive/design-food.md`.
- **Unchanged, because measured right:** the woodpecker at 2:00, and the 120 → 90 ms speed ramp.
- **Changed once the rest was built:** the woodpecker's patches; their sizes now are in `38-the-woodpecker.md` ("How it picks a
  patch"), and this call as it was, with its measurements, in `docs/archive/design-woodpecker.md`.

### Controls that keep up

Its rules are in `42-controls.md` under the same name (its chained swipes under "Touch precision" there), and
its text as it was, with what was measured, in `docs/archive/design-page.md`.

### What was promised and missing

The completeness audit's list, and the docs it corrected, as it was are in `docs/archive/design-arc-and-history.md`.
Each item built is in its topic file: the rivals planning with their powers, the board split and the trappers' thicker
walls in `39-the-rivals.md`; the lines in `13-lines-and-announcements.md`; the steering hint, the Field guide and the
lessons in `30-teaching-by-showing.md` (their text as it was in `docs/archive/design-teaching.md`); powers told apart in
`03-the-snake-as-a-character.md`; beads that rot in `04-food-and-the-world.md`; your own crash squashed, not eaten, in
`41-crashes.md`.

### Online

Protocol 7 and 8's messages: what each move and thing on the log sends now is in its topic file's "Online"
(`40-powers-and-moves.md`, `41-crashes.md`, `04-food-and-the-world.md`), the general rules and the plan message in
`22-play-with-friends-online.md`, and this section as it was in `docs/archive/design-online.md`.
