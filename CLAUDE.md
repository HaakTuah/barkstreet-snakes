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
| Materials the queue points to: the owner's saved tasks word for word, the teaching prototypes and judges, the woodpecker acts draft, the bridge-glitch repro, the unverified jumps start, the Sniper screenshot | `docs/handoff/` |
| The game | `index.html`, `style.css`, `engine.js`, `ai.js`, `render/` (seventeen files, listed in `render/core.js`), `snake.js`, `chatter.js`, `audio.js`, `net.js`, `online.js`, `records.js`, `tuning.js`, `sw.js` |
| Tests, simulation, browser tooling | `tools/` (the suites `*-test.js`, `simulate.js`, `abtest.js`, `bench-ai.js`, `browser.js`) |
| Study and measuring tools from earlier rounds | `tools/dev/` (teaching audits, burrow spacing, board sizes, the woodpecker and food study, PR pictures) |
| History: the old polish audit, the plan as it grew, Haakon's instructions word for word | `AUDIT.md`, `docs/archive/` |

## Starting a task

1. Work from `develop`: if you are on `main`, check out `develop` first (this file and `docs/` live there until Haakon
   next merges `develop` into `main`).
2. Take the first open item in `docs/PROGRESS.md`. Its words, and the design sections it names, are the spec.
3. Read only those sections: `grep -rn "## Section" docs/design` finds a section that code or the queue names.
4. Check weekly usage with `scripts/usage.sh`, and again after every commit (see "Usage"). If it says "unknown", this
   session cannot see usage: say so in the first line of each PR you open, and carry on; Haakon then watches usage
   himself and pauses the work at about 90%.
5. Read "Standing instructions" at the end of this file.

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

- **Read little.** The game files are large (`snake.js` alone is about 200 KB): never read one whole. Find what you
  need with `scripts/codemap.sh <file>` (its functions with line numbers; pipe it through grep) or grep, then read that
  line range. Don't re-read what you just edited.
