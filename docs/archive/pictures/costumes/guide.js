// A picture of the Field guide's "Rivals who change" section.
//   node guide.js <root> <out.jpg> [<w>x<h>[@dpr]]
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3];
const m = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(process.argv[4] || '1280x900');
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    const dpr = +(m[3] || 1);
    await b.viewport(+m[1], +m[2], { scale: dpr, mobile: !!m[3] && dpr >= 3 });
    await b.go(site.url + '?debug', { settle: 800 });
    await b.eval(`document.getElementById('guide-open').click(); 'ok'`);
    await sleep(600);
    await b.eval(`(() => { const h = [...document.querySelectorAll('h3, h4, dt, .guide h3, li')].find(e => /Rivals who change/.test(e.textContent) && e.children.length < 3); (h || document.body).scrollIntoView({ block: 'start' }); return !!h; })()`);
    await sleep(400);
    await b.shot(out, 90);
  } finally { await b.close(); site.close(); }
})();
