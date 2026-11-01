// -------------------------------------------------------------- touch
await b.viewport(390, 844, { scale: 3, mobile: true });
await freshRound();
const box = await ev(`document.getElementById('game').getBoundingClientRect().toJSON()`);
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
const touch = (type, pts) => b.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
await ev(VCLOCK);

// A tap jumps (on lift, or held still for TAP_JUMP_MS with something to
// hop on the way); taps on a button or a tag don't.
const tapLat = [], tapLatHop = [];
let tapsOk = 0;
for (const ahead of [0, 3]) {
  for (const contact of [30, 50, 70, 90, 120, 200, 400]) {
    await ev('centre()');
    if (ahead) await ev(`(() => { const g = SnakeDebug.game(), h = g.snakes[0].body[0]; g.holes.add(h.y * 24 + h.x + ${ahead}); return 'ok'; })()`);
    before = await powers();
    await touch('touchStart', [{ x: cx + 20, y: cy + 30, id: 1 }]);
    await ev(`vadvance(${contact})`);
    await touch('touchEnd', []);
    await ev('vadvance(50)');
    await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
    const asked = await ev(`__log.powers.slice(${before})`);
    const t = await ev('__touch');
    if (asked.length === 1 && asked[0].kind === 'leap') { tapsOk++; (ahead ? tapLatHop : tapLat).push(t.did - t.start); }
  }
}
check(tapsOk === 14, 'a tap on the board jumps, once', `${tapsOk}/14, touch-down to jump ${JSON.stringify(stats(tapLat))}; with a hole ahead ${JSON.stringify(stats(tapLatHop))}`);
before = await powers();
for (const sel of ['#mute', '#scoreboard li:nth-child(2)', '#scoreboard li:nth-child(1)']) {
  const r = await ev(`document.querySelector('${sel}').getBoundingClientRect().toJSON()`);
  await touch('touchStart', [{ x: r.x + r.width / 2, y: r.y + r.height / 2, id: 1 }]);
  await ev('vadvance(120)');
  await touch('touchEnd', []);
  await ev('vadvance(50)');
}
await ev(`SnakeAudio.isMuted() && document.getElementById('mute').click(); 'ok'`); // (unmuted again)
check(await powers() === before && await state() === 'running', 'a tap on a button or a name tag doesn’t jump');

// A finger: down at a random point in a frame (resting first for rest
// ms), then moving at v px/ms (dx, dy: its way), its position sent at
// each frame, up to 70 px (or, with lift: n, lifting n frames after it
// first did something, still going).
const swipe = async (dx, dy, { v = 0.6, frames = 8, from = [cx - dx * 30, cy - dy * 30], rest = 0, lift = Infinity } = {}) => {
  let t = (1 - Math.random()) * P; // (from the touch to the next frame)
  await touch('touchStart', [{ x: from[0], y: from[1], id: 1 }]);
  await ev(`vadvance(${rest + t})`);
  for (let f = 0, after = 0; f < frames; f++) {
    const d = Math.min(70, t * v);
    await touch('touchMove', [{ x: from[0] + dx * d, y: from[1] + dy * d, id: 1 }]);
    const did = await ev(`vadvance(${P}), __touch.did`);
    t += P;
    if (did && ++after > lift) break;
  }
  await touch('touchEnd', []);
  await ev('vadvance(50)');
};

// A fresh swipe the way you're going flashes; a finger that keeps going doesn't again.
await ev('centre()');
before = await powers();
await swipe(1, 0, { frames: 12 });
const ahead = await ev(`__log.powers.slice(${before}).map(p => p.kind).join(',')`);
check(ahead === 'flash', 'a fresh swipe ahead flashes, once, however far the finger goes', ahead || 'nothing');
// A swipe the way the last one turned you, just after it lifted, is that
// turn swiped twice (a double flick, to make sure), not a flash: the
// second touch down 60-250 ms after the first lifts. A moment later, a flash.
const flicks = [];
for (const gap of [0, 60, 120, 170, 250, 400]) {
  await ev('centre()');
  await swipe(0, -1, { frames: 4 }); // (a turn up: about 60 ms of motion, then the lift...)
  before = await powers();
  await ev(`vadvance(${Math.max(0, gap - 50)})`);
  await swipe(0, -1, { frames: 4 }); // (...and up again)
  flicks.push(`${gap}:${await ev(`__log.powers.slice(${before}).map(p => p.kind).join(',')`) || '-'}`);
}
check(flicks.join(' ') === '0:- 60:- 120:- 170:- 250:- 400:flash', 'a swipe the way you just turned is that turn again, not a flash; a moment later, it flashes', `gap from lift: ${flicks.join(' ')}`);

