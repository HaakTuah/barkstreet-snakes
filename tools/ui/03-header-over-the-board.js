// ------------------------------------------ the header over the board
// Its rows (what's on each, left to right, grouped by where each sits;
// Score over Best beside the title count as one), whether each door
// shows its word, and whether the page scrolls sideways.
const headerRows = `(() => {
  const hd = document.querySelector('header'), stats = document.querySelector('.stats'), pair = getComputedStyle(stats).display !== 'contents' ? stats : null;
  const items = [['title', document.querySelector('h1')], ...[...hd.querySelectorAll('.hud .stat')].map((el, i) => [i ? 'Best' : 'Score', pair || el]), ...[...hd.querySelectorAll('.hud button')].filter(vis).map(el => [el.id, el])];
  let rows = [];
  for (const [n, el] of items) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el), top = r.top - parseFloat(cs.marginTop), bottom = r.bottom + parseFloat(cs.marginBottom);
    let row = rows.find(q => Math.min(bottom, q.bottom) - Math.max(top, q.top) > 2);
    if (!row) rows.push(row = { top, bottom, items: [] });
    row.top = Math.min(row.top, top); row.bottom = Math.max(row.bottom, bottom);
    row.items.push({ n, l: n === 'Best' && pair ? r.left + 0.5 : r.left });
  }
  for (let merged = true; merged;) {
    merged = false;
    for (const a of rows) for (const c of rows) if (a !== c && !merged && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 2) { a.items.push(...c.items); a.top = Math.min(a.top, c.top); a.bottom = Math.max(a.bottom, c.bottom); rows = rows.filter(q => q !== c); merged = true; }
  }
  rows.sort((a, c) => a.top - c.top);
  const named = id => vis(document.querySelector('#' + id + ' .trophy-text'));
  return { page: Math.round(document.querySelector('main').getBoundingClientRect().width * 100) / 100, height: Math.round(hd.getBoundingClientRect().height * 10) / 10, rows: rows.map(r => r.items.sort((a, c) => a.l - c.l).map(i => i.n).join(' ')),
    guide: named('guide-open'), trophy: named('records-open'), sideways: document.documentElement.scrollWidth > innerWidth,
    titleLines: (() => { const h1 = document.querySelector('h1'), cs = getComputedStyle(h1); return Math.round(h1.getBoundingClientRect().height / (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize))); })() };
})()`;
const grow = `(() => { document.getElementById('score').textContent = '1000'; document.getElementById('best').textContent = '1000'; return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res(1)))); })()`;
// In one row, Score over Best beside the title and the full-screen
// button last, each door named where the row has room for its word: an
// iPad mini held upright (a 720 px page) and half a 1080p screen's
// window (960x945, 694) name the Field guide, the trophy its picture (the
// guide was its book there with the full screen); a 1440p screen's
// browser (2560x1305, 900) names both; a 1000x860 window (a 600 px page:
// its board as big as before "One screen", the owner's call, the chatter
// giving way) has both pictures. A window 460 px wide, or 500 with
// touch (an iPad's Split View), has the title with Score and Best, then
// all the buttons on the next row, both named (the trophy went alone
// onto a third). And as
// Score and Best grow to 1000, nothing moves. (A 1080p screen's browser,
// 1920x945 and 1920x913, and 1920x1080 had the header over the board, its
// one row: they're beside it now, below.)
for (const [w, h, touch, label, oneRow, guide, trophy] of [
  [2560, 1305, false, '2560x1305, a 1440p screen\'s browser', true, true, true], [960, 945, false, 'half a 1080p screen, 960x945', true, true, false],
  [1000, 860, false, 'a 1000x860 window', true, false, false], [744, 1133, true, 'an iPad mini upright', true, true, false],
  [768, 1024, true, 'an iPad upright', true, true, false], [460, 900, false, 'a window 460 px wide', false, true, true], [500, 1000, true, 'a touch window 500 px wide', false, true, true]]) {
  await b.viewport(w, h, { scale: touch ? 2 : 1, mobile: touch });
  await load();
  const r = await ev(headerRows), want = oneRow ? 'title Score Best pause music mute guide-open records-open fullscreen' : 'title Score Best / pause music mute guide-open records-open fullscreen';
  check(r.rows.join(' / ') === want && r.guide === guide && r.trophy === trophy && r.height <= (oneRow ? 56 : 108) && !r.sideways,
    `${label}: ${oneRow ? 'the header in one row' : 'the title with Score and Best, then every button'}, the full-screen button last, the Field guide ${guide ? 'named' : 'its open book'}, the trophy ${trophy ? 'named' : 'its picture'}`, JSON.stringify(r));
  await ev(grow);
  const r1000 = await ev(headerRows);
  check(r1000.rows.join(' / ') === want && r1000.height === r.height && r1000.guide === guide, `${label}: with Score and Best at 1000, nothing moves`, JSON.stringify(r1000));
}

