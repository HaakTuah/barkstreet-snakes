# Archive

History, kept for the record. Sessions read it only when a task points here.

| File | What it holds |
| --- | --- |
| `instructions.md` | Haakon's instructions and decisions given in chat that no other doc recorded, word for word with their dates (UTC). Add new standing ones here. |
| `plan-history.md` | The plan as it grew from round six on (PRs A to D, where each session stopped, the measured numbers), moved word for word from the assistant's project memory. Paths into `.git/perry-tools` there now mean `tools/dev/` or `docs/handoff/`. |
| `progress-done.md` | The done entries of `docs/PROGRESS.md`'s queue and its answered "For Haakon" rows, moved word for word (28 October 2026) to keep it small. New ones are added here. |
| `handoff/` | Handoff material whose entries are done, moved from `docs/handoff/` (31 October 2026): the owner's saved tasks word for word (`next-tasks-verbatim.md`, item 1), the bridge-glitch repro (`stage-bridge-glitch.js`, bridges: PR #174) and the unverified jumps start (`jumps-wip-unverified.patch`, the island hop: PR #158). |
| `pictures/` | One-off scripts that took a merged PR's pictures, moved from `tools/dev/` (31 October 2026), nothing pointing to them: `bead-splat` (#210), `costume-change` and `costumes` (#212, Capricious and Copycat), `flag-bend` (#186, #211), `noscroll-fix`, `phone-bottom` (#112), `rainbow-round` (Star), `woodpecker-beside` (#141). Each takes the game's folder as its first argument, so they still run from here. |

## What came from Haakon's computer (PR #37, then #38, 26 October 2026)

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
