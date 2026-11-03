## Capricious, Copycat and Wildcard

Three rivals change who they are: Capricious by the moment, Copycat by whoever leads, Wildcard by the round. Each is a
clear character with a tell. Capricious (PR #126) and Copycat (PR #142) are built as below; Wildcard's strong traits
are still to build (entry 3b in `docs/PROGRESS.md`). Their text as proposed and built, with what was measured, is in
`docs/archive/design-rivals.md`. Elsewhere: their looks and a costume change (`03-the-snake-as-a-character.md`, "The
rivals' looks", "Copycat in the flag's red", "Copycat's face", "Wildcard's hair" and "A costume change"); the rest of
the cast (`39-the-rivals.md`).

### Capricious: every rival, by turns

- **The deck** (`MOODS` in `ai/moods.js`): it does impressions of every other rival, the 16 others (not Drab, whose
  habits are its undecided self, nor itself), dealt from a shuffled deck so it shows each once before any comes back;
  the top of a fresh deck is never the mood just over. A round's moods rarely get through all 16, so a round shows each
  rival at most once.
- **The moods:** it starts each round undecided for 3.5 to 5.5 s; then each mood lasts 8–15 s, with 1.2 to 2 s of
  dithering in between, undecided again. Undecided, it plays Drab's habits.
- **Short forms** (`MOOD_FORMS`): a rival whose style needs long memory gets the short form of it for the mood's
  length. Sovereign claims a small home and guards it (from radius 4, growing to 5 at most, where its own grows to 7);
  Colonist plants one flag of radius 3 where the mood starts and no more (a pecked one is replanted); Ouroboros coils
  from 7 long, not 10. Each mood starts with its driver's memory empty (`MOOD_MEMORY`), so Metagamer counters whoever
  it watched during the mood, Copycat shadows the leader, Wildcard draws a mix for the mood, and a realm or a flag goes
  when its mood does. The rest play as themselves (Star spends its powers the moment it can).
- **The tell:** for each mood its head wears the rival's face as a costume on its own pink head (`coatOf` in
  `render/looks.js`: Sovereign's crown, Star's mustache, Copycat's ears, Wildcard's pompadour, and so on); doing Star,
  it keeps a round head and wears Star's mustache. Faces that are only eyes (Ghost, Creeper) or cheeks (Gobbler) are
  weak tells, so its name tag's note also says who it is doing ("Doing its best Ghost now.").
- **The impression:** it opens each mood with one of the rival's own `start` lines, marked as an impression
  (`chatter/impressions.js`): `*does its best Sovereign*: “Kneel.”` (a mime's, all stage direction). Copycat echoes it
  in Chinese. Field guide row: "Capricious".
- **Measured by:** while a mood lasts, the rival's trademark shows at a rate near the rival's own, and Capricious stays
  in the band. The simulation's `--signatures` counts each mood's ticks again under the mood's name, and prints each
  impression's trademark beside the rival's own.

### Copycat: copies the winner's play, not just its steering

- **Its model** is whoever leads (the longest snake). It changes model only when another snake leads by 3 or more.
- **It reads every leader by behaviour alone,** rival or person: the AI's view carries no persona, and must not ("The
  rivals never treat a person differently"). Over the ticks it has watched (as it saw them, its reaction time late),
  each snake's eight traits: moves per turn, coiling, riding tails, distance from heads, heads near, growth, jumps and
  flashes, and how far it strays (`watchStyles`, `traitsOf` in `ai/moods.js`). The style is the nearest of twelve
  rivals' own (`styleOf`, `STYLES`, measured by `tools/dev/copycat-styles.js`), after 60 ticks watched (`STYLE_MIN`).
  So a person is copied as Mason if they run long and straight, as Gobbler if they eat a lot and go near heads, and so
  on.
- **Not styles:** Capricious, Copycat and Wildcard (mixes of others); Mute and Metagamer, which play like Sniper and
  Drab from outside; Colonist, whose mark is its flags.
- **It takes the style's habits:** its weights (the short forms of `MOOD_FORMS`, as Capricious's) and its driver, with
  its pull to move the way its model moves cut from 120 to 40 (`COPY_MIMIC`) so the habits show. A new read of its
  model holds 40 ticks (`STYLE_HOLD`) before Copycat changes style (its first, it takes at once), so a realm or a victim
  doesn't come and go with a moment's change of pace. A new model, or a new read of it, starts the copy's memory afresh
  (`COPY_MEMORY`).
- **It shadows its model** a few cells away (its lure), unless its copy has a lure or a victim of its own: copying
  Joker or Vulture it lures whoever they would, and copying Sniper its model may be its prey. Copying Sovereign it
  plants a small home where it is, and its pull toward its model works against it. As the rival it copies would.
- **The cue:** its pale copy of the model's colours ("Copycat in the flag's red" in `03-the-snake-as-a-character.md`);
  its note says "Copying Mason, playing as Mason does." (or "Copying you, playing as Gobbler does."). Field guide row:
  "Copycat".

### Wildcard: a few strong traits each round, and you can see them

To build (entry 3b's Wildcard part, in `docs/PROGRESS.md`). Today it draws every habit evenly from wide ranges once a
round (`randomWeights` in `ai/rivals/wildcard.js`), so most rounds they average out into a muddled Drab.
- Each round it draws two or three traits from a list (hungry, reckless, hunter, coward, wall-hugger, territorial,
  tail-rider, show-off), each pushed to an extreme, with everything else plain, instead of an even draw of every habit.
- Its name tag's note says the round's mix ("This round: hungry, reckless, hunts"), and its first line of the round
  brags about it. Still a wildcard: you know what it is this round, never what it will be next.

### The rules that stand, for all three

No `isPlayer`; every trademark measured before and after; every new look a cue with its Field guide line; and online
in step (the mood, the copied model and the round's mix travel with the snakes, with a protocol bump).
