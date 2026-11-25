// The npm lock files of a project that its licence config does not name (floor rule 10; #1316), for the licence check
// (licences.mjs, beside this file). GitHub's dependency review matches the names it lets through ("data", "fonts" and
// some of "accepted", the project's and the core's: actionLists there) by name alone, whatever the version, in every
// lock file a pull request changes; so a lock file the licence check does not read is held by the review alone, which
// cannot tell what ships and lets those names through unread. Each tracked package-lock.json and npm-shrinkwrap.json,
// its name in any case, is named in "lockfiles", or is said here: one the pull request adds, or whose name the base's
// config held, fails, as does a project whose files cannot be listed on a pull request; one that stood unnamed at its
// base, or with no base to read it against, is reported and passes ("Nothing locks a project" in the core's AGENTS.md).
// Left to others: those the config's scan reads (licence-scan.mjs, which fails every one it reads), a shrinkwrap file
// beside a named lock file or the other way round (the check's own failure), and, in a project, its copy of the core,
// whose lock files the core holds under its own config, the copy held to the pin byte for byte (core.yml).
import { execFileSync } from "node:child_process";
import { posix } from "node:path";
import { copyOf } from "./core-path.mjs";
import { LOCKFILE } from "./licence-scan.mjs";

// (npm on a file system that ignores case opens a lock file whose name differs from its own only in case, so this
// check says such a name too, wherever it stands)
const ANY_CASE = new RegExp(LOCKFILE.source, "iu");

// (a path of the config's "scan" holds a file where it is that file, or a folder ending in "/" above it, as the scan reads it)
const under = (f, paths) => (paths ?? []).some((p) => p === "" || p === f || (p.endsWith("/") && f.startsWith(p)));

// (512 MiB of paths, some 5,000,000 files, near the longest text Node holds, so no project's list overruns it)
const listed = (root, args) => {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 1 << 29, stdio: ["ignore", "pipe", "ignore"] }).split("\0").filter(Boolean); } catch { return null; }
};

/** The tracked files of the project at `root` (git ls-files), or null where git lists none there. */
export const trackedIn = (root) => listed(root, ["ls-files", "-z"]);

/** Whether a lock file stood unnamed at `base` (a commit, or null): a file of its tree (a folder at that path is none)
 *  that `then` (the base's config, normalised) did not name. Where the base's tree cannot be listed, none stood. */
export function stoodAt(root, base, then) {
  const files = new Set((base && listed(root, ["ls-tree", "-r", "-z", "--name-only", base, "--"])) ?? []);
  const named = new Set(Array.isArray(then?.lockfiles) ? then.lockfiles : []);
  return (f) => files.has(f) && !named.has(f);
}

// (where no file can be listed: a pull request fails, since what it adds cannot be told; anything else is reported)
function unlisted(base) {
  const said = "the project's lock files of npm's could not be listed (git lists no tracked file at its root), so none the licence config does not name is said, and one it does not name is held by the dependency review alone";
  return base ? { failures: [`${said}. Mend: run the check in the project's git checkout, as the licence workflow does`], reports: [] } : { failures: [], reports: [`${said}. Mend: run the check in the project's git checkout`] };
}

/** Whether `f` is no lock file of npm's for this check: no such name, one `named` holds or, of npm's own case, its twin, one of the
 *  core's copy at `copy` (or null), or one the config's scan reads. */
function leftOut(f, named, copy, config) {
  const twin = posix.join(posix.dirname(f), posix.basename(f) === "npm-shrinkwrap.json" ? "package-lock.json" : "npm-shrinkwrap.json");
  if (!ANY_CASE.test(f) || named.has(f) || (LOCKFILE.test(f) && named.has(twin))) return true;
  if (copy !== null && f.startsWith(copy)) return true;
  return Boolean(config.scan) && LOCKFILE.test(f) && !under(f, config.scan.skip);
}

/** Each npm lock file of `tracked` (the tracked files of the project at `root`, or null where none could be listed)
 *  that `config` (normalised) does not name, read against `base` (a commit, or null) with `stood(f)`, whether it
 *  stood unnamed at the base: { failures, reports }. */
export function unnamedLocks(root, tracked, config, base, stood) {
  if (tracked === null) return unlisted(base);
  const failures = [], reports = [];
  const named = new Set(config.lockfiles ?? []);
  const copy = tracked.includes("core-manifest.md") ? copyOf(root) : null;
  for (const f of tracked) {
    if (leftOut(f, named, copy, config)) continue;
    const said = `${f} is a lock file of npm's that the licence config's "lockfiles" does not name, so this check reads none of its packages and the dependency review alone holds them, by name, to the tools' list`;
    if (base && !stood(f)) failures.push(`${said}. Mend: name ${f} in the config's "lockfiles", and its package.json in "ships" where its packages reach users`);
    else reports.push(`${said}; it stood so ${base ? "at the pull request's base" : "with no base to read it against"}, so it passes: name it in the config's "lockfiles"`);
  }
  return { failures, reports };
}
