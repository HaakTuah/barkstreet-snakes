## Round six A: fairness and fixes

After Star, the owner played and sent a long run of notes. They became a plan of three PRs, built one after another:
- **A** (this one): fairness and fixes;
- **B**: the new moves and the rivals' power styles;
- **C**: weather, fire, polish, a gentler start and a last optimization pass.

Three rules from the owner hold for all of them:
- **Every new rule has a visible cue and a lesson** (a one-time banner, and a row in the Field guide). The owner called it a "very important point": "Add that!"
- **Every rival accounts for every change** (the owner: "make sure every rival account for every gameplay change you make!"). It uses the new rule when it pays and sees it used against it, through the same engine calls as a person.
- **Every rival keeps its trademark.** Mason's straight lines (the owner: "Keep watch!"), Ouroboros's coils, Creeper's tail-riding and the rest are measured before and after.

**Choking on your own tail**: its rules as they stand now (your own beads are squashed: the choke, the cough and
the nudge are gone) are in `41-crashes.md` under the same name, the roll rule (now the spit's) in `40-powers-and-moves.md` under "Where it rolls is a rule,
never chance", and its text as it was, with its measurements, in `docs/archive/design-powers.md`.

**A pecked flag is a lost colony**: its rules are in `44-realms-and-colonies.md` under the same name, and its text
as it was in `docs/archive/design-realms.md`.

**Star's mustache** and **Bridges and jumps you can see**: their rules are in `03-the-snake-as-a-character.md` under
the same names, and their text as it was, with what the bridges and jumps cost, in `docs/archive/design-looks.md`.

**The woodpecker plays fair** (with **The log stays one piece**, **It knocks food aside** and **The ring is a
promise**; **No crumbs** and **Rounder hollows** gave way to its outline, "It cuts a shape"): its rules are in `38-the-woodpecker.md` under those names, and its text as it was, with its
measurements, in `docs/archive/design-woodpecker.md`.

**Rivals see food as it is**, and **Less fruit, more beetles** with **Fewer beetles after all**: their rules are in
`04-food-and-the-world.md` under those names, and their text as it was, with its measurements, in
`docs/archive/design-food.md`.

**A strike that doesn't stutter**: its rules are in `38-the-woodpecker.md` under the same name, and its text as it was,
with its measurements, in `docs/archive/design-woodpecker.md`.

**A woodpecker you can believe**: its rules are in `38-the-woodpecker.md` under the same name, and its text as it was,
with its measurements, in `docs/archive/design-woodpecker.md`.

**Copycat in the flag's red** and **Star's rainbow streams**: their rules are in `03-the-snake-as-a-character.md` under
the same names, and their text as it was, with how Copycat's red was checked and measured, in
`docs/archive/design-looks.md`.

**Phones**: their rules are in `31-phones.md`, and this note as it was in `docs/archive/design-page.md`.

**Controls anyone can guess**: its rules are in `42-controls.md` under the same name, and its text as it was, with
what was measured, in `docs/archive/design-page.md`.

**On a friend's screen** (protocol 10, wave 2): what the beetles and burrows send is in `04-food-and-the-world.md`
("Online" under "Less fruit, more beetles"), the woodpecker's knocks and promised landings in `38-the-woodpecker.md`
("Online"), the general rules in `22-play-with-friends-online.md`, and this paragraph as it was, with what crossed on
which seeds, in `docs/archive/design-online.md`.

### Round six A, measured

AI-only rounds as `tools/simulate.js` plays them, 600 a seed. Every build is played by the same `simulate.js` (the rivals' pass's, unchanged since, whose census also counts meals mid-round, knocked food eaten where it landed and digs caught), so every column is like for like: screened on seeds 3 and 11 ("seed 3 / seed 11"), then confirmed on fresh seeds 29 and 41. The builds:
- **main**: 2d95a2d, main before PR A (round five's final);
- **wave 1**: 8d9cde2, round six A before wave 2;
- **before the critique**: 554ebf4, wave 2 with the rivals' pass, the dig 5 ticks from a head within 7, beetles at 0.012 a tick;
- **final**: what PR A ships, 15d51d7 (what came after changes no simulated round: the knock's arc is drawing and sound, the rest words).

The numbers under each call above were measured as each part was built, against the build before it; where one differs from what this section's way of playing gives the same build (wave 2's sealed deaths, 2.8 / 2.3% by its own census, are 0.9 / 0.8% played this way), this section's is the like-for-like one.

| | main | wave 1 | before the critique | final |
|---|---|---|---|---|
| Median round | 172 / 172 s | 168 / 168 s | 165 / 165 s | 166 / 166 s |
| Sudden death, median | 52 / 52 s | 48 / 48 s | 45 / 45 s | 46 / 46 s |
| Deaths: body, self, hole, wall, head-on, pecked, starved | 43, 23, 20, 4, 3, 4, 2 / 41, 24, 20, 4, 3, 4, 3% | 46, 25, 18, 5, 2, 3, 2 / 45, 24, 18, 5, 3, 3, 3% | 47, 31, 10, 5, 3, 3, 1 / 49, 29, 11, 4, 3, 2, 1% | 46, 31, 11, 4, 3, 3, 1 / 47, 29, 10, 4, 3, 3, 2% |
| Sudden death's deaths: body, self, hole | 36, 25, 25 / 36, 25, 23% | 38, 27, 23 / 39, 26, 22% | 42, 34, 13 / 45, 32, 14% | 42, 34, 14 / 44, 31, 13% |
| ...of them sealed in by a mark (out within 3 s of its strike) | 21.0 / 21.0% | 21.0 / 20.4% | 1.3 / 1.0% | 1.2 / 1.1% |
| Into holes, a woodpecker round | 0.60 / 0.59 | 0.55 / 0.53 | 0.32 / 0.34 | 0.35 / 0.31 |
| Marks shutting a snake in, a round | 0.89 / 0.97 | 0.88 / 0.90 | 0.04 / 0.03 | 0.04 / 0.03 |
| Crumbs: islands of 1–2 cells cut off, a woodpecker round | 3.32 / 3.23 | 2.91 / 2.93 | 0 / 0 | 0 / 0 |
| Last snakes on islands of their own; the biggest island's wins (a blind pick) | 28 / 31%; 60.5 / 64.0% (48.4 / 48.8) | 25 / 25%; 65.8 / 60.5% (49.0 / 49.2) | 31 / 23%; 48.6 / 50.0% (49.2 / 49.1) | 32 / 30%; 38.9 / 48.9% (49.5 / 49.1) |
| Meals a snake-minute mid-round (0:45 to the woodpecker) | 22.2 / 22.3 | 23.7 / 23.5 | 21.5 / 21.6 | 21.6 / 21.7 |
| Snake-time in the hunger warning before the woodpecker (starving) | 8.7 / 8.6% (2.2 / 2.1) | 7.5 / 7.5% (1.7 / 1.8) | 8.0 / 7.9% (1.6 / 1.5) | 10.0 / 9.9% (1.9 / 2.0) |
| ...after it (starving) | 28.2 / 28.5% (14.8 / 15.2) | 24.7 / 24.0% (12.1 / 11.7) | 16.0 / 15.6% (6.3 / 5.9) | 19.2 / 18.9% (8.1 / 7.9) |
| Beetles out a round; of those, caught, down a burrow, dug in | 7.7 / 8.0; 48, 50, 0 / 47, 51, 0% | 5.8 / 5.7; 90, 10, 0 / 90, 10, 0% | 21.6 / 21.4; 71, 11, 17 / 71, 11, 17% | 15.4 / 15.4; 70, 22, 8 / 70, 23, 7% |
| Beetles caught a round (golden beetles out) | 3.7 / 3.7 (1.64 / 1.63) | 5.2 / 5.1 (2.08 / 2.04) | 15.3 / 15.2 (1.99 / 2.02) | 10.7 / 10.7 (1.82 / 1.83) |
| Chased beetles escaping (down a burrow; dug in); a catch after a median of | 49.1 / 50.3% (47.2 / 48.4; –); 17 / 16 ticks | 9.0 / 8.9% (8.8 / 8.8; –); 6 / 6 | 21.2 / 21.1% (10.1 / 10.1; 11.0 / 10.8); 5 / 5 | 27.7 / 27.2% (19.7 / 19.8; 7.8 / 7.3); 8 / 8 |
| Digs a round (caught while digging); dives into a burrow a dig left | – | – | 6.50 / 6.49 (2.84 / 2.79); 1.04 / 1.08 | 5.91 / 5.88 (4.74 / 4.79); 0.65 / 0.56 |
| Chokes a round (food nudged aside coughing) | – | 1.21 / 1.16 (2.50 / 2.19) | 1.18 / 1.09 (2.60 / 2.21) | 1.18 / 1.23 (2.56 / 2.53) |
| Beads eaten a round (by the snake they broke off) | 67.3 / 68.9 (19.5 / 18.9%) | 67.3 / 66.2 (none) | 65.3 / 64.3 (none) | 62.7 / 64.1 (none) |
| Food knocked aside a round (eaten where it landed, within 6 s) | – | – | 6.72 / 5.75 (2.42 / 1.95) | 5.30 / 5.69 (2.05 / 1.98) |
| Win rates, lowest–highest | 19–34 / 17–33% | 18–32 / 18–30% | 15–34 / 15–33% | 13–33 / 18–32% |
| Fingerprints | 324380661 / 626189426 | 884709721 / 728378271 | 726173739 / 778649782 | 929824260 / 514618204 |

- **Beetles out** counts every time a beetle is above ground and how that ends, whoever was near, so it compares across all four builds. A *chase* counts from a head within `BEETLE_FEAR`, which was 4 cells until the critique and is 6 in the final, so the final's escapes count chases the others don't: there, the beetles-out row is the like-for-like one.
- **The biggest island**, once the last snakes are each on one of their own, wins about 43% over the final's five seeds against a blind pick's 49% (main about 61%, wave 1 about 60%, over seeds 3, 11, 29 and 41): the island you're left on no longer settles the round.
- **A round's food:** fewer meals mid-round than with wave 1 (21.6 a snake-minute against 23.7) and a little under main's (22.2), more of them beetles (three caught for every one on main); the hunger warning before the woodpecker about 10% of snake-time against main's 8.7%, as the critique's retune meant. Starving is rarer than on main all the same (1–2% of deaths against 2–3%; after the woodpecker 8% of snake-time against 15%), with beetles still coming out in sudden death and the food in a mark knocked aside to be eaten.

**On fresh seeds 29 and 41** ("seed 29 / seed 41"), the same story:

| | main | wave 1 | before the critique | final |
|---|---|---|---|---|
| Median round | 169 / 171 s | 169 / 168 s | 164 / 165 s | 166 / 167 s |
| Sudden death, median | 49 / 51 s | 49 / 48 s | 44 / 45 s | 47 / 47 s |
| Deaths: body, self, hole, starved | 43, 22, 19, 3 / 42, 23, 20, 3% | 47, 22, 18, 1 / 45, 26, 17, 2% | 49, 29, 10, 1 / 49, 31, 11, 1% | 47, 29, 12, 2 / 46, 29, 14, 1% |
| Sudden death's deaths sealed in by a mark | 19.5 / 21.1% | 20.1 / 19.4% | 1.1 / 1.2% | 1.9 / 1.4% |
| Into holes, a woodpecker round | 0.58 / 0.59 | 0.54 / 0.51 | 0.31 / 0.33 | 0.38 / 0.41 |
| Marks shutting a snake in, a round | 0.88 / 0.88 | 0.85 / 0.89 | 0.03 / 0.03 | 0.05 / 0.04 |
| Crumbs, a woodpecker round | 3.04 / 3.40 | 2.86 / 2.88 | 0 / 0 | 0 / 0 |
| The biggest island's wins (a blind pick) | 57.7 / 61.9% (49.3 / 48.9) | 49.3 / 62.8% (48.9 / 49.3) | 43.0 / 49.7% (49.2 / 49.2) | 41.0 / 40.9% (48.5 / 49.0) |
| Meals a snake-minute mid-round | 22.5 / 22.2 | 23.5 / 23.5 | 21.7 / 21.7 | 21.6 / 21.7 |
| Snake-time in the hunger warning before the woodpecker (starving) | 8.7 / 8.9% (2.1 / 2.2) | 7.6 / 7.6% (1.8 / 1.8) | 7.9 / 7.8% (1.6 / 1.5) | 10.1 / 9.9% (1.9 / 1.9) |
| Beetles out a round; of those, caught, down a burrow, dug in | 7.9 / 7.7; 47, 50, 0 / 47, 51, 0% | 5.5 / 5.5; 90, 10, 0 / 90, 10, 0% | 21.6 / 21.2; 71, 11, 17 / 72, 10, 17% | 15.6 / 15.4; 70, 22, 7 / 70, 22, 7% |
| Beetles caught a round | 3.7 / 3.6 | 5.0 / 5.0 | 15.3 / 15.2 | 10.9 / 10.8 |
| Chased beetles escaping | 49.9 / 50.0% | 8.8 / 7.8% | 21.0 / 20.5% | 27.5 / 27.0% |
| Digs a round (caught while digging) | – | – | 6.62 / 6.46 (2.82 / 2.83) | 5.77 / 5.82 (4.61 / 4.67) |
| Chokes a round | – | 1.14 / 1.25 | 1.15 / 1.18 | 1.19 / 1.18 |
| Food knocked aside a round (eaten where it landed, within 6 s) | – | – | 5.48 / 6.60 (2.08 / 2.34) | 7.18 / 6.21 (2.51 / 2.34) |
| Win rates, lowest–highest | 18–38 / 17–30% | 12–34 / 11–34% | 15–38 / 18–32% | 19–33 / 13–34% |
| Fingerprints | 9761859 / 193881378 | 261281183 / 404020809 | 861582064 / 95998844 | 619811823 / 926338946 |

**Win rates by personality.** The final on five seeds, 600 rounds each (about 130 rounds a persona on one seed, so ±7 points is noise, and about 660 over the five, ±3), against main and wave 1 over seeds 3, 11, 29 and 41 together (about 530 rounds a persona, ±4):

| | main | wave 1 | final: 3 | 11 | 29 | 41 | 53 | all five |
|---|---|---|---|---|---|---|---|---|
| Ghost | 26.0 | 24.8 | 32.7 | 31.9 | 33.3 | 30.7 | 30.1 | 31.8 |
| Mute | 32.1 | 29.7 | 27.9 | 28.3 | 30.5 | 29.3 | 32.3 | 29.6 |
| Mason | 24.9 | 28.3 | 27.2 | 22.6 | 27.3 | 29.9 | 31.6 | 27.6 |
| Copycat | 30.3 | 28.4 | 25.4 | 25.5 | 28.2 | 27.3 | 29.5 | 27.2 |
| Sovereign | 25.7 | 29.2 | 29.2 | 27.0 | 28.9 | 29.1 | 20.3 | 26.9 |
| Vulture | 22.7 | 25.9 | 29.4 | 22.8 | 28.8 | 27.3 | 24.8 | 26.7 |
| Capricious | 22.0 | 26.5 | 25.8 | 24.4 | 25.7 | 33.6 | 21.0 | 26.0 |
| Drab | 25.1 | 25.3 | 24.8 | 29.0 | 18.7 | 26.7 | 30.9 | 25.9 |
| Ouroboros | 23.8 | 25.3 | 26.7 | 27.4 | 24.4 | 20.6 | 26.6 | 25.1 |
| Metagamer | 28.0 | 25.6 | 23.2 | 25.4 | 21.7 | 24.1 | 28.0 | 24.5 |
| Star | 28.7 | 25.3 | 22.9 | 22.7 | 28.8 | 23.3 | 24.6 | 24.5 |
| Colonist | 25.0 | 23.9 | 27.7 | 24.4 | 19.1 | 19.4 | 30.0 | 24.1 |
| Wildcard | 21.8 | 22.2 | 26.4 | 25.8 | 22.0 | 27.5 | 18.9 | 24.1 |
| Sniper | 24.6 | 25.0 | 20.5 | 20.3 | 19.9 | 28.3 | 29.1 | 23.6 |
| Joker | 21.8 | 22.2 | 25.0 | 23.2 | 27.1 | 13.3 | 24.8 | 23.0 |
| Creeper | 23.8 | 26.1 | 23.6 | 23.2 | 19.4 | 19.9 | 19.4 | 21.2 |
| Desperado | 21.8 | 21.6 | 17.1 | 24.8 | 21.6 | 15.9 | 17.8 | 19.3 |
| Gobbler | 20.9 | 14.8 | 12.9 | 18.5 | 24.6 | 23.7 | 12.7 | 18.3 |

- **The band.** Over the five seeds everyone is inside 15–35%, from Gobbler at 18.3% to Ghost at 31.8% (main 20.9–32.1% and wave 1 14.8–29.7% over their four seeds; wave 1's Gobbler was out). On one seed alone three results are just under the floor (Gobbler on seeds 3 and 53, Joker on 41), and none is over 35.
- **Vulture and Mute**, past 35% on a fresh seed after the rivals' pass, are 28.8 / 27.3% and 30.5 / 29.3% on seeds 29 / 41 now, 26.7% and 29.6% over the five.

**Trademarks**, seed 3 / seed 11, the field (everyone else together) in brackets, and the final over all five seeds:

| | main | wave 1 | final | final, all five |
|---|---|---|---|---|
| Mason, straight run | 3.52 / 3.52 (1.88 / 1.88) | 3.51 / 3.51 (1.89 / 1.89) | 3.50 / 3.49 (1.91 / 1.91) | 3.51 (1.91) |
| Mason, body beside itself | 25.7 / 26.1% (31.5 / 31.6%) | 26.9 / 27.5% (32.6 / 32.8%) | 27.0 / 26.9% (32.2 / 32.2%) | 27.0% (32.3%) |
| Ouroboros, coiled (10 long or more) | 42.1 / 41.6% (14.4 / 14.7%) | 40.7 / 39.4% (14.0 / 14.1%) | 41.7 / 41.3% (14.2 / 14.1%) | 41.9% (14.2%) |
| Creeper, riding a tail | 3.7 / 3.7% (1.8 / 1.8%) | 3.9 / 4.1% (1.9 / 1.9%) | 4.1 / 3.8% (1.8 / 1.8%) | 3.9% (1.8%) |
| Ghost, cells from the nearest head | 11.10 / 11.07 (9.72 / 9.75) | 11.06 / 11.09 (9.71 / 9.78) | 11.04 / 10.96 (9.63 / 9.67) | 10.99 (9.67) |
| Gobbler, share of the food | 27.7 / 27.6% (24.8 / 24.9%) | 27.3 / 28.8% (24.9 / 24.8%) | 28.2 / 25.2% (24.8 / 25.0%) | 27.2% (24.9%) |
| Vulture, share of the beads | 34.7 / 33.5% (24.4 / 24.6%) | 34.3 / 33.4% (24.4 / 24.6%) | 34.1 / 31.8% (24.5 / 24.7%) | 33.5% (24.5%) |
| Sovereign, at home | 61.9 / 63.3% | 61.4 / 63.2% | 61.8 / 63.9% | 63.1% |
| Mute, closing the box | 8.1 / 8.0% (8.1 / 8.0%) | 8.0 / 7.8% (8.0 / 7.8%) | 8.1 / 8.0% (8.0 / 7.9%) | 8.0% (7.8%) |
| Joker, luring a rival on | 9.2 / 9.0% (8.5 / 8.3%) | 9.0 / 8.5% (8.5 / 8.2%) | 8.9 / 8.5% (8.4 / 8.4%) | 8.6% (8.3%) |
| Desperado, skimming danger | 40.2 / 41.3% (36.4 / 36.6%) | 40.7 / 41.4% (36.7 / 36.9%) | 41.1 / 40.8% (36.4 / 36.4%) | 40.9% (36.5%) |
| Star, flashes a minute | 9.73 / 9.67 (2.30 / 2.28) | 9.75 / 9.76 (2.33 / 2.30) | 9.69 / 9.72 (2.22 / 2.21) | 9.69 (2.23) |
| Star, jumps a minute | 5.10 / 5.30 (0.66 / 0.64) | 5.25 / 5.20 (0.78 / 0.77) | 4.96 / 5.03 (0.67 / 0.67) | 4.93 (0.68) |

Every trademark leads the field on every seed but one: Mute's boxing is level with it on seed 29 (7.65 against 7.73%; on main it trailed on seeds 3 and 11 too, so it's no loss); and Gobbler's share of the food on seed 11 is barely ahead (25.2 against the field's 25.0%; with Gobbler in every round it leads by 2.6 points or more on every seed, below). Mute's boxing and Joker's luring were only a few tenths of a point over the field on main too: neither shows on a simple measure, before or after.

**Gobbler, at the floor.** One persona's rate on one seed is about 130 to 150 rounds, so its dips are mostly the draw: it's 12.9% on seed 3 and 12.7% on seed 53, but 24.6% and 23.7% on 29 and 41.
- *With Gobbler in every round.* A copy of the engine seats Gobbler in every round, in a seat at random beside three drawn as usual (four and a half times the rounds a natural draw gives it; for measuring only, not in the game): 600 rounds a seed, it wins 14.3 / 17.5 / 16.5 / 18.8% on seeds 3 / 11 / 29 / 41, 16.8% ±1.5 over the 2,400. Its share of the food is 27.3% against the field's 24.2%, ahead by 2.6 to 3.6 points on every seed (seed 11's natural +0.2 was its 150 rounds). Inside the band, near its floor, its trademark clearly ahead.
- *Retuning it didn't move it.* Each was tried with Gobbler in every round, screened on seeds 3 and 11 (its base there: 14.3 and 17.5%, 15.9% over both): `hurry` 1.0 (17.0% on seed 3), `territory` 0.6 (16.5) and 1.0 (17.8), `space` 2 (14.7), `margin` 14 (15.0), `food` 4 and 14 (18.8, 17.2), `contested` 0.5 (15.7), `distance` 2 (15.7); territory 0.6 with hurry 1.0 (16.7), with beads worth 2 (15.0), with an eat bonus of 150 (15.8), and with margin 14 (18.7 over seeds 3 and 11) or 18 (19.2 on seed 3); that with fed past 30 or 40 long (17.8, 17.5 over 3 and 11) or food 7 (17.2); territory 1.0 with hurry 1.0 (17.8 over 3 and 11), with margin 14 (18.4), and that with head fear 3000 / 1000 (17.0); food 5 and 7 (17.4 and 18.8 over 3 and 11), food 7 with contested 0.5 (15.0); `thick` 15 and `aggression` 0.5 (17.0 and 16.0 over seeds 3 and 29, base 15.4).
- *The best didn't hold where they weren't chosen.* Food 7 (+2.9 points over seeds 3 and 11, 1,200 paired rounds) was −2.5 [−5.4, +0.4] on fresh seeds 29 and 41, 17.0% over the four (base 16.8); territory 0.6 with margin 14 (+2.75) was −1.7 [−5.7, +2.4] in the natural rounds of all five seeds; hurry 1.0, the critique's first pick, is +0.5 [−1.5, +2.5] over the four (17.3%). abtest on fresh seeds 29 and 41 (natural rounds, 1,200 pairs) found the round, sudden death and every trademark the same or undecided for food 7 and for territory with margin, and Gobbler 24.1% → 18.0 and 19.5%, undecided.
- *So its weights stay as they were:* none moves it beyond the noise, and its share of the food leads at any of them. What costs it is the endgame. It grows the longest of the cast and dies in sudden death, into a body: 78% of its deaths come after 2:00, 52.9 cells long against the others' 30 to 50 (100 rounds of seed 3), and once nothing grows nobody's food drive eases. A lever there would be a behaviour of its own, a call for round six B.

