// The game controller (see game/core.js): the page's size and motion, the
// dev overlay, and the start: the last file, it sets the game going.

// ------------------------------------------------- size and motion

Render.init({ canvas: canvasEl, personas: CAST, birdLayer: $('bird-layer') });
// Where the board is on the page (the woodpecker perches beside it, on its own layer).
// ...and how far the free page runs round it before the tags, the speed
// buttons, the chatter or the header (no perching on those), inside the
// screen's safe area (not under a notch); how tall the ledge under it is
// (a phone held upright: the bird perches there, at full size, standing
// over the row under the board and the chatter, which are right under the
// board; its layer takes no taps, so they pass through it to the buttons);
// and where the moss and the corner leaves hang off its bottom edge into
// the ledge (the bird stands clear of them: across, CSS px, a little wider
// for the leaves' sway).
const furniture = ['header', '.scoreboard', '.foot', '.chatter'].map(q => document.querySelector(q)).filter(Boolean);
const hanging = [...document.querySelectorAll('.frame .moss.bottom, .frame .leaves.bl, .frame .leaves.br')];
const ledgeEl = $('perch-ledge'), rootStyle = getComputedStyle(document.documentElement);
const inset = name => parseFloat(rootStyle.getPropertyValue(name)) || 0;
// What's above the frame, measured (the page's top, the header and the
// tags, however many rows they wrap to in whatever font): the board is as
// big as leaves room for it, and on a phone held upright, at a height in
// between, leaves the bird room beside it or under it (style/,
// --above). Set only when it changes: the board's own change, which moves
// nothing above it on a phone, doesn't come round again. Over the board
// (a tablet, a near-square window) the page is as wide as the board, and
// the header's and the tags' rows follow its width: a smaller board can
// take them onto more rows. So it's worked out from the page's own guess
// (one row of each, the least it could need) up, until it holds, which is
// the biggest board that does, whatever the page was before (from where
// it was, a window made taller could keep a smaller board's extra row).
// Measured now, before the page is first drawn; as the window changes size
// and as the font arrives, before the board is placed; and if the header
// changes otherwise (a longer score), a moment later: set from inside a
// resize observer's call, the board's change would come round again in
// the same frame, which the browser reports as an error.
const frameEl = document.querySelector('.frame'), footEl = document.querySelector('.foot'), titleEl = document.querySelector('h1');
const frameTop = () => Math.round((frameEl.getBoundingClientRect().top + scrollY) * 10) / 10;
let above = -1, aboveSoon = 0;
const measureAbove = () => {
  aboveSoon = 0;
  mainEl.style.removeProperty('--above');
  above = -1;
  for (let i = 0; i < 4; i++) { // (each pass only adds rows: it stops at the first that holds)
    const top = frameTop();
    if (Math.abs(top - above) <= 0.25) break;
    above = top;
    mainEl.style.setProperty('--above', `${top}px`);
  }
};
measureAbove();
window.addEventListener('resize', measureAbove, { passive: true });
document.fonts?.addEventListener?.('loadingdone', measureAbove);
const placeBoard = () => {
  if (!aboveSoon && Math.abs(frameTop() - above) > 0.25) aboveSoon = setTimeout(measureAbove);
  const b = canvasEl.getBoundingClientRect();
  const free = { left: inset('--safe-l'), top: inset('--safe-t'), right: innerWidth - inset('--safe-r'), bottom: innerHeight - inset('--safe-b'), ledge: 0, upright: !!ledgeEl?.offsetParent, hang: [], rims: [], words: [] }; // (upright: a phone held upright, the ledge laid out, 0 px tall: the row and the chatter are right under the board)
  // (held upright, where the row under the board is closer than the moss
  // and the leaves hang off the frame's bottom, 12 px, they're left off:
  // style/ .snug)
  frameEl.classList.toggle('snug', free.upright && footEl.getBoundingClientRect().top - frameEl.getBoundingClientRect().bottom < 12);
  for (const el of furniture) {
    if (free.upright && el.matches('.foot, .chatter')) continue; // (held upright, the bird stands over them)
    const f = el.getBoundingClientRect();
    if (!f.width || !f.height) continue; // (hidden)
    const across = f.left < b.right && f.right > b.left, along = f.top < b.bottom && f.bottom > b.top;
    if (across && f.bottom <= b.top + 1) free.top = Math.max(free.top, f.bottom);
    else if (across && f.top >= b.bottom - 1) free.bottom = Math.min(free.bottom, f.top);
    else if (along && f.right <= b.left + 1) free.left = Math.max(free.left, f.right);
    else if (along && f.left >= b.right - 1) free.right = Math.min(free.right, f.left);
  }
  if (free.upright) free.ledge = Math.max(0, free.bottom - b.bottom); // (the ledge the bird stands on: from the board down to the screen's foot)
  if (free.ledge) {
    for (const el of hanging) {
      const f = el.getBoundingClientRect();
      if (f.width && f.bottom > b.bottom) free.hang.push([f.left - 2, f.right + 2]);
    }
    // (and the rims it may cling to there: the sides of the buttons in the
    // row under the board, the speed buttons and the chatter's switch,
    // each with the way the bird faces to grip it, toward the button)
    for (const btn of footEl.querySelectorAll('button')) {
      const f = btn.getBoundingClientRect();
      if (f.width && f.height) free.rims.push({ x: f.left, top: f.top, bottom: f.bottom, face: 1 }, { x: f.right, top: f.top, bottom: f.bottom, face: -1 });
    }
    // (and the words there it perches clear of where it can, 2k+: the
    // speed buttons' and the switches' labels, the speed's and the
    // chatter's captions; the chatter's lines come and go too often for
    // that, it moving each time)
    for (const el of document.querySelectorAll('.foot .speed > span, .foot button, #chatter-label')) {
      const rg = document.createRange(); rg.selectNodeContents(el);
      const f = rg.getBoundingClientRect();
      if (f.width && f.height) free.words.push({ left: f.left, right: f.right, top: f.top, bottom: f.bottom });
    }
  }
  // (A banner, held upright: above the board, over the header's title row,
  // from just inside the screen's safe top down to just over the header's
  // buttons, the pause button first among them, across the header and 4 px
  // past it each side; level with the title. In the header's own px: see
  // placeToast. Where that row has no room for a line, on the board.)
  aboveBand = null;
  if (free.upright) {
    const hd = headerEl.getBoundingClientRect(), title = titleEl.getBoundingClientRect();
    let row = Infinity;
    for (const btn of headerEl.querySelectorAll('button')) { const r = btn.getBoundingClientRect(); if (r.height) row = Math.min(row, r.top); }
    const top = Math.max(0, inset('--safe-t')) + 2 - hd.top, bottom = row - 3 - hd.top;
    if (bottom - top >= 22) aboveBand = { top, bottom, mid: (title.top + title.bottom) / 2 - hd.top, width: hd.width + 8 };
  }
  if (!toastEl.hidden) { placeToast(); toastW = toastEl.offsetWidth; toastH = toastEl.offsetHeight; }
  Render.setBoardRect(b.left, b.top, b.width, free);
};
window.addEventListener('resize', placeBoard, { passive: true });
window.addEventListener('scroll', placeBoard, { passive: true });
// (the page around the board changed: it may have moved, or what's under
// it. The page is one screen tall whatever it holds, so its own size says
// little: the header, the tags, the ledge, the row under the board and the
// chatter are watched too, a change in any of them moving the board or
// what's round it)
const placer = new ResizeObserver(placeBoard);
for (const el of [mainEl, ledgeEl, $('speed'), ...furniture]) if (el) placer.observe(el); // (the speed buttons too: as they come and go, the rims under the board change)
// The chatter takes what's left of the screen: its box is the column's
// rest (style/), whatever it holds, so the page is one screen tall in
// every state. What shows in it is worked out here, as lines come and go
// and the box changes (data-fit): the caption and as many whole lines as
// fit, newest first (full), where the box has room for the caption and two
// rows of words; with less, the lines alone (strip), and where not even
// the newest fits whole, it cut to the rows that do; with no room for a
// row, no panel at all (none: the switch is still in the row above, and
// the rivals' long lines go to their bubbles on the board, as they do in
// a strip: chatter/talk.js). A line is never sliced through, and an older line
// is shown whole or not at all. Decided from the box, never from the
// panel: the box's size doesn't depend on what's in it, so nothing here
// comes round again, and nothing comes and goes as lines of one row or
// two arrive.
// Held upright on a phone, the chatter opens to the rest of the screen,
// as many whole lines as fit, down to its foot (as the desktop's fills its
// column), at the start and as the screen turns or changes size; only
// where fewer than three rows of words would fit is it folded: a strip of
// one row, the newest line cut to it. A tap folds or opens it
// (aria-expanded; game/input.js lets the tap through mid-round, a swipe
// from it still steering), and that choice is kept, from round to round
// and visit to visit (snake-chatter-open). Folded, the rivals' long lines
// go to their bubbles on the board, as in any strip.
const chatterEl = document.querySelector('.chatter'), chatterHead = chatterEl.querySelector('.chatter-head');
const CHAT_OPEN_KEY = 'snake-chatter-open', CHAT_OPEN_ROWS = 3;
let chatFit = '', chatOpen = false, chatChoice = null; // (chatChoice: the player's own choice, open or folded, or null: by the room)
try { const v = localStorage.getItem(CHAT_OPEN_KEY); chatChoice = v === 'open' ? true : v === 'folded' ? false : null; } catch { /* storage unavailable */ }
const chatFolds = () => !!ledgeEl?.offsetParent;
const foldChatter = () => {
  if (!chatFolds() || chatlogEl.hidden) return;
  chatOpen = chatChoice = !chatOpen;
  try { localStorage.setItem(CHAT_OPEN_KEY, chatChoice ? 'open' : 'folded'); } catch { /* storage unavailable */ }
  fitColumn();
};
chatterEl.addEventListener('click', e => { if (e.target !== chatterEl) foldChatter(); }); // (on the panel, never its box's empty rest)
chatterEl.addEventListener('keydown', e => { if (e.target === chatterEl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); foldChatter(); } });
// Beside the board on a desktop the log scrolls (style/: newest at the
// bottom), and its older lines fade at its top: a line's opacity runs from
// nothing at the log's top edge to whole a fade's height under it (two
// rows, a third of the log at most), so a line cut by the edge never shows
// sliced, only the whole ones under it; the newest never fades. Scrolled back to the oldest, with
// nothing above, nothing fades. Set as lines come, the box changes and
// the log scrolls; elsewhere every line is whole.
const CHAT_SHOWN = 5;
const chatScrolls = () => !chatlogEl.hidden && getComputedStyle(chatlogEl).overflowY === 'auto';
const fadeChatter = () => {
  const lines = chatlogEl.children;
  if (!chatScrolls() || chatFit === 'none') { for (const li of lines) li.style.opacity = ''; return; }
  const edge = chatlogEl.getBoundingClientRect().top + chatlogEl.clientTop, oldest = lines[lines.length - 1];
  const above = oldest ? edge - oldest.getBoundingClientRect().top + parseFloat(getComputedStyle(chatlogEl).paddingTop) : 0; // (how far the log's content runs above its edge)
  const fade = Math.min(2 * (parseFloat(getComputedStyle(chatlogEl).lineHeight) || 17), chatlogEl.clientHeight / 3, Math.max(0, above));
  const tops = [...lines].map(li => li.getBoundingClientRect().top - edge); // (all read, then all set: one layout)
  tops.forEach((d, i) => { lines[i].style.opacity = !i || fade < 1 || d >= fade ? '' : String(Math.max(0, Math.round(d / fade * 100) / 100)); }); // (the newest never fades)
};
chatlogEl.addEventListener('scroll', fadeChatter, { passive: true });
const fitChatter = () => {
  const lines = [...chatlogEl.children];
  for (const li of lines) li.classList.remove('gone', 'cut');
  let fit = 'off';
  const folds = chatFolds() && !chatlogEl.hidden;
  if (folds && chatChoice === null) { // (by the room: open, its caption shown, if three lines of a row each fit under it, with their padding)
    const box = chatterEl.getBoundingClientRect(), ls = getComputedStyle(chatlogEl), row = parseFloat(ls.lineHeight) || 17;
    chatterEl.classList.remove('folded'); chatterEl.dataset.fit = 'full';
    const pad = parseFloat(ls.paddingTop) + parseFloat(ls.paddingBottom) + parseFloat(ls.borderBottomWidth);
    chatOpen = box.height > 0 && chatterHead.getBoundingClientRect().bottom + pad + CHAT_OPEN_ROWS * (row + 4) <= Math.min(box.bottom, innerHeight) + 0.5;
  } else if (folds) chatOpen = chatChoice;
  const folded = folds && !chatOpen;
  if (folds) { chatterEl.setAttribute('aria-expanded', String(!folded)); chatterEl.setAttribute('role', 'button'); chatterEl.tabIndex = 0; }
  else { chatterEl.removeAttribute('aria-expanded'); chatterEl.removeAttribute('role'); chatterEl.removeAttribute('tabindex'); }
  chatterEl.classList.toggle('folded', folded);
  if (!chatlogEl.hidden) {
    const box = chatterEl.getBoundingClientRect();
    let end = Math.min(box.bottom, innerHeight) + 0.5;
    chatterEl.dataset.fit = 'full';
    const ls = getComputedStyle(chatlogEl), row = parseFloat(ls.lineHeight) || 17, li = 4; // (a row of words, and a line's own padding)
    const pad = parseFloat(ls.paddingTop) + parseFloat(ls.paddingBottom) + parseFloat(ls.borderBottomWidth);
    fit = box.height && !folded && chatterHead.getBoundingClientRect().bottom + pad + 2 * (row + li) <= end ? 'full' : 'strip';
    chatterEl.dataset.fit = fit;
    if (folded) end = Math.min(end, chatlogEl.getBoundingClientRect().top + pad + parseFloat(ls.borderTopWidth) + row + 0.5); // (one row)
    const fits = () => chatlogEl.getBoundingClientRect().bottom <= end;
    let n = lines.length;
    if (chatScrolls()) { // (beside the board on a desktop: every line, the log scrolling, or none where not a row of it shows)
      if (chatlogEl.clientHeight + 0.5 < Math.min(chatlogEl.scrollHeight, parseFloat(ls.paddingTop) + parseFloat(ls.paddingBottom) + row)) fit = 'none';
      n = 0;
    } else for (; n > CHAT_SHOWN; ) lines[--n].classList.add('gone'); // (elsewhere the newest 5 at most, as ever: the log keeps more for the scroll)
    while (n > 1 && !fits()) lines[--n].classList.add('gone');
    if (n && !fits()) { // (the newest, as many of its rows as fit: from its words' top, less its own padding under them and the log's)
      const ns = getComputedStyle(lines[0]), top = lines[0].getBoundingClientRect().top + parseFloat(ns.paddingTop);
      const rows = Math.floor((end - 0.5 - top - parseFloat(ns.paddingBottom) - parseFloat(ls.paddingBottom) - parseFloat(ls.borderBottomWidth)) / row);
      if (rows >= 1) { lines[0].style.setProperty('--rows', rows); lines[0].classList.add('cut'); }
    }
    if (!box.height || !fits()) fit = 'none';
  }
  if (fit === 'none' || fit === 'off') for (const li of lines) li.classList.remove('gone', 'cut');
  chatterEl.dataset.fit = chatFit = fit;
  fadeChatter();
};
new ResizeObserver(() => fitChatter()).observe(chatterEl);
new MutationObserver(() => fitChatter()).observe(chatlogEl, { childList: true });
document.fonts?.ready.then(fitChatter);
// Watching, the speed buttons take a row of the row under the board (in
// the column beside the board, and on a phone on its side); where, with
// them, the chatter would have no room for a row of words (a phone on its
// side less a notch's home bar, 780×320 in Safari), the help, which only
// says what they do, gives the chatter its room; where a row fits beside
// it, it stays. (Held upright on a phone they take the help's place:
// style/.) And in any state, the help gives way where it doesn't fit
// the row: an item running past its box (the speed buttons and the switch
// squeezing it, watching on a narrow touch screen), or its lines pushing
// the row past the page's bottom (a narrow window with a mouse, the keys'
// help on four to six lines), where the board keeps its size (the owner's
// call: the board never smaller than before, the help and the chatter
// give way); the start card, the nap's and How to play have the keys, and
// on a touch screen the first Go says how to jump and flash. Decided with
// the help shown, as the window changes, the font arrives, the help's
// words change, the speed buttons come and go and the chatter's switched;
// never from inside a resize observer's call (the column's change would
// come round again).
const fitColumn = () => {
  mainEl.classList.remove('help-yields');
  fitChatter();
  const h = helpEl.getClientRects().length && helpEl.getBoundingClientRect();
  if (h && (helpEl.scrollWidth > helpEl.clientWidth + 1 || (h.height > parseFloat(getComputedStyle(footEl).minHeight) + 0.5 && footEl.getBoundingClientRect().bottom + scrollY > innerHeight + 0.5))) { // (squeezed, or taller than the row and taking it off the screen)
    mainEl.classList.add('help-yields');
    fitChatter();
    return;
  }
  if (speedEl.hidden || chatlogEl.hidden || chatFit !== 'none') return;
  mainEl.classList.add('help-yields');
  fitChatter();
};
window.addEventListener('resize', fitColumn, { passive: true });
document.fonts?.addEventListener?.('loadingdone', fitColumn);
Chatter.init({ boardEl, logEl: chatlogEl });

