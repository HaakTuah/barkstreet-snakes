## Round five: Star

The owner's idea: bring back the rainbow body we dropped and give it to a new rival, **Star**. Star is inspired by the stars of the original Paper Mario, the one with the big mustache, so it looks like a star with a rainbow following it. It's a power addict that jumps and flashes as often as it can. These are the calls, as they were built; where the build changed one, it says so.

**Why it belongs.** Round four made jumping and flashing central, but every rival prices them the same way. Star is the first rival whose whole character is the powers: it shows what they can do. The rainbow also finally gets a home that fits.
- It was Wildcard's first, then Mute's.
- Mute became a mood ring, because a mime's colour should be its mood.
- A shooting star dragging a rainbow is the most natural use the rainbow has had.

**The look.** It's our own star, not a copy:
- **The head** is a five-pointed star with softly rounded points (a sharp star, points 1.3 and valleys 0.68 head radii, grown round), its points turning with its heading, one to the back, into its trail. **Its face stays upright** at every heading, its chin tipped 18° toward the way it's going across the screen: tall oval ink eyes with a catchlight, bushy white brows outlined in ink, and a huge white walrus mustache under them, its mouth and its tongue gag (downward) beneath. Heading down, left or right, the mustache droops over its two lower points; heading up, its back point sits under its chin. (As built at first, the face turned with the heading like every other face, and heading up the mustache sat above the eyes and read as huge angry brows: the critique turned it upright.) It wobbles when it's stunned.
- **The head's colour.** Star is sunflower yellow (`#f9c22e`), deeper than Honey, with an orange rim (`#e8890c`) and an ink outline. Gold means power, and Star's yellow must never pass for a power mark. Sovereign's crown and Wildcard's combover set the precedent: a yellow on a face is a look, and the gold outline round a body is the power. When Star holds golden powers, it gets that outline like anyone: its gold line, its shadow and a land's colour round it follow its points (sunflower, then ink, then Honey, then ink, so the head never reads as the gold line), its pips sit past its points, and its stun stars a quarter of a cell further out than a round head's.
- **The body** is the old rainbow (`hsl(h, 85%, 62%)`, 28° of hue a segment, moving a degree every 15 ms), flowing down from the head toward the tail: the other way to the old one, whose hues flowed up toward Wildcard's and Mute's heads. It fades toward the bark at the tail like everyone's, holds still with reduced motion, and stops where it was when Star is out. (*Since round six A* it streams back by the distance Star travels, and drifts slowly with reduced motion: see "Star's rainbow streams".)
- **Its tail sheds a small four-point twinkle** in one of the rainbow's six colours every 0.3 to 0.7 s, only with motion on. There's no halo: only you glow.
- **For its tongue gag**, it flicks out a tiny spinning star on a ribbon of rainbow, with a glint at full stretch. (*Since round six A*, its mustache twirls instead: see "Star's mustache".)
- **It looks at** the nearest golden power (a golden beetle, a golden leaf or a golden mushroom), and otherwise at the nearest head.
- **Its beads** come out in rainbow order from its head (red, orange, yellow, green, blue, violet, and round again), and the pieces it bursts into take the same colours.

**The tell: a countdown on its five points.** An addict's weakness is the comedown.
- **Its middle is always its sunflower.**
- **As it flashes,** its points go dim (`#b0893a`, rimmed `#8a5c24`) and its twinkles burst off them.
- **As its rest runs down,** they light again one by one: a point every 1.2 s, from its back point round.
- **The fifth lights when the flash is back,** and two twinkles go round its points. Holding golden flashes, all five are lit.
- **Its brows** knit as it flashes and relax early in its rest.
- **With reduced motion,** each point lights at once, one at a time, and nothing blinks.

Count its points to see how soon it can flash again, and box it in while they're dim. This is drawing only. It shows what the rules already know, and the rivals don't use it: they assume anyone may flash, as before.

