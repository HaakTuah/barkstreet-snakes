# Progress: done

## Fix, done (moved 31 October 2026)

### Fix. Done: the layout suite's screen-awake checks no longer hang on the machine's speed (PR #161): the section holds the round's loop still, so your snake can't crash on its own between steps on a slow machine. (`scripts/test.sh` exits 1 on a failure; piped through `tail`, use `set -o pipefail`.)


