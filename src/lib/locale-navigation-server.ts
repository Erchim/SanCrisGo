import "server-only";
import { getPublishedEvent } from "@/lib/events/public-events";
import { getPublishedGuidePageData } from "@/lib/guides";
import {
  eventLocalizedPaths,
  eventSlugFromPathname,
  guideSlugFromPathname,
  localeFromPathname,
  type LocalizedPaths,
} from "@/lib/locales";
import { knownLocalizedPaths } from "@/lib/locale-navigation";

export async function resolveLocalizedPaths(
  pathname: string,
): Promise<LocalizedPaths | null> {
  const knownPaths = knownLocalizedPaths(pathname);
  if (knownPaths !== undefined) return knownPaths;

  const locale = localeFromPathname(pathname);
  const eventSlug = eventSlugFromPathname(pathname, locale);
  if (eventSlug) {
    const spanishEvent = await getPublishedEvent(eventSlug, "es");
    return spanishEvent ? eventLocalizedPaths(eventSlug) : null;
  }

  const guideSlug = guideSlugFromPathname(pathname, locale);
  if (!guideSlug) return null;
  return (await getPublishedGuidePageData(guideSlug, locale))?.localizedPaths ?? null;
}
