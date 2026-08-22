import { EVENT_TIME_ZONE, localEventDateTimeToISOString } from "@/lib/events/date-filter";
import type { Locale } from "@/lib/locales";

export type EventRecurrenceFrequency = "none" | "weekly";

export type EventTiming = {
  starts_on: string;
  starts_at: string | null;
  ends_on: string | null;
  ends_at: string | null;
  recurrence_frequency: EventRecurrenceFrequency;
  recurrence_until: string | null;
};

export type EventOccurrence<T extends EventTiming> = T & {
  series_starts_on: string;
};

type OccurrenceWindow = {
  start: string;
  end?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: EVENT_TIME_ZONE,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

const weekdayFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" }),
  es: new Intl.DateTimeFormat("es-MX", { weekday: "long", timeZone: "UTC" }),
};

function dateNumber(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function isDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() + 1 === month
    && parsed.getUTCDate() === day;
}

function dateFromNumber(value: number): string {
  return new Date(value * 86_400_000).toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  return dateFromNumber(dateNumber(value) + days);
}

function daysBetween(start: string, end: string): number {
  return dateNumber(end) - dateNumber(start);
}

function selectionDate(instant: string): string {
  return dateFormatter.format(new Date(instant));
}

function shiftedTimestamp(timestamp: string | null, date: string): string | null {
  if (!timestamp) return null;
  return localEventDateTimeToISOString(date, timeFormatter.format(new Date(timestamp)));
}

export function occurrenceOn<T extends EventTiming>(
  event: T,
  occurrenceStart: string,
): EventOccurrence<T> {
  const durationDays = event.ends_on ? daysBetween(event.starts_on, event.ends_on) : 0;
  const occurrenceEnd = event.ends_on ? addDays(occurrenceStart, durationDays) : null;

  return {
    ...event,
    series_starts_on: event.starts_on,
    starts_on: occurrenceStart,
    starts_at: shiftedTimestamp(event.starts_at, occurrenceStart),
    ends_on: occurrenceEnd,
    ends_at: shiftedTimestamp(event.ends_at, occurrenceEnd ?? occurrenceStart),
  };
}

function overlapsWindow(
  occurrence: EventTiming,
  windowStart: string,
  windowEnd?: string,
): boolean {
  const occurrenceEnd = occurrence.ends_on ?? occurrence.starts_on;
  return occurrenceEnd >= windowStart
    && (!windowEnd || occurrence.starts_on < windowEnd);
}

function oneTimeOccurrence<T extends EventTiming>(
  event: T,
  windowStart: string,
  windowEnd?: string,
): Array<EventOccurrence<T>> {
  return overlapsWindow(event, windowStart, windowEnd)
    ? [{ ...event, series_starts_on: event.starts_on }]
    : [];
}

function weeklyOccurrences<T extends EventTiming>(
  event: T,
  windowStart: string,
  windowEnd?: string,
): Array<EventOccurrence<T>> {
  const durationDays = event.ends_on ? daysBetween(event.starts_on, event.ends_on) : 0;
  const firstRelevantStart = addDays(windowStart, -Math.max(0, durationDays));
  const offset = Math.max(0, Math.ceil(daysBetween(event.starts_on, firstRelevantStart) / 7));
  const occurrences: Array<EventOccurrence<T>> = [];

  for (let week = offset; ; week += 1) {
    const occurrenceStart = addDays(event.starts_on, week * 7);
    if (event.recurrence_until && occurrenceStart > event.recurrence_until) break;
    if (windowEnd && occurrenceStart >= windowEnd) break;

    const occurrence = occurrenceOn(event, occurrenceStart);
    if (overlapsWindow(occurrence, windowStart, windowEnd)) occurrences.push(occurrence);
    if (!windowEnd && occurrences.length === 1) break;
  }

  return occurrences;
}

export function expandEventOccurrences<T extends EventTiming>(
  events: T[],
  window: OccurrenceWindow,
): Array<EventOccurrence<T>> {
  const windowStart = selectionDate(window.start);
  const windowEnd = window.end ? selectionDate(window.end) : undefined;

  return events.flatMap((event) => (
    event.recurrence_frequency === "weekly"
      ? weeklyOccurrences(event, windowStart, windowEnd)
      : oneTimeOccurrence(event, windowStart, windowEnd)
  ));
}

export function compareEventOccurrences(
  left: Pick<EventTiming, "starts_on" | "starts_at">,
  right: Pick<EventTiming, "starts_on" | "starts_at">,
): number {
  const byDate = left.starts_on.localeCompare(right.starts_on);
  if (byDate !== 0) return byDate;
  if (left.starts_at === right.starts_at) return 0;
  if (!left.starts_at) return 1;
  if (!right.starts_at) return -1;
  return left.starts_at.localeCompare(right.starts_at);
}

export function selectUpcomingOccurrences<T extends EventTiming & { id: string }>(
  events: Array<EventOccurrence<T>>,
  limit?: number,
): Array<EventOccurrence<T>> {
  const seen = new Set<string>();
  const sorted = [...events].sort(compareEventOccurrences);
  const deduplicated = sorted.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
  return limit === undefined ? deduplicated : deduplicated.slice(0, limit);
}

export function isWeeklyOccurrenceDate(event: EventTiming, date: string): boolean {
  if (!isDateInput(date)) return false;
  if (event.recurrence_frequency !== "weekly") return date === event.starts_on;
  const offset = daysBetween(event.starts_on, date);
  return offset >= 0
    && offset % 7 === 0
    && (!event.recurrence_until || date <= event.recurrence_until);
}

export function relevantEventOccurrence<T extends EventTiming>(
  event: T,
  now = new Date(),
  requestedDate?: string,
): EventOccurrence<T> | null {
  if (event.recurrence_frequency !== "weekly") {
    return { ...event, series_starts_on: event.starts_on };
  }

  const today = dateFormatter.format(now);
  if (requestedDate && requestedDate >= today && isWeeklyOccurrenceDate(event, requestedDate)) {
    return occurrenceOn(event, requestedDate);
  }

  return weeklyOccurrences(event, today)[0] ?? null;
}

export function formatWeeklyRecurrence(
  startsOn: string,
  locale: Locale = "en",
): string {
  const weekday = weekdayFormatters[locale].format(new Date(`${startsOn}T12:00:00.000Z`));
  return locale === "es" ? `Todos los ${weekday}` : `Every ${weekday}`;
}
