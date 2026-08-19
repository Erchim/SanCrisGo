"use server";

import { redirect } from "next/navigation";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData) {
  const email = field(formData, "email");
  const password = field(formData, "password");
  if (!email || !password) redirect("/admin/login?error=missing");

  const client = await createAuthenticatedSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/admin/login?error=invalid");

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role,account_status")
    .eq("id", data.user.id)
    .maybeSingle<{ role: string; account_status: string }>();

  if (
    profileError
    || !profile
    || profile.account_status !== "active"
    || (profile.role !== "staff" && profile.role !== "owner")
  ) {
    await client.auth.signOut();
    redirect("/admin/login?error=forbidden");
  }

  redirect("/admin/events");
}

export async function signOut() {
  const client = await createAuthenticatedSupabaseClient();
  await client.auth.signOut();
  redirect("/admin/login");
}
