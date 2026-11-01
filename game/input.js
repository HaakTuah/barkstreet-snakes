// The game controller (see game/core.js): input, from keys, touch, swipes
// and the buttons.

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
  if (p.stunUntil > theGame.tick) {
    if (next === p.dir && !p.queue.length) return; // (at what you hit: nothing to change)
    if (reverse(next, back)) { // (into your neck: unless it's a U-turn's second key, after a turn)
      if (p.queue.length === 1 && p.queue[0] !== next && !reverse(next, p.queue[0])) p.queue.push(next);
      else p.heldReverse = { dir: next, at: now, tick: theGame.tick };
      return;
    }
    p.queue.length = 0;
    if (next !== p.dir) {
      p.queue.push(next);
      p.turnedAt = { dir: next, at: now };
      const held = p.heldReverse;
      p.heldReverse = null;
      if (held && (held.tick === theGame.tick || now - held.at < TUNE.CHORD_MS) && held.dir !== next && !reverse(held.dir, next)) p.queue.push(held.dir); // (the U-turn, reverse key first)
    }
    return;
  }
  const lastQ = p.queue.length ? p.queue[p.queue.length - 1] : null;
  if (next === (lastQ || p.dir)) return; // (the way you're already going: nothing)
  const last = lastQ || back;
  if (reverse(next, last)) {
    if (!p.queue.length) { p.heldReverse = { dir: next, at: now, tick: theGame.tick }; return; } // (maybe a U-turn's second key, early: see below)
    const before = p.queue.length > 1 ? p.queue[p.queue.length - 2] : back;
    if (next === before || reverse(next, before)) return;
    p.queue[p.queue.length - 1] = next;
    p.turnedAt = { dir: next, at: now };
    return;
  }
  if (p.queue.length < TUNE.QUEUE) {
    p.queue.push(next);
    p.turnedAt = { dir: next, at: now };
    const held = p.heldReverse;
    p.heldReverse = null;
    if (held && (held.tick === theGame.tick || now - held.at < TUNE.CHORD_MS) && held.dir !== next && !reverse(held.dir, next) && p.queue.length < TUNE.QUEUE) p.queue.push(held.dir); // (the U-turn, both keys, any time before the snake moves)
  }
}
// A fresh swipe: the way you're already going flashes, any other way steers.
// (A swipe the way you turned a moment ago is that turn swiped twice, not a
// flash: two quick swipes up mean up.)
function swipeTo(name, p = player()) {
  const next = DIRS[name], ahead = p.queue.length ? p.queue[p.queue.length - 1] : p.dir;
  if (next !== ahead) return turn(name, p);
  if (p.turnedAt?.dir === next && performance.now() - p.turnedAt.at < TUNE.POWER_AFTER_TURN_MS) return;
  Engine.flash(theGame, p);
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
function steerTo(name, swipe = false) {
  if (!playerAlive()) return;
  const press = swipe && state === 'running' ? swipeTo : turn;
  if (state === 'running' || state === 'countdown') { theGame.steered = true; hideSteerHint(); } // (you've found the controls)
  if (state === 'running' && youHideAt) youHideAt = Math.min(youHideAt, performance.now() + TUNE.YOU_AFTER_STEER_MS); // (you've found yourself)
  const heard = () => Render.pressed?.(DIRS[name]); // (your press shows at once: your head leans that way and is drawn ahead from it, online too, before the host's game takes it; stunned, the chevron by your head. pressed() takes it as the game does: never into the neck, and the way you face is nothing)
  if (online) {
    // Online the countdown runs its course; presses go to the host's game.
    if (state !== 'countdown' && state !== 'running') return;
    heard();
    if (guesting()) online.room.send({ t: press === swipeTo ? 'swipe' : 'turn', d: name });
    else hostPress(me => press(name, me));
    return;
  }
  if (state === 'ready') start({ going: true });
  if (state === 'paused') resume(); // (any steer wakes a nap, and steers: you meant to keep going)
  if (state === 'countdown') { heard(); turn(name); go(); youHideAt = Math.min(youHideAt, performance.now() + TUNE.YOU_AFTER_STEER_MS); }
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
const powerOf = (s, kind) => (kind === 'unleap' ? unleap : kind === 'flash' ? Engine.flash : Engine.leap)(theGame, s);
// A jump asked for and not gone yet, taken back (a finger held still that
// turned out to be a swipe: see the touches).
const unleap = (g, s) => { if (s?.alive && s.leapArmed >= g.tick) s.leapArmed = -1; };

// A friend sees each tick half a round trip late, and their presses take
// the other half to arrive. So the host's own presses (turns and powers)
// wait a whole round trip, in the order they were made: no one gets a head start.
let hostPressAt = 0;
function hostPress(fn) {
  const me = player();
  if (me.autopilot) me.autopilot = null; // back from a hidden tab: your hands again
  const now = performance.now();
  const at = Math.max(now + Math.min(TUNE.HOST_DELAY_MAX, online.room.rtt()), hostPressAt);
  hostPressAt = at;
  const press = () => { fn(me); if (planSent && state === 'running' && online) sendPlan(); }; // (friends see it coming)
  if (at - now < 4) return press();
  setTimeout(() => { if (me.alive && theGame.snakes[me.id] === me) press(); }, at - now);
}

// A result is on its way (your death's card in the freeze, or the round's
// card in its pause): keys wait for it, never throw it away.
const cardComing = () => !!pendingCard && (state === 'over' || (state === 'running' && !playerAlive()));
// Any key that plays wakes a nap (the Pause row of "Voice and copy"):
// Space and the flash keys wake without a power, Enter wakes, a steering
// key wakes and steers (steerTo). Whether it woke the game.
function wakes() {
  if (state !== 'paused' || online || cardComing() || askingStartOver) return false; // (Start over? is answered by its buttons, Enter or a steer)
  resume();
  return true;
}
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

// Copying the title: its S is a drawing over a see-through letter, so a
// rich paste (into an email, say) would read "Barkstreet  nakes". A copy
// that takes in the title is the words it says, and nothing else.
document.addEventListener('copy', e => {
  const sel = getSelection(), s = document.querySelector('h1 .snake-s');
  if (!s || !e.clipboardData || !sel || sel.isCollapsed || !sel.containsNode(s, true)) return;
  const text = sel.toString();
  e.clipboardData.setData('text/plain', text);
  e.clipboardData.setData('text/html', text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]));
  e.preventDefault();
});
let shiftAlone = false;
document.addEventListener('keyup', e => { if (e.key === 'Shift' && shiftAlone && recordsEl.hidden && pickerEl.hidden) wakes(); shiftAlone = false; });
document.addEventListener('keydown', e => {
  if (e.key !== 'Shift') shiftAlone = false;
  Sound.unlock();
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
    if (e.key === 'Shift' && state === 'paused') { shiftAlone = !e.repeat; return; } // (napping, Shift wakes on its lift, if no key came with it: Shift+G is G, Shift+Tab is Tab)
    if (!e.repeat && recordsEl.hidden && pickerEl.hidden && !wakes()) power(pow); // (napping: it wakes, and fires nothing)
    return;
  }
  if (!pickerEl.hidden) {
    if (e.key === 'Escape') { e.preventDefault(); closePicker(); }
    return;
  }
  if (!recordsEl.hidden) {
    if (e.key === 'Escape') { e.preventDefault(); closeRecords(); }
    else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); recordsKey('scores'); }
    else if (e.key === 'g' || e.key === 'G') { e.preventDefault(); recordsKey('guide'); }
    return;
  }
  const dir = KEYS[e.key] || CODES[e.code];
  if (dir) { e.preventDefault(); if (!e.repeat) { if (!playerAlive()) wakes(); steerTo(dir); } return; } // (out and napping, it only wakes) // (a held key's repeats steer nothing: its first press did)
  // A held key repeats nothing, not even a focused button (holding Enter on
  // Play would otherwise start the round and then skip its countdown).
  if (e.repeat) { if (e.key === 'Enter') e.preventDefault(); return; }
  // Enter on a focused button belongs to the button.
  if (e.key === 'Enter' && e.target.closest?.('button')) {
    // A card's or a dialog's button keeps its keys. Elsewhere (the header's,
    // the speed buttons, a tag), in a round, they're the game's keys again.
    if (e.target.closest('#overlay, #records, #picker') || !(state === 'running' || state === 'countdown' || state === 'paused') || e.target === tabbed) return; // (Tabbed to: the button's own keys)
    e.target.blur();
  }
  if (e.key === 'Escape' && noted) { e.preventDefault(); closeNote(true); return; } // (a note you asked for goes first; Esc again wakes, or keeps watching, as ever)
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { e.preventDefault(); napKey(); } // (Escape on your death card keeps watching)
  else if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    const key = e.key === 'Enter' ? 'Enter' : 'R';
    if (cardComing()) return; // (the result's card first)
    if (state === 'countdown') { if (!online) go(); } // (online the countdown runs its course: everyone starts together)
    else if (state === 'paused' && askingStartOver) start();
    else if (state === 'paused' && key === 'Enter') resume(); // (Enter wakes; R still asks to start over)
    else if ((state === 'running' || state === 'paused') && playerAlive() && !online) askStartOver(key); // (R sits next to D: a slip shouldn't throw a round away, napping or not)
    else start({ aiOnly: false });
  }
  else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); openRecords('scores'); }
  else if (e.key === 'g' || e.key === 'G') { e.preventDefault(); openRecords('guide'); }
  else if (e.key === 'm' || e.key === 'M') toggleMute();
  else if (e.key === 'n' || e.key === 'N') toggleMusic();
  else if (e.key === 'v' || e.key === 'V') toggleVoices();
  else if (SPEED_KEYS[e.key] && !speedEl.hidden) setSpeed(SPEED_KEYS[e.key]);
  else if (e.key === '`' && DEV) perf.toggle();
});