**The rivals' thinking** (`tools/bench-ai.js`: 4000 positions from the base's seed-3 rounds, both copies side by side in one process, each position timed 3 times in each and the best kept). Against main, the final decides 2.07 times faster on average (0.740 → 0.357 ms), 1.90 times at the 99th percentile (1.66 → 0.88 ms) and 1.77 times by the deciding thread's CPU (0.85 → 0.48 ms); every persona 1.89–2.38 times (Vulture the least, Star the most). That's round six A's optimization (2.26 times on its own), less a little for what the rivals weigh now: two beetles, the dig, knocked food, the roll. Against wave 1, which had the optimization already, it's as quick with all of that: 1.03 times on average, 1.18 at the 99th percentile (0.634 → 0.537 ms). (126 of main's positions and 79 of wave 1's, of 4000, went another way: the rivals play by new rules.)

**What the checks cost.** Each suite alone, in turn through the machine's queue, on this laptop: the CPU of every process it starts, Chrome's too (read from a Windows job object, so a process that has exited still counts), and in brackets the wall time, in seconds. Other work on the machine slowed the browser suites' wall times most. Main had no CI and no layout-test (it came with the phones PR); wave 1 had CI without layout-test.

| | main | wave 1 | final |
|---|---|---|---|
| rules-test | 34.5 (31.6) | 15.5 (13.2) | 9.2 (6.1) |
| online-test | 74.0 (68.0) | 11.0 (8.6) | 7.2 (5.4) |
| chatter-test | 23.9 (20.3) | 6.5 (4.6) | 5.6 (3.9) |
| records-test | 0.1 (0.1) | 0.2 (0.2) | 0.1 (0.2) |
| CI's same rounds with and without `--ahead` | – | 26.6 (13.9) | 28.9 (15.4) |
| render-test | 33.5 (28.6) | 31.3 (22.1) | 38.8 (31.3) |
| input-test | 63.1 (178.7) | 39.3 (83.6) | 56.9 (118.7) |
| layout-test | – | – | 703.5 (750.9) |
| CI's Node job; its browser job | – | 60; 71 | 51; 799 |

