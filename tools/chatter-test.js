#!/usr/bin/env node
// Checks the chatter's lines: every line in English has its Chinese (Copycat
// repeats what it hears, in Chinese), every {who} line names someone the
// same way in both, no voice has an empty list, no Chinese is left over from
// a line that's gone, and every punchline is a line someone says.
// Then it plays the chatter itself (chatter.js with the game's own engine, on
// a stand-in page) through staged moments: every voice speaks up when it's
// pecked under, put out by the rain, sees food burn or rot, starves, is cut
// by a dash, and (where it has lines for them) flashes or hears the last
// apples fall; Sovereign and Colonist mind rot on their land, by the one
// land rule; and the rarer lines keep to their rests. Then a few whole AI
// rounds with the chatter listening, to see nothing throws. Last, the sound
// (audio.js on a stand-in AudioContext): a rival's flash, jump or the like
// never silences yours, and your own golden ones in a row are each heard.
//
//   node tools/chatter-test.js
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
const EVERYONE = ['under', 'doused', 'ash', 'rot', 'desperate', 'cut'];
for (const [who, voice] of Object.entries(VOICES)) {
  for (const k of EVERYONE) ok(voice[k]?.length, `${who} has '${k}' lines`);
  ok(!voice.snipped, `${who}: 'snipped' is gone (a dash's cut is 'cut' now)`);
  ok(!(voice.cut || []).some(l => /bird|woodpecker/i.test(l)), `${who}: no 'cut' line blames the woodpecker`);
  for (const k of Object.keys(voice.flash || {})) ok(k === 'first' || k === 'past', `${who}: flash.${k} is first or past`);
}
ok(VOICES.sovereign.realm?.rotten?.length, 'Sovereign minds rot in its realm');
ok(VOICES.colonist.colony?.rotten?.length, 'Colonist minds rot in its colonies');
if (fails) { console.error(`${fails} failed`); process.exit(1); }
console.log(`ok   ${lines.length} lines, every one in Chinese too`);
console.log(`ok   ${Object.keys(ZH).length} Chinese lines, none left over`);
console.log(`ok   ${PUNCHLINES.length} punchlines, each told once a round`);
console.log(`ok   every voice: ${EVERYONE.join(', ')}`);

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
for (const f of ['tuning.js', 'ai.js', 'engine.js', 'chatter.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const { SnakeEngine: E, SnakeChatter: C, TUNING: T } = ctx.window;
C.init({ boardEl: new El(), logEl: new El() });
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
// One tick of chatter, with these events: what was said.
function tick(g, events = [], ms = 100) {
  g.tick++; g.time += ms; g.events = events;
  heard = [];
  roll = 0.38;
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
console.log('ok   every voice speaks up when pecked under, put out, starving, cut, and when food burns or rots by it (and flashes, and the last apples, where it has lines)');

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
console.log('ok   the rarer lines keep to their rests; land is radius + LAND_REACH; ash and rot go to whoever was nearest');

// Whole rounds of rivals with the chatter listening: nothing throws, and it talks.
{
  let total = 0, rounds = 0;
  const per = {};
  for (let r = 0; r < 4; r++) {
    rng = seeded(31 + r * 7919);
    const g = E.createGame({ withPlayer: false });
    C.reset(g);
    while (g.snakes.filter(s => s.alive).length > 1 && g.time < 400000) {
      E.step(g);
      heard = [];
      C.update();
      total += heard.length;
      for (const x of heard) per[x.s.personaKey] = (per[x.s.personaKey] || 0) + 1;
    }
    rounds++;
  }
  check(total > 20 * rounds, `whole rounds: the rivals talk (${total} lines in ${rounds} rounds)`);
  console.log(`ok   ${rounds} whole AI rounds with the chatter listening: ${total} lines, nothing thrown`);
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
  for (const cue of ['flash', 'dash', 'leap', 'alight', 'wrap']) {
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
  console.log('ok   the sound: a rival\'s flash, dash, jump, catching fire or golden mushroom never swallows yours, and gives way to it; your own golden dashes and jumps on each other\'s heels are each heard');
}

if (fails) { console.error(`${fails} failed`); process.exit(1); }
console.log(`ok   ${checks} checks of the chatter and the sound playing`);
console.log('all good');
