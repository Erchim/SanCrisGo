import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedGuides } from "@/lib/guides";
import { formatDate } from "@/lib/format-date";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guides", description: "Guides from SanCrisGo." };

export default async function GuidesPage() {
  const guides = await getPublishedGuides();
  return (
    <section className="guides-index">
      <header className="page-heading">
        <p className="eyebrow">Explore San Cristóbal</p>
        <h1>Guides</h1>
        <p className="lede">Practical, carefully researched guides for making the most of San Cristóbal de las Casas.</p>
      </header>
      {guides.length === 0 ? (
        <p>No guides have been published yet. Please check back soon.</p>
      ) : (
        <ul className="guide-list">
          {guides.map((guide) => (
            <li className="guide-card" key={guide.id}>
              <article>
                <p className="guide-category">{guide.category}</p>
                <h2><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h2>
                {guide.summary && <p className="guide-summary">{guide.summary}</p>}
                {guide.last_verified_at && (
                  <p className="guide-meta">Last verified <time dateTime={guide.last_verified_at}>{formatDate(guide.last_verified_at)}</time></p>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
