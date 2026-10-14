# Audit: Bark & Bite, third polish pass

Baseline: `polish/extreme` at `8a22961`, which is `main` (`7792572`) plus the three open PRs of the last round: #22 (crash rules, a smarter AI), #23 (looks and lines) and #24 (powers). Polishing code that's about to land means stacking on them (see DESIGN.md, *Skipped or adapted*). The second pass's audit is at [`2b948db`](https://github.com/HaakTuah/snake-game/blob/2b948db/AUDIT.md), and the first's at [`3e2d8bc`](https://github.com/HaakTuah/snake-game/blob/3e2d8bc/AUDIT.md). Almost everything in those was fixed.

## How this audit was done

- **Read in full, through eight lenses, by eight independent auditors:** loop and input; rules and feel; visuals; words; sound; performance; accessibility, layout and robustness; and a fresh player. Each was told what DESIGN.md had already settled and what the earlier audits had fixed, so settled choices weren't re-reported.
- **Played, in headless Chrome:**
  - real key, mouse and multi-touch events, with an autopilot steering your snake;
  - real-time and hand-stepped frames at 60, 120 and 144 Hz;
  - 32 viewports from 320×480 to 2560×1600, portrait and landscape, with phones at 2–3×;
  - two-tab online rounds;
  - audio rendered offline through the game's own graph and measured for loudness and spectrum.
- **Measured, not guessed:**
  - CPU profiles and Chrome traces;
  - draw-call counts;
  - paired A/B variants of render.js drawn in the same page, so machine load hits both alike;
  - retained heap after forced GCs;
  - seeded simulations.
- **Every high and medium finding was checked by a separate skeptic,** told to refute it and to re-judge its severity. Seven were refuted and are listed as skipped. Many were re-rated, and the severities below are the skeptics'.
- **"Before" screenshots** of every state are in `docs/screenshots/before-3/`.

Severity:
- **high** breaks play or clearly hurts the experience;
- **medium** is a clear defect or a real cost a picky player would notice;
- **low** is polish.

Plan:
- **fix**;
- **adapt** (fixed differently from the suggestion);
- **skip** (with the reason).

Where two lenses found the same thing, it's listed once.

---

## Baseline performance, and a correction

The first numbers I recorded for this pass were alarming:
- frames of 120–650 ms in the long-snake scene (`tools/bench.js`);
- the GPU process saturated at 25 ms a frame (a new `tools/trace.js`);
- a 4.7 ms median frame when watching at 4×.

**The performance auditor showed most of that was the harness:**
- trace.js called `setGame` every frame, rebuilding the whole bark texture;
- its "nap" didn't work during the countdown, so the game's own round drew underneath;
- bench.js's draw loop never waited for the GPU, so every ~40th frame paid for the queue (its real figure is the mean, 4.7–6.9 ms, not the median);
- watching runs depend on headless Chrome's frame rate and on the quality governor, which lowered quality mid-run.

**The game's real costs, from paired variants drawn back to back in one page, each batch closed by a pixel readback (full cost: script plus GPU):**

| Scene | Cost per frame |
|---|---|
| Long snakes (4 × 70 segments, beads, holes), second pass | 3.4–3.6 ms |
| Long snakes, now | 5.2–6.4 ms (about 1.6×: see P2) |
| Force fields on the board (a realm, three colonies, holes, four snakes of 30) | 17.9 ms, against 6.4 ms with the fields off (see P1) |
| Each round's first frame | 40–55 ms of GPU, while the bark is rebuilt (P6) |

Watching at 1× is comfortable (no frame over 16.7 ms in a minute). **The tools get fixed first** (P3), so before-and-after numbers in this pass come from a harness that measures the game.

---

## 1. Loop and input

