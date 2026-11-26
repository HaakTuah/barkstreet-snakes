# Reading against the core, 26 November 2026: the game against release 7's rules

The game's first reading against the core (`core/setup/sync-notes/770-a-project-read-against-the-core.md`; the core's
`tasks/cleaning.md`, "A project is read against the core once, then for what each release changes"), taken at step 9
of the sync of release 7. Read at `main` e0688d9 (merge of #822), against the copy at ec5978e. The reader was a fresh
Opus session at high effort that built none of the game and changed nothing. It was given every rule the game takes,
as `node core/scripts/core-reading.mjs --rules` lists them, and answered each on one scale: met, partly, not met or
not applicable, with its evidence and what holds the rule here (a check, a test, the review, or nothing). The reading
is recorded in `checks/core-reading.json`, and its answers are in `2026-11-26-core-reading-answers.md`. The game's standing choices are recorded in `docs/choices.md`. No game
code changed.

## The counts

| Met | Partly | Not met | Not applicable | Rules |
| --- | --- | --- | --- | --- |
| 256 | 44 | 28 | 75 | 403 |

**Not applicable** covers the tools and roles the game does not use (Kiro, Antigravity, Copilot, teams, a shared
server, the adviser), each said in its row. **Unread:** the repository's settings (its rulesets, secret scanning and
push protection, required checks) and code-scanning alerts, which need an admin's reading. The rows that rest on them
say so.

## The gaps

