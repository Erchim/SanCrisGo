import Link from "next/link";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { savePlace } from "@/app/admin/places/actions";
import {
  PLACE_TYPES,
  slugifyPlace,
  type AdminPlaceRow,
} from "@/lib/places/admin-places";
import type {
  PossiblePlaceMatch,
  VenuePlacePrefill,
} from "@/lib/places/venue-workflow";

function dateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function placeTypeLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function PlaceForm({
  place,
  status,
  error,
  venueContext,
  adminDisplayName,
}: {
  place: AdminPlaceRow | null;
  status?: string;
  error?: string;
  venueContext?: {
    groupKey: string;
    eventIds: string[];
    prefill: VenuePlacePrefill;
    matches: PossiblePlaceMatch[];
  };
  adminDisplayName?: string | null;
}) {
  const prefill = venueContext?.prefill;
  return (
    <article className="admin-page admin-editor">
      <AdminNav current={venueContext ? "venues" : "places"} displayName={adminDisplayName} />
      <Link className="back-link" href={venueContext ? "/admin/places/venues" : "/admin/places"}>
        ← {venueContext ? "Unlinked venues" : "Places"}
      </Link>
      <header className="admin-editor-heading">
        <div>
          <p className="eyebrow">Structured local information</p>
          <h1>{place ? place.name : "New Place"}</h1>
        </div>
        {place?.publication_status === "published" && (
          <Link href={`/places/${place.slug}`} target="_blank">View public page ↗</Link>
        )}
      </header>

      {status === "saved" && <p className="admin-success">Place saved.</p>}
      {error && <p className="admin-alert" role="alert">{error}</p>}

      {venueContext && (
        <section className="admin-venue-prefill" aria-labelledby="venue-prefill-heading">
          <div>
            <p className="eyebrow">Safe Event-data prefill</p>
            <h2 id="venue-prefill-heading">Create and link {venueContext.eventIds.length} selected Event{venueContext.eventIds.length === 1 ? "" : "s"}</h2>
            <p>Name, address and unambiguous source facts are prefilled. Complete and verify the Place before publishing it separately.</p>
          </div>
          {venueContext.matches.length > 0 && (
            <aside className="admin-possible-matches">
              <strong>Possible existing Place</strong>
              <ul>
                {venueContext.matches.map((match) => (
                  <li key={match.id}>
                    <Link href={`/admin/places/${match.id}`}>{match.name}</Link>
                    <span>{match.place_type} · exact {match.signals.join(" + ")}</span>
                  </li>
                ))}
              </ul>
              <small>If one is the same Place, return to the venue workspace and link it instead.</small>
            </aside>
          )}
        </section>
      )}

      <form action={savePlace} className="admin-form admin-place-form">
        {place && <input name="place_id" type="hidden" value={place.id} />}
        {venueContext && (
          <>
            <input name="venue_group_key" type="hidden" value={venueContext.groupKey} />
            {venueContext.eventIds.map((eventId) => (
              <input key={eventId} name="selected_event_id" type="hidden" value={eventId} />
            ))}
          </>
        )}

        <fieldset>
          <legend>Identity and publication</legend>
          <label className="admin-field-wide">
            Name
            <input name="name" defaultValue={place?.name ?? prefill?.name ?? ""} required />
          </label>
          <label>
            Place type
            <select name="place_type" defaultValue={place?.place_type ?? ""} required>
              {!place && <option value="" disabled>Choose Place type</option>}
              {PLACE_TYPES.map((type) => (
                <option key={type} value={type}>{placeTypeLabel(type)}</option>
              ))}
            </select>
          </label>
          {venueContext ? (
            <label>
              Publication status
              <input name="publication_status" type="hidden" value="draft" />
              <span className="admin-static-field">Draft · review before publishing</span>
            </label>
          ) : (
            <label>
              Publication status
              <select name="publication_status" defaultValue={place?.publication_status ?? "draft"}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <small>Publishing requires useful content and location context.</small>
            </label>
          )}
          <label className="admin-field-wide">
            URL slug
            <input
              name="slug"
              defaultValue={place?.slug ?? (prefill ? slugifyPlace(prefill.name) : "")}
              placeholder="Generated from the name"
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Public content</legend>
          <label className="admin-field-wide">
            Summary
            <textarea name="summary" rows={3} defaultValue={place?.summary ?? ""} />
          </label>
          <label className="admin-field-wide">
            Description
            <textarea name="description" rows={10} defaultValue={place?.description ?? ""} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Location</legend>
          <label>
            Address
            <input name="address" defaultValue={place?.address ?? prefill?.address ?? ""} />
          </label>
          <label>
            Neighborhood
            <input name="neighborhood" defaultValue={place?.neighborhood ?? ""} />
          </label>
          <label>
            Latitude
            <input name="latitude" type="number" step="any" defaultValue={place?.latitude ?? ""} />
          </label>
          <label>
            Longitude
            <input name="longitude" type="number" step="any" defaultValue={place?.longitude ?? ""} />
          </label>
          <label className="admin-field-wide">
            Google Maps URL
            <input name="google_maps_url" type="url" defaultValue={place?.google_maps_url ?? ""} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Contact and official links</legend>
          <label>
            Phone
            <input name="phone" inputMode="tel" defaultValue={place?.phone ?? ""} />
          </label>
          <label>
            WhatsApp
            <input name="whatsapp" inputMode="tel" defaultValue={place?.whatsapp ?? ""} />
          </label>
          <label>
            Website
            <input name="website_url" type="url" defaultValue={place?.website_url ?? ""} />
          </label>
          <label>
            Instagram
            <input name="instagram_url" type="url" defaultValue={place?.instagram_url ?? ""} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Verification and SEO</legend>
          <label>
            Source URL
            <input name="source_url" type="url" defaultValue={place?.source_url ?? prefill?.sourceUrl ?? ""} />
          </label>
          <label>
            Last verified
            <input name="last_verified_at" type="date" defaultValue={dateInput(place?.last_verified_at)} />
          </label>
          <label>
            Source language
            <select
              name="source_language"
              defaultValue={place?.source_language ?? prefill?.sourceLanguage ?? (venueContext ? "" : "en")}
              required
            >
              {venueContext && !prefill?.sourceLanguage && <option value="" disabled>Choose source language</option>}
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </label>
          <label className="admin-field-wide">
            SEO title
            <input name="seo_title" defaultValue={place?.seo_title ?? ""} />
          </label>
          <label className="admin-field-wide">
            SEO description
            <textarea name="seo_description" rows={3} defaultValue={place?.seo_description ?? ""} />
          </label>
        </fieldset>

        <div className="admin-publish-actions">
          <button type="submit">
            {venueContext ? "Create draft and link Events" : "Save Place"}
          </button>
        </div>
      </form>
    </article>
  );
}
