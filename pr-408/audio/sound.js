// Sound for Barkstreet Snakes: a tiny Web Audio synthesiser with no audio files.
// (The cues are in audio/cues.js, the music in audio/music.js, the weather's sound in audio/weather.js,
// all loaded first: see cues.js for the files. This file holds the shared state and makes them.)
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
//   SnakeAudio.music(stage, mood)  the adaptive track (see audio/music.js)
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
    fall: 900, // (2s: a piece cut loose falls with a strike: one a strike)
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

  // ---- Music and weather ------------------------------------------------------
  // In audio/music.js and audio/weather.js: made here too, with the building blocks and live
  // views of the shared state (the music's note builders go to the weather, which rides its bus).
  const shared = {
    MUSIC_KEY, MUSIC_VOLUME, LEAD, NOISE_SECONDS, now, noiseBuffer,
    get ctx() { return ctx; },
    get musicBus() { return musicBus; },
    get muted() { return muted; },
    get unsupported() { return unsupported; },
    get lastActive() { return lastActive; },
    get musicOn() { return musicOn; },
    set musicOn(v) { musicOn = v; },
  };
  const kit = extra => Object.create(shared, Object.getOwnPropertyDescriptors(extra)); // (live views stay live)
  const music = window.SnakeAudioMusic(kit({
    mtof, envelope, shape, flushWaking, newRound,
    get weather() { return weather; },
  }));
  const weather = window.SnakeAudioWeather(kit({ LOOKAHEAD: music.LOOKAHEAD, mtone: music.mtone, mnoise: music.mnoise }));
  delete window.SnakeAudioMusic;
  delete window.SnakeAudioWeather;

  // ---- Playing --------------------------------------------------------------

  function play(name, opts) {
    if (!CUES[name] || !ctx || muted) return;
    if (name === 'go') music.heardGo();
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

  // ---- The babble's switch ----------------------------------------------------

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
  return { unlock, play, setMuted, isMuted, toggleMuted, music: music.music, weather: weather.weather, setMusicOn: music.setMusicOn, isMusicOn: music.isMusicOn, toggleMusic: music.toggleMusic, setVoicesOn, isVoicesOn, toggleVoices, drumBlows };
})();