*Why a countdown:* as first built, Star was bright only while its flash was ready. It flashes the tick its rest ends, so that was 5% of the time in a real round, 0 to 234 ms at a stretch. It was a mustard biscuit on 9 frames in 10, and its "ready" was a blink, and with reduced motion a flash of the whole head. Now a watched round shows it two-thirds sunflower, and never all dim.

**How it plays.** Star prices powers far below anyone else, by the same rules and the same engine calls. It's two persona weights, both off for everyone else, so rounds without Star play exactly as before (100 rounds drawn without it, seed 3, give the stub's fingerprint, 202796421):
- **`w.powers`** `{ price: 0, risk: 350, everyWay, jumpAny, dashSpend }`. Its powers are free to it, unless one ends where its risk is over 350 (a rival could strike there: in reach of its powers, or nearer), and there it pays the full price, as anyone would. A power still has to beat crawling by a point. (The brief said a fraction of the price: at 0.05 Star flashed 8.2 times a minute and won no more, 22 / 19%.)
  - **Flashes:** whenever it's rested and the flash doesn't run into anything, weighed every way, not just the way it would crawl: about four times as often as anyone else.
  - **Jumps:** any hurdle with somewhere free to land beyond it that no rival could get to before it's down, not just out of a crash or onto food. (A head moving into the landing stops a jump, and it crawled into what it meant to hop: about one avoidable crash every two rounds, until the critique.)
  - **Golden dashes:** spent on speed too, not only on cuts and golden things, but at anyone's price for one (0.6 of an apple), so only for a real gain, such as beating a rival to an apple. (Free to it, it spent both in the two ticks after a leaf, in a zig-zag that cut nobody: 69% of its dashes, against 18% now.)
- **`w.golden`** `{ power: 6, apple: 1.5, contested: 0.5 }`. It craves golden things above everything, to feed the habit: golden power food (golden beetles, golden leaves and golden mushrooms; a plain beetle is worth to it what it's worth to anyone) is worth six times as much to it, a golden apple one and a half times, and golden power food a rival will reach first still counts half. (Without `contested` it ate 1.0 golden power food a round, against 0.68 for the rest.)
- **Territory 1.2**, from the stub's 0.6: of everything tried, the only change that moved its win rate (23% to 26.5%, over 800 rounds with Star in every one).

Round four measured that spending powers on small gains makes a rival weaker. So Star stays a real threat in two ways. Each power goes by the same tests of where it goes as anyone's, and pays the full price where a rival could strike, so it rarely flashes into a crash: 0.5% of its flashes crash that tick, against 1.7% for the rest's, and 1.4% of its plain jumps crash within 0.3 s of taking off. And its craving keeps it stocked with golden jumps. It's tuned by simulation into the same 15–35% band as everyone. Tried and no better (Star in every round, both seeds): more room wanted (`margin` 6); more fear of heads (`headRisk` 900); no habitual jumps (22 / 19%: they neither help nor hurt measurably, and stay because they're the character); the plain jump at a third of its price; `space` 1.4 with `territory` 1.0.

