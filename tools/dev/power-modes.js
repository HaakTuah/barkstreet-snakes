#!/usr/bin/env node
// The far ends of "Using a feature must pay" (core/modules/game-design.md)
// for the plain jump and flash: turns a copy of the game into one whose
// rivals never use a plain power, or always do, the rules unchanged, to set
// against rivals that use them where they fit (tools/abtest.js
// --head-to-head: the seat-split A/B, design 39's "Balance targets", is
// that against never).
//   git worktree add --detach DIR && node tools/dev/power-modes.js DIR never|always|always-flash
// It changes DIR's AI in place:
//   never: no plain jump or flash (consider, in ai/powers.js); golden ones
//     as ever.
//   always: whenever a plain one is ready, the best plain jump or flash
//     it would survive (its line's score above DEAD / 2, as powerPick
//     reads trapped: a line that dies within the search scores DEAD and
//     a little), whatever it gains: a flash tried every way it could go,
//     a jump over any hurdle and over open ground (leap now), with only
//     the checks that keep it legal and safe (somewhere to come down that
//     no rival gets to first) in ai/leaps.js.
//   always-flash: the same for the plain flash alone, its jumps where they
//     fit (always jumps first, and so flashes less than where they fit:
//     7d measures always flashing with this). Neither takes a flash
//     through its own body unless it's a planned drop (ai/flash.js).
const fs = require('fs'), path = require('path');
const [dir, mode] = process.argv.slice(2);
if (!dir || !['never', 'always', 'always-flash'].includes(mode)) { console.error('usage: power-modes.js DIR never|always|always-flash'); process.exit(1); }
const edit = (rel, swaps) => {
  const file = path.join(dir, rel);
  let s = fs.readFileSync(file, 'utf8');
  for (const [from, to] of swaps) {
    if (s.split(from).length !== 2) { console.error(`${file}: no single "${from.slice(0, 50)}..." (the AI changed: update this tool)`); process.exit(1); }
    s = s.replace(from, to);
  }
  fs.writeFileSync(file, s);
};
const PLAIN = 'const plain = flash ? me.dashes === 0 : me.leaps === 0;';
const top = '    if (v === null) return;\n';
// (always: the plain power the rival would survive, the best of them,
// over anything else; for a flash, every way it could go)
const always = plain => [
  [top, `${top}    ${plain} if (plain) { if (v > DEAD / 2 && (!bestPower || !bestPower.plain || v > bestPower.v)) bestPower = { d, flash, v, now: !flash && leapNow, fly: flash ? 0 : leapFly, turn: flash ? null : leapTurn, styled: false, plain: true }; return; } // (power-modes.js: ${mode})\n    if (bestPower && bestPower.plain) return;\n`],
  ['(dropping || d === crawlDir || habit.everyWay ||', '(true || dropping || d === crawlDir || habit.everyWay ||'],
];
if (mode === 'never') edit('ai/powers.js', [[top, `${top}    ${PLAIN} if (plain) return; // (power-modes.js: never)\n`]]);
else if (mode === 'always-flash') edit('ai/powers.js', always('const plain = flash && me.dashes === 0;'));
else {
  edit('ai/powers.js', always(PLAIN));
  edit('ai/leaps.js', [
    ['if (!golden && !trapped && !ringCover.length) return null;', '/* power-modes.js: always */'],
    ['if (span < 1 || (!golden && !trapped && !coverAt(path[span], span + 1))) return null;', 'if (span < 1) return null; // (power-modes.js: always)'],
    ['if (!((habit.jumpAny || coilJump) && reach[framed[land]] > down)) return null;', 'if (!(reach[framed[land]] > down)) return null; // (power-modes.js: always)'],
  ]);
}
console.log(`${dir}: ${mode}`);
