#!/usr/bin/env node
// Checks the online connections, each way in, without a network.
// First net.js runs in Node with stand-ins for PeerJS and for the relays (net-relays.js), each playing a way a room
// can be reached or not: a friend tries the broker first and the relays once it can't find the room or has had its
// head start; a room opens on both and is hosted on whichever answers; and the card's words name the part that
// failed, finding each other (no service answered, no room behind the code, or a room that never answered) or the
// route between the browsers. Its clock runs a hundred times fast.
// Then net-relays.js runs for real in headless Chrome (tools/browser.js): its signing against BIP-340's own test
// vectors, and the online round trip through the relays, a host and a friend in two windows of the game
// (?way=relays) with a stand-in for the relays between them: the friend joins by the code, the round starts, the
// friend's board follows the host's ticks and the host times the friend's pongs, a code sharing the room's topic
// can't get in, and the friend leaves; and the handshake's keys (the same code agrees, another doesn't).
// That the real relays, PeerJS's file and its broker work is shown on the PR's preview (?way=relays and ?way=broker),
// not here: no suite reaches the network.
//
//   node tools/net-test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ok = require('./ok.js');
const { launch, serve } = require('./browser');

const FAST = 100;
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'net.js'), 'utf8');

const emitter = () => {
  const on = new Map();
  return {
    on(e, f) { (on.get(e) || on.set(e, []).get(e)).push(f); },
    once(e, f) { const g = (...a) => { this.off(e, g); f(...a); }; g.f = f; this.on(e, g); },
    off(e, f) { on.set(e, (on.get(e) || []).filter(g => g !== f && g.f !== f)); },
    emit(e, ...a) { for (const f of [...(on.get(e) || [])]) f(...a); },
  };
};
const later = (f, ms) => setTimeout(f, ms / FAST);
// A channel as both ways give one (PeerJS's DataConnection, net-relays.js's channel).
const channel = peer => {
  const conn = Object.assign(emitter(), { peer, open: false, closed: false, sent: [] });
  conn.send = m => conn.sent.push(m);
  conn.close = () => { if (conn.closed) return; conn.closed = true; conn.open = false; conn.emit('close'); };
  conn.opens = () => { conn.open = true; conn.emit('open'); };
  return conn;
};

// What each way does is set by the plan of the case at hand: plan.open(peer) and plan.connect(peer, conn) for the
// broker; plan.relays, the relays' answer to a friend (a channel that opens, or a failure's type) after plan.relaysMs,
// and plan.listen, theirs to a host. calls counts what was asked of each.
let plan = {}, calls = {};
function Peer(id) {
  const peer = Object.assign(emitter(), { id: typeof id === 'string' ? id : 'guest1', destroyed: false });
  calls.broker = [...(calls.broker || []), peer.id];
  peer.destroy = () => { peer.destroyed = true; };
  peer.reconnect = () => {};
  peer.connect = () => {
    const conn = channel('host');
    later(() => plan.connect?.(peer, conn), 10);
    return conn;
  };
  later(() => plan.open ? plan.open(peer) : peer.emit('open'), 10);
  return peer;
}
const Relays = {
  connect(name, _ice, _ms, stop) {
    calls.relays = [...(calls.relays || []), name];
    stop?.addEventListener('abort', () => { calls.relaysStopped = true; });
    return new Promise((resolve, reject) => later(() => {
      const r = plan.relays || 'unreachable';
      if (typeof r === 'string') return reject({ type: r });
      resolve({ id: 'relay-0123456789abcdef', conn: r });
      later(() => r.opens(), 10);
    }, plan.relaysMs ?? 100));
  },
  listen(name, _ice, onConnection) {
    calls.listen = [...(calls.listen || []), name];
    return new Promise((resolve, reject) => later(() => {
      if (plan.listen !== 'ok') return reject({ type: 'unreachable' });
      calls.onConnection = onConnection;
      resolve({ close() { calls.listenClosed = (calls.listenClosed || 0) + 1; } });
    }, 1000)); // (the relays open the room slower than the broker: a second for the keys and the sockets)
  },
};
const window = { Peer, SnakeRelays: Relays };
vm.runInNewContext(code, {
  window, console, performance, AbortController,
  setTimeout: later, clearTimeout, setInterval: (f, ms) => setInterval(f, ms / FAST), clearInterval,
});
const Net = window.SnakeNet;

