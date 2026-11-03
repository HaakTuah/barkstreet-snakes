## Crashes, not deaths (the rules, reworked)

**Why**, **A crash**, **Head-on, both boxed in: the longer one bounces**, **No more head-butting loops** and
**Fire on snakes**: their rules are in `40-powers-and-moves.md` ("Crashes, not deaths", "Head-on, both boxed in", "No more
head-butting loops" and "Fire on snakes"), and their text as it was, with what was measured, in
`docs/archive/design-powers.md`.

**Food in the fire cooks.** Fire can now spread onto food: an apple or a bead that's been in a burning cell for `COOK_TICKS` (18) is baked (worth `COOKED_GROWTH`, 2; an apple stops rotting for a while), steaming, glazed and split; left in for `ASH_TICKS` (45) it goes to ash in a grey puff. Getting at it means waiting for the fire to die down, or taking the heat.

**Apples rot.** Each apple lasts about `APPLE_TICKS` (110, ±25%: about 10 to 16 s early in a round, 8 to 12 s once it's at full speed; it was 160, and apples still mostly got eaten before they went): it bruises (brown spots), then rots (brown, wrinkled, its leaf dead, a fly circling), shrivels and goes with a brown puff, and a fresh one drops from the tree above somewhere else (every new apple mid-round drops in from above, like a windfall). It keeps snakes from camping an apple. At first apples lasted 40 s and hardly any rotted (0.1 a round: they were eaten first), so they were shortened: about 1.2 rotted a round at 160 ticks, and about 7 do now (600 seeded rounds; the rounds are longer too).

**The woodpecker, gentler and stranger**: its rules as they stand now are in `38-the-woodpecker.md`, and its text as it was,
with its measurements, in `docs/archive/design-woodpecker.md`.

**What it did, over 600 seeded rounds (against the same seeds before):** the median round went from 70 s to 94 s (middle half 65–128 s, from 43–109), a third more rounds reach the woodpecker (30%, from 20%), draws fell from 55 to 23, and nothing stalls. About 4 crashes a round are survived. The spread of win rates is about what it was (18% to 37%, from 13% to 35%); the biggest eater gained most (Gobbler 13% to 21%) and the one who hardly eats lost most (Ghost 24% to 18%, starving more): exactly the point. The AIs treat fire as walls and the woodpecker avoided bodies (until round four, when it stopped cutting them), so burning and cuts mostly catch people out, and apples are mostly eaten before they rot.

**Feel.** A crash's, a burn's and a cut's cues, sounds and lessons are in `40-powers-and-moves.md` (under "Crashes, not deaths",
"Fire on snakes" and "The plain flash cuts"), and this paragraph as it was in `docs/archive/design-powers.md`. Baked: a sizzle, a pop,
steam; ash: a soft puff; and a few rivals relish baked food.

