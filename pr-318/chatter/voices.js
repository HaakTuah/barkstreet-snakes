// Snake chatter: the AI snakes talk. Speech bubbles follow the speaker's
// head, and the last few lines are kept in a log under the board. Purely
// cosmetic; it never affects how anyone plays.
//
// Once chatter.js, it is split into the files of chatter/. Like render/ (see
// render/core.js), they are plain scripts sharing the page's scope, loaded in
// order by index.html (sw.js lists them too), so every name at a file's top
// must be unique across the page's scripts (tools/scope-test.js checks).
//
//   voices.js       what every voice shares: the tables, addVoice, the moments
//   voices/<key>.js a voice's lines by moment, their Chinese (for Copycat, who
//                   repeats what it hears in Chinese) and its punchlines, one
//                   file per rival, in the order of SnakeAI's PERSONAS
//   impressions.js  Capricious's impressions of the others, and their Chinese
//   talk.js         who may speak and when, the words, the bubbles and the
//                   log, and the answers to a line (with their Chinese)
//   moments.js      what each moment of a round makes them say, and the API

// {who} is the other snake in the moment (victim, intruder, ...). The human
// is "you". Lines are picked at random.
// (Some moments, by key: under, the woodpecker pecked a hole under its body
// (a body bridges it); cut, a flash cut it ({who} flashed); doused,
// rain or snow put its fire out; ash and rot, food it was nearest burnt or
// rotted; desperate, starving soon, it drops its errands for food; flash,
// a plain flash that beat {who} to food (first) or shot past {who} (past);
// last, the last apples are falling; choke, its head met its own bead
// (it squashes it, since round six B; the lines are from when it spat
// them aside); dug, a beetle it cornered
// dug in and got away under the bark; knocked, food it was after, the
// woodpecker knocked aside, and {who} ate it. Star's own: zoom, any
// flash of its own; ready, its flash back from its rest; resting, small
// talk while it rests; stash, a golden beetle it ate (a golden leaf's
// flashes, it spends at once: a dash line). showoff: an answer to Star's
// showing off ({who} is Star). The land's: realm.capital, the woodpecker
// pecked Sovereign's capital and the realm moved; colony.lost, it pecked a
// colony's flag cell and the colony's gone. diesBy: last words for a death no
// snake caused, by what caused it, as moments.js's deathBy reads it.)
const VOICES = {};
// Every line in Chinese, keyed by the English, for Copycat; each voice's are in its file.
const ZH = {};
// Lines with a punchline are told once a round: a round runs two minutes and
// more, and a joke told three times in it isn't one. The rest only rest a while.
const PUNCHLINES = new Set();
// A voice's file adds its lines, their Chinese and its punchlines.
const addVoice = (key, lines, zh = {}, punchlines = []) => {
  VOICES[key] = lines;
  Object.assign(ZH, zh);
  for (const l of punchlines) PUNCHLINES.add(l);
};
