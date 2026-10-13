# Bark & Bite

A snake game up a tree: you against three AI rivals on the bark of a tree, drawn at random each round from a cast of fifteen. Plays in the browser, on desktop and phone. Plain HTML, CSS and JavaScript, with no build step, no dependencies and no asset files: every picture is drawn and every sound is synthesised in the page.

**Play:** https://haaktuah.github.io/snake-game/

## Rules

- Four snakes share a 24×24 patch of bark: you (green, with a glowing cream outline) and three AI rivals. Watch their eyes: each one looks at whatever it's after.
- Hitting the edge, a hole, fire, any snake's body, or another snake's head kills you.
- When a snake dies, it falls to pieces: glossy beads in its own colours and markings, which anyone can eat.
- The last snake alive wins. If you die first, you can watch the rest of the round or start over.
- The first moves are a little slower, then the game speeds up gently (about 25%) over two minutes.
- **Hunger:** go 20 seconds without eating (mushrooms don't count) and you start shrinking, one segment every 1.5 seconds. Starve at length 3 and you're out, unless your head reaches food that very moment. The bar under each name shows how hungry everyone is.
- **Weather:** after the first 20 seconds, spells of weather come and go, with clear spells between. Everyone, the rivals included, sees all of it coming.
  - **Sun:** golden hour. Golden apples are five times as likely.
  - **Wind:** gusts knock apples loose, up to three more than usual.
  - **Rain:** two more mushrooms sprout, and any fire goes out. Half the time, when the rain stops, a rainbow comes down on a golden apple.
  - **Storm** (not before 30 s): lightning. Where it's going to strike crackles for about a second first, and it never strikes within 4 cells of a head. It sets the bark alight: fire burns for about 5 seconds and creeps to the odd neighbouring cell (smouldering first, harmlessly, so you see it coming). Burning bark kills a head that crawls into it. Storms are often followed by rain.
- **Burrows:** the first beetle cracks a burrow open in the bark, and later ones open more (up to three). Burrows are safe to cross; cracks spread from them as the round goes on. A scared beetle that reaches one dives in and pops out of a burrow a moment later.
- **Sudden death:** after two minutes no new food appears, the sky clears, and a woodpecker starts pecking holes in the bark, ring by ring from the edges inwards. It plays fair: it never pecks within 3 cells of a head or under food, so you always have time to see a hole coming.

### Food

| Item | Effect |
|------|--------|
| Green apple | +1 length. There are always three on the board. |
| Golden apple | +3 length. Rare, sparkles, and fades before it rots after about 12 seconds. |
| Red mushroom | Shrinks you by 3 (never below 3). Withers after about 20 seconds and regrows elsewhere. Being short isn't always bad… |
| Beads | +1 length. What's left of a dead snake, in its colours. |
| Beetle | +2 length. Now and then one crawls out of a burrow (from 15 s in, not once the woodpecker comes), and a scared one runs for a burrow and dives in. It wanders slowly, and scurries away (at half a snake's speed) when a head gets within 4 cells, so catching one is a short chase. Uncaught, it flies off after about 30 s. |

## Play with friends

Press **Play with friends** on the start screen, then **Host a game** and send the link (or the five-letter code) to up to three friends. When they're in, press **Start**. Empty seats get AI rivals, and you can play round after round in the same room.

- One browser hosts: it runs the game, and friends' browsers connect straight to it (peer to peer). There's no game server and nothing to sign up for. A free public service, PeerJS, only introduces the browsers to each other.
- It's fair: the rivals treat everyone alike, and the host's own turns are held back by the friends' lag, so the host gets no head start.
- **Shared Hall of Fame:** when you connect, your best rounds and your friends' are copied into each other's Hall of Fame (marked "friend"), and every round you play together is recorded for everyone. Your stats and **Only you** stay yours.
- If a friend's connection goes quiet, an AI steers their snake until they're back; if they leave, it finishes the round for them.
- There's no napping online, and the host's tab should stay open (it keeps the round going even in the background).
- On some strict networks (certain mobile carriers and offices) browsers can't connect directly. If a friend can't get in, try another network; for good, a relay (TURN server) can be added in `net.js`.

## Controls

| Action | Keyboard | Touch |
|--------|----------|-------|
| Steer | Arrow keys or WASD (turns are queued, so quick double turns work) | Swipe (anywhere on the screen during a round) |
| Nap (pause) | Space or P | ⏸ button |
| Start / start over | Enter or R (or any arrow on the start screen) | Play button |
| Hall of Fame | H | Hall of Fame button |
| Sound / music | M / N | 🔈 / ♪ buttons |
| Watching speed | 1, 2, 3 | 1× 2× 4× buttons |

The game naps by itself when you switch tabs or windows, so you never come back to a dead snake.

## Sound and music

Everything you hear is made live with the Web Audio API: a marimba pluck when you eat, a sparkle for gold, a sigh when you die, the woodpecker's knocking. The music is a marimba loop that follows the round: calm on the start screen, a bass line once the round starts, a shaker as it picks up speed, a minor key with wood-block knocks when the woodpecker arrives, and a tense, faster figure when only two snakes are left. Sound and music each have their own switch, and both are remembered.

## Bark chatter

The AI snakes talk. Each one has its own voice: Sovereign uses the royal "we", Colonist is a pompous redcoat, Mason speaks only (dubious) Latin, Ghost mostly says "…", and Copycat repeats whatever it just heard, in Chinese. Some of them talk to each other. Lines pop up in speech bubbles and in a log under the board, which you can switch off.

## Watching the AIs

Press **Watch AIs** on the start screen for a round between four AI snakes, with a 1×/2×/4× speed control. The same control appears when you're watching after dying. Starting over keeps you watching. Watched rounds put the AI snakes in the Hall of Fame, but don't count towards your own stats.

## The rivals

Each round, three of these fifteen are picked at random. The start screen tells you who you're up against and how each one plays. Only you have a real forked tongue: every few seconds each rival flicks out something of its own instead, such as Wildcard's dollar bill, Joker's party blower or Desperado's six-shooter.

| Snake | Look | Style |
|-------|------|-------|
| **Sniper** | blood red, one eye behind a scope | Picks whichever snake it has the best shot at, gets in front of it and squeezes its space. |
| **Gobbler** | orange, puffy cheeks | Eats everything, even a rival's apple. Hates mushrooms. |
| **Ghost** | pale, fading body | Keeps away from everyone and eats mushrooms to stay small. |
| **Sovereign** | royal blue, golden crown | Rules its own patch of bark (shown on the board) and attacks anyone who trespasses. |
| **Colonist** | redcoat, tricorn hat | Plants Union Flags all over the board and defends every one of them. |
| **Drab** | khaki, sleepy eyes | Plays it safe and sensible. Nothing special. |
| **Vulture** | black, pink bald head, hooked beak, scowl | Hovers near snakes in trouble and feeds on what they leave behind. |
| **Mason** | Caesar in marble, laurel wreath | Walls off the board, then keeps the biggest piece. |
| **Wildcard** | rainbow, orange tan, golden combover, long red tie | A random mix of habits, new every round. |
| **Creeper** | teal, slit eyes | Sneaks up and rides right behind other snakes' tails. |
| **Metagamer** | cyan, 3D glasses | Watches how each rival plays, then avoids the aggressive ones, shadows the greedy ones and hunts the evasive ones. |
| **Capricious** | changes with its mood | Starts undecided, then switches between sniper, glutton, hermit and builder every few seconds. |
| **Copycat** | pale copy of its model, cat ears | Copies whoever seems to be winning, right alongside them. Party member. |
| **Joker** | jester hat, harlequin diamonds, red nose | Lures chasers into dead ends and swerves away at the last moment. |
| **Desperado** | rust poncho, cowboy hat, bandana | An adrenaline junkie: skims walls, bodies and other heads for the thrill of it. |

All of them share the same sense of danger. They plan a few moves ahead, check that they'll still have room to move, and avoid the space around other snakes' heads. On top of that, each one chases its own goal.

They're also fair. They see the other snakes as they were about a quarter of a second ago, like a human's reaction time, so they can't dodge your sudden turns any faster than you could dodge theirs. And they aren't told which snake is you: you're judged only by how you move, like everyone else.

## Hall of Fame and stats

Everything is saved in your browser only.

- **Hall of Fame:** the top 10 rounds, ranked by finishing place (a win beats any 2nd place), then by how long the snake stayed alive, then by food eaten. The AI snakes get entries too, so you're competing against them on the list. Switch to **Only you** to see your own top 10. When a round makes the top three, or beats your best, you can carve your name on the end screen.
- **Your story:** rounds played, wins, average place and score, how often you finished in each place, and what killed you (including your nemesis, the rival that gets you most often).

## Run locally

Serve the folder with any static server (for example `npx serve` or `python -m http.server`) and open it in a browser. Opening `index.html` directly works too.

- `?perf` shows a frame-time overlay (toggle it with the ` key).
- `?debug` adds `SnakeDebug` to the console, for example `SnakeDebug.setup(['sniper', 'mason', 'ghost'])` to start a round against chosen rivals.
- `node tools/records-test.js` checks that shared and played-together rounds land in each friend's Hall of Fame exactly once.
- `node tools/online-test.js` plays rounds through the online protocol and checks that a friend's screen matches the host's every tick.
- `node tools/simulate.js 200` plays 200 AI-only rounds headlessly with the game's own rules and AI, and prints each personality's win rate, food, kills, how snakes die and so on. Add `--seed 1` to repeat a run exactly (on any machine), `--check` to fail on a stalled round, and `--root <dir>` to play another copy of the game, to compare versions.
- `node tools/rules-test.js` checks the rules on hand-built boards: tails, head-ons, starving, the woodpecker's manners, what the AIs can see.
- `node tools/shots.js [dir]` takes the screenshot tour in headless Chrome (title, play, a bite, a nap, a death, the cards, the Hall of Fame, a laptop, a phone both ways), with an autopilot at the wheel. `node tools/bench.js` measures frame times the same way. Both need Chrome (or set `CHROME`); nothing to install.

### How it's put together

| File | What it does |
|------|--------------|
| `tuning.js` | Every number that shapes how the game plays and feels, in one place. |
| `engine.js` | The rules: moving, eating, dying, hunger, the woodpecker. No drawing, so it also runs in Node. |
| `ai.js` | The rivals' brains and personalities. |
| `render.js` | Draws the board on a canvas, with smooth movement between ticks. |
| `audio.js` | Sound effects and the adaptive music, synthesised live. |
| `chatter.js` | The rivals' speech bubbles and chat log. |
| `records.js` | The Hall of Fame and your stats. |
| `online.js` | Play with friends: the messages between host and friends. |
| `net.js` | Play with friends: the connections (PeerJS, loaded only when used). |
| `snake.js` | Ties it together: the game loop, input, the cards, the controls and the lobby. |
