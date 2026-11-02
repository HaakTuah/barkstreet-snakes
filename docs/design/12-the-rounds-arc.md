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

**The woodpecker comes at 2:00, not 3:00**, and **The woodpecker, rebuilt: big, telegraphed, in chunks**: its rules as
they stand now are in `38-the-woodpecker.md`, and their text as it was, with their measurements, in
`docs/archive/design-woodpecker.md`.

**A cornered AI makes the sensible last move.** When every move looks fatal, a wall, a hole or its own body is certain death, but a rival's cell may already be free (it sees rivals as they were a moment ago), so it bets on the cell that frees up soonest. It used to pick at random, and those were the deaths that looked dumbest: self-bites fell from 15% to 8% of AI deaths and wall crashes from 7% to 2%. Two heads that swap cells now count as a head-on, as they look.

**Starving is decided after eating.** A snake whose head reaches food on the tick it would starve eats instead.

**The Hall of Fame ranks by place, then time alive, then food** (your call). Food stops appearing at 2:00 (since round four, all but the last apples, and since round six A, beetles still come out), so food eaten mostly measures how early you died; time alive measures how well you played. The rank on your death card already counts the snakes still alive (they'll all finish ahead of you), so it's the rank the round-over card will show.

