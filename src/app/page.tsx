import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import { getLatestPublishedGuides } from "@/lib/guides";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const canonical = getAbsoluteUrl("/");

export const metadata: Metadata = {
  ...(canonical && { alternates: { canonical } }),
  openGraph: {
    title: "SanCrisGo",
    description: "Practical local guides to San Cristóbal de las Casas, Chiapas.",
    ...(canonical && { url: canonical }),
  },
};

export default async function Home() {
  const guides = await getLatestPublishedGuides();

  return (
    <div className="home">
      <section className="home-hero">
        <p className="eyebrow">Know before you go</p>
        <h1>Practical guides to San Cristóbal de las Casas</h1>
        <p className="lede">
          Find useful, locally focused information to help you navigate the city
          and make confident plans.
        </p>
        <Link className="primary-link" href="/guides">Explore all guides</Link>
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
            {guides.map((guide) => (
              <li className="guide-card" key={guide.id}>
                <article>
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
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
