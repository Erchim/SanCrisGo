import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/admin/login/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPlacesService } from "@/lib/places/admin-places";

export const metadata: Metadata = {
  title: "Places admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type PlaceFilter = "all" | "draft" | "published" | "archived";
type Props = { searchParams: Promise<{ status?: string | string[] }> };

const placeFilters: Array<{ value: PlaceFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function activeFilter(value: string | string[] | undefined): PlaceFilter {
  const status = typeof value === "string" ? value : "all";
  return placeFilters.some((filter) => filter.value === status) ? status as PlaceFilter : "all";
}

export default async function AdminPlacesPage({ searchParams }: Props) {
  const admin = await requireAdmin();
  const [places, params] = await Promise.all([
    new AdminPlacesService().getPlaces(),
    searchParams,
  ]);
  const filter = activeFilter(params.status);
  const visiblePlaces = filter === "all"
    ? places
    : places.filter((place) => place.publication_status === filter);
  const counts = Object.fromEntries(placeFilters.map(({ value }) => [
    value,
    value === "all" ? places.length : places.filter((place) => place.publication_status === value).length,
  ])) as Record<PlaceFilter, number>;

  return (
    <section className="admin-page admin-queue">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Structured local information</p>
          <h1>Places</h1>
          <p className="lede">Maintain verified locations used by public pages and Events.</p>
        </div>
        <div className="admin-heading-actions">
          <Link className="admin-secondary-link" href="/admin/events">Event queue</Link>
          <Link className="admin-secondary-link" href="/admin/places/venues">Unlinked venues</Link>
          <Link className="primary-link" href="/admin/places/new">New Place</Link>
          <form action={signOut}>
            <button className="admin-secondary-button" type="submit">
              Sign out{admin.displayName ? ` · ${admin.displayName}` : ""}
            </button>
          </form>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Place publication status">
        {placeFilters.map((item) => (
          <Link
            key={item.value}
            href={item.value === "all" ? "/admin/places" : `/admin/places?status=${item.value}`}
            aria-current={filter === item.value ? "page" : undefined}
          >
            {item.label} <span>{counts[item.value]}</span>
          </Link>
        ))}
      </nav>

      {visiblePlaces.length === 0 ? (
        <div className="events-empty">
          <h2>{places.length === 0 ? "No Places yet" : `No ${filter} Places`}</h2>
          <p>
            {places.length === 0
              ? "Start with the unlinked venue workspace or create a verified Place manually."
              : "Choose another status filter."}
          </p>
        </div>
      ) : (
        <ul className="admin-place-list">
          {visiblePlaces.map((place) => (
            <li key={place.id}>
              <div>
                <p className="event-type">{place.place_type}</p>
                <h2><Link href={`/admin/places/${place.id}`}>{place.name}</Link></h2>
                <p>{place.address || place.neighborhood || "Location context not added yet"}</p>
                <p className="admin-place-metrics">
                  {place.linkedEventCount} linked Event{place.linkedEventCount === 1 ? "" : "s"}
                  {place.last_verified_at
                    ? ` · verified ${place.last_verified_at.slice(0, 10)}`
                    : " · not verified yet"}
                </p>
              </div>
              <div className="admin-place-status">
                <span>{place.publication_status}</span>
                <small>Updated {place.updated_at.slice(0, 10)}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
