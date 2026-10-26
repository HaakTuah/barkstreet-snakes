---
name: workflow-agents-share-scratchpad
description: "Keep my tools and drafts in <repo>/.git/perry-tools: agents wipe the scratchpad, and Windows temp cleanup wipes anything under %TEMP% older than about a day"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8666b70b-b3ad-4ec8-bb64-c189a78c0152
  modified: 2026-10-18T11:40:26.026Z
---

Two hazards for files I keep across a long session:
- **Agents** (2026-10-14): workflow agents twice wiped my files in the session scratchpad, even scratchpad/mine/, although the prompts said "use your own folder, never delete files you didn't create". They reuse whatever tools they find and "clean up" afterwards; folders named `base` are especially at risk.
- **Temp cleanup** (2026-10-18): the sibling folder `<session temp>/perry-tools/` lost every file older than about a day (crop.js, montage2.js, media.js, fix-pr-links.js, pr-bodies/, r4-/r5- results, phone-layout.js and its shots), while the day's files survived. No agent's transcript touched them, so it was most likely Windows' own %TEMP% cleanup (Storage Sense). And on 2026-10-19, when the session restarted after a usage-limit stop, the whole session temp folder was emptied: perry-tools, the task outputs, the snake-S shots, and the worktrees agents had put there. Workflow results survive in ~/.claude/projects/<project>/<session>/subagents/workflows/<run>/journal.jsonl.

**Why:** the scratchpad path is given to every agent, so anything in it is fair game to them; and %TEMP% is not durable across days.

**How to apply:**
- Keep my own tools, baselines and PR drafts in `C:/Users/Perry/source/repos/snake-game/.git/perry-tools/`. It is inside the repo but never tracked or touched by checkouts or worktrees, and it isn't under %TEMP%.
- Give agents scratch subfolders there (or in the scratchpad for throwaway work), with unique names (e.g. `base-769a797`).
- Hand baselines over as `git archive <sha>`.
- After a workflow, re-time back to back (interleaved, itime.js), because agents' timings under shared load are noisy.

Related: [[queued-polish-pass]].
