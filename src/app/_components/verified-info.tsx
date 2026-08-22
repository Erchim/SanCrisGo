import type { Locale } from "@/lib/locales";

const formatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }),
  es: new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }),
};

export function formatVerifiedDate(value: string, locale: Locale): string {
  return formatters[locale].format(new Date(value));
}

export function VerifiedInfo({
  lastVerifiedAt,
  locale,
  sourceUrl,
}: {
  lastVerifiedAt: string;
  locale: Locale;
  sourceUrl?: string | null;
}) {
  return (
    <aside className="verified-info" aria-label={locale === "es" ? "Verificación de la información" : "Information verification"}>
      <p>
        {locale === "es" ? "Última verificación" : "Last verified"}: {" "}
        <time dateTime={lastVerifiedAt}>{formatVerifiedDate(lastVerifiedAt, locale)}</time>
      </p>
      {sourceUrl && (
        <a href={sourceUrl} rel="noopener noreferrer">
          {locale === "es" ? "Fuente de la información" : "Information source"} ↗
        </a>
      )}
    </aside>
  );
}
