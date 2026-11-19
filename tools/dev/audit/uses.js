#!/usr/bin/env node
// Which part of the game uses which names of the others (the code audit, issue #764): the 130 script files `index.html` loads
// share one global space, with no imports, so this reads the uses a build tool would have read. Measures, prints, fails
// nothing:  node tools/dev/audit/uses.js [--json file] [--root dir]
//
// A part is the folder of a file (ai, audio, chatter, engine, game, render) or `root` for the files beside index.html.
// Two kinds of name are read:
//   - a shared name: a function, class or const at the start of a line, in a file that adds it to the one shared space;
//   - a namespace: `window.SnakeX = ...` (the engine's, the AI's, ...), with its members read where another file
//     takes them by an alias (`const Engine = window.SnakeEngine`, or `engine = window.SnakeEngine || {}`, `const { GRID } = Engine`) or by `Engine.member`.
// A use is a mention in code that no scope round it binds (tools/dev/audit/free-names.js): a local or a parameter of the same name
// as a shared one is not a use, and neither is a word after a dot, an object's key, or what a string or a comment holds; the
// expressions of a template count. A form of binding that reader does not know is read as a use, so a count may be a little high,
// never low. The order of the page's script tags is not read.
const fs = require('fs');
const path = require('path');
const { stripComments } = require('../../../scripts/js-text.js');
const freeNames = require('./free-names.js');

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1]; };
const root = path.resolve(opt('--root') || path.join(__dirname, '../../..'));
const jsonOut = opt('--json');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // (a name as a pattern that matches only itself)

const files = [...read('index.html').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/^https?:/.test(f));
const partOf = f => (f.includes('/') ? f.split('/')[0] : 'root');
const PARTS = [...new Set(files.map(partOf))].sort();

