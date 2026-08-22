import type { MetadataRoute } from "next";
import { getPublishedEventsForSitemap } from "@/lib/events/public-events";
import { getPublishedGuides } from "@/lib/guides";
import { eventSitemapPaths, guidePath } from "@/lib/locales";
import { getPublishedPlaces } from "@/lib/places/public-places";
import { placeSitemapPaths } from "@/lib/places/presentation";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homeUrl = getAbsoluteUrl("/");
  const spanishHomeUrl = getAbsoluteUrl("/es");
  const eventsUrl = getAbsoluteUrl("/events");
  const spanishEventsUrl = getAbsoluteUrl("/es/eventos");
  const taxiUrl = getAbsoluteUrl("/taxi");
  const spanishTaxiUrl = getAbsoluteUrl("/es/taxi");
  const guidesUrl = getAbsoluteUrl("/guides");
  const spanishGuidesUrl = getAbsoluteUrl("/es/guias");
  const contributeUrl = getAbsoluteUrl("/contribute");
  const spanishContributeUrl = getAbsoluteUrl("/es/participa");
  if (
    !homeUrl
    || !spanishHomeUrl
    || !eventsUrl
    || !spanishEventsUrl
    || !taxiUrl
    || !spanishTaxiUrl
    || !guidesUrl
    || !spanishGuidesUrl
    || !contributeUrl
    || !spanishContributeUrl
  ) return [];

  const [events, englishGuides, spanishGuides, places] = await Promise.all([
    getPublishedEventsForSitemap(),
    getPublishedGuides("en"),
    getPublishedGuides("es"),
    getPublishedPlaces(),
  ]);
  const spanishGuidesByFamily = new Map(
    spanishGuides.map((guide) => [guide.translation_group_id, guide]),
  );

  return [
    {
      url: homeUrl,
      alternates: { languages: { en: homeUrl, es: spanishHomeUrl, "x-default": homeUrl } },
    },
    {
      url: spanishHomeUrl,
      alternates: { languages: { en: homeUrl, es: spanishHomeUrl, "x-default": homeUrl } },
    },
    {
      url: eventsUrl,
      alternates: { languages: { en: eventsUrl, es: spanishEventsUrl, "x-default": eventsUrl } },
    },
    {
      url: spanishEventsUrl,
      alternates: { languages: { en: eventsUrl, es: spanishEventsUrl, "x-default": eventsUrl } },
    },
    {
      url: taxiUrl,
      alternates: { languages: { en: taxiUrl, es: spanishTaxiUrl, "x-default": taxiUrl } },
    },
    {
      url: spanishTaxiUrl,
      alternates: { languages: { en: taxiUrl, es: spanishTaxiUrl, "x-default": taxiUrl } },
    },
    {
      url: guidesUrl,
      alternates: { languages: { en: guidesUrl, es: spanishGuidesUrl, "x-default": guidesUrl } },
    },
    {
      url: spanishGuidesUrl,
      alternates: { languages: { en: guidesUrl, es: spanishGuidesUrl, "x-default": guidesUrl } },
    },
    {
      url: contributeUrl,
      alternates: { languages: { en: contributeUrl, es: spanishContributeUrl, "x-default": contributeUrl } },
    },
    {
      url: spanishContributeUrl,
      alternates: { languages: { en: contributeUrl, es: spanishContributeUrl, "x-default": contributeUrl } },
    },
    ...events.flatMap((event) => {
      const paths = eventSitemapPaths(event.slug, event.hasSpanish);
      const englishUrl = getAbsoluteUrl(paths[0]) as string;
      const spanishUrl = paths[1] ? getAbsoluteUrl(paths[1]) as string : null;
      if (!spanishUrl) return [{ url: englishUrl, lastModified: event.updated_at }];

      const alternates = {
        languages: { en: englishUrl, es: spanishUrl, "x-default": englishUrl },
      };
      return [
        { url: englishUrl, lastModified: event.updated_at, alternates },
        { url: spanishUrl, lastModified: event.updated_at, alternates },
      ];
    }),
    ...englishGuides.flatMap((guide) => {
      const spanish = spanishGuidesByFamily.get(guide.translation_group_id);
      const englishUrl = getAbsoluteUrl(guidePath(guide.slug, "en")) as string;
      if (!spanish) return [{ url: englishUrl, lastModified: guide.updated_at }];
      const spanishUrl = getAbsoluteUrl(guidePath(spanish.slug, "es")) as string;
      const alternates = {
        languages: { en: englishUrl, es: spanishUrl, "x-default": englishUrl },
      };
      return [
        { url: englishUrl, lastModified: guide.updated_at, alternates },
        { url: spanishUrl, lastModified: spanish.updated_at, alternates },
      ];
    }),
    ...(places.length > 0 ? [{ url: getAbsoluteUrl("/places") as string }] : []),
    ...placeSitemapPaths(places).map((path, index) => ({
      url: getAbsoluteUrl(path) as string,
      lastModified: places[index].updated_at,
    })),
  ];
}
