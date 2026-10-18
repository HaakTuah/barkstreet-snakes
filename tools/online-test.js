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
// changed, the food's, the woodpecker's, fire's, the weather's), each at
// least MIN times. What the rounds don't bring often enough is staged now
// and then, as the engine makes it (a choke and its cough, a fire put out, a
// beetle flown off, a snake alight...), so nothing goes unchecked, and a new
// event or field fails here until it's sent and crosses.
// Every message must fit PeerJS's 16 KB limit, and a guest must shrug off a
// malformed one.
//
//   node tools/online-test.js [rounds] [--seed N]
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
// Every kind of event the engine makes (each must cross).
const KINDS = [...new Set([...fs.readFileSync(path.join(ROOT, 'engine.js'), 'utf8').matchAll(/events\.push\(\{ type: '(\w+)'/g)].map(m => m[1]))].sort();
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
const FIELDS = ['alive', 'dir', 'eaten', 'lastAte', 'nextStarve', 'cells', 'memory', 'autopilot', 'stunUntil', 'burnUntil', 'burnFrom', 'leaps', 'leapArmed', 'dashes', 'leapReadyAt', 'wrapUntil', 'flight', 'flashReadyAt', 'flashArmed', 'mealMs', 'coughUntil'];
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
  for (const f of msg.fi) cross(`fire ${FIRES[f[3]]}`);
  cross(`weather ${msg.sky[0]}`);
  for (const e of events) {
    cross(e.type);
    for (const [k, v] of Object.entries(e)) if (k !== 'type' && !blank(v)) cross(`${e.type} ${k === 'snake' ? 'snake' : k}`);
    if (e.type === 'death') for (const k of ['cause', 'killer', 'killerId', 'diedAt', 'fatal']) if (!blank(e.snake[k])) cross(`death ${k}`);
  }
}
// (Deaths come as they come, never staged: what one says, once at least.)
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

// Staged now and then, as the engine makes them (what's still short of MIN,
// once the rounds before have had their go): a choke (a snake's head on its
// own bead, spat a cell aside or left where it is, and a cough) and a nudge
// a few ticks into the cough (something its head reached, rolled aside: an
// apple, a beetle scurrying, a bead); golden powers held, a look, the rarer
// food, a golden beetle, a snake alight, food cooking, a spell of weather
// (a storm: lightning, fire, embers); and every other kind of event, at a
// living snake's head (s; o, another), each of the ways it can come. One a
// tick, at most.
const NUDGED = ['food', 'beetle', 'pellet', 'golden'];
const EVENTS = (s, o, h, k) => {
  const at = { x: h.x, y: h.y };
  return {
    eat: [{ snake: s, kind: 'pellet', ...at, color: o.color, cooked: true, gold: false }, { snake: s, kind: 'beetle', ...at, cooked: false, gold: true }],
    leap: [{ snake: s, ...at, gold: 1, reach: 2 }], dash: [{ snake: s, ...at, n: 1, plain: 1 }, { snake: s, ...at, n: 3 }],
    fizzle: [{ snake: s, why: 'resting', ...at, flash: 1 }, { snake: s, why: 'landing', ...at, flash: 0 }],
    crash: [{ snake: s, ...at, cause: `crashed into ${o.name}`, killer: o.name, killerId: o.id, lost: 3 }], cut: [{ snake: s, ...at, lost: 2, by: o.id }],
    alight: [{ snake: s }], singe: [{ snake: s }], starving: [{ snake: s }],
    spawn: [{ kind: 'beetle', ...at, gold: true }, { kind: 'golden', ...at }, { kind: 'leaf', ...at }, { kind: 'goldcap', ...at }],
    weather: [{ kind: ['sun', 'wind', 'rain', 'storm', 'snow'][k % 5] }], ember: [{ ...at, fx: Math.max(0, h.x - 1), fy: h.y }], woodpecker: [{}],
    peck: [{ ...at, cells: [h.y * E.GRID + h.x], under: [s.id] }], rot: [{ ...at, kind: 'apple' }, { ...at, kind: 'pellet', color: o.color }],
    baked: [{ ...at, kind: 'food' }], ash: [{ ...at, kind: 'pellet' }],
    choke: [{ snake: s, ...at, tx: Math.max(0, h.x - 1), ty: h.y }], nudge: [{ snake: s, kind: 'food', ...at, tx: Math.min(E.GRID - 1, h.x + 1), ty: h.y }],
  };
};
const WEATHER = ['clear', 'sun', 'wind', 'rain', 'storm', 'snow'], FIRES = ['burning', 'struck', 'ember']; // (online.js's orders)
// (A free cell, nearest the middle: nobody's body, no food, no hole.)
const free = game => {
  const taken = new Set([...game.holes, ...game.food.map(f => f.y * E.GRID + f.x), ...game.snakes.flatMap(s => s.alive ? s.body.map(c => c.y * E.GRID + c.x) : [])]);
  for (let d = 0; d < E.GRID; d++) for (let y = 0; y < E.GRID; y++) for (let x = 0; x < E.GRID; x++) if (Math.max(Math.abs(x - E.GRID / 2), Math.abs(y - E.GRID / 2)) <= d && !taken.has(y * E.GRID + x)) return { x, y };
  return null;
};
function stage(game) {
  const live = game.snakes.filter(s => s.alive), k = game.tick;
  if (live.length < 2 || game.events.some(e => e.type === 'choke' || e.type === 'nudge')) return;
  const s = live[k % live.length], o = live[(k + 1) % live.length], h = s.body[0];
  const side = (k >> 4) % 3, tx = side === 2 ? h.x : Math.max(0, Math.min(E.GRID - 1, h.x + (side ? 1 : -1))); // (side 2: it stayed put, under the head)
  const cougher = live.find(c => c.coughUntil > k);
  const add = e => { game.events.push(e); staged.set(e.type, (staged.get(e.type) || 0) + 1); };
  const nudges = ['nudge', 'nudge kind', 'nudge tx', 'nudge ty'];
  if (k % 41 === 0 && ['choke', 'choke tx', 'choke ty', 'snake coughUntil', ...nudges].some(short)) { add({ type: 'choke', snake: s, x: h.x, y: h.y, tx, ty: h.y }); s.coughUntil = k + T.COUGH_TICKS; return; } // (a nudge wants a cough first)
  if (k % 41 === 3 && cougher && nudges.some(short)) { const c = cougher.body[0]; add({ type: 'nudge', snake: cougher, kind: NUDGED[(k >> 3) % NUDGED.length], x: c.x, y: c.y, tx: Math.min(E.GRID - 1, c.x + 1), ty: c.y }); return; }
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
  if (short('snake burnUntil') || short('snake burnFrom')) { s.burnFrom = k; s.burnUntil = k + 6; return; } // (as fire sets it alight)
  const apple = game.food.find(f => f.kind === 'food' && !f.heat);
  if (apple && (short('food food 5') || short('food food 6'))) { apple.heat = 2; if (k % 2) apple.cooked = 1; return; } // (food in the fire: warming, then baked)
  const sky = [1, 2, 3, 4, 5].find(w => short(`weather ${w}`) || (w === 4 && FIRES.some(f => short(`fire ${f}`))));
  if (sky && !E.suddenDeath(game) && game.weather.kind === 'clear') { game.weather = { kind: WEATHER[sky], since: game.time, until: game.time + 8000, nextGust: game.time + 600, nextStrike: game.time + 1200 }; return; } // (a spell, as the sky brings them)
  const ev = EVENTS(s, o, h, k);
  for (const kind of KINDS) {
    if (kind === 'death' || kind === 'choke' || kind === 'nudge') continue; // (deaths come as they come; chokes and nudges above)
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
    check(r, k, 'tick/time', [host.tick, host.time], [guest.tick, guest.time]);
    check(r, k, 'bodies', host.snakes.map(s => s.alive ? s.body : null), guest.snakes.map(s => s.alive ? s.body : null));
    check(r, k, 'alive', host.snakes.map(s => s.alive), guest.snakes.map(s => s.alive));
    check(r, k, 'dirs', host.snakes.map(s => s.dir), guest.snakes.map(s => s.dir));
    check(r, k, 'hunger', host.snakes.map(s => [s.eaten, s.lastAte, s.nextStarve, s.mealMs]), guest.snakes.map(s => [s.eaten, s.lastAte, s.nextStarve, s.mealMs]));
    const powers = g => g.snakes.map(s => [s.stunUntil, s.burnUntil, s.burnFrom, s.leaps, s.leapArmed, s.dashes, s.leapReadyAt, s.wrapUntil, s.flight ? s.flight.dir : null, s.flashReadyAt, s.flashArmed, s.coughUntil ?? -1, !!s.autopilot]);
    check(r, k, 'stuns, burns, powers and coughs', powers(host), powers(guest));
    const food = g => g.food.map(f => [f.x, f.y, f.kind, f.expires, f.color, f.dir && f.kind === 'beetle' ? f.dir : null, f.px ?? null, f.py ?? null, f.movedAt ?? null, !!f.scared, f.heat || 0, !!f.cooked, !!f.gold, f.owner ?? null]);
    check(r, k, 'food', food(host), food(guest));
    check(r, k, 'holes', [...host.holes], [...guest.holes]);
    check(r, k, 'woodpecker', host.woodpecker, guest.woodpecker);
    check(r, k, 'burrows', host.burrows, guest.burrows);
    check(r, k, 'fire', [...host.fires].map(([c, f]) => [c, f.from, f.until, f.strike, f.group, !!f.ember]), [...guest.fires].map(([c, f]) => [c, f.from, f.until, f.strike, f.group, !!f.ember]));
    check(r, k, 'weather', [host.weather.kind, host.weather.since, host.weather.until], [guest.weather.kind, guest.weather.since, guest.weather.until]);
    check(r, k, 'deaths', dyingHost.map(s => [s.id, s.cause, s.killer, s.killerId, s.diedAt, s.fatal || null]), dyingGuest.map(s => [s.id, s.cause, s.killer, s.killerId, s.diedAt, s.fatal || null]));
    check(r, k, 'events', host.events.map(said), guest.events.map(said));
    const look = g => g.snakes.map(s => LOOKS.map(f => s.memory[f] ?? null));
    check(r, k, 'looks', look(host), look(guest));
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

// Everything crossed, MIN times at least: every kind of event and all it
// said, every field of a tick and every look.
// (What each kind of event says, in all its ways of coming, as staged; the
// ones that only say where, where; a death, what the snake does.)
const ways = EVENTS({ id: 1, color: '#fff', name: 'S' }, { id: 2, color: '#000', name: 'O' }, { x: 1, y: 1 }, 1);
const says = KINDS.filter(k => k !== 'death').flatMap(k => [...new Set((ways[k] || [{ x: 1, y: 1 }]).flatMap(w => Object.keys(w).filter(f => !blank(w[f]))))].map(f => `${k} ${f}`));
const want = [...KINDS, ...says, ...['snake', 'cause', 'killer', 'diedAt', 'fatal'].map(f => `death ${f}`), ...FIELDS.map(f => `snake ${f}`), ...LOOKS.map(f => `memory ${f}`), 'holes', 'burrows',
  ...['food', 'golden', 'mushroom', 'pellet', 'beetle', 'leaf', 'goldcap'].flatMap(k => [`food ${k}`, `food ${k} 3`]), // (each kind, and when it goes)
  'food food 5', 'food food 6', 'food pellet 4', 'food pellet 7', ...[5, 6, 7, 8, 9, 10].map(j => `food beetle ${j}`), // (warming and baked; a bead's colour and whose; a beetle's way, where from, when it moved, scared, golden)
  ...FIRES.map(k => `fire ${k}`),
  ...WEATHER.map((w, k) => `weather ${k}`), ...Array.from({ length: 9 }, (_, j) => `woodpecker ${j}`), ...['way', 'jump', 'flash'].flatMap(k => [`plan rival ${k}`, `plan person ${k}`])];
const lacking = [...new Set(want)].filter(short).map(k => `${k} (${seen.get(k) || 0})`);
if (process.env.ONLINE_SEEN) console.log([...seen].sort().map(([k, v]) => `${k}: ${v}`).join('\n'));
if (lacking.length) { console.error(`seen too few times (fewer than ${MIN}; a death's, never), the test lost its point there: ${lacking.join(', ')}`); process.exit(1); }

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

const n = key => seen.get(key) || 0, stagedAll = [...staged.values()].reduce((a, b) => a + b, 0);
console.log(`ok: ${rounds} rounds (seed ${SEED}), ${ticks} ticks, ${checks} checks, guest matched the host every tick (${presses} power presses, ${n('dash plain')} plain flashes, ${plans} plans, ${n('choke')} chokes and ${n('nudge')} nudges, ${eaten} things eaten); biggest message ${biggest} bytes`);
console.log(`ok: crossed, ${MIN} times at least: all ${KINDS.length} kinds of event and all they say, all ${FIELDS.length} fields of a snake, its ${LOOKS.length} looks, the food, the woodpecker, fire and weather (${seen.size} things in all; ${stagedAll} events staged: ${[...staged].map(([k, v]) => `${k} ${v}`).join(', ') || 'none'})`);
