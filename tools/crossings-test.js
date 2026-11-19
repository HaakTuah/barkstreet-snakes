#!/usr/bin/env node
// The part check (cleaning lane, issue #783, step 1): the game's parts (a folder of script files, or `root`) share one global
// space with no imports, so nothing stops one part reaching into another. This reads the uses with the code audit's measure
// (tools/dev/audit/uses.js) and holds them to tools/crossings.json, so a crossing never grows and the count only goes down:
//   - a bare shared name of one part used in another is a crossing, and must be in the config's baseline; one the baseline
//     lists that no longer happens fails too, so it is deleted when its last use goes;
//   - a namespace (window.SnakeX) is taken only by the parts its `mayUse` names, and by a part with `only`, only those members;
//   - engine and ai never use a name or namespace of render, audio, chatter or game, baseline or not;
//   - a use of a namespace with no member to read (`window.SnakeX` or an alias of it passed on bare) fails, wherever the part's other
//     uses are readable, instead of counting as nothing;
//   - a part, namespace or name the config names that is not in the code fails.
// Then the check is run on staged changes of the measure, each form that must fail.
//
//   node tools/crossings-test.js
const ok = require('./ok.js');
const config = require('./crossings.json');
const { result, nsMatrix, nsIn, part, opaque, RULES, DISPLAY } = require('./dev/audit/uses.js');

const measured = {
  parts: result.parts,
  declaredBy: Object.fromEntries([...nsIn].map(([ns, file]) => [ns, part(file)])),
  takes: Object.fromEntries(Object.entries(nsMatrix).map(([p, nss]) => [p, Object.fromEntries(Object.entries(nss).map(([ns, v]) => [ns, [...v.members].sort()]))])),
  names: result.matrixNames,
  opaque,
  rulesIntoDisplay: result.rulesReachingIntoTheDisplay.sharedNames.length + result.rulesReachingIntoTheDisplay.namespaces.length,
};

// The problems of a measure against a config, each a sentence that says what to do.
function check(m, cfg) {
  const out = [];
  const pairs = (tree, f) => { for (const [a, row] of Object.entries(tree)) for (const [b, list] of Object.entries(row)) for (const n of list) f(a, b, n); };
  const isIn = (tree, a, b, n) => (tree[a]?.[b] || []).includes(n);
  // names
  pairs(m.names, (a, b, n) => { if (!isIn(cfg.baseline, a, b, n)) out.push(`${a} uses ${n} of ${b}: a new crossing. Go through ${b}'s namespace, or move the name; never add it to tools/crossings.json`); });
  pairs(cfg.baseline, (a, b, n) => {
    if (!isIn(m.names, a, b, n)) out.push(`${a} no longer uses ${n} of ${b}: delete it from the baseline in tools/crossings.json, so the count stays down`);
    if (RULES.includes(a) && DISPLAY.includes(b)) out.push(`${a} (rules) may never use ${n} of ${b} (display), baseline or not`);
  });
  if (m.rulesIntoDisplay) out.push(`engine or ai uses ${m.rulesIntoDisplay} names or namespaces of the display (render, audio, chatter, game)`);
  // a use the reader cannot follow
  for (const o of m.opaque) out.push(`${o.file}:${o.line} uses ${o.namespace}${o.alias ? ` (as ${o.alias})` : ''} with no member to read: write \`const X = window.${o.namespace}\` and take its members by name`);
  // namespaces
  for (const [a, nss] of Object.entries(m.takes)) for (const [ns, members] of Object.entries(nss)) {
    const may = cfg.mayUse[ns];
    if (!may) { out.push(`${a} uses ${ns}, which only ${m.declaredBy[ns]} may: add it to mayUse in tools/crossings.json only if ${a} is meant to`); continue; }
    if (may !== '*' && !may.includes(a)) out.push(`${a} uses ${ns}, which ${a} may not: its mayUse lists ${may.join(', ')}`);
    const only = cfg.only[a]?.[ns];
    if (only) for (const mem of members) if (!only.includes(mem)) out.push(`${a} takes ${ns}.${mem}, but may take only ${only.join(', ')}`);
  }
  // the config names only what exists
  const known = (what, list, have) => { for (const x of list) if (!have.includes(x)) out.push(`tools/crossings.json names ${what} ${x}, which the code does not have: delete it`); };
  known('a namespace', Object.keys(cfg.mayUse), Object.keys(m.declaredBy));
  known('a part', [...Object.keys(cfg.only), ...Object.keys(cfg.baseline), ...Object.values(cfg.baseline).flatMap(Object.keys), ...Object.values(cfg.mayUse).filter(Array.isArray).flat()], m.parts);
  return out;
}

const problems = check(measured, config);
const crossings = Object.values(config.baseline).flatMap(Object.values).flat().length;
ok(!problems.length, `the parts cross no further than the baseline (${crossings} crossings left)`, '\n  ' + problems.join('\n  '));

// Staged: each form that must fail does, and the code as it is does not.
const clone = o => JSON.parse(JSON.stringify(o));
const fails = (what, change, expect) => {
  const m = clone(measured), cfg = clone(config);
  change(m, cfg);
  const got = check(m, cfg);
  ok(got.some(p => p.includes(expect)), `fails ${what}`, got.join(' | ') || 'nothing failed');
};
fails('a new crossing', m => { (m.names.render ||= {}).ai = [...(m.names.render.ai || []), 'TUNE']; }, 'render uses TUNE of ai: a new crossing');
fails('a crossing that no longer happens', (m, cfg) => { cfg.baseline.render.engine.push('gone'); }, 'no longer uses gone of engine');
fails('a baseline that lets the rules use the display', (m, cfg) => { m.names.engine.render = ['CELL']; cfg.baseline.engine.render = ['CELL']; }, 'rules) may never use CELL');
fails('the rules using the display', m => { m.rulesIntoDisplay = 1; }, 'engine or ai uses 1 names');
fails('a namespace taken by a part not allowed', m => { m.takes.ai.SnakeRecords = ['save']; }, 'ai uses SnakeRecords, which ai may not');
fails('a namespace no config line allows', m => { m.takes.ai.SnakeVersion = ['x']; m.declaredBy.SnakeVersion = 'root'; }, 'ai uses SnakeVersion, which only root may');
fails('a member outside `only`', m => { m.takes.engine.SnakeAI.push('PERSONAS'); }, 'engine takes SnakeAI.PERSONAS');
fails('a use with no member to read', m => { m.opaque.push({ file: 'engine/step.js', line: 1, namespace: 'SnakeAI' }); }, 'engine/step.js:1 uses SnakeAI with no member to read');
fails('a config namespace the code lacks', (m, cfg) => { cfg.mayUse.SnakeGone = ['game']; }, 'names a namespace SnakeGone');
fails('a config part the code lacks', (m, cfg) => { cfg.baseline.gone = { engine: ['T'] }; }, 'names a part gone');
