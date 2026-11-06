#!/usr/bin/env node
// The markup check (SECURITY.md, rule 6: nothing untrusted becomes markup): in every script index.html loads, what is
// written as markup (innerHTML or outerHTML set, insertAdjacentHTML, document.write) never reads a name or other
// text a person or a peer gives. The value is read with Node's own parser, and so is every function of the page it
// calls, as far as those calls go; a field or variable named for such text (`s.name`, `msg.text`, `blurb`) fails it.
// Such text goes in with textContent. The scope check runs it, so it shares that CI step.
//
//   node tools/markup-test.js
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
if (!process.execArgv.includes('--expose-internals')) // (Node's own parser is internal: run again with it shown)
  process.exit(spawnSync(process.execPath, ['--expose-internals', __filename, ...process.argv.slice(2)], { stdio: 'inherit' }).status ?? 1);
const acorn = require('internal/deps/acorn/acorn/dist/acorn');
const ok = require('./ok.js');
const root = path.join(__dirname, '..');

// The names given text goes by: a person's or a peer's name, a rival's blurb, a message and its words.
const GIVEN = new Set(['name', 'names', 'blurb', 'text', 'msg', 'message', 'label', 'killer']);

// Every node under n (children of any kind), depth first.
function* nodes(n) {
  if (!n || typeof n.type !== 'string') return;
  yield n;
  for (const k in n) {
    if (k === 'loc' || k === 'start' || k === 'end') continue;
    const v = n[k];
    if (Array.isArray(v)) for (const c of v) yield* nodes(c);
    else if (v && typeof v.type === 'string') yield* nodes(v);
  }
}
// What each sink writes as markup.
function sinks(ast) {
  const out = [];
  for (const n of nodes(ast)) {
    if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && ['innerHTML', 'outerHTML'].includes(n.left.property.name)) out.push(n.right);
    if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression') {
      const f = n.callee.property.name;
      if (f === 'insertAdjacentHTML') out.push(n.arguments[1]);
      if ((f === 'write' || f === 'writeln') && n.callee.object.name === 'document') out.push(...n.arguments);
    }
  }
  return out.filter(Boolean);
}
// The page's top-level functions by name (declared, or a const arrow or function).
function functions(ast, into) {
  for (const s of ast.body) {
    if (s.type === 'FunctionDeclaration' && s.id) into.set(s.id.name, s);
    if (s.type === 'VariableDeclaration') for (const d of s.declarations)
      if (d.id.type === 'Identifier' && d.init && /Function/.test(d.init.type)) into.set(d.id.name, d.init);
  }
}
// The given text a markup value reads, here or in the page's functions it calls (each read once).
function given(expr, fns, seen = new Set()) {
  const found = [], fields = new Set(); // (a field's name is no variable of that name)
  for (const n of nodes(expr)) {
    if (n.type === 'MemberExpression' && !n.computed) { fields.add(n.property); if (GIVEN.has(n.property.name)) found.push(`.${n.property.name}`); }
    if (n.type === 'Identifier' && GIVEN.has(n.name) && !fields.has(n)) found.push(n.name);
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && fns.has(n.callee.name) && !seen.has(n.callee.name)) {
      seen.add(n.callee.name);
      const f = fns.get(n.callee.name);
      const outs = f.body.type === 'BlockStatement' ? [...nodes(f.body)].filter(r => r.type === 'ReturnStatement').map(r => r.argument) : [f.body];
      for (const o of outs) found.push(...given(o, fns, seen).map(g => `${g} (in ${n.callee.name})`));
    }
  }
  return found;
}
const parse = src => acorn.parse(src, { ecmaVersion: 'latest', locations: true });

// The check itself first, on the shapes it must catch and must let through.
{
  const fns = new Map();
  const probe = src => { const ast = parse(src); functions(ast, fns); return sinks(ast).flatMap(v => given(v, fns)); };
  ok(probe('el.innerHTML = isMe(s) ? "You" : `<b>${s.name}</b>`;').length === 1, 'the check catches a name written as markup');
  ok(probe('const tag = s => `<i>${s.blurb}</i>`; el.insertAdjacentHTML("beforeend", tag(s));').length === 1, '...and one a function the markup calls writes');
  ok(probe('el.innerHTML = `<span class="name"></span>`; el.querySelector(".name").textContent = s.name;').length === 0, '...but not a name set as text');
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const asts = scripts.map(f => [f, parse(fs.readFileSync(path.join(root, f), 'utf8'))]);
const fns = new Map();
for (const [, ast] of asts) functions(ast, fns);
let count = 0;
const bad = [];
for (const [f, ast] of asts) for (const v of sinks(ast)) {
  count++;
  const g = given(v, fns);
  if (g.length) bad.push(`${f}:${v.loc.start.line} reads ${[...new Set(g)].join(', ')}`);
}
ok(count >= 5, `the page's scripts write markup in ${count} places (${scripts.length} scripts)`);
ok(!bad.length, 'none of them writes a name or other given text (SECURITY.md, rule 6: set it with textContent)', bad.join('; '));
