# Bark & Bite

A snake game up a tree: you against three AI rivals, drawn at random each round from a cast of fifteen, on the bark of a tree. Playable in the browser. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

**Play:** https://haaktuah.github.io/snake-game/

## Rules

- Four snakes share a 24×24 patch of bark: you (green) and three AI rivals.
- Hitting the edge, a hole, any snake's body, or another snake's head kills you.
- When a snake dies, its body turns into meat that anyone can eat.
- The last snake alive wins. If you die first, you can watch the rest of the round or restart.
- The game speeds up slowly over the course of a round.
- **Hunger:** go 20 seconds without eating (mushrooms don't count) and you start shrinking, one segment every 1.5 seconds. Starve at length 3 and you're out. The bar under each name shows how hungry everyone is.
- **Sudden death:** after three minutes no new food appears, and a woodpecker starts pecking holes in the bark, ring by ring from the edges inwards.

### Food

| Item | Effect |
|------|--------|
| Green apple | +1 length. There are always three on the board. |
| Golden apple | +3 length. Rare, and rots after about 12 seconds. |
| Red mushroom | Shrinks you by 3 (never below 3). Withers after about 20 seconds and regrows elsewhere. Being short isn't always bad... |
| Meat | +1 length. What's left of a dead snake. |

## Bark chatter

The AI snakes talk. Each one has its own voice: Sovereign uses the royal "we", Colonist is a pompous redcoat, Mason quotes Latin, Ghost mostly says "…", and Copycat repeats whatever it just heard, in Chinese. Lines pop up in speech bubbles and in a log under the board, which you can switch off.

## Watching the AIs

Press **Watch AIs** on the start screen for a round between four AI snakes, with a 1×/2×/4× speed control (or keys 1–3). The same control appears when you're watching after dying. AI-only rounds don't count towards your scores or stats.

## The rivals

Each round, three of these fifteen are picked at random. The start screen tells you who you're up against, and you can hover over a name on the scoreboard to see what it does.

| Snake | Look | Style |
|-------|------|-------|
| **Hunter** | blood red, fangs, stripes | Picks whichever snake it has the best shot at, gets in front of it and squeezes its space. |
| **Gobbler** | orange, puffy cheeks | Eats everything, even food a rival is closer to. Hates mushrooms. |
| **Ghost** | pale, fading body | Keeps away from everyone and eats mushrooms to stay small. |
| **Sovereign** | royal blue, golden crown | Rules its own patch of bark (shown on the board) and attacks anyone who trespasses. |
| **Colonist** | redcoat, tricorn hat | Plants flags all over the board and defends every one of them. |
| **Drab** | khaki, sleepy eyes | Plays it safe and sensible. Nothing special. |
| **Vulture** | black, pink bald head | Hovers near snakes in trouble and feeds on what they leave behind. |
| **Mason** | stone bricks, laurel wreath | Builds long straight walls to divide the board, then rules the biggest piece. |
| **Wildcard** | rainbow, great hair | A random mix of habits, different every round. |
| **Creeper** | violet, slit eyes | Sneaks up and rides right behind other snakes' tails. |
| **Metagamer** | gold, taped glasses | Watches how each rival plays, then avoids the aggressive ones, shadows the greedy ones and hunts the timid ones. |
| **Capricious** | changes with its mood | Switches between hunter, glutton, hermit and builder every few seconds. |
| **Copycat** | pale copy of its model, cat ears | Copies whoever looks like they're winning, right alongside them. Party member. |
| **Joker** | jester hat, red nose | Lures chasers into dead ends and swerves away at the last moment. |
| **Desperado** | rust poncho, cowboy hat, bandana | An adrenaline junkie: skims walls, bodies and other heads for the thrill of it. |

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
