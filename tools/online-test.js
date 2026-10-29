#!/usr/bin/env node
// Checks the online protocol: plays rounds on a "host" game, sends every tick
// through JSON to a "guest" game, and checks after every tick that the guest
// sees exactly the host's board (bodies, food, holes, the woodpecker, deaths,
// powers, and every event with all it says). The people jump and flash now
// and then (and take a held jump back), through the same 'pow' message a
// friend's browser sends; one of them steers by queueing turns, as presses
// do, the others with a rival's brain at the wheel. Between ticks the guest
// gets the host's plans (the rivals' thinking ahead, a person's queued
// turn), and draws ahead from the same ones.
// The rounds are seeded (the same every run: --seed N plays others) and
// their line-ups chosen, so every look a snake's memory sends crosses:
// Sovereign's realm, Colonist's colonies and the site it's off to plant,
// Capricious's moods, Copycat's model, Vulture's lure, a hunter's victim; and
// a person called Sniper plays the rival of that name. It counts what
// crossed: every kind of event the engine has (read from engine.js) and
// everything each said, every field of a tick (a snake's whenever it
// changed, the food's, the woodpecker's, fire's, the weather's, the beetles
// underground), each at least MIN times, and every way the engine says a
// snake was out (also read from engine.js), once at least. What the rounds
// don't bring often enough is staged now and then, as the engine makes it (a
// squash, a fire put out, a beetle flown off, a beetle digging
// in, beetles underground, food knocked aside, an apple in the mark on the
// aim's last tick and where the strike promises it, a snake alight...; a kind of
// event the protocol carries before the engine makes it, too), and a way to be out
// they didn't bring is staged after them, on a board of its own; so nothing
// goes unchecked, and a new event, field or way to be out fails here until
// it's sent and crosses.
// Every message must fit PeerJS's 16 KB limit, and a guest must shrug off a
// malformed one.
//
// Every kind of message also goes once through the wire on its own, and must come
// back unchanged; their shapes are pinned with the protocol version (see below).
//
//   node tools/online-test.js [rounds] [--seed N] [--pin]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2), seedAt = args.indexOf('--seed');
const SEED = seedAt >= 0 ? Number(args[seedAt + 1]) : 1;
const rounds = Number(args.find((a, i) => /^\d+$/.test(a) && i !== seedAt + 1)) || 3;
const MIN = 3; // (crossings of each event kind, each thing it says, each field of a tick)

