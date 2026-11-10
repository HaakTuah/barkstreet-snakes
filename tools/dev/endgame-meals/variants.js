#!/usr/bin/env node
// Entry 6, part 3 (hunger a conditional good to the end): the rivals that
// always eat in the endgame and those that never do, to play head to head
// against 2h's weighing (docs/design/39-the-rivals.md, "The endgame: a meal
// is worth the life it buys").
//
//   node tools/dev/endgame-meals/variants.js <copy of the game> always|never
//   node tools/abtest.js . <copy> --head-to-head --seed 81 --seed 83 --metrics side,deaths
//
// always: in the endgame (the frenzy, act 3) a meal counts in full, however
// long the snake is, and hunger is read from the clock alone, as before the
// weighing read it against the length worth keeping (which still prices a
// planned tail drop, as in 2h). never: in the endgame nothing is worth eating,
// starving or not (a mushroom still worth keeping away from; the weights that
// scale every other gain kept).
const fs = require('fs'), path = require('path');
const [dir, which] = process.argv.slice(2);
const file = path.join(dir || '', 'ai/food.js');
if (!dir || !['always', 'never'].includes(which) || !fs.existsSync(file)) {
  console.error('usage: node tools/dev/endgame-meals/variants.js <copy of the game> always|never');
  process.exit(1);
}
const EDITS = {
  always: [
    ['const spare = endgame ?', 'const spare = false ?'],
    ['growShare = myLen < keepLen ? 1 :', 'growShare = endgame || myLen < keepLen ? 1 :'],
    ['ateAt > -HOLE && len >= keepLen ?', 'ateAt > -HOLE && !endgame && len >= keepLen ?'],
  ],
  never: [
    ["if (f.kind === 'beetle' && bugCount < BUGS) {", "if (endgame && f.kind === 'beetle') continue;\n    if (f.kind === 'beetle' && bugCount < BUGS) {"],
    ['    if (!v) continue;', '    if (!v || endgame && v > 0) continue;'],
  ],
};
let src = fs.readFileSync(file, 'utf8');
for (const [from, to] of EDITS[which]) {
  if (!src.includes(from)) { console.error(`ai/food.js has changed: "${from}" not found`); process.exit(1); }
  src = src.replace(from, to);
}
fs.writeFileSync(file, src);
console.log(`${file}: ${which}`);
