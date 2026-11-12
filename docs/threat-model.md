# The threat model: Barkstreet Snakes

What this game adds to the floor's threat model (`core/floor/threat-model.md`), which is part of it; a security review
reads both. Rules cited: `SECURITY.md`'s, whose numbers are the floor's.

- **Who, besides:** anyone who joins an online game with a room code, or sends a shared record or a link.
- **Players:** their browsers and their saved records: code run in a browser (`SECURITY.md`, rules 5 to 7), records
  wiped or forged, or an online game stalled or taken over (`SECURITY.md`, rules 5 and 7).
- **The ways in, besides:** online peers' messages, notes on the public relays that introduce them, shared records, URL
  parameters and room codes (`SECURITY.md`, rule 5).
- **What the relays see:** which of 4,096 topics a room uses, and handshakes that say nothing of its code; the
  browsers' addresses go only inside notes sealed with the key the handshake agreed. Nothing seen there can be
  searched offline for the code: one who tries codes gets one guess a try against the room itself, which answers one
  newcomer a second and leaves the relays after 50 failed guesses, so a code is found one time in about 140 at
  most. Someone flooding a room's topic, or answering friends' handshakes as fake rooms, can keep the relays busy or
  make the room leave them, so that friends join through the broker only; friends already in stay. That is all.
- **Lower stakes:** the floor's slowdown or crash from input someone else shaped includes one reached by another player
  online. Cheating against the rivals in a single-player game is not a security matter.
