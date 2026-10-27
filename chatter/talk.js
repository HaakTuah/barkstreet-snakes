// The chatter (see chatter/voices.js): its timings and rests, who may speak
// and when, the words, the bubbles over the board, and the log.

const SNAKE_GAP = 4500;  // ms of game time between lines from the same snake
const ANY_GAP = 1200;    // ms between any two lines
const BUBBLE_MS = 2600;  // how long a bubble stays up (real time)
const LAST_WORDS_MS = 2000; // (and a snake's last words, where it went out, when the log can't show them)
const LOG_SIZE = 50; // (the lines a round keeps: beside the board on a desktop you can scroll back through them; elsewhere the newest that fit show)
const COMPACT_CHARS = 32; // on small boards, longer lines go to the log only (while it's on screen)
// Mason's Life of Brian moments get an answer: [line, who answers, what they say,
// and the voices' own lines for it, where they have some].
// (Mason keeps a straight face; Ghost and Creeper aren't the giggling kind,
// and nobody laughs at their own joke. Mute laughs without a sound, and
// Copycat in Chinese.)
const GIGGLE_PROOF = ['mason', 'ghost', 'creeper'];
const REPLIES = {
  'Romanes eunt domus.': { by: s => s.personaKey === 'metagamer', lines: ['“Romani ite domum”, actually.'], after: 1300 },
  'Amicus meus est Biggus Dickus.': { by: s => !GIGGLE_PROOF.includes(s.personaKey), lines: ['Pfft…', '*snort*', 'Snrk. Sorry. Go on.'], own: 'giggle', after: 900,
    then: 'Et uxor: Incontinentia Buttocks.' }, // ...and Mason, straight-faced, carries on
  'Et uxor: Incontinentia Buttocks.': { by: s => !GIGGLE_PROOF.includes(s.personaKey), lines: ['BWAHAHA—', 'I can’t. I CAN’T.', '*wheeze*'], own: 'guffaw', after: 800 },
};

let chatBoardEl, logEl, bannerEl, chatGame;
let enabled = true, compact = false, logShown = true, listener = null;
let lastAny = -Infinity, lastSaid = {}, seen = {}, lastLine = null, pendingReply = null, saidAt = {};
let struck = false; // (lightning has struck in this storm: one remark is enough)
let pendingAnswer = null, answeredAt = -Infinity; // (an answer to Star's showing off, on its way; the last one)
const rolled = []; // food a choking or coughing snake knocked aside, oldest first: { x, y, beetle, by, at } (see windfall)
const digs = [];   // beetles digging in: { x, y, until, hunter } (see gotAway)
const knocked = []; // food the woodpecker knocked aside, oldest first: { x, y, beetle, near, at } (see served)
const LINE_REST = 45000; // a snake doesn't say the same line again within this much game time
const INTRUDER_REST = 25000; // nor call out intruders more often (heads skim in and out at a border)
// Some moments come often in a long round, so each snake remarks on them at most this often:
const UNDER_REST = 12000;     // the woodpecker pecking under it
const ROT_REST = 40000;       // food rotting by its head (beads rot all through the endgame)
const LAND_ROT_REST = 30000;  // food rotting in Sovereign's realm or Colonist's colonies
const DESPERATE_REST = 30000; // starving soon (it can come and go as it eats a little)
const FLASH_REST = 30000;     // its own plain flashes (everyone flashes, about four times a minute)
const NEAR_FOOD = 5;          // food that rots or burns this near its head (cells, and nearer than anyone's) was food it was after
const CHOKE_REST = 20000;     // choking on its own bead (it can come again as soon as the cough's over)
// Food a choking or coughing snake knocks aside lies in the open, for
// anyone: whoever else eats it within WINDFALL_MS thanks the cougher,
// cheekily, now and then (WINDFALL_CHANCE), and at most every WINDFALL_REST.
// (A beetle nudged aside scurries off, so one caught within BEETLE_ROAM
// cells of where it went counts.)
const WINDFALL_MS = 6000, WINDFALL_CHANCE = 0.5, WINDFALL_REST = 30000, BEETLE_ROAM = 4;
// A cornered beetle digs in where it is, and is gone under the bark a
// moment later unless someone catches it first. One that gets away was
// the snake's that cornered it (the nearest head as it started, within the
// engine's BEETLE_DIG_FEAR): it says so, at most every DUG_REST.
const DUG_REST = 30000;
// Food the woodpecker knocks aside as it strikes lands in the open, where
// the engine's rule puts it. Whoever eats it there within KNOCKED_MS, the
// snake that was after it grumbles at, at most every KNOCKED_REST: the
// nearest head to where it lay at the strike, the eater's aside, within
// KNOCKED_NEAR. (The bird aims more than PECK_CLEARANCE cells from every
// head, so a head within NEAR_FOOD of food in its mark is rare, and that
// one mostly ate it itself: whoever was after it is a little further
// off, and the nearest that didn't get it.) A knocked beetle scurries off
// from where it lands, as a nudged one does: caught within BEETLE_ROAM
// cells of there counts.
const KNOCKED_MS = 6000, KNOCKED_NEAR = 8, KNOCKED_REST = 40000;
// Star lives for its powers (it flashes whenever it's rested and jumps every
// hurdle), so it cheers them all: its flashes, jumps and golden dashes, and
// its flash back from its rest. Half the time, and all of them together at
// most this often (a golden dash or jump is rarer: always, if it can):
const SHOW_OFF_REST = 10000, SHOW_OFF_CHANCE = 0.5;
// Its flash back is cheered only once it's been back this long: it flashes
// the moment it can, as a rule (a tenth of a second later, mostly), and then
// it's the flash that's worth a word, not a flash it no longer has.
const READY_AFTER = 1000;
// ...and once in a while someone answers it, a moment later (Wildcard brags
// back, Mason in Latin): a round has a few, at most.
const ANSWER_CHANCE = 0.25, ANSWER_AFTER = 1100, ANSWER_REST = 40000;
// Mason's Life of Brian moments are told once per visit (a joke told every round isn't one).
const SET_PIECES = new Set(['Romanes eunt domus.', 'Amicus meus est Biggus Dickus.']);
const toldPieces = new Set();

