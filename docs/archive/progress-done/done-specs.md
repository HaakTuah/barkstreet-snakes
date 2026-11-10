# Progress: done

## Done specs, moved from the queue's specs (2 November 2026)

Word for word from `docs/handoff/queue-specs.md`, moved by the file-by-file review once their entries were done: 2n
(its first try; PR #208 was the third), 2s (PR #289), 2w (PR #313) and the chatter split (PR #318).

#### 2n. Wildcard's hair: every version side by side, the owner picks (30 October 2026; small, an art lane)

The owner: "trump looks like David Lynch now. I actually think the very first or second hairstyle trump had in the game is
better than what he has right now". Draw Wildcard's head as each version has had it, side by side at the same size and
heading. The design session made [the picture](https://raw.githubusercontent.com/HaakTuah/barkstreet-snakes/2b0f035452522c107030f31987ee78fdb7eaf97e/design-wildcard-hair-versions.jpg) from the PRs' own pictures (30 October 2026): 1 the
original, 2 PR #107's two blobs, 3 and 4 PR #110's B and C (never shipped), 5 PR #110 as shipped (the "mop"), 6 PR #144's
F, 7 PR #156's F at 85% (now). **The owner's pick: the original, its swirl turned up** (30 October 2026: "What if we took
the original, but have the swirl point upwards instead of downwards?", then "Yes, please, expertly please!"). **Then, simply** (the owner, 30 October 2026, on the second try: "it looks horrible. I want the original hair, but I
want the lick reversed. That's all. Keep it that simple."): bring back the original exactly as it was at a79946b (PR
#107's "before": the fluffy pompadour, its strands, colours and outline), and reverse its lick, the one curl at the front
that comes down over the brow, so it curls the other way, up and back; nothing else changes (no new shape, no flick, no
reworked mass). The PR shows the original and the new one side by side in all four headings, at 390 px and desktop 2x,
and **merges only once the owner has said yes** (drawing only: no simulation, no protocol change).

#### 2s. A piece cut loose falls: the log stays one piece (30 October 2026, rewritten 31 October 2026; an engine-rules entry, after part 4; ahead of 2q) — done, PR #289

The owner (30 October 2026): "I still see the situation arise where 2 islands form at the opposite ends, and the snakes
are trapped on each, so the one on the bigger one wins". The first answer kept every island a hop from another. The owner
(31 October 2026), on the woodpecker cutting out shapes that fall once cut loose: "Yes, I think that's it. can still be jumpable gaps, but we want to avoid the islands stuff. it becomes too much rng, and isn't very exciting."
- **The rule:** the log is the biggest piece of bark; any other piece, once no bark joins it to the log, falls away
  (it cracks, tips and drops, its bark and anything on it gone). So the log is always one piece with holes in it, and
  there are no islands. Gaps inside it stay: holes a jump or a flight crosses, bridges over them, shortcuts and escapes.
- **Fair:** the woodpecker's mark shows, before its strike, any piece that strike would cut loose (the piece shaded as
  it will fall), and it never cuts loose a piece a snake couldn't leave in the warning's time, as it never shuts anyone
  in today ("The woodpecker plays fair"); a snake still on a falling piece falls with it ("Down the hole!"). Food on it
  falls too.
- **No size is banned from falling** (the owner, 31 October 2026: "No outline should be banned from falling, but ideally, it never takes out half the trunk."): whatever is cut loose falls. The woodpecker aims small (entry 6 plans it), and the only guard is the fair one above.
- **Replaces** "every island stays a hop from another" (the first 2s). 2r's rule (no hop onto a doomed island) stays,
  harmless, for any gap a snake might misjudge; part 4's measures of islands become measures of gaps. The lessons
  and picture lines that speak of islands speak of the far side of a gap instead: the jump's lesson ("Space hops up
  to three cells. Find an island!", `docs/design/29-round-six-b-the-new-moves.md`) and the island hop's picture line
  ("Tap! I can hop to that island.", `docs/design/30-teaching-by-showing.md`), with their Field guide rows; the
  writing pass (entry 9) may reword them again.
- **The flight measured again** (the owner, 31 October 2026: "yes.", to running part 4's both-ways test again once the
  islands are gone): part 4's A/B of the golden flight (and of leap now and the golden flash, as part 4 measures them)
  runs again on 2s's log, and the rivals' use of the flight is patched if its users no longer come out ahead.
- **The rivals** see a piece that a mark would cut loose as gone at the strike, and get off it in time; a rules test
  proves both, through the same engine calls.
- **A cue and a lesson:** the crack and the tip as it drops, a creak and a far-off thud; the first time, "Cut loose,
  it falls!", and a Field guide line under the Woodpecker.
- **Measured** with part 4's flight in place: rounds ending with snakes on pieces of their own (51% on seed 3 today)
  to none; deaths by falling with a piece, kept rare; round length and sudden-death deaths by cause; every rival's
  trademark. Entry 6 then makes the woodpecker cut shapes on purpose, down to a floor.
- **Online:** a protocol bump for the falling piece.

#### 2w. Beetles get away at least a third of the time (the owner, 31 October 2026; an engine-rules entry, after part 4)

The owner (31 October 2026): "Do beetles ever manage to espace?" Told that about 33% of chased beetles got away when last measured (round six A,
inside its 20–35% band): "Yeah, I feel it should be at least a third of the time."
- **The band** (in `docs/design/27-round-six-a-fairness-and-fixes.md`, "A cornered beetle digs in") moves from 20–35% to
  **33–45%** of chases: at least a third, as he said; the ceiling of 45% is the design session's reading, so beetles
  stay worth hunting.
- **Measure first,** on `develop` once part 4 has merged, since the golden flight changes how snakes hunt: escapes from a
  chase (down a burrow, dug in), beetles caught a round, the ticks of chase per catch, on fresh seeds.
- **If it falls short, tune the beetles' side,** never the rivals' skill ("Clever rivals, human reactions"): how far
  they see a head and run for a burrow, how fast they dig in, how many burrows stay open. Each step measured; the
  round's length, deaths near a beetle and every rival's trademark within noise.
- **The rules test and the census** keep the band: the simulation's check fails a run whose escapes fall below a third.
- **Online stays in step:** a protocol bump if a beetle's messages change.

#### Chatter split by meaning (the owner, 2 November 2026; the workshop lane)

The owner: "Have we split files where it doesn't make any difference? Like chatter? Like, splitting out chinese, i get. But
have one zh and zh-more, how does an agent/session which to look in? Won't it just check both?" ("Split by meaning" in
`AGENTS.md`.) `chatter/zh.js` and `zh-more.js` were cut by size (Copycat to Wildcard, then Creeper to Star), and
`voices.js` is 49 KB. Re-split along what people look up, a voice (a file per voice, or per voice and language), with
the lines every voice shares written once; weigh the page's extra script tags and `sw.js` entries against what a
session saves, and say both in the PR. Behaviour proven unchanged (the chatter suite, fingerprints on seeds 3 and 11).

