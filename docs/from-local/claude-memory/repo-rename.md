---
name: repo-rename
description: "The GitHub repo is HaakTuah/barkstreet-snakes since 2026-10-18 (was snake-game); Pages at /barkstreet-snakes/; no redirect for the old link, on purpose"
metadata:
  node_type: memory
  type: project
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-18T11:26:45.490Z
---

The repo was renamed snake-game -> **barkstreet-snakes** on 2026-10-18 at the owner's request, after the game became Barkstreet Snakes ([[next-round-ideas]]).

- Play: https://haaktuah.github.io/barkstreet-snakes/. The old Pages URL 404s.
- Description, homepage and 10 topics are set on the repo. The local remote points at the new name. The local folder is still snake-game.
- PR #29 (MERGED 2026-10-18 11:33Z, main 6d478ed) carried the rename commit 6fc1607 plus the new links and the sw.js fix to the live site. feature/powers-2 has the same changes (150da38).
- GitHub's own redirects work: all 107 raw picture links in old PR bodies still load under the old name. Never create a new repo named snake-game: that would kill those redirects.
- The game's sw.js clears only caches named barkstreet-snakes-* or bark-and-bite-*. Every project site of the account shares the haaktuah.github.io origin, and so does localStorage, which is why records survived the path change.

**Why no redirect site:** the owner said nobody will miss the old link (shared with 3 people, an early build), and that a user-site redirect plus service-worker retirement was excessive care.
**How to apply:** don't over-engineer link continuity for this project; it has a handful of users.