const toldThisRound = new Set();
const chatBubbles = new Map(); // snake id -> { el, snake, until, at, w, h, side, x, y, ... }, oldest first
const headAt = { x: 0, y: 0 }, headMine = { x: 0, y: 0 };
const taken = []; // (this frame: the banner's box and the bubbles placed so far)

try { enabled = localStorage.getItem('snake-chatter') !== 'off'; } catch { /* storage unavailable */ }

const chatPick = list => list[Math.floor(Math.random() * list.length)];
const hasChinese = text => /[一-鿿]/.test(text);
// A line's words, in a bubble or the log. A stage direction (Mute's mimes,
// a giggle: "*waves silently*") is in italics, without its asterisks (a
// screen reader would say "star"), and in the log it reads on from the
// name: "Mute waves silently". Copycat's Chinese ones go in brackets, as
// Ghost's "（沉默）" does (Chinese isn't set in italics).
function setWords(el, text) {
  const mimed = /^\*(.+)\*$/.exec(text), zh = hasChinese(text);
  if (mimed && zh) el.textContent = `（${mimed[1]}）`;
  else if (mimed) el.append(Object.assign(document.createElement('em'), { textContent: mimed[1] }));
  else el.textContent = text;
  if (zh) el.lang = 'zh-Hans';
}

// The log sits on dark wood: a dark colour is lightened just enough for its
// name to read there (LOG_CONTRAST against LOG_WOOD, the log at its
// lightest: its rgba(63, 37, 16, 0.55) over the forest floor's lightest
// green under a shaft of light; where it sits it's darker, about 5.5:1),
// keeping its hue and saturation, so a name keeps its snake's colour.
// (Mixing it halfway to white turned the reds pink: Copycat's flag red,
// Sniper's, Colonist's and Wildcard's alike.)
const LOG_WOOD = [56, 50, 29], LOG_CONTRAST = 4.5;
const luminance = rgb => rgb.reduce((sum, v, i) => { v /= 255; return sum + [0.2126, 0.7152, 0.0722][i] * (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); }, 0);
const onWood = rgb => (luminance(rgb) + 0.05) / (luminance(LOG_WOOD) + 0.05);
function readable(hex) {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [n >> 16, (n >> 8) & 255, n & 255];
  if (onWood(rgb) >= LOG_CONTRAST) return hex;
  // (Its hue and saturation, in HSL; the least lightness that reads.)
  const [r, g, b] = rgb.map(v => v / 255), hi = Math.max(r, g, b), lo = Math.min(r, g, b), d = hi - lo;
  const h = !d ? 0 : hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const s = !d ? 0 : d / (1 - Math.abs(hi + lo - 1));
  const at = l => { const c = (1 - Math.abs(2 * l - 1)) * s, f = k => { const t = (k + h) % 6; return l + c / 2 - c * Math.max(0, Math.min(1, Math.min(t, 4 - t))); }; return [f(5), f(3), f(1)].map(v => Math.round(v * 255)); };
  let low = (hi + lo) / 2, high = 1;
  for (let i = 0; i < 12; i++) { const mid = (low + high) / 2; if (onWood(at(mid)) >= LOG_CONTRAST) high = mid; else low = mid; }
  return `rgb(${at(high).join(',')})`;
}

