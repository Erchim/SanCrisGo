import { describe, expect, it } from "vitest";
import { buildEventCalendar, eventCalendarHref } from "@/lib/events/calendar";
import { occurrenceOn } from "@/lib/events/recurrence";
import type { PublicEvent } from "@/lib/events/public-events";

function event(overrides: Partial<PublicEvent> = {}): PublicEvent {
  return {
    id: "event-1",
    title: "Weekly music",
    slug: "weekly-music",
    event_type: "music",
    summary: "Live music in the city.",
    description: null,
    venue_name: "Casa Uno",
    address: "Centro",
    starts_on: "2026-08-07",
    starts_at: "2026-08-08T00:00:00.000Z",
    ends_on: null,
    ends_at: "2026-08-08T02:00:00.000Z",
    recurrence_frequency: "weekly",
    recurrence_until: null,
    series_starts_on: "2026-08-07",
    price_text: null,
    cover_image_url: null,
    published_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ticket_url: null,
    organizer_name: null,
    organizer_url: null,
    seo_title: null,
    seo_description: null,
    source_url: null,
    contact_phone: null,
    place: null,
    media: [],
    ...overrides,
  };
}

describe("Event calendar downloads", () => {
  it("preserves the selected recurring occurrence without creating a series", () => {
    const occurrence = occurrenceOn(event(), "2026-08-28");
    const calendar = buildEventCalendar(
      occurrence,
      "en",
      "https://www.sancrisgo.com/events/weekly-music",
      new Date("2026-08-20T12:00:00.000Z"),
    );
    expect(calendar.content).toContain("DTSTART:20260829T000000Z");
    expect(calendar.content).toContain("UID:event-1-2026-08-28@sancrisgo.com");
    expect(calendar.content).not.toContain("RRULE");
    expect(calendar.filename).toBe("weekly-music-2026-08-28-en.ics");
  });

  it("represents an Event without a time as an all-day calendar item", () => {
    const occurrence = occurrenceOn(event({
      starts_on: "2026-09-05",
      starts_at: null,
      ends_on: null,
      ends_at: null,
      recurrence_frequency: "none",
      series_starts_on: "2026-09-05",
    }), "2026-09-05");
    const calendar = buildEventCalendar(
      occurrence,
      "es",
      "https://www.sancrisgo.com/es/eventos/weekly-music",
      new Date("2026-09-01T12:00:00.000Z"),
    );
    expect(calendar.content).toContain("DTSTART;VALUE=DATE:20260905");
    expect(calendar.content).toContain("DTEND;VALUE=DATE:20260906");
    expect(calendar.content).not.toContain("T000000Z\r\nSUMMARY");
  });

  it("builds a non-indexable route target with locale and occurrence context", () => {
    expect(eventCalendarHref("weekly music", "es", "2026-08-28"))
      .toBe("/api/events/weekly%20music/calendar?locale=es&occurrence=2026-08-28");
  });
});
