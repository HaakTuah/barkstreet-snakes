// The game controller (see game/core.js): a round, from its start to its
// end, and the sounds of what happens in it.

// ---------------------------------------------------------- the round

// humans: the people in this round, [{ name, color }] (online); alone it's you,
// or nobody when watching the AIs.
// personas: the rivals by key (else dealt: see dealLineUp; a friend's are
// the host's); chosen: whether any of them were chosen, not dealt.
function newGame({ personas, aiOnly = false, humans = null, chosen = false } = {}) {
  const people = humans || (aiOnly ? [] : [{ name: localName(), color: PLAYER_COLOR }]);
  // Rivals dealt to a round nobody played (a start card left for friends, say)
  // go back on top of the deck: dealing again, they're the ones dealt.
  const unplayed = theGame && !theGame.spent ? theGame.dealt || [] : [];
  if (!personas) Records.undeal(SnakeAI.POOL, unplayed);
  const dealt = personas ? null : dealLineUp(Math.max(0, TUNE.OPPONENTS + 1 - people.length));
  theGame = Engine.createGame({ personas: personas || dealt.keys, humans: people });
  theGame.chosen = dealt ? dealt.chosen : !!chosen;
  const keys = theGame.snakes.filter(s => s.persona).map(s => s.personaKey);
  if (personas) Records.undeal(SnakeAI.POOL, unplayed.filter(k => !keys.includes(k)));
  theGame.dealt = dealt ? dealt.fresh : unplayed.filter(k => keys.includes(k));
  markYou(false);
  youHideAt = 0;
  acc = 0;
  tickLen = Engine.tickMs(theGame);
  drawAlpha = 1;
  thinkQueue = guesting() ? [] : theGame.snakes.filter(s => s.persona);
  freezeUntil = 0;
  pendingCard = null;
  Render.setGame(theGame);
  Render.setViewer(player()?.id ?? -1); // your snake gets the bright outline
  leadAt = leadWanted();
  Sound.weather('none');
  streak = 0;
  Chatter.reset(theGame);
  hideToast();
  buildTags();
  buildOpponents();
  updateHud(true);
  dirty = true;
}

// A round's rivals, seat by seat: the ones you chose on the start card (see
// openPicker), and the "Any" seats dealt from this browser's deck, every
// rival before any comes round again (Records.deal). Online, it's the host's
// choice and deck.
function dealLineUp(want) {
  const pool = SnakeAI.POOL, seats = Records.seats(pool).slice(0, want), mine = seats.filter(Boolean);
  const fresh = Records.deal(pool, want - mine.length, mine), next = [...fresh];
  return { keys: Array.from({ length: want }, (_, i) => seats[i] || next.shift()), fresh, chosen: mine.length > 0 };
}

// Closing the page on a start card: its rivals weren't met, so they go back
// in the deck, somewhere among the ones not yet dealt (not on top: opening
// the game again gives a fresh cast).
window.addEventListener('pagehide', () => {
  if (theGame && !theGame.spent) Records.undeal(SnakeAI.POOL, theGame.dealt || [], { anywhere: true });
  if (hosting() && online.lineup) Records.undeal(SnakeAI.POOL, online.lineup.fresh, { anywhere: true }); // (the lobby's, likewise)
});

// Start a round in the given mode. The round on the start card is used as-is;
// anything else gets a fresh one.
function start({ aiOnly = !theGame.withPlayer, going = false } = {}) {
  if (state === 'lobby' && !hosting()) return; // the lobby's own buttons decide
  if (online) {
    // Online, the host starts every round; friends wait for it.
    if (hosting() && (state === 'lobby' || state === 'over')) startOnlineRound();
    return;
  }
  if (state !== 'ready' || aiOnly !== !theGame.withPlayer) newGame({ aiOnly, personas: state === 'ready' ? lineUp(aiOnly) : null, chosen: state === 'ready' && theGame.chosen });
  waking = false;
  speed = watchSpeed = 1; // every round starts at normal speed (watching, you can speed it up again)
  state = 'countdown';
  theGame.spent = true; // (its rivals were met: see newGame)
  beatsLeft = 3;
  beatTimer = 0;
  theGame.rivalsLine = pick(theGame.withPlayer ? FLAVOR.rivals : FLAVOR.spectators);
  askingStartOver = false;
  updateControls();
  buildOpponents(); // (the start card's seats are buttons no longer)
  if (!going) beat(); // (going: an arrow on the start card, straight to Go, no '3' knocked over it)
}

