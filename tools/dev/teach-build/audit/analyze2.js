// Before and after, from the play runs (out/<tree>-<screen>.json): how much
// of play has a banner up; each banner's hold against its reading time;
// lessons lost (asked for, never shown: dropped, or let go as stale) and
// banners cut short by another; time in the board's middle; on an upright
// phone, time over the board, your tag, the pause button.
//   node analyze2.js before after
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out');
const trees = process.argv.slice(2);
const readMs = t => Math.min(4500, 1000 + 400 * t.trim().split(/\s+/).length);
const med = a => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const pct = (a, b) => b ? `${(100 * a / b).toFixed(0)}%` : '-';
const rows = [];
for (const screen of ['p390', 'p360', 'd1920']) {
  for (const tree of trees) {
    const f = path.join(OUT, `${tree}-${screen}.json`);
    if (!fs.existsSync(f)) continue;
    const r = JSON.parse(fs.readFileSync(f, 'utf8'));
    const play = r.rounds.reduce((a, x) => a + x.time, 0);
    const eps = r.eps.filter(e => e.ms > 0);
    const up = eps.reduce((a, e) => a + e.ms, 0);
    // (each banner's hold: its time up, not going; Go! and the last one a card cut are left out)
    const lastOfRound = new Set(r.rounds.map((_, i) => eps.filter(e => e.round === i).pop()?.i));
    const holds = eps.filter(e => e.kind !== 'go' && e.kind !== 'note' && !lastOfRound.has(e.i)).map(e => ({ text: e.text, hold: e.ms - e.leaving, read: readMs(e.text) })); // (its time up, from when it came to when it started to go: the clock's, not the frames' sum)
    const ratio = holds.map(h => h.hold / h.read);
    // (cut short by another banner: it went with no fade, the next one up at once)
    let cut = 0, cutLessons = 0, backToBack = 0;
    for (let i = 0; i + 1 < eps.length; i++) if (eps[i].round === eps[i + 1].round && eps[i].leaving < 20 && eps[i + 1].start - eps[i].end < 60 && eps[i].kind !== 'go') { backToBack++; if (eps[i].ms - eps[i].leaving < 1500) { cut++; if (/lesson/.test(levelOf(r, eps[i].text))) cutLessons++; } }
    // (news and round news asked for and never shown)
    let newsLost = 0; const newsLostWhat = [];
    if (calls0(r).some(c => c.fate)) for (const c of calls0(r)) { if (c.level !== 'lesson' && (c.fate === 'stale' || c.fate === 'dropped')) { newsLost++; newsLostWhat.push(c.text); } }
    else for (const c of calls0(r).filter(c => c.level !== 'lesson' && !c.card && !c.skip)) if (!eps.find(e => e.text === c.text && e.start >= c.t - 50 && e.start <= c.t + 15000)) { newsLost++; newsLostWhat.push(c.text); }
    // (lessons asked for and never shown)
    const calls = r.calls || [];
    let lessons = 0, lost = 0, stale = 0, skipped = 0, byCard = 0, waited = [];
    const roundOf = t => { let best = 0, d = Infinity; for (const e of eps) { const x = Math.abs(e.start - t); if (x < d) { d = x; best = e.round; } } return best; };
    if (calls.some(c => c.fate)) { // (after: the banners' own log)
      const firsts = new Map();
      for (const c of calls.filter(c => c.level === 'lesson')) {
        if (c.fate === 'queued' || (c.fate === 'shown' && !firsts.has(c.text + '@q'))) { lessons++; firsts.set(c.text + '@' + c.t, c); }
        if (c.fate === 'queued') firsts.set(c.text + '@q', c);
        if (c.fate === 'shown' && firsts.has(c.text + '@q')) { waited.push(c.t - firsts.get(c.text + '@q').t); firsts.delete(c.text + '@q'); }
        if (c.fate === 'stale' || c.fate === 'dropped') { lost++; if (c.fate === 'stale') stale++; firsts.delete(c.text + '@q'); }
        if (c.fate === 'skipped') { skipped++; firsts.delete(c.text + '@q'); }
        if (c.fate === 'card') { byCard++; firsts.delete(c.text + '@q'); }
      }
    } else { // (before: the calls logged, matched with what showed)
      for (const c of calls.filter(c => c.level === 'lesson')) {
        if (c.skip) { skipped++; continue; }
        if (c.card) continue;
        lessons++;
        const shown = eps.find(e => e.text === c.text && e.start >= c.t - 50 && e.start <= c.t + 15000);
        if (shown) { if (shown.start - c.t > 30) waited.push(shown.start - c.t); continue; }
        const rr = roundOf(c.t);
        if (r.rounds[rr] && r.rounds[rr].time - c.gt < 6000) byCard++; else lost++;
      }
    }
    const mid = eps.reduce((a, e) => a + (e.slot?.mid || 0), 0), above = eps.reduce((a, e) => a + (e.slot?.above || 0), 0);
    const onBoard = eps.reduce((a, e) => a + (e.onBoard || 0), 0), onTag = eps.reduce((a, e) => a + (e.onTag || 0), 0), onPause = eps.reduce((a, e) => a + (e.onPause || 0), 0);
    rows.push({ screen, tree, play, banners: eps.length, up, upShare: up / play, holds: holds.length, medHold: med(holds.map(h => h.hold)), medRead: med(holds.map(h => h.read)), medRatio: med(ratio), atLeast: holds.filter(h => h.hold >= h.read - 50).length,
      cut, cutLessons, backToBack, newsLost, newsLostWhat, lessons, lost, stale, skipped, byCard, medWait: med(waited), mid, above, onBoard, onTag, onPause, fonts: [...new Set(eps.filter(e => e.slot?.above).map(e => e.fs))].sort() });
  }
}
function calls0(r) { return r.calls || []; }
function levelOf(r, text) { const c = (r.calls || []).find(c => c.text === text); return c ? c.level : ''; }
for (const x of rows) {
  console.log(`\n== ${x.tree} ${x.screen}: ${Math.round(x.play / 1000)} s of play, ${x.banners} banners (one every ${(x.play / 1000 / x.banners).toFixed(1)} s)`);
  console.log(`  a banner up ${pct(x.up, x.play)} of play`);
  console.log(`  hold (up, not going; Go! left out): median ${(x.medHold / 1000).toFixed(2)} s against a median reading time of ${(x.medRead / 1000).toFixed(2)} s (median ratio ${x.medRatio?.toFixed(2)}); ${x.atLeast} of ${x.holds} held their reading time or more (${pct(x.atLeast, x.holds)})`);
  console.log(`  the next straight after, no fade or breather: ${x.backToBack}; cut short by another within 1.5 s: ${x.cut} (${x.cutLessons} of them lessons)`);
  console.log(`  news and round news never shown: ${x.newsLost}${x.newsLost ? ' (' + x.newsLostWhat.join(' / ') + ')' : ''}`);
  console.log(`  lessons: ${x.lessons} asked for; ${x.lost} lost (never shown${x.stale ? `, ${x.stale} of them let go after waiting 6 s` : ''}); ${x.skipped} no longer true by their turn; ${x.byCard} gone with a card; median wait ${x.medWait == null ? '-' : (x.medWait / 1000).toFixed(1) + ' s'}`);
  console.log(`  in the board's middle ${(x.mid / 1000).toFixed(1)} s; above the board ${(x.above / 1000).toFixed(1)} s; over the board ${(x.onBoard / 1000).toFixed(1)} s, over your tag ${(x.onTag / 1000).toFixed(1)} s, over the pause button ${(x.onPause / 1000).toFixed(1)} s${x.fonts.length ? `; fonts above ${x.fonts.join(', ')} px` : ''}`);
}
fs.writeFileSync(path.join(OUT, 'analysis2.json'), JSON.stringify(rows, null, 1));
