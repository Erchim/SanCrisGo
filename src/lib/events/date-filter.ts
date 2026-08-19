export const EVENT_TIME_ZONE = "America/Mexico_City";

export type EventDateFilter = "today" | "tomorrow" | "weekend" | "upcoming" | "date";

export type EventDateSelection = {
  filter: EventDateFilter;
  label: string;
  start: string;
  end?: string;
  dateInput?: string;
};

type LocalDate = {
  year: number;
  month: number;
  day: number;
};

const localDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const zonedDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const filterLabelFormatter = new Intl.DateTimeFormat("en", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
});

function numericParts(
  formatter: Intl.DateTimeFormat,
  date: Date,
): Record<Intl.DateTimeFormatPartTypes, number> {
  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<Intl.DateTimeFormatPartTypes, number>;
}

function localDateAt(instant: Date): LocalDate {
  const parts = numericParts(localDateFormatter, instant);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function addLocalDays(date: LocalDate, days: number): LocalDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function timeZoneOffsetAt(instant: Date): number {
  const parts = numericParts(zonedDateTimeFormatter, instant);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return representedAsUtc - instant.getTime();
}

function localDateTimeAsUtc(date: LocalDate, hour = 0, minute = 0): Date {
  const localTimestamp = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
  let utcTimestamp = localTimestamp;

  // A second pass handles an offset change close to the requested local time.
  for (let pass = 0; pass < 2; pass += 1) {
    utcTimestamp = localTimestamp - timeZoneOffsetAt(new Date(utcTimestamp));
  }

  return new Date(utcTimestamp);
}

function localMidnightAsUtc(date: LocalDate): Date {
  return localDateTimeAsUtc(date);
}

function localWeekday(date: LocalDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

function localDateFromInput(value: string | undefined): LocalDate | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() + 1 !== month
    || parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function dateInputValue(date: LocalDate): string {
  return `${date.year.toString().padStart(4, "0")}-${date.month
    .toString()
    .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
}

export function localEventDateTimeToISOString(
  dateInput: string,
  timeInput: string,
): string | null {
  const date = localDateFromInput(dateInput);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeInput);
  if (!date || !timeMatch) return null;

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) return null;

  return localDateTimeAsUtc(date, hour, minute).toISOString();
}

function daySelection(
  filter: Extract<EventDateFilter, "today" | "tomorrow" | "date">,
  date: LocalDate,
  label: string,
): EventDateSelection {
  const start = localMidnightAsUtc(date);
  const end = localMidnightAsUtc(addLocalDays(date, 1));

  return {
    filter,
    label,
    start: start.toISOString(),
    end: end.toISOString(),
    ...(filter === "date" && { dateInput: dateInputValue(date) }),
  };
}

export function resolveEventDateSelection(
  view: string | undefined,
  dateInput: string | undefined,
  now = new Date(),
): EventDateSelection {
  const customDate = localDateFromInput(dateInput);
  if (customDate) {
    const start = localMidnightAsUtc(customDate);
    return daySelection("date", customDate, filterLabelFormatter.format(start));
  }

  const today = localDateAt(now);

  if (view === "upcoming") {
    return {
      filter: "upcoming",
      label: "All upcoming events",
      start: now.toISOString(),
    };
  }

  if (view === "tomorrow") {
    return daySelection("tomorrow", addLocalDays(today, 1), "Tomorrow");
  }

  if (view === "weekend") {
    const weekday = localWeekday(today);
    const daysUntilSaturday = weekday === 0 ? 0 : (6 - weekday + 7) % 7;
    const startDate = addLocalDays(today, daysUntilSaturday);
    const daysInWindow = weekday === 0 ? 1 : 2;

    return {
      filter: "weekend",
      label: "This weekend",
      start: localMidnightAsUtc(startDate).toISOString(),
      end: localMidnightAsUtc(addLocalDays(startDate, daysInWindow)).toISOString(),
    };
  }

  return daySelection("today", today, "Today");
}
