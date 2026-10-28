// ------------------------------------------------------------ the chatter, playing
// A stand-in page: just enough of the DOM for bubbles and the log.
class El {
  constructor() { this.children = []; this.parent = null; this.style = { setProperty() {} }; this.classList = { toggle() {} }; this.textContent = ''; }
  append(...nodes) { for (const n of nodes) if (typeof n === 'object') { n.parent = this; this.children.push(n); } }
  appendChild(n) { this.append(n); return n; }
  prepend(n) { n.parent = this; this.children.unshift(n); }
  remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
  get lastChild() { return this.children[this.children.length - 1]; }
  setAttribute() {}
  getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 100 }; }
  closest() { return null; }
  querySelector() { return null; }
}
// Seeded randomness for the game; a fixed roll for the chatter's own chances
// (0.38: a 'rot' or 'flash' chance passes, small talk and Copycat stay quiet).
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rng = seeded(1), roll = null;
const M = Object.create(Math);
M.random = () => (roll != null ? roll : rng());
const ctx = vm.createContext({
  window: {}, console, Math: M, performance: { now: () => Date.now() }, innerHeight: 800,
  document: { createElement: () => new El(), body: new El(), hidden: false },
  addEventListener() {}, ResizeObserver: class { observe() {} }, MutationObserver: class { observe() {} },
});
for (const f of ['tuning.js', 'ai.js', 'engine.js', ...CHATTER]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const { SnakeEngine: E, SnakeChatter: C, TUNING: T } = ctx.window;
const logEl = new El();
C.init({ boardEl: new El(), logEl });
let heard = [];
C.onSpeak((s, text) => heard.push({ s, text }));

const K = (x, y) => y * T.GRID + x;
const at = (x, y, n = 3) => Array.from({ length: n }, (_, i) => ({ x: x - i, y }));
// You and one rival (or more), heads where they're asked to be, late enough in
// a round that nobody says hello, everyone fed and nothing burning.
function stage(personas, heads = {}) {
  const g = E.createGame({ withPlayer: true, personas });
  g.food = []; g.tick = 100; g.time = 12000;
  g.snakes.forEach((s, i) => { s.body = at(...(heads[i] || [3 + i * 6, 3 + i * 6])); s.prev = s.body.map(c => ({ ...c })); });
  C.reset(g);
  return g;
}
// One tick of chatter, with these events: what was said. (r: the chatter's
// fixed roll, for the moments that need another.)
function tick(g, events = [], ms = 100, r = 0.38) {
  g.tick++; g.time += ms; g.events = events;
  heard = [];
  roll = r;
  try { C.update(); } finally { roll = null; }
  return heard;
}
const filled = (list, who) => (list || []).map(l => l.replaceAll('{who}', who?.name ?? ''));
const says = (heardNow, s, list, who) => heardNow.some(h => h.s === s && filled(list, who).includes(h.text));
const lineOf = (heardNow, s) => heardNow.find(h => h.s === s)?.text;
const keys = Object.keys(VOICES);
let checks = 0;
const check = (cond, what) => { checks++; ok(cond, what); };

// Every voice, every moment it has lines for (each in a fresh round).
for (const k of keys) {
  const v = VOICES[k];
  const fresh = (heads = {}) => { const g = stage([k], { 0: [3, 20], 1: [12, 12], ...heads }); return [g, g.snakes[0], g.snakes[1]]; };
  let [g, you, ai] = fresh();
  let h = tick(g, [{ type: 'peck', x: 11, y: 12, cells: [K(11, 12), K(10, 12)], under: [ai.id, you.id] }]);
  check(says(h, ai, v.under), `${k} says an 'under' line when the woodpecker pecks under it (said: ${lineOf(h, ai)})`);
  check(!h.some(x => x.s === you), `${k}: nobody speaks for you`);

  [g, you, ai] = fresh();
  ai.burnFrom = g.tick; ai.burnUntil = g.tick + 10;
  tick(g);
  g.weather.kind = 'rain'; ai.burnUntil = g.tick + 1; // (the rain cut it short: out next tick)
  h = tick(g);
  check(says(h, ai, v.doused), `${k} says a 'doused' line when the rain puts it out (said: ${lineOf(h, ai)})`);

  [g, you, ai] = fresh();
  h = tick(g, [{ type: 'ash', x: 13, y: 12, kind: 'food' }]);
  check(says(h, ai, v.ash), `${k} says an 'ash' line when food by its head burns away (said: ${lineOf(h, ai)})`);

  [g, you, ai] = fresh();
  h = tick(g, [{ type: 'rot', x: 13, y: 13, kind: 'pellet', color: '#fff' }]);
  check(says(h, ai, v.rot), `${k} says a 'rot' line when food by its head rots (said: ${lineOf(h, ai)})`);

  [g, you, ai] = fresh();
  ai.memory.desperate = true;
  h = tick(g);
  check(says(h, ai, v.desperate), `${k} says a 'desperate' line when it starts taking its chances (said: ${lineOf(h, ai)})`);

  [g, you, ai] = fresh();
  h = tick(g, [{ type: 'cut', snake: ai, x: 10, y: 12, lost: 2, by: you.id }]);
  check(says(h, ai, v.cut, you), `${k} says a 'cut' line when a dash cuts it (said: ${lineOf(h, ai)})`);

  [g, you, ai] = fresh();
  h = tick(g, [{ type: 'choke', snake: ai, x: 12, y: 12, tx: 12, ty: 11 }]);
  check(says(h, ai, v.choke), `${k} says a 'choke' line when it chokes on its own bead (said: ${lineOf(h, ai)})`);

  [g, you, ai] = fresh();
  check(tick(g, [{ type: 'nudge', snake: you, kind: 'food', x: 3, y: 20, tx: 3, ty: 19 }]).length === 0, `${k}: your cough nudges an apple aside: nothing yet`);
  h = tick(g, [{ type: 'eat', snake: ai, kind: 'food', x: 3, y: 19 }], 800);
  check(says(h, ai, v.windfall, you), `${k} says a 'windfall' line when it eats an apple your cough nudged aside (said: ${lineOf(h, ai)})`);

  [g, you, ai] = fresh();
  check(tick(g, [{ type: 'dig', x: 14, y: 12, until: g.tick + 9 }]).length === 0, `${k}: a beetle digs in by its head: nothing yet`);
  h = tick(g, [{ type: 'dive', x: 14, y: 12, dug: 1 }], 800);
  check(says(h, ai, v.dug), `${k} says a 'dug' line when a beetle it cornered digs in and gets away (said: ${lineOf(h, ai)})`);

  [g, you, ai] = fresh();
  check(tick(g, [{ type: 'knock', kind: 'food', x: 12, y: 14, tx: 12, ty: 16 }]).length === 0, `${k}: the woodpecker knocks aside the apple it was after: nothing yet`);
  h = tick(g, [{ type: 'eat', snake: you, kind: 'food', x: 12, y: 16 }], 1000);
  check(says(h, ai, v.knocked, you), `${k} says a 'knocked' line when you eat the apple the woodpecker knocked away from it (said: ${lineOf(h, ai)})`);

  if (v.flash?.first) {
    [g, you, ai] = fresh({ 0: [14, 14] });
    h = tick(g, [{ type: 'dash', snake: ai, x: 10, y: 12, n: 2, plain: 1 }, { type: 'eat', snake: ai, kind: 'food', x: 12, y: 12 }]);
    check(says(h, ai, v.flash.first, you), `${k} says a 'flash.first' line when its flash beats you to an apple (said: ${lineOf(h, ai)})`);
  }
  if (v.flash?.past) {
    [g, you, ai] = fresh({ 0: [13, 13] });
    h = tick(g, [{ type: 'dash', snake: ai, x: 10, y: 12, n: 2, plain: 1 }]);
    check(says(h, ai, v.flash.past, you), `${k} says a 'flash.past' line when it flashes past your head (said: ${lineOf(h, ai)})`);
  }
  if (v.last) {
    [g, you, ai] = fresh();
    h = tick(g, [{ type: 'lastApples' }]);
    check(says(h, ai, v.last), `${k} says a 'last' line when the last apples start falling (said: ${lineOf(h, ai)})`);
  }
}
console.log('ok   every voice speaks up when pecked under, put out, starving, cut, choking on its own bead, eating food your cough knocked aside, when a beetle it cornered digs in and gets away, when you eat what the woodpecker knocked away from it, and when food burns or rots by it (and flashes, and the last apples, where it has lines)');
