#!/usr/bin/env node
// Checks the chatter's lines: every line in English has its Chinese (Copycat
// repeats what it hears, in Chinese), every {who} line names someone the
// same way in both, no voice has an empty list, no Chinese is left over from
// a line that's gone, and every punchline is a line someone says.
// Then it plays the chatter itself (chatter.js with the game's own engine, on
// a stand-in page) through staged moments: every voice speaks up when it's
// pecked under, put out by the rain, sees food burn or rot, starves, is cut
// by a dash, chokes on its own bead, eats what your cough nudged aside, loses
// a beetle it cornered that digs in and gets away, sees you eat what the
// woodpecker knocked away from it, and (where it has lines for them) flashes
// or hears the last apples fall; Sovereign and Colonist mind rot on their
// land, by the one land rule, and a capital or a colony the woodpecker takes;
// and the rarer lines keep to their rests (a choke's 20 s, a windfall's
// thanks now and then, only for what a choke or a cough knocked aside, soon
// after; a dug-in beetle's 30 s, only for its hunter, the nearest head as it
// dug; a grumble at whoever ate what the woodpecker knocked aside, from the
// nearest head to where it lay but the eater's, every 40 s at most), and no
// rival announces the woodpecker's fair play (the lesson does). Star, the
// power addict,
// has a line for every moment anyone has, shows off its flashes and jumps at
// most every 10 s (even flashing the moment its rest is over, when it doesn't
// say its flash is back), grumbles while it rests, crows over golden things,
// greets a rainbow as family (its own moments aren't crowded out by its
// showing off), and now and then Wildcard or Mason answers it; a golden dash
// that cuts someone leaves the words to the snip or the kill. The names in
// the log read on its dark wood in their snakes' own colours (Copycat's the
// flag's red, not pink). Then two
// whole AI rounds with the chatter listening, to see nothing throws: one with
// the rivals who have the most to say about the board (Sovereign's realm and
// Colonist's colonies, intruders and fire on them, Vulture at every death,
// Capricious in its moods), one with Star and the rivals who answer it. Last, the sound (audio.js on a stand-in AudioContext): a rival's
// flash, jump, choke or the like never silences yours, your own golden ones
// in a row are each heard, your choke and its cough (a beat later) each time
// you can choke, a beetle digging in and the woodpecker knocking food aside
// once a moment and each time they can come again, and nothing while muted;
// and what carries over the music: a rival's dig keeps its legs' scratches,
// and a burrow closing over its flecks of sawdust.
//
//   node tools/chatter-test.js [--rounds N]
//   (--rounds N: N more whole AI rounds of four rivals at random, with the
//   woodpecker's knocked food and its grumbles checked and counted.)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'chatter.js'), 'utf8');
// (The tables are private to the chatter, so they're read from the source:
// from the opening bracket to the closing one, at the start of a line.)
const slice = (head, tail, name) => {
  const start = src.indexOf(head);
  const end = src.indexOf(tail, start);
  if (start < 0 || end < 0) throw new Error('no table ' + name);
  return new Function(`return ${src.slice(start + head.length - 1, end + '\n  }'.length)}`)();
};
const table = name => slice(`  const ${name} = {`, '\n  };\n', name);
const VOICES = table('VOICES'), ZH = table('ZH'), REPLIES = table('REPLIES');
const PUNCHLINES = slice('  const PUNCHLINES = new Set([', '\n  ]);\n', 'PUNCHLINES');
// (The chatter's reach for whoever was after food the woodpecker knocked aside: cells from where it lay.)
const KNOCKED_NEAR = +/\bKNOCKED_NEAR = (\d+)/.exec(src)[1];
let fails = 0;
const ok = (cond, what) => { if (!cond) { console.error('FAIL:', what); fails++; } };

const lines = [];
const walk = (v, path) => {
  if (Array.isArray(v)) { ok(v.length > 0, `${path} has lines`); for (const l of v) lines.push([path, l]); }
  else for (const [k, w] of Object.entries(v)) walk(w, `${path}.${k}`);
};
for (const [who, voice] of Object.entries(VOICES)) walk(voice, who);
// (The answers to Mason are said, and repeated, like any other line.)
for (const [cue, r] of Object.entries(REPLIES)) {
  for (const l of r.lines) lines.push([`replies to "${cue}"`, l]);
  if (r.then) lines.push([`then, after "${cue}"`, r.then]);
}

const chinese = t => /[一-鿿]/.test(t);
for (const [path, line] of lines) {
  if (chinese(line)) continue; // (Copycat's own)
  ok(line in ZH, `${path}: "${line}" has its Chinese`);
  if (line in ZH) ok(line.includes('{who}') === ZH[line].includes('{who}'), `${path}: "${line}" names {who} in both`);
}
const said = new Set(lines.map(([, l]) => l));
const orphans = Object.keys(ZH).filter(l => !said.has(l));
for (const l of orphans) ok(false, `the Chinese for "${l}" has no English line (it was removed or reworded)`);
const spoken = new Set(Object.values(VOICES).flatMap(function all(v) { return Array.isArray(v) ? v : Object.values(v).flatMap(all); }));
for (const l of PUNCHLINES) ok(spoken.has(l), `punchline "${l}" is a line someone says`);

