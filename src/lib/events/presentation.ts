import { EVENT_TIME_ZONE } from "@/lib/events/date-filter";
import { formatWeeklyRecurrence, type EventRecurrenceFrequency } from "@/lib/events/recurrence";
import type { Locale } from "@/lib/locales";

type FormatterSet = {
  date: Intl.DateTimeFormat;
  dateOnly: Intl.DateTimeFormat;
  shortDate: Intl.DateTimeFormat;
  shortDateOnly: Intl.DateTimeFormat;
  cardDate: Intl.DateTimeFormat;
  cardDateOnly: Intl.DateTimeFormat;
  time: Intl.DateTimeFormat;
};

function formatterSet(language: string): FormatterSet {
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const shortOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  const cardOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

  return {
    date: new Intl.DateTimeFormat(language, { ...dateOptions, timeZone: EVENT_TIME_ZONE }),
    dateOnly: new Intl.DateTimeFormat(language, { ...dateOptions, timeZone: "UTC" }),
    shortDate: new Intl.DateTimeFormat(language, { ...shortOptions, timeZone: EVENT_TIME_ZONE }),
    shortDateOnly: new Intl.DateTimeFormat(language, { ...shortOptions, timeZone: "UTC" }),
    cardDate: new Intl.DateTimeFormat(language, { ...cardOptions, timeZone: EVENT_TIME_ZONE }),
    cardDateOnly: new Intl.DateTimeFormat(language, { ...cardOptions, timeZone: "UTC" }),
    time: new Intl.DateTimeFormat(language, {
      timeZone: EVENT_TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

const formatters: Record<Locale, FormatterSet> = {
  en: formatterSet("en"),
  es: formatterSet("es-MX"),
};

const localDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const spanishEventTypes: Record<string, string> = {
  art: "Arte",
  community: "Comunidad",
  dance: "Danza",
  film: "Cine",
  food: "Gastronomía",
  market: "Mercado",
  music: "Música",
  nightlife: "Vida nocturna",
  other: "Otro",
  theater: "Teatro",
  wellness: "Bienestar",
  workshop: "Taller",
};

export function formatEventType(eventType: string, locale: Locale = "en"): string {
  if (locale === "es" && spanishEventTypes[eventType]) return spanishEventTypes[eventType];

  return eventType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatEventDate(
  startsOn: string,
  short = false,
  locale: Locale = "en",
): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(startsOn);
  const set = formatters[locale];
  const formatter = isDateOnly
    ? (short ? set.shortDateOnly : set.dateOnly)
    : (short ? set.shortDate : set.date);
  const value = isDateOnly ? `${startsOn}T12:00:00.000Z` : startsOn;
  return formatter.format(new Date(value));
}

export function formatEventCardDate(startsOn: string, locale: Locale = "en"): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(startsOn);
  const formatter = isDateOnly ? formatters[locale].cardDateOnly : formatters[locale].cardDate;
  const value = isDateOnly ? `${startsOn}T12:00:00.000Z` : startsOn;
  return formatter.format(new Date(value)).toLocaleUpperCase(locale === "es" ? "es-MX" : "en");
}

export function formatEventTimeRange(
  startsAt: string | null,
  endsAt: string | null,
  locale: Locale = "en",
): string {
  if (!startsAt) return locale === "es" ? "Hora por confirmar" : "Time to be confirmed";

  const start = new Date(startsAt);
  const startTime = formatters[locale].time.format(start);
  if (!endsAt) return startTime;

  const end = new Date(endsAt);
  if (localDayFormatter.format(start) === localDayFormatter.format(end)) {
    return `${startTime}–${formatters[locale].time.format(end)}`;
  }

  return `${startTime} – ${formatters[locale].date.format(end)}, ${formatters[locale].time.format(end)}`;
}

export function formatEventRecurrence(
  recurrenceFrequency: EventRecurrenceFrequency,
  startsOn: string,
  locale: Locale = "en",
): string | null {
  return recurrenceFrequency === "weekly"
    ? formatWeeklyRecurrence(startsOn, locale)
    : null;
}

export function formatRecurrenceEnd(
  recurrenceUntil: string,
  locale: Locale = "en",
): string {
  const date = formatEventDate(recurrenceUntil, false, locale);
  return locale === "es" ? `Se repite hasta ${date}` : `Repeats until ${date}`;
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

export function safePhoneHref(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return normalized.replace(/\D/g, "").length >= 7 ? `tel:${normalized}` : null;
}
