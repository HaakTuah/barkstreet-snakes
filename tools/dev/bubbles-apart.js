// How long the rivals' speech bubbles overlap while you watch at 4×, on any
// copy of the game (for a before and after; #326):
//   node bubbles-apart.js <root> <seconds> <w>x<h>
// Every frame it reads each bubble's drawn box (its words, once mostly faded
// in) and times each pair that overlaps: episodes, total and longest.
const path = require('path');
const root = path.resolve(process.argv[2]), secs = +(process.argv[3] || 60);
const [vw, vh] = (process.argv[4] || '390x844').split('x').map(Number);
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.viewport(vw, vh, { scale: 1, mobile: vw < 600 });
    await b.go(site.url + 'index.html', { settle: 1000 });
    await b.eval(`(() => {
      const st = window.__ov = { episodes: 0, total: 0, longest: 0, frames: 0, open: new Map() };
      let last = performance.now();
      const tick = now => {
        const dt = now - last; last = now; st.frames++;
        const boxes = [...document.querySelectorAll('.bubble')].map(el => {
          const sp = el.firstElementChild || el;
          if (+getComputedStyle(sp).opacity < 0.5 || +getComputedStyle(el).opacity < 0.5) return null;
          return { el, r: sp.getBoundingClientRect() };
        }).filter(Boolean);
        const seen = new Set();
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].r, c = boxes[j].r;
          if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) {
            const key = [boxes[i].el, boxes[j].el];
            let k = [...st.open.keys()].find(x => x[0] === key[0] && x[1] === key[1]);
            if (!k) { k = key; st.open.set(k, 0); st.episodes++; }
            st.open.set(k, st.open.get(k) + dt); st.total += dt; seen.add(k);
            st.longest = Math.max(st.longest, st.open.get(k));
          }
        }
        for (const k of [...st.open.keys()]) if (!seen.has(k)) st.open.delete(k);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return 'ok';
    })()`);
    const end = Date.now() + secs * 1000;
    let rounds = 0;
    while (Date.now() < end) {
      const again = await b.eval(`(() => { const o = document.getElementById('overlay'); if (o.classList.contains('hidden')) return false; const w = document.getElementById('watch'); if (w.hidden) return false; w.click(); return true; })()`);
      if (again) { rounds++; await sleep(800); await b.eval(`document.querySelector('[data-speed="4"]').click(); 'ok'`); }
      await sleep(500);
    }
    const r = await b.eval(`JSON.stringify({ episodes: __ov.episodes, totalMs: Math.round(__ov.total), longestMs: Math.round(__ov.longest), frames: __ov.frames })`);
    console.log(`${vw}x${vh}, ${secs} s, ${rounds} rounds started:`, r);
  } finally { await b.close(); site.close(); }
})().catch(e => { console.error(e); process.exit(1); });
