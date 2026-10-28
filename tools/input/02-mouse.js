// -------------------------------------------------------------- mouse
// Real mouse presses (the DevTools protocol's, as a mouse sends them).
// Over the board the left button jumps and the right one flashes, on the
// next tick, as Space and E do, and no menu pops up there; both at once
// (the right pressed while the left is held), the jump and then the
// flash. The middle button, a click with Ctrl, and clicks off the board
// fire nothing (and keep their menu). A card over the board is the
// card's: clicks there fire nothing, its buttons do what they did, and
// only its own text keeps the menu. Mashing jump as your death's card
// comes up never presses its Play again, nor focuses its name field; a
// click once it's settled does.
const MOUSE_BITS = { left: 1, right: 2, middle: 4 };
let mouseHeld = 0;
const mouse = (type, button, at, modifiers = 0) => {
  mouseHeld = type === 'mousePressed' ? mouseHeld | MOUSE_BITS[button] : mouseHeld & ~MOUSE_BITS[button];
  return b.send('Input.dispatchMouseEvent', { type, x: at[0], y: at[1], button, buttons: mouseHeld, clickCount: 1, modifiers });
};
const clickAt = async (button, at, modifiers = 0) => { await mouse('mousePressed', button, at, modifiers); await mouse('mouseReleased', button, at, modifiers); };
const middleOf = sel => ev(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
const MENUS = `(() => { window.__menus = []; addEventListener('contextmenu', e => __menus.push(e.defaultPrevented ? 'none' : 'menu')); return 'ok'; })()`;

// The start card: clicks on the board round it, or on its words, start nothing; a menu only over its words; Play, clicked, plays.
await ev(`window.__autoRaf = true; 'ok'`);
await b.go(site.url + '?debug');
await b.sleep(300);
await ev(MENUS);
let rim = await ev(`(() => { const r = document.getElementById('game').getBoundingClientRect(); return [r.x + 12, r.y + 12]; })()`); // (the board's corner, round the card)
for (const at of [rim, await middleOf('#overlay-title')]) { await clickAt('left', at); await clickAt('right', at); }
await b.sleep(100);
const startMenus = await ev('__menus.splice(0).join(" ")'), stillReady = await state();
await clickAt('left', await middleOf('#start'));
await b.sleep(100);
check(stillReady === 'ready' && startMenus === 'none menu' && await state() === 'countdown', 'the start card: clicks round it or on its words start nothing, a menu only over its words; Play, clicked, plays', `${stillReady}, menus ${startMenus}`);

await freshRound();
await ev(MENUS);
const board = await ev(`document.getElementById('game').getBoundingClientRect().toJSON()`);
const onBoard = [board.x + board.width / 2 + 40, board.y + board.height / 2 + 60]; // (somewhere on the log, off the middle)
rim = [board.x + 12, board.y + 12];
await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: onBoard[0], y: onBoard[1], buttons: 0 });
for (const [button, kind, ev1] of [['left', 'leap', 'leap'], ['right', 'flash', 'dash:plain']]) {
  let ok = 0;
  for (let n = 0; n < 12; n++) {
    await ev('centre()');
    await ev(`vf(${Math.floor(Math.random() * 8)})`);
    if (kind === 'leap') await ev(`(() => { const g = SnakeDebug.game(), me = g.snakes[0], h = me.body[0]; g.holes.add(h.y * 24 + h.x + 1); return 'ok'; })()`); // (something to hop)
    before = await powers();
    const steps = await ev('__log.steps.length');
    await clickAt(button, onBoard);
    const asked = await ev(`__log.powers.slice(${before})`);
    await toTick();
    const step = await ev(`__log.steps[${steps}]`);
    await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
    if (asked.length === 1 && asked[0].kind === kind && step?.evs.includes(ev1)) ok++;
  }
  check(ok === 12, `the ${button} mouse button on the board ${kind === 'leap' ? 'jumps' : 'flashes'} on the next tick`, `${ok}/12`);
}
const boardMenus = await ev('__menus.splice(0)');
check(boardMenus.length === 12 && boardMenus.every(m => m === 'none'), 'no menu pops up over the board', `${boardMenus.filter(m => m === 'none').length} of ${boardMenus.length} kept down`);

// Both buttons: the right pressed while the left is held (a chord: the browser sends it as a move).
await ev('centre()');
await ev(`(() => { const g = SnakeDebug.game(), h = g.snakes[0].body[0]; g.holes.add(h.y * 24 + h.x + 1); return 'ok'; })()`);
before = await powers();
let steps = await ev('__log.steps.length');
await mouse('mousePressed', 'left', onBoard); await mouse('mousePressed', 'right', onBoard);
await mouse('mouseReleased', 'right', onBoard); await mouse('mouseReleased', 'left', onBoard);
for (let n = 0; n < 4; n++) await toTick();
await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
const chord = { asked: await ev(`__log.powers.slice(${before}).map(p => p.kind).join(',')`), got: await ev(`__log.steps.slice(${steps}).flatMap(s => s.evs).join(' ')`) };
check(chord.asked === 'leap,flash' && chord.got === 'leap dash:plain', 'both mouse buttons at once: the jump, then the flash once down', JSON.stringify(chord));
await ev('__menus.length = 0');

