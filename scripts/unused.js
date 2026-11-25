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
  .filter(f => !f.startsWith('core/') && f !== 'checks/shape-baseline.json' && fs.existsSync(path.join(root, f))); // (the baseline the core's shape check writes names files by path, no use of them)
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // (a name or file name as a pattern that matches only itself)

const { stripComments } = require('./js-text.js');

const CODE = /\.(js|html|json|sh|yml|mjs)$/;
const corpus = {}, shapes = {};
for (const f of tracked) {
  if (!CODE.test(f) || f.startsWith('docs/') || f === 'tools/unused.json' || f.endsWith('package-lock.json')) continue;
  const t = read(f);
  if (/\.m?js$/.test(f)) { const r = stripComments(t); corpus[f] = r.code; shapes[f] = r.shape.split('\n'); } else corpus[f] = t;
}

// Top-level declarations: a function, class, or const/let/var at the start of a line, destructured ones too.
const DECL = /^(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^(?:export\s+(?:default\s+)?)?class\s+([A-Za-z_$][\w$]*)|^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*[=;]|^(?:export\s+)?(?:const|let|var)\s+[{[]([^=]*)[}\]]\s*=/;
const declarations = [];
for (const f of Object.keys(corpus)) {
  if (!/\.m?js$/.test(f)) continue;
  const lines = corpus[f].split('\n');
  lines.forEach((line, i) => {
    const m = DECL.exec(line);
    if (!m) return;
    const names = m[4] != null ? m[4].split(',').map(s => s.replace(/.*:/, '').replace(/=.*/, '').replace(/^\s*\.\.\./, '').trim()).filter(s => /^[A-Za-z_$][\w$]*$/.test(s)) : [m[1] || m[2] || m[3]];
    // a declaration's own lines (so recursion, and what only it names, is no use): to the line where its brackets close; a function
    // or class whose brackets never do (a miscount) runs to the first line that starts with a closing brace
    let end = i, depth = 0, closed = false;
    const isBlock = /^(?:export\s+(?:default\s+)?)?(?:async\s+)?function|^(?:export\s+(?:default\s+)?)?class/.test(line);
    const shape = shapes[f];
    for (let k = i; k < lines.length; k++) {
      depth += (shape[k].match(/[{[(]/g) || []).length - (shape[k].match(/[}\])]/g) || []).length;
      if (depth <= 0) { end = k; closed = true; break; }
    }
    if (!closed && isBlock) for (let k = i + 1; k < lines.length; k++) if (/^\}/.test(lines[k])) { end = k; break; }
    for (const name of names) declarations.push({ name, file: f, line: i + 1, from: i, to: end, block: isBlock, kind: /^(?:export\s+(?:default\s+)?)?(?:async\s+)?function/.test(line) ? 'function' : /^(?:export\s+(?:default\s+)?)?class/.test(line) ? 'class' : 'const' });
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
const nameCount = (f, k, name) => (corpus[f].split('\n')[k].match(new RegExp(`(?<![\\w$])${escape(name)}(?![\\w$])`, 'g')) || []).length;
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
  const hit = Object.entries(everything).some(([g, t]) => g !== f && (t.includes(f) || (path.dirname(g) === path.dirname(f) && t.includes(base)) || new RegExp(`['"\`./]${escape(base)}['"\`]`).test(t)));
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
