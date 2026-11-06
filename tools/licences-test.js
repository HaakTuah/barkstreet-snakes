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
ok(gate(entry({ name: 'mossgrip-cli', licence: 'GPL-3.0-only' })).passes, 'a tool that only runs under GPL passes');
ok(gate(edit('index.html', '<body>', '<body><link rel="preconnect" href="https://cdn.mossgrip.example">')).passes, 'a preconnect to a bare origin, loading nothing, passes');
ok(gate(edit('index.html', "connect-src 'self'", "connect-src 'self' https://cdn.mossgrip.example")).passes, 'a bare origin the content security policy allows, loading nothing, passes');
const fails = [
  ['a tool under a licence that is not open source', entry({ name: 'mossgrip-widgets', licence: 'LicenseRef-Mossgrip-Proprietary' })],
  ['a shipped package under a licence only tools may use', entry({ name: 'mossgrip-widgets', licence: 'MPL-2.0', ships: true })],
  ['a tool under terms point 10 never allows', entry({ name: 'mossgrip-cli', licence: 'BUSL-1.1' })],
  ["GitHub's terms on something not GitHub's", entry({ name: 'mossgrip-cli', licence: 'LicenseRef-GitHub-Terms' })],
  ["GitHub's terms on something that ships", edit('tools/licences.json', '"kind": "github-service",', '"kind": "github-service", "ships": true,')],
  ['an allowed licence grouped with one off the list, in what ships', entry({ name: 'mossgrip-widgets', licence: '(MIT OR GPL-3.0-only) AND GPL-3.0-only', ships: true })],
  ['a licence on the ship list but not in SECURITY.md\'s', edit('tools/licences.json', '"ships": ["MIT",', '"ships": ["LGPL-2.1-only", "MIT",')],
  ['a ship-list licence missing from the tools\' list', edit('.github/dependency-review-config.yml', '  - Zlib\n', '')],
  ['a licence point 10 never allows on the tools\' list', edit('.github/dependency-review-config.yml', '  - MIT\n', '  - MIT\n  - CC-BY-NC-4.0\n')],
  ['AND and OR mixed without brackets', entry({ name: 'mossgrip-widgets', licence: 'MIT AND GPL-3.0-only OR MIT' })],
  ['an action not in the audit', append('.github/workflows/tests.yml', '      - uses: mossgrip/setup-moss@v1\n')],
  ['npm install of a package not in the audit', append('scripts/cloud-setup.sh', 'npm install -g mossgrip-widgets@1.2.3\n')],
  ['an audited package fetched at another version', edit('scripts/cloud-setup.sh', 'node@26.12.1', 'node@26.13.0')],
  ["the tools' lock file holding a package at another version than audited", edit('tools/package-lock.json', '"version": "1.64.1"', '"version": "1.65.0"')],
  ["the tools' package.json adding a package not in the audit", edit('tools/package.json', '"devDependencies": {', '"devDependencies": { "mossgrip-widgets": "1.2.3",')],
  ['a lock file holding a package at another version than audited', dir => fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({ packages: { '': {}, 'node_modules/typescript': { version: '6.0.3' } } }))],
  ['npm install with an option before install', append('scripts/cloud-setup.sh', 'npm -g install mossgrip-widgets\n')],
  ['npx in a string a tool runs', append('tools/dev/crop.js', "\nrequire('child_process').execSync('npx -y mossgrip-cli');\n")],
  ['npm install without a version', append('scripts/cloud-setup.sh', 'npm install --no-save typescript\n')],
  ['npm install of a major version alone, into a folder', append('scripts/cloud-setup.sh', 'npm install -g --prefix /opt/moss node@26\n')],
  ['npm install of a range', append('scripts/cloud-setup.sh', 'npm install typescript@^6.0.2\n')],
  ['npm install of an alias', append('scripts/cloud-setup.sh', 'npm install typescript@npm:mossgrip-lint@9.0.0\n')],
  ['npm install from a URL', append('scripts/cloud-setup.sh', 'npm install https://mossgrip.example/widgets.tgz\n')],
  ['npm install from git', append('scripts/cloud-setup.sh', 'npm install git+https://mossgrip.example/widgets.git\n')],
  ['npm install of a variable', append('scripts/cloud-setup.sh', 'npm i "$PKG"\n')],
  ['npx of a package without a version', append('scripts/cloud-setup.sh', 'npx -y mossgrip-cli build\n')],
  ['a package.json dependency not in the audit', dir => fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ devDependencies: { 'mossgrip-widgets': '1.2.3' } }))],
  ['a lock file holding a package not in the audit', dir => fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({ packages: { '': {}, 'node_modules/mossgrip-widgets': { version: '1.2.3' } } }))],
  ['third-party code copied into the game', dir => { fs.mkdirSync(path.join(dir, 'lib')); fs.writeFileSync(path.join(dir, 'lib/mossgrip.min.js'), '/*! mossgrip v1 | GPL-3.0 */\nvar m=1;\n'); }],
  ['third-party code served with the game but audited as a tool', dir => { fs.mkdirSync(path.join(dir, 'lib')); fs.writeFileSync(path.join(dir, 'lib/mossgrip.min.js'), '/*! mossgrip v1 | MIT */\nvar m=1;\n'); entry({ name: 'lib/mossgrip.min.js', licence: 'MIT' })(dir); }],
  ['an address the game loads, audited as a tool', entry({ name: 'mossgrip-cdn', licence: 'MIT', loads: ['https://cdn.mossgrip.example/'] })],
  ['third-party code copied into a tool', dir => fs.writeFileSync(path.join(dir, 'tools/dev/mossgrip.mjs'), '/*! mossgrip v1 | GPL-3.0 */\nexport const m = 1;\n')],
  ['npx in a tool written as a module', dir => fs.writeFileSync(path.join(dir, 'tools/dev/moss.mjs'), "import { execSync } from 'child_process';\nexecSync('npx -y mossgrip-cli');\n")],
  ['a bare origin loaded from, not warmed up', edit('index.html', '<body>', '<body><script src="https://cdn.mossgrip.example"></script>')],
  ['an address the game loads that is not in the audit', edit('index.html', '<body>', '<body><img src="https://cdn.mossgrip.example/bark.png">')],
  ['an address in the content security policy that is not in the audit', edit('index.html', "connect-src 'self'", "connect-src 'self' https://cdn.mossgrip.example/bark.js")],
  ['a scheme-relative address', edit('index.html', '<body>', '<body><img src="//cdn.mossgrip.example/bark.png">')],
  ['a second Google Fonts family', dir => { entry({ name: 'Fredoka', kind: 'font', licence: 'OFL-1.1', ships: true, loads: ['https://fonts.googleapis.com/css2?family=Fredoka:'] })(dir); edit('index.html', '<body>', '<body><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400&family=Mossface:wght@400">')(dir); }],
  ['an asset file not in the audit', dir => fs.writeFileSync(path.join(dir, 'bark.png'), '')],
  ['a font kept with a tool', dir => fs.writeFileSync(path.join(dir, 'tools/dev/mossface.ttf'), '')],
  ['a shipped entry without its notice', entry({ name: 'mossgrip-widgets', licence: 'MIT', ships: true })],
];
for (const [what, change] of fails) { const r = gate(change); ok(!r.passes && /FAIL/.test(r.out), `fails on ${what}`, r.out); }
