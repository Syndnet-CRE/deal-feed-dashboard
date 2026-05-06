---
name: orphaned-scripts
enabled: true
event: file
action: warn
pattern: "^.*/scripts/[^/]+\\.js$"
---
[Hook] Script written to scripts/: $FILE_PATH

Is this script meant to run automatically? If so, wire it before this session ends:
- Add a Render Cron Job (render.yaml or Render dashboard), OR
- Register it in a route handler (e.g. POST /admin/runs/trigger), OR
- Add it to package.json "scripts"

If manual-only, document it in CLAUDE.md under KNOWN LANDMINES.

Lesson: run_deal_feed.js sat unscheduled for weeks — zero deals delivered to any subscriber.
