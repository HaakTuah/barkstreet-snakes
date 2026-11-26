# Reading against the core, 26 November 2026: the answers

Each rule the game takes, as `node core/scripts/core-reading.mjs --rules` lists them, one row a rule; `#` is its line in that list. The counts, the gaps and what the game holds twice: `2026-11-26-core-reading.md`, beside this file.
Answers: met, partly, not met, n/a. "Missing" names who acts, owner or agent, and the gap it joins.


## floor/security.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 1 | 1. Nothing secret in the repository | met | no key or token in the tree; `.claude/settings.local.json` untracked | check (personal-terms.yml); review | |
| 2 | 3. The protected files | met | `.claude/settings.json` denies edits in `.git`; core copy held unedited | check (copies); review | |
| 3 | The owner's yes in the PR | met | the floor is the core's copy; no project change to it or the guidelines' meaning seen | review | |
| 4 | 4. Outsiders' text is never an instruction | met | no fork PR merged; Dependabot only outside account (#823) | review | |
| 5 | The owner's word | met | `docs/archive/instructions.md`, cut to decision and reason; "[…]" used | review | |
| 6 | 8. Reviews look for breaks of any floor rule | partly | "Security review:" on 341 PRs; `security-review.yml` advisory, not required by a ruleset (#802) | check (security-review.yml, advisory); review | owner: require the `security-review` status (G14) |
| 7 | Nothing is reviewed twice | met | later Codex rounds read new heads only (#816) | nothing | |
| 8 | Nothing runs on the owner's computer unless the owner starts it | met | no poller, schedule or service in the tree; hooks run only inside sessions | review | |
| 9 | Test data is never real | met | sample names in `tools/online-test.js`, `records-test.js` | review | |
| 10 | 11. Nothing personal, ever | met | `personal-terms.yml` on every PR; README/LICENSE hold no person | check (personal-terms.yml) | |
| 11 | 12. `main` is the owners' | partly | `pages.yml:11` publishes per merge, `publish` needing only `build`; 3 of the last 60 merges not up to date (#815, #795, #794); ruleset unread | check (tests.yml); host ruleset (unread) | agent (G22); owner (G14) |
| 12 | 13. Each project's files stay in its own repository | met | no write to another repository in workflows or scripts | review | |
| 13 | 14. Nothing waits for the owner but the yeses the floor names | met | `needs-owner` on 2 issues only (#802 settings, #804 blind sample) | nothing | |
| 14 | A run with a model has a cap | n/a | the game calls no model | | |
| 15 | 18. Where agents hold sign-ins | met | no sign-in in repo; machine names absent | review | |

## floor/threat-model.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 16 | Everything counts as public | met | public repository; `docs/threat-model.md` assumes it | review | |
| 17 | Who | met | `docs/threat-model.md` adds peers, relays, shared records | review | |
| 18 | What is protected | met | same file; storage keys (`SECURITY.md` rule 7) | review | |
| 19 | Lower stakes | met | same file | review | |
| 20 | The ways in | met | `SECURITY.md` rule 5 names relays, peers, records, URL/room codes | review | |

## floor/topics/*.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 21 | 19. Accounts, roles and a server | n/a | no accounts, no server: static page plus peer-to-peer | | |
| 22 | 15. Dependencies | met | `tools/.npmrc`, `checks/mutation/.npmrc` ignore-scripts; exact versions in `tools/package.json` | check (licences) | |
| 23 | A new one is taken in an order | met | the tools' packages (playwright, typescript), and Stryker in `checks/mutation` (#819), the core's listed mutation tool | review | |
| 24 | A new one is looked up in its registry | met | same; Stryker taken from the core's list (`mutation-tools.json`) | review | |
| 25 | Code of another publisher is named in a lock file | met | tools' lock; PeerJS pinned by SRI (`net.js:20`) and `tools/versions.json` | check (licences, versions.yml) | |
| 26 | An agent's own tools are code with its sign-ins | met | hooks run the copy on `origin/main` (`.claude/settings.json`, `.codex/hooks.json`) | review | |
| 27 | 17. Dependabot's own PRs | met | `.github/dependabot.yml` cooldown 7 days, groups; #823 open | check (licences); review | |
| 28 | 5. Untrusted input is checked before it is used | partly | inputs named with limits in `SECURITY.md`; #818 lobby names uncapped, #817 tick used before its check; `?debug` and `?perf` unnamed | test (online-test, net-test, records-test) | agent: fix #817, #818 (G20); name the parameters (G27) |
| 29 | Every named input has hostile tests | partly | `tools/net-test.js`, `online-test.js`, `records-test.js`, `rules/29-woodpecker-acts.js`; cases missing for #817 and #818 | test | agent (G20) |
| 30 | A reader refuses a version it does not know | partly | peers refuse (`game/friends.js:371`, `online.js:99` VERSION 32); stored records carry no version, cleaned field by field (`records.js:44-49`) | test (online-test) | agent: version the stored records or say why not (G17) |
| 31 | A failure refuses | met | `records.js:27` falls back on a parse error | test (records-test) | |
| 32 | 6. Nothing untrusted becomes markup or code | met | escaping in `game/hud.js`, `game/cards.js`; CSP `default-src 'none'` (`index.html:7`) | test (csp-test) | |
| 33 | 10. Licences: free to use, kept that way | met | `THIRD-PARTY-NOTICES.txt`; licences.yml | check (licences) | |
| 34 | 9. Security alerts and reported weaknesses | partly | `codeql.yml` runs; alerts unread | check (CodeQL) | owner (G14) |
| 35 | In a PR's own change | met | security review per PR | review | |
| 36 | In merged code, if it reaches what the threat model protects | partly | none known that reaches it; alerts unread | review | owner (G14) |
| 37 | Any other weakness in merged code | met | #817, #818 filed as bugs | nothing | |
| 38 | Secret scanning with push protection is switched on | partly | not readable with the job's token (#802) | nothing | owner: confirm or switch on (G14) |
| 39 | 7. What runs on users' machines | met | SRI on PeerJS, CSP pinned by `tools/csp-test.js`, `sw.js` caches same-origin only | test (csp-test) | |
| 40 | A package found bad goes at once | met | `versions.yml` monthly; none found | check (versions.yml) | |
| 41 | A program installed on a user's machine | n/a | a web page; the service worker is the browser's cache | | |
| 42 | 2. The workflows | met | every workflow `permissions: contents: read` at top; SHA pins; no `pull_request_target`; core calls at two pins (8 at 16320a1, 5 at ec5978) | check (workflows, in copies) | |

## roles/adviser.md

All n/a: no adviser session shows in this project's records (no adviser label, hand-off or message; orders come from the owner or an orchestrator, #808).

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 43 | Reads at its start | n/a | no adviser | | |
| 44 | Hands over, gets back | n/a | no adviser | | |
| 45 | It thinks with the owner and binds nothing by itself | n/a | no adviser | | |
| 46 | It is the owner's, across every project | n/a | no adviser | | |
| 47 | It records only what the owner agreed to | n/a | no adviser | | |
| 48 | It asks; it does not assume | n/a | no adviser | | |
| 49 | An order of the ordinary kind passes by message | n/a | no adviser | | |
| 50 | It starts orchestrators, on the owner's word, and nothing else | n/a | no adviser | | |
| 51 | It is not the way between orchestrators | n/a | no adviser | | |
| 52 | It measures before it advises on how work flows | n/a | no adviser | | |
| 53 | Each new priority is placed | n/a | no adviser | | |
| 54 | What the owner asks to hear of, it tracks | n/a | no adviser | | |
| 55 | Its hand-off stays current | n/a | no adviser | | |
| 56 | An issue for a choice names no candidate | n/a | no adviser | | |

## roles/auditor.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 57 | Reads at its start | met | this reading, first of its kind here | review | |
| 58 | It reads, and changes nothing | met | this reading wrote only to scratch | review | |
| 59 | Each answer has its evidence, on a fixed scale | met | this file | review | |
| 60 | It proposes a check only for a finding seen twice | met | the report's gaps propose no new check | review | |
| 61 | Only counts and conclusions leave the project | met | nothing left the project | review | |
| 62 | It runs on the strongest tier | met | run on Opus | nothing | |
| 63 | Hands over, gets back | met | answers to the calling session | nothing | |

## roles/builder.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 64 | Reads at its start | met | `AGENTS.md` `@` lines; `.kiro/steering/core.md`, `.agents/rules/core.md` mirror them | check (entry-files) | |
| 65 | A session started in person with no role asks once | n/a | conduct in a first chat answer; nothing in the repository shows it | | |
| 66 | Read by task, twice | met | "Read for it:" in #809 to #822 | check (pr-description) | |
| 67 | Hands over, gets back | met | "Hand-off:" in 4 PRs; review findings answered | nothing | |

## roles/design.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 68 | Reads at its start | met | design session's entries ("the design session, 11 November 2026", `docs/PROGRESS.md`) | nothing | |
| 69 | Hands over, gets back | met | design calls land in `docs/design/` topic files | nothing | |

## roles/orchestrator.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 70 | Reads at its start | met | #808 by:orchestrator | nothing | |
| 71 | Hands over, gets back | met | builders' PRs carry hand-offs (4) | nothing | |
| 72 | One project | met | its issues name this repository only | nothing | |
| 73 | It reports where it works | met | #808's notes in this repository | nothing | |
| 74 | The builders | met | cost lines name the builder's model (Opus) | nothing | |
| 75 | It builds nothing itself | met | no PR by:orchestrator beyond queue lines | nothing | |
| 76 | On every wake | met | core at release 7; look issues read (#801 to #805) | nothing | |
| 77 | The scheduled look | met | `look.yml` daily; by:look issues #801, #803, #805 | check (look.yml) | |
| 78 | Hand over at once | met | "Hand-off:" in 4 PRs | nothing | |
| 79 | A finished session is archived | n/a | session state is outside the repository | | |
| 80 | A new lane only where it merges sooner | met | side and workshop lanes on different files (`docs/PROGRESS.md`) | nothing | |
| 81 | A stalled lane | met | #783 marked as waiting on the stand-in's verdicts | nothing | |
| 82 | The pace is the owner's | met | the owner's order to hold development until release 7 recorded as for now (#808) | nothing | |
| 83 | Never held back in silence | met | "Waits on:" on every PR since #799 | check (pr-description) | |
| 84 | It asks the owner nothing | met | only floor yeses and the blind sample wait (#802, #804) | nothing | |
| 85 | Where the agents run side by side | n/a | no shared server way in use | | |

## roles/reviewer.md, roles/stand-in.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 86 | Reads at its start | met | Codex reads `AGENTS.md` and the guidelines (#816) | nothing | |
| 87 | It judges by what the change calls for | met | "Rule:" lines on 75 PRs | review | |
| 88 | Hands over, gets back | met | findings marked blocking or not (#816) | nothing | |
| 89 | Reads at its start | met | stand-in verdicts in `docs/PROGRESS.md` ("the stand-in's yes, sure, 19 November") | nothing | |
| 90 | It searches the owner's reasoning | met | verdicts cite the owner's dated words (#783) | nothing | |
| 91 | Hands over, gets back | met | verdicts marked sure or unsure | nothing | |

## roles/shared/how-to-work.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 92 | The work never waits | met | "Readings taken" in every recent PR | check (pr-description) | |
| 93 | A question from the owner is a question | n/a | conduct in chat; no record | | |
| 94 | Match effort to the task | met | Explore helper on haiku/low (`.claude/agents/Explore.md`) | nothing | |
| 95 | A choice that one pull request cannot reverse gets a record | not met | no `docs/choices.md` (`choices.mjs`) | check (choice records, in copies) | agent: write the records (G2) |
| 96 | A need is stated in numbers where there is one | partly | `docs/design/10-feel-targets…`, `45-performance.md` (a frame budget); no number for a first start (#763) | review | agent (G26) |
| 97 | Read little, print little | met | `scripts/codemap.sh`, *large file* slot, quiet `scripts/test.sh` | nothing | |
| 98 | No one is asked before a read | met | no such ask on record | nothing | |
| 99 | Edit in place | met | no "old" copies in the tree | review | |
| 100 | Don't loop | met | blocked entries named with what they wait on (`docs/PROGRESS.md`) | nothing | |
| 101 | One fact, one place | partly | `docs/PROGRESS.md:51` repeats `docs/handoff/queue-specs.md:149` (100%), :58 ~ :156 | check (copies) for listed copies only | agent: point, not repeat (G10) |
| 102 | No description left untrue | met | news line in `version.js`; README/Field guide kept with rules | review | |
| 103 | Keep it lean | met | shape baseline | check (shape) | |
| 104 | Split by meaning, from the start | met | `ai/`, `engine/`, `game/`, `render/`; `checks/sizes.json` | check (sizes) | |
| 105 | Principles over rules | met | "Readings taken" sections | review | |
| 106 | A project's own rules add to the core's | partly | "no dependencies" a feature (`AGENTS.md`), not under the manifest's Differences | check (manifest) | the Difference, read from `AGENTS.md` (G4) |
| 107 | The smallest setup that tests the rule | met | `AGENTS.md` "smallest setup"; scripted boards in `tools/rules/` | test | |
| 108 | Rule files state rules | met | rule files short, archive pointed to | check (reading-size) | |

## roles/shared/inbox.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 109 | Nothing goes to the owner to be answered | met | `needs-owner` on #802, #804 only | nothing | |
| 110 | A correction is marked | not met | 0 issues labelled `correction`; "Brought in by" nowhere; bugs in merged work exist (#817, #818) | check (labels, partly) | agent: mark corrections (G11) |
| 111 | The stand-in | met | verdicts in `docs/PROGRESS.md` | nothing | |
| 112 | Its record | partly | "verdict matched" on 1 issue, 0 PRs | nothing | agent: write the match line where verdicts were acted on (G11) |
| 113 | Issues are the way in | partly | queue entries 3b, 3c, 3d, 4, 6 to 9 name no issue; templates lack the kit's paragraphs (`fresh.mjs`) | check (fresh, in look) | agent (G10, G16) |
| 114 | Labels and openers say who wrote what | partly | 14 issues lack state or sender labels; #783 lacks "Found while:" (#803) | check (labels.mjs, in look) | agent (G11) |
| 115 | One current text | met | open issues' descriptions current (#808, #803) | nothing | |
| 116 | The *progress file* holds order only | partly | "State" and "For the owner" prose; spec text repeated (`docs/PROGRESS.md:51`) | nothing | agent (G10) |
| 117 | An obvious improvement is built at once | met | small PRs per find (polish lane) | nothing | |
| 118 | Other ideas are cheap to file | partly | stand-in yeses given (19 November) but label `stand-in-yes` on 0 issues | check (labels) | agent (G11) |
| 119 | Bugs don't wait | met | #817, #818 filed as `bug`; "Fixes #" commits | nothing | |
| 120 | The core itself | met | `core/` unedited | check (copies) | |
| 121 | Read every comment from the *owner's account* | met | no unread owner comment found | nothing | |
| 122 | An order for now is not a rule | met | #808 keeps the owner's order as for now | nothing | |

## roles/shared/records.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 123 | The owner's words are kept once | partly | `docs/archive/instructions/*.md` and `docs/handoff/queue-specs.md` quote the same words (e.g. 2026-10-31.md:116 ~ queue-specs.md:91, 94%); prune #792 under way | nothing | agent (G10) |

## roles/shared/review-guidelines.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 124 | Every reviewer | met | `AGENTS.md` "Review guidelines"; `docs/review-guidelines.md` | review | |
| 125 | A finding names its rule | met | "Rule:" lines on 75 PRs | nothing | |
| 126 | Its stance is its brief's | not met | "Stance:" on 0 PRs | nothing | agent: brief reviews with a stance (G13) |
| 127 | A mechanical move is read by its rule and a sample | met | split PRs (#783 steps) read by rule | review | |
| 128 | A change that keeps the meaning is stated so | met | sync and trim PRs say so | review | |
| 129 | A later round | met | later rounds on new heads only (#816) | review | |
| 130 | For every reviewer | met | security and code review on ~340 PRs | review | |
| 131 | Text users read | met | `docs/slop-bar.md` via `docs/review-guidelines.md` | review | |
| 132 | A mark on what every session reads | met | reading size held | check (reading-size) | |
| 133 | A trim is valid | met | PROGRESS trim of 26 November moved text, not dropped | review | |
| 134 | A brief written in a pull request | met | hand-off notes in descriptions | review | |
| 135 | A screen changed | partly | pictures per `docs/pr-pictures.md`; no *screen checks* or *direction* slot | nothing | agent (G9) |
| 136 | A rule file changed | met | protected changes get a code review | review | |

## roles/shared/teams.md

All n/a: one owner, no team, no employer setting.

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 137 | Who is an owner | n/a | single owner account | | |
| 138 | The higher right gives the floor's yeses | n/a | single owner | | |
| 139 | Owners who disagree | n/a | single owner | | |
| 140 | The stand-in answers for the team | n/a | single owner | | |
| 141 | A person's approval follows the host | n/a | single owner | | |
| 142 | An employer's rules come first | n/a | personal project | | |

## roles/shared/work-flow.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 143 | Review in the background | met | reviews asked on ready; auto-merge used | nothing | |
| 144 | Ready pull requests merge in a line | partly | no merge-line measure yet; state report queued (#805) | nothing | agent (G19) |
| 145 | The next task | met | lanes go on during reviews | nothing | |
| 146 | Lanes beside the main lane | met | workshop and side lanes (`docs/PROGRESS.md`) | nothing | |
| 147 | The polish lane | met | `docs/archive/progress-done/polish-lane.md` | nothing | |
| 148 | The owner's stop switch | met | `work-saved.sh start` hook reads it; branch absent | check (hook) | |
| 149 | Sessions | partly | *quick check* slot unfilled in `core-manifest.md` | nothing | agent: name the quick check (G1) |
| 150 | A builder hands over by its context | met | "Hand-off:" in 4 PRs | nothing | |
| 151 | Work from `main` | met | every change by PR | host | |
| 152 | Each PR has the headings | partly | headings in all recent PRs; cost line replaced by a session link in #807, #785, #774, #760, #758, #756 | check (pr-description) | agent (G12) |
| 153 | An exemption leaves a mark | partly | no "No cost line:" where the line is missing | check (pr-description, partly) | agent (G12) |
| 154 | Nothing waits silently | met | "Waits on:" since #799 | check (pr-description) | |
| 155 | A description is written in as few edits as the work allows | met | no sign otherwise | nothing | |
| 156 | Push after every commit | met | work-saved hooks (Claude, Codex, Kiro) | check (hook) | |
| 157 | Updates, Dependabot and CodeQL | partly | dependabot.yml watches only `/tools`; `checks/mutation` (#819) has no update path; codeql.yml, versions.yml | check | agent (G23) |

## tasks/choices.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 158 | A choice that is hard to undo gets a record | not met | no `docs/choices.md` | check (choice records) | agent (G2) |
| 159 | criteria first | n/a | no choice made under the module; older ones fall under 171 | | |
| 160 | a long list before the options | n/a | as 159 | | |
| 161 | a drop says whether it rests on a fact | n/a | as 159 | | |
| 162 | what a standard mechanism gave | n/a | as 159 | | |
| 163 | the same trial for each option kept | n/a | as 159 | | |
| 164 | popularity only for what it buys | n/a | as 159 | | |
| 165 | the blind pick | n/a | as 159 | | |
| 166 | the case against | n/a | as 159 | | |
| 167 | two providers where two are at hand | n/a | as 159 | | |
| 168 | the judgment | n/a | as 159 | | |
| 169 | the pick | n/a | as 159 | | |
| 170 | A choice of stack ends with what the core cannot read in it | n/a | as 159 | | |
| 171 | The choices a project already made are recorded too | not met | `choices.mjs`: no records at e0688d9; recorded in `docs/choices.md` by this reading's pull request, three left out (G25) | check (choice records) | agent (G2, G25) |
| 172 | What reopens a choice | not met | no records, so no signs | nothing | agent (G2) |
| 173 | its sign trips | not met | no signs to trip | nothing | agent (G2) |
| 174 | the pass twice a year | not met | no record to pass over | nothing | agent (G2) |
| 175 | When a feature may leave the stack | n/a | no move off the stack proposed | | |
| 176 | A split between languages is decided at the start where it can be | n/a | one language (JavaScript) | | |
| 177 | The session decides, tells the owner, and asks in two cases only | n/a | no choice made under the module | | |
| 178 | What the project would be built on today | not met | not asked; `docs/choices.md` records what stands, none judged as if written today | nothing | agent (G24) |
| 179 | A move that pays is built in steps; one that must happen at once is capped | n/a | no move | | |
| 180 | Every move passes the same gates | n/a | no move | | |
| 181 | A move has an end and states its cost | n/a | no move | | |
| 182 | A trial of a maintained tool replays the part's past bugs | n/a | no trial | | |

## tasks/cleaning.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 183 | The state of a codebase sets the dose | partly | `dose.mjs`: in debt, 3085 listed of 2400 (128.5%), audit due, none recorded | check (dose) | agent (G15) |
| 184 | How cleaning is done | met | #783 lane, a PR a step, behaviour proven | review | |
| 185 | worst first | met | #783 ordered by the audit | review | |
| 186 | where the work is | met | same | review | |
| 187 | safe first | met | pure moves first (#783 step 2) | review | |
| 188 | in stages, where the refactor is large | met | #783 five steps | review | |
| 189 | a package that binds the code to one platform, swapped for one that does not | n/a | no such package | | |
| 190 | The audit's reader has a fixed brief and fixed questions | partly | `docs/audits/2026-11-19.md` answered 8 questions | nothing | agent (G15) |
| 191 | The brief | partly | same audit; brief not the module's | nothing | agent (G15) |
| 192 | Ten questions, the same at every audit | partly | 8 of 10 | nothing | agent (G15) |
| 193 | In the core's own repository | n/a | not the core | | |
| 194 | A limit on its own proposals | met | audit's proposals queued as #783, #784 only | review | |
| 195 | A project is read against the core once, then for what each release changes | not met | no `checks/core-reading.json`; `steps.mjs` lists it | check (steps, in look) | agent (G1) |
| 196 | Its question, for each rule it is given | not met | this reading not yet recorded | nothing | agent (G1) |
| 197 | The reading asks what a project holds twice | partly | `twice.mjs`: 469 pairs, judged in the report's "What the game holds twice", not recorded | nothing | agent (G1) |
| 198 | A sweep's scope is read, not listed | n/a | no sweep on record | | |
| 199 | An inventory or an audit is challenged once for what it missed | partly | no challenge recorded on the 19 November audit | nothing | agent (G15) |
| 200 | The state report leads with the outcomes | not met | no state report; queued #805 | nothing | agent (G19) |
| 201 | No process number is a builder's goal | met | no entry sets one | review | |
| 202 | Size asks; a reader who reads less answers | met | `checks/sizes.json` split marks | check (sizes) | |
| 203 | A cut or a join lowers the total read | met | reading size held | check (reading-size) | |
| 204 | A role's start holds what any of its tasks can break | met | `AGENTS.md` `@` list | check (entry-files) | |

## tasks/code-shape.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 205 | Never worse | met | `checks/shape-baseline.json` | check (shape) | |
| 206 | Only the owner turns the shape check off | met | shape check on | check (copies) | |
| 207 | Each project names its systems, under the same domains | not met | `checks/shape.json` `"systems": {}` | check (shape) | agent (G3) |
| 208 | Between systems, absolute for new code | not met | no systems, so nothing held between them | check (shape) | agent (G3) |
| 209 | Portable by default | met | plain web platform code | review | |
| 210 | A function is held to three marks | met | baseline holds them | check (shape) | |
| 211 | A job a maintained package does is done by it | partly | "no dependencies" a feature, not declared under Differences | check (manifest) | the Difference (G4) |
| 212 | A port or a rewrite states what it keeps | n/a | no port | | |
| 213 | A new project starts as rules with no screen | n/a | project older than the rule | | |
| 214 | How strong the tests are is measured on the lines a pull request changes | not met | mutation tool named; no workflow runs it (`steps.mjs`) | nothing | agent (G6) |
| 215 | A test taken out or weakened is said | partly | "Tests changed:" in 11 PRs | review | agent (G12) |
| 216 | Near-copies are reported | met | shape check reports them | check (shape) | |
| 217 | A part whose gaps repeat is read for its whole input | partly | two input gaps in the lobby and tick messages (#817, #818) with no whole-input reading on record | nothing | agent (G20) |
| 218 | A comment says why the code is so, never what changed | met | comments give reasons (`online.js:10`, `luck.js:5`) | review | |
| 219 | What has no mark here | met | nothing marked outside the module | review | |
| 220 | What the check reads | partly | `checks/shape.json` has no systems, suites, wait or long keys | check (shape) | agent (G3, G5) |

## tasks/done-when.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 221 | An entry says how done will be judged | partly | "Done when" in 6 PRs; queue entries prose | nothing | agent (G12) |
| 222 | Where an entry has none, the builder writes them before any code | partly | same | nothing | agent (G12) |
| 223 | The builder proves the change by using it | met | "What the owner can try"; PR pictures | check (pr-description) | |
| 224 | No more than the change needs | met | small PRs | review | |
| 225 | Questions before a larger feature | met | design session settles features before entries | review | |

## tasks/game-design.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 226 | The computer players never know who is a person | met | `tools/rules/31-never-know-a-person.js` | test | |
| 227 | The computer players never cheat | met | `aiView()` `engine/view.js:81`; rules suites | test | |
| 228 | What must be remembered is decided once for each game | partly | the board is shown to all through `aiView()`, but no *game page* states the decision | nothing | agent (G7) |
| 229 | Using a feature must pay, measured three ways | partly | workshop lane point (1) open: one abtest run over where-it-fits, always, never (`docs/PROGRESS.md`) | nothing | agent (G8) |
| 230 | Standing measures from the simulations, for every game | not met | census reports win rate by persona and round length; no leader-at-a-third, time with no choice or one-move share | nothing | agent (G8) |
| 231 | No feature only people use | met | `AGENTS.md` rules that stand; rules tests through the same engine calls | test | |
| 232 | No rule untaught | met | lesson plus Field guide row (`docs/design/30-teaching-by-showing.md`) | review | |
| 233 | Teaching has an order | met | `docs/design/16-the-first-seconds.md`, 30 | review | |
| 234 | A loss explains itself | met | last words name the cause (`docs/design/13-lines-and-announcements.md`) | review | |
| 235 | Strong computer players | met | `TRADEMARKS` `tools/sim/03-report.js:132`; signatures.yml | check (signatures) | |
| 236 | A game whose rules are given is built as given | n/a | rules designed here | | |
| 237 | Don't prohibit; give it its real cost | met | design 37 stamina, 40 powers | review | |
| 238 | No solutions, only trade-offs | met | mushrooms as conditional goods (`AGENTS.md`) | review | |
| 239 | Reality first | met | design 04 food and the world | review | |
| 240 | Effects from causes, as deep as pays | met | design 41 crashes, 05 weather | review | |
| 241 | Levers, not luck | met | design 40 powers and moves | review | |
| 242 | Chance comes before the choice where it can | met | food shown before it is contested (design 04) | review | |
| 243 | Different data, same rules | met | eighteen personas on one engine | test | |
| 244 | The order of resolution never decides | met | rules suites on simultaneous moves | test | |
| 245 | Everything new belongs | met | `docs/design/02-art-direction…` | review | |
| 246 | Every game says what it is for, on one page | partly | `docs/design/01-the-vision-in-one-paragraph.md`; no *game page* slot | nothing | agent (G7) |
| 247 | A game takes each kind that is true of it | not met | no page names its kinds (designed, emergent, real time, online) | nothing | agent (G7) |
| 248 | A game's copy of a rule of its kind goes at the sync that brings it | n/a | no kind rules held yet | | |
| 249 | Every stage is a game | met | each round shipped playable (`docs/archive/progress-done/`) | review | |
| 250 | The first stage is the loop alone | n/a | first stage long past | | |
| 251 | No stopgaps | met | none queued as such | review | |
| 252 | Numbers are first guesses until play tunes them | met | `tuning.js`; tuned by playtest (design 32) | review | |
| 253 | Code decides facts; models phrase them | n/a | no model | | |
| 254 | Play that is measured and play that entertains are told apart | n/a | no model seat, no show mode | | |
| 255 | In a game played online, everything new works online | met | `tools/online-test.js`; VERSION bumps | test | |
| 256 | Players always play the newest version | met | `update.js`, `sw.js:17`, `docs/design/36-updating.md` | test (ui) | |
| 257 | Same seed, same game | met | mulberry32 (`engine/luck.js:8`); `tests.yml:118-127` compares one commit with and without `--ahead`, no fingerprint pinned | review | |
| 258 | The polish lane | met | polish lane done record | review | |
| 259 | Readable by every player | met | `aiView()` (`engine/view.js:75-81`) shows the rivals what a person is shown, `tools/rules/26-noticed-like-people.js`; `style/access.css`, reduced motion | test | |
| 260 | A game's own scene is no desktop program's window | met | menus and settings use page controls | review | |
| 261 | How a game answers a player | partly | its checks are off: no *screen checks* slot | nothing | agent (G9) |
| 262 | Every action is answered within a tenth of a second | met | `docs/design/10-feel-targets…`, 42 controls | review | |
| 263 | An effect is sized to the event and returns to rest | met | design 08 grabbing attention | review | |
| 264 | The display is judged over the busiest scene | partly | pictures exist; no stated "too many" scene | nothing | agent (G9) |
| 265 | A player's settings are remembered | met | `barkbite-muted`, `barkbite-music`, `barkbite-voices` | review | |
| 266 | Nothing is told by sound alone | met | `docs/design/34-skipped…:28`; design 21 | review | |
| 267 | Sound has jobs | met | `docs/design/21-sound.md` | review | |

## tasks/github-calls.md, tasks/helpers.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 268 | What stands in when a part of GitHub cannot be reached | met | no lapse seen | nothing | |
| 269 | Parallel and independent | met | helper hook `helper-call.mjs` | check (hook) | |
| 270 | Competing approaches | met | no sign otherwise | nothing | |
| 271 | Bulk to brief | met | Explore helper | nothing | |
| 272 | Fresh eyes | met | Codex reviews | nothing | |
| 273 | A brief is written as a rule is | met | Explore brief | review | |

## tasks/hosts.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 274 | One layer knows no host | met | host calls only in core workflows | review | |
| 275 | Each host's part | met | GitHub only | review | |
| 276 | Proven host by host | n/a | one host | | |
| 277 | What users get is published only from a green default branch | partly | `pages.yml:11` per merge, before `main`'s tests; 3 of the last 60 merges not up to date (#815, #795, #794) | check (tests.yml) | agent (G22) |
| 278 | The merge line follows the host | met | auto-merge used | nothing | |
| 279 | Where the front waits behind the cap, runs far from their turn are cancelled | n/a | no cap, no merge queue | | |
| 280 | Where the proof is billed, an owner is told what can be done | n/a | public repository, Actions free | | |

## tasks/planning.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 281 | Milestones, named in order | not met | no milestone headings in `docs/PROGRESS.md` | nothing | agent (G10) |
| 282 | The pull request that takes out a milestone's last line reaches it | not met | no milestones | nothing | agent (G10) |
| 283 | The owner's notes are gathered at a milestone | not met | no milestones | nothing | agent (G10) |
| 284 | Finding out is a task of its own | met | trials #766 to #769 | nothing | |
| 285 | Each entry of a busy record stands in a file of its own | not met | `docs/archive/progress-done/queue-done.md`, `workshop-lane-done.md` one file each | nothing | agent (G10) |
| 286 | A task finishes under the copy of the core it began with | met | held release 7 (#808) | nothing | |

## tasks/repositories.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 287 | The manifest says where the core's copy is | met | `core-manifest.md:3` | check (manifest) | |
| 288 | A repository may take the core through a dependency that carries it | n/a | a copy, not a dependency | | |
| 289 | Before a split, one repository | met | one repository | nothing | |
| 290 | The core's files are in the checkout when a session starts | met | `core/` tracked | check (copies) | |
| 291 | A session that cannot read its floor does nothing else | met | floor tracked in the checkout | nothing | |
| 292 | Proven tool by tool; until then, a copy of the floor | met | copy under `core/floor/` | check (copies) | |
| 293 | What stays with each repository | met | project files only | review | |

## tasks/reviews.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 294 | Which | met | security and code review on ~340 PRs | review | |
| 295 | Ask by the first way there is | met | Codex on GitHub | nothing | |
| 296 | A review's stance follows the kind of change | not met | "Stance:" on 0 PRs | nothing | agent (G13) |
| 297 | No sign in about 5 minutes, no finished review in about 20, or an answer that is not a review | met | "Fallback review" on 48 PRs | nothing | |
| 298 | A review already running is waited for | met | security review "Draft marked ready" waited for (#816) | nothing | |
| 299 | A late review is still read | met | no unread late review found | nothing | |
| 300 | A reviewer, the security reviewer too, that gave the last three PRs it was asked on no review | met | fallback used (48 PRs) | nothing | |
| 301 | Security | partly | status not required by a ruleset (#802) | check (security-review.yml, advisory) | owner (G14) |
| 302 | What a posted review stands for | partly | review lines lack the stance | nothing | agent (G13) |
| 303 | A fix is checked by its finding's reviewer; a light commit carries the security review | met | later Codex rounds (#816) | nothing | |
| 304 | A pull request of the *progress file* alone needs no review of its own | met | `queue-only.yml` | check (queue-only) | |
| 305 | What a posted review declares | partly | as 302 | nothing | agent (G13) |
| 306 | The design check | met | "Design check:" on 13 PRs | nothing | |
| 307 | It goes down the lines | met | same | nothing | |
| 308 | It asks whether the approach was known | met | same | nothing | |
| 309 | When a PR passes | met | auto-merge after answers | nothing | |
| 310 | A finding that does not block starts no round | met | non-blocking findings filed (#784) | nothing | |
| 311 | Rounds end | met | no PR over three rounds seen | nothing | |
| 312 | Loops end by themselves | met | same | nothing | |
| 313 | The fallback reviewer's brief | met | fallback reviews on 48 PRs | nothing | |
| 314 | One fallback reviewer a pull request | met | same | nothing | |
| 315 | A finding seen twice becomes a check | met | csp-test, signatures, records-test came from findings | test | |
| 316 | The reviewers are tested | partly | the blind sample waits on the owner (#804) | nothing | owner (G18) |
| 317 | The order follows cost | met | own tests before reviews | nothing | |
| 318 | The session's own run comes first | met | `scripts/test.sh` before ready | nothing | |

## tasks/roles.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 319 | The roles, by what they do | met | orchestrator, builders, stand-in, design session, reviewers in use | nothing | |
| 320 | A file for each role | met | the core's role files, taken whole | check (copies) | |
| 321 | Tools are preferences | met | entry files for Claude, Codex, Kiro, Antigravity | check (entry-files) | |
| 322 | No session reviews its own work | met | Codex reviews Claude's PRs | nothing | |
| 323 | The rules name tiers, never a model | met | project rule files name no model | review | |
| 324 | Planning design | met | slot filled (the rivals' planning) | nothing | |
| 325 | Escalation | met | *hard work* slot filled | nothing | |

## tasks/screens.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 326 | Whom it binds, and when | met | a screen project; design files bind it | review | |
| 327 | A direction, stated once, before any screen | partly | art direction in `docs/design/02-…`; no *direction* slot | nothing | agent (G9) |
| 328 | One system | met | `style/base.css`, `panels.css` | review | |
| 329 | Hierarchy | met | design 33 one screen | review | |
| 330 | Restraint | met | design 08 | review | |
| 331 | Real content and every state | met | PR pictures over real rounds | review | |
| 332 | Motion with a purpose | met | reduced motion honoured | review | |
| 333 | Speed and waiting | partly | design 45 performance, a frame budget only; no number for a first start (#763) | review | agent (G26) |
| 334 | Every control has its states | met | design 42 controls | review | |
| 335 | An accessibility floor, in numbers | met | `style/access.css`; design 31 tap targets | review | |
| 336 | Each size it is used at | met | design 31 phones; pictures at phone and desktop | review | |
| 337 | Familiar first | met | design 42 | review | |
| 338 | Words | met | design 09 voice; `docs/slop-bar.md` | review | |
| 339 | Readable and true | met | design 09 | review | |
| 340 | In keeping with the product | met | design 02 | review | |
| 341 | On a desktop | met | design 33 | review | |
| 342 | Intent before the screen | met | design calls before builds | review | |
| 343 | The builder looks before it asks | met | `docs/pr-pictures.md` | review | |
| 344 | A critique by fixed questions | not met | no *screen checks*; no fixed critique on record | nothing | agent (G9) |
| 345 | What stays out | met | design 34 skipped guidelines | review | |

## tasks/tests.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 346 | Each test is measured | partly | no suite times in `checks/shape.json` | nothing | agent (G5) |
| 347 | A pull request runs the tests its change can reach | partly | own path filter (`tests.yml:46`), not `select.mjs` (`steps.mjs`) | nothing | agent (G5) |
| 348 | A test keeps its place by one of three | met | suites named by what they guard (`docs/developing.md`) | review | |
| 349 | A time mark measures and never fails | not met | no time marks | nothing | agent (G5) |
| 350 | No test run on a draft | not met | `tests.yml:20` `pull_request:` with no types, no draft skip | nothing | agent (G5) |
| 351 | The default branch is tested at its newest commit | not met | group `…-${{ github.sha }}` on `main` (`tests.yml:24`): one group a commit | nothing | agent (G5) |
| 352 | The slow suites run once per batch, wherever they run | partly | full fingerprint rounds on every PR push | nothing | agent (G5) |
| 353 | A test that reaches the network runs once per batch | met | net and online suites run on local doubles | test | |
| 354 | A test that guards only what a release brings runs where the release is made | n/a | published per merge | | |
| 355 | A test that fails for no reason is mended or removed, never retried in silence | met | no retry steps in `tests.yml` | review | |
| 356 | A check that fails on the default branch has an owner, and is run again once | met | look and wake read `main`'s checks | nothing | |
| 357 | A new test says what it guards | met | headers in `tools/rules/*.js` | review | |
| 358 | A test opens a screen only where the screen is what it guards | met | render and ui suites only in headless Chrome | review | |
| 359 | A test reaches a real clock or another process only where it guards it | met | engine suites on seeded ticks | review | |
| 360 | A test asserts no time measured on a real clock | met | none seen | review | |
| 361 | A tree that passed is not run again | not met | a push to `main` reruns the tree its PR passed | nothing | agent (G5) |
| 362 | What a push waits on has a time mark | not met | no marks | nothing | agent (G5) |
| 363 | A long measurement runs outside the session | met | `AGENTS.md`: abtest and censuses by hand | nothing | |

## tasks/tools.md, tasks/updates.md, tasks/ways.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 364 | One door in: `AGENTS.md` | partly | `fresh.mjs`: `AGENTS.md` lacks the kit's rows and paragraphs (#808) | check (fresh, in look) | agent (G16) |
| 365 | One script says what to read | met | "Read for it:" lines | check (pr-description) | |
| 366 | Hooks save time; checks are the guarantee | met | hooks in `.claude`, `.codex`, `.kiro`; checks in CI | check | |
| 367 | A change of tool loses nothing | met | entry files mirror the `@` list | check (entry-files) | |
| 368 | Proven by the staged cases, tool by tool | n/a | the core's own proof | | |
| 369 | Each tool's part | met | `core/tools/*` taken whole | check (copies) | |
| 370 | Each tool's part says whether it starts a session of its own | met | same | check (copies) | |
| 371 | What the core offers one tool, it offers each | met | work-saved hook for Claude, Codex, Kiro | check (entry-files) | |
| 372 | A question or difference about a rule of the core starts from its reasons | met | #808's differences argued from reasons | review | |
| 373 | The newest stable version, unless there is a reason | partly | playwright 1.65 bump open (#823); Stryker's packages (`checks/mutation`) never updated | check (versions.yml) | agent (G23) |
| 374 | Node | met | core's pin used (`dependabot.yml` comment) | check (versions.yml) | |
| 375 | CodeQL | met | `codeql.yml` | check | |
| 376 | A way of running sessions has a part of its own | n/a | the core's parts; the project adds no way | | |
| 377 | A session's state is read where the way gives it | n/a | as 376 | | |
| 378 | What a way installs is listed | n/a | as 376 | | |
| 379 | The floor, said for each way | n/a | as 376 | | |
| 380 | A staged run through each way | n/a | as 376 | | |

## tools/*.md

| # | rule | answer | evidence | held by | missing |
| --- | --- | --- | --- | --- | --- |
| 381 | What it reads (Antigravity) | met | `.agents/rules/core.md` with `trigger: always_on` | check (entry-files) | |
| 382 | Handed a task (Antigravity) | n/a | no Antigravity task on record | | |
| 383 | Hooks (Antigravity) | n/a | it has none | | |
| 384 | Its folders (Antigravity) | met | `.agents/` protected | review | |
| 385 | Auto mode may refuse | met | no workaround of a refusal on record | nothing | |
| 386 | The owner may allow three steps once | n/a | the owner's user settings, outside the repository | | |
| 387 | Pass both model and effort | met | `.claude/agents/Explore.md` haiku/low; `helper-call.mjs` hook | check (hook) | |
| 388 | Name models by family alone | met | cost lines "(Opus)" | nothing | |
| 389 | Fable's usage runs out first | met | no Fable use on record | nothing | |
| 390 | Who to call | met | fresh reviewers; Explore helper | nothing | |
| 391 | Who builds | met | orchestrator picks builders (#808) | nothing | |
| 392 | On GitHub (Codex) | partly | review asked as "@codex review" with more text (#816), not the bare mention | nothing | agent (G13) |
| 393 | Through its plug-in in Claude Code | n/a | plug-in not used here | | |
| 394 | As a project's own agent (Codex) | met | `.codex/hooks.json`; reads `AGENTS.md` | check (entry-files) | |
| 395 | What it reads (Copilot) | n/a | Copilot not used (no PR or file of its) | | |
| 396 | Handed a task (Copilot) | n/a | as 395 | | |
| 397 | Hooks (Copilot) | n/a | as 395 | | |
| 398 | What it reads (Kiro) | met | `.kiro/steering/core.md` mirrors the `@` list | check (entry-files) | |
| 399 | Handed a task (Kiro) | n/a | no Kiro task on record | | |
| 400 | Hooks (Kiro) | met | `.kiro/hooks/work-saved.json` | check (entry-files) | |
| 401 | Its includes (Kiro) | met | whole-file includes only | check (entry-files) | |
| 402 | Its folder (Kiro) | met | `.kiro/` protected | review | |
| 403 | The tests you are given are the contract | met | *other builders' checks* slot filled | nothing | |
