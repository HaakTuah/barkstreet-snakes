---
name: check-pr-merged-before-pushing
description: "Before pushing follow-up work to a PR's branch, check whether that PR is already merged; if so, open a new PR"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-14T16:08:13.060Z
---

Before pushing more commits to an existing PR branch (or telling the user "pushed to PR #N"), run `gh pr view N --json state` first. If it's MERGED, put the work on a fresh branch from the same commits (or from main) and open a new PR.

**Why:** PR #10 (polish/second-pass) was merged on 2026-10-13, but six later feature commits kept going to its branch while I reported them as "pushed to #10, still open". None of them reached main, and the user had to point it out ("10 was completed a long time ago. Need every new feature in"). Fixed with PR #11.

**How to apply:** Any follow-up request after a PR was opened → check that PR's state before pushing. The user merges PRs themselves (see [[game-ai-fairness]] for other standing rules), and sometimes does so without telling me.

**Stacked PRs strand.** On 2026-10-14 the user merged #22 (balance → main), then #23 (looks-lines → feature/balance) and #24 (powers → feature/looks-lines): the upper two landed only in their base branches, never in main. So don't stack PRs on each other's branches; target main (if one builds on an unmerged one, say in the body that merging it carries the other, and link a compare view of just its own commits). After any merge, check `git merge-base --is-ancestor <tip> origin/main`.
