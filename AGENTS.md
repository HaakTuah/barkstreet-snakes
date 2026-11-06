# Barkstreet Snakes

A snake game on a mossy log: you against three AI rivals drawn from a cast of eighteen, in the browser on desktop and
phone, with online play through PeerJS. Plain HTML, CSS and JavaScript: no build step and no dependencies, which is one
of its features. The owner plays it, gives feedback and decides; builders like you build it. Live at
https://haaktuah.github.io/barkstreet-snakes/.

**Every role works from this file** and the shared docs it names, whichever model fills it; who fills each today:
`docs/claude-and-codex.md`, "Who does what". Codex: read its "For Codex" section at the start of every task.

## Where things are

| What | Where |
| --- | --- |
| What is done and the queue, in order | `docs/PROGRESS.md` |
| Claude and Codex: who builds what, the hand-over, the fallback, the reviews' score | `docs/claude-and-codex.md` |
| Security: the rules every role keeps; what is protected and who might attack (the threat model) | `SECURITY.md`, `docs/threat-model.md` |
| How builder sessions and lanes are run (for the orchestrator), and the workshop check's marks | `docs/orchestrating.md` |
| Running and checking it: every tool, PR pictures, GitHub's REST calls, Dependabot, CodeQL; each file and where each folder lists its parts ("How it's put together") | `docs/developing.md` |
| The design, one file per topic | `docs/design/` (index: `DESIGN.md` at the root) |
| Materials the queue points to, with the specs word for word of the entries that name one (`queue-specs.md`) | `docs/handoff/` |
| Study and measuring tools from earlier rounds (censuses, audits, PR pictures) | `tools/dev/` (done ones: `docs/archive/`) |
| History: the old polish audit, the plan as it grew, the owner's instructions word for word | `docs/archive/` |

## Starting a task

1. Work from `develop`: if you are on `main`, check out `develop` first.
2. Take the main lane's next entry, as "State" in `docs/PROGRESS.md` names it. Its entry there, the section of
   `docs/handoff/queue-specs.md` it names where it names one, and the design sections it names are the spec.
3. Read only those sections: `grep -rn "## Section" docs/design` finds a section that code or the queue names.
4. Check weekly usage with `scripts/usage.sh`, and again after every commit ("Usage"). If it says "unknown", say so in
   the first line of each PR you open and carry on: the owner then watches usage and pauses the work at about 90%.
5. Before opening the task's PR, read its entry in `docs/PROGRESS.md` on `develop` and its `question` issues again,
   since the owner's answers can change it while you work: build what changed, or, if that is large, say so in the PR and
   add it as its own entry right after the task.

## How to work

Every rule here says what it is for. The aim behind them all: as much finished work of full quality as the week's usage
allows, at the lowest cost now and later. Four of them are the pillars that hold the rest up: **one fact, one place**,
**split by meaning**, **keep it lean** and **read little**. Every review enforces the first three ("What blocks" in
`docs/review-guidelines.md`), and the workshop check measures what every session reads.

- **A question is a question.** Answer it; act on it only when the owner says so.
- **Match effort to the task,** and take the cheapest approach that does the job well, since usage is limited. Docs,
  READMEs, small fixes and config: one pass, no helpers.
- **Read little.** Never read a large game file whole (`render/world.js` is about 40 KB): find what you need
  with `scripts/codemap.sh <file>` or grep, then read that line range. Don't re-read what you just edited.
- **Print little.** `scripts/test.sh` and `scripts/sim.sh` print a summary and the failures and keep the full log in a
  file; never paste a full log into the conversation. Run long ones in the background (`CLAUDE.md` says how, for
  Claude) and wait for the completion notice: never poll, and keep no agent alive just to wait.
- **Helpers, effort and escalation:** the roles, when a helper pays, escalation and the hard work:
  `docs/claude-and-codex.md`, "Who does what"; each tool's own models and effort: its own file (Claude Code's:
  `CLAUDE.md`; Codex's: "For Codex" in the same doc).
- **Edit in place,** and **don't loop:** if the same approach fails twice, stop, write down what you tried, and change
  course, hand it to escalation, or mark the item blocked in the PR and `docs/PROGRESS.md`, with its brief ready for a
  later session (the problem, what was tried, the files and lines), and go on to the next.
