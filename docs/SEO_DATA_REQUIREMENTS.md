# SEO data requirements

Organic Google Search is SanCrisGo's primary initial acquisition channel. Each page must answer its query clearly, add trustworthy local context, and provide a useful related action.

## Stable, indexable pages

Every published core object can produce one canonical URL from its unique slug:

- `/places/{slug}/`
- `/events/{slug}/`
- `/guides/{slug}/`

Slugs should be descriptive, durable, lowercase URL tokens. Changing a published slug later requires a redirect strategy. Public pages must be emitted as complete static or server-rendered HTML containing their meaningful content and metadata. A blank shell that depends on client-side Supabase requests is not an acceptable SEO foundation.

## Publication content bar

Publishing remains an editorial decision even where the database cannot measure quality.

### Places

Ideally require name, slug, place type, useful summary and description, relevant location/contact details, and `last_verified_at` for facts that become stale. SEO title, SEO description, cover image, and a trustworthy source URL are recommended.

### Events

Require title, slug, start time, a referenced place or clear fallback venue/location, useful description, and source or verification information. Events are highly freshness-sensitive: expired or changed events should not remain presented as current.

### Guides

Require title, slug, summary, substantial Markdown body, explicit language, and publication date. Guides should directly satisfy search intent, use clear headings, distinguish verified fact from advice, and be maintained when logistics or safety information changes.

## Metadata, quality, and linking

SEO title and description overrides are nullable; renderers should fall back to editorial titles and summaries. Pages should have one canonical URL, descriptive headings, accessible image text supplied by a future presentation layer, and visible verification/update context when useful. Avoid thin, duplicated, or keyword-stuffed pages.

Tags and explicit relations enable useful internal links among guides, places, events, transport options, and nearby or related resources. Links should help readers continue their task rather than exist solely for crawlers. Unpublished parents and their relation rows must never appear publicly.

## Freshness and future work

`source_url`, `last_verified_at`, and `updated_at` provide the data needed for later stale-record dashboards. No automatic verification is included now.

After public rendering exists, add XML sitemaps containing canonical published URLs, robots controls, redirects for changed slugs, Open Graph metadata, and appropriate Schema.org JSON-LD (for example `Place`, `Event`, and `Article`) derived from validated columns. Structured data must accurately match visible page content; it is not a substitute for useful writing.
