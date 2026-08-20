import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import { getLatestPublishedGuides } from "@/lib/guides";
import { getAbsoluteUrl } from "@/lib/site-url";
import {
  getGuideCardImage,
  highlandMistBackground,
  homeHeroImage,
  stuccoArchesBackground,
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

export default async function Home() {
  const guides = await getLatestPublishedGuides();

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">San Cristóbal, made easier</p>
          <h1>Local guides and events for San Cristóbal de las Casas</h1>
          <p className="lede">
            Practical, locally focused information for finding your way, planning
            the day, and seeing what is happening around the city.
          </p>
          <div className="home-hero-actions">
            <Link className="primary-link" href="/events">See upcoming events</Link>
            <Link className="secondary-link" href="/guides">Explore the guides</Link>
          </div>
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

      <section className="home-paths" aria-labelledby="home-paths-heading">
        <header className="section-heading">
          <div>
            <p className="eyebrow">Choose your next step</p>
            <h2 id="home-paths-heading">Start with what you need today</h2>
          </div>
        </header>
        <div className="home-path-grid">
          <Link className="home-path-card home-path-events" href="/events">
            <Image
              alt={stuccoArchesBackground.alt.en}
              aria-hidden="true"
              fill
              sizes="(max-width: 44rem) 100vw, 50vw"
              src={stuccoArchesBackground.src}
            />
            <span className="home-path-content">
              <span className="eyebrow">Events</span>
              <strong>See what&apos;s happening</strong>
              <span>Browse today, tomorrow, this weekend, or any date.</span>
            </span>
          </Link>
          <Link className="home-path-card home-path-guides" href="/guides">
            <Image
              alt={highlandMistBackground.alt.en}
              aria-hidden="true"
              fill
              sizes="(max-width: 44rem) 100vw, 50vw"
              src={highlandMistBackground.src}
            />
            <span className="home-path-content">
              <span className="eyebrow">Guides</span>
              <strong>Plan with local context</strong>
              <span>Use practical answers built for real decisions in and around the city.</span>
            </span>
          </Link>
        </div>
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
