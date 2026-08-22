import Image from "next/image";
import Link from "next/link";
import { EventCard } from "@/app/events/_components/event-card";
import { formatDate } from "@/lib/format-date";
import { getUpcomingPublishedEvents } from "@/lib/events/public-events";
import { getLatestPublishedGuides } from "@/lib/guides";
import { eventsPath, taxiPath, type Locale } from "@/lib/locales";
import { getAbsoluteUrl } from "@/lib/site-url";
import { getGuideCardImage, homeHeroImage } from "@/lib/site-images";

const copy = {
  en: {
    heroEyebrow: "San Cristóbal, made easier",
    title: "Local guides, events and practical help in San Cristóbal",
    lede: "Practical, locally focused information for finding your way, planning the day, and seeing what is happening around the city.",
    quickHeading: "Find what you need",
    quickLabel: "Quick access",
    events: "Events",
    eventsPurpose: "See what's happening in San Cristóbal.",
    taxi: "Taxi",
    taxiPurpose: "Contact a local driver on WhatsApp.",
    guides: "Guides",
    guidesPurpose: "Practical local information for your stay.",
    photo: "Photo",
    happening: "What's happening",
    upcoming: "Upcoming events",
    viewEvents: "View all events",
  },
  es: {
    heroEyebrow: "San Cristóbal, más fácil",
    title: "Eventos y ayuda práctica en San Cristóbal",
    lede: "Información práctica y local para orientarte, planear el día y descubrir qué está pasando en la ciudad.",
    quickHeading: "Encuentra lo que necesitas",
    quickLabel: "Acceso rápido",
    events: "Eventos",
    eventsPurpose: "Descubre qué está pasando en San Cristóbal.",
    taxi: "Taxi",
    taxiPurpose: "Contacta a un conductor local por WhatsApp.",
    guides: "Guías",
    guidesPurpose: "Información local práctica para tu estancia.",
    photo: "Foto",
    happening: "Qué está pasando",
    upcoming: "Próximos eventos",
    viewEvents: "Ver todos los eventos",
  },
} as const;

function websiteJsonLd(locale: Locale) {
  const canonical = getAbsoluteUrl(locale === "es" ? "/es" : "/");
  if (!canonical) return null;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SanCrisGo",
    alternateName: "San Cris Go",
    url: canonical,
    inLanguage: locale,
  };
}

export async function HomeContent({ locale }: { locale: Locale }) {
  const [guides, upcomingEvents] = await Promise.all([
    locale === "en" ? getLatestPublishedGuides() : Promise.resolve([]),
    getUpcomingPublishedEvents(3, locale),
  ]);
  const text = copy[locale];
  const eventsHref = eventsPath(locale);
  const website = websiteJsonLd(locale);
  const websiteJson = website
    ? JSON.stringify(website).replace(/</g, "\\u003c")
    : null;

  return (
    <div className="home">
      {websiteJson && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJson }} />
      )}
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">{text.heroEyebrow}</p>
          <h1>{text.title}</h1>
          <p className="lede">{text.lede}</p>
          <section className="home-quick-access" aria-labelledby={`quick-access-heading-${locale}`}>
            <header>
              <h2 id={`quick-access-heading-${locale}`}>{text.quickHeading}</h2>
            </header>
            <nav aria-label={text.quickLabel}>
              <ul className="home-quick-grid">
                <li>
                  <Link className="home-quick-tile home-quick-tile-primary" href={eventsHref}>
                    <span className="home-quick-label">{text.events}</span>
                    <span>{text.eventsPurpose}</span>
                    <span aria-hidden="true" className="home-quick-arrow">→</span>
                  </Link>
                </li>
                <li>
                  <Link className="home-quick-tile home-quick-tile-primary" href={taxiPath(locale)}>
                    <span className="home-quick-label">{text.taxi}</span>
                    <span>{text.taxiPurpose}</span>
                    <span aria-hidden="true" className="home-quick-arrow">→</span>
                  </Link>
                </li>
                {locale === "en" && (
                  <li>
                    <Link className="home-quick-tile" href="/guides">
                      <span className="home-quick-label">{text.guides}</span>
                      <span>{text.guidesPurpose}</span>
                      <span aria-hidden="true" className="home-quick-arrow">→</span>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </section>
        </div>
        <figure className="home-hero-visual">
          <Image
            alt={homeHeroImage.alt[locale]}
            height={homeHeroImage.height}
            priority
            sizes="(max-width: 48rem) 100vw, 48vw"
            src={homeHeroImage.src}
            width={homeHeroImage.width}
          />
          <figcaption>
            {text.photo}: Adam Jones · <a href="https://creativecommons.org/licenses/by/2.0">CC BY 2.0</a>
          </figcaption>
        </figure>
      </section>

      {upcomingEvents.length > 0 && (
        <section className="home-upcoming-events" aria-labelledby={`upcoming-events-heading-${locale}`}>
          <header className="section-heading">
            <div>
              <p className="eyebrow">{text.happening}</p>
              <h2 id={`upcoming-events-heading-${locale}`}>{text.upcoming}</h2>
            </div>
            <Link className="all-guides-link" href={eventsHref}>{text.viewEvents}</Link>
          </header>
          <ul className="event-list">
            {upcomingEvents.map((event) => (
              <EventCard
                event={event}
                headingLevel="h3"
                key={event.id}
                listingHref={eventsHref}
                locale={locale}
              />
            ))}
          </ul>
        </section>
      )}

      {locale === "en" && (
        <section className="latest-guides" aria-labelledby="latest-guides-heading">
          <header className="section-heading">
            <div>
              <p className="eyebrow">Plan with current information</p>
              <h2 id="latest-guides-heading">Latest guides</h2>
            </div>
            <Link className="all-guides-link" href="/guides">View all guides</Link>
          </header>

          {guides.length === 0 ? (
            <p>No guides have been published yet. Please check back soon.</p>
          ) : (
            <ul className="guide-list">
              {guides.map((guide) => {
                const image = getGuideCardImage(guide.slug);
                return (
                  <li className="guide-card" key={guide.id}>
                    <article>
                      {image && (
                        <Link aria-hidden="true" className="guide-card-media" href={`/guides/${guide.slug}`} tabIndex={-1}>
                          <Image
                            alt={image.alt.en}
                            aria-hidden={image.decorative ? "true" : undefined}
                            height={image.height}
                            loading="lazy"
                            sizes="(max-width: 44rem) 100vw, (max-width: 72rem) 50vw, 33vw"
                            src={image.src}
                            width={image.width}
                          />
                        </Link>
                      )}
                      <div className="guide-card-content">
                        <p className="guide-category">{guide.category}</p>
                        <h3><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h3>
                        <p className="guide-summary">
                          {guide.summary ?? "Open the guide for practical local information."}
                        </p>
                        {guide.last_verified_at && (
                          <p className="guide-meta">
                            Last verified <time dateTime={guide.last_verified_at}>{formatDate(guide.last_verified_at)}</time>
                          </p>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
