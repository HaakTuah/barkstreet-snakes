## Sound

Everything you hear: how it's made, the cues and what each means, how loud each is against the others, yours against a
rival's, the music and its stages, the weather's beds, the mix, the switches, and sound on a phone, as the second sound
pass, the third pass, round four, round six A and the owner's chomps and babble settled them (their text, with what was
tried and measured, is in `docs/archive/design-sound.md`). Elsewhere: each move's own sound (its section in
`40-powers-and-moves.md`), a crash's, fire's and a squashed bead's (`41-crashes.md`), the woodpecker's ("Its sounds" in
`38-the-woodpecker.md`), the beetles' dig, scrabble and crumble ("The sound" under the dig, and under burrows growing
shut, in `04-food-and-the-world.md`), the last apples' falling notes ("Food on the log", there), the round's moments
the music follows (`12-the-rounds-arc.md`), and why turning makes no sound (`34-skipped-or-adapted-guidelines.md`).

### How it's made

- **Synthesised live** with the Web Audio API (`audio/`: `cues.js` every cue, `music.js` the track, `weather.js` the
  weather's beds, `sound.js` the synthesiser that makes them and `window.SnakeAudio`). There are no audio files, so it
  works offline with nothing to download. Every cue is built from a few soft, woody ingredients: a marimba-like mallet
  note, a wood-block knock and a pinch of filtered noise.
- **One AudioContext,** made at load and asleep until the first key or tap (browsers require a gesture; on iOS one
  silent sample plays inside it, to open the speakers). Nothing plays before one. A cue asked for while the context
  wakes (the key that woke it, a tap just after unmuting) plays once its clock runs, within `RESUME_GRACE` (500 ms).
- **It sleeps while the sound's muted or the tab is hidden** (no hiss from a background tab, and a phone saves its
  battery), fading out first so nothing is cut with a click, and wakes when both are over.
- **Every envelope starts from silence,** so no cue clicks.

### The cues

Short and round, each saying one thing:
- **Food:** a marimba pluck for an apple, in tune with the music (C major pentatonic from E5) and never quite the same
  twice (struck a little harder or softer, brighter or rounder); a rising sparkle up the same scale for a golden apple,
  with gold's own bells; a papery flutter and gold's bells for a golden leaf; a low, round "nom" for a bead (`meat`); a
  dry double crunch and a pluck for a beetle (`crunch`); a wobbling "boing" for a mushroom. Anything golden gets gold's
  sparkle over its cue.
- **A streak sings:** your meals in quick succession (each within 2.6 s of the last) climb a step each, up to seven: an
  apple's pluck up the pentatonic scale, a golden apple's and a golden leaf's up to three steps, a bead's nom up to
  four. A mushroom neither climbs nor breaks it, and a squashed bead of your own starts it again. Only yours climb.
- **Deaths:** taking a rival out lands a knockout punch (`ko`: a low thump, a crack, two bright notes); any other
  rival's death is a far-off thud (`rivalDeath`); yours lands with a soft wooden impact before a two-note sigh
  (`death`).
- **Tension:** a near miss (your head next to a rival's, diagonals too) is air tearing past (`close`); first blood gets
  a dark minor stab (`stinger`); the countdown's last beat, the woodpecker's arrival and the last two get a riser
  (`riser`), the countdown's topping out on Go, and Go cuts it short.
- **The round:** wood-block countdown beats (`beat`) and a "go" (`go`); a fanfare for a new best (`best`), a bouncier
  phrase for a win (`win`), and a win that's also a best one phrase (`winBest`), not two.
- **Hunger:** a soft low growl as you get hungry (`hungerWarn`), a tummy gurgle when you start starving (`hungry`).
- **Borders sound like borders:** when your head crosses into a rival's land (Sovereign's realm or one of Colonist's
  colonies), a muffled drum knocks twice and a fife answers with a short call (`field`), panned to where you are. It
  plays once per crossing, at most every 0.8 s.
- **The weather:** lightning on its way crackles (`crackle`), its strike is a crack and thunder rolling away
  (`thunder`), a gust is three puffs of air (`gust`), rain starting a patter of drops (`rain`), winter's arrival glassy
  bells (`snow`), a rainbow a shimmer up a major arpeggio (`rainbow`), a burning leaf blown off a whoosh and a crackle
  (`ember`), a fire put out a hiss of steam (`douse`); food done in the fire sizzles (`bake`) and ash puffs (`ash`).
- **Buttons and toggles:** a barely-there wood tap (`ui`).

### Round six A's cues

