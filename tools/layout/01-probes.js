// Before the page's own scripts: a switch for its animation loop (the board
// held still for the woodpecker's portrait); a stand-in wake lock that
// records what's asked of it (?nowake: none at all, as in an older browser);
// a tab that can be hidden and shown (__setHidden); ?nofs: a browser without
// full screen for a page, as on an iPhone; and the round's end on demand
// (__kill: snakes that go out on the next tick, by seat); and the page's
// error events, which aren't exceptions (__errs: a resize observer's loop,
// say, when one's call changes what it observes).
const PRE = `(() => {
  window.__errs = [];
  addEventListener('error', e => window.__errs.push(e.message || String(e)));
  const raw = window.requestAnimationFrame.bind(window);
  window.__autoRaf = true;
  window.requestAnimationFrame = cb => raw(function held(ts) { if (window.__autoRaf) cb(ts); else raw(held); }); // (held, not dropped: the loop goes on once it's let go)
  const q = new URLSearchParams(location.search);
  if (q.has('nofs')) Object.defineProperty(Document.prototype, 'fullscreenEnabled', { configurable: true, get: () => false });
  const W = window.__wake = { log: [], held: null, refuse: false };
  if (q.has('nowake')) Object.defineProperty(Navigator.prototype, 'wakeLock', { configurable: true, get: () => undefined });
  else Object.defineProperty(Navigator.prototype, 'wakeLock', { configurable: true, get: () => ({
    request(type) {
      W.log.push('request');
      if (W.refuse) return Promise.reject(new DOMException('battery saver', 'NotAllowedError'));
      const s = new EventTarget();
      s.type = type; s.released = false;
      s.release = () => { if (!s.released) { s.released = true; if (W.held === s) W.held = null; W.log.push('release'); s.dispatchEvent(new Event('release')); } return Promise.resolve(); };
      W.held = s;
      return Promise.resolve(s);
    },
  }) });
  window.__lose = () => { const s = W.held; if (!s) return; s.released = true; W.held = null; W.log.push('lost'); s.dispatchEvent(new Event('release')); }; // (the browser letting go)
  let hidden = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
  window.__setHidden = h => { hidden = h; if (h) __lose(); document.dispatchEvent(new Event('visibilitychange')); };
  window.__kill = [];
  addEventListener('DOMContentLoaded', () => {
    const E = window.SnakeEngine, step = E.step;
    E.step = g => {
      const dying = step(g);
      for (const seat of __kill.splice(0)) {
        const s = g.snakes[seat];
        if (!s || !s.alive) continue;
        Object.assign(s, { alive: false, cause: 'hit the edge', killer: 'wall', killerId: null, fatal: 'wall' });
        dying.push(s);
      }
      return dying;
    };
  });
})();`;

// Whether the help, shown, fits the row under the board: an item squeezed
// past its box (the speed buttons and the switch beside it), or its lines
// making the row taller than it is and taking it off the screen. Where it
// doesn't, it gives way (game/screen.js fitColumn).
const HELP_FITS = `(() => { const h = document.getElementById('help'), f = document.querySelector('.foot'); if (!h.getClientRects().length) return { squeezed: false, pushes: false };
  return { squeezed: h.scrollWidth > h.clientWidth + 1, pushes: h.getBoundingClientRect().height > parseFloat(getComputedStyle(f).minHeight) + 0.5 && f.getBoundingClientRect().bottom + scrollY > innerHeight + 0.5 }; })()`;

// The page's layout, as the test reads it. (hanging: the frame's moss and
// leaves that hang below the board's bottom edge, into the ledge; decor:
// all of them that show; helpShown: the help isn't hidden for being cut.)
const LAYOUT = `(() => {
  const box = el => { if (!el) return null; const b = el.getBoundingClientRect(); return b.width || b.height ? { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom } : null; };
  const q = s => document.querySelector(s);
  const se = document.scrollingElement, board = box(q('#game'));
  const decor = [...document.querySelectorAll('.frame .moss, .frame .leaves')].map(el => ({ what: el.getAttribute('class'), ...box(el) })).filter(f => f.w);
  return {
    vw: innerWidth, vh: innerHeight, scrollW: se.scrollWidth, scrollH: se.scrollHeight,
    board, frame: box(q('.frame')), ledge: box(q('#perch-ledge')),
    header: box(q('header')), tags: box(q('#scoreboard')), speed: box(q('#speed')), foot: box(q('.foot')), chatter: box(q('.chatter')), chatlog: box(q('#chatlog')), help: box(q('#help')),
    helpShown: getComputedStyle(q('#help')).visibility !== 'hidden', decor,
    hanging: decor.filter(f => /moss bottom|leaves b/.test(f.what) && board && f.b > board.b),
  };
})()`;

