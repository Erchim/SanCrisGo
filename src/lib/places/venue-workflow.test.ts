import { describe, expect, it } from "vitest";
import {
  groupVenueEvents,
  normalizeVenueText,
  parseVenueSelection,
  possiblePlaceMatches,
  venueIdentityKey,
  venuePlacePrefill,
  type VenueSourceEvent,
} from "@/lib/places/venue-workflow";

function event(overrides: Partial<VenueSourceEvent> = {}): VenueSourceEvent {
  return {
    id: "103e4cf0-0a68-4df8-a3f5-f9d982832421",
    title: "Friday music",
    slug: "friday-music",
    venue_name: "Café La Selva",
    address: "Calle Real 10, Centro",
    starts_on: "2026-08-28",
    ends_on: null,
    recurrence_frequency: "none",
    recurrence_until: null,
    publication_status: "published",
    source_language: "es",
    source_url: "https://example.com/event",
    place_id: null,
    ...overrides,
  };
}

describe("Event venue normalization and grouping", () => {
  it("normalizes case, spacing, accents and harmless punctuation", () => {
    expect(normalizeVenueText("  CAFÉ—La   Selva! ")).toBe("cafe la selva");
    expect(venueIdentityKey("Café La Selva", "Calle Real #10"))
      .toBe(venueIdentityKey("cafe la selva", " calle real 10 "));
  });

  it("groups safe formatting variants and reports Event counts", () => {
    const groups = groupVenueEvents([
      event(),
      event({
        id: "203e4cf0-0a68-4df8-a3f5-f9d982832421",
        venue_name: " café  la selva ",
        address: "Calle Real 10 Centro",
      }),
    ], "2026-08-22");

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      venueName: "Café La Selva",
      totalEventCount: 2,
      linkedEventCount: 0,
      hasUpcomingPublishedEvent: true,
    });
    expect(groups[0].unlinkedEvents).toHaveLength(2);
  });

  it("does not aggressively merge the same name at different addresses", () => {
    const groups = groupVenueEvents([
      event(),
      event({
        id: "303e4cf0-0a68-4df8-a3f5-f9d982832421",
        address: "Different street 25",
      }),
    ]);
    expect(groups).toHaveLength(2);
  });

  it("excludes already linked Events from selectable candidates but reports partial handling", () => {
    const groups = groupVenueEvents([
      event(),
      event({
        id: "403e4cf0-0a68-4df8-a3f5-f9d982832421",
        place_id: "503e4cf0-0a68-4df8-a3f5-f9d982832421",
      }),
    ]);
    expect(groups[0].unlinkedEvents).toHaveLength(1);
    expect(groups[0].linkedEventCount).toBe(1);
    expect(groups[0].totalEventCount).toBe(2);
  });

  it("prefills only facts safely shared by selected Events and defaults no publication data", () => {
    const groups = groupVenueEvents([
      event(),
      event({
        id: "603e4cf0-0a68-4df8-a3f5-f9d982832421",
        source_language: "en",
        source_url: null,
      }),
    ]);
    const prefill = venuePlacePrefill(groups[0], groups[0].unlinkedEvents.map((item) => item.id));
    expect(prefill).toEqual({
      name: "Café La Selva",
      address: "Calle Real 10, Centro",
      sourceLanguage: null,
      sourceUrl: "https://example.com/event",
    });
    expect(prefill).not.toHaveProperty("summary");
    expect(prefill).not.toHaveProperty("placeType");
    expect(prefill).not.toHaveProperty("publicationStatus");
  });

  it("suggests possible Places only from deterministic name/address equality", () => {
    const [group] = groupVenueEvents([event()]);
    const matches = possiblePlaceMatches(group, [
      { id: "p1", name: "Cafe La Selva", address: "Calle Real #10 Centro", place_type: "cafe", publication_status: "draft" },
      { id: "p2", name: "Cafe La Selvita", address: "Other street", place_type: "cafe", publication_status: "published" },
    ]);
    expect(matches).toMatchObject([{ id: "p1", signals: ["name", "address"] }]);
  });

  it("does not turn similar but uncertain names into a match", () => {
    const [group] = groupVenueEvents([event()]);
    expect(possiblePlaceMatches(group, [
      { id: "p2", name: "Cafe La Selvita", address: null, place_type: "cafe", publication_status: "draft" },
    ])).toEqual([]);
  });

  it("parses a bounded, unique Event selection", () => {
    const form = new FormData();
    form.set("venue_group_key", "cafe la selva::calle real 10 centro");
    form.append("selected_event_id", "103e4cf0-0a68-4df8-a3f5-f9d982832421");
    form.append("selected_event_id", "103e4cf0-0a68-4df8-a3f5-f9d982832421");
    expect(parseVenueSelection(form).eventIds).toEqual(["103e4cf0-0a68-4df8-a3f5-f9d982832421"]);
  });
});
