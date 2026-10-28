// Your death's card: a thumb mashing jump as you crash, landing on its
// Play again, never starts a round; a tap once it's settled does.
await ev('centre()');
await ev(`(() => { const me = SnakeDebug.game().snakes[0]; me.body = [{ x: 22, y: 12 }, { x: 21, y: 12 }, { x: 20, y: 12 }]; me.prev = null; return 'ok'; })()`);
const mash = [];
for (let i = 0; i < 14; i++) { // (a tap every 110 ms for about 1.5 s)
  const up = await ev('cardUp()');
  const at = up ? await ev(`(() => { const r = document.getElementById('start').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`) : { x: cx + 20, y: cy + 30 };
  await touch('touchStart', [{ ...at, id: 1 }]);
  await ev('vadvance(50)');
  await touch('touchEnd', []);
  await ev('vadvance(60)');
  await ev('vf(7)');
  mash.push(`${up ? 'card' : 'board'}:${await state()}`);
}
const mashed = await ev(`({ s: SnakeDebug.state(), up: cardUp(), alive: SnakeDebug.game().snakes[0].alive, title: document.getElementById('overlay-title').textContent })`);
await ev('vadvance(600)'); await ev('vf(36)');
const r = await ev(`(() => { const r = document.getElementById('start').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
await touch('touchStart', [{ ...r, id: 1 }]);
await ev('vadvance(60)');
await touch('touchEnd', []);
await ev('vadvance(20)');
const settled = await state();
check(!mashed.alive && mashed.up && mashed.s === 'running' && mash.some(m => m.startsWith('card')) && settled === 'countdown',
  'mashing jump over your death card never plays again; a tap once it’s settled does', `${mashed.title} ${mash.filter(m => m.startsWith('card')).length} taps on Play again, then ${settled}`);

// Nor does mashing focus its name field. A round that earned a place in
// the Hall of Fame (a new best here) offers "Carve your name" in the
// card's middle, just where a thumb mashing jump lands, and a focused
// field brings the phone's keyboard up over the round. A tap on it (or
// its words) once the card's settled does focus it.
await ev(`(() => { localStorage.setItem('snake-best', '1'); return 'ok'; })()`);
await freshRound();
await ev(VCLOCK);
await ev(`(() => { const me = SnakeDebug.game().snakes[0]; me.body = [{ x: 22, y: 12 }, { x: 21, y: 12 }, { x: 20, y: 12 }]; me.prev = null; me.eaten = 25; return 'ok'; })()`);
const fieldAt = id => ev(`(() => { const r = document.getElementById('${id}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
let carveTaps = 0, focusedMash = false;
for (let i = 0; i < 14; i++) {
  const offered = await ev(`cardUp() && !document.getElementById('name-row').hidden`);
  const at = offered ? await fieldAt(i % 2 ? 'name-rank' : 'name-input') : { x: cx, y: cy };
  if (offered) carveTaps++;
  await touch('touchStart', [{ ...at, id: 1 }]);
  await ev('vadvance(50)');
  await touch('touchEnd', []);
  await ev('vadvance(60)');
  await ev('vf(7)');
  if (await ev(`document.activeElement?.id === 'name-input'`)) focusedMash = true;
}
const carveState = await state();
await ev('vadvance(600)'); await ev('vf(36)');
await touch('touchStart', [{ ...await fieldAt('name-input'), id: 1 }]);
await ev('vadvance(60)');
await touch('touchEnd', []);
await ev('vadvance(20)');
const focusedLater = await ev(`document.activeElement?.id === 'name-input'`);
check(carveTaps > 0 && !focusedMash && carveState === 'running' && focusedLater,
  'mashing jump over a card offering the carve never focuses the name field; a tap once it’s settled does', `${carveTaps} taps on the field or its words, ${focusedMash ? 'focused' : 'not focused'}; then ${focusedLater ? 'focused' : 'not focused'}`);

// The testers' own way to choose the rivals (README): SnakeDebug.setup
// with three, then Watch AIs, watches those three and one more at random
// (an AI-only round has four); Play plays them; a page's own start card,
// nobody chosen, gives Watch AIs a random four.
const lineUp = async (chosen, button) => {
  await ev(`window.__autoRaf = true; 'ok'`);
  await b.go(site.url + '?debug', { settle: 0 });
  await ev('new Promise(r => __raf(() => __raf(r)))');
  if (chosen) await ev(`SnakeDebug.setup(${JSON.stringify(chosen)}); 'ok'`);
  await ev(`document.getElementById('${button}').click(); 'ok'`);
  return ev(`({ s: SnakeDebug.state(), keys: SnakeDebug.game().snakes.map(s => s.personaKey || 'you') })`);
};
const chosen = ['sovereign', 'colonist', 'gobbler'];
const watched = await lineUp(chosen, 'watch'), played = await lineUp(chosen, 'start'), random = await lineUp(null, 'watch');
check(watched.s === 'countdown' && watched.keys.length === 4 && chosen.every((k, i) => watched.keys[i] === k) && !watched.keys.includes('you') && new Set(watched.keys).size === 4
  && played.keys.join() === ['you', ...chosen].join() && random.keys.length === 4 && !random.keys.includes('you'),
'rivals chosen with SnakeDebug.setup: Watch AIs watches them (and one more), Play plays them', `watched ${watched.keys.join(', ')}; played ${played.keys.join(', ')}; nobody chosen, watched ${random.keys.join(', ')}`);

// Every lesson is one idea and 60 characters or fewer (DESIGN, "the
// narrator speaks less"): a long one wrapped to two lines on a phone, over
// the board (on a phone held upright it's now one line over the title
// row: below). With the touch screen's words and the keyboard's, the
// counts and names at their longest.
const LESSON_LENGTHS = `(() => {
  const F = SnakeDebug.flavor(), T = TUNING, out = [];
  const add = (k, v) => { if (typeof v === 'string') out.push([k, v]); else if (Array.isArray(v)) v.forEach(x => add(k, x)); else if (v && typeof v === 'object') for (const x of Object.values(v)) add(k, x); };
  for (const k of ['youCrash', 'youCrashToThree', 'youAtThree', 'youAlight', 'youPeckedUnder', 'youChoke', 'youCoughing', 'youWoodpecker', 'youDig', 'digBurrow', 'digAndBurrow', 'burrowHeal', 'lostColony', 'lostCapital', 'lastApples', 'flashKey', 'powersFirst', 'leapNothing', 'leapEarly', 'youLeapFirst', 'youDashFirst', 'youHungry', 'youStarvingSmall', 'fizzle', 'fizzleFlash']) add(k, F[k]);
  for (const [k, arg] of [['youGoldBeetle', T.LEAP_MAX], ['youLeaf', T.DASH_MAX], ['youGoldcap', Math.round(T.WRAP_MAX_MS / 1000)], ['wrapEnding', Math.round(T.WRAP_WARN_MS / 1000)], ['youSnipped', 'Ouroboros']]) add(k, F[k](arg));
  return { touch: matchMedia('(pointer: coarse)').matches, lines: out.map(([k, v]) => [k, v, v.length]) };
})()`;
const lengths = [];
for (const mobile of [true, false]) {
  await b.viewport(mobile ? 390 : 1280, mobile ? 844 : 800, { mobile, scale: mobile ? 3 : 1 });
  await b.go(site.url + '?debug', { settle: 0 });
  lengths.push(await ev(LESSON_LENGTHS));
}
const tooLong = lengths.flatMap(l => l.lines.filter(x => x[2] > 60).map(([k, v, n]) => `${l.touch ? 'touch' : 'keys'} ${k} ${n}: “${v}”`));
check(lengths.map(l => l.touch).join() === 'true,false' && lengths.every(l => l.lines.length > 30) && !tooLong.length, 'every lesson is 60 characters or fewer, on a touch screen and with keys',
  tooLong.join('; ') || lengths.map(l => `${l.touch ? 'touch' : 'keys'}: ${l.lines.length} lines, the longest ${Math.max(...l.lines.map(x => x[2]))}`).join('; '));


// On a phone held upright a banner is one line, over the header's title
// row (DESIGN "Teaching by showing"): every banner of the game's, round
// news, the weather, spawns and lessons, fits its line on a 360 px phone
// at its own size or a little under (0.9 of it at the least), with the
// phone's shorter words for the longest (FLAVOR.phone); and on a 320 px
// one it's whole on its line, at the least size it may shrink to. With
// the longest rival's name, and a friend's of 16 characters.
const BANNERS_FIT = `(() => {
  const F = SnakeDebug.flavor(), T = TUNING, rival = 'Capricious', friend = 'Bartholomew Lark', out = [];
  const add = (v, opts = {}, kind = '') => { if (typeof v === 'string') out.push([v, opts, kind]); else if (Array.isArray(v)) v.forEach(x => add(x, opts, kind)); else if (v && typeof v === 'object') Object.values(v).forEach(x => add(x, opts, kind)); };
  for (const k of ['go', 'goWatch', 'wakeBeat']) add(F[k], {}, 'go');
  for (const k of ['weather', 'weatherWatch', 'strike', 'rainbow', 'rainbowWatch', 'golden', 'woodpecker', 'woodpeckerWatch', 'beetle', 'goldBeetle', 'goldBeetleWatch', 'leaf', 'leafWatch', 'goldcap', 'goldcapWatch', 'baked', 'bakedWatch', 'youMushroom', 'watchingFirst', 'youAway', 'takeBack',
    'youCrash', 'youCrashToThree', 'youAtThree', 'youAlight', 'youPeckedUnder', 'youChoke', 'youCoughing', 'youWoodpecker', 'youDig', 'digBurrow', 'digAndBurrow', 'burrowHeal', 'lostColony', 'lostCapital', 'lastApples', 'flashKey', 'powersFirst', 'leapNothing', 'leapEarly', 'youLeapFirst', 'youDashFirst', 'youHungry', 'youStarvingSmall', 'fizzle', 'fizzleFlash']) add(F[k]);
  for (const [k, arg] of [['youGoldBeetle', T.LEAP_MAX], ['youLeaf', T.DASH_MAX], ['youGoldcap', Math.round(T.WRAP_MAX_MS / 1000)], ['wrapEnding', Math.round(T.WRAP_WARN_MS / 1000)], ['youSnipped', rival], ['youSnip', rival], ['friendBack', friend]]) add(F[k](arg));
  add(F.field.home(rival)); add(F.field.colony(rival));
  for (const k of ['friendJoined', 'friendLeft', 'friendAway']) add(F[k](friend), { phone: F[k + 'Phone'](friend) });
  const t = document.getElementById('toast'), rows = [];
  for (const [text, opts, kind] of out) {
    SnakeDebug.banner(text, kind, 'round', opts);
    const cs = getComputedStyle(t), fs = parseFloat(cs.fontSize), line = fs * 1.4, base = (kind === 'go' ? 1.1 : 0.86) * 16;
    rows.push({ text, shown: t.textContent, above: t.classList.contains('above'), size: fs / base, lines: t.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) > line ? 2 : 1, whole: t.scrollWidth <= t.clientWidth + 1 });
  }
  return rows;
})()`;
const fits = {};
for (const w of [360, 320]) {
  await b.viewport(w, 640, { mobile: true, scale: 3 });
  await b.go(site.url + '?debug', { settle: 0 });
  await ev('document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))');
  fits[w] = await ev(BANNERS_FIT);
}
const unfit = w => fits[w].filter(r => !r.above || r.lines !== 1 || !r.whole || (w === 360 && r.size < 0.9 - 1e-6));
const say = r => `“${r.shown}” ${r.above ? '' : 'on the board, '}${r.lines} line${r.lines > 1 ? 's' : ''}, ${r.whole ? 'whole' : 'cut'}, at ${(r.size * 100).toFixed(0)}%`;
check(fits[360].length > 80 && !unfit(360).length, 'on a 360 px phone held upright, every banner is one line over the title row, its words whole, at 90% of its size or more (the phone’s shorter words for the longest)',
  unfit(360).map(say).join('; ') || `${fits[360].length} banners, the smallest at ${(Math.min(...fits[360].map(r => r.size)) * 100).toFixed(0)}%, ${fits[360].filter(r => r.shown !== r.text).length} in the phone’s words`);
check(fits[320].length === fits[360].length && !unfit(320).length, 'on a 320 px phone, every banner is one line, its words whole', unfit(320).map(say).join('; ') || `the smallest at ${(Math.min(...fits[320].map(r => r.size)) * 100).toFixed(0)}%`);

// Long names (16 characters, the cap): the first out's banner, held
// upright, is one line, its words whole, at 360 and 320 px. Where its
// shorter words still don't fit, it drops the cause ("Gran is first
// out."); a screen reader keeps the full line. Built as the round builds
// it (SnakeDebug.firstOut), for every way a first out reads.
const FIRST_OUT = `(() => {
  const g = SnakeDebug.game(), [a, b, c] = g.snakes.filter(s => !s.isPlayer), me = g.snakes.find(s => s.isPlayer), t = document.getElementById('toast');
  const keep = [a, b, c, me].map(s => ({ s, name: s.name, alive: s.alive, cause: s.cause, killer: s.killer, killerId: s.killerId }));
  a.name = 'Wilhelmina Grant'; b.name = 'Bartholomew Lark'; c.name = 'Maximilian Swift'; me.name = 'Gwendolyn Marsh';
  const dead = (s, cause, by) => Object.assign(s, { alive: false, cause, killer: by ? by.name : 'wall', killerId: by ? by.id : null });
  const cases = [
    () => [dead(a, 'flashed into a woodpecker hole and blew up')],
    () => [dead(a, 'got pecked by the woodpecker')],
    () => [dead(a, 'starved')],
    () => [Object.assign(dead(a, 'bit itself'), { killer: 'self', killerId: a.id })],
    () => [dead(a, 'got cut in two by ' + b.name, b)],
    () => [dead(a, 'ran into ' + b.name, b)],
    () => [dead(a, 'crashed head-on into ' + b.name, b)],
    () => (dead(b, 'hit the edge'), [dead(a, 'crashed head-on into ' + b.name, b)]),
    () => [dead(a, 'crashed head-on into ' + b.name, b), dead(b, 'crashed head-on into ' + a.name, a)],
    () => [dead(me, 'got cut in two by ' + b.name, b)],
    () => [dead(a, 'got cut in two by ' + me.name, me)],
  ];
  const rows = [];
  for (const make of cases) {
    for (const k of keep) Object.assign(k.s, { alive: true, cause: null, killer: null, killerId: null });
    const [text, opts] = SnakeDebug.firstOut(make());
    SnakeDebug.banner(text, 'kill', 'round', opts);
    const cs = getComputedStyle(t);
    rows.push({ text, short: opts.short, shown: t.textContent, said: document.getElementById('announcer').textContent, above: t.classList.contains('above'), lines: t.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) > parseFloat(cs.fontSize) * 1.4 ? 2 : 1, whole: t.scrollWidth <= t.clientWidth + 1 });
  }
  for (const k of keep) Object.assign(k.s, k);
  return rows;
})()`;
const outs = {};
for (const w of [360, 320]) {
  await b.viewport(w, 640, { mobile: true, scale: 3 });
  await b.go(site.url + '?debug', { settle: 0 });
  await ev('document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))');
  outs[w] = await ev(FIRST_OUT);
}
for (const w of [360, 320]) {
  const bad = outs[w].filter(r => !r.above || r.lines !== 1 || !r.whole || r.said !== r.text);
  check(outs[w].length === 11 && !bad.length, `on a ${w} px phone, with 16-character names, the first out's banner is one line, its words whole, and a screen reader hears the full line`,
    bad.map(r => `“${r.shown}” (for “${r.text}”)${r.lines > 1 ? ', two lines' : ''}${r.whole ? '' : ', cut'}${r.said !== r.text ? `, said “${r.said}”` : ''}`).join('; ') || outs[w].map(r => `“${r.shown}”`).join(', '));
}
const dropped = outs[320].filter(r => r.shown === r.short);
check(dropped.length > 0 && outs[360].concat(outs[320]).every(r => r.shown !== r.short || r.short && !r.shown.includes(':')), 'where the first out’s words don’t fit even so, it drops the cause (“Wilhelmina Grant is first out.”)',
  dropped.map(r => `“${r.shown}”`).join(', ') || 'none dropped at 320 px');
console.log(results.join('\n'));
console.log('\nmeasured (virtual 60 Hz, 120 ms ticks):');
console.log('  press to tick, turns:', JSON.stringify(stats(turnLat)));
console.log('  press to tick, jumps:', JSON.stringify(stats(pressLat.jump)), ' flashes:', JSON.stringify(stats(pressLat.flash)));
console.log('  touch-down to jump (taps held 30-400 ms; nothing to hop: on the lift):', JSON.stringify(stats(tapLat)), ' with a hole ahead (held still: at TAP_JUMP_MS):', JSON.stringify(stats(tapLatHop)));
console.log('  a chained turn, from the finger’s corner (0.6 px/ms):', JSON.stringify(stats(chainLat)));
console.log('  touch-down to a swipe registering, median ms by finger speed (px/ms):', JSON.stringify(regStats));