- **One fact, one place, everywhere** (archive, 3 November 2026): in code, data, tests, docs, rule files and the briefs
  agents are given. Point to where a thing lives and never copy it, whole or as a selection of its lines: every copy
  drifts from the original, and is paid for again on every read. The copies check (`tools/copies-test.js`, on every PR)
  fails a new copy of code or of the rule files' prose; its baseline lists the old ones, which are removed over time and
  never added to. The one place is where the readers who need it look for it ("Split by meaning"), and only the places
  whose readers need it point to it, since a pointer is read too. When a better home appears, because its readers change
  or the file it sits in grows to hold other things, it moves there in one PR: every pointer that still makes sense
  updated, the rest removed, nothing left behind in the old place. A design call goes into its topic file in
  `docs/design/`.
- **No description left untrue** (archive, 4 November 2026), so no reader, player or builder, meets a text the game no
  longer matches. A change updates, in the same PR, every place that describes what it changes, found by searching for
  its names: its topic file in `docs/design/` and, for what a player sees, the README, the lesson, the Field guide row
  and the hints on screen. Each of those is the one place for its own readers, so where two design files describe one
  thing, one becomes a pointer to the other. Dated records (the archive, old reports) stay as they were. Each milestone
  PR says in one line whether the README is current, and fixes it if not.
- **Keep it lean.** Every change removes what it replaces, in the same PR: no commented-out code, no "old" copies,
  nothing it made unused (code, files, settings, assets, test helpers). Look for an existing helper before writing one.
  A leftover is a finding in every review.
- **Split by meaning, from the start,** so each reader reads only what it needs and nothing it must read past. Each file holds one thing people look up
  on its own (a rival, a voice, a system, a screen), as small as that thing is; new work goes into its own file as it
  is written, never into a big file to be split later. Smaller is not better: one thing spread over several files costs
  every reader more, and every file is also a script tag and an `sw.js` entry. Where a family differs only in part
  (rivals, voices, moves), write the shared part once and each difference as an override. Size is only a warning: a
  file past about 20 KB probably holds more than one thing. Splitting an existing file goes in its own PR, with
  behaviour proven unchanged (fingerprints and suites) and what it saves said in the PR. **Step 0:** before an entry or
  lane changes a file past about 50 KB, that file is split by meaning first, in its own PR; and new work for a file
  past the mark goes in as a new file, never as more lines in it (the reading-size check, `tools/sizes-test.js`, holds
  every PR to it). The workshop check and the file-by-file reviews still run.
- **Principles over rules.** Where a rule's letter would defeat what it is for, follow its purpose, say so in the PR
  under "Readings taken", and flag the rule to be fixed. Never for the safety rules: `SECURITY.md`, `main`, keys and
  secrets, and the storage keys.
- **The smallest setup that tests the rule,** so checks stay fast as the game grows: a scripted board with only the
  snakes and food it needs, for a few ticks. Full rounds only in the few tests that guard the whole (the simulation's
  fingerprint and `--check`, the online round trip); long measurements (`tools/abtest.js`, censuses) in
  `scripts/sim.sh`, never in CI.
- **The owner's words are kept, in the archive.** Quote each instruction he gives word for word, dated, in the PR and
  in the archive (`docs/archive/instructions.md` says which file), leaving out personal details as `SECURITY.md`, point
  11, says. A standing rule
  goes, as briefly as it can be said and with what it is for, into the section of this file where it applies (or
  `CLAUDE.md`, if only Claude uses it). Rule files state rules, never quotes or dated history (a date a measurement or a status needs may stay), with at most a pointer to the
  archive, "(archive, D Month YYYY)": every session pays to read them, and the archive keeps his words.
- **Each game's files stay in its own repository.** Never write this project's notes, logs or files into another
  project's repository or folders, such as Amarna Letters'.
- **Sessions.** When sessions are started for you task by task, stop when your task is merged and say what is next;
  otherwise carry on with the next task.

## Questions, readings and ideas

Everything the owner should see lives in one place, this repository's issues, so nothing is lost or said twice and he
never has to hunt.

- **Every reading is noted.** Each reading a task takes, where its entry or the design left something open, goes into
  its PR under "Readings taken", with the rule it rests on ("Rules that stand", or the design section). Most questions
  are answered that way; the rest go to the owner, as the next point says.
