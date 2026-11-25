// The sync's reading in a release's trial on a real project (#1261; AGENTS.md, "A release is cut on the owner's word"):
// what pure-sync.mjs --trial printed of each project's sync, against the commit tried, counted in the trial's record
// (release-trial.mjs, beside this file) with the copy each run before the update started from. A reading: it holds no
// cut, since floor rule 8 proves a sync pure only against a release. Node's own modules only.
import fs from "node:fs";

// A copy, by the core's release at its pin, `main` for a commit of the core's main that is no release, `unknown` where
// neither could be read: the core's names alone, never a project's.
const FROM = /^(release-\d+|main|unknown)$/;
const LINE = "trial answer: ";

// What pure-sync.mjs --trial printed, `text`, read for the commit `sha`: its last line `trial answer: ` and its JSON, as
// { answer: { pure, from } }, or { why } it is none.
export function answerOf(text, sha) {
  const line = String(text).split("\n").map(l => l.trimEnd()).filter(l => l.startsWith(LINE)).at(-1);
  let a = null;
  try { a = JSON.parse(line.slice(LINE.length)); } catch { /* (none, or not read) */ }
  if (a === null || typeof a !== "object" || typeof a.pure !== "boolean" || !FROM.test(String(a.from))) return { why: `holds no line \`${LINE}\` as pure-sync.mjs --trial prints it` };
  if (a.commit !== sha) return { why: `answers for ${String(a.commit).slice(0, 7)}, not the commit tried, ${sha.slice(0, 7)}` };
  return { answer: { pure: a.pure, from: a.from } };
}

// The arguments of release.mjs --trial after the commit: the runs' files, and the file given with `--sync` after each
// pair, by the pair's index; `files` left odd, so the caller refuses them, where a `--sync` follows no pair, a pair holds
// two, or none is named.
export function syncsIn(args) {
  const files = [], syncs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== "--sync") { files.push(args[i]); continue; }
    const at = files.length / 2 - 1;
    if (!files.length || files.length % 2 || syncs[at] !== undefined || args[i + 1] === undefined) return { files: [args[0]], syncs: [] };
    syncs[at] = args[++i];
  }
  return { files, syncs };
}

// Each project's answer, from the files `syncs` names, one for each pair; or `why` the first is none: a pair with no
// --sync is refused, so no trial is recorded that never asked the reading.
export function answersOf(syncs, sha, pairs) {
  const answers = [];
  for (let n = 0; n < pairs; n++) {
    const f = syncs[n];
    if (f === undefined) return { why: `project ${n + 1}'s runs are given with no --sync after them: run \`node <a clone of the core at ${sha.slice(0, 7)}>/scripts/pure-sync.mjs --trial ${sha} > <a file outside every repository>\` in that project's clone with its sync's branch checked out, and give that file with --sync after its pair` };
    let text = null;
    try { text = fs.readFileSync(f, "utf8"); } catch { /* (not read) */ }
    const got = text === null ? { why: "cannot be read" } : answerOf(text, sha);
    if (!got.answer) return { why: `${f}, given with --sync for project ${n + 1}, ${got.why}: give the file pure-sync.mjs --trial ${sha} wrote, run from a clone of the core at that commit, in that project's clone with its sync's branch checked out` };
    answers.push(got.answer);
  }
  return { answers };
}

// The record's counts of the answers: the syncs pure and not, and the copies the runs before started from.
export function syncCounts(answers) {
  const copiesFrom = {};
  for (const { from } of answers) copiesFrom[from] = (copiesFrom[from] ?? 0) + 1;
  return { syncPure: answers.filter(a => a.pure).length, syncNotPure: answers.filter(a => !a.pure).length, copiesFrom };
}

// Whether a record's counts of the syncs are in their form: counts, one for each project, and the copies, data the
// record may leave out, adding up to them where it holds them, each named as FROM says.
export function syncFormed(r) {
  const counts = [r.syncPure, r.syncNotPure].every(n => Number.isInteger(n) && n >= 0) && r.syncPure + r.syncNotPure === r.projects;
  if (r.copiesFrom === undefined) return counts;
  const from = r.copiesFrom !== null && typeof r.copiesFrom === "object" && !Array.isArray(r.copiesFrom) ? Object.entries(r.copiesFrom) : null;
  return counts && from !== null && from.every(([k, n]) => FROM.test(k) && Number.isInteger(n) && n > 0) && from.reduce((sum, [, n]) => sum + n, 0) === r.syncPure + r.syncNotPure;
}

// What a record says of them.
export function syncSaid(r) {
  const from = Object.entries(r.copiesFrom ?? {}).map(([k, n]) => `${n} from ${k === "main" ? "a commit of the core's main that is no release" : k === "unknown" ? "a copy not read" : k}`);
  return `Against the commit tried, as pure-sync.mjs --trial reads it, holding no cut: ${r.syncPure} of the syncs pure, ${r.syncNotPure} not${from.length ? `; the runs before the update started from the copies their main held, ${from.join(", ")}` : ""}.`;
}
