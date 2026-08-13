# SanCrisGo agent guide

- Read `PROJECT.md` before making architectural or product changes.
- Treat Google-search visibility, stable public URLs, and server-renderable content as primary requirements.
- PostgreSQL with Supabase is the backend direction. Make every database change through a new, reviewable migration; never rewrite applied migrations.
- Keep the core entities and schema simple and understandable. Do not casually redesign them or hide essential fields in JSON.
- Preserve and test row-level security. In particular, users must never self-publish or change privileged profile fields.
- Never expose or commit secrets, Supabase keys, or `.env` credentials.
- Do not add a forum, comments, bookings, payments, advertising, AI features, or a frontend unless explicitly requested.
- Do not invent businesses, addresses, contact details, prices, or other San Cristobal data.
- Explain substantial architectural changes and introduce dependencies only for a clear, documented reason.
