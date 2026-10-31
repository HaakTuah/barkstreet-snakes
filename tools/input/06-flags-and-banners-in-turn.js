// A flag or a capital the woodpecker pecks out (staged as the rivals'
// thinking leaves it, a moment after the strike: the land gone from its
// memory, a hole where it stood): "…that colony’s lost." the first time a
// flag goes in a round, "…its realm moves." the first time a capital
// does, waiting behind a lesson holding the banner, and neither again. A
// colony let go with no hole under its flag (one too many planted) says
// nothing. (Before, the only word was the rival's chatter, gone with the
// chatter off.)
const LOST_COLONY = 'The woodpecker took a flag: that colony’s lost.', LOST_CAPITAL = 'The woodpecker took a capital: its realm moves.';
await ev('centre()');
await ev(`(() => { const g = SnakeDebug.game(); g.snakes[2].memory.colonies = [{ x: 20, y: 5, radius: 3, n: 1 }, { x: 18, y: 17, radius: 3, n: 2 }, { x: 3, y: 10, radius: 3, n: 3 }]; g.snakes[3].memory.home = { x: 5, y: 7, radius: 3 }; return 'ok'; })()`);
await toTick(); // (seen standing)
await ev('vadvance(6000)');
await ev(`(() => { SnakeDebug.game().snakes[2].memory.colonies.pop(); return 'ok'; })()`); // (let go, its flag on whole bark)
await toTick();
const letGo = await ev('toastText()');
await ev(`(() => { const g = SnakeDebug.game(); g.holes.add(5 * 24 + 20); g.snakes[2].memory.colonies.shift(); return 'ok'; })()`);
await toTick();
const flagLost = await ev('toastText()');
await ev(`(() => { const g = SnakeDebug.game(); g.holes.add(7 * 24 + 5); g.snakes[3].memory.home = { x: 6, y: 8, radius: 3 }; return 'ok'; })()`); // (while the flag's lesson holds the banner)
await toTick();
const capitalHeld = await ev('toastText()');
const capitalLost = [];
for (let t = 0; t < 12000; t += 200) { // (the banners as they come, each held up to its time back)
  await ev('vadvance(200)');
  const now = await ev('toastText()');
  if (now && now !== capitalLost[capitalLost.length - 1]) capitalLost.push(now);
}
await ev(`(() => { const g = SnakeDebug.game(); g.holes.add(17 * 24 + 18); g.snakes[2].memory.colonies.shift(); return 'ok'; })()`);
await toTick();
const flagAgain = await ev('toastText()');
await ev(`(() => { const g = SnakeDebug.game(); for (const k of [5 * 24 + 20, 7 * 24 + 5, 17 * 24 + 18]) g.holes.delete(k); delete g.snakes[2].memory.colonies; delete g.snakes[3].memory.home; return 'ok'; })()`);
check(letGo !== LOST_COLONY && flagLost === LOST_COLONY && capitalHeld === LOST_COLONY && capitalLost.join(' / ') === `${LOST_COLONY} / ${LOST_CAPITAL}` && flagAgain !== LOST_COLONY,
  'a flag or a capital the woodpecker pecks out: its rule the first time each goes in a round (waiting behind a lesson), and not for a colony let go', `let go “${letGo}”; pecked “${flagLost}”; a capital “${capitalHeld}”, then “${capitalLost.join('”, “')}”; another flag “${flagAgain}”`);

// Banners in turn (DESIGN "Teaching by showing"): each is held for its
// reading time (1 s and 0.4 s a word, 4.5 s at most), then fades, and the
// next waiting comes up a breather (0.5 s) after. The weather showing, a
// lesson waits its turn (no longer cutting the news short), and round
// news coming while the lesson waits waits behind it (no longer cutting
// in and losing the lesson). A lesson whose moment has passed (6 s of the
// round) is let go, but round news behind it never is. (The banners' own
// log says what each was and when it came up, in full words: on a phone
// held upright the weather shows its shorter ones. When each started to
// go is read off the page every 50 ms.)
const readMs = t => Math.min(4500, 1000 + 400 * t.trim().split(/\s+/).length);
const inTurn = async (stage, ms) => {
  await ev('vadvance(10000)');
  await ev('SnakeDebug.banners().length = 0; window.__gone = []; window.__was = ""; "ok"');
  await stage();
  for (let t = 0; t < ms; t += 50) {
    await ev(`(() => { const el = document.getElementById('toast'), up = !el.hidden && !el.classList.contains('leaving') ? el.textContent : '';
      if (__was && up !== __was) __gone.push(performance.now());
      __was = up; return 'ok'; })()`);
    await ev('vadvance(50)');
  }
  const { gone, log } = await ev('({ gone: __gone, log: SnakeDebug.banners().slice() })');
  const shown = log.filter(l => l.fate === 'shown');
  return { log, shown, held: shown.map((s, i) => ({ text: s.text, held: gone[i] - s.t, read: readMs(s.text), next: shown[i + 1] ? shown[i + 1].t - gone[i] : null })) };
};
const SNOW = await ev('SnakeDebug.flavor().weather.snow'), CHOKE = 'Squashed! Your own tail feeds nobody.', LOST = 'The woodpecker took a flag: that colony’s lost.';
await ev('centre()');
const inOrder = await inTurn(async () => {
  await ev(`stageEvents(() => [{ type: 'weather', kind: 'snow' }])`);
  await toTick();
  await ev(`(() => { delete SnakeDebug.game().told.squash; return 'ok'; })()`);
  await ev('stageSquash(0)'); // (a lesson, a tick into the weather)
  await toTick();
  await ev(`stageEvents(g => { g.woodpecker = { x: 12, y: 0, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick + 12 }; return [{ type: 'woodpecker' }]; })`);
  await toTick(); // (round news, a tick later)
}, 16000);
await ev(`(() => { const g = SnakeDebug.game(); g.woodpecker = null; return 'ok'; })()`);
const order = inOrder.shown.map(s => s.text);
check(order.length === 3 && SNOW.includes(order[0]) && order[1] === CHOKE && /woodpecker/i.test(order[2]),
  'the weather showing, a lesson waits its turn, and the woodpecker’s coming (round news) waits behind it: nothing cut short, nothing lost', order.join(' / '));
