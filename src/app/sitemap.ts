import type { MetadataRoute } from "next";
import { getPublishedEventsForSitemap } from "@/lib/events/public-events";
import { getPublishedGuides } from "@/lib/guides";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homeUrl = getAbsoluteUrl("/");
  const eventsUrl = getAbsoluteUrl("/events");
  const guidesUrl = getAbsoluteUrl("/guides");
  if (!homeUrl || !eventsUrl || !guidesUrl) return [];

  const [events, guides] = await Promise.all([
    getPublishedEventsForSitemap(),
    getPublishedGuides(),
  ]);

  return [
    { url: homeUrl },
    { url: eventsUrl },
    { url: guidesUrl },
    ...events.map((event) => ({
      url: getAbsoluteUrl(`/events/${event.slug}`) as string,
      lastModified: event.updated_at,
    })),
    ...guides.map((guide) => ({
      url: getAbsoluteUrl(`/guides/${guide.slug}`) as string,
      lastModified: guide.updated_at,
    })),
  ];
}
