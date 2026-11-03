## The round's arc

A round has a shape, and the music follows it:

| Moment | Rules | Music |
|---|---|---|
| Start card, countdown, round over | - | A calm marimba loop (84 bpm) |
| Opening | The first 3 ticks are eased (170 → 120 ms) | The loop plus a soft bass |
| 0:45 | The speed-up (120 → 90 ms over 2 minutes) is well under way | A shaker joins; the tempo creeps up with the game's speed |
| 2:00 | **Sudden death:** nothing new grows, but the last apples fall one at a time (round four); the woodpecker pecks the log away a patch at a time | Minor key, wood-block knocks |
| Last two snakes | - | Faster and tense, with a heartbeat kick |
| Watching | - | Quieter, no percussion |
| Napping | - | Ducked to about a third |

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

**Starving is decided after eating**: its rule is in `04-food-and-the-world.md` under that name, and its text as it
was in `docs/archive/design-food.md`.

**The Hall of Fame ranks by place, then time alive, then food**: its rule is in `43-the-start-card-and-records.md`
under that name, and its text as it was in `docs/archive/design-online.md`.

