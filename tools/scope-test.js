#!/usr/bin/env node
// Checks the page's shared scope. render/ and game/ are plain scripts that
// share one scope (see render/core.js), so every name declared at the top of
// any script index.html loads must be unique across them all (a second
// `function frame` would quietly replace the first), must not be a browser
// global (a `const Audio` would hide the browser's from every script), and
// must not be a name the game or the tools put on window themselves (the
// tools' autopilot calls a bare press()). The names are read with the
// JavaScript parser Node itself carries (no dependency); the browser's
// globals come from a blank page in headless Chrome (tools/browser.js).
//
//   node tools/scope-test.js
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
if (!process.execArgv.includes('--expose-internals')) // (Node's own parser is internal: run again with it shown)
  process.exit(spawnSync(process.execPath, ['--expose-internals', __filename, ...process.argv.slice(2)], { stdio: 'inherit' }).status ?? 1);
const acorn = require('internal/deps/acorn/acorn/dist/acorn');
const { launch } = require('./browser');
const root = path.join(__dirname, '..');
const ok = (cond, what, detail = '') => { if (!cond) { console.error('FAIL:', what, detail); process.exit(1); } console.log('ok  ', what); };

// The names a script declares at its top: functions, classes, and every name
// in a var, let or const there (destructured ones too).
function topNames(src) {
  const out = [];
  const pat = p => {
    if (!p) return;
    if (p.type === 'Identifier') out.push(p.name);
    else if (p.type === 'ObjectPattern') p.properties.forEach(q => pat(q.type === 'RestElement' ? q.argument : q.value));
    else if (p.type === 'ArrayPattern') p.elements.forEach(pat);
    else if (p.type === 'AssignmentPattern') pat(p.left);
    else if (p.type === 'RestElement') pat(p.argument);
  };
  for (const s of acorn.parse(src, { ecmaVersion: 'latest' }).body) {
    if ((s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') && s.id) out.push(s.id.name);
    if (s.type === 'VariableDeclaration') s.declarations.forEach(d => pat(d.id));
  }
  return out;
}

(async () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const by = new Map(); // name -> the scripts declaring it
  for (const f of scripts) for (const n of topNames(fs.readFileSync(path.join(root, f), 'utf8'))) by.set(n, [...(by.get(n) || []), f]);
  ok(by.size > 1000, `the page's scripts declare ${by.size} names in the shared scope (${scripts.length} scripts)`);
  const twice = [...by].filter(([, fs]) => fs.length > 1);
  ok(!twice.length, 'no name is declared twice', twice.map(([n, fs]) => `${n} (${fs.join(', ')})`).join('; '));

  // What goes on window by hand: the game's own (window.SnakeRender = ...), the tools' in-page helpers.
  const mine = new Set();
  const own = [...scripts.map(f => path.join(root, f)), ...fs.readdirSync(__dirname).filter(f => f.endsWith('.js')).map(f => path.join(__dirname, f))];
  for (const f of own) for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=[^=]/g)) mine.add(m[1]);
  const onWindow = [...by.keys()].filter(n => mine.has(n));
  ok(!onWindow.length, `no name is one the game or the tools put on window (${mine.size} of those)`, onWindow.join(', '));

  const b = await launch();
  try {
    await b.go('about:blank', { settle: 0 });
    const globals = new Set(await b.eval('(() => { const s = new Set(); for (let o = window; o; o = Object.getPrototypeOf(o)) Object.getOwnPropertyNames(o).forEach(n => s.add(n)); return [...s]; })()'));
    const hidden = [...by.keys()].filter(n => globals.has(n));
    ok(globals.size > 500 && !hidden.length, `no name hides one of the browser's ${globals.size} globals`, hidden.join(', '));
  } finally { await b.close(); }
  console.log('\nall scope checks passed');
})().catch(e => { console.error('FAIL:', e); process.exit(1); });