- **The Node side** checks more than main's did (the chokes and the roll, the dig, two beetles, knocked food and its promise, the burrows, the rivals' reading of each) for a sixth of the CPU: its four suites take 22 s against main's 132, and the whole Node job, the determinism step with them, 51 s. That's round six A's optimization and its trimmed suites (online-test plays three seeded rounds, not 20), net of what the rounds now hold. The determinism step's rounds give 598984826, 821302142 and 850375113 with and without `--ahead`.
- **layout-test is now nearly all of CI:** 704 s of CPU and 12.5 minutes here (9.7 on a quieter run at the finish), most of the browser job, whose limit is 20 minutes. It's the suite to keep an eye on.

**Fingerprints** of the final: 929824260 / 514618204 on seeds 3 / 11, 619811823 / 926338946 on seeds 29 / 41 and 489507655 on seed 53, 600 rounds each; `simulate.js 60 --seed 3` gives 78597151 with and without `--ahead` (582354997 before the critique, 129285676 for the rivals' pass, 83753295 on main).

**On the way.** Two builds came between wave 1 and the critique, played the same way: wave 2's rules (303c4dd: wave 2's verify pass and the owner's playtest fix "a meal isn't a pin" carried onto round six's AI, the rivals otherwise as wave 1 left them; fingerprints 458332195 / 792498017) and the rivals' pass (855eaab, the dig still 8 ticks from a head within 6; 942537634 / 115058735). What the four columns don't show:
- chased beetles escaped 22.9 / 22.7% with wave 2's rules, and 13.6 / 13.3% once the rivals read the dig, so it was shortened to 5 ticks (21.2 / 21.1% before the critique);
- Vulture won 35 / 30% after the pass, and with Mute went past 35% on a fresh seed, so both were watched to the end (above);
- the pass, confirmed on fresh seeds 29 and 41 by abtest (303c4dd against it, 1,200 paired rounds): the median round (165 → 164 s, ±3), sudden death (45.4 → 44.3 s, ±4), rounds reaching the woodpecker, starving before it, deaths by a cut, head-on, pecked, starved and the wall, and the trademarks of Mason's runs, Creeper, Mute, Joker, Desperado and Star the same within the margin; Ghost's distance 0.14 cells lower (11.1 → 11.0), still well above the field's 9.7;
- `decide()` cost the same with wave 2's rules as after the pass (0.65 / 1.62 ms, mean / 99th percentile, against 0.66 / 1.60).

