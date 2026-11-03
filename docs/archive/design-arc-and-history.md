# The round's arc, balance targets and the round files' history, as they were: the design files' text

The round's timeline as the round files had it, with its music column; round six B's balance targets; the architecture
change of an early round; round four's audit of what was promised and missing, with the docs it corrected; and a line
of the teaching plan that named the choke and the cough, word for word, moved by "The design by topic, not by round"
(#336, 3 November 2026). The current rules are in `docs/design/12-the-rounds-arc.md` (the round's arc),
`docs/design/21-sound.md` ("The music": its stages), `docs/design/39-the-rivals.md` ("Balance targets") and
`docs/design/30-teaching-by-showing.md`; today's architecture is in `docs/developing.md`, "How it's put together".

## From the round's arc (`12-the-rounds-arc.md`)

A round has a shape, and the music follows it:

| Moment | Rules | Music |
|---|---|---|
| Start card, countdown, round over | - | A calm marimba loop (84 bpm) |
| Opening | The first 3 ticks are eased (170 → 120 ms) | The loop plus a soft bass |
| 0:45 | The speed-up (120 → 90 ms over 2 minutes) is well under way | A shaker joins; the tempo creeps up with the game's speed |
| 2:00 | **Sudden death:** nothing new grows, but the last apples fall one at a time (round four); the woodpecker pecks the log away a patch at a time | Minor key, wood-block knocks |
| Last two snakes | - | Faster and tense, with a heartbeat kick |
| Watching | - | Quieter, no percussion |
| Napping | - | Ducked to about a third |

## From architecture change (and why) (`23-architecture-change-and-why.md`)

`snake.js` was 1,500 lines mixing the rules engine, the renderer, the UI, input and debug tools. It is split into:
- **`tuning.js`:** every number that shapes how the game plays and feels, in one frozen object.
- **`engine/`:** the pure rules. It's used unchanged by the game and by `tools/simulate.js`. It has no DOM.
- **`render/`:** the canvas renderer: layers, sprite caches, particles and character animation (once `render.js`; split by responsibility on 26 October 2026, its files listed in `render/core.js`).
- **`audio/`:** a tiny Web Audio synthesiser for the cues and the adaptive music (once `audio.js`; four files, listed in `audio/cues.js`).
- **`snake.js`** (now `game/`, split by responsibility on 26 October 2026, its files listed in `game/core.js`)**:** the game controller: the loop, input, overlays, HUD, records glue, the friends lobby and the dev frame-time overlay (`?perf`).
- **`online.js` and `net.js`:** play with friends: the protocol (testable in Node) and the connections.
- **`tools/simulate.js`:** the balance simulator, moved out of the page into Node. It runs on several cores (half of them, at low priority, since round six A), and with `--seed` it repeats a run exactly, which is how the engine split, the AI's think-ahead and the AI optimisations were proven to change no decision. (Round six A's tools beside it, `bench-ai.js`, `abtest.js` and `snapshots/state.js`, are in "The rivals think faster".)

`ai.js`, `chatter.js` (now `chatter/`, split on 27 October 2026) and `records.js` keep their roles. Plain `<script>` tags still work from `file://`, with no build step.

## From round four: the owner's feedback, and the calls (`24-round-four-the-owners-feedback-and-the-calls.md`)

### What was promised and missing

The completeness audit went through every request across three sessions. About 100 items were done. These were promised and not built, and are built now:
- rivals planning with their powers;
- the board-split fix;
- the trappers' thicker walls;
- lines for being put out by rain, for ash and for rot, and Sovereign and Colonist complaining when rot ruins their land (see "Lines and announcements");
- a steering hint beside the YOU arrow: its rule is in `30-teaching-by-showing.md` under "The first seconds", and
  this item as it was in `docs/archive/design-teaching.md`.

Things an expert would expect, added:
- a **Field guide** beside Hall of Fame and Your story: its rules are in `30-teaching-by-showing.md` under "The Field
  guide", and this item as it was in `docs/archive/design-teaching.md`;
- powers you can tell apart (above);
- beads that rot (above);
- a stop to eating back your own crash;
- new lessons: each lesson as it is now is in its topic file (the woodpecker's in `38-the-woodpecker.md`, the
  dash's key in `40-powers-and-moves.md`, the last apples' news in `04-food-and-the-world.md`; your own tail is
  squashed, not eaten, since round six B: `41-crashes.md`), and this item as it was in `docs/archive/design-teaching.md`.

Docs that contradicted the game are corrected: the holes were said to be trenches, the power marks were described from before the third pass, the "rare" golden apple came 5 times a round, and Joker's mushroom habit was missing. The critique found that the older sections still described the game before round four (force fields, Space naps, pressing ahead to leap, a woodpecker that cuts); they're brought up to it now, each older call kept and marked as superseded.

## From round six B: the new moves (`29-round-six-b-the-new-moves.md`)

**Balance targets** (simulation, paired seeds): powers on clearly beat powers off in the seat-split A/B (today they're even, 2.499 against 2.497); every persona wins 15–35% of rounds; rounds about 160–180 s; starving at most 8%; failed flashes rare enough to be a risk you take on purpose. The chosen numbers (the jump's rest, the flash's rest, a failed flash's cost) go here, for the owner's playtest.

## From teaching by showing (`30-teaching-by-showing.md`)

Step 2's timing, before the choke and the cough were gone (round six B):

- *How long:* its reading time, 1.2 s plus 0.45 s a word, 2.4–4.2 s. One line at a time. What just hurt you, or what you just got, takes over. The cough's line waits for the choke's. A line that can't show yet isn't used up.
