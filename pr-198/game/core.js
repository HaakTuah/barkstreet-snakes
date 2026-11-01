// The game controller: the loop, input, the cards and the HUD. The rules live
// in engine.js, the drawing in render/, and every feel number in tuning.js.
//
// Once snake.js, it is split into the files of game/, by what they do. Like
// render/ (see render/core.js), they are plain scripts sharing one scope,
// loaded in order by index.html (sw.js lists them too): each sees every name
// the others declare, so names must differ from render/'s and the browser's
// (tools/scope-test.js checks), and what runs as a file loads may use only
// names from itself or the files before it (a listener's body runs later).
//
//   core.js     the page's elements, words, the game's state and the loop
//   round.js    a round: starting, ticking, ending; and its sounds
//   banners.js  the banners for a round's big moments, and the cards
//   hud.js      the scoreboard and the tags
//   input.js    keys, touch and swipes, and the buttons
//   friends.js  the Hall of Fame, and playing with friends online
//   screen.js   size and motion, the dev overlay, and the start

const TUNE = window.TUNING;
const Engine = window.SnakeEngine;
const { GRID: GRID_SIZE, PLAYER_COLOR, PERSONAS: CAST, DIRS } = Engine;
const Render = window.SnakeRender;
const Records = window.SnakeRecords;
const Chatter = window.SnakeChatter;
const Sound = window.SnakeAudio;
const Online = window.SnakeOnline;
const Net = window.SnakeNet;

// --------------------------------------------------------------- the DOM

const $ = id => document.getElementById(id);
const canvasEl = $('game'), boardEl = document.querySelector('.board'), mainEl = document.querySelector('main'), glowEl = $('frame-glow');
const scoreEl = $('score'), bestEl = $('best'), tagsEl = $('scoreboard');
const overlay = $('overlay'), cardTitle = $('overlay-title'), cardText = $('overlay-text');
const flavorEl = $('overlay-flavor'), badgeEl = $('overlay-badge'), opponentsEl = $('opponents');
const nameRow = $('name-row'), nameRank = $('name-rank'), nameInput = $('name-input');
const startBtn = $('start'), watchBtn = $('watch');
const toastEl = $('toast'), speedEl = $('speed'), announcer = $('announcer'), hintEl = $('hint'), helpEl = $('help');
const pauseBtn = $('pause'), muteBtn = $('mute'), musicBtn = $('music'), voicesBtn = $('voices-toggle'), chatterBtn = $('chatter-toggle'), chatlogEl = $('chatlog');
const recordsEl = $('records'), recordsBody = $('records-body'), resetBtn = $('records-reset');
const recordsTabs = [...document.querySelectorAll('#records .tab[data-tab]')];
const filterEl = $('scores-filter'), filterTabs = [...filterEl.querySelectorAll('.tab')];
const howBtn = $('how'), cardLinks = $('card-links'), friendsBtn = $('friends'), lobbyEl = $('lobby'), lobbyName = $('lobby-name'), lobbyShare = $('lobby-share');
const lobbyLink = $('lobby-link'), lobbyCopy = $('lobby-copy'), lobbyPlayers = $('lobby-players');
const lobbyJoin = $('lobby-join'), lobbyCode = $('lobby-code'), lobbyStatus = $('lobby-status');

const touchFirst = matchMedia('(pointer: coarse)').matches;
const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);
const DEV = params.has('debug') || params.has('perf');

// ----------------------------------------------------------------- words