const DECL = /^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^class\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*[=;,]|^(?:const|let|var)\s+[{[]([^=]*)[}\]]\s*=/;
const NS = /^window\.([A-Za-z_$][\w$]*)\s*=/;
const ALIAS = /(?:^|[\s;(,])(?:(?:const|let|var)\s+)?([A-Za-z_$][\w$]*)\s*=\s*(?:window\.)?(Snake[A-Za-z]*)\b(?!\s*[.=(])/; // (`const E = window.SnakeX;`, or `E = window.SnakeX || {};` after a `let E`, at any depth)
const PICK = /^(?:const|let|var)\s+\{([^}]*)\}\s*=\s*(?:window\.)?([A-Za-z_$][\w$]*)\s*;/;

const info = {};           // file -> { part, lines, bytes, text, tokens, declares: Set, aliases: Map(alias -> namespace), picks: [{ns, member, as}] }
const declaredIn = new Map(); // shared name -> [file]
const nsIn = new Map();       // namespace -> file
for (const f of files) {
  const src = read(f), text = stripComments(src).code, lines = text.split('\n');
  const fn = freeNames(src);
  const rec = info[f] = { part: partOf(f), lines: src.split('\n').length, bytes: Buffer.byteLength(src), free: fn.free, text: fn.text, declares: new Set(), aliases: new Map(), picks: [], ns: [] };
  for (const line of lines) {
    let m = NS.exec(line);
    if (m) { rec.ns.push(m[1]); nsIn.set(m[1], f); continue; }
    if ((m = ALIAS.exec(line))) { rec.aliases.set(m[1], m[2]); }
    if ((m = PICK.exec(line))) for (const p of m[1].split(',')) { const [a, b] = p.replace(/=.*/, '').split(':').map(s => s.trim()); if (a) rec.picks.push({ owner: m[2], member: a, as: b || a }); }
    if ((m = DECL.exec(line))) {
      const names = m[4] != null ? m[4].split(',').map(s => s.replace(/.*:/, '').replace(/=.*/, '').replace(/^\s*\.\.\./, '').trim()).filter(s => /^[A-Za-z_$][\w$]*$/.test(s)) : [m[1] || m[2] || m[3]];
      for (const n of names) { rec.declares.add(n); if (!declaredIn.has(n)) declaredIn.set(n, []); if (!declaredIn.get(n).includes(f)) declaredIn.get(n).push(f); }
    }
  }
}
// an alias of a namespace, or a name picked out of one, is that file's way of using the namespace, not a name of its own
for (const f of files) {
  const r = info[f];
  for (const a of r.aliases.keys()) { r.declares.delete(a); const d = declaredIn.get(a); if (d) { d.splice(d.indexOf(f), 1); if (!d.length) declaredIn.delete(a); } }
  for (const p of r.picks) { r.declares.delete(p.as); const d = declaredIn.get(p.as); if (d) { const i = d.indexOf(f); if (i >= 0) d.splice(i, 1); if (!d.length) declaredIn.delete(p.as); } }
}

// an alias or a picked-out name is a file's way of using a namespace, and a shared name of its own that others may use too
const aliasOf = new Map();  // alias name -> namespace
const pickOf = new Map();   // picked name -> { ns, member }
for (const f of files) {
  for (const [a, ns] of info[f].aliases) aliasOf.set(a, ns);
}
for (const f of files) for (const p of info[f].picks) { const ns = aliasOf.get(p.owner) || (nsIn.has(p.owner) ? p.owner : null); if (ns) pickOf.set(p.as, { ns, member: p.member }); }

// shared names: who declares, who mentions, outside its own declaring files
const names = [];
for (const [name, decl] of declaredIn) {
  if (aliasOf.has(name) || pickOf.has(name)) continue;
  const users = files.filter(f => !decl.includes(f) && info[f].free.has(name));
  names.push({ name, declaredIn: decl, users });
}
// namespaces: members taken from each, by file
const members = new Map(); // namespace -> Map(member -> Set(files))
const nsUsers = new Map(); // namespace -> Set(files)
const add = (m, k, f) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(f); };
const take = (ns, member, f) => { if (nsIn.get(ns) === f) return; add(nsUsers, ns, f); if (member) { if (!members.has(ns)) members.set(ns, new Map()); add(members.get(ns), member, f); } };
for (const f of files) {
  const free = info[f].free;
  for (const [alias, ns] of aliasOf) for (const o of free.get(alias) || []) take(ns, o.member, f);
  for (const ns of nsIn.keys()) for (const o of free.get(ns) || []) take(ns, o.member, f);        // SnakeX.member
  for (const o of free.get('window') || []) if (nsIn.has(o.member)) take(o.member, null, f);       // window.SnakeX
  for (const [name, { ns, member }] of pickOf) if (free.has(name)) take(ns, member, f);
  for (const p of info[f].picks) { const ns = aliasOf.get(p.owner) || (nsIn.has(p.owner) ? p.owner : null); if (ns) take(ns, p.member, f); }
}
// what the page, the clock and randomness give: read as plain text, by file
const OUTWARD = ['document', 'localStorage', 'sessionStorage', 'navigator', 'requestAnimationFrame', 'AudioContext', 'webkitAudioContext', 'getComputedStyle', 'fetch', 'location', 'performance', 'matchMedia', 'Image', 'OffscreenCanvas', 'Path2D', 'Date.now', 'new Date', 'Math.random', 'setTimeout', 'setInterval'];
const outward = {};
for (const w of OUTWARD) {
  const rx = new RegExp(w.includes('.') || w.includes(' ') ? w.replace('.', '\\s*\\.\\s*') : `(?<![\\w$.])${w}(?![\\w$])`, 'g');
  for (const f of files) { const n = (info[f].text.match(rx) || []).length; if (n) (outward[f] ||= {})[w] = n; }
}

// ---- the numbers
const part = f => info[f].part;
const matrix = {}; // user part -> declaring part -> { names, files }
for (const A of PARTS) { matrix[A] = {}; for (const B of PARTS) matrix[A][B] = { names: new Set(), files: new Set() }; }
for (const n of names) for (const u of n.users) {
  const B = part(n.declaredIn[0]), A = part(u);
  if (A === B) continue;
  matrix[A][B].names.add(n.name); matrix[A][B].files.add(u);
}
const nsMatrix = {}; // user part -> namespace -> { members, files }
for (const A of PARTS) nsMatrix[A] = {};
for (const [ns, us] of nsUsers) for (const f of us) { const A = part(f); if (part(nsIn.get(ns)) === A) continue; (nsMatrix[A][ns] ||= { members: new Set(), files: new Set() }).files.add(f); }
for (const [ns, ms] of members) for (const [mem, fs_] of ms) for (const f of fs_) { const A = part(f); if (part(nsIn.get(ns)) === A) continue; (nsMatrix[A][ns] ||= { members: new Set(), files: new Set() }).members.add(mem); }

