#!/bin/sh
# The "after" play runs (the worktree), one browser at a time.
cd "$(dirname "$0")"
mkdir -p out
for cfg in "390x844@3t p390" "360x640@3t p360" "1920x945@1 d1920"; do
  set -- $cfg
  node play.js ../wt after-$2 $1 --rounds 3 --seed 11 --cap 175 > out/after-$2.log 2>&1
done
echo done > out/after-DONE
