#!/bin/bash
# run.sh <rounds> <seed> name1 name2 ... : runs study.js on each variant in turn
# (base: main at 2d95a2d, unchanged)
S=$(cd "$(dirname "$0")" && pwd)
n=$1; seed=$2; shift 2
for v in "$@"; do
  root=$S/variants/$v; [ "$v" = base ] && root=$S/base-2d95a2d
  node $S/study.js $n --seed $seed --root $root --label $v --out $S/runs/$v-s$seed-$n.json > $S/runs/$v-s$seed-$n.summary.json || echo "FAILED $v"
  echo "done $v s$seed $n $(date +%T)"
done
