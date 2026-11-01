// The game controller (see game/core.js): the Hall of Fame, and playing with
// friends online: hosting, joining and leaving.

// ------------------------------------------------------ Hall of Fame

// One book, two doors: the trophy (or H) opens it on the Hall of Fame (or
// Your story, if that's where you were), the Field guide's book (or G) on
// the guide. In the book, a door's key goes to its tab, or closes it from there.
let recordsTab = 'scores', storyTab = 'scores', scoresFilter = 'all', recordsOpener = null;
const TAB_NAMES = { scores: 'Hall of Fame', stats: 'Your story', guide: 'Field guide' };

// (row: a guide row's kind, to open the guide at it, lit for a moment: your death card's "what got you")
function openRecords(tab = 'scores', row = null) {
  if (online && playerAlive() && (state === 'countdown' || state === 'running')) {
    toast(`The ${tab === 'guide' ? 'Field guide' : 'Hall of Fame'} can wait. Eyes on the bark.`, 1800, '', 'round'); // the round wouldn't (and over the countdown's card)
    return;
  }
  recordsTab = tab === 'guide' ? 'guide' : storyTab;
  // Napping, if you're playing alone (online, or only watching, the round goes on behind the dialog, and its card stays).
  if (!online && (state === 'countdown' || (state === 'running' && playerAlive() && !pendingCard))) napNow();
  recordsOpener = document.activeElement;
  recordsEl.hidden = false;
  keepAwake();
  mainEl.inert = true;
  renderRecordsSafely();
  const page = recordsEl.querySelector('.records-card'), spot = row && recordsTab === 'guide' && recordsBody.querySelector(`li[data-kind="${row}"]`);
  page.scrollTop = 0; // (a door opens its page at the top)
  if (spot) {
    page.scrollTop = Math.max(0, spot.getBoundingClientRect().top - page.getBoundingClientRect().top - page.clientHeight / 3);
    spot.classList.add('spot');
  }
  $('records-close').focus({ preventScroll: true }); // (a plain focus scrolls the page back up to its Close: the lit row would be out of sight)
}

function closeRecords() {
  recordsEl.hidden = true;
  keepAwake();
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
  if (recordsTab !== 'guide') storyTab = recordsTab;
  recordsEl.setAttribute('aria-label', TAB_NAMES[recordsTab]); // (the dialog is named for what it shows)
  recordsTabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.tab === recordsTab)));
  filterTabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.filter === scoresFilter)));
  filterEl.hidden = recordsTab !== 'scores';
  resetBtn.hidden = recordsTab === 'guide' || Records.isEmpty(); // (nothing there, or nothing yet, to clear)
  recordsBody.textContent = '';
  if (recordsTab === 'scores') {
    Records.renderScores(recordsBody, theGame.entryId, scoresFilter, PLAYER_COLOR, dotByName);
  } else if (recordsTab === 'guide') {
    renderGuide();
  } else {
    // Every persona's color, not just this round's, plus old names (Viper, Warden).
    const colors = { self: PLAYER_COLOR, Viper: '#c084fc', Warden: '#3b82f6', hunger: '#dc2626', wall: '#7a4a24', fire: '#f97316', woodpecker: '#27272a' }; // (hunger in Berry, the edge in Heartwood, fire in flame, the woodpecker in its black)
    for (const p of Object.values(CAST)) colors[p.name] = p.ink || p.color;
    Records.renderStats(recordsBody, colors, dotByName);
  }
}

