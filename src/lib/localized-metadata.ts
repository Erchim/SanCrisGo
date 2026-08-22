import "server-only";
import type { Metadata } from "next";
import type { Locale, LocalizedPaths } from "@/lib/locales";
import { getAbsoluteUrl } from "@/lib/site-url";

export function localizedAlternates(
  locale: Locale,
  paths: LocalizedPaths,
): Metadata["alternates"] {
  const english = getAbsoluteUrl(paths.en);
  const spanish = getAbsoluteUrl(paths.es);
  const canonical = getAbsoluteUrl(paths[locale]);

  if (!canonical) return undefined;

  return {
    canonical,
    ...(english && spanish && {
      languages: {
        en: english,
        es: spanish,
        "x-default": english,
      },
    }),
  };
}