/** Joining under a plan: { said: the card's words, or 'joined'; id; took: game time, ms }. */
async function join(p) {
  plan = p; calls = {};
  const t0 = performance.now();
  try {
    const room = await Net.join('MOSSY', { onMessage() {}, onLost() {} });
    const took = (performance.now() - t0) * FAST;
    room.close();
    return { said: 'joined', id: room.id, took };
  } catch (err) { return { said: err.message, took: (performance.now() - t0) * FAST }; }
}
/** Hosting under a plan: { said: the card's words, or 'hosted'; room }. */
async function host(p, codes = ['MOSSY']) {
  plan = p; calls = { joins: [], messages: [] };
  let n = 0;
  try {
    const room = await Net.host({ newCode: () => codes[Math.min(n++, codes.length - 1)], onJoin: id => calls.joins.push(id), onLeave() {}, onMessage: (id, m) => calls.messages.push([id, m]) });
    return { said: 'hosted', room };
  } catch (err) { return { said: Net.explain(err) }; }
}
const opens = (_, c) => c.opens();
const services = /^Couldn’t find each other: none of the services that introduce players answered/;
const noRoom = /^There’s no room with that code/, silent = /^Couldn’t find each other: the room didn’t answer/;
const route = /^Found the room, but couldn’t connect/;
const fails = (peer, type) => peer.emit('error', { type });

