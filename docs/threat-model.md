# The threat model: Barkstreet Snakes

Who might attack this repository and its site, what they want, and where they could get in. Codex's security review
reads this file as its threat model (its settings point here, so it is not made anew for every review); the rules
that close each way in are in `SECURITY.md`, whose rule numbers this file cites.

- **Everything is public:** every file, its whole history, every PR, issue, comment and workflow run. So an attacker
  reads the code, the workflows and these rules before trying anything: no defence may rest on not being known, and
  every rule must hold against someone who has read it. Anything committed is public for good, even if a later commit
  removes it; a secret that lands is leaked, and the only fix is to rotate it.
- **Who:** anyone on the internet. They write issues and comments, open PRs from forks, join an online game with a room
  code, send a shared record or a link, publish a package or action this repository uses, or plant text on a page a
  builder or Codex reads.
- **What they want:** the owner's tokens and accounts, through a workflow, a PR's checks or work handed to Codex
  (rules 1 to 4); a push to `main` or the site (rules 2 and 3); code run in a player's browser (rules 5 to 7); a
  player's saved records wiped or forged, or an online game stalled or taken over (rules 5 and 7).
- **The ways in:** online peers' messages, shared records, URL parameters and room codes (rule 5); the workflows and
  what triggers them (rule 2); dependencies and actions (rules 2 and 10); outsiders' text reaching an agent (rule 4).
- **Lower stakes:** a slowdown or crash confined to one player's own tab, from input only that player chose, is Low;
  the same reached by another player online is not. Cheating against the rivals in a single-player game is not a
  security matter.
