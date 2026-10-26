## Architecture change (and why)

`snake.js` was 1,500 lines mixing the rules engine, the renderer, the UI, input and debug tools. It is split into:
- **`tuning.js`:** every number that shapes how the game plays and feels, in one frozen object.
- **`engine.js`:** the pure rules. It's used unchanged by the game and by `tools/simulate.js`. It has no DOM.
- **`render/`:** the canvas renderer: layers, sprite caches, particles and character animation (once `render.js`; split by responsibility on 26 October 2026, its files listed in `render/core.js`).
- **`audio.js`:** a tiny Web Audio synthesiser for the cues and the adaptive music.
- **`snake.js`:** the game controller: the loop, input, overlays, HUD, records glue, the friends lobby and the dev frame-time overlay (`?perf`).
- **`online.js` and `net.js`:** play with friends: the protocol (testable in Node) and the connections.
- **`tools/simulate.js`:** the balance simulator, moved out of the page into Node. It runs on several cores (half of them, at low priority, since round six A), and with `--seed` it repeats a run exactly, which is how the engine split, the AI's think-ahead and the AI optimisations were proven to change no decision. (Round six A's tools beside it, `bench-ai.js`, `abtest.js` and `snapshots/state.js`, are in "The rivals think faster".)

`ai.js`, `chatter.js` and `records.js` keep their roles. Plain `<script>` tags still work from `file://`, with no build step.

