# Barkstreet Snakes

A snake game on a mossy log: you against three AI rivals drawn from a cast of eighteen, in the browser on desktop and
phone, with online play through PeerJS. Plain HTML, CSS and JavaScript: no build step and no dependencies, which is one
of its features. Haakon (the owner) plays it, gives feedback and decides; builders like you build it. Live at
https://haaktuah.github.io/barkstreet-snakes/.

## Where things are

| What | Where |
| --- | --- |
| What is done and the queue, in order | `docs/PROGRESS.md` |
| The design, one file per topic | `docs/design/` (index: `DESIGN.md`) |
| Materials the queue points to (saved tasks word for word, prototypes, repros) | `docs/handoff/` |
| The game | `index.html`, `style.css`, `engine.js`, `ai.js`, `render.js`, `snake.js`, `chatter.js`, `audio.js`, `net.js`, `online.js`, `records.js`, `tuning.js`, `sw.js` |
| Tests, simulation, browser tooling | `tools/` (the suites `*-test.js`, `simulate.js`, `abtest.js`, `bench-ai.js`, `browser.js`) |
| Study and measuring tools from earlier rounds | `tools/dev/` (teaching audits, burrow spacing, board sizes, the woodpecker and food study, PR pictures) |
| History: the old polish audit, the plan as it grew, Haakon's instructions word for word | `AUDIT.md`, `docs/archive/` |

## Starting a task

1. Take the first open item in `docs/PROGRESS.md`. Its words, and the design sections it names, are the spec.
2. Read only those sections: `grep -rn "## Section" docs/design` finds a section that code or the queue names.
3. Check weekly usage (`scripts/usage.sh`), and again after every commit (see "Usage" below).

## How to work

Haakon's rules, word for word (21 October 2026):

- A question is a question. Answer it; don't act on it unless I say so.
- Match effort to the task. Docs, READMEs, small fixes and config: one pass, no subagents.
- Don't use more than 2 agents unless I ask for it. Never stop to ask about this:
  pick the cheaper way, and say in the PR what you chose.
- Usage is limited. Prefer the cheapest approach that does the job well.
- Read only the parts of large files the task needs (search, then read sections).
- Long simulations: run them in the background and wait for the completion notice.
  Don't poll, and don't keep agents alive just to wait for a run.
- At each milestone, open a PR I can play, say in it what to try, and carry on with
  the next item without waiting for me to review or merge.

How to keep to them:

- **Read little.** The game files are large (`render.js` alone is over 500 KB): never read one whole. Find what you
  need with `scripts/codemap.sh <file>` (its functions with line numbers; pipe it through grep) or grep, then read that line range. Don't
  re-read what you just edited.
- **Print little.** Run the suites with `scripts/test.sh` and simulations with `scripts/sim.sh`: both print a summary
  and the failures and keep the full log in a file. Never paste a full log into the conversation.
