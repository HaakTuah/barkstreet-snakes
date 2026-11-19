#!/usr/bin/env node
// How long each suite takes, and which parts of the game it loads (the code audit, issue #764, its fifth question): each suite runs alone
// through scripts/test.sh (so its way of running stays the one place), with tools/dev/audit/reads.js noting every game file its node processes read.
// A browser suite loads the whole page. Measures and prints; fails nothing:
//   node tools/dev/audit/suites.js [--json file] [suite ...]      (no suite: every one scripts/test.sh runs)
// layout runs as test.sh runs it, its five CI jobs side by side; its time is the longest job's, which is what a session waits.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '../../..');
const argv = process.argv.slice(2);
const jf = argv.indexOf('--json'), jsonOut = jf < 0 ? null : argv[jf + 1];
const named = argv.filter((a, i) => !a.startsWith('--') && i !== jf + 1);
const all = fs.readFileSync(path.join(root, 'scripts/test.sh'), 'utf8').match(/&& suites=\(([^)]*)\)/)[1].trim().split(/\s+/);
const suites = named.length ? named : all;
const gameFiles = new Set([...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
const part = f => (f.includes('/') ? f.split('/')[0] : 'root');

const out = [];
for (const s of suites) {
  const reads = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'audit-reads-')), 'reads');
  const t0 = Date.now();
  const r = spawnSync(path.join(root, 'scripts/test.sh'), [s], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, env: { ...process.env, AUDIT_READS: reads, AUDIT_ROOT: root, NODE_OPTIONS: `--require ${path.join(__dirname, 'reads.js')}`, BARKBITE_PRIORITY: 'normal' } });
  const seconds = (Date.now() - t0) / 1000;
  const read = fs.existsSync(reads) ? [...new Set(fs.readFileSync(reads, 'utf8').split('\n').filter(Boolean))] : [];
  const loaded = read.filter(f => gameFiles.has(f)), parts = {};
  for (const f of loaded) parts[part(f)] = (parts[part(f)] || 0) + 1;
  const row = { suite: s, passed: r.status === 0, seconds: Math.round(seconds * 10) / 10, gameFilesLoaded: loaded.length, parts, otherFilesRead: read.filter(f => !gameFiles.has(f)).length };
  out.push(row);
  console.log(`${row.passed ? 'PASS' : 'FAIL'} ${s.padEnd(9)} ${String(row.seconds).padStart(7)} s  game files loaded ${String(row.gameFilesLoaded).padStart(3)}/${gameFiles.size}  ${Object.entries(parts).map(([p, n]) => `${p} ${n}`).join(', ')}`);
}
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ at: new Date().toISOString().slice(0, 10), cpus: os.cpus().length, suites: out }, null, 1) + '\n');
