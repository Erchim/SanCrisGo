import "server-only";
import { cache } from "react";
import {
  EVENT_TIME_ZONE,
  resolveEventDateSelection,
  type EventDateSelection,
} from "@/lib/events/date-filter";
import { getPublicEventMediaUrl } from "@/lib/supabase/event-media";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export type PublicEventListItem = {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  summary: string | null;
  venue_name: string | null;
  address: string | null;
  starts_on: string;
  starts_at: string | null;
  ends_on: string | null;
  ends_at: string | null;
  price_text: string | null;
  cover_image_url: string | null;
  published_at: string;
  updated_at: string;
};

export type PublicEvent = PublicEventListItem & {
  description: string | null;
  ticket_url: string | null;
  organizer_name: string | null;
  organizer_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  source_url: string | null;
  contact_phone: string | null;
  media: Array<{
    url: string;
    altText: string | null;
    sortOrder: number;
  }>;
};

type EventListRow = Omit<PublicEventListItem, "cover_image_url"> & {
  cover_image_path: string | null;
};

type EventDetailRow = EventListRow & {
  description: string | null;
  ticket_url: string | null;
  organizer_name: string | null;
  organizer_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  source_url: string | null;
  contact_phone: string | null;
  event_media: Array<{
    storage_path: string;
    alt_text: string | null;
    sort_order: number;
  }>;
};

const listFields = "id,title,slug,event_type,summary,venue_name,address,starts_on,starts_at,ends_on,ends_at,price_text,cover_image_path,published_at,updated_at";
const localDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function selectionDate(instant: string): string {
  return localDateFormatter.format(new Date(instant));
}

function mapListRow(row: EventListRow): PublicEventListItem {
  const { cover_image_path: coverImagePath, ...event } = row;
  return {
    ...event,
    cover_image_url: getPublicEventMediaUrl(coverImagePath),
  };
}

export async function getPublishedEvents(
  selection: EventDateSelection,
  limit?: number,
): Promise<PublicEventListItem[]> {
  let query = createPublicSupabaseClient()
    .from("events")
    .select(listFields)
    .eq("publication_status", "published")
    .order("starts_on", { ascending: true })
    .order("starts_at", { ascending: true, nullsFirst: false });

  const startDate = selectionDate(selection.start);

  if (selection.end) {
    const endDate = selectionDate(selection.end);
    query = query
      .lt("starts_on", endDate)
      .or(`ends_on.gte.${startDate},starts_on.gte.${startDate}`);
  } else {
    query = query.or(`ends_on.gte.${startDate},starts_on.gte.${startDate}`);
  }

  const { data, error } = await (limit ? query.limit(limit) : query);
  if (error) throw new Error(`Unable to load published events: ${error.message}`);
  return ((data ?? []) as EventListRow[]).map(mapListRow);
}

export function getUpcomingPublishedEvents(limit: number): Promise<PublicEventListItem[]> {
  return getPublishedEvents(resolveEventDateSelection(undefined, undefined), limit);
}

export const getPublishedEvent = cache(async (slug: string): Promise<PublicEvent | null> => {
  const { data, error } = await createPublicSupabaseClient()
    .from("events")
    .select(`${listFields},description,ticket_url,organizer_name,organizer_url,seo_title,seo_description,source_url,contact_phone,event_media(storage_path,alt_text,sort_order)`)
    .eq("slug", slug)
    .eq("publication_status", "published")
    .order("sort_order", { referencedTable: "event_media", ascending: true })
    .maybeSingle();

  if (error) throw new Error(`Unable to load published event: ${error.message}`);
  if (!data) return null;

  const row = data as EventDetailRow;
  const { event_media: mediaRows, description, ticket_url, organizer_name, organizer_url, seo_title, seo_description, source_url, contact_phone, ...listRow } = row;
  return {
    ...mapListRow(listRow),
    description,
    ticket_url,
    organizer_name,
    organizer_url,
    seo_title,
    seo_description,
    source_url,
    contact_phone,
    media: mediaRows.map((media) => ({
      url: getPublicEventMediaUrl(media.storage_path) ?? "",
      altText: media.alt_text,
      sortOrder: media.sort_order,
    })).filter((media) => media.url),
  };
});

export async function getPublishedEventsForSitemap(): Promise<
  Pick<PublicEventListItem, "slug" | "updated_at">[]
> {
  const { data, error } = await createPublicSupabaseClient()
    .from("events")
    .select("slug,updated_at")
    .eq("publication_status", "published")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Unable to load event sitemap entries: ${error.message}`);
  return data;
}
