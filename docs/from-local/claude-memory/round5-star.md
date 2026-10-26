---
name: round5-star
description: "Round 5 (2026-10-17): the owner's idea, a new rival Star (Paper Mario mustached-star look, the old rainbow body, a power addict); done as PR #27"
metadata:
  node_type: memory
  type: project
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-17T15:49:04.819Z
---

After PR #26 merged (2026-10-16), the owner proposed a new rival, "Star". The owner asked what I thought, I recommended it with refinements, and they said "Go ahead!":
- **Look:** inspired by the original Paper Mario stars, the one with the big mustache.
- **Body:** the old rainbow body (Wildcard's, then Mute's, dropped when Mute became a mood ring); code in `git show ce71087^:render.js`.
- **Behaviour:** a power addict that flashes and jumps as often as it can.

My calls, in DESIGN "Round five: Star":
- **Head:** sunflower yellow, not Honey, with an ink outline. Gold means power; the crown and the combover are the precedent.
- **Tell:** the star twinkles when its flash is ready and dims while resting (counterplay).
- **Golden food:** a craving, to keep it stocked.
- **Safety:** it never powers into a crash, and it's tuned into the 15–35% win band.
- **Voice:** a jolly old-timer show-off.

**Outcome (2026-10-18):** [PR #27](https://github.com/HaakTuah/snake-game/pull/27) (feature/star -> main), open for review. 3 build agents, then a critique (13 findings, all fixed: the tell became a countdown on its points since Star flashes the instant it can; Copycat copying Star went pale rainbow instead of gold; face kept upright; golden dashes no longer thrown away; jumps avoid taken landings). Star wins 31/33%, everyone else 17-34%; 9.4 flashes/min vs 2.2. Pictures on pr-media as round5-*.jpg.

**Why:** round four's powers had no rival that showcases them.

**How to apply:** the same process as round four. Related: [[round4-feedback]], [[game-ai-fairness]], [[pr-pictures-branch]].
