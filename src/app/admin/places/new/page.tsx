import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
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
  await requireAdmin();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const groupKey = typeof params.venue_group_key === "string" ? params.venue_group_key : null;
  const eventIds = Array.isArray(params.selected_event_id)
    ? params.selected_event_id
    : params.selected_event_id ? [params.selected_event_id] : [];
  if (!groupKey) return <PlaceForm place={null} error={error} />;

  const [group, places] = await Promise.all([
    new AdminVenueWorkflowService().getGroup(groupKey),
    new AdminPlacesService().getMatchOptions(),
  ]);
  if (!group || selectedVenueEvents(group, eventIds).length !== eventIds.length) notFound();
  const venueContext = {
    groupKey,
    eventIds,
    prefill: venuePlacePrefill(group, eventIds),
    matches: possiblePlaceMatches(group, places),
  };
  return <PlaceForm place={null} error={error} venueContext={venueContext} />;
}
