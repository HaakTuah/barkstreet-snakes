## The third pass: what it settles

**Gold means power**, **A power is one token, not a ring** and **Height is scale**: their rules are in
`03-the-snake-as-a-character.md` under "Gold means power", "A power is one token, not a ring" and "Bridges and
jumps you can see", and their text as it was in `docs/archive/design-looks.md`.

**Reduced motion removes movement, never information.** Being in the air is a rule, so a leap keeps a still airborne pose. The woodpecker cuts between perches instead of swooping. Rain holds still rather than vanishing (it puts fire out), a burning leaf appears where it lands instead of flying, and a death is a still starburst that fades.

**The narrator speaks less, and better**: its rules (the banner's levels, repeats, and the lessons' waiting and
words) are in `30-teaching-by-showing.md` under the same name and "Lessons", and its text as it was in
`docs/archive/design-teaching.md`.

**One word for each thing.** The leap was *ahead*: "Press ahead to leap", "Swipe ahead to leap". Since round four the two powers are a *jump* and a *flash*, each with its own press: "Space jumps", "E or Shift flashes", "Tap to jump", "Swipe ahead to flash" (a golden beetle's are *golden jumps* and a golden leaf's *golden flashes*; the rules and the AI call them leaps and dashes). **Since 1 November 2026 the flash is the *dash*** (the owner: "dash is better actually", and "Yes, i think so", to calling it the dash wherever a player sees it): "E, Shift or right-click dashes", "Swipe ahead to dash", and a golden leaf's *golden dashes*, in the key help, the lessons, the Field guide, the banners, the chatter (English and Chinese) and the README; the notes below from before that day keep the word they were written with. The code already said dash (only some of its names and the Field guide's picture keys still say flash). The edge of the log is the *edge*, never a wall. *Bonk!* is for a knock you survive; a death gets a word that means out.

**Every death says why.** The engine records why a crash was fatal, and the card's first line says it:
- boxed in ("…with nowhere to turn");
- at your smallest;
- the shorter one in a head-on;
- pecked;
- blown up.

The rival's quip stays as flavour. A death that ends the round says it on the round-over card too.

**Small mercies at the keys**: its rules are in `42-controls.md` under the same name (and the tags in two rows of
two in "What gives on the smallest screens" in `33-one-screen.md`), and its text as it was in
`docs/archive/design-page.md`.

**Every sound survives a phone speaker**: its rules are in `21-sound.md` under the same name (and the gaps that keep
yours apart from a rival's under "Yours, a rival's and the world's"), and its text as it was in
`docs/archive/design-sound.md`.

### Feel targets for the third pass

| Target | Concrete check |
|---|---|
| A power only when you ask | A key held down, an auto-repeat, a turn pressed twice within 120 ms, or the press that starts or wakes a round never fires a leap or a dash (checked with real key events in headless Chrome). Since round four each power has its own press, and `tools/input-test.js` checks that pressing the way you're going, a held key and its auto-repeat, and the press that starts or wakes a round never fire one, and that a swipe never jumps |
| The first knock really is free | A player who never steers survives their first crash and isn't steered into the edge (the auto-turn breaks ties by the open run ahead) |
| You can always see why | Every death card names the reason. Your leap's cooldown shows at your head (since round four, both rests: the jump's and the flash's half-rings). A press that can't go gives a thunk and an inked × (sky for a jump, ember for a flash) on what it couldn't hop |
| A calmer narrator | In watched AI rounds, about one banner every 8 s or fewer (it was one every 4–5 s), and no lesson replaced within 2.5 s |
| Frame cost | Full cost per frame (script and GPU, measured to a readback): the long-snake scene ≤ 4 ms (second pass 3.4–3.6; round four, interleaved with the build before it on one machine: 3.5–4.5 against 3.6–4.2, the same within noise); with Sovereign's and Colonist's land on the board ≤ 1.5× the same board without (`tools/bench.js` prints it; round four's borders measured 1.28–1.40×, the force fields before them 2.26–2.62×; the same staged scene, interleaved: 3.0–3.2 ms with the borders against 4.9–5.2 with the force fields); a new round's first frame doesn't rebuild the bark |
| No clicks | Every cue rendered offline starts from silence (no sample-level step) |
| Small speakers | Through a 300 Hz high-pass (a phone speaker), your death still lands louder than an apple |
| Memory stays flat | Drawing the land for a minute retains no growing heap (the colour cache is bounded) |

