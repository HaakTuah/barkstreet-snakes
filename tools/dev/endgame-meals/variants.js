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
// long the snake is (no length worth keeping). never: in the endgame food is
// worth nothing, starving or not.
const fs = require('fs'), path = require('path');
const [dir, which] = process.argv.slice(2);
const file = path.join(dir || '', 'ai/food.js');
if (!dir || !['always', 'never'].includes(which) || !fs.existsSync(file)) {
  console.error('usage: node tools/dev/endgame-meals/variants.js <copy of the game> always|never');
  process.exit(1);
}
const EDITS = {
  always: [['keepLen = endgame ? TUNE.MIN_LENGTH + (w.keep ?? KEEP) :', 'keepLen = endgame ? Infinity :']],
  never: [['eatW = desperate ? Math.max(600, eatW0) : eatW0;', 'eatW = desperate ? Math.max(600, eatW0) : eatW0;\n  if (endgame) foodW0 = eatW0 = foodW = eatW = 0;']],
};
let src = fs.readFileSync(file, 'utf8');
for (const [from, to] of EDITS[which]) {
  if (!src.includes(from)) { console.error(`ai/food.js has changed: "${from}" not found`); process.exit(1); }
  src = src.replace(from, to);
}
fs.writeFileSync(file, src);
console.log(`${file}: ${which}`);