| ID | Sev | Finding | Plan |
|---|---|---|---|
| L1 | high | **Held keys and double-tapped turns fire powers.** Arrow and WASD keydowns are handled before the `e.repeat` check (snake.js:1160-1164). So OS auto-repeat calls `turn()` 30 times a second, and every repeat that matches your heading arms your power. Holding a turn key fires a dash a tick (into the edge: *Kaboom!*). Leaps happen by themselves, and golden leaps are burned. After a crash, the armed power cancels the auto-turn, so a held key slams you back into the wall every 5 ticks. A double tap (17–150 ms apart) is a turn plus a dash. The swipe version was fixed in #24; the keyboard one wasn't. Online, every repeat is sent too. (Found by four lenses.) | **fix:** a power asks only on a fresh press. Ignore repeats for powers, and treat a press within about 180 ms of a turn to that same direction as part of the turn. Guests filter repeats before sending. |
| L2 | medium | **A stun locks in your first panic press, and replays a stale combo.** A stunned snake doesn't consume its queue, and a press is checked against the last *queued* turn. So during the 4-tick stun your first press is final (Up then Down drops the Down), and turns queued before the crash replay on a board that no longer exists. DESIGN promises "you can steer meanwhile". | **fix:** a crash clears the queue. While stunned, the latest press wins, checked against your neck. |
| L3 | medium | **A finger already on the screen blocks every other swipe.** Only one touch is tracked (snake.js:1189), so a resting thumb or the other thumb in two-thumb play swallows the next swipe silently. | **fix:** the newest touch takes over. |
| L4 | low | **R restarts a live round instantly.** R sits next to D, so a WASD player can throw away a two-minute round with no undo. In the countdown, R re-rolls the rivals while Enter means Go. | **fix:** while you're alive mid-round, R or Enter naps with *Start over?* focused, and a second press confirms. On cards, restarting stays instant. In the countdown, R means Go. |
| L5 | low | A hitch becomes a jump: up to 250 ms is caught up in one frame (4 ticks). | **fix:** playing alone, catch up at most one tick per frame (a hitch is a moment's slow-down, not a jump). Online and when watching fast, keep wall-clock catch-up. |
| L6 | low | Changing the watching speed teleports every snake, forward or back half a cell. | **fix:** rescale the accumulator, so drawn positions stay continuous. |
| L7 | low | Waking from a nap is instant: the snake moves 30 ms after Space, with your hand still on it. | **fix:** wake through one countdown beat that a direction key skips (and steers). |
| L8 | low | The key that starts a round blocks 9–20 ms (the bark rebuild), and the first key of a session 50–120 ms (creating audio). | **fix:** P6 and S10. |
| L9 | low | At 4× on a 60 Hz screen, half the AI decisions land inside the tick's own frame. | **fix:** the thinking quota counts the frames left before the tick, this one included. |
| — | medium | *(refuted)* Chained swipes make phantom turns from a swipe's curve. | **skip:** the skeptic couldn't reproduce it with real touch curves; the threshold and `swipe.last` already handle them. |

## 2. Rules and feel

| ID | Sev | Finding | Plan |
|---|---|---|---|
| R1 | high | **After a crash, the auto-turn steers you toward the nearest edge.** `recoil()` scores sides by flood-fill room capped at 24 cells, which every side reaches on an open board, so the tie goes to the first direction tried. A new player who hasn't steered yet is out about 3.3 s into their first round. | **fix:** break ties by the straight run ahead, then by distance from the edge. |
| R2 | medium | **Death cards don't say why a crash ended you.** Was it being boxed in, being at your smallest, losing a head-on as the shorter one, or a peck? The reason only shows for walls and self-bites. A rival involved gets its quip instead; a tiny death into a rival shows the killer's line. A lost head-on never says the other was longer. Length is armour now, so a death at 40 needs a reason. (Found by two lenses.) | **fix:** the engine records why a crash was fatal, and the card's fact line says it ("You ran into Sniper with nowhere to turn", "…at your smallest", "Head-on with Sniper, and it was longer"). The quip stays as flavour. |
| R3 | medium | **When your death ends the round (the duel), no card says how you died.** `endRound()` returns before `youDied()`. | **fix:** the round-over line starts with your cause and reason. |
| R4 | medium | **You can't see when your leap is ready, and a press that can't leap does nothing.** The state lives in an 18 px chip above the board. A press with a body ahead while cooling down (or at 3, or with nowhere to land) is silent; you find out by crashing. At 3 the tooltip still says "needs a moment". | **fix:** a thin arc round your head fills over the cooldown and closes into the ready ring. Pressing with a hurdle ahead when the leap can't go gives a dull thunk and a nudge of the tag. |
| R5 | low | A golden leap falls back to the paid leap (or a crash) when the cell three on is taken. | **fix:** a golden leap lands on the first free cell after the hurdle (two or three on), free. |
| R6 | medium | **Teaching banners get replaced within a second by routine ones.** That includes the first crash, first leap and the powers, with about 22 banners a round. | **fix:** a banner queue with priorities. Lessons hold 2.5 s; routine news waits or is dropped (see T1). |
| R7 | medium | **Nothing tells you you're at 3, where the next bump ends you.** The first-crash copy also states the rule wrongly (T4). | **fix:** a one-time banner the first time you drop to 3, and a correct first-crash line. |
| R8 | medium | **A leap pressed just after a crash is lost.** It's armed for 3 ticks; the stun lasts 5. | **fix:** while stunned, a power waits until the stun's over. |
| R9 | low | The auto-turn after a stun ignores a tail leaving that very tick, though that tail is why the verdict let you live. | **fix:** recoil judges sides with the verdict's timings. |
| R10 | low | A golden leap leaves food under its own body on the cell it crawls through. | **fix:** that cell is eaten after the move, like a dash's. |
| R11 | low | Baked food floats "+1" (it's worth 2). "A piece a second" for fire (it's three pieces, one every ~0.6 s). | **fix** (with T11). |
| — | medium | *(refuted)* No on-ramp: newcomers draw the full-strength cast. | **skip:** the skeptic's data shows first rounds aren't lopsided; the forgiving start and the first-knock length do this job. |

## 3. Visuals

| ID | Sev | Finding | Plan |
|---|---|---|---|
| V1 | high | **Winter drifts look like grey smoke.** A 384 px layer is stretched 2.7–5.3× over the board, so the lit lumps blur into translucent puffs. They lie across the grain, not along it. They sit over fields and burrows, a dusting greys the whole bark, and they linger long after the snow. (Found by two lenses.) | **fix:** fewer, crisp drifts at full resolution, long along the grain in the furrows. Each has a hard lit top and a thin blue underside. No full-board dusting. They melt in a few seconds once the snow stops. |
| V2 | medium | **The wrap's edge is a dashed "marching ants" rectangle,** the computer look DESIGN removed once. (Two lenses.) | **fix:** a warm gold seam along the inside of the frame with a glint running round it, brightest where a wrapping head is near; no line dash. |
| V3 | low | The golden power outline reads as a brown smudge on bark, vanishes on yellow and tan snakes, and is mostly hidden under your cream outline. | **fix:** a thin opaque gold line with an ink line outside it, drawn outside your outline. |
| V4 | medium | **Power badges cut rival names to "So…", "Colo…", even "Y…" for you.** `.name` has a 0 basis, so the badge never gives way. (Three lenses.) | **fix:** names get priority; the badge shrinks to its icon first. |
| V5 | medium | **Long power banners cover up to 6.5 rows on a phone,** while the "head under the banner" check assumes one 52 px line. | **fix:** short banners (T3), the check uses the banner's real height, and `text-wrap: balance`. |
| V6 | low | The dash streak lies over the dasher's body, a white line through its face. | **fix:** a tapering wedge under the snake, from where it was to the back of its head, with a scuff on the bark. |
| V7 | low | The leap lifts the head straight up the screen whatever the heading: heading up it lunges, heading down it flinches. (Two lenses.) | **fix:** height from scale. The head and neck swell along their path at the top of the arc, and the shadow spreads and softens on the bark. |
| V8 | low | Ring overload on heads: the power ring and pips, stun halo and stars, Capricious's ring, the ready ring and YOU's ring, all thin yellow circles. | **adapt:** powers become pips on a short arc behind the head, turned with it (the outline carries the glow). Stun stars ride higher when pips show. |
| V9 | low | Confetti reads as dead pixels: tiny axis-aligned squares, with an off-palette cyan. | **fix:** bigger rotated paper scraps in the palette, with a lighter back face. |
| V10 | low | The death fireball is a soft airbrush gradient, from a different hand. | **fix:** a flat comic starburst with an ink outline, puffs of smoke, and a thick shockwave ring with an ink edge, cached as a sprite. |
| V11 | low | In its last 2 s the wrap's outline strobes at 4 Hz. | **fix:** a calm fade, like the golden apple's. |
| V12 | low | The powers brought a second, greenish lemon gold, a pill badge (chips are 6 px) and fallback-font glyphs (⤴, ⟳). | **fix:** fold them into Honey. The badge becomes a chip with small inline SVG icons in ink. Mute's proud mood leaves gold to the powers. |
| V13 | low | Mute's mood acting is unreadable at play size. Its beret reads as a hole, two moods are near-identical violets, and its pale rim flickers on and off with its mood. | **fix:** a smaller beret on the crown with a lit rim, bolder brows, moods spread in lightness, and the rim fixed per snake. |
| — | medium | *(refuted)* The golden leaf is too small and looks like the autumn leaves. | **adapt anyway, cheaply:** draw it a full cell with an ink outline (every other power food has one), and move the decorative leaves to russet and brown, so gold always means power. |

## 4. Words

| ID | Sev | Finding | Plan |
|---|---|---|---|
| T1 | medium | **Banner flood.** Every golden apple (about every 6 s in sun), every beetle and every repeat crash gets a banner; that's one every 4–5 s. (Three lenses.) | **fix:** the first golden apple and first beetle of a round only. No repeat-crash banner (the board's Bonk! and −N carry it). No "Golden! +3" or "Crunchy! +2" (the floater says it). |
| T2 | medium | **The leap hints are a garden path.** "the way you’re going leaps" names no key. "swipe the way you’re going to leap" reads as "swipe in the direction you'll leap". (Three lenses.) | **fix:** one word for it everywhere, *ahead*: "Press ahead to leap" and "Swipe ahead to leap". The narrator says press or swipe to match the device. |
| T3 | medium | **Power banners are paragraphs** (up to 141 characters), read mid-play. | **fix:** 60 characters or fewer, one idea each. The fine print goes to the README, or to the moment it happens. |
| T4 | medium | **The first-crash banner states the rules wrongly.** "Three segments gone" is wrong when it cost 1 (the −1 floater says so), and "Small *and* boxed in" should be *or*. | **fix:** built from what you actually lost, with *or*. |
| T5 | low | Rivals' crash lines blame a wall, but 97% of crashes are into another snake. | **fix:** the lines fit any bump ("Fake snake!"), and walls keep their own. |
| T6 | low | **A woodpecker strike is told as "fell into a hole"**, with "The woodpecker missed you". | **fix:** its own cause ("got pecked by the woodpecker"), title (*Pecked!*) and lines. |
| T7 | medium | **Kill and win lines don't rotate,** and Sniper's and Ouroboros's repeat the chatter you just saw. | **fix:** 2–3 of each per rival, never the same twice running. Reword the two repeats. |
| T8 | medium | **Chatter punchlines come back 3–4 times a round.** Lines rest 45 s, and rounds now run 2.5 min. | **fix:** a line with a punchline is a set piece, said once a round; small pools get more lines. |
| T9 | low | Screen readers hear the power glyph inside the length ("length ⤴25"). | **fix:** the badge is hidden from them, and the sr text says it in words. |
| T10 | low | Floaters and titles that don't match: +1 for baked food, Bonk! for burning up, *Squashed!* for a dash cut. "Bonk!" means both "survived" and "out". | **fix:** "+2", "Fwoosh!", "Snip!"/"Sliced!". Bonk! is for knocks you survive, and death titles use words that mean out. |
| T11 | low | Voice drift: exclamation marks all over the powers' lines, and seven banners open with "Something…". | **fix:** "!" for the big moments; name the thing itself. |
| T12 | low | The edge has four names: wall, edge, "Walls & holes", "the edge of the bark". | **fix:** *edge* everywhere. Records store the killer key, not the words, so stats carry over. |
| T13 | low | **Stale strings.** "The tree is waiting." "A piece a second." "The edges are closing!" (reads as shrinking). The pause button's title stays "Nap" while napping. "Yee-haw" vs "Yeehaw". | **fix.** |
| T14 | low | Unnamed Hall of Fame rows say "You", but the game calls you "Green". | **fix:** your rows say *Green* until you carve a name, and carving it renames all of them. |
| T15 | low | Mute's and Ouroboros's blurbs run long on the start card. | **fix.** |
| T16 | low | README's controls lack the leap. Four orphaned Chinese lines for removed Capricious lines. | **fix**, and chatter-test flags orphans. |

