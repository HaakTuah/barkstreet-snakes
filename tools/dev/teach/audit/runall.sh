#!/bin/sh
# All the play runs, one browser at a time.
cd "$(dirname "$0")"
mkdir -p out
for cfg in "390x844@3t p390" "360x640@3t p360" "1920x945@1 d1920"; do
  set -- $cfg
  for br in main p2; do
    node play.js wt-$br $br-$2 $1 --rounds 3 --seed 11 --cap 175 > out/$br-$2.log 2>&1
  done
done
echo done > out/ALLDONE
