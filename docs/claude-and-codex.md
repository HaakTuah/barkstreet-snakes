# Claude and Codex

Decided 1 November 2026 (`docs/archive/instructions.md`, 1 November 2026). Two builders spread the weekly usage, Claude on Haakon's Claude plan and Codex
(OpenAI's) on ChatGPT Pro, and review each other: different models have different blind spots. This file is the whole
arrangement; `AGENTS.md` points here, and nothing here is repeated there.

## Who does what

- **The orchestrator is Claude, always:** it writes the briefs, routes the work, takes the readings, gives the
  reviews' verdicts, merges, and brings Haakon his questions.
- **The builders:** Claude's builder sessions, and Codex in OpenAI's cloud, started by an `@codex` comment on GitHub.
- **The reviewer is the other company's model.** Codex's PRs get Claude's reviewer (Opus, high effort), given
  the diff and the task's text: it holds the picture of the finished game and sends the work back until it meets it. Claude's PRs
  that change the game get `@codex review` (Codex's automatic review is off, so it reviews only when asked). When
  Codex is unavailable, Claude's reviewer takes both, as before.
- **Escalation goes to the other model first:** a problem that has defeated Claude twice goes to Codex as a
  self-contained `@codex` comment (the problem, what was tried, the files and lines); one that has defeated Codex goes to
  Claude's escalation helper. Either way the orchestrator checks the answer.
- **Only the orchestrator merges.** Codex never merges, never touches `main`, and never pushes to a branch it was not
  given.

## What goes to Codex

**Route by how the result can be checked.** If tests, fingerprints, the suites and `tools/abtest.js` or a measurement can prove the work right, Codex builds
it, and a wrong result shows itself; if only judgment can (taste, the design, the sources), Claude does.

- **Claude keeps the decisions and hands them over as tests that fail.** Codex makes them pass without changing them;
  if it thinks one is wrong, it says so on the thread instead of rewriting it.
- **Hand off only when the implementation is clearly bigger than its brief and review:** many files, a few hundred
  lines or more, or long measuring runs. Smaller work Claude does itself. The PR says which was chosen and why.

| Claude decides and builds | Codex builds |
| --- | --- |
| The AI's planning and every rival's trademark | Layout and interface fixes |
| Engine rules and new moves (the A/B judgment: "Every new move is tested both ways") | Render bugs that come with a repro |
| Online sync and the protocol | Splitting files and tests, proven by fingerprints and the suites |
| Chatter lines and lesson texts (the voice) | Keeping the browser suites working |
| What a change should feel like, from Haakon's feedback | What Claude has specified as tests: a move's cue and lesson wiring, a rule's implementation, A/B runs and their tables |
| | Docs that record what is decided, and the PR-picture tooling |

Whole with Claude, since there the code is the hard part and a brief cannot hold the decisions: the AI's search, online
sync, and the orchestrator's own work (briefs, routing, readings, reviews' verdicts, merges).

Changes to the AI or the engine's rules still run one at a time, and so do changes to the online messages ("As many
lanes as can run in parallel"): Codex lanes are side lanes beside them. **Trial:** in the first week, one art or
animation task to Codex, compared against Claude's; after that, art goes where it scored better.

## Handing work to Codex

1. **Claim the lane** as usual (a draft PR, as "As many lanes as can run in parallel" says); for a Codex lane the claim may instead be an issue, which counts as a
   claimed lane until Codex's PR closes it.
2. **Comment `@codex` with the brief.** Codex starts fresh each time: it sees only the thread and the repository, so
   the brief stands alone: the task, the sections and files to read (paths), the tests it must pass, what not to
   touch, and what its PR must say (the first lines "AGENTS.md" asks for, "Readings taken", "Questions for Haakon").
3. **Questions go on the thread,** both ways, each comment standing alone (no "as discussed"). At most **two rounds**
   per question; then the orchestrator takes the most reasonable reading and writes it under "Readings taken".
   Whatever only Haakon can settle goes to "Questions for Haakon" and the "For Haakon" table in `docs/PROGRESS.md`, as always.
4. **Codex's PR** is reviewed as below, sent back with `@codex` and the review's list, and merged by the orchestrator.

## When Codex is not there

Codex's usage can run out with no alert, so the orchestrator never waits on it for long:

- **No sign within about 15 minutes** that Codex has started (a reply, a reaction, a branch), **or no PR within about
  2 hours:** take the lane back. Write "Taken back by Claude" on the thread and give it to a Claude builder.
- **A Codex PR that arrives after that is closed unmerged,** so the same work never lands twice.
- **After one silent timeout Codex counts as unavailable:** hand it nothing until a small test task gets through,
  tried at most every few hours. Meanwhile the work is Claude's alone, as before Codex came.
- The times are first guesses (1 November 2026): adjust them from what the first weeks show, and say so here.

## Reviews: a score, and what keeps it from 10

Every review, in either direction:

1. **Gives a score from 1 to 10 and lists everything that keeps the work from 10,** each point concrete (a file and
   line, or a design section) and marked **blocking** (against the design, the task's text, its tests or the standing
   rules) or **not blocking**.
2. **Sends the work back while any point blocks.** When none does, it merges; the points that do not block go into the
   PR as a note, or into `docs/PROGRESS.md` as a small follow-up entry.
3. **At most three rounds.** Then the orchestrator decides, or escalates to the other model, and writes why.
4. **One line in each PR:** `Review: <category> · <builder> · <score each round>`, such as
   `Review: interface · Codex · 7, 9`. At each milestone the orchestrator sums them by category and builder in the
   milestone PR: a category where Codex scores lower moves back to Claude, one where it does well gets more.

## For Codex

- `AGENTS.md` applies to you in full, except Claude's helpers, models and effort.
- Build only what the `@codex` comment gives you, and read only what it names (and what `AGENTS.md` says to read).
- **The tests you are given are the contract:** make them pass; never change, skip or weaken them. If you think one is
  wrong, say why in a PR comment and leave that part.
- Run `scripts/test.sh` before you open the PR, and `scripts/sim.sh` with the fingerprint for a change that should keep behaviour.
- Your PR goes into `develop` and opens as `AGENTS.md` and the rules say. Never merge, never touch `main`, never
  force-push, never put a key or secret anywhere.
- Your environment has no internet while you work: its setup script installs what the suites need. If something is
  missing, say what in the PR instead of working around it.
- Your review of Claude's PRs follows "Reviews" above: the score, the list, blocking or not.

## Setup (1 November 2026)

- Codex on ChatGPT Pro 100, connected to HaakTuah's two game repositories. Code Review: automatic review off,
  exhaustive review on, so reviews run only on `@codex review`.
- One Codex cloud environment per repository, its setup script `bash scripts/cloud-setup.sh`, the agent's internet
  off.
- Before the first lane: a health check in each environment (`scripts/test.sh`, reporting what fails and why), then one
  small Barkstreet Snakes docs lane to test that an `@codex` comment starts a task. If it does not, the fallback is a
  runner on Haakon's PC (`codex exec`), designed then.