function beat() {
  if (beatsLeft === 0) return go();
  if (hosting()) online.room.broadcast({ t: 'phase', s: 'countdown', beat: beatsLeft });
  showBeat(beatsLeft);
  beatsLeft--;
  beatTimer = TUNE.COUNTDOWN_BEAT;
}

// Online the countdown can't be skipped (everyone starts together).
const BEAT = [
  { transform: 'scale(2.6) rotate(-8deg)', opacity: 0 },
  { transform: 'scale(0.86) rotate(3deg)', opacity: 1, offset: 0.55 },
  { transform: 'scale(1.08) rotate(-1deg)', offset: 0.8 },
  { transform: 'scale(1) rotate(0)' },
];
function showBeat(n) {
  if (waking) { // (back from a nap: the board in view, undimmed, and a word at the top)
    hideCard();
    Sound.play('beat');
    return toast(FLAVOR.wakeBeat, TUNE.COUNTDOWN_BEAT + 120, 'go', 'round', { quiet: true });
  }
  markYou(playerAlive());
  Sound.play('beat');
  if (n === 1 && !waking) Sound.play('riser', { crest: TUNE.COUNTDOWN_BEAT / 1000 }); // (rising into Go!, and topping out on it; waking is no fanfare)
  showCard({ title: String(n), text: waking ? '' : theGame.rivalsLine, primary: online ? null : 'Go!', opponents: !waking, quiet: true, beat: true });
  if (!reducedMQ.matches) cardTitle.animate?.(BEAT, { duration: 480, easing: 'ease-out' }); // each number slams down
}

function go() {
  if (waking) { // (back from a nap: no fanfare, just going again)
    waking = false;
    state = 'running';
    hideCard();
    hideToast(true);
    if (napToast) { const { text, kind, level, opts, rest } = napToast; napToast = null; if (text) toast(text, 2800, kind, level, opts); for (const w of rest) toast(w.text, w.ms, w.kind, w.level, w.opts); } // (in turn, after the beat's fade and a breather)
    lastFrame = 0; // (acc as it was: the board carries on from the very moment it stopped)
    updateControls();
    return;
  }
  if (hosting()) online.room.broadcast({ t: 'phase', s: 'go' });
  if (guesting()) online.lastTickAt = performance.now();
  theGame.went = true; // (the round has had its Go: a nap from here on wakes through one quiet beat)
  if (document.activeElement?.closest?.('button') && !document.activeElement.closest('#overlay, #records, #picker')) document.activeElement.blur(); // (Space jumps again: a header button Tabbed to last round lets go)
  state = 'running';
  hideCard();
  markYou(playerAlive());
  youHideAt = performance.now() + TUNE.YOU_MS;
  Sound.play('go');
  if (guesting() && online.seat < 0) toast(FLAVOR.watchingFirst, 3000);
  else if (touchFirst && theGame.withPlayer && !powersTold && (!helpEl.getClientRects().length || helpEl.getBoundingClientRect().bottom > innerHeight + 0.5)) { powersTold = true; toast(FLAVOR.powersFirst, 3000, 'you', 'lesson'); } // (the help under the board isn't shown, or isn't wholly on the screen; how to steer is beside YOU. A lesson's banner, not Go!'s big one: it fits, and keeps out of the heads' way)
  else toast(pick(theGame.withPlayer && online?.seat !== -1 ? FLAVOR.go : FLAVOR.goWatch), 1300, 'go');
  flashFrame('go');
  acc = 0;
  lastFrame = 0;
  updateControls();
  say(theGame.withPlayer ? 'Go.' : 'And they’re off.');
}

