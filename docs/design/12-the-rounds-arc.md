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
| 0:45 | Mid-round: a meal keeps you 12 s, not 20 (`HUNGER_MID_FROM_MS`); winter may come (`SNOW_FROM_MS`); the music picks up (`MUSIC_MID_MS`) |
| 2:00 | **Sudden death** (`SUDDEN_DEATH_MS`): the woodpecker arrives and pecks the log away a patch at a time; nothing new grows, but the last apples fall one at a time, and beetles still come out; the sky clears and stays clear; a meal keeps you 20 s again; the ticks are at their fastest |
| Last two snakes | Only the music changes (the duel) |
| One snake left, or none | The round is over |

### Sudden death closes in

**Sudden death closes in.** A round ends with the board closing in, not with long snakes waiting to starve: hunger
bites no harder in sudden death than in the opening (`HUNGER_MS`), but **the woodpecker gets hungrier**: each rest is
shorter than the one before and each patch a cell bigger, so the log shrinks faster and faster (`PECK_HUNGRIER`,
`PECK_REST_MIN` and `PECK_CHUNK_MAX`: "When it comes" and "How it picks a patch" in `38-the-woodpecker.md`). Ghost,
which keeps its distance, eats with a normal appetite up to 18 long so it doesn't starve first in a long endgame
("Nobody's picky in sudden death" in `39-the-rivals.md`).

**The woodpecker comes at 2:00, not 3:00**, and **The woodpecker, rebuilt: big, telegraphed, in chunks**: its rules as
they stand now are in `38-the-woodpecker.md`, and their text as it was, with their measurements, in
`docs/archive/design-woodpecker.md`.

**A cornered AI makes the sensible last move**: its rule is in `39-the-rivals.md` under that name, and its text as it
was, with what it measured, in `docs/archive/design-rivals.md`. Two heads that swap cells count as a head-on, as
they look.

### Starving

A snake whose last meal has run out (`HUNGER_MS`, or `HUNGER_MID_MS` mid-round: "Food on the log" in
`04-food-and-the-world.md`) loses a segment every `STARVE_EVERY_MS` (1.5 s), growth still to come first; one already
at `MIN_LENGTH` (3) when the next is due starves (`step` in `engine/step.js`).

**Starving is decided after eating**: its rule is in `04-food-and-the-world.md` under that name, and its text as it
was in `docs/archive/design-food.md`.

### The end

The round is over when one snake is left, the winner, or none. Snakes out on the same tick share their place, ahead of
those out before them; if nobody is left, the last share first place, a draw (`afterTick` in `game/core.js`).

**The Hall of Fame ranks by place, then time alive, then food**: its rule is in `43-the-start-card-and-records.md`
under that name, and its text as it was in `docs/archive/design-online.md`.

