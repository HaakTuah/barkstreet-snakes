#!/usr/bin/env node
// The audit's numbers as the report's tables (issue #764), from the folder tools/dev/audit/run.sh wrote; with an older folder, each number
// beside its older value, so two audits set side by side are one command:
//   node tools/dev/audit/tables.js <folder> [<older folder>]
const fs = require('fs');
const path = require('path');

const [dir, older] = process.argv.slice(2);
if (!dir) { console.error('usage: node tools/dev/audit/tables.js <folder> [<older folder>]'); process.exit(2); }
const load = (d, f) => { try { return d && JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); } catch { return null; } };
const A = f => load(dir, f), B = f => load(older, f);
const row = (cells) => '| ' + cells.join(' | ') + ' |';
const table = (head, rows) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
const vs = (a, b) => (b == null || a == null ? String(a ?? 'n/a') : a === b ? String(a) : `${a} (was ${b})`);
const pick = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
const num = (rows, a, b) => rows.map(([label, p]) => [label, vs(pick(a, p), b && pick(b, p))]);

const shape = A('shape-game.json'), shapeOld = B('shape-game.json');
if (shape) {
  console.log('### The game files: shape\n');
  console.log(table(['Measure', 'Value'], num([
    ['script files the page loads', 'files.code'], ['names in the one shared space', 'globals.names'], ['names declared in more than one file', 'globals.inMoreThanOne.length'],
    ['functions', 'functions.count'], ['lines, median', 'functions.lines.median'], ['lines, 90th percentile', 'functions.lines.p90'], ['lines, longest', 'functions.lines.max'],
    ['over 50 lines', 'functions.over50Lines'], ['over 100 lines', 'functions.over100Lines'], ['nested 4 deep or more', 'functions.depth4OrMore'],
    ['more than 15 branch points', 'functions.over15Branches'], ['more than 30 branch points', 'functions.over30Branches'], ['imports', 'imports.total'],
  ], shape, shapeOld)));
  console.log('\nMost branching: ' + shape.functions.mostBranching.slice(0, 8).map(f => `${f.file}:${f.line} ${f.name} (${f.branches})`).join('; '));
  console.log('Longest: ' + shape.functions.longest.slice(0, 8).map(f => `${f.file}:${f.line} ${f.name} (${f.lines} lines)`).join('; '));
  console.log('Deepest: ' + shape.functions.deepest.slice(0, 8).map(f => `${f.file}:${f.line} ${f.name} (${f.depth})`).join('; '));
}
const tests = A('shape-tests.json');
if (tests) console.log(`\nThe suites' own code (${tests.files.code} files): ${tests.functions.count} functions; over 50 lines ${tests.functions.over50Lines}; more than 30 branch points ${tests.functions.over30Branches}; longest ${tests.functions.lines.max} lines.`);

