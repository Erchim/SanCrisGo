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

The frontend sends a conservative baseline set of HTTP security headers, including a Content Security Policy (CSP). Production responses also enable HTTP Strict Transport Security for HTTPS deployments. CI installs from the lockfile, lints, builds, and blocks dependency audit findings rated high or critical.

Next.js currently requires inline bootstrap scripts for server-rendered App Router pages, so `script-src` allows inline scripts but does not allow `unsafe-eval` or external script origins. Inline styles are also allowed for framework compatibility. Adopting nonce-based CSP is a future hardening option if the application gains middleware that can provide a unique nonce on every response.

This configuration is a baseline hardening step, not a claim that the application is completely secure. Future analytics, maps, advertising, embeds, external media hosts, or other third-party services will require deliberate review and narrowly scoped CSP changes before adoption.

## Product principle

SanCrisGo does not need to sell every service itself. It should answer the local question well, then connect the visitor with the appropriate next action: go independently, contact transport, find an operator, visit a place, or attend an event.

## Repository status

This repository is being rebuilt from scratch. Legacy SanCrisGo schemas and code are intentionally not used as the architectural foundation.
