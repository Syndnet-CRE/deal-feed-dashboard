---
name: unregistered-routes
enabled: true
event: file
action: warn
pattern: "^.*/routes/dealfeed/[^/]+\\.js$"
---
[Hook] New route file written: $FILE_PATH

Is this route registered in routes/dealfeed/index.js?

Required line (example for admin.js):
  router.use('/admin', require('./admin'));

Without registration the route is unreachable in production — no 404, just a missing endpoint.

Lesson: admin.js was written and committed but never registered. The "Run Now" button silently failed for weeks.
