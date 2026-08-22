"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/admin-auth";
import {
  AdminPlaceError,
  AdminPlacesService,
  parsePlaceForm,
} from "@/lib/places/admin-places";
import { AdminVenueWorkflowService } from "@/lib/places/admin-venue-workflow";
import { parseVenueSelection, type VenueSelection } from "@/lib/places/venue-workflow";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalPlaceId(formData: FormData): string | null {
  const value = formData.get("place_id");
  if (typeof value !== "string" || !value.trim()) return null;
  if (!UUID_PATTERN.test(value)) throw new AdminPlaceError("Place ID is invalid.");
  return value;
}

function message(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unexpected Place error. Please try again.";
}

export async function savePlace(formData: FormData) {
  const { identity: admin, client } = await requireAdminContext();
  let id: string | null = null;
  let savedId = "";
  let slug = "";
  let failure = "";
  let venueSelection: VenueSelection | null = null;

  try {
    id = optionalPlaceId(formData);
    const input = parsePlaceForm(formData);
    venueSelection = formData.has("venue_group_key") ? parseVenueSelection(formData) : null;
    if (venueSelection && id) {
      throw new AdminPlaceError("Venue workflow cannot overwrite an existing Place.");
    }
    const placesService = new AdminPlacesService(client);
    const place = venueSelection
      ? (await new AdminVenueWorkflowService(client, placesService).createDraftAndLink(
        admin.id,
        input,
        venueSelection.eventIds,
        venueSelection.groupKey,
      )).place
      : await placesService.save(id, admin.id, input);
    savedId = place.id;
    slug = place.slug;
  } catch (error) {
    failure = message(error);
  }

  if (failure) {
    let target = id ? `/admin/places/${id}` : "/admin/places/new";
    if (venueSelection) {
      const query = new URLSearchParams({ venue_group_key: venueSelection.groupKey });
      venueSelection.eventIds.forEach((eventId) => query.append("selected_event_id", eventId));
      target = `/admin/places/new?${query}`;
    }
    const separator = target.includes("?") ? "&" : "?";
    redirect(`${target}${separator}error=${encodeURIComponent(failure)}`);
  }

  revalidatePath("/admin/places");
  revalidatePath("/places");
  revalidatePath(`/places/${slug}`);
  revalidatePath("/sitemap.xml");
  if (venueSelection) {
    revalidatePath("/admin/places/venues");
    revalidatePath("/events");
    revalidatePath("/es/eventos");
    redirect(`/admin/places/venues?status=created&count=${venueSelection.eventIds.length}`);
  }
  redirect(`/admin/places/${savedId}?status=saved`);
}
