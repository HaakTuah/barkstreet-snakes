// The chatter suite's tables (tools/chatter-test.js runs the parts of tools/chatter/ in order): every
// line, its Chinese, the voices and their moments.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(require.main.path, '..');
const CHATTER = [...fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').matchAll(/<script src="(chatter\/[^"]+)"/g)].map(m => m[1]); // (index.html's order)
const src = CHATTER.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
// (REPLIES and the answers' Chinese are read from talk.js's source: from the
// opening bracket to the closing one, at the start of a line.)
const slice = (head, tail, name) => {
  const start = src.indexOf(head);
  const end = src.indexOf(tail, start);
  if (start < 0 || end < 0) throw new Error('no table ' + name);
  return new Function(`return ${src.slice(start + head.length - 1, end + '\n}'.length)}`)();
};
const table = name => slice(`\nconst ${name} = {`, '\n};\n', name);
const REPLIES = table('REPLIES'), ANSWERS_ZH = slice('\nObject.assign(ZH, {', '\n});\n', "the answers' Chinese");
// (The voices as their files give them, before Capricious's impressions: chatter/voices/, each run with addVoice caught.)
const added = [];
{
  const c = vm.createContext({ addVoice: (key, lines, zh = {}, punchlines = []) => added.push({ key, lines, zh, punchlines }) });
  for (const f of CHATTER.filter(f => f.startsWith('chatter/voices/'))) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), c, { filename: f });
}
const VOICES = Object.fromEntries(added.map(v => [v.key, v.lines]));
const ZH = Object.assign({}, ...added.map(v => v.zh), ANSWERS_ZH);
const PUNCHLINES = added.flatMap(v => v.punchlines);
// (The chatter's reach for whoever was after food the woodpecker knocked aside: cells from where it lay.)
const KNOCKED_NEAR = +/\bKNOCKED_NEAR = (\d+)/.exec(src)[1];
let fails = 0;
let oks = 0; // (every check, counted)
const ok = (cond, what) => { oks++; if (!cond) { console.error('FAIL:', what); fails++; } };

const lines = [];
const walk = (v, path) => {
  if (Array.isArray(v)) { ok(v.length > 0, `${path} has lines`); for (const l of v) lines.push([path, l]); }
  else for (const [k, w] of Object.entries(v)) walk(w, `${path}.${k}`);
};
for (const [who, voice] of Object.entries(VOICES)) walk(voice, who);
// (The answers to Mason are said, and repeated, like any other line.)
for (const [cue, r] of Object.entries(REPLIES)) {
  for (const l of r.lines) lines.push([`replies to "${cue}"`, l]);
  if (r.then) lines.push([`then, after "${cue}"`, r.then]);
}

const chinese = t => /[一-鿿]/.test(t);
for (const [path, line] of lines) {
  if (chinese(line)) continue; // (Copycat's own)
  ok(line in ZH, `${path}: "${line}" has its Chinese`);
  if (line in ZH) ok(line.includes('{who}') === ZH[line].includes('{who}'), `${path}: "${line}" names {who} in both`);
}
const said = new Set(lines.map(([, l]) => l));
// (Each line's Chinese is given once, in the file of the voice that says it, or beside the answers.)
const owners = new Map();
for (const [who, zh] of [...added.map(v => [v.key, v.zh]), ['the answers', ANSWERS_ZH]]) for (const l of Object.keys(zh)) owners.set(l, [...(owners.get(l) || []), who]);
for (const [l, who] of owners) ok(who.length === 1, `"${l}" has its Chinese once (${who.join(', ')})`);
const own = (v, l) => lines.some(([p, x]) => x === l && p.split('.')[0] === v.key);
for (const v of added) for (const l of Object.keys(v.zh)) ok(own(v, l), `${v.key}: the Chinese for "${l}" is for one of its own lines`);
for (const l of Object.keys(ANSWERS_ZH)) ok(lines.some(([p, x]) => x === l && !(p.split('.')[0] in VOICES)), `the answers' Chinese for "${l}" is an answer's`);
for (const v of added) for (const l of v.punchlines) ok(own(v, l), `${v.key}: punchline "${l}" is its own line`);
const orphans = Object.keys(ZH).filter(l => !said.has(l));
for (const l of orphans) ok(false, `the Chinese for "${l}" has no English line (it was removed or reworded)`);
const spoken = new Set(Object.values(VOICES).flatMap(function all(v) { return Array.isArray(v) ? v : Object.values(v).flatMap(all); }));
for (const l of PUNCHLINES) ok(spoken.has(l), `punchline "${l}" is a line someone says`);

