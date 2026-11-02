// ---------------------------------------------------------------- the hunger warning comes in time (#327)
// (DESIGN "Hunger where your eyes are"; Engine.hungerWarning, which the toast, the tag and the growl read.)
// Once, on a phone, the seat Ouroboros's AI steered starved 4 s after "Your tummy is rumbling", in snow.
// The lead was a cut: its own tail dropped out of its coil with the clock at zero. It wasn't: it was a
// snake of 4 (its score, 12, is meals, not length), warned at 6 s on the hunger clock, which snow runs
// 1.75 times as fast, with one shrink left before the end.

// Ouroboros, alone on a bare log in snow, n long and coiled round its own tail, its meal left ms from
// running out, nothing to eat: played on till it starves (or 60 s). When the warning came (by the old
// reading, 6 s on the hunger clock, and by Engine.hungerWarning) and every change in its length.
function starveScene(n, left, weather = 'snow') {
  const coil = [[10, 10], [11, 10], [12, 10], [12, 11], [12, 12], [11, 12], [10, 12], [9, 12], [8, 12], [8, 11], [8, 10], [8, 9], [9, 9], [10, 9], [11, 9]];
  const g = E.createGame({ withPlayer: false, personas: ['ouroboros', 'drab'] });
  g.snakes = g.snakes.slice(0, 2);
  const [s, o] = g.snakes;
  s.body = coil.slice(0, n).map(([x, y]) => ({ x, y })); s.dir = D.left; s.grow = 0;
  o.body = line(20, 2, 3).map(([x, y]) => ({ x, y })); o.alive = false; // (no rival: only the clock)
  g.time = 60000; g.food = []; g.given = new Set();
  g.weather = { kind: weather, since: g.time, until: 1e9, nextGust: 0, nextStrike: 1e9 };
  s.lastAte = g.time - T.HUNGER_MS + left; s.nextStarve = g.time + left;
  const snap = () => ({ snakes: g.snakes.map(q => ({ id: q.id, body: q.body.map(c => ({ ...c })), dir: q.dir, stun: 0, leaps: 0, dashes: 0, wrap: 0, air: 0, land: -1, cough: 0 })), holes: 0, fires: [], pecks: [] });
  g.history = [snap(), snap(), snap()];
  let oldWarn = null, warn = null, shrinks = 0, cuts = 0, len = n;
  while (s.alive && g.time < 120000) {
    if (oldWarn == null && E.hungerLeft(g, s) < T.HUNGER_WARN_MS * (s.body.length <= T.MIN_LENGTH ? 1.5 : 1)) oldWarn = g.time;
    if (warn == null && E.hungerWarning(g, s) < 1) warn = g.time;
    quiet(g);
    if (s.body.length === len - 1) shrinks++; else if (s.body.length < len) cuts++;
    len = s.body.length;
  }
  return { s, end: g.time, oldWarn, warn, shrinks, cuts };
}

{ // The lead: 15 long, coiled, in snow. It shrinks a segment at a time, no cut, and lasts long after the warning.
  const r = starveScene(15, 8000);
  check('#327: coiled at 15 in snow, Ouroboros starves a segment at a time (no cut), long after its warning',
    !r.s.alive && r.s.cause === 'starved' && r.cuts === 0 && r.shrinks === 12 && r.end - r.oldWarn > 10000,
    JSON.stringify({ cause: r.s.cause, shrinks: r.shrinks, cuts: r.cuts, afterWarning: r.end - r.oldWarn }));
}
{ // The cause: at 4 in snow, the old reading warned it only about 4.5 s before it starved; the warning now
  // comes as early as at its smallest (9 s before the end, in real time). Off the snow, the warning is as
  // it was: 6 s before a long snake shrinks, 9 s before one at its smallest starves.
  const four = starveScene(4, 15000);
  check('#327: at 4 in snow, the old warning came under 5 s before it starved (the bug, shown)', !four.s.alive && four.s.cause === 'starved' && four.end - four.oldWarn < 5000, `${four.end - four.oldWarn} ms`);
  check('#327: ...and the hunger warning now comes 9 s before it starves', four.end - four.warn >= 1.5 * T.HUNGER_WARN_MS, `${four.end - four.warn} ms`);
  const three = starveScene(3, 15000, 'clear'), long = starveScene(15, 15000, 'clear'), longSnow = starveScene(15, 15000);
  const shrinkAt = left => 60000 + left; // (when it starts shrinking: its meal runs out)
  const tick = T.START_TICK; // (within a tick, the longest)
  check('...off the snow, at its smallest it is warned 9 s before it starves, as it was', Math.abs(three.end - three.warn - 1.5 * T.HUNGER_WARN_MS) <= tick && three.warn === three.oldWarn, JSON.stringify({ warn: three.end - three.warn, old: three.end - three.oldWarn }));
  check('...a long snake 6 s before it starts shrinking, as it was', Math.abs(shrinkAt(15000) - long.warn - T.HUNGER_WARN_MS) <= tick && long.warn === long.oldWarn, `${shrinkAt(15000) - long.warn} ms`);
  check('...and in snow, 6 s before by the clock on the wall, not the hunger clock', Math.abs(shrinkAt(15000 / T.SNOW_HUNGER) - longSnow.warn - T.HUNGER_WARN_MS) <= tick, `${shrinkAt(15000 / T.SNOW_HUNGER) - longSnow.warn} ms`);
}
{ // Online, a guest reads the warning from what it's sent (lastAte, nextStarve, the body, the weather): never
  // from pending growth, which isn't sent. At 3 in snow with a golden apple's growth to come, host and guest agree.
  const g = starveScene(3, 12000).s, game = { weather: { kind: 'snow' }, time: 0 };
  const fed = { ...g, alive: true, lastAte: -T.HUNGER_MS + 12000, nextStarve: 12000 };
  const host = E.hungerWarning(game, { ...fed, grow: 3 }), guest = E.hungerWarning(game, { ...fed, grow: 0 });
  check('#327: the warning reads only what a guest is sent (not pending growth)', host === guest, JSON.stringify({ host, guest }));
}
