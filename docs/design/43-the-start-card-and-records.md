## The start card and the records

The start card and its line-up, a rival's note from its tag on any card, the Hall of Fame and Your story, and your name
and carving it. They get a file of their own because no topic file held them: `33-one-screen.md` holds the cards'
layout, `09-voice-and-copy.md` their words and `39-the-rivals.md` who is dealt, and the records' rules were spread
over the round's arc, online play and the owner's playtest (their text as it was, with what was measured, is in
`docs/archive/design-online.md`). Elsewhere: how rivals are dealt from the deck and chosen seat by seat, alone and
online ("The rival line-up" in `39-the-rivals.md`); the cards by the board's size ("The cards, by the board" in
`33-one-screen.md`) and the Field guide's door ("The Field guide's own door" in `30-teaching-by-showing.md`); every
card's words (the start prompt, the death titles, the new best, round over and the Hall of Fame's rows in
`09-voice-and-copy.md`); the start card's "New: …" line (`36-updating.md`); and the keys on a card ("Small mercies at
the keys" in `42-controls.md`).

### The start card

- **What it holds** (`ready()` in `game/screen.js`): the prompt ("Ready, Green?", by your name) and its intro line,
  or "New: …" after an update (`09-voice-and-copy.md`, `36-updating.md`); the line-up as a row of the rivals' names;
  Play and Watch rivals; How to play and Play with friends; and the keys' hint, or the touch hints ("Controls anyone
  can guess" in `42-controls.md`).
- **The seats and the deck:** each seat is a button that opens the rivals' picker, a chosen seat wears a ring and a
  pin, and "Any" seats are dealt from the deck ("The rival line-up" in `39-the-rivals.md`, which is the one place for
  how).
- **The death card and the round's card** (your death's, and the round's end): their layout in "The cards, by the
  board" in `33-one-screen.md`, their words in `09-voice-and-copy.md` (Death titles, Round over, New best), and why a
  crash was the end in `41-crashes.md`. The carve and the new best's badge are on them (below).

### A rival's note

**The line is the rival's note, and it stays until you're done with it.**
- On any card that's up (napping, your death's, the round's end, the start), a click, a tap or Enter on a rival's name
  opens its note in place of the card's words: a slip of darker parchment edged in its colour, its dot and name, how
  it plays, and what it holds now in smaller type, kept live (the round goes on behind your death's card; "Out of this
  round." once it's out). Your own tag gives your powers, or "You’re out of this round."
- It stays until you act: its tag again, another tag (which swaps it), its ×, Esc (before anything else Esc does: Esc
  again wakes, or keeps watching, as ever), a click or tap anywhere but a button, a field or a tag, or the card going.
  A new card brings its own words.
- Its tag wears a cream ring while its note is up, its name tells a screen reader so (`aria-expanded`), and the note is
  read out as it opens. Esc or its × give focus back to the name, where Enter opens it again rather than asking to
  start over.
- Watching with no card up (after you're out, or Watch AIs): a banner edged in the rival's colour, up as long as it
  takes to find and read: 1 s and 55 ms a character (about 200 words a minute), 3.5 to 9 s. Its level, `asked`, comes
  up at once (you asked for it): every other banner waits its turn behind it, and the one it interrupted goes back to
  the front of the line. It stays on the board on a phone held upright too: three lines of it over the title row would
  cover the tags.
- While you play, in the countdown and in the lobby, a tag shows nothing (your eyes belong on the log); a desktop's
  tooltip still does.
- On a small board (380 px or less: a phone on its side, a laptop's short window) the note also stands in for the start
  card's row of names, the new best's badge and the carve (unless you're typing in it), and on the smallest (300 px)
  for the card's links too; they come back with its words. On the phones' edge-to-edge boards it stands in for the
  start card's roll-call up to 403 px, and for the badge and the carve up to 455, held upright or on its side ("The
  cards, by the board" in `33-one-screen.md`).
- *Turned down:* a longer timer, or one by the line's length (the game's napping: any timer takes the words from
  someone still reading; the banner has one only because the round moves on); a popover by the tag (on a desktop it
  covers the other tags and the chatter, on a phone the board and the card); closing it on any key (P, Enter, R, H, M
  and N all mean something already); notes while you play or in the countdown.

### The Hall of Fame

- **Kept in this browser only** (`records.js`; `snake-highscores`), every access wrapped and everything read back
  checked; a browser that won't keep anything keeps the session's rounds and says so.
- **Two lists:** everyone's top 10 (`MAX_SCORES`), the rivals' rows among them, and **Only you**, your own top 10. The
  stored list is both, so the rivals can't push all of your rounds out.
- **Who gets a row:** you, every round; the rivals, when the round finishes (a round you abandon leaves no trace of
  theirs); watched AI-only rounds too, marked as watched, but never in your stats. A row of a round with any chosen
  rival is marked "chosen" ("The rival line-up" in `39-the-rivals.md`); a friend's is tagged "friend", in their seat
  colour. A rival that was renamed keeps its rows and kills (Hunter is Sniper: `09-voice-and-copy.md`).

### The Hall of Fame ranks by place, then time alive, then food

The owner's call. A better place first (a win beats a shared first), then the longer time alive, then more food, then
the older row (`compare` in `records.js`). From 2:00 food stops appearing but for the last apples and the beetles, so
food eaten mostly measures how early you died; time alive measures how well you played. The rank on your death card
already counts the snakes still alive (they'll all finish ahead of you; online, only the people, whose rows are
kept), so it's the rank the round-over card will show.

### Your story

Your stats (`snake-stats`): rounds played, wins and draws, how often you finished in each place, food eaten, and what
killed you, with your nemesis, whatever got you most often. **Best** (`snake-best`) is the most food you ate in a round.
Only your own rounds count, never a watched one.

### A shared Hall of Fame

The owner's idea. On joining, each browser sends its own best rounds (its own top 10, never a rival's or a friend's
rows), and the host passes everyone's on (the newcomer gets everyone's, everyone else the newcomer's), so friends' rows
appear in each other's tables in their seat colours, tagged "friend". Each browser also records every person's result
in rounds played together. Every browser has a random player id (`snake-player`; the friends you play with see it; a
result claiming to be yours is never taken from a friend, so no one can pass for you) and every round an id, so a round
is stored once, whoever recorded or shared it first (`tools/records-test.js`). Shared rows are kept once per person
("Rooms stay healthy" in `22-play-with-friends-online.md`) and checked like anything else from outside: names,
colours, dates and numbers are cleaned, and only a person's own rows, at most ten, are passed on.

### Only you

Your best and your stats count only your own rounds. Rivals' results aren't kept for online rounds, or every table
would fill with the host's rivals.

### Names and carving

- **Your name** (`snake-name`) is **Green** until you carve one (`DEFAULT_NAME`); the snakes call you by it
  (`09-voice-and-copy.md`). Every name, typed, stored or a friend's, goes through one cleaner (`cleanName` in
  `records.js`): control and text-direction characters dropped, single spaces, at most 16 whole characters
  (`MAX_NAME`: never half an emoji). Online, names are made unique ("Hosting and joining" in
  `22-play-with-friends-online.md`).
- **The carve** is offered on your death's card or the round's, once a round ("Small mercies at the keys" in
  `42-controls.md`), when the round is in the Hall of Fame's top three, or is a new best in its top 10 ("Hall of Fame
  #2. Carve your name:"), or is a new best at the top of your own list ("Top of your own list."). Named already, the
  card says "Hall of Fame #4, as Perry." instead. Carving puts the name on this round's row and on all your unnamed
  ones.