// A banner, put up as the round would (with these words; or the one up now,
// show false), and where it is (DESIGN "Teaching by showing"): above the
// board or on it; over the board, your own name tag or the pause button;
// its middle against the board's, in boards from its top; inside the
// screen's safe top; its lines, and whether its words are whole. (Its
// settling in finished first: it drops 6 px as it comes.)
const BANNERS = [ // (the widest a phone shows: a lesson with no shorter words, round news in its phone words, Go!)
  ['On fire: 3 bites of tail, and at 3 it ends you. Rain helps.', '', 'lesson'],
  ['Rat-a-tat. The woodpecker has come for the log, a patch at a time.', 'bird', 'round'],
  ['First out: Capricious got cut in two by Metagamer.', 'kill', 'round', { phone: 'First out: Capricious was cut by Metagamer.' }],
  ['Let the wriggling begin.', 'go', 'round'],
];
const BANNER = ([text, kind, level, opts] = [], show = true) => `(() => {
  const t = document.getElementById('toast');
  if (${show}) SnakeDebug.banner(${JSON.stringify(text)}, ${JSON.stringify(kind)}, ${JSON.stringify(level)}, ${JSON.stringify(opts || {})});
  if (t.hidden) return null;
  for (const a of t.getAnimations()) a.finish();
  const box = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom }; };
  const hit = (a, c) => a.x < c.r - 0.5 && c.x < a.r - 0.5 && a.y < c.b - 0.5 && c.y < a.b - 0.5;
  const me = SnakeDebug.game().snakes.find(s => s.isPlayer), cs = getComputedStyle(t);
  const tb = box(t), board = box(document.getElementById('game')), tag = me?.tag?.li ? box(me.tag.li) : null, pause = box(document.getElementById('pause'));
  return { text: t.textContent, above: t.classList.contains('above'), box: tb, onBoard: hit(tb, board), onTag: !!tag && hit(tb, tag), onPause: hit(tb, pause),
    mid: ((tb.y + tb.b) / 2 - board.y) / (board.b - board.y), safeTop: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-t')) || 0, vw: innerWidth,
    lines: t.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) > parseFloat(cs.fontSize) * 1.4 ? 2 : 1, whole: t.scrollWidth <= t.clientWidth + 1 };
})()`;
// What's wrong with a banner's place, held upright or not (an empty list: nothing).
const bannerWrong = (p, upright) => !p ? ['not shown'] : upright
  ? [!p.above && 'on the board, not above it', p.onBoard && 'over the board', p.onTag && 'over your tag', p.onPause && 'over the pause button', p.box.y < p.safeTop - 0.5 && 'over the screen\'s safe top',
    (p.box.x < -0.5 || p.box.r > p.vw + 0.5) && 'off the screen\'s side', p.lines > 1 && 'two lines', !p.whole && 'its words cut'].filter(Boolean)
  : [p.above && 'above the board', p.mid > 0.25 && p.mid < 0.75 && `in the board's middle (${p.mid.toFixed(2)})`].filter(Boolean);

// Whether each element takes a tap where it is (the topmost thing at its
// middle is it, or inside it), and is on the screen.
const REACH = sels => `(() => [...document.querySelectorAll(${JSON.stringify(sels)})].filter(el => !el.hidden && el.getBoundingClientRect().width).map(el => {
  const b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
  const top = document.elementFromPoint(x, y);
  return { what: el.id || el.textContent.trim().slice(0, 18) || el.className, on: b.left >= -0.5 && b.right <= innerWidth + 0.5 && b.top >= -0.5 && b.bottom <= innerHeight + 0.5, taps: !!top && (top === el || el.contains(top)) };
}))()`;

