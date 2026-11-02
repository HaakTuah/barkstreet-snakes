// ------------------------------------------------------------ the babble
// A rival's bubble is heard as a burble in its own voice (audio/'s babble),
// never distracting: every voice but Mute's has one, and Mute stays silent;
// at most BABBLE_MAX seconds whatever the line's length; well under your own
// chomp, dulled as a rival's is, and quieter still in a tight moment; never
// two at once and at most one every few seconds, however often bubbles come;
// none just after your own sound (or the world's loudest), and one sounding
// is cut short by yours; its own switch (remembered, as barkbite-voices),
// silent while muted, and the music's switch leaves it be. On a stand-in
// context that records each node, its envelope's peak and when it stops.
{
  const asrc = audioSource();
  const num = k => +new RegExp(`\\b${k} = ([\\d.]+)`).exec(asrc)[1];
  const [BABBLE_MAX, BABBLE_YIELD, BABBLE_LEVEL, BABBLE_HUSH, LOWPASS] = ['BABBLE_MAX', 'BABBLE_YIELD', 'BABBLE_LEVEL', 'BABBLE_HUSH', 'RIVAL_LOWPASS'].map(num);
  const GAP = +/\bbabble: (\d+)/.exec(asrc)[1];
  let clock = 0, made = [];
  const param = () => {
    const p = { value: 0, peak: 0, cuts: [] };
    for (const m of ['setValueAtTime', 'exponentialRampToValueAtTime', 'cancelScheduledValues']) p[m] = () => p;
    p.linearRampToValueAtTime = v => { p.peak = Math.max(p.peak, v); return p; };
    p.setTargetAtTime = (v, t) => { if (v === 0) p.cuts.push(t); return p; };
    return p;
  };
  const node = kind => {
    const n = { kind, to: [], end: 0, gain: param(), frequency: param(), Q: param(), pan: param(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(),
      connect: t => { n.to.push(t); return t; }, disconnect() {}, start() {}, stop(t) { n.end = t; }, setPeriodicWave() {} };
    made.push(n);
    return n;
  };
  class Recorder {
    constructor() { this.state = 'suspended'; this.sampleRate = 8000; this.destination = node('speakers'); }
    get currentTime() { return clock / 1000; }
    resume() { this.state = 'running'; this.onstatechange?.(); }
    suspend() { this.state = 'suspended'; }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  }
  for (const [m, kind] of [['createGain', 'gain'], ['createBiquadFilter', 'filter'], ['createOscillator', 'osc'], ['createBufferSource', 'noise'], ['createStereoPanner', 'panner'], ['createDynamicsCompressor', 'compressor'], ['createPeriodicWave', 'wave']]) Recorder.prototype[m] = () => node(kind);
  const store = {};
  const fresh = () => {
    const c = vm.createContext({
      window: { AudioContext: Recorder, performance: { now: () => clock }, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } } },
      document: { hidden: false, addEventListener() {} }, setTimeout: () => 0, clearTimeout() {},
    });
    runAudio(c);
    c.window.SnakeAudio.unlock();
    return c.window.SnakeAudio;
  };
  let A = fresh();
  // A cue played now: what it built (nothing, if it was held back), its loudest envelope, when it's over.
  const play = (name, opts) => {
    const from = made.length;
    A.play(name, opts);
    const nodes = made.slice(from), t = clock / 1000;
    const sources = nodes.filter(n => n.kind === 'osc' || n.kind === 'noise');
    return { built: sources.length > 0, nodes, sources, loudest: Math.max(0, ...nodes.filter(n => n.kind === 'gain').map(n => n.gain.peak)), long: Math.max(0, ...sources.map(n => n.end)) - t };
  };
  // (Does a sound go through a rival's dulling on its way out? A gobble's wobble goes to a pitch, not out.)
  const dulled = n => n.kind === 'filter' && n.type === 'lowpass' && n.frequency.value === LOWPASS || !!n.to?.some(dulled);
  const heard = n => n.kind === 'speakers' || !!n.to?.some(heard);
  const babble = (voice, more) => play('babble', { voice, chars: 30, pan: 0.3, ...more });
  const later = () => { clock += 10000; };

  // Every voice has its own (all but Mute's), heard by its pitch and timbre.
  const BABBLERS = Object.keys(new Function(`return ${/\n  const BABBLERS = (\{[\s\S]*?\n  \});/.exec(asrc)[1]}`)());
  const cast = Object.keys(VOICES).filter(k => k !== 'mute');
  check(cast.every(k => BABBLERS.includes(k)) && !BABBLERS.includes('mute'), `every rival but Mute has a babble (${BABBLERS.length}), Mute none`);
  later();
  check(!babble('mute').built, 'Mute stays silent');
  check(babble('mason').built, '...and holds no one else\'s back');
  // At most BABBLE_MAX seconds, however long the line; a longer line says more (up to its voice's most).
  let longest = 0, shortest = Infinity;
  const yourChomp = (later(), play('eat'));
  for (const k of BABBLERS) {
    for (const chars of [4, 30, 200]) {
      later();
      const b = babble(k, { chars });
      check(b.built, `${k} babbles (a ${chars}-letter line)`);
      longest = Math.max(longest, b.long); shortest = Math.min(shortest, b.long);
      // Well under your own chomp, after the dulling and all: at most a fifth as loud (14 dB down).
      check(b.loudest <= yourChomp.loudest / 5, `${k}'s babble (${b.loudest.toFixed(3)}) is well under your chomp (${yourChomp.loudest.toFixed(3)})`);
      check(b.sources.every(s => dulled(s) || !heard(s)), `${k}'s babble is dulled, as a rival's is`);
    }
  }
  check(longest <= BABBLE_MAX + 0.01, `every babble over within ${BABBLE_MAX} s whatever the line's length (the longest ${longest.toFixed(3)} s, the shortest ${shortest.toFixed(3)} s)`);
  // Quieter still in a tight moment.
  later(); const calm = babble('mason', { tight: 0 }).loudest;
  later(); const tense = babble('mason', { tight: 1 }).loudest;
  check(Math.abs(tense - calm * (1 - BABBLE_HUSH)) < calm * 0.25 && tense < calm, `in a tight moment, quieter (${tense.toFixed(3)} to ${calm.toFixed(3)})`);
  check(BABBLE_LEVEL < 1, `softer than a rival's other sounds (${BABBLE_LEVEL} of them)`);

  // Never two at once, at most one every GAP ms, whoever speaks.
  later();
  check(babble('gobbler').built && !babble('ghost').built, 'two bubbles at once: one babble');
  clock += GAP / 2; check(!babble('star').built, `...another bubble ${GAP / 2} ms on: silent`);
  clock += GAP / 2; check(babble('star').built, `...one ${GAP} ms on: heard`);
  // A chatty round: a bubble every 1.2 s (the chatter's quickest) for a minute.
  later();
  const heardAt = [];
  for (let i = 0; i < 50; i++, clock += 1200) if (babble(BABBLERS[i % BABBLERS.length]).built) heardAt.push(clock);
  const gaps = heardAt.slice(1).map((t, i) => t - heardAt[i]);
  check(heardAt.length <= 60000 / GAP + 1 && gaps.every(g => g >= GAP), `fifty bubbles in a minute: ${heardAt.length} babbles, at least ${Math.min(...gaps)} ms apart`);

  // Never over your own sounds: none starts just after one, and one sounding is cut short by one.
  for (const [cue, opts, whose] of [['eat', {}, 'your chomp'], ['hungerWarn', {}, 'your hunger warning'], ['death', {}, 'your crash'], ['crash', {}, 'the woodpecker\'s crash']]) {
    later();
    play(cue, opts);
    clock += BABBLE_YIELD - 50; check(!babble('sovereign').built, `${BABBLE_YIELD - 50} ms after ${whose}: silent`);
    clock += 100; check(babble('sovereign').built, `...${BABBLE_YIELD + 50} ms after: heard`);
  }
  later();
  const b = babble('colonist');
  clock += 100;
  play('eat');
  const voice = b.nodes[0];
  check(voice.gain.cuts.length === 1 && voice.gain.cuts[0] < clock / 1000 + 0.05, 'a babble sounding when your chomp comes is cut short');
  later();
  const b2 = babble('colonist');
  clock += 100;
  play('eat', { rival: true, pan: 0.2 });
  check(b2.nodes[0].gain.cuts.length === 0, '...a rival\'s chomp leaves it be');
  later();
  play('meat', { rival: true });
  clock += 100;
  check(babble('joker').built, '...and doesn\'t hold one back');

  // Its own switch, remembered; muted, silent; the music's switch leaves it be.
  later();
  check(A.isVoicesOn() && A.toggleVoices() === false && !A.isVoicesOn() && store['barkbite-voices'] === '0', 'the Voices switch turns it off, remembered as barkbite-voices');
  check(!babble('mason').built, '...off: silent');
  A = fresh();
  later();
  check(!A.isVoicesOn() && !babble('mason').built, '...still off on the next visit');
  A.setVoicesOn(true);
  later();
  check(babble('mason').built && store['barkbite-voices'] === '1', '...and on again: heard');
  later();
  A.setMuted(true);
  check(!babble('mason').built, 'muted: silent');
  A.setMuted(false);
  later();
  A.setMusicOn(false);
  check(babble('mason').built, 'the music off: still heard (its own switch)');
  A.setMusicOn(true);

  // The chatter tells the game of each bubble as it appears (the game babbles for a rival's).
  const shown = [];
  C.onBubble((s, text) => shown.push([s.personaKey, text]));
  const g = stage(['mason']);
  C.replay(g.snakes[1], 'Veni, vidi, vici.');
  check(shown.length === 1 && shown[0][0] === 'mason' && shown[0][1] === 'Veni, vidi, vici.', 'a rival\'s bubble is told to whoever listens (the game babbles for it)');
  C.onBubble(null);
  console.log(`ok   the babble: ${BABBLERS.length} voices (Mute silent), each within ${BABBLE_MAX} s, well under your chomp, quieter when tight; one at a time, ${GAP} ms apart at least; none within ${BABBLE_YIELD} ms of your own sound, and cut short by it; its own switch; muted, none`);
}
