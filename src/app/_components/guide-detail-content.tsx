import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { formatDate } from "@/lib/format-date";
import {
  guideBreadcrumbJsonLd,
  withoutLeadingGuideTitle,
} from "@/lib/guide-presentation";
import { getPublishedGuidePageData } from "@/lib/guides";
import { guidesPath, homePath, type Locale } from "@/lib/locales";
import { getGuideCardImage } from "@/lib/site-images";

const copy = {
  en: {
    breadcrumb: "Breadcrumb",
    home: "Home",
    guides: "Guides",
    published: "Published",
    verified: "Last verified",
    airportCaption: "Ángel Albino Corzo International Airport · airside facade",
  },
  es: {
    breadcrumb: "Migas de pan",
    home: "Inicio",
    guides: "Guías",
    published: "Publicado",
    verified: "Última verificación",
    airportCaption: "Aeropuerto Internacional Ángel Albino Corzo · fachada del lado aire",
  },
} as const;

export async function GuideDetailContent({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const pageData = await getPublishedGuidePageData(slug, locale);
  if (!pageData) notFound();

  const { guide } = pageData;
  const text = copy[locale];
  const image = getGuideCardImage(guide.slug);
  const breadcrumb = guideBreadcrumbJsonLd(pageData, locale);
  const breadcrumbJson = breadcrumb
    ? JSON.stringify(breadcrumb).replace(/</g, "\\u003c")
    : null;

  return (
    <article className="guide-article">
      {breadcrumbJson && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJson }} />
      )}
      <nav className="content-breadcrumbs" aria-label={text.breadcrumb}>
        <ol>
          <li><Link href={homePath(locale)}>{text.home}</Link></li>
          <li><Link href={guidesPath(locale)}>{text.guides}</Link></li>
          <li aria-current="page">{guide.title}</li>
        </ol>
      </nav>
      <header className={`article-header${image ? " article-header-with-image" : ""}`}>
        <div className="article-header-copy">
          <p className="guide-category">{guide.category}</p>
          <h1>{guide.title}</h1>
          {guide.summary && <p className="lede">{guide.summary}</p>}
          <div className="article-dates">
            <p>{text.published} <time dateTime={guide.published_at}>{formatDate(guide.published_at, locale)}</time></p>
            {guide.last_verified_at && (
              <p>{text.verified} <time dateTime={guide.last_verified_at}>{formatDate(guide.last_verified_at, locale)}</time></p>
            )}
          </div>
        </div>
        {image && (
          <figure className={`guide-article-visual${image.decorative ? " is-decorative" : ""}`}>
            <Image
              alt={image.alt[locale]}
              aria-hidden={image.decorative ? "true" : undefined}
              height={image.height}
              priority
              sizes="(max-width: 48rem) 100vw, 24rem"
              src={image.src}
              width={image.width}
            />
            {!image.decorative && (guide.slug.includes("aeropuerto") || guide.slug.includes("airport")) ? (
              <figcaption>{text.airportCaption}</figcaption>
            ) : null}
          </figure>
        )}
      </header>
      <div className="markdown">
        <ReactMarkdown>{withoutLeadingGuideTitle(guide.body_markdown)}</ReactMarkdown>
      </div>
    </article>
  );
}
