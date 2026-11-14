// Crops an image (and optionally scales it) through headless Chrome's canvas.
//   node crop.js <in> <out.jpg|.png> <x> <y> <w> <h> [scale] [quality]
const fs = require('fs'), path = require('path');
const { launch } = require(path.join(__dirname, '..', 'browser.js'));
(async () => {
  const [inp, out, x, y, w, h, scale = '1', quality = '0.9'] = process.argv.slice(2);
  const type = /\.png$/i.test(out) ? 'image/png' : 'image/jpeg';
  const data = 'data:' + (/\.png$/i.test(inp) ? 'image/png' : 'image/jpeg') + ';base64,' + fs.readFileSync(inp).toString('base64');
  const b = await launch();
  try {
    await b.go('about:blank');
    const url = await b.eval(`new Promise((ok, bad) => {
      const img = new Image();
      img.onload = () => {
        const s = ${+scale}, c = document.createElement('canvas');
        c.width = Math.round(${+w} * s); c.height = Math.round(${+h} * s);
        const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
        g.drawImage(img, ${+x}, ${+y}, ${+w}, ${+h}, 0, 0, c.width, c.height);
        ok(c.toDataURL('${type}', ${+quality}));
      };
      img.onerror = bad; img.src = ${JSON.stringify(data)};
    })`);
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', out);
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
