# Barkstreet Snakes

A snake game on a mossy log: you against three AI rivals on a fallen log in the woods, drawn at random each round from a cast of eighteen. Plays in the browser, on desktop and phone. Plain HTML, CSS and JavaScript, with no build step, no dependencies and no asset files: every picture is drawn and every sound is synthesised in the page. (Working on it? See [docs/developing.md](docs/developing.md).)

**Play:** https://haaktuah.github.io/barkstreet-snakes/

## Rules

- Four snakes share a 24×24 stretch of mossy log: you (green, with a glowing cream outline) and three AI rivals. From the countdown until a few seconds in, a bouncing arrow says **YOU** over your head, with chevrons showing which way you're going (online, each player sees their own, and friends' names). Watch their eyes: each one looks at whatever it's after.
- **Crashes hurt, they don't kill (mostly).** Hit the edge, a hole, any snake's body or another snake's head and your head bounces back: you lose 3 segments off your tail (they break off as beads anyone can eat) and you're stunned for a moment, stars round your head. Steer meanwhile, and you go your way when it's over; if you don't, you turn to where there's room. **You're out** if you crash when you're at your smallest (3), or if there'll be nowhere to turn when the stun's over (a tail that'll have moved on by then counts as room). Two snakes meeting head-on with nowhere to turn: the longer one bounces, the shorter one's out (the same length: both). Everyone starts at 4, so your first crash costs one segment, not the round; after that, every apple is armour: the longer you are, the more knocks you can take.
- When a snake dies, it falls to pieces: a glossy bead for every other segment (at least three), in its own colours and markings, which anyone can eat. Beads go off like apples: after about 14 seconds they dull, shrink and are gone.
- The last snake alive wins. If you die first, you can watch the rest of the round or start over.
- The first moves are a little slower, then the game speeds up gently over two minutes, to about a third faster.
- **Apples rot:** each lasts about 8 to 16 seconds, less as the round speeds up. It bruises, browns and gets a fly as it goes, then rots away, and a fresh one drops from the tree above somewhere else.
- **Hunger:** go 20 seconds without eating (mushrooms don't count) and you start shrinking, one segment every 1.5 seconds. Between 0:45 and the woodpecker's arrival, when food's everywhere, a meal keeps you only 12 seconds. Starve at length 3 and you're out, unless your head reaches food that very moment. The bar under each name shows how much of everyone's last meal is left (full after any meal), and turns red, the tag pulsing, 6 seconds before they start shrinking. **Your own beads you squash:** run your head over a bead of your own (from a crash or a cut) and it's squashed flat, a little splat on the bark: food for nobody. So chase down the tail you lost before the others eat it. A rival close to starving drops whatever it was up to and takes its chances for food.
- **Weather:** after the first 15 seconds, spells of weather come and go, with clear spells between, every kind before any comes round again. Everyone, the rivals included, sees all of it coming.
  - **Sun:** golden hour. Golden apples are five times as likely.
  - **Wind:** gusts knock apples loose, up to three more than usual.
  - **Rain:** two more mushrooms sprout, and any fire goes out. Half the time, when the rain stops, a rainbow arches right across the log out of a golden apple.
  - **Storm** (not before 30 s): lightning. Where it's going to strike crackles for about a second first, and it never strikes within 4 cells of a head. It sets the bark alight: fire burns for about 5 seconds and creeps to the odd neighbouring cell (smouldering first, harmlessly, so you see it coming), 12 cells at most over a fire's life. **Crawl into fire and you catch alight:** for about 2 seconds you lose a segment every 6 ticks, 3 in all, the same as a crash (they fall off roasted), but you keep moving; rain or snow puts you out sooner; at your smallest, it finishes you. Boxed in, the rivals will take the fire over a crash too. **Food in the fire cooks:** an apple or a bead bakes after about 2 seconds (worth 2), and goes to ash if it stays in. Storms are often followed by rain.
- **Burrows:** the first beetle cracks a burrow open in the bark, and later ones open more. A cornered beetle that digs in leaves one too, freshly bored (raw pale wood and splinters), where it went down, taking the place of any burrow near it, so burrows keep apart. There are three at most: past three, the one unused longest grows shut over the next several seconds, sawdust creeping in from the rim and moss growing over it, until only a faint scar is left; meanwhile beetles still dive in, but none come out. Burrows are safe to cross, and nothing grows on them: knocked food, a dead snake's beads and a mushroom that bounces aside never land on one; cracks spread from them as the round goes on. A scared beetle that reaches one dives in and pops out of a burrow a moment later.
- **Sudden death:** after two minutes nothing new grows, the sky clears, and a big woodpecker lands beside the board. Only the last apples still fall, one at a time, each wait longer than the last. Beetles still come out. Every few seconds the woodpecker picks a patch of about 12 cells somewhere on the log (a cell bigger each time, up to 20; often under a snake, or widening an old hollow), eyes it (the patch glows and cracks, faster and faster, and the bird's head turns to it) for about a second and a half, flies in and drums it out, its last blow as the patch gives way. It doesn't aim within 4 cells of a head, and **won't shut anyone in if it can help it**: it never picks a patch that leaves a snake less room than its length while there's anywhere else to aim; a crumb of one or two cells it would cut off goes with the patch, and its holes come out round. **Food in the patch is knocked aside** to the nearest free cell outside it (ties go nearest the middle of the log, then the first by row; never onto a body, food, a hole, fire or a burrow): through the aim it trembles, and a faint ring shows where it'll land. The rings are worked out on the log as it'll be at the strike (a cell a tail will have left by then counts as free), and for the last half second of the aim (5 moves) a ring is a promise: the piece lands there unless a head or a beetle is on that cell at the strike, and then it lands as near its ring as it can, by the same rule. Only with nowhere to go does the bird eat it. Fire and a burrow in the patch go, and so does a head on the ground there: you're out. **A body lying across the patch isn't hurt:** it bridges the new hole, which is an ordinary hole once its tail has passed. **Bridges:** anyone can crawl onto a snake's back where it crosses a hole, or land on it from a jump, but get off onto bark before its tail passes, or you fall in. The holes join up into hollows and stay for the rest of the round. It gets hungrier as it goes: each rest a little shorter, each patch a cell bigger, so the log shrinks faster and faster, and the woodpecker and hunger finish the round.
- **Winter** (snow, now and then a spell of weather, never before 45 s): the lean season. One apple, rotting twice as fast, no new mushrooms, no golden apples, and everyone gets hungry 1.75 times as fast. Snow puts fire out. In **wind** and storms, a fire flings burning leaves downwind: they smoulder first, then burn small.

### Jumping and flashing

Everyone has two powers, each with its own press:

- **Jump** (Space, or a click on the board; on a phone, tap): hop over bodies, holes or fire, up to 3 cells of them, a cell a tick in the air, and come down on the first free cell beyond. So you can hop onto an island, or onto a snake's back where it bridges a hole. There's no auto-jump: a press waits up to 5 moves for something right in front to hop, and a ring shows where you'll land. It costs the tip of your tail and rests 4 seconds.
- **Flash** (E or Shift, or a right-click on the board; on a phone, swipe the way you're already going): two cells in one tick, along the ground. It's free, then rests 12 seconds. It eats what it passes and puts out the first fire on its way.
- **Cuts:** a flash cuts through a body one thick with free log beyond: you come out the other side, and the part behind the cut falls off as beads. Leave that snake fewer than 3 segments in front of the cut and it's out. It works on your own body too: drop your tail to fit a pocket (the game says so when you're really in one, not when you've coiled up with room to crawl out after your tail). A body along the edge, or against a hole or another body, can't be cut from that side.
- **A failed flash:** flash into a head, a body too thick (or with nowhere free beyond), the edge or a hole and it fails: 5 segments off your tail and a longer stun.

Press both and the jump goes first if there's something to hop; the flash follows once you're down. A flash pressed in the air goes once you land. Pressed while you're stunned, a power that can't get anywhere just says so, and you turn clear.

Two half-rings round your head show both rests, the jump's on the left in sky blue and the flash's on the right in ember, and your tag's chips fill with them. Golden food makes them stronger, and it adds up:
- golden beetles give golden jumps (up to 3 held): the same hop, free, with no rest;
- golden leaves give golden flashes (up to 3): three cells in one tick, cutting through a body up to two thick and putting out every fire (into the edge or a hole, you blow up);
- golden mushrooms make the edges wrap (12 seconds each, up to 20).

Golden ones go before the plain ones and leave their rests alone. Anyone holding one wears a gold outline, with sky-blue round pips behind the head for golden jumps and ember diamonds for golden flashes. The rivals jump, flash, cut and wrap too, golden ones included, by the same rules, when it pays them and each in its own style: Sniper cuts off its target, Mute seals its boxes, Gobbler races for food, Vulture flashes to beads, Ghost keeps a flash ready to escape, Mason lays its walls two thick so one flash can't cut them, and Star, the power addict, uses every one it gets.

### Food

| Item | Effect |
|------|--------|
| Green apple | +1 length. Two on the board (one in winter, more in a wind). Once the woodpecker comes, the last ones fall one at a time, further and further apart. |
| Golden apple | +3 length. About five a round, landing away from everyone's heads; sparkles, and fades before it rots after about 12 seconds. |
| Red mushroom | Poisonous, and it looks it (a violet haze, stink lines, spores). Shrinks you by 3 (never below 3), but you keep moving: it sits in your cheek for about a second (a green bulge, and you eat nothing else meanwhile), then **comes back up**, spat 3 cells ahead of you, where a ring has been showing. Steer to aim it: on bark it lies there, on a head that snake swallows it (and spits it on in its turn), off a body it bounces aside, and over the edge or a hole it's gone. Each time it comes back up it takes one more, up to 5, a shade darker. Never sprouts right by a head; withers after about 20 seconds (a spat one sooner) and regrows elsewhere. |
| Beads | +1 length. What's left of a dead snake (a bead every other segment), or the tail that broke off in a crash, in its colours. They rot after about 14 seconds. Roasted ones (from a snake on fire) are +2 and last longer. Your own you squash flat as you pass: food for nobody. |
| Baked apple | +2 length. An apple that sat in a fire for about 2 seconds: steaming, glazed and split. |
| Golden beetle | +2 length, and **two golden jumps** (up to three held): the same hop, free, with no rest. About one beetle in six is golden. |
| Golden leaf | Only on the wind (in about 6 rounds in 10), landing away from everyone's heads. +1 length and **two golden flashes**, up to three held: three cells in one tick, cutting through a body up to two thick and putting out every fire. Flash into the edge or a hole with a golden one and you blow up. |
| Golden mushroom | Only in the rain (in about 6 rounds in 10), landing away from everyone's heads. +1 length, and for **12 seconds the edges wrap round** for you: off one side, in at the other. Another adds 12 more, up to 20. |
| Beetle | +2 length. Now and then one crawls out of a burrow (from 15 s in, the woodpecker's time too), up to two at once, and a scared one runs for a burrow within 6 cells and dives in. It wanders slowly, and scurries away (at half a snake's speed) when a head gets within 6 cells, so catching one is a short chase. **Cornered** (a head within 6 cells and no burrow it could run for), it digs in where it is: about half a second, and you can still catch it (come straight at it from where it starts and you get there just in time); then it's gone underground, comes out of a burrow later, and leaves a burrow where it dug. Uncaught, it flies off after about 30 s. |

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
| Field guide (how to play, and every food, power and danger) | G | Field guide button (an open book), or **How to play** on the start screen |
| Hall of Fame, Your story | H | Hall of Fame button (a trophy) |
| A rival's note (how it plays, what it holds) | Click its name tag, or Tab to it and press Enter; Esc closes it | Tap its name tag |
| Sound / music | M / N | 🔈 / ♪ buttons |
| Watching speed | 1, 2, 4 | 1× 2× 4× buttons |

The game naps by itself when you switch tabs or windows, so you never come back to a dead snake.

## Sound and music

Everything you hear is made live with the Web Audio API, and placed left or right where it happens on the board. Apples climb in pitch as you eat a streak; taking a rival out lands a punch; a near miss with another head whooshes past; first blood gets a dark stab and the last two a riser; the woodpecker calls, ticks as it takes aim, and drums. Crossing into a rival's land knocks a muffled drum and a fife answers; a flash whooshes, and when it's rested again an ember spark crackles (the jump's is a wooden tick); the last apples starting to fall get soft notes falling down the minor key; a flash cutting through a body snips; squashing your own bead is a soft wet splat; a cornered beetle digging in scrabbles a quick bore into the bark, a burrow closing over crumbles softly, and food the woodpecker knocks aside goes with a hollow tok and a whoosh. The woodpecker's drum is its blows, each knock one you see, the last on the strike, and it gives a softer "kik!" as it settles back on its perch. The weather has its own sound (rain hissing, wind gusting, a storm rumbling, winter's hush). The music follows the round, from a calm loop on the start screen through bass, shaker and bells as it speeds up, a minor key with toms when the woodpecker comes, to a racing duel for the last two, and it feels the danger: when a rival's head is close to yours, or you're boxed in, a heartbeat comes in and the bass drives. Sound and music each have their own switch, and both are remembered.

## Bark chatter

The AI snakes talk. Each one has its own voice: Sovereign uses the royal "we", Colonist is a pompous redcoat, Mason speaks only (dubious) Latin, Ghost mostly says "…", and Copycat repeats whatever it just heard, in Chinese. Some of them talk to each other. They react to what happens to them, too: the woodpecker pecking under them, the rain putting them out, food rotting or burning before they get to it, starving, being cut by a flash, squashing their own tail's beads, losing a colony or a capital down a woodpecker's hole, a beetle they cornered digging in and getting away, and the woodpecker knocking their food to someone else. Lines pop up in speech bubbles and in a log under the board, which you can switch off. A line takes a rest before it comes round again, and a joke is told once a round.

## Watching the AIs

Press **Watch AIs** on the start screen for a round between four AI snakes, with a 1×/2×/4× speed control (or the keys 1, 2 and 4). The same control appears when you're watching after dying. Every round starts at 1×, and at 2× or 4× the board's own effects speed up too. **Watch again** on the round-over card keeps you watching; Enter or R start a round you play. Watched rounds put the AI snakes in the Hall of Fame, but don't count towards your own stats.

## The rivals

Each round, three of these eighteen are dealt from a shuffled deck, so you meet all eighteen before anyone comes round again. The start screen tells you who you're up against and how each one plays. **Pick your own:** tap a rival's seat on the start card and choose any of the eighteen, or "Any" for the deck's. A picked seat wears a small pin and stays for this visit, round after round; tap the pin to set it back to "Any", and the next time you open the game every seat is dealt again. Online, the host picks, in the lobby. Rounds against rivals you picked are marked "chosen" in the Hall of Fame. On any card (the start, a nap, your death's or the round's), click or tap a rival's name tag for its note: how it plays and what it holds now. It stays until you close it (its tag again, its ×, Esc, or a click anywhere else); while you're watching, it's a banner instead, up as long as it takes to read. Only you have a real forked tongue: every few seconds each rival flicks out something of its own instead, such as Wildcard's dollar bill, Joker's party horn or Desperado's six-shooter.

| Snake | Look | Style |
|-------|------|-------|
| **Sniper** | blood red, one eye behind a scope | Picks whichever snake it has the best shot at, gets in front of it and squeezes its space. |
| **Gobbler** | orange, puffy cheeks | Eats everything, even a rival's apple. Hates mushrooms. |
| **Ghost** | pale, fading body | Keeps its distance from everyone, and slips through the gaps. |
| **Sovereign** | royal blue, golden crown | Rules its own patch of log, marked out with borders like a map in royal blue, its banner flying at the capital, and attacks anyone who trespasses. Its realm grows as it does, shrinks if it wastes away, and drifts off land the woodpecker or fire takes. You take on its colour when you go in. |
| **Colonist** | redcoat, tricorn hat | Plants flags all over the board, each colony a patch of land with its own borders, and defends every one of them. The first flies the Union Flag, later ones colonial ensigns (blue with the Southern Cross, red with a badge). Its flags bend as a snake goes over them and spring back; a flag the woodpecker pecks out is lost, colony and all. |
| **Drab** | khaki, sleepy eyes | Plays it safe and sensible. Nothing special. |
| **Vulture** | black, pink bald head, hooked beak, scowl | Hovers near snakes in trouble and feeds on what they leave behind. |
| **Mason** | Caesar in marble, laurel wreath | Walls off the board, two thick where it can so a flash can't cut through, then keeps the biggest piece. |
| **Wildcard** | the Stars and Stripes, orange tan, golden pompadour, long red tie | A random mix of habits, new every round. |
| **Mute** | a mood-ring mime: white greasepaint, beret, a painted tear; its body turns the colour of how it feels | Picks someone and closes an invisible box around them. Never says a word (it mimes). |
| **Creeper** | teal, slit eyes | Sneaks up and rides right behind other snakes' tails. |
| **Metagamer** | cyan, 3D glasses | Watches how each rival plays, then avoids the aggressive ones, shadows the greedy ones and hunts the evasive ones. |
| **Capricious** | changes with its mood | Starts undecided, then does impressions of the other rivals, every one before any comes round again, ten seconds or so at a time: their mark on its pink head, their lines, their play. Each change of mood is a costume change, a puff with the old face popping off. |
| **Copycat** | the flag's red, cat ears, a yellow party pin; copying, its body wears a pale copy of its model's | Shadows whoever seems to be winning, right alongside them, and plays as it has watched them play. Party member. |
| **Joker** | jester hat, harlequin diamonds, red nose | Lures chasers into dead ends and swerves away at the last moment. |
| **Desperado** | rust poncho, cowboy hat, bandana | An adrenaline junkie: skims the edge, bodies and other heads for the thrill of it. |
| **Ouroboros** | a real snake: dark gold python diamonds, a wedge head, slit eyes, fangs | Chases its own tail: once it's long, it moves as a ring, and whatever's inside is in trouble. Now and then it bites its own tail. |
| **Star** | a sunflower star with a big white walrus mustache, a rainbow streaming behind it | A power addict: jumps and flashes every chance it gets, and craves anything golden that feeds the habit. When it flashes, its star's points go dim and light back up one by one as its flash comes back: count them, and box it in while they're dim. |

All of them share the same sense of danger. They plan a few moves ahead, check that they'll still have room to move (or can chase their own tail), don't let themselves be pinned against the edge or a body (or shut in a pocket) where another snake could come round and close the way out, and avoid the space around other snakes' heads. Food by the edge, in a corner or beside a hole, fire or a body isn't a trap in itself, though: a snake that has just eaten there is gone on its next move, so only a head close enough to cut it off keeps them away. On top of that, each one chases its own goal.

They're also fair. They see the other snakes as they were about a quarter of a second ago, like a human's reaction time, so they can't dodge your sudden turns any faster than you could dodge theirs. Food they see as it is, as you do, and they read the log as you can: where the woodpecker will knock food aside (its rings), a beetle running for a burrow or digging in, and every burrow there is. And they aren't told which snake is you: you're judged only by how you move, like everyone else.

## Hall of Fame and stats

Everything is saved in your browser only. If your browser won't keep anything (storage blocked, or full), the records last until you close the tab, and the Hall of Fame says so.

- **Hall of Fame:** the top 10 rounds, ranked by finishing place (a win beats any 2nd place), then by how long the snake stayed alive, then by food eaten. The AI snakes get entries too, so you're competing against them on the list. Switch to **Only you** to see your own top 10. When a round makes the top three, or beats your best, you can carve your name on the end screen. Until you do, your rounds go in as Green (the game's name for you), and carving a name puts it on all of them.
- **Your story:** rounds played, wins, average place and score, how often you finished in each place, and what killed you (including your nemesis, whatever gets you most often).
- **Field guide:** how to play in four lines (The basics: winning, steering, crashes, hunger), then every food, power and danger on the log, with its picture and its rule, and the keys for each power. It has its own button, an open book (named where the header has room), and G; **How to play** on the start screen and **Field guide** on the nap card open it, and your death's card names what got you (**Field guide: Crashes**, say), opening it at that row (so does the round's card, when your death ends the round); the book's tabs and its close stay at the top as it scrolls.

## One screen

The page is always one screen tall, so nothing scrolls, on a phone, a tablet or a desktop, whatever's going on: the header, the name tags, the board and the row under it (the speed buttons while you watch, the help, and the chatter's switch) are always on the screen, and the chatter shows as many whole lines as the rest of the screen holds, newest first (none on the smallest phones, where the rivals' lines are in their bubbles on the board). In a desktop's browser up to 1180 px tall (a 1080p or 1200p screen) the header, the tags, the help and the chatter sit in a column beside the board, 880 px. On a phone, and wherever the header is over the board, the board is never smaller than it was before the page was one screen tall: where the rest doesn't fit, the chatter (to a strip, or to the bubbles on the board) and the help line give way, not the board.

## On a phone

Held upright, the board runs edge to edge (382 px on a 390 px phone); on its side, it takes the full height. Held upright, the round's news (a banner: the weather, the woodpecker, first blood) comes in one line above the board, over the title, so it never covers the board, your name tag or the pause button; elsewhere it's at the board's top or foot, never its middle. Each banner stays up as long as it takes to read (1 s and 0.4 s a word, 4.5 s at most), and the next waits its turn; a lesson about your snake goes as soon as you're out. The screen stays awake while you play or watch. On Android (and desktops), the full screen button in the header gives the game the whole screen; on an iPhone, Add to Home Screen opens it without Safari's bars.

