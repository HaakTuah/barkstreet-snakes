// @ts-check
// Online play's second way to find each other (design 22, "Connecting"): when PeerJS's broker can't be reached,
// browsers find each other through several free public Nostr relays at once, so no one of them is needed. The relays
// pass on four short notes per friend: a handshake (SPAKE2) that proves both sides know the room code without showing
// it, then the browsers' WebRTC offer and answer, sealed with the key it agreed; the game then goes straight between
// them over a data channel, as through PeerJS. Nothing here connects until a room is hosted or joined (net.js), and
// nothing comes from another site: the curve, the signing and the handshake are this file's own, on the browser's own
// crypto.
/**
 * @typedef {{ k: 'hi', from: string, X: string, at: number }
 *   | { k: 'hey', from: string, to: string, Y: string, at: number }
 *   | { k: 'offer' | 'answer', from: string, to: string, box: string, at: number }} Note  on a relay, in the clear
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
  const MAX_GUESTS = 8;      // friends a room is shaking hands with at once (as net.js's MAX_CONNECTIONS)
  const HI_MS = 1000;        // a room answers one new handshake this often at most...
  const MAX_FAILS = 50;      // ...and leaves the relays after this many offers sealed with a wrong code
  const MAX_HOSTS = 4;       // rooms a friend shakes hands with at once (rooms sharing a bucket)...
  const MAX_AGREED = 8;      // ...and keys it agrees in all, a room shaking hands anew once at most
  const BUCKETS = 4096;      // a room's topic is one of these: what a relay sees says little of the code
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
  /** @typedef {[bigint, bigint]} Affine */
  /** @param {Point} r @returns {Affine} */
  const affine = r => {
    if (!r) throw new Error('infinity');
    const zi = inv(r[2]);
    return [mod(r[0] * zi * zi), mod(r[1] * zi * zi * zi)];
  };
  // k times a point (the generator unless given), as x and y
  const times = (/** @type {bigint} */ k, /** @type {Affine} */ [x, y] = [Gx, Gy]) => {
    /** @type {Point} */
    let r = null;
    /** @type {Point} */
    let q = [x, y, 1n];
    for (; k > 0n; k >>= 1n, q = dbl(q)) if (k & 1n) r = add(r, q);
    return affine(r);
  };
  const plus = (/** @type {Affine} */ a, /** @type {Affine} */ b) => affine(add([a[0], a[1], 1n], [b[0], b[1], 1n]));
  const minus = (/** @type {Affine} */ [x, y]) => /** @type {Affine} */ ([x, mod(-y)]);
  const pow = (/** @type {bigint} */ b, /** @type {bigint} */ e) => { let r = 1n; for (b = mod(b); e > 0n; e >>= 1n, b = mod(b * b)) if (e & 1n) r = mod(r * b); return r; };
  // A point from its x (the even y, or the odd), or null if x is none of the curve's (y² = x³ + 7).
  const lift = (/** @type {bigint} */ x, odd = false) => {
    if (x >= P) return null;
    const yy = mod(x * x * x + 7n), y = pow(yy, (P + 1n) / 4n);
    if (mod(y * y) !== yy) return null;
    return /** @type {Affine} */ ([x, (y & 1n) === BigInt(odd) ? y : mod(-y)]);
  };
  const pack = (/** @type {Affine} */ [x, y]) => (y & 1n ? '03' : '02') + x.toString(16).padStart(64, '0');
  const unpack = (/** @type {unknown} */ text) => typeof text === 'string' && /^0[23][0-9a-f]{64}$/.test(text) ? lift(BigInt('0x' + text.slice(2)), text[1] === '3') : null;
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

  // The handshake (SPAKE2, RFC 9382, on this curve): each side blinds a fresh point with the code's own number w,
  // and only one who knows w can unblind the other's and reach the same key. Someone on the relays sees two points that
  // say nothing of the code, and one who tries a code learns only whether that one guess was right, and only by
  // trying it on the room itself. M and N are points no one knows the logarithm of: hashed from their names onto the
  // curve, so nothing up the sleeve.
  /** @type {Promise<{ M: Affine, N: Affine }> | null} */
  let blinds = null;
  const toCurve = async (/** @type {string} */ seed) => {
    for (let i = 0; ; i++) { const p = lift(mod(toNum(await sha256(enc.encode(seed + ' ' + i))))); if (p) return p; }
  };
  const spake = () => (blinds ||= Promise.all([toCurve('barkbite SPAKE2 M'), toCurve('barkbite SPAKE2 N')]).then(([M, N]) => ({ M, N })));
  // The room's number w, and its topic: one of BUCKETS, shared by every code that falls in it.
  /** @param {string} name */
  async function roomOf(name) {
    const w = mod(toNum(await sha256(enc.encode('barkbite SPAKE2 w ' + name))), N) || 1n;
    const topic = 'barkbite-' + (toNum((await sha256(enc.encode('barkbite bucket ' + name))).slice(0, 2)) % BigInt(BUCKETS)).toString(16);
    return { w, topic };
  }
  // One side's half: a secret x and the blinded point x·G + w·(M for a friend, N for the room).
  /** @param {bigint} w @param {'M' | 'N'} side */
  async function half(w, side) {
    const blind = (await spake())[side];
    let x = 0n;
    while (!x || x >= N) x = toNum(crypto.getRandomValues(new Uint8Array(32)));
    return { x, X: pack(plus(times(x), times(w, blind))) };
  }
  // The key both reach from their own half and the other's point (the other side's blind taken off), bound to who
  // said what; null if the other's point is off the curve (which says nothing of the code: dropped). A point that
  // unblinds to nothing was made from the right code by one who knows no secret for it: it gets a key no one can
  // match, so that a guess through it is answered like any other, and spent like any other.
  /** @param {bigint} w @param {bigint} x @param {'M' | 'N'} theirs @param {unknown} them @param {string[]} transcript */
  async function agree(w, x, theirs, them, transcript) {
    const T = unpack(them);
    if (!T) return null;
    let Z;
    try { Z = times(x, plus(T, minus(times(w, (await spake())[theirs])))); } catch {
      return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }
    const raw = await sha256(enc.encode(['barkbite SPAKE2', ...transcript, pack(Z), w.toString(16)].join('|')));
    return crypto.subtle.importKey('raw', /** @type {BufferSource} */ (raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  // A session description sealed for one side (what kind it is sealed in too, so an offer can't pass for an answer).
  /** @param {CryptoKey} key @param {'offer' | 'answer'} kind @param {string} sdp */
  async function seal(key, kind, sdp) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(kind) }, key, enc.encode(sdp)));
    return btoa(String.fromCharCode(...cat(iv, sealed)));
  }
  /** @param {CryptoKey} key @param {'offer' | 'answer'} kind @param {string} box @returns {Promise<string | null>} */
  async function unseal(key, kind, box) {
    try {
      const bytes = Uint8Array.from(atob(box), c => c.charCodeAt(0));
      const sdp = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: enc.encode(kind) }, key, bytes.slice(12)));
      return sdp.length <= MAX_SDP && sdp.startsWith('v=0') ? sdp : null;
    } catch { return null; }
  }
  // A note from a relay: anyone can post under a topic, so it is kept only in its exact shape, and fresh. Anything
  // else is dropped.
  /** @param {unknown} text @returns {Note | null} */
  function read(text) {
    if (typeof text !== 'string' || text.length > MAX_NOTE) return null;
    let n;
    try { n = JSON.parse(text); } catch { return null; }
    if (typeof n?.at !== 'number' || Math.abs(Date.now() - n.at) > FRESH_S * 1000 || !ID.test(n.from)) return null;
    if (n.k === 'hi') return typeof n.X === 'string' && n.X.length === 66 ? { k: 'hi', from: n.from, X: n.X, at: n.at } : null;
    if (!ID.test(n.to)) return null;
    if (n.k === 'hey') return typeof n.Y === 'string' && n.Y.length === 66 ? { k: 'hey', from: n.from, to: n.to, Y: n.Y, at: n.at } : null;
    if ((n.k === 'offer' || n.k === 'answer') && typeof n.box === 'string') return { k: /** @type {'offer' | 'answer'} */ (n.k), from: n.from, to: n.to, box: n.box, at: n.at };
    return null;
  }

  // The tests' stand-in for the relays replaces this.
  let socket = (/** @type {string} */ url) => new WebSocket(url);

  // Every relay at once, for one room: what several pass on counts once, and one that drops is opened again, less
  // and less often, while the room lasts. Resolves once one is open; rejects with { type: 'unreachable' } if none
  // opens in time.
  /** @param {string} topic @param {(note: Note) => void} onNote */
  async function board(topic, onNote) {
    /** @type {Map<string, WebSocket>} */
    const sockets = new Map();
    const seen = new Set(), sub = randomId();
    let closed = false;
    /** @type {() => void} */
    let opened = () => {};
    /** @param {MessageEvent} e */
    const heard = e => {
      if (typeof e.data !== 'string' || e.data.length > MAX_NOTE * 2) return;
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      const ev = Array.isArray(m) && m[0] === 'EVENT' && m[1] === sub ? m[2] : null;
      if (ev?.kind !== KIND || !Array.isArray(ev.tags) || !ev.tags.some((/** @type {unknown} */ t) => Array.isArray(t) && t[0] === 'x' && t[1] === topic)) return;
      if (typeof ev.content !== 'string' || seen.has(ev.content)) return;
      if (seen.size > 200) seen.clear();
      seen.add(ev.content);
      const note = read(ev.content);
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
      async post(note) { const text = await event(topic, JSON.stringify(note)); for (const ws of sockets.values()) if (ws.readyState === 1) ws.send(text); },
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

  // Host a room on the relays under its name: each friend's handshake is answered (one new one a HI_MS at most), and
  // an offer that opens with the key it agreed gets the room's answer; their channel is handed to onConnection before
  // it opens. MAX_FAILS guesses (a handshake through the room's own blind, or an offer that doesn't open) and the room
  // leaves the relays, friends already in staying. Resolves once a relay is open, with close() and, for the suite,
  // how many guesses failed and whether it left.
  /** @param {string} name @param {RTCIceServer[]} iceServers @param {(conn: PeerJS.DataConnection) => void} onConnection */
  async function listen(name, iceServers, onConnection) {
    if (!window.RTCPeerConnection) throw { type: 'browser-incompatible' };
    const myId = randomId(), { w, topic } = await roomOf(name);
    /** @type {Map<string, { key: CryptoKey, Y: string, since: number, pc?: RTCPeerConnection, answer?: Note, sent: number }>} */
    const guests = new Map();
    let lastHi = -Infinity, fails = 0, closed = false;
    const forget = (/** @type {string} */ id) => { guests.get(id)?.pc?.close(); guests.delete(id); };
    const sweep = setInterval(() => { for (const [id, g] of guests) if (!g.pc && performance.now() - g.since > 30000) forget(id); }, 5000);
    // (leaving the relays forgets only the friends still shaking hands; closing the room, everyone)
    const leave = () => { closed = true; clearInterval(sweep); room.close(); for (const [id, g] of guests) if (!g.pc) forget(id); };
    const close = () => { leave(); for (const id of [...guests.keys()]) forget(id); };
    const failed = () => { if (++fails >= MAX_FAILS) leave(); };
    /** @type {Awaited<ReturnType<typeof board>>} */
    const room = await board(topic, async note => {
      const guest = guests.get(note.from);
      if (note.k === 'hi') {
        if (guest) { if (performance.now() - guest.sent > RESEND_MS / 2) { guest.sent = performance.now(); room.post({ k: 'hey', from: myId, to: note.from, Y: guest.Y, at: Date.now() }); } return; }
        if (guests.size >= MAX_GUESTS || performance.now() - lastHi < HI_MS) return;
        lastHi = performance.now();
        const { x, X: Y } = await half(w, 'N');
        const key = await agree(w, x, 'M', note.X, [note.from, myId, note.X, Y]);
        if (!key || closed || guests.has(note.from)) return;
        guests.set(note.from, { key, Y, since: performance.now(), sent: performance.now() });
        room.post({ k: 'hey', from: myId, to: note.from, Y, at: Date.now() });
        return;
      }
      if (note.k !== 'offer' || note.to !== myId || !guest) return;
      if (guest.pc) { // (our answer lost on the way: once more, at most once a RESEND_MS)
        if (guest.answer && performance.now() - guest.sent > RESEND_MS / 2) { guest.sent = performance.now(); room.post({ ...guest.answer, at: Date.now() }); }
        return;
      }
      const sdp = await unseal(guest.key, 'offer', note.box);
      if (!sdp) return failed(); // (the friend stays: an offer under their id may be anyone's)
      if (closed || guest.pc) return;
      const pc = guest.pc = new RTCPeerConnection({ iceServers });
      const unopened = setTimeout(() => forget(note.from), 30000); // (never connected: the seat's place is freed)
      pc.ondatachannel = e => { // (the first channel only: a friend is one channel)
        pc.ondatachannel = ev => ev.channel.close();
        clearTimeout(unopened);
        const conn = channel('relay-' + note.from, pc, e.channel);
        conn.on('close', () => { if (guests.get(note.from) === guest) guests.delete(note.from); });
        onConnection(conn);
      };
      try {
        await pc.setRemoteDescription({ type: 'offer', sdp });
        await pc.setLocalDescription(await pc.createAnswer());
        await gathered(pc);
        guest.answer = { k: 'answer', from: myId, to: note.from, box: await seal(guest.key, 'answer', pc.localDescription?.sdp || ''), at: Date.now() };
        guest.sent = performance.now();
        room.post(guest.answer);
      } catch { clearTimeout(unopened); forget(note.from); }
    });
    return { close, fails: () => fails, left: () => closed };
  }

  // Join a room on the relays: our handshake goes out until a room answers it, then our offer, sealed with the key
  // agreed, until one answers that (rooms sharing the topic can't open it); then the browsers try routes. Resolves with
  // the open channel and our id; rejects with { type: 'unreachable' } (no relay open), 'unanswered' (no room with the
  // code answered in time) or 'route' (it answered, but no route through).
  // A stop signal (net.js's, once another way has won) ends it at once.
  /** @param {string} name @param {RTCIceServer[]} iceServers @param {number} ms @param {AbortSignal} [stop] @returns {Promise<{ id: string, conn: PeerJS.DataConnection }>} */
  async function connect(name, iceServers, ms, stop) {
    if (!window.RTCPeerConnection) throw { type: 'browser-incompatible' };
    const myId = randomId(), { w, topic } = await roomOf(name);
    const { x, X } = await half(w, 'M');
    let answered = false;
    const pc = new RTCPeerConnection({ iceServers });
    const conn = channel('host', pc, pc.createDataChannel('barkbite', { ordered: true }));
    const offered = (async () => { await pc.setLocalDescription(await pc.createOffer()); await gathered(pc); return pc.localDescription?.sdp || ''; })();
    /** @type {Map<string, { key: CryptoKey, box: string, Y: string, tries: number, again: boolean }>} */
    const hosts = new Map(), busy = new Set();
    let agreed = 0;
    /** @type {Awaited<ReturnType<typeof board>> | null} */
    let room = null;
    try {
      room = await board(topic, async note => {
        if (answered || note.k === 'hi' || note.to !== myId) return;
        if (note.k === 'hey') { // (a room that forgot us shakes hands anew, with a new Y: so do we)
          const known = hosts.get(note.from);
          // (a slot is taken before any work, so a flood of handshakes gets MAX_HOSTS at most, each one at a time)
          // (and keys agreed are few: each is one guess for a room that isn't one, against our offer)
          if (busy.has(note.from) || agreed >= MAX_AGREED || (known ? known.Y === note.Y || known.again : hosts.size + busy.size >= MAX_HOSTS)) return;
          busy.add(note.from);
          agreed++;
          try {
            const key = await agree(w, x, 'N', note.Y, [myId, note.from, X, note.Y]);
            const sdp = await offered;
            if (!key || answered) return;
            const box = await seal(key, 'offer', sdp);
            hosts.set(note.from, { key, box, Y: note.Y, tries: 0, again: !!known });
            room?.post({ k: 'offer', from: myId, to: note.from, box, at: Date.now() });
          } catch { /* no offer of ours to send: the join fails on its own */ } finally { busy.delete(note.from); }
        } else if (note.k === 'answer') {
          const host = hosts.get(note.from), sdp = host && await unseal(host.key, 'answer', note.box);
          if (!sdp || answered) return;
          answered = true;
          try { await pc.setRemoteDescription({ type: 'answer', sdp }); } catch { answered = false; }
        }
      });
    } catch (err) { pc.close(); throw err; }
    const posting = /** @type {NonNullable<typeof room>} */ (room);
    return new Promise((resolve, reject) => {
      const finish = () => { clearTimeout(timer); clearInterval(resend); posting.close(); };
      let settled = false;
      const fail = () => { if (settled) return; settled = true; finish(); conn.close(); reject({ type: answered ? 'route' : 'unanswered' }); };
      const timer = setTimeout(fail, ms);
      // (until a room answers: our handshake again, and our offer again to each room that shook hands)
      const again = () => {
        if (answered) return;
        posting.post({ k: 'hi', from: myId, X, at: Date.now() });
        for (const [id, h] of hosts) {
          if (++h.tries > 4) { hosts.delete(id); continue; } // (a room that never answers our offer: room for another)
          posting.post({ k: 'offer', from: myId, to: id, box: h.box, at: Date.now() });
        }
      };
      const resend = setInterval(again, RESEND_MS);
      again();
      pc.addEventListener('iceconnectionstatechange', () => { if (pc.iceConnectionState === 'failed') fail(); });
      conn.once('open', () => { if (settled) return; settled = true; finish(); resolve({ id: 'relay-' + myId, conn }); });
      offered.catch(fail);
      if (stop?.aborted) fail(); else stop?.addEventListener('abort', fail);
    });
  }

  return {
    listen, connect, RELAYS,
    /** The tests' stand-in for the relays. @param {(url: string) => WebSocket} make */
    useSockets(make) { socket = make; },
    sign, times, // (checked against BIP-340's own test vectors)
    roomOf, half, agree, spake, // (the handshake: checked in the suite)
  };
})();
