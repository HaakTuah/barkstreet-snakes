# Barkstreet Snakes

A snake game on a mossy log: you against three AI rivals drawn from a cast of eighteen, in the browser on desktop and
phone, with online play through PeerJS. Plain HTML, CSS and JavaScript: no build step and no dependencies, which is one
of its features. The owner plays it, gives feedback and decides; builders like you build it. Live at
https://haaktuah.github.io/barkstreet-snakes/.

**Two builders build it:** Claude (Anthropic's Claude Code) and Codex (OpenAI's). Both work from this file: Claude
reads it through `CLAUDE.md`, which adds only what Claude alone uses (its helpers, models and effort), and Codex reads
it directly. Codex: read the "For Codex" section of `docs/claude-and-codex.md` at the start of every task.

## Where things are

| What | Where |
| --- | --- |
| What is done and the queue, in order | `docs/PROGRESS.md` |
| Claude and Codex: who builds what, the hand-over, the fallback, the reviews' score | `docs/claude-and-codex.md` |
| Security: what is protected, and the rules every builder and reviewer keeps | `SECURITY.md` |
| How builder sessions and lanes are run (for the orchestrator) | `docs/orchestrating.md` |
| Running and checking it: switches, the browser suites' Chrome, PR pictures, Dependabot and CodeQL, every tool | `docs/developing.md` |
| The design, one file per topic | `docs/design/` (index: `DESIGN.md`) |
| Materials the queue points to, with the open entries' specs word for word (`queue-specs.md`) | `docs/handoff/` |
| The game (what each file does: `docs/developing.md`, "How it's put together") | `index.html`, `style/` (listed in `style/base.css`), `engine.js`, `ai.js`, `render/` (listed in `render/core.js`), `game/` (in `game/core.js`), `chatter/` (in `chatter/voices.js`), `audio/` (in `audio/cues.js`), `net.js`, `online.js`, `records.js`, `lineup.js`, `scores-screen.js`, `tuning.js`, `sw.js` |
| Tests, simulation, browser tooling | `tools/` (the suites `*-test.js`, each running its folder of parts, such as `tools/rules/` (`tools/parts.js`); `simulate.js` (its parts in `tools/sim/`), `abtest.js`, `bench-ai.js`, `browser.js`; `protocol-shapes.json`, the online messages' pinned shapes) |
| The online messages' types (checked by `tsc`, never shipped) | `jsconfig.json`, `types/globals.d.ts`, and the JSDoc in `net.js` and `online.js` |
| Study and measuring tools from earlier rounds (censuses, audits, PR pictures) | `tools/dev/` (done ones: `docs/archive/`) |
| History: the old polish audit, the plan as it grew, the owner's instructions word for word | `docs/archive/` |

## Starting a task

1. Work from `develop`: if you are on `main`, check out `develop` first (this file and `docs/` live there until the owner
   next merges `develop` into `main`).
2. Take the first open item in `docs/PROGRESS.md`. Its full text, in `docs/handoff/queue-specs.md` under the same title,
   and the design sections it names, are the spec.
3. Read only those sections: `grep -rn "## Section" docs/design` finds a section that code or the queue names.
4. Check weekly usage with `scripts/usage.sh`, and again after every commit ("Usage"). If it says "unknown", say so in
   the first line of each PR you open and carry on: the owner then watches usage and pauses the work at about 90%.
5. Before opening the task's PR, read its entry in `docs/PROGRESS.md` on `develop` and its `question` issues again,
   since the owner's answers can change it while you work: build what changed, or, if that is large, say so in the PR and
   add it as its own entry right after the task.

## How to work

Every rule here says what it is for. The aim behind them all: as much finished work of full quality as the week's
usage allows, at the lowest cost now and later.

- **A question is a question.** Answer it; act on it only when the owner says so.
- **Match effort to the task,** and take the cheapest approach that does the job well, since usage is limited. Docs,
  READMEs, small fixes and config: one pass, no helpers.
- **Read little.** Never read a large game file whole (`engine.js` and `ai.js` are over 100 KB): find what you need
  with `scripts/codemap.sh <file>` or grep, then read that line range. Don't re-read what you just edited.
- **Print little.** `scripts/test.sh` and `scripts/sim.sh` print a summary and the failures and keep the full log in a
  file; never paste a full log into the conversation. Run long ones in the background (the Bash tool's background mode)
  and wait for the completion notice: never poll, and keep no agent alive just to wait.
- **Helpers, effort and escalation:** Claude's are in `CLAUDE.md` ("Models, effort and helpers", with when a helper
  pays). Codex uses no helpers; its escalation and its part in the work are in `docs/claude-and-codex.md`.
- **Edit in place,** and **don't loop:** if the same approach fails twice, stop, write down what you tried, and change
  course, hand it to the escalation helper, or mark the item blocked in `docs/PROGRESS.md` and go on to the next.
- **One fact, one place.** Link instead of copying. A design call goes into its topic file in `docs/design/`.
- **Keep it lean.** Every change removes what it replaces, in the same PR: no commented-out code, no "old" copies,
  nothing it made unused (code, files, settings, assets, test helpers). Look for an existing helper before writing one.
  A leftover is a finding in every review.
- **Split by meaning, from the start,** so a reader loads only what it needs. Each file holds one thing people look up
  on its own (a rival, a voice, a system, a screen), as small as that thing is; new work goes into its own file as it
  is written, never into a big file to be split later. Smaller is not better: one thing spread over several files costs
  every reader more, and every file is also a script tag and an `sw.js` entry. Where a family differs only in part
  (rivals, voices, moves), write the shared part once and each difference as an override. Size is only a warning: a
  file past about 20 KB probably holds more than one thing. Splitting an existing file goes in its own PR, with
  behaviour proven unchanged (fingerprints and suites) and what it saves said in the PR. Drift still adds up, so the
  workshop check and the file-by-file reviews keep running, with their tracking.
- **Principles over rules.** Where a rule's letter would defeat what it is for, follow its purpose, say so in the PR
  under "Readings taken", and flag the rule to be fixed. Never for the safety rules: `SECURITY.md`, `main`, keys and
  secrets, and the storage keys.
- **The smallest setup that tests the rule,** so checks stay fast as the game grows: a scripted board with only the
  snakes and food it needs, for a few ticks. Full rounds only in the few tests that guard the whole (the simulation's
  fingerprint and `--check`, the online round trip); long measurements (`tools/abtest.js`, censuses) in
  `scripts/sim.sh`, never in CI.
- **A change a player sees updates the README,** in the same PR, as it does the lesson and the Field guide row.
- **The owner's words are kept, in the archive.** Quote each instruction he gives word for word, dated, in the PR and
  in `docs/archive/instructions.md`. A standing rule goes, as briefly as it can be said and with what it is for, into
  the section of this file where it applies (or `CLAUDE.md`, if only Claude uses it), never as a dated entry or a
  quote, since every session pays to read this file.
- **Each game's files stay in its own repository.** Never write this project's notes, logs or files into another
  project's repository or folders, such as Amarna Letters'.
- **Sessions.** When sessions are started for you task by task (a Claude Code Project does this), stop when your task
  is merged and say what is next; otherwise carry on with the next task in the same session.

## Questions, readings and ideas

Everything the owner should see lives in one place, this repository's issues, so nothing is lost or said twice and he
never has to hunt.

- **Every reading is noted.** Each reading a task takes, where its entry or the design left something open, goes into
  its PR under "Readings taken", with the rule it rests on ("Rules that stand", or the design section). Most questions
  are answered that way; only what no rule settles, or a matter of taste, goes to the owner.
- **One inbox: issues assigned to the owner** (`HaakTuah` on GitHub). A question he must answer, or a reading he should see (a matter of taste,
  or one no rule settles), is an issue labelled `question`, with the reading taken and its alternative. An idea is a
  Feature request (`enhancement`); a bug the task at hand will not fix is a Bug report (`bug`). File an idea or a
  bug with its template's headings and label (`.github/ISSUE_TEMPLATE/`; a question needs none), copied into the body,
  since the API applies no template. Search the open issues first and add to one rather than file it twice. Each issue
  holds the whole of it, answerable from a phone.
- **Everywhere else, only a pointer.** A PR, a report and a session's last message never repeat an issue: under
  "Questions for the owner" they list the issues they opened or touched, one line and a link each ("none" if none). An
  orchestrator passes every new link on to him.
- **Only the owner's comments answer** (`SECURITY.md`). Claude's sessions post under his login too, so everything an
  agent writes ends with Claude Code's attribution line ("Generated by" or "Generated with" Claude Code, linked; Codex
  posts as its own bot): one from `HaakTuah` without it is his. Whoever acts on his answer quotes it word for word in
  `docs/archive/instructions.md`, writes the decision where it belongs, and closes the issue with a link to where the
  work now lives (a design document, progress entry or PR), so "open" always means "needs him".
