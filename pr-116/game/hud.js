// The game controller (see game/core.js): the HUD, the scoreboard and its tags.

// ------------------------------------------------------------- the HUD

// Each snake's tag (dot, name, length, hunger bar). Values are written only
// when they change.
function buildTags() {
  tagsEl.textContent = '';
  for (const s of theGame.snakes) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="dot"></span>${s.persona ? '<button class="name" type="button"></button>' : '<span class="name"></span>'}<span class="sr-only"></span><span class="pow" aria-hidden="true" hidden></span><span class="len"></span><span class="hunger"><i></i></span>`;
    li.querySelector('.name').textContent = isMe(s) ? 'You' : s.name;
    li.title = s.persona ? `${s.name}: ${s.persona.blurb}` : isMe(s) ? 'You' : `${s.name}, a friend`;
    if (s.persona) li.dataset.blurb = `${s.name}: ${s.persona.blurb}`; // tapped (phones have no tooltips), or its name pressed with a key, it says how it plays
    const nameBtn = li.querySelector('button.name');
    if (nameBtn) { nameBtn.setAttribute('aria-expanded', 'false'); nameBtn.setAttribute('aria-controls', 'rival-note'); } // (its note, on the card)
    if (s.personaKey === 'capricious') li.querySelector('.dot').dataset.ring = ''; // its pink ring, as on the board
    const mark = Render.markOf(s.color);
    if (s.isPlayer && mark) li.querySelector('.dot').dataset.mark = mark;
    tagsEl.append(li);
    s.tag = { li, dot: li.querySelector('.dot'), state: li.querySelector('.sr-only'), len: li.querySelector('.len'), bar: li.querySelector('.hunger i'), pow: li.querySelector('.pow'), last: {} };
  }
}

// A snake's note, asked for from its tag (a click, a tap, or Enter on its
// name): how a rival plays and what it holds now, or your own powers. On a
// card (napping, your death's, the round's end, the start) it stands in
// for the card's words, under the rival's dot and name, until you're done
// with it: its tag again, its ×, Esc, a click or tap anywhere but a
// button, or the card going; another tag swaps it. Watching a round (no card up),
// it's a banner, up as long as it takes to read. While you're playing, or
// in a countdown, a tag says nothing (your eyes belong on the log; on a
// desktop, its tooltip still does).
const noteEl = $('rival-note'), noteDot = noteEl.querySelector('.dot'), noteWho = noteEl.querySelector('strong');
const noteHow = noteEl.querySelector('.how'), noteNow = noteEl.querySelector('.now'), cardEl = overlay.querySelector('.card');
let noted = null, bannered = null; // (whose note is on the card; whose is the banner)
tagsEl.addEventListener('click', e => {
  const li = e.target.closest?.('li'), s = li && theGame.snakes.find(o => o.tag?.li === li);
  if (!s || !(s.persona || isMe(s)) || state === 'countdown' || state === 'lobby') return;
  if (overlay.classList.contains('hidden')) {
    if (state !== 'running' || playerAlive()) return; // (playing: nothing)
    if (bannered === s && !toastEl.hidden && toastEl.dataset.kind === 'note') { bannered = null; return hideToast(true); } // (its tag again)
    const line = noteLine(s);
    bannered = s;
    toastEl.style.setProperty('--edge', isMe(s) ? Render.colorOf(s) : s.persona.ink || s.color);
    return toast(line, Math.min(TUNE.NOTE_MAX_MS, Math.max(TUNE.NOTE_MIN_MS, TUNE.NOTE_FIND_MS + line.length * TUNE.NOTE_CHAR_MS)), 'note', 'asked');
  }
  if (noted === s) return closeNote();
  openNote(s);
});
// The note in a line (a banner, and what a screen reader hears).
const youWords = s => s.alive ? yourPowerWords(s) : 'You’re out of this round.'; // (your powers, while you have a round to use them in)
const noteLine = s => isMe(s) ? youWords(s) : `${s.name}: ${s.persona.blurb}${powerWords(s)}`;
function openNote(s) {
  closeNote();
  noted = s;
  noteEl.style.setProperty('--edge', isMe(s) ? Render.colorOf(s) : s.persona.ink || s.color);
  noteDot.style.background = dotColor(s);
  noteWho.textContent = isMe(s) ? 'You' : s.name;
  noteHow.textContent = isMe(s) ? youWords(s) : s.persona.blurb;
  noteNowFor(s);
  noteEl.hidden = false;
  cardEl.classList.add('noting');
  s.tag.li.classList.add('noted');
  s.tag.li.querySelector('button.name')?.setAttribute('aria-expanded', 'true');
  say(noteLine(s));
}
// What it holds now (kept up to date while the note's up: on your death's
// card the round goes on).
function noteNowFor(s) {
  const now = isMe(s) ? '' : !s.alive ? 'Out of this round.' : powerWords(s).trim();
  if (noteNow.textContent !== now) noteNow.textContent = now;
  if (noteNow.hidden !== !now) noteNow.hidden = !now; // (written only when it changes: this runs with the HUD)
  if (isMe(s)) { const how = youWords(s); if (noteHow.textContent !== how) noteHow.textContent = how; }
}
// The card's own words again. Focus on its × isn't lost with it: from the
// keyboard (byKey) it goes back to the name the note was asked for from,
// else to the card.
function closeNote(byKey = false) {
  if (!noted) return;
  const name = noted.tag?.li.querySelector('button.name'), inside = noteEl.contains(document.activeElement);
  noted.tag?.li.classList.remove('noted');
  name?.setAttribute('aria-expanded', 'false');
  noted = null;
  noteEl.hidden = true;
  cardEl.classList.remove('noting');
  if (!inside) return;
  const to = byKey && name || cardEl;
  to.focus({ preventScroll: true });
  if (to === name) tabbed = name; // (back as if Tabbed to: Enter there opens it again, rather than asking to start over)
}
$('note-close').addEventListener('click', e => closeNote(e.detail === 0));
document.addEventListener('pointerdown', e => { if (noted && !e.target.closest?.('#scoreboard, button, input, label, a, #records, #picker')) closeNote(); });
// Choosing your rivals: a start card's seat opens the picker, every rival
// and "Any" (dealt from the deck). The choice is kept in this browser
// (Records.setSeat) for every round after, until you change it; online it's
// the host's that counts, chosen in the lobby's seats (hostLineUp). A rival
// already in another seat swaps with this one's.
const pickerEl = $('picker'), pickerList = $('picker-list'), pickerTitle = $('picker-title');
let pickerSeat = -1;
const keyDot = key => PERSONA_DOTS[key] || CAST[key].ink || CAST[key].color;
// Where the seats are: the start card's, or (hosting) the lobby's.
const choosing = () => (online ? hosting() && !lobbyEl.hidden && !lobbyPlayers.hidden && (state === 'lobby' || state === 'over') : state === 'ready');
const seatsNow = () => (online ? hostLineUp().keys : theGame.snakes.filter(s => s.persona).map(s => s.personaKey));
const seatEl = seat => (online ? lobbyPlayers : opponentsEl).querySelector(`.seat[data-seat="${seat}"]`);
function openPicker(seat) {
  if (!choosing()) return;
  closeNote();
  pickerSeat = seat;
  const seats = Records.seats(SnakeAI.POOL), here = seatsNow()[seat];
  pickerTitle.textContent = `Who sits here, instead of ${here ? CAST[here].name : 'them'}?`;
  pickerList.textContent = '';
  for (const key of [null, ...SnakeAI.POOL]) {
    const li = document.createElement('li'), button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick' + (key ? '' : ' any');
    button.dataset.key = key || '';
    button.setAttribute('aria-pressed', String(seats[seat] === key));
    const dot = document.createElement('span');
    dot.className = 'dot';
    if (key) dot.style.background = keyDot(key);
    const name = document.createElement('strong');
    name.textContent = key ? CAST[key].name : 'Any';
    const blurb = document.createElement('span');
    blurb.className = 'blurb';
    blurb.textContent = key ? CAST[key].blurb : 'Dealt: you meet them all before anyone twice.';
    button.append(dot, name, blurb);
    const other = key ? seats.indexOf(key) : -1;
    if (other >= 0 && other !== seat) {
      const tag = document.createElement('span');
      tag.className = 'who';
      tag.textContent = 'in another seat: swaps';
      button.append(tag);
    }
    li.append(button);
    pickerList.append(li);
  }
  pickerEl.hidden = false;
  mainEl.inert = true;
  pickerEl.querySelector('.picker-card').scrollTop = 0;
  (pickerList.querySelector('[aria-pressed="true"]') || $('picker-close')).focus({ preventScroll: false });
}
function closePicker() {
  if (pickerEl.hidden) return;
  pickerEl.hidden = true;
  mainEl.inert = false;
  (seatEl(pickerSeat) || startBtn).focus({ preventScroll: true });
}
// The seat takes its rival, or one dealt for "Any"; the other seats keep theirs.
// dealt: the ones the deck dealt to these seats (they go back if never met).
function reseat(was, dealt, seat, key) {
  const pool = SnakeAI.POOL, seats = Records.setSeat(pool, seat, key || null);
  // (The rival picked from another seat leaves it this seat's old one: they swap.)
  const keys = was.map((k, i) => seats[i] || (i !== seat && k === key ? was[seat] : i === seat || seats.includes(k) ? null : k));
  const kept = dealt.filter(k => keys.includes(k)); // (one you sent away counts as met)
  const fill = Records.deal(pool, keys.filter(k => !k).length, keys.filter(Boolean)), next = [...fill];
  return { keys: keys.map(k => k || next.shift()), kept, fill, chosen: seats.some(Boolean) };
}
function pickRival(key) {
  const seat = pickerSeat;
  if (online) {
    const up = reseat(hostLineUp().keys, hostLineUp().fresh, seat, key);
    online.lineup = { keys: up.keys, fresh: [...up.kept, ...up.fill] };
    sendLobby();
  } else {
    const up = reseat(seatsNow(), theGame.dealt || [], seat, key);
    theGame.dealt = [...up.kept, ...up.fill]; // (newGame keeps the ones seated)
    ready(up.keys, up.chosen);
  }
  pickerEl.hidden = true;
  mainEl.inert = false;
  seatEl(seat)?.focus({ preventScroll: true });
}
opponentsEl.addEventListener('click', e => { const b = e.target.closest?.('.seat'); if (b && cardSettled(e)) { Sound.play('ui'); openPicker(Number(b.dataset.seat)); } });
lobbyPlayers.addEventListener('click', e => { const b = e.target.closest?.('.seat'); if (b && cardSettled(e)) { Sound.play('ui'); openPicker(Number(b.dataset.seat)); } });
pickerList.addEventListener('click', e => { const b = e.target.closest?.('.pick'); if (b) { Sound.play('ui'); pickRival(b.dataset.key); } });
$('picker-close').addEventListener('click', closePicker);
pickerEl.addEventListener('click', e => { if (e.target === pickerEl) closePicker(); });

// What the chips mean, in words (phones have no tooltips).
function yourPowerWords(s) {
  const how = (left, gold) => gold ? `${gold} golden` : left === 0 ? 'ready' : left === Infinity ? 'not at 3' : 'resting';
  return `${touchFirst ? 'A tap' : 'Space or a click'} jumps: ${how(Engine.leapIn(theGame, s), s.leaps)}. ${touchFirst ? 'A swipe ahead' : 'E, Shift or right-click'} flashes: ${how(Engine.flashIn(theGame, s), s.dashes)}.`;
}
// Golden powers held, as words: ['2 golden jumps', '1 golden flash'].
const goldWords = s => [s.leaps > 0 && `${s.leaps} golden jump${s.leaps === 1 ? '' : 's'}`, s.dashes > 0 && `${s.dashes} golden flash${s.dashes === 1 ? '' : 'es'}`].filter(Boolean);
const powerWords = s => { const held = goldWords(s); return (held.length ? ` Holding ${held.join(' and ')}.` : '') + (s.wrapUntil > theGame.time ? ' The edges wrap for it.' : ''); };

function updateHud(force = false) {
  const score = player()?.eaten ?? 0;
  if (force || scoreEl.textContent !== String(score)) scoreEl.textContent = score;
  // Best follows your score live once you pass it (it's saved when your round ends).
  const shownBest = Math.max(best, score);
  if (force || bestEl.textContent !== String(shownBest)) {
    if (!force && score > best && !theGame.passedBest) { theGame.passedBest = true; bump(bestEl); }
    bestEl.textContent = shownBest;
  }
  // The leader (the longest snake, if one is longest) wears a crown.
  let lead = null, top = 0;
  for (const s of theGame.snakes) {
    if (!s.alive) continue;
    if (s.body.length > top) { top = s.body.length; lead = s; } else if (s.body.length === top) lead = null;
  }
  for (const s of theGame.snakes) {
    const t = s.tag, last = t.last;
    const dot = dotColor(s);
    const leading = s === lead;
    const len = s.alive ? String(s.body.length) : 'out';
    const left = s.alive ? Engine.hungerLeft(theGame, s) : 0;
    const full = s.alive ? Math.max(0, Math.min(1, left / (s.mealMs || TUNE.HUNGER_MS))) : 0; // (against the last meal: full after any, though one mid-round lasts less)
    const bar = Math.round(full * 100);
    const starving = s.alive && left < TUNE.HUNGER_WARN_MS;
    if (force || last.dot !== dot) { t.dot.style.background = dot; last.dot = dot; }
    if (force || last.len !== len) {
      t.len.textContent = len;
      if (!force && s.alive && last.len !== undefined) bump(t.len, TAG_BUMP);
      last.len = len;
    }
    // Powers, in words for screen readers (the chips themselves are hidden from them).
    const holds = !s.alive ? '' : goldWords(s).map(w => `, ${w}`).join('');
    const said = !s.alive ? ', ' : `${starving ? ', starving' : ''}${leading ? ', in the lead' : ''}${holds}${s.wrapUntil > theGame.time ? `, the edges wrap for ${isMe(s) ? 'you' : s.persona ? 'it' : 'them'}` : ''}, length `; // (for screen readers)
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
    const wrapS = s.alive && s.wrapUntil > theGame.time ? Math.ceil((s.wrapUntil - theGame.time) / 1000) : 0;
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
      rest(t, 'jump', Engine.leapIn(theGame, s), TUNE.LEAP_COOLDOWN_MS, s.leaps);
      rest(t, 'flash', Engine.flashIn(theGame, s), TUNE.FLASH_COOLDOWN_MS, s.dashes);
    }
    // Your plain powers back from their rest: a flick round your head and a
    // tick (the jump's, or the flash's), unless you're holding golden ones.
    const jumpBack = mine && s.body.length > TUNE.MIN_LENGTH && theGame.time >= s.leapReadyAt;
    const flashBack = mine && !(TUNE.FLASH_COST > 0 && s.body.length <= TUNE.MIN_LENGTH) && theGame.time >= s.flashReadyAt;
    if (!force && jumpBack && last.jumpBack === false && !s.leaps) { Render.ready(s, 'jump'); Sound.play('ready'); }
    if (!force && flashBack && last.flashBack === false && !s.dashes) { Render.ready(s, 'flash'); Sound.play('flashReady'); }
    last.jumpBack = jumpBack; last.flashBack = flashBack;
  }
  if (noted) noteNowFor(noted); // (a note on the card keeps up: your death's card has the round going on behind it)
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
  if (!gold) el.title = `Your ${kind}${now === 'ready' ? ' is ready' : now === 'small' ? ': too small for it' : ' is resting'} (${kind === 'jump' ? (touchFirst ? 'tap' : 'Space or a click') : touchFirst ? 'swipe ahead' : 'E, Shift or right-click'})`;
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
// mood, Vulture's pink head (black would vanish), and Copycat's party pin.
const PERSONA_DOTS = {
  wildcard: 'linear-gradient(135deg, #3c3b6e 0 42%, #b22234 42% 56%, #fff 56% 70%, #b22234 70% 84%, #fff 84%)',
  joker: 'linear-gradient(90deg, #a21caf 50%, #f59e0b 50%)',
  mason: 'radial-gradient(circle at 68% 30%, #c9a227 0 14%, transparent 15%), radial-gradient(circle at 10% 115%, transparent 0 55%, #8a94a6 56% 66%, transparent 67%), #f1ece2', // (marble: a curl of grey vein and a gold fleck, no stripe straight across)
  ghost: 'radial-gradient(circle at 35% 35%, #f8fafc, #b8c4d4)', // (pale, but not an empty ring)
  star: 'radial-gradient(circle at 50% 50%, #f9c22e 0 28%, transparent 30%), conic-gradient(#ef4444, #f97316, #facc15, #22c55e, #3b82f6, #6366f1, #a855f7, #ef4444)', // (a rainbow round its sunflower star)
};
// Copycat's dot is the flag's red with a small yellow star, its party pin,
// whoever it's copying (its head keeps the pin, and a red rim round half its red): it keeps
// it apart from the cast's other reds, Sniper's, Colonist's and Wildcard's.
PERSONA_DOTS.copycat = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 10 10\'%3E%3Cpath d=\'M5 1.5L5.82 3.87L8.33 3.92L6.33 5.43L7.06 7.83L5 6.4L2.94 7.83L3.67 5.43L1.67 3.92L4.18 3.87z\' fill=\'%23ffde00\'/%3E%3C/svg%3E") center / 100% no-repeat, #de2910';
function dotColor(s) {
  if (s.personaKey === 'mute') return Render.colorOf(s); // (its mood, as it changes)
  return PERSONA_DOTS[s.personaKey] || s.persona?.ink || Render.colorOf(s);
}
// The same dots in the Hall of Fame and Your story, by a rival's name.
const dotByName = name => { for (const k in CAST) if (CAST[k].name === name) return PERSONA_DOTS[k] || null; return null; };

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
  muteBtn.setAttribute('aria-pressed', String(Sound.isMuted()));
  musicBtn.setAttribute('aria-pressed', String(!Sound.isMusicOn()));
  musicBtn.disabled = Sound.isMuted();
  // During a round the page holds still under your fingers (see the swipes).
  document.documentElement.classList.toggle('playing', (state === 'running' || state === 'countdown') && playerAlive());
  document.documentElement.classList.toggle('in-round', state === 'running' || state === 'countdown');
  if (helpEl) updateHelp(); // (watching or playing: the help says what you can do)
  fitColumn(); // (on its side, watching: the help may give the chatter its room)
  keepAwake();
}

function setSpeed(n) {
  speed = n;
  if (!theGame.withPlayer) watchSpeed = n;
  const was = tickLen;
  tickLen = Engine.tickMs(theGame) / (spectating() ? speed : 1);
  acc *= tickLen / was; // (the same point between ticks: nothing jumps)
  updateControls();
}
