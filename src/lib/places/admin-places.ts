import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

export const PLACE_TYPES = [
  "attraction",
  "nature",
  "museum",
  "market",
  "restaurant",
  "cafe",
  "bar",
  "hotel",
  "hostel",
  "venue",
  "transport",
  "service",
  "other",
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];
export type PlacePublicationStatus = "draft" | "published" | "archived";

export type AdminPlaceRow = {
  id: string;
  name: string;
  slug: string;
  place_type: string;
  summary: string | null;
  description: string | null;
  address: string | null;
  neighborhood: string | null;
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
  source_language: string;
  publication_status: string;
  published_at: string | null;
  updated_at: string;
};

export type PlaceOption = Pick<AdminPlaceRow, "id" | "name" | "place_type" | "publication_status">;
export type AdminPlaceListItem = AdminPlaceRow & { linkedEventCount: number };
export type PlaceMatchOption = PlaceOption & Pick<AdminPlaceRow, "address">;

export type PlaceInput = {
  name: string;
  slug: string;
  placeType: PlaceType;
  summary: string | null;
  description: string | null;
  address: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  sourceLanguage: string;
  seoTitle: string | null;
  seoDescription: string | null;
  publicationStatus: PlacePublicationStatus;
};

export class AdminPlaceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AdminPlaceError";
  }
}

function optionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

function requiredText(formData: FormData, name: string, label: string): string {
  const value = optionalText(formData.get(name));
  if (!value) throw new AdminPlaceError(`${label} is required.`);
  return value;
}

function optionalHttpUrl(formData: FormData, name: string, label: string): string | null {
  const value = optionalText(formData.get(name));
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new AdminPlaceError(`${label} must be an http or https URL.`);
  }
}

function optionalCoordinate(
  formData: FormData,
  name: string,
  label: string,
  minimum: number,
  maximum: number,
): number | null {
  const value = optionalText(formData.get(name));
  if (!value) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new AdminPlaceError(`${label} is invalid.`);
  }
  return number;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month
    && date.getUTCDate() === day;
}

export function slugifyPlace(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function parsePlaceForm(formData: FormData): PlaceInput {
  const name = requiredText(formData, "name", "Name");
  const slug = slugifyPlace(optionalText(formData.get("slug")) ?? name);
  if (!slug) throw new AdminPlaceError("Slug is invalid.");

  const placeType = requiredText(formData, "place_type", "Place type");
  if (!PLACE_TYPES.includes(placeType as PlaceType)) {
    throw new AdminPlaceError("Place type is invalid.");
  }

  const publicationStatus = requiredText(formData, "publication_status", "Publication status");
  if (!["draft", "published", "archived"].includes(publicationStatus)) {
    throw new AdminPlaceError("Publication status is invalid.");
  }

  const summary = optionalText(formData.get("summary"));
  const description = optionalText(formData.get("description"));
  const address = optionalText(formData.get("address"));
  const neighborhood = optionalText(formData.get("neighborhood"));
  const latitude = optionalCoordinate(formData, "latitude", "Latitude", -90, 90);
  const longitude = optionalCoordinate(formData, "longitude", "Longitude", -180, 180);
  if ((latitude === null) !== (longitude === null)) {
    throw new AdminPlaceError("Add both latitude and longitude, or leave both empty.");
  }

  const googleMapsUrl = optionalHttpUrl(formData, "google_maps_url", "Google Maps URL");
  if (publicationStatus === "published") {
    if (!summary && !description) {
      throw new AdminPlaceError("A published Place needs a summary or description.");
    }
    if (!address && !neighborhood && !googleMapsUrl && latitude === null) {
      throw new AdminPlaceError("A published Place needs location or identifying context.");
    }
  }

  const lastVerifiedDate = optionalText(formData.get("last_verified_at"));
  if (lastVerifiedDate && !validDate(lastVerifiedDate)) {
    throw new AdminPlaceError("Last verified date is invalid.");
  }
  const sourceLanguage = optionalText(formData.get("source_language")) ?? "en";
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(sourceLanguage)) {
    throw new AdminPlaceError("Source language is invalid.");
  }

  return {
    name,
    slug,
    placeType: placeType as PlaceType,
    summary,
    description,
    address,
    neighborhood,
    latitude,
    longitude,
    googleMapsUrl,
    phone: optionalText(formData.get("phone")),
    whatsapp: optionalText(formData.get("whatsapp")),
    websiteUrl: optionalHttpUrl(formData, "website_url", "Website URL"),
    instagramUrl: optionalHttpUrl(formData, "instagram_url", "Instagram URL"),
    sourceUrl: optionalHttpUrl(formData, "source_url", "Source URL"),
    lastVerifiedAt: lastVerifiedDate ? `${lastVerifiedDate}T12:00:00.000Z` : null,
    sourceLanguage,
    seoTitle: optionalText(formData.get("seo_title")),
    seoDescription: optionalText(formData.get("seo_description")),
    publicationStatus: publicationStatus as PlacePublicationStatus,
  };
}

