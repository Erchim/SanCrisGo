import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminContext } from "@/lib/admin-auth";
import { PlaceForm } from "@/app/admin/places/_components/place-form";
import { AdminPlacesService } from "@/lib/places/admin-places";
import { AdminVenueWorkflowService } from "@/lib/places/admin-venue-workflow";
import {
  possiblePlaceMatches,
  selectedVenueEvents,
  venuePlacePrefill,
} from "@/lib/places/venue-workflow";

export const metadata: Metadata = {
  title: "New Place",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{
  error?: string | string[];
  venue_group_key?: string | string[];
  selected_event_id?: string | string[];
}> };

export default async function NewPlacePage({ searchParams }: Props) {
  const { identity: admin, client } = await requireAdminContext();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const groupKey = typeof params.venue_group_key === "string" ? params.venue_group_key : null;
  const eventIds = Array.isArray(params.selected_event_id)
    ? params.selected_event_id
    : params.selected_event_id ? [params.selected_event_id] : [];
  if (!groupKey) {
    return <PlaceForm adminDisplayName={admin.displayName} place={null} error={error} />;
  }

  const placesService = new AdminPlacesService(client);
  const venueService = new AdminVenueWorkflowService(client, placesService);

  const [group, places] = await Promise.all([
    venueService.getGroup(groupKey),
    placesService.getMatchOptions(),
  ]);
  if (!group || selectedVenueEvents(group, eventIds).length !== eventIds.length) notFound();
  const venueContext = {
    groupKey,
    eventIds,
    prefill: venuePlacePrefill(group, eventIds),
    matches: possiblePlaceMatches(group, places),
  };
  return (
    <PlaceForm
      adminDisplayName={admin.displayName}
      place={null}
      error={error}
      venueContext={venueContext}
    />
  );
}
