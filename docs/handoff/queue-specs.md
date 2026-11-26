# The queue's specs

The full text of each open entry in `docs/PROGRESS.md`, moved here on 31 October 2026, by the owner's word, so the
progress file stays under the workshop check's 20 KB. Each entry in the queue keeps its title, what is next and a
pointer here; this text is its spec, as the entry's own words were. When an entry is done, its section moves to
`docs/archive/progress-done/done-specs.md` with it.

The owner's words quoted here keep, of each, only the decision and the words that carry its reason, spelling and grammar
corrected and the meaning unchanged: no bare agreement, praise, chatter or words addressed to a session (the owner, 19
November 2026, #792).

### The shared core (the owner, 5 November 2026; first among the side lanes, before the rule-file audit)

The rules common to every project move to one public repository, `HaakTuah/agent-core` (renamed from `agent-rules`),
and each project carries an exact copy of it under `core/`, pinned to one of its commits, generated and never
edited by hand, as Amarna Letters treats its copy of its design document. It comes in two layers (archive, 9 November 2026): a safety floor every
project takes whole and can never edit or leave out, and practice modules each project picks in a small manifest of its
own; this game takes them all. What moves: the security baseline, the four
pillars, the one inbox, keeping the owner's words, the roles and reviews, helpers, models and effort, the Git flow,
usage, updates and "No description left untrue". What stays in each project: what it is, its rules that stand, its
commands, its queue and whatever only it has, each rule file cut to that, with pointers into `core/`. The steps: (1) the
owner creates the repository and adds it to Claude's and Codex's GitHub access, which only the owner can do; (2) a fresh
session the owner starts in the core repository at high effort writes the core from both games' rule files (it reads
them, as they are public, and writes only to the core), from this brief: (a) read both games' rule files whole on `main`
(`AGENTS.md`, `CLAUDE.md`, `SECURITY.md`, `docs/threat-model.md`, `docs/claude-and-codex.md`, `docs/orchestrating.md`,
`docs/review-guidelines.md`, `docs/developing.md`, and Amarna Letters' builder rules); (b) a rule goes into the core if
it holds in both games and would hold in any project, and one that differs only in names, paths or examples goes in
once, with the difference left as a slot each project fills; a rule only one game has stays in that game; (c) every rule
keeps its reason, and the owner's words behind the common rules move word for word into the core's own archive, never
rewritten; (d) the four pillars hold for the core itself, so it comes out shorter than the two games' copies together;
(e) nothing personal, as both games' `SECURITY.md` say; (f) done when a table lists every rule of both games and where
it went (the core, one game, or dropped with its reason), and a fresh reviewer given only the two games' files and the
core finds nothing lost. The design session then checks the result against both games before any game takes a copy; (3)
each project, in a PR of its own, adds the copy, cuts its rule files to what is its own, and adds a check on every PR
that the copy matches the core at its pin (a workflow, so the owner's yes in that PR); (4) from then on a core change
reaches a project only through a sync PR in it, reviewed as any other. Steps 1 to 3 are done (step 3 here: PRs #636 and #637); step 3 took `HaakTuah/agent-core` at its newest `main`, from
`reports/2026-11-10-step-3-now.md` in the core's own repository (no copy holds its reports) first, which lists this game's step 3 in order (dropping `develop` just before
it, in a PR of its own) and holds where the older reports it names disagree. Its workflows had the owner's yes in its
PR. No session writes to more than one repository:
the core's own session writes the core, and each project's builders read it and write only their own. Then the rule-file
audit runs once on the core and once on each project's own rules (archive, 5 November 2026). The same in Amarna Letters.

### A content security policy for the page (the owner, 4 November 2026; first among the side lanes, as security hardening)

A policy in `index.html` (GitHub Pages sends no headers) by which the page loads code only from itself and PeerJS's
pinned file, and contacts only its own files and PeerJS's servers, so no code in it, a package's included, can send what
it holds anywhere else or pull in more. Done when a test shows the policy in place, online play still works on the PR's
preview or, while previews are down, a round played on a local copy in two browsers (the owner, 6 November 2026;
#534), and `SECURITY.md` and `docs/developing.md` point to it.

### 2b. Hunger's worth at a contested apple, for every rival (the owner, 29 October 2026; an AI entry)

The owner (29 October 2026), on the "For the owner" question whether a fed Gobbler should gamble too: "Shouldn't the
others contest apples more if they're hungry? They're worth more then, because usually an apple just gives you plus 1,
but if you are starving, it gives you 1 and saves you 1, so it becomes plus 2. But Gobbler should contest it regardless.
And Desperado, being an adrenaline junkie, should generally be less risk-averse."

Today hunger already makes every rival look for food harder (`foodW0`, `eatW0` in `decide()`), but only Gobbler and
Desperado set aside any of a rival's threat at a contested apple (`w.nerve`), so a starving rival still backs off an
apple it needs. Build it from the cause, in the one template every rival shares:
- **An apple is worth what it saves.** For every rival, a contested apple's worth counts the length it adds and, when
  the rival is starving or close to it, the length it stops it losing: about one more, as the owner says, and more as the
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

### 2h. The endgame: eat what keeps you alive, not what boxes you in (the owner, 29 October 2026; an AI entry, after 2b)

The owner (29 October 2026): "Snakes should maybe avoid food more with the woodpecker about. I see snakes gorging on the
remains of other snakes when they have only a few tiles left to move on. They are clearly not doing a context-relevant
trade-off calculation there." And: "Sometimes starving still lasts you longer than increased length will, with so little
room."

Today `decide()` sets `lean` once sudden death begins ("nobody can afford to be picky"), so food counts in full however
little room is left, and rivals grow into the space they need to turn in. The trade-off, for every rival through the
shared template:
- **A meal is worth the life it buys, against the room it costs.** Weigh how long the snake lasts each way: starving,
  it shrinks a segment every 1.5 s and frees room as it goes; eating, it gets a meal's time but grows into its pocket.
  It eats when hunger would end it before room would, and leaves the food when the length would box it in first. With
  room to spare, food counts as today.
- **Personality still shapes it:** Gobbler stays the greediest (its food share is its trademark), the careful ones
  the most sparing.
- **Grown, 31 October 2026** (the owner, watching Creeper drop his tail in a pocket: "Most box themselves in so they don't have the opportunity to amputate like that. It would be better if they could anticipate it earlier, so they amputate while they still have the chance." Then: "I also notice that they insatiably eat others' beads when the map gets really small. I might eat one to stop hunger, but I would not eat it all at once. It only pays to be bigger than your opponent that late in the game if you are afraid you might have to run out the clock, but I have yet to see that happen. The woodpecker is getting a makeover, so I don't want to focus too much on the current timing dynamic of the game. From my point of view, even if it was a time game, it would only make sense to eat it, cut yourself so you are just longer than your opponent, then squash the beads." The owner then
  agreed to the design session's take, which folds all four into this entry):
  - **The tail drop planned ahead.** A drop needs the flash rested, a body one thick and a free cell beyond, and a boxed
    snake rarely has all three. So the rivals plan it: when the search sees the room round them falling below their
    length within the next few moves, they weigh cutting now, while they can, against going on and being sealed in.
    Each in its style (Ouroboros late and rarely, Creeper readily).
  - **A length target.** Late in a round there is no clock to run out: the round ends when one snake is left. Length is
    worth a crash buffer (a crash costs 3, and one at your smallest puts you out) and a hunger buffer (a segment every
    1.5 s starving), and beyond that it only fills the room a snake needs to turn in. So a rival keeps enough for a
    crash or two and its hunger, and no more: one bead to stop hunger, not the whole heap.
  - **The denial play, where it pays.** Eat the beads a starving rival needs, cut back to the length you want, and
    squash your own dropped beads so nobody eats them. It costs the flash (and a failed flash costs 5), and against a
    greedy rival the beads left are a trap that boxes it in, so the rivals try it where it pays, and it stays only if
    the both-ways A/B says it wins.
  - **Reasoning now, numbers later.** The woodpecker's three acts (entry 6) change the endgame's timing, so this entry
    builds the reasoning (what a meal buys against the room it costs, the length worth keeping, when to cut), and its
    numbers are measured again after entry 6.
- **Measured** head to head on fresh seeds against the AI 2b leaves: deaths in sudden death by cause (self, body, boxed
  in, starved), who outlasts whom in the endgame, per-rival wins, every trademark within noise; and, for the parts
  grown on 31 October, deaths in a pocket smaller than the snake (40–45% of sudden death's today), tail drops made in
  time, and each part's both-ways A/B.

### 2i. Food seasons: lean, normal and plentiful rounds (the owner, 29 October 2026; an engine-rules entry, after 2h)

The owner (29 October 2026): "I think it should be a bit more aggressive. Someone should at least die from it once in a
blue moon. Games maybe feel a bit too samey now: it's pretty predictable. If food levels varied more, that would change
things up."

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

### 2y++. The golden flight, followed up (the owner, 2 November 2026; #399 and #401; side lanes now, the last step after part 7)

Moved from `docs/PROGRESS.md` at its trim (26 November 2026), which keeps there only what is next.

2y left the flight even both ways (24.9% against 25.1% head to head; +0.10 ± 0.15 place a use): between rivals a
landing is almost never contestable. The flight stays as built for now, and no rule changes yet:
1. **The ring tinted by its taker** (#401): done, PR #550 (the cue: "Taking a landing" in design 40).
2. **The flight measured against fliers who fly like people:** done, PR #588; still even, and no AI change. Fliers that
   take off into contested rings, as people do, came out even with develop's careful ones head to head (wins 25.0%
   against 24.9%, place 2.49 against 2.51, 1,200 pairs on seeds 631 and 632), and so did each flight (+0.03 ± 0.07
   place a use, against develop's −0.02 ± 0.05, seeds 631 to 633). Contested rings rose (3.3 to 3.9 jump-ticks a
   round), but rivals went for one only 0.2 times a round, and fliers came down on a body no more often (0.2 a round).
   Even taking a landing worth ten times as much took no more of them: a ring is almost never reachable in time, so the
   ring costs a flier little.
3. **Portals with a real cost** (#447): done, PR #591; no rule changed. A follower snipping its owner's body out of the
   exit bit in a third of follows but moved no places either way ("Portals for the wrap" in design 40); the
   owner's call is #592.
4. **Measured again after 2u and part 7,** whose stamina and pricing change what a flight costs. Only if it is still
   even then does a bigger change go to the design session: a longer flight, or the ring shown before take-off.

### 3b++. The spit lands more, and stays a shot you can dodge (the owner, 9 November 2026; #583; after part 7)

Moved from `docs/PROGRESS.md` at its trim (26 November 2026), which keeps there only what is next.

Between rivals 2% of spits hit a head. Make it land more as a skill shot fired in front of a snake, which the target sees
coming and can step out of (longer reach, the spitter choosing its moment, a lead), never by a shorter warning or a
flight too quick for 2q's reaction time. Done when spitters come out ahead both ways. Design 40, "The spit flies along
the line".

### 3b. The rivals who change: Capricious, Copycat and Wildcard (Wildcard's part after 5)

*Capricious done (PR #126), Copycat done (PR #142), 29 October 2026; the readings are in the design file.* **Wildcard's
part waits** (after 5), built on the branch `wildcard-shows-its-mix`: two or three traits a round from eight (`TRAITS`
in `ai.js`), its tag's note ("This round: hungry, reckless and hunts"), a brag as its first line (with its Chinese), a
Field guide row, protocol 16 with `mix` synced, rules tests, and the simulation's `--signatures` reading each trait's
trademark. Left to do: bring it up to date with `main` (its `ai.js` predates 5), re-check the traits that showed weakly in a
first 40-round look (coward, tail-rider: given Ghost's and Creeper's room weights since), the A/B and head to head,
pictures, review.

As `docs/design/35-capricious-copycat-and-wildcard.md` describes: Capricious does impressions of every other rival from
a shuffled deck, each with its costume and an opening line; Copycat plays as the leader plays, copying a person by what
they do; Wildcard draws a few strong traits a round and shows them. One PR, or one per rival if that is cleaner.

Copycat's rotten apples by the edge: checked and eased in PR #142; the general edge fix is noted at the end of this file (`docs/archive/progress-done/item-3b-parts.md`, "Item 3b, done parts").

### 3c. A new rival: the Charmer (the owner, 29 October 2026; an AI entry, after 2b and 3b)

The owner (29 October 2026): "Add Charmer to the queue, exactly as I have prescribed, with his clingy, unique playstyle."
A vain show-off, named **Charmer**. His look, and the mark he leaves on the map when he dies, are the owner's to give: this
entry doesn't specify them, and the art waits for the owner's description. Everything else:
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
- **Built from the one template** (`ai/rivals.js`; his own file in `ai/rivals/`: his weights, and a driver for courting), measured like every rival: his
  trademark (time spent alongside a rival's head, and apples stolen from the snake he courts) and an `abtest.js` run on
  fresh seeds showing courting pays against a Charmer who doesn't court; every other rival's trademark within noise.
- **The cast grows to nineteen:** the start screen, the Field guide's row for him, the lobby's line-up, `CLAUDE.md`'s
  "a cast of eighteen", and Capricious's deck of impressions (3b) gain him; online play gets a protocol bump.

### 3d. A new rival: Barkis & Boot-Snake, one snake with two sides (the owner, 2 November 2026; an AI entry, after 3c)

The owner (2 November 2026), asking for them: "Should Barkis & Boot-Snake be added as a rival too, maybe as a conjoined
snake somehow?"; on the reference: "Make it very clear what inspired them. Push that line to the max, so people fully
get the reference and think it is funny!"; and on their body: "They must be conjoined. They can flip around so they
change between the two from time to time, and maybe it triggers if they hit something. That way it works that they are
conjoined, and we don't have to make different rules for them: they are just a very visually unique snake, with two
unique AI personalities and lines." The owner then chose the design session's take of one head and a body that rolls
over, over a head at each end (the roll keeps one head at the end that moves, as on every snake, so a tail never looks
like a head, and shows who steers from any part of the body).
**One snake in one seat, with two sides:** it moves, eats, grows and dies by exactly the rules every snake does, with
one head at the end that moves, like every snake ("Every new rule needs a visible cue": nothing on the board lies about
where its head is). Its two sides are the two of them: Barkis's side, pale bark, and his face on the head, lanky with
a tall frayed crest; Boot-Snake's side, dark bark, and his face, squat with a heavy brow ridge. Whichever side is up
steers. Nothing about the body is theirs alone ("No ability only people use").
**The reference lives in their names and their nature:** two dim, giggling teenage-minded snakes who find crashes
hilarious and lose the thread at once. **Nothing is copied from the show that inspired them,** since the game is
public: no look, line, laugh or catchphrase of its characters. Their looks and every line are their own.
- **The flip: who is on top.** From time to time the body rolls over: a quick barrel roll runs from head to tail, the
  colour turning with it, and the other side comes up, face and all, so the other one now steers. For a few frames
  mid-roll both faces show. The snake keeps going the way it was going (no reversal, so no new move); only the side up
  and the mind steering change. Any part of the body tells who is steering, even with the head off screen. It flips every so often (a first guess: every 8 to 15 seconds,
  at random), and at once after a scare: a near miss, a bump in the air, or a rival crashing beside them. A crash that
  kills still kills: the flip never saves them.
- **Two minds, two styles, in the one template** (`ai/rivals.js`; its own file in `ai/rivals/`: two sets of weights and the swap):
  - **Boot-Snake, the bossy one,** hunts: he picks a victim by its position (never by who plays it: "The rivals never
    treat a person differently") and drives it toward a wall, a hole or fire.
  - **Barkis, the jittery one,** forgets the hunt and chases the nearest apple, golden first.
  - So their play lurches between the two, and a player who reads which side is up knows what comes next. A
    flip mid-hunt drops the hunt: that is the opening ("No refuges").
- **They laugh at crashes:** when any snake crashes near them, both snicker (a chatter line and a little shake), and the
  one on top loses a beat.
- **Their look, a snake of the log:** patched bark, as if grown out of the hardwood, pale on Barkis's side and dark on
  Boot-Snake's, so the two read apart at any size, on a phone too, and for colour-blind players by pattern as well as
  shade. The mark they leave on death: a splintered chip of bark, half pale and half dark.
- **Lines** in two voices of their own, bickering and egging each other on, for kills, wins, flips and chatter
  (`chatter/`), and one blurb on the start screen. The one underneath keeps talking, heckling the one on top, so they
  stay a pair even when only one face shows.
- **Measured like every rival:** their trademark (how their hunting and eating shares swing after each flip, and how
  often a flip drops a hunt) and an `abtest.js` run on fresh seeds against the same snake with one mind only; every
  other rival's trademark within noise. Online, the side that is up is sent like any other drawing state, with a
  protocol bump.
- **The cast grows to twenty** with the Charmer: the start screen, a Field guide row ("Barkis & Boot-Snake: watch which
  side is up"), the lobby's line-up, `CLAUDE.md`'s cast count and Capricious's deck of impressions (3b).
- **Later, only if the owner wants it:** a real reversal (head and tail swapping, the snake going back the way it
  came) would be a new move, so it would have to be a move every snake can use, priced and tested both ways, after 2u
  and part 7. Not part of this entry.

### 4. The teaching system, steps 2–6 (DESIGN "Teaching by showing") — after 5, whose new moves it must teach

**Right after the new moves** (the owner, 29 October 2026, of the lessons rework: "This will definitely be part of
it. I think all this should come right after the new powers."). It starts as soon as item 5's last
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
in `docs/design/40-powers-and-moves.md` and `docs/design/30-teaching-by-showing.md`.

### 6. Round six C: the woodpecker in three acts

Moved from `docs/PROGRESS.md` (2 November 2026, the file-by-file review). The draft is in
`docs/handoff/woodpecker-acts-draft.md`.

- **Its pace and fairness, and hunger in the endgame** (the owner, 31 October 2026: "I think it should take fewer chunks at once as a rule, because the map shrinks really quickly now! And I also think that when there is just a little bit of space, it should slow down again, so it isn't an RNG competition where whose island it pecks at next decides it." Then, agreeing to the design session's take: "I also want hunger to be a factor! Right now, food and beads just become a negative at the end. If we manage to balance this right, we can make it a trade-off, just like we tried with everything else, like mushrooms. That's a sign of good game design: conditional goods."). These come before the draft's numbers and win where they differ:
  - **Like the final Bowser, as a woodpecker** (the owner, 31 October 2026: "The final Bowser in Super Mario 64 is what I always compare my imagined woodpecker to, and it doesn't break down the map until there is no space."; to the design session's take: "I don't know about doing it in a few big moments; I think perhaps I like what we've planned already better. It fits a woodpecker. But what if it takes few chunks at once, but it is cutting out a shape, and when that shape is no longer attached to anything, it falls? I really like the idea of a floor, and how it continues to peck, which you must avoid, without taking out much any more: maybe just a tile here and there in the very late game."; then "There can still be jumpable gaps, but we want to avoid the islands stuff. It becomes too much RNG, and isn't very exciting."). It cuts shapes, never melts the log:
    - **A few cells a peck, along an outline.** Its pecks trace a dotted cut across the log, so everyone can watch the outline close round a piece; when the last peck cuts it loose, the piece falls away (2s's rule). The gaze in act 1 says where it will start cutting. The last peck is warned like any strike, and a snake still on the piece falls with it ("Down the hole!"), unless it crawled or jumped off in time; it never cuts loose a piece a snake couldn't leave in the warning's time ("The woodpecker plays fair"). The draft's combos give way to the outline. **It aims small, nothing is banned** (the owner, 31 October 2026: "No outline should be banned from falling, but ideally, it never takes out half the trunk."): it plans its outlines round edges and corners, pieces small next to the log (about a sixth at most, a first guess), and never plans a cut that halves the trunk; but no size is banned from falling, so a piece that ends up cut loose falls, whatever its size, by 2s's rule. Measured: the biggest piece that fell in a round.
    - **A floor.** It cuts shapes only while the log is bigger than the room the snakes left need to play (about twice their length together, a first guess, set by simulation). At the floor it stops cutting.
    - **Then it fights.** At the floor it keeps pecking at the snakes, aimed and warned (its rings), so they must dodge; a peck that catches a snake is a crash, never instant death, and never unavoidable ("No refuges" both ways). It takes only a tile here and there in the very late game.
    - **It cuts where there is the most log per snake,** never at random, so whose piece goes next never decides a round. Measured: how often a round is decided by where it cut, with the draft's "the biggest island not deciding the round".
  - **Hunger stays a factor to the end: food a conditional good.** Today food and beads only hurt at the end, since length fills the room. Balanced so a meal is a real trade-off there too, as the mushrooms are: life bought against room cost, each winning sometimes. The hunger clock is tuned with the bird's pace for it. Measured by three versions of the rivals head to head in the endgame: ones that always eat, ones that never eat, and 2h's weighing. Neither always nor never may win; the weighing must, and both starving and boxed-in deaths must show among the endgame's causes.

- Also: an A/B test of food knocked aside against food falling into the hole, with a `?food=fall` knob for the owner's playtests.
- If the knock stays, it gets bark chips spraying out and a little bounce where it lands.
- **Skeletons for the dead, beside the memorials** (the owner, 2 November 2026; lost from the queue when round six's plan was archived): vertebrae beads in the snake's colours and a skull wearing its trademark, still food at a glance (crash drops stay beads; rot bleaches and crumbles them), and every rival's trademark memorial on the head tile for about 15 s, as "Skeletons for the dead" and "Trademark memorials" in `docs/archive/plan-history.md` list them. On the food A/B above, the owner leans to falling.
- Ghost's memorial: the planned smoke wisp, or the owner's idea of a broken shackle with a few chain links. Ghost's tongue stays smoke.
- The earlier "the bird eats the food" variant for that A/B is in `tools/dev/r6-study-tools/patch-flex3.js` (PECK_FOOD).

Its six playable PRs, each merged before the next, as `docs/PROGRESS.md` had them until its trim (26 November 2026):
1. **Done** (PR #605): the three acts (calm, the watcher and its gaze, the first pecks, the frenzy), `?acts=`; Sovereign's
   time at home asked in #607.
2. **Done** (PR #610): it cuts shapes along an outline, down to a floor, then fights.
3. **Done** (PR #615): hunger a conditional good to the end, by one hunger clock for the whole round (#616; design 04),
   and the opening it made too hungry eased: a lean round keeps both apples until the first beetles, and the rivals turn
   desperate with 6 s of life left, not 11 (#673; design 04 and 39). Its weighing beats never eating but only ties always
   eating. 3+. **Done** (PR #756): islands that stay (#611; design 38, "Islands that stay"): a piece cut off stays standing while it touches the board's edge and lies a hop from the log; before the
   frenzy the piece it cuts out at the edge stays, in the frenzy its pieces fall. 3++. **Closed as measured** (#655,
   "Make length cost more in the endgame, so always eating there loses clearly"; the stand-in's no, sure, of 19
   November there): three floor shapes (PR #760; design 38, "The floor") and more of the last apples (PR #777; design
   04, "The last apples fall one at a time") left the weighing tied with always eating, since in the frenzy which meals
   a snake takes moves its length only a segment or two against a cut's thirty, so no rule keyed on length can tell the
   two apart. Part 3's tie stands: never eating does clearly worse, always eating comes out even. 4. The food A/B
   (`?food=fall`), with part 3's head to head again (falling food takes meals out of the frenzy: never eating must still
   do worse),
   chips and a bounce if the knock stays (the old study patches, `tools/dev/r6-study-tools/patch-flex*.js`, rebuilt for
   it). 5. Skeletons and trademark memorials. 6. 2h's numbers measured again.

### 8. Near the end: beetles who meet, fight (the owner, 29 October 2026; an engine-rules entry, last but the writing pass)

The owner (29 October 2026), watching two beetles walk about an island the woodpecker made, away from the snakes: "It looked
a bit boring that they just walked around like that; I wanted something to happen. Given how rare it is, I thought it
should feel special." Then, agreeing to the design session's take: "It should come late: it is probably the most
unnecessary feature we have discussed here, so leave it last or close to last."
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

### 8b. Fed rivals take the apple on the edge row (#595, "Idea: fed rivals turn from an apple on the edge row because the edge counts against their territory"; an AI entry, after 8, before the writing pass)

Moved from `docs/PROGRESS.md` at its trim (26 November 2026), which keeps there only what is next.

A person takes a free apple on the edge, but eleven of the eighteen rivals refuse one three cells along it when fed: from
the edge more of the board is nearer their head, so the meal looks like ground lost, though the snake leaves the edge
on its next move. A line that has just eaten counts its territory as it will be once it leaves the edge. An AI entry,
run one at a time, with the design check, after the hunger part (entry 6, part 3) merges, since it touches
`ai/food.js`; measured both ways with `tools/abtest.js` on fresh seeds, with a staged-board rules test (a fed rival with
no one near takes the apple), the rot by the edge from `tools/dev/nerve/census.js` and `--signatures` for every
trademark. Spec: the issue's text; design 39, "A meal isn't a pin".

### 9. At the very end: the writing pass (the owner, 31 October 2026; Fable, its newest version, after everything else, entry 8 included)

The owner (31 October 2026): "Many of the snakes' dialogue lines are really bad and corny. Some of it is fun pop-cultural stuff or wordplay I came up with, but most of it is corny writing by Opus. I think it would be nice to have a Fable run on it at the end, to really pep up the writing: make it more clever and culturally engrossing. I want it to look at all of it and give it a makeover. The Chinese lines are not as important: if it can, do them too, but most can't read them regardless." The owner kept some lines and gags out of the pass (listed under "Protected" below). Then, agreeing to the design session's take (the owner's gags kept, at the end of the queue, a page
to choose from): "Let it be creative! I don't want it to strictly look at and improve what's there: that constrains it. Let it go a bit wild and add stuff too, or make it over. It needs creative control outside of what I protect."
- **Who and when:** after entry 8, so it covers every line the queue adds (the Charmer, the new moves, the woodpecker's
  acts). Fable holds the creative control but not the volume, since its usage drains far faster, and it gets only
  the parts that need its judgement (archive, 5 November 2026, and "A helper above you gets only what needs it" in
  `CLAUDE.md`): (1) an Opus session at high effort runs the pass and gathers every line, for each rival and for the
  game's own text, into one file per rival with the owner's protected lines marked; (2) from those files alone, Fable at
  high effort writes for each a short voice guide (how it talks, its humour, its running jokes and callbacks to other
  rivals, what it never says) and a sample of its lines rewritten by hand, and chooses where new lines go; (3) Opus
  writes the rest from those guides and samples; (4) Fable spot-checks a sample of each rival's new lines against its
  guide and rewrites those that miss. Where more than about one in five of a rival's lines miss, Fable sharpens that
  rival's guide with what went wrong and Opus rewrites the rival once more; only if that misses too does Fable rewrite
  the rival itself. The creative control below is Fable's throughout.
- **Creative control:** outside the protected lines, Fable decides. It may rewrite, cut and add lines, remake a
  rival's way of talking, write running jokes and callbacks between rivals, and give lines to moments that have none
  (new moments use the events the game already sends; the chatter is presentation, so no rule changes). Clever and
  culturally engrossing over corny: wordplay, references that land in a moment, each rival's own humour. Each rival
  stays who it is, its name, look and play ("Every rival keeps its trademark").
- **Protected, word for word:** the owner's own lines, found from `docs/archive/instructions.md`, `docs/handoff/` and the
  git history (lines the owner wrote or asked for word for word); Wildcard's lines, which the owner likes, kept as they
  are, though Fable may add to them and offer replacements beside them for the owner to pick; and the gags: Mason's bad
  Latin, a scrambled Latin motto among them. The session lists what it protected, and why, at the top of its PR.
- **Bounds:** every line fits its bubble on a phone (the layout suite) and fires on its moment; no song lyrics and no
  long quotes, since those belong to their owners (a short reference is fine); nothing hateful.
- **The owner chooses:** the PR has a page with each rival's lines old and new side by side, new ones marked, so the owner
  can keep or reject them one by one; a rejected line goes back to the old one.
- **The Chinese lines last,** if usage allows: the same make-over, written as Chinese, not translated word for word;
  otherwise left as they are.
- **Meanwhile:** new lines follow "New lines, until the writing pass" in `docs/design/09-voice-and-copy.md`.

### The file-by-file review (the owner, 2 November 2026; the workshop lane, after the chatter split)

The owner: "[We] need a full review and cleanup where we look at every file, especially the documents, and ask: what does
this state that it does, and does it do it? If something in it doesn't, then it needs to be somewhere else, if anywhere
at all." Every file, docs first: what does it say it is for, and does it do that? What doesn't belong moves to where it
does, or goes; code is checked against "Split by meaning" and "Keep it lean" in `core/roles/shared/how-to-work.md`. The files every session
reads first, then `docs/`, then the code, in a few PRs, each with a table of every file it covered and what happened to
it, behaviour proven unchanged (suites, fingerprints). Helpers by
`core/tasks/helpers.md` (a Haiku search helper per folder).

### The file-by-file review's moves (the workshop lane; found in part 3 of the file-by-file review, PR #337, 2 November 2026)

Part 3 of the review asked of every code file what its header says it holds and whether it holds that. Its headers
are now right; what sits in the wrong file is listed here, checked against the code, for PRs of their own ("Split by
meaning" in `core/roles/shared/how-to-work.md`: a split goes in its own PR, behaviour proven unchanged by the fingerprints and the suites,
with what it saves said). One folder per PR; `render/world.js` waits for the main lane, as its split does.

- **render/:** `drawSnakes`, `drawPasses`, `drawTrails` (marks.js) to world.js, with the frame; `drawBurning` (marks.js)
  to weather.js, with the fire; `drawSpitRings` and `drawCheeks` (marks.js) to food.js; `drawLandings` (marks.js) to
  looks.js, with the jumps; `drawYou`, its marker and `drawRefusal` (world.js) to marks.js; the food pictures
  (`drawApple` to `drawBead`) and the beetle's bore (`digOf`, `drawDig`, `digCollar`) from sprites.js to food.js;
  `costumeChange`, `drawChange`, `oldCostume` (bodies.js) to looks.js; `growBird` (bird-drum.js) to bird-perch.js;
  `headAndEye` and `birdWatch` (bird-draw.js) to bird.js, which keeps what the bird remembers between frames. The seeded
  `rnd` written six times (core.js four times, food.js, weather.js) and the sin hash twice in food.js, written once.
- **game/:** `sendPlan` and `hostTick` (core.js) to friends.js, with the online code; `deathMoment` (core.js) to
  round.js; the steer hints (`showSteerHint` to `bubbleBoxes`) and `markYou` (banners.js) to hud.js; the seat picker
  (hud.js) beside the start card's seats (banners.js); `keepAwake` (input.js) to screen.js. `banners.js` (48 KB) holds
  toasts, news, lessons and cards: a split by what each is for.
- **chatter/ and records.js:** `addLog` (moments.js) to talk.js, which holds the log; the land checks (`landsOf` to
  `sharesLand`, talk.js) to moments.js, their only reader; `ZH_LABELS` (voices/metagamer.js, read by moments.js) to
  moments.js. In records.js, the line-up (`seats`, `setSeat`, `deal`, `undeal`) and the screens drawn (`renderScores`,
  `renderStats`) are their own things beside the records kept.
- **audio/:** `sound.js` (46 KB) holds the synthesiser, the music and the weather's sound: a split by what each is for.
- **tools/:** the seeded `seeded()` written six times (online-test.js, sim/00-setup.js, bench-ai.js, abtest.js,
  chatter/01, rules/00-setup.js), `check()` and `ev` in each browser suite's runner, `ok()` in records-test.js and
  sw-test.js, the quantile four times in scenes.js: each written once in a shared file (browser.js already serves the
  browser tools). `render/09-chomps.js` checks sounds, so it moves to the chatter suite's `05-sound.js`; the swipe check
  in `layout/12` is the controls suite's (`input/03-touch.js`). Two tests play whole rounds against "The smallest setup
  that tests the rule": `chatter/04` (two whole AI rounds by default) and `rules/03`'s eight sudden-death boards, each
  made a scripted board for a few ticks. `tools/trace.js` is run by nothing and named only in a comment: say what it is
  for in `docs/developing.md`, or archive it.

### The polish lane (the owner, 31 October 2026; beside the main lane)

Moved from `docs/PROGRESS.md` at its trim (26 November 2026), which keeps there only what is next.

The game's polish lane (`core/roles/shared/work-flow.md`, point 4).
- **What belongs, here:** the same thing drawn, named or worded differently in two places (a rival's colours, a move's
  name in the lesson and the Field guide); the phone held upright and sideways; the wording of banners, chatter, the
  Field guide and menus; sound levels that jar. Never the online messages: they go to their entries.
- **How, here:** a lesson and an online lobby among the screens; the picture on `pr-media`, and play proven unchanged by
  the suites and the simulation's fingerprints (seeds 3 and 11); one line per fix under this lane.