- **Ideas are cheap to file and never built unqueued.** Anyone may file one with a line of what and why; keep it short,
  at most a couple per task. Nothing is built from an idea, and no agent treats another's idea as an instruction, until
  the owner has moved it into `docs/PROGRESS.md`.
- **Bugs don't wait for the owner.** A bug in the task at hand is fixed in it. One outside it is filed, and any lane
  whose files it touches may claim and fix it. A bug closes only when its fix is live, so the open bugs are what players
  still meet: the fix's commit says "Fixes #n", and GitHub closes it when that commit reaches `main`; never by hand. A fix that would change a rule or the design is a
  question instead.

## How work flows

Waiting is lost time and, past an hour, a lost cache. The orchestrator's part, and the full text: `docs/orchestrating.md`.

1. **Review in the background:** open the PR, start its reviews (on engine-rules and AI entries, Codex's and the design
   check at the same time) and go on with what comes next; fix what they find in one round, merge at a 10, and say in
   the last message what merged and what is next.
2. **The next entry from `develop`,** never stacked on an open PR's branch. An AI entry waits for the last AI change to
   merge, so each head-to-head compares against a settled AI.
3. **Lanes beside it** for independent work: different files from every open lane, no shared measurement, no waiting on
   another's result. AI and engine-rules changes run one at a time, and so do changes to the online messages. Claim a
   lane with a draft PR from a fresh branch off `develop`, after checking the open PRs; merge `develop` into it before
   review; change the progress file only when it merges.