// Swipes and taps, on the board always, and during a round anywhere on the
// screen (over the countdown card too); the page never scrolls.
// - A swipe steers: a turn registers once the finger has travelled half a
//   cell (at least SWIPE_MIN_PX), without lifting, its way clearly the
//   finger's (half again the other: a slant waits, until the finger has
//   gone SWIPE_SURE times that far, when its main way counts). One touch
//   chains turns, each after SWIPE_CHAIN_PX more, counted from where the
//   finger turned. A fresh swipe the way you're going flashes; a finger
//   that keeps going that way doesn't, nor does a second swipe the way the
//   last one turned you, just after it lifted (POWER_AFTER_TURN_MS: the
//   turn swiped twice, to make sure).
// - A tap jumps: a touch that lifts without travelling (TAP_STILL_PX), or
//   quickly (TAP_QUICK_MS) without travelling as far as a swipe (a finger
//   rolls as it lifts), anywhere but a working button or a name tag. Held
//   still for TAP_JUMP_MS, it jumps without waiting for the lift, but only
//   with something to hop on the way: a thumb resting on the glass, ready
//   to steer, isn't a jump. A touch that becomes a swipe never jumps (a
//   jump its hold asked for that hasn't gone yet is taken back), and nor
//   does a thumb that was resting while another one swiped (its jump is
//   taken back too, if it's still resting). One that lifted first was a
//   tap: a swipe after it leaves its jump be.
// Every finger on the glass is its own: a thumb left resting doesn't block
// the other, and can still steer once the other lifts. Buttons stay
// buttons: during a round a swipe may start on one (the Go! in the middle
// of the board, the header's), and once it's travelled it steers and the
// button's click is swallowed; a short tap is still a click. But a card
// that comes up by itself (your death's, the round's end) takes no touch
// that began as it came up, nor one of a run of quick touches that did
// (CARD_TAP_MS, CARD_MASH_MS): mashing jump never plays again, nor
// focuses the name field it offers (the phone's keyboard over the round).
const swipes = new Map(); // touch id -> { x, y (the anchor), x0, y0 (where it touched), at, far (furthest from there), run (when its run of touches began), last, button, tapOnly, moved, tap, timer, held (when its hold asked for a jump that may not have gone yet) }
const swiping = () => (state === 'running' || state === 'countdown') && playerAlive();
const swipeMin = () => Math.max(TUNE.SWIPE_MIN_PX, (boardPx || 320) / GRID_SIZE * TUNE.SWIPE_CELLS); // (how far a fresh swipe goes before it counts)
let touchAt = -Infinity, runFrom = -Infinity; // (the last touch, and when the run of quick touches it's in began)
let lastSwipe = null; // the last swipe to register: { dir, sw (its touch), up (when it lifted; 0 while it's down), turn (it turned, not flashed) }
document.addEventListener('touchstart', e => {
  Sound.unlock();
  const now = performance.now();
  if (now - touchAt >= TUNE.CARD_MASH_MS) runFrom = now;
  touchAt = now;
  if (!swiping() && runFrom < cardShownAt + TUNE.CARD_TAP_MS && e.target.closest?.('#overlay input, #overlay label, #overlay a')) { e.preventDefault(); return; } // (a card that came up by itself under a run of quick touches: its name field takes none of them either, no focus and no phone keyboard over the round)
  if (e.target.closest?.('input, a, #records, #picker')) return;
  const button = e.target.closest?.('button:not(:disabled), [role="switch"], .chatter[aria-expanded] > :is(.chatlog, .chatter-head)'); // (the chatter's panel, held upright on a phone: a tap opens or folds it; its box's empty rest under the panel is the board's, a tap there a jump)
  if (!button && !swiping() && !canvasEl.contains(e.target)) return;
  const tapOnly = !!button && !swiping(); // (outside a round a button touch is a tap or a scroll, never a swipe)
  const taps = !button && !e.target.closest?.('#scoreboard') && state === 'running' && playerAlive(); // (a tap here would be a jump)
  for (const t of e.changedTouches) {
    const sw = { x: t.clientX, y: t.clientY, x0: t.clientX, y0: t.clientY, at: now, far: 0, run: runFrom, last: null, button, tapOnly, moved: false, tap: taps, timer: 0, held: 0 };
    if (taps) sw.timer = setTimeout(() => held(sw), TUNE.TAP_JUMP_MS);
    swipes.set(t.identifier, sw);
  }
  if (swiping() && !button) e.preventDefault(); // (not on a button: its tap must still be a click)
}, { passive: false });
// A tap: one jump (unless the finger travelled, or swiped, first).
function tapped(sw) {
  if (!sw.tap) return;
  sw.tap = false;
  clearTimeout(sw.timer);
  for (const o of swipes.values()) o.held = 0; // (a jump meant: nothing to take back)
  power('leap');
}
// Held still: a jump now, if there's something to hop on the way (it waits
// a few ticks for it); else the lift says whether it was a tap. The jump
// is this touch's to take back while it's on the glass (see swiped); once
// it lifts without swiping, it was a tap, and the jump stays.
function held(sw) {
  sw.timer = 0;
  const me = player();
  if (!sw.tap || !me?.alive || !hurdleAhead(me, TUNE.LEAP_WINDOW + 1, true)) return;
  tapped(sw);
  sw.held = performance.now();
}
// A swipe registered: a jump asked for by a finger held still, not gone
// yet, is taken back if that finger is the one swiping, or is still
// resting on the glass while another swipes (it was a thumb about to
// steer); and a thumb that's been resting meanwhile isn't tapping.
function swiped(by) {
  const now = performance.now();
  let heldAt = 0;
  for (const sw of swipes.values()) {
    if (sw !== by && sw.tap && now - sw.at >= TUNE.TAP_JUMP_MS) { sw.tap = false; clearTimeout(sw.timer); }
    heldAt = Math.max(heldAt, sw.held);
    sw.held = 0;
  }
  if (!heldAt || now - heldAt > (TUNE.LEAP_WINDOW + 1) * tickLen) return;
  if (state !== 'running' || !playerAlive()) return;
  if (guesting()) online.room.send({ t: 'pow', k: 'unleap' });
  else if (hosting()) hostPress(s => unleap(theGame, s));
  else unleap(theGame, player());
}
document.addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    const sw = swipes.get(t.identifier);
    if (!sw) continue;
    const from0 = Math.hypot(t.clientX - sw.x0, t.clientY - sw.y0);
    sw.far = Math.max(sw.far, from0);
    if (sw.timer && from0 > TUNE.TAP_STILL_PX) { clearTimeout(sw.timer); sw.timer = 0; } // (moving: no jump before the lift)
    if (sw.tap && sw.far >= swipeMin()) sw.tap = false; // (travelling: not a tap)
    const dx = t.clientX - sw.x, dy = t.clientY - sw.y, ax = Math.abs(dx), ay = Math.abs(dy);
    if (sw.tapOnly) { if (ax + ay > 12) sw.moved = true; continue; } // (a card scrolling: let it)
    e.preventDefault();
    const dir = ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (dir === sw.last) { sw.x = t.clientX; sw.y = t.clientY; continue; } // (still going the way it registered: the anchor keeps up, so a turn counts from where the finger turns)
    const threshold = sw.last ? TUNE.SWIPE_CHAIN_PX : swipeMin(), most = Math.max(ax, ay);
    if (most < threshold || (most < TUNE.SWIPE_AXIS * Math.min(ax, ay) && Math.hypot(dx, dy) < threshold * TUNE.SWIPE_SURE)) continue; // (too short, or a slant not yet far enough to be sure)
    sw.tap = false; // (a swipe is never a jump)
    clearTimeout(sw.timer);
    sw.timer = 0;
    const now = performance.now(), me = player(), ahead = me && (me.queue.length ? me.queue[me.queue.length - 1] : me.dir);
    const twice = !sw.last && lastSwipe?.turn && lastSwipe.sw !== sw && lastSwipe.dir === dir && (!lastSwipe.up || now - lastSwipe.up < TUNE.POWER_AFTER_TURN_MS); // (the last turn swiped again, to make sure: it steers, never flashes)
    steerTo(dir, !twice);
    swiped(sw);
    lastSwipe = { dir, sw, up: 0, turn: !!me && DIRS[dir] !== ahead };
    sw.last = dir;
    sw.x = t.clientX;
    sw.y = t.clientY;
  }
}, { passive: false });
// A touch lifting: a tap if it hadn't travelled. One that began on a
// button: a swipe cancels its click; a tap presses it here (with another
// finger resting on the glass the browser wouldn't).
const endSwipe = e => {
  const now = performance.now();
  for (const c of e.changedTouches) {
    const sw = swipes.get(c.identifier);
    swipes.delete(c.identifier);
    if (!sw) continue;
    clearTimeout(sw.timer);
    if (lastSwipe?.sw === sw) lastSwipe.up = now;
    const far = Math.max(sw.far, Math.hypot(c.clientX - sw.x0, c.clientY - sw.y0));
    if (sw.tap && e.type === 'touchend' && (far <= TUNE.TAP_STILL_PX || (far < swipeMin() && now - sw.at < TUNE.TAP_QUICK_MS))) tapped(sw);
    sw.tap = false;
    if (e.type === 'touchend' && sw.run < cardShownAt + TUNE.CARD_TAP_MS && (!sw.button || overlay.contains(sw.button))) { e.preventDefault(); continue; } // (begun as a card came up by itself, or in a run of touches that was: no click, the browser's or ours)
    if (!sw.button || e.type !== 'touchend' || sw.moved) continue; // (a scroll: the browser's own business)
    e.preventDefault(); // (no click of the browser's own: never twice, never a swipe's)
    if (!sw.last && sw.button.contains(document.elementFromPoint(c.clientX, c.clientY))) sw.button.click();
  }
};
document.addEventListener('touchend', endSwipe, { passive: false });
document.addEventListener('touchcancel', endSwipe);

