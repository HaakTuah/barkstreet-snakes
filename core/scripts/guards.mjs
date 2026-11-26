// What every check of the core does with what a project's own files, or a pull request, shape before it uses it
// (floor rule 5, in floor/topics/input.md): a path a config or manifest names is read only inside the project, a file
// is read only where its real place, its links followed, lies inside the project, and a name or line from the project
// is printed to a workflow's log as one line of plain text, never as a command GitHub Actions acts on. Node's own
// modules only.
//
//   import { inProject, leadsOut, logged } from "./guards.mjs";
import fs from "node:fs";
import path from "node:path";

/** Whether `p`, a path a project's file names, stays inside the project: a non-empty string with no control character,
 *  not rooted (no leading "/" or "\", no drive), and no ".." part that leads above where it starts. "./x" and "a/../b"
 *  stay inside. */
export function inProject(p) {
  if (typeof p !== "string" || p === "" || /[\u0000-\u001f\u007f]/u.test(p)) return false;
  const s = p.replace(/\\/gu, "/");
  if (s.startsWith("/") || /^[A-Za-z]:/u.test(s)) return false;
  const n = path.posix.normalize(s);
  return n !== ".." && !n.startsWith("../");
}

/** Whether the file or folder at `at`, every link on its way followed, lies outside the folder `root` (its own real
 *  place): where `at` does not stand yet, the nearest folder above it that does is read, so a file about to be written
 *  under a linked folder leads out too; a link that leads nowhere counts as leading out. */
export function leadsOut(root, at) {
  let top;
  try { top = fs.realpathSync(root); } catch { return true; }
  for (let p = path.resolve(at); ;) {
    let real;
    try { real = fs.realpathSync(p); } catch {
      let found;
      try { found = fs.lstatSync(p, { throwIfNoEntry: false }); } catch { found = undefined; }
      if (found?.isSymbolicLink()) return true;
      const up = path.dirname(p);
      if (up === p) return true;
      p = up;
      continue;
    }
    const rel = path.relative(top, real);
    return rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel);
  }
}

/** Text with every control character and line separator shown as "?": on one line, and, where it changes nothing,
 *  text that held none. */
export const oneLine = text => String(text).replace(/[\u0000-\u001f\u007f\u0085\u2028\u2029]/gu, "?");

/** Text for a line of a step's log, read there as text alone (#1348): on one line (oneLine), each "::" and "##[" a
 *  workflow command opens broken as ": :" and "# #[", also with only characters beyond ASCII between their marks. */
