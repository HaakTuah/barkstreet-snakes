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
  const THINK_BUDGET = 3; // ms of AI thinking allowed per frame (at least one AI always thinks)

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
  };

  // "you" for the human, the name for everyone else.
  const who = (s, object = false) => s.isPlayer ? (object ? 'you' : 'You') : s.name;
  // Your death, in the second person.
  const yourCause = p => p.killer === 'self' ? 'bit yourself' : p.cause;

  // ---------------------------------------------------------- game state

  // state: 'ready' (start card) | 'countdown' | 'running' | 'paused' | 'over'
  let game, state = 'ready', speed = 1;
  let acc = 0, tickLen = T.OPENING_TICK, lastFrame = 0, drawAlpha = 1, dirty = true;
  let beatsLeft = 0, beatTimer = 0;
  let freezeUntil = 0, pendingCard = null, cardAt = 0; // times on the frame clock (rAF timestamps)
  let thinkQueue = [];
  let best = Records.getBest();
  let boardPx = 0; // the board's CSS width, kept by a ResizeObserver (no layout reads in the loop)

  const player = () => game.snakes[0]?.isPlayer ? game.snakes[0] : null;
  const playerAlive = () => !!player()?.alive;
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
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = lastFrame ? Math.max(0, Math.min(250, now - lastFrame)) : 16;
    lastFrame = now;
    const t0 = performance.now();
    let tickCost = 0;

    if (state === 'countdown') {
      beatTimer -= dt;
      if (beatTimer <= 0) beat();
      dirty = true;
    }

    if (state === 'running') {
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
        think(t0);
        drawAlpha = state === 'running' && now >= freezeUntil ? Math.min(1, acc / tickLen) : 1;
      }
      dirty = true;
    } else if (state === 'over') {
      if (pendingCard && now >= cardAt) { const c = pendingCard; pendingCard = null; showCard(c); }
      drawAlpha = 1;
      if (R.particles > 0 || pendingCard) dirty = true;
    }

    Audio.music(musicStage(), mood);

    if (dirty) {
      R.frame(drawAlpha, now);
      Chatter.layout(drawAlpha, boardPx);
      dirty = state === 'running' || state === 'countdown' || R.particles > 0;
    }
    perf.record(performance.now() - t0, tickCost);
  }

  // Let the AIs think about the next tick in the frames before it (same
  // information, same decisions), so no single frame carries all of them.
  function think(frameStart) {
    let thought = 0;
    while (thinkQueue.length && (thought === 0 || performance.now() - frameStart < THINK_BUDGET)) {
      const s = thinkQueue.shift();
      if (E.canThinkAhead(game, s)) { E.thinkAhead(game, s); thought++; }
    }
  }

  function tick() {
    const wasAlive = playerAlive();
    for (const s of game.snakes) rememberPrev(s);
    const dying = E.step(game);
    tickLen = E.tickMs(game) / (spectating() ? speed : 1);
    R.onTick(game.events);
    sounds(dying, wasAlive);
    updateHud();
    Chatter.update();
    announce(dying);

    // Everyone still alive finished ahead of the snakes that just died; if
    // nobody is, they share first place (a draw).
    const alive = game.snakes.filter(s => s.alive);
    for (const s of dying) finishSnake(s, { place: alive.length + 1, draw: alive.length === 0 });
    thinkQueue = alive.filter(s => !s.isPlayer);
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

  function newGame({ personas, aiOnly = false } = {}) {
    game = E.createGame({ personas, withPlayer: !aiOnly });
    acc = 0;
    tickLen = E.tickMs(game);
    drawAlpha = 1;
    thinkQueue = game.snakes.filter(s => s.persona);
    freezeUntil = 0;
    pendingCard = null;
    R.setGame(game);
    Chatter.reset(game);
    Chatter.setPlayerName(Records.hasName() ? Records.getName() : 'Green');
    hideToast();
    buildTags();
    buildOpponents();
    updateHud(true);
    dirty = true;
  }

  // Start a round in the given mode. The round on the start card is used as-is;
  // anything else gets a fresh one.
  function start({ aiOnly = !game.withPlayer } = {}) {
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
    Audio.play('beat');
    showCard({ title: String(beatsLeft), text: game.rivalsLine, primary: 'Go!', opponents: true, quiet: true });
    beatsLeft--;
    beatTimer = T.COUNTDOWN_BEAT;
  }

  function go() {
    state = 'running';
    hideCard();
    Audio.play('go');
    toast(pick(FLAVOR.go), 1100);
    acc = 0;
    lastFrame = 0;
    updateControls();
    say(game.withPlayer ? 'Go.' : 'The AIs are off.');
  }

  function pause() {
    if (state !== 'running') return;
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
    };
    updateControls();
  }

  function endRound() {
    state = 'over';
    Chatter.clearBubbles();
    flushAiResults();
    const survivors = game.snakes.filter(s => s.alive);
    const winner = survivors[0];
    const title = !winner ? 'Draw' : winner.isPlayer ? 'You win!' : `${winner.name} wins`;
    const flavor = !winner ? pick(FLAVOR.draw) : winner.isPlayer ? pick(FLAVOR.win) : winner.persona.win;
    if (winner?.isPlayer) Audio.play('win');
    pendingCard = game.withPlayer
      ? {
        title, flavor, reward: true, primary: 'Play again', secondary: 'Watch AIs',
        text: `You finished ${game.result.won ? '1st' : Records.ordinal(game.result.place)} · ${Records.clock(game.result.survived)} · score ${player().eaten}`,
      }
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
    if (!s.isPlayer) return;
    const before = best;
    game.result = s.result;
    game.entryId = Records.recordPlayer({ ...s.result, killer: s.alive ? null : s.killer });
    if (s.eaten > best) { best = s.eaten; Records.setBest(best); bestEl.textContent = best; }
    game.newBest = s.eaten > before && s.eaten > 0;
  }

  function flushAiResults() {
    for (const s of game.snakes) {
      if (s.isPlayer || !s.result || s.result.saved) continue;
      Records.addScore({ ...s.result, name: s.name, color: s.color, ai: true, watched: !game.withPlayer });
      s.result.saved = true;
    }
  }

  // Flavor for the death card: the killer's own line, if an AI got you.
  function killLine(p) {
    const killer = game.snakes.find(s => s.persona && s.name === p.killer);
    if (killer) return killer.persona.kill;
    if (p.cause === 'fell into a woodpecker hole') return pick(FLAVOR.hole);
    if (p.killer === 'self') return pick(FLAVOR.self);
    if (p.killer === 'hunger') return pick(FLAVOR.starved);
    return pick(FLAVOR.wall);
  }

  // ------------------------------------------------------- sounds, banners

  function sounds(dying, wasAlive) {
    for (const e of game.events) {
      if (e.type === 'eat' && e.snake.isPlayer) {
        Audio.play(e.kind === 'golden' ? 'golden' : e.kind === 'pellet' ? 'meat' : e.kind === 'mushroom' ? 'mushroom' : 'eat');
        bump(scoreEl);
      } else if (e.type === 'woodpecker') Audio.play('woodpecker');
      else if (e.type === 'peck') Audio.play('peck');
      else if (e.type === 'starving' && e.snake.isPlayer) Audio.play('hungry');
    }
    for (const s of dying) if (!s.isPlayer) Audio.play('rivalDeath');
    if (wasAlive && !playerAlive()) Audio.play('death');
  }

  // Banners for the big moments of a round (one per tick, most important first).
  function announce(dying) {
    const alive = game.snakes.filter(s => s.alive);
    if (dying.length && !game.firstBlood) {
      game.firstBlood = true;
      const v = dying[0];
      const killer = game.snakes.find(o => o.name === v.killer && o !== v);
      return toast(killer ? `First blood! ${who(killer)} got ${who(v, true)}.` : `First blood: ${who(v)} ${v.isPlayer ? yourCause(v) : v.cause}.`);
    }
    for (const e of game.events) if (e.type === 'woodpecker') return toast(pick(FLAVOR.woodpecker));
    if (dying.length && alive.length === 2) {
      const [a, b] = alive[0].isPlayer ? [alive[1], alive[0]] : alive;
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
      if (e.type === 'eat' && e.snake.isPlayer && e.kind === 'golden') return toast(pick(FLAVOR.youGolden), 1500);
      if (e.type === 'eat' && e.snake.isPlayer && e.kind === 'mushroom') return toast(pick(FLAVOR.youMushroom), 1800);
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

  // card = { title, text, flavor, primary, secondary, opponents, reward, quiet }
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
    startBtn.textContent = card.primary;
    watchBtn.hidden = !card.secondary;
    if (card.secondary) watchBtn.textContent = card.secondary;

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
      (invite ? nameInput : startBtn).focus({ preventScroll: true });
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
      li.querySelector('.name').textContent = s.isPlayer ? 'You' : s.name;
      li.title = s.persona ? `${s.name}: ${s.persona.blurb}` : 'You, the green snake';
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
    const canPause = state === 'running' || state === 'paused';
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
  function turn(name) {
    const p = player();
    const next = DIRS[name];
    const last = p.queue.length ? p.queue[p.queue.length - 1] : p.dir;
    if (next === last || (next.x === -last.x && next.y === -last.y)) return;
    if (p.queue.length < T.QUEUE) p.queue.push(next);
  }

  // A direction: steers, and during the countdown also skips it.
  function steer(name) {
    if (!playerAlive()) return;
    if (state === 'countdown') { turn(name); go(); }
    else if (state === 'running') turn(name);
  }

  function napKey() {
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
    if (state === 'paused') resume();
    else if (state === 'countdown') go();
    else start({ aiOnly: false });
  });
  click(watchBtn, () => {
    if (state === 'running') hideCard();             // keep watching after you died
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

  // Renaming your Hall of Fame entry from the card. Saved when you're done.
  nameInput.addEventListener('change', () => {
    if (game.entryId) Records.rename(game.entryId, nameInput.value);
    Chatter.setPlayerName(Records.hasName() ? Records.getName() : 'Green');
  });

  // Nap automatically when the tab is hidden, or when the window loses focus
  // while you're playing (a watched round can keep going on screen).
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (state === 'countdown') { state = 'running'; pause(); }
    else if (state === 'running') pause();
  });
  window.addEventListener('blur', () => {
    if (state === 'running' && playerAlive() && !pendingCard) pause();
  });

  // ------------------------------------------------------ Hall of Fame

  let recordsTab = 'scores', scoresFilter = 'all', recordsOpener = null;

  function openRecords() {
    if (state === 'countdown') { state = 'running'; pause(); }
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
    const back = !overlay.classList.contains('hidden') ? startBtn : recordsOpener;
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
    showCard({ title: 'Bark & Bite', text: FLAVOR.intro, primary: 'Play', secondary: 'Watch AIs', opponents: true });
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
  setHint(helpEl, touchFirst ? FLAVOR.hintTouch : `${FLAVOR.hintKeys} · M sound · N music`);
  showChatterState();
  ready();
  updateControls();
  requestAnimationFrame(frame);

  // Test hooks, only with ?debug. The test pane runs hidden, where browsers
  // pause requestAnimationFrame, so frames(n) drives the loop by hand.
  if (params.has('debug')) {
    let fake = performance.now();
    window.SnakeDebug = {
      game: () => game,
      state: () => state,
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