// The mouse, over the board: the left button jumps and the right one
// flashes, as Space and E do (and no menu pops up over the board). Only a
// mouse's buttons: a finger's taps and swipes are above, and a pen is the
// browser's. A button pressed while another is held (both at once: the jump
// goes first, as with the keys) comes as a pointer move, and counts too. A
// card over the board is the card's: its buttons are buttons. A run of quick
// presses is kept, as touches' are, so mashing jump as your death's card
// comes up under the pointer never presses Play again (see cardSettled).
const MOUSE_POWER = { 0: 'leap', 2: 'flash' }, MOUSE_BIT = { 0: 1, 1: 4, 2: 2 }; // (button -> power; button -> its bit in e.buttons)
let mouseAt = -Infinity, mouseRun = -Infinity; // (the last mouse press, and when the run of quick presses it's in began)
function mousePress(e) {
  if (e.pointerType !== 'mouse' || !(e.button in MOUSE_BIT)) return;
  if (e.type === 'pointermove' && !(e.buttons & MOUSE_BIT[e.button])) return; // (a chord's button let go)
  const now = performance.now();
  if (now - mouseAt >= TUNE.CARD_MASH_MS) mouseRun = now;
  mouseAt = now;
  Sound.unlock();
  const kind = MOUSE_POWER[e.button];
  if (kind && e.target === canvasEl && !e.ctrlKey && !e.metaKey && !e.altKey) power(kind); // (the board itself, no card over it; and no shortcut)
}
document.addEventListener('pointerdown', mousePress);
document.addEventListener('pointermove', e => { if (e.button >= 0) mousePress(e); }); // (only a chord's press or release says which button)
boardEl.addEventListener('contextmenu', e => { if (!e.target.closest?.('.card')) e.preventDefault(); }); // (a card's own text and fields keep theirs)
// A mouse press in a run begun as a card came up by itself (or this soon after): still mashing jump.
const mashedOnCard = e => !!e.target.closest?.('#overlay') && performance.now() - mouseAt < TUNE.CARD_MASH_MS && mouseRun < cardShownAt + TUNE.CARD_TAP_MS;
const keepField = e => { if (mashedOnCard(e) && e.target.closest('input, label')) e.preventDefault(); }; // (nor focuses the name field it offers, or its words: keys mashed next would carve them)
document.addEventListener('mousedown', keepField);
document.addEventListener('click', keepField, true);

