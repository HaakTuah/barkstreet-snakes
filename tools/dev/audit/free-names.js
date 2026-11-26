// The names a script file takes from outside itself (the code audit's reader of uses, issue #764): every identifier in its code
// that no scope round it binds, so a local, a parameter, a catch's name or a loop's own variable of the same name as a shared
// one is not a use of it. A reader of brackets, not a parser: it knows the function forms of this game's code (function, method,
// arrow, catch) and const/let/var with destructuring; a form it does not know binds nothing, so a mention can only be counted too
// often, never missed. Comments, strings and regular expressions are left out by scripts/js-text.js; a template's `${...}`
// expressions are read where they stand.
//
//   freeNames(src) -> { free: Map(name -> [{ line, member }]), any: the same for every mention, a local's too, text }   member: the name after a dot that follows it, if any
const { litEnd, stripComments } = require('../../../scripts/js-text.js');

const KEYWORDS = new Set('break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield await async get set true false null undefined NaN Infinity arguments'.split(' '));
const CONTROL = new Set(['if', 'for', 'while', 'switch', 'with']);
const OPEN = { '(': ')', '[': ']', '{': '}' };
const OPERATORS = new Set(['=', ',', '(', '[', '{', '+', '-', '*', '/', '%', '&&', '||', '??', '?', ':', '=>', '&', '|', '^', '<', '>', '!', '~', '.']);

// The text with every string and regular expression blanked and every template literal turned into the brackets of its `${...}`
// expressions, one per comma, with its lines kept.
function readable(src) {
  const { code, shape } = stripComments(src);
  let out = '';
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if ((c === '`' || c === '"' || c === "'") && shape[i] === '(') {
      const end = litEnd(code, i), lit = code.slice(i, end + 1);
      const lines = (lit.match(/\n/g) || []).length;
      const exprs = [];
      if (c === '`') {
        for (let j = 1; j < lit.length - 1; j++) {
          if (lit[j] === '\\') { j++; continue; }
          if (lit[j] !== '$' || lit[j + 1] !== '{') continue;
          let depth = 1, k = j + 2;
          while (k < lit.length && depth) { const d = lit[k]; if (d === '"' || d === "'" || d === '`') { k = litEnd(lit, k) + 1; continue; } depth += d === '{' ? 1 : d === '}' ? -1 : 0; k++; }
          exprs.push(lit.slice(j + 2, k - 1)); j = k - 1;
        }
      }
      out += '(' + exprs.map(e => readable(e).replace(/\n/g, ' ')).join(',') + ')' + '\n'.repeat(lines);
      i = end; continue;
    }
    out += shape[i];
  }
  return out;
}

function tokenize(text) {
  const toks = [], re = /([A-Za-z_$][\w$]*)|(\d[\w.]*)|(=>|\?\.|\.\.\.|&&|\|\||\?\?|[^\s\w$])|(\n)/g;
  let line = 1;
  for (let m; (m = re.exec(text));) {
    if (m[4]) { line++; continue; }
    toks.push({ t: m[1] || m[2] || m[3], id: !!m[1], line });
  }
  return toks;
}

// The names a binding pattern introduces, from toks[from] on to its end (at `stop`, or a closing bracket, or a `;`):
// `a`, `{ a, b: c, d = 1, ...e }`, `[a, , b]`, a list of them separated by commas.
function bindings(toks, from, stop = () => false, at = null, base = 0) {
  const names = []; // (at: a Set the positions of the names are added to, base: where toks[0] lies in the whole text)
  let depth = 0, expect = true, inDefault = null;
  for (let i = from; i < toks.length; i++) {
    const k = toks[i].t, prev = i > from ? toks[i - 1].t : '(';
    if (depth === 0 && (stop(i) || k === ';')) break;
    if (OPEN[k]) { if (inDefault === null && (expect || (depth > 0 && prev === ':'))) { depth++; expect = true; continue; } depth++; continue; }
    if (k === ')' || k === ']' || k === '}') { if (inDefault !== null && depth === inDefault) inDefault = null; depth--; if (depth < 0) break; expect = false; continue; }
    if (inDefault !== null && depth >= inDefault) { if (k === ',' && depth === inDefault) { inDefault = null; expect = true; } continue; }
    if (k === '=') { inDefault = depth; continue; }
    if (k === ',') { expect = true; continue; }
    if (k === ':') { expect = true; continue; }
    if (k === '...') continue;
    if (toks[i].id && expect && !KEYWORDS.has(k)) { const next = toks[i + 1] && toks[i + 1].t; if (next !== ':') { names.push(k); if (at) at.add(base + i); } expect = false; }
  }
  return names;
}

