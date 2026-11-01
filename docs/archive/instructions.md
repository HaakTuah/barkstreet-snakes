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

In the design chat (28 October 2026, 23:30 UTC), on the "For Haakon" questions about Gobbler's nerve and the woodpecker's size:

> Agreed to all, expertly! Shouldn't the others contest apples more if they're hungry? They're worth more than, because usually apples just gove you plus 1, but if you are starving, they give you 1 and save you 1, so become plus 2? But yes, gobbler should contest it regardless. And Desperados being an adrenalin junkie, should generally be less risk averse?

(queued as 2b and 2c in `docs/PROGRESS.md`)

In the design chat (28 October 2026, 23:43 UTC), after Amarna Letters' code-PR checks grew from about 6.5 to 10 minutes
because its test games had grown, and Claude proposed a standing rule for both games that every test uses the smallest
game that still tests its rule:

> Yes, make it expertly so! Are there more optimizations we can aplly to the development of the 2 games, maestro?

(a standing instruction in `CLAUDE.md`, "the smallest setup that tests the rule")

In the design chat (28 October 2026, 23:47 UTC), to Claude's five optimizations to the development of both games (a fresh
design chat each day from a handover note; Codex for reviews; builders settling settled questions themselves; this
file trimmed under its 20 KB mark; faster checks for Amarna Letters):

> Yes, do all expertly 1-5 except codex since we don't have it yet.

(here: `CLAUDE.md` trimmed, the full text of "pipeline, don't wait" and "as many lanes" moved to `docs/orchestrating.md`)

In the design chat (28 October 2026, 23:57 UTC), on a new rival:

> add Charmer to the queue, exactly as I have prescribed, with his clingy unique playstyle.

(queued as 3c in `docs/PROGRESS.md`; his look and death mark are left for Haakon to give)

In the design chat (29 October 2026, 00:00 UTC), on the rivals making no sound when they eat:

> Yes, queue it. Feels strange that there is no sound, when your snake makes loud sound when eating.

(queued as 2d in `docs/PROGRESS.md`)

In the design chat (29 October 2026, 00:03 UTC), playing:

> I am seeing copycat shy rotten apples twice now, that was within reach. Both were next to the map edge.

(added to 3b in `docs/PROGRESS.md`)

In the design chat (29 October 2026, 00:06 and 00:07 UTC), playing:

> Looks a bit weird when the woodpecker pecks a tile with a snake tail on, and the snake isn't hurt. Is it possible to make it so visually, it doesn't peck exactly on the snake? So it looks natural that the tiles go, but that the snake is left unhurt? Just a visual issue, nothing gameplaywise.

> Yes please, expertly!

(queued as 2e in `docs/PROGRESS.md`)

In the design chat (29 October 2026, 00:27 and 00:28 UTC), on Wildcard's hair as it plays:

> Trump's hair looks like a mop now…

> Yes, and make it do it expertly! I want trump's hair for Pete's sake!

(queued as 2f in `docs/PROGRESS.md`)

In the design chat (29 October 2026, 00:31 and 00:32 UTC), playing:

> I notice snakes imidately become plump again when after eating while starving. I feel it should be an animation where you see it transform to getting plump and its color back.

> Yes, expertly!

(queued as 2g in `docs/PROGRESS.md`)

In the design chat (29 October 2026, 00:15 to 00:18 UTC), on a new chatter line: "Should colonist have the line "Snows always melt"?", then "It's quoting mark Anthony in rome." (a scene from the series, where Antony speaks for Caesar: "I assure you, it is no threat. Snows always melt."), and, to Claude's take that it belongs to Mason, the Caesar snake, in English, beside "Hiems venit!":

> Agreed.

In the design chat (29 October 2026, 00:48 and 00:50 UTC), after Claude said starving caused 1 to 3% of deaths:

> I think it should be a but more agressive. Someone should at least die from it once in a blue moon. Now games maybe feel a bit too samey? It's pretty predictable. But if food levels varied more, that would change things up.
>
> Also, snakes should maybe avoid food more with the woodpecker about? I see snakes gorging on the remains of other snakes, when they have only a few tiles left to move on. They are not doing a context relevant tradeoff calculation there, clearly.
>
> And should the chat lines be voiced?

