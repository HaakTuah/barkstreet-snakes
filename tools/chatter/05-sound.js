// ------------------------------------------------------------ the sound's gaps
// audio.js on a stand-in AudioContext whose nodes take any call: a cue that
// plays builds its voice (a gain), one its gap holds back builds nothing.
// Yours never waits on a rival's (now that every rival flashes a few times a
// minute, it would swallow yours); a rival's gives way to yours. And your own
// golden dashes or jumps, one straight after another, are each heard.
{
  const asrc = fs.readFileSync(path.join(ROOT, 'audio.js'), 'utf8');
  const head = '  const MIN_INTERVAL = {', start = asrc.indexOf(head), end = asrc.indexOf('\n  };\n', start);
  if (start < 0 || end < 0) throw new Error('no MIN_INTERVAL in audio.js');
  const GAP = new Function(`return ${asrc.slice(start + head.length - 1, end + '\n  }'.length)}`)();
  // The quickest your own can come again: a dash the very next tick, a jump the
  // tick after it lands; at full speed, and dealt out a frame early on a 30 Hz screen.
  const FRAME = 1000 / 30;
  const soonest = { dash: T.MIN_TICK - FRAME, leap: 2 * T.MIN_TICK - FRAME };
  for (const [cue, ms] of Object.entries(soonest)) check(GAP[cue] < ms, `the '${cue}' gap (${GAP[cue]} ms) is under the quickest your own can come again (${ms.toFixed(0)} ms)`);
  // (You can choke again as soon as your cough is over: both are heard again.)
  const again = T.COUGH_TICKS * T.MIN_TICK - FRAME;
  for (const cue of ['choke', 'cough']) check(GAP[cue] < again, `the '${cue}' gap (${GAP[cue]} ms) is under the soonest you can choke again (${again.toFixed(0)} ms)`);
  // (A beetle digs in again only once it's been under and come out, and the
  // woodpecker strikes again only after a rest and an aim: each is heard.)
  const digAgain = (T.BEETLE_DIG + T.BEETLE_UNDER_MIN) * T.MIN_TICK - FRAME, strikeAgain = (T.PECK_REST_MIN + T.PECK_AIM_TICKS) * T.MIN_TICK - FRAME;
  check(GAP.dig < digAgain, `the 'dig' gap (${GAP.dig} ms) is under the soonest a beetle can dig in again (${digAgain.toFixed(0)} ms)`);
  check(GAP.knock < strikeAgain, `the 'knock' gap (${GAP.knock} ms) is under the soonest the woodpecker can strike again (${strikeAgain.toFixed(0)} ms)`);
  let clock = 0, gains = 0;
  const stub = () => new Proxy(function () { return stub(); }, {
    get: (f, k) => (k in f || typeof k === 'symbol' ? f[k] : (f[k] = stub())),
  });
  class Context {
    constructor() { this.state = 'suspended'; this.sampleRate = 8000; this.destination = stub(); }
    get currentTime() { return clock / 1000; }
    resume() { this.state = 'running'; this.onstatechange?.(); }
    suspend() { this.state = 'suspended'; }
    createGain() { gains++; return stub(); }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  }
  for (const m of ['createDynamicsCompressor', 'createBiquadFilter', 'createOscillator', 'createBufferSource', 'createStereoPanner', 'createPeriodicWave']) Context.prototype[m] = stub;
  const actx = vm.createContext({
    window: { AudioContext: Context, performance: { now: () => clock } },
    document: { hidden: false, addEventListener() {} }, setTimeout: () => 0, clearTimeout() {},
  });
  vm.runInContext(asrc, actx, { filename: 'audio.js' });
  const A = actx.window.SnakeAudio;
  check(A.unlock(), 'the sound unlocks on the stand-in context');
  const sounds = (name, opts) => { const before = gains; A.play(name, opts); return gains > before; };
  const RIVAL = { rival: true, pan: 0.4 };
  // (Each case starts well apart from the last, so nothing earlier is still sounding or resting.)
  for (const cue of ['flash', 'dash', 'leap', 'alight', 'wrap', 'choke', 'cough', 'dig', 'knock']) {
    const gap = GAP[cue];
    check(gap > 0, `'${cue}' has a gap`);
    clock += 5000;
    sounds(cue, RIVAL);
    check(sounds(cue), `your ${cue} in the same moment as a rival's still sounds`);
    clock += 5000;
    sounds(cue, RIVAL); clock += gap / 3;
    check(sounds(cue), `your ${cue} just after a rival's still sounds`);
    clock += 5000;
    sounds(cue); clock += gap / 3;
    check(!sounds(cue, RIVAL), `a rival's ${cue} just after yours gives way`);
    clock += 5000;
    check(sounds(cue, RIVAL), `a rival's ${cue} sounds`); clock += gap / 3;
    check(!sounds(cue, RIVAL), `...another rival's ${gap / 3} ms later waits`); clock += gap;
    check(sounds(cue, RIVAL), `...and one ${gap} ms after that sounds`);
    clock += 5000;
    check(sounds(cue), `your ${cue} sounds`); clock += gap / 3;
    check(!sounds(cue), `...your next ${gap / 3} ms later waits (bursts don't stack)`); clock += gap;
    check(sounds(cue), `...and your next ${gap} ms after that sounds`);
  }
  for (const [cue, ms] of Object.entries(soonest)) {
    clock += 5000;
    sounds(cue, { gold: true }); clock += ms;
    check(sounds(cue, { gold: true }), `your golden ${cue} ${ms.toFixed(0)} ms after your last still sounds`);
  }
  // The cough comes a beat after the choke (delay): its gap counts from when it was asked for.
  clock += 5000;
  check(sounds('choke') && sounds('cough', { delay: 0.3 }), 'your choke, and your cough a beat later: both');
  clock += 300;
  check(!sounds('cough'), '...and another cough asked for as that one sounds waits (a cough never loops)');
  clock += again;
  check(sounds('choke') && sounds('cough', { delay: 0.3 }), '...but your next choke and cough, as soon as you can choke again, sound');
  // A beetle digging in, the woodpecker knocking food aside and a burrow
  // closing over are the world's: two beetles digging in together, the pieces
  // one strike knocks aside, or two burrows closing over as two digs end
  // together, are one sound; the next is heard as soon as it can come again
  // (a burrow closes over only as a dig ends: the same beetle's next, after a
  // spell under).
  check(GAP.heal > 0 && GAP.heal < digAgain, `the 'heal' gap (${GAP.heal} ms) is under the soonest a beetle can dig in again and close another (${digAgain.toFixed(0)} ms)`);
  for (const [cue, ms] of [['dig', digAgain], ['knock', strikeAgain], ['heal', digAgain]]) {
    clock += 5000;
    check(sounds(cue, { pan: -0.4 }) && !sounds(cue, { pan: 0.3 }), `a ${cue}, and another in the same moment: one sound`);
    clock += ms;
    check(sounds(cue, { pan: 0.3 }), `...and the next, ${ms.toFixed(0)} ms on, sounds`);
  }
  // The chomps: a rival's meal plays its kind's own cue, a rival's, but never
  // a pile-up (one rival's at a time, CHOMP_GAP apart whoever ate), and none
  // while yours sounds (CHOMP_YIELD after it); yours never waits on theirs.
  const [CHOMP_GAP, CHOMP_YIELD] = ['CHOMP_GAP', 'CHOMP_YIELD'].map(k => +new RegExp(`\\b${k} = (\\d+)`).exec(asrc)[1]);
  const CHOMPS = ['eat', 'golden', 'meat', 'mushroom', 'crunch', 'leaf'];
  check(CHOMP_GAP <= T.MIN_TICK * 2 && CHOMP_YIELD >= 300, `rivals' chomps ${CHOMP_GAP} ms apart at least (two of the fastest ticks at most: a feeding rival is heard), none for ${CHOMP_YIELD} ms after yours`);
  for (const cue of CHOMPS) {
    clock += 5000;
    check(sounds(cue, RIVAL), `a rival's '${cue}' sounds`);
    clock += 5000;
    check(sounds(cue) && !sounds(cue, RIVAL), `your '${cue}', and a rival's in the same moment: the rival's gives way`);
    clock += CHOMP_YIELD - 20;
    check(!sounds(cue, RIVAL), `...and still does ${CHOMP_YIELD - 20} ms on, as yours rings`);
    clock += 40;
    check(sounds(cue, RIVAL), `...but sounds once yours is over`);
    clock += 5000;
    sounds(cue, RIVAL);
    check(sounds(cue), `your '${cue}' just as a rival's sounds still sounds (yours never waits on theirs)`);
  }
  // Three rivals eating at once, different things: one chomp; the next a CHOMP_GAP on.
  clock += 5000;
  const three = ['eat', 'meat', 'crunch'].map(c => sounds(c, { rival: true, pan: -0.5 }));
  check(three.join() === 'true,false,false', `three rivals eating at once (an apple, a bead, a beetle): one chomp, not three (${three})`);
  clock += CHOMP_GAP / 2;
  check(!sounds('golden', RIVAL), `...another rival's ${CHOMP_GAP / 2} ms on waits`);
  clock += CHOMP_GAP;
  check(sounds('mushroom', RIVAL), `...and one ${CHOMP_GAP} ms after that sounds`);
  // Four eating at once, yours among them: yours, and none of theirs.
  clock += 5000;
  const four = [sounds('eat'), sounds('meat', RIVAL), sounds('crunch', RIVAL), sounds('leaf', RIVAL)];
  check(four.join() === 'true,false,false,false', `four eating at once, yours first: only yours (${four})`);
  clock += 5000;
  A.setMuted(true);
  check(CHOMPS.every(c => !sounds(c) && !sounds(c, RIVAL)), 'muted: no chomp, yours or a rival\'s');
  A.setMuted(false);
  clock += 5000;
  check(sounds('eat') && (clock += CHOMP_YIELD, sounds('meat', RIVAL)), '...and with the sound back on, both');
  clock += 5000;
  A.setMuted(true);
  check(!sounds('choke') && !sounds('cough', { delay: 0.3 }) && !sounds('choke', RIVAL), 'muted: no choke, no cough, yours or a rival\'s');
  check(!sounds('dig') && !sounds('knock') && !sounds('knock', RIVAL) && !sounds('heal'), '...no dig, no knock, no burrow closing over');
  A.setMuted(false);
  check(sounds('choke') && sounds('cough', { delay: 0.3 }) && sounds('dig') && sounds('knock') && sounds('heal'), '...and with the sound back on, all of them');
  console.log('ok   the sound: rivals\' chomps, one at a time, giving way to yours; a rival\'s flash, dash, jump, catching fire, golden mushroom, choke or cough never swallows yours, and gives way to it; your own golden dashes and jumps on each other\'s heels are each heard, and your choke and cough each time you can choke; a beetle digging in, the woodpecker knocking food aside and a burrow closing over, one sound a moment and each time they can come again; muted, none');
}

