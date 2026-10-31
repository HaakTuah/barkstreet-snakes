// ------------------------------------------- the newest version, by itself
// (update.js) A newer version out (its build, as version.js would name it)
// never reloads the page during a round: it waits for the round's end and
// reloads there, once, with no question. After an update the start card's
// intro line says what is new for a few rounds (a first visit shows none), then
// it goes. Online, the host's Host a game goes into the new version first and
// the room opens there.
await b.viewport(1280, 800);
let loads = 0;
const stop = b.on('Page.loadEventFired', () => loads++);
const reloaded = async (from, ms = 15000) => { for (let t = 0; t < ms && loads === from; t += 100) await b.sleep(100); await b.sleep(500); await ev(HELPERS); await wait(`window.SnakeDebug && SnakeDebug.state() !== undefined && cardUp()`, 15000); await ev(PROBE); return loads > from; };
const newer = build => ev(`SnakeUpdate.latest = async () => ${JSON.stringify(build)}; SnakeUpdate.look().then(b => b)`);

// A round under way: a newer version waits; at the round's end, in it goes.
await load();
await ev(`localStorage.clear(); sessionStorage.clear(); addEventListener('beforeunload', () => sessionStorage.setItem('t-left', SnakeDebug.state())); 1`);
await fresh(['mason']);
const found = await newer('next');
let from = loads;
await b.sleep(1500);
check(found === 'next' && loads === from && (await ev(`SnakeDebug.state()`)) === 'running', 'a newer version out during a round: no reload, the round goes on', `found ${found}, ${loads - from} loads`);
await ev(`(() => { const g = SnakeDebug.game(), m = g.snakes.find(s => !s.isPlayer); m.burnFrom = g.tick; m.burnUntil = g.tick + 400; setInterval(() => { if (m.alive) { m.body.length = Math.min(m.body.length, 3); m.grow = 0; } }, 40); pilot.crash = true; return 1; })()`);
const went = await reloaded(from, 40000);
const left = await ev(`sessionStorage.getItem('t-left')`);
check(went && left === 'over' && (await ev(`SnakeDebug.state()`)) === 'ready', '...at the round’s end it reloads into it, with no question, on to the start card', `reloaded ${went}, left at ${left}`);
from = loads;
await b.sleep(1500);
check(loads === from && (await ev(`SnakeUpdate.waiting()`)) === null, '...once: the page it got stays (a build it reloaded for and didn’t get is let be)', `${loads - from} more loads`);

// What changed: a returning player's next few start cards, then gone; a first visit, none.
const line = await ev(`'New: ' + SnakeVersion.news[0].line`);
const lengths = await ev(`SnakeVersion.news.map(n => ('New: ' + n.line).length).concat(SnakeDebug.flavor().intro.length)`), introLen = lengths.pop();
check(lengths.every(n => n <= introLen), 'every line of what is new is no longer than the intro it stands in for', `${lengths.join(', ')} of ${introLen}`);
await ev(`localStorage.clear(); localStorage.setItem('snake-name', '"Haakon"'); 1`);
await load();
const shown = [];
for (let i = 0; i < 4; i++) {
  shown.push((await P()).text);
  await fresh(['mason'], true);
  await ev(`SnakeDebug.setup(); 1`);
}
shown.push((await P()).text);
check(shown.slice(0, 3).every(f => f === line) && !shown[3] && !shown[4], 'after an update the start card says what is new for three rounds, and then it’s gone', shown.map(f => f ? 'line' : 'none').join(', '));
await ev(`localStorage.clear(); 1`);
await load();
check((await P()).text !== line, '...a first visit (no records) shows no such line');

// Online: the host looks before opening the room, and opens it in the new version.
await ev(`localStorage.clear(); sessionStorage.clear(); 1`);
await load();
await ev(`document.getElementById('friends').click(); 1`);
await b.sleep(300);
await newer('next2');
from = loads;
await ev(`document.getElementById('start').click(); 1`);
const hosted = await reloaded(from);
const after = await P();
check(hosted && after.state === 'lobby' && after.title === 'Play with friends', 'Host a game with a newer version out: into it first, and the room opens there', `reloaded ${hosted}, ${after.state}: ${after.title}`);
await ev(`backToStart(); 1`);
stop();
