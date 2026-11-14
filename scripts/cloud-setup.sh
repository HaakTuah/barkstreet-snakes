#!/usr/bin/env bash
# Prepare a cloud machine (Ubuntu 24.04, run as root) for the suites: the core's one exact Node, the one CI runs ("Node"
# in core/modules/updates.md), the tools' packages (tools/package.json: TypeScript, Playwright), and Chrome or Chromium.
# tools/browser.js looks in /usr/bin/google-chrome, /usr/bin/chromium and /usr/bin/chromium-browser, or uses CHROME.
# Safe to run twice; always exits 0 and says what it could not do.
# The same script can be pasted into a cloud environment's "Setup script" field: it works from the repository this
# script is in, or, pasted there, the folder it runs in.
here=$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." 2>/dev/null && pwd); [ -f "$here/tools/package-lock.json" ] || here=$PWD
# Node: the core's scripts/node.sh, as main holds it, as this script itself runs (floor rule 3); it reads the pin from
# core/.node-version here, and installs only a version main's copy holds checksums for.
if node_sh=$(git -C "$here" --no-replace-objects show refs/remotes/origin/main:core/scripts/node.sh 2>/dev/null); then
  (cd "$here" && bash -c "$node_sh"); hash -r
else echo "NOT INSTALLED: Node (no core/scripts/node.sh on refs/remotes/origin/main: fetch main)"; fi
# The tools' packages, TypeScript (the types suite) and Playwright, at tools/package.json's versions, installed once
# here so the suites run without the network (Codex's cloud has none while it works). The lock is copied in beside them
# once installed, so an update to it (Dependabot's) is installed on the next run.
lock="$here/tools/package-lock.json"
if [ ! -f "$lock" ]; then echo "NOT INSTALLED: the tools' packages (no tools/package-lock.json in $here)"
elif cmp -s "$lock" "$here/tools/node_modules/.installed-lock"; then echo "tools: present"
# (--ignore-scripts said here too, since this script runs main's copy and tools/.npmrc is the branch's: SECURITY.md, rule 15)
elif npm ci --prefix "$here/tools" --ignore-scripts --no-audit --no-fund >/tmp/tools-install.log 2>&1 \
  && cp "$lock" "$here/tools/node_modules/.installed-lock"; then echo "tools: installed"
else echo "NOT INSTALLED: the tools' packages (see /tmp/tools-install.log); the types suite will install them if it can"; fi
have_chrome() { for c in /usr/bin/google-chrome /usr/bin/chromium /usr/bin/chromium-browser "${CHROME:-/nonexistent}"; do [ -x "$c" ] && return 0; done; return 1; }
if have_chrome; then echo "chrome: present"; exit 0; fi
# (Claude's cloud machines come with Playwright's Chromium in /opt/pw-browsers: link the newest)
bin=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome 2>/dev/null | sort -V | tail -1)
if [ -n "$bin" ]; then ln -sf "$bin" /usr/bin/chromium && echo "chromium: linked $bin as /usr/bin/chromium"; exit 0; fi
if [ -x "$here/tools/node_modules/.bin/playwright" ] && "$here/tools/node_modules/.bin/playwright" install --with-deps chromium >/tmp/playwright-install.log 2>&1; then
  bin=$(find "$HOME/.cache/ms-playwright" -type f -name chrome -path '*chrome-linux*' 2>/dev/null | head -1)
  [ -n "$bin" ] && ln -sf "$bin" /usr/bin/chromium && echo "chromium: installed at $bin, linked as /usr/bin/chromium"
fi
have_chrome || echo "NOT INSTALLED: Chrome or Chromium (see /tmp/playwright-install.log); the browser suites need it"
exit 0