// ---------------------------- the header over the board, at its steps
// At each step's page, and a pixel under it (a tall window 24 px wider;
// under 417 px, a window 470 px wide and short, whose page narrows with
// the board, as tall as gives that page): one row from where it fits, each door named from where
// its word does, with six buttons and with five (no full screen: the
// steps were six's, and five showed both doors' pictures where their
// words fit), with a mouse and with touch; narrower, two rows, the title
// on one line and no button on a row of its own (under 384 px the
// full-screen button went onto a third, and under 352 the title took
// two lines). And at each step, with Score and Best at 100 and at 1000,
// nothing moves (they kept room for two digits: at 100 the row wrapped
// at each step's page, the board 45 px lower).
const STEPS = [ // [touch, five, one row from, the guide named from, both from; in two rows, both named from, the guide from]
  [false, false, 592, 649, 716, 384, 317], [false, true, 552, 609, 676, 340, 280],
  [true, false, 652, 699, 756, 404, 347], [true, true, 602, 649, 706, 354, 297]];
const digits = n => `(() => { document.getElementById('score').textContent = '${n}'; document.getElementById('best').textContent = '${n}'; return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res(1)))); })()`;
for (const [touch, five, one, guide, both, twoBoth, twoGuide] of STEPS) {
  const kind = `${touch ? 'touch' : 'a mouse'}, ${five ? 'five buttons' : 'six'}`, btns = `pause music mute guide-open records-open${five ? '' : ' fullscreen'}`;
  await b.viewport(1000, 1400, { scale: 1, mobile: touch });
  await load(five ? '&nofs' : '');
  const steps = [one, guide, both, twoBoth, twoGuide];
  for (const P of steps.flatMap(q => [q, q - 1]).filter(q => q >= 280)) {
    if (P >= 417) await b.viewport(P + 24, 1400, { scale: 1, mobile: touch });
    else { // (the window as tall as gives a page of P: the board leaves room above it for the header and the tags as they are, and under it for the row under the board and the chatter's two lines)
      let h = P + 330; // (the page is the window's height less what's above and under the board, which needn't be whole pixels: as tall as gives a page of P, or a fraction under it)
      for (let i = 0; i < 4; i++) {
        await b.viewport(470, h, { scale: 1, mobile: touch });
        await ev(`new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res(1))))`);
        const page = await ev(`document.querySelector('main').getBoundingClientRect().width`);
        if (page > P - 1 && page <= P + 0.01) break;
        h = Math.floor(P + h - page + 0.01);
      }
    }
    await ev(digits(0));
    const r = await ev(headerRows), oneRow = P >= one, g = oneRow ? P >= guide : P >= twoGuide, t = oneRow ? P >= both : P >= twoBoth;
    check(r.page > P - 1 && r.page <= P + 0.01 && r.rows.join(' / ') === (oneRow ? `title Score Best ${btns}` : `title Score Best / ${btns}`) && r.guide === g && r.trophy === t && r.titleLines === 1 && !r.sideways,
      `${kind}, a ${P} px page: ${oneRow ? 'one row' : 'the title with Score and Best, then the buttons'}, the Field guide ${g ? 'named' : 'its book'}, the trophy ${t ? 'named' : 'its picture'}`, JSON.stringify(r));
    if (!steps.includes(P)) continue;
    for (const n of [100, 1000]) {
      await ev(digits(n));
      const m = await ev(headerRows);
      check(m.rows.join(' / ') === r.rows.join(' / ') && m.height === r.height && m.guide === r.guide && m.trophy === r.trophy, `${kind}, a ${P} px page: with Score and Best at ${n}, nothing moves`, JSON.stringify(m));
    }
  }
}
