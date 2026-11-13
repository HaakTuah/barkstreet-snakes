// ---------------------------------------------------------------- each rival's power style (part 7b)
// (39-the-rivals, "Every rival has a power style".) A style is data: a share of the plain flash's price for what the
// rival spends one on readily, found by the same tests whoever it is, through the same engine calls as a person's.
// Each check sets a rival against itself without its style (`style` taken out of its weights), on the same board.
const unstyled = key => { const p = AI.PERSONAS[key], w = { ...p.w }; delete w.style; return { ...p, w }; };

{ // Sniper cuts off its target: beside it, its target's body one thick to its left with free log beyond, a flash
  // through it. Its style pays half the flash's price for that (a cut of its target is already at half), so it cuts;
  // without its style the same rival, weighing the same cut, keeps crawling.
  const view = () => aiView({ me: aiMe([[14, 10], [14, 11], [14, 12], [14, 13], [14, 14]], 'up', { flashIn: 0 }),
    others: [aiRival(1, [[13, 9], [13, 10], [13, 11], [13, 12], [13, 13], [13, 14], [13, 15], [13, 16]], 'up')],
    food: [{ x: 12, y: 6, kind: 'food', expires: 999 }, { x: 10, y: 8, kind: 'food', expires: 999 }] });
  const go = persona => { const out = {}; for (let i = 0; i < 10; i++) { const memory = {}, v = view(), d = AI.decide(v, persona, memory); const k = Object.keys(D).find(q => D[q] === d) + (memory.flash === v.tick ? '+flash' : ''); out[k] = (out[k] || 0) + 1; } return out; };
  const own = go(AI.PERSONAS.sniper), bareOne = go(unstyled('sniper'));
  check('7b: Sniper\'s style: it flashes through its target beside it, where without its style it crawls on',
    own['left+flash'] === 10 && !Object.keys(bareOne).some(k => k.includes('+flash')), JSON.stringify({ own, bare: bareOne }));
}
