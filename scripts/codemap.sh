#!/usr/bin/env bash
# List the functions and section comments of the given files with their line numbers, so a session can
# read just the range it needs instead of a whole file:  scripts/codemap.sh render.js [ai.js ...]
cd "$(dirname "$0")/.." || exit 2
[ $# -eq 0 ] && set -- engine.js ai.js render.js snake.js chatter.js online.js
for f in "$@"; do
  echo "== $f ($(wc -l <"$f") lines)"
  grep -n -E '^\s{0,2}(async\s+)?function\s+[A-Za-z_$]|^\s{0,2}(const|let|var)\s+[A-Za-z_$][A-Za-z0-9_$]*\s*=\s*(async\s*)?(function|\([^)]*\)\s*=>|[A-Za-z_$]+\s*=>)|^\s{0,2}class\s|^\s{0,2}// (=|-){3,}|^\s{0,2}// [A-Z][A-Za-z ,&-]{3,40}$' "$f" \
    | sed -E 's/\s+/ /g; s/\{ ?$//' | cut -c1-110
done