## 5. Sound

| ID | Sev | Finding | Plan |
|---|---|---|---|
| S1 | high | **Random one-sample clicks.** Every cue's gain is 1.0 until its envelope starts, and at 48 kHz a source sometimes starts a sample early. | **fix:** every envelope starts from silence. |
| S2 | high | **The weighty cues vanish on phone and laptop speakers.** Death, bonks, thunder, boom, the stinger and the heartbeat carry 70–98% of their energy below 150 Hz. On a phone your death is as loud as an apple. | **fix:** each low cue gets a midrange body (a knock or thud transient at 300–1200 Hz) that implies its missing bass. |
| S3 | medium | The danger heartbeat outlives the round: it pounds on the *You win!* card and into the next countdown. | **fix:** the mood resets when the round ends. |
| S4 | medium | The weather bed outlives the round and the tab: rain hisses on the round-over card and from a hidden, napping tab. | **fix:** silence it at the end of a round and on a nap. The audio is suspended while the tab is hidden or the sound muted. |
| S5 | medium | The rain bed is a flat hiss, 8–9 dB louder than the other beds. | **fix:** about 9 dB down, a softer band, and droplet ticks. |
| S6 | medium | Sudden death becomes a woodblock ostinato, 11 dB over the music: aim, drum and crash every 2.6 s. | **fix:** the full drum for the first strikes, then shorter and softer. The aim knocks drop after a few, since the patch already shows it. |
| S7 | medium | The apple pluck is randomly out of tune with the marimba under it, and a streak climbs chromatically. | **fix:** in tune, varied by timbre and velocity. The streak climbs a pentatonic scale. |
| S8 | low | Go doesn't land: the riser crests after Go, and the round's music comes in up to 2.9 s late. | **fix:** the riser crests on Go, and the round's music starts on it. |
| S9 | medium | The first key or click of a session blocks 25–110 ms creating the AudioContext, and the first countdown beat comes out short. | **fix:** create it at load (suspended) and only resume it on the gesture. Noise buffers are built lazily. |
| S10 | low | Golden pickups have no sound of their own. The golden beetle crunches like a plain one, the leaf borrows the golden apple's sound, and wrap sounds like the rainbow. Rivals' pickups play at full volume. | **fix:** a golden sparkle layer, a wrap that goes *round*, and rivals' pickups softer. |
| S11 | low | A win that's also a new best stacks two fanfares. | **fix:** one phrase, and the music ducks under it. |
| S12 | low | The "tummy rumbling" banner is silent; the gurgle only comes once you're starving. | **fix:** a soft growl at the warning. |
| S13 | low | Mute feedback is backwards: unmuting is silent, muting clips a tap. | **fix:** the tap plays after the toggle, only when sound's on. |
| S14 | low | After a stall, the music scheduler's recovery drops the groove off its grid. | **fix:** catch up by whole steps. |
| S15 | low | Long noise layers replay the same 0.5 s snippet: the thunder's five rolls are one. | **fix:** a longer noise buffer. |
| S16 | low | The voice cap drops your own cues before ambient ones; rivals' leaps and dashes sound like yours. | **fix:** tiers (yours, then rivals', then the world). Rivals' powers are softer. |
| S17 | low | One 11-second title loop repeats forever on every menu. Bar 4's Gmaj7 sounds like a wrong note. | **adapt:** light variation every other pass, the menu music fading after a minute idle, and G7 in bar 4. |
| — | medium | *(refuted)* The dash's payoff is silent under the music. | **skip:** a measurement artefact; both cues are clearly audible. |

