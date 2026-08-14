import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createPublicSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase public reads require SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
