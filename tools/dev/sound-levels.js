// How the sound piles up while you watch a round, at 1×, 2× and 4×: a real round in headless
// Chrome (its own real-time loop and Web Audio), every cue the round asks for logged with
// whether it sounded (it built nodes) or was held back (a gap, the voice limit, a yield).
// Per speed: cues asked for and heard a second, the most heard in any 250 ms and any 1 s,
// and the busiest cues. Watching only (a round you play runs at 1×).
//   node tools/dev/sound-levels.js [seconds per speed, 40] [rivals, e.g. gobbler,vulture,star]
const { launch, serve } = require('../browser.js');
const SECS = +process.argv[2] || 40, RIVALS = (process.argv[3] || '').split(',').filter(Boolean);
(async () => {
  const srv = await serve(), b = await launch();
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__built = 0;
    const AC = window.AudioContext;
    for (const m of ['createGain', 'createOscillator', 'createBufferSource']) { const f = AC.prototype[m] || BaseAudioContext.prototype[m]; AC.prototype[m] = function (...a) { window.__built++; return f.apply(this, a); }; }
  ` });
  const rows = [];
  for (const speed of [1, 2, 4]) {
    await b.go(srv.url + '?debug', { settle: 800 });
    await b.eval(`(() => {
      const A = window.SnakeAudio, play = A.play;
      window.__log = [];
      A.play = (name, opts) => { const before = window.__built; play(name, opts); window.__log.push([performance.now(), name, !!(opts && opts.rival), window.__built > before]); };
      A.unlock(); return true; })()`);
    if (RIVALS.length) await b.eval(`SnakeDebug.setup(${JSON.stringify(RIVALS)}, true), true`);
    await b.eval(`document.getElementById('watch').click(), true`);
    await b.sleep(4500); // (the countdown)
    await b.eval(`document.querySelector('#speed button[data-speed="${speed}"]')?.click(), window.__log.length = 0, true`);
    await b.sleep(SECS * 1000);
    const log = await b.eval(`window.__log`), state = await b.eval(`SnakeDebug.state()`);
    const heard = log.filter(l => l[3]), t0 = log.length ? log[0][0] : 0, span = SECS;
    const most = w => { let m = 0; for (let i = 0, j = 0; i < heard.length; i++) { while (heard[i][0] - heard[j][0] > w) j++; m = Math.max(m, i - j + 1); } return m; };
    const by = {};
    for (const [, n, r, h] of log) { const k = n + (r ? '~' : ''); by[k] = by[k] || [0, 0]; by[k][0]++; if (h) by[k][1]++; }
    const top = Object.entries(by).sort((x, y) => y[1][1] - x[1][1]).slice(0, 6).map(([k, [a, h]]) => `${k} ${h}/${a}`).join(', ');
    rows.push(`| ${speed}× | ${(log.length / span).toFixed(1)} | ${(heard.length / span).toFixed(1)} | ${most(250)} | ${most(1000)} | ${top} | ${state} |`);
    void t0;
  }
  console.log('| speed | asked /s | heard /s | most in 250 ms | most in 1 s | busiest (heard/asked; ~ a rival\'s) | state at the end |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  console.log(rows.join('\n'));
  if (b.errors.length) console.log('page errors:', b.errors.slice(0, 3));
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
