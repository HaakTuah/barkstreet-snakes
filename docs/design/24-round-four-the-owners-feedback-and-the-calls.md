## Round four: the owner's feedback, and the calls

After the third pass the owner played and sent a list: the controls feel delayed, the powers should be two presses, a flash for everyone, holes under bodies, holes that look better, borders instead of force fields, rivals that use their powers, a food economy that's too rich in the middle and too thin at the end, and a check that everything promised is actually in. Seven investigators measured each area first (headless Chrome with real key and touch events, and instrumented copies of the simulator, hundreds of seeded rounds a variant). These are the calls, each with the reason, as built. Numbers marked *measured* come from those runs; where the build went another way than the call, it says so and why. The build's own numbers are in "Round four, measured".

### Two powers, two presses

The one power press (pressing the way you're going) is split in two. A press that did "whatever power you happen to hold" blew snakes up: holding a golden dash, pressing forward to hop a hole dashed into it instead.

- **Jump:** Space (and since round six A, a click on the board), or a tap on a phone. It hops one cell (a body, a hole or fire) as before, waiting up to `LEAP_WINDOW` ticks for something to hop; golden jumps go first and are free.
- **Flash:** E (by where it sits, like WASD), or either Shift (the sprint key in most PC games, and the right Shift sits beside the arrows), and since round six A a right-click on the board; or on a phone a swipe the way you're already going. Golden flashes go first.
- **Pressed together**, the jump goes first if it can (something right in front to hop, somewhere to land), because no flash gets past that; the flash goes once you're down. A flash pressed in the air goes once you're down too. (Round four's critique: the flash used to win even when it couldn't go, so mashing both crashed you, or with golden flashes held blew you up in a hole; and a flash pressed in the air was dropped.)
- **Steering keys only steer.** Pressing the way you're already going does nothing now. It was the old power press, and held keys and auto-repeat fired it by accident; the 120 ms double-tap guard goes with it. The other one (`POWER_AFTER_TURN_MS`) stays, for swipes only: a fresh swipe the way the last swipe turned you, while that one's still down or within 300 ms of its lift, is the turn swiped twice, not a flash, so a quick double flick to make sure can't fire a golden flash into an edge. (It was 180 ms from the turn's registering; a double flick puts its second touch down 150–280 ms after the first lifts. Only a swipe that turned counts, so golden flashes swiped back to back still go.) Keys need no guard.
- **Nap moves to P and Esc** (and the ⏸ button). Space can't both nap and jump, and jumping is what Space is for in a game. Enter, R or an arrow starts and starts over, as before; P and Esc no longer start a round from the start or round-over card.
- **Space, E and Shift never start, wake or dismiss anything.** They're the keys you mash in a fight, and mashing jump just after you die mustn't start a new round. A button you Tabbed to still takes Space, as buttons do. (That's tracked from the Tab key itself: a card's button the game focused after a keypress also looks keyboard-focused to the browser, and mashed Space would start a round.)
- **On a phone, a tap jumps** once it's clearly a tap. It jumps on the lift: within 6 px of where it touched (`TAP_STILL_PX`), or a quick touch, under 250 ms (`TAP_QUICK_MS`), that never went as far as a swipe (a finger rolls 7–11 px as it lifts in a hurry). Held still for `TAP_JUMP_MS` (80 ms), it jumps before the lift, but only with something to hop within reach on the way it's going: a thumb resting on the glass, ready to steer, isn't a jump. A jump a hold asked for that hasn't gone yet is taken back if the touch turns out to be a swipe, and a thumb resting while the other swipes isn't tapping. Going on touch-down would fire a jump on every dodge, because a swipe takes 15–50 ms to tell apart from a tap and a dodge always has something in front to hop. *As built*, 80 ms rather than 60: the slowest swipe measured (0.15 px/ms) is seen moving by about 57 ms, since touch moves arrive once a frame, so 60 left a 3 ms margin and 80 leaves about 23. (Round four's critique made the hold need something to hop, and the drifting quick tap a jump: a thumb resting 90–200 ms before it swiped left a jump armed, and a quick tap that drifted 7–11 px was dropped.) A touch on a button or a name tag (yours too) never jumps.
- **A card that comes up by itself** (your death's, the round's end) takes no tap on its buttons that began before it came up or within `CARD_TAP_MS` (500 ms) of it, nor one in a run of touches, each within `CARD_MASH_MS` (350 ms) of the last, that began then. Mashing jump never plays again. Keys are unchanged (Space presses only a button you Tabbed to). (Since round six A, mouse presses go by the same rule.)
- **Teaching it.** The flash's key is taught once a round, from 6 s in, until you've flashed. A short phone (where the help under the board is off the screen) teaches both on the first Go, as a lesson in one line: "Tap jumps. Swipe ahead flashes." (It was Go!'s big banner, three lines on a 320 px phone and faded under the heads for most of its life; see "Speech bubbles" for where banners go now.) Steering is taught beside YOU (see "What was promised and missing").

This changes the third pass's feel-target promise ("Space and Enter always mean nap and start over"). It now reads: P and Esc nap, Enter starts over, Space jumps.

### A flash for everyone

Everyone can flash: **two cells in one tick, along the ground, free, then a 6 s rest** (`FLASH_LENGTH`, `FLASH_COST`, `FLASH_COOLDOWN_MS`). It eats what it passes. It cuts nothing and puts nothing out: whatever is in the way, it gets that far and runs into, as a crawl would.

**Why free:** *measured*, a flash that cost a tail segment made rounds 6 s longer and pushed starving from 16% to 26% of deaths. A free one at 6 s kept rounds as they were, and the investigators' AI used it about 4 times a minute, to its advantage. As built, rivals flash about twice a minute (2.1): a flash must look two apples better than crawling, or one to win a race for food. At one apple they flashed 3 times a minute and did no better than never flashing (see Rivals).

Golden leaves now give **golden flashes** (the rules and the AI still call them dashes, as they call golden jumps leaps): three cells, cutting a snake one cell thick, putting fire out, and blowing up at the edge or a hole. They go before the plain flash and leave its rest alone.

### Holding more than one

Golden powers add up:
- Each golden beetle gives 2 golden jumps, up to 3 held.
- Each golden leaf gives 2 golden flashes, up to 3 held.
- Each golden mushroom adds 12 s of wrap, up to 20 s.

You can hold golden jumps and golden flashes at once, since they're different presses. Before this, a beetle wiped your golden flashes, a leaf your golden jumps, and a second mushroom only reset the clock.

### Telling powers apart

Gold stays the family colour: an outline of gold means "this snake holds a power". Each kind also gets an accent of its own, plus a shape and a motion, so you can read it at a glance without relying on hue:
- **Jumps are sky:** round pips.
- **Flashes are ember:** diamond pips, short ember strokes running back along the gold line from the head (over its first 6 segments: clipping to a whole long body cost the GPU up to 7 ms a frame), and a streak.
- **The wrap** is a slow glint running down the gold line, fading with it over the wrap's last 2 s.

Sky against ember is the pair colour-blind eyes separate best, and the shapes carry it without colour too. This bends the third pass's "gold means power and nothing else" a little: gold is still only ever power, and the accents appear only on power marks. (So Desperado's poncho stripes went from Honey to cream.)

