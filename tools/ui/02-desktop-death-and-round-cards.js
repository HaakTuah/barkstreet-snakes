// Playing: a tag puts nothing over the log.
await mouse(await nameAt('Ouroboros'));
p = await P();
check(!(p.kind === 'note' && p.toast) && !p.note, 'playing: a click on a tag puts nothing over the log');

// Your death's card: a note there too, kept up to date; and a link to what got you, in the guide.
await die();
const death = await P();
check(/^Field guide: (Crashes|Hunger|Fire|Holes|Golden leaf)$/.test(death.how), 'your death’s card names what got you, in the Field guide', death.how);
await mouse(await nameAt('Gobbler'));
p = await P();
check(p.note.startsWith('Gobbler') && !p.text && !p.flavor, 'your death’s card: a rival’s note stands in for the card’s words', p.note.slice(0, 30));
await powers('Gobbler', 2, 0, false);
await b.sleep(400);
p = await P();
check(/Holding [12] golden jumps?\./.test(p.note) || p.note.includes('Out of this round.'), '...and keeps up with the round going on behind the card', p.note);
await mouse(await tagAt('You'));
p = await P();
check(p.note === 'You You’re out of this round.', 'your own tag, once you’re out: no powers to offer', p.note);
await key('Escape');
p = await P();
check(p.card && !p.note && p.title === death.title && p.text === death.text, 'Esc takes the note first, and the card’s words come back', p.text);
await mouse(await at('#how'));
p = await P();
const row = { 'Field guide: Crashes': 'basic-crash', 'Field guide: Hunger': 'basic-hunger', 'Field guide: Fire': 'fire', 'Field guide: Holes': 'hole', 'Field guide: Golden leaf': 'leaf' }[death.how];
check(p.book && p.tab === 'guide' && p.spot === row && p.spotIn && p.closeOn, 'its link opens the guide at that row, lit and in view, the book’s × on the screen', `${p.spot} / in view: ${p.spotIn} / ×: ${p.closeOn}`);
await key('Escape');
await key('Escape');
p = await P();
check(!p.card && !p.book, 'Esc closes the book; Esc again keeps watching, as before');

// Watching (no card): a banner, up at once and as long as it takes to
// read. Nothing cuts it short now: round news (a rival out, the
// woodpecker) waits its turn behind it (DESIGN "Teaching by showing";
// it used to take its place).
await ev(`(() => { const t = document.getElementById('toast'); window.__banner?.obs.disconnect(); const B = window.__banner = { shown: 0, gone: 0, by: '' }; B.obs = new MutationObserver(() => { const on = !t.hidden && t.dataset.kind === 'note' && t.textContent.startsWith('Ouroboros'); if (on && !B.shown) B.shown = performance.now(); if (!on && B.shown && !B.gone) { B.gone = performance.now(); B.by = t.hidden ? '' : t.dataset.kind + ': ' + t.textContent; } }); B.obs.observe(t, { attributes: true, childList: true, characterData: true, subtree: true }); return 1; })()`);
await mouse(await nameAt('Ouroboros'));
p = await P();
check(p.kind === 'note' && p.toast.startsWith('Ouroboros: Chases') && p.sr.startsWith('Ouroboros'), 'watching: a click on a tag shows its note as a banner, and a screen reader hears it', p.toast);
const want = Math.min(9000, Math.max(3500, 1000 + 55 * p.toast.length));
await wait(`__banner.gone || (SnakeDebug.state() !== 'running')`, 15000).catch(() => 0);
const { up, by } = await ev(`({ up: __banner.gone && __banner.shown ? Math.round(__banner.gone - __banner.shown) : 0, by: __banner.by })`);
check(up >= want - 50 && up <= want + 700, `...up as long as it takes to read (${p.toast.length} characters: ${want} ms, then its fade), nothing cutting it short`, `up ${up} ms${by ? `, then ${by}` : ''}`);
await mouse(await nameAt('Metagamer'));
await mouse(await nameAt('Metagamer'));
await b.sleep(300);
p = await P();
check(!(p.kind === 'note' && p.toast.startsWith('Metagamer')), '...and its tag again takes it away');

// The round's card. Your death ends this one (one rival): its card says
// how you died, so it names what got you too, as your death's card does
// (it had no link: a third of losing rounds end on your death).
await fresh(['ouroboros']);
await ev(`pilot.crash = true; 'ok'`);
await wait(`SnakeDebug.state() === 'over' && cardUp()`);
await b.sleep(1000);
const ended = await P();
const endRow = { 'Field guide: Crashes': 'basic-crash', 'Field guide: Hunger': 'basic-hunger', 'Field guide: Fire': 'fire', 'Field guide: Holes': 'hole', 'Field guide: Golden leaf': 'leaf' }[ended.how];
check(ended.title === 'Ouroboros wins' && /^You /.test(ended.text) && !!endRow, 'your death ended the round: its card says how, and names what got you, in the Field guide', `${ended.title} / ${ended.text} / ${ended.how}`);
await mouse(await at('#how'));
p = await P();
check(p.book && p.tab === 'guide' && p.spot === endRow && p.spotIn && p.closeOn, '...which opens the guide at that row, lit and in view', `${p.spot} / in view: ${p.spotIn}`);
await key('Escape');
p = await P();
check(!p.book && p.card && p.title === 'Ouroboros wins', '...and Esc brings the round’s card back');
await mouse(await nameAt('Ouroboros'));
p = await P();
check(p.note.startsWith('Ouroboros') && p.title === 'Ouroboros wins', 'the round’s card takes a note too', p.note.slice(0, 30));
await ev(`SnakeDebug.setup(); 'ok'`);
await b.sleep(300);
p = await P();
check(!p.note && !p.noted && p.title.startsWith('Ready'), 'a new card brings its own words');

// A death whose row is below the fold (Fire, near the guide's end): the
// link still opens the guide at it, lit and in view (focus on the book's
// Close without scrolling it back up). A crash's row is always in view.
// (Held at 3 segments while it burns: the pilot eats, and a snake that eats as fast as it burns lives on.)
const fire = `(() => { const g = SnakeDebug.game(), m = me(); m.burnFrom = g.tick; m.burnUntil = g.tick + 400; const hold = setInterval(() => { if (!m.alive || SnakeDebug.game() !== g) return clearInterval(hold); m.body.length = Math.min(m.body.length, 3); m.grow = 0; }, 5); return 1; })()`;
await fresh(['ouroboros', 'metagamer', 'gobbler']);
await ev(fire);
await wait(`cardUp() && !me().alive`);
await b.sleep(900);
p = await P();
check(p.how === 'Field guide: Fire', 'burned up: your death’s card says Field guide: Fire', p.how);
await mouse(await at('#how'));
p = await P();
check(p.book && p.spot === 'fire' && p.spotIn && p.pageTop > 0 && p.focus === 'records-close' && p.closeOn, '...which opens the guide at Fire, far down it, lit and in view under the book’s head, focus on its × and the × on the screen (it scrolled away with the page)', `${p.spot} / in view: ${p.spotIn} / scrolled ${p.pageTop} / ${p.focus} / ×: ${p.closeOn}`);
await mouse(await at('#records-close'));
p = await P();
check(!p.book, '...and a click on its × closes the book');
