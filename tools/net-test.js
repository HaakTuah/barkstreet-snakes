#!/usr/bin/env node
// Checks net.js's connections without a network: net.js runs in Node with a stand-in for PeerJS that plays each
// way a room can be reached or not, and the card's words must name which part failed, finding each other (the
// broker, or no room behind the code) or the route between the browsers. Its clock runs a hundred times fast.
// That the real PeerJS file and broker work is shown by an online round on the PR's preview, not here.
//
//   node tools/net-test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ok = require('./ok.js');

const FAST = 100;
const code = fs.readFileSync(path.join(__dirname, '..', 'net.js'), 'utf8');

// A stand-in for PeerJS: what each Peer and connection does is set by the plan of the case at hand.
const emitter = () => {
  const on = new Map();
  return {
    on(e, f) { (on.get(e) || on.set(e, []).get(e)).push(f); },
    once(e, f) { const g = (...a) => { this.off(e, g); f(...a); }; g.f = f; this.on(e, g); },
    off(e, f) { on.set(e, (on.get(e) || []).filter(g => g !== f && g.f !== f)); },
    emit(e, ...a) { for (const f of [...(on.get(e) || [])]) f(...a); },
  };
};
let plan = {};
const later = (f, ms) => setTimeout(f, ms / FAST);
function Peer(id) {
  const peer = Object.assign(emitter(), { id: typeof id === 'string' ? id : 'guest1', destroyed: false });
  peer.destroy = () => { peer.destroyed = true; };
  peer.reconnect = () => {};
  peer.connect = () => {
    const conn = Object.assign(emitter(), { peer: 'host', open: false, sent: [] });
    conn.send = m => conn.sent.push(m);
    conn.close = () => {};
    later(() => plan.connect?.(peer, conn), 10);
    return conn;
  };
  later(() => plan.open ? plan.open(peer) : peer.emit('open'), 10);
  return peer;
}
const window = { Peer };
vm.runInNewContext(code, {
  window, console, performance,
  setTimeout: later, clearTimeout, setInterval: (f, ms) => setInterval(f, ms / FAST), clearInterval,
});
const Net = window.SnakeNet;

/** What joining does, under a plan: the card's words if it fails, or 'joined'. */
async function join(p) {
  plan = p;
  try { const room = await Net.join('MOSSY', { onMessage() {}, onLost() {} }); room.close(); return 'joined'; } catch (err) { return err.message; }
}
const finding = /^Couldn’t find each other|^There’s no room/, route = /^Found the room, but couldn’t connect/;

(async () => {
  ok(await join({ connect: (_, c) => { c.open = true; c.emit('open'); } }) === 'joined', 'a room that answers is joined');

  const broker = await join({ open: peer => peer.emit('error', { type: 'network' }) });
  ok(finding.test(broker) && /service that introduces players/.test(broker), 'the broker out of reach: finding each other failed', broker);
  const late = await join({ open: () => {} });
  ok(finding.test(late) && /service that introduces players/.test(late), 'the broker never answering: finding each other failed', late);
  const none = await join({ connect: peer => peer.emit('error', { type: 'peer-unavailable' }) });
  ok(/^There’s no room with that code/.test(none), 'no room behind the code: says so', none);
  const silent = await join({ connect: () => {} });
  ok(finding.test(silent) && /room didn’t answer/.test(silent), 'a room that never answers: finding each other failed', silent);

  const t0 = performance.now();
  const failed = await join({ connect: (_, c) => { c.emit('iceStateChanged', 'checking'); later(() => c.emit('iceStateChanged', 'failed'), 100); } });
  const took = (performance.now() - t0) * FAST;
  ok(route.test(failed) && took < 5000, 'a room that answered, but no route through: the route failed, said at once rather than at the time limit', `${failed} (after ${Math.round(took)} ms of game time)`);
  const stuck = await join({ connect: (_, c) => c.emit('iceStateChanged', 'checking') });
  ok(route.test(stuck), 'a room that answered, with routes tried till time ran out: the route failed', stuck);

  plan = { open: peer => peer.emit('error', { type: 'server-error' }) };
  let hosted;
  try { await Net.host({ newCode: () => 'MOSSY', onLeave() {}, onMessage() {} }); hosted = 'hosted'; } catch (err) { hosted = Net.explain(err); }
  ok(finding.test(hosted), 'hosting with the broker out of reach: finding each other failed', hosted);
  process.exit(0);
})();
