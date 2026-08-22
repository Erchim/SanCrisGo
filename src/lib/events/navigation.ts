import type { EventDateSelection } from "@/lib/events/date-filter";
import { eventPath, eventsPath, type Locale } from "@/lib/locales";

const EVENT_LIST_ORIGIN = "https://events.sancrisgo.local";
const allowedViews = new Set(["today", "tomorrow", "weekend"]);

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() + 1 === month
    && parsed.getUTCDate() === day;
}

function safeEventAnchor(hash: string): string {
  return /^#event-[a-z0-9_-]+$/i.test(hash) ? hash : "";
}

export function eventListingHref(selection: EventDateSelection, locale: Locale = "en"): string {
  const pathname = eventsPath(locale);
  if (selection.filter === "date" && selection.dateInput) {
    return `${pathname}?date=${encodeURIComponent(selection.dateInput)}`;
  }

  if (selection.filter === "upcoming") return pathname;
  return `${pathname}?view=${selection.filter}`;
}

export function eventDetailHref(
  slug: string,
  listingHref: string,
  locale: Locale = "en",
  occurrenceDate?: string,
): string {
  const returnHref = `${listingHref}#event-${slug}`;
  const query = new URLSearchParams({ from: returnHref });
  if (occurrenceDate && isValidDate(occurrenceDate)) query.set("occurrence", occurrenceDate);
  return `${eventPath(slug, locale)}?${query.toString()}`;
}

export function eventReturnHref(value: string | undefined, locale: Locale = "en"): string {
  const pathname = eventsPath(locale);
  if (!value) return pathname;

  let url: URL;
  try {
    url = new URL(value, EVENT_LIST_ORIGIN);
  } catch {
    return pathname;
  }

  if (url.origin !== EVENT_LIST_ORIGIN || url.pathname !== pathname) return pathname;

  const anchor = safeEventAnchor(url.hash);
  const entries = [...url.searchParams.entries()];
  if (entries.length === 0) return `${pathname}${anchor}`;
  if (entries.length !== 1) return pathname;

  const [[key, parameter]] = entries;
  if (key === "view" && allowedViews.has(parameter)) {
    return `${pathname}?view=${parameter}${anchor}`;
  }
  if (key === "date" && isValidDate(parameter)) {
    return `${pathname}?date=${encodeURIComponent(parameter)}${anchor}`;
  }

  return pathname;
}
