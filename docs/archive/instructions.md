# Instructions from the owner's message log

The owner's instructions, decisions and open questions about this project that weren't yet recorded in the repo's docs or docs/from-local/, copied word for word from the message log (owner-messages-log.md, which stays out of the repo), with their dates (UTC). Everything else in the log is already recorded in DESIGN.md, docs/from-local/claude-memory/ or docs/HANDOFF.md (all three folded into the repository on 2026-10-26: see `README.md` here).

## 2026-10-11 21:21

> I want 3 enemy AI's in the game. They shouldn't have super human reaction speed, but they should be very clever.

## 2026-10-11 23:22

> - Maybe the board can look a bit more intersting. Make the environment take inspiration from the snake game in the Flåklypa Grand Prix: Gullutgave (2002) as shown in the attached image?

## 2026-10-11 23:26

> I think the hair without the name is a good comprimise.

## 2026-10-13 23:11

> Very important that all the new stuff works across online play, cheif!
> 
> Very important everything feels balanced, cohesive, purposeful and like it belongs!
> 
> Optimizations! Optimizations! Optimizations!

## 2026-10-14 00:50

> If we can upgrade the AI, through making it do better future step planning, not by increasing reaction time, or making them all samey in strategy, nor decreasing performance below good gameplay levels, then I think we should do that.

## 2026-10-18 00:18 (an open question)

> Does the woodpecker put out fires also with its pecking. Or are there never fires during insta-death?

## The polish brief: given 2026-10-12 00:56 and 15:59, and again 2026-10-14 06:58

On 2026-10-14 06:58 it came with:

> Next set of objectives for a update/sets of PRs, after all that you are working on now, has been implemented and submitted as PR(s). The focus will be polish to the xtreme:

> The snake game in this directory is ours, and it already works. Your job is to make it the best browser snake game it can be: the kind that feels handmade by someone who cared about every pixel, every millisecond of input and every word on screen. Take your time and think hard at each stage. Polish is what this task is about, so don't hurry it.
> 
> ## How to treat this brief
> Everything below is a set of considered guidelines, not a checklist to tick off.
> - Weigh each point carefully against the game we're actually making.
> - If a point doesn't fit this game, skip it or adapt it. Examples: it clashes with the art direction you choose, it adds clutter, or it fights the existing design.
> - Record every skipped or adapted point in DESIGN.md with a one-line reason.
> - Don't skip something just because it's hard.
> - The Git workflow and Phase 7 verification are not optional.
> 
> ## Git workflow (applies throughout)
> - Before changing anything, check that the working tree is clean and create a new branch from main (e.g. `polish/handcrafted-snake`). Never commit or push directly to main.
> - Commit in logical, reviewable steps, each with a clear message:
>   - audit and design docs
>   - game loop and input
>   - performance
>   - visuals
>   - audio
>   - copy
>   - accessibility
>   - final polish
> - When everything is verified (end of Phase 7), push the branch and open a pull request against main with `gh pr create`. In the PR description, include:
>   - a short summary of the vision from DESIGN.md
>   - the main changes, grouped by area
>   - before/after screenshots of the key states (title, gameplay, game over, mobile)
>   - before/after frame-time numbers
>   - anything that needs testing or a decision from me
> - Do not merge the PR. Leave it open for my review.
> 
> ## Phase 1 — Understand before touching anything
> 1. Read every file in full. Map the architecture: game loop, state, rendering, input, scoring, persistence, styling, copy.
> 2. Run the game and play it. If you have a browser tool (Playwright, a preview server or anything similar), use it to actually play and take "before" screenshots of every state. Record baseline frame-time measurements too (see Phase 5).
> 3. Write an honest audit in AUDIT.md. Cover:
>    - bugs and edge cases
>    - anything that feels off in the controls
>    - visual inconsistencies
>    - text that sounds generic or placeholder-ish
>    - performance problems and hot spots
>    - what is already good and must be kept
> Don't change any game code until the audit is written.
> 
> ## Phase 2 — Define the vision
> Write DESIGN.md before implementing. It should cover:
> - **One coherent art direction.** Pick a single aesthetic and commit to it, and explain why it suits snake. Examples: a warm hand-drawn garden, a cozy pixel-art terrarium, a paper-craft diorama. Palette (5–8 named colors used everywhere), shapes, line weight, texture, corner treatment, typography. Every element should look like it came from the same hand. No generic "neon on black" unless you can argue it's the best choice.
> - **The snake as a character.** It should have personality. Possible touches:
>   - eyes that glance toward the food
>   - a blink now and then
>   - a tongue flick
>   - a body that tapers to the tail
>   - smooth curves at the corners
>   - a small gulp bulge that travels down the body after eating
> - **Food and the world.** Food with a little idle life, like a bob or a shimmer. A board that feels like a place rather than a grid, while staying perfectly readable.
> - **Borders and frames.** A deliberate frame or border treatment that matches the art direction, used consistently on the board, panels, buttons and overlays.
> - **Voice and copy.** One consistent tone for:
>   - the title and subtitle
>   - the start prompt and pause screen
>   - several game-over lines that rotate
>   - the new-high-score moment
>   - control hints
>   Every string should sound written, not generated. Keep it short and charming, and never cringe.
> - **Feel targets.** What "satisfying" means here, in concrete terms you can check later.
> - **Skipped or adapted guidelines,** each with a one-line reason.
> 
> ## Phase 3 — Game dynamics (must be rock solid)
> - **Simulation and rendering.** Run the simulation on a fixed timestep, separate from rendering. Interpolate the snake's visual position between ticks so motion is buttery smooth on 60/120/144 Hz screens.
> - **Input buffer.** Queue 2–3 turns so quick inputs like up-then-left are never dropped. Never allow a reversal into the snake's own neck, even through rapid key combos within one tick.
> - **Controls.**
>   - Arrow keys and WASD.
>   - Space or P to pause, Enter or R to restart.
>   - Swipe controls on touch devices that feel precise.
>   - Stop the page from scrolling during play.
> - **Fair rules.**
>   - Food never spawns on the snake. Handle the board-full win state gracefully.
>   - Moving into the tile the tail is leaving this tick is legal.
>   - The first moves after a start are forgiving.
> - **Difficulty curve.** Speed should increase gently, never feeling unfair. Tune it by playing; don't just pick numbers.
> - **Pausing.** Pause automatically when the tab loses focus or visibility.
> - **High score.** Keep it in localStorage, with every access wrapped in try/catch, and make sure the game works if storage fails.
> - **Restart.** It should be instant and frictionless. There should never be a dead moment where input is ignored without visible feedback.
> 
> ## Phase 4 — Juice, with restraint
> - **Eating** should feel great: a small pop, particles in the palette's colors, a score tick-up animation.
> - **Death** should land without being harsh: a brief freeze-frame, then a graceful transition to the game-over overlay.
> - **Sound.** Synthesize it with the Web Audio API (no asset files):
>   - soft, pleasant sounds for eating, turning (very subtle or none), death and a new best
>   - start audio only after a user gesture
>   - a visible mute toggle that is remembered between sessions
> - **Reduced motion.** Respect prefers-reduced-motion by dropping shake and particles and keeping the motion that conveys information.
> - Every effect has to earn its place. If it distracts from reading the board, cut it or tone it down.
> 
> ## Phase 5 — Performance (measure, don't guess)
> - **Measure.** Add a dev-only frame-time overlay behind a key toggle or URL flag, showing average and worst frame time. Use the browser's performance profiling where available. Record numbers before and after for:
>   - a long run with a long snake
>   - heavy particle moments
> - **Budget.** Script and rendering together should stay comfortably within a 144 Hz frame (aim for a few milliseconds per frame on an ordinary laptop). Nothing should stutter on eat or death.
> - **Loop.**
>   - Use one requestAnimationFrame loop, and no setInterval for game logic.
>   - When paused or hidden, stop or throttle rendering. Redraw only what animates.
> - **Data structures.**
>   - Use an occupancy grid (a typed array) for O(1) collision checks.
>   - Spawn food by picking from the free cells, not by retrying random tiles in a loop.
>   - Store the snake body in a ring buffer or deque instead of using unshift or splice on arrays.
> - **Zero allocation in the hot path.**
>   - Pool particles and reuse objects.
>   - No per-frame closures, array spreads, object literals or string building.
> - **Canvas cost.**
>   - Prerender static layers (board, frame, textures) to offscreen canvases, or stack separate canvases.
>   - Cache repeated sprites like food, eyes and segment pieces.
>   - Avoid per-frame shadowBlur, filters and font switches.
>   - Minimize context state changes.
>   - Snap to whole pixels where crispness matters.
> - **DOM.**
>   - Touch the DOM only when a value actually changes.
>   - Never read layout inside the loop.
>   - Animate UI with transform and opacity only.
> - **Audio.** Use a single AudioContext and cap how many sounds play at once.
> - **Loading.** Keep load fast: no render-blocking extras, sensible font loading, and the game works offline.
> - Leave the frame-time overlay in only behind the dev flag.
> 
> ## Phase 6 — Technical craft
> - **Crisp canvas.** Scale the canvas for devicePixelRatio and handle resize cleanly. Layout must work from a small phone in portrait to a large desktop monitor.
> - **Accessibility.**
>   - a colorblind-safe palette, with snake, food and board distinguishable by more than hue alone
>   - visible keyboard focus
>   - an aria-live region for score and game state
>   - sufficient text contrast
> - **Dependencies.** No frameworks or external assets unless the project already uses them. Keep the existing file structure unless restructuring clearly improves it, and if you restructure, say why.
> 
> ## Phase 7 — Verify, then critique yourself
> 1. Play it for real through the browser tool. Test:
>    - rapid direction changes
>    - pausing mid-turn
>    - the tab-switch pause
>    - resizing during play
>    - touch controls (emulate a mobile viewport)
>    - a long run at high speed
>    - a near-full board
>    - storage being unavailable
> 2. Screenshot every state: title, play, pause, eating, death, game over, new high score, mobile.
> 3. Re-measure frame times and compare them with the baseline.
> 4. Look at the screenshots as a picky art director and a picky player. Write down at least 10 specific things that still feel slightly off, fix them, and take new screenshots. Repeat this until you can't find anything worth fixing.
> 5. Check the code for leftover debug output, dead code and magic numbers. Constants that control feel should sit together in one clearly commented tuning block.
> 6. Push the branch and open the PR as described in the Git workflow section.
> 
> ## Working rules
> - Don't ask me questions. Make the call a thoughtful game designer would, and record it in DESIGN.md.
> - Depth over breadth. Don't add modes, power-ups or menus unless they clearly make the core loop better. A perfect classic snake beats a cluttered one.
> - Use a task list so the progress is visible.
> - When finished, give me:
>   - the PR link
>   - a short summary of what changed and why
>   - the before/after performance numbers
>   - which guidelines you skipped or adapted, and why
>   - the tuning constants I might want to tweak by hand