// Every voice has the moments anyone can have; the woodpecker cuts nothing
// now, so no voice blames the bird for its tail.
const EVERYONE = ['under', 'doused', 'ash', 'rot', 'desperate', 'cut', 'choke', 'windfall', 'dug', 'knocked'];
for (const [who, voice] of Object.entries(VOICES)) {
  for (const k of EVERYONE) ok(voice[k]?.length, `${who} has '${k}' lines`);
  ok(!voice.snipped, `${who}: 'snipped' is gone (a dash's cut is 'cut' now)`);
  ok(!(voice.cut || []).some(l => /bird|woodpecker/i.test(l)), `${who}: no 'cut' line blames the woodpecker`);
  for (const k of Object.keys(voice.flash || {})) ok(k === 'first' || k === 'past', `${who}: flash.${k} is first or past`);
}
ok(VOICES.sovereign.realm?.rotten?.length, 'Sovereign minds rot in its realm');
ok(VOICES.colonist.colony?.rotten?.length, 'Colonist minds rot in its colonies');
ok(VOICES.sovereign.realm?.capital?.length, 'Sovereign has lines for a capital the woodpecker took');
ok(VOICES.colonist.colony?.lost?.length, 'Colonist has lines for a colony the woodpecker took');
for (const [who, voice] of Object.entries(VOICES)) ok((voice.windfall || []).every(l => l.includes('{who}') || chinese(l)), `${who}: its 'windfall' lines thank the cougher by name`);
// (A beetle that got away names nobody; food the woodpecker knocked to someone else names who ate it.)
for (const [who, voice] of Object.entries(VOICES)) {
  ok((voice.dug || []).every(l => !l.includes('{who}')), `${who}: its 'dug' lines name nobody`);
  ok((voice.knocked || []).every(l => l.includes('{who}')), `${who}: its 'knocked' lines name who ate it`);
}
// The woodpecker's fair play (it knocks food aside by a rule, never shuts
// anyone in) is the lesson's to say: no rival announces it.
for (const [path, line] of lines) ok(!/shut (you|me|us|anyone) in|never shuts|plays fair/i.test(line), `${path}: "${line}" leaves the woodpecker's fair play to the lesson`);
// Star, the newest, has lines for every moment anyone has lines for (but the
// ones that are someone's own: Vulture's deaths, the land, Capricious's
// moods, Gobbler's and Desperado's spawns and first strike, the answers to
// Star), and its own: its flashes, its flash back, its grumbling while it
// rests and its stash of golden things. Some rivals answer it.
const OWN = ['death', 'intruder', 'flag', 'realm', 'colony', 'mood', 'spawn', 'beetle', 'weather.strike', 'showoff'];
const momentsOf = (v, at = '', out = new Set()) => { if (Array.isArray(v)) out.add(at); else for (const [k, w] of Object.entries(v)) momentsOf(w, at ? `${at}.${k}` : k, out); return out; };
const anyones = new Set(Object.entries(VOICES).filter(([who]) => who !== 'star').flatMap(([, v]) => [...momentsOf(v)]));
const starHas = momentsOf(VOICES.star);
const covered = [...anyones].filter(m => !OWN.some(o => m === o || m.startsWith(o + '.')));
for (const m of covered) ok(starHas.has(m), `Star has '${m}' lines`);
for (const k of ['zoom', 'ready', 'resting', 'stash']) ok(VOICES.star[k]?.length, `Star has its own '${k}' lines`);
for (const k of ['wildcard', 'mason']) ok(VOICES[k].showoff?.length, `${k} answers Star's showing off`);
if (fails) { console.error(`${fails} failed`); process.exit(1); }
console.log(`ok   ${lines.length} lines, every one in Chinese too`);
console.log(`ok   ${Object.keys(ZH).length} Chinese lines, none left over`);
console.log(`ok   ${PUNCHLINES.length} punchlines, each told once a round`);
console.log(`ok   every voice: ${EVERYONE.join(', ')}`);
console.log(`ok   Star: all ${covered.length} moments anyone has (${[...starHas].length} with its own), in Chinese too; Wildcard and Mason answer it`);

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
for (const f of ['tuning.js', 'ai.js', 'engine.js', 'chatter.js']) {
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

{ // The woodpecker under a body: at most every 12 s, and only for the living.
  const g = stage(['mason'], { 0: [3, 20], 1: [12, 12] }), [, mason] = g.snakes;
  const peck = () => [{ type: 'peck', x: 11, y: 12, cells: [K(11, 12)], under: [mason.id] }];
  check(tick(g, peck()).length === 1, 'pecked under: a line');
  check(tick(g, peck(), 6000).length === 0, '...and none 6 s later');
  check(says(tick(g, peck(), 6500), mason, VOICES.mason.under), '...but another 12.5 s after the first');
  mason.alive = false;
  check(tick(g, peck(), 13000).length === 0, '...and none from a snake that\'s out');
}
{ // Put out by the weather, not by burning out in the dry.
  const g = stage(['gobbler'], { 1: [12, 12] }), [, gob] = g.snakes;
  gob.burnFrom = g.tick; gob.burnUntil = g.tick + 2;
  tick(g);
  check(tick(g).length === 0, 'a fire that burns out in the dry: nothing about the rain');
  g.weather.kind = 'snow'; gob.burnFrom = g.tick; gob.burnUntil = g.tick + 2;
  tick(g, [], 5000);
  check(says(tick(g), gob, VOICES.gobbler.doused), 'put out in the snow: a doused line');
}
{ // The rain comes while a rival burns: someone else remarks on the rain, and the one on fire on being put out.
  const g = stage(['gobbler', 'drab'], { 1: [12, 12], 2: [12, 18] }), [, gob, drab] = g.snakes;
  gob.burnFrom = g.tick; gob.burnUntil = g.tick + 10;
  tick(g, [], 5000);
  g.weather.kind = 'rain';
  const h = tick(g, [{ type: 'weather', kind: 'rain' }]);
  check(says(h, drab, VOICES.drab.weather.rain) && !h.some(x => x.s === gob), 'the rain starts: the snake on fire leaves the weather to others');
  gob.burnUntil = g.tick + 1;
  check(says(tick(g, [], 600), gob, VOICES.gobbler.doused), '...and is put out with a word');
}
{ // Ash and rot are for whoever was nearest (you included), and near; and nobody mourns a mushroom.
  const g = stage(['vulture'], { 0: [15, 12], 1: [12, 12] }), [you, vul] = g.snakes;
  check(tick(g, [{ type: 'ash', x: 13, y: 12, kind: 'mushroom' }]).length === 0, 'a mushroom burnt to ash: nothing');
  check(tick(g, [{ type: 'ash', x: 14, y: 12, kind: 'food' }], 5000).length === 0, 'ash nearer your head than the rival\'s: the rival says nothing');
  check(tick(g, [{ type: 'rot', x: 12, y: 18, kind: 'apple' }], 5000).length === 0, 'rot 6 cells away: nothing');
  check(says(tick(g, [{ type: 'rot', x: 12, y: 14, kind: 'apple' }], 5000), vul, VOICES.vulture.rot), 'rot 2 cells away: a rot line');
  check(tick(g, [{ type: 'rot', x: 12, y: 14, kind: 'pellet' }], 20000).length === 0, '...and no other for 40 s');
  void you;
}
{ // Sovereign: rot and pecks on its land, by the one land rule (radius + LAND_REACH: no nub at the tips).
  const g = stage(['sovereign'], { 0: [3, 22], 1: [20, 2] }), [, sov] = g.snakes;
  sov.memory.home = { x: 10, y: 10, radius: 4 };
  tick(g);
  check(tick(g, [{ type: 'rot', x: 15, y: 10, kind: 'apple' }], 5000).length === 0, 'rot on the old nub (radius + 1, straight out): not Sovereign\'s land');
  check(says(tick(g, [{ type: 'rot', x: 13, y: 13, kind: 'apple' }], 5000), sov, VOICES.sovereign.realm.rotten), 'rot on its land: Sovereign minds');
  check(tick(g, [{ type: 'rot', x: 14, y: 10, kind: 'pellet' }], 10000).length === 0, '...but not again within 30 s');
  check(tick(g, [{ type: 'peck', x: 15, y: 10, cells: [K(15, 10)], under: [] }], 5000).length === 0, 'a peck on the old nub: not its land either');
  check(says(tick(g, [{ type: 'peck', x: 14, y: 10, cells: [K(14, 10)], under: [] }], 5000), sov, VOICES.sovereign.realm.pecked), 'a peck on its land: Sovereign minds');
}
{ // Colonist: rot in a colony.
  const g = stage(['colonist'], { 0: [3, 22], 1: [22, 2] }), [, col] = g.snakes;
  col.memory.colonies = [{ x: 6, y: 6, radius: 4, n: 1 }, { x: 14, y: 8, radius: 4, n: 2 }];
  col.memory.planted = 2;
  tick(g);
  check(says(tick(g, [{ type: 'rot', x: 17, y: 10, kind: 'pellet' }], 5000), col, VOICES.colonist.colony.rotten), 'rot in a colony: Colonist minds');
}
{ // A colony on Sovereign's land: only where their land really meets.
  const g = stage(['sovereign', 'colonist'], { 0: [3, 22], 1: [22, 2], 2: [22, 20] }), [, sov, col] = g.snakes;
  sov.memory.home = { x: 8, y: 10, radius: 3 };
  col.memory.colonies = [{ x: 16, y: 10, radius: 4, n: 1 }]; col.memory.planted = 1;
  let h = tick(g, [], 5000);
  check(!says(h, sov, VOICES.sovereign.realm.invaded, col), 'a colony that only reaches the realm\'s old (radius + 1) edge: Sovereign says nothing');
  col.memory.colonies.push({ x: 15, y: 10, radius: 4, n: 2 }); col.memory.planted = 2;
  h = tick(g, [], 5000);
  check(says(h, sov, VOICES.sovereign.realm.invaded, col), 'a colony sharing a cell of the realm: "A colony? On OUR land?!"');
}
{ // Desperate: once a spell, and not again for 30 s if it comes and goes.
  const g = stage(['colonist'], { 1: [12, 12] }), [, col] = g.snakes;
  col.memory.desperate = true;
  check(says(tick(g), col, VOICES.colonist.desperate), 'starving soon: a desperate line');
  check(tick(g, [], 5000).length === 0, '...once a spell');
  col.memory.desperate = false; tick(g);
  col.memory.desperate = true;
  check(tick(g, [], 5000).length === 0, '...and not again so soon');
  col.memory.desperate = false; tick(g);
  col.memory.desperate = true;
  check(tick(g, [], 40000).some(x => x.s === col), '...but in a new spell later on (its one line rests 45 s too)');
}
{ // A golden dash keeps its own lines; a plain flash with nobody near says nothing; flash lines rest 30 s.
  const g = stage(['desperado'], { 0: [3, 22], 1: [12, 12] }), [you, des] = g.snakes;
  check(says(tick(g, [{ type: 'dash', snake: des, x: 9, y: 12, n: 3 }]), des, VOICES.desperado.dash), 'a golden dash: a dash line');
  check(tick(g, [{ type: 'dash', snake: des, x: 10, y: 12, n: 2, plain: 1 }], 5000).length === 0, 'a plain flash on its own: nothing');
  you.body = at(13, 13);
  check(says(tick(g, [{ type: 'dash', snake: des, x: 10, y: 12, n: 2, plain: 1 }], 5000), des, VOICES.desperado.flash.past, you), 'a flash past your head: a flash line');
  check(tick(g, [{ type: 'dash', snake: des, x: 10, y: 12, n: 2, plain: 1 }], 6000).length === 0, '...and no other for 30 s');
}
{ // A dash cut: the dasher crows, and the one cut names it.
  const g = stage(['sovereign', 'wildcard'], { 1: [12, 12], 2: [12, 16] }), [, sov, wild] = g.snakes;
  const h = tick(g, [{ type: 'cut', snake: wild, x: 10, y: 16, lost: 2, by: sov.id }]);
  check(says(h, sov, VOICES.sovereign.snip, wild) && says(h, wild, VOICES.wildcard.cut, sov), `cut by a dash: "${lineOf(h, sov)}" / "${lineOf(h, wild)}"`);
}
{ // What whole rounds bring now and then, staged: last words naming the killer, Vulture at a death, a mushroom eaten,
  // Metagamer's small talk with its label for you, someone at the woodpecker's coming, and Sovereign's realm growing,
  // shrinking and on fire.
  let g = stage(['sniper', 'vulture'], { 1: [12, 12], 2: [12, 18] });
  const [you, sniper, vul] = g.snakes;
  Object.assign(sniper, { alive: false, killer: you.name, killerId: you.id });
  let h = tick(g, [{ type: 'death', snake: sniper }]);
  check(says(h, sniper, VOICES.sniper.dies.filter(l => l.includes('{who}')), you), `last words name the killer (said: ${lineOf(h, sniper)})`);
  Object.assign(you, { alive: false, killer: 'wall' });
  h = tick(g, [{ type: 'death', snake: you }], 5000);
  check(says(h, vul, VOICES.vulture.death, you), `Vulture marks a death (said: ${lineOf(h, vul)})`);
  g = stage(['gobbler'], { 1: [12, 12] });
  h = tick(g, [{ type: 'eat', snake: g.snakes[1], kind: 'mushroom', x: 12, y: 12 }]);
  check(says(h, g.snakes[1], VOICES.gobbler.mushroom), `a rival that eats a mushroom grimaces (said: ${lineOf(h, g.snakes[1])})`);
  g = stage(['metagamer'], { 1: [12, 12] });
  const meta = g.snakes[1];
  meta.memory.labels = { [g.snakes[0].id]: 'greedy' };
  h = tick(g, [], 4000, 0.01); // (a roll low enough for small talk, and its first line)
  check(lineOf(h, meta) === `${g.snakes[0].name}: greedy. Noted.`, `Metagamer's small talk says what it makes of you (said: ${lineOf(h, meta)})`);
  h = tick(g, [{ type: 'woodpecker' }], 5000);
  check(says(h, meta, VOICES.metagamer.woodpecker), `...and someone remarks on the woodpecker's coming (said: ${lineOf(h, meta)})`);
  g = stage(['sovereign'], { 0: [3, 22], 1: [20, 2] });
  const sov = g.snakes[1];
  sov.memory.home = { x: 10, y: 10, radius: 4 };
  tick(g);
  sov.memory.home = { x: 10, y: 10, radius: 5 };
  check(says(tick(g, [], 5000), sov, VOICES.sovereign.realm.grow), 'Sovereign\'s realm grows: it says so');
  sov.memory.home = { x: 10, y: 10, radius: 4 };
  check(says(tick(g, [], 5000), sov, VOICES.sovereign.realm.shrink), '...and shrinks: that too');
  g.fires.set(K(11, 10), { from: g.tick, until: g.tick + 50, group: 1, strike: true });
  h = [];
  for (let i = 0; i < 10 && !h.length; i++) h = tick(g, [], i ? 100 : 5000);
  check(says(h, sov, VOICES.sovereign.realm.burning), 'fire on its land: Sovereign minds');
}
console.log('ok   the rarer lines keep to their rests; land is radius + LAND_REACH; ash and rot go to whoever was nearest; last words, a mushroom, small talk, the woodpecker and a realm changing, staged');

// Choking on your own bead (round six A): the choker's line, at most every
// 20 s; the thanks of whoever eats what a choke spat or a cough nudged aside,
// now and then; and the woodpecker taking a colony's flag or the capital.
{ // A choke: a line, then none for 20 s; not from a snake that's out; nobody speaks for you; Copycat in Chinese.
  const g = stage(['sniper', 'copycat'], { 0: [3, 20], 1: [12, 12], 2: [12, 18] }), [you, sniper, cat] = g.snakes;
  const choke = s => [{ type: 'choke', snake: s, x: s.body[0].x, y: s.body[0].y, tx: s.body[0].x, ty: s.body[0].y - 1 }];
  check(says(tick(g, choke(sniper)), sniper, VOICES.sniper.choke), 'Sniper chokes on its own bead: a choke line');
  check(tick(g, choke(sniper), 12000).length === 0, '...and none when it chokes again 12 s later');
  check(says(tick(g, choke(sniper), 9000), sniper, VOICES.sniper.choke), '...but another 21 s after the first');
  check(tick(g, choke(you), 5000).length === 0, 'you choke: nobody speaks for you');
  check(says(tick(g, choke(cat), 5000), cat, VOICES.copycat.choke), 'Copycat chokes: in Chinese');
  sniper.alive = false;
  check(tick(g, choke(sniper), 30000).length === 0, '...and a snake that\'s out says nothing');
}
{ // A choke is news: said even just after the crash that broke the bead off had its say (a crash's bonk, then the choke on its beads 1.9 s on), but never two lines in a tick.
  const g = stage(['sniper', 'joker'], { 0: [3, 20], 1: [12, 12], 2: [12, 18] }), [, sniper, joker] = g.snakes;
  const crash = s => ({ type: 'crash', snake: s, x: s.body[0].x + 1, y: s.body[0].y, killerId: null });
  const choke = s => ({ type: 'choke', snake: s, x: s.body[0].x, y: s.body[0].y, tx: s.body[0].x, ty: s.body[0].y - 1 });
  check(says(tick(g, [crash(sniper)]), sniper, VOICES.sniper.bonk), 'Sniper crashes: its bonk line');
  let h = tick(g, [choke(sniper)], 1900);
  check(says(h, sniper, VOICES.sniper.choke), `...and chokes on the beads it broke off 1.9 s later: its choke line too ("${lineOf(h, sniper)}")`);
  check(tick(g, [crash(sniper)], 5000).length === 1 && tick(g, [choke(sniper)], 1900).length === 0, '...but it crashes and chokes again 7 s on: the bonk, and no choke line (20 s between)');
  h = tick(g, [crash(joker), choke(joker)], 30000);
  check(h.filter(x => x.s === joker).length === 1, `a crash and a choke in the same tick: one line (${h.filter(x => x.s === joker).map(x => `"${x.text}"`).join(', ')})`);
}
{ // A windfall: what a choke spat or a cough nudged aside, eaten by a rival soon after (the same tick too): thanks, half the time, at most every 30 s.
  const g = stage(['vulture', 'gobbler'], { 0: [3, 20], 1: [12, 12], 2: [12, 18] }), [you, vul, gob] = g.snakes;
  const nudge = (s, x, y, tx, ty, kind = 'food') => ({ type: 'nudge', snake: s, kind, x, y, tx, ty });
  const eat = (s, x, y, kind = 'food') => ({ type: 'eat', snake: s, kind, x, y });
  const thanks = (h, s, who) => says(h, s, VOICES[s.personaKey].windfall, who);
  let h = tick(g, [eat(vul, 4, 19, 'pellet'), { type: 'choke', snake: you, x: 4, y: 20, tx: 4, ty: 19 }]);
  check(thanks(h, vul, you), `your bead, spat aside and eaten by Vulture the same tick: "${lineOf(h, vul)}"`);
  check(tick(g, [nudge(you, 5, 20, 5, 19), eat(gob, 5, 19)], 5000, 0.6).length === 0, 'an apple your cough nudged, eaten by Gobbler, and the roll says no: nothing');
  check(tick(g, [eat(gob, 5, 19)], 5000).length === 0, '...and that settled it: another apple there later is just an apple');
  tick(g, [nudge(you, 6, 20, 6, 19)], 100);
  check(tick(g, [eat(gob, 6, 19)], 7000).length === 0, 'one eaten 7 s after it was nudged: just an apple');
  tick(g, [nudge(gob, 7, 18, 7, 17)], 100);
  check(tick(g, [eat(gob, 7, 17)], 1500).length === 0, 'Gobbler eats what its own cough nudged, once it\'s over: nothing');
  tick(g, [nudge(you, 8, 20, 8, 19)], 100);
  check(tick(g, [eat(you, 8, 19)], 500).length === 0 && tick(g, [eat(gob, 8, 19)], 500).length === 0, 'you eat what your cough nudged: nothing, and that settled it');
  tick(g, [nudge(you, 9, 9, 9, 10, 'beetle')], 5000);
  h = tick(g, [eat(gob, 11, 11, 'beetle')], 1000);
  check(thanks(h, gob, you) && !says(h, gob, VOICES.gobbler.caught), `a beetle your cough nudged scurries off, and Gobbler catches it 3 cells on: thanks, not its catch line ("${lineOf(h, gob)}")`);
  check(!thanks(tick(g, [nudge(you, 4, 4, 4, 5), eat(gob, 4, 5)], 10000), gob, you), '...and no thanks again 10 s later');
  h = tick(g, [nudge(vul, 14, 4, 14, 5), eat(gob, 14, 5)], 25000);
  check(thanks(h, gob, vul), `...but 35 s after, for an apple Vulture's cough nudged: thanks, naming Vulture ("${lineOf(h, gob)}")`);
  tick(g, [nudge(you, 2, 2, 2, 3, 'beetle')], 40000);
  h = tick(g, [eat(gob, 9, 9, 'beetle')], 1000);
  check(!thanks(h, gob, you) && says(h, gob, VOICES.gobbler.caught), 'a beetle caught far from where it was nudged: its own catch, no thanks');
}
{ // Colonist: the woodpecker pecks out a colony's flag cell and the colony is lost: it says so, even just after another line, and the peck itself goes without its "pecked" line. Planting one too many lets the oldest go: no loss.
  const g = stage(['colonist'], { 0: [3, 22], 1: [22, 2] }), [, col] = g.snakes;
  const [one, two] = col.memory.colonies = [{ x: 6, y: 6, radius: 4, n: 1 }, { x: 14, y: 8, radius: 4, n: 2 }];
  col.memory.planted = 1;
  tick(g);
  check(tick(g, [{ type: 'peck', x: 14, y: 8, cells: [K(14, 8), K(15, 8)], under: [] }], 5000).length === 0, 'the woodpecker pecks out a flag cell: no "pecked" line');
  g.holes.add(K(14, 8)); g.holes.add(K(15, 8));
  check(says(tick(g, [{ type: 'rot', x: 7, y: 7, kind: 'apple' }], 5000), col, VOICES.colonist.colony.rotten), '...rot in the other colony: its line');
  col.memory.colonies = [one]; // (the AI drops the lost colony at once)
  let h = tick(g, [], 1000);
  check(says(h, col, VOICES.colonist.colony.lost), `...and the colony is lost a second later: "${lineOf(h, col)}"`);
  col.memory.colonies = [{ x: 18, y: 18, radius: 4, n: 3 }]; col.memory.planted = 2; // (a new flag, and the oldest let go)
  h = tick(g, [], 5000);
  check(says(h, col, VOICES.colonist.flag) && !says(h, col, VOICES.colonist.colony.lost), 'a new flag, the oldest let go: a flag line, no loss');
  void two;
}
{ // Sovereign: the woodpecker pecks out its capital and the realm moves at once: it says so, even just after another line; the peck itself goes without its "pecked" line; a drift elsewhere is a plain move.
  const g = stage(['sovereign'], { 0: [3, 22], 1: [20, 2] }), [, sov] = g.snakes;
  sov.memory.home = { x: 10, y: 10, radius: 3 };
  tick(g);
  check(tick(g, [{ type: 'peck', x: 10, y: 10, cells: [K(10, 10), K(10, 11)], under: [] }], 5000).length === 0, 'the woodpecker pecks out the capital: no "pecked" line');
  g.holes.add(K(10, 10)); g.holes.add(K(10, 11));
  check(says(tick(g, [{ type: 'rot', x: 11, y: 9, kind: 'apple' }], 5000), sov, VOICES.sovereign.realm.rotten), '...rot in the realm: its line');
  sov.memory.home = { x: 12, y: 10, radius: 3 }; // (the AI moves it at once, to good land)
  let h = tick(g, [], 1000);
  check(says(h, sov, VOICES.sovereign.realm.capital), `...and the realm moves off its pecked capital a second later: "${lineOf(h, sov)}"`);
  sov.memory.home = { x: 13, y: 10, radius: 4 };
  h = tick(g, [], 5000);
  check(says(h, sov, VOICES.sovereign.realm.grow) && !says(h, sov, VOICES.sovereign.realm.capital), 'later, it grows as it drifts: a grow line, not the capital again');
  sov.memory.home = { x: 14, y: 10, radius: 4 };
  check(says(tick(g, [], 5000), sov, VOICES.sovereign.realm.move), '...and a drift off good land: a plain move');
}
console.log('ok   choking: the choker\'s line at most every 20 s; a rival who eats what a choke spat or a cough nudged aside thanks the cougher, now and then; a colony or capital the woodpecker took is news, and its peck goes without the "pecked" line');

// A cornered beetle digging in, and food the woodpecker knocks aside (round
// six A, wave two): the hunter whose beetle got away says so, at most every
// 30 s; the snake whose food was knocked to someone else grumbles at them,
// half the time, at most every 40 s.
{ // Dug in and gone: the snake that cornered it (the nearest head as it started, within BEETLE_DIG_FEAR) says so; nobody speaks for you.
  const g = stage(['gobbler', 'mason', 'copycat'], { 0: [3, 22], 1: [12, 12], 2: [12, 4], 3: [20, 20] }), [you, gob, mason, cat] = g.snakes;
  const dig = (x, y) => ({ type: 'dig', x, y, until: g.tick + 1 + T.BEETLE_DIG });
  const dive = (x, y, dug = 1) => ({ type: 'dive', x, y, dug });
  tick(g, [dig(14, 12)]); // (Gobbler's 2 cells off, Mason 10)
  let h = tick(g, [dive(14, 12)], 800);
  check(says(h, gob, VOICES.gobbler.dug) && h.length === 1, `a beetle Gobbler cornered digs in and gets away: "${lineOf(h, gob)}", and nobody else`);
  tick(g, [dig(12, 7)], 5000); // (Mason's 3 cells off, Gobbler 5)
  h = tick(g, [dive(12, 7)], 800);
  check(says(h, mason, VOICES.mason.dug) && h.length === 1, `...one Mason cornered, nearer Mason than Gobbler: Mason, in Latin ("${lineOf(h, mason)}")`);
  tick(g, [dig(13, 13)], 5000);
  check(tick(g, [dive(13, 13)], 800).length === 0, '...another of Gobbler\'s 6.5 s after its last: nothing (30 s between)');
  tick(g, [dig(12, 14)], 25000);
  check(says(tick(g, [dive(12, 14)], 800), gob, VOICES.gobbler.dug), '...but 33 s after its last: a dug line');
  tick(g, [dig(3, 19)], 5000); // (yours: 3 cells off)
  check(tick(g, [dive(3, 19)], 800).length === 0, 'a beetle you cornered: nobody speaks for you');
  tick(g, [dig(19, 20)], 40000);
  check(says(tick(g, [dive(19, 20)], 800), cat, VOICES.copycat.dug), 'Copycat\'s: in Chinese');
  check(tick(g, [dive(12, 13, 0)], 40000).length === 0, 'a scared beetle diving into a burrow by Gobbler (no digging): nothing');
  tick(g, [dig(12, 13)], 1000);
  h = tick(g, [{ type: 'eat', snake: gob, kind: 'beetle', x: 12, y: 13 }], 400);
  check(says(h, gob, VOICES.gobbler.caught), 'one Gobbler catches as it digs: its catch line');
  check(tick(g, [], 2000).length === 0, '...and no dug line after');
  tick(g, [dig(12, 15)], 40000);
  gob.alive = false;
  check(tick(g, [dive(12, 15)], 800).length === 0, 'its hunter out of the round meanwhile: nothing');
  void you;
}
{ // The hunter's reach is the engine's: a beetle digs in with a head within BEETLE_DIG_FEAR, and that head is its hunter, as far off as that; one further from every head is nobody's. (Each in a fresh round, so the hunter has a line to say.)
  const F = T.BEETLE_DIG_FEAR;
  const cornered = (x, y) => {
    const g = stage(['gobbler', 'mason', 'copycat'], { 0: [3, 22], 1: [6, 12], 2: [12, 2], 3: [22, 22] }), [, gob] = g.snakes;
    const off = Math.min(...g.snakes.map(s => Math.abs(s.body[0].x - x) + Math.abs(s.body[0].y - y)));
    tick(g, [{ type: 'dig', x, y, until: g.tick + 1 + T.BEETLE_DIG }]);
    return [tick(g, [{ type: 'dive', x, y, dug: 1 }], 800), gob, off];
  };
  let [h, gob, off] = cornered(6 + F, 12);
  check(off === F && says(h, gob, VOICES.gobbler.dug), `cornered from as far as BEETLE_DIG_FEAR (${F} cells; the nearest head ${off} off): its hunter's line ("${lineOf(h, gob)}")`);
  [h, gob, off] = cornered(7 + F, 12);
  check(off === F + 1 && h.length === 0, `...but one with no head within ${F} as it started (the nearest ${off} off): nobody's (said: ${h.map(x => `"${x.text}"`).join(', ') || 'nothing'})`);
}
{ // Knocked aside: the snake that was after it (the nearest head to where it lay at the strike, the eater's aside, within the chatter's KNOCKED_NEAR) grumbles at whoever eats it where it landed, within 6 s; every time, at most every 40 s. (Each case in a fresh round, but the rest's own.)
  const N = KNOCKED_NEAR;
  // Sovereign at 12, 12; Gobbler and Mason far off unless asked; you at 3, 22.
  const knockRound = (heads = {}) => { const g = stage(['sovereign', 'gobbler', 'mason'], { 0: [3, 22], 1: [12, 12], 2: [20, 4], 3: [4, 4], ...heads }); return [g, ...g.snakes]; };
  const knock = (x, y, tx, ty, kind = 'food') => ({ type: 'knock', kind, x, y, tx, ty });
  const eat = (s, x, y, kind = 'food') => ({ type: 'eat', snake: s, kind, x, y });
  const grumbles = (h, s, who) => says(h, s, VOICES[s.personaKey].knocked, who);
  const heardAll = h => h.map(x => `${x.s.name}: "${x.text}"`).join(', ') || 'nothing';

  let [g, you, sov, gob, mason] = knockRound();
  tick(g, [knock(12, 14, 12, 16)]);
  let h = tick(g, [eat(you, 12, 16)], 1500);
  check(grumbles(h, sov, you), `Sovereign's apple, knocked aside, and you eat it: "${lineOf(h, sov)}"`);
  tick(g, [knock(12, 14, 12, 16)], 5000);
  check(tick(g, [eat(you, 12, 16)], 1000).length === 0, '...and again 6 s later: nothing (40 s between)');
  tick(g, [knock(12, 14, 12, 16)], 40000);
  h = tick(g, [eat(gob, 12, 16)], 1000, 0.99);
  check(grumbles(h, sov, gob), `...40 s on, Gobbler eats it, whatever the roll: "${lineOf(h, sov)}" (every time, not now and then)`);

  [g, you, sov, gob] = knockRound();
  tick(g, [knock(12, 14, 12, 16)]);
  check(tick(g, [eat(sov, 12, 16)], 1000).length === 0 && tick(g, [eat(gob, 12, 16)], 500).length === 0, 'Sovereign gets there itself: nothing, and that settled it');
  [g, you, sov] = knockRound();
  tick(g, [knock(12, 14, 12, 16)]);
  check(tick(g, [eat(you, 12, 16)], 7000).length === 0, 'one eaten 7 s after it was knocked: just an apple');
  [g, you, sov] = knockRound();
  tick(g, [knock(12, 14, null, null)]);
  check(tick(g, [eat(you, 12, 14)], 1000).length === 0, 'one the bird ate (nowhere free to land): nothing');
  [g, you, sov] = knockRound();
  tick(g, [knock(12, 14, 12, 16, 'mushroom')]);
  check(tick(g, [eat(you, 12, 16, 'mushroom')], 1000).length === 0, 'a mushroom knocked aside: nobody misses it');

  // How far "after it" reaches: KNOCKED_NEAR cells from where it lay, and no further.
  const reach = d => {
    [g, you, sov, gob] = knockRound({ 0: [3, 2], 1: [4, 12], 2: [22, 2] });
    const x = 4 + d, off = Math.min(...g.snakes.map(s => Math.abs(s.body[0].x - x) + Math.abs(s.body[0].y - 12)));
    tick(g, [knock(x, 12, x + 1, 12)]);
    return [tick(g, [eat(gob, x + 1, 12)], 1000), off];
  };
  let [r, off] = reach(N);
  check(off === N && grumbles(r, sov, gob), `knocked from ${N} cells off Sovereign's head (KNOCKED_NEAR; the nearest head ${off} off): Sovereign's, and it grumbles ("${lineOf(r, sov)}")`);
  [r, off] = reach(N + 1);
  check(off === N + 1 && r.length === 0, `...from ${N + 1} off every head (the nearest ${off} off): nobody's (${heardAll(r)})`);

  // The nearest at the strike gets it: the next nearest, within reach, was after it too.
  [g, you, sov, gob] = knockRound({ 2: [12, 17] });
  tick(g, [knock(12, 15, 12, 16)]); // (Gobbler 2 off, Sovereign 3)
  h = tick(g, [eat(gob, 12, 16)], 400);
  check(grumbles(h, sov, gob), `Gobbler, nearest, gets it, with Sovereign a cell further: Sovereign grumbles at Gobbler ("${lineOf(h, sov)}")`);
  [g, you, sov, gob] = knockRound({ 0: [12, 17], 2: [20, 14] });
  tick(g, [knock(12, 15, 12, 16)]); // (you 2 off, Sovereign 3, Gobbler 9)
  check(tick(g, [eat(gob, 12, 16)], 1000).length === 0, 'you were nearest and Gobbler eats it: it was yours, and nobody speaks for you (not even Sovereign, a cell further)');

  // A bead was never its own snake's meal: whoever was after it is the next nearest.
  [g, you, sov, gob, mason] = knockRound({ 3: [16, 14] });
  g.food.push({ x: 12, y: 16, kind: 'pellet', color: sov.color, owner: sov.id });
  tick(g, [knock(12, 14, 12, 16, 'pellet')]); // (Sovereign 2 off, Mason 4)
  g.food.length = 0;
  h = tick(g, [eat(gob, 12, 16, 'pellet')], 1000);
  check(!h.some(x => x.s === sov) && grumbles(h, mason, gob), `Sovereign's own bead, knocked aside and eaten by Gobbler: not Sovereign's meal, but Mason's, who grumbles ("${lineOf(h, mason)}")`);
  [g, you, sov, gob] = knockRound();
  g.food.push({ x: 12, y: 16, kind: 'pellet', color: sov.color, owner: sov.id });
  tick(g, [knock(12, 14, 12, 16, 'pellet')]);
  g.food.length = 0;
  check(tick(g, [eat(gob, 12, 16, 'pellet')], 1000).length === 0, '...and with nobody else near: nothing');

  [g, you, sov, gob] = knockRound();
  tick(g, [knock(13, 12, 14, 10, 'beetle')]);
  h = tick(g, [eat(gob, 16, 9, 'beetle')], 1000);
  check(grumbles(h, sov, gob) && says(h, gob, VOICES.gobbler.caught), `a beetle knocked off Sovereign's patch scurries on, and Gobbler catches it 3 cells from where it landed: Sovereign grumbles ("${lineOf(h, sov)}"), and Gobbler has its catch line too`);
  [g, you, sov, gob] = knockRound();
  tick(g, [knock(12, 14, 12, 16)]);
  sov.alive = false;
  check(tick(g, [eat(gob, 12, 16)], 1000).length === 0, 'the snake that was after it out of the round meanwhile: nothing');
  void mason;
}
console.log(`ok   a beetle that digs in and gets away: its hunter (the nearest head as it dug, within ${T.BEETLE_DIG_FEAR}) says so, at most every 30 s, and nobody for you; food the woodpecker knocked aside, eaten soon after: the snake that was after it (the nearest head to where it lay, the eater's aside, within ${KNOCKED_NEAR}) grumbles at the eater, every time, at most every 40 s`);

// Star shows off: any flash of its own, its jumps and golden dashes, and its
// flash back from its rest, half the time and all together at most every 10 s
// (a golden dash or jump, rarer, whenever it can).
const STAR = VOICES.star;
{
  const g = stage(['star'], { 0: [3, 22], 1: [12, 12] }), [you, star] = g.snakes;
  const flash = (s = star) => [{ type: 'dash', snake: s, x: 10, y: 12, n: 2, plain: 1 }];
  const jump = (gold = 0) => [{ type: 'leap', snake: star, x: 12, y: 12, gold, reach: 2 }];
  const dash = () => [{ type: 'dash', snake: star, x: 9, y: 12, n: 3 }];
  check(tick(g, flash(), 100, 0.6).length === 0, 'Star flashes, and the roll says not this time: nothing');
  check(says(tick(g, flash(), 5000), star, STAR.zoom), 'Star flashes with nobody near: a zoom line (anyone else says nothing)');
  check(tick(g, flash(), 5000).length === 0, '...and none for its next flash, 5 s later');
  check(says(tick(g, jump(1), 3000, 0.6), star, STAR.leap), '...but a golden jump 8 s after: a leap line all the same, whatever the roll');
  check(tick(g, jump(), 2500).length === 0, '...and that starts the rest too: nothing for a plain jump 2.5 s later');
  check(says(tick(g, jump(), 8000), star, STAR.leap), '...but a plain jump 10.5 s after: a leap line');
  check(says(tick(g, dash(), 5000, 0.6), star, STAR.dash), 'a golden dash 5 s later: a dash line all the same, whatever the roll');
  check(tick(g, flash(), 5000).length === 0, '...and a flash 5 s after that: nothing');
  let h = tick(g, [...dash(), { type: 'cut', snake: you, x: 3, y: 22, lost: 2, by: star.id }], 10500);
  check(says(h, star, STAR.snip, you) && !says(h, star, STAR.dash), `a golden dash that cuts your tail off: Star's snip, not its dash line (said: ${lineOf(h, star)})`);
  star.flashReadyAt = g.time + 10600;
  check(tick(g, [], 10000).length === 0, 'resting: nothing yet');
  check(tick(g, [], 700).length === 0, '...its flash back from its rest: nothing yet (it flashes the moment it can, as a rule)');
  check(says(tick(g, [], 1000), star, STAR.ready), '...but still back a second later: a ready line');
  star.flashReadyAt = g.time + 12000;
  tick(g, [], 11900);
  check(tick(g).length === 0, 'its rest over again: nothing yet');
  star.flashReadyAt = g.time + 100 + T.FLASH_COOLDOWN_MS; // (it flashes the tick after its rest ends, as its AI does)
  h = tick(g, flash());
  check(says(h, star, STAR.zoom), `...and it flashes a tick later: the flash has the word (said: ${lineOf(h, star)})`);
  check(!says(tick(g, [], 1000), star, STAR.ready) && !says(tick(g, [], 1000), star, STAR.ready), '...and no ready line after it');
  star.flashReadyAt = g.time + 12000;
  tick(g, [], 11900);
  star.flashReadyAt = g.time + 100 + T.FLASH_COOLDOWN_MS; // (as when it flashes the moment its rest ends: resting again at once)
  check(!says(tick(g), star, STAR.ready) && !says(tick(g, [], 1000), star, STAR.ready), 'a rest that ends in another flash on the same tick: no ready line either');
  tick(g, [], 20000); tick(g, [], 1000); // (its rest is over: it may say so)
  check(tick(g, flash(you), 20000).length === 0 && tick(g, [{ type: 'leap', snake: you, x: 3, y: 22, gold: 1 }], 20000).length === 0, 'your flashes and jumps: nobody speaks for you');
  you.body = at(13, 13);
  check(says(tick(g, flash(), 20000), star, STAR.flash.past, you), 'Star flashes past your head: a flash.past line, naming you');
}
{ // While its flash rests, Star's small talk grumbles (as often as not); rested, it's small talk.
  let g = stage(['star'], { 0: [3, 22], 1: [12, 12] }), [you, star] = g.snakes;
  star.flashReadyAt = g.time + 20000;
  check(says(tick(g, [], 4000, 0.01), star, STAR.resting, you), `resting: a grumble (said: ${lineOf(heard, star)})`);
  g = stage(['star'], { 0: [3, 22], 1: [12, 12] }); [you, star] = g.snakes;
  check(says(tick(g, [], 4000, 0.01), star, STAR.idle, you), `rested: its small talk (said: ${lineOf(heard, star)})`);
}
{ // Golden power food: Star crows over a golden beetle, even just after another line; a golden leaf's flashes it spends there and then, so it cheers them as it eats it; a golden mushroom, its wrap. Anyone else's lines are as they were.
  const g = stage(['star', 'gobbler'], { 0: [3, 22], 1: [12, 12], 2: [12, 18] }), [, star, gob] = g.snakes;
  check(says(tick(g, [{ type: 'dash', snake: star, x: 10, y: 12, n: 2, plain: 1 }], 100, 0.2), star, STAR.zoom), 'Star shows off');
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'beetle', x: 12, y: 12, gold: true }], 1000), star, STAR.stash), '...and eats a golden beetle a second later: a stash line all the same');
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'leaf', x: 12, y: 12, gold: false }], 1000), star, STAR.dash), '...a golden leaf a second after that: a golden dash line (it spends them at once)');
  check(tick(g, [{ type: 'dash', snake: star, x: 9, y: 12, n: 3 }]).length === 0, '...and its golden dash a tick later: no second word');
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'goldcap', x: 12, y: 12, gold: false }], 5000), star, STAR.wrap), '...a golden mushroom: a wrap line');
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'golden', x: 12, y: 12, gold: false }], 5000), star, STAR.golden), '...a golden apple: a golden line');
  check(says(tick(g, [{ type: 'eat', snake: gob, kind: 'beetle', x: 12, y: 18, gold: true }], 5000), gob, VOICES.gobbler.caught), 'Gobbler eats a golden beetle: still a caught line');
  const h = tick(g, [{ type: 'spawn', kind: 'beetle', x: 20, y: 20, gold: 1 }], 5000);
  check(says(h, star, STAR.goldbug) && says(h, gob, VOICES.gobbler.goldbug), 'a golden beetle comes out: Star wants it too');
}
{ // A rainbow: Star's own colours, so it's first to say so, even just after another line; with Star out, someone else does.
  const g = stage(['gobbler', 'star', 'colonist'], { 0: [3, 22], 1: [12, 4], 2: [12, 12], 3: [12, 20] }), [, gob, star, col] = g.snakes;
  let h = tick(g, [{ type: 'rainbow', x: 5, y: 5 }]);
  check(says(h, star, STAR.rainbow) && h.length === 1, `a rainbow: Star says so ("${lineOf(h, star)}")`);
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'golden', x: 12, y: 12 }], 60000), star, STAR.golden), 'Star eats a golden apple');
  h = tick(g, [{ type: 'rainbow', x: 5, y: 5 }], 1000);
  check(says(h, star, STAR.rainbow) && h.length === 1, `...and a rainbow a second later: Star says so all the same ("${lineOf(h, star)}")`);
  h = tick(g, [{ type: 'leap', snake: star, x: 12, y: 12, gold: 1, reach: 2 }, { type: 'rainbow', x: 5, y: 5 }], 60000);
  check(says(h, star, STAR.leap) && h.filter(x => x.s === star).length === 1 && (says(h, gob, VOICES.gobbler.rainbow) || says(h, col, VOICES.colonist.rainbow)),
    'a rainbow in the very tick Star cheers its golden jump: one line at a time from Star (someone else greets the rainbow)');
  star.alive = false;
  h = tick(g, [{ type: 'rainbow', x: 5, y: 5 }], 60000);
  check(h.length === 1 && (says(h, gob, VOICES.gobbler.rainbow) || says(h, col, VOICES.colonist.rainbow)), 'a rainbow with Star out: someone else remarks on it');
}
{ // Star's kill and its being cut, a second after it showed off: their lines all the same.
  const g = stage(['star', 'sovereign', 'gobbler'], { 0: [3, 22], 1: [12, 12], 2: [12, 4], 3: [12, 18] }), [, star, sov, gob] = g.snakes;
  check(says(tick(g, [{ type: 'dash', snake: star, x: 10, y: 12, n: 2, plain: 1 }], 100, 0.2), star, STAR.zoom), 'Star shows off');
  gob.alive = false; gob.killer = star.name; gob.killerId = star.id;
  let h = tick(g, [{ type: 'death', snake: gob }], 1000);
  check(says(h, star, STAR.kill, gob), `...and knocks Gobbler out a second later: a kill line all the same (said: ${lineOf(h, star)})`);
  h = tick(g, [{ type: 'cut', snake: star, x: 11, y: 12, lost: 2, by: sov.id }], 1000);
  check(says(h, star, STAR.cut, sov) && says(h, sov, VOICES.sovereign.snip, star), `...and is cut by Sovereign's golden dash a second after that: a cut line all the same (said: ${lineOf(h, star)})`);
}
{ // Anyone's golden dash that cuts someone leaves the words to its snip (a tail off) or its kill line (in two): they say more than a dash line. Failing those, its dash line.
  const g = stage(['sovereign', 'gobbler'], { 0: [3, 22], 1: [12, 12], 2: [12, 18] }), [you, sov, gob] = g.snakes;
  const dash = () => ({ type: 'dash', snake: sov, x: 9, y: 12, n: 3 });
  let h = tick(g, [dash(), { type: 'cut', snake: you, x: 3, y: 22, lost: 2, by: sov.id }]);
  check(says(h, sov, VOICES.sovereign.snip, you) && !says(h, sov, VOICES.sovereign.dash), `a golden dash that cuts your tail off: the dasher's snip (said: ${lineOf(h, sov)})`);
  gob.alive = false; gob.killer = sov.name; gob.killerId = sov.id; gob.fatal = 'cut';
  h = tick(g, [dash(), { type: 'death', snake: gob }], 6000);
  check(says(h, sov, VOICES.sovereign.kill, gob) && !says(h, sov, VOICES.sovereign.dash), `...one that cuts Gobbler in two: its kill line (said: ${lineOf(h, sov)})`);
  h = tick(g, [dash(), { type: 'cut', snake: you, x: 3, y: 22, lost: 2, by: sov.id }], 6000);
  check(says(h, sov, VOICES.sovereign.dash), `...and another that cuts your tail, its one snip said only lately: its dash line after all (said: ${lineOf(h, sov)})`);
}
{ // Now and then a rival answers Star's showing off, a moment later, naming it: not every time, and not again for 40 s.
  for (const [k, list] of [['wildcard', VOICES.wildcard.showoff], ['mason', VOICES.mason.showoff]]) {
    const g = stage(['star', k], { 0: [3, 22], 1: [12, 12], 2: [20, 4] }), [, star, other] = g.snakes;
    const flash = () => [{ type: 'dash', snake: star, x: 10, y: 12, n: 2, plain: 1 }];
    check(says(tick(g, flash(), 100, 0.2), star, STAR.zoom), `with ${k}: Star shows off`);
    check(tick(g, [], 600).length === 0, '...not answered at once');
    const h = tick(g, [], 600);
    check(says(h, other, list, star), `...a moment later, ${k} answers: "${lineOf(h, other)}"`);
    check(says(tick(g, flash(), 12000, 0.2), star, STAR.zoom) && tick(g, [], 1200).length === 0, '...and not again for a while (12 s later)');
    check(says(tick(g, flash(), 30000, 0.3), star, STAR.zoom) && tick(g, [], 1200).length === 0, '...nor when the roll says no (43 s later: 0.3, against 0.25)');
    check(says(tick(g, flash(), 12000, 0.2), star, STAR.zoom) && says(tick(g, [], 1200), other, list, star), '...but 56 s later, yes');
  }
}
console.log('ok   Star shows off its flashes, jumps, golden dashes and flash back (half the time, every 10 s at most; a golden one whenever it can; its flash back only once it\'s been back a second), grumbles while it rests, crows over golden things and greets a rainbow first, even just after another line, as it does its kill or a cut; Wildcard and Mason answer it now and then; a golden dash that cuts leaves the words to the snip or the kill');

