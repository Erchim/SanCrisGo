import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/app/admin/_components/admin-nav", () => ({ AdminNav: () => null }));

import AdminPage from "@/app/admin/page";

describe("admin landing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires active staff authentication", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("Unauthorized"));
    await expect(AdminPage()).rejects.toThrow("Unauthorized");
  });

  it("renders the authenticated staff landing", async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ id: "staff", role: "staff", displayName: "Ana" });
    const page = await AdminPage();
    expect(page.type).toBe("section");
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
  });
});
