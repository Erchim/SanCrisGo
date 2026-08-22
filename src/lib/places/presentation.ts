import type { Metadata } from "next";
import type { PublicPlace } from "@/lib/places/public-places";
import { getAbsoluteUrl } from "@/lib/site-url";

export function placePath(slug: string): string {
  return `/places/${encodeURIComponent(slug)}`;
}

export function linkedPlacePath(
  place: { slug: string } | null | undefined,
): string | null {
  return place ? placePath(place.slug) : null;
}

export function formatPlaceType(value: string): string {
  return value.replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase());
}

export function buildPlaceMetadata(place: PublicPlace): Metadata {
  const title = place.seo_title ?? place.name;
  const description = place.seo_description
    ?? place.summary
    ?? place.description
    ?? `${place.name} in San Cristóbal de las Casas.`;
  const canonical = getAbsoluteUrl(placePath(place.slug));
  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      type: "website",
      title,
      description,
      ...(canonical && { url: canonical }),
    },
  };
}

export function placeSitemapPaths(
  places: Array<Pick<PublicPlace, "slug">>,
): string[] {
  return places.map((place) => placePath(place.slug));
}
