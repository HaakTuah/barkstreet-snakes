## The third pass: what it settles

**Gold means power.** The powers brought their own lemon yellows (`#fde047`, `#fef08a`, `#eab308`), greenish next to the warm Honey of the gold banner and the crown. They're folded into Honey: fills `#fde68a`, lines `#d4a017`, glints `#fffbea`. The decorative autumn leaves move to russet and brown, and Mute's proud mood leaves gold too, so on this board gold always means a power.

**A power is one token, not a ring.** A golden power used to draw a ring round the head with pips, on top of the stun halo, Capricious's ring, the ready ring and YOU's ring. Now it's:
- a thin opaque gold line round the body, with an ink line outside it so it reads on any colour, drawn outside your cream outline;
- pips on a short arc behind the head, turned with it: since round four, sky round pips for golden jumps and ember diamonds for golden flashes; holding both, the golden jumps' pips sit on the snake's left of the arc and the golden flashes' on its right.

The plain leap's cooldown was a thin arc round your own head that filled and closed into the ready flash. **Since round four** your two plain rests are two half-rings round your head, fixed to the screen: the jump's on the left in sky, the flash's on the right in ember. Each fills from the bottom over a faint track while it rests (not shown while you hold golden ones of that kind) and gives one bright flick when it's back. That's on the board, where you're looking, not only on the tag. On the tags, a power is a 6 px chip (the chip radius) with small inline icons in ink (a hop, a double chevron, a loop) instead of fallback-font glyphs; since round four, one chip per power (golden jumps sky, golden flashes ember, both on Honey with the count), and your own tag always shows your plain jump and flash, each filling in its accent as it rests. A name never gives way to it: on a narrow tag the chip drops its counts and keeps its icons (the pips on the board and the screen reader's words still give the number).

**Height is scale.** The board is seen from above, so a leap rises toward you: the head and neck swell along their path at the top of the arc, and the shadow on the bark spreads and softens. It no longer lifts up the screen, which read as a lunge or a flinch depending on the heading. Drawn ahead (round four, unless you're watching alone), a jump that's sure to go starts rising before its tick.

**Reduced motion removes movement, never information.** Being in the air is a rule, so a leap keeps a still airborne pose. The woodpecker cuts between perches instead of swooping. Rain holds still rather than vanishing (it puts fire out), a burning leaf appears where it lands instead of flying, and a death is a still starburst that fades.

**The narrator speaks less, and better.** Banners go through a small queue (since "Teaching by showing", step 1, each waits its turn and is held for its reading time: see there):
- **Lessons** (the first crash, the first leap, a power's first pickup, dropping to your smallest) wait 6 s of the round at most.
- **Round news and the weather** wait as long as it takes; a spawn's news shows only when the banner is free, else the next one tells it.
- **Repeats** don't get banners: only the first golden apple and the first beetle of a round are announced, and a repeat crash or a pickup's "+3" is left to the board's own floaters.
- **While a card is up,** only what changes the round gets through.

Lessons are one idea and 60 characters or fewer (since round six A's critique, input-test checks every one, with keys and on touch). The fine print lives in the README, or comes when it happens (*Snip!*).

**One word for each thing.** The leap was *ahead*: "Press ahead to leap", "Swipe ahead to leap". Since round four the two powers are a *jump* and a *flash*, each with its own press: "Space jumps", "E or Shift flashes", "Tap to jump", "Swipe ahead to flash" (a golden beetle's are *golden jumps* and a golden leaf's *golden flashes*; the rules and the AI call them leaps and dashes). **Since 1 November 2026 the flash is the *dash*** (Haakon: "dash is better actually", and "Yes, i think so", to calling it the dash wherever a player sees it): "E, Shift or right-click dashes", "Swipe ahead to dash", and a golden leaf's *golden dashes*, in the key help, the lessons, the Field guide, the banners, the chatter (English and Chinese) and the README; the notes below from before that day keep the word they were written with. The code already said dash (only some of its names and the Field guide's picture keys still say flash). The edge of the log is the *edge*, never a wall. *Bonk!* is for a knock you survive; a death gets a word that means out.

**Every death says why.** The engine records why a crash was fatal, and the card's first line says it:
- boxed in ("…with nowhere to turn");
- at your smallest;
- the shorter one in a head-on;
- pecked;
- blown up.

The rival's quip stays as flavour. A death that ends the round says it on the round-over card too.

**Small mercies at the keys.** A slip shouldn't cost a round, and a press should never be lost without a word:
- *R* and *Enter* sit next to the steering keys, so mid-round they ask "Start over?" first, naming the key you pressed. The same key again confirms; P, Escape or an arrow keeps going at once (an arrow steers too; Space did too, until it became the jump in round four). In the countdown, *R* is Go, like Enter (never online, where everyone starts together).
- The nap keys always nap: P and Escape (and Space, until round four made it the jump), in a round or in its countdown (the phone rang). Go is the Go! button, Enter, R or an arrow. On your own death card they keep watching instead (napping would hide why you died), and on the Napping card Enter asks "Start over?" as R does. A button you Tabbed to keeps its own keys (Enter on 2× sets the speed); a new round lets go of it.
- The press that starts or wakes a round is a steer, never a power (you always start facing right: pressing right to go isn't asking to leap). A turn pressed twice within 120 ms is always the turn; up to 180 ms it's a leap you meant only once the turn has happened, and never with dashes, which go at once. (Superseded by round four: steering keys only steer, and the guard, `POWER_AFTER_TURN_MS`, is kept for swipes only: since the critique, 300 ms from the lift of the swipe that turned you.)
- Waking from a nap goes through one quiet countdown beat (no YOU, no riser; the round's music carries on), so your hand is back on the keys before the board moves. An arrow skips the beat, and steers. A round napped before its Go gets its real Go on waking. Watching, waking is at once.
- A nap never covers a death that's about to be told: the card comes up as it would.
- Stunned, the latest press wins (you get more than one guess while the stars go round, and a small inked chevron by your head shows which way you pressed, or (since round four) the jump's hop or the flash's double chevron, in its accent (sky or ember; Honey when golden), for a power asked for, until the moment you move, online too), checked against your neck, not the way you were facing when you crashed. Reversing a queued turn that hasn't happened yet changes your mind instead of being ignored, and a U-turn's two keys rolled together count even when the second lands a hair early.
- On a phone every finger is its own swipe: a thumb resting on the glass doesn't block the other, and can still steer once the other lifts. During a round a swipe may start on a button (the Go! in the middle of the board); a short tap is still a tap.
- A first round's score is a best only by default: no fanfare until there's a best to beat. Carving your name is offered once a round, not on both cards, and never pressed on you: on a keyboard the card keeps the focus (R and Enter mean what they always mean; Space, since round four, starts nothing) and Tab reaches the field. It stays while you type, even if the round ends under it; named already, the card says "as Haakon"; carving says "Carved".
- Where four tags in a row would cut the rivals' names (a near-square window), they sit in two rows of two, as on a phone.

**Every sound survives a phone speaker.** A cue's weight can't live only below 150 Hz, so the low cues (death, bonks, thunder, boom, the stinger, the heartbeat) get a midrange knock or body that implies their bass. Every envelope starts from silence. Your own sounds come before rivals', and both come before the world's. A cue's shortest gap between plays (so a burst doesn't stack up) is kept apart for yours: a rival's waits on yours and on other rivals', and yours waits only on your own, so a rival's flash or jump, golden or plain, never silences yours. A golden flash's gap (50 ms) is under a tick and a jump's (120 ms) under two, so your own golden ones in a row are each heard (round four's critique; `tools/chatter-test.js` plays the sound to check). Ambient beds stop when the round does.

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

