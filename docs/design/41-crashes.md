## Crashes

A crash costs length rather than everything, so length is your armour: the crash, head-ons, fire on snakes and your
own beads, as crashes, not deaths, round six A and round six B settled them (their text, with what was tried and
measured, is in `docs/archive/design-powers.md`). Elsewhere: the moves that end in one (a failed flash, a jump whose
landing is taken, bumps in the air, a golden flash that blows up) and where a spat mushroom rolls ("Where it rolls is a
rule, never chance": it's the spit's rule now, no longer the beads') are in `40-powers-and-moves.md`; the woodpecker's
holes in `38-the-woodpecker.md`; fire on the log and food that cooks in `05-weather.md` and
`14-crashes-not-deaths-the-rules-reworked.md`; how a rival weighs a crash in `39-the-rivals.md`. Online, each snake's
stun and burn, crashes (with why one was the end) and squashes cross to a friend's screen ("Online" in
`40-powers-and-moves.md`).

### Crashes, not deaths

Snake is one mistake and out, and the longer you are, the more there is to bump into; so a crash costs length rather
than everything, and length is your armour.

- **A crash** (into the edge, a hole, any body, or another head) bounces your head back: it stays put, you lose
  `CRASH_LOSS` (3) segments off your tail (never below `MIN_LENGTH`, 3; they break off as beads in your markings, food
  for anyone but you), and you're stunned for `STUN_TICKS` (4, about half a second): your body stays where it is (so
  someone can run into it). You can steer meanwhile, and go your way when the stun's over; if you haven't steered and
  you're still facing what you hit, you turn to the open side with the most room. A head-on bounces both. A crashed
  snake's tail doesn't move that tick, so a head heading for it crashes too (worked out until nothing changes).
- **You're out** if you crash at your smallest (3), or if there'll be nowhere to turn **when the stun's over**: every
  neighbour (the cell you hit included) off the board, a hole, or a body that'll still be there by the tick you move
  again. Room is judged with the real timings: a cell j from a snake's head is left on that snake's (length − j +
  growth)th move, and a head may take a cell on the very tick its tail leaves; a stunned snake's moves start when its
  stun's over. So your own tail breaking off in the crash makes room (and your tail end, leaving as you move), a rival's
  tail that'll have moved on makes room, a rival that crashed this tick too loses its tail at once, and a snake that's
  out this tick is all food. A cell another head is arriving in is that head's now, and counts the same way.
- So a short snake plays the classic game; a long one can take a few knocks, and every bite counts.
- *The cue:* the head lunges into what it hit and bounces back, chips of bark (or the other snake's colour) fly, a
  "Bonk!" pops up, and for you a "-3" and a shake; its head wobbles and stars go round it while it's stunned.
- *The sound:* for you, a hollow wooden bonk with a spring's boing and a twinkle (a failed flash's is bigger); someone
  else's crash is a dull thud.
