# Calibration

The log of the checks that keep the review bar from slipping, the weekly blind re-reviews, the canaries and the monthly
slop checks, newest first ("Reviews", point 5, in `docs/claude-and-codex.md`).

| Date | Check | PR | Reviewer checked | Misses | What changed |
| --- | --- | --- | --- | --- | --- |
| 2026-11-07 | Caught later, by Codex's security review on milestone #579 | Snakes #576 (AI, 2q; merged with Codex's code review clean and Claude's design check at 10) | Codex (its security review on #576 found nothing, though the commit it reviewed held the online fix; its code review came back clean) | 1 (P2, security): 2q's online fix had a friend's copy scan the host's raw gold-portal rows for every flight cell, before any check or cap, so a hostile host could stall the guest's tab | Fixed in #581 (the rows checked once and capped at 512; its security review clean). Codex's last check before (canary #545) had no misses, so not two in a row |
| 2026-11-06 | Canary, again at once after #523's misses | Snakes #545 | Codex | 0 of 5 (the bug, the broken standing rule, the security hole, the design departure and the guidelines-only line all found) | Tests for #523's two misses added in #544 |
| 2026-11-06 | Canary (the guidelines' move to `docs/review-guidelines.md`) | Snakes #523 | Codex | 2 of 5: the bug (the jump's size check `<=` to `<`) and the security hole (a friend's name through `innerHTML`); it found the broken standing rule, the design departure and the guidelines-only line ("Text a player reads"), so it follows the pointer | Two in a row for Codex (after week 1's blind re-review): tightening asked in #528 |
| 2026-11-02 | Blind re-review (week 2) | Snakes #221 (interface, 2u; its reviewer found nothing blocking) | Claude's reviewer | 1 by the letter (blocking; scored 8): the README not updated, a rule made an hour after #221 merged (#237), so none against the rules of its day | Already fixed by #241; non-blocking bug filed as #376; two in a row by the letter, so asked in #378, reading taken: brief unchanged |
| 2026-11-01 | Blind re-review (week 1) | Snakes #289 (engine rules, merged at 7, 9, 10) | Codex (its 10) and Claude's reviewer (its 9) | 3 (blocking; scored 7) | Follow-up entry 2s+, done (`docs/archive/progress-done/done-1-november.md`); the first miss, so no brief changed yet |
| 2026-11-01 | Canary (before this rule) | Snakes #298 | Codex | 0 of 3 | None needed |
