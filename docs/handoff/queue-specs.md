# The queue's specs, word for word

The full text of each open entry in `docs/PROGRESS.md`, moved here on 31 October 2026 so the progress file stays under the
workshop check's 20 KB (the owner: "Yes, to all, expertly!"). Each entry in the queue keeps its title, a line of what it is
and a pointer here; this text is its spec, as the entry's own words were. When an entry is done, its section moves to
`docs/archive/progress-done.md` with it.

### 2aa. Dash on the key you're going (the owner, 4 November 2026; an input entry, a side lane now)

The owner: "I noticed you don't dash, when you press the arrow keys or wsad in the direction you are moving. I think you
oughta." Pressing the steering key (arrow or WASD) of the way the snake is already going dashes, as a swipe ahead
already does on a phone; E, Shift and a right-click stay. It was the old power press, dropped because held keys and
auto-repeat fired it by accident ("Steering keys only steer" in `docs/archive/design-powers.md`), so it comes back with
touch's guard, `POWER_AFTER_TURN_MS`: only a fresh keydown dashes, never a held key or auto-repeat (`e.repeat`), and a
press within 300 ms of the press that turned the snake that way is that turn pressed twice, not a dash. The dash itself
is unchanged: the same engine call and online message (no protocol change), and the rivals, who already dash, are
untouched. Updated in the same PR: the hints under the board and on the start card, the dash lesson, the Field guide
row, the README and `docs/design/40-powers-and-moves.md`. Done when a rules test shows a fresh press ahead dashing, a
held key and auto-repeat never dashing, and a double-tapped turn turning once.

### 2u+. The stamina economy and the golden apple's worth (the owner, 3 and 4 November 2026; #460; a measurement right after 2u, then an engine-rules entry for what pays)