function pause() {
  if (state !== 'running' || online) return; // no napping online: the round goes on for everyone
  if (pendingCard && !playerAlive()) return; // (your death's card is on its way: it comes up as it would, not under a nap)
  state = 'paused';
  waking = false;
  napToast = { text: !toastEl.hidden && !toastEl.classList.contains('leaving') && toastKind !== 'go' && toastLevel !== 'asked' ? bannerText : '', kind: toastKind, level: toastLevel, opts: toastOpts, rest: waiting.slice() }; // (the banner showing and those waiting, back on waking, each for its whole time)
  napOver = !overlay.classList.contains('hidden') && shownCard?.reward ? shownCard : null; // your death card: back on waking
  Chatter.clearBubbles();
  showCard({
    title: 'Napping', text: `${pick(FLAVOR.pause)} ${FLAVOR.wake}`,
    primary: 'Wake up', secondary: touchFirst ? 'Start over' : null, focusCard: true, how: 'Field guide',
  });
  updateControls();
}

// Start over? (Enter or R while you're alive in a round): napping, with the
// card itself focused (not a button), so the same key again confirms; P,
// Escape or an arrow keeps going, at once (you were playing a moment ago).
let askingStartOver = false, napToast = null;
let startOverFromNap = false;
function askStartOver(key) {
  startOverFromNap = state === 'paused';
  if (state === 'running') pause();
  if (state !== 'paused') return;
  askingStartOver = true;
  showCard({ title: FLAVOR.startOver, text: FLAVOR.startOverText(key), primary: 'Start over', secondary: 'Keep going', actions: { primary: () => start(), secondary: () => resume() } });
  overlay.querySelector('.card').focus({ preventScroll: true });
}

// Waking: back through one countdown beat (a direction key skips it, and
// steers), so your hand has time to get back to the keys. Over your death
// card, straight back to it.
function resume() {
  if (state !== 'paused') return;
  const quick = (askingStartOver && !startOverFromNap) || !playerAlive(); // (keeping going after a "Start over?" that interrupted play, or only watching: no beat)
  askingStartOver = false;
  say(FLAVOR.awake);
  if (napOver) {
    state = 'running';
    showCard({ ...napOver, quiet: true });
    napOver = null;
    lastFrame = 0;
    updateControls();
    return;
  }
  if (quick && theGame.went) {
    state = 'running';
    hideCard();
    lastFrame = 0;
    updateControls();
    return;
  }
  state = 'countdown';
  beatsLeft = 1;
  beatTimer = 0;
  waking = !!theGame.went; // (napped before its Go: the countdown's last beat, then the real Go, chime, banner and all)
  lastFrame = 0;
  updateControls();
  beat();
}

function youDied() {
  const p = player();
  const titles = FLAVOR.deathTitle;
  const title = p.killer === 'hunger' ? 'Starved!' : p.fatal === 'boom' || /blew up/.test(p.cause) ? pick(titles.boom)
    : p.fatal === 'pecked' ? pick(titles.pecked) : p.fatal === 'cut' ? pick(titles.cut) : p.cause === 'fell into a woodpecker hole' ? 'Down the hole!'
    : pick(p.killer === 'fire' ? titles.fire : p.killer === 'wall' ? titles.wall : p.killer === 'self' ? titles.self : p.cause.startsWith('crashed') ? titles.headOn : titles.rival);
  pendingCard = {
    title,
    text: `${howYouDied(p)} · ${Records.ordinal(theGame.result.place)} place · score ${p.eaten}`,
    flavor: killLine(p), primary: 'Play again', secondary: 'Keep watching', reward: true,
    ...(!online && guideFor(p)), // (what got you, in the Field guide)
    ...(online && { primary: 'Keep watching', secondary: hosting() ? 'Close room' : 'Leave room', actions: { primary: hideCard, secondary: leaveRoom } }),
  };
  updateControls();
}

// A death card's way into the Field guide: the row about what got you.
function guideFor(p) {
  const [howRow, name] = p.killer === 'hunger' ? ['basic-hunger', 'Hunger']
    : p.fatal === 'boom' || /blew up/.test(p.cause) || p.fatal === 'cut' ? ['leaf', 'Golden leaf']
    : p.fatal === 'pecked' || /woodpecker hole/.test(p.cause) ? ['hole', 'Holes']
    : p.killer === 'fire' ? ['fire', 'Fire'] : ['basic-crash', 'Crashes'];
  return { how: `Field guide: ${name}`, howRow };
}

