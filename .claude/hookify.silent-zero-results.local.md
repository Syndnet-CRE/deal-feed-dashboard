---
name: silent-zero-results
enabled: true
event: file
action: warn
pattern: "run_deal_feed\\.js"
---
[Hook] run_deal_feed.js edited.

Verify that zero-match runs are distinguishable from successful runs.

Current behavior: exits 0 whether 0 or 100 deals delivered. Logs say "No new properties to deliver" — looks identical to success in Render logs.

Before committing changes to this file, confirm:
- Zero-match runs write a warning to df_agent_runs.errors, OR
- A monitoring check exists that alerts if deals_generated = 0 for an active subscriber

Lesson: Brady had no visibility that the script was silently matching nothing.
