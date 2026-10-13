#!/usr/bin/env node
// Checks the chatter's lines: every line in English has its Chinese (Copycat
// repeats what it hears, in Chinese), every {who} line names someone the
// same way in both, and no voice has an empty list.
//
//   node tools/chatter-test.js
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'chatter.js'), 'utf8');
// (The tables are private to the chatter, so they're read from the source.)
const table = name => {
  const start = src.indexOf(`  const ${name} = {`);
  const end = src.indexOf('\n  };\n', start);
  if (start < 0 || end < 0) throw new Error('no table ' + name);
  return new Function(`return ${src.slice(start + `  const ${name} = `.length, end + 4)}`)();
};
const VOICES = table('VOICES'), ZH = table('ZH');
let fails = 0;
const ok = (cond, what) => { if (!cond) { console.error('FAIL:', what); fails++; } };

const lines = [];
const walk = (v, path) => {
  if (Array.isArray(v)) { ok(v.length > 0, `${path} has lines`); for (const l of v) lines.push([path, l]); }
  else for (const [k, w] of Object.entries(v)) walk(w, `${path}.${k}`);
};
for (const [who, voice] of Object.entries(VOICES)) walk(voice, who);

const chinese = t => /[一-鿿]/.test(t);
for (const [path, line] of lines) {
  if (chinese(line)) continue; // (Copycat's own)
  ok(line in ZH, `${path}: "${line}" has its Chinese`);
  if (line in ZH) ok(line.includes('{who}') === ZH[line].includes('{who}'), `${path}: "${line}" names {who} in both`);
}
if (fails) { console.error(`${fails} failed`); process.exit(1); }
console.log(`ok   ${lines.length} lines, every one in Chinese too`);
console.log('all good');