The pips sit on a short arc behind the head, a little bigger now; holding both kinds, the golden jumps' pips sit on the snake's left of the arc and the golden flashes' on its right. Since the critique, each is ringed in a parchment keyline inside an ink line, so ember reads on Gobbler's orange and sky on Metagamer's cyan (0.14 of a cell, 0.12 with three or more, then the rings). The diamonds are slim lozenges pointing along the arc's spokes, spaced so they never touch (three that touched read as a zigzag seam). At the board's edge the whole arc moves in, so no pip is cut off, and the stun stars sit a little further out to clear them. Your two plain rests show as two half-rings round your head, fixed to the screen: jump on the left in sky, flash on the right in ember. Each fills from the bottom over a faint track as it rests (not shown while you hold golden ones of that kind) and gives one bright flick when it's ready. A stunned press shows the jump's hop or the flash's double chevron in its accent (Honey when golden), and a press that can't go an inked × in it. On the tags, one chip per power: golden jumps sky, golden flashes ember, both on Honey with the count. Your own tag always shows your plain jump and flash, filling in their accents as they rest; rivals show chips only while they hold golden powers or the wrap.

### The woodpecker: holes under you, and holes that look like holes

- **It pecks under bodies too.** A third of its strikes start under a snake (`PECK_UNDER_BODY`, any body but never a head; the same share on every strike, the first included). A body lying over a fresh hole **bridges it**: it isn't cut and drops nothing, and the cell is an ordinary hole once the tail has passed. Only a head on the ground in the patch falls in. A jump whose landing was taken meanwhile comes down on a bridging body, not into the hole under it; if that body moves on while the head is still there, stunned, it falls in. (Round four's critique: it was left standing on an open hole, and walked off it.)
  - *Why:* the old cut took 32 segments on average and was decided by reaction time. *Measured*, 40 of 49 cuts were heads already heading into the mark, exactly within the 240 ms nobody can react in.
