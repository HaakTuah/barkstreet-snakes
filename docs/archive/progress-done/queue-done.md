# Progress: done

## The queue, done

### 2aa. Dash on the key you're going (the owner, 4 November 2026; an input entry, a side lane now)

The steering key of the way you're going dashes again, as a swipe ahead does, behind touch's guard: its spec is in
`docs/handoff/queue-specs.md` under the same title.

*Done* (PR #557): a fresh keydown of the steering key the snake is already going dashes, through a swipe ahead's path (the same engine call and online message, so no protocol change and no rival change), behind touch's guard: never auto-repeat, and a press the way the last press turned you within `POWER_AFTER_TURN_MS` is that turn pressed twice. The hints, the dash lesson, the Field guide row, the README and `docs/design/40-powers-and-moves.md` ("The key ahead flashes, behind touch's guard") say so; the input suite proves it.

### 2x. The spitter slides over its own mushroom (the owner, 2 November 2026; an engine-rules entry, after part 5)

Taken out of 3b+ and moved to the front, since it still bites (the owner: "Still get the bug with swallowing a mushroom over and over again after puking it up."): the spec is 3b+'s "The spitter slides over its own mushroom" in `docs/handoff/queue-specs.md`, entry 5.

*Done* (PR #456): the spitter slides over its own spat mushroom for `OWN_SPIT_TICKS` (6) moves, as a full mouth goes over food; anyone else is hit by it as before. The cue: it lies wet (a green slick, a glint), drying as the moves run out; a lesson the first time you spit one, and the Field guide row. The rivals know it through `aiView()`'s food (who spat it), and play on over their own fresh spit as if it weren't there. Protocol 24. Head to head and against the old game, everything within noise, every trademark kept. `docs/design/40-powers-and-moves.md`, "Mushrooms come back up".

### 5 (part 5). Gold portals, unparked (the owner, 2 November 2026; an engine-rules entry, right after 2y)

The golden mushroom's wrap has no cost while the edges open for its holder alone, a small refuge from the edge; part 5's
gold portals are its counterweight (anyone may follow through for about a second), so #202 comes off the shelf right
after 2y (the owner: "Yes, expertly to all 3!"). Its spec and A/B are as entry 5 says.

*Done* (PR #202): portals open 2 s after the body passes (`PORTAL_MS` 2000). The rivals see the way through from afar (their room fill, territory split and power paths). Someone follows in 21% of rounds. Per use, a follower ends up longer but places no better, a design finding for the owner (#447). Every trademark is kept. The rule and its numbers are in `docs/design/40-powers-and-moves.md`, "Gold portals for the wrap".

### 1. Cheaper development and playable previews: one PR, no subagents

The owner's words are in `docs/handoff/next-tasks-verbatim.md`, with their two additions and one correction:

- CLAUDE.md's "How to work". *Done on 26 October 2026 (PR #39).*
- DESIGN.md split into `docs/design/`, moved as it is. *Done on 26 October 2026 (PR #39).*
- render.js split into modules, fully: the seventeen files of `render/`, sharing one scope. *Done on 26 October 2026 (PR #41).*
- PR previews on Pages at `/pr-<n>/` (`.github/workflows/pages.yml`, from the gh-pages branch), with main at the root and `sw.js`
  keeping their caches apart. *Done on 26 October 2026 (PR #41).* The owner must switch Pages to "Deploy from a branch:
  gh-pages, / (root)" (the PR says how).
- Sizes before and after, in the PR. *Done (PR #41).*

### 1b. The other big files, split the same way (recommended by Claude, 26 October 2026)

After render.js, split the other game files over about 100 KB into modules by responsibility, one PR each, by the
same rule as render.js: only with identical simulation results and the suites passing, and only the parts that split
cleanly. render.js's way may suit them too (see the top of `render/core.js`: plain scripts sharing one scope, loaded in
order; engine.js and ai.js are also loaded by the Node tools, which would need the new list). In order: snake.js (196 KB), chatter.js (154 KB), engine.js (113 KB), ai.js (109 KB), style.css (101 KB). Every
later task then reads a few small files instead of these. The owner may veto it.

- snake.js into the seven files of `game/` (renames where its names met render/'s; `tools/scope-test.js` guards the shared
  scope). *Done on 27 October 2026 (PR #43).*
- chatter.js into the four files of `chatter/` (its lines, in English and Chinese, and the talk). *Done on 27 October 2026
  (PR #45).*
- engine.js and ai.js stay whole (decided 27 October 2026). ai.js's `decide()` alone is one 68 KB function: splitting it
  means restructuring its inner closures, not a clean split. The engine's internals in the page's shared scope could be
  reached by name from the AI's code, against "what the AI is shown (`aiView()` only)"; kept in its closure, they can't.
- style.css into the three stylesheets of `style/`, linked in the same order. *Done on 27 October 2026 (PR #46).* With it,
  item 1b is done.

### 1b+. Wildcard's hair, again (the owner, 28 October 2026)

The owner (28 October 2026): "Wildcard's hair still looks really weird. It flips to the front side, you know like a blond
emo/goth haircut. Don't know what claud code insists on that, trump's hear doesn't go to the front and side like that."
The earlier entry asked for hair "swept back, then forward and to one side", and `pompadour()` in `render/faces.js` does
just that: it swoops forward along one side to a flick past the eye, a fringe over the face. The wrong part was the
entry's, not the drawing's. What it should be, seen from above (the head points +x):
- **Nothing in front of the brow.** The hair's front edge is a raised roll at the hairline, just behind the eyes, its
  forward-most point no further forward than today's brow line (about x = 0.12 of a cell); no flick, no fringe, no point
  past or over an eye.
- **Up and back, then round to the side.** From that roll the mass sweeps back over the crown and round to the far side,
  combed back over where the ear would be, so the far side is fuller than the near one; the swoop's tip ends at the back
  or the far side, never at the front.
- **Big and fluffy, swept back.** Golden-blond, puffed out past the head at the back and far side (as `hairBack()` has
  it), with a few strands drawn in the direction of the sweep, backwards, so the comb direction reads.
- Shown in the PR as before and after crops, on a light and a dark board, at the sizes of a phone and a desktop.
- Art only, no rule changes: the render suite and its looks checks pass; no reviewer needed beyond the pictures.
- *Done on 28 October 2026 (PR #107):* see "Wildcard's hair" in `docs/design/32-the-owners-playtest.md`.

### 1b+++. Wildcard's hair: Trump's hair, seen from above (the owner, 28 October 2026; small, next, a UI lane beside the AI work)

The owner (28 October 2026), on PR #107's pictures: "Also, looks like it is messing up wildcards hair again. But now by just
making it look like 2 weird yellow blobs instead. You can take a look and see how it is making it now. Hope that isn't
what it ends up going with." Then: "Can't you just describe who's hair it is making? Is it that difficult to make trump's
hair?" And, to sending it back with three versions for him to pick from: "Yes please, expertly!"

[PR #107's after](https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/32e97b81e878686f4951b3b21f27a411b3bc18e7/pr107-desk-clear.jpg)
draws a roll and a back mass as two shapes with a dark seam between them: two yellow halves, not a head of hair, and
heading up or down it covers most of the head. 1b+'s entry asked for a roll and a back mass, and #107 drew exactly that;
the wrong part was again the entry's. The reference is simply **Trump's hair**, which Wildcard caricatures (with the
stars-and-stripes body and the red tie): draw that, as seen from straight above (the head points +x).
- **One shape.** A single golden mass with no seam, gap or dark line inside it; it replaces `hairRoll()` and
  `hairBack()` as two shapes.
- **Front: a high wave.** Just behind the brow, swept up and back, its front edge at the hairline (about x = 0.12 of a
  cell, as now), with a lighter crest along it. Nothing over the eyes: both eyes show in all four headings.
- **Crown: the comb-over.** From the wave the hair is combed back and over to one side, the strands curving the same
  way, so the top of the head reads as one swirl to that side.
- **Sides and back fuller,** over where the ears would be and at the back, puffed a little past the head's outline, but
  not over the face.
- **Colour:** straw-gold, darker orange in the grooves between strands, one or two light strands for the shine.
- **Judged at real size.** The outline has to read on its own on a 390-pixel phone at its true size, not only in a
  zoomed crop.
- **Three versions for the owner to pick:** A, B and C, differing in the size of the front wave and how far the swirl goes
  to the side. The PR shows them side by side, all four headings, on the clear and storm boards, at phone size (true
  size and 3x) and desktop 2x, and asks the owner in "Questions for the owner" which one; it stays a draft until he answers,
  and the lane goes on with other work meanwhile. Only the chosen one ships: no option in the game, the others deleted.
- Art only, no rule changes: the render suite and its looks checks pass; reduced motion unchanged; no reviewer needed
  beyond the pictures and the owner's pick.
- **The owner's pick, and one more pass** (28 October 2026, on PR #110): "Agree to all, expertly. Though a bit hard to
  decide on b or c. I feel maybe the bottom bit of b being smaller looks better, while the overall shape of c is better.
  So maybe we'll go for c, but it is hard to pick. Not the biggest fan of any of them, to be honest. Doesn't scream trump
  hair." So: **C's overall shape, with B's smaller back** (the part behind the head no bigger than B's). Then one more
  pass in the same PR, because all three read as a golden bun or a bread roll rather than hair. What makes them bread:
  the dark outline round the whole mass, a few deep grooves that look like the scoring on a loaf, a smooth closed oval
  edge, and a warm baked colour. What makes it hair, and his:
  - **Paler,** straw to pale gold, lighter than now, with near-white highlights; the orange only in the shadows.
  - **No dark outline.** The edge is set off by a soft shadow on the head beneath it, not by a stroke round the hair.
  - **A feathered edge:** fine wisps breaking out at the back and sides (never in front of the brow), so the outline is
    soft and uneven, not a clean oval.
  - **Many fine strands,** not a few deep grooves, all combed the same way.
  - **The front ledge:** the wave overhangs the forehead a little, with its shadow falling on the brow just behind the
    eyes (the eyes stay clear).
  - **A parting on one side,** from which the hair is combed across the crown to the other side: the comb-over, seen
    from above.
  The PR shows C as it is beside the new pass, at the same sizes and boards, and asks the owner again. If the new pass
  still does not read as his hair, the owner chooses between them; the costume (the stars-and-stripes body, the red tie,
  the orange face) carries the rest.
  *Done on 28 October 2026 (PR #110): C's shape with B's smaller back, then the pass above; the owner is asked again.*

### 1b++. The phone's bottom: the chatter, the controls and the woodpecker (the owner, 28 October 2026)

The owner (28 October 2026), with two screenshots from his phone ([the chatter open](https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/3a098b38f41f596834c3bd0fefc5c453eede2b1f/owner-2026-10-28-chat-open.jpg),
[the chatter shrunk](https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/3a098b38f41f596834c3bd0fefc5c453eede2b1f/owner-2026-10-28-chat-shrunk.jpg)): "See how the chat display overlaps with the buttons when it
is shrunk? Also, it defaults to shrunk at start, even though the space below is used for nothing else. And the
woodpecker is still too small when it is down there." Then, on whether it may cover things down there: "Really, I don't
mine if it covers stuff up down there. It isn't important. But it is important that it is big. Rather now it is big when
it enters the game screen, and shrinks to a miniature when it goes down there. It should stay much more consistent. And
it it purches on and interact with us elements down there, then that just looks cool really."
- **The page's own parts never overlap.** The shrunk chatter bar sits clear below the speed row, with the gap the other
  rows have; no button, row or line of chatter is laid over another. The woodpecker is the exception (below).
- **Open by default where there is room.** At the start, and on a resize or turn of the phone, the chatter opens to fill
  the space below the controls with as many whole lines as fit, down to the screen's bottom edge (its safe area kept),
  as the desktop chatter fills its column (PR #72). It starts shrunk only where fewer than three lines fit. A player who
  shrinks or opens it keeps that choice (in storage, read and written in try/catch).
- **The woodpecker keeps one size.** Below the board it is the size it is on the board, scaled with the board's cell,
  never shrunk to a miniature as today. It moves freely down there and may perch on, and play with, the controls and
  the chatter: landing on a button's rim, pecking at the chatter's edge, hopping between rows. Covering them is fine
  (taps pass through it, as decided on 20 October); what matters is that it is big and consistent, and alive there.
- **Proved by the layout suite** at phone sizes (390x844, 360x780, 412x915 and a short 375x667), with the chatter open
  and shrunk: no control's box meets another's or the chatter's text (the woodpecker not counted), taps reach a control
  under the woodpecker, the bird's size below matches its size on the board, and the chatter opens where three lines fit. Before and after crops at a phone's size in the PR.
- UI only, no rules changed; it runs as its own lane beside the AI work ("as many lanes as can run in parallel").
- *Done on 28 October 2026 (PR #112):* see "The phone's bottom" in `docs/design/32-the-owners-playtest.md`.

### 1c. The big test files, split (the owner, 28 October 2026, the workshop check: next, before item 3's remaining entries)

The owner (28 October 2026): "Yes please, sound good! Do it expertly for both!", to Claude's proposal that included moving
the big-file split up the queue. The suites have grown past the 50 KB mark many times over: `tools/rules-test.js`
(199 KB), `render-test.js` (139 KB), `layout-test.js` (120 KB), `input-test.js` (90 KB), `chatter-test.js` (81 KB),
`simulate.js` (59 KB) and `ui-test.js` (52 KB), so every task that adds a test reads and searches far more than it
needs, and the layout suite alone takes about 16 minutes on CI.
- Split each suite by area into a folder of small files with one runner (`tools/rules/`, `tools/render/`, ...), one PR
  per suite, the same checks passing in the same number before and after (the runner prints the count), and
  `scripts/test.sh` and the CI names unchanged.
- The layout suite's screens split across parallel CI jobs (phones, tablets, desktops, or as its states fall), so its
  wall time drops to a third or less; each job still gated by "what the page shows" in `tests.yml`.
- `audio.js` (67 KB) split by responsibility if it splits cleanly, as `render/` did; `chatter/zh.js` (57 KB) is data and
  stays whole. `engine.js` and `ai.js` stay whole as decided in 1b; the workshop check notes them each time, and a clean
  split, if one appears, gets its own PR.
- Config and tests only: no game change, so no reviewer; the simulation's fingerprints unchanged.

- `tools/rules-test.js` into the fourteen parts of `tools/rules/` (PR #95), `render-test.js` into `tools/render/` (#96),
  `chatter-test.js` into `tools/chatter/` (#97), `input-test.js` into `tools/input/` (#100), `ui-test.js` into
  `tools/ui/` (#102), `simulate.js` into `tools/sim/` (#103) and `layout-test.js` into `tools/layout/` (#104): each
  file now a runner of its folder through `tools/parts.js` (plain parts share one scope, as the page's scripts do;
  parts that await run as one async function's body), the same checks passing in the same number (rules 389, render
  134, chatter 4433, input 72, ui 244, layout 2211), the simulation's fingerprints and reports unchanged. *Done on 28
  October 2026.*
- The layout suite runs as five CI jobs side by side (`LAYOUT_JOB`, `JOBS` in its runner, which fails if a part is in
  none): the longest 4 min, the whole run about 4 min 15 s, against 13 min 30 s before.
- `audio.js` stays whole: one closure with 34 shared `let`s; split as `render/` was, names such as `step`, `ctx`, `out`
  and `body` would meet the page's shared scope. The workshop check notes it, with engine.js and ai.js.

### 2. Types for the multiplayer messages: a small PR

Also in `next-tasks-verbatim.md`:

- `// @ts-check` and JSDoc message types in `net.js` and `online.js` only.
- `tsc --noEmit` in CI as a check. Nothing new is shipped and there's no build step.
- A hand-written typedef of the engine fields online.js reads.
- A round-trip test for every message kind.
- A pinned fingerprint of the message shapes together with the protocol version. It fails when the shapes change without a version bump.

*Done on 27 October 2026 (PR #48)*: see "The messages, typed" in `docs/design/22-play-with-friends-online.md`.

### 2c. The woodpecker, 1.3 times (the owner, 29 October 2026; a layout lane)

The owner (29 October 2026), "Agreed to all, expertly!", to the "For the owner" question on its size and the design session's
take: **1.3 times its size, on the board and under it alike** (one size). Under the board it still clings to and pecks
the buttons. Since it covers more of the board as it drums, check with the simulation that round length, deaths by
cause and per-rival wins stay within noise; pictures at a 390-pixel phone and desktop, as for PR #112.

Done (PR #139): 1.3 times everywhere, one size wherever the screen has room (101 px on a 390×844 phone, from 78); the
simulation's fingerprints identical. See "The woodpecker, 1.3 times" in `docs/design/32-the-owners-playtest.md`.

### 2d. Rivals' chomps (the owner, 29 October 2026; small, a sound lane)

The owner (29 October 2026): "Yes, queue it. Feels strange that there is no sound, when your snake makes loud sound when
eating." Today only your own snake's eating sounds (`sounds()` in `game/round.js`: `e.type === 'eat' && isMe(e.snake)`);
a rival's makes no sound, except a golden mushroom, which already plays softer and further off (`{ rival: true, ...at(e.x) }`).
- **Every rival's eating sounds,** each kind with its own cue as yours does (apple, golden, meat, mushroom, beetle,
  leaf), but softer and further off, placed where it ate on the board (`at(e.x)`), so you can hear a rival feeding where
  you aren't looking. Your own stays the loudest and the only one with the streak's rising pitch.
- **Never a pile-up:** four snakes eating at once must not drown your own chomp or clip (the compressor and the cues'
  spacing in `audio.js`); rivals' chomps give way to yours, as other rival sounds do.
- Muted and the sound settings work as for every cue; online, each player hears it on their own machine, so no
  protocol change. A test checks that a rival's eat plays its rival cue and yours plays yours.

Done in PR #150: a rival's meal plays its kind's own cue, as a rival's (dulled, at 0.3 of your chomp), from where it ate, never with the streak; one rival's chomp at a time, 180 ms apart, none for 350 ms after yours. Design: "Rivals' chomps" in `docs/design/21-sound.md`.

### 2e. The woodpecker pecks beside a snake, not on it (the owner, 29 October 2026; small, an art lane after 2c, which draws the same bird)

The owner (29 October 2026): "Looks a bit weird when the woodpecker pecks a tile with a snake tail on, and the snake isn't
hurt. Is it possible to make it so visually, it doesn't peck exactly on the snake? So it looks natural that the tiles
go, but that the snake is left unhurt? Just a visual issue, nothing gameplaywise." And: "Yes please, expertly!"
- **Drawing only** (`render/bird.js`, `render/bird-draw.js`): the tiles go at exactly the same moment as today; no rule,
  timing, simulation fingerprint or online message changes.
- **On a tile with a snake on it, the beak aims at the free corner or edge farthest from the body** (the body is drawn
  narrower than its cell, so that spot shows), and the tile cracks and crumbles from that spot inward, so the bird is
  seen chipping the log beside the snake, and the snake being unhurt reads as natural. On an empty tile it pecks the
  middle, as now.
- The aim's mark and the trembling of what lies in it (`render/food.js`) stay as they are. Reduced motion: the same
  aim, no crumble animation, as today's peck.
- Pictures in the PR: before and after of a peck beside a tail and on an empty tile, at a 390-pixel phone and desktop.
  Entry 6 (the woodpecker in three acts) keeps this aim.

Done in PR #141: the beak aims at the free rim spot farthest from any body on the cell (of spots as clear, the one
nearest the bird), the dent beside it with its splits running inward and stopping short of the body; drawing only.

### 2f. Wildcard's hair: lacquered, not a mop (the owner, 29 October 2026; small, an art lane): done, PR #144, version F

The owner (29 October 2026), on PR #110's hair as it plays: "Trump's hair looks like a mop now…" Then, to one more pass:
"Yes, and make it do it expertly! I want trump's hair for Pete's sake!"

Three passes so far: two blobs (#107), a golden bun (#110's C), and now twenty fine strands with no outline, which read
as straw or a mop. His hair is none of those: **one smooth, lacquered mass, combed and sprayed into place**, glossy and
solid, never stringy. Seen from above (the head points +x):
- **One sculpted shape,** C's overall outline with B's smaller back, puffed a little past the head over the ears and
  behind, never over the face. Its edge is set off by a soft darker-gold shadow on the head beneath it, not a dark
  stroke round the hair and not a feathered fringe.
- **Asymmetric: the comb-over.** A parting on one side; from it the top is combed across the crown to the other side
  and swept back, so one side reads fuller and the whole top reads as one sweep in one direction. The asymmetry is
  what makes it his.
- **The front: one big wave,** just behind the brow, rolled up and over to the side as a single curl, with its
  shadow on the brow; both eyes clear in all four headings.
- **A few long, broad comb grooves,** three to five, all following the sweep: not twenty strands, not scoring on a loaf.
- **Gloss:** one long highlight along the crest of the wave and the sweep, near-white, so it reads as sprayed hair.
- **Colour:** pale gold-blond, yellow highlights, a warm orange-gold only in the grooves' shadows.
- **The test before the pictures go to the owner:** a fresh helper (Haiku, given only the true-size and 3x crops of the
  versions, never this entry or the reference) is asked "describe this snake's hair in five words". A version passes
  if the answer reads as a swept, combed, glossy hairstyle, and fails on mop, straw, bun, bread, helmet or hat. Show
  only versions that pass.
- **Up to three versions that pass, side by side with C and the current hair,** at true phone size (390 px), phone 3x
  and desktop 2x, all four headings, clear and storm boards. **The PR stays a draft and does not merge until the owner
  picks one** (#110 merged before his verdict; this one waits). Only his pick ships.
- Art only: the render suite and looks checks pass; reduced motion unchanged.

### 2f+. Wildcard's hair: F, a size smaller (the owner, 29 October 2026; small, an art lane beside the new moves): done, PR #156

The owner (29 October 2026), playing with F: "Dont trumps hair look a bit too big now?" And, to keeping F's shape at about
85% of its size: "Yes, let's try that!" Keep F's shape as it is, the wave, the sweep to the far side, the grooves and
the gloss, and scale the whole mass to about 85%, so it sits on the head instead of towering over it, puffing past the
head less over the ears and behind; the face, the set-back front edge and both eyes as they are. Drawing only. The PR
shows F now beside F at 85% at a 390-pixel phone (true size and 3x) and desktop 2x, all four headings, and merges once
the render suite passes; if the owner then finds it still too big, or now too small, the size is one number to change.

Done: the whole mass, grooves, gloss and shadow with it, scaled by `WILD_SIZE` (0.85) about the wave's front (`WILD_FRONT`), so the front edge and the eyes stay put; `render/faces.js`.

### 2g. The meal goes down: a hungry snake fills out from the head (the owner, 29 October 2026; small, an art lane): done, PR #146

The owner (29 October 2026): "I notice snakes imidately become plump again when after eating while starving. I feel it
should be an animation where you see it transform to getting plump and its color back." And: "Yes, expertly!"

Today `hungerLook()` (`render/looks.js`) works out `slim` and `pale` afresh every frame from the hunger clock, so when a
hungry snake eats, the clock resets and it snaps back to plump and its own colour at once.
- **The meal travels down the body:** from the head, the body swells back segment by segment, as if the food were
  going down, and the colour floods back with it, over about 0.6 to 0.8 s (a first guess; judged by eye). Each
  segment eases from how slim and pale it was to how the new clock says it should be, so a meal that only partly
  refills the clock fills it out only that far. Eating again mid-swell starts a new wave from the head.
- **Every snake alike,** yours and the rivals', and the corpse rule unchanged (starved, it stays thin).
- **Reduced motion:** no travelling wave; the whole body eases back in a short plain fade.
- **Drawing only:** the hunger clock, the rules, the simulation's fingerprint and online play are unchanged (each
  player draws it from the same clock on their own machine).
- Pictures in the PR: a frame strip of a starving snake eating, at a 390-pixel phone and desktop.

Done in PR #146: a wave from the head, 0.7 s to the tail and three segments deep (`mealSwell` in `render/looks.js`),
the pale wash flooding back in steps (`drawPale`); with reduced motion, a 0.25 s fade. Meal seen as the clock's
`lastAte` rising, so it is the same online. Render check in `tools/render/08-hunger.js`.

### 2j. Babble voices for the chatter, never distracting (the owner, 29 October 2026; a sound lane): done, PR #162

The owner (29 October 2026): "And should the chat lines be voiced?" Then, to babble voices: "And make sure the voices
arent distracting! That would be a real turn off!"
- **Babble, not speech:** when a rival's bubble appears, a short synthesized burble in its own voice (pitch, timbre,
  rhythm: Mason clipped and deep, Gobbler gobbly, Ghost faint, and so on; Mute stays silent), made in `audio.js` with
  Web Audio, no recordings and no dependencies.
- **Never distracting, first of all:** well under the eating sound, at most about half a second whatever the line's
  length, never two at once, at most one every few seconds, never over your own sounds (eating, warnings, crashes), and
  quieter still in tight moments. Its own switch in the sound settings ("Voices").
- **The owner judges it:** the PR stays a draft until he has played its preview and says it isn't distracting; if he
  isn't sure, it ships switched off by default.
- Rivals only for now (your own snake's lines, from the teaching system, stay silent). Online, each player hears it on
  their own machine: no protocol change.

Done (PR #162): the `babble` cue in `audio.js`, a voice per rival but Mute (`BABBLERS`), under a seventh of your apple's pluck and half that in a tight spot, at most 0.5 s, one every 4 s at most, none within 0.7 s of your own sounds; the Voices switch under the board between rounds, V at any time, remembered as `barkbite-voices`, on by default. The owner (29 October 2026): "No, just merge them, then we will adjust if it is distracting." See "Rivals' babble" in `docs/design/21-sound.md`.

### 2k. The woodpecker, as big as it can get away with (the owner, 29 October 2026; small, an art lane): done, PR #170

The owner (29 October 2026): "I think the woodpecker should be even bigger". Then, when the design session asked for a
simulation check: "How should a visual change alter the actual game in any way?" It can't: the bird's size is one
drawing constant (`BU` in `render/bird.js`), while the rules peck by target cells (`game.woodpecker`), so no
simulation is run for it. And then: "Maybe make it as big as you can get away with without it falling out of the
screen, or being pushed onto the gameplay screen when not pecking, or anything."
- **The biggest that passes every check,** found by trying sizes up from 1.3, not guessed: one size wherever the screen
  has room for it, as 2c set, and on screens with less room the biggest each of its perches allows (the perches
  already shrink it, `PERCH_MIN_PX` and `PERCH_FLOOR_PX`; they keep doing so, from the new size).
- **The checks,** at a 390-pixel phone held upright and on its side, a tablet both ways and desktop: all of it stays on
  the screen, in every pose and flight (crouching, its tail, its wings open); perched, it never reaches onto the board,
  nor over the buttons' words or the chatter; drumming, it hides no food, no head and none of the tiles it is about to
  peck beyond what it hides at 1.3; and nothing else on the page moves to make room for it. The layout suite gets a
  test for each check, so a later change can't break them.
- The PR shows 1.3 beside the new size on each of those screens, perched, flying and drumming, says the size it found
  and what stopped it growing further, and merges once the render and layout suites pass.

Done (PR #170): 1.7 times its first size, one size wherever the screen has room (132 px on a 390×844 phone, from 101;
drumming 259 px on a 1280×800 laptop, from 198); at 1.8 an iPhone SE held upright no longer fits it whole under the
board. Drawing only: no simulation. See "The woodpecker, as big as it gets" in `docs/design/32-the-owners-playtest.md`.

### 2l. Flags that bend as a snake goes over them (the owner, 29 October 2026; small, an art lane beside 2k): done, PR #186

The owner (29 October 2026): "would be cool if the flags of sovereign and colonists bends away from a snakes body,
depending on direction it was hit when a part of a snake occupies its tile". Drawing only (`render/flags.js`), so no
simulation; online, each player draws it from the snakes they already have: no protocol change.
- **Pushed the way it was hit:** when any part of any snake lies on the tile of Sovereign's banner or a colony's flag,
  the pole bends over from its foot in the direction that snake was travelling as it came onto the tile (from the cell
  before it in the body to that one), so a snake going east pushes it east, and the cloth trails low behind it. It
  stays bent while the body lies on it, and bends the new way if another snake comes over it from another side.
- **Springs back:** once the tile is free, it swings upright with a short wobble that dies away, then flies as before.
  With reduced motion it simply leans while covered and stands up again, without the wobble.
- **One flag, one look:** it works with what flags already do (the banner's tilt as it's carried, its shake when
  pecked, a colony flag falling into its pit), never fighting them; the falling flag wins. The PR shows a snake
  crossing a banner and a colony flag from each side at a 390-pixel phone and desktop 2x (pictures and a short clip),
  and merges once the render suite passes.

Done (PR #186): bent flags are drawn over the snakes while they lean, and a north or south push also leans the flag out to its
cloth's side, so it shows beside the body. Drawing only: no simulation. See "Flags that bend under a snake" in
`docs/design/32-the-owners-playtest.md`.

### 2b. Hunger's worth at a contested apple, for every rival (the owner, 29 October 2026; an AI entry)

Done (PR #593): a meal is worth what it saves, for every rival, so a hungry rival contests an apple by its worth;
Gobbler's nerve is 0.5 at any hunger; Desperado fears heads less everywhere; hungry, Ghost keeps less of its distance
(#325); a line that has just eaten wants no spare room (#324). What it measured is in the PR; the rules are in
`docs/design/39-the-rivals.md`, "Nerve at a contested apple" and "A meal isn't a pin".
