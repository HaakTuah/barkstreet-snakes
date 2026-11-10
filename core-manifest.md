# Core manifest

Core: HaakTuah/agent-core at cecbe3b035047f23ae8525b83ed4398dff504f91, copied whole under core/ (never edited here).
Paths: in the core's files, one into floor/, modules/, scripts/, setup/, archive/ or reports/ is under core/; any other is ours.
Floor: whole. Modules: all.

## Names
- A task: an entry in the queue.
- The main lane: the main lane.

## Slots
| Slot | Here |
| --- | --- |
| *progress file* | `docs/PROGRESS.md` |
| *report* | the PR's description |
| *archive citation* | "(archive, D Month YYYY)", from `docs/archive/instructions.md` |
| *settling references* | "Rules that stand" in `AGENTS.md`, or the design section |
| *descriptions* | the topic file in `docs/design/` and, for what a player sees, the README, the lesson, the Field guide row and the hints on screen |
| *copies check* | `core/scripts/copies.mjs` with `tools/copies.json` |
| *large file* | a large game file (`render/world.js`, about 40 KB): `scripts/codemap.sh <file>` or grep |
| *size marks* | `tools/sizes.json`, measured on every PR by `tools/sizes-test.js` |
| *one at a time* | AI and engine-rules changes, and changes to the online messages |
| *design-checked PRs* | engine-rules and AI entries (new moves and rules, the rivals' play) |
| *review reference* | the design sections the entry names, in `docs/design/` |
| *planning design* | the rivals' planning |
| *hard work* | the AI's planning, the engine's rules and online sync (not a big-file split: its fingerprints and suites check it) |
| *measurements* | `tools/abtest.js`, a census, the fingerprints |
| *slop bar* | the slop audit in `docs/PROGRESS.md` (a 10: nothing reads machine-made); finds fixed in the polish lane; the formula test in the chatter suite |
| *major version checks* | the full suites, and played through for what ships |
| *Codex's checks* | `scripts/test.sh`, and `scripts/sim.sh` with the fingerprint for a change that should keep behaviour |
| *Codex environment* | made: a legacy Codex cloud environment, its internet access limited to read-only methods |
| *computer players* | the rivals |
| *measured players* | the rivals, each by name |
| *what they are shown* | `aiView()` |
| *use-against-ignore measurement* | `tools/abtest.js` on fresh seeds, rivals that use the move against a copy where only some rivals lose it (the rule itself unchanged), and the conditional-goods simulations, which check that neither always nor never using it wins ("Rules that stand" in `AGENTS.md`) |
| *where the numbers go* | the PR's table |
| *where rules are taught* | a visible cue and a lesson: the one-time lesson and a Field guide row, always both |