## 6. Performance

| ID | Sev | Finding | Plan |
|---|---|---|---|
| P1 | medium | **Force fields cost about twice the rest of the board together.** Every frame, for every field: evenodd clips with hole rects, merge clips, two clipped ripple blits, a rim of 24–51 arcs stroked twice, weather, and two clipped silhouettes per rival touching it. That's 17.9 ms a frame against 6.4 ms with fields off. | **fix:** each owner's merged field is cached as a layer (rebuilt only when it changes) and blitted, with pulse, flare and alert as alpha. Ripples are sprites with no clip, and holes are drawn over the field. |
| P2 | medium | **Bodies regressed to many-contour paths,** against DESIGN's own rule: shadows, outlines and highlights are each one path of 70–139 contours, plus Mason's veins as strokes. That's 1.6× the second pass's GPU cost; the prototype fix measured 0.67–0.71 of the current cost. | **fix:** opaque outlines as separate fills, all shadows into one offscreen layer composited once at 0.3, highlights as circles, Mason's veins as cached sprites. |
| P3 | medium | **The benchmark tools measured artefacts** (see the correction above). | **fix first:** trace.js sets the scene once and keeps the round off. bench.js closes batches with a GPU readback and reports throughput. The quality is pinned during benchmarks. A throughput tool compares variants in one page. |
| P4 | low | `rgba()`'s cache grows forever: a new string per frame for every continuously varying alpha (5 MB a minute with a field on the board). | **fix:** quantise alpha. |
| P5 | medium | **Every new round hitches its first countdown beat:** the bark is rebuilt in that frame (4–9 ms of script, 40–55 ms of GPU). | **fix:** build the next round's bark in idle time while a card is up; starting just swaps it in. |
| P6 | low | A forced layout every tick while the woodpecker is here. | **fix:** use the observed board rect. |
| P7 | low | The Play button's ripple animates box-shadow, repainting every card each frame. | **fix:** a pseudo-element animated by transform and opacity. |
| P8 | low | Burrow cracks are stroked segment by segment every frame. | **fix:** cache them. |
| P9 | low | The per-frame path still builds a few strings and closures (render.js:14 says it doesn't). | **fix** where they are. |
| — | medium | *(refuted)* Gobbler's and Vulture's decisions cost 5–10× the others. | **skip:** at most about 2×, and bounded by the board; the 4× quota fix (L9) covers the frame tail. |

## 7. Accessibility, layout and robustness

| ID | Sev | Finding | Plan |
|---|---|---|---|
| A1 | medium | **The woodpecker's next patch is shown almost only by hue.** To colour-blind players the red glow is olive on olive bark, and 15% of deaths are pecks. | **fix:** a brightness and shape cue: a pale rim round the patch that tightens as the strike nears, and a darker inside. |
| A2 | low | With reduced motion a leap is invisible: the head just sits on the body it's hopping. | **fix:** a static airborne pose. Reduced motion removes movement, not information. |
| A3 | low | Your leap badge and wrap countdown sit at 2.19:1 while the leap cools down. | **fix:** with V4/V12, cooldown shows as a fill, and the icon and numbers stay at full contrast. |
| A4 | medium | **On phones the woodpecker's layer is stretched and misplaced**: CSS 100vh against a backing sized to innerHeight. | **fix:** the CSS size and the backing come from the same numbers. |
| A5 | low | With reduced motion the woodpecker still swoops across the screen and burning leaves spin. | **fix:** cuts or short fades instead. |
| A6 | low | Smouldering cells, the warning before fire spreads, are a 2–4 px dim red dot. | **fix:** a small ember mark the size of the cell. |
| A7 | low | Every banner goes to the live region (about 21 a minute when watching), and waking is silent. | **fix:** only banners about you or the round's state; *Awake.* on resume. |
| A8 | low | Feel numbers outside tuning.js. The wrap's "two seconds" lives in four places. | **fix:** `WRAP_WARN_MS` and a small juice block in tuning.js. |
| A9 | low | No favicon (a 404 on every load from a server), and no offline cache once hosted. | **fix:** an inline SVG favicon, and a network-first service worker on http(s). |
| A10 | low | Small leftovers: an empty branch, a comment that says the opposite of its CSS, doubled blank lines. | **fix.** |
| — | medium | *(refuted)* Screen readers hear badges merged into the length digits. | **skip** as stated; the real part is T9. |

## 8. A fresh player

| ID | Sev | Finding | Plan |
|---|---|---|---|
| F1 | medium | **Opening the Hall of Fame from your death card swaps the card for *Napping*.** On a phone, its right-hand button becomes *Start over*. | **fix:** don't nap when you're only watching, and closing brings back the card that was up. |
| F2 | medium | **The woodpecker perches over the HUD**: the rivals' tags at 800×800, the speed buttons on phones. | **fix:** perching avoids the header, tags, speed control and chatter. |
| F3 | low | Unearned celebration on a fresh profile: fanfare, confetti and *Carve your name* for a 14-second last place. | **fix:** celebrate a best only once there's one to beat. Offer to carve once, not twice. |
| F4 | low | On the smallest phones, a new player is never told how to steer before their first round. | **fix:** "Swipe to steer" stays on the smallest card. |
| F5 | low | Banners keep firing behind your death card and stick out from under it. | **fix:** while a card is up, only critical banners. |
| F6 | low | The hunger warning is as gentle at length 3, where it means death, as anywhere. | **fix:** a sharper line at your smallest, a little earlier. |
| — | medium | *(refuted)* A half-second freeze in the sudden-death duel. | **skip:** the harness (see the correction). |

---

## Already good, keep

- **The loop.**
  - A fixed timestep with interpolation: motion is exactly even at 60, 120 and 144 Hz (0 spread over 1,000+ frames) and ticks don't drift.
  - The 3-deep turn buffer: 0 reversals into the neck over 3,708 fuzzed presses.
  - WASD by physical key.
  - The instant starts (an arrow on the title card is moving in 167 ms), the YOU marker, the forgiving opening ticks and the first free knock.
- **The rules.** Collisions resolved all at once, the boxed-in verdict with real timings, food only on free cells, a full board that just stops growing food, and no stalls in 135k simulated ticks.
- **The log.**
  - The grain running top to bottom, the lit plates, the knots and the moss; a different stretch every round.
  - The caterpillar body you can count and its cream outline for you.
  - The faces with gaze, blink and gags that read at play size.
- **The words that are written, not generated:**
  - "The log goes on. You don’t."
  - "Everyone loses. How fair."
  - "Lightning never strikes twice. It didn’t need to."
  - Drab's "Somehow."
  - "You lost to Drab. Drab!"
- **The rival voices** hold across every key.
- **Sound.** One AudioContext, no node leaks after 400 cues, a master compressor that doesn't pump, music that follows the round and feels the danger.
- **Performance.**
  - One rAF loop, with nothing drawn on cards, naps or hidden tabs.
  - The occupancy grid and the lazy food placer.
  - Pooled, batched particles.
  - Cached sprites and colour ramps.
  - HUD writes only on change.
  - Typed-array scratch in the AI (most personas decide in 0.3 ms).
- **Layout** holds at 32 viewports from 320×480 to 2560×1600, and at 200% zoom: no sideways scroll, the board fully in view, the buttons reachable. The canvas backing matches the device pixels exactly at every size and density.

## After

Every high and medium finding above is fixed or adapted as planned; the seven refuted ones stay skipped. The lows are done too, except where a row says skip. "After" screenshots of every state are in `docs/screenshots/after-3/`.

### Frame times

The same tools on both builds (`tools/bench.js 20`, `tools/trace.js 8`), headless Chrome at 800×800 and 2× density, before and after runs alternating on one machine. "Before" is `0922499`: this pass's measuring tools on the pre-pass game. Full cost is script plus GPU, each batch closed by a pixel readback.

| | Before | After | Target |
|---|---|---|---|
| Long snakes, full cost per frame | 5.5–5.9 ms | 3.9 ms | ≤ 4 ms: **met** |
| Force fields, full cost per frame | 24.3–24.9 ms | 5.3 ms | ≤ 1.5× the same board without fields: **not met**, about 2.3× (it was 3.2–3.7×) |
| GPU per frame, long snakes / fields | 2.7–2.8 / 4.4 ms | 1.9 / 2.5 ms | |
| Paint, long-snake scene | 13–16 ms a second | 6 ms a second | |
| Watching at 1×: frames a second, p99 frame | 37–42, 4.5–5.5 ms | 57, 1.9–2.2 ms | |
| Watching at 4×: frames a second | 22–24 | 37 | |
| A new round's first frame | 53–63 ms (the bark rebuilt) | 12–18 ms (built in idle time) | no bark rebuild: **met** |
| One tick, every AI decision included (median / p99) | 1 / 2.8–3.1 ms | 0.8–1 / 2.5–3.3 ms | |
| Colour cache, a minute of fields in wind and storm | 2.9 → 5.9 MB retained | flat at 2.5–2.6 MB | flat: **met** |

What's left in the fields scene is mostly rivals' colour inside fields (about 1.7 ms, bound by how many circles it draws), the live seams (0.6 ms, kept live for their crackle) and ripples (0.35 ms). That's on a stress scene with a realm, three colonies and four 30-cell snakes; a typical round never gets there.

### Feel targets

| Target | Result |
|---|---|
| A power only when you ask | Held keys' repeats steer nothing, and a turn pressed twice within 180 ms is a turn (checked with real key events in headless Chrome) |
| The first knock really is free | The auto-turn picks the side with room, then the longest open run, then the one furthest from the edge (rules test) |
| You can always see why | Death cards name the reason ("You hit the edge at your smallest"); your leap's cooldown is an arc at your head; a press that can't leap thunks and shakes your badge |
| A calmer narrator | Watching AI rounds: one banner every 12.4 s (it was 10.6 s with this harness; 4.9 s in the audit's count, which included every repeat); playing: every 8.4 s (6.5 s); the golden apple once a round (it was three times) |
| No clicks | 0 of 51 cues leak a step from silence (25 of 564 renders did) |
| Small speakers | Through a 300 Hz high-pass your death is 7.1 dB louder than an apple at its loudest 100 ms (it was 3.1 dB quieter) |
| Memory stays flat | Two minutes watching at 4×: heap flat after GC; a minute of fields: flat |

### Played

In headless Chrome with real key and touch events: bursts of 2–4 presses inside a tick, 300 times (never a reversal into the neck, none queued); a nap pressed between a turn and its tick (the board holds, the turn goes on waking); a hidden tab (naps, stays napping); resizing through four windows mid-round (the backing follows at full density); a swipe on a phone (it steers, the page holds still); two minutes watching at 4× (no errors, heap flat); a board 80% full (30 ticks drawn, no errors); storage that throws (the game plays and the Hall of Fame opens). Every test suite passes, and seeded simulations give the same trace with and without thinking ahead.
