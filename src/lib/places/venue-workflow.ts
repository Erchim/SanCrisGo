import type { EventRecurrenceFrequency } from "@/lib/events/recurrence";

export type VenueSourceEvent = {
  id: string;
  title: string;
  slug: string;
  venue_name: string | null;
  address: string | null;
  starts_on: string;
  ends_on: string | null;
  recurrence_frequency: EventRecurrenceFrequency;
  recurrence_until: string | null;
  publication_status: string;
  source_language: string;
  source_url: string | null;
  place_id: string | null;
  candidateId?: string | null;
};

export type UnlinkedVenueEvent = VenueSourceEvent & {
  venue_name: string;
};

export type VenueGroup = {
  key: string;
  normalizedName: string;
  normalizedAddress: string;
  venueName: string;
  representativeAddress: string | null;
  unlinkedEvents: UnlinkedVenueEvent[];
  linkedEventCount: number;
  totalEventCount: number;
  hasUpcomingPublishedEvent: boolean;
};

export type VenuePlacePrefill = {
  name: string;
  address: string | null;
  sourceLanguage: string | null;
  sourceUrl: string | null;
};

export type MatchablePlace = {
  id: string;
  name: string;
  address: string | null;
  place_type: string;
  publication_status: string;
};

export type PossiblePlaceMatch = MatchablePlace & {
  signals: Array<"name" | "address">;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeVenueText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function venueIdentityKey(
  venueName: string | null | undefined,
  address: string | null | undefined,
): string | null {
  const normalizedName = normalizeVenueText(venueName);
  if (!normalizedName) return null;
  return `${normalizedName}::${normalizeVenueText(address)}`;
}

function representativeText(values: Array<string | null>): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    const text = value?.trim();
    if (text) counts.set(text, (counts.get(text) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([, leftCount], [, rightCount]) => rightCount - leftCount)[0]?.[0] ?? null;
}

function isUpcomingPublished(event: VenueSourceEvent, today: string): boolean {
  if (event.publication_status !== "published") return false;
  if (event.recurrence_frequency === "weekly") {
    return !event.recurrence_until || event.recurrence_until >= today;
  }
  return (event.ends_on ?? event.starts_on) >= today;
}

export function groupVenueEvents(
  events: VenueSourceEvent[],
  today = new Date().toISOString().slice(0, 10),
): VenueGroup[] {
  const buckets = new Map<string, VenueSourceEvent[]>();
  for (const event of events) {
    const key = venueIdentityKey(event.venue_name, event.address);
    if (!key) continue;
    const bucket = buckets.get(key) ?? [];
    bucket.push(event);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()].flatMap(([key, bucket]) => {
    const unlinkedEvents = bucket
      .filter((event): event is UnlinkedVenueEvent => !event.place_id && Boolean(event.venue_name?.trim()))
      .sort((left, right) => right.starts_on.localeCompare(left.starts_on));
    if (unlinkedEvents.length === 0) return [];

    const [normalizedName, normalizedAddress] = key.split("::");
    return [{
      key,
      normalizedName,
      normalizedAddress,
      venueName: representativeText(unlinkedEvents.map((event) => event.venue_name)) as string,
      representativeAddress: representativeText(unlinkedEvents.map((event) => event.address)),
      unlinkedEvents,
      linkedEventCount: bucket.length - unlinkedEvents.length,
      totalEventCount: bucket.length,
      hasUpcomingPublishedEvent: unlinkedEvents.some((event) => isUpcomingPublished(event, today)),
    }];
  }).sort((left, right) => (
    right.unlinkedEvents.length - left.unlinkedEvents.length
    || Number(right.hasUpcomingPublishedEvent) - Number(left.hasUpcomingPublishedEvent)
    || left.venueName.localeCompare(right.venueName, "es")
  ));
}

export function selectedVenueEvents(
  group: VenueGroup,
  selectedIds: string[],
): UnlinkedVenueEvent[] {
  const selected = new Set(selectedIds);
  return group.unlinkedEvents.filter((event) => selected.has(event.id));
}

export function venuePlacePrefill(
  group: VenueGroup,
  selectedIds: string[],
): VenuePlacePrefill {
  const events = selectedVenueEvents(group, selectedIds);
  if (events.length === 0) throw new Error("Select at least one Event.");

  const languages = new Set(events.map((event) => event.source_language).filter(Boolean));
  const sourceUrls = new Set(events.map((event) => event.source_url).filter((url): url is string => Boolean(url)));
  return {
    name: representativeText(events.map((event) => event.venue_name)) as string,
    address: representativeText(events.map((event) => event.address)),
    sourceLanguage: languages.size === 1 ? [...languages][0] : null,
    sourceUrl: sourceUrls.size === 1 ? [...sourceUrls][0] : null,
  };
}

export function possiblePlaceMatches(
  group: Pick<VenueGroup, "normalizedName" | "normalizedAddress">,
  places: MatchablePlace[],
): PossiblePlaceMatch[] {
  return places.flatMap((place) => {
    const signals: PossiblePlaceMatch["signals"] = [];
    if (normalizeVenueText(place.name) === group.normalizedName) signals.push("name");
    if (
      group.normalizedAddress
      && normalizeVenueText(place.address) === group.normalizedAddress
    ) signals.push("address");
    return signals.length ? [{ ...place, signals }] : [];
  }).sort((left, right) => (
    right.signals.length - left.signals.length || left.name.localeCompare(right.name, "es")
  ));
}

export type VenueSelection = {
  groupKey: string;
  eventIds: string[];
};

export function parseVenueSelection(formData: FormData): VenueSelection {
  const groupValue = formData.get("venue_group_key");
  const groupKey = typeof groupValue === "string" ? groupValue.trim() : "";
  if (!groupKey || groupKey.length > 500 || !groupKey.includes("::")) {
    throw new Error("Venue group is invalid.");
  }

  const eventIds = [...new Set(formData.getAll("selected_event_id")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim()))];
  if (eventIds.length === 0) throw new Error("Select at least one Event.");
  if (eventIds.length > 200 || eventIds.some((id) => !UUID_PATTERN.test(id))) {
    throw new Error("Event selection is invalid.");
  }
  return { groupKey, eventIds };
}