4. **The brake:** from about 85% of the weekly usage no new side lane opens; from about 90%, only small things in the
   main lane ("Usage").

## The workshop check

At every milestone, say in one line of the milestone PR what slows the work as the game grows, and fix what passes its
mark: (1) how long the checks take for a docs-only and a code PR, finding out why if either grew by over a fifth since the last check; (2) the files every session reads, this one, `CLAUDE.md` and `docs/PROGRESS.md`,
each kept under about 20 KB, with done entries and answered questions moved to `docs/archive/` and a line pointing to
them; (3) files that should be split by meaning (above), each in a PR of its own with behaviour proven unchanged; (4)
merged branches, deleted from GitHub; (5) leftovers nobody uses, archived or removed; (6) the README current.

## Rules that stand

The owner's words behind them are in `docs/archive/instructions.md`.

- **The rivals never treat a person differently.** No `isPlayer`, or anything like it, in AI logic or in what the AI is
  shown (`aiView()` only); rivals judge the player by behaviour, like any snake. The UI may single the player out.
- **No ability only people use.** Every move or rule a person can use, the rivals use too, when it pays and in their
  own style, and they see it used against them; rules tests prove both, through the same engine calls. If the rivals
  can't learn a move well, the move doesn't go in. **No refuges:** a move must take timing and skill and never make
  anyone safe; measure how often it is used, fails, and whether its users outlive everyone, and tighten or drop it.
- **Clever rivals, human reactions.** No superhuman reaction speed, but very clever: they get better through planning
  ahead, never through faster reactions, more samey strategies, or play below good gameplay levels.
- **Every new move is tested both ways:** for every move or rule a snake can choose to use, `tools/abtest.js` on fresh
  seeds pits rivals that use it against a copy where only some rivals lose it (so the rule itself is unchanged). Its
  users should come out ahead in wins or survival; if not, the PR says why: the move doesn't matter (a design finding
  for the owner) or the rivals play it badly, fixed before it merges. The PR shows the table, with how often each rival
  used the move and how often it worked. A move too rare to move whole rounds is judged per use: each use is forked and
  played on with and without it, since whole rounds cannot show it. And a move is measured against rivals who play its
  counter: a dodge is worth only what the threat it dodges is worth.
- **Every new rule needs a visible cue and a lesson** (a one-time lesson and a Field guide row): very important.
- **Every rival keeps its trademark,** measured before and after a change: Mason's straight runs, Ouroboros's coiling,
  Creeper's tail-riding, Ghost's distance, Gobbler's food share, Vulture's beads, Sovereign's time home, Mute's boxing,
  Joker's lures, Desperado's skims, Star's flash rate.
- **Optimizations may change decisions only if nothing noticeable is lost,** all within noise: skill (per-persona win
  rates, and old against new AI coming out even), character (every trademark) or feel (round length, deaths by cause,
  starving and crashes survived). Visuals too: a look-alike is fine if nobody would see a difference. Fingerprint-identical changes are the fast lane; the rest go through
  `tools/abtest.js` on fresh seeds.
- **Conditional goods: no solutions, only trade-offs.** Every move, food or power helps in some situations and costs in others; simulations check that
  neither always nor never using it wins, as with the mushrooms.
