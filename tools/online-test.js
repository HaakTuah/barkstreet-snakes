#!/usr/bin/env node
// Checks the online protocol: plays rounds on a "host" game, sends every tick
// through JSON to a "guest" game, and checks after every tick that the guest
// sees exactly the host's board (bodies, food, holes, the woodpecker, deaths).
//
//   node tools/online-test.js [rounds]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ window: {}, console, Math });
for (const f of ['tuning.js', 'ai.js', 'engine.js', 'online.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const { SnakeEngine: E, SnakeOnline: O } = ctx.window;
const rounds = Number(process.argv[2]) || 20;
const wire = msg => JSON.parse(JSON.stringify(msg)); // what a data channel would deliver

let ticks = 0, checks = 0;
const fail = (round, tick, what, a, b) => {
  console.error(`round ${round}, tick ${tick}: ${what} differs\n  host:  ${JSON.stringify(a)}\n  guest: ${JSON.stringify(b)}`);
  process.exit(1);
};
const same = (round, tick, what, a, b) => {
  checks++;
  if (JSON.stringify(a) !== JSON.stringify(b)) fail(round, tick, what, a, b);
};

for (let r = 0; r < rounds; r++) {
  // Two to four people, the rest AI; names that clash with rivals get numbered.
  const people = 2 + (r % 3);
  const humans = Array.from({ length: people }, (_, i) => ({ name: i === 1 ? 'Sniper' : `Friend ${i}`, color: O.HUMAN_COLORS[i], peer: `p${i}` }));
  const host = E.createGame({ humans });
  // People steer like an AI would (so rounds last), through their input queues.
  for (const s of host.snakes) if (s.isPlayer) s.autopilot = E.PERSONAS.drab;

  const roundMsg = wire(O.round(host, humans, 'Up the tree with you:'));
  const guest = E.createGame({ humans: roundMsg.humans, personas: roundMsg.personas });
  O.apply(guest, roundMsg.first, E.DIRS);
  same(r, 0, 'names', host.snakes.map(s => s.name), guest.snakes.map(s => s.name));

  let holesSent = 0;
  while (host.snakes.filter(s => s.alive).length > 1 && host.time < 400000) {
    const dyingHost = E.step(host);
    const msg = wire(O.tick(host, { holesFrom: holesSent, tickLen: E.tickMs(host) }));
    holesSent = host.holes.size;
    const dyingGuest = O.apply(guest, msg, E.DIRS);
    ticks++;
    const k = host.tick;
    same(r, k, 'tick/time', [host.tick, host.time], [guest.tick, guest.time]);
    same(r, k, 'bodies', host.snakes.map(s => s.alive ? s.body : null), guest.snakes.map(s => s.alive ? s.body : null));
    same(r, k, 'alive', host.snakes.map(s => s.alive), guest.snakes.map(s => s.alive));
    same(r, k, 'dirs', host.snakes.map(s => s.dir), guest.snakes.map(s => s.dir));
    same(r, k, 'hunger', host.snakes.map(s => [s.eaten, s.lastAte, s.nextStarve]), guest.snakes.map(s => [s.eaten, s.lastAte, s.nextStarve]));
    same(r, k, 'food', host.food.map(f => [f.x, f.y, f.kind, f.expires, f.color]), guest.food.map(f => [f.x, f.y, f.kind, f.expires, f.color]));
    same(r, k, 'holes', [...host.holes], [...guest.holes]);
    same(r, k, 'woodpecker', host.woodpecker, guest.woodpecker);
    same(r, k, 'deaths', dyingHost.map(s => [s.id, s.cause, s.killer, s.killerId]), dyingGuest.map(s => [s.id, s.cause, s.killer, s.killerId]));
    same(r, k, 'events', host.events.map(e => [e.type, e.snake?.id, e.kind, e.x, e.y]), guest.events.map(e => [e.type, e.snake?.id, e.kind, e.x, e.y]));
    const look = g => g.snakes.map(s => ['home', 'colonies', 'mood', 'moodChangedAt', 'modelId'].map(f => s.memory[f] ?? null));
    same(r, k, 'looks', look(host), look(guest));
  }
}
console.log(`ok: ${rounds} rounds, ${ticks} ticks, ${checks} checks, guest matched the host every tick`);
