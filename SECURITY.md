# Security

The floor's rules hold here whole: `core/floor/security.md` and `core/floor/topics.md`. This file adds, under the
floor's numbers, what only this game has and what the floor leaves to it; who might attack it is
`docs/threat-model.md`, with the floor's.

## What this game adds

3. **The protected files:** the trusted builder is Claude's builder sessions (`core/modules/roles.md`). The files:
   - **what runs by itself or with credentials:** `.github/`, `.claude/`, `scripts/cloud-setup.sh`, and
     `docs/developing.md` (the pushes of PR pictures);
   - **the rule files:** `AGENTS.md`, `CLAUDE.md`, `core-manifest.md`, `docs/claude-and-codex.md`,
     `docs/review-guidelines.md`, `docs/threat-model.md` and this file; with the copy of the core, `core/`, as the floor
     names it;
   - **the checks on the work:** the copies check (`core/scripts/copies.mjs` with `tools/copies.json` and
     `tools/copies-baseline.json`), the pointer and reading-size checks (`tools/pointers-test.js`,
     `tools/sizes-test.js`, `tools/sizes.json` and `tools/rule-files.js`), the licence check's config
     (`tools/licence-check.json`) and the calibration log (`docs/calibration.md`).
5. **Untrusted input, and its checks:**
   - **Online peers** (PeerJS, `net.js` and `online.js`): anyone with a room code. Their checks: each
     message's pinned shape (`tools/online-test.js`, `tools/protocol-shapes.json`); names through the one cleaner
     (`SnakeRecords.cleanName`); a colour, kind or id one of the game's own values; caps on counts and lengths, so
     nothing a peer sends stalls the host's tick.
   - **Shared records and Halls of Fame** (`records.js`): what friends send is cleaned (`cleanShared`) before it is
     stored or shown.
   - **URL parameters and room codes:** cleaned to their own alphabet and length (`cleanCode`).
6. **Where markup is built:** `innerHTML` and the HUD's markup (`game/hud.js`, `game/cards.js`), each escaping.
7. **What runs in players' browsers:**
   - **The third-party script:** PeerJS, from cdnjs, with its SRI hash (`PEERJS_SRI` in `net.js`); a new external
     script needs the same, or it does not go in.
   - **The content security policy** (the meta at the top of `index.html`; GitHub Pages sends no headers): the page
     runs code only from this site, its own inline scripts by their hashes and PeerJS's pinned file, and loads from
     or connects over the web only to this site and PeerJS's broker. What a policy cannot govern stays with the reviews
     (floor rule 8): WebRTC (the STUN servers `net.js` names, and any server a script could name for a connection of
     its own) and leaving the page (a link or `window.open`). A new version of PeerJS changes its address there too;
     anything new the page must load or reach goes into the policy by name, never by a wildcard, and into
     `tools/csp-test.js`, which pins the policy whole.
   - **The service worker** (`sw.js`): caches only this site's own files, never another origin's responses.
   - **Storage keys** (`snake-*`, `barkbite-muted`, `barkbite-music`) and `net.js`'s `PREFIX` are never renamed
     (players' records and online play depend on them), and hold no secret.
9. **What reaches past the lower stakes** here also includes code run in a player's browser from input that is not the
   player's own (a peer's message, a shared record).
10. **What ships** is the files the live site serves; its notices file is
    [`THIRD-PARTY-NOTICES.txt`](THIRD-PARTY-NOTICES.txt). The audit of every licence, with which list each is held to,
    is `tools/licences.json`.
17. **Dependabot's package files:** `tools/package.json` and `tools/package-lock.json` (and, for a version PR,
    `tools/licences.json`, their audit).

## Reporting a weakness

Through the Security tab, as "Reporting a weakness" in `core/floor/topics.md` says.
