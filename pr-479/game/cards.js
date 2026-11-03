// The game controller (see game/core.js): the cards (start, pause, death, results), their rival roll-call and the
// seats where you choose who sits.

// card = { title, text, flavor, primary, secondary, opponents, reward, quiet,
//   friends (show "Play with friends"), lobby (which lobby parts, see renderLobby),
//   actions: { primary, secondary } (what the buttons do, instead of the usual) }
let cardActions = null, howRow = null;
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
  closeNote(); // (a new card: its own words)
  helpEl.hidden = state === 'ready'; // the start card already shows the controls
  startBtn.hidden = !card.primary;
  if (card.primary) startBtn.textContent = card.primary;
  watchBtn.hidden = !card.secondary;
  if (card.secondary) watchBtn.textContent = card.secondary;
  friendsBtn.hidden = !card.friends;
  howBtn.hidden = !card.how; // (the Field guide, from the start card, the nap and your death's card)
  if (card.how) howBtn.textContent = card.how;
  howRow = card.howRow || null; // (your death's card: the guide opens at what got you)
  cardLinks.hidden = friendsBtn.hidden && howBtn.hidden;
  // In the lobby the tags would show the solo round behind the card, not who's playing.
  tagsEl.style.visibility = state === 'lobby' ? 'hidden' : '';
  cardActions = card.actions || null;
  renderLobby(card.lobby);

  // The reward: a new best gets its own moment; the Hall of Fame asks for a
  // name only when the round really earned a place there.
  badgeEl.hidden = true;
  nameRow.hidden = true;
  if (card.reward && theGame.entryId) {
    if (theGame.newBest && !theGame.celebrated) {
      theGame.celebrated = true;
      Sound.play('best');
      Render.celebrate();
      flashFrame('win', true);
    }
    if (theGame.newBest) { badgeEl.textContent = FLAVOR.newBest(best); badgeEl.hidden = false; }
    const rank = yourRank();
    if (rank.overall && (rank.overall <= 3 || theGame.newBest)) {
      nameRank.textContent = Records.hasName() ? `Hall of Fame #${rank.overall}, as ${Records.getName()}.` : `Hall of Fame #${rank.overall}. ${CARVE}`;
      nameRow.hidden = false;
    } else if (rank.personal === 1 && theGame.newBest) {
      nameRank.textContent = Records.hasName() ? `Top of your own list, as ${Records.getName()}.` : `Top of your own list. ${CARVE}`;
      nameRow.hidden = false;
    }
    if (!nameRow.hidden && theGame.carveOffered && theGame.carveOffered !== card.title && document.activeElement !== nameInput) nameRow.hidden = true; // (offered once: the round-over card after your death card doesn't ask again)
    if (!nameRow.hidden) theGame.carveOffered = card.title;
    if (!nameRow.hidden && document.activeElement !== nameInput) nameInput.value = Records.hasName() ? Records.getName() : '';
    if (document.activeElement !== nameInput) nameRow.classList.toggle('carved', Records.hasName()); // (a name's in: on the smallest boards the field gives the card's links their room back)
    if (!nameRow.hidden) namingEntry = theGame.entryId;
  }

  overlay.querySelector('.card').classList.toggle('beat', !!card.beat); // the countdown: a big number
  overlay.querySelector('.card').classList.toggle('ended', state === 'over' && !!player() && !player().alive); // the round's card when your death ended it: its words say more than your death's (style/: how long you lasted), so more gives way to fit (a win keeps its badge)
  overlay.classList.remove('hidden');
  overlay.querySelector('.card').scrollTop = 0;
  if (!card.quiet) say(announcement(card));
  // Focus: the card itself on the first card, on a countdown (a focused Go!
  // mustn't take a key meant for the round) and when the carve is offered
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
  const rank = Records.rankOf(theGame.entryId);
  if (state === 'over' || !rank.overall) return rank;
  let ahead = 0;
  for (const s of theGame.snakes) if (s.alive && (!online || (s.isPlayer && s.owner))) ahead++;
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
  closeNote();
  overlay.classList.add('hidden');
  shownCard = null;
  keepAwake(); // (back to the board: a round going on keeps the screen on)
}

// The roll-call on the start and countdown cards: every rival, AIs with a
// word on how they play, friends tagged as friends. On the start card each
// rival's seat is a button: who sits there is yours to choose (openPicker).
function buildOpponents() {
  opponentsEl.textContent = '';
  const seats = state === 'ready' && !online ? Records.seats(SnakeAI.POOL) : null;
  let seat = 0;
  for (const s of theGame.snakes) {
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
    if (seats && s.persona && seat < Records.SEATS) {
      const i = seat++;
      li.append(seatButton(i, dot, name, !!seats[i]), ...(seats[i] ? [unpinButton(i, s.name)] : []), ' ', blurb);
    } else li.append(dot, name, ' ', blurb);
    opponentsEl.append(li);
  }
  const tip = document.createElement('li'); // (shown only where the blurbs are hidden: a small board)
  tip.className = 'tap-tip';
  tip.textContent = FLAVOR.tapTip;
  opponentsEl.append(tip);
}

// A rival's seat as a button that opens the picker: on the start card, and
// in the lobby for the host. A chosen one wears a ring.
function seatButton(i, dot, name, chosen) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'seat' + (chosen ? ' chosen' : '');
  button.dataset.seat = i;
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-label', `${name.textContent}, ${chosen ? 'chosen' : 'dealt'}. Choose who sits here`);
  button.title = 'Choose who sits here';
  const swap = document.createElement('span');
  swap.className = 'swap';
  swap.setAttribute('aria-hidden', 'true');
  swap.innerHTML = '<svg viewBox="0 0 12 12"><path d="M2 4h8M7.5 1.5 10 4 7.5 6.5M10 8H2M4.5 5.5 2 8l2.5 2.5"/></svg>';
  button.append(dot, name, swap);
  return button;
}

// A chosen seat's pin, beside it on the start card: a tap sets the seat back
// to "Any" (unpinSeat). Your choice lasts this visit.
function unpinButton(i, who) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'unpin';
  button.dataset.seat = i;
  button.setAttribute('aria-label', `Unpin ${who} (chosen for this visit): back to Any`);
  button.title = 'Pinned for this visit: tap to unpin';
  button.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 1.5h4M5 1.5v3.2L3 7h6L7 4.7V1.5M6 7v3.5"/></svg>';
  return button;
}

// Choosing your rivals: a start card's seat opens the picker, every rival
// and "Any" (dealt from the deck). The choice is kept for this visit
// (Records.setSeat), round after round, and a chosen seat wears a pin: a tap
// on it sets the seat back to "Any" (unpinSeat). Online it's
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
function pickRival(key, seat = pickerSeat) {
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
// The pin on a chosen seat: back to "Any", without the picker.
function unpinSeat(seat) {
  if (!choosing() || online) return;
  closeNote();
  pickRival(null, seat);
}
opponentsEl.addEventListener('click', e => { const b = e.target.closest?.('.unpin'); if (b && cardSettled(e)) { Sound.play('ui'); unpinSeat(Number(b.dataset.seat)); } });
pickerList.addEventListener('click', e => { const b = e.target.closest?.('.pick'); if (b) { Sound.play('ui'); pickRival(b.dataset.key); } });
$('picker-close').addEventListener('click', closePicker);
pickerEl.addEventListener('click', e => { if (e.target === pickerEl) closePicker(); });
