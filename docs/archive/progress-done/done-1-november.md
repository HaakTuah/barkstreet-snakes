# Progress: done

## Done, 1 November 2026

### 2y. Rivals take landings, then the flight and leap now measured again (the owner, 2 November 2026; an AI entry) — done, PR #373 (the flight still even: question #399)

Part 4 merges as it stands (#363; the owner: "But what they have for now can be merged, I'd like to play it myself.").
The flight's worth is dodging a contested landing and leap now's is cutting a flier off, so both look flat while the
rivals seldom go for a landing (the owner: "I suspect the enemy AI might be the big problem. jumps are risky because
someone can cut you off, and insta kill you, by being where you land. but if the enemies don't do this, then landing
wherever doesn't matter so much."). About a day, in order: (0) the held flight always flies the full 5 cells,
steerable, never cut short, a quick press still the plain golden hop ("The golden jump flies" in
`docs/design/29-round-six-b-the-new-moves.md`; cue, lesson and Field guide row with it; online in step); (1) measure, per round, how often a rival goes for a landing
(steps or flashes into a landing ring, or leaps now to cut a flier off) and how often a jumper steers away from a
contested one; (2) the rivals take landings when it pays, each in its style (Sniper most, Desperado for the thrill, Drab
hardly ever), planned from the visible ring, never by reaction ("Clever rivals, human reactions"); (3) the flight and
leap now measured both ways again, and per use, leap now included ("Every new move is tested both ways"). If they pay,
done; if still flat, the PR says so as a design finding.

### 2w. Beetles get away at least a third of the time (the owner, 31 October 2026; an engine-rules entry, after part 4) — done, PR #313 (Review: engine rules · Claude · Codex P1×2, clean; design check 7, 8, 10)

The escape band moves from 20–35% to at least a third (33–45%): measured on `develop` once part 4's flight is in, and the beetles' side tuned if it falls short, never the rivals made worse. Spec: `docs/handoff/queue-specs.md`, "2w. Beetles get away at least a third of the time".

### 2s+. The log's fall, proven (1 November 2026; the weekly blind re-review of PR #289) — done, PR #311 (Review: engine rules · Claude · design check 8, 9, 10; Codex P1×2, clean)

The blind re-review ("Reviews", point 5, in `docs/claude-and-codex.md`) scored #289 a 7: three blocking points it
passed with, each a miss. (1) A rules test that the woodpecker aims small (`PECK_FALL_SOFT`) and still takes a big piece
when nothing smaller is left. (2) An online round trip that carries a non-empty `fall` (`online.js`; the pinned shapes
hold only the empty one). (3) The case where a head is on a piece cut loose on the last tries: tested, or said in the
design ("The log stays one piece"). Not blocking, fixed in the same PR: food and beetles on a falling piece tip away
with it (and a beetle gets the bird-eats cue); `pieceFalls` cleared between rounds; the sim's dead island-crumb counters
(`tools/sim/01-census.js`, `03-report.js`) removed; a render or UI check for the shade and the lesson. The flight's A/B
on the new log is part 4's.

### 2s. A piece cut loose falls: the log stays one piece (30 October 2026, rewritten 31 October 2026; an engine-rules entry) — done, PR #289 (its measures in `docs/design/27-round-six-a-fairness-and-fixes.md`, "The log stays one piece")

No more islands (the owner, 31 October 2026: "Yes, I think that's it. can still be jumpable gaps, but we want to avoid the islands stuff. it becomes too much rng, and isn't very exciting."): any piece of log no longer attached to the log falls away, warned, so the log is always one piece with holes in it, and jumps and flights cross the gaps inside it. Replaces "every island stays a hop from another". Spec: `docs/handoff/queue-specs.md`, "2s. A piece cut loose falls".

### 2y+. Split `ai.js` and `engine.js` by meaning (the owner, 2 November 2026; the main lane, right after 2y, before part 5) — done, PRs #406 (the tools load the game's files from `index.html`), #408 (`ai/`), #407 (`engine/`)

Both have grown past the mark (148 KB and 136 KB) and every main-lane entry touches them, so the gap "between AI
entries" never came. Each is split by meaning in a PR of its own (the rivals' shared template, each rival's override,
planning, and so on for `ai.js`; the rules by system for `engine.js`), proven unchanged by the fingerprints and the
suites, so it goes quickly and needs no head-to-head. Part 5's branch (#202) then merges the split in once.