Right after 2u, on fresh seeds and for every rival, in two steps, each against the game as 2u leaves it. **Where stamina
comes from** (the owner, 4 November 2026: "anything you eat should give a little stamina recharge"; "stamina maybe
becomes something that don't recharge by itself, or at least very slowly. But maybe food gives it, and you can reach
over baseline, save up?"): every food refills it in proportion to how much it grows the snake; on its own it comes back
as built, or only slowly up to a floor (a first guess of half a bar, so a snake far from food is never powerless), or
not at all; and it banks above the baseline up to a cap ("Maybe the cap should start at 3x baseline, and be figured out
in testing"), shown as an overfull bar every snake can see. **The golden apple** (2z, PR #459: its +3 costs more time
alive than it helps): a full baseline's refill ("Golden apples gives full 1x baseline"), against that plus a shield that
absorbs one bump ("I only imagined it as absorbing 1 bump. If you have no space to move, it does you no good"), kept
until used or fading after a while (a first guess of 10 s), and against the supercharge of 3 November (a first guess of
4 s at a faster refill). What pays is built, with its cue, lesson, Field guide row and protocol bump: eating late must
come to pay without always paying, plentiful rounds must not turn into power spam, the shield must never make anyone
safe (if shielded snakes outlive everyone, it is tightened or dropped), every trademark holds (Gobbler's food share,
Mute's boxing and Creeper's tail-riding above all), and the rivals play it well: eating when low, banking before a
fight. Part 7 then prices the powers against the economy that wins.

### 5. Round six B: the new moves (DESIGN "Round six B")

Moved up by the owner (29 October 2026): "It's the one I am most interested in playing, and it has been pushed back for a
long time now. Also, the teaching system will have to account for it." It goes ahead of Wildcard's part of 3b, 2b, 2h, 2i
and 3c. A playable draft PR as early as it can be, so the owner can try it.

*Done so far:* parts 1, 2, 3 and 3b (PRs #158, #174, #183, #195); their words and detail are in `docs/archive/progress-done.md`, "Item 5, its done parts".

*Where it stands:* the parts left and their order are in `docs/PROGRESS.md`, item 5 (part 6 is *built and reviewed*
on `round6b/dropped-charges`: merge `develop` into it, renumber its protocol after part 4's, run its A/B; part 7 is
*parked* on `round6b/pricing`; part 3's numbers to watch there: Joker and Sovereign low on single seeds, Gobbler's and
Vulture's shares a little lower). Mason's double walls are kept (the owner, 29 October 2026). The 29 October status this
replaced is in git history (the file-by-file review, 2 November 2026).

- **One pricing model for every power:**
  - gain is searched from where the power ends, plus a tempo credit for flashes and the island reached for jumps;
  - the tail tip is priced at what length is worth now (cheap late in the round);
  - an idle power gets cheaper, with a floor kept for a way out;
  - risk is a failed flash (about 5 segments and a longer stun) or a bump in the air, weighed by each rival's nature;
  - not a junkie like Star, and not hoarding.
  - Caution: at a flat 1-apple price, rivals flashed 3 times a minute and did no better. Judge it by the seat-split A/B.
- **Dropped charges:** not on every bump. On a knockout, the charges spill where the head fell as a golden pickup anyone can grab.

**Every move of the round, in this order** (the owner, 29 October 2026, when the design session found the entry listed only
part of "Round six B": "Yes, they are all part of the power update! What i have been looking forwards to!"). Each part
is its own playable PR, tested both ways (`tools/abtest.js`) with every trademark measured, as the island hop was; the
design's words for each are in `docs/design/40-powers-and-moves.md` (as first decided, in `docs/archive/design-powers.md`):
1. **The island hop and no auto-jump** (done, PR #158).
2. **Bridges** (done, PR #174). Rare by design, about one ride in twenty rounds (the owner, 29 October 2026: "Agreed with
   you expert take!"): part 4 and item 6 each report bridge rides again, adding no rule to make them commoner.
3. **The flashes cut** and **mushrooms come back up** (done, PRs #183 and #195).
   **3b+. The spit flies along the line** (the owner, 30 October 2026: "3. Agreed, do it expertly!"; the design's
   "The spit flies along the line"): straight ahead up to 5 cells, two a tick, stopping at the first head (poisoned) or
   body (bounced by the roll rule), gone over the edge or a hole; a dotted line in place of the ring; the rivals lead
   their shots and step out of lines; the A/B should now show the spitters ahead, no refuge; lesson, cue, protocol
   bump. **The spitter slides over its own mushroom** (moved to the front as its own entry, 2x, on 2 November 2026) for a few moves (`OWN_SPIT_TICKS`, a first guess of 6), as a full
   mouth slides over food, so it can't swallow it again: today the spit lands 3 straight ahead and a snake that keeps
   going eats it 3 moves later, shrinks again and has a full mouth again, a loop that cost the owner several apples (his playtest, 30 October 2026); everyone else is hit by it as before. It runs after part 4, 2q and 2s, before part 5 (rule and AI
   changes run one at a time; 2q first, so 3b+'s A/B measures dodging with human reactions).
4. **The golden jump flies:** hold to fly up to 5 cells, steer in the air, the gold ring where you'd come down; with
   **leap now** (a second press while a jump waits sends it at once, open ground included: "Leap now" in the design); with
   **bumps in the air** (a crash's cost, and you drop where you are: over fire you catch alight too, over a hole you
   fall in, onto a snake you're out, trapped). Its A/B came out even with leap now and the flight measured together, so (the owner, 31 October 2026: "Yes, please, expertly!", to splitting it): the flight and leap now are measured apart; the rivals learn the flight's uses (out of a box, across to food, cutting off, steering planned in the air) until fliers come out ahead; the golden flash is measured on its own in the same pass and its use taught where it falls short; if the flight pays and leap now doesn't, the flight merges without leap now, and leap now comes back to the owner. "The rivals fly it as a person would" and "The golden flash cuts deeper" in `docs/design/29-round-six-b-the-new-moves.md`.
5. **Gold portals for the wrap:** anyone may follow through for about a second after your body passes. In six test rounds nobody followed, so the time it stays open is lengthened step by step until following makes a gameplay difference from time to time (the owner, 31 October 2026: "Then we can increase the time it is open, until it actually makes a gameplay difference from time to time."), after checking that the rivals see the chance at all: "Open long enough to matter" in `docs/design/29-round-six-b-the-new-moves.md`.
6. **Dropped charges** on a knockout, as above. *Built and reviewed* on `round6b/dropped-charges` (a spilled gold coin ringed with the pips; rules tests; review fixes in; protocol to renumber when it merges); still to do: the A/B against rivals that ignore spills (a copy is easy: zero the spill's worth in `ai.js`), pictures, the PR.
7. **One pricing model for every power,** as above, last, and built afresh on top of 2u's one stamina, not resumed from the parked pass (the owner, 2 November 2026); the parked pass on `round6b/pricing` is a reference for its findings only (*a first pass is parked* on `round6b/pricing`: the tail tip at length's worth now, rests cheaper while idle with a floor, risk by `headRisk`; on seeds 51/53 the seat-split already shows powers on beating off, 33.6% to 16.4%, with the island hop alone, and this pass did no better, 33.3% to 16.7%, flashing more; a direct head-to-head against today's AI was stopped at look 4, its rounds cached), so it prices every move together, with **each rival's power
   style** ("Every rival has a power style"); the design's "Balance targets" are its measure.
   Part 7 also takes two of the improvement audit's finds (31 October 2026; the owner: "Agreed to all, expertly!"): **the trademarks
   that never show** (Mute's boxing and Joker's lures level with the field, Mason's body beside itself below it) get
   measures that catch the behaviour first (Mute's boxing counting the kills it gets by boxing; it leads the kills at
   0.52 a round), then more teeth in play where they stay flat; and **character never costs wins**: Joker (14% and 18%
   on seeds 3 and 11) comes up into the 15-35% band, and the gap between the flashier rivals (Joker, Capricious,
   Copycat, Star) and the plain Drab (32% and 30%) closes, every trademark kept and Drab left as it is.
Then the teaching system (item 4), which teaches all of them.

**The rivals learn every move in its own part** (the owner, 29 October 2026: "And very important that the commin ai is
updated to understand all these rule changes to maximize they use of all the playrules!!!"). No part merges until the
rivals use its moves when they pay and in their own styles, and see them used against them: hop, ride a bridge, cut,
neck-cut, drop a tail, fly and steer, leap now, take a landing, follow a portal, grab dropped charges, and keep clear of
each danger (a landing ring, a flash's line, a bridge's tail end). Rules tests prove each one through the same engine
calls as a person's, and the head-to-head shows the users ahead ("No ability only people use", "every new move is
tested both ways"); the pricing part then makes the choices among them as good as they can be.

### 2q. Rivals notice like people (30 October 2026; an AI entry, after 2s)

The owner: "do the snakes have a bit too good reaction time? [...] Just seems they play a bit too well in that regard
perhaps", and to the take that what is superhuman is not the 240 ms but seeing the whole board at once: "Agreed to
all!". Every rival's view of another snake is as old as a person's notice of it would be: `REACTION_MS` (240) near its
own head, growing with distance to about 400 ms across the board (`REACTION_FAR_MS`, first guesses), with a little
variation from moment to moment, so near things are seen at once and far ones a beat late, as a person sees them
("Clever rivals, human reactions"; the AI still plans as far ahead as before). Online the same. Measured before and
after: per-persona win rates, every trademark and the feel numbers within noise or explained, through
`tools/abtest.js` on fresh seeds; the PR shows the table.

### 2r. No hop onto a doomed island (30 October 2026; part of item 5's part 4)

The owner: "I see snakes jumping onto small islands where they have no chance to survive for very long". Before a hop or
a flight, a rival weighs where it lands: the island's free room against its own length, the food on it, and above all
**whether it can jump off again** (the owner, 30 October 2026: "don't forget a snake must account for if it can jump off
the island again if it picks to jump there!"): another piece of log within a hop of the island, and room to live on
it until its jump's rest is over, and from where on the island its head can take that hop; a landing it can't live on scores as the death it is, unless staying
is worse. A rules test sets up the case (a long snake beside a small island and a bigger one in reach), and part 4's
A/B reports hops onto islands too small to live on, before and after.

### 2b. Hunger's worth at a contested apple, for every rival (the owner, 29 October 2026; an AI entry)

The owner (29 October 2026), on the "For the owner" question whether a fed Gobbler should gamble too: "Agreed to all,
expertly! Shouldn't the others contest apples more if they're hungry? They're worth more than, because usually apples
just gove you plus 1, but if you are starving, they give you 1 and save you 1, so become plus 2? But yes, gobbler should
contest it regardless. And Desperados being an adrenalin junkie, should generally be less risk averse?"

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

The owner (29 October 2026): "snakes should maybe avoid food more with the woodpecker about? I see snakes gorging on the
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
- **Grown, 31 October 2026** (the owner, watching Creeper drop his tail in a pocket: "Most box themselves in so the don't have the oppertunity to amputate like that. Would be better if they could anticipate it earlier, so they amputate while they still have the chance." Then: "I notice also that they eat insatiably others beads, when the map gets really small. i might eat one to stop hunger, but i would not eat it all at once. it only pays to be bigger than your opponent that late in game, if you are afraid you might have to run out the clock, but i have yet to see that happen. which is a shame. but woodpecker is getting a makeover right, so i don't want to focus to much on the current timing dynamic of the game. but yes. from my point of view, even if it was a time game, it would only  make sense to eat it, cut yourself so you are just longer than your opponent, then squash the beads. what's your expert take?" Then, to
  the design session's take, folding all four into this entry: "Sounds good!"):
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

The owner (29 October 2026): "I think it should be a but more agressive. Someone should at least die from it once in a
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

Copycat's rotten apples by the edge: checked and eased in PR #142; the general edge fix is noted at the end of this file (`docs/archive/progress-done.md`, "Item 3b, done parts").

### 3c. A new rival: the Charmer (the owner, 29 October 2026; an AI entry, after 2b and 3b)

The owner (29 October 2026): "add Charmer to the queue, exactly as I have prescribed, with his clingy unique playstyle."
A vain show-off, named **Charmer**. His look, and the mark he leaves on the map when he dies, are the owner's to give: this
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
- **Built from the one template** (`ai/rivals.js`; his own file in `ai/rivals/`: his weights, and a driver for courting), measured like every rival: his
  trademark (time spent alongside a rival's head, and apples stolen from the snake he courts) and an `abtest.js` run on
  fresh seeds showing courting pays against a Charmer who doesn't court; every other rival's trademark within noise.
- **The cast grows to nineteen:** the start screen, the Field guide's row for him, the lobby's line-up, `CLAUDE.md`'s
  "a cast of eighteen", and Capricious's deck of impressions (3b) gain him; online play gets a protocol bump.

### 3d. A new rival: Barkis & Boot-Snake, one snake with two sides (the owner, 2 November 2026; an AI entry, after 3c)

The owner (2 November 2026), asking for them: "What do you think of Barkis & Boot-Snake, should that be added as a rival
also. maybe a conjoined snake somehow?"; on their source: "[…] inspired, but snakes on a bark, or "hard wood"."; on
the reference: "Yes, but make it very very clear where they are inspired on. Push that line to the max, so people
actually fully get the reference and think it is funny!"; and on their body: "Oh, they must be cojoined. they can flip
around so they change between the 2 from time to time, and maybe it triggers if they hit something or something. that
way It works that they are cojoined, don't have to make different rules for them. they are just a very visually unique
snake, with 2 unique ai personalities and lines."; then, to the design session's take on a head at each end against
one head and a body that rolls over (the roll keeps one head at the end that moves, as on every snake, so a tail never
looks like a head, and shows who steers from any part of the body): "Yes, please! Expertly!"
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

**Right after the new moves** (the owner, 29 October 2026: "And is this before the lessons rework? Because this will
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
in `docs/design/40-powers-and-moves.md` and `docs/design/30-teaching-by-showing.md`.

### 6. Round six C: the woodpecker in three acts

Moved from `docs/PROGRESS.md` word for word (2 November 2026, the file-by-file review). The draft is in
`docs/handoff/woodpecker-acts-draft.md`.

The draft is in `docs/handoff/woodpecker-acts-draft.md`.

- **Its pace and fairness, and hunger in the endgame** (the owner, 31 October 2026: "Sounds good! though I think it should take fewer chunks at once as a rule, because the map shrinks really quickly now! and i also think when there is just a little bit of space, it should slow down again, so it isn't and rng competition where it is who's island it pecks at next that decides it, capiche? Whats your take?" Then, to the design session's take: "Yes, to everything, expertly! and i also want hunger to be a factor! right now, food and beads jjust become a negative at the end. if we manage to balance this right, we can make it a trade-off, just like we tried with everything else, like mushrooms. that's a sign of good game design, conditional goods. thomas sowell in game mechanics."). These come before the draft's numbers and win where they differ:
  - **Like the final Bowser, as a woodpecker** (the owner, 31 October 2026: "Bowser 2 in Super Mario 64 is what I always compare my imagined woodpecker to, and it doesn't break down the map until there is no space.", then "sorry! final bowser!"; to the design session's take: "Yes, though I don't know about in a few big moments, I think perhaps I like what we've planned already better. Fits a woodpecker. but what if it takes few chunks at once, but it is cutting out a shape, and when that shape is no longer attached to anyhting, it falls? I really like your idea about a floor, and how it continues to peck which you must avoid, without taking out much anymore. maybe just a tile here and there in the late late game. what do you think, expert?"; then "Yes, I think that's it. can still be jumpable gaps, but we want to avoid the islands stuff. it becomes too much rng, and isn't very exciting."). It cuts shapes, never melts the log:
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

### 8. Near the end: beetles who meet, fight (the owner, 29 October 2026; an engine-rules entry, last but the writing pass)

The owner (29 October 2026), watching two beetles walk about an island the woodpecker made, away from the snakes: "Looked
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

### 9. At the very end: the writing pass (the owner, 31 October 2026; Fable 5.1, after everything else, entry 8 included)

The owner (31 October 2026): "Also, many of the Snakes dialogue lines are really really bad and corny. some of it are fun pop cultural stuff or wordplays I came up with, but most of it is corny writing by Opus 5.5. I think it would be nice to have a Fable 5.1 run on it at the end, to really piff up the writing. make it more clever and culturally engrossing. Though Trump actually got some good lines! So i don't want it to remove across the lines. remove the funny gags like Mason talking bad latin, or saying vidi vici veni which is a sex joke. but i want it to look at all, and give it a make over. the chinese lines are not as important. if it can, do them too, but most can't read them regardless. concur?" Then, to the design session's take (his gags kept, at the end of the queue, a page
to choose from): "yes, and let it be creative! i don't want it to strictly look and improve whats there. that contrains it. let it go a bit wild and add stuff to, or make it over. it needs creative control outside of what i protect."
- **Who and when:** a Fable 5.1 session at high effort, after entry 8, so it covers every line the queue adds (the
  Charmer, the new moves, the woodpecker's acts).
- **Creative control:** outside the protected lines, the session decides. It may rewrite, cut and add lines, remake a
  rival's way of talking, write running jokes and callbacks between rivals, and give lines to moments that have none
  (new moments use the events the game already sends; the chatter is presentation, so no rule changes). Clever and
  culturally engrossing over corny: wordplay, references that land in a moment, each rival's own humour. Each rival
  stays who it is, its name, look and play ("Every rival keeps its trademark").
- **Protected, word for word:** the owner's own lines, found from `docs/archive/instructions.md`, `docs/handoff/` and the
  git history (lines he wrote or asked for word for word); Wildcard's lines, which he likes (Trump's, by his hair), kept
  as they are, though the session may add to them and offer replacements beside them for him to pick; and the gags:
  Mason's bad Latin and "vidi vici veni". The session lists what it protected, and why, at the top of its PR.
- **Bounds:** every line fits its bubble on a phone (the layout suite) and fires on its moment; no song lyrics and no
  long quotes, since those belong to their owners (a short reference is fine); nothing hateful.
- **The owner chooses:** the PR has a page with each rival's lines old and new side by side, new ones marked, so he can
  keep or reject them one by one; a rejected line goes back to the old one.
- **The Chinese lines last,** if usage allows: the same make-over, written as Chinese, not translated word for word;
  otherwise left as they are.
- **Meanwhile:** new lines follow "New lines, until the writing pass" in `docs/design/09-voice-and-copy.md`.

### The file-by-file review (the owner, 2 November 2026; the workshop lane, after the chatter split)

The owner: "Need a full review and clean up where we look at every file, especially the documents, and ask what does this
state that it does, and does it do it? If something in it doesn't then it needs to be somewhere else, if anywhere at
all." Every file, docs first: what does it say it is for, and does it do that? What doesn't belong moves to where it
does, or goes; code is checked against "Split by meaning" and "Keep it lean" in `AGENTS.md`. The files every session
reads first, then `docs/`, then the code, in a few PRs, each with a table of every file it covered and what happened to
it, behaviour proven unchanged (suites, fingerprints). Helpers by "Helpers: when they pay" in
`docs/claude-and-codex.md` (a Haiku search helper per folder).

### The file-by-file review's moves (the workshop lane; found in part 3 of the file-by-file review, PR #337, 2 November 2026)

Part 3 of the review asked of every code file what its header says it holds and whether it holds that. Its headers
are now right; what sits in the wrong file is listed here, checked against the code, for PRs of their own ("Split by
meaning" in `AGENTS.md`: a split goes in its own PR, behaviour proven unchanged by the fingerprints and the suites,
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

