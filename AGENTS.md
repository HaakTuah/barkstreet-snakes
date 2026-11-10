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
`core/modules/game-design.md`. Safety rules of this game's own, which "Principles over rules" (`core/modules/how-to-work.md`) never reaches: the
storage keys (`SECURITY.md`, rule 7).

## Where things are

| What | Where |
| --- | --- |
| What is done and the queue, in order | `docs/PROGRESS.md` |
| Security: what this game adds to the floor; who might attack it | `SECURITY.md`, `docs/threat-model.md` |
| What goes to Claude and what to Codex, once Codex builds | `docs/claude-and-codex.md` |
| Running and checking it: every tool, PR pictures, its updates; each file and where each folder lists its parts ("How it's put together") | `docs/developing.md` |
| The design, one file per topic | `docs/design/` (index: `DESIGN.md` at the root) |
| Materials the queue points to, with the specs word for word of the entries that name one (`queue-specs.md`) | `docs/handoff/` |
| Study and measuring tools from earlier rounds (censuses, audits, PR pictures) | `tools/dev/` (done ones: `docs/archive/`) |
| History: the old polish audit, the plan as it grew, the owner's instructions word for word | `docs/archive/` |

## Starting a task

1. Take the main lane's next entry, as "State" in `docs/PROGRESS.md` names it. Its entry there, the section of
   `docs/handoff/queue-specs.md` it names where it names one, and the design sections it names are the spec.
2. Read only those sections: `grep -rn "## Section" docs/design` finds a section that code or the queue names.
3. What is read again before the PR (`core/modules/work-flow.md`, point 1): the task's entry in `docs/PROGRESS.md` and
   its `question` issues; a large change goes in as its own entry right after the task.

## How to work, here

- **A design call** goes into its topic file in `docs/design/`.
- **Every file is also a script tag and an `sw.js` entry,** so smaller is not better.
- **The smallest setup** here is a scripted board with only the snakes and food it needs, for a few ticks. Full rounds
  only in the simulation's fingerprint and `--check` and the online round trip; long measurements (`tools/abtest.js`,
  censuses) in `scripts/sim.sh`.
- **An AI entry waits for the last AI change to merge,** so each head-to-head compares against a settled AI.
- **The news line:** a PR that makes a change a player would notice puts its line of what is new at the top of
  `version.js`'s news, since every merge goes live.

## Rules that stand

This game's own, beside the core's (`core/modules/game-design.md`). The owner's words behind them are in
`docs/archive/instructions.md`.

- **The rivals never treat a person differently:** nothing in `aiView()` lets them, such as a person's input before it
  lands. The UI may single the player out.
- **No ability only people use:** the rivals use each move in their own style, and they see it used against them;
  rules tests prove both, through the same engine calls. If the rivals can't learn a move well, the move doesn't go in.
  **No refuges:** a move must take timing and skill and never make anyone safe; measure how often it is used, fails,
  and whether its users outlive everyone, and tighten or drop it.
- **Clever rivals, human reactions.** No superhuman reaction speed: they get better through planning ahead, never
  through faster reactions (archive, 11 and 14 October 2026).
- **Every new move is tested both ways,** and the PR gives its verdict at every merge: a move that doesn't matter is a
  design finding for the owner. The PR's table shows how often each rival used the move and how often it worked. A
  move too rare to move whole rounds is judged per use, each use forked and played on with and without it; and a move
  is measured against rivals who play its counter (a dodge is worth only what the threat it dodges is worth).
- **Every rival keeps its trademark,** as `--signatures` measures it (`TRADEMARKS` in `tools/sim/03-report.js`).
- **Optimizations may change decisions only if nothing noticeable is lost,** all within noise: skill (per-persona win
  rates, and old against new AI coming out even), character (every trademark) or feel (round length, deaths by cause,
  starving and crashes survived). Visuals too: a look-alike is fine if nobody would see a difference. The rest go
  through `tools/abtest.js` on fresh seeds.
- **Conditional goods:** the mushrooms are the example (archive, 31 October 2026).
- **Never rename** the storage keys or `net.js`'s PREFIX (`SECURITY.md`, rule 7), and never create a repository named
  `snake-game`: old links redirect from it.

## Commands

```bash
scripts/cloud-setup.sh                 # cloud machines: Node 26, the tools' packages and Chromium, if missing (it runs by itself when a cloud session starts)
scripts/test.sh                        # the types (tsc) and every suite, quiet; or name some: scripts/test.sh rules render
                                       # (exits 1 if any fails; piped, as in `| tail`, the pipe's code is tail's: use set -o pipefail)
scripts/sim.sh 200 --seed 3 --census   # tools/simulate.js, quiet: fingerprint, check and tables (also seed 11)
scripts/codemap.sh engine/step.js       # the functions of a game file, with line numbers (ai/*.js, render/*.js, game/*.js too)
```

The simulation always prints its fingerprint; `--check` also fails the run if a round stalls or a rival never wins. A
change that should keep behaviour must keep the fingerprints.

## Review guidelines

Every reviewer, Codex's code review included, reads `core/modules/review-guidelines.md` and this game's
`docs/review-guidelines.md` whole and judges the change by them, with `SECURITY.md` and the floor.
