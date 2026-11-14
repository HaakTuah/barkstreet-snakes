// Puts images side by side (scaled to one height), each with a caption
// above it, on the page's dark ground, through headless Chrome's canvas.
//   node montage.js <out.jpg> <height> <caption>=<image> [<caption>=<image> ...]
const fs = require('fs'), path = require('path');
const { launch } = require(path.join(__dirname, '..', 'browser.js'));
(async () => {
  const [out, height, ...pairs] = process.argv.slice(2);
  const items = pairs.map(p => { const i = p.indexOf('='); const file = p.slice(i + 1); return { cap: p.slice(0, i), src: 'data:' + (/\.png$/i.test(file) ? 'image/png' : 'image/jpeg') + ';base64,' + fs.readFileSync(file).toString('base64') }; });
  const b = await launch();
  try {
    await b.go('about:blank');
    const url = await b.eval(`(async () => {
      const items = ${JSON.stringify(items)}, H = ${+height}, gap = 24, top = 44, pad = 20;
      const imgs = await Promise.all(items.map(it => new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = bad; im.src = it.src; })));
      const ws = imgs.map(im => Math.round(im.width * H / im.height));
      const c = document.createElement('canvas');
      c.width = ws.reduce((a, w) => a + w, 0) + gap * (imgs.length - 1) + pad * 2; c.height = H + top + pad;
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
      g.fillStyle = '#131d15'; g.fillRect(0, 0, c.width, c.height);
      g.font = '600 24px Segoe UI, system-ui, sans-serif'; g.fillStyle = '#f6ecd2'; g.textBaseline = 'middle';
      let x = pad;
      imgs.forEach((im, i) => { g.fillText(items[i].cap, x, top / 2 + 2); g.drawImage(im, x, top, ws[i], H); x += ws[i] + gap; });
      return c.toDataURL('image/jpeg', 0.88);
    })()`);
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', out);
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