export const asText = text => oneLine(text).replace(/:(?=[^\u0000-\u007f]*:)/gu, ": ").replace(/#(?=[^\u0000-\u007f]*#[^\u0000-\u007f]*\[)/gu, "# ");

/** Text with the user and password of every address in it cut out, up to the last "@" before the address's path
 *  ("git+https://user:pass@host/x" as "git+https://host/x"), so a sign-in a project's file holds in an address is not
 *  printed (floor rule 1). Read as the URL standard reads an address's authority: after one of its special schemes
 *  (http, https, ws, wss, ftp; file) and any slashes, either way, none among them ("https:u@host", "https:\\u@host";
 *  file's one or more, since a file's address with none is a path, "file:../@scope/x"), up to a slash, a backslash but
 *  before a quote, "?" or "#"; after any other scheme and "//", up to a slash, "?" or "#", a backslash included; a tab or
 *  a line's break in the scheme or among the slashes dropped, as the standard drops it. So a sign-in may hold a quote (as JSON writes it
 *  too, '\\"'). In a line of text (noSignIn) it ends at a space, a tab or a line's break too, so the words after an
 *  address, a failure's mend among them, are never cut with it; a value printed on its own (noSignInWhole, quotedAlone,
 *  loggedAlone) is cut whole, its spaces and breaks included, and a value that runs from an address to a later "@"
 *  loses what lies between: only more is cut.
 *  Kept as they are: a user that is "git" alone, which signs in with nothing, and an image's digest, "sha256:" and
 *  32 hex digits or more, a letter among them, with no path after them ("docker://x@sha256:…"), never a host of that
 *  name and a port.
 *  Not cut: an address of another scheme with no "//" after it, which holds no sign-in ("npm:name@1", npm's alias, and
 *  a drive's path, "C:\\me@x", "C:/me@x"; "C://me@x" reads as one and loses "me@"); a sign-in holding what ends it
 *  ('https:\\"u:p@h' among them, read as no address); and, in a line
 *  of text, a sign-in holding a space, a tab or a line's break.
 *  A scheme is read back from each ":" to where its letters start, its slashes forward, and each authority's end and
 *  last "@" are found once, however many addresses start inside it: a long text is read in a few passes, by hand where
 *  a pattern would run deep. */
const SPECIAL = new Set(["http", "https", "ws", "wss", "ftp", "file"]);
const letter = c => (c >= 97 && c <= 122) || (c >= 65 && c <= 90);
const ofScheme = c => letter(c) || (c >= 48 && c <= 57) || c === 43 || c === 45 || c === 46; // (a letter, digit, "+", "-" or ".")
const dropped = c => c === 9 || c === 10 || c === 13; // (a tab or a line's break, which the URL standard drops)
// (where the `count`th letter back from `colon` stands, breaks not counted, and where the part it stands in starts: after
// the nearest tab or line's break before it, or at `start`)
function partOf(text, start, colon, count) {
  let at = colon;
  for (; count > 0; at--) if (!dropped(text.charCodeAt(at - 1))) count--;
  let from = at;
  while (from > start && !dropped(text.charCodeAt(from - 1))) from--;
  return { at, from };
}
// (the schemes that end at the ":" at `colon`, tabs and line breaks in it dropped, as the URL standard drops them: a
// special one where its letters start their part of the run (the run, or the text after a break in it, since a word
// before a break is no part of an address in a line of text) or follow only signs that are no letter there ("1https",
// "-https", never "git+https" or "-ab-https"); and beside it one that is not special, read from the run's first letter,
// past any sign before it ("-ab-https" as "ab-https"), or from where a letter follows a break in it ("git+\nhttps",
// "h\nttps"), as the URL standard reads it from the word's start or a line's: "" where none is. Each name is the end of
// the run, so at most one is special, since no special scheme's name ends another's ("ws" is no ending of "wss"): one
// added to SPECIAL, and to specialIn's pattern, is checked for that first. Of the run whole, its first
// part after a break and its last, one is not wherever two of them are read; every scheme not special cuts the same)
function schemeBefore(text, colon) {
  let start = colon, first = -1, last = -1;
  for (let c; start > 0 && (ofScheme(c = text.charCodeAt(start - 1)) || dropped(c)); start--) {
    if (dropped(c) && letter(text.charCodeAt(start))) { first = start; if (last < 0) last = start; }
  }
  while (start < colon && dropped(text.charCodeAt(start))) start++;
  const named = from => text.slice(from, colon).replace(/[\t\n\r]/gu, "").toLowerCase();
  const special = specialIn(text, start, colon, named(start));
  let lead = start;
  while (lead < colon && !letter(text.charCodeAt(lead))) lead++;
  const other = [lead < colon ? lead : -1, first, last].filter(at => at >= 0).map(named)
    .find(name => name !== special) ?? "";
  return special && other ? [special, other] : [special || other];
}
// (the special scheme the run from `start` to `colon`, read as `name`, ends in, where no letter stands before its
// letters in their part of the run, only signs or nothing: "" where none does)
function specialIn(text, start, colon, name) {
  const special = /(https?|wss?|ftp|file)$/u.exec(name)?.[1] ?? "";
  if (!special) return "";
  const { at, from } = partOf(text, start, colon, special.length);
  return /[a-z]/iu.test(text.slice(from, at)) ? "" : special;
}
// (where the slashes after the ":" at `colon` end, and how many they are: a backslash counted for a special scheme alone,
// and never one before a quote)
function slashesAfter(text, colon, special) {
  let from = colon + 1, slashes = 0;
  for (; ; from++) {
    const c = text.charCodeAt(from);
    if (c === 47 || (special && c === 92 && text.charCodeAt(from + 1) !== 34)) slashes++;
    else if (!dropped(c)) return { from, slashes };
  }
}
// (the address a scheme `name` that ends at the ":" at `colon` starts: its kind and where its authority starts, or null)
function addressAt(text, colon, name) {
  const kind = SPECIAL.has(name) ? "special" : "other";
  if (!name) return null;
  const { from, slashes } = slashesAfter(text, colon, kind === "special");
  return slashes >= (kind === "other" ? 2 : name === "file" ? 1 : 0) ? { kind, from } : null;
}
const DIGEST = /sha\d+:(?=\d*[a-f])[a-f\d]{32,}(?![a-f\d/\\?#])/iuy; // (a hex letter in it, so no port of digits alone)
// (the last "@" in text from `floor` to `end` that is no image's digest's, or -1)
const lastSignInAt = (text, floor, end) => {
  for (let at = end - 1; at >= floor; at--) {
    if (text.charCodeAt(at) !== 64) continue;
    DIGEST.lastIndex = at + 1;
    if (!DIGEST.test(text)) return at;
  }
  return -1;
};
// (the "@" that ends the sign-in of an address of one kind whose authority starts at `from`, or -1: an authority not
// read yet is read once, where it ends and its last "@", and kept in `authority` for every address that starts in it)
function signInAt(text, { from }, authority, end) {
  if (from > authority.end) {
    end.lastIndex = from;
    authority.end = end.exec(text)?.index ?? text.length;
    authority.at = lastSignInAt(text, from, authority.end);
  }
  return authority.at < from ? -1 : authority.at;
}
// (a cut ending at `stops` too, `mark` written where each sign-in stood)
const cutBy = (stops, mark = "") => text => {
  text = String(text);
  const ends = { special: new RegExp(String.raw`[/?#${stops}]|\\(?!")`, "gu"), other: new RegExp(`[/?#${stops}]`, "gu") };
  const seen = { special: { end: -1, at: -1 }, other: { end: -1, at: -1 } };
  let out = "", copied = 0;
  for (let colon = text.indexOf(":"); colon !== -1; colon = text.indexOf(":", colon + 1)) {
    let cut = null; // (of the readings of the scheme, the one whose sign-in reaches furthest)
    for (const name of schemeBefore(text, colon)) {
      const address = addressAt(text, colon, name);
      const at = address ? signInAt(text, address, seen[address.kind], ends[address.kind]) : -1;
      if (at >= 0 && (!cut || at > cut.at)) cut = { from: address.from, at };
    }
    if (!cut) continue;
    if (text.slice(cut.from, cut.at) !== "git") { out += text.slice(copied, cut.from) + mark; copied = cut.at + 1; }
    colon = cut.at;
  }
  return out + text.slice(copied);
};
export const noSignIn = cutBy(String.raw`\s`);
export const noSignInWhole = cutBy("");

/** A value written as JSON with each of its texts and keys cut by noSignInWhole before it is quoted, so a sign-in JSON
 *  would write with an escape ("\\t", "\\n") is cut all the same: undefined where JSON writes nothing. */
export const quotedAlone = value => JSON.stringify(value, (key, part) => {
  if (typeof part === "string") return noSignInWhole(part);
  if (part === null || typeof part !== "object" || Array.isArray(part)) return part;
  return Object.fromEntries(Object.entries(part).map(([name, inner]) => [noSignInWhole(name), inner]));
});

/** Text from a project, made safe to print on one line of a workflow's log: any address's sign-in cut out (noSignIn),
 *  "%", a carriage return and a line feed escaped as GitHub documents a command's data is (%25, %0D, %0A), and any other
 *  control character or line separator shown as "?", and a command's marks broken (asText). */
export const logged = text => asText(noSignIn(text).replace(/%/gu, "%25").replace(/\r/gu, "%0D").replace(/\n/gu, "%0A"));
/** A value printed to the log on its own (a failure's message, a name), its sign-in cut whole (noSignInWhole), then as
 *  logged. A sign-in may hold a mend's marker (". Mend: "), as a password may, and the URL standard reads one from an
 *  address to a later "@" all the same where the words between are a message's mend ("https://example.invalid. Mend:
 *  install @scope/x"), so neither can be told from the other and both are cut. Where the cut took the mend so, "[cut]"
 *  stands where it cut and a mend of its own stands in for the one taken, saying what to do, then what was cut. */
const MEND = ". Mend: ", CUT = "[cut]", mends = text => text.split(MEND).length, marked = cutBy("", CUT);
const CUT_SAID = `the words from an address to a later "@" may hold a sign-in, so they were cut where "${CUT}" stands, \
the message's own mend with them`;
// (the value cut whole, with "[cut]" where it cut wherever the cut took a mend, and whether it did)
const cutAlone = value => {
  const text = String(value), cut = noSignInWhole(text);
  return mends(cut) === mends(text) ? { cut, took: false } : { cut: marked(text), took: true };
};
export const loggedAlone = value => {
  const { cut, took } = cutAlone(value);
  return logged(took ? `${cut}${MEND}take any user or password out of each address cut at "${CUT}" where the \
project's files write it with one, and run the check again; where they write none, read this message's own mend in the \
check's script, found by its words before the address: ${CUT_SAID}` : cut);
};
/** A message printed inside a failure's line of the caller's, as its cause ("<what failed> (<the cause>). Mend: <the
 *  caller's mend>"): cut as loggedAlone cuts it, saying in words, never in a mend, where the cut took the message's own
 *  mend, and each "Mend: " in it written "mend: ", so the line holds one mend, the caller's. */
export const loggedCause = value => {
  const { cut, took } = cutAlone(value);
  return logged(`${cut}${took ? `; ${CUT_SAID}` : ""}`.replace(/Mend: /gu, "mend: "));
};

/** How deep a value read from a project's JSON may nest, in objects and lists, before a check refuses it: far past any
 *  config, manifest or lock file, and short of where reading it, or printing it, would run out of stack. */
export const DEEPEST = 200;

/** Whether a value read from JSON nests deeper than `limit` objects and lists, counted without recursion. */
export function tooDeep(value, limit = DEEPEST) {
  const stack = [[value, 0]];
  while (stack.length) {
    const [v, d] = stack.pop();
    if (!v || typeof v !== "object") continue;
    if (d >= limit) return true;
    for (const x of Object.values(v)) stack.push([x, d + 1]);
  }
  return false;
}

/** A message that may name the project's place on this machine (an error of Node's or git's), with that place written
 *  as "." in every spelling it may take there (as given, made real, with either slash), so the path is the project's. */
export function unrooted(text, root) {
  let real = root;
  try { real = fs.realpathSync(root); } catch { /* (as given) */ }
  const forms = new Set([root, real].filter(Boolean).flatMap(r => [r, r.replace(/\\/gu, "/"), r.replace(/\//gu, "\\")]));
  let out = String(text);
  for (const form of [...forms].sort((a, b) => b.length - a.length)) out = out.split(form).join(".");
  return out;
}

/** Whether `name` names a repository as GitHub writes one, "<owner>/<name>": letters, digits, "_", "." and "-" alone,
 *  and neither part dots alone, so a route built from it reaches that repository's routes and no other. */
export const aRepository = name => typeof name === "string" && /^[\w.-]+\/[\w.-]+$/u.test(name) && name.split("/").every(part => !/^\.+$/u.test(part));

/** Whether `sha` is a commit's whole name as GitHub gives it: forty hexadecimal digits, in lower case. */
export const aCommit = sha => typeof sha === "string" && /^[0-9a-f]{40}$/u.test(sha);

/** The text of a comment or description in Markdown as a reader of it on GitHub sees it: what an HTML comment holds,
 *  and every block of code fenced by ``` or ~~~, left out (each to the end, where it is never closed), and the lines
 *  kept where they stood, so a line hidden from the reader is never read as one said. */
export function seen(markdown) {
  const out = [];
  let fence = null, hidden = false;
  for (const line of String(markdown ?? "").replaceAll("\r\n", "\n").split("\n")) {
    if (fence) {
      if (new RegExp(`^ {0,3}${fence[0] === "`" ? "`" : "~"}{${fence.length},}[ \\t]*$`, "u").test(line)) fence = null;
      out.push("");
      continue;
    }
    const opens = hidden ? null : /^ {0,3}(`{3,}|~{3,})/u.exec(line);
    if (opens && !(opens[1][0] === "`" && line.slice(opens[0].length).includes("`"))) { fence = opens[1]; out.push(""); continue; }
    let rest = line, kept = "";
    while (rest) {
      if (hidden) { const end = rest.indexOf("-->"); if (end < 0) break; rest = rest.slice(end + 3); hidden = false; }
      else { const start = rest.indexOf("<!--"); if (start < 0) { kept += rest; break; } kept += rest.slice(0, start); rest = rest.slice(start + 4); hidden = true; }
    }
    out.push(kept);
  }
  return out.join("\n");
}

/** A reader's refusal of a text, as every parse error the core prints is worded (#1333): the kind of fault and where it
 *  stands, "<kind> at line L, column C" (each from 1), and never a character of the text itself, so a session opens the
 *  file there and the printout holds nothing the file holds. `at` is the fault's offset in `text`, or { line, col }; a
 *  line ends at CRLF, CR or LF, as V8 counts them. */
export function parseFault(kind, text, at) {
  let place = at;
  if (typeof at === "number") {
    const lines = String(text).slice(0, Math.max(0, at)).split(/\r\n|\r|\n/u);
    place = { line: lines.length, col: lines.at(-1).length + 1 };
  }
  return new SyntaxError(place ? `${kind} at line ${place.line}, column ${place.col}` : kind);
}

// (V8's words for a fault of JSON that quote nothing of the text: words, and the marks of JSON's own grammar in quotes)
const JSON_KIND = /^(?:[A-Za-z -]|'[,:{}[\]]')+$/u;
// (V8's own offset, which ends its message where it gives one: a text quoted earlier in the message may hold the same
// words, so only the end is read)
const JSON_AT = /(?: in JSON)? at position (\d+)(?: \(line \d+ column \d+\))?$/u;
// (where V8 names the offending character, and not its offset, the offset is the shortest start of the text that already
// fails other than by ending early: each shorter one is the start of a JSON text, so it parses, or fails at its end;
// sought only in a text of SEEK characters at most, since each step parses a start of it again, about 20 parses of the
// text at SEEK, so a longer text answers in about the time of one parse, its fault's place not given)
export const SEEK = 1 << 20;
function jsonFaultAt(text) {
  const failsWithin = k => {
    try { JSON.parse(text.slice(0, k)); return false; } catch (e) {
      const m = String(e?.message), at = JSON_AT.exec(m);
      return !/^Unexpected end of JSON input/u.test(m) && (!at || Number(at[1]) < k);
    }
  };
  let lo = 1, hi = text.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (failsWithin(mid)) hi = mid; else lo = mid + 1; }
  return lo - 1;
}

/** JSON's text parsed, as JSON.parse parses it, and refused, as text that is no JSON is, where it nests deeper than
 *  DEEPEST: what reads it after, by recursion or by printing it, then never runs out of stack. A text that is no JSON
 *  throws parseFault's form, never V8's own message, which quotes the text. */
export function parseBounded(text) {
  let value;
  try { value = JSON.parse(text); } catch (e) {
    if (!(e instanceof SyntaxError)) throw e;
    const s = String(text), m = String(e.message), at = JSON_AT.exec(m), words = at ? m.slice(0, at.index) : "";
    if (/^Unexpected end of JSON input/u.test(m)) throw parseFault("unexpected end of input", s, s.length);
    const kind = /^Unexpected token/u.test(m) ? "unexpected character" : JSON_KIND.test(words) ? words[0].toLowerCase() + words.slice(1) : "not valid JSON";
    if (!at && s.length > SEEK) throw parseFault(`${kind}, its place not sought in a text past ${SEEK} characters`, s, null);
    throw parseFault(kind, s, at ? Number(at[1]) : jsonFaultAt(s));
  }
  if (tooDeep(value)) throw new SyntaxError(`it nests deeper than ${DEEPEST} objects and lists`);
  return value;
}
