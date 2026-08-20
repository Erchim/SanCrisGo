import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublishedGuides } from "@/lib/guides";
import { formatDate } from "@/lib/format-date";
import { getGuideCardImage } from "@/lib/site-images";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
const canonical = getAbsoluteUrl("/guides");
export const metadata: Metadata = {
  title: "Guides",
  description: "Practical guides to San Cristóbal de las Casas from SanCrisGo.",
  ...(canonical && { alternates: { canonical } }),
  openGraph: {
    title: "Guides",
    description: "Practical guides to San Cristóbal de las Casas from SanCrisGo.",
    ...(canonical && { url: canonical }),
  },
};

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
                        sizes="(max-width: 44rem) 100vw, (max-width: 72rem) 50vw, 33vw"
                        src={image.src}
                        width={image.width}
                      />
                    </Link>
                  )}
                  <div className="guide-card-content">
                    <p className="guide-category">{guide.category}</p>
                    <h2><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h2>
                    {guide.summary && <p className="guide-summary">{guide.summary}</p>}
                    {guide.last_verified_at && (
                      <p className="guide-meta">Last verified <time dateTime={guide.last_verified_at}>{formatDate(guide.last_verified_at)}</time></p>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