function endRound() {
  state = 'over';
  Chatter.clearBubbles(true); // (the last words of the snake that ended it stay, where the log can't show them: the card waits for them)
  flushAiResults();
  const survivors = theGame.snakes.filter(s => s.alive);
  const winner = survivors[0];
  const title = !winner ? 'Draw' : isMe(winner) ? 'You win!' : `${winner.name} wins`;
  const flavor = !winner ? pick(FLAVOR.draw) : isMe(winner) ? pick(FLAVOR.win) : winner.persona ? pick(winner.persona.win) : pick(FLAVOR.friendWin);
  if (isMe(winner)) Sound.play(theGame.newBest ? 'winBest' : 'win'); // (a win that's a new best: one fanfare, not two on top of each other)
  if (winner) { Render.celebrate(isMe(winner) ? null : winner); flashFrame('win', isMe(winner)); } // confetti: all over for you, from its head for anyone else
  const me = player();
  const r = theGame.result;
  const how = me && !me.alive && me.cause ? howYouDied(me) : '';
  const yours = !me || !r ? ''
    : r.won ? `Won in ${Records.clock(r.survived)} · score ${me.eaten}`
    : r.draw ? `${how ? `${how} · shared 1st` : 'You shared 1st'} · lasted ${Records.clock(r.survived)} · score ${me.eaten}`
    : `${how ? `${how} · ${Records.ordinal(r.place)} place` : `You finished ${Records.ordinal(r.place)}`} · lasted ${Records.clock(r.survived)} · score ${me.eaten}`;
  if (online) {
    if (hosting()) sendLobby(); // (the next round's line-up, for everyone's card)
    pendingCard = hosting()
      ? { title, flavor, text: yours, reward: !!me, primary: 'Play again', secondary: 'Close room', lobby: { players: true },
        actions: { primary: startOnlineRound, secondary: leaveRoom } }
      : { title, flavor, text: yours, reward: !!me, primary: null, secondary: 'Leave room', lobby: { players: true, status: FLAVOR.waiting(online.hostName, true) },
        actions: { secondary: leaveRoom } };
  } else pendingCard = theGame.withPlayer
    ? { title, flavor, reward: true, primary: 'Play again', secondary: 'Watch AIs', text: yours, ...(how && guideFor(me)) } // (it says how you died, so it names what got you too: when your death ended the round, it's your death's card)
    : { title, flavor, primary: 'Play', secondary: 'Watch again' };
  cardAt = lastFrame + TUNE.ROUND_END_PAUSE;
  updateControls();
}

// A snake's result is known as soon as its placement is. Yours is saved at
// once; the AIs' are saved when the round actually finishes, so a round you
// abandon leaves no trace. Watched rounds count too, marked as watched.
function finishSnake(s, { place, won = false, draw = false }) {
  if (s.result) return;
  s.result = { place, won, draw, eaten: s.eaten, survived: theGame.time };
  // Online, everyone's result goes in everyone's Hall of Fame (the round id keeps it once).
  if (online && s.isPlayer && !isMe(s) && s.owner) Records.recordFriend({ ...s.result, chosen: theGame.chosen }, { name: s.name, color: s.color, owner: s.owner, round: theGame.roundId });
  if (!isMe(s)) return;
  const before = best;
  theGame.result = s.result;
  theGame.entryId = Records.recordPlayer({ ...s.result, chosen: theGame.chosen, killer: s.alive ? null : s.fatal === 'pecked' ? 'woodpecker' : s.killer, round: theGame.roundId });
  if (s.eaten > best) { best = s.eaten; Records.setBest(best); bestEl.textContent = best; }
  theGame.newBest = s.eaten > before && before > 0; // (a first round's score is a best by default: nothing to celebrate yet)
}

// (Online, only your own result is kept: the rivals' places are the host's game.)
function flushAiResults() {
  if (online) return;
  for (const s of theGame.snakes) {
    if (s.isPlayer || !s.result || s.result.saved) continue;
    Records.addScore({ ...s.result, name: s.name, color: s.color, ai: true, watched: !theGame.withPlayer, chosen: theGame.chosen });
    s.result.saved = true;
  }
}