// Nothing else fires: the middle button, Ctrl with either button, clicks off the board (which keep their menu).
await ev('centre()');
before = await powers();
await clickAt('middle', onBoard);
await clickAt('left', onBoard, 2); await clickAt('right', onBoard, 2);
for (const sel of ['#scoreboard li:nth-child(2)', 'h1', '.chatter-head', '#help']) { const at = await middleOf(sel); await clickAt('left', at); await clickAt('right', at); }
await ev('vf(2)');
const offMenus = await ev('__menus.splice(0).join(" ")');
check(await powers() === before && await state() === 'running' && offMenus === 'none menu menu menu menu', 'the middle button, Ctrl and clicks off the board fire nothing; the menu stays off the board', `menus ${offMenus}`);

// A nap: clicks on its card, or the board round it, wake nothing and fire nothing; its Wake up, clicked, wakes.
await ev('centre()');
await key('p'); await ev('vf(2)');
before = await powers();
for (const at of [rim, await middleOf('#overlay-title')]) { await clickAt('left', at); await clickAt('right', at); }
await ev('vf(2)');
const napMenus = await ev('__menus.splice(0).join(" ")'), stillNapped = await state();
await clickAt('left', await middleOf('#start'));
await ev('vf(2)');
const woke = await state();
await ev('vf(40)');
check(stillNapped === 'paused' && woke === 'countdown' && await state() === 'running' && await powers() === before && napMenus === 'none menu',
  'napping: clicks on its card or round it wake and fire nothing, a menu only over its words; Wake up, clicked, wakes', `${stillNapped}, then ${woke}; menus ${napMenus}`);

// Mashing jump with the mouse as you crash out: once your death's card is
// up, each click lands on its Play again. None starts a round (a click a
// moment after it came up, or in a run of quick clicks that began then);
// a click once it's settled does.
await ev(VCLOCK);
await ev('centre()');
await ev(`(() => { const me = SnakeDebug.game().snakes[0]; me.body = [{ x: 22, y: 12 }, { x: 21, y: 12 }, { x: 20, y: 12 }]; me.prev = null; return 'ok'; })()`);
const mouseMash = [];
for (let i = 0; i < 14; i++) { // (a click every 110 ms for about 1.5 s)
  const up = await ev('cardUp()');
  const at = up ? await middleOf('#start') : onBoard;
  await mouse('mousePressed', 'left', at);
  await ev('vadvance(50)');
  await mouse('mouseReleased', 'left', at);
  await ev('vadvance(60)');
  await ev('vf(7)');
  mouseMash.push(`${up ? 'card' : 'board'}:${await state()}`);
}
const mouseMashed = await ev(`({ s: SnakeDebug.state(), up: cardUp(), alive: SnakeDebug.game().snakes[0].alive, title: document.getElementById('overlay-title').textContent })`);
await ev('vadvance(600)'); await ev('vf(36)');
await clickAt('left', await middleOf('#start'));
await ev('vadvance(20)');
const mouseSettled = await state();
check(!mouseMashed.alive && mouseMashed.up && mouseMashed.s === 'running' && mouseMash.some(m => m.startsWith('card')) && mouseSettled === 'countdown',
  'mashing jump with the mouse over your death card never plays again; a click once it’s settled does', `${mouseMashed.title} ${mouseMash.filter(m => m.startsWith('card')).length} clicks on Play again, then ${mouseSettled}`);

// Nor focuses the name field a card offering the carve has in its middle (keys mashed next would carve them).
await ev(`(() => { window.__best = localStorage.getItem('snake-best'); localStorage.setItem('snake-best', '1'); return 'ok'; })()`);
await freshRound();
await ev(VCLOCK);
await ev(`(() => { const me = SnakeDebug.game().snakes[0]; me.body = [{ x: 22, y: 12 }, { x: 21, y: 12 }, { x: 20, y: 12 }]; me.prev = null; me.eaten = 25; return 'ok'; })()`);
let carveClicks = 0, mouseFocused = false;
for (let i = 0; i < 14; i++) {
  const offered = await ev(`cardUp() && !document.getElementById('name-row').hidden`);
  const at = offered ? await middleOf(i % 2 ? '#name-rank' : '#name-input') : onBoard;
  if (offered) carveClicks++;
  await mouse('mousePressed', 'left', at);
  await ev('vadvance(50)');
  await mouse('mouseReleased', 'left', at);
  await ev('vadvance(60)');
  await ev('vf(7)');
  if (await ev(`document.activeElement?.id === 'name-input'`)) mouseFocused = true;
}
await ev('vadvance(600)'); await ev('vf(36)');
await clickAt('left', await middleOf('#name-input'));
await ev('vadvance(20)');
const mouseFocusedLater = await ev(`document.activeElement?.id === 'name-input'`);
await ev(`(() => { if (window.__best == null) localStorage.removeItem('snake-best'); else localStorage.setItem('snake-best', __best); return 'ok'; })()`);
check(carveClicks > 0 && !mouseFocused && mouseFocusedLater, 'mashing jump with the mouse over a card offering the carve never focuses the name field; a click once it’s settled does',
  `${carveClicks} clicks on the field or its words, ${mouseFocused ? 'focused' : 'not focused'}; then ${mouseFocusedLater ? 'focused' : 'not focused'}`);