// The power habit at its worst: Star flashing the tick after its rest is over
// (as its AI does) and jumping every 4 s for three minutes, with you, Wildcard
// and Mason by it (all still), and the chatter's own chances: how often it
// shows off, and is answered (and never says its flash is back: it isn't, for long).
{
  rng = seeded(7);
  const g = stage(['star', 'wildcard', 'mason'], { 0: [3, 22], 1: [12, 12], 2: [20, 4], 3: [4, 4] }), [, star] = g.snakes;
  const shows = new Set(['zoom', 'leap', 'dash', 'ready', 'flash.first', 'flash.past'].flatMap(k => k.split('.').reduce((o, p) => o[p], STAR)));
  const answers = new Set([...VOICES.wildcard.showoff, ...VOICES.mason.showoff].map(l => l.replaceAll('{who}', star.name)));
  const ready = new Set(STAR.ready);
  let showed = [], answered = 0, said = 0, readied = 0;
  for (let t = 0; t < 1800; t++) {
    g.tick++; g.time += 100;
    const events = [];
    if (g.time >= star.flashReadyAt + 100) { star.flashReadyAt = g.time + T.FLASH_COOLDOWN_MS; events.push({ type: 'dash', snake: star, x: 10, y: 12, n: 2, plain: 1 }); }
    if (t % 40 === 20) events.push({ type: 'leap', snake: star, x: 12, y: 12, gold: 0, reach: 2 });
    g.events = events; heard = [];
    C.update();
    for (const x of heard) {
      if (x.s === star) { said++; if (shows.has(x.text)) showed.push(g.time); if (ready.has(x.text)) readied++; }
      if (answers.has(x.text)) answered++;
    }
  }
  const gaps = showed.slice(1).map((t, i) => t - showed[i]);
  check(Math.min(...gaps) >= 10000, `showing off at its worst: never twice within 10 s (closest ${Math.min(...gaps) / 1000} s)`);
  check(showed.length >= 6 && showed.length <= 18, `...but often: ${showed.length} times in 3 minutes (every ${(180 / showed.length).toFixed(1)} s on average), ${said} lines in all`);
  check(answered >= 1 && answered <= 5, `...answered ${answered} times`);
  check(readied === 0, `...and its flash back, a tick before it flashes again: no ready line (${readied})`);
  console.log(`ok   Star at its most addicted (a flash every 6 s, a jump every 4): shows off ${showed.length} times in 3 minutes, never within 10 s (closest ${Math.min(...gaps) / 1000} s); ${said} lines in all; answered ${answered} times`);
}