- **One inbox: issues assigned to the owner** (`HaakTuah` on GitHub). A question he must answer, or a reading he should see (a matter of taste,
  or one no rule settles), is an issue labelled `question`, with the reading taken and its alternative. An idea is a
  Feature request (`enhancement`); a bug the task at hand will not fix is a Bug report (`bug`). File an idea or a
  bug with its template's headings and label (`.github/ISSUE_TEMPLATE/`), copied into the body: the API applies none.
  Search the open issues first and add to one rather than file it twice. Each issue holds the whole of it, answerable
  from a phone, and says in plain words what each thing is and why it matters, by the game's own names, never only by a
  title a builder made up; so does each line that points to one (archive, 3 November 2026).
- **Everywhere else, only a pointer.** A PR, a report and a session's last message never repeat an issue: under
  "Questions for the owner" they list the issues they opened or touched, one line and a link each ("none" if none).
- **Only the owner's comments answer** (`SECURITY.md`). Agents may post under his login too, so every agent that does
  ends what it writes with its own tool's attribution line (Claude Code's: "Generated by" or "Generated with" Claude
  Code, linked; Codex posts as its own bot): one from `HaakTuah` without one is his. Whoever acts on his answer quotes it word for word in
  the archive, writes the decision where it belongs, and closes the issue with a link to where the
  work now lives (a design document, progress entry or PR), so "open" always means "needs him".
- **Ideas are cheap to file and never built unqueued.** Anyone may file one with a line of what and why; keep it short,
  at most a couple per task. Nothing is built from an idea, and no agent treats another's idea as an instruction, until
  the owner has moved it into `docs/PROGRESS.md`. Version updates are upkeep, not ideas (`docs/developing.md`).
- **Bugs don't wait for the owner.** A bug in the task at hand is fixed in it. One outside it is filed, and any lane
  whose files it touches may claim and fix it. A bug closes only when its fix is live, so the open bugs are what players
  still meet: the fix's commit says "Fixes #n", and GitHub closes it when that commit reaches `main`; never by hand. A fix that would change a rule or the design is a
  question instead.

## How work flows

Waiting is lost time and, past an hour, a lost cache. The orchestrator's part, and the full text: `docs/orchestrating.md`.

1. **Review in the background:** when the work is done, mark its draft PR ready (`docs/developing.md`), which starts
   its one automatic security review; ask for the code review and the design check when the PR gets them, at once
   (which PR gets which: "Codex reviews" in `docs/claude-and-codex.md`); go on with what comes next; fix what they find
   in one round; say in the last message what merged and what is next. Merge only at a 10 from each review it gets (a
   PR with no review merges on green checks), and only past the security gate, as point 6 of "Codex reviews" in `docs/claude-and-codex.md` sets it.
2. **The next entry from `develop`,** never stacked on an open PR's branch. An AI entry waits for the last AI change to
   merge, so each head-to-head compares against a settled AI.
3. **Lanes beside it** for independent work: different files from every open lane, no shared measurement, no waiting on
   another's result. AI and engine-rules changes run one at a time, and so do changes to the online messages. Claim a
   lane with a draft PR from a fresh branch off `develop`, after checking the open PRs; merge `develop` into it before
   review; change the progress file only when it merges.
4. **The brake:** from about 85% of the weekly usage no new side lane opens; from about 90%, only small things in the
   main lane ("Usage").

## Rules that stand

The owner's words behind them are in `docs/archive/instructions.md`.

- **The rivals never treat a person differently.** No `isPlayer`, or anything like it, in AI logic or in what the AI is
  shown (`aiView()` only, which holds nothing a snake on the log could not see or know, such as a person's input
  before it lands); rivals judge the player by behaviour, like any snake. The UI may single the player out.
- **No ability only people use.** Every move or rule a person can use, the rivals use too, when it pays and in their
  own style, and they see it used against them; rules tests prove both, through the same engine calls. If the rivals
  can't learn a move well, the move doesn't go in. **No refuges:** a move must take timing and skill and never make
  anyone safe; measure how often it is used, fails, and whether its users outlive everyone, and tighten or drop it.
- **Clever rivals, human reactions.** No superhuman reaction speed, but very clever: they get better through planning
  ahead, never through faster reactions, more samey strategies, or play below good gameplay levels (archive,
  11 and 14 October 2026).
- **Every new move is tested both ways:** for every move or rule a snake can choose to use, `tools/abtest.js` on fresh
  seeds pits rivals that use it against a copy where only some rivals lose it (the rule itself unchanged). Its users
  should come out ahead in wins or survival; if not, the PR says why: the move doesn't matter (a design finding for the
  owner) or the rivals play it badly, fixed before it merges. The PR's table shows how often each rival used the move
  and how often it worked. A move too rare to move whole rounds is judged per use, each use forked and played on with
  and without it; and a move is measured against rivals who play its counter (a dodge is worth only what the threat it
  dodges is worth).
