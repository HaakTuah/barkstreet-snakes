// The game controller (see game/core.js): the banner (a toast): where it goes, how long it stays and what
// waits its turn; and the short cues beside it: the screen reader's announcements, the pops, the frame's glow.

// Where a banner goes (DESIGN "Teaching by showing"). On a phone held
// upright it's off the board altogether: above it, over the header's
// title row, between the screen's safe top and the header's row of
// buttons, so it never covers the board, the name tags (yours, with its
// hunger bar) or the pause button; on one line, its words as big as fit
// the row (the phone's own shorter words for the longest, FLAVOR.phone),
// and taps pass through it. Elsewhere it's on the board, at its top or
// its foot: never the middle, where the play is. (A rival's note, asked
// for from its tag while you watch, is too long for a line: it stays on
// the board.)
//
// On the board it keeps out of the way of heads (and the woodpecker's
// mark, a crackle, the steering hint). It comes up in the first of its
// two places that's clear (the top, the foot), and stays there while
// that place is clear: only something coming into it moves it on, to the
// other if that's clear; with both taken, it fades where it is while they
// pass. (Picked afresh every frame, a banner on a short phone hopped about
// three times in its three seconds, half its stays under 0.4 s.) Its size
// is measured once a banner, so this reads no layout. Its time runs while
// you can read it: faded, it stays that much longer (once, up to its hold
// again).
let toastTimer = 0, leaveTimer = 0, toastW = 0, toastH = 0, toastSlot = '', toastUnder = false, toastFresh = true; // (where it is on the board: '' the top, 'low' the foot; whether it's faded there; whether it's a new banner, still to place)
let toastFaded = 0, toastFadedAt = 0, toastLonger = false; // (how long this banner has been faded, since when, and whether it's had its time back)
let bannerText = '', toastAbove = false, aboveBand = null; // (the banner's words; whether it's above the board; where it may go there, measured in placeBoard: null where it's on the board)
const SLOTS = ['', 'low'], SHIFT = [{ opacity: 0 }, { opacity: 1 }];
const headerEl = document.querySelector('header');
function toastFade() {
  if (toastLevel === 'lesson' && toastOpts.still && !toastEl.hidden && !toastEl.classList.contains('leaving') && !toastOpts.still()) return hideToast(true); // (a lesson showing that no longer holds, as yours once you're out, fades early)
  if (toastAbove || toastEl.hidden || toastEl.classList.contains('leaving')) return; // (above the board, nothing comes under it; going, it goes from where it is)
  const busy = { '': false, low: false }, soon = { '': false, low: false };
  if (boardPx && theGame) {
    const cell = boardPx / GRID_SIZE;
    const rows = Math.ceil((toastH + 12) / cell), half = toastW / 2 / cell; // (its real size: a long banner on a phone wraps to several lines)
    const under = (x, y, into = busy) => { // (a cell the banner would hide, if it's one that matters)
      if (Math.abs(x + 0.5 - GRID_SIZE / 2) >= half + 0.5 || y < 0 || y >= GRID_SIZE) return;
      if (y < rows) into[''] = true;
      if (y >= GRID_SIZE - rows) into.low = true;
    };
    for (const s of theGame.snakes) {
      if (!s.alive) continue;
      const h = s.body[0], d = s.queue?.[0] || s.dir;
      under(h.x, h.y);
      if (d) for (let i = 1; i <= 2; i++) under(h.x + d.x * i, h.y + d.y * i, soon); // (where it's going)
    }
    if (steerHintOn && Math.abs(hintBox.x + hintBox.w / 2 - boardPx / 2) < (toastW + hintBox.w) / 2) { // (the steering hint, by YOU: the banner makes way)
      const y0 = hintBox.y, y1 = hintBox.y + hintBox.h;
      if (y0 < toastH + 16) busy[''] = true;
      if (y1 > boardPx - toastH - 16) busy.low = true;
    }
    for (const k of theGame.woodpecker?.target || []) under(k % GRID_SIZE, Math.floor(k / GRID_SIZE)); // (the patch it's warning about)
    if (theGame.fires) for (const [k, f] of theGame.fires) if (f.strike && f.from > theGame.tick) under(k % GRID_SIZE, Math.floor(k / GRID_SIZE)); // (a crackle about to strike)
  }
  let slot = toastFresh ? '' : toastSlot, faded = false;
  if (toastFresh || busy[slot]) { // (new, or something's come into its place)
    const clear = SLOTS.filter(k => !busy[k]);
    if (clear.length) slot = clear.find(k => !soon[k]) ?? clear[0];
    else faded = true;
  }
  const moved = !toastFresh && slot !== toastSlot;
  toastFresh = false;
  if (faded !== toastUnder) {
    const now = performance.now();
    if (toastUnder) toastFaded += now - toastFadedAt;
    else toastFadedAt = now;
    toastEl.classList.toggle('under', faded);
    toastUnder = faded;
  }
  if (slot === toastSlot) return;
  toastEl.classList.toggle('low', slot === 'low');
  toastSlot = slot;
  if (moved && !reducedMQ.matches) toastEl.animate?.(SHIFT, { duration: 140, easing: 'ease-out' }); // (it comes up in its new place, rather than blinking there)
}
// The banner showing, put where it goes (and moved, if the screen's turned
// since): above the board, its words on one line as big as fit the title
// row across (no smaller than BANNER_MIN_FONT of its own size, then cut
// short with an ellipsis: no words of the game's need that, and a test
// checks it) and never taller than the row, level with the title; or on
// the board.
function placeToast() {
  const above = !!aboveBand && toastEl.dataset.kind !== 'note';
  if (above !== toastAbove) {
    toastAbove = above;
    (above ? headerEl : boardEl).appendChild(toastEl);
    toastEl.classList.toggle('above', above);
    toastEl.classList.remove('low', 'under');
    toastSlot = ''; toastUnder = false; toastFresh = true;
  }
  const words = above && (toastOpts.phone || FLAVOR.phone[bannerText]) || bannerText;
  if (toastEl.textContent !== words) toastEl.textContent = words;
  toastEl.style.removeProperty('--toast-fs');
  if (!above) return;
  const band = aboveBand, room = band.bottom - band.top;
  toastEl.style.setProperty('--toast-max', `${band.width}px`);
  const cs = getComputedStyle(toastEl), size = parseFloat(cs.fontSize), floor = size * TUNE.BANNER_MIN_FONT;
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const fit = () => {
    let fs = size;
    for (let i = 0; i < 3; i++) { // (a size, measured: once or twice)
      const wide = toastEl.scrollWidth, tall = toastEl.offsetHeight;
      let next = fs;
      if (wide > toastEl.clientWidth + 0.5 && fs > floor) next = Math.max(floor, fs * (toastEl.clientWidth - padX) / (wide - padX)); // (its words on one line, down to the floor; past it, an ellipsis)
      if (tall > room + 0.5) next = Math.min(next, fs * (room - padY) / (tall - padY)); // (and never taller than the row, whatever it takes: any taller, and it's over the pause button)
      next = Math.floor(next * 10) / 10;
      if (next >= fs) break;
      fs = next;
      toastEl.style.setProperty('--toast-fs', `${fs}px`);
    }
  };
  fit();
  if (toastOpts.short && toastEl.scrollWidth > toastEl.clientWidth + 0.5) { // (still cut at the floor: long names. Its shortest words, the cause dropped ("Gran is first out."); a screen reader and the chatter keep the full line)
    toastEl.textContent = toastOpts.short;
    toastEl.style.removeProperty('--toast-fs');
    fit();
  }
  const h = toastEl.offsetHeight;
  toastEl.style.setProperty('--toast-y', `${Math.round(Math.max(band.top, Math.min(band.bottom - h, band.mid - h / 2)))}px`);
}
// kind styles the banner for its moment: kill, gold, beetle, bird (the
// woodpecker), warn, fire, you (a lesson about your own powers, or your
// own tail), go, note (a rival's, asked for), and the weather's own (sun,
// wind, rain, storm, snow). level: 'round' (what changes the round: first
// blood, the last two, the woodpecker, the last apples, land it took,
// friends coming and going), 'lesson' (a rule, the first time it happens
// to you), 'news' (the weather, a spawn), 'asked' (a rival's note, asked
// for from its tag).
// Every banner is held for its reading time, read in glances while you
// steer: BANNER_BASE_MS and BANNER_WORD_MS a word, up to BANNER_MAX_MS (Go!
// and the wake's "Ready…" are beats of the countdown, held their own
// time; a note you asked for, its own reading time). Nothing cuts one
// short but a card: the next waits its turn, in the order they came, and
// shows a breather (BANNER_BREATHE_MS) after the last one's gone. Round
// news and the weather wait as long as it takes; a lesson waits at most
// LESSON_WAIT_MS of the round (behind one banner, never two: its moment
// has passed), and not if it no longer holds (opts.still), and up to
// three lessons wait. Only Go!, the countdown's last beat, and a note you
// asked for come up at once (what a note interrupts goes back to the
// front of the line). While a card is up, only round news. Screen readers
// hear round news and lessons (and the weather), not the chatter of
// spawns. opts: { quiet } (shown, not said: something else says it),
// { still } (a lesson is shown only while this still holds: waiting,
// it's let go; showing, it fades early),
// { follows } (a lesson that goes with the banner just before it: it
// waits from when that one comes up), { phone } (its words on a phone
// held upright, one line), { short } (its fewest words there, for when
// long names still don't fit a line: the first out without its cause).
let toastLevel = 'news', toastKind = '', toastOpts = {}, toastHold = 0, freeAt = 0;
const waiting = []; // banners waiting their turn: { text, ms, kind, level, opts, at (the round's time it came) }
const bannerLog = params.has('debug') ? [] : null; // (?debug: every banner and what became of it, for the tests and the audit)
const logBanner = (text, level, fate) => { if (bannerLog && bannerLog.length < 2000) bannerLog.push({ t: Math.round(performance.now()), gt: theGame?.time ?? 0, text, level, fate }); };
const readMs = text => Math.min(TUNE.BANNER_MAX_MS, TUNE.BANNER_BASE_MS + TUNE.BANNER_WORD_MS * text.trim().split(/\s+/).length);
function toast(text, ms = 2800, kind = '', level = 'news', opts = {}) {
  const now = performance.now();
  if (level !== 'round' && !overlay.classList.contains('hidden')) return logBanner(text, level, 'card'); // (a card's up)
  if (kind === 'go' || level === 'asked') { // (at once)
    if (level === 'asked' && !toastEl.hidden && !toastEl.classList.contains('leaving') && toastKind !== 'go' && toastLevel !== 'asked')
      waiting.unshift({ text: bannerText, ms: 0, kind: toastKind, level: toastLevel, opts: toastOpts, at: theGame?.time ?? 0 }); // (what the note interrupts goes back to the front of the line)
    return showToast(text, ms, kind, level, opts);
  }
  if (now < freeAt || waiting.length) { // (one showing, going, or taking its breather: this one waits its turn)
    if (level === 'lesson' && waiting.filter(w => w.level === 'lesson').length >= 3) return logBanner(text, level, 'dropped');
    waiting.push({ text, ms, kind, level, opts, at: theGame?.time ?? 0 });
    logBanner(text, level, 'queued');
    if (!toastTimer) toastTimer = setTimeout(nextToast, Math.max(0, freeAt - now));
    return;
  }
  showToast(text, ms, kind, level, opts);
}
function showToast(text, ms, kind, level, opts) {
  const now = performance.now(), hold = kind === 'go' || level === 'asked' ? ms : readMs(text);
  clearTimeout(toastTimer); clearTimeout(leaveTimer); leaveTimer = 0;
  toastLevel = level; toastKind = kind; toastOpts = opts; bannerText = text;
  toastHold = now + hold;
  freeAt = toastHold + TUNE.BANNER_FADE_MS + TUNE.BANNER_BREATHE_MS;
  toastEl.classList.remove('settled', 'leaving'); // (a new banner settles in)
  toastEl.dataset.kind = kind;
  toastEl.hidden = false;
  placeToast();
  toastW = toastEl.offsetWidth; toastH = toastEl.offsetHeight; // (measured once a banner)
  toastFaded = 0; toastFadedAt = now; toastLonger = false;
  toastFresh = true;
  toastFade(); // (placed before it's first drawn: a new banner doesn't start where the last one was)
  if (!opts.quiet && (level !== 'news' || kind in FLAVOR.weather)) say(text);
  logBanner(text, level, 'shown');
  if (waiting[0]?.opts.follows) waiting[0].at = theGame?.time ?? 0; // (a lesson that goes with this banner, next in line: its moment is this one's)
  toastTimer = setTimeout(endToast, hold);
}
// Its time is up: it fades, and the next waiting takes its turn after a
// breather. (A banner that spent a while faded under the heads first gets
// that time back, once.)
function endToast() {
  toastTimer = 0;
  const now = performance.now(), faded = toastFaded + (toastUnder ? now - toastFadedAt : 0);
  if (toastKind !== 'go' && toastLevel !== 'asked' && !toastLonger && !toastEl.hidden && faded >= 300) {
    toastLonger = true;
    const more = Math.min(faded, readMs(bannerText));
    toastHold = now + more;
    freeAt = toastHold + TUNE.BANNER_FADE_MS + TUNE.BANNER_BREATHE_MS;
    toastTimer = setTimeout(endToast, more);
    return;
  }
  hideToast(true);
}
// The first waiting banner that may still show: a lesson whose moment has
// passed, or that no longer holds, is let go.
function nextToast() {
  toastTimer = 0;
  while (waiting.length) {
    const w = waiting.shift();
    if (w.level === 'lesson' && theGame && theGame.time - w.at > TUNE.LESSON_WAIT_MS) { logBanner(w.text, w.level, 'stale'); continue; }
    if (w.opts.still && !w.opts.still()) { logBanner(w.text, w.level, 'skipped'); continue; }
    return showToast(w.text, w.ms, w.kind, w.level, w.opts);
  }
}
// Gone at once (a card is coming up: the banners waiting go with it), or
// faded out (its time is up, or its tag tapped again), the next waiting
// after a breather. It settles in with a short drop and fades out, and
// with reduced motion only fades (style/).
function hideToast(fade = false) {
  clearTimeout(toastTimer); toastTimer = 0;
  if (!fade && !toastEl.hidden && !toastEl.classList.contains('leaving') && performance.now() < toastHold) logBanner(bannerText, toastLevel, 'cut');
  toastHold = 0;
  if (!fade) {
    for (const w of waiting) logBanner(w.text, w.level, 'card');
    waiting.length = 0;
    freeAt = 0;
    clearTimeout(leaveTimer); leaveTimer = 0;
    toastEl.hidden = true;
    toastEl.classList.remove('leaving');
    return;
  }
  freeAt = performance.now() + TUNE.BANNER_FADE_MS + TUNE.BANNER_BREATHE_MS;
  if (waiting.length) toastTimer = setTimeout(nextToast, TUNE.BANNER_FADE_MS + TUNE.BANNER_BREATHE_MS);
  if (toastEl.hidden || toastEl.classList.contains('leaving')) return;
  toastEl.classList.add('leaving');
  leaveTimer = setTimeout(() => { leaveTimer = 0; toastEl.hidden = true; toastEl.classList.remove('leaving'); }, TUNE.BANNER_FADE_MS);
}
toastEl.addEventListener('animationend', e => { if (e.animationName === 'settle' || e.animationName === 'toast-fade-in') toastEl.classList.add('settled'); });

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
