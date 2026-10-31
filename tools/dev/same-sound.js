// The sound unchanged: this copy's audio/ against a git ref's (audio.js, before the split, or
// audio/'s files, each in its index.html's order). Every cue with each kind of opts, the rivals'
// babble, the drum's table, the music through its stages frame by frame (and the woodpecker
// afresh after a round), the weather, mute and the switches, on a stand-in context that logs
// every node made and every call with its arguments, Math.random seeded alike. The same log is
// the same sound.
//   node tools/dev/same-sound.js [ref]   (ref: origin/develop unless told; run from the repository)
const fs = require('fs'), vm = require('vm'), cp = require('child_process');
const ref = process.argv[2] || 'origin/develop';
const files = html => [...html.matchAll(/<script src="(audio[^"]*)"/g)].map(m => m[1]);
const atRef = f => cp.execSync(`git show ${ref}:${f}`, { encoding: 'utf8' });
const oldSrc = files(atRef('index.html')).map(f => [f, atRef(f)]);
const newSrc = files(fs.readFileSync('index.html', 'utf8')).map(f => [f, fs.readFileSync(f, 'utf8')]);
function run(srcs) {
  const log = []; let clock = 0, id = 0, seed = 12345;
  const fmt = a => (a && a.__id ? `#${a.__id}` : typeof a === 'number' ? +a.toPrecision(12) : a instanceof Float32Array ? `buf${a.length}` : typeof a === 'function' ? 'fn' : JSON.stringify(a));
  const obj = kind => {
    const me = id++; const store = {};
    return new Proxy(function () {}, {
      get(t, k) {
        if (k === '__id') return me; if (typeof k === 'symbol') return undefined;
        if (k in store) return store[k];
        if (['gain', 'frequency', 'Q', 'pan', 'threshold', 'knee', 'ratio', 'attack', 'release', 'detune', 'playbackRate'].includes(k)) return (store[k] = obj(`${kind}.${k}`));
        return (...args) => { log.push(`${kind}#${me}.${k}(${args.map(fmt).join(',')})`); if (k === 'connect') return args[0]; return undefined; };
      },
      set(t, k, v) { store[k] = v; log.push(`${kind}#${me}.${String(k)}=${fmt(v)}`); return true; },
    });
  };
  class Context {
    constructor() { this.state = 'suspended'; this.sampleRate = 8000; this.destination = obj('dest'); }
    get currentTime() { return clock / 1000; }
    resume() { this.state = 'running'; log.push('resume'); this.onstatechange && this.onstatechange(); return Promise.resolve(); }
    suspend() { this.state = 'suspended'; log.push('suspend'); return Promise.resolve(); }
    createBuffer(ch, len, rate) { log.push(`buffer(${ch},${len},${rate})`); return { getChannelData: () => new Float32Array(len) }; }
  }
  for (const m of ['createGain', 'createBiquadFilter', 'createOscillator', 'createBufferSource', 'createStereoPanner', 'createDynamicsCompressor', 'createPeriodicWave', 'createWaveShaper', 'createDelay', 'createConvolver']) Context.prototype[m] = function (...a) { log.push(`${m}(${a.map(fmt).join(',')})`); return obj(m.slice(6)); };
  const timers = [], store = {};
  const c = vm.createContext({
    window: { AudioContext: Context, performance: { now: () => clock }, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); log.push(`store ${k}=${v}`); } } },
    document: { hidden: false, addEventListener() {} },
    setTimeout: (fn, ms) => { timers.push([clock + (ms || 0), fn]); return timers.length; }, clearTimeout: n => { if (timers[n - 1]) timers[n - 1][1] = null; },
    setInterval: (fn, ms) => { timers.push([clock + ms, fn, ms]); return timers.length; }, clearInterval: n => { if (timers[n - 1]) timers[n - 1][1] = null; },
  });
  vm.runInContext(`Math.random = (() => { let s = ${seed}; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();`, c);
  for (const [f, s] of srcs) vm.runInContext(s, c, { filename: f });
  const A = c.window.SnakeAudio;
  const tick = ms => { const until = clock + ms; for (;;) { timers.sort((a, b) => a[0] - b[0]); const i = timers.findIndex(t => t[1] && t[0] <= until); if (i < 0) break; const [at, fn, every] = timers[i]; clock = at; if (every) timers[i][0] += every; else timers[i][1] = null; fn(); } clock = until; };
  log.push('API ' + Object.keys(A).join(','));
  log.push('unlock ' + A.unlock());
  const names = new Set();
  const m = /const CUES = \{([\s\S]*?)\n  \};/.exec(srcs.map(s => s[1]).join('\n'))[1];
  for (const x of m.matchAll(/^    (\w+)\s*\(/gm)) names.add(x[1]);
  log.push('CUES ' + [...names].join(','));
  const OPTS = [undefined, { rival: true, pan: 0.4 }, { pitch: 3, volume: 0.6, pan: -0.7 }, { streak: 5 }, { gold: true, streak: 9 }, { crest: 1.2 }, { delay: 0.3 }, { strike: 4, from: 60, rate: 1.5 }, { strike: 0 }, { land: 0.5 }, { settle: true }];
  for (const name of names) for (const o of OPTS) { tick(4000); log.push(`-- ${name} ${JSON.stringify(o)}`); A.play(name, o); }
  const voices = [...(/const BABBLERS = \{([\s\S]*?)\n  \};/.exec(srcs.map(s => s[1]).join('\n'))[1]).matchAll(/^    (\w+):/gm)].map(x => x[1]).concat('mute');
  log.push('BABBLERS ' + voices.join(','));
  for (const voice of voices) for (const o of [{ chars: 40, pan: 0.2 }, { chars: 120, tight: true, pan: -0.5 }]) { tick(9000); log.push(`-- babble ${voice}`); A.play('babble', { voice, ...o }); }
  for (let s = 0; s < 14; s++) log.push(`drum ${s} ${A.drumBlows(s).join(',')}`);
  const frames = (stage, mood, ms) => { for (let t = 0; t < ms; t += 50) { A.music(stage, mood); tick(50); } };
  for (const [stage, mood] of [['title'], ['round', { danger: 0, intensity: 0.2 }], ['round', { danger: 0.8, watching: true, intensity: 0.9 }], ['round', { danger: 1, paused: true }], ['round', { intensity: 1 }]]) { log.push(`-- music ${stage} ${JSON.stringify(mood)}`); frames(stage, mood, 6000); for (const cue of ['aim', 'drum', 'drum', 'drum', 'drum', 'aim']) { A.play(cue, {}); frames(stage, mood, 1500); } }
  log.push('-- back to the title'); frames('title', undefined, 3000); for (const cue of ['aim', 'drum']) { A.play(cue, {}); frames('title', undefined, 1500); }
  frames('title', undefined, 80000); log.push('-- idle'); frames('off', undefined, 2000);
  for (const w of ['rain', 'wind', 'storm', 'snow', 'none']) { log.push(`-- weather ${w}`); A.weather(w); tick(5000); }
  A.music('round', { danger: 0.3 }); tick(3000);
  log.push('mute ' + A.toggleMuted()); A.play('apple'); tick(2000); log.push('unmute ' + A.toggleMuted()); A.play('apple'); tick(2000);
  log.push('music ' + A.toggleMusic() + A.isMusicOn()); tick(2000); log.push('voices ' + A.toggleVoices() + A.isVoicesOn()); A.play('babble', { voice: 'star', chars: 30 }); tick(9000);
  log.push('music ' + A.setMusicOn(true) + ' voices ' + A.setVoicesOn(true)); A.music('round', {}); tick(4000);
  return log;
}
const a = run(oldSrc), b = run(newSrc);
const n = Math.max(a.length, b.length); let diff = -1;
for (let i = 0; i < n; i++) if (a[i] !== b[i]) { diff = i; break; }
if (diff >= 0) { console.log(`DIFFER at entry ${diff} of ${a.length}/${b.length}:\n old: ${a[diff]}\n new: ${b[diff]}`); process.exit(1); }
console.log(`same as ${ref}: ${a.length} entries (${a.filter(l => l.startsWith('create')).length} nodes made, ${a.filter(l => l.startsWith('-- ')).length} plays); ${oldSrc.map(f => f[0]).join(" + ")} against ${newSrc.map(f => f[0]).join(" + ")})`);