// A line from a list, never the one it gave last time (a single line is just itself).
const lastPicked = new WeakMap();
const pick = list => {
  if (!Array.isArray(list)) return list;
  if (list.length < 2) return list[0];
  let line;
  do line = list[Math.floor(Math.random() * list.length)]; while (line === lastPicked.get(list));
  lastPicked.set(list, line);
  return line;
};
const inWords = n => ['none', 'one', 'two', 'three', 'four', 'five'][n] ?? String(n);
const FLAVOR = {
  intro: 'Three rivals. One mossy log. Last snake wriggling wins.',
  // (The arrows first: anyone knows them. A click is the mouse's left button on the board. A first-timer's
  // Hall of Fame is empty: the Field guide's key, G, is in its place before a first round, both under the board.)
  hintStart: 'Arrow keys steer (or WASD) · Space or click jumps · E, Shift or right-click flashes · P naps · Enter starts · G opens the Field guide',
  hintKeys: 'Arrow keys steer (or WASD) · Space or click jumps · E, Shift or right-click flashes · P or Esc naps, any key wakes · Enter starts over · H opens the Hall of Fame · G opens the Field guide · M mutes · N toggles the music · V the voices',
  hintOnline: 'Arrow keys steer (or WASD) · Space or click jumps · E, Shift or right-click flashes · M mutes · N toggles the music · V the voices',
  hintOnlineTouch: 'Swipe to steer · Tap to jump · Swipe ahead to flash',
  hintTouch: 'Swipe to steer · Tap to jump · Swipe ahead to flash · Tap ⏸ to nap',
  // Watching (Watch AIs, or after you're out): nothing of yours to steer.
  hintWatch: '1, 2, 4 set the speed · P naps, any key wakes · Enter plays · H opens the Hall of Fame · G opens the Field guide · M mutes · N toggles the music · V the voices',
  hintWatchTouch: 'The speed buttons set 1×, 2× or 4× · Tap ⏸ to nap',
  rivals: ['Your rivals today:', 'Up on the log with you:', 'Sharing your bark:'],
  spectators: ['Tonight on the bark:', 'In the ring today:', 'Place your bets:'],
  go: ['Slither!', 'Off you go.', 'Mind the edges.'],
  goWatch: ['And they’re off.', 'Off they slither.', 'Let the wriggling begin.'],
  pause: ['Snakes need rest too.', 'Curled up in a warm patch of bark.', 'The log will wait.'],
  wake: touchFirst ? 'Tap to wake up.' : 'Any key to wake up.',
  // (Bonk! is for a knock you survive, Snip! for a cut you survive: a
  // death's title is a word that means out.)
  deathTitle: { boom: ['Kaboom!', 'Ka-blam!'], wall: ['Flattened!', 'Splintered!'], self: ['Tangled!', 'Knotted!'], rival: ['Squashed!', 'Splat!'], headOn: ['Out cold!', 'Lights out!'], fire: ['Toasted!', 'Scorched!'], cut: ['Sliced!', 'Chopped!'], pecked: ['Pecked!', 'Drilled!'] }, // (never the card's own verb again: "Head-on! You crashed head-on…")
  wall: ['The log goes on. You don’t.', 'That edge came out of nowhere.', 'Even logs have edges.'],
  self: ['Of all the snakes to bite.', 'You were in your own way.', 'You can’t outrun yourself.'],
  boom: ['A golden flash needs somewhere to go.', 'Full speed, no brakes.', 'Golden, briefly.'],
  hole: ['The woodpecker sends its regards.', 'Mind the gap.', 'The woodpecker missed you. Its hole didn’t.'],
  pecked: ['The woodpecker didn’t miss.', 'Rat-a-tat. That was you.'],
  starved: ['Should have eaten something.', 'Hunger always wins in the end.', 'All slither, no snacks.'],
  fire: ['Too hot to handle.', 'You found the fire. The hard way.', 'Lightning never strikes twice. It didn’t need to.', 'Burned to a crisp. A small crisp.'],
  // The weather, as it turns (no banner when it clears).
  weather: {
    sun: ['Golden hour: golden apples are ripening.', 'The sun’s out. Golden apples love it.'],
    wind: ['The wind’s up. Apples are falling.', 'A blustery spell: windfall apples.'],
    rain: ['Rain. The mushrooms are sprouting.', 'Here comes the rain. Mushrooms love it.'],
    storm: ['A storm’s brewing. Watch for the crackle.', 'Thunder on the bark. Lightning strikes where it crackles.'],
    snow: ['Winter. Less food, and you’ll get hungry faster.', 'Snow on the bark. Lean times: eat while you can.'],
  },
  // (A line that talks to "you", when you're not in the round: the same news, for everyone.)
  weatherWatch: { snow: ['Winter. Less food, and everyone gets hungry faster.', 'Snow on the bark. Lean times for everyone.'] },
  strike: ['Lightning! The bark’s on fire.', 'Crack! Fire on the bark.'],
  rainbow: ['A rainbow! And at its foot, something golden.', 'After the rain, a rainbow. Follow it to the gold.'],
  rainbowWatch: ['A rainbow! And at its foot, something golden.', 'After the rain, a rainbow. Gold at its foot.'],
  win: ['King of the log.', 'Last snake wriggling.', 'You outlasted them all.', 'The whole log is yours. For now.'],
  draw: ['Nobody made it out.', 'Everyone loses. How fair.', 'A dead heat. Emphasis on dead.'],
  golden: ['A golden apple! Everyone pretends not to have seen it.', 'A golden apple just dropped onto the log.'],
  // The first time in a round you cross a rival's border.
  field: { home: name => `You’re in ${name}’s realm now. It noticed.`, colony: name => `That’s one of ${name}’s colonies. It noticed.` },
  woodpecker: ['The woodpecker is here. Keep out of wherever it’s looking.', 'Rat-a-tat. The woodpecker has come for the log, a patch at a time.'],
  woodpeckerWatch: ['The woodpecker is here. Everyone, keep clear of its mark.', 'Rat-a-tat. The woodpecker has come for the log, a patch at a time.'],
  // The new rules, as they first happen to you in a round: one idea each, short.
  // (A no-break space keeps "At 3" together: split, it reads as two statements.)
  youCrash: ['Crashes cost tail. At\u00a03, or boxed in, a crash ends you.', 'That crash cost tail. At\u00a03, or boxed in, you’re out.'],
  youCrashToThree: 'Crashes cost tail. You’re at\u00a03: the next one ends you.',
  youAtThree: ['Down to\u00a03. One more crash and you’re out.', 'At\u00a03 now. The next crash is the last.'],
  youAlight: ['On fire: 3 bites of tail, and at\u00a03 it ends you. Rain helps.', 'Burning, and losing bits of you. At\u00a03 it ends you.'],
  youPeckedUnder: 'Pecking under you! Only your head can fall in.', // (a body over a fresh hole bridges it)
  cutLoose: 'Cut loose, it falls! Get off the shaded piece.', // (2s: the first mark that cuts a piece loose, or its strike)
  youSquash: 'Your own beads feed nobody.', // (round six B: your first own bead squashed)
  youWoodpecker: 'Food in the woodpecker’s mark flies to its ring.', // (once a round, as it comes, once its own banner has had its time: the one idea you can act on, in one line on a phone; that it won't shut you in if it can help it is the Field guide's)
  birdBeetle: 'The woodpecker eats beetles too!', // (round six B, 2m: the first beetle you see the bird eat, one that didn't get off its mark in time)
  youDig: 'A cornered beetle digs in. Grab it before it’s gone!', // (the first one near enough your head to catch: see DIG_NEAR)
  digBurrow: 'A beetle that digs in leaves a burrow behind.', // (the first burrow a dig leaves in a round, anywhere on the log, once the dig's own lesson is told)
  digAndBurrow: 'A cornered beetle digs in, leaving a burrow.', // (the same, when the dig's lesson hasn't been told yet: most digs are far from you, so this one teaches both, the dig first)
  burrowTaken: 'A beetle that digs in by a burrow takes its place.', // (the first burrow in a round that a dig near it starts growing shut, once the burrow's lesson is told: burrows keep BURROW_SPACING apart)
  burrowHeal: 'Old burrows grow shut: beetles go in, none come out.', // (the stalest: the one unused longest, as the Field guide has it. The first one starting to grow shut in a round, once the burrow's lesson is told)
  lostColony: 'The woodpecker took a flag: that colony’s lost.', // (a flag it pecks out, the first in a round; for watchers too)
  lostCapital: 'The woodpecker took a capital: its realm moves.',
  lastApples: 'The last apples are falling.',
  // Your flash, ready and never used yet: the key, once a round (until you've flashed).
  flashKey: touchFirst ? 'Your flash is ready: swipe the way you’re going.' : 'Your flash is ready: E, Shift or right-click.', // (what it does is the Field guide's: a lesson is 60 characters at most)
  // Beside the YOU arrow, as a round starts (until you steer).
  steerHint: touchFirst ? 'Swipe to steer' : 'Arrow keys to steer (or WASD)',
  leapNothing: 'Jumps hop over a snake, a hole or fire.',
  leapEarly: `A bit early: a jump waits ${TUNE.LEAP_WINDOW} moves, then lapses.`,
  islandHop: touchFirst ? 'Tap to hop up to three cells. Hop the gap!' : 'Space hops up to three cells. Hop the gap!', // (the first time you're boxed in with a jumpable gap: round six B's island hop)
  powersFirst: 'Tap jumps. Swipe ahead flashes.', // (a short phone's first Go: steering is beside YOU. One line on a 320 px phone, so it fits between the heads)
  bothOut: ['Nobody walked away from that one.', 'A draw, of sorts.', 'Both of you. At once.'],
  wakeBeat: 'Ready…',
  baked: ['Baking in the fire: worth 2, if you can take the heat.', 'Baked: hot food is worth 2, if you can take the heat.'],
  bakedWatch: ['Baking in the fire: worth 2, to whoever takes the heat.'],
  beetle: ['A beetle is out for a walk. It won’t get far.', 'A beetle is crawling about. Crunchy.'],
  goldBeetle: ['A golden beetle! Catch it for golden jumps.', 'A golden beetle: catch it, and jump far for free.'],
  goldBeetleWatch: ['A golden beetle! Whoever catches it jumps far.', 'A golden beetle is scuttling about.'],
  youGoldBeetle: n => `Golden: ${n} long jump${n === 1 ? '' : 's'}, free. ${touchFirst ? 'Tap' : 'Space or a click'} to jump.`,
  bridgeFirst: 'A snake across a pit is a bridge, until its tail passes!', // (the first time a snake lies across a pit near you: round six B's bridges)
  youLeapFirst: 'Hup! A jump costs your tail tip, then a short rest.',
  youDashFirst: 'Golden flashes cut through two thick, and put out fire.',
  youCutFirst: 'A flash cuts through a thin body.', // (round six B: your first cut)
  youFlashFailed: 'Too thick! A failed flash costs five.', // (your first failed flash)
  neckCut: 'Snip! Too short to go on.', // (the first neck cut you see: a cut that left a snake fewer than 3 in front)
  dropTail: 'Flash through your own tail to drop it.', // (the first time you're in a pocket smaller than you, your flash ready and your own body one thick in front)
  youDropTail: 'Tail dropped: lighter, and out of the pocket.', // (your first own cut)
  leaf: ['A golden leaf on the wind. Eat it for golden flashes.', 'A golden leaf blew onto the log: golden flashes, for the taking.'],
  leafWatch: ['A golden leaf on the wind: golden flashes, for whoever eats it.'],
  youLeaf: n => `${n} golden flash${n === 1 ? '' : 'es'}: ${touchFirst ? 'swipe ahead' : 'E or right-click'}. Never at edges or holes.`, // (the danger in it: the first one may be the one. One key and the mouse, to keep it to 60 characters: the Field guide names Shift)
  goldcap: ['A golden mushroom: eat it and the edges wrap.', 'A golden mushroom came up. Eat it: no edges for a while.'],
  goldcapWatch: ['A golden mushroom: no edges, for whoever eats it.'],
  youGoldcap: s => `A golden mushroom: ${s} seconds with no edges.`,
  wrapEnding: s => [`The edges are back in ${s} seconds.`, `Edges back in ${s} seconds.`],
  youSnip: name => `Snip! You cut ${name} in two.`,
  youSnipped: name => `Snip. ${name} flashed right through you.`,
  youBumped: 'Bumped in mid-air! Down you go.', // (round six B: your first bump in the air)
  youGoldFly: 'Hold to fly farther. Steer in the air!', // (your first golden jump)
  leapNow: 'Press twice to leap now, anywhere!', // (the first time a flier comes down just ahead of you: you could have cut it off)
  youMushroomSpit: 'Bleh! Steer to aim it: it lands three ahead.', // (round six B: your first mushroom, which comes back up)
  youSpatOn: name => `Ptoo! ${name} got you. Steer to spit it back.`, // (the first time one hits your head)
  youHungry: ['Your tummy is rumbling. Time for a snack.', 'Getting peckish… find food soon.'],
  youStarvingSmall: 'Starving at\u00a03, with nothing to spare. Eat now.',
  // A press that couldn't go (the first time each way, in a round): a jump, or a flash.
  // (A flash is free, FLASH_COST 0, so it's never too small; it has nowhere
  // to go only over a crash: straight back in, or blown up at the edge or a hole.)
  fizzle: { resting: 'Your jump needs a moment.', small: 'Too small to jump: it costs tail.', landing: 'Nowhere to land.' },
  fizzleFlash: { resting: 'Your flash needs a moment.', landing: 'Nowhere to flash.' },
  newBest: n => `New best: ${n}!`,
  startOver: 'Start over?',
  startOverText: key => key ? `${key} again starts over. P, Esc or an arrow keeps going.` : 'This round’s gone if you do.',
  awake: 'Awake.',
  friendWin: ['Bragging rights, for now.', 'Rematch?', 'Fair and square. Probably.'],
  friendKill: ['No hard feelings. Well, a few.', 'Friendship is complicated.', 'That calls for a rematch.'],
  friendsIntro: 'Host a game and send your friends the link, or join theirs. Empty seats go to rivals.',
  hostIntro: location.protocol === 'file:' ? 'Send this code to up to three friends. Empty seats go to rivals.' : 'Send this link to up to three friends. Empty seats go to rivals.',
  joining: code => `Knocking on room ${code}…`,
  waiting: (name, next) => `Waiting for ${name} to start the ${next ? 'next ' : ''}round.`,
  roomGone: name => `${name} closed the room.`,
  roomLost: 'Lost the connection to the room.',
  friendLeft: name => `${name} left. An AI takes over their snake.`,
  friendJoined: name => `${name} is here. Their best rounds join your Hall of Fame.`,
  friendAway: name => `${name} went quiet. An AI steers until they’re back.`,
  friendBack: name => `${name} is back.`,
  youAway: 'You went quiet for a moment, so an AI steered for you.',
  tapTip: touchFirst ? 'Tap names to swap, tags to see how they play.' : 'Click names to swap, tags to see how they play.', // (no "above": on a phone on its side the tags are beside the log)
  takeBack: 'An AI kept your snake going. Steer to take it back.',
  watchingFirst: 'This round’s already going. You’re in from the next one.',
  rivals0: 'Just friends today. No mercy:',
  // On a phone held upright a banner has one line, over the header's title
  // row (DESIGN "Teaching by showing"): the longest round news, in fewer
  // words there; the full words everywhere else, and for a screen reader.
  // (input-test checks every banner fits a line on a 360 px phone, at its
  // own size or a little under.)
  phone: {
    'Thunder on the bark. Lightning strikes where it crackles.': 'Thunder! Lightning strikes where it crackles.',
    'Winter. Less food, and you’ll get hungry faster.': 'Winter. Less food, and hunger comes faster.',
    'Snow on the bark. Lean times: eat while you can.': 'Snow. Lean times: eat while you can.',
    'Winter. Less food, and everyone gets hungry faster.': 'Winter. Less food, and hunger comes faster.',
    'The woodpecker is here. Keep out of wherever it’s looking.': 'The woodpecker is here. Keep out of its sight.',
    'Rat-a-tat. The woodpecker has come for the log, a patch at a time.': 'Rat-a-tat. The woodpecker has come for the log.',
    'The woodpecker is here. Everyone, keep clear of its mark.': 'The woodpecker is here. Everyone, mind its mark.',
    'A golden leaf blew onto the log: golden flashes, for the taking.': 'A golden leaf blew in: golden flashes to take.',
    'A golden leaf on the wind: golden flashes, for whoever eats it.': 'A golden leaf: golden flashes, for whoever eats it.',
    'A golden mushroom came up. Eat it: no edges for a while.': 'A golden mushroom came up: no edges for a while.',
    'This round’s already going. You’re in from the next one.': 'This round’s going. You’re in from the next one.',
    'You went quiet for a moment, so an AI steered for you.': 'You went quiet, so an AI steered for you.',
  },
  friendLeftPhone: name => `${name} left. An AI steers their snake.`,
  friendJoinedPhone: name => `${name} is here, and joins your Hall of Fame.`,
  friendAwayPhone: name => `${name} went quiet. An AI steers for now.`,
};

