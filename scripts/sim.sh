#!/usr/bin/env bash
# Run tools/simulate.js quietly: the full output goes to a log; shown are its fingerprint and check lines and
# its last lines (the tables). Arguments go to simulate.js, for example: scripts/sim.sh 200 --seed 3 --census
cd "$(dirname "$0")/.." || exit 2
log="${TMPDIR:-/tmp}/barkbite-sim-$(date +%Y%m%d-%H%M%S).log"
node tools/simulate.js "$@" >"$log" 2>&1; rc=$?
grep -E "^(fingerprint|check)" "$log"
tail -n "${SIM_TAIL:-30}" "$log"
echo "exit $rc; full log: $log"
exit $rc
