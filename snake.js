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
  const canvas = $('game'), boardEl = document.querySelector('.board'), mainEl = document.querySelector('main');
  const scoreEl = $('score'), bestEl = $('best'), tagsEl = $('scoreboard');
  const overlay = $('overlay'), cardTitle = $('overlay-title'), cardText = $('overlay-text');
  const flavorEl = $('overlay-flavor'), badgeEl = $('overlay-badge'), opponentsEl = $('opponents');
  const nameRow = $('name-row'), nameRank = $('name-rank'), nameInput = $('name-input');
  const startBtn = $('start'), watchBtn = $('watch');
  const toastEl = $('toast'), speedEl = $('speed'), announcer = $('announcer'), hintEl = $('hint'), helpEl = $('help');
  const pauseBtn = $('pause'), muteBtn = $('mute'), musicBtn = $('music'), chatterBtn = $('chatter-toggle'), chatlogEl = $('chatlog');
  const recordsEl = $('records'), recordsBody = $('records-body');
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

  const pick = list => list[Math.floor(Math.random() * list.length)];
  const FLAVOR = {
    intro: 'Three rivals. One tree. Last snake wriggling wins.',
    hintKeys: 'Arrows or WASD steer · Space naps · Enter starts over · H for the Hall of Fame',
    hintTouch: 'Swipe on the bark to steer · tap ⏸ to nap',
    rivals: ['Your rivals today:', 'Up the tree with you:', 'Sharing your bark:'],
    spectators: ['Tonight on the bark:', 'In the ring today:', 'Place your bets:'],
    go: ['Slither!', 'Off you go!', 'Go, go, go!'],
    pause: ['Snakes need rest too.', 'Having a little nap on the bark.', 'The tree will wait.'],
    wake: touchFirst ? 'Tap Wake up when you’re ready.' : 'Space or P to wake up.',
    deathTitle: { wall: ['Bonk!', 'Splat!', 'Oof.'], self: ['Tangled!', 'Knotted!', 'Oops.'], rival: ['Squashed!', 'Splat!', 'Oof.'], headOn: ['Bonk!', 'Head-on!'] },
    wall: ['The tree goes on. You don’t.', 'That edge came out of nowhere.'],
    self: ['You tied yourself in a knot.', 'Ouch. That was your own tail.'],
    hole: ['The woodpecker sends its regards.', 'Mind the gap.'],
    starved: ['Should have eaten something.', 'Hunger always wins in the end.'],
    win: ['King of the tree!', 'Last snake wriggling.', 'You outlasted them all.'],
    draw: ['Nobody made it out.', 'Everyone loses. How fair.'],
    golden: ['A golden apple! Everyone pretends not to have seen it.', 'Something shiny just grew on the bark.'],
    woodpecker: ['The woodpecker is here. Holes are closing in from the edges.', 'Knock knock. The woodpecker has arrived.'],
    youGolden: ['Golden! +3.', 'Shiny and delicious. +3.'],
    youMushroom: ['You feel smaller. And somehow wiser.', 'A little less of you. Sneaky.'],
    youHungry: ['Your tummy is rumbling. Eat something!', 'Getting peckish… find food soon!'],
    newBest: n => `New best: ${n}!`,
    friendWin: ['Bragging rights, for now.', 'Rematch?', 'Fair and square. Probably.'],
    friendKill: ['No hard feelings. Probably.', 'Friendship is complicated.', 'That calls for a rematch.'],
    friendsIntro: 'Host a game and send your friends the link, or join theirs. Empty seats get AI rivals.',
    hostIntro: 'Send this link to up to three friends. Empty seats get AI rivals.',
    joining: code => `Knocking on room ${code}…`,
    waiting: (name, next) => `Waiting for ${name} to start the ${next ? 'next ' : ''}round.`,
    roomGone: name => `${name} closed the room.`,
    roomLost: 'Lost the connection to the room.',
    friendLeft: name => `${name} left. An AI takes over their snake.`,
    friendJoined: name => `${name} joined, with their best rounds for your Hall of Fame.`,
    friendAway: name => `${name} went quiet. An AI steers until they’re back.`,
    friendBack: name => `${name} is back.`,
    youAway: 'You went quiet for a moment, so an AI steered for you.',
    watchingFirst: 'You’re watching this round. You’re in from the next one.',
  };

  // "you" for your own snake, the name for everyone else.
  const who = (s, object = false) => isMe(s) ? (object ? 'you' : 'You') : s.name;
  // A death as you see it: causes name names, and yours becomes "you".
  function causeFor(s) {
    const k = s.killerId != null && s.killer !== 'self' ? game.snakes[s.killerId] : null;
    return k && isMe(k) && s.cause.endsWith(k.name) ? s.cause.slice(0, -k.name.length) + 'you' : s.cause;
  }
  // Your death, in the second person.
  const yourCause = p => p.killer === 'self' ? 'bit yourself' : causeFor(p);

  // ---------------------------------------------------------- game state

  // state: 'ready' (start card) | 'lobby' (play with friends) | 'countdown' | 'running' | 'paused' | 'over'
  let game, state = 'ready', speed = 1;
  // Online play, or null when playing alone:
  // { role: 'host' | 'guest', room, code, seat (yours in this round, -1 if watching),
  //   players: [{ id, name, color }] (host: everyone in the room, seat order),
  //   hostName, lastTickAt, holesSent }
  let online = null;
  const hosting = () => online?.role === 'host';
  const guesting = () => online?.role === 'guest';
  let acc = 0, tickLen = T.OPENING_TICK, lastFrame = 0, drawAlpha = 1, dirty = true;
  let beatsLeft = 0, beatTimer = 0;
  let freezeUntil = 0, pendingCard = null, cardAt = 0; // times on the frame clock (rAF timestamps)
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
  const mood = { intensity: 0, watching: false, paused: false };
  function musicStage() {
    if (state !== 'running' && state !== 'paused') return 'title';
    let alive = 0;
    for (const s of game.snakes) if (s.alive) alive++;
    mood.intensity = Math.min(1, game.time / T.RAMP_MS);
    mood.watching = spectating();
    mood.paused = state === 'paused';
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
    const dt = lastFrame ? Math.max(0, Math.min(250, now - lastFrame)) : 16;
    lastFrame = now;
    const t0 = performance.now();
    let tickCost = 0;

    if (state === 'countdown' && !guesting()) {
      beatTimer -= dt;
      if (beatTimer <= 0) beat();
      dirty = true;
    }

    if (state === 'running' && guesting()) {
      // A friend's screen doesn't simulate: it glides between the host's ticks.
      if (pendingCard && now >= freezeUntil) { const c = pendingCard; pendingCard = null; showCard(c); }
      drawAlpha = Math.min(1, (performance.now() - online.lastTickAt) / tickLen);
      dirty = true;
    } else if (state === 'running') {
      if (now >= freezeUntil) {
        if (pendingCard) { const c = pendingCard; pendingCard = null; showCard(c); }
        acc += dt;
        let steps = 0;
        while (acc >= tickLen && steps < 4 && state === 'running' && now >= freezeUntil) {
          acc -= tickLen;
          const ts = performance.now();
          tick();
          tickCost += performance.now() - ts;
          steps++;
        }
        if (steps === 4) acc = Math.min(acc, tickLen); // after a long stall, don't race to catch up
        think(dt);
        drawAlpha = state === 'running' && now >= freezeUntil ? Math.min(1, acc / tickLen) : 1;
      }
      dirty = true;
    } else if (state === 'over') {
      if (pendingCard && now >= cardAt) { const c = pendingCard; pendingCard = null; showCard(c); }
      drawAlpha = 1;
      if (R.particles > 0 || pendingCard) dirty = true;
    }

    Audio.music(musicStage(), mood);

    if (dirty && !document.hidden) {
      R.frame(drawAlpha, now);
      Chatter.layout(drawAlpha, boardPx);
      dirty = state === 'running' || state === 'countdown' || R.particles > 0;
    }
    perf.record(performance.now() - t0, tickCost);
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
  function think(dt) {
    if (!thinkQueue.length) return;
    const framesLeft = Math.max(1, Math.floor((tickLen - acc) / Math.max(4, dt)));
    let quota = Math.ceil(thinkQueue.length / framesLeft);
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
    if (wasPiloted && !piloted && player() && performance.now() - online.pilotedAt > 2000) toast(FLAVOR.youAway, 2200);
    tickLen = msg.len || E.tickMs(game);
    online.lastTickAt = performance.now();
    afterTick(dying, wasAlive);
  }

  // What follows a tick on every screen: effects, sounds, the HUD, banners, placements.
  function afterTick(dying, wasAlive) {
    R.onTick(game.events);
    sounds(dying, wasAlive);
    updateHud();
    announce(dying);

    // Everyone still alive finished ahead of the snakes that just died; if
    // nobody is, they share first place (a draw).
    const alive = game.snakes.filter(s => s.alive);
    for (const s of dying) finishSnake(s, { place: alive.length + 1, draw: alive.length === 0 });
    thinkQueue = guesting() ? [] : alive.filter(s => !s.isPlayer || s.autopilot);
    if (alive.length <= 1) {
      if (alive.length) finishSnake(alive[0], { place: 1, won: true });
      return endRound();
    }
    if (wasAlive && !playerAlive()) youDied();
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
    acc = 0;
    tickLen = E.tickMs(game);
    drawAlpha = 1;
    thinkQueue = guesting() ? [] : game.snakes.filter(s => s.persona);
    freezeUntil = 0;
    pendingCard = null;
    R.setGame(game);
    Chatter.reset(game);
    hideToast();
    buildTags();
    buildOpponents();
    updateHud(true);
    dirty = true;
  }

  // Start a round in the given mode. The round on the start card is used as-is;
  // anything else gets a fresh one.
  function start({ aiOnly = !game.withPlayer } = {}) {
    if (state === 'lobby' && !hosting()) return; // the lobby's own buttons decide
    if (online) {
      // Online, the host starts every round; friends wait for it.
      if (hosting() && (state === 'lobby' || state === 'over')) startOnlineRound();
      return;
    }
    if (state !== 'ready' || aiOnly !== !game.withPlayer) newGame({ aiOnly });
    state = 'countdown';
    beatsLeft = 3;
    beatTimer = 0;
    game.rivalsLine = pick(game.withPlayer ? FLAVOR.rivals : FLAVOR.spectators);
    updateControls();
    beat();
  }

  function beat() {
    if (beatsLeft === 0) return go();
    if (hosting()) online.room.broadcast({ t: 'phase', s: 'countdown', beat: beatsLeft });
    showBeat(beatsLeft);
    beatsLeft--;
    beatTimer = T.COUNTDOWN_BEAT;
  }

  // Online the countdown can't be skipped (everyone starts together).
  function showBeat(n) {
    Audio.play('beat');
    showCard({ title: String(n), text: game.rivalsLine, primary: online ? null : 'Go!', opponents: true, quiet: true });
  }

  function go() {
    if (hosting()) online.room.broadcast({ t: 'phase', s: 'go' });
    if (guesting()) online.lastTickAt = performance.now();
    state = 'running';
    hideCard();
    Audio.play('go');
    if (guesting() && online.seat < 0) toast(FLAVOR.watchingFirst, 3000);
    else toast(pick(FLAVOR.go), 1100);
    acc = 0;
    lastFrame = 0;
    updateControls();
    say(game.withPlayer ? 'Go.' : 'The AIs are off.');
  }

  function pause() {
    if (state !== 'running' || online) return; // no napping online: the round goes on for everyone
    state = 'paused';
    Chatter.clearBubbles();
    showCard({
      title: 'Napping', text: `${pick(FLAVOR.pause)} ${FLAVOR.wake}`,
      primary: 'Wake up', secondary: touchFirst ? 'Start over' : null,
    });
    updateControls();
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'running';
    hideCard();
    lastFrame = 0;
    updateControls();
  }

  function youDied() {
    const p = player();
    freezeUntil = lastFrame + (reducedMQ.matches ? T.DEATH_FREEZE / 2 : T.DEATH_FREEZE);
    R.shake(T.SHAKE_PX);
    const titles = FLAVOR.deathTitle;
    const title = p.killer === 'hunger' ? 'Starved!' : p.cause === 'fell into a woodpecker hole' ? 'Down the hole!'
      : pick(p.killer === 'wall' ? titles.wall : p.killer === 'self' ? titles.self : p.cause.startsWith('crashed') ? titles.headOn : titles.rival);
    pendingCard = {
      title,
      text: `You ${yourCause(p)} · ${Records.ordinal(game.result.place)} place · score ${p.eaten}`,
      flavor: killLine(p), primary: 'Play again', secondary: 'Watch', reward: true,
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
    const flavor = !winner ? pick(FLAVOR.draw) : isMe(winner) ? pick(FLAVOR.win) : winner.persona ? winner.persona.win : pick(FLAVOR.friendWin);
    if (isMe(winner)) Audio.play('win');
    const me = player();
    const yours = me && game.result
      ? `You finished ${game.result.won ? '1st' : Records.ordinal(game.result.place)} · ${Records.clock(game.result.survived)} · score ${me.eaten}`
      : '';
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
    game.entryId = Records.recordPlayer({ ...s.result, killer: s.alive ? null : s.killer, round: game.roundId });
    if (s.eaten > best) { best = s.eaten; Records.setBest(best); bestEl.textContent = best; }
    game.newBest = s.eaten > before && s.eaten > 0;
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

  // Flavor for the death card: the killer's own line, if an AI got you.
  function killLine(p) {
    const killer = game.snakes.find(s => s !== p && s.name === p.killer);
    if (killer?.persona) return killer.persona.kill;
    if (killer) return pick(FLAVOR.friendKill);
    if (p.cause === 'fell into a woodpecker hole') return pick(FLAVOR.hole);
    if (p.killer === 'self') return pick(FLAVOR.self);
    if (p.killer === 'hunger') return pick(FLAVOR.starved);
    return pick(FLAVOR.wall);
  }

  // ------------------------------------------------------- sounds, banners

  function sounds(dying, wasAlive) {
    for (const e of game.events) {
      if (e.type === 'eat' && isMe(e.snake)) {
        Audio.play(e.kind === 'golden' ? 'golden' : e.kind === 'pellet' ? 'meat' : e.kind === 'mushroom' ? 'mushroom' : 'eat');
        bump(scoreEl);
      } else if (e.type === 'woodpecker') Audio.play('woodpecker');
      else if (e.type === 'peck') Audio.play('peck');
      else if (e.type === 'starving' && isMe(e.snake)) Audio.play('hungry');
    }
    for (const s of dying) if (!isMe(s)) Audio.play('rivalDeath');
    if (wasAlive && !playerAlive()) Audio.play('death');
  }

  // Banners for the big moments of a round (one per tick, most important first).
  function announce(dying) {
    const alive = game.snakes.filter(s => s.alive);
    if (dying.length && !game.firstBlood) {
      game.firstBlood = true;
      const v = dying[0];
      const killer = game.snakes.find(o => o.name === v.killer && o !== v);
      return toast(killer ? `First blood! ${who(killer)} got ${who(v, true)}.` : `First blood: ${who(v)} ${isMe(v) ? yourCause(v) : causeFor(v)}.`);
    }
    for (const e of game.events) if (e.type === 'woodpecker') return toast(pick(FLAVOR.woodpecker));
    if (dying.length && alive.length === 2) {
      const [a, b] = isMe(alive[0]) ? [alive[1], alive[0]] : alive;
      return toast(`It's down to ${who(a)} and ${who(b, true)}.`);
    }
    const me = player();
    if (me?.alive) {
      const left = E.hungerLeft(game, me);
      if (left < T.HUNGER_WARN_MS && !game.warnedHunger) { game.warnedHunger = true; return toast(pick(FLAVOR.youHungry)); }
      if (left > T.HUNGER_WARN_MS) game.warnedHunger = false;
    }
    for (const e of game.events) {
      if (e.type === 'spawn' && e.kind === 'golden') return toast(pick(FLAVOR.golden));
      if (e.type === 'eat' && isMe(e.snake) && e.kind === 'golden') return toast(pick(FLAVOR.youGolden), 1500);
      if (e.type === 'eat' && isMe(e.snake) && e.kind === 'mushroom') return toast(pick(FLAVOR.youMushroom), 1800);
    }
  }

  let toastTimer;
  function toast(text, ms = 2800) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    say(text);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, ms);
  }
  function hideToast() { clearTimeout(toastTimer); toastEl.hidden = true; }

  // Screen reader announcements (a permanently rendered, visually hidden region).
  function say(text) { announcer.textContent = text; }

  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth; // restart the CSS animation (a rare, deliberate reflow on a bite)
    el.classList.add('bump');
  }

  // ----------------------------------------------------------- the cards

  // card = { title, text, flavor, primary, secondary, opponents, reward, quiet,
  //   friends (show "Play with friends"), lobby (which lobby parts, see renderLobby),
  //   actions: { primary, secondary } (what the buttons do, instead of the usual) }
  let cardActions = null;
  function showCard(card) {
    hideToast();
    cardTitle.textContent = card.title;
    cardText.textContent = card.text || '';
    cardText.hidden = !card.text;
    flavorEl.textContent = card.flavor || '';
    flavorEl.hidden = !card.flavor;
    opponentsEl.hidden = !card.opponents;
    hintEl.hidden = state !== 'ready';
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
      }
      if (game.newBest) { badgeEl.textContent = FLAVOR.newBest(best); badgeEl.hidden = false; }
      const rank = Records.rankOf(game.entryId);
      if (rank.overall && (rank.overall <= 3 || game.newBest)) {
        nameRank.textContent = `Hall of Fame #${rank.overall}. Carve your name:`;
        nameRow.hidden = false;
      } else if (rank.personal === 1 && game.newBest) {
        nameRank.textContent = 'Your best round yet. Carve your name:';
        nameRow.hidden = false;
      }
      if (!nameRow.hidden && document.activeElement !== nameInput) nameInput.value = Records.hasName() ? Records.getName() : '';
    }

    overlay.classList.remove('hidden');
    overlay.querySelector('.card').scrollTop = 0;
    if (!card.quiet) say(`${card.title}. ${card.text || ''} ${card.flavor || ''}`);
    // The name field only takes focus the first time, on a keyboard: once you
    // have a name, Enter and R restart straight away, and phones never get
    // their keyboard popped up over the card.
    if (document.activeElement !== nameInput) {
      const invite = !nameRow.hidden && !touchFirst && !Records.hasName();
      (invite ? nameInput : card.primary ? startBtn : card.secondary ? watchBtn : overlay.querySelector('.card')).focus({ preventScroll: true });
    }
    updateControls();
  }

  function hideCard() {
    overlay.classList.add('hidden');
  }

  function buildOpponents() {
    opponentsEl.textContent = '';
    for (const s of game.snakes) {
      if (!s.persona) continue;
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = dotColor(s);
      const name = document.createElement('strong');
      name.textContent = s.name;
      const blurb = document.createElement('span');
      blurb.className = 'blurb';
      blurb.textContent = s.persona.blurb;
      li.append(dot, name, ' ', blurb);
      opponentsEl.append(li);
    }
  }

  // ------------------------------------------------------------- the HUD

  // Each snake's tag (dot, name, length, hunger bar). Values are written only
  // when they change.
  function buildTags() {
    tagsEl.textContent = '';
    for (const s of game.snakes) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="dot"></span><span class="name"></span><span class="len"></span><span class="hunger"><i></i></span>';
      li.querySelector('.name').textContent = isMe(s) ? 'You' : s.name;
      li.title = s.persona ? `${s.name}: ${s.persona.blurb}` : isMe(s) ? 'You' : `${s.name}, a friend`;
      tagsEl.append(li);
      s.tag = { li, dot: li.querySelector('.dot'), len: li.querySelector('.len'), bar: li.querySelector('.hunger i'), last: {} };
    }
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
    for (const s of game.snakes) {
      const t = s.tag, last = t.last;
      const dot = dotColor(s);
      const len = s.alive ? String(s.body.length) : 'out';
      const full = s.alive ? Math.max(0, Math.min(1, E.hungerLeft(game, s) / T.HUNGER_MS)) : 0;
      const bar = Math.round(full * 100);
      const starving = s.alive && full < 0.3;
      if (force || last.dot !== dot) { t.dot.style.background = dot; last.dot = dot; }
      if (force || last.len !== len) { t.len.textContent = len; last.len = len; }
      if (force || last.bar !== bar) { t.bar.style.transform = `scaleX(${bar / 100})`; last.bar = bar; }
      if (force || last.alive !== s.alive) { t.li.classList.toggle('dead', !s.alive); last.alive = s.alive; }
      if (force || last.starving !== starving) { t.li.classList.toggle('starving', starving); last.starving = starving; }
    }
  }

  // The scoreboard dot: the snake's current color, a rainbow for Wildcard,
  // two-tone for Joker, and Vulture's pink head (black would vanish).
  function dotColor(s) {
    if (s.personaKey === 'wildcard') return 'conic-gradient(#f87171, #facc15, #4ade80, #22d3ee, #818cf8, #f472b6, #f87171)';
    if (s.personaKey === 'joker') return 'linear-gradient(90deg, #a21caf 50%, #f59e0b 50%)';
    return s.persona?.ink || R.colorOf(s);
  }

  // Pause, mute and speed controls: shown and labelled for the current state.
  function updateControls() {
    const canPause = !online && (state === 'running' || state === 'paused');
    pauseBtn.disabled = !canPause;
    pauseBtn.setAttribute('aria-label', state === 'paused' ? 'Wake up' : 'Nap (pause)');
    pauseBtn.dataset.paused = String(state === 'paused');
    speedEl.hidden = !(canPause && spectating());
    for (const b of speedEl.querySelectorAll('button')) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === speed));
    // Pressed means off (the icon gets its slash); the names stay put.
    muteBtn.setAttribute('aria-pressed', String(Audio.isMuted()));
    musicBtn.setAttribute('aria-pressed', String(!Audio.isMusicOn()));
    musicBtn.disabled = Audio.isMuted();
  }

  function setSpeed(n) {
    speed = n;
    tickLen = E.tickMs(game) / (spectating() ? speed : 1);
    updateControls();
  }

  // ------------------------------------------------------------- input

  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  const CODES = { KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' }; // physical keys, so AZERTY works

  // Queue a turn (up to T.QUEUE ahead), checked against the last queued
  // direction so no combo of quick presses can reverse into the neck.
  function turn(name, p = player()) {
    const next = DIRS[name];
    const last = p.queue.length ? p.queue[p.queue.length - 1] : p.dir;
    if (next === last || (next.x === -last.x && next.y === -last.y)) return;
    if (p.queue.length < T.QUEUE) p.queue.push(next);
  }

  // A direction: steers, and during the countdown also skips it.
  function steer(name) {
    if (!playerAlive()) return;
    if (online) {
      // Online the countdown runs its course; turns go to the host's game.
      if (state !== 'countdown' && state !== 'running') return;
      if (guesting()) online.room.send({ t: 'turn', d: name });
      else hostTurn(name);
    } else if (state === 'countdown') { turn(name); go(); }
    else if (state === 'running') turn(name);
  }

  // The host plays with no lag, while friends' turns take half a round trip to
  // arrive. So the host's own turns wait that long too: no one gets a head start.
  function hostTurn(name) {
    const me = player();
    const delay = Math.min(150, online.room.rtt() / 2);
    if (delay < 4) return turn(name, me);
    setTimeout(() => { if (me.alive && game.snakes[me.id] === me) turn(name, me); }, delay);
  }

  function napKey() {
    if (online) return; // no napping online
    if (state === 'running') pause();
    else if (state === 'paused') resume();
    else if (state === 'countdown') go();
    else start();
  }

  document.addEventListener('keydown', e => {
    Audio.unlock();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target === nameInput) {
      if (e.key === 'Enter') { e.preventDefault(); nameInput.blur(); startBtn.focus({ preventScroll: true }); }
      return;
    }
    if (e.target.closest?.('input, textarea')) return; // typing a name or a room code
    if (!recordsEl.hidden) {
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') { e.preventDefault(); closeRecords(); }
      return;
    }
    const dir = KEYS[e.key] || CODES[e.code];
    if (dir) { e.preventDefault(); steer(dir); return; }
    if (e.repeat) { if (e.key === ' ') e.preventDefault(); return; }
    // Enter and Space on a focused button belong to the button.
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('button')) return;
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') { e.preventDefault(); napKey(); }
    else if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') { e.preventDefault(); start(); }
    else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); openRecords(); }
    else if (e.key === 'm' || e.key === 'M') toggleMute();
    else if (e.key === 'n' || e.key === 'N') toggleMusic();
    else if ((e.key === '1' || e.key === '2' || e.key === '3') && !speedEl.hidden) setSpeed([1, 2, 4][Number(e.key) - 1]);
    else if (e.key === '`' && DEV) perf.toggle();
  });

  // Swipes: a turn registers as soon as the finger has travelled half a cell,
  // without lifting, and one touch can chain several turns. The board never
  // scrolls the page (touch-action: none in the CSS, preventDefault here).
  let swipe = null;
  canvas.addEventListener('touchstart', e => {
    Audio.unlock();
    const t = e.changedTouches[0];
    if (!swipe) swipe = { id: t.identifier, x: t.clientX, y: t.clientY };
    if (state === 'running' || state === 'countdown') e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    if (!swipe) return;
    let t = null;
    for (const c of e.changedTouches) if (c.identifier === swipe.id) t = c;
    if (!t) return;
    e.preventDefault();
    const dx = t.clientX - swipe.x, dy = t.clientY - swipe.y;
    const threshold = Math.max(12, (boardPx || 320) / GRID * T.SWIPE_CELLS);
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    swipe.x = t.clientX;
    swipe.y = t.clientY;
  }, { passive: false });
  const endSwipe = e => { for (const c of e.changedTouches) if (swipe && c.identifier === swipe.id) swipe = null; };
  canvas.addEventListener('touchend', endSwipe);
  canvas.addEventListener('touchcancel', endSwipe);

  // Buttons.
  const click = (el, fn) => el.addEventListener('click', e => { Audio.unlock(); Audio.play('ui'); fn(e); });
  click(startBtn, () => {
    if (cardActions?.primary) cardActions.primary();
    else if (state === 'paused') resume();
    else if (state === 'countdown') go();
    else start({ aiOnly: false });
  });
  click(watchBtn, () => {
    if (cardActions?.secondary) cardActions.secondary();
    else if (state === 'running') hideCard();        // keep watching after you died
    else if (state === 'paused') start();            // "Start over" on touch
    else start({ aiOnly: true });
  });
  click(pauseBtn, () => (state === 'paused' ? resume() : pause()));
  click(muteBtn, () => toggleMute());
  click(musicBtn, () => toggleMusic());
  click(speedEl, e => { const b = e.target.closest('button'); if (b) setSpeed(Number(b.dataset.speed)); });
  click(chatterBtn, () => { Chatter.setEnabled(!Chatter.isEnabled()); showChatterState(); });

  function toggleMute() {
    Audio.toggleMuted();
    updateControls();
  }

  function toggleMusic() {
    Audio.unlock();
    Audio.toggleMusic();
    updateControls();
  }

  function showChatterState() {
    const on = Chatter.isEnabled();
    chatterBtn.textContent = on ? 'On' : 'Off';
    chatterBtn.setAttribute('aria-checked', String(on));
    chatlogEl.hidden = !on;
  }

  // Renaming your Hall of Fame entry from the card. Saved when you're done
  // (rivals use the new name from the next round).
  nameInput.addEventListener('change', () => {
    if (game.entryId) Records.rename(game.entryId, nameInput.value);
  });

  // Nap automatically when the tab is hidden, or when the window loses focus
  // while you're playing (a watched round can keep going on screen). Online the
  // round goes on regardless.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || online) return;
    if (state === 'countdown') { state = 'running'; pause(); }
    else if (state === 'running') pause();
  });
  window.addEventListener('blur', () => {
    if (state === 'running' && playerAlive() && !pendingCard && !online) pause();
  });

  // ------------------------------------------------------ Hall of Fame

  let recordsTab = 'scores', scoresFilter = 'all', recordsOpener = null;

  function openRecords() {
    if (online) { /* the round goes on behind the dialog */ }
    else if (state === 'countdown') { state = 'running'; pause(); }
    else if (state === 'running' && !pendingCard) pause();
    recordsOpener = document.activeElement;
    recordsEl.hidden = false;
    mainEl.inert = true;
    try { renderRecords(); } catch { recordsBody.textContent = 'The records are unreadable. Reset them below.'; }
    $('records-close').focus();
  }

  function closeRecords() {
    recordsEl.hidden = true;
    mainEl.inert = false;
    const back = !overlay.classList.contains('hidden') ? (startBtn.hidden ? watchBtn : startBtn) : recordsOpener;
    back?.focus?.({ preventScroll: true });
  }

  function renderRecords() {
    recordsTabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.tab === recordsTab)));
    filterTabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.filter === scoresFilter)));
    filterEl.hidden = recordsTab !== 'scores';
    recordsBody.textContent = '';
    if (recordsTab === 'scores') {
      Records.renderScores(recordsBody, game.entryId, scoresFilter, PLAYER_COLOR);
    } else {
      // Every persona's color, not just this round's, plus old names (Viper, Warden).
      const colors = { self: PLAYER_COLOR, Viper: '#c084fc', Warden: '#3b82f6' };
      for (const p of Object.values(PERSONAS)) colors[p.name] = p.ink || p.color;
      Records.renderStats(recordsBody, colors);
    }
  }

  recordsTabs.forEach(t => click(t, () => { recordsTab = t.dataset.tab; renderRecords(); }));
  filterTabs.forEach(t => click(t, () => { scoresFilter = t.dataset.filter; renderRecords(); }));
  click($('records-open'), openRecords);
  click($('records-close'), closeRecords);
  recordsEl.addEventListener('click', e => { if (e.target === recordsEl) closeRecords(); });
  click($('records-reset'), () => {
    if (!confirm('Delete all your scores, stats and your best?')) return;
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
        label.textContent = p.name;
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = [p.host && 'host', p.id === myId() && 'you'].filter(Boolean).join(' · ');
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
      const room = await Net.host({ newCode: Online.newCode, onJoin: () => {}, onLeave: friendLeft, onMessage: fromFriend });
      if (attempt !== joinAttempt) { room.close(); return; }
      online = {
        role: 'host', room, code: room.code, seat: 0, hostName: localName(), holesSent: 0,
        players: [{ id: 'host', name: localName(), color: Online.HUMAN_COLORS[0], host: true, owner: Records.playerId() }],
        shared: [{ color: Online.HUMAN_COLORS[0], entries: Records.shareable(localName()) }],
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
      const taken = new Set(online.players.map(p => p.name));
      const base = Online.cleanName(msg.name) || 'Friend';
      let name = base;
      for (let n = 2; taken.has(name); n++) name = `${base} ${n}`;
      const color = Online.HUMAN_COLORS.find(c => !online.players.some(p => p.color === c));
      const owner = typeof msg.owner === 'string' ? msg.owner.slice(0, 40) : '';
      online.players.push({ id, name, color, owner });
      online.room.send(id, { t: 'welcome', name });
      sendLobby();
      // Everyone's best rounds go into everyone's Hall of Fame.
      if (Array.isArray(msg.scores)) {
        const entries = msg.scores.slice(0, 10);
        online.shared.push({ color, entries });
        Records.importShared(entries, color);
      }
      online.room.broadcast({ t: 'scores', from: online.shared });
      if (state === 'lobby') setStatus(FLAVOR.friendJoined(name));
      else toast(FLAVOR.friendJoined(name), 1800);
      // A round under way: they watch this one and play from the next.
      if (state === 'countdown' || state === 'running') {
        online.room.send(id, Online.round(game, game.humans, game.rivalsLine, game.roundId));
        if (state === 'running') online.room.send(id, { t: 'phase', s: 'go' });
      }
    } else if (msg.t === 'turn') {
      const s = game.snakes.find(o => o.peer === id);
      if (!s?.alive || s.left || (state !== 'countdown' && state !== 'running') || !Online.DIR_NAMES.includes(msg.d)) return;
      if (s.autopilot) handBack(s);
      turn(msg.d, s);
    }
  }

  // A friend whose connection goes quiet gets an AI at the wheel until they're
  // back, so a hiccup never drives them into a wall. Their browser says "still
  // here" four times a second, so a quiet spell shows within a moment; any turn
  // they send hands the wheel straight back. Short blips pass without a banner.
  const AWAY_MS = 750, AWAY_TOAST_MS = 2000;
  function checkAway() {
    for (const s of game.snakes) {
      if (!s.peer || s.peer === 'host' || !s.alive || s.left) continue;
      const quiet = online.room.quietFor(s.peer);
      if (quiet > AWAY_MS && !s.autopilot) {
        s.autopilot = PERSONAS.drab;
        s.queue.length = 0;
      } else if (quiet <= AWAY_MS && s.autopilot) handBack(s);
      if (s.autopilot && quiet > AWAY_TOAST_MS && !s.awayToast) {
        s.awayToast = true;
        toast(FLAVOR.friendAway(s.name), 2200);
      }
    }
  }

  function handBack(s) {
    s.autopilot = null;
    if (s.awayToast) toast(FLAVOR.friendBack(s.name), 1500);
    s.awayToast = false;
  }

  // A friend left: their seat opens up, and an AI finishes their round for them.
  function friendLeft(id) {
    if (!hosting()) return;
    const i = online.players.findIndex(p => p.id === id);
    if (i < 0) return;
    const [p] = online.players.splice(i, 1);
    const s = game.snakes.find(o => o.peer === id);
    if (s) s.left = true;
    if (s?.alive && (state === 'countdown' || state === 'running')) {
      s.autopilot = PERSONAS.drab;
      s.queue.length = 0;
      thinkQueue.push(s);
      toast(FLAVOR.friendLeft(p.name), 2400);
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
    game.rivalsLine = pick(FLAVOR.rivals);
    online.holesSent = game.holes.size;
    online.room.broadcast(Online.round(game, humans, game.rivalsLine, game.roundId));
    state = 'countdown';
    beatsLeft = 3;
    beatTimer = 0;
    updateControls();
    beat();
  }

  // ------------- joining

  async function joinRoom(text) {
    const code = Online.cleanCode(text);
    if (!Online.isCode(code)) return setStatus('Room codes are five letters and numbers.', true);
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
      title: `${online.hostName}’s room`, text: FLAVOR.waiting(online.hostName), secondary: 'Leave room',
      lobby: { players: true }, actions: { secondary: leaveRoom },
    });
  }

  function fromHost(msg) {
    if (!guesting()) return;
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
        online.players = msg.players;
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
      case 'say': if (game.snakes[msg.id]) Chatter.replay(game.snakes[msg.id], msg.text); break;
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
    showCard({ title: '…', text: game.rivalsLine, opponents: true, quiet: true });
  }

  function hostLost(reason) {
    if (!guesting()) return;
    const name = online.hostName;
    endOnline();
    state = 'lobby';
    updateControls();
    showCard({
      title: 'Room closed', text: reason === 'closed' ? FLAVOR.roomGone(name) : FLAVOR.roomLost,
      primary: 'Back to the start', actions: { primary: backToStart },
    });
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
      try { await navigator.share({ title: 'Bark & Bite', text: 'Come and play snake up a tree with me:', url: link }); return; } catch { /* cancelled: copy instead */ }
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
  lobbyJoin.addEventListener('submit', e => {
    e.preventDefault();
    Audio.unlock();
    joinRoom(lobbyCode.value);
  });
  lobbyName.addEventListener('change', saveLobbyName);
  // The host passes the chatter on, so every screen has the same lines.
  Chatter.onSpeak((s, text) => {
    if (hosting() && (state === 'countdown' || state === 'running')) online.room.broadcast({ t: 'say', id: s.id, text });
  });
  // Closing the tab says goodbye, so friends aren't left waiting.
  window.addEventListener('pagehide', () => {
    if (hosting()) online.room.broadcast({ t: 'closed' });
    if (online) online.room.close();
  });

  // ------------------------------------------------- size and motion

  R.init({ canvas, personas: PERSONAS, playerColor: PLAYER_COLOR });
  Chatter.init({ boardEl, logEl: chatlogEl });

  const sizer = new ResizeObserver(entries => {
    const e = entries[0];
    const w = e.contentRect.width;
    if (!w) return;
    boardPx = w;
    R.resize(w, e.devicePixelContentBoxSize?.[0]?.inlineSize);
    Chatter.setCompact(w < 420);
    dirty = true;
  });
  // The device-pixel box also reports browser zoom; older browsers get the CSS box.
  try { sizer.observe(canvas, { box: 'device-pixel-content-box' }); } catch { sizer.observe(canvas); }

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

  // The start card shows this round's rivals.
  function ready(personas) {
    newGame({ personas });
    state = 'ready';
    showCard({ title: 'Bark & Bite', text: FLAVOR.intro, primary: 'Play', secondary: 'Watch AIs', opponents: true, friends: true });
  }

  // The controls under the board (online there's no napping or starting over).
  function updateHelp() {
    if (online) setHint(helpEl, touchFirst ? 'Swipe on the bark to steer' : 'Arrows or WASD steer · H for the Hall of Fame · M sound · N music');
    else setHint(helpEl, touchFirst ? FLAVOR.hintTouch : `${FLAVOR.hintKeys} · M sound · N music`);
  }

  // Hints wrap only between items ("Space naps" never splits across lines).
  function setHint(el, text) {
    el.textContent = '';
    text.split(' · ').forEach((item, i) => {
      if (i) el.append(' · ');
      const span = document.createElement('span');
      span.textContent = item;
      el.append(span);
    });
  }
  setHint(hintEl, touchFirst ? FLAVOR.hintTouch : FLAVOR.hintKeys);
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
      draw: () => R.frame(drawAlpha, performance.now()),
    };
  }
})();