// Every voice has the moments anyone can have; the woodpecker cuts nothing
// now, so no voice blames the bird for its tail.
const EVERYONE = ['under', 'doused', 'ash', 'rot', 'desperate', 'cut', 'choke', 'dug', 'knocked'];
for (const [who, voice] of Object.entries(VOICES)) {
  for (const k of EVERYONE) ok(voice[k]?.length, `${who} has '${k}' lines`);
  ok(!voice.snipped, `${who}: 'snipped' is gone (a dash's cut is 'cut' now)`);
  ok(!(voice.cut || []).some(l => /bird|woodpecker/i.test(l)), `${who}: no 'cut' line blames the woodpecker`);
  for (const k of Object.keys(voice.flash || {})) ok(k === 'first' || k === 'past', `${who}: flash.${k} is first or past`);
}
// Last words know what killed them, whatever it was (diesBy, by the cause the engine records), and name no snake.
for (const [who, voice] of Object.entries(VOICES)) {
  for (const k of ['edge', 'hole', 'woodpecker', 'hunger', 'fire', 'self']) ok(voice.diesBy?.[k]?.length, `${who} has last words for dying by '${k}'`);
  ok(Object.values(voice.diesBy || {}).flat().every(l => !l.includes('{who}')), `${who}: its 'diesBy' lines name no snake`);
}
// Mason's punchline is his kill line, and the proper version never spoils it.
ok(VOICES.mason.kill.includes('Vidi, vici, veni.') && !VOICES.mason.idle.includes('Vidi, vici, veni.'), 'Mason crows "Vidi, vici, veni." at a kill');
ok(!lines.some(([, l]) => l === 'Veni, vidi, vici.'), '"Veni, vidi, vici." is nobody\'s line');
ok(VOICES.sovereign.realm?.rotten?.length, 'Sovereign minds rot in its realm');
ok(VOICES.colonist.colony?.rotten?.length, 'Colonist minds rot in its colonies');
ok(VOICES.sovereign.realm?.capital?.length, 'Sovereign has lines for a capital the woodpecker took');
ok(VOICES.colonist.colony?.lost?.length, 'Colonist has lines for a colony the woodpecker took');
// (A beetle that got away names nobody; food the woodpecker knocked to someone else names who ate it.)
for (const [who, voice] of Object.entries(VOICES)) {
  ok((voice.dug || []).every(l => !l.includes('{who}')), `${who}: its 'dug' lines name nobody`);
  ok((voice.knocked || []).every(l => l.includes('{who}')), `${who}: its 'knocked' lines name who ate it`);
}
// The woodpecker's fair play (it knocks food aside by a rule, never shuts
// anyone in) is the lesson's to say: no rival announces it.
for (const [path, line] of lines) ok(!/shut (you|me|us|anyone) in|never shuts|plays fair/i.test(line), `${path}: "${line}" leaves the woodpecker's fair play to the lesson`);
// Star, the newest, has lines for every moment anyone has lines for (but the
// ones that are someone's own: Vulture's deaths, the land, Capricious's
// moods, Gobbler's and Desperado's spawns and first strike, the answers to
// Star), and its own: its flashes, its flash back, its grumbling while it
// rests and its stash of golden things. Some rivals answer it.
const OWN = ['death', 'intruder', 'flag', 'realm', 'colony', 'mood', 'spawn', 'beetle', 'weather.strike', 'showoff'];
const momentsOf = (v, at = '', out = new Set()) => { if (Array.isArray(v)) out.add(at); else for (const [k, w] of Object.entries(v)) momentsOf(w, at ? `${at}.${k}` : k, out); return out; };
const anyones = new Set(Object.entries(VOICES).filter(([who]) => who !== 'star').flatMap(([, v]) => [...momentsOf(v)]));
const starHas = momentsOf(VOICES.star);
const covered = [...anyones].filter(m => !OWN.some(o => m === o || m.startsWith(o + '.')));
for (const m of covered) ok(starHas.has(m), `Star has '${m}' lines`);
for (const k of ['zoom', 'ready', 'resting', 'stash']) ok(VOICES.star[k]?.length, `Star has its own '${k}' lines`);
for (const k of ['wildcard', 'mason']) ok(VOICES[k].showoff?.length, `${k} answers Star's showing off`);
// No formula: too many lines of one voice may not share one shape, so a filled-in template
// ("Sunshine! I love sunshine! Today.", "Rain! I love rain! For now.", …) can't creep back (the
// slop bar, docs/slop-bar.md). A line's shapes: its opening two words with its last mark, and,
// with more than one sentence, its marks in order with the second sentence's opening two words.
// Mason's "Et tu, …?" is the owner's gag, kept word for word, so its shape may repeat.
const SHAPE_MAX = 4, SHAPE_KEPT = { mason: ['open:et tu|?'] };
const sentencesOf = l => l.trim().match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [l];
const wordsOf = s => s.toLowerCase().replace(/\{who\}/g, 'who').match(/[\p{L}’']+/gu) || [];
const shapesOf = l => {
  const ss = sentencesOf(l), marks = ss.map(s => (s.trim().match(/[.!?…]$/) || [''])[0]).join('');
  const out = [`open:${wordsOf(ss[0]).slice(0, 2).join(' ')}|${marks.slice(-1)}`];
  if (ss.length > 1) out.push(`inner:${marks}|${wordsOf(ss[1]).slice(0, 2).join(' ')}`);
  return out;
};
const formulas = (said, kept = []) => {
  const by = {};
  for (const l of new Set(said)) if (!chinese(l)) for (const s of shapesOf(l)) (by[s] = by[s] || []).push(l);
  return Object.entries(by).filter(([s, ls]) => ls.length > SHAPE_MAX && !kept.includes(s));
};
ok(formulas(['Sunshine! I love sunshine! Today.', 'Rain! I love rain! For now.', 'Snow! I love snow! For a bit.', 'A bird! I love birds! Not this one.', 'A hole! I love holes! Not under me.']).length === 1,
  'the shape guard catches a filled-in template (Capricious\'s old weather lines)');
for (const v of added) for (const [s, ls] of formulas(lines.filter(([p]) => p.split('.')[0] === v.key).map(([, l]) => l), SHAPE_KEPT[v.key]))
  ok(false, `${v.key}: ${ls.length} lines share one shape (${s}), more than ${SHAPE_MAX}: ${ls.join(' / ')}`);
if (fails) { console.error(`${fails} failed`); process.exit(1); }
console.log(`ok   ${lines.length} lines, every one in Chinese too`);
console.log(`ok   ${Object.keys(ZH).length} Chinese lines, none left over`);
console.log(`ok   ${PUNCHLINES.length} punchlines, each told once a round`);
console.log(`ok   no voice repeats one shape more than ${SHAPE_MAX} times`);
console.log(`ok   every voice: ${EVERYONE.join(', ')}`);
console.log(`ok   Star: all ${covered.length} moments anyone has (${[...starHas].length} with its own), in Chinese too; Wildcard and Mason answer it`);
