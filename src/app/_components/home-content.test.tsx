import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getLatestPublishedGuides: vi.fn(),
  getUpcomingPublishedEvents: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/guides", () => ({ getLatestPublishedGuides: mocks.getLatestPublishedGuides }));
vi.mock("@/lib/events/public-events", () => ({
  getUpcomingPublishedEvents: mocks.getUpcomingPublishedEvents,
}));

import { HomeContent } from "@/app/_components/home-content";

describe("localized homepage Guides", () => {
  it("requests only Spanish Guides for the Spanish homepage", async () => {
    mocks.getLatestPublishedGuides.mockResolvedValueOnce([]);
    mocks.getUpcomingPublishedEvents.mockResolvedValueOnce([]);
    await HomeContent({ locale: "es" });
    expect(mocks.getLatestPublishedGuides).toHaveBeenCalledWith("es");
  });
});