// A line from FLAVOR[key], or from its watching version (key + 'Watch') when you're not in the round.
const lineFor = key => pick((!playerAlive() && FLAVOR[key + 'Watch']) || FLAVOR[key]);

// "you" for your own snake, the name for everyone else.
const who = (s, object = false) => isMe(s) ? (object ? 'you' : 'You') : s.name;
// A death as you see it: causes name names, and yours becomes "you".
function causeFor(s) {
  const k = s.killerId != null && s.killer !== 'self' ? theGame.snakes[s.killerId] : null;
  return k && isMe(k) && s.cause.endsWith(k.name) ? s.cause.slice(0, -k.name.length) + 'you' : s.cause;
}
// A cause in fewer words, for a banner's one line on a phone.
const shortCause = c => c.replace(/^flashed into (the edge|a woodpecker hole) and blew up$/, 'blew up').replace(/^got pecked by the woodpecker$/, 'got pecked').replace(/^(fell into|hit) a woodpecker hole$/, '$1 a hole').replace(/^got cut in two by /, 'was cut by ').replace(/^crashed head-on into (.+)$/, 'hit $1 head-on');
// Your death, in the second person.
const yourCause = p => p.killer === 'self' ? 'bit yourself' : causeFor(p);
// Why a crash was the end (the engine's verdict): length is armour, so a
// crash at 40 needs a reason. Other deaths say it in the cause itself.
const WHY_OUT = { tiny: ' at your smallest', boxed: ' with nowhere to turn', shorter: ', and it was longer', even: ', the same length: both out' };
const howYouDied = p => {
  if (p.fatal === 'hunger') return 'You ran out of food at your smallest'; // (under "Starved!": not "You starved" again)
  if (p.fatal === 'pecked') return 'The woodpecker struck right under your head'; // (only a head in the patch is out: a body over it bridges it)
  if (p.fatal === 'fire') return 'The flames got you at your smallest';
  if (p.fatal === 'cut') return `${theGame.snakes[p.killerId]?.name || 'A'}’s flash cut you right behind the head`;
  const k = p.killerId != null ? theGame.snakes[p.killerId] : null;
  const why = p.fatal === 'shorter' && k && !k.persona ? ', and they were longer' : WHY_OUT[p.fatal] || ''; // (a friend is "they")
  return `You ${yourCause(p)}${why}`;
};

