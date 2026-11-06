# The workshop lane, done

The done lines of `docs/PROGRESS.md`'s workshop lane, moved word for word on 3 November 2026 to keep that file under
the workshop check's 20 KB. New ones are added here.

- *Done:* `coughs` removed from `ai/` (nobody coughs: `ai/evaluate.js`, `ai/room.js`, `ai/buffers.js`, `ai/food.js`),
  fingerprint-identical (the workshop/remove-coughs PR).
- *Done:* the woodpecker's two unplayed cues removed (`audio/cues.js`, `audio/sound.js`; PR #434).
- *Done:* the workshop check's point (2): `AGENTS.md` from 21.5 to 20.0 KB, every rule kept; the workshop check's marks
  moved to `docs/orchestrating.md`, the file table's detail to `docs/developing.md` (PR #420).
- *Done:* the render suite's virtual clock starts at a fixed time, so the woodpecker's ring check (and every staged
  check) draws at the same phase on every run, whatever the load (#424, PR #427).
- *Done:* the input suite's "rivals have all thought" check, counted round after round to its 100-tick floor and its
  round started on the virtual clock, so neither a short random round nor load can flip it (#414, PR #415).
- *Done:* the layout suite in cloud sessions (#383): it never hung, it ran about 28 minutes in one process, silent
  until its end; `scripts/test.sh` now runs its five CI jobs side by side, each part's end is printed, and the banner
  probe no longer misreads a banner on its way out (PR #396).
- *Done:* the workflows' actions, `actions/checkout` and `actions/setup-node` 4 to 7 (Dependabot, PR #361).
- *Done:* TypeScript 6.0.2 to 7.0.2, the native compiler, its 20 platform packages audited (Dependabot, PR #390).
- *Done:* CI and the cloud setup on Node 26 (from 22; suites green, fingerprints unchanged; PR #369).
- *Done:* licences audited (`tools/licences.json`), gated on every PR (`.github/workflows/licences.yml`) and their notices
  shipped (`THIRD-PARTY-NOTICES.txt`); two lists, what ships and tools that only run (PR #377).
- *Done:* every version where Dependabot sees it: the tools' packages in `tools/package.json` (Playwright 1.49.1 to
  1.64.1), Dependabot's npm updates, and a monthly check of the rest, PeerJS and Node (`tools/versions.json`; PR #385).
- **The file-by-file review's moves:** done, a folder a PR (#341, #342, #343, #344, #345):
  `docs/archive/progress-done/split-lane.md`, "The split lane, done". Left: `render/world.js`'s part, which waits with it below.
  `render/food.js` split by meaning: its burrows and the beetle's bore to `render/burrows.js` (66 to 43.5 and 22.6 KB;
  PR #421).
- **The design by topic, not by round** (#336): *Done:* the round files are pointers and records; topics made or widened:
  `02`–`05`, `09`, `12` (the round's arc), `13`, `21`, `22`, `30`, `31`, `33` and `38`–`45`, their history in
  `docs/archive/design-*.md` (PR #425 to PR #451).
- *Done:* `docs/archive/progress-done.md` (99 KB) split by section into `docs/archive/progress-done/`, with an index,
  word for word, every pointer to it updated (the workshop/progress-done-split PR).
- *Done:* a pointer check and a reading-size check on every PR (`tools/pointers-test.js`, `tools/sizes-test.js` and
  `tools/sizes.json`, run by `tools/copies-test.js` in the copies check's CI step; PR #525).
- *Done:* a content security policy for the page (the meta in `index.html`, pinned by `tools/csp-test.js`; the
  lettering served with the game; PR #526; its CI step, PR #527, waits for the owner's yes).
- *Done:* `style/screens.css` (52 KB) split by meaning into `style/small-boards.css`, `phones.css`, `beside.css`,
  `header.css` and `access.css`, linked in the same order (the workshop/split-screens PR).
