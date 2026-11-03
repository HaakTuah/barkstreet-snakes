## Powers: everyone leaps, and golden things do more

The powers' rules (the leap, the golden leap, the dash, the wrap, pressing during a stun, holding more than one,
and how the rivals use them) are in `40-powers-and-moves.md`, and this file's text about them as it was in `docs/archive/design-powers.md`; how a rival
weighs a power now is "Rivals use their powers, when it pays" in `39-the-rivals.md`.

**Sudden death closes in.** With everyone leaping out of boxes, rounds ran long (median 194 s, 97% reaching the woodpecker) and ended in slow starving: a long snake takes a minute or more to starve once nothing grows. Making hunger bite harder in sudden death shortened them, but turned the end into a starving contest (half of all deaths); so instead **the woodpecker gets hungrier**: each rest is `PECK_HUNGRIER` (0.85) of the one before (down to `PECK_REST_MIN`, 12 ticks), and each patch a cell bigger than the last (up to `PECK_CHUNK_MAX`, 14; 16 since round four, from 9). The log shrinks faster and faster, so the end comes from the board closing in, not from waiting. **Ghost changed with it:** built to stay small (it ate mushrooms on purpose past 18), it starved first in every long endgame and won 5–7%; now it keeps its distance from everyone and slips through the gaps, with a normal appetite (it eats until 18 long, and keeps nibbling after). Its blurb says so.

**600 seeded rounds, powers and all** (against the AI of the first PR, same seeds): median round 164 s (middle half 151–179, from 137–194); deaths: boxed in 66%, the woodpecker 15% (from 4%), starving 13% (from 24%), too small 6%; win rates 15–36% (another seed: 18–37), Ghost 29%; 11.6 crashes survived a round; the AI's step 1.06× the cost (mean; p99 1.6×, on longer snakes).

**Look and sound**, **Online** and **Reviewed**: each move's cue and sound, and what crosses online, are in
`40-powers-and-moves.md`; how a held power looks is in `03-the-snake-as-a-character.md` ("Telling powers apart"); and their
text as it was, with the review panel's findings, in `docs/archive/design-powers.md`.