const usedBy = n => new Set(n.users.map(part)).size;
const rank = names.filter(n => n.users.length).sort((a, b) => b.users.length - a.users.length || a.name.localeCompare(b.name));
const declLine = n => { const f = n.declaredIn[0], i = read(f).split('\n').findIndex(l => new RegExp(`^(?:async\\s+)?(?:function\\s*\\*?\\s*|class\\s+|(?:const|let|var)\\s+)[{\\[]?[^=]*?(?<![\\w$])${escape(n.name)}(?![\\w$])`).test(l)); return `${f}:${i + 1}`; };
const dist = arr => { const s = [...arr].sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return { n: s.length, median: q(0.5), p90: q(0.9), max: s[s.length - 1] }; };

const perFile = files.map(f => {
  const out = new Set(), parts = new Set(), reached = new Set();
  for (const n of names) if (n.users.includes(f)) { out.add(n.name); parts.add(part(n.declaredIn[0])); reached.add(n.declaredIn[0]); }
  for (const [ns, us] of nsUsers) if (us.has(f)) { parts.add(part(nsIn.get(ns))); reached.add(nsIn.get(ns)); }
  parts.delete(part(f));
  const fanIn = names.filter(n => n.declaredIn.includes(f)).reduce((a, n) => a + n.users.length, 0);
  return { file: f, part: part(f), lines: info[f].lines, bytes: info[f].bytes, declares: info[f].declares.size, namesOfOthers: out.size, partsReached: parts.size, filesReached: reached.size, fanIn };
});

// where the rules (engine, ai) reach into the display, or out of the page
const DISPLAY = ['render', 'audio', 'chatter', 'game'];
const reach = [];
for (const n of names) {
  const B = part(n.declaredIn[0]);
  if (!DISPLAY.includes(B)) continue;
  for (const u of n.users) if (['engine', 'ai'].includes(part(u))) reach.push({ from: u, name: n.name, declaredIn: n.declaredIn[0] });
}
const reachNs = [];
for (const [ns, us] of nsUsers) { const B = part(nsIn.get(ns)); if (DISPLAY.includes(B)) for (const f of us) if (['engine', 'ai'].includes(part(f))) reachNs.push({ from: f, namespace: ns, members: [...(members.get(ns) || new Map())].filter(([, s]) => s.has(f)).map(([m]) => m) }); }
const rulesOutward = Object.entries(outward).filter(([f]) => ['engine', 'ai'].includes(part(f))).map(([file, w]) => ({ file, ...w }));

