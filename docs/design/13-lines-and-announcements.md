## Lines and announcements: the rivals' chatter

What the rivals say and when: the log and the bubbles, the moments, the gaps and rests, who speaks, last words, the
Chinese for Copycat, each rival's voice, the land's lines and the border banner, as a pass over the lines, round four,
looks and lines and round five settled them (their text, with what was measured, is in
`docs/archive/design-chatter.md`). This file was round three's "Lines and announcements" and already held the rivals'
lines and the border banner, so it became the chatter's topic under its own name, widened; `09-voice-and-copy.md`
stays the voice and copy of the page's strings. Each rival's lines, by moment, are in its file in `chatter/voices/`,
never copied here. Elsewhere: the tone, Mason's Latin and its *Life of Brian* answers, kill and win lines, and last
words naming their cause (`09-voice-and-copy.md`); the lines' make-over (the writing pass, queue entry 9); the
woodpecker's lines ("Its voice" in `38-the-woodpecker.md`); Capricious's impressions and moods
(`35-capricious-copycat-and-wildcard.md`); a name's colour in the log ("Copycat in the flag's red" in
`03-the-snake-as-a-character.md`); where the log sits and how much of it shows ("Desktop chatter" in
`33-one-screen.md`, and `31-phones.md` with "Last words on phones"); a bubble's tail ("The page's own work" in
`45-performance.md`); why there are bubbles at all ("Speech bubbles" in `34-skipped-or-adapted-guidelines.md`);
online ("Chatter is the host's" in `22-play-with-friends-online.md`); and the babble a bubble makes (`21-sound.md`).

### The log and the bubbles

`chatter/talk.js`. The chatter is only words: it never changes how anyone plays.
- **The log** keeps the round's last 50 lines (`LOG_SIZE`), each after the speaker's name in its colour, and is what
  a screen reader hears (the bubbles are hidden from it). It empties when a round starts.
- **A bubble** follows the speaker's gliding head for 2.6 s (`BUBBLE_MS`, real time, so it goes on time when the round
  is over or napping), one a snake: above the head for a snake going sideways (below it near the top), beside it for
  one going up or down, moving to another side only once that side has been right for 0.45 s, and gliding there. It
  keeps off the banner and older bubbles, and fades near your own head.
- **On a small board** a line over 32 characters (`COMPACT_CHARS`) goes to the log alone while the log is on screen; a
  reply always gets its bubble (it's the joke).
- **Last words** of a snake that's out show in a bubble where it went out, for 2 s (`LAST_WORDS_MS`), only where the
  log can't show them.
- **The switch** (the speech bubble under the board) turns the chatter off and clears the bubbles; it's kept as
  `snake-chatter` (`on` or `off`).

### Who speaks, and when

`chatter/moments.js` (`update`, once a tick) turns each moment of a round into a line from one rival's list for it
(`chatSay`), picked at random; a line naming someone (`{who}`, you by your Hall of Fame name) only when there is someone
to name, and last words name their killer when they can ("Et tu, {who}?").
- **Gaps:** a snake speaks at most every 4.5 s of game time (`SNAKE_GAP`), and any two lines are 1.2 s apart
  (`ANY_GAP`). Most moments are urgent and skip the second gap; small talk and the common ones (a plain apple, a bump,
  a plain jump, rot) wait for it.
- **News clears a snake's own gap:** its death (its last words), the woodpecker's coming, and an answer to Mason; a
  colony lost, a capital moved and Star's own moments ("Star's voice", below) too, unless its last line was this
  tick's (one line at a time).
- **No repeats:** a snake never says the same line within 45 s (`LINE_REST`); a punchline is told once a round, and
  Mason's two set pieces once a visit (`SET_PIECES`). With nothing fresh to say, it stays quiet.
- **Rests,** for moments a long round brings again and again, each snake's own: the woodpecker pecking under it 12 s
  (`UNDER_REST`), a plain flash 30 s (`FLASH_REST`), food rotting by its head 40 s (`ROT_REST`), starving soon 30 s
  (`DESPERATE_REST`), squashing its own bead 20 s (`CHOKE_REST`), a beetle that dug in 30 s (`DUG_REST`), food the
  woodpecker knocked aside 40 s (`KNOCKED_REST`), calling out an intruder 25 s (`INTRUDER_REST`), and its land on fire
  12 s and its land's rot 30 s (`LAND_ROT_REST`: "Land lines", below).
- **Now and then:** one or two snakes speak up in the round's first seconds (`start`); after 3.5 s of quiet, small
  talk (`idle`) has a 4% chance a tick; a plain apple gets a line 15% of the time, a plain jump 30% (a golden one
  always); whoever bumps says ouch (at the edge, its `edge` line) and whoever it bounced off gloats half the time;
  Vulture remarks on a death 60% of the time.
- **Answers:** Mason's *Life of Brian* lines get theirs a moment later (`REPLIES`: Mason, Ghost and Creeper aren't the
  giggling kind, `GIGGLE_PROOF`), and Star's showing off now and then ("Star's voice", below).

### The Chinese for Copycat

Every line has its Chinese, keyed by the English, in the same voice's file (the answers' in `chatter/talk.js`).
Copycat repeats exactly what it just heard, in Chinese, about a third of the time (35%, once the line is half a second
old and its own gap allows). `tools/chatter-test.js` checks that no line's Chinese is missing, that a `{who}` line
names someone the same way in both, and plays the chatter through staged moments for every voice.