// The names in the log: a colour too dark for the log's wood is lightened
// just enough to read (LOG_CONTRAST against LOG_WOOD, read from the chatter),
// keeping its hue and saturation, so every name keeps its snake's colour:
// Copycat's is the flag's red, not the pink that mixing it toward white made
// (as vivid as the old pink, #fca5a5, was pale: OKLCH chroma), and the
// cast's reds stay apart. One that reads already is left as it is.
{
  const [wood, need] = [JSON.parse(/\bLOG_WOOD = (\[[\d, ]+\])/.exec(src)[1]), +/\bLOG_CONTRAST = ([\d.]+)/.exec(src)[1]];
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const rgbOf = css => css.startsWith('#') ? [1, 3, 5].map(i => parseInt(css.slice(i, i + 2), 16)) : css.match(/\d+/g).map(Number);
  const hsl = c => { const [r, g, b] = c.map(v => v / 255), hi = Math.max(r, g, b), lo = Math.min(r, g, b), d = hi - lo; return [!d ? 0 : 60 * (hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4), !d ? 0 : d / (1 - Math.abs(hi + lo - 1))]; };
  const chroma = c => { const [r, g, b] = c.map(lin), l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b); return Math.hypot(1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s); };
  const g = stage(['copycat']);
  const named = (name, color, persona) => { C.replay({ id: 90, name, color, persona, alive: false, body: [] }, 'Hm.'); return logEl.children[0].children[0].style.color; };
  const shown = {};
  for (const p of Object.values(E.PERSONAS)) {
    const own = p.ink || p.color, out = named(p.name, p.color, p), [o, n] = [rgbOf(own), rgbOf(out)];
    shown[p.name] = n;
    check(contrast(n, wood) >= need - 0.05, `${p.name}'s name in the log reads on the wood: ${out} (${contrast(n, wood).toFixed(2)}:1, at least ${need})`);
    if (contrast(o, wood) >= need) check(out === own, `${p.name}'s ${own} reads there already: left as it is (${out})`);
    else {
      const [[h0, s0], [h1, s1]] = [hsl(o), hsl(n)];
      check(Math.abs(((h1 - h0 + 540) % 360) - 180) < 3 && Math.abs(s1 - s0) < 0.06, `${p.name}'s ${own}, lightened to ${out}, keeps its hue (${h0.toFixed(0)}° -> ${h1.toFixed(0)}°) and saturation (${s0.toFixed(2)} -> ${s1.toFixed(2)})`);
    }
  }
  check(named('Green', E.PLAYER_COLOR, null) === E.PLAYER_COLOR, `your green reads on the wood as it is (${E.PLAYER_COLOR})`);
  const friends = JSON.parse(/\bHUMAN_COLORS = (\[[^\]]+\])/.exec(fs.readFileSync(path.join(ROOT, 'online.js'), 'utf8'))[1].replaceAll("'", '"'));
  for (const c of friends) check(named('Friend', c, null) === c, `a friend's ${c} online reads on the wood as it is`);
  const cat = shown.Copycat, pink = rgbOf('#fca5a5');
  check(chroma(cat) > 1.4 * chroma(pink), `Copycat's name is the flag's red, not pink: rgb(${cat}), OKLCH chroma ${chroma(cat).toFixed(3)} (the old pink ${chroma(pink).toFixed(3)})`);
  for (const other of ['Sniper', 'Colonist', 'Wildcard']) check(Math.hypot(...cat.map((v, i) => v - shown[other][i])) > 20, `...and apart from ${other}'s rgb(${shown[other]}) in the log`);
  void g;
  console.log(`ok   names in the log read on its wood (${need}:1), keeping their colours' hue and saturation: Copycat rgb(${cat}), the flag's red; Sniper rgb(${shown.Sniper}), Colonist rgb(${shown.Colonist}), Wildcard rgb(${shown.Wildcard})`);
}

