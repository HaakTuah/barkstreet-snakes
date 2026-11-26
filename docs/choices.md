# Choices that are hard to undo

The *choice records* of `core-manifest.md` (`core/tasks/choices.md`).

Read whole: 2026-11-26.

## Choice: plain HTML, CSS and JavaScript, no build step, no dependencies in the game

The game is the files the browser loads, as written: no bundler, no framework, no package in what ships. Chosen so the
page runs from any static host or a folder, so every file a player gets is a file someone reads, and so nothing in
what ships can be pulled in from another publisher (`AGENTS.md`: "no build step and no dependencies, which is one of
its features"; `tools/package.json`: "the game ships no dependencies"). Types are checked by `tsc` over JSDoc
(`scripts/test.sh`), not compiled. A cost it carries: each file is a script tag and an `sw.js` entry (`AGENTS.md`).

- Stood before: this record; the first commit (11 October 2026) was a single HTML page.
- Reopens it: a job a maintained package does that the game writes by hand grows past its share: hand-written code
  for a job such a package covers passing about 2,000 lines, or a bug in hand-written code a package would have
  prevented reaching players twice in a quarter; or the load of the page on a mid phone passing its budget in
  `docs/design/45-performance.md` because files cannot be bundled.
- The core cannot read: none.

## Choice: online play peer to peer, through PeerJS and public Nostr relays

Players' browsers connect directly (WebRTC through PeerJS, `net.js`); they find each other through several free public
Nostr relays at once, so no one is needed (`net-relays.js:3`), and the host's browser runs the round (`online.js`).
Chosen so online play needs no server of the project's own, no accounts and no cost (`docs/design/22-play-with-friends-online.md`).
PeerJS is loaded from cdnjs with an integrity hash only when someone opens Play with friends (`net.js:20`, `:58`); the
relays are named hosts in the page's content security policy (`index.html:7`).

- Stood before: this record; online play since 12 October 2026 (`net.js`), the relays added later.
- Reopens it: rooms that fail to connect: more than 1 in 10 attempts failing across a month of reports, or two of the
  named relays gone at once; PeerJS unmaintained (no release in 18 months, read by the monthly versions check); or a
  need the host-runs-the-round design cannot meet (a guest's input reaching a round later than the human limit of
  `docs/design/10-feel-targets-checked-in-phase-7.md`).
- The core cannot read: none.

## Choice: hosted on GitHub Pages from the `gh-pages` branch, a preview a pull request

`main` is published at the site's root by `.github/workflows/pages.yml` on each merge; each pull request gets a preview
under its own path through the core's preview workflow (`preview.yml`). Chosen because it is free for a public
repository, needs no server and keeps every merge live (`AGENTS.md`: "every merge goes live").

- Stood before: this record; previews since 11 November 2026.
- Reopens it: a need Pages cannot serve: a response header the meta tag cannot give (the page's policy needs one,
  such as `frame-ancestors`), a server the online design comes to need, or the site's address changing (old links
  redirect from the former repository: "Never create a repository named `snake-game`").
- The core cannot read: none.

## Choice: built and tested on Node and headless Chromium, on Ubuntu runners

The suites run in Node (`tools/*-test.js`, `scripts/test.sh`) and the screen suites in headless Chromium through
Playwright (`tools/package.json`), on `ubuntu-latest` (`.github/workflows/tests.yml`); cloud sessions get the same
through `scripts/cloud-setup.sh`. Chosen because both run where the sessions work and in CI at no cost. Not bound to
one platform: the game itself runs in any modern browser; only its tests use Chromium.

- Stood before: this record; the tools' packages since October 2026.
- Reopens it: its tests cannot run where its sessions work; or a bug that players see in another engine (Safari,
  Firefox) and the Chromium suites cannot catch, reported twice in a quarter.
- The core cannot read: none.

## Choice: players' data kept in the browser's `localStorage`

Scores, statistics, settings and records stay in the player's browser under fixed keys (`snake-*`, `barkbite-muted`,
`barkbite-music`, `barkbite-voices`), never renamed (`SECURITY.md`, rule 7); a reader falls back on bad data
(`records.js:27`). Chosen so there is no account, no server and nothing personal leaves the device.

- Stood before: this record; the first scores were kept this way in October 2026.
- Reopens it: a player's data lost by the browser often enough to be reported (twice in a quarter), or a feature the
  owner agrees to that needs data across devices (records followed between a phone and a desktop).
- The core cannot read: none.

## Choice: one content security policy in a meta tag, as the page's only header

Pages serves no headers of the project's, so the page states its policy in `index.html:7` (`default-src 'none'`, the
relays and cdnjs named), pinned by `tools/csp-test.js`. Chosen with the host: what a static host allows.

- Stood before: this record.
- Reopens it: a protection only a real header gives becoming needed (framing, a report endpoint), or a move off Pages.
- The core cannot read: none.

## Choice: a service worker keeps an offline copy and updates between rounds

`sw.js` caches the game's same-origin files; `update.js` and `version.js` bring the newest version between rounds
(`docs/design/36-updating.md`). Chosen so the game opens offline and players always play the newest version without a
reload mid-round.

- Stood before: this record; since November 2026.
- Reopens it: a player kept on an old version after an update: any report of one, or the ui suite's update check
  failing on `main`.
- The core cannot read: none.

## Choice: the tools' own packages: TypeScript, Playwright and Stryker

The checking tools are the only packages: TypeScript and Playwright in `tools/package.json`, Stryker in
`checks/mutation/package.json`, each at an exact version with its lock, scripts not run on install (`.npmrc`), updated
by Dependabot after a week's cooldown (`.github/dependabot.yml`). Chosen as the maintained tools for types, a real
browser and test strength, kept out of what ships.

- Stood before: this record.
- Reopens it: a package's licence or maintenance failing the licence or versions check, or a suite whose run time
  doubles from one of them.
- The core cannot read: none.
