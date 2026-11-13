// ---------------------------------------------------------------- an online round, replayed from its log
// ("Same seed, same game", core/modules/game-design.md: a game replays exactly from its seed and, where people play, from
// its log of every input.) A live round between a host and a friend, each in a context of its own as on two screens: the
// host runs the game with its randomness from a seed and takes every press by the game's own code (fromFriend, checkAway,
// handBack and sendPlan from game/friends.js; turn, swipeTo, powerOf and hostPress from game/input.js, read from the
// files), on a clock of frames as a browser's, the rivals thinking ahead a frame at a time. The friend's presses come over
// a link that is reliable and in order; one lands two ticks or more after it was made, and the host takes it then (no
// rollback, no hold). The round holds the woodpecker's peck, a lean food season, the friend away and back, gone quiet
// and handed back, and presses of every kind from both. The log keeps each input as it lands (the tick, the host's
// clock, who and the message, and where among the rivals' thinking), each friend's silence as checkAway reads it, and
// how many rivals thought ahead before each tick. Replayed in full through the same code from the seed alone, the host's
// board on every tick and at the end, and the friend's screen on every tick (re-encoded), are the live round's. Replayed
// from less, the inputs alone, it differs, a known failure listed with its issue: where a press lands among the rivals'
// thinking, and which rivals thought ahead, change the game.
{
  const { createHash } = require('crypto');
  const hash = v => createHash('sha256').update(JSON.stringify(v, replacer)).digest('hex').slice(0, 16); // (replacer, diffAt: part 31)
  const wire = msg => JSON.parse(JSON.stringify(msg)); // (what a data channel delivers)
  const text = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  // A top-level function or one-line name of the game's own (made a var, so the round can read and set it).
  const lift = (file, name) => {
    const t = text(file), at = t.search(new RegExp(`^(function ${name}\\(|(const|let) ${name} = )`, 'm'));
    if (at < 0) throw new Error(`32: ${name} is not in ${file}`);
    const end = t.startsWith('function', at) ? t.indexOf('\n}\n', at) + 3 : t.indexOf('\n', at) + 1;
    return t.slice(at, end).replace(/^(let|const) /, 'var ');
  };
  const HOST_CODE = [['game/input.js', ['turn', 'swipeTo', 'moved', 'powerOf', 'unleap', 'hostPressAt', 'hostPress']],
    ['game/friends.js', ['planSent', 'sendPlan', 'fromFriend', 'checkAway', 'handBack']]].flatMap(([f, names]) => names.map(n => lift(f, n))).join('\n');
  const ONLINE_FILES = [...GAME, 'records.js', 'online.js'];

  // A screen: the game's files in a context of their own, its randomness from a seed (`host`: also the host's code, with
  // what it reads of the page: the clock, timers, the room).
  function screen(seed, host) {
    const M = Object.create(Math), c = vm.createContext({ window: {}, console, Math: M });
    M.random = seeded(seed);
    for (const f of ONLINE_FILES) vm.runInContext(text(f), c, { filename: f });
    if (host) {
      vm.runInContext(`var theGame = null, state = 'running', online = null, clock = 0, timers = [];
        var Engine = window.SnakeEngine, Online = window.SnakeOnline, CAST = Engine.PERSONAS;
        var hosting = () => true, guesting = () => false, player = () => theGame.snakes[0];
        var toast = () => {}, setStatus = () => {}, FLAVOR = new Proxy({}, { get: () => () => '' });
        var performance = { now: () => clock }, setTimeout = (fn, ms) => timers.push({ at: clock + ms, fn });`, c);
      vm.runInContext(HOST_CODE, c, { filename: 'the host code of game/input.js and game/friends.js' });
    }
    return c;
  }
  const PEOPLE = [{ name: 'Hosting', peer: 'host' }, { name: 'Visiting', peer: 'p1' }];
  // The host's side of a round: its game, the room it talks through, and one tick of the game loop (game/core.js's tick and
  // afterTick, as far as the game is concerned): checkAway with the silences given, a step, the tick to the friend, and
  // the rivals and pilots queued to think ahead.
  function hosted({ seed, season, keys, acts, quiet, send, rtt }) {
    const c = screen(seed, true), E = c.window.SnakeEngine, O = c.window.SnakeOnline;
    const humans = PEOPLE.map((p, i) => ({ ...p, color: O.HUMAN_COLORS[i] }));
    const g = E.createGame({ humans, personas: keys, season, acts });
    g.snakes.forEach((s, i) => { if (humans[i]) s.peer = humans[i].peer; });
    c.theGame = g;
    c.online = { players: PEOPLE.map(p => ({ id: p.peer, away: false })), holesSent: g.holes.size,
      room: { quietFor: quiet, rtt: () => rtt, send() {}, broadcast: m => send(wire(m)) } };
    send(wire(O.round(g, humans, '', 'replayed')));
    const h = { c, E, O, g, queue: g.snakes.filter(s => s.persona), shifted: 0, windows: [], ticks: [] }; // (game/round.js: the rivals think before the first tick)
    h.tick = () => {
      h.windows.push(h.shifted); // (how many were taken from the queue before this tick: the rest decided in the step)
      c.checkAway();
      E.step(g);
      send(wire(O.tick(g, { holesFrom: c.online.holesSent, tickLen: E.tickMs(g) })));
      c.online.holesSent = g.holes.size;
      c.planSent = false;
      h.queue = g.snakes.filter(s => s.alive && (!s.isPlayer || s.autopilot));
      h.shifted = 0;
      h.ticks.push(JSON.stringify(g, replacer));
    };
    // A press as it lands on the host: a friend's message, or the host's own press come due (hostPress, its wait over).
    h.land = (from, msg) => from !== 'host' ? c.fromFriend(from, msg)
      : msg.t === 'pow' ? c.powerOf(c.player(), msg.k) : msg.t === 'swipe' ? c.swipeTo(msg.d, c.player()) : c.turn(msg.d, c.player());
    h.think = () => { const s = h.queue.shift(); h.shifted++; if (E.canThinkAhead(g, s)) E.thinkAhead(g, s); }; // (game/core.js's think, one at a time)
    h.over = () => g.snakes.filter(s => s.alive).length <= 1 || g.tick >= 300; // (a round's end, or 300 ticks: enough for all it must hold)
    return h;
  }
  // A friend's screen: what the host sends, applied as a guest's browser does (hash: its board, re-encoded).
  function watching(seed) {
    const c = screen(seed, false), E = c.window.SnakeEngine, O = c.window.SnakeOnline, w = { c, E, O, g: null, ticks: [] };
    w.take = m => {
      if (m.t === 'round') { w.g = E.createGame({ humans: m.humans, personas: m.personas }); O.apply(w.g, m.first, E.DIRS); }
      else if (m.t === 'tick') { O.apply(w.g, m, E.DIRS); w.ticks.push(hash(O.tick(w.g, { holesFrom: 0, tickLen: m.ms }))); }
      else if (m.t === 'plan') O.applyPlan(w.g, m, E.DIRS, 1);
    };
    return w;
  }
  const ROUND = { seed: 3201, keys: ['wildcard', 'capricious'], acts: [1500, 4000, 30000] };

  // The live round. Frames of 10 to 40 ms (now and then a hitch of 400, which ticks three times and leaves the rivals to
  // decide in the step); each frame first takes what has arrived and the host's own presses come due, then ticks, then lets a
  // rival or two think. Both people steer as Drab would, from a screen of their own (the friend's own, the host's a copy),
  // with randomness of their own; the friend's presses take 30 ms to arrive, in order, and one, the first after tick 60,
  // 2.5 ticks more (everything behind it waits for it). From 2 s to 3.5 s the friend's tab is hidden (away, back; then their
  // next press takes the wheel); from 7 s their link is silent for 1.2 s (the AI steers, then hands back).
  function live(season) {
    const log = [], quiet = [], chance = seeded(ROUND.seed * 7 + 1), friend = watching(ROUND.seed + 1), eyes = watching(ROUND.seed + 2);
    let heard = 0, arrive = 0, now = 0, late = null;
    const h = hosted({ ...ROUND, season, rtt: 60, quiet: peer => { const ms = now - heard; quiet.push({ k: h.g.tick, peer, ms }); return ms; }, send: m => { friend.take(m); eyes.take(m); } });
    const { c, E, g } = h;
    const inbox = [], landed = (from, msg) => log.push({ k: g.tick, after: h.shifted, at: now, from, msg });
    const sendUp = (msg, extra = 0) => { arrive = Math.max(arrive, now + 30 + extra); const m = wire(msg); inbox.push({ at: arrive, msg: m }); return m; };
    const silent = () => now >= 7000 && now < 8200;
    const mind = [{}, {}];
    // A person's next press, from what their screen shows (Drab's choice, with their own randomness).
    const press = (id) => {
      const s = eyes.g.snakes[id];
      if (!s?.alive) return null;
      const was = eyes.c.Math.random;
      eyes.c.Math.random = chance;
      try {
        const d = eyes.c.window.SnakeAI.decide(eyes.E.aiView(eyes.g, s), eyes.E.PERSONAS.drab, mind[id]), r = chance();
        if (r < 0.06) return { t: 'pow', k: ['leap', 'flash', 'letgo', 'unleap'][Math.floor(chance() * 4)] };
        if (d !== s.dir) return { t: r < 0.5 ? 'turn' : 'swipe', d: Object.keys(eyes.E.DIRS).find(k => eyes.E.DIRS[k] === d) };
        return null;
      } finally { eyes.c.Math.random = was; }
    };
    let ticked = -1, keepalive = 0, awaySent = false, backSent = false, lastTickAt = 0;
    while (!h.over()) {
      now += chance() < 0.06 && !(late && late.landed == null) ? 400 : 10 + Math.floor(chance() * 30); // (no hitch while the late press is on its way: it would land with the ticks it was late for still to come)
      c.clock = now;
      // The friend: "still here" every 250 ms, and their presses once a tick, as they see it (not while hidden or silent).
      while (keepalive + 250 <= now) { keepalive += 250; if (!silent()) { arrive = Math.max(arrive, keepalive + 30); inbox.push({ at: arrive, msg: null }); } }
      if (!awaySent && now >= 2000) { awaySent = true; sendUp({ t: 'away' }); }
      if (!backSent && now >= 3500) { backSent = true; sendUp({ t: 'back' }); }
      if (eyes.g.tick !== ticked) {
        ticked = eyes.g.tick;
        const hidden = awaySent && !backSent, m = !hidden && !silent() && press(1);
        if (m) {
          const slow = !late && g.tick > 60, sent = sendUp(m, slow ? 2.5 * E.tickMs(g) : 0);
          if (slow) late = { made: g.tick, sent };
        }
        const mine = press(0); // (the host's own, through hostPress: a round trip's wait)
        if (mine) c.hostPress(() => { landed('host', mine); h.land('host', mine); }, mine.t === 'pow' && mine.k === 'letgo');
      }
      // What has arrived, and the host's presses come due, in the order of the clock.
      while (inbox.length && inbox[0].at <= now) {
        const { msg } = inbox.shift();
        heard = now;
        if (!msg) continue;
        if (late && msg === late.sent) late.landed = g.tick;
        landed('p1', msg);
        h.land('p1', msg);
      }
      for (const t of c.timers.splice(0).sort((a, b) => a.at - b.at)) { if (t.at <= now) t.fn(); else c.timers.push(t); }
      // The ticks this frame is due, then thinking: a rival or two (none in a frame that ticked twice).
      let steps = 0;
      while (now - lastTickAt >= E.tickMs(g) && steps < 3 && !h.over()) { lastTickAt += E.tickMs(g); h.tick(); steps++; }
      if (h.over()) break; // (the round's end: no more thinking)
      if (steps < 2) for (let n = Math.floor(chance() * 3); n > 0 && h.queue.length; n--) h.think();
      if (!c.planSent && !h.queue.length) c.sendPlan();
    }
    return { log, quiet, windows: h.windows, host: h.ticks, friend: friend.ticks, late, g };
  }

  // The replay: the log through the same code from the seed, each tick's inputs at the host's clock as they landed
  // (hostPress with no wait: the wait is over when it lands). From the inputs alone, they land before the rivals think and
  // every rival thinks ahead; `where`: also where each landed among the rivals' thinking, and how many thought ahead.
  function replay(season, rec, where) { // (where: 'all', the log in full; 'presses', where each input landed; false, neither)
    const quiet = rec.quiet.slice(), friend = watching(ROUND.seed + 1), byTick = new Map();
    for (const e of rec.log) byTick.set(e.k, [...byTick.get(e.k) || [], e]);
    const h = hosted({ ...ROUND, season, rtt: 0, send: m => friend.take(m), quiet: peer => {
      const q = quiet.shift();
      if (!q || q.k !== h.g.tick || q.peer !== peer) throw new Error(`32: the log's silences are out of step at tick ${h.g.tick}`);
      return q.ms;
    } });
    const { c, g } = h;
    for (;;) {
      for (const e of byTick.get(g.tick) || []) {
        if (where) while (h.shifted < e.after && h.queue.length) h.think();
        c.clock = e.at;
        if (e.from === 'host') c.hostPress(() => h.land('host', e.msg), e.msg.t === 'pow' && e.msg.k === 'letgo');
        else h.land(e.from, e.msg);
      }
      if (h.over()) break;
      const to = where === 'all' ? rec.windows[h.windows.length] : Infinity;
      while (h.shifted < to && h.queue.length) h.think();
      if (!c.planSent && !h.queue.length) c.sendPlan();
      h.tick();
    }
    return { host: h.ticks, friend: friend.ticks, g };
  }
  // The first tick whose board differs, and where (null: none).
  const differs = (a, b, of) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] === b[i]) continue;
      return a[i] && b[i] && of === 'host' ? `tick ${i + 1}, ${diffAt(JSON.parse(a[i]), JSON.parse(b[i]))}` : `tick ${i + 1} (${a.length} ticks live, ${b.length} replayed)`;
    }
    return null;
  };

  const season = 'lean', rec = live(season);
  const kinds = new Set(rec.log.map(e => e.from === 'host' ? `host ${e.msg.t}` : e.msg.t)), events = new Set();
  for (const b of rec.host) for (const e of JSON.parse(b).events) events.add(e.type);
  const piloted = rec.host.some(b => JSON.parse(b).snakes[1].autopilot);
  check(`32: a live online round to replay: ${rec.host.length} ticks in a ${season} season, the woodpecker's peck, the friend away and back and gone quiet, presses of every kind from both`,
    rec.g.season === season && events.has('peck') && piloted && rec.quiet.some(q => q.ms > T.AWAY_MS) && ['turn', 'swipe', 'pow', 'away', 'back', 'host turn', 'host swipe', 'host pow'].every(k => kinds.has(k)),
    `events: ${[...events].join(', ')}; inputs: ${[...kinds].join(', ')}`);
  check('32: ...a friend\'s press made on one tick that arrived late lands when it arrives, two ticks on or more (the host neither holds nor rolls back)',
    rec.late && rec.late.landed >= rec.late.made + 2 && rec.log.some(e => e.msg === rec.late.sent && e.k === rec.late.landed), JSON.stringify(rec.late && { made: rec.late.made, landed: rec.late.landed }));
  // The replays. In full: the inputs, each where it landed among the rivals' thinking, and how many thought ahead each
  // tick. With less, the replay differs from the live round, as listed with its issue (a known failure, printed, not
  // counted; one that no longer differs says so).
  const ISSUE = 'NNN';
  const replays = [
    ['all', 'the log in full (each input where it landed among the rivals\' thinking, and how many thought ahead)'],
    ['presses', 'the log with where each input landed, every rival thinking ahead'],
    [false, 'the seed and the inputs alone, each tick\'s before the rivals think, every rival thinking ahead'],
  ];
  for (const [where, what] of replays) {
    const r = replay(season, rec, where);
    const bad = differs(rec.host, r.host, 'host') || (JSON.stringify(rec.g, replacer) !== JSON.stringify(r.g, replacer) ? 'the end' : null), badFriend = differs(rec.friend, r.friend, 'friend');
    const host = `32: replayed from ${what}: the host's board on every tick and at the end is the live round's`, guest = `32: ...and the friend's screen on every tick`;
    if (where === 'all') { check(host, !bad, bad); check(guest, !badFriend, badFriend); continue; }
    for (const [name, b] of [[host, bad], [guest, badFriend]]) console.log(b ? `known ${name} (#${ISSUE}: differs at ${b})` : `ok   ${name} (known to differ, #${ISSUE}, but not on this round)`);
  }
}