// Everyone by name: you're your Hall of Fame name (or "Green"), friends theirs.
const nameOf = s => s.name;

// Land, by the one rule the AI, the HUD and the borders use: cell x, y is a
// field's land when its centre is within the field's radius plus LAND_REACH.
const chatOnLand = (x, y, f) => Math.hypot(x - f.x, y - f.y) <= f.radius + window.TUNING.LAND_REACH;
// The fields a snake holds: Sovereign's realm, or Colonist's colonies (or none).
const landsOf = m => m.home ? [m.home] : m.colonies?.length ? m.colonies : null;
// Is cell x, y a hole (the woodpecker's)?
const holeAt = (x, y) => !!chatGame.holes?.has(y * window.TUNING.GRID + x);
// Colonist's colonies as the chatter last saw them, and now (n: which flag it is).
const NONE = [];
const sameColonies = (a, b) => !!b && a.length === b.length && a.every((c, i) => c.n === b[i].n && c.x === b[i].x && c.y === b[i].y);
// Do two fields share a cell of land? (Where they do, the map hatches it.)
function sharesLand(a, b) {
  const N = window.TUNING.GRID, r = Math.ceil(a.radius + window.TUNING.LAND_REACH);
  for (let y = Math.max(0, a.y - r); y <= Math.min(N - 1, a.y + r); y++) {
    for (let x = Math.max(0, a.x - r); x <= Math.min(N - 1, a.x + r); x++) if (chatOnLand(x, y, a) && chatOnLand(x, y, b)) return true;
  }
  return false;
}

function chatInit(opts) {
  ({ boardEl: chatBoardEl, logEl } = opts);
  // Is the log on screen, with room for a whole line? Where the chatter
  // has room for no row, or for a strip of one (game/screen.js fitChatter), a
  // line put in the log alone would be lost or cut. (Measured as the page
  // changes size or scrolls, and as the chatter's fit changes, never per
  // frame.)
  const placeLog = () => { const r = logEl.getBoundingClientRect(); logShown = r.height > 0 && r.top >= 0 && r.top + 20 <= innerHeight && !logEl.closest('[data-fit="strip"]'); };
  addEventListener('resize', placeLog, { passive: true });
  addEventListener('scroll', placeLog, { passive: true });
  new ResizeObserver(placeLog).observe(logEl.closest('main') || document.body);
  if (logEl.parentElement) new MutationObserver(placeLog).observe(logEl.parentElement, { attributes: true, attributeFilter: ['data-fit'] });
  // The banner over the board: bubbles keep out of its way. Its box is read
  // only after it changes (a new banner, moved to the foot, gone).
  bannerEl = chatBoardEl.querySelector('.toast');
  if (bannerEl) new MutationObserver(() => { bannerStale = true; }).observe(bannerEl, { attributes: true, attributeFilter: ['hidden', 'class', 'data-kind'], childList: true, characterData: true, subtree: true });
}

function reset(g) {
  chatGame = g;
  lastAny = -Infinity; lastSaid = {}; seen = {}; lastLine = null; pendingReply = null; saidAt = {}; struck = false;
  pendingAnswer = null; answeredAt = -Infinity;
  rolled.length = 0; digs.length = 0; knocked.length = 0;
  toldThisRound.clear();
  clearBubbles();
  logEl.textContent = '';
}

function clearBubbles() {
  for (const b of chatBubbles.values()) b.el.remove();
  chatBubbles.clear();
}

function setEnabled(on) {
  enabled = on;
  try { localStorage.setItem('snake-chatter', on ? 'on' : 'off'); } catch { /* storage unavailable */ }
  if (!on) clearBubbles();
}

