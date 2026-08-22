import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  linkEventsToPlace: vi.fn(),
  getGroup: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/places/admin-venue-workflow", () => ({
  AdminVenueWorkflowService: class {
    linkEventsToPlace = mocks.linkEventsToPlace;
    getGroup = mocks.getGroup;
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { linkVenueEvents } from "@/app/admin/places/venues/actions";

describe("venue workflow server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks staff authorization before any linking mutation", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("Unauthorized"));

    await expect(linkVenueEvents(new FormData())).rejects.toThrow("Unauthorized");
    expect(mocks.linkEventsToPlace).not.toHaveBeenCalled();
  });
});
