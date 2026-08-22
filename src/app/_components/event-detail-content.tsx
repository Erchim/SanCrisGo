import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eventReturnHref } from "@/lib/events/navigation";
import {
  formatEventDate,
  formatEventTimeRange,
  formatEventType,
  safeExternalUrl,
  safePhoneHref,
} from "@/lib/events/presentation";
import { getPublishedEvent, type PublicEvent } from "@/lib/events/public-events";
import { eventLocalizedPaths, eventsPath, homePath, type Locale } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

const copy = {
  en: {
    notFound: "Event not found",
    fallbackDescription: (event: PublicEvent) => `${event.title} in San Cristóbal de las Casas on ${formatEventDate(event.starts_on)}.`,
    home: "Home",
    events: "Events",
    breadcrumb: "Breadcrumb",
    back: "← Back to events",
    gallery: "Event images",
    image: "image",
    when: "When",
    where: "Where",
    price: "Price",
    contact: "Contact",
    about: "About this event",
    tickets: "Tickets or registration ↗",
    source: "View original event source ↗",
    organizedBy: "Organized by",
  },
  es: {
    notFound: "Evento no encontrado",
    fallbackDescription: (event: PublicEvent) => `${event.title} en San Cristóbal de las Casas el ${formatEventDate(event.starts_on, false, "es")}.`,
    home: "Inicio",
    events: "Eventos",
    breadcrumb: "Ruta de navegación",
    back: "← Volver a eventos",
    gallery: "Imágenes del evento",
    image: "imagen",
    when: "Cuándo",
    where: "Dónde",
    price: "Precio",
    contact: "Contacto",
    about: "Acerca de este evento",
    tickets: "Boletos o registro ↗",
    source: "Ver la fuente original del evento ↗",
    organizedBy: "Organiza",
  },
} as const;

export async function generateLocalizedEventMetadata(
  slug: string,
  locale: Locale,
): Promise<Metadata> {
  const [event, spanishEvent] = await Promise.all([
    getPublishedEvent(slug, locale),
    locale === "en" ? getPublishedEvent(slug, "es") : Promise.resolve(null),
  ]);
  if (!event) return { title: copy[locale].notFound };

  const title = locale === "en" ? (event.seo_title ?? event.title) : event.title;
  const description = locale === "en"
    ? (event.seo_description ?? event.summary ?? copy.en.fallbackDescription(event))
    : (event.summary ?? event.description ?? copy.es.fallbackDescription(event));
  const paths = eventLocalizedPaths(event.slug);
  const canonical = getAbsoluteUrl(paths[locale]);
  const hasCounterpart = locale === "es" || spanishEvent !== null;

  return {
    title,
    description,
    ...(hasCounterpart
      ? { alternates: localizedAlternates(locale, paths) }
      : { alternates: { canonical } }),
    openGraph: {
      type: "website",
      title,
      description,
      locale: locale === "es" ? "es_MX" : "en_US",
      ...(hasCounterpart && { alternateLocale: [locale === "es" ? "en_US" : "es_MX"] }),
      ...(canonical && { url: canonical }),
      ...(event.media[0] && {
        images: [{ url: event.media[0].url, alt: event.media[0].altText ?? event.title }],
      }),
    },
  };
}

function eventJsonLd(event: PublicEvent, locale: Locale) {
  const canonical = getAbsoluteUrl(eventLocalizedPaths(event.slug)[locale]);
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
    inLanguage: locale,
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

function eventBreadcrumbJsonLd(event: PublicEvent, locale: Locale) {
  const homeUrl = getAbsoluteUrl(homePath(locale));
  const eventsUrl = getAbsoluteUrl(eventsPath(locale));
  const eventUrl = getAbsoluteUrl(eventLocalizedPaths(event.slug)[locale]);
  if (!homeUrl || !eventsUrl || !eventUrl) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy[locale].home, item: homeUrl },
      { "@type": "ListItem", position: 2, name: copy[locale].events, item: eventsUrl },
      { "@type": "ListItem", position: 3, name: event.title, item: eventUrl },
    ],
  };
}