// The woodpecker for a spot (cells), drawn on the held board: perched,
// resting (pose false: its head turned as far up and down as it looks
// round, and level) or eyeing its chunk (true: its head turned and tilted
// to it, crouched as it's about to take off). Then its own layer's pixels
// read back: where it is (CSS px), how many of them lie over the board's
// cells and over each of the page's furniture (rects, CSS px), and the
// edges of the screen it's cut off at (its solid pixels on the screen's
// outermost rows or columns, which run on past it; or on its layer's, where
// that ends inside the screen: cut off by its layer). Its layer is the board
// and the room round it, placed with CSS, not the screen.
const PERCH = (x, y, pose, rects = {}) => `(() => {
  const g = SnakeDebug.game(), R = SnakeRender, E = SnakeEngine, cell = ${y * 24 + x};
  g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000);
  g.woodpecker = null; SnakeDebug.draw(); // (gone a moment, so it's placed afresh rather than flying over)
  const aim = ${pose !== false}, ms = E.tickMs(g);
  let now = performance.now();
  g.woodpecker = { x: ${x}, y: ${y}, at: g.time, target: aim ? [cell] : [], strikeAt: aim ? g.tick + 17 : -1, last: aim ? [cell] : [], struckAt: aim ? g.tick - 60 : -1, restUntil: aim ? g.tick : g.tick + 1e6, pecks: aim ? 1 : 0 };
  R.frame(0.5, now += 16);
  const L = document.getElementById('bird-layer');
  if (!L || L.style.display === 'none') return null;
  const read = () => {
    const lb = L.getBoundingClientRect(), sx = L.width / lb.width, sy = L.height / lb.height, W = L.width, H = L.height;
    const data = L.getContext('2d').getImageData(0, 0, W, H).data;
    const b = document.getElementById('game').getBoundingClientRect();
    const bx0 = Math.floor((b.left - lb.left) * sx), bx1 = Math.ceil((b.right - lb.left) * sx), by0 = Math.floor((b.top - lb.top) * sy), by1 = Math.ceil((b.bottom - lb.top) * sy);
    const Rs = Object.entries(${JSON.stringify(rects)}).map(([k, f]) => [k, Math.floor((f.x - lb.left) * sx), Math.ceil((f.r - lb.left) * sx), Math.floor((f.y - lb.top) * sy), Math.ceil((f.b - lb.top) * sy)]), on = {};
    const el = Math.max(0, Math.floor(-lb.left * sx)), er = Math.min(W - 1, Math.ceil((innerWidth - lb.left) * sx) - 1), et = Math.max(0, Math.floor(-lb.top * sy)), eb = Math.min(H - 1, Math.ceil((innerHeight - lb.top) * sy) - 1); // (the screen's edges, or its layer's inside them)
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, over = 0, cl = false, cr = false, ct = false, cb = false;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const a = data[(j * W + i) * 4 + 3];
      if (a < 24) continue; // (not its faint shadow's edge)
      if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j;
      if (i >= bx0 && i < bx1 && j >= by0 && j < by1) over++;
      for (const [k, l, r, t, bt] of Rs) if (i >= l && i < r && j >= t && j < bt) on[k] = (on[k] || 0) + 1;
      if (a >= 200) { cl ||= i <= el; cr ||= i >= er; ct ||= j <= et; cb ||= j >= eb; } // (not the soft edge of a line ending a hair inside the screen)
    }
    if (x1 < 0) return null;
    return { over, on, cut: [cl && 'left', ct && 'top', cr && 'right', cb && 'bottom'].filter(Boolean), inside: [lb.left > 0.5 && 'left', lb.right < innerWidth - 0.5 && 'right'].filter(Boolean), x: lb.left + x0 / sx, y: lb.top + y0 / sy, r: lb.left + (x1 + 1) / sx, b: lb.top + (y1 + 1) / sy };
  };
  const all = [];
  if (aim) { // (its head turned and tilted to its chunk, crouched to take off)
    const depart = R.birdPlan().depart + 2, K = Math.ceil(depart / ms);
    g.woodpecker.strikeAt = g.tick - 1 + K;
    for (let i = 0; i < 12; i++) R.frame(K - depart / ms, now += 16);
    all.push(read());
  } else {
    for (const turn of [-1.2, 1.2, 0]) { R.birdLook(turn); for (let i = 0; i < 3; i++) R.frame(0.5, now += 16); all.push(read()); }
    R.birdLook(null);
  }
  if (all.some(q => !q)) return null;
  const on = {};
  for (const q of all) for (const k in q.on) on[k] = Math.max(on[k] || 0, q.on[k]);
  const p = { over: Math.max(...all.map(q => q.over)), on, cut: [...new Set(all.flatMap(q => q.cut))], inside: all[0].inside, x: Math.min(...all.map(q => q.x)), y: Math.min(...all.map(q => q.y)), r: Math.max(...all.map(q => q.r)), b: Math.max(...all.map(q => q.b)) };
  p.h = p.b - p.y;
  { const P = R.birdPose(), L = P.layer; p.eye = { x: L.x + P.eye[0] * L.w / L.W, y: L.y + P.eye[1] * L.h / L.H }; } // (its eye, CSS px, from its layer's pixels: on a phone on its side, its back may be off the screen, never its eye)
  return p;
})()`;
const SPOTS = [[1, 1], [12, 1], [22, 1], [1, 12], [12, 12], [22, 12], [1, 22], [6, 22], [12, 22], [17, 22], [22, 22]];

