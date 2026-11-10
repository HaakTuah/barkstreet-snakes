# PR pictures

How a PR's pictures are pushed (a protected file: it runs with credentials, `SECURITY.md`, rule 3).

On the orphan branch `pr-media`, never merged, named by PR number (`pr41-*.jpg`): start from `git ls-tree
origin/pr-media`, add each file with `git hash-object -w`, build the new tree with `git mktree`, commit it with
`git commit-tree <tree> -p origin/pr-media`, and push that commit to `refs/heads/pr-media` (never force). Link pictures
by commit SHA (`https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/<sha>/<name>`), never by a branch that may
be deleted. `tools/dev/crop.js` and `tools/dev/montage.js` make them.