- **It aims at least 5 cells from every head** (`PECK_CLEARANCE` 4, from 2), and clear of all food, while there's such a spot, so nobody can be inside a fresh mark before they can see it. (In 600 AI rounds on each of two seeds it had to aim nearer a head 4 times in about 20,000 aims; 6 times on the final build.) *Since round six A* it may cover food, knocking it aside, and shuts nobody in while it has another patch to pick: see "The woodpecker plays fair".
- **Fewer, bigger hollows.** Half the strikes widen an old hollow (`PECK_WIDEN`), and patches grow compact. The log ends up with a few big hollows instead of a pegboard.
- **Bigger patches** (decided in the balance pass, once the rest was built): 9 cells, a cell bigger each strike up to 16 (`PECK_CHUNK`, `PECK_CHUNK_MAX`; from 7 and 14). See "Events and timings". (*Since round six A*, 12 growing to 20, with shorter rests.)
- **Holes stay permanent and only ever added.** The squeeze is what ends rounds, and online play relies on it.
- **The look.** One pit per connected hollow, traced along the cell edges:
  - a torn, inked lip;
  - a dark floor;
  - a far wall lit from the top left like everything else;
  - splinters over the rim and sawdust round it;
  - at the board's edge, a notch bitten out of the log.

  They lie on the static layer under the snakes, so a body bridging a hole is drawn across it, and a strike paints again only the box round its new holes. The old look, one round dark disc a cell, read as bubble wrap.
