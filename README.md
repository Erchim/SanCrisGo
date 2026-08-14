# SanCrisGo

SEO-first local information hub for San Cristobal de las Casas, Chiapas.

## v1 foundation

The first version is intentionally small and extensible:

- `places` — attractions, nature, restaurants, cafes, hotels, venues, transport/services and useful local listings
- `events` — time-bound local events
- `guides` — long-form practical and search-focused content
- `tags` — flexible classification
- `profiles` — application users and moderation roles

The stack is Next.js with TypeScript and the App Router for the public frontend, backed by PostgreSQL/Supabase. Public pages use server-first rendering for search visibility.

## Local frontend setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.env.local` with the values for your Supabase project. Do not commit that file or real credentials.

## Security baseline

The public frontend sends a baseline set of security headers on every route: a
Content Security Policy (CSP), `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, and a one-year `Strict-Transport-Security` policy for the
production HTTPS deployment. The identifying `X-Powered-By` header is disabled.

The CSP defaults resources and connections to the same origin, prevents framing
and object/embed content, restricts forms to the same origin, and upgrades
insecure requests. It intentionally permits inline scripts and styles because
Next.js emits inline bootstrap scripts and may emit inline styles. Production
does not permit `unsafe-eval`; local development permits it for Next.js
development tooling. Moving to nonce-based script policies would require
per-request rendering and should be evaluated deliberately rather than added as
an incidental architecture change.

CI installs the committed npm lockfile, lints, builds, and audits production
dependencies. The audit fails for high or critical findings while avoiding a
block on low-risk advisory noise. This is baseline hardening, not a claim that
the application is secure against every threat. Any future analytics, maps,
advertising, embeds, or external media hosts will require a deliberate CSP
review and narrowly scoped directive updates.

## Product principle

SanCrisGo does not need to sell every service itself. It should answer the local question well, then connect the visitor with the appropriate next action: go independently, contact transport, find an operator, visit a place, or attend an event.

## Repository status

This repository is being rebuilt from scratch. Legacy SanCrisGo schemas and code are intentionally not used as the architectural foundation.
