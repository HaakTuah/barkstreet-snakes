## Capricious, Copycat and Wildcard

Proposed by Claude on 26 October 2026, at Haakon's request; Haakon on Capricious: it should "be able to emulate far
more, if not all". Three rivals change who they are: Capricious by the moment, Copycat by whoever leads, Wildcard by
the round. Today they blur. Capricious has four impressions (Sniper, Gobbler, Ghost, Mason), so the same faces keep
coming back. Copycat copies only the leader's steering. Wildcard's habits are drawn evenly from wide ranges, so most
rounds they average out into a muddled Drab. Each should be a clear character with a tell.

**Capricious: every rival, by turns.**
- It does impressions of every other rival, dealt from a shuffled deck so it shows each once before any comes back.
  Each lasts 8–15 s as now, with its moment of dithering in between. Its own undecided self (Drab's habits) is the
  dithering, not a card in the deck.
- A rival whose style needs long memory gets the short form of it for the mood's length: Sovereign claims a small
  home and guards it, Colonist lays a small claim, Metagamer counters whoever it watched during the mood, Ouroboros
  coils, Copycat shadows the leader, Wildcard draws a mix for the mood, Star spends its powers the moment it can.
- **The tell:** for each mood its head wears the rival's signature mark as a costume over its own colours (Sovereign's
  crown, Star's mustache, Copycat's ears, Wildcard's pompadour, and so on), and it opens the mood with one of that
  rival's lines, marked as an impression (*does its best Sovereign*: "..."). Field guide: "Capricious does
  impressions of the others."
- **Measured:** while a mood lasts, the rival's trademark shows at a rate near the rival's own; Capricious stays in
  the win band.

**Copycat: copies the winner's play, not just its steering.**
- While a rival leads, Copycat takes that rival's habits (its weights and its driver: how it hunts, eats and keeps
  safe), as Capricious takes a mood, and keeps shadowing it a few cells away in a pale copy of its colours.
- While a snake without a persona leads (you, or a friend online), it plays as that snake has played: it reads the
  leader's behaviour the way Metagamer does (aggressive, greedy or evasive) and takes the habits that match. A person
  is copied by what they do, never for being a person ("The rivals never treat a person differently").
- It changes model only when another snake leads by 3 or more, as now.

**Wildcard: a few strong traits each round, and you can see them.**
- Each round it draws two or three traits from a list (hungry, reckless, hunter, coward, wall-hugger, territorial,
  tail-rider, show-off), each pushed to an extreme, with everything else plain, instead of an even draw of every habit.
- Its name tag's note says the round's mix ("This round: hungry, reckless, hunts"), and its first line of the round
  brags about it. Still a wildcard: you know what it is this round, never what it will be next.

All three keep the rules that stand: no `isPlayer`, every trademark measured before and after, every new look a cue
with its Field guide line, and online in step (the mood, the copied model and the round's mix travel with the snakes,
with a protocol bump).

**Built (3b), Capricious (PR #126).** As above, with these readings:
- The deck is the 16 others (not Drab, which is its dithering, nor itself), shuffled; the top of a fresh deck is never
  the mood just over. A round's moods rarely get through all 16, so a round shows each rival at most once.
- Short forms (`MOOD_FORMS` in `ai.js`): Sovereign's home starts at radius 3 and grows to 4 at most; Colonist plants
  one flag of radius 3 where the mood starts and no more (a pecked one is replanted); Ouroboros coils from 7 long, not
  10. Each mood starts with its driver's memory empty (`MOOD_MEMORY`), so Metagamer watches afresh, Wildcard draws
  afresh, and a realm or a flag goes when its mood does. The rest play as themselves.
- The costume (`coatOf` in `render/looks.js`): its body keeps Capricious's own pink ramp and markings; its head is the
  mood's face (hat, crown, glasses, beak...) on its pink head, inside its pink ring. Doing Star, it keeps a round head
  and wears Star's mustache (no star-shaped head). Faces that are only eyes (Ghost, Creeper) or cheeks (Gobbler) are
  weak tells, so its name tag's note also says who it is doing ("Doing its best Ghost now.").
- The impression: one of the rival's own `start` lines, `*does its best Sovereign*: “Kneel.”` (a mime's, all stage
  direction). The four hand-written mood lines it had are gone. Copycat echoes it in Chinese.
- Measured: the simulation's `--signatures` counts each mood's ticks again under the mood's name, and prints each
  impression's trademark beside the rival's own.
