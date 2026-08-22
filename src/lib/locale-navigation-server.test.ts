import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublishedEvent: vi.fn(),
  getPublishedGuidePageData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/events/public-events", () => ({
  getPublishedEvent: mocks.getPublishedEvent,
}));
vi.mock("@/lib/guides", () => ({
  getPublishedGuidePageData: mocks.getPublishedGuidePageData,
}));

import { resolveLocalizedPaths } from "@/lib/locale-navigation-server";

describe("server-resolved localized paths", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves a Guide counterpart from explicit translation identity", async () => {
    mocks.getPublishedGuidePageData.mockResolvedValue({
      localizedPaths: {
        en: "/guides/airport-guide",
        es: "/es/guias/guia-aeropuerto",
      },
    });

    await expect(resolveLocalizedPaths("/guides/airport-guide")).resolves.toEqual({
      en: "/guides/airport-guide",
      es: "/es/guias/guia-aeropuerto",
    });
    expect(mocks.getPublishedGuidePageData).toHaveBeenCalledWith("airport-guide", "en");
  });

  it("does not create a switch when the Guide translation is missing", async () => {
    mocks.getPublishedGuidePageData.mockResolvedValue({ localizedPaths: null });
    await expect(resolveLocalizedPaths("/guides/english-only")).resolves.toBeNull();
  });
});