// A chained turn: one finger, right and then up, at 0.6 px/ms; the second
// turn counts from the corner (SWIPE_CHAIN_PX).
const chainLat = [];
let chained = 0;
for (let n = 0; n < 8; n++) {
  await ev('centre()');
  await ev("face('up')");
  const from = [cx - 40, cy + 30], corner = 50; // (ms: 30 px right, then up)
  let t = (1 - Math.random()) * P;
  await touch('touchStart', [{ x: from[0], y: from[1], id: 1 }]);
  await ev(`vadvance(${t})`);
  for (let f = 0; f < 8; f++) {
    const x = from[0] + Math.min(t, corner) * 0.6, y = from[1] - Math.max(0, t - corner) * 0.6;
    await touch('touchMove', [{ x, y, id: 1 }]);
    await ev(`vadvance(${P})`);
    t += P;
  }
  await touch('touchEnd', []);
  await ev('vadvance(50)');
  const q = await ev("SnakeDebug.game().snakes[0].queue.map(dirName).join(',')");
  const tt = await ev('__touch');
  if (q === 'right,up') { chained++; chainLat.push(tt.second - tt.start - corner); }
}
check(chained === 8, 'one finger chains turns (right, then up)', `${chained}/8, corner to turn ${JSON.stringify(stats(chainLat))}`);