// mulberry32, as simulate.js has it: the game draws from rng (reseeded every
// round), the people's presses from their own.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rng = seeded(SEED);
const chance = seeded(SEED * 7 + 1);
const M = Object.create(Math);
M.random = () => rng();
const ctx = vm.createContext({ window: {}, console, Math: M });
for (const f of ['tuning.js', 'ai.js', 'engine.js', 'records.js', 'online.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const { SnakeEngine: E, SnakeOnline: O, SnakeRecords: Rec, TUNING: T } = ctx.window;
const ENGINE = fs.readFileSync(path.join(ROOT, 'engine.js'), 'utf8');
// Every kind of event the engine makes (each must cross). (A kind the
// protocol carries before the engine makes it would go in here too, staged
// till it does: none now.)
const KINDS = [...new Set([...ENGINE.matchAll(/events\.push\(\{ type: '(\w+)'/g)].map(m => m[1]))].sort();
// Every way the engine says a snake was out (s.fatal: each must cross, once
// at least): what it sets it to, and why a crash was the end.
const FATAL_SET = [...ENGINE.matchAll(/\.fatal = ([^;]+);/g)].flatMap(m => [...m[1].matchAll(/'(\w+)'/g)].map(q => q[1]));
const FATAL_WHY = [...ENGINE.matchAll(/why\.set\(\w+, '(\w+)'\)/g)].map(m => m[1]);
const FATAL = [...new Set([...FATAL_SET, ...FATAL_WHY])].sort();
if (!FATAL_SET.length || !FATAL_WHY.length) { console.error(`the ways to be out read from engine.js (${FATAL.join(', ')}) miss what ${FATAL_SET.length ? 'why.set' : 's.fatal ='} says: the pattern lost them`); process.exit(1); }
// What a person, the rivals and the brains at the other people's wheels are,
// round by round (past these: two to four people, rivals at random, Drab
// driving).
const LINEUPS = [
  { people: 2, rivals: ['sniper', 'vulture'], pilots: ['sovereign'] },
  { people: 3, rivals: ['colonist'], pilots: ['capricious', 'copycat'] },
  { people: 4, rivals: [], pilots: [] },
];
// What a snake's memory sends (a guest's renderer and chatter read them all).
const LOOKS = ['home', 'colonies', 'mood', 'moodChangedAt', 'modelId', 'victimId', 'lureId', 'site', 'desperate'];
// The fields of a snake in a tick, in order (see online.js: tick and apply).
const FIELDS = ['alive', 'dir', 'eaten', 'lastAte', 'nextStarve', 'cells', 'memory', 'autopilot', 'stunUntil', 'burnUntil', 'burnFrom', 'leaps', 'leapArmed', 'dashes', 'leapReadyAt', 'wrapUntil', 'flight', 'flashReadyAt', 'flashArmed', 'mealMs', 'land', 'airLeft', 'airGold'];
// What a data channel would deliver (PeerJS refuses JSON messages of 16,300 bytes or more).
const LIMIT = 16000;
let biggest = 0;
const wire = msg => {
  const text = JSON.stringify(msg);
  biggest = Math.max(biggest, text.length);
  if (text.length >= LIMIT) { console.error(`a ${msg.t} message is ${text.length} bytes`); process.exit(1); }
  return JSON.parse(text);
};

// What crossed, checked (MIN of each by the end), and what was staged.
const seen = new Map(), staged = new Map();
const cross = (key, n = 1) => seen.set(key, (seen.get(key) || 0) + n);
const blank = v => v == null || v === false || v === 0 || v === -1 || v === '' || (typeof v === 'object' && !Object.keys(v).length);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// A tick that matched: each field of a snake that changed since the last
// (a guest that dropped it would still show the old), each look, the food
// (each kind, each thing it says), the holes, the woodpecker's fields, the
// burrows, each kind of fire and weather, and the events (each kind, each
// thing it says).
function counted(msg, last, events) {
  msg.s.forEach((t, id) => t.forEach((v, j) => {
    const was = last?.s[id]?.[j];
    if (last ? !same(v, was) : !blank(v)) cross(`snake ${FIELDS[j] ?? j}`);
    if (j === 6) for (const k of new Set([...Object.keys(v || {}), ...Object.keys(was || {})])) if (!same(v?.[k], was?.[k])) cross(`memory ${k}`);
  }));
  for (const f of msg.f) { const kind = ['food', 'golden', 'mushroom', 'pellet', 'beetle', 'leaf', 'goldcap'][f[2]] ?? f[2]; cross(`food ${kind}`); f.forEach((v, j) => { if (j > 2 && !blank(v)) cross(`food ${kind} ${j}`); }); }
  if (msg.h.length) cross('holes');
  if (msg.w) msg.w.forEach((v, j) => { if (!blank(v)) cross(`woodpecker ${j}`); });
  if (!same(msg.bu, last?.bu)) cross('burrows');
  if (msg.bu.some(b => b[4])) cross('burrows dug');
  if (msg.bu.some(b => b[6] > 0)) cross('burrows shut');
  if (!same(msg.un, last?.un)) cross('unders');
  if (msg.un.some(u => u[3])) cross('unders gold');
  for (const f of msg.fi) cross(`fire ${FIRES[f[3]]}`);
  cross(`weather ${msg.sky[0]}`);
  for (const e of events) {
    cross(e.type);
    for (const [k, v] of Object.entries(e)) if (k !== 'type' && !blank(v)) cross(`${e.type} ${k === 'snake' ? 'snake' : k}`);
    if (e.type === 'death') {
      for (const k of ['cause', 'killer', 'killerId', 'diedAt', 'fatal']) if (!blank(e.snake[k])) cross(`death ${k}`);
      if (!FATAL.includes(e.snake.fatal)) { console.error(`a snake out "${e.snake.fatal}", which isn't among the ways read from engine.js (${FATAL.join(', ')})`); process.exit(1); }
      cross(`death fatal ${e.snake.fatal}`);
    }
  }
}
// (A death, once at least: what it says, and each way to be out. They come
// as they come in the rounds; a way they didn't bring is staged after them.)
const short = key => (seen.get(key) || 0) < (key.startsWith('death') ? 1 : MIN);

// An event as the guest has it, beside the host's: everything it says (its
// snake by id; flags as 0 or 1).
const said = e => Object.fromEntries(Object.keys(e).sort().map(k => [k, k === 'snake' ? e.snake?.id ?? null : typeof e[k] === 'boolean' ? +e[k] : e[k] ?? null]).filter(([, v]) => v !== null && v !== 0));

let ticks = 0, checks = 0, presses = 0, plans = 0, eaten = 0;
const fail = (round, tick, what, a, b) => {
  console.error(`round ${round}, tick ${tick}: ${what} differs\n  host:  ${JSON.stringify(a)}\n  guest: ${JSON.stringify(b)}`);
  process.exit(1);
};
const check = (round, tick, what, a, b) => {
  checks++;
  if (!same(a, b)) fail(round, tick, what, a, b);
};
// A tick as the guest has it, beside the host's: everything on the board, who
// died and how, every event with all it says, and every look.
function matched(r, host, guest, dyingHost, dyingGuest) {
  const k = host.tick;
  check(r, k, 'tick/time', [host.tick, host.time], [guest.tick, guest.time]);
  check(r, k, 'bodies', host.snakes.map(s => s.alive ? s.body : null), guest.snakes.map(s => s.alive ? s.body : null));
  check(r, k, 'alive', host.snakes.map(s => s.alive), guest.snakes.map(s => s.alive));
  check(r, k, 'dirs', host.snakes.map(s => s.dir), guest.snakes.map(s => s.dir));
  check(r, k, 'hunger', host.snakes.map(s => [s.eaten, s.lastAte, s.nextStarve, s.mealMs]), guest.snakes.map(s => [s.eaten, s.lastAte, s.nextStarve, s.mealMs]));
  const powers = g => g.snakes.map(s => [s.stunUntil, s.burnUntil, s.burnFrom, s.leaps, s.leapArmed, s.dashes, s.leapReadyAt, s.wrapUntil, s.flight ? [s.flight.dir, s.flight.land, s.flight.over, !!s.flight.gold] : null, s.flashReadyAt, s.flashArmed, !!s.autopilot]);
  check(r, k, 'stuns, burns and powers', powers(host), powers(guest));
  const food = g => g.food.map(f => [f.x, f.y, f.kind, f.expires, f.color, f.dir && f.kind === 'beetle' ? f.dir : null, f.px ?? null, f.py ?? null, f.movedAt ?? null, !!f.scared, f.heat || 0, !!f.cooked, !!f.gold, f.owner ?? null, f.digUntil ?? null]);
  check(r, k, 'food', food(host), food(guest));
  check(r, k, 'holes', [...host.holes], [...guest.holes]);
  check(r, k, 'woodpecker', host.woodpecker, guest.woodpecker);
  check(r, k, 'burrows', host.burrows, guest.burrows);
  check(r, k, 'beetles underground', host.unders || [], guest.unders);
  check(r, k, 'fire', [...host.fires].map(([c, f]) => [c, f.from, f.until, f.strike, f.group, !!f.ember]), [...guest.fires].map(([c, f]) => [c, f.from, f.until, f.strike, f.group, !!f.ember]));
  check(r, k, 'weather', [host.weather.kind, host.weather.since, host.weather.until], [guest.weather.kind, guest.weather.since, guest.weather.until]);
  check(r, k, 'deaths', dyingHost.map(s => [s.id, s.cause, s.killer, s.killerId, s.diedAt, s.fatal || null]), dyingGuest.map(s => [s.id, s.cause, s.killer, s.killerId, s.diedAt, s.fatal || null]));
  check(r, k, 'events', host.events.map(said), guest.events.map(said));
  const look = g => g.snakes.map(s => LOOKS.map(f => s.memory[f] ?? null));
  check(r, k, 'looks', look(host), look(guest));
}

// Staged now and then, as the engine makes them (what's still short of MIN,
// once the rounds before have had their go): golden powers held, a look, the rarer
// food, a golden beetle, a snake alight, food cooking, a spell of weather
// (a storm: lightning, fire, embers); and every other kind of event, at a
// living snake's head (s; o, another), each of the ways it can come. One a
// tick, at most.
const EVENTS = (s, o, h, k) => {
  const at = { x: h.x, y: h.y };
  return {
    eat: [{ snake: s, kind: 'pellet', ...at, color: o.color, cooked: true, gold: false }, { snake: s, kind: 'beetle', ...at, cooked: false, gold: true }],
    leap: [{ snake: s, ...at, gold: 1, reach: 2 }], dash: [{ snake: s, ...at, n: 1, plain: 1 }, { snake: s, ...at, n: 3 }],
    fizzle: [{ snake: s, why: 'resting', ...at, flash: 1 }, { snake: s, why: 'landing', ...at, flash: 0 }],
    cut: [{ snake: s, ...at, lost: 2, by: o.id }],
    alight: [{ snake: s }], singe: [{ snake: s }], starving: [{ snake: s }],
    spawn: [{ kind: 'beetle', ...at, gold: true }, { kind: 'golden', ...at }, { kind: 'leaf', ...at }, { kind: 'goldcap', ...at }],
    weather: [{ kind: ['sun', 'wind', 'rain', 'storm', 'snow'][k % 5] }], ember: [{ ...at, fx: Math.max(0, h.x - 1), fy: h.y }], woodpecker: [{}],
    peck: [{ ...at, cells: [h.y * E.GRID + h.x], under: [s.id] }], rot: [{ ...at, kind: 'apple' }, { ...at, kind: 'pellet', color: o.color }],
    baked: [{ ...at, kind: 'food' }], ash: [{ ...at, kind: 'pellet' }],
    squash: [{ snake: s, ...at }], crash: [{ snake: s, ...at, cause: `crashed into ${o.name}`, killer: o.name, killerId: o.id, lost: 3 }, { snake: s, ...at, cause: 'hit the edge', killer: 'wall', killerId: null, lost: 5, failed: 1 }],
    dig: [{ ...at, until: k + 8 }], dive: [{ ...at }, { ...at, dug: 1 }],
    knock: [{ kind: 'food', ...at, tx: Math.min(E.GRID - 1, h.x + 2), ty: h.y }, { kind: 'beetle', ...at, tx: h.x, ty: Math.max(0, h.y - 2), gold: 1 }, { kind: 'pellet', ...at, tx: null, ty: null, color: o.color }], // (knocked aside, a golden beetle scurrying, and a bead in its colour with nowhere to go)
    burrow: [{ ...at }, { ...at, dug: 1 }], shut: [{ ...at, at: 9000 + k }], heal: [{ ...at }], // (one cracked open, or left by a dig; one starting to grow shut; one closing over)
  };
};
const WEATHER = ['clear', 'sun', 'wind', 'rain', 'storm', 'snow'], FIRES = ['burning', 'struck', 'ember']; // (online.js's orders)
// (A free cell, nearest the middle: nobody's body, no food, no hole.)
const free = game => {
  const taken = new Set([...game.holes, ...game.food.map(f => f.y * E.GRID + f.x), ...game.snakes.flatMap(s => s.alive ? s.body.map(c => c.y * E.GRID + c.x) : [])]);
  for (let d = 0; d < E.GRID; d++) for (let y = 0; y < E.GRID; y++) for (let x = 0; x < E.GRID; x++) if (Math.max(Math.abs(x - E.GRID / 2), Math.abs(y - E.GRID / 2)) <= d && !taken.has(y * E.GRID + x)) return { x, y };
  return null;
};
const buried = new Set(); // (the beetles staged underground: they come up, as the engine's do, when their time's up)
function stage(game) {
  const live = game.snakes.filter(s => s.alive), k = game.tick;
  for (const u of buried) if (k >= u.until) { buried.delete(u); const i = game.unders.indexOf(u); if (i >= 0) game.unders.splice(i, 1); } // (the engine may have brought it up itself)
  if (live.length < 2) return;
  const s = live[k % live.length], o = live[(k + 1) % live.length], h = s.body[0];
  const add = e => { game.events.push(e); staged.set(e.type, (staged.get(e.type) || 0) + 1); };
  const w = game.woodpecker, at = c => !game.holes.has(c) && !game.food.some(f => f.y * E.GRID + f.x === c) && !game.snakes.some(q => q.alive && q.body.some(b => b.y * E.GRID + b.x === c));
  const spot = w && w.target.length && k >= w.strikeAt && !w.landings && short('woodpecker 9') ? w.target.find(at) : undefined;
  if (spot != null) { // (an apple in the mark on the aim's last tick, and where the strike promises it'll land, as the engine keeps it)
    game.food.push({ x: spot % E.GRID, y: Math.floor(spot / E.GRID), kind: 'food', expires: k + 100 });
    w.landings = E.knocks(game, w.target).map(({ food: f, to }) => [f.y * E.GRID + f.x, to ? to.y * E.GRID + to.x : -1]);
    staged.set('landings', (staged.get('landings') || 0) + 1);
    return;
  }
  if (k % 7) return;
  if (short('snake leaps')) { s.leaps = Math.min(T.LEAP_MAX, s.leaps + T.LEAP_CHARGES); return; } // (as a golden beetle gives them)
  if (short('snake dashes')) { s.dashes = Math.min(T.DASH_MAX, s.dashes + T.DASH_CHARGES); return; } // (a golden leaf)
  if (short('snake wrapUntil')) { s.wrapUntil = game.time + T.WRAP_MS; return; } // (and a golden mushroom)
  const looks = { home: { x: h.x, y: h.y, radius: 3 }, colonies: [{ x: h.x, y: h.y, radius: 3, n: 1 }], site: { x: h.x, y: h.y }, mood: 'drab', moodChangedAt: game.time, modelId: o.id, victimId: o.id, lureId: o.id, desperate: !s.memory.desperate };
  const look = LOOKS.find(f => short(`memory ${f}`));
  if (look) { s.memory[look] = looks[look]; return; } // (a look its brain might have: whose realm, mood or model)
  const ripe = { leaf: T.LEAF_TICKS, goldcap: T.GOLDCAP_TICKS, golden: T.APPLE_TICKS, mushroom: T.APPLE_TICKS }, grow = Object.keys(ripe).find(f => short(`food ${f}`)), c = grow && free(game);
  if (c) { game.food.push({ ...c, kind: grow, expires: k + ripe[grow] }); return; } // (one of the rarer things come up, where things come up)
  const bug = game.food.find(f => f.kind === 'beetle' && !f.gold);
  if (bug && short('food beetle 10')) { bug.gold = 1; return; } // (a golden one)
  if (bug && short('food beetle 9')) { bug.scared = true; return; } // (a scared one)
  const digger = game.food.find(f => f.kind === 'beetle' && f.digUntil == null);
  if (digger && short('food beetle 11')) { digger.digUntil = k + 8; return; } // (one digging in, cornered)
  if (game.burrows.length && short('burrows dug')) { game.burrows[0].dug = 1; return; } // (one a dig left)
  if (game.burrows.length && !game.burrows[0].shutAt && short('burrows shut')) { game.burrows[0].shutFrom = game.time; game.burrows[0].shutAt = game.time + 9000; return; } // (one growing shut)
  const hatch = game.burrows[0] || free(game);
  if (hatch && (short('unders') || short('unders gold'))) { const u = { until: k + 12 + (k % 5), expires: k + 200, from: hatch.y * E.GRID + hatch.x, gold: short('unders gold') }; (game.unders ||= []).push(u); buried.add(u); return; } // (one gone down a burrow, or where it dug)
  if (short('snake burnUntil') || short('snake burnFrom')) { s.burnFrom = k; s.burnUntil = k + 6; return; } // (as fire sets it alight)
  const apple = game.food.find(f => f.kind === 'food' && !f.heat);
  if (apple && (short('food food 5') || short('food food 6'))) { apple.heat = 2; if (k % 2) apple.cooked = 1; return; } // (food in the fire: warming, then baked)
  const sky = [1, 2, 3, 4, 5].find(w => short(`weather ${w}`) || (w === 4 && FIRES.some(f => short(`fire ${f}`))));
  if (sky && !E.suddenDeath(game) && game.weather.kind === 'clear') { game.weather = { kind: WEATHER[sky], since: game.time, until: game.time + 8000, nextGust: game.time + 600, nextStrike: game.time + 1200 }; return; } // (a spell, as the sky brings them)
  const ev = EVENTS(s, o, h, k);
  for (const kind of KINDS) {
    if (kind === 'death') continue; // (deaths come as they come)
    const ways = ev[kind] || [{ x: h.x, y: h.y }], n = staged.get(kind) || 0; // (the rest only say where)
    const way = [...ways.slice(n % ways.length), ...ways.slice(0, n % ways.length)].find(w => short(kind) || Object.keys(w).some(f => short(`${kind} ${f}`)));
    if (way) return add({ type: kind, ...way });
  }
}

for (let r = 0; r < rounds; r++) {
  rng = seeded(SEED * 1000 + r * 7919);
  // Two to four people, the rest AI; names that clash with rivals get numbered.
  const line = LINEUPS[r] || { people: 2 + (r % 3), rivals: null, pilots: [] };
  const humans = Array.from({ length: line.people }, (_, i) => ({ name: i === 1 ? 'Sniper' : `Friend ${i}`, color: O.HUMAN_COLORS[i], peer: `p${i}` }));
  const host = E.createGame({ humans, personas: line.rivals });
  // People steer like an AI would (so rounds last): the first by queueing
  // turns, as a person's presses do; the others with an AI at the wheel.
  for (const s of host.snakes) if (s.isPlayer && s.id > 0) s.autopilot = E.PERSONAS[line.pilots[s.id - 1] || 'drab'];
  const person = host.snakes[0], mind = {};

  const roundMsg = wire(O.round(host, humans, 'Up the tree with you:'));
  const guest = E.createGame({ humans: roundMsg.humans, personas: roundMsg.personas });
  O.apply(guest, roundMsg.first, E.DIRS);
  check(r, 0, 'names', host.snakes.map(s => s.name), guest.snakes.map(s => s.name));
  if (line.rivals?.includes('sniper') && !guest.snakes.some(s => s.name === 'Sniper 2')) fail(r, 0, 'a person called Sniper beside the rival', 'Sniper 2', guest.snakes.map(s => s.name));
  counted(roundMsg.first, null, []);

  let holesSent = 0, last = roundMsg.first;
  while (host.snakes.filter(s => s.alive).length > 1 && host.time < 400000) {
    // A person presses a power now and then (about one press a second each),
    // as their browser would: a message, checked, then the engine's own call.
    for (const s of host.snakes) {
      if (!s.isPlayer || !s.alive || chance() > 0.12) continue;
      const msg = wire({ t: 'pow', k: O.POWERS[chance() < 0.6 ? 1 : chance() < 0.85 ? 0 : 2] });
      if (!O.POWERS.includes(msg.k)) continue;
      if (msg.k === 'unleap') { if (s.leapArmed >= host.tick) s.leapArmed = -1; } // (a held jump taken back, as the host does)
      else (msg.k === 'flash' ? E.flash : E.leap)(host, s);
      presses++;
    }
    const dyingHost = E.step(host);
    if (r === rounds - 1) stage(host); // (in the last round: the ones before have had their go)
    const msg = wire(O.tick(host, { holesFrom: holesSent, tickLen: E.tickMs(host) }));
    holesSent = host.holes.size;
    const dyingGuest = O.apply(guest, msg, E.DIRS);
    ticks++;
    const k = host.tick;
    matched(r, host, guest, dyingHost, dyingGuest);
    counted(msg, last, host.events);
    eaten += host.events.filter(e => e.type === 'eat').length;
    last = msg;

    // Between ticks the rivals think ahead, and the host sends where everyone
    // goes next: the guest draws ahead from the same plans (and a person's
    // queued turn and powers asked for), for this tick only.
    for (const s of host.snakes) if (E.canThinkAhead(host, s)) E.thinkAhead(host, s);
    if (person.alive) { // (the person steers between ticks: a turn queued when its mind says so, as a press would)
      const d = ctx.window.SnakeAI.decide(E.aiView(host, person), E.PERSONAS.drab, mind);
      if (d !== person.dir) person.queue.push(d);
      if (chance() < 0.1) E.leap(host, person); // (and asks to jump now and then, or to flash)
      else if (chance() < 0.03) E.flash(host, person);
    }
    const p = wire(O.plan(host));
    if (!O.applyPlan(guest, p, E.DIRS, -1)) fail(r, k, 'a plan for this tick', 'taken', 'refused');
    const next = g => g.snakes.map(s => !s.alive ? null : !s.isPlayer || s.autopilot
      ? [s.plannedTick === g.tick ? s.planned : null, s.plannedTick === g.tick && s.memory.power === g.tick, s.plannedTick === g.tick && s.memory.flash === g.tick]
      : [s.queue[0] || null, s.leapArmed >= g.tick, s.flashArmed >= g.tick]);
    check(r, k, 'plans', next(host), next(guest));
    for (const [i, q] of p.s.entries()) if (q) q.forEach((v, j) => { if (v > 0 || (j === 0 && v >= 0)) cross(`plan ${host.snakes[i].isPlayer && !host.snakes[i].autopilot ? 'person' : 'rival'} ${['way', 'jump', 'flash'][j]}`); });
    plans++;
    if (O.applyPlan(guest, { ...p, k: p.k - 1 }, E.DIRS, -1)) fail(r, k, 'a stale plan', 'refused', 'taken');
  }
}

// Every way to be out crosses: each the rounds didn't bring is staged after
// them, on a board of its own a tick into a round, as the engine leaves a
// snake that's out (not alive, its cause, killer and why, the tick it died,
// and its death event), and the tick checked like any other. (The card, the
// word that pops up and the records read it. A guest that dropped one, a
// pit's 'hole' say, passed here while the rounds brought no such death.)
const deathsStaged = [];
for (const fatal of FATAL.filter(k => short(`death fatal ${k}`))) {
  rng = seeded(SEED * 1000 + 99991 + 7919 * FATAL.indexOf(fatal));
  const humans = [0, 1].map(i => ({ name: `Friend ${i}`, color: O.HUMAN_COLORS[i], peer: `p${i}` }));
  const host = E.createGame({ humans });
  const roundMsg = wire(O.round(host, humans, 'Up the tree with you:'));
  const guest = E.createGame({ humans: roundMsg.humans, personas: roundMsg.personas });
  O.apply(guest, roundMsg.first, E.DIRS);
  const dyingHost = E.step(host);
  const live = host.snakes.filter(s => s.alive), s = live[FATAL.indexOf(fatal) % live.length], by = live.find(o => o !== s);
  Object.assign(s, { alive: false, cause: `out: ${fatal}`, killer: by.name, killerId: by.id, diedAt: host.tick, fatal });
  host.events.push({ type: 'death', snake: s });
  dyingHost.push(s);
  const msg = wire(O.tick(host, { holesFrom: 0, tickLen: E.tickMs(host) }));
  const dyingGuest = O.apply(guest, msg, E.DIRS);
  ticks++;
  matched(`staged '${fatal}'`, host, guest, dyingHost, dyingGuest);
  counted(msg, roundMsg.first, host.events);
  deathsStaged.push(fatal);
}

// Everything crossed, MIN times at least: every kind of event and all it
// said, every field of a tick and every look.
// (What each kind of event says, in all its ways of coming, as staged; the
// ones that only say where, where; a death, what the snake does.)
const ways = EVENTS({ id: 1, color: '#fff', name: 'S' }, { id: 2, color: '#000', name: 'O' }, { x: 1, y: 1 }, 1);
const says = KINDS.filter(k => k !== 'death').flatMap(k => [...new Set((ways[k] || [{ x: 1, y: 1 }]).flatMap(w => Object.keys(w).filter(f => !blank(w[f]))))].map(f => `${k} ${f}`));
const want = [...KINDS, ...says, ...['snake', 'cause', 'killer', 'diedAt', 'fatal'].map(f => `death ${f}`), ...FATAL.map(k => `death fatal ${k}`), ...FIELDS.map(f => `snake ${f}`), ...LOOKS.map(f => `memory ${f}`), 'holes', 'burrows', 'burrows dug', 'burrows shut', 'unders', 'unders gold',
  ...['food', 'golden', 'mushroom', 'pellet', 'beetle', 'leaf', 'goldcap'].flatMap(k => [`food ${k}`, `food ${k} 3`]), // (each kind, and when it goes)
  'food food 5', 'food food 6', 'food pellet 4', 'food pellet 7', ...[5, 6, 7, 8, 9, 10, 11].map(j => `food beetle ${j}`), // (warming and baked; a bead's colour and whose; a beetle's way, where from, when it moved, scared, golden, digging in)
  ...FIRES.map(k => `fire ${k}`),
  ...WEATHER.map((w, k) => `weather ${k}`), ...Array.from({ length: 10 }, (_, j) => `woodpecker ${j}`), ...['way', 'jump', 'flash'].flatMap(k => [`plan rival ${k}`, `plan person ${k}`])];
const lacking = [...new Set(want)].filter(short).map(k => `${k} (${seen.get(k) || 0})`);
if (process.env.ONLINE_SEEN) console.log([...seen].sort().map(([k, v]) => `${k}: ${v}`).join('\n'));
if (lacking.length) { console.error(`seen too few times (fewer than ${MIN}; a death's, never), the test lost its point there: ${lacking.join(', ')}`); process.exit(1); }

// Every kind of message, once each, through the real encoders (a board set by
// hand, so it's the same whatever the engine does): each must survive the
// wire unchanged (a tick, plan or round: encoded, decoded on a guest and
// encoded again, the same), and their shapes are pinned with the protocol
// version in tools/protocol-shapes.json. Shapes changed and VERSION not
// bumped fails, naming the kinds; VERSION bumped and the pin not refreshed
// (--pin) fails too. The kinds must be the ones online.js and net.js type,
// every kind the game sends, and every kind of event the engine makes.
const PIN_FILE = path.join(__dirname, 'protocol-shapes.json');
function protocolSamples() {
  rng = seeded(424242);
  const humans = [{ name: 'A', color: O.HUMAN_COLORS[0], peer: 'p0', owner: 'o0' }, { name: 'B', color: O.HUMAN_COLORS[1], peer: 'p1', owner: 'o1' }];
  const personas = ['sniper', 'vulture'];
  const host = E.createGame({ humans, personas });
  const [a, b, c, d] = host.snakes, D = E.DIRS;
  host.tick = 12; host.time = 1440;
  Object.assign(c.memory, { home: { x: 1, y: 2 }, colonies: [{ x: 3, y: 4 }], mood: 'sniper', moodChangedAt: 5, modelId: 1, victimId: 0, lureId: 0, site: { x: 5, y: 6 }, desperate: true });
  Object.assign(b, { autopilot: E.PERSONAS.drab, flight: { dir: D.up, over: [{ x: b.body[0].x, y: b.body[0].y - 1 }], land: { x: b.body[0].x, y: b.body[0].y - 2 }, gold: 1 } });
  Object.assign(d, { alive: false, cause: 'starved', killer: 'hunger', killerId: null, diedAt: 1400, fatal: 'hunger' });
  host.food = [{ x: 3, y: 4, kind: 'beetle', expires: 500, dir: D.left, px: 4, py: 4, movedAt: 7, scared: true, gold: 1, digUntil: 30 },
    { x: 5, y: 6, kind: 'pellet', expires: 400, color: '#f00', heat: 2, cooked: 1, owner: 1 }];
  host.unders = [{ until: 50, expires: 90, from: 41, gold: true }];
  host.holes.add(123);
  host.woodpecker = { x: 1, y: 2, at: 3, target: [10, 11], strikeAt: 20, last: [9], struckAt: 4, restUntil: 5, pecks: 2, landings: [[10, 12], [11, -1]] };
  host.burrows = [{ x: 2, y: 3, at: 4, used: 8, dug: 1, shutFrom: 900, shutAt: 9900 }];
  host.fires = new Map([[44, { from: 1, until: 9, strike: true, group: 1 }]]);
  host.weather = { kind: 'rain', since: 1, until: 99 };
  const at = { x: 2, y: 3 };
  host.events = [
    { type: 'eat', snake: a, kind: 'pellet', ...at, color: '#f00', cooked: true, gold: false }, { type: 'leap', snake: a, ...at, gold: 1, reach: 2 },
    { type: 'dash', snake: a, ...at, n: 3, plain: 1 }, { type: 'death', snake: d }, { type: 'fizzle', snake: a, why: 'resting', ...at, flash: 1 },
    { type: 'crash', snake: a, ...at, cause: 'hit B', killer: 'B', killerId: 1, lost: 2 }, { type: 'cut', snake: a, ...at, lost: 3, by: 1 },
    { type: 'squash', snake: a, ...at }, { type: 'crash', snake: a, ...at, cause: 'hit the edge', killer: 'wall', killerId: null, lost: 5, failed: 1 }, { type: 'dig', ...at, until: 30 },
    { type: 'dive', ...at, dug: 1 }, { type: 'knock', kind: 'pellet', ...at, tx: 4, ty: 4, gold: 0, color: '#f00' }, { type: 'burrow', ...at, dug: 1 },
    { type: 'shut', ...at, at: 9900 }, { type: 'heal', ...at }, { type: 'spawn', kind: 'food', ...at, gold: 0 }, { type: 'weather', kind: 'rain' }, { type: 'ember', ...at, fx: 4, fy: 4 },
    { type: 'woodpecker' }, { type: 'peck', ...at, cells: [10, 11], under: [0] }, { type: 'rot', ...at, kind: 'pellet', color: '#f00' }, { type: 'flown', ...at },
    { type: 'starving', snake: a }, { type: 'alight', snake: a }, { type: 'singe', snake: a }, { type: 'baked', ...at, kind: 'food' }, { type: 'ash', ...at, kind: 'food' },
    ...['emerge', 'gust', 'charge', 'strike', 'rainbow', 'aim', 'douse', 'lastApples'].map(type => ({ type, ...at })),
  ];
  // Plans: a rival that has thought (to jump), a person with a turn queued (and a flash asked for).
  Object.assign(c, { planned: D.down, plannedTick: host.tick }); c.memory.power = host.tick;
  a.queue.push(D.left); a.flashArmed = host.tick;
  const row = { id: 'r1', name: 'A', place: 1, won: true, draw: false, eaten: 9, survived: 60000, date: 1767225600000, round: 'R1', owner: 'o0', chosen: false };
  return {
    host, humans, personas, messages: [
      { t: 'welcome', name: 'B' }, { t: 'reject', why: 'version' }, { t: 'lobby', players: [{ id: 'host', name: 'A', color: O.HUMAN_COLORS[0], host: true }], lineup: [{ key: personas[0], chosen: true }] },
      O.round(host, humans, 'Up the tree with you:', 'R1'), { t: 'scores', from: [{ color: O.HUMAN_COLORS[1], entries: [row] }] },
      { t: 'phase', s: 'countdown', beat: 2 }, { t: 'phase', s: 'go' }, O.tick(host, { holesFrom: 0, tickLen: 120 }), O.plan(host),
      { t: 'say', id: 2, text: 'Hello.', reply: false }, { t: 'closed' },
      { t: 'hello', v: O.VERSION, name: 'B', owner: 'o1', scores: [row] }, { t: 'turn', d: 'up' }, { t: 'swipe', d: 'left' }, { t: 'pow', k: 'leap' },
      { t: 'away' }, { t: 'back' }, { t: 'ping', at: 1000 }, { t: 'pong', at: 1000 }, { t: 'k' },
    ],
  };
}
const { host: sampleHost, humans: sampleHumans, personas: samplePersonas, messages: SAMPLES } = protocolSamples();
// Round trips.
for (const msg of SAMPLES) {
  const sent = wire(msg);
  let back = sent;
  if (msg.t === 'tick' || msg.t === 'plan' || msg.t === 'round') {
    const guest = E.createGame({ humans: sampleHumans, personas: samplePersonas });
    if (msg.t === 'round') {
      O.apply(guest, sent.first, E.DIRS);
      back = O.round(guest, sent.humans, sent.rivals, sent.id);
    } else {
      O.apply(guest, wire(O.tick(sampleHost, { holesFrom: 0, tickLen: 120 })), E.DIRS);
      if (msg.t === 'plan') O.applyPlan(guest, sent, E.DIRS);
      back = msg.t === 'plan' ? O.plan(guest) : O.tick(guest, { holesFrom: 0, tickLen: 120 });
    }
  }
  if (!same(back, msg)) { console.error(`a ${msg.t} message changed on the way:\n  sent ${JSON.stringify(msg)}\n  came ${JSON.stringify(back)}`); process.exit(1); }
}
// Shapes: each message's fields, and each row a message carries (a tick's events by name), each field's type
// (a list's, with its first item's).
const typeOf = v => v === null ? 'null' : Array.isArray(v) ? `array<${v.length ? typeOf(v[0]) : ''}>` : typeof v === 'object' ? `object(${Object.keys(v).sort().join(',')})` : typeof v;
const shapeOf = v => Array.isArray(v) ? `[${v.length}] ${v.map(typeOf).join(' ')}` : `{${Object.keys(v).length}} ${Object.keys(v).sort().map(k => `${k}: ${typeOf(v[k])}`).join(', ')}`;
const SHAPES = {};
for (const msg of SAMPLES) {
  const name = msg.t === 'phase' ? `phase ${msg.s}` : msg.t;
  SHAPES[name] = shapeOf(msg);
  if (msg.t === 'tick') {
    SHAPES['tick s'] = shapeOf(msg.s[2]); // (a rival's: its memory says all it can)
    SHAPES['tick f beetle'] = shapeOf(msg.f[0]); SHAPES['tick f meal'] = shapeOf(msg.f[1]);
    for (const k of ['un', 'bu', 'fi']) SHAPES[`tick ${k}`] = shapeOf(msg[k][0]);
    SHAPES['tick w'] = shapeOf(msg.w); SHAPES['tick sky'] = shapeOf(msg.sky);
    for (const e of msg.e) SHAPES[`tick e ${e[0]}`] = shapeOf(e);
  }
  if (msg.t === 'plan') SHAPES['plan s'] = shapeOf(msg.s[2]);
  if (msg.t === 'round') SHAPES['round humans'] = shapeOf(msg.humans[0]);
  if (msg.t === 'lobby') { SHAPES['lobby players'] = shapeOf(msg.players[0]); SHAPES['lobby lineup'] = shapeOf(msg.lineup[0]); }
  if (msg.t === 'scores') { SHAPES['scores from'] = shapeOf(msg.from[0]); SHAPES['score row'] = shapeOf(msg.from[0].entries[0]); }
}
const kindsNow = Object.keys(SHAPES).sort();
const FINGERPRINT = require('crypto').createHash('sha256').update(JSON.stringify(kindsNow.map(k => [k, SHAPES[k]]))).digest('hex').slice(0, 16);
// The kinds against the types, the game's code and the engine.
const words = list => [...list.matchAll(/'(\w+)'/g)].map(m => m[1]);
const quoted = (text, re) => new Set([...text.matchAll(re)].flatMap(m => words(m[1])));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const ONLINE = read('online.js'), NET = read('net.js');
const docs = text => [...text.matchAll(/\/\*\*[\s\S]*?\*\//g)].map(m => m[0]).join('\n');
// (the t's of the typedefs the unions HostMessage, GuestMessage and NetMessage name, followed through)
const TYPEDEFS = new Map();
for (const chunk of (docs(ONLINE) + docs(NET)).split('@typedef ').slice(1)) {
  let depth = 0, end = 0;
  for (; end < chunk.length; end++) { if (chunk[end] === '{') depth++; if (chunk[end] === '}' && !--depth) break; }
  const name = chunk.slice(end + 1).match(/^\s*(\w+)/);
  if (name) TYPEDEFS.set(name[1], chunk.slice(1, end));
}
const typedT = new Set();
const follow = name => {
  const body = TYPEDEFS.get(name);
  if (body == null) { console.error(`the message type ${name} isn't a @typedef`); process.exit(1); }
  if (/^\s*\w+(\s*\|\s*\w+)*\s*$/.test(body)) body.split('|').forEach(n => follow(n.trim()));
  else for (const t of quoted(body, /\bt: ((?:'\w+'(?: \| )?)+)/g)) typedT.add(t);
};
['HostMessage', 'GuestMessage', 'NetMessage'].forEach(follow);
const eventDoc = ONLINE.slice(ONLINE.indexOf('@typedef {[\'eat\''), ONLINE.indexOf('} EventRow'));
const typedE = new Set([...quoted(eventDoc, /\[((?:'\w+'))/g), ...quoted(eventDoc, /type: ((?:'\w+'(?: \| )?)+)/g)]);
const GAME_CODE = ['net.js', 'online.js', ...fs.readdirSync(path.join(ROOT, 'game')).map(f => `game/${f}`)].map(read).join('\n').replace(/\/\*\*[\s\S]*?\*\//g, '');
const sentT = quoted(GAME_CODE, /[{,]\s*t: ([^,}]+)/g);
// The messages the game builds by hand (not tick, plan and round: online.js's encoders make those, and the
// samples are theirs): each one's fields, read from its object literal in the code, must be a sample's.
const ENCODED = ['tick', 'plan', 'round'];
const topLevel = body => { // (the keys of an object literal's body: commas at depth 0)
  const keys = [];
  let depth = 0, part = '';
  for (const ch of body + ',') {
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) depth--;
    if (ch === ',' && !depth) { const m = part.match(/^\s*(\w+)\s*(?::|$)/); if (m) keys.push(m[1]); part = ''; } else part += ch;
  }
  return keys.sort().join(',');
};
for (const m of GAME_CODE.matchAll(/\{ t: ([^,}]+)((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g)) {
  const keys = topLevel('t' + m[2]);
  for (const t of words(m[1])) {
    if (ENCODED.includes(t)) continue;
    if (!SAMPLES.some(x => x.t === t && Object.keys(x).sort().join(',') === keys)) { console.error(`the game sends a ${t} message with ${keys}, and no sample here has those fields: update protocolSamples`); process.exit(1); }
  }
}
const sampledT = new Set(SAMPLES.map(m => m.t)), sampledE = new Set(SAMPLES.find(m => m.t === 'tick').e.map(e => e[0]));
const differ = (what, x, y) => { const d = [...x].filter(k => !y.has(k)); if (d.length) { console.error(`${what}: ${d.join(', ')}`); process.exit(1); } };
differ('messages sent but not sampled here (add one to protocolSamples)', sentT, sampledT);
differ('messages sampled but not typed in online.js or net.js (add a @typedef)', sampledT, typedT);
differ('messages typed but not sampled here (add one to protocolSamples)', typedT, sampledT);
differ('events the engine makes but not sampled here (add one to protocolSamples)', new Set(KINDS), sampledE);
differ('events sampled but not in online.js\'s EventRow type', sampledE, typedE);
differ('events in online.js\'s EventRow type but not sampled here', typedE, sampledE);
// The pin.
const pinned = fs.existsSync(PIN_FILE) ? JSON.parse(fs.readFileSync(PIN_FILE, 'utf8')) : null;
const changed = pinned ? [...new Set([...Object.keys(pinned.kinds), ...kindsNow])].filter(k => pinned.kinds[k] !== SHAPES[k]).sort() : kindsNow;
if (pinned && pinned.version === O.VERSION && changed.length) {
  console.error(`the message shapes changed, but online.js's VERSION is still ${O.VERSION}: bump it (an old friend's browser would misread these), then refresh the pin with node tools/online-test.js --pin. Changed: ${changed.map(k => `${k} (was ${pinned.kinds[k] ?? 'none'}, now ${SHAPES[k] ?? 'gone'})`).join('; ')}`);
  process.exit(1);
}
if (args.includes('--pin')) {
  fs.writeFileSync(PIN_FILE, JSON.stringify({ version: O.VERSION, fingerprint: FINGERPRINT, kinds: Object.fromEntries(kindsNow.map(k => [k, SHAPES[k]])) }, null, 2) + '\n');
  console.log(`pinned: protocol ${O.VERSION}, shapes ${FINGERPRINT} (${kindsNow.length} kinds${pinned ? `; changed: ${changed.join(', ') || 'none'}` : ''})`);
} else if (!pinned || pinned.version !== O.VERSION || pinned.fingerprint !== FINGERPRINT) {
  console.error(`the pin (tools/protocol-shapes.json) records protocol ${pinned?.version ?? 'none'}, and online.js's VERSION is ${O.VERSION}: refresh it with node tools/online-test.js --pin`);
  process.exit(1);
}

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
// Nor do squashes that name no snake or no cell on the board.
bad.e = [['squash', 'x', 1, 1], ['squash', 1, -1, 1], ['squash', 1, 1, E.GRID], ['squash', 9, 1, 1], ['squash', 1, 3, 5]];
O.apply(g, bad, E.DIRS);
if (g.events.length !== 1 || g.events[0].x !== 3 || g.events[0].y !== 5) { console.error('a malformed squash got through', JSON.stringify(g.events.map(e => [e.type, e.x, e.y]))); process.exit(1); }
// Nor digs, dives, knocks, burrows opening or closing over off the board or of a kind that doesn't exist (a
// knock lands on the board, or nowhere: both or neither), a dig that isn't till a tick, a beetle underground that
// came from no cell, a beetle digging in till no tick, or a burrow that isn't one (off the board, or not opened on a tick).
bad.e = [['dig', 1, 1, 'soon'], ['dig', -1, 1, 5], ['dive', 1, E.GRID, 1], ['knock', 99, 1, 1, 2, 2, 0], ['knock', 0, 1, 1, E.GRID, 1, 0], ['knock', 0, 1, 1, 2, null, 0], ['knock', 0, 1, 1, -1, -1, 0],
  ['knock', 0, 1, 1, null, null, 0], ['dig', 2, 3, 40], ['dive', 2, 3, 1], ['knock', 4, 5, 6, 7, 8, 1], ['burrow', E.GRID, 1, 1], ['heal', 1, 'x'], ['burrow', 3, 4, 1], ['heal', 5, 6],
  ['shut', 1, E.GRID, 50], ['shut', 1, 2, 'soon'], ['shut', 6, 7, 8000],
  ['knock', 3, 1, 2, 3, 4, 0, '#abc']];
bad.bu = [[1, 2], [1, 2, 3, 'x', 0], [4, 5, 6, 700, 1], [999, -5, 1.5, 700, 1], [2.5, 3, 4, 700, 0], [5, E.GRID, 7, 700, 0], [5, 6, 7.5, 700, 0], [7, 8, 9, -1, 0], [9, 9, 9, 700, 0, 800, 9800], [10, 10, 9, 700, 0, 900, 800]]; // (two short or not numbers, one off the board, one not on a cell, one past the edge, one not opened on a tick; one growing shut, one shutting before it started: open)
bad.un = [['x'], [1, 2, -5, 0], [1, 2, E.GRID * E.GRID, 0], [5, 9, 30, 1]];
bad.f = [[3, 3, 4, 100, 0, 0, -1, -1, 0, 0, 0, 'soon']];
O.apply(g, bad, E.DIRS);
const kept = JSON.stringify(g.events.map(e => ({ ...e })));
if (kept !== JSON.stringify([{ type: 'knock', kind: 'food', x: 1, y: 1, tx: null, ty: null }, { type: 'dig', x: 2, y: 3, until: 40 }, { type: 'dive', x: 2, y: 3, dug: 1 }, { type: 'knock', kind: 'beetle', x: 5, y: 6, tx: 7, ty: 8, gold: 1 }, { type: 'burrow', x: 3, y: 4, dug: 1 }, { type: 'heal', x: 5, y: 6 }, { type: 'shut', x: 6, y: 7, at: 8000 }, { type: 'knock', kind: 'pellet', x: 1, y: 2, tx: 3, ty: 4, color: '#abc' }])
  || JSON.stringify(g.burrows) !== JSON.stringify([{ x: 4, y: 5, at: 6, used: 700, dug: 1 }, { x: 7, y: 8, at: 9 }, { x: 9, y: 9, at: 9, used: 700, shutFrom: 800, shutAt: 9800 }, { x: 10, y: 10, at: 9, used: 700 }])
  || JSON.stringify(g.unders) !== JSON.stringify([{ until: 5, expires: 9, from: 30, gold: true }]) || 'digUntil' in g.food[0]) { console.error('a malformed dig, dive, knock, burrow, beetle underground or digging got through', kept, JSON.stringify(g.unders), JSON.stringify(g.food), JSON.stringify(g.burrows)); process.exit(1); }
// Nor the woodpecker's promised landings off the board, or that aren't a cell and a cell (or nowhere, -1); none at all: no landings.
bad.e = [];
bad.w = [12, 0, 1000, [300, 301], 40, [], -1, 0, 0, [[300, 302], [301], [-5, 2], [301, E.GRID * E.GRID], 'x', [301, 1.5], [301, -1]]];
O.apply(g, bad, E.DIRS);
const promised = JSON.stringify(g.woodpecker?.landings);
bad.w = [12, 0, 1000, [300, 301], 40, [], -1, 0, 0, [[-1, 4], 'x']];
O.apply(g, bad, E.DIRS);
if (promised !== JSON.stringify([[300, 302], [301, -1]]) || 'landings' in g.woodpecker) { console.error('malformed landings got through', promised, JSON.stringify(g.woodpecker)); process.exit(1); }

// A guest's press the host can't use (an unknown power, a made-up direction) is refused.
if (O.POWERS.includes('dash') || O.POWERS.includes(undefined) || O.DIR_NAMES.includes('ahead')) { console.error('a bad press got through'); process.exit(1); }

const n = key => seen.get(key) || 0, stagedAll = [...staged.values()].reduce((a, b) => a + b, 0);
console.log(`ok: ${rounds} rounds (seed ${SEED}), ${ticks} ticks, ${checks} checks, guest matched the host every tick (${presses} power presses, ${n('dash plain')} plain flashes, ${plans} plans, ${n('squash')} squashes, ${n('crash failed')} failed flashes, ${n('dig')} digs, ${n('knock')} knocks, ${n('shut')} burrows growing shut, ${n('heal')} closing over, ${eaten} things eaten); biggest message ${biggest} bytes`);
console.log(`ok: crossed, ${MIN} times at least: all ${KINDS.length} kinds of event and all they say, all ${FIELDS.length} fields of a snake, its ${LOOKS.length} looks, the food, the woodpecker, fire and weather (${seen.size} things in all; ${stagedAll} events staged: ${[...staged].map(([k, v]) => `${k} ${v}`).join(', ') || 'none'})`);
console.log(`ok: all ${SAMPLES.length} kinds of message round-trip unchanged, as typed; their shapes match the pin (protocol ${O.VERSION}, shapes ${FINGERPRINT}, ${kindsNow.length} kinds)`);
console.log(`ok: crossed, once at least: all ${FATAL.length} ways to be out (${FATAL.map(k => `${k} ${n(`death fatal ${k}`)}`).join(', ')}; staged on boards of their own: ${deathsStaged.join(', ') || 'none'})`);
