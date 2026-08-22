import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AdminPlaceError, type PlaceInput } from "@/lib/places/admin-places";
import { AdminVenueWorkflowService } from "@/lib/places/admin-venue-workflow";

type FakeRow = Record<string, unknown>;

class FakeQuery {
  operation: "select" | "update" | "delete" = "select";
  updateValue: FakeRow | null = null;
  filters: Array<[string, string, unknown]> = [];

  constructor(
    private readonly table: string,
    private readonly rows: FakeRow[],
    private readonly mutations: Array<{ table: string; value: FakeRow }>,
  ) {}

  select() { return this; }
  update(value: FakeRow) {
    this.operation = "update";
    this.updateValue = value;
    this.mutations.push({ table: this.table, value });
    return this;
  }
  delete() { this.operation = "delete"; return this; }
  eq(column: string, value: unknown) { this.filters.push(["eq", column, value]); return this; }
  neq(column: string, value: unknown) { this.filters.push(["neq", column, value]); return this; }
  is(column: string, value: unknown) { this.filters.push(["is", column, value]); return this; }
  in(column: string, value: unknown[]) { this.filters.push(["in", column, value]); return this; }

  maybeSingle() {
    return Promise.resolve({ data: this.filtered()[0] ?? null, error: null });
  }

  then(resolve: (value: { data: FakeRow[]; error: null }) => unknown) {
    const filtered = this.filtered();
    if (this.operation === "update" && this.updateValue) {
      for (const row of filtered) Object.assign(row, this.updateValue);
    }
    return Promise.resolve(resolve({ data: this.operation === "delete" ? [] : filtered, error: null }));
  }

  private filtered() {
    return this.rows.filter((row) => this.filters.every(([kind, column, value]) => {
      if (kind === "eq") return row[column] === value;
      if (kind === "neq") return row[column] !== value;
      if (kind === "is") return row[column] === value;
      return (value as unknown[]).includes(row[column]);
    }));
  }
}

function fakeClient(tables: Record<string, FakeRow[]>) {
  const mutations: Array<{ table: string; value: FakeRow }> = [];
  return {
    client: { from: (table: string) => new FakeQuery(table, tables[table] ?? [], mutations) },
    mutations,
  };
}

const placeInput: PlaceInput = {
  name: "Café La Selva",
  slug: "cafe-la-selva",
  placeType: "cafe",
  summary: null,
  description: null,
  address: "Calle Real 10",
  neighborhood: null,
  latitude: null,
  longitude: null,
  googleMapsUrl: null,
  phone: null,
  whatsapp: null,
  websiteUrl: null,
  instagramUrl: null,
  sourceUrl: null,
  lastVerifiedAt: null,
  sourceLanguage: "es",
  seoTitle: null,
  seoDescription: null,
  publicationStatus: "draft",
};

describe("staff Venue linking service", () => {
  it("links only selected Event rows and preserves original venue/address fields", async () => {
    const selected = {
      id: "103e4cf0-0a68-4df8-a3f5-f9d982832421",
      venue_name: "Café La Selva",
      address: "Calle Real 10",
      place_id: null,
      recurrence_frequency: "weekly",
    };
    const unselected = {
      id: "203e4cf0-0a68-4df8-a3f5-f9d982832421",
      venue_name: "Café La Selva",
      address: "Calle Real 10",
      place_id: null,
      recurrence_frequency: "none",
    };
    const fake = fakeClient({
      places: [{ id: "303e4cf0-0a68-4df8-a3f5-f9d982832421", publication_status: "draft" }],
      events: [selected, unselected],
    });
    const service = new AdminVenueWorkflowService(fake.client as never);

    await expect(service.linkEventsToPlace(
      "303e4cf0-0a68-4df8-a3f5-f9d982832421",
      [selected.id],
      "cafe la selva::calle real 10",
    )).resolves.toBe(1);

    expect(selected).toMatchObject({
      place_id: "303e4cf0-0a68-4df8-a3f5-f9d982832421",
      venue_name: "Café La Selva",
      address: "Calle Real 10",
      recurrence_frequency: "weekly",
    });
    expect(unselected.place_id).toBeNull();
    expect(fake.mutations).toContainEqual({
      table: "events",
      value: { place_id: "303e4cf0-0a68-4df8-a3f5-f9d982832421" },
    });
  });

  it("rejects selected Events from another conservative venue group", async () => {
    const event = {
      id: "103e4cf0-0a68-4df8-a3f5-f9d982832421",
      venue_name: "Different venue",
      address: "Other street",
      place_id: null,
      recurrence_frequency: "none",
    };
    const fake = fakeClient({
      places: [{ id: "303e4cf0-0a68-4df8-a3f5-f9d982832421", publication_status: "draft" }],
      events: [event],
    });
    const service = new AdminVenueWorkflowService(fake.client as never);
    await expect(service.linkEventsToPlace(
      "303e4cf0-0a68-4df8-a3f5-f9d982832421",
      [event.id],
      "cafe la selva::calle real 10",
    )).rejects.toThrow(AdminPlaceError);
  });

  it("creates a draft Place and links a recurring series at Event-row level", async () => {
    const event = {
      id: "103e4cf0-0a68-4df8-a3f5-f9d982832421",
      venue_name: "Café La Selva",
      address: "Calle Real 10",
      place_id: null,
      recurrence_frequency: "weekly",
    };
    const fake = fakeClient({
      places: [{ id: "303e4cf0-0a68-4df8-a3f5-f9d982832421", publication_status: "draft" }],
      events: [event],
    });
    const places = {
      save: vi.fn().mockResolvedValue({
        id: "303e4cf0-0a68-4df8-a3f5-f9d982832421",
        publication_status: "draft",
      }),
    };
    const service = new AdminVenueWorkflowService(fake.client as never, places as never);
    const result = await service.createDraftAndLink(
      "403e4cf0-0a68-4df8-a3f5-f9d982832421",
      placeInput,
      [event.id],
      "cafe la selva::calle real 10",
    );

    expect(places.save).toHaveBeenCalledWith(
      null,
      "403e4cf0-0a68-4df8-a3f5-f9d982832421",
      expect.objectContaining({ publicationStatus: "draft" }),
    );
    expect(result.linkedCount).toBe(1);
    expect(event).toMatchObject({
      place_id: "303e4cf0-0a68-4df8-a3f5-f9d982832421",
      recurrence_frequency: "weekly",
    });
  });

  it("never allows create-and-link to publish automatically", async () => {
    const fake = fakeClient({});
    const service = new AdminVenueWorkflowService(fake.client as never, { save: vi.fn() } as never);
    await expect(service.createDraftAndLink(
      "403e4cf0-0a68-4df8-a3f5-f9d982832421",
      { ...placeInput, publicationStatus: "published" },
      ["103e4cf0-0a68-4df8-a3f5-f9d982832421"],
      "cafe la selva::calle real 10",
    )).rejects.toThrow("must start as a draft");
  });
});
