"use server";

import { redirect } from "next/navigation";
import { getAbsoluteUrl } from "@/lib/site-url";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

function emailField(formData: FormData): string {
  const value = formData.get("email");
  return typeof value === "string" ? value.trim() : "";
}

export async function requestAdminPasswordReset(formData: FormData) {
  const email = emailField(formData);
  if (!email) redirect("/admin/forgot-password?error=missing");

  const callbackUrl = getAbsoluteUrl("/admin/auth/callback?next=/admin/reset-password");
  if (!callbackUrl) redirect("/admin/forgot-password?error=unavailable");

  const client = await createAuthenticatedSupabaseClient();
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl });

  if (error) {
    console.warn("[admin/password-recovery] reset email request failed", {
      status: error.status,
      code: error.code,
    });
  }

  // Keep the response generic so the form does not reveal which emails have accounts.
  redirect("/admin/forgot-password?status=sent");
}
