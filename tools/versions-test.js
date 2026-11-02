#!/usr/bin/env node
// Checks the monthly version check (tools/versions.js), offline: every entry of tools/versions.json finds exactly one
// version in its file, and the release it would ask for is the newest stable one old enough (invented release times).
//
//   node tools/versions-test.js
const ok = require('./ok.js');
const { current, newest, issue } = require('./versions.js');

const entries = current();
ok(entries.length > 0 && entries.every(e => /^\d+\.\d+\.\d+$/.test(e.version) && e.days >= 7 && e.how), 'every entry finds one exact version in its file, with its wait and what to do');
let threw = false;
try { current([{ name: 'mossgrip', file: 'net.js', pattern: 'mossgrip@(\\d+\\.\\d+\\.\\d+)' }]); } catch { threw = true; }
ok(threw, 'an entry whose pattern finds no version fails, so a moved version is never silently skipped');

const now = Date.parse('2026-11-02T00:00:00Z'), ago = d => new Date(now - d * 864e5).toISOString();
const times = { created: ago(900), modified: ago(1), '1.4.0': ago(400), '1.5.4': ago(300), '1.5.10': ago(30), '2.0.0': ago(20), '2.1.0': ago(10), '2.2.0-rc.1': ago(30) };
ok(newest(times, { days: 7, version: '1.5.4' }, now) === '2.1.0', 'the newest stable release a week old, numbers compared as numbers');
ok(newest(times, { days: 14, version: '1.5.4' }, now) === '2.0.0', 'a script waits two weeks: one out ten days is not yet asked for');
ok(newest(times, { days: 7, sameMajor: true, version: '1.5.4' }, now) === '1.5.10', 'within the same major when asked: 1.5.10 above 1.5.4, not 2.x');
ok(newest({ '1.0.0': ago(2) }, { days: 7, version: '1.0.0' }, now) === null, 'nothing old enough, nothing asked for');
const i = issue({ name: 'mossgrip', file: 'net.js', version: '1.5.4', days: 14, how: 'Bump it.' }, '2.0.0');
ok(i.title.startsWith(i.key) && /\*\*Describe the solution you'd like\*\*\nBump it\./.test(i.body), "an issue's title starts with its key (so one already open is found) and its body has the template's headings");
