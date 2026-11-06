# Progress: done

## The polish lane, done (moved 31 October 2026)

Word for word from "The polish lane" in `docs/PROGRESS.md`.

- **The README, done** (PR #241; the owner, 31 October 2026: "Yes, expertly to both!"): `README.md` is for players, up to
  the game as it plays now; the developer part is in `docs/developing.md`. From here every entry keeps it current ("A
  change a player sees updates the README" in `CLAUDE.md`); 2v adds the update between rounds when it merges.
- **Next, any key wakes from a nap** (the owner, 31 October 2026: "Space should also pause and unpause on Barkstreet Snakes." Told that Space is the jump: "Ahh, true! yeah, really any button should unpause, no?" Then, to the design session's shape of it: "Yes, please! Expertly!"): as the Pause row of "Voice and copy" (`docs/design/09-voice-and-copy.md`) now says. Any playing key, or a tap on the board on touch, wakes; the waking press never fires a power (a steering key wakes and steers, as it always has: "A power only when you ask"); G, H, M, N, V and the speed keys keep their jobs; the card says "Any key to wake up" / "Tap to wake up"; the help line, the Field guide and the README to match. Online: a nap is local only as now. A rules or input test both ways: Space wakes without a jump, G opens the Field guide and the game stays napping.

- The housekeeping (PR #222): done entries and done parts' detail moved to `docs/archive/progress-done/`; this file
  is now about 33 KB, all of it open entries, kept word for word.
- The open entries' specs moved word for word to `docs/handoff/queue-specs.md` by the design session (31 October
  2026); each entry here keeps its title, a line and a pointer, and this file is now about 12 KB.
- The Voices switch's icon (PR #224): a head speaking, no longer the header's sound speaker.
- Your lesson fades once you're out (PR #231): "Crashes cost tail. You're at 3…" and the hunger warning no longer stay up after you're out.
- The Hall of Fame's "Clear everything" (PR #230): shown only once something is kept (a row, a round in your story, a Best).
- "AIs" read as "Als" in the round font (PR #229): "Watch AIs" is "Watch rivals" (start and round-over cards), and the lobby says "Empty seats go to rivals" and "A rival, unless a friend joins".
- The start card's tip says what both taps do (PR #242): "Tap names to swap, tags to see how they play." (it named only the tags, right under the names that swap).
- The Field guide's Beetles row split in two (PR #244): Beetles, and Burrows after it, the same words (it was eleven lines on a phone).
- A start card whose names wrap fits a small board (PR #234): at 320 px upright or 568 px sideways its tip goes, then its lines sit closer, so the buttons never cover a name.
- Score and Best step aside under a banner above the board, on a phone held upright (PR #232; the audit's first find).
- The woodpecker flies under a card that's up, no longer across its title (PR #243; the audit's third find).
- *Left as it is, by the owner's answer:* the woodpecker over the help line between rounds (the audit's second find; PR #240 closed). On a 390 px phone it may cover part of the help line or the chatter's words; nothing essential is hidden, it moves often and taps pass through it ("Clear of the row's words (2k+)" in `docs/design/32-the-owners-playtest.md`). Not to be raised again.
- *Not reproduced:* bubbles overlapping at 4× (the audit's fourth find). In 8 watched phone rounds and 3 desktop rounds at 4×, the longest overlap was 0.4 s on the phone and 0.19 s on desktop, only while bubbles glide to a new side. Dropping the older bubble after 0.25 s of overlap made no measurable difference, so nothing was merged.
- The squash lesson (PR #250): "Your own beads feed nobody.", no longer "Squashed! Your own tail feeds nobody." (it opened with a rival's death title, and called the beads tail; the Field guide's Beads row says beads).
- *Measured, nothing to fix:* sound piling up while watching (PR #248, `docs/archive/studies/sound-levels.js`). At 4× the round asks for about 10 cues a second and the gaps let 4.5 through, at most 5 in any 250 ms; rivals' chomps 2 a second, the babble one every 4 s at most. Same shape at 1× and 2×, halved. The chatter's words were scanned too: no typos, apostrophes consistent.
- *As designed:* the empty chatter-log line (the audit's sixth find): it's a new line's 0.4 s slide-in (`log-in`) caught mid-fade. Over 3 watched rounds on a phone on its side, 23 of 621 visible-row samples caught one, and none stayed empty. No fix.
- The tail-drop lesson only in a real pocket, not when you've coiled with room to crawl out after your tail (PR #246; the audit's fifth find).
- The screenshot tour runs through again (PR #252): `tools/shots.js`'s staged knock-flight stopped at food the bird eats (the engine's knock list gives it nowhere to go); it skips that piece, as the engine does.
- Any key wakes from a nap (PR #271): Space, the flash keys, Enter, P or Esc wake without a power, an arrow wakes and steers, a tap on the board or the card wakes on touch; G, H, M, N, V and the speed keys keep their jobs. The card says "Any key to wake up" / "Tap to wake up".
- **Done in the lane's entries:** the README for players (PR #241) and any key wakes from a nap (PR #271): their words are in `docs/archive/progress-done/polish-lane.md`, "The polish lane, done".
- **The woodpecker bigger on a phone, done** (PR #270; the owner picked B, and answered for a phone on its side): see "The woodpecker, as big as it gets", *Bigger on a phone*, in `docs/design/32-the-owners-playtest.md`.
- **Done: the flash became the dash** (PR #304; the owner, 1 November 2026: "dash is better actually"): the key help,
  the lessons, banners, the Field guide, the HUD, Star's chatter (English and Chinese), the README and "One word for
  each thing"; words only, the fingerprints unchanged.
- The room card on a phone (PR #256): its seats as names in a row, as the start card's, each rival's "unless a friend joins" left to the card's own words; it fits a 320 px phone upright (it ran 117 px under its buttons), and on a 568x320 one sideways it scrolls 84 px, not 234.
- The friends card's Join on a small phone on its side (PR #272): at 568x320 it ran 15 px off the card's edge; its row is a little tighter there.

Moved from "The polish lane" in `docs/PROGRESS.md` (2 November 2026, the file-by-file review), word for word; the
owner's three notes of 2 November merged as PRs #322 (the remains), #320 (the flags) and #321 (the spit's tell):

- **First, the housekeeping:** done (PR #222, and the design session's move of the open entries' specs to
  `docs/handoff/queue-specs.md`, 31 October 2026); merged branches now go by GitHub's "Automatically delete head
  branches", and the older ones went by the "Delete merged branches" button in Actions (31 October 2026). Then archive leftovers nobody uses.
- **Next, from the owner's notes of 2 November** (his words: `docs/archive/instructions.md`), one PR each: **every
  snake's remains match the body they came from** ("Remains" in `docs/design/04-food-and-the-world.md`): The owner saw it
  on Star, but `beadOf` in `render/food.js` has three faults. A dead snake's beads take their pattern by bead count, not
  by the segment they came from, so every patterned rival's comes out squeezed (Wildcard, Joker, Sniper, Vulture,
  Desperado, Mason, Colonist); Star's and Copycat's beads go round six fixed hues from red, while their bodies show a
  running, fading rainbow; and crash drops and cut tails carry only the base colour. Each bead takes the fill and mark
  its segment had at that moment; **flags fall with the log** when a gap opens under them, as the piece does,
  instead of jumping (food's own fall is entry 6's A/B); and **the spit's tell**: the cheek's bulge counts down to the
  spit, so a player sees when it comes (where it flies is 3b+'s dotted line).

- The room card's seats two by two on a phone (PR #347): at 390 and 360 px upright and 844x390 on its side they wrapped
  three and one, the last rival alone on its row; a 16-letter name ran past their box at 320 px, now ending in "…".

