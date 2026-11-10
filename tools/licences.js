#!/usr/bin/env node
// The licence check's scan (SECURITY.md, rule 10, with floor rule 10), run on every pull request by
// .github/workflows/licences.yml beside the core's check: nothing the game or its tools use is missing from the audit,
// tools/licences.json (the actions the workflows use, but the owner's own, HaakTuah/; the packages npx and npm fetch;
// the packages of the tools' package.json and its lock, and the root's if there are any; every address the game loads
// from; code copied in with someone's licence notice; and any font, image, sound or data file); what the game serves is
// audited as shipping; and everything that ships has its notice in THIRD-PARTY-NOTICES.txt. Then the core's check
// (core/scripts/licences.mjs, with tools/licence-check.json) holds every entry and package to its list.
//
//   node tools/licences.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const audit = JSON.parse(read('tools/licences.json')).entries;
const fails = new Set();
const fail = m => fails.add(m);

const byName = new Map();
for (const e of audit) if (e.name) byName.set(e.name, e);
for (const e of audit) if (e.loads && !e.ships) fail(`${e.name}: the game loads it, so it ships`);
// The packages an npx or npm install command fetches, failing closed: each must be written in one strict form,
// name@exact.version (for npx, after -p or --package, else its first word; for npm install or exec, every word not
// an option), and anything else (a bare name, a range or tag, an alias, a URL, git, a path, a tarball, a variable, an
// option's value) can't be audited and fails.
const EXACT = /^((?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*)@(\d+\.\d+\.\d+)$/i;
function fetched(cmd, rest, where) {
  const words = rest.trim().split(/\s+/).filter(Boolean), specs = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === '-p' || w === '--package') { specs.push(words[++i] || ''); continue; }
    if (w.startsWith('--package=')) { specs.push(w.slice(10)); continue; }
    if (w === '--prefix') { i++; continue; } // (a folder to install into, not a package)
    if (w.startsWith('-')) continue;
    if (cmd === 'npx') { if (!specs.length) specs.push(w); break; }
    specs.push(w);
  }
  return specs.flatMap(spec => { const m = spec.match(EXACT); if (!m) fail(`${where}: ${spec} can't be audited (only name@exact.version)`); return m ? [[m[1], spec.slice(m[1].length + 1)]] : []; });
}
// Something used must be in the audit; one fetched at an exact version, at that version, so an update is audited
// again (its licence, and what it pulls in) rather than riding on the old entry.
// What the game serves must be audited as shipping, held to the strict list.
const need = (name, where, version, ships) => {
  const e = byName.get(name);
  if (!e) fail(`${name} (${where}) is not in tools/licences.json`);
  else if (ships && !e.ships) fail(`${name} (${where}) is served with the game, so its entry ships`);
  else if (version && e.version !== version) fail(`${name}@${version} (${where}) is audited at ${e.version}: audit the new version, and what it pulls in`);
};

