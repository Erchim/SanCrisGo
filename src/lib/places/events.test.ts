import { describe, expect, it } from "vitest";
import { expandEventOccurrences } from "@/lib/events/recurrence";

describe("Place upcoming Event occurrences", () => {
  it("keeps a Place-linked weekly series attached while expanding its current occurrence", () => {
    const [occurrence] = expandEventOccurrences([{
      id: "event-1",
      place_id: "place-1",
      starts_on: "2026-08-07",
      starts_at: "2026-08-08T00:00:00.000Z",
      ends_on: null,
      ends_at: null,
      recurrence_frequency: "weekly" as const,
      recurrence_until: null,
    }], {
      start: "2026-08-28T06:00:00.000Z",
      end: "2026-08-29T06:00:00.000Z",
    });

    expect(occurrence).toMatchObject({
      id: "event-1",
      place_id: "place-1",
      series_starts_on: "2026-08-07",
      starts_on: "2026-08-28",
    });
  });
});
