---
name: optimization-bar
description: "The owner's bar for optimizations is \"no noticeable loss\" (skill, character, feel), not bit-identical decisions; exactness is only the cheap way to verify"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-18T12:08:43.694Z
---

The owner (2026-10-18), on the dropped territory shortcut: a faster approximation that changes the playstyle but plays about as well "isn't necessarily a bad thing". They asked whether other optimizations had been dropped only because the outcome differed a little.

**The bar:** an optimization may change decisions if nothing noticeable is lost:
- **Skill:** a head-to-head, old and new AI in the same rounds on paired seats, comes out even; per-persona win rates within noise.
- **Character:** every trademark within noise (see [[next-round-ideas]]: Mason's straight runs, Mute's boxing, Joker's lures...).
- **Feel:** round length, deaths by cause, starving and crashes survived within noise.
- The same holds for visuals: a look-alike is fine, as long as nobody would see a difference.

Exact (fingerprint-identical) changes are the fast lane, checked in seconds. Approximate ones go through the slow lane: abtest on fresh seeds plus a head-to-head.

**Why the territory shortcut V1 still failed (not "a little"):** it played as well, but it dulled trademarks the same way on both seeds: Mute's boxing -28%, Joker's luring -24%, crashes survived -40%, rivals more timid. The cause is a blind spot: it can't see its own new body sealing gaps. The close variant (d3) passed skill and character but saved only 12-15% after the 2.4x exact win. Nothing else was dropped for differing; the other ideas were dropped for being no faster.

**How to apply:** judge every speed-up (AI, render, PR C's final pass) by skill, character and feel. Build the head-to-head (mixed old/new seats) into abtest for this.
