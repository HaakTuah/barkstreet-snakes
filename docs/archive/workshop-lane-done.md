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
