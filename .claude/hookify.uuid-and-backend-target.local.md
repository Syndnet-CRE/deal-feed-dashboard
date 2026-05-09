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
The production backend is **`https://scoutgpt-app.onrender.com`** (deployed from the `main` branch of scoutgpt-api). The other Render service `scoutgpt-api.onrender.com` is a free-tier dev environment with an empty database — never point this app at it.

If you see a hardcoded `scoutgpt-api.onrender.com` URL in source, flag it. Production overrides should come from `VITE_API_BASE_URL`, never from a string literal in code.

## Why this rule exists
The dual-Render-service / dual-database topology in scoutgpt-api caused a full afternoon of "I can't log in" debugging. See `CLAUDE.md` → BACKEND CONTRACT → "Backend topology" for the full mapping.
