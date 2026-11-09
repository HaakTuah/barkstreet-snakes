# Orchestrating the builders

How the session that starts builder sessions (the orchestrator) runs them, for it and for any builder that needs the
detail. "How work flows" in `AGENTS.md` keeps what every builder needs from them. Codex's
lanes, its fallback and the reviews between the two builders: `docs/claude-and-codex.md`; a draft PR labelled
`codex` is a claimed lane like any other.

**The orchestrator builds nothing itself** (archive, 2 November 2026). Every lane, the item or main lane included, goes to a builder session of its
own, with its own brief, at the builder's model and effort (for Claude: `CLAUDE.md`). Helpers belong to builders, never to the
orchestrator: a lane is never a helper of the orchestrator's. The orchestrator keeps its own context small, for what
only it does: claims, starting and handing over sessions, merging Codex's work, and the owner's questions word for
word. A session it starts runs at its own effort, and it never waits for one at a higher effort: the builder gives the
hard work more effort inside its own session (`docs/claude-and-codex.md`, "Who does what"). Only if it cannot start
builder sessions at all does it say so and stop, and the owner starts them. Why: its context is re-read on every turn,
so building in it costs the most; it runs at its own effort, not the work's; and if it dies, every lane stops with it.

**The rules, re-read when they change** (archive, 2 November 2026). A running orchestrator remembers the rules as they
stood when it started. So on every wake, the hourly check included, it pulls `develop`, and if any rule file
(`SECURITY.md`, rule 3) changed since it last read them, it re-reads the changed parts,
passes what touches them on to its running builders in one message, and says so in one line to the owner. Nobody has
to tell it. The same wake reads `docs/PROGRESS.md`'s diff since it last looked: it acts on what is new there (an entry
added or moved, an answer of the owner's, a lane opened or a bug put first), opening a lane where one is due, and skips
the done-marks its own builders made (archive, 2 November 2026). **Its report on every wake counts the lanes:** the
lanes open, and every independent entry it is not running, each with its reason ("waits on 2y's files" is one, none
given is not), so a stall shows in one line, the fallback reviewer's security reviews since the last wake, each with its
PR and why it qualified, so overuse shows the same
night, and every PR merged since then on the security gate's fallback, or without passing the security gate ("Codex
reviews", point 6, in `docs/claude-and-codex.md`), so a gap shows too.

- **Pipeline, don't wait** (archive, 28 October 2026): organise the work so the token cache is used to the full and
  no time is lost, with every other cost weighed too. The builder's part (review in
  the background, the next entry from `develop`) is "How work flows" in `AGENTS.md`, points 1 and 2; the
  orchestrator's:
  1. **Bigger review fixes in a session of their own.** If a review asks for more than about an hour's work, the
     orchestrator starts a fresh session for it with the PR, the review and nothing else, at the builder's model and effort (for Claude: `CLAUDE.md`); the
     builder goes on.
  2. **Keep the cache warm.** One session per task, continued for its review fixes and its milestone while its context
     is under an hour old, rather than a fresh session reading everything again. A new task goes to whichever does the
     most work for the fewest tokens without losing quality (archive, 31 October 2026): a session already open when the task touches
     the same files, its context is under an hour old and still small, and its last task has merged; otherwise a fresh
     session, and always one when a session's context has grown large. Long runs and checks go in the background; no turn sits idle waiting. Files every
     session reads stay small (the workshop check), since they are the start of every call.
  3. **Hand over at once.** The orchestrator starts the next session as soon as a task merges, woken by the PR's merge
     rather than a clock, with an hourly check as the fallback.
  4. **The same helpers, used better.** Pipelining spends the same tokens sooner and adds no agents beyond "Models,
     effort and helpers" in `CLAUDE.md`: a reviewer or search helper may run in the background while the builder works.

- **As many lanes as can run in parallel** (archive, 28 October 2026).
  What a lane is, how it is claimed and how it runs on its own: "How work flows" in `AGENTS.md`, point 3; when an
    orchestrator runs, it makes the claims. Each lane's builder keeps its own helpers ("Helpers: when they pay" in
  `docs/claude-and-codex.md`).
  1. **The orchestrator opens a lane for every independent entry it can see,** each a builder session with its own
     brief and check-in, and passes on every lane's "Questions for the owner" word for word.
  2. **The brake closes lanes first** ("How work flows", point 4, and "Usage" in `AGENTS.md`).

## The workshop check

Once a week, at the first milestone seven days or more after the last check (not at every milestone, since milestones
come daily and what it measures changes slowly; archive, 9 November 2026), say in one line of that milestone PR what
slows the work as the game grows, and fix what passes its mark: (1) how long the checks take for a docs-only and a code PR, finding out why if either grew by over a fifth since
the last check; (2) the files every session reads, each kept under its mark (both in `tools/sizes.json`), with done
entries and answered questions moved to `docs/archive/` and a line pointing to them; (3) files that should be split by
meaning (`AGENTS.md`, "How to work"), each in a PR of its own with behaviour proven unchanged ((2) and (3) are measured
on every PR, in the copies check's log, by the reading-size check, `tools/sizes-test.js`); (4) merged branches, deleted from GitHub; (5) leftovers nobody uses, archived or removed; (6) the rule files
(`SECURITY.md`, rule 3), audited by a fresh reviewer for contradictions, duplication, stale lines, unclear instructions
and broken pointers, and for what can be cut: rules that overlap, say more than they need, or have never prevented a
real problem, merged or dropped so the files get shorter and each change touches fewer places, every cut named in its PR
with its reason (archive, 5 November 2026). It runs once at the first milestone after 10 November 2026 and then whenever
more than about a fifth of their lines changed since the last audit (archive, 3 November 2026).
