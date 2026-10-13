#!/usr/bin/env node
// Checks the Hall of Fame across friends: two players' records, sharing best
// rounds, playing a round together, sharing again. Nothing may appear twice.
//
//   node tools/records-test.js
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'records.js'), 'utf8');
function player() {
  const store = new Map();
  const localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const ctx = vm.createContext({ window: {}, localStorage, console, Math, Date, Intl });
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
console.log('all good');
