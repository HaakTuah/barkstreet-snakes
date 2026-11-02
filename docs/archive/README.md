# Archive

History, kept for the record. Sessions read it only when a task points here.

| File | What it holds |
| --- | --- |
| `AUDIT.md` | The third polish pass's audit (from the project's root, moved by the file-by-file review, 2 November 2026): its baseline branch and PRs are long merged. |
| `instructions.md` | the owner's instructions and decisions given in chat that no other doc recorded, word for word with their dates (UTC). Add new standing ones here. |
| `plan-history.md` | The plan as it grew from round six on (PRs A to D, where each session stopped, the measured numbers), moved word for word from the assistant's project memory. Paths into `.git/perry-tools` there now mean `tools/dev/` or `docs/handoff/`. |
| `design-food.md` | The food topic's sections as the round files had them (round four's "Food"; round six A's "Rivals see food as it is" and "Less fruit, more beetles"), word for word with what was tried and measured, moved by "The design by topic, not by round" (#336, 2 November 2026); the current rules are in `docs/design/04-food-and-the-world.md` |
| `progress-done.md` | The done entries of `docs/PROGRESS.md`'s queue and its answered "For the owner" rows, moved word for word (28 October 2026) to keep it small. New ones are added here. |
| `handoff/` | Handoff material whose entries are done, moved from `docs/handoff/` (31 October 2026): the owner's saved tasks word for word (`next-tasks-verbatim.md`, item 1), the bridge-glitch repro (`stage-bridge-glitch.js`, bridges: PR #174) and the unverified jumps start (`jumps-wip-unverified.patch`, the island hop: PR #158). |
| `pictures/` | One-off scripts that took a merged PR's pictures, moved from `tools/dev/` (31 October 2026), nothing pointing to them: `bead-splat` (#210), `costume-change` and `costumes` (#212, Capricious and Copycat), `flag-bend` (#186, #211), `noscroll-fix`, `phone-bottom` (#112), `rainbow-round` (Star), `woodpecker-beside` (#141). Each takes the game's folder as its first argument, so they still run from here. |
| `pictures/`, later | More of the same, moved from `tools/dev/` by the unused-code check (PR #331, 2 November 2026), nothing live pointing to them: `bridges` (#174), `island-hop` (#158), `wildcard-hair` (#74) and `fall` (the woodpecker's falling piece, 2s). |
| `studies/` | Measuring and proving tools whose work is done, moved from `tools/dev/` by the unused-code check (PR #331), pointed to only from this archive: `same-sound.js` (#225) and `same-zh.js` (#226), proving a split left the sound or the chatter the same, still runnable as they are; `bird-pixels.js` (the woodpecker drawn pixel for pixel the same); `rotten-apples.js` (#142); `sound-levels.js` (#248); `burrow-cluster/` (`plan-history.md`'s burrows clustering). |

## What came from the owner's computer (PR #37, then #38, 26 October 2026)

Before the work moved to cloud sessions, everything the game kept outside git was copied into `docs/from-local/`,
with a note in `docs/HANDOFF.md`. On 26 October both were folded into the repository and removed; the copies are in
git history at commit `cb28c7d`. Where each part went:

| What | Now |
| --- | --- |
| The queue and the state of things (`HANDOFF.md`) | `docs/PROGRESS.md`, the queue word for word. |
| How the owner wants the work done, how to check, the rules that stand | `CLAUDE.md`. |
| Memory notes: AI fairness, the optimization bar, PR pictures, checking a PR before pushing, the repo rename, testing in headless Chrome, how to work, the usage plan | `CLAUDE.md`, each as a rule or a working step. The usage plan's 95% became the 90% rule. |
| Memory notes: the polish pass, round four, round five | History: their outcomes are in `docs/design/` (their rounds) and in their PRs. |
| Memory note: where the tools lived (`.git/perry-tools`, kept from scratchpad clean-ups) | Retired: the tools are in `tools/dev/`. |
| The plan and history (`next-round-ideas.md`) | `plan-history.md`. |
| The reusable tools (`.git/perry-tools`) | `tools/dev/`, pointed at the repository instead of the old computer's folders. |
| The repo's `.claude/launch.json` | `.claude/launch.json`. Its `settings.local.json` (one Windows permission) is retired. |
| The owner's message log | Not copied (it has personal remarks); what no doc recorded is in `instructions.md`. |
