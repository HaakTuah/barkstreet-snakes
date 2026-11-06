# Progress: done

## Done, 31 October 2026

### 2u. Picked rivals for this visit; unmet rivals back into the deck (30 October 2026; small, a UI lane) — done, PR #221

The owner asked why the same cast showed up each time he started the game, then: "I might've picked them yes. Didn't
expect them to stay permanently", and to the design session's takes: "Agreed to all!". In `records.js` and the start
card (`game/round.js`, `game/hud.js`):
- **A picked seat lasts this visit,** round after round, and the next time the game is opened every seat is "Any"
  again (kept in `sessionStorage`, not `localStorage`; the storage key `LINEUP_KEY` keeps its name and is simply no longer
  read, per "Never rename"). A picked seat shows a small pin on the start card, and one tap on the pin sets it back to
  "Any".
- **Rivals dealt but never met** (the page closed or reloaded on the start card) go back into the deck at a random place
  among the rivals not yet dealt, not on top (`Records.undeal`): everyone is still met before anyone comes round again,
  but opening the game gives a fresh cast.
Online is unchanged (the host deals). The UI suite: a pick lasts across rounds and is gone in a new visit; a pin
clears; an undealt rival is not dealt first every time (a seeded test).

### 2n. Wildcard's hair: the original, its lick reversed (30 October 2026; small, an art lane) — done, PR #208

The original pompadour (PR #74, at a79946b) as it was, with only its lick reversed: the curl at the near end of the roll
now curls up and back over the hair behind it instead of forward over the brow. Two tries that reworked more were
turned down (the owner: "it looks horrible. I want the original hair, but I want the lick reversed. That's all. Keep it
that simple."); the third had his yes ("The hair looks 'okay' now."; "The hair's third try is approved: merge #208.").
See "Wildcard's hair" in `docs/design/32-the-owners-playtest.md`.

### 2v. The newest version, by itself between rounds (30 October 2026; small, a UI lane): done, PR #223

The owner: "Should barkstreet snakes also have a "updated game" thingy that pops up?", "Yes to both, do it expertly!", and
then, of Amarna Letters' note: "It should update when you start game. [...] Like why would I not want the latest
version?" Today a fresh load always gets the newest version (`sw.js` asks the network first), but a page left open or
resumed on a phone keeps the version it loaded and is never told, and online the first sign is a refused join ("That
room runs a different version of the game").
- **It looks:** when the page is shown again after being hidden, and every 30 minutes while open (as Amarna Letters'
  `ui/update.ts` does), it asks whether a newer version is published (the service worker's update check).
- **It updates by itself, never during a round:** on the start card or the round-over screen it reloads into the new
  version at once, with no question; records and settings survive, as they do today.
- **Online:** the host updates before opening the next room, so a new room starts everyone on one version; a friend who
  is behind is updated the same way before joining.
- **What changed:** after an update, the start card shows one line of what is new for a few rounds (from a short list
  kept beside the version number, written with each milestone), then it goes.
Drawing and the service worker only: no rules, no rivals, no protocol change. The UI suite: no reload during a round,
one between rounds when a new version is waiting, the line of what changed shown once and gone.

Done (PR #223): `version.js` (the build, stamped by the Pages workflow, and the news, one line per milestone) and
`update.js`; the start card's intro line says what is new for three rounds. See `docs/design/36-updating.md`.

