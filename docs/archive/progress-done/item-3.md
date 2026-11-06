# Progress: done

## Item 3, done

From "3. Fixes and polish (the owner's playtest of 2026-10-20)".

- **Burrows grow shut, not instantly.**
  - When a new burrow opens at the limit, the stalest starts closing over a seeded random time of about 6 to 14 s. So there are 3 burrows most of the time and briefly 4.
  - While closing, a beetle can still dive in, but none comes out.
  - The cue: the opening shrinks as sawdust creeps in from the rim and moss and bark grain grow over it. At the end comes today's plug and moss, then a faint scar.
  - It needs online sync (a protocol bump), the rivals reading it through the same rule, a rules test, and a Field guide line ("A burrow left unused grows shut.").
  - Escapes must stay at 20–35%.
  - *Done on 27 October 2026 (PR #49)*: see "Burrows grow shut" in `docs/design/32-the-owners-playtest.md`.
- **Burrows grow shut, evened out.** The owner (27 October 2026): "Yes, you can try that and see if it adds to the game! Review it afterwards and make an expert call." ("That": the change spread evenly over its 6–14 s, bolder moss at phone size, a slightly stronger scar, and the Field guide line weighed.)
  - *Done on 27 October 2026 (PR #55)*: see "The cue, evened out" in `docs/design/32-the-owners-playtest.md`.
- **The outline glitch over a hole.** Over a pit, the body's round segments bulge above its line and its pale rim disappears.
  - Repro: `node docs/handoff/stage-bridge-glitch.js <repo> p390 390x844@3t bridge`, with shots in a `shots/` folder beside the script.
  - Suspect: render.js's bridging shrinks the radius (`sunk()`) in the two-pass `bodyFills`, but the bands and beads (`shadeBands`, `shadeUnder`) and the rim don't follow.
  - Add a render-test check.
  - *Done on 27 October 2026 (PR #52)*: see "A body over a pit, smooth" in `docs/design/32-the-owners-playtest.md`.
- **Rainbows upside down.** `drawRainbow` deliberately hangs the arch downward from an apple in the log's upper half.
  - Fix: always upright. For an apple in the upper half, use a great circle centred below the log (cy about 1.15 × the board, its top about 0.06 × the board from the top edge). It rises out of the apple, over, and down off the far side, with red outermost.
  - *Done on 27 October 2026 (PR #57; its top on the board from every apple, over and down to the far side, in the PR after it)*: see "Rainbows upright" in `docs/design/32-the-owners-playtest.md`.
- **Rainbows, the follow-ups** (left open by PR #61). The owner (27 October 2026), on Claude's three recommendations: "And I agree, queue!" One PR, render only:
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
- **A head-to-head mode in `tools/abtest.js`.** The owner (27 October 2026): "Yes to all, expertly!" Old and new AI mixed in
  the same rounds on paired seats, which the optimization bar in `CLAUDE.md` calls for (the assistant's note of
  2026-10-18), and which the standing instruction "every new move is tested both ways" uses: rivals with a move and
  rivals without it on the same board. Before item 5, whose new moves need it.
  - *Done on 27 October 2026 (PR #80)*: `node tools/abtest.js [A] B --head-to-head` (built on `simulate.js --versus`;
    how it works, its rows and how fine it sees are in `tools/abtest.js`'s header). Given the same AI twice it comes out
    exactly even on every row; the A/A and known-difference runs are in the PR.
- **Hunters miss easy pins.** The owner (26 October 2026): "it seems they try to box you, but often don't on really easy
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
- **Rivals too shy of heads.** The owner (27 October 2026): "it seems to me the rival snakes might be a bit too adverse to
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
- **Nerve at a contested apple.** The owner (28 October 2026), answering PR #83's question: "gobbler and Desperados
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
- **Sniper's longer kill line.** The owner's words (27 October 2026): "One shot, one whoppertunity". Add it to Sniper's
  kill lines in `chatter/voices.js` beside "One shot.", with its translation in each language file (as `chatter/zh.js`
  has "One shot."), keeping the pun where the language allows. It must fit the banner and the chatter strip on a phone.
  - *Done on 28 October 2026 (PR #120):* the Chinese is "一枪，一次粮机。", 粮 (food) slipped into 良机 (a golden
    opportunity), as "whopper" into "opportunity".
- **Mason's Caesar, the punchline and "Et tu" for everything.** The owner (27 October 2026), on Claude's suggestion: "Yes,
  that would be quiet cool! Then it would show if they died from the edge, falling, or a mushroom also. Or lightning."
  - *The joke as his kill line.* Mason's kill line becomes "Vidi, vici, veni." (he saw, he conquered, then he came), and
    "Veni, vidi, vici." leaves his lines, so the proper version never spoils the punchline. "Veni, vidi, aedificavi."
    and "Veni, vidi, edi." stay.
  - *Last words that know what killed him.* Today a snake's last words know only a killer that is a snake ("Et tu,
    {who}?"); a death by anything else gets his plain lines. Give the last words the cause the engine already records
    (`cause` and `killer` on the crash), so Mason says "Et tu, …?" to whatever killed him: the edge ("Et tu, margo?"),
    a fall into a hole ("Et tu, fovea?"), fire ("Et tu, ignis?"), hunger ("Et tu, fames?"), the woodpecker ("Et tu,
    picus?"), a mushroom ("Et tu, fungus?"), lightning ("Et tu, Iuppiter?") and his own body ("Et… ego?", the owner's pause, in Latin: "ego" is both "I" and what kills a wall-builder who bites himself),
    for whichever of these the game has.
  - *Every rival, the same way.* The cause is there for all eighteen, so each gets last words for the deaths it can
    have, in its own voice, where they are funny, and the chatter shows how they died. Translations in each language
    file; the lines fit the banner and the chatter strip on a phone.
  - *Done on 28 October 2026 (PR #122):* `diesBy` in `chatter/voices.js`, read by `deathBy` in `chatter/moments.js`:
    the edge, a hole, the woodpecker, hunger, fire and a snake's own body, for all eighteen, with their Chinese.
    Mushrooms only shrink, so none dies of one; every fire is lightning's, so Mason's fire lines are "Et tu, ignis?"
    and "Et tu, Iuppiter?". Design in `docs/design/09-voice-and-copy.md`, "Last words know what killed them".
- **Last words on phones.** The owner (27 October 2026): "Yes to all, expertly!" On phones with no chatter panel, the
  round-ending snake's last words are lost, and at 390x664 the strip's line is cut with an ellipsis (from #34;
  `docs/archive/plan-history.md`). Show the last words whole where a phone player sees them, without crowding the board.
  - *Done on 28 October 2026 (PR #124):* where the log can't show them whole (no panel, or a folded strip), the round-ending
    snake's last words stay in their bubble where it went out, whole and unfaded, and the round's card waits their 2 s;
    a guest keeps them as they arrive after the round's end. Design in `docs/design/33-one-screen.md`, "Last words on
    phones"; checked by `tools/ui/07-last-words-on-phones.js`.

### 2k+. The woodpecker perches clear of the buttons' words, at 1.7 times (the owner, 29 October 2026; small, an art lane): done, PR #191

The owner (29 October 2026), to whether the bird should keep clear of the speed buttons' words on a phone held upright:
"Keep the bird 1.7x. And agreed with everything else." So it stays 1.7 times everywhere, and on a phone held upright
it chooses its perch over the row under the board so that no button's word is covered: between two buttons, or over a
gap or the chatter's empty end, still drumming and pecking the row as 1b++ has it. It never shrinks for this; where no
perch at that size clears every word, the size wins and it perches as now. The layout suite gets a test that no
button's label is covered where a clear perch exists; pictures at 390 and 320 pixels.

Done (PR #191): it takes the nearest perch whose box covers none of the row's labels (the speed buttons', the
switches', the speed's and the chatter's captions), at 390 and 320 px wide the gap between 4× and the switches; the
chatter's lines are left out, as they change every few seconds. Drawing only: no simulation. Layout part 15 tests it
at 390×844 and 320×640. See "Clear of the row's words (2k+)" in `docs/design/32-the-owners-playtest.md`.

### 2m. Beetles and the woodpecker (the owner, 29 October 2026; a small engine entry): done, PR #199

The owner (29 October 2026): "Beetles should quickly try to escape down their burrow when woodpecker targets their little
"island". And it seems almost no new burrows appear as the woodpecker destroy the old ones. Also, if the woodpecker
takes out the tiles under the beetles, they just teleport now." Three fixes, found in the code:
- **Burrows run out:** a pecked burrow becomes a hole and is gone, and new ones open only when a new beetle comes out or
  one digs in. But an underground beetle with no free burrow waits (`crawl`: `if (!b) continue`) until it expires,
  still counting toward `BEETLE_MAX`, so no new beetle comes out and no new burrow opens. Fix: an underground beetle
  with no free burrow cracks a new one open where it's quiet, by the rule `beetleOut` uses (`BURROW_SPACING`,
  `BURROW_MAX`), so burrows keep up with the woodpecker, on the islands that remain.
- **They flee the beak:** the woodpecker's target is shown ahead (its rings), so a beetle on a targeted patch, or with
  one between it and safety, treats it as danger as it treats a head: it scurries for a burrow within reach and dives
  in, else off the patch, else digs in (a dig there is underground before the strike, and comes up elsewhere).
- **No teleporting:** today a beetle still on a pecked cell is moved to a landing cell at once (`knocks`, then `f.x =
  to.x`). Instead, a beetle still under the beak when it strikes is eaten by the woodpecker, a gulp, as woodpeckers do
  (the bird already eats food with nowhere to go); it had the rings' warning to run.
- The rivals see beetles flee the beak and plan their chase with it; the census counts burrows open over a round,
  beetles eaten by the bird, and escapes, before and after. Its lesson: the first time, "The woodpecker eats beetles
  too!", with a Field guide line under Beetles.

### 2o. A squashed bead leaves a splat (30 October 2026; small, an art lane): done, PR #210

The owner: "splashing looks like eating. Should leave behind squashed beads in my opinion". A bead squashed under your
own head ("Squashed the second time" in `docs/design/27-round-six-a-fairness-and-fixes.md`) shows no gulp, no growth
pulse and no eating sound: it leaves a flat splat in the bead's own colours, a little wider than the bead, fading over
about 3 s, with a soft splat sound; with reduced motion it simply fades. Drawing and sound only, from the event the
engine already sends: no simulation, no protocol change.

Done (PR #210): the spray of crumbs and the "Splat!" over your head are gone; a flat splat in the bead's main colour,
with a darker rim, a sheen and a few drops, lies where it was and fades over 3 s (with reduced motion it doesn't
spread). The sound is the soft splat it had. See "*The cue:*" under "Squashed the second time" in
`docs/design/27-round-six-a-fairness-and-fixes.md`.

### 2p. Flags in depth, hit head-on, and bent by their owners (30 October 2026; small, an art lane after 2l): done, PR #211

The owner: "the flag bends now. But i would like to give it some perspective also. So people that pass behind it, dont
show up in front of it. They should be behind it. Also, it doesn't quiet know what to do when a snake hits it dead on,
so that must be accounted for. And it should also react to soverign and colonists hitting it." In `render/flags.js`
(2l, "Flags that bend under a snake" in `docs/design/32-the-owners-playtest.md`):
- **In depth:** the pole and cloth rise above their tile, so anything on the cells the flag stands in front of (the
  row above it on screen) is drawn behind the cloth, and anything in front of it over it, as one sorts things by how
  far down the screen they stand.
- **Head-on:** a snake that comes onto the flag's tile straight at the pole (no sideways direction to push) bends it
  flat ahead of the head, the cloth wrapping round the head for a moment, then trailing under the body; it springs
  back as 2l does.
- **Everyone bends it,** Sovereign and Colonist over their own flags included.
Pictures at 390 px and desktop 2x; the render suite; no simulation, no protocol change.

Done (PR #211): every flag is drawn over the snakes, upper rows first, cut away over the snakes on the row in front;
a head from the north or the south knocks it flat, its cloth wrapped round the head for 260 ms, then under the body;
owners already bent their own (now tested). See "Flags in depth, hit head-on (2p)" in
`docs/design/32-the-owners-playtest.md`.

### 2t. Capricious without its ring, and a costume change for every change (30 October 2026; small, an art lane): done, PR #212

The owner: "i think now that capricious is always pink, it doesnt need that weird border effect around its head anymore.
Agreed? Though it maybe should be more apparent when it transforms, like an coded animation that works for all of
them, or something?", and to the design session's take: "Agreed to both, expertly!". In `render/bodies.js`:
- **The ring goes:** the breathing pink ring with pale dashes round Capricious's head (it kept Capricious findable
  while its body changed with its mood; the pink coat does that now), and the ring that flashes out on a mood change.
- **A costume change instead,** one animation for every mood: a quick pink puff round the head, the old costume popping
  off and the new one popping on, about half a second; with reduced motion a plain crossfade.
- **Copycat the same way** when it takes on a new model, in its own red, so the rivals who change read alike.
Drawing only, from what each player already has (the mood and the model): no simulation, no protocol change. Pictures
of each mood's change and Copycat's at 390 px and desktop 2x; the render suite.

Done (PR #212): the breathing ring and the ring flashing out are gone; every change of Capricious's mood and of
Copycat's model is one 500 ms costume change (a puff round the head in its pink or red, the old face and head colour
popping off, the new one popping on; with reduced motion a crossfade). See "A costume change (2t)" in
`docs/design/35-capricious-copycat-and-wildcard.md`.