const isEnabled = () => enabled;
const setCompact = v => { compact = v; chatBoardEl?.classList.toggle('compact-chat', v); };
// Online, the host passes every line on (onSpeak), and friends' screens
// replay it, so everyone sees the same chatter.
const onSpeak = fn => { listener = fn; };
function replay(s, text, reply = false) {
  if (!enabled || !s) return;
  lastSaid[s.id] = chatGame.time;
  lastAny = chatGame.time;
  bubble(s, text, reply);
  addLog(s, text);
}

// Have snake s say a line from one of its lists. urgent lines skip the global gap.
// Lines naming someone ({who}) are only used when there is someone to name;
// last words prefer them ("Et tu, Sniper?"). Returns whether it said one.
function chatSay(s, key, who, urgent = false) {
  if (!enabled || !s.persona) return;
  const find = v => key.includes('.') ? key.split('.').reduce((o, k) => o?.[k], v) : v?.[key];
  // (Capricious in a mood plays the part: the mood's own lines, where it has some.)
  const acting = s.personaKey === 'capricious' && s.memory.mood && !key.startsWith('mood') && find(VOICES[s.memory.mood])?.length;
  const voice = VOICES[acting ? s.memory.mood : s.personaKey];
  const lines = find(voice);
  if (!lines?.length) return;
  const naming = lines.filter(l => l.includes('{who}'));
  const plain = lines.filter(l => !l.includes('{who}'));
  const pool = !who ? plain : key === 'dies' && naming.length ? naming : lines;
  if (!pool.length) return;
  const now = chatGame.time;
  if (now - (lastSaid[s.id] ?? -Infinity) < SNAKE_GAP) return;
  if (!urgent && now - lastAny < ANY_GAP) return;
  const said = saidAt[s.id] ||= new Map();
  const told = l => SET_PIECES.has(l) ? toldPieces.has(l) : PUNCHLINES.has(l) ? toldThisRound.has(l) : chatGame.time - (said.get(l) ?? -Infinity) < LINE_REST;
  const fresh = pool.filter(l => !told(l));
  if (!fresh.length) return false; // (nothing new to say: quiet beats a repeat)
  const template = chatPick(fresh);
  said.set(template, chatGame.time);
  if (SET_PIECES.has(template)) toldPieces.add(template);
  if (PUNCHLINES.has(template)) toldThisRound.add(template);
  const label = (who && s.memory.labels?.[who.id]) || 'unclear';
  speak(s, fill(template, who ? nameOf(who) : '', label), { template, who, label });
  return true;
}

// (Replacers are functions, so a name like "$'" is just a name.)
const fill = (template, who, label) => template.replaceAll('{who}', () => who).replaceAll('{label}', () => label);

function speak(s, text, source = null) {
  lastSaid[s.id] = chatGame.time;
  lastAny = chatGame.time;
  lastLine = { speaker: s, text, ...source };
  bubble(s, text, !!source?.reply);
  addLog(s, text);
  listener?.(s, text, !!source?.reply);
  const reply = source?.template && REPLIES[source.template];
  if (reply) pendingReply = { at: chatGame.time + reply.after, reply, teller: s };
}

// A line's bubble. On small boards a long line goes to the log alone, if
// the log's on screen to show it (a reply always gets its bubble: it's the
// joke). A snake that's just gone out says its last words where it went
// out, briefly, when the log can't show them.
function bubble(s, text, reply) {
  if (s.alive) { if (!(compact && logShown && text.length > COMPACT_CHARS && !reply)) showBubble(s, text); }
  else if (!logShown && s.body?.length) showBubble(s, text, s.body[0]);
}

function showBubble(s, text, at = null) {
  chatBubbles.get(s.id)?.el.remove();
  chatBubbles.delete(s.id); // (so the newest comes last: it's the one that makes way)
  const el = document.createElement('div');
  el.className = 'bubble';
  el.setAttribute('aria-hidden', 'true'); // (screen readers get the log instead)
  const words = document.createElement('span'); // (the bubble you see: it pops in, while its box is moved about)
  setWords(words, text);
  el.append(words);
  el.style.setProperty('--edge', s.persona?.ink || s.color);
  chatBoardEl.appendChild(el);
  chatBubbles.set(s.id, { el, snake: s, until: performance.now() + (at ? LAST_WORDS_MS : BUBBLE_MS), at: at && { x: at.x, y: at.y }, w: 0, h: 0, box: { x: 0, y: 0, w: 0, h: 0 }, side: null, shown: null, want: null, wantSince: 0, ox: 0, oy: 0, x: NaN, y: NaN, tail: NaN, near: false });
}