// The woodpecker working a spot, from (another spot it rested at before,
// the same by default) through its whole aim and its rest after: the hop
// to its perch, the flight out, landing, drumming, lingering at the hole,
// the flight home and settling, drawn every 10 ms of its plan (a wingbeat
// is 104 ms: each beat seen at ten moments, its bounds and dips too);
// then which edges of the screen it's cut off at, flying (to the spot and
// home) and drumming (its solid pixels on the screen's outermost rows or
// columns, or on its layer's where that ends inside the screen). A wing
// that reaches past the screen at one moment of the beat and not another
// is still caught.
const FLIGHT = (x, y, from = [x, y]) => `(() => {
  const g = SnakeDebug.game(), R = SnakeRender, E = SnakeEngine, cell = ${y * 24 + x}, prev = ${from[1] * 24 + from[0]};
  g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000);
  const L = document.getElementById('bird-layer'), G = L.getContext('2d'), ms = E.tickMs(g);
  const cut = { fly: new Set(), drum: new Set() };
  let now = performance.now();
  g.woodpecker = null; SnakeDebug.draw();
  g.woodpecker = { x: ${x}, y: ${y}, at: g.time, target: [cell], strikeAt: g.tick + 17, last: [prev], struckAt: g.tick - 60, restUntil: g.tick, pecks: 1 };
  R.frame(0.5, now += 16);
  const plan = R.birdPlan(), lb = L.getBoundingClientRect(), sx = L.width / lb.width, sy = L.height / lb.height, W = L.width, H = L.height;
  const el = Math.max(0, Math.floor(-lb.left * sx)), er = Math.min(W - 1, Math.ceil((innerWidth - lb.left) * sx) - 1), et = Math.max(0, Math.floor(-lb.top * sy)), eb = Math.min(H - 1, Math.ceil((innerHeight - lb.top) * sy) - 1);
  // (the four edges laid end to end in one row, read back once a frame: the top, the bottom, the left and the right)
  const S = document.createElement('canvas'); S.width = 2 * W + 2 * H; S.height = 1;
  const sg = S.getContext('2d', { willReadFrequently: true }); sg.imageSmoothingEnabled = false;
  const look = at => {
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, S.width, 1);
    sg.drawImage(L, 0, et, W, 1, 0, 0, W, 1); sg.drawImage(L, 0, eb, W, 1, W, 0, W, 1);
    sg.setTransform(0, 1, 1, 0, 2 * W, 0); sg.drawImage(L, el, 0, 1, H, 0, 0, 1, H);
    sg.setTransform(0, 1, 1, 0, 2 * W + H, 0); sg.drawImage(L, er, 0, 1, H, 0, 0, 1, H);
    const p = sg.getImageData(0, 0, S.width, 1).data;
    for (let i = 0; i < S.width; i++) if (p[i * 4 + 3] >= 200) at.add(i < W ? 'top' : i < 2 * W ? 'bottom' : i < 2 * W + H ? 'left' : 'right');
  };
  for (let m = prev === cell ? plan.depart + 10 : plan.aim; m >= 0; m -= 10) { // (m ms to the strike: its hop, if it has one, then off its perch)
    const K = Math.ceil(m / ms);
    g.woodpecker.strikeAt = g.tick - 1 + K;
    R.birdFrame(K - m / ms, now += 10); // (the bird alone: the board stays as it is)
    look(m > plan.drum ? cut.fly : cut.drum);
  }
  g.woodpecker = { x: ${x}, y: ${y}, at: g.time, target: [], strikeAt: -1, last: [cell], struckAt: -1, restUntil: -1, pecks: 2 };
  for (let m = 0; m <= 1200; m += 10) { // (m ms after it)
    const K = Math.floor(m / ms);
    g.woodpecker.struckAt = g.woodpecker.strikeAt = g.tick - 1 - K; g.woodpecker.restUntil = g.woodpecker.struckAt + TUNING.PECK_REST_MIN;
    R.birdFrame(m / ms - K, now += 10);
    if (m > R.birdHome() + 40) break;
    look(m < plan.linger ? cut.drum : cut.fly);
  }
  g.woodpecker = null; SnakeDebug.draw();
  return { fly: [...cut.fly], drum: [...cut.drum] };
})()`;
const FLIGHT_SPOTS = [[0, 12], [23, 12], [12, 23], [1, 22], [3, 22], [4, 22], [19, 22], [0, 0], [23, 0]];