// Buttons. (ok: whether a click counts.)
const click = (el, fn, ok = null) => el.addEventListener('click', e => { if (ok && !ok(e)) return; Sound.unlock(); Sound.play('ui'); fn(e); });
// A card that came up by itself takes no pointer's click for a moment, nor
// one of a run of mouse presses that began then (keys are fine: Space never
// presses its buttons unless you Tabbed to one).
const cardSettled = e => !(e.detail > 0 && (performance.now() < cardShownAt + TUNE.CARD_TAP_MS || mashedOnCard(e)));
// A button clicked with a mouse or a finger doesn't keep the keyboard, so
// Space and Enter go back to jumping and starting over. Card and Hall of
// Fame buttons keep focus: there, Enter on a focused button is expected.
document.addEventListener('click', e => {
  const b = e.target.closest?.('button');
  if (b && e.detail > 0 && !b.closest('#overlay, #records, #picker')) b.blur();
});
click(startBtn, () => {
  if (cardActions?.primary) cardActions.primary();
  else if (state === 'paused') resume();
  else if (state === 'countdown') go();
  else start({ aiOnly: false });
}, cardSettled);
click(watchBtn, () => {
  if (cardActions?.secondary) cardActions.secondary();
  else if (state === 'running') hideCard();        // keep watching after you died
  else if (state === 'paused') { if (playerAlive()) askStartOver(null); else start(); } // "Start over" on touch: it asks first, too (out already, there's nothing to lose)
  else start({ aiOnly: true });
}, cardSettled);
// A tap on the board or the napping card's words wakes, as the Wake up
// button does (its buttons and links keep their own jobs); a tap that
// closed a rival's note was for the note, and wakes nothing.
overlay.addEventListener('click', e => { if (performance.now() - touchAt < 800 && performance.now() - noteShutAt > 800 && state === 'paused' && !e.target.closest('button, a, input') && cardSettled(e)) wakes(); }); // (a touch's, just now, which Safari's clicks don't say: a mouse's click there stays nothing, as it was)
click(pauseBtn, () => (state === 'paused' ? resume() : state === 'running' && !playerAlive() && shownCard?.reward && !overlay.classList.contains('hidden') ? hideCard() : napNow()));
muteBtn.addEventListener('click', () => { Sound.unlock(); toggleMute(); }); // (its tap comes after the toggle: see toggleMute)
click(musicBtn, () => toggleMusic());
click(voicesBtn, () => toggleVoices());
click(speedEl, e => { const b = e.target.closest('button'); if (b) setSpeed(Number(b.dataset.speed)); });
click(chatterBtn, () => { Chatter.setEnabled(!Chatter.isEnabled()); showChatterState(); });