- *The lessons:* your first crash, "Crashes cost tail. At length 3, or boxed in, one ends you." (or "That crash cost
  tail. At length 3, or boxed in, you’re out."); down to 3, "Crashes cost tail. You’re at 3: the next one ends you." The death
  card says why a crash was the end (the engine records it): "…at your smallest", "…with nowhere to turn", "…, and it
  was longer", "…, the same length: both out".
- *The Field guide's Crashes row:* "An edge, a snake or your own tail costs you tail. At 3, or boxed in, a crash ends
  you."
- *The rivals* play by exactly the same rules: they steer clear of crashes, a stunned rival doesn't think until it can
  move again, and every rival has lines for crashing and losing its tail (some gloat when you bounce off them).

### Head-on, both boxed in

Two snakes that meet head-on, each with nowhere to turn: the longer one bounces (the shorter one's body, turned to
food, is its room); the same length, both out. How it's worked out: the cell two heads met in is room for one of them
once every other head that met there is out or has room of its own (that one will turn away); everything is worked out
until nothing changes, and when nothing does, **the shortest of those still boxed in go out first** and the rest are
looked at again. So it's the same whether they met in a cell or swapped, whether the shorter is at its smallest or not,
whether only one of them is boxed in, and when two snakes run into each other's bodies, each boxed in only by the other.

### No more head-butting loops

Only one of two heads that met in an empty cell may go back into it: **the longer one** (the same length, the one that
came first). The other, coming out of its stun still facing it without having steered, turns away, to the open side
with the most room, avoiding a cell next to another head if it can. Once the other is out, still stunned or gone, the
cell is anyone's. The rivals keep twice their usual berth from a snake they just met head-on for about 3 s.

### Fire on snakes

Crawl into a burning cell and you catch alight for `BURN_TICKS` (18, about 2 s; going back in starts it again): every
`BURN_EVERY` (6) ticks a segment falls off, roasted (a roast bead is worth 2), 3 in all, the same as a crash; at your
smallest, the flames finish you ("burned up"). Rain or snow puts you out within 6 ticks. At the same price, it's a real
choice: a crash stops you dead and stuns you; fire lets you keep going.
- *The cue:* flames run along your back, with embers and smoke; catching, a burst of flame and a whoosh; each piece
  lost, a hiss and a pop.
- *The lesson:* "On fire: 3 bites of tail, and at 3 it ends you. Rain helps."
- *The Field guide's Fire row:* "Lightning lights it. Crawl in and it takes 3 bites of tail; rain puts it out."
- *The rivals* plan round fire like a wall, but when every other move is a crash or worse, they go through the fire
  rather than crash; never as a shortcut.

### Choking on your own tail

Your own beads (the tail a crash knocks off, or a cut takes) aren't a meal: your head squashes any bead of your own it
passes over, at once and for nothing, so it's no meal for you and denied to everyone else. A crash costs its length for
good, and chasing your own beads to deny them is a choice that costs time and position. Beads carry their owner, so it's
the same rule for everyone. (A starving snake that squashes a bead on the tick it runs out isn't saved: it ate nothing.)
The name stays from when your head choked on them; the choke, the cough and the nudge are gone.
- *The cue:* a soft splat and a flat splat left on the bark in the bead's own colour, a little wider than the bead, with
  a darker rim, a wet sheen and a few drops, fading over 3 s (with reduced motion it doesn't spread, it just fades); no
  spray of crumbs, no gulp and no "Splat!" over your head (`drawSplats()` in `render/weather.js`).
- *The sound:* a soft wet splat, low, with a little squelch after it (softer for a rival's).
- *The lesson:* the first squash, "Your own beads feed nobody."
- *The Field guide's Beads row* ends "Your own beads you squash flat as you pass, so they feed nobody: run them over to keep
  them from the others."
- *The rivals:* their own beads are worth nothing to them; squashing to deny is left to people and to the pricing part
  (part 7).

### A crash you don't survive goes off with a bang

A snake that goes out bursts at its head: a comic starburst (flat, inked, a cached sprite) and a thick shockwave ring in
its colour with an ink edge, a spray of pieces from the head and along the body, and a little smoke (`burst()` in
`render/blasts.js`); a rainbow (Star's, or Copycat's copy of it) goes off in its colours. Your kill shakes the board a
touch. So it never reads as a crash you survive, which only knocks beads off. With reduced motion it's a still
starburst and ring, fading.

### Every death says why

The engine records why a snake went out (`fatal`), and the death card's first line says it (`howYouDied` in
`game/core.js`):
- a crash with nowhere to turn ("…with nowhere to turn");
- a crash at your smallest ("…at your smallest");
- the shorter one in a head-on ("…, and it was longer"; a friend's "they were longer"), or the same length ("…, the
  same length: both out");
- pecked ("The woodpecker struck right under your head");
- burned up ("The flames got you at your smallest");
- cut in two ("Name’s dash cut you right behind the head");
- starved ("You ran out of food at your smallest");
- blown up, or a fall into a hole, in the cause itself ("…dashed into the edge and blew up", "…fell into a woodpecker
  hole").

The rival's quip stays as flavour. A death that ends the round says it on the round-over card too.
