import Link from "next/link";
import type { PublicEventListItem } from "@/lib/events/public-events";
import {
  formatEventDate,
  formatEventTimeRange,
  formatEventType,
} from "@/lib/events/presentation";

export function EventCard({ event }: { event: PublicEventListItem }) {
  return (
    <li className="event-card">
      <article>
        <div className="event-card-date">
          <time dateTime={event.starts_at}>{formatEventDate(event.starts_at, true)}</time>
          <span>{formatEventTimeRange(event.starts_at, event.ends_at)}</span>
        </div>
        <div className="event-card-content">
          <p className="event-type">{formatEventType(event.event_type)}</p>
          <h2><Link href={`/events/${event.slug}`}>{event.title}</Link></h2>
          {event.summary && <p className="event-summary">{event.summary}</p>}
          {(event.venue_name || event.address) && (
            <p className="event-venue">
              {[event.venue_name, event.address].filter(Boolean).join(" · ")}
            </p>
          )}
          {event.price_text && <p className="event-price">{event.price_text}</p>}
        </div>
      </article>
    </li>
  );
}
