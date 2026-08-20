import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getPublishedGuide } from "@/lib/guides";
import { formatDate } from "@/lib/format-date";
import { getGuideCardImage } from "@/lib/site-images";
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
  const image = getGuideCardImage(guide.slug);
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
      ...(image && !image.decorative && { images: [{ url: image.src, alt: image.alt.en }] }),
    },
  };
}

function guideBreadcrumbJsonLd(guide: Awaited<ReturnType<typeof getPublishedGuide>>) {
  if (!guide) return null;
  const homeUrl = getAbsoluteUrl("/");
  const guidesUrl = getAbsoluteUrl("/guides");
  const guideUrl = getAbsoluteUrl(`/guides/${guide.slug}`);
  if (!homeUrl || !guidesUrl || !guideUrl) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
      { "@type": "ListItem", position: 2, name: "Guides", item: guidesUrl },
      { "@type": "ListItem", position: 3, name: guide.title, item: guideUrl },
    ],
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getPublishedGuide(slug);
  if (!guide) notFound();
  const image = getGuideCardImage(guide.slug);
  const breadcrumb = guideBreadcrumbJsonLd(guide);
  const breadcrumbJsonLd = breadcrumb
    ? JSON.stringify(breadcrumb).replace(/</g, "\\u003c")
    : null;
  return (
    <article className="guide-article">
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      )}
      <nav className="content-breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/guides">Guides</Link></li>
          <li aria-current="page">{guide.title}</li>
        </ol>
      </nav>
      <header className={`article-header${image ? " article-header-with-image" : ""}`}>
        <div className="article-header-copy">
          <p className="guide-category">{guide.category}</p>
          <h1>{guide.title}</h1>
          {guide.summary && <p className="lede">{guide.summary}</p>}
          <div className="article-dates">
            <p>Published <time dateTime={guide.published_at}>{formatDate(guide.published_at)}</time></p>
            {guide.last_verified_at && (
              <p>Last verified <time dateTime={guide.last_verified_at}>{formatDate(guide.last_verified_at)}</time></p>
            )}
          </div>
        </div>
        {image && (
          <figure className={`guide-article-visual${image.decorative ? " is-decorative" : ""}`}>
            <Image
              alt={image.alt.en}
              aria-hidden={image.decorative ? "true" : undefined}
              height={image.height}
              priority
              sizes="(max-width: 48rem) 100vw, 24rem"
              src={image.src}
              width={image.width}
            />
            {!image.decorative && guide.slug.includes("airport") && (
              <figcaption>Ángel Albino Corzo International Airport · airside facade</figcaption>
            )}
          </figure>
        )}
      </header>
      <div className="markdown"><ReactMarkdown>{withoutLeadingTitle(guide.body_markdown)}</ReactMarkdown></div>
    </article>
  );
}
