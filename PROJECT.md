# SanCrisGo project context

## Product

SanCrisGo is a live local city portal for San Cristóbal de las Casas, Chiapas. It serves visitors and residents with trustworthy, interconnected local information and useful next actions. Organic search is the primary acquisition channel, so public pages require stable URLs, complete server-rendered HTML, clear search intent, and strong internal linking.

The current public product includes Events, English Guides, Taxi, and the first structured Places foundation. Staff can maintain verified Places, connect Events to them, and publish useful Place detail pages; this does not imply a large public Places inventory yet. Events support verified one-time and simple weekly schedules without duplicating the underlying series. The information model connects Places, Events, and Guides, with user-facing discovery layers such as Things to do, Food, Stay, and Learn, plus contextual utilities/actions such as Taxi. A visible discovery section does not automatically require a separate database entity.

## Production architecture

- Next.js, TypeScript, and the App Router on Vercel.
- Supabase PostgreSQL, Auth, row-level security, and Storage-backed media.
- Server Components by default; important public content remains server-rendered and SEO-first.
- PostgreSQL migrations are the schema source of truth. Applied migrations are never rewritten.
- Essential editorial and SEO data uses typed columns; JSONB is reserved for genuinely variable extensions.

## Languages and public URLs

English is the default language and remains unprefixed. Spanish uses the `/es` tree. The bilingual public foundation currently covers Home, Events, Event details, and Taxi. Event presentation uses existing structured English and Spanish fields, with original-source fallback only when it is linguistically safe.

Guides remain English-first at `/guides` until real translated Guide content exists; the site must not expose empty Spanish Guide routes or false language counterparts. Future public entities and discovery layers should follow the same stable, server-rendered URL and locale conventions.

## Content and staged work

Content is pre-moderated. Users cannot self-publish, and website publication remains independent from external publication workflows. Places are an active structured content foundation; the Food, Stay, Learn, and Things to do discovery layers remain staged until they have enough verified underlying content. Rentals, Tours as a dedicated catalog, community features, profiles, comments, ratings, bookings, payments, business claims, advertising, and automated translation remain deferred until explicitly scoped and justified by real product needs.

Volunteer / Opportunities and Support local / Donations are also deferred discovery directions. Future opportunities may cover verified hostel exchange, eco/community projects, teaching, and similar local work. Future support content may surface verified local causes or projects; SanCrisGo does not currently receive or distribute donations.