Then, to Claude's takes (food seasons; eating only what keeps you alive in the endgame; babble voices):

> But sometimes starving still lasts you longer than increased length will, with so little room also. And make sure the voices arent distracting! That would be a real turn off!

(queued as 2h, 2i and 2j in `docs/PROGRESS.md`)

In the design chat (29 October 2026, 06:49 and 07:12 UTC), on when Round six B's new moves will be playable: "Do you
think the snakes power update will be finished by 18 of clock?" Then, to moving it up to right after Copycat:

> It's the one I am most interested in playing, and it has been pushed back for a long time now. Also, the teaching system will have to account for it.

(item 5 moved up in `docs/PROGRESS.md`; the teaching system, item 4, after it)

In the design chat (29 October 2026, 07:49 and 07:50 UTC), on Wildcard's hair F as it plays:

> Dont trumps hair look a bit too big now?

> Yes, let's try that!

(the second to keeping F's shape at about 85% of its size; queued as 2f+ in `docs/PROGRESS.md`)

In the design chat (29 October 2026, shortly before 08:00 UTC), on the woodpecker and the flags:

> I think the woodpecker should be even bigger, and would be cool if the flags of sovereign and colonists bends away from a snakes body, depending on direction it was hit when a part of a snake occupies its tile, don't you think?

Then, to Claude's suggestion that a bigger bird be checked with the simulation:

> How should a visual change alter the actual game in any way?

And, to queueing both as art lanes, the bird checked by eye for what it hides: "Yes, please, expertly!" (queued as 2k
and 2l in `docs/PROGRESS.md`)

In the design chat (29 October 2026, 08:02 UTC), on 2k's size:

> Maybe make it as big as you can get away with without it falling out of the screen, or being pushed onto the gameplay screen when not pecking, or anything.

(2k in `docs/PROGRESS.md` now asks for the biggest size that passes those checks, rather than 1.6 times)

In the design chat (29 October 2026, 08:02 to 08:09 UTC), on beetles that meet: "Also, should 2 beetles who meet start
fighting?" Then, after Claude suggested measuring first how often they meet:

> Well, what happened the game i was watching now was that 2 beetles ended up on an island the woodpecker made, away from the snakes. Looked a bit boring that they just walked around like that, I wanted something to happen. Therefore, given how rare it is, i thought it should feel special.

And, to Claude's take (they notice each other, a shoving match, the loser flips, a gamble for a snake that gets there):

> Yes, please, expertly! Love how you described it! And it should come late, it is probably the most uneasecary feature we have discussed here, so leave it last or close to last, I'd say.

(queued as 8, last, in `docs/PROGRESS.md`)

In the design chat (29 October 2026, 09:00 UTC), to the "For Haakon" question on rivals' chomps while watching sped
up (2d, PR #150), among answers for Amarna Letters: "Yes to all, expertly!" (kept as is)

In the design chat (29 October 2026, 11:33 UTC), to 2j's questions (are the babble voices distracting; the Voices
switch under the board): "No, just merge them, then we will adjust if it is distracting." And, to the design
session's other takes, the switch's place among them: "Other than that, implement all you said, expertly!" (2j ships
with the voices on; the switch stays under the board, V at any time)

In the design chat (29 October 2026, 11:40 and 11:42 UTC), on the new moves: "What about the new flashes that can cut
all the time? Super jumps? And portals others also can follow and pass through for a short time?" The design session
found item 5 listed only part of "Round six B" (the island hop, bridges, pricing and dropped charges), and suggested
adding the cutting flashes with tail-dropping and Mason's double walls, the golden flight with bumps in the air, and
the gold portals, in that order, with pricing last:

> Yes, they are all part of the power update! What i have been looking forwards to!

(item 5 in `docs/PROGRESS.md` now lists every move, in order)

In the design chat (29 October 2026, 11:46 UTC), on the new moves: "And a point about jumps, colliding mid-air costs
what a regular crash costs, plus you fall, so if you are over fire, you ignite. If you are over a hole, you fall down,
if you sre over another snake, you get checkmated." (fire written into "Bumps in the air" in
`docs/design/29-round-six-b-the-new-moves.md` and item 5; the hole was already there; what "checkmated" means over a
snake went back to Haakon as a question)

