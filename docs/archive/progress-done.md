# Progress: done

Done entries and answered "For Haakon" rows, moved word for word from `docs/PROGRESS.md` on 28 October 2026 to keep
it under the workshop check's 20 KB. New ones are added here as they are done or answered.

## For Haakon, answered

| Task | Question | Reading taken or suggested | State |
|---|---|---|---|
| Sniper's kill line | Which words, beside "One shot."? | Haakon (27 October 2026): "One shot, one whoppertunity" (queued under item 3) | Answered |
| Rival line-up | Online, the host's choice from the start card is used, but the lobby doesn't show it and can't change it. Should the lobby show the line-up, with the same seats to choose (the host only)? | Haakon (28 October 2026): "You figure all this out, expert. You know me by now." Claude decided yes, since online stays in step with local play: queued as "The lobby shows the line-up" | Answered |
| Rivals too shy of heads | Right at a contested apple, with the other head beside it, rivals still usually back off: about 1 in 8 of those cells would be a head-on, which costs about what the apple is worth. Should some personas (Desperado, Gobbler when starving, the hunters) take that gamble more often, as their own nerve? | Haakon (28 October 2026): "gobbler and Desperados should take the gamble more, that fits their playstyle, no?" Claude agreed: queued as "Nerve at a contested apple" | Answered |
| Wildcard's hair (1b+++) | Which one: A, B or C? ([PR #110](https://github.com/HaakTuah/barkstreet-snakes/pull/110), pictures side by side; A a small wave and short swirl, B a middle wave with the swirl carried round to the far side, C a big wave swept well out to the side) | Suggested: B; the draft waits for the pick | Answered 28 October: C's overall shape with B's smaller back, then one more pass so it reads as Trump's hair (1b+++ below) |
| Wildcard's hair, the new pass (1b+++) | Does the new pass ([PR #110](https://github.com/HaakTuah/barkstreet-snakes/pull/110), beside B and C) read as Trump's hair now, or should C go back in? | Taken: the new pass ships (merged); C comes back in one small PR if you prefer it | Answered 29 October ("Agree to all", to the design session's take: keep the new pass) |
| Nerve at a contested apple | Gobbler takes the gamble only once it's hungry (about 4 s left), which is rare, so in play its share of contested apples didn't move (17% both). Should a fed Gobbler gamble too? | Taken: no, as built ("the more the hungrier it is"); a fed Gobbler would need a nerve of about 0.9, near fearless (PR #92) | Answered 29 October 2026: a fed Gobbler contests too; every rival contests more as it starves; Desperado less risk-averse generally (entry 2b) |
| The woodpecker's size under the board (1b++) | Measured, it was already its board size under the board: 78 to 80 px tall on a 390 px phone, drumming on the board 78 to 85 ([PR #112](https://github.com/HaakTuah/barkstreet-snakes/pull/112)); what looks small is likely its slim side view beside the 44 px buttons, while on the board its wings are open. Should it be bigger, on the board and under it alike (say 1.3 times, so it covers more of the board as it drums), or bigger only under the board (then not one size)? | Taken: one size, as the entry says, so unchanged; it now clings to the buttons and pecks them. Suggested, if bigger: 1.3 times everywhere | Answered 29 October 2026: 1.3 times everywhere, one size (entry 2c) |
| Wildcard's hair, lacquered (2f) | Which one ships: D, E or F, or C, or keep the current? ([PR #144](https://github.com/HaakTuah/barkstreet-snakes/pull/144), all side by side at true phone size, 3x and desktop) | Suggested: E; the draft waits for the pick | Answered 29 October 2026: "Can't really see the difference between E and F, so you pick, expertly." The design session picked F; F shipped (PR #144) |
| 2d, rivals' chomps (PR #150) | While you watch after dying, sped up, rivals feeding on bead trails can chomp up to about five times a second (softly, 0.3 of your own chomp, one at a time). Busy, or fine? | Kept as is; if busy, a longer gap between rivals' chomps only while watching. | Answered 29 October 2026: "Yes to all, expertly!" Kept as is. |
| 2j (PR #162, draft) | Are the rivals' babble voices distracting? The preview needs Pages to serve `gh-pages`. Or reply "merge it off" to ship them switched off and judge them on the live game (Voices under the board, or V). | Built and tested as never distracting; on by default in the draft. If you're not sure, it ships off | Answered 29 October 2026: "No, just merge them, then we will adjust if it is distracting." Ship them on; adjust if they distract. |
| 2j (PR #162, draft) | Is the Voices switch in the right place: under the board beside the chatter's switch, between rounds only? (The header's sound buttons are full at 320 px, and in a round that row holds the help line.) | Under the board, between rounds; V at any time | Answered 29 October 2026: "Other than that, implement all you said, expertly!" Under the board, between rounds; V at any time. |
| 5, bridges (PR #174) | Bridges come up rarely in play: 0.05 rides a round in simulation, so riders and non-riders come out the same head to head. The rule works (rivals cross when it pays, and riding is riskier than not, so it's no refuge). Is rare what you want, or should bridges come up more (for example, longer bodies over wider pits late in sudden death)? | Kept as it is: a rare, skilful chance when the log is islands, as the design says ("for anyone quick enough"). | Answered 29 October 2026: "Agreed with you expert take!" Kept rare; re-measured once the golden flight (part 4: flights land on bridges) and the woodpecker's three acts (item 6: more pits) are in, adding no rule to make bridges commoner. |
| 2k (PR #170) | On a phone held upright the woodpecker perches over the speed buttons and the chatter, as you asked in 1b++; at 1.3 it already hid a button's label at some spots, and bigger it hides more of their words (taps still pass through it). Keep it so, or should it keep clear of their words (a smaller bird under the board, or perching only between the buttons)? | Kept as 1b++ has it: over the row and the chatter, taps passing through | Answered 29 October 2026: "Keep the bird 1.7x. And agreed with everything else." The bird stays 1.7 times everywhere; on a phone held upright it perches clear of the buttons' words where it can (between them, or over a gap), never by shrinking, and where no perch clears them at that size, the size wins (entry 2k+). |

## The queue, done

### 1. Cheaper development and playable previews: one PR, no subagents

The owner's words are in `docs/handoff/next-tasks-verbatim.md`, with their two additions and one correction:

- CLAUDE.md's "How to work". *Done on 26 October 2026 (PR #39).*
- DESIGN.md split into `docs/design/`, moved as it is. *Done on 26 October 2026 (PR #39).*
- render.js split into modules, fully: the seventeen files of `render/`, sharing one scope. *Done on 26 October 2026 (PR #41).*
- PR previews on Pages at `/pr-<n>/` (`.github/workflows/pages.yml`, from the gh-pages branch), with main at the root and `sw.js`
  keeping their caches apart. *Done on 26 October 2026 (PR #41).* Haakon must switch Pages to "Deploy from a branch:
  gh-pages, / (root)" (the PR says how).
- Sizes before and after, in the PR. *Done (PR #41).*

### 1b. The other big files, split the same way (recommended by Claude, 26 October 2026)

After render.js, split the other game files over about 100 KB into modules by responsibility, one PR each, by the
same rule as render.js: only with identical simulation results and the suites passing, and only the parts that split
cleanly. render.js's way may suit them too (see the top of `render/core.js`: plain scripts sharing one scope, loaded in
order; engine.js and ai.js are also loaded by the Node tools, which would need the new list). In order: snake.js (196 KB), chatter.js (154 KB), engine.js (113 KB), ai.js (109 KB), style.css (101 KB). Every
later task then reads a few small files instead of these. Haakon may veto it.

- snake.js into the seven files of `game/` (renames where its names met render/'s; `tools/scope-test.js` guards the shared
  scope). *Done on 27 October 2026 (PR #43).*
- chatter.js into the four files of `chatter/` (its lines, in English and Chinese, and the talk). *Done on 27 October 2026
  (PR #45).*
- engine.js and ai.js stay whole (decided 27 October 2026). ai.js's `decide()` alone is one 68 KB function: splitting it
  means restructuring its inner closures, not a clean split. The engine's internals in the page's shared scope could be
  reached by name from the AI's code, against "what the AI is shown (`aiView()` only)"; kept in its closure, they can't.
- style.css into the three stylesheets of `style/`, linked in the same order. *Done on 27 October 2026 (PR #46).* With it,
  item 1b is done.

### 1b+. Wildcard's hair, again (Haakon, 28 October 2026)

Haakon (28 October 2026): "Wildcard's hair still looks really weird. It flips to the front side, you know like a blond
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

### 1b+++. Wildcard's hair: Trump's hair, seen from above (Haakon, 28 October 2026; small, next, a UI lane beside the AI work)

Haakon (28 October 2026), on PR #107's pictures: "Also, looks like it is messing up wildcards hair again. But now by just
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
- **Three versions for Haakon to pick:** A, B and C, differing in the size of the front wave and how far the swirl goes
  to the side. The PR shows them side by side, all four headings, on the clear and storm boards, at phone size (true
  size and 3x) and desktop 2x, and asks Haakon in "Questions for Haakon" which one; it stays a draft until he answers,
  and the lane goes on with other work meanwhile. Only the chosen one ships: no option in the game, the others deleted.
- Art only, no rule changes: the render suite and its looks checks pass; reduced motion unchanged; no reviewer needed
  beyond the pictures and Haakon's pick.
- **Haakon's pick, and one more pass** (28 October 2026, on PR #110): "Agree to all, expertly. Though a bit hard to
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
  The PR shows C as it is beside the new pass, at the same sizes and boards, and asks Haakon again. If the new pass
  still does not read as his hair, Haakon chooses between them; the costume (the stars-and-stripes body, the red tie,
  the orange face) carries the rest.
  *Done on 28 October 2026 (PR #110): C's shape with B's smaller back, then the pass above; Haakon is asked again.*

### 1b++. The phone's bottom: the chatter, the controls and the woodpecker (Haakon, 28 October 2026)

Haakon (28 October 2026), with two screenshots from his phone ([the chatter open](https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/3a098b38f41f596834c3bd0fefc5c453eede2b1f/owner-2026-10-28-chat-open.jpg),
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

### 1c. The big test files, split (Haakon, 28 October 2026, the workshop check: next, before item 3's remaining entries)

Haakon (28 October 2026): "Yes please, sound good! Do it expertly for both!", to Claude's proposal that included moving
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

### 2c. The woodpecker, 1.3 times (Haakon, 29 October 2026; a layout lane)

Haakon (29 October 2026), "Agreed to all, expertly!", to the "For Haakon" question on its size and the design session's
take: **1.3 times its size, on the board and under it alike** (one size). Under the board it still clings to and pecks
the buttons. Since it covers more of the board as it drums, check with the simulation that round length, deaths by
cause and per-rival wins stay within noise; pictures at a 390-pixel phone and desktop, as for PR #112.

Done (PR #139): 1.3 times everywhere, one size wherever the screen has room (101 px on a 390×844 phone, from 78); the
simulation's fingerprints identical. See "The woodpecker, 1.3 times" in `docs/design/32-the-owners-playtest.md`.

### 2d. Rivals' chomps (Haakon, 29 October 2026; small, a sound lane)

Haakon (29 October 2026): "Yes, queue it. Feels strange that there is no sound, when your snake makes loud sound when
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

### 2e. The woodpecker pecks beside a snake, not on it (Haakon, 29 October 2026; small, an art lane after 2c, which draws the same bird)

Haakon (29 October 2026): "Looks a bit weird when the woodpecker pecks a tile with a snake tail on, and the snake isn't
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

### 2f. Wildcard's hair: lacquered, not a mop (Haakon, 29 October 2026; small, an art lane): done, PR #144, version F

Haakon (29 October 2026), on PR #110's hair as it plays: "Trump's hair looks like a mop now…" Then, to one more pass:
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
- **The test before the pictures go to Haakon:** a fresh helper (Haiku, given only the true-size and 3x crops of the
  versions, never this entry or the reference) is asked "describe this snake's hair in five words". A version passes
  if the answer reads as a swept, combed, glossy hairstyle, and fails on mop, straw, bun, bread, helmet or hat. Show
  only versions that pass.
- **Up to three versions that pass, side by side with C and the current hair,** at true phone size (390 px), phone 3x
  and desktop 2x, all four headings, clear and storm boards. **The PR stays a draft and does not merge until Haakon
  picks one** (#110 merged before his verdict; this one waits). Only his pick ships.
- Art only: the render suite and looks checks pass; reduced motion unchanged.

### 2f+. Wildcard's hair: F, a size smaller (Haakon, 29 October 2026; small, an art lane beside the new moves): done, PR #156

Haakon (29 October 2026), playing with F: "Dont trumps hair look a bit too big now?" And, to keeping F's shape at about
85% of its size: "Yes, let's try that!" Keep F's shape as it is, the wave, the sweep to the far side, the grooves and
the gloss, and scale the whole mass to about 85%, so it sits on the head instead of towering over it, puffing past the
head less over the ears and behind; the face, the set-back front edge and both eyes as they are. Drawing only. The PR
shows F now beside F at 85% at a 390-pixel phone (true size and 3x) and desktop 2x, all four headings, and merges once
the render suite passes; if Haakon then finds it still too big, or now too small, the size is one number to change.

Done: the whole mass, grooves, gloss and shadow with it, scaled by `WILD_SIZE` (0.85) about the wave's front (`WILD_FRONT`), so the front edge and the eyes stay put; `render/faces.js`.

### 2g. The meal goes down: a hungry snake fills out from the head (Haakon, 29 October 2026; small, an art lane): done, PR #146

Haakon (29 October 2026): "I notice snakes imidately become plump again when after eating while starving. I feel it
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

### 2j. Babble voices for the chatter, never distracting (Haakon, 29 October 2026; a sound lane): done, PR #162

Haakon (29 October 2026): "And should the chat lines be voiced?" Then, to babble voices: "And make sure the voices
arent distracting! That would be a real turn off!"
- **Babble, not speech:** when a rival's bubble appears, a short synthesized burble in its own voice (pitch, timbre,
  rhythm: Mason clipped and deep, Gobbler gobbly, Ghost faint, and so on; Mute stays silent), made in `audio.js` with
  Web Audio, no recordings and no dependencies.
- **Never distracting, first of all:** well under the eating sound, at most about half a second whatever the line's
  length, never two at once, at most one every few seconds, never over your own sounds (eating, warnings, crashes), and
  quieter still in tight moments. Its own switch in the sound settings ("Voices").
- **Haakon judges it:** the PR stays a draft until he has played its preview and says it isn't distracting; if he
  isn't sure, it ships switched off by default.
- Rivals only for now (your own snake's lines, from the teaching system, stay silent). Online, each player hears it on
  their own machine: no protocol change.

Done (PR #162): the `babble` cue in `audio.js`, a voice per rival but Mute (`BABBLERS`), under a seventh of your apple's pluck and half that in a tight spot, at most 0.5 s, one every 4 s at most, none within 0.7 s of your own sounds; the Voices switch under the board between rounds, V at any time, remembered as `barkbite-voices`, on by default. Haakon (29 October 2026): "No, just merge them, then we will adjust if it is distracting." See "Rivals' babble" in `docs/design/21-sound.md`.

### 2k. The woodpecker, as big as it can get away with (Haakon, 29 October 2026; small, an art lane): done, PR #170

Haakon (29 October 2026): "I think the woodpecker should be even bigger". Then, when the design session asked for a
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

### 2l. Flags that bend as a snake goes over them (Haakon, 29 October 2026; small, an art lane beside 2k): done, PR #186

Haakon (29 October 2026): "would be cool if the flags of sovereign and colonists bends away from a snakes body,
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

## Item 3, done

From "3. Fixes and polish (the owner's playtest of 2026-10-20)".

- **Burrows grow shut, not instantly.**
  - When a new burrow opens at the limit, the stalest starts closing over a seeded random time of about 6 to 14 s. So there are 3 burrows most of the time and briefly 4.
  - While closing, a beetle can still dive in, but none comes out.
  - The cue: the opening shrinks as sawdust creeps in from the rim and moss and bark grain grow over it. At the end comes today's plug and moss, then a faint scar.
  - It needs online sync (a protocol bump), the rivals reading it through the same rule, a rules test, and a Field guide line ("A burrow left unused grows shut.").
  - Escapes must stay at 20–35%.
  - *Done on 27 October 2026 (PR #49)*: see "Burrows grow shut" in `docs/design/32-the-owners-playtest.md`.
- **Burrows grow shut, evened out.** Haakon (27 October 2026): "Yes, you can try that and see if it adds to the game! Review it afterwards and make an expert call." ("That": the change spread evenly over its 6–14 s, bolder moss at phone size, a slightly stronger scar, and the Field guide line weighed.)
  - *Done on 27 October 2026 (PR #55)*: see "The cue, evened out" in `docs/design/32-the-owners-playtest.md`.
- **The outline glitch over a hole.** Over a pit, the body's round segments bulge above its line and its pale rim disappears.
  - Repro: `node docs/handoff/stage-bridge-glitch.js <repo> p390 390x844@3t bridge`, with shots in a `shots/` folder beside the script.
  - Suspect: render.js's bridging shrinks the radius (`sunk()`) in the two-pass `bodyFills`, but the bands and beads (`shadeBands`, `shadeUnder`) and the rim don't follow.
  - Add a render-test check.
  - *Done on 27 October 2026 (PR #52)*: see "A body over a pit, smooth" in `docs/design/32-the-owners-playtest.md`.
- **Rainbows upside down.** `drawRainbow` deliberately hangs the arch downward from an apple in the log's upper half.
  - Fix: always upright. For an apple in the upper half, use a great circle centred below the log (cy about 1.15 × the board, its top about 0.06 × the board from the top edge). It rises out of the apple, over, and down off the far side, with red outermost.
  - *Done on 27 October 2026 (PR #57; its top on the board from every apple, over and down to the far side, in the PR after it)*: see "Rainbows upright" in `docs/design/32-the-owners-playtest.md`.
- **Rainbows, the follow-ups** (left open by PR #61). Haakon (27 October 2026), on Claude's three recommendations: "And I agree, queue!" One PR, render only:
  - *Rounder over the middle.* From an apple near the middle the arch rises only about a cell, which barely reads as a rainbow. Move the circle's centre higher (today 1.15 boards below the top edge) so the arch from a mid-board apple rises clearly before it comes down; keep its top on the board and red outermost. This changes the numbers of "Rainbows upright": record the new ones there, with before/after pictures.
  - *The lower half, mirrored.* An apple low on the board near the middle can still show only the rising side. Give the lower half the same rule as the top: up out of the apple, over, and down toward the far side, with the render check's 12 apples extended to cover it.
  - *A render check that doesn't depend on order.* The choking check in `tools/render-test.js` passes or fails by how many boards earlier checks set up, since each moves the random seed along. Give each check its own seed so adding one can't break another.
  - Accepted as it is: for an apple in the top two rows, the outer red band runs partly off the top edge. A rainbow clipped by the edge looks natural.
  - *Done on 27 October 2026 (PR #68)*: see "Rainbows upright" in `docs/design/32-the-owners-playtest.md`.
- **Hunger where your eyes are.** On a wide desktop the tag's hunger bar goes unseen, and the owner starved.
  - Show hunger on every snake: the body slims as hunger grows, the head wobbles with growl lines in the last seconds, and a starving snake pales.
  - Measure a new player's starving rate before and after.
  - *Done on 27 October 2026 (PR #66)*: see "Hunger on the body" in `docs/design/32-the-owners-playtest.md`.
- **The phone gap.** On upright phones there's empty space between the board and the controls.
  - Put the speed/help row and the chatter right under the board.
  - The woodpecker perches at full size over that row, and taps pass through it.
  - The chatter is folded by default to a one-line strip of the newest line, and a tap opens it.
  - *Done on 27 October 2026 (PR #70)*: see "The phone gap" in `docs/design/32-the-owners-playtest.md`.
- **Desktop chatter.** Fill the column down to the board's bottom edge with as many whole lines as fit (today it stops at about 5). Older lines fade at the top, and you can scroll back.
  - *Done on 27 October 2026 (PR #72)*: see "Desktop chatter" in `docs/design/33-one-screen.md`.
- **A head-to-head mode in `tools/abtest.js`.** Haakon (27 October 2026): "Yes to all, expertly!" Old and new AI mixed in
  the same rounds on paired seats, which the optimization bar in `CLAUDE.md` calls for (the assistant's note of
  2026-10-18), and which the standing instruction "every new move is tested both ways" uses: rivals with a move and
  rivals without it on the same board. Before item 5, whose new moves need it.
  - *Done on 27 October 2026 (PR #80)*: `node tools/abtest.js [A] B --head-to-head` (built on `simulate.js --versus`;
    how it works, its rows and how fine it sees are in `tools/abtest.js`'s header). Given the same AI twice it comes out
    exactly even on every row; the A/A and known-difference runs are in the PR.
- **Hunters miss easy pins.** Haakon (26 October 2026): "it seems they try to box you, but often don't on really easy
  opportunities where they got you squeezed against the wall."
  - Stage pins: a snake against the edge with one way out and a hunter beside it. Every hunter should close it, unless
    closing it would kill the hunter.
  - Suspects: the hunter's own fear of being pinned against the edge (it has to go to the wall to close one), its
    safety margin, and how far ahead the squeeze looks.
  - A rules test per hunter. Trademarks and win bands kept, and the rivals close pins on anyone, never on you in
    particular.
  - *Done on 27 October 2026 (PR #81)*: see "Hunters close easy pins" in
    `docs/design/15-the-rivals-look-further-ahead.md` (the neck test reads the rivals on the line's own board; a pin
    the hunter closes isn't a pin on it). Missed easy pins 35 → 14 in 200 rounds. It found the root shared with the next
    entry: fear read off the board as it is now, not off the line played.
- **Rivals too shy of heads.** Haakon (27 October 2026): "it seems to me the rival snakes might be a bit too adverse to
  have their heads next to each other, even if the other snake can't cut you off, or if the would see and have time to
  react ahead of time. Can this be investigated, expertly?"
  Then (27 October 2026): "the snake game bug should be addressed, as it makes it so they seemingly always chicken out
  when competiting with you for resources. And also is just needlessly sub-optimal play, regardless of playstyle". So
  it comes first in the queue, with "Hunters miss easy pins" and, before both, the head-to-head mode their tests need.
  - Where to look: `ai.js`, the risk map around line 1020. Every cell beside a rival's head gets the full `headRisk`
    (500-2200 by persona), and the cells its dash, leap or flash could reach get half. That includes its own neck, cells
    where it would crash too (a head-on bounces both and costs each 3 segments: "Crashes, not deaths"), and cells I
    leave before it could get there. A rival in the next lane, running parallel, makes my straight-ahead cell look as
    dangerous as a real head-on.
  - Find out first, by staged boards and the census: how often rivals swerve away from a cell that was in fact safe
    (the rival couldn't, or wouldn't, take it), what that costs them (food lost, worse lines, boxing themselves in),
    and how often a real head-on happens.
  - Fix it by reading the rival better, not by lowering the weights ("Clever rivals, human reactions"):
    - risk only for cells it can enter;
    - less for a move that would crash it too, unless it is longer or reckless by persona;
    - none for a cell I'll have left before its reaction time lets it arrive;
    - each persona keeps its own nerve (Gobbler flinches, Desperado doesn't).
  - Kept: every trademark, the win bands, and head-on crashes no more common than noise; `tools/abtest.js` on fresh
    seeds, old against new. It may share a root with "Hunters miss easy pins" above (fear near walls and heads), so look
    at both together.
  - *Done on 28 October 2026 (PR #83)*: see "Rivals read heads better" in
    `docs/design/15-the-rivals-look-further-ahead.md`. Most swerves (56%) were from a rival's flash cells, which it
    almost never flashes into without food on its line; now feared only then (or with gold, or a hurdle to hop).
    Swerves 8.0 → 2.9 per 1,000 decisions, apples given up in one halved; head-on crashes, wins and trademarks within
    noise. Fearing the cells right beside a head less, in any of five ways tried, raised head-on crashes 10–30%, so
    that fear stays as each persona has it.
- **Nerve at a contested apple.** Haakon (28 October 2026), answering PR #83's question: "gobbler and Desperados
  should take the gamble more, that fits their playstyle, no?" Claude agreed: Desperado lives by skims and Gobbler by
  its food share, so at a contested apple with the other head beside it (a head-on about 1 time in 8, costing about
  what the apple is worth) both take the gamble more often: Desperado always more, Gobbler the more the hungrier it is.
  Each persona's own nerve, set where `headRisk` is read for the contested cell, never by lowering the risk map's
  reading; the hunters and the rest unchanged. Measured head to head (`tools/abtest.js --head-to-head`, fresh seeds):
  their apples won and head-ons taken, Desperado's skims and Gobbler's food share up or held, every other trademark,
  the win bands and head-on crashes overall within noise. AI planning, so high effort.
  - *Done on 28 October 2026 (PR #92):* `nerve` (Desperado 0.7; Gobbler 0.3 + 0.7 of its hunger; at most 0.85), over
    both the head-on and the zone fear where they are read for a food cell; see "Nerve at a contested apple" in
    `docs/design/15-the-rivals-look-further-ahead.md`.
- **Wildcard's hair.** Not a comb-over: his real swoop, a big fluffy golden-blond pompadour swept back, then forward and to one side. It must read at phone size.
  - *Done on 27 October 2026 (PR #74)*: see "Wildcard's hair" in `docs/design/32-the-owners-playtest.md`.
- **Copycat's face.**
  - While copying, the head mixes the copied colour about half and half with its red.
  - A thin red rim and the yellow star pin keep it Copycat. Uncopied, it stays full flag red.
  - *Done on 27 October 2026 (PR #78):* see "Copycat's face" in `docs/design/32-the-owners-playtest.md`.
- **Rival line-up.**
  - The pick isn't biased (3 uniformly from 18, with no memory between rounds).
  - Approved: a per-device shuffle deck, dealing all 18 before any repeat. Online, the host's deck decides.
  - Planned: choose your rivals. Each seat on the start card gets a swap button opening a picker of all 18 plus "Any".
    - "Any" seats come from the deck.
    - The choice is remembered under a NEW storage key.
    - Online, the host chooses.
    - Hall of Fame entries from chosen line-ups are marked "chosen".
  - *Done on 28 October 2026 (PR #86):* the deck (`snake-deck`) and the picker (`snake-lineup`), protocol 12; design in
    `docs/design/32-the-owners-playtest.md`, "The rival line-up".
- **The lobby shows the line-up.** The answer to the rival line-up's question (28 October 2026): online, the lobby
  shows the host's line-up from the start card, and the host (only) can change it there with the same seats to choose.
  - *Done on 28 October 2026 (PR #116):* protocol 13; design in `docs/design/32-the-owners-playtest.md`, "The rival
    line-up", *Online*.
- **Long names.** The 16-character cap already exists. When the "first out" banner doesn't fit, it drops the cause
  ("Gran is first out."), and the chatter keeps the full line.
  - *Done on 28 October 2026 (PR #118):* `opts.short`, used only on a phone held upright when the line is still cut
    at its smallest; design in `docs/design/30-teaching-by-showing.md`, *Phone words*.
- **Sniper's longer kill line.** Haakon's words (27 October 2026): "One shot, one whoppertunity". Add it to Sniper's
  kill lines in `chatter/voices.js` beside "One shot.", with its translation in each language file (as `chatter/zh.js`
  has "One shot."), keeping the pun where the language allows. It must fit the banner and the chatter strip on a phone.
  - *Done on 28 October 2026 (PR #120):* the Chinese is "一枪，一次粮机。", 粮 (food) slipped into 良机 (a golden
    opportunity), as "whopper" into "opportunity".
- **Mason's Caesar, the punchline and "Et tu" for everything.** Haakon (27 October 2026), on Claude's suggestion: "Yes,
  that would be quiet cool! Then it would show if they died from the edge, falling, or a mushroom also. Or lightning."
  - *The joke as his kill line.* Mason's kill line becomes "Vidi, vici, veni." (he saw, he conquered, then he came), and
    "Veni, vidi, vici." leaves his lines, so the proper version never spoils the punchline. "Veni, vidi, aedificavi."
    and "Veni, vidi, edi." stay.
  - *Last words that know what killed him.* Today a snake's last words know only a killer that is a snake ("Et tu,
    {who}?"); a death by anything else gets his plain lines. Give the last words the cause the engine already records
    (`cause` and `killer` on the crash), so Mason says "Et tu, …?" to whatever killed him: the edge ("Et tu, margo?"),
    a fall into a hole ("Et tu, fovea?"), fire ("Et tu, ignis?"), hunger ("Et tu, fames?"), the woodpecker ("Et tu,
    picus?"), a mushroom ("Et tu, fungus?"), lightning ("Et tu, Iuppiter?") and his own body ("Et… ego?", Haakon's pause, in Latin: "ego" is both "I" and what kills a wall-builder who bites himself),
    for whichever of these the game has.
  - *Every rival, the same way.* The cause is there for all eighteen, so each gets last words for the deaths it can
    have, in its own voice, where they are funny, and the chatter shows how they died. Translations in each language
    file; the lines fit the banner and the chatter strip on a phone.
  - *Done on 28 October 2026 (PR #122):* `diesBy` in `chatter/voices.js`, read by `deathBy` in `chatter/moments.js`:
    the edge, a hole, the woodpecker, hunger, fire and a snake's own body, for all eighteen, with their Chinese.
    Mushrooms only shrink, so none dies of one; every fire is lightning's, so Mason's fire lines are "Et tu, ignis?"
    and "Et tu, Iuppiter?". Design in `docs/design/09-voice-and-copy.md`, "Last words know what killed them".
- **Last words on phones.** Haakon (27 October 2026): "Yes to all, expertly!" On phones with no chatter panel, the
  round-ending snake's last words are lost, and at 390x664 the strip's line is cut with an ellipsis (from #34;
  `docs/archive/plan-history.md`). Show the last words whole where a phone player sees them, without crowding the board.
  - *Done on 28 October 2026 (PR #124):* where the log can't show them whole (no panel, or a folded strip), the round-ending
    snake's last words stay in their bubble where it went out, whole and unfaded, and the round's card waits their 2 s;
    a guest keeps them as they arrive after the round's end. Design in `docs/design/33-one-screen.md`, "Last words on
    phones"; checked by `tools/ui/07-last-words-on-phones.js`.

### 2k+. The woodpecker perches clear of the buttons' words, at 1.7 times (Haakon, 29 October 2026; small, an art lane): done, PR #191

Haakon (29 October 2026), to whether the bird should keep clear of the speed buttons' words on a phone held upright:
"Keep the bird 1.7x. And agreed with everything else." So it stays 1.7 times everywhere, and on a phone held upright
it chooses its perch over the row under the board so that no button's word is covered: between two buttons, or over a
gap or the chatter's empty end, still drumming and pecking the row as 1b++ has it. It never shrinks for this; where no
perch at that size clears every word, the size wins and it perches as now. The layout suite gets a test that no
button's label is covered where a clear perch exists; pictures at 390 and 320 pixels.

Done (PR #191): it takes the nearest perch whose box covers none of the row's labels (the speed buttons', the
switches', the speed's and the chatter's captions), at 390 and 320 px wide the gap between 4× and the switches; the
chatter's lines are left out, as they change every few seconds. Drawing only: no simulation. Layout part 15 tests it
at 390×844 and 320×640. See "Clear of the row's words (2k+)" in `docs/design/32-the-owners-playtest.md`.