function freeNames(src) {
  const text = readable(src), toks = tokenize(text);
  const root = { parent: null, bound: new Set() }, at = new Set(); // (at: where a name is bound: no use)
  const heads = []; // the parameter lists: [from, to, names], where a default value sees the names before it
  const scopeOf = new Array(toks.length);
  let cur = root, depth = 0;
  const stack = [];       // [{ scope, depth }] for the blocks and expression-bodied arrows now open
  const closeOf = new Map(); // index of an open bracket -> index of its match
  { const s = []; toks.forEach((x, i) => { if (OPEN[x.t]) s.push(i); else if (x.t === ')' || x.t === ']' || x.t === '}') { const o = s.pop(); if (o != null) closeOf.set(o, i); } }); }
  const openOf = new Map([...closeOf].map(([o, c]) => [c, o]));
  let pending = null;     // params waiting for the `{` of the function body
  const arrows = [];      // expression-bodied arrows open: { scope, depth }

  for (let i = 0; i < toks.length; i++) {
    const k = toks[i].t, prev = i ? toks[i - 1].t : '';
    scopeOf[i] = cur;
    while (arrows.length && ((arrows.at(-1).depth > depth) || ((k === ',' || k === ';') && arrows.at(-1).depth === depth))) { cur = arrows.pop().scope.parent; scopeOf[i] = cur; }
    if (k === '=>') {
      let params = [];
      if (prev === ')' && openOf.has(i - 1)) { params = bindings(toks, openOf.get(i - 1) + 1, j => j === i - 1, at); heads.push([openOf.get(i - 1), i - 1, new Set(params)]); }
      else if (toks[i - 1] && toks[i - 1].id) { params = [prev]; at.add(i - 1); }
      const next = toks[i + 1] && toks[i + 1].t;
      if (next === '{') pending = params;
      else { const sc = { parent: cur, bound: new Set(params) }; arrows.push({ scope: sc, depth }); cur = sc; }
      continue;
    }
    if (k === ')' && toks[i + 1] && toks[i + 1].t === '{' && openOf.has(i)) { // a function or method head, or a catch
      const o = openOf.get(i), w = toks[o - 1] && toks[o - 1].t;
      if (!CONTROL.has(w)) { if (toks[o - 1] && toks[o - 1].id) at.add(o - 1); pending = bindings(toks, o + 1, j => j === i, at); heads.push([o, i, new Set(pending)]); }
    }
    if (OPEN[k]) {
      depth++;
      if (k === '{') { const sc = { parent: cur, bound: new Set(pending || []) }; pending = null; stack.push({ scope: sc, depth }); cur = sc; }
      continue;
    }
    if (k === '}') {
      if (stack.length && stack.at(-1).depth === depth) { cur = stack.pop().scope.parent; }
      depth--; continue;
    }
    if (k === ')' || k === ']') { depth--; continue; }
    // declarations: const, let and var bind into the scope they stand in; a function's or class's name binds in the one round it
    if ((k === 'const' || k === 'let' || k === 'var') && prev !== '.') {
      let end = i + 1, d = 0;
      for (; end < toks.length; end++) {
        const e = toks[end].t;
        if (OPEN[e]) d++; else if (e === ')' || e === ']' || e === '}') { if (d === 0) break; d--; }
        else if (d === 0 && (e === ';' || ((e === 'of' || e === 'in') && toks[end].id))) break;
        else if (d === 0 && end > i + 1 && toks[end].line > toks[end - 1].line && !OPERATORS.has(toks[end - 1].t) && !OPERATORS.has(e) && e !== ')' && e !== ']') break;
      }
      const sub = toks.slice(i + 1, end);
      const names = bindings(sub, 0, () => false, at, i + 1);
      if (cur !== root) for (const n of names) cur.bound.add(n); // (a top-level name is the shared space's, not a local)
      continue;
    }
    if ((k === 'function' || k === 'class') && toks[i + 1] && toks[i + 1].id && !KEYWORDS.has(toks[i + 1].t) && cur !== root) cur.bound.add(toks[i + 1].t);
    if ((k === 'function' || k === 'class') && toks[i + 1] && toks[i + 1].id) at.add(i + 1);
    if (k === 'function' && toks[i + 1] && toks[i + 1].t === '*') continue;
  }

  const free = new Map(), any = new Map(); // (any: every mention of a name, a local's too, for the alias a file declares itself)
  for (let i = 0; i < toks.length; i++) {
    const x = toks[i];
    if (!x.id || KEYWORDS.has(x.t) || at.has(i)) continue;
    const prev = i ? toks[i - 1].t : '', next = toks[i + 1] ? toks[i + 1].t : '';
    if (prev === '.' || prev === '?.') continue;
    if (next === ':' && (prev === '{' || prev === ',') ) continue; // an object's key
    if ((prev === 'function' || prev === 'class')) continue;
    // a method's or getter's own name in a class or object: a name, a (, a {  with the head's `)` `{` after
    const mem = toks[i + 1] && (toks[i + 1].t === '.' || toks[i + 1].t === '?.') && toks[i + 2] && toks[i + 2].id ? toks[i + 2].t : null;
    if (!any.has(x.t)) any.set(x.t, []);
    any.get(x.t).push({ line: x.line, member: mem });
    let sc = scopeOf[i], local = false;
    for (; sc; sc = sc.parent) if (sc.bound.has(x.t)) { local = true; break; }
    if (local || heads.some(([a, b, ns]) => i > a && i < b && ns.has(x.t))) continue;
    const member = (next === '.' || next === '?.') && toks[i + 2] && toks[i + 2].id ? toks[i + 2].t : null;
    if (!free.has(x.t)) free.set(x.t, []);
    free.get(x.t).push({ line: x.line, member });
  }
  return { free, any, text };
}

module.exports = freeNames;
