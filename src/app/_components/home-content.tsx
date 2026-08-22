import Link from "next/link";
import Image from "next/image";
import { GuideCard } from "@/app/_components/guide-card";
import { EventCard } from "@/app/events/_components/event-card";
import { getUpcomingPublishedEvents } from "@/lib/events/public-events";
import { getLatestPublishedGuides } from "@/lib/guides";
import { contributePath, eventsPath, guidesPath, taxiPath, type Locale } from "@/lib/locales";
import { getAbsoluteUrl } from "@/lib/site-url";
import { homeHeroImage } from "@/lib/site-images";

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
    guideEyebrow: "Plan with current information",
    latestGuides: "Latest guides",
    viewGuides: "View all guides",
    noGuides: "No guides have been published yet. Please check back soon.",
    contributePrompt: "Know something SanCrisGo should include?",
    contributeLink: "Contribute",
  },
  es: {
    heroEyebrow: "San Cristóbal, más fácil",
    title: "Guías, eventos y ayuda práctica en San Cristóbal",
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
    guideEyebrow: "Planea con información actual",
    latestGuides: "Guías recientes",
    viewGuides: "Ver todas las guías",
    noGuides: "Todavía no hay guías publicadas. Vuelve pronto.",
    contributePrompt: "¿Conoces algo que SanCrisGo debería incluir?",
    contributeLink: "Participa",
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
    getLatestPublishedGuides(locale),
    getUpcomingPublishedEvents(3, locale),
  ]);
  const text = copy[locale];
  const eventsHref = eventsPath(locale);
  const guidesHref = guidesPath(locale);
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
                <li>
                  <Link className="home-quick-tile" href={guidesHref}>
                    <span className="home-quick-label">{text.guides}</span>
                    <span>{text.guidesPurpose}</span>
                    <span aria-hidden="true" className="home-quick-arrow">→</span>
                  </Link>
                </li>
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

      <section className="latest-guides" aria-labelledby={`latest-guides-heading-${locale}`}>
          <header className="section-heading">
            <div>
              <p className="eyebrow">{text.guideEyebrow}</p>
              <h2 id={`latest-guides-heading-${locale}`}>{text.latestGuides}</h2>
            </div>
            <Link className="all-guides-link" href={guidesHref}>{text.viewGuides}</Link>
          </header>

          {guides.length === 0 ? (
            <p>{text.noGuides}</p>
          ) : (
            <ul className="guide-list">
              {guides.map((guide) => (
                <GuideCard guide={guide} headingLevel="h3" key={guide.id} locale={locale} />
              ))}
            </ul>
          )}
      </section>

      <aside className="home-contribution-prompt">
        <p>{text.contributePrompt}</p>
        <Link href={contributePath(locale)}>{text.contributeLink} →</Link>
      </aside>
    </div>
  );
}