- **The aim marker.** It's traced with the same outline, its rim the pit's torn lip to come (the same wobble, corners rounder: 11 units against the pits' 7), and still glows red. Its cracks run along the grain under the snakes, and as the strike nears the pecks bite nicks in from outside the rim, each its own size and unevenly spaced, first and closest together where the bird is at it. (Evenly spaced dents on the rim, as first built, read as a dotted selection box.)
- **The rivals tell a mark from a hole** (`view.pecks`, added at the merge). A mark isn't a hole yet, so a golden jump or a jump for food may hop real holes but never a mark; a flash, plain or golden, treats a mark as a wall.
- **The first time it pecks under you:** "Pecking under you! Only your head can fall in." (It replaces "The woodpecker took your tail.")

### Food

**Does your own food poison you?** No, and it won't. Poison would punish the natural move of picking your tail back up after a crash, and seat colours can look alike. But **your own beads aren't a meal**: they give the length back (and the score), not the hunger clock.

*Measured*, 24% of the beads eaten were the eater's own, and crashing on purpose and then eating your own beads was a free hunger reset.
- **Telling it:** a muted Parchment +1 (+2 roasted) with no hunger refill, and once: "Your own tail won't feed you." (*Replaced in round six A:* you choke on your own beads instead, and the mercy below is gone.)
- **Owners:** beads carry their owner, so this is the same rule for everyone, AI included.
- **One mercy:** a snake out of time that reaches its own bead that very tick grows instead of starving (as with any food); its next shrink takes the growth back.

**Body food rots.** Beads fade, shrink and go after about 14 s (`PELLET_TICKS`, ± a quarter; roasted ones last half again), in a puff of their own colour, as apples do.

**A body leaves every other segment** (at least 3 beads, from the head; where there are too few, the skipped segments nearest the tail make up the number), not all of it. A kill was worth +30 to +70, and the winner of the first big fight snowballed. Crash drops, cut tails and burnt bits stay whole.

**Too much food mid-round, too little at the end?** Yes on both counts. *Measured:*
- Before 2:00, hunger mattered for 0.8% of snake-time: the median gap between meals was 1.4 s against a 20 s clock.
- After 2:00, 24% of snake-time was starving, and two thirds of sudden-death starvations happened with no food on the board at all.

The calls:
- **Three apples all round** (*since round six A*, two all round, with beetles carrying more of the food: see "Less fruit, more beetles"). Two after 0:45 was the first call, so hunger would matter mid-round. *Measured*, it hardly did: before 2:00 snakes spent 4.4% of their time in the hunger warning, against 2.9% with three. What it did do: shorter snakes at 2:00 left more room once the woodpecker came, so rounds ran 5 s longer, a quarter of sudden death's deaths were in holes, and starving rose from 2% to 7% of all deaths. So the dial was taken out (`APPLES_LATE` is gone). Beads that rot, a dead snake leaving every other segment and your own beads not being a meal made the middle a little leaner, but not by enough: the critique measured 3.0 / 3.2% of snake-time in the hunger warning before 2:00 (seeds 3 / 11). So, after it:
- **A meal mid-round keeps you 13 s, not 20** (`HUNGER_MID_MS`, from 0:45 until the woodpecker comes; one in the opening or in sudden death keeps you 20 s, `HUNGER_MS`), with three apples still all round (*since round six A*, 12 s, with two apples and fewer beetles: see "Fewer beetles after all"). *Measured* with the census, 600 rounds on seeds 3 and 11: snake-time in the hunger warning before 2:00 went from 3.0 / 3.2% to 8.8 / 8.9%. The round (169 / 170 s) and sudden death (49 / 50 s) didn't move, and starving went from 2 / 1% of deaths to 3 / 2%. Also tried: 13 s from the start (10.9%; its first death came at 120 s), 11 s (17.9%), 15 s (7.5%), and apples rotting sooner mid-round (no change: they're eaten long before). Two apples after 0:45 had given 4.4%, with longer rounds and more starving at the end.
  - *The hunger bar.* Each snake keeps how long its last meal keeps it (`mealMs`), and its tag's bar is measured against that, so it's full after any meal, though one mid-round lasts less. Under `HUNGER_WARN_MS` (6 s) left, the tag shows it's starving: the bar in Berry, a ring pulsing round the tag, and "starving" for a screen reader. (Measured against 20 s, a mid-round meal filled it two thirds; online, protocol 8 carries `mealMs`.)
