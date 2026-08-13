# SanCrisGo project context

## Purpose and users

SanCrisGo is intended to become the local digital hub for San Cristobal de las Casas, Chiapas, Mexico. It should serve visitors, temporary residents and expats, locals, businesses, event organizers, and service providers by turning trustworthy local information into a useful next action.

The acquisition priority is organic Google Search. A visitor should move from a search query to a complete, useful SanCrisGo page, receive a clear answer with local context, and then find an appropriate action or related resource. Public content must therefore support stable URLs and complete indexable HTML; SEO must never depend on a browser fetching the useful content after loading a blank shell.

## MVP

The first product foundation consists only of documentation and a PostgreSQL schema intended for Supabase. Its core entities are:

- profiles linked to Supabase Auth;
- places, a broad listing model covering attractions, hospitality, venues, operators, transport, and useful services;
- events, for freshness-sensitive local activities;
- guides, the principal initial search-acquisition and editorial layer;
- reusable tags, explicit place-to-place relations, and guide-to-place relations.

Content uses strict pre-moderation. Staff and owners manage places and guides and moderate events. Active users may submit pending events but cannot publish them. English is the initial language; explicit language fields leave room for later translation tables.

## Data and architecture principles

- PostgreSQL migrations in `supabase/migrations` are the source of truth. Future capabilities extend the schema with new migrations rather than replacing it.
- Supabase is the planned backend: Auth supplies identities and Storage will later hold files referenced by paths. There is no custom backend server in this phase.
- Essential editorial, discovery, verification, and SEO data stays in typed columns. JSONB is limited to variable opening schedules and non-critical extension metadata.
- UUID primary keys, `timestamptz`, explicit foreign keys, modest indexes, validation constraints, and row-level security form the database baseline.
- Flexible text categories are preferred over premature enums. Translation and media-gallery systems should be introduced only when requirements justify dedicated models.
- Frontend framework selection is deliberately deferred. Any later frontend must render important public pages as complete static or server-rendered HTML.

## Long-term direction and deferred work

The platform may eventually connect practical information, businesses, events, transport, day trips, community, concierge experiences, promotions, and contact or booking flows. This migration does **not** authorize building all of those features.

Frontend work, comments, forums, ratings, bookings, payments, business claims, advertising, AI/voice assistants, embeddings, automated recommendations, notifications, automated translation, complex media management, and production deployment are deferred until explicitly scoped. No fabricated local records should be used to fill the product.
