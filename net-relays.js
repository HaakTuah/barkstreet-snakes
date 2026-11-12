// @ts-check
// Online play's second way to find each other (design 22, "Connecting"): when PeerJS's broker can't be reached,
// browsers find each other through several free public Nostr relays at once, so no one of them is needed. The relays
// only pass on short notes, sealed with a key made from the room's name, carrying the two browsers' WebRTC offer and
// answer; the game then goes straight between them over a data channel, as through PeerJS. Nothing here connects
// until a room is hosted or joined (net.js), and nothing comes from another site: the signing and the sealing are this
// file's own, on the browser's own crypto.
/**
 * @typedef {{ kind: 'offer' | 'answer', from: string, to: string, sdp: string, at: number }} Note  sealed, on a relay
 */
window.SnakeRelays = (() => {
  // Long-running public relays of different operators (each one exact host in the page's content security policy).
  const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net', 'wss://relay.nsec.app', 'wss://nostr.mom'];
  const KIND = 26517;        // an ephemeral kind (20000 to 29999): relays pass it on and keep nothing
  const FRESH_S = 60;        // a note older than this is stale (and a subscription looks back this far)
  const REACH_MS = 6000;     // no relay open by then: this way is out of reach
  const RETRY_MS = 5000, RETRY_MAX_MS = 120000; // a relay that drops is dialled again after this, doubling each time
  const RESEND_MS = 2000;    // a friend's offer goes again this often until the room answers
  const GATHER_MS = 2500;    // routes gathered for at most this long, so one note carries them
  const MAX_GUESTS = 8;      // offers a room takes at once (as net.js's MAX_CONNECTIONS)
  const MAX_NOTE = 16000, MAX_SDP = 12000, MAX_DATA = 65536; // (characters: anything longer is dropped unread)

  const enc = new TextEncoder();
  const hex = (/** @type {Uint8Array} */ b) => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  const randomId = () => hex(crypto.getRandomValues(new Uint8Array(8)));
  const ID = /^[0-9a-f]{16}$/;
  /** @param {Uint8Array[]} parts */
  const cat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let i = 0; for (const p of parts) { out.set(p, i); i += p.length; } return out; };
  const sha256 = async (/** @type {Uint8Array} */ b) => new Uint8Array(await crypto.subtle.digest('SHA-256', /** @type {BufferSource} */ (b)));
  const now = () => Math.floor(Date.now() / 1000);

  // Relays take only signed notes (BIP-340 Schnorr on secp256k1, Nostr's signature): a throwaway key per page, so a
  // signature says nothing about who sent it. What a note says is trusted by its seal alone, never its signature.
  const P = 2n ** 256n - 2n ** 32n - 977n, N = 2n ** 256n - 0x14551231950b75fc4402da1732fc9bebfn;
  const Gx = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n, Gy = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
  const mod = (/** @type {bigint} */ a, m = P) => ((a % m) + m) % m;
  const inv = (/** @type {bigint} */ a) => { let [x, y, u, v] = [mod(a), P, 1n, 0n]; while (x > 1n) { const q = y / x; [x, y, u, v] = [y - q * x, x, v - q * u, u]; } return mod(u); };
  /** @typedef {[bigint, bigint, bigint] | null} Point (Jacobian; null: infinity) */
  const dbl = (/** @type {Point} */ p) => {
    if (!p || !p[1]) return null;
    const [x, y, z] = p, s = mod(4n * x * y * y), m = mod(3n * x * x), x2 = mod(m * m - 2n * s);
    return /** @type {Point} */ ([x2, mod(m * (s - x2) - 8n * y ** 4n), mod(2n * y * z)]);
  };
  const add = (/** @type {Point} */ p, /** @type {Point} */ q) => {
    if (!p) return q;
    if (!q) return p;
    const [x1, y1, z1] = p, [x2, y2, z2] = q, z1s = mod(z1 * z1), z2s = mod(z2 * z2);
    const u1 = mod(x1 * z2s), u2 = mod(x2 * z1s), s1 = mod(y1 * z2s * z2), s2 = mod(y2 * z1s * z1);
    if (u1 === u2) return s1 === s2 ? dbl(p) : null;
    const h = mod(u2 - u1), r = mod(s2 - s1), h2 = mod(h * h), h3 = mod(h2 * h), x3 = mod(r * r - h3 - 2n * u1 * h2);
    return /** @type {Point} */ ([x3, mod(r * (u1 * h2 - x3) - s1 * h3), mod(h * z1 * z2)]);
  };
  // k times the generator, as x and y
  const times = (/** @type {bigint} */ k) => {
    /** @type {Point} */
    let r = null;
    /** @type {Point} */
    let q = [Gx, Gy, 1n];
    for (; k > 0n; k >>= 1n, q = dbl(q)) if (k & 1n) r = add(r, q);
    if (!r) throw new Error('infinity');
    const zi = inv(r[2]);
    return [mod(r[0] * zi * zi), mod(r[1] * zi * zi * zi)];
  };
  const toNum = (/** @type {Uint8Array} */ b) => BigInt('0x' + (hex(b) || '0'));
  const toBytes = (/** @type {bigint} */ n) => Uint8Array.from(n.toString(16).padStart(64, '0').match(/../g) || [], h => parseInt(h, 16));
  /** @type {Map<string, Uint8Array>} */
  const tags = new Map();
  const tagged = async (/** @type {string} */ tag, /** @type {Uint8Array[]} */ ...m) => {
    const t = tags.get(tag) || await sha256(enc.encode(tag));
    tags.set(tag, t);
    return sha256(cat(t, t, ...m));
  };
  /** BIP-340's signing, of a 32-byte message with secret key d0. @param {Uint8Array} msg @param {bigint} d0 @param {Uint8Array} [aux] */
  async function sign(msg, d0, aux = crypto.getRandomValues(new Uint8Array(32))) {
    const [px0, py] = times(d0), d = py & 1n ? N - d0 : d0, px = toBytes(px0);
    const t = toBytes(d ^ toNum(await tagged('BIP0340/aux', aux)));
    const k0 = mod(toNum(await tagged('BIP0340/nonce', t, px, msg)), N);
    if (!k0) throw new Error('nonce');
    const [rx0, ry] = times(k0), k = ry & 1n ? N - k0 : k0, rx = toBytes(rx0);
    const e = mod(toNum(await tagged('BIP0340/challenge', rx, px, msg)), N);
    return hex(cat(rx, toBytes(mod(k + e * d, N))));
  }
  /** @type {{ d: bigint, pubkey: string } | null} */
  let me = null;
  const keys = () => {
    if (me) return me;
    let d = 0n;
    while (!d || d >= N) d = toNum(crypto.getRandomValues(new Uint8Array(32)));
    return (me = { d, pubkey: hex(toBytes(times(d)[0])) });
  };
  /** A Nostr event carrying content under the room's topic. @param {string} topic @param {string} content */
  async function event(topic, content) {
    const { d, pubkey } = keys();
    const ev = { kind: KIND, created_at: now(), tags: [['x', topic]], content, pubkey };
    const id = await sha256(enc.encode(JSON.stringify([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content])));
    return JSON.stringify(['EVENT', { ...ev, id: hex(id), sig: await sign(id, d) }]);
  }

  // The room's topic and seal, from its name alone (net.js's PeerJS id): friends who know the code find the same
  // notes, and no one else can read them or write one that is taken. Both are slow to make (PBKDF2), so the topic seen
  // on a relay can't be turned back into the code by trying codes quickly.
  /** @param {string} name */
  async function roomKeys(name) {
    const base = await crypto.subtle.importKey('raw', enc.encode(name), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('barkbite-relays'), iterations: 100000, hash: 'SHA-256' }, base, 512));
    const key = await crypto.subtle.importKey('raw', bits.slice(32), 'AES-GCM', false, ['encrypt', 'decrypt']);
    return { topic: hex(bits.slice(0, 32)), key };
  }
  /** @param {CryptoKey} key @param {Note} note */
  async function seal(key, note) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(note))));
    return btoa(String.fromCharCode(...cat(iv, sealed)));
  }
  // A note from a relay: anyone can post under the topic, so it is opened only if sealed with the room's key, and
  // kept only in its exact shape, fresh. Anything else is dropped. @returns {Promise<Note | null>}
  /** @param {CryptoKey} key @param {unknown} text */
  async function open(key, text) {
    if (typeof text !== 'string' || text.length > MAX_NOTE) return null;
    try {
      const bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0));
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
      const n = JSON.parse(new TextDecoder().decode(plain));
      const fresh = typeof n?.at === 'number' && Math.abs(Date.now() - n.at) < FRESH_S * 1000;
      if (!fresh || (n.kind !== 'offer' && n.kind !== 'answer') || !ID.test(n.from) || !(n.to === '' || ID.test(n.to))
        || typeof n.sdp !== 'string' || n.sdp.length > MAX_SDP || !n.sdp.startsWith('v=0')) return null;
      return { kind: n.kind, from: n.from, to: n.to, sdp: n.sdp, at: n.at };
    } catch { return null; }
  }

  // The tests' stand-in for the relays replaces this.
  let socket = (/** @type {string} */ url) => new WebSocket(url);

  // Every relay at once, for one room: what several pass on counts once, and one that drops is opened again, less
  // and less often, while the room lasts. Resolves once one is open; rejects with { type: 'unreachable' } if none
  // opens in time.
  /** @param {string} name @param {(note: Note) => void} onNote */
  async function board(name, onNote) {
    const { topic, key } = await roomKeys(name);
    /** @type {Map<string, WebSocket>} */
    const sockets = new Map();
    const seen = new Set(), sub = randomId();
    let closed = false;
    /** @type {() => void} */
    let opened = () => {};
    /** @param {MessageEvent} e */
    const heard = async e => {
      if (typeof e.data !== 'string' || e.data.length > MAX_NOTE * 2) return;
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      const ev = Array.isArray(m) && m[0] === 'EVENT' && m[1] === sub ? m[2] : null;
      if (ev?.kind !== KIND || !Array.isArray(ev.tags) || !ev.tags.some((/** @type {unknown} */ t) => Array.isArray(t) && t[0] === 'x' && t[1] === topic)) return;
      if (typeof ev.content !== 'string' || seen.has(ev.content)) return;
      if (seen.size > 200) seen.clear();
      seen.add(ev.content);
      const note = await open(key, ev.content);
      if (note && !closed) onNote(note);
    };
    /** @param {string} url @param {number} wait (before the next try, if this one drops) */
    const dial = (url, wait) => {
      if (closed) return;
      /** @type {WebSocket} */
      let ws;
      try { ws = socket(url); } catch { return; }
      sockets.set(url, ws);
      ws.onopen = () => {
        wait = RETRY_MS;
        ws.send(JSON.stringify(['REQ', sub, { kinds: [KIND], '#x': [topic], since: now() - FRESH_S }]));
        opened();
      };
      ws.onmessage = heard;
      ws.onclose = () => { if (!closed && sockets.get(url) === ws) setTimeout(() => dial(url, Math.min(wait * 2, RETRY_MAX_MS)), wait); };
    };
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { closed = true; for (const ws of sockets.values()) ws.close(); reject({ type: 'unreachable' }); }, REACH_MS);
      opened = () => { clearTimeout(timer); opened = () => {}; resolve(undefined); };
      for (const url of RELAYS) dial(url, RETRY_MS);
    });
    return {
      /** @param {Note} note */
      async post(note) { const text = await event(topic, await seal(key, note)); for (const ws of sockets.values()) if (ws.readyState === 1) ws.send(text); },
      close() { closed = true; for (const ws of sockets.values()) ws.close(); sockets.clear(); },
    };
  }

  // Waits for this browser's routes to be gathered (or GATHER_MS), so one note carries them all.
  /** @param {RTCPeerConnection} pc */
  const gathered = pc => new Promise(resolve => {
    if (pc.iceGatheringState === 'complete') return resolve(undefined);
    const timer = setTimeout(resolve, GATHER_MS);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(timer); resolve(undefined); } });
  });

  // A data channel with PeerJS's DataConnection's ways (open, send, close; open, data and close events), messages
  // as JSON text: the game's own messages, unchanged.
  /** @param {string} peer @param {RTCPeerConnection} pc @param {RTCDataChannel} dc @returns {PeerJS.DataConnection} */
  function channel(peer, pc, dc) {
    /** @type {Map<string, Function[]>} */
    const on = new Map();
    const emit = (/** @type {string} */ e, /** @type {unknown} */ x = undefined) => { for (const f of [...(on.get(e) || [])]) f(x); };
    let ended = false;
    const end = () => { if (ended) return; ended = true; conn.open = false; try { dc.close(); pc.close(); } catch { /* gone */ } emit('close'); };
    const conn = {
      peer, open: false,
      /** @param {unknown} msg */
      send(msg) { if (dc.readyState === 'open') try { dc.send(JSON.stringify(msg)); } catch { /* too big, or closing */ } },
      close: end,
      /** @param {string} e @param {Function} f */
      on(e, f) { on.set(e, [...(on.get(e) || []), f]); },
      /** @param {string} e @param {Function} f */
      once(e, f) { const g = (/** @type {unknown} */ x) => { conn.off(e, g); f(x); }; conn.on(e, g); },
      /** @param {string} e @param {Function} f */
      off(e, f) { on.set(e, (on.get(e) || []).filter(g => g !== f)); },
    };
    const opened = () => { if (ended || conn.open) return; conn.open = true; emit('open'); };
    if (dc.readyState === 'open') setTimeout(opened, 0); else dc.onopen = opened;
    dc.onclose = end;
    dc.onmessage = e => {
      if (typeof e.data !== 'string' || e.data.length > MAX_DATA) return;
      try { emit('data', JSON.parse(e.data)); } catch { /* not JSON: dropped */ }
    };
    pc.addEventListener('connectionstatechange', () => { if (pc.connectionState === 'failed' || pc.connectionState === 'closed') end(); });
    return /** @type {PeerJS.DataConnection} */ (/** @type {unknown} */ (conn));
  }

  // Host a room on the relays under its name: each friend's offer is answered, and their channel handed to
  // onConnection before it opens. Resolves once a relay is open.
  /** @param {string} name @param {RTCIceServer[]} iceServers @param {(conn: PeerJS.DataConnection) => void} onConnection */
  async function listen(name, iceServers, onConnection) {
    if (!window.RTCPeerConnection) throw { type: 'browser-incompatible' };
    const myId = randomId();
    /** @type {Map<string, { pc: RTCPeerConnection, answer: Note | null, sent: number }>} */
    const guests = new Map();
    /** @type {Awaited<ReturnType<typeof board>>} */
    const room = await board(name, async note => {
      if (note.kind !== 'offer' || note.to !== '') return;
      const known = guests.get(note.from);
      if (known) { // (our answer lost on the way: once more, at most once a RESEND_MS)
        if (known.answer && performance.now() - known.sent > RESEND_MS / 2) { known.sent = performance.now(); room.post({ ...known.answer, at: Date.now() }); }
        return;
      }
      if (guests.size >= MAX_GUESTS) return;
      const pc = new RTCPeerConnection({ iceServers });
      const guest = { pc, answer: /** @type {Note | null} */ (null), sent: 0 };
      guests.set(note.from, guest);
      const drop = () => { if (guests.get(note.from) === guest) guests.delete(note.from); pc.close(); };
      const unopened = setTimeout(drop, 30000); // (never connected: the seat's place is freed)
      pc.ondatachannel = e => {
        clearTimeout(unopened);
        const conn = channel('relay-' + note.from, pc, e.channel);
        conn.on('close', () => { if (guests.get(note.from) === guest) guests.delete(note.from); });
        onConnection(conn);
      };
      try {
        await pc.setRemoteDescription({ type: 'offer', sdp: note.sdp });
        await pc.setLocalDescription(await pc.createAnswer());
        await gathered(pc);
        guest.answer = { kind: 'answer', from: myId, to: note.from, sdp: pc.localDescription?.sdp || '', at: Date.now() };
        guest.sent = performance.now();
        room.post(guest.answer);
      } catch { clearTimeout(unopened); drop(); }
    });
    return { close() { room.close(); for (const g of guests.values()) g.pc.close(); guests.clear(); } };
  }

  // Join a room on the relays: our offer goes out until the room answers, then the browsers try routes. Resolves with
  // the open channel and our id; rejects with { type: 'unreachable' } (no relay open), 'unanswered' (no answer in
  // time) or 'route' (answered, but no route through).
  /** @param {string} name @param {RTCIceServer[]} iceServers @param {number} ms @returns {Promise<{ id: string, conn: PeerJS.DataConnection }>} */
  async function connect(name, iceServers, ms) {
    if (!window.RTCPeerConnection) throw { type: 'browser-incompatible' };
    const myId = randomId();
    let answered = false;
    const pc = new RTCPeerConnection({ iceServers });
    const conn = channel('host', pc, pc.createDataChannel('barkbite', { ordered: true }));
    /** @type {Awaited<ReturnType<typeof board>> | null} */
    let room = null;
    try {
      room = await board(name, async note => {
        if (answered || note.kind !== 'answer' || note.to !== myId) return;
        answered = true;
        try { await pc.setRemoteDescription({ type: 'answer', sdp: note.sdp }); } catch { answered = false; }
      });
    } catch (err) { pc.close(); throw err; }
    const posting = /** @type {NonNullable<typeof room>} */ (room);
    return new Promise((resolve, reject) => {
      let resend = 0;
      const finish = () => { clearTimeout(timer); clearInterval(resend); posting.close(); };
      const fail = () => { finish(); conn.close(); reject({ type: answered ? 'route' : 'unanswered' }); };
      const timer = setTimeout(fail, ms);
      pc.addEventListener('iceconnectionstatechange', () => { if (pc.iceConnectionState === 'failed') fail(); });
      conn.once('open', () => { finish(); resolve({ id: 'relay-' + myId, conn }); });
      (async () => {
        await pc.setLocalDescription(await pc.createOffer());
        await gathered(pc);
        const offer = () => posting.post({ kind: 'offer', from: myId, to: '', sdp: pc.localDescription?.sdp || '', at: Date.now() });
        offer();
        resend = setInterval(() => { if (!answered) offer(); }, RESEND_MS);
      })().catch(fail);
    });
  }

  return {
    listen, connect, RELAYS,
    /** The tests' stand-in for the relays. @param {(url: string) => WebSocket} make */
    useSockets(make) { socket = make; },
    sign, times, // (checked against BIP-340's own test vectors)
  };
})();