### Each rival's voice

One file a rival in `chatter/voices/` (`addVoice` in `chatter/voices.js`): its lines by moment, their Chinese and its
punchlines. A moment a voice has no lines for passes it by. Each speaks as itself, the way it plays: Mason only in
phony Latin, Sovereign in the royal we, Mute only in stage directions, Copycat in Chinese, and Ouroboros in cycles:
its lines come back round ("All things return.", "Round and round.", "…and begin again."). A Capricious in a mood
plays the part, with the mood's own lines where it has some.

### A pass over the lines

- **Every rival reacts to the woodpecker** in its own voice ("Its voice" in `38-the-woodpecker.md`).
- **Most react to a rainbow** (Colonist: "A rainbow! Plant a flag at the end of it!"; Mute *hugs the rainbow*); Star
  first, if it can ("Star's voice", below).
- Colonist hoists its ensigns ("Run up the ensign!") as it plants a flag, and Sovereign remarks on its realm growing,
  shrinking or moving (`realm` in `chatter/voices/sovereign.js`).
- **The narrator's** rainbow and golden-apple banners follow the log: the gold is at the rainbow's foot, and apples
  drop onto the log (`FLAVOR` in `game/core.js`).
- **The border banner:** the first time in a round you cross into a rival's land, a banner says whose it is ("You’re
  in Sovereign’s realm now. It noticed."; a colony: "That’s one of Colonist’s colonies. It’s seen you."; `FLAVOR.field`,
  shown from `game/round.js`).

### Round four's lines

Every rival has lines for:
- the woodpecker pecking under it (`under`: "Its voice" in `38-the-woodpecker.md`);
- being put out by rain or snow (`doused`; Sovereign: "We are put out. In every sense."), worked out by the chatter:
  a burning rival going out while it rains or snows;
- food it was nearest to burning to ash (`ash`) or rotting (`rot`, 70% of the time): the snake whose head was nearest,
  within 5 cells (`NEAR_FOOD`), if it's a rival;
- starting to take its chances when starving (`desperate`, once a spell; Sovereign: "Forget the realm. Food, at
  once!");
- being cut by a golden dash (`cut`; some name the snake that dashed), and the dasher its `snip`.

Some also have lines for a plain flash that beats someone to food (within 3 cells) or shoots past their head
(`flash.first`, `flash.past`, 40% of the time), and for the last apples (`last`). A golden dash that cuts someone gets
the dasher's snip line (a tail off) or its kill line (in two), and its `dash` line only when those can't be said.

### Land lines

Sovereign and Colonist mind their land (`realm` and `colony` in their voices): fire in it ("Our realm is ablaze!
Someone do something regal!", "The colony’s on fire! Nobody panic. Visibly.", at most every 12 s), the woodpecker
pecking it ("That bird is pecking holes in OUR land!"; a peck on a colony's flag or the capital has its own news
instead: the colony lost, the capital moved), food rotting on it ("Something is rotten in our realm.", "Something’s off
in the colony. Not the tea, I hope.", at most every 30 s, `LAND_ROT_REST`, in place of their plain rot line), and, for
Sovereign, a colony planted in its realm ("A colony? On OUR land, {who}?!"). Land is the one rule the AI, the HUD and
the borders use ("Land is one rule everywhere" in `44-realms-and-colonies.md`; `chatOnLand`).

### Star's voice

A jolly old-timer who can't stop showing off, and is never mean ("Whee! Still got it!", "In my day we dashed uphill
both ways!"). It has a line for every moment anyone has (but the ones that are one voice's own) and four of its own
(`chatter/voices/star.js`):
- **Showing off** (`zoom`): any plain flash of its own (one that beats someone to food or shoots past a head keeps its
  `flash.first` and `flash.past` lines); its jumps too, half the time (`SHOW_OFF_CHANCE`), and all of them together at
  most every 10 s (`SHOW_OFF_REST`). Its golden dashes and golden jumps it always cheers when it can talk. `ready`, its
  flash back ("Back in business!"), comes only once the flash has been back a second (`READY_AFTER`).
- **Grumbling** (`resting`): while its flash rests, half its small talk ("Rest, rest, rest. I’ll rest when I’m old!").
- **Its stash** (`stash`): a golden beetle it eats ("Golden! Straight in the tank."); a golden leaf gets a golden dash
  line as it eats it, since it spends the leaf's dashes there and then. A golden mushroom gets its `wrap` lines and a
  golden apple its `golden` one, its own for both; a plain apple it mentions a third as often as anyone (5%, against
  15%).
- **Its own moments** (golden power food, a rainbow, its kill, being cut) are never crowded out by its showing off: it
  says them every time it can talk.
- **A rainbow is family** ("Family!", "Oh, look at you! You’ve grown!"): Star speaks first if it's alive and free to
  talk, and otherwise someone else does.
- **Answers:** a quarter of its show-offs (`ANSWER_CHANCE`), at most every 40 s (`ANSWER_REST`), 1.1 s later
  (`ANSWER_AFTER`), Wildcard brags back ("Fast? I invented fast, {who}.") or Mason answers in Latin ("Festina lente,
  {who}!").
- Its kill and win lines ("Make a wish.", "Not bad for an old-timer.": `ai/rivals/star.js`) never repeat its chatter.
  It joins the gigglers at Mason's *Biggus Dickus* ("Heh heh! Oh, my.") and guffaws at what follows ("Har har! Oh, my
  mustache!").