### 2z. The golden apple's worth (the owner, 2 November 2026; a measurement, then an engine-rules entry if needed)

The only golden food without a power: +3, a race to it before it fades. A census on fresh seeds: how often it is
contested, and whether a snake that eats one places or wins better than one that does not. If it pays, it stays as it
is. If it does not: +3 and both rests refilled ("the apple of vigour"), measured both ways like any rule.

Done (PR #459): measured, and no rule changed. The question is #460.

### 2u. One stamina for jump and dash (the owner, 2 November 2026; an engine-rules entry, after 2z and before part 7)

One stamina for both plain powers, shown in how each snake looks, no tail cost, each power a third to two thirds of
plain power uses and neither better in aggregate, the pace kept: `docs/design/37-one-stamina.md`. Part 7's pricing then
prices the one stamina. Once it merges, the golden apple is measured again with the stamina refilled in place of the
two rests (2z, #460): "The golden apple's worth" in `docs/design/04-food-and-the-world.md`.

**Who builds it** (the owner, 6 November 2026; #530): the second account's builder, which merges its parked
`entry/2u-stamina-looks` into `entry/2u-one-stamina` and finishes 2u in PR #462.

Done (PR #462): one stamina for both plain powers, the looks on every snake (tired, awake, game on), your ring, no
tail cost; each power a third to two thirds of plain uses, the pace kept. Star's question is #552 (answered: keep).

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

Done (PR #557).

### 2u+. The stamina economy and the golden apple's worth (the owner, 3 and 4 November 2026; #460; a measurement right after 2u, then an engine-rules entry for what pays)

Right after 2u, on fresh seeds and for every rival, in two steps, each against the game as 2u leaves it. **Where stamina
comes from** (the owner, 4 November 2026: "anything you eat should give a little stamina recharge"; "stamina maybe
becomes something that don't recharge by itself, or at least very slowly. But maybe food gives it, and you can reach
over baseline, save up?"): every food refills it in proportion to how much it grows the snake; on its own it still comes
back ("It will still slowly recharge"), as built or only slowly, either up to a floor (a first guess of half a bar, so a
snake far from food is never powerless) or all the way to the full bar; and it banks above the full bar up to a cap
("Maybe the cap should start at 3x baseline, and be figured out in testing"), shown as the charged look in
`docs/design/37-one-stamina.md`, never as a bar ("should not show a bar above you"). **The golden apple** (2z, PR #459:
its +3 costs more time alive than it helps): a full baseline's refill ("Golden apples gives full 1x baseline"), against
that plus a shield that absorbs one bump ("I only imagined it as absorbing 1 bump. If you have no space to move, it does
you no good"), kept until used or fading after a while (a first guess of 10 s), and against the supercharge of 3
November (a first guess of 4 s at a faster refill). What pays is built, with its cue, lesson, Field guide row and
protocol bump: eating late must come to pay without always paying, plentiful rounds must not turn into power spam, the
shield must never make anyone safe (if shielded snakes outlive everyone, it is tightened or dropped), every trademark
holds (Gobbler's food share, Mute's boxing and Creeper's tail-riding above all), and the rivals play it well: eating
when low, banking before a fight. The dash's worth is retuned too (#536; "No hidden prices" in
`docs/design/37-one-stamina.md`). Part 7 then prices the powers against the economy that wins.

Done (PR #560): every meal tops up stamina (300 ms a segment) and banks past the full bar, up to 3 bars, the charged look its cue; the refill stays as built; a jump 5.8 s and a dash 9.5 s of the bar, each the more useful in about half the moments; the golden apple fills the bar and gives a 10 s shield. The pace and every trademark kept.

### 2q. Rivals notice like people (30 October 2026; an AI entry, after 2s)

The owner: "do the snakes have a bit too good reaction time? [...] Just seems they play a bit too well in that regard
perhaps", and to the take that what is superhuman is not the 240 ms but seeing the whole board at once: "Agreed to
all!". Every rival's view of another snake is as old as a person's notice of it would be: `REACTION_MS` (240) near its
own head, growing with distance to about 400 ms across the board (`REACTION_FAR_MS`, first guesses), with a little
variation from moment to moment, so near things are seen at once and far ones a beat late, as a person sees them
("Clever rivals, human reactions"; the AI still plans as far ahead as before). Online the same. Measured before and
after: per-persona win rates, every trademark and the feel numbers within noise or explained, through
`tools/abtest.js` on fresh seeds; the PR shows the table.

Done (PR #576): another snake is seen `REACTION_MS` late near a rival's head, growing to `REACTION_FAR_MS` (400 ms) 24
steps off, give or take 50 ms drifting over 8 ticks (never back in time); a snake seen later has its timers counted on,
so a rival reckons where it's got to, and Copycat watches each at its own moment. On fresh seeds 79 and 83 (1,200
paired rounds) pace, starving and every trademark the same, no win rate decided; deaths by cut 4.6% to 7.1% (a
flasher beside a snake is noticed a beat later). Part 4's per-use test again: the flight +0.20 ± 0.15 place a use.
