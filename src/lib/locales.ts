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

export function guidesPath(locale: Locale): string {
  return locale === "es" ? "/es/guias" : "/guides";
}

export function guidePath(slug: string, locale: Locale): string {
  return `${guidesPath(locale)}/${encodeURIComponent(slug)}`;
}

export function contributePath(locale: Locale): string {
  return locale === "es" ? "/es/participa" : "/contribute";
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
  if (pathname === "/guides" || pathname === "/es/guias") {
    return { en: "/guides", es: "/es/guias" };
  }
  if (pathname === "/contribute" || pathname === "/es/participa") {
    return { en: "/contribute", es: "/es/participa" };
  }
  return null;
}

export function eventLocalizedPaths(slug: string): LocalizedPaths {
  return {
    en: eventPath(slug, "en"),
    es: eventPath(slug, "es"),
  };
}

export function guideLocalizedPaths(
  englishSlug: string,
  spanishSlug: string,
): LocalizedPaths {
  return {
    en: guidePath(englishSlug, "en"),
    es: guidePath(spanishSlug, "es"),
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

export function guideSlugFromPathname(pathname: string, locale: Locale): string | null {
  const prefix = `${guidesPath(locale)}/`;
  if (!pathname.startsWith(prefix)) return null;

  const slug = pathname.slice(prefix.length);
  if (!slug || slug.includes("/")) return null;

  try {
    return decodeURIComponent(slug);
  } catch {
    return null;
  }
}
