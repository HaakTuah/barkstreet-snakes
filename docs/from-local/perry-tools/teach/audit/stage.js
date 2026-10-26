// The lessons a new player rarely meets in their first rounds, made to
// happen for real in a running round (the rules do the rest): the moment is
// set up just ahead of your head, and the banner it brings is recorded as
// play.js records them (the same recorder), and shot.
//   node stage.js <root> <label> <w>x<h>[@dpr][t] <scene,...>
// scenes: choke (your own bead ahead, then an apple while you cough),
// alight (fire ahead), dash (a golden leaf ahead, then a flash at a thin body)
const path = require('path'), fs = require('fs');
const root = path.resolve(process.argv[2]), label = process.argv[3];
const m = /^(\d+)x(\d+)(?:@([\d.]+))?(t?)$/.exec(process.argv[4]);
const [W, H, DPR, TOUCH] = [+m[1], +m[2], +(m[3] || 1), !!m[4]];
const SCENES = (process.argv[5] || 'choke,alight').split(',');
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
const src = fs.readFileSync(path.join(__dirname, 'play.js'), 'utf8');
const PRE = /const PRE = `([\s\S]*?)`;\n/.exec(src)[1].replace('${SEED}', '3'); // (play.js's recorder, its seed 3)
const SHOTS = path.join(__dirname, 'shots'), OUT = path.join(__dirname, 'out');
// A cell n ahead of your head, the way you're going.
const AHEAD = n => `const g = SnakeDebug.game(), me = g.snakes.find(s => s.isPlayer), h = me.body[0], x = h.x + me.dir.x * ${n}, y = h.y + me.dir.y * ${n};`;
const SET = {
  choke: [`(() => { ${AHEAD(2)} g.food = g.food.filter(f => !(f.x === x && f.y === y)); g.food.push({ x, y, kind: 'pellet', color: '#4ade80', owner: me.id, expires: g.tick + 400 }); return [x, y]; })()`,
    `(() => { ${AHEAD(2)} g.food = g.food.filter(f => !(f.x === x && f.y === y)); g.food.push({ x, y, kind: 'apple', expires: g.tick + 400 }); return [x, y]; })()`],
  alight: [`(() => { ${AHEAD(2)} g.fires.set(y * 24 + x, { from: g.tick, until: g.tick + 60, group: 99, strike: false }); return [x, y]; })()`],
};
(async () => {
  const site = await serve(root), b = await launch();
  const res = [];
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: PRE });
    await b.viewport(W, H, { scale: DPR, mobile: TOUCH });
    for (const scene of SCENES) {
      await b.go(`${site.url}index.html?debug`, { settle: 1000 });
      await b.eval(`SnakeDebug.setup(['sniper', 'mason', 'gobbler']); document.getElementById('start').click(); 'ok'`);
      // Steer clear for 9 s (a rival's brain), so the opening's lessons are over.
      await b.eval(`window.__auto = setInterval(() => { const g = SnakeDebug.game(), me = g.snakes.find(s => s.isPlayer); if (SnakeDebug.state() !== 'running' || !me?.alive || window.__t === g.tick) return; window.__t = g.tick; me.pilotMemory ||= {}; const d = SnakeAI.decide(SnakeEngine.aiView(g, me), SnakeAI.PERSONAS.ghost, me.pilotMemory); const n = Object.keys(SnakeEngine.DIRS).find(k => SnakeEngine.DIRS[k] === d); if (d !== me.dir) document.dispatchEvent(new KeyboardEvent('keydown', { key: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[n], bubbles: true })); }, 4); 'ok'`);
      await sleep(9500);
      await b.eval(`clearInterval(window.__auto); 'ok'`); // (straight on, into what's set)
      const from = await b.eval('__L.eps.length');
      for (const [i, s] of SET[scene].entries()) {
        const at = await b.eval(s);
        console.log(`${label} ${scene} step ${i}: at ${at}`);
        await sleep(i < SET[scene].length - 1 ? 300 : 0);
      }
      for (let k = 0; k < 2; k++) { // (its banners, a moment after each lands)
        const i = from + k;
        const t0 = Date.now();
        while (Date.now() - t0 < 4000 && !(await b.eval(`__L.eps.length > ${i} && performance.now() - __L.eps[${i}].start > 500`))) await sleep(50);
        if (await b.eval(`__L.eps.length > ${i}`)) await b.shot(path.join(SHOTS, `${label}-stage-${scene}-${k}.jpg`), 70);
      }
      await sleep(3500);
      const eps = await b.eval(`__L.eps.slice(${from})`);
      for (const e of eps) { res.push({ scene, ...e, ms: Math.round(e.end - e.start) }); console.log(`  ${Math.round(e.end - e.start)} ms (full ${Math.round(e.full)}) ${e.slotFirst} mid${e.midOff.toFixed(2)} me ${e.minMeGap.toFixed(1)}c meUnder ${Math.round(e.meUnder)} act ${Math.round(e.actUnder)} | ${e.text}`); }
    }
  } finally { await b.close(); site.close(); }
  fs.writeFileSync(path.join(OUT, `stage-${label}.json`), JSON.stringify(res, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
