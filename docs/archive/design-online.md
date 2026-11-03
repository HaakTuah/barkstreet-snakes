# Online play and the records, as they were decided: the design files' text

Online play's sections, and the start card's and the records', as the design files had them, word for word, with their
superseded versions and measurements. The current rules are in `docs/design/22-play-with-friends-online.md` (online
play) and `docs/design/43-the-start-card-and-records.md` (the start card, a rival's note, the Hall of Fame and stats,
names and carving); each move's own "Online" stays in its topic file (`docs/design/40-powers-and-moves.md`,
`docs/design/41-crashes.md`, `docs/design/38-the-woodpecker.md`, `docs/design/04-food-and-the-world.md`,
`docs/design/39-the-rivals.md`).

# Online play

## From play with friends (`22-play-with-friends-online.md`)

Friends-only rooms, peer to peer, so it stays a static site with nothing to deploy and no accounts.

- **The host's browser runs the game**, exactly the code that runs alone (`engine/`, the AIs, the chatter). Every tick it sends friends a compact picture of the board (about 0.9 KB, so about 8 KB/s per friend); friends send back only their presses: turns, fresh swipes and powers (`{t:'turn'}`, `{t:'swipe'}`, `{t:'pow'}` since round four; a swipe is its own message because only the host knows which way is "ahead" in its queue). Their screens glide between ticks with the same renderer (since round four's critique, drawing everyone ahead from the host's plans: see its Online). `tools/online-test.js` checks that a friend's board matches the host's on every tick, and two real browsers matched on every tick of whole rounds.
- **Fair, in keeping with the AI rule:** the rivals never know who's a person. Lag would favour the host, who has none. A friend sees each tick half a round trip late, and their turn takes another half to arrive, so the host's own turns wait **a full average round trip** (at most 150 ms), in the order they were pressed.
- **Never stalls:** a friend's browser says "still here" four times a second. After 0.75 s of silence an AI steers their snake (so a hiccup doesn't drive them into a wall), and any turn they send hands it straight back; a banner appears only if the silence lasts 2 s. **A friend who switches tabs says so at once**, and the AI steers until they turn again (a hidden tab's "still here" slows to once a second, which used to make the AI flicker on and off). The host's own snake gets the same stand-in while the host's tab is hidden. If a friend leaves, the AI finishes their round. If the host leaves, friends get a card saying so; if the connection drops, the card says that instead and offers to rejoin.
- **Rooms stay healthy:** each person's shared Hall of Fame rows are kept once, replaced when they rejoin and dropped when they leave, so messages stay far under PeerJS's 16 KB limit however often people come and go. Everything from the network is checked and clamped (names, colours, dates, numbers) before it's stored or drawn.
- **The host's tab may be hidden:** browsers stop animation frames there, so a tiny worker clock keeps the round going.
- **What changes online:** no napping, no countdown skipping, no watching speeds; your Hall of Fame and stats keep only your own result; chatter is the host's, passed on, so everyone sees the same lines.
- **Connecting:** PeerJS (from cdnjs with an integrity hash, loaded only when someone opens Play with friends) and its free public broker introduce the browsers; STUN finds a route for most networks. Strict ones need a relay (TURN), which needs a signup, so it's left as a marked spot in `net.js`.
- **A shared Hall of Fame** (your idea): on joining, each browser sends its own best rounds (up to 10, never AI rows), and the host passes everyone's on, so friends' rows appear in each other's tables in their seat colors, tagged "friend". Each browser also records every person's result in rounds played together. Every browser has a random player id (the friends you play with see it; a result claiming to be yours is never taken from a friend, so no one can pass for you) and every round an id, so a round is stored once, whoever recorded or shared it first (`tools/records-test.js`). Shared rows are kept once per person and checked like anything else from outside: names, colours, dates and numbers are cleaned, and only a person's own rows are passed on. **Only you**, your best and your stats count only your own rounds. AI results aren't kept for online rounds, or every table would fill with the host's rivals.
- **People get seat colors** (green, lemon, lavender, sky), each with its own marking on the body and in its dot (plain, spots, rings, dots: lavender and sky look alike to many colour-blind players), and the same cream outline, and names are made unique (a friend called "Sniper" becomes "Sniper 2" in a round with the rival).


**The messages, typed** (27 October 2026, the owner's call: types where a mismatched field between two players is hard to find by playing, without a rewrite or a build step). `net.js` and `online.js` start with `// @ts-check` and describe every message as JSDoc types: the game's messages in `online.js` (`HostMessage`, `GuestMessage`; the positional ones, a tick's rows and events, as unions of tuples narrowed on their first element), the ping, pong and keepalive in `net.js`. What they see of the rest of the page (the engine's game, snakes, food and events, just the fields `online.js` reads; PeerJS, just what `net.js` calls) is hand-written in `types/globals.d.ts`; `engine/` and the rest stay unannotated. CI runs `tsc --noEmit -p jsconfig.json` with TypeScript fetched in that step only (`scripts/test.sh types` runs it locally); nothing new is shipped. `tools/online-test.js` also sends one of every kind of message through the wire on its own (a tick, plan or round encoded, decoded on a guest and encoded again) and requires it back unchanged, and pins the shapes (each message's and each row's fields and their types) with `version` in `tools/protocol-shapes.json`: shapes changed with the version not bumped fails, naming the kinds; a bumped version needs the pin refreshed (`node tools/online-test.js --pin`); a bump with no shape change (a change in meaning) is allowed. Its kinds must match the types, every message the game's code sends (with the fields its object literal has) and every event the engine makes, so a new kind can't skip the types.

## From looks and lines (`19-looks-and-lines.md`)

- **Friends get their own arrow.** Online, the bouncing arrow that says YOU over your head at the start also points out each friend, a touch smaller, with the name they picked in their colour, so you know at a glance who's who (each screen shows its own YOU).

## From round four (`24-round-four-the-owners-feedback-and-the-calls.md`)

### Online

Protocol 7, and 8 after the critique:
- presses are three messages: a key's turn (`{t:'turn'}`, it only steers), a fresh swipe (`{t:'swipe'}`: the host decides whether it's "ahead", against its own queue, which a friend can't see) and a power (`{t:'pow'}`, jump or flash);
- each snake's flash rest and flash request, and plain flashes;
- beads' owner, and eating your own;
- holes under bodies;
- rot, saying whether it was an apple or a bead (and the bead's colour);
- the trickle of last apples, and where the first fell;
- whether a rival is desperate (the chatter voices it);
- (8) where everyone goes next, from the host once its rivals have thought and again when a press changes it: `{t:'plan', k, s: [[way, jump, flash], …]}`, so a friend's screen draws everyone ahead the way they're really going;
- (8) `'unleap'` among a friend's `{t:'pow'}` kinds: a jump a finger held still asked for, taken back (it turned out to be a swipe);
- (8) each snake's `mealMs`, how long its last meal keeps it, for the hunger bar.


## From round six A (`27-round-six-a-fairness-and-fixes.md`)

**On a friend's screen** (protocol 10, wave 2): each beetle's dig (`digUntil`); the beetles underground (`game.unders`: when each comes up, when it would fly off, where it went down, golden or not); digs, dives (and whether one was a dig), and knocks (the kind, from where to where, or nowhere when the bird ate it; golden; a bead's colour); from the promise on (5 moves before the strike), where the strike promised each piece would land (`w.landings`, the verify pass: a friend's rings are the host's promise; the list can grow as food comes into the mark, and it's sent whole every tick, so the critique's earlier promise needed no new protocol); the burrows as the engine keeps them (where, the tick each opened, when a beetle last used it, whether a dig left it), one a dig opened and one closing over. Each is checked before it's drawn: a kind that exists, cells on the board, a landing on the board or none, a burrow on the board and opened on a tick (until the verify pass a burrow row needed only to be numbers), a promised landing a cell and a cell or none. online-test crosses each, staging any the rounds bring too few of, and feeds the guest malformed ones; on seeds 1 and 4 the guest matched the host every tick (seed 1's three rounds held 21 digs, 31 knocks and 9 burrows closing over; since the verify pass's engine fixes, 18, 12 and 9, with the promised landings crossing on 4 ticks, and staged in the last round when the rounds bring fewer than 3; at round six A's finish, with fewer beetles and the promise made earlier, 19, 19 and 3, and every kind of event crosses at least 3 times, the rarer ones staged).

# The start card and the records

## From the round's arc (`12-the-rounds-arc.md`)

**The Hall of Fame ranks by place, then time alive, then food** (your call). Food stops appearing at 2:00 (since round four, all but the last apples, and since round six A, beetles still come out), so food eaten mostly measures how early you died; time alive measures how well you played. The rank on your death card already counts the snakes still alive (they'll all finish ahead of you), so it's the rank the round-over card will show.

## From the owner's playtest (`32-the-owners-playtest.md`)

### A rival's note

**The cause:** a click on a tag put the rival's line in the card's own paragraph, in italics, and put the card's words back 3.2 s later, though the game was napping. The line wasn't where the eye goes from the tag, and only the italics changed, so finding it took most of a second and left about two to read. A rival's line runs 8–14 words, 21–27 with what it holds; at 200 words a minute one rival in 18 fits in 3.2 s. The same handler did nothing on your death's card or while watching (it gave up whenever the round was running, and the round goes on behind your death's card), and in the countdown the next beat wiped it after 180 ms.

**The call: the line is the rival's note, and it stays until you're done with it.**
- On any card that's up (napping, your death's, the round's end, the start), a click, a tap or Enter on a rival's name opens its note in place of the card's words: a slip of darker parchment edged in its colour, its dot and name, how it plays, and what it holds now in smaller type, kept live (the round goes on behind your death's card; "Out of this round." once it's out). Your own tag gives your powers, or "You’re out of this round."
- It stays until you act: its tag again, another tag (which swaps it), its ×, Esc (before anything else Esc does: Esc again wakes, or keeps watching, as ever), a click or tap anywhere but a button, a field or a tag, or the card going. A new card brings its own words.
- Its tag wears a cream ring while its note is up, its name tells a screen reader so (`aria-expanded`), and the note is read out as it opens. Esc or its × give focus back to the name, where Enter opens it again rather than asking to start over.
- Watching with no card up (after you're out, or Watch AIs): a banner edged in the rival's colour, up as long as it takes to find and read: 1 s and 55 ms a character (about 200 words a minute), 3.5 to 9 s. Its level, `asked`, comes up at once (you asked for it): every other banner waits its turn behind it, and the one it interrupted goes back to the front of the line (until "Teaching by showing", round news pushed it off). It stays on the board on a phone held upright too: three lines of it over the title row would cover the tags.
- While you play, in the countdown and in the lobby, a tag shows nothing (your eyes belong on the log); a desktop's tooltip still does.
- On a small board (380 px or less: a phone on its side, a laptop's short window) the note also stands in for the start card's row of names, the new best's badge and the carve (unless you're typing in it), and on the smallest (300 px) for the card's links too; they come back with its words. (At first only the smallest let the badge and the carve go: on a 316 px board a note on a first good round's card slid the carve under Play again, and a finger dragging the card to reach it closed the note.) The phones work's edge-to-edge boards are a little bigger than 380 on most phones, so there the note stands in for the start card's roll-call up to 403 px (2 px), and for the badge and the carve up to 455 (on a 390 px phone's 382 px board a note on your death's card made it scroll 27 px, on a 412's 404, 5; on the round's card, whose words say more, 25 at 422 and 7 at 440), held upright or on its side (see "The cards, by the board" below).
- *Turned down:* a longer timer, or one by the line's length (the game's napping: any timer takes the words from someone still reading; the banner has one only because the round moves on); a popover by the tag (on a desktop it covers the other tags and the chatter, on a phone the board and the card); closing it on any key (P, Enter, R, H, M and N all mean something already); notes while you play or in the countdown.
