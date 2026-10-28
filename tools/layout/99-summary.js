console.log(results.join('\n'));
console.log('\nthe board (CSS px), before → now:');
console.log(board.join('\n'));
if (oneBoards.length) console.log(`\non desktops as browsers have them, the board (CSS px):\n${oneBoards.join('\n')}`);
console.log('\nthe woodpecker perched, CSS px tall:');
for (const d of DEVICES) if (d.bird) console.log(`  ${d.name.padEnd(48)} ${d.bird}`);
if (between.length) {
  console.log('\nheld upright, heights in between (CSS px): the board (before) and the woodpecker perched, its smallest');
  for (const s of between) console.log(`  ${`${s.w}×${s.h}`.padEnd(10)} ${r1(s.board)} (${s.before}), ${r1(s.bird)}`);
}
