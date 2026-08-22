import Link from "next/link";
import { getPublishedEvent } from "@/lib/events/public-events";
import {
  eventLocalizedPaths,
  eventSlugFromPathname,
  eventsPath,
  homePath,
  staticLocalizedPaths,
  taxiPath,
  type Locale,
  type LocalizedPaths,
} from "@/lib/locales";

async function localizedPathsForPage(
  pathname: string,
  locale: Locale,
): Promise<LocalizedPaths | null> {
  const staticPaths = staticLocalizedPaths(pathname);
  if (staticPaths) return staticPaths;

  const slug = eventSlugFromPathname(pathname, locale);
  if (!slug) return null;
  if (locale === "es") return eventLocalizedPaths(slug);

  const spanishEvent = await getPublishedEvent(slug, "es");
  return spanishEvent ? eventLocalizedPaths(slug) : null;
}

export async function SiteHeader({ pathname, locale }: { pathname: string; locale: Locale }) {
  const paths = await localizedPathsForPage(pathname, locale);
  const spanish = locale === "es";

  return (
    <header className="site-header">
      <nav aria-label={spanish ? "Navegación principal" : "Primary navigation"}>
        <Link className="site-name" href={homePath(locale)}>SanCrisGo</Link>
        <div className="site-header-actions">
          <div className="site-links">
            <Link href={eventsPath(locale)}>{spanish ? "Eventos" : "Events"}</Link>
            <Link href={taxiPath(locale)}>Taxi</Link>
            {!spanish && <Link href="/guides">Guides</Link>}
          </div>
          {paths && (
            <div
              aria-label={spanish ? "Seleccionar idioma" : "Choose language"}
              className="language-switch"
              role="group"
            >
              {spanish ? <Link href={paths.en} hrefLang="en">EN</Link> : <span aria-current="page">EN</span>}
              <span aria-hidden="true">/</span>
              {spanish ? <span aria-current="page">ES</span> : <Link href={paths.es} hrefLang="es">ES</Link>}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const spanish = locale === "es";

  return (
    <footer className="site-footer">
      <div>
        <p>
          <strong className="footer-name">SanCrisGo</strong>
          <span>
            {spanish
              ? "Información local práctica para San Cristóbal de las Casas."
              : "Practical local information for San Cristóbal de las Casas."}
          </span>
        </p>
        <nav aria-label={spanish ? "Navegación del pie de página" : "Footer navigation"}>
          <Link href={eventsPath(locale)}>{spanish ? "Eventos" : "Events"}</Link>
          <Link href={taxiPath(locale)}>Taxi</Link>
          {!spanish && <Link href="/guides">Guides</Link>}
          {!spanish && <Link href="/image-credits">Image credits</Link>}
        </nav>
      </div>
    </footer>
  );
}
