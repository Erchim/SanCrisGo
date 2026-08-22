import type { Metadata } from "next";
import type { GuidePageData } from "@/lib/guides";
import { guidePath, type Locale } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getGuideCardImage } from "@/lib/site-images";
import { getAbsoluteUrl } from "@/lib/site-url";

export function withoutLeadingGuideTitle(markdown: string): string {
  return markdown.replace(/^(?:\uFEFF)?(?:[ \t]*\r?\n)* {0,3}#(?!#)[ \t]+[^\r\n]*(?:\r?\n|$)/, "");
}

export function buildGuideMetadata(
  pageData: GuidePageData,
  locale: Locale,
): Metadata {
  const { guide, localizedPaths } = pageData;
  const title = guide.seo_title ?? guide.title;
  const description = guide.seo_description ?? guide.summary ?? undefined;
  const canonical = getAbsoluteUrl(guidePath(guide.slug, locale));
  const image = getGuideCardImage(guide.slug);
  const alternates = localizedPaths
    ? localizedAlternates(locale, localizedPaths)
    : canonical ? { canonical } : undefined;

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "article",
      title,
      description,
      locale: locale === "es" ? "es_MX" : "en_US",
      ...(localizedPaths && { alternateLocale: [locale === "es" ? "en_US" : "es_MX"] }),
      publishedTime: guide.published_at,
      modifiedTime: guide.updated_at,
      ...(canonical && { url: canonical }),
      ...(image && !image.decorative && { images: [{ url: image.src, alt: image.alt[locale] }] }),
    },
  };
}

export function guideBreadcrumbJsonLd(
  pageData: GuidePageData,
  locale: Locale,
) {
  const { guide } = pageData;
  const homeUrl = getAbsoluteUrl(locale === "es" ? "/es" : "/");
  const guidesUrl = getAbsoluteUrl(locale === "es" ? "/es/guias" : "/guides");
  const guideUrl = getAbsoluteUrl(guidePath(guide.slug, locale));
  if (!homeUrl || !guidesUrl || !guideUrl) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "es" ? "Inicio" : "Home", item: homeUrl },
      { "@type": "ListItem", position: 2, name: locale === "es" ? "Guías" : "Guides", item: guidesUrl },
      { "@type": "ListItem", position: 3, name: guide.title, item: guideUrl },
    ],
  };
}
