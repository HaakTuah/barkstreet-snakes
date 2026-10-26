---
name: round4-feedback
description: "Round 4 (2026-10-15/16): the owner's 18-point feedback after PR #25; done as PR #26 (feature/round4 -> main), awaiting the owner's review"
metadata:
  node_type: memory
  type: project
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-16T02:04:47.781Z
---

After PR #25 merged (2026-10-15), the owner asked to "plan and execute all" of:
- Is everything that was supposed to be in the game, in it?
- Woodpecker holes under bodies; holes looked bad (revamp visually and mechanically).
- Inputs: swipe = flash, tap = jump; Space = jump, E = flash; a regular flash for everyone.
- Own food poisoning?
- Too much food mid-round, too little at the end?
- Body food should rot.
- Borders instead of force fields (grand-strategy map style).
- AI should use powers often and to its advantage; see [[game-ai-fairness]].
- Stacking powers.
- A hue per power.
- Rivals eating mushrooms.
- Starving rivals should take risks.
- Event timings and power trade-offs.
- Controls feel delayed.

**Outcome (2026-10-16): [PR #26](https://github.com/HaakTuah/snake-game/pull/26), 117 commits on feature/round4.**
- **Process:**
  - Seven investigators measured each area first (perry-tools/r4-investigation.json).
  - Calls went into DESIGN "Round four".
  - Seven build agents ran (engine, then AI, then balance in sequence, the rest in parallel).
  - Two critique rounds: 47 findings, then 20 regressions, all fixed.
  - Pictures are on pr-media as round4-*.jpg.
- **Calls made after the agents:**
  - The draw lead is capped at half a tick; more pulled your head back.
  - The hunger bar is measured against your last meal (mealMs).
  - Three apples all round: two after 0:45 made the end starve.
  - A 13 s meal mid-round, so hunger matters.
- **Open for the owner** (listed in the PR):
  - feel the free 6 s flash and the 13 s mid-round meal;
  - try tap-to-jump on a real phone;
  - the middle is calmer (about 0.5 deaths before 2:00);
  - Gobbler at 13% on one seed;
  - online and the new sounds not tried by a person.

**Why:** the owner played after the polish pass; these are the feel and systems gaps they hit.

**How to apply:** if the owner merges #26 and sends more feedback, branch from main again. Related: [[check-pr-merged-before-pushing]], [[pr-pictures-branch]], [[workflow-agents-share-scratchpad]].
