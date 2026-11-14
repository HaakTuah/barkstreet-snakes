// A round stored part way through, exactly, and brought back: for
// tools/simulate.js --save-at and --from (a late-game study starts from the
// rounds as they stood at 2:00 instead of playing every opening again).
//
// It stores whatever a round's state holds, as JSON: plain objects and
// arrays, Maps, Sets, typed arrays, numbers JSON can't (NaN, the
// infinities, -0) and undefined, keeping what's shared (two places holding
// the same object, a snake in an event and in the game) and cycles. What the
// game's own files hold (its DIRS, its personalities and their weights) is
// stored by name, not by value: brought back under another copy of the game
// (--root), a round gets that copy's personalities, so their changes count
// from the moment it goes on. Anything else (a function, a class) can't be
// stored, and says where it was found.
//
//   const S = require('./snapshots/state.js');
//   const known = S.known({ SnakeAI, SnakeEngine, TUNING }); // (in the context that played)
//   const tree = S.encode(state, known);                      // JSON-safe
//   const back = S.decoder(vmContext)(tree, S.known(...));    // (the objects made in that context)
'use strict';
const vm = require('vm');

// The game's own objects, found from its exports, by name: a Map from each
// object (or function) to its path, the shortest first, and back.
function known(roots) {
  const byObject = new Map(), byPath = new Map();
  let level = Object.entries(roots).map(([k, v]) => [[k], v]);
  for (let depth = 0; level.length && depth < 8; depth++) {
    const next = [];
    for (const [p, v] of level) {
      if (v === null || (typeof v !== 'object' && typeof v !== 'function') || byObject.has(v)) continue;
      const name = JSON.stringify(p);
      byObject.set(v, name);
      byPath.set(name, v);
      if (typeof v === 'function' || ArrayBuffer.isView(v)) continue;
      for (const k of Object.keys(v)) next.push([[...p, k], v[k]]);
    }
    level = next;
  }
  return { byObject, byPath };
}

// What the game's own objects hold, as text (functions as their names): if
// it changes while rounds are played, the game keeps state in them, and a
// stored round wouldn't go on exactly.
function fingerprint(roots) {
  const seen = new Set();
  return JSON.stringify(roots, (k, v) => {
    if (typeof v === 'function') return 'fn:' + (v.name || '');
    if (v && typeof v === 'object') { if (seen.has(v)) return '(seen)'; seen.add(v); }
    return v;
  });
}

const tagOf = v => Object.prototype.toString.call(v).slice(8, -1);
function isPlain(v) {
  const p = Object.getPrototypeOf(v);
  return p === null || (Object.getPrototypeOf(p) === null && typeof p.constructor === 'function' && p.constructor.name === 'Object');
}

