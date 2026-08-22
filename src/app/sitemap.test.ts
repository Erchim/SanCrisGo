import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublishedGuides: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/events/public-events", () => ({ getPublishedEventsForSitemap: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/guides", () => ({ getPublishedGuides: mocks.getPublishedGuides }));
vi.mock("@/lib/places/public-places", () => ({ getPublishedPlaces: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/site-url", () => ({ getAbsoluteUrl: (path: string) => `https://www.sancrisgo.com${path}` }));

import sitemap from "@/app/sitemap";

describe("Guide sitemap localization", () => {
  it("includes published Spanish Guides once with reciprocal alternates", async () => {
    mocks.getPublishedGuides.mockImplementation((locale: string) => Promise.resolve(locale === "es" ? [{
      id: "es",
      translation_group_id: "family",
      slug: "guia-aeropuerto",
      updated_at: "2026-08-22T00:00:00Z",
    }] : [{
      id: "en",
      translation_group_id: "family",
      slug: "airport-guide",
      updated_at: "2026-08-21T00:00:00Z",
    }]));

    const entries = await sitemap();
    const spanish = entries.find((entry) => entry.url.endsWith("/es/guias/guia-aeropuerto"));
    expect(spanish?.alternates?.languages).toMatchObject({
      en: "https://www.sancrisgo.com/guides/airport-guide",
      es: "https://www.sancrisgo.com/es/guias/guia-aeropuerto",
    });
    expect(entries.filter((entry) => entry.url.endsWith("/es/guias/guia-aeropuerto"))).toHaveLength(1);
  });
});