async function inNode() {
  let r = await join({ connect: opens });
  ok(r.said === 'joined' && !calls.relays, 'a room the broker reaches is joined through it, the relays left alone');

  r = await join({ open: peer => fails(peer, 'network') });
  ok(services.test(r.said) && calls.relays?.[0] === 'barkbite-mossy', 'the broker and the relays out of reach: finding each other failed, both tried', r.said);
  r = await join({ open: () => {} });
  ok(services.test(r.said) && calls.relays, 'the broker never answering and the relays out of reach: finding each other failed', r.said);
  r = await join({ connect: peer => fails(peer, 'peer-unavailable'), relays: 'unanswered' });
  ok(noRoom.test(r.said) && r.took < 3000, 'no room on the broker, none answering on the relays: no room with that code, said at once', `${r.said} (${Math.round(r.took)} ms)`);
  r = await join({ connect: () => {}, relays: 'unanswered' });
  ok(silent.test(r.said), 'a room silent on both ways: finding each other failed', r.said);

  r = await join({ connect: (_, c) => { c.emit('iceStateChanged', 'checking'); later(() => c.emit('iceStateChanged', 'failed'), 100); } });
  ok(route.test(r.said) && r.took < 3000 && !calls.relays, 'a room that answered, but no route through: the route failed, said at once, the relays not tried (their route is the same)', `${r.said} (${Math.round(r.took)} ms)`);
  r = await join({ connect: (_, c) => c.emit('iceStateChanged', 'checking'), relays: 'unanswered' });
  ok(route.test(r.said), 'a room that answered, with routes tried till time ran out: the route failed', r.said);

  r = await join({ connect: peer => fails(peer, 'peer-unavailable'), relays: channel('host') });
  ok(r.said === 'joined' && r.id.startsWith('relay-') && r.took < 3000, 'no room on the broker, but on the relays: joined through them, at once', `${r.said} ${r.id} (${Math.round(r.took)} ms)`);
  r = await join({ open: peer => fails(peer, 'server-error'), relays: channel('host') });
  ok(r.said === 'joined' && r.id.startsWith('relay-'), 'the broker out of reach: joined through the relays', r.said);
  r = await join({ open: () => {}, relays: channel('host') });
  ok(r.said === 'joined' && r.id.startsWith('relay-') && r.took >= 4000 && r.took < 8000, 'the broker hanging: joined through the relays after the broker’s head start', `${r.said} (${Math.round(r.took)} ms)`);
  r = await join({ open: peer => later(() => peer.emit('open'), 4500), connect: opens, relays: channel('host'), relaysMs: 3000 });
  ok(r.said === 'joined' && !r.id.startsWith('relay-') && calls.relaysStopped, 'the broker connecting after its head start: joined through it, the relays’ try stopped', `${r.said} ${r.id}`);
  const late = channel('host');
  r = await join({ connect: (_, c) => later(() => c.opens(), 6000), relays: late, relaysMs: 200 });
  ok(r.said === 'joined' && r.id.startsWith('relay-'), 'both ways under way: the first open wins', r.said);

  let h = await host({ open: peer => fails(peer, 'server-error') });
  ok(services.test(h.said) && calls.listen?.length === 1, 'hosting with the broker and the relays out of reach: finding each other failed', h.said);
  h = await host({ listen: 'ok' });
  ok(h.said === 'hosted' && h.room.code === 'MOSSY' && calls.broker[0] === 'barkbite-mossy' && calls.listen[0] === 'barkbite-mossy', 'a room opens on the broker and the relays at once, under one name');
  h.room.close();
  await new Promise(r => later(r, 2000));
  ok(calls.listenClosed === 1, 'closing the room closes it on the relays too, even while they were still opening it');
  h = await host({ open: peer => fails(peer, 'network'), listen: 'ok' });
  ok(h.said === 'hosted', 'the broker out of reach: the room opens on the relays', h.said);
  const friend = channel('relay-fedcba9876543210');
  calls.onConnection(friend);
  friend.opens();
  friend.emit('data', { t: 'hello' });
  ok(calls.joins[0] === 'relay-fedcba9876543210' && calls.messages[0]?.[1]?.t === 'hello', 'a friend who came by the relays joins the room and is heard, as one by the broker');
  h.room.close();
  h = await host({ open: peer => peer.id === 'barkbite-mossy' ? fails(peer, 'unavailable-id') : peer.emit('open'), listen: 'ok' }, ['MOSSY', 'K7QXM']);
  await new Promise(r => later(r, 2000));
  ok(h.said === 'hosted' && h.room.code === 'K7QXM' && calls.listen.join() === 'barkbite-mossy,barkbite-k7qxm' && calls.listenClosed === 1, 'a code the broker says is taken: a new one, on both ways', `${h.said} ${h.room?.code} ${calls.listen}`);
  h.room.close();
  h = await host({ open: peer => later(() => peer.id === 'barkbite-mossy' ? fails(peer, 'unavailable-id') : peer.emit('open'), 2500), listen: 'ok' }, ['MOSSY', 'K7QXM']);
  ok(h.said === 'hosted' && h.room.code === 'K7QXM', 'a code the broker says is taken after the relays opened it: still replaced, never shown', `${h.said} ${h.room?.code}`);
  h.room.close();
  h = await host({ open: () => {}, listen: 'ok' });
  ok(h.said === 'hosted' && h.room.code === 'MOSSY', 'the broker hanging: the room opens on the relays once the broker has had its time');
  h.room.close();
  h = await host({});
  ok(h.said === 'hosted', 'the relays out of reach: the room opens on the broker');
  h.room.close();
}

// A stand-in for every relay at once, in the host's window: sockets that speak Nostr's REQ and EVENT, passing each
// event to every subscription of its kind and topic (the relays' own checks of a signature are left to the preview).
const HUB = `(() => {
  const subs = [];
  return () => {
    const ws = { readyState: 0, onopen: null, onmessage: null, onclose: null,
      send(text) {
        const m = JSON.parse(text);
        if (m[0] === 'REQ') subs.push({ ws, sub: m[1], f: m[2] });
        if (m[0] !== 'EVENT') return;
        (window.relayed ||= new Set()).add(m[1].id); // (each note once, however many relays it went to)
        (window.posted ||= new Map()).set(m[1].id, m[1].content);
        for (const s of subs) if (s.ws.readyState === 1 && s.f.kinds.includes(m[1].kind) && m[1].tags.some(t => t[0] === 'x' && s.f['#x'].includes(t[1])))
          setTimeout(() => s.ws.onmessage?.({ data: JSON.stringify(['EVENT', s.sub, m[1]]) }), 5);
      },
      close() { ws.readyState = 3; setTimeout(() => ws.onclose?.({}), 0); } };
    setTimeout(() => { ws.readyState = 1; ws.onopen?.({}); }, 10);
    return ws;
  };
})()`;

