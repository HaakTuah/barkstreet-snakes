# Progress

What is done and what comes next, in order (how to work through it: `CLAUDE.md`). Mark an item done here, with its PR,
when it is merged into `develop`; add Haakon's new tasks where he places them, with his words quoted.

## State

The first open entry below is next. The older state notes (27 October 2026) are in `docs/archive/plan-history.md`.

## For Haakon

Every open question for Haakon, until he answers it ("Questions come back to Haakon directly" under "Standing
instructions" in `CLAUDE.md`). Each task's last message and each milestone PR open with the same list. Answered rows: `docs/archive/progress-done.md`, "For Haakon, answered".

| Task | Question | Reading taken or suggested | State |
|---|---|---|---|
| 2n (PR #208) | Wildcard's new hair (the original pompadour, its front lifting off the brow and sweeping up and back to a flick; pictures in PR #208): yes, or what to change? | Suggested: yes, merge it as is. The PR waits for his yes. | open |

## The queue, in order

**Done** (each in `docs/archive/progress-done.md`): 1 and 1b (cheaper development and previews (PRs #39, #41), the big files split (PRs #43, #45, #46)); 1b+ (Wildcard's hair, again (PR #107)); 1b+++ (Wildcard's hair, Trump's (PR #110)); 1b++ (the phone's bottom (PR #112)); 1c (the big test files split (PRs #95, #96, #97, #100, #102, #103, #104)); 2 (types for the multiplayer messages (PR #48)); 2c (the woodpecker, 1.3 times (PR #139)); 2d (rivals' chomps (PR #150)); 2e (the woodpecker pecks beside a snake, not on it (PR #141)); 2f (Wildcard's hair, lacquered (PR #144, version F)); 2f+ (Wildcard's hair, a size smaller (PR #156, `WILD_SIZE` 0.85)); 2g (the meal goes down (PR #146)); 2j (babble voices for the rivals' bubbles, never distracting (PR #162; on by default, the Voices switch under the board between rounds, V at any time)); 2k (the woodpecker, as big as it gets, 1.7 times (PR #170)); 2k+ (the woodpecker perches clear of the buttons' words, at 1.7 times (PR #191)); 2l (flags that bend as a snake goes over them (PR #186)); 2m (beetles and the woodpecker (PR #199: burrows keep up, beetles flee the beak, the bird eats one still under it)).

### 5. Round six B: the new moves (DESIGN "Round six B"); next AI entry, right after Copycat's part of 3b

Moved up by Haakon (29 October 2026): "It's the one I am most interested in playing, and it has been pushed back for a
long time now. Also, the teaching system will have to account for it." It is the next AI entry once Copycat's part of
3b (PR #142) merges, ahead of Wildcard's part of 3b, 2b, 2h, 2i and 3c; the art and sound lanes (2d, 2f, 2j) run
beside it as before. A playable draft PR as early as it can be, so Haakon can try it this evening.

*Done so far:* **the island hop** and **no auto-jump** (PR #158: a jump goes over up to 3 cells, a cell a tick; a press waits 5 moves; the landing ring; protocol 16); **mushrooms come back up** (part 3b, PR #195: the cheek, the ring 3 ahead, the spit, a shade stronger each time to 5; the rivals aim, dodge and eat one for a shot in their styles; protocol 19; its numbers and the design finding in the design's "Part 3b, the chosen numbers").

*Where it stands* (29 October 2026; it paused at the app's weekly usage warning, which is not the brake: Haakon, "They
weren't supposed to stop before 90%. We're still at only 76%", so it carries on): parts 1, 2 and
most of 3 are merged (#158, #174, #183: the cuts, a failed flash, your own beads squashed, Mason's double walls, the
edge measured). **Next, in order:** part 4 (*under way* on `round6b/golden-flight`, pushed, no PR yet: leap now, the
golden flight held and steered, bumps in the air and down on a body out, protocol 20, input, lessons, rules tests,
the rivals weighing leap now and how far to fly; first look, 40 rounds on seed 5: rivals leap now 24 times a round,
golden flights 3.8 cells in the air, 0.65 snakes a round come down on a body; still to do: merge `develop` into it,
its draft PR, the A/B both ways (a copy that never leaps now nor flies past the plain hop), check leap now for a
refuge, rivals' tests for both moves, the rivals steering in the air, bridge rides re-measured, and **no hop onto a
doomed island** (2r)); then 2q (rivals notice like people), 2s (the log never drifts apart), part 3b+ (the spit
flies along the line, the spitter sliding over its own), then part 5, part 6 (*built and reviewed* on `round6b/dropped-charges`: merge `develop` into it, renumber
its protocol after part 4's 20, run its A/B), and part 7 (*parked* on `round6b/pricing`; part 3's numbers to watch there: Joker
and Sovereign low on single seeds, Gobbler's and Vulture's shares a little lower). Mason's double walls are kept
(Haakon, 29 October 2026).

- **The island hop comes first.** The owner: "jumping is pretty critical to making this game more tense and skill based, rather than RNG". There are two test cases:
  - Gobbler folded on a strip;
  - `docs/handoff/owner-sniper-islands.jpg`: Sniper won coiled on a strip, beside islands of beads across gaps of 1 to 3 cells.
- **No auto-jump** (the owner agreed). A press stays armed until a hurdle 4–5 cells ahead is reached (`LEAP_WINDOW` is 3 ticks today), for rivals too. The landing ring shows where you'd land, and it gives no trap warnings.
- **One pricing model for every power:**
  - gain is searched from where the power ends, plus a tempo credit for flashes and the island reached for jumps;
  - the tail tip is priced at what length is worth now (cheap late in the round);
  - an idle power gets cheaper, with a floor kept for a way out;
  - risk is a failed flash (about 5 segments and a longer stun) or a bump in the air, weighed by each rival's nature;
  - not a junkie like Star, and not hoarding.
  - Caution: at a flat 1-apple price, rivals flashed 3 times a minute and did no better. Judge it by the seat-split A/B.
- **Dropped charges:** not on every bump. On a knockout, the charges spill where the head fell as a golden pickup anyone can grab.
- **Bridges:** as in DESIGN. Crawl on where the body crosses the rim, or land on it from a jump where it will still be there.
- The earlier start on jumps is `docs/handoff/jumps-wip-unverified.patch` (on f338275). It's unverified; redo it or check it first.

**Every move of the round, in this order** (Haakon, 29 October 2026, when the design session found the entry listed only
part of "Round six B": "Yes, they are all part of the power update! What i have been looking forwards to!"). Each part
is its own playable PR, tested both ways (`tools/abtest.js`) with every trademark measured, as the island hop was; the
design's words for each are in `docs/design/29-round-six-b-the-new-moves.md`:
1. **The island hop and no auto-jump** (done, PR #158).
2. **Bridges** (done, PR #174). Rare by design, about one ride in twenty rounds (Haakon, 29 October 2026: "Agreed with
   you expert take!"): part 4 and item 6 each report bridge rides again, adding no rule to make them commoner.
3. **The flashes cut** (the edge shelters a body from cuts, measured for a refuge: "The edge is a shelter, measured"): the plain flash through a body one thick, the golden through two (and fire out), and a cut
   that leaves a snake fewer than 3 segments puts it out ("The neck cut"; a flash into a head is a failed flash);
   your own beads squashed as your head passes, the choke, cough and nudge gone ("Choking on your own tail", replaced by
   the owner, in `docs/design/27-round-six-a-fairness-and-fixes.md`); and **mushrooms come back up**: aimed by steering,
   spat 3 cells ahead after a second in the cheek, a hit on a head poisoning that snake, a shade stronger each time (3
   to 5), never killing by itself ("Mushrooms come back up" in the design); a failed flash
   costs 5 and a longer stun, its rest 10 to 12 s; **dropping your own tail** by the same cut; and **Mason's double
   walls**, since a wall one thick can now be cut (its straight runs measured before and after).
   *Done* (PR #183): the cuts (plain, golden through two, the neck cut, your own tail), a failed flash (5 and a stun
   of 6), the rest at 12 s, your own beads squashed, Mason's double walls, and the edge measured (no refuge); its
   numbers are in the design's "Part 3, the chosen numbers". *Next:* **mushrooms come back up**, in its own PR (3b),
   before part 4.
   **3b+. The spit flies along the line** (Haakon, 30 October 2026: "3. Agreed, do it expertly!"; the design's
   "The spit flies along the line"): straight ahead up to 5 cells, two a tick, stopping at the first head (poisoned) or
   body (bounced by the roll rule), gone over the edge or a hole; a dotted line in place of the ring; the rivals lead
   their shots and step out of lines; the A/B should now show the spitters ahead, no refuge; lesson, cue, protocol
   bump. **The spitter slides over its own mushroom** for a few moves (`OWN_SPIT_TICKS`, a first guess of 6), as a full
   mouth slides over food, so it can't swallow it again: today the spit lands 3 straight ahead and a snake that keeps
   going eats it 3 moves later, shrinks again and has a full mouth again, a loop that cost Haakon several apples (his playtest, 30 October 2026); everyone else is hit by it as before. It runs after part 4, 2q and 2s, before part 5 (rule and AI
   changes run one at a time; 2q first, so 3b+'s A/B measures dodging with human reactions).
4. **The golden jump flies:** hold to fly up to 5 cells, steer in the air, the gold ring where you'd come down; with
   **leap now** (a second press while a jump waits sends it at once, open ground included: "Leap now" in the design); with
   **bumps in the air** (a crash's cost, and you drop where you are: over fire you catch alight too, over a hole you
   fall in, onto a snake you're out, trapped).
5. **Gold portals for the wrap:** anyone may follow through for about a second after your body passes.
6. **Dropped charges** on a knockout, as above. *Built and reviewed* on `round6b/dropped-charges` (a spilled gold coin ringed with the pips; rules tests; review fixes in; protocol to renumber when it merges); still to do: the A/B against rivals that ignore spills (a copy is easy: zero the spill's worth in `ai.js`), pictures, the PR.
7. **One pricing model for every power,** as above, last (*a first pass is parked* on `round6b/pricing`: the tail tip at length's worth now, rests cheaper while idle with a floor, risk by `headRisk`; on seeds 51/53 the seat-split already shows powers on beating off, 33.6% to 16.4%, with the island hop alone, and this pass did no better, 33.3% to 16.7%, flashing more; a direct head-to-head against today's AI was stopped at look 4, its rounds cached), so it prices every move together, with **each rival's power
   style** ("Every rival has a power style"); the design's "Balance targets" are its measure.
Then the teaching system (item 4), which teaches all of them.

**The rivals learn every move in its own part** (Haakon, 29 October 2026: "And very important that the commin ai is
updated to understand all these rule changes to maximize they use of all the playrules!!!"). No part merges until the
rivals use its moves when they pay and in their own styles, and see them used against them: hop, ride a bridge, cut,
neck-cut, drop a tail, fly and steer, leap now, take a landing, follow a portal, grab dropped charges, and keep clear of
each danger (a landing ring, a flash's line, a bridge's tail end). Rules tests prove each one through the same engine
calls as a person's, and the head-to-head shows the users ahead ("No ability only people use", "every new move is
tested both ways"); the pricing part then makes the choices among them as good as they can be.

### 2n. Wildcard's hair: every version side by side, Haakon picks (30 October 2026; small, an art lane)

Haakon: "trump looks like David Lynch now. I actually think the very first or second hairstyle trump had in the game is
better than what he has right now". Draw Wildcard's head as each version has had it, side by side at the same size and
heading. The design session made [the picture](https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/2b0f035452522c107030f31987ee78fdb7eaf97e/design-wildcard-hair-versions.jpg) from the PRs' own pictures (30 October 2026): 1 the
original, 2 PR #107's two blobs, 3 and 4 PR #110's B and C (never shipped), 5 PR #110 as shipped (the "mop"), 6 PR #144's
F, 7 PR #156's F at 85% (now). **Haakon's pick: the original, its swirl turned up** (30 October 2026: "What if we took
the original, but have the swirl point upwards instead of downwards?", then "Yes, please, expertly please!"). Bring back
the original from `render/` at a79946b (PR #107's "before": the fluffy pompadour, its strands and outline), with one
change: the swoop at the front no longer curls forward and down over the brow; it lifts off the forehead and sweeps up
and back over the crown, as Trump's front does, its tip flicking out to one side so that from straight above it reads
as a swoop, not a bun or a turban. Both eyes show in all four headings. The PR shows before (today's F at 85%), the
original and the new one in all four headings at 390 px and desktop 2x, and **merges only once Haakon has seen it and
said yes** (drawing only: no simulation, no protocol change).

### 2o. A squashed bead leaves a splat (30 October 2026; small, an art lane)

Haakon: "splashing looks like eating. Should leave behind squashed beads in my opinion". A bead squashed under your
own head ("Squashed the second time" in `docs/design/27-round-six-a-fairness-and-fixes.md`) shows no gulp, no growth
pulse and no eating sound: it leaves a flat splat in the bead's own colours, a little wider than the bead, fading over
about 3 s, with a soft splat sound; with reduced motion it simply fades. Drawing and sound only, from the event the
engine already sends: no simulation, no protocol change.

### 2p. Flags in depth, hit head-on, and bent by their owners (30 October 2026; small, an art lane after 2l)

Haakon: "the flag bends now. But i would like to give it some perspective also. So people that pass behind it, dont
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

### 2q. Rivals notice like people (30 October 2026; an AI entry, after part 4)

Haakon: "do the snakes have a bit too good reaction time? [...] Just seems they play a bit too well in that regard
perhaps", and to the take that what is superhuman is not the 240 ms but seeing the whole board at once: "Agreed to
all!". Every rival's view of another snake is as old as a person's notice of it would be: `REACTION_MS` (240) near its
own head, growing with distance to about 400 ms across the board (`REACTION_FAR_MS`, first guesses), with a little
variation from moment to moment, so near things are seen at once and far ones a beat late, as a person sees them
("Clever rivals, human reactions"; the AI still plans as far ahead as before). Online the same. Measured before and
after: per-persona win rates, every trademark and the feel numbers within noise or explained, through
`tools/abtest.js` on fresh seeds; the PR shows the table.

### 2r. No hop onto a doomed island (30 October 2026; part of item 5's part 4)

Haakon: "I see snakes jumping onto small islands where they have no chance to survive for very long". Before a hop or
a flight, a rival weighs where it lands: the island's free room against its own length, the food on it, and above all
**whether it can jump off again** (Haakon, 30 October 2026: "don't forget a snake must account for if it can jump off
the island again if it picks to jump there!"): another piece of log within a hop of the island, and room to live on
it until its jump's rest is over, and from where on the island its head can take that hop; a landing it can't live on scores as the death it is, unless staying
is worse. A rules test sets up the case (a long snake beside a small island and a bigger one in reach), and part 4's
A/B reports hops onto islands too small to live on, before and after.

### 2s. The log breaks, but never drifts apart (30 October 2026; an engine-rules entry, after 2q)

Haakon: "I still see the situation arise where 2 islands form at the opposite ends, and the snakes are trapped on
each, so the one on the bigger one wins", and to the take that a jump across any gap would be a refuge: "Agreed to
all!". The woodpecker never pecks a patch that would leave a piece of the log out of a plain hop's reach (`LEAP_REACH`,
3 cells) of every other piece: it picks another patch, as it does for crumbs ("No crumbs" in "The woodpecker plays
fair"). So the log can break into islands, but every island stays a hop from another, and the end stays a fight.
Measured: rounds whose last snakes are each alone on an island they can't leave (25-31% today, "Last snakes on
islands of their own"), the biggest island's wins, round length and sudden-death deaths, before and after; the
woodpecker's mark still shows each patch before it goes. Online the same, with a protocol bump if the mark changes.

### 2t. Capricious without its ring, and a costume change for every change (30 October 2026; small, an art lane)

Haakon: "i think now that capricious is always pink, it doesnt need that weird border effect around its head anymore.
Agreed? Though it maybe should be more apparent when it transforms, like an coded animation that works for all of
them, or something?", and to the design session's take: "Agreed to both, expertly!". In `render/bodies.js`:
- **The ring goes:** the breathing pink ring with pale dashes round Capricious's head (it kept Capricious findable
  while its body changed with its mood; the pink coat does that now), and the ring that flashes out on a mood change.
- **A costume change instead,** one animation for every mood: a quick pink puff round the head, the old costume popping
  off and the new one popping on, about half a second; with reduced motion a plain crossfade.
- **Copycat the same way** when it takes on a new model, in its own red, so the rivals who change read alike.
Drawing only, from what each player already has (the mood and the model): no simulation, no protocol change. Pictures
of each mood's change and Copycat's at 390 px and desktop 2x; the render suite.

### 2u. Picked rivals for this visit; unmet rivals back into the deck (30 October 2026; small, a UI lane)

Haakon asked why the same cast showed up each time he started the game, then: "I might've picked them yes. Didn't
expect them to stay permanently", and to the design session's takes: "Agreed to all!". In `records.js` and the start
card (`game/round.js`, `game/hud.js`):
- **A picked seat lasts this visit,** round after round, and the next time the game is opened every seat is "Any"
  again (kept in `sessionStorage`, not `localStorage`; the storage key `LINEUP_KEY` keeps its name and is simply no longer
  read, per "Never rename"). A picked seat shows a small pin on the start card, and one tap on the pin sets it back to
  "Any".
- **Rivals dealt but never met** (the page closed or reloaded on the start card) go back into the deck at a random place
  among the rivals not yet dealt, not on top (`Records.undeal`): everyone is still met before anyone comes round again,
  but opening the game gives a fresh cast.
Online is unchanged (the host deals). The UI suite: a pick lasts across rounds and is gone in a new visit; a pin
clears; an undealt rival is not dealt first every time (a seeded test).

### 2b. Hunger's worth at a contested apple, for every rival (Haakon, 29 October 2026; an AI entry)

Haakon (29 October 2026), on the "For Haakon" question whether a fed Gobbler should gamble too: "Agreed to all,
expertly! Shouldn't the others contest apples more if they're hungry? They're worth more than, because usually apples
just gove you plus 1, but if you are starving, they give you 1 and save you 1, so become plus 2? But yes, gobbler should
contest it regardless. And Desperados being an adrenalin junkie, should generally be less risk averse?"

Today hunger already makes every rival look for food harder (`foodW0`, `eatW0` in `decide()`), but only Gobbler and
Desperado set aside any of a rival's threat at a contested apple (`w.nerve`), so a starving rival still backs off an
apple it needs. Build it from the cause, in the one template every rival shares:
- **An apple is worth what it saves.** For every rival, a contested apple's worth counts the length it adds and, when
  the rival is starving or close to it, the length it stops it losing: about one more, as Haakon says, and more as the
  hunger clock runs down. The planner weighs that against the head-on risk as it reads it, so a starving rival contests
  because the apple is worth more, not because of a special rule. Each rival's own weights still shape it: the cautious
  ones (Ghost) still give way sooner than the bold.
- **Gobbler contests even when fed:** a moderate nerve at any hunger, rising with it to the cap (today's 0.85), since
  "eats everything, even a rival's apple" is its character.
- **Desperado is less risk-averse everywhere,** not only at food: a lower fear of rivals' heads and of where they might
  be, as an adrenaline junkie's; its skims stay its trademark.
- **Measured** with `tools/abtest.js` on fresh seeds, against today's AI: per rival, the share of contested apples won,
  deaths head-on, starving deaths and length lost to hunger, and wins; every trademark within noise, except the two
  meant to move (Gobbler's food share up; Desperado's skims and risks up, its survival not collapsing). "No refuges" and
  "Clever rivals, human reactions" stand: better choices, never faster reactions.

### Fix. Done: the layout suite's screen-awake checks no longer hang on the machine's speed (PR #161): the section holds the round's loop still, so your snake can't crash on its own between steps on a slow machine. (`scripts/test.sh` exits 1 on a failure; piped through `tail`, use `set -o pipefail`.)

### 2h. The endgame: eat what keeps you alive, not what boxes you in (Haakon, 29 October 2026; an AI entry, after 2b)

Haakon (29 October 2026): "snakes should maybe avoid food more with the woodpecker about? I see snakes gorging on the
remains of other snakes, when they have only a few tiles left to move on. They are not doing a context relevant tradeoff
calculation there, clearly." And: "But sometimes starving still lasts you longer than increased length will, with so
little room also."

Today `decide()` sets `lean` once sudden death begins ("nobody can afford to be picky"), so food counts in full however
little room is left, and rivals grow into the space they need to turn in. The trade-off, for every rival through the
shared template:
- **A meal is worth the life it buys, against the room it costs.** Weigh how long the snake lasts each way: starving,
  it shrinks a segment every 1.5 s and frees room as it goes; eating, it gets a meal's time but grows into its pocket.
  It eats when hunger would end it before room would, and leaves the food when the length would box it in first. With
  room to spare, food counts as today.
- **Personality still shapes it:** Gobbler stays the greediest (its food share is its trademark), the careful ones
  the most sparing.
- **Measured** head to head on fresh seeds against the AI 2b leaves: deaths in sudden death by cause (self, body, boxed
  in, starved), who outlasts whom in the endgame, per-rival wins, every trademark within noise.

### 2i. Food seasons: lean, normal and plentiful rounds (Haakon, 29 October 2026; an engine-rules entry, after 2h)

Haakon (29 October 2026): "I think it should be a but more agressive. Someone should at least die from it once in a
blue moon. Now games maybe feel a bit too samey? It's pretty predictable. But if food levels varied more, that would
change things up."

Starving is 1 to 3% of deaths (round four's measure, `docs/design/25-round-four-measured.md`), so a snake almost never
starves, and rounds feel alike. Each round draws its **food season**, as it draws its weather:
- **Lean:** apples and beetles come more sparsely, so hunger bites and a snake starves now and then. **Normal:** as
  today. **Plentiful:** more food, snakes grow long, and the danger is crowding. First guesses for the odds (lean 1 in
  4, normal 1 in 2, plentiful 1 in 4) and the rates, set by measuring and left to tuning.
- **Seen and taught:** a start banner names it ("A lean season…", "A season of plenty…"), with a one-time lesson and a
  Field guide row ("Every new rule needs a visible cue and a lesson"). Everyone, rivals included, sees the season, as
  they see the weather (`aiView()`), and the rivals play it: sparing and hungry-minded in a lean round, wary of
  crowding in a plentiful one.
- **Measured:** starving reaches about 5 to 8% of deaths overall, more in lean rounds; the spread of round lengths and
  of deaths by cause widens, per season; per-rival wins within noise overall; every trademark kept; no refuges.
- **Online:** the host draws the season and sends it; a protocol bump.

### 3. Fixes and polish (the owner's playtest of 2026-10-20)

Its done entries (PRs #49 to #124) are in `docs/archive/progress-done.md`, "Item 3, done".

### 3b. The rivals who change: Capricious, Copycat and Wildcard (Wildcard's part after 5)

*Capricious done (PR #126), Copycat done (PR #142), 29 October 2026; the readings are in the design file.* **Wildcard's
part waits** (after 5), built on the branch `wildcard-shows-its-mix`: two or three traits a round from eight (`TRAITS`
in `ai.js`), its tag's note ("This round: hungry, reckless and hunts"), a brag as its first line (with its Chinese), a
Field guide row, protocol 16 with `mix` synced, rules tests, and the simulation's `--signatures` reading each trait's
trademark. Left to do: merge `develop` into it (its `ai.js` predates 5), re-check the traits that showed weakly in a
first 40-round look (coward, tail-rider: given Ghost's and Creeper's room weights since), the A/B and head to head,
pictures, review.

As `docs/design/35-capricious-copycat-and-wildcard.md` describes: Capricious does impressions of every other rival from
a shuffled deck, each with its costume and an opening line; Copycat plays as the leader plays, copying a person by what
they do; Wildcard draws a few strong traits a round and shows them. One PR, or one per rival if that is cleaner.

Haakon (29 October 2026), playing: "I am seeing copycat shy rotten apples twice now, that was within reach. Both were
next to the map edge." Copycat left an apple it could reach, beside the board's edge, until it rotted. Likely suspects:
its mimic weight (120) outweighing the pull of food, and the room and margin weights that count an edge cell against a
move. Copycat's part of 3b fixes it, and first checks with a census whether every rival does it: of the apples that
rot, how many were within a rival's reach, and how far each was from the edge. A competent snake takes a safe apple by
the wall ("Clever rivals, human reactions"); one it takes into a dead end doesn't count as safe.
*Checked in PR #142* (`tools/dev/rotten-apples.js`, 150 rounds, seed 21): Copycat had been the worst, 0.20 apples
passed up (its head within 2) and left to rot a minute alive, 0.15 by the edge; with its copied habits and its pull to
mimic cut from 120 to 40, 0.13 and 0.09, mid-field. But every rival does it: 80% of the apples that rot lie on the edge
row or one in, and Sniper (0.19), Capricious, Mason and Mute pass up as many. A general edge-apple fix is noted below.

### 3c. A new rival: the Charmer (Haakon, 29 October 2026; an AI entry, after 2b and 3b)

Haakon (29 October 2026): "add Charmer to the queue, exactly as I have prescribed, with his clingy unique playstyle."
A vain show-off, named **Charmer**. His look, and the mark he leaves on the map when he dies, are Haakon's to give: this
entry doesn't specify them, and the art waits for his description. Everything else:
- **The trademark: courting.** He picks the biggest snake on the board, whoever it is (by length, never by who plays
  it: "The rivals never treat a person differently"), sidles up and slithers alongside it, two or three cells off its
  flank, matching its turns. Nobody else in the cast runs beside a rival: Creeper rides tails, Sniper cuts snakes off.
- **Why it pays:** riding alongside, he sees where his "date" is heading and beats it to the apple, stealing its meal at
  the last moment.
- **Rejected:** when the courted snake turns toward him, he backs off, and that dodge can leave him exposed to a third
  snake, so anyone who reads him can beat him ("No refuges").
- **Vain:** he loves the open middle of the board, where everyone can see him, and hates coiling into corners; he goes
  for golden food (the spotlight) and shuns mushrooms (shrinking ruins the look); overconfident in open space, so easy
  to bait into a Sniper's line.
- **His tongue is a hairspray can:** a little spritz when he flicks it.
- **Lines** in his own voice for kills, wins and chatter, as every rival has (`chatter/`), and a blurb for the start
  screen.
- **Built from the one template** (`ai.js`: his weights, and a driver for courting), measured like every rival: his
  trademark (time spent alongside a rival's head, and apples stolen from the snake he courts) and an `abtest.js` run on
  fresh seeds showing courting pays against a Charmer who doesn't court; every other rival's trademark within noise.
- **The cast grows to nineteen:** the start screen, the Field guide's row for him, the lobby's line-up, `CLAUDE.md`'s
  "a cast of eighteen", and Capricious's deck of impressions (3b) gain him; online play gets a protocol bump.

### 4. The teaching system, steps 2–6 (DESIGN "Teaching by showing") — after 5, whose new moves it must teach

**Right after the new moves** (Haakon, 29 October 2026: "And is this before the lessons rework? Because this will
definetly be part of it. I think all this should come right after the new powers."). It starts as soon as item 5's last
part merges, ahead of every other entry but the art and sound lanes, as a lane of its own (it touches the lessons, the
pictures and the Field guide, not the AI, so the AI entries 2b, 2h, 2i, 3b and 3c may run beside it). It teaches every
move and change of item 5 by showing, each with its picture or cue, its lesson and its Field guide row: the island hop
and leap now, bridges, the cutting flashes and the neck cut, dropping your tail, Mason's double walls, the golden flight
and bumps in the air, taking someone's landing, gold portals, dropped charges, squashing your own beads, and the
mushroom you swallow, aim by steering and spit ("Mushrooms come back up"), with its ring and its growing strength.

Step 1 is merged (#35):
- 2. the full-size woodpecker on upright phones;
- 3. your snake's voice;
- 4. the coach and the pictures, from one engine query;
- 5. the Field guide's rows and "Tell me again";
- 6. the tests.

The prototypes and the judges' verdicts are in `docs/handoff/teaching-prototypes/`:
- `voice.patch` is the base;
- `show.patch` has the pictures and the bird's deep perch;
- `first.patch` has the coach, `blockedFor` and `R.teachBoxes`.

Banner time rose to 55–61% of play in step 1, because lessons are still banners; step 3 should bring it to about 20%.
The teaching audits in `tools/dev/teach/audit` and `tools/dev/teach-build/audit` play rounds as a new player and measure
every banner: use them to measure it. The patches were made before DESIGN.md was split: their DESIGN.md hunks now belong
in `docs/design/29-round-six-b-the-new-moves.md` and `docs/design/30-teaching-by-showing.md`.

### 6. Round six C: the woodpecker in three acts

The draft is in `docs/handoff/woodpecker-acts-draft.md`.

- Also: an A/B test of food knocked aside against food falling into the hole, with a `?food=fall` knob for the owner's playtests.
- If the knock stays, it gets bark chips spraying out and a little bounce where it lands.
- Ghost's memorial: the planned smoke wisp, or the owner's idea of a broken shackle with a few chain links. Ghost's tongue stays smoke.
- The earlier "the bird eats the food" variant for that A/B is in `tools/dev/r6-study-tools/patch-flex3.js` (PECK_FOOD).

### 7. Then: local multiplayer (PR D)

As planned: up to 4 players, key sets, gamepads, and local and online play together.

### 8. Last: beetles who meet, fight (Haakon, 29 October 2026; an engine-rules entry, after everything else)

Haakon (29 October 2026), watching two beetles walk about an island the woodpecker made, away from the snakes: "Looked
a bit boring that they just walked around like that, I wanted something to happen. Therefore, given how rare it is, i
thought it should feel special." Then, to the design session's take: "Love how you described it! And it should come
late, it is probably the most uneasecary feature we have discussed here, so leave it last or close to last".
- **They notice each other:** two beetles within about 4 cells, with no head near enough to scare them, stop wandering
  and walk towards each other, sizing each other up, so you can see it coming.
- **A shoving match:** head to head, wing cases up, a buzzing clack, a second or two of pushing.
- **One loses:** the loser flips onto its back, legs waving, for about a second, then rights itself and runs for a
  burrow; the winner lifts its wing cases and buzzes, as they do now and then, but bigger.
- **The gamble:** while they fight they only bolt from a head within 2 or 3 cells, not 6, so a snake that spots it
  and gets there in time (over a hole by a jump, if need be) can take one or both. The rivals see fighting beetles as
  they are, an easier catch, and go for it when it pays, as for any food; a rules test proves it, through the same
  engine calls.
- **Every new rule needs a visible cue and a lesson:** the frame lights up emerald as for a beetle, the clack and buzz
  as world cues, and a Field guide row.
- **Online stays in step:** a protocol bump if the beetles' messages change.
- **Measured:** the simulation counts fights a round (rare is fine, as long as it happens), and deaths near a beetle,
  the one real risk, stay within noise.

## Noted, not yet queued

- **Apples by the edge rot** (found in PR #142's census, `tools/dev/rotten-apples.js`): 80% of the apples that rot lie
  on the edge row or one in, passed up by rivals whose heads came within 2. The room and margin weights likely count an
  edge cell against a move even when the apple is safe; an AI entry could test a safe-meal exception like the one for
  meals by the neck (`MEAL_DAWDLE`).

Small things found on the way, for Haakon to place in the queue:
- (None now.)
