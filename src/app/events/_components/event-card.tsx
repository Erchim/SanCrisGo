import Image from "next/image";
import Link from "next/link";
import type { PublicEventListItem } from "@/lib/events/public-events";
import { eventDetailHref } from "@/lib/events/navigation";
import {
  formatEventCardDate,
  formatEventDate,
  formatEventTimeRange,
  formatEventType,
} from "@/lib/events/presentation";

type Props = {
  event: PublicEventListItem;
  listingHref: string;
  headingLevel?: "h2" | "h3";
};

export function EventCard({ event, listingHref, headingLevel = "h2" }: Props) {
  const detailHref = eventDetailHref(event.slug, listingHref);
  const Heading = headingLevel;

  return (
    <li className="event-card" id={`event-${event.slug}`}>
      <article>
        {event.cover_image_url && (
          <Link className="event-card-media" href={detailHref} tabIndex={-1} aria-hidden="true">
            <Image
              alt=""
              src={event.cover_image_url}
              width={960}
              height={540}
              sizes="(max-width: 44rem) 50vw, (max-width: 72rem) 50vw, 33vw"
            />
          </Link>
        )}
        <div className="event-card-date">
          <time
            aria-label={formatEventDate(event.starts_on, true)}
            dateTime={event.starts_at ?? event.starts_on}
          >
            {formatEventCardDate(event.starts_on)}
          </time>
          <span>{formatEventTimeRange(event.starts_at, event.ends_at)}</span>
        </div>
        <div className="event-card-content">
          <p className="event-type">{formatEventType(event.event_type)}</p>
          <Heading><Link href={detailHref}>{event.title}</Link></Heading>
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
