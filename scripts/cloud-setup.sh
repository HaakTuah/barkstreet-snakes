#!/usr/bin/env bash
# Prepare a cloud machine (Ubuntu 24.04, run as root) for the browser suites: Node 22 is already there, but
# Chrome or Chromium may not be. tools/browser.js looks in /usr/bin/google-chrome, /usr/bin/chromium and
# /usr/bin/chromium-browser, or uses CHROME. Safe to run twice; always exits 0 and says what it could not do.
# The same script can be pasted into a cloud environment's "Setup script" field.
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
