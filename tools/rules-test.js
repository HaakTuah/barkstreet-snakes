#!/usr/bin/env node
// Rule checks on hand-built boards: node tools/rules-test.js [--seed N]
// Loads tuning.js, ai.js and engine.js unchanged, the way the game does.
// (N: other randomness for the checks that don't seed their own.)
// The checks are in tools/rules/, one file per area, run in name order in one scope (tools/parts.js):
// 00 setup, 01 crashes, 02 golden beetles and leaps, 03 jump and flash, 04 fire, weather and burrows,
// 05 choking on your own tail, 06-08 the rivals of rounds four to six, 09 the woodpecker, 10 beetles,
// 11-13 the owner's playtest and the rivals' pass. A new check goes in its area's file, or a new one.
const path = require('path');
const read = require('./parts.js')(path.join(__dirname, 'rules'));
const failed = read('failed'), checks = read('checks');
console.log(failed ? `${failed} failed of ${checks} checks` : `all good (${checks} checks)`);
process.exit(failed ? 1 : 0);