// ---------------------------------------------------------- game state

// state: 'ready' (start card) | 'lobby' (play with friends) | 'countdown' | 'running' | 'paused' | 'over'
let theGame, state = 'ready', speed = 1, watchSpeed = 1;
// Which snake is yours: an arrow and YOU over its head from the countdown
// until a few seconds into the round (or just after you first steer).
let youHideAt = 0;
// Online play, or null when playing alone:
// { role: 'host' | 'guest', room, code, seat (yours in this round, -1 if watching),
//   players: [{ id, name, color }] (host: everyone in the room, seat order),
//   hostName, lastTickAt, holesSent }
let online = null;
const hosting = () => online?.role === 'host';
const guesting = () => online?.role === 'guest';
let acc = 0, tickLen = TUNE.OPENING_TICK, lastFrame = 0, drawAlpha = 1, dirty = true;
// The clock the board's own effects run on (tongues, beetles, particles,
// weather): the frame clock, but at 2x or 4x when you're watching that fast.
let boardClock = performance.now();
let helpText = ''; // (the help under the board, as last written)
let powersTold = false; // (the first Go on a short phone has said how to jump and flash)
let flashedEver = false; // (you've flashed, or pressed to: the flash's key needn't be told again this visit)
let beatsLeft = 0, beatTimer = 0, waking = false; // (waking: the one beat back from a nap)
let freezeUntil = 0, pendingCard = null, cardAt = 0; // times on the frame clock (rAF timestamps)
let shownCard = null, napOver = null; // the card on screen, and the one a nap covered
let firstCard = true; // (focus on page load goes to the card, not silently to Play)
let thinkQueue = [];
let best = Records.getBest();
let boardPx = 0; // the board's CSS width, kept by a ResizeObserver (no layout reads in the loop)

