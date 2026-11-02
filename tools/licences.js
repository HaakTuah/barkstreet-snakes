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
const escape = t => t.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
for (const id of allowed) if (id !== 'public-domain' && !new RegExp(`(^|[ ,(])${escape(id)}([ ,)]|$)`).test(point10)) fail(`${id} is on the dependency review's list but not in SECURITY.md, point 10`);

// Each entry's licence: one SPDX id, or ids joined by AND (each allowed) or by OR (one allowed); a mix of the two or
// brackets fails, written out in full instead, so no grouping can hide a licence off the list.
const ok = expr => {
  if (/[()]/.test(expr) || (/\sAND\s/.test(expr) && /\sOR\s/.test(expr))) return false;
  const ids = expr.split(/\s+(?:AND|OR)\s+/).map(id => id.trim());
  return /\sOR\s/.test(expr) ? ids.some(id => allowed.has(id)) : ids.every(id => allowed.has(id));
};
// The tools already in use when the gate came in whose licences are off the list, each awaiting the owner's answer
// in its issue (name, licence and issue as tools/licences.json has them). Only these pass: anything new off the list
// fails, whatever its entry says, and an entry goes from here once the owner has answered.
const AWAITING = [['npm', 'Artistic-2.0', 379], ['CodeQL CLI', 'LicenseRef-GitHub-CodeQL-Terms', 380]];
const byName = new Map();
for (const e of audit) {
  if (!e.name || !e.licence) { fail(`an entry without a name or licence: ${JSON.stringify(e)}`); continue; }
  byName.set(e.name, e);
  if (ok(e.licence)) continue;
  if (AWAITING.some(([n, l, q]) => n === e.name && l === e.licence && q === e.question)) console.log(`awaiting the owner (#${e.question}): ${e.name}, ${e.licence}`);
  else fail(`${e.name}: ${e.licence} is not on the list (SECURITY.md, point 10)`);
}
// The packages an npx or npm install command fetches, read from its words up to the end of the command: for npx,
// those named by -p or --package, else its first word; for npm install or exec, every word not an option (an
// option's value, as in --prefix DIR, is not a package). What can't be read, such as a variable, a path, a URL or a
// tarball, comes back as itself, so it fails rather than slipping past.
const VALUED = new Set(['--prefix', '--registry', '--cache', '--userconfig', '--workspace', '-w', '--tag', '--omit', '--include', '--loglevel', '-C']);
function fetched(cmd, rest) {
  const words = rest.trim().split(/\s+/).filter(Boolean), out = [];
  const bare = w => w.replace(/^(@[^/@\s]+\/[^@\s]+|[^@\s]+)@.*$/, '$1');
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === '-p' || w === '--package') { out.push(bare(words[++i] || '')); continue; }
    if (w.startsWith('--package=')) { out.push(bare(w.slice(10))); continue; }
    if (VALUED.has(w)) { i++; continue; }
    if (w.startsWith('-')) continue;
    if (cmd === 'npx') { if (!out.length) out.push(bare(w)); break; }
    out.push(bare(w));
  }
  return out;
}
const need = (name, where) => { if (!byName.has(name)) fail(`${name} (${where}) is not in tools/licences.json`); };

// What the workflows and scripts use: actions, and the packages npx and npm install fetch.
const ci = ['.github/workflows', 'scripts'].flatMap(d => fs.readdirSync(path.join(root, d)).map(f => `${d}/${f}`));
for (const f of ci) {
  const src = read(f);
  for (const m of src.matchAll(/uses:\s*['"]?([\w.-]+\/[\w.-]+)/g)) need(m[1], f);
  for (const m of src.matchAll(/\b(npx|npm\s+(?:install|i|add|exec|x))\s([^\n;&|>]*)/g)) for (const p of fetched(m[1], m[2])) need(p, `${f}, ${m[0].trim()}`);
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
  for (const line of read(f).split('\n')) for (const m of line.matchAll(/https?:\/\/[^\s'"`)<>]+/g)) {
    const url = m[0];
    if (own.test(url) || (/rel=["']?(preconnect|dns-prefetch)/.test(line) && /^https?:\/\/[^/]+\/?$/.test(url))) continue; // (a bare origin to warm up: nothing is loaded from it)
    if (!loads.some(([u]) => url.startsWith(u))) fail(`${f} loads ${url}, which no entry of tools/licences.json covers`);
    // (one Google Fonts address can ask for several families: each must be a font of its own in the audit)
    if (/^https:\/\/fonts\.googleapis\.com\//.test(url)) for (const fam of url.matchAll(/[?&]family=([^:&]+)/g)) {
      const name = decodeURIComponent(fam[1].replace(/\+/g, ' '));
      if (byName.get(name)?.kind !== 'font') fail(`${f} loads the font ${name}, which is not a font in tools/licences.json`);
    }
  }
}

// The notices: everything that ships is named in THIRD-PARTY-NOTICES.txt, which sw.js keeps for offline play.
const notices = read('THIRD-PARTY-NOTICES.txt');
for (const e of audit) if (e.ships && !notices.includes(e.name)) fail(`${e.name} ships but has no notice in THIRD-PARTY-NOTICES.txt`);
if (!read('sw.js').includes("'THIRD-PARTY-NOTICES.txt'")) fail('sw.js does not keep THIRD-PARTY-NOTICES.txt');

if (fails.size) { for (const m of fails) console.error('FAIL:', m); process.exit(1); }
console.log(`ok   ${audit.length} entries, every licence on the list or awaiting the owner, nothing used left out, the notices whole`);
