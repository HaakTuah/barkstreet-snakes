# Snake

Snake against three AI rivals, drawn at random each round from a cast of twelve. Playable in the browser. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

**Play:** https://haaktuah.github.io/snake-game/

## Rules

- Four snakes share a 30×30 board: you (green) and three AI rivals.
- Eat food to grow. Hitting a wall, any snake's body, or another snake's head kills you.
- When a snake dies, its whole body turns into pellets that anyone can eat.
- The last snake alive wins. If you die first, you can watch the rest of the round or restart.
- The game speeds up slowly over the course of a round.

## The rivals

Each round, three of these twelve are picked at random. The start screen tells you who you're up against, and you can hover over a name on the scoreboard to see what it does.

| Snake | Look | Style |
|-------|------|-------|
| **Hunter** | crimson, fangs, stripes | Picks whichever snake it has the best shot at, gets in front of it and squeezes its space. |
| **Gobbler** | orange, puffy cheeks | Eats everything, even food a rival is closer to. Grows fast, dies young. |
| **Ghost** | pale, fading body | Keeps as far from everyone as it can, stays short, and waits for the others to kill each other. |
| **Warden** | blue, visor | Claims a home area (shown on the board) and attacks anyone who comes in. |
| **Drab** | grey, sleepy eyes | Plays it safe and sensible. Nothing special. |
| **Vulture** | grey, pink bald head | Hovers near snakes in trouble and feeds on the pellets they leave. |
| **Mason** | sandstone bricks | Builds long straight walls to fence off a big piece of the board. |
| **Wildcard** | rainbow, odd eyes | A random mix of habits, different every round. |
| **Creeper** | violet, slit eyes | Sneaks up and rides right behind other snakes' tails. |
| **Metagamer** | gold, glasses | Watches how each rival plays, then avoids the aggressive ones, shadows the greedy ones and hunts the timid ones. |
| **Capricious** | changes with its mood | Switches between hunter, glutton, hermit and builder every few seconds. |
| **Copycat** | pale copy of its model | Copies whoever looks like they're winning, right alongside them. |

All of them share the same sense of danger. They plan a few moves ahead, check that they'll still have room to move, and avoid the space around other snakes' heads. On top of that, each one chases its own goal.

They're also fair. They see the other snakes as they were about a quarter of a second ago, like a human's reaction time, so they can't dodge your sudden turns any faster than you could dodge theirs. And they aren't told which snake is you: you're judged only by how you move, like everyone else.

## Controls

| Action  | Keys                         |
|---------|------------------------------|
| Move    | Arrow keys or WASD (swipe on touch screens) |
| Pause   | Space or P                   |
| Restart | Enter or R                   |
| Scores  | H, or the Scores button      |

## Scores and stats

Everything is saved in your browser only.

- **High scores:** the top 10 rounds, ranked by finishing place first (a win beats any 2nd place), then by food eaten. The AI snakes get entries too, so you're competing against them on the list. Switch to **Only you** to see your own top 10. When a round makes the list, you can type your name on the end screen.
- **Stats:** rounds played, wins, average place and food, how often you finished in each place, and what killed you (including your nemesis, the AI that gets you most often).

## Run locally

Open `index.html` in any browser. Add `?debug` to the URL for tuning tools in the console: `await SnakeDebug.simulate({ rounds: 50 })` runs fast AI-only rounds with four random personalities and reports each one's win rate, food, kills and so on, and `SnakeDebug.setup(['hunter', 'warden', 'ghost'])` sets up a round against chosen opponents.
