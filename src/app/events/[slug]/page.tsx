import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedEvent, type PublicEvent } from "@/lib/events/public-events";
import {
  formatEventDate,
  formatEventTimeRange,
  formatEventType,
  safeExternalUrl,
  safePhoneHref,
} from "@/lib/events/presentation";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  if (!event) return { title: "Event not found" };

  const title = event.seo_title ?? event.title;
  const description = event.seo_description
    ?? event.summary
    ?? `${event.title} in San Cristóbal de las Casas on ${formatEventDate(event.starts_on)}.`;
  const canonical = getAbsoluteUrl(`/events/${event.slug}`);

  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      type: "website",
      title,
      description,
      ...(canonical && { url: canonical }),
      ...(event.media[0] && { images: [{ url: event.media[0].url, alt: event.media[0].altText ?? event.title }] }),
    },
  };
}

function eventJsonLd(event: PublicEvent) {
  const canonical = getAbsoluteUrl(`/events/${event.slug}`);
  const organizerUrl = safeExternalUrl(event.organizer_url);
  const location = event.venue_name || event.address
    ? {
        "@type": "Place",
        ...(event.venue_name && { name: event.venue_name }),
        address: {
          "@type": "PostalAddress",
          ...(event.address && { streetAddress: event.address }),
          addressLocality: "San Cristóbal de las Casas",
          addressRegion: "Chiapas",
          addressCountry: "MX",
        },
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.starts_at ?? event.starts_on,
    ...((event.ends_at || event.ends_on) && { endDate: event.ends_at ?? event.ends_on }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...((event.summary || event.description) && { description: event.summary || event.description }),
    ...(event.media.length > 0 && { image: event.media.map((media) => media.url) }),
    ...(canonical && { url: canonical }),
    ...(location && { location }),
    ...(event.organizer_name && {
      organizer: {
        "@type": "Organization",
        name: event.organizer_name,
        ...(organizerUrl && { url: organizerUrl }),
      },
    }),
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  if (!event) notFound();

  const jsonLd = JSON.stringify(eventJsonLd(event)).replace(/</g, "\\u003c");
  const ticketUrl = safeExternalUrl(event.ticket_url);
  const sourceUrl = safeExternalUrl(event.source_url);
  const organizerUrl = safeExternalUrl(event.organizer_url);
  const phoneHref = safePhoneHref(event.contact_phone);

  return (
    <article className="event-article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <Link className="back-link" href="/events">← All events</Link>
      <header className="event-article-header">
        <p className="event-type">{formatEventType(event.event_type)}</p>
        <h1>{event.title}</h1>
        {event.summary && <p className="lede">{event.summary}</p>}
      </header>

      {event.media.length > 0 && (
        <section className="event-gallery" aria-label="Event images">
          {event.media.map((media, index) => (
            <figure key={`${media.sortOrder}-${media.url}`}>
              <Image
                alt={media.altText || `${event.title} — image ${index + 1}`}
                src={media.url}
                width={1200}
                height={1200}
                sizes="(max-width: 48rem) 100vw, 48rem"
                priority={index === 0}
              />
            </figure>
          ))}
        </section>
      )}

      <div className="event-details">
        <section aria-labelledby="event-when-heading">
          <h2 id="event-when-heading">When</h2>
          <p>
            <time dateTime={event.starts_at ?? event.starts_on}>{formatEventDate(event.starts_on)}</time><br />
            <span>{formatEventTimeRange(event.starts_at, event.ends_at)}</span>
          </p>
        </section>

        {(event.venue_name || event.address) && (
          <section aria-labelledby="event-where-heading">
            <h2 id="event-where-heading">Where</h2>
            {event.venue_name && <p><strong>{event.venue_name}</strong></p>}
            {event.address && <p>{event.address}</p>}
          </section>
        )}

        {event.price_text && (
          <section aria-labelledby="event-price-heading">
            <h2 id="event-price-heading">Price</h2>
            <p>{event.price_text}</p>
          </section>
        )}

        {event.contact_phone && (
          <section aria-labelledby="event-contact-heading">
            <h2 id="event-contact-heading">Contact</h2>
            <p>{phoneHref ? <a href={phoneHref}>{event.contact_phone}</a> : event.contact_phone}</p>
          </section>
        )}
      </div>

      {event.description && (
        <section className="event-description" aria-labelledby="event-description-heading">
          <h2 id="event-description-heading">About this event</h2>
          <p>{event.description}</p>
        </section>
      )}

      <div className="event-actions">
        {ticketUrl && (
          <a className="primary-link" href={ticketUrl} rel="noopener noreferrer">Tickets or registration ↗</a>
        )}
        {sourceUrl && (
          <a href={sourceUrl} rel="noopener noreferrer">View original event source ↗</a>
        )}
      </div>

      {event.organizer_name && (
        <p className="event-organizer">
          Organized by{" "}
          {organizerUrl ? (
            <a href={organizerUrl} rel="noopener noreferrer">{event.organizer_name}</a>
          ) : event.organizer_name}
        </p>
      )}
    </article>
  );
}