// Your snake: the first seat alone, your seat online (none if you're watching).
const player = () => {
  const s = theGame.snakes[online ? online.seat : 0];
  return s?.isPlayer ? s : null;
};
const isMe = s => !!s && s === player();
const playerAlive = () => !!player()?.alive;
const localName = () => (Records.hasName() ? Records.getName() : 'Green');
const spectating = () => !playerAlive();

// Which part of the soundtrack fits this moment (see SnakeAudio.music).
const mood = { intensity: 0, watching: false, paused: false, danger: 0 };
let dangerNow = 0; // (worked out once a tick)
function musicStage() {
  if (state !== 'running' && state !== 'paused' && !waking) return 'title'; // (the beat back from a nap is still the round)
  let alive = 0;
  for (const s of theGame.snakes) if (s.alive) alive++;
  mood.intensity = Math.min(1, theGame.time / TUNE.RAMP_MS);
  mood.danger = state === 'running' ? dangerNow : 0;
  mood.watching = spectating();
  mood.paused = state === 'paused' || waking;
  return alive <= 2 ? 'duel' : Engine.suddenDeath(theGame) ? 'sudden' : theGame.time > TUNE.MUSIC_MID_MS ? 'mid' : 'early';
}

// -------------------------------------------------------------- the loop

// One requestAnimationFrame loop drives everything. The simulation runs on a
// fixed timestep from an accumulator, and the renderer interpolates between
// ticks, so motion is smooth at any refresh rate and ticks never drift.
function loop(now) {
  requestAnimationFrame(loop);
  onFrame(now);
}

