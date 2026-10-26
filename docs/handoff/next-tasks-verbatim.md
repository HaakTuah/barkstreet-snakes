The owner's task (2026-10-21), to start AFTER the weekly reset (Oct 26), as they chose. One session, no subagents or workflows.

Make development in this repo cheaper in usage, and give me playable previews.

1. Add this to CLAUDE.md under "How to work":
   - A question is a question. Answer it; don't act on it unless I say so.
   - Match effort to the task. Docs, READMEs, small fixes and config: one pass, no subagents.
   - Don't use more than 2 agents unless I ask for it. Never stop to ask about this:
     pick the cheaper way, and say in the PR what you chose.
   - Usage is limited. Prefer the cheapest approach that does the job well.
   - Read only the parts of large files the task needs (search, then read sections).
   - Long simulations: run them in the background and wait for the completion notice.
     Don't poll, and don't keep agents alive just to wait for a run.
   - At each milestone, open a PR I can play, say in it what to try, and carry on with
     the next item without waiting for me to review or merge.

2. Split DESIGN.md into one file per topic under docs/design/, with a short index in
   DESIGN.md that says what each file covers. Move the text as it is; don't rewrite it.
   Update links that point into it.

3. Split render.js into modules by responsibility (for example map, snakes, UI, effects),
   with no change in behaviour. Done when rules-test, render-test, ui-test and
   layout-test pass and simulate.js gives the same fingerprints as before the split.
   If the split turns out to be risky, skip it, say so in the PR, and carry on.

4. Add a GitHub Action that publishes every PR as a playable preview on GitHub Pages at
   its own address (for example /pr-<number>/), puts the link in the PR, and removes the
   preview when the PR is closed. The game's current Pages address must keep showing
   main exactly as before. Make sure the service worker in sw.js doesn't serve main's
   cached files on preview pages, or previews from main's pages. If a Pages setting
   has to be changed by me, say exactly what in the PR and carry on.

On a branch, with one PR. Say in the PR what the sizes were before and after.
Then carry on with the rounds as before.

The owner's two additions (2026-10-21):
- Previews: every push to main must update the site root on the publishing branch
  automatically, so the site never stops updating.
- render.js (CORRECTED by the owner, replacing their first wording): "split it fully if you can do it cleanly with
  identical simulation results. Only if part of it can't be split cleanly, split the
  clean parts, leave the rest for later, and say in the PR what was left."

My notes for then:
- Do it cheaply: item 2 with a script that splits on the "## " headings (move text as is; references in code comments like DESIGN "Section" are names, not links).
- Item 3 is the costly, risky one: render.js is over 9,000 lines in one closure with shared state.
- Item 4: Pages can only serve one deployment per site, so per-PR folders need a gh-pages branch (main at the root, pr-<n>/ beside it). That likely means the owner switching Pages' source to "Deploy from a branch: gh-pages / root"; say so exactly in the PR. sw.js's scope covers subpaths, so it must skip /pr-*/ requests, and previews need their own cache name or no service worker.

---------------------------------------------------------------------------
SECOND TASK (the owner, 2026-10-21): after the docs-and-previews PR above, as its own small PR. Then carry on with the rounds.

Don't start this now. Save it with the instructions you already saved, to do after the
weekly usage resets.

Background: I've considered whether Barkstreet Snakes should be rewritten in TypeScript,
and decided not to. It already runs natively in the browser, "no build step, no
dependencies" is one of its features, and a rewrite would risk a working game for no gain
a player would notice. But I want the main benefit of types, catching mistakes before
they reach a playtest, where it matters most: the multiplayer messages, where a
mismatched field between two players is hard to find by playing.

The task:
- Add // @ts-check to net.js and online.js, and describe the multiplayer messages sent
  through PeerJS as JSDoc types.
- Run tsc --noEmit in CI as a check only. The game stays plain JavaScript, with no build
  step and no new dependencies in what's shipped.
- Don't annotate the rest of the code.

My notes for then:
- Many messages are positional arrays (for example ['burrow', x, y, dug]): type them as unions of tuples, and narrow on the first element.
- online.js reads engine objects (snakes, events). Give it small hand-written typedefs of just the fields it reads, in a .d.ts beside the check (for example types/globals.d.ts for window.SnakeEngine and the others), without annotating engine.js.
- CI: install typescript in the job only (npx -p typescript tsc --noEmit -p jsconfig.json), with a jsconfig limited to net.js and online.js plus the .d.ts.
- A cheap complement: an online-test check that every message kind survives encode, then decode, unchanged.

The owner agreed (2026-10-21), in the same typing PR:
- the small hand-written description of the engine fields online.js reads;
- the round-trip test for every message type;
- and one more: "have the round-trip test record a fingerprint of the message shapes together with the protocol version, and fail if the shapes change without the version being bumped."

My notes for the fingerprint:
- Compute it from the encoder's real output: one sample message per kind, from the round-trip test. Record each kind's name, its length, and each field's type (number, string, boolean, array, object with its sorted keys), sorted by kind, then hashed. Deterministic, with no timestamps.
- Pin it in a committed file (for example tools/protocol-shapes.json: { version, fingerprint, kinds }), checked by online-test.
- Shapes changed, version not bumped: FAIL, naming the kinds that changed and saying to bump online.js VERSION.
- Version bumped, pin not updated: FAIL, telling you to refresh the pin with a flag (for example node tools/online-test.js --pin), so the pin always records the current pair.
- Version bumped with no shape change is allowed (a change in meaning); the pin just records the new version.
- Also check the pin's kind list against the JSDoc message union, so a new kind can't skip the types.
