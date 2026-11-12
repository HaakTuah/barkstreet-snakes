## Play with friends (online)

Friends-only rooms, peer to peer, so it stays a static site with nothing to deploy and no accounts. This file holds
online play's general rules (their text as it was, with what was measured, is in `docs/archive/design-online.md`).
Elsewhere: what each move, rule and thing on the log sends is in its own topic file's "Online" (the powers and moves in
`40-powers-and-moves.md`, crashes in `41-crashes.md`, the woodpecker in `38-the-woodpecker.md`, beetles and burrows in
`04-food-and-the-world.md`, the lobby's line-up in "The rival line-up" in `39-the-rivals.md`, sound in `21-sound.md`);
a room on a newer version in `36-updating.md` ("Online"); the shared Hall of Fame in
`43-the-start-card-and-records.md`; how a friend's snake is outlined in "Telling you apart" in
`03-the-snake-as-a-character.md`; and friends drawn ahead from the host's plans in "Controls that keep up" in
`42-controls.md`.

### Hosting and joining

- **A room** holds up to four people (`MAX_PEOPLE`): the host and three friends; empty seats go to rivals. Its code is
  five characters with no look-alikes (no 0/O, 1/I/L: `CODE_CHARS` in `online.js`), sent as a link (`?join=`) or, from
  `file://`, as the code alone. A room is full at four, and a friend on another protocol version is turned away
  (`{t:'reject', why}`: `'full'` or `'version'`).
- **Connecting, on no single free service:** two ways introduce the browsers, and a room is on both at once.
  - **PeerJS** (from cdnjs with an integrity hash, loaded only when someone opens Play with friends) and its free
    public broker, tried first.
  - **Several public Nostr relays** at once (`net-relays.js`; five, of different operators, any one of which is
    enough), tried when the broker can't find the room or hasn't connected a friend within 4 s (`HEAD_START_MS`).
    They pass on four notes per friend under a topic shared by one in 4,096 codes: a handshake (SPAKE2, RFC 9382)
    that proves both sides know the code without showing it, then the browsers' WebRTC offer and answer, sealed
    (AES-GCM) with the key it agreed. Someone watching the relays learns nothing of a room's code; one who tries
    codes gets one guess a try, on the room itself, which takes one new handshake a second and leaves the relays after
    50 failed guesses (friends already in stay); one posing as rooms gets eight guesses from a joining friend at most. The curve, the signing Nostr asks for (BIP-340) and the handshake are the file's own code on the
    browser's crypto, nothing loaded.
    The room code and link are the same either way. A code the broker says is taken is replaced on both ways, so
    the relays, if they open the room first, wait up to those 4 s for the broker's word before the code is shown.
  - **The route:** STUN finds one for most networks; either way, the game then goes straight between the browsers.
    Strict networks need a relay (TURN). No free one asks for nothing: each needs an account, and its key or password
    would sit in the page (November 2026: Metered's Open Relay, ExpressTURN and Cloudflare's all need a signup), so
    it's left as a marked spot in `net.js`, for the owner to decide on (#709).
  - **Trying one way alone:** `?way=broker` or `?way=relays` in the page's address uses only that way, for checking
    each on a preview.
