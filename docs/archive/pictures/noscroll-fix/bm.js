// Board sizes, main against the branch: node bm.js <mode> [out.json]
// mode: named | sweep-up | sweep-over
// BM_WT and BM_MAIN are the two checkouts to compare (the branch's and main's); by default this
// repository and a worktree of main beside it (git worktree add ../main-wt origin/main).
const fs = require('fs'), path = require('path');
const WT = process.env.BM_WT || path.join(__dirname, '..', '..', '..');
const MAIN = process.env.BM_MAIN || path.join(__dirname, '..', '..', '..', '..', 'main-wt');
const { launch, serve } = require(WT + '/tools/browser.js');
const mode = process.argv[2] || 'named', out = process.argv[3];
const builds = (process.env.BUILDS || 'main,wt').split(',');
const ROOTS = { main: MAIN, wt: WT };
const READ = `(() => { const q = s => document.querySelector(s), bx = el => el && el.getBoundingClientRect();
  const g = bx(q('#game')), se = document.scrollingElement, help = q('#help'), hb = bx(help), foot = bx(q('.foot')) || hb;
  const ch = q('.chatter');
  return { board: Math.round(g.width * 10) / 10, top: Math.round(g.top), scrollH: se.scrollHeight, vh: innerHeight, scrollW: se.scrollWidth, vw: innerWidth,
    helpX: help.scrollWidth > help.clientWidth + 1 && !!hb.height, chatLines: [...document.querySelectorAll("#chatlog li")].filter(li => li.getBoundingClientRect().height && !li.classList.contains("cut")).length, fit: ch.dataset.fit || '', helpH: hb && hb.height ? Math.round(hb.height) : 0, helpB: hb ? Math.round(hb.bottom) : 0, footB: foot ? Math.round(foot.bottom) : 0 }; })()`;
const settle = ev => ev(`new Promise(d => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => d(1), 30))))`);
(async () => {
  const sites = {};
  for (const k of builds) sites[k] = await serve(ROOTS[k]);
  const b = await launch(), ev = e => b.eval(e);
  const res = [];
  const at = async (k, w, h, touch, fresh, state = 'start') => {
    await b.viewport(w, h, { scale: touch ? 3 : 1, mobile: touch });
    if (fresh) {
      await b.go(sites[k].url + 'index.html?debug');
      if (state !== 'start') { await ev(`document.getElementById('${state === 'watch' ? 'watch' : 'start'}').click(); SnakeDebug.frames(80); const log = document.getElementById('chatlog'); for (let i = 0; i < 5; i++) log.insertAdjacentHTML('afterbegin', '<li><strong>Gobbler</strong> <span>Out of my way! I’m starving, and the bark is bare!</span></li>'); 'ok'`); }
    }
    await settle(ev); await settle(ev);
    return ev(READ);
  };
  try {
    if (mode === 'named') {
      const S = [[390, 844, 1], [390, 664, 1], [360, 640, 1], [375, 553, 1], [320, 460, 1], [768, 1024, 1], [800, 800, 0], [800, 800, 1], [1920, 945, 0], [960, 945, 0], [1000, 860, 0], [460, 612, 0], [540, 720, 1], [600, 700, 1], [720, 860, 0], [2560, 1305, 0], [820, 1106, 1], [412, 915, 1], [430, 740, 1]];
      for (const [w, h, t] of S) for (const st of ['start', 'play', 'watch']) {
        const row = { w, h, touch: !!t, state: st };
        for (const k of builds) row[k] = await at(k, w, h, !!t, true, st);
        res.push(row);
        console.log(`${w}x${h}${t ? ' touch' : ' mouse'} ${st.padEnd(5)} ` + builds.map(k => `${k}: ${row[k].board} scroll ${row[k].scrollH - row[k].vh} fit ${row[k].fit}/${row[k].chatLines} help ${row[k].helpH}${row[k].helpX ? " OVER" : ""}`).join(' | '));
      }
    } else {
      const grid = mode === 'sweep-up' ? { ws: [320, 340, 360, 375, 390, 412, 414, 430, 440], hs: [440, 940, 10], touch: [1] }
        : { ws: [460, 520, 580, 640, 700, 760, 820, 880, 960, 1040, 1120, 1200, 1300, 1440], hs: [560, 1180, 20], touch: [0, 1] };
      for (const t of grid.touch) for (const w of grid.ws) for (const k of builds) {
        let first = true;
        for (let h = grid.hs[0]; h <= grid.hs[1]; h += grid.hs[2]) {
          if (mode === 'sweep-over' && w / h >= 1.25) continue;
          const r = await at(k, w, h, !!t, first, process.env.STATE || "start"); first = false;
          res.push({ k, w, h, touch: !!t, ...r });
        }
      }
      // compare
      const key = r => `${r.w}x${r.h}${r.touch ? 't' : 'm'}`, by = {};
      for (const r of res) (by[key(r)] ||= {})[r.k] = r;
      let worse = 0;
      for (const [k, v] of Object.entries(by)) if (v.main && v.wt && v.wt.board < v.main.board - 0.5) { worse++; console.log(`${k}: main ${v.main.board} wt ${v.wt.board} (${(v.wt.board - v.main.board).toFixed(1)}) wt scroll ${v.wt.scrollH - v.wt.vh} fit ${v.wt.fit}`); }
      const scrolls = Object.entries(by).filter(([, v]) => v.wt && (v.wt.scrollH > v.wt.vh || v.wt.scrollW > v.wt.vw));
      const over = Object.entries(by).filter(([, v]) => v.wt && v.wt.helpX); console.log(`help squeezed at ${over.length}: ${over.map(([k]) => k).join(" ")}`);
      console.log(`${Object.keys(by).length} sizes, ${worse} with wt's board smaller; wt scrolls at ${scrolls.length}: ${scrolls.map(([k, v]) => `${k}+${v.wt.scrollH - v.wt.vh}${v.wt.scrollW > v.wt.vw ? 'w' + (v.wt.scrollW - v.wt.vw) : ''}`).join(' ')}`);
    }
  } finally { await b.close(); for (const s of Object.values(sites)) s.close(); }
  if (out) fs.writeFileSync(out, JSON.stringify(res));
})().catch(e => { console.error(e); process.exit(1); });
