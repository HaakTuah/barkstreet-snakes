# Snake

Snake against three AI rivals, playable in the browser. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

**Play:** https://haaktuah.github.io/snake-game/

## Rules

- Four snakes share a 30×30 board: you (green) and three AI rivals.
- Eat food to grow. Hitting a wall, any snake's body, or another snake's head kills you.
- When a snake dies, its whole body turns into pellets that anyone can eat.
- The last snake alive wins. If you die first, you can watch the rest of the round or restart.
- The game speeds up slowly over the course of a round.

## The rivals

| Snake | Style |
|-------|-------|
| **Viper** (purple) | Aggressive. Cuts into other snakes' space and especially likes to get between you and your food. |
| **Gobbler** (orange) | Greedy. Chases food hard and rushes the pellets left by dead snakes. |
| **Warden** (blue) | Patient. Keeps plenty of room, claims territory and boxes others in late in the round. |

The AIs plan a few moves ahead. They check that they'll still have room to move, split the board into "who gets where first", and only chase food they can reach before anyone else. To keep things fair, they see the other snakes as they were about a quarter of a second ago, like a human's reaction time. So they can't dodge your sudden turns any faster than you could dodge theirs.

## Controls

| Action  | Keys                         |
|---------|------------------------------|
| Move    | Arrow keys or WASD (swipe on touch screens) |
| Pause   | Space or P                   |
| Restart | Enter or R                   |
| Scores  | H, or the Scores button      |

## Scores and stats

Everything is saved in your browser only.

- **High scores:** the top 10 rounds, ranked by finishing place first (a win beats any 2nd place), then by food eaten. When a round makes the list, you can type your name on the end screen.
- **Stats:** rounds played, wins, average place and food, how often you finished in each place, and what killed you (including your nemesis, the AI that gets you most often).

## Run locally

Open `index.html` in any browser. Add `?debug` to the URL to get `SnakeDebug.simulate(n)` in the console, which runs n fast AI-only rounds and reports who won and how the snakes died.
