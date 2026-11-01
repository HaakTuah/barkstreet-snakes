# Orchestrating the builders

The full text of two standing instructions from `AGENTS.md`, for the session that starts builder sessions (the
orchestrator) and for any builder that needs the detail. `AGENTS.md` keeps what every builder needs from them. Codex's
lanes, its fallback and the reviews between the two builders: `docs/claude-and-codex.md`; a draft PR labelled
`codex` is a claimed lane like any other.

- **28 October 2026: pipeline, don't wait.** "Yes, please, organize it expertly so we maximize token caching, time spent, and all other concerns." (to Claude's proposal; the words are in
  `docs/archive/instructions.md`). Waiting is lost time and, past an hour, a lost cache, so:
  1. **Review in the background.** Open the PR, start its review (Codex's: `docs/claude-and-codex.md`, "Codex reviews"; or Claude's reviewer as a
     background agent; on engine-rules and AI entries, Codex's review and the design check together, in the same turn), and go
     on meanwhile with what comes next: the next entry's text, its sections, the check for changes. Fix what the reviews
     find when they return, in one round, then merge at a 10 ("Reviews" in `docs/claude-and-codex.md`).
  2. **The next entry beside it.** Entries are mostly independent: take the next one from `develop`, never stacked on
     an open PR's branch ("Don't stack PRs"). Two AI changes are never measured at once: an AI entry waits for the
     last AI change to merge, so each head-to-head compares against a settled AI.
  3. **Bigger review fixes in a session of their own.** If a review asks for more than about an hour's work, the
     orchestrator starts a fresh session for it with the PR, the review and nothing else, at the task's effort; the
     builder goes on.
  4. **Keep the cache warm.** One session per task, continued for its review fixes and its milestone while its context
     is under an hour old, rather than a fresh session reading everything again. A new task goes to whichever does the
     most work for the fewest tokens without losing quality (Haakon, 1 November 2026: "We should do whatever is most effective at acheivein the goal, which is accomplishing them most possible, with the least tokens, without sacrifacing quality."): a session already open when the task touches
     the same files, its context is under an hour old and still small, and its last task has merged; otherwise a fresh
     session, and always one when a session's context has grown large. Long runs and checks go in the background; no turn sits idle waiting. Files every
     session reads stay small (the workshop check), since they are the start of every call.
  5. **Hand over at once.** The last message says what merged and what is next. The orchestrator starts the next session
     as soon as a task merges, woken by the PR's merge rather than a clock, with an hourly check as the fallback.
  6. **The same helpers, used better.** Pipelining spends the same tokens sooner and adds no agents beyond "Models,
     effort and helpers": a reviewer or search helper may run in the background while the builder works, and the Haiku
     search helper, not the builder reading large files itself, is the cheap way to look across many files.

- **28 October 2026: as many lanes as can run in parallel.** "Yes, allow for as many lanes as can be parallelized, expert." (the words are in `docs/archive/instructions.md`).
  This replaces the limit of two agents in "How to work" for builders; each builder keeps its own limit of helpers.
  1. **A lane is independent work:** it touches different files from every other open lane (or parts of one file
     nobody else touches), shares no measurement with another, and does not wait on another's result. Here, changes to the AI or the engine's rules run one at a time, since each is measured head to head against a settled AI, and so do changes to the online messages, since each bumps the protocol; beside them run independent entries: art, chatter lines, interface and layout fixes, docs and test-file splits.
  2. **Claim it on GitHub first.** Before starting, open a draft PR from a fresh branch off `develop`, its title naming
     the entry, and push; that PR is the claim. Look at the open PRs before choosing, and take only what nobody has
     claimed. The progress file is changed only when the work merges, so lanes never fight over it.
  3. **Each lane on its own.** It merges `develop` into its branch before asking for review, is reviewed and merged by
     the usual rules, and is not stacked on another lane's branch. A lane that finds it needs another's work waits,
     says so in its PR, or folds into that lane.
  4. **The orchestrator opens a lane for every independent entry it can see,** each a builder session with its own
     brief and check-in, and passes on every lane's "Questions for Haakon" word for word.
  5. **The brake closes lanes first.** From about 85% of the weekly usage, no new side lane opens and open ones finish;
     from about 90%, as "Usage" says, only small things in the main lane.
     Only the measured share counts (Haakon, 29 October 2026, when a builder stopped at the app's weekly usage warning: "They weren't supposed to stop before 90%. We're still at only 76%"): the app's weekly usage warning is not the brake, and a session that cannot
     read the share carries on until Haakon says to stop.
