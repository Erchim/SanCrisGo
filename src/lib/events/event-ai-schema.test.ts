import { describe, expect, it } from "vitest";
import {
  mergeEventAiPrefills,
  needsAnotherFlyerImage,
  normalizeEventAiPrefill,
  type EventAiPrefill,
} from "./event-ai-schema";

function prefill(overrides: Partial<EventAiPrefill> = {}): EventAiPrefill {
  return {
    title: "Art opening",
    title_es: "Inauguración de arte",
    event_type: "art",
    summary: null,
    summary_es: null,
    description: null,
    description_es: null,
    venue_name: null,
    address: null,
    starts_on: "2026-08-20",
    starts_time: null,
    ends_on: null,
    ends_time: null,
    price_text: null,
    price_text_es: null,
    contact_phone: null,
    ticket_url: null,
    organizer_name: null,
    organizer_url: null,
    source_url: null,
    source_language: "es",
    warnings: [],
    ...overrides,
  };
}

describe("event AI prefill schema", () => {
  it("normalizes whitespace and rejects malformed dates, times, and URLs", () => {
    const result = normalizeEventAiPrefill(prefill({
      title: "  Art opening  ",
      starts_on: "2026-02-30",
      starts_time: "25:00",
      ends_on: "2026-02-28",
      ends_time: "20:00",
      ticket_url: "javascript:alert(1)",
      warnings: [" Check the date ", "Check the date"],
    }));

    expect(result.title).toBe("Art opening");
    expect(result.starts_on).toBeNull();
    expect(result.starts_time).toBeNull();
    expect(result.ends_on).toBe("2026-02-28");
    expect(result.ends_time).toBeNull();
    expect(result.ticket_url).toBeNull();
    expect(result.warnings).toEqual(["Check the date"]);
  });

  it("fills only missing fields from a second image", () => {
    const merged = mergeEventAiPrefills(
      prefill({ title: null, starts_on: null, venue_name: "Original venue" }),
      prefill({ title: "Recovered title", venue_name: "Different venue" }),
    );

    expect(merged.title).toBe("Recovered title");
    expect(merged.starts_on).toBe("2026-08-20");
    expect(merged.venue_name).toBe("Original venue");
    expect(needsAnotherFlyerImage(merged)).toBe(false);
  });
});
