import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getPublishedGuide } from "@/lib/guides";
import { formatDate } from "@/lib/format-date";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublishedGuide(slug);
  if (!guide) return { title: "Guide not found" };
  return { title: guide.seo_title ?? guide.title, description: guide.seo_description ?? guide.summary ?? undefined };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getPublishedGuide(slug);
  if (!guide) notFound();
  return (
    <article className="guide-article">
      <header className="article-header">
        <p className="guide-category">{guide.category}</p>
        <h1>{guide.title}</h1>
        {guide.summary && <p className="lede">{guide.summary}</p>}
        <div className="article-dates">
          <p>Published <time dateTime={guide.published_at}>{formatDate(guide.published_at)}</time></p>
          {guide.last_verified_at && (
            <p>Last verified <time dateTime={guide.last_verified_at}>{formatDate(guide.last_verified_at)}</time></p>
          )}
        </div>
      </header>
      <div className="markdown"><ReactMarkdown>{guide.body_markdown}</ReactMarkdown></div>
    </article>
  );
}
