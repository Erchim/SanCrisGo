import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedGuides } from "@/lib/guides";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guides", description: "Guides from SanCrisGo." };

export default async function GuidesPage() {
  const guides = await getPublishedGuides();
  return (
    <section>
      <h1>Guides</h1>
      {guides.length === 0 ? (
        <p>No guides have been published yet. Please check back soon.</p>
      ) : (
        <ul className="guide-list">
          {guides.map((guide) => (
            <li className="guide-card" key={guide.id}>
              <article>
                <h2><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h2>
                <p className="guide-meta">{guide.category} · {guide.language}</p>
                {guide.summary && <p>{guide.summary}</p>}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
