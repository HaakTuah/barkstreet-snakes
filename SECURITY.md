# Security

The floor's rules hold here whole: `core/floor/security.md` and `core/floor/topics.md`. This file adds, under the
floor's numbers, what only this game has and what the floor leaves to it; who might attack it is
`docs/threat-model.md`, with the floor's.

## What this game adds

3. **The protected files,** besides those the floor names:
   - **what runs by itself or with credentials:** `scripts/cloud-setup.sh`, `docs/pr-pictures.md` (the pushes of PR
     pictures) and `tools/versions.json`, which the monthly versions workflow reads before it opens issues;
   - **the rule files:** `docs/review-guidelines.md`, `docs/slop-bar.md` and `docs/threat-model.md`;
   - **the checks on the work:** the configs of the core's copies, reading-size and licence checks
     (`tools/copies.json`, `tools/copies-baseline.json`, `tools/sizes.json` and `tools/licence-check.json`), the licence
     audit (`tools/licences.json`), this game's own part of the licence check and its test (`tools/licences.js`,
     `tools/licences-test.js`), and `tools/.npmrc`, which keeps install scripts off.
5. **Untrusted input, and its checks:**
   - **Notes on the public relays** (`net-relays.js`): anyone can post under a room's topic (one in 4,096 codes share
     it). A note is kept only in its exact shape (a handshake's point on the curve, ids of our own alphabet and length,
     a sealed box) and fresh; a session description only if it opens with the key the handshake (SPAKE2) agreed, and
     is of bounded length. A room takes one new handshake a second, eight at once, and leaves the relays after 50
     failed guesses (offers that don't open), friends already in staying; a point that unblinds to nothing is answered
     like any other, so that silence says nothing. A joining friend shakes hands with four rooms at most and agrees
     eight keys at most, each room once anew. A relay's own message is read only as Nostr's `EVENT` for our
     subscription, its size capped.
   - **Online peers** (PeerJS, `net.js`, `net-relays.js` and `online.js`): anyone with a room code. Their checks: each
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
   - **The content security policy** (the meta at the top of `index.html`; GitHub Pages sends no headers): the page runs
     code only from this site, its own inline scripts by their hashes and PeerJS's pinned file, and loads from or
     connects over the web only to this site, PeerJS's broker and the Nostr relays `net-relays.js` names, each one
     exact host on a line of its own:
     - `wss://relay.damus.io`
     - `wss://nos.lol`
     - `wss://relay.primal.net`
     - `wss://relay.nsec.app`
     - `wss://nostr.mom`

     The relays carry only handshakes and sealed notes, and nothing they send runs: the curve, the signing and the
     handshake are `net-relays.js`'s own code, on the browser's own crypto, with no script from them or anyone else. What a policy cannot govern stays
     with the reviews (`core/floor/security.md`, rule 8): WebRTC (the STUN servers `net.js` names, and any server a
     script could name for a connection of its own) and leaving the page (a link or `window.open`). A new version of
     PeerJS changes its address there too; anything new the page must load or reach goes into the policy by name, never
     by a wildcard, and into `tools/csp-test.js`, which pins the policy whole.
   - **The service worker** (`sw.js`): caches only this site's own files, never another origin's responses.
   - **Storage keys** (`snake-*`, `barkbite-muted`, `barkbite-music`) and `net.js`'s `PREFIX` are never renamed
     (players' records and online play depend on them), and hold no secret.
10. **What ships** is the files the live site serves; its notices file is
    [`THIRD-PARTY-NOTICES.txt`](THIRD-PARTY-NOTICES.txt), which the licence check holds every shipped entry's name in.
    The audit of every licence, with which list each is held to, is `tools/licences.json`.
15. **No install scripts:** `ignore-scripts` in `tools/.npmrc`, for every install of the tools' packages.
17. **Dependabot's package files:** `tools/package.json` and `tools/package-lock.json`, whose every package the
    licence check reads from the lock at each version.

## Reporting a weakness

Through the Security tab, as "Reporting a weakness" in `core/floor/topics.md` says.
