import "server-only";
import { redirect } from "next/navigation";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

export type AdminIdentity = {
  id: string;
  role: "staff" | "owner";
  displayName: string | null;
};

type ProfileRow = {
  id: string;
  role: string;
  account_status: string;
  display_name: string | null;
};

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const client = await createAuthenticatedSupabaseClient();
  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,role,account_status,display_name")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (
    profileError
    || !profile
    || profile.account_status !== "active"
    || (profile.role !== "staff" && profile.role !== "owner")
  ) {
    return null;
  }

  return {
    id: profile.id,
    role: profile.role,
    displayName: profile.display_name,
  };
}

export async function requireAdmin(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/admin/login");
  return identity;
}