// Called every frame: bubbles follow the gliding heads, stay inside the
// board, and expire on time even when the round is over or paused.
// A bubble is never in the way of its snake's path: above the head (below
// it near the top) for a snake going sideways, beside it (where there's
// room) for one going up or down. And it doesn't jump about as the snake
// turns: it moves to another side only once that side has been the right
// one for a moment (or its own has run out of room), and then glides there.
// Nor does it cover the banner or an older bubble: a side that would has no
// room, and with no side clear, it's nudged out of the way (gliding too).
// keepClear: your snake, if you're playing: a bubble near your head fades.
const SIDE_DELAY = 450, GLIDE_MS = 110, CLEAR = 4; // (CLEAR: px between a bubble and what it keeps out of)
let lastLayout = 0;
function layout(alpha, boardPx, keepClear = null) {
  if (!chatBubbles.size || !boardPx) { lastLayout = 0; return; }
  const now = performance.now();
  const glide = lastLayout ? 1 - Math.exp(-Math.min(64, now - lastLayout) / GLIDE_MS) : 1;
  lastLayout = now;
  const cellPx = boardPx / window.TUNING.GRID, gap = cellPx * 0.75 + 6; // (6: room for the tail)
  if (bannerStale || bannerPx !== boardPx) readBanner(boardPx);
  taken.length = 0;
  if (banner) taken.push(banner);
  for (const [id, b] of chatBubbles) {
    if (now > b.until || (!b.snake.alive && !b.at)) { b.el.remove(); chatBubbles.delete(id); continue; }
    if (b.at) { headAt.x = (b.at.x + 0.5) * cellPx; headAt.y = (b.at.y + 0.5) * cellPx; } // (last words: where it went out)
    else window.SnakeRender.headPx(b.snake, alpha, boardPx, headAt);
    if (!b.w) { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; } // (measured once, as it first shows)
    const w = b.w, h = b.h;
    const inX = v => Math.min(boardPx - w - 4, Math.max(4, v)), inY = v => Math.min(boardPx - h - 4, Math.max(4, v));
    // Where it sits on a side, relative to the head (its top-left corner),
    // and where that is on the board; whether that side fits on the board,
    // whether it's clear there too, or can be nudged clear (see nudge).
    const offX = side => side === 'left' ? -gap - w : side === 'right' ? gap : -w / 2;
    const offY = side => side === 'above' ? -gap - h : side === 'below' ? gap : -h / 2;
    const spotX = side => inX(headAt.x + offX(side)), spotY = side => inY(headAt.y + offY(side));
    const fits = side => side === 'above' ? headAt.y - gap - h >= 0 : side === 'below' ? headAt.y + gap + h <= boardPx
      : side === 'left' ? headAt.x - gap - w >= 0 : headAt.x + gap + w <= boardPx;
    const clear = side => fits(side) && free(spotX(side), spotY(side), w, h);
    const movable = side => fits(side) && nudge(side, spotX(side), spotY(side), w, h, boardPx);
    const choose = room => b.snake.dir.y !== 0
      ? (b.side === 'left' || b.side === 'right') && room(b.side) ? b.side : room('right') && (headAt.x < boardPx / 2 || !room('left')) ? 'right' : 'left'
      : b.side === 'below' && headAt.y < cellPx * 4 ? 'below' : room('above') ? 'above' : 'below';
    let want = choose(clear);
    if (!clear(want)) want = choose(movable); // (no side's clear as it is: one it can be nudged clear on,
    if (!movable(want)) want = choose(fits); //  or failing that, the side it'd have alone)
    if (!b.side) b.side = want;
    else if (want !== b.side) {
      if (b.want !== want) { b.want = want; b.wantSince = now; }
      if (now - b.wantSince >= SIDE_DELAY || !fits(b.side) || (!movable(b.side) && movable(want))) { b.side = want; b.want = null; }
    } else b.want = null;
    // Where it goes, relative to the head, eased toward.
    let tx = offX(b.side), ty = offY(b.side);
    if (taken.length && nudge(b.side, spotX(b.side), spotY(b.side), w, h, boardPx) && (nudged.x || nudged.y)) {
      tx = spotX(b.side) + nudged.x - headAt.x; ty = spotY(b.side) + nudged.y - headAt.y;
    }
    if (b.side !== b.shown) {
      if (!b.shown) { b.ox = tx; b.oy = ty; }
      b.el.dataset.side = b.side;
      b.shown = b.side;
    }
    b.ox += (tx - b.ox) * glide;
    b.oy += (ty - b.oy) * glide;
    const x = Math.round(inX(headAt.x + b.ox));
    const y = Math.round(inY(headAt.y + b.oy));
    // (where it's going, not where it's got to: newer bubbles keep clear of that)
    b.box.x = inX(headAt.x + tx); b.box.y = inY(headAt.y + ty); b.box.w = w; b.box.h = h;
    taken.push(b.box);
    let near = false;
    if (keepClear?.alive) {
      const mine = window.SnakeRender.headPx(keepClear, alpha, boardPx, headMine);
      near = Math.abs(mine.x - x - w / 2) < w / 2 + cellPx * 1.5 && Math.abs(mine.y - y - h / 2) < h / 2 + cellPx * 1.5;
    }
    if (near !== b.near) { b.el.classList.toggle('near', near); b.near = near; }
    if (x === b.x && y === b.y) continue;
    // The tail points at the head, even when the bubble is pushed along at an edge.
    const across = b.side === 'above' || b.side === 'below';
    // (in steps of 5%: every change restyles the bubble)
    const tail = 5 * Math.round(Math.min(85, Math.max(15, across ? (headAt.x - x) / w * 100 : (headAt.y - y) / h * 100)) / 5);
    if (tail !== b.tail) { b.el.style.setProperty('--tail', `${tail}%`); b.tail = tail; }
    b.el.style.transform = `translate(${x}px, ${y}px)`;
    b.x = x; b.y = y;
  }
}

