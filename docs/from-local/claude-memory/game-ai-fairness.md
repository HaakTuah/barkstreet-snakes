---
name: game-ai-fairness
description: "Barkstreet Snakes: rivals never treat the human differently, and no ability may be one only people use; every new move needs AI use plus an anti-exploit check"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-19T05:37:47.818Z
---

The AI snakes must not know or care which snake is the human. No `isPlayer` (or anything equivalent) in AI logic or in what the AI is shown; rivals judge the player only by observable behaviour, like any other snake. The UI may single the player out; the AI may not.

**The core premise** (the owner, 2026-10-19, on riding others' backs over pits): "no abilities that only human players use".
- Every move or rule a person can use, the rivals must use too, when it pays, by their own styles. They must also see it used against them.
- Rules tests must prove both.
- If the rivals can't learn a move well, the move doesn't go in.

**No refuges:** a new move must never become a way to be safe ("a technique that can make you invulnerable"). It must take timing and skill. Measure how often it's used, how often it fails, and whether users outlive everyone else; tighten or drop it if it's a refuge.

**Why:** the owner strongly dislikes games where the player is treated differently from other entities (they rejected an AI that preferred hunting the player). A move only people can use is the same unfairness the other way round.

**How to apply:**
- When adding or tuning personalities in ai.js, use only `aiView()` data (ids, bodies, food, holes), and review any new targeting logic for player bias.
- For every new rule: write the AI's use of it, a test of it being used against the AI, and an exploit check in simulation.

See also [[snake-testing-headless-chrome]], [[next-round-ideas]].