export async function EventDetailContent({
  locale,
  params,
  searchParams,
}: {
  locale: Locale;
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const event = await getPublishedEvent(slug, locale);
  if (!event) notFound();

  const text = copy[locale];
  const jsonLd = JSON.stringify(eventJsonLd(event, locale)).replace(/</g, "\\u003c");
  const breadcrumb = eventBreadcrumbJsonLd(event, locale);
  const breadcrumbJsonLd = breadcrumb
    ? JSON.stringify(breadcrumb).replace(/</g, "\\u003c")
    : null;
  const ticketUrl = safeExternalUrl(event.ticket_url);
  const sourceUrl = safeExternalUrl(event.source_url);
  const organizerUrl = safeExternalUrl(event.organizer_url);
  const phoneHref = safePhoneHref(event.contact_phone);
  const backHref = eventReturnHref(typeof query.from === "string" ? query.from : undefined, locale);
  const listingHref = eventsPath(locale);

  return (
    <article className="event-article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      )}

      <nav className="event-breadcrumbs" aria-label={text.breadcrumb}>
        <ol>
          <li><Link href={homePath(locale)}>{text.home}</Link></li>
          <li><Link href={listingHref}>{text.events}</Link></li>
          <li aria-current="page">{event.title}</li>
        </ol>
      </nav>
      <Link className="back-link" href={backHref}>{text.back}</Link>
      <header className="event-article-header">
        <p className="event-type">{formatEventType(event.event_type, locale)}</p>
        <h1>{event.title}</h1>
        {event.summary && <p className="lede">{event.summary}</p>}
      </header>

      {event.media.length > 0 && (
        <section className="event-gallery" aria-label={text.gallery}>
          {event.media.map((media, index) => (
            <figure key={`${media.sortOrder}-${media.url}`}>
              <Image
                alt={media.altText || `${event.title} — ${text.image} ${index + 1}`}
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
        <section aria-labelledby={`event-when-heading-${locale}`}>
          <h2 id={`event-when-heading-${locale}`}>{text.when}</h2>
          <p>
            <time dateTime={event.starts_at ?? event.starts_on}>
              {formatEventDate(event.starts_on, false, locale)}
            </time><br />
            <span>{formatEventTimeRange(event.starts_at, event.ends_at, locale)}</span>
          </p>
        </section>

        {(event.venue_name || event.address) && (
          <section aria-labelledby={`event-where-heading-${locale}`}>
            <h2 id={`event-where-heading-${locale}`}>{text.where}</h2>
            {event.venue_name && <p><strong>{event.venue_name}</strong></p>}
            {event.address && <p>{event.address}</p>}
          </section>
        )}

        {event.price_text && (
          <section aria-labelledby={`event-price-heading-${locale}`}>
            <h2 id={`event-price-heading-${locale}`}>{text.price}</h2>
            <p>{event.price_text}</p>
          </section>
        )}

        {event.contact_phone && (
          <section aria-labelledby={`event-contact-heading-${locale}`}>
            <h2 id={`event-contact-heading-${locale}`}>{text.contact}</h2>
            <p>{phoneHref ? <a href={phoneHref}>{event.contact_phone}</a> : event.contact_phone}</p>
          </section>
        )}
      </div>

      {event.description && (
        <section className="event-description" aria-labelledby={`event-description-heading-${locale}`}>
          <h2 id={`event-description-heading-${locale}`}>{text.about}</h2>
          <p>{event.description}</p>
        </section>
      )}

      <div className="event-actions">
        {ticketUrl && (
          <a className="primary-link" href={ticketUrl} rel="noopener noreferrer">{text.tickets}</a>
        )}
        {sourceUrl && (
          <a href={sourceUrl} rel="noopener noreferrer">{text.source}</a>
        )}
      </div>

      {event.organizer_name && (
        <p className="event-organizer">
          {text.organizedBy}{" "}
          {organizerUrl ? (
            <a href={organizerUrl} rel="noopener noreferrer">{event.organizer_name}</a>
          ) : event.organizer_name}
        </p>
      )}
    </article>
  );
}
