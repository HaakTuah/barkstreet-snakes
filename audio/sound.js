// Sound for Barkstreet Snakes: a tiny Web Audio synthesiser with no audio files.
// (The cues themselves are in audio/cues.js, loaded first: see there for the files.)
// Every cue is built from three soft, woody ingredients: a marimba-like mallet
// note, a wood-block knock, and a pinch of filtered noise. Envelopes are short,
// and everything runs through one gentle compressor so nothing ever gets harsh.
//
//   SnakeAudio.unlock()           call from a key press or tap (browsers keep sound locked until then)
//   SnakeAudio.play(name, opts)   never throws; opts = {
//                                   pitch: semitones, volume: 0..1, pan: -1..1 (left..right),
//                                   rival: true (a rival's: softer, further off, and it gives way to yours),
//                                   streak: 0..7 (apples in a row: the pluck climbs a pentatonic scale),
//                                   gold: true (a golden pickup: a sparkle over the cue),
//                                   crest: seconds (the riser: how long it rises),
//                                   delay: seconds, 0..1 (it sounds that much later, on the audio clock),
//                                   the drum: strike (which of the round's, from 0), from: ms (into it already), rate (watched faster),
//                                   the knock: land: seconds (how long the piece it's for is in the air, as drawn),
//                                   the call: settle: true (one "kik!", the bird back on its perch) }
//   SnakeAudio.drumBlows(strike)  when each knock of the woodpecker's drum comes, ms from the first (each a blow you see)
//   SnakeAudio.setMuted(b) / isMuted() / toggleMuted()   remembered in this browser
//   SnakeAudio.music(stage, mood)  the adaptive track (see the music section below)
//   SnakeAudio.weather(kind)       the weather you can hear: 'rain', 'wind', 'storm', 'snow' or anything else for none
//   SnakeAudio.setMusicOn(b) / isMusicOn() / toggleMusic()  remembered in this browser
//   SnakeAudio.play('babble', { voice, chars, tight, pan })  a rival's bubble: a burble in its own voice (see BABBLERS)
//   SnakeAudio.setVoicesOn(b) / isVoicesOn() / toggleVoices()  the babble's own switch, remembered in this browser
//
// The context is made at load and sleeps until the first key or tap; it sleeps
// again while the sound's muted or the tab is hidden.
window.SnakeAudio = (() => {
  // ---- Tuning ---------------------------------------------------------------
  const MASTER_VOLUME = 0.5;   // overall loudness, before the compressor
  // Cues sounding at once. Your own come first, then rivals', then the world's
  // (weather, the woodpecker, beetles): each gives way sooner than the one before.
  const MAX_VOICES = { you: 7, rival: 6, world: 5 };
  const PRIORITY = { death: true, best: true, win: true, winBest: true, ko: true, stinger: true }; // these always play
  const WORLD = { beetle: 1, crackle: 1, thunder: 1, gust: 1, burrow: 1, heal: 1, scrabble: 1, dig: 1, knock: 1, rainbow: 1, rain: 1, snow: 1, ember: 1, woodpecker: 1, call: 1, aim: 1, drum: 1, crash: 1, peck: 1, bake: 1, ash: 1, douse: 1, lastApples: 1 };
  const RIVALS = { rivalDeath: 1, bonked: 1 };
  const RIVAL_VOLUME = 0.5;    // a rival's leap or dash, next to yours...
  const RIVAL_LOWPASS = 2600;  // ...and a little duller, as if further off
  // A rival feeding: its own chomp for what it ate, as yours is, but softer still (this much of a rival's
  // leap or dash: about a third of your own chomp, dulled), and never a pile-up: one rival's chomp at a
  // time, CHOMP_GAP apart whoever ate, and none while your own is sounding (CHOMP_YIELD after yours).
  // Yours never waits on theirs.
  const CHOMPS = { eat: 1, golden: 1, meat: 1, mushroom: 1, crunch: 1, leaf: 1 };
  const RIVAL_CHOMP = 0.6;
  const CHOMP_GAP = 180;
  const CHOMP_YIELD = 350;
  // A rival's bubble: a short burble in its own voice (BABBLERS), never distracting. A rival's (dulled,
  // further off), BABBLE_LEVEL of its other sounds, and BABBLE_HUSH quieter still at the tensest (tight:
  // the danger the music hears); at most BABBLE_MAX seconds whatever the line's length; one at a time, at
  // most one every few seconds (its MIN_INTERVAL, whoever speaks); none starts within BABBLE_YIELD of your
  // own sound or the loudest of the world's (HUSHED_BY), and one sounding is cut short by them.
  const BABBLE_LEVEL = 0.6;
  const BABBLE_HUSH = 0.5;
  const BABBLE_MAX = 0.5;
  const BABBLE_YIELD = 700;
  const HUSHED_BY = { crash: 1, thunder: 1, drum: 1, knock: 1 }; // (and every cue of your own)
  // Shortest gap in ms between two plays of the same cue, so bursts don't stack up.
  // A rival's keeps its gap from rivals' and from yours; yours, only from your own
  // (a rival's flash never swallows yours). A dash's is well under the fastest tick, and a
  // jump's under two (it lands first), a 30 Hz screen's frame and all: your golden dashes
  // or jumps on each other's heels are each heard.
  const MIN_INTERVAL = {
    eat: 40, golden: 60, meat: 60, mushroom: 80, crunch: 80, beetle: 3000, leaf: 60,
    rivalDeath: 120, death: 250, best: 400, win: 600, winBest: 600,
    beat: 80, go: 80, woodpecker: 400, peck: 340, hungry: 1200, hungerWarn: 1500, ui: 30, // peck: never more than 3 in any second
    crackle: 300, thunder: 900, gust: 1500, burrow: 1000, scrabble: 250, rainbow: 1500, rain: 1500,
    ko: 200, close: 1400, field: 800, bonk: 150, bigBonk: 300, bonked: 300, leap: 120, thunk: 250, dash: 50, douse: 300, wrap: 1500, boom: 300, ready: 600, alight: 400, singe: 200, bake: 400, ash: 400, snip: 300, drum: 300, crash: 300, aim: 400, call: 2000, snow: 1500, ember: 250, riser: 1500, stinger: 1500,
    flash: 150, flashReady: 600, lastApples: 4000,
    babble: 4000, // (whoever speaks: never two at once, at most one every few seconds; bubbles come more often, so most are silent)
    choke: 300, squash: 50,
    dig: 300, knock: 400, // (a beetle digs in again only after a spell under, the woodpecker strikes again only after a rest and an aim: each is heard; beetles digging in together, or the pieces one strike knocks aside, are one sound)
    heal: 400, // (a burrow closes over only for a dig's new one: two digs ending together, one crumble)
  };
  // A cue that stands for others for a while: a win that's also a best is one phrase.
  const COVERS = { winBest: { win: 6000, best: 6000 } };
  const CUTS_SHORT = { go: 'riser' };        // a cue that cuts another short (the riser lands on Go)
  const CUT_SHORT = { riser: true, babble: true }; // (a babble: by your own sounds, see HUSHED_BY)
  const DUCKS = { win: 1.2, best: 0.8, winBest: 1.6 }; // the music steps back under a fanfare (seconds)
  const RESUME_GRACE = 500;    // ms in which cues asked for while the context wakes still play once it runs
  const LEAD = 0.005;          // seconds from asking to sounding
  const NOISE_SECONDS = 4;     // the one shared noise buffer: long enough that long layers never repeat
  const MUTED_KEY = 'barkbite-muted';
  const MUSIC_KEY = 'barkbite-music';
  const VOICES_KEY = 'barkbite-voices';
  const MUSIC_VOLUME = 0.55;   // the track, relative to the sound effects
  const IDLE_MS = 60000;       // the title loop fades after this long with nobody at the keys...
  const IDLE_STOP_MS = 15000;  // ...and stops this long after
  // ---------------------------------------------------------------------------

  let ctx = null;              // the one AudioContext, made at load
  let master = null;           // master gain -> compressor -> speakers
  let musicBus = null;         // the track's own gain...
  let duck = null;             // ...through a duck (fanfares), into master
  let musicOn = readFlag(MUSIC_KEY, true);
  let voicesOn = readFlag(VOICES_KEY, true); // (the babble: see BABBLE_LEVEL)
  let noiseBuf = null;         // built in idle time, or on first use
  let unsupported = false;
  let primed = false;          // a gesture has unlocked sound at least once
  let wokenAt = -Infinity;     // when the context was last asked to wake
  let waking = [];             // cues asked for while it wakes: [{ name, opts, at }]
  let dozeTimer = 0;
  let lastActive = -Infinity;  // the last key, tap or click (unlock() hears them all)
  let muted = readMuted();

  let voices = 0;              // cues still sounding
  let generation = 0;          // bumped when the voice count is reset, so late 'ended' events can't skew it
  let lastEnd = 0;             // context time when the last scheduled sound stops
  let building = null;         // the cue being scheduled right now: { pending, gen, nodes, end }
  const lastPlayed = {};       // cue name (a rival's play: name + '~') -> ms timestamp (see MIN_INTERVAL)
  const coveredUntil = {};     // cue name -> ms timestamp (see COVERS)
  const sounding = {};         // cue name -> { voice, end } of its latest play (see CUTS_SHORT)
  let yourChomp = -Infinity, rivalChomp = -Infinity; // ms of the last chomp, yours and any rival's (see CHOMPS)
  let hushAt = -Infinity;      // ms of your last sound, or the world's loudest (see BABBLE_YIELD)

  // The pitch and volume of the cue being built; tone() and noise() apply them.
  let pitchMul = 1;
  let volMul = 1;
  let out = null; // where the cue being built goes: its own little chain into the master
  let edgeOut = null; // ...and, for a rival's, where its edge goes (round its dulling: see edge)

  const NO_OPTS = {};
  const now = () => (window.performance && window.performance.now ? window.performance.now() : Date.now());
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const hidden = () => typeof document !== 'undefined' && !!document.hidden;
  const awake = () => !muted && !hidden();
  const later = fn => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300));
  // Resume or suspend the context, ignoring a refusal (old Safari returns no promise at all).
  const quietly = fn => { try { const p = fn(); if (p && p.catch) p.catch(() => {}); } catch { /* stays as it was */ } };

  function readFlag(key, fallback) {
    try { const v = window.localStorage.getItem(key); return v == null ? fallback : v === '1'; } catch { return fallback; }
  }

  function readMuted() {
    try { return window.localStorage.getItem(MUTED_KEY) === '1'; } catch { return false; }
  }

  function saveMuted() {
    try { window.localStorage.setItem(MUTED_KEY, muted ? '1' : '0'); } catch { /* storage unavailable */ }
  }

  // ---- Setup ----------------------------------------------------------------

  // Made at load, so the first key press doesn't wait for it (it took 25-110 ms),
  // and asleep until that key press: nothing plays before one.
  function create() {
    if (ctx) return true;
    if (unsupported) return false;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { unsupported = true; return false; }
      // Build everything first, and only keep the context once it's all there.
      const c = new AC();

      // A soft compressor catches the odd pile-up (four snakes eating at once) before it can clip.
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 18;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      comp.connect(c.destination);

      const m = c.createGain();
      m.gain.value = muted ? 0 : MASTER_VOLUME;
      m.connect(comp);

      const d = c.createGain();
      d.gain.value = 1;
      d.connect(m);

      const mb = c.createGain();
      mb.gain.value = musicOn ? MUSIC_VOLUME : 0;
      mb.connect(d);

      ctx = c; master = m; duck = d; musicBus = mb; out = m;
      ctx.onstatechange = flushWaking;
      if (c.state === 'running' && c.suspend) quietly(() => c.suspend());
      later(noiseBuffer);
      return true;
    } catch {
      return false;
    }
  }

  // White noise, made once and shared by every cue that needs a "tok" or a puff, and by the weather.
  function noiseBuffer() {
    if (!noiseBuf && ctx) {
      const len = Math.floor(ctx.sampleRate * NOISE_SECONDS);
      const nb = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = nb.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      noiseBuf = nb;
    }
    return noiseBuf;
  }

  function unlock() {
    lastActive = now();
    if (!create()) return false;
    try {
      // iOS only opens the speakers once something has played inside a gesture: one silent sample.
      if (!primed) {
        primed = true;
        const src = ctx.createBufferSource();
        src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        src.connect(ctx.destination);
        src.onended = () => src.disconnect();
        src.start(0);
      }
      if (awake()) wake();
      return true;
    } catch {
      return false;
    }
  }

  // Ask a sleeping context to run (from a gesture, or the tab coming back).
  function wake() {
    if (!ctx || ctx.state === 'running' || ctx.state === 'closed') return;
    wokenAt = now();
    quietly(() => ctx.resume());
  }

  // The context sleeps while the sound's muted or the tab is hidden (no hiss from
  // a background tab, and a phone saves its battery), fading out first so nothing
  // is cut with a click, and wakes when both are over.
  function settle() {
    if (!ctx) return;
    clearTimeout(dozeTimer);
    try {
      if (awake()) {
        master.gain.setTargetAtTime(MASTER_VOLUME, ctx.currentTime, 0.02);
        if (primed) wake();
      } else {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
        dozeTimer = setTimeout(() => {
          if (!awake() && ctx.state === 'running' && ctx.suspend) quietly(() => ctx.suspend());
        }, 150);
      }
    } catch { /* stays as it was */ }
  }
  try { document.addEventListener('visibilitychange', settle); } catch { /* no document */ }

  // Cues asked for while the context woke (the key press that woke it, the tap after
  // unmuting) play once its clock runs, so they come out whole.
  function flushWaking() {
    if (!ctx || ctx.state !== 'running' || !waking.length) return;
    const due = waking;
    waking = [];
    for (const w of due) if (now() - w.at < RESUME_GRACE) start(w.name, w.opts);
  }

  // ---- Building blocks ------------------------------------------------------

  // Stop a started source at `end` and unplug its little chain when it finishes.
  // The cue it belongs to stops counting as a voice when its last source ends.
  function finish(src, end, a, b) {
    const owner = building;
    owner.pending++;
    if (end > owner.end) owner.end = end;
    if (end > lastEnd) lastEnd = end;
    src.onended = () => {
      try { src.disconnect(); if (a) a.disconnect(); if (b) b.disconnect(); } catch { /* already gone */ }
      if (--owner.pending === 0) {
        for (const n of owner.nodes) { try { n.disconnect(); } catch { /* gone */ } }
        if (owner.gen === generation) voices = Math.max(0, voices - 1);
      }
    };
    src.stop(end);
  }

  // Quick rise to `peak`, then an exponential fall to silence: the shape of anything struck.
  // It starts from silence (a gain is 1 until its first event, and a source can start
  // a sample before that event lands: a click).
  function envelope(g, t, peak, attack, dur) {
    g.gain.value = 0;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  // One oscillator through an envelope, optionally sliding to `toFreq` and shaped by a
  // filter: a lowpass (a number), or { type, freq, q } (a bandpass gives a body a phone can play).
  function tone(t, type, freq, dur, peak, attack, toFreq, filter) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    shape(osc, type);
    osc.frequency.setValueAtTime(freq * pitchMul, t);
    if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq * pitchMul, t + dur);
    envelope(g, t, peak * volMul, attack, dur);
    let f = null;
    if (filter) {
      f = ctx.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.frequency.value = (filter.freq || filter) * pitchMul;
      f.Q.value = filter.q || 0.5;
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(out || master);
    osc.start(t);
    finish(osc, t + dur + 0.03, g, f);
    return osc;
  }

  // A slice of the shared noise through one filter: the "tok" of wood, a crunch, a puff of air.
  function noise(t, dur, peak, type, freq, q) {
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noiseBuffer();
    f.type = type;
    f.frequency.value = freq * pitchMul;
    f.Q.value = q;
    envelope(g, t, peak * volMul, 0.003, dur);
    src.connect(f);
    f.connect(g);
    g.connect(out || master);
    src.start(t, Math.random() * Math.max(0, NOISE_SECONDS - dur - 0.05));
    finish(src, t + dur + 0.03, f, g);
  }

  // Air rushing past: noise that swells in and dies away, through a ringing lowpass
  // sweeping up from `from` to `to` Hz (a whoosh, where noise() is a puff).
  function whoosh(t, dur, peak, from, to) {
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noiseBuffer();
    f.type = 'lowpass';
    f.Q.value = 4;
    f.frequency.setValueAtTime(from * pitchMul, t);
    f.frequency.exponentialRampToValueAtTime(to * pitchMul, t + dur * 0.7);
    envelope(g, t, peak * volMul, dur * 0.35, dur);
    src.connect(f);
    f.connect(g);
    g.connect(out || master);
    src.start(t, Math.random() * Math.max(0, NOISE_SECONDS - dur - 0.05));
    finish(src, t + dur + 0.03, f, g);
  }

  // Marimba-ish note: a sine plus the quiet, slightly flat 4th-harmonic "bar" overtone,
  // which dies first. That overtone is what makes it sound like wood instead of a beep.
  // (bright: how hard the mallet was, 1 by default.)
  function mallet(t, freq, dur, peak, bright = 1) {
    tone(t, 'sine', freq, dur, peak, 0.004);
    tone(t, 'sine', freq * 3.93, dur * (0.22 + 0.08 * bright), peak * 0.2 * bright, 0.002);
  }

  // Wood block: a short triangle that drops in pitch as it dies, plus a tick of bandpassed noise.
  function knock(t, freq, peak) {
    tone(t, 'triangle', freq * 1.4, 0.07, peak, 0.001, freq, freq * 3);
    noise(t, 0.02, peak * 0.45, 'bandpass', freq * 2.2, 4);
  }

  // A cue's edge: the few high grains it's known by. In a rival's cue they go
  // round its dulling (as soft as the rest of it), so the cue keeps a little
  // bite that carries over the music, as a sound far off still does; in yours
  // they go with the rest.
  function edge(fn) {
    const was = out;
    if (edgeOut) out = edgeOut;
    try { fn(); } finally { out = was; }
  }

  // A muffled drum (a hand on the skin keeps it short): a low skin that sags in pitch,
  // its thud of air, and the skin's hollow middle, which is what a phone hears.
  function tom(t, freq, peak) {
    tone(t, 'sine', freq * 1.5, 0.2, peak, 0.002, freq);
    body(t, freq * 1.2, 0.14, peak * 0.7, 0.002, freq, freq * 5, 1);
    noise(t, 0.05, peak * 0.35, 'lowpass', 600, 0.7);
  }

  // The midrange a low sound needs on a phone or laptop speaker, which can't play
  // much under 300 Hz: the same note's upper harmonics through a band, so the ear
  // still hears the low note (as it does a bass line on a small radio).
  function body(t, freq, dur, peak, attack, toFreq, band, q = 1.1) {
    tone(t, 'body', freq, dur, peak, attack, toFreq, { type: 'bandpass', freq: band, q });
  }

  // An oscillator's waveform: one of the built-in ones, or 'body': the 2nd to 6th harmonics
  // only (no fundamental, and nothing sharp above them, so a body never buzzes or cracks).
  let bodyWave = null;
  function shape(osc, type) {
    if (type !== 'body') { osc.type = type; return; }
    bodyWave ||= ctx.createPeriodicWave(new Float32Array(7), new Float32Array([0, 0, 1, 0.8, 0.6, 0.4, 0.25]));
    osc.setPeriodicWave(bodyWave);
  }

  // Wobble an oscillator's pitch, fading the wobble out over `dur`.
  function vibrato(osc, t, dur, rate, depth) {
    const lfo = ctx.createOscillator();
    const g = ctx.createGain();
    lfo.frequency.value = rate;
    g.gain.value = 0;
    g.gain.setValueAtTime(depth * pitchMul, t);
    g.gain.linearRampToValueAtTime(0, t + dur);
    lfo.connect(g);
    g.connect(osc.frequency);
    lfo.start(t);
    finish(lfo, t + dur + 0.03, g);
  }

  // Gold: a run of tiny bells at the top of the scale and a shimmer hanging after them.
  // It's the sound of a golden pickup, over whatever else it is.
  function sparkle(t, level) {
    [100, 103, 105, 108].forEach((m, i) => tone(t + i * 0.032, 'sine', mtof(m), 0.2, 0.05 * level, 0.002));
    const s = tone(t + 0.1, 'sine', mtof(112), 0.36, 0.022 * level, 0.03);
    vibrato(s, t + 0.1, 0.36, 11, 70);
  }

  // ---- The cues ---------------------------------------------------------------
  // In audio/cues.js: made here, with a kit of the building blocks and live views
  // of what changes (the context, the cue being built, and where it goes).
  const { CUES, BABBLERS, drumBlows, newRound } = window.SnakeAudioCues({
    BABBLE_MAX, mtof, tone, noise, whoosh, mallet, knock, edge, tom, body, vibrato, sparkle,
    get ctx() { return ctx; },
    get building() { return building; },
    get out() { return out; },
    set out(v) { out = v; },
  });
  delete window.SnakeAudioCues;

  // ---- Playing --------------------------------------------------------------

  function play(name, opts) {
    if (!CUES[name] || !ctx || muted) return;
    if (name === 'go') goAt = now(); // (the round's music starts on it)
    if (ctx.state !== 'running') {
      // Waking up (the key press that unlocked it, a tap just after unmuting): it waits for the clock.
      if (now() - wokenAt < RESUME_GRACE && waking.length < 4) waking.push({ name, opts, at: now() });
      return;
    }
    start(name, opts);
  }

  function start(name, opts) {
    const cue = CUES[name];
    const babble = name === 'babble';
    const o = babble ? { ...opts, rival: true } : opts || NO_OPTS; // (only rivals babble)
    if (babble && (!voicesOn || !BABBLERS[o.voice] || now() - hushAt < BABBLE_YIELD)) return; // (Mute's silence holds no one else's back)
    const ms = now();
    const key = o.rival ? name + '~' : name, gap = MIN_INTERVAL[name] || 0;
    if (ms - (lastPlayed[key] ?? -Infinity) < gap || ms - (lastPlayed[name] ?? -Infinity) < gap || ms < (coveredUntil[name] || 0)) return;
    const chomp = !!CHOMPS[name], theirs = chomp && !!o.rival;
    if (theirs && (ms - rivalChomp < CHOMP_GAP || ms - yourChomp < CHOMP_YIELD)) return;

    // If onended never arrived (it can go missing), the clock still tells us everything has stopped.
    if (voices > 0 && ctx.currentTime > lastEnd + 0.5) { voices = 0; generation++; }
    const tier = o.rival || RIVALS[name] ? 'rival' : WORLD[name] ? 'world' : 'you';
    if (voices >= MAX_VOICES[tier] && !PRIORITY[name]) return;

    const pitch = Number.isFinite(o.pitch) ? Math.max(-24, Math.min(24, o.pitch)) : 0;
    const volume = Number.isFinite(o.volume) ? Math.min(1, Math.max(0, o.volume)) : 1;
    if (volume <= 0) return;
    const delay = Number.isFinite(o.delay) ? Math.max(0, Math.min(1, o.delay)) : 0;

    lastPlayed[key] = ms;
    if (chomp) { if (theirs) rivalChomp = ms; else yourChomp = ms; }
    const hushes = tier === 'you' || !!HUSHED_BY[name];
    if (hushes) hushAt = ms;
    for (const k in COVERS[name]) coveredUntil[k] = ms + COVERS[name][k];
    pitchMul = Math.pow(2, pitch / 12);
    const tight = babble && Number.isFinite(o.tight) ? Math.max(0, Math.min(1, o.tight)) : 0;
    volMul = volume * (o.rival ? RIVAL_VOLUME * (theirs ? RIVAL_CHOMP : babble ? BABBLE_LEVEL * (1 - BABBLE_HUSH * tight) : 1) : 1);
    const t = ctx.currentTime + LEAD + delay;
    building = { pending: 0, gen: generation, nodes: [], end: t };
    voices++;
    try {
      // The cue's own little chain: a gain (so it can be cut short), a rival's dulled, and placed left or right.
      // (A rival's goes through its dulling into the gain; the few high grains a cue gives as its edge go
      // round it, as soft as the rest, so a rival's dig keeps a scratch the music can't bury: see edge.)
      const voice = ctx.createGain();
      voice.gain.value = 1;
      building.nodes.push(voice);
      let tail = voice, into = voice;
      if (o.rival) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = RIVAL_LOWPASS;
        f.connect(voice);
        building.nodes.push(into = f);
        edgeOut = voice;
      }
      if (Number.isFinite(o.pan) && ctx.createStereoPanner) {
        try {
          const p = ctx.createStereoPanner();
          p.pan.value = Math.max(-1, Math.min(1, o.pan));
          tail.connect(p);
          building.nodes.push(tail = p);
        } catch { /* stays in the middle */ }
      }
      tail.connect(master);
      out = into;
      const cut = sounding[CUTS_SHORT[name]];
      if (cut && cut.end > t) cut.voice.gain.setTargetAtTime(0, t, 0.03);
      const babbling = hushes && sounding.babble;
      if (babbling && babbling.end > t) babbling.voice.gain.setTargetAtTime(0, t, 0.02);
      if (DUCKS[name]) duckMusic(t, DUCKS[name]);
      cue(t, o);
      if (o.gold && name !== 'golden' && name !== 'leaf' && name !== 'wrap') sparkle(t + 0.05, 0.8);
      if (CUT_SHORT[name]) sounding[name] = { voice, end: building.end };
    } catch {
      /* a half-built cue just plays what it managed to schedule */
    } finally {
      if (building.pending === 0) {
        voices = Math.max(0, voices - 1);
        for (const n of building.nodes) { try { n.disconnect(); } catch { /* gone */ } }
      }
      building = null;
      out = master;
      edgeOut = null;
    }
  }

  // The music steps back under a fanfare, then comes back.
  function duckMusic(t, len) {
    try {
      duck.gain.cancelScheduledValues(t);
      duck.gain.setTargetAtTime(0.3, t, 0.04);
      duck.gain.setTargetAtTime(1, t + len, 0.35);
    } catch { /* the music stays up */ }
  }

  // ---- Music ----------------------------------------------------------------
  //
  // An adaptive track, written note by note on the audio clock. The game calls
  // music(stage, mood) every frame; this schedules the next quarter second of
  // sixteenth notes and moves between arrangements at bar lines, so changes
  // always land on the beat. (Except one: a round's music starts on Go, not at
  // the title loop's next bar line.)
  //
  //   stage: 'title'   a slow, calm marimba loop (start screen, countdown, round over)
  //          'early'   the loop plus a soft bass
  //          'mid'     a light shaker joins, and the tempo creeps up with the game
  //          'sudden'  the woodpecker is here: a minor key, wood-block knocks
  //          'duel'    the last two snakes: faster, tense, a heartbeat kick
  //          'off'     silence
  //   mood:  { intensity: 0..1, watching: bool, paused: bool, danger: 0..1 }
  //          (a round's mood: on the title loop it's ignored, so no heartbeat outlives a round)
  //
  // Danger (your head close to a rival's, or boxed in) brings in a heartbeat,
  // drives the bass, and lets a dissonant high note creep into the tune.
  //
  // Everything is quiet and round: sine and triangle tones, short envelopes,
  // through its own bus so the music can be switched off on its own. The title
  // loop answers itself every other time round, and fades away after a minute
  // with nobody at the keys (any key or tap brings it back).

  const ARRANGEMENTS = {
    // bpm, the chord roots for the 4-bar loop (MIDI), the scale degrees of each
    // chord, and which layers play.
    title: { bpm: 84, roots: [48, 45, 41, 43], minor: false, arp: 'quarter', bass: false, shaker: false, knocks: false, kick: false, pad: true, answers: true },
    early: { bpm: 94, roots: [48, 45, 41, 43], minor: false, arp: 'eighth', bass: true, shaker: false, knocks: false, kick: false, pad: true },
    mid: { bpm: 102, roots: [48, 45, 41, 43], minor: false, arp: 'eighth', bass: true, shaker: true, knocks: false, kick: false, pad: true, bells: true },
    sudden: { bpm: 108, roots: [45, 41, 48, 40], minor: true, arp: 'eighth', bass: true, shaker: true, knocks: true, kick: false, pad: true, toms: true },
    duel: { bpm: 124, roots: [45, 41, 43, 40], minor: true, arp: 'sixteenth', bass: true, shaker: true, knocks: true, kick: true, hats: true },
  };
  // Chord shapes over each root: major-ish for the calm loops, minor for the tense ones.
  const SHAPE_MAJOR = [[0, 4, 7, 12], [0, 3, 7, 12], [0, 4, 7, 12], [0, 4, 7, 10]]; // C  Am  F  G7
  const SHAPE_MINOR = [[0, 3, 7, 12], [0, 4, 7, 12], [0, 4, 7, 12], [0, 4, 7, 10]]; // Am F  C  E7
  const ARP_ORDER = [0, 1, 2, 3, 2, 1, 2, 3];
  const ARP_ANSWER = [3, 2, 1, 2, 0, 2, 1, 3]; // (the title loop's other time round: the line falls)
  const LOOKAHEAD = 0.25;      // seconds of music scheduled ahead of the audio clock
  const isRound = stage => stage !== 'title' && stage !== 'off';

  let stageNow = 'off', stageWanted = 'off';
  let step = 0;                // sixteenth-note counter within the 4-bar loop (0..63)
  let pass = 0;                // times round the loop
  let nextAt = 0;              // audio-clock time of the next sixteenth
  let tempo = 90;
  let musicLevel = 1;          // ducking for watching / paused / idle, eased
  let titleSince = 0;          // when the title loop last took over
  let goAt = -Infinity;        // when the last "go" was asked for
  let section = null;          // the arrangement's own gain, so the title loop can bow out at Go

  function setMusicOn(value) {
    musicOn = !!value;
    try { window.localStorage.setItem(MUSIC_KEY, musicOn ? '1' : '0'); } catch { /* storage unavailable */ }
    if (musicBus) {
      try { musicBus.gain.setTargetAtTime(musicOn ? MUSIC_VOLUME * musicLevel : 0, ctx.currentTime, 0.08); } catch { /* ignore */ }
    }
    syncBed();
    return musicOn;
  }
  const isMusicOn = () => musicOn;
  const toggleMusic = () => setMusicOn(!musicOn);

  // The babble's own switch (the rest of the sound and the music stay as they are; muted, it's silent too).
  function setVoicesOn(value) {
    voicesOn = !!value;
    try { window.localStorage.setItem(VOICES_KEY, voicesOn ? '1' : '0'); } catch { /* storage unavailable */ }
    const b = sounding.babble;
    if (!voicesOn && b && ctx && b.end > ctx.currentTime) { try { b.voice.gain.setTargetAtTime(0, ctx.currentTime, 0.02); } catch { /* it ends soon anyway */ } }
    return voicesOn;
  }
  const isVoicesOn = () => voicesOn;
  const toggleVoices = () => setVoicesOn(!voicesOn);

  // One music note straight to the music bus (or `dest`): no voice counting, it ends itself.
  function mtone(t, type, freq, dur, peak, attack, toFreq, filter, dest) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    shape(osc, type);
    osc.frequency.setValueAtTime(freq, t);
    if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
    envelope(g, t, peak, attack, dur);
    let f = null;
    if (filter) {
      f = ctx.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.frequency.value = filter.freq || filter;
      if (filter.q) f.Q.value = filter.q;
      osc.connect(f);
      f.connect(g);
    } else osc.connect(g);
    g.connect(dest || section || musicBus);
    osc.start(t);
    osc.stop(t + dur + 0.03);
    osc.onended = () => { try { osc.disconnect(); g.disconnect(); if (f) f.disconnect(); } catch { /* gone */ } };
  }

  function mnoise(t, dur, peak, type, freq, q, dest) {
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noiseBuffer();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    envelope(g, t, peak, 0.002, dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest || section || musicBus);
    src.start(t, Math.random() * Math.max(0, NOISE_SECONDS - dur - 0.05));
    src.stop(t + dur + 0.03);
    src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch { /* gone */ } };
  }

  // A soft marimba note for the track (the cue mallet, quieter and voice-free).
  function mmallet(t, midi, dur, peak) {
    const f = mtof(midi);
    mtone(t, 'sine', f, dur, peak, 0.004);
    mtone(t, 'sine', f * 3.93, dur * 0.3, peak * 0.15, 0.002);
  }

  // Schedule one sixteenth of the current arrangement at audio time t.
  function scheduleStep(a, s, t, watching) {
    const bar = Math.floor(s / 16) % 4, inBar = s % 16;
    const root = a.roots[bar];
    const shape = (a.minor ? SHAPE_MINOR : SHAPE_MAJOR)[bar];
    const quiet = watching ? 0.6 : 1;
    const answer = a.answers && pass % 2 === 1;

    // Bells, high and sparse, answering the tune in the middle of the round.
    if (a.bells && bar % 2 === 1 && (inBar === 6 || inBar === 14)) mmallet(t, root + 24 + shape[inBar === 6 ? 2 : 3], 0.5, 0.035 * quiet);
    // The marimba line: chord tones an octave and a half up, in a rocking order.
    const every = a.arp === 'quarter' ? 4 : a.arp === 'eighth' ? 2 : 1;
    if (inBar % every === 0) {
      const order = answer ? ARP_ANSWER : ARP_ORDER;
      const i = order[(inBar / every) % order.length];
      const accent = inBar % 4 === 0 ? 1 : 0.75;
      mmallet(t, root + 12 + shape[i], a.arp === 'quarter' ? 0.5 : 0.22, 0.09 * accent * quiet);
    }
    // ...and when it answers, a high note echoes the end of every other bar.
    if (answer && bar % 2 === 1 && inBar === 14) mmallet(t, root + 24 + shape[1], 0.6, 0.03 * quiet);
    // A long, low note on the downbeat of each bar under the calm loop.
    if (!a.bass && inBar === 0) mtone(t, 'sine', mtof(root - 12), 1.8, 0.05 * quiet, 0.08);

    // Bass: root on beats 1 and 3, fifth as a pickup.
    if (a.bass) {
      if (inBar === 0 || inBar === 8) mtone(t, 'triangle', mtof(root - 12), 0.32, 0.12 * quiet, 0.008, null, 600);
      else if (inBar === 14) mtone(t, 'triangle', mtof(root - 5), 0.14, 0.07 * quiet, 0.008, null, 600);
    }
    if (watching) return; // watching: just the tune, no percussion

    // Shaker on the off-beats.
    if (a.shaker && inBar % 4 === 2) mnoise(t, 0.04, 0.035, 'highpass', 6000, 0.7);
    // Wood-block knocks on beats 2 and 4, an extra one before the bar line.
    if (a.knocks && (inBar === 4 || inBar === 12 || inBar === 15)) {
      mtone(t, 'triangle', inBar === 15 ? 1500 : 1150, 0.06, 0.07, 0.001, inBar === 15 ? 1100 : 820, 3000);
    }
    // A soft heartbeat kick for the duel (and its beater, for small speakers).
    if (a.kick && (inBar === 0 || inBar === 3 || inBar === 8 || inBar === 11)) {
      mtone(t, 'sine', 110, 0.16, 0.16, 0.004, 48);
      mnoise(t, 0.025, 0.05, 'bandpass', 700, 1.4);
    }
    // Sudden death: low toms rolling round the bar.
    if (a.toms && (inBar === 6 || inBar === 7 || inBar === 14)) mtone(t, 'sine', inBar === 7 ? 150 : 120, 0.2, 0.1, 0.004, 70);
    // The duel: closed hats on every sixteenth, accented on the beat.
    if (a.hats) mnoise(t, 0.025, inBar % 4 === 0 ? 0.03 : 0.015, 'highpass', 8000, 0.7);
  }

  // A soft pad under the calm loops: the bar's chord, held, swelling in.
  function schedulePad(a, s, t, watching) {
    if (s % 16 !== 0 || !a.pad) return;
    const bar = Math.floor(s / 16) % 4, root = a.roots[bar], shape = (a.minor ? SHAPE_MINOR : SHAPE_MAJOR)[bar];
    const len = 16 * 60 / tempo / 4;
    for (const i of [0, 1, 2]) {
      mtone(t, 'triangle', mtof(root + 12 + shape[i]), len, (watching ? 0.016 : 0.022), len * 0.35, null, 900);
      mtone(t, 'sine', mtof(root + 12 + shape[i]) * 1.004, len, 0.016, len * 0.35); // (a hair detuned: it breathes)
    }
  }

  // The danger layer: a heartbeat (lub-dub on the beat, each beat with a muffled thump a
  // phone can play), a driven bass, a dissonance creeping in on top. danger: 0..1.
  function scheduleDanger(a, s, t, danger) {
    if (danger < 0.25) return;
    const inBar = s % 16, bar = Math.floor(s / 16) % 4, root = a.roots[bar];
    if (inBar % 4 === 0) {
      mtone(t, 'sine', 62, 0.14, 0.22 * danger, 0.004, 42);
      mtone(t, 'body', 124, 0.08, 0.12 * danger, 0.004, 84, { type: 'bandpass', freq: 420, q: 1.2 });
      mnoise(t, 0.04, 0.08 * danger, 'bandpass', 460, 1.4);
      mtone(t + 0.13, 'sine', 56, 0.12, 0.15 * danger, 0.004, 40);
      mtone(t + 0.13, 'body', 112, 0.07, 0.08 * danger, 0.004, 80, { type: 'bandpass', freq: 400, q: 1.2 });
    }
    if (inBar % 2 === 1) mtone(t, 'triangle', mtof(root - 12), 0.1, 0.07 * danger, 0.004, null, 500);
    if (danger > 0.6 && (inBar === 2 || inBar === 10)) mmallet(t, root + 25, 0.18, 0.05 * danger); // a minor second, uneasy
  }

  // Back on the title loop: the round's over. The woodpecker starts afresh next time.
  function roundOver() {
    newRound();
  }

  // A round's music starts on Go: the title loop bows out at once (its long pad and bass
  // fade fast) and the round's first bar begins on the same beat as the "go".
  function newSection(t) {
    const old = section;
    if (old) {
      try { old.gain.setTargetAtTime(0, t, 0.06); } catch { /* gone */ }
      setTimeout(() => { try { old.disconnect(); } catch { /* gone */ } }, 4000);
    }
    section = ctx.createGain();
    section.gain.value = 1;
    section.connect(musicBus);
  }

  // Called every frame by the game. Cheap when nothing is due.
  function music(stage, mood) {
    const round = isRound(stage);
    if (stage !== stageWanted) {
      if (!round) { titleSince = now(); if (isRound(stageWanted)) roundOver(); }
      stageWanted = stage;
    }
    const paused = round && !!(mood && mood.paused);
    // The weather belongs to the round: it stops when the round does, and while you nap.
    bedOpen = round && !paused;
    syncBed();
    if (!ctx || ctx.state !== 'running') return;
    flushWaking();
    if (!musicOn || muted) return;

    const intensity = round && mood && Number.isFinite(mood.intensity) ? Math.max(0, Math.min(1, mood.intensity)) : 0;
    const watching = round && !!(mood && mood.watching);
    const danger = round && mood && Number.isFinite(mood.danger) ? Math.max(0, Math.min(1, mood.danger)) : 0;
    const idleFor = round ? 0 : now() - Math.max(lastActive, titleSince) - IDLE_MS;
    const level = idleFor > 0 ? 0 : paused ? 0.35 : watching ? 0.7 : 1;
    if (Math.abs(level - musicLevel) > 0.01) {
      // (Idle, the loop fades slowly; back from idle, it comes in over a moment.)
      const ease = level === 0 ? 3 : musicLevel === 0 ? 0.6 : 0.25;
      musicLevel = level;
      try { musicBus.gain.setTargetAtTime(MUSIC_VOLUME * musicLevel, ctx.currentTime, ease); } catch { /* ignore */ }
    }
    if (idleFor > IDLE_STOP_MS) { stageNow = 'off'; return; } // faded right out: stop writing notes

    if (stageNow === 'off' && stageWanted !== 'off') {
      stageNow = stageWanted; step = 0; pass = 0; nextAt = ctx.currentTime + 0.05;
      newSection(ctx.currentTime);
    } else if (round && (stageNow === 'title' || now() - goAt < 1000)) {
      // (Go just went: even a round that comes straight after the last starts from its first bar.)
      goAt = -Infinity;
      stageNow = stageWanted; step = 0; pass = 0; nextAt = ctx.currentTime + LEAD;
      newSection(nextAt);
    }
    if (stageNow === 'off') return;
    // Fell behind (a stall, or the tab was asleep): skip whole sixteenths, so the groove stays on its grid.
    if (nextAt < ctx.currentTime - 0.1) {
      const len = 60 / tempo / 4, skip = Math.ceil((ctx.currentTime - nextAt) / len);
      nextAt += skip * len;
      step = (step + skip) % 64;
    }

    while (nextAt < ctx.currentTime + LOOKAHEAD) {
      // Arrangement changes wait for the next bar line.
      if (step % 16 === 0 && stageWanted !== stageNow) {
        stageNow = stageWanted;
        if (stageNow === 'off') return;
      }
      const a = ARRANGEMENTS[stageNow] || ARRANGEMENTS.title;
      tempo = a.bpm * (stageNow === 'early' || stageNow === 'mid' ? 1 + 0.15 * intensity : 1);
      try {
        scheduleStep(a, step, nextAt, watching);
        schedulePad(a, step, nextAt, watching);
        if (!watching) scheduleDanger(a, step, nextAt, danger);
      } catch { /* a dropped note is fine */ }
      nextAt += 60 / tempo / 4;
      step = (step + 1) % 64;
      if (step === 0) pass++;
    }
    drops();
  }

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
    const kind = bedOpen && musicOn ? bedWanted : 'none';
    if (kind === bedKind || !ctx || unsupported) return;
    bedKind = kind;
    const t = ctx.currentTime;
    for (const n of bedNodes) { // the old bed fades
      try {
        n.g.gain.setTargetAtTime(0, t, 0.6);
        if (n.src) n.src.stop(t + 3);
        else setTimeout(() => { for (const p of n.parts) { try { p.disconnect(); } catch { /* gone */ } } }, 3500);
      } catch { /* gone */ }
    }
    bedNodes = [];
    drip = null;
    if (kind === 'none' || !musicBus) return;
    for (const [type, freq, q, level, gusty] of BEDS[kind]) {
      try {
        const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = noiseBuffer(); src.loop = true;
        f.type = type; f.frequency.value = freq; f.Q.value = q;
        g.gain.value = 0;
        g.gain.setTargetAtTime(level, t, 0.8);
        src.connect(f); f.connect(g); g.connect(musicBus);
        if (gusty) { // the wind swells and falls
          const lfo = ctx.createOscillator(), depth = ctx.createGain();
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
        const g = ctx.createGain(), parts = [g];
        g.gain.value = 0;
        g.gain.setTargetAtTime(1, t, 0.8);
        g.connect(musicBus);
        bedNodes.push({ g, src: null, parts });
        drip = { left: g, right: g, middle: g };
        dripAt = t + 0.3;
        const side = pan => { const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(g); parts.push(p); return p; };
        drip.left = side(-0.6);
        drip.right = side(0.6);
      } catch { /* (no panners: the drops fall in front) */ }
    }
  }

  // Raindrops on leaves and bark, now and then: each a tiny falling plink, some with a tick.
  function drops() {
    if (!drip || !DRIPS[bedKind]) return;
    const gap = DRIPS[bedKind];
    if (dripAt < ctx.currentTime) dripAt = ctx.currentTime + 0.02;
    while (dripAt < ctx.currentTime + LOOKAHEAD) {
      const r = Math.random(), dest = r < 0.4 ? drip.left : r < 0.8 ? drip.right : drip.middle;
      const f = 1900 + Math.random() * 2600, peak = 0.004 + Math.random() * Math.random() * 0.014;
      try {
        mtone(dripAt, 'sine', f, 0.03, peak, 0.001, f * 0.62, null, dest);
        if (Math.random() < 0.4) mnoise(dripAt, 0.008, peak * 0.8, 'bandpass', 2800 + Math.random() * 2000, 2, dest);
      } catch { /* a drop missed */ }
      dripAt += gap * (0.25 - Math.log(1 - Math.random() * 0.98)); // (random, like rain: mostly short gaps, now and then a pause)
    }
  }

  // ---- Mute -----------------------------------------------------------------

  function setMuted(value) {
    muted = !!value;
    saveMuted();
    // Fade anything already sounding rather than cutting it with a click, then let the
    // context sleep. Unmuted, it wakes, and a cue asked for straight after still plays.
    settle();
    return muted;
  }

  const isMuted = () => muted;
  const toggleMuted = () => setMuted(!muted);

  create();
  return { unlock, play, setMuted, isMuted, toggleMuted, music, weather, setMusicOn, isMusicOn, toggleMusic, setVoicesOn, isVoicesOn, toggleVoices, drumBlows };
})();
