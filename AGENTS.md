# Barkstreet Snakes

A snake game on a mossy log: you against three AI rivals drawn from a cast of eighteen, in the browser on desktop and
phone, with online play through PeerJS. Plain HTML, CSS and JavaScript: no build step and no dependencies, which is one
of its features. The owner plays it, gives feedback and decides; builders like you build it. Live at
https://haaktuah.github.io/barkstreet-snakes/. Codex: read `core/modules/codex.md` at the start of every task.

## The core

This game takes the shared rules in `core/` by `core-manifest.md`, whose slots and names fill the core's words. Read
these whole at the start of every task (Claude Code imports them; Codex: read each file named):

@core-manifest.md
@core/floor/security.md
@core/modules/how-to-work.md
@core/modules/inbox.md
@core/modules/work-flow.md
@core/modules/git.md

The other modules are read when a task needs them, each saying when, among them `core/floor/topics.md` and
`core/modules/game-design.md`. Safety rules of this game's own, which "Principles over rules"
(`core/modules/how-to-work.md`) never reaches: the storage keys (`SECURITY.md`, rule 7).

## Where things are

| What | Where |
| --- | --- |
| What is done and the queue, in order | `docs/PROGRESS.md` |
| Security: what this game adds to the floor; who might attack it | `SECURITY.md`, `docs/threat-model.md` |
| Running and checking it: every tool, its updates; each file and where each folder lists its parts ("How it's put together") | `docs/developing.md`; PR pictures: `docs/pr-pictures.md` |
| The design, one file per topic | `docs/design/` (index: `DESIGN.md` at the root) |
| Materials the queue points to, with the specs word for word of the entries that name one (`queue-specs.md`) | `docs/handoff/` |
| Study and measuring tools from earlier rounds (censuses, audits, PR pictures) | `tools/dev/` (done ones: `docs/archive/`) |
| History: the old polish audit, the plan as it grew, the owner's instructions word for word | `docs/archive/` |

## Starting a task

1. Take the main lane's next entry, as "State" in `docs/PROGRESS.md` names it. Its entry there, the section of
   `docs/handoff/queue-specs.md` it names where it names one, and the design sections it names are the spec.
2. Read only those sections: `grep -rn "## Section" docs/design` finds a section that code or the queue names.
3. What is read again before the PR (`core/modules/work-flow.md`, point 1): the task's entry in `docs/PROGRESS.md`; a
   large change goes in as its own entry right after the task.

## How to work, here

- **A design call** goes into its topic file in `docs/design/`; a new topic gets its own file and a line in `DESIGN.md`.
- **Every file is also a script tag and an `sw.js` entry,** one more cost of a file.
- **The smallest setup** here is a scripted board with only the snakes and food it needs, for a few ticks. Full rounds
  only in the simulation's fingerprint and `--check` and the online round trip; long measurements
  (`tools/abtest.js`; censuses through `scripts/sim.sh`) only by hand.
- **An AI entry waits for the last AI change to merge,** so each head-to-head compares against a settled AI.
- **The news line:** a PR that makes a change a player would notice puts its line of what is new at the top of
  `version.js`'s news, since every merge goes live.

## Rules that stand

This game's own, beside the core's (`core/modules/game-design.md`, whose sections the quoted names are). The owner's words behind them are in
`docs/archive/instructions.md`.

- **A person's input before it lands** is never in `aiView()`.
- **No ability only people use,** here: the rivals see each move used against them, and rules tests prove both through
  the same engine calls. **No refuges:** a move must take timing and skill and never make anyone safe; measure whether
  its users outlive everyone, and tighten or drop it.
- **Human reactions:** the limit the rivals play within ("Strong computer players") is human reaction speed; they get
  better by planning ahead (archive, 11 and 14 October 2026).
- **Every new move, measured** ("Using a feature must pay"): a move too rare to move whole rounds is judged per use,
  each use forked and played on with and without it; and a move is measured against rivals who play its counter (a
  dodge is worth only what the threat it dodges is worth).
- **Each rival's style** ("Strong computer players") is its trademark, checked by `--signatures` (`TRADEMARKS` in
  `tools/sim/03-report.js`).
- **Optimizations may change decisions only if nothing noticeable is lost,** all within noise: skill (per-persona win
  rates, and old against new AI coming out even), character (every trademark) or feel (round length, deaths by cause,
  starving and crashes survived). Visuals too: a look-alike is fine if nobody would see a difference. Measure skill,
  character and feel with `tools/abtest.js` on fresh seeds (`--metrics … trademarks`).
- **Conditional goods** ("No solutions, only trade-offs"): checked by simulation; the mushrooms are the example
  (archive, 31 October 2026).
- **Never create a repository named `snake-game`:** old links redirect from it.

## Commands

```bash
scripts/cloud-setup.sh                 # cloud machines: CI's Node, the tools' packages and Chromium, if missing (it runs by itself when a cloud session starts)
scripts/test.sh                        # the types (tsc) and every suite, quiet; or name some: scripts/test.sh rules render
                                       # (exits 1 if any fails; piped, as in `| tail`, the pipe's code is tail's: use set -o pipefail)
scripts/sim.sh 200 --seed 3 --census   # tools/simulate.js, quiet: fingerprint, check and tables (also seed 11)
scripts/codemap.sh engine/step.js       # the functions of a game file, with line numbers (ai/*.js, render/*.js, game/*.js too)
```

The simulation always prints its fingerprint; `--check` also fails the run if a round stalls or a rival never wins. The
fingerprints are this game's proof under "Same seed, same game" (`core/modules/game-design.md`).

## Review guidelines

Every reviewer, Codex's code review included, reads `core/modules/review-guidelines.md` and this game's
`docs/review-guidelines.md` whole and judges the change by them, with `SECURITY.md` and the floor.