In the design chat (29 October 2026, 11:49 and 11:50 UTC), on a mid-air bump over another snake (the design slid you
off to a free cell beside it): "Well, you are out in game if you are trapped by other snakes, so why should we be more
lenient when leaping?" Then: "In my mind, you are trapped if you crash into another snake mid-air and another snake
blocks your landing." (written into "Bumps in the air": onto a body you're out; over bark the ground's trapped test
holds)

In the design chat (29 October 2026, 11:54 and 11:55 UTC), on the jump: "I imagine mid air crashes won't be that
frequent. But maybe you should be able to leap whenever you want, not only at gaps, so someone really skillfull can
time cutting someone else off midair like that. Becomes a high skill manuver." Then, to the design session's take (a
second press while a jump waits sends it at once; the rivals use it; tested so it never becomes a refuge): "Agreed to
all, implement expertly!" (written into "Leap now" in `docs/design/29-round-six-b-the-new-moves.md` and item 5's part 4)

In the design chat (29 October 2026, 12:05 and 12:16 UTC), on the new moves: "If you manage to get right under where
someone is landing, are you knocking them out then too? I think so, so it becomes a risky manuver to do frequently
near anyone. And flashing, can you hit someone straight on the head with it and take them out, or only all that's
behind the head?" (the first already holds since the bump rule; the second is a failed flash) Then, to the design
session's take that a cut leaving a snake fewer than 3 segments puts it out: "Agreed , do it expertly!" (written into
"The neck cut" in `docs/design/29-round-six-b-the-new-moves.md` and item 5's part 3)

In the design chat (29 October 2026, 12:21 UTC), on the new moves: "And very important that the commin ai is updated to
understand all these rule changes to maximize they use of all the playrules!!!" (written into item 5 in
`docs/PROGRESS.md`: no part merges until the rivals use its moves well)

In the design chat (29 October 2026, 12:25 and 12:29 UTC), on cutting yourself small: "if you cut yourself on purpose,
it would be because you want to fit into a small space, like in the end game. But then ypu drop your pellets, which you
will be constantly swallowing and spitting out. Is this optimal? The loop you are trapped in, I mean?" Then, after the
design session suggested choking once per drop:

> I suggest if you run over them twice you just squash them on the second round. And that stuff can fall off the edge. Now it all weirdly gets pushed somewhere it is still accessible, would be more natural if it can just fall off.

