# Hookify rule: UUID handling + backend target

**Trigger:** Any edit to a file in `src/` that:
- Calls `parseInt(` or `Number(` on a value sourced from `subscriber.id`, `deal.id`, `box.id`, `match_score` derived from a deal id field, or any value pulled from a backend API response that represents a primary key
- Hardcodes a backend URL containing `onrender.com`

## UUID rule
All dealfeed primary keys (`subscriber.id`, `deal.id`, `box.id`, `note.id`, `contact.id`, `agent_message.id`) are **UUID strings**. Treat them as opaque strings:
- Never `parseInt()` or `Number()` them
- Never compare with `==` against a number
- Never rely on `id - 1` or other numeric arithmetic
- For React keys, the raw string is fine

## Backend target rule
The production backend is **`https://nightdrop-api.onrender.com`** (deployed from the `main` branch of `~/nightdrop-api`, GitHub `Syndnet-CRE/nightdrop-api`). The previous backend `scoutgpt-app.onrender.com` is deprecated for this app — the service was extracted to its own repo on 2026-05-12.

If you see a hardcoded `scoutgpt-app.onrender.com` or `scoutgpt-api.onrender.com` URL in source, flag it as drift. Production overrides should come from `VITE_API_BASE_URL`, never from a string literal in code.

## Why this rule exists
- The dual-Render-service / dual-database topology in the old scoutgpt-api caused a full afternoon of "I can't log in" debugging.
- After the nightdrop-api extraction (2026-05-12), some local `.env` files, Netlify env vars, and rule files still carried the old URL. Any reappearance is drift.

See `CLAUDE.md` → BACKEND CONTRACT for the current mapping.
