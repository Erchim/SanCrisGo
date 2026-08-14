import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getPublishedGuide } from "@/lib/guides";
import { formatDate } from "@/lib/format-date";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

function withoutLeadingTitle(markdown: string) {
  return markdown.replace(/^(?:\uFEFF)?(?:[ \t]*\r?\n)* {0,3}#(?!#)[ \t]+[^\r\n]*(?:\r?\n|$)/, "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublishedGuide(slug);
  if (!guide) return { title: "Guide not found" };
  const title = guide.seo_title ?? guide.title;
  const description = guide.seo_description ?? guide.summary ?? undefined;
  const canonical = getAbsoluteUrl(`/guides/${guide.slug}`);
  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: guide.published_at,
      modifiedTime: guide.updated_at,
      ...(canonical && { url: canonical }),
    },
  };
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
      <div className="markdown"><ReactMarkdown>{withoutLeadingTitle(guide.body_markdown)}</ReactMarkdown></div>
    </article>
  );
}
