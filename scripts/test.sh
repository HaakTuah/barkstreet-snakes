#!/usr/bin/env bash
# Run the game's suites one at a time, printing one line per suite and, for a failing one, the end of
# its output. Full logs go to $TMPDIR (or /tmp). With no arguments, all ten and the online messages'
# types (tsc, as CI runs it); or name some:
#   scripts/test.sh rules render
cd "$(dirname "$0")/.." || exit 2
[ "$(id -u)" = 0 ] && export CI="${CI:-1}"   # Chrome refuses to run as root with its sandbox
suites=("$@"); [ ${#suites[@]} -eq 0 ] && suites=(types rules online chatter records sw scope render input layout ui)
dir="${TMPDIR:-/tmp}/barkbite-tests"; mkdir -p "$dir"; fail=0
for s in "${suites[@]}"; do
  log="$dir/$s.log"; start=$(date +%s)
  if [ "$s" = types ]; then # (TypeScript, a check only: the one installed, or fetched as CI does)
    if command -v tsc >/dev/null; then tsc --noEmit -p jsconfig.json; else npx -y -p typescript@6.0.2 tsc --noEmit -p jsconfig.json; fi >"$log" 2>&1; rc=$?
  else node "tools/$s-test.js" >"$log" 2>&1; rc=$?; fi
  t=$(( $(date +%s) - start ))
  if [ $rc -eq 0 ]; then echo "PASS $s (${t}s)"; else
    fail=1; echo "FAIL $s (exit $rc, ${t}s; log: $log)"; grep -i -E "fail|error|✗|not ok" "$log" | head -15; tail -n 5 "$log"
  fi
done
exit $fail