// The Field guide: every food, power and danger, with its picture (drawn by
// the renderer, as it is on the log) and its rule in a line or two.
const secs = ms => Math.round(ms / 1000);
const GUIDE_ROWS = [
  // (How to play opens here: the round in four lines, before the things on the log.)
  ['The basics', [
    ['basic-win', 'Winning', 'Last snake wriggling wins. Score counts what you eat.'],
    ['basic-steer', 'Steering', `${touchFirst ? 'Swipe the way to go' : 'The arrow keys (or WASD)'}. You never stop, so look ahead.`],
    ['basic-crash', 'Crashes', `An edge, a snake or your own tail costs you tail. At ${TUNE.MIN_LENGTH}, or boxed in, a crash ends you.`],
    ['basic-hunger', 'Hunger', `A hungry snake grows thin, then growls; one gone pale is shrinking. At ${TUNE.MIN_LENGTH} it starves. Your bar is under your name.`],
  ]],
  ['Food', [
    ['apple', 'Apple', `Worth 1, and a full tummy. ${inWords(TUNE.APPLES).replace(/^./, c => c.toUpperCase())} on the log at a time; leave one too long and it rots.`],
    ['golden', 'Golden apple', `Worth ${TUNE.GOLDEN_GROWTH}, and everyone saw it land.`],
    ['beetle', 'Beetles', `Worth ${TUNE.BEETLE_GROWTH}, up to ${inWords(TUNE.BEETLE_MAX ?? 2)} out at once, even in sudden death. They scurry from heads at half your speed. A cornered one digs in, so be quick. They flee the woodpecker’s mark too: one still on it when it strikes, it eats.`],
    ['dig', 'Burrows', `${TUNE.BURROW_FROM_DIG ? 'A beetle that digs in leaves a burrow, taking the place of any burrow near it (burrows keep apart). ' : ''}A burrow left unused grows shut (past ${inWords(TUNE.BURROW_MAX)}, the one unused longest): beetles still go in, but none come out.`],
    [['pellet', 'squash'], 'Beads', `What a crash knocks off, and what a dead snake leaves (${TUNE.CORPSE_EVERY === 2 ? 'every other segment' : TUNE.CORPSE_EVERY === 1 ? 'all of it' : `one segment in ${TUNE.CORPSE_EVERY}`}). Worth 1 each, and they rot. Your own you squash flat as you pass: food for nobody, so chase them down to keep them from the others.`],
    [['baked', 'roast'], 'Baked and roast', `Food left in a fire bakes: worth ${TUNE.COOKED_GROWTH}, if you can take the heat. Then it’s ash.`],
    ['mushroom', 'Mushroom', `Poison: ${TUNE.SHRINK} off your tail (never below ${TUNE.MIN_LENGTH}). A second later it comes back up, ${inWords(TUNE.SPIT_REACH)} ahead of you: steer to aim it at a head. Each time it comes back up it takes one more, up to ${TUNE.SHRINK_MAX}, a shade darker. Keep out of a green ring.`],
  ]],
  ['Golden things', [
    ['goldbeetle', 'Golden beetle', `${TUNE.LEAP_CHARGES} golden jumps: free, no rest. Hold the jump to fly up to ${TUNE.GOLD_FLY} cells and steer in the air; let go to come down. Hold up to ${TUNE.LEAP_MAX}.`],
    ['leaf', 'Golden leaf', `${TUNE.DASH_CHARGES} golden flashes: three cells at once, cutting through a body up to ${TUNE.DASH_THICK} thick and putting out every fire. Never at an edge or a hole: you blow up.`],
    ['goldcap', 'Golden mushroom', `Up in the rain. The edges wrap round for you, ${secs(TUNE.WRAP_MS)} s a mushroom (up to ${secs(TUNE.WRAP_MAX_MS)}).`],
  ]],
  ['Your powers', [
    ['jump', 'Jump', `${touchFirst ? 'A tap' : 'Space or a click on the log'}: hop snakes, holes or fire, up to ${TUNE.LEAP_REACH} cells, to the first free cell: across a gap too. ${touchFirst ? 'Tap twice' : 'Press twice'} to leap now, open ground too. A ring shows where you’ll land. It costs your tail’s tip, then rests ${secs(TUNE.LEAP_COOLDOWN_MS)} s. Bump into a flier in the air and you drop: onto a body or into a hole, you’re out.`],
    ['flash', 'Flash', `${touchFirst ? 'A swipe the way you’re going' : 'E, Shift or a right-click on the log'}: two cells in a blink, free. Then it rests ${secs(TUNE.FLASH_COOLDOWN_MS)} s.`],
    ['cut', 'Cuts', 'A flash cuts through a body one thick with free log beyond: the part behind falls to beads. Leave fewer than 3 in front and that snake is out. Your own body too: drop your tail to fit a pocket. Along the edge, or against a hole or another body, nothing can be cut from that side.'],
    ['failflash', 'Failed flash', `Flash into a head, a body too thick, the edge or a hole and it fails: ${TUNE.FAIL_LOSS} off your tail and a longer stun.`],
    ['held', 'Golden powers', 'Gold round a snake: it holds golden powers. Sky dots are golden jumps, ember diamonds golden flashes.'],
    ['rests', 'Resting', 'Two half-rings round your head: your jump (left) and your flash (right) coming back.'],
  ]],
  ['The log', [
    ['fire', 'Fire', 'Lightning lights it. Crawl in and it takes 3 bites of tail; rain puts it out.'],
    ['knock', 'Woodpecker', 'From 2:00 it pecks out patches, and won’t shut you in if it can help it. A piece it cuts loose from the log is shaded in its mark, and falls with the strike: the log stays one piece. Food in its mark is knocked to the nearest free cell, where the ring is; a beetle there, it eats.'],
    ['hole', 'Holes', 'The woodpecker’s, from 2:00. Bump one like the edge; a peck right under your head is the end.'],
    ['bridge', 'Bridges', 'A snake lying across a pit is a bridge: crawl onto its back there, or land on it from a jump. Get off onto bark before its tail passes, or you fall in.'],
    ['land', 'Borders', 'Sovereign’s realm and Colonist’s colonies. Cross one and it notices.'],
    ['lostflag', 'Lost flags', 'A flag the woodpecker pecks out is lost: the colony goes, and a capital moves.'],
  ]],
  ['Rivals who change', [
    ['capricious', 'Capricious', 'Does impressions of the others, every one before any again: their mark on its pink head, their line, their play.'],
    ['copycat', 'Copycat', 'Shadows whoever leads, in a pale copy of their colours, and plays as it has watched them play.'],
  ]],
];
// (Until the renderer can draw a picture, a stand-in: it draws a kind it
// doesn't know as an apple. Every kind has one, in case its picture fails.)
const GUIDE_STAND_IN = { capricious: '🎭', copycat: '🐱', 'basic-win': '👑', 'basic-steer': '🐍', 'basic-crash': '💥', 'basic-hunger': '🍽️', apple: '🍎', golden: '🌟', beetle: '🪲', goldbeetle: '🪲', dig: '🪲', pellet: '🟢', squash: '💦', baked: '🍎', roast: '🍖', mushroom: '🍄', goldcap: '🍄', leaf: '🍂', jump: '⤴️', flash: '⚡', cut: '✂️', failflash: '💫', wrap: '🔁', held: '✨', rests: '⏳', fire: '🔥', knock: '🍎', hole: '🕳️', bridge: '🌉', land: '🚩', lostflag: '🚩' };
const GUIDE_UNDRAWN = new Set();
function renderGuide() {
  const px = Math.round(36 * (window.devicePixelRatio || 1));
  for (const [title, rows] of GUIDE_ROWS) {
    const head = document.createElement('h3');
    head.className = 'guide-head';
    head.textContent = title;
    const list = document.createElement('ul');
    list.className = 'guide';
    for (const [kinds, name, rule] of rows) {
      const li = document.createElement('li');
      li.dataset.kind = [].concat(kinds)[0]; // (your death's card opens the guide at its row)
      const pics = document.createElement('span');
      pics.className = 'guide-pics';
      pics.setAttribute('aria-hidden', 'true');
      for (const kind of [].concat(kinds)) pics.append(guidePic(kind, px));
      const text = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = name;
      const pause = document.createElement('span'); // (a screen reader hears the name, then the rule: not "Golden beetle 2 golden jumps")
      pause.className = 'sr-only';
      pause.textContent = '.';
      text.append(strong, pause, ' ', rule);
      li.append(pics, text);
      list.append(li);
    }
    recordsBody.append(head, list);
  }
}
// One thing's picture, a copy of the renderer's own (36 px, sharp at any density).
function guidePic(kind, px) {
  let art = null;
  try { if (!GUIDE_UNDRAWN.has(kind)) art = Render.guideSprite?.(kind, px); } catch { /* the stand-in, below */ }
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
click($('records-open'), () => openRecords('scores'));
click($('guide-open'), () => openRecords('guide'));
click(howBtn, () => openRecords('guide', howRow));
// A door's key in the book: its tab, or out again from there.
function recordsKey(tab) {
  if ((tab === 'guide') === (recordsTab === 'guide')) return closeRecords();
  recordsTab = tab === 'guide' ? 'guide' : storyTab;
  renderRecordsSafely();
}
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

// Four seats: the people in the room, then the rivals who'll take the rest
// (the host's line-up; the host chooses them here, as on the start card).
function renderPlayers() {
  lobbyPlayers.textContent = '';
  const people = online?.players || [], rivals = lobbyRivals();
  for (let i = 0; i < Online.MAX_PEOPLE; i++) {
    const p = people[i], r = !p && rivals[i - people.length];
    const li = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = 'dot';
    const label = document.createElement('span');
    if (p) {
      dot.style.background = p.color;
      if (Render.markOf(p.color)) dot.dataset.mark = Render.markOf(p.color);
      label.textContent = p.name;
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = [p.host && 'host', p.id === myId() && 'you'].filter(Boolean).join(', ');
      li.append(dot, label, tag);
    } else if (r) {
      dot.style.background = keyDot(r.key);
      const name = document.createElement('strong');
      name.textContent = CAST[r.key].name;
      label.className = 'open-seat';
      label.textContent = 'unless a friend joins';
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = r.chosen ? 'chosen' : '';
      if (hosting()) li.append(seatButton(i - people.length, dot, name, r.chosen), label); // (chosen: its ring says so)
      else li.append(dot, name, label, tag);
    } else {
      dot.style.background = 'var(--parchment-2)';
      label.className = 'open-seat';
      label.textContent = 'A rival, unless a friend joins';
      li.append(dot, label);
    }
    lobbyPlayers.append(li);
  }
  if (!pickerEl.hidden && online && !seatEl(pickerSeat)) closePicker(); // (a friend took the seat being chosen)
}

// The host's line-up for the next round, seat by seat (TUNE.OPPONENTS): the
// start card's when the room opens, dealt afresh after each round, chosen in
// the lobby's seats (pickRival). fresh: the ones the deck dealt, which go back
// on it if they're never met. With more people, fewer seats: the first ones.
function hostLineUp() {
  if (!online.lineup) {
    const d = dealLineUp(TUNE.OPPONENTS);
    online.lineup = { keys: d.keys, fresh: d.fresh };
  }
  return online.lineup;
}
// The rivals the lobby shows: the host's line-up, or what the host last sent.
function lobbyRivals() {
  if (!online) return [];
  if (!hosting()) return online.rivals || [];
  const seats = Records.seats(SnakeAI.POOL), want = Math.max(0, TUNE.OPPONENTS + 1 - online.players.length);
  return hostLineUp().keys.slice(0, want).map((key, i) => ({ key, chosen: seats[i] === key }));
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
  if (await window.SnakeUpdate?.beforeRoom(null, () => attempt === joinAttempt)) return; // (a newer version out: into it first, and the room opens there)
  try {
    const room = await Net.host({ newCode: Online.newCode, onLeave: friendLeft, onMessage: fromFriend });
    if (attempt !== joinAttempt) { room.close(); return; }
    online = {
      role: 'host', room, code: room.code, seat: 0, hostName: localName(), holesSent: 0,
      players: [{ id: 'host', name: localName(), color: Online.HUMAN_COLORS[0], host: true, owner: Records.playerId() }],
      shared: new Map([[Records.playerId(), { color: Online.HUMAN_COLORS[0], entries: Records.shareable(localName()) }]]), // owner -> their best rounds
      // (the start card's rivals: the line-up takes them over, and with them what the deck dealt)
      lineup: theGame.spent ? null : { keys: theGame.snakes.filter(s => s.persona).map(s => s.personaKey), fresh: theGame.dealt || [] },
    };
    theGame.dealt = [];
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
  online.room.broadcast({ t: 'lobby', players: online.players.map(({ id, name, color, host }) => ({ id, name, color, host: !!host })), lineup: lobbyRivals() });
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
    else toast(FLAVOR.friendJoined(name), 1800, '', 'round', { phone: FLAVOR.friendJoinedPhone(name) });
    // A round under way: they watch this one and play from the next.
    if (state === 'countdown' || state === 'running') {
      online.room.send(id, Online.round(theGame, theGame.humans, theGame.rivalsLine, theGame.roundId));
      if (state === 'running') online.room.send(id, { t: 'phase', s: 'go' });
    }
  } else if (msg.t === 'away' || msg.t === 'back') {
    const p = online.players.find(o => o.id === id);
    if (p) p.away = msg.t === 'away';
  } else if (msg.t === 'turn' || msg.t === 'swipe' || msg.t === 'pow') {
    // A friend's press: a turn, a fresh swipe (the way they're going, a
    // flash), or a power (only once the round's going), by the same rules as yours.
    const s = theGame.snakes.find(o => o.peer === id);
    if (!s?.alive || s.left || (state !== 'countdown' && state !== 'running')) return;
    if (msg.t === 'pow' ? !Online.POWERS.includes(msg.k) || state !== 'running' : !Online.DIR_NAMES.includes(msg.d)) return;
    if (s.autopilot && !(msg.t === 'pow' && msg.k === 'letgo')) handBack(s); // (a jump let go isn't taking the wheel: a blur or a hidden tab sends one)
    if (msg.t === 'pow') powerOf(s, msg.k);
    else if (msg.t === 'swipe' && state === 'running') swipeTo(msg.d, s);
    else turn(msg.d, s);
    if (planSent && state === 'running') sendPlan(); // (the others see it coming)
  }
}

// A friend whose connection goes quiet gets an AI at the wheel until they're
// back, so a hiccup never drives them into a wall. Their browser says "still
// here" four times a second, so a quiet spell shows within a moment; any turn
// they send hands the wheel straight back. Short blips pass without a banner.
// A friend who switched tabs said so: the AI stays at the wheel until they turn.
function checkAway() {
  for (const s of theGame.snakes) {
    if (!s.peer || s.peer === 'host' || !s.alive || s.left) continue;
    const away = online.players.find(p => p.id === s.peer)?.away;
    const quiet = away ? Infinity : online.room.quietFor(s.peer);
    if (quiet > TUNE.AWAY_MS && !s.autopilot) {
      s.autopilot = CAST.drab;
      s.queue.length = 0;
      s.awayPilot = !!away;
    } else if (quiet <= TUNE.AWAY_MS && s.autopilot && !s.awayPilot) handBack(s);
    if (s.autopilot && quiet > TUNE.AWAY_TOAST_MS && !s.awayToast) {
      s.awayToast = true;
      toast(FLAVOR.friendAway(s.name), 2200, '', 'round', { phone: FLAVOR.friendAwayPhone(s.name) });
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
  const s = theGame.snakes.find(o => o.peer === id);
  if (s) s.left = true;
  if (s?.alive && (state === 'countdown' || state === 'running')) {
    s.autopilot = CAST.drab;
    s.queue.length = 0;
    thinkQueue.push(s);
    toast(FLAVOR.friendLeft(p.name), 2400, '', 'round', { phone: FLAVOR.friendLeftPhone(p.name) });
  } else if (state === 'lobby') setStatus(`${p.name} left.`);
  sendLobby();
}

function startOnlineRound() {
  if (!hosting()) return;
  const humans = online.players.map(p => ({ name: p.name, color: p.color, peer: p.id, owner: p.owner }));
  const want = Math.max(0, TUNE.OPPONENTS + 1 - humans.length), up = hostLineUp(), personas = up.keys.slice(0, want);
  Records.undeal(SnakeAI.POOL, up.fresh.filter(k => !personas.includes(k))); // (a seat a friend took: its rival is next)
  online.lineup = null; // (the next round's is dealt when it's next shown)
  newGame({ humans, personas, chosen: Records.seats(SnakeAI.POOL).slice(0, want).some(Boolean) });
  theGame.humans = humans;
  theGame.roundId = Online.newCode() + Date.now().toString(36);
  theGame.snakes.forEach((s, i) => { if (humans[i]) { s.peer = humans[i].peer; s.owner = humans[i].owner; } });
  theGame.rivalsLine = theGame.snakes.some(s => s.persona) ? pick(FLAVOR.rivals) : FLAVOR.rivals0;
  online.holesSent = theGame.holes.size;
  online.room.broadcast(Online.round(theGame, humans, theGame.rivalsLine, theGame.roundId));
  state = 'countdown';
  theGame.spent = true;
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
  if (await window.SnakeUpdate?.beforeRoom(code, () => attempt === joinAttempt)) return; // (a newer version out: into it first, and in)
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
      const code = online.code;
      endOnline();
      state = 'lobby';
      showCard({
        title: 'Play with friends', primary: 'Back', actions: { primary: backToStart },
        text: msg.why === 'full' ? 'That room is full: four people already.' : 'That room runs a different version of the game. Reload both pages and try again.',
      });
      if (msg.why === 'version') window.SnakeUpdate?.beforeRoom(code); // (behind the host after all? into the new version, and in)
      break;
    case 'lobby':
      if (!Array.isArray(msg.players)) break;
      online.players = msg.players.slice(0, Online.MAX_PEOPLE).filter(p => p && typeof p.name === 'string');
      online.hostName = msg.players.find(p => p.host)?.name || 'the host';
      online.rivals = (Array.isArray(msg.lineup) ? msg.lineup : []).filter(r => SnakeAI.POOL.includes(r?.key)).map(r => ({ key: r.key, chosen: r.chosen === true }));
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
    case 'plan': if (state === 'running' && theGame) Online.applyPlan(theGame, msg, DIRS, online.seat); break; // (drawing ahead: where everyone goes next)
    case 'say': // (the host's last line can arrive after the round ended here: only the last words of a snake out, while the round's card waits for them)
      if ((state === 'countdown' || state === 'running' || (state === 'over' && pendingCard && theGame.snakes[msg.id] && !theGame.snakes[msg.id].alive)) && theGame.snakes[msg.id] && typeof msg.text === 'string') Chatter.replay(theGame.snakes[msg.id], msg.text.slice(0, 200), msg.reply === true);
      break;
    case 'closed': hostLost('closed'); break;
  }
}

// The host's new round, laid out on a friend's screen.
function guestRound(msg) {
  online.seat = msg.humans.findIndex(h => h.peer === online.room.id);
  newGame({ humans: msg.humans, personas: msg.personas, chosen: msg.chosen === true });
  theGame.roundId = typeof msg.id === 'string' ? msg.id : '';
  theGame.snakes.forEach((s, i) => { if (msg.humans[i]) s.owner = msg.humans[i].owner; });
  Online.apply(theGame, msg.first, DIRS);
  for (const s of theGame.snakes) rememberPrev(s);
  updateHud(true);
  theGame.rivalsLine = online.seat < 0 ? pick(FLAVOR.spectators) : msg.rivals;
  state = 'countdown';
  updateControls();
  showCard({ title: '…', text: theGame.rivalsLine, opponents: true, quiet: true, beat: true });
  markYou(playerAlive());
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
  if (hosting() && online.lineup) Records.undeal(SnakeAI.POOL, online.lineup.fresh); // (never met: the start card deals them again)
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
    try { await navigator.share({ title: 'Barkstreet Snakes', text: 'Come and play snake on a mossy log with me:', url: link }); return; } catch { /* cancelled: copy instead */ }
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
  Sound.unlock();
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
