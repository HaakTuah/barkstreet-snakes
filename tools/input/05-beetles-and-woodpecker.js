// Round six A's beetles and woodpecker, as the page tells them (digs,
// dives, knocks and the woodpecker's coming staged by hand, as the engine
// makes them): a beetle digging in far from your head teaches nothing,
// and one a rival cornered is heard as a rival's; the woodpecker's coming
// teaches its rule once its own banner has had its time; a beetle digging
// in near enough to catch (BEETLE_DIG + 1 cells at most: a move a tick
// through its dig, and a flash's extra cell) is heard as yours, and
// teaches "A cornered beetle digs in…" the first time the banner's free
// for it (it's over in a second: never left waiting), and one a cell
// further off teaches nothing; one that dug in goes under unheard (it was
// heard boring in), and the burrow its dig leaves (the engine's pair, on
// one tick) neither cracks open nor is news that one did: it teaches "A
// beetle that digs in leaves a burrow behind." the first time the banner's
// free for one, and only once a round; one closing over crumbles, softly,
// and once the burrow's lesson is told, teaches "Past three burrows…" the
// first time the banner's free for it, once a round; one down a burrow or
// up out of one scrabbles (a sound of its own, not the bore), and a burrow
// cracking open creaks; and food the woodpecker knocks aside is heard once
// a strike, quietly, the world's, from where the first piece that flies
// was (none for food it ate, even first in the strike's list). Then, with
// the dig and its burrow untold, as in a round where every dig was far
// from you: a dig's burrow (one closing over on its tick, as at the cap)
// teaches both at once, the dig first, and neither again.
await ev(`(() => {
  const A = SnakeAudio, play = A.play;
  window.__cues = [];
  A.play = (name, opts) => { if (name === 'dig' || name === 'knock' || name === 'scrabble' || name === 'burrow' || name === 'heal') __cues.push(name + (opts?.rival ? '~' : '') + (opts?.volume != null ? '@' + opts.volume : '') + (name === 'knock' ? ':' + (opts?.pan ?? 0).toFixed(2) : '')); return play(name, opts); };
  window.stageEvents = list => { window.__staged = g => { for (const e of list(g)) g.events.push(e); }; return 'ok'; };
  return 'ok';
})()`);
const { BEETLE_DIG, BURROW_MAX } = await ev('({ BEETLE_DIG: TUNING.BEETLE_DIG, BURROW_MAX: TUNING.BURROW_MAX })');
const reach = BEETLE_DIG + 1;
const DIG_LESSON = 'A cornered beetle digs in. Grab it before it’s gone!', FAIR_LESSON = 'Food in the woodpecker’s mark flies to its ring.';
const BURROW_LESSON = 'A beetle that digs in leaves a burrow behind.', BOTH_LESSON = 'A cornered beetle digs in, leaving a burrow.';
const HEAL_LESSON = 'Old burrows grow shut: beetles go in, none come out.';
const TAKEN_LESSON = 'A beetle that digs in by a burrow takes its place.';
const dugPairAt = (x, y, shut = '') => ev(`stageEvents(() => [{ type: 'dive', x: ${x}, y: ${y}, dug: 1 }${shut && `, { type: 'shut', ${shut}, at: 1e9 }`}, { type: 'burrow', x: ${x}, y: ${y}, dug: 1 }])`); // (a dig over: the engine's pair; at the cap, the one unused longest starting to grow shut between them)
const cues = () => ev('__cues.splice(0).join(" ")');
const digNear = (dx, dy) => ev(`stageEvents(g => { const h = g.snakes[0].body[0]; return [{ type: 'dig', x: h.x + ${dx}, y: h.y + ${dy}, until: g.tick + ${BEETLE_DIG} }]; })`);
const rivalDig = () => ev(`stageEvents(g => { const h = g.snakes[1].body[0]; return [{ type: 'dig', x: h.x + 1, y: h.y + 1, until: g.tick + ${BEETLE_DIG} }]; })`);
await ev('centre()');
await ev(`put(1, 2, 2, 'right')`); // (a rival's head far from yours)
await ev('vadvance(6000)'); // (the nudge's lesson has had its time)
await rivalDig();
await toTick();
const farDig = { toast: await ev('toastText()'), heard: await cues() };
await ev(`stageEvents(g => { g.woodpecker = { x: 12, y: 0, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick + 12 }; return [{ type: 'woodpecker' }]; })`);
await toTick();
const peckNews = await ev('toastText()');
await digNear(reach - 1, 1); // (while the woodpecker's news holds the banner)
await toTick();
const heldDig = { toast: await ev('toastText()'), heard: await cues() };
await ev('vadvance(5300)'); // (the news's reading time, 4.5 s at most, its fade and a breather)
const fair = await ev('toastText()');
await ev('vadvance(6000)'); // (its time, and the time back if it faded under a head)
await digNear(reach, 1); // (a cell too far to catch)
await toTick();
const tooFar = { toast: await ev('toastText()'), heard: await cues() };
await digNear(-3, 2);
await toTick();
const nearDig = { toast: await ev('toastText()'), heard: await cues() };
await ev('centre()'); // (back in the middle: the edge stays out of it)
await dugPairAt(3, 3); // (while the dig's lesson holds the banner)
await toTick();
const heldPair = { toast: await ev('toastText()'), heard: await cues() };
await ev('vadvance(6000)'); // (the dig's lesson has had its time: the banner's free)
await cues(); // (anything the round itself did meanwhile)
await dugPairAt(4, 4);
await toTick();
const dugPair = { toast: await ev('toastText()'), heard: await cues() };
await ev('vadvance(400)');
await ev(`stageEvents(() => [{ type: 'dive', x: 4, y: 4 }])`);
await toTick();
await ev('vadvance(400)');
await ev(`stageEvents(() => [{ type: 'emerge', x: 9, y: 4 }])`);
await toTick();
await ev('vadvance(400)');
await ev(`stageEvents(() => [{ type: 'burrow', x: 20, y: 20 }])`); // (one cracking open, far from the digs below: BURROW_SPACING)
await toTick();
const dives = await cues();
await ev('vadvance(6000)'); // (the banner's free again)
await dugPairAt(6, 4, 'x: 20, y: 20'); // (another dig over, at three burrows: the one unused longest starts growing shut)
await toTick();
const dugAgain = { toast: await ev('toastText()'), heard: await cues() };
await ev('vadvance(6000)');
await dugPairAt(15, 4, 'x: 3, y: 3'); // (and another)
await toTick();
const healAgain = { toast: await ev('toastText()'), heard: await cues() };
await ev('vadvance(6000)');
await dugPairAt(16, 5, 'x: 15, y: 4'); // (a dig by a burrow, nearer than BURROW_SPACING: it takes that one's place)
await toTick();
const taken = await ev('toastText()');
await ev('vadvance(6000)');
await dugPairAt(17, 6, 'x: 16, y: 5'); // (and another)
await toTick();
const takenAgain = await ev('toastText()');
await cues();
await ev(`stageEvents(() => [{ type: 'heal', x: 20, y: 20 }])`); // (one grown shut, closing over)
await toTick();
const closing = await cues();
await ev(`stageEvents(() => [{ type: 'knock', kind: 'pellet', x: 2, y: 6, tx: null, ty: null, color: '#abc' }, { type: 'knock', kind: 'food', x: 5, y: 5, tx: 7, ty: 5 }, { type: 'knock', kind: 'beetle', x: 6, y: 5, tx: 6, ty: 8, gold: 1 }, { type: 'knock', kind: 'pellet', x: 5, y: 6, tx: null, ty: null }])`);
await toTick();
const knocked = await cues();
await ev('vadvance(1000)');
await ev(`stageEvents(() => [{ type: 'knock', kind: 'food', x: 5, y: 5, tx: null, ty: null }])`);
await toTick();
const ate = await cues();
await ev(`SnakeDebug.game().woodpecker = null; 'ok'`);
// (The dig and its burrow untold again.)
await ev(`(() => { const t = SnakeDebug.game().told; for (const k of ['dig', 'digBurrow', 'burrowHeal']) delete t[k]; return 'ok'; })()`);
await ev('centre()');
await ev('vadvance(6000)');
await rivalDig();
await toTick();
const farAgain = await ev('toastText()');
await ev(`(() => { const h = SnakeDebug.game().snakes[1].body[0]; window.__at = h.x + 1 + ', ' + (h.y + 1); return 'ok'; })()`);
await ev(`stageEvents(() => { const [x, y] = __at.split(', ').map(Number); return [{ type: 'dive', x, y, dug: 1 }, { type: 'shut', x: 6, y: 4, at: 1e9 }, { type: 'burrow', x, y, dug: 1 }]; })`);
await toTick();
const both = await ev('toastText()');
await ev('vadvance(6000)');
await digNear(-2, 1);
await toTick();
const nearAfter = await ev('toastText()');
await ev('vadvance(6000)');
await dugPairAt(5, 5);
await toTick();
const pairAfter = await ev('toastText()');
await cues();
check(farDig.toast !== DIG_LESSON && farDig.heard === 'dig~', 'a beetle a rival corners, far from you: heard as a rival’s, and no lesson', `“${farDig.toast}”; heard ${farDig.heard}`);
check(/woodpecker|Rat-a-tat/.test(peckNews) && fair === FAIR_LESSON, 'the woodpecker’s coming: its news, then its rule once the news has had its time', `“${peckNews}”, then “${fair}”`);
check(heldDig.toast === peckNews && heldDig.heard === 'dig' && nearDig.toast === DIG_LESSON && nearDig.heard === 'dig',
  'a beetle digging in near you: heard as yours; its lesson the first time the banner’s free for it', `held: “${heldDig.toast}”, heard ${heldDig.heard}; later “${nearDig.toast}”, heard ${nearDig.heard}`);
