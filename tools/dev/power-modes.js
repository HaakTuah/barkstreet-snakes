#!/usr/bin/env node
// The far ends of "Using a feature must pay" (core/modules/game-design.md)
// for the plain jump and flash: turns a copy of the game into one whose
// rivals never use a plain power, or always do, the rules unchanged, to set
// against rivals that use them where they fit (tools/abtest.js
// --head-to-head: the seat-split A/B, design 39's "Balance targets", is
// that against never).
//   git worktree add --detach DIR && node tools/dev/power-modes.js DIR never|always
// It changes DIR's ai/powers.js in place (consider, in powerPick):
//   never: no plain jump or flash; golden ones as ever.
//   always: whenever a plain one is ready, the best plain jump or flash
//     it would survive (its line's score above DEAD / 2, as powerPick
//     reads trapped: a line that dies within the search scores DEAD and
//     a little), whatever it gains, tried every way a flash could go.
const fs = require('fs'), path = require('path');
const [dir, mode] = process.argv.slice(2);
if (!dir || !['never', 'always'].includes(mode)) { console.error('usage: power-modes.js DIR never|always'); process.exit(1); }
const file = path.join(dir, 'ai/powers.js');
let s = fs.readFileSync(file, 'utf8');
const swap = (from, to) => { if (s.split(from).length !== 2) { console.error(`${file}: no single "${from.slice(0, 50)}..." (powerPick changed: update this tool)`); process.exit(1); } s = s.replace(from, to); };
const PLAIN = 'const plain = flash ? me.dashes === 0 : me.leaps === 0;';
const top = '    if (v === null) return;\n';
if (mode === 'never') swap(top, `${top}    ${PLAIN} if (plain) return; // (power-modes.js: never)\n`);
else {
  swap(top, `${top}    ${PLAIN} if (plain) { if (v > DEAD / 2 && (!bestPower || !bestPower.plain || v > bestPower.v)) bestPower = { d, flash, v, now: !flash && leapNow, fly: flash ? 0 : leapFly, turn: flash ? null : leapTurn, styled: false, plain: true }; return; } // (power-modes.js: always)\n    if (bestPower && bestPower.plain) return;\n`);
  swap('(dropping || d === crawlDir || habit.everyWay ||', '(true || dropping || d === crawlDir || habit.everyWay ||');
}
fs.writeFileSync(file, s);
console.log(`${file}: ${mode}`);