The beetles' and the woodpecker's own cues are in their topic files: the dig, the scrabble and the crumble in
`04-food-and-the-world.md`, the knock in `38-the-woodpecker.md` ("Its sounds"). The rules round six A set for them hold
for every world cue:
- **A burst is one sound:** the dig's gap (300 ms) and the knock's (400 ms) are under the soonest each can come again,
  so beetles digging in together, or the pieces one strike knocks aside, are one sound (`tools/chatter/05-sound.js`
  checks it).
- **Whose it is:** a dig is heard as yours when your head is the nearest, else as a rival's, about 6 dB down and dulled.
- **An edge carries:** the few high grains a cue gives as its edge (the dig's legs' scratches) go round a rival's
  dulling, as soft as the rest of it, so a rival's dig is heard over the sudden-death music too. A burrow closing over
  is louder than a beetle's scrabble, with flecks of sawdust above 2 kHz, where the music leaves room.

### The woodpecker's drum is its blows

The game starts the drum from the aim's progress, on the drawing's clock, so each knock is a blow you see and its last
knock lands on the strike, with the crash; watched faster, it plays faster, and started late, it leaves out the knocks
already past. One table, `SnakeAudio.drumBlows`, gives the knocks you hear and the blows you see (their count and
spacing: "It pecks for real" in `38-the-woodpecker.md`). Settling back on its perch after a strike, the bird says one
softer "kik!" (its three-kik call stays for its arrival).

### Yours, a rival's and the world's

- **From where it happens:** every cue of something on the board is panned from its x (`at` in `game/round.js`: up to
  0.8 of the way left or right).
- **A rival's is dulled:** `RIVAL_VOLUME` (0.5, about 6 dB down) through a lowpass at `RIVAL_LOWPASS` (2600 Hz), as if
  further off.
- **Yours come first:** your own sounds come before rivals', and both come before the world's (weather, the woodpecker,
  beetles): at most `MAX_VOICES` sound at once, 7 counting yours, 6 a rival's and 5 the world's, so each gives way
  sooner than the one before. A death, a best, a win, a knockout and first blood (`PRIORITY`) always play.
- **No machine-gunning:** each cue has a shortest gap between plays (`MIN_INTERVAL`), kept apart for yours: a rival's
  waits on yours and on other rivals', and yours waits only on your own, so a rival's flash or jump, golden or plain,
  never silences yours. A golden flash's gap (50 ms) is under a tick and a jump's (120 ms) under two, so your own
  golden ones in a row are each heard (round four's critique; `tools/chatter/05-sound.js` plays the sound to check).
- **The mix:** everything goes through one gentle compressor (threshold −20 dB, ratio 4), so four snakes eating at once
  can't clip; the music runs at `MUSIC_VOLUME` (0.55) of the cues, and steps back to 0.3 under a fanfare (`DUCKS`: a
  win 1.2 s, a best 0.8 s, both 1.6 s).

### Rivals' chomps

The owner, 29 October 2026 (2d). Every snake's meal is heard, not only yours: a rival's plays the same cue as yours for
that food (apple, golden apple, bead, mushroom, beetle, golden leaf), dulled like any rival's cue and softer still
(`RIVAL_CHOMP` 0.6 of a rival's leap or dash, so 0.3 of your own chomp, about 10 dB down), panned to where it ate, never
climbing the streak's scale (that stays yours). Never a pile-up: one rival's chomp at a time, at least `CHOMP_GAP` (180
ms, two of the fastest ticks) apart whoever ate, and none for `CHOMP_YIELD` (350 ms, about as long as your longest chomp
rings) after yours; the round asks for yours first in a tick, so four snakes eating together are your chomp alone. Yours
never waits on theirs. A golden mushroom keeps its rival wrap (its own 1.5 s gap, at a rival's usual level).

### Rivals' babble

The owner, 29 October 2026 (2j): "And should the chat lines be voiced?", then "make sure the voices arent distracting!
That would be a real turn off!". When a rival's bubble appears, a short burble in its own voice, babble and not speech,
synthesised like everything else (`babble` in `audio/cues.js`; each voice a row of `BABBLERS`): a few syllables, each a
buzz through a vowel-shaped band, stepping about in pitch and dropping at the end as a sentence does, more of them for a
longer line. Mason is clipped and deep, Gobbler gobbles (a fast wobble), Ghost is faint and airy, Sniper terse,
Sovereign stately, Creeper a whisper, Wildcard all over the place, Desperado a drawl, Joker giggly, Star bright, and so
on; Mute stays silent.
- **Never distracting, first of all:** a rival's sound (dulled, panned to its head), and `BABBLE_LEVEL` 0.6 of a rival's
  other sounds, so its loudest is under a seventh of your apple's pluck (about 17 dB down), and half that again at the
  tensest (`BABBLE_HUSH`, from the danger the music hears: your head near a rival's or boxed in); at most `BABBLE_MAX`
  0.5 s whatever the line's length; one at a time and at most one every 4 s whoever speaks (most bubbles stay silent:
  the chatter allows one every 1.2 s); none starts within `BABBLE_YIELD` 0.7 s of any sound of your own (eating,
  warnings, your crash, a button) or the world's loudest (the woodpecker's drum, knock and crash, thunder), and one
  sounding is cut short by them (`HUSHED_BY`).
- **Rivals only:** your own snake's lines and a friend's online have no voice.
- **Its own switch,** Voices (V), in the row under the board beside the chatter's (a speaker, On or Off; the header's
  row of sound buttons is full at 320 px), remembered as `barkbite-voices`, on unless switched off; muted (M), silent;
  the music's switch (N) leaves it be.

