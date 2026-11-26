// The weather's sound: beds of filtered noise that loop under the music, and the raindrops
// (SnakeAudio.weather(kind): the API is listed in sound.js). It rides on the music's bus, so the
// music switch silences it too, and it opens and closes with the round: see music.js.
//
// Like cues.js it leaves a maker, which sound.js calls once with a kit (the music's note
// builders, and live views of the context, the music bus and the flags).
window.SnakeAudioWeather = k => {
  const { NOISE_SECONDS, LOOKAHEAD, noiseBuffer, mtone, mnoise } = k;

  // ---- The weather ----------------------------------------------------------
  //
  // Beds of filtered noise that loop under the music (on the music bus, so the
  // music switch silences them too): rain is a soft wash with drops landing
  // around you, wind gusts (its loudness swells and falls), a storm rumbles low
  // under a little rain, snow is a high, airy hush. A new kind fades in as the
  // old one fades out, and they all stop when the round does, or for a nap.
  const BEDS = {
    rain: [['lowpass', 1400, 0.4, 0.04], ['bandpass', 3400, 0.5, 0.0056]],
    wind: [['lowpass', 520, 0.9, 0.08, true]],
    storm: [['lowpass', 140, 0.8, 0.14], ['bandpass', 1500, 0.6, 0.02]],
    snow: [['highpass', 6000, 0.7, 0.012], ['lowpass', 300, 0.7, 0.02, true]],
  };
  const DRIPS = { rain: 0.16, storm: 0.6 }; // seconds between drops, on average
  let bedWanted = 'none', bedKind = 'none', bedNodes = [], bedOpen = true;
  let drip = null, dripAt = 0;      // where this bed's drops go: { left, right, middle }

  function weather(kind) {
    bedWanted = BEDS[kind] ? kind : 'none';
    syncBed();
  }

  // Bring the bed you should hear (the weather, in a round, with the music on) in, and the old one out.
  function syncBed() {
    const kind = bedOpen && k.musicOn ? bedWanted : 'none';
    if (kind === bedKind || !k.ctx || k.unsupported) return;
    bedKind = kind;
    const t = k.ctx.currentTime;
    for (const n of bedNodes) { // the old bed fades
      try {
        n.g.gain.setTargetAtTime(0, t, 0.6);
        if (n.src) n.src.stop(t + 3);
        else setTimeout(() => { for (const p of n.parts) { try { p.disconnect(); } catch { /* gone */ } } }, 3500);
      } catch { /* gone */ }
    }
    bedNodes = [];
    drip = null;
    if (kind === 'none' || !k.musicBus) return;
    for (const [type, freq, q, level, gusty] of BEDS[kind]) {
      try {
        const src = k.ctx.createBufferSource(), f = k.ctx.createBiquadFilter(), g = k.ctx.createGain();
        src.buffer = noiseBuffer(); src.loop = true;
        f.type = type; f.frequency.value = freq; f.Q.value = q;
        g.gain.value = 0;
        g.gain.setTargetAtTime(level, t, 0.8);
        src.connect(f); f.connect(g); g.connect(k.musicBus);
        if (gusty) { // the wind swells and falls
          const lfo = k.ctx.createOscillator(), depth = k.ctx.createGain();
          lfo.frequency.value = 0.13; depth.gain.value = level * 0.8;
          lfo.connect(depth); depth.connect(g.gain);
          lfo.start(t);
          src.onended = () => { try { lfo.stop(); lfo.disconnect(); depth.disconnect(); } catch { /* gone */ } };
        }
        src.start(t, Math.random() * (NOISE_SECONDS - 1));
        const prev = src.onended;
        src.onended = () => { try { prev?.(); src.disconnect(); f.disconnect(); g.disconnect(); } catch { /* gone */ } };
        bedNodes.push({ src, g });
      } catch { /* the weather stays quiet */ }
    }
    if (DRIPS[kind]) {
      // Drops land a little left, a little right and in front, all through one gain that fades with the bed.
      try {
        const g = k.ctx.createGain(), parts = [g];
        g.gain.value = 0;
        g.gain.setTargetAtTime(1, t, 0.8);
        g.connect(k.musicBus);
        bedNodes.push({ g, src: null, parts });
        drip = { left: g, right: g, middle: g };
        dripAt = t + 0.3;
        const side = pan => { const p = k.ctx.createStereoPanner(); p.pan.value = pan; p.connect(g); parts.push(p); return p; };
        drip.left = side(-0.6);
        drip.right = side(0.6);
      } catch { /* (no panners: the drops fall in front) */ }
    }
  }

  // Raindrops on leaves and bark, now and then: each a tiny falling plink, some with a tick.
  function drops() {
    if (!drip || !DRIPS[bedKind]) return;
    const gap = DRIPS[bedKind];
    if (dripAt < k.ctx.currentTime) dripAt = k.ctx.currentTime + 0.02;
    while (dripAt < k.ctx.currentTime + LOOKAHEAD) {
      const r = Math.random(), dest = r < 0.4 ? drip.left : r < 0.8 ? drip.right : drip.middle;
      const f = 1900 + Math.random() * 2600, peak = 0.004 + Math.random() * Math.random() * 0.014;
      try {
        mtone(dripAt, 'sine', f, 0.03, peak, 0.001, f * 0.62, null, dest);
        if (Math.random() < 0.4) mnoise(dripAt, 0.008, peak * 0.8, 'bandpass', 2800 + Math.random() * 2000, 2, dest);
      } catch { /* a drop missed */ }
      dripAt += gap * (0.25 - Math.log(1 - Math.random() * 0.98)); // (random, like rain: mostly short gaps, now and then a pause)
    }
  }

  // Open or close the weather for the round (it belongs to the round, and sleeps while you nap).
  function open(value) {
    bedOpen = value;
    syncBed();
  }

  return { weather, open, sync: syncBed, drops };
};
