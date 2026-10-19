# Barkstreet Snakes

A snake game on a mossy log: you against three AI rivals on a fallen log in the woods, drawn at random each round from a cast of eighteen. Plays in the browser, on desktop and phone. Plain HTML, CSS and JavaScript, with no build step, no dependencies and no asset files: every picture is drawn and every sound is synthesised in the page.

**Play:** https://haaktuah.github.io/barkstreet-snakes/

## Rules

- Four snakes share a 24×24 stretch of mossy log: you (green, with a glowing cream outline) and three AI rivals. From the countdown until a few seconds in, a bouncing arrow says **YOU** over your head, with chevrons showing which way you're going (online, each player sees their own, and friends' names). Watch their eyes: each one looks at whatever it's after.
- **Crashes hurt, they don't kill (mostly).** Hit the edge, a hole, any snake's body or another snake's head and your head bounces back: you lose 3 segments off your tail (they break off as beads anyone can eat) and you're stunned for a moment, stars round your head. Steer meanwhile, and you go your way when it's over; if you don't, you turn to where there's room. **You're out** if you crash when you're at your smallest (3), or if there'll be nowhere to turn when the stun's over (a tail that'll have moved on by then counts as room). Two snakes meeting head-on with nowhere to turn: the longer one bounces, the shorter one's out (the same length: both). Everyone starts at 4, so your first crash costs one segment, not the round; after that, every apple is armour: the longer you are, the more knocks you can take.
- When a snake dies, it falls to pieces: a glossy bead for every other segment (at least three), in its own colours and markings, which anyone can eat. Beads go off like apples: after about 14 seconds they dull, shrink and are gone.
- The last snake alive wins. If you die first, you can watch the rest of the round or start over.
- The first moves are a little slower, then the game speeds up gently over two minutes, to about a third faster.
- **Apples rot:** each lasts about 8 to 16 seconds, less as the round speeds up. It bruises, browns and gets a fly as it goes, then rots away, and a fresh one drops from the tree above somewhere else.
- **Hunger:** go 20 seconds without eating (mushrooms don't count) and you start shrinking, one segment every 1.5 seconds. Between 0:45 and the woodpecker's arrival, when food's everywhere, a meal keeps you only 13 seconds. Starve at length 3 and you're out, unless your head reaches food that very moment. The bar under each name shows how much of everyone's last meal is left (full after any meal), and turns red, the tag pulsing, 6 seconds before they start shrinking. **Your own beads make you choke:** head into the tail you lost in a crash and you spit it aside (it stays food for anyone else) and cough for about a second, eating nothing. Food your coughing head reaches rolls a cell aside, by a rule you can see: to the outside of a turn; going straight, to the side with more open log, a tie toward the middle; if that side's blocked, the other; if both are, it stays. A rival close to starving drops whatever it was up to and takes its chances for food.
- **Weather:** after the first 15 seconds, spells of weather come and go, with clear spells between, every kind before any comes round again. Everyone, the rivals included, sees all of it coming.
  - **Sun:** golden hour. Golden apples are five times as likely.
  - **Wind:** gusts knock apples loose, up to three more than usual.
  - **Rain:** two more mushrooms sprout, and any fire goes out. Half the time, when the rain stops, a rainbow arches right across the log out of a golden apple.
  - **Storm** (not before 30 s): lightning. Where it's going to strike crackles for about a second first, and it never strikes within 4 cells of a head. It sets the bark alight: fire burns for about 5 seconds and creeps to the odd neighbouring cell (smouldering first, harmlessly, so you see it coming), 12 cells at most over a fire's life. **Crawl into fire and you catch alight:** for about 2 seconds you lose a segment every 6 ticks, 3 in all, the same as a crash (they fall off roasted), but you keep moving; rain or snow puts you out sooner; at your smallest, it finishes you. Boxed in, the rivals will take the fire over a crash too. **Food in the fire cooks:** an apple or a bead bakes after about 2 seconds (worth 2), and goes to ash if it stays in. Storms are often followed by rain.
- **Burrows:** the first beetle cracks a burrow open in the bark, and later ones open more. A cornered beetle that digs in leaves one too, freshly bored (raw pale wood and splinters), where it went down. There are three at most: past three, the one unused longest closes over with a soft crumble, sawdust and moss filling it (the first burrow a dig leaves in a round says so: "A beetle that digs in leaves a burrow behind."). Burrows are safe to cross, and nothing grows on them: knocked food and a dead snake's beads never land on one; cracks spread from them as the round goes on. A scared beetle that reaches one dives in and pops out of a burrow a moment later.
- **Sudden death:** after two minutes nothing new grows, the sky clears, and a big woodpecker lands beside the board. Only the last apples still fall, one at a time, each wait longer than the last. Beetles still come out. Every few seconds the woodpecker picks a patch of about 12 cells somewhere on the log (a cell bigger each time, up to 20; often under a snake, or widening an old hollow), eyes it (the patch glows and cracks, faster and faster) for about a second and a half, swoops in and pecks it out. It doesn't aim within 4 cells of a head, and **won't shut anyone in if it can help it**: it never picks a patch that leaves a snake less room than its length while there's anywhere else to aim; a crumb of one or two cells it would cut off goes with the patch, and its holes come out round. **Food in the patch is knocked aside** to the nearest free cell outside it (ties go nearest the middle of the log, then the first by row; never onto a body, food, a hole, fire or a burrow): through the aim it trembles, and a faint ring shows where it'll land. The ring is a promise: the piece lands there unless a head or a beetle gets onto that cell on the strike's own tick, and then it goes by the same rule. Only with nowhere to go does the bird eat it. Fire and a burrow in the patch go, and so does a head on the ground there: you're out. **A body lying across the patch isn't hurt:** it bridges the new hole, which is an ordinary hole once your tail has passed. The holes join up into hollows and stay for the rest of the round. It gets hungrier as it goes: each rest a little shorter, each patch a cell bigger, so the log shrinks faster and faster, and the woodpecker and hunger finish the round.
- **Winter** (snow, now and then a spell of weather, never before 45 s): the lean season. One apple, rotting twice as fast, no new mushrooms, no golden apples, and everyone gets hungry 1.75 times as fast. Snow puts fire out. In **wind** and storms, a fire flings burning leaves downwind: they smoulder first, then burn small.

### Jumping and flashing

Everyone has two powers, each with its own press:

- **Jump** (Space, or a click on the board; on a phone, tap): with a body, a hole or fire right in front of you and room beyond, you hop over it, two cells in two ticks. It costs the tip of your tail and needs 4 seconds before the next.
- **Flash** (E or Shift, or a right-click on the board; on a phone, swipe the way you're already going): two cells in one tick, along the ground. It's free, then rests 6 seconds. It eats what it passes but cuts nothing: whatever's in the way, you run into.

Press both and the jump goes first if there's something to hop; the flash follows once you're down. A flash pressed in the air goes once you land. Pressed while you're stunned, a power that can't get anywhere just says so, and you turn clear.

Two half-rings round your head show both rests, the jump's on the left in sky blue and the flash's on the right in ember, and your tag's chips fill with them. Golden food makes them stronger, and it adds up:
- golden beetles give golden jumps (up to 3 held);
- golden leaves give golden flashes (up to 3);
- golden mushrooms make the edges wrap (12 seconds each, up to 20).

Golden ones go before the plain ones and leave their rests alone. Anyone holding one wears a gold outline, with sky-blue round pips behind the head for golden jumps and ember diamonds for golden flashes. The rivals jump, flash and wrap too, golden ones included, by the same rules, when it pays them: about two flashes a minute (Star, the power addict, nine or ten).

### Food

| Item | Effect |
|------|--------|
| Green apple | +1 length. Two on the board (one in winter, more in a wind). Once the woodpecker comes, the last ones fall one at a time, further and further apart. |
| Golden apple | +3 length. About five a round, landing away from everyone's heads; sparkles, and fades before it rots after about 12 seconds. |
| Red mushroom | Poisonous, and it looks it (a violet haze, stink lines, spores). Shrinks you by 3 (never below 3). Never sprouts right by a head; withers after about 20 seconds and regrows elsewhere. |
| Beads | +1 length. What's left of a dead snake (a bead every other segment), or the tail that broke off in a crash, in its colours. They rot after about 14 seconds. Roasted ones (from a snake on fire) are +2 and last longer. Your own make you choke: you spit them aside, and cough. |
| Baked apple | +2 length. An apple that sat in a fire for about 2 seconds: steaming, glazed and split. |
| Golden beetle | +2 length, and **two golden jumps** (up to three held): three cells in two ticks, hopping up to two, free. About one beetle in eight is golden. |
| Golden leaf | Only on the wind (in about 6 rounds in 10), landing away from everyone's heads. +1 length and **two golden flashes**, up to three held: three cells in one tick, cutting through a snake one cell thick and putting out fire. Flash into the edge or a hole with a golden one and you blow up. |
| Golden mushroom | Only in the rain (in about 6 rounds in 10), landing away from everyone's heads. +1 length, and for **12 seconds the edges wrap round** for you: off one side, in at the other. Another adds 12 more, up to 20. |
| Beetle | +2 length. Now and then one crawls out of a burrow (from 15 s in, the woodpecker's time too), up to two at once, and a scared one runs for a burrow within 6 cells and dives in. It wanders slowly, and scurries away (at half a snake's speed) when a head gets within 4 cells, so catching one is a short chase. **Cornered** (a head within 6 cells and no burrow it could run for), it digs in where it is: about a second, and you can still catch it; then it's gone underground, comes out of a burrow later, and leaves a burrow where it dug. Uncaught, it flies off after about 30 s. |

## Play with friends

Press **Play with friends** on the start screen, then **Host a game** and send the link (or the five-letter code) to up to three friends. When they're in, press **Start**. Empty seats get AI rivals, and you can play round after round in the same room.

- One browser hosts: it runs the game, and friends' browsers connect straight to it (peer to peer). There's no game server and nothing to sign up for. A free public service, PeerJS, only introduces the browsers to each other.
- It's fair: the rivals treat everyone alike, and the host's own turns are held back by the friends' lag, so the host gets no head start.
- **Shared Hall of Fame:** when you connect, your best rounds and your friends' are copied into each other's Hall of Fame (marked "friend"), and every round you play together is recorded for everyone. Your stats and **Only you** stay yours.
- If a friend's connection goes quiet, an AI steers their snake until they're back; if they leave, it finishes the round for them.
- There's no napping online, and the host's tab should stay open (it keeps the round going even in the background).
- On some strict networks (certain mobile carriers and offices) browsers can't connect directly. If a friend can't get in, try another network; for good, a relay (TURN server) can be added in `net.js`.

## Controls

| Action | Keyboard and mouse | Touch |
|--------|----------|-------|
| Steer | Arrow keys (or WASD); turns are queued, so quick double turns work | Swipe (anywhere on the screen during a round) |
| Jump | Space, or click the board | Tap |
| Flash | E or Shift, or right-click the board | Swipe the way you're already going |
| Nap (pause) | P or Esc | ⏸ button |
| Start / start over | Enter or R (mid-round it asks first: press it again), or any arrow on the start screen | Play button |
| Hall of Fame, Your story, Field guide | H | Hall of Fame button |
| Sound / music | M / N | 🔈 / ♪ buttons |
| Watching speed | 1, 2, 4 | 1× 2× 4× buttons |

The game naps by itself when you switch tabs or windows, so you never come back to a dead snake.

## Sound and music

Everything you hear is made live with the Web Audio API, and placed left or right where it happens on the board. Apples climb in pitch as you eat a streak; taking a rival out lands a punch; a near miss with another head whooshes past; first blood gets a dark stab and the last two a riser; the woodpecker calls, ticks as it takes aim, and drums. Crossing into a rival's land knocks a muffled drum and a fife answers; a flash whooshes, and when it's rested again an ember spark crackles (the jump's is a wooden tick); the last apples starting to fall get soft notes falling down the minor key; a cornered beetle digging in scrabbles a quick bore into the bark, a burrow closing over crumbles softly, and food the woodpecker knocks aside goes with a hollow tok and a whoosh. The weather has its own sound (rain hissing, wind gusting, a storm rumbling, winter's hush). The music follows the round, from a calm loop on the start screen through bass, shaker and bells as it speeds up, a minor key with toms when the woodpecker comes, to a racing duel for the last two, and it feels the danger: when a rival's head is close to yours, or you're boxed in, a heartbeat comes in and the bass drives. Sound and music each have their own switch, and both are remembered.

## Bark chatter

The AI snakes talk. Each one has its own voice: Sovereign uses the royal "we", Colonist is a pompous redcoat, Mason speaks only (dubious) Latin, Ghost mostly says "…", and Copycat repeats whatever it just heard, in Chinese. Some of them talk to each other. They react to what happens to them, too: the woodpecker pecking under them, the rain putting them out, food rotting or burning before they get to it, starving, being cut by a golden flash, a beetle they cornered digging in and getting away, and the woodpecker knocking their food to someone else. Lines pop up in speech bubbles and in a log under the board, which you can switch off. A line takes a rest before it comes round again, and a joke is told once a round.

## Watching the AIs

Press **Watch AIs** on the start screen for a round between four AI snakes, with a 1×/2×/4× speed control (or the keys 1, 2 and 4). The same control appears when you're watching after dying. Every round starts at 1×, and at 2× or 4× the board's own effects speed up too. **Watch again** on the round-over card keeps you watching; Enter or R start a round you play. Watched rounds put the AI snakes in the Hall of Fame, but don't count towards your own stats.

## The rivals

Each round, three of these eighteen are picked at random. The start screen tells you who you're up against and how each one plays. Only you have a real forked tongue: every few seconds each rival flicks out something of its own instead, such as Wildcard's dollar bill, Joker's party horn or Desperado's six-shooter.

| Snake | Look | Style |
|-------|------|-------|
| **Sniper** | blood red, one eye behind a scope | Picks whichever snake it has the best shot at, gets in front of it and squeezes its space. |
| **Gobbler** | orange, puffy cheeks | Eats everything, even a rival's apple. Hates mushrooms. |
| **Ghost** | pale, fading body | Keeps its distance from everyone, and slips through the gaps. |
| **Sovereign** | royal blue, golden crown | Rules its own patch of log, marked out with borders like a map in royal blue, its banner flying at the capital, and attacks anyone who trespasses. Its realm grows as it does, shrinks if it wastes away, and drifts off land the woodpecker or fire takes. You take on its colour when you go in. |
| **Colonist** | redcoat, tricorn hat | Plants flags all over the board, each colony a patch of land with its own borders, and defends every one of them. The first flies the Union Flag, later ones colonial ensigns (blue with the Southern Cross, red with a badge). |
| **Drab** | khaki, sleepy eyes | Plays it safe and sensible. Nothing special. |
| **Vulture** | black, pink bald head, hooked beak, scowl | Hovers near snakes in trouble and feeds on what they leave behind. |
| **Mason** | Caesar in marble, laurel wreath | Walls off the board, then keeps the biggest piece. |
| **Wildcard** | the Stars and Stripes, orange tan, golden combover, long red tie | A random mix of habits, new every round. |
| **Mute** | a mood-ring mime: white greasepaint, beret, a painted tear; its body turns the colour of how it feels | Picks someone and closes an invisible box around them. Never says a word (it mimes). |
| **Creeper** | teal, slit eyes | Sneaks up and rides right behind other snakes' tails. |
| **Metagamer** | cyan, 3D glasses | Watches how each rival plays, then avoids the aggressive ones, shadows the greedy ones and hunts the evasive ones. |
| **Capricious** | changes with its mood | Starts undecided, then does impressions of Sniper, Gobbler, Ghost or Mason, ten seconds or so at a time. |
| **Copycat** | the flag's red, cat ears, a yellow party pin; copying, its body wears a pale copy of its model's | Copies whoever seems to be winning, right alongside them. Party member. |
| **Joker** | jester hat, harlequin diamonds, red nose | Lures chasers into dead ends and swerves away at the last moment. |
| **Desperado** | rust poncho, cowboy hat, bandana | An adrenaline junkie: skims the edge, bodies and other heads for the thrill of it. |
| **Ouroboros** | a real snake: dark gold python diamonds, a wedge head, slit eyes, fangs | Chases its own tail: once it's long, it moves as a ring, and whatever's inside is in trouble. Now and then it bites its own tail. |
| **Star** | a sunflower star with a big white walrus mustache, a rainbow streaming behind it | A power addict: jumps and flashes every chance it gets, and craves anything golden that feeds the habit. When it flashes, its star's points go dim and light back up one by one as its flash comes back: count them, and box it in while they're dim. |

All of them share the same sense of danger. They plan a few moves ahead, check that they'll still have room to move (or can chase their own tail), don't let themselves be pinned against the edge or a body (or shut in a pocket) where another snake could come round and close the way out, and avoid the space around other snakes' heads. On top of that, each one chases its own goal.

They're also fair. They see the other snakes as they were about a quarter of a second ago, like a human's reaction time, so they can't dodge your sudden turns any faster than you could dodge theirs. Food they see as it is, as you do. And they aren't told which snake is you: you're judged only by how you move, like everyone else.

## Hall of Fame and stats

Everything is saved in your browser only. If your browser won't keep anything (storage blocked, or full), the records last until you close the tab, and the Hall of Fame says so.

- **Hall of Fame:** the top 10 rounds, ranked by finishing place (a win beats any 2nd place), then by how long the snake stayed alive, then by food eaten. The AI snakes get entries too, so you're competing against them on the list. Switch to **Only you** to see your own top 10. When a round makes the top three, or beats your best, you can carve your name on the end screen. Until you do, your rounds go in as Green (the game's name for you), and carving a name puts it on all of them.
- **Your story:** rounds played, wins, average place and score, how often you finished in each place, and what killed you (including your nemesis, whatever gets you most often).
- **Field guide:** every food, power and danger on the log, with its picture and its rule, and the keys for each power.

## Run locally

Serve the folder with any static server (for example `npx serve` or `python -m http.server`) and open it in a browser. Opening `index.html` directly works too.

- `?perf` shows a frame-time overlay (toggle it with the ` key).
- `?debug` adds `SnakeDebug` to the console, for example `SnakeDebug.setup(['sniper', 'mason', 'ghost'])` to start a round against chosen rivals.
- `node tools/records-test.js` checks that shared and played-together rounds land in each friend's Hall of Fame exactly once, and that a browser that won't keep records still has them until the tab closes.
- `node tools/online-test.js` plays rounds through the online protocol and checks that a friend's screen matches the host's every tick, and that the plans a friend draws ahead from (where everyone goes next) are the host's; it stages chokes and nudges too, so every round crosses some, and every way to be out (all ten, read from engine.js) must cross at least once, staged if the rounds don't bring it. The same goes for every kind of event the engine makes: digs and dug dives, knocks (a bead's colour, and the bird eating one) and where the strike promised each would land, beetles digging and underground, the burrows as the engine keeps them (opened, last used, dug), one a dig opened and one closing over; and it feeds the friend's screen malformed ones of each (a burrow off the board or not opened on a tick among them).
- `node tools/simulate.js 200` plays 200 AI-only rounds headlessly with the game's own rules and AI, and prints each personality's win rate, food, kills, how snakes die and so on. Add `--seed 1` to repeat a run exactly (on any machine), `--check` to fail on a stalled round, `--census` to count what a round holds (golden things, weather, lightning, the woodpecker, powers, how hungry snakes are before the woodpecker comes and after; the beetles: how each one above ground ends, caught, down a burrow, dug in, flown off or pecked, the same for the chased ones and how long a catch takes, digs, dives into burrows a dig left, burrows open and cells free for an apple; and the woodpecker's fairness: food knocked aside and how much the bird ate, marks that shut a snake in and the deaths after them, crumbs of log cut off, and how often the biggest island's snake wins against a blind pick), `--signatures` to measure each personality's trademark against the field, and `--root <dir>` to play another copy of the game, to compare versions.
- `node tools/bench-ai.js [--base REV|DIR] [--root DIR] [--seed N] [--repeat R] [--only before|after]` times the rivals' thinking: `decide()` on positions recorded from seeded AI-only rounds, in two copies of the game side by side (by default the last commit's and the files as they are), and checks that every position decides the same in both. Run it before the `simulate.js` fingerprints whenever `ai.js` changes: it's quicker, and it says which positions went another way. Its CPU time is the deciding thread's alone, leaving out the compiling V8 does in the background (a whole `simulate.js` run pays for that).
- `node tools/rules-test.js [--seed N]` (N: other randomness for the checks that don't seed their own; the same run every time without it) checks the rules on hand-built boards: tails, head-ons, starving, the woodpecker's manners (shutting nobody in while it has another patch, taking the crumbs, rounder hollows, and where knocked food lands: each tie, never onto a body, food, a hole, fire or a burrow, the strike's own list and the bird eating what has nowhere to go; the ring a promise: food beside a snake the strike pecks lands on its ring, a ring a head moves onto goes by the rule, never onto a ring kept for another piece), beetles (two at once and never three, in sudden death too, digging in and caught mid-dig, the burrow a dig leaves and the one unused longest closing over), beads never on a burrow, what the AIs can see, and Star's habit (it flashes and jumps where nobody else would, round a body ahead rather than into it, and goes for a golden leaf over a nearer apple).
- `node tools/chatter-test.js` checks that every line the rivals say has its Chinese, for Copycat, that no Chinese is left over from a line that's gone, and that every line marked as a punchline is one someone says; then it plays the chatter with the game's own engine through staged moments (pecked under, put out by the rain, food burning or rotting nearby, starving, cut by a golden flash, flashing, the last apples, and Star showing off at most every 10 seconds, even at its most addicted; choking, with every voice's line and its rest, and the thanks for food a cough knocked aside; a colony or capital the woodpecker took; a beetle that dug in and got away, with its hunter's line and rest; food the woodpecker knocked aside and someone else ate, and the grumble) and a few whole AI rounds, which count the chokes, the digs and the knocks and the lines for them. Last, it runs the sound (audio.js on a stand-in AudioContext) and checks that a rival's flash, jump, golden flash, catching fire, golden mushroom, dig or knock never silences yours, that your own golden flashes or golden jumps in a row are each heard, that each choke, cough, dig and knock is heard, that two burrows closing over at once are one crumble, and that mute silences them.
- `node tools/input-test.js` checks the controls in headless Chrome with real key and touch events on a steady 60 Hz clock: Space or a tap jumps, E, Shift or a swipe ahead flashes, nothing else fires a power, a swipe never jumps, and a press reaches the next tick. A thumb resting before it swipes or while the other swipes, and a quick double flick, never fire a power; a tap that drifts as it lifts still jumps, a long slanted stroke still turns, and mashing jump over your death's card never starts a round. The mouse gets real presses too: the left button jumps and the right flashes, both together go in turn, no menu pops up over the board, clicks on a card or off the board fire nothing, and mashing the mouse over a death card never plays again or focuses the carve field. It also checks the lessons and their sounds: the choke and the nudge; a beetle digging in near you (heard as yours, or as a rival's when another head cornered it); the woodpecker's lesson, once its own banner has had its time, and its knock (once a strike, from the first piece that flies, nothing for food the bird ate); a beetle down a burrow or up out of one scrabbling; a dug dive and the burrow it leaves silent (no creak, no news of a burrow cracking open), that burrow's lesson the first time the banner's free for one and once a round, a burrow cracking open creaking and one closing over crumbling.
- `node tools/render-test.js` checks the renderer's promises a picture can show, in headless Chrome: a flash drawn ahead and gliding on, a corpse's beads in its markings, power pips on the board at its edge, scorch as soot, every Field guide picture, Star's look (a star for a head, its rainbow flowing back from it, its tell, its beads, its mustache gag), jumps (the arch, the shadow across the hurdle, dust and trail, and none of the motion with reduced motion), bridges (shade, sag, the shadow in the pit, a drooping tail), choking (cheeks, the spat bead's arc, a shut mouth and cough puffs, rolls and scurries), a pecked flag (it tips and falls, the land shrinks into the pit, a banner carried), the strike's land drawn ahead (pixel for pixel a rebuild), Star's rainbow streaming (back as it goes, still when stunned, a burst on a flash, a slow drift with reduced motion), two beetles, one digging in, the burrow it leaves freshly bored and settling into an ordinary one (no heap without a burrow), a burrow closing over (sawdust and moss, gone in about a second; at once with reduced motion), the woodpecker's knock (food trembling in the mark, a ring for each piece, on the aim's last tick the engine's promise, the flight in an arc, a beetle scurrying) and Copycat's red head while it copies.
- `node tools/shots.js [dir]` takes the screenshot tour in headless Chrome (title, play, a bite, the powers, a nap, a death, the cards, the Hall of Fame, Your story and the Field guide, a round with Star, a jump, a bridge, Star's gag, a choke, a falling flag, a beetle digging in, a dug burrow and one closing over, the woodpecker's knock, a laptop, a phone both ways), with an autopilot at the wheel; `--staged [names]` takes only the staged moments (jump, bridge, star-gag, choke, dig, heal, knock, knock-flight, flag), at desktop 2x, a phone both ways at 3x and with reduced motion. `node tools/bench.js` measures frame times the same way, and what Sovereign's and Colonist's land, a woodpecker strike (and one cutting the land), fire burning out and Star's look cost; `node tools/bench.js --base REV|DIR [pairs] [--scenes a,b]` times this copy against another in one page, side by side with frames in turn, and prints each scene's ratio with its quartiles, then the strike cutting the land, its aim's frames, and a strike in late sudden death. They need Chrome (or set `CHROME`); nothing to install.

### Running experiments

A balance question ("does this shorten sudden death?", "did my change hurt anyone?") is cheapest answered in three steps:

1. **Screen it with `tools/abtest.js`**, which plays two copies of the game on the same seeded rounds, paired, and stops as soon as every number it waits for has a verdict: B higher, lower, or the same within a margin that matters. It plays 100 rounds a seed at a time (seeds 3 and 11, up to 600 each), so a clear answer often takes a look or two instead of 600 rounds a seed on each side, and its intervals stay honest however early it stops and however many numbers it shows: the chance that any verdict in its table is wrong is at most 5%. By default it asks about the round's pace (`length`, the median round, and `sd`, how long sudden death lasts and how many rounds reach it). Ask only for what the question is about, since every number asked for widens every interval a little, and it stops only when all of them are decided: `--metrics` picks from `length`, `sd`, `deaths`, `starving` and `powers`; `win` and `place`, each personality's win rate and average place (shown, but not waited for: a few hundred rounds each can't pin them within a margin that matters); and `trademarks` (each personality's, as `--signatures` measures them) when a change mustn't blunt them.

   `node tools/abtest.js . ../variant --metrics sd,deaths`

2. **Fast-forward a late-game question.** `--at 120000` stores every round at 2:00, as A plays it, and plays both copies on from there. The openings, most of a round's work, are played once, and the two sides are the same round up to the woodpecker, so a difference shows sooner. By hand, `simulate.js --save-at` stores the rounds (and prints where) and `--from` goes on with them under any copy; with the same files, every round comes out exactly as played straight through.

   `node tools/abtest.js . ../variant --at 120000 --metrics sd`

   `node tools/simulate.js 600 --seed 3 --save-at 120000`, then `node tools/simulate.js --from FILE --root ../variant --census`

3. **Confirm once, at the end, on fresh seeds.** Seeds 3 and 11 chose what you kept, so their rounds can't confirm it: a variant that won a lucky streak there would only be confirmed by the same streak. Ask the same question on seeds the screening never played, and take the numbers you'll report from those rounds:

   `node tools/abtest.js . ../variant --seed 29 --seed 41 --metrics sd,deaths`

   `node tools/simulate.js 600 --seed 29 --census --root ../variant` (and `--seed 41`). `--census` includes a table for each personality (flashes and jumps a minute, golden pickups, chokes, crashes survived, time alive, food, kills), so there's no need for a harness of your own.

Every seeded round is cached by the files that played it, round by round, so asking again or for more rounds plays only the new ones: the A side of one experiment is free in the next, and the rounds the confirming abtest played (without `--at`) are free in its `--census`. The files are read when a run's turn comes, and what's stored is what played: a file edited while a run waits is played as it is then. Only one simulation runs on the machine at a time (the next waits its turn), on half the cores, at low priority.

### How it's put together

| File | What it does |
|------|--------------|
| `tuning.js` | Every number that shapes how the game plays and feels, in one place. |
| `engine.js` | The rules: moving, eating, dying, hunger, the woodpecker. No drawing, so it also runs in Node. |
| `ai.js` | The rivals' brains and personalities. |
| `render.js` | Draws the board on a canvas, with smooth movement between ticks. |
| `audio.js` | Sound effects and the adaptive music, synthesised live. |
| `chatter.js` | The rivals' speech bubbles and chat log. |
| `records.js` | The Hall of Fame and your stats. |
| `online.js` | Play with friends: the messages between host and friends. |
| `net.js` | Play with friends: the connections (PeerJS, loaded only when used). |
| `snake.js` | Ties it together: the game loop, input, the cards, the controls and the lobby. |
