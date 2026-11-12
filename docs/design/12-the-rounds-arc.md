## The round's arc

How a round goes, from Go to its end: its timeline, sudden death closing in, starving, and how it ends. The timeline as
the round files had it, with its music column, is in `docs/archive/design-arc-and-history.md`. Elsewhere: the music at
each moment (the stages under "The music" in `21-sound.md`, the one place for them), the weather's own timing
(`05-weather.md`), and how long a meal keeps you (`04-food-and-the-world.md`, "Food on the log").

### The timeline

A round has a shape. Times are the round's game time (`tuning.js`):

| When | What changes |
|---|---|
| Go | The first 3 ticks are eased, 170 → 120 ms (`OPENING_TICK`, `OPENING_TICKS`, `START_TICK`); from there the ticks speed up evenly to 90 ms at 2:00 (`MIN_TICK`, `RAMP_MS`), about a third faster |
| 0:15 | Beetles start coming out (`BEETLE_FIRST_MS`) |
| 0:30 | A storm may come (`STORM_FROM_MS`) |
| 0:45 | Mid-round: winter may come (`SNOW_FROM_MS`); the music picks up (`MUSIC_MID_MS`) |
| 0:50–1:15 | **The watcher** (`ACT_WATCH_MS`): the woodpecker lands and watches the log; where it looks last, it starts cutting ("Its three acts" in `38-the-woodpecker.md`) |
| 40–60 s on | **The first pecks** (`ACT_PECKS_MS`): it cuts a piece out of the log, a few cells a peck, while food still grows ("It cuts a shape") |
| 35–50 s on | **Sudden death,** its frenzy (`ACT_FRENZY_MS`): it cuts faster, down to the floor, then fights ("The floor", "Then it fights"); nothing new grows, but the last apples fall one at a time, and beetles still come out; the sky clears and stays clear |
| 2:00 | The ticks are at their fastest |
| Last two snakes | Only the music changes (the duel) |
| One snake left, or none | The round is over |

### Sudden death closes in

**Sudden death closes in.** A round ends with the board closing in, not with long snakes waiting to starve: a meal
keeps you as long then as all round (`HUNGER_MS`, "Food on the log" in `04-food-and-the-world.md`), so it's a trade-off
to the end, and **the woodpecker gets hungrier**: with each piece
that falls in its frenzy each rest is shorter and each peck a cell bigger, so the log shrinks faster, down to a floor
where it fights ("Its three acts", "It cuts a shape", "The floor" and "Then it fights" in `38-the-woodpecker.md`). Ghost,
which keeps its distance, eats with a normal appetite up to 18 long so it doesn't starve first, and in the endgame
keeps the least length of the cast ("The endgame: a meal is worth the life it buys" in `39-the-rivals.md`).

**The woodpecker in three acts** (entry 6), after **The woodpecker comes at 2:00, not 3:00**, and **The woodpecker, rebuilt: big, telegraphed, in chunks**: its rules as
they stand now are in `38-the-woodpecker.md`, and their text as it was, with their measurements, in
`docs/archive/design-woodpecker.md`.

**A cornered AI makes the sensible last move**: its rule is in `39-the-rivals.md` under that name, and its text as it
was, with what it measured, in `docs/archive/design-rivals.md`. Two heads that swap cells count as a head-on, as
they look.

### Starving

A snake whose last meal has run out (`HUNGER_MS`: "Food on the log" in
`04-food-and-the-world.md`) loses a segment every `STARVE_EVERY_MS` (1.5 s), growth still to come first; one already
at `MIN_LENGTH` (3) when the next is due starves (`step` in `engine/step.js`).

**Starving is decided after eating**: its rule is in `04-food-and-the-world.md` under that name, and its text as it
was in `docs/archive/design-food.md`.

### The end

The round is over when one snake is left, the winner, or none. Snakes out on the same tick share their place, ahead of
those out before them; if nobody is left, the last share first place, a draw (`afterTick` in `game/core.js`). Out
first, you can watch the rest of the round or start over.

**The Hall of Fame ranks by place, then time alive, then food**: its rule is in `43-the-start-card-and-records.md`
under that name, and its text as it was in `docs/archive/design-online.md`.

