## Looks and lines

- **Friends get their own arrow**: its rule is in `22-play-with-friends-online.md` ("On a friend's screen"), and its
  text as it was in `docs/archive/design-online.md`.
- **A crash you don't survive goes off with a bang.** A comic starburst (flat, inked, a cached sprite) and a thick shockwave ring in the snake's colour with an ink edge at its head, a spray of pieces from the head and along the body, and a little smoke; your kill shakes the board a touch. (Before, a snake just burst into its beads, which read the same as a crash you survive.) With reduced motion it's a still starburst and ring, fading.
- **Mute is a mood ring, not a rainbow** and **Holding a power shows**: their rules are in
  `03-the-snake-as-a-character.md` under "Mute is a mood ring, not a rainbow" and "A power is one token, not a
  ring", and their text as it was in `docs/archive/design-looks.md`.
- **Fields that overlap**: its rules are in `44-realms-and-colonies.md` under the same name, and its text as it was
  in `docs/archive/design-realms.md`.
- **Land lines.** Sovereign and Colonist mind their land: fire in it ("Our realm is ablaze! Fetch the royal bucket!", "I say, the colony's on fire!", at most every 12 s), the woodpecker pecking it ("That bird is pecking holes in OUR land!"), food rotting on it (round four: "Something is rotten in our realm.", "I say, something's gone off in the colony.", at most every 30 s), and, for Sovereign, a colony planted in its realm ("A colony? On OUR land, Colonist?!"). All with their Chinese for Copycat. Land is one rule everywhere since round four (the AI, the chatter, the HUD and the borders): a cell whose centre is within the field's radius plus `LAND_REACH` (0.5) of its centre.