// Whole rounds of rivals with the chatter listening: nothing throws, and it talks.
// (These two, with what's staged above, run every line of chatter.js that six
// rounds did, four of them with rivals at random.)
{
  let total = 0, rounds = 0;
  const per = {};
  // (Chokes and what coughs knocked aside, beetles that dug in and got away, and food the woodpecker knocked aside, as the engine has them, and the lines for them.)
  const chokeLines = new Set(Object.values(VOICES).flatMap(v => v.choke || []));
  const esc = s => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  const thanks = Object.values(VOICES).flatMap(v => v.windfall || []).map(l => new RegExp(`^${l.split('{who}').map(esc).join('.+')}$`));
  const dugLines = new Set(Object.values(VOICES).flatMap(v => v.dug || []));
  const grumbles = Object.values(VOICES).flatMap(v => v.knocked || []).map(l => new RegExp(`^${l.split('{who}').map(esc).join('.+')}$`));
  let chokes = 0, knocked = 0, choked = 0, thanked = 0, dugOut = 0, dug = 0, knocks = 0, grumbled = 0;
  // The woodpecker's knocked food, by the rule (see "Knocked aside" above),
  // as the engine has it: a grumble is only ever the rule's, from whoever was
  // after a piece eaten this tick, at its eater; and every piece eaten where
  // it landed, with a rival after it that's free to speak (no line in its
  // gap or this tick, no grumble within the rests, a line of its own left to
  // say), draws that rival's grumble.
  const [KMS, KREST, GAP, LREST, ROAM] = ['KNOCKED_MS', 'KNOCKED_REST', 'SNAKE_GAP', 'LINE_REST', 'BEETLE_ROAM'].map(k => +new RegExp(`\\b${k} = (\\d+)`).exec(src)[1]);
  const grumbleLines = Object.values(VOICES).flatMap(v => v.knocked || []).map(l => [l, new RegExp(`^${l.split('{who}').map(esc).join('.+')}$`)]);
  const isGrumble = text => grumbleLines.find(([, re]) => re.test(text))?.[0];
  const knockWatch = { picks: 0, free: 0, said: 0, missed: [], stray: [] };
  const watchKnocks = () => {
    const open = [], spoke = {}, grumbledAt = {}, told = new Set();
    return (g, heardNow) => {
      const now = g.time;
      while (open.length && now - open[0].at > KMS) open.shift();
      for (const e of g.events) if (e.type === 'knock' && e.tx != null && e.kind !== 'mushroom') {
        const bead = e.kind === 'pellet' ? g.food.find(f => f.x === e.tx && f.y === e.ty && f.kind === 'pellet')?.owner : undefined;
        const near = g.snakes.filter(o => o.alive && o.id !== bead).map(o => [o, Math.abs(o.body[0].x - e.x) + Math.abs(o.body[0].y - e.y)]).filter(([, k]) => k <= KNOCKED_NEAR).sort((a, b) => a[1] - b[1]).map(([o]) => o);
        open.push({ x: e.tx, y: e.ty, beetle: e.kind === 'beetle', near, at: now });
      }
      const due = [];
      for (const e of g.events) if (e.type === 'eat') {
        const i = open.findIndex(r => r.beetle ? e.kind === 'beetle' && Math.abs(r.x - e.x) + Math.abs(r.y - e.y) <= ROAM : r.x === e.x && r.y === e.y);
        if (i < 0) continue;
        const pick = open.splice(i, 1)[0].near.find(o => o !== e.snake);
        if (pick?.persona && pick.alive) due.push([pick, e.snake]);
      }
      const grumbles = heardNow.filter(x => isGrumble(x.text));
      for (const x of grumbles) if (!due.some(([p, eater]) => p === x.s && x.text.includes(eater.name))) knockWatch.stray.push(`${x.s.name}: "${x.text}" at ${(now / 1000).toFixed(1)} s`);
      for (const [p, eater] of due) {
        knockWatch.picks++;
        const said = grumbles.find(x => x.s === p && x.text.includes(eater.name));
        const own = (VOICES[p.personaKey].knocked || []).filter(l => !(PUNCHLINES.includes(l) && told.has(l)));
        const free = !said ? !(now - (spoke[p.id] ?? -Infinity) < GAP) && !heardNow.some(x => x.s === p) && !(now - (grumbledAt[p.id] ?? -Infinity) < Math.max(KREST, LREST)) && own.length && !(p.personaKey === 'capricious' && p.memory.mood) : true;
        if (free) knockWatch.free++;
        if (said) { knockWatch.said++; grumbledAt[p.id] = now; spoke[p.id] = now; } else if (free) knockWatch.missed.push(`${p.name}, after a piece ${eater.name} ate at ${(now / 1000).toFixed(1)} s`);
      }
      for (const x of heardNow) { spoke[x.s.id] = now; const l = isGrumble(x.text); if (l) told.add(l); }
    };
  };
  for (let r = 0; r < 1; r++) {
    rng = seeded(31 + r * 7919);
    const g = E.createGame({ withPlayer: false, personas: ['sovereign', 'colonist', 'vulture', 'capricious'] });
    C.reset(g);
    const knocking = watchKnocks();
    while (g.snakes.filter(s => s.alive).length > 1 && g.time < 400000) {
      E.step(g);
      heard = [];
      C.update();
      knocking(g, heard);
      total += heard.length;
      for (const x of heard) per[x.s.personaKey] = (per[x.s.personaKey] || 0) + 1;
      for (const e of g.events) { if (e.type === 'choke') chokes++; if (e.type === 'choke' || e.type === 'nudge') knocked++; if (e.type === 'dive' && e.dug) dugOut++; if (e.type === 'knock') knocks++; }
      for (const x of heard) { if (chokeLines.has(x.text)) choked++; if (thanks.some(t => t.test(x.text))) thanked++; if (dugLines.has(x.text)) dug++; if (grumbles.some(t => t.test(x.text))) grumbled++; }
    }
    rounds++;
  }
  check(total > 20 * rounds, `whole rounds: the rivals talk (${total} lines in ${rounds} rounds)`);
  check(choked <= chokes && thanked <= knocked, `...a choke line only for a choke (${choked} of ${chokes}), thanks only for food knocked aside (${thanked} for ${knocked} pieces)`);
  check(dug <= dugOut && grumbled <= knocks, `...a dug line only for a beetle that dug in and got away (${dug} of ${dugOut}), a grumble only for food the woodpecker knocked aside (${grumbled} for ${knocks} pieces)`);
  console.log(`ok   ${rounds} whole AI round${rounds > 1 ? 's' : ''} of Sovereign, Colonist, Vulture and Capricious with the chatter listening: ${total} lines, nothing thrown (${chokes} chokes, ${choked} remarked on; ${knocked} pieces spat or nudged aside, ${thanked} thanks; ${dugOut} beetles dug in and away, ${dug} remarked on; ${knocks} pieces the woodpecker knocked aside, ${grumbled} grumbles)`);
  // ...and one with Star, the rivals who answer it and Copycat (who repeats it in Chinese).
  let star = 0, zh = 0;
  for (let r = 0; r < 1; r++) {
    rng = seeded(97 + r * 7919);
    const g = E.createGame({ withPlayer: false, personas: ['star', 'wildcard', 'mason', 'copycat'] });
    C.reset(g);
    const knocking = watchKnocks();
    while (g.snakes.filter(s => s.alive).length > 1 && g.time < 400000) {
      E.step(g);
      heard = [];
      C.update();
      knocking(g, heard);
      for (const x of heard) { if (x.s.personaKey === 'star') star++; if (x.s.personaKey === 'copycat' && /[一-鿿]/.test(x.text) && !x.text.includes('{')) zh++; }
    }
  }
  check(star > 5, `a whole round with Star: it talks (${star} lines)`);
  console.log(`ok   a whole AI round with Star, Wildcard, Mason and Copycat: Star ${star} lines, Copycat ${zh} in Chinese, nothing thrown`);
  // (--rounds N: N more whole rounds, of four rivals at random, to see the
  // woodpecker's knocked food and the grumbles over many: they're rare, a
  // round or two in ten.)
  const more = process.argv.includes('--rounds') ? Number(process.argv[process.argv.indexOf('--rounds') + 1]) : 0;
  let heardGrumbles = 0, minutes = 0;
  for (let r = 0; r < more; r++) {
    rng = seeded(7 * 100003 + r * 7919);
    const pool = [...keys], cast = [];
    while (cast.length < 4) cast.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    const g = E.createGame({ withPlayer: false, personas: cast });
    C.reset(g);
    const knocking = watchKnocks();
    while (g.snakes.filter(s => s.alive).length > 1 && g.time < 400000) {
      E.step(g);
      heard = [];
      C.update();
      knocking(g, heard);
      heardGrumbles += heard.filter(x => isGrumble(x.text)).length;
    }
    minutes += g.time / 60000;
  }
  if (more) console.log(`ok   ${more} more whole AI rounds of four rivals at random (${(minutes / more).toFixed(1)} min a round): ${heardGrumbles} grumbles at food the woodpecker knocked aside (${(heardGrumbles / more).toFixed(2)} a round)`);
  check(!knockWatch.stray.length, `the whole rounds: a grumble only from whoever was after a piece the woodpecker knocked aside, at its eater (stray: ${knockWatch.stray.join('; ') || 'none'})`);
  check(!knockWatch.missed.length, `...and one for every such piece eaten while that rival was free to speak (${knockWatch.free}; missed: ${knockWatch.missed.join('; ') || 'none'})`);
  console.log(`ok   the whole rounds' knocked food: ${knockWatch.picks} pieces eaten with a rival after them (the nearest to where each lay, the eater aside, within ${KNOCKED_NEAR}), ${knockWatch.free} of those rivals free to speak, ${knockWatch.said} grumbles, none stray`);
}