const sizer = new ResizeObserver(entries => {
  const e = entries[0];
  const w = e.contentRect.width;
  if (!w) return;
  boardPx = w;
  Render.resize(w, e.devicePixelContentBoxSize?.[0]?.inlineSize);
  placeBoard();
  Chatter.setCompact(w < 420);
  dirty = true;
});
// The device-pixel box also reports browser zoom; older browsers get the CSS box.
try { sizer.observe(canvasEl, { box: 'device-pixel-content-box' }); } catch { sizer.observe(canvasEl); }
// (Browsers without the device-pixel box don't report a density change on
// its own, say moving to another monitor, so listen for that too.)
(function watchDensity() {
  const mq = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  mq.addEventListener?.('change', () => { if (boardPx) { Render.resize(boardPx); dirty = true; } watchDensity(); }, { once: true });
})();

const applyMotion = () => Render.setReducedMotion(reducedMQ.matches);
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
      el.textContent = `frame ${(sum / n).toFixed(2)} ms avg · ${worst.toFixed(2)} worst\ntick  ${(tsum / n).toFixed(2)} ms avg · ${tworst.toFixed(2)} worst\nparticles ${Render.particles}`;
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
function warmUpGame() {
  if (state !== 'ready' || !theGame) return;
  for (const s of theGame.snakes) if (s.persona) SnakeAI.decide(Engine.aiView(theGame, s), s.persona, {});
}