// A finger held still jumps without waiting for the lift only with
// something to hop on the way; a thumb resting before it swipes doesn't
// jump (and a jump its hold asked for, not gone yet, is taken back);
// nor does a thumb resting while the other swipes.
const hole = n => ev(`(() => { const g = SnakeDebug.game(), h = g.snakes[0].body[0]; g.holes.add(h.y * 24 + h.x + ${n}); return 'ok'; })()`);
const leaps = from => ev(`__log.powers.slice(${from}).filter(p => p.kind === 'leap').length`);
await ev('centre()');
await hole(2);
before = await powers();
await touch('touchStart', [{ x: cx + 20, y: cy + 30, id: 1 }]);
await ev('vadvance(100)');
const heldJump = await leaps(before);
await touch('touchEnd', []);
await ev('vadvance(50)');
await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
check(heldJump === 1 && await leaps(before) === 1, 'held still with something to hop, a touch jumps before it lifts, once', `${heldJump} by 100 ms`);
const rests = [];
let failedRest = false;
for (const [rest, ahead] of [[90, 0], [120, 0], [200, 0], [120, 2]]) {
  await ev('centre()');
  if (ahead) await hole(ahead);
  before = await powers();
  await swipe(0, -1, { frames: 5, rest });
  const r = await ev(`(() => { const me = SnakeDebug.game().snakes[0]; return { q: me.queue.map(dirName).join(','), armed: me.leapArmed }; })()`);
  await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
  rests.push(`${rest} ms${ahead ? ' (a hole ahead)' : ''}: ${r.q || 'no turn'}, ${r.armed >= 0 ? 'a jump waiting' : 'no jump waiting'}`);
  if (r.q !== 'up' || r.armed >= 0) failedRest = true;
}
check(!failedRest, 'a thumb resting before it swipes turns, and no jump goes', rests.join('; '));
await ev('centre()');
before = await powers();
await touch('touchStart', [{ x: cx - 60, y: cy + 60, id: 1 }]); // (a thumb resting...)
await ev('vadvance(100)');
for (let f = 0; f <= 6; f++) { // (...while the other swipes up)
  await touch(f ? 'touchMove' : 'touchStart', [{ x: cx - 60, y: cy + 60, id: 1 }, { x: cx + 60, y: cy + 40 - f * 10, id: 2 }]);
  await ev(`vadvance(${P})`);
}
await touch('touchMove', [{ x: cx - 60, y: cy + 60, id: 1 }]); // (the swiping one lifts...)
await ev('vadvance(120)');
await touch('touchEnd', []); // (...then the resting one)
await ev('vadvance(50)');
const two = await ev(`({ leaps: __log.powers.slice(${before}).filter(p => p.kind === 'leap').length, q: SnakeDebug.game().snakes[0].queue.map(dirName).join(',') })`);
check(two.leaps === 0 && two.q === 'up', 'a thumb resting while the other swipes doesn’t jump', JSON.stringify(two));
// ...but with something to hop, its jump has gone before the other
// swipes: taken back while it's still resting.
await ev('centre()');
await hole(2);
await touch('touchStart', [{ x: cx - 60, y: cy + 60, id: 1 }]);
await ev('vadvance(100)');
const armedRest = await ev('SnakeDebug.game().snakes[0].leapArmed >= 0');
for (let f = 0; f <= 6; f++) {
  await touch(f ? 'touchMove' : 'touchStart', [{ x: cx - 60, y: cy + 60, id: 1 }, { x: cx + 60, y: cy + 40 - f * 10, id: 2 }]);
  await ev(`vadvance(${P})`);
}
const twoHop = await ev(`(() => { const me = SnakeDebug.game().snakes[0]; return { armed: me.leapArmed >= 0, q: me.queue.map(dirName).join(',') }; })()`);
await touch('touchMove', [{ x: cx - 60, y: cy + 60, id: 1 }]);
await touch('touchEnd', []);
await ev('vadvance(50)');
await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
check(armedRest && !twoHop.armed && twoHop.q === 'up', 'a thumb resting with something to hop, while the other swipes: its jump is taken back', JSON.stringify(twoHop));
// A tap held long enough to jump before it lifted, then (the finger up)
// a fresh swipe ahead: a jump and a flash, both kept. The tap was a tap,
// whatever the next touch does. (Something right in front: the jump,
// then the flash once down; three ahead: the flash, then the jump.)
const combos = [];
let combosOk = 0;
for (const [ahead, want] of [[1, 'leap dash:plain'], [3, 'dash:plain leap']]) {
  for (const contact of [100, 150]) {
    await ev('centre()');
    await hole(ahead);
    await touch('touchStart', [{ x: cx + 20, y: cy + 30, id: 1 }]);
    await ev(`vadvance(${contact})`);
    await touch('touchEnd', []);
    await ev('vadvance(50)');
    const steps = await ev('__log.steps.length');
    await swipe(1, 0, { frames: 5 });
    for (let n = 0; n < 4; n++) await toTick();
    await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
    const got = await ev(`__log.steps.slice(${steps}).flatMap(s => s.evs).join(' ')`);
    combos.push(`${ahead} ahead, held ${contact} ms: ${got || 'nothing'}`);
    if (got === want) combosOk++;
  }
}
check(combosOk === 4, 'a held tap, lifted, then a fresh swipe ahead: the jump and the flash both go', combos.join('; '));

// A quick tap that rolls a few pixels as it lifts is still a tap.
const drifts = [];
for (const d of [3, 7, 9, 11]) {
  let ok = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    await ev('centre()');
    before = await powers();
    await touch('touchStart', [{ x: cx + 20, y: cy + 30, id: 1 }]);
    await ev(`vadvance(${P})`);
    await touch('touchMove', [{ x: cx + 20 + dx * d / 2, y: cy + 30 + dy * d / 2, id: 1 }]);
    await ev(`vadvance(${P})`);
    await touch('touchMove', [{ x: cx + 20 + dx * d, y: cy + 30 + dy * d, id: 1 }]);
    await ev(`vadvance(${50 - 2 * P})`);
    await touch('touchEnd', []);
    await ev('vadvance(50)');
    const q = await ev('SnakeDebug.game().snakes[0].queue.length');
    if (await leaps(before) === 1 && !q) ok++;
  }
  drifts.push(`${d} px ${ok}/4`);
}
check(drifts.every(t => t.endsWith('4/4')), 'a quick tap that drifts as it lifts still jumps', drifts.join(', '));

