---
name: pr-pictures-branch
description: "PR screenshots go on the orphan `pr-media` branch (never merged), linked from PR bodies via raw.githubusercontent URLs"
metadata:
  node_type: memory
  type: reference
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-14T00:39:43.006Z
---

The owner reviews PRs from pictures ("in its own PR, with pictures, so I can decide"). Screenshots live on the orphan branch `pr-media` of HaakTuah/barkstreet-snakes (public repo; was snake-game), never merged, never touching main. Add files without touching the working tree: `git hash-object -w <file>` for each, `git ls-tree origin/pr-media` + new entries into `git mktree`, `git commit-tree <tree> -p <old>`, `git push origin <commit>:refs/heads/pr-media`. Link as `https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/<commit SHA or pr-media>/<name>`. Name files by PR number (pr19-*.jpg).

Never link PR pictures or docs by a feature branch's name (raw.githubusercontent.com/<repo>/<branch>/... or blob/<branch>/...): merged branches get deleted and the links break (it happened 2026-10-18 to PRs #4-#10 and #25; fixed by repointing to each PR head SHA). Use pr-media, or a commit SHA. Since PR #28 the old docs/screenshots also live on pr-media under screenshots/, and main holds only the game and its docs.

Related: [[snake-testing-headless-chrome]] (how the screenshots are made), [[check-pr-merged-before-pushing]].
