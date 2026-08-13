# Data model

## Overview

The initial model separates identity, publishable content, reusable classification, and explicit relationships. All application tables use row-level security. Migrations—not this document—are the executable source of truth.

## Identity and moderation

`profiles.id` is a one-to-one foreign key to `auth.users.id`. An Auth insert trigger creates a pending `user` profile. Roles are `user`, `staff`, or `owner`; account states are `pending`, `active`, or `suspended`. These constrained text values remain readable without introducing database enums.

All core content uses `draft`, `pending`, `published`, `rejected`, or `archived`. A currently published row must have `published_at`; an archived row may retain its historical publication timestamp, while draft, pending, and rejected rows cannot have one. Anonymous access remains limited to currently published content. Active users can create and maintain only their own pending events. Staff and owners moderate and manage content.

## Core content

- `places` represents both literal destinations and useful local listings. `place_type` stays flexible text. Coordinates and price level are validated. Variable hours use JSONB, while important display and discovery attributes remain columns. Public-content and tag slugs are constrained to bounded, lowercase ASCII URL tokens separated by single hyphens.
- `events` holds time-sensitive listings. It can reference a `place`, or use fallback venue/address text. End time cannot precede start time.
- `guides` stores Markdown editorial source and an explicit language. Guides are the expected first SEO traffic layer.
- `tags` is a shared vocabulary connected through `place_tags`, `event_tags`, and `guide_tags`.

## Explicit relationships

`place_relations` links two places with a typed, ordered edge. Foreign keys prevent dangling targets, and a constraint prevents self-links. `guide_places` links editorial coverage to a place. Explicit tables preserve referential integrity and avoid unsafe arbitrary polymorphic identifiers.

Join rows cascade when their parent content is removed. An event's optional `place_id` becomes null if the place is removed so its fallback venue data and moderation history can remain. A content creator deletion sets `created_by` null rather than deleting editorial content.

## Freshness and media

Core rows include source, verification, creation, update, and publication timestamps where relevant. Automated stale-content checks are deferred. `cover_image_path` is an eventual Supabase Storage object path, not a public URL or a media-management system.

## Migration order

1. `202608130001_initial_schema.sql` creates extensions, functions, tables, constraints, indexes, and timestamp/Auth triggers.
2. `202608130002_rls_policies.sql` installs authorization helpers, privilege protection, grants, RLS, and policies.
3. `supabase/seed.sql` inserts only neutral reusable tags.