// Flavor for the death card: the killer's own line, if an AI got you (the
// card's fact line already says why).
function killLine(p) {
  const killer = theGame.snakes.find(s => s !== p && s.name === p.killer);
  if (killer && !killer.alive) return pick(FLAVOR.bothOut); // (out in the same crash: no gloating from the pieces)
  if (killer?.persona) return pick(killer.persona.kill);
  if (killer) return pick(FLAVOR.friendKill);
  if (p.fatal === 'boom' || /blew up/.test(p.cause)) return pick(FLAVOR.boom);
  if (p.fatal === 'pecked') return pick(FLAVOR.pecked);
  if (/woodpecker hole/.test(p.cause)) return pick(FLAVOR.hole);
  if (p.killer === 'hunger') return pick(FLAVOR.starved);
  if (p.killer === 'fire') return pick(FLAVOR.fire);
  return pick(p.killer === 'self' ? FLAVOR.self : FLAVOR.wall); // (the card's fact line already says why: boxed in, or at your smallest)
}

// ------------------------------------------------------- sounds, banners

// Sounds come from where they happen on the board, a little left or right.
const at = x => ({ pan: ((x + 0.5) / GRID_SIZE * 2 - 1) * 0.8 });
// A rival's bubble: a burble in its own voice, quieter the tighter it is for
// you (SnakeAudio's babble keeps it from ever distracting). Your own snake's
// lines, and a friend's online, stay silent: they have no voice of their own.
Chatter.onBubble((s, text) => {
  if (isMe(s) || !s.persona || !s.body?.length) return;
  Sound.play('babble', { voice: s.personaKey, chars: text.length, tight: state === 'running' ? dangerNow : 0, ...at(s.body[0].x) });
});
// The sound of each thing you eat (anything else is an apple).
const EAT_CUES = { goldcap: 'wrap', golden: 'golden', leaf: 'leaf', pellet: 'meat', mushroom: 'mushroom', beetle: 'crunch' };
// Apples eaten in quick succession climb a scale: a streak you can hear.
let streak = 0, streakAt = -1e9;
// The snake whose head is nearest a cell (the one a beetle there is fleeing, as the engine reckons it).
function cornering(x, y) {
  let near = null, gap = Infinity;
  for (const s of theGame.snakes) {
    if (!s.alive) continue;
    const d = Math.abs(s.body[0].x - x) + Math.abs(s.body[0].y - y);
    if (d < gap) { gap = d; near = s; }
  }
  return near;
}
// The woodpecker's own sounds, on the drawing's clock (the tick and how far
// through it the board is drawn, a friend's screen too, from the synced
// aim): its drum starts on its first blow, so each knock is a blow you see
// and the last lands on the strike (one table, Audio.drumBlows, for both;
// asked a moment ahead, so it's placed on the audio clock where the blow
// is drawn, and started late, the knocks already past are left out); and
// its "kik!" as it settles back on its perch after a strike, when the
// drawing has it land (R.birdHome). Watched faster, both come faster.
let drumDue = -1, drumGame = null, kikAt = -1, kikGame = null;
function birdSounds() {
  const w = theGame?.woodpecker;
  if (!w || state !== 'running') return;
  const ms = Engine.tickMs(theGame), rate = ms / tickLen, tp = theGame.tick - 1 + drawAlpha;
  if (w.target.length) {
    if (drumDue === w.strikeAt && drumGame === theGame) return;
    const blows = Sound.drumBlows(w.pecks || 0), long = blows[blows.length - 1];
    const to = (w.strikeAt - tp) * ms - long; // (board ms to its first blow)
    if (to > 40 * rate) return;
    drumDue = w.strikeAt; drumGame = theGame;
    if (-to < long) Sound.play('drum', { strike: w.pecks || 0, rate, delay: Math.max(0, to) / rate / 1000, from: Math.max(0, -to), ...at(w.x) });
  } else if (w.struckAt >= 0 && !(kikAt === w.struckAt && kikGame === theGame)) {
    const since = (tp - w.struckAt) * ms, home = Render.birdHome();
    if (since < home) return;
    kikAt = w.struckAt; kikGame = theGame;
    if (since - home < 250 * rate) Sound.play('call', { settle: true, ...at(w.x) });
  }
}
function sounds(dying, wasAlive) {
  const me = player();
  let knocked = false;
  const fed = []; // (rivals' meals: heard after yours, so theirs give way to it)
  for (const e of theGame.events) {
    if (e.type === 'eat' && isMe(e.snake)) {
      if (e.kind !== 'mushroom') { streak = theGame.time - streakAt < 2600 ? Math.min(streak + 1, 7) : 0; streakAt = theGame.time; }
      Sound.play(EAT_CUES[e.kind] || 'eat', { streak: e.kind === 'mushroom' ? 0 : streak, gold: !!e.gold, ...at(e.x) });
      bump(scoreEl);
    } else if (e.type === 'eat' && e.kind === 'goldcap') Sound.play('wrap', { rival: true, ...at(e.x) }); // (someone else's golden mushroom: softer, further off)
    else if (e.type === 'eat') fed.push(e);
    else if (e.type === 'woodpecker') { Sound.play('call'); Sound.play('riser'); }
    else if (e.type === 'aim') Sound.play('aim', at(e.x));
    else if (e.type === 'peck' && e.cells?.length) Sound.play('crash', at(e.x)); // (its drum came first, blow by blow: see birdSounds)
    else if (e.type === 'spawn' && e.kind === 'beetle') Sound.play('beetle', at(e.x));
    else if (e.type === 'starving' && isMe(e.snake)) Sound.play('hungry');
    else if (e.type === 'charge') Sound.play('crackle', at(e.x));
    else if (e.type === 'strike') Sound.play('thunder', at(e.x));
    else if (e.type === 'gust') Sound.play('gust');
    else if (e.type === 'burrow' && !e.dug) Sound.play('burrow', at(e.x)); // (cracked open; one a dig left was bored, not cracked open: the bore said it)
    else if (e.type === 'heal') Sound.play('heal', at(e.x)); // (one closing over: a muffled crumble)
    else if ((e.type === 'dive' && !e.dug) || e.type === 'emerge') Sound.play('scrabble', at(e.x)); // (down a burrow, or up out of one; one that dug in was heard boring in)
    else if (e.type === 'dig') Sound.play('dig', { rival: !isMe(cornering(e.x, e.y)), ...at(e.x) }); // (the bore: whose head it fled, yours, or a rival's, softer and further off)
    else if (e.type === 'knock' && e.tx != null && !knocked) { knocked = true; Sound.play('knock', { volume: 0.5, land: (Render.knockFlight?.(e.x, e.y, e.tx, e.ty) ?? 320) / 1000, ...at(e.x) }); } // (food flying off the patch: the world's, quiet, once a strike, at the first piece that flies, landing as it's drawn landing; none for what the bird ate)
    else if (e.type === 'knock' && e.tx == null && e.kind === 'beetle') Sound.play('crunch', { rival: true, ...at(e.x) }); // (round six B, 2m: the bird's gulp, a beetle's crunch as softly as a rival's, where it was)
    else if (e.type === 'rainbow') Sound.play('rainbow', at(e.x));
    else if (e.type === 'weather' && e.kind === 'rain') Sound.play('rain');
    else if (e.type === 'weather' && e.kind === 'snow') Sound.play('snow');
    else if (e.type === 'ember') Sound.play('ember', at(e.x));
    else if (e.type === 'crash') { Sound.play(isMe(e.snake) ? (e.failed ? 'bigBonk' : 'bonk') : 'bonked', at(e.x)); if (isMe(e.snake) && youHideAt) { youHideAt = 0; markYou(false); } } // (YOU makes room for the -1 and the stars)
    else if (e.type === 'alight') Sound.play('alight', { rival: !isMe(e.snake), ...at(e.snake.body[0].x) });
    else if (e.type === 'singe' && isMe(e.snake)) Sound.play('singe');
    else if (e.type === 'baked') Sound.play('bake', at(e.x));
    else if (e.type === 'ash') Sound.play('ash', at(e.x));
    else if (e.type === 'cut') Sound.play('snip', at(e.x));
    else if (e.type === 'spit') { // (a mushroom come back up: the gag, "ptoo" and its landing; hit, the poison's own cue for the one it hit)
      Sound.play('choke', { rival: !isMe(e.snake), ...at(e.x) });
      if (e.hit >= 0 && isMe(theGame.snakes[e.hit])) Sound.play('mushroom', at(e.tx));
    }
    else if (e.type === 'squash') { // (your own bead, squashed)
      Sound.play('squash', { rival: !isMe(e.snake), ...at(e.x) });
      if (isMe(e.snake)) streakAt = -1e9; // (no meal: the apples' scale starts again)
    }
    else if (e.type === 'leap') Sound.play('leap', { rival: !isMe(e.snake), gold: !!e.gold, ...at(e.x) });
    else if (e.type === 'dash') Sound.play(e.plain ? 'flash' : 'dash', { rival: !isMe(e.snake), ...at(e.x) }); // (a plain flash, or a golden one)
    else if (e.type === 'lastApples') Sound.play('lastApples');
    else if (e.type === 'douse') Sound.play('douse', at(e.x));
    else if (e.type === 'fizzle' && isMe(e.snake)) { Sound.play('thunk', at(e.snake.body[0].x)); (e.flash ? e.snake.tag?.flash : e.snake.tag?.jump)?.animate?.(reducedMQ.matches ? REFUSED : NUDGE, { duration: reducedMQ.matches ? 420 : 260, easing: 'ease-out' }); } // (pressed, and it couldn't go: you hear it, and its chip shakes its head; with reduced motion it flashes)
  }
  // A rival feeding: its own chomp for what it ate, softer and further off,
  // from where it ate, never with the streak's climb (that's yours); one at a
  // time, giving way to yours (Audio's CHOMPS).
  for (const e of fed) Sound.play(EAT_CUES[e.kind] || 'eat', { rival: true, gold: !!e.gold, ...at(e.x) });
  for (const s of dying) if (/blew up/.test(s.cause)) Sound.play('boom', at(s.body[0].x));
  for (const s of dying) {
    if (isMe(s)) continue;
    // You took them out: a knockout punch. Anyone else: a far-off thud.
    Sound.play(me && s.killerId === me.id && s.killer !== 'self' ? 'ko' : 'rivalDeath', at(s.body[0].x));
    flashFrame('kill');
  }
  if (wasAlive && !playerAlive()) Sound.play('death');
  // A near miss: your head right next to a rival's.
  if (me?.alive) {
    const h = me.body[0];
    for (const o of theGame.snakes) if (o !== me && o.alive && Math.abs(o.body[0].x - h.x) <= 1 && Math.abs(o.body[0].y - h.y) <= 1) { Sound.play('close', at(o.body[0].x)); break; }
  }
  // Crossing a rival's border (into Sovereign's realm, a colony): a drum
  // knock, and the first time in a round, a word on whose land it is.
  // (Land is one rule everywhere: within radius + LAND_REACH of the middle.)
  if (me?.alive) {
    const h = me.body[0];
    const onLand = f => Math.hypot(h.x - f.x, h.y - f.y) <= f.radius + TUNE.LAND_REACH;
    let inside = null;
    for (const o of theGame.snakes) {
      if (o === me || !o.alive) continue;
      if (o.memory.home && onLand(o.memory.home)) inside = { o, home: true };
      for (const c of o.memory.colonies || []) if (onLand(c)) inside ||= { o, home: false };
    }
    if (inside && !onField) {
      Sound.play('field', at(h.x));
      if (!theGame.toldField && state === 'running') { theGame.toldField = true; toast(FLAVOR.field[inside.home ? 'home' : 'colony'](inside.o.name), 2400, 'warn'); }
    }
    onField = !!inside;
  }
  Sound.weather(state === 'running' ? theGame.weather?.kind : 'none');
}
let onField = false;

// How much danger you're in, for the music: a rival's head close to yours,
// or little room ahead. 0..1.
function dangerOf() {
  const me = player();
  if (!me?.alive || !theGame) return 0;
  const h = me.body[0];
  let near = 99;
  for (const o of theGame.snakes) if (o !== me && o.alive) near = Math.min(near, Math.abs(o.body[0].x - h.x) + Math.abs(o.body[0].y - h.y));
  let danger = near <= 1 ? 1 : near <= 4 ? (5 - near) / 4 : 0;
  // Room ahead: how many of the next three cells straight on are open.
  let open = 0;
  for (let i = 1; i <= 3; i++) {
    const x = h.x + me.dir.x * i, y = h.y + me.dir.y * i;
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE || theGame.holes.has(y * GRID_SIZE + x)) break;
    if (theGame.snakes.some(o => o.alive && o.body.some(c => c.x === x && c.y === y))) break;
    open++;
  }
  if (open === 0) danger = Math.max(danger, 0.85); else if (open === 1) danger = Math.max(danger, 0.5);
  return danger;
}
