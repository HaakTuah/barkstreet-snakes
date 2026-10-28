// Files of rounds, one JSON line each, { "r": round, ... }: the cache's
// played rounds ({ r, result }), and stored states ({ r, state } or, for a
// round over before then, { r, done }: its numbers) after a first line
// saying how they were stored. Written whole to a side file and renamed into
// place, so a reader never sees half of one. (.gz: gzipped.)
function readLines(file) {
  let data;
  try { data = fs.readFileSync(file); } catch { return []; }
  try { if (file.endsWith('.gz')) data = zlib.gunzipSync(data); } catch { return []; }
  return data.toString('utf8').split('\n').filter(Boolean);
}
function writeLines(file, lines) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const side = `${file}.${process.pid}.tmp`, data = lines.join('\n') + '\n';
  fs.writeFileSync(side, file.endsWith('.gz') ? zlib.gzipSync(data, { level: 6 }) : data);
  fs.renameSync(side, file);
}
// The cache keeps what's been used in the last fortnight (a file read is
// touched, so it counts as used).
const KEEP_MS = 14 * 24 * 3600 * 1000;
function tidy(dir) {
  try {
    for (const f of fs.readdirSync(dir)) {
      const file = path.join(dir, f);
      try { if (Date.now() - fs.statSync(file).mtimeMs > KEEP_MS) fs.unlinkSync(file); } catch {}
    }
  } catch {}
}
// Each round's line, by round (the last for a round wins; one cut short is
// left out, so it's played again). A line is read only as far as its round.
const ROUND = /^\{"r":(\d+),"(result|state|done)":/;
function linesByRound(lines) {
  const out = new Map();
  for (const line of lines) {
    const m = ROUND.exec(line);
    if (m && line.endsWith('}')) out.set(Number(m[1]), line);
  }
  return out;
}
const lineOf = (r, kind, value) => `{"r":${r},"${kind}":${JSON.stringify(value)}}`;
const parsed = line => JSON.parse(line)[ROUND.exec(line)[2]];
