// ---------------------------------------------------------------- each rival's power style (part 7b)
// (39-the-rivals, "Every rival has a power style".) A style is data: a share of the plain flash's price for what the
// rival spends one on readily, found by the same tests whoever it is, through the same engine calls as a person's.
// Each position is one a rival met in play (seeded AI-only rounds), with everything it didn't need taken away: with
// its style it presses the power every time, and the same rival without its style (`style` taken out of its weights)
// never does. (Ghost's, the other way round: without its style it spends, with it it holds its stamina.)
const unstyled = key => { const p = AI.PERSONAS[key], w = { ...p.w }; delete w.style; return { ...p, w }; };
const STYLE_SEEN = {
  sniper: { out: 'flash', memory: {"victimId":3,"desperate":false}, view: () => aiView({ age: 2, timeMs: 66334, me: aiMe([[10, 11], [10, 12], [9, 12], [9, 13], [9, 14]], 'up', { stamina: 19000, leapIn: 0, flashIn: 0, grow: 1, hungerLeft: 11897, starveIn: 11897 }),
    others: [aiRival(1, [[19, 2], [19, 3], [19, 4], [19, 5], [20, 5], [21, 5], [22, 5], [22, 6], [22, 7], [22, 8], [22, 9], [22, 10], [22, 11], [22, 12], [21, 12], [21, 11], [21, 10], [20, 10], [19, 10], [18, 10], [17, 10], [16, 10], [15, 10], [14, 10], [13, 10], [13, 11], [13, 12], [13, 13], [14, 13], [14, 14], [14, 15], [14, 16], [14, 17]], 'up'),
      aiRival(3, [[16, 9], [17, 9], [17, 8], [17, 7], [17, 6], [16, 6], [15, 6], [15, 5], [15, 4], [15, 3], [14, 3], [13, 3], [12, 3], [11, 3], [11, 4], [10, 4], [10, 5], [10, 6], [10, 7], [9, 7], [9, 8], [8, 8], [8, 9], [8, 10], [9, 10], [10, 10], [11, 10], [11, 9]], 'left')],
    food: [{ x: 15, y: 7, kind: 'food', expires: 9999 }] }) },
  gobbler: { out: 'flash', memory: {"desperate":false}, view: () => aiView({ age: 2, timeMs: 13353, me: aiMe([[10, 10], [9, 10], [9, 11], [9, 12], [8, 12], [7, 12], [6, 12]], 'right', { stamina: 14200, leapIn: 0, flashIn: 0, hungerLeft: 5826, starveIn: 5826 }),
    others: [aiRival(1, [[12, 10], [12, 11], [12, 12], [13, 12], [13, 13], [14, 13], [14, 14], [13, 14]], 'left')],
    food: [{ x: 11, y: 13, kind: 'pellet', owner: 1, expires: 9999 }, { x: 11, y: 14, kind: 'pellet', owner: 1, expires: 9999 }] }) },
  vulture: { out: 'flash', memory: {"lureId":3,"desperate":false,"power":1528,"leapNow":-1,"fly":0,"flyTurn":null,"flyAt":712,"flash":992}, view: () => aiView({ age: 3, timeMs: 156203, me: aiMe([[15, 9], [15, 10], [14, 10], [13, 10], [12, 10], [11, 10], [11, 9], [10, 9], [10, 10]], 'up', { stamina: 9960, leapIn: 0, flashIn: 0, hungerLeft: 5250, starveIn: 5250 }),
    others: [aiRival(1, [[10, 3], [10, 4], [11, 4], [11, 5], [12, 5], [13, 5], [14, 5], [14, 6], [14, 7], [13, 7], [12, 7], [11, 7], [10, 7], [10, 6], [10, 5], [9, 5], [9, 4], [9, 3]], 'up')],
    food: [{ x: 15, y: 7, kind: 'pellet', owner: 1, expires: 9999 }, { x: 16, y: 6, kind: 'pellet', owner: 1, expires: 9999 }, { x: 16, y: 5, kind: 'pellet', owner: 1, expires: 9999 }] }) },
  sovereign: { out: 'flash', memory: {"home":{"x":6,"y":6,"radius":5},"driftAt":615,"victimId":2,"desperate":false,"flash":468}, view: () => aiView({ age: 2, timeMs: 67161, me: aiMe([[10, 6], [9, 6], [8, 6], [7, 6], [7, 5], [7, 4], [6, 4], [5, 4], [5, 5], [6, 5], [6, 6], [6, 7], [7, 7], [7, 8], [7, 9], [7, 10], [7, 11], [6, 11]], 'right', { stamina: 12400, leapIn: 0, flashIn: 0, hungerLeft: 10734, starveIn: 10734 }),
    others: [aiRival(2, [[11, 5], [11, 4], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [15, 4], [14, 4], [13, 4], [12, 4], [11, 4], [11, 5], [12, 5], [13, 5], [13, 6]], 'down'),
      aiRival(3, [[15, 1], [14, 1], [13, 1], [12, 1], [12, 2], [11, 2], [11, 1], [10, 1], [9, 1], [9, 2], [10, 2], [10, 3], [9, 3], [8, 3], [8, 2], [7, 2], [6, 2], [5, 2], [4, 2]], 'right')],
    food: [] }) },
  desperado: { out: 'flash', memory: {"desperate":false}, view: () => aiView({ age: 2, timeMs: 13819, me: aiMe([[9, 3], [9, 4], [9, 5]], 'up', { stamina: 12700, leapIn: 0, flashIn: 0, hungerLeft: 9429, starveIn: 9429 }),
    others: [aiRival(2, [[8, 2], [7, 2], [7, 3], [7, 4], [7, 5], [6, 5], [6, 6], [6, 7], [7, 7], [7, 6], [8, 6]], 'right')],
    food: [] }) },
  joker: { out: 'flash', memory: {"victimId":1,"desperate":false,"power":198,"leapNow":-1,"fly":0,"flyTurn":null,"flash":748,"styled":664}, view: () => aiView({ age: 2, timeMs: 91691, me: aiMe([[8, 16], [9, 16], [9, 17], [8, 17], [8, 18], [7, 18], [7, 19], [8, 19], [8, 20], [7, 20], [7, 21], [8, 21], [8, 22], [9, 22], [9, 23], [10, 23], [11, 23], [12, 23], [13, 23], [14, 23], [15, 23], [16, 23], [17, 23], [18, 23], [19, 23], [19, 22], [18, 22], [17, 22], [16, 22], [15, 22], [14, 22], [13, 22]], 'left', { stamina: 11500, leapIn: 0, flashIn: 0, hungerLeft: 5638, starveIn: 5638 }),
    others: [aiRival(1, [[10, 16], [11, 16], [11, 17], [11, 18], [11, 19], [12, 19], [13, 19], [14, 19], [14, 18], [15, 18], [16, 18], [17, 18], [18, 18], [19, 18], [20, 18], [20, 17], [19, 17], [19, 16], [20, 16], [21, 16], [22, 16], [23, 16], [23, 15], [23, 14], [22, 14], [22, 13]], 'left')],
    food: [{ x: 8, y: 3, kind: 'food', expires: 9999 }] }) },
  ouroboros: { out: 'jump', memory: {"desperate":false,"power":1003,"leapNow":-1,"fly":0,"flyTurn":null}, view: () => aiView({ age: 3, timeMs: 120743, me: aiMe([[5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [15, 7], [15, 6], [16, 6], [17, 6], [17, 7], [18, 7], [19, 7], [20, 7], [21, 7], [22, 7], [23, 7], [0, 7], [0, 6], [0, 5], [0, 4], [1, 4], [2, 4], [2, 5], [3, 5], [3, 4], [3, 3], [4, 3], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [13, 3], [12, 3], [11, 3], [10, 3], [9, 3], [8, 3], [7, 3], [6, 3], [5, 3], [5, 4], [4, 4], [4, 5]], 'left', { stamina: 21300, leapIn: 0, flashIn: 0, hungerLeft: 11010, starveIn: 11010 }),
    others: [aiRival(1, [[5, 8], [5, 9], [4, 9], [3, 9], [3, 10], [2, 10], [1, 10], [1, 11], [2, 11], [3, 11], [3, 12], [3, 13], [3, 14], [4, 14], [4, 15], [5, 15], [5, 16], [6, 16], [6, 17], [6, 18], [6, 19], [6, 20], [6, 21], [7, 21], [7, 22], [8, 22], [9, 22], [9, 23], [8, 23], [7, 23], [6, 23], [5, 23], [4, 23], [3, 23], [2, 23], [1, 23], [1, 22], [2, 22], [2, 21], [1, 21], [1, 20], [1, 19], [1, 18], [2, 18]], 'up')],
    food: [] }) },
};
const STYLE_SAYS = {
  sniper: 'Sniper cuts off its target', gobbler: 'Gobbler races for food', vulture: 'Vulture flashes to beads',
  sovereign: 'Sovereign chases an intruder off its land', desperado: 'Desperado skims danger, for the thrill',
  joker: 'Joker springs its lure', ouroboros: 'Ouroboros jumps its own coils', mute: 'Mute seals its box',
  mason: 'Mason finishes a wall', creeper: 'Creeper flashes in behind a tail', ghost: 'Ghost keeps a flash ready to escape',
};
for (const [key, seen] of Object.entries(STYLE_SEEN)) {
  const pressed = persona => { let n = 0; for (let i = 0; i < 10; i++) { const memory = structuredClone(seen.memory), v = seen.view(); AI.decide(v, persona, memory); if ((seen.out === 'jump' ? memory.power : memory.flash) === v.tick) n++; } return n; };
  const own = pressed(AI.PERSONAS[key]), without = pressed(unstyled(key));
  const ok = key === 'ghost' ? own === 0 && without === 10 : own === 10 && without === 0;
  check(`7b: ${STYLE_SAYS[key]}: with its style it ${key === 'ghost' ? 'holds' : seen.out + 'es'}, without it ${key === 'ghost' ? 'it spends' : 'it crawls on'}`, ok, JSON.stringify({ own, without }));
}
{ // Wildcard draws a power style from the cast's at random, half its rounds: never one of its own.
  const styles = new Set(Object.values(AI.PERSONAS).filter(p => p.w.style).map(p => p.w.style));
  let some = 0, none = 0, strange = 0;
  for (let i = 0; i < 40; i++) {
    const memory = {};
    AI.decide(aiView({ me: aiMe(line(6, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')] }), AI.PERSONAS.wildcard, memory);
    if (!memory.w.style) none++; else if (styles.has(memory.w.style)) some++; else strange++;
  }
  check('7b: Wildcard draws a cast member\'s power style, some rounds, and none others', some > 5 && none > 5 && !strange, JSON.stringify({ some, none, strange }));
}