function onFrame(now) {
  const dt = lastFrame ? Math.max(0, Math.min(TUNE.MAX_FRAME_MS, now - lastFrame)) : 16;
  lastFrame = now;
  boardClock += dt * (state === 'running' && spectating() && !online ? speed : 1);
  govern(dt);
  const t0 = performance.now();
  let tickCost = 0;

  if (state === 'countdown' && !guesting()) {
    beatTimer -= dt;
    if (beatTimer <= 0) beat();
    dirty = true;
  }

  if (state === 'running' && guesting()) {
    // A friend's screen doesn't simulate: it glides between the host's ticks.
    showPending(now >= freezeUntil);
    drawAlpha = Math.min(1, (performance.now() - online.lastTickAt) / tickLen);
    easeLead(dt);
    dirty = true;
  } else if (state === 'running') {
    // Alone, your death stops the round for a moment. Online it never stops:
    // the round is everyone's, and only your card waits.
    const frozen = () => !online && now < freezeUntil;
    let busy = false; // a frame that ticks or shows a card has done enough: thinking waits a frame
    if (showPending(now >= freezeUntil)) busy = true;
    easeLead(dt, frozen());
    if (!frozen()) {
      acc += dt;
      let steps = 0;
      const most = online || spectating() ? TUNE.MAX_CATCHUP : TUNE.SOLO_CATCHUP; // (alone, a hitch is a moment's slow-down, not a jump)
      while (acc >= tickLen && steps < most && state === 'running' && !frozen()) {
        acc -= tickLen;
        const ts = performance.now();
        tick();
        tickCost += performance.now() - ts;
        steps++;
      }
      if (steps === most) acc = Math.min(acc, tickLen); // after a long stall, don't race to catch up
      if (!busy) think(dt, steps > 0);
      if (hosting() && !planSent && !thinkQueue.length && state === 'running') sendPlan(); // (the rivals have thought: friends draw them ahead the way they're going)
    }
    // Between the last two cells. While frozen, `acc` stands still, so the
    // board holds the very moment of the crash, with nothing jumping ahead.
    drawAlpha = Math.min(1, acc / tickLen);
    dirty = true;
  } else if (state === 'over') {
    if (showPending(now >= cardAt && (!Chatter.lastWordsUp() || !overlay.classList.contains('hidden')))) Chatter.clearBubbles(); // (a phone's last words, read on the board where they went out, before the card covers it; under your death's card, no wait)
    // The last move glides like any other, then the board rests.
    if (drawAlpha < 1) {
      drawAlpha = guesting() ? Math.min(1, (performance.now() - online.lastTickAt) / tickLen) : Math.min(1, (acc += dt) / tickLen);
      dirty = true;
    }
    if (Render.particles > 0 || Render.holding() || pendingCard) dirty = true;
  }

  Sound.music(musicStage(), mood);

  if (youHideAt && (performance.now() > youHideAt || !playerAlive())) { youHideAt = 0; markYou(false); }
  if (dirty && !document.hidden) {
    Render.setLead(leadAt);
    Render.frame(drawAlpha, boardClock);
    birdSounds();
    Chatter.layout(drawAlpha, boardPx, state === 'over' ? null : player()); // (the round over, nothing to steer: last words never fade near your snake)
    if (steerHintOn) placeSteerHint();
    toastFade();
    dirty = state === 'running' || state === 'countdown' || Render.particles > 0 || Render.holding();
  }
  perf.record(performance.now() - t0, tickCost);
}

