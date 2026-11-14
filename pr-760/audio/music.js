// The music of Barkstreet Snakes' sound: the adaptive track, written note by note on the audio
// clock, and its own switch (SnakeAudio.music, setMusicOn, isMusicOn, toggleMusic: the API is
// listed in sound.js). The weather's sound rides on its bus: see weather.js.
//
// Like cues.js it doesn't share the page's scope: it leaves a maker, which sound.js calls once
// with a kit of the shared pieces (the building blocks, and live views of the context, the music
// bus and the flags, which sound.js owns), and takes it away again.
window.SnakeAudioMusic = k => {
  const { MUSIC_KEY, MUSIC_VOLUME, LEAD, NOISE_SECONDS, now, mtof, noiseBuffer, envelope, shape, flushWaking, newRound } = k;

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
  //          'watch'   the woodpecker has come and watches (act 1): a low, slow drone underneath
  //          'pecks'   its first pecks (act 2): its own drum joins, a roll at each bar's end
  //          'sudden'  its frenzy (act 3, sudden death): faster, a minor key, wood-block knocks, its drum woven in
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
    pecks: { bpm: 104, roots: [48, 45, 41, 43], minor: false, arp: 'eighth', bass: true, shaker: true, knocks: false, kick: false, pad: true, drone: true, drum: 1 },
    sudden: { bpm: 116, roots: [45, 41, 48, 40], minor: true, arp: 'eighth', bass: true, shaker: true, knocks: true, kick: false, pad: true, toms: true, drone: true, drum: 2 },
    duel: { bpm: 124, roots: [45, 41, 43, 40], minor: true, arp: 'sixteenth', bass: true, shaker: true, knocks: true, kick: true, hats: true },
  };
  ARRANGEMENTS.watch = { ...ARRANGEMENTS.mid, drone: true }; // (the woodpecker watching: mid's, and the drone under it)
  // Chord shapes over each root: major-ish for the calm loops, minor for the tense ones.
  const SHAPE_MAJOR = [[0, 4, 7, 12], [0, 3, 7, 12], [0, 4, 7, 12], [0, 4, 7, 10]]; // C  Am  F  G7
  const SHAPE_MINOR = [[0, 3, 7, 12], [0, 4, 7, 12], [0, 4, 7, 12], [0, 4, 7, 10]]; // Am F  C  E7
  const ARP_ORDER = [0, 1, 2, 3, 2, 1, 2, 3];
  const ARP_ANSWER = [3, 2, 1, 2, 0, 2, 1, 3]; // (the title loop's other time round: the line falls)
  const IDLE_MS = 60000;       // the title loop fades after this long with nobody at the keys...
  const IDLE_STOP_MS = 15000;  // ...and stops this long after
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
    k.musicOn = !!value;
    try { window.localStorage.setItem(MUSIC_KEY, k.musicOn ? '1' : '0'); } catch { /* storage unavailable */ }
    if (k.musicBus) {
      try { k.musicBus.gain.setTargetAtTime(k.musicOn ? MUSIC_VOLUME * musicLevel : 0, k.ctx.currentTime, 0.08); } catch { /* ignore */ }
    }
    k.weather.sync();
    return k.musicOn;
  }
  const isMusicOn = () => k.musicOn;
  const toggleMusic = () => setMusicOn(!k.musicOn);

  // One music note straight to the music bus (or `dest`): no voice counting, it ends itself.
  function mtone(t, type, freq, dur, peak, attack, toFreq, filter, dest) {
    const osc = k.ctx.createOscillator();
    const g = k.ctx.createGain();
    shape(osc, type);
    osc.frequency.setValueAtTime(freq, t);
    if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
    envelope(g, t, peak, attack, dur);
    let f = null;
    if (filter) {
      f = k.ctx.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.frequency.value = filter.freq || filter;
      if (filter.q) f.Q.value = filter.q;
      osc.connect(f);
      f.connect(g);
    } else osc.connect(g);
    g.connect(dest || section || k.musicBus);
    osc.start(t);
    osc.stop(t + dur + 0.03);
    osc.onended = () => { try { osc.disconnect(); g.disconnect(); if (f) f.disconnect(); } catch { /* gone */ } };
  }

  function mnoise(t, dur, peak, type, freq, q, dest) {
    const src = k.ctx.createBufferSource();
    const f = k.ctx.createBiquadFilter();
    const g = k.ctx.createGain();
    src.buffer = noiseBuffer();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    envelope(g, t, peak, 0.002, dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest || section || k.musicBus);
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
    // The woodpecker's acts: a low, slow drone, a note held two bars and swelling in.
    if (a.drone && s % 32 === 0) mtone(t, 'sine', mtof(root - 24), 32 * 15 / tempo, 0.07 * quiet, 32 * 15 / tempo * 0.4);
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
    // Its own drum: a quick roll of light knocks, quickening, at the end of each bar (in the frenzy, each half bar).
    if (a.drum && (inBar === 12 || (a.drum > 1 && inBar === 4))) for (let i = 0; i < 6; i++) mtone(t + i * (0.05 - 0.004 * i), 'triangle', 1700 + 40 * i, 0.03, 0.03 + 0.004 * i, 0.001, 1300, 3600);
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
    section = k.ctx.createGain();
    section.gain.value = 1;
    section.connect(k.musicBus);
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
    k.weather.open(round && !paused);
    if (!k.ctx || k.ctx.state !== 'running') return;
    flushWaking();
    if (!k.musicOn || k.muted) return;

    const intensity = round && mood && Number.isFinite(mood.intensity) ? Math.max(0, Math.min(1, mood.intensity)) : 0;
    const watching = round && !!(mood && mood.watching);
    const danger = round && mood && Number.isFinite(mood.danger) ? Math.max(0, Math.min(1, mood.danger)) : 0;
    const idleFor = round ? 0 : now() - Math.max(k.lastActive, titleSince) - IDLE_MS;
    const level = idleFor > 0 ? 0 : paused ? 0.35 : watching ? 0.7 : 1;
    if (Math.abs(level - musicLevel) > 0.01) {
      // (Idle, the loop fades slowly; back from idle, it comes in over a moment.)
      const ease = level === 0 ? 3 : musicLevel === 0 ? 0.6 : 0.25;
      musicLevel = level;
      try { k.musicBus.gain.setTargetAtTime(MUSIC_VOLUME * musicLevel, k.ctx.currentTime, ease); } catch { /* ignore */ }
    }
    if (idleFor > IDLE_STOP_MS) { stageNow = 'off'; return; } // faded right out: stop writing notes

    if (stageNow === 'off' && stageWanted !== 'off') {
      stageNow = stageWanted; step = 0; pass = 0; nextAt = k.ctx.currentTime + 0.05;
      newSection(k.ctx.currentTime);
    } else if (round && (stageNow === 'title' || now() - goAt < 1000)) {
      // (Go just went: even a round that comes straight after the last starts from its first bar.)
      goAt = -Infinity;
      stageNow = stageWanted; step = 0; pass = 0; nextAt = k.ctx.currentTime + LEAD;
      newSection(nextAt);
    }
    if (stageNow === 'off') return;
    // Fell behind (a stall, or the tab was asleep): skip whole sixteenths, so the groove stays on its grid.
    if (nextAt < k.ctx.currentTime - 0.1) {
      const len = 60 / tempo / 4, skip = Math.ceil((k.ctx.currentTime - nextAt) / len);
      nextAt += skip * len;
      step = (step + skip) % 64;
    }

    while (nextAt < k.ctx.currentTime + LOOKAHEAD) {
      // Arrangement changes wait for the next bar line.
      if (step % 16 === 0 && stageWanted !== stageNow) {
        stageNow = stageWanted;
        if (stageNow === 'off') return;
      }
      const a = ARRANGEMENTS[stageNow] || ARRANGEMENTS.title;
      tempo = a.bpm * (stageNow === 'early' || stageNow === 'mid' || stageNow === 'watch' || stageNow === 'pecks' ? 1 + 0.15 * intensity : 1);
      try {
        scheduleStep(a, step, nextAt, watching);
        schedulePad(a, step, nextAt, watching);
        if (!watching) scheduleDanger(a, step, nextAt, danger);
      } catch { /* a dropped note is fine */ }
      nextAt += 60 / tempo / 4;
      step = (step + 1) % 64;
      if (step === 0) pass++;
    }
    k.weather.drops();
  }

  // Heard the "go" (a round's music starts on it).
  const heardGo = () => { goAt = now(); };

  return { music, setMusicOn, isMusicOn, toggleMusic, mtone, mnoise, heardGo, LOOKAHEAD };
};
