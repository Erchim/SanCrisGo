import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "./service-role";

const EVENT_MEDIA_BUCKET = "event-media";
const DEFAULT_SIGNED_URL_LIFETIME_SECONDS = 300;

export async function createEventMediaSignedUrl(
  mediaPath: string,
  expiresInSeconds = DEFAULT_SIGNED_URL_LIFETIME_SECONDS,
  client: SupabaseClient = createServiceRoleSupabaseClient(),
): Promise<string> {
  const normalizedPath = mediaPath.trim();
  if (!normalizedPath) {
    throw new Error("mediaPath is required to create an event media signed URL.");
  }
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error("expiresInSeconds must be a positive integer.");
  }

  const { data, error } = await client.storage
    .from(EVENT_MEDIA_BUCKET)
    .createSignedUrl(normalizedPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error("Could not create a signed URL for event media.", { cause: error });
  }

  return data.signedUrl;
}
