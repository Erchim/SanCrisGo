"use server";

import { redirect } from "next/navigation";
import { validateAdminPassword } from "@/lib/admin-password-recovery";
import { getAdminIdentity } from "@/lib/admin-auth";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

function passwordField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function updateAdminPassword(formData: FormData) {
  if (!await getAdminIdentity()) redirect("/admin/login?error=recovery");

  const password = passwordField(formData, "password");
  const confirmation = passwordField(formData, "passwordConfirmation");
  const validationError = validateAdminPassword(password, confirmation);
  if (validationError) redirect(`/admin/reset-password?error=${validationError}`);

  const client = await createAuthenticatedSupabaseClient();
  const { error } = await client.auth.updateUser({ password });
  if (error) redirect("/admin/reset-password?error=update");

  await client.auth.signOut();
  redirect("/admin/login?status=password-updated");
}
