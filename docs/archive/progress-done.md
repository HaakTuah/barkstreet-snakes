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
