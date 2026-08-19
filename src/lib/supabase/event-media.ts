import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "./service-role";
import { createPublicSupabaseClient } from "./server";

export const EVENT_MEDIA_BUCKET = "event-media";
export const EVENT_PUBLIC_MEDIA_BUCKET = "event-public-media";
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

export async function createEventMediaSignedUrls(
  mediaPaths: string[],
  expiresInSeconds = DEFAULT_SIGNED_URL_LIFETIME_SECONDS,
  client: SupabaseClient = createServiceRoleSupabaseClient(),
): Promise<Map<string, string>> {
  const normalizedPaths = mediaPaths.map((path) => path.trim()).filter(Boolean);
  if (normalizedPaths.length === 0) return new Map();
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error("expiresInSeconds must be a positive integer.");
  }

  const { data, error } = await client.storage
    .from(EVENT_MEDIA_BUCKET)
    .createSignedUrls(normalizedPaths, expiresInSeconds);

  if (error || !data) {
    throw new Error("Could not create signed URLs for event media.", { cause: error });
  }

  return new Map(
    data.flatMap((item, index) => {
      const path = item.path || normalizedPaths[index];
      return item.signedUrl && path ? [[path, item.signedUrl] as const] : [];
    }),
  );
}

export function getPublicEventMediaUrl(
  mediaPath: string | null,
  client: SupabaseClient = createPublicSupabaseClient(),
): string | null {
  const normalizedPath = mediaPath?.trim();
  if (!normalizedPath) return null;
  return client.storage.from(EVENT_PUBLIC_MEDIA_BUCKET).getPublicUrl(normalizedPath).data.publicUrl;
}
