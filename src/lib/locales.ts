export const supportedLocales = ["en", "es"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export type LocalizedPaths = {
  en: string;
  es: string;
};

export function localeFromPathname(pathname: string | null | undefined): Locale {
  return pathname === "/es" || pathname?.startsWith("/es/") ? "es" : "en";
}

export function homePath(locale: Locale): string {
  return locale === "es" ? "/es" : "/";
}

export function eventsPath(locale: Locale): string {
  return locale === "es" ? "/es/eventos" : "/events";
}

export function eventPath(slug: string, locale: Locale): string {
  return `${eventsPath(locale)}/${encodeURIComponent(slug)}`;
}

export function taxiPath(locale: Locale): string {
  return locale === "es" ? "/es/taxi" : "/taxi";
}

export function staticLocalizedPaths(pathname: string): LocalizedPaths | null {
  if (pathname === "/" || pathname === "/es") {
    return { en: "/", es: "/es" };
  }
  if (pathname === "/events" || pathname === "/es/eventos") {
    return { en: "/events", es: "/es/eventos" };
  }
  if (pathname === "/taxi" || pathname === "/es/taxi") {
    return { en: "/taxi", es: "/es/taxi" };
  }
  return null;
}

export function eventLocalizedPaths(slug: string): LocalizedPaths {
  return {
    en: eventPath(slug, "en"),
    es: eventPath(slug, "es"),
  };
}

export function eventSitemapPaths(slug: string, hasSpanish: boolean): string[] {
  const paths = eventLocalizedPaths(slug);
  return hasSpanish ? [paths.en, paths.es] : [paths.en];
}

export function eventSlugFromPathname(pathname: string, locale: Locale): string | null {
  const prefix = locale === "es" ? "/es/eventos/" : "/events/";
  if (!pathname.startsWith(prefix)) return null;

  const slug = pathname.slice(prefix.length);
  if (!slug || slug.includes("/")) return null;

  try {
    return decodeURIComponent(slug);
  } catch {
    return null;
  }
}
