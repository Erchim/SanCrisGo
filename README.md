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

## Product principle

SanCrisGo does not need to sell every service itself. It should answer the local question well, then connect the visitor with the appropriate next action: go independently, contact transport, find an operator, visit a place, or attend an event.

## Repository status

This repository is being rebuilt from scratch. Legacy SanCrisGo schemas and code are intentionally not used as the architectural foundation.
