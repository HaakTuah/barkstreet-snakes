# Calibration

The log of the checks that keep the review bar from slipping, the weekly blind re-reviews, the canaries and the monthly
slop checks, newest first ("Reviews", point 5, in `docs/claude-and-codex.md`).

| Date | Check | PR | Reviewer checked | Misses | What changed |
| --- | --- | --- | --- | --- | --- |
| 2026-11-02 | Blind re-review (week 2) | Snakes #221 (interface, 2u; its reviewer found nothing blocking) | Claude's reviewer | 1 by the letter (blocking; scored 8): the README not updated, a rule made an hour after #221 merged (#237), so none against the rules of its day | Already fixed by #241; non-blocking bug filed as #376; two in a row by the letter, so asked in #378, reading taken: brief unchanged |
| 2026-11-01 | Blind re-review (week 1) | Snakes #289 (engine rules, merged at 7, 9, 10) | Codex (its 10) and Claude's reviewer (its 9) | 3 (blocking; scored 7) | Follow-up entry 2s+, done (`docs/archive/progress-done.md`); the first miss, so no brief changed yet |
| 2026-11-01 | Canary (before this rule) | Snakes #298 | Codex | 0 of 3 | None needed |