(written into "Choking on your own tail" in `docs/design/27-round-six-a-fairness-and-fixes.md` and item 5's part 3)

In the design chat (29 October 2026, 12:46 and 12:52 UTC), on your own beads and mushrooms:

> Or is it better if we scrap the whole "puke your own beads" which sounds a bit questionable now that I think about it 😂
>
> What if you just squash it on a first pass, so it is a real strategy, to pursue your own beads, just to deny the others food?
>
> And i am not one who looks to water good, well-working code, so what if every snake pukes up the mushrooms instead, so they can poison others as well?

Then, to the design session's takes:

> Yes, i agree to all, expertly! I feel it converts a patch into something that is a meaningful gameplay chocie, which is much better. It is true, you are often the one closest to your own beads. And that was a big problem when you could just regain the lost health. But now it is a real trade-off. You are risking more life, and dedicating energy to sabotaging for another snakes instead of finding something to eat so you regain, so your making an active choice at the cost of your own. Which isn't nessecarily a good choice, if that other snake wasn't set to win anyways. So i think this will he really good!

(written into "Choking on your own tail", replaced, and "Mushrooms come back up"; item 5's part 3. His further idea, an aimed spit, went back to him as a question)

In the design chat (29 October 2026, 12:52 and 12:55 UTC), on mushrooms: "Then maybe you swallow the mushroom, don't get
stunned, and have a bit of time to angle where you want to spit it, and you can maybe spit it 2 or 3 tiles away? Then
it can become even more potent for the next person? What do you think, expert?" Then, to the design session's shape of
it (a second in the cheek, aimed by steering, 3 ahead, a hit on a head poisons, a shade stronger each time to 5, never
killing by itself):

> Yes, that's fantastic! Let's do that! I love when game mechanics turn fron pure badness to conditional good! Now w eight have snakes back that actually eat them on purpose on certain cases! Bravo!

(written into "Mushrooms come back up" in `docs/design/29-round-six-b-the-new-moves.md` and item 5's part 3)

In the design chat (29 October 2026, 12:57 UTC), on the lessons: "And is this before the lessons rework? Because this
will definetly be part of it. I think all this should come right after the new powers." (item 4 in `docs/PROGRESS.md`
now starts as soon as item 5's last part merges, and teaches every move of it, the mushroom spit included)

In the design chat (29 October 2026, 13:12 UTC), to the "For Haakon" question on bridges coming up rarely (about one
ride in twenty rounds), and the design session's take (keep it rare, re-measure after the golden flight and the
woodpecker's three acts): "Agreed with you expert take!"

In the design chat (29 October 2026, 13:15 to 13:19 UTC), on flashes and the edge: "Bridges can be cut by flash, yes?
And the existence of flash and super flash could incentivize being by the edge more, no?" Then, to the design
session's suggestion that a cut always happen, the flasher paying when nothing is free beyond: "Right now they are
deadly afraid of the edge, so incentivicing sticking by the edge more might not be such a bad thing. But I also like
your idea, so I am conflicted." And to building it his way first, measured, with that rule as the fix if the edge
becomes a refuge: "Agreed, expert!" (written into "The edge is a shelter, measured" in
`docs/design/29-round-six-b-the-new-moves.md` and item 5's part 3)

In the design chat (29 October 2026, 15:19 UTC), back home, to 2k's question (the bird over the speed buttons' words on
a phone held upright) and the design session's suggestion to keep clear of the words: "Keep the bird 1.7x. And agreed
with everything else." (queued as 2k+: 1.7 times everywhere, perching clear of the words where it can, never shrinking)

In the design chat (29 October 2026, 16:39 UTC), on learning that the builder had stopped at the weekly usage warning:
"They weren't supposed to stop before 90%. We're still at only 76%" (written into "Usage" in `CLAUDE.md` and the
brake in `docs/orchestrating.md`: only the measured share counts; item 5 carries on)

In the design chat (29 October 2026, 16:42 UTC), to the question on Mason's double walls (its straight runs 3.5 to 3.1
cells a turn; everyone else 1.9) and the design session's take to keep them: "I agree with all your takes." (kept)

In the design chat (29 October 2026, 16:51 UTC), on beetles and the woodpecker:

> Beetles should quickly try to escape down their burrow when woodpecker targets their little "island". And it seems almost no new burrows appear as the woodpecker destroy the old ones. Also, if the woodpecker takes out the tiles under the beetles, they just teleport now.

(queued as 2m in `docs/PROGRESS.md`, between item 5's parts 3b and 4)

In the design chat (30 October 2026, 01:27 UTC), to the design session's take on PR #195's finding (spat mushrooms
hardly ever land between rivals) that the spit should fly along the line up to 5 cells and stop at the first head or
body:

> 3. Agreed, do it expertly!

(queued as item 5, part 3b+, right after part 4; written into the design's "The spit flies along the line")

In the design chat (30 October 2026, 02:02 UTC), feedback from playtesting:

> - trump looks like David Lynch now. I actually think the very first or second hairstyle trump had in the game is better than what he has right now
> - splashing looks like eating. Should leave behind squashed beads in my opinion
> - when you eat a mushroom, you cannot eat for a really long time like a few seconds. Cost me a few apples. That's a pretty big trade off for getting to spit on someone
> - the flag bends now. But i would like to give it some perspective also. So people that pass behind it, dont show up in front of it. They should be behind it. Also, it doesn't quiet know what to do when a snake hits it dead on, so that must be accounted for. And it should also react to soverign and colonists hitting it.
> - I see snakes jumping onto small islands where they have no chance to survive for very long
> - do the snakes have a bit too good reaction time? This is just a question! Just seems they play a bit too well in that regard perhaps
> - I believe we discussed previously making it so the regular leap could close any gap, so it could carry you across to any island. I still see the situation arise where 2 islands form at the opposite ends, and the snakes are trapped on each, so the one on the bigger one wins.

And, to the design session's takes (the five hair versions side by side to pick from; a splat for a squashed bead;
the spitter sliding over its own mushroom, since it was swallowing it again 3 moves later; flags in depth, head-on and
bent by their owners; rivals weighing an island before hopping; rivals noticing far things later than near ones; the
woodpecker never leaving a piece of the log out of a hop's reach, rather than a jump across any gap), at 02:09 UTC:

> Agreed to all! Implement expertly!

(queued as 2n, 2o, 2p, 2q, 2r (in item 5's part 4), 2s and in item 5's part 3b+). On Capricious, the same minute: "And i
think now that capricious is always pink, it doesnt need that weird border effect around its head anymore. Agreed?
Though it maybe should be more apparent when it transforms, like an coded animation that works for all of them, or
something?" (a question; in the "For Haakon" table)

In the design chat (30 October 2026, 02:15 UTC), to the design session's take on Capricious (drop its ring; a short
costume change for every mood, Copycat's new model the same way): "Agreed to both, expertly! And don't forget a snake
must account for if it can jump off the island again if it picks to jump there!" (queued as 2t; written into 2r) And:
"Also, where are the pictures of wildcard's different hairstyles?" (the design session made them from the PRs' own
pictures; 2n waits for his pick)

In the design chat (30 October 2026, 02:19 UTC), on the picture of Wildcard's seven hair versions: "What if we took
the original, but have the swirl point upwards instead of downwards?" And, to the design session's take (the front
lifting up and back off the brow as Trump's does, its tip flicking to one side, shown to him before it merges), at
02:20 UTC: "Yes, please, expertly please!" (written into 2n)

In the design chat (30 October 2026, 02:22-02:42 UTC): "Question, why does the same cast show up each time I start the
snakes game now?" Then: "I might've picked them yes. Didn't expect them to stay permanently." And, to the design
session's takes (a picked seat lasts this visit, with a pin to clear it; rivals never met go back into the deck at a
random place, not on top): "Agreed to all!" (queued as 2u)

In the design chat (30 October 2026, 06:52 UTC), on the second try at Wildcard's hair (PR #208) and the waiting part 4:
"Yes to all, except the hair, it looks horrible. I want the original hair, but I want the lick reversed. That's all.
Keep it that simple." (written into 2n; part 4 waits for a session that makes leap now pay the rivals)

In the design chat (30 October 2026, 07:11-07:13 UTC): "Should barkstreet snakes also have a "updated game" thingy that
pops up?" And, to the design session's take (a note only between rounds, one tap to reload, the host first online; one
line of what changed after updating): "Yes to both, do it expertly!" (queued as 2v)

In the design chat (30 October 2026, 07:15-07:16 UTC), on new versions: "I just figured it should've updated itself, and
not have to ask me." And: "It should update when you start game. It always pops up when I havent even started a game
yet. Like why would I not want the latest version?" (2v now updates by itself between rounds, with no note to tap)

In the design chat (31 October 2026, 11:31-11:39 UTC), on a second account spent before Monday's reset: "They can spend
100% on this account i have used it for what I need." "I can set them to yse fable." "Should we add a polish point to
each that it can spend the last credits on also?" And, to the design session's shape of the polish lane: "Yes, and make
things as refined as possible!" (written into `docs/PROGRESS.md`, "The polish lane")

In the design chat (31 October 2026, 13:44 UTC), to the design session's questions on the second account's first
reports (Wildcard's hair, third try; turning on GitHub's "Automatically delete head branches" and leaving the 144 old
merged branches; moving the open entries' specs out of `docs/PROGRESS.md`): "Yes, to all, expertly! The hair looks
"okay" now." (2n merges with PR #208; the specs moved to `docs/handoff/queue-specs.md`; Haakon turns on the setting)

In the design chat (31 October 2026, 13:51-13:53 UTC), to the improvement audit's questions and the design session's
takes (the trademarks that never show: measures first, then more teeth in part 7; character never costs wins: Joker
into the 15-35% band and the gap to Drab closed in part 7, every trademark kept and Drab left as it is; 2s ahead of 2q,
measured with part 4's flight in place): "Agreed to all, expertly!" (written into `docs/PROGRESS.md` and
`docs/handoff/queue-specs.md`, entries 5, 2s and 2q)

In the design chat (31 October 2026, 13:56-13:57 UTC), as the second account neared its five-hour limit: "Have we
informed them to push every single commit? I see that they are now running out of their allocated usage for the next
couple of hours. I don't want them to stop, but I do hope they have pushed everything that they can." Then, to making
"push after every commit" a standing rule in both games in place of "at every passed step and at least once an hour":
"YES!" (written into `CLAUDE.md`, "Standing instructions")

In the design chat (31 October 2026, 14:39-14:40 UTC): "The README for both projects should probably also be queued
to be updated?" Then, to a one-time refresh in the polish lane (the developer part moved to `docs/developing.md`) and
a standing rule that a change a player sees updates the README in the same PR, checked at each milestone: "Yes,
expertly to both!" (written into `docs/PROGRESS.md`, "The polish lane", and `CLAUDE.md`, "Standing instructions")

In the design chat (31 October 2026, 18:59-19:01 UTC), on the woodpecker over the help line on an upright phone (the
audit's second find, PR #240 parked): "Don't really care if it covers that a bit. None essential, you still see, and
you can click through. It also moves about frequently, so it doesn't cover the same spot all the time. So which of the
answer options fit with that?" To leaving it as 2k+ has it and closing the find: "yes, leave it." (written into
`docs/PROGRESS.md`, "The polish lane", and `docs/design/32-the-owners-playtest.md`, "Clear of the row's words (2k+)")

In the design chat (31 October 2026, 19:10 UTC), told that part 5's gold portals (PR #202) are parked and that in six test
rounds no rival followed through one: "Then we can increase the time it is open, until it actually makes a gameplay difference from time to time." (written into `docs/design/29-round-six-b-the-new-moves.md`, "Gold portals
for the wrap", and `docs/handoff/queue-specs.md`, part 5)

In the design chat (31 October 2026, 19:13-19:15 UTC), on part 4's A/B coming out even: "And I cannot believe that super flash and super jump isn't useful, then it must be the AI not properly being updated to understand its utility. Super jump essentially lets you fly for like 5 tiles, no? changing directions mid air like mario? and super flash let's you flash forward 3 tiles instead of 2 like regular flash, and can cut 2 tiles deep? how is that not useful?" To the design session's take (measure the flight and leap now apart; teach the rivals the flight's uses until fliers come out ahead; measure the golden flash on its own in the same pass; if only the flight pays, merge it without leap now and bring leap now back to him): "Yes, please, expertly!" (written into `docs/design/29-round-six-b-the-new-moves.md`, `docs/handoff/queue-specs.md` part 4 and `docs/PROGRESS.md`)

In the design chat (31 October 2026, 19:20-19:22 UTC): "Also, many of the Snakes dialogue lines are really really bad and corny. some of it are fun pop cultural stuff or wordplays I came up with, but most of it is corny writing by Opus 5.5. I think it would be nice to have a Fable 5.1 run on it at the end, to really piff up the writing. make it more clever and culturally engrossing. Though Trump actually got some good lines! So i don't want it to remove across the lines. remove the funny gags like Mason talking bad latin, or saying vidi vici veni which is a sex joke. but i want it to look at all, and give it a make over. the chinese lines are not as important. if it can, do them too, but most can't read them regardless. concur?" To the design session's take (the gags kept, the pass at the
end of the queue, protected lines, a side-by-side page to choose from, the Chinese last): "yes, and let it be creative! i don't want it to strictly look and improve whats there. that contrains it. let it go a bit wild and add stuff to, or make it over. it needs creative control outside of what i protect." (written into
`docs/PROGRESS.md` and `docs/handoff/queue-specs.md` as entry 9, and `docs/design/09-voice-and-copy.md`, "New lines,
until the writing pass")

In the design chat (31 October 2026, 19:34 UTC), with a desktop screenshot of the woodpecker beside the board: "And also, I really think the woodpecker needs to be even bigger on the phone than what it is now. Look on the PC, it looks proper threatning. Phone, not so much." (written
into `docs/PROGRESS.md`, the polish lane, and `docs/design/32-the-owners-playtest.md`; the size is his to pick from pictures)

In the design chat (31 October 2026, 19:34-19:37 UTC): "Space should also pause and unpause on Barkstreet Snakes." Told that Space is the jump since round four, and that P or Esc
nap: "Ahh, true! yeah, really any button should unpause, no?" To the design session's shape of it (any playing key, or a tap on the board, wakes; the waking press only
wakes; the keys that open or set something keep their jobs): "Yes, please! Expertly!" (written into `docs/design/09-voice-and-copy.md`,
the Pause row, and `docs/PROGRESS.md`, the polish lane)

In the design chat (31 October 2026, 19:39-19:40 UTC): "Do beetles ever manage to espace?" Told that about 33% of chased beetles got away when last
measured, inside the 20–35% band: "Yeah, I feel it should be at least a third of the time." (written into `docs/PROGRESS.md` and `docs/handoff/queue-specs.md` as entry 2w,
and `docs/design/27-round-six-a-fairness-and-fixes.md`, "The escape band")

In the design chat (31 October 2026, 19:45-19:55 UTC), watching Creeper drop his tail in a pocket: "Most box themselves in so the don't have the oppertunity to amputate like that. Would be better if they could anticipate it earlier, so they amputate while they still have the chance." Then: "I notice also that they eat insatiably others beads, when the map gets really small. i might eat one to stop hunger, but i would not eat it all at once. it only pays to be bigger than your opponent that late in game, if you are afraid you might have to run out the clock, but i have yet to see that happen. which is a shame. but woodpecker is getting a makeover right, so i don't want to focus to much on the current timing dynamic of the game. but yes. from my point of view, even if it was a time game, it would only  make sense to eat it, cut yourself so you are just longer than your opponent, then squash the beads. what's your expert take?" To the design session's take (fold the tail drop planned ahead, a length target and the denial play into entry 2h, the reasoning now and its numbers after the woodpecker's acts): "Sounds good!" (written into `docs/handoff/queue-specs.md` and `docs/PROGRESS.md`, entry 2h)

In the design chat (31 October 2026, 19:55-20:02 UTC), on the woodpecker: "Sounds good! though I think it should take fewer chunks at once as a rule, because the map shrinks really quickly now! and i also think when there is just a little bit of space, it should slow down again, so it isn't and rng competition where it is who's island it pecks at next that decides it, capiche? Whats your take?" To the design session's take (it takes less at once, eases off when the log gets tight, pecks where there is the most log per snake): "Yes, to everything, expertly! and i also want hunger to be a factor! right now, food and beads jjust become a negative at the end. if we manage to balance this right, we can make it a trade-off, just like we tried with everything else, like mushrooms. that's a sign of good game design, conditional goods. thomas sowell in game mechanics." (written into `docs/PROGRESS.md`, entry 6)

In the design chat (31 October 2026, 20:04 UTC), of the design session's line "Sowell would approve: no solutions, only
trade-offs.": "Maybe it include that one, so the builder understands xD" (written into `CLAUDE.md`, "Rules that stand",
as "Conditional goods: no solutions, only trade-offs")

In the design chat (31 October 2026, 20:14-20:20 UTC), on the woodpecker: "Bowser 2 in Super Mario 64 is what I always compare my imagined woodpecker to, and it doesn't break down the map until there is no space." Then: "sorry! final bowser!" To the design session's take on the final Bowser (the log breaking in big moments, a floor, then the bird fighting): "Yes, though I don't know about in a few big moments, I think perhaps I like what we've planned already better. Fits a woodpecker. but what if it takes few chunks at once, but it is cutting out a shape, and when that shape is no longer attached to anyhting, it falls? I really like your idea about a floor, and how it continues to peck which you must avoid, without taking out much anymore. maybe just a tile here and there in the late late game. what do you think, expert?" To the design session's take on that (pecks along an outline, the shape falling when cut loose, a floor, then aimed dodgeable pecks; every piece cut loose falls, so no islands, replacing 2s): "Yes, I think that's it. can still be jumpable gaps, but we want to avoid the islands stuff. it becomes too much rng, and isn't very exciting." (written into `docs/PROGRESS.md`, entries 2s and 6, and `docs/handoff/queue-specs.md`, entry 2s)

In the design chat (31 October 2026, 20:26 UTC), to the design session's question whether the bird should only cut loose pieces small next to the log: "No outline should be banned from falling, but ideally, it never takes out half the trunk." (written into `docs/PROGRESS.md`, entry 6, and `docs/handoff/queue-specs.md`, entry 2s)

In the design chat (31 October 2026, 20:27 UTC), to the design session's question whether part 4's flight test should run again after 2s removes the islands: "yes." (written into `docs/handoff/queue-specs.md`, entry 2s)

In the design chat (31 October 2026, 23:34-23:37 UTC; 1 November in Oslo), to #270's two questions (the woodpecker's size on a phone, and whether it should stay small when perched sideways): to the design session's pick of B, "Agreed with your pick on 1. But why does it stay small when sideways?"; told that the gap beside the board holds it, "Or it could be partly off screen? Seems better than making it super small and have it swell up whenever it attacks. its head would still be on screen, just its backside and that would be sticking out?"; then, to B both ways (212 px upright, 172 px sideways) with the sideways perch partly off-screen: "Yes. Sending it to the orchestrator now." (written into `docs/PROGRESS.md`, the polish lane's woodpecker entry)

In the design chat (31 October 2026, 23:40-23:43 UTC; 1 November in Oslo), asked why the orchestrator reuses sessions for new tasks, against "Keep the cache warm", and whether a session should take a new task when it touches the same files and its context is young and small: "We should do whatever is most effective at acheivein the goal, which is accomplishing them most possible, with the least tokens, without sacrifacing quality." (written into `docs/orchestrating.md`, "Keep the cache warm", and the same rule in Amarna Letters' `CLAUDE.md`)

In the design chat (1 November 2026, 12:52-14:40 UTC), on Claude and Codex building together: "I want to run them both togheter, so they collaborate, ideally. that way, they spread the usage, and can last about the full week, hopefully?" Then: "I thought there was mcp integration? can't the orchestrator just create Codex builder instances, like it does internally now, and split the load? and maybe they can review for one another, since they have different architectures and possibly different blind spots?" On the design session's pick of GitHub as the meeting point (12:53-13:04 UTC): "Well, they can continue communication over GitHub if something is unclear, or further notes needs to be exchanged, no?" (13:10 UTC): "Yes, this sounds like a good step to try first! But I think I will start with the 100 dollar subscription for Codex to start with, so Claude Code orchestrator must be aware that there will be times where Codex isn't avaliable. I suggest it makes a habit of dividing the labor with Codex in mind, but awaits a response for a short time, and if it doesn't get it, it assigns it to a builder session of its own? and it has to be aware that if Codex runs out of usage, it won't get an alert, so it has to be ready to fall back in case that happes. Though should absolutely all tasks go to codex? some presumably requires a bit more? take the music compositions we just did?" (13:17 UTC): "Some of the stuff you assigned Claude, it might be able to divide up further, so Claude has made the important calls and criterias, then hand-off the grunt work to Codex?" (13:20 UTC): "Yes, at least there should be a Claude reviewer with a clear idea of what the final product should look like, so it can make Codex iterate until it reaches that vision. Should we also add a criteria that they have to judge each other's work on a scale of 1/10, and if it isn't a 10, it goes back? I saw someone mention that trick, and it supposedly is a pretty good quality control." To the design session's version (a score and the list of what keeps it from 10, back while a point blocks, at most three rounds), 13:21 UTC: "Yes, I think we have a pretty good set-up here on all fronts now! I'll just go and get Codex and get it set-up before we start inserting this all into the project files." On Codex's review trigger (14:25 UTC): "It has a "smart detect (exprimental feature) or on every push. Should maybe just turn it off then?" (automatic review off, reviews on request). Then (14:40 UTC): "Okay, got the ChatGPT Pro 100 subscription now, so how do I set it up like I want?" (written into `AGENTS.md`, which `CLAUDE.md` now imports, and `docs/claude-and-codex.md`; the same in Amarna Letters)
