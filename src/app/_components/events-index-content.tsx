import Link from "next/link";
import { EventCard } from "@/app/events/_components/event-card";
import { resolveEventDateSelection, type EventDateFilter } from "@/lib/events/date-filter";
import { eventListingHref } from "@/lib/events/navigation";
import { getPublishedEvents } from "@/lib/events/public-events";
import { eventsPath, type Locale } from "@/lib/locales";

type SearchParams = {
  view?: string | string[];
  date?: string | string[];
};

const copy = {
  en: {
    eyebrow: "What's happening",
    title: "Events in San Cristóbal",
    lede: "Make a plan with a clear view of what's happening today, tomorrow, and over the weekend.",
    filterLabel: "Filter events by date",
    filters: ["All upcoming", "Today", "Tomorrow", "This weekend"],
    chooseDate: "Choose a date",
    showEvents: "Show events",
    resultsEyebrow: "Browse by date",
    singular: "event",
    plural: "events",
    emptyTitle: "No published events for this date yet",
    emptyText: "Try another date or browse everything that is coming up.",
    allEvents: "View all upcoming events",
  },
  es: {
    eyebrow: "Qué está pasando",
    title: "Eventos en San Cristóbal",
    lede: "Planea tu día con una vista clara de lo que sucede hoy, mañana y durante el fin de semana.",
    filterLabel: "Filtrar eventos por fecha",
    filters: ["Todos los próximos", "Hoy", "Mañana", "Este fin de semana"],
    chooseDate: "Elige una fecha",
    showEvents: "Ver eventos",
    resultsEyebrow: "Explora por fecha",
    singular: "evento",
    plural: "eventos",
    emptyTitle: "Todavía no hay eventos publicados para esta fecha",
    emptyText: "Prueba otra fecha o consulta todos los próximos eventos.",
    allEvents: "Ver todos los próximos eventos",
  },
} as const;

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function EventsIndexContent({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selection = resolveEventDateSelection(
    singleValue(params.view),
    singleValue(params.date),
    new Date(),
    locale,
  );
  const events = await getPublishedEvents(selection, locale);
  const listingHref = eventListingHref(selection, locale);
  const pathname = eventsPath(locale);
  const text = copy[locale];
  const quickFilters: Array<{
    filter: Exclude<EventDateFilter, "date">;
    label: string;
    href: string;
  }> = [
    { filter: "upcoming", label: text.filters[0], href: pathname },
    { filter: "today", label: text.filters[1], href: `${pathname}?view=today` },
    { filter: "tomorrow", label: text.filters[2], href: `${pathname}?view=tomorrow` },
    { filter: "weekend", label: text.filters[3], href: `${pathname}?view=weekend` },
  ];

  return (
    <section className="events-index">
      <header className="page-heading events-heading">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lede">{text.lede}</p>
      </header>

      <nav className="event-filters" aria-label={text.filterLabel}>
        {quickFilters.map((quickFilter) => (
          <Link
            key={quickFilter.filter}
            href={quickFilter.href}
            aria-current={selection.filter === quickFilter.filter ? "page" : undefined}
          >
            {quickFilter.label}
          </Link>
        ))}
      </nav>

      <form className="event-date-form" action={pathname} method="get">
        <label htmlFor={`event-date-${locale}`}>{text.chooseDate}</label>
        <div>
          <input id={`event-date-${locale}`} name="date" type="date" defaultValue={selection.dateInput} />
          <button type="submit">{text.showEvents}</button>
        </div>
      </form>

      <section className="event-results" aria-labelledby={`event-results-heading-${locale}`}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">{text.resultsEyebrow}</p>
            <h2 id={`event-results-heading-${locale}`}>{selection.label}</h2>
          </div>
          <p className="event-count">
            {events.length} {events.length === 1 ? text.singular : text.plural}
          </p>
        </div>

        {events.length === 0 ? (
          <div className="events-empty">
            <h3>{text.emptyTitle}</h3>
            <p>{text.emptyText}</p>
            <Link href={pathname}>{text.allEvents}</Link>
          </div>
        ) : (
          <ul className="event-list">
            {events.map((event) => (
              <EventCard
                event={event}
                key={event.id}
                listingHref={listingHref}
                locale={locale}
              />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
