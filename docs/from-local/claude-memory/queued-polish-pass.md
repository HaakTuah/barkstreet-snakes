---
name: queued-polish-pass
description: "Third polish pass (handcrafted-snake brief): done 2026-10-15 as PR #25 (polish/extreme -> main, also lands the stranded #23/#24)"
metadata:
  node_type: memory
  type: project
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-14T16:08:15.463Z
---

The user queued, on 2026-10-14, a third **polish to the extreme** pass, to start once the three PRs of that round were open: [#22](https://github.com/HaakTuah/snake-game/pull/22) (balance, base main), [#23](https://github.com/HaakTuah/snake-game/pull/23) (looks and lines, base #22), [#24](https://github.com/HaakTuah/snake-game/pull/24) (powers, base #23). They were all opened that day, and the pass started on branch `polish/extreme`, branched from `feature/powers`.

Basing it on #24 rather than main is an adapted guideline: polishing pre-PR code would conflict. Record that in DESIGN.md. All three were merged on 2026-10-14, but #23 and #24 only into their stacked bases (see [[check-pr-merged-before-pushing]]), so the polish PR targets **main** and carries them; its body links a compare view of just the polish (feature/powers...polish/extreme).

The brief, in short:
- **Git.** Clean tree; never commit to main. Logical commits: audit/design docs, loop+input, performance, visuals, audio, copy, accessibility, final polish.
- **Phase 1.** Read everything, play it in a browser, take before screenshots of every state and baseline frame times, and write an honest AUDIT.md before touching code.
- **Phase 2.** DESIGN.md: one art direction, the snake as a character, food and world, borders, voice, feel targets, and every skipped or adapted guideline with a one-line reason.
- **Phases 3–6.**
  - Loop and input: a fixed timestep with interpolation, a 2–3 turn buffer, no reversal, all the controls, fair rules, a gentle difficulty curve, auto-pause on blur, localStorage in try/catch, instant restart.
  - Juice with restraint: Web Audio, reduced motion.
  - Measured performance: a dev frame-time overlay, profiling, zero allocation, cached sprites, DOM writes only on change.
  - Craft: a crisp DPR canvas, accessibility.
- **Phase 7.** Play for real: rapid turns, pause mid-turn, tab switch, resize, touch, a long fast run, a near-full board, storage off. Screenshot every state, re-measure, list at least 10 nits and fix them, repeat. Clean out debug code, dead code and magic numbers. Push and `gh pr create` with the vision summary, changes by area, before/after screenshots (title, play, game over, mobile), before/after frame times and open questions. Don't merge.
- **Final report:** the PR link, a summary, the perf numbers, the skipped or adapted guidelines, and the tuning constants.

Outcome (2026-10-15): [PR #25](https://github.com/HaakTuah/snake-game/pull/25), 40 first-parent commits on polish/extreme, after the audit, three build agents and three critique rounds (72, 67, 58 nits; each round's fixes caused some of the next). Long-snake frame 5.5-5.8 -> 3.8-4.0 ms; fields 11-12 -> 6.1-6.7 ms (the 1.5x fields target is still unmet). Pictures on pr-media as polish3-*.jpg.

Earlier progress notes:
- `tools/trace.js` was added: Chrome-trace busy time per thread.
- Baseline numbers are in `<session temp>/perry-tools/baseline-3.md`. Headline regressions: draw() frames of 120–650 ms in the long-snake scene; the median frame at 4× is 4.7 ms; the GPU is saturated at ~25 ms per frame for long snakes.
- Before screenshots are in `docs/screenshots/before-3/`.
- An 8-lens audit workflow was running.

**Why:** the user wants every pixel, millisecond and word to feel handmade; depth over breadth.

**How to apply:** under ultracode, use workflows (an audit fan-out, adversarial review), and keep tools outside the scratchpad. Related: [[snake-testing-headless-chrome]], [[pr-pictures-branch]], [[check-pr-merged-before-pushing]], [[workflow-agents-share-scratchpad]].
