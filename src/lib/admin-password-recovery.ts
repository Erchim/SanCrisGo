export const ADMIN_PASSWORD_MIN_LENGTH = 12;

export type AdminPasswordError = "missing" | "mismatch" | "short" | null;

export function validateAdminPassword(password: string, confirmation: string): AdminPasswordError {
  if (!password || !confirmation) return "missing";
  if (password !== confirmation) return "mismatch";
  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) return "short";
  return null;
}

export function adminRecoveryPath(value: string | null): string {
  return value === "/admin/reset-password" ? value : "/admin/reset-password";
}
