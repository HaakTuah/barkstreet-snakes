# Developing Barkstreet Snakes

For people working on the game: how to run it locally, the checks and experiments, and how it is put together. The game itself is described for players in the [README](../README.md).

## Switches for the checks

- `--root DIR` runs the simulation on another copy of the game files.
- The browser suites (scope, render, input, layout, ui, csp) drive a headless Chrome through `tools/browser.js`: it looks in
  the usual places, or set `CHROME=/path/to/chrome`; `CI=1` runs it without its sandbox, which is needed as root
  (`scripts/test.sh` sets it). The layout suite is the long one: whole, in one process, about 30 minutes on a cloud
  machine, printing only each part's end until its results come at the end, so `scripts/test.sh` runs its five CI jobs
  side by side, as CI does (logs: `layout-1.log` to `layout-5.log` beside the others).
- Optional: `SIM_WORKERS` sets the simulation's cores, `BARKBITE_PRIORITY=normal` for timing runs, `ONLINE_SEEN=1`
  makes online-test print what it saw, `LAYOUT_JOB=N` runs one of the layout suite's five CI jobs.

## Updates: what this game adds

The REST calls from a cloud session: `core/modules/github-calls.md`. Updates, Dependabot, Node and CodeQL:
`core/modules/updates.md`, with floor rules 7, 15 and 17 (`core/floor/topics.md`); this game's part of them:

- **What Dependabot cannot see** (PeerJS, loaded from cdnjs with its SRI hash) is listed in `tools/versions.json` for
  the core's monthly versions check, and `scripts/test.sh versions` checks offline on every PR that each pattern still
  finds exactly one version. A lane taking an update works from what
  `node core/scripts/versions.mjs tools/versions.json` prints on `main`, the issue's text being data (floor rule 4).
- **PeerJS, what ships to players,** gets floor rule 7's source check with this game's specifics: the readable build in
  the package (`dist/peerjs.js`) is what is diffed (that the minified file is the same code rests on the publisher,
  signature and provenance checks, and the PR says so); `PEERJS_SRI` is computed from the minified file inside that
  verified package, so browsers run only those bytes; and on the PR's preview one online round shows cdnjs serves the
  same. The policy that limits a bad release's harm: `SECURITY.md`, rule 7.
- **The tools' packages** (TypeScript, Playwright) are in `tools/package.json` and its lock, at exact versions: the one
  place CI's types step, `scripts/cloud-setup.sh` and `scripts/test.sh` read them from (`npm ci --prefix tools`, into
  `tools/node_modules/`, never committed), and Dependabot's npm updates aim at it; the licence check reads each
  package's licence from the lock at every version. The game itself ships no dependencies.
- **The signature check** (`.github/workflows/signatures.yml`) runs the core's on every pull request. Where one changes
  a package list or a lock file anywhere in the repository, an `.npmrc` or the Node version, it installs the tools'
  packages from the registry alone with no install script run, then runs `npm audit signatures`, npm's own check of the
  registry's signature on each installed package (floor rule 7); where it changes none, it passes at once. It cannot run
  in a cloud session, which cannot reach Sigstore; the pull request's own run is the check. It reports on every pull
  request, so a ruleset can require it; until one does, merge only once it is green, and not by auto-merge alone.
- **Node:** the core's one exact pin, `core/.node-version`, which CI and the cloud setup read ("Node" in
  `core/modules/updates.md`); here a move also keeps the fingerprints.
- **The description check** (`.github/workflows/pr-description.yml`) runs the core's on every pull request that is no
  draft: it fails one whose description lacks the heading "What the owner can try" or "Readings taken", and passes by
  itself once the description is put right. Where there is nothing to say, the heading stands with "None" under it.
