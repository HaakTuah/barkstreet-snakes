# Progress: done

## Item 5, its done parts (moved 31 October 2026)

Word for word from item 5 in `docs/PROGRESS.md`.

*Done so far:* **the island hop** and **no auto-jump** (PR #158: a jump goes over up to 3 cells, a cell a tick; a press waits 5 moves; the landing ring; protocol 16); **mushrooms come back up** (part 3b, PR #195: the cheek, the ring 3 ahead, the spit, a shade stronger each time to 5; the rivals aim, dodge and eat one for a shot in their styles; protocol 19; its numbers and the design finding in the design's "Part 3b, the chosen numbers").

- **The island hop comes first.** The owner: "jumping is pretty critical to making this game more tense and skill based, rather than RNG". There are two test cases:
  - Gobbler folded on a strip;
  - `docs/handoff/owner-sniper-islands.jpg`: Sniper won coiled on a strip, beside islands of beads across gaps of 1 to 3 cells.
- **No auto-jump** (the owner agreed). A press stays armed until a hurdle 4–5 cells ahead is reached (`LEAP_WINDOW` is 3 ticks today), for rivals too. The landing ring shows where you'd land, and it gives no trap warnings.

- **Bridges:** as in DESIGN. Crawl on where the body crosses the rim, or land on it from a jump where it will still be there.
- The earlier start on jumps is `docs/handoff/jumps-wip-unverified.patch` (on f338275). It's unverified; redo it or check it first.

3. **The flashes cut** (the edge shelters a body from cuts, measured for a refuge: "The edge is a shelter, measured"): the plain flash through a body one thick, the golden through two (and fire out), and a cut
   that leaves a snake fewer than 3 segments puts it out ("The neck cut"; a flash into a head is a failed flash);
   your own beads squashed as your head passes, the choke, cough and nudge gone ("Choking on your own tail", replaced by
   the owner, in `docs/design/27-round-six-a-fairness-and-fixes.md`); and **mushrooms come back up**: aimed by steering,
   spat 3 cells ahead after a second in the cheek, a hit on a head poisoning that snake, a shade stronger each time (3
   to 5), never killing by itself ("Mushrooms come back up" in the design); a failed flash
   costs 5 and a longer stun, its rest 10 to 12 s; **dropping your own tail** by the same cut; and **Mason's double
   walls**, since a wall one thick can now be cut (its straight runs measured before and after).
   *Done* (PR #183): the cuts (plain, golden through two, the neck cut, your own tail), a failed flash (5 and a stun
   of 6), the rest at 12 s, your own beads squashed, Mason's double walls, and the edge measured (no refuge); its
   numbers are in the design's "Part 3, the chosen numbers". *Next:* **mushrooms come back up**, in its own PR (3b),
   before part 4.


