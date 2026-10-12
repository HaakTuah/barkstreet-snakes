// Online play between friends: the connections. One browser hosts; friends
// connect straight to it over WebRTC data channels. PeerJS's free public
// broker only introduces the browsers to each other; game traffic then goes
// directly between them. PeerJS is loaded the first time someone opens
// "Play with friends", so playing alone never touches the network.
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

  let loading = null;
  function load() {
    if (window.Peer) return Promise.resolve(window.Peer);
    return (loading ||= new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PEERJS;
      s.integrity = PEERJS_SRI;
      s.crossOrigin = 'anonymous';
      s.onload = () => (window.Peer ? resolve(window.Peer) : reject(new Error('library')));
      s.onerror = () => { loading = null; s.remove(); reject(new Error('library')); };
      document.head.append(s);
    }));
  }

  // Why a connection failed, in words for the card.
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
  function openPeer(Peer, id) {
    return new Promise((resolve, reject) => {
      const peer = id ? new Peer(id, peerOptions()) : new Peer(peerOptions());
      const fail = err => { peer.off('open', ok); peer.destroy(); reject(err); };
      const ok = () => { peer.off('error', fail); resolve(peer); };
      peer.once('open', ok);
      peer.once('error', fail);
    });
  }

  // Host a room. newCode() makes room codes; a taken one is replaced (up to 4 tries).
  // Callbacks: onJoin(id), onLeave(id), onMessage(id, msg), onLost(err).
  async function host({ newCode, onJoin, onLeave, onMessage, onLost }) {
    const Peer = await load();
    let peer, code;
    for (let tries = 0; !peer; tries++) {
      code = newCode();
      try { peer = await openPeer(Peer, PREFIX + code.toLowerCase()); } catch (err) {
        if (err?.type !== 'unavailable-id' || tries >= 3) throw err;
      }
    }
    const friends = new Map(); // id -> { conn, rtt, heard }

    peer.on('connection', conn => {
      conn.on('open', () => {
        friends.set(conn.peer, { conn, rtt: 0, heard: performance.now() });
        onJoin(conn.peer);
      });
      conn.on('data', msg => {
        const f = friends.get(conn.peer);
        if (!f || !msg || typeof msg !== 'object') return;
        f.heard = performance.now();
        if (msg.t === 'k') return; // still here
        if (msg.t === 'pong') { const rtt = performance.now() - msg.at; f.rtt = f.rtt ? f.rtt * 0.7 + rtt * 0.3 : rtt; return; }
        onMessage(conn.peer, msg);
      });
      const gone = () => { if (friends.delete(conn.peer)) onLeave(conn.peer); };
      conn.on('close', gone);
      conn.on('error', gone);
    });
    // Losing the broker doesn't affect friends already connected; reconnect so
    // new ones can still find the room.
    peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => !peer.destroyed && peer.reconnect(), 1000); });
    peer.on('error', err => { if (err.type === 'network' || err.type === 'server-error') return; onLost?.(err); });

    const pinger = setInterval(() => {
      const now = performance.now();
      for (const [id, f] of friends) {
        if (now - f.heard > GONE_MS) { friends.delete(id); f.conn.close(); onLeave(id); continue; }
        if (f.conn.open) f.conn.send({ t: 'ping', at: now });
      }
    }, PING_MS);

    const send = (id, msg) => { const f = friends.get(id); if (f?.conn.open) f.conn.send(msg); };
    return {
      code,
      send,
      broadcast(msg) { for (const f of friends.values()) if (f.conn.open) f.conn.send(msg); },
      // How long since we last heard from a friend (ms): a quiet one may have lost their connection.
      quietFor(id) { const f = friends.get(id); return f ? performance.now() - f.heard : Infinity; },
      // The average round-trip time to friends (ms), for evening out the host's head start.
      rtt() { let sum = 0, n = 0; for (const f of friends.values()) if (f.rtt) { sum += f.rtt; n++; } return n ? sum / n : 0; },
      drop(id) { const f = friends.get(id); if (f) { friends.delete(id); f.conn.close(); } },
      close() { clearInterval(pinger); for (const f of friends.values()) f.conn.close(); friends.clear(); peer.destroy(); },
    };
  }

  // Join a room by its code. Callbacks: onMessage(msg), onLost(reason).
  // Resolves once connected; rejects with words for the card if it can't.
  async function join(code, { onMessage, onLost }) {
    let Peer;
    try { Peer = await load(); } catch (err) { throw new Error(explain(err)); }
    let peer;
    try { peer = await openPeer(Peer); } catch (err) { throw new Error(explain(err)); }
    const conn = await new Promise((resolve, reject) => {
      const c = peer.connect(PREFIX + code.toLowerCase(), { serialization: 'json', reliable: true });
      const timer = setTimeout(() => fail({ type: 'timeout' }), CONNECT_MS);
      function fail(err) { clearTimeout(timer); peer.destroy(); reject(new Error(explain(err))); }
      peer.once('error', fail);
      c.once('open', () => { clearTimeout(timer); peer.off('error', fail); resolve(c); });
    });

    let heard = performance.now(), closed = false;
    const lost = reason => { if (closed) return; closed = true; clearInterval(watch); clearInterval(keepalive); peer.destroy(); onLost(reason); };
    conn.on('data', msg => {
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
      send(msg) { if (conn.open) conn.send(msg); },
      close() { if (closed) return; closed = true; clearInterval(watch); clearInterval(keepalive); conn.close(); peer.destroy(); },
    };
  }

  return { host, join, explain };
})();