const result = {
  files: files.length, parts: PARTS,
  perPart: Object.fromEntries(PARTS.map(p => [p, { files: files.filter(f => part(f) === p).length, lines: files.filter(f => part(f) === p).reduce((a, f) => a + info[f].lines, 0), bytes: files.filter(f => part(f) === p).reduce((a, f) => a + info[f].bytes, 0), sharedNames: names.filter(n => part(n.declaredIn[0]) === p).length }])),
  sharedNames: names.length,
  namesDeclaredInMoreThanOneFile: names.filter(n => n.declaredIn.length > 1).map(n => ({ name: n.name, files: n.declaredIn })),
  namespaces: [...nsIn].map(([ns, f]) => ({ namespace: ns, file: f, members: members.has(ns) ? members.get(ns).size : 0, files: nsUsers.has(ns) ? nsUsers.get(ns).size : 0 })),
  namesUsedByOtherFiles: { used: rank.length, unusedOutside: names.length - rank.length, byFiles: dist(rank.map(n => n.users.length)), byParts: dist(rank.map(usedBy)), in5OrMoreFiles: rank.filter(n => n.users.length >= 5).length, in10OrMore: rank.filter(n => n.users.length >= 10).length, in25OrMore: rank.filter(n => n.users.length >= 25).length, inMoreThanOneOtherPart: rank.filter(n => usedBy(n) >= 2).length },
  hubs: rank.slice(0, 30).map(n => ({ name: n.name, declaredAt: declLine(n), usedByFiles: n.users.length, usedByParts: [...new Set(n.users.map(part))].sort() })),
  matrixNames: Object.fromEntries(PARTS.map(A => [A, Object.fromEntries(PARTS.filter(B => A !== B && matrix[A][B].names.size).map(B => [B, names.filter(n => part(n.declaredIn[0]) === B && n.users.some(u => part(u) === A)).map(n => n.name).sort()]))])),
  matrix: Object.fromEntries(PARTS.map(A => [A, Object.fromEntries(PARTS.filter(B => matrix[A][B].names.size).map(B => [B, { names: matrix[A][B].names.size, files: matrix[A][B].files.size }]))])),
  namespaceMatrix: Object.fromEntries(PARTS.map(A => [A, Object.fromEntries(Object.entries(nsMatrix[A]).map(([ns, v]) => [ns, { members: v.members.size, files: v.files.size }]))])),
  filesByNamesOfOthers: dist(perFile.map(p => p.namesOfOthers)), filesByPartsReached: dist(perFile.map(p => p.partsReached)),
  filesByFilesReached: dist(perFile.map(p => p.filesReached)),
  mentionsWithinAPartAndAcross: (() => { let within = 0, across = 0; for (const n of names) for (const u of n.users) part(u) === part(n.declaredIn[0]) ? within++ : across++; return { within, across }; })(),
  perPartFileReach: Object.fromEntries(PARTS.map(p => [p, dist(perFile.filter(q => q.part === p).map(q => q.filesReached))])),
  filesReaching3OrMoreOtherParts: perFile.filter(p => p.partsReached >= 3).length,
  widestFiles: [...perFile].sort((a, b) => b.filesReached - a.filesReached || b.namesOfOthers - a.namesOfOthers).slice(0, 12).map(p => ({ file: p.file, filesReached: p.filesReached, namesOfOthers: p.namesOfOthers, partsReached: p.partsReached })),
  mostLeanedOnFiles: [...perFile].sort((a, b) => b.fanIn - a.fanIn).slice(0, 12).map(p => ({ file: p.file, mentionsByOthers: p.fanIn, declares: p.declares })),
  rulesReachingIntoTheDisplay: { sharedNames: reach, namespaces: reachNs, ofThePageOrClock: rulesOutward },
};

const cell = (A, B) => { const m = matrix[A][B]; return A === B ? '·' : m.names.size ? `${m.names.size}/${m.files.size}` : '-'; };
console.log(`files: ${files.length} script files in ${PARTS.length} parts; ${names.length} shared names, ${nsIn.size} namespaces; ${result.namesDeclaredInMoreThanOneFile.length} names declared in more than one file`);
console.log('per part (files, lines, shared names):', PARTS.map(p => `${p} ${result.perPart[p].files}/${result.perPart[p].lines}/${result.perPart[p].sharedNames}`).join(', '));
console.log(`\nnames of the column's part that the row's part mentions (names/files that do); rows use, columns declare:`);
console.log(['       ', ...PARTS.map(p => p.padStart(8))].join(''));
for (const A of PARTS) console.log([A.padEnd(7), ...PARTS.map(B => cell(A, B).padStart(8))].join(''));
const u = result.namesUsedByOtherFiles;
console.log(`\nof ${names.length} shared names: ${u.used} are mentioned by another file (median ${u.byFiles.median} files, 90th percentile ${u.byFiles.p90}, most ${u.byFiles.max}); in 5 or more files ${u.in5OrMoreFiles}, 10 or more ${u.in10OrMore}, 25 or more ${u.in25OrMore}; by more than one other part ${u.inMoreThanOneOtherPart}`);
console.log(`a file takes names from ${result.filesByFilesReached.median} other files at the median (90th percentile ${result.filesByFilesReached.p90}, most ${result.filesByFilesReached.max}); ${result.mentionsWithinAPartAndAcross.within} mentions are inside the declaring part, ${result.mentionsWithinAPartAndAcross.across} across parts`);
console.log(`a file reaches names of ${result.filesByPartsReached.median} other parts at the median (90th percentile ${result.filesByPartsReached.p90}, most ${result.filesByPartsReached.max}); ${result.filesReaching3OrMoreOtherParts} files reach 3 or more`);
console.log('hubs:', result.hubs.slice(0, 12).map(h => `${h.name} (${h.usedByFiles} files, ${h.declaredAt})`).join('; '));
console.log(`rules into the display: ${reach.length} uses of ${new Set(reach.map(r => r.name)).size} shared names of render/audio/chatter/game by engine/ai files; ${reachNs.length} namespace uses; ${rulesOutward.length} rules files touch the page or the clock`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(result, null, 1) + '\n');