- **Helpers.** One agent does the task. A subagent only to search widely (pass `model: "haiku"`; ask for file:line and
  conclusions), to run a long suite or simulation (`model: "haiku"`; summary and failures only), or as the one reviewer
  at the end (the main model; give it the diff and the task's words). Project threads ignore `.claude/agents/`, so pass
  the model in the call. No workflows and no ultracode unless Haakon asks. Never message an agent a workflow started:
  stop the workflow and relaunch from what is committed.
- **Effort.** Medium by default; high for the AI's planning, the engine's rules and online sync. Never max.
- **Edit in place,** and **don't loop:** if the same approach fails twice, stop, write down what you tried, and change
  course or mark the item blocked in `docs/PROGRESS.md` and go on to the next.
- **One fact, one place.** Link instead of copying. A design call goes into its topic file in `docs/design/`.
- **Haakon's words are kept.** Quote a new instruction word for word in the PR, and add standing ones, dated, to
  `docs/archive/instructions.md`.
- **One item per session.** When an item is merged, the next one starts in a fresh session.

## Rules that stand

- **The rivals never treat a person differently.** No `isPlayer`, or anything like it, in AI logic or in what the AI is
  shown (`aiView()` only); rivals judge the player by behaviour, like any snake. The UI may single the player out.
- **No ability only people use.** Every move or rule a person can use, the rivals use too, when it pays and in their
  own style, and they see it used against them; rules tests prove both, through the same engine calls. If the rivals
  can't learn a move well, the move doesn't go in. **No refuges:** a move must take timing and skill and never make
  anyone safe; measure how often it is used, fails, and whether its users outlive everyone, and tighten or drop it.
- **Every new rule needs a visible cue and a lesson** (a one-time lesson and a Field guide row). Haakon called this
  "very important".
- **Every rival keeps its trademark,** measured before and after a change: Mason's straight runs, Ouroboros's coiling,
  Creeper's tail-riding, Ghost's distance, Gobbler's food share, Vulture's beads, Sovereign's time home, Mute's boxing,
  Joker's lures, Desperado's skims, Star's flash rate.
- **Optimizations may change decisions only if nothing noticeable is lost** in skill (a head-to-head on paired seats
  comes out even), character (every trademark within noise) or feel (round length, deaths by cause, starving and
  crashes survived within noise). Fingerprint-identical changes are the fast lane; the rest go through `tools/abtest.js`.
- **Online stays in step:** everything new works in online play, with a protocol bump when messages change.
- **Never rename** the storage keys (`snake-*`, `barkbite-muted`, `barkbite-music`) or `net.js`'s PREFIX `'barkbite-'`:
  that would wipe players' records or split online play. Never create a repository named `snake-game`: old links
  redirect from it.

## Usage

Work continuously, task after task, and check weekly usage after every commit (Haakon, 26 October 2026). From about
90% of the weekly limit, start nothing new: finish the task at hand only if it is small and nearly done; otherwise bring
it to a clean commit, open a draft PR saying how to test it and what is left, note where you stopped in
`docs/PROGRESS.md`, and stop. The rest of the week is Haakon's. Two building sessions share the limit: this game's and
Amarna Letters'.

## Git and GitHub

- `main` is Haakon's and is what the live site plays: never push to it, never force-push. Work on a branch from
  `develop`, one per task, with a PR into `develop`; merge it into `develop` yourself when the suites pass and one
  reviewer has found nothing blocking. At each milestone make sure a PR from `develop` to `main` carries the new work,
  saying what to try; Haakon merges it. Before pushing to a branch whose PR you opened earlier, check whether that PR
  was merged; if it was, start a new branch and PR. Don't stack PRs on each other's branches.
- In cloud sessions GitHub's GraphQL API is blocked, so `gh pr create` and `gh pr view` fail. Use the REST API:
  `gh api repos/HaakTuah/barkstreet-snakes/pulls -f title=... -f head=... -f base=develop -f body=...`, and
  `gh api -X PUT repos/HaakTuah/barkstreet-snakes/pulls/<n>/merge -f merge_method=merge`.
- PR pictures go on the orphan branch `pr-media`, never merged: add files with `git hash-object -w`, `git mktree` and
  `git commit-tree`, push the commit to `refs/heads/pr-media`, and link them by commit SHA
  (`https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/<sha>/<name>`), never by a branch that may be deleted.
  `tools/dev/crop.js` and `tools/dev/montage.js` make them.

## Commands

```bash
scripts/cloud-setup.sh                 # cloud machines: Chromium for the browser suites, if missing
scripts/test.sh                        # all eight suites, quiet; or name some: scripts/test.sh rules render
scripts/sim.sh 200 --seed 3 --census   # tools/simulate.js, quiet (also seed 11); --check prints the fingerprint
scripts/codemap.sh render.js           # the functions of a game file, with line numbers
scripts/usage.sh                       # weekly usage, if this session can read it
```

The browser suites (render, input, layout, ui) drive a headless Chrome through `tools/browser.js`: it looks in the usual
places, or set `CHROME=/path/to/chrome`; `CI=1` runs it without its sandbox, which is needed as root (`scripts/test.sh`
sets it). Optional: `SIM_WORKERS` sets the simulation's cores, `BARKBITE_PRIORITY=normal` for timing runs,
`ONLINE_SEEN=1` makes online-test print what it saw. A change that should keep behaviour must keep the simulation's
fingerprints; `--root DIR` runs another copy of the game files. To play it: `.claude/launch.json` serves the folder on
port 5173.