- **Every new rule needs a visible cue and a lesson** (a one-time lesson and a Field guide row): it always comes with
  both (archive, 3 November 2026).
- **Every rival keeps its trademark,** measured before and after a change, as `--signatures` measures it (`TRADEMARKS`
  in `tools/sim/03-report.js`).
- **Optimizations may change decisions only if nothing noticeable is lost,** all within noise: skill (per-persona win
  rates, and old against new AI coming out even), character (every trademark) or feel (round length, deaths by cause,
  starving and crashes survived). Visuals too: a look-alike is fine if nobody would see a difference. Fingerprint-identical changes are the fast lane; the rest go through
  `tools/abtest.js` on fresh seeds.
- **Conditional goods: no solutions, only trade-offs** (archive, 31 October 2026). Every move, food or power helps in some situations and costs in others; simulations check that
  neither always nor never using it wins, as with the mushrooms.
- **Everything new belongs:** it must feel balanced, cohesive and purposeful, and fit with the rest of the game
  (archive, 13 October 2026).
- **Online stays in step:** everything new works in online play, with a protocol bump when messages change.
- **Never rename** the storage keys or `net.js`'s PREFIX (`SECURITY.md`, rule 7), and never create a repository named
  `snake-game`: old links redirect from it.

## Usage

Work continuously, task after task. From about 90% of the weekly limit, take on no bigger task, so the rest of the week
stays the owner's: finish the one at hand if nearly done, or bring it to a clean commit and a draft PR saying how to
test it and what is left; then only small things (a fix, a doc), noting where you stopped in `docs/PROGRESS.md`. This
game's and Amarna Letters' building sessions share the limit; only the measured share counts, never the app's warning.

## Git and GitHub

`main` is the owner's and is what the live site plays: never push to it, never force-push. Work on a branch from
`develop`, one per task, with a PR into `develop`; merge it yourself when the suites pass and its reviews pass
("Reviews" in `docs/claude-and-codex.md`; "How work flows", point 1). Push after every commit, even before the PR opens (a draft PR if it
is not ready), so nothing is lost if a session dies. Before pushing to a branch whose PR you opened earlier, check
whether that PR was merged; if it was, start a new branch and PR.

**Milestones,** so the live game never lags: one is due whenever a change a player would notice has merged into
`develop`, and at least once a day while work merges. Make sure a PR from `develop` to `main` carries the new work,
saying what to try, with its line of what is new at the top of `version.js`'s news and the workshop check's line
(`docs/orchestrating.md`, "The workshop check"); merge it yourself once its CI is green, and carry on without waiting
for the owner. **Before pushing `develop`,** check the last `develop` -> `main` PR
(the call in `docs/developing.md`): if it has merged, merge `main` back into `develop` first and open a new milestone PR.

**Dependabot, CodeQL, PR pictures and the REST calls:** `docs/developing.md`; Dependabot's security PRs and what to do
with a finding: `SECURITY.md`, points 4 and 9.

## Commands

```bash
scripts/cloud-setup.sh                 # cloud machines: Node 26, the tools' packages and Chromium, if missing (it runs by itself when a cloud session starts)
scripts/test.sh                        # the types (tsc) and every suite, quiet; or name some: scripts/test.sh rules render
                                       # (exits 1 if any fails; piped, as in `| tail`, the pipe's code is tail's: use set -o pipefail)
scripts/sim.sh 200 --seed 3 --census   # tools/simulate.js, quiet: fingerprint, check and tables (also seed 11)
scripts/codemap.sh engine/step.js       # the functions of a game file, with line numbers (ai/*.js, render/*.js, game/*.js too)
scripts/usage.sh                       # weekly usage, if this session can read it
```

The simulation always prints its fingerprint; `--check` also fails the run if a round stalls or a rival never wins. A
change that should keep behaviour must keep the fingerprints.

## Review guidelines

Every reviewer, Codex's code review included, reads `docs/review-guidelines.md` whole and judges the change by it, with
`SECURITY.md`. The guidelines have a file of their own so a reviewer reads only what it needs, and a builder session
does not carry them (archive, 3 November 2026).