// Is this box clear of the banner and the bubbles placed so far?
function free(x, y, w, h) {
  for (const r of taken) if (x < r.x + r.w + CLEAR && r.x < x + w + CLEAR && y < r.y + r.h + CLEAR && r.y < y + h + CLEAR) return false;
  return true;
}

// A bubble with no clear side moves out of the way by as little as it can:
// along its side (its tail still on the head, headAt) or further off, never
// back over its snake. Whether it's clear, there or so moved; nudged: the
// shift (none, if it was clear already or nothing helps).
const nudged = { x: 0, y: 0 };
function nudge(side, x, y, w, h, boardPx) {
  nudged.x = nudged.y = 0;
  if (free(x, y, w, h)) return true;
  const across = side === 'above' || side === 'below';
  let best = Infinity;
  for (const r of taken) {
    if (!(x < r.x + r.w + CLEAR && r.x < x + w + CLEAR && y < r.y + r.h + CLEAR && r.y < y + h + CLEAR)) continue;
    for (let k = 0; k < 4; k++) { // (past its right, left, bottom or top)
      const dx = k === 0 ? r.x + r.w + CLEAR - x : k === 1 ? r.x - CLEAR - w - x : 0;
      const dy = k === 2 ? r.y + r.h + CLEAR - y : k === 3 ? r.y - CLEAR - h - y : 0;
      const d = Math.abs(dx) + Math.abs(dy);
      if (d >= best || x + dx < 4 || x + dx > boardPx - w - 4 || y + dy < 4 || y + dy > boardPx - h - 4) continue;
      const along = across ? dx : dy, off = across ? dy : dx;
      const toward = side === 'above' || side === 'left' ? off > 0 : off < 0;
      const head = across ? headAt.x - x - dx : headAt.y - y - dy, span = across ? w : h;
      if (toward || (along && (head < span * 0.15 || head > span * 0.85)) || !free(x + dx, y + dy, w, h)) continue;
      best = d; nudged.x = dx; nudged.y = dy;
    }
  }
  return best < Infinity;
}

// The banner's box on the board (it's centred by a transform, which the
// offsets leave out). While it's faded for a head under it, the board
// comes first and bubbles may cross it; above the board (a phone held
// upright: game/banners.js placeToast), it's in nobody's way.
let banner = null, bannerStale = true, bannerPx = 0;
function readBanner(boardPx) {
  bannerStale = false;
  bannerPx = boardPx;
  if (!bannerEl || bannerEl.hidden || bannerEl.classList.contains('under') || bannerEl.classList.contains('above')) { banner = null; return; }
  const w = bannerEl.offsetWidth;
  banner = { x: bannerEl.offsetLeft - w / 2, y: bannerEl.offsetTop, w, h: bannerEl.offsetHeight };
}
