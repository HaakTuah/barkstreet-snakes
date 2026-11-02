#!/usr/bin/env bash
# Prepare a cloud machine (Ubuntu 24.04, run as root) for the suites: Node 26 (the version CI runs; "Node's version" in
# docs/developing.md), TypeScript, and Chrome or Chromium. tools/browser.js looks in /usr/bin/google-chrome, /usr/bin/chromium and
# /usr/bin/chromium-browser, or uses CHROME. Safe to run twice; always exits 0 and says what it could not do.
# The same script can be pasted into a cloud environment's "Setup script" field.
# Node: an older one is replaced with Node 26 from the npm registry (the "node" package), installed in /opt/node26 and
# linked over the node found first on PATH, so every shell runs it; npm and npx stay as they are.
node_major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)
if [ "${node_major:-0}" -ge 26 ]; then echo "node: $(node -v) present"
elif command -v npm >/dev/null 2>&1 && npm install -g --prefix /opt/node26 node@26 >/tmp/node-install.log 2>&1 \
  && [ -x /opt/node26/bin/node ] && ln -sf "$(readlink -f /opt/node26/bin/node)" "$(dirname "$(command -v node)")/node"; then
  hash -r; echo "node: installed $(node -v)"
else echo "NOT INSTALLED: Node 26 (see /tmp/node-install.log); the suites run on $(node -v 2>/dev/null || echo no node)"; fi
# TypeScript for the types suite: the version CI fetches (.github/workflows/tests.yml), installed once here so the
# suite runs without the network (Codex's cloud has none while it works).
if [ "$(tsc -v 2>/dev/null)" = "Version 6.0.2" ]; then echo "typescript: present"
elif command -v npm >/dev/null 2>&1 && npm install -g typescript@6.0.2 >/tmp/typescript-install.log 2>&1; then echo "typescript: installed"
else echo "NOT INSTALLED: TypeScript 6.0.2 (see /tmp/typescript-install.log); the types suite will fetch it if it can"; fi
have_chrome() { for c in /usr/bin/google-chrome /usr/bin/chromium /usr/bin/chromium-browser "${CHROME:-/nonexistent}"; do [ -x "$c" ] && return 0; done; return 1; }
if have_chrome; then echo "chrome: present"; exit 0; fi
# (Claude's cloud machines come with Playwright's Chromium in /opt/pw-browsers: link the newest)
bin=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome 2>/dev/null | sort -V | tail -1)
if [ -n "$bin" ]; then ln -sf "$bin" /usr/bin/chromium && echo "chromium: linked $bin as /usr/bin/chromium"; exit 0; fi
if command -v npx >/dev/null 2>&1 && npx -y playwright@1.49.1 install --with-deps chromium >/tmp/playwright-install.log 2>&1; then
  bin=$(find "$HOME/.cache/ms-playwright" -type f -name chrome -path '*chrome-linux*' 2>/dev/null | head -1)
  [ -n "$bin" ] && ln -sf "$bin" /usr/bin/chromium && echo "chromium: installed at $bin, linked as /usr/bin/chromium"
fi
have_chrome || echo "NOT INSTALLED: Chrome or Chromium (see /tmp/playwright-install.log); the browser suites need it"
exit 0
