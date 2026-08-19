import { describe, expect, it } from "vitest";
import { ADMIN_PASSWORD_MIN_LENGTH, adminRecoveryPath, validateAdminPassword } from "./admin-password-recovery";

describe("admin password recovery", () => {
  it("requires matching passwords with the configured minimum length", () => {
    expect(validateAdminPassword("", "")).toBe("missing");
    expect(validateAdminPassword("a".repeat(ADMIN_PASSWORD_MIN_LENGTH), "different")).toBe("mismatch");
    expect(validateAdminPassword("a".repeat(ADMIN_PASSWORD_MIN_LENGTH - 1), "a".repeat(ADMIN_PASSWORD_MIN_LENGTH - 1))).toBe("short");
    expect(validateAdminPassword("a".repeat(ADMIN_PASSWORD_MIN_LENGTH), "a".repeat(ADMIN_PASSWORD_MIN_LENGTH))).toBeNull();
  });

  it("never accepts an external recovery redirect", () => {
    expect(adminRecoveryPath("https://example.com/steal-session")).toBe("/admin/reset-password");
    expect(adminRecoveryPath("/admin/reset-password")).toBe("/admin/reset-password");
  });
});