check(tooFar.toast !== DIG_LESSON && tooFar.heard === 'dig', `a beetle digging in ${reach + 1} cells from your head, a cell further than you could get to in its dig (${BEETLE_DIG} ticks) with a flash: heard as yours, and no lesson`, `“${tooFar.toast}”; heard ${tooFar.heard}`);
check(heldPair.heard === '' && dugPair.heard === '' && !/cracked open|digging under the bark/.test(dugPair.toast), 'a beetle that dug in goes under unheard, and the burrow its dig leaves neither cracks open nor is news that one did',
  `heard ${heldPair.heard || 'nothing'}, then ${dugPair.heard || 'nothing'}; “${dugPair.toast}”`);
check(heldPair.toast === DIG_LESSON && dugPair.toast === BURROW_LESSON && dugAgain.toast !== BURROW_LESSON,
  'the burrow a dig leaves teaches its rule the first time the banner’s free for one, and once a round', `held: “${heldPair.toast}”; then “${dugPair.toast}”; later “${dugAgain.toast}”`);
check(dugAgain.heard === '' && healAgain.heard === '' && closing === 'heal', 'a burrow starting to grow shut is quiet (the dig that started it, and its burrow, unheard); grown shut, it crumbles as it closes over', `heard ${dugAgain.heard || 'nothing'}, then ${healAgain.heard || 'nothing'}; closing over, ${closing || 'nothing'}`);
check(dugAgain.toast === HEAL_LESSON && healAgain.toast !== HEAL_LESSON, 'a burrow starting to grow shut, once the burrow’s lesson is told: its rule, once a round', `“${dugAgain.toast}”, then “${healAgain.toast}”`);
check(taken === TAKEN_LESSON && takenAgain !== TAKEN_LESSON, 'a dig by a burrow takes its place: its own rule, once a round', `“${taken}”, then “${takenAgain}”`);
check(farAgain !== DIG_LESSON && both === BOTH_LESSON && nearAfter !== DIG_LESSON && pairAfter !== BURROW_LESSON && pairAfter !== BOTH_LESSON,
  'a dig far from you, then its burrow (one closing over on its tick): the dig and the burrow taught at once, the dig first, and neither again', `“${farAgain}”, then “${both}”; a dig near you later “${nearAfter}”, its burrow “${pairAfter}”`);
check(dives === 'scrabble scrabble burrow', 'one down a burrow, or up out of one, scrabbles (not the bore); a burrow cracking open creaks', `heard ${dives || 'nothing'}`);
const pan5 = ((5 + 0.5) / 24 * 2 - 1) * 0.8;
check(knocked === 'knock@0.5:' + pan5.toFixed(2) && ate === '', 'food the woodpecker knocks aside: heard once a strike, quietly, the world’s, where the first piece that flies was; none for food it ate', `heard ${knocked || 'nothing'} (from x 5: pan ${pan5.toFixed(2)}), then ${ate || 'nothing'}`);
