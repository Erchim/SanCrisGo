"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/admin-auth";
import { AdminPlaceError } from "@/lib/places/admin-places";
import { AdminVenueWorkflowService } from "@/lib/places/admin-venue-workflow";
import { parseVenueSelection, selectedVenueEvents } from "@/lib/places/venue-workflow";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function selectedPlaceId(formData: FormData): string {
  const value = formData.get("existing_place_id");
  const id = typeof value === "string" ? value.trim() : "";
  if (!UUID_PATTERN.test(id)) throw new AdminPlaceError("Choose an existing Place.");
  return id;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected venue workflow error.";
}

export async function linkVenueEvents(formData: FormData) {
  const { client } = await requireAdminContext();
  let failure = "";
  let linkedCount = 0;
  try {
    const selection = parseVenueSelection(formData);
    linkedCount = await new AdminVenueWorkflowService(client).linkEventsToPlace(
      selectedPlaceId(formData),
      selection.eventIds,
      selection.groupKey,
    );
  } catch (error) {
    failure = errorMessage(error);
  }

  if (failure) redirect(`/admin/places/venues?error=${encodeURIComponent(failure)}`);
  revalidatePath("/admin/places");
  revalidatePath("/admin/places/venues");
  revalidatePath("/events");
  revalidatePath("/es/eventos");
  redirect(`/admin/places/venues?status=linked&count=${linkedCount}`);
}

export async function reviewVenueAsPlace(formData: FormData) {
  const { client } = await requireAdminContext();
  let target = "/admin/places/venues";
  let failure = "";
  try {
    const selection = parseVenueSelection(formData);
    const group = await new AdminVenueWorkflowService(client).getGroup(selection.groupKey);
    if (!group || selectedVenueEvents(group, selection.eventIds).length !== selection.eventIds.length) {
      throw new AdminPlaceError("The venue group changed. Reload it before creating a Place.");
    }
    const query = new URLSearchParams({ venue_group_key: selection.groupKey });
    selection.eventIds.forEach((id) => query.append("selected_event_id", id));
    target = `/admin/places/new?${query}`;
  } catch (error) {
    failure = errorMessage(error);
  }

  if (failure) redirect(`/admin/places/venues?error=${encodeURIComponent(failure)}`);
  redirect(target);
}
