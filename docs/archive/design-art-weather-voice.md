# Art, weather, words and the round's arc, as they were decided: the round files' text

The art direction's, the weather's, the voice's and the round's arc's sections as the round files had them, word for
word, with their superseded versions and measurements. The current rules are in
`docs/design/02-art-direction-storybook-bark-on-a-mossy-log.md`, `docs/design/05-weather.md`,
`docs/design/09-voice-and-copy.md` and `docs/design/12-the-rounds-arc.md`.

## From borders and frames (`07-borders-and-frames.md`)

One treatment, used everywhere:
- **Board:** a carved Heartwood frame with leaves resting on its corners. The leaves sway, each from its stalk on its own beat; now and then a band of light runs along the wood; and **the frame lights up round its edge for the big moments**, in the moment's colour: green for Go!, gold for a golden apple, emerald for a beetle, red for a knockout (strongest for yours), orange for the woodpecker, honey for a win or a new best.
- **Panels:** parchment with an inset Parchment-2 ring. This covers the cards, the dialog, the name tags, banners and bubbles.
- **Buttons:** pills with a lip.
  - Primary: Leaf with cream text.
  - Secondary: transparent with an Ink ring.
  - Small: Heartwood with cream text.
- **Focus:** a Honey ring on dark backgrounds and an Ink ring on parchment, always visible with `:focus-visible`.

## From the third pass (`11-the-third-pass-what-it-settles.md`)

**Reduced motion removes movement, never information.** Being in the air is a rule, so a leap keeps a still airborne pose. The woodpecker cuts between perches instead of swooping. Rain holds still rather than vanishing (it puts fire out), a burning leaf appears where it lands instead of flying, and a death is a still starburst that fades.

**One word for each thing.** The leap was *ahead*: "Press ahead to leap", "Swipe ahead to leap". Since round four the two powers are a *jump* and a *flash*, each with its own press: "Space jumps", "E or Shift flashes", "Tap to jump", "Swipe ahead to flash" (a golden beetle's are *golden jumps* and a golden leaf's *golden flashes*; the rules and the AI call them leaps and dashes). **Since 1 November 2026 the flash is the *dash*** (the owner: "dash is better actually", and "Yes, i think so", to calling it the dash wherever a player sees it): "E, Shift or right-click dashes", "Swipe ahead to dash", and a golden leaf's *golden dashes*, in the key help, the lessons, the Field guide, the banners, the chatter (English and Chinese) and the README; the notes below from before that day keep the word they were written with. The code already said dash (only some of its names and the Field guide's picture keys still say flash). The edge of the log is the *edge*, never a wall. *Bonk!* is for a knock you survive; a death gets a word that means out.

## From powers (`18-powers-everyone-leaps-and-golden-things-do-more.md`)

**Sudden death closes in.** With everyone leaping out of boxes, rounds ran long (median 194 s, 97% reaching the woodpecker) and ended in slow starving: a long snake takes a minute or more to starve once nothing grows. Making hunger bite harder in sudden death shortened them, but turned the end into a starving contest (half of all deaths); so instead **the woodpecker gets hungrier**: each rest is `PECK_HUNGRIER` (0.85) of the one before (down to `PECK_REST_MIN`, 12 ticks), and each patch a cell bigger than the last (up to `PECK_CHUNK_MAX`, 14; 16 since round four, from 9). The log shrinks faster and faster, so the end comes from the board closing in, not from waiting. **Ghost changed with it:** built to stay small (it ate mushrooms on purpose past 18), it starved first in every long endgame and won 5–7%; now it keeps its distance from everyone and slips through the gaps, with a normal appetite (it eats until 18 long, and keeps nibbling after). Its blurb says so.

## From the owner's playtest (`32-the-owners-playtest.md`)

### Rainbows upright

**The cause:** `drawRainbow` (`render/weather.js`) drew the arch round a centre level with the golden apple. From an apple in the log's upper half there was no room over it, so it deliberately hung the arch downward, red outermost at the bottom: a rainbow upside down.

**The call** (27 October 2026): always upright, red outermost. An apple in the lower half keeps its arch. For one in the upper half the arch is part of a great circle centred 1.15 boards down, below the log, passing through the apple: it rises out of the apple, over, and down off the far side (the side of the board farther from the apple), ending where the circle leaves the board's bottom (well beyond the far edge). (Its numbers were replaced twice since, below.)

**Where its top is** (27 October 2026, after PR #57 put the top 0.06 of the board from the top edge with the radius fixed at 1.09 boards, which left an apple near the middle of the top half showing only the rising side): the arch's top is half way from the apple to the far edge, so the arch is even between them and comes back down to the apple's height at the far edge. The side is the far side by the apple's column, fixed for that rainbow (the board has an even number of columns, so no apple is in the middle), and within each half the arch changes smoothly as the apple's place does.

**Rounder, and the same in both halves** (27 October 2026, the owner on the follow-ups PR #61 left open: "And I agree, queue!"; this PR): with its centre 1.15 boards down, an arch over a short stretch was shallow (from an apple by the middle it rose about a cell), and an apple in the lower half kept the old half circle round its own height, so one low near the middle showed only its rising side. Now every rainbow, from either half, follows the one rule: up out of the apple, its top half way to the far edge, down to the apple's height at that edge and on off the board. Each is the same round arch, its centre below the apple by half the arch's half-width (d, half the way to the far edge): its radius 1.12 d, its top 0.62 d above the apple, the arc from the apple to the far edge 127°. From an apple by the middle (d about 6.25 cells) it rises 3.9 cells, from one low by a side edge 7. Where its top would come nearer the top edge than 0.06 of the board (or half the apple's height, for an apple in the top 0.12 of the board), it's flatter instead, its centre lower so its top is just that, and the change is smooth where the two meet. A low apple's arch is smaller than the old half circle (whose top was 0.1 of the board from the top edge from anywhere), but it's always whole. render-test checks twenty apples, left, middle and right, high and low in both halves, and that from one by the middle, high or low, it rises clearly (its glow's top over 4.5 cells above the apple's middle; 5.2 now, 2.25 before).
