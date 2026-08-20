import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/app/events/_components/event-card";
import { resolveEventDateSelection, type EventDateFilter } from "@/lib/events/date-filter";
import { eventListingHref } from "@/lib/events/navigation";
import { getPublishedEvents } from "@/lib/events/public-events";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const canonical = getAbsoluteUrl("/events");
const description = "Find events happening today, tomorrow, and this weekend in San Cristóbal de las Casas.";

export const metadata: Metadata = {
  title: "Events in San Cristóbal de las Casas",
  description,
  ...(canonical && { alternates: { canonical } }),
  openGraph: {
    title: "Events in San Cristóbal de las Casas",
    description,
    ...(canonical && { url: canonical }),
  },
};

type SearchParams = {
  view?: string | string[];
  date?: string | string[];
};

type Props = {
  searchParams: Promise<SearchParams>;
};

const quickFilters: { filter: Exclude<EventDateFilter, "date">; label: string; href: string }[] = [
  { filter: "upcoming", label: "All upcoming", href: "/events" },
  { filter: "today", label: "Today", href: "/events?view=today" },
  { filter: "tomorrow", label: "Tomorrow", href: "/events?view=tomorrow" },
  { filter: "weekend", label: "This weekend", href: "/events?view=weekend" },
];

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function EventsPage({ searchParams }: Props) {
  const params = await searchParams;
  const selection = resolveEventDateSelection(singleValue(params.view), singleValue(params.date));
  const events = await getPublishedEvents(selection);
  const listingHref = eventListingHref(selection);

  return (
    <section className="events-index">
      <header className="page-heading events-heading">
        <p className="eyebrow">What&apos;s happening</p>
        <h1>Events in San Cristóbal</h1>
        <p className="lede">
          Make a plan with a clear view of what&apos;s happening today, tomorrow,
          and over the weekend.
        </p>
      </header>

      <nav className="event-filters" aria-label="Filter events by date">
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

      <form className="event-date-form" action="/events" method="get">
        <label htmlFor="event-date">Choose a date</label>
        <div>
          <input id="event-date" name="date" type="date" defaultValue={selection.dateInput} />
          <button type="submit">Show events</button>
        </div>
      </form>

      <section className="event-results" aria-labelledby="event-results-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Browse by date</p>
            <h2 id="event-results-heading">{selection.label}</h2>
          </div>
          <p className="event-count">{events.length} {events.length === 1 ? "event" : "events"}</p>
        </div>

        {events.length === 0 ? (
          <div className="events-empty">
            <h3>No published events for this date yet</h3>
            <p>Try another date or browse everything that is coming up.</p>
            <Link href="/events?view=upcoming">View all upcoming events</Link>
          </div>
        ) : (
          <ul className="event-list">
            {events.map((event) => (
              <EventCard event={event} key={event.id} listingHref={listingHref} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