// What the workflows, scripts and tools use: actions, and the packages npx and npm install fetch (the tools' own
// test, which stages such lines on purpose, left out).
const walk = (d, skip) => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap(x => x.isDirectory() ? (skip.has(x.name) ? [] : walk(path.join(d, x.name), skip)) : [path.join(d, x.name)]);
const none = new Set(['node_modules']);
const ci = ['.github/workflows', 'scripts', 'tools'].flatMap(d => walk(d, none)).filter(f => /\.(ya?ml|sh|[cm]?js)$/.test(f) && f !== path.join('tools', 'licences-test.js'));
for (const f of ci) {
  const comment = /\.[cm]?js$/.test(f) ? /(^|\s)\/\/.*$/ : /(^|\s)#.*$/;
  const src = read(f).split('\n').map(l => l.replace(comment, '')).join('\n'); // (a comment fetches nothing)
  for (const m of src.matchAll(/uses:\s*['"]?([\w.-]+\/[\w.-]+)/g)) if (!m[1].startsWith('HaakTuah/')) need(m[1], f); // (the owner's own, the core's workflows among them)
  for (const m of src.matchAll(/\b(npx|npm(?:\s+-\S+)*\s+(?:install|in|i|add|exec|x))\s([^\n;&|>]*)/g)) for (const [p, v] of fetched(m[1], m[2], `${f}, ${m[0].trim()}`)) need(p, `${f}, ${m[0].trim()}`, v);
}

// The tools' package.json and its lock (tools/), or any at the root: every package, the ones pulled in included.
for (const f of ['tools/package.json', 'tools/package-lock.json', 'package.json', 'package-lock.json']) {
  if (!fs.existsSync(path.join(root, f))) continue;
  const j = JSON.parse(read(f));
  for (const k of ['dependencies', 'devDependencies', 'optionalDependencies']) for (const n of Object.keys(j[k] || {})) need(n, f);
  for (const [p, v] of Object.entries(j.packages || {})) if (p) need(v.name || p.replace(/^.*node_modules\//, ''), f, v.version);
}

// What the game loads: every address in the files it serves (not the tools or notes), any file there carrying
// someone's licence notice (third-party code copied in), and any font, image, sound or data file in the game or its
// tools (docs/ holds the owner's own pictures and notes).
const own = /^https?:\/\/(www\.w3\.org|haaktuah\.github\.io|github\.com\/HaakTuah)\b/i;
const loads = audit.flatMap(e => (e.loads || []).map(u => [u, e]));
const served = walk('.', new Set(['.git', 'tools', 'docs', 'scripts', '.github', '.claude', 'node_modules', 'types']));
const tools = walk('tools', none);
const ownGate = new Set(['licences.js', 'licences-test.js'].map(f => path.join('tools', f))); // (they name the markers they look for)
for (const f of [...served, ...tools]) {
  const ships = served.includes(f);
  if (/\.(html|[cm]?js|css)$/.test(f) && !ownGate.has(f) && /\/\*!|@license|SPDX-License-Identifier|Copyright \(c\)/i.test(read(f))) need(f, 'a file carrying a licence notice', undefined, ships);
  if (/\.(png|jpe?g|gif|webp|avif|ico|bmp|svg|woff2?|ttf|otf|eot|mp3|ogg|oga|wav|flac|m4a|aac|opus|webm|mp4|csv|tsv)$/i.test(f)) need(f, 'an asset file', undefined, ships);
}
for (const f of served) {
  if (!/\.(html|js|css|json|webmanifest)$/.test(f)) continue;
  let policy = false; // (inside the content security policy's meta, whose lines only allow what others load)
  for (const line of read(f).split('\n')) {
    policy ||= /http-equiv="Content-Security-Policy"/i.test(line);
    for (const m of line.matchAll(/(https?:)?\/\/[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/[^\s'"`)<>]*)?/gi)) {
      if (!m[1] && /[\w:]$/.test(line.slice(0, m.index))) continue; // (a comment's // after a word, not an address)
      const url = m[1] ? m[0] : 'https:' + m[0]; // (a scheme-relative address loads over the page's https)
      if (own.test(url) || ((policy || /rel=["']?(preconnect|dns-prefetch)/.test(line)) && /^https?:\/\/[^/]+\/?$/.test(url))) continue; // (a bare origin to warm up or to allow: nothing is loaded from it)
      if (!loads.some(([u]) => url.startsWith(u))) fail(`${f} loads ${url}, which no entry of tools/licences.json covers`);
      // (one Google Fonts address can ask for several families: each must be a font of its own in the audit)
      if (/^https:\/\/fonts\.googleapis\.com\//.test(url)) for (const fam of url.matchAll(/[?&]family=([^:&]+)/g)) {
        const name = decodeURIComponent(fam[1].replace(/\+/g, ' '));
        if (byName.get(name)?.kind !== 'font' || !byName.get(name).ships) fail(`${f} loads the font ${name}, which is not a font in tools/licences.json`);
      }
    }
    if (policy && />\s*$/.test(line)) policy = false;
  }
}

// The notices: everything that ships is named in THIRD-PARTY-NOTICES.txt, which sw.js keeps for offline play.
const notices = read('THIRD-PARTY-NOTICES.txt');
for (const e of audit) if (e.ships && !notices.includes(e.name)) fail(`${e.name} ships but has no notice in THIRD-PARTY-NOTICES.txt`);
if (!read('sw.js').includes("'THIRD-PARTY-NOTICES.txt'")) fail('sw.js does not keep THIRD-PARTY-NOTICES.txt');

// Every entry and package to its list: the core's check.
const core = require('../core/scripts/licences.mjs');
const { failures, summary } = core.check(core.loadConfig(path.join(root, 'tools/licence-check.json')), root);
for (const m of failures) fail(m);
if (fails.size) { for (const m of fails) console.error('FAIL:', m); process.exit(1); }
console.log(`ok   ${audit.length} entries, nothing used left out, the notices whole; ${summary}`);
