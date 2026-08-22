import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PublicPlacesRepository } from "@/lib/places/public-places";
import { buildPlaceMetadata, linkedPlacePath, placeSitemapPaths } from "@/lib/places/presentation";

function queryResult(data: unknown) {
  const calls: Array<[string, string, unknown]> = [];
  const query: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "order"]) {
    query[method] = vi.fn((...args: unknown[]) => {
      calls.push([method, String(args[0]), args[1]]);
      return query;
    });
  }
  query.maybeSingle = vi.fn(async () => ({ data, error: null }));
  query.then = (resolve: (value: unknown) => void) => resolve({ data, error: null });
  return { query, calls };
}

describe("public Places repository", () => {
  beforeEach(() => vi.stubEnv("SITE_URL", "https://sancrisgo.com"));

  it("fetches a Place by slug only through the published boundary", async () => {
    const place = { id: "p1", slug: "city-museum", name: "City Museum" };
    const result = queryResult(place);
    const client = { from: vi.fn(() => result.query) };
    await expect(new PublicPlacesRepository(client as never).bySlug("city-museum")).resolves.toEqual(place);
    expect(result.calls).toContainEqual(["eq", "slug", "city-museum"]);
    expect(result.calls).toContainEqual(["eq", "publication_status", "published"]);
  });

  it("does not make drafts publicly fetchable", async () => {
    const result = queryResult(null);
    const client = { from: vi.fn(() => result.query) };
    await expect(new PublicPlacesRepository(client as never).bySlug("draft-place")).resolves.toBeNull();
    expect(result.calls).toContainEqual(["eq", "publication_status", "published"]);
  });

  it("loads Guides only through explicit guide_places relationships", async () => {
    const relations = queryResult([{ guide_id: "g1" }]);
    const guides = queryResult([{ id: "g1", slug: "museum-guide" }]);
    const client = {
      from: vi.fn((table: string) => table === "guide_places" ? relations.query : guides.query),
    };
    await new PublicPlacesRepository(client as never).relatedGuides("p1");
    expect(client.from).toHaveBeenNthCalledWith(1, "guide_places");
    expect(client.from).toHaveBeenNthCalledWith(2, "guides");
    expect(relations.calls).toContainEqual(["eq", "place_id", "p1"]);
  });

  it("builds a canonical without a fake Spanish alternate", () => {
    const metadata = buildPlaceMetadata({
      id: "p1", name: "City Museum", slug: "city-museum", place_type: "museum",
      summary: "A museum in the city centre.", description: null, address: "Centro",
      neighborhood: "Centro", latitude: null, longitude: null, google_maps_url: null,
      phone: null, whatsapp: null, website_url: null, instagram_url: null,
      seo_title: null, seo_description: null, source_url: null, last_verified_at: null,
      published_at: "2026-08-20T00:00:00Z", updated_at: "2026-08-20T00:00:00Z",
    });
    expect(metadata.alternates).toEqual({ canonical: "https://sancrisgo.com/places/city-museum" });
  });

  it("creates one sitemap path per published result supplied by the repository", () => {
    expect(placeSitemapPaths([{ slug: "published-place" }])).toEqual(["/places/published-place"]);
  });

  it("uses a structured Place link and preserves the unlinked venue fallback", () => {
    expect(linkedPlacePath({ slug: "city-museum" })).toBe("/places/city-museum");
    expect(linkedPlacePath(null)).toBeNull();
  });
});