// The start card's rivals, for a round of the other kind from it (Watch AIs
// from a card set up with you in it): the same ones, with a seat more dealt
// (an AI-only round has one more).
function lineUp(aiOnly) {
  if (!readyPersonas) return null;
  const want = TUNE.OPPONENTS + (aiOnly ? 1 : 0), keys = readyPersonas.filter(k => SnakeAI.POOL.includes(k)).slice(0, want);
  return keys.concat(Records.deal(SnakeAI.POOL, want - keys.length, keys));
}
// The start card shows this round's rivals, each seat a button to choose
// who sits there (openPicker). personas: by key (a seat just chosen, or
// SnakeDebug.setup's), else dealt; chosen: whether any were chosen. They're
// kept for Watch AIs from this card: see lineUp.
let readyPersonas = null;
function ready(personas, chosen = false) {
  startBtn.disabled = false; // (a room that never opened left it disabled)
  newGame({ personas, chosen });
  readyPersonas = theGame.snakes.filter(s => s.persona).map(s => s.personaKey);
  state = 'ready';
  buildOpponents(); // (now with its seats to choose)
  showCard({ title: `Ready, ${localName()}?`, text: FLAVOR.intro, primary: 'Play', secondary: 'Watch rivals', opponents: true, friends: true, how: 'How to play' });
  setTimeout(warmUpGame, 400);
}