const uses = A('uses.json'), usesOld = B('uses.json');
if (uses) {
  console.log('\n### Who uses which names of the others\n');
  const P = uses.parts;
  console.log(table(['Part', 'Files', 'Lines', 'Shared names declared'], P.map(p => [p, vs(uses.perPart[p].files, usesOld && usesOld.perPart[p] && usesOld.perPart[p].files), vs(uses.perPart[p].lines, usesOld && usesOld.perPart[p] && usesOld.perPart[p].lines), vs(uses.perPart[p].sharedNames, usesOld && usesOld.perPart[p] && usesOld.perPart[p].sharedNames)])));
  console.log('\nShared names of the column\'s part that the row\'s part uses (distinct names / files that use them):\n');
  console.log(table(['uses \\ declares', ...P], P.map(a => [a, ...P.map(b => a === b ? '·' : uses.matrix[a][b] ? `${uses.matrix[a][b].names}/${uses.matrix[a][b].files}` : '-')])));
  console.log('\nNamespaces (`window.Snake*`) the row\'s part takes from (members used / files that use it):\n');
  const ns = [...new Set(P.flatMap(p => Object.keys(uses.namespaceMatrix[p])))];
  console.log(table(['part', ...ns], P.map(a => [a, ...ns.map(n => uses.namespaceMatrix[a][n] ? `${uses.namespaceMatrix[a][n].members}/${uses.namespaceMatrix[a][n].files}` : '-')])));
  const u = uses.namesUsedByOtherFiles;
  console.log('\n' + table(['Measure', 'Value'], [
    ['shared names', vs(uses.sharedNames, usesOld && usesOld.sharedNames)], ['used by another file', vs(u.used, usesOld && usesOld.namesUsedByOtherFiles.used)],
    ['used by 5 or more files', vs(u.in5OrMoreFiles, usesOld && usesOld.namesUsedByOtherFiles.in5OrMoreFiles)], ['used by 10 or more', vs(u.in10OrMore, usesOld && usesOld.namesUsedByOtherFiles.in10OrMore)], ['used by 25 or more', vs(u.in25OrMore, usesOld && usesOld.namesUsedByOtherFiles.in25OrMore)],
    ['used by more than one other part', vs(u.inMoreThanOneOtherPart, usesOld && usesOld.namesUsedByOtherFiles.inMoreThanOneOtherPart)],
    ['mentions inside the declaring part / across parts', `${uses.mentionsWithinAPartAndAcross.within} / ${uses.mentionsWithinAPartAndAcross.across}`],
    ['files a file takes names from: median / 90th / most', `${uses.filesByFilesReached.median} / ${uses.filesByFilesReached.p90} / ${uses.filesByFilesReached.max}`],
    ['files that reach 3 or more other parts', vs(uses.filesReaching3OrMoreOtherParts, usesOld && usesOld.filesReaching3OrMoreOtherParts)],
    ['rules (engine, ai) using the display\'s shared names / namespaces', `${uses.rulesReachingIntoTheDisplay.sharedNames.length} / ${uses.rulesReachingIntoTheDisplay.namespaces.length}`],
  ]));
  console.log('\nHubs (shared names most files use): ' + uses.hubs.slice(0, 15).map(h => `${h.name} ${h.usedByFiles} (${h.declaredAt})`).join('; '));
  console.log('Widest files (files they take names from): ' + uses.widestFiles.slice(0, 8).map(f => `${f.file} ${f.filesReached}`).join('; '));
  console.log('Most leaned on files (mentions by other files): ' + uses.mostLeanedOnFiles.slice(0, 8).map(f => `${f.file} ${f.mentionsByOthers}`).join('; '));
}

const co = A('cochange.json');
if (co) {
  console.log(`\n### Files that change together\n\n${co.pullRequests} merged pull requests (up to 60 files) at ${co.rev}; pairs in ${co.thresholds.together}+ of them and ${co.thresholds.share * 100}%+ of the less-changed file's changes: ${co.pairsAtThresholds.all}; between parts ${co.pairsAtThresholds.apartNotTests}, inside a part ${co.pairsAtThresholds.withinOnePart}, with a suite or tool ${co.pairsAtThresholds.withATest}.\n`);
  console.log(table(['Together', 'Share', 'Files'], co.apart.slice(0, 15).map(r => [r.together, Math.round(r.share * 100) + '%', `${r.a} + ${r.b}`])));
}

const st = A('start.json'), stOld = B('start.json');
if (st) {
  console.log('\n### Start-up (ms, median of ' + st.runs + ')\n');
  console.log(table(['Profile', 'First visit: paint / DOMContentLoaded / load', 'Second visit', 'Play to round shown / first tick', 'Requests, kB gzipped', 'Script of task ms'], Object.entries(st.profiles).map(([k, p]) => {
    const o = stOld && stOld.profiles[k];
    return [k, `${vs(p.firstVisit.paint, o && o.firstVisit.paint)} / ${vs(p.firstVisit.dcl, o && o.firstVisit.dcl)} / ${vs(p.firstVisit.load, o && o.firstVisit.load)}`, `${p.secondVisit.paint} / ${p.secondVisit.dcl} / ${p.secondVisit.load}`, `${p.roundShown} / ${p.roundTick}`, `${p.requests}, ${p.gzippedKb}`, `${p.scriptMs} of ${p.taskMs}`];
  })));
}
const su = A('suites.json');
if (su) {
  console.log('\n### Suites\n');
  const o = B('suites.json');
  console.log(table(['Suite', 'Seconds', 'Game files loaded', 'Parts loaded'], su.suites.map(s => [s.suite, vs(s.seconds, o && (o.suites.find(x => x.suite === s.suite) || {}).seconds) + (s.passed ? '' : ' FAILED'), s.gameFilesLoaded, Object.entries(s.parts).map(([p, n]) => `${p} ${n}`).join(', ') || 'none'])));
}
