#!/bin/bash
# ahead.sh name...: simulate.js 60 --seed 3 with and without --ahead on each variant
S=$(cd "$(dirname "$0")" && pwd); SIM="$S/../../simulate.js"
for v in "$@"; do
  root=$S/variants/$v; [ "$v" = flex ] && root=$S/flex4-r6
  a=$(node $SIM 60 --seed 3 --check --root $root | grep -E "fingerprint|check")
  b=$(node $SIM 60 --seed 3 --check --ahead --root $root | grep -E "fingerprint|check")
  echo "$v | plain: $(echo $a) | ahead: $(echo $b)"
done
