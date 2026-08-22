"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  AdminPlaceError,
  AdminPlacesService,
  parsePlaceForm,
} from "@/lib/places/admin-places";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalPlaceId(formData: FormData): string | null {
  const value = formData.get("place_id");
  if (typeof value !== "string" || !value.trim()) return null;
  if (!UUID_PATTERN.test(value)) throw new AdminPlaceError("Place ID is invalid.");
  return value;
}

function message(error: unknown): string {
  return error instanceof AdminPlaceError
    ? error.message
    : "Unexpected Place error. Please try again.";
}

export async function savePlace(formData: FormData) {
  const admin = await requireAdmin();
  let id: string | null = null;
  let savedId = "";
  let slug = "";
  let failure = "";

  try {
    id = optionalPlaceId(formData);
    const input = parsePlaceForm(formData);
    const place = await new AdminPlacesService().save(id, admin.id, input);
    savedId = place.id;
    slug = place.slug;
  } catch (error) {
    failure = message(error);
  }

  if (failure) {
    const target = id ? `/admin/places/${id}` : "/admin/places/new";
    redirect(`${target}?error=${encodeURIComponent(failure)}`);
  }

  revalidatePath("/admin/places");
  revalidatePath("/places");
  revalidatePath(`/places/${slug}`);
  revalidatePath("/sitemap.xml");
  redirect(`/admin/places/${savedId}?status=saved`);
}
