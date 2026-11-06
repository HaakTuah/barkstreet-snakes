#!/usr/bin/env bash
# Run the game's suites one at a time, printing one line per suite and, for a failing one, the end of
# its output. Full logs go to $TMPDIR (or /tmp). With no arguments, every suite and the online messages'
# types (tsc, as CI runs it); or name some:
#   scripts/test.sh rules render
cd "$(dirname "$0")/.." || exit 2
[ "$(id -u)" = 0 ] && export CI="${CI:-1}"   # Chrome refuses to run as root with its sandbox
suites=("$@"); [ ${#suites[@]} -eq 0 ] && suites=(types rules online chatter records sw licences versions scope copies render input layout ui)
dir="${TMPDIR:-/tmp}/barkbite-tests"; mkdir -p "$dir"; fail=0
for s in "${suites[@]}"; do
  log="$dir/$s.log"; start=$(date +%s)
  if [ "$s" = types ]; then # (TypeScript, a check only, at tools/package.json's version: installed there first if it isn't yet)
    { cmp -s tools/package-lock.json tools/node_modules/.installed-lock || { npm ci --prefix tools --ignore-scripts --no-audit --no-fund \
      && cp tools/package-lock.json tools/node_modules/.installed-lock; }; } >"$log" 2>&1 && tools/node_modules/.bin/tsc --noEmit -p jsconfig.json >>"$log" 2>&1; rc=$?
  elif [ "$s" = layout ]; then # (its five CI jobs side by side, as CI runs them: one after another it takes about 30 minutes
    # on a cloud machine, and prints nothing but each part's end until then; JOBS in tools/layout-test.js)
    pids=(); for j in 1 2 3 4 5; do LAYOUT_JOB=$j node tools/layout-test.js >"$dir/layout-$j.log" 2>&1 & pids+=($!); done
    rc=0; for p in "${pids[@]}"; do wait "$p" || rc=1; done
    for j in 1 2 3 4 5; do echo "== job $j"; cat "$dir/layout-$j.log"; done >"$log"
  else node "tools/$s-test.js" >"$log" 2>&1; rc=$?; fi
  t=$(( $(date +%s) - start ))
  if [ $rc -eq 0 ]; then echo "PASS $s (${t}s)"; else
    fail=1; echo "FAIL $s (exit $rc, ${t}s; log: $log)"; grep -i -E "fail|error|✗|not ok" "$log" | head -15; tail -n 5 "$log"
  fi
done
exit $fail
