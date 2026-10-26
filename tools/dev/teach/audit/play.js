// Plays real rounds as a new player would and records every banner as it
// shows: when, its words, how long it stays (at full strength, faded under the
// heads, leaving), which of its three places it's in, where it sits against
// the board's middle and your head, and whether a head, or the thing it's
// about, was under it. Screenshots each banner once, a moment after it lands.
//   node play.js <root> <label> <w>x<h>[@dpr][t] [--rounds N] [--seed S] [--cap SECONDS]
// (t: a phone, touch; else a desktop.) Writes out/<label>.json and shots/<label>-*.jpg.
const path = require('path');
const fs = require('fs');
const root = path.resolve(process.argv[2]);
const label = process.argv[3];
const m = /^(\d+)x(\d+)(?:@([\d.]+))?(t?)$/.exec(process.argv[4]);
const [W, H, DPR, TOUCH] = [+m[1], +m[2], +(m[3] || 1), !!m[4]];
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const ROUNDS = +arg('--rounds', 2), SEED = +arg('--seed', 7), CAP = +arg('--cap', 175);
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
const OUT = path.join(__dirname, 'out'), SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });

const PRE = `(() => {
  let s = ${SEED} >>> 0;
  Math.random = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  try { localStorage.clear(); sessionStorage.clear(); } catch {}
  const L = window.__L = { eps: [], cur: null, last: 0, round: 0, hint: [], hintCur: null, frames: 0 };
  const box = el => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const gap = (a, b) => Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w), a.y - (b.y + b.h), b.y - (a.y + a.h)); // (px between two boxes)
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = L.last ? Math.min(100, ts - L.last) : 16; L.last = ts; L.frames++;
    const el = document.getElementById('toast');
    if (!el || !window.SnakeDebug) return;
    const g = SnakeDebug.game(), now = performance.now();
    const hintEl = document.getElementById('steer-hint');
    if (hintEl && hintEl.classList.contains('on')) { if (!L.hintCur) { L.hintCur = { round: L.round, start: now, text: hintEl.textContent }; L.hint.push(L.hintCur); } L.hintCur.end = now; }
    else L.hintCur = null;
    if (el.hidden || !g) { if (L.cur) { L.cur.end = now; L.cur = null; } return; }
    const text = el.textContent, board = box(document.getElementById('game')), cell = board.w / 24;
    const cellBox = (x, y) => ({ x: board.x + x * cell, y: board.y + y * cell, w: cell, h: cell });
    if (!L.cur || L.cur.text !== text) {
      if (L.cur) L.cur.end = now;
      const me = g.snakes.find(s => s.isPlayer);
      const fs = getComputedStyle(el);
      L.cur = { i: L.eps.length, round: L.round, text, kind: el.dataset.kind || '', start: now, end: now, gtime: g.time, tick: g.tick, state: SnakeDebug.state(),
        board, vw: innerWidth, vh: innerHeight, font: parseFloat(fs.fontSize), lineH: parseFloat(fs.lineHeight) || parseFloat(fs.fontSize) * 1.2,
        rect: box(el), meLen: me ? me.body.length : 0, meAlive: !!me?.alive,
        events: (g.events || []).filter(e => typeof e.x === 'number').slice(0, 10).map(e => ({ type: e.type, x: e.x, y: e.y, mine: e.snake ? !!e.snake.isPlayer : undefined })),
        full: 0, faded: 0, leaving: 0, slot: { top: 0, low: 0, mid: 0 }, slotFirst: null, moves: 0,
        meUnder: 0, meUnderFull: 0, headUnder: 0, headUnderFull: 0, actUnder: 0, meNear: 0, minMeGap: 1e9, maxMidOff: 0, meDistCells: [] };
      L.eps.push(L.cur);
    }
    const c = L.cur, r = box(el);
    const leaving = el.classList.contains('leaving'), under = el.classList.contains('under');
    const slot = el.classList.contains('low') ? 'low' : el.classList.contains('mid') ? 'mid' : 'top';
    if (c.slotFirst == null) c.slotFirst = slot; else if (slot !== c.lastSlot) c.moves++;
    c.lastSlot = slot;
    c.slot[slot] += dt;
    if (leaving) c.leaving += dt; else if (under) c.faded += dt; else c.full += dt;
    c.rect = r; c.end = now;
    c.midOff = ((r.y + r.h / 2) - (board.y + board.h / 2)) / board.h; // (its middle against the board's, in boards: 0 is dead centre)
    c.maxMidOff = Math.max(c.maxMidOff, Math.abs(c.midOff));
    const full = !leaving && !under;
    for (const s of g.snakes) {
      if (!s.alive) continue;
      const hb = cellBox(s.body[0].x, s.body[0].y), on = hit(hb, r);
      if (s.isPlayer) {
        const gp = gap(hb, r) / cell;
        c.minMeGap = Math.min(c.minMeGap, gp);
        if (gp <= 2) c.meNear += dt;
        if (on) { c.meUnder += dt; if (full) c.meUnderFull += dt; }
        if (c.meDistCells.length < 400 && L.frames % 6 === 0) c.meDistCells.push(Math.round(gp * 10) / 10);
      } else if (on) { c.headUnder += dt; if (full) c.headUnderFull += dt; }
    }
    if (c.events.some(e => hit(cellBox(e.x, e.y), r))) c.actUnder += dt;
  }
  requestAnimationFrame(frame);
})();`;

