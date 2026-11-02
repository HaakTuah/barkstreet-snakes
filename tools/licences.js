#!/usr/bin/env node
// The licence gate's audit check (SECURITY.md, point 10), run on every pull request by
// .github/workflows/licences.yml beside GitHub's dependency review: every entry of tools/licences.json is under a
// licence on the list (.github/dependency-review-config.yml), or awaits the owner's answer in a `question` issue;
// nothing the game or its tools use is missing from it (the actions the workflows use, the packages npx and npm
// fetch, package.json's and package-lock.json's packages if there are any, every address the game loads from, and
// any font, image, sound or data file); the list matches SECURITY.md's; and everything that ships has its notice in
// THIRD-PARTY-NOTICES.txt.
//
//   node tools/licences.js [--audit FILE]   (FILE: another audit to check, such as a test's)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const at = process.argv.indexOf('--audit');
const audit = JSON.parse(at > 0 ? fs.readFileSync(process.argv[at + 1], 'utf8') : read('tools/licences.json')).entries;
const fails = new Set();
const fail = m => fails.add(m);

// The list: the dependency review's, plus the public domain, which has no SPDX id.
const allowed = new Set(['public-domain']);
let inList = false;
for (const line of read('.github/dependency-review-config.yml').split('\n')) {
  if (/^allow-licenses:/.test(line)) { inList = true; continue; }
  const m = line.match(/^\s+-\s+(\S+)/);
  if (inList && m) allowed.add(m[1]); else if (inList && /^\S/.test(line)) inList = false;
}
const point10 = (read('SECURITY.md').match(/^10\. \*\*Licences[\s\S]*?(?=\n\S|\n\n)/m) || [''])[0].replace(/\s+/g, ' ');
for (const id of allowed) if (id !== 'public-domain' && !new RegExp(`(^|[ ,(])${id.replace(/[.+]/g, '\\$&')}([ ,)]|$)`).test(point10)) fail(`${id} is on the dependency review's list but not in SECURITY.md, point 10`);

// Each entry's licence: an SPDX expression, every part of an AND allowed, one of an OR.
const ok = expr => expr.split(/\s+OR\s+/).some(alt => alt.replace(/[()]/g, '').split(/\s+AND\s+/).every(id => allowed.has(id.trim())));
const byName = new Map();
for (const e of audit) {
  if (!e.name || !e.licence) { fail(`an entry without a name or licence: ${JSON.stringify(e)}`); continue; }
  byName.set(e.name, e);
  if (ok(e.licence)) continue;
  if (Number.isInteger(e.question)) console.log(`awaiting the owner (#${e.question}): ${e.name}, ${e.licence}`);
  else fail(`${e.name}: ${e.licence} is not on the list (SECURITY.md, point 10)`);
}
const need = (name, where) => { if (!byName.has(name)) fail(`${name} (${where}) is not in tools/licences.json`); };

// What the workflows and scripts use: actions, and the packages npx and npm install fetch.
const ci = ['.github/workflows', 'scripts'].flatMap(d => fs.readdirSync(path.join(root, d)).map(f => `${d}/${f}`));
for (const f of ci) {
  const src = read(f);
  for (const m of src.matchAll(/uses:\s*['"]?([\w.-]+\/[\w.-]+)/g)) need(m[1], f);
  for (const m of src.matchAll(/\b(?:npx|npm\s+(?:install|i|exec))\b[^\n]*/g))
    for (const p of m[0].matchAll(/(?:^|\s)(?:-p\s+|--package[= ])?((?:@[\w.-]+\/)?[a-z][\w.-]*)@\d/g)) need(p[1], f);
}

// package.json and its lock, if the tools have them: every package, the ones pulled in included.
for (const f of ['package.json', 'package-lock.json']) {
  if (!fs.existsSync(path.join(root, f))) continue;
  const j = JSON.parse(read(f));
  for (const k of ['dependencies', 'devDependencies', 'optionalDependencies']) for (const n of Object.keys(j[k] || {})) need(n, f);
  for (const [p, v] of Object.entries(j.packages || {})) if (p) need(v.name || p.replace(/^.*node_modules\//, ''), f);
}

// What the game loads: every address in the files it serves (not the tools or notes), and any asset file.
const own = /^https?:\/\/(www\.w3\.org|haaktuah\.github\.io|github\.com\/HaakTuah)\b/i;
const loads = audit.flatMap(e => (e.loads || []).map(u => [u, e]));
const skip = new Set(['.git', 'tools', 'docs', 'scripts', '.github', '.claude', 'node_modules', 'types']);
const walk = d => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap(x => x.isDirectory() ? (skip.has(x.name) ? [] : walk(path.join(d, x.name))) : [path.join(d, x.name)]);
for (const f of walk('.')) {
  if (/\.(png|jpe?g|gif|webp|avif|ico|bmp|svg|woff2?|ttf|otf|eot|mp3|ogg|oga|wav|flac|m4a|aac|opus|webm|mp4|csv|tsv)$/i.test(f)) need(f.replace(/^\.\//, ''), 'an asset file');
  if (!/\.(html|js|css|json|webmanifest)$/.test(f)) continue;
  for (const m of read(f).matchAll(/https?:\/\/[^\s'"`)<>]+/g))
    if (!own.test(m[0]) && !loads.some(([u]) => m[0].startsWith(u))) fail(`${f} loads ${m[0]}, which no entry of tools/licences.json covers`);
}

// The notices: everything that ships is named in THIRD-PARTY-NOTICES.txt, which sw.js keeps for offline play.
const notices = read('THIRD-PARTY-NOTICES.txt');
for (const e of audit) if (e.ships && !notices.includes(e.name)) fail(`${e.name} ships but has no notice in THIRD-PARTY-NOTICES.txt`);
if (!read('sw.js').includes("'THIRD-PARTY-NOTICES.txt'")) fail('sw.js does not keep THIRD-PARTY-NOTICES.txt');

if (fails.size) { for (const m of fails) console.error('FAIL:', m); process.exit(1); }
console.log(`ok   ${audit.length} entries, every licence on the list or awaiting the owner, nothing used left out, the notices whole`);
