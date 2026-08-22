import type { PublicEvent } from "@/lib/events/public-events";
import type { EventOccurrence } from "@/lib/events/recurrence";
import { eventPath, type Locale } from "@/lib/locales";

type CalendarEvent = EventOccurrence<PublicEvent>;

function compactDate(value: string): string {
  return value.replaceAll("-", "");
}

function addDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function utcDateTime(value: string): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export function eventCalendarHref(
  slug: string,
  locale: Locale,
  occurrenceDate?: string,
): string {
  const query = new URLSearchParams({ locale });
  if (occurrenceDate) query.set("occurrence", occurrenceDate);
  return `/api/events/${encodeURIComponent(slug)}/calendar?${query.toString()}`;
}

export function buildEventCalendar(
  event: CalendarEvent,
  locale: Locale,
  canonicalUrl: string,
  generatedAt = new Date(),
): { content: string; filename: string } {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SanCrisGo//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(`${event.id}-${event.starts_on}@sancrisgo.com`)}`,
    `DTSTAMP:${utcDateTime(generatedAt.toISOString())}`,
  ];

  if (event.starts_at) {
    lines.push(`DTSTART:${utcDateTime(event.starts_at)}`);
    if (event.ends_at) lines.push(`DTEND:${utcDateTime(event.ends_at)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compactDate(event.starts_on)}`);
    lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(event.ends_on ?? event.starts_on, 1))}`);
  }

  const location = [event.venue_name ?? event.place?.name, event.address]
    .filter(Boolean)
    .join(", ");
  const description = event.summary ?? event.description;

  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
  if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  lines.push(`URL:${escapeIcsText(canonicalUrl)}`);
  lines.push("END:VEVENT", "END:VCALENDAR", "");

  return {
    content: lines.join("\r\n"),
    filename: `${event.slug}-${event.starts_on}-${locale}.ics`,
  };
}

export function eventCanonicalPath(event: Pick<PublicEvent, "slug">, locale: Locale): string {
  return eventPath(event.slug, locale);
}