// The controls under the board (online there's no napping or starting over).
// The help under the board, for what you can do now (written only when it changes).
function updateHelp() {
  const watching = !online && (state === 'running' || state === 'countdown' || state === 'paused') && !playerAlive();
  const text = online ? (touchFirst ? FLAVOR.hintOnlineTouch : FLAVOR.hintOnline) : watching ? (touchFirst ? FLAVOR.hintWatchTouch : FLAVOR.hintWatch) : (touchFirst ? FLAVOR.hintTouch : FLAVOR.hintKeys);
  if (text !== helpText) { helpText = text; setHint(helpEl, text); }
}

// Hints wrap only between items ("E, Shift or right-click flashes" never splits across lines).
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
    game: () => theGame,
    state: () => state,
    online: () => online && { role: online.role, seat: online.seat, code: online.code, players: online.players, rtt: hosting() ? online.room.rtt() : null },
    setup: ready,
    flavor: () => FLAVOR, // (the narrator's words: input-test holds the lessons to 60 characters)
    banners: () => bannerLog, // (every banner, and what became of it: shown, queued, stale, skipped, dropped, card)
    firstOut: dying => firstOut(dying), // (the first out's words, as the round would put them: the tests' long names)
    banner: (text, kind = '', level = 'round', opts = {}) => { hideToast(); toast(text, 2800, kind, level, opts); }, // (one put up by hand, at once, as the round would: the tests' phones)
    hear: events => { theGame.events = events; sounds([], playerAlive()); }, // (what the round plays for these events: the tests' chomps)
    step: Engine.step,
    createGame: Engine.createGame,
    perf: () => perf.stats(),
    frames(count, ms = 1000 / 60) {
      fake = Math.max(fake, lastFrame); // real frames may have run ahead meanwhile
      for (let j = 0; j < count; j++) { fake += ms; onFrame(fake); }
      return state;
    },
    draw: () => Render.frame(drawAlpha, boardClock),
    pinQuality(q) { governor.pinned = true; Render.setQuality(q); dirty = true; }, // (benchmarks: the governor stays out of it)
  };
}
