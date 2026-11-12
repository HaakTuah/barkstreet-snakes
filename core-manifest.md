# Core manifest

Core: HaakTuah/agent-core at d79346a019b52cbfadc305d3898c280331f221be, copied whole under core/ (never edited here).
Paths: in the core's files, one into floor/, modules/, scripts/, setup/, archive/ or reports/ is under core/; any other is ours.
Floor: whole. Modules: all.

## Names
- A task: an entry in the queue.

## Slots
| Slot | Here |
| --- | --- |
| *owner's account* | `HaakTuah` |
| *progress file* | `docs/PROGRESS.md` |
| *report* | the PR's description |
| *settling references* | "Rules that stand" in `AGENTS.md`, or the design section |
| *descriptions* | the topic file in `docs/design/` and, for what a player sees, the README, the lesson, the Field guide row and the hints on screen |
| *copies check* | `core/scripts/copies.mjs` with `tools/copies.json` |
| *size marks* | `tools/sizes.json` |
| *large file* | a large game file (`render/world.js`, about 40 KB): `scripts/codemap.sh <file>` or grep |
| *one at a time* | AI and engine-rules changes, and changes to the online messages |
| *design-checked PRs* | engine-rules and AI entries (new moves and rules, the rivals' play) |
| *review reference* | the design sections the entry names, in `docs/design/` |
| *planning design* | the rivals' planning |
| *hard work* | the AI's planning, the engine's rules and online sync (not a big-file split: its fingerprints and suites check it) |
| *major version checks* | the full suites, and played through for what ships |
| *Codex's checks* | `scripts/test.sh`, and `scripts/sim.sh` with the fingerprint for a change that should keep behaviour |
| *computer players* | the rivals |
| *measured players* | the rivals, each by name |
| *what they are shown* | `aiView()` |
| *use-against-ignore measurement* | `tools/abtest.js` on fresh seeds, rivals that use the move against a copy where only some rivals lose it (the rule itself unchanged), and the conditional-goods simulations, which check that neither always nor never using it wins ("Rules that stand" in `AGENTS.md`) |
| *where the numbers go* | the PR's table |
| *where rules are taught* | a visible cue and a lesson: the one-time lesson and a Field guide row, always both |