// ------------------------------------------------------------ the sound over the music
// What carries over the music (measured offline, over the music as it's
// written every frame: see DESIGN): a rival's dig keeps its legs' scratches
// round its dulling (RIVAL_LOWPASS, which took them off), as soft as the rest
// of it; and a burrow closing over has flecks of sawdust high enough to carry,
// and a crumble louder than a beetle's scrabble (which the music buries). On a
// stand-in context that records how each cue is wired.
{
  const asrc = fs.readFileSync(path.join(ROOT, 'audio.js'), 'utf8');
  const [LOWPASS, RIVAL_VOLUME] = [+/\bRIVAL_LOWPASS = (\d+)/.exec(asrc)[1], +/\bRIVAL_VOLUME = ([\d.]+)/.exec(asrc)[1]];
  let clock = 0;
  const made = [];
  const param = () => { const p = { value: 0, peak: 0 }; for (const m of ['setValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues']) p[m] = () => p; p.linearRampToValueAtTime = v => { p.peak = Math.max(p.peak, v); return p; }; return p; };
  const node = kind => { const n = { kind, to: [], gain: param(), frequency: param(), Q: param(), pan: param(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(), connect: t => { n.to.push(t); return t; }, disconnect() {}, start() {}, stop() {}, setPeriodicWave() {} }; made.push(n); return n; };
  class Recorder {
    constructor() { this.state = 'suspended'; this.sampleRate = 8000; this.destination = node('speakers'); }
    get currentTime() { return clock / 1000; }
    resume() { this.state = 'running'; this.onstatechange?.(); }
    suspend() { this.state = 'suspended'; }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  }
  for (const [m, kind] of [['createGain', 'gain'], ['createBiquadFilter', 'filter'], ['createOscillator', 'osc'], ['createBufferSource', 'noise'], ['createStereoPanner', 'panner'], ['createDynamicsCompressor', 'compressor'], ['createPeriodicWave', 'wave']]) Recorder.prototype[m] = () => node(kind);
  const rctx = vm.createContext({ window: { AudioContext: Recorder, performance: { now: () => clock } }, document: { hidden: false, addEventListener() {} }, setTimeout: () => 0, clearTimeout() {} });
  vm.runInContext(asrc, rctx, { filename: 'audio.js' });
  const RA = rctx.window.SnakeAudio;
  check(RA.unlock(), 'the sound unlocks on a recording stand-in');
  // (A noise grain: its source, through its filter and its envelope, into where the cue goes.)
  const grains = (name, opts) => {
    clock += 5000;
    const from = made.length;
    RA.play(name, opts);
    return made.slice(from).filter(n => n.kind === 'noise').map(src => { const f = src.to[0], g = f.to[0]; return { type: f.type, freq: f.frequency.value, peak: g.gain.peak, into: g.to[0] }; });
  };
  // (Does a grain go through a rival's dulling on its way to the speakers?)
  const dulled = n => !!n && (n.kind === 'filter' && n.type === 'lowpass' && n.frequency.value === LOWPASS || n.to.some(dulled));
  const yours = grains('dig', {}), theirs = grains('dig', { rival: true, pan: 0.4 });
  const scratches = gs => gs.filter(x => x.type === 'bandpass' && x.freq > LOWPASS);
  check(scratches(yours).length >= 4 && yours.every(x => !dulled(x.into)), `your dig: ${scratches(yours).length} scratches of its legs above ${LOWPASS} Hz, nothing dulled`);
  check(scratches(theirs).length === scratches(yours).length && scratches(theirs).every(x => !dulled(x.into)), `a rival's dig: its ${scratches(theirs).length} scratches go round its dulling (the ${LOWPASS} Hz lowpass that took them off), so they carry over the music`);
  check(theirs.filter(x => !(x.type === 'bandpass' && x.freq > LOWPASS)).every(x => dulled(x.into)), '...and the rest of it is dulled, as before');
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  check(scratches(theirs).every((x, i) => near(x.peak, scratches(yours)[i].peak * RIVAL_VOLUME)), `...as soft as the rest of a rival's (${RIVAL_VOLUME} of yours)`);
  // A rival's chomp: the same cue as yours, dulled, and softer than a rival's other sounds (RIVAL_CHOMP of them).
  const RIVAL_CHOMP = +/\bRIVAL_CHOMP = ([\d.]+)/.exec(asrc)[1];
  const bite = grains('meat', {}), theirBite = grains('meat', { rival: true, pan: 0.4 });
  check(RIVAL_CHOMP < 1 && theirBite.length === bite.length && theirBite.every((x, i) => near(x.peak, bite[i].peak * RIVAL_VOLUME * RIVAL_CHOMP) && dulled(x.into)), `a rival's bead: your nom's bite, dulled, at ${RIVAL_VOLUME * RIVAL_CHOMP} of yours (softer than a rival's leap or dash, at ${RIVAL_VOLUME})`);
  const heal = grains('heal', {}), scrabble = grains('scrabble', {});
  const flecks = heal.filter(x => (x.type === 'highpass' || x.type === 'bandpass') && x.freq >= 2000);
  check(flecks.length >= 3, `a burrow closing over: ${flecks.length} flecks of sawdust above 2 kHz, where the music leaves room`);
  const loudest = gs => Math.max(...gs.map(x => x.peak));
  check(loudest(heal) >= 2 * loudest(scrabble), `...and its crumble louder than a beetle's scrabble (${loudest(heal).toFixed(2)} to ${loudest(scrabble).toFixed(2)}), which the music buries`);
  console.log(`ok   the sound over the music: a rival's dig keeps its legs' scratches round its dulling, as soft as the rest; a burrow closing over has ${flecks.length} flecks of sawdust above 2 kHz and a crumble louder than the scrabble`);
}