check(inOrder.held.length === 3 && inOrder.held.every(h => h.held >= h.read - 1 && h.held <= h.read + 60), 'each banner is held for its reading time, 1 s and 0.4 s a word, 4.5 s at most',
  inOrder.held.map(h => `${Math.round(h.held)} ms for ${h.read} (“${h.text}”)`).join('; '));
const gaps = inOrder.held.filter(h => h.next != null).map(h => h.next);
check(gaps.length === 2 && gaps.every(g => g >= 240 + 500 - 50 && g <= 240 + 500 + 10), 'the next comes up after the last one’s fade and a breather (0.24 s and 0.5 s)', gaps.map(Math.round).join(', ') + ' ms');
const lost = inOrder.log.filter(l => ['dropped', 'stale', 'skipped', 'cut'].includes(l.fate));
check(!lost.length && inOrder.log.filter(l => l.text === CHOKE).map(l => l.fate).join(' ') === 'queued shown', 'the lesson was queued, then shown (the banners’ own log)', inOrder.log.map(l => `${l.fate}: ${l.text}`).join('; '));
// (and a lesson whose moment has passed: the round's clock, held at 1 s
// here, moved on 6 s while it waited)
const stale = await inTurn(async () => {
  await ev(`stageEvents(() => [{ type: 'weather', kind: 'snow' }])`);
  await toTick();
  await ev(`(() => { const g = SnakeDebug.game(); delete g.told.squash; delete g.told.lostColony; g.snakes[2].memory.colonies = [{ x: 20, y: 5, radius: 3, n: 1 }]; return 'ok'; })()`);
  await ev('stageSquash(0)');
  await toTick(); // (the lesson, waiting; and the flag, seen standing)
  await ev(`(() => { const g = SnakeDebug.game(); g.holes.add(5 * 24 + 20); g.snakes[2].memory.colonies = []; return 'ok'; })()`);
  await toTick(); // (pecked out: round news, behind the lesson)
  await ev(`(() => { SnakeDebug.game().time += 6001; return 'ok'; })()`); // (between ticks: the round's clock on)
}, 11000);
await ev(`(() => { const g = SnakeDebug.game(); g.holes.delete(5 * 24 + 20); delete g.snakes[2].memory.colonies; return 'ok'; })()`);
const staleOrder = stale.shown.map(s => s.text), staleFates = stale.log.filter(l => l.text === CHOKE).map(l => l.fate).join(' ');
check(staleOrder.length === 2 && SNOW.includes(staleOrder[0]) && staleOrder[1] === LOST && staleFates === 'queued stale',
  'a lesson whose moment has passed while it waited (6 s of the round) is let go; the round news behind it still comes', `${staleOrder.join(' / ')}; the lesson: ${staleFates}`);
// A lesson that stops holding while it shows fades early, not after its
// reading time: your crash's lesson ("…the next one ends you."), once
// you're out (the polish lane).
const early = await ev(`(() => {
  hideToast(); let holds = true;
  toast('A lesson that holds.', 3000, 'warn', 'lesson', { still: () => holds });
  const shown = !toastEl.hidden && !toastEl.classList.contains('leaving');
  toastFade(); const kept = !toastEl.classList.contains('leaving');
  holds = false; toastFade(); const going = toastEl.classList.contains('leaving');
  hideToast(); return JSON.stringify({ shown, kept, going });
})()`);
check(early === JSON.stringify({ shown: true, kept: true, going: true }), 'a lesson showing fades early once it no longer holds (yours, once you’re out), and stays while it holds', early);