## 2026-10-26 (the design chat with Claude, while the repositories were set up for building in the cloud)

### 2026-10-26 20:34

On a suggested stop for the builders ("these 2" are this game's builder and Amarna Letters'):

> I don't agree with that break. I want these 2 continually working until they reach about 90% usage, at that point I don't want them taking on any bigger task, as I want the bulk of that remaining usage for myself.

It replaces the 95% line of the usage plan. Written into `CLAUDE.md` as "Usage". The same evening the builders were given
a `develop` branch to merge their PRs into, so that work can go on while Haakon is away; `main` stays his to merge.

### 2026-10-26 20:45

On the setup itself:

> Go, do it all, expertly! Just make sure you don't lose anything important along the way, or duplicate unessecarily, which creates drift!

On the milestone PR from `develop` into `main` (27 October 2026), after being told Haakon would merge it:

> You merge it. Always.

In the design chat (27 October 2026, 09:00 UTC), after Claude found no pushes from either builder for over an hour.
Haakon had asked "And shouldn't they push regularly so they don't risk losing anything?", and Claude asked "Shall I add
a 'push at every checkpoint, at least hourly' rule to both projects' instructions?":

> Yes to all, expertly!

In the design chat (27 October 2026, 09:35 UTC). Claude had pointed out that Amarna Letters tests each new feature by
playing scripts that use it against scripts that ignore it on the same seeds, which this game's rules don't ask for,
and asked "Should I add it as a rule there?":

> If your expert opinion is that we should, then go ahead, expertly!

In the design chat (27 October 2026, 11:01 UTC), after finding open questions in PRs and progress files that had not
reached him:

> Yes to all, expertly! And we need that all these questions get directly back to me from both projects. Having to hunt them down like this isn't good.

In the design chat (27 October 2026, 16:56 UTC), on Claude's proposal that builders check for changes again before
opening their pull request, after two Amarna Letters items had begun before Haakon's answers reached them:

> Yes, why not? If you don't object.

In the design chat (28 October 2026, 06:33 UTC), after naming the principles that answer most builders' questions:

> Code's should probably note where it has made an assumption, like it does now with questions, so we can check it afterwards.

In the design chat (28 October 2026, 07:12 UTC), on the tests running their 16-minute layout suite on every docs change:

> Yes, I think tests should only run where they impact something. To speed up development, and so the session don't lose cache and we pay for all of the tokens again?

(the CI change of PR #89). Then (08:03 UTC), on Claude's proposal of a check for what slows the work down as the game grows:

> Yes please, sound good! Do it expertly for both!

In the design chat (28 October 2026, 14:23 and 14:26 UTC), on how builders spend their time:

> Could we then have it so claude does something, pushes it uo to review. Starts on something new. And if the review comes back, a different session addresses it? Be more agile and efficient. Not just sit and wait for stuff?

> Yes, please, organize it expertly so we maximize token caching, time spent, and all other concerns.

In the design chat (28 October 2026, 14:48 UTC), after Claude proposed a second builder for independent work (Wildcard's
hair while an AI task ran) and asked for a yes, since it overrides the limit of two agents:

> Yes, allow for as many lanes as can be parallelized, expert.

In the design chat (28 October 2026, 15:50 to 15:54 UTC), on PR #107's pictures of Wildcard's hair:

> Also, looks like it is messing up wildcards hair again. But now by just making it look like 2 weird yellow blobs instead. You can take a look and see how it is making it now. Hope that isn't what it ends up going with.

> Can't you just describe who's hair it is making? Is it that difficult to make trump's hair?

> Yes please, expertly!

(the last to sending it back with Trump's hair named as the reference and three versions to pick from; queued as 1b+++
in `docs/PROGRESS.md`)

In the design chat (28 October 2026, 18:29 UTC), on PR #110's three versions of Wildcard's hair:

> Agree to all, expertly. Though a bit hard to decide on b or c. I feel maybe the bottom bit of b being smaller looks better, while the overall shape of c is better. So maybe we'll go for c, but it is hard to pick. Not the biggest fan of any of them, to be honest. Doesn't scream trump hair.

(added to 1b+++ in `docs/PROGRESS.md`: C's shape with B's smaller back, then one more pass)
