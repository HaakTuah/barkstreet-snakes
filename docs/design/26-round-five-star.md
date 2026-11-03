## Round five: Star

**The owner's idea**, **Why it belongs** and **How it plays**: their rules are in `39-the-rivals.md` under "Star",
and their text as it was in `docs/archive/design-rivals.md`.

**The look** and **The tell: a countdown on its five points**: their rules are in `03-the-snake-as-a-character.md`
under "Star" and "The tell: a countdown on its five points", and their text as it was, with why a countdown, in
`docs/archive/design-looks.md`.

**Its voice.** A jolly old-timer who can't stop showing off, and is never mean: "Whee! Still got it!", "In my day we flashed uphill both ways!" It has a line for every moment anyone has (but the ones that are one voice's own) and four of its own:
- **Showing off** (`zoom`): any plain flash of its own, not just one that beats someone to food or shoots past a head (those keep their `flash.first` and `flash.past` lines); its jumps too, half the time, and all of them together at most every 10 s. Its golden dashes and golden jumps it always cheers when it can talk. `ready`, its flash back ("Back in business!"), comes only once the flash has been back a second: it flashes the tick its rest ends, so that's rare (about 0.4 a round). As first built, `ready` came a tick before almost every flash and was its commonest line (197 of 928, now 20). The numbers in the next lines are from before the critique: since, a flash is cheered about one time in five (21%, from 11%), and a round repeats fewer of its lines (53 from 79, in 48 rounds). In whole AI rounds (60, Star in every one, the chatter's own chances) that's about one plain flash in ten cheered (139 of 1,401), one plain jump in seven and a show-off every 19 s alive, never two within 10 s; half of them are `ready` lines. At its most addicted (staged: a flash every 6 s and a jump every 4, for three minutes) it shows off 12 times.
- **Grumbling** (`resting`): while its flash rests, half its small talk ("Rest, rest, rest. I'll rest when I'm old!").
- **Its stash** (`stash`): a golden beetle it eats ("Golden! Straight in the tank."); a golden leaf gets a golden-flash line as it eats it ("Out of my way, I'm golden!"), since it spends the leaf's flashes there and then. Since the critique, Star's own moments (golden power food, a rainbow, its kill, being cut) are never crowded out by its showing off: it says them every time it can talk (from 39–57% before). A golden mushroom gets its `wrap` lines and a golden apple its `golden` one instead, its own for both; a plain apple it mentions a third as often as anyone (5% of them, against 15%: at 15%, two lines in five were about apples).
- A rainbow is family ("Family!", "Oh, look at you! You've grown!"): Star speaks first if it's alive and free to talk, and otherwise someone else does, as before. In those rounds it greeted half the rainbows it saw (14 of 28).
- Now and then (a quarter of its show-offs, at most every 40 s, 1.1 s later) Wildcard brags back ("Fast? I invented fast, Star.") or Mason answers in Latin ("Festina lente, Star!"): about one a round in four.
- Its kill and win lines ("Make a wish.", "Not bad for an old-timer.") never repeat its chatter. ("Too slow, sonny!" was too close to another game's famous taunt.) Its start-card line: "Jumps and flashes every chance it gets. Catch it when it dims." It joins the gigglers at Mason's *Biggus Dickus* ("Har har! Oh, my mustache!").

All told it says about eight lines a minute alive. Every line has its Chinese for Copycat: 805 lines now (717 before), 776 Chinese, 173 punchlines (142). Also since the critique, for everyone: a golden dash that cuts someone gets the dasher's snip line (a tail off) or its kill line (in two), and its dash line only when those can't be said.

**The cast**, **Copycat copying Star**, **Along the way, for everyone** and **Worth a look**: their rules are in
`03-the-snake-as-a-character.md` (under "Star", "Copycat copying Star" and "Your snake"), and their text as it was
in `docs/archive/design-looks.md`.

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

