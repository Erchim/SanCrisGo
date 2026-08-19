import "server-only";
import { cache } from "react";
import { type EventDateSelection } from "@/lib/events/date-filter";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export type PublicEventListItem = {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  summary: string | null;
  venue_name: string | null;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
  price_text: string | null;
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
};

const listFields = "id,title,slug,event_type,summary,venue_name,address,starts_at,ends_at,price_text,published_at,updated_at";

export async function getPublishedEvents(
  selection: EventDateSelection,
): Promise<PublicEventListItem[]> {
  let query = createPublicSupabaseClient()
    .from("events")
    .select(listFields)
    .eq("publication_status", "published")
    .order("starts_at", { ascending: true });

  if (selection.end) {
    query = query
      .lt("starts_at", selection.end)
      .or(`ends_at.gte.${selection.start},starts_at.gte.${selection.start}`);
  } else {
    query = query.or(`ends_at.gte.${selection.start},starts_at.gte.${selection.start}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load published events: ${error.message}`);
  return data as PublicEventListItem[];
}

export const getPublishedEvent = cache(async (slug: string): Promise<PublicEvent | null> => {
  const { data, error } = await createPublicSupabaseClient()
    .from("events")
    .select(`${listFields},description,ticket_url,organizer_name,organizer_url,seo_title,seo_description,source_url`)
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();

  if (error) throw new Error(`Unable to load published event: ${error.message}`);
  return data as PublicEvent | null;
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