- **The last apples fall one at a time.** In sudden death, food no longer stops dead. Once the board has no apple, another drops, each wait longer than the last (`SD_APPLE_GAP`, 20 ticks, times its number: about 2 s, 4 s, 6 s…), never in the woodpecker's mark. It's announced once, with its own falling notes: "The last apples are falling." (At a lesson's level, after the tick's other news: it waits out a banner that's holding, such as the woodpecker's arrival, instead of cutting it short, and replaces only routine news.)
- **No winter before 45 s.** Snow in the first half-minute starved 5-long snakes in about 1 round in 5. *Measured*, 55% of early starving happened in snow, which is 8% of that time.
- **Mushrooms never sprout within 2 cells of a head.** Nobody can see one appear in front of them in time.
- **Golden apples, leaves and mushrooms land somewhere quiet** (the farthest of 8 tries from every head). They become a race you can see, instead of gone in 1.5 s.

### Rivals

- **Mushrooms.** Desperado and Joker still valued mushrooms at +0.5, left over from before mushrooms became pure poison. They ate about 8 a round and won 11%. Gone: nobody seeks mushrooms now, and to every rival a mushroom only ever counts against a move. *Measured*, rivals ate 6.2 a round before and 2.0 after, out of about 15 that sprout: the ones still eaten were in the way when every other move scored worse. After the critique, a mushroom costs a rival three apples (the three segments it takes), fed or hungry; it was priced at one. Rivals eat about 1.3 a round now (1.30 / 1.33 in the final census, from 1.99 / 1.96), Gobbler, which hates them, half as readily again. Nearly all of those are boxed in or stepping round a trap, every other way scoring far worse.
- **A starving rival takes its chances.** When the hunger it can see (its own clock, as a person sees their bar) leaves it less than about 11 s of life (`AI_DESPERATE_MS`), a rival:
  - drops its personality's errands (home, mimicry, coiling, lures);
  - goes for any food, even food a rival might reach first (never its own beads, which aren't a meal);
  - takes more risk near heads;
  - may jump or flash for food (every power costs it half while it's desperate);
  - with no food in reach, hunts, to make someone crash and drop beads.

  It's the same rule for every snake. *Measured*, it's on for about 1% of snake-time and halved starving deaths. At 6 s a starvation before 1:00 came back in 0.7% of rounds; at 16 s nothing changed.
- **Rivals use their powers, when it pays.** Each power is weighed as a move in the rival's own search, less a price in apples, and pressed only when it beats crawling:
  - *Flashes:* about 2 a minute (*measured*, 2.1), when a flash looks two apples better than crawling, or one to win a race for food (food a rival could reach as soon as it would crawl there, but not as soon as it flashes) or to get out of a crash. Weighed the way the rival would crawl anyway (any way, out of a crash). Weighing every way cost 1.65 times the decision's mean time (1.88 times its p99, over the 1.7 budget) and did no better. *Changed after the critique:* priced at one apple, rivals flashed 3.1 times a minute and did no better than the same rivals never flashing (a seat-split A/B, half the seats never plain-flashing: about 0.03 of a place worse, pooled over 3,400 rounds). At two they do no worse than never flashing, and head to head against the one-apple price they did 0.02 of a place better over 2,000 rounds; a 1,000-round split varies by about 0.05 between seeds, so that's a lean, not a proof.
  - *Jumps:* to escape, and to reach food (landing on it or one cell short, priced at 1.5 apples). About 4 plain jumps a round, nearly all out of a crash.
  - *Golden jumps:* 99% used, instead of 48% (priced at a third of an apple).
  - *Golden flashes:* kept for cuts (0.6 of an apple), for something golden, or for a way out. About 1.4–1.5 a round, cutting someone about once; nobody blows themselves up.
  - Every rival allows for any other flashing 2 cells straight ahead (at half weight).

  *Tried and lost (measured, A/B):* jumping for position, pressing a jump in advance "just in case", and pricing powers under about one apple. Using powers more doesn't win by itself: the whole package measured neutral against the same AI without powers (mean place 2.499 against 2.497 over 1000 rounds). After the critique, also tried for the plain flash: one apple (3 a minute, a little worse than never flashing), three (1.6 a minute, even), never ending a flash within 3 or 4 cells of a head (worse), and every cell of a flash paying its risk (no better).
- **Fixed: the board split.** Since the first pass, rivals never got any territory in the AI's board split (a time-base bug), so aggression and contested food did nothing. Mason, Mute, Gobbler and Vulture were partly missing their characters. It's fixed, and a few personalities were retuned for it: Gobbler counts a rival's apple in full (it really does eat one now) and wants more room; Mason and Mute claim a little less territory; Ghost keeps a cell less distance; Vulture wants a little less room. The rest already sat in the 15–35% band (Sniper's aggression stayed 0.3: at 0.5 it fell to 19%), and the balance pass changed no personality. The trappers (Mute, Mason, Sniper) got the thicker walls promised for them, as a weight for their own body beside their head (dropped when desperate): the share of Mason's body lying beside another stretch of itself went from 14% to 21%, Mute's and Sniper's from 27% to about 30%.

### Borders, not force fields

Sovereign's realm and Colonist's colonies are drawn as **borders on a map**, like a grand strategy game, not as domes:
- the land, cell-exact, under a light wash in the owner's colour;
- a band and a riband of colour along the inside of a true ink line (`#1c1209`), its corners rounded, with a parchment keyline just inside the ink (no line along the board's edge or round a hole). The keyline came with the critique: without it, Colonist's rose went grey-khaki to colour-blind eyes, its ink no darker than the bark's grain;
- where two claims meet, a line dashed in both colours over true ink, and hatching on land both claim;
- land that grows a ring of cells at a time as a realm widens, and shrinks back into its capital when its owner dies;
- a border that flares as it changes and when lightning strikes, breathes while a rival's head is on it, and lights up from where a head crosses in;
- a rival on the land wearing the land's colour round its pieces on the land's own cells (where two claim it, the later realm's colour), with a parchment keyline outside it, so it shows round a red body too (an ink ring outside that as well took a third fill pass, and put the land over its budget);
- Sovereign's capital marked with a swallow-tailed banner in parchment and ink, its crown inked, trimmed in the realm's colour (a blue banner vanished into the blue wash), and Colonist's flags on inked poles with parchment knobs. No gold: gold means power.

*As built*, the contested dashes stand still. Marching, their many short pieces cost about as much as all the rest of the land together, so they're cached in one small layer. The optional light sweep across the land was left out.

The land rule becomes one rule everywhere (the AI, the chatter, the HUD and the borders): a cell is land if its centre is within radius + `LAND_REACH` (0.5) of a field's centre. That removes the one-cell nubs the old radius + 1 left at the four tips. Snow lies on land like anywhere else, tinted by it. The domes' weather effects go, except a flare when lightning strikes. Crossing a border sounds like a muffled drum knock with a fife note, not an electric hum.

*Why:* the domes cost about 3.3 ms a frame in a real round (2.6 times the same board without them). *Measured* as built, the staged scene with both owners' land costs 1.28–1.40 times the same board without it (the domes 2.26–2.62), and their canvases hold 5.2 MB instead of 23.9. They read better at phone size.

### Events and timings

- **Weather comes from a shuffled bag:** every kind before any repeats. *Measured*, 42% of rounds saw no storm, and half saw three kinds or fewer. `WEATHER_ODDS` now counts how many of each kind go in the bag: one each, since two of a kind could repeat before the others came. A storm drawn before 0:30, or snow before 0:45, waits in the bag.
- **A lightning fire has a budget:** at most 12 cells over its life (`FIRE_TOTAL`), besides 6 at once. Fires kept themselves going until rain came, some for over a minute.
- **More golden power food.** Golden things are worth more now that they stack and the rivals use them: leaves 0.07 → 0.25 a gust, golden mushrooms 0.12 → 0.55 a rain spell (at 0.4 the wrap still missed most rounds), golden beetles 0.3 → 0.4 (0.16 since round six A, with beetles out more often).
- **Unchanged, because measured right:** the woodpecker at 2:00, and the 120 → 90 ms speed ramp.
- **Changed once the rest was built:** the woodpecker's patches start at 9 cells and grow to 16 (`PECK_CHUNK`, `PECK_CHUNK_MAX`; from 7 and 14). With a flash for everyone and rivals that see starving coming, nearly every snake now reaches 2:00, so sudden death ran a minute. Now it's about 50 s, and the median round about 170 s. (The woodpecker's speed turned out to be the weak lever: hungrier rests changed nothing, and shorter shortest rests saved 2 s.) (*Since round six A*, patches of 12 growing to 20 with shorter rests, since fewer, rounder holes take as long to fill the log.)

### Controls that keep up

*Measured*, the delay wasn't lost input. The board was drawn one tick in the past, so the moment your head was drawn reaching a cell was the moment its turn window closed. A press made when you saw the head arrive was late 77–88% of the time. The AI looked swift because it decides on the tick, against its own exact position.

- **The board is drawn ahead:** 60 ms (`DRAW_LEAD_MS`), but never more than half a tick (`DRAW_LEAD_MAX` 0.5): half a tick at 120 ms ticks (60 ms), and half a tick at full speed (45 ms). The cell your head is drawn in is the cell your press turns at, at every speed. (It was built as half a tick, as first called. The merge made it 60 ms at full speed too, more than half a tick there, to cover a press made as the head is seen to arrive. But then, late in a tick at full speed, your head was drawn in the next cell while a press still turned it at this one, and it was pulled back: 22 of 160 random presses, as the critique measured. So it's at most half a tick again.) *Measured* with real keys on a virtual 60 Hz clock, half a tick ahead: on-time presses went from 13–21% to 72–88% at 120 ms ticks, and from 12–26% to 60–73% at 90 ms. It changes the drawing only, never a rule:
  - rivals' next step comes from the plans they've already made, and they make them before the board is drawn into their next move: in the frames after the tick, up to the one that draws the next move, one decision a frame and at most two, never in the frame that ticked unless none is left (*measured* after the critique: no decision in a tick frame, at 1× or 4×; playing, a frame's thinking and stepping take 2.0 / 3.0 ms at p95 / p99, from 2.7 / 4.0, when the lead had packed every decision into the tick's frame);
  - a head about to crash holds at its cell centre instead of overshooting (fire isn't a crash, so a head heading into fire doesn't hold);
  - a guess that turns out wrong (a plan made late, a press in the second half of a tick) eases to the right place, never faster than a snake moves;
  - a flash, plain or golden, that's sure to go is drawn ahead too: from when the head is drawn past its cell's centre (before its tick) it's where the flash takes it, streak and all, and at the tick it glides on from a cell back along its body, never standing still. A flash guessed but not taken eases back like any wrong guess. A flash used to snap 1.5–2.5 cells at its tick and then stand still for 3 frames. *Measured* on the final build while playing, on a virtual 60 Hz clock (an autopilot steering, E pressed at random moments, golden flashes handed out): the rivals' flashes were shown before their tick 64 times of 66 and yours 115 of 142 at 120 ms ticks, 14 of 15 and 33 of 42 at full speed. The rest were presses in a tick's last frame or two, or flashes that stopped short, and showed at their tick. `tools/render-test.js`: after the tick, an even 0.14 of a cell a frame at 120 ms ticks, 0.18 at full speed. In Watch AIs the board has no lead (see below), so a flash shows at its tick (none of 75 before it), a cell on, or two for a golden one, and glides on from there;
  - online, the host sends where everyone goes next once its rivals have thought (a rival's plan, a person's queued turn, powers asked for), and again when a press changes it; friends draw ahead from that (protocol 8; before, a friend's screen drew nearly every rival's turn half a cell the wrong way, then dragged it back);
  - the board rests at its cells before Go and once the round's over;
  - it's only while you're playing on this screen: watching alone (Watch AIs, or after your death, alone), the board is drawn on its ticks, easing there after a death.
- **Your press shows at once.** Every steering press, not only a stunned one, and online too: your eyes look and your head leans the way you pressed, and it's drawn ahead from there, before the tick takes it.
- **Your face turns quickly** (about 60 ms, `FACE_EASE_MS`). The 300 ms "steady line" stays for the rivals, whose tongues it was for. *Measured*, in swift play your face lagged 214 ms. As built, it comes within 45° of the new way 53 ms after the press (180 ms before, on the same test).
- **Chained swipes are lighter.** A finger already swiping chains turns at 8 px (a new touch still needs 12, to tell it from a tap). The anchor keeps up with the finger while it goes the way it registered, so a turn counts from where the finger turns (*measured*, about 19 ms after the corner at 0.6 px/ms). A turn's way must be half again the other (`SWIPE_AXIS` 1.5), so a diagonal waits until it's clearly one way, or (since the critique) until the finger has gone twice the swipe's distance (`SWIPE_SURE` 2), when its main way counts: a long stroke 35–45° off the axis used to wait forever.

### What was promised and missing

The completeness audit went through every request across three sessions. About 100 items were done. These were promised and not built, and are built now:
- rivals planning with their powers;
- the board-split fix;
- the trappers' thicker walls;
- lines for being put out by rain, for ash and for rot, and Sovereign and Colonist complaining when rot ruins their land (see "Lines and announcements");
- a steering hint beside the YOU arrow: "Swipe to steer" or "Arrows or WASD to steer" ("Arrow keys to steer (or WASD)" since round six A), riding with your head until you steer (a banner moves aside for it), on whichever side of YOU is clear of the rivals' speech bubbles (since the critique: it used to sit on top of one).

Things an expert would expect, added:
- a **Field guide** beside Hall of Fame and Your story: every food and power, with its picture and a one-line rule, and the keys for each power. Since the critique it also shows how a held power looks (a snake in gold with a sky pip and an ember diamond: "Golden powers") and your two rests ("Resting"), and its mushroom sits on bark in its purple haze (its cream stem vanished on the card). A screen reader hears each row's name, a pause, then its rule. On phones (440 px or narrower) the Hall of Fame tab is a trophy, so three tabs fit 320 px; "Clear everything" hides on the guide;
- powers you can tell apart (above);
- beads that rot (above);
- a stop to eating back your own crash;
- new lessons: "Your own tail won't feed you.", "Pecking under you! Only your head can fall in.", the flash's key, and the round's news "The last apples are falling."

Docs that contradicted the game are corrected: the holes were said to be trenches, the power marks were described from before the third pass, the "rare" golden apple came 5 times a round, and Joker's mushroom habit was missing. The critique found that the older sections still described the game before round four (force fields, Space naps, pressing ahead to leap, a woodpecker that cuts); they're brought up to it now, each older call kept and marked as superseded.

### Online

Protocol 7, and 8 after the critique:
- presses are three messages: a key's turn (`{t:'turn'}`, it only steers), a fresh swipe (`{t:'swipe'}`: the host decides whether it's "ahead", against its own queue, which a friend can't see) and a power (`{t:'pow'}`, jump or flash);
- each snake's flash rest and flash request, and plain flashes;
- beads' owner, and eating your own;
- holes under bodies;
- rot, saying whether it was an apple or a bead (and the bead's colour);
- the trickle of last apples, and where the first fell;
- whether a rival is desperate (the chatter voices it);
- (8) where everyone goes next, from the host once its rivals have thought and again when a press changes it: `{t:'plan', k, s: [[way, jump, flash], …]}`, so a friend's screen draws everyone ahead the way they're really going;
- (8) `'unleap'` among a friend's `{t:'pow'}` kinds: a jump a finger held still asked for, taken back (it turned out to be a swipe);
- (8) each snake's `mealMs`, how long its last meal keeps it, for the hunger bar.

