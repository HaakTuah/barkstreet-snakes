#!/usr/bin/env node
// The reading-size check ("Read little" and "Split by meaning" in AGENTS.md; the workshop check's points 2 and 3 in
// docs/orchestrating.md, measured on every PR). Its marks are in tools/sizes.json, and it fails:
//   - when a file every session reads is past its mark (about 20 KB; one past that has a mark of its own, its size,
//     which may only shrink: when the file shrinks, the mark comes down with it), or their total is past its mark;
//   - when the PR changes a file past about 50 KB (Step 0: split it by meaning first), unless `past` lists it with a
//     mark at least its size. The archive (dated records, added to by every merge) and binary files are not counted.
// A PR that crosses a mark moves the mark in tools/sizes.json and says why in its description. The PR's changes are
// those against SIZES_BASE, else COPIES_BASE (set by the copies check's workflow), else where HEAD left origin/develop.
// Run by tools/copies-test.js, in the copies check's CI step. Node's own modules only.
//
//   node tools/sizes-test.js
const fs = require('fs');
const { execFileSync } = require('child_process');
process.chdir(require('path').join(__dirname, '..'));
const MARKS = 'tools/sizes.json';
const marks = JSON.parse(fs.readFileSync(MARKS, 'utf8'));
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const kb = n => (n / 1024).toFixed(1);
const size = f => fs.existsSync(f) ? fs.statSync(f).size : 0;
const fail = [], notes = [];

// the files every session reads
let total = 0;
for (const [f, mark] of Object.entries(marks.read)) {
  const n = size(f);
  total += n;
  if (n > mark) fail.push(`${f} is ${n} bytes, past its mark of ${mark}: make it smaller, or raise its mark in ${MARKS} and say why in the PR`);
  else if (mark > marks.each && n < mark) fail.push(`${f} has shrunk to ${n} bytes: lower its mark in ${MARKS} from ${mark} to ${Math.max(n, marks.each)}`);
}
if (total > marks.total) fail.push(`the files every session reads total ${total} bytes, past their mark of ${marks.total}: make them smaller, or raise the mark in ${MARKS} and say why in the PR`);

// Step 0: files past the split mark that the PR changes
const big = git(['ls-files', '-z']).split('\0').filter(f => f && !f.startsWith('docs/archive/') && size(f) > marks.split
  && !fs.readFileSync(f).subarray(0, 8000).includes(0));
let base = process.env.SIZES_BASE || process.env.COPIES_BASE;
if (!base) try { base = git(['merge-base', 'origin/develop', 'HEAD']).trim(); } catch { base = ''; }
if (base) {
  let changed;
  try { changed = new Set(git(['diff', '--name-only', base]).split('\n')); } catch { console.error(`FAIL: ${base} is not a commit here: fetch it`); process.exit(1); }
  for (const f of big.filter(f => changed.has(f))) {
    if (!(marks.past[f] >= size(f))) fail.push(`${f} is ${size(f)} bytes, past the ${marks.split}-byte mark, and this PR changes it: split it by meaning first (Step 0, "Split by meaning" in AGENTS.md), or list it under "past" in ${MARKS} and say why in the PR`);
  }
} else notes.push('no base to compare with (set SIZES_BASE), so the files past the split mark were not checked for changes');
for (const f of Object.keys(marks.past)) if (!big.includes(f)) fail.push(`${MARKS} lists ${f} under "past", but it is not past ${marks.split} bytes now: remove it`);

for (const n of notes) console.log(`note ${n}`);
for (const x of fail) console.error(`FAIL: ${x}`);
if (fail.length) process.exit(1);
console.log(`ok   read by every session: ${Object.keys(marks.read).map(f => `${f} ${kb(size(f))} KB`).join(', ')}; ${kb(total)} of ${kb(marks.total)} KB. `
  + `Past ${kb(marks.split)} KB: ${big.join(', ') || 'none'}${base ? ', none changed here' : ''}`);
