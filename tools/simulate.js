#!/usr/bin/env node
// Headless balance check. Plays AI-only rounds with the game's own rules and
// AI (tuning.js, ai.js and engine.js, loaded unchanged) and prints how each
// personality did. Needs only Node. It's gentle on the machine by default:
// half the cores, at below-normal priority (whoever's using the computer
// comes first), one run at a time across the machine (a second run waits
// its turn), and a seeded round already played with the same files and
// options is read back from a cache instead of played again (round by
// round: 600 rounds after 200 plays only the 400 new ones). The files are
// read once its turn has come, and the cores play those very texts, so what
// a round is stored under is always what played it, even if a file is edited
// while the run waits or plays.
//
//   node tools/simulate.js [rounds] [--seed N] [--ahead] [--check] [--json] [--census] [--signatures] [--root DIR]
//                          [--save-at MS [--save FILE]] [--from FILE] [--per-round] [--workers N] [--fresh] [--no-wait]
//
//   rounds    how many rounds (default 200)
//   --seed N  a fixed random seed, so a run can be repeated exactly (each round
//             has its own seed, so it doesn't matter how many cores you have)
//   --ahead   let every AI decide during the frames before its tick, the way
//             the browser does; with the same seed the rounds must come out
//             identical to a run without it
//   --check   fail (exit 1) if a round stalls, or a personality never wins
//   --json    print the raw totals instead of the table
//   --census  also print what a round holds: golden things, weather and
//             lightning, the woodpecker (and any aim it had to make near a
//             head), the powers used, how sudden death goes, and how hungry
//             snakes are before the woodpecker comes and after (and how
//             often a snake eats mid-round, from HUNGER_MID_FROM_MS to the
//             woodpecker: meals a snake-minute), and the
//             beads: how many were eaten (and how many by the snake they
//             broke off), how often a snake choked on its own, and what it
//             nudged aside coughing; the beetles: how each time one is above
//             ground ends (caught, down a burrow, dug in, flown, eaten by the
//             woodpecker), the same for those chased and how long a catch
//             took, digs (and those caught digging), dives into a burrow a dig left, burrows open and
//             cells free for an apple; the woodpecker's fairness: food it
//             knocked aside (and how much of it a snake ate where it landed,
//             within 6 s, and how soon), marks that shut a snake in and the deaths they
//             made (out within 3 s of the strike, of sudden death's), islands
//             of one or two cells it cut off, and how often the snake on the
//             biggest island won once the last ones were each on their own;
//             and a table of it for each
//             personality: its flashes and jumps a minute, golden power food
//             picked up, golden leaps and dashes used, chokes, crashes
//             survived, time alive, food and kills
//   --signatures  also print each personality's trademark, measured on
//             every snake so each has the field to stand against: Mason's
//             straight runs and its body lying beside itself, Ouroboros's
//             coils, Creeper riding tails, Ghost's distance, Gobbler's share
//             of the food and Vulture's of the beads, Sovereign at home,
//             Mute boxing its target, Joker's lures, Desperado's skims and
//             Star's powers (see SIGNS)
//   --root    play another copy of the game (to compare versions)
//   --versus DIR  head to head: DIR's ai.js steers half the snakes of every
//             round, this copy's (--root's) the other half, under this copy's
//             rules (its tuning.js and engine.js). DIR's AI gets its own
//             personalities' weights, by key. --seats even|odd says which
//             half is DIR's: the snakes with even ids (the default) or odd.
//             Each snake DIR steered has versus: 1 in its numbers (summed:
//             the rounds it played for DIR). tools/abtest.js --head-to-head
//             plays both halves; given this very copy, the rounds come out
//             exactly as without it (the same fingerprint). Not with
//             --save-at or --from
//   --save-at MS  fast-forward: play each round only to game time MS (2:00,
//             when the woodpecker comes, is 120000) and store it as it stands
//             then, the game and where its random numbers had got to (a round
//             over before then is stored whole). Needs --seed. The rounds are
//             kept with the cache (its file is printed; again with the same
//             files only new rounds are played); --save FILE copies them there
//   --from FILE  go on with the rounds stored in FILE (all of them, or the
//             first `rounds`), under this copy's files (--root): with the
//             files that stored them, every round comes out exactly as played
//             straight through; with others, they play the rest of the round
//             their way. The numbers are the whole round's (the part before
//             the save is the same for every copy). A study of the late game
//             (sudden death, say) needn't play the openings again
//   --per-round  with --json, each round's own numbers too (rounds, in order: what tools/abtest.js pairs)
//   --workers N  how many cores to use (default: half of them; or SIM_WORKERS)
//   --fresh   play it even if the cache has it
//   --no-wait don't wait for another run on the machine to finish
//
// The simulation is in tools/sim/, one file per part: 00 setup (the game loaded, the seeded
// randomness), 01 the census and the trademarks' signatures, 02 a round played, 03 the report, 04
// the store of rounds, 05 the run (the cache, the cores) and a core. They are joined in name order
// into one text and run as this file (module.joined), so a core is handed that very text, as the run
// began, and the cache's key is that of the code played. (An error's line is the joined text's.)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = path.join(__dirname, 'sim');
module.joined = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(DIR, f), 'utf8')).join('');
vm.compileFunction(module.joined, ['exports', 'require', 'module', '__filename', '__dirname'], { filename: path.join(DIR, '(the parts joined)') })
  .call(module.exports, module.exports, require, module, __filename, __dirname);
