// The lines unchanged: this copy's chatter/ against a git ref's (origin/develop unless told),
// each run as the page runs it (index.html's chatter files, in order, on a stand-in page),
// then every voice's lines, every line's Chinese (the impressions and the answers included),
// the Metagamer's labels and the punchlines compared, by byte.
// Key order is free: the table is only ever looked up.
//   node docs/archive/studies/same-zh.js [ref]   (run from the repository)
const fs = require('fs'), vm = require('vm'), cp = require('child_process');
const ref = process.argv[2] || 'origin/develop';
const files = html => [...html.matchAll(/<script src="(chatter\/[^"]+)"/g)].map(m => m[1]);
const atRef = f => cp.execSync(`git show ${ref}:${f}`, { encoding: 'utf8' });
function tables(read) {
  // (The impressions name each rival: a stand-in name, the same on both sides.)
  const c = vm.createContext({ window: { SnakeAI: { PERSONAS: new Proxy({}, { get: (o, k) => ({ name: `<${String(k)}>` }) }) } } });
  for (const f of files(read('index.html'))) vm.runInContext(read(f), c, { filename: f });
  return vm.runInContext('({ zh: ZH, labels: ZH_LABELS, voices: JSON.stringify(VOICES), punchlines: JSON.stringify([...PUNCHLINES].sort()) })', c);
}
const a = tables(atRef), b = tables(f => fs.readFileSync(f, 'utf8'));
const keys = new Set([...Object.keys(a.zh), ...Object.keys(b.zh)]);
const differ = [...keys].filter(k => a.zh[k] !== b.zh[k]);
const same = !differ.length && JSON.stringify(a.labels) === JSON.stringify(b.labels) && a.voices === b.voices && a.punchlines === b.punchlines;
if (!same) { console.log(`DIFFER: ${differ.length} lines, e.g. ${JSON.stringify(differ.slice(0, 3))}; labels ${JSON.stringify(a.labels) === JSON.stringify(b.labels)}, voices ${a.voices === b.voices}, punchlines ${a.punchlines === b.punchlines}`); process.exit(1); }
console.log(`same as ${ref}: ${keys.size} lines in Chinese (with the impressions and the answers), the labels, the punchlines and every voice`);