### The music

Written note by note on the audio clock (`audio/music.js`): the game calls `SnakeAudio.music(stage, mood)` every frame,
which schedules the next quarter second (`LOOKAHEAD`) of sixteenth notes and switches arrangement at bar lines, so
changes land on the beat. The one exception: a round's music starts on Go, the title loop bowing out at once. Fallen
behind (a stall, a sleeping tab), it skips whole sixteenths, so the groove stays on its grid. The stages follow the
round (`musicStage` in `game/core.js`; the round's arc in `12-the-rounds-arc.md`):

| Stage | When | Arrangement |
|---|---|---|
| `title` | Start card, countdown, round over | A calm marimba loop at 84 bpm over a long low note and a soft pad; every other time round the line falls and a high note answers it |
| `early` | The round's opening | 94 bpm: the loop in eighths plus a soft bass, and the pad |
| `mid` | From `MUSIC_MID_MS` (0:45) | 102 bpm: a shaker joins, and high bells answer the tune |
| `sudden` | Sudden death (2:00) | 108 bpm, a minor key: wood-block knocks and low toms rolling round the bar |
| `duel` | The last two snakes | 124 bpm, minor and tense: a heartbeat kick and closed hats on every sixteenth, no pad |

- **It speeds up with the game:** in `early` and `mid` the tempo creeps up to 15% faster as the ticks speed up.
- **The pad,** a soft, slightly detuned chord held each bar, is under every arrangement but the duel's.
- **The music feels the danger:** each tick the game measures how close a rival's head is to yours and how much room
  is ahead (`dangerOf` in `game/round.js`); past a quarter, a heartbeat (lub-dub on the beat, each with a muffled thump
  a phone can play) comes in, the bass drives on the off-beats, and past six tenths a dissonant minor second creeps
  into the tune. Only in a round: no heartbeat outlives it.
- **Watching,** quieter (0.7) and only the tune: no percussion, no danger. **Napping,** ducked to about a third (0.35).
- **Nobody at the keys:** on the title loop, after a minute with no key or tap it fades away, and stops writing notes
  15 s later; any key or tap brings it back.

### The weather has its own sound

Looping beds of filtered noise on the music bus (`audio/weather.js`): rain hisses, with drops landing around you; wind
swells and falls; a storm rumbles under a little rain; winter is a high, airy hush. A new one fades in as the old fades
out. The beds belong to the round: they stop when it does, and while you nap. Being on the music's bus, the music's
switch silences them too.

### Every sound survives a phone speaker

A cue's weight can't live only below 150 Hz, so the low cues (death, bonks, thunder, boom, the stinger, the heartbeat)
get a midrange knock or body that implies their bass (`body` in `audio/sound.js`: the note's upper harmonics through a
band). The feel targets "No clicks" and "Small speakers" (`11-the-third-pass-what-it-settles.md`) check it: every cue
rendered offline starts from silence, and through a 300 Hz high-pass your death still lands louder than an apple.

### The switches

- **Sound (M),** a button in the header: mutes everything, music and voices too, and the context sleeps; muting is
  silent, unmuting taps once. Remembered as `barkbite-muted`.
- **Music (N),** beside it: the track and the weather's beds; the cues play on. Remembered as `barkbite-music`.
- **Voices (V):** the rivals' babble only (above). Remembered as `barkbite-voices`.

### How a cue is measured

Rendered offline (an `OfflineAudioContext`) as the game plays it, through the whole chain, at its loudest 50 ms, after a
silent lead-in and with the game's own options (the knock at half volume, a rival's flagged): a cue that starts at the
render's very start comes out quieter than the same cue 0.2 s later, by up to 10 dB for a sharp attack. How the cues
pile up while watching is measured in headless Chrome by `docs/archive/studies/sound-levels.js`. The gaps, the yields,
the rivals' dulling and the babble are checked by `tools/chatter/05-sound.js` and `tools/chatter/06-babble.js`.

### Online

Sound is each player's own: every machine plays it from the events and bubbles it already gets (every snake's eat, a
rival's bubble, the woodpecker's synced aim for its drum), so no sound needs a message of its own.
