import { describe, expect, it } from "vitest";
import { resolveEventDateSelection } from "./date-filter";
import {
  compareEventOccurrences,
  expandEventOccurrences,
  isWeeklyOccurrenceDate,
  relevantEventOccurrence,
  selectUpcomingOccurrences,
  type EventTiming,
} from "./recurrence";

type TestEvent = EventTiming & { id: string; title: string };

function event(overrides: Partial<TestEvent> = {}): TestEvent {
  return {
    id: "weekly-class",
    title: "Weekly class",
    starts_on: "2026-08-04",
    starts_at: "2026-08-05T00:00:00.000Z",
    ends_on: "2026-08-04",
    ends_at: "2026-08-05T01:30:00.000Z",
    recurrence_frequency: "weekly",
    recurrence_until: null,
    ...overrides,
  };
}

function occurrencesFor(
  selection: ReturnType<typeof resolveEventDateSelection>,
  events = [event()],
) {
  return expandEventOccurrences(events, selection);
}

describe("weekly Event occurrences", () => {
  it("leaves a one-time Event on its stored date", () => {
    const oneTime = event({
      recurrence_frequency: "none",
      recurrence_until: null,
      starts_on: "2026-08-20",
      ends_on: null,
      starts_at: null,
      ends_at: null,
    });
    const selection = resolveEventDateSelection("today", undefined, new Date("2026-08-20T15:00:00Z"));

    expect(occurrencesFor(selection, [oneTime])).toMatchObject([{
      id: oneTime.id,
      starts_on: "2026-08-20",
      starts_at: null,
      series_starts_on: "2026-08-20",
    }]);
  });

  it("generates a weekly occurrence and shifts its local timestamps", () => {
    const selection = resolveEventDateSelection(undefined, "2026-08-25");

    expect(occurrencesFor(selection)).toMatchObject([{
      starts_on: "2026-08-25",
      starts_at: "2026-08-26T00:00:00.000Z",
      ends_on: "2026-08-25",
      ends_at: "2026-08-26T01:30:00.000Z",
      series_starts_on: "2026-08-04",
    }]);
  });

  it("participates in Today and Tomorrow using the requested local window", () => {
    const now = new Date("2026-08-24T15:00:00.000Z");

    expect(occurrencesFor(resolveEventDateSelection("today", undefined, now))).toEqual([]);
    expect(occurrencesFor(resolveEventDateSelection("tomorrow", undefined, now))[0]?.starts_on)
      .toBe("2026-08-25");
  });

  it("participates in the weekend filter", () => {
    const fridaySeries = event({ starts_on: "2026-08-07", ends_on: "2026-08-07" });
    const saturdaySeries = event({ id: "saturday", starts_on: "2026-08-08", ends_on: "2026-08-08" });
    const now = new Date("2026-08-20T15:00:00.000Z");
    const selection = resolveEventDateSelection("weekend", undefined, now);

    expect(occurrencesFor(selection, [fridaySeries, saturdaySeries]).map((item) => item.id))
      .toEqual(["saturday"]);
  });

  it("honors the recurrence start boundary", () => {
    const selection = resolveEventDateSelection(undefined, "2026-07-28");
    expect(occurrencesFor(selection)).toEqual([]);
    expect(isWeeklyOccurrenceDate(event(), "2026-08-04")).toBe(true);
  });

  it("includes the recurrence end boundary and excludes later weeks", () => {
    const bounded = event({ recurrence_until: "2026-08-25" });

    expect(occurrencesFor(resolveEventDateSelection(undefined, "2026-08-25"), [bounded]))
      .toHaveLength(1);
    expect(occurrencesFor(resolveEventDateSelection(undefined, "2026-09-01"), [bounded]))
      .toEqual([]);
  });

  it("finds the next occurrence when no end date is known", () => {
    const next = relevantEventOccurrence(event(), new Date("2027-01-01T15:00:00.000Z"));
    expect(next?.starts_on).toBe("2027-01-05");
  });

  it("orders weekly and one-time occurrences chronologically", () => {
    const selection = resolveEventDateSelection(undefined, "2026-08-25");
    const weekly = occurrencesFor(selection)[0];
    const oneTime = occurrencesFor(selection, [event({
      id: "one-time",
      recurrence_frequency: "none",
      starts_on: "2026-08-25",
      starts_at: "2026-08-25T21:00:00.000Z",
      ends_on: null,
      ends_at: null,
    })])[0];

    expect([weekly, oneTime].sort(compareEventOccurrences).map((item) => item.id))
      .toEqual(["one-time", "weekly-class"]);
  });

  it("deduplicates a recurring series in compact upcoming results", () => {
    const series = event();
    const occurrences = ["2026-08-25", "2026-09-01", "2026-09-08"]
      .flatMap((date) => occurrencesFor(resolveEventDateSelection(undefined, date), [series]));
    const oneTime = occurrencesFor(resolveEventDateSelection(undefined, "2026-08-26"), [event({
      id: "one-time",
      recurrence_frequency: "none",
      starts_on: "2026-08-26",
      starts_at: null,
      ends_on: null,
      ends_at: null,
    })]);

    expect(selectUpcomingOccurrences([...occurrences, ...oneTime], 3).map((item) => item.id))
      .toEqual(["weekly-class", "one-time"]);
  });

  it("ignores an old occurrence request on a canonical series page", () => {
    expect(relevantEventOccurrence(
      event(),
      new Date("2026-08-24T15:00:00.000Z"),
      "2026-08-18",
    )?.starts_on).toBe("2026-08-25");
  });
});
