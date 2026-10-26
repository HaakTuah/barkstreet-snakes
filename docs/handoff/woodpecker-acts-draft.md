## Round six C's centrepiece: the woodpecker in three acts

The owner (2026-10-19): the game "has just 2 stages. Chill start where nothing happens, then sudden elimination." Measured: about 0.6 deaths a round before the woodpecker comes at 2:00, about 2.4 after, and sudden death lasts about 45 s. The round has a long quiet stretch and then a short, sharp end. The owner's picture is a boss that builds dread before it acts and escalates as it goes (Mario 64's Bowser buildup; Bomberman 64's sudden death). Rounds "can be fun to last a couple of minutes" if the tension keeps building; at the old 3:00 woodpecker they dragged, because nothing was building.

**The acts.** Each act starts at a seeded random time inside a window, so a round is never quite predictable. The windows are the owner's rough timings, as a starting point for playtests:
- **0. Calm** (from the start): as now. Food, weather, beetles, the meal clock from 0:45.
- **1. The watcher** (it arrives 60–90 s in): the woodpecker lands outside the board and scouts it. No pecks.
  - It moves little: two to four times it changes its vantage point around the board, and between moves it watches. The new animation does the acting: slow head turns, an eye that settles on things, a raised crest, a kik now and then.
  - **Its gaze is a tell, not decoration.** Where it watches longest, its first pecks will come. It's a rule: act 2's first patch grows from the area it watched last. A sharp player can read it; a careless one gets surprised. If it only looked, people would learn to ignore it.
  - The music gains a low, slow layer underneath, the first sign something's coming.
- **2. The first pecks** (50–80 s after it arrives): now and then it takes out a small patch, with the aim warning and every fairness rule as now. Strikes are rare (a long rest between them) and small, so the log changes shape while food still grows and there's room to adapt.
  - The music's percussion comes in, and it is the woodpecker's own drum.
- **3. The frenzy: sudden death** (50–80 s after act 2 starts): nothing new grows and the last apples fall, as sudden death does now. Its rests shorten as it goes.
  - **Combos.** Sometimes it marks two or three patches at once, then strikes them in sequence, a drum roll each. Every patch is warned together, before the first blow. The "won't shut you in if it can help it" rule and the crumbs rule judge the whole set together, and knocked food lands by the rule across all of them.
  - **It changes.** Its eyes glow red, its feathers ruffle and darken, a shadow hangs about it, and the sky dims (this joins the planned sudden-death storm). It reads as possessed and furious, in the storybook style: thrilling, not horror. No flashing. With reduced motion, the red eyes and the darker look stay, but nothing flickers or shakes.
  - The music turns into a sudden-death theme of its own: faster, minor, urgent, with the drum woven in. It's ours, not a copy of anyone's.

**Teaching it.** Each act gets its cue and its lesson:
- arriving: "The woodpecker's watching… Mind where it looks.";
- the first peck: "It's started pecking! Keep off its mark.";
- the frenzy: "Sudden death! The woodpecker's in a frenzy." (the music and its new look say it too).

The Field guide's Woodpecker row gets the three acts, and the gaze as a tell.

**The rivals** read the acts as a person does, through the same engine and view:
- while it watches, the gaze area counts as risky ground to linger in later;
- marks are respected as now;
- combos count as several marks;
- in the frenzy, caution rises (room counted more, long ways round avoided).

Every persona keeps its character: Desperado skims the marks, Ghost keeps its distance, Mason keeps building.

**Online:** the act and its start times, the gaze area, and combos with their order: a protocol bump.

**Tuning, by simulation and then playtests.** The windows and the act 2 and act 3 numbers (rests, patch sizes, combo chance, the frenzy's speed-up) are all named in tuning.js. Simulations aim for:
- a median round of about 3 to 3.5 minutes;
- deaths spread through the acts instead of piling up at the end;
- sealed deaths kept low;
- the biggest island not deciding the round;
- every persona at 15–35%, every trademark kept.

Then the owner's playtests decide. A playtest knob makes that quick without touching code: a URL setting such as `?acts=70,140,200` pins the acts' times, so a timing can be tried in a few rounds.

**Food under a strike: test knocked aside against falling in** (the owner, 2026-10-20: "Maybe both options can be tested in one of the rounds"). Today food in a mark is knocked to its ring (PECK_FOOD 'knock'). The other option is that it falls into the new hole. The study's patch already has PECK_FOOD 'eat', and the engine already lets the bird eat food that has nowhere to land.
- *The owner's counterpoints:*
  - The bird already pecks beetle burrows away. A pecked burrow becomes a hole, and a new one opens only where there's room, so late on that limits beetles.
  - The longer snake may lose more often in the final duels, so food late in the round may not be the help I claimed.
- *Measure both with abtest* (paired seeds, under the acts):
  - starving deaths, and meals after the woodpecker comes;
  - food lost to the bird per round;
  - who wins the final duel, longer or shorter (answers the owner's second point for both options);
  - whether the biggest island decides the round;
  - beetles caught and escaped;
  - round length, and how deaths spread over the acts;
  - every persona 15-35%, with their trademarks (Gobbler and Vulture live on food).
- *The owner tries both* with a URL knob such as `?food=fall`, beside `?acts=`.
- *Falling in needs its own cue, lesson and AI change:*
  - the cue: food in the mark sinks and darkens through the aim, then tumbles in at the strike;
  - the lesson: "Food in the woodpecker's mark falls in.";
  - the rivals value it as gone at the strike.
- *If the knock stays:* make it read as a peck, not magic. Bark chips spray out with the food, and it bounces a little where it lands. The owner: "this is the way to do it".

**Why it works with the rest:** acts 2 and 3 make islands appear earlier and more gradually, which is exactly where PR B's island hops and back-riding bridges pay off. The watcher's minute gives the mid-round its own tension without killing anyone, and the frenzy gives the end a climax you can see and hear.
