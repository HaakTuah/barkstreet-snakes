// The game controller: the loop, input, the cards and the HUD. The rules live
// in engine.js, the drawing in render.js, and every feel number in tuning.js.
(() => {
  const T = window.TUNING;
  const E = window.SnakeEngine;
  const { GRID, PLAYER_COLOR, PERSONAS, DIRS } = E;
  const R = window.SnakeRender;
  const Records = window.SnakeRecords;
  const Chatter = window.SnakeChatter;
  const Audio = window.SnakeAudio;
  const Online = window.SnakeOnline;
  const Net = window.SnakeNet;

  // --------------------------------------------------------------- the DOM

  const $ = id => document.getElementById(id);
  const canvas = $('game'), boardEl = document.querySelector('.board'), mainEl = document.querySelector('main'), glowEl = $('frame-glow');
  const scoreEl = $('score'), bestEl = $('best'), tagsEl = $('scoreboard');
  const overlay = $('overlay'), cardTitle = $('overlay-title'), cardText = $('overlay-text');
  const flavorEl = $('overlay-flavor'), badgeEl = $('overlay-badge'), opponentsEl = $('opponents');
  const nameRow = $('name-row'), nameRank = $('name-rank'), nameInput = $('name-input');
  const startBtn = $('start'), watchBtn = $('watch');
  const toastEl = $('toast'), speedEl = $('speed'), announcer = $('announcer'), hintEl = $('hint'), helpEl = $('help');
  const pauseBtn = $('pause'), muteBtn = $('mute'), musicBtn = $('music'), chatterBtn = $('chatter-toggle'), chatlogEl = $('chatlog');
  const recordsEl = $('records'), recordsBody = $('records-body'), resetBtn = $('records-reset');
  const recordsTabs = [...document.querySelectorAll('#records .tab[data-tab]')];
  const filterEl = $('scores-filter'), filterTabs = [...filterEl.querySelectorAll('.tab')];
  const friendsBtn = $('friends'), lobbyEl = $('lobby'), lobbyName = $('lobby-name'), lobbyShare = $('lobby-share');
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
  const FLAVOR = {
    intro: 'Three rivals. One mossy log. Last snake wriggling wins.',
    hintStart: 'Arrows or WASD steer · Space jumps · E or Shift flashes · P naps · Enter starts · H opens the Hall of Fame',
    hintKeys: 'Arrows or WASD steer · Space jumps · E or Shift flashes · P or Esc naps · Enter starts over · H opens the Hall of Fame · M mutes · N toggles the music',
    hintOnline: 'Arrows or WASD steer · Space jumps · E or Shift flashes · M mutes · N toggles the music',
    hintOnlineTouch: 'Swipe to steer · Tap to jump · Swipe ahead to flash',
    hintTouch: 'Swipe to steer · Tap to jump · Swipe ahead to flash · Tap ⏸ to nap',
    // Watching (Watch AIs, or after you're out): nothing of yours to steer.
    hintWatch: '1, 2, 4 set the speed · P naps · Enter plays · H opens the Hall of Fame · M mutes · N toggles the music',
    hintWatchTouch: 'The speed buttons set 1×, 2× or 4× · Tap ⏸ to nap',
    rivals: ['Your rivals today:', 'Up on the log with you:', 'Sharing your bark:'],
    spectators: ['Tonight on the bark:', 'In the ring today:', 'Place your bets:'],
    go: ['Slither!', 'Off you go.', 'Mind the edges.'],
    goWatch: ['And they’re off.', 'Off they slither.', 'Let the wriggling begin.'],
    pause: ['Snakes need rest too.', 'Curled up in a warm patch of bark.', 'The log will wait.'],
    wake: touchFirst ? 'Tap Wake up when you’re ready.' : 'P or Esc to wake up.',
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
    burrow: ['A beetle burrow just cracked open.', 'A beetle’s been digging under the bark.'],
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
    youOwnBead: 'Your own tail won’t feed you.', // (it gives the length back, not the meal)
    lastApples: 'The last apples are falling.',
    // Your flash, ready and never used yet: the key, once a round (until you've flashed).
    flashKey: touchFirst ? 'Your flash is ready: swipe the way you’re going.' : 'Your flash is ready: E or Shift, two cells in a blink.',
    // Beside the YOU arrow, as a round starts (until you steer).
    steerHint: touchFirst ? 'Swipe to steer' : 'Arrows or WASD to steer',
    leapNothing: 'Jumps hop over a snake, a hole or fire.',
    leapEarly: 'A bit early: jump when it’s right in front.',
    powersFirst: 'Tap to jump over things. Swipe ahead to flash.', // (a short phone's first Go: steering is beside YOU)
    bothOut: ['Nobody walked away from that one.', 'A draw, of sorts.', 'Both of you. At once.'],
    wakeBeat: 'Ready…',
    baked: ['Baking in the fire: worth 2, if you can take the heat.', 'Baked: hot food is worth 2, if you can take the heat.'],
    bakedWatch: ['Baking in the fire: worth 2, to whoever takes the heat.'],
    beetle: ['A beetle is out for a walk. It won’t get far.', 'A beetle is crawling about. Crunchy.'],
    goldBeetle: ['A golden beetle! Catch it for golden jumps.', 'A golden beetle: catch it, and jump far for free.'],
    goldBeetleWatch: ['A golden beetle! Whoever catches it jumps far.', 'A golden beetle is scuttling about.'],
    youGoldBeetle: n => `Golden: ${n} long jump${n === 1 ? '' : 's'}, free. ${touchFirst ? 'Tap' : 'Space'} to jump.`,
    youLeapFirst: 'Hup! A jump costs your tail tip, then a short rest.',
    youDashFirst: 'Golden flashes cut thin snakes in two.',
    leaf: ['A golden leaf on the wind. Eat it for golden flashes.', 'A golden leaf blew onto the log: golden flashes, for the taking.'],
    leafWatch: ['A golden leaf on the wind: golden flashes, for whoever eats it.'],
    youLeaf: n => `${n} golden flash${n === 1 ? '' : 'es'}: ${touchFirst ? 'swipe ahead' : 'E or Shift'}. Never at an edge or hole.`, // (the danger first: the first one may be the one)
    goldcap: ['A golden mushroom: eat it and the edges wrap.', 'A golden mushroom came up. Eat it: no edges for a while.'],
    goldcapWatch: ['A golden mushroom: no edges, for whoever eats it.'],
    youGoldcap: s => `A golden mushroom: ${s} seconds with no edges.`,
    wrapEnding: s => [`The edges are back in ${s} seconds.`, `Edges back in ${s} seconds.`],
    youSnip: name => `Snip! You cut ${name} in two.`,
    youSnipped: name => `Snip. ${name} flashed right through you.`,
    youMushroom: ['You feel smaller. And somehow wiser.', 'A little less of you. Sneaky.'],
    youHungry: ['Your tummy is rumbling. Time for a snack.', 'Getting peckish… find food soon.'],
    youStarvingSmall: 'Starving at\u00a03, with nothing to spare. Eat now.',
    // A press that couldn't go (the first time each way, in a round): a jump, or a flash.
    fizzle: { resting: 'Your jump needs a moment.', small: 'Too small to jump: it costs tail.', landing: 'Nowhere to land.' },
    fizzleFlash: { resting: 'Your flash needs a moment.', small: 'Too small to flash: it costs tail.' },
    newBest: n => `New best: ${n}!`,
    startOver: 'Start over?',
    startOverText: key => key ? `${key} again starts over. P, Esc or an arrow keeps going.` : 'This round’s gone if you do.',
    awake: 'Awake.',
    friendWin: ['Bragging rights, for now.', 'Rematch?', 'Fair and square. Probably.'],
    friendKill: ['No hard feelings. Well, a few.', 'Friendship is complicated.', 'That calls for a rematch.'],
    friendsIntro: 'Host a game and send your friends the link, or join theirs. Empty seats get AI rivals.',
    hostIntro: location.protocol === 'file:' ? 'Send this code to up to three friends. Empty seats get AI rivals.' : 'Send this link to up to three friends. Empty seats get AI rivals.',
    joining: code => `Knocking on room ${code}…`,
    waiting: (name, next) => `Waiting for ${name} to start the ${next ? 'next ' : ''}round.`,
    roomGone: name => `${name} closed the room.`,
    roomLost: 'Lost the connection to the room.',
    friendLeft: name => `${name} left. An AI takes over their snake.`,
    friendJoined: name => `${name} is here. Their best rounds join your Hall of Fame.`,
    friendAway: name => `${name} went quiet. An AI steers until they’re back.`,
    friendBack: name => `${name} is back.`,
    youAway: 'You went quiet for a moment, so an AI steered for you.',
    tapTip: touchFirst ? 'Tap a rival’s name tag to see how it plays.' : 'Click a rival’s name tag to see how it plays.', // (no "above": on a phone on its side the tags are beside the log)
    takeBack: 'An AI kept your snake going. Steer to take it back.',
    watchingFirst: 'This round’s already going. You’re in from the next one.',
    rivals0: 'Just friends today. No mercy:',
  };

  // A line from FLAVOR[key], or from its watching version (key + 'Watch') when you're not in the round.
  const lineFor = key => pick((!playerAlive() && FLAVOR[key + 'Watch']) || FLAVOR[key]);

  // "you" for your own snake, the name for everyone else.
  const who = (s, object = false) => isMe(s) ? (object ? 'you' : 'You') : s.name;
  // A death as you see it: causes name names, and yours becomes "you".
  function causeFor(s) {
    const k = s.killerId != null && s.killer !== 'self' ? game.snakes[s.killerId] : null;
    return k && isMe(k) && s.cause.endsWith(k.name) ? s.cause.slice(0, -k.name.length) + 'you' : s.cause;
  }
  // Your death, in the second person.
  const yourCause = p => p.killer === 'self' ? 'bit yourself' : causeFor(p);
  // Why a crash was the end (the engine's verdict): length is armour, so a
  // crash at 40 needs a reason. Other deaths say it in the cause itself.
  const WHY_OUT = { tiny: ' at your smallest', boxed: ' with nowhere to turn', shorter: ', and it was longer', even: ', the same length: both out' };
  const howYouDied = p => {
    if (p.fatal === 'hunger') return 'You ran out of food at your smallest'; // (under "Starved!": not "You starved" again)
    if (p.fatal === 'pecked') return 'The woodpecker struck right by your head';
    if (p.fatal === 'fire') return 'The flames got you at your smallest';
    if (p.fatal === 'cut') return `${game.snakes[p.killerId]?.name || 'A'}’s golden flash cut you right behind the head`;
    const k = p.killerId != null ? game.snakes[p.killerId] : null;
    const why = p.fatal === 'shorter' && k && !k.persona ? ', and they were longer' : WHY_OUT[p.fatal] || ''; // (a friend is "they")
    return `You ${yourCause(p)}${why}`;
  };

  // ---------------------------------------------------------- game state

  // state: 'ready' (start card) | 'lobby' (play with friends) | 'countdown' | 'running' | 'paused' | 'over'
  let game, state = 'ready', speed = 1, watchSpeed = 1;
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
  let acc = 0, tickLen = T.OPENING_TICK, lastFrame = 0, drawAlpha = 1, dirty = true;
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
    const s = game.snakes[online ? online.seat : 0];
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
    for (const s of game.snakes) if (s.alive) alive++;
    mood.intensity = Math.min(1, game.time / T.RAMP_MS);
    mood.danger = state === 'running' ? dangerNow : 0;
    mood.watching = spectating();
    mood.paused = state === 'paused' || waking;
    return alive <= 2 ? 'duel' : E.suddenDeath(game) ? 'sudden' : game.time > T.MUSIC_MID_MS ? 'mid' : 'early';
  }

  // -------------------------------------------------------------- the loop

  // One requestAnimationFrame loop drives everything. The simulation runs on a
  // fixed timestep from an accumulator, and the renderer interpolates between
  // ticks, so motion is smooth at any refresh rate and ticks never drift.
  function loop(now) {
    requestAnimationFrame(loop);
    frame(now);
  }

  function frame(now) {
    const dt = lastFrame ? Math.max(0, Math.min(T.MAX_FRAME_MS, now - lastFrame)) : 16;
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
      dirty = true;
    } else if (state === 'running') {
      // Alone, your death stops the round for a moment. Online it never stops:
      // the round is everyone's, and only your card waits.
      const frozen = () => !online && now < freezeUntil;
      let busy = false; // a frame that ticks or shows a card has done enough: thinking waits a frame
      if (showPending(now >= freezeUntil)) busy = true;
      if (!frozen()) {
        acc += dt;
        let steps = 0;
        const most = online || spectating() ? T.MAX_CATCHUP : T.SOLO_CATCHUP; // (alone, a hitch is a moment's slow-down, not a jump)
        while (acc >= tickLen && steps < most && state === 'running' && !frozen()) {
          acc -= tickLen;
          const ts = performance.now();
          tick();
          tickCost += performance.now() - ts;
          steps++;
        }
        if (steps === most) acc = Math.min(acc, tickLen); // after a long stall, don't race to catch up
        if (!busy) think(dt, steps > 0);
      }
      // Between the last two cells. While frozen, `acc` stands still, so the
      // board holds the very moment of the crash, with nothing jumping ahead.
      drawAlpha = Math.min(1, acc / tickLen);
      dirty = true;
    } else if (state === 'over') {
      showPending(now >= cardAt);
      // The last move glides like any other, then the board rests.
      if (drawAlpha < 1) {
        drawAlpha = guesting() ? Math.min(1, (performance.now() - online.lastTickAt) / tickLen) : Math.min(1, (acc += dt) / tickLen);
        dirty = true;
      }
      if (R.particles > 0 || R.holding() || pendingCard) dirty = true;
    }

    Audio.music(musicStage(), mood);

    if (youHideAt && (performance.now() > youHideAt || !playerAlive())) { youHideAt = 0; showYou(false); }
    if (dirty && !document.hidden) {
      R.setLead(lead());
      R.frame(drawAlpha, boardClock);
      Chatter.layout(drawAlpha, boardPx, player());
      if (steerHintOn) placeSteerHint();
      toastFade();
      dirty = state === 'running' || state === 'countdown' || R.particles > 0 || R.holding();
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
    if (governor.pinned || state !== 'running' || document.hidden || R.quality === 0 || !game || game.time < 1500 || dt <= 0) return;
    governor.dts.push(dt);
    governor.best = Math.min(governor.best, dt);
    if (governor.dts.length < 180) return;
    const late = governor.dts.filter(d => d > Math.max(governor.best * 1.6, 12)).length / governor.dts.length;
    governor.dts.length = 0;
    governor.best = Infinity;
    governor.strikes = late > 0.12 ? governor.strikes + 1 : 0;
    if (governor.strikes < 2) return;
    governor.strikes = 0;
    R.setQuality(R.quality - 1);
    dirty = true;
  }

  // A card waiting for its moment (after the death freeze, or the round's last
  // breath) comes up once `due`. Returns whether it did.
  function showPending(due) {
    if (!pendingCard || !due) return false;
    const c = pendingCard;
    pendingCard = null;
    showCard(c);
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
        hiddenClock.onmessage = () => { if (document.hidden && hosting()) frame(performance.now()); };
      } catch { hiddenClock = null; /* the round just waits while the tab is hidden */ }
    } else if (!on && hiddenClock) {
      hiddenClock.terminate();
      hiddenClock = null;
    }
  }

  // Let the AIs think about the next tick in the frames before it (same
  // information, same decisions), spread evenly over the frames that are left:
  // usually one AI per frame, more only when the tick is close (fast speeds).
  // A frame that ticked has done enough: it thinks only what the frames left
  // before the next tick couldn't (at 4x on a 60 Hz screen there are hardly
  // any frames between ticks).
  // How far ahead the board is drawn, in ticks (a time, so it's the same lead
  // at every speed; a person's timing is in milliseconds, not ticks).
  const lead = () => Math.min(T.DRAW_LEAD_MAX, T.DRAW_LEAD_MS / tickLen);
  function think(dt, ticked = false) {
    if (!thinkQueue.length) return;
    const frames = Math.floor((tickLen * (1 - lead()) - acc) / Math.max(4, dt)); // (frames still to come before the board is drawn into the next move: see R.setLead)
    let quota = ticked ? thinkQueue.length - frames : Math.ceil(thinkQueue.length / Math.max(1, frames));
    while (thinkQueue.length && quota > 0) {
      const s = thinkQueue.shift();
      if (E.canThinkAhead(game, s)) { E.thinkAhead(game, s); quota--; }
    }
  }

  // One tick of the rules (alone, or as the host: friends get a copy).
  function tick() {
    const wasAlive = playerAlive();
    for (const s of game.snakes) rememberPrev(s);
    if (hosting()) checkAway();
    const dying = E.step(game);
    tickLen = E.tickMs(game) / (spectating() && !online ? speed : 1);
    if (hosting()) {
      online.room.broadcast(Online.tick(game, { holesFrom: online.holesSent, tickLen }));
      online.holesSent = game.holes.size;
    }
    Chatter.update();
    afterTick(dying, wasAlive);
  }

  // A tick from the host, on a friend's screen.
  function hostTick(msg) {
    if (!game || (state !== 'running' && state !== 'countdown')) return;
    if (state === 'countdown') go();
    const wasAlive = playerAlive();
    for (const s of game.snakes) rememberPrev(s);
    const wasPiloted = !!player()?.autopilot;
    const dying = Online.apply(game, msg, DIRS);
    // If the host had an AI steer for you for a while (your connection
    // hiccupped), say so once you're back.
    const piloted = !!player()?.autopilot;
    if (piloted && !wasPiloted) online.pilotedAt = performance.now();
    if (wasPiloted && !piloted && player() && performance.now() - online.pilotedAt > 2000 && !online.toldAway) toast(FLAVOR.youAway, 2200);
    if (!piloted) online.toldAway = false;
    tickLen = msg.len || E.tickMs(game);
    online.lastTickAt = performance.now();
    afterTick(dying, wasAlive);
  }

  // What follows a tick on every screen: effects, sounds, the HUD, banners, placements.
  function afterTick(dying, wasAlive) {
    dangerNow = dangerOf();
    R.onTick(game.events);
    sounds(dying, wasAlive);
    updateHud();
    announce(dying);

    // Everyone still alive finished ahead of the snakes that just died; if
    // nobody is, they share first place (a draw).
    const alive = game.snakes.filter(s => s.alive);
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
    freezeUntil = lastFrame + (reducedMQ.matches ? T.DEATH_FREEZE / 2 : T.DEATH_FREEZE);
    R.hold(boardClock + (freezeUntil - lastFrame)); // (on the board's clock)
    R.shake(T.SHAKE_PX);
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

  // ---------------------------------------------------------- the round

  // humans: the people in this round, [{ name, color }] (online); alone it's you,
  // or nobody when watching the AIs.
  function newGame({ personas, aiOnly = false, humans = null } = {}) {
    game = E.createGame({ personas, humans: humans || (aiOnly ? [] : [{ name: localName(), color: PLAYER_COLOR }]) });
    showYou(false);
    youHideAt = 0;
    acc = 0;
    tickLen = E.tickMs(game);
    drawAlpha = 1;
    thinkQueue = guesting() ? [] : game.snakes.filter(s => s.persona);
    freezeUntil = 0;
    pendingCard = null;
    R.setGame(game);
    R.setViewer(player()?.id ?? -1); // your snake gets the bright outline
    Audio.weather('none');
    streak = 0;
    Chatter.reset(game);
    hideToast();
    buildTags();
    buildOpponents();
    updateHud(true);
    dirty = true;
  }

  // Start a round in the given mode. The round on the start card is used as-is;
  // anything else gets a fresh one.
  function start({ aiOnly = !game.withPlayer, going = false } = {}) {
    if (state === 'lobby' && !hosting()) return; // the lobby's own buttons decide
    if (online) {
      // Online, the host starts every round; friends wait for it.
      if (hosting() && (state === 'lobby' || state === 'over')) startOnlineRound();
      return;
    }
    if (state !== 'ready' || aiOnly !== !game.withPlayer) newGame({ aiOnly });
    waking = false;
    speed = watchSpeed = 1; // every round starts at normal speed (watching, you can speed it up again)
    state = 'countdown';
    beatsLeft = 3;
    beatTimer = 0;
    game.rivalsLine = pick(game.withPlayer ? FLAVOR.rivals : FLAVOR.spectators);
    askingStartOver = false;
    updateControls();
    if (!going) beat(); // (going: an arrow on the start card, straight to Go, no '3' knocked over it)
  }

  function beat() {
    if (beatsLeft === 0) return go();
    if (hosting()) online.room.broadcast({ t: 'phase', s: 'countdown', beat: beatsLeft });
    showBeat(beatsLeft);
    beatsLeft--;
    beatTimer = T.COUNTDOWN_BEAT;
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
      Audio.play('beat');
      return toast(FLAVOR.wakeBeat, T.COUNTDOWN_BEAT + 120, 'go', 'round', { quiet: true });
    }
    showYou(playerAlive());
    Audio.play('beat');
    if (n === 1 && !waking) Audio.play('riser', { crest: T.COUNTDOWN_BEAT / 1000 }); // (rising into Go!, and topping out on it; waking is no fanfare)
    showCard({ title: String(n), text: waking ? '' : game.rivalsLine, primary: online ? null : 'Go!', opponents: !waking, quiet: true, beat: true });
    if (!reducedMQ.matches) cardTitle.animate?.(BEAT, { duration: 480, easing: 'ease-out' }); // each number slams down
  }

  function go() {
    if (waking) { // (back from a nap: no fanfare, just going again)
      waking = false;
      state = 'running';
      hideCard();
      hideToast(true);
      if (napToast) { const [text, kind, level, rest] = napToast; napToast = null; toast(text, 2600, kind, level); waiting.push(...rest); }
      lastFrame = 0; // (acc as it was: the board carries on from the very moment it stopped)
      updateControls();
      return;
    }
    if (hosting()) online.room.broadcast({ t: 'phase', s: 'go' });
    if (guesting()) online.lastTickAt = performance.now();
    game.went = true; // (the round has had its Go: a nap from here on wakes through one quiet beat)
    if (document.activeElement?.closest?.('button') && !document.activeElement.closest('#overlay, #records')) document.activeElement.blur(); // (Space naps again: a header button Tabbed to last round lets go)
    state = 'running';
    hideCard();
    showYou(playerAlive());
    youHideAt = performance.now() + T.YOU_MS;
    Audio.play('go');
    if (guesting() && online.seat < 0) toast(FLAVOR.watchingFirst, 3000);
    else if (touchFirst && game.withPlayer && !powersTold && helpEl.getBoundingClientRect().top > innerHeight - 8) { powersTold = true; toast(FLAVOR.powersFirst, 2600, 'go', 'lesson'); } // (a short phone: the help under the board is off the screen; how to steer is beside YOU)
    else toast(pick(game.withPlayer && online?.seat !== -1 ? FLAVOR.go : FLAVOR.goWatch), 1300, 'go');
    flashFrame('go');
    acc = 0;
    lastFrame = 0;
    updateControls();
    say(game.withPlayer ? 'Go.' : 'And they’re off.');
  }

  function pause() {
    if (state !== 'running' || online) return; // no napping online: the round goes on for everyone
    if (pendingCard && !playerAlive()) return; // (your death's card is on its way: it comes up as it would, not under a nap)
    state = 'paused';
    waking = false;
    napToast = !toastEl.hidden && toastLevel !== 'news' ? [toastEl.textContent, toastEl.dataset.kind, toastLevel, waiting.slice()] : null; // (a lesson or round news, back on waking)
    napOver = !overlay.classList.contains('hidden') && shownCard?.reward ? shownCard : null; // your death card: back on waking
    Chatter.clearBubbles();
    showCard({
      title: 'Napping', text: `${pick(FLAVOR.pause)} ${FLAVOR.wake}`,
      primary: 'Wake up', secondary: touchFirst ? 'Start over' : null, focusCard: true,
    });
    updateControls();
  }

  // Start over? (Enter or R while you're alive in a round): napping, with the
  // card itself focused (not a button), so the same key again confirms; Space,
  // P, Escape or an arrow keeps going, at once (you were playing a moment ago).
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
    if (quick && game.went) {
      state = 'running';
      hideCard();
      lastFrame = 0;
      updateControls();
      return;
    }
    state = 'countdown';
    beatsLeft = 1;
    beatTimer = 0;
    waking = !!game.went; // (napped before its Go: the countdown's last beat, then the real Go, chime, banner and all)
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
      text: `${howYouDied(p)} · ${Records.ordinal(game.result.place)} place · score ${p.eaten}`,
      flavor: killLine(p), primary: 'Play again', secondary: 'Keep watching', reward: true,
      ...(online && { primary: 'Keep watching', secondary: hosting() ? 'Close room' : 'Leave room', actions: { primary: hideCard, secondary: leaveRoom } }),
    };
    updateControls();
  }

  function endRound() {
    state = 'over';
    Chatter.clearBubbles();
    flushAiResults();
    const survivors = game.snakes.filter(s => s.alive);
    const winner = survivors[0];
    const title = !winner ? 'Draw' : isMe(winner) ? 'You win!' : `${winner.name} wins`;
    const flavor = !winner ? pick(FLAVOR.draw) : isMe(winner) ? pick(FLAVOR.win) : winner.persona ? pick(winner.persona.win) : pick(FLAVOR.friendWin);
    if (isMe(winner)) Audio.play(game.newBest ? 'winBest' : 'win'); // (a win that's a new best: one fanfare, not two on top of each other)
    if (winner) { R.celebrate(isMe(winner) ? null : winner); flashFrame('win', isMe(winner)); } // confetti: all over for you, from its head for anyone else
    const me = player();
    const r = game.result;
    const how = me && !me.alive && me.cause ? howYouDied(me) : '';
    const yours = !me || !r ? ''
      : r.won ? `Won in ${Records.clock(r.survived)} · score ${me.eaten}`
      : r.draw ? `${how ? `${how} · shared 1st` : 'You shared 1st'} · lasted ${Records.clock(r.survived)} · score ${me.eaten}`
      : `${how ? `${how} · ${Records.ordinal(r.place)} place` : `You finished ${Records.ordinal(r.place)}`} · lasted ${Records.clock(r.survived)} · score ${me.eaten}`;
    if (online) {
      pendingCard = hosting()
        ? { title, flavor, text: yours, reward: !!me, primary: 'Play again', secondary: 'Close room', lobby: { players: true },
          actions: { primary: startOnlineRound, secondary: leaveRoom } }
        : { title, flavor, text: yours, reward: !!me, primary: null, secondary: 'Leave room', lobby: { status: FLAVOR.waiting(online.hostName, true) },
          actions: { secondary: leaveRoom } };
    } else pendingCard = game.withPlayer
      ? { title, flavor, reward: true, primary: 'Play again', secondary: 'Watch AIs', text: yours }
      : { title, flavor, primary: 'Play', secondary: 'Watch again' };
    cardAt = lastFrame + T.ROUND_END_PAUSE;
    updateControls();
  }

  // A snake's result is known as soon as its placement is. Yours is saved at
  // once; the AIs' are saved when the round actually finishes, so a round you
  // abandon leaves no trace. Watched rounds count too, marked as watched.
  function finishSnake(s, { place, won = false, draw = false }) {
    if (s.result) return;
    s.result = { place, won, draw, eaten: s.eaten, survived: game.time };
    // Online, everyone's result goes in everyone's Hall of Fame (the round id keeps it once).
    if (online && s.isPlayer && !isMe(s) && s.owner) Records.recordFriend(s.result, { name: s.name, color: s.color, owner: s.owner, round: game.roundId });
    if (!isMe(s)) return;
    const before = best;
    game.result = s.result;
    game.entryId = Records.recordPlayer({ ...s.result, killer: s.alive ? null : s.fatal === 'pecked' ? 'woodpecker' : s.killer, round: game.roundId });
    if (s.eaten > best) { best = s.eaten; Records.setBest(best); bestEl.textContent = best; }
    game.newBest = s.eaten > before && before > 0; // (a first round's score is a best by default: nothing to celebrate yet)
  }

  // (Online, only your own result is kept: the rivals' places are the host's game.)
  function flushAiResults() {
    if (online) return;
    for (const s of game.snakes) {
      if (s.isPlayer || !s.result || s.result.saved) continue;
      Records.addScore({ ...s.result, name: s.name, color: s.color, ai: true, watched: !game.withPlayer });
      s.result.saved = true;
    }
  }

  // Flavor for the death card: the killer's own line, if an AI got you (the
  // card's fact line already says why).
  function killLine(p) {
    const killer = game.snakes.find(s => s !== p && s.name === p.killer);
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
  const at = x => ({ pan: ((x + 0.5) / GRID * 2 - 1) * 0.8 });
  // The sound of each thing you eat (anything else is an apple).
  const EAT_CUES = { goldcap: 'wrap', golden: 'golden', leaf: 'leaf', pellet: 'meat', mushroom: 'mushroom', beetle: 'crunch' };
  // Apples eaten in quick succession climb a scale: a streak you can hear.
  let streak = 0, streakAt = -1e9;
  function sounds(dying, wasAlive) {
    const me = player();
    for (const e of game.events) {
      if (e.type === 'eat' && isMe(e.snake)) {
        if (e.kind !== 'mushroom') { streak = game.time - streakAt < 2600 ? Math.min(streak + 1, 7) : 0; streakAt = game.time; }
        Audio.play(EAT_CUES[e.kind] || 'eat', { streak: e.kind === 'mushroom' ? 0 : streak, gold: !!e.gold, ...at(e.x) });
        bump(scoreEl);
      } else if (e.type === 'eat' && e.kind === 'goldcap') Audio.play('wrap', { rival: true, ...at(e.x) }); // (someone else's golden mushroom: softer, further off)
      else if (e.type === 'woodpecker') { Audio.play('call'); Audio.play('riser'); }
      else if (e.type === 'aim') Audio.play('aim', at(e.x));
      else if (e.type === 'peck' && e.cells?.length) { Audio.play('drum', at(e.x)); Audio.play('crash', at(e.x)); }
      else if (e.type === 'spawn' && e.kind === 'beetle') Audio.play('beetle', at(e.x));
      else if (e.type === 'starving' && isMe(e.snake)) Audio.play('hungry');
      else if (e.type === 'charge') Audio.play('crackle', at(e.x));
      else if (e.type === 'strike') Audio.play('thunder', at(e.x));
      else if (e.type === 'gust') Audio.play('gust');
      else if (e.type === 'burrow') Audio.play('burrow', at(e.x));
      else if (e.type === 'dive' || e.type === 'emerge') Audio.play('dig', at(e.x));
      else if (e.type === 'rainbow') Audio.play('rainbow', at(e.x));
      else if (e.type === 'weather' && e.kind === 'rain') Audio.play('rain');
      else if (e.type === 'weather' && e.kind === 'snow') Audio.play('snow');
      else if (e.type === 'ember') Audio.play('ember', at(e.x));
      else if (e.type === 'crash') { Audio.play(isMe(e.snake) ? 'bonk' : 'bonked', at(e.x)); if (isMe(e.snake) && youHideAt) { youHideAt = 0; showYou(false); } } // (YOU makes room for the -1 and the stars)
      else if (e.type === 'alight') Audio.play('alight', { rival: !isMe(e.snake), ...at(e.snake.body[0].x) });
      else if (e.type === 'singe' && isMe(e.snake)) Audio.play('singe');
      else if (e.type === 'baked') Audio.play('bake', at(e.x));
      else if (e.type === 'ash') Audio.play('ash', at(e.x));
      else if (e.type === 'cut') Audio.play('snip', at(e.x));
      else if (e.type === 'leap') Audio.play('leap', { rival: !isMe(e.snake), gold: !!e.gold, ...at(e.x) });
      else if (e.type === 'dash') Audio.play(e.plain ? 'flash' : 'dash', { rival: !isMe(e.snake), ...at(e.x) }); // (a plain flash, or a golden one)
      else if (e.type === 'lastApples') Audio.play('lastApples');
      else if (e.type === 'douse') Audio.play('douse', at(e.x));
      else if (e.type === 'fizzle' && isMe(e.snake)) { Audio.play('thunk', at(e.snake.body[0].x)); (e.flash ? e.snake.tag?.flash : e.snake.tag?.jump)?.animate?.(reducedMQ.matches ? REFUSED : NUDGE, { duration: reducedMQ.matches ? 420 : 260, easing: 'ease-out' }); } // (pressed, and it couldn't go: you hear it, and its chip shakes its head; with reduced motion it flashes)
    }
    for (const s of dying) if (/blew up/.test(s.cause)) Audio.play('boom', at(s.body[0].x));
    for (const s of dying) {
      if (isMe(s)) continue;
      // You took them out: a knockout punch. Anyone else: a far-off thud.
      Audio.play(me && s.killerId === me.id && s.killer !== 'self' ? 'ko' : 'rivalDeath', at(s.body[0].x));
      flashFrame('kill');
    }
    if (wasAlive && !playerAlive()) Audio.play('death');
    // A near miss: your head right next to a rival's.
    if (me?.alive) {
      const h = me.body[0];
      for (const o of game.snakes) if (o !== me && o.alive && Math.abs(o.body[0].x - h.x) <= 1 && Math.abs(o.body[0].y - h.y) <= 1) { Audio.play('close', at(o.body[0].x)); break; }
    }
    // Crossing a rival's border (into Sovereign's realm, a colony): a drum
    // knock, and the first time in a round, a word on whose land it is.
    // (Land is one rule everywhere: within radius + LAND_REACH of the middle.)
    if (me?.alive) {
      const h = me.body[0];
      const onLand = f => Math.hypot(h.x - f.x, h.y - f.y) <= f.radius + T.LAND_REACH;
      let inside = null;
      for (const o of game.snakes) {
        if (o === me || !o.alive) continue;
        if (o.memory.home && onLand(o.memory.home)) inside = { o, home: true };
        for (const c of o.memory.colonies || []) if (onLand(c)) inside ||= { o, home: false };
      }
      if (inside && !inField) {
        Audio.play('field', at(h.x));
        if (!game.toldField && state === 'running') { game.toldField = true; toast(FLAVOR.field[inside.home ? 'home' : 'colony'](inside.o.name), 2400, 'warn'); }
      }
      inField = !!inside;
    }
    Audio.weather(state === 'running' ? game.weather?.kind : 'none');
  }
  let inField = false;

  // How much danger you're in, for the music: a rival's head close to yours,
  // or little room ahead. 0..1.
  function dangerOf() {
    const me = player();
    if (!me?.alive || !game) return 0;
    const h = me.body[0];
    let near = 99;
    for (const o of game.snakes) if (o !== me && o.alive) near = Math.min(near, Math.abs(o.body[0].x - h.x) + Math.abs(o.body[0].y - h.y));
    let danger = near <= 1 ? 1 : near <= 4 ? (5 - near) / 4 : 0;
    // Room ahead: how many of the next three cells straight on are open.
    let open = 0;
    for (let i = 1; i <= 3; i++) {
      const x = h.x + me.dir.x * i, y = h.y + me.dir.y * i;
      if (x < 0 || y < 0 || x >= GRID || y >= GRID || game.holes.has(y * GRID + x)) break;
      if (game.snakes.some(o => o.alive && o.body.some(c => c.x === x && c.y === y))) break;
      open++;
    }
    if (open === 0) danger = Math.max(danger, 0.85); else if (open === 1) danger = Math.max(danger, 0.5);
    return danger;
  }

  // Banners for the big moments of a round (one per tick, most important
  // first). Spawns are news once a round; what happens to you is a lesson
  // the first time; repeats are left to the board's own floaters.
  function announce(dying) {
    const alive = game.snakes.filter(s => s.alive);
    if (player() && dying.includes(player())) { // (your own death: its card is a moment away, and says it; nothing over the freeze-frame)
      if (!game.firstBlood) { game.firstBlood = true; Audio.play('stinger'); }
      return;
    }
    if (dying.length && !game.firstBlood) {
      game.firstBlood = true;
      Audio.play('stinger');
      if (alive.length !== 2) { // (down to two: that's the bigger news, below)
        const v = dying[0];
        const killer = game.snakes.find(o => o.name === v.killer && o !== v);
        const names = dying.map(d => who(d, true));
        const all = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
        return toast(dying.length > 1 ? `First out: ${all}.` : killer && killer.alive ? `First blood: ${who(killer, true)} got ${who(v, true)}.` : killer ? `First out: ${who(v, true)} and ${who(killer, true)}, head-on.` : `First out: ${who(v, true)} ${causeFor(v)}.`, 2800, 'kill', 'round');
      }
    }
    for (const e of game.events) if (e.type === 'woodpecker') { flashFrame('bird', true); return toast(lineFor('woodpecker'), 2800, 'bird', 'round'); }
    for (const e of game.events) if (e.type === 'lastApples') return toast(FLAVOR.lastApples, 2800, '', 'round'); // (sudden death's trickle: once a round)
    if (dying.length && alive.length === 2) {
      const [a, b] = isMe(alive[0]) ? [alive[1], alive[0]] : alive;
      Audio.play('riser');
      return toast(`It’s down to ${who(a)} and ${who(b, true)}.`, 2800, 'kill', 'round');
    }
    const me = player();
    const once = key => !game.told?.[key] && ((game.told ||= {})[key] = true); // (the first time this round)
    const newsOnce = key => newsFree() && once(key); // (news that can't show now waits for its next chance, not spent on nothing)
    if (me?.alive) {
      const small = me.body.length <= T.MIN_LENGTH;
      // Your first crash: the rule, first (landing at 3, the lesson says so too).
      if (game.events.some(e => e.type === 'crash' && e.snake === me) && once('crash')) {
        if (small) once('atThree');
        return toast(small ? FLAVOR.youCrashToThree : pick(FLAVOR.youCrash), 3000, 'warn', 'lesson');
      }
      const wrapLeft = me.wrapUntil - game.time;
      if (wrapLeft > 0 && wrapLeft <= T.WRAP_WARN_MS && !game.toldWrapEnd) { game.toldWrapEnd = true; return toast(pick(FLAVOR.wrapEnding(Math.round(T.WRAP_WARN_MS / 1000))), 1800, 'warn', 'lesson', { still: () => me.alive && me.wrapUntil > game.time }); }
      if (wrapLeft > T.WRAP_WARN_MS) game.toldWrapEnd = false;
      const left = E.hungerLeft(game, me);
      const warnAt = T.HUNGER_WARN_MS * (small ? 1.5 : 1); // (at your smallest, starving is the end: a little earlier, and sharper)
      if (left < warnAt && !game.warnedHunger) { game.warnedHunger = true; Audio.play('hungerWarn'); return toast(small ? FLAVOR.youStarvingSmall : pick(FLAVOR.youHungry), 2800, 'warn', 'lesson'); }
      if (left > warnAt) game.warnedHunger = false;
      if (small && game.time > 1000 && once('atThree')) return toast(pick(FLAVOR.youAtThree), 2600, 'warn', 'lesson', { still: () => me.alive && me.body.length <= T.MIN_LENGTH });
    }
    for (const e of game.events) {
      if (e.type === 'strike') flashFrame('storm', true);
      if (e.type === 'strike' && !game.struck && game.weather?.kind === 'storm') { game.struck = true; return toast(pick(FLAVOR.strike), 2200, 'fire'); } // (a storm's last bolt, landing in the rain after it: the bolt, flash and thunder say it)
      if (e.type === 'weather' && e.kind === 'storm') game.struck = false;
      if (e.type === 'weather' && FLAVOR.weather[e.kind]) { flashFrame(e.kind); return toast(pick((!playerAlive() && FLAVOR.weatherWatch[e.kind]) || FLAVOR.weather[e.kind]), 2800, e.kind); }
      if (e.type === 'rainbow') { flashFrame('gold', true); if (newsOnce('rainbow')) return toast(lineFor('rainbow'), 2800, 'gold'); }
      if (e.type === 'burrow' && newsOnce('burrow') && !game.events.some(o => o.type === 'spawn' && o.kind === 'beetle')) return toast(pick(FLAVOR.burrow), 2200, 'beetle'); // (a beetle out of it this tick speaks for both)
      if (e.type === 'spawn' && e.kind === 'golden') { flashFrame('gold'); if (newsOnce('golden')) return toast(pick(FLAVOR.golden), 2800, 'gold'); }
      if (e.type === 'spawn' && e.kind === 'beetle' && e.gold) { flashFrame('gold'); if (newsOnce('goldBeetle')) return toast(lineFor('goldBeetle'), 2600, 'gold'); }
      if (e.type === 'spawn' && e.kind === 'beetle') { flashFrame('beetle'); if (newsOnce('beetle')) return toast(pick(FLAVOR.beetle), 2200, 'beetle'); }
      if (e.type === 'spawn' && e.kind === 'leaf') { flashFrame('gold'); if (newsOnce('leaf')) return toast(lineFor('leaf'), 2400, 'gold'); }
      if (e.type === 'spawn' && e.kind === 'goldcap') { flashFrame('gold'); if (newsOnce('goldcap')) return toast(lineFor('goldcap'), 2400, 'gold'); }
      if (e.type === 'peck' && me?.alive && e.under?.includes(me.id) && once('peckedUnder')) return toast(FLAVOR.youPeckedUnder, 2800, 'bird', 'lesson'); // (struck under your body: a bridge, not a cut)
      if (!me || !isMe(e.snake || {}) && e.by !== me.id) continue; // (the rest is about you)
      if (e.type === 'eat' && e.own && once('ownBead')) return toast(FLAVOR.youOwnBead, 2600, 'you', 'lesson');
      if (e.type === 'eat' && e.gold) { flashFrame('gold', true); return toast(FLAVOR.youGoldBeetle(e.snake.leaps), 3000, 'gold', 'lesson'); }
      if (e.type === 'eat' && e.kind === 'leaf') { flashFrame('gold', true); return toast(FLAVOR.youLeaf(e.snake.dashes), 3200, 'gold', 'lesson'); }
      if (e.type === 'eat' && e.kind === 'goldcap') { flashFrame('gold', true); return toast(FLAVOR.youGoldcap(Math.round(T.WRAP_MS / 1000)), 3000, 'gold', 'lesson'); }
      if (e.type === 'eat' && e.kind === 'beetle') flashFrame('beetle');
      if (e.type === 'eat' && e.kind === 'golden') flashFrame('gold', true);
      if (e.type === 'eat' && e.kind === 'mushroom' && once('mushroom')) return toast(pick(FLAVOR.youMushroom), 1800, 'warn');
      if (e.type === 'leap' && !e.gold && once('leap')) return toast(FLAVOR.youLeapFirst, 3000, 'you', 'lesson');
      if (e.type === 'dash' && e.snake === me) flashedEver = true; // (you know the key: no more telling)
      if (e.type === 'dash' && !e.plain && once('dash')) return toast(FLAVOR.youDashFirst, 2800, 'gold', 'lesson');
      const refused = e.type === 'fizzle' && (e.flash ? FLAVOR.fizzleFlash : FLAVOR.fizzle)[e.why];
      if (refused && once((e.flash ? 'fizzleFlash' : 'fizzle') + e.why)) return toast(refused, 1800, 'warn', 'lesson');
      if (e.type === 'cut' && e.by === me.id) return toast(FLAVOR.youSnip(who(e.snake, true)), 1800, 'gold');
      if (e.type === 'cut' && e.by != null) return toast(FLAVOR.youSnipped(game.snakes[e.by]?.name || 'Someone'), 2200, 'warn', 'lesson');
      if (e.type === 'alight') { flashFrame('kill'); if (once('alight')) return toast(pick(FLAVOR.youAlight), 2600, 'fire', 'lesson'); } // (later burns: the flames and the -1s say it)
    }
    // A few seconds in, your flash ready and never used yet (this visit): its key, once a round.
    if (me?.alive && !flashedEver && game.time >= 6000 && E.flashIn(game, me) === 0 && newsFree() && once('flashKey')) return toast(FLAVOR.flashKey, 3200, 'you', 'lesson');
    if (me?.alive && me.leapArmed >= 0 && me.leapArmed === game.tick - 1 && !game.events.some(e => e.snake === me && (e.type === 'leap' || e.type === 'dash' || e.type === 'fizzle')) ) { // (it ran out: too early, with a hurdle on the line, or nothing to hop at all)
      const early = hurdleAhead(me, 4);
      if (once(early ? 'leapEarly' : 'leapNothing')) return toast(early ? FLAVOR.leapEarly : FLAVOR.leapNothing, 2600, 'you', 'lesson');
    }
    for (const e of game.events) if (e.type === 'baked' && newsOnce('baked')) return toast(lineFor('baked'), 2600, 'fire');
  }

  // Is there something to hop on your line, within n cells (a body, a hole, fire)?
  function hurdleAhead(s, n) {
    for (let i = 1, x = s.body[0].x, y = s.body[0].y; i <= n; i++) {
      x += s.dir.x; y += s.dir.y;
      if (x < 0 || y < 0 || x >= GRID || y >= GRID) return false;
      const k = y * GRID + x;
      if (game.holes.has(k) || game.fires?.has(k)) return true;
      for (const o of game.snakes) if (o.alive && o.body.some(c => c.x === x && c.y === y)) return true;
    }
    return false;
  }

  // Could a routine banner show now (no card up, nothing holding the banner)?
  const newsFree = () => overlay.classList.contains('hidden') && (toastEl.hidden || performance.now() >= toastHold);

  // A banner fades while a head passes under it, so it never hides the board
  // (its size is measured once a banner, so this reads no layout).
  let toastTimer, toastW = 0, toastH = 0, toastUnder = '';
  function toastFade() {
    let top = false, bottom = false;
    if (!toastEl.hidden && boardPx && game) {
      const cell = boardPx / GRID;
      const rows = Math.ceil((toastH + 12) / cell), half = toastW / 2 / cell; // (its real size: a long banner on a phone wraps to several lines)
      const under = (x, y) => { // (a cell the banner would hide, if it's one that matters)
        if (Math.abs(x + 0.5 - GRID / 2) >= half + 0.5) return;
        if (y < rows) top = true;
        if (y >= GRID - rows) bottom = true;
      };
      for (const s of game.snakes) if (s.alive) under(s.body[0].x, s.body[0].y);
      if (steerHintOn && hintBox.y < toastH + 16 && Math.abs(hintBox.x + hintBox.w / 2 - boardPx / 2) < (toastW + hintBox.w) / 2) top = true; // (the steering hint, by YOU near the top: the banner makes way)
      for (const k of game.woodpecker?.target || []) under(k % GRID, Math.floor(k / GRID)); // (the patch it's warning about)
      if (game.fires) for (const [k, f] of game.fires) if (f.strike && f.from > game.tick) under(k % GRID, Math.floor(k / GRID)); // (a crackle about to strike)
    }
    const place = !top ? '' : bottom ? 'under' : 'low'; // moved down, or (if a head's there too) faded
    if (place !== toastUnder) {
      toastEl.classList.toggle('low', place === 'low');
      toastEl.classList.toggle('under', place === 'under');
      toastUnder = place;
    }
  }
  // kind styles the banner for its moment: kill, gold, beetle, bird (the
  // woodpecker), warn, fire, you (a lesson about your own powers, or your own tail), go, and the
  // weather's own (sun, wind, rain, storm, snow). level says how much it
  // matters: 'round' (what changes the round: first blood, the last two, the
  // woodpecker, friends coming and going) always shows; a 'lesson' (a rule,
  // the first time it happens to you) holds for LESSON_HOLD_MS before
  // anything but round news may replace it, and one waiting lesson shows
  // (up to three lessons wait, each shown when the hold ends, if it still holds); 'news' (the weather, a spawn) is dropped while a lesson
  // holds. While a card is up, only round news. Screen readers hear round
  // news and lessons (and the weather), not the chatter of spawns.
  // opts: { quiet } (shown, not said: something else says it), { still }
  // (a lesson that waits is shown only if this still holds).
  let toastLevel = 'news', toastHold = 0;
  const waiting = []; // lessons waiting for the one showing: [text, ms, kind, opts]
  const LEVELS = { news: 0, lesson: 1, round: 2 };
  function toast(text, ms = 2800, kind = '', level = 'news', opts = {}) {
    const now = performance.now();
    if (level !== 'round' && !overlay.classList.contains('hidden')) return; // (a card's up)
    if (!toastEl.hidden && now < toastHold && LEVELS[level] <= LEVELS[toastLevel] && level !== 'round') {
      if (level === 'lesson' && waiting.length < 3) { // (it waits for the hold to end, not the whole banner)
        waiting.push([text, ms, kind, opts]);
        clearTimeout(toastTimer);
        toastTimer = setTimeout(nextToast, toastHold - now);
      }
      return;
    }
    toastLevel = level;
    toastHold = now + Math.min(ms, level === 'news' ? T.NEWS_HOLD_MS : T.LESSON_HOLD_MS);
    toastEl.classList.remove('settled', 'leaving'); // (a new banner slams in)
    toastEl.dataset.kind = kind;
    toastEl.textContent = text;
    toastEl.hidden = false;
    toastW = toastEl.offsetWidth; toastH = toastEl.offsetHeight; // (measured once a banner, unscaled by its slam)
    if (!opts.quiet && (level !== 'news' || kind in FLAVOR.weather)) say(text);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(nextToast, ms);
  }
  // The next lesson that still holds, or the banner fades.
  function nextToast() {
    toastHold = 0;
    while (waiting.length) {
      const [t, m, k, o] = waiting.shift();
      if (!o.still || o.still()) return toast(t, m, k, 'lesson', o);
    }
    hideToast(true);
  }
  // Gone at once (a card is coming up), or, when its time is up, faded out.
  function hideToast(fade = false) {
    clearTimeout(toastTimer);
    toastHold = 0;
    if (!fade) waiting.length = 0;
    if (fade && !reducedMQ.matches && !toastEl.hidden) {
      toastEl.classList.add('leaving');
      toastTimer = setTimeout(() => { toastEl.hidden = true; toastEl.classList.remove('leaving'); }, 240);
    } else {
      toastEl.hidden = true;
      toastEl.classList.remove('leaving');
    }
  }
  toastEl.addEventListener('animationend', e => { if (e.animationName === 'slam') toastEl.classList.add('settled'); });

  // Screen reader announcements (a permanently rendered, visually hidden region).
  function say(text) { announcer.textContent = text; }

  // (Pops only scale, so the compositor runs them: no repaint, even on a bite.)
  const BUMP = [{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: 0.4 }, { transform: 'scale(1)' }];
  const BUMP_TIMING = { duration: 280, easing: 'ease-out' };
  function bump(el, frames = BUMP) {
    if (!reducedMQ.matches) el.animate?.(frames, BUMP_TIMING);
  }
  // A tag's length when it changes, a tag
  // knocked out of the round, and a tag taking the lead.
  const TAG_BUMP = [{ transform: 'scale(1)' }, { transform: 'scale(1.45)', offset: 0.35 }, { transform: 'scale(1)' }];
  const KNOCK = [
    { transform: 'translateX(0) rotate(0)', backgroundColor: '#fca5a5' },
    { transform: 'translateX(-6px) rotate(-2deg)', offset: 0.18 },
    { transform: 'translateX(5px) rotate(2deg)', offset: 0.4 },
    { transform: 'translateX(-3px) rotate(-1deg)', offset: 0.65 },
    { transform: 'translateX(0) rotate(0)', backgroundColor: 'rgba(246, 236, 210, 0.66)' },
  ];
  const REFUSED = [{ boxShadow: 'inset 0 0 0 2px #be123c' }, { boxShadow: 'inset 0 0 0 2px #be123c', offset: 0.6 }, { boxShadow: 'inset 0 0 0 0 rgba(190,18,60,0)' }];
  const NUDGE = [{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)', offset: 0.25 }, { transform: 'translateX(3px)', offset: 0.6 }, { transform: 'translateX(0)' }];
  const CROWNED = [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: 0.4 }, { transform: 'scale(1)' }];
  function knock(el) {
    if (!reducedMQ.matches) el.animate?.(KNOCK, { duration: 480, easing: 'ease-out' });
  }

  // The frame lights up round its edge for the big moments, in the moment's
  // colour (only its opacity animates, so it's cheap).
  const GLOW = { gold: '#fde68a', beetle: '#34d399', kill: '#ef4444', bird: '#f97316', go: '#a3e635', win: '#fde68a', sun: '#fbbf24', wind: '#86efac', rain: '#60a5fa', storm: '#c4b5fd', snow: '#e0f2fe' };
  function flashFrame(kind, strong = false) {
    if (reducedMQ.matches || !glowEl?.animate) return;
    glowEl.style.setProperty('--glow', GLOW[kind]);
    glowEl.animate([{ opacity: 0 }, { opacity: strong ? 1 : 0.75, offset: 0.12 }, { opacity: 0 }], { duration: strong ? 1500 : 800, easing: 'ease-out' });
  }

  // ----------------------------------------------------------- the cards

  // card = { title, text, flavor, primary, secondary, opponents, reward, quiet,
  //   friends (show "Play with friends"), lobby (which lobby parts, see renderLobby),
  //   actions: { primary, secondary } (what the buttons do, instead of the usual) }
  let cardActions = null;
  function showCard(card) {
    hideToast();
    shownCard = card;
    cardTitle.textContent = card.title;
    setText(cardText, card.text || '');
    cardText.hidden = !card.text;
    flavorEl.textContent = (card.flavor || '').replace(/^\*(.+)\*$/, '$1');
    flavorEl.hidden = !card.flavor;
    opponentsEl.hidden = !card.opponents;
    hintEl.hidden = state !== 'ready';
    clearTimeout(blurbTimer);
    cardText.classList.remove('said');
    helpEl.hidden = state === 'ready'; // the start card already shows the controls
    startBtn.hidden = !card.primary;
    if (card.primary) startBtn.textContent = card.primary;
    watchBtn.hidden = !card.secondary;
    if (card.secondary) watchBtn.textContent = card.secondary;
    friendsBtn.hidden = !card.friends;
    // In the lobby the tags would show the solo round behind the card, not who's playing.
    tagsEl.style.visibility = state === 'lobby' ? 'hidden' : '';
    cardActions = card.actions || null;
    renderLobby(card.lobby);

    // The reward: a new best gets its own moment; the Hall of Fame asks for a
    // name only when the round really earned a place there.
    badgeEl.hidden = true;
    nameRow.hidden = true;
    if (card.reward && game.entryId) {
      if (game.newBest && !game.celebrated) {
        game.celebrated = true;
        Audio.play('best');
        R.celebrate();
        flashFrame('win', true);
      }
      if (game.newBest) { badgeEl.textContent = FLAVOR.newBest(best); badgeEl.hidden = false; }
      const rank = yourRank();
      if (rank.overall && (rank.overall <= 3 || game.newBest)) {
        nameRank.textContent = Records.hasName() ? `Hall of Fame #${rank.overall}, as ${Records.getName()}.` : `Hall of Fame #${rank.overall}. ${CARVE}`;
        nameRow.hidden = false;
      } else if (rank.personal === 1 && game.newBest) {
        nameRank.textContent = Records.hasName() ? `Top of your own list, as ${Records.getName()}.` : `Top of your own list. ${CARVE}`;
        nameRow.hidden = false;
      }
      if (!nameRow.hidden && game.carveOffered && game.carveOffered !== card.title && document.activeElement !== nameInput) nameRow.hidden = true; // (offered once: the round-over card after your death card doesn't ask again)
      if (!nameRow.hidden) game.carveOffered = card.title;
      if (!nameRow.hidden && document.activeElement !== nameInput) nameInput.value = Records.hasName() ? Records.getName() : '';
      if (!nameRow.hidden) namingEntry = game.entryId;
    }

    overlay.querySelector('.card').classList.toggle('beat', !!card.beat); // the countdown: a big number
    overlay.classList.remove('hidden');
    overlay.querySelector('.card').scrollTop = 0;
    if (!card.quiet) say(announcement(card));
    // Focus: the card itself on the first card, on a countdown (Space naps
    // there, so a focused Go! mustn't take it) and when the carve is offered
    // (Tab goes to the name field); otherwise its main button.
    if (document.activeElement !== nameInput) {
      const cardEl = overlay.querySelector('.card');
      (firstCard || card.beat || card.focusCard || !nameRow.hidden ? cardEl : card.primary ? startBtn : card.secondary ? watchBtn : cardEl).focus({ preventScroll: true });
      firstCard = false;
    }
    updateControls();
  }

  // The carve is offered, never pressed on you: on a keyboard the card keeps
  // focus (R, Enter and Space mean what they always do) and Tab reaches the field.
  const CARVE = touchFirst ? 'Carve your name:' : 'Tab to carve your name:';

  // Your Hall of Fame rank. Before the round is over, the snakes still alive
  // haven't been saved, but they'll all finish ahead of you, so they count.
  function yourRank() {
    const rank = Records.rankOf(game.entryId);
    if (state === 'over' || !rank.overall) return rank;
    let ahead = 0;
    for (const s of game.snakes) if (s.alive && (!online || (s.isPlayer && s.owner))) ahead++;
    const overall = rank.overall + ahead;
    return { overall: overall <= Records.MAX_SCORES ? overall : 0, personal: rank.personal };
  }

  // A card as a screen reader hears it: whole sentences (" · " would be read
  // as "dot"), plus the new-best badge and the name prompt.
  function announcement(card) {
    const sentence = t => (/[.!?…:]$/.test(t) ? t : `${t}.`);
    const unstar = t => t && t.replace(/^\*(.+)\*$/, 'Mimed: $1'); // (Mute's lines are stage directions: "star" isn't a word)
    const parts = [card.title, card.text && card.text.replaceAll(' · ', ', '), unstar(card.flavor),
      !badgeEl.hidden && badgeEl.textContent, !nameRow.hidden && nameRank.textContent];
    return parts.filter(Boolean).map(sentence).join(' ');
  }

  function hideCard() {
    overlay.classList.add('hidden');
    shownCard = null;
  }

  // The roll-call on the start and countdown cards: every rival, AIs with a
  // word on how they play, friends tagged as friends.
  function buildOpponents() {
    opponentsEl.textContent = '';
    for (const s of game.snakes) {
      if (isMe(s) || (!s.persona && !online)) continue;
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = dotColor(s);
      const name = document.createElement('strong');
      name.textContent = s.name;
      const blurb = document.createElement('span');
      blurb.className = 'blurb';
      blurb.textContent = s.persona ? s.persona.blurb : 'Your friend. For now.';
      li.append(dot, name, ' ', blurb);
      opponentsEl.append(li);
    }
    const tip = document.createElement('li'); // (shown only where the blurbs are hidden: a small board)
    tip.className = 'tap-tip';
    tip.textContent = FLAVOR.tapTip;
    opponentsEl.append(tip);
  }

  // YOU over your snake, from the countdown till a few seconds in (or just
  // after you steer), and beside its arrow how to steer, until you do.
  function showYou(on) {
    R.showYou(on);
    if (on && !game.steered && player()) showSteerHint(); else hideSteerHint();
  }
  const steerHintEl = $('steer-hint'), hintAt = { x: 0, y: 0 }, hintBox = { x: 0, y: 0, w: 0, h: 0 };
  let steerHintOn = false;
  function showSteerHint() {
    if (steerHintOn) return;
    steerHintEl.textContent = FLAVOR.steerHint;
    steerHintEl.classList.add('on');
    hintBox.w = steerHintEl.offsetWidth; hintBox.h = steerHintEl.offsetHeight; // (measured once a round: no layout reads in the loop)
    steerHintOn = true;
    placeSteerHint();
  }
  function hideSteerHint() {
    if (!steerHintOn) return;
    steerHintOn = false;
    steerHintEl.classList.remove('on');
  }
  // Level with the YOU label: over your head (under it heading down, or by
  // the top edge, as the arrow goes), on whichever side has room. It rides
  // along with your head (a transform: the compositor's work).
  function placeSteerHint() {
    const me = player();
    if (!me?.alive || !boardPx) return hideSteerHint();
    R.headPx(me, drawAlpha, boardPx, hintAt);
    const c = boardPx / GRID;
    let sgn = me.dir.y > 0 ? 1 : -1;
    if (sgn < 0 ? hintAt.y < c * 2.6 : hintAt.y > boardPx - c * 2.6) sgn = -sgn;
    hintBox.x = Math.round(hintAt.x + c * 1.3 + hintBox.w <= boardPx - 4 ? hintAt.x + c * 1.3 : Math.max(4, hintAt.x - c * 1.3 - hintBox.w));
    hintBox.y = Math.round(hintAt.y + sgn * c * 2.5 - hintBox.h / 2);
    steerHintEl.style.transform = `translate(${hintBox.x}px, ${hintBox.y}px)`;
  }

  // ------------------------------------------------------------- the HUD

  // Each snake's tag (dot, name, length, hunger bar). Values are written only
  // when they change.
  function buildTags() {
    tagsEl.textContent = '';
    for (const s of game.snakes) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="dot"></span>${s.persona ? '<button class="name" type="button"></button>' : '<span class="name"></span>'}<span class="sr-only"></span><span class="pow" aria-hidden="true" hidden></span><span class="len"></span><span class="hunger"><i></i></span>`;
      li.querySelector('.name').textContent = isMe(s) ? 'You' : s.name;
      li.title = s.persona ? `${s.name}: ${s.persona.blurb}` : isMe(s) ? 'You' : `${s.name}, a friend`;
      if (s.persona) li.dataset.blurb = `${s.name}: ${s.persona.blurb}`; // tapped (phones have no tooltips), or its name pressed with a key, it says how it plays
      if (s.personaKey === 'capricious') li.querySelector('.dot').dataset.ring = ''; // its pink ring, as on the board
      const mark = R.markOf(s.color);
      if (s.isPlayer && mark) li.querySelector('.dot').dataset.mark = mark;
      tagsEl.append(li);
      s.tag = { li, dot: li.querySelector('.dot'), state: li.querySelector('.sr-only'), len: li.querySelector('.len'), bar: li.querySelector('.hunger i'), pow: li.querySelector('.pow'), last: {} };
    }
  }

  let blurbTimer = 0;
  tagsEl.addEventListener('click', e => {
    const li = e.target.closest?.('li'), s = li && game.snakes.find(o => o.tag?.li === li);
    if (!s || state === 'running') return;
    const blurb = isMe(s) ? yourPowerWords(s) : li.dataset.blurb ? li.dataset.blurb + powerWords(s) : '';
    if (!blurb) return;
    if (overlay.classList.contains('hidden')) return toast(blurb, 3200);
    clearTimeout(blurbTimer);
    cardText.textContent = blurb;
    cardText.hidden = false;
    cardText.classList.add('said');
    say(blurb);
    blurbTimer = setTimeout(restoreText, 3200);
  });
  // What the chips mean, in words (phones have no tooltips).
  function yourPowerWords(s) {
    const how = (left, gold) => gold ? `${gold} golden` : left === 0 ? 'ready' : left === Infinity ? 'not at 3' : 'resting';
    return `${touchFirst ? 'A tap' : 'Space'} jumps: ${how(E.leapIn(game, s), s.leaps)}. ${touchFirst ? 'A swipe ahead' : 'E or Shift'} flashes: ${how(E.flashIn(game, s), s.dashes)}.`;
  }
  // Golden powers held, as words: ['2 golden jumps', '1 golden flash'].
  const goldWords = s => [s.leaps > 0 && `${s.leaps} golden jump${s.leaps === 1 ? '' : 's'}`, s.dashes > 0 && `${s.dashes} golden flash${s.dashes === 1 ? '' : 'es'}`].filter(Boolean);
  const powerWords = s => { const held = goldWords(s); return (held.length ? ` Holding ${held.join(' and ')}.` : '') + (s.wrapUntil > game.time ? ' The edges wrap for it.' : ''); };

  // The card's own words again, after a rival's line stood in for them.
  function restoreText() {
    clearTimeout(blurbTimer);
    cardText.classList.remove('said');
    setText(cardText, shownCard?.text || '');
    cardText.hidden = !shownCard?.text;
  }

  function updateHud(force = false) {
    const score = player()?.eaten ?? 0;
    if (force || scoreEl.textContent !== String(score)) scoreEl.textContent = score;
    // Best follows your score live once you pass it (it's saved when your round ends).
    const shownBest = Math.max(best, score);
    if (force || bestEl.textContent !== String(shownBest)) {
      if (!force && score > best && !game.passedBest) { game.passedBest = true; bump(bestEl); }
      bestEl.textContent = shownBest;
    }
    // The leader (the longest snake, if one is longest) wears a crown.
    let lead = null, top = 0;
    for (const s of game.snakes) {
      if (!s.alive) continue;
      if (s.body.length > top) { top = s.body.length; lead = s; } else if (s.body.length === top) lead = null;
    }
    for (const s of game.snakes) {
      const t = s.tag, last = t.last;
      const dot = dotColor(s);
      const leading = s === lead;
      const len = s.alive ? String(s.body.length) : 'out';
      const full = s.alive ? Math.max(0, Math.min(1, E.hungerLeft(game, s) / T.HUNGER_MS)) : 0;
      const bar = Math.round(full * 100);
      const starving = s.alive && full < 0.3;
      if (force || last.dot !== dot) { t.dot.style.background = dot; last.dot = dot; }
      if (force || last.len !== len) {
        t.len.textContent = len;
        if (!force && s.alive && last.len !== undefined) bump(t.len, TAG_BUMP);
        last.len = len;
      }
      // Powers, in words for screen readers (the chips themselves are hidden from them).
      const holds = !s.alive ? '' : goldWords(s).map(w => `, ${w}`).join('');
      const said = !s.alive ? ', ' : `${starving ? ', starving' : ''}${leading ? ', in the lead' : ''}${holds}${s.wrapUntil > game.time ? `, the edges wrap for ${isMe(s) ? 'you' : s.persona ? 'it' : 'them'}` : ''}, length `; // (for screen readers)
      if (force || last.said !== said) { t.state.textContent = said; last.said = said; }
      if (force || last.bar !== bar) { t.bar.style.transform = `scaleX(${bar / 100})`; last.bar = bar; }
      if (force || last.alive !== s.alive) {
        t.li.classList.toggle('dead', !s.alive);
        if (!force && !s.alive) knock(t.li);
        last.alive = s.alive;
      }
      if (force || last.leading !== leading) {
        t.li.classList.toggle('leader', leading);
        if (!force && leading) bump(t.li, CROWNED);
        last.leading = leading;
      }
      if (force || last.starving !== starving) { t.li.classList.toggle('starving', starving); last.starving = starving; }
      // Powers: a chip each, an ink icon and a count. Golden jumps (sky) and
      // golden flashes (ember) are Honey chips with the count held; the edges
      // wrapping, a loop and the seconds left in a Honey line. Your own tag
      // always shows your jump and your flash, each filling in its colour as
      // it rests and solid when it's ready.
      const mine = isMe(s) && s.alive;
      const wrapS = s.alive && s.wrapUntil > game.time ? Math.ceil((s.wrapUntil - game.time) / 1000) : 0;
      const jump = s.alive && (mine || s.leaps > 0), flash = s.alive && (mine || s.dashes > 0);
      const pow = jump || flash || wrapS ? `${jump ? s.leaps : '-'}|${flash ? s.dashes : '-'}|${wrapS}` : '';
      if (force || last.pow !== pow) {
        t.pow.innerHTML = (jump ? chip('jump', s.leaps, s) : '') + (flash ? chip('flash', s.dashes, s) : '') + (wrapS ? chip('wrap', wrapS, s) : '');
        t.pow.hidden = !pow;
        t.jump = t.pow.querySelector('.jump');
        t.flash = t.pow.querySelector('.flash');
        last.pow = pow;
        last.jump = last.flash = null; // (new chips: their rests are written afresh)
      }
      if (mine) {
        rest(t, 'jump', E.leapIn(game, s), T.LEAP_COOLDOWN_MS, s.leaps);
        rest(t, 'flash', E.flashIn(game, s), T.FLASH_COOLDOWN_MS, s.dashes);
      }
      // Your plain powers back from their rest: a flick round your head and a
      // tick (the jump's, or the flash's), unless you're holding golden ones.
      const jumpBack = mine && s.body.length > T.MIN_LENGTH && game.time >= s.leapReadyAt;
      const flashBack = mine && !(T.FLASH_COST > 0 && s.body.length <= T.MIN_LENGTH) && game.time >= s.flashReadyAt;
      if (!force && jumpBack && last.jumpBack === false && !s.leaps) { R.ready(s, 'jump'); Audio.play('ready'); }
      if (!force && flashBack && last.flashBack === false && !s.dashes) { R.ready(s, 'flash'); Audio.play('flashReady'); }
      last.jumpBack = jumpBack; last.flashBack = flashBack;
    }
  }

  // A power's chip (jump, flash or wrap): its icon and a count (golden ones
  // held; the wrap's seconds left).
  function chip(kind, n, s) {
    const gold = kind !== 'wrap' && n > 0;
    const title = kind === 'wrap' ? `The edges wrap round for ${isMe(s) ? 'you' : s.persona ? 'it' : 'them'}`
      : gold ? (kind === 'jump' ? 'Golden jumps: long ones, free' : 'Golden flashes: three cells at once') : '';
    return `<span class="chip ${kind}${gold ? ' gold' : ''}${isMe(s) ? ' mine' : ''}"${title ? ` title="${title}"` : ''}>${POW_ICON[kind]}${n ? `<b>${n}</b>` : ''}</span>`;
  }
  // Your own chip's rest: filling in tenths (a write a few times a second, not
  // every frame), solid when ready, greyed when you're too small for it.
  function rest(t, kind, left, full, gold) {
    const el = t[kind];
    if (!el) return;
    const now = gold ? 'gold' : left === 0 ? 'ready' : left === Infinity ? 'small' : Math.floor((1 - left / full) * 10) * 10;
    if (t.last[kind] === now) return;
    t.last[kind] = now;
    el.classList.toggle('ready', now === 'ready');
    el.classList.toggle('small', now === 'small');
    if (typeof now === 'number') el.style.setProperty('--fill', `${now}%`);
    if (!gold) el.title = `Your ${kind}${now === 'ready' ? ' is ready' : now === 'small' ? ': too small for it' : ' is resting'} (${kind === 'jump' ? (touchFirst ? 'tap' : 'Space') : touchFirst ? 'swipe ahead' : 'E or Shift'})`;
  }

  // The chips' icons: small inline drawings in ink (no fallback-font glyphs).
  // A jump arcs over; a flash is a streak with chevrons; the wrap, a loop.
  const POW_ICON = {
    jump: '<svg viewBox="0 0 12 12"><path d="M1.5 10.5C2.5 3 9 2.5 10.5 9.5"/><path d="M8.2 8.4l2.3 1.4.8-2.5"/></svg>',
    flash: '<svg viewBox="0 0 12 12"><path d="M2 2.5 5.5 6 2 9.5M6.5 2.5 10 6l-3.5 3.5"/></svg>',
    wrap: '<svg viewBox="0 0 12 12"><path d="M10 6.5a4 4 0 1 1-1.4-3"/><path d="M9.2 1.4l-.4 2.3-2.3-.3"/></svg>',
  };

  // The scoreboard dot: the snake's current color,
  // the flag for Wildcard, two-tone for Joker, veined marble for Mason, Mute's
  // mood, and Vulture's pink head (black would vanish).
  const PERSONA_DOTS = {
    wildcard: 'linear-gradient(135deg, #3c3b6e 0 42%, #b22234 42% 56%, #fff 56% 70%, #b22234 70% 84%, #fff 84%)',
    joker: 'linear-gradient(90deg, #a21caf 50%, #f59e0b 50%)',
    mason: 'radial-gradient(circle at 68% 30%, #c9a227 0 14%, transparent 15%), radial-gradient(circle at 10% 115%, transparent 0 55%, #8a94a6 56% 66%, transparent 67%), #f1ece2', // (marble: a curl of grey vein and a gold fleck, no stripe straight across)
    ghost: 'radial-gradient(circle at 35% 35%, #f8fafc, #b8c4d4)', // (pale, but not an empty ring)
  };
  function dotColor(s) {
    if (s.personaKey === 'mute') return R.colorOf(s); // (its mood, as it changes)
    return PERSONA_DOTS[s.personaKey] || s.persona?.ink || R.colorOf(s);
  }
  // The same dots in the Hall of Fame and Your story, by a rival's name.
  const dotByName = name => { for (const k in PERSONAS) if (PERSONAS[k].name === name) return PERSONA_DOTS[k] || null; return null; };

  // Pause, mute and speed controls: shown and labelled for the current state.
  function updateControls() {
    const canPause = !online && (state === 'running' || state === 'paused' || state === 'countdown');
    pauseBtn.disabled = !canPause;
    pauseBtn.setAttribute('aria-label', state === 'paused' ? 'Wake up' : 'Nap (pause)');
    pauseBtn.title = state === 'paused' ? 'Wake up (P)' : 'Nap (P)';
    pauseBtn.dataset.paused = String(state === 'paused');
    // (Watching, the speed can be set during the countdown too.)
    speedEl.hidden = !(spectating() && !online && (canPause || state === 'countdown'));
    for (const b of speedEl.querySelectorAll('button')) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === speed));
    // Pressed means off (the icon gets its slash); the names stay put.
    muteBtn.setAttribute('aria-pressed', String(Audio.isMuted()));
    musicBtn.setAttribute('aria-pressed', String(!Audio.isMusicOn()));
    musicBtn.disabled = Audio.isMuted();
    // During a round the page holds still under your fingers (see the swipes).
    document.documentElement.classList.toggle('playing', (state === 'running' || state === 'countdown') && playerAlive());
    document.documentElement.classList.toggle('in-round', state === 'running' || state === 'countdown');
    if (helpEl) updateHelp(); // (watching or playing: the help says what you can do)
  }

  function setSpeed(n) {
    speed = n;
    if (!game.withPlayer) watchSpeed = n;
    const was = tickLen;
    tickLen = E.tickMs(game) / (spectating() ? speed : 1);
    acc *= tickLen / was; // (the same point between ticks: nothing jumps)
    updateControls();
  }

  // ------------------------------------------------------------- input

  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  const SPEED_KEYS = { 1: 1, 2: 2, 3: 4, 4: 4 }; // (watching: 1, 2 and 4 for 1x, 2x and 4x; 3 for the third button)
  const CODES = { KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' }; // physical keys, so AZERTY works

  // Queue a turn (up to T.QUEUE ahead), checked against the last queued
  // direction so no combo of quick presses can reverse into the neck.
  // - Pressing the way you're already going does nothing: steering only
  //   steers (the powers have presses of their own).
  // - Reversing a turn that hasn't happened yet changes your mind: it takes
  //   that turn's place, if it's a legal way from the one before it.
  // - Stunned, the latest press wins (checked against your neck), so you get
  //   more than one guess while the stars go round.
  // - A reversal is checked against your neck: the way your head last moved
  //   (after a crash you haven't moved, so the way you were facing may not be it).
  // - A reversal pressed a hair before the turn it needs (keys rolled together
  //   for a U-turn) is held a moment, and goes after that turn if it comes.
  function turn(name, p = player()) {
    const next = DIRS[name], now = performance.now(), back = moved(p);
    const reverse = (a, b) => a.x === -b.x && a.y === -b.y;
    if (p.stunUntil > game.tick) {
      if (next === p.dir && !p.queue.length) return; // (at what you hit: nothing to change)
      if (reverse(next, back)) { // (into your neck: unless it's a U-turn's second key, after a turn)
        if (p.queue.length === 1 && p.queue[0] !== next && !reverse(next, p.queue[0])) p.queue.push(next);
        else p.heldReverse = { dir: next, at: now, tick: game.tick };
        return;
      }
      p.queue.length = 0;
      if (next !== p.dir) {
        p.queue.push(next);
        p.turnedAt = { dir: next, at: now };
        const held = p.heldReverse;
        p.heldReverse = null;
        if (held && (held.tick === game.tick || now - held.at < T.CHORD_MS) && held.dir !== next && !reverse(held.dir, next)) p.queue.push(held.dir); // (the U-turn, reverse key first)
      }
      return;
    }
    const lastQ = p.queue.length ? p.queue[p.queue.length - 1] : null;
    if (next === (lastQ || p.dir)) return; // (the way you're already going: nothing)
    const last = lastQ || back;
    if (reverse(next, last)) {
      if (!p.queue.length) { p.heldReverse = { dir: next, at: now, tick: game.tick }; return; } // (maybe a U-turn's second key, early: see below)
      const before = p.queue.length > 1 ? p.queue[p.queue.length - 2] : back;
      if (next === before || reverse(next, before)) return;
      p.queue[p.queue.length - 1] = next;
      p.turnedAt = { dir: next, at: now };
      return;
    }
    if (p.queue.length < T.QUEUE) {
      p.queue.push(next);
      p.turnedAt = { dir: next, at: now };
      const held = p.heldReverse;
      p.heldReverse = null;
      if (held && (held.tick === game.tick || now - held.at < T.CHORD_MS) && held.dir !== next && !reverse(held.dir, next) && p.queue.length < T.QUEUE) p.queue.push(held.dir); // (the U-turn, both keys, any time before the snake moves)
    }
  }
  // A fresh swipe: the way you're already going flashes, any other way steers.
  // (A swipe the way you turned a moment ago is that turn swiped twice, not a
  // flash: two quick swipes up mean up.)
  function swipeTo(name, p = player()) {
    const next = DIRS[name], ahead = p.queue.length ? p.queue[p.queue.length - 1] : p.dir;
    if (next !== ahead) return turn(name, p);
    if (p.turnedAt?.dir === next && performance.now() - p.turnedAt.at < T.POWER_AFTER_TURN_MS) return;
    E.flash(game, p);
  }
  // The way a snake's head last moved: from its neck to its head.
  function moved(p) {
    const h = p.body[0], n = p.body[1];
    if (!n) return p.dir;
    let dx = h.x - n.x, dy = h.y - n.y;
    if (dx > 1) dx = -1; else if (dx < -1) dx = 1; // (across a wrapped edge)
    if (dy > 1) dy = -1; else if (dy < -1) dy = 1;
    return dx > 0 ? DIRS.right : dx < 0 ? DIRS.left : dy > 0 ? DIRS.down : dy < 0 ? DIRS.up : p.dir;
  }

  // A direction: steers, and on the start card or during the countdown also
  // gets the round going (already turning). swipe: a fresh swipe, which
  // flashes the way you're already going once the round's going (a swipe
  // that starts or wakes the round only steers).
  function steer(name, swipe = false) {
    if (!playerAlive()) return;
    const press = swipe && state === 'running' ? swipeTo : turn;
    if (state === 'running' || state === 'countdown') { game.steered = true; hideSteerHint(); } // (you've found the controls)
    if (state === 'running' && youHideAt) youHideAt = Math.min(youHideAt, performance.now() + T.YOU_AFTER_STEER_MS); // (you've found yourself)
    const heard = () => R.pressed?.(DIRS[name]); // (your press shows at once: your head leans that way and is drawn ahead from it, online too, before the host's game takes it; stunned, the chevron by your head. pressed() takes it as the game does: never into the neck, and the way you face is nothing)
    if (online) {
      // Online the countdown runs its course; presses go to the host's game.
      if (state !== 'countdown' && state !== 'running') return;
      heard();
      if (guesting()) online.room.send({ t: press === swipeTo ? 'swipe' : 'turn', d: name });
      else hostPress(me => press(name, me));
      return;
    }
    if (state === 'ready') start({ going: true });
    if (state === 'paused' && askingStartOver) resume(); // (steering: you meant to keep going)
    if (state === 'countdown') { heard(); turn(name); go(); youHideAt = Math.min(youHideAt, performance.now() + T.YOU_AFTER_STEER_MS); }
    else if (state === 'running') { heard(); press(name, player()); }
  }

  // A power: Space or a tap jumps; E, Shift or a fresh swipe ahead flashes.
  // Only while you're playing a round that's going (asked for while you're
  // stunned, it goes when the stun's over): they never start, wake or
  // dismiss anything. Online it goes to the host's game, as your turns do.
  function power(kind) {
    if (state !== 'running' || !playerAlive()) return;
    if (kind === 'flash') flashedEver = true;
    if (guesting()) return online.room.send({ t: 'pow', k: kind });
    if (hosting()) return hostPress(me => powerOf(me, kind));
    powerOf(player(), kind);
  }
  const powerOf = (s, kind) => (kind === 'flash' ? E.flash : E.leap)(game, s);

  // A friend sees each tick half a round trip late, and their presses take
  // the other half to arrive. So the host's own presses (turns and powers)
  // wait a whole round trip, in the order they were made: no one gets a head start.
  let hostPressAt = 0;
  function hostPress(fn) {
    const me = player();
    if (me.autopilot) me.autopilot = null; // back from a hidden tab: your hands again
    const now = performance.now();
    const at = Math.max(now + Math.min(T.HOST_DELAY_MAX, online.room.rtt()), hostPressAt);
    hostPressAt = at;
    if (at - now < 4) return fn(me);
    setTimeout(() => { if (me.alive && game.snakes[me.id] === me) fn(me); }, at - now);
  }

  // A result is on its way (your death's card in the freeze, or the round's
  // card in its pause): keys wait for it, never throw it away.
  const cardComing = () => !!pendingCard && (state === 'over' || (state === 'running' && !playerAlive()));
  // P and Esc nap and wake (and only that: starting is Enter, R or an arrow).
  function napKey() {
    if (online || cardComing()) return; // no napping online
    if (state === 'running' && !playerAlive() && shownCard?.reward && !overlay.classList.contains('hidden')) return hideCard(); // (your death card: napping it would hide why you died; keep watching instead)
    if (state === 'running') pause();
    else if (state === 'paused') resume();
    else if (state === 'countdown') napNow(); // (the phone rang: nap, don't go; Go is the Go! button, Enter, R or an arrow)
  }

  // Space acts on a button only when you Tabbed to it (as buttons do). A
  // button handed focus by the game (a card's Play again) or clicked lets
  // Space be a jump, so mashing jump just after you die can't start a round.
  let tabbing = false, tabbed = null;
  document.addEventListener('focusin', e => { tabbed = tabbing ? e.target : null; tabbing = false; });
  document.addEventListener('keyup', e => { if (e.key === 'Tab') tabbing = false; }); // (a Tab that took focus out of the page: the game's next focus isn't yours)

  document.addEventListener('keydown', e => {
    Audio.unlock();
    tabbing = e.key === 'Tab';
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target === nameInput) {
      if (e.key === 'Enter') { e.preventDefault(); nameInput.blur(); startBtn.focus({ preventScroll: true }); }
      return;
    }
    if (e.key === 'Escape' && state === 'lobby' && !online) { backToStart(); return; } // (even from the name or code field)
    if (e.target.closest?.('input, textarea')) return; // typing a name or a room code
    // The powers: Space jumps; E (by where it sits, like WASD) or either Shift
    // flashes. They're the keys you mash in a fight: a held one fires once,
    // and they never start, wake or dismiss anything.
    const pow = e.key === ' ' ? 'leap' : e.code === 'KeyE' || e.key === 'Shift' ? 'flash' : null;
    if (pow) {
      if (e.key === ' ' && e.target === tabbed && e.target.closest?.('button')) return; // (Tabbed to: the button's own key)
      e.preventDefault();
      if (!e.repeat && recordsEl.hidden) power(pow);
      return;
    }
    if (!recordsEl.hidden) {
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') { e.preventDefault(); closeRecords(); }
      return;
    }
    const dir = KEYS[e.key] || CODES[e.code];
    if (dir) { e.preventDefault(); if (!e.repeat) steer(dir); return; } // (a held key's repeats steer nothing: its first press did)
    // A held key repeats nothing, not even a focused button (holding Enter on
    // Play would otherwise start the round and then skip its countdown).
    if (e.repeat) { if (e.key === 'Enter') e.preventDefault(); return; }
    // Enter on a focused button belongs to the button.
    if (e.key === 'Enter' && e.target.closest?.('button')) {
      // A card's or a dialog's button keeps its keys. Elsewhere (the header's,
      // the speed buttons, a tag), in a round, they're the game's keys again.
      if (e.target.closest('#overlay, #records') || !(state === 'running' || state === 'countdown' || state === 'paused') || e.target === tabbed) return; // (Tabbed to: the button's own keys)
      e.target.blur();
    }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { e.preventDefault(); napKey(); } // (Escape on your death card keeps watching)
    else if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      const key = e.key === 'Enter' ? 'Enter' : 'R';
      if (cardComing()) return; // (the result's card first)
      if (state === 'countdown') { if (!online) go(); } // (online the countdown runs its course: everyone starts together)
      else if (state === 'paused' && askingStartOver) start();
      else if ((state === 'running' || state === 'paused') && playerAlive() && !online) askStartOver(key); // (R sits next to D: a slip shouldn't throw a round away, napping or not)
      else start({ aiOnly: false });
    }
    else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); openRecords(); }
    else if (e.key === 'm' || e.key === 'M') toggleMute();
    else if (e.key === 'n' || e.key === 'N') toggleMusic();
    else if (SPEED_KEYS[e.key] && !speedEl.hidden) setSpeed(SPEED_KEYS[e.key]);
    else if (e.key === '`' && DEV) perf.toggle();
  });

  // Swipes and taps, on the board always, and during a round anywhere on the
  // screen (over the countdown card too); the page never scrolls.
  // - A swipe steers: a turn registers once the finger has travelled half a
  //   cell (at least SWIPE_MIN_PX), without lifting, its way clearly the
  //   finger's (half again the other: a diagonal waits). One touch chains
  //   turns, each after SWIPE_CHAIN_PX more, counted from where the finger
  //   turned. A fresh swipe the way you're going flashes; a finger that keeps
  //   going that way doesn't.
  // - A tap jumps: a touch that lifts without travelling (TAP_STILL_PX), or
  //   stays that still for TAP_JUMP_MS, anywhere but a working button or a
  //   name tag. A touch that becomes a swipe never jumps.
  // Every finger on the glass is its own: a thumb left resting doesn't block
  // the other, and can still steer once the other lifts. Buttons stay
  // buttons: during a round a swipe may start on one (the Go! in the middle
  // of the board, the header's), and once it's travelled it steers and the
  // button's click is swallowed; a short tap is still a click.
  const swipes = new Map(); // touch id -> { x, y (the anchor), x0, y0 (where it touched), last, button, tapOnly, moved, tap, timer }
  const swiping = () => (state === 'running' || state === 'countdown') && playerAlive();
  document.addEventListener('touchstart', e => {
    Audio.unlock();
    if (e.target.closest?.('input, a, #records')) return;
    const button = e.target.closest?.('button:not(:disabled), [role="switch"]');
    if (!button && !swiping() && !canvas.contains(e.target)) return;
    const tapOnly = !!button && !swiping(); // (outside a round a button touch is a tap or a scroll, never a swipe)
    const taps = !button && !e.target.closest?.('#scoreboard') && state === 'running' && playerAlive(); // (a tap here would be a jump)
    for (const t of e.changedTouches) {
      const sw = { x: t.clientX, y: t.clientY, x0: t.clientX, y0: t.clientY, last: null, button, tapOnly, moved: false, tap: taps, timer: 0 };
      if (taps) sw.timer = setTimeout(() => tapped(sw), T.TAP_JUMP_MS); // (held still: a tap, without waiting for the lift)
      swipes.set(t.identifier, sw);
    }
    if (swiping() && !button) e.preventDefault(); // (not on a button: its tap must still be a click)
  }, { passive: false });
  // A tap: one jump (unless the finger travelled, or swiped, first).
  function tapped(sw) {
    if (!sw.tap) return;
    sw.tap = false;
    clearTimeout(sw.timer);
    power('leap');
  }
  document.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      const sw = swipes.get(t.identifier);
      if (!sw) continue;
      if (sw.tap && Math.hypot(t.clientX - sw.x0, t.clientY - sw.y0) > T.TAP_STILL_PX) { sw.tap = false; clearTimeout(sw.timer); } // (travelling: not a tap)
      const dx = t.clientX - sw.x, dy = t.clientY - sw.y, ax = Math.abs(dx), ay = Math.abs(dy);
      if (sw.tapOnly) { if (ax + ay > 12) sw.moved = true; continue; } // (a card scrolling: let it)
      e.preventDefault();
      const dir = ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (dir === sw.last) { sw.x = t.clientX; sw.y = t.clientY; continue; } // (still going the way it registered: the anchor keeps up, so a turn counts from where the finger turns)
      const threshold = sw.last ? T.SWIPE_CHAIN_PX : Math.max(T.SWIPE_MIN_PX, (boardPx || 320) / GRID * T.SWIPE_CELLS);
      if (Math.max(ax, ay) < threshold || Math.max(ax, ay) < T.SWIPE_AXIS * Math.min(ax, ay)) continue;
      sw.tap = false; // (a swipe is never a jump)
      clearTimeout(sw.timer);
      steer(dir, true);
      sw.last = dir;
      sw.x = t.clientX;
      sw.y = t.clientY;
    }
  }, { passive: false });
  // A touch lifting: a tap if it hadn't travelled. One that began on a
  // button: a swipe cancels its click; a tap presses it here (with another
  // finger resting on the glass the browser wouldn't).
  const endSwipe = e => {
    for (const c of e.changedTouches) {
      const sw = swipes.get(c.identifier);
      swipes.delete(c.identifier);
      if (!sw) continue;
      clearTimeout(sw.timer);
      if (sw.tap && e.type === 'touchend' && Math.hypot(c.clientX - sw.x0, c.clientY - sw.y0) <= T.TAP_STILL_PX) tapped(sw);
      sw.tap = false;
      if (!sw.button || e.type !== 'touchend' || sw.moved) continue; // (a scroll: the browser's own business)
      e.preventDefault(); // (no click of the browser's own: never twice, never a swipe's)
      if (!sw.last && sw.button.contains(document.elementFromPoint(c.clientX, c.clientY))) sw.button.click();
    }
  };
  document.addEventListener('touchend', endSwipe, { passive: false });
  document.addEventListener('touchcancel', endSwipe);

  // Buttons.
  const click = (el, fn) => el.addEventListener('click', e => { Audio.unlock(); Audio.play('ui'); fn(e); });
  // A button clicked with a mouse or a finger doesn't keep the keyboard, so
  // Space and Enter go back to jumping and starting over. Card and Hall of
  // Fame buttons keep focus: there, Enter on a focused button is expected.
  document.addEventListener('click', e => {
    const b = e.target.closest?.('button');
    if (b && e.detail > 0 && !b.closest('#overlay, #records')) b.blur();
  });
  click(startBtn, () => {
    if (cardActions?.primary) cardActions.primary();
    else if (state === 'paused') resume();
    else if (state === 'countdown') go();
    else start({ aiOnly: false });
  });
  click(watchBtn, () => {
    if (cardActions?.secondary) cardActions.secondary();
    else if (state === 'running') hideCard();        // keep watching after you died
    else if (state === 'paused') { if (playerAlive()) askStartOver(null); else start(); } // "Start over" on touch: it asks first, too (out already, there's nothing to lose)
    else start({ aiOnly: true });
  });
  click(pauseBtn, () => (state === 'paused' ? resume() : state === 'running' && !playerAlive() && shownCard?.reward && !overlay.classList.contains('hidden') ? hideCard() : napNow()));
  muteBtn.addEventListener('click', () => { Audio.unlock(); toggleMute(); }); // (its tap comes after the toggle: see toggleMute)
  click(musicBtn, () => toggleMusic());
  click(speedEl, e => { const b = e.target.closest('button'); if (b) setSpeed(Number(b.dataset.speed)); });
  click(chatterBtn, () => { Chatter.setEnabled(!Chatter.isEnabled()); showChatterState(); });

  function toggleMute() {
    Audio.toggleMuted();
    Audio.play('ui'); // (heard only when the sound's back on: muting is silent, unmuting taps once)
    updateControls();
  }

  function toggleMusic() {
    Audio.unlock();
    Audio.toggleMusic();
    updateControls();
  }

  function showChatterState() {
    const on = Chatter.isEnabled();
    chatterBtn.firstElementChild.textContent = on ? 'On' : 'Off'; // (the state is aria-checked: the word is for eyes)
    chatterBtn.setAttribute('aria-checked', String(on));
    chatlogEl.hidden = !on;
  }

  // Renaming your Hall of Fame entry from the card. Saved when you're done
  // (rivals use the new name from the next round).
  let namingEntry = null; // the round the name field is for (the next may start while you type)
  nameInput.addEventListener('change', () => {
    if (!namingEntry) return;
    Records.rename(namingEntry, nameInput.value);
    nameRank.textContent = `Carved: ${Records.getName()}.`; // (it took)
  });

  // Nap automatically when the tab is hidden, or when the window loses focus
  // while you're playing (a watched round can keep going on screen). Online the
  // round goes on regardless.
  document.addEventListener('visibilitychange', () => {
    if (online) return awayOnline();
    if (!document.hidden) return;
    napNow();
  });

  // Online the round goes on while your tab is hidden, so an AI steers your
  // snake until you're back and turn again. A friend's tab says so itself: a
  // hidden tab's "still here" slows to once a second, which looks like a
  // flickering connection.
  function awayOnline() {
    if (guesting()) online.room.send({ t: document.hidden ? 'away' : 'back' });
    const me = player();
    if (!me?.alive || (state !== 'countdown' && state !== 'running')) return;
    if (hosting() && document.hidden) { me.autopilot = PERSONAS.drab; me.queue.length = 0; }
    if (!document.hidden && (hosting() ? me.autopilot : true)) {
      toast(FLAVOR.takeBack, 2400);
      if (guesting()) online.toldAway = true; // (then no "you went quiet" when you do)
    }
  }
  window.addEventListener('blur', () => {
    if (online || !playerAlive() || pendingCard) return;
    napNow();
  });

  // Nap right away; from the countdown, the round starts napping.
  function napNow() {
    if (state === 'countdown') state = 'running';
    if (state === 'running') pause();
  }

  // ------------------------------------------------------ Hall of Fame

  let recordsTab = 'scores', scoresFilter = 'all', recordsOpener = null;

  function openRecords() {
    if (online && playerAlive() && (state === 'countdown' || state === 'running')) {
      toast('The Hall of Fame can wait. Eyes on the bark.', 1800, '', 'round'); // the round wouldn't (and over the countdown's card)
      return;
    }
    // Napping, if you're playing alone (online, or only watching, the round goes on behind the dialog, and its card stays).
    if (!online && (state === 'countdown' || (state === 'running' && playerAlive() && !pendingCard))) napNow();
    recordsOpener = document.activeElement;
    recordsEl.hidden = false;
    mainEl.inert = true;
    renderRecordsSafely();
    $('records-close').focus();
  }

  function closeRecords() {
    recordsEl.hidden = true;
    mainEl.inert = false;
    const card = !overlay.classList.contains('hidden');
    const back = card && recordsOpener && overlay.contains(recordsOpener) ? recordsOpener : card ? (startBtn.hidden ? watchBtn : startBtn) : recordsOpener;
    back?.focus?.({ preventScroll: true });
  }

  function renderRecordsSafely() {
    recordsBody.textContent = '';
    try { renderRecords(); } catch { recordsBody.textContent = 'The Hall of Fame got scrambled. Clear it below to start afresh.'; }
  }

  function renderRecords() {
    recordsTabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.tab === recordsTab)));
    filterTabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.filter === scoresFilter)));
    filterEl.hidden = recordsTab !== 'scores';
    resetBtn.hidden = recordsTab === 'guide'; // (nothing there to clear)
    recordsBody.textContent = '';
    if (recordsTab === 'scores') {
      Records.renderScores(recordsBody, game.entryId, scoresFilter, PLAYER_COLOR, dotByName);
    } else if (recordsTab === 'guide') {
      renderGuide();
    } else {
      // Every persona's color, not just this round's, plus old names (Viper, Warden).
      const colors = { self: PLAYER_COLOR, Viper: '#c084fc', Warden: '#3b82f6', hunger: '#dc2626', wall: '#7a4a24', fire: '#f97316', woodpecker: '#27272a' }; // (hunger in Berry, the edge in Heartwood, fire in flame, the woodpecker in its black)
      for (const p of Object.values(PERSONAS)) colors[p.name] = p.ink || p.color;
      Records.renderStats(recordsBody, colors, dotByName);
    }
  }

  // The Field guide: every food, power and danger, with its picture (drawn by
  // the renderer, as it is on the log) and its rule in a line or two.
  const secs = ms => Math.round(ms / 1000);
  const GUIDE = [
    ['Food', [
      ['apple', 'Apple', 'Worth 1, and a full tummy. Leave it too long and it rots.'],
      ['golden', 'Golden apple', `Worth ${T.GOLDEN_GROWTH}, and everyone saw it land.`],
      ['beetle', 'Beetle', `Worth ${T.BEETLE_GROWTH}. It scurries from heads, at half your speed.`],
      ['pellet', 'Beads', 'What a crash leaves behind: worth 1 each, and they rot. Your own give the length back, not a meal.'],
      [['baked', 'roast'], 'Baked and roast', `Food left in a fire bakes: worth ${T.COOKED_GROWTH}, if you can take the heat. Then it’s ash.`],
      ['mushroom', 'Mushroom', `Poison: ${T.SHRINK} off your tail (never below ${T.MIN_LENGTH}). Mind the purple haze.`],
    ]],
    ['Golden things', [
      ['goldbeetle', 'Golden beetle', `${T.LEAP_CHARGES} golden jumps: long, free, no rest. Hold up to ${T.LEAP_MAX}.`],
      ['leaf', 'Golden leaf', `${T.DASH_CHARGES} golden flashes: three cells at once, slicing thin snakes. Never at an edge or a hole.`],
      ['goldcap', 'Golden mushroom', `Up in the rain. The edges wrap round for you, ${secs(T.WRAP_MS)} s a mushroom (up to ${secs(T.WRAP_MAX_MS)}).`],
    ]],
    ['Your powers', [
      ['jump', 'Jump', `${touchFirst ? 'A tap' : 'Space'}: hop a snake, a hole or fire. It costs your tail’s tip, then rests ${secs(T.LEAP_COOLDOWN_MS)} s.`],
      ['flash', 'Flash', `${touchFirst ? 'A swipe the way you’re going' : 'E or Shift'}: two cells in a blink, free. Then it rests ${secs(T.FLASH_COOLDOWN_MS)} s.`],
    ]],
    ['The log', [
      ['fire', 'Fire', 'Lightning lights it. Crawl in and it takes 3 bites of tail; rain puts it out.'],
      ['hole', 'Holes', 'The woodpecker’s, from 2:00. Bump one like the edge; a peck right under your head is the end.'],
      ['land', 'Borders', 'Sovereign’s realm and Colonist’s colonies. Cross one and it notices.'],
    ]],
  ];
  // (Until the renderer can draw a picture, a stand-in.)
  const GUIDE_STAND_IN = { apple: '🍎', golden: '🌟', beetle: '🪲', goldbeetle: '🪲', pellet: '🟢', baked: '🍎', roast: '🍖', mushroom: '🍄', goldcap: '🍄', leaf: '🍂', jump: '⤴️', flash: '⚡', wrap: '🔁', fire: '🔥', hole: '🕳️', land: '🚩' };
  function renderGuide() {
    const px = Math.round(36 * (window.devicePixelRatio || 1));
    for (const [title, rows] of GUIDE) {
      const head = document.createElement('h3');
      head.className = 'guide-head';
      head.textContent = title;
      const list = document.createElement('ul');
      list.className = 'guide';
      for (const [kinds, name, rule] of rows) {
        const li = document.createElement('li');
        const pics = document.createElement('span');
        pics.className = 'guide-pics';
        pics.setAttribute('aria-hidden', 'true');
        for (const kind of [].concat(kinds)) pics.append(guidePic(kind, px));
        const text = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = name;
        text.append(strong, ' ', rule);
        li.append(pics, text);
        list.append(li);
      }
      recordsBody.append(head, list);
    }
  }
  // One thing's picture, a copy of the renderer's own (36 px, sharp at any density).
  function guidePic(kind, px) {
    let art = null;
    try { art = R.guideSprite?.(kind, px); } catch { /* the stand-in, below */ }
    if (art?.width) {
      const c = document.createElement('canvas');
      c.width = art.width;
      c.height = art.height;
      c.getContext('2d').drawImage(art, 0, 0);
      c.className = 'guide-art';
      return c;
    }
    const span = document.createElement('span');
    span.className = 'guide-art stand-in';
    span.textContent = GUIDE_STAND_IN[kind] || '•';
    return span;
  }

  recordsTabs.forEach(t => click(t, () => { recordsTab = t.dataset.tab; renderRecordsSafely(); }));
  filterTabs.forEach(t => click(t, () => { scoresFilter = t.dataset.filter; renderRecordsSafely(); }));
  click($('records-open'), openRecords);
  click($('records-close'), closeRecords);
  recordsEl.addEventListener('click', e => { if (e.target === recordsEl) closeRecords(); });
  click($('records-reset'), () => {
    if (!confirm('Clear every Hall of Fame row, your story and your Best? There’s no undo.')) return;
    Records.reset();
    best = 0;
    bestEl.textContent = 0;
    nameRow.hidden = true;
    renderRecords();
  });

  // -------------------------------------------------- play with friends

  // One browser hosts: it runs the round exactly as when playing alone, sends
  // every tick to the others (online.js) and takes their turns. Friends' screens
  // only draw what the host sends. Connections live in net.js.

  // Which parts of the lobby a card shows: { name, share, players, join, status, trouble }.
  function renderLobby(parts) {
    lobbyEl.hidden = !parts;
    if (!parts) return;
    lobbyName.closest('.lobby-row').hidden = !parts.name;
    lobbyShare.hidden = !parts.share;
    lobbyJoin.hidden = !parts.join;
    lobbyPlayers.hidden = !parts.players;
    if (parts.players) renderPlayers();
    setStatus(parts.status || '', parts.trouble);
  }

  function setStatus(text, trouble = false) {
    lobbyStatus.textContent = text;
    lobbyStatus.classList.toggle('trouble', trouble);
  }

  // Four seats: the people in the room, then the seats AI rivals will take.
  function renderPlayers() {
    lobbyPlayers.textContent = '';
    const people = online?.players || [];
    for (let i = 0; i < Online.MAX_PEOPLE; i++) {
      const p = people[i];
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'dot';
      const label = document.createElement('span');
      if (p) {
        dot.style.background = p.color;
        if (R.markOf(p.color)) dot.dataset.mark = R.markOf(p.color);
        label.textContent = p.name;
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = [p.host && 'host', p.id === myId() && 'you'].filter(Boolean).join(', ');
        li.append(dot, label, tag);
      } else {
        dot.style.background = 'var(--parchment-2)';
        label.className = 'open-seat';
        label.textContent = 'An AI rival, unless a friend joins';
        li.append(dot, label);
      }
      lobbyPlayers.append(li);
    }
  }

  const myId = () => (hosting() ? 'host' : online?.room.id);
  const roomLink = code => (location.protocol === 'file:' ? code : `${location.origin}${location.pathname}?join=${code}`);

  // Keep ?join=CODE in the address while you're in a room (a reload rejoins).
  function setUrlCode(code) {
    const p = new URLSearchParams(location.search);
    if (code) p.set('join', code); else p.delete('join');
    const q = p.toString();
    try { history.replaceState(null, '', location.pathname + (q ? `?${q}` : '')); } catch { /* file:// */ }
  }

  function saveLobbyName() {
    const name = Online.cleanName(lobbyName.value);
    if (name) Records.setName(name);
    lobbyName.value = name || '';
  }

  let joinAttempt = 0; // a newer attempt (or Back) makes an older one moot

  function openFriends() {
    joinAttempt++;
    state = 'lobby';
    lobbyName.value = Records.hasName() ? Records.getName() : '';
    lobbyCode.value = '';
    updateControls();
    showCard({
      title: 'Play with friends', text: FLAVOR.friendsIntro, primary: 'Host a game', secondary: 'Back',
      lobby: { name: true, join: true }, actions: { primary: hostRoom, secondary: backToStart },
    });
  }

  function backToStart() {
    joinAttempt++;
    if (online) endOnline();
    ready();
  }

  // ------------- hosting

  async function hostRoom() {
    saveLobbyName();
    const attempt = ++joinAttempt;
    startBtn.disabled = true;
    setStatus('Opening a room…');
    try {
      const room = await Net.host({ newCode: Online.newCode, onLeave: friendLeft, onMessage: fromFriend });
      if (attempt !== joinAttempt) { room.close(); return; }
      online = {
        role: 'host', room, code: room.code, seat: 0, hostName: localName(), holesSent: 0,
        players: [{ id: 'host', name: localName(), color: Online.HUMAN_COLORS[0], host: true, owner: Records.playerId() }],
        shared: new Map([[Records.playerId(), { color: Online.HUMAN_COLORS[0], entries: Records.shareable(localName()) }]]), // owner -> their best rounds
      };
      keepTimeWhileHidden(true);
      setUrlCode(null);
      updateHelp();
      showRoom();
    } catch (err) {
      if (attempt === joinAttempt) setStatus(Net.explain(err), true);
    } finally {
      startBtn.disabled = false;
    }
  }

  function showRoom() {
    lobbyLink.value = roomLink(online.code);
    showCard({
      title: `Room ${online.code}`, text: FLAVOR.hostIntro, primary: 'Start', secondary: 'Close room',
      lobby: { share: true, players: true }, actions: { primary: startOnlineRound, secondary: leaveRoom },
    });
  }

  function sendLobby() {
    online.room.broadcast({ t: 'lobby', players: online.players.map(({ id, name, color, host }) => ({ id, name, color, host: !!host })) });
    if (!lobbyPlayers.hidden) renderPlayers();
  }

  function fromFriend(id, msg) {
    if (!hosting()) return;
    if (msg.t === 'hello') {
      const why = msg.v !== Online.VERSION ? 'version' : online.players.length >= Online.MAX_PEOPLE ? 'full' : null;
      if (why) {
        online.room.send(id, { t: 'reject', why });
        setTimeout(() => online?.room.drop(id), 500);
        return;
      }
      if (online.players.some(p => p.id === id)) return;
      const owner = typeof msg.owner === 'string' ? msg.owner.replace(/[^a-z0-9]/g, '').slice(0, 40) : '';
      online.room.admit(id);
      const taken = new Set(online.players.map(p => p.name));
      const base = Online.cleanName(msg.name) || 'Friend';
      let name = base;
      for (let n = 2; taken.has(name); n++) name = `${base} ${n}`;
      const color = Online.HUMAN_COLORS.find(c => !online.players.some(p => p.color === c));
      online.players.push({ id, name, color, owner });
      online.room.send(id, { t: 'welcome', name });
      sendLobby();
      // Everyone's best rounds go into everyone's Hall of Fame: kept once per
      // person (a rejoin replaces them), the newcomer gets everyone's, and
      // everyone else just the newcomer's, so messages stay small.
      const entries = owner ? Records.cleanShared(msg.scores, owner) : [];
      if (owner) online.shared.set(owner, { color, entries });
      Records.importShared(entries, color);
      online.room.send(id, { t: 'scores', from: [...online.shared.values()] });
      for (const p of online.players) if (p.id !== 'host' && p.id !== id) online.room.send(p.id, { t: 'scores', from: [{ color, entries }] });
      if (state === 'lobby') setStatus(FLAVOR.friendJoined(name));
      else toast(FLAVOR.friendJoined(name), 1800, '', 'round');
      // A round under way: they watch this one and play from the next.
      if (state === 'countdown' || state === 'running') {
        online.room.send(id, Online.round(game, game.humans, game.rivalsLine, game.roundId));
        if (state === 'running') online.room.send(id, { t: 'phase', s: 'go' });
      }
    } else if (msg.t === 'away' || msg.t === 'back') {
      const p = online.players.find(o => o.id === id);
      if (p) p.away = msg.t === 'away';
    } else if (msg.t === 'turn' || msg.t === 'swipe' || msg.t === 'pow') {
      // A friend's press: a turn, a fresh swipe (the way they're going, a
      // flash), or a power (only once the round's going), by the same rules as yours.
      const s = game.snakes.find(o => o.peer === id);
      if (!s?.alive || s.left || (state !== 'countdown' && state !== 'running')) return;
      if (msg.t === 'pow' ? !Online.POWERS.includes(msg.k) || state !== 'running' : !Online.DIR_NAMES.includes(msg.d)) return;
      if (s.autopilot) handBack(s);
      if (msg.t === 'pow') powerOf(s, msg.k);
      else if (msg.t === 'swipe' && state === 'running') swipeTo(msg.d, s);
      else turn(msg.d, s);
    }
  }

  // A friend whose connection goes quiet gets an AI at the wheel until they're
  // back, so a hiccup never drives them into a wall. Their browser says "still
  // here" four times a second, so a quiet spell shows within a moment; any turn
  // they send hands the wheel straight back. Short blips pass without a banner.
  // A friend who switched tabs said so: the AI stays at the wheel until they turn.
  function checkAway() {
    for (const s of game.snakes) {
      if (!s.peer || s.peer === 'host' || !s.alive || s.left) continue;
      const away = online.players.find(p => p.id === s.peer)?.away;
      const quiet = away ? Infinity : online.room.quietFor(s.peer);
      if (quiet > T.AWAY_MS && !s.autopilot) {
        s.autopilot = PERSONAS.drab;
        s.queue.length = 0;
        s.awayPilot = !!away;
      } else if (quiet <= T.AWAY_MS && s.autopilot && !s.awayPilot) handBack(s);
      if (s.autopilot && quiet > T.AWAY_TOAST_MS && !s.awayToast) {
        s.awayToast = true;
        toast(FLAVOR.friendAway(s.name), 2200, '', 'round');
      }
    }
  }

  function handBack(s) {
    s.autopilot = null;
    s.awayPilot = false;
    if (s.awayToast) toast(FLAVOR.friendBack(s.name), 1500, '', 'round');
    s.awayToast = false;
  }

  // A friend left: their seat opens up, and an AI finishes their round for them.
  function friendLeft(id) {
    if (!hosting()) return;
    const i = online.players.findIndex(p => p.id === id);
    if (i < 0) return;
    const [p] = online.players.splice(i, 1);
    if (p.owner) online.shared.delete(p.owner);
    const s = game.snakes.find(o => o.peer === id);
    if (s) s.left = true;
    if (s?.alive && (state === 'countdown' || state === 'running')) {
      s.autopilot = PERSONAS.drab;
      s.queue.length = 0;
      thinkQueue.push(s);
      toast(FLAVOR.friendLeft(p.name), 2400, '', 'round');
    } else if (state === 'lobby') setStatus(`${p.name} left.`);
    sendLobby();
  }

  function startOnlineRound() {
    if (!hosting()) return;
    const humans = online.players.map(p => ({ name: p.name, color: p.color, peer: p.id, owner: p.owner }));
    newGame({ humans });
    game.humans = humans;
    game.roundId = Online.newCode() + Date.now().toString(36);
    game.snakes.forEach((s, i) => { if (humans[i]) { s.peer = humans[i].peer; s.owner = humans[i].owner; } });
    game.rivalsLine = game.snakes.some(s => s.persona) ? pick(FLAVOR.rivals) : FLAVOR.rivals0;
    online.holesSent = game.holes.size;
    online.room.broadcast(Online.round(game, humans, game.rivalsLine, game.roundId));
    state = 'countdown';
    beatsLeft = 3;
    beatTimer = 0;
    updateControls();
    beat();
  }

  // ------------- joining

  // (A pasted invite link works too: its ?join= code is used.)
  const codeIn = text => Online.cleanCode(/join=([a-z0-9]{5})/i.exec(String(text))?.[1] ?? text);
  async function joinRoom(text) {
    const code = codeIn(text);
    if (!Online.isCode(code)) {
      if (state !== 'lobby') openFriends(); // (a bad ?join= link: show where the problem is)
      return setStatus('Room codes are five characters, like K7QXM.', true);
    }
    saveLobbyName();
    const attempt = ++joinAttempt;
    state = 'lobby';
    updateControls();
    showCard({
      title: 'Play with friends', text: FLAVOR.joining(code), secondary: 'Cancel',
      lobby: { status: '' }, actions: { secondary: backToStart },
    });
    try {
      const room = await Net.join(code, { onMessage: fromHost, onLost: hostLost });
      if (attempt !== joinAttempt) { room.close(); return; }
      online = { role: 'guest', room, code, seat: -1, hostName: 'the host', players: [], lastTickAt: 0 };
      room.send({ t: 'hello', v: Online.VERSION, name: localName(), owner: Records.playerId(), scores: Records.shareable(localName()) });
      setUrlCode(code);
      updateHelp();
    } catch (err) {
      if (attempt !== joinAttempt) return;
      showCard({
        title: 'Play with friends', text: err.message, primary: 'Try again', secondary: 'Back',
        lobby: { name: true, join: true }, actions: { primary: () => joinRoom(code), secondary: backToStart },
      });
      lobbyName.value = Records.hasName() ? Records.getName() : '';
      lobbyCode.value = code;
    }
  }

  function showGuestLobby() {
    showCard({
      title: `Room ${online.code}`, text: FLAVOR.waiting(online.hostName), secondary: 'Leave room',
      lobby: { players: true }, actions: { secondary: leaveRoom },
    });
  }

  function fromHost(msg) {
    if (!guesting()) return;
    try { handleHost(msg); } catch { /* a message we can't use (a newer or modified host): ignore it */ }
  }
  function handleHost(msg) {
    switch (msg.t) {
      case 'welcome':
        if (state === 'lobby') showGuestLobby();
        break;
      case 'reject':
        endOnline();
        state = 'lobby';
        showCard({
          title: 'Play with friends', primary: 'Back', actions: { primary: backToStart },
          text: msg.why === 'full' ? 'That room is full: four people already.' : 'That room runs a different version of the game. Reload both pages and try again.',
        });
        break;
      case 'lobby':
        if (!Array.isArray(msg.players)) break;
        online.players = msg.players.slice(0, Online.MAX_PEOPLE).filter(p => p && typeof p.name === 'string');
        online.hostName = msg.players.find(p => p.host)?.name || 'the host';
        if (state === 'lobby') showGuestLobby();
        else if (!lobbyPlayers.hidden) renderPlayers();
        break;
      case 'round': guestRound(msg); break;
      case 'scores':
        for (const f of Array.isArray(msg.from) ? msg.from : []) Records.importShared(f?.entries, f?.color);
        break;
      case 'phase':
        if (msg.s === 'countdown' && state === 'countdown') showBeat(msg.beat);
        else if (msg.s === 'go' && state === 'countdown') go();
        break;
      case 'tick': hostTick(msg); break;
      case 'say': // (the host's last line can arrive after the round ended here)
        if ((state === 'countdown' || state === 'running') && game.snakes[msg.id] && typeof msg.text === 'string') Chatter.replay(game.snakes[msg.id], msg.text.slice(0, 200), msg.reply === true);
        break;
      case 'closed': hostLost('closed'); break;
    }
  }

  // The host's new round, laid out on a friend's screen.
  function guestRound(msg) {
    online.seat = msg.humans.findIndex(h => h.peer === online.room.id);
    newGame({ humans: msg.humans, personas: msg.personas });
    game.roundId = typeof msg.id === 'string' ? msg.id : '';
    game.snakes.forEach((s, i) => { if (msg.humans[i]) s.owner = msg.humans[i].owner; });
    Online.apply(game, msg.first, DIRS);
    for (const s of game.snakes) rememberPrev(s);
    updateHud(true);
    game.rivalsLine = online.seat < 0 ? pick(FLAVOR.spectators) : msg.rivals;
    state = 'countdown';
    updateControls();
    showCard({ title: '…', text: game.rivalsLine, opponents: true, quiet: true, beat: true });
    showYou(playerAlive());
  }

  function hostLost(reason) {
    if (!guesting()) return;
    const { hostName: name, code } = online;
    endOnline();
    state = 'lobby';
    updateControls();
    if (reason === 'closed') showCard({ title: 'Room closed', text: FLAVOR.roomGone(name), primary: 'Back', actions: { primary: backToStart } });
    else showCard({ title: 'Connection lost', text: FLAVOR.roomLost, primary: 'Rejoin', secondary: 'Back', actions: { primary: () => joinRoom(code), secondary: backToStart } });
  }

  // ------------- leaving

  function leaveRoom() {
    if (hosting()) online.room.broadcast({ t: 'closed' });
    endOnline();
    ready();
  }

  function endOnline() {
    const { room } = online;
    online = null;
    keepTimeWhileHidden(false);
    setUrlCode(null);
    updateHelp();
    setTimeout(() => room.close(), 300); // let a goodbye get out first
  }

  click(friendsBtn, openFriends);
  click(lobbyCopy, async () => {
    const link = lobbyLink.value;
    if (navigator.share && touchFirst && link.startsWith('http')) {
      try { await navigator.share({ title: 'Bark & Bite', text: 'Come and play snake on a mossy log with me:', url: link }); return; } catch { /* cancelled: copy instead */ }
    }
    try {
      await navigator.clipboard.writeText(link);
      setStatus('Link copied. Send it to your friends.');
    } catch {
      lobbyLink.select();
      setStatus('Select the link and copy it.');
    }
  });
  lobbyCopy.textContent = navigator.share && touchFirst ? 'Share link' : 'Copy link';
  lobbyLink.addEventListener('focus', () => lobbyLink.select());
  lobbyCode.addEventListener('input', () => {
    if (/join=/i.test(lobbyCode.value)) lobbyCode.value = codeIn(lobbyCode.value);
  });
  lobbyJoin.addEventListener('submit', e => {
    e.preventDefault();
    Audio.unlock();
    joinRoom(lobbyCode.value);
  });
  lobbyName.addEventListener('change', saveLobbyName);
  // The host passes the chatter on, so every screen has the same lines.
  Chatter.onSpeak((s, text, reply) => {
    if (hosting() && (state === 'countdown' || state === 'running')) online.room.broadcast({ t: 'say', id: s.id, text, reply });
  });
  // Back from the back/forward cache, a room that was closed on the way out is gone.
  window.addEventListener('pageshow', e => {
    if (!e.persisted || !online) return;
    if (guesting()) hostLost('silent');
    else { endOnline(); ready(); }
  });
  // Closing the tab says goodbye, so friends aren't left waiting.
  window.addEventListener('pagehide', () => {
    if (hosting()) online.room.broadcast({ t: 'closed' });
    if (online) online.room.close();
  });

  // ------------------------------------------------- size and motion

  R.init({ canvas, personas: PERSONAS, birdLayer: $('bird-layer') });
  // Where the board is on the page (the woodpecker perches beside it, on its own layer).
  // ...and how far the free page runs round it before the tags, the speed
  // buttons, the chatter or the header (no perching on those).
  const furniture = ['header', '.scoreboard', '.speed', '.chatter'].map(q => document.querySelector(q)).filter(Boolean);
  const placeBoard = () => {
    const b = canvas.getBoundingClientRect(), free = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    for (const el of furniture) {
      const f = el.getBoundingClientRect();
      if (!f.width || !f.height) continue; // (hidden)
      const across = f.left < b.right && f.right > b.left, along = f.top < b.bottom && f.bottom > b.top;
      if (across && f.bottom <= b.top + 1) free.top = Math.max(free.top, f.bottom);
      else if (across && f.top >= b.bottom - 1) free.bottom = Math.min(free.bottom, f.top);
      else if (along && f.right <= b.left + 1) free.left = Math.max(free.left, f.right);
      else if (along && f.left >= b.right - 1) free.right = Math.min(free.right, f.left);
    }
    R.setBoardRect(b.left, b.top, b.width, free);
  };
  window.addEventListener('resize', placeBoard, { passive: true });
  window.addEventListener('scroll', placeBoard, { passive: true });
  new ResizeObserver(placeBoard).observe(document.querySelector('main')); // (the page around the board changed: it may have moved)
  Chatter.init({ boardEl, logEl: chatlogEl });

  const sizer = new ResizeObserver(entries => {
    const e = entries[0];
    const w = e.contentRect.width;
    if (!w) return;
    boardPx = w;
    R.resize(w, e.devicePixelContentBoxSize?.[0]?.inlineSize);
    placeBoard();
    Chatter.setCompact(w < 420);
    dirty = true;
  });
  // The device-pixel box also reports browser zoom; older browsers get the CSS box.
  try { sizer.observe(canvas, { box: 'device-pixel-content-box' }); } catch { sizer.observe(canvas); }
  // (Browsers without the device-pixel box don't report a density change on
  // its own, say moving to another monitor, so listen for that too.)
  (function watchDensity() {
    const mq = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    mq.addEventListener?.('change', () => { if (boardPx) { R.resize(boardPx); dirty = true; } watchDensity(); }, { once: true });
  })();

  const applyMotion = () => R.setReducedMotion(reducedMQ.matches);
  reducedMQ.addEventListener?.('change', applyMotion);
  applyMotion();

  // ------------------------------------------- dev: frame-time overlay

  // Behind ?perf or ?debug, toggled with the ` key: average and worst frame
  // time (script + canvas) and tick cost over the last 120 frames.
  const perf = (() => {
    const N = 120;
    const frames = new Float32Array(N), ticks = new Float32Array(N);
    let i = 0, n = 0, el = null, shown = params.has('perf'), lastPaint = 0;
    return {
      record(ms, tickMs) {
        frames[i] = ms; ticks[i] = tickMs; i = (i + 1) % N; n = Math.min(N, n + 1);
        if (!shown) return;
        const now = performance.now();
        if (now - lastPaint < 250) return;
        lastPaint = now;
        let sum = 0, worst = 0, tsum = 0, tworst = 0;
        for (let j = 0; j < n; j++) { sum += frames[j]; worst = Math.max(worst, frames[j]); tsum += ticks[j]; tworst = Math.max(tworst, ticks[j]); }
        el.textContent = `frame ${(sum / n).toFixed(2)} ms avg · ${worst.toFixed(2)} worst\ntick  ${(tsum / n).toFixed(2)} ms avg · ${tworst.toFixed(2)} worst\nparticles ${R.particles}`;
      },
      toggle() {
        shown = !shown;
        if (!el) { el = document.createElement('pre'); el.className = 'perf'; document.body.append(el); }
        el.hidden = !shown;
      },
      stats() {
        const list = Array.from(frames.slice(0, n)).sort((a, b) => a - b);
        return { avg: list.reduce((a, b) => a + b, 0) / (n || 1), p95: list[Math.floor(n * 0.95)] || 0, worst: list[n - 1] || 0 };
      },
      init() { if (shown) { shown = false; this.toggle(); } },
    };
  })();
  perf.init();

  // ---------------------------------------------------------- start

  // The first decision a brain makes runs cold (the JIT hasn't seen its
  // paths yet), so each rival makes one practice decision, on a scratch
  // memory, while the start card is up.
  function warmUp() {
    if (state !== 'ready' || !game) return;
    for (const s of game.snakes) if (s.persona) SnakeAI.decide(E.aiView(game, s), s.persona, {});
  }

  // The start card shows this round's rivals.
  function ready(personas) {
    startBtn.disabled = false; // (a room that never opened left it disabled)
    newGame({ personas });
    state = 'ready';
    showCard({ title: `Ready, ${localName()}?`, text: FLAVOR.intro, primary: 'Play', secondary: 'Watch AIs', opponents: true, friends: true });
    setTimeout(warmUp, 400);
  }

  // The controls under the board (online there's no napping or starting over).
  // The help under the board, for what you can do now (written only when it changes).
  function updateHelp() {
    const watching = !online && (state === 'running' || state === 'countdown' || state === 'paused') && !playerAlive();
    const text = online ? (touchFirst ? FLAVOR.hintOnlineTouch : FLAVOR.hintOnline) : watching ? (touchFirst ? FLAVOR.hintWatchTouch : FLAVOR.hintWatch) : (touchFirst ? FLAVOR.hintTouch : FLAVOR.hintKeys);
    if (text !== helpText) { helpText = text; setHint(helpEl, text); }
  }

  // Hints wrap only between items ("Space naps" never splits across lines).
  // Items joined by " · ", each kept whole, a line breaking only after a dot
  // (the dot rides with the item before it); ⏸ drawn as the pause button's bars.
  function setHint(el, text) {
    el.textContent = '';
    const items = text.split(' · ');
    items.forEach((item, i) => {
      if (i) el.append(' ');
      const span = document.createElement('span');
      if (item.length <= 24) span.className = 'whole';
      item.split('⏸').forEach((part, j) => { if (j) span.append(pauseGlyph()); if (part) span.append(part); });
      if (i < items.length - 1) {
        const sep = document.createElement('i'); sep.className = 'sep'; sep.textContent = '\u00a0·'; sep.setAttribute('aria-hidden', 'true');
        const pause = document.createElement('span'); pause.className = 'sr-only'; pause.textContent = ', '; // (heard as a list, not "dot")
        span.append(sep, pause);
      }
      el.append(span);
    });
  }
  const setText = (el, text) => (text.includes(' · ') ? setHint(el, text) : (el.textContent = text));
  function pauseGlyph() {
    const t = document.createElement('template');
    t.innerHTML = '<svg class="glyph" viewBox="0 0 10 12" role="img" aria-label="pause"><rect x="1" y="1" width="3" height="10" rx="1.5"/><rect x="6" y="1" width="3" height="10" rx="1.5"/></svg>';
    return t.content.firstChild;
  }
  setHint(hintEl, touchFirst ? FLAVOR.hintTouch : FLAVOR.hintStart);
  updateHelp();
  showChatterState();
  ready();
  updateControls();
  requestAnimationFrame(loop);
  // A friend's link (?join=CODE) goes straight to their room.
  if (params.get('join')) joinRoom(params.get('join'));

  // Test hooks, only with ?debug. The test pane runs hidden, where browsers
  // pause requestAnimationFrame, so frames(n) drives the loop by hand.
  if (params.has('debug')) {
    let fake = performance.now();
    window.SnakeDebug = {
      game: () => game,
      state: () => state,
      online: () => online && { role: online.role, seat: online.seat, code: online.code, players: online.players, rtt: hosting() ? online.room.rtt() : null },
      setup: ready,
      step: E.step,
      createGame: E.createGame,
      perf: () => perf.stats(),
      frames(count, ms = 1000 / 60) {
        fake = Math.max(fake, lastFrame); // real frames may have run ahead meanwhile
        for (let j = 0; j < count; j++) { fake += ms; frame(fake); }
        return state;
      },
      draw: () => R.frame(drawAlpha, boardClock),
      pinQuality(q) { governor.pinned = true; R.setQuality(q); dirty = true; }, // (benchmarks: the governor stays out of it)
    };
  }
})();