// The chatter's log as it shows (game/screen.js fitChatter: an older line with no
// room for all of it isn't shown, and the newest, where it alone doesn't
// fit, is cut to the rows that do, its own box ending there), and the
// page's bottom: where its words end, how many lines show (and whether the
// newest is cut), how many rows of words are whole, and whether any row is
// sliced through by where its line or the page ends.
const LOG_ROWS = `(() => {
  const log = document.getElementById('chatlog'), lb = log.getBoundingClientRect();
  const page = Math.min(document.querySelector('main').getBoundingClientRect().bottom, innerHeight);
  const range = document.createRange();
  let whole = 0, sliced = 0, end = lb.top, lines = 0, parts = 0;
  for (const li of log.children) {
    const r = li.getBoundingClientRect();
    if (!r.height) continue; // (not shown)
    lines++;
    if (li.classList.contains('cut')) parts++;
    const stop = Math.min(page, r.bottom - parseFloat(getComputedStyle(li).paddingBottom)); // (a cut line ends at its own box: its rows past it are clamped away)
    range.selectNodeContents(li);
    for (const f of range.getClientRects()) if (f.height) { if (f.bottom <= stop + 0.5) { whole++; end = Math.max(end, f.bottom); } else if (f.top < stop - 0.5) sliced++; }
  }
  return { whole, sliced, end, top: lb.top, lines, parts };
})()`;

// A browser without svh or dvh: the page's own stylesheets, those units made
// unknown to the browser (and its tests for them false). A declaration with
// one that has var() in it isn't checked until it's used, so a second one
// can't fall back to a first: it would lose its property. Then the page is
// laid out again.
const NO_SVH = `(async () => {
  let n = 0;
  for (const link of document.querySelectorAll('link[rel="stylesheet"][href^="style/"]')) {
    const css = await (await fetch(link.href)).text();
    const st = document.createElement('style');
    st.textContent = css.replace(/(\\d)([sd]vh)\\b/g, '$1zzh');
    link.replaceWith(st);
    n += (css.match(/\\d[sd]vh\\b/g) || []).length;
  }
  await new Promise(r => setTimeout(r, 200));
  dispatchEvent(new Event('resize'));
  await new Promise(r => setTimeout(r, 200));
  return n;
})()`;

