## Updating

The newest version, by itself between rounds (entry 2v, 30 October 2026). Haakon: "It should update when you start
game. [...] Like why would I not want the latest version?"

- **How a page knows.** `version.js` names its build: `'dev'` in the repository, stamped with the commit by
  `.github/workflows/pages.yml` as it publishes main's copy and each preview's. `update.js` asks for `version.js`
  afresh (no cache) when the page is shown again after being hidden and every 30 minutes; a different build means a
  newer version is out. A fresh load is already the newest (`sw.js` asks the network first).
- **When it goes in.** Only on the start card or the round-over card, alone: not during a round, a nap or a
  countdown, not online, and not while the Field guide, the rivals' picker or a typed name is open. Then it reloads at
  once, with no question; records and settings are kept, as on any reload. Before reloading, the page's own files
  are fetched afresh, so the reload gets all of them new and never a mix (Pages lets a browser keep a file 10
  minutes). A build a visit reloaded for and didn't get (the site half published) is let be for that visit: no loop.
- **Online.** Host a game and joining a room each look first (up to 2.5 s) and, with a newer version out, reload
  into it and go on there: the host's room opens, the friend joins the same room (`?join=`, as a link does). So a new
  room starts everyone on one version. A friend turned away for its version (the protocol differs) looks again then.
  If the friend isn't behind, the host is, and the card says to reload both pages, as before. No message changed.
- **Never at the wrong moment.** The reload waits until the files have come, so the moment is asked again just
  before it: a round started meanwhile, or a room given up (Back), and it doesn't happen; it goes in at the next
  moment between rounds. A file that didn't come (offline, or slow past 5 s): not now, again in a minute. Storage
  blocked outright (all cookies blocked) never stops the game: nothing is kept, and it plays. The worker keeps no
  copy of the look at `version.js`, so the offline copy's `version.js` always matches its other files.
- **What changed.** `version.js` keeps one line per milestone, newest first, written with the milestone. After an
  update, a returning player's start card shows "New: …" in place of its intro line (the same length, so the card keeps its size on the smallest phone) for three rounds started from a card
  (a nap doesn't count), then it goes (`snake-news` in localStorage). A first visit shows none: everything is new.
