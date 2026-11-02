#!/usr/bin/env node
// The versions Dependabot cannot see (tools/versions.json): each read from its file, and compared with the npm
// registry's newest stable release that is old enough to take. Run monthly by .github/workflows/versions.yml.
//
//   node tools/versions.js            (one line each: up to date, or behind)
//   node tools/versions.js --issues   (JSON: an issue's key, title and body for each one behind)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const DAY = 864e5;
const STABLE = /^(\d+)\.(\d+)\.(\d+)$/;

// Each entry with the version its file holds now: exactly one, or it throws (a pattern that no longer finds it).
function current(entries = JSON.parse(fs.readFileSync(path.join(__dirname, 'versions.json'), 'utf8')).entries) {
  return entries.map(e => {
    const src = fs.readFileSync(path.join(root, e.file), 'utf8');
    const found = new Set([...src.matchAll(new RegExp(e.pattern, 'g'))].map(m => m[1]));
    if (found.size !== 1) throw new Error(`${e.name}: ${e.file} holds ${found.size ? [...found].join(', ') : 'no version'} by ${e.pattern}, not one`);
    return { ...e, version: [...found][0] };
  });
}

// The newest stable release published at least `days` before `now` (and of the same major, if asked), from the
// registry's release times ({ version: ISO date }); null if none.
const parts = v => v.match(STABLE).slice(1).map(Number);
const later = (a, b) => { const x = parts(a), y = parts(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };
function newest(times, { days, sameMajor, version }, now) {
  const ok = Object.keys(times).filter(v => STABLE.test(v) && now - Date.parse(times[v]) >= days * DAY
    && (!sameMajor || parts(v)[0] === parts(version)[0]));
  return ok.sort(later).pop() || null;
}

// What an issue says for an entry behind: the Feature request template's headings (.github/ISSUE_TEMPLATE/).
const issue = (e, to) => ({
  key: `Version check: ${e.name} `,
  title: `Version check: ${e.name} ${e.version} is behind ${to}`,
  body: [
    '**Is your feature request related to a problem? Please describe.**',
    `${e.name} is pinned at ${e.version} in \`${e.file}\`, and ${to} has been out for at least ${e.days} days. Dependabot cannot see it, so the monthly version check (\`.github/workflows/versions.yml\`, \`tools/versions.json\`) opened this.`,
    '', '**Describe the solution you\'d like**', e.how,
    '', '**Describe alternatives you\'ve considered**', 'Staying on the pinned version, if the release notes show nothing worth the change.',
    '', '**Why it matters, and a rough cost**', 'Fixes and security updates reach the game and its tools; a small PR, licences audited again (SECURITY.md, point 10).',
    '', '**Additional context**', `Newest stable release: https://www.npmjs.com/package/${e.name}/v/${to}`,
    '', '---', '_Opened by the monthly version check (`.github/workflows/versions.yml`)._',
  ].join('\n'),
});

if (require.main === module) {
  const now = Date.now(), behind = [];
  for (const e of current()) {
    const times = JSON.parse(execFileSync('npm', ['view', e.name, 'time', '--json'], { encoding: 'utf8' }));
    const to = newest(times, e, now);
    if (to && later(to, e.version) > 0) behind.push(issue(e, to));
    if (!process.argv.includes('--issues')) console.log(`${e.name}: ${e.version} in ${e.file}; newest at least ${e.days} days old: ${to}${to && later(to, e.version) > 0 ? ' (behind)' : ''}`);
  }
  if (process.argv.includes('--issues')) console.log(JSON.stringify(behind));
}
module.exports = { current, newest, issue };
