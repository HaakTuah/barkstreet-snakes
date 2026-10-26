// node mkvariant.js <name> '<json of tuning overrides>'
// Copies the flex build (flex4-r6: main at 2d95a2d with patch-flex.js .. patch-flex4.js)
// to variants/<name> and edits its tuning.js.
const fs = require('fs'), path = require('path');
const [name, json] = process.argv.slice(2);
const over = JSON.parse(json || '{}');
const src = path.join(__dirname, process.env.FROM || 'flex4-r6'), dst = path.join(__dirname, 'variants', name);
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true });
const tp = path.join(dst, 'tuning.js');
let t = fs.readFileSync(tp, 'utf8');
for (const [k, v] of Object.entries(over)) {
  const re = new RegExp('^([ \\t]+' + k + ':[ \\t]*)([^,]+)(,)', 'm');
  if (re.test(t)) t = t.replace(re, (_, a, b, c) => a + JSON.stringify(v) + c);
  else t = t.replace('window.TUNING = Object.freeze({', m => `${m}\n  ${k}: ${JSON.stringify(v)}, // (r6 study)`);
}
fs.writeFileSync(tp, t);
fs.writeFileSync(path.join(dst, 'VARIANT.json'), JSON.stringify(over));
console.log('variant', name, JSON.stringify(over));