Each gap is one task, taken at the dose: the game is in debt (`node core/scripts/dose.mjs`), so they join the cleaning
lane. "Rules" are the rows of the answers below. A gap only the owner can take is labelled `needs-owner`. Game code
stays held until release 8 of the core is cut (the owner's order for now), so the gaps are filed, not fixed.

| Gap | Task | Rules | Who | Size | Issue |
| --- | --- | --- | --- | --- | --- |
| G1 | Record this reading (`checks/core-reading.json` by the core's script, with the twice judgments), and fill the *quick check* slot in the manifest (protected file) | 149, 195, 196, 197 | agent | small | #835 (the quick check; the record: this reading's pull request) |
| G2 | Write `docs/choices.md` from `choices-draft.md`: the standing choices, each with `Stood before:` and `Reopens it:`, and what the project would be built on today | 95, 158, 171, 172, 173, 174, 178 | agent | small | this reading's pull request (docs/choices.md) |
| G3 | Name the systems in `checks/shape.json` (engine, ai, render, game, online, tools) under the core's domains, with the keys the check reads; re-baseline | 207, 208, 220 | agent | medium | #824 |
| G4 | Declare "no dependencies" under the manifest's Differences, as `tasks/code-shape.md` asks of a project that counts it a feature; `AGENTS.md` already states it, so it is read, not asked | 106, 211 | agent | small | #825 |
| G5 | `tests.yml` (protected; two security reviews): skip drafts, one group for `main` keeping only the newest run, `select.mjs` for what a change reaches, suite time marks in `checks/shape.json`, slow rounds once per batch, no rerun of a passed tree | 220, 346, 347, 349, 350, 351, 352, 361, 362 | agent | medium | #826 |
| G6 | Run the named mutation tool (Stryker, `checks/mutation`) on a PR's changed lines in a workflow | 214 | agent | medium | #827 |
| G7 | A *game page* (fill the slot): what the game is for, the kinds true of it (designed, emergent, real time, online), and the decision on what must be remembered | 228, 246, 247 | agent | medium | #828 |
| G8 | The five standing measures in the census report, and point (1) of the workshop lane: one run playing where-it-fits, always and never | 229, 230 | agent | medium | #829 |
| G9 | Fill the *direction* slot (from `docs/design/02-…`) and the *screen checks* slot (`checks/screens.json`) with a fixed critique and the busiest ("too many") scene | 135, 261, 264, 327, 344 | agent | medium | #830 |
| G10 | `docs/PROGRESS.md` to order only: an issue for each entry, spec text pointed to not repeated, milestones in order, done records one file an entry, the owner's words kept once (#792) | 101, 116, 123, 281, 282, 283, 285 | agent | medium | #831 |
| G11 | Labels and openers (#803): `correction` with "Brought in by" on bugs from merged work, `stand-in-yes` on the stand-in's yeses, "verdict matched/missed" where acted on | 110, 112, 114, 118 | agent | small | #803 |
| G12 | PR descriptions: the cost line or "No cost line:", "Tests changed:", "Done when" written before code | 152, 153, 215, 221, 222 | agent | small | #832 |
| G13 | Review asks: a stance in every brief and posted review, and Codex asked by the bare mention | 126, 296, 302, 305, 392 | agent | small | #832 |
| G14 | Settings only the owner gives (#802): require the `security-review` status in the ruleset; confirm secret scanning with push protection | 6, 38, 301 | owner | small | #802 |
| G15 | The audit the dose asks: ten questions with the module's brief, challenged once, recorded with the core's script | 183, 190, 191, 192, 199 | agent | medium | #833 |
| G16 | The kit's rows and paragraphs into `AGENTS.md` and the issue templates (#808; `fresh.mjs`) | 113, 364 | agent | small | #808 |
| G17 | Stored records: a version a reader refuses when unknown, or the reason none is needed, in `SECURITY.md` rule 5 | 30 | agent | small | #834 |
| G18 | The blind sample of reviews (#804) | 316 | owner | small | #804 |
| G19 | The state report (#805), leading with outcomes and the merge line's measure | 144, 200 | agent | small | #805 |
| G20 | Fix #817 and #818, and read the online messages' whole input once (one at a time: online messages) | 28, 217 | agent | medium | #817, #818 |
| G21 | List `barkbite-voices` (`audio/sound.js`) among `SECURITY.md` rule 7's storage keys, which are never renamed (found in checking the choices' draft) | 30 | agent | small | #834 |

## What the game holds twice

`node core/scripts/twice.mjs --all` at e0688d9 lists 469 pairs (`twice.txt` shows the first 40). Every one is the
project's own against the project's own: **none is against the core.** Judged by group. A pair "worth a task" points
to its gap in `gaps.md`.

| Group | Pairs | Example | Judgment | Worth a task |
| --- | --- | --- | --- | --- |
| Archived design text against the current design file | 336 (258 close, 78 copies) | `docs/archive/design-food.md:122` ~ `docs/design/04-food-and-the-world.md:254` (100%) | same, or older and wider: each archive file says it holds the sections "as they were decided, word for word", and points to the current file. Dated records | no |
| Archived design text against another archive file | 22 (with progress-done, plan-history, instructions) | `docs/archive/design-arc-and-history.md:69` copy of `design-teaching.md:33` | same; dated records, shared opening lines | no |
| The owner's words, dated instruction files among themselves | 32 | `docs/archive/instructions/2026-10-29.md` lines repeated in later days | same; the owner repeating an order on a later day, each dated | no |
| The owner's words in `docs/archive/instructions/` against `docs/handoff/queue-specs.md` | 13 | `instructions/2026-10-31.md:116` ~ `queue-specs.md:91` (94%) | same: the spec quotes the owner's words that the archive keeps. Kept twice, against "The owner's words are kept once" | yes, G10 (prune #792 under way) |
| Instruction files against done records and design | 15 | `instructions/2026-11-09.md:32` ~ `docs/design/38-the-woodpecker.md:133` (81%) | narrower: a design rule from the owner's words; done records dated | no |
| Design round files among themselves | 30 | `docs/design/32-the-owners-playtest.md:66` ~ `:71` (81%) | different: pointer stubs sharing one sentence ("Its rules are in … under the same name") with different targets | no |
| `docs/PROGRESS.md` against `docs/handoff/queue-specs.md` | 2 | `PROGRESS.md:51` ~ `queue-specs.md:149` (100%), `:58` ~ `:156` (66%) | same: the queue repeats the spec's step text it should point to | yes, G10 |
| `docs/PROGRESS.md` against `docs/archive/workshop-lane-done.md` | 4 | `PROGRESS.md:29` ~ `workshop-lane-done.md:74` (87%) | narrower: the queue keeps the open point; the done file holds the whole line, open points too | yes, small, G10 (done record holds open items) |
| `docs/PROGRESS.md` against `docs/archive/plan-history.md` | 1 | `PROGRESS.md:11` ~ `plan-history.md:420` (64%) | narrower: an older dated state note | no |
| `docs/handoff/queue-specs.md` among itself | 3 | `:134`, `:154`, `:338`, `:424` | same: the trim's one-line note "Moved from `docs/PROGRESS.md` at its trim" | no |
| Done records among themselves and against specs | 4 | `queue-done.md:101` ~ `:131` (82%); `done-specs.md:66` ~ `queue-specs.md:332` | same; dated records | no |
| Audit answers against the audit | 1 | `docs/audits/2026-11-19-answers.md:3` ~ `2026-11-19.md:15` (100%) | same; one dated report | no |
| Polish done record against the text bar | 1 | `polish-lane.md:82` ~ `docs/slop-bar.md:13` (88%) | same; the record quotes the bar it set | no |
| Plan history against a handoff draft | 1 | `plan-history.md:330` ~ `woodpecker-acts-draft.md:61` (71%) | narrower; dated | no |
| Design files against a done record | 4 | `item-3.md:101` ~ `docs/design/03-…:199` (81%) | same; the done record is dated | no |

Unsure: none. Contradicting: none found in the groups sampled (each archive file says its text is superseded where it
is). Two groups are worth a task, both under G10: the owner's words quoted in the specs as well as the archive, and the
queue repeating spec text and the done file holding open lines.

## The answers

One row a rule, with its evidence and what holds it: `2026-11-26-core-reading-answers.md`, beside this file.
