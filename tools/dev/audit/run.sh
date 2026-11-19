#!/usr/bin/env bash
# The code audit's measures as one run (issue #764): every number of the report in docs/audits/, written as JSON to the folder given
# (default: audit-<date> under $TMPDIR), so the next audit is a run and a comparison, not a study. Measures and fails nothing.
#   tools/dev/audit/run.sh [folder]          the numbers that need no quiet machine: shape, uses, co-change
#   tools/dev/audit/run.sh [folder] --timed  (the flag may come first or last, the folder is optional)  and, one after another on a machine doing nothing else: start-up (start.js), a frame
#                                            (tools/bench.js), and every suite's time and the parts it loads (suites.js: layout alone takes about 10 minutes
#                                            with its five jobs side by side)
# The functions' lengths, their nesting and branching, the imports and the shared names are the core's own measure, code-shape.mjs:
# core/scripts/code-shape.mjs where this copy of the core has it, else AGENT_CORE=<a clone of HaakTuah/agent-core>/scripts/.
cd "$(dirname "$0")/../../.." || exit 2
timed=; folder=; for a in "$@"; do [ "$a" = --timed ] && timed=1 || folder="$a"; done
out="${folder:-${TMPDIR:-/tmp}/audit-$(date +%F)}"; mkdir -p "$out"
shape=core/scripts/code-shape.mjs; [ -f "$shape" ] || shape="${AGENT_CORE:-}/code-shape.mjs"
game=$(grep -o '<script src="[^"]*"' index.html | sed 's/.*src="//;s/"//' | grep -v '^http')
if [ -f "$shape" ]; then
  # shellcheck disable=SC2086
  node "$shape" $game --repo . --history 3000 --json "$out/shape-game.json" | head -12
  node "$shape" 'tools/*.js' 'tools/rules' 'tools/render' 'tools/input' 'tools/layout' 'tools/ui' 'tools/chatter' --repo . --history 1 --json "$out/shape-tests.json" >/dev/null
else echo "no code-shape.mjs: set AGENT_CORE to the scripts folder of a clone of HaakTuah/agent-core (the next sync of the core brings it)"; fi
node tools/dev/audit/uses.js --json "$out/uses.json"
node tools/dev/audit/cochange.js --json "$out/cochange.json"
if [ -n "$timed" ]; then
  export CI="${CI:-1}" BARKBITE_PRIORITY=normal
  node tools/dev/audit/start.js --runs 5 --json "$out/start.json"
  node tools/bench.js 20 > "$out/frames.txt" 2>&1; head -40 "$out/frames.txt"
  node tools/dev/audit/suites.js --json "$out/suites.json"
fi
echo "numbers in $out"
