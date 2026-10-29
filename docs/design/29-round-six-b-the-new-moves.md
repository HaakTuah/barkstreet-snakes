## Round six B: the new moves

The owner's notes after Star turned the powers into moves you plan with: hopping between islands, flying a golden jump, flashing through a thin body (yours too), and a wrap you can see. Round six A's rules hold: every new rule has a visible cue and a lesson; every rival uses each move when it pays and sees it used against it (the owner's core premise: no ability that only people use); every rival keeps its trademark; no move may become a way to be safe.

**Teaching.** The owner found round six A's banners too quick to read in a fast game, and in the way on a phone, and asked whether the game could show rather than tell: your own snake speaking in a bubble when it does something it shouldn't, and pictures in play of what you can do (a jump you could make, a bridge on someone's back, where a flash would cut). So every move here is taught that way, through the teaching system (see "Teaching by showing" below): the lesson lines below are the words, said by your snake or drawn as a hint, and a banner only where a rule has no better place.

**Why.** In sudden death, 40–45% of deaths are in a pocket smaller than the snake, and once the woodpecker's holes are rounder, a one-cell hop rarely reaches anywhere. The owner's screenshot: Gobbler, 59 long, folded on a strip, an open island across a hollow, and no way to get there. A 3-cell hop reaches the next island for about a quarter of boxed snakes, 4 cells for about two in five, and a quarter sit 5 or more away (round six A's study).

**The plain jump hops islands.**
- It goes over up to 3 cells of anything a jump goes over (bodies, holes, fire), landing on the first free cell beyond. It used to go over one.
- It flies at a snake's pace, a cell a tick: over three cells, the head is in the air for three ticks and lands on the fourth. The body follows the head's path, bridging what it crosses.
- It waits up to `LEAP_WINDOW` ticks for something to hop, as now, and only goes if there's somewhere to land within reach. It never goes off the board.
- **Leap now** (the owner, 29 October 2026: "maybe you should be able to leap whenever you want, not only at gaps, so someone really skillfull can time cutting someone else off midair like that. Becomes a high skill manuver."): a second press while a jump waits sends it at once, wherever you are, open ground included (on a phone, a double tap). Over open ground it flies a full plain hop, up three ticks and down on the fourth cell, with its ring, at the same price (the tail's tip and the rest). So the air becomes a place you can use: jump into a rival's flight to bump it down, or come down right in front of a snake to cut it off. One press still waits for a hurdle as before, so nothing is worse for anyone who never double-presses.
  - *The rivals use it too,* through the same engine call, each in its style: Desperado for the thrill, Sniper to cut a snake off at its landing, Ghost to slip a trap, Drab hardly ever.
  - *Never a refuge:* ground snakes pass under a flight, so a leap also dodges a head-on or a trap for a few ticks. That's a timed escape with a price, not a way to be safe: the A/B measures how often it's used, how often it ends in a bump or a bad landing, and whether its users outlive everyone, and it's tightened (a longer rest after an open-ground leap, say) if they do.
  - *The lesson:* the first time you could have cut a flier off, "Press twice to leap now, anywhere!"
- It still costs the tip of your tail and needs more than 3 to go. Its rest is set by simulation (4 s now; longer, since it does more).
- It hops fire and never puts it out. Only a flash puts fire out.
- *The cue:* the landing cell gets a ring while the jump waits; the flight is the arch, shadow and dust round six A drew, longer.
- *The lesson:* the first time you're boxed in with a jumpable gap, "Space hops up to three cells. Find an island!" (a tap on phones).

**The golden jump flies** (the owner: "you can essentially fly, like a mario jump, choosing exact landing site"):
- Hold the jump to keep flying, up to 5 cells; let go and you come down on the next cell. A quick press is a plain-length hop, free.
- Steer in the air: turns work in flight as on the ground, one a tick, and the body follows the bend.
- Wherever you come down counts: bark, and you're fine; a hole, and you fall in; a body, and it's a bump (below).
- *The cue:* a gold ring marks where you'd land if you let go now, and moves as you fly.
- *The lesson:* on your first golden jump, "Hold to fly farther. Steer in the air!"
- Free, as now: 2 per golden beetle, up to 3 held.

**A snake across a pit is a bridge** (the owner: "if you are a shorter snake, jumping on a longer snake, and it is crossing a pit, and you manage to cross in time, before the end of its tail [goes]"):
- A body lying over a pit already holds (only a head falls in). Now the part of it over the pit is a bridge for anyone: a head may move onto it there, crawling along its back, or land on it from a jump. Everywhere else a body is still a wall, as snake needs it to be.
- The bridge lasts as long as the body does: once its tail has passed, the cell is open pit again, and a head over it falls in. A body's cells free up on a schedule anyone can see (the tail end leaves one a move), so the timing is a rule you can plan by, not luck: get your head to solid ground before the tail end reaches you.
- Your own body over a pit stays as safe as now; it's only your head that needs the bridge.
- Head to head on a bridge is the usual head-on; cutting the bridge (a golden flash) drops whatever head is on the cut-off part.
- *The cue:* a body over a pit is already drawn as a bridge (round six A); a head on another's back rides on top of it, with its shadow on the back below. The tail end's last cells over the pit get a creak and a sag as it nears.
- *The lesson:* the first time a snake lies across a pit near you, "A snake across a pit is a bridge, until its tail passes!"
- *The rivals* plan across bridges with the time each cell frees up (which the AI already keeps for every body cell), use them to reach an island, and never start across one they can't leave in time. A rival lying across a pit sees others using its back.
- *Why:* it's island-hopping with no power at all, and it makes the end, when the log is islands, a little less of a lottery: a long snake crossing between islands opens a way for a moment, for anyone quick enough. Measured like every rule here; kept only if sudden death stays as long and as fair.
- **Never a way to be safe** (the owner: it mustn't be "a technique that can make you invulnerable, that you can constantly jump on peoples back and avoid danger"; it must "take some timing and skill to pull it off"). Built in:
  - only over a pit: on bark, a body is a wall, so riding is never a way out of a crash, a trap or a box on solid ground;
  - you're over a pit the whole time, with a deadline: the bridge shrinks from its tail end a cell a move, and you can't stop (snakes always move) or turn back;
  - getting off takes aim: the bridge snake's body becomes a wall again where it reaches the far rim, so you must step off sideways onto bark at the rim, at the right moment; riding toward its tail end leaves you half the time;
  - you're still in reach: a head-on on the bridge is a head-on, a cut bridge drops you, and your own body on the bridge is just another body over a pit (a bridge for someone else);
  - no free landings: a jump may land on a bridge only where the bridge will still be there when you land.
- **Checked before it's kept:** in simulation, how often snakes ride, how often a ride ends in a fall, and whether riders outlive everyone else. Any snake that spends a large share of its time on backs, or dies less often while riding than off it, means it's a refuge, and it gets tightened (for example, a ride may only start from the rim, not from a jump) or dropped.
- **The rivals use it too** (the owner's core premise: no ability that only people use). Every rival weighs a crossing the way it weighs a jump, by its own style (Desperado for the thrill, Ghost to slip away, Gobbler for food on the far side, Drab rarely). It sees others ride: a pit with a bridge over it is no barrier to them while the bridge lasts. Rules tests prove both: a rival crosses a bridge to reach an island when it pays and only when it can get off in time; a rival doesn't count on a pit to keep away a snake that can ride across. If the rivals can't learn it well, the rule doesn't go in.

**Bumps in the air** (the owner: colliding mid-air "costs you the same as a usual collision, and you fall"):
- In the air are: each flying head, and the part of its body lifted over what it hops. Flying into another snake's air is a bump; two flying heads in one cell both bump. Something on the ground passes under a flight, and a flight passes over the ground.
- A bump costs what a crash does (3 segments, the stun), and you drop where you are:
  - over bark, you're stunned there;
  - over fire, you're stunned there and catch alight as if you'd crawled in ("Fire on snakes"), on top of the bump's cost (the owner, 29 October 2026: "if you are over fire, you ignite");
  - over a hole, you fall in and you're out;
  - onto a body, you're out: you drop straight down, and a snake under you blocks your landing, so you're trapped (the owner, 29 October 2026: "In my mind, you are trapped if you crash into another snake mid-air and another snake blocks your landing."; it replaced a slide to a free cell beside it);
  - over bark, the ground's test for being trapped holds as for any crash: if there'll be nowhere to turn when the stun's over, you're out.
- Coming down on a body at the end of a flight is the same bump, and puts you out. So a fast golden flash through a landing cell steals the landing, and the jumper with it: the landing ring is the warning, and the rivals weigh the risk (a jump only goes where its landing will still be free, as far as anyone can see).
- *The cue:* a spark and a puff of dust in the air, then the drop (or the slide).
- *The lesson:* the first time you bump in the air, "Bumped in mid-air! Down you go."

**The plain flash cuts.**
- It still goes 2 cells along the ground. Now, through a body one cell thick, with a free cell beyond, it cuts that body: the part behind the cut falls to beads, food for anyone (its owner chokes on them).
- It puts out one cell of fire it passes, if it lands clear.
- **The neck cut** (the owner, 29 October 2026: "Agreed, do it expertly!"): a cut that leaves another snake fewer than 3 segments in front of it puts it out, as a crash at your smallest does. It's the flash's skilled kill: a one-thick spot right behind a moving head, with free log beyond, and a misjudged one hits the head instead, which is a failed flash (a head can't be cut). The same holds for golden cuts. (Cutting your own body still needs 3 to stay in front, so it never puts you out.)
  - *The lesson:* the first neck cut you see, "Snip! Too short to go on."
- **A failed flash hurts more** (the owner kept this on purpose: without a risk, everyone flashes all the time, cautious play loses, and Star crushes everyone). A flash that runs into what it can't get through (the edge, a hole, a body two thick, a head) costs 5 segments and a longer stun (both set by simulation; 3 and 4 ticks for a crash).
- **Its rest is longer:** 10 to 12 s (6 now), set by simulation.
- *The cue:* the cut is a snip of light across the body and the beads spill; a failed flash is a bigger bonk, with the stars staying longer.
- *The lessons:* your first cut, "A flash cuts through a thin body."; your first failed flash, "Too thick! A failed flash costs five."

**The golden flash cuts deeper.** Three cells, as now. It cuts through a body up to two thick (one cut, nearest the flasher's head), puts out every fire cell on its way, and still blows up at the edge or a hole.

**Dropping your tail** (the owner: "now maybe you can cut yourself smaller"). A flash can cut your own body, by the same rules: the plain one through one thick, the golden one through two. The part behind the cut becomes beads, which others can eat and you choke on. It goes only if at least 3 segments stay in front of the cut. It's how a long snake gets out of a pocket too small for it, at the price of the length. *The lesson:* the first time you're in a pocket smaller than you with your own body one thick in front, "Flash through your own tail to drop it."

**Gold portals for the wrap** (the owner: the edge-passing power had no effect at all):
- Going off an edge while wrapping opens a pair of gold portals, one on each side, trimmed in your colour. The entry swirls in and the exit spills out. The frame is gilded while you wrap. Gold, not blue and orange: on this board sky blue means jump and ember means flash.
- Others may follow you through while your body passes and for about 1 s after. Coming out onto your body is a crash.
- *The lesson:* the first time someone follows, "Anyone can follow you through a portal, for a moment."

**Mushrooms come back up** (the owner, 29 October 2026: "what if every snake pukes up the mushrooms instead, so they can poison others as well?"; "Yes, i agree to all, expertly!"). A mushroom still shrinks whoever eats it (`SHRINK`, 3), and is then thrown back up rather than gone: it lands by the roll rule (into the turn, else the side with more open log, a tie toward the middle), still poisonous for whoever eats it next, and it falls off the edge or into a hole where the rule sends it there. A spat mushroom wilts faster (half the time it had left), so the log never fills with poison. Golden mushrooms are a power, eaten as now. *The cue:* a green-cheeked gulp and the mushroom flying out; *the lesson:* the first time, "Bleh! Mushrooms come back up, and still poison."; the rivals spit them where it hurts and steer clear of spat ones.

**Mason builds double walls.** A plain flash cuts a wall one thick, so Mason, who lives by straight walls ("Keep watch!"), lays them two thick where it can, running back alongside. Its straight runs are measured before and after.

**Every rival has a power style.** Each persona uses jumps and flashes its own way, through the same engine calls as a person:
- Sniper cuts off its target; Mute seals boxes; Gobbler races for food; Vulture flashes to beads; Ghost keeps a flash ready to escape.
- Sovereign and Colonist chase intruders off their land; Mason finishes walls; Creeper flashes in behind tails; Desperado for the thrill; Joker springs its lures; Ouroboros jumps its own coils and drops its own tail.
- Star is the addict; Wildcard is random; Capricious and Copycat borrow; Metagamer reads its rivals; Drab is the baseline.
- All of them: a ready flash is worth keeping (a reserve value); length is worth trading for room when boxed in (jump to an island, or drop the tail); keep a jumpable way out; cross the woodpecker's mark when they'll be out of it before the strike.
- *The test case:* the owner's screenshot (Gobbler folded on a strip, an island across a hollow). The rival must find the hop, the flight or the tail drop.
- **Gobbler's endgame.** Round six A left Gobbler the lowest (18% over five seeds): it grows longest and most of its deaths come late (78% after 2:00, at about 53 cells), in pockets too small for it, and no weight change held up. Its style here is the cure, not a number: it hops to the next island for food, and drops its tail when a pocket is too small. Measured: Gobbler comfortably inside 15–35%, its food share still the field's biggest.

**Balance targets** (simulation, paired seeds): powers on clearly beat powers off in the seat-split A/B (today they're even, 2.499 against 2.497); every persona wins 15–35% of rounds; rounds about 160–180 s; starving at most 8%; failed flashes rare enough to be a risk you take on purpose. The chosen numbers (the jump's rest, the flash's rest, a failed flash's cost) go here, for the owner's playtest.

**The chosen numbers so far** (PR #158, the island hop): `LEAP_REACH` 3; `LEAP_WINDOW` 5 (a press waits five moves); the jump's rest stays 4 s (the head-to-head below showed no need to lengthen it: rounds 169 s, inside 160–180). A golden jump is the same hop, free (its held flight isn't built yet). Measured on fresh seeds 41 and 43 (1,200 paired rounds, head to head): rivals who island-hop against the same AI without it win 26.5% to 23.4% (+3.1 points, interval −0.6 to +6.8), eat more (56.0 to 54.5), live as long, and jump 4.8 times a round to 1.5; every trademark the same or within noise. In a field of its own (200 rounds, seed 3): 19.5 plain jumps a round (6.2 before), 47% over one cell, 34% over two, 18% over three; 1% of landings crash; rounds 169 s (165 before), sudden death 49 s (45), starving 3% of deaths (1%).

**Effects:** take-off and landing dust; the flight's shadow on the ground; the landing ring; bumps in the air; cuts and spilled beads; dropped tails; fire put out.

