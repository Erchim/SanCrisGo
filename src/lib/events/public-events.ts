import "server-only";
import { cache } from "react";
import {
  EVENT_TIME_ZONE,
  resolveEventDateSelection,
  type EventDateSelection,
} from "@/lib/events/date-filter";
import {
  hasUsableSpanishEvent,
  localizeEventText,
  type EventTextSource,
} from "@/lib/events/localization";
import {
  expandEventOccurrences,
  selectUpcomingOccurrences,
  type EventRecurrenceFrequency,
} from "@/lib/events/recurrence";
import type { Locale } from "@/lib/locales";
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
  recurrence_frequency: EventRecurrenceFrequency;
  recurrence_until: string | null;
  series_starts_on: string;
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
  place: { id: string; name: string; slug: string } | null;
  media: Array<{
    url: string;
    altText: string | null;
    sortOrder: number;
  }>;
};

type EventListRow = Omit<PublicEventListItem, "cover_image_url" | "series_starts_on"> & {
  cover_image_path: string | null;
} & EventTextSource;

type EventDetailRow = EventListRow & {
  description: string | null;
  description_es: string | null;
  ticket_url: string | null;
  organizer_name: string | null;
  organizer_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  source_url: string | null;
  contact_phone: string | null;
  places: { id: string; name: string; slug: string } | Array<{ id: string; name: string; slug: string }> | null;
  event_media: Array<{
    storage_path: string;
    alt_text: string | null;
    sort_order: number;
  }>;
};

const listFields = "id,title,title_es,slug,event_type,summary,summary_es,venue_name,address,starts_on,starts_at,ends_on,ends_at,recurrence_frequency,recurrence_until,price_text,price_text_es,source_language,cover_image_path,published_at,updated_at";
const localDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function selectionDate(instant: string): string {
  return localDateFormatter.format(new Date(instant));
}

function mapListRow(row: EventListRow, locale: Locale): PublicEventListItem | null {
  const text = localizeEventText(row, locale);
  if (!text) return null;

  return {
    id: row.id,
    title: text.title,
    slug: row.slug,
    event_type: row.event_type,
    summary: text.summary,
    venue_name: row.venue_name,
    address: row.address,
    starts_on: row.starts_on,
    starts_at: row.starts_at,
    ends_on: row.ends_on,
    ends_at: row.ends_at,
    recurrence_frequency: row.recurrence_frequency,
    recurrence_until: row.recurrence_until,
    series_starts_on: row.starts_on,
    price_text: text.price_text,
    cover_image_url: getPublicEventMediaUrl(row.cover_image_path),
    published_at: row.published_at,
    updated_at: row.updated_at,
  };
}

export async function getPublishedEvents(
  selection: EventDateSelection,
  locale: Locale = "en",
  limit?: number,
  placeId?: string,
): Promise<PublicEventListItem[]> {
  const startDate = selectionDate(selection.start);
  const endDate = selection.end ? selectionDate(selection.end) : null;
  const eventQuery = () => {
    let query = createPublicSupabaseClient()
      .from("events")
      .select(listFields)
      .eq("publication_status", "published");
    if (locale === "es") {
      query = query.or("title_es.not.is.null,source_language.ilike.es,source_language.ilike.es-%");
    }
    if (placeId) query = query.eq("place_id", placeId);
    return query;
  };

  let oneTimeQuery = eventQuery()
    .eq("recurrence_frequency", "none")
    .or(`ends_on.gte.${startDate},starts_on.gte.${startDate}`);
  let weeklyQuery = eventQuery()
    .eq("recurrence_frequency", "weekly");

  if (endDate) {
    oneTimeQuery = oneTimeQuery.lt("starts_on", endDate);
    weeklyQuery = weeklyQuery.lt("starts_on", endDate);
  }

  const [oneTimeResult, weeklyResult] = await Promise.all([oneTimeQuery, weeklyQuery]);
  const error = oneTimeResult.error ?? weeklyResult.error;
  if (error) throw new Error(`Unable to load published events: ${error.message}`);

  const events = [
    ...((oneTimeResult.data ?? []) as EventListRow[]),
    ...((weeklyResult.data ?? []) as EventListRow[]),
  ]
    .map((row) => mapListRow(row, locale))
    .filter((event): event is PublicEventListItem => event !== null);
  const occurrences = expandEventOccurrences(events, selection);
  return selectUpcomingOccurrences(occurrences, limit);
}

export function getUpcomingPublishedEvents(
  limit: number,
  locale: Locale = "en",
): Promise<PublicEventListItem[]> {
  return getPublishedEvents(resolveEventDateSelection(undefined, undefined, new Date(), locale), locale, limit);
}

const getPublishedEventRow = cache(async (slug: string): Promise<EventDetailRow | null> => {
  const { data, error } = await createPublicSupabaseClient()
    .from("events")
    .select(`${listFields},description,description_es,ticket_url,organizer_name,organizer_url,seo_title,seo_description,source_url,contact_phone,places!events_place_id_fkey(id,name,slug),event_media(storage_path,alt_text,sort_order)`)
    .eq("slug", slug)
    .eq("publication_status", "published")
    .order("sort_order", { referencedTable: "event_media", ascending: true })
    .maybeSingle();

  if (error) throw new Error(`Unable to load published event: ${error.message}`);
  if (!data) return null;

  return data as EventDetailRow;
});

export const getPublishedEvent = cache(async (
  slug: string,
  locale: Locale = "en",
): Promise<PublicEvent | null> => {
  const row = await getPublishedEventRow(slug);
  if (!row) return null;

  const text = localizeEventText(row, locale);
  if (!text) return null;

  const listItem = mapListRow(row, locale);
  if (!listItem) return null;

  return {
    ...listItem,
    description: text.description,
    ticket_url: row.ticket_url,
    organizer_name: row.organizer_name,
    organizer_url: row.organizer_url,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    source_url: row.source_url,
    contact_phone: row.contact_phone,
    place: Array.isArray(row.places) ? row.places[0] ?? null : row.places,
    media: row.event_media.map((media) => ({
      url: getPublicEventMediaUrl(media.storage_path) ?? "",
      altText: media.alt_text,
      sortOrder: media.sort_order,
    })).filter((media) => media.url),
  };
});

export async function getPublishedEventsForSitemap(): Promise<
  Array<Pick<PublicEventListItem, "slug" | "updated_at"> & { hasSpanish: boolean }>
> {
  const { data, error } = await createPublicSupabaseClient()
    .from("events")
    .select("slug,updated_at,source_language,title,title_es,summary,summary_es,price_text,price_text_es")
    .eq("publication_status", "published")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Unable to load event sitemap entries: ${error.message}`);
  return (data ?? []).map((event) => ({
    slug: event.slug,
    updated_at: event.updated_at,
    hasSpanish: hasUsableSpanishEvent(event),
  }));
}

export function getUpcomingPublishedEventsForPlace(
  placeId: string,
  limit = 6,
): Promise<PublicEventListItem[]> {
  return getPublishedEvents(
    resolveEventDateSelection(undefined, undefined, new Date(), "en"),
    "en",
    limit,
    placeId,
  );
}
