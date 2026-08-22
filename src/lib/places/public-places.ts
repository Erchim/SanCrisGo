import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GuideListItem } from "@/lib/guides";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export type PublicPlaceListItem = {
  id: string;
  name: string;
  slug: string;
  place_type: string;
  summary: string | null;
  address: string | null;
  neighborhood: string | null;
  updated_at: string;
};

export type PublicPlace = PublicPlaceListItem & {
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  instagram_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  published_at: string;
};

const placeListFields = "id,name,slug,place_type,summary,address,neighborhood,updated_at";
const placeDetailFields = `${placeListFields},description,latitude,longitude,google_maps_url,phone,whatsapp,website_url,instagram_url,seo_title,seo_description,source_url,last_verified_at,published_at`;

export class PublicPlacesRepository {
  constructor(private readonly client: SupabaseClient = createPublicSupabaseClient()) {}

  async list(): Promise<PublicPlaceListItem[]> {
    const { data, error } = await this.client
      .from("places")
      .select(placeListFields)
      .eq("publication_status", "published")
      .order("name", { ascending: true });
    if (error) throw new Error(`Unable to load published Places: ${error.message}`);
    return (data ?? []) as PublicPlaceListItem[];
  }

  async bySlug(slug: string): Promise<PublicPlace | null> {
    const { data, error } = await this.client
      .from("places")
      .select(placeDetailFields)
      .eq("slug", slug)
      .eq("publication_status", "published")
      .maybeSingle();
    if (error) throw new Error(`Unable to load published Place: ${error.message}`);
    return data as PublicPlace | null;
  }

  async relatedGuides(placeId: string): Promise<GuideListItem[]> {
    const relationResult = await this.client
      .from("guide_places")
      .select("guide_id")
      .eq("place_id", placeId);
    if (relationResult.error) {
      throw new Error(`Unable to load Place guide relationships: ${relationResult.error.message}`);
    }
    const guideIds = (relationResult.data ?? []).map((row) => row.guide_id as string);
    if (guideIds.length === 0) return [];

    const { data, error } = await this.client
      .from("guides")
      .select("id,title,slug,summary,category,language,published_at,updated_at,last_verified_at")
      .in("id", guideIds)
      .eq("publication_status", "published")
      .eq("language", "en")
      .order("published_at", { ascending: false });
    if (error) throw new Error(`Unable to load related published Guides: ${error.message}`);
    return (data ?? []) as GuideListItem[];
  }
}

export const getPublishedPlaces = cache(async (): Promise<PublicPlaceListItem[]> => (
  new PublicPlacesRepository().list()
));

export const getPublishedPlace = cache(async (slug: string): Promise<PublicPlace | null> => (
  new PublicPlacesRepository().bySlug(slug)
));

export async function getPublishedPlaceRelatedGuides(placeId: string): Promise<GuideListItem[]> {
  return new PublicPlacesRepository().relatedGuides(placeId);
}