- **When it fails, the lobby says which part:** *finding each other* (neither the broker nor the relays answered,
  there's no room behind the code, or the room didn't answer) or *the route* (the room answered, but no network path
  let the browsers connect: try another network). A room counts as answered once the browsers start trying routes;
  a route that fails through the broker isn't tried again through the relays, whose route is the same. Of several
  failures, the lobby names the one that says most (`net.js`'s `explain` and `worst`).
- **The lobby** shows who's in, in their seat colours, and the rivals who'll take the empty seats (the line-up, its
  picker and the deck online: "The rival line-up" in `39-the-rivals.md`). Names are made unique (a friend called
  "Sniper" becomes "Sniper 2" in a round with the rival; two friends of one name, the second gets a 2). A friend who
  joins during a round watches it and plays from the next.
- **People get seat colors** (green, lemon, lavender, sky: `HUMAN_COLORS`; the host is green), each with its own
  marking on the body and in its dot (plain, spots, rings, dots: `MARKS` in `render/bodies.js`; lavender and sky look
  alike to many colour-blind players), and the same cream outline.

### What crosses the wire

- **The host's browser runs the game**, exactly the code that runs alone (`engine/`, the AIs, the chatter). Every tick
  it sends friends a compact picture of the board (`{t:'tick'}`: every snake's row, the food, the beetles underground,
  the holes, the woodpecker, the burrows, the fires, the sky and the tick's events; about 0.9 KB, so about 8 KB/s per
  friend), and where everyone goes next (`{t:'plan'}`) once its rivals have thought and again when a press changes it.
  A snake's row carries what the screens draw it from, its `memory` among them (a rival's home, colonies, mood, model,
  style, target and whether it's desperate: `MEMORY` in `online.js`, checked by `saneMemory`). It also sends the room
  (`lobby`), a new round (`round`, with its first tick), the countdown and Go (`phase`), each line of chatter (`say`),
  everyone's shared best rounds (`scores`), and that the room closed (`closed`).
- **Friends send back only their presses:** a key's turn (`{t:'turn'}`, it only steers), a fresh swipe
  (`{t:'swipe'}`: the host decides whether it's "ahead", against its own queue, which a friend can't see) and a power
  (`{t:'pow'}`: `'leap'`, `'flash'`, `'unleap'` and `'letgo'`, in `40-powers-and-moves.md`'s "Online"); and, besides,
  their hello (`hello`: their name, their player id, their best rounds and their version) and whether their page is out
  of sight (`away`, `back`). `net.js` adds its own: the host's `ping` every second and the friend's `pong`, and the
  friend's "still here" (`k`).
- **Fair, in keeping with the AI rule:** the rivals never know who's a person. Lag would favour the host, who has
  none. A friend sees each tick half a round trip late, and their turn takes another half to arrive, so the host's own
  turns wait **a full average round trip** (at most 150 ms, `HOST_DELAY_MAX`), in the order they were pressed.

### The protocol's rules

- **Protocol 22** (`VERSION` in `online.js`, whose comment lists every bump). A change to any message's shape bumps it;
  so does a change in meaning that both sides must play by (a rule, with no message changed). A drawing-only change,
  drawn by each screen from what it already has, needs none.
- **Everything from the network is checked and clamped** before it's stored or drawn: names, colours, dates and
  numbers; a row's kind exists and its cells are on the board. The renderer reads them every frame, so a malformed row
  could break every frame. `tools/online-test.js` feeds the guest malformed ones.
- **Rooms stay healthy:** each person's shared Hall of Fame rows are kept once, replaced when they rejoin and dropped
  when they leave, so messages stay far under PeerJS's 16 KB limit however often people come and go.

### The messages, typed

Types where a mismatched field between two players is hard to find by playing, without a rewrite or a build step.
`net.js` and `online.js` start with `// @ts-check` and describe every message as JSDoc types: the game's messages in
`online.js` (`HostMessage`, `GuestMessage`; the positional ones, a tick's rows and events, as unions of tuples narrowed
on their first element), the ping, pong and keepalive in `net.js`. What they see of the rest of the page (the engine's
game, snakes, food and events, just the fields `online.js` reads; PeerJS, just what `net.js` calls) is hand-written in
`types/globals.d.ts`; `engine/` and the rest stay unannotated. CI runs `tsc --noEmit -p jsconfig.json` with TypeScript
fetched in that step only (`scripts/test.sh types` runs it locally); nothing new is shipped. `tools/online-test.js`
also sends one of every kind of message through the wire on its own (a tick, plan or round encoded, decoded on a guest
and encoded again) and requires it back unchanged, and pins the shapes (each message's and each row's fields and their
types) with `version` in `tools/protocol-shapes.json`: shapes changed with the version not bumped fails, naming the
kinds; a bumped version needs the pin refreshed (`node tools/online-test.js --pin`); a bump with no shape change (a
change in meaning) is allowed. Its kinds must match the types, every message the game's code sends (with the fields its
object literal has) and every event the engine makes, so a new kind can't skip the types.

### On a friend's screen

- **It glides between ticks** with the same renderer, drawing everyone ahead from the host's plans ("Controls that keep
  up" in `42-controls.md`).
- **Every screen marks its own snake** with YOU (`16-the-first-seconds.md`). **Friends get their own arrow:** the
  bouncing arrow that says YOU over your head at the start also points out each friend, a touch smaller, with the name
  they picked in their colour, so you know at a glance who's who.
- **A friend's look:** a thinner, plainer outline than yours, and no halo ("Telling you apart" in
  `03-the-snake-as-a-character.md`); their seat colour and marking above.
- **Chatter is the host's,** passed on, so everyone sees the same lines; sound is each screen's own, from the events and
  bubbles it already gets (`21-sound.md`, "Online").

### Away and back

- **Never stalls:** a friend's browser says "still here" four times a second (`KEEPALIVE_MS`). After 0.75 s of silence
  (`AWAY_MS`) an AI steers their snake (Drab's, so a hiccup doesn't drive them into a wall), and any turn they send, or
  their messages coming again, hands it straight back; a banner appears only if the silence lasts 2 s
  (`AWAY_TOAST_MS`).
- **A friend who switches tabs says so at once** (`away`), and the AI steers until they turn again. The host's own
  snake gets the same stand-in while the host's tab is hidden.
- **The host's tab may be hidden:** browsers stop animation frames there, so a tiny worker clock keeps the round going.
- **Leaving:** if a friend leaves, the AI finishes their round, and their seat opens. If the host leaves, friends get a
  card saying so; if the connection drops, the card says that instead and offers to rejoin.

### What stays in step

- **Everything new works online** ("In a game played online, everything new works online" in
  `core/modules/game-design.md`). Each move or rule says what it sends in its own topic file (above); this file holds
  only the general rules.
- `tools/online-test.js` checks that a friend's board matches the host's on every tick of whole rounds, crossing every
  kind of event (staging any the rounds bring too few of), and two real browsers matched on every tick of whole rounds.
- **What changes online:** no napping, no countdown skipping, no watching speeds; your Hall of Fame and stats keep only
  your own result ("Only you" in `43-the-start-card-and-records.md`).
