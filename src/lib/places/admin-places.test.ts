import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  AdminPlaceError,
  AdminPlacesService,
  parsePlaceForm,
  placePublicationFields,
} from "@/lib/places/admin-places";

const storedPlace = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Museo de los Altos",
  slug: "museo-de-los-altos",
  place_type: "museum",
  summary: null,
  description: null,
  address: null,
  neighborhood: null,
  latitude: null,
  longitude: null,
  google_maps_url: null,
  phone: null,
  whatsapp: null,
  website_url: null,
  instagram_url: null,
  seo_title: null,
  seo_description: null,
  source_url: null,
  last_verified_at: null,
  source_language: "es",
  publication_status: "draft",
  published_at: null,
  updated_at: "2026-08-22T12:00:00Z",
};

class FakeAdminQuery {
  private id: string | null = null;
  constructor(
    private readonly table: string,
    private readonly state: { place: typeof storedPlace | null },
    private readonly mutation?: { type: "insert" | "update"; values: Record<string, unknown> },
  ) {}
  select() { return this; }
  order() { return this; }
  not() { return this; }
  range() { return this; }
  eq(column: string, value: string) { if (column === "id") this.id = value; return this; }
  insert(values: Record<string, unknown>) { return new FakeAdminQuery(this.table, this.state, { type: "insert", values }); }
  update(values: Record<string, unknown>) { return new FakeAdminQuery(this.table, this.state, { type: "update", values }); }
  maybeSingle() {
    return Promise.resolve({
      data: this.table === "places" && this.state.place?.id === this.id ? this.state.place : null,
      error: null,
    });
  }
  single() {
    if (!this.mutation) return Promise.resolve({ data: null, error: null });
    const current = this.mutation.type === "update" ? this.state.place : storedPlace;
    this.state.place = { ...current!, ...this.mutation.values } as typeof storedPlace;
    return Promise.resolve({ data: this.state.place, error: null });
  }
  then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
    const data = this.table === "events" ? [] : this.state.place ? [this.state.place] : [];
    return Promise.resolve({ data, error: null }).then(resolve);
  }
}

function adminService(place: typeof storedPlace | null = null) {
  const state = { place };
  const client = {
    from: (table: string) => new FakeAdminQuery(table, state),
  };
  return { service: new AdminPlacesService(client as never), state };
}

function validForm(status = "draft") {
  const form = new FormData();
  form.set("name", "Museo de los Altos");
  form.set("place_type", "museum");
  form.set("publication_status", status);
  form.set("source_language", "es");
  return form;
}

describe("Place admin validation", () => {
  it("normalizes a useful draft", () => {
    const input = parsePlaceForm(validForm());
    expect(input).toMatchObject({
      name: "Museo de los Altos",
      slug: "museo-de-los-altos",
      placeType: "museum",
      publicationStatus: "draft",
    });
  });

  it("rejects an empty public SEO shell", () => {
    expect(() => parsePlaceForm(validForm("published"))).toThrow(AdminPlaceError);
  });

  it("accepts publication with content and identifying context", () => {
    const form = validForm("published");
    form.set("summary", "A museum in central San Cristóbal.");
    form.set("neighborhood", "Centro");
    expect(parsePlaceForm(form).publicationStatus).toBe("published");
  });

  it("requires coordinate pairs and validates ranges", () => {
    const form = validForm();
    form.set("latitude", "16.737");
    expect(() => parsePlaceForm(form)).toThrow("Add both latitude and longitude");
    form.set("longitude", "999");
    expect(() => parsePlaceForm(form)).toThrow("Longitude is invalid");
  });

  it("sets, preserves and clears publication timestamps consistently", () => {
    const now = "2026-08-22T12:00:00.000Z";
    const publishedAt = "2026-08-20T12:00:00.000Z";
    expect(placePublicationFields("published", null, now)).toEqual({
      publication_status: "published",
      published_at: now,
    });
    expect(placePublicationFields("published", publishedAt, now).published_at).toBe(publishedAt);
    expect(placePublicationFields("archived", publishedAt, now).published_at).toBe(publishedAt);
    expect(placePublicationFields("draft", publishedAt, now).published_at).toBeNull();
  });
});

describe("RLS-backed Place admin access", () => {
  it("loads an empty Places list with the supplied authenticated client", async () => {
    await expect(adminService().service.getPlaces()).resolves.toEqual([]);
  });

  it("creates a draft Place through the supplied staff client", async () => {
    const { service } = adminService();
    const saved = await service.save(
      null,
      "22222222-2222-4222-8222-222222222222",
      parsePlaceForm(validForm()),
    );
    expect(saved).toMatchObject({ name: "Museo de los Altos", publication_status: "draft" });
  });

  it("updates an existing Place through the same staff client", async () => {
    const { service } = adminService(storedPlace);
    const form = validForm();
    form.set("name", "Museo actualizado");
    const saved = await service.save(storedPlace.id, "staff", parsePlaceForm(form));
    expect(saved.name).toBe("Museo actualizado");
  });
});
