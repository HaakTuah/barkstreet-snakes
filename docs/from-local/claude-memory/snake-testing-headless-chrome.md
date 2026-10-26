---
name: snake-testing-headless-chrome
description: How to screenshot and measure Bark & Bite reliably when the desktop browser pane is hidden
metadata:
  node_type: memory
  type: feedback
  originSessionId: f28ba0dd-677e-4b8a-a7c9-3c27d2256a53
  modified: 2026-10-12T03:09:35.482Z
---

The built-in browser pane is usually hidden in this setup: requestAnimationFrame pauses and screenshots time out, so pane screenshots are flaky and frame timings there show fake 700-3000 ms outliers. What worked: drive a throwaway headless Chrome (C:/Program Files/Google/Chrome/Application/chrome.exe, `--headless=new`, own `--user-data-dir` and port per launch) over the DevTools protocol with Node 24's built-in WebSocket; use `Page.captureScreenshot`, `Emulation.setDeviceMetricsOverride` (DPR, mobile) and an rAF wrapper injected via `Page.addScriptToEvaluateOnNewDocument` to time real frames. Steer the player with `SnakeAI.decide` on `SnakeEngine.aiView` through real key events for gameplay shots.

**Why:** found during the polish pass (PR #4, 2026-10-12); it also caught real bugs (invisible meat, header reflow) that pane testing missed.

**How to apply:** for visual checks or perf numbers, prefer headless Chrome; send Enter with text "\r" so focused buttons activate; the overlay hides via the `.hidden` class, not the attribute. Behaviour-preserving AI/engine changes are proven with `node tools/simulate.js N --seed S` fingerprints. Related: [[game-ai-fairness]].
