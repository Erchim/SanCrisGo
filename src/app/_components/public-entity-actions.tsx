import { ShareButton } from "@/app/_components/share-button";
import { correctionWhatsAppUrl } from "@/lib/contributions";
import type { Locale } from "@/lib/locales";
import { getAbsoluteUrl } from "@/lib/site-url";

const copy = {
  en: {
    correction: "Suggest an update",
    freshness: "Is something outdated? Let us know.",
    calendar: "Add to calendar",
  },
  es: {
    correction: "Sugerir una actualización",
    freshness: "¿Hay algo desactualizado? Avísanos.",
    calendar: "Añadir al calendario",
  },
} as const;

export function PublicEntityActions({
  locale,
  title,
  pathname,
  calendarHref,
}: {
  locale: Locale;
  title: string;
  pathname: string;
  calendarHref?: string;
}) {
  const canonicalUrl = getAbsoluteUrl(pathname);
  if (!canonicalUrl) return null;
  const text = copy[locale];

  return (
    <aside className="public-entity-actions" aria-label={locale === "es" ? "Acciones" : "Actions"}>
      <p>{text.freshness}</p>
      <div>
        <ShareButton locale={locale} title={title} url={canonicalUrl} />
        {calendarHref && <a href={calendarHref}>{text.calendar}</a>}
        <a
          href={correctionWhatsAppUrl(title, canonicalUrl, locale)}
          rel="noopener noreferrer"
        >
          {text.correction} ↗
        </a>
      </div>
    </aside>
  );
}
