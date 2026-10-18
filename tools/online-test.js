#!/usr/bin/env node
// Checks the online protocol: plays rounds on a "host" game, sends every tick
// through JSON to a "guest" game, and checks after every tick that the guest
// sees exactly the host's board (bodies, food, holes, the woodpecker, deaths,
// powers). The people jump and flash now and then (and take a held jump
// back), through the same 'pow' message a friend's browser sends; one of
// them steers by queueing turns, as presses do. Between ticks the guest gets
// the host's plans (the rivals' thinking ahead, a person's queued turn), and
// draws ahead from the same ones. Chokes and nudges (a snake's own bead spat
// aside, food rolled aside while it coughs) and each snake's cough cross too:
// the engine's own, and one staged now and then as the engine makes them, so
// every round has some.
// Every message must fit PeerJS's 16 KB limit, and a guest must shrug off a
// malformed one.
//
//   node tools/online-test.js [rounds]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ window: {}, console, Math });
for (const f of ['tuning.js', 'ai.js', 'engine.js', 'records.js', 'online.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const { SnakeEngine: E, SnakeOnline: O, SnakeRecords: Rec, TUNING: T } = ctx.window;
const rounds = Number(process.argv[2]) || 20;
// What a data channel would deliver (PeerJS refuses JSON messages of 16,300 bytes or more).
const LIMIT = 16000;
let biggest = 0;
const wire = msg => {
  const text = JSON.stringify(msg);
  biggest = Math.max(biggest, text.length);
  if (text.length >= LIMIT) { console.error(`a ${msg.t} message is ${text.length} bytes`); process.exit(1); }
  return JSON.parse(text);
};

let ticks = 0, checks = 0, presses = 0, flashes = 0, plans = 0;
const coughs = { choke: 0, nudge: 0, staged: 0 };
// A choke as the engine makes one (a snake's head on its own bead: spat a
// cell aside, or left where it is, and a cough), and a nudge a few ticks into
// the cough (something its head reached, rolled aside: an apple, a beetle
// scurrying, a bead).
const NUDGED = ['food', 'beetle', 'pellet', 'golden'];
function stage(game) {
  const live = game.snakes.filter(s => s.alive), k = game.tick;
  const s = k % 41 === 3 ? live.find(o => o.coughUntil > k) : live[k % live.length], h = s?.body[0];
  if (!h || game.events.some(e => e.type === 'choke' || e.type === 'nudge')) return;
  const side = (k >> 4) % 3, tx = side === 2 ? h.x : Math.max(0, Math.min(E.GRID - 1, h.x + (side ? 1 : -1))); // (side 2: it stayed put, under the head)
  if (k % 41 === 0) {
    game.events.push({ type: 'choke', snake: s, x: h.x, y: h.y, tx, ty: h.y });
    s.coughUntil = k + T.COUGH_TICKS;
    coughs.staged++;
  } else if (k % 41 === 3) {
    game.events.push({ type: 'nudge', snake: s, kind: NUDGED[(k >> 3) % NUDGED.length], x: h.x, y: h.y, tx, ty: h.y });
    coughs.staged++;
  }
}
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
  // People steer like an AI would (so rounds last): the first by queueing
  // turns, as a person's presses do; the others with an AI at the wheel.
  for (const s of host.snakes) if (s.isPlayer && s.id > 0) s.autopilot = E.PERSONAS.drab;
  const person = host.snakes[0], mind = {};

  const roundMsg = wire(O.round(host, humans, 'Up the tree with you:'));
  const guest = E.createGame({ humans: roundMsg.humans, personas: roundMsg.personas });
  O.apply(guest, roundMsg.first, E.DIRS);
  same(r, 0, 'names', host.snakes.map(s => s.name), guest.snakes.map(s => s.name));

  let holesSent = 0;
  while (host.snakes.filter(s => s.alive).length > 1 && host.time < 400000) {
    // A person presses a power now and then (about one press a second each),
    // as their browser would: a message, checked, then the engine's own call.
    for (const s of host.snakes) {
      if (!s.isPlayer || !s.alive || Math.random() > 0.12) continue;
      const msg = wire({ t: 'pow', k: O.POWERS[Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 0 : 2] });
      if (!O.POWERS.includes(msg.k)) continue;
      if (msg.k === 'unleap') { if (s.leapArmed >= host.tick) s.leapArmed = -1; } // (a held jump taken back, as the host does)
      else (msg.k === 'flash' ? E.flash : E.leap)(host, s);
      presses++;
    }
    const dyingHost = E.step(host);
    flashes += host.events.filter(e => e.type === 'dash' && e.plain).length;
    stage(host);
    for (const e of host.events) if (e.type in coughs) coughs[e.type]++;
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
    const powers = g => g.snakes.map(s => [s.stunUntil, s.burnUntil, s.burnFrom, s.leaps, s.leapArmed, s.dashes, s.leapReadyAt, s.wrapUntil, s.flight ? s.flight.dir : null, s.flashReadyAt, s.flashArmed, s.coughUntil ?? -1]);
    same(r, k, 'stuns, burns, powers and coughs', powers(host), powers(guest));
    const food = g => g.food.map(f => [f.x, f.y, f.kind, f.expires, f.color, f.dir && f.kind === 'beetle' ? f.dir : null, f.px ?? null, f.py ?? null, f.movedAt ?? null, !!f.scared, f.heat || 0, !!f.cooked, !!f.gold, f.owner ?? null]);
    same(r, k, 'food', food(host), food(guest));
    same(r, k, 'holes', [...host.holes], [...guest.holes]);
    same(r, k, 'woodpecker', host.woodpecker, guest.woodpecker);
    same(r, k, 'burrows', host.burrows, guest.burrows);
    same(r, k, 'fire', [...host.fires].map(([c, f]) => [c, f.from, f.until, f.strike, f.group, !!f.ember]), [...guest.fires].map(([c, f]) => [c, f.from, f.until, f.strike, f.group, !!f.ember]));
    same(r, k, 'weather', [host.weather.kind, host.weather.since, host.weather.until], [guest.weather.kind, guest.weather.since, guest.weather.until]);
    same(r, k, 'deaths', dyingHost.map(s => [s.id, s.cause, s.killer, s.killerId, s.fatal || null]), dyingGuest.map(s => [s.id, s.cause, s.killer, s.killerId, s.fatal || null]));
    const ev = g => g.events.map(e => [e.type, e.snake?.id, e.kind, e.x, e.y, e.gold ? 1 : 0, e.reach ?? null, e.n ?? null, e.by ?? null, e.plain ? 1 : 0, e.flash ? 1 : 0, e.own ? 1 : 0, e.type === 'peck' ? e.under ?? [] : null, e.color ?? null, e.tx ?? null, e.ty ?? null]); // (powers' payloads too, what the lessons need, and where a spat or nudged piece rolled)
    same(r, k, 'events', ev(host), ev(guest));
    const look = g => g.snakes.map(s => ['home', 'colonies', 'mood', 'moodChangedAt', 'modelId', 'desperate'].map(f => s.memory[f] ?? null));
    same(r, k, 'looks', look(host), look(guest));

    // Between ticks the rivals think ahead, and the host sends where everyone
    // goes next: the guest draws ahead from the same plans (and a person's
    // queued turn and powers asked for), for this tick only.
    for (const s of host.snakes) if (E.canThinkAhead(host, s)) E.thinkAhead(host, s);
    if (person.alive) { // (the person steers between ticks: a turn queued when its mind says so, as a press would)
      const d = ctx.window.SnakeAI.decide(E.aiView(host, person), E.PERSONAS.drab, mind);
      if (d !== person.dir) person.queue.push(d);
      if (Math.random() < 0.1) E.leap(host, person); // (and asks to jump now and then)
    }
    const p = wire(O.plan(host));
    if (!O.applyPlan(guest, p, E.DIRS, -1)) fail(r, k, 'a plan for this tick', 'taken', 'refused');
    const next = g => g.snakes.map(s => !s.alive ? null : !s.isPlayer || s.autopilot
      ? [s.plannedTick === g.tick ? s.planned : null, s.plannedTick === g.tick && s.memory.power === g.tick, s.plannedTick === g.tick && s.memory.flash === g.tick]
      : [s.queue[0] || null, s.leapArmed >= g.tick, s.flashArmed >= g.tick]);
    same(r, k, 'plans', next(host), next(guest));
    plans++;
    if (O.applyPlan(guest, { ...p, k: p.k - 1 }, E.DIRS, -1)) fail(r, k, 'a stale plan', 'refused', 'taken');
  }
}
if (!plans) { console.error('no plan was sent: the test lost its point'); process.exit(1); }
if (!coughs.choke || !coughs.nudge) { console.error('no choke or no nudge crossed: the test lost its point'); process.exit(1); }

// The biggest scores message: four people, each with ten rounds under long names.
const owner = i => 'owner' + i + 'abcdefghijklmnopqrstuvwxyz0123456789'.slice(0, 28);
const rows = i => Array.from({ length: 12 }, (_, n) => ({
  id: 'id' + n + 'x'.repeat(40), name: 'Ünïcødé Ñame ' + i + n + '😀', place: 1 + (n % 4), won: n % 4 === 0, draw: false,
  eaten: 99 + n, survived: 123456 + n, date: Date.now() - n * 1000, round: 'ROUND' + n + 'y'.repeat(40), owner: owner(i),
}));
wire({ t: 'scores', from: [0, 1, 2, 3].map(i => ({ color: O.HUMAN_COLORS[i], entries: Rec.cleanShared(rows(i), owner(i)) })) });
if (Rec.cleanShared(rows(0), owner(1)).length) { console.error("a friend's rows can't speak for someone else"); process.exit(1); }

// A malformed tick from a modified host: odd memory is ignored, nothing throws.
const g = E.createGame({ humans: [{ name: 'A', color: O.HUMAN_COLORS[0], peer: 'p0' }] });
const bad = wire(O.tick(g, { holesFrom: 0, tickLen: 120 }));
bad.s[1][6] = { mood: 'constructor', colonies: 'not a list', home: 5, victimId: 'x' };
O.apply(g, bad, E.DIRS);
if (g.snakes[1].memory.mood || g.snakes[1].memory.colonies || g.snakes[1].memory.home || g.snakes[1].memory.victimId) { console.error('malformed memory got through'); process.exit(1); }
// Nor do chokes and nudges that name no snake, no food or no cell on the board (or a cough that isn't a tick).
bad.s[1][20] = 'soon';
bad.e = [['choke', 'x', 1, 1, 2, 1], ['choke', 1, 1, 1, -1, 1], ['nudge', 1, 99, 1, 1, 2, 1], ['nudge', 1, 0, 1, 1, E.GRID, 1], ['nudge', 9, 0, 1, 1, 2, 1], ['choke', 1, 3, 4, 3, 5]];
O.apply(g, bad, E.DIRS);
if (g.events.length !== 1 || g.events[0].tx !== 3 || g.events[0].ty !== 5 || g.snakes[1].coughUntil !== -1) { console.error('a malformed choke, nudge or cough got through', JSON.stringify(g.events.map(e => [e.type, e.x, e.y, e.tx, e.ty]))); process.exit(1); }

// A guest's press the host can't use (an unknown power, a made-up direction) is refused.
if (O.POWERS.includes('dash') || O.POWERS.includes(undefined) || O.DIR_NAMES.includes('ahead')) { console.error('a bad press got through'); process.exit(1); }
if (!flashes) { console.error('no plain flash happened: the test lost its point'); process.exit(1); }

console.log(`ok: ${rounds} rounds, ${ticks} ticks, ${checks} checks, guest matched the host every tick (${presses} power presses, ${flashes} plain flashes, ${plans} plans, ${coughs.choke} chokes and ${coughs.nudge} nudges, ${coughs.choke + coughs.nudge - coughs.staged} of them the engine's); biggest message ${biggest} bytes`);
