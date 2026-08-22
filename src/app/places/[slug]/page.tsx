import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/app/events/_components/event-card";
import { formatDate } from "@/lib/format-date";
import { safeExternalUrl, safePhoneHref } from "@/lib/events/presentation";
import { getUpcomingPublishedEventsForPlace } from "@/lib/events/public-events";
import {
  getPublishedPlace,
  getPublishedPlaceRelatedGuides,
} from "@/lib/places/public-places";
import {
  buildPlaceMetadata,
  formatPlaceType,
  placePath,
} from "@/lib/places/presentation";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPublishedPlace(slug);
  return place ? buildPlaceMetadata(place) : { title: "Place not found" };
}

function whatsAppHref(value: string | null): string | null {
  if (!value) return null;
  const external = safeExternalUrl(value);
  if (external) return external;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

export default async function PlacePage({ params }: Props) {
  const { slug } = await params;
  const place = await getPublishedPlace(slug);
  if (!place) notFound();

  const [events, guides] = await Promise.all([
    getUpcomingPublishedEventsForPlace(place.id),
    getPublishedPlaceRelatedGuides(place.id),
  ]);
  const path = placePath(place.slug);
  const mapsUrl = safeExternalUrl(place.google_maps_url);
  const websiteUrl = safeExternalUrl(place.website_url);
  const instagramUrl = safeExternalUrl(place.instagram_url);
  const sourceUrl = safeExternalUrl(place.source_url);
  const phoneHref = safePhoneHref(place.phone);
  const whatsappUrl = whatsAppHref(place.whatsapp);

  return (
    <article className="place-article">
      <nav className="content-breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/places">Places</Link></li>
          <li aria-current="page">{place.name}</li>
        </ol>
      </nav>

      <header className="place-article-header">
        <p className="event-type">{formatPlaceType(place.place_type)}</p>
        <h1>{place.name}</h1>
        {place.summary && <p className="lede">{place.summary}</p>}
      </header>

      <div className="place-practical-grid">
        {(place.address || place.neighborhood || mapsUrl) && (
          <section>
            <h2>Location</h2>
            {place.neighborhood && <p>{place.neighborhood}</p>}
            {place.address && <p>{place.address}</p>}
            {mapsUrl && <a href={mapsUrl} rel="noopener noreferrer">Open in Google Maps ↗</a>}
          </section>
        )}
        {(place.phone || whatsappUrl || websiteUrl || instagramUrl) && (
          <section>
            <h2>Contact and official links</h2>
            <ul className="place-link-list">
              {place.phone && <li>{phoneHref ? <a href={phoneHref}>{place.phone}</a> : place.phone}</li>}
              {whatsappUrl && <li><a href={whatsappUrl} rel="noopener noreferrer">WhatsApp ↗</a></li>}
              {websiteUrl && <li><a href={websiteUrl} rel="noopener noreferrer">Official website ↗</a></li>}
              {instagramUrl && <li><a href={instagramUrl} rel="noopener noreferrer">Instagram ↗</a></li>}
            </ul>
          </section>
        )}
      </div>

      {place.description && (
        <section className="place-description">
          <h2>About this place</h2>
          <p>{place.description}</p>
        </section>
      )}

      {(place.last_verified_at || sourceUrl) && (
        <aside className="place-verification" aria-label="Information verification">
          {place.last_verified_at && (
            <p>Information last verified <time dateTime={place.last_verified_at}>{formatDate(place.last_verified_at)}</time>.</p>
          )}
          {sourceUrl && <a href={sourceUrl} rel="noopener noreferrer">Information source ↗</a>}
        </aside>
      )}

      {events.length > 0 && (
        <section className="place-related-section" aria-labelledby="place-events-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">What’s happening here</p>
              <h2 id="place-events-heading">Upcoming events</h2>
            </div>
            <Link href="/events">View all events</Link>
          </div>
          <ul className="event-list place-event-list">
            {events.map((event) => (
              <EventCard
                key={`${event.id}-${event.starts_on}`}
                event={event}
                headingLevel="h3"
                listingHref={path}
              />
            ))}
          </ul>
        </section>
      )}

      {guides.length > 0 && (
        <section className="place-related-section" aria-labelledby="place-guides-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Plan with context</p>
              <h2 id="place-guides-heading">Related guides</h2>
            </div>
          </div>
          <ul className="place-guide-list">
            {guides.map((guide) => (
              <li key={guide.id}>
                <p className="guide-category">{guide.category}</p>
                <h3><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h3>
                {guide.summary && <p>{guide.summary}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
