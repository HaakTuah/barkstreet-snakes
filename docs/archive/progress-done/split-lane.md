# Progress: done

## The split lane, done (moved 31 October 2026)

- `audio.js` became `audio/` (PR #225): `cues.js` and `sound.js`, sound proven unchanged by `docs/archive/studies/same-sound.js`.
  `chatter/zh.js` became `zh.js` and `zh-more.js` (PR #226), checked by `docs/archive/studies/same-zh.js`.
- Chatter split by meaning (the owner, 2 November 2026; PR #318): a file per rival in `chatter/voices/` over a shared
  core, with the impressions and the talk on their own, listed in `chatter/voices.js`.
- The workshop check's point (2), 2 November 2026: `docs/PROGRESS.md` back under 20 KB (10 KB, item 6's spec moved to `docs/handoff/queue-specs.md`) and `AGENTS.md` at 20 KB.
- The unused-code check, the workshop check's point (5) (PR #331): unused code removed and done study tools moved
  from `tools/dev/` to `docs/archive/` (`docs/archive/README.md` lists them).
- The file-by-file review's moves (2 November 2026), a folder a PR, behaviour proven unchanged by the fingerprints and
  the suites: render/ (PR #341: the food, the jumps, the fire and the bird's memory each in one file; the seeded random
  and the sine hash written once), game/ (PR #342: `banners.js` split into banners, toasts and cards), chatter/ and
  `records.js` (PR #343: `records.js` split into the records, `lineup.js` and `scores-screen.js`), audio/ (PR #344:
  `sound.js` split into the synth, `music.js` and `weather.js`), tools/ (PR #345: `seeded()`, `ok()` and the runners'
  `check()` written once; `chatter/04` and `rules/03`'s woodpecker boards made scripted boards). `render/09-chomps.js`
  stays in the render suite: it drives the real page, which the chatter suite can't without a weaker stand-in.

- **The design by topic, not by round** (#336; the owner, 2 November 2026): each topic's current rule moves from the
  round files into its topic file in `docs/design/`, superseded versions and measurements to `docs/archive/`. A slow
  side lane, one topic per docs-only PR, taken when a lane is free; code comments citing a section are checked.
  Done: food (round four's "Food", round six A's food and beetles into `04-food-and-the-world.md`; PR #425). The
  playtest's burrows and beetles (32) followed (PR #426). The woodpecker
  followed, in a file of its own, `38-the-woodpecker.md` (PR #428). The rivals
  followed, in `39-the-rivals.md` (PR #429). The snakes'
  looks followed, in `03-the-snake-as-a-character.md` (PR #430). The powers and
  moves followed, in `40-powers-and-moves.md`, and the crashes in `41-crashes.md` (PR #432). Sound followed, in
  `21-sound.md` (PR #433). The page followed, in `31-phones.md`, `33-one-screen.md` and `42-controls.md`
  (PR #435). Online and the start card followed, in `22-play-with-friends-online.md` and a new
  `43-the-start-card-and-records.md` (PR #436). Teaching followed, in `30-teaching-by-showing.md` (PR #437). The food
  and world's leftovers followed (PR #440). The rivals' leftovers followed (PR #444). The small leftovers followed
  (PR #446). Performance followed, in `45-performance.md` (PR #449). The rivals' chatter followed, in
  `13-lines-and-announcements.md` (PR #450). Next: the new topics (the round's arc, balance targets), then the history, as listed in `docs/handoff/design-by-topic-left.md`.

