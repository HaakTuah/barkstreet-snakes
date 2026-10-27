// @ts-check
// Online play between friends: the connections. One browser hosts; friends
// connect straight to it over WebRTC data channels. PeerJS's free public
// broker only introduces the browsers to each other; game traffic then goes
// directly between them. PeerJS is loaded the first time someone opens
// "Play with friends", so playing alone never touches the network.
// What net.js itself sends, beside the game's messages (online.js types those):
/**
 * @typedef {{ t: 'ping', at: number }} PingMsg  host -> guest, every PING_MS: at, the host's clock
 * @typedef {{ t: 'pong', at: number }} PongMsg  guest -> host: the ping's at, back
 * @typedef {{ t: 'k' }} KeepaliveMsg  guest -> host, every KEEPALIVE_MS: still here
 */
window.SnakeNet = (() => {
  const PEERJS = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
  const PEERJS_SRI = 'sha512-iFU+yF1keEaLDC9HEwPfLMSRaS0unBHE14GEgx6pQKJXjp5v0tvX8xpfp2lgJ62XEjbYp/M5C3CAmej/PWXMyA==';
  const PREFIX = 'barkbite-';   // our corner of the broker's shared namespace
  const CONNECT_MS = 15000;     // give up joining after this long
  const PING_MS = 1000;         // the host measures each friend's lag this often
  const KEEPALIVE_MS = 250;     // a friend's browser says "still here" this often
  const GONE_MS = 20000;        // a friend the host hasn't heard from for this long has left
  const SILENT_MS = 8000;       // a host a friend hasn't heard from for this long has left

  // How browsers find a way to each other through home routers. STUN works for
  // most networks. Some strict ones (certain mobile carriers, offices) also
  // need a relay (TURN). To add one, put it in this list, for example:
  //   { urls: 'turn:relay.example.com:3478', username: '...', credential: '...' }
  const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // A step that might hang (a script, the broker), given up on after CONNECT_MS.
  /** @template T @param {Promise<T>} promise @param {() => void} [onLate] @returns {Promise<T>} */
  const inTime = (promise, onLate) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { onLate?.(); reject({ type: 'timeout' }); }, CONNECT_MS);
    promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
  });

  /** @type {Promise<PeerJS.PeerClass> | null} */
  let loading = null;
  /** @returns {Promise<PeerJS.PeerClass>} */
  function load() {
    if (window.Peer) return Promise.resolve(window.Peer);
    return inTime(loading ||= new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PEERJS;
      s.integrity = PEERJS_SRI;
      s.crossOrigin = 'anonymous';
      s.onload = () => { if (window.Peer) resolve(window.Peer); else { loading = null; reject(new Error('library')); } };
      s.onerror = () => { loading = null; s.remove(); reject(new Error('library')); };
      document.head.append(s);
    }));
  }

  // Why a connection failed, in words for the card.
  /** @param {any} err */
  function explain(err) {
    const type = err?.type || err?.message;
    if (type === 'library') return 'Couldn’t load what online play needs. Are you online?';
    if (type === 'peer-unavailable') return 'There’s no room with that code. Check it, or ask for a fresh link.';
    if (type === 'browser-incompatible') return 'This browser can’t play with friends. Try a recent Chrome, Firefox or Safari.';
    if (type === 'timeout') return 'Couldn’t reach the room. Try another network, say mobile data instead of Wi-Fi.';
    return 'Couldn’t reach the matchmaking service. Check your connection and try again.';
  }

  const peerOptions = () => ({ config: { iceServers: ICE_SERVERS }, debug: 0 });

  // Open a Peer, optionally under a chosen id. Resolves once the broker knows us.
  /** @param {PeerJS.PeerClass} Peer @param {string} [id] @returns {Promise<PeerJS.Peer>} */
  function openPeer(Peer, id) {
    /** @type {PeerJS.Peer | null} */
    let opened = null;
    return inTime(new Promise((resolve, reject) => {
      const peer = opened = id ? new Peer(id, peerOptions()) : new Peer(peerOptions());
      /** @param {PeerJS.Err} err */
      const fail = err => { peer.off('open', ok); peer.destroy(); reject(err); };
      const ok = () => { peer.off('error', fail); resolve(peer); };
      peer.once('open', ok);
      peer.once('error', fail);
    }), () => opened?.destroy());
  }

  // Host a room. newCode() makes room codes; a taken one is replaced (up to 4 tries).
  // Callbacks: onLeave(id), onMessage(id, msg), and optionally onJoin(id) (a
  // connection opened; it's admitted once its hello is accepted) and onLost(err)
  // (the room itself failed; friends already connected may well stay connected).
  /**
   * @param {{ newCode: () => string, onJoin?: (id: string) => void, onLeave: (id: string) => void,
   *   onMessage: (id: string, msg: GuestMessage) => void, onLost?: (err: PeerJS.Err) => void }} callbacks
   */
  async function host({ newCode, onJoin, onLeave, onMessage, onLost }) {
    const Peer = await load();
    /** @type {PeerJS.Peer | undefined} */
    let peer;
    let code = '';
    for (let tries = 0; !peer; tries++) {
      code = newCode();
      try { peer = await openPeer(Peer, PREFIX + code.toLowerCase()); } catch (/** @type {any} */ err) {
        if (err?.type !== 'unavailable-id' || tries >= 3) throw err;
      }
    }
    /** @type {Map<string, { conn: PeerJS.DataConnection, rtt: number, heard: number, admitted: boolean, since: number }>} */
    const friends = new Map();
    const ADMIT_MS = 5000, MAX_CONNECTIONS = 8;

    peer.on('connection', conn => {
      conn.on('open', () => {
        if (friends.size >= MAX_CONNECTIONS) { conn.close(); return; }
        friends.set(conn.peer, { conn, rtt: 0, heard: performance.now(), admitted: false, since: performance.now() });
        onJoin?.(conn.peer);
      });
      conn.on('data', /** @param {PongMsg | KeepaliveMsg | GuestMessage} msg (anything: checked here) */ msg => {
        const f = friends.get(conn.peer);
        if (!f || !msg || typeof msg !== 'object') return;
        f.heard = performance.now();
        if (msg.t === 'k') return; // still here
        if (msg.t === 'pong') {
          const rtt = performance.now() - msg.at;
          if (Number.isFinite(rtt) && rtt >= 0 && rtt <= 5000) f.rtt = f.rtt ? f.rtt * 0.7 + rtt * 0.3 : rtt;
          return;
        }
        onMessage(conn.peer, msg);
      });
      const gone = () => { if (friends.delete(conn.peer)) onLeave(conn.peer); };
      conn.on('close', gone);
      conn.on('error', err => { if (err?.type !== 'message-too-big') gone(); });
    });
    // Losing the broker doesn't affect friends already connected; reconnect so
    // new ones can still find the room.
    peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => !peer.destroyed && peer.reconnect(), 1000); });
    peer.on('error', err => { if (err.type === 'network' || err.type === 'server-error') return; onLost?.(err); });

    const pinger = setInterval(() => {
      const now = performance.now();
      for (const [id, f] of friends) {
        if (now - f.heard > GONE_MS || (!f.admitted && now - f.since > ADMIT_MS)) { friends.delete(id); f.conn.close(); onLeave(id); continue; }
        if (f.conn.open) f.conn.send({ t: 'ping', at: now });
      }
    }, PING_MS);

    /** @param {string} id @param {HostMessage} msg */
    const send = (id, msg) => { const f = friends.get(id); if (f?.conn.open) f.conn.send(msg); };
    return {
      code,
      send,
      /** @param {HostMessage} msg */
      broadcast(msg) { for (const f of friends.values()) if (f.admitted && f.conn.open) f.conn.send(msg); },
      // A friend who said hello: from now on they get the broadcasts.
      /** @param {string} id */
      admit(id) { const f = friends.get(id); if (f) f.admitted = true; },
      // How long since we last heard from a friend (ms): a quiet one may have lost their connection.
      /** @param {string} id */
      quietFor(id) { const f = friends.get(id); return f ? performance.now() - f.heard : Infinity; },
      // The average round-trip time to friends (ms), for evening out the host's head start.
      rtt() { let sum = 0, n = 0; for (const f of friends.values()) if (f.rtt) { sum += f.rtt; n++; } return n ? sum / n : 0; },
      /** @param {string} id */
      drop(id) { const f = friends.get(id); if (f) { friends.delete(id); f.conn.close(); } },
      close() { clearInterval(pinger); for (const f of friends.values()) f.conn.close(); friends.clear(); peer.destroy(); },
    };
  }

  // Join a room by its code. Callbacks: onMessage(msg), onLost(reason).
  // Resolves once connected; rejects with words for the card if it can't.
  /** @param {string} code @param {{ onMessage: (msg: HostMessage) => void, onLost: (reason: 'closed' | 'silent') => void }} callbacks */
  async function join(code, { onMessage, onLost }) {
    /** @type {PeerJS.PeerClass} */
    let Peer;
    try { Peer = await load(); } catch (err) { throw new Error(explain(err)); }
    /** @type {PeerJS.Peer} */
    let peer;
    try { peer = await openPeer(Peer); } catch (err) { throw new Error(explain(err)); }
    const conn = await new Promise(/** @param {(c: PeerJS.DataConnection) => void} resolve */ (resolve, reject) => { // (it has its own time limit)
      const c = peer.connect(PREFIX + code.toLowerCase(), { serialization: 'json', reliable: true });
      const timer = setTimeout(() => fail({ type: 'timeout' }), CONNECT_MS);
      /** @param {PeerJS.Err} err */
      function fail(err) { clearTimeout(timer); peer.destroy(); reject(new Error(explain(err))); }
      peer.once('error', fail);
      c.once('open', () => { clearTimeout(timer); peer.off('error', fail); resolve(c); });
    });

    let heard = performance.now(), closed = false;
    /** @param {'closed' | 'silent'} reason */
    const lost = reason => { if (closed) return; closed = true; clearInterval(watch); clearInterval(keepalive); peer.destroy(); onLost(reason); };
    conn.on('data', /** @param {PingMsg | HostMessage} msg (anything: checked here) */ msg => {
      if (!msg || typeof msg !== 'object') return;
      heard = performance.now();
      if (msg.t === 'ping') { conn.send({ t: 'pong', at: msg.at }); return; }
      onMessage(msg);
    });
    conn.on('close', () => lost('closed'));
    conn.on('error', () => lost('closed'));
    peer.on('error', err => { if (err.type !== 'network' && err.type !== 'server-error') lost('closed'); });
    const watch = setInterval(() => { if (performance.now() - heard > SILENT_MS) lost('silent'); }, 1000);
    // Lets the host notice within a moment if this browser goes quiet.
    const keepalive = setInterval(() => { if (conn.open) conn.send({ t: 'k' }); }, KEEPALIVE_MS);

    return {
      id: peer.id,
      /** @param {GuestMessage} msg */
      send(msg) { if (conn.open) conn.send(msg); },
      close() { if (closed) return; closed = true; clearInterval(watch); clearInterval(keepalive); conn.close(); peer.destroy(); },
    };
  }

  return { host, join, explain };
})();