// A new player: steers about as well as a rival would (a rival's brain), but
// now and then turns the wrong way, tries the jump every few seconds, and
// tries the flash a moment after it's told how (then now and then).
const NEWBIE = `(() => {
  window.press = (key, code) => { document.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true })); };
  window.nb = { on: true, slip: 1 / 110, tick: -1, wobble: 0, nextJump: 2500 + Math.random() * 4000, nextFlash: 1e12, flashTold: false, crash: false, presses: [] };
  setInterval(() => {
    if (!nb.on || SnakeDebug.state() !== 'running') return;
    const g = SnakeDebug.game(), me = g.snakes.find(s => s.isPlayer);
    if (!me || !me.alive || nb.tick === g.tick) return;
    nb.tick = g.tick;
    const back = d => d.x === -me.dir.x && d.y === -me.dir.y;
    let d;
    if (nb.crash) {
      const h = me.body[0], N = 24;
      d = [['left', h.x], ['right', N - 1 - h.x], ['up', h.y], ['down', N - 1 - h.y]].filter(([n]) => !back(SnakeEngine.DIRS[n])).sort((a, b) => a[1] - b[1]).map(([n]) => SnakeEngine.DIRS[n])[0];
    } else if (nb.wobble > 0) {
      nb.wobble--;
      const opts = Object.values(SnakeEngine.DIRS).filter(v => !back(v));
      d = opts[Math.floor(Math.random() * opts.length)];
    } else {
      me.pilotMemory ||= {};
      d = SnakeAI.decide(SnakeEngine.aiView(g, me), SnakeAI.PERSONAS.gobbler, me.pilotMemory);
      if (Math.random() < nb.slip) nb.wobble = 1; // (a slip: every 13 s or so in a first round, rarer as you learn)
    }
    const name = Object.keys(SnakeEngine.DIRS).find(k => SnakeEngine.DIRS[k] === d);
    if (d && d !== me.dir) press({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[name]);
    const t = g.time;
    const toast = document.getElementById('toast');
    if (!nb.flashTold && !toast.hidden && /flash is ready|Swipe ahead flashes/.test(toast.textContent)) { nb.flashTold = true; nb.nextFlash = t + 1500 + Math.random() * 1500; }
    if (t >= nb.nextJump) { press(' ', 'Space'); nb.presses.push(['jump', t]); nb.nextJump = t + 4000 + Math.random() * 8000; }
    if (t >= nb.nextFlash) { press('Shift', 'ShiftLeft'); nb.presses.push(['flash', t]); nb.nextFlash = t + 9000 + Math.random() * 12000; }
  }, 4);
  return 'ok';
})()`;

