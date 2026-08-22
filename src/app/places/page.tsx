import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPlaces } from "@/lib/places/public-places";
import { formatPlaceType, placePath } from "@/lib/places/presentation";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const places = await getPublishedPlaces();
  const canonical = getAbsoluteUrl("/places");
  return {
    title: "Places in San Cristóbal de las Casas",
    description: "Verified places and practical local information for San Cristóbal de las Casas.",
    ...(canonical && { alternates: { canonical } }),
    ...(!places.length && { robots: { index: false, follow: true } }),
  };
}

export default async function PlacesPage() {
  const places = await getPublishedPlaces();
  return (
    <section className="places-index">
      <header className="page-heading">
        <p className="eyebrow">Explore San Cristóbal</p>
        <h1>Places</h1>
        <p className="lede">Verified locations with practical information for planning your visit.</p>
      </header>

      {places.length === 0 ? (
        <div className="places-empty">
          <h2>Place pages are being prepared</h2>
          <p>We publish a Place only after its core information has been checked.</p>
          <p><Link href="/contribute">Know a place we should add?</Link></p>
        </div>
      ) : (
        <ul className="place-list">
          {places.map((place) => (
            <li key={place.id} className="place-card">
              <article>
                <p className="event-type">{formatPlaceType(place.place_type)}</p>
                <h2><Link href={placePath(place.slug)}>{place.name}</Link></h2>
                {place.summary && <p>{place.summary}</p>}
                {(place.address || place.neighborhood) && (
                  <p className="place-card-location">
                    {[place.neighborhood, place.address].filter(Boolean).join(" · ")}
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
      {places.length > 0 && (
        <aside className="places-contribution-cta">
          <p>Know a place we should add?</p>
          <Link href="/contribute">Suggest a Place →</Link>
        </aside>
      )}
    </section>
  );
}