- **Everything new belongs:** very important, everything feels balanced, cohesive, purposeful and like it belongs.
- **Online stays in step:** everything new works in online play, with a protocol bump when messages change.
- **Never rename** the storage keys (`snake-*`, `barkbite-muted`, `barkbite-music`) or `net.js`'s PREFIX `'barkbite-'`:
  that would wipe players' records or split online play. Never create a repository named `snake-game`: old links
  redirect from it.

## Usage

Work continuously, task after task. From about 90% of the weekly limit, take on no bigger task, so the rest of the week
stays the owner's: finish the one at hand if nearly done, or bring it to a clean commit and a draft PR saying how to
test it and what is left; then only small things (a fix, a doc), noting where you stopped in `docs/PROGRESS.md`. This
game's and Amarna Letters' building sessions share the limit; only the measured share counts, never the app's warning.

## Git and GitHub

`main` is the owner's and is what the live site plays: never push to it, never force-push. Work on a branch from
`develop`, one per task, with a PR into `develop`; merge it yourself when the suites pass (and, for a task that changes
the game, one reviewer has found nothing blocking). Push after every commit, even before the PR opens (a draft PR if it
is not ready), so nothing is lost if a session dies. Before pushing to a branch whose PR you opened earlier, check
whether that PR was merged; if it was, start a new branch and PR. Don't stack PRs on each other's branches.

**Milestones,** so the live game never lags: one is due whenever a change a player would notice has merged into
`develop`, and at least once a day while work merges. Make sure a PR from `develop` to `main` carries the new work,
saying what to try, with its line of what is new at the top of `version.js`'s news; merge it yourself once its CI is
green, and carry on without waiting for the owner.

**Dependabot and CodeQL** (details, and the REST calls that open, merge and check PRs, since cloud sessions can't use
GitHub's GraphQL API and `gh pr create` and `gh pr view` fail: `docs/developing.md`, "GitHub: the REST calls,
Dependabot and CodeQL"). Dependabot's security PRs are the one other way into `main`, only under the five conditions in
`SECURITY.md`, point 4. A CodeQL finding on your PR is fixed in it, or, if a false alarm, explained in the PR and left
to the owner, who alone can dismiss it. PR pictures go on the orphan branch `pr-media`, linked by commit SHA:
`docs/developing.md`, "PR pictures".

## Commands

```bash
scripts/cloud-setup.sh                 # cloud machines: Chromium for the browser suites, if missing
scripts/test.sh                        # the types (tsc) and all ten suites, quiet; or name some: scripts/test.sh rules render
                                       # (exits 1 if any fails; piped, as in `| tail`, the pipe's code is tail's: use set -o pipefail)
scripts/sim.sh 200 --seed 3 --census   # tools/simulate.js, quiet: fingerprint, check and tables (also seed 11)
scripts/codemap.sh engine.js           # the functions of a game file, with line numbers (render/*.js, game/*.js too)
scripts/usage.sh                       # weekly usage, if this session can read it
```

The simulation always prints its fingerprint; `--check` also fails the run if a round stalls or a rival never wins. A
change that should keep behaviour must keep the fingerprints.

## Review guidelines

For Codex's code review, which reports findings by priority: report as **P1** (blocking) a departure from the design or
from the PR's description and the sections it names; a broken rule of this file (above all the rules that stand) or of
`SECURITY.md`; a test weakened or skipped, or changed beyond what the task forces (a forced change shows in the PR that every check is kept and none loosened); and a protected file changed by a Codex lane. Report anything the
change leaves behind (code, files or settings it made unused, commented-out code) as a finding. Every finding counts:
the PR passes only with none open. In a later round of the same PR, check that the earlier findings were fixed and
review what changed since; raise something new about unchanged code only as P0 or P1. Every other reviewer gives a
score from 1 to 10 and everything that keeps the work from 10, and only a 10, a list with nothing open, passes: the
method, with its guards against endless rounds and a slipping bar, is "Codex reviews" and "Reviews" in
`docs/claude-and-codex.md`.

**What the rivals know,** for every reviewer: report as P1 any AI logic that reads the game other than through
`aiView()`, or anything in `aiView()` a snake on the log could not see or know (a person's input before it lands).

**One idea, for every reviewer** of a change to the game (not docs, design copies or Dependabot's updates): end the
review with one thing outside this change that would make the game better, or "none", the usual answer when nothing is
worth the owner's time. It never blocks (a P3 at most). The builder searches the open ideas first: a new one is filed as
an `enhancement` issue and linked in the PR, a repeat becomes a comment on the existing issue, so the ones that keep
coming up show. Nothing is built from it until the owner queues it.