(async () => {
  const site = await serve(root);
  const b = await launch();
  const ev = e => b.eval(e);
  const shots = [];
  const result = { label, root: path.basename(root), W, H, DPR, touch: TOUCH, seed: SEED, rounds: [], eps: [], hint: [], errors: [] };
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: PRE });
    await b.viewport(W, H, { scale: DPR, mobile: TOUCH });
    await b.go(`${site.url}index.html?debug`, { settle: 1200 });
    await ev(NEWBIE);
    const shotFor = new Set();
    let shotN = 0;
    for (let r = 0; r < ROUNDS; r++) {
      await ev(`__L.round = ${r}; nb.slip = ${[1 / 110, 1 / 220, 1 / 600][Math.min(2, r)]}; nb.crash = false; nb.flashTold = false; nb.nextJump = 2500 + Math.random() * 4000; nb.nextFlash = 1e12; 'ok'`);
      // Play: the start card's button the first time, Enter after.
      if (r === 0) await ev(`document.getElementById('start').click(); 'ok'`);
      else await b.key('Enter');
      const t0 = Date.now();
      let over = false;
      while (!over) {
        await sleep(110);
        const st = await ev(`(() => { const g = SnakeDebug.game(), me = g.snakes.find(s => s.isPlayer), c = __L.cur, el = document.getElementById('toast');
          return { state: SnakeDebug.state(), time: g.time, alive: !!me?.alive, card: !document.getElementById('overlay').classList.contains('hidden'),
            cur: c && !el.hidden ? { i: c.i, text: c.text, age: performance.now() - c.start, slot: c.lastSlot, meUnder: c.meUnder > 0, under: el.classList.contains('under') } : null }; })()`);
        if (st.cur && !shotFor.has(st.cur.i) && st.cur.age > 450 && shotN < 75) {
          shotFor.add(st.cur.i);
          const f = path.join(SHOTS, `${label}-r${r}-e${st.cur.i}.jpg`);
          await b.send('Page.captureScreenshot', { format: 'jpeg', quality: 62, clip: { x: 0, y: 0, width: W, height: H, scale: Math.min(1.5, 1170 / (W * DPR)) * 1 } }).then(x => fs.writeFileSync(f, Buffer.from(x.data, 'base64')));
          shots.push({ i: st.cur.i, file: path.basename(f), age: Math.round(st.cur.age), slot: st.cur.slot, under: st.cur.under });
          shotN++;
        }
        if (st.time > CAP * 1000 && st.alive) await ev(`nb.crash = true; 'ok'`);
        if ((!st.alive && st.state !== 'countdown' && st.card) || Date.now() - t0 > (CAP + 90) * 1000) over = true;
      }
      const info = await ev(`(() => { const g = SnakeDebug.game(); return { time: g.time, snakes: g.snakes.map(s => ({ name: s.name, len: s.body.length, alive: s.alive, cause: s.cause || '' })), presses: nb.presses.splice(0), card: [document.getElementById('overlay-title').textContent, document.getElementById('overlay-text').textContent, document.getElementById('overlay-flavor').textContent] }; })()`);
      await b.shot(path.join(SHOTS, `${label}-r${r}-card.jpg`), 60);
      result.rounds.push(info);
      console.log(`${label} round ${r}: ${Math.round(info.time / 1000)} s, ${info.snakes[0].cause}`);
      await sleep(2500); // (reading the card)
    }
    const L = await ev(`(() => ({ eps: __L.eps, hint: __L.hint }))()`);
    result.eps = L.eps.map(e => { const s = shots.find(x => x.i === e.i); return { ...e, shot: s?.file || null, ms: Math.round(e.end - e.start) }; });
    result.hint = L.hint.map(h => ({ ...h, ms: Math.round(h.end - h.start) }));
    result.errors = b.errors.slice();
  } finally {
    await b.close(); site.close();
  }
  fs.writeFileSync(path.join(OUT, `${label}.json`), JSON.stringify(result, null, 1));
  for (const e of result.eps) console.log(`${(e.gtime / 1000).toFixed(1).padStart(6)}s r${e.round} ${String(e.ms).padStart(5)}ms full ${String(Math.round(e.full)).padStart(5)} faded ${String(Math.round(e.faded)).padStart(5)} at ${e.slotFirst}${e.moves ? '+' + e.moves : ''} off-mid ${e.midOff.toFixed(2)} me-gap ${e.minMeGap.toFixed(1)} meUnder ${Math.round(e.meUnder)} head ${Math.round(e.headUnder)} act ${Math.round(e.actUnder)} | ${e.text}`);
})().catch(e => { console.error(e); process.exit(1); });