// ------------------------------------------------------------ the sound's gaps
// audio.js on a stand-in AudioContext whose nodes take any call: a cue that
// plays builds its voice (a gain), one its gap holds back builds nothing.
// Yours never waits on a rival's (now that every rival flashes a few times a
// minute, it would swallow yours); a rival's gives way to yours. And your own
// golden dashes or jumps, one straight after another, are each heard.
{
  const asrc = fs.readFileSync(path.join(ROOT, 'audio.js'), 'utf8');
  const head = '  const MIN_INTERVAL = {', start = asrc.indexOf(head), end = asrc.indexOf('\n  };\n', start);
  if (start < 0 || end < 0) throw new Error('no MIN_INTERVAL in audio.js');
  const GAP = new Function(`return ${asrc.slice(start + head.length - 1, end + '\n  }'.length)}`)();
  // The quickest your own can come again: a dash the very next tick, a jump the
  // tick after it lands; at full speed, and dealt out a frame early on a 30 Hz screen.
  const FRAME = 1000 / 30;
  const soonest = { dash: T.MIN_TICK - FRAME, leap: 2 * T.MIN_TICK - FRAME };
  for (const [cue, ms] of Object.entries(soonest)) check(GAP[cue] < ms, `the '${cue}' gap (${GAP[cue]} ms) is under the quickest your own can come again (${ms.toFixed(0)} ms)`);
  // (You can choke again as soon as your cough is over: both are heard again.)
  const again = T.COUGH_TICKS * T.MIN_TICK - FRAME;
  for (const cue of ['choke', 'cough']) check(GAP[cue] < again, `the '${cue}' gap (${GAP[cue]} ms) is under the soonest you can choke again (${again.toFixed(0)} ms)`);
  // (A beetle digs in again only once it's been under and come out, and the
  // woodpecker strikes again only after a rest and an aim: each is heard.)
  const digAgain = (T.BEETLE_DIG + T.BEETLE_UNDER_MIN) * T.MIN_TICK - FRAME, strikeAgain = (T.PECK_REST_MIN + T.PECK_AIM_TICKS) * T.MIN_TICK - FRAME;
  check(GAP.dig < digAgain, `the 'dig' gap (${GAP.dig} ms) is under the soonest a beetle can dig in again (${digAgain.toFixed(0)} ms)`);
  check(GAP.knock < strikeAgain, `the 'knock' gap (${GAP.knock} ms) is under the soonest the woodpecker can strike again (${strikeAgain.toFixed(0)} ms)`);
  let clock = 0, gains = 0;
  const stub = () => new Proxy(function () { return stub(); }, {
    get: (f, k) => (k in f || typeof k === 'symbol' ? f[k] : (f[k] = stub())),
  });
  class Context {
    constructor() { this.state = 'suspended'; this.sampleRate = 8000; this.destination = stub(); }
    get currentTime() { return clock / 1000; }
    resume() { this.state = 'running'; this.onstatechange?.(); }
    suspend() { this.state = 'suspended'; }
    createGain() { gains++; return stub(); }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  }
  for (const m of ['createDynamicsCompressor', 'createBiquadFilter', 'createOscillator', 'createBufferSource', 'createStereoPanner', 'createPeriodicWave']) Context.prototype[m] = stub;
  const actx = vm.createContext({
    window: { AudioContext: Context, performance: { now: () => clock } },
    document: { hidden: false, addEventListener() {} }, setTimeout: () => 0, clearTimeout() {},
  });
  vm.runInContext(asrc, actx, { filename: 'audio.js' });
  const A = actx.window.SnakeAudio;
  check(A.unlock(), 'the sound unlocks on the stand-in context');
  const sounds = (name, opts) => { const before = gains; A.play(name, opts); return gains > before; };
  const RIVAL = { rival: true, pan: 0.4 };
  // (Each case starts well apart from the last, so nothing earlier is still sounding or resting.)
  for (const cue of ['flash', 'dash', 'leap', 'alight', 'wrap', 'choke', 'cough', 'dig', 'knock']) {
    const gap = GAP[cue];
    check(gap > 0, `'${cue}' has a gap`);
    clock += 5000;
    sounds(cue, RIVAL);
    check(sounds(cue), `your ${cue} in the same moment as a rival's still sounds`);
    clock += 5000;
    sounds(cue, RIVAL); clock += gap / 3;
    check(sounds(cue), `your ${cue} just after a rival's still sounds`);
    clock += 5000;
    sounds(cue); clock += gap / 3;
    check(!sounds(cue, RIVAL), `a rival's ${cue} just after yours gives way`);
    clock += 5000;
    check(sounds(cue, RIVAL), `a rival's ${cue} sounds`); clock += gap / 3;
    check(!sounds(cue, RIVAL), `...another rival's ${gap / 3} ms later waits`); clock += gap;
    check(sounds(cue, RIVAL), `...and one ${gap} ms after that sounds`);
    clock += 5000;
    check(sounds(cue), `your ${cue} sounds`); clock += gap / 3;
    check(!sounds(cue), `...your next ${gap / 3} ms later waits (bursts don't stack)`); clock += gap;
    check(sounds(cue), `...and your next ${gap} ms after that sounds`);
  }
  for (const [cue, ms] of Object.entries(soonest)) {
    clock += 5000;
    sounds(cue, { gold: true }); clock += ms;
    check(sounds(cue, { gold: true }), `your golden ${cue} ${ms.toFixed(0)} ms after your last still sounds`);
  }
  // The cough comes a beat after the choke (delay): its gap counts from when it was asked for.
  clock += 5000;
  check(sounds('choke') && sounds('cough', { delay: 0.3 }), 'your choke, and your cough a beat later: both');
  clock += 300;
  check(!sounds('cough'), '...and another cough asked for as that one sounds waits (a cough never loops)');
  clock += again;
  check(sounds('choke') && sounds('cough', { delay: 0.3 }), '...but your next choke and cough, as soon as you can choke again, sound');
  // A beetle digging in, the woodpecker knocking food aside and a burrow
  // closing over are the world's: two beetles digging in together, the pieces
  // one strike knocks aside, or two burrows closing over as two digs end
  // together, are one sound; the next is heard as soon as it can come again
  // (a burrow closes over only as a dig ends: the same beetle's next, after a
  // spell under).
  check(GAP.heal > 0 && GAP.heal < digAgain, `the 'heal' gap (${GAP.heal} ms) is under the soonest a beetle can dig in again and close another (${digAgain.toFixed(0)} ms)`);
  for (const [cue, ms] of [['dig', digAgain], ['knock', strikeAgain], ['heal', digAgain]]) {
    clock += 5000;
    check(sounds(cue, { pan: -0.4 }) && !sounds(cue, { pan: 0.3 }), `a ${cue}, and another in the same moment: one sound`);
    clock += ms;
    check(sounds(cue, { pan: 0.3 }), `...and the next, ${ms.toFixed(0)} ms on, sounds`);
  }
  clock += 5000;
  A.setMuted(true);
  check(!sounds('choke') && !sounds('cough', { delay: 0.3 }) && !sounds('choke', RIVAL), 'muted: no choke, no cough, yours or a rival\'s');
  check(!sounds('dig') && !sounds('knock') && !sounds('knock', RIVAL) && !sounds('heal'), '...no dig, no knock, no burrow closing over');
  A.setMuted(false);
  check(sounds('choke') && sounds('cough', { delay: 0.3 }) && sounds('dig') && sounds('knock') && sounds('heal'), '...and with the sound back on, all of them');
  console.log('ok   the sound: a rival\'s flash, dash, jump, catching fire, golden mushroom, choke or cough never swallows yours, and gives way to it; your own golden dashes and jumps on each other\'s heels are each heard, and your choke and cough each time you can choke; a beetle digging in, the woodpecker knocking food aside and a burrow closing over, one sound a moment and each time they can come again; muted, none');
}

