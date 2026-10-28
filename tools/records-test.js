#!/usr/bin/env node
// Checks the Hall of Fame across friends: two players' records, sharing best
// rounds, playing a round together, sharing again. Nothing may appear twice.
// And a browser that won't keep anything still has its records until the tab
// closes, and says so.
//
//   node tools/records-test.js
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'records.js'), 'utf8');
// Just enough of a page to render into: elements are { className, textContent, children }.
const document = { createElement: tag => ({ tag, children: [], style: {}, append(...c) { this.children.push(...c); } }) };
const text = n => (n && typeof n === 'object' ? (n.textContent ?? '') + n.children.map(text).join('') : String(n));
const find = (n, cls) => (n && typeof n === 'object' ? [...(n.className === cls ? [n] : []), ...n.children.flatMap(c => find(c, cls))] : []);
// storage: a browser's localStorage (by default one that works).
function player(storage) {
  const store = new Map();
  const localStorage = storage || { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const ctx = vm.createContext({ window: {}, localStorage, document, console, Math, Date, Intl });
  vm.runInContext(src, ctx);
  return ctx.window.SnakeRecords;
}
const A = player(), B = player();
const ok = (cond, what) => { if (!cond) { console.error('FAIL:', what); process.exit(1); } console.log('ok  ', what); };

A.setName('Haakon');
A.recordPlayer({ place: 1, won: true, eaten: 30, survived: 90000 });
A.recordPlayer({ place: 3, eaten: 12, survived: 40000 });
B.recordPlayer({ place: 2, eaten: 20, survived: 70000 }); // B never set a name
ok(A.playerId() !== B.playerId(), 'different players get different ids');

// Connecting: each imports the other's best rounds.
B.importShared(A.shareable('Haakon'), '#4ade80');
A.importShared(B.shareable('Green'), '#fde047');
ok(B.scores().filter(e => e.friend).length === 2, "B has A's two rounds, as a friend's");
ok(A.scores().some(e => e.friend && e.name === 'Green'), "an unnamed friend's rounds go under the name they play as");
ok(B.scores().filter(e => !e.friend).length === 1, "B's own rounds are untouched");

// Sharing again (another friend joins, the host re-sends everything): nothing doubles.
B.importShared(A.shareable('Haakon'), '#4ade80');
A.importShared(B.shareable('Green'), '#fde047');
A.importShared(A.shareable('Haakon'), '#4ade80'); // your own rounds coming back
ok(B.scores().length === 3 && A.scores().length === 3, 'sharing twice adds nothing');

// A round together: each records themselves and the other.
const round = 'R1';
A.recordPlayer({ place: 1, won: true, eaten: 25, survived: 80000, round });
A.recordFriend({ place: 2, eaten: 18, survived: 60000 }, { name: 'Green', color: '#fde047', owner: B.playerId(), round });
B.recordPlayer({ place: 2, eaten: 18, survived: 60000, round });
B.recordFriend({ place: 1, won: true, eaten: 25, survived: 80000 }, { name: 'Haakon', color: '#4ade80', owner: A.playerId(), round });
ok(A.scores().filter(e => e.round === round).length === 2 && B.scores().filter(e => e.round === round).length === 2, 'the round together is in both Halls of Fame, both players');

// And then they share again: still one copy of each.
B.importShared(A.shareable('Haakon'), '#4ade80');
A.importShared(B.shareable('Green'), '#fde047');
ok(A.scores().filter(e => e.round === round).length === 2 && B.scores().filter(e => e.round === round).length === 2, 'sharing after playing together adds no copies');

// "Only you" and your best are yours alone.
ok(A.rankOf(A.scores().find(e => e.friend).id).personal === 0, "friends' rounds never count as your own");
ok(A.stats().played === 3 && B.stats().played === 2, 'stats count only your own rounds');

// Junk from outside is ignored.
const before = A.scores().length;
A.importShared([{ owner: 'x', place: 9, date: 1 }, { place: 1, date: 1 }, null, 'nope'], '#000');
ok(A.scores().length === before, 'malformed shared rounds are dropped');

// Hostile rows from a modified friend.
const C = player();
C.importShared([{ owner: 'evil1', place: 1, date: 1e300, eaten: 5 }], '#123456');
ok(C.scores().length === 0, 'a row with an impossible date is dropped');
C.importShared([{ owner: 'evil1', place: 1.5, date: Date.now(), eaten: 1e15, survived: -5, name: 'Bad\u202eguy', id: '<img>' }], 'red;position:fixed;inset:0');
const row = C.scores()[0];
ok(row && row.color === '#a8a29e', 'a colour that isn\'t a colour is replaced');
ok(row && row.place === 2 && row.eaten === 9999 && row.survived === 0, 'numbers are clamped to sense');
ok(row && !row.name.includes('\u202e') && row.id === 'img', 'names and ids are cleaned');
ok(C.recordFriend({ place: 1, eaten: 1, survived: 1 }, { name: 'Me?', color: '#4ade80', owner: C.playerId(), round: 'R1' }) === null, 'a friend can\'t record a round as yours');

// Names that are also built-in object keys, or replacement patterns.
C.recordPlayer({ place: 4, eaten: 0, survived: 1000, killer: 'constructor' });
C.recordPlayer({ place: 4, eaten: 0, survived: 1000, killer: 'toString' });
const st = C.stats();
ok(st.killers.constructor === 1 && st.killers.toString === 1, 'a killer called "constructor" is just a name');
ok(C.cleanName('😀'.repeat(20)).length === 32 && !/[\ud800-\udbff]$/.test(C.cleanName('a' + '😀'.repeat(20))), 'a long name is cut between characters, never inside an emoji');

// Corrupt stored stats.
const D = player();
D.recordPlayer({ place: 1, won: true, eaten: 3, survived: 1000 });
ok(D.stats().played === 1, 'stats start counting');
// Carving a name renames your rounds from before you had one, and only those.
const E = player();
E.recordPlayer({ place: 2, eaten: 9, survived: 30000 });
E.recordPlayer({ place: 3, eaten: 5, survived: 20000 });
E.importShared(A.shareable('Haakon'), '#4ade80');
const latest = E.recordPlayer({ place: 1, won: true, eaten: 14, survived: 50000 });
E.rename(latest, 'Perry');
ok(E.scores().filter(e => !e.friend).every(e => e.name === 'Perry'), 'carving a name renames your unnamed rounds');
ok(E.scores().filter(e => e.friend).every(e => e.name === 'Haakon'), "...and nobody else's");
E.recordPlayer({ place: 4, eaten: 1, survived: 9000 });
const again = E.recordPlayer({ place: 2, eaten: 8, survived: 40000 });
E.rename(again, 'P');
ok(E.scores().filter(e => !e.friend && e.name === 'Perry').length === 4, '...and a later carve leaves named rounds as they were');

// What got you, in the same words on the bar and as your nemesis; the woodpecker has its own.
const F = player();
F.recordPlayer({ place: 4, eaten: 2, survived: 9000, killer: 'woodpecker' });
F.recordPlayer({ place: 3, eaten: 4, survived: 19000, killer: 'woodpecker' });
F.recordPlayer({ place: 4, eaten: 1, survived: 5000, killer: 'wall' });
let page = document.createElement('div');
F.renderStats(page, {});
ok(text(find(page, 'nemesis')[0]) === 'Your nemesis: the woodpecker.' && find(page, 'bar-label').some(l => text(l) === 'Woodpecker'), 'a peck counts for the woodpecker, by name');
ok(find(page, 'bar-label').some(l => text(l) === 'Edge & holes'), '...and the edge is the edge');
F.recordPlayer({ place: 4, eaten: 1, survived: 5000, killer: 'wall' });
page = document.createElement('div');
F.renderStats(page, {});
ok(text(find(page, 'nemesis')[0]) === 'No nemesis yet: the woodpecker and the edge & holes are tied.', 'a tie says who in the same words');

// The tags after a name are read as words of their own.
page = document.createElement('div');
F.renderScores(page, F.scores()[0].id, 'all', '#4ade80');
const named = find(page, 'name')[0];
ok(text(named).endsWith(', this round') && find(named, 'sr-only').length === 1, 'a screen reader hears "Green, this round", not "Greenthis round"');

// Storage blocked: every access throws (some private modes, locked-down browsers).
const blocked = () => { throw new Error('SecurityError: The operation is insecure.'); };
const G = player({ getItem: blocked, setItem: blocked, removeItem: blocked });
page = document.createElement('div');
G.renderStats(page, {});
ok(find(page, 'records-note').length === 1 && text(find(page, 'empty')[0]).startsWith('You haven’t played yet'), "with storage blocked, Your story says it isn't kept, and that you haven't played");
G.recordPlayer({ place: 2, eaten: 7, survived: 50000, killer: 'Sniper' });
G.recordPlayer({ place: 1, won: true, eaten: 12, survived: 90000 });
G.setBest(12);
G.rename(G.scores()[0].id, 'Perry');
ok(G.stats().played === 2 && G.scores().length === 2 && G.getBest() === 12, '...but the rounds played still count until the tab closes');
ok(G.getName() === 'Perry' && G.scores().every(e => e.name === 'Perry'), '...and so does the name you carved');
page = document.createElement('div');
G.renderScores(page, null, 'all', '#4ade80');
ok(text(find(page, 'records-note')[0]) === 'This browser isn’t keeping records, so these last until you close the tab.' && find(page, 'scores-table').length === 1, 'the Hall of Fame shows them, and says why they won’t last');
page = document.createElement('div');
G.renderStats(page, {});
ok(find(page, 'records-note').length === 1 && !find(page, 'empty').length && text(page).includes('Your nemesis'), 'Your story too, and never says you haven’t played');
G.reset();
page = document.createElement('div');
G.renderStats(page, {});
ok(G.stats().played === 0 && text(find(page, 'empty')[0]).startsWith('A clean slate'), 'clearing everything clears it, and it’s a clean slate, not a log you never played on');

// Storage that fills up: what it already has stays, the rest is kept for the session.
const full = new Map();
let room = 3;
const H = player({ getItem: k => (full.has(k) ? full.get(k) : null), setItem: (k, v) => { if (!full.has(k) && --room < 0) throw new Error('QuotaExceededError'); full.set(k, String(v)); }, removeItem: k => full.delete(k) });
H.recordPlayer({ place: 3, eaten: 4, survived: 30000 });
H.recordPlayer({ place: 1, won: true, eaten: 9, survived: 60000 });
page = document.createElement('div');
H.renderScores(page, null, 'me', '#4ade80');
ok(H.stats().played === 2 && H.scores().length === 2 && find(page, 'records-note').length === 1, 'full storage: the rounds are still there, and the Hall of Fame says they won’t last');
const I = player();
page = document.createElement('div');
I.renderScores(page, null, 'all', '#4ade80');
I.renderStats(page, {});
ok(!find(page, 'records-note').length, 'storage that works says nothing about it');

// The line-up: the deck deals every rival once before any comes round again,
// in this browser and across reloads; chosen seats are kept, swap, and are skipped by the deck.
const POOL = Array.from({ length: 18 }, (_, i) => 'r' + i);
const L = player();
const seen = [];
for (let n = 0; n < 6; n++) seen.push(...L.deal(POOL, 3));
ok(new Set(seen).size === 18, 'six deals of three: all eighteen, none twice');
const next = [...L.deal(POOL, 3), ...L.deal(POOL, 3)];
ok(new Set(next).size === 6, 'then a fresh deck, without repeats inside it');
const M = player(), longRun = [];
for (let n = 0; n < 9; n++) longRun.push(...M.deal(POOL, 4));
ok(new Set(longRun.slice(0, 18)).size === 18 && new Set(longRun.slice(18)).size === 18, 'deals of four (watching) still go through the deck whole, twice');
ok(M.seats(POOL).every(k => k === null), 'no rival chosen: every seat is "Any"');
M.setSeat(POOL, 0, 'r5');
M.setSeat(POOL, 2, 'r9');
ok(M.seats(POOL).join() === 'r5,,r9', 'a chosen rival is remembered in its seat');
M.setSeat(POOL, 1, 'r5');
ok(M.seats(POOL).join() === ',r5,r9', 'one chosen for a seat it was already in elsewhere swaps');
M.setSeat(POOL, 2, null);
ok(M.seats(POOL).join() === ',r5,', '"Any" undoes a choice');
ok(M.seats(POOL.filter(k => k !== 'r5')).every(k => k === null), 'a rival that no longer exists comes back as "Any"');
const skip = ['r1', 'r2'], dealt = [];
for (let n = 0; n < 16; n++) dealt.push(...M.deal(POOL, 1, skip));
ok(!dealt.some(k => skip.includes(k)), 'the deck never deals a chosen rival to another seat');
const U = player(), first = U.deal(POOL, 3);
U.undeal(POOL, first);
ok(U.deal(POOL, 3).join() === first.join(), 'rivals dealt to a round nobody played go back on the top of the deck');
M.recordPlayer({ place: 2, eaten: 7, survived: 50000, chosen: true });
page = document.createElement('div');
M.renderScores(page, null, 'me', '#4ade80');
ok(M.scores()[0].chosen && text(page).includes('chosen') && M.shareable('Green')[0].chosen === true, 'a round with chosen rivals is marked "chosen", and shared that way');

console.log('all good');
