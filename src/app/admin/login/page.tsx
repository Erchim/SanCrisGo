import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin-auth";
import { signIn } from "./actions";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string | string[] }>;
};

const errorMessages: Record<string, string> = {
  missing: "Enter both email and password.",
  invalid: "The email or password is incorrect.",
  forbidden: "This account does not have access to the event admin.",
};

export default async function AdminLoginPage({ searchParams }: Props) {
  if (await getAdminIdentity()) redirect("/admin/events");

  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";

  return (
    <section className="admin-login">
      <p className="eyebrow">SanCrisGo admin</p>
      <h1>Event queue sign in</h1>
      <p className="lede">Use the email account with an active staff or owner role.</p>

      {errorMessages[errorCode] && (
        <p className="admin-alert" role="alert">{errorMessages[errorCode]}</p>
      )}

      <form action={signIn} className="admin-form admin-login-form">
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </section>
  );
}