// ------------------------------------------------------------ the sound over the music
// What carries over the music (measured offline, over the music as it's
// written every frame: see DESIGN): a rival's dig keeps its legs' scratches
// round its dulling (RIVAL_LOWPASS, which took them off), as soft as the rest
// of it; and a burrow closing over has flecks of sawdust high enough to carry,
// and a crumble louder than a beetle's scrabble (which the music buries). On a
// stand-in context that records how each cue is wired.
{
  const asrc = fs.readFileSync(path.join(ROOT, 'audio.js'), 'utf8');
  const [LOWPASS, RIVAL_VOLUME] = [+/\bRIVAL_LOWPASS = (\d+)/.exec(asrc)[1], +/\bRIVAL_VOLUME = ([\d.]+)/.exec(asrc)[1]];
  let clock = 0;
  const made = [];
  const param = () => { const p = { value: 0, peak: 0 }; for (const m of ['setValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues']) p[m] = () => p; p.linearRampToValueAtTime = v => { p.peak = Math.max(p.peak, v); return p; }; return p; };
  const node = kind => { const n = { kind, to: [], gain: param(), frequency: param(), Q: param(), pan: param(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(), connect: t => { n.to.push(t); return t; }, disconnect() {}, start() {}, stop() {}, setPeriodicWave() {} }; made.push(n); return n; };
  class Recorder {
    constructor() { this.state = 'suspended'; this.sampleRate = 8000; this.destination = node('speakers'); }
    get currentTime() { return clock / 1000; }
    resume() { this.state = 'running'; this.onstatechange?.(); }
    suspend() { this.state = 'suspended'; }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  }
  for (const [m, kind] of [['createGain', 'gain'], ['createBiquadFilter', 'filter'], ['createOscillator', 'osc'], ['createBufferSource', 'noise'], ['createStereoPanner', 'panner'], ['createDynamicsCompressor', 'compressor'], ['createPeriodicWave', 'wave']]) Recorder.prototype[m] = () => node(kind);
  const rctx = vm.createContext({ window: { AudioContext: Recorder, performance: { now: () => clock } }, document: { hidden: false, addEventListener() {} }, setTimeout: () => 0, clearTimeout() {} });
  vm.runInContext(asrc, rctx, { filename: 'audio.js' });
  const RA = rctx.window.SnakeAudio;
  check(RA.unlock(), 'the sound unlocks on a recording stand-in');
  // (A noise grain: its source, through its filter and its envelope, into where the cue goes.)
  const grains = (name, opts) => {
    clock += 5000;
    const from = made.length;
    RA.play(name, opts);
    return made.slice(from).filter(n => n.kind === 'noise').map(src => { const f = src.to[0], g = f.to[0]; return { type: f.type, freq: f.frequency.value, peak: g.gain.peak, into: g.to[0] }; });
  };
  // (Does a grain go through a rival's dulling on its way to the speakers?)
  const dulled = n => !!n && (n.kind === 'filter' && n.type === 'lowpass' && n.frequency.value === LOWPASS || n.to.some(dulled));
  const yours = grains('dig', {}), theirs = grains('dig', { rival: true, pan: 0.4 });
  const scratches = gs => gs.filter(x => x.type === 'bandpass' && x.freq > LOWPASS);
  check(scratches(yours).length >= 4 && yours.every(x => !dulled(x.into)), `your dig: ${scratches(yours).length} scratches of its legs above ${LOWPASS} Hz, nothing dulled`);
  check(scratches(theirs).length === scratches(yours).length && scratches(theirs).every(x => !dulled(x.into)), `a rival's dig: its ${scratches(theirs).length} scratches go round its dulling (the ${LOWPASS} Hz lowpass that took them off), so they carry over the music`);
  check(theirs.filter(x => !(x.type === 'bandpass' && x.freq > LOWPASS)).every(x => dulled(x.into)), '...and the rest of it is dulled, as before');
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  check(scratches(theirs).every((x, i) => near(x.peak, scratches(yours)[i].peak * RIVAL_VOLUME)), `...as soft as the rest of a rival's (${RIVAL_VOLUME} of yours)`);
  const heal = grains('heal', {}), scrabble = grains('scrabble', {});
  const flecks = heal.filter(x => (x.type === 'highpass' || x.type === 'bandpass') && x.freq >= 2000);
  check(flecks.length >= 3, `a burrow closing over: ${flecks.length} flecks of sawdust above 2 kHz, where the music leaves room`);
  const loudest = gs => Math.max(...gs.map(x => x.peak));
  check(loudest(heal) >= 2 * loudest(scrabble), `...and its crumble louder than a beetle's scrabble (${loudest(heal).toFixed(2)} to ${loudest(scrabble).toFixed(2)}), which the music buries`);
  console.log(`ok   the sound over the music: a rival's dig keeps its legs' scratches round its dulling, as soft as the rest; a burrow closing over has ${flecks.length} flecks of sawdust above 2 kHz and a crumble louder than the scrabble`);
}

if (fails) { console.error(`${fails} failed`); process.exit(1); }
console.log(`ok   ${checks} checks of the chatter and the sound playing`);
console.log('all good');
