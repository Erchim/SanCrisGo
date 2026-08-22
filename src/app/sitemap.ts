import type { MetadataRoute } from "next";
import { getPublishedEventsForSitemap } from "@/lib/events/public-events";
import { getPublishedGuides } from "@/lib/guides";
import { eventSitemapPaths } from "@/lib/locales";
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
  if (
    !homeUrl
    || !spanishHomeUrl
    || !eventsUrl
    || !spanishEventsUrl
    || !taxiUrl
    || !spanishTaxiUrl
    || !guidesUrl
  ) return [];

  const [events, guides] = await Promise.all([
    getPublishedEventsForSitemap(),
    getPublishedGuides(),
  ]);

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
    { url: guidesUrl },
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
    ...guides.map((guide) => ({
      url: getAbsoluteUrl(`/guides/${guide.slug}`) as string,
      lastModified: guide.updated_at,
    })),
  ];
}
