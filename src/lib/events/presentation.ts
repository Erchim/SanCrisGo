import { EVENT_TIME_ZONE } from "@/lib/events/date-filter";

const dateFormatter = new Intl.DateTimeFormat("en", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

const shortDateOnlyFormatter = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en", {
  timeZone: EVENT_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const localDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatEventType(eventType: string): string {
  return eventType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatEventDate(startsOn: string, short = false): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(startsOn);
  const formatter = isDateOnly
    ? (short ? shortDateOnlyFormatter : dateOnlyFormatter)
    : (short ? shortDateFormatter : dateFormatter);
  const value = isDateOnly ? `${startsOn}T12:00:00.000Z` : startsOn;
  return formatter.format(new Date(value));
}

export function formatEventTimeRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return "Time to be confirmed";
  const start = new Date(startsAt);
  const startTime = timeFormatter.format(start);
  if (!endsAt) return startTime;

  const end = new Date(endsAt);
  if (localDayFormatter.format(start) === localDayFormatter.format(end)) {
    return `${startTime}–${timeFormatter.format(end)}`;
  }

  return `${startTime} – ${dateFormatter.format(end)}, ${timeFormatter.format(end)}`;
}

export function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