// Full screen, where the browser allows it (Android, desktops; an iPhone
// can't, and "Add to Home Screen" opens the game without Safari's bars
// instead). The button says which way it goes; Esc leaves too.
const fullBtn = $('fullscreen');
if (document.fullscreenEnabled) {
  const showFull = () => {
    const full = !!document.fullscreenElement;
    fullBtn.dataset.full = String(full);
    fullBtn.setAttribute('aria-label', full ? 'Leave full screen' : 'Full screen');
    fullBtn.title = full ? 'Leave full screen (Esc)' : 'Full screen';
  };
  click(fullBtn, () => {
    const asked = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    asked?.catch?.(() => {}); // (refused: the button stays as it was)
  });
  document.addEventListener('fullscreenchange', showFull);
  showFull();
  fullBtn.hidden = false;
}

function toggleMute() {
  Sound.toggleMuted();
  Sound.play('ui'); // (heard only when the sound's back on: muting is silent, unmuting taps once)
  updateControls();
}

function toggleMusic() {
  Sound.unlock();
  Sound.toggleMusic();
  updateControls();
}

// The rivals' babble (its bubbles stay: this is only their voices).
function toggleVoices() {
  Sound.unlock();
  Sound.toggleVoices();
  updateControls();
}

function showChatterState() {
  const on = Chatter.isEnabled();
  chatterBtn.firstElementChild.textContent = on ? 'On' : 'Off'; // (the state is aria-checked: the word is for eyes)
  chatterBtn.setAttribute('aria-checked', String(on));
  chatlogEl.hidden = !on;
  fitColumn();
}

