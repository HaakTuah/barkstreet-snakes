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

**The woodpecker comes at 2:00, not 3:00** (your call, and the numbers agree). With hunger, food is what keeps a round going, and late rounds were dragging. Over 600 simulated AI rounds the median round lasts 71 s, the middle half 46-112 s, and 21% of rounds reach the woodpecker, so it's a real event rather than a rarity. Every personality wins 15-31% of the rounds it plays. (Gobbler had slipped to 8%: it chased food straight into other snakes. It now flinches from heads a little more, so it lives longer and, true to form, eats a third more.)

**The woodpecker, rebuilt: big, telegraphed, in chunks** (since reworked again: patches anywhere, see "Crashes, not deaths"). It used to sit on the board as a small sprite, pecking a cell every other tick. Now a big great spotted woodpecker (about six cells tall) lands beside the board, on its own layer over the page, on whichever side has room on this screen (with room nowhere, as on a phone, shrunk into the gutter on the side nearer its patch, its beak never over a cell). Then, over and over: it picks the next run of up to 8 free cells along the outermost ring left (never within 3 cells of a head, never a body or food), eyes it for 13 ticks (about a second and a half; the chunk glows red and cracks, the pulse quickening, and the bird crouches), swoops in, drums it all out in a shower of chips (except any cell a body is on by then), flies back, and rests for 6 ticks. The AIs keep out of a marked chunk as they keep out of holes, with their usual reaction delay. Over 300 simulated rounds the median round is as long as before (69 s); deaths in its holes fell from 0.29 to 0.06 per woodpecker round, because every strike is announced, so the squeeze now comes from shrinking room and hunger (starving rose from 2% to 5% of deaths). Online it's protocol 3.

**A cornered AI makes the sensible last move.** When every move looks fatal, a wall, a hole or its own body is certain death, but a rival's cell may already be free (it sees rivals as they were a moment ago), so it bets on the cell that frees up soonest. It used to pick at random, and those were the deaths that looked dumbest: self-bites fell from 15% to 8% of AI deaths and wall crashes from 7% to 2%. Two heads that swap cells now count as a head-on, as they look.

**Starving is decided after eating.** A snake whose head reaches food on the tick it would starve eats instead.

**The Hall of Fame ranks by place, then time alive, then food** (your call). Food stops appearing at 2:00 (since round four, all but the last apples, and since round six A, beetles still come out), so food eaten mostly measures how early you died; time alive measures how well you played. The rank on your death card already counts the snakes still alive (they'll all finish ahead of you), so it's the rank the round-over card will show.

