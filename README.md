# Barkstreet Snakes

A snake game on a fallen, mossy log in the woods: you against three AI rivals, dealt each round from a cast of eighteen, each with a style of its own. It plays in the browser, on desktop and phone.

**Play:** https://haaktuah.github.io/barkstreet-snakes/

## How it plays

Steer your snake round the log, eat to grow and stay out of everything else. A crash costs you some tail, not the round, so you can take a few knocks; hunger, weather, fire and a woodpecker that cuts the log away squeeze the board as the round goes on. The last snake alive wins. Jump and dash are your two powers, and they share one stamina ring round your head.

You don't need to read the rules first: the game teaches each one when it first matters, and the **Field guide** (G, or the open-book button) shows every food, power and danger with its picture. **Watch rivals** on the start screen lets you see a round between four AI snakes, and you can pick which rivals you face (tap a seat on the start card). Your best rounds and stats stay in your browser, in the Hall of Fame (H).

## Controls

| Action | Keyboard and mouse | Touch |
|--------|----------|-------|
| Steer | Arrow keys or WASD | Swipe (anywhere on the screen during a round) |
| Jump | Space, or click the board | Tap |
| Dash | E or Shift, the key you're going, or right-click the board | Swipe the way you're already going |
| Nap (pause) | P or Esc | ⏸ button |
| Wake up | Any key that plays | Tap the board or the card |
| Start / start over | Enter or R (mid-round it asks first) | Play button |
| Field guide | G | The open-book button, or **How to play** on the start screen |
| Hall of Fame, Your story | H | Hall of Fame button (a trophy) |
| A rival's note (how it plays) | Click its name tag | Tap its name tag |
| Sound / music | M / N | 🔈 / ♪ buttons |
| Watching speed | 1, 2, 4 | 1× 2× 4× buttons |

The game naps by itself when you switch tabs or windows, so you never come back to a dead snake.

## Play with friends

Press **Play with friends**, then **Host a game**, and send the link (or the five-letter code) to up to three friends. Empty seats go to rivals. One browser hosts and the others connect straight to it, peer to peer, through PeerJS: there is no game server and nothing to sign up for.

## No build step, no dependencies

Plain HTML, CSS and JavaScript, with no build step, no dependencies and no asset files but its lettering: every picture is drawn and every sound is synthesised in the page. A page left open picks up a newer version by itself between rounds.

## For people working on it

How to run it, the checks and how it is put together: [docs/developing.md](docs/developing.md). Why the game is the way it is, one file a topic: [DESIGN.md](DESIGN.md).

## Licences

The game is its maker's, all rights reserved. What it borrows, PeerJS for online play and the Fredoka lettering, is under free licences, whose notices are in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).
