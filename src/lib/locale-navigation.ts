import {
  eventLocalizedPaths,
  eventSlugFromPathname,
  eventsPath,
  homePath,
  localeFromPathname,
  staticLocalizedPaths,
  taxiPath,
  type Locale,
  type LocalizedPaths,
} from "@/lib/locales";

export type PublicNavigationState = {
  locale: Locale;
  homeHref: string;
  eventsHref: string;
  taxiHref: string;
};

export function publicNavigationState(pathname: string): PublicNavigationState {
  const locale = localeFromPathname(pathname);
  return {
    locale,
    homeHref: homePath(locale),
    eventsHref: eventsPath(locale),
    taxiHref: taxiPath(locale),
  };
}

/**
 * Returns undefined only when an English Event detail needs a server lookup to
 * determine whether a real Spanish counterpart exists.
 */
export function knownLocalizedPaths(
  pathname: string,
): LocalizedPaths | null | undefined {
  const staticPaths = staticLocalizedPaths(pathname);
  if (staticPaths) return staticPaths;

  const locale = localeFromPathname(pathname);
  const slug = eventSlugFromPathname(pathname, locale);
  if (!slug) return null;
  if (locale === "es") return eventLocalizedPaths(slug);

  return undefined;
}
