// @ts-check
// Online play between friends: the connections. One browser hosts; friends
// connect straight to it over WebRTC data channels. Two ways introduce the
// browsers to each other, so no one free service is needed: PeerJS's free
// public broker, and several public Nostr relays (net-relays.js), which a
// room is on at once and a friend tries when the broker can't find it. Game
// traffic then goes directly between the browsers either way. Nothing
// connects until someone hosts or joins (PeerJS is loaded the first time
// someone opens "Play with friends"), so playing alone never touches the
// network.
// What net.js itself sends, beside the game's messages (online.js types those):
/**
 * @typedef {{ t: 'ping', at: number }} PingMsg  host -> guest, every PING_MS: at, the host's clock
 * @typedef {{ t: 'pong', at: number }} PongMsg  guest -> host: the ping's at, back
 * @typedef {{ t: 'k' }} KeepaliveMsg  guest -> host, every KEEPALIVE_MS: still here
 * @typedef {PingMsg | PongMsg | KeepaliveMsg} NetMessage
 */
window.SnakeNet = (() => {
  const PEERJS = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js';
  const PEERJS_SRI = 'sha512-XEKeWX+mI3Ov+tg2evDlVQFzVOIp4T8J3cNcCEPaEUGpxJV3eZaN8rHuvnFPvQpGJBHPmrozJDMpm2xcDvtmyQ==';
  const PREFIX = 'barkbite-';   // our corner of the broker's shared namespace
  const CONNECT_MS = 15000;     // give up joining after this long (on each way)
  const HEAD_START_MS = 4000;   // a friend tries the relays too if the broker hasn't connected them by then
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

  // One way alone, for trying each on a preview: ?way=broker or ?way=relays (design 22, "Connecting").
  const WAY = /[?&]way=(broker|relays)(?:&|$)/.exec(window.location?.search || '')?.[1] || '';
  const Relays = /** @type {Relays} */ (window.SnakeRelays);

  /** @type {Promise<PeerJS.PeerClass> | null} */
  let loading = null;
  /** @returns {Promise<PeerJS.PeerClass>} */
  function load() {
    if (window.Peer) return Promise.resolve(window.Peer);
    // (a file that never comes is the library's failure, not the broker's)
    return inTime(loading ||= new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PEERJS;
      s.integrity = PEERJS_SRI;
      s.crossOrigin = 'anonymous';
      s.onload = () => { if (window.Peer) resolve(window.Peer); else { loading = null; reject(new Error('library')); } };
      s.onerror = () => { loading = null; s.remove(); reject(new Error('library')); };
      document.head.append(s);
    })).catch(err => { throw err?.type === 'timeout' ? new Error('library') : err; });
  }

  // Why a connection failed, in words for the card: which part failed, finding each other (neither
  // the broker nor the relays, or no room behind the code) or the route between the two browsers
  // (the room answered, but no network path let the connection through: STUN found none, and
  // there's no TURN relay).
  /** @param {any} err */
  function explain(err) {
    const type = err?.type || err?.message;
    if (type === 'library') return 'Online play didn’t load. Are you connected?';
    if (type === 'peer-unavailable') return 'There’s no room with that code. Check it, or ask for a fresh link.';
    if (type === 'unanswered') return 'Couldn’t find each other: the room didn’t answer. Ask the host to check the game is still open, then try again.';
    if (type === 'route') return 'Found the room, but couldn’t connect: one of your networks blocks direct connections, as some offices, schools and mobile carriers do. One of you could try another network, such as mobile data.';
    if (type === 'browser-incompatible') return 'This browser can’t play with friends. Try a recent Chrome, Firefox or Safari.';
    return 'Couldn’t find each other: none of the services that introduce players answered. Check your connection, or try again in a minute.';
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

  // Host a room, on the broker and the relays at once. newCode() makes room codes; one taken on the
  // broker is replaced (up to 4 tries). Callbacks: onLeave(id), onMessage(id, msg), and optionally
  // onJoin(id) (a connection opened; it's admitted once its hello is accepted) and onLost(err) (the
  // room itself failed on the broker with no relay to carry it; friends already connected may well
  // stay connected).
  /**
   * @param {{ newCode: () => string, onJoin?: (id: string) => void, onLeave: (id: string) => void,
   *   onMessage: (id: string, msg: GuestMessage) => void, onLost?: (err: PeerJS.Err) => void }} callbacks
   */
  async function host({ newCode, onJoin, onLeave, onMessage, onLost }) {
    /** @type {Map<string, { conn: PeerJS.DataConnection, rtt: number, heard: number, admitted: boolean, since: number }>} */
    const friends = new Map();
    const ADMIT_MS = 5000, MAX_CONNECTIONS = 8;

    // A friend's connection, whichever way it came.
    /** @param {PeerJS.DataConnection} conn */
    const accept = conn => {
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
    };
    const room = await openRoom(newCode, accept, onLost);

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
      code: room.code,
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
      close() { clearInterval(pinger); for (const f of friends.values()) f.conn.close(); friends.clear(); room.close(); },
    };
  }

  // The room under one code on every way at once; resolves as soon as one way has it, the other
  // carrying on. A code the broker says is taken before then is replaced on both. Rejects if
  // neither way can be reached.
  /**
   * @param {() => string} newCode @param {(conn: PeerJS.DataConnection) => void} accept
   * @param {((err: PeerJS.Err) => void) | undefined} onLost @returns {Promise<{ code: string, close(): void }>}
   */
  async function openRoom(newCode, accept, onLost) {
    for (let tries = 0; ; tries++) {
      const code = newCode(), name = PREFIX + code.toLowerCase();
      /** @type {PeerJS.Peer | null} */
      let peer = null;
      /** @type {{ close(): void } | null} */
      let relays = null;
      let closed = false;
      const close = () => { closed = true; peer?.destroy(); relays?.close(); };
      const broker = WAY === 'relays' ? Promise.reject({ type: 'skipped' }) : load().then(Peer => openPeer(Peer, name)).then(p => {
        if (closed) { p.destroy(); return; }
        peer = p;
        p.on('connection', accept);
        // Losing the broker doesn't affect friends already connected; reconnect so
        // new ones can still find the room.
        p.on('disconnected', () => { if (!p.destroyed) setTimeout(() => !p.destroyed && p.reconnect(), 1000); });
        p.on('error', err => { if (err.type === 'network' || err.type === 'server-error') return; if (!relays) onLost?.(err); });
      });
      const relay = WAY === 'broker' ? Promise.reject({ type: 'skipped' }) : Relays.listen(name, ICE_SERVERS, accept).then(r => {
        if (closed) r.close(); else relays = r;
      });
      /** @type {any[]} */
      const errors = [];
      const outcome = await new Promise(resolve => {
        /** @param {any} err */
        const no = err => { errors.push(err); if (err?.type === 'unavailable-id') resolve('taken'); else if (errors.length === 2) resolve('none'); };
        broker.then(() => resolve('open'), no);
        relay.then(() => resolve('open'), no);
      });
      if (outcome === 'open') return { code, close };
      close();
      if (outcome === 'taken' && tries < 3) continue;
      throw errors.find(e => e?.type === 'unavailable-id' || e?.type === 'browser-incompatible') || errors.find(e => e?.type !== 'skipped') || errors[0];
    }
  }

  // Join a room by its code, the broker first and the relays as well once the broker fails to find
  // it or HEAD_START_MS go by. Callbacks: onMessage(msg), onLost(reason). Resolves once connected;
  // rejects with words for the card if it can't.
  /** @param {string} code @param {{ onMessage: (msg: HostMessage) => void, onLost: (reason: 'closed' | 'silent') => void }} callbacks */
  async function join(code, { onMessage, onLost }) {
    const way = await reach(PREFIX + code.toLowerCase());
    const conn = way.conn;

    let heard = performance.now(), closed = false;
    /** @param {'closed' | 'silent'} reason */
    const lost = reason => { if (closed) return; closed = true; clearInterval(watch); clearInterval(keepalive); way.end(); onLost(reason); };
    conn.on('data', /** @param {PingMsg | HostMessage} msg (anything: checked here) */ msg => {
      if (!msg || typeof msg !== 'object') return;
      heard = performance.now();
      if (msg.t === 'ping') { conn.send({ t: 'pong', at: msg.at }); return; }
      onMessage(msg);
    });
    conn.on('close', () => lost('closed'));
    conn.on('error', () => lost('closed'));
    way.onTrouble?.(() => lost('closed'));
    const watch = setInterval(() => { if (performance.now() - heard > SILENT_MS) lost('silent'); }, 1000);
    // Lets the host notice within a moment if this browser goes quiet.
    const keepalive = setInterval(() => { if (conn.open) conn.send({ t: 'k' }); }, KEEPALIVE_MS);

    return {
      id: way.id,
      /** @param {GuestMessage} msg */
      send(msg) { if (conn.open) conn.send(msg); },
      close() { if (closed) return; closed = true; clearInterval(watch); clearInterval(keepalive); conn.close(); way.end(); },
    };
  }

  /** @typedef {{ id: string, conn: PeerJS.DataConnection, end(): void, onTrouble?: (fn: () => void) => void }} Way */

  // Every way in at once, the broker with a head start: the first channel open wins and any other
  // is closed. A room the broker reached but couldn't route to isn't tried on the relays (their
  // route is the same). Rejects with the words of the most telling failure.
  /** @param {string} name @returns {Promise<Way>} */
  function reach(name) {
    return new Promise((resolve, reject) => {
      /** @type {any[]} */
      const fails = [];
      let trying = 0, relaysTried = WAY === 'broker', done = false;
      /** @param {any} err */
      const end = err => { done = true; clearTimeout(head); reject(new Error(explain(err))); };
      /** @param {Way} way */
      const won = way => { if (done) { way.end(); return; } done = true; clearTimeout(head); resolve(way); };
      /** @param {any} err */
      const lost = err => {
        fails.push(err);
        trying--;
        if (done) return;
        if (err?.type === 'route' && !trying) return end(err);
        if (!relaysTried) relays();
        else if (!trying) end(worst(fails));
      };
      const relays = () => {
        if (relaysTried || done) return;
        relaysTried = true;
        trying++;
        Relays.connect(name, ICE_SERVERS, CONNECT_MS).then(({ id, conn }) => won({ id, conn, end: () => conn.close() }), lost);
      };
      if (WAY !== 'relays') { trying++; viaBroker(name).then(won, lost); }
      const head = setTimeout(relays, WAY === 'relays' ? 0 : HEAD_START_MS);
    });
  }
  // The failure that says most: the browser can't, the route, no room, a room silent, the file
  // that didn't load, and only then the services out of reach.
  /** @param {any[]} fails */
  const worst = fails => {
    for (const type of ['browser-incompatible', 'route', 'peer-unavailable', 'unanswered', 'library']) {
      const f = fails.find(e => (e?.type || e?.message) === type);
      if (f) return f;
    }
    return fails[0];
  };

  // Through PeerJS's broker. The room answered once ICE starts checking routes (the host's answer
  // and candidates came through the broker); a failure after that is the route's, before it the
  // room's. Rejects with { type } (or PeerJS's own error).
  /** @param {string} name @returns {Promise<Way>} */
  async function viaBroker(name) {
    const peer = await openPeer(await load());
    const conn = await new Promise(/** @param {(c: PeerJS.DataConnection) => void} resolve */ (resolve, reject) => { // (it has its own time limit)
      const c = peer.connect(name, { serialization: 'json', reliable: true });
      let answered = false;
      const failed = () => fail({ type: answered ? 'route' : 'unanswered' });
      const timer = setTimeout(failed, CONNECT_MS);
      /** @param {PeerJS.Err} err */
      function fail(err) { clearTimeout(timer); peer.destroy(); reject(err); }
      peer.once('error', fail);
      /** @param {RTCIceConnectionState} state */
      const onIce = state => { if (state !== 'new') answered = true; if (state === 'failed') failed(); };
      c.on('iceStateChanged', onIce);
      c.once('open', () => { clearTimeout(timer); peer.off('error', fail); c.off('iceStateChanged', onIce); resolve(c); });
    });
    return {
      id: peer.id, conn,
      end: () => peer.destroy(),
      onTrouble: fn => peer.on('error', err => { if (err.type !== 'network' && err.type !== 'server-error') fn(); }),
    };
  }

  return { host, join, explain };
})();
