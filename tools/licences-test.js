#!/usr/bin/env node
// Checks this game's own side of the licence check (tools/licences.js): the repository as it is passes, and each form of
// an address the game loads or a font left out fails, each staged in a fresh copy of the repository (every name
// invented). The core's own tests cover its check, its notices and its scan.
//
//   node tools/licences-test.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const ok = require('./ok.js');
const root = path.join(__dirname, '..');
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);

// A fresh copy of the repository's files, changed by `change(dir)`, and whether the check passes on it (the copy is a git
// repository of its own, since the core's scan reads what git tracks).
function gate(change) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'licences-'));
  for (const f of tracked) { fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true }); fs.copyFileSync(path.join(root, f), path.join(dir, f)); }
  change(dir);
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['add', '-A'], { cwd: dir });
  const run = spawnSync(process.execPath, [path.join(dir, 'tools/licences.js')], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return { passes: run.status === 0, out: run.stdout + run.stderr };
}
const edit = (f, from, to) => dir => { const p = path.join(dir, f), s = fs.readFileSync(p, 'utf8'); if (!s.includes(from)) throw new Error(`${f} has no ${from}`); fs.writeFileSync(p, s.replace(from, to)); };
const entry = e => dir => { const p = path.join(dir, 'tools/licences.json'), a = JSON.parse(fs.readFileSync(p, 'utf8')); a.entries.push(e); fs.writeFileSync(p, JSON.stringify(a)); };

ok(gate(() => {}).passes, 'the repository as it is passes');
ok(gate(edit('index.html', '<body>', '<body><link rel="preconnect" href="https://cdn.mossgrip.example">')).passes, 'a preconnect to a bare origin, loading nothing, passes');
ok(gate(edit('index.html', "connect-src 'self'", "connect-src 'self' https://cdn.mossgrip.example")).passes, 'a bare origin the content security policy allows, loading nothing, passes');
const fails = [
  ['an address the game loads, audited as a tool', entry({ name: 'mossgrip-cdn', licence: 'MIT', loads: ['https://cdn.mossgrip.example/'] })],
  ['a bare origin loaded from, not warmed up', edit('index.html', '<body>', '<body><script src="https://cdn.mossgrip.example"></script>')],
  ['an address the game loads that is not in the audit', edit('index.html', '<body>', '<body><img src="https://cdn.mossgrip.example/bark.png">')],
  ['an address in the content security policy that is not in the audit', edit('index.html', "connect-src 'self'", "connect-src 'self' https://cdn.mossgrip.example/bark.js")],
  ['a scheme-relative address', edit('index.html', '<body>', '<body><img src="//cdn.mossgrip.example/bark.png">')],
  ['a second Google Fonts family', dir => { entry({ name: 'Fredoka', kind: 'font', licence: 'OFL-1.1', ships: true, loads: ['https://fonts.googleapis.com/css2?family=Fredoka:'] })(dir); edit('index.html', '<body>', '<body><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400&family=Mossface:wght@400">')(dir); }],
  ['the notices left out of what sw.js keeps', edit('sw.js', "'THIRD-PARTY-NOTICES.txt'", "'NOTICES.txt'")],
];
for (const [what, change] of fails) { const r = gate(change); ok(!r.passes && /FAIL/.test(r.out), `fails on ${what}`, r.out); }
