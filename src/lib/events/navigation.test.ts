import { describe, expect, it } from "vitest";
import { eventDetailHref, eventListingHref, eventReturnHref } from "./navigation";

describe("event navigation", () => {
  it("uses a clean canonical URL for every list selection", () => {
    expect(eventListingHref({
      filter: "upcoming",
      label: "All upcoming events",
      start: "2026-08-20T12:00:00.000Z",
    })).toBe("/events");
    expect(eventListingHref({
      filter: "today",
      label: "Today",
      start: "2026-08-20T06:00:00.000Z",
      end: "2026-08-21T06:00:00.000Z",
    })).toBe("/events?view=today");
    expect(eventListingHref({
      filter: "date",
      label: "Friday, August 21",
      start: "2026-08-21T06:00:00.000Z",
      end: "2026-08-22T06:00:00.000Z",
      dateInput: "2026-08-21",
    })).toBe("/events?date=2026-08-21");
  });

  it("links details back to the same filtered card", () => {
    expect(eventDetailHref("live-music", "/events?view=weekend"))
      .toBe("/events/live-music?from=%2Fevents%3Fview%3Dweekend%23event-live-music");
  });

  it("accepts only safe event-list return URLs", () => {
    expect(eventReturnHref("/events?view=tomorrow#event-live-music"))
      .toBe("/events?view=tomorrow#event-live-music");
    expect(eventReturnHref("/events?date=2026-08-21#event-market"))
      .toBe("/events?date=2026-08-21#event-market");
    expect(eventReturnHref("https://example.com/events"))
      .toBe("/events");
    expect(eventReturnHref("/events?date=2026-02-30"))
      .toBe("/events");
    expect(eventReturnHref("/events?view=tomorrow&extra=1"))
      .toBe("/events");
  });
});