// The header, as rows: what's on each, left to right (the title, Score,
// Best and each button shown, by its id), grouped by where each sits (a
// button's margin box: one reaching past its row on negative margins, the
// full-screen button at a phone's column corner, counts on the row it's
// laid out in; Score over Best, beside the title, count as one); its
// height; whether each door shows its word; and the Field guide's tooltip
// and spoken name.
const HEADER = `(() => {
  const vis = el => !!el && !el.hidden && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  const hd = document.querySelector('header'), stats = document.querySelector('.stats');
  const pair = stats && getComputedStyle(stats).display !== 'contents' ? stats : null;
  const items = [['title', document.querySelector('h1')], ...[...hd.querySelectorAll('.hud .stat')].map((el, i) => [i ? 'Best' : 'Score', pair || el]), ...[...hd.querySelectorAll('.hud button')].filter(vis).map(el => [el.id, el])];
  let rows = [];
  for (const [n, el] of items) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el), top = r.top - parseFloat(cs.marginTop), bottom = r.bottom + parseFloat(cs.marginBottom);
    let row = rows.find(q => Math.min(bottom, q.bottom) - Math.max(top, q.top) > 2);
    if (!row) rows.push(row = { top, bottom, items: [] });
    row.top = Math.min(row.top, top); row.bottom = Math.max(row.bottom, bottom);
    row.items.push({ n, l: n === 'Best' && pair ? r.left + 0.5 : r.left });
  }
  for (let merged = true; merged;) { // (rows that grew into each other are one)
    merged = false;
    for (const a of rows) for (const b of rows) if (a !== b && !merged && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) { a.items.push(...b.items); a.top = Math.min(a.top, b.top); a.bottom = Math.max(a.bottom, b.bottom); rows = rows.filter(q => q !== b); merged = true; }
  }
  rows.sort((a, b) => a.top - b.top);
  const named = id => vis(document.querySelector('#' + id + ' .trophy-text')), g = document.getElementById('guide-open');
  const col = matchMedia('(min-aspect-ratio: 5/4) and (max-height: 1180px) and (min-width: 480px)').matches;
  return { height: hd.getBoundingClientRect().height, rows: rows.map(r => r.items.sort((a, b) => a.l - b.l).map(i => i.n).join(' ')), guide: named('guide-open'), trophy: named('records-open'),
    tip: g.title, label: g.getAttribute('aria-label'), place: innerWidth <= 440 ? 'upright' : col ? (innerHeight <= 500 ? 'side' : 'column') : 'over' };
})()`;
// A door shown by its word instead of its picture, 5 px wider still (its
// word with 5 px to spare), or hidden (the header without it).
const DOOR = (id, how) => {
  const css = how === 'hidden' ? `#${id} { display: none !important; }`
    : `#${id} { width: auto !important; min-width: 0 !important; padding-inline: 12px !important; margin-right: 5px !important; } #${id} svg { display: none !important; } #${id} .trophy-text { display: inline !important; }`;
  return `(() => { const st = document.createElement('style'); st.id = 'door-test'; st.textContent = ${JSON.stringify(css)}; document.head.append(st); return 'ok'; })()`;
};

const only = process.argv[2];
const sized = (w, h) => DEVICES.find(d => d.w === w && d.h === h && !d.insets);
const CALLS = sized(390, 844), CALLS_SIDE = sized(780, 320); // (the call's phone: upright, and on its side with its browser's bars)
const furnitureOf = (l, under = false) => Object.fromEntries(['header', 'tags', ...(under ? [] : ['foot', 'chatter'])].filter(k => l[k]).map(k => [k, l[k]])); // (under: held upright on a phone, the bird stands over the row under the board and the chatter)
// Five lines from the rivals, the most the log keeps: long ones, two rows
// each on a phone. And the page's scroll, down and across.
const FILL = `(() => { const log = document.getElementById('chatlog'), g = SnakeDebug.game(), names = (g ? g.snakes.filter(s => !s.isPlayer).map(s => s.name) : []).concat(['Gobbler', 'Star', 'Mason']);
  log.textContent = '';
  ['Is it lunchtime? It feels like lunchtime.', 'Trespasser! Guards! …We are the guards.', 'A woodpecker! Someone fetch my musket. Politely.', 'Global warming? Total hoax. Look at all this snow!', 'Out of my way! I’m starving, and the bark is bare!']
    .forEach((t, i) => log.insertAdjacentHTML('afterbegin', '<li><strong>' + names[i % 3] + '</strong> <span>' + t + '</span></li>'));
  return 'ok'; })()`;
const SCROLL = `(() => { const se = document.scrollingElement; return { h: se.scrollHeight, w: se.scrollWidth, vh: innerHeight, vw: innerWidth }; })()`;
const r1 = v => Math.round(v * 10) / 10;
