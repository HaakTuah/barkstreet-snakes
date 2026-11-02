#!/usr/bin/env node
// Checks the licence gate's audit check (tools/licences.js): it passes the repository as it is, and fails each form
// of something unaudited or off the list, each staged in a copy of the repository (every name invented).
//
//   node tools/licences-test.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const ok = require('./ok.js');
const root = path.join(__dirname, '..');
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);

// A fresh copy of the repository's files, changed by `change(dir)`, and whether the check passes on it.
function gate(change) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'licences-'));
  for (const f of tracked) { fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true }); fs.copyFileSync(path.join(root, f), path.join(dir, f)); }
  change(dir);
  const run = spawnSync(process.execPath, [path.join(dir, 'tools/licences.js')], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return { passes: run.status === 0, out: run.stdout + run.stderr };
}
const append = (f, text) => dir => fs.appendFileSync(path.join(dir, f), text);
const edit = (f, from, to) => dir => { const p = path.join(dir, f), s = fs.readFileSync(p, 'utf8'); if (!s.includes(from)) throw new Error(`${f} has no ${from}`); fs.writeFileSync(p, s.replace(from, to)); };
const entry = e => dir => { const p = path.join(dir, 'tools/licences.json'), a = JSON.parse(fs.readFileSync(p, 'utf8')); a.entries.push(e); fs.writeFileSync(p, JSON.stringify(a)); };

ok(gate(() => {}).passes, 'the repository as it is passes');
ok(gate(append('scripts/cloud-setup.sh', '# npm install mossgrip-widgets, a comment, fetches nothing\n')).passes, 'a comment naming an install passes');
const fails = [
  ['a licence off the list', entry({ name: 'mossgrip-widgets', licence: 'GPL-3.0-only' })],
  ['one off the list naming a question of its own', entry({ name: 'mossgrip-widgets', licence: 'GPL-3.0-only', question: 999 })],
  ['an allowed licence grouped with one off the list', entry({ name: 'mossgrip-widgets', licence: '(MIT OR GPL-3.0-only) AND GPL-3.0-only' })],
  ['an action not in the audit', append('.github/workflows/tests.yml', '      - uses: mossgrip/setup-moss@v1\n')],
  ['npm install of a package not in the audit', append('scripts/cloud-setup.sh', 'npm install -g mossgrip-widgets@1.2.3\n')],
  ['an audited package fetched at another version', edit('scripts/cloud-setup.sh', 'playwright@1.49.1', 'playwright@1.50.0')],
  ['a lock file holding a package at another version than audited', dir => fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({ packages: { '': {}, 'node_modules/typescript': { version: '6.0.3' } } }))],
  ['npm install without a version', append('scripts/cloud-setup.sh', 'npm install --no-save typescript\n')],
  ['npm install of a major version alone, into a folder', append('scripts/cloud-setup.sh', 'npm install -g --prefix /opt/moss node@26\n')],
  ['npm install of a range', append('scripts/cloud-setup.sh', 'npm install typescript@^6.0.2\n')],
  ['npm install of an alias', append('scripts/cloud-setup.sh', 'npm install typescript@npm:mossgrip-lint@9.0.0\n')],
  ['npm install from a URL', append('scripts/cloud-setup.sh', 'npm install https://mossgrip.example/widgets.tgz\n')],
  ['npm install from git', append('scripts/cloud-setup.sh', 'npm install git+https://mossgrip.example/widgets.git\n')],
  ['npm install of a variable', append('scripts/cloud-setup.sh', 'npm i "$PKG"\n')],
  ['npx of a package without a version', append('scripts/cloud-setup.sh', 'npx -y mossgrip-cli build\n')],
  ['a package.json dependency not in the audit', dir => fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ devDependencies: { 'mossgrip-widgets': '1.2.3' } }))],
  ['an address the game loads that is not in the audit', edit('index.html', '<body>', '<body><img src="https://cdn.mossgrip.example/bark.png">')],
  ['a scheme-relative address', edit('index.html', '<body>', '<body><img src="//cdn.mossgrip.example/bark.png">')],
  ['a second Google Fonts family', edit('index.html', 'family=Fredoka:', 'family=Fredoka:wght@400&family=Mossface:')],
  ['an asset file not in the audit', dir => fs.writeFileSync(path.join(dir, 'bark.png'), '')],
  ['a shipped entry without its notice', entry({ name: 'mossgrip-widgets', licence: 'MIT', ships: true })],
];
for (const [what, change] of fails) { const r = gate(change); ok(!r.passes && /FAIL/.test(r.out), `fails on ${what}`, r.out); }
