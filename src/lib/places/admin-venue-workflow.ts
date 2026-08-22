import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminPlaceError, AdminPlacesService, type PlaceInput } from "@/lib/places/admin-places";
import {
  groupVenueEvents,
  venueIdentityKey,
  type VenueGroup,
  type VenueSourceEvent,
} from "@/lib/places/venue-workflow";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const EVENT_PAGE_SIZE = 500;
const PUBLICATION_CHUNK_SIZE = 200;

type VenueEventRow = Omit<VenueSourceEvent, "candidateId">;
type EventPublicationRow = { event_id: string; candidate_id: string };

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export class AdminVenueWorkflowService {
  private readonly places: AdminPlacesService;

  constructor(
    private readonly client: SupabaseClient = createServiceRoleSupabaseClient(),
    placesService?: AdminPlacesService,
  ) {
    this.places = placesService ?? new AdminPlacesService(client);
  }

  async getWorkspace(today = new Date().toISOString().slice(0, 10)): Promise<VenueGroup[]> {
    const rows = await this.loadVenueEvents();
    const candidateByEvent = await this.loadCandidateReferences(rows.map((row) => row.id));
    return groupVenueEvents(rows.map((row) => ({
      ...row,
      candidateId: candidateByEvent.get(row.id) ?? null,
    })), today);
  }

  async getGroup(groupKey: string, today?: string): Promise<VenueGroup | null> {
    const groups = await this.getWorkspace(today);
    return groups.find((group) => group.key === groupKey) ?? null;
  }

  async linkEventsToPlace(
    placeId: string,
    eventIds: string[],
    expectedGroupKey: string,
  ): Promise<number> {
    if (eventIds.length === 0) throw new AdminPlaceError("Select at least one Event.");

    const { data: place, error: placeError } = await this.client
      .from("places")
      .select("id,publication_status")
      .eq("id", placeId)
      .neq("publication_status", "archived")
      .maybeSingle<{ id: string; publication_status: string }>();
    if (placeError || !place) {
      throw new AdminPlaceError("Choose an active existing Place.");
    }

    const { data: eventData, error: eventError } = await this.client
      .from("events")
      .select("id,venue_name,address,place_id,recurrence_frequency")
      .in("id", eventIds);
    if (eventError) throw new AdminPlaceError("Could not validate the selected Events.");

    const events = (eventData ?? []) as Array<{
      id: string;
      venue_name: string | null;
      address: string | null;
      place_id: string | null;
      recurrence_frequency: string;
    }>;
    if (
      events.length !== eventIds.length
      || events.some((event) => event.place_id !== null)
      || events.some((event) => venueIdentityKey(event.venue_name, event.address) !== expectedGroupKey)
    ) {
      throw new AdminPlaceError("The venue group changed. Reload it before linking Events.");
    }

    const { data: updatedData, error: updateError } = await this.client
      .from("events")
      .update({ place_id: placeId })
      .in("id", eventIds)
      .is("place_id", null)
      .select("id");
    const updatedIds = (updatedData ?? []).map((row) => row.id as string);
    if (updateError || updatedIds.length !== eventIds.length) {
      if (updatedIds.length > 0) {
        await this.client
          .from("events")
          .update({ place_id: null })
          .in("id", updatedIds)
          .eq("place_id", placeId);
      }
      throw new AdminPlaceError("Could not link every selected Event. No partial link was kept.");
    }

    return updatedIds.length;
  }

  async createDraftAndLink(
    actorId: string,
    input: PlaceInput,
    eventIds: string[],
    expectedGroupKey: string,
  ) {
    if (input.publicationStatus !== "draft") {
      throw new AdminPlaceError("A Place created from Event venue data must start as a draft.");
    }

    const place = await this.places.save(null, actorId, input);
    try {
      const linkedCount = await this.linkEventsToPlace(place.id, eventIds, expectedGroupKey);
      return { place, linkedCount };
    } catch (error) {
      const rollback = await this.client
        .from("places")
        .delete()
        .eq("id", place.id)
        .eq("publication_status", "draft");
      if (rollback.error) {
        throw new AdminPlaceError(
          "The draft Place was created, but Events could not be linked. Review it in Places before retrying.",
          { cause: error },
        );
      }
      throw error;
    }
  }

  private async loadVenueEvents(): Promise<VenueEventRow[]> {
    const rows: VenueEventRow[] = [];
    for (let from = 0; ; from += EVENT_PAGE_SIZE) {
      const { data, error } = await this.client
        .from("events")
        .select("id,title,slug,venue_name,address,starts_on,ends_on,recurrence_frequency,recurrence_until,publication_status,source_language,source_url,place_id")
        .in("publication_status", ["draft", "pending", "published"])
        .not("venue_name", "is", null)
        .order("starts_on", { ascending: false })
        .range(from, from + EVENT_PAGE_SIZE - 1);
      if (error) throw new AdminPlaceError("Could not load Event venues.");
      const page = (data ?? []) as VenueEventRow[];
      rows.push(...page);
      if (page.length < EVENT_PAGE_SIZE) break;
    }
    return rows;
  }

  private async loadCandidateReferences(eventIds: string[]): Promise<Map<string, string>> {
    const references = new Map<string, string>();
    for (const eventIdChunk of chunks(eventIds, PUBLICATION_CHUNK_SIZE)) {
      if (eventIdChunk.length === 0) continue;
      const { data, error } = await this.client
        .from("event_publications")
        .select("event_id,candidate_id")
        .eq("channel", "website")
        .in("event_id", eventIdChunk);
      if (error) throw new AdminPlaceError("Could not load Event admin references.");
      for (const row of (data ?? []) as EventPublicationRow[]) {
        references.set(row.event_id, row.candidate_id);
      }
    }
    return references;
  }
}