// A long straight stroke well off the axis still turns, its main way.
const slants = [];
for (const deg of [35, 44]) {
  let ok = 0;
  for (const [dx, dy, name] of [[1, 0, 'right'], [-1, 0, 'left']]) {
    await ev('centre()');
    await ev("face('up')");
    const a = deg * Math.PI / 180;
    await swipe(dx * Math.cos(a), -Math.sin(a), { v: 0.5, frames: 13 });
    if (await ev("SnakeDebug.game().snakes[0].queue.map(dirName).join(',')") === name) ok++;
  }
  slants.push(`${deg}° ${ok}/2`);
}
check(slants.every(t => t.endsWith('2/2')), 'a long stroke 35-44° off the axis turns its main way', slants.join(', '));

// Swipes never jump: finger speeds 0.15-1.2 px/ms, straight and slanted, every way.
// (Each lifts two frames after it turns, still going: the lift the tap rule
// could most easily mistake; one that never turns goes the whole 70 px.)
const reg = {};
let jumps = 0, swipes = 0, wrong = 0, none = 0;
for (const v of [0.15, 0.2, 0.3, 0.45, 0.6, 0.8, 1.0, 1.2]) {
  for (const slant of [0, 10, 20, 30, 40]) {
    for (const [dx, dy, name] of [[1, 0, 'right'], [-1, 0, 'left'], [0, -1, 'up'], [0, 1, 'down']]) {
      await ev('centre()');
      await ev(`face('${name === 'down' ? 'right' : name === 'up' ? 'left' : 'up'}')`); // (never straight back, nor ahead: every swipe is a turn)
      const a = slant * Math.PI / 180, sx = dx * Math.cos(a) - dy * Math.sin(a), sy = dy * Math.cos(a) + dx * Math.sin(a);
      before = await powers();
      await swipe(sx, sy, { v, frames: Math.ceil(70 / v / P) + 1, lift: 2 });
      swipes++;
      const asked = await ev(`__log.powers.slice(${before}).map(p => p.kind)`);
      if (asked.includes('leap')) jumps++;
      const t = await ev('__touch');
      const turned = await ev(`(() => { const me = SnakeDebug.game().snakes[0]; return me.queue.length ? dirName(me.queue[0]) : ''; })()`);
      if (!t.did) none++;
      else if (t.what === 'turn' && turned !== name) wrong++;
      if (t.did && slant <= 20) (reg[v] ||= []).push(t.did - t.start);
    }
  }
}
check(jumps === 0, 'swipes never jump', `${jumps} of ${swipes} swipes; ${none} slanted 40° never registered (a way must be half again the other), ${wrong} went another way`);
const regStats = Object.fromEntries(Object.entries(reg).map(([v, l]) => [v, stats(l).median]));
// Napping, a tap on the board round the card, or on its words, wakes ("Tap
// to wake up", the Pause row of "Voice and copy"), and fires no jump.
const napTaps = [];
for (const at of ['rim', '#overlay-text']) {
  await ev('centre()'); await ev(`napNow(); 'ok'`); await ev('vf(2)');
  before = await powers();
  const napped = await state();
  const p = at === 'rim' ? { x: box.x + 8, y: cy } : await ev(`(() => { const r = document.querySelector('${at}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await ev(`vadvance(TUNING.CARD_TAP_MS + 50)`); // (a card that came up by itself takes no tap for a moment)
  await touch('touchStart', [{ x: p.x, y: p.y, id: 1 }]); await ev('vadvance(40)'); await touch('touchEnd', []);
  await ev('vf(2)');
  napTaps.push(`${at}: ${napped} → ${await state()}, ${await powers() - before} powers`);
}
await ev('vf(40)');
check(napTaps.every(t => t.endsWith('paused → countdown, 0 powers')), 'napping, a tap on the board or the card’s words wakes, and fires no jump', napTaps.join('; '));
