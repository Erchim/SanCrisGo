import type { Metadata } from "next";
import Link from "next/link";
import { requestAdminPasswordReset } from "./actions";

export const metadata: Metadata = {
  title: "Reset admin password",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string | string[]; status?: string | string[] }>;
};

const errorMessages: Record<string, string> = {
  missing: "Enter your email address.",
  unavailable: "Password recovery is temporarily unavailable.",
};

export default async function ForgotAdminPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";
  const statusCode = typeof params.status === "string" ? params.status : "";

  return (
    <section className="admin-login">
      <p className="eyebrow">SanCrisGo admin</p>
      <h1>Reset password</h1>
      <p className="lede">Enter the email address used for the event admin.</p>

      {errorMessages[errorCode] && (
        <p className="admin-alert" role="alert">{errorMessages[errorCode]}</p>
      )}
      {statusCode === "sent" && (
        <p className="admin-success" role="status">
          If an admin account exists for this email, a recovery link has been sent.
        </p>
      )}

      <form action={requestAdminPasswordReset} className="admin-form admin-login-form">
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <button type="submit">Send recovery link</button>
      </form>
      <p className="admin-auth-link"><Link href="/admin/login">Back to sign in</Link></p>
    </section>
  );
}
