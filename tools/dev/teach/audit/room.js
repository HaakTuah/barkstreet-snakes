// The room round the board on phones (CSS px), in a round: the ledge under
// the board, the chatter panel, the help line, the screen's foot; for where
// a bigger woodpecker could stand. node room.js <root>
const path = require('path');
const root = path.resolve(process.argv[2]);
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root), b = await launch();
  try {
    for (const [w, h, dpr] of [[390, 844, 3], [360, 640, 3], [375, 667, 2], [412, 915, 2.625], [360, 800, 3]]) {
      await b.viewport(w, h, { scale: dpr, mobile: true });
      await b.go(`${site.url}index.html?debug`, { settle: 900 });
      await b.eval(`document.getElementById('start').click(); 'ok'`);
      await sleep(1600);
      const r = await b.eval(`(() => {
        const q = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width && !r.height) return null; const k = v => Math.round(v); return { y: k(r.top), b: k(r.bottom), x: k(r.left), r: k(r.right), h: k(r.height) }; };
        return { vh: innerHeight, header: q('header'), tags: q('#scoreboard'), board: q('#game'), frame: q('.board'), ledge: q('#perch-ledge'), chatter: q('.chatter'), chatHead: q('.chatter h2') || q('.chatter header') || q('.chatter .chatter-head'), help: q('#help'), log: q('#chatlog') };
      })()`);
      console.log(`${w}x${h}: ${JSON.stringify(r)}`);
    }
  } finally { await b.close(); site.close(); }
})().catch(e => { console.error(e); process.exit(1); });
