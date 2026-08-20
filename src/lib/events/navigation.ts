import type { EventDateSelection } from "@/lib/events/date-filter";

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

export function eventListingHref(selection: EventDateSelection): string {
  if (selection.filter === "date" && selection.dateInput) {
    return `/events?date=${encodeURIComponent(selection.dateInput)}`;
  }

  if (selection.filter === "upcoming") return "/events";
  return `/events?view=${selection.filter}`;
}

export function eventDetailHref(slug: string, listingHref: string): string {
  const returnHref = `${listingHref}#event-${slug}`;
  const query = new URLSearchParams({ from: returnHref });
  return `/events/${encodeURIComponent(slug)}?${query.toString()}`;
}

export function eventReturnHref(value: string | undefined): string {
  if (!value) return "/events";

  let url: URL;
  try {
    url = new URL(value, EVENT_LIST_ORIGIN);
  } catch {
    return "/events";
  }

  if (url.origin !== EVENT_LIST_ORIGIN || url.pathname !== "/events") return "/events";

  const anchor = safeEventAnchor(url.hash);
  const entries = [...url.searchParams.entries()];
  if (entries.length === 0) return `/events${anchor}`;
  if (entries.length !== 1) return "/events";

  const [[key, parameter]] = entries;
  if (key === "view" && allowedViews.has(parameter)) {
    return `/events?view=${parameter}${anchor}`;
  }
  if (key === "date" && isValidDate(parameter)) {
    return `/events?date=${encodeURIComponent(parameter)}${anchor}`;
  }

  return "/events";
}