- **Print little.** Run the suites with `scripts/test.sh` and simulations with `scripts/sim.sh`: both print a summary
  and the failures and keep the full log in a file. Run long ones in the background (the Bash tool's background mode)
  and wait for the completion notice. Never paste a full log into the conversation.
- **Helpers, effort and escalation:** see "Models, effort and helpers" below.
- **Edit in place,** and **don't loop:** if the same approach fails twice, stop, write down what you tried, and change
  course, hand it to the escalation helper, or mark the item blocked in `docs/PROGRESS.md` and go on to the next.
- **One fact, one place.** Link instead of copying. A design call goes into its topic file in `docs/design/`.
- **Haakon's words are kept.** Quote a new instruction word for word in the PR. If it is a standing one, also add it,
  dated, to "Standing instructions" below, with the quote in `docs/archive/instructions.md`.
- **Each game's files stay in its own repository.** Never write this project's notes, logs or files into another
  project's repository or folders, such as Amarna Letters'.
- **Sessions.** When sessions are started for you task by task (a Claude Code Project does this), stop when your task
  is merged and say what is next; otherwise carry on with the next task in the same session.

## Models, effort and helpers

The same in both of Haakon's games; only the list of hard work differs.

| Who | Model | Effort | For |
| --- | --- | --- | --- |
| You, the builder | Opus | medium; high for the AI's planning, the engine's rules and online sync (a big-file split is checked by its fingerprints and suites, so medium is enough) | the task itself |
| Search helper | Haiku (`model: "haiku"`) | as it comes | finding where things are across many files; it returns file:line and one-line conclusions |
| Reviewer | Opus (`model: "opus"`, `effort: "high"`) | high | every task that changes the game, once, before it is merged; docs, READMEs, small fixes and config get none: give it the diff and the task's text, nothing else |
| Escalation | Opus (`model: "opus"`, `effort: "high"`, or `"xhigh"` if you already run at high) | high or extra high | one problem that has defeated you twice: give it a self-contained brief (the problem, what you tried, the files and lines), then apply and check its answer yourself |

- **Never more than two helpers at a time,** and only these four uses. No workflows and no ultracode. No agent kept
  alive to wait for a run: long runs go in the background (the Bash tool's background mode).
- **Effort is set when the session starts** and you can't raise your own. If the escalation helper fails too, write the
  problem up in the PR and `docs/PROGRESS.md` as blocked, go on with the next task, and say in your update that it needs a
  session at higher effort.
- Sessions started from a Claude Code Project don't load `.claude/agents/`, so always pass `model` (and `effort`) in
  the call. Never max effort: it costs the most and tends to overthink.
- **Keep files small and organised:** split code where it naturally belongs, by responsibility, and keep each file under
  about 50 KB. Split a file that grows past that in its own PR, with behaviour proven unchanged.

## Rules that stand

- **The rivals never treat a person differently.** No `isPlayer`, or anything like it, in AI logic or in what the AI is
  shown (`aiView()` only); rivals judge the player by behaviour, like any snake. The UI may single the player out.
- **No ability only people use.** Every move or rule a person can use, the rivals use too, when it pays and in their
  own style, and they see it used against them; rules tests prove both, through the same engine calls. If the rivals
  can't learn a move well, the move doesn't go in. **No refuges:** a move must take timing and skill and never make
  anyone safe; measure how often it is used, fails, and whether its users outlive everyone, and tighten or drop it.
- **Clever rivals, human reactions.** Haakon: "They shouldn't have super human reaction speed, but they should be very
  clever" (11 October). They get better through planning ahead, "not by increasing reaction time, or making them all
  samey in strategy, nor decreasing performance below good gameplay levels" (14 October).
- **Every new rule needs a visible cue and a lesson** (a one-time lesson and a Field guide row). Haakon called this
  "very important".
- **Every rival keeps its trademark,** measured before and after a change: Mason's straight runs, Ouroboros's coiling,
  Creeper's tail-riding, Ghost's distance, Gobbler's food share, Vulture's beads, Sovereign's time home, Mute's boxing,
  Joker's lures, Desperado's skims, Star's flash rate.
- **Optimizations may change decisions only if nothing noticeable is lost:** in skill (per-persona win rates within
  noise, and old against new AI coming out even), character (every trademark within noise) or feel (round length,
  deaths by cause, starving and crashes survived within noise). The same holds for visuals: a look-alike is fine if
  nobody would see a difference. Fingerprint-identical changes are the fast lane; the rest go through
  `tools/abtest.js` on fresh seeds.
- **Everything new belongs.** Haakon: "Very important everything feels balanced, cohesive, purposeful and like it
  belongs!" (13 October).
- **Online stays in step:** everything new works in online play, with a protocol bump when messages change.
- **Never rename** the storage keys (`snake-*`, `barkbite-muted`, `barkbite-music`) or `net.js`'s PREFIX `'barkbite-'`:
  that would wipe players' records or split online play. Never create a repository named `snake-game`: old links
  redirect from it.

## Usage

Haakon (26 October 2026): "I want these 2 continually working until they reach about 90% usage, at that point I don't
want them taking on any bigger task, as I want the bulk of that remaining usage for myself." So work continuously,
task after task, and check weekly usage after every commit. From about 90% of the weekly limit, take on no bigger
task: finish the one at hand if it is nearly done, or bring it to a clean commit and open a draft PR saying how to test
it and what is left; then only small things (a fix, a doc), and note where you stopped in `docs/PROGRESS.md`. Two
building sessions share the limit: this game's and Amarna Letters'.

## Git and GitHub

`main` is Haakon's and is what the live site plays: never push to it, never force-push. Work on a branch from `develop`,
one per task, with a PR into `develop`; merge it yourself when the suites pass (and, for a task that changes the game,
one reviewer has found nothing blocking). At each milestone make sure a PR from `develop` to `main` carries the new
work, saying what to try; Haakon merges it. Before pushing to a branch whose PR you opened earlier, check whether that
PR was merged; if it was, start a new branch and PR. Don't stack PRs on each other's branches.

Cloud sessions can't use GitHub's GraphQL API, so `gh pr create` and `gh pr view` fail. Use the REST API:

```bash
gh api repos/HaakTuah/barkstreet-snakes/pulls -f title=... -f head=<branch> -f base=develop -f body=...  # add -F draft=true for a draft
gh api -X PUT repos/HaakTuah/barkstreet-snakes/pulls/<n>/merge -f merge_method=merge                    # merge into develop
gh api repos/HaakTuah/barkstreet-snakes/pulls/<n> --jq '{state, merged}'                                 # was it merged?
gh api "repos/HaakTuah/barkstreet-snakes/pulls?state=open&base=main&head=HaakTuah:develop" --jq '.[0].number'  # the open milestone PR
```

PR pictures go on the orphan branch `pr-media`, never merged, named by PR number (`pr41-*.jpg`): start from
`git ls-tree origin/pr-media`, add each file with `git hash-object -w`, build the new tree with `git mktree`, commit it
with `git commit-tree <tree> -p origin/pr-media`, and push that commit to `refs/heads/pr-media` (never force). Link
pictures by commit SHA (`https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/<sha>/<name>`), never by a branch
that may be deleted. `tools/dev/crop.js` and `tools/dev/montage.js` make them.

## Commands

```bash
scripts/cloud-setup.sh                 # cloud machines: Chromium for the browser suites, if missing
scripts/test.sh                        # all nine suites, quiet; or name some: scripts/test.sh rules render
scripts/sim.sh 200 --seed 3 --census   # tools/simulate.js, quiet: fingerprint, check and tables (also seed 11)
scripts/codemap.sh snake.js            # the functions of a game file, with line numbers (render/*.js too)
scripts/usage.sh                       # weekly usage, if this session can read it
```

The simulation always prints its fingerprint; `--check` also fails the run if a round stalls or a rival never wins. A
change that should keep behaviour must keep the fingerprints; `--root DIR` runs another copy of the game files. The
browser suites (render, input, layout, ui) drive a headless Chrome through `tools/browser.js`: it looks in the usual
places, or set `CHROME=/path/to/chrome`; `CI=1` runs it without its sandbox, which is needed as root (`scripts/test.sh`
sets it). Optional: `SIM_WORKERS` sets the simulation's cores, `BARKBITE_PRIORITY=normal` for timing runs,
`ONLINE_SEEN=1` makes online-test print what it saw. To play it locally, `.claude/launch.json` serves the folder on
port 5173.

## Standing instructions

Haakon's standing instructions given since this file was last revised, dated, newest last. (None yet.)
