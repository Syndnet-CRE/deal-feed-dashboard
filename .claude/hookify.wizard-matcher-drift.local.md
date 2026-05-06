---
name: wizard-matcher-drift
enabled: true
event: file
action: warn
pattern: "(wizardHelpers\\.js|run_deal_feed\\.js)"
---
[Hook] Geography contract file edited: $FILE_PATH

wizardHelpers.js (buildPayload) and run_deal_feed.js (matchProperties) MUST stay in sync.

Current contract:
  wizardHelpers.js saves:  geo_states, geo_counties, geo_cities, geo_zips, geo_radius_*
  matchProperties handles: geo_states, geo_counties ONLY

If you added a geo field to the wizard, update matchProperties in the same session.
If you updated the matcher, verify the wizard saves the field.

Lesson: geo_cities, geo_zips, and geo_radius_* were saved to DB for months but never used in matching — zero deals for any subscriber using those geo modes.
