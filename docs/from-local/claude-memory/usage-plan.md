---
name: usage-plan
description: Check weekly usage after every commit; wrap up as it approaches 95% (a lighter item may still start at 94%); two sessions share the limit
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-20T07:22:58.032Z
---

The owner (2026-10-20): two of their Claude Code sessions share the weekly limit.
- **Check usage after every commit** (mcp__ccd_session_mgmt__get_usage, "Weekly · all models").
- **Raised 2026-10-20** (the owner: "Let's push it up"): work on until usage approaches 95%, and a lighter item may still start at 94%. **Don't stop early:** I stopped at 89% once when the line was 92%, and the owner corrected it. When the line is reached, wrap up:
  1. Bring the current work to a clean commit that builds and runs. Leave anything half-done out of it, and note it.
  2. Push the branch and open a PR (a draft if something is unfinished), so the owner can test the new features and polish.
  3. In the PR description, list what's new, how to try each thing, and anything known to be broken or left unfinished.
  4. Leave a short note of where you stopped (in [[next-round-ideas]]), so the next session can pick up, then stop.

**Why:** workflows burn usage in lumps (several agents at once), and the other session needs room too.

**How to apply:**
- Before launching a workflow, weigh its cost against what's left; near the line, prefer finishing and shipping over starting.
- Workflows stopped with TaskStop can resume from their journals (completed agents are cached).
- Look for stray child processes after stopping a workflow (simulate.js, chrome).
