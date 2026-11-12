## Controls

The keys, the mouse and touch on every screen: what each press does, how soon it shows, and the slips forgiven, as
the third pass, round four and round six A settled them (their text, with what was measured, is in
`docs/archive/design-page.md`). It changes how a press is read and drawn, never a rule: a snake steered by keys, a
mouse or a finger plays by the same engine calls. Elsewhere: how the powers are pressed and their guards (a tap's
jump, a swipe ahead's dash, the turn swiped twice, a card that comes up by itself: "Two powers, two presses" and
"Pressing during a stun" in `40-powers-and-moves.md`); waking a nap with any key (the Pause row of
`09-voice-and-copy.md`); the buttons and where they sit (`31-phones.md`, `33-one-screen.md`); a rival's note from its
tag ("A rival's note" in `43-the-start-card-and-records.md`); and how a stunned press looks ("Your rests" under "Telling
powers apart" in `03-the-snake-as-a-character.md`).

### Controls anyone can guess

The owner: a newcomer "doesn't know the wasd convention". So the arrow keys steer and the words say them first, and a
mouse works for the powers.
- **The keys:** the arrows steer, and WASD too. Space jumps; E (by where it sits, like WASD) or either Shift dashes.
  P or Esc naps; Enter or R starts and starts over; H opens the Hall of Fame and G the Field guide; M mutes, N toggles
  the music and V the voices; watching, 1, 2 and 4 set the speed (3 too, for the third button). A held key's repeats
  do nothing: its first press did.
- **The words:** the start card, the help under the board and online read "Arrow keys steer (or WASD) · Space or click
  jumps · E, Shift or right-click dashes · …" (the mouse named, or nobody would find it), and the hint beside YOU
  "Arrow keys to steer (or WASD)"; on touch, "Swipe to steer · Tap to jump · Swipe ahead to dash", and alone "· Tap ⏸
  to nap" after it. The Field guide's Jump and Dash rows say "Space or a click on the log" and "E, Shift or a
  right-click on the log". The lessons name the mouse too, on a keyboard (on a phone they say the touch): the dash's
  "Your dash is ready: E, Shift or right-click.", a golden leaf's "2 golden dashes: E or right-click. Never at edges or
  holes." (one key and the mouse, Shift being the Field guide's, to keep it to 60 characters), a golden beetle's "…
  Space or a click to jump."; and so do the power words for screen readers ("Space or a click jumps: ready. E, Shift
  or right-click dashes: ready.") and the pips' tooltips. A lesson keeps to 60 characters, with keys and on touch.
- **The mouse:** the left button jumps and the right one dashes, with no menu popping up over the board. Its buttons
  only, so taps, swipes and pens are as they are; only on the board itself with no card over it, so a card's clicks and
  buttons keep their meaning. A right press while the left is held counts (the jump, then the dash, as with the keys);
  the middle button and a click with Ctrl, Alt or Meta do nothing. No menu over the board, but a card's words and
  fields keep theirs. Mashing the mouse as your death card comes up never presses Play again or focuses the carve
  field, as with touches.

### Small mercies at the keys

A slip shouldn't cost a round, and a press should never be lost without a word:
- *R* and *Enter* sit next to the steering keys, so mid-round they ask "Start over?" first, naming the key you pressed.
  The same key again confirms; P, Escape or an arrow keeps going at once (an arrow steers too). In the countdown, *R*
  is Go, like Enter (never online, where everyone starts together).
- The nap keys always nap: P and Escape, in a round or in its countdown (the phone rang). Go is the Go! button, Enter,
  R or an arrow. On your own death card they keep watching instead (napping would hide why you died). On the Napping
  card any key that plays wakes (Enter too), and R asks "Start over?". A button you Tabbed to keeps its own keys (Enter
  on 2× sets the speed); a new round lets go of it.
- The press that starts or wakes a round is a steer, never a power (you always start facing right: pressing right to
  go isn't asking to leap). Steering keys only steer.
- Waking from a nap goes through one quiet countdown beat (no YOU, no riser; the round's music carries on), so your
  hand is back on the keys before the board moves. An arrow skips the beat, and steers. A round napped before its Go
  gets its real Go on waking. Watching, waking is at once.
- The game naps by itself when the tab is hidden or the window loses focus, so you never come back to a dead snake
  (online the round goes on and an AI steers: "Play with friends" in `22-play-with-friends-online.md`).
- A nap never covers a death that's about to be told: the card comes up as it would.
- Stunned, the latest press wins (you get more than one guess while the stars go round, and a small inked chevron by
  your head shows which way you pressed, or the jump's hop or the dash's double chevron for a power asked for, until
  the moment you move, online too), checked against your neck, not the way you were facing when you crashed. Reversing
  a queued turn that hasn't happened yet changes your mind instead of being ignored, and a U-turn's two keys rolled
  together count even when the second lands a hair early (`CHORD_MS`, 60 ms).
- A first round's score is a best only by default: no fanfare until there's a best to beat. Carving your name is
  offered once a round, not on both cards, and never pressed on you: on a keyboard the card keeps the focus (R and
  Enter mean what they always mean; Space starts nothing) and Tab reaches the field. It stays while you type, even if
  the round ends under it; named already, the card says "as the owner"; carving says "Carved".

### Controls that keep up

What felt like delay wasn't lost input: the board was drawn a tick in the past, so a press made as you saw your head
reach a cell was late. The AI looked swift because it decides on the tick, against its own exact position.
- **The board is drawn ahead:** 60 ms (`DRAW_LEAD_MS`), but never more than half a tick (`DRAW_LEAD_MAX` 0.5): 60 ms at
  120 ms ticks, 45 ms at full speed. The cell your head is drawn in is the cell your press turns at, at every speed. It
  changes the drawing only, never a rule:
  - rivals' next step comes from the plans they've already made, and they make them before the board is drawn into
    their next move: in the frames after the tick, up to the one that draws the next move, one decision a frame and at
    most two, never in the frame that ticked unless none is left;
  - a head about to crash holds at its cell centre instead of overshooting (fire isn't a crash, so a head heading into
    fire doesn't hold);
  - a guess that turns out wrong (a plan made late, a press in the second half of a tick) eases to the right place,
    never faster than a snake moves;
  - a flash, plain or golden, that's sure to go is drawn ahead too: from when the head is drawn past its cell's centre
    (before its tick) it's where the flash takes it, streak and all, and at the tick it glides on from a cell back
    along its body, never standing still. A flash guessed but not taken eases back like any wrong guess. In Watch AIs
    the board has no lead, so a flash shows at its tick, a cell on, or two for a golden one, and glides on from there;
  - online, the host sends where everyone goes next once its rivals have thought (a rival's plan, a person's queued
    turn, powers asked for), and again when a press changes it; friends draw ahead from that (since protocol 8);
  - the board rests at its cells before Go and once the round's over;
  - it's only while you're playing on this screen: watching alone (Watch AIs, or after your death, alone), the board
    is drawn on its ticks, easing there after a death.
- **Your press shows at once.** Every steering press, not only a stunned one, and online too: your eyes look and your
  head leans the way you pressed, and it's drawn ahead from there, before the tick takes it.
- **Your face turns quickly** (about 60 ms, `FACE_EASE_MS`). The 300 ms "steady line" stays for the rivals, whose
  tongues it was for.

### Touch precision

- **During a round a swipe works anywhere on the screen,** including over the countdown, and the page never scrolls or
  refreshes. A swipe may start on a button (the Go! in the middle of the board, the header's): once it has travelled
  it steers and the button's click is swallowed; a short tap is still a tap.
- **A swipe registers** once the finger has travelled half a cell (`SWIPE_CELLS` 0.5), and at least 12 px
  (`SWIPE_MIN_PX`, about 3 mm, against finger jitter), without lifting. A finger already swiping chains its next turn
  at 8 px (`SWIPE_CHAIN_PX`; a new touch still needs 12, to tell it from a tap). The anchor keeps up with the finger
  while it goes the way it registered, so a turn counts from where the finger turns.
- **Its way must be clear:** half again the other (`SWIPE_AXIS` 1.5), so a diagonal waits until it's clearly one way,
  or until the finger has gone twice the swipe's distance (`SWIPE_SURE` 2), when its main way counts: a 40° diagonal
  waits, and a long slanted stroke then turns its main way.
- **Every finger is its own swipe:** a thumb resting on the glass doesn't block the other, and can still steer once
  the other lifts.
- A tap jumps and a fresh swipe the way you're going dashes; a swipe never jumps ("Two powers, two presses" in
  `40-powers-and-moves.md`).

### Tests

`tools/input-test.js` (its parts in `tools/input/`) checks the controls in headless Chrome with real key, mouse and
touch events on a virtual 60 Hz clock: the keys and the mouse's buttons, what never fires a power, two presses in one
tick on consecutive ticks and a press reaching the engine within a tick and a frame, swipes that never jump over a
sweep of speeds and angles, a slanted stroke that still turns, mashing over a death's card, the rivals all thought
before the board is drawn into their next move, and every lesson 60 characters or fewer, with keys and on touch.
`tools/render-test.js` checks a flash's glide after its tick.
