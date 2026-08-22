import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  AdminPlaceError,
  parsePlaceForm,
  placePublicationFields,
} from "@/lib/places/admin-places";

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
