import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import { getLatestPublishedGuides } from "@/lib/guides";
import { getAbsoluteUrl } from "@/lib/site-url";
import {
  getGuideCardImage,
  homeHeroImage,
} from "@/lib/site-images";

export const dynamic = "force-dynamic";

const canonical = getAbsoluteUrl("/");

export const metadata: Metadata = {
  ...(canonical && { alternates: { canonical } }),
  openGraph: {
    title: "SanCrisGo",
    description: "Practical local guides and events in San Cristóbal de las Casas, Chiapas.",
    ...(canonical && { url: canonical }),
  },
};

function websiteJsonLd() {
  if (!canonical) return null;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SanCrisGo",
    alternateName: "San Cris Go",
    url: canonical,
  };
}

export default async function Home() {
  const guides = await getLatestPublishedGuides();
  const website = websiteJsonLd();
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
          <p className="eyebrow">San Cristóbal, made easier</p>
          <h1>Local guides, events and practical help in San Cristóbal</h1>
          <p className="lede">
            Practical, locally focused information for finding your way, planning
            the day, and seeing what is happening around the city.
          </p>
          <section className="home-quick-access" aria-labelledby="quick-access-heading">
            <header>
              <h2 id="quick-access-heading">Find what you need</h2>
            </header>
            <nav aria-label="Quick access">
              <ul className="home-quick-grid">
                <li>
                  <Link className="home-quick-tile home-quick-tile-primary" href="/events">
                    <span className="home-quick-label">Events</span>
                    <span>See what&apos;s happening in San Cristóbal.</span>
                    <span aria-hidden="true" className="home-quick-arrow">→</span>
                  </Link>
                </li>
                <li>
                  <Link className="home-quick-tile home-quick-tile-primary" href="/taxi">
                    <span className="home-quick-label">Taxi</span>
                    <span>Contact a local driver on WhatsApp.</span>
                    <span aria-hidden="true" className="home-quick-arrow">→</span>
                  </Link>
                </li>
                <li>
                  <Link className="home-quick-tile" href="/guides">
                    <span className="home-quick-label">Guides</span>
                    <span>Practical local information for your stay.</span>
                    <span aria-hidden="true" className="home-quick-arrow">→</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </section>
        </div>
        <figure className="home-hero-visual">
          <Image
            alt={homeHeroImage.alt.en}
            height={homeHeroImage.height}
            priority
            sizes="(max-width: 48rem) 100vw, 48vw"
            src={homeHeroImage.src}
            width={homeHeroImage.width}
          />
          <figcaption>
            Photo: Adam Jones · <a href="https://creativecommons.org/licenses/by/2.0">CC BY 2.0</a>
          </figcaption>
        </figure>
      </section>

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
    </div>
  );
}
