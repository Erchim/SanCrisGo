import Link from "next/link";
import type { LocalizedPaths } from "@/lib/locales";
import type { PublicNavigationState } from "@/lib/locale-navigation";

export function SiteHeaderView({
  navigation,
  localizedPaths,
}: {
  navigation: PublicNavigationState;
  localizedPaths: LocalizedPaths | null;
}) {
  const spanish = navigation.locale === "es";

  return (
    <header className="site-header">
      <nav aria-label={spanish ? "Navegación principal" : "Primary navigation"}>
        <Link className="site-name" href={navigation.homeHref}>SanCrisGo</Link>
        <div className="site-header-actions">
          <div className="site-links">
            <Link href={navigation.eventsHref}>{spanish ? "Eventos" : "Events"}</Link>
            <Link href={navigation.taxiHref}>Taxi</Link>
            <Link href={navigation.guidesHref}>{spanish ? "Guías" : "Guides"}</Link>
          </div>
          {localizedPaths && (
            <div
              aria-label={spanish ? "Seleccionar idioma" : "Choose language"}
              className="language-switch"
              role="group"
            >
              {spanish
                ? <Link href={localizedPaths.en} hrefLang="en">EN</Link>
                : <span aria-current="page">EN</span>}
              <span aria-hidden="true">/</span>
              {spanish
                ? <span aria-current="page">ES</span>
                : <Link href={localizedPaths.es} hrefLang="es">ES</Link>}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export function SiteFooterView({ navigation }: { navigation: PublicNavigationState }) {
  const spanish = navigation.locale === "es";

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
          <Link href={navigation.eventsHref}>{spanish ? "Eventos" : "Events"}</Link>
          <Link href={navigation.taxiHref}>Taxi</Link>
          <Link href={navigation.guidesHref}>{spanish ? "Guías" : "Guides"}</Link>
          {!spanish && <Link href="/image-credits">Image credits</Link>}
        </nav>
      </div>
    </footer>
  );
}