- **The licence check** (`.github/workflows/licences.yml`) runs the core's, `core/scripts/licences.mjs` with
  `tools/licence-check.json`, against the audit, `tools/licences.json`, and the notices, `THIRD-PARTY-NOTICES.txt`; what
  it and its scan hold is in the headers of `core/scripts/licences.mjs` and `core/scripts/licence-scan.mjs`. Beside it,
  `node tools/licences.js` checks what only this game has: every address the game loads is an audited
  entry's, each Google Fonts family a font of its own, and `sw.js` keeps the notices. `tools/licences-test.js` stages
  each form of those that must fail; the core's tests cover the rest. `scripts/test.sh licences` runs both. Something
  new goes into the audit with its licence, checked from its own published licence file.

## Run locally

`.claude/launch.json` serves the folder on port 5173. Or serve it with any static server (for example `npx serve` or `python -m http.server`) and open it in a browser. Opening `index.html` directly works too.

- `?perf` shows a frame-time overlay (toggle it with the ` key).
- `?debug` adds `SnakeDebug` to the console, for example `SnakeDebug.setup(['sniper', 'mason', 'ghost'])` to start a round against chosen rivals, or to watch them: **Watch AIs** from its card watches them, with a fourth at random.
- `node tools/records-test.js`: shared and played-together rounds land in each friend's Hall of Fame exactly once; a browser that won't keep records still has them until the tab closes.
- `node tools/markup-test.js`: no markup the page writes (`innerHTML` and the like) reads a name or other text a person or a peer gives (`SECURITY.md`, rule 6); the scope suite runs it.
- `node tools/net-test.js`: `net.js`'s connections on stand-ins for PeerJS and the relays, each way a room can be reached or not (the broker first, the relays as well when it can't find the room), and the lobby's words naming which part failed (finding each other, or the route); then in headless Chrome, `net-relays.js`'s signing against BIP-340's test vectors and the online round trip through the relays, a host and a friend in two windows. Its header says what it leaves to the PR's preview (`?way=broker`, `?way=relays`).
- `node tools/online-test.js`: plays rounds through the online protocol and checks a friend's screen against the host's every tick, with staged chokes and nudges, every way to be out and every kind of engine event crossed at least once, and malformed messages fed in. Its header lists every check.
- Every tool that plays without a page (the simulation, the suites, `bench-ai.js`, `abtest.js`, the dev tools) loads the game's rules and rivals as the page does, through `tools/game-files.js`: `tuning.js`, then the AI's files and the engine's, in `index.html`'s order. A copy given to one (`--root`, `--versus`, `--base`) is read the same way, from its own `index.html`.
- `node tools/simulate.js 200` plays 200 AI-only rounds headlessly with the game's own rules and AI, and prints each personality's win rate, food, kills, how snakes die and so on. Add `--seed 1` to repeat a run exactly (on any machine), `--check` to fail on a stalled round or a personality that never wins, `--census` to count what a round holds (golden things, weather, lightning, the woodpecker, powers, how hungry snakes are before the woodpecker comes and after; the beetles: how each one above ground ends, caught, down a burrow, dug in, flown off or pecked, the same for the chased ones and how long a catch takes, digs and those caught digging, dives into burrows a dig left, burrows open and cells free for an apple; and the woodpecker's fairness: food knocked aside, how much the bird ate and what a snake ate where it landed, and how soon, marks that shut a snake in and the deaths after them, crumbs of log cut off, and how often the biggest island's snake wins against a blind pick), `--signatures` to measure each personality's trademark against the field, and `--root <dir>` to play another copy of the game, to compare versions.
- `node tools/bench-ai.js [--base REV|DIR] [--root DIR] [--seed N] [--repeat R] [--only before|after]` times the rivals' thinking: `decide()` on positions recorded from seeded AI-only rounds, in two copies of the game side by side (by default the last commit's and the files as they are), and checks that every position decides the same in both. Run it before the `simulate.js` fingerprints whenever the AI changes: it's quicker, and it says which positions went another way. Its CPU time is the deciding thread's alone, leaving out the compiling V8 does in the background (a whole `simulate.js` run pays for that).
- `node tools/rules-test.js [--seed N]` (N: other randomness for the checks that don't seed their own) checks the rules on hand-built boards: tails, head-ons, starving, the woodpecker's outline, floor, fight and knocked food (`tools/rules/30-outline-floor-fight.js`), beetles and burrows, beads, coughs, what the AIs can see, the rivals' reading of the woodpecker and the beetles, Star's habit, and the owner's playtest. The parts' headers in `tools/rules/` list the checks.
- `node tools/chatter-test.js`: every line has its Chinese and none is left over, every punchline is said by someone, no voice has more than four lines of one shape, then the chatter is played through staged moments and a few whole AI rounds, and the sound (on a stand-in AudioContext) is checked. Its header lists every check.
- `node tools/csp-test.js`: the page's content security policy (`SECURITY.md`, rule 7), pinned whole (it prints the inline scripts' new hashes when one changes); then, in headless Chrome, that the page starts and plays with nothing refused, and that code or contact from anywhere else is.
- `node tools/input-test.js`: the controls in headless Chrome with real key, touch and mouse events on a steady 60 Hz clock, the lessons and their sounds (each 60 characters or fewer), and the banners' timing and place. Its header lists every check.
- `node tools/ui-test.js`: the owner's playtest in headless Chrome, with a mouse, keys and touch on a desktop and two phones: the cards, the Field guide's doors, the header's rows and the first good round's cards fitting. Its header lists every check.
- `node tools/render-test.js`: the renderer's promises a picture can show, in headless Chrome (the Field guide's pictures, Star's look, jumps, bridges, choking, the woodpecker and its knock, beetles and burrows). Its header lists every check.
- `node tools/layout-test.js`: the page on 24 screens and 11 desktops in headless Chrome, phones upright and on their sides, tablets, and a sweep of heights: the board's size, nothing scrolling, the header's rows, the chatter, the woodpecker's perch and the banners. Add part of a screen's name, such as `390`, to check just those screens. Its header lists every check.
- `node tools/shots.js [dir]` takes the screenshot tour in headless Chrome with an autopilot at the wheel; `--staged [names]` takes only the staged moments (jump, bridge, star-gag, choke, dig, heal, knock, knock-flight, flag), at desktop 2x, a phone both ways at 3x and with reduced motion.
- `node tools/bench.js [seconds] [--root dir]` times the drawing in headless Chrome (a watched AI round and the staged boards of `tools/scenes.js`: powers, a woodpecker strike, fire, Star's look, the woodpecker itself); `--base REV|DIR [pairs] [--scenes a,b]` times this copy against another in one page, side by side, and prints each scene's ratio with its quartiles; `node tools/trace.js [seconds]` adds what script timings can't see, the browser's own work from a Chrome trace. Run by hand when a drawing change needs measuring, not part of the checks. Chrome is needed (or set `CHROME`).
- `node tools/title-s.js` draws the S of Snakes, the title's honey snake, and writes it into `index.html` and `style/base.css` (between their "title-s" marker comments), so its shape is changed there, never by hand; `--preview=FILE.html` also writes a big still of it over Fredoka's S.

## Running experiments

A balance question ("does this shorten sudden death?", "did my change hurt anyone?") is cheapest answered in three steps:

1. **Screen it with `tools/abtest.js`**, which plays two copies of the game on the same seeded rounds, paired, and stops as soon as every number it waits for has a verdict (B higher, lower, or the same within a margin that matters), with the chance that any verdict is wrong at most 5% however early it stops. It plays seeds 3 and 11, 100 rounds at a time. Ask only for what the question is about, since every number asked for widens every interval: `--metrics` picks from `length`, `sd`, `deaths`, `starving` and `powers`; `win` and `place` are shown but not waited for; `trademarks` when a change mustn't blunt them. The tool's header has the rest.

   `node tools/abtest.js . ../variant --metrics sd,deaths`

2. **Fast-forward a late-game question.** `--at 120000` stores every round at 2:00, as A plays it, and plays both copies on from there. The openings, most of a round's work, are played once, and the two sides are the same round up to then, so a difference shows sooner. By hand, `simulate.js --save-at` stores the rounds (and prints where) and `--from` goes on with them under any copy; with the same files, every round comes out exactly as played straight through.

   `node tools/abtest.js . ../variant --at 120000 --metrics sd`

   `node tools/simulate.js 600 --seed 3 --save-at 120000`, then `node tools/simulate.js --from FILE --root ../variant --census`

3. **Confirm once, at the end, on fresh seeds.** Seeds 3 and 11 chose what you kept, so their rounds can't confirm it: a variant that won a lucky streak there would only be confirmed by the same streak. Ask the same question on seeds the screening never played, and take the numbers you'll report from those rounds:

   `node tools/abtest.js . ../variant --seed 29 --seed 41 --metrics sd,deaths`

   `node tools/simulate.js 600 --seed 29 --census --root ../variant` (and `--seed 41`). `--census` includes a table for each personality (flashes and jumps a minute, golden pickups, chokes, crashes survived, time alive, food, kills), so there's no need for a harness of your own.

Every seeded round is cached by the files that played it, so asking again or for more plays only the new ones: the A side of one experiment is free in the next, and the confirming abtest's rounds are free in its `--census`.

## How it's put together

| File | What it does |
|------|--------------|
| `tuning.js` | Every number that shapes how the game plays and feels, in one place. |
| `engine/` | The rules: moving, eating, dying, hunger, the woodpecker, in files by system (listed in `engine/core.js`). No drawing, so it also runs in Node. |
| `ai/` | The rivals' brains and personalities: a file for each part of a decision and one for each rival, sharing one scope (the list is at the top of `ai/core.js`). |
| `render/` | Draws the board on a canvas, with smooth movement between ticks: a file for each thing it draws, sharing one scope (the list is at the top of `render/core.js`). |
| `audio/` | Sound effects and the adaptive music, synthesised live: `cues.js` (every cue), `music.js`, `weather.js`, then `sound.js` (the synthesiser, playing, mute; makes `SnakeAudio`). |
| `chatter/` | The rivals' speech bubbles and chat log: their lines, in English and Chinese, and the talk (the list is at the top of `chatter/voices.js`). |
| `records.js` | The Hall of Fame and your stats. |
| `lineup.js`, `scores-screen.js` | The start card's seats and deck; the Hall of Fame and stats drawn. |
| `version.js`, `update.js` | The version and the news; the page's update check. |
| `online.js` | Play with friends: the messages between host and friends. |
| `net.js` | Play with friends: the connections, on two ways in (PeerJS, loaded only when used, and the relays). |
| `net-relays.js` | Play with friends: the second way in, over public Nostr relays (its own signing and sealing). |
| `game/` | Ties it together: the game loop, input, the cards, the controls and the lobby: a file for each thing it does (the list is at the top of `game/core.js`). |
| `index.html`, `style/`, `fonts/`, `sw.js` | The page; its styles, a file for each part of the page (listed in `style/base.css`); the lettering's files (Fredoka, linked by `style/font.css`); the service worker that keeps it playable offline. |
| `tools/` | The suites (`*-test.js`, each running its folder of parts, such as `tools/rules/`, through `tools/parts.js`), the simulation (`simulate.js`, its parts in `tools/sim/`), `abtest.js`, `bench-ai.js`, the headless-Chrome driver `browser.js`, and `protocol-shapes.json`, the online messages' pinned shapes. |
| `jsconfig.json`, `types/globals.d.ts` | The online messages' types, with the JSDoc in `net.js`, `net-relays.js` and `online.js`: checked by `tsc` (the types suite), never shipped. |