**Its voice.** A jolly old-timer who can't stop showing off, and is never mean: "Whee! Still got it!", "In my day we flashed uphill both ways!" It has a line for every moment anyone has (but the ones that are one voice's own) and four of its own:
- **Showing off** (`zoom`): any plain flash of its own, not just one that beats someone to food or shoots past a head (those keep their `flash.first` and `flash.past` lines); its jumps too, half the time, and all of them together at most every 10 s. Its golden dashes and golden jumps it always cheers when it can talk. `ready`, its flash back ("Back in business!"), comes only once the flash has been back a second: it flashes the tick its rest ends, so that's rare (about 0.4 a round). As first built, `ready` came a tick before almost every flash and was its commonest line (197 of 928, now 20). The numbers in the next lines are from before the critique: since, a flash is cheered about one time in five (21%, from 11%), and a round repeats fewer of its lines (53 from 79, in 48 rounds). In whole AI rounds (60, Star in every one, the chatter's own chances) that's about one plain flash in ten cheered (139 of 1,401), one plain jump in seven and a show-off every 19 s alive, never two within 10 s; half of them are `ready` lines. At its most addicted (staged: a flash every 6 s and a jump every 4, for three minutes) it shows off 12 times.
- **Grumbling** (`resting`): while its flash rests, half its small talk ("Rest, rest, rest. I'll rest when I'm old!").
- **Its stash** (`stash`): a golden beetle it eats ("Golden! Straight in the tank."); a golden leaf gets a golden-flash line as it eats it ("Out of my way, I'm golden!"), since it spends the leaf's flashes there and then. Since the critique, Star's own moments (golden power food, a rainbow, its kill, being cut) are never crowded out by its showing off: it says them every time it can talk (from 39–57% before). A golden mushroom gets its `wrap` lines and a golden apple its `golden` one instead, its own for both; a plain apple it mentions a third as often as anyone (5% of them, against 15%: at 15%, two lines in five were about apples).
- A rainbow is family ("Family!", "Oh, look at you! You've grown!"): Star speaks first if it's alive and free to talk, and otherwise someone else does, as before. In those rounds it greeted half the rainbows it saw (14 of 28).
- Now and then (a quarter of its show-offs, at most every 40 s, 1.1 s later) Wildcard brags back ("Fast? I invented fast, Star.") or Mason answers in Latin ("Festina lente, Star!"): about one a round in four.
- Its kill and win lines ("Make a wish.", "Not bad for an old-timer.") never repeat its chatter. ("Too slow, sonny!" was too close to another game's famous taunt.) Its start-card line: "Jumps and flashes every chance it gets. Catch it when it dims." It joins the gigglers at Mason's *Biggus Dickus* ("Har har! Oh, my mustache!").

All told it says about eight lines a minute alive. Every line has its Chinese for Copycat: 805 lines now (717 before), 776 Chinese, 173 punchlines (142). Also since the critique, for everyone: a golden dash that cuts someone gets the dasher's snip line (a tail off) or its kill line (in two), and its dash line only when those can't be said.

**The cast** is eighteen now. Star's dot on the tags is a little rainbow round a sunflower middle. Its colour in text is a darker yellow than its star: its persona colour, `#eab308`, which its name in the log and the Hall of Fame and a bubble's edge use, against the drawn sunflower `#f9c22e`.

**Copycat copying Star** wears a pale copy of its rainbow (each hue 0.45 toward white), flowing in step with Star's and holding still with reduced motion, with pale rainbow beads; as a single colour (its tag dot's middle, and where one colour is all there is) it's a pale violet, `#d19df7`. (*Since round six A* its head keeps the flag's red and its tag dot is its own starred one in every state: see "Copycat in the flag's red". The pale violet stays where one colour is all there is.) It used to take Star's text yellow, lightened: a pale gold snake, as if it held a power, and its gold line all but vanished when it did. It copies Star a third of its living time when they share a round. **Star's burst** (and Copycat's while it copies Star) is a shockwave of six rainbow arcs and rainbow pieces, and its knock-out sparks are rainbow: they were the gold and cream of a golden pickup.

**Along the way, for everyone.** A face's turn is settled once a frame, before its shadow and outlines, so across a wrapped edge a face no longer turns twice as fast; an eaten bead's crumbs are the bead's own colour, not its owner's.

**Worth a look.** Two things the build left for the owner's eye: the rainbow's lemon segment (hue 55) can sit right behind gold pips, the closest thing on the board to Honey, though it reads as part of the rainbow; and dim Star's points are close in tone to the Honey line round it at phone size, kept apart by the ink between them (`mobile-star-gold.jpg` in the shots tour shows both).

### Round five, measured

AI-only rounds as `tools/simulate.js` plays them, 600 a seed on seeds 3 and 11 ("seed 3 / seed 11").
- **Final** (after the critique: Star's jumps keep clear of a landing a rival could take, and its golden dashes cost what anyone's do): fingerprints 324380661 / 626189426, both `--check` ok. `simulate.js 60 --seed 3` gives 83753295 with and without `--ahead`. Star wins 31 / 33%, everyone 19–34 / 17–33%, all inside the band; with Star in every round, 28.4% over 800. Its golden dashes thrown away within 3 ticks of a leaf: 18 / 15% (69 / 65%). Its cuts a round: 0.08 / 0.12 (0.02 / 0.01). Its jumps refused and crashed the same tick: 0.12 / 0.09 a round (0.46 / 0.47), against 0.06–0.25 for the rest. Flashes and jumps unchanged (9.4 a minute, about 11 a round). Rounds drawn without Star play exactly as before.
- **As built**, before the critique (f8ef647; Star's AI 4be85d2's): fingerprints 182329352 / 527997748; `simulate.js 60 --seed 3` 673618742. The rest of this section is from this build unless it says otherwise.
- **The round:** median 172 / 172 s, sudden death 52 / 52 s, starving 2 / 3% of deaths (round four's final: 170 / 171 s, 50 / 51 s, 3 / 2%).
- **Win rates:** Star 27 / 29% as built (31 / 33% final), and everyone inside the band on both seeds, 20–33 / 17–32% (Ghost on top on seed 3, Drab on seed 11).
- **The census's pooled numbers now include Star's habit:** plain flashes 2.6 / 2.5 a minute alive (2.1 in round four's final), plain jumps 6.3 / 6.1 a round (3.8). Round four's flash target was written against the pooled number, so read it per persona now: the rest flash 2.2 times a minute.

Per persona, from a scratch census of the same rounds (the same fingerprints), Star (about 131 rounds a seed) against the rest weighted together:

| | Star | The rest |
|---|---|---|
| Plain flashes a minute alive | 9.5 / 9.5 | 2.2 / 2.2 |
| Plain jumps a round | 11.7 / 11.2 | 1.0 / 1.0 |
| Golden power food eaten a round | 1.55 / 1.30 | 0.68 / 0.69 |
| Golden apples a round | 1.6 / 1.4 | 1.3 / 1.3 |
| Golden jumps a round | 1.7 / 1.6 | about 0.7 |
| Golden flashes a round | 0.85 / 0.53 | 0.36 / 0.33 |
| Flashes that crash that tick | 0.3 / 0.6% (10 of 3,103; 18 of 3,023) | 1.8 / 1.5% |
| A crash or out within 3 s of a flash | 7 / 8% | 15% |
| Crashes survived a round | 3.4 / 3.3 | 2.7 |
| Alive a round | 149 / 145 s | 152 / 154 s |
| Food eaten a round | 62 / 60 | 54 / 55 |

- **Its jumps** (200 rounds with Star in every one, seed 3): none crashed the tick it took off, and 33 of 2,311 (1.4%) crashed within 0.3 s; the rest's, nearly all out of a crash already, 73 of 572 (13%).
- **Its deaths:** a body 55 / 54%, then itself 19% and holes 12% on seed 3, holes 18% and itself 15% on seed 11. It starves in about 2% of its rounds and never blows itself up.
- **Its thinking** (`decide()`) costs no more than anyone's (a quiet run of 80 rounds: mean 0.65 ms, p99 3.2, against 0.78 and 3.5 for the rest): it's rarely rested, so it weighs the flash less often.
- **Its look:** as paths, the star and its mustache cost the GPU about 0.57 ms a frame on the long-snake scene, so they're a sprite (see "Prerender" under Skipped or adapted). Against bf81687, interleaved in one browser (16 rounds, the quickest of 12 batches, 800×800 at 2x): the `long-star` scene (the long-snake scene with Star in Sniper's seat) 1.05 times (rounds 0.85 to 1.19), the `long` scene without Star 0.96 times (0.73 to 1.17), both within noise. `tools/bench.js` times `long-star` beside `long`.
- **Its voice:** above, under "Its voice" (60 whole rounds on the chatter's own chances, seed 5).
- **Tests:** `tools/rules-test.js` has nine checks of Star's habit (five fail on the stub), `tools/render-test.js` six of its look (five fail on the stub; the sixth, its rainbow holding still with reduced motion, passes on the stub's plain fade anyway), and `tools/chatter-test.js` plays its voice through (297 checks of the chatter and the sound, from 250).

