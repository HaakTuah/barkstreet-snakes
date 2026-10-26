// node pool.js <variant>... : per-persona win rates on each seed and pooled over
// both (600 rounds on seeds 3 and 11, from the saved JSON; nothing is re-run).
const fs = require('fs'), path = require('path');
const { summarize } = require('./study.js');
const load = (v, s) => { const f = path.join(__dirname, 'runs', `${v}-s${s}-600.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).rounds : null; };
const rows = [];
for (const v of process.argv.slice(2)) {
  const a = load(v, 3), b = load(v, 11);
  if (!a || !b) { console.log(`${v}: missing a seed`); continue; }
  const sa = summarize(a), sb = summarize(b), sp = summarize([...a, ...b.map(R => ({ ...R, r: R.r + 100000 }))]);
  const names = Object.keys(sp.win).sort();
  rows.push([v, sa.fingerprint, sb.fingerprint, `${sa.winSpread.join('-')} / ${sb.winSpread.join('-')}`, sp.winSpread.join('-'), names.map(n => `${n} ${sa.win[n]}/${sb.win[n]}`).join(', ')]);
}
console.log('| build | fingerprint s3 | fingerprint s11 | win spread s3 / s11 | pooled | per persona, s3/s11 |\n|---|---|---|---|---|---|');
for (const r of rows) console.log('| ' + r.join(' | ') + ' |');
