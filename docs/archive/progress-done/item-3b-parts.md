# Progress: done

## Item 3b, done parts (moved 31 October 2026)

Word for word from item 3b in `docs/PROGRESS.md`.

The owner (29 October 2026), playing: "I am seeing copycat shy rotten apples twice now, that was within reach. Both were
next to the map edge." Copycat left an apple it could reach, beside the board's edge, until it rotted. Likely suspects:
its mimic weight (120) outweighing the pull of food, and the room and margin weights that count an edge cell against a
move. Copycat's part of 3b fixes it, and first checks with a census whether every rival does it: of the apples that
rot, how many were within a rival's reach, and how far each was from the edge. A competent snake takes a safe apple by
the wall ("Clever rivals, human reactions"); one it takes into a dead end doesn't count as safe.
*Checked in PR #142* (`docs/archive/studies/rotten-apples.js`, 150 rounds, seed 21): Copycat had been the worst, 0.20 apples
passed up (its head within 2) and left to rot a minute alive, 0.15 by the edge; with its copied habits and its pull to
mimic cut from 120 to 40, 0.13 and 0.09, mid-field. But every rival does it: 80% of the apples that rot lie on the edge
row or one in, and Sniper (0.19), Capricious, Mason and Mute pass up as many. A general edge-apple fix is noted below.

