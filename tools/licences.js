#!/usr/bin/env node
// The licence check's part that is this game's own (SECURITY.md, rule 10, with floor rule 10), run on every pull request
// by .github/workflows/licences.yml beside the core's check (core/scripts/licences.mjs, with tools/licence-check.json),
// which holds every entry of tools/licences.json and every package to its list, each shipped entry's notice in
// THIRD-PARTY-NOTICES.txt, and, by its scan, anything the game or its tools use that the audit leaves out. This adds what
// only a game served as it is, from GitHub Pages, has: every address the game loads from is an entry's ("loads"), and so
// ships; each Google Fonts family it asks for is a font of its own in the audit; and sw.js keeps the notices for offline
// play.
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

// What the game loads: every address in the files it serves (not the tools or notes).
const walk = (d, skip) => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap(x => x.isDirectory() ? (skip.has(x.name) ? [] : walk(path.join(d, x.name), skip)) : [path.join(d, x.name)]);
const own = /^https?:\/\/(www\.w3\.org|haaktuah\.github\.io|github\.com\/HaakTuah)\b/i;
const loads = audit.flatMap(e => (e.loads || []).map(u => [u, e]));
const served = walk('.', new Set(['.git', 'tools', 'docs', 'scripts', '.github', '.claude', 'node_modules', 'types', 'core']));
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

// The notices, which the core's check holds whole, are kept for offline play.
if (!read('sw.js').includes("'THIRD-PARTY-NOTICES.txt'")) fail('sw.js does not keep THIRD-PARTY-NOTICES.txt');

if (fails.size) { for (const m of fails) console.error('FAIL:', m); process.exit(1); }
console.log(`ok   ${audit.length} entries: every address the game loads audited, each font its own, the notices kept offline`);
