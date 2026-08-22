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

export default async function AdminPlacesPage() {
  const admin = await requireAdmin();
  const places = await new AdminPlacesService().getPlaces();

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
          <Link className="primary-link" href="/admin/places/new">New Place</Link>
          <form action={signOut}>
            <button className="admin-secondary-button" type="submit">
              Sign out{admin.displayName ? ` · ${admin.displayName}` : ""}
            </button>
          </form>
        </div>
      </header>

      {places.length === 0 ? (
        <div className="events-empty">
          <h2>No Places yet</h2>
          <p>Create only verified Places that are ready to maintain.</p>
        </div>
      ) : (
        <ul className="admin-place-list">
          {places.map((place) => (
            <li key={place.id}>
              <div>
                <p className="event-type">{place.place_type}</p>
                <h2><Link href={`/admin/places/${place.id}`}>{place.name}</Link></h2>
                <p>{place.address || place.neighborhood || "Location context not added yet"}</p>
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
