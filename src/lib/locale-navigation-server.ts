import "server-only";
import { getPublishedEvent } from "@/lib/events/public-events";
import { eventLocalizedPaths, type LocalizedPaths } from "@/lib/locales";
import { knownLocalizedPaths } from "@/lib/locale-navigation";

export async function resolveLocalizedPaths(
  pathname: string,
): Promise<LocalizedPaths | null> {
  const knownPaths = knownLocalizedPaths(pathname);
  if (knownPaths !== undefined) return knownPaths;

  const encodedSlug = pathname.slice("/events/".length);
  const slug = decodeURIComponent(encodedSlug);
  const spanishEvent = await getPublishedEvent(slug, "es");
  return spanishEvent ? eventLocalizedPaths(slug) : null;
}