export function placePublicationFields(
  status: PlacePublicationStatus,
  existingPublishedAt: string | null,
  now: string,
) {
  return {
    publication_status: status,
    published_at: status === "published"
      ? existingPublishedAt ?? now
      : status === "archived" ? existingPublishedAt : null,
  };
}

const adminPlaceFields = "id,name,slug,place_type,summary,description,address,neighborhood,latitude,longitude,google_maps_url,phone,whatsapp,website_url,instagram_url,seo_title,seo_description,source_url,last_verified_at,source_language,publication_status,published_at,updated_at";
const LINK_COUNT_PAGE_SIZE = 500;

export class AdminPlacesService {
  constructor(private readonly client: SupabaseClient = createServiceRoleSupabaseClient()) {}

  async getPlaces(): Promise<AdminPlaceListItem[]> {
    const [placeResult, eventCounts] = await Promise.all([
      this.client
        .from("places")
        .select(adminPlaceFields)
        .order("updated_at", { ascending: false }),
      this.getLinkedEventCounts(),
    ]);
    if (placeResult.error) throw new AdminPlaceError("Could not load Places.");
    return ((placeResult.data ?? []) as AdminPlaceRow[]).map((place) => ({
      ...place,
      linkedEventCount: eventCounts.get(place.id) ?? 0,
    }));
  }

  async getPlace(id: string): Promise<AdminPlaceRow | null> {
    const { data, error } = await this.client
      .from("places")
      .select(adminPlaceFields)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new AdminPlaceError("Could not load the Place.");
    return data as AdminPlaceRow | null;
  }

  async getOptions(): Promise<PlaceOption[]> {
    const { data, error } = await this.client
      .from("places")
      .select("id,name,place_type,publication_status")
      .order("name", { ascending: true });
    if (error) throw new AdminPlaceError("Could not load Place options.");
    return (data ?? []) as PlaceOption[];
  }

  async getMatchOptions(): Promise<PlaceMatchOption[]> {
    const { data, error } = await this.client
      .from("places")
      .select("id,name,address,place_type,publication_status")
      .order("name", { ascending: true });
    if (error) throw new AdminPlaceError("Could not load Place matching options.");
    return (data ?? []) as PlaceMatchOption[];
  }

  async save(
    id: string | null,
    actorId: string,
    input: PlaceInput,
    now = new Date().toISOString(),
  ): Promise<AdminPlaceRow> {
    const existing = id ? await this.getPlace(id) : null;
    if (id && !existing) throw new AdminPlaceError("Place was not found.");

    const values = {
      name: input.name,
      slug: input.slug,
      place_type: input.placeType,
      summary: input.summary,
      description: input.description,
      address: input.address,
      neighborhood: input.neighborhood,
      latitude: input.latitude,
      longitude: input.longitude,
      google_maps_url: input.googleMapsUrl,
      phone: input.phone,
      whatsapp: input.whatsapp,
      website_url: input.websiteUrl,
      instagram_url: input.instagramUrl,
      source_url: input.sourceUrl,
      last_verified_at: input.lastVerifiedAt,
      source_language: input.sourceLanguage,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      ...placePublicationFields(input.publicationStatus, existing?.published_at ?? null, now),
    };

    const query = id
      ? this.client.from("places").update(values).eq("id", id)
      : this.client.from("places").insert({ ...values, created_by: actorId });
    const { data, error } = await query.select(adminPlaceFields).single();
    if (error || !data) {
      const duplicateSlug = error?.code === "23505";
      throw new AdminPlaceError(
        duplicateSlug ? "That Place slug is already in use." : "Could not save the Place.",
        { cause: error ?? undefined },
      );
    }
    return data as AdminPlaceRow;
  }

  private async getLinkedEventCounts(): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    for (let from = 0; ; from += LINK_COUNT_PAGE_SIZE) {
      const { data, error } = await this.client
        .from("events")
        .select("place_id")
        .not("place_id", "is", null)
        .range(from, from + LINK_COUNT_PAGE_SIZE - 1);
      if (error) throw new AdminPlaceError("Could not load Place Event counts.");
      const page = (data ?? []) as Array<{ place_id: string | null }>;
      for (const event of page) {
        if (event.place_id) counts.set(event.place_id, (counts.get(event.place_id) ?? 0) + 1);
      }
      if (page.length < LINK_COUNT_PAGE_SIZE) break;
    }
    return counts;
  }
}