// Keep it playable everywhere: if this device keeps dropping frames during
// a round (over 12% of frames late, two windows of about three seconds in a
// row), the board draws less, for good: first no canopy shadows and a lower
// resolution, then the lowest. (Late means half again the shortest frame
// seen in the window, so 60, 120 and 144 Hz screens are judged alike.)
const governor = { frames: 0, late: 0, best: Infinity, dts: [], strikes: 0, pinned: false };
function govern(dt) {
  if (governor.pinned || state !== 'running' || document.hidden || Render.quality === 0 || !theGame || theGame.time < 1500 || dt <= 0) return;
  governor.dts.push(dt);
  governor.best = Math.min(governor.best, dt);
  if (governor.dts.length < 180) return;
  const late = governor.dts.filter(d => d > Math.max(governor.best * 1.6, 12)).length / governor.dts.length;
  governor.dts.length = 0;
  governor.best = Infinity;
  governor.strikes = late > 0.12 ? governor.strikes + 1 : 0;
  if (governor.strikes < 2) return;
  governor.strikes = 0;
  Render.setQuality(Render.quality - 1);
  dirty = true;
}

// A card waiting for its moment (after the death freeze, or the round's last
// breath) comes up once `due`. Returns whether it did. It came up by
// itself, maybe under a finger mashing jump: for a moment, its buttons take
// no touch that began before (see the touches).
let cardShownAt = -Infinity;
function showPending(due) {
  if (!pendingCard || !due) return false;
  const c = pendingCard;
  pendingCard = null;
  showCard(c);
  cardShownAt = performance.now();
  return true;
}

// A host's hidden tab still has to run the round for everyone, but browsers
// stop animation frames there (and slow timers down). A worker's clock keeps
// ticking, so it stands in while the host's tab is hidden.
let hiddenClock = null;
function keepTimeWhileHidden(on) {
  if (on && !hiddenClock) {
    try {
      const url = URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 20);'], { type: 'text/javascript' }));
      hiddenClock = new Worker(url);
      URL.revokeObjectURL(url);
      hiddenClock.onmessage = () => { if (document.hidden && hosting()) onFrame(performance.now()); };
    } catch { hiddenClock = null; /* the round just waits while the tab is hidden */ }
  } else if (!on && hiddenClock) {
    hiddenClock.terminate();
    hiddenClock = null;
  }
}

