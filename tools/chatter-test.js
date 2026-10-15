#!/usr/bin/env node
// Checks the chatter's lines: every line in English has its Chinese (Copycat
// repeats what it hears, in Chinese), every {who} line names someone the
// same way in both, no voice has an empty list, no Chinese is left over from
// a line that's gone, and every punchline is a line someone says.
//
//   node tools/chatter-test.js
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'chatter.js'), 'utf8');
// (The tables are private to the chatter, so they're read from the source:
// from the opening bracket to the closing one, at the start of a line.)
const slice = (head, tail, name) => {
  const start = src.indexOf(head);
  const end = src.indexOf(tail, start);
  if (start < 0 || end < 0) throw new Error('no table ' + name);
  return new Function(`return ${src.slice(start + head.length - 1, end + '\n  }'.length)}`)();
};
const table = name => slice(`  const ${name} = {`, '\n  };\n', name);
const VOICES = table('VOICES'), ZH = table('ZH'), REPLIES = table('REPLIES');
const PUNCHLINES = slice('  const PUNCHLINES = new Set([', '\n  ]);\n', 'PUNCHLINES');
let fails = 0;
const ok = (cond, what) => { if (!cond) { console.error('FAIL:', what); fails++; } };

const lines = [];
const walk = (v, path) => {
  if (Array.isArray(v)) { ok(v.length > 0, `${path} has lines`); for (const l of v) lines.push([path, l]); }
  else for (const [k, w] of Object.entries(v)) walk(w, `${path}.${k}`);
};
for (const [who, voice] of Object.entries(VOICES)) walk(voice, who);
// (The answers to Mason are said, and repeated, like any other line.)
for (const [cue, r] of Object.entries(REPLIES)) {
  for (const l of r.lines) lines.push([`replies to "${cue}"`, l]);
  if (r.then) lines.push([`then, after "${cue}"`, r.then]);
}

const chinese = t => /[一-鿿]/.test(t);
for (const [path, line] of lines) {
  if (chinese(line)) continue; // (Copycat's own)
  ok(line in ZH, `${path}: "${line}" has its Chinese`);
  if (line in ZH) ok(line.includes('{who}') === ZH[line].includes('{who}'), `${path}: "${line}" names {who} in both`);
}
const said = new Set(lines.map(([, l]) => l));
const orphans = Object.keys(ZH).filter(l => !said.has(l));
for (const l of orphans) ok(false, `the Chinese for "${l}" has no English line (it was removed or reworded)`);
const spoken = new Set(Object.values(VOICES).flatMap(function all(v) { return Array.isArray(v) ? v : Object.values(v).flatMap(all); }));
for (const l of PUNCHLINES) ok(spoken.has(l), `punchline "${l}" is a line someone says`);
if (fails) { console.error(`${fails} failed`); process.exit(1); }
console.log(`ok   ${lines.length} lines, every one in Chinese too`);
console.log(`ok   ${Object.keys(ZH).length} Chinese lines, none left over`);
console.log(`ok   ${PUNCHLINES.length} punchlines, each told once a round`);
console.log('all good');
