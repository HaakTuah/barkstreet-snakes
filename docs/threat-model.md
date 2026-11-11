# The threat model: Barkstreet Snakes

What this game adds to the floor's threat model (`core/floor/threat-model.md`), which is part of it; a security review
reads both. Rules cited: `SECURITY.md`'s, whose numbers are the floor's.

- **Who, besides:** anyone who joins an online game with a room code, or sends a shared record or a link.
- **Players:** their browsers and their saved records: code run in a browser (`SECURITY.md`, rules 5 to 7), records
  wiped or forged, or an online game stalled or taken over (`SECURITY.md`, rules 5 and 7).
- **The ways in, besides:** online peers' messages, shared records, URL parameters and room codes (`SECURITY.md`,
  rule 5).
- **Lower stakes:** the floor's slowdown or crash from input someone else shaped includes one reached by another player
  online. Cheating against the rivals in a single-player game is not a security matter.
