#!/usr/bin/env node
// Which files change together in the history, and live apart (the code audit, issue #764, its fourth question). The unit is a merged pull
// request: what it changed on main (git's first-parent diff of each merge), so a feature's many commits count once. A pull request that
// touches more than 60 files (a move, a sync, a rename) is left out. Measures and prints; fails nothing:
//   node tools/dev/audit/cochange.js [--json file] [--min 8] [--share 0.5] [--since <rev>]
// For each pair of files: together = pull requests that changed both, share = together / the changes of the less changed of the two.
// A pair is "apart" when the two lie in different parts (the folder of a game file; `tools` for a suite or a tool; `root`; `docs`) .
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const root = path.join(__dirname, '../../..');
const min = Number(opt('--min', 8)), minShare = Number(opt('--share', 0.5)), since = opt('--since', null), jsonOut = opt('--json', null);
const rev = opt('--rev', 'origin/main');

const out = execFileSync('git', ['log', '--first-parent', '-m', '--name-only', '--no-renames', '--format=@%H', ...(since ? [`${since}..${rev}`] : [rev])], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
const gameFiles = new Set([...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
const here = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', rev], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n')); // (files the tree still has: a file renamed or gone is not a part to name)
const prs = out.split('@').slice(1).map(b => b.split('\n').slice(1).filter(Boolean)).filter(fs_ => fs_.length && fs_.length <= 60);
const skip = f => /^(core\/|docs\/|\.github\/|tools\/(package-lock|node_modules))/.test(f) || /\.(md|json|jpg|png|txt)$/.test(f);
const part = f => gameFiles.has(f) ? (f.includes('/') ? f.split('/')[0] : 'root') : /^tools\/.*test\.js$|^tools\/(rules|render|input|layout|ui|chatter|online)\//.test(f) ? 'tests' : f.startsWith('tools/') ? 'tools' : f.includes('/') ? f.split('/')[0] : 'root-other';

const changes = new Map(), pair = new Map();
let counted = 0;
for (const fs_ of prs) {
  const files = fs_.filter(f => here.has(f) && !skip(f)).sort();
  if (!files.length) continue;
  counted++;
  for (const f of files) changes.set(f, (changes.get(f) || 0) + 1);
  for (let i = 0; i < files.length; i++) for (let j = i + 1; j < files.length; j++) { const k = files[i] + '\0' + files[j]; pair.set(k, (pair.get(k) || 0) + 1); }
}
const rows = [...pair].map(([k, together]) => { const [a, b] = k.split('\0'); return { a, b, partA: part(a), partB: part(b), together, share: Math.round(together / Math.min(changes.get(a), changes.get(b)) * 100) / 100 }; });
const sel = rows.filter(r => r.together >= min && r.share >= minShare);
const apart = sel.filter(r => r.partA !== r.partB && r.partA !== 'tests' && r.partB !== 'tests').sort((x, y) => y.together - x.together);
const withTests = sel.filter(r => r.partA === 'tests' || r.partB === 'tests');
const within = sel.filter(r => r.partA === r.partB && r.partA !== 'tests').sort((x, y) => y.together - x.together);
const result = {
  rev, pullRequests: counted, files: changes.size, mostChanged: [...changes].sort((x, y) => y[1] - x[1]).slice(0, 12).map(([file, n]) => ({ file, pullRequests: n })),
  thresholds: { together: min, share: minShare },
  pairsAtThresholds: { all: sel.length, apartNotTests: apart.length, withinOnePart: within.length, withATest: withTests.length },
  apart: apart.slice(0, 30), within: within.slice(0, 15),
  testsMostOften: withTests.sort((x, y) => y.together - x.together).slice(0, 8),
};
console.log(`${counted} merged pull requests (up to 60 files) touched ${changes.size} files; pairs that changed together in ${min}+ of them and in ${minShare * 100}%+ of the less-changed file's: ${sel.length} (${apart.length} between parts, ${within.length} inside one part, ${withTests.length} with a suite or tool)`);
for (const r of apart.slice(0, 15)) console.log(`  ${String(r.together).padStart(3)}x ${String(Math.round(r.share * 100)).padStart(3)}%  ${r.a}  +  ${r.b}`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(result, null, 1) + '\n');
