#!/usr/bin/env node
// List every top-level function, constant and class that nothing else names, and every file nothing
// points to; exit 1 if there is one that tools/unused.json does not explain:  node scripts/unused.js [--all]
//
// A name is used when it appears, outside comments, anywhere in the project's code (JS, HTML, JSON, shell
// and workflow files) other than inside its own declaration: so script tags, sw.js entries, the suites and
// names looked up as strings count, a call from a test counts, a name only the declaration and its own
// recursion mention does not. A file is used when another file names its path or, for a file in a folder
// that is a package of its own, its name. What is reached some way a name search cannot see (a name built
// from pieces, a folder read whole) goes in tools/unused.json with its reason; an entry nothing needs any
// more fails too, so the list never outlives what it explains.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const listed = JSON.parse(fs.readFileSync(path.join(root, 'tools/unused.json'), 'utf8'));
const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n').filter(Boolean)
  .filter(f => !f.startsWith('core/') && fs.existsSync(path.join(root, f)));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// Text of a JS file with its comments taken out (strings, template literals and regular expressions kept as they are).
function stripComments(src) {
  let out = '', i = 0, prev = '';
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; out += ' '; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c && !(c !== '`' && src[j] === '\n')) j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1); i = j + 1; prev = c; continue;
    }
    if (c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /(?:return|typeof|case|in|of)$/.test(out.trimEnd().slice(-6)))) {
      let j = i + 1, cls = false;
      while (j < n && src[j] !== '\n' && (src[j] !== '/' || cls)) { if (src[j] === '\\') j++; else if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; j++; }
      out += src.slice(i, j + 1); i = j + 1; prev = '/'; continue;
    }
    out += c; if (!/\s/.test(c)) prev = c; i++;
  }
  return out;
}

const CODE = /\.(js|html|json|sh|yml|mjs)$/;
const corpus = {};
for (const f of tracked) {
  if (!CODE.test(f) || f.startsWith('docs/') || f === 'tools/unused.json' || f.endsWith('package-lock.json')) continue;
  const t = read(f);
  corpus[f] = f.endsWith('.js') || f.endsWith('.mjs') ? stripComments(t) : t;
}

// Top-level declarations: a function, class, or const/let/var at the start of a line, destructured ones too.
const DECL = /^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^class\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*[=;]|^(?:const|let|var)\s+[{[]([^=]*)[}\]]\s*=/;
const declarations = [];
for (const f of Object.keys(corpus)) {
  if (!/\.m?js$/.test(f)) continue;
  const lines = corpus[f].split('\n');
  lines.forEach((line, i) => {
    const m = DECL.exec(line);
    if (!m) return;
    const names = m[4] != null ? m[4].split(',').map(s => s.replace(/.*:/, '').replace(/=.*/, '').replace(/^\s*\.\.\./, '').trim()).filter(s => /^[A-Za-z_$][\w$]*$/.test(s)) : [m[1] || m[2] || m[3]];
    // a function's or class's own lines (so recursion is no use): this line if its braces close here, else to the first line that closes one at the start of a line
    let end = i;
    const isBlock = /^(?:async\s+)?function|^class/.test(line);
    if (isBlock && (line.match(/\{/g) || []).length !== (line.match(/\}/g) || []).length) {
      end = lines.length - 1;
      for (let k = i + 1; k < lines.length; k++) if (/^\}/.test(lines[k])) { end = k; break; }
    }
    for (const name of names) declarations.push({ name, file: f, line: i + 1, from: i, to: end, block: isBlock, kind: /^(?:async\s+)?function/.test(line) ? 'function' : /^class/.test(line) ? 'class' : 'const' });
  });
}

// Where each identifier appears: name -> [{ file, line }], one entry per line it is on.
const where = new Map();
for (const [f, text] of Object.entries(corpus)) {
  text.split('\n').forEach((line, k) => {
    for (const w of new Set(line.match(/[A-Za-z_$][\w$]*/g) || [])) { if (!where.has(w)) where.set(w, []); where.get(w).push({ file: f, line: k }); }
  });
}
// The declaration's own lines count for nothing, and nor do the lines of a declaration found unused: what only
// dead code names is dead too, so this goes round until no more turn up. A const's own line may name it again in a
// later declarator (`const A = 1, b = A * 2`), which is a use.
const nameCount = (f, k, name) => (corpus[f].split('\n')[k].match(new RegExp(`(?<![\\w$])${name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g')) || []).length;
let dead = new Set(), more = true;
const inside = (d, o) => o.file === d.file && o.line >= d.from && o.line <= d.to;
while (more) {
  more = false;
  for (const d of declarations) {
    if (dead.has(d)) continue;
    const isUsed = (where.get(d.name) || []).some(o => {
      if (inside(d, o)) return !d.block && o.line === d.from && nameCount(o.file, o.line, d.name) > 1;
      return ![...dead].some(x => inside(x, o));
    });
    if (!isUsed) { dead.add(d); more = true; }
  }
}
const unusedNames = declarations.filter(d => dead.has(d));

// Files: named by another file (its path, or the path from the folder where it is a folder's own part).
const everything = {};
for (const f of tracked) if (/\.(js|html|json|sh|yml|mjs|css|md|txt)$/.test(f) && !f.startsWith('docs/archive/') && f !== 'tools/unused.json') everything[f] = read(f);
const fileUnused = [];
for (const f of tracked) {
  if (!/\.(js|mjs|css|sh|woff2)$/.test(f)) continue;
  if (f.startsWith('tools/dev/') || f.startsWith('docs/') || f.startsWith('.claude/')) continue; // (tools/dev: each its own entry point, run by hand)
  if (/^(tools\/node_modules)/.test(f)) continue;
  const base = path.basename(f);
  const hit = Object.entries(everything).some(([g, t]) => g !== f && (t.includes(f) || (path.dirname(g) === path.dirname(f) && t.includes(base)) || new RegExp(`['"\`./]${base.replace(/\./g, '\\.')}['"\`]`).test(t)));
  if (!hit) fileUnused.push(f);
}

const coversFile = f => Object.keys(listed.files || {}).find(k => f === k || (k.endsWith('/') && f.startsWith(k)));
const out = [];
const notExplained = [];
for (const d of unusedNames) {
  const key = `${d.file}:${d.name}`;
  (listed.names || {})[key] ? 0 : notExplained.push(`${d.kind} ${d.name}  ${d.file}:${d.line}`);
}
for (const f of fileUnused) coversFile(f) ? 0 : notExplained.push(`file ${f}`);
const stale = [];
for (const k of Object.keys(listed.names || {})) if (!unusedNames.some(d => `${d.file}:${d.name}` === k)) stale.push(`names: ${k}`);
for (const k of Object.keys(listed.files || {})) if (!fileUnused.some(f => f === k || (k.endsWith('/') && f.startsWith(k)))) stale.push(`files: ${k}`);

if (process.argv.includes('--all')) {
  for (const d of unusedNames) console.log(`${d.kind} ${d.name}  ${d.file}:${d.line}`);
  for (const f of fileUnused) console.log(`file ${f}`);
}
if (notExplained.length || stale.length) {
  if (notExplained.length) { console.log(`Nothing names these (remove each, or explain it in tools/unused.json):`); for (const l of notExplained) console.log('  ' + l); }
  if (stale.length) { console.log(`tools/unused.json explains what is no longer unused (remove the entry):`); for (const l of stale) console.log('  ' + l); }
  process.exit(1);
}
console.log(`ok   unused: ${declarations.length} top-level names and ${tracked.length} files checked`);
