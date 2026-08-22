import type { Locale } from "@/lib/locales";

const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }),
  es: new Intl.DateTimeFormat("es-MX", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }),
};

export function formatDate(date: string, locale: Locale = "en") {
  return dateFormatters[locale].format(new Date(date));
}