// How far ahead the board is drawn, in ticks (DRAW_LEAD_MS, but at most
// half a tick: 60 ms at 120 ms ticks, 45 at full speed; any more, and late
// in a tick your head was drawn in the next cell while a press still turned
// it at this one): only while someone's playing on this screen. Watching
// alone (Watch AIs, or after you're out) there's no press to keep up
// with, so the board is drawn on its ticks and the rivals have the whole
// tick to think in (see think). Going away after your death, the lead
// eases out (the board a touch slower for a moment, never while it's held
// still): nothing jumps back.
let leadAt = 0;
const leadWanted = () => (spectating() && !online ? 0 : Math.min(TUNE.DRAW_LEAD_MAX, TUNE.DRAW_LEAD_MS / tickLen));
function easeLead(dt, held = false) {
  const want = leadWanted();
  if (want >= leadAt) leadAt = want;
  else if (!held) leadAt = Math.max(want, leadAt - 0.5 * dt / tickLen);
}
// Let the AIs think about the next tick in the frames before it (same
// information, same decisions), before the board is drawn into their next
// move (see R.setLead; the frame that draws it thinks first). Spread over
// the frames that are left, one a frame, two when they're few (at full
// speed, playing, there are about two); not in a frame that ticked, which
// has done enough, unless those can't fit them all. The frame that draws
// it thinks everyone still to: on a 30 Hz screen (a phone saving power)
// that may be the only one after the tick, and a rival left out was drawn
// heading on, then pulled round when it turned.
function think(dt, ticked = false) {
  if (!thinkQueue.length) return;
  const left = Math.max(0, Math.ceil((tickLen * (1 - leadAt) - acc) / Math.max(4, dt))); // (frames after this one, up to the one that draws the next move)
  let quota = !left ? thinkQueue.length : ticked ? thinkQueue.length - 2 * left : Math.min(2, Math.ceil(thinkQueue.length / (left + 1)));
  while (thinkQueue.length && quota > 0) {
    const s = thinkQueue.shift();
    if (Engine.canThinkAhead(theGame, s)) { Engine.thinkAhead(theGame, s); quota--; }
  }
}

// Hosting: where everyone goes next, for friends' screens, once a tick when
// the rivals have thought, and again when a person's press changes it.
let planSent = false;
function sendPlan() {
  planSent = true;
  online.room.broadcast(Online.plan(theGame));
}

// One tick of the rules (alone, or as the host: friends get a copy).
function tick() {
  const wasAlive = playerAlive();
  for (const s of theGame.snakes) rememberPrev(s);
  if (hosting()) checkAway();
  const dying = Engine.step(theGame);
  tickLen = Engine.tickMs(theGame) / (spectating() && !online ? speed : 1);
  if (hosting()) {
    online.room.broadcast(Online.tick(theGame, { holesFrom: online.holesSent, tickLen }));
    online.holesSent = theGame.holes.size;
    planSent = false;
  }
  Chatter.update();
  afterTick(dying, wasAlive);
}

// A tick from the host, on a friend's screen.
function hostTick(msg) {
  if (!theGame || (state !== 'running' && state !== 'countdown')) return;
  if (state === 'countdown') go();
  const wasAlive = playerAlive();
  for (const s of theGame.snakes) rememberPrev(s);
  const wasPiloted = !!player()?.autopilot;
  const dying = Online.apply(theGame, msg, DIRS);
  // If the host had an AI steer for you for a while (your connection
  // hiccupped), say so once you're back.
  const piloted = !!player()?.autopilot;
  if (piloted && !wasPiloted) online.pilotedAt = performance.now();
  if (wasPiloted && !piloted && player() && performance.now() - online.pilotedAt > 2000 && !online.toldAway) toast(FLAVOR.youAway, 2200);
  if (!piloted) online.toldAway = false;
  tickLen = msg.len || Engine.tickMs(theGame);
  online.lastTickAt = performance.now();
  afterTick(dying, wasAlive);
}

// What follows a tick on every screen: effects, sounds, the HUD, banners, placements.
function afterTick(dying, wasAlive) {
  dangerNow = dangerOf();
  Render.onTick(theGame.events);
  sounds(dying, wasAlive);
  updateHud();
  announce(dying);

  // Everyone still alive finished ahead of the snakes that just died; if
  // nobody is, they share first place (a draw).
  const alive = theGame.snakes.filter(s => s.alive);
  for (const s of dying) finishSnake(s, { place: alive.length + 1, draw: alive.length === 0 });
  thinkQueue = guesting() ? [] : alive.filter(s => !s.isPlayer || s.autopilot);
  const youJustDied = wasAlive && !playerAlive();
  if (youJustDied) deathMoment();
  if (alive.length <= 1) {
    if (alive.length) finishSnake(alive[0], { place: 1, won: true });
    return endRound();
  }
  if (youJustDied) youDied();
}

// The moment you die: the board holds still (alone), your snake holds its
// pose with its eyes screwed shut, then bursts. Also when it ends the round.
function deathMoment() {
  freezeUntil = lastFrame + (reducedMQ.matches ? TUNE.DEATH_FREEZE / 2 : TUNE.DEATH_FREEZE);
  Render.hold(boardClock + (freezeUntil - lastFrame)); // (on the board's clock)
  Render.shake(TUNE.SHAKE_PX);
  flashFrame('kill', true);
}

// Each segment's previous cell, for interpolation. Reuses the same objects.
function rememberPrev(s) {
  if (!s.alive) { s.prev = null; return; }
  const prev = s.prev || (s.prev = []);
  prev.length = s.body.length;
  for (let i = 0; i < s.body.length; i++) {
    const c = s.body[i];
    if (prev[i]) { prev[i].x = c.x; prev[i].y = c.y; } else prev[i] = { x: c.x, y: c.y };
  }
}
