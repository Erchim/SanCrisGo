import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ADMIN_PASSWORD_MIN_LENGTH } from "@/lib/admin-password-recovery";
import { getAdminIdentity } from "@/lib/admin-auth";
import { updateAdminPassword } from "./actions";

export const metadata: Metadata = {
  title: "Choose a new admin password",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string | string[] }>;
};

const errorMessages: Record<string, string> = {
  missing: "Enter the new password twice.",
  mismatch: "The passwords do not match.",
  short: `Use at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`,
  update: "The password could not be updated. Request a new recovery link and try again.",
};

export default async function ResetAdminPasswordPage({ searchParams }: Props) {
  if (!await getAdminIdentity()) redirect("/admin/login?error=recovery");

  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";

  return (
    <section className="admin-login">
      <p className="eyebrow">SanCrisGo admin</p>
      <h1>Choose a new password</h1>
      <p className="lede">Use at least {ADMIN_PASSWORD_MIN_LENGTH} characters and save it in a password manager.</p>

      {errorMessages[errorCode] && (
        <p className="admin-alert" role="alert">{errorMessages[errorCode]}</p>
      )}

      <form action={updateAdminPassword} className="admin-form admin-login-form">
        <label>
          New password
          <input name="password" type="password" minLength={ADMIN_PASSWORD_MIN_LENGTH} autoComplete="new-password" required />
        </label>
        <label>
          Confirm new password
          <input name="passwordConfirmation" type="password" minLength={ADMIN_PASSWORD_MIN_LENGTH} autoComplete="new-password" required />
        </label>
        <button type="submit">Update password</button>
      </form>
    </section>
  );
}
