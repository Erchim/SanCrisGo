import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminContext: vi.fn(),
  save: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdminContext: mocks.requireAdminContext }));
vi.mock("@/lib/places/admin-places", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/places/admin-places")>();
  return {
    ...original,
    AdminPlacesService: class { save = mocks.save; },
  };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { savePlace } from "@/app/admin/places/actions";

describe("Place server actions", () => {
  it("rejects a non-staff caller before a Place mutation", async () => {
    mocks.requireAdminContext.mockRejectedValueOnce(new Error("Unauthorized"));
    await expect(savePlace(new FormData())).rejects.toThrow("Unauthorized");
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