// Renaming your Hall of Fame entry from the card. Saved when you're done
// (rivals use the new name from the next round).
let namingEntry = null; // the round the name field is for (the next may start while you type)
nameInput.addEventListener('change', () => {
  if (!namingEntry) return;
  Records.rename(namingEntry, nameInput.value);
  nameRank.textContent = `Carved: ${Records.getName()}.`; // (it took)
  nameRow.classList.add('carved');
});

// Nap automatically when the tab is hidden, or when the window loses focus
// while you're playing (a watched round can keep going on screen). Online the
// round goes on regardless.
document.addEventListener('visibilitychange', () => {
  if (online) return awayOnline();
  if (!document.hidden) return;
  napNow();
});

// The screen stays on while you play, through the countdown, and while
// you watch a round (a screen wake lock); a nap, a card or the Hall of
// Fame lets it go. A hidden tab loses it (the browser lets it go), so
// coming back asks again, if it's still wanted then (alone you'll be
// napping: waking asks). Where there's no wake lock, nothing changes; a
// refusal (a battery saver, say) isn't asked again until the next time
// it's wanted.
const awake = { lock: null, asking: false, refused: false };
function keepAwake() {
  if (!navigator.wakeLock) return;
  const want = !document.hidden && recordsEl.hidden && pickerEl.hidden && (state === 'countdown' || (state === 'running' && overlay.classList.contains('hidden')));
  if (!want) {
    awake.refused = false;
    if (awake.lock) { const lock = awake.lock; awake.lock = null; lock.release().catch(() => {}); }
    return;
  }
  if (awake.lock || awake.asking || awake.refused) return;
  awake.asking = true;
  navigator.wakeLock.request('screen').then(lock => {
    awake.asking = false;
    awake.lock = lock;
    lock.addEventListener('release', () => { if (awake.lock === lock) awake.lock = null; }); // (the browser's doing: a hidden tab)
    keepAwake(); // (let go at once if it's no longer wanted)
  }, () => { awake.asking = false; awake.refused = true; });
}
document.addEventListener('visibilitychange', keepAwake); // (after the nap above)

// Online the round goes on while your tab is hidden, so an AI steers your
// snake until you're back and turn again. A friend's tab says so itself: a
// hidden tab's "still here" slows to once a second, which looks like a
// flickering connection.
function awayOnline() {
  if (guesting()) online.room.send({ t: document.hidden ? 'away' : 'back' });
  const me = player();
  if (!me?.alive || (state !== 'countdown' && state !== 'running')) return;
  if (hosting() && document.hidden) { me.autopilot = CAST.drab; me.queue.length = 0; }
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