// The tree: JSON, where an object with a '$' key is something JSON can't
// say: { $: 'r', i } a reference to the object stored first with id i;
// { $: 'k', p } one of the game's own; { $: 'o' | 'a', i, v } a shared
// object or array (or an object with its own '$'); { $: 'm', i?, v: [k, v, ...] }
// a Map; { $: 's', i?, v } a Set; { $: 't', c, i?, v } a typed array;
// { $: 'n', v } NaN, Infinity, -Infinity or -0; { $: 'u' } undefined; { $: 'h' } a hole in an array.
function encode(root, { byObject }) {
  // First, what's met more than once (shared, or a cycle): those get ids.
  const count = new Map(), stack = [root];
  while (stack.length) {
    const v = stack.pop();
    if (v === null || typeof v !== 'object' || byObject.has(v)) continue;
    const n = count.get(v) || 0;
    count.set(v, n + 1);
    if (n) continue;
    const tag = tagOf(v);
    if (tag === 'Map') for (const [k, x] of v) stack.push(k, x);
    else if (tag === 'Set') for (const x of v) stack.push(x);
    else if (!ArrayBuffer.isView(v)) for (const k of Object.keys(v)) stack.push(v[k]);
  }
  const ids = new Map();
  let nextId = 0;
  const walk = (v, where) => {
    switch (typeof v) {
      case 'number': return Number.isFinite(v) && !Object.is(v, -0) ? v : { $: 'n', v: Object.is(v, -0) ? '-0' : String(v) };
      case 'string': case 'boolean': return v;
      case 'undefined': return { $: 'u' };
      case 'object': break;
      default:
        if (byObject.has(v)) return { $: 'k', p: byObject.get(v) };
        throw new Error(`can't store a ${typeof v} (at ${where})`);
    }
    if (v === null) return null;
    if (byObject.has(v)) return { $: 'k', p: byObject.get(v) };
    if (ids.has(v)) return { $: 'r', i: ids.get(v) };
    const shared = count.get(v) > 1, id = shared ? nextId++ : undefined;
    if (shared) ids.set(v, id);
    const tag = tagOf(v);
    if (tag === 'Array') {
      const keys = Object.keys(v);
      if (keys.length !== v.length && keys.some(k => !/^\d+$/.test(k))) throw new Error(`can't store an array with properties of its own (at ${where})`);
      const out = new Array(v.length);
      for (let i = 0; i < v.length; i++) out[i] = i in v ? walk(v[i], where + '[' + i + ']') : { $: 'h' };
      return shared ? { $: 'a', i: id, v: out } : out;
    }
    if (tag === 'Map') {
      const out = [];
      for (const [k, x] of v) out.push(walk(k, where + '.key'), walk(x, where + '.get()'));
      return { $: 'm', i: id, v: out };
    }
    if (tag === 'Set') {
      const out = [];
      for (const x of v) out.push(walk(x, where + '.has()'));
      return { $: 's', i: id, v: out };
    }
    if (ArrayBuffer.isView(v) && tag !== 'DataView') return { $: 't', c: tag, i: id, v: Array.from(v, x => walk(x, where)) };
    if (!isPlain(v)) throw new Error(`can't store a ${tag} (${v.constructor?.name}) (at ${where})`);
    const out = {};
    for (const k of Object.keys(v)) out[k] = walk(v[k], where + '.' + k);
    return shared || Object.prototype.hasOwnProperty.call(out, '$') ? { $: 'o', i: id, v: out } : out;
  };
  return walk(root, 'state');
}

// Brings a tree back. Compiled inside the context the round goes on in, so
// what it makes is that context's own (its arrays, Maps and Sets), as if the
// game had made them; so it uses nothing from outside.
function decodeTree(tree, byPath) {
  const ids = [];
  const walk = t => {
    if (t === null || typeof t !== 'object') return t;
    if (Array.isArray(t)) { const out = []; fillArray(out, t); return out; }
    if (!Object.prototype.hasOwnProperty.call(t, '$')) { const out = {}; fillObject(out, t); return out; }
    const tag = t.$;
    if (tag === 'r') return ids[t.i];
    if (tag === 'k') { if (!byPath.has(t.p)) throw new Error(`this copy of the game has no ${JSON.parse(t.p).join('.')}`); return byPath.get(t.p); }
    if (tag === 'u') return undefined;
    if (tag === 'n') return t.v === '-0' ? -0 : Number(t.v);
    if (tag === 'o') { const out = {}; if (t.i !== undefined) ids[t.i] = out; fillObject(out, t.v); return out; }
    if (tag === 'a') { const out = []; if (t.i !== undefined) ids[t.i] = out; fillArray(out, t.v); return out; }
    if (tag === 'm') {
      const out = new Map();
      if (t.i !== undefined) ids[t.i] = out;
      for (let j = 0; j < t.v.length; j += 2) { const k = walk(t.v[j]); out.set(k, walk(t.v[j + 1])); }
      return out;
    }
    if (tag === 's') { const out = new Set(); if (t.i !== undefined) ids[t.i] = out; for (const x of t.v) out.add(walk(x)); return out; }
    if (tag === 't') { const C = globalThis[t.c]; const out = new C(t.v.length); if (t.i !== undefined) ids[t.i] = out; t.v.forEach((x, j) => { out[j] = walk(x); }); return out; }
    throw new Error('not a stored state: ' + tag);
  };
  const fillArray = (out, t) => {
    out.length = t.length;
    for (let j = 0; j < t.length; j++) {
      const x = t[j];
      if (x !== null && typeof x === 'object' && !Array.isArray(x) && x.$ === 'h') continue;
      out[j] = walk(x);
    }
  };
  const fillObject = (out, t) => { for (const k of Object.keys(t)) out[k] = walk(t[k]); };
  return walk(tree);
}

// A decoder for a context (made once per context): (tree, known) -> the state.
function decoder(context) {
  const run = vm.runInContext('(' + decodeTree.toString() + ')', context);
  return (tree, { byPath }) => run(tree, byPath);
}

module.exports = { known, fingerprint, encode, decoder };