async function inChrome() {
  const site = await serve(), b = await launch();
  try {
    await b.go(site.url + 'index.html?debug&way=relays', { settle: 0 });
    await b.ev(`new Promise(r => { const t = setInterval(() => { if (window.SnakeDebug && window.SnakeRelays) { clearInterval(t); r(); } }, 20); })`);
    // BIP-340's test vectors 0 to 3: secret key, public key's x, aux, message, signature.
    const vectors = `[
      ["0000000000000000000000000000000000000000000000000000000000000003", "F9308A019258C31049344F85F89D5229B531C845836F99B08601F113BCE036F9", "0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000", "E907831F80848D1069A5371B402410364BDF1C5F8307B0084C55F1CE2DCA821525F66A4A85EA8B71E482A74F382D2CE5EBEEE8FDB2172F477DF4900D310536C0"],
      ["B7E151628AED2A6ABF7158809CF4F3C762E7160F38B4DA56A784D9045190CFEF", "DFF1D77F2A671C5F36183726DB2341BE58FEAE1DA2DECED843240F7B502BA659", "0000000000000000000000000000000000000000000000000000000000000001", "243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89", "6896BD60EEAE296DB48A229FF71DFE071BDE413E6D43F917DC8DCF8C78DE33418906D11AC976ABCCB20B091292BFF4EA897EFCB639EA871CFA95F6DE339E4B0A"],
      ["C90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B14E5C9", "DD308AFEC5777E13121FA72B9CC1B7CC0139715309B086C960E18FD969774EB8", "C87AA53824B4D7AE2EB035A2B5BBBCCC080E76CDC6D1692C4B0B62D798E6D906", "7E2D58D8B3BCDF1ABADEC7829054F90DDA9805AAB56C77333024B9D0A508B75C", "5831AAEED7B44BB74E5EAB94BA9D4294C49BCF2A60728D8B4C200F50DD313C1BAB745879A5AD954A72C45A91C3A51D3C7ADEA98D82F8481E0E1E03674A6F3FB7"],
      ["0B432B2677937381AEF05BB02A66ECD012773062CF3FA2549E44F58ED2401710", "25D1DFF95105F5253C4022F628A996AD3A0D95FBF21D468A1B33F8C160D8F517", "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "7EB0509757E246F19449885651611CB965ECC1A187DD51B64FDA1EDC9637D5EC97582B9CB13DB3933705B32BA982AF5AF25FD78881EBB32771FC5922EFC66EA3"]
    ]`; // (written into the page's code as it stands: this file's own text)
    const signed = await b.ev(`(async () => {
      const bytes = h => Uint8Array.from(h.match(/../g), x => parseInt(x, 16));
      const out = [];
      for (const [sk, pk, aux, msg, sig] of ${vectors}) {
        const s = await SnakeRelays.sign(bytes(msg), BigInt('0x' + sk), bytes(aux));
        out.push(s.toUpperCase() === sig && SnakeRelays.times(BigInt('0x' + sk))[0].toString(16).padStart(64, '0').toUpperCase() === pk);
      }
      return out;
    })()`);
    ok(signed.length === 4 && signed.every(Boolean), 'the relays’ signatures match BIP-340’s own test vectors', JSON.stringify(signed));

    // The round trip: the host here, the friend in a window of its own, both on the stand-in.
    // (cond: this file's own code, waited for in the page; nothing from the page is ever built into code here)
    const until = (cond, ms = 30000) => b.ev(`new Promise((res, rej) => { const t0 = performance.now(); (function check() { let v; try { v = ${cond}; } catch {} if (v) return res(v); if (performance.now() - t0 > ${ms}) return rej(new Error('timed out')); setTimeout(check, 50); })(); })`)
      .catch(err => { throw new Error(`${err.message}, waiting for ${cond}`); });
    await b.ev(`window.hub = ${HUB}; SnakeRelays.useSockets(hub); window.friendWin = window.open('index.html?debug&way=relays'); 'ok'`);
    await until(`friendWin.SnakeDebug && friendWin.SnakeRelays && friendWin.document.readyState === 'complete'`);
    await b.ev(`friendWin.SnakeRelays.useSockets(hub); document.getElementById('friends').click(); document.getElementById('start').click(); 'ok'`);
    const roomCode = await until(`SnakeDebug.online()?.code`);
    ok(/^[A-Z0-9]{5}$/.test(roomCode), 'a room opens on the relays alone (?way=relays), with a code', roomCode);
    await b.ev(`friendWin.document.getElementById('friends').click(); friendWin.document.getElementById('lobby-code').value = SnakeDebug.online().code; friendWin.document.getElementById('lobby-join').requestSubmit(); 'ok'`);
    const joined = await until(`friendWin.SnakeDebug.online()?.role === 'guest' && SnakeDebug.online().players.length === 2 && SnakeDebug.online()`);
    ok(joined.players.length === 2, 'the friend joins by the code, through the relays, and the host’s lobby shows them', JSON.stringify(joined.players.map(p => p.name)));
    await b.ev(`document.getElementById('start').click(); 'ok'`);
    const ticks = await until(`friendWin.SnakeDebug.state() === 'running' && friendWin.SnakeDebug.game().tick >= 30 && SnakeDebug.online().rtt > 0 && [friendWin.SnakeDebug.game().tick, SnakeDebug.game().tick, SnakeDebug.online().rtt]`, 60000);
    ok(ticks[0] <= ticks[1], 'the round runs on the friend’s screen from the host’s ticks, and the host times the friend’s pongs', `friend at tick ${ticks[0]}, host at ${ticks[1]}, round trip ${Math.round(ticks[2])} ms`);
    const relayed = await b.ev(`window.relayed.size`);
    // A code in the same bucket as the room's (so its handshake reaches the room) but not the room's own: the room
    // shakes hands, but the friend's offer can't be opened, and the room never answers it.
    const wrong = await b.ev(`(async () => {
      const name = 'barkbite-' + SnakeDebug.online().code.toLowerCase(), { topic } = await SnakeRelays.roomOf(name);
      const C = 'abcdefghjkmnpqrstuvwxyz23456789';
      for (let i = 0; i < 200000; i++) {
        let code = ''; for (let n = i, k = 0; k < 5; k++, n = Math.floor(n / C.length)) code += C[n % C.length];
        if ('barkbite-' + code !== name && (await SnakeRelays.roomOf('barkbite-' + code)).topic === topic) return 'barkbite-' + code;
      }
    })()`);
    const refused = await b.ev(`friendWin.SnakeRelays.connect(${JSON.stringify(wrong)}, [], 8000).then(r => (r.conn.close(), 'joined'), e => e.type)`);
    ok(refused === 'unanswered', 'a code that shares the room’s topic but isn’t its code can’t join: its offer is never answered', `${wrong}: ${refused}`);
    // Notes the room must drop, sent under its own topic: none gets a handshake back; a fresh, well-made one does.
    const dropped = await b.ev(`(async () => {
      const name = 'barkbite-' + SnakeDebug.online().code.toLowerCase(), R = SnakeRelays, { w, topic } = await R.roomOf(name);
      const ws = hub(); await new Promise(r => setTimeout(r, 30));
      const say = (content, t = topic, kind = 26517) => ws.send(JSON.stringify(['EVENT', { id: Math.random().toString(36), kind, tags: [['x', t]], content, pubkey: '00', sig: '00', created_at: 0 }]));
      const heys = to => [...posted.values()].filter(c => c.includes('"hey"') && c.includes(to)).length;
      const { X } = await R.half(w, 'M'), off = '02' + 'f'.repeat(64);
      const cases = {
        'not JSON': ['{nope', 'aaaaaaaaaaaaaaa1'], 'stale': [JSON.stringify({ k: 'hi', from: 'aaaaaaaaaaaaaaa2', X, at: Date.now() - 120000 }), 'aaaaaaaaaaaaaaa2'],
        'a bad id': [JSON.stringify({ k: 'hi', from: 'AAAA', X, at: Date.now() }), 'AAAA'], 'a point off the curve': [JSON.stringify({ k: 'hi', from: 'aaaaaaaaaaaaaaa3', X: off, at: Date.now() }), 'aaaaaaaaaaaaaaa3'],
        'too long': [JSON.stringify({ k: 'hi', from: 'aaaaaaaaaaaaaaa4', X, at: Date.now(), pad: 'x'.repeat(20000) }), 'aaaaaaaaaaaaaaa4'],
        'another topic': [JSON.stringify({ k: 'hi', from: 'aaaaaaaaaaaaaaa5', X, at: Date.now() }), 'aaaaaaaaaaaaaaa5', 'barkbite-zzz'],
        'another kind': [JSON.stringify({ k: 'hi', from: 'aaaaaaaaaaaaaaa6', X, at: Date.now() }), 'aaaaaaaaaaaaaaa6', topic, 1],
      };
      const out = {};
      for (const [what, [content, from, t, kind]] of Object.entries(cases)) { say(content, t, kind); await new Promise(r => setTimeout(r, 1200)); out[what] = heys(from); }
      say(JSON.stringify({ k: 'hi', from: 'aaaaaaaaaaaaaaa7', X, at: Date.now() })); await new Promise(r => setTimeout(r, 1200));
      out.fresh = heys('aaaaaaaaaaaaaaa7');
      ws.close();
      return out;
    })()`);
    const { fresh, ...junk } = dropped;
    ok(fresh >= 1 && Object.values(junk).every(n => n === 0), 'the room drops notes that aren’t JSON, stale, badly made, a point off the curve, too long, or of another topic or kind, and answers a well-made one', JSON.stringify(dropped));
    const keys = await b.ev(`(async () => {
      const R = SnakeRelays, a = await R.roomOf('barkbite-mossy'), b = await R.roomOf('barkbite-k7qxm');
      const guest = await R.half(a.w, 'M'), room = await R.half(a.w, 'N'), stranger = await R.half(b.w, 'M');
      const t = ['g', 'h', guest.X, room.X], u = ['g', 'h', stranger.X, room.X];
      const kGuest = await R.agree(a.w, guest.x, 'N', room.X, t), kRoom = await R.agree(a.w, room.x, 'M', guest.X, t);
      const kStranger = await R.agree(b.w, stranger.x, 'N', room.X, u), kRoom2 = await R.agree(a.w, room.x, 'M', stranger.X, u);
      const iv = new Uint8Array(12), box = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kGuest, new Uint8Array([1, 2, 3]));
      const opens = async (k, bx) => crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, bx).then(() => true, () => false);
      const sbox = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kStranger, new Uint8Array([1, 2, 3]));
      const { M, N } = await R.spake();
      return { same: await opens(kRoom, box), stranger: await opens(kRoom2, sbox), junk: await R.agree(a.w, room.x, 'M', '02' + 'f'.repeat(64), t), blinds: M[0] !== N[0], topic: a.topic };
    })()`);
    ok(keys.same && !keys.stranger && keys.junk === null && keys.blinds, 'the handshake: the same code reaches the same key, another code doesn’t, and a point off the curve is refused', JSON.stringify(keys));
    // The limits, on a room of the relays alone with one friend in: guesses through the room's own blind or with a
    // point off the curve count, as offers that don't open do; at MAX_FAILS (50) the room leaves the relays, and the
    // friend already in stays.
    const limits = await b.ev(`(async () => {
      const R = SnakeRelays, F = friendWin.SnakeRelays, name = 'barkbite-limit', sleep = ms => new Promise(r => setTimeout(r, ms));
      let inRoom = null, heard = 0;
      const room = await R.listen(name, [], c => c.on('open', () => { inRoom = c; c.on('data', () => heard++); }));
      const { conn } = await F.connect(name, [], 15000);
      for (let i = 0; i < 100 && !inRoom; i++) await sleep(50);
      const { w, topic } = await R.roomOf(name), { M } = await R.spake(), ws = hub();
      await sleep(30);
      const say = note => ws.send(JSON.stringify(['EVENT', { id: Math.random().toString(36), kind: 26517, tags: [['x', topic]], content: JSON.stringify({ ...note, at: Date.now() }), pubkey: '00', sig: '00', created_at: 0 }]));
      const hex = ([x, y]) => (y & 1n ? '03' : '02') + x.toString(16).padStart(64, '0');
      await sleep(1100); say({ k: 'hi', from: 'bbbbbbbbbbbbbbb1', X: hex(R.times(w, M)) }); await sleep(300);
      const identity = room.fails();
      let x = 1n; while (await R.agree(w, 1n, 'M', '02' + x.toString(16).padStart(64, '0'), []) !== null) x++;
      await sleep(1100); say({ k: 'hi', from: 'bbbbbbbbbbbbbbb2', X: '02' + x.toString(16).padStart(64, '0') }); await sleep(300);
      const offCurve = room.fails();
      const guess = await R.half((await R.roomOf('barkbite-zzzzz')).w, 'M');
      await sleep(1100); say({ k: 'hi', from: 'bbbbbbbbbbbbbbb3', X: guess.X });
      let hey = null;
      for (let i = 0; i < 40 && !hey; i++) { await sleep(50); hey = [...posted.values()].map(c => { try { return JSON.parse(c); } catch { return {}; } }).find(n => n.k === 'hey' && n.to === 'bbbbbbbbbbbbbbb3'); }
      for (let i = 0; i < 48; i++) say({ k: 'offer', from: 'bbbbbbbbbbbbbbb3', to: hey.from, box: btoa('a box sealed with another code, ' + i) });
      await sleep(500);
      const left = room.left(), fails = room.fails();
      await sleep(1100); say({ k: 'hi', from: 'bbbbbbbbbbbbbbb4', X: (await R.half(w, 'M')).X }); await sleep(500);
      const answeredAfter = [...posted.values()].some(c => c.includes('"hey"') && c.includes('bbbbbbbbbbbbbbb4'));
      conn.send({ t: 'k' }); await sleep(200);
      const out = { identity, offCurve, fails, left, answeredAfter, friendStays: !!inRoom?.open && conn.open && heard > 0 };
      conn.close(); room.close(); ws.close();
      return out;
    })()`);
    ok(limits.identity === 1 && limits.offCurve === 2, 'a guess through the room’s own blind, or with a point off the curve, counts against the room’s limit', JSON.stringify(limits));
    ok(limits.fails === 50 && limits.left && !limits.answeredAfter, 'fifty failed guesses and the room leaves the relays: no handshake answered after', JSON.stringify(limits));
    ok(limits.friendStays, 'a friend already in stays when the room leaves the relays', JSON.stringify(limits));
    ok(/^barkbite-[0-9a-f]{1,3}$/.test(keys.topic), 'a room’s topic is one of 4,096, so what a relay sees says little of the code', keys.topic);
    await b.ev(`friendWin.close(); 'ok'`);
    await until(`SnakeDebug.online().players.length === 1`);
    ok(relayed >= 4 && relayed < 20, 'the friend leaving frees their seat; the relays carried only the handshake, the offer and the answer (and their repeats), the game went straight between the windows', `${relayed} notes relayed`);
    ok(!b.errors.length, 'no errors in the page', b.errors.join('; '));
  } finally { await b.close(); site.close(); }
}

(async () => {
  await inNode();
  await inChrome();
  process.exit(0);
})().catch(err => { console.error('FAIL:', err.message); process.exit(1); });
